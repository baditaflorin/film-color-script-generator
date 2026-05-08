import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

const commit = process.env.BUILD_COMMIT ?? "main";
const fullCommit = process.env.BUILD_FULL_COMMIT ?? commit;
const branch = process.env.BUILD_BRANCH ?? "main";
const builtAt = process.env.BUILD_DATE ?? "1970-01-01T00:00:00.000Z";
const repoUrl = "https://github.com/baditaflorin/film-color-script-generator";
const target = resolve(root, "src/generated/buildInfo.ts");

mkdirSync(dirname(target), { recursive: true });

writeFileSync(
  target,
  `export const buildInfo = ${JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      commit,
      fullCommit,
      branch,
      builtAt,
      repoUrl,
      commitUrl:
        fullCommit === "main" ? `${repoUrl}/commits/main` : `${repoUrl}/commit/${fullCommit}`,
      pagesUrl: "https://baditaflorin.github.io/film-color-script-generator/",
      paypalUrl: "https://www.paypal.com/paypalme/florinbadita"
    },
    null,
    2
  )} as const;\n`
);
