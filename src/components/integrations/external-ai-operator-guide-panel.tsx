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
import { writeStudioDraft } from "@/lib/studio/draft";

type ExternalAiOperatorStep = {
  action: string;
  commands: string[];
  detail: string;
};

type TargetAiDeliveryRule = {
  guard: string;
  mode: string;
  target: string;
};

type ExternalAiEvidenceCheck = {
  action: string;
  evidence: string;
  label: string;
};

type McpDefaultExample = {
  env: string;
  surface: string;
};

const externalAiOperatorSteps = [
  {
    action: "로컬 앱 실행",
    commands: ["npm run dev"],
    detail: "http://localhost:3000/integrations에서 연결 화면을 엽니다.",
  },
  {
    action: "연결 표면 1개 선택",
    commands: ["Chrome extension 또는 MCP client"],
    detail: "처음에는 Chrome이나 Codex MCP 중 하나만 연결해 smoke test를 줄입니다.",
  },
  {
    action: "review-required 결과 확인",
    commands: ["refine_prompt 또는 Refine selected text"],
    detail: "handoff package를 읽고 target AI, 가정, 누락 맥락을 확인합니다.",
  },
  {
    action: "로컬 smoke evidence 저장",
    commands: [
      "npm run smoke:chrome-extension -- --out docs/evidence/chrome-extension-smoke.md",
      "npm run smoke:mcp -- --out docs/evidence/mcp-bridge-smoke.md",
      "npm run smoke:learning-feedback -- --out docs/evidence/learning-feedback-smoke.md",
    ],
    detail:
      "외부 AI로 넘기기 전에 Chrome, MCP, Learning feedback 증거 파일을 남깁니다.",
  },
  {
    action: "외부 AI에 수동 전달",
    commands: ["Copy 후 GPT/Claude/Codex/Gemini에 붙여넣기"],
    detail: "자동 전송은 하지 않고 사람이 확인한 package만 전달합니다.",
  },
  {
    action: "실행 결과 저장 판단",
    commands: ["save_execution_feedback confirmSave: true"],
    detail: "의미 있는 결과만 rating, summary, notes와 함께 feedback inbox에 저장합니다.",
  },
] satisfies ExternalAiOperatorStep[];

const externalAiEvidenceChecks = [
  {
    action: "localhost:3000과 POST /api/integrations/refine 응답을 확인합니다.",
    evidence: "local app, refine API response",
    label: "01 로컬 연결",
  },
  {
    action: "reviewRequired true와 target handoff package를 확인합니다.",
    evidence: "reviewRequired, target handoff package",
    label: "02 정제 결과",
  },
  {
    action: "Chrome, MCP, Learning smoke evidence file을 먼저 남깁니다.",
    evidence: "chrome smoke, mcp smoke, learning feedback smoke",
    label: "03 증거 저장",
  },
  {
    action: "copy-ready prompt와 missing context review를 확인한 뒤 붙여넣습니다.",
    evidence: "copy-ready prompt, missing context review",
    label: "04 전달 승인",
  },
  {
    action: "rating, result summary, inbox record를 confirmSave true 후 확인합니다.",
    evidence: "rating, result summary, inbox record",
    label: "05 피드백 증거",
  },
] satisfies ExternalAiEvidenceCheck[];

const targetAiDeliveryRules = [
  {
    guard: "목표, 제약, 원하는 출력 형식을 확인합니다.",
    mode: "general prompt package",
    target: "GPT",
  },
  {
    guard: "긴 맥락과 판단 기준을 함께 전달합니다.",
    mode: "context-heavy prompt package",
    target: "Claude",
  },
  {
    guard: "파일 범위, 검증 명령, 완료 기준을 포함합니다.",
    mode: "implementation brief",
    target: "Codex",
  },
  {
    guard: "자료 비교, 멀티모달 힌트, 출처 맥락을 분리합니다.",
    mode: "research and source package",
    target: "Gemini",
  },
] satisfies TargetAiDeliveryRule[];

const mcpDefaultExamples = [
  {
    env: "PROMPT_AI_STUDIO_TARGET_AI=codex",
    surface: "Codex",
  },
  {
    env: "PROMPT_AI_STUDIO_DOMAIN=개발",
    surface: "Domain",
  },
  {
    env: "PROMPT_AI_STUDIO_GOAL=전문 프롬프트로 변환",
    surface: "Goal",
  },
  {
    env: "PROMPT_AI_STUDIO_SOURCE_URL=mcp://codex",
    surface: "Source",
  },
] satisfies McpDefaultExample[];

const externalAiOperatorSummaryItems = [
  {
    label: "운영 단계",
    value: `${externalAiOperatorSteps.length}단계`,
  },
  {
    label: "첫 실행",
    value: externalAiOperatorSteps[0].action,
  },
  {
    label: "전달 gate",
    value: "review-required",
  },
  {
    label: "피드백 저장",
    value: "confirmSave",
  },
] satisfies Array<{
  label: string;
  value: string;
}>;

function buildExternalAiOperatorGuidePackage() {
  return [
    "# Prompt AI Studio External AI Operator Guide",
    "",
    "Gate: local-first automation, smoke evidence saved, review-required external delivery, confirmed feedback save.",
    "Scope: Chrome, Codex, Claude, GPT-compatible MCP client, Gemini handoff.",
    "",
    "## Target AI delivery rules",
    "",
    ...targetAiDeliveryRules.flatMap((rule) => [
      `### ${rule.target}`,
      "",
      `- Mode: ${rule.mode}`,
      `- Guard: ${rule.guard}`,
      "",
    ]),
    "## Execution evidence checklist",
    "",
    ...externalAiEvidenceChecks.flatMap((check) => [
      `### ${check.label}`,
      "",
      `- Action: ${check.action}`,
      `- Evidence: ${check.evidence}`,
      "",
    ]),
    "Audit source order: chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff.",
    "Keep local-smoke-evidence before target-ai-handoff.",
    "",
    "## 내가 할 일",
    "",
    ...externalAiOperatorSteps.flatMap((step, index) => [
      `### ${index + 1}. ${step.action}`,
      "",
      ...step.commands.map((command) => `- Command: ${command}`),
      `- Detail: ${step.detail}`,
      "",
    ]),
    "## MCP defaults",
    "",
    ...mcpDefaultExamples.map((item) => `- ${item.surface}: ${item.env}`),
    "",
    "## Final review",
    "",
    "- Confirm reviewRequired before copying into GPT, Claude, Codex, or Gemini.",
    "- Do not auto-send unreviewed content to an external AI account.",
    "- Save feedback only after reviewing the actual external AI result.",
  ].join("\n");
}

type CopyState = "idle" | "copied" | "draftError" | "error";

function ExternalAiOperatorSummary() {
  return (
    <div
      className="grid grid-cols-2 gap-2 border-b border-line px-5 py-4 xl:grid-cols-4"
      data-testid="external-ai-operator-summary"
    >
      {externalAiOperatorSummaryItems.map((item) => (
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

function TargetAiDeliveryRuleCard({ rule }: { rule: TargetAiDeliveryRule }) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-surface p-4">
      <p className="text-sm font-semibold text-foreground">{rule.target}</p>
      <p className="mt-2 break-words font-mono text-xs text-accent">
        {rule.mode}
      </p>
      <p className="mt-3 break-words text-sm leading-6 text-muted">
        {rule.guard}
      </p>
    </div>
  );
}

function TargetAiDeliveryRules() {
  return (
    <div
      className="grid gap-3 border-b border-line px-5 py-4 sm:grid-cols-2 xl:grid-cols-4"
      data-testid="external-ai-delivery-rules"
    >
      {targetAiDeliveryRules.map((rule) => (
        <TargetAiDeliveryRuleCard key={rule.target} rule={rule} />
      ))}
    </div>
  );
}

function ExternalAiEvidenceChecklist() {
  return (
    <div className="border-b border-line px-5 py-4">
      <div className="mb-3">
        <p className="text-sm font-semibold text-foreground">
          실행 증거 체크
        </p>
        <p className="mt-1 text-sm leading-6 text-muted">
          외부 AI로 넘기기 전 local-smoke-evidence가 target-ai-handoff보다
          먼저 남았는지 확인합니다.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {externalAiEvidenceChecks.map((check) => (
          <div
            className="min-w-0 rounded-md border border-line bg-surface p-4"
            key={check.label}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              {check.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-soft">
              {check.action}
            </p>
            <p className="mt-3 break-words font-mono text-xs text-muted">
              {check.evidence}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExternalAiOperatorStepItem({
  index,
  step,
}: {
  index: number;
  step: ExternalAiOperatorStep;
}) {
  return (
    <li className="grid gap-3 p-4 sm:grid-cols-[44px_minmax(0,1fr)]">
      <span className="flex size-8 items-center justify-center rounded-md bg-panel-strong font-mono text-xs text-soft">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">
          {step.action}
        </span>
        <span className="mt-1 grid gap-1">
          {step.commands.map((command) => (
            <span
              className="block break-words font-mono text-xs text-accent"
              key={command}
            >
              {command}
            </span>
          ))}
        </span>
        <span className="mt-2 block text-sm leading-6 text-muted">
          {step.detail}
        </span>
      </span>
    </li>
  );
}

function ExternalAiOperatorStepList() {
  return (
    <ol className="divide-y divide-line rounded-md border border-line bg-surface">
      {externalAiOperatorSteps.map((step, index) => (
        <ExternalAiOperatorStepItem
          index={index}
          key={step.action}
          step={step}
        />
      ))}
    </ol>
  );
}

function ExternalAiOperatorGate() {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
        Operator Gate
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">
        자동화는 정제까지, 외부 전달은 증거 저장 후 검토 복사.
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">
        Chrome, MCP, Codex에서 생성된 결과는 GPT, Claude, Codex, Gemini에
        붙여넣기 전에 smoke evidence, handoff package, reviewRequired를 먼저
        확인합니다.
      </p>
    </div>
  );
}

function McpDefaultExamples() {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-sm font-semibold text-foreground">MCP 기본값 예시</p>
      <dl className="mt-3 grid gap-3">
        {mcpDefaultExamples.map((item) => (
          <div
            className="grid gap-1 border-b border-line pb-3 last:border-b-0 last:pb-0"
            key={item.env}
          >
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {item.surface}
            </dt>
            <dd className="break-words font-mono text-xs text-soft">
              {item.env}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ExternalAiOperatorManualCopyTextarea({ value }: { value: string }) {
  return (
    <textarea
      aria-label="External AI operator guide manual copy"
      className={`${textareaClass} min-h-48 font-mono text-xs`}
      readOnly
      value={value}
    />
  );
}

function ExternalAiOperatorCopyNotice({
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
      ? "복사에 실패했습니다. 아래 운영 가이드를 직접 선택해 복사하세요."
      : copyState === "draftError"
        ? "Studio 초안을 저장하지 못했습니다. 아래 운영 가이드를 직접 선택해 복사하세요."
      : "외부 AI 운영 가이드를 복사했습니다.";

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
        <ExternalAiOperatorManualCopyTextarea value={manualCopyText} />
      ) : null}
    </div>
  );
}

export function ExternalAiOperatorGuidePanel() {
  const router = useRouter();
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [manualCopyText, setManualCopyText] = useState("");

  async function copyOperatorGuide() {
    const guide = buildExternalAiOperatorGuidePackage();
    const copied = await copyTextToClipboard(guide);

    setCopyState(copied ? "copied" : "error");
    setManualCopyText(copied ? "" : guide);
  }

  function openOperatorGuideInStudio() {
    const rawInput = buildExternalAiOperatorGuidePackage();
    const wroteDraft = writeStudioDraft({
      source: "integrations-operations-checklist",
      rawInput,
      goal: "외부 AI 운영 가이드 실행 계획",
      domain: "External AI integrations · operator guide",
      targetModels: ["gpt", "claude", "codex", "gemini"],
      outputLanguage: "korean",
      sourceTitle: "Integrations 외부 AI 운영 가이드",
      sourceHref: "/integrations#integrations-operator-guide",
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
      <div className="scroll-mt-24" id="integrations-operator-guide" />
      <PanelHeader
        title="외부 AI 운영 가이드"
        description="오늘 실행할 순서와 네가 확인해야 하는 gate를 한 화면에서 고정합니다."
      />
      <div className="flex flex-col gap-3 border-b border-line px-5 pb-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-muted">
          Chrome 또는 MCP 연결을 시작하기 전에 실행 순서, review-required
          gate, MCP 기본값을 운영 패키지로 복사하거나 Studio 초안으로 보냅니다.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            aria-label="외부 AI 운영 가이드 복사"
            className={secondaryButtonClass}
            onClick={copyOperatorGuide}
            type="button"
          >
            운영 가이드 복사
          </button>
          <button
            aria-label="외부 AI 운영 가이드 Studio로"
            className={secondaryButtonClass}
            onClick={openOperatorGuideInStudio}
            type="button"
          >
            운영 가이드 Studio로
          </button>
        </div>
      </div>

      <ExternalAiOperatorSummary />
      <TargetAiDeliveryRules />
      <ExternalAiEvidenceChecklist />

      <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <ExternalAiOperatorStepList />
        <div className="space-y-4">
          <ExternalAiOperatorGate />
          <McpDefaultExamples />
        </div>
      </div>
      <ExternalAiOperatorCopyNotice
        copyState={copyState}
        manualCopyText={manualCopyText}
      />
    </Panel>
  );
}
