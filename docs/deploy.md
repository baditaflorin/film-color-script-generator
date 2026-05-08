# Deploy

## Public URL

https://baditaflorin.github.io/film-color-script-generator/

## GitHub Pages Source

Branch: `main`

Folder: `/docs`

GitHub Pages API:

https://api.github.com/repos/baditaflorin/film-color-script-generator/pages

## Publish

```bash
npm install
make build
make smoke
git add docs src/generated/buildInfo.ts
git commit -m "build: publish pages"
git push
```

The built app is committed under `docs/`. This project does not use GitHub Actions.

## Rollback

Revert the commit that changed `docs/`, then push `main`.

```bash
git revert <commit_sha>
git push
```

GitHub Pages will serve the reverted `docs/` output after the next Pages build.

## Custom Domain

No custom domain is configured in v1.

To add one later:

1. Create `docs/CNAME` containing the domain.
2. Configure DNS according to https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
3. Verify HTTPS enforcement in the repository Pages settings.

## Pages Gotchas

- GitHub Pages cannot set arbitrary `_headers` or `_redirects`.
- SPA fallback is handled by copying `docs/index.html` to `docs/404.html`.
- The Vite base path is `/film-color-script-generator/`.
- Service worker scope must remain under `/film-color-script-generator/`.
- FFmpeg-WASM uses the single-thread core because GitHub Pages cannot set COOP/COEP headers for `SharedArrayBuffer`.
