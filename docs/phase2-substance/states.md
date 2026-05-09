# Phase 2 State Taxonomy

Every state must have at least one exit and must keep prior usable work intact unless the user explicitly replaces it.

| State               | Meaning                                            | Allowed Exits                                        |
| ------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| `idle`              | No file or demo analysis loaded.                   | Select file, run demo.                               |
| `metadata-loading`  | Browser is reading metadata.                       | Cancel by selecting another file, recoverable error. |
| `preflight-blocked` | File cannot produce video frames.                  | Select another file.                                 |
| `preflight-warned`  | File can run, but has known risks.                 | Generate, adjust settings, select another file.      |
| `ready`             | File has a usable preflight and a processing plan. | Generate, adjust settings, select another file.      |
| `engine-loading`    | FFmpeg-WASM is loading.                            | Cancel, recoverable error, ready.                    |
| `sampling`          | FFmpeg is extracting frames.                       | Cancel, recoverable error, analyzing.                |
| `analyzing`         | Worker is extracting palettes/artifacts.           | Cancel, recoverable error, rendered.                 |
| `rendered`          | Strip, scenes, and exports are available.          | Export, regenerate, select another file.             |
| `cancelled`         | User cancelled a long operation.                   | Generate again, select another file.                 |
| `error-recoverable` | Input failed but previous work can remain.         | Select another file, adjust settings, retry.         |
| `error-fatal`       | Browser capability is missing.                     | Reload, use another browser.                         |

## Concurrency Rules

- A second generate click while processing is ignored.
- Selecting a new file aborts current processing and clears pending frame work.
- Cancellation aborts FFmpeg calls when supported, terminates the palette worker, and keeps the last completed strip.
- Export buttons only enable for a completed rendered state.
