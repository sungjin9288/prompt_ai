import type { LearningMemory } from "@/lib/prompt";
import { formatAbsoluteInternalHref } from "@/lib/navigation/href";
import {
  formatDate,
  reviewFilterLabels,
  scopeLabels,
  sortLabels,
  sourceTypeLabels,
  trackedScopes,
  type LearningReviewFilter,
  type LearningScopeFilter,
  type LearningSortMode,
} from "./labels";
import {
  feedbackImprovementReleaseGateCommand,
  feedbackImprovementValidationLibraryHref,
  getLearningHref,
  learningReadinessHref,
} from "./hrefs";
import { getLearningReadiness } from "./readiness";

export function buildLearningReadinessReportText({
  baseUrl,
  memories,
  readiness,
}: {
  baseUrl?: string;
  memories: LearningMemory[];
  readiness: ReturnType<typeof getLearningReadiness>;
}) {
  const formatLearningHref = (href: string) =>
    formatAbsoluteInternalHref(href, baseUrl) ?? href;

  return [
    "# 학습 준비도 리포트",
    "",
    `- 상태: ${readiness.label}`,
    `- 준비도 점수: ${readiness.score}/100`,
    `- 전체 메모리: ${memories.length}개`,
    `- 평균 신뢰도: ${
      memories.length ? readiness.averageConfidence.toFixed(2) : "-"
    }`,
    `- Scope 커버리지: ${readiness.coveredScopes.length}/4`,
    `- Covered scope: ${
      readiness.coveredScopes.length
        ? readiness.coveredScopes.map((scope) => scopeLabels[scope]).join(", ")
        : "없음"
    }`,
    `- Missing scope: ${
      readiness.missingScopes.length
        ? readiness.missingScopes.map((scope) => scopeLabels[scope]).join(", ")
        : "없음"
    }`,
    `- 높은 신뢰도 메모리: ${readiness.highConfidenceCount}개`,
    `- 낮은 신뢰도 메모리: ${readiness.lowConfidenceCount}개`,
    `- 최근 업데이트: ${
      readiness.latestMemoryDate ? formatDate(readiness.latestMemoryDate) : "-"
    }`,
    "",
    "## 다음 액션",
    readiness.actions.map((action) => `- ${action}`).join("\n"),
    "",
    "## 점검 링크",
    `- 준비도 화면: ${formatLearningHref(learningReadinessHref)}`,
    `- 전체 학습 메모리: ${formatLearningHref(
      getLearningHref({
        query: "",
        reviewFilter: "all",
        scope: "all",
        sortMode: "confidence-desc",
      }),
    )}`,
    `- 낮은 신뢰도: ${formatLearningHref(
      getLearningHref({
        query: "",
        reviewFilter: "low-confidence",
        scope: "all",
        sortMode: "confidence-asc",
      }),
    )}`,
    `- 최근 업데이트: ${formatLearningHref(
      getLearningHref({
        query: "",
        reviewFilter: "all",
        scope: "all",
        sortMode: "updated-desc",
      }),
    )}`,
    "",
    "## Scope별 메모리",
    trackedScopes
      .map(
        (scope) =>
          `- ${scopeLabels[scope]}: ${readiness.scopeCounts[scope]}개 · ${formatLearningHref(
            getLearningHref({
              query: "",
              reviewFilter: "all",
              scope,
              sortMode: "confidence-desc",
            }),
          )}`,
      )
      .join("\n"),
  ].join("\n");
}

export function buildFilteredMemoryReportText({
  baseUrl,
  filteredMemories,
  query,
  reviewFilter,
  scope,
  sortMode,
  totalMemories,
}: {
  baseUrl?: string;
  filteredMemories: LearningMemory[];
  query: string;
  reviewFilter: LearningReviewFilter;
  scope: LearningScopeFilter;
  sortMode: LearningSortMode;
  totalMemories: number;
}) {
  const filterHref = getLearningHref({ query, reviewFilter, scope, sortMode });
  const absoluteFilterHref =
    formatAbsoluteInternalHref(filterHref, baseUrl) ?? filterHref;

  return [
    "# 학습 메모리 필터 결과",
    "",
    "## 조건",
    `- 조건 링크: ${absoluteFilterHref}`,
    `- 범위: ${scopeLabels[scope]}`,
    `- 검토 기준: ${reviewFilterLabels[reviewFilter]}`,
    `- 정렬: ${sortLabels[sortMode]}`,
    `- 검색어: ${query.trim() || "-"}`,
    `- 결과: ${filteredMemories.length}/${totalMemories}개`,
    "",
    "## 메모리",
    filteredMemories.length
      ? filteredMemories
          .map((memory, index) =>
            [
              `### ${index + 1}. ${memory.title}`,
              `- Scope: ${scopeLabels[memory.scope]}`,
              `- Source: ${sourceTypeLabels[memory.sourceType]}`,
              `- Confidence: ${memory.confidence.toFixed(2)}`,
              `- Updated: ${formatDate(memory.updatedAt)}`,
              `- Tags: ${memory.tags.length ? memory.tags.join(", ") : "-"}`,
              "",
              memory.content,
            ].join("\n"),
          )
          .join("\n\n")
      : "현재 조건에 맞는 학습 메모리가 없습니다.",
  ].join("\n");
}

export function buildFeedbackImprovementQueueReportText({
  baseUrl,
  filteredMemories,
  query,
  reviewFilter,
  scope,
  sortMode,
  totalMemories,
}: {
  baseUrl?: string;
  filteredMemories: LearningMemory[];
  query: string;
  reviewFilter: LearningReviewFilter;
  scope: LearningScopeFilter;
  sortMode: LearningSortMode;
  totalMemories: number;
}) {
  const filterHref = getLearningHref({ query, reviewFilter, scope, sortMode });
  const absoluteFilterHref =
    formatAbsoluteInternalHref(filterHref, baseUrl) ?? filterHref;
  const lowConfidenceHref = getLearningHref({
    query: "feedback-improvement",
    reviewFilter: "low-confidence",
    scope,
    sortMode: "confidence-asc",
  });
  const absoluteLowConfidenceHref =
    formatAbsoluteInternalHref(lowConfidenceHref, baseUrl) ?? lowConfidenceHref;
  const absoluteValidationLibraryHref =
    formatAbsoluteInternalHref(
      feedbackImprovementValidationLibraryHref,
      baseUrl,
    ) ?? feedbackImprovementValidationLibraryHref;
  const lowConfidenceCount = filteredMemories.filter(
    (memory) => memory.confidence < 0.5,
  ).length;
  const coveredScopeLabels = trackedScopes
    .filter((item) => filteredMemories.some((memory) => memory.scope === item))
    .map((item) => scopeLabels[item]);

  return [
    "# 피드백 개선 메모리 큐 리포트",
    "",
    "## 큐 조건",
    `- 조건 링크: ${absoluteFilterHref}`,
    `- 낮은 신뢰도 큐: ${absoluteLowConfidenceHref}`,
    `- 저신뢰도 검증 저장본: ${absoluteValidationLibraryHref}`,
    `- 범위: ${scopeLabels[scope]}`,
    `- 검토 기준: ${reviewFilterLabels[reviewFilter]}`,
    `- 정렬: ${sortLabels[sortMode]}`,
    `- 검색어: ${query.trim() || "-"}`,
    `- 결과: ${filteredMemories.length}/${totalMemories}개`,
    "",
    "## 큐 지표",
    `- 낮은 신뢰도: ${lowConfidenceCount}개`,
    `- 포함 scope: ${coveredScopeLabels.length ? coveredScopeLabels.join(", ") : "-"}`,
    "",
    "## 운영 액션",
    "- 높은 신뢰도 규칙은 Studio 템플릿과 외부 AI handoff 체크리스트에 반영합니다.",
    "- 낮은 신뢰도 규칙은 Library 피드백을 추가 수집한 뒤 재저장합니다.",
    "- 충돌하는 규칙은 scope와 적용 업무를 좁혀 별도 Learning memory로 분리합니다.",
    "- 큐 반영 후 release evidence를 새로 만들고 release-candidate gate를 확인합니다.",
    "",
    "## 검증 명령",
    feedbackImprovementReleaseGateCommand,
    "",
    "## 메모리",
    filteredMemories.length
      ? filteredMemories
          .map((memory, index) =>
            [
              `### ${index + 1}. ${memory.title}`,
              `- Scope: ${scopeLabels[memory.scope]}`,
              `- Source: ${sourceTypeLabels[memory.sourceType]}`,
              `- Confidence: ${memory.confidence.toFixed(2)}`,
              `- Updated: ${formatDate(memory.updatedAt)}`,
              `- Tags: ${memory.tags.length ? memory.tags.join(", ") : "-"}`,
              "",
              memory.content,
            ].join("\n"),
          )
          .join("\n\n")
      : "현재 피드백 개선 큐에 포함된 학습 메모리가 없습니다.",
  ].join("\n");
}

export function buildSingleMemoryReportText(memory: LearningMemory) {
  return [
    "# 학습 메모리",
    "",
    `## ${memory.title}`,
    `- Scope: ${scopeLabels[memory.scope]}`,
    `- Source: ${sourceTypeLabels[memory.sourceType]}`,
    `- Confidence: ${memory.confidence.toFixed(2)}`,
    `- Updated: ${formatDate(memory.updatedAt)}`,
    `- Tags: ${memory.tags.length ? memory.tags.join(", ") : "-"}`,
    "",
    "## Content",
    memory.content,
  ].join("\n");
}
