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
- **Working demo:** TODO — not yet built.
- **Technology stack (planned):** Node.js, Vite plugin, React sample website, Playwright for verification and network throttling; optional AI assistance through an OpenAI-compatible API key or a compatible local model.

### Run the project

Replace these placeholders with commands that actually work for your project:

1. Prerequisites and versions: TODO
2. Dependency installation: TODO
3. Environment setup: TODO — list required variable names and provide a sanitized `.env.example` if needed.
4. Start the project: TODO
5. Run checks or tests: TODO

### Current status

- Working features: None yet — the repository contains the project plan and documentation only.
- Known limitations: No application code, sample website, companion generator, detection script, or Playwright suite exists yet.
- Libraries, APIs, and public datasets used: TODO — include source links and applicable attribution.

## Event details

| Detail | Information |
| --- | --- |
| Event | DevDay Exchange Community Hackathon: Kochi |
| Venue | JAIN University, Kochi |
| Location | [Open the venue map](https://maps.app.goo.gl/Eme7gR7NDXSNRANu5) |
| Rooms | 2008 and 2009 |
| Check-in | 10 October 2026, 6:00 PM IST |
| Kick-off | 10 October 2026, 6:30 PM IST |
| Wrap-up | 11 October 2026, by 10:00 AM IST |
| Participation | Solo or a team of up to 4 participants |
| Theme | Open — build anything you like |

Read [RULES.md](RULES.md) and [AGENTS.md](AGENTS.md) before building. Record meaningful changes in [CHANGELOG.md](CHANGELOG.md) and AI usage in [AI_USAGE.md](AI_USAGE.md). Commit after completed milestones; aim for a meaningful checkpoint about every 30 minutes.

See [AI_USAGE.md](AI_USAGE.md) for AI assistance and [CHANGELOG.md](CHANGELOG.md) for the development record.
