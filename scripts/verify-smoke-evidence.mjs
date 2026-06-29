import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const smokeDir = "output/smoke";
const smokeReadmeName = "README.md";
const expectedSmokeFiles = [
  {
    name: "integrations-smoke-summary.md",
    patterns: [
      /# Integrations Smoke Summary/,
      /command: npm run smoke:integrations/,
      /local packets pass before external AI delivery/,
      /external services: not contacted/,
      /Chrome extension: output\/smoke\/chrome-extension-smoke\.md/,
      /MCP bridge: output\/smoke\/mcp-bridge-smoke\.md/,
      /MCP client: output\/smoke\/mcp-client-smoke\.md/,
      /Learning feedback: output\/smoke\/learning-feedback-smoke\.md/,
      /MCP client stdio JSON-RPC smoke passed/,
      /confirmSave stays false until the external AI result is reviewed/,
    ],
  },
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
      /command: npm run smoke:learning-feedback -- --out output\/smoke\/learning-feedback-smoke\.md/,
      /status: pass/,
      /external services: not contacted/,
      /operator gate: local packet only; external AI handoff still requires review-required output and confirmSave review/,
      /sourceVariant: learning-low-confidence-validation/,
      /Queue record actions include release evidence and release-candidate command copy/,
      /Queue reports include condition links, validation Library links, metrics, release gate commands/,
      /Clipboard and Studio draft failures keep manual copy fallbacks/,
      /Manual memories can be added, edited, deleted, and protected from duplicate scope plus content records/,
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
  {
    name: "mcp-client-smoke.md",
    patterns: [
      /# MCP Client Smoke Evidence/,
      /client: stdio JSON-RPC/,
      /refine_prompt returns a review-required handoff package through the MCP client call path/,
      /save_execution_feedback with confirmSave true writes a temporary feedback inbox record/,
      /Feedback record preserves targetAI codex, positive rating, and the smoke result summary/,
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
  /integrated preflight summary for the local packets/,
  /Chrome extension file contract/,
  /MCP bridge self-test contract/,
  /MCP client call sequence and feedback inbox contract/,
  /Learning feedback-improvement queue contract/,
  /npm run smoke:integrations/,
  /integrations-smoke-summary\.md/,
  /mcp-client-smoke\.md/,
  /## Operator Run Order/,
  /review-required handoff package/,
  /confirmSave: false/,
  /feedback inbox by UI, API, or curl/,
  /## Actual Evidence Fields/,
  /Chrome loaded extension evidence should record: runtime, source, review gate,\s+target AI, session, evidence result, and feedback record/,
  /MCP client evidence should record: client, target AI, tool sequence, review\s+gate, evidence result, and feedback record/,
  /Learning feedback evidence should record: command, status, external service\s+boundary, low-confidence condition, Studio validation draft, Library validation\s+filter, release evidence command, release candidate command, and feedback memory\s+action/,
  /## Storage Rules/,
  /Do not commit ad hoc\s+actual AI outputs, tokens, customer text, or one-off operator notes here/,
  /private operator evidence outside the repo/,
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
