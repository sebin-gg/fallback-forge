# ADR-0001: Companion route: functionality over appearance

- **Status:** Accepted
- **Date:** 2026-10-25

## Context

The companion route exists for visitors on weak or unstable connections. Every
kilobyte and every script is a risk on those connections. The original site's
look is not what those visitors came for; its information and actions are.

## Decision

The generated companion is semantic HTML with a small inline stylesheet and
little or no JavaScript. It never includes a framework, a bundle, a web font,
or decorative images. The only script allowed is a tiny progressive
enhancement for form submission (so the existing JSON API can be reused) and
the manual mode switch. The companion must transfer fewer bytes than the
original under the same test conditions, and `verify` fails if it does not.

## Consequences

- The output is boring on purpose; reviewers should not judge it visually.
- Interactive widgets (carousels, maps, charts) are reduced to their textual
  content or flagged as unsupported in the report.
- Byte budget is a tested property, not a goal.
