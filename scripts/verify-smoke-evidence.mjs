import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const smokeDir = "output/smoke";
const smokeReadmeName = "README.md";
const gitProvenancePatterns = [
  /branch: .+/,
  /commit: [a-f0-9]+/,
  /workingTree: (clean|dirty|unavailable)/,
  /changedFiles: \d+/,
];
const expectedSmokeFiles = [
  {
    name: "integrations-smoke-summary.md",
    patterns: [
      /# Integrations Smoke Summary/,
      /command: npm run smoke:integrations/,
      /local packets pass before external AI delivery/,
      /external services: not contacted/,
      ...gitProvenancePatterns,
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
      /command: npm run smoke:chrome-extension -- --out output\/smoke\/chrome-extension-smoke\.md/,
      /status: pass/,
      /external services: not contacted/,
      /operator gate: local packet only; load unpacked Chrome review is still a separate manual check/,
      ...gitProvenancePatterns,
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
      ...gitProvenancePatterns,
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
      /command: npm run smoke:mcp -- --out output\/smoke\/mcp-bridge-smoke\.md/,
      /status: pass/,
      /external services: not contacted/,
      /operator gate: local packet only; connect a real MCP client only after review/,
      ...gitProvenancePatterns,
      /tools: get_context_profile, refine_prompt, create_handoff_package, save_execution_feedback/,
      /does not contact GPT, Claude, Codex, Gemini, OpenAI, or Supabase/,
    ],
  },
  {
    name: "mcp-client-smoke.md",
    patterns: [
      /# MCP Client Smoke Evidence/,
      /client: stdio JSON-RPC/,
      /command: npm run smoke:mcp-client -- --out output\/smoke\/mcp-client-smoke\.md/,
      /status: pass/,
      /external services: not contacted/,
      /operator gate: local packet only; external AI handoff still requires review-required output and confirmSave review/,
      ...gitProvenancePatterns,
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

function getGitProvenance(content, fileName) {
  const match = content.match(
    /- branch: (.+)\n- commit: ([a-f0-9]+)\n- workingTree: (clean|dirty|unavailable)\n- changedFiles: (\d+)/,
  );

  assert.ok(match, `${fileName} should include git provenance lines.`);

  return match[0];
}

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
  /Every local smoke packet should record git branch, commit, working tree\s+state,\s+and changed file count/,
  /Integrated summary should record: command, gate, external service boundary,\s+git branch, commit, working tree state, and changed file count/,
  /Chrome extension file contract/,
  /MCP bridge self-test contract/,
  /MCP client call sequence and feedback inbox contract/,
  /Learning feedback-improvement queue contract/,
  /npm run smoke:integrations/,
  /integrations-smoke-summary\.md/,
  /integrated run captures one\s+git provenance snapshot and writes the same snapshot to every packet/,
  /mcp-client-smoke\.md/,
  /## Operator Run Order/,
  /review-required handoff package/,
  /confirmSave: false/,
  /feedback inbox by UI, API, or curl/,
  /## Actual Evidence Fields/,
  /Chrome loaded extension evidence should record: command, status, external\s+service boundary, runtime, source, review gate, target AI, session, evidence\s+result, and feedback record/,
  /MCP bridge evidence should record: command, status, external service boundary,\s+protocol version, tool list, review-required fallback, and confirmSave write gate/,
  /MCP client evidence should record: command, status, external service boundary,\s+client, target AI, tool sequence, review gate, evidence result, and feedback\s+record/,
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

const smokeProvenance = expectedSmokeFiles.map((file) => {
  const content = readFileSync(join(smokeDir, file.name), "utf8");

  return {
    fileName: file.name,
    provenance: getGitProvenance(content, file.name),
  };
});
const firstProvenance = smokeProvenance[0].provenance;

for (const item of smokeProvenance) {
  assert.equal(
    item.provenance,
    firstProvenance,
    `${item.fileName} should use the same integrated smoke git provenance snapshot.`,
  );
}

console.log(
  `Smoke evidence verification passed for ${expectedSmokeFiles.length} packets and README.md.`,
);
