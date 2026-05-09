# 0045 - State Taxonomy And State Machine

## Status

Accepted

## Context

Long-running video processing can leave a UI half-ready if cancellation, errors, or repeated clicks are not explicit.

## Decision

Use the state taxonomy in `docs/phase2-substance/states.md`. Generation is guarded by a single active operation. Selecting a new file or cancelling aborts the active operation.

## Consequences

- No stuck state is intentional.
- Repeated generate clicks are ignored while work is active.
- Last completed output can survive recoverable failures.

## Alternatives Considered

- Boolean busy flags only. Rejected because they do not describe recoverable/error states well.
