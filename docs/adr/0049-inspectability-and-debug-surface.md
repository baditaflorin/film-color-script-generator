# 0049 - Inspectability And Debug Surface

## Status

Accepted

## Context

Power users and support need to see why the app made a decision without adding visible complexity for everyone.

## Decision

Add a `?debug=1` surface that exposes state, preflight, warnings, confidence, plan, and performance marks as JSON.

## Consequences

- Debug data helps reproduce support cases.
- Normal users do not see additional chrome.

## Alternatives Considered

- Console-only debug output. Rejected because production console logging is intentionally minimal.
