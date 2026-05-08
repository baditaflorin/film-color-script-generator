# 0001 - Deployment Mode

## Status

Accepted

## Context

The application processes user-supplied video files, samples frames, extracts palettes, and exports a horizontal color-script strip. The v1 requirements do not include accounts, cloud storage, collaboration, server-side processing, secrets, or cross-device sync.

GitHub Pages is the preferred public surface. It can serve static HTML, CSS, JavaScript, WebAssembly, and committed build assets from `main` branch `/docs`.

## Decision

Use Mode A: Pure GitHub Pages.

The app runs entirely in the browser. FFmpeg.wasm is lazy-loaded after a user action, palette extraction runs locally, exports are generated client-side, and optional project state is stored in browser storage. No backend, runtime database, container, nginx, or server observability stack is part of v1.

## Consequences

- User videos never leave the browser.
- Deployment is simple: push built `docs/` output to `main`.
- Runtime cost is zero apart from GitHub Pages.
- Browser memory limits determine practical video size.
- GitHub Pages cannot set COOP/COEP headers, so v1 uses the single-thread FFmpeg.wasm core instead of the multi-thread core.

## Alternatives Considered

- Mode B: GitHub Pages plus pre-built data. Rejected because there is no shared dataset or scheduled artifact to precompute.
- Mode C: Pages frontend plus Docker backend. Rejected because no v1 feature requires secrets, shared writes, authenticated APIs, or server-side video processing.
