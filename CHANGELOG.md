# Change log

Record each meaningful project change during the event, newest first. Update this file in the same commit as the change. Use a real timestamp with timezone, for example `YYYY-MM-DDTHH:MM:SS+05:30`.

## Event build log

## 2026-10-25T07:31:00+05:30 — Detection no longer remembers a manual choice

- Changed:
  - `packages/fallback-forge/src/detect/script.ts`: dropped all `localStorage` use. `?lite=1` and `?lite=0` now apply to the current page load only, and every document load re-evaluates the network.
  - `packages/fallback-forge/src/types.ts`, `src/config.ts`, `src/generate/index.ts`, `src/generate/render.ts`: removed the `detection.storageKey` option and the companion page's "remember full" script, which had no remaining consumer.
  - `packages/fallback-forge/test/detect.test.ts`, `test/render.test.ts`: harness no longer needs storage; the override test now asserts a reload re-detects instead of a remembered value.
  - `README.md`, `docs/demo-script.md`: manual override is per visit; demo needs no `localStorage` reset.
- Why: a stored `full` choice made the detector stop switching in that profile forever. Under 3G that presented as a white screen stuck on `?lite=0` — the fallback never appeared, exactly for the visitors it exists for.
- Validation: `vitest run` 29/29; `pnpm demo:generate` (0 localStorage references in generated pages); scripted Chromium with CDP Slow 3G — fresh load switched in 612 ms, "Use the full site" held `/?lite=0` for that visit, a plain reload switched back in 595 ms, and a load with throttling off stayed on the full app; lite registration returned the success message.
- Limitations: `?lite=1` is also per visit, so a visitor who wants lite permanently must keep using its URL or the switch link; the tool ships no cookie or profile preference.

## 2026-10-25T06:58:28+05:30 — Make the DevTools fallback demo unambiguous

- Changed:
  - `examples/event-site/fallback-forge.config.ts`: set `detection.manualSwitchLink: false` so the plugin stops injecting its floating pill; the sample site already renders its own branded `⚡ Lite mode` header button and footer link, and visitors were seeing three switch links.
  - `docs/demo-script.md`: added the F12 runbook (Network → Slow 3G → reload → `/lite/?ff=effective-type`, switch back, lite form submit) and the `?lite=1` / `?lite=0` backup.
- Why: judges see the fallback switch live, driven by the browser's own DevTools throttling, with no simulator or edited footage.
- Validation: scripted Chromium with CDP network throttling identical to DevTools Slow 3G — auto-switched to `/lite/?ff=effective-type` in 1000 ms; with throttling off the full app stayed put; manual header switch → lite → "Use the full site" round-tripped; lite registration submitted and returned `Registered! Check your email for confirmation.` Switch links confirmed at 2.
- Limitations: emulated profiles only; DevTools throttling changes `navigator.connection` values per Chrome build, and the slow-load timer is the backstop when it does not.

## 2026-10-25T05:10:00+05:30 — Polish event-site demo visuals and finalize submission metadata

- Changed:
  - Reworked `examples/event-site/src/App.jsx`, `Home.jsx`, `Schedule.jsx`, and `Register.jsx` with branded header, hero, stats strip, prize grid, event-details card, countdown banner, room badges, and form layout classes.
  - Rewrote `examples/event-site/src/styles.css` with the visual system (hero, stats, cards, prize grid, schedule table, countdown banner, responsive breakpoints).
  - Updated `SUBMISSION.md` final commit SHA to `b41a2e4a38c63ced32be7cf9756ddc147e985385`.
  - Added `docs/demo-script.md` with live demo script and pitch talking points.
- Why: Maximize demo wow factor ahead of judging while keeping fallback-forge core and CI green.
- Validation: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` (29/29), `pnpm build`, and `pnpm demo:verify` (14/14 essential actions, detection switched to lite) all passed.
- Limitations: Bundle chunk warning (~758 kB) remains; portal submission step requires organizer access.

## 2026-10-25T04:18:00+05:30 — Fix CI Playwright resolution, cspell dictionary, and SonarCloud automatic analysis conflict

- Changed:
  - Updated `.github/workflows/ci.yml` Playwright installation steps to invoke Playwright scoped to `packages/fallback-forge`.
  - Expanded `cspell.json` with project-specific terms and ignored build distribution directories (`**/dist/**`).
  - Disabled SonarCloud conflicting Automatic Analysis via API to allow CI GitHub Actions scanner execution.
- Why: Ensure continuous integration workflows and hygiene checks pass cleanly in GitHub Actions.
- Validation: Ran `actionlint` with zero errors, verified cspell with 0 issues across 61 files, and verified `pnpm verify` passes.
- Limitations: None.

## 2026-10-25T04:10:00+05:30 — Configure CI workflows, SonarCloud integration, and repository secrets

- Changed:
  - Ported and configured GitHub Actions workflows: CodeRabbit assertive review configuration (`.github/coderabbit.yaml`), SonarCloud analysis (`.github/workflows/sonarcloud.yml`), CodeQL security scanning (`.github/workflows/codeql.yml`), repository hygiene (`.github/workflows/hygiene.yml` with cspell, lychee dead-link check, zizmor action security), Dependabot auto-merge (`.github/workflows/dependabot-automerge.yml`), and stale review clearing (`.github/workflows/clear-stale-reviews.yml`).
  - Added CODEOWNERS, cspell dictionary configuration (`cspell.json`), and SonarCloud configuration (`sonar-project.properties`) with test inclusions updated to include TypeScript test files.
  - Configured repository secret `SONAR_TOKEN` via GitHub CLI and synchronized the SonarCloud project key to `sebin-gg_fallback-forge`.
- Why: Establish comprehensive continuous integration, automated code review, static analysis quality gates, and automated dependency maintenance for the project.
- Validation: Verified SonarCloud project key mapping via API, confirmed secret presence via `gh secret list`, and ran `pnpm verify` cleanly.
- Limitations: SonarCloud quality gate requires initial GitHub Actions execution upon push to main.

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
