import {
  Panel,
  PanelHeader,
  inputClass,
  secondaryButtonClass,
  selectClass,
} from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import type { LearningMemory } from "@/lib/prompt";
import {
  reviewFilterLabels,
  reviewFilters,
  scopeLabels,
  scopes,
  sortLabels,
  sortModes,
  type LearningReviewFilter,
  type LearningScopeFilter,
  type LearningSortMode,
} from "@/lib/learning-view/labels";
import type { LearningManualCopy } from "./learning-view-types";

interface LearningFilterPanelProps {
  scope: LearningScopeFilter;
  updateScopeFilter: (nextScope: LearningScopeFilter) => void;
  scopeCounts: Record<LearningScopeFilter, number>;
  reviewFilter: LearningReviewFilter;
  updateReviewFilter: (nextReviewFilter: LearningReviewFilter) => void;
  reviewCounts: Record<LearningReviewFilter, number>;
  sortMode: LearningSortMode;
  updateSortMode: (nextSortMode: LearningSortMode) => void;
  query: string;
  updateQuery: (nextQuery: string) => void;
  filtered: LearningMemory[];
  copyFilterLink: () => void;
  filterLinkCopied: boolean;
  filterLinkCopyFailed: boolean;
  copyFilteredMemoryReport: () => void;
  filteredReportCopied: boolean;
  filteredReportCopyFailed: boolean;
  openFilteredMemoriesInStudio: () => void;
  hasActiveLearningFilters: boolean;
  resetLearningFilters: () => void;
  feedbackImprovementFilterActive: boolean;
  learningManualCopy: LearningManualCopy | null;
  setLearningManualCopy: (copy: LearningManualCopy | null) => void;
}

export function LearningFilterPanel({
  scope,
  updateScopeFilter,
  scopeCounts,
  reviewFilter,
  updateReviewFilter,
  reviewCounts,
  sortMode,
  updateSortMode,
  query,
  updateQuery,
  filtered,
  copyFilterLink,
  filterLinkCopied,
  filterLinkCopyFailed,
  copyFilteredMemoryReport,
  filteredReportCopied,
  filteredReportCopyFailed,
  openFilteredMemoriesInStudio,
  hasActiveLearningFilters,
  resetLearningFilters,
  feedbackImprovementFilterActive,
  learningManualCopy,
  setLearningManualCopy,
}: LearningFilterPanelProps) {
  return (
        <Panel id="learning-filter-panel" className="scroll-mt-6">
          <PanelHeader
            title="필터"
            description="메모리 범위, 검토 기준, 정렬로 학습 데이터를 좁혀봅니다."
          />
          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">범위</span>
              <select
                className={selectClass}
                value={scope}
                onChange={(event) =>
                  updateScopeFilter(event.target.value as LearningScopeFilter)
                }
              >
                {scopes.map((item) => (
                  <option key={item} value={item}>
                    {scopeLabels[item]} ({scopeCounts[item]})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">
                검토 기준
              </span>
              <select
                className={selectClass}
                value={reviewFilter}
                onChange={(event) =>
                  updateReviewFilter(event.target.value as LearningReviewFilter)
                }
              >
                {reviewFilters.map((item) => (
                  <option key={item} value={item}>
                    {reviewFilterLabels[item]} ({reviewCounts[item]})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">정렬</span>
              <select
                className={selectClass}
                value={sortMode}
                onChange={(event) =>
                  updateSortMode(event.target.value as LearningSortMode)
                }
              >
                {sortModes.map((item) => (
                  <option key={item} value={item}>
                    {sortLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">검색</span>
              <input
                className={inputClass}
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="톤, 회사 기준, Codex 등"
              />
            </label>
            <div className="rounded-md border border-line bg-surface px-3 py-3 text-xs leading-5 text-muted">
              현재 조건 {filtered.length}개 · 낮은 신뢰도{" "}
              {reviewCounts["low-confidence"]}개 · 수동 {reviewCounts.manual}개
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                className={`${secondaryButtonClass} w-full`}
                onClick={copyFilterLink}
              >
                {filterLinkCopied
                  ? "조건 링크 복사됨"
                  : filterLinkCopyFailed
                    ? "조건 링크 복사 실패"
                    : "현재 조건 링크 복사"}
              </button>
              <button
                type="button"
                className={`${secondaryButtonClass} w-full`}
                onClick={copyFilteredMemoryReport}
              >
                {filteredReportCopied
                  ? "필터 결과 복사됨"
                  : filteredReportCopyFailed
                    ? "필터 결과 복사 실패"
                  : "필터 결과 복사"}
              </button>
              <button
                type="button"
                className={`${secondaryButtonClass} w-full`}
                onClick={openFilteredMemoriesInStudio}
                disabled={filtered.length === 0}
              >
                필터 결과 Studio로 보내기
              </button>
              {hasActiveLearningFilters ? (
                <button
                  type="button"
                  className={`${secondaryButtonClass} w-full`}
                  onClick={resetLearningFilters}
                >
                  조건 초기화
                </button>
              ) : null}
            </div>
            {!feedbackImprovementFilterActive &&
            (learningManualCopy?.id === "filter-link" ||
              learningManualCopy?.id === "filtered-report") ? (
              <ManualCopyPanel
                copy={learningManualCopy}
                onClose={() => setLearningManualCopy(null)}
              />
            ) : null}
          </div>
        </Panel>
  );
}
