# 0003 - Frontend Framework And Build Tooling

## Status

Accepted

## Context

The interface is a focused tool, not a content-heavy site. The first-load JavaScript budget is less than 200 KB gzipped, while FFmpeg.wasm must be lazy-loaded behind user action.

## Decision

Use Vite, strict TypeScript, Tailwind CSS, and small DOM modules without React/Vue/Svelte in v1.

Vite handles bundling, code splitting, asset hashing, and the GitHub Pages base path. Tailwind provides a constrained styling system. Plain TypeScript keeps the app shell small and makes the FFmpeg chunk the only large runtime dependency.

## Consequences

- The app shell remains lean.
- UI code is explicit and easy to inspect.
- No virtual DOM framework patterns are needed for v1.
- If the UI becomes substantially more complex, a component framework can be introduced later through a new ADR.

## Alternatives Considered

- React with Vite. Rejected for v1 because the UI is not complex enough to justify extra runtime weight.
- Next.js or Remix. Rejected because server and framework routing are unnecessary for GitHub Pages Mode A.
