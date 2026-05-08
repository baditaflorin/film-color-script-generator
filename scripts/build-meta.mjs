import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

function git(args, fallback) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
}

const commit = git(["rev-parse", "--short=12", "HEAD"], "dev");
const fullCommit = git(["rev-parse", "HEAD"], "dev");
const branch = git(["branch", "--show-current"], "main");
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
      builtAt: new Date().toISOString(),
      repoUrl,
      commitUrl: `${repoUrl}/commit/${fullCommit}`,
      pagesUrl: "https://baditaflorin.github.io/film-color-script-generator/",
      paypalUrl: "https://www.paypal.com/paypalme/florinbadita"
    },
    null,
    2
  )} as const;\n`
);
