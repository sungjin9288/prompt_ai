import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const checks = [
  {
    args: ["run", "verify:repo-boundary"],
    command: "npm",
    label: "Repository boundary",
  },
  {
    args: ["run", "verify:evidence-hygiene"],
    command: "npm",
    label: "Evidence hygiene",
  },
  {
    args: ["run", "verify:secrets"],
    command: "npm",
    label: "Secret safety",
  },
];
const rootTempPaths = [".prompt-ai-studio", ".playwright-cli"];

for (const check of checks) {
  const result = spawnSync(check.command, check.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`${check.label} failed: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`${check.label} failed with exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}

const existingTempPaths = rootTempPaths.filter((path) => existsSync(path));

assert.deepEqual(
  existingTempPaths,
  [],
  `Remove root temp directories before release: ${existingTempPaths.join(", ")}`,
);

console.log("Release candidate verification passed.");
