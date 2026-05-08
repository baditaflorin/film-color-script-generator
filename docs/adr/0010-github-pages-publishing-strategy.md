# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live URL must work from the start and remain a first-class deliverable. GitHub Pages can serve static output from `main` branch `/docs`.

## Decision

Publish from `main` branch `/docs`.

Vite builds directly into `docs/`, with `base` set to `/film-color-script-generator/`. The repo intentionally does not gitignore `docs/`, even though generic build directories such as `dist/` remain ignored. `docs/404.html` mirrors `docs/index.html` for SPA fallback safety. Hashed assets live under `docs/assets/`.

Live URL:

https://baditaflorin.github.io/film-color-script-generator/

## Consequences

- Pages deployment is transparent in git history.
- Rollback is a normal git revert of the publishing commit.
- Built assets increase repository size, but the site can be served without GitHub Actions.
- Service worker scope must use the Vite base path.

## Alternatives Considered

- `gh-pages` branch. Rejected because it hides built artifacts from the main branch history.
- GitHub Actions deployment. Rejected because the project explicitly avoids GitHub Actions.
- Publishing from repo root. Rejected to keep source and built app separate.
