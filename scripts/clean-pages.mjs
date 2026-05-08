import { rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const generatedPaths = [
  "docs/assets",
  "docs/vendor",
  "docs/index.html",
  "docs/404.html",
  "docs/icon.svg",
  "docs/manifest.webmanifest",
  "docs/sw.js"
];

for (const path of generatedPaths) {
  rmSync(resolve(root, path), { recursive: true, force: true });
}
