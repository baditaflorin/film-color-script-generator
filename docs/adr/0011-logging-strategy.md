# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs. Browser console output should be minimal, especially in production.

## Decision

Use a tiny browser logger that emits debug messages only in development. User-visible failures go through the global toast/status surface. Production builds avoid routine console logging.

## Consequences

- Users see actionable errors in the UI.
- The production console stays quiet unless an unexpected browser error occurs.
- There is no centralized log retention.

## Alternatives Considered

- Remote log collection. Rejected because it would add privacy and operations concerns.
- Verbose production console logs. Rejected because the app handles personal local media.
