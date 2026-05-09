# 0046 - Performance Budgets

## Status

Accepted

## Context

Mode A performance depends on browser memory, FFmpeg-WASM startup, and frame analysis cost.

## Decision

Use the budgets in `docs/perf/phase2-budgets.md`. Preflight must be fast and deterministic. Heavy analysis stays in workers/WASM. Operations over 300 ms show progress; operations over 5 seconds must be cancellable.

## Consequences

- Huge files receive warnings before generation.
- Fixture tests track preflight determinism and performance class.

## Alternatives Considered

- Optimize only after complaints. Rejected because huge inputs are already a known audit risk.
