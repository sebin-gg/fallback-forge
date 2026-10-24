import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin, HtmlTagDescriptor } from 'vite';
import { loadConfig, routeFromCompanion } from './config.js';
import type { GenerateResult, ResolvedConfig } from './types.js';
import { generateFile, liteDir, liteFileForRoute } from './paths.js';
import { detectScript, manualSwitchLink } from './detect/script.js';

export { defineConfig } from './config.js';
export type { FallbackForgeConfig, EssentialAction } from './types.js';

export interface PluginOptions {
  /** Project root containing `fallback-forge.config.*`. Defaults to Vite's root. */
  root?: string;
}

/**
 * Vite plugin: injects the connectivity detector into index.html, serves the
 * generated companion pages at `<companionBase>/*` in dev, and copies them
 * into the build output so any static host serves them.
 */
export default function fallbackForge(options: PluginOptions = {}): Plugin {
  let cfg: ResolvedConfig;
  let outDir = 'dist';
  let isBuild = false;

  return {
    name: 'fallback-forge',

    async configResolved(resolved) {
      cfg = await loadConfig(options.root ?? resolved.root);
      outDir = path.resolve(resolved.root, resolved.build.outDir);
      isBuild = resolved.command === 'build';
    },

    transformIndexHtml(html) {
      const routes = generatedRoutes(cfg);
      const tags: HtmlTagDescriptor[] = [
        { tag: 'script', injectTo: 'head-prepend', children: detectScript(cfg, { routes }) },
      ];
      if (cfg.detection.manualSwitchLink && routes.length > 0) {
        const link = manualSwitchLink(cfg.companionBase);
        tags.push({
          tag: 'a',
          injectTo: 'body',
          attrs: { href: link.href, 'data-ff-switch': '', style: link.style },
          children: link.text,
        });
      }
      return { html, tags };
    },

    configureServer(server) {
      server.middlewares.use(serveLite(cfg));
    },

    configurePreviewServer(server) {
      server.middlewares.use(serveLite(cfg));
    },

    async closeBundle() {
      if (!isBuild || !existsSync(liteDir(cfg))) return;
      const target = path.join(outDir, cfg.companionBase.slice(1));
      await cp(liteDir(cfg), target, { recursive: true });
    },
  };
}

/** Routes with a generated companion page (from generate.json), falling back to configured routes. */
export function generatedRoutes(cfg: ResolvedConfig): string[] {
  const file = generateFile(cfg);
  if (!existsSync(file)) return cfg.routes;
  try {
    const result = JSON.parse(readFileSync(file, 'utf8')) as GenerateResult;
    return result.pages.map((p) => p.route);
  } catch {
    return cfg.routes;
  }
}

type Next = (err?: unknown) => void;

/** Serves `.fallback-forge/lite/**` under the companion base, adding a trailing slash like a static host. */
export function serveLite(cfg: ResolvedConfig) {
  return (req: IncomingMessage, res: ServerResponse, next: Next): void => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const route = routeFromCompanion(cfg.companionBase, url.pathname);
    if (route === undefined) return next();
    if (!url.pathname.endsWith('/')) {
      res.statusCode = 301;
      res.setHeader('Location', `${url.pathname}/${url.search}`);
      res.end();
      return;
    }
    const file = liteFileForRoute(cfg, route);
    if (!existsSync(file)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(`No lightweight page for ${route}. Run \`fallback-forge generate\`.`);
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Length', statSync(file).size);
    res.setHeader('Cache-Control', 'no-cache');
    createReadStream(file).pipe(res);
  };
}
