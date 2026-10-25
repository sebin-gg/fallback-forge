import { describe, expect, it } from 'vitest';
import { detectScript } from '../src/detect/script.js';
import { testConfig } from './fixtures.js';

interface FakeEnv {
  pathname: string;
  search?: string;
  connection?: Record<string, unknown>;
  fireLoad?: boolean;
}

/** Run the inline script against a tiny fake browser and report where it navigated. */
function simulate(env: FakeEnv, routes = ['/', '/register']) {
  const cfg = testConfig();
  const script = detectScript(cfg, { routes });
  const timers: Array<() => void> = [];
  const listeners: Record<string, Array<() => void>> = {};
  const state = { replaced: null as string | null };
  const location = {
    pathname: env.pathname,
    search: env.search ?? '',
    hash: '',
    replace: (u: string) => (state.replaced = u),
  };
  const fn = new Function(
    'location',
    'navigator',
    'document',
    'window',
    'setTimeout',
    'clearTimeout',
    'URLSearchParams',
    script,
  );
  fn(
    location,
    { connection: env.connection },
    { addEventListener: () => {} },
    { addEventListener: (ev: string, cb: () => void) => (listeners[ev] ??= []).push(cb) },
    (cb: () => void) => timers.push(cb) && timers.length,
    (id: number) => timers.splice(id - 1, 1, () => {}),
    URLSearchParams,
  );
  if (env.fireLoad) listeners.load?.forEach((cb) => cb());
  timers.forEach((cb) => cb());
  return { redirectedTo: state.replaced };
}

describe('detectScript', () => {
  it('does nothing on companion pages or routes without a companion', () => {
    expect(simulate({ pathname: '/lite/' }).redirectedTo).toBeNull();
    expect(
      simulate({ pathname: '/no-companion', connection: { saveData: true } }).redirectedTo,
    ).toBeNull();
  });

  it('honours manual overrides for that page load only', () => {
    expect(simulate({ pathname: '/register', search: '?lite=1' }).redirectedTo).toBe(
      '/lite/register/?ff=manual',
    );
    expect(
      simulate({ pathname: '/', search: '?lite=0', connection: { saveData: true } }).redirectedTo,
    ).toBeNull();
    // No remembered choice: the next load re-evaluates the network and switches.
    expect(
      simulate({ pathname: '/', connection: { saveData: true }, fireLoad: true }).redirectedTo,
    ).toBe('/lite/?ff=save-data');
  });

  it('switches on Save-Data, slow effectiveType, low downlink, or high rtt', () => {
    expect(
      simulate({ pathname: '/', connection: { saveData: true }, fireLoad: true }).redirectedTo,
    ).toBe('/lite/?ff=save-data');
    expect(
      simulate({ pathname: '/', connection: { effectiveType: '2g' }, fireLoad: true }).redirectedTo,
    ).toBe('/lite/?ff=effective-type');
    expect(
      simulate({
        pathname: '/',
        connection: { effectiveType: '4g', downlink: 0.8 },
        fireLoad: true,
      }).redirectedTo,
    ).toBe('/lite/?ff=downlink');
    expect(
      simulate({
        pathname: '/',
        connection: { effectiveType: '4g', downlink: 10, rtt: 900 },
        fireLoad: true,
      }).redirectedTo,
    ).toBe('/lite/?ff=rtt');
    expect(
      simulate({
        pathname: '/',
        connection: { effectiveType: '4g', downlink: 10, rtt: 50 },
        fireLoad: true,
      }).redirectedTo,
    ).toBeNull();
  });

  it('falls back to the slow-load timer when no signal fires and load never completes', () => {
    expect(simulate({ pathname: '/' }).redirectedTo).toBe('/lite/?ff=slow-load');
    expect(simulate({ pathname: '/', fireLoad: true }).redirectedTo).toBeNull();
  });

  it('never throws when APIs are missing', () => {
    const script = detectScript(testConfig(), { routes: ['/'] });
    expect(() => new Function('location', script)({ pathname: '/', search: '' })).not.toThrow();
  });
});
