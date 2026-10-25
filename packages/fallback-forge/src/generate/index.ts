import { rm } from 'node:fs/promises';
import path from 'node:path';
import type {
  EssentialAction,
  GenerateFlag,
  GenerateResult,
  Inspection,
  InspectedPage,
  Outline,
  ResolvedConfig,
} from '../types.js';
import {
  generateFile,
  inspectFile,
  liteDir,
  liteFileForRoute,
  readJson,
  writeJson,
  writeText,
} from '../paths.js';
import { buildOutline } from './outline.js';
import { renderPage, type RenderContext } from './render.js';
import { condenseWithAi } from './ai.js';

export interface GenerateOptions {
  log?: (line: string) => void;
}

interface Progress {
  pages: GenerateResult['pages'];
  flags: GenerateFlag[];
  aiUsed: boolean;
  aiNotes: string[];
}

export async function generate(
  cfg: ResolvedConfig,
  opts: GenerateOptions = {},
): Promise<GenerateResult> {
  const log = opts.log ?? (() => {});
  const inspection = await loadInspection(cfg);
  const routes = inspection.pages.map((p) => p.route);
  const ctx: RenderContext = {
    siteName: cfg.siteName,
    companionBase: cfg.companionBase,
    routes,
    actions: cfg.essentialActions,
    queryParam: cfg.detection.queryParam,
  };

  await rm(liteDir(cfg), { recursive: true, force: true });
  const progress: Progress = {
    pages: [],
    flags: [
      ...checkActionRoutes(cfg.essentialActions, routes),
      ...checkLinkActions(cfg.essentialActions, inspection),
    ],
    aiUsed: false,
    aiNotes: [],
  };
  for (const page of inspection.pages) {
    const outline = await outlineFor(page, cfg, progress);
    const rendered = renderPage(outline, ctx);
    progress.flags.push(...rendered.flags);
    const file = liteFileForRoute(cfg, page.route);
    await writeText(file, rendered.html);
    const bytes = Buffer.byteLength(rendered.html, 'utf8');
    progress.pages.push({ route: page.route, file: path.relative(cfg.root, file), bytes });
    log(`${page.route} → ${path.relative(cfg.root, file)} (${bytes} bytes)`);
  }

  const result: GenerateResult = {
    generatedAt: new Date().toISOString(),
    aiUsed: progress.aiUsed,
    aiNote: aiNote(cfg, progress),
    pages: progress.pages,
    flags: progress.flags,
  };
  await writeJson(generateFile(cfg), result);
  for (const f of progress.flags) log(`${f.severity.toUpperCase()} ${f.route}: ${f.message}`);
  return result;
}

async function loadInspection(cfg: ResolvedConfig): Promise<Inspection> {
  return readJson<Inspection>(inspectFile(cfg)).catch(() => {
    throw new Error(`Missing ${inspectFile(cfg)}. Run \`fallback-forge inspect\` first.`);
  });
}

async function outlineFor(
  page: InspectedPage,
  cfg: ResolvedConfig,
  progress: Progress,
): Promise<Outline> {
  const built = buildOutline(page, cfg.essentialActions);
  progress.flags.push(...built.flags);
  if (!cfg.ai.enabled) return built.outline;
  const ai = await condenseWithAi(built.outline, cfg.essentialActions, cfg);
  progress.aiUsed ||= ai.used;
  if (ai.note) progress.aiNotes.push(`${page.route}: ${ai.note}`);
  return ai.outline;
}

function aiNote(cfg: ResolvedConfig, progress: Progress): string {
  if (!cfg.ai.enabled) return 'AI disabled (no API key); deterministic rules only.';
  return progress.aiNotes.length
    ? progress.aiNotes.join(' | ')
    : `AI outline applied (${cfg.ai.model}).`;
}

/** Actions pointing at routes that were never inspected can never be preserved. */
function checkActionRoutes(actions: EssentialAction[], routes: string[]): GenerateFlag[] {
  return actions
    .filter((a) => !routes.includes(a.route))
    .map((a) => ({
      route: a.route,
      severity: 'error' as const,
      message: `Action ${a.id} targets ${a.route}, which was not inspected. Add it to \`routes\` or fix the action.`,
    }));
}

/** `link` actions must exist on the inspected page; otherwise the companion would be inventing navigation. */
function checkLinkActions(actions: EssentialAction[], inspection: Inspection): GenerateFlag[] {
  return actions
    .filter((a) => a.type === 'link' && a.href)
    .filter((a) => {
      const page = inspection.pages.find((p) => p.route === a.route);
      return page !== undefined && !page.links.some((l) => l.href === a.href);
    })
    .map((a) => ({
      route: a.route,
      severity: 'error' as const,
      message: `Link action ${a.id} expects href "${a.href}" on ${a.route}, but inspect found no such link.`,
    }));
}
