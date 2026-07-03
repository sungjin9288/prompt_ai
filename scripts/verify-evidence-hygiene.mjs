import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { readSource } from "./lib/read-source.mjs";
import { verificationChecks } from "./lib/verification-checks.mjs";

const evidenceDir = "docs/evidence";
const readmePath = join(evidenceDir, "README.md");
const evidenceNamePattern =
  /^prompt-ai-studio-verification-evidence-\d{8}T\d{6}Z\.md$/;
const requiredScripts = verificationChecks.map((check) => check.scriptName);

assert.ok(existsSync(readmePath), "docs/evidence/README.md should exist.");

const readme = readSource(readmePath);

assert.match(
  readme,
  /Remove superseded records before committing a grouped change set/,
  "docs/evidence README should document grouped evidence cleanup.",
);
assert.match(
  readme,
  /git provenance with branch, commit, working tree state, and changed file count\s+captured before the grouped commit is created/,
  "docs/evidence README should document pre-commit git provenance.",
);
assert.match(
  readme,
  /Never paste raw OpenAI keys, Supabase keys, service-role values, or tokens/,
  "docs/evidence README should document secret handling.",
);

const markdownFiles = readdirSync(evidenceDir)
  .filter((name) => name.endsWith(".md"))
  .sort();
const evidenceFiles = markdownFiles.filter((name) =>
  evidenceNamePattern.test(name),
);
const unexpectedMarkdownFiles = markdownFiles.filter(
  (name) => name !== "README.md" && !evidenceNamePattern.test(name),
);

assert.deepEqual(
  unexpectedMarkdownFiles,
  [],
  `docs/evidence should only contain README.md and timestamped evidence files. Unexpected: ${unexpectedMarkdownFiles.join(
    ", ",
  )}`,
);
assert.ok(
  evidenceFiles.length <= 1,
  `docs/evidence should keep at most one active evidence record. Found: ${evidenceFiles.join(
    ", ",
  )}`,
);

for (const fileName of evidenceFiles) {
  const filePath = join(evidenceDir, fileName);
  const evidence = readSource(filePath);

  assert.match(evidence, /- status: pass/, `${fileName} should have pass status.`);
  assert.match(
    evidence,
    /## Git Provenance[\s\S]*- branch: .+[\s\S]*- commit: [a-f0-9]+[\s\S]*- workingTree: (clean|dirty|unavailable)[\s\S]*- changedFiles: \d+/,
    `${fileName} should include git provenance and working tree state.`,
  );

  for (const scriptName of requiredScripts) {
    assert.match(
      evidence,
      new RegExp(`- script: ${scriptName.replace(":", "\\:")}`),
      `${fileName} should include ${scriptName}.`,
    );
  }

  assert.match(
    evidence,
    /variable `OPENAI_API_KEY`; configured (yes|no); owner server; status active/,
    `${fileName} should use secret-scan-safe runtime variable rows.`,
  );
  assert.doesNotMatch(
    evidence,
    /OPENAI_API_KEY\s*[:=]\s*(yes|no)/,
    `${fileName} should not format runtime variables as env assignments.`,
  );
}

const evidenceSummary =
  evidenceFiles.length === 0
    ? "no active evidence records"
    : `active evidence record ${evidenceFiles[0]}`;

console.log(`Evidence hygiene verification passed with ${evidenceSummary}.`);
