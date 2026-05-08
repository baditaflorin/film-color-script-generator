# Postmortem

## What Was Built

Film Color Script Generator v0.1.0 is a GitHub Pages static app that accepts local video files, lazy-loads FFmpeg-WASM, samples key frames with a fallback interval sampler, extracts palettes in a Comlink Web Worker, groups frames into scenes, renders a horizontal color-script strip, and exports PNG, SVG, and versioned JSON.

Live site:

https://baditaflorin.github.io/film-color-script-generator/

Repository:

https://github.com/baditaflorin/film-color-script-generator

## Was Mode A Correct?

Yes. Mode A was the right call.

The core workflow needs no secrets, accounts, shared writes, cloud storage, or runtime API. FFmpeg-WASM and browser canvas APIs are enough for v1. Staying on GitHub Pages keeps videos local, avoids server operations, and still delivers the niche study tool.

Mode B was unnecessary because there is no shared static dataset. Mode C would have added privacy risk and deployment burden without unlocking a required v1 feature.

## What Worked

- GitHub Pages from `main` branch `/docs` worked cleanly.
- The initial app shell stayed small at about 28 KB gzipped.
- FFmpeg-WASM could be served from static `docs/vendor/ffmpeg-core/` assets.
- Playwright smoke tests can initialize the WASM engine and render an exportable demo strip.
- Runtime commit display works through the public GitHub commits API, so exact commit metadata does not require a backend.

## What Did Not Work

- The generic `vendor/` gitignore initially hid the FFmpeg core assets from git.
- The first smoke script used a fixed port, which made the pre-push hook vulnerable to stale local servers.
- Embedding git SHA and build time in generated source made deterministic local builds harder.

## Surprises

- FFmpeg-WASM engine initialization in the smoke browser was fast once the static core assets were present.
- GitHub's Dependabot alert lagged local `npm audit` briefly, but the alert was already marked fixed after the PostCSS patch.
- The browser-only architecture felt less constrained than expected for the v1 feature set.

## Accepted Tech Debt

- Scene detection is palette-distance based, not a full cinematography-aware shot-boundary detector.
- Demo data is synthetic and exists mainly for smoke tests and README screenshots.
- Saved projects are not implemented; only small settings are stored in `localStorage`.
- The FFmpeg path favors GitHub Pages compatibility over multi-thread performance.

## Next Improvements

1. Add optional manual scene split/merge controls after generation.
2. Add import support for `.color-script.json` exports.
3. Add a native `<video>` canvas sampling fallback for browsers or files that struggle with FFmpeg-WASM.

## Time Spent Vs Estimate

Estimated: 3-4 hours for a solid v1 static app with docs, hooks, tests, and Pages publishing.

Actual: about 3.5 hours. Most extra time went into Pages asset handling, deterministic build metadata, and making the smoke hook reliable.
