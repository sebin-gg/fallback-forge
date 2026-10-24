# ADR-0002: Inspect the rendered DOM, not only the source

- **Status:** Accepted
- **Date:** 2026-10-25

## Context

React source is hard to turn into content statically: text is split across
components, data comes from modules or fetches, and forms submit through
`onSubmit` handlers rather than `action` attributes. A static-only inspector
would be fragile and would miss most real content.

## Decision

`inspect` does two things. A light source scan finds route paths
(`<Route path>`, router objects) and API endpoints (`fetch`/`axios` calls)
so the tool knows what to visit and which endpoints exist. Then Playwright
renders each route against the project's own dev or preview server and
extracts headings, paragraphs, lists, links, tables, and form fields from the
live DOM. Endpoint-to-form mapping is proposed from the scan and confirmed by
the developer in the config's essential actions.

## Consequences

- Inspection needs Chromium and a running server; it is slower than a pure
  static pass but far more accurate.
- Content that only appears after user interaction is not captured unless
  an essential action drives it. Such content is flagged in the report.
- The same Playwright dependency is reused by `verify`, so no extra install.
