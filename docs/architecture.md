# Architecture

## Context

Film Color Script Generator is a Mode A GitHub Pages application. It processes video files in the browser, extracts frame palettes, groups sampled frames into scenes, and exports local artifacts.

Live URL:

https://baditaflorin.github.io/film-color-script-generator/

Repository:

https://github.com/baditaflorin/film-color-script-generator

## C4 Context

```mermaid
flowchart LR
  user["Person: User<br/>Animation, film, or cinematography study"]
  subgraph pages["System Boundary: GitHub Pages"]
    app["System: Film Color Script Generator<br/>Static browser application"]
  end
  githubApi["External System: GitHub Commit API<br/>Public latest main-branch commit lookup"]
  paypal["External System: PayPal<br/>Optional support link"]
  user -->|"Drops local video, exports palette strip"| app
  app -. "Fetches public commit metadata" .-> githubApi
  user -. "Optional support" .-> paypal
```

## C4 Container

```mermaid
flowchart LR
  user["Person: User"]
  subgraph pages["Container Boundary: GitHub Pages static hosting"]
    ui["Container: Vite TypeScript UI<br/>Drop zone, controls, preview, exports"]
    ffmpeg["Container: FFmpeg-WASM core<br/>Samples key frames and fallback interval frames"]
    worker["Container: Palette worker<br/>Comlink Web Worker"]
    storage[("Container: Browser storage<br/>localStorage preferences")]
  end
  githubApi["External: GitHub Commit API"]
  user --> ui
  ui -->|"Lazy-loads after user action"| ffmpeg
  ui -->|"Transfers decoded frame pixels"| worker
  ui -->|"Reads/writes settings"| storage
  ui -. "Fetches latest commit without auth" .-> githubApi
```

## Module Boundaries

- `src/app.ts`: DOM state, interactions, progress, exports.
- `src/features/color-script/ffmpeg.ts`: FFmpeg-WASM loading and frame extraction.
- `src/features/color-script/palette.ts`: pure color analysis logic.
- `src/features/color-script/scenes.ts`: scene grouping.
- `src/features/color-script/export.ts`: PNG, SVG, and JSON export creation.
- `src/features/color-script/palette.worker.ts`: Comlink worker facade.
- `src/features/storage/preferences.ts`: local preferences.
- `src/features/github/latestCommit.ts`: public commit metadata fetch.

## Deployment Boundary

Only `docs/` is served publicly by GitHub Pages. There is no runtime server, database, Docker image, nginx host, or secret-bearing process.
