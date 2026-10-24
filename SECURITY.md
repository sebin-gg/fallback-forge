# Security Policy

## Supported versions

Only the `main` branch receives fixes. This is a hackathon prototype, not a
production release.

## Reporting a vulnerability

**Do not open a public issue** for security problems. Report privately:

1. **Preferred:** GitHub private advisory — **Security → Advisories → New
   draft advisory** on this repository.
2. Otherwise contact the maintainer (@sebin-gg) directly through GitHub.

Include, if possible: the affected command or file, steps to reproduce, and
the impact (what an attacker could do).

## Scope notes

- The tool runs locally against a developer-owned project. It starts local
  servers and a headless Chromium; it never binds to non-loopback addresses.
- AI credentials are read only from environment variables and are never
  written to disk, reports, or logs.
