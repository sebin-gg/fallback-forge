# Fallback Forge

### Keep essential websites usable when the network fails.

**Track:** BLW — Works Anyway

**[Event and registration on Luma](https://luma.com/z10nz8gp)** · **[Event rules](RULES.md)** · **[Agent instructions](AGENTS.md)** · **[Submission](SUBMISSION.md)**

## The problem

Websites often depend on large JavaScript bundles, images, third-party scripts and complex interfaces. On weak or unstable internet connections, users may struggle to access essential information or complete important tasks.

Developers can optimize their websites manually, but building a lightweight alternative and ensuring that it preserves the original website's functionality takes time.

## The solution

Fallback Forge is a developer tool that creates a lightweight companion version of an existing Vite/React website, switches visitors to it when configured network conditions indicate poor connectivity, and automatically tests whether essential tasks still work.

It prioritizes **functionality over appearance**.

## How it works

**1. Inspect**

A developer runs Fallback Forge on a Vite/React project. The tool inspects the available source code, routes, content, forms and interactive components.

**2. Generate**

An optional AI model identifies essential information and proposes a lightweight companion route. The generated version uses semantic HTML, minimal CSS and little or no JavaScript.

Developers can use their own AI API key or configure a compatible local model. AI is optional; deterministic rules handle basic simplification.

**3. Preserve essential actions**

The developer reviews and approves the critical actions that must remain available, such as finding an event deadline, opening registration or submitting a form.

Fallback Forge reuses supported routes and API endpoints. If it cannot safely preserve an action, it flags the problem instead of silently removing the functionality.

**4. Switch automatically**

A lightweight detection mechanism uses available signals, such as Data Saver preferences, supported network information and configured performance thresholds. When a condition triggers, visitors can be directed to the companion route before loading the full application.

Users can also select lightweight mode manually. Browser support and network signals vary, so automatic detection is best-effort rather than guaranteed.

**5. Verify**

Playwright tests the original and lightweight versions under the same network conditions.

It checks essential user journeys, broken links, form submissions, console errors, load times and transferred bytes.

**6. Report**

Developers receive a comparison report showing which actions passed, which failed, how much data each version transferred and where manual intervention is needed.

## Hackathon MVP

Build a Vite integration that supports one sample React website.

The demonstration will:

- Generate one lightweight companion route.
- Preserve event details, navigation and a working test-registration flow.
- Trigger lightweight mode under configured slow-network conditions.
- Run Playwright tests against both versions using network throttling.
- Report task completion and transferred-byte differences.
- Allow developers to use an AI API key or a compatible local model for conversion assistance.

## What makes it different?

Fallback Forge combines three steps in one developer workflow:

**Generate. Adapt. Verify.**

It is not another website speed checker or generic text-only proxy. Its objective is to help developers create a tested fallback for important user journeys, rather than only report that a website is slow.

The distinguishing feature is the integration of AI-assisted conversion, connectivity-aware delivery and measurable task preservation.

## Success criteria

The MVP succeeds when:

- The original and lightweight versions expose the same declared essential actions.
- All defined critical tasks pass in the lightweight version under the tested network conditions.
- The companion transfers fewer bytes than the original under comparable test conditions.
- Unsupported functionality is reported clearly.
- The developer can reproduce the results through an automated test run.

## Scope and limitations

The first version supports developer-owned Vite/React projects, not arbitrary third-party websites. It does not promise automatic conversion of every application or preservation of every possible workflow.

The working name is **Fallback Forge**. Trademark and domain availability must be checked before public release.

**Core promise:** When a website becomes too heavy for the connection, Fallback Forge helps developers deliver a lighter experience without abandoning the tasks users came to complete.

## Project overview

- **Project name:** Fallback Forge (`fallback-forge`)
- **Short description:** A Vite/React developer tool that generates a lightweight companion version of a website, switches visitors to it on poor connectivity, and verifies with Playwright that essential tasks still work. It helps developers keep critical user journeys usable on weak networks.
- **Team:** Sebin Mathew (@sebin-gg)
- **Working demo:** Local Vite demo site with companion route at `/lite/*`, automated Playwright throttling comparison runner via `pnpm demo:verify`.
- **Technology stack:** Node.js (>=22), TypeScript, Vite plugin, React 19 demo site (react-router v8, framer-motion, recharts, dayjs), Playwright for verification and network emulation, optional Vercel AI SDK for LLM-assisted condensation.

### Run the project

1. **Prerequisites and versions:** Node.js `>=22`, `pnpm >=9`, Playwright Chromium installed (`pnpm exec playwright install chromium`).
2. **Dependency installation:** `pnpm install`
3. **Environment setup:** (Optional) Copy `.env.example` to `.env` if using AI outline condensation (`OPENAI_API_KEY`). Deterministic generation works fully without any API key.
4. **Start the project:**
   - Dev server: `pnpm dev` (opens sample site at `http://localhost:5173`, companion route served at `http://localhost:5173/lite/`).
   - Production preview: `pnpm preview`
5. **Run checks or tests:**
   - Deterministic test gate: `pnpm verify` (lint + format check + typecheck + unit tests + build + whitespace check).
   - End-to-end verification demo: `pnpm demo:verify` (builds sample site, throttles to slow-3g & fast-3g, tests task preservation and data savings).

### Current status

- **Working features:**
  - `inspect`: AST/regex source scanner extracting routes and fetch endpoints; in-browser rendered DOM extraction via Playwright CDP.
  - `generate`: Deterministic semantic HTML generation with inline micro-CSS (~400B), form progressive enhancement, and internal route rewriting; optional LLM condensation via OpenAI-compatible endpoints.
  - `detect`: Client-side detection script injected via Vite plugin evaluating Save-Data headers, NetworkInformation API (effectiveType, downlink, RTT), and slow-load fallback timers.
  - `verify`: Playwright automated comparison runner under slow-3g (400 kbps) and fast-3g (1600 kbps) testing cold byte transfer, load times, console errors, broken links, and functional assertions for text, navigation links, and form submissions.
  - `report`: Automated Markdown and JSON comparison reports summarizing transferred bytes, savings percentages, and task status.
  - Sample Event Website (`examples/event-site`): Heavy (~4.5MB) React 19 app with dynamic charts and mock registration API demonstrating >99% byte reduction (from 4.5MB to 3.0KB) and instant fallback.
- **Known limitations:**
  - Targets developer-owned Vite/React projects (not arbitrary unowned third-party websites).
  - NetworkInformation API support varies by browser (gracefully degrades via Save-Data and slow-load fallback timers).
- **Libraries, APIs, and public datasets used:**
  - `playwright`: Headless browser testing and CDP network emulation.
  - `vite` & `@vitejs/plugin-react`: Build system and Vite plugin integration.
  - `zod`: Schema validation for configuration and outline generation.
  - `ai` & `@ai-sdk/openai-compatible`: Optional outline condensation.
  - `jiti`: TypeScript runtime config loading.
  - `vitest`: Unit test framework.
  - `react`, `react-dom`, `react-router`: Sample event application framework.
  - `framer-motion`, `recharts`, `dayjs`: Sample application dependencies (deliberately heavy demo assets).

## Event details

| Detail        | Information                                                     |
| ------------- | --------------------------------------------------------------- |
| Event         | DevDay Exchange Community Hackathon: Kochi                      |
| Venue         | JAIN University, Kochi                                          |
| Location      | [Open the venue map](https://maps.app.goo.gl/Eme7gR7NDXSNRANu5) |
| Rooms         | 2008 and 2009                                                   |
| Check-in      | 10 October 2026, 6:00 PM IST                                    |
| Kick-off      | 10 October 2026, 6:30 PM IST                                    |
| Wrap-up       | 11 October 2026, by 10:00 AM IST                                |
| Participation | Solo or a team of up to 4 participants                          |
| Theme         | Open — build anything you like                                  |

Read [RULES.md](RULES.md) and [AGENTS.md](AGENTS.md) before building. Record meaningful changes in [CHANGELOG.md](CHANGELOG.md) and AI usage in [AI_USAGE.md](AI_USAGE.md). Commit after completed milestones; aim for a meaningful checkpoint about every 30 minutes.

See [AI_USAGE.md](AI_USAGE.md) for AI assistance and [CHANGELOG.md](CHANGELOG.md) for the development record.
