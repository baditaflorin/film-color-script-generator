# Phase 2 Substance Postmortem

Date: 2026-05-09

Mode stayed Mode A: pure GitHub Pages. That was still correct. The hard work was browser-side inference, not a missing backend.

## Real-Data Pass Rate

Baseline from the v1 audit: 2 / 10 solid, 3 / 10 partial, 5 / 10 weak or failed.

Phase 2 result: 10 / 10 inputs now receive preflight coverage. 8 / 10 are immediately useful or useful-with-warning; 2 / 10 are correctly blocked before generation.

| #   | Fixture class           | Before                 | After                                                                  |
| --- | ----------------------- | ---------------------- | ---------------------------------------------------------------------- |
| 1   | Clean MP4               | Pass, under-specified. | Pass with confidence, source fingerprint, and export provenance.       |
| 2   | WebM                    | Pass, opaque.          | Pass with codec/container warning.                                     |
| 3   | Animation with cuts     | Sometimes merged.      | Better inferred plan; still not frame-perfect shot detection.          |
| 4   | Longer animation sample | Cost opaque.           | Cost-aware sample plan and progress/cancel state.                      |
| 5   | Rotation phone sample   | Silent ambiguity.      | Orientation warning and confidence surfaced.                           |
| 6   | Huge 4K sample          | Accepted blindly.      | Warned, capped, and planned conservatively.                            |
| 7   | Letterbox/dark material | Wrong-but-confident.   | Artifact warnings lower confidence.                                    |
| 8   | Variable-frame-rate     | Even timestamp guess.  | FFprobe key-frame timestamps used when available; fallback is labeled. |
| 9   | Truncated MP4           | Generic failure.       | Correctly blocked as incomplete/no usable video.                       |
| 10  | Empty/audio-only file   | Delayed failure.       | Correctly blocked before generation.                                   |

## Logic Gaps Closed

1. No video preflight contract: closed with `preflightVideo`, zod boundary validation, source fingerprints, warnings, blocking errors, and recommended processing plans.
2. Frame timing guessed: improved with FFprobe key-frame timestamp probing. Fallback estimates are still marked as `fps-estimate`.
3. No confidence/anomaly model: closed for preflight, frames, scenes, exports, debug view, and scene UI labels.
4. Palette not film-aware: improved with dark, low-variance, title-card, and letterbox artifact flags.
5. Generic errors/states: improved with recoverable/fatal/cancelled app states, blocked preflight messages, concurrency guard, and `?debug=1`.

## Smart Behaviors Evidence

- Drop/select now creates a preflight result before generation and applies a first processing plan.
- Generation is disabled for empty, partial, or no-video inputs instead of failing late.
- Exports now include schema v2, app version, commit, source fingerprint, preflight decisions, scene IDs, confidence, and warnings.
- Repeated fixture runs produce byte-identical canonical JSON.
- Users can inspect state, inference decisions, and warnings with `?debug=1`.

## Determinism Check

All 10 real-data preflight fixtures pass deterministic canonical JSON checks. The export contract test also verifies byte-identical canonical analysis JSON for identical input. Downloaded exports still carry a real `generatedAt` timestamp, so the deterministic guarantee applies to canonical analysis/provenance, not the wall-clock download wrapper.

## Performance Numbers

Local Phase 2 verification on 2026-05-09:

- `npm run test`: 22 tests passed in 1.69 s total Vitest duration.
- Real-data preflight fixtures: 10 / 10 covered.
- Heavy work remains off the main thread through FFmpeg-WASM and the palette worker.
- Long work remains cancellable with `AbortController`.

Detailed notes: `docs/perf/phase2-results.md`.

## Surprises

The biggest surprise was how much smarter the app felt before touching visual polish. Preflight language, confidence, and blocked states did more for trust than any new UI chrome would have. The second surprise was the timestamp/provenance tension: users need generation timestamps, but deterministic output needs a canonical form that fixes or excludes wall-clock fields.

## Still Open

1. True shot-boundary detection from decoded frame difference curves, not just sparse palette grouping.
2. Browser preview vs FFmpeg orientation reconciliation using actual display matrix data.
3. Better handling for very large files without loading the whole source into WASM memory.
4. Fixture-backed real media smoke tests beyond metadata descriptors.
5. A re-importable canonical project state format if Phase 3 adds correction workflows.

## Honest Take

It no longer feels like a toy on first contact: the app now inspects the input, makes a plausible first plan, says when it is unsure, blocks doomed files early, and exports enough evidence to audit the result. It is not yet a professional color-script analysis suite. The weakest remaining spot is cinematographic precision: it can identify and warn about messy material, but it cannot yet reliably find every meaningful shot boundary in a real feature-length film.
