# 0002 - Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The app needs a responsive browser UI, a heavy video processing path, deterministic color analysis, export generation, and enough isolation to keep the main UI usable while work is in progress.

## Decision

Use these module boundaries:

- `src/main.ts`: application bootstrap, service worker registration, global error handling.
- `src/app.ts`: DOM wiring, state transitions, progress, and user actions.
- `src/features/color-script/ffmpeg.ts`: FFmpeg.wasm loading, frame extraction, and virtual file cleanup.
- `src/features/color-script/palette.ts`: color quantization, palette scoring, contrast helpers, and pure color math.
- `src/features/color-script/scenes.ts`: scene grouping from sampled frame palettes.
- `src/features/color-script/export.ts`: PNG, SVG, and JSON export generation.
- `src/features/color-script/worker.ts`: Comlink worker facade for CPU-heavy frame palette extraction.
- `src/features/storage/`: local persistence adapters.
- `src/generated/buildInfo.ts`: generated version and commit metadata.

## Consequences

- Pure logic can be unit tested without a browser video file.
- FFmpeg.wasm remains lazy-loaded and replaceable.
- Worker and storage concerns stay out of the rendering code.
- The UI can evolve without changing the export contract.

## Alternatives Considered

- A single-file prototype. Rejected because video processing, palette extraction, and export code would become difficult to test.
- A backend-first pipeline. Rejected by ADR 0001.
