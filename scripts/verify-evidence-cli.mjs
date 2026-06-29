import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  buildGitProvenance,
  buildGitProvenanceLines,
  formatWorkingTreeStatus,
  gitProvenanceEnvKey,
} from "./lib/git-provenance.mjs";

const scriptPath = "scripts/verify-evidence.mjs";

function runEvidence(args, options = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      ...(options.env || {}),
    },
  });
}

assert.equal(formatWorkingTreeStatus(""), "clean");
assert.equal(formatWorkingTreeStatus(" M README.md"), "dirty");
assert.equal(formatWorkingTreeStatus("unavailable"), "unavailable");
assert.deepEqual(
  buildGitProvenanceLines({
    branch: "main",
    changedFiles: 0,
    commit: "abc1234",
    status: "",
  }),
  [
    "- branch: main",
    "- commit: abc1234",
    "- workingTree: clean",
    "- changedFiles: 0",
  ],
  "git provenance helper should format the shared evidence lines",
);

const previousGitProvenanceEnv = process.env[gitProvenanceEnvKey];
const snapshotProvenance = {
  branch: "snapshot-branch",
  changedFiles: 4,
  commit: "def5678",
  status: " M smoke.md",
};
process.env[gitProvenanceEnvKey] = JSON.stringify(snapshotProvenance);

try {
  assert.deepEqual(
    buildGitProvenance(),
    snapshotProvenance,
    "git provenance helper should use an explicit smoke snapshot when provided",
  );
} finally {
  if (previousGitProvenanceEnv === undefined) {
    delete process.env[gitProvenanceEnvKey];
  } else {
    process.env[gitProvenanceEnvKey] = previousGitProvenanceEnv;
  }
}

const helpResult = runEvidence(["--help"]);

assert.equal(helpResult.status, 0, "--help should exit successfully");
assert.match(helpResult.stdout, /Usage:/, "--help should print usage text");
assert.doesNotMatch(
  helpResult.stdout,
  /Supabase preflight scope guard/,
  "--help should not run verification checks",
);

const unknownResult = runEvidence(["--unknown"]);

assert.equal(unknownResult.status, 1, "unknown option should fail");
assert.match(
  unknownResult.stderr,
  /Unknown option: --unknown/,
  "unknown option should explain the invalid option",
);

const duplicateOutResult = runEvidence([
  "--out",
  "/tmp/a.md",
  "--out",
  "/tmp/b.md",
]);

assert.equal(duplicateOutResult.status, 1, "duplicate --out should fail");
assert.match(duplicateOutResult.stderr, /Use --out only once/);

const conflictResult = runEvidence([
  "--out",
  "/tmp/a.md",
  "--out-dir",
  "/tmp/b",
]);

assert.equal(conflictResult.status, 1, "--out and --out-dir should conflict");
assert.match(
  conflictResult.stderr,
  /Use only one output option/,
  "conflicting output options should explain the conflict",
);

const redactionResult = runEvidence(["--OPENAI_API_KEY=secret-value"]);

assert.equal(redactionResult.status, 1, "secret-like invalid args should fail");
assert.match(
  redactionResult.stderr,
  /OPENAI_API_KEY=\[redacted\]/,
  "secret-like invalid args should be redacted",
);
assert.doesNotMatch(
  redactionResult.stderr,
  /secret-value/,
  "secret-like invalid args should not leak raw values",
);

const outputDir = mkdtempSync(join(tmpdir(), "prompt-ai-studio-evidence-cli-"));
const failureOutputPath = join(outputDir, "failure-evidence.md");
const failureResult = runEvidence(["--out", failureOutputPath], {
  env: {
    PATH: "/usr/bin",
  },
});

try {
  assert.equal(
    failureResult.status,
    1,
    "child command failure should fail verify:evidence",
  );
  const failureEvidence = readFileSync(failureOutputPath, "utf8");

  assert.match(failureEvidence, /- status: fail/);
  assert.match(failureEvidence, /spawnSync npm ENOENT/);
  assert.match(
    failureEvidence,
    /## Git Provenance[\s\S]*- commit: [a-f0-9]+/,
    "failure evidence should keep the git commit provenance",
  );
  assert.match(
    failureEvidence,
    /- workingTree: (clean|dirty|unavailable)/,
    "failure evidence should record whether the working tree was clean",
  );
  assert.match(
    failureEvidence,
    /This evidence contains command status, runtime readiness booleans, and bounded failure excerpts/,
  );
  assert.match(
    failureEvidence,
    /variable `OPENAI_API_KEY`; configured no; owner server; status active/,
    "runtime variable evidence should keep operator-readable status details",
  );
  assert.doesNotMatch(
    failureEvidence,
    /OPENAI_API_KEY\s*[:=]\s*no/,
    "runtime variable evidence should not look like a secret assignment",
  );
} finally {
  rmSync(outputDir, { force: true, recursive: true });
}

console.log("Verification evidence CLI checks passed.");
