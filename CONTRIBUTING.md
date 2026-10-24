# Contributing to Fallback Forge

Thanks for helping. This is a hackathon project (DevDay Exchange Community
Hackathon: Kochi, 10–11 October 2026); the full working rules live in
[AGENTS.md](AGENTS.md). This file is the short human version.

## Development setup

```powershell
pnpm install                              # sfw pnpm install if sfw is on PATH
pnpm exec playwright install chromium     # needed by inspect + verify
pnpm dev                                  # sample event site on http://localhost:5173
```

Node `>=22` and pnpm `>=10` are required. The repo is a pnpm workspace:
`packages/fallback-forge` is the tool, `examples/event-site` is the demo
target.

## Making changes

1. Keep changes small and coherent. One concern per commit.
2. Behaviour goes in pure modules under `packages/fallback-forge/src/**`
   with a `node:test` spec beside it in `test/`. CLI and plugin files are
   wiring only.
3. Run `pnpm verify` before committing (lint, format, unit tests, build,
   whitespace). Run `pnpm demo:verify` if you touched inspect, generate,
   detect, verify, or the sample site.
4. Update `CHANGELOG.md` (and `README.md` / `AI_USAGE.md` when relevant) in
   the same commit.
5. Commit with a Conventional Commits message; husky + commitlint enforce
   it.

## Code expectations

- Plain ESM JavaScript with JSDoc types; no build step for the tool.
- Prettier is the single source of truth for formatting (`pnpm format`).
- ESLint must report zero warnings.
- The companion route stays semantic HTML + minimal CSS. No frameworks,
  fonts, or bundles there.
- Never remove or silently skip a declared essential action; flag it.
- Never commit secrets. `.env.example` lists variable names only.

## Reporting problems

Open an issue with steps to reproduce, the command you ran, and the shortest
relevant output. For security problems see [SECURITY.md](SECURITY.md).
