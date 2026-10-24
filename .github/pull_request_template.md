## What does this PR do?

<!-- Short, concrete description. Link the issue it closes, e.g. "Closes #12". -->

## How to test

1. `pnpm install` (or `sfw pnpm install`)
2. `pnpm verify` — lint + format check + unit tests + build + whitespace
3. `pnpm demo:verify` — Playwright comparison of full vs. lite (if inspect,
   generate, detect, verify, or the sample site changed)
4. <!-- Steps to reproduce / verify the specific change -->

## Checklist

Tick only what was actually run.

- [ ] `pnpm verify` passes
- [ ] `pnpm demo:verify` passes, or N/A (explain)
- [ ] `CHANGELOG.md` records this change with its real timestamp and validation
- [ ] `README.md` reflects any setup or behaviour changes, if applicable
- [ ] `AI_USAGE.md` reflects any meaningful agent contribution, if applicable
- [ ] `docs/adr/` updated if a §2.1 contract changed, or N/A
- [ ] No credentials, private data, or generated artifacts are included
- [ ] Companion output stays semantic HTML + minimal CSS; no essential action silently dropped
