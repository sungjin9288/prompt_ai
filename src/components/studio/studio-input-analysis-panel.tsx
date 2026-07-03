"use client";

import { secondaryButtonClass } from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import type { PromptInputReadinessAnalysis } from "@/lib/prompt";
import type { StudioManualCopy } from "@/components/studio/studio-view-types";

interface StudioPreparationStep {
  label: string;
  value: string;
  detail: string;
}

interface StudioInputAnalysisPanelProps {
  rawInput: string;
  inputReadinessLabel: string;
  studioPreparationSteps: StudioPreparationStep[];
  inputReadinessAnalysis: PromptInputReadinessAnalysis;
  missingQuestionCount: number;
  inputAnalysisCopied: boolean;
  inputReadinessQuestionBlockApplied: boolean;
  studioManualCopy: StudioManualCopy | null;
  copyInputReadinessReport: () => void;
  applyInputReadinessQuestions: () => void;
  onCloseManualCopy: () => void;
}

export function StudioInputAnalysisPanel({
  rawInput,
  inputReadinessLabel,
  studioPreparationSteps,
  inputReadinessAnalysis,
  missingQuestionCount,
  inputAnalysisCopied,
  inputReadinessQuestionBlockApplied,
  studioManualCopy,
  copyInputReadinessReport,
  applyInputReadinessQuestions,
  onCloseManualCopy,
}: StudioInputAnalysisPanelProps) {
  return (
    <>
      <div
        className="rounded-md border border-line bg-surface px-3 py-3"
        data-testid="studio-input-readiness-summary"
      >
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-soft">생성 준비</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              입력, 언어, 대상 AI, 학습 반영, 저장 흐름을 생성 전에
              확인합니다.
            </p>
          </div>
          <span className="shrink-0 rounded-md border border-line bg-panel px-3 py-2 text-xs font-semibold text-soft">
            {rawInput.trim() ? inputReadinessLabel : "원문 필요"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {studioPreparationSteps.map((step) => (
            <div
              key={step.label}
              className="min-w-0 rounded-md border border-line bg-panel px-3 py-2"
            >
              <p className="text-[11px] text-muted">{step.label}</p>
              <p className="mt-1 break-words text-xs font-semibold text-soft">
                {step.value}
              </p>
              <p className="mt-1 break-words text-[11px] leading-4 text-muted">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-md border border-line bg-surface px-3 py-3"
        data-testid="studio-input-analysis-preflight"
      >
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-soft">입력 분석</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              목적, 맥락, 제약, 출력 형식을 생성 전에 점검합니다.
            </p>
          </div>
          <span className="shrink-0 rounded-md border border-line bg-panel px-3 py-2 text-xs font-semibold text-soft">
            {inputReadinessLabel}
          </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          {inputReadinessAnalysis.summary}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {inputReadinessAnalysis.items.map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-md border border-line bg-panel px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] text-muted">{item.label}</p>
                <span className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-soft">
                  {item.value}
                </span>
              </div>
              <p className="mt-2 break-words text-[11px] leading-4 text-muted">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
        {inputReadinessAnalysis.missingQuestions.length ? (
          <div className="mt-3 rounded-md border border-line bg-panel px-3 py-2">
            <p className="text-[11px] font-semibold text-soft">
              보강 질문 {missingQuestionCount}개
            </p>
            <ul className="mt-1 space-y-1 text-[11px] leading-5 text-muted">
              {inputReadinessAnalysis.missingQuestions.map((question) => (
                <li key={question}>- {question}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 rounded-md border border-line bg-panel px-3 py-2 text-[11px] leading-5 text-muted">
            {inputReadinessAnalysis.action}
          </p>
        )}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={`${secondaryButtonClass} w-full sm:w-auto`}
            onClick={copyInputReadinessReport}
            data-testid="studio-input-analysis-copy"
          >
            {inputAnalysisCopied
              ? "분석 리포트 복사됨"
              : studioManualCopy?.id === "input-analysis"
                ? "분석 리포트 복사 실패"
                : "분석 리포트 복사"}
          </button>
          <button
            type="button"
            className={`${secondaryButtonClass} w-full sm:w-auto`}
            onClick={applyInputReadinessQuestions}
            disabled={!inputReadinessAnalysis.missingQuestions.length}
            data-testid="studio-input-analysis-apply"
          >
            {inputReadinessQuestionBlockApplied
              ? "보강 질문 확인"
              : "보강 질문 원문에 추가"}
          </button>
        </div>
        {studioManualCopy?.id === "input-analysis" ? (
          <ManualCopyPanel className="mt-4 bg-surface"
            copy={studioManualCopy}
            onClose={onCloseManualCopy}
          />
        ) : null}
      </div>
    </>
  );
}
