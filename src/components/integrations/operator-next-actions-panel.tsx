"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Panel,
  PanelHeader,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import { writeStudioDraft } from "@/lib/studio/draft";

const operatorNextActions = [
  {
    action: "Keep the Studio dev server running before testing any external surface.",
    completionGate:
      "브라우저에서 /integrations가 열리고 refine API tester가 응답합니다.",
    evidence: "npm run dev and POST /api/integrations/refine respond locally.",
    href: "#integrations-readiness",
    label: "1. 로컬 서버 유지",
    operatorTask: "터미널에서 npm run dev를 유지하고 localhost:3000 접속을 확인합니다.",
  },
  {
    action: "Install one connection surface first, then run the matching smoke test.",
    completionGate:
      "Chrome handoff 또는 MCP refine_prompt 결과에 reviewRequired가 포함됩니다.",
    evidence: "Chrome extension handoff or MCP refine_prompt returns reviewRequired.",
    href: "#integrations-environment-guide",
    label: "2. 연결 표면 1개 검증",
    operatorTask:
      "Chrome extension 또는 MCP client 중 하나를 먼저 연결하고 smoke test를 실행합니다.",
  },
  {
    action: "Save the local smoke evidence before any external AI delivery.",
    completionGate:
      "Chrome, MCP, Learning feedback smoke evidence 파일이 모두 생성됩니다.",
    evidence:
      "npm run smoke:chrome-extension -- --out output/smoke/chrome-extension-smoke.md; npm run smoke:mcp -- --out output/smoke/mcp-bridge-smoke.md; npm run smoke:learning-feedback -- --out output/smoke/learning-feedback-smoke.md",
    href: "#integrations-smoke-evidence-path",
    label: "3. 로컬 smoke evidence 저장",
    operatorTask:
      "외부 AI에 붙여넣기 전에 Chrome, MCP, Learning feedback smoke evidence 명령을 실행합니다.",
  },
  {
    action: "Paste only the reviewed handoff package into GPT, Claude, Codex, or Gemini.",
    completionGate:
      "대상 AI, 언어 전략, 가정, 누락 맥락을 확인한 handoff package만 전달합니다.",
    evidence: "Assumptions, missing context, target AI, and language strategy are checked.",
    href: "#integrations-operation-flow",
    label: "4. 외부 AI 전달 전 검토",
    operatorTask:
      "정제 결과를 그대로 자동 전송하지 않고, 복사 전에 최종 prompt package를 검토합니다.",
  },
  {
    action: "Save execution feedback only after confirming the external AI result.",
    completionGate:
      "confirmSave true로 저장된 피드백이 Feedback inbox에서 조회됩니다.",
    evidence: "save_execution_feedback uses confirmSave true and appears in Feedback inbox.",
    href: "#integrations-feedback-inbox",
    label: "5. 실행 결과 피드백 저장",
    operatorTask:
      "외부 AI 실행 결과를 요약하고, 저장 동의가 있을 때만 feedback inbox에 남깁니다.",
  },
  {
    action:
      "Generate release evidence and run the release-candidate gate before grouped commit or handoff.",
    completionGate:
      "verify:evidence pass 기록과 verify:release-candidate 통과가 확인됩니다.",
    evidence:
      "npm run verify:evidence -- --out-dir docs/evidence; npm run verify:release-candidate",
    href: "#integrations-next-actions",
    label: "6. 검증·커밋 정리",
    operatorTask:
      "관련 변경을 묶기 전 release evidence를 새로 만들고 release-candidate를 실행합니다.",
  },
] satisfies Array<{
  action: string;
  completionGate: string;
  evidence: string;
  href: string;
  label: string;
  operatorTask: string;
}>;

type OperatorNextAction = (typeof operatorNextActions)[number];

const operatorActionSummaryItems = [
  {
    label: "현재 순서",
    value:
      "서버 유지 → 연결 1개 검증 → smoke evidence 저장 → 외부 AI 전달 → 피드백 저장 → release gate",
  },
  {
    label: "첫 검증",
    value: "Chrome extension 또는 MCP client 중 하나만 먼저 연결",
  },
  {
    label: "전달 원칙",
    value: "smoke evidence 저장 후 reviewRequired package만 전달",
  },
  {
    label: "학습 루프",
    value: "confirmSave true 저장 후 release evidence로 변경 이력을 남김",
  },
] satisfies Array<{
  label: string;
  value: string;
}>;

type CopyState = "idle" | "operator-actions" | "error" | string;

function buildOperatorNextActionChecklist(item: OperatorNextAction) {
  return [
    `# Prompt AI Studio Operator Next Action: ${item.label}`,
    "",
    "Gate: local-first automation, smoke evidence saved, review-required external delivery, confirmed feedback save.",
    "",
    `- Action: ${item.action}`,
    `- 내가 할 일: ${item.operatorTask}`,
    `- 완료 기준: ${item.completionGate}`,
    `- Evidence: ${item.evidence}`,
    `- Detail link: /integrations${item.href}`,
    "",
    "Final review:",
    "- Save local smoke evidence before external AI delivery.",
    "- Confirm this single operator action before moving to the next connection step.",
    "- Do not send unreviewed content to an external AI account.",
    "- Run release evidence and release-candidate checks before a grouped commit or handoff.",
  ].join("\n");
}

function buildOperatorNextActionsChecklist() {
  return [
    "# Prompt AI Studio Operator Next Actions",
    "",
    "Gate: local-first automation, smoke evidence saved, review-required external delivery, confirmed feedback save.",
    "Scope: /integrations operator action package.",
    "",
    ...operatorNextActions.flatMap((item) => [
      `## ${item.label}`,
      "",
      `- Action: ${item.action}`,
      `- 내가 할 일: ${item.operatorTask}`,
      `- 완료 기준: ${item.completionGate}`,
      `- Evidence: ${item.evidence}`,
      `- Detail link: /integrations${item.href}`,
      "",
    ]),
    "Final review:",
    "- Save local smoke evidence before external AI delivery.",
    "- Do not paste into GPT, Claude, Codex, or Gemini before reviewing the handoff package.",
    "- Save feedback only when confirmSave is true.",
    "- Run release evidence and release-candidate checks before a grouped commit or handoff.",
  ].join("\n");
}

function OperatorActionToolbar({
  onCopyAll,
  onOpenAllInStudio,
}: {
  onCopyAll: () => void;
  onOpenAllInStudio: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-3 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between"
      data-testid="operator-next-actions-toolbar"
    >
      <p className="text-sm leading-6 text-muted">
        단계별 내가 할 일, 완료 기준, evidence를 Markdown 운영 패키지로
        복사하거나 Studio 개선 초안으로 보냅니다.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          aria-label="전체 다음 조치 복사"
          className={secondaryButtonClass}
          onClick={onCopyAll}
          type="button"
        >
          다음 조치 복사
        </button>
        <button
          aria-label="전체 다음 조치 Studio로"
          className={secondaryButtonClass}
          onClick={onOpenAllInStudio}
          type="button"
        >
          다음 조치 Studio로
        </button>
      </div>
    </div>
  );
}

function OperatorActionSummary() {
  return (
    <div
      className="grid grid-cols-2 gap-2 border-b border-line px-5 py-4 xl:grid-cols-4"
      data-testid="operator-next-actions-summary"
    >
      {operatorActionSummaryItems.map((item) => (
        <div className="min-w-0" key={item.label}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
            {item.label}
          </p>
          <p className="mt-1 break-words text-xs font-semibold leading-5 text-soft">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function OperatorActionDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="font-semibold text-soft">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}

function OperatorActionList({
  onCopyAction,
  onOpenActionInStudio,
}: {
  onCopyAction: (item: OperatorNextAction) => void;
  onOpenActionInStudio: (item: OperatorNextAction) => void;
}) {
  return (
    <div className="divide-y divide-line" data-testid="operator-next-actions-list">
      {operatorNextActions.map((item) => (
        <div
          className="grid gap-3 px-5 py-4 md:grid-cols-[180px_minmax(0,1fr)_180px]"
          key={item.label}
        >
          <p className="text-sm font-semibold text-foreground">
            {item.label}
          </p>
          <div className="min-w-0">
            <p className="break-words text-sm leading-6 text-soft">
              {item.action}
            </p>
            <dl className="mt-3 grid gap-2 text-xs leading-5 text-muted sm:grid-cols-3">
              <OperatorActionDetail
                label="내가 할 일"
                value={item.operatorTask}
              />
              <OperatorActionDetail
                label="완료 기준"
                value={item.completionGate}
              />
              <OperatorActionDetail label="Evidence" value={item.evidence} />
            </dl>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              className="self-start text-sm font-semibold text-accent transition hover:text-soft md:self-end md:text-right"
              href={item.href}
            >
              상세 확인
            </Link>
            <button
              aria-label={`${item.label} 조치 복사`}
              className={secondaryButtonClass}
              onClick={() => onCopyAction(item)}
              type="button"
            >
              조치 복사
            </button>
            <button
              aria-label={`${item.label} Studio로`}
              className={secondaryButtonClass}
              onClick={() => onOpenActionInStudio(item)}
              type="button"
            >
              Studio로
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function OperatorManualCopyTextarea({ value }: { value: string }) {
  return (
    <textarea
      aria-label="Operator next actions manual copy"
      className={`${textareaClass} min-h-40 font-mono text-xs`}
      readOnly
      value={value}
    />
  );
}

function OperatorManualCopyNotice({
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
      ? "복사에 실패했습니다. 아래 다음 조치 패키지를 직접 선택해 복사하세요."
      : copyState === "draftError"
        ? "Studio 초안을 저장하지 못했습니다. 아래 다음 조치 패키지를 직접 선택해 복사하세요."
        : copyState === "operator-actions"
          ? "운영자 다음 조치 패키지를 복사했습니다."
          : `${copyState} 조치 패키지를 복사했습니다.`;

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
        <OperatorManualCopyTextarea value={manualCopyText} />
      ) : null}
    </div>
  );
}

export function OperatorNextActionsPanel() {
  const router = useRouter();
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [manualCopyText, setManualCopyText] = useState("");

  async function copyOperatorActions() {
    const checklist = buildOperatorNextActionsChecklist();
    const copied = await copyTextToClipboard(checklist);

    setCopyState(copied ? "operator-actions" : "error");
    setManualCopyText(copied ? "" : checklist);
  }

  function openOperatorActionsInStudio() {
    const rawInput = buildOperatorNextActionsChecklist();
    const wroteDraft = writeStudioDraft({
      source: "integrations-operations-checklist",
      rawInput,
      goal: "외부 AI 연결 운영자 다음 조치 실행 계획",
      domain: "External AI integrations · operator next actions",
      targetModels: ["gpt", "claude", "codex", "gemini"],
      outputLanguage: "korean",
      sourceTitle: "Integrations 운영자 다음 조치",
      sourceHref: "/integrations#integrations-next-actions",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setCopyState("draftError");
      setManualCopyText(rawInput);
      return;
    }

    router.push("/studio?draft=integrations-operations-checklist");
  }

  async function copyOperatorAction(item: OperatorNextAction) {
    const checklist = buildOperatorNextActionChecklist(item);
    const copied = await copyTextToClipboard(checklist);

    setCopyState(copied ? item.label : "error");
    setManualCopyText(copied ? "" : checklist);
  }

  function openOperatorActionInStudio(item: OperatorNextAction) {
    const rawInput = buildOperatorNextActionChecklist(item);
    const wroteDraft = writeStudioDraft({
      source: "integrations-operations-checklist",
      rawInput,
      goal: `${item.label} 실행 계획`,
      domain: "External AI integrations · single operator action",
      targetModels: ["gpt", "claude", "codex", "gemini"],
      outputLanguage: "korean",
      sourceTitle: `Integrations ${item.label}`,
      sourceHref: "/integrations#integrations-next-actions",
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
        title="운영자 다음 조치"
        description="지금 유저가 직접 확인해야 하는 설치, 연결, smoke evidence, 전달, 피드백 저장, release gate 순서를 먼저 고정합니다."
      />
      <OperatorActionSummary />
      <OperatorActionToolbar
        onCopyAll={copyOperatorActions}
        onOpenAllInStudio={openOperatorActionsInStudio}
      />
      <OperatorActionList
        onCopyAction={copyOperatorAction}
        onOpenActionInStudio={openOperatorActionInStudio}
      />
      <OperatorManualCopyNotice
        copyState={copyState}
        manualCopyText={manualCopyText}
      />
    </Panel>
  );
}
