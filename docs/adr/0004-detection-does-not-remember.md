# ADR-0004: Detection does not remember a manual choice

- **Status:** Accepted
- **Date:** 2026-10-25

## Context

The first detector implementation stored the visitor's manual choice in
`localStorage` under `detection.storageKey`, and treated `full` as a permanent
opt-out: `if (s === "full") return`. That reads well in theory and badly in
practice. A visitor who clicked "Use the full site" once on a slow connection
never saw the fallback again, so under a 3G profile the page sat on the white
screen of an unloaded 4.5 MB bundle, stuck on `?lite=0`. The feature failed for
exactly the visitors it exists for, and a demo presenter could not reproduce
the switch without clearing browser storage.

`AGENTS.md` §2.1 requires a manual switch both ways and best-effort detection
that never breaks the full app; it does not require the choice to persist.

## Decision

Detection is stateless. `?lite=1` and `?lite=0` apply to the current document
load only, every load re-evaluates the network, and the tool stores nothing in
the browser. The `detection.storageKey` option and the companion page's
`localStorage` writer are removed rather than left as dead configuration.

## Consequences

- A slow visitor can always reach the fallback, and a fast visitor is never
  trapped in it: there is no state to go stale.
- Nothing needs resetting between demo runs, and the tool sets no cookie,
  writes no storage, and needs no consent surface.
- `?lite=0` is weaker than before: it holds for one page load, and any reload
  on a poor connection switches to the companion. A visitor who wants the full
  site permanently must keep the plain URL and a connection that does not
  trigger detection.
- Manual switching between the two versions stays available on every load
  (header button, footer link, and the query parameter), which satisfies the
  §2.1 contract.
