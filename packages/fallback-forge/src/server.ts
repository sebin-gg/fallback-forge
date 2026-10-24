import type { ResolvedConfig } from './types.js';

export interface RunningServer {
  baseUrl: string;
  close(): Promise<void>;
}

/** Start the project's Vite dev server (used by `inspect`). */
export async function startDevServer(cfg: ResolvedConfig): Promise<RunningServer> {
  const { createServer } = await import('vite');
  const server = await createServer({
    root: cfg.root,
    configFile: undefined,
    logLevel: 'warn',
    server: { port: cfg.devPort, strictPort: false, host: '127.0.0.1', open: false },
    ...(await viteConfigFile(cfg.root)),
  });
  await server.listen();
  const address = server.httpServer?.address();
  const port = typeof address === 'object' && address ? address.port : cfg.devPort;
  return { baseUrl: `http://127.0.0.1:${port}`, close: () => server.close() };
}

/** Build the project and serve `dist/` with Vite preview (used by `verify`). */
export async function buildAndPreview(cfg: ResolvedConfig): Promise<RunningServer> {
  const { build, preview } = await import('vite');
  const shared = { root: cfg.root, logLevel: 'warn' as const, ...(await viteConfigFile(cfg.root)) };
  await build(shared);
  const server = await preview({
    ...shared,
    preview: { port: cfg.previewPort, strictPort: false, host: '127.0.0.1', open: false },
  });
  const address = server.httpServer.address();
  const port = typeof address === 'object' && address ? address.port : cfg.previewPort;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.httpServer.close(() => resolve())),
  };
}

async function viteConfigFile(root: string): Promise<{ configFile?: string }> {
  const { existsSync } = await import('node:fs');
  const path = await import('node:path');
  const candidates = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs', 'vite.config.mts'];
  const found = candidates.map((f) => path.join(root, f)).find((f) => existsSync(f));
  return found ? { configFile: found } : {};
}
