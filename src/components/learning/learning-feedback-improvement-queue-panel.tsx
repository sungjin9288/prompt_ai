import Link from "next/link";
import {
  Panel,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import type { LearningMemory } from "@/lib/prompt";
import { feedbackImprovementValidationLibraryHref } from "@/lib/learning-view/hrefs";
import type { LearningManualCopy } from "./learning-view-types";

type FeedbackImprovementQueueWorkflowStep = {
  detail: string;
  label: string;
  step: string;
  title: string;
};

interface LearningFeedbackImprovementQueuePanelProps {
  feedbackImprovementFilterActive: boolean;
  filtered: LearningMemory[];
  feedbackImprovementQueueLowConfidenceCount: number;
  feedbackImprovementQueueScopeCount: number;
  feedbackImprovementQueueWorkflowSteps: FeedbackImprovementQueueWorkflowStep[];
  feedbackImprovementLowConfidenceHref: string;
  copyFeedbackImprovementLowConfidenceLink: () => void;
  feedbackImprovementLowConfidenceLinkCopied: boolean;
  feedbackImprovementLowConfidenceLinkCopyFailed: boolean;
  copyFilterLink: () => void;
  filterLinkCopied: boolean;
  filterLinkCopyFailed: boolean;
  openFeedbackImprovementLowConfidenceInStudio: () => void;
  openFilteredMemoriesInStudio: () => void;
  copyFilteredMemoryReport: () => void;
  filteredReportCopied: boolean;
  filteredReportCopyFailed: boolean;
  copyFeedbackImprovementReleaseGate: () => void;
  releaseGateCopied: boolean;
  releaseGateCopyFailed: boolean;
  learningManualCopy: LearningManualCopy | null;
  setLearningManualCopy: (copy: LearningManualCopy | null) => void;
}

export function LearningFeedbackImprovementQueuePanel({
  feedbackImprovementFilterActive,
  filtered,
  feedbackImprovementQueueLowConfidenceCount,
  feedbackImprovementQueueScopeCount,
  feedbackImprovementQueueWorkflowSteps,
  feedbackImprovementLowConfidenceHref,
  copyFeedbackImprovementLowConfidenceLink,
  feedbackImprovementLowConfidenceLinkCopied,
  feedbackImprovementLowConfidenceLinkCopyFailed,
  copyFilterLink,
  filterLinkCopied,
  filterLinkCopyFailed,
  openFeedbackImprovementLowConfidenceInStudio,
  openFilteredMemoriesInStudio,
  copyFilteredMemoryReport,
  filteredReportCopied,
  filteredReportCopyFailed,
  copyFeedbackImprovementReleaseGate,
  releaseGateCopied,
  releaseGateCopyFailed,
  learningManualCopy,
  setLearningManualCopy,
}: LearningFeedbackImprovementQueuePanelProps) {
  return (
    feedbackImprovementFilterActive ? (
        <Panel
          id="learning-feedback-improvement-queue"
          className="mt-4 px-5 py-4"
          data-testid="learning-feedback-improvement-queue"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_260px] lg:items-start">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-soft">
                피드백 개선 메모리 큐
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Dashboard에서 저장한 피드백 개선 규칙을 현재 Learning 조건으로
                점검합니다. 반복 피드백을 Studio 생성 기준으로 승격하기 전에
                scope, 신뢰도, 원본 링크를 확인하세요.
              </p>
              <div
                data-testid="learning-feedback-improvement-queue-metrics"
                className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                <div className="rounded-md border border-line bg-surface px-3 py-3">
                  <p className="text-xs text-muted">현재 큐</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                    {filtered.length}
                  </p>
                </div>
                <div className="rounded-md border border-line bg-surface px-3 py-3">
                  <p className="text-xs text-muted">낮은 신뢰도</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                    {feedbackImprovementQueueLowConfidenceCount}
                  </p>
                </div>
                <div className="rounded-md border border-line bg-surface px-3 py-3">
                  <p className="text-xs text-muted">포함 scope</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                    {feedbackImprovementQueueScopeCount}/4
                  </p>
                </div>
              </div>
              <div
                data-testid="learning-feedback-improvement-workflow"
                className="mt-4 grid gap-3 md:grid-cols-3"
              >
                {feedbackImprovementQueueWorkflowSteps.map((item) => (
                  <div
                    key={item.step}
                    className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] font-semibold text-accent">
                        {item.step}
                      </span>
                      <p className="text-xs font-semibold text-muted">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-3 break-words text-sm font-semibold text-soft">
                      {item.title}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">검토</p>
                <div className="grid gap-2">
                  <Link
                    href={feedbackImprovementLowConfidenceHref}
                    className={`${secondaryButtonClass} w-full`}
                  >
                    낮은 신뢰도만 보기
                  </Link>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} w-full`}
                    onClick={copyFeedbackImprovementLowConfidenceLink}
                  >
                    {feedbackImprovementLowConfidenceLinkCopied
                      ? "낮은 신뢰도 링크 복사됨"
                      : feedbackImprovementLowConfidenceLinkCopyFailed
                        ? "낮은 신뢰도 링크 복사 실패"
                        : "낮은 신뢰도 링크 복사"}
                  </button>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} w-full`}
                    onClick={copyFilterLink}
                  >
                    {filterLinkCopied
                      ? "큐 조건 링크 복사됨"
                      : filterLinkCopyFailed
                        ? "큐 조건 링크 복사 실패"
                        : "큐 조건 링크 복사"}
                  </button>
                </div>
              </div>
              <div className="border-t border-line pt-3">
                <p className="mb-2 text-xs font-semibold text-muted">Studio</p>
                <div className="grid gap-2">
                  <button
                    type="button"
                    className={`${primaryButtonClass} w-full`}
                    onClick={openFeedbackImprovementLowConfidenceInStudio}
                    disabled={feedbackImprovementQueueLowConfidenceCount === 0}
                  >
                    낮은 신뢰도 Studio로
                  </button>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} w-full`}
                    onClick={openFilteredMemoriesInStudio}
                    disabled={filtered.length === 0}
                  >
                    큐 Studio로 보내기
                  </button>
                </div>
              </div>
              <div className="border-t border-line pt-3">
                <p className="mb-2 text-xs font-semibold text-muted">기록</p>
                <div className="grid gap-2">
                  <button
                    type="button"
                    className={`${secondaryButtonClass} w-full`}
                    onClick={copyFilteredMemoryReport}
                  >
                    {filteredReportCopied
                      ? "큐 리포트 복사됨"
                      : filteredReportCopyFailed
                        ? "큐 리포트 복사 실패"
                        : "큐 리포트 복사"}
                  </button>
                  <Link
                    href={feedbackImprovementValidationLibraryHref}
                    className={`${secondaryButtonClass} w-full`}
                  >
                    검증 저장본 보기
                  </Link>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} w-full`}
                    onClick={copyFeedbackImprovementReleaseGate}
                  >
                    {releaseGateCopied
                      ? "Release gate 복사됨"
                      : releaseGateCopyFailed
                        ? "Release gate 복사 실패"
                        : "Release gate 복사"}
                  </button>
                  <Link href="/" className={`${secondaryButtonClass} w-full`}>
                    Dashboard로 돌아가기
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {learningManualCopy?.id === "filter-link" ||
          learningManualCopy?.id === "filtered-report" ||
          learningManualCopy?.id ===
            "feedback-improvement-low-confidence-link" ||
          learningManualCopy?.id ===
            "feedback-improvement-release-gate" ||
          learningManualCopy?.id ===
            "feedback-improvement-low-confidence-studio" ? (
            <div
              className="mt-4"
              data-testid="learning-feedback-improvement-queue-manual-copy"
            >
              <ManualCopyPanel
                copy={learningManualCopy}
                onClose={() => setLearningManualCopy(null)}
              />
            </div>
          ) : null}
        </Panel>
      ) : null
  );
}
