import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verificationChecks } from "./lib/verification-checks.mjs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const releaseCandidateScript = readFileSync(
  "scripts/verify-release-candidate.mjs",
  "utf8",
);
const scripts = packageJson.scripts || {};
const releaseCandidateScripts = [
  "verify:repo-boundary",
  "verify:evidence-hygiene",
  "verify:smoke-evidence",
  "verify:secrets",
];

assert.equal(
  scripts.verify,
  "node scripts/verify-all.mjs",
  "npm run verify should use the shared verification runner",
);

const seenScriptNames = new Set();
const seenLabels = new Set();

for (const check of verificationChecks) {
  assert.equal(check.command, "npm", `${check.label} should run through npm`);
  assert.deepEqual(
    check.args,
    ["run", check.scriptName],
    `${check.label} args should match scriptName`,
  );
  assert.ok(
    scripts[check.scriptName],
    `${check.label} references missing package script ${check.scriptName}`,
  );
  assert.equal(
    seenScriptNames.has(check.scriptName),
    false,
    `Duplicate verification scriptName: ${check.scriptName}`,
  );
  assert.equal(
    seenLabels.has(check.label),
    false,
    `Duplicate verification label: ${check.label}`,
  );

  seenScriptNames.add(check.scriptName);
  seenLabels.add(check.label);
}

assert.equal(
  verificationChecks[0]?.scriptName,
  "verify:manifest",
  "verify:manifest should run first so manifest drift fails early",
);

for (const scriptName of releaseCandidateScripts) {
  assert.match(
    releaseCandidateScript,
    new RegExp(`args: \\["run", "${scriptName.replace(":", "\\:")}"\\]`),
    `verify:release-candidate should include ${scriptName}`,
  );
}

console.log(
  `Verification manifest verification passed for ${verificationChecks.length} checks.`,
);
