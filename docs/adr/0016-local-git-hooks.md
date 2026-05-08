# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project avoids GitHub Actions. Quality checks need to run locally before commits and pushes.

## Decision

Use plain `.githooks/` scripts wired by `make install-hooks`.

- `pre-commit`: format check, lint, typecheck, secret scan when `gitleaks` is installed.
- `commit-msg`: Conventional Commits validation.
- `pre-push`: `make test`, `make build`, `make smoke`.
- `post-merge` and `post-checkout`: refresh generated build metadata and copied FFmpeg core files when dependencies are present.

## Consequences

- Hooks are transparent shell scripts.
- Contributors can run the same checks through Make targets.
- Missing optional tools produce clear installation guidance.

## Alternatives Considered

- Lefthook. Rejected for v1 to avoid another toolchain dependency.
- No hooks. Rejected because local-only checks need enforcement.
