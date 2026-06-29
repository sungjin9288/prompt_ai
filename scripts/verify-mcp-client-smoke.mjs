import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  buildGitProvenance,
  buildGitProvenanceLines,
} from "./lib/git-provenance.mjs";

function getOutputPath(args) {
  const outIndex = args.indexOf("--out");

  if (outIndex === -1) {
    return undefined;
  }

  const outputPath = args[outIndex + 1];

  if (!outputPath || outputPath.startsWith("--")) {
    throw new Error("Use --out with a file path.");
  }

  return outputPath;
}

function parseJsonRpcResponses(output) {
  return output
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function responseById(responses, id) {
  return responses.find((response) => response.id === id);
}

function buildClientInput() {
  return [
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {},
    },
    {
      jsonrpc: "2.0",
      method: "notifications/initialized",
      params: {},
    },
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    },
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "get_context_profile",
        arguments: {
          allowedScopes: ["company", "user", "learning", "skill"],
          purpose: "MCP client smoke context check",
        },
      },
    },
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "refine_prompt",
        arguments: {
          rawInput:
            "Turn this rough request into a concise Codex implementation brief with scope, verification commands, and completion criteria.",
          sourceApp: "mcp-client-smoke",
          targetAI: "codex",
          domain: "개발",
          goal: "전문 프롬프트로 변환",
          sourceUrl: "mcp://client-smoke",
        },
      },
    },
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "save_execution_feedback",
        arguments: {
          promptId: "mcp-client-smoke-codex",
          targetAI: "codex",
          rating: "positive",
          resultSummary:
            "MCP client smoke returned a review-required Codex handoff package.",
          notes:
            "Temp feedback inbox confirmed after stdio JSON-RPC tool calls.",
          confirmSave: true,
        },
      },
    },
    "",
  ]
    .map((message) =>
      typeof message === "string" ? message : JSON.stringify(message),
    )
    .join("\n");
}

function buildEvidenceText() {
  const gitProvenance = buildGitProvenance();

  return [
    "# MCP Client Smoke Evidence",
    "",
    "- client: stdio JSON-RPC",
    "- server: prompt-ai-studio",
    "- targetAI: codex",
    "- feedbackInbox: temporary local JSONL",
    "- command: npm run smoke:mcp-client -- --out output/smoke/mcp-client-smoke.md",
    "- status: pass",
    "- external services: not contacted",
    "- local API: deterministic fallback URL",
    "- operator gate: local packet only; external AI handoff still requires review-required output and confirmSave review.",
    ...buildGitProvenanceLines(gitProvenance),
    "",
    "## Verified contract",
    "- initialize returns protocol version and tool capability.",
    "- tools/list exposes get_context_profile, refine_prompt, create_handoff_package, and save_execution_feedback.",
    "- get_context_profile returns read-only, review-required context policy.",
    "- refine_prompt returns a review-required handoff package through the MCP client call path.",
    "- save_execution_feedback with confirmSave true writes a temporary feedback inbox record.",
    "- Feedback record preserves targetAI codex, positive rating, and the smoke result summary.",
    "",
    "## Local-only evidence",
    "- Temp inbox: created during the smoke run.",
    "- The temp inbox path is not committed.",
  ].join("\n");
}

const feedbackInboxPath = join(
  mkdtempSync(join(tmpdir(), "prompt-ai-studio-mcp-client-")),
  "feedback.jsonl",
);

const output = execFileSync("node", ["mcp/prompt-ai-studio.mjs"], {
  encoding: "utf8",
  env: {
    ...process.env,
    PROMPT_AI_STUDIO_FEEDBACK_INBOX: feedbackInboxPath,
    PROMPT_AI_STUDIO_URL: "http://127.0.0.1:9",
    PROMPT_AI_STUDIO_TARGET_AI: "codex",
    PROMPT_AI_STUDIO_DOMAIN: "개발",
    PROMPT_AI_STUDIO_GOAL: "전문 프롬프트로 변환",
    PROMPT_AI_STUDIO_SOURCE_URL: "mcp://client-smoke",
  },
  input: buildClientInput(),
});

const responses = parseJsonRpcResponses(output);
const initializeResponse = responseById(responses, 1);
const toolsResponse = responseById(responses, 2);
const contextResponse = responseById(responses, 3);
const refineResponse = responseById(responses, 4);
const feedbackResponse = responseById(responses, 5);

assert.equal(
  initializeResponse?.result?.serverInfo?.name,
  "prompt-ai-studio",
  "initialize should identify the Prompt AI Studio MCP server",
);
assert.equal(
  initializeResponse?.result?.capabilities?.tools?.listChanged,
  false,
  "initialize should expose tool capability",
);

const toolNames = toolsResponse?.result?.tools?.map((tool) => tool.name) ?? [];
for (const toolName of [
  "get_context_profile",
  "refine_prompt",
  "create_handoff_package",
  "save_execution_feedback",
]) {
  assert.ok(toolNames.includes(toolName), `tools/list should include ${toolName}`);
}

assert.equal(
  contextResponse?.result?.structuredContent?.readOnly,
  true,
  "get_context_profile should stay read-only",
);
assert.equal(
  contextResponse?.result?.structuredContent?.reviewRequired,
  true,
  "get_context_profile should require review",
);
assert.match(
  contextResponse?.result?.content?.[0]?.text ?? "",
  /Prompt AI Studio Context Profile/,
  "get_context_profile should return a context profile summary",
);

assert.equal(
  refineResponse?.result?.structuredContent?.tool,
  "refine_prompt",
  "refine_prompt should return structured tool metadata",
);
assert.equal(
  refineResponse?.result?.structuredContent?.reviewRequired,
  true,
  "refine_prompt should return a review-required handoff",
);
assert.match(
  refineResponse?.result?.content?.[0]?.text ?? "",
  /Target AI Handoff Package/,
  "refine_prompt should return a handoff package",
);

assert.equal(
  feedbackResponse?.result?.structuredContent?.tool,
  "save_execution_feedback",
  "save_execution_feedback should return structured tool metadata",
);
assert.equal(
  feedbackResponse?.result?.structuredContent?.saved,
  true,
  "save_execution_feedback should save after confirmSave true",
);

const feedbackInboxText = readFileSync(feedbackInboxPath, "utf8");
const savedRecord = JSON.parse(feedbackInboxText.trim());
assert.equal(savedRecord.targetAI, "codex", "feedback record should keep targetAI");
assert.equal(savedRecord.rating, "positive", "feedback record should keep rating");
assert.equal(
  savedRecord.resultSummary,
  "MCP client smoke returned a review-required Codex handoff package.",
  "feedback record should keep the smoke result summary",
);

const outputPath = getOutputPath(process.argv.slice(2));

if (outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    `${buildEvidenceText()}\n`,
    "utf8",
  );
  process.stdout.write(`MCP client smoke evidence written to ${outputPath}.\n`);
}

process.stdout.write("Prompt AI Studio MCP client smoke passed.\n");
