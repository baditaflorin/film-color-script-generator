# Phase 2 Substance Plan

Goal: make the existing video-to-color-script workflow substantially smarter on real inputs without changing deployment mode or adding a new product surface.

## Ranked Substance Items

1. A1 - Real-data fixture suite for the 10 audit inputs plus adversarial edge fixtures.
2. H33 - Boundary validation for file/metadata/preflight inputs.
3. A4 - Partial/truncated input handling with recoverable diagnostics.
4. A3 - Huge input budget and processing cliff documentation.
5. A5 - Empty/no-video/adversarial input classification.
6. B6 - Auto-detect processing plan from duration, size, dimensions, and risk.
7. B8 - Useful first guess immediately after file metadata loads.
8. B9 - Normalize metadata fields and source fingerprints.
9. C12 - Domain-aware validation for missing video track, ambiguous orientation, huge source, and zero duration.
10. H32 - Actionable what/why/now-what error messages.
11. D16 - Confidence scores for preflight, frames, scenes, and exports.
12. D18 - Surface anomalies: low variance, very dark frames, letterbox risk, sparse keyframes, guessed timing.
13. C15 - Film conventions: letterbox/dark/fade/title-card artifact detection.
14. I38 - Export provenance with source fingerprint, plan, confidence, and warnings.
15. I35 - Deterministic canonical analysis output.
16. E22 - Stable human-readable IDs for scenes and frames.
17. F24 - State taxonomy documentation and explicit state values.
18. F26 - Cancellation semantics and cleanup guarantees.
19. F27 - Concurrency guard for repeated generate/cancel actions.
20. G29 - Keep heavy analysis off the main thread and transfer only what is needed.
21. G28 - Measure real-data fixture performance and document budgets.
22. I37 - `?debug=1` inspectability surface for state, preflight, confidence, and timing.
23. C11 - Domain vocabulary in visible status/error text.
24. C14 - Domain-aware export schema bump.
25. D19 - Decision explanations in debug/provenance.

## Pass-Rate Target

Baseline v1 useful pass rate from audit: 2/10 solid, 3/10 partial, 5/10 weak or failed.

Phase 2 target: at least 7/10 produce useful first output or an actionable preflight block with no manual tuning.

## Non-Goals

- No backend.
- No visual redesign.
- No cloud save/share.
- No full editor.
- No trained ML model.
- No new import/re-edit feature beyond deterministic canonical export tests.
