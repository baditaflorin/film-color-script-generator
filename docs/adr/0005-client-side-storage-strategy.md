# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

The app should remember non-sensitive user preferences but should not silently persist large video files. Browser storage varies by device and can be cleared by users.

## Decision

Use `localStorage` for small preferences such as sample count, palette size, scene threshold, and strip mode. Keep video files in memory only while processing. Reserve IndexedDB/OPFS for a later explicit saved-project feature.

## Consequences

- No sensitive or large data is persisted by default.
- Preferences survive reloads.
- The implementation remains simple for v1.
- Long-term project saves require a future ADR.

## Alternatives Considered

- IndexedDB for all state. Rejected because v1 does not need durable large-file storage.
- OPFS for source videos. Rejected because it would surprise users and increase privacy risk.
