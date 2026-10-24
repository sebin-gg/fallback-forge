# ADR-0003: AI proposes a JSON outline; our code renders HTML

- **Status:** Accepted
- **Date:** 2026-10-25

## Context

An AI model is useful for deciding which parts of a page are essential and
how to condense them. It is not trustworthy as an HTML author: it may drop a
form field, invent a link, inject scripts, or produce inconsistent markup.
The tool must also work with no API key at all.

## Decision

The AI step is optional and limited to proposing an outline as JSON (which
sections to keep, in which order, with condensed text). The outline is
validated against the inspected content (links and form fields must exist in
the source page) and then rendered by the same deterministic renderer used in
the no-AI path. Any OpenAI-compatible chat-completions endpoint is supported
through `OPENAI_BASE_URL`, `OPENAI_API_KEY`, and `FALLBACK_FORGE_MODEL`, which
covers hosted APIs and local servers such as Ollama or LM Studio.

## Consequences

- Output HTML is always safe and consistent regardless of the model.
- The AI cannot add functionality; it can only choose and condense.
- If the AI call fails or returns invalid JSON, generation falls back to the
  deterministic rules and the report says so.
