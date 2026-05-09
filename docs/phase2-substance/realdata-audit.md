# Phase 2 Substance Real-Data Audit

Date: 2026-05-08

Scope: v1 Film Color Script Generator at https://baditaflorin.github.io/film-color-script-generator/

Mode remains Mode A: pure GitHub Pages, browser-only.

## Audit Method

The happy path audited here is:

1. Drop/select a video-like file.
2. Accept v1 defaults.
3. Click `Engine` if needed.
4. Click `Generate`.
5. Inspect the strip and export readiness.

This audit uses real-world video input classes and public fixture candidates. Some are clean public samples; some are common user-owned video shapes that must be represented by fixtures in the implementation phase. Broken/partial files are included because users really do upload interrupted downloads, empty exports, and audio-only containers by mistake.

## 10 Real-World Inputs

| #   | Input                                                                                                       | Reality Class                                             | What v1 Did                                                                                                                                  | What It Should Have Done                                                                                                    | Why It Failed Or Was Weak                                                                                             | Failure Mode                                | Manual Work Forced On User                                                        |
| --- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | MDN `flower.mp4` — https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4                 | Clean short MP4                                           | Loads, samples, produces a plausible strip, exports work.                                                                                    | Same, but with confidence and exact sampling metadata.                                                                      | Happy path works; output lacks confidence and exact frame timestamps.                                                 | Mostly OK, but under-explained.             | User must trust the strip without knowing sample quality.                         |
| 2   | MDN `flower.webm` — https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm               | Clean alternate browser codec                             | Loads and should process through FFmpeg-WASM.                                                                                                | Same behavior as MP4, with codec/container preflight.                                                                       | V1 treats all video files alike and does not explain codec/container support or fallback path.                        | Mostly OK, but opaque.                      | User cannot tell whether WebM was handled natively, by FFmpeg, or by luck.        |
| 3   | W3Schools `mov_bbb.mp4` — https://www.w3schools.com/html/mov_bbb.mp4                                        | Clean animation with obvious shot/color changes           | Generates a strip, but default sampling can collapse or blur distinct visual beats.                                                          | Detect obvious color/shot changes and preserve them as separate scenes with confidence.                                     | Scene grouping is based on adjacent palette distance from sparse samples, not actual shot-boundary evidence.          | Wrong-but-confident when scenes merge.      | User has to raise/lower cut sensitivity and regenerate until it feels right.      |
| 4   | Google sample `BigBuckBunny.mp4` — https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4 | Longer real animation sample                              | Allows the user to start processing without a cost estimate; reads the whole file into WASM memory.                                          | Preflight duration, size, estimated memory/time, and choose a safe sampling plan before processing.                         | No preflight budget model; full file is written into FFmpeg-WASM memory.                                              | Slow/possibly stuck, not domain-explained.  | User must guess whether it is working, too large, or frozen.                      |
| 5   | Shotstack rotation-metadata phone sample family — https://shotstack.io/learn/rotate-videos-using-ffmpeg/    | Portrait smartphone video with rotation metadata          | V1 does not detect or surface rotation/orientation metadata; preview and extracted frames may disagree depending on browser/FFmpeg behavior. | Detect display matrix/orientation, compare preview aspect to decoded frame aspect, and apply/report the chosen orientation. | No orientation preflight or preview-vs-FFmpeg consistency check.                                                      | Potentially silent wrongness.               | User must notice if the strip was generated from sideways frames.                 |
| 6   | 4K Big Buck Bunny test clip family — https://test-videos.co.uk/bigbuckbunny/mp4-h264                        | Huge resolution edge case                                 | V1 accepts it like any other file; frame width default helps output frames, but the source file still enters WASM memory whole.              | Warn before heavy processing, cap defaults intelligently, and keep cancellation/resource cleanup explicit.                  | Size and memory budget are not part of the state machine.                                                             | Slow or crash-prone under memory pressure.  | User must know to lower sample count/frame width before trying.                   |
| 7   | Blender Open Movie clips such as Sintel/Tears of Steel — https://studio.blender.org/films/                  | Cinematic material: dark scenes, fades, letterbox, titles | V1 palettes are easily dominated by black bars, credits, fades, or low-light frames and still look authoritative.                            | Detect letterbox/title bars, low-variance frames, fades, and low-confidence palettes.                                       | Palette extraction is generic image quantization, not film-aware.                                                     | Wrong-but-confident.                        | User must mentally ignore black bars and title-card colors.                       |
| 8   | Variable-frame-rate phone or screen recording                                                               | Real user recording with uneven frame cadence             | V1 assigns sampled frame times evenly across duration, regardless of actual packet/frame timestamps.                                         | Preserve actual presentation timestamps from FFmpeg/ffprobe and use them for scene durations/export provenance.             | `readPngFrames` estimates time by frame index, so keyframe sampling and VFR inputs get incorrect timing.              | Silent wrongness in scene duration.         | User has to treat duration-proportional strips as approximate without being told. |
| 9   | Truncated partial MP4 download from any public sample above                                                 | Broken/partial real file                                  | Browser metadata may fail, or FFmpeg fails later with a generic sampling error.                                                              | Detect truncation/metadata failure early and say the file appears incomplete; keep prior work intact.                       | Error taxonomy does not distinguish corrupt/truncated from unsupported/too large/no-video-track.                      | Obvious failure, but not diagnostic enough. | User must guess whether to re-download, convert, or pick a different file.        |
| 10  | Audio-only MP4/M4A, or a zero-byte `.mp4` export                                                            | Empty/no-video edge case                                  | A zero-byte file fails metadata; audio-only containers can pass selection far enough that generation fails later.                            | Preflight video-track presence, duration, dimensions, and file size before enabling generation.                             | V1 validates mostly by extension/MIME and browser metadata, not by a domain-level "has usable video frames" contract. | Delayed obvious failure.                    | User must wait for a doomed generation attempt.                                   |

## Top 5 Logic Gaps

1. **No video preflight contract.** V1 does not first answer: does this file have a video track, usable duration, display orientation, dimensions, codec/container support, and a safe processing budget?
2. **Frame timing is guessed, not measured.** Extracted frame times are spread evenly across duration, so keyframe-only extraction and variable-frame-rate files produce misleading scene durations.
3. **Scene detection has no confidence or anomaly model.** It can merge obvious cuts, split on fades, or collapse rich material into too few scenes, then presents the strip as if it is definitive.
4. **Palette extraction is not film-aware.** Letterbox bars, credits, fades, dark frames, and low-variance scenes can dominate palettes without any warning.
5. **Errors and long-running states are not domain-specific enough.** Corrupt, unsupported, too-large, empty, audio-only, and memory-pressure cases collapse into generic failure or vague progress.

## Top 3 Intuition Failures

1. **The app asks for settings before it has inspected the film.** Users see sample count, cuts, and frame width before the app has made a first intelligent guess.
2. **The strip looks more certain than it is.** No confidence, no warnings, no anomaly markers, and exports do not carry uncertainty.
3. **Preview, sampling, and export can drift conceptually.** The visible video preview uses browser playback, while FFmpeg sampling may use different orientation/timing assumptions, and the user is not told.

## Top 3 "Feels Stupid" Moments

1. User must choose cut sensitivity by trial and error instead of the app detecting whether the input is short, long, high-cut, static, or low-contrast.
2. User must notice obvious film artifacts like letterbox bars, fades, or title cards and mentally discount them.
3. User must diagnose failures themselves: "bad file," "too large," "unsupported codec," "no video track," and "browser memory limit" feel the same.

## What "Smart" Means For This Product

Smart means the app behaves like a first-pass cinematography assistant:

1. **On drop, it preflights the video** and immediately reports whether it has usable frames, what orientation/duration/dimensions it sees, and what processing plan it chose.
2. **It produces a useful first strip with no manual tuning** by inferring sample density and cut sensitivity from duration, visual variance, and detected scene-change evidence.
3. **It knows film artifacts.** It detects likely letterbox bars, fades, title cards, very dark/low-variance frames, and marks palettes that may be dominated by artifacts.
4. **Every inferred scene and palette has confidence.** Low-confidence results are visible in the UI and carried into exports.
5. **Failures speak video language.** "No video track," "file appears truncated," "browser memory budget exceeded," or "orientation metadata is ambiguous" replace generic errors.

## Phase 2 Substance Success Metrics

1. **Real-data pass rate:** at least 7 of the 10 audit inputs complete the primary flow with no manual setting changes after file drop.
2. **Preflight coverage:** 10 of 10 inputs receive a preflight result before generation is enabled or blocked.
3. **No silent wrongness:** 10 of 10 inputs either produce confidence-bearing output or a domain-specific blocking error.
4. **Timing correctness:** sampled frames in exports carry measured timestamps, not index-based guesses, for every fixture where FFmpeg can expose timing.
5. **Determinism:** repeated runs on the same fixture produce byte-identical canonical analysis JSON for 10 of 10 fixtures.
6. **Performance honesty:** operations over 300 ms show progress; operations over 5 seconds are cancellable; huge inputs do not freeze the UI thread.
7. **Actionable errors:** empty, audio-only, truncated, and unsupported inputs each produce a distinct what/why/now-what message.
8. **Film artifact handling:** letterbox/title/fade-dominated fixtures are flagged with low confidence or artifact warnings in 100% of relevant cases.

## Explicitly Out Of Scope

- No runtime backend, Docker backend, auth, cloud uploads, or server-side FFmpeg.
- No visual polish pass: no dark mode, skeleton loaders, command palette, OG-image work, or redesign.
- No new workflow surface such as collaboration, sharing, cloud project saves, or accounts.
- No full nonlinear editor, manual color grading suite, or frame-perfect professional shot-boundary editor.
- No trained ML model or server-side model inference.
- No Phase 3 import/re-edit workflow unless needed only to validate deterministic exports.
- No custom domain work.

## Confirmation Gate

Stop here until the Phase 2 Substance audit is confirmed. Do not write ADRs, the §2 picklist, fixtures, or code before confirmation.
