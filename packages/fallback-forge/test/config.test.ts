import { describe, expect, it } from 'vitest';
import { companionPath, normalizeRoute, resolveConfig, routeFromCompanion } from '../src/config.js';

describe('resolveConfig', () => {
  it('applies defaults', () => {
    const cfg = resolveConfig({ essentialActions: [] }, '/proj');
    expect(cfg.companionBase).toBe('/lite');
    expect(cfg.detection.slowLoadMs).toBe(8000);
    expect(cfg.verify.profiles[0]?.name).toBe('fast-3g');
    expect(cfg.outDir.replace(/\\/g, '/')).toMatch(/\/proj\/\.fallback-forge$/);
  });

  it('normalises routes and rejects a root companion base', () => {
    const cfg = resolveConfig({ essentialActions: [], routes: ['about/', '/about', 'x'] }, '/p');
    expect(cfg.routes).toEqual(['/about', '/x']);
    expect(() => resolveConfig({ essentialActions: [], companionBase: '/' }, '/p')).toThrow(
      /companionBase/,
    );
  });

  it('validates essential actions by type', () => {
    expect(() =>
      resolveConfig({ essentialActions: [{ id: 'a', route: '/', type: 'text' }] }, '/p'),
    ).toThrow(/requires "match"/);
    expect(() =>
      resolveConfig(
        {
          essentialActions: [{ id: 'f', route: '/r', type: 'form', endpoint: '/api', fields: {} }],
        },
        '/p',
      ),
    ).toThrow(/requires "fields"/);
    expect(() =>
      resolveConfig(
        {
          essentialActions: [
            { id: 'dup', route: '/', type: 'text', match: 'x' },
            { id: 'dup', route: '/', type: 'text', match: 'y' },
          ],
        },
        '/p',
      ),
    ).toThrow(/Duplicate/);
  });

  it('enables AI only when the key env var is present', () => {
    const prev = process.env.FF_TEST_KEY;
    delete process.env.FF_TEST_KEY;
    expect(
      resolveConfig({ essentialActions: [], ai: { apiKeyEnv: 'FF_TEST_KEY' } }, '/p').ai.enabled,
    ).toBe(false);
    process.env.FF_TEST_KEY = 'x';
    expect(
      resolveConfig({ essentialActions: [], ai: { apiKeyEnv: 'FF_TEST_KEY' } }, '/p').ai.enabled,
    ).toBe(true);
    if (prev === undefined) delete process.env.FF_TEST_KEY;
    else process.env.FF_TEST_KEY = prev;
  });
});

describe('route helpers', () => {
  it('normalizeRoute', () => {
    expect(normalizeRoute('')).toBe('/');
    expect(normalizeRoute('/a/')).toBe('/a');
    expect(normalizeRoute('a')).toBe('/a');
  });

  it('companionPath and routeFromCompanion are inverses', () => {
    expect(companionPath('/lite', '/')).toBe('/lite/');
    expect(companionPath('/lite', '/register')).toBe('/lite/register/');
    expect(routeFromCompanion('/lite', '/lite/')).toBe('/');
    expect(routeFromCompanion('/lite', '/lite/register/')).toBe('/register');
    expect(routeFromCompanion('/lite', '/liter')).toBeUndefined();
    expect(routeFromCompanion('/lite', '/other')).toBeUndefined();
  });
});
