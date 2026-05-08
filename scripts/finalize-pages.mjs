import { copyFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

copyFileSync(resolve(root, "docs/index.html"), resolve(root, "docs/404.html"));
writeFileSync(resolve(root, "docs/.nojekyll"), "\n");
