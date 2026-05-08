# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Video processing can fail because of unsupported formats, browser memory pressure, cancelled operations, missing WASM assets, or corrupt files.

## Decision

Represent expected failures with typed `AppError` objects containing a user-safe message, optional detail, and recovery hint. Unexpected errors are normalized at the app boundary and shown through the status/toast UI. Never expose stack traces in production UI.

## Consequences

- User-facing errors stay clear.
- Internal detail remains available in development.
- Feature modules return errors instead of silently swallowing them.

## Alternatives Considered

- Throw raw errors everywhere. Rejected because browser and FFmpeg errors are often too cryptic.
- Hide failures behind generic messages. Rejected because users need actionable recovery paths.
