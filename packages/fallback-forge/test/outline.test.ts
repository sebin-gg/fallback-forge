import { describe, expect, it } from 'vitest';
import { blocksText, buildOutline, checkTextActions } from '../src/generate/outline.js';
import { homePage, testConfig } from './fixtures.js';

describe('buildOutline', () => {
  it('keeps semantic blocks, drops images, collapses duplicate nav, notes widgets', () => {
    const { outline, flags } = buildOutline(homePage, testConfig().essentialActions);
    const kinds = outline.blocks.map((b) => b.kind);
    expect(kinds.filter((k) => k === 'nav')).toHaveLength(1);
    expect(kinds).not.toContain('image');
    expect(kinds).not.toContain('widget');
    expect(blocksText(outline.blocks)).toContain('not available in the lightweight version');
    expect(flags).toEqual([expect.objectContaining({ severity: 'warning', route: '/' })]);
    expect(outline.title).toBe('DevDay Exchange Community Hackathon: Kochi');
  });

  it('flags essential text that is missing from the page as an error', () => {
    const actions = [{ id: 'x', route: '/', type: 'text' as const, match: 'Not on the page' }];
    const { flags } = buildOutline(homePage, actions);
    expect(flags.some((f) => f.severity === 'error' && f.message.includes('Not on the page'))).toBe(
      true,
    );
  });

  it('truncates very long paragraphs', () => {
    const long = 'x'.repeat(2000);
    const page = { ...homePage, blocks: [{ kind: 'paragraph' as const, text: long }] };
    const { outline } = buildOutline(page, []);
    const p = outline.blocks[0];
    expect(p?.kind === 'paragraph' && p.text.length).toBeLessThanOrEqual(600);
  });
});

describe('checkTextActions', () => {
  it('is case-insensitive and ignores actions for other routes', () => {
    const blocks = [{ kind: 'paragraph' as const, text: 'Doors open at 6 PM' }];
    const actions = [
      { id: 'a', route: '/', type: 'text' as const, match: 'doors OPEN' },
      { id: 'b', route: '/other', type: 'text' as const, match: 'missing' },
    ];
    expect(checkTextActions('/', actions, blocks)).toEqual([]);
  });
});
