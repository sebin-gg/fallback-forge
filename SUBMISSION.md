# Project submission

Complete this file during the hackathon and use it to prepare your submission through the method announced by the organizers. Do not submit your project to the template repository.

## Project

- **Project name:** Fallback Forge (`fallback-forge`)
- **Track:** BLW — Works Anyway
- **Short description:** Websites that depend on heavy JavaScript bundles, images and third-party scripts become unusable on weak or unstable connections. Fallback Forge is a developer tool for Vite/React projects that generates a lightweight companion version of a website (semantic HTML, minimal CSS, little or no JavaScript), switches visitors to it when configured network conditions indicate poor connectivity, and uses Playwright to verify that declared essential actions still work in both versions under the same throttled conditions. It helps developers keep critical user journeys — such as finding an event deadline or submitting a registration form — usable when the network fails, and it reports clearly where functionality cannot be preserved.
- **Code repository URL:** https://github.com/sebin-gg/fallback-forge
- **Final submitted implementation commit SHA:** b41a2e4a38c63ced32be7cf9756ddc147e985385
- **Working demo URL or local demo steps:** Local demo via `pnpm dev` (interactive app with `/lite/*` companion route) and automated comparison verify run via `pnpm demo:verify`.
- **Demo access requirements:** Node.js >= 22 and pnpm >= 9. No external accounts or API keys required; core generation and verification run fully offline.

## Participants

Participate solo or in a team of up to 4. Remove unused rows.

| Participant name | GitHub handle | Contribution                                            |
| ---------------- | ------------- | ------------------------------------------------------- |
| Sebin Mathew     | @sebin-gg     | Project architecture, implementation, and documentation |

## Run and demonstrate

- **Prerequisites and versions:** Node.js >= 22, pnpm >= 9, Playwright Chromium (`pnpm exec playwright install chromium`).
- **Install command:** `pnpm install && pnpm exec playwright install chromium`
- **Required environment variable names:** None for core functionality. Optional: `OPENAI_API_KEY` (and optional `OPENAI_BASE_URL`, `FALLBACK_FORGE_MODEL`) for AI outline condensation.
- **Start command:** `pnpm dev` (dev server) or `pnpm demo:verify` (full inspect, generate, and verify pipeline)
- **Demo walkthrough:**
  1. `pnpm demo:inspect`: Scans the React codebase and extracts rendered DOM semantics and interactive endpoints into `.fallback-forge/inspect.json`.
  2. `pnpm demo:generate`: Generates lightweight companion HTML pages with inline micro-CSS and progressive-enhancement form scripts in `.fallback-forge/lite/` (~3 KB per page, 99-100% reduction).
  3. `pnpm demo:verify`: Starts the preview server, emulates slow-3g (400 kbps) and fast-3g (1600 kbps) network profiles using Playwright CDP, tests cold byte transfers and load times, verifies all 7 declared essential actions across both full and lite versions, tests automatic network-adaptive switching, and emits comparison reports.
  4. In dev mode (`pnpm dev`), visiting `http://localhost:5173/` demonstrates the full React app; simulating poor network or selecting the manual switch redirects to `http://localhost:5173/lite/`.
- **Checks performed and results:**
  - `pnpm verify` passed: ESLint clean (0 errors, 0 warnings), Prettier clean, TypeScript clean, 29/29 Vitest tests passed, Vite build passed, Git diff clean.
  - `pnpm demo:verify` passed: 14/14 essential actions passed (text search, link navigation, form submission to `/api/register`).
  - Byte reduction: `/` saved 100% (4405.7 KB -> 3.0 KB, load time 90s -> 1.0s on slow-3g), `/register` saved 99% (343.2 KB -> 3.4 KB), `/schedule` saved 99% (343.2 KB -> 2.5 KB). Automatic switch triggered in 1061 ms under slow-3g. Zero console errors, zero broken links.
- **Known limitations or incomplete features:**
  - The first version targets developer-owned Vite/React projects, not arbitrary third-party websites.
  - NetworkInformation API support varies by browser (gracefully degrades via Save-Data and slow-load fallback timers).
  - AI outline condensation requires an optional OpenAI-compatible API key; fallback deterministic rules work out of the box with zero external dependencies.
- **Libraries, APIs, and public datasets used:**
  - `playwright`: Headless browser testing and CDP network emulation.
  - `vite` & `@vitejs/plugin-react`: Dev server, build system, and plugin middleware.
  - `zod`: Schema validation.
  - `ai` & `@ai-sdk/openai-compatible`: Optional AI outline condensation.
  - `jiti`: Runtime TypeScript configuration loading.
  - `vitest`: Unit test framework.
  - `react`, `react-dom`, `react-router`, `framer-motion`, `recharts`, `dayjs`: Sample event site demo dependencies.
- **AI usage record:** [AI_USAGE.md](AI_USAGE.md)
- **Development change log:** [CHANGELOG.md](CHANGELOG.md)

## Submission checklist

- [x] The project implementation started from scratch at the event.
- [x] I participated solo or with no more than 4 team members in total.
- [x] Codex was used during development and its usage is documented.
- [x] The code repository URL, short description, and working demo are provided.
- [x] README setup and demo instructions match the submitted code.
- [x] Actual checks and known limitations are documented.
- [x] Meaningful changes are documented and committed throughout development.
- [x] The final implementation is committed and pushed, and its SHA is recorded above.
- [x] No credentials or private data are included in the repository or demo instructions.
- [x] The organizers' announced submission method and timing have been followed.

Event reference: [DevDay Exchange Community: Kochi on Luma](https://luma.com/z10nz8gp). The event wraps up by **10:00 AM IST on 11 October 2026**.
