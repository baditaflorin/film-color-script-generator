# Privacy

## Summary

Film Color Script Generator is browser-only. Video files are processed locally and are not uploaded by the app.

## Data Processed Locally

- Selected video file, held in browser memory while processing.
- Extracted PNG frames inside FFmpeg-WASM virtual memory.
- Decoded pixels transferred to a local Web Worker.
- Palette, scene, PNG, SVG, and JSON export data generated locally.

## Local Storage

The app stores small preferences in `localStorage`:

- sample count
- palette size
- scene sensitivity
- maximum frame width
- strip mode

It does not store source videos by default.

## Network Requests

The app can fetch public commit metadata from:

https://api.github.com/repos/baditaflorin/film-color-script-generator/commits/main

The header links navigate to:

https://github.com/baditaflorin/film-color-script-generator

https://www.paypal.com/paypalme/florinbadita

## Analytics

No analytics are included in v1.

## Secrets

The frontend contains no secrets. Any value shipped to GitHub Pages is public by definition.
