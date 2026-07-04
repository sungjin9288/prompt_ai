"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Panel,
  PanelHeader,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import type { TargetModel } from "@/lib/prompt";
import { writeStudioDraft } from "@/lib/studio/draft";

const environmentPlaybooks = [
  {
    environment: "Chrome extension",
    connectionMode: "Local API capture → review-required handoff",
    trigger: "Select text or use the context menu on a webpage.",
    firstAction: "Select text, open the popup, copy the reviewed package.",
    action: "Call local refine API with page context and target AI hint.",
    output:
      "Review-required handoff package for ChatGPT, Claude, Codex, or Gemini.",
    operatorCheck:
      "Run npm run smoke:integrations, then confirm sensitive text, missing context, and reviewRequired before copy.",
    targetModels: ["gpt", "claude", "codex", "gemini"],
  },
  {
    environment: "ChatGPT / Claude / Gemini",
    connectionMode: "Copy-ready handoff, not direct account automation",
    trigger: "Paste a handoff package from Studio, Chrome, or MCP.",
    firstAction: "Paste after smoke evidence and handoff review.",
    action: "Run the copy-ready English or Korean-English hybrid prompt.",
    output:
      "External AI result that can be summarized back as execution feedback.",
    operatorCheck:
      "Check npm run smoke:integrations evidence, final prompt, answer language, assumptions, and reviewRequired before paste.",
    targetModels: ["gpt", "claude", "gemini"],
  },
  {
    environment: "Codex",
    connectionMode: "Scoped implementation brief with operator approval gates",
    trigger: "Send a development task package with files, checks, and guardrails.",
    firstAction: "Use the brief, then approve risky actions separately.",
    action: "Use the prompt as an implementation brief, not an auto-run command.",
    output: "Patch, verification evidence, and feedback summary.",
    operatorCheck:
      "Run npm run smoke:integrations, then review files, checks, destructive commands, migrations, and external writes.",
    targetModels: ["codex"],
  },
  {
    environment: "MCP client",
    connectionMode: "Direct local tool calls through the stdio MCP bridge",
    trigger: "Call get_context_profile, refine_prompt, or create_handoff_package.",
    firstAction: "Call get_context_profile before refining or packaging.",
    action: "Use Prompt AI Studio as a local prompt refinement tool.",
    output: "Structured content plus copy-ready review-required text.",
    operatorCheck:
      "Run npm run smoke:integrations before delivery, then save execution feedback only with confirmSave: true after review.",
    targetModels: ["gpt", "claude", "codex"],
  },
] satisfies Array<{
  action: string;
  connectionMode: string;
  environment: string;
  firstAction: string;
  operatorCheck: string;
  output: string;
  targetModels: TargetModel[];
  trigger: string;
}>;

const environmentSummaryItems = [
  { label: "연결 환경", value: `${environmentPlaybooks.length}개` },
  { label: "대상 AI", value: "GPT, Claude, Codex, Gemini" },
  { label: "운영 gate", value: "evidence + review-required" },
  { label: "피드백 경로", value: "confirmSave" },
];

const environmentEvidenceTrace = [
  "Audit source order: chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff.",
  "Keep local-smoke-evidence before target-ai-handoff.",
] satisfies string[];

type CopyState = "idle" | "error" | string;
type EnvironmentPlaybook = (typeof environmentPlaybooks)[number];

function formatTargetModels(targetModels: TargetModel[]) {
  return targetModels.join(", ");
}

function buildEnvironmentPlaybookChecklist(
  playbook: EnvironmentPlaybook,
) {
  return [
    `# Prompt AI Studio Environment Checklist: ${playbook.environment}`,
    "",
    `- Connection mode: ${playbook.connectionMode}`,
    `- Trigger: ${playbook.trigger}`,
    `- First action: ${playbook.firstAction}`,
    `- Studio action: ${playbook.action}`,
    `- Output: ${playbook.output}`,
    `- Operator check: ${playbook.operatorCheck}`,
    `- Target AI: ${formatTargetModels(playbook.targetModels)}`,
    "",
    "Gate: refine automatically, run npm run smoke:integrations, deliver with review.",
    ...environmentEvidenceTrace,
  ].join("\n");
}

function buildAllEnvironmentPlaybookChecklist() {
  return [
    "# Prompt AI Studio External AI Operations Checklist",
    "",
    "Gate: refine automatically, run npm run smoke:integrations, deliver with review.",
    "Scope: Chrome extension, ChatGPT / Claude / Gemini, Codex, MCP client.",
    ...environmentEvidenceTrace,
    "",
    ...environmentPlaybooks.flatMap((playbook, index) => [
      `## ${index + 1}. ${playbook.environment}`,
      "",
      `- Connection mode: ${playbook.connectionMode}`,
      `- Trigger: ${playbook.trigger}`,
      `- First action: ${playbook.firstAction}`,
      `- Studio action: ${playbook.action}`,
      `- Output: ${playbook.output}`,
      `- Operator check: ${playbook.operatorCheck}`,
      `- Target AI: ${formatTargetModels(playbook.targetModels)}`,
      "",
    ]),
    "Final review:",
    "- Run npm run smoke:integrations before delivery.",
    "- Confirm the final prompt language strategy before pasting.",
    "- Confirm sensitive data and missing context before delivery.",
    "- Save execution feedback only after the operator has reviewed the result.",
  ].join("\n");
}

function EnvironmentSummary() {
  return (
    <div
      className="grid grid-cols-2 gap-2 border-b border-line px-5 py-4 xl:grid-cols-4"
      data-testid="environment-playbook-summary"
    >
      {environmentSummaryItems.map((item) => (
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

function EnvironmentPlaybookCardDetail({
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

function EnvironmentPlaybookCard({
  onCopy,
  onOpenInStudio,
  playbook,
}: {
  onCopy: (playbook: EnvironmentPlaybook) => void;
  onOpenInStudio: (playbook: EnvironmentPlaybook) => void;
  playbook: EnvironmentPlaybook;
}) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-surface p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-foreground">
            {playbook.environment}
          </p>
          <p className="mt-2 break-words text-xs leading-5 text-accent">
            {playbook.connectionMode}
          </p>
        </div>
        <p className="font-mono text-xs text-soft">
          {formatTargetModels(playbook.targetModels)}
        </p>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <EnvironmentPlaybookCardDetail
          label="Trigger"
          value={playbook.trigger}
        />
        <EnvironmentPlaybookCardDetail
          label="First action"
          value={playbook.firstAction}
        />
        <EnvironmentPlaybookCardDetail
          label="Operator check"
          value={playbook.operatorCheck}
        />
      </dl>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          className={secondaryButtonClass}
          onClick={() => onCopy(playbook)}
          type="button"
        >
          체크리스트 복사
        </button>
        <button
          className={secondaryButtonClass}
          onClick={() => onOpenInStudio(playbook)}
          type="button"
        >
          Studio로
        </button>
      </div>
    </div>
  );
}

function EnvironmentPlaybookCards({
  onCopy,
  onOpenInStudio,
}: {
  onCopy: (playbook: EnvironmentPlaybook) => void;
  onOpenInStudio: (playbook: EnvironmentPlaybook) => void;
}) {
  return (
    <div
      className="grid gap-3 px-5 py-4 lg:grid-cols-2"
      data-testid="environment-playbook-cards"
    >
      {environmentPlaybooks.map((playbook) => (
        <EnvironmentPlaybookCard
          key={playbook.environment}
          onCopy={onCopy}
          onOpenInStudio={onOpenInStudio}
          playbook={playbook}
        />
      ))}
    </div>
  );
}

function EnvironmentPlaybookRow({
  onCopy,
  onOpenInStudio,
  playbook,
}: {
  onCopy: (playbook: EnvironmentPlaybook) => void;
  onOpenInStudio: (playbook: EnvironmentPlaybook) => void;
  playbook: EnvironmentPlaybook;
}) {
  return (
    <tr>
      <td className="px-5 py-4 align-top font-semibold text-foreground">
        {playbook.environment}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-soft">
        {playbook.connectionMode}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-muted">
        {playbook.trigger}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-soft">
        {playbook.firstAction}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-soft">
        {playbook.action}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-soft">
        {playbook.output}
      </td>
      <td className="px-5 py-4 align-top leading-6 text-muted">
        {playbook.operatorCheck}
      </td>
      <td className="px-5 py-4 align-top font-mono text-xs leading-5 text-soft">
        {formatTargetModels(playbook.targetModels)}
      </td>
      <td className="px-5 py-4 align-top">
        <div className="flex flex-col gap-2">
          <button
            className={secondaryButtonClass}
            onClick={() => onCopy(playbook)}
            type="button"
          >
            체크리스트 복사
          </button>
          <button
            className={secondaryButtonClass}
            onClick={() => onOpenInStudio(playbook)}
            type="button"
          >
            Studio로
          </button>
        </div>
      </td>
    </tr>
  );
}

function EnvironmentPlaybookTable({
  onCopy,
  onOpenInStudio,
}: {
  onCopy: (playbook: EnvironmentPlaybook) => void;
  onOpenInStudio: (playbook: EnvironmentPlaybook) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1160px] border-collapse text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
          <tr>
            <th className="px-5 py-3 font-semibold">Environment</th>
            <th className="px-5 py-3 font-semibold">Connection mode</th>
            <th className="px-5 py-3 font-semibold">Trigger</th>
            <th className="px-5 py-3 font-semibold">First action</th>
            <th className="px-5 py-3 font-semibold">Studio action</th>
            <th className="px-5 py-3 font-semibold">Output</th>
            <th className="px-5 py-3 font-semibold">Operator check</th>
            <th className="px-5 py-3 font-semibold">Target AI</th>
            <th className="px-5 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {environmentPlaybooks.map((playbook) => (
            <EnvironmentPlaybookRow
              key={playbook.environment}
              onCopy={onCopy}
              onOpenInStudio={onOpenInStudio}
              playbook={playbook}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnvironmentManualCopyTextarea({ value }: { value: string }) {
  return (
    <textarea
      aria-label="Environment checklist manual copy"
      className={`${textareaClass} min-h-40 font-mono text-xs`}
      readOnly
      value={value}
    />
  );
}

function EnvironmentCopyNotice({
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
      ? "복사 실패. 아래 체크리스트를 직접 선택해 복사하세요."
      : copyState === "draftError"
        ? "Studio 초안을 저장하지 못했습니다. 아래 체크리스트를 직접 선택해 복사하세요."
      : `${copyState} 체크리스트를 복사했습니다.`;

  return (
    <div className="space-y-3 border-t border-line px-5 py-3">
      <p
        className={`text-sm ${
          isError ? "text-danger" : "text-accent"
        }`}
      >
        {message}
      </p>
      {manualCopyText ? (
        <EnvironmentManualCopyTextarea value={manualCopyText} />
      ) : null}
    </div>
  );
}

export function EnvironmentPlaybookPanel() {
  const router = useRouter();
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [manualCopyText, setManualCopyText] = useState("");

  async function copyChecklist(checklist: string, successLabel: string) {
    const copied = await copyTextToClipboard(checklist);
    setCopyState(copied ? successLabel : "error");
    setManualCopyText(copied ? "" : checklist);
  }

  async function copyAllPlaybookChecklists() {
    await copyChecklist(
      buildAllEnvironmentPlaybookChecklist(),
      "전체 운영 패키지",
    );
  }

  function openAllPlaybookChecklistsInStudio() {
    const rawInput = buildAllEnvironmentPlaybookChecklist();
    const wroteDraft = writeStudioDraft({
      source: "integrations-operations-checklist",
      rawInput,
      goal: "외부 AI 연결 운영 개선 계획",
      domain: "External AI integrations operations",
      targetModels: ["gpt", "claude", "codex", "gemini"],
      outputLanguage: "korean",
      sourceTitle: "Integrations 전체 운영 체크리스트",
      sourceHref: "/integrations#integrations-environment-guide",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setCopyState("draftError");
      setManualCopyText(rawInput);
      return;
    }

    router.push("/studio?draft=integrations-operations-checklist");
  }

  function openPlaybookChecklistInStudio(
    playbook: EnvironmentPlaybook,
  ) {
    const rawInput = buildEnvironmentPlaybookChecklist(playbook);
    const wroteDraft = writeStudioDraft({
      source: "integrations-operations-checklist",
      rawInput,
      goal: `${playbook.environment} 연결 운영 개선 계획`,
      domain: `External AI integrations · ${playbook.environment}`,
      targetModels: playbook.targetModels,
      outputLanguage: "korean",
      sourceTitle: `Integrations ${playbook.environment} 체크리스트`,
      sourceHref: "/integrations#integrations-environment-guide",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setCopyState("draftError");
      setManualCopyText(rawInput);
      return;
    }

    router.push("/studio?draft=integrations-operations-checklist");
  }

  async function copyPlaybookChecklist(
    playbook: EnvironmentPlaybook,
  ) {
    await copyChecklist(
      buildEnvironmentPlaybookChecklist(playbook),
      playbook.environment,
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="환경별 실행 가이드"
        description="Chrome, 외부 Gen AI, Codex, MCP 클라이언트가 같은 정제 계약을 쓰되 실행 책임과 검토 지점을 분리합니다."
      />
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted">
          모든 환경의 connection mode, trigger, Studio action, output,
          operator check를 하나의 Markdown 운영 패키지로 복사합니다.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className={secondaryButtonClass}
            onClick={copyAllPlaybookChecklists}
            type="button"
          >
            전체 체크리스트 복사
          </button>
          <button
            className={secondaryButtonClass}
            onClick={openAllPlaybookChecklistsInStudio}
            type="button"
          >
            전체 체크리스트 Studio로
          </button>
        </div>
      </div>
      <EnvironmentSummary />
      <EnvironmentPlaybookCards
        onCopy={copyPlaybookChecklist}
        onOpenInStudio={openPlaybookChecklistInStudio}
      />
      <EnvironmentPlaybookTable
        onCopy={copyPlaybookChecklist}
        onOpenInStudio={openPlaybookChecklistInStudio}
      />
      <EnvironmentCopyNotice
        copyState={copyState}
        manualCopyText={manualCopyText}
      />
    </Panel>
  );
}
