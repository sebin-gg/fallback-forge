import type { BrowserContext, Page } from 'playwright';

/** Every unique same-origin link on the page must answer with a non-error status. */
export async function checkLinks(
  page: Page,
  context: BrowserContext,
  base: string,
): Promise<string[]> {
  const hrefs = await page.$$eval('a[href]', (anchors) =>
    anchors
      .map((a) => a.getAttribute('href') ?? '')
      .filter((h) => h.startsWith('/') && !h.startsWith('//')),
  );
  const unique = [...new Set(hrefs.map((h) => h.split('#')[0]!))].filter(Boolean);
  const broken: string[] = [];
  for (const href of unique) {
    const ok = await context.request
      .get(`${base}${href}`, { maxRedirects: 3, timeout: 30_000 })
      .then((r) => r.status() < 400)
      .catch(() => false);
    if (!ok) broken.push(href);
  }
  return broken;
}
