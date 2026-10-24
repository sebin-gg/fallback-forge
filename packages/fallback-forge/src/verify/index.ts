import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type {
  ActionResult,
  DetectionResult,
  EssentialAction,
  GenerateResult,
  NetworkProfile,
  PageMetrics,
  ProfileResult,
  ResolvedConfig,
  VerifyReport,
  VersionResult,
} from '../types.js';
import { buildAndPreview, type RunningServer } from '../server.js';
import { companionPath } from '../config.js';
import { generateFile, readJson } from '../paths.js';
import { checkLinks } from './links.js';
import { runAction } from './actions.js';
import { summarize } from './summary.js';

export interface VerifyOptions {
  baseUrl?: string;
  log?: (line: string) => void;
}

type Version = 'full' | 'lite';

async function resolveServerAndBase(
  cfg: ResolvedConfig,
  opts: VerifyOptions,
): Promise<{ base: string; server: RunningServer | null }> {
  const baseUrl = opts.baseUrl ?? cfg.verify.baseUrl;
  if (baseUrl) return { base: baseUrl, server: null };
  const server = await buildAndPreview(cfg);
  return { base: server.baseUrl, server };
}

async function runProfiles(
  browser: Browser,
  cfg: ResolvedConfig,
  base: string,
  routes: string[],
  log: (msg: string) => void,
): Promise<ProfileResult[]> {
  const profiles: ProfileResult[] = [];
  for (const profile of cfg.verify.profiles) {
    log(
      `Profile ${profile.name}: ${profile.downloadKbps} kbps down, ${profile.latencyMs} ms latency`,
    );
    const full = await runVersion(browser, cfg, base, routes, profile, 'full', log);
    const lite = await runVersion(browser, cfg, base, routes, profile, 'lite', log);
    profiles.push({ profile, full, lite });
  }
  return profiles;
}

export async function verify(cfg: ResolvedConfig, opts: VerifyOptions = {}): Promise<VerifyReport> {
  const log = opts.log ?? (() => {});
  const gen = await readJson<GenerateResult>(generateFile(cfg)).catch(() => {
    throw new Error(`Missing ${generateFile(cfg)}. Run \`fallback-forge generate\` first.`);
  });
  const routes = gen.pages.map((p) => p.route);
  const { base, server } = await resolveServerAndBase(cfg, opts);
  log(`Verifying against ${base}`);

  const browser = await chromium.launch();
  try {
    const profiles = await runProfiles(browser, cfg, base, routes, log);
    const detection = cfg.verify.checkDetection
      ? await checkDetection(browser, cfg, base, slowest(cfg.verify.profiles), log)
      : undefined;
    const report: VerifyReport = {
      generatedAt: new Date().toISOString(),
      baseUrl: base,
      profiles,
      ...(detection ? { detection } : {}),
      generateFlags: gen.flags,
      summary: summarize(profiles, detection, gen.flags),
    };
    return report;
  } finally {
    await browser.close();
    await server?.close();
  }
}

function urlFor(cfg: ResolvedConfig, base: string, route: string, version: Version): string {
  return version === 'full'
    ? `${base}${route}?${cfg.detection.queryParam}=0`
    : `${base}${companionPath(cfg.companionBase, route)}`;
}

async function runVersion(
  browser: Browser,
  cfg: ResolvedConfig,
  base: string,
  routes: string[],
  profile: NetworkProfile,
  version: Version,
  log: (line: string) => void,
): Promise<VersionResult> {
  const context = await browser.newContext();
  try {
    const pages: Record<string, PageMetrics> = {};
    for (const route of routes) {
      pages[route] = await measurePage(
        context,
        cfg,
        urlFor(cfg, base, route, version),
        profile,
        base,
      );
      log(
        `  ${version.padEnd(4)} ${route.padEnd(12)} ${pages[route]!.loadMs} ms, ${pages[route]!.bytes} bytes`,
      );
    }
    const actions: ActionResult[] = [];
    for (const action of cfg.essentialActions) {
      actions.push(
        await runThrottled(context, profile, (page) =>
          runAction(page, action, actionTarget(cfg, base, action, version), cfg),
        ),
      );
      log(
        `  ${version.padEnd(4)} action ${action.id}: ${actions.at(-1)!.passed ? 'pass' : 'FAIL'}`,
      );
    }
    return { pages, actions };
  } finally {
    await context.close();
  }
}

function actionTarget(
  cfg: ResolvedConfig,
  base: string,
  action: EssentialAction,
  version: Version,
): { url: string; version: Version } {
  return { url: urlFor(cfg, base, action.route, version), version };
}

async function throttle(
  context: BrowserContext,
  page: Page,
  profile: NetworkProfile,
  disableCache = false,
): Promise<void> {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  if (disableCache) {
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  }
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: profile.latencyMs,
    downloadThroughput: (profile.downloadKbps * 1024) / 8,
    uploadThroughput: (profile.uploadKbps * 1024) / 8,
  });
}

async function runThrottled<T>(
  context: BrowserContext,
  profile: NetworkProfile,
  fn: (page: Page) => Promise<T>,
  disableCache = false,
): Promise<T> {
  const page = await context.newPage();
  try {
    await throttle(context, page, profile, disableCache);
    return await fn(page);
  } finally {
    await page.close();
  }
}

async function measurePage(
  context: BrowserContext,
  cfg: ResolvedConfig,
  url: string,
  profile: NetworkProfile,
  base: string,
): Promise<PageMetrics> {
  return runThrottled(
    context,
    profile,
    async (page) => {
      let bytes = 0;
      let requests = 0;
      const consoleErrors: string[] = [];
      const pending: Promise<void>[] = [];
      page.on('requestfinished', (req) => {
        requests += 1;
        pending.push(
          req
            .sizes()
            .then((s) => {
              bytes += s.responseBodySize + s.responseHeadersSize;
            })
            .catch(() => {}),
        );
      });
      page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
      page.on('pageerror', (e) => consoleErrors.push(e.message));

      const started = Date.now();
      const response = await page.goto(url, { waitUntil: 'load', timeout: cfg.verify.timeoutMs });
      await page.waitForLoadState('networkidle', { timeout: cfg.verify.timeoutMs }).catch(() => {});
      const loadMs = Date.now() - started;
      await Promise.all(pending);
      const brokenLinks = await checkLinks(page, context, base);
      return {
        url,
        status: response?.status() ?? null,
        loadMs,
        bytes,
        requests,
        consoleErrors,
        brokenLinks,
      };
    },
    true,
  );
}

function slowest(profiles: NetworkProfile[]): NetworkProfile {
  return [...profiles].sort((a, b) => a.downloadKbps - b.downloadKbps)[0]!;
}

/** Fresh context, no override: does `/` end up on the companion under the slowest profile? */
async function checkDetection(
  browser: Browser,
  cfg: ResolvedConfig,
  base: string,
  profile: NetworkProfile,
  log: (line: string) => void,
): Promise<DetectionResult> {
  const context = await browser.newContext();
  try {
    return await runThrottled(context, profile, async (page) => {
      const startUrl = `${base}/`;
      const started = Date.now();
      await page.goto(startUrl, { waitUntil: 'commit', timeout: cfg.verify.timeoutMs });
      const redirected = await page
        .waitForURL((u) => u.pathname.startsWith(cfg.companionBase), {
          timeout: cfg.detection.slowLoadMs + 30_000,
        })
        .then(() => true)
        .catch(() => false);
      const result = {
        profile: profile.name,
        startUrl,
        finalUrl: page.url(),
        redirected,
        elapsedMs: Date.now() - started,
      };
      log(
        `  detection under ${profile.name}: ${redirected ? 'switched to companion' : 'stayed on full site'} after ${result.elapsedMs} ms`,
      );
      return result;
    });
  } finally {
    await context.close();
  }
}
