import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const smokeDir = "output/smoke";
const smokeReadmeName = "README.md";
const expectedSmokeFiles = [
  {
    name: "chrome-extension-smoke.md",
    patterns: [
      /# Chrome Extension Smoke Evidence/,
      /Host permissions stay local-only/,
      /does not load Chrome or contact external AI services/,
    ],
  },
  {
    name: "learning-feedback-smoke.md",
    patterns: [
      /# Learning Feedback Smoke Evidence/,
      /sourceVariant: learning-low-confidence-validation/,
      /Clipboard and Studio draft failures keep manual copy fallbacks/,
    ],
  },
  {
    name: "mcp-bridge-smoke.md",
    patterns: [
      /# MCP Bridge Smoke Evidence/,
      /tools: get_context_profile, refine_prompt, create_handoff_package, save_execution_feedback/,
      /does not contact GPT, Claude, Codex, Gemini, OpenAI, or Supabase/,
    ],
  },
];

const expectedFileNames = [
  smokeReadmeName,
  ...expectedSmokeFiles.map((file) => file.name),
].sort();
const actualFileNames = readdirSync(smokeDir)
  .filter((name) => name.endsWith(".md"))
  .sort();

assert.deepEqual(
  actualFileNames,
  expectedFileNames,
  "output/smoke should contain its README and exactly the committed local smoke evidence packets",
);

const smokeReadme = readFileSync(join(smokeDir, smokeReadmeName), "utf8");
const smokeReadmePatterns = [
  /# Local Smoke Evidence/,
  /checked without external AI access/,
  /Chrome extension file contract/,
  /MCP bridge self-test contract/,
  /Learning feedback-improvement queue contract/,
  /docs\/evidence/,
];

for (const pattern of smokeReadmePatterns) {
  assert.match(smokeReadme, pattern, `${smokeReadmeName} is missing ${pattern}`);
}

for (const file of expectedSmokeFiles) {
  const content = readFileSync(join(smokeDir, file.name), "utf8");

  for (const pattern of file.patterns) {
    assert.match(content, pattern, `${file.name} is missing ${pattern}`);
  }
}

console.log(
  `Smoke evidence verification passed for ${expectedSmokeFiles.length} packets and README.md.`,
);
