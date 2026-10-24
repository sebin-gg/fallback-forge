import type { Block, FormField, InspectedForm, InspectedPage, LinkItem } from '../types.js';

/**
 * Runs inside the browser via `page.evaluate`. It must stay self-contained:
 * no imports, no closures over module scope. It walks the rendered DOM in
 * document order and turns it into semantic blocks.
 */
export function extractPage(route: string): InspectedPage {
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'LINK', 'META']);
  const INLINE = new Set([
    'A',
    'SPAN',
    'STRONG',
    'EM',
    'B',
    'I',
    'U',
    'SMALL',
    'TIME',
    'BR',
    'CODE',
    'MARK',
    'SUB',
    'SUP',
    'ABBR',
    'LABEL',
    'BUTTON',
    'IMG',
    'SVG',
  ]);
  const WIDGET = new Set(['CANVAS', 'VIDEO', 'AUDIO', 'IFRAME', 'OBJECT', 'EMBED']);
  const SKIP_FIELD_TYPES = new Set(['hidden', 'submit', 'button']);
  const blocks: Block[] = [];
  const links: LinkItem[] = [];
  const forms: InspectedForm[] = [];
  const seenText = new Set<string>();

  const clean = (s: string | null | undefined): string => (s ?? '').replace(/\s+/g, ' ').trim();
  const attr = (el: Element, name: string): string => clean(el.getAttribute(name));

  const isHidden = (el: Element): boolean => {
    if (el.getAttribute('aria-hidden') === 'true' || (el as HTMLElement).hidden) return true;
    const style = el.ownerDocument.defaultView?.getComputedStyle(el);
    return !!style && (style.display === 'none' || style.visibility === 'hidden');
  };

  const toLink = (a: Element): LinkItem | null => {
    const href = a.getAttribute('href');
    const text = clean(a.textContent) || attr(a, 'aria-label');
    if (!href || !text || /^(#|javascript:)/.test(href)) return null;
    return { text, href, internal: href.startsWith('/') && !href.startsWith('//') };
  };

  const collectLinks = (el: Element): LinkItem[] =>
    [...el.querySelectorAll('a')].map(toLink).filter((l): l is LinkItem => l !== null);

  const labelFor = (field: Element, form: Element): string => {
    const id = field.getAttribute('id');
    const explicit = id ? form.querySelector(`label[for="${id}"]`) : null;
    const candidates = [
      clean(explicit?.textContent),
      clean(field.closest('label')?.textContent),
      attr(field, 'aria-label'),
      attr(field, 'placeholder'),
      attr(field, 'name'),
    ];
    return candidates.find(Boolean) ?? '';
  };

  const fieldType = (el: Element): string =>
    el.tagName === 'INPUT' ? el.getAttribute('type') || 'text' : el.tagName.toLowerCase();

  const toField = (el: Element, form: Element): FormField | null => {
    const name = el.getAttribute('name');
    const type = fieldType(el);
    if (!name || SKIP_FIELD_TYPES.has(type)) return null;
    const field: FormField = {
      name,
      type,
      label: labelFor(el, form),
      required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
    };
    const placeholder = attr(el, 'placeholder');
    if (placeholder) field.placeholder = placeholder;
    if (el.tagName === 'SELECT') {
      field.options = [...el.querySelectorAll('option')].map((o) => ({
        value: o.value,
        label: clean(o.textContent),
      }));
    }
    return field;
  };

  const uniqueFields = (form: Element): FormField[] => {
    const out: FormField[] = [];
    const seen = new Set<string>();
    for (const el of form.querySelectorAll('input, select, textarea')) {
      const f = toField(el, form);
      if (f && !seen.has(f.name)) {
        seen.add(f.name);
        out.push(f);
      }
    }
    return out;
  };

  const submitTextFor = (form: Element): string => {
    const btn = form.querySelector(
      'button[type="submit"], input[type="submit"], button:not([type])',
    );
    if (!btn) return 'Submit';
    return clean(btn.textContent) || clean(btn.getAttribute('value')) || 'Submit';
  };

  const idFor = (el: Element): string =>
    attr(el, 'id') || attr(el, 'name') || attr(el, 'aria-label');

  const toForm = (form: Element): InspectedForm => {
    const rawMethod = form.getAttribute('method');
    const result: InspectedForm = {
      method: (rawMethod || 'GET').toUpperCase(),
      fields: uniqueFields(form),
      submitText: submitTextFor(form),
    };
    const id = idFor(form);
    if (id) result.id = id;
    const action = form.getAttribute('action');
    if (action) result.action = action;
    return result;
  };

  const pushParagraph = (text: string): void => {
    if (!text || seenText.has(text)) return;
    seenText.add(text);
    blocks.push({ kind: 'paragraph', text });
  };

  const isTextLeaf = (el: Element): boolean =>
    el.children.length <= 3 &&
    [...el.children].every((c) => INLINE.has(c.tagName)) &&
    clean(el.textContent).length > 0;

  const handleHeading = (el: Element): void => {
    const text = clean(el.textContent);
    if (text) blocks.push({ kind: 'heading', level: Number(el.tagName[1]), text });
  };

  const handleList = (el: Element): void => {
    const items = [...el.querySelectorAll(':scope > li')].map((li) => {
      const a = li.querySelector('a');
      const link = a ? toLink(a) : null;
      const text = clean(li.textContent);
      return link && text === link.text ? { text, href: link.href } : { text };
    });
    if (items.length) blocks.push({ kind: 'list', ordered: el.tagName === 'OL', items });
  };

  const handleDefinitions = (el: Element): void => {
    const items: { term: string; detail: string }[] = [];
    let term = '';
    for (const child of el.querySelectorAll(
      ':scope > dt, :scope > dd, :scope > div > dt, :scope > div > dd',
    )) {
      if (child.tagName === 'DT') term = clean(child.textContent);
      else if (term) items.push({ term, detail: clean(child.textContent) });
    }
    if (items.length) blocks.push({ kind: 'definitions', items });
  };

  const handleTable = (el: Element): void => {
    const rows = [...el.querySelectorAll('tr')].map((tr) =>
      [...tr.querySelectorAll('th, td')].map((c) => clean(c.textContent)),
    );
    if (rows.length) blocks.push({ kind: 'table', rows });
  };

  const handleForm = (el: Element): void => {
    const form = toForm(el);
    forms.push(form);
    blocks.push({ kind: 'form', form });
  };

  const handleAnchor = (el: Element): void => {
    const link = toLink(el);
    if (link) blocks.push({ kind: 'link', link });
  };

  const handleImage = (el: Element): void => {
    const alt = attr(el, 'alt');
    if (alt) blocks.push({ kind: 'image', alt });
  };

  const handleWidget = (el: Element): void => {
    const label = attr(el, 'aria-label') || attr(el, 'title');
    if (el.tagName !== 'svg' || label)
      blocks.push({ kind: 'widget', tag: el.tagName.toLowerCase(), label });
  };

  const HANDLERS: Record<string, (el: Element) => void> = {
    H1: handleHeading,
    H2: handleHeading,
    H3: handleHeading,
    H4: handleHeading,
    H5: handleHeading,
    H6: handleHeading,
    P: (el) => pushParagraph(clean(el.textContent)),
    UL: handleList,
    OL: handleList,
    DL: handleDefinitions,
    TABLE: handleTable,
    NAV: (el) => void blocks.push({ kind: 'nav', links: collectLinks(el) }),
    FORM: handleForm,
    A: handleAnchor,
    IMG: handleImage,
    svg: handleWidget,
  };
  for (const tag of WIDGET) HANDLERS[tag] = handleWidget;

  const walk = (el: Element): void => {
    if (SKIP.has(el.tagName) || isHidden(el)) return;
    const handler = HANDLERS[el.tagName];
    if (handler) return handler(el);
    if (isTextLeaf(el)) return pushParagraph(clean(el.textContent));
    for (const child of el.children) walk(child);
  };

  const doc = document;
  const scope = doc.getElementById('root') || doc.body;
  walk(scope);
  links.push(...collectLinks(scope));
  return {
    route,
    title: clean(doc.title),
    description: attr(doc.querySelector('meta[name="description"]') ?? doc.body, 'content'),
    blocks,
    links,
    forms,
  };
}
