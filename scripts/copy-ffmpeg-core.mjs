import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourceDir = resolve(root, "node_modules/@ffmpeg/core/dist/esm");
const targetDir = resolve(root, "public/vendor/ffmpeg-core");

mkdirSync(targetDir, { recursive: true });

for (const file of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  copyFileSync(resolve(sourceDir, file), resolve(targetDir, file));
}
