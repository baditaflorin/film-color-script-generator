# 0042 - Inference Engine

## Status

Accepted

## Context

Users should drop a video and get a useful first strip without manually tuning sample count, cut sensitivity, or frame width.

## Decision

Infer a processing plan from duration, file size, resolution, and risk flags:

- sample count increases with duration but is capped by size/risk;
- frame width decreases for huge/high-risk files;
- cut sensitivity increases for high-variance or cinematic inputs when known;
- confidence and explanations are attached to every inference.

## Consequences

- Defaults become input-aware.
- User overrides remain possible through existing controls.
- Tests can assert recommendations per fixture descriptor.

## Alternatives Considered

- Keep one global default. Rejected because it makes long, short, huge, and static videos feel equally dumb.
