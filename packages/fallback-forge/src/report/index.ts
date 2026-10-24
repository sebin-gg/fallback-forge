import type { PageMetrics, ProfileResult, ResolvedConfig, VerifyReport } from '../types.js';
import { reportFile, writeJson, writeText } from '../paths.js';

export async function writeReport(
  cfg: ResolvedConfig,
  report: VerifyReport,
): Promise<{ json: string; md: string }> {
  const json = reportFile(cfg, 'json');
  const md = reportFile(cfg, 'md');
  await writeJson(json, report);
  await writeText(md, renderMarkdown(report));
  return { json, md };
}

export function renderMarkdown(r: VerifyReport): string {
  const s = r.summary;
  const lines: string[] = [
    '# Fallback Forge report',
    '',
    `Generated ${r.generatedAt} against ${r.baseUrl}.`,
    '',
    `## Result: ${s.ok ? 'PASS' : 'FAIL'}`,
    '',
    `- Essential actions in the lightweight version: ${s.liteActionsPassed}/${s.liteActionsTotal} passed`,
    `- Essential actions in the full version: ${s.fullActionsPassed}/${s.fullActionsTotal} passed`,
    `- Lightweight version transfers fewer bytes on every route: ${yesNo(s.liteSmallerOnEveryRoute)}`,
    `- Automatic switch under the slowest profile: ${detectionLine(r)}`,
    `- Generate flags: ${count(r, 'error')} error(s), ${count(r, 'warning')} warning(s)`,
    '',
  ];
  for (const p of r.profiles) lines.push(...profileSection(p));
  if (r.generateFlags.length) {
    lines.push('## Flags from generate', '');
    for (const f of r.generateFlags)
      lines.push(`- **${f.severity}** \`${f.route}\` — ${f.message}`);
    lines.push('');
  }
  return lines.join('\n');
}

function profileSection(p: ProfileResult): string[] {
  return [
    `## Profile: ${p.profile.name} (${p.profile.downloadKbps} kbps down, ${p.profile.latencyMs} ms latency)`,
    '',
    ...pagesTable(p),
    '',
    ...actionsTable(p),
    ...errorsSection(p),
    '',
  ];
}

function pagesTable(p: ProfileResult): string[] {
  const lines = [
    '| Route | Full bytes | Lite bytes | Saved | Full load | Lite load | Full errors | Lite errors | Broken links (full/lite) |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ];
  for (const route of Object.keys(p.full.pages)) {
    lines.push(pageRow(route, p.full.pages[route]!, p.lite.pages[route]));
  }
  return lines;
}

function pageRow(route: string, f: PageMetrics, l?: PageMetrics): string {
  if (!l) {
    return `| \`${route}\` | ${kb(f.bytes)} | n/a | n/a | ${f.loadMs} ms | n/a | ${f.consoleErrors.length} | n/a | ${f.brokenLinks.length}/n/a |`;
  }
  const saved = `${Math.round((1 - l.bytes / Math.max(f.bytes, 1)) * 100)}%`;
  return `| \`${route}\` | ${kb(f.bytes)} | ${kb(l.bytes)} | ${saved} | ${f.loadMs} ms | ${l.loadMs} ms | ${f.consoleErrors.length} | ${l.consoleErrors.length} | ${f.brokenLinks.length}/${l.brokenLinks.length} |`;
}

function actionsTable(p: ProfileResult): string[] {
  const lines = [
    '| Action | Type | Route | Full | Lite | Lite detail |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const a of p.lite.actions) {
    const full = p.full.actions.find((x) => x.id === a.id);
    lines.push(
      `| ${a.id} | ${a.type} | \`${a.route}\` | ${mark(full?.passed)} | ${mark(a.passed)} | ${a.detail} |`,
    );
  }
  return lines;
}

function errorsSection(p: ProfileResult): string[] {
  const errors = [...Object.values(p.full.pages), ...Object.values(p.lite.pages)].flatMap(
    (m) => m.consoleErrors,
  );
  if (!errors.length) return [];
  const lines = ['', '<details><summary>Console errors</summary>', ''];
  for (const e of [...new Set(errors)]) lines.push(`- ${e}`);
  lines.push('', '</details>');
  return lines;
}

function detectionLine(r: VerifyReport): string {
  if (!r.detection) return 'not checked';
  const d = r.detection;
  return d.redirected
    ? `yes, ${d.finalUrl} after ${d.elapsedMs} ms (${d.profile})`
    : `no, stayed on ${d.finalUrl} (${d.profile})`;
}

function count(r: VerifyReport, severity: 'error' | 'warning'): number {
  return r.generateFlags.filter((f) => f.severity === severity).length;
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function yesNo(v: boolean): string {
  return v ? 'yes' : 'no';
}

function mark(v: boolean | undefined): string {
  return v === undefined ? '–' : v ? 'pass' : 'FAIL';
}
