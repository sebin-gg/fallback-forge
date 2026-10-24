import path from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import type { ResolvedConfig } from './types.js';
import { normalizeRoute } from './config.js';

export function inspectFile(cfg: ResolvedConfig): string {
  return path.join(cfg.outDir, 'inspect.json');
}

export function generateFile(cfg: ResolvedConfig): string {
  return path.join(cfg.outDir, 'generate.json');
}

export function liteDir(cfg: ResolvedConfig): string {
  return path.join(cfg.outDir, 'lite');
}

export function reportFile(cfg: ResolvedConfig, ext: 'json' | 'md'): string {
  return path.join(cfg.outDir, `report.${ext}`);
}

/** File on disk for a companion page: `/register` → `<lite>/register/index.html`. */
export function liteFileForRoute(cfg: ResolvedConfig, route: string): string {
  const r = normalizeRoute(route);
  const rel = r === '/' ? 'index.html' : path.join(r.slice(1), 'index.html');
  return path.join(liteDir(cfg), rel);
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T;
}

export async function writeText(file: string, text: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text, 'utf8');
}
