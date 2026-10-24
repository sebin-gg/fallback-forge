import { describe, expect, it } from 'vitest';
import { esc, renderPage, rewriteHref, type RenderContext } from '../src/generate/render.js';
import { buildOutline } from '../src/generate/outline.js';
import { homePage, registerPage, testConfig } from './fixtures.js';

function ctx(overrides: Partial<RenderContext> = {}): RenderContext {
  const cfg = testConfig();
  return {
    siteName: cfg.siteName,
    companionBase: cfg.companionBase,
    routes: ['/', '/register'],
    actions: cfg.essentialActions,
    storageKey: cfg.detection.storageKey,
    queryParam: cfg.detection.queryParam,
    ...overrides,
  };
}

describe('renderPage', () => {
  it('produces a small semantic document with no external resources', () => {
    const { outline } = buildOutline(homePage, []);
    const { html } = renderPage(outline, ctx());
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('<h1>DevDay Exchange Community Hackathon: Kochi</h1>');
    expect(html).toContain('<dt>Registration closes</dt><dd>9 October 2026, 11:59 PM IST</dd>');
    expect(html).not.toMatch(/<link[^>]+stylesheet/);
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toContain('<img');
    expect(Buffer.byteLength(html)).toBeLessThan(6000);
  });

  it('rewrites internal links to companion pages and leaves others alone', () => {
    const c = ctx();
    expect(rewriteHref('/register', c)).toBe('/lite/register/');
    expect(rewriteHref('/register?x=1#top', c)).toBe('/lite/register/?x=1#top');
    expect(rewriteHref('/schedule', c)).toBe('/schedule');
    expect(rewriteHref('https://example.com/', c)).toBe('https://example.com/');
    const { html } = renderPage(buildOutline(homePage, []).outline, c);
    expect(html).toContain('href="/lite/register/"');
    expect(html).toContain('href="/?lite=0"');
  });

  it('renders forms with a real action/method plus the JSON enhancement script', () => {
    const { outline } = buildOutline(registerPage, []);
    const { html, flags } = renderPage(outline, ctx());
    expect(flags).toEqual([]);
    expect(html).toContain('<form id="register" action="/api/register" method="POST" data-ff>');
    expect(html).toContain('<input type="email" name="email" required>');
    expect(html).toContain('<select name="team"><option value="1">Solo</option>');
    expect(html).toContain('<textarea name="notes"></textarea>');
    expect(html).toContain('form[data-ff]');
  });

  it('flags a form with no resolvable endpoint instead of dropping it', () => {
    const { outline } = buildOutline(registerPage, []);
    const { html, flags } = renderPage(outline, ctx({ actions: [] }));
    expect(flags).toEqual([expect.objectContaining({ severity: 'error', route: '/register' })]);
    expect(html).toContain('cannot be submitted in the lightweight version');
    expect(html).toContain('name="email"');
  });
});

describe('esc', () => {
  it('escapes HTML special characters', () => {
    expect(esc('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});
