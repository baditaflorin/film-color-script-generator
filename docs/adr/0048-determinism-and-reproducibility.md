# 0048 - Determinism And Reproducibility

## Status

Accepted

## Context

The same input should produce the same canonical analysis output. Random ordering, wall-clock timestamps, and unstable IDs make tests and trust weaker.

## Decision

Create deterministic scene/frame IDs from source fingerprint and index. Canonical analysis JSON is sorted and timestamp-free. Download artifacts may still have a user-facing export time, but fixture assertions use canonical output.

## Consequences

- Fixture tests can compare byte-identical output.
- Export provenance can explain how to reproduce analysis.

## Alternatives Considered

- Keep `generatedAt` as the only provenance field. Rejected because it prevents deterministic comparison.
