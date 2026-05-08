# Runbook

## Local Preview

```bash
npm install
make build
make pages-preview
```

Open:

http://127.0.0.1:4173/film-color-script-generator/

## Site Returns 404

Check Pages configuration:

```bash
gh api repos/baditaflorin/film-color-script-generator/pages
```

Expected source:

```json
{
  "branch": "main",
  "path": "/docs"
}
```

## WASM Fails To Load

Verify the copied assets exist:

```bash
ls public/vendor/ffmpeg-core
ls docs/vendor/ffmpeg-core
```

Run:

```bash
npm run prepare:ffmpeg
make build
make smoke
```

## Large Video Fails

Try:

- lower sample count
- lower frame width
- shorter clip
- MP4, MOV, or WebM with a standard video track

Browser memory is the primary resource limit in Mode A.

## Release

```bash
make release VERSION=v0.1.0
```

This tags the current commit and pushes the tag. There is no Docker image for Mode A.
