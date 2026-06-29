"use client";

import { useState } from "react";

import {
  inputClass,
  Panel,
  PanelHeader,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import { copyTextToClipboard } from "@/lib/browser/clipboard";

type ConnectionReadinessCheck = {
  installStep: string;
  operatorAction: string;
  smokeTest: string;
  statusGate: string;
  surface: string;
};

type ChromeLoadedSmokeCheck = {
  evidence: string;
  gate: string;
  operatorCheck: string;
  step: string;
};

type ChromeLoadedEvidenceDraft = {
  evidenceResult: string;
  reviewGate: string;
  runtime: string;
  session: string;
  source: string;
  targetAI: string;
};

const readinessChecks = [
  {
    surface: "Chrome extension",
    statusGate: "Local server + unpacked extension",
    installStep:
      "Run npm run dev, open chrome://extensions, enable Developer mode, then Load unpacked from extensions/chrome.",
    smokeTest:
      "Select text on any page, choose Refine with Prompt AI Studio, then confirm a review-required handoff package appears.",
    operatorAction:
      "Check sensitive page text and target AI before copying the package.",
  },
  {
    surface: "MCP client",
    statusGate: "Bridge self-test + client config",
    installStep:
      "Copy the mcpServers prompt-ai-studio config into the client and point PROMPT_AI_STUDIO_URL to http://localhost:3000.",
    smokeTest:
      "Run the MCP bridge self-test, then call tools/list and refine_prompt from the client.",
    operatorAction:
      "Confirm save_execution_feedback uses confirmSave: true only after result review.",
  },
  {
    surface: "ChatGPT / Claude / Gemini",
    statusGate: "Copy-ready handoff package",
    installStep:
      "Use Studio, Chrome, or MCP to produce the package; no direct account integration is required for MVP.",
    smokeTest:
      "Paste the package into the target AI and confirm it follows the requested language strategy and output format.",
    operatorAction:
      "Review assumptions, missing context, and final answer language before execution.",
  },
  {
    surface: "Codex",
    statusGate: "Scoped development brief",
    installStep:
      "Send the Codex handoff as a task brief with files, constraints, verification commands, and completion criteria.",
    smokeTest:
      "Confirm Codex reports changed files, verification evidence, and any remaining risk.",
    operatorAction:
      "Approve destructive commands, schema changes, external writes, and dependency additions separately.",
  },
] satisfies ConnectionReadinessCheck[];

const smokeTestCommands = [
  "npm run dev",
  "npm run smoke:chrome-extension -- --out docs/evidence/chrome-extension-smoke.md",
  "npm run smoke:mcp -- --out docs/evidence/mcp-bridge-smoke.md",
  "npm run smoke:learning-feedback -- --out docs/evidence/learning-feedback-smoke.md",
  "npm run verify:integrations",
];

const chromeLoadedSmokeChecks = [
  {
    step: "01 Runtime",
    gate: "Unpacked extension + localhost:3000",
    evidence: "popup status is not Chrome extension runtime unavailable",
    operatorCheck: "Studio URL stays local-only before capture.",
  },
  {
    step: "02 Capture",
    gate: "selection and source URL collected",
    evidence: "Source selection contains page text and source URL is available",
    operatorCheck: "Sensitive text is acceptable for local refine.",
  },
  {
    step: "03 Result",
    gate: "reviewRequired handoff generated",
    evidence: "Review gate, Target AI, Source, Session summary appears",
    operatorCheck: "Target AI and missing context are checked before copy.",
  },
  {
    step: "04 Restore",
    gate: "session handoff can be restored or cleared",
    evidence: "reopen popup restores saved handoff; Clear removes it",
    operatorCheck: "Old packages are cleared when they should not be reused.",
  },
  {
    step: "05 Evidence",
    gate: "handoff evidence packet can be copied or selected manually",
    evidence: "Evidence button copies packet; manual textarea opens on copy failure",
    operatorCheck: "Evidence is recorded before external feedback is saved.",
  },
] satisfies ChromeLoadedSmokeCheck[];

const chromeLoadedEvidenceRows = [
  {
    label: "Runtime",
    value: "extension loaded, localhost:3000 reachable",
  },
  {
    label: "Capture",
    value: "selected text, page title, source URL reviewed",
  },
  {
    label: "Result",
    value: "reviewRequired handoff summary checked before copy",
  },
  {
    label: "Restore",
    value: "session restore checked, stale package cleared when needed",
  },
  {
    label: "Evidence",
    value: "Chrome handoff evidence packet copied or manual fallback selected",
  },
] satisfies Array<{
  label: string;
  value: string;
}>;

const chromeLoadedOperatorEvidenceFields = [
  {
    key: "runtime",
    label: "Runtime",
    placeholder: "extension runtime connected · local Studio URL only",
  },
  {
    key: "source",
    label: "Source",
    placeholder: "Example Page (example.com)",
  },
  {
    key: "reviewGate",
    label: "Review gate",
    placeholder: "reviewRequired",
  },
  {
    key: "targetAI",
    label: "Target AI",
    placeholder: "codex",
  },
  {
    key: "session",
    label: "Session",
    placeholder: "Saved Jun 29 02:30",
  },
  {
    key: "evidenceResult",
    label: "Evidence result",
    placeholder: "Evidence packet copied or manual fallback selected",
  },
] satisfies Array<{
  key: keyof ChromeLoadedEvidenceDraft;
  label: string;
  placeholder: string;
}>;

const readinessSummaryItems = [
  { label: "연결 표면", value: `${readinessChecks.length}개` },
  { label: "첫 실행", value: readinessChecks[0].surface },
  { label: "Smoke 명령", value: `${smokeTestCommands.length}개` },
  { label: "승인 gate", value: "review-required" },
];

type CopyState =
  | "idle"
  | "checklist"
  | "smoke"
  | "chrome-smoke"
  | "chrome-evidence"
  | "chrome-operator-evidence"
  | "chrome-feedback-payload"
  | "chrome-feedback-check"
  | "error";

function buildConnectionReadinessChecklist() {
  return [
    "# Prompt AI Studio Connection Readiness Checklist",
    "",
    "Gate: local-first automation, review-required external delivery.",
    "Scope: Chrome extension, MCP client, ChatGPT / Claude / Gemini, Codex.",
    "",
    ...readinessChecks.flatMap((check, index) => [
      `## ${index + 1}. ${check.surface}`,
      "",
      `- Status gate: ${check.statusGate}`,
      `- Install step: ${check.installStep}`,
      `- Smoke test: ${check.smokeTest}`,
      `- Operator action: ${check.operatorAction}`,
      "",
    ]),
    "Smoke test commands:",
    ...smokeTestCommands.map((command) => `- ${command}`),
  ].join("\n");
}

function buildSmokeTestCommandBlock() {
  return smokeTestCommands.join("\n");
}

function buildChromeLoadedExtensionSmokeChecklist() {
  return [
    "# Prompt AI Studio Chrome Loaded Extension Smoke",
    "",
    "Gate: loaded Chrome extension, local refine API, review-required handoff, session restore.",
    "",
    ...chromeLoadedSmokeChecks.flatMap((check) => [
      `## ${check.step}`,
      "",
      `- Gate: ${check.gate}`,
      `- Evidence: ${check.evidence}`,
      `- Operator check: ${check.operatorCheck}`,
      "",
    ]),
    "Pass condition:",
    "- The popup produces a reviewRequired handoff package.",
    "- The handoff result summary shows review gate, target AI, source, and session state before copying.",
    "- The Evidence button copies the Chrome handoff evidence packet or opens the manual textarea.",
    "- The operator clears stale packages that should not be reused.",
  ].join("\n");
}

function buildChromeLoadedExtensionEvidencePacket() {
  return [
    "# Prompt AI Studio Chrome Loaded Extension Evidence",
    "",
    "Surface: Chrome extension",
    "Gate: review-required handoff, operator-reviewed delivery, session trace.",
    "",
    ...chromeLoadedEvidenceRows.map(
      (row) => `- ${row.label}: ${row.value}`,
    ),
    "",
    "Operator decision:",
    "- Copy only after review gate, target AI, source, and session state are checked.",
    "- Save execution feedback only after the external AI result is reviewed.",
  ].join("\n");
}

function formatChromeLoadedEvidenceValue(value: string, fallback: string) {
  return value.trim() || fallback;
}

function buildChromeLoadedOperatorEvidencePacket(
  draft: ChromeLoadedEvidenceDraft,
) {
  return [
    "# Prompt AI Studio Chrome Loaded Extension Operator Evidence",
    "",
    "Surface: Chrome extension",
    "Gate: actual loaded-extension smoke evidence.",
    "",
    ...chromeLoadedOperatorEvidenceFields.map(
      (field) =>
        `- ${field.label}: ${formatChromeLoadedEvidenceValue(
          draft[field.key],
          field.placeholder,
        )}`,
    ),
    "",
    "Operator decision:",
    "- Copy only after review gate, target AI, source, and session state are checked.",
    "- Save execution feedback only after the external AI result is reviewed.",
  ].join("\n");
}

function buildChromeLoadedFeedbackPayload(draft: ChromeLoadedEvidenceDraft) {
  const targetAI = formatChromeLoadedEvidenceValue(draft.targetAI, "codex");
  const source = formatChromeLoadedEvidenceValue(
    draft.source,
    "Chrome loaded extension smoke",
  );
  const reviewGate = formatChromeLoadedEvidenceValue(
    draft.reviewGate,
    "reviewRequired",
  );
  const evidenceResult = formatChromeLoadedEvidenceValue(
    draft.evidenceResult,
    "Evidence packet copied or manual fallback selected",
  );

  return JSON.stringify(
    {
      arguments: {
        confirmSave: false,
        notes: [
          `Runtime: ${formatChromeLoadedEvidenceValue(
            draft.runtime,
            "extension runtime connected · local Studio URL only",
          )}`,
          `Source: ${source}`,
          `Review gate: ${reviewGate}`,
          `Session: ${formatChromeLoadedEvidenceValue(
            draft.session,
            "Saved session timestamp",
          )}`,
          `Evidence: ${evidenceResult}`,
          "Set confirmSave to true only after the external AI result is reviewed.",
        ].join("\n"),
        rating: "positive",
        resultSummary: `Chrome loaded extension smoke passed for ${source} with ${reviewGate}.`,
        targetAI,
      },
      tool: "save_execution_feedback",
    },
    null,
    2,
  );
}

function buildChromeFeedbackInboxCheck(draft: ChromeLoadedEvidenceDraft) {
  const targetAI = formatChromeLoadedEvidenceValue(
    draft.targetAI,
    "codex",
  ).toLowerCase();
  const encodedTargetAI = encodeURIComponent(targetAI);

  return [
    "# Prompt AI Studio Chrome Feedback Inbox Check",
    "",
    "Gate: run this after save_execution_feedback confirmSave true.",
    `Target AI: ${targetAI}`,
    `UI: /integrations?mcpRating=positive&mcpTargetAI=${encodedTargetAI}#integrations-feedback-inbox`,
    `API: /api/integrations/mcp-feedback?limit=5&rating=positive&targetAI=${encodedTargetAI}`,
    `Curl: curl -sS "http://localhost:3000/api/integrations/mcp-feedback?limit=5&rating=positive&targetAI=${encodedTargetAI}"`,
  ].join("\n");
}

function ConnectionReadinessSummary() {
  return (
    <div
      className="grid grid-cols-2 gap-2 border-b border-line px-5 py-4 xl:grid-cols-4"
      data-testid="connection-readiness-summary"
    >
      {readinessSummaryItems.map((item) => (
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

function ChromeLoadedSmokeCard({
  check,
}: {
  check: ChromeLoadedSmokeCheck;
}) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-surface p-4">
      <p className="break-words text-sm font-semibold text-foreground">
        {check.step}
      </p>
      <p className="mt-2 break-words text-xs leading-5 text-accent">
        {check.gate}
      </p>
      <dl className="mt-4 grid gap-3 text-xs leading-5">
        <div>
          <dt className="font-semibold text-soft">Evidence</dt>
          <dd className="mt-1 break-words text-muted">{check.evidence}</dd>
        </div>
        <div>
          <dt className="font-semibold text-soft">Operator check</dt>
          <dd className="mt-1 break-words text-muted">
            {check.operatorCheck}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ChromeLoadedSmokeChecklist({
  onCopyEvidence,
  onCopy,
}: {
  onCopyEvidence: () => void;
  onCopy: () => void;
}) {
  return (
    <section
      className="border-b border-line px-5 py-4"
      data-testid="chrome-loaded-smoke-checklist"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Chrome loaded smoke
          </p>
          <p className="mt-2 text-sm leading-6 text-soft">
            실제 Chrome extension 로드 상태에서는 runtime, capture, result,
            session restore, evidence fallback 증거를 같은 순서로 확인합니다.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className={secondaryButtonClass} onClick={onCopy} type="button">
            Chrome smoke 체크리스트 복사
          </button>
          <button
            className={secondaryButtonClass}
            onClick={onCopyEvidence}
            type="button"
          >
            Chrome 증빙 패킷 복사
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-5">
        {chromeLoadedSmokeChecks.map((check) => (
          <ChromeLoadedSmokeCard check={check} key={check.step} />
        ))}
      </div>
      <dl
        className="mt-4 grid gap-2 rounded-md border border-line bg-surface p-4 sm:grid-cols-2"
        data-testid="chrome-loaded-evidence-packet"
      >
        {chromeLoadedEvidenceRows.map((row) => (
          <div className="min-w-0" key={row.label}>
            <dt className="text-xs font-semibold text-soft">{row.label}</dt>
            <dd className="mt-1 break-words text-xs leading-5 text-muted">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ChromeLoadedOperatorEvidence({
  draft,
  onChange,
  onCopy,
  onCopyFeedback,
  onCopyFeedbackCheck,
}: {
  draft: ChromeLoadedEvidenceDraft;
  onChange: (key: keyof ChromeLoadedEvidenceDraft, value: string) => void;
  onCopy: () => void;
  onCopyFeedback: () => void;
  onCopyFeedbackCheck: () => void;
}) {
  return (
    <section
      className="border-b border-line px-5 py-4"
      data-testid="chrome-loaded-operator-evidence"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            실제 Chrome 증빙
          </p>
          <p className="mt-2 text-sm leading-6 text-soft">
            Load unpacked 후 popup에서 확인한 값을 그대로 적고, 실제 smoke
            evidence로 복사합니다.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className={secondaryButtonClass} onClick={onCopy} type="button">
            실제 Chrome 증빙 복사
          </button>
          <button
            className={secondaryButtonClass}
            onClick={onCopyFeedback}
            type="button"
          >
            Chrome feedback payload 복사
          </button>
          <button
            className={secondaryButtonClass}
            onClick={onCopyFeedbackCheck}
            type="button"
          >
            Feedback inbox 확인 복사
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {chromeLoadedOperatorEvidenceFields.map((field) => (
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
    </section>
  );
}

function ConnectionReadinessCardDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-soft">{label}</dt>
      <dd className="mt-1 break-words text-xs leading-5 text-muted">
        {value}
      </dd>
    </div>
  );
}

function ConnectionReadinessCard({
  check,
}: {
  check: ConnectionReadinessCheck;
}) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-surface p-4">
      <p className="break-words text-sm font-semibold text-foreground">
        {check.surface}
      </p>
      <p className="mt-2 break-words text-xs leading-5 text-accent">
        {check.statusGate}
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <ConnectionReadinessCardDetail
          label="Install"
          value={check.installStep}
        />
        <ConnectionReadinessCardDetail
          label="Operator action"
          value={check.operatorAction}
        />
      </dl>
    </div>
  );
}

function ConnectionReadinessCards() {
  return (
    <div
      className="grid gap-3 px-5 py-4 lg:grid-cols-2"
      data-testid="connection-readiness-cards"
    >
      {readinessChecks.map((check) => (
        <ConnectionReadinessCard check={check} key={check.surface} />
      ))}
    </div>
  );
}

function ConnectionReadinessRow({
  check,
}: {
  check: ConnectionReadinessCheck;
}) {
  return (
    <tr>
      <td className="px-5 py-4 align-top font-semibold text-foreground">
        {check.surface}
      </td>
      <td className="px-5 py-4 align-top text-soft">
        {check.statusGate}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-muted">
        {check.installStep}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-soft">
        {check.smokeTest}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-muted">
        {check.operatorAction}
      </td>
    </tr>
  );
}

function ConnectionReadinessTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
          <tr>
            <th className="px-5 py-3 font-semibold">Surface</th>
            <th className="px-5 py-3 font-semibold">Status gate</th>
            <th className="px-5 py-3 font-semibold">Install step</th>
            <th className="px-5 py-3 font-semibold">Smoke test</th>
            <th className="px-5 py-3 font-semibold">Operator action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {readinessChecks.map((check) => (
            <ConnectionReadinessRow key={check.surface} check={check} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConnectionReadinessManualCopyTextarea({
  value,
}: {
  value: string;
}) {
  return (
    <textarea
      aria-label="Connection readiness manual copy"
      className={`${textareaClass} min-h-40 font-mono text-xs`}
      readOnly
      value={value}
    />
  );
}

function ConnectionReadinessCopyNotice({
  copyState,
  manualCopyText,
}: {
  copyState: CopyState;
  manualCopyText: string;
}) {
  if (copyState === "idle") {
    return null;
  }

  const message =
    copyState === "error"
      ? "복사에 실패했습니다. 아래 내용을 직접 선택해 복사하세요."
      : copyState === "checklist"
        ? "연결 준비도 체크리스트를 복사했습니다."
        : copyState === "chrome-smoke"
          ? "Chrome loaded smoke 체크리스트를 복사했습니다."
          : copyState === "chrome-evidence"
            ? "Chrome loaded extension 증빙 패킷을 복사했습니다."
            : copyState === "chrome-operator-evidence"
              ? "실제 Chrome loaded extension 증빙을 복사했습니다."
              : copyState === "chrome-feedback-payload"
                ? "Chrome save_execution_feedback payload를 복사했습니다."
                : copyState === "chrome-feedback-check"
                  ? "Chrome feedback inbox 확인 명령을 복사했습니다."
                  : "Smoke test 명령을 복사했습니다.";

  return (
    <div className="space-y-3 border-t border-line px-5 py-3">
      <p
        className={`text-sm ${
          copyState === "error" ? "text-danger" : "text-accent"
        }`}
      >
        {message}
      </p>
      {manualCopyText ? (
        <ConnectionReadinessManualCopyTextarea value={manualCopyText} />
      ) : null}
    </div>
  );
}

export function ConnectionReadinessPanel() {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [chromeLoadedEvidenceDraft, setChromeLoadedEvidenceDraft] =
    useState<ChromeLoadedEvidenceDraft>({
      evidenceResult: "",
      reviewGate: "",
      runtime: "",
      session: "",
      source: "",
      targetAI: "",
    });
  const [manualCopyText, setManualCopyText] = useState("");

  async function copyValue(value: string, nextState: CopyState) {
    const copied = await copyTextToClipboard(value);
    setCopyState(copied ? nextState : "error");
    setManualCopyText(copied ? "" : value);
  }

  function updateChromeLoadedEvidenceDraft(
    key: keyof ChromeLoadedEvidenceDraft,
    value: string,
  ) {
    setChromeLoadedEvidenceDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <Panel>
      <PanelHeader
        title="연결 준비도 점검"
        description="Chrome, MCP, 외부 Gen AI, Codex 연결을 실제 사용 전에 로컬 설치, smoke test, 운영자 승인 기준으로 확인합니다."
      />
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-muted">
          API 키 없이도 local server, extension, MCP bridge, copy-ready
          handoff가 준비됐는지 먼저 확인합니다.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className={secondaryButtonClass}
            onClick={() =>
              copyValue(buildConnectionReadinessChecklist(), "checklist")
            }
            type="button"
          >
            준비도 체크리스트 복사
          </button>
          <button
            className={secondaryButtonClass}
            onClick={() => copyValue(buildSmokeTestCommandBlock(), "smoke")}
            type="button"
          >
            Smoke test 명령 복사
          </button>
        </div>
      </div>

      <ConnectionReadinessSummary />

      <ChromeLoadedSmokeChecklist
        onCopyEvidence={() =>
          copyValue(
            buildChromeLoadedExtensionEvidencePacket(),
            "chrome-evidence",
          )
        }
        onCopy={() =>
          copyValue(
            buildChromeLoadedExtensionSmokeChecklist(),
            "chrome-smoke",
          )
        }
      />

      <ChromeLoadedOperatorEvidence
        draft={chromeLoadedEvidenceDraft}
        onChange={updateChromeLoadedEvidenceDraft}
        onCopy={() =>
          copyValue(
            buildChromeLoadedOperatorEvidencePacket(chromeLoadedEvidenceDraft),
            "chrome-operator-evidence",
          )
        }
        onCopyFeedback={() =>
          copyValue(
            buildChromeLoadedFeedbackPayload(chromeLoadedEvidenceDraft),
            "chrome-feedback-payload",
          )
        }
        onCopyFeedbackCheck={() =>
          copyValue(
            buildChromeFeedbackInboxCheck(chromeLoadedEvidenceDraft),
            "chrome-feedback-check",
          )
        }
      />

      <ConnectionReadinessCards />

      <ConnectionReadinessTable />

      <div className="grid gap-4 border-t border-line px-5 py-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Smoke commands
          </p>
          <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words rounded-md border border-line bg-surface p-4 text-xs leading-5 text-soft">
            {buildSmokeTestCommandBlock()}
          </pre>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Release rule
          </p>
          <p className="mt-3 text-sm leading-6 text-soft">
            연결은 자동 정제까지만 담당하고, GPT, Claude, Codex, Gemini로의
            최종 전달은 review-required handoff package를 사람이 확인한 뒤
            실행합니다. 이 기준이 유지되어야 회사별/개인별 프롬프트 학습
            품질과 운영 리스크를 같이 관리할 수 있습니다.
          </p>
        </div>
      </div>

      <ConnectionReadinessCopyNotice
        copyState={copyState}
        manualCopyText={manualCopyText}
      />
    </Panel>
  );
}
