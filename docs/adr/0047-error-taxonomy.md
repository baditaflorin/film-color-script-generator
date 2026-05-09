# 0047 - Error Taxonomy And Messaging Guidelines

## Status

Accepted

## Context

The same visible failure can mean corrupt file, no video track, unsupported codec, or browser memory limit.

## Decision

Every user-facing error includes:

- what failed;
- why, in video-domain terms;
- now what, as a next step.

Errors are classified as recoverable or fatal.

## Consequences

- Empty, audio-only, truncated, huge, and unsupported cases become distinct.
- Prior completed work is preserved for recoverable errors.

## Alternatives Considered

- One generic catch-all. Rejected because it creates user guesswork.
