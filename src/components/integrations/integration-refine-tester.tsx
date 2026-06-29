"use client";

import { useMemo, useState } from "react";

import {
  Panel,
  PanelHeader,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
  textareaClass,
} from "@/components/ui";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import type { TargetModel } from "@/lib/prompt/types";

type SourceApp = "chrome" | "mcp" | "chatgpt" | "claude" | "codex" | "gemini";

interface RefineResponse {
  audit: {
    reviewRequired: true;
    sourceApp: SourceApp;
    tool: "refine_prompt";
  };
  handoffPackages: Array<{
    handoffText: string;
    modelLabel: string;
    qualityScore: number;
    targetModel: TargetModel;
  }>;
  promptPackage: {
    domain: string;
    languageStrategy?: string;
    title: string;
  };
}

type HandoffPackage = RefineResponse["handoffPackages"][number];
type RefineStatus = "idle" | "loading" | "copied" | "error";

type SummaryItem = {
  label: string;
  value: string;
};

type RefineSelectOption<TValue extends string> = {
  label: string;
  value: TValue;
};

const sourceAppOptions: Array<{ label: string; value: SourceApp }> = [
  { label: "Chrome", value: "chrome" },
  { label: "MCP", value: "mcp" },
  { label: "ChatGPT", value: "chatgpt" },
  { label: "Claude", value: "claude" },
  { label: "Codex", value: "codex" },
  { label: "Gemini", value: "gemini" },
];

const targetAiOptions: Array<{ label: string; value: TargetModel | "auto" }> = [
  { label: "Auto", value: "auto" },
  { label: "GPT", value: "gpt" },
  { label: "Claude", value: "claude" },
  { label: "Codex", value: "codex" },
  { label: "Gemini", value: "gemini" },
];

const sampleInput =
  "이 페이지에서 선택한 내용을 바탕으로 Codex에게 전달할 개발 작업 프롬프트를 만들어줘. 기존 코드 구조를 먼저 확인하고, 변경 파일과 검증 명령까지 포함해줘.";

function RefineExecutionSummary({ items }: { items: SummaryItem[] }) {
  return (
    <div
      className="grid grid-cols-2 gap-2 rounded-md border border-line bg-surface p-3 xl:grid-cols-4"
      data-testid="integrations-refine-execution-summary"
    >
      {items.map((item) => (
        <div className="min-w-0" key={item.label}>
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

function RefineRequestMetrics({ items }: { items: SummaryItem[] }) {
  return (
    <div
      className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
      data-testid="integrations-refine-request-metrics"
    >
      {items.map((item) => (
        <div
          className="min-w-0 rounded-md border border-line bg-background p-3"
          key={item.label}
        >
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
            {item.label}
          </p>
          <p className="mt-2 break-words text-sm font-semibold text-foreground">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function HandoffReviewMetrics({ items }: { items: SummaryItem[] }) {
  return (
    <div
      className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
      data-testid="integrations-handoff-review-metrics"
    >
      {items.map((item) => (
        <div
          className="min-w-0 rounded-md border border-line bg-background p-3"
          key={item.label}
        >
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
            {item.label}
          </p>
          <p className="mt-2 break-words text-sm font-semibold text-foreground">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function HandoffReviewChecklist({ items }: { items: SummaryItem[] }) {
  return (
    <div
      className="mt-4 rounded-md border border-line bg-background p-3"
      data-testid="integrations-handoff-review-checklist"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Before copy
      </p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div className="min-w-0" key={item.label}>
            <dt className="text-xs font-semibold text-soft">{item.label}</dt>
            <dd className="mt-1 break-words text-xs leading-5 text-muted">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function RefineActionBar({
  canCopy,
  canRun,
  onCopy,
  onRun,
  status,
}: {
  canCopy: boolean;
  canRun: boolean;
  onCopy: () => void;
  onRun: () => void;
  status: RefineStatus;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        className={primaryButtonClass}
        disabled={status === "loading" || !canRun}
        onClick={onRun}
        type="button"
      >
        {status === "loading" ? "정제 중" : "Refine 실행"}
      </button>
      <button
        className={secondaryButtonClass}
        disabled={!canCopy}
        onClick={onCopy}
        type="button"
      >
        Handoff package 복사
      </button>
    </div>
  );
}

function RefineStatusNotice({
  error,
  status,
}: {
  error: string;
  status: RefineStatus;
}) {
  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  if (status !== "copied") {
    return null;
  }

  return <p className="text-sm text-accent">Handoff package를 복사했습니다.</p>;
}

function RefineSelectField<TValue extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: TValue) => void;
  options: Array<RefineSelectOption<TValue>>;
  value: TValue;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-soft">
        {label}
      </span>
      <select
        className={selectClass}
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RefineTextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-soft">
        {label}
      </span>
      <input
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function RefineRawInputField({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-soft">
        Raw input
      </span>
      <textarea
        className={`${textareaClass} min-h-40`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function RequestPayloadPreview({
  items,
  payloadPreview,
}: {
  items: SummaryItem[];
  payloadPreview: string;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Request payload
      </p>
      <RefineRequestMetrics items={items} />
      <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-soft">
        {payloadPreview}
      </pre>
    </div>
  );
}

function HandoffPackagePreview({
  checklistItems,
  items,
  result,
  selectedPackage,
}: {
  checklistItems: SummaryItem[];
  items: SummaryItem[];
  result: RefineResponse | null;
  selectedPackage: HandoffPackage | undefined;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Review gate
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {result?.audit.reviewRequired ? "Review required" : "Not generated"}
          </p>
        </div>
        {selectedPackage ? (
          <div className="text-left text-xs text-muted sm:text-right">
            <p>{selectedPackage.modelLabel}</p>
            <p>{selectedPackage.qualityScore.toFixed(1)}/5</p>
          </div>
        ) : null}
      </div>
      <HandoffReviewMetrics items={items} />
      <HandoffReviewChecklist items={checklistItems} />
      <textarea
        className={`${textareaClass} mt-4 min-h-72 font-mono text-xs`}
        readOnly
        value={
          selectedPackage?.handoffText ??
          "Refine 실행 후 target AI handoff package가 여기에 표시됩니다."
        }
      />
    </div>
  );
}

export function IntegrationRefineTester() {
  const [sourceApp, setSourceApp] = useState<SourceApp>("chrome");
  const [targetAI, setTargetAI] = useState<TargetModel | "auto">("codex");
  const [domain, setDomain] = useState("개발");
  const [goal, setGoal] = useState("개발 태스크 생성");
  const [rawInput, setRawInput] = useState(sampleInput);
  const [result, setResult] = useState<RefineResponse | null>(null);
  const [status, setStatus] = useState<RefineStatus>("idle");
  const [error, setError] = useState("");

  const selectedPackage = result?.handoffPackages[0];
  const handoffReadyLabel = selectedPackage
    ? "복사 가능"
    : result
      ? "패키지 없음"
      : "실행 전";
  const integrationRefineExecutionItems = [
    { label: "수집 경로", value: sourceApp },
    { label: "대상 AI", value: targetAI },
    {
      label: "검토 gate",
      value: result?.audit.reviewRequired ? "reviewRequired" : "실행 후 확인",
    },
    { label: "전달 패키지", value: handoffReadyLabel },
  ];
  const requestSummaryItems = [
    { label: "Source app", value: sourceApp },
    { label: "Target AI", value: targetAI },
    { label: "Domain", value: domain.trim() || "미입력" },
    { label: "Goal", value: goal.trim() || "미입력" },
  ];
  const handoffReviewItems = [
    {
      label: "Review gate",
      value: result?.audit.reviewRequired ? "필수" : "대기",
    },
    {
      label: "Target package",
      value: selectedPackage?.modelLabel ?? "미생성",
    },
    {
      label: "Quality",
      value: selectedPackage
        ? `${selectedPackage.qualityScore.toFixed(1)}/5`
        : "대기",
    },
    {
      label: "Language",
      value: result?.promptPackage.languageStrategy ?? "자동 판단",
    },
  ];
  const handoffReviewChecklistItems = [
    {
      label: "smoke evidence",
      value: selectedPackage
        ? "로컬 smoke evidence 저장 후 복사"
        : "실행 후 확인",
    },
    {
      label: "reviewRequired",
      value: result?.audit.reviewRequired
        ? "확인 후 외부 AI에 붙여넣기"
        : "Refine 실행 후 확인",
    },
    {
      label: "target package",
      value: selectedPackage?.modelLabel ?? "실행 후 확인",
    },
    {
      label: "language strategy",
      value: result?.promptPackage.languageStrategy ?? "AI 판단 대기",
    },
    {
      label: "missing context",
      value: selectedPackage
        ? "handoff package 본문에서 누락 맥락을 확인"
        : "실행 후 확인",
    },
  ];
  const payloadPreview = useMemo(
    () =>
      JSON.stringify(
        {
          domain,
          goal,
          rawInput,
          sourceApp,
          targetAI,
        },
        null,
        2,
      ),
    [domain, goal, rawInput, sourceApp, targetAI],
  );

  async function refinePrompt() {
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/integrations/refine", {
        body: payloadPreview,
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json()) as RefineResponse | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Refine request failed");
      }

      setResult(data as RefineResponse);
      setStatus("idle");
    } catch (refineError) {
      setResult(null);
      setStatus("error");
      setError(
        refineError instanceof Error
          ? refineError.message
          : "Refine request failed",
      );
    }
  }

  async function copyHandoffPackage() {
    if (!selectedPackage) {
      return;
    }

    const copied = await copyTextToClipboard(selectedPackage.handoffText);
    setStatus(copied ? "copied" : "error");
    setError(copied ? "" : "Clipboard copy failed. Select the text manually.");
  }

  return (
    <Panel>
      <PanelHeader
        title="Refine API 테스트"
        description="Chrome selection capture 또는 MCP refine_prompt 호출이 어떤 handoff package를 반환하는지 화면에서 바로 확인합니다."
      />
      <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <RefineSelectField
              label="Source app"
              onChange={setSourceApp}
              options={sourceAppOptions}
              value={sourceApp}
            />
            <RefineSelectField
              label="Target AI"
              onChange={setTargetAI}
              options={targetAiOptions}
              value={targetAI}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <RefineTextField
              label="Domain"
              onChange={setDomain}
              value={domain}
            />
            <RefineTextField
              label="Goal"
              onChange={setGoal}
              value={goal}
            />
          </div>
          <RefineRawInputField onChange={setRawInput} value={rawInput} />
          <RefineExecutionSummary items={integrationRefineExecutionItems} />
          <RefineActionBar
            canCopy={Boolean(selectedPackage)}
            canRun={Boolean(rawInput.trim())}
            onCopy={copyHandoffPackage}
            onRun={refinePrompt}
            status={status}
          />
          <RefineStatusNotice error={error} status={status} />
        </div>

        <div className="space-y-4">
          <RequestPayloadPreview
            items={requestSummaryItems}
            payloadPreview={payloadPreview}
          />
          <HandoffPackagePreview
            checklistItems={handoffReviewChecklistItems}
            items={handoffReviewItems}
            result={result}
            selectedPackage={selectedPackage}
          />
        </div>
      </div>
    </Panel>
  );
}
