import { describe, expect, it } from 'vitest';
import { summarize } from '../src/verify/summary.js';
import { renderMarkdown } from '../src/report/index.js';
import type { PageMetrics, ProfileResult, VerifyReport } from '../src/types.js';

const metrics = (bytes: number, extra: Partial<PageMetrics> = {}): PageMetrics => ({
  url: 'http://x/',
  status: 200,
  loadMs: 100,
  bytes,
  requests: 1,
  consoleErrors: [],
  brokenLinks: [],
  ...extra,
});

const profile = (liteBytes: number, litePassed = true): ProfileResult => ({
  profile: { name: 'fast-3g', downloadKbps: 1600, uploadKbps: 750, latencyMs: 150 },
  full: {
    pages: { '/': metrics(1_000_000) },
    actions: [{ id: 'a', type: 'text', route: '/', passed: true, detail: 'ok' }],
  },
  lite: {
    pages: { '/': metrics(liteBytes) },
    actions: [
      {
        id: 'a',
        type: 'text',
        route: '/',
        passed: litePassed,
        detail: litePassed ? 'ok' : 'missing',
      },
    ],
  },
});

describe('summarize', () => {
  it('passes when lite actions pass, lite is smaller, detection fired, and no error flags', () => {
    const s = summarize(
      [profile(5000)],
      { profile: 'fast-3g', startUrl: '', finalUrl: '/lite/', redirected: true, elapsedMs: 1 },
      [],
    );
    expect(s).toMatchObject({
      ok: true,
      liteActionsPassed: 1,
      liteActionsTotal: 1,
      liteSmallerOnEveryRoute: true,
      detectionTriggered: true,
    });
  });

  it('fails on a failed lite action, a larger lite page, missed detection, or an error flag', () => {
    const det = { profile: 'x', startUrl: '', finalUrl: '', redirected: true, elapsedMs: 1 };
    expect(summarize([profile(5000, false)], det, []).ok).toBe(false);
    expect(summarize([profile(2_000_000)], det, []).ok).toBe(false);
    expect(summarize([profile(5000)], { ...det, redirected: false }, []).ok).toBe(false);
    expect(
      summarize([profile(5000)], det, [{ route: '/', severity: 'error', message: 'x' }]).ok,
    ).toBe(false);
    expect(summarize([profile(5000)], undefined, []).detectionTriggered).toBeNull();
  });
});

describe('renderMarkdown', () => {
  it('includes the headline result, per-route savings and action table', () => {
    const report: VerifyReport = {
      generatedAt: '2026-10-25T00:00:00Z',
      baseUrl: 'http://127.0.0.1:4173',
      profiles: [profile(5000)],
      generateFlags: [{ route: '/', severity: 'warning', message: 'svg replaced' }],
      summary: summarize([profile(5000)], undefined, []),
    };
    const md = renderMarkdown(report);
    expect(md).toContain('## Result: PASS');
    expect(md).toContain('| `/` | 976.6 KB | 4.9 KB | 100% |');
    expect(md).toContain('| a | text | `/` | pass | pass | ok |');
    expect(md).toContain('**warning** `/` — svg replaced');
  });
});
