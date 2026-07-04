import Link from "next/link";
import {
  PageHeader,
  Panel,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import type { LearningMemory } from "@/lib/prompt";
import {
  formatDate,
  scopeLabels,
  trackedScopes,
  type LearningReviewFilter,
  type LearningScopeFilter,
  type LearningSortMode,
} from "@/lib/learning-view/labels";
import { getLearningReadiness } from "@/lib/learning-view/readiness";
import type { LearningManualCopy } from "./learning-view-types";

type LearningNextActionGuide = {
  detail: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  status: string;
  title: string;
};

interface LearningReadinessPanelProps {
  learningReadiness: ReturnType<typeof getLearningReadiness>;
  memories: LearningMemory[];
  scopeCounts: Record<LearningScopeFilter, number>;
  averageConfidence: number;
  learningNextActionGuide: LearningNextActionGuide;
  scope: LearningScopeFilter;
  applyReadinessShortcut: (input: {
    nextQuery?: string;
    nextReviewFilter: LearningReviewFilter;
    nextSortMode: LearningSortMode;
  }) => void;
  updateScopeFilter: (nextScope: LearningScopeFilter) => void;
  copyReadinessReport: () => void;
  readinessReportCopied: boolean;
  readinessReportCopyFailed: boolean;
  openReadinessReportInStudio: () => void;
  learningManualCopy: LearningManualCopy | null;
  setLearningManualCopy: (copy: LearningManualCopy | null) => void;
}

export function LearningReadinessPanel({
  learningReadiness,
  memories,
  scopeCounts,
  averageConfidence,
  learningNextActionGuide,
  scope,
  applyReadinessShortcut,
  updateScopeFilter,
  copyReadinessReport,
  readinessReportCopied,
  readinessReportCopyFailed,
  openReadinessReportInStudio,
  learningManualCopy,
  setLearningManualCopy,
}: LearningReadinessPanelProps) {
  return (
    <>
      <PageHeader
        title="학습 메모리"
        description="피드백에서 추출된 사용자, 회사, 분야, 스킬 기준을 확인합니다. 이 메모리는 다음 프롬프트 생성에 함께 반영됩니다."
      />

      <div
        data-testid="learning-summary-metrics"
        className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
      >
        {[
          ["전체 메모리", memories.length.toString()],
          ["사용자", scopeCounts.user.toString()],
          ["회사", scopeCounts.company.toString()],
          ["평균 신뢰도", memories.length ? averageConfidence.toFixed(2) : "-"],
        ].map(([label, value]) => (
          <Panel key={label} className="min-w-0 px-4 py-3 sm:px-5 sm:py-4">
            <p className="break-words text-xs leading-4 text-muted sm:text-sm">
              {label}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold sm:text-3xl">
              {value}
            </p>
          </Panel>
        ))}
      </div>

      <Panel
        data-testid="learning-next-action-guide"
        className="mt-4 px-4 py-4 sm:px-5"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase text-muted">
                Next learning action
              </p>
              <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                {learningNextActionGuide.status}
              </span>
            </div>
            <h2 className="mt-2 break-words text-base font-semibold text-soft">
              {learningNextActionGuide.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              {learningNextActionGuide.detail}
            </p>
          </div>
          <div className="grid shrink-0 gap-2 sm:grid-cols-2 md:w-[360px]">
            <Link
              href={learningNextActionGuide.primaryHref}
              className={`${primaryButtonClass} justify-center text-center`}
            >
              {learningNextActionGuide.primaryLabel}
            </Link>
            <Link
              href={learningNextActionGuide.secondaryHref}
              className={`${secondaryButtonClass} justify-center text-center`}
            >
              {learningNextActionGuide.secondaryLabel}
            </Link>
          </div>
        </div>
      </Panel>

      <Panel id="readiness" className="mt-4 scroll-mt-6 px-5 py-4">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-soft">학습 준비도</p>
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${learningReadiness.tone}`}
                  >
                    {learningReadiness.label}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {learningReadiness.description}
                </p>
              </div>
              <span className="shrink-0 rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm font-semibold text-soft">
                {learningReadiness.score}/100
              </span>
            </div>

            <div
              data-testid="learning-readiness-metrics"
              className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <div className="rounded-md border border-line bg-surface px-3 py-3">
                <p className="text-xs text-muted">Scope 커버리지</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                  {learningReadiness.coveredScopes.length}/4
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-line bg-surface px-3 py-3 text-left transition hover:border-accent/50 hover:bg-accent/5"
                onClick={() =>
                  applyReadinessShortcut({
                    nextReviewFilter: "all",
                    nextSortMode: "confidence-desc",
                  })
                }
              >
                <p className="text-xs text-muted">높은 신뢰도</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                  {learningReadiness.highConfidenceCount}
                </p>
              </button>
              <button
                type="button"
                className="rounded-md border border-line bg-surface px-3 py-3 text-left transition hover:border-attention/50 hover:bg-attention/5"
                onClick={() =>
                  applyReadinessShortcut({
                    nextReviewFilter: "low-confidence",
                    nextSortMode: "confidence-asc",
                  })
                }
              >
                <p className="text-xs text-muted">낮은 신뢰도</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                  {learningReadiness.lowConfidenceCount}
                </p>
              </button>
              <button
                type="button"
                className="rounded-md border border-line bg-surface px-3 py-3 text-left transition hover:border-accent/50 hover:bg-accent/5"
                onClick={() =>
                  applyReadinessShortcut({
                    nextReviewFilter: "all",
                    nextSortMode: "updated-desc",
                  })
                }
              >
                <p className="text-xs text-muted">최근 업데이트</p>
                <p className="mt-1 break-words text-sm font-semibold text-soft">
                  {learningReadiness.latestMemoryDate
                    ? formatDate(learningReadiness.latestMemoryDate)
                    : "-"}
                </p>
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {trackedScopes.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
                    scope === item
                      ? "border-accent bg-accent/10 text-accent"
                      : learningReadiness.scopeCounts[item] > 0
                        ? "border-accent/40 bg-accent/10 text-accent hover:border-accent"
                        : "border-line bg-surface text-muted hover:text-foreground"
                  }`}
                  onClick={() => updateScopeFilter(item)}
                >
                  {scopeLabels[item]} {learningReadiness.scopeCounts[item]}
                </button>
              ))}
              {scope !== "all" ? (
                <button
                  type="button"
                  className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold text-muted transition hover:text-foreground"
                  onClick={() => updateScopeFilter("all")}
                >
                  전체 보기
                </button>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 rounded-md border border-line bg-surface px-4 py-3">
            <p className="text-sm font-semibold text-soft">다음 보강 액션</p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
              {learningReadiness.actions.map((action) => (
                <li key={action} className="break-words">
                  - {action}
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className={`${secondaryButtonClass} w-full`}
                onClick={copyReadinessReport}
              >
                {readinessReportCopied
                  ? "운영 리포트 복사됨"
                  : readinessReportCopyFailed
                    ? "운영 리포트 복사 실패"
                  : "운영 리포트 복사"}
              </button>
              <button
                type="button"
                className={`${secondaryButtonClass} w-full`}
                onClick={openReadinessReportInStudio}
              >
                준비도 Studio로 보내기
              </button>
            </div>
            {learningManualCopy?.id === "readiness-report" ? (
              <div className="mt-4">
                <ManualCopyPanel
                  copy={learningManualCopy}
                  onClose={() => setLearningManualCopy(null)}
                />
              </div>
            ) : null}
          </div>
        </div>
      </Panel>
    </>
  );
}
