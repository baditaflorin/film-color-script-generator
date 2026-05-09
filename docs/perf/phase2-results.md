# Phase 2 Performance Results

Date: 2026-05-09

Scope: Mode A browser app, fixture-backed preflight and export logic. Full video decoding remains browser/device dependent because FFmpeg-WASM runs locally in the user's tab.

## Fixture Measurements

Command: `npm run test`

Observed local result on 2026-05-09:

- Test files: 4 passed.
- Tests: 22 passed.
- Total Vitest duration: 1.69 s after transform/import.
- Real-data fixture assertions: 10 / 10 preflight fixtures covered.
- Determinism assertions: canonical preflight JSON and canonical analysis JSON passed.

## Budget Status

| Operation              | Budget                             | Phase 2 status                                                                  |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| File drop preflight    | Useful feedback before generation. | Pass. Metadata is normalized and classified before `Generate` is enabled.       |
| Long work progress     | Show progress after 300 ms.        | Pass. FFmpeg engine, sampling, palette, and render phases report progress.      |
| Long work cancellation | Cancellable after 5 s.             | Pass. Generate owns an `AbortController`; cancel aborts extraction and cleanup. |
| Main-thread budget     | Heavy work off the UI thread.      | Pass. FFmpeg-WASM and palette analysis run in workers.                          |
| Huge inputs            | Warn and cap defaults.             | Pass. 4K/large/long inputs receive capped frame width and cost warnings.        |

## Known Cliff

The source file still has to be loaded into FFmpeg-WASM memory. Phase 2 now makes that cost visible and conservative, but it does not implement streaming container decode. Very large local files can still hit browser memory ceilings on weaker devices.
