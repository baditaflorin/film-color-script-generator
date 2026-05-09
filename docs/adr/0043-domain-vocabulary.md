# 0043 - Domain Vocabulary And UI Language

## Status

Accepted

## Context

Generic errors like "processing failed" do not help users understand video-specific problems.

## Decision

Use film/video language in status and errors:

- video track
- source duration
- display orientation
- sampling plan
- letterbox risk
- low-confidence palette
- browser memory budget

## Consequences

- Errors become actionable.
- Export provenance is understandable to non-developers.

## Alternatives Considered

- Expose FFmpeg errors directly. Rejected because they are often too technical and incomplete.
