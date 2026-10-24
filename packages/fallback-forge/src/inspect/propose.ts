import type { Endpoint, EssentialAction, FormField, InspectedPage } from '../types.js';

const KEY_TERMS = /deadline|closes|date|venue|when|where|time|location|fee|price|contact/i;

/** Propose essential actions from what inspect found. The developer reviews and edits them. */
export function proposeActions(pages: InspectedPage[], endpoints: Endpoint[]): EssentialAction[] {
  const out: EssentialAction[] = [];
  const postEndpoints = endpoints.filter((e) => e.method === 'POST');
  for (const page of pages) {
    out.push(...proposeText(page), ...proposeLinks(page), ...proposeForms(page, postEndpoints));
  }
  return dedupeIds(out);
}

function proposeText(page: InspectedPage): EssentialAction[] {
  const out: EssentialAction[] = [];
  const h1 = page.blocks.find((b) => b.kind === 'heading' && b.level === 1);
  if (h1 && h1.kind === 'heading') {
    out.push({
      id: `${slug(page.route)}-heading`,
      description: `Page heading visible on ${page.route}`,
      route: page.route,
      type: 'text',
      match: h1.text,
    });
  }
  for (const block of page.blocks) {
    if (block.kind !== 'definitions') continue;
    for (const item of block.items) {
      if (!KEY_TERMS.test(item.term)) continue;
      out.push({
        id: `${slug(page.route)}-${slug(item.term)}`,
        description: `"${item.term}" is readable on ${page.route}`,
        route: page.route,
        type: 'text',
        match: item.detail,
      });
    }
  }
  return out;
}

function proposeLinks(page: InspectedPage): EssentialAction[] {
  const nav = page.blocks.find((b) => b.kind === 'nav');
  if (!nav || nav.kind !== 'nav') return [];
  return nav.links
    .filter((l) => l.internal && l.href !== page.route)
    .map((l) => ({
      id: `${slug(page.route)}-nav-${slug(l.href)}`,
      description: `Navigate from ${page.route} to "${l.text}"`,
      route: page.route,
      type: 'link' as const,
      href: l.href,
    }));
}

function proposeForms(page: InspectedPage, postEndpoints: Endpoint[]): EssentialAction[] {
  return page.forms.map((form, i) => {
    const endpoint =
      form.action ?? (postEndpoints.length === 1 ? postEndpoints[0]!.url : undefined);
    return {
      id: `${slug(page.route)}-form${page.forms.length > 1 ? `-${i + 1}` : ''}`,
      description: `Submit the "${form.submitText}" form on ${page.route}`,
      route: page.route,
      type: 'form' as const,
      endpoint: endpoint ?? 'TODO: set the API endpoint this form posts to',
      method: form.method === 'GET' && !form.action ? 'POST' : (form.method as 'POST' | 'GET'),
      fields: Object.fromEntries(form.fields.map((f) => [f.name, sampleValue(f)])),
      success: 'TODO: text shown after a successful submission',
    };
  });
}

const SAMPLE_BY_TYPE: Record<string, string> = {
  email: 'test@example.com',
  tel: '+911234567890',
  number: '1',
  url: 'https://example.com',
  date: '2026-10-10',
  checkbox: 'on',
  textarea: 'Test message from Fallback Forge verify.',
};

/** Sample value `verify` will type into a field. */
export function sampleValue(field: FormField): string {
  if (field.options?.length) return field.options.find((o) => o.value)?.value ?? '';
  const byType = SAMPLE_BY_TYPE[field.type];
  if (byType) return byType;
  return /name/i.test(field.name) ? 'Test User' : 'test';
}

export function slug(s: string): string {
  const v = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return v || 'home';
}

function dedupeIds(actions: EssentialAction[]): EssentialAction[] {
  const counts = new Map<string, number>();
  return actions.map((a) => {
    const n = (counts.get(a.id) ?? 0) + 1;
    counts.set(a.id, n);
    return n === 1 ? a : { ...a, id: `${a.id}-${n}` };
  });
}
