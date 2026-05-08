# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A has no shared remote dataset. The relevant data contract is the local export and optional saved-project shape.

## Decision

Use a versioned JSON contract for color-script exports:

- Schema version: `1`
- File suffix: `.color-script.json`
- Top-level fields: `schemaVersion`, `appVersion`, `source`, `settings`, `scenes`, `generatedAt`
- Scene fields: `index`, `start`, `end`, `duration`, `representativeTime`, `palette`, `average`
- Color fields: `hex`, `rgb`, `weight`

The frontend validates exported/imported JSON with Zod. Breaking changes bump `schemaVersion`.

## Consequences

- No static data fetch is needed at runtime.
- Users can archive analysis results outside the app.
- Future import support can rely on a stable schema.

## Alternatives Considered

- SQLite or Parquet artifacts. Rejected because v1 data is user-generated and small.
- Unversioned JSON. Rejected because export files may be shared and opened by future versions.
