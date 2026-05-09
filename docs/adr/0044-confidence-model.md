# 0044 - Confidence Model

## Status

Accepted

## Context

The strip can look authoritative even when scene detection, frame timing, or palette quality is weak.

## Decision

Represent confidence as `high`, `medium`, or `low` plus numeric score from 0 to 1. Apply it to preflight, frames, scenes, and exports. Confidence reasons are stored as human-readable strings.

## Consequences

- Low-confidence results can be shown and exported honestly.
- Fixture tests can assert that risky inputs are not wrong-but-confident.

## Alternatives Considered

- Numeric-only confidence. Rejected because labels are clearer in the UI.
