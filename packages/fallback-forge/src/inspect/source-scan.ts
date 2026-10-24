import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Endpoint } from '../types.js';
import { normalizeRoute } from '../config.js';

const SOURCE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.fallback-forge']);

export interface SourceScan {
  routes: string[];
  endpoints: Endpoint[];
  files: number;
}

/** Walk `root/src` (or `root` if there is no src) and collect route paths and API calls. */
export async function scanSource(root: string): Promise<SourceScan> {
  const srcDir = path.join(root, 'src');
  const files = await listSourceFiles(srcDir).catch(() => listSourceFiles(root));
  const routes = new Set<string>();
  const endpoints: Endpoint[] = [];
  for (const file of files) {
    const text = await readFile(file, 'utf8');
    for (const r of findRoutes(text)) routes.add(r);
    for (const e of findEndpoints(text)) endpoints.push({ ...e, file: path.relative(root, file) });
  }
  return { routes: [...routes].sort(), endpoints: dedupeEndpoints(endpoints), files: files.length };
}

async function listSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...(await listSourceFiles(full)));
    } else if (SOURCE_EXT.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

/** `<Route path="/x">`, `{ path: '/x' }`, and `index` routes. Dynamic segments (`:id`, `*`) are skipped. */
export function findRoutes(source: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /<Route\b[^>]*?\bpath\s*=\s*["'`]([^"'`]+)["'`]/g,
    /\bpath\s*:\s*["'`]([^"'`]+)["'`]/g,
  ];
  for (const re of patterns) {
    for (const m of source.matchAll(re)) {
      const p = m[1] ?? '';
      if (p.includes(':') || p.includes('*')) continue;
      found.add(normalizeRoute(p));
    }
  }
  if (/<Route\b[^>]*\bindex\b/.test(source)) found.add('/');
  return [...found];
}

type Call = Omit<Endpoint, 'file'>;

/** `fetch('/api/x', { method: 'POST' })`, `axios.post('/api/x')`, `fetch("/api/x")` (GET). */
export function findEndpoints(source: string): Call[] {
  const all = [...fetchCalls(source), ...axiosCalls(source)];
  return all.filter((e) => e.url.startsWith('/') || /^https?:/.test(e.url));
}

function fetchCalls(source: string): Call[] {
  const re = /\bfetch\(\s*["'`]([^"'`]+)["'`]\s*(?:,\s*\{([^}]*)\})?/g;
  return [...source.matchAll(re)].map((m) => ({
    method: /method\s*:\s*["'`](\w+)["'`]/i.exec(m[2] ?? '')?.[1]?.toUpperCase() ?? 'GET',
    url: m[1] ?? '',
  }));
}

function axiosCalls(source: string): Call[] {
  const re = /\baxios\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g;
  return [...source.matchAll(re)].map((m) => ({
    method: (m[1] ?? 'get').toUpperCase(),
    url: m[2] ?? '',
  }));
}

function dedupeEndpoints(list: Endpoint[]): Endpoint[] {
  const seen = new Map<string, Endpoint>();
  for (const e of list) seen.set(`${e.method} ${e.url}`, seen.get(`${e.method} ${e.url}`) ?? e);
  return [...seen.values()];
}
