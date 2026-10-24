import { chromium, type Page } from 'playwright';
import type { Inspection, InspectedPage, ResolvedConfig } from '../types.js';
import { startDevServer } from '../server.js';
import { inspectFile, writeJson } from '../paths.js';
import { scanSource } from './source-scan.js';
import { extractPage } from './extract.js';
import { proposeActions } from './propose.js';
import { normalizeRoute } from '../config.js';

export interface InspectOptions {
  /** Use a running server instead of starting the dev server. */
  baseUrl?: string;
  log?: (line: string) => void;
}

export async function inspect(cfg: ResolvedConfig, opts: InspectOptions = {}): Promise<Inspection> {
  const log = opts.log ?? (() => {});
  const scan = await scanSource(cfg.root);
  log(
    `Scanned ${scan.files} source files: ${scan.routes.length} routes, ${scan.endpoints.length} endpoints.`,
  );

  const routes = mergeRoutes(cfg.routes, scan.routes);
  if (routes.length === 0) throw new Error('No routes found. Set `routes` in the config.');

  const server = opts.baseUrl ? null : await startDevServer(cfg);
  const baseUrl = opts.baseUrl ?? server!.baseUrl;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const pages: InspectedPage[] = [];
    for (const route of routes) {
      log(`Inspecting ${route}`);
      pages.push(await inspectRoute(page, baseUrl, route));
    }
    const inspection: Inspection = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      routes,
      endpoints: scan.endpoints,
      pages,
      proposedActions: proposeActions(pages, scan.endpoints),
    };
    await writeJson(inspectFile(cfg), inspection);
    log(`Wrote ${inspectFile(cfg)}`);
    return inspection;
  } finally {
    await browser.close();
    await server?.close();
  }
}

async function inspectRoute(page: Page, baseUrl: string, route: string): Promise<InspectedPage> {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  // Give animation libraries a beat to reveal content that enters on mount.
  await page.waitForTimeout(500);
  return page.evaluate(extractPage, route);
}

function mergeRoutes(configured: string[], scanned: string[]): string[] {
  const all = [...configured, ...scanned].map(normalizeRoute);
  return [...new Set(all)].sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)));
}
