# Phase 2 Performance Budgets

## Budgets

| Operation          |                                Budget | Behavior                                  |
| ------------------ | ------------------------------------: | ----------------------------------------- |
| File metadata read |      300 ms p50 for local small files | Show metadata status immediately.         |
| Preflight planning |                             50 ms p50 | Synchronous and deterministic.            |
| FFmpeg engine load |              5 s p95 after cache warm | Show progress and allow cancellation.     |
| Frame sampling     |                       Input-dependent | Progress visible; cancellation available. |
| Palette analysis   | 16 ms per decoded frame p50 at 360 px | Worker-only.                              |
| Render strip       |           100 ms p95 for <=120 scenes | Main thread.                              |

## Known Cliff

Browser memory is the limiting factor because Mode A writes the selected file into FFmpeg-WASM memory. Files over 250 MB or 4K+ sources are treated as high risk and receive a preflight warning before generation.

## Measurement Plan

The fixture runner records preflight time, analysis time for descriptor fixtures, deterministic hash time, and fixture pass/fail. Browser video processing remains covered by smoke tests.
