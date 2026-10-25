# Architecture decision records

One file per decision, numbered, newest at the bottom. Record a decision when
a change alters a contract in `AGENTS.md` §2.1, adds or removes a check, or
overrules an earlier ADR. Typo-, comment-, and docs-only changes need none.

Template: copy `0000-template.md`. Status is `Proposed`, `Accepted`, or
`Deprecated` (link the superseding record).

| ADR                                           | Title                                             | Status   |
| --------------------------------------------- | ------------------------------------------------- | -------- |
| [0001](0001-functionality-over-appearance.md) | Companion route: functionality over appearance    | Accepted |
| [0002](0002-rendered-dom-inspection.md)       | Inspect the rendered DOM, not only the source     | Accepted |
| [0003](0003-ai-proposes-outline-only.md)      | AI proposes a JSON outline; our code renders HTML | Accepted |
| [0004](0004-detection-does-not-remember.md)   | Detection does not remember a manual choice       | Accepted |
