"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  inputClass,
  Panel,
  PanelHeader,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import { writeStudioDraft } from "@/lib/studio/draft";

const mcpConfigJson = `{
  "mcpServers": {
    "prompt-ai-studio": {
      "command": "node",
      "args": [
        "/Users/sungjin/dev/personal/prompt-ai-studio/mcp/prompt-ai-studio.mjs"
      ],
      "env": {
        "PROMPT_AI_STUDIO_URL": "http://localhost:3000"
      }
    }
  }
}`;

const mcpSelfTestCommand =
  "npm run smoke:mcp -- --out output/smoke/mcp-bridge-smoke.md";

const mcpDevCommand = "npm run dev";

type McpClientEvidenceDraft = {
  client: string;
  evidenceResult: string;
  feedbackRecord: string;
  reviewGate: string;
  targetAI: string;
  toolSequence: string;
};

const setupChecks = [
  "Prompt AI Studio local server is running at http://localhost:3000.",
  "MCP client config points to mcp/prompt-ai-studio.mjs.",
  "get_context_profile returns read-only workspace context policy.",
  "refine_prompt returns a review-required handoff package.",
  "create_handoff_package returns a copy-ready package for external AI review.",
  "save_execution_feedback writes only when confirmSave is true.",
  "Operator reviews the package before pasting into GPT, Claude, Codex, or Gemini.",
];

const clientSetupExamples = [
  {
    client: "Claude",
    configScope: "Desktop or project MCP config",
    targetAI: "claude",
    useCase: "Long-form reasoning, writing, analysis, and review packages.",
    operatorGate:
      "Review assumptions, citation needs, and final answer language before pasting.",
  },
  {
    client: "Codex",
    configScope: "Same MCP server config as GPT-compatible clients",
    targetAI: "codex",
    useCase:
      "Repo-aware implementation briefs with file scope, constraints, verification commands, and completion criteria.",
    operatorGate:
      "Approve destructive commands, schema changes, dependency additions, and external writes separately.",
  },
  {
    client: "GPT-compatible MCP client",
    configScope: "Any client that accepts an mcpServers entry",
    targetAI: "gpt",
    useCase:
      "General prompt execution, summarization, planning, and structured answer packages.",
    operatorGate:
      "Treat the package as copy-ready guidance; do not assume repo access or code execution.",
  },
] satisfies Array<{
  client: string;
  configScope: string;
  operatorGate: string;
  targetAI: string;
  useCase: string;
}>;

const clientSmokeTests = [
  {
    client: "Claude",
    toolSequence: "get_context_profile → refine_prompt",
    prompt:
      "Use Prompt AI Studio MCP. First call get_context_profile with allowedScopes user, company, learning, skill. Then call refine_prompt for targetAI claude with this raw input: 'Create a concise executive brief from these messy meeting notes and identify missing context.' Return only the review-required handoff package and missing context.",
    acceptance:
      "The result includes reviewRequired, language strategy, missing context, and a copy-ready Claude prompt.",
  },
  {
    client: "Codex",
    toolSequence: "get_context_profile → refine_prompt",
    prompt:
      "Use Prompt AI Studio MCP. First call get_context_profile with allowedScopes user, company, learning, skill. Then call refine_prompt for targetAI codex with this raw input: 'Add a small integrations smoke-test UI improvement with minimal scope, changed files, verification commands, and completion criteria.' Return an implementation brief only; do not run destructive commands.",
    acceptance:
      "The result contains file scope, guardrails, verification commands, and destructive-command approval notes.",
  },
  {
    client: "GPT-compatible MCP client",
    toolSequence: "get_context_profile → create_handoff_package",
    prompt:
      "Use Prompt AI Studio MCP. First call get_context_profile with allowedScopes user, company, learning. Then call create_handoff_package for targetAI gpt with deliveryMode copy-ready using a draft about improving a user onboarding checklist. Return the final GPT-ready prompt and operator notes.",
    acceptance:
      "The result is copy-ready, does not assume repo access, keeps external delivery review-required, and names the local smoke evidence to save before delivery.",
  },
] satisfies Array<{
  acceptance: string;
  client: string;
  prompt: string;
  toolSequence: string;
}>;

const smokeFeedbackTemplates = [
  {
    client: "Claude",
    targetAI: "claude",
    resultSummary:
      "Claude smoke test returned a review-required handoff package with missing context and copy-ready prompt sections.",
    rating: "positive",
    notes:
      "Confirm assumptions and final answer language were easy to inspect before delivery.",
  },
  {
    client: "Codex",
    targetAI: "codex",
    resultSummary:
      "Codex smoke test returned an implementation brief with file scope, verification commands, completion criteria, and destructive-command guardrails.",
    rating: "positive",
    notes:
      "Confirm the brief did not authorize destructive commands, schema changes, dependency additions, or external writes.",
  },
  {
    client: "GPT-compatible MCP client",
    targetAI: "gpt",
    resultSummary:
      "GPT-compatible smoke test returned a copy-ready prompt and operator notes without assuming repo access.",
    rating: "positive",
    notes:
      "Confirm the package stayed review-required and local smoke evidence was saved before external delivery.",
  },
] satisfies Array<{
  client: string;
  notes: string;
  rating: "positive" | "neutral" | "negative";
  resultSummary: string;
  targetAI: string;
}>;

const mcpSmokeRunbookSteps = [
  "Start the Prompt AI Studio local server with npm run dev.",
  "Run the MCP bridge self-test before editing any client config.",
  "Install the shared prompt-ai-studio mcpServers config in the target client.",
  "Run the matching client smoke prompt, inspect the review-required handoff package, and save the local smoke evidence.",
  "After operator review, change the matching feedback payload confirmSave value to true and call save_execution_feedback.",
  "Verify the saved record in the MCP feedback inbox API or the Integrations feedback inbox panel.",
];

const mcpEvidenceTrace = [
  "Audit source order: chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff.",
  "Keep local-smoke-evidence before target-ai-handoff.",
] satisfies string[];

const mcpEvidenceTraceSummaryItems = [
  {
    label: "감사 출처",
    value: "chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff",
  },
  {
    label: "증거 gate",
    value: "local-smoke-evidence before target-ai-handoff",
  },
] satisfies Array<{ label: string; value: string }>;

const mcpFeedbackInboxApiChecks = [
  "/api/integrations/mcp-feedback?targetAI=claude&rating=positive",
  "/api/integrations/mcp-feedback?targetAI=codex&rating=positive",
  "/api/integrations/mcp-feedback?targetAI=gpt&rating=positive",
];

const mcpFeedbackInboxCurlChecks = [
  'curl -sS "http://localhost:3000/api/integrations/mcp-feedback?limit=5&rating=positive&targetAI=claude"',
  'curl -sS "http://localhost:3000/api/integrations/mcp-feedback?limit=5&rating=positive&targetAI=codex"',
  'curl -sS "http://localhost:3000/api/integrations/mcp-feedback?limit=5&rating=positive&targetAI=gpt"',
];

const mcpFeedbackInboxFilterLinks = [
  {
    client: "Claude",
    href: "/integrations?mcpTargetAI=claude&mcpRating=positive",
    label: "Claude inbox",
    targetAI: "claude",
  },
  {
    client: "Codex",
    href: "/integrations?mcpTargetAI=codex&mcpRating=positive",
    label: "Codex inbox",
    targetAI: "codex",
  },
  {
    client: "GPT-compatible MCP client",
    href: "/integrations?mcpTargetAI=gpt&mcpRating=positive",
    label: "GPT inbox",
    targetAI: "gpt",
  },
] satisfies Array<{
  client: string;
  href: string;
  label: string;
  targetAI: string;
}>;

const mcpFeedbackVerificationChecks = [
  {
    apiHref: mcpFeedbackInboxApiChecks[0],
    client: "Claude",
    curlCommand: mcpFeedbackInboxCurlChecks[0],
    uiHref: mcpFeedbackInboxFilterLinks[0].href,
  },
  {
    apiHref: mcpFeedbackInboxApiChecks[1],
    client: "Codex",
    curlCommand: mcpFeedbackInboxCurlChecks[1],
    uiHref: mcpFeedbackInboxFilterLinks[1].href,
  },
  {
    apiHref: mcpFeedbackInboxApiChecks[2],
    client: "GPT-compatible MCP client",
    curlCommand: mcpFeedbackInboxCurlChecks[2],
    uiHref: mcpFeedbackInboxFilterLinks[2].href,
  },
] satisfies Array<{
  apiHref: string;
  client: string;
  curlCommand: string;
  uiHref: string;
}>;

const mcpClientEvidenceFields = [
  {
    key: "client",
    label: "Client",
    placeholder: "Codex",
  },
  {
    key: "targetAI",
    label: "Target AI",
    placeholder: "codex",
  },
  {
    key: "toolSequence",
    label: "Tool sequence",
    placeholder: "get_context_profile -> refine_prompt",
  },
  {
    key: "reviewGate",
    label: "Review gate",
    placeholder: "reviewRequired",
  },
  {
    key: "evidenceResult",
    label: "Evidence result",
    placeholder: "review-required handoff checked and smoke evidence saved",
  },
  {
    key: "feedbackRecord",
    label: "Feedback record",
    placeholder: "confirmSave true record appears in Feedback inbox",
  },
] satisfies Array<{
  key: keyof McpClientEvidenceDraft;
  label: string;
  placeholder: string;
}>;

const mcpConnectionSummaryItems = [
  {
    label: "대상 클라이언트",
    value: `${clientSetupExamples.length}개`,
  },
  {
    label: "공유 config",
    value: "mcpServers",
  },
  {
    label: "첫 검증",
    value: "--self-test",
  },
  {
    label: "피드백 gate",
    value: "confirmSave",
  },
] satisfies Array<{
  label: string;
  value: string;
}>;

const mcpSetupWorkflowSteps = [
  {
    action: "npm run dev로 로컬 Studio를 켜고 --self-test로 bridge 응답을 확인합니다.",
    gate: "local server + MCP bridge self-test",
    label: "01 로컬 준비",
  },
  {
    action: "같은 mcpServers config를 Claude, Codex, GPT-compatible client에 설치합니다.",
    gate: "shared config, target AI별 handoff contract",
    label: "02 클라이언트 연결",
  },
  {
    action: "client smoke prompt를 실행해 smoke evidence를 저장한 뒤 confirmSave true 피드백만 inbox에 저장합니다.",
    gate: "reviewRequired smoke evidence + confirmed feedback",
    label: "03 검증과 학습",
  },
] satisfies Array<{
  action: string;
  gate: string;
  label: string;
}>;

type CopyState =
  | "idle"
  | "config"
  | "self-test"
  | "dev"
  | "client"
  | "smoke-prompt"
  | "client-evidence"
  | "client-feedback-payload"
  | "client-feedback-check"
  | "feedback-payload"
  | "runbook"
  | "inbox-api"
  | "inbox-curl"
  | "draftError"
  | "error";

type CopyValue = (value: string, nextState: CopyState) => void;
type ClientSetupExample = (typeof clientSetupExamples)[number];
type FeedbackVerificationCheck = (typeof mcpFeedbackVerificationChecks)[number];
type ClientSmokeTest = (typeof clientSmokeTests)[number];
type SmokeFeedbackTemplate = (typeof smokeFeedbackTemplates)[number];

function buildClientSetupNote(
  setup: (typeof clientSetupExamples)[number],
) {
  return [
    `# Prompt AI Studio MCP Setup: ${setup.client}`,
    "",
    "Shared MCP server config:",
    mcpConfigJson,
    "",
    `- Config scope: ${setup.configScope}`,
    `- Target AI: ${setup.targetAI}`,
    `- Use case: ${setup.useCase}`,
    `- Operator gate: ${setup.operatorGate}`,
    "",
    "Smoke test:",
    `- ${mcpDevCommand}`,
    `- ${mcpSelfTestCommand}`,
    "- Call get_context_profile before refine_prompt.",
    "- Confirm the returned handoff package is reviewRequired before using it.",
    "- Save local smoke evidence before external delivery.",
  ].join("\n");
}

function buildClientSmokeTestPrompt(
  smokeTest: (typeof clientSmokeTests)[number],
) {
  return [
    `# Prompt AI Studio MCP Smoke Test: ${smokeTest.client}`,
    "",
    `Tool sequence: ${smokeTest.toolSequence}`,
    "",
    "Prompt to run in the MCP-enabled client:",
    smokeTest.prompt,
    "",
    `Acceptance check: ${smokeTest.acceptance}`,
    "",
    "Gate: save local smoke evidence and inspect the review-required package before using it in an external AI environment.",
  ].join("\n");
}

function buildSmokeFeedbackPayload(
  template: (typeof smokeFeedbackTemplates)[number],
) {
  return JSON.stringify(
    {
      promptId: `mcp-smoke-${template.targetAI}`,
      targetAI: template.targetAI,
      resultSummary: template.resultSummary,
      rating: template.rating,
      notes: template.notes,
      confirmSave: false,
      reviewGate:
        "Set confirmSave to true only after the operator reviews the actual smoke result.",
    },
    null,
    2,
  );
}

function buildMcpEndToEndSmokeRunbook() {
  return [
    "# Prompt AI Studio MCP End-to-End Smoke Runbook",
    "",
    "Scope: Claude, Codex, and GPT-compatible MCP clients.",
    "Gate: local-first automation, smoke evidence saved, review-required external delivery, and confirmSave only after operator review.",
    ...mcpEvidenceTrace,
    "",
    "Steps:",
    ...mcpSmokeRunbookSteps.map((step, index) => `${index + 1}. ${step}`),
    "",
    "Shared commands:",
    `- ${mcpDevCommand}`,
    `- ${mcpSelfTestCommand}`,
    "",
    "Feedback inbox API checks:",
    ...mcpFeedbackInboxApiChecks.map((href) => `- ${href}`),
    "",
    "Feedback inbox curl checks:",
    ...mcpFeedbackInboxCurlChecks.map((command) => `- ${command}`),
    "",
    "Feedback inbox UI filters:",
    ...mcpFeedbackInboxFilterLinks.map(
      (link) => `- ${link.client}: ${link.href}`,
    ),
    "",
    "Acceptance:",
    "- get_context_profile returns read-only context policy.",
    "- refine_prompt or create_handoff_package returns reviewRequired output.",
    "- save_execution_feedback writes only after confirmSave is true.",
    "- MCP feedback inbox shows the expected targetAI and positive rating record.",
  ].join("\n");
}

function buildMcpFeedbackInboxApiCheckList() {
  return mcpFeedbackInboxApiChecks.join("\n");
}

function buildMcpFeedbackInboxCurlCheckList() {
  return mcpFeedbackInboxCurlChecks.join("\n");
}

function formatMcpClientEvidenceValue(value: string, fallback: string) {
  return value.trim() || fallback;
}

function buildMcpClientEvidencePacket(draft: McpClientEvidenceDraft) {
  return [
    "# Prompt AI Studio MCP Client Smoke Evidence",
    "",
    "Surface: MCP client",
    "Gate: actual MCP client smoke, review-required package, local evidence before target handoff.",
    "",
    ...mcpClientEvidenceFields.map(
      (field) =>
        `- ${field.label}: ${formatMcpClientEvidenceValue(
          draft[field.key],
          field.placeholder,
        )}`,
    ),
    "",
    "Operator decision:",
    "- Copy only after the MCP client returned a review-required package.",
    "- Save execution feedback only after the external AI result is reviewed.",
  ].join("\n");
}

function buildMcpClientFeedbackPayload(draft: McpClientEvidenceDraft) {
  const client = formatMcpClientEvidenceValue(draft.client, "Codex");
  const targetAI = formatMcpClientEvidenceValue(draft.targetAI, "codex");
  const reviewGate = formatMcpClientEvidenceValue(
    draft.reviewGate,
    "reviewRequired",
  );

  return JSON.stringify(
    {
      promptId: `mcp-client-smoke-${targetAI.toLowerCase()}`,
      targetAI,
      resultSummary: `${client} MCP smoke returned ${reviewGate}.`,
      rating: "positive",
      notes: [
        `Client: ${client}`,
        `Tool sequence: ${formatMcpClientEvidenceValue(
          draft.toolSequence,
          "get_context_profile -> refine_prompt",
        )}`,
        `Evidence: ${formatMcpClientEvidenceValue(
          draft.evidenceResult,
          "review-required handoff checked and smoke evidence saved",
        )}`,
        `Feedback record: ${formatMcpClientEvidenceValue(
          draft.feedbackRecord,
          "confirmSave true record appears in Feedback inbox",
        )}`,
        "Set confirmSave to true only after the operator reviews the actual MCP client result.",
      ].join("\n"),
      confirmSave: false,
      reviewGate:
        "Set confirmSave to true only after the operator reviews the actual MCP client result.",
    },
    null,
    2,
  );
}

function buildMcpClientFeedbackInboxCheck(draft: McpClientEvidenceDraft) {
  const targetAI = formatMcpClientEvidenceValue(
    draft.targetAI,
    "codex",
  ).toLowerCase();
  const encodedTargetAI = encodeURIComponent(targetAI);

  return [
    "# Prompt AI Studio MCP Client Feedback Inbox Check",
    "",
    "Gate: run this after save_execution_feedback confirmSave true.",
    `Target AI: ${targetAI}`,
    `UI: /integrations?mcpRating=positive&mcpTargetAI=${encodedTargetAI}#integrations-feedback-inbox`,
    `API: /api/integrations/mcp-feedback?limit=5&rating=positive&targetAI=${encodedTargetAI}`,
    `Curl: curl -sS "http://localhost:3000/api/integrations/mcp-feedback?limit=5&rating=positive&targetAI=${encodedTargetAI}"`,
  ].join("\n");
}

function McpConnectionSummary() {
  return (
    <div
      className="grid grid-cols-2 gap-2 border-b border-line px-5 py-4 xl:grid-cols-4"
      data-testid="mcp-connection-summary"
    >
      {mcpConnectionSummaryItems.map((item) => (
        <div
          className="min-w-0 rounded-md border border-line bg-surface p-3"
          key={item.label}
        >
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
            {item.label}
          </p>
          <p className="mt-1 break-words text-xs font-semibold text-soft">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function McpSetupWorkflow() {
  return (
    <div
      className="grid gap-3 border-b border-line px-5 py-4 lg:grid-cols-3"
      data-testid="mcp-setup-workflow"
    >
      {mcpSetupWorkflowSteps.map((step) => (
        <div
          className="min-w-0 rounded-md border border-line bg-surface p-4"
          key={step.label}
        >
          <p className="font-mono text-xs font-semibold text-accent">
            {step.label}
          </p>
          <p className="mt-3 break-words text-sm leading-6 text-soft">
            {step.action}
          </p>
          <p className="mt-3 break-words text-xs leading-5 text-muted">
            {step.gate}
          </p>
        </div>
      ))}
    </div>
  );
}

function McpSetupCommandBar({ onCopy }: { onCopy: CopyValue }) {
  return (
    <div
      className="flex flex-col gap-2 sm:flex-row"
      data-testid="mcp-setup-command-bar"
    >
      <button
        className={secondaryButtonClass}
        onClick={() => onCopy(mcpConfigJson, "config")}
        type="button"
      >
        MCP config 복사
      </button>
      <button
        className={secondaryButtonClass}
        onClick={() => onCopy(mcpSelfTestCommand, "self-test")}
        type="button"
      >
        Self-test 명령 복사
      </button>
      <button
        className={secondaryButtonClass}
        onClick={() => onCopy(mcpDevCommand, "dev")}
        type="button"
      >
        Dev server 명령 복사
      </button>
    </div>
  );
}

function McpClientConfigPanel() {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Client config
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">
        Codex와 GPT-compatible MCP client는 같은 server config를
        공유합니다. 차이는 연결 설정이 아니라 target AI별 handoff contract와
        operator gate입니다.
      </p>
      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-soft">
        {mcpConfigJson}
      </pre>
    </div>
  );
}

function McpSetupManualCopyTextarea({ value }: { value: string }) {
  return (
    <textarea
      aria-label="MCP setup manual copy"
      className={`${textareaClass} min-h-40 font-mono text-xs`}
      readOnly
      value={value}
    />
  );
}

function McpSetupManualCopyNotice({
  copyState,
  manualCopyText,
}: {
  copyState: CopyState;
  manualCopyText: string;
}) {
  if (copyState === "idle") {
    return null;
  }

  const isError = copyState === "error" || copyState === "draftError";
  const message =
    copyState === "error"
      ? "복사에 실패했습니다. 아래 내용을 직접 선택해 복사하세요."
      : copyState === "draftError"
        ? "Studio 초안을 저장하지 못했습니다. 아래 runbook을 직접 선택해 복사하세요."
        : copyState === "client-evidence"
          ? "MCP client smoke 증빙을 복사했습니다."
          : copyState === "client-feedback-payload"
            ? "MCP save_execution_feedback payload를 복사했습니다."
            : copyState === "client-feedback-check"
              ? "MCP feedback inbox 확인 명령을 복사했습니다."
        : "복사했습니다.";

  return (
    <div className="space-y-3">
      <p
        className={`text-sm ${
          isError ? "text-danger" : "text-accent"
        }`}
      >
        {message}
      </p>
      {manualCopyText ? (
        <McpSetupManualCopyTextarea value={manualCopyText} />
      ) : null}
    </div>
  );
}

function McpToolOverview() {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Tool
      </p>
      <p className="mt-2 font-mono text-sm text-foreground">
        get_context_profile, refine_prompt, create_handoff_package,
        save_execution_feedback
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">
        context policy를 먼저 읽고, rawInput을 GPT, Claude, Codex, Gemini용
        handoff package로 변환합니다. 이미 정리된 초안은
        create_handoff_package로 복사 가능한 전달 패키지로 만듭니다. 실행
        결과 피드백은 confirmSave가 true일 때만 로컬 inbox에 저장합니다.
        외부 AI 자동 전송은 하지 않습니다.
      </p>
    </div>
  );
}

function McpOperatorChecklist() {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Operator checklist
      </p>
      <ul className="mt-3 space-y-2">
        {setupChecks.map((check) => (
          <li className="flex gap-2 text-sm leading-5 text-soft" key={check}>
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
            <span className="break-words">{check}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function McpCardDetail({
  label,
  tone = "soft",
  value,
}: {
  label: string;
  tone?: "soft" | "muted" | "mono-soft" | "mono-muted";
  value: string;
}) {
  const valueClass =
    tone === "mono-soft"
      ? "font-mono text-xs text-soft"
      : tone === "mono-muted"
        ? "font-mono text-xs text-muted"
        : tone === "muted"
          ? "text-muted"
          : "text-soft";

  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd className={`mt-1 break-words ${valueClass}`}>{value}</dd>
    </div>
  );
}

function FeedbackVerificationCard({
  check,
  onCopy,
}: {
  check: FeedbackVerificationCheck;
  onCopy: CopyValue;
}) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {check.client}
          </p>
          <Link
            className="mt-1 block break-words font-mono text-xs text-accent transition hover:text-soft"
            href={check.uiHref}
          >
            UI filter
          </Link>
        </div>
        <button
          className={secondaryButtonClass}
          onClick={() => onCopy(check.curlCommand, "inbox-curl")}
          type="button"
        >
          Curl 복사
        </button>
      </div>
      <dl className="mt-4 space-y-3 text-sm leading-6">
        <McpCardDetail
          label="API endpoint"
          tone="mono-soft"
          value={check.apiHref}
        />
        <McpCardDetail
          label="Curl check"
          tone="mono-muted"
          value={check.curlCommand}
        />
      </dl>
    </div>
  );
}

function FeedbackVerificationCards({ onCopy }: { onCopy: CopyValue }) {
  return (
    <div
      className="grid gap-3 px-5 pb-4 lg:grid-cols-3"
      data-testid="mcp-feedback-verification-cards"
    >
      {mcpFeedbackVerificationChecks.map((check) => (
        <FeedbackVerificationCard
          check={check}
          key={check.client}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
}

function FeedbackVerificationTable({ onCopy }: { onCopy: CopyValue }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead className="border-y border-line text-xs uppercase tracking-[0.12em] text-muted">
          <tr>
            <th className="px-5 py-3 font-semibold">Client</th>
            <th className="px-5 py-3 font-semibold">UI filter</th>
            <th className="px-5 py-3 font-semibold">API endpoint</th>
            <th className="px-5 py-3 font-semibold">Curl check</th>
            <th className="px-5 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {mcpFeedbackVerificationChecks.map((check) => (
            <tr key={check.client}>
              <td className="px-5 py-4 align-top font-semibold text-foreground">
                {check.client}
              </td>
              <td className="px-5 py-4 align-top">
                <Link
                  className="break-words font-mono text-xs text-accent transition hover:text-soft"
                  href={check.uiHref}
                >
                  {check.uiHref}
                </Link>
              </td>
              <td className="px-5 py-4 align-top font-mono text-xs leading-5 text-soft">
                {check.apiHref}
              </td>
              <td className="px-5 py-4 align-top font-mono text-xs leading-5 text-soft">
                {check.curlCommand}
              </td>
              <td className="px-5 py-4 align-top">
                <button
                  className={secondaryButtonClass}
                  onClick={() => onCopy(check.curlCommand, "inbox-curl")}
                  type="button"
                >
                  Curl 복사
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClientSetupCard({
  onCopy,
  setup,
}: {
  onCopy: CopyValue;
  setup: ClientSetupExample;
}) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {setup.client}
          </p>
          <p className="mt-1 break-words font-mono text-xs text-accent">
            {setup.targetAI}
          </p>
        </div>
        <button
          className={secondaryButtonClass}
          onClick={() => onCopy(buildClientSetupNote(setup), "client")}
          type="button"
        >
          설정 복사
        </button>
      </div>
      <dl className="mt-4 space-y-3 text-sm leading-6">
        <McpCardDetail label="Config scope" value={setup.configScope} />
        <McpCardDetail label="Use case" value={setup.useCase} />
        <McpCardDetail
          label="Operator gate"
          tone="muted"
          value={setup.operatorGate}
        />
      </dl>
    </div>
  );
}

function ClientSetupCards({ onCopy }: { onCopy: CopyValue }) {
  return (
    <div
      className="grid gap-3 px-5 pb-4 lg:grid-cols-3"
      data-testid="mcp-client-setup-cards"
    >
      {clientSetupExamples.map((setup) => (
        <ClientSetupCard key={setup.client} onCopy={onCopy} setup={setup} />
      ))}
    </div>
  );
}

function ClientSetupTable({ onCopy }: { onCopy: CopyValue }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="border-y border-line text-xs uppercase tracking-[0.12em] text-muted">
          <tr>
            <th className="px-5 py-3 font-semibold">Client</th>
            <th className="px-5 py-3 font-semibold">Config scope</th>
            <th className="px-5 py-3 font-semibold">Target AI</th>
            <th className="px-5 py-3 font-semibold">Use case</th>
            <th className="px-5 py-3 font-semibold">Operator gate</th>
            <th className="px-5 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {clientSetupExamples.map((setup) => (
            <tr key={setup.client}>
              <td className="px-5 py-4 align-top font-semibold text-foreground">
                {setup.client}
              </td>
              <td className="px-5 py-4 align-top leading-6 text-muted">
                {setup.configScope}
              </td>
              <td className="px-5 py-4 align-top font-mono text-xs text-soft">
                {setup.targetAI}
              </td>
              <td className="px-5 py-4 align-top leading-6 text-soft">
                {setup.useCase}
              </td>
              <td className="px-5 py-4 align-top leading-6 text-muted">
                {setup.operatorGate}
              </td>
              <td className="px-5 py-4 align-top">
                <button
                  className={secondaryButtonClass}
                  onClick={() => onCopy(buildClientSetupNote(setup), "client")}
                  type="button"
                >
                  설정 예시 복사
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClientSmokePromptRow({
  onCopy,
  smokeTest,
}: {
  onCopy: CopyValue;
  smokeTest: ClientSmokeTest;
}) {
  return (
    <tr>
      <td className="px-5 py-4 align-top font-semibold text-foreground">
        {smokeTest.client}
      </td>
      <td className="px-5 py-4 align-top font-mono text-xs leading-5 text-soft">
        {smokeTest.toolSequence}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-muted">
        {smokeTest.prompt}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-soft">
        {smokeTest.acceptance}
      </td>
      <td className="px-5 py-4 align-top">
        <button
          className={secondaryButtonClass}
          onClick={() =>
            onCopy(buildClientSmokeTestPrompt(smokeTest), "smoke-prompt")
          }
          type="button"
        >
          테스트 프롬프트 복사
        </button>
      </td>
    </tr>
  );
}

function ClientSmokePromptTable({ onCopy }: { onCopy: CopyValue }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead className="border-y border-line text-xs uppercase tracking-[0.12em] text-muted">
          <tr>
            <th className="px-5 py-3 font-semibold">Client</th>
            <th className="px-5 py-3 font-semibold">Tool sequence</th>
            <th className="px-5 py-3 font-semibold">Smoke prompt</th>
            <th className="px-5 py-3 font-semibold">Acceptance</th>
            <th className="px-5 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {clientSmokeTests.map((smokeTest) => (
            <ClientSmokePromptRow
              key={smokeTest.client}
              onCopy={onCopy}
              smokeTest={smokeTest}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SmokeFeedbackPayloadRow({
  onCopy,
  template,
}: {
  onCopy: CopyValue;
  template: SmokeFeedbackTemplate;
}) {
  return (
    <tr>
      <td className="px-5 py-4 align-top font-semibold text-foreground">
        {template.client}
      </td>
      <td className="px-5 py-4 align-top font-mono text-xs text-soft">
        {template.targetAI}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-soft">
        {template.resultSummary}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-muted">
        confirmSave defaults to false. Set it to true only after operator
        review.
      </td>
      <td className="px-5 py-4 align-top">
        <button
          className={secondaryButtonClass}
          onClick={() =>
            onCopy(buildSmokeFeedbackPayload(template), "feedback-payload")
          }
          type="button"
        >
          피드백 payload 복사
        </button>
      </td>
    </tr>
  );
}

function SmokeFeedbackPayloadTable({ onCopy }: { onCopy: CopyValue }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead className="border-y border-line text-xs uppercase tracking-[0.12em] text-muted">
          <tr>
            <th className="px-5 py-3 font-semibold">Client</th>
            <th className="px-5 py-3 font-semibold">Target AI</th>
            <th className="px-5 py-3 font-semibold">Result summary</th>
            <th className="px-5 py-3 font-semibold">Review gate</th>
            <th className="px-5 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {smokeFeedbackTemplates.map((template) => (
            <SmokeFeedbackPayloadRow
              key={template.client}
              onCopy={onCopy}
              template={template}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function McpEndToEndRunbookSection({
  onCopy,
  onOpenInStudio,
}: {
  onCopy: CopyValue;
  onOpenInStudio: () => void;
}) {
  return (
    <div className="border-t border-line" data-testid="mcp-runbook-section">
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            End-to-end smoke runbook
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            config 설치부터 client smoke prompt, confirmSave feedback 저장,
            feedback inbox 확인까지 한 번에 점검합니다.
          </p>
          <div
            className="mt-3 grid gap-2 sm:grid-cols-2"
            data-testid="mcp-runbook-evidence-trace-summary"
          >
            {mcpEvidenceTraceSummaryItems.map((item) => (
              <div
                className="min-w-0 rounded-md border border-line bg-surface px-3 py-2"
                key={item.label}
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  {item.label}
                </p>
                <p className="mt-1 break-words text-xs font-semibold text-soft">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className={secondaryButtonClass}
            onClick={() => onCopy(buildMcpEndToEndSmokeRunbook(), "runbook")}
            type="button"
          >
            전체 runbook 복사
          </button>
          <button
            className={secondaryButtonClass}
            onClick={() =>
              onCopy(buildMcpFeedbackInboxApiCheckList(), "inbox-api")
            }
            type="button"
          >
            Inbox API 복사
          </button>
          <button
            className={secondaryButtonClass}
            onClick={() =>
              onCopy(buildMcpFeedbackInboxCurlCheckList(), "inbox-curl")
            }
            type="button"
          >
            Curl checks 복사
          </button>
          <button
            className={secondaryButtonClass}
            onClick={onOpenInStudio}
            type="button"
          >
            Runbook Studio로
          </button>
        </div>
      </div>
      <ol className="divide-y divide-line px-5">
        {mcpSmokeRunbookSteps.map((step, index) => (
          <li
            className="grid gap-3 py-3 sm:grid-cols-[40px_minmax(0,1fr)]"
            key={step}
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-panel-strong font-mono text-xs text-soft">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="break-words text-sm leading-6 text-soft">
              {step}
            </span>
          </li>
        ))}
      </ol>
      <div className="grid gap-3 border-t border-line px-5 py-4 md:grid-cols-3">
        {mcpFeedbackInboxFilterLinks.map((link) => (
          <Link
            className={secondaryButtonClass}
            href={link.href}
            key={link.targetAI}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Feedback verification matrix
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            smoke feedback 저장 후 target AI별 UI filter, API endpoint, curl
            smoke check를 같은 행에서 대조합니다.
          </p>
        </div>
        <FeedbackVerificationCards onCopy={onCopy} />
        <FeedbackVerificationTable onCopy={onCopy} />
      </div>
    </div>
  );
}

function ClientExamplesSection({ onCopy }: { onCopy: CopyValue }) {
  return (
    <div className="border-t border-line" data-testid="mcp-client-examples-section">
      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Client examples
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          설정은 공통 MCP bridge를 재사용하고, 실행 문맥만 Claude, Codex,
          GPT-compatible client별로 나눕니다.
        </p>
      </div>
      <ClientSetupCards onCopy={onCopy} />
      <ClientSetupTable onCopy={onCopy} />
    </div>
  );
}

function ClientSmokePromptsSection({ onCopy }: { onCopy: CopyValue }) {
  return (
    <div className="border-t border-line" data-testid="mcp-smoke-prompts-section">
      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Client smoke prompts
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          MCP 연결 후 각 client에서 바로 실행해 볼 수 있는 최소 테스트
          프롬프트입니다. 제품별 내부 명령이 아니라 tool 호출을 유도하는 검증
          문장으로 관리합니다.
        </p>
      </div>
      <ClientSmokePromptTable onCopy={onCopy} />
    </div>
  );
}

function McpActualClientEvidenceSection({
  draft,
  onChange,
  onCopy,
  onCopyFeedback,
  onCopyFeedbackCheck,
}: {
  draft: McpClientEvidenceDraft;
  onChange: (key: keyof McpClientEvidenceDraft, value: string) => void;
  onCopy: () => void;
  onCopyFeedback: () => void;
  onCopyFeedbackCheck: () => void;
}) {
  return (
    <div
      className="border-t border-line px-5 py-4"
      data-testid="mcp-actual-client-evidence"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Actual client evidence
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            실제 MCP client에서 확인한 결과를 그대로 적고, review-required
            smoke 증빙과 confirmSave 전 feedback payload를 같은 기준으로
            복사합니다.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className={secondaryButtonClass} onClick={onCopy} type="button">
            MCP client 증빙 복사
          </button>
          <button
            className={secondaryButtonClass}
            onClick={onCopyFeedback}
            type="button"
          >
            MCP feedback payload 복사
          </button>
          <button
            className={secondaryButtonClass}
            onClick={onCopyFeedbackCheck}
            type="button"
          >
            MCP inbox 확인 복사
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {mcpClientEvidenceFields.map((field) => (
          <label className="min-w-0" key={field.key}>
            <span className="mb-2 block text-xs font-semibold text-soft">
              {field.label}
            </span>
            <input
              className={inputClass}
              onChange={(event) => onChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              value={draft[field.key]}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function SmokeFeedbackPayloadSection({ onCopy }: { onCopy: CopyValue }) {
  return (
    <div className="border-t border-line" data-testid="mcp-feedback-payload-section">
      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Smoke feedback payloads
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          smoke 실행 결과를 학습 루프로 되돌릴 때 쓰는
          save_execution_feedback payload 템플릿입니다. 실제 결과를 확인한 뒤에만
          confirmSave를 true로 바꿉니다.
        </p>
      </div>
      <SmokeFeedbackPayloadTable onCopy={onCopy} />
    </div>
  );
}

export function McpConnectionPanel() {
  const router = useRouter();
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [manualCopyText, setManualCopyText] = useState("");
  const [mcpClientEvidenceDraft, setMcpClientEvidenceDraft] =
    useState<McpClientEvidenceDraft>({
      client: "",
      evidenceResult: "",
      feedbackRecord: "",
      reviewGate: "",
      targetAI: "",
      toolSequence: "",
    });

  async function copyValue(value: string, nextState: CopyState) {
    const copied = await copyTextToClipboard(value);
    setCopyState(copied ? nextState : "error");
    setManualCopyText(copied ? "" : value);
  }

  function updateMcpClientEvidenceDraft(
    key: keyof McpClientEvidenceDraft,
    value: string,
  ) {
    setMcpClientEvidenceDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openRunbookInStudio() {
    const rawInput = buildMcpEndToEndSmokeRunbook();
    const wroteDraft = writeStudioDraft({
      source: "integrations-operations-checklist",
      rawInput,
      goal: "MCP end-to-end smoke 운영 개선 계획",
      domain: "External AI integrations · MCP smoke runbook",
      targetModels: ["claude", "codex", "gpt"],
      outputLanguage: "korean",
      sourceTitle: "Integrations MCP end-to-end smoke runbook",
      sourceHref: "/integrations#integrations-mcp-connection",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setCopyState("draftError");
      setManualCopyText(rawInput);
      return;
    }

    router.push("/studio?draft=integrations-operations-checklist");
  }

  return (
    <Panel>
      <PanelHeader
        title="MCP 연결 설정"
        description="Claude, Codex, GPT 계열 MCP 클라이언트에서 Prompt AI Studio를 도구로 호출하기 위한 로컬 설정입니다."
      />
      <McpConnectionSummary />
      <McpSetupWorkflow />
      <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
        <div className="min-w-0 space-y-4">
          <McpSetupCommandBar onCopy={copyValue} />
          <McpClientConfigPanel />
          <McpSetupManualCopyNotice
            copyState={copyState}
            manualCopyText={manualCopyText}
          />
        </div>

        <div className="min-w-0 space-y-4">
          <McpToolOverview />
          <McpOperatorChecklist />
        </div>
      </div>

      <McpEndToEndRunbookSection
        onCopy={copyValue}
        onOpenInStudio={openRunbookInStudio}
      />
      <ClientExamplesSection onCopy={copyValue} />
      <ClientSmokePromptsSection onCopy={copyValue} />
      <McpActualClientEvidenceSection
        draft={mcpClientEvidenceDraft}
        onChange={updateMcpClientEvidenceDraft}
        onCopy={() =>
          copyValue(
            buildMcpClientEvidencePacket(mcpClientEvidenceDraft),
            "client-evidence",
          )
        }
        onCopyFeedback={() =>
          copyValue(
            buildMcpClientFeedbackPayload(mcpClientEvidenceDraft),
            "client-feedback-payload",
          )
        }
        onCopyFeedbackCheck={() =>
          copyValue(
            buildMcpClientFeedbackInboxCheck(mcpClientEvidenceDraft),
            "client-feedback-check",
          )
        }
      />
      <SmokeFeedbackPayloadSection onCopy={copyValue} />
    </Panel>
  );
}
