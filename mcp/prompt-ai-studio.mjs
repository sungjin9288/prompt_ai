#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const PROTOCOL_VERSION = "2025-11-25";
const SERVER_NAME = "prompt-ai-studio";
const SERVER_VERSION = "0.1.0";
const DEFAULT_BASE_URL = "http://localhost:3000";
const REFINE_TOOL_NAME = "refine_prompt";
const CONTEXT_TOOL_NAME = "get_context_profile";
const HANDOFF_TOOL_NAME = "create_handoff_package";
const FEEDBACK_TOOL_NAME = "save_execution_feedback";
const TARGET_AI_VALUES = ["auto", "gpt", "claude", "codex", "gemini"];
const FEEDBACK_TARGET_AI_VALUES = ["gpt", "claude", "codex", "gemini", "general"];
const DEFAULT_FEEDBACK_INBOX = fileURLToPath(
  new URL("../.prompt-ai-studio/mcp-feedback.jsonl", import.meta.url),
);

const refineTool = {
  name: REFINE_TOOL_NAME,
  title: "Refine Prompt",
  description:
    "Turn rough user input into a review-required Prompt AI Studio handoff package for GPT, Claude, Codex, or Gemini.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["rawInput"],
    properties: {
      rawInput: {
        type: "string",
        minLength: 1,
        description: "The rough instruction, selected text, or task brief to refine.",
      },
      targetAI: {
        type: "string",
        enum: ["auto", "gpt", "claude", "codex", "gemini"],
        description: "Optional target AI. Use auto when the caller has no preference.",
      },
      sourceApp: {
        type: "string",
        description: "Calling surface, such as mcp, chrome, chatgpt, claude, codex, or gemini.",
      },
      domain: {
        type: "string",
        description: "Optional work domain, industry, or expertise area.",
      },
      goal: {
        type: "string",
        description: "Optional outcome the refined prompt should optimize for.",
      },
      sourceUrl: {
        type: "string",
        description: "Optional URL or origin metadata from the caller.",
      },
      outputLanguage: {
        type: "string",
        description:
          "Optional note for the desired final answer language. Prompt language strategy is still decided by Prompt AI Studio.",
      },
    },
  },
};

const contextProfileTool = {
  name: CONTEXT_TOOL_NAME,
  title: "Get Context Profile",
  description:
    "Read the current Prompt AI Studio context policy, available scopes, and handoff rules before refining prompts.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      workspaceId: {
        type: "string",
        description: "Optional workspace identifier supplied by the MCP client.",
      },
      allowedScopes: {
        type: "array",
        items: {
          type: "string",
          enum: ["company", "user", "learning", "skill"],
        },
        description:
          "Optional context scopes the caller is allowed to use for the current request.",
      },
      purpose: {
        type: "string",
        description: "Optional reason for requesting context.",
      },
    },
  },
};

const handoffPackageTool = {
  name: HANDOFF_TOOL_NAME,
  title: "Create Handoff Package",
  description:
    "Create a copy-ready, review-required target AI handoff package from a draft, prompt text, or raw instruction.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["draft"],
    properties: {
      draft: {
        type: "string",
        minLength: 1,
        description: "Draft, prompt text, or rough instruction to package.",
      },
      targetAI: {
        type: "string",
        enum: ["auto", "gpt", "claude", "codex", "gemini"],
        description: "Optional target AI. Use auto when the caller has no preference.",
      },
      deliveryMode: {
        type: "string",
        enum: ["review_required"],
        description:
          "Delivery mode for external AI handoff. Only review_required is supported.",
      },
      domain: {
        type: "string",
        description: "Optional work domain, industry, or expertise area.",
      },
      goal: {
        type: "string",
        description: "Optional outcome the handoff package should optimize for.",
      },
      sourceUrl: {
        type: "string",
        description: "Optional URL or origin metadata from the caller.",
      },
      promptId: {
        type: "string",
        description: "Optional local Prompt AI Studio prompt identifier.",
      },
    },
  },
};

const executionFeedbackTool = {
  name: FEEDBACK_TOOL_NAME,
  title: "Save Execution Feedback",
  description:
    "Convert external AI execution feedback into a learning memory candidate and optionally append it to the local feedback inbox.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    required: ["resultSummary"],
    properties: {
      resultSummary: {
        type: "string",
        minLength: 1,
        description: "Short summary of the external AI result or execution outcome.",
      },
      rating: {
        type: "string",
        enum: ["positive", "neutral", "negative"],
        description: "Optional operator rating for the execution result.",
      },
      notes: {
        type: "string",
        description: "Optional operator notes, failure reason, or improvement instruction.",
      },
      promptId: {
        type: "string",
        description: "Optional Prompt AI Studio prompt identifier.",
      },
      targetAI: {
        type: "string",
        enum: ["gpt", "claude", "codex", "gemini", "general"],
        description: "Optional AI tool that produced the result.",
      },
      confirmSave: {
        type: "boolean",
        description:
          "When true, append the feedback record to the local JSONL inbox. When false or omitted, return the candidate without writing.",
      },
    },
  },
};

const defaultContextProfile = {
  workspaceId: "local",
  contextPriority: ["company", "user", "learning", "skill"],
  availableScopes: ["company", "user", "learning", "skill"],
  languageStrategy: "AI decides English or Korean-English hybrid prompt output.",
  deliveryPolicy:
    "External AI delivery must remain review-required. Do not auto-send to GPT, Claude, Codex, or Gemini.",
  tools: [
    CONTEXT_TOOL_NAME,
    REFINE_TOOL_NAME,
    HANDOFF_TOOL_NAME,
    FEEDBACK_TOOL_NAME,
  ],
};

function createInitializeResult() {
  return {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
    serverInfo: {
      name: SERVER_NAME,
      title: "Prompt AI Studio MCP Bridge",
      version: SERVER_VERSION,
    },
    instructions:
      "Use get_context_profile before refine_prompt or create_handoff_package when context policy matters. Use create_handoff_package when the caller explicitly needs a copy-ready external AI handoff. Use save_execution_feedback after operator review to create learning candidates. Review the package before sending it to an external AI.",
  };
}

function createToolListResult() {
  return {
    tools: [
      contextProfileTool,
      refineTool,
      handoffPackageTool,
      executionFeedbackTool,
    ],
  };
}

function jsonRpcError(id, code, message, data) {
  const error = { code, message };

  if (data !== undefined) {
    error.data = data;
  }

  return {
    jsonrpc: "2.0",
    id,
    error,
  };
}

function jsonRpcResult(id, result) {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function normalizeRefineArguments(args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return {
      error: "Tool arguments must be an object.",
    };
  }

  const rawInput =
    typeof args.rawInput === "string" ? args.rawInput.trim() : "";

  if (!rawInput) {
    return {
      error: "rawInput is required.",
    };
  }

  return {
    value: {
      rawInput,
      sourceApp: stringOrDefault(args.sourceApp, "mcp"),
      targetAI:
        stringOrUndefined(args.targetAI) ??
        targetAIOrUndefined(process.env.PROMPT_AI_STUDIO_TARGET_AI),
      domain:
        stringOrUndefined(args.domain) ??
        stringOrUndefined(process.env.PROMPT_AI_STUDIO_DOMAIN),
      goal:
        stringOrUndefined(args.goal) ??
        stringOrUndefined(process.env.PROMPT_AI_STUDIO_GOAL),
      sourceUrl:
        stringOrUndefined(args.sourceUrl) ??
        stringOrUndefined(process.env.PROMPT_AI_STUDIO_SOURCE_URL),
      outputLanguage: stringOrUndefined(args.outputLanguage),
    },
  };
}

function normalizeContextArguments(args) {
  if (args === undefined) {
    return {
      value: {
        allowedScopes: defaultContextProfile.availableScopes,
      },
    };
  }

  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return {
      error: "Tool arguments must be an object.",
    };
  }

  const allowedScopes = Array.isArray(args.allowedScopes)
    ? args.allowedScopes.filter((scope) =>
        defaultContextProfile.availableScopes.includes(scope),
      )
    : defaultContextProfile.availableScopes;

  return {
    value: {
      workspaceId: stringOrUndefined(args.workspaceId),
      allowedScopes:
        allowedScopes.length > 0
          ? allowedScopes
          : defaultContextProfile.availableScopes,
      purpose: stringOrUndefined(args.purpose),
    },
  };
}

function normalizeHandoffArguments(args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return {
      error: "Tool arguments must be an object.",
    };
  }

  const rawInput =
    stringOrUndefined(args.draft) ??
    stringOrUndefined(args.promptText) ??
    stringOrUndefined(args.rawInput);

  if (!rawInput) {
    return {
      error: "draft is required.",
    };
  }

  const deliveryMode = stringOrUndefined(args.deliveryMode);

  if (deliveryMode && deliveryMode !== "review_required") {
    return {
      error: "Only review_required deliveryMode is supported.",
    };
  }

  return {
    value: {
      rawInput,
      sourceApp: "mcp",
      targetAI:
        stringOrUndefined(args.targetAI) ??
        targetAIOrUndefined(process.env.PROMPT_AI_STUDIO_TARGET_AI),
      domain:
        stringOrUndefined(args.domain) ??
        stringOrUndefined(process.env.PROMPT_AI_STUDIO_DOMAIN),
      goal:
        stringOrUndefined(args.goal) ??
        stringOrUndefined(process.env.PROMPT_AI_STUDIO_GOAL),
      sourceUrl:
        stringOrUndefined(args.sourceUrl) ??
        stringOrUndefined(process.env.PROMPT_AI_STUDIO_SOURCE_URL),
      promptId: stringOrUndefined(args.promptId),
      deliveryMode: "review_required",
    },
  };
}

function normalizeFeedbackArguments(args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return {
      error: "Tool arguments must be an object.",
    };
  }

  const resultSummary = stringOrUndefined(args.resultSummary);

  if (!resultSummary) {
    return {
      error: "resultSummary is required.",
    };
  }

  const rating = stringOrUndefined(args.rating);

  if (rating && !["positive", "neutral", "negative"].includes(rating)) {
    return {
      error: "rating must be positive, neutral, or negative.",
    };
  }

  return {
    value: {
      resultSummary,
      rating: rating ?? "neutral",
      notes: stringOrUndefined(args.notes),
      promptId: stringOrUndefined(args.promptId),
      targetAI:
        stringOrUndefined(args.targetAI) ??
        feedbackTargetAIOrUndefined(process.env.PROMPT_AI_STUDIO_TARGET_AI),
      confirmSave: args.confirmSave === true,
    },
  };
}

function stringOrDefault(value, fallback) {
  const normalized = stringOrUndefined(value);
  return normalized ?? fallback;
}

function stringOrUndefined(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function targetAIOrUndefined(value) {
  const normalized = stringOrUndefined(value);
  return normalized && TARGET_AI_VALUES.includes(normalized)
    ? normalized
    : undefined;
}

function feedbackTargetAIOrUndefined(value) {
  const normalized = stringOrUndefined(value);
  return normalized && FEEDBACK_TARGET_AI_VALUES.includes(normalized)
    ? normalized
    : undefined;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );
}

function getOperationDefaults() {
  return compactObject({
    targetAI: targetAIOrUndefined(process.env.PROMPT_AI_STUDIO_TARGET_AI),
    domain: stringOrUndefined(process.env.PROMPT_AI_STUDIO_DOMAIN),
    goal: stringOrUndefined(process.env.PROMPT_AI_STUDIO_GOAL),
    sourceUrl: stringOrUndefined(process.env.PROMPT_AI_STUDIO_SOURCE_URL),
  });
}

function formatOperationDefaults(defaults) {
  const entries = Object.entries(defaults);

  if (entries.length === 0) {
    return "none";
  }

  return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
}

function restoreEnvValue(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

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

function buildMcpSelfTestEvidenceText() {
  return [
    "# MCP Bridge Smoke Evidence",
    "",
    `- server: ${SERVER_NAME}`,
    `- version: ${SERVER_VERSION}`,
    `- protocolVersion: ${PROTOCOL_VERSION}`,
    `- tools: ${defaultContextProfile.tools.join(", ")}`,
    "",
    "## Verified contract",
    "- initialize returns the expected MCP protocol version and tool capability.",
    "- tools/list exposes context, refine, handoff, and feedback tools.",
    "- get_context_profile stays read-only and review-required.",
    "- refine_prompt and create_handoff_package return review-required handoff packages.",
    "- MCP operation defaults are applied when tool arguments omit target, domain, goal, or source URL.",
    "- Local API unavailability falls back to a review-required MCP package instead of an empty handoff.",
    "- save_execution_feedback does not write unless confirmSave is true.",
    "- This smoke does not contact GPT, Claude, Codex, Gemini, OpenAI, or Supabase.",
  ].join("\n");
}

async function writeMcpSelfTestEvidence(outputPath) {
  if (!outputPath) {
    return;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${buildMcpSelfTestEvidenceText()}\n`, "utf8");
  process.stdout.write(`MCP bridge smoke evidence written to ${outputPath}\n`);
}

async function callRefineApi(payload, baseUrl = getBaseUrl()) {
  const url = new URL("/api/integrations/refine", baseUrl);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let data;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error(
      `Prompt AI Studio refine API returned non-JSON response (${response.status}).`,
    );
  }

  if (!response.ok) {
    const detail =
      data && typeof data.error === "string"
        ? data.error
        : `HTTP ${response.status}`;
    throw new Error(`Prompt AI Studio refine API failed: ${detail}`);
  }

  return data;
}

function isUnavailableRefineApiError(error) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message === "fetch failed" ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("ECONNRESET")
  );
}

function getTargetModelMeta(targetAI) {
  switch (targetAI) {
    case "claude":
      return { label: "Claude", targetModel: "claude" };
    case "codex":
      return { label: "Codex", targetModel: "codex" };
    case "gemini":
      return { label: "Gemini", targetModel: "gemini" };
    case "gpt":
      return { label: "GPT", targetModel: "gpt" };
    default:
      return { label: "GPT", targetModel: "gpt" };
  }
}

function createLocalFallbackRefineResponse(payload, error) {
  const target = getTargetModelMeta(payload.targetAI);
  const title = payload.goal
    ? `${payload.goal} · local MCP fallback`
    : "Local MCP fallback package";
  const handoffText = [
    "# Target AI Handoff Package",
    "",
    "## Preflight Checklist",
    "- Review required before delivery.",
    "- Local refine API was unavailable; this package was generated by the MCP bridge fallback.",
    "- Confirm target AI, domain, assumptions, and missing context before external use.",
    "",
    "## Target",
    `- Target AI: ${target.label}`,
    `- Domain: ${payload.domain ?? "Not specified"}`,
    `- Goal: ${payload.goal ?? "Not specified"}`,
    `- Source URL: ${payload.sourceUrl ?? "Not specified"}`,
    "",
    "## Copy-Ready Prompt",
    `You are preparing a reviewed handoff package for ${target.label}.`,
    "Rewrite the draft into a clear, executable prompt. Preserve important source wording, state assumptions, and list missing context before final use.",
    "",
    "## Source Draft",
    payload.rawInput,
    "",
    "## Operator Notes",
    `Fallback reason: ${
      error instanceof Error ? error.message : "local refine API unavailable"
    }`,
  ].join("\n");

  return {
    audit: {
      reviewRequired: true,
      sourceApp: payload.sourceApp,
      localFallback: true,
    },
    promptPackage: {
      title,
    },
    handoffPackages: [
      {
        targetModel: target.targetModel,
        modelLabel: target.label,
        qualityScore: 0,
        handoffText,
      },
    ],
  };
}

async function callRefineWithLocalFallback(payload) {
  try {
    return await callRefineApi(payload);
  } catch (error) {
    if (!isUnavailableRefineApiError(error)) {
      throw error;
    }

    return createLocalFallbackRefineResponse(payload, error);
  }
}

function getBaseUrl() {
  return process.env.PROMPT_AI_STUDIO_URL || DEFAULT_BASE_URL;
}

function getFeedbackInboxPath() {
  return process.env.PROMPT_AI_STUDIO_FEEDBACK_INBOX || DEFAULT_FEEDBACK_INBOX;
}

function getContextProfileOverride() {
  const rawProfile = process.env.PROMPT_AI_STUDIO_CONTEXT_PROFILE;

  if (!rawProfile) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawProfile);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {
      profileWarning:
        "PROMPT_AI_STUDIO_CONTEXT_PROFILE could not be parsed as JSON. Using default local context policy.",
    };
  }
}

function createContextProfileResult(args) {
  const override = getContextProfileOverride();
  const workspaceId =
    args.workspaceId ??
    stringOrUndefined(override.workspaceId) ??
    defaultContextProfile.workspaceId;
  const allowedScopes = args.allowedScopes.filter((scope) =>
    defaultContextProfile.availableScopes.includes(scope),
  );
  const availableScopes = defaultContextProfile.availableScopes.filter((scope) =>
    allowedScopes.includes(scope),
  );
  const profile = {
    ...defaultContextProfile,
    ...override,
    workspaceId,
    availableScopes,
    operationDefaults: getOperationDefaults(),
    requestedPurpose: args.purpose,
    readOnly: true,
    reviewRequired: true,
  };

  return {
    content: [
      {
        type: "text",
        text: [
          "# Prompt AI Studio Context Profile",
          "",
          `Workspace: ${profile.workspaceId}`,
          `Available scopes: ${profile.availableScopes.join(", ")}`,
          `Context priority: ${defaultContextProfile.contextPriority.join(" -> ")}`,
          `Language strategy: ${profile.languageStrategy}`,
          `Delivery policy: ${profile.deliveryPolicy}`,
          `Operation defaults: ${formatOperationDefaults(profile.operationDefaults)}`,
          "",
          "Use this context profile before refine_prompt when the caller needs workspace policy, personalization scope, or handoff guardrails.",
        ].join("\n"),
      },
    ],
    structuredContent: profile,
    isError: false,
  };
}

function createToolErrorResult(message) {
  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
    isError: true,
  };
}

function createToolSuccessResult(data, toolName = REFINE_TOOL_NAME) {
  const packageItem = data?.handoffPackages?.[0];

  if (!packageItem?.handoffText) {
    return createToolErrorResult(
      "Prompt AI Studio refine API did not return a handoff package.",
    );
  }

  return {
    content: [
      {
        type: "text",
        text: packageItem.handoffText,
      },
    ],
    structuredContent: {
      tool: toolName,
      reviewRequired: data.audit?.reviewRequired === true,
      deliveryMode: "review_required",
      targetModel: packageItem.targetModel,
      modelLabel: packageItem.modelLabel,
      qualityScore: packageItem.qualityScore,
      handoffPackageCount: Array.isArray(data.handoffPackages)
        ? data.handoffPackages.length
        : 1,
      promptTitle: data.promptPackage?.title,
    },
    isError: false,
  };
}

function createFeedbackRecord(args) {
  const createdAt = new Date().toISOString();
  const targetAI = args.targetAI ?? "general";
  const memoryCandidate = [
    `Target AI: ${targetAI}`,
    `Rating: ${args.rating}`,
    `Result: ${args.resultSummary}`,
    args.notes ? `Operator notes: ${args.notes}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    id: randomUUID(),
    createdAt,
    source: "mcp",
    tool: FEEDBACK_TOOL_NAME,
    promptId: args.promptId,
    targetAI,
    rating: args.rating,
    resultSummary: args.resultSummary,
    notes: args.notes,
    learningMemoryCandidate: memoryCandidate,
    improvementQueueItem:
      args.rating === "negative"
        ? "Review the failed execution, update missing constraints, and regenerate the target AI handoff package."
        : "Use this feedback as a learning signal for future prompt refinement.",
  };
}

async function appendFeedbackRecord(record, inboxPath = getFeedbackInboxPath()) {
  await mkdir(dirname(inboxPath), { recursive: true });
  await appendFile(inboxPath, `${JSON.stringify(record)}\n`, "utf8");
  return inboxPath;
}

async function createFeedbackResult(args) {
  const record = createFeedbackRecord(args);
  let saved = false;
  let inboxPath;

  if (args.confirmSave) {
    inboxPath = await appendFeedbackRecord(record);
    saved = true;
  }

  return {
    content: [
      {
        type: "text",
        text: [
          "# Prompt AI Studio Execution Feedback",
          "",
          `Saved: ${saved ? "yes" : "no"}`,
          `Target AI: ${record.targetAI}`,
          `Rating: ${record.rating}`,
          `Result summary: ${record.resultSummary}`,
          record.notes ? `Notes: ${record.notes}` : undefined,
          "",
          "## Learning Memory Candidate",
          record.learningMemoryCandidate,
          "",
          "## Improvement Queue Item",
          record.improvementQueueItem,
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
    structuredContent: {
      tool: FEEDBACK_TOOL_NAME,
      saved,
      inboxPath,
      record,
      reviewRequired: true,
    },
    isError: false,
  };
}

async function handleToolCall(params, refineClient = callRefineWithLocalFallback) {
  if (!params || typeof params !== "object") {
    return createToolErrorResult("tools/call params must be an object.");
  }

  if (params.name === CONTEXT_TOOL_NAME) {
    const normalized = normalizeContextArguments(params.arguments);

    if (normalized.error) {
      return createToolErrorResult(normalized.error);
    }

    return createContextProfileResult(normalized.value);
  }

  if (params.name === REFINE_TOOL_NAME) {
    const normalized = normalizeRefineArguments(params.arguments);

    if (normalized.error) {
      return createToolErrorResult(normalized.error);
    }

    try {
      const data = await refineClient(normalized.value);
      return createToolSuccessResult(data, REFINE_TOOL_NAME);
    } catch (error) {
      return createToolErrorResult(
        error instanceof Error
          ? error.message
          : "Prompt AI Studio refine API call failed.",
      );
    }
  }

  if (params.name === HANDOFF_TOOL_NAME) {
    const normalized = normalizeHandoffArguments(params.arguments);

    if (normalized.error) {
      return createToolErrorResult(normalized.error);
    }

    try {
      const data = await refineClient(normalized.value);
      return createToolSuccessResult(data, HANDOFF_TOOL_NAME);
    } catch (error) {
      return createToolErrorResult(
        error instanceof Error
          ? error.message
          : "Prompt AI Studio handoff package creation failed.",
      );
    }
  }

  if (params.name === FEEDBACK_TOOL_NAME) {
    const normalized = normalizeFeedbackArguments(params.arguments);

    if (normalized.error) {
      return createToolErrorResult(normalized.error);
    }

    try {
      return await createFeedbackResult(normalized.value);
    } catch (error) {
      return createToolErrorResult(
        error instanceof Error
          ? error.message
          : "Prompt AI Studio feedback save failed.",
      );
    }
  }

  return createToolErrorResult(`Unknown tool: ${String(params.name)}`);
}

async function handleJsonRpcMessage(
  message,
  refineClient = callRefineWithLocalFallback,
) {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    return jsonRpcError(null, -32600, "Invalid Request");
  }

  const id = Object.hasOwn(message, "id") ? message.id : undefined;

  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return jsonRpcError(id ?? null, -32600, "Invalid Request");
  }

  if (id === undefined && message.method === "notifications/initialized") {
    return undefined;
  }

  switch (message.method) {
    case "initialize":
      return jsonRpcResult(id, createInitializeResult());
    case "tools/list":
      return jsonRpcResult(id, createToolListResult());
    case "tools/call":
      return jsonRpcResult(
        id,
        await handleToolCall(message.params, refineClient),
      );
    default:
      return jsonRpcError(id ?? null, -32601, `Method not found: ${message.method}`);
  }
}

function writeResponse(response) {
  process.stdout.write(`${JSON.stringify(response)}\n`);
}

async function runStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Number.POSITIVE_INFINITY,
  });

  for await (const line of rl) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    try {
      const message = JSON.parse(trimmed);
      const response = await handleJsonRpcMessage(message);

      if (response) {
        writeResponse(response);
      }
    } catch (error) {
      writeResponse(
        jsonRpcError(
          null,
          -32700,
          error instanceof SyntaxError ? "Parse error" : "Internal error",
          error instanceof Error ? error.message : undefined,
        ),
      );
    }
  }
}

async function runSelfTest(outputPath) {
  const mockRefineClient = async (payload) => ({
    audit: {
      reviewRequired: true,
      sourceApp: payload.sourceApp,
    },
    promptPackage: {
      title: "Self-test package",
    },
    handoffPackages: [
      {
        targetModel: payload.targetAI === "claude" ? "claude" : "gpt",
        modelLabel: payload.targetAI === "claude" ? "Claude" : "GPT",
        qualityScore: 91,
        handoffText:
          "# Target AI Handoff Package\n\n## Preflight Checklist\n- Review required before delivery.\n\n## Copy-Ready Prompt\nRefined self-test prompt.",
      },
    ],
  });

  const initializeResponse = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {},
  });

  if (
    initializeResponse?.result?.protocolVersion !== PROTOCOL_VERSION ||
    !initializeResponse.result.capabilities?.tools
  ) {
    throw new Error("initialize self-test failed");
  }

  const toolsResponse = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });

  const toolNames = toolsResponse?.result?.tools?.map((tool) => tool.name) ?? [];

  if (
    !toolNames.includes(CONTEXT_TOOL_NAME) ||
    !toolNames.includes(REFINE_TOOL_NAME) ||
    !toolNames.includes(HANDOFF_TOOL_NAME) ||
    !toolNames.includes(FEEDBACK_TOOL_NAME)
  ) {
    throw new Error("tools/list self-test failed");
  }

  const contextResponse = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: CONTEXT_TOOL_NAME,
      arguments: {
        allowedScopes: ["company", "user"],
        purpose: "Prepare context before prompt refinement.",
      },
    },
  });

  if (
    contextResponse?.result?.isError ||
    contextResponse?.result?.structuredContent?.readOnly !== true ||
    !contextResponse?.result?.content?.[0]?.text?.includes(
      "# Prompt AI Studio Context Profile",
    )
  ) {
    throw new Error("get_context_profile self-test failed");
  }

  const callResponse = await handleJsonRpcMessage(
    {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: REFINE_TOOL_NAME,
        arguments: {
          rawInput: "Draft a concise expert prompt.",
          sourceApp: "mcp",
          targetAI: "claude",
        },
      },
    },
    mockRefineClient,
  );

  const toolText = callResponse?.result?.content?.[0]?.text ?? "";

  if (
    callResponse?.result?.isError ||
    callResponse?.result?.structuredContent?.reviewRequired !== true ||
    !toolText.includes("# Target AI Handoff Package")
  ) {
    throw new Error("tools/call self-test failed");
  }

  const originalDefaultTargetAI = process.env.PROMPT_AI_STUDIO_TARGET_AI;
  const originalDefaultDomain = process.env.PROMPT_AI_STUDIO_DOMAIN;
  const originalDefaultGoal = process.env.PROMPT_AI_STUDIO_GOAL;
  const originalDefaultSourceUrl = process.env.PROMPT_AI_STUDIO_SOURCE_URL;

  process.env.PROMPT_AI_STUDIO_TARGET_AI = "claude";
  process.env.PROMPT_AI_STUDIO_DOMAIN = "개발";
  process.env.PROMPT_AI_STUDIO_GOAL = "전문 프롬프트로 변환";
  process.env.PROMPT_AI_STUDIO_SOURCE_URL = "mcp://self-test";

  try {
    const defaultedCallResponse = await handleJsonRpcMessage(
      {
        jsonrpc: "2.0",
        id: 40,
        method: "tools/call",
        params: {
          name: REFINE_TOOL_NAME,
          arguments: {
            rawInput: "Use MCP environment defaults.",
          },
        },
      },
      async (payload) => {
        if (
          payload.targetAI !== "claude" ||
          payload.domain !== "개발" ||
          payload.goal !== "전문 프롬프트로 변환" ||
          payload.sourceUrl !== "mcp://self-test"
        ) {
          throw new Error("MCP default refine payload was not applied.");
        }

        return mockRefineClient(payload);
      },
    );

    const defaultedContextResponse = await handleJsonRpcMessage({
      jsonrpc: "2.0",
      id: 41,
      method: "tools/call",
      params: {
        name: CONTEXT_TOOL_NAME,
        arguments: {
          purpose: "Check MCP operation defaults.",
        },
      },
    });

    if (
      defaultedCallResponse?.result?.isError ||
      defaultedCallResponse?.result?.structuredContent?.targetModel !==
        "claude" ||
      !defaultedContextResponse?.result?.content?.[0]?.text?.includes(
        "Operation defaults: targetAI: claude",
      )
    ) {
      throw new Error("MCP environment defaults self-test failed");
    }
  } finally {
    restoreEnvValue("PROMPT_AI_STUDIO_TARGET_AI", originalDefaultTargetAI);
    restoreEnvValue("PROMPT_AI_STUDIO_DOMAIN", originalDefaultDomain);
    restoreEnvValue("PROMPT_AI_STUDIO_GOAL", originalDefaultGoal);
    restoreEnvValue("PROMPT_AI_STUDIO_SOURCE_URL", originalDefaultSourceUrl);
  }

  const handoffResponse = await handleJsonRpcMessage(
    {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: HANDOFF_TOOL_NAME,
        arguments: {
          draft: "Package this draft for a target AI.",
          targetAI: "codex",
          deliveryMode: "review_required",
        },
      },
    },
    mockRefineClient,
  );

  if (
    handoffResponse?.result?.isError ||
    handoffResponse?.result?.structuredContent?.tool !== HANDOFF_TOOL_NAME ||
    handoffResponse?.result?.structuredContent?.deliveryMode !==
      "review_required"
  ) {
    throw new Error("create_handoff_package self-test failed");
  }

  const originalFallbackBaseUrl = process.env.PROMPT_AI_STUDIO_URL;
  process.env.PROMPT_AI_STUDIO_URL = "http://127.0.0.1:9";

  try {
    const fallbackResponse = await handleJsonRpcMessage({
      jsonrpc: "2.0",
      id: 50,
      method: "tools/call",
      params: {
        name: HANDOFF_TOOL_NAME,
        arguments: {
          draft: "Package this draft while the local API is unavailable.",
          targetAI: "codex",
          deliveryMode: "review_required",
        },
      },
    });
    const fallbackText = fallbackResponse?.result?.content?.[0]?.text ?? "";

    if (
      fallbackResponse?.result?.isError ||
      fallbackResponse?.result?.structuredContent?.tool !== HANDOFF_TOOL_NAME ||
      !fallbackText.includes("# Target AI Handoff Package") ||
      !fallbackText.includes("MCP bridge fallback")
    ) {
      throw new Error("create_handoff_package fallback self-test failed");
    }
  } finally {
    restoreEnvValue("PROMPT_AI_STUDIO_URL", originalFallbackBaseUrl);
  }

  const feedbackResponse = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: 6,
    method: "tools/call",
    params: {
      name: FEEDBACK_TOOL_NAME,
      arguments: {
        resultSummary: "Codex implementation passed lint and build.",
        rating: "positive",
        notes: "Keep the verification summary concise.",
      },
    },
  });

  if (
    feedbackResponse?.result?.isError ||
    feedbackResponse?.result?.structuredContent?.tool !== FEEDBACK_TOOL_NAME ||
    feedbackResponse?.result?.structuredContent?.saved !== false
  ) {
    throw new Error("save_execution_feedback self-test failed");
  }

  const invalidCallResponse = await handleJsonRpcMessage(
    {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: REFINE_TOOL_NAME,
        arguments: {},
      },
    },
    mockRefineClient,
  );

  if (invalidCallResponse?.result?.isError !== true) {
    throw new Error("invalid tools/call self-test failed");
  }

  await writeMcpSelfTestEvidence(outputPath);
  process.stdout.write("Prompt AI Studio MCP bridge self-test passed.\n");
}

async function main() {
  if (process.argv.includes("--self-test")) {
    await runSelfTest(getOutputPath(process.argv.slice(2)));
    return;
  }

  await runStdioServer();
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Prompt AI Studio MCP bridge failed."}\n`,
  );
  process.exitCode = 1;
});
