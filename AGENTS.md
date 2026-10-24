# AGENTS.md — Fallback Forge

Working rules for agents and humans in this repository. Read this before
touching anything. Numbered sections have stable anchors — cite them in
review ("violates §2.3") instead of pasting prose.

- **§0 Event requirements** — hackathon rules that override everything else.
- **§1 Background** — where things are (read-only orientation).
- **§2 Behaviour** — how to work (contracts, verification, git flow).
- **§3 Output** — what to emit (commits, docs, reports).

## §0 Event requirements

- Read [RULES.md](RULES.md) first. Build the implementation from scratch at
  the event; do not import a pre-built project. Libraries, APIs, and public
  datasets are allowed — document their sources in `README.md`.
- Use Devin (or the agent actually in use) during development and record its
  real contribution in [AI_USAGE.md](AI_USAGE.md). Brief rows, no transcripts.
- Keep [SUBMISSION.md](SUBMISSION.md) current: repository, short
  description, working demo, final commit SHA. Wrap-up is 10:00 AM IST,
  11 October 2026.
- **Never invent results.** Test output, deployment success, AI usage, and
  commit timestamps are recorded only when they actually happened. State
  verified behaviour; mark everything else as planned or TODO.

## §1 Background

- **Project:** a Vite/React developer tool that generates a lightweight
  companion route, switches visitors to it on poor connectivity, and verifies
  essential actions with Playwright. Full concept: [README.md](README.md).
- **Package manager:** `pnpm` only (`pnpm install`, `pnpm run <script>`,
  `pnpm dlx`). Never commit a `package-lock.json` or `yarn.lock`.
- **`sfw` wrapper:** IF `sfw` is on PATH, prefix package-manager commands
  with it (`sfw pnpm install`). ELSE run the bare command. Never install it,
  never fail when it is absent. Do not wrap `git`, `rtk`, or other utilities.
- **Runtime:** Node `>=22` (see `engines` in `package.json`). Playwright
  Chromium is required for `inspect` and `verify`
  (`pnpm exec playwright install chromium`).
- **Decisions:** architecture decisions live in `docs/adr/` (one file per
  decision, linked from `docs/adr/README.md`). This file points at owners; it
  never duplicates them.

### §1.1 Map

- `packages/fallback-forge/` — the tool (plain ESM, no build step).
  - `bin/cli.mjs` — `fallback-forge inspect | generate | verify | run`.
  - `src/config.mjs` — loads and validates `fallback-forge.config.mjs`.
  - `src/inspect/` — source scan (routes, fetch endpoints) + rendered-DOM
    extraction via Playwright → `.fallback-forge/inspect.json`.
  - `src/generate/` — deterministic HTML renderer for the companion route,
    optional AI outline step (OpenAI-compatible API) → `.fallback-forge/lite/`.
  - `src/plugin.mjs` — Vite plugin: injects the detection script, serves
    `/lite/*` in dev, copies it into `dist/` on build.
  - `src/detect/` — the inline client script (network signals, manual mode).
  - `src/verify/` — Playwright runner: throttled visits, bytes, load time,
    console errors, link checks, essential-action checks.
  - `src/report/` — JSON + Markdown report writers.
  - `test/` — `node:test` specs for pure modules.
- `examples/event-site/` — sample Vite/React event website (deliberately
  heavy) with a mock `/api/register` endpoint; the demo target.
- `docs/adr/` — architecture decision records.
- `.github/workflows/ci.yml` — lint, format, unit tests, build, e2e verify.

Behaviour lives in pure, tested modules; the CLI and plugin are wiring. New
logic lands as a module with its spec in the same change.

## §2 Behaviour

### §2.1 Architecture contract (non-negotiable)

- **Functionality over appearance.** The companion route is semantic HTML,
  minimal CSS, little or no JavaScript. Never add a framework, bundle, or
  web font to it.
- **Never silently drop an essential action.** If `generate` cannot preserve
  a declared action (unresolvable endpoint, client-only logic), it must flag
  it in the report. Removing it quietly is a bug.
- **Deterministic core, optional AI.** Every step must work with no API key.
  AI only proposes an outline (JSON); the HTML is always rendered by our own
  code. Never let a model emit raw HTML into the output.
- **Detection is best-effort.** Network signals vary by browser. The
  detection script must never break the full app when signals are missing
  and must always expose a manual switch both ways.
- **Reuse, don't fork.** The companion reuses the project's existing routes
  and API endpoints. No parallel backend.
- **Simple code.** Small functions, clear names, one responsibility per
  module, no speculative abstractions. Agents: cyclomatic complexity ≤ 8 per
  function, ideal ≤ 5.
- **Security.** Never commit `.env`, API keys, tokens, approved QR codes, or
  participant data. AI credentials come only from environment variables
  (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `FALLBACK_FORGE_MODEL`). `.env.example`
  holds names, never values. Gitleaks runs as a pre-commit hook.

### §2.2 Verify (run before you commit)

`pnpm verify` runs the deterministic gate in one command: lint + format
check + unit tests + build + `git diff --check`. Individual steps:

```powershell
pnpm lint            # ESLint flat config, zero warnings
pnpm format:check    # Prettier (fix with pnpm format)
pnpm test            # node:test unit specs
pnpm build           # builds examples/event-site with the plugin
git diff --check     # no whitespace errors
pnpm demo:verify     # Playwright comparison run (slow; needs Chromium)
```

Scoping rubric: IF the change is ≤3 files in one module THEN run its spec
(`node --test packages/fallback-forge/test/<name>.test.mjs`) and lint, ELSE
run `pnpm verify`. Run `pnpm demo:verify` whenever `inspect/`, `generate/`,
`detect/`, `verify/`, or the sample site change — it is the product.

If you touched `.github/workflows/`, run `actionlint` locally (it is on
PATH on the maintainer's machine). Never claim a check passed when it did
not; report what ran and what failed.

### §2.3 Git flow

- **During the event, `main` is the working branch.** Solo participant,
  time-boxed: commit directly to `main` in small, coherent, green commits.
  CI runs on every push. Feature branches and PRs are optional, used for
  risky experiments or post-event work.
- **Commit cadence:** after each completed milestone, about every 30
  minutes while actively building, and before any handoff or break.
  Incomplete work gets an honest `wip:` commit with its state documented.
  No empty commits, no backdating, no squashing away the event record, no
  force-push, no history rewrites.
- **Before pushing:** `git fetch origin` and rebase onto the latest `main`
  if it moved. If a push is rejected, fetch + rebase + push again.
- **Push regularly** when network access is available.

### §2.4 Branch hygiene (when branches are used)

- Before creating a branch or PR, sweep stale ones:
  `git fetch --all --prune`;
  `gh pr list --state all --head <branch> --json number,state`;
  `git ls-remote --heads origin <branch> | wc -l`.
- After a PR merges, delete both halves at once: `gh pr merge
--delete-branch`, or `git push origin --delete <branch>` + `git branch -d`.
- **Squash merges make ancestry checks lie.** `git merge-base --is-ancestor`
  returns false and `git cherry` is unreliable after a squash. Verify by
  content: `git diff origin/main <branch> -- <files-the-branch-authored>`
  (empty = landed).
- Never delete `main`, a branch with an OPEN PR, or a branch whose content
  genuinely differs from `main`. Ask when unsure.

### §2.5 Context discipline (agents)

Main-context budget is the scarcest resource in a long session.

- **Search, don't read.** Locate with `rg`/glob; read only the window you
  need. Never `cat` whole logs or build output.
- **Never dump long tool output.** Quote the shortest decisive line (the
  error, the failing assertion) and move on.
- **Write findings to disk.** Conclusions go in code comments, ADRs, or the
  changelog; cite `path:line` later instead of carrying the payload.
- **Trim the plan, not the code.** Short progress notes; no restating file
  contents to the user.

### §2.6 Tooling notes

- Prefer `rg`, `fd`, `bat`, `eza` over `grep`, `find`, `cat`, `ls` where
  available. Container engine is `podman`.
- Git Bash mangles a lone `/` CLI argument into a Windows path. Run slash-
  leading args with `MSYS_NO_PATHCONV=1`.
- Stale preview servers lie. If verify results look wrong, kill the port the
  preview uses and re-run.

## §3 Output

### §3.1 Commits

Conventional Commits only:
`feat|fix|perf|a11y|chore|docs|test|refactor|ci|build|style|revert|wip(scope):`
(see `commitlint.config.cjs`). Husky enforces it locally; CI re-checks on
PRs. Bypass with `--no-verify` only when hooks are genuinely broken, and say
so in the commit body. Short, descriptive subject; the "why" in the body
when it is not obvious.

### §3.2 Documentation — same commit as the change

- **`CHANGELOG.md`** for every meaningful change: real timestamp with
  timezone, what changed, why, affected files or feature, validation
  performed, known limitations. Newest first.
- **`README.md`** whenever setup, commands, environment requirements,
  behaviour, or demo instructions change.
- **`AI_USAGE.md`** whenever an agent makes a meaningful contribution: task,
  assistance, human review status, checks, corrections.
- **`docs/adr/`** IF the change alters a contract in §2.1, adds or removes a
  check, or overrules a prior decision — ELSE skip.
- **Drop overclaims.** No "zero-config", "works everywhere", "fully tested"
  unless verified. Known limitations go in the README and SUBMISSION.
- Never commit generated artifacts: `dist/`, `node_modules/`,
  `.fallback-forge/`, `test-results/`, `playwright-report/`, `.env`, logs,
  scratch files.

### §3.3 Pull requests (when used)

Open against `main` with `.github/pull_request_template.md` filled in. Tick
only what was actually run. Title follows Conventional Commits.

### §3.4 Before submission

- Complete [SUBMISSION.md](SUBMISSION.md); replace every placeholder.
- README gives reproducible setup and demo steps that match the code.
- Known limitations are disclosed. Changelog and AI usage are current.
- Commit, push, and record the final submitted SHA. Documentation may record
  the SHA in a later commit; never claim later changes belong to the demo.
