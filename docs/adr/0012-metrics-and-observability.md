# 0012 - Metrics And Observability

## Status

Accepted

## Context

The project can run entirely offline after initial load. Usage analytics are not required for v1 success metrics.

## Decision

Use no analytics in v1. Observability is limited to local UI status, processing progress, and local test/smoke results.

## Consequences

- No personal data or behavior telemetry is collected.
- There is no product analytics dashboard.
- Any future analytics must be opt-in, privacy-respecting, and documented in a new ADR and `docs/privacy.md`.

## Alternatives Considered

- Plausible analytics. Rejected for v1 because usage insight is not required.
- Self-hosted beacon endpoint. Rejected because it would require a backend or worker service.
