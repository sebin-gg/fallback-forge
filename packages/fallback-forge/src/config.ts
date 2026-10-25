import { existsSync } from 'node:fs';
import path from 'node:path';
import { createJiti } from 'jiti';
import type {
  AiConfig,
  DetectionConfig,
  EssentialAction,
  FallbackForgeConfig,
  NetworkProfile,
  ResolvedConfig,
  VerifyConfig,
} from './types.js';

export type { FallbackForgeConfig, EssentialAction } from './types.js';

const CONFIG_FILES = [
  'fallback-forge.config.ts',
  'fallback-forge.config.mts',
  'fallback-forge.config.js',
  'fallback-forge.config.mjs',
];

export const NETWORK_PROFILES: Record<string, NetworkProfile> = {
  'slow-3g': { name: 'slow-3g', downloadKbps: 400, uploadKbps: 400, latencyMs: 400 },
  'fast-3g': { name: 'fast-3g', downloadKbps: 1600, uploadKbps: 750, latencyMs: 150 },
  '4g': { name: '4g', downloadKbps: 9000, uploadKbps: 9000, latencyMs: 60 },
};

const DETECTION_DEFAULTS: Required<DetectionConfig> = {
  saveData: true,
  effectiveTypes: ['slow-2g', '2g', '3g'],
  maxDownlinkMbps: 1.5,
  minRttMs: 400,
  slowLoadMs: 8000,
  queryParam: 'lite',
  manualSwitchLink: true,
};

const VERIFY_DEFAULTS: Required<Omit<VerifyConfig, 'baseUrl'>> = {
  profiles: [NETWORK_PROFILES['fast-3g']!],
  timeoutMs: 90_000,
  checkDetection: true,
};

/** Identity helper that gives config files IntelliSense. */
export function defineConfig(config: FallbackForgeConfig): FallbackForgeConfig {
  return config;
}

export function findConfigFile(root: string): string | undefined {
  return CONFIG_FILES.map((f) => path.join(root, f)).find((p) => existsSync(p));
}

export async function loadConfig(root: string): Promise<ResolvedConfig> {
  const file = findConfigFile(root);
  if (!file) {
    throw new Error(
      `No fallback-forge config found in ${root}. Create fallback-forge.config.ts (see README).`,
    );
  }
  const jiti = createJiti(import.meta.url);
  const mod = (await jiti.import(file)) as { default?: FallbackForgeConfig } | FallbackForgeConfig;
  const raw = 'default' in mod && mod.default ? mod.default : (mod as FallbackForgeConfig);
  return resolveConfig(raw, root);
}

export function resolveConfig(raw: FallbackForgeConfig, root: string): ResolvedConfig {
  validate(raw);
  return {
    root,
    siteName: raw.siteName ?? 'Site',
    routes: normalizeRoutes(raw.routes ?? []),
    companionBase: normalizeBase(raw.companionBase ?? '/lite'),
    essentialActions: raw.essentialActions,
    detection: withDefaults(DETECTION_DEFAULTS, raw.detection),
    verify: withDefaults(VERIFY_DEFAULTS, raw.verify),
    ai: resolveAi(raw.ai),
    outDir: path.resolve(root, raw.outDir ?? '.fallback-forge'),
    devPort: raw.devPort ?? 5173,
    previewPort: raw.previewPort ?? 4173,
  };
}

/** Shallow merge that ignores `undefined` values in the override. */
function withDefaults<T extends object, U extends Partial<T>>(defaults: T, override?: U): T & U {
  const picked = Object.fromEntries(
    Object.entries(override ?? {}).filter(([, v]) => v !== undefined),
  );
  return { ...defaults, ...picked } as T & U;
}

function resolveAi(ai: AiConfig = {}): ResolvedConfig['ai'] {
  const apiKeyEnv = ai.apiKeyEnv ?? 'OPENAI_API_KEY';
  return {
    apiKeyEnv,
    enabled: ai.enabled ?? Boolean(process.env[apiKeyEnv]),
    model: ai.model ?? process.env.FALLBACK_FORGE_MODEL ?? 'gpt-4o-mini',
    baseUrl: ai.baseUrl ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  };
}

function validate(raw: FallbackForgeConfig): void {
  if (!Array.isArray(raw.essentialActions)) {
    throw new Error('config.essentialActions must be an array (it may be empty).');
  }
  const ids = new Set<string>();
  for (const a of raw.essentialActions) {
    if (!a.id || !a.route || !a.type) {
      throw new Error(`Essential action is missing id, route or type: ${JSON.stringify(a)}`);
    }
    if (ids.has(a.id)) throw new Error(`Duplicate essential action id: ${a.id}`);
    ids.add(a.id);
    validateAction(a);
  }
}

const REQUIRED_FIELDS: Record<
  EssentialAction['type'],
  (a: EssentialAction) => [string, unknown][]
> = {
  text: (a) => [['match', a.match]],
  link: (a) => [['href', a.href]],
  form: (a) => [
    ['endpoint', a.endpoint],
    ['fields', a.fields && Object.keys(a.fields).length > 0],
    ['success', a.success],
  ],
};

function validateAction(a: EssentialAction): void {
  for (const [field, ok] of REQUIRED_FIELDS[a.type](a)) {
    if (!ok) throw new Error(`Essential action "${a.id}" (${a.type}) requires "${field}".`);
  }
}

export function normalizeRoute(route: string): string {
  const trimmed = route.trim().replace(/\/+$/, '');
  if (trimmed === '') return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function normalizeRoutes(routes: string[]): string[] {
  return [...new Set(routes.map(normalizeRoute))];
}

function normalizeBase(base: string): string {
  const b = normalizeRoute(base);
  if (b === '/') throw new Error('companionBase cannot be "/".');
  return b;
}

/** `/register` → `/lite/register/`; `/` → `/lite/`. */
export function companionPath(base: string, route: string): string {
  const r = normalizeRoute(route);
  return r === '/' ? `${base}/` : `${base}${r}/`;
}

/** Inverse of `companionPath`: `/lite/register/` → `/register`. Returns undefined when not under the base. */
export function routeFromCompanion(base: string, pathname: string): string | undefined {
  if (pathname !== base && !pathname.startsWith(`${base}/`)) return undefined;
  return normalizeRoute(pathname.slice(base.length));
}
