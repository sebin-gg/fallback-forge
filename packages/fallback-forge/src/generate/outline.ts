import type { Block, EssentialAction, GenerateFlag, InspectedPage, Outline } from '../types.js';

const MAX_PARAGRAPH = 600;

interface Keep {
  blocks: Block[];
  flags: GenerateFlag[];
  navSeen: boolean;
}

/**
 * Deterministic rules: keep everything semantic, drop decoration, collapse
 * duplicate navigation, truncate very long prose, and turn unsupported widgets
 * into an explicit note instead of silently removing them.
 */
export function buildOutline(
  page: InspectedPage,
  actions: EssentialAction[],
): { outline: Outline; flags: GenerateFlag[] } {
  const keep: Keep = { blocks: [], flags: [], navSeen: false };
  for (const block of page.blocks) keepBlock(keep, block, page.route);
  keep.flags.push(...checkTextActions(page.route, actions, keep.blocks));
  return {
    outline: { route: page.route, title: pageTitle(page), blocks: keep.blocks },
    flags: keep.flags,
  };
}

const KEEPERS: Partial<Record<Block['kind'], (keep: Keep, block: Block, route: string) => void>> = {
  nav: (keep, block) => {
    if (block.kind !== 'nav' || keep.navSeen || block.links.length === 0) return;
    keep.navSeen = true;
    keep.blocks.push(block);
  },
  image: () => {}, // decorative; alt text alone rarely carries a task
  widget: (keep, block, route) => {
    if (block.kind !== 'widget') return;
    keep.flags.push(widgetFlag(route, block));
    keep.blocks.push({ kind: 'paragraph', text: widgetNote(block) });
  },
  paragraph: (keep, block) => {
    if (block.kind === 'paragraph')
      keep.blocks.push({ kind: 'paragraph', text: truncate(block.text) });
  },
};

function keepBlock(keep: Keep, block: Block, route: string): void {
  const keeper = KEEPERS[block.kind];
  if (keeper) keeper(keep, block, route);
  else keep.blocks.push(block);
}

export function pageTitle(page: InspectedPage): string {
  const h1 = page.blocks.find((b) => b.kind === 'heading' && b.level === 1);
  const fromH1 = h1 && h1.kind === 'heading' ? h1.text : '';
  return fromH1 || page.title || page.route;
}

function truncate(text: string): string {
  return text.length <= MAX_PARAGRAPH ? text : `${text.slice(0, MAX_PARAGRAPH - 1).trimEnd()}…`;
}

function widgetNote(block: Extract<Block, { kind: 'widget' }>): string {
  const what = block.label ? `${block.tag} "${block.label}"` : block.tag;
  return `[Interactive ${what} is not available in the lightweight version.]`;
}

function widgetFlag(route: string, block: Extract<Block, { kind: 'widget' }>): GenerateFlag {
  const label = block.label ? ` "${block.label}"` : '';
  return {
    route,
    severity: 'warning',
    message: `<${block.tag}>${label} has no lightweight equivalent; replaced with a note.`,
  };
}

/** Every declared `text` action for this route must be present in the kept blocks. */
export function checkTextActions(
  route: string,
  actions: EssentialAction[],
  blocks: Block[],
): GenerateFlag[] {
  const haystack = blocksText(blocks).toLowerCase();
  return actions
    .filter((a) => a.type === 'text' && a.route === route && a.match)
    .filter((a) => !haystack.includes(a.match!.toLowerCase()))
    .map((a) => ({
      route,
      severity: 'error' as const,
      message: `Essential text "${a.match}" (action ${a.id}) was not found in the inspected content of ${route}.`,
    }));
}

const TEXT_OF: Record<Block['kind'], (b: Block) => string> = {
  heading: (b) => (b.kind === 'heading' ? b.text : ''),
  paragraph: (b) => (b.kind === 'paragraph' ? b.text : ''),
  list: (b) => (b.kind === 'list' ? b.items.map((i) => i.text).join('\n') : ''),
  definitions: (b) =>
    b.kind === 'definitions' ? b.items.map((i) => `${i.term} ${i.detail}`).join('\n') : '',
  table: (b) => (b.kind === 'table' ? b.rows.map((r) => r.join(' ')).join('\n') : ''),
  nav: (b) => (b.kind === 'nav' ? b.links.map((l) => l.text).join('\n') : ''),
  link: (b) => (b.kind === 'link' ? b.link.text : ''),
  form: (b) => (b.kind === 'form' ? b.form.fields.map((f) => f.label).join('\n') : ''),
  image: () => '',
  widget: () => '',
};

export function blocksText(blocks: Block[]): string {
  return blocks.map((b) => TEXT_OF[b.kind](b)).join('\n');
}
