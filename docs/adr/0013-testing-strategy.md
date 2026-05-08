# 0013 - Testing Strategy

## Status

Accepted

## Context

The highest-risk logic is palette extraction, scene grouping, export schema generation, build output, and Pages runtime behavior. FFmpeg.wasm itself is a third-party dependency and should be smoke-tested through the UI.

## Decision

Use:

- Vitest for pure TypeScript unit tests.
- Playwright for a happy-path smoke/e2e test against the built `docs/` output.
- `scripts/smoke.sh` to build, serve Pages output locally, and run Playwright.
- `make test`, `make build`, `make smoke`, and `make lint` as the local quality gates.

## Consequences

- Tests remain fast enough for local hooks.
- Pure logic is covered without loading FFmpeg.wasm.
- Browser smoke tests catch broken Pages base paths and missing assets.

## Alternatives Considered

- GitHub Actions. Rejected because checks must run locally.
- Manual-only testing. Rejected because export and build regressions are easy to miss.
