# 0009 - Configuration And Secrets Management

## Status

Accepted

## Context

Mode A should not require secrets. The frontend is public and any build-time variable is visible to users.

## Decision

Use Vite public build variables only for non-sensitive values such as app version, commit, repository URL, PayPal URL, and GitHub Pages base path. Commit `.env.example` with placeholders. Do not use runtime secrets.

## Consequences

- There are no secrets to rotate for v1.
- Gitleaks remains part of local hooks to guard accidental commits.
- Any future secret-bearing feature requires Mode B offline generation or Mode C backend reconsideration.

## Alternatives Considered

- BYO user keys. Rejected because no API keys are needed.
- Encrypted frontend secrets. Rejected because frontend secrets are not secrets.
