import { z } from 'zod';
import type { Block, EssentialAction, Outline, ResolvedConfig } from '../types.js';
import { blocksText, checkTextActions } from './outline.js';

const outlineSchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      heading: z.string().optional(),
      paragraphs: z.array(z.string()),
      bullets: z.array(z.string()).optional(),
    }),
  ),
});

type AiOutline = z.infer<typeof outlineSchema>;

const CONDENSABLE = new Set<Block['kind']>(['heading', 'paragraph', 'list', 'definitions']);

export interface AiCondenseResult {
  outline: Outline;
  used: boolean;
  note?: string;
}

/**
 * Ask the model for a condensed outline (JSON only), then rebuild the page:
 * AI text replaces prose blocks, while nav, forms, tables and standalone links
 * are kept verbatim from the deterministic outline (ADR-0003).
 */
export async function condenseWithAi(
  outline: Outline,
  actions: EssentialAction[],
  cfg: ResolvedConfig,
  call: (prompt: string) => Promise<AiOutline> = (p) => callModel(p, cfg),
): Promise<AiCondenseResult> {
  const prose = outline.blocks.filter((b) => CONDENSABLE.has(b.kind));
  if (prose.length === 0) return { outline, used: false, note: 'No prose to condense.' };

  let ai: AiOutline;
  try {
    ai = await call(buildPrompt(outline, prose));
  } catch (err) {
    return { outline, used: false, note: `AI call failed: ${(err as Error).message}` };
  }

  const merged = mergeOutline(outline, ai);
  const missing = checkTextActions(outline.route, actions, merged.blocks);
  if (missing.length > 0) {
    return {
      outline,
      used: false,
      note: `AI outline dropped essential text (${missing.map((f) => f.message).join('; ')}); kept deterministic version.`,
    };
  }
  if (blocksText(merged.blocks).length >= blocksText(outline.blocks).length) {
    return {
      outline,
      used: false,
      note: 'AI outline was not shorter; kept deterministic version.',
    };
  }
  return { outline: merged, used: true };
}

function buildPrompt(outline: Outline, prose: Block[]): string {
  return [
    'You condense a web page for people on very slow or unstable internet connections.',
    'Keep every essential fact: names, dates, deadlines, times, venues, prices, contact details, instructions, and calls to action.',
    'Remove marketing filler and repetition. Do not invent, guess, or add anything that is not in the content.',
    'Return JSON: a title and an ordered list of sections, each with an optional heading, paragraphs, and optional bullets.',
    '',
    `Page route: ${outline.route}`,
    `Page title: ${outline.title}`,
    'Content (JSON blocks, in order):',
    JSON.stringify(prose),
  ].join('\n');
}

function sectionToBlocks(s: AiOutline['sections'][number]): Block[] {
  const out: Block[] = [];
  if (s.heading) out.push({ kind: 'heading', level: 2, text: s.heading });
  for (const p of s.paragraphs) {
    const trimmed = p.trim();
    if (trimmed) out.push({ kind: 'paragraph', text: trimmed });
  }
  if (s.bullets?.length)
    out.push({ kind: 'list', ordered: false, items: s.bullets.map((text) => ({ text })) });
  return out;
}

function mergeOutline(base: Outline, ai: AiOutline): Outline {
  const structural = base.blocks.filter((b) => !CONDENSABLE.has(b.kind));
  const nav = structural.filter((b) => b.kind === 'nav');
  const rest = structural.filter((b) => b.kind !== 'nav');
  const title = ai.title || base.title;
  const aiBlocks: Block[] = [
    { kind: 'heading', level: 1, text: title },
    ...ai.sections.flatMap(sectionToBlocks),
  ];
  return { route: base.route, title, blocks: [...nav, ...aiBlocks, ...rest] };
}

async function callModel(prompt: string, cfg: ResolvedConfig): Promise<AiOutline> {
  const apiKey = process.env[cfg.ai.apiKeyEnv];
  if (!apiKey) throw new Error(`${cfg.ai.apiKeyEnv} is not set`);
  const [{ generateObject }, { createOpenAICompatible }] = await Promise.all([
    import('ai'),
    import('@ai-sdk/openai-compatible'),
  ]);
  const provider = createOpenAICompatible({
    name: 'fallback-forge',
    baseURL: cfg.ai.baseUrl,
    apiKey,
  });
  const { object } = await generateObject({
    model: provider.chatModel(cfg.ai.model),
    schema: outlineSchema,
    prompt,
  });
  return object;
}
