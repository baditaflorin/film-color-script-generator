# 0041 - Input Robustness And Normalization Policy

## Status

Accepted

## Context

Video files can be empty, huge, audio-only, truncated, orientation-tagged, variable-frame-rate, or simply too expensive for a browser WASM pipeline.

## Decision

Add a deterministic preflight layer before generation. It normalizes file size, type, duration, dimensions, orientation hints, and source fingerprint. It returns either a blocking domain error or a recommended processing plan with warnings.

## Consequences

- Generation is disabled for known-doomed files.
- Huge and risky files become explicit choices, not surprises.
- Preflight output becomes export provenance.

## Alternatives Considered

- Let FFmpeg discover every issue later. Rejected because it is slower and produces poorer user guidance.
