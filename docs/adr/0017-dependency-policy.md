# 0017 - Dependency Policy

## Status

Accepted

## Context

The app depends on browser video processing, strict typing, tests, and static deployment. Dependencies should be production-ready and limited.

## Decision

Use established packages only:

- Vite and TypeScript for builds.
- Tailwind CSS for styling.
- FFmpeg.wasm for video frame extraction.
- Comlink for worker calls.
- Zod for export schema validation.
- Vitest and Playwright for tests.
- ESLint and Prettier for local checks.

Pin exact resolved versions in `package-lock.json`. Run `npm audit` and document any accepted risk.

## Consequences

- The initial app shell stays small.
- Heavy FFmpeg assets are isolated and lazy-loaded.
- Updates are deliberate and reviewable.

## Alternatives Considered

- Custom video parser or palette framework. Rejected because browser media processing is subtle and risky.
- Large UI framework by default. Rejected by ADR 0003.
