import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const smokeDir = "output/smoke";
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

const expectedFileNames = expectedSmokeFiles.map((file) => file.name);
const actualFileNames = readdirSync(smokeDir)
  .filter((name) => name.endsWith(".md"))
  .sort();

assert.deepEqual(
  actualFileNames,
  expectedFileNames,
  "output/smoke should contain exactly the committed local smoke evidence packets",
);

for (const file of expectedSmokeFiles) {
  const content = readFileSync(join(smokeDir, file.name), "utf8");

  for (const pattern of file.patterns) {
    assert.match(content, pattern, `${file.name} is missing ${pattern}`);
  }
}

console.log(
  `Smoke evidence verification passed for ${expectedFileNames.length} packets.`,
);
