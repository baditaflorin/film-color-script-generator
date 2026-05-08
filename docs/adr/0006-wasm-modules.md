# 0006 - WASM Modules

## Status

Accepted

## Context

The app needs browser-side video frame extraction. FFmpeg.wasm provides a production-tested FFmpeg build that can run in the browser. GitHub Pages cannot configure COOP/COEP headers, which prevents reliable use of `SharedArrayBuffer` and multi-thread FFmpeg cores.

Official FFmpeg.wasm usage documentation: https://ffmpegwasm.netlify.app/docs/getting-started/usage/

## Decision

Use `@ffmpeg/ffmpeg` with the single-thread `@ffmpeg/core` package. Copy the ESM core files into `public/vendor/ffmpeg-core/` during install/build and load them from the same GitHub Pages origin. Lazy-load FFmpeg only when the user asks to process a video.

Frame palette extraction runs in a Web Worker using Comlink. The worker is JavaScript, not WASM.

## Consequences

- No backend is required for video sampling.
- The app avoids COOP/COEP requirements on GitHub Pages.
- FFmpeg startup has a noticeable one-time cost.
- Multi-thread performance is out of scope for v1.

## Alternatives Considered

- `@ffmpeg/core-mt`. Rejected because it needs cross-origin isolation headers that GitHub Pages cannot set.
- Native `<video>` seek plus canvas only. Rejected as the only path because the product promise explicitly includes FFmpeg-WASM sampling and browser codec support varies.
- Server-side FFmpeg. Rejected by ADR 0001.
