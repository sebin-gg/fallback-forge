/** An essential user task that must keep working in the companion version. */
export interface EssentialAction {
  /** Stable identifier used in reports, e.g. `find-deadline`. */
  id: string;
  /** Human-readable purpose. */
  description?: string;
  /** Route the action lives on, e.g. `/` or `/register`. */
  route: string;
  type: 'text' | 'link' | 'form';
  /** `text`: case-insensitive substring that must be visible. */
  match?: string;
  /** `link`: href that must be present and resolve (internal paths or absolute URLs). */
  href?: string;
  /** `form`: endpoint the form must post to. */
  endpoint?: string;
  method?: 'POST' | 'GET';
  /** `form`: field name → sample value used by `verify`. */
  fields?: Record<string, string>;
  /** `form`: text expected after a successful submission. */
  success?: string;
}

export interface DetectionConfig {
  /** Honour the `Save-Data` / `navigator.connection.saveData` signal. Default `true`. */
  saveData?: boolean;
  /** `navigator.connection.effectiveType` values that count as slow. Default `['slow-2g','2g','3g']`. */
  effectiveTypes?: string[];
  /** Downlink (Mbps) at or below which the connection counts as slow. Default `1.5`. */
  maxDownlinkMbps?: number;
  /** Round-trip time (ms) at or above which the connection counts as slow. Default `400`. */
  minRttMs?: number;
  /** If the app bundle has not finished loading after this many ms, switch to lite. Default `8000`. `0` disables. */
  slowLoadMs?: number;
  /** Query parameter for manual override: `?lite=1` forces lite, `?lite=0` forces full. Default `lite`. */
  queryParam?: string;
  /** localStorage key that remembers the manual choice. Default `fallback-forge-mode`. */
  storageKey?: string;
  /** Inject a small fixed "Lightweight version" link into the full app. Default `true`. */
  manualSwitchLink?: boolean;
}

export interface NetworkProfile {
  name: string;
  downloadKbps: number;
  uploadKbps: number;
  latencyMs: number;
}

export interface VerifyConfig {
  /** Network profiles to test under. Default: `fast-3g`. */
  profiles?: NetworkProfile[];
  /** Use an already running server instead of starting `vite preview`. */
  baseUrl?: string;
  /** Per-navigation timeout in ms. Default `90000`. */
  timeoutMs?: number;
  /** Also assert that detection redirects `/` to the companion under the slowest profile. Default `true`. */
  checkDetection?: boolean;
}

export interface AiConfig {
  /** Default: enabled only when the API key environment variable is set. */
  enabled?: boolean;
  /** Model id. Default: `FALLBACK_FORGE_MODEL` env or `gpt-4o-mini`. */
  model?: string;
  /** Default: `OPENAI_BASE_URL` env or `https://api.openai.com/v1`. */
  baseUrl?: string;
  /** Name of the env var holding the key. Default `OPENAI_API_KEY`. */
  apiKeyEnv?: string;
}

export interface FallbackForgeConfig {
  /** Display name used in companion page titles. */
  siteName?: string;
  /** Routes that get a companion page. Default: discovered by `inspect`. */
  routes?: string[];
  /** URL prefix for companion pages. Default `/lite`. */
  companionBase?: string;
  /** Developer-approved essential actions. */
  essentialActions: EssentialAction[];
  detection?: DetectionConfig;
  verify?: VerifyConfig;
  ai?: AiConfig;
  /** Output directory relative to the project root. Default `.fallback-forge`. */
  outDir?: string;
  /** Dev server port used by `inspect`. Default `5173`. */
  devPort?: number;
  /** Preview server port used by `verify`. Default `4173`. */
  previewPort?: number;
}

/** Config with every default applied. */
export interface ResolvedConfig {
  root: string;
  siteName: string;
  routes: string[];
  companionBase: string;
  essentialActions: EssentialAction[];
  detection: Required<DetectionConfig>;
  verify: Required<Omit<VerifyConfig, 'baseUrl'>> & { baseUrl?: string };
  ai: Required<Omit<AiConfig, 'enabled'>> & { enabled: boolean };
  outDir: string;
  devPort: number;
  previewPort: number;
}

/* ---------- Inspection ---------- */

export interface FormField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface InspectedForm {
  id?: string;
  action?: string;
  method: string;
  fields: FormField[];
  submitText: string;
}

export interface LinkItem {
  text: string;
  href: string;
  internal: boolean;
}

export type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: { text: string; href?: string }[] }
  | { kind: 'definitions'; items: { term: string; detail: string }[] }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'nav'; links: LinkItem[] }
  | { kind: 'link'; link: LinkItem }
  | { kind: 'form'; form: InspectedForm }
  | { kind: 'image'; alt: string }
  | { kind: 'widget'; tag: string; label: string };

export interface InspectedPage {
  route: string;
  title: string;
  description: string;
  blocks: Block[];
  links: LinkItem[];
  forms: InspectedForm[];
}

export interface Endpoint {
  method: string;
  url: string;
  file: string;
}

export interface Inspection {
  generatedAt: string;
  baseUrl: string;
  routes: string[];
  endpoints: Endpoint[];
  pages: InspectedPage[];
  proposedActions: EssentialAction[];
}

/* ---------- Generation ---------- */

export interface Outline {
  route: string;
  title: string;
  blocks: Block[];
}

export interface GenerateFlag {
  route: string;
  severity: 'warning' | 'error';
  message: string;
}

export interface GenerateResult {
  generatedAt: string;
  aiUsed: boolean;
  aiNote?: string;
  pages: { route: string; file: string; bytes: number }[];
  flags: GenerateFlag[];
}

/* ---------- Verification ---------- */

export interface ActionResult {
  id: string;
  type: EssentialAction['type'];
  route: string;
  passed: boolean;
  detail: string;
}

export interface PageMetrics {
  url: string;
  status: number | null;
  loadMs: number;
  bytes: number;
  requests: number;
  consoleErrors: string[];
  brokenLinks: string[];
}

export interface VersionResult {
  pages: Record<string, PageMetrics>;
  actions: ActionResult[];
}

export interface ProfileResult {
  profile: NetworkProfile;
  full: VersionResult;
  lite: VersionResult;
}

export interface DetectionResult {
  profile: string;
  startUrl: string;
  finalUrl: string;
  redirected: boolean;
  elapsedMs: number;
}

export interface VerifyReport {
  generatedAt: string;
  baseUrl: string;
  profiles: ProfileResult[];
  detection?: DetectionResult;
  generateFlags: GenerateFlag[];
  summary: {
    liteActionsPassed: number;
    liteActionsTotal: number;
    fullActionsPassed: number;
    fullActionsTotal: number;
    liteSmallerOnEveryRoute: boolean;
    detectionTriggered: boolean | null;
    ok: boolean;
  };
}
