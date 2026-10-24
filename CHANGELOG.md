# Change log

Record each meaningful project change during the event, newest first. Update this file in the same commit as the change. Use a real timestamp with timezone, for example `YYYY-MM-DDTHH:MM:SS+05:30`.

## Event build log

## 2026-10-25T02:40:00+05:30 — Implement Fallback Forge tool, sample event site, and verify pipeline

- Changed:
  - Built core tool package `packages/fallback-forge`: configuration loader (`src/config.ts`), source and DOM inspection (`src/inspect/`), companion route generator (`src/generate/`), client-side detection script (`src/detect/`), Vite plugin (`src/plugin.ts`), Playwright verification suite (`src/verify/`), Markdown/JSON reporter (`src/report/`), and CLI binary (`src/bin/cli.ts`).
  - Built sample React/Vite event demo site `examples/event-site`: React 19, react-router v8, framer-motion hero animations, recharts data visualization, dayjs schedule countdown, mock registration API (`/api/register`), asset generation script (3 large PNGs + 437KB analytics script, simulating an ~4.5MB web app).
  - Configured monorepo tooling: pnpm workspace, TypeScript 5.8+, ESLint flat config with zero warnings (`--max-warnings 0`), Prettier formatting, Vitest unit test suite (29 tests across 7 test files), GitHub Actions CI.
- Why: Deliver complete working MVP demonstrating automated lightweight fallback route generation, adaptive network detection, and verified essential task preservation.
- Validation:
  - Deterministic verification gate `pnpm verify` passed: ESLint clean, Prettier clean, TypeScript compilation clean, 29/29 Vitest tests passed, Vite build passed, Git diff clean.
  - End-to-end verification `pnpm demo:verify` passed: 14/14 essential actions passed on both full and lite versions across `slow-3g` (400 kbps) and `fast-3g` (1600 kbps) profiles. Lite version achieved 99-100% byte savings across all routes (4.5 MB -> 3.0 KB on `/`, 351 KB -> 3.4 KB on `/register`, 351 KB -> 2.5 KB on `/schedule`). Automatic switch triggered in 1061 ms under `slow-3g`. Zero console errors, zero broken links.
- Limitations: AI condensation requires an optional OpenAI-compatible API key; fallback deterministic rules work out of the box with no external services or API keys. First version targets developer-owned Vite/React projects.

## 2026-10-25T01:05:00+05:30 — Add Fallback Forge project description

- Changed: Rewrote `README.md` around the Fallback Forge concept (problem, solution, how it works, hackathon MVP, differentiation, success criteria, scope and limitations, planned technology stack) while keeping the event details and workflow guidance. Filled the short description, track, and scope limitations in `SUBMISSION.md`.
- Why: Record the project idea and MVP plan for the BLW — Works Anyway track before implementation begins.
- Validation: Reviewed Markdown structure and relative links (`RULES.md`, `AGENTS.md`, `SUBMISSION.md`, `CHANGELOG.md`, `AI_USAGE.md`).
- Limitations: Documentation only. No application code, demo, run commands, or test results exist yet; those items remain TODO.

## 2026-10-25T00:38:00+05:30 — Initialize project metadata and participant details

- Changed: Updated `SUBMISSION.md`, `README.md`, `AI_USAGE.md`, and `CHANGELOG.md` with project name (`fallback-forge`), repository URL (`https://github.com/sebin-gg/fallback-forge`), and participant details (`Sebin Mathew`, `@sebin-gg`).
- Why: Configure repository template with participant and project identifiers.
- Validation: Verified markdown link validity and consistency.
- Limitations: Application implementation and demo details remain TODO.

## Template setup — 10 October 2026

- Changed: Added the event README, rules, agent guide, change log, AI usage record, submission checklist, Git ignore rules, and pull request checklist.
- Why: Give participants a consistent starting point for event rules, basic coding patterns, documented changes, and regular commits.
- Validation: Checked local Markdown links, event detail consistency, required documents, and diff whitespace before publishing.
- Limitations: Documentation scaffolding only; no participant project, application, or working demo is included. GitHub publication and template status are verified separately after creation.
