# 0040 - Real-Data Audit Findings And Substance Metrics

## Status

Accepted

## Context

The v1 app works on clean short clips but is brittle with longer, larger, partial, orientation-ambiguous, letterboxed, and no-video inputs.

## Decision

Use the 10-input audit in `docs/phase2-substance/realdata-audit.md` as the Phase 2 grading rubric. The target is at least 7/10 useful first-pass outcomes with no manual setting changes.

## Consequences

- Fixtures and expected outputs are required before inference changes.
- Any real-data regression blocks release.
- The postmortem must report before/after pass rate.

## Alternatives Considered

- Continue demo-based testing. Rejected because it does not expose real user failure modes.
