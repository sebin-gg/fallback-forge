import type { Locator, Page } from 'playwright';
import type { ActionResult, EssentialAction, ResolvedConfig } from '../types.js';
import { companionPath, normalizeRoute } from '../config.js';

interface Target {
  url: string;
  version: 'full' | 'lite';
}

/** Perform one essential action on a page and report whether it still works. */
export async function runAction(
  page: Page,
  action: EssentialAction,
  target: Target,
  cfg: ResolvedConfig,
): Promise<ActionResult> {
  const base = { id: action.id, type: action.type, route: action.route };
  try {
    await page.goto(target.url, { waitUntil: 'load', timeout: cfg.verify.timeoutMs });
    await page.waitForLoadState('networkidle', { timeout: cfg.verify.timeoutMs }).catch(() => {});
    const detail = await perform(page, action, target, cfg);
    return { ...base, passed: true, detail };
  } catch (err) {
    return { ...base, passed: false, detail: firstLine((err as Error).message) };
  }
}

async function perform(
  page: Page,
  action: EssentialAction,
  target: Target,
  cfg: ResolvedConfig,
): Promise<string> {
  switch (action.type) {
    case 'text':
      return checkText(page, action.match!);
    case 'link':
      return checkLink(page, action.href!, target, cfg);
    case 'form':
      return submitForm(page, action, cfg);
  }
}

async function checkText(page: Page, match: string): Promise<string> {
  const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  if (!text.toLowerCase().includes(match.toLowerCase()))
    throw new Error(`Text "${match}" not visible on page`);
  return `found "${match}"`;
}

async function checkLink(
  page: Page,
  href: string,
  target: Target,
  cfg: ResolvedConfig,
): Promise<string> {
  const route = normalizeRoute(href.split(/[?#]/)[0]!);
  const accepted =
    target.version === 'lite' ? [href, companionPath(cfg.companionBase, route)] : [href];
  const selector = accepted.map((h) => `a[href="${h}"]`).join(', ');
  const anchor = page.locator(selector).first();
  if ((await anchor.count()) === 0) throw new Error(`No link to ${href} on page`);
  const resolved = await anchor.getAttribute('href');
  const response = await page
    .context()
    .request.get(new URL(resolved!, page.url()).toString(), { timeout: cfg.verify.timeoutMs });
  if (response.status() >= 400) throw new Error(`Link ${resolved} answered ${response.status()}`);
  return `link ${resolved} → ${response.status()}`;
}

async function submitForm(
  page: Page,
  action: EssentialAction,
  cfg: ResolvedConfig,
): Promise<string> {
  const form = page.locator('form').first();
  if ((await form.count()) === 0) throw new Error('No form on page');
  for (const [name, value] of Object.entries(action.fields ?? {})) {
    await fillField(form.locator(`[name="${name}"]`).first(), value);
  }
  const submit = form
    .locator('button[type="submit"], input[type="submit"], button:not([type])')
    .first();
  await submit.click({ timeout: cfg.verify.timeoutMs });
  await page
    .getByText(action.success!, { exact: false })
    .first()
    .waitFor({ state: 'visible', timeout: cfg.verify.timeoutMs });
  return `submitted; saw "${action.success}"`;
}

async function fillField(field: Locator, value: string): Promise<void> {
  if ((await field.count()) === 0) throw new Error(`Field ${await field.toString()} not found`);
  const tag = await field.evaluate((el) => el.tagName.toLowerCase());
  const type = await field.getAttribute('type');
  if (tag === 'select') return void (await field.selectOption(value));
  if (type === 'checkbox' || type === 'radio') return void (await field.check());
  await field.fill(value);
}

function firstLine(message: string): string {
  return message.split('\n')[0]!.trim();
}
