# 0015 - Deployment Topology

## Status

Accepted

## Context

ADR 0001 chooses Mode A. The deployment topology should match that decision and avoid unused server artifacts.

## Decision

Deploy only to GitHub Pages from `main` branch `/docs`.

No Dockerfile, Docker Compose, nginx config, Prometheus config, server runbook, or backend deploy directory is included in v1.

## Consequences

- The public surface is static.
- Rollbacks are git reverts.
- There is no server maintenance burden.
- Backend deployment instructions are intentionally absent.

## Alternatives Considered

- Docker backend behind nginx. Rejected by ADR 0001.
- Static frontend served by a custom CDN. Rejected because GitHub Pages is sufficient for v1.
