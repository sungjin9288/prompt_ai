"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { LearningMemory, MemoryScope } from "@/lib/prompt";
import { useLearningMemoriesStore } from "@/lib/data/workspace-store";
import { formatAbsoluteInternalHref } from "@/lib/navigation/href";
import { writeStudioDraft } from "@/lib/studio/draft";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import {
  compareMemories,
  findDuplicateMemory,
  makeId,
  matchesReviewFilter,
  parseTags,
  reviewFilters,
  scopeLabels,
  scopes,
  trackedScopes,
  type LearningReviewFilter,
  type LearningScopeFilter,
  type LearningSortMode,
} from "@/lib/learning-view/labels";
import {
  feedbackImprovementReleaseGateCommand,
  getLearningHref,
  learningReadinessHref,
} from "@/lib/learning-view/hrefs";
import { getLearningReadiness } from "@/lib/learning-view/readiness";
import {
  buildFeedbackImprovementQueueReportText,
  buildFilteredMemoryReportText,
  buildLearningReadinessReportText,
  buildSingleMemoryReportText,
} from "@/lib/learning-view/report-text";
import {
  buildFeedbackImprovementLowConfidenceStudioDraftInput,
  buildFeedbackImprovementQueueStudioDraftInput,
  buildFilteredMemoriesStudioDraftInput,
  buildLearningReadinessStudioDraftInput,
  buildMemoryStudioDraftInput,
  formatLearningFilterSourceTitle,
} from "@/lib/learning-view/studio-drafts";

import { LearningReadinessPanel } from "./learning-readiness-panel";
import { LearningFeedbackImprovementQueuePanel } from "./learning-feedback-improvement-queue-panel";
import { LearningFilterPanel } from "./learning-filter-panel";
import { LearningManualMemoryPanel } from "./learning-manual-memory-panel";
import { LearningMemoryListPanel } from "./learning-memory-list-panel";
import type { LearningManualCopy } from "./learning-view-types";

export type {
  LearningReviewFilter,
  LearningScopeFilter,
  LearningSortMode,
} from "@/lib/learning-view/labels";

export function LearningView({
  initialQuery = "",
  initialReviewFilter = "all",
  initialScope = "all",
  initialSortMode = "confidence-desc",
}: {
  initialQuery?: string;
  initialReviewFilter?: LearningReviewFilter;
  initialScope?: LearningScopeFilter;
  initialSortMode?: LearningSortMode;
}) {
  const router = useRouter();
  const [memories, setMemories] = useLearningMemoriesStore();
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<LearningScopeFilter>(initialScope);
  const [reviewFilter, setReviewFilter] =
    useState<LearningReviewFilter>(initialReviewFilter);
  const [sortMode, setSortMode] =
    useState<LearningSortMode>(initialSortMode);
  const [readinessReportCopied, setReadinessReportCopied] = useState(false);
  const [readinessReportCopyFailed, setReadinessReportCopyFailed] =
    useState(false);
  const [filterLinkCopied, setFilterLinkCopied] = useState(false);
  const [filterLinkCopyFailed, setFilterLinkCopyFailed] = useState(false);
  const [
    feedbackImprovementLowConfidenceLinkCopied,
    setFeedbackImprovementLowConfidenceLinkCopied,
  ] = useState(false);
  const [
    feedbackImprovementLowConfidenceLinkCopyFailed,
    setFeedbackImprovementLowConfidenceLinkCopyFailed,
  ] = useState(false);
  const [filteredReportCopied, setFilteredReportCopied] = useState(false);
  const [filteredReportCopyFailed, setFilteredReportCopyFailed] =
    useState(false);
  const [releaseGateCopied, setReleaseGateCopied] = useState(false);
  const [releaseGateCopyFailed, setReleaseGateCopyFailed] = useState(false);
  const [copiedMemoryId, setCopiedMemoryId] = useState("");
  const [failedMemoryCopyId, setFailedMemoryCopyId] = useState("");
  const [learningManualCopy, setLearningManualCopy] =
    useState<LearningManualCopy | null>(null);
  const [manualScope, setManualScope] = useState<MemoryScope>(
    initialScope === "all" ? "company" : initialScope,
  );
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualTags, setManualTags] = useState("");
  const [manualConfidence, setManualConfidence] = useState(0.85);
  const [manualSaved, setManualSaved] = useState(false);
  const [manualValidationMessage, setManualValidationMessage] = useState("");
  const [deletedManualMemoryTitle, setDeletedManualMemoryTitle] = useState("");
  const [editingMemoryId, setEditingMemoryId] = useState("");
  const [editScope, setEditScope] = useState<MemoryScope>("company");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editConfidence, setEditConfidence] = useState(0.85);
  const [editValidationMessage, setEditValidationMessage] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return memories
      .filter((memory) => scope === "all" || memory.scope === scope)
      .filter((memory) => matchesReviewFilter(memory, reviewFilter))
      .filter((memory) => {
        if (!needle) {
          return true;
        }

        return [memory.title, memory.content, memory.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => compareMemories(a, b, sortMode));
  }, [memories, query, reviewFilter, scope, sortMode]);

  const scopeCounts = useMemo(
    () =>
      scopes.reduce(
        (result, item) => ({
          ...result,
          [item]:
            item === "all"
              ? memories.length
              : memories.filter((memory) => memory.scope === item).length,
        }),
        {} as Record<MemoryScope | "all", number>,
      ),
    [memories],
  );

  const averageConfidence =
    memories.length === 0
      ? 0
      : memories.reduce((sum, memory) => sum + memory.confidence, 0) /
        memories.length;
  const learningReadiness = useMemo(
    () => getLearningReadiness(memories),
    [memories],
  );
  const reviewCounts = useMemo(
    () =>
      reviewFilters.reduce(
        (result, item) => ({
          ...result,
          [item]: memories.filter((memory) => matchesReviewFilter(memory, item))
            .length,
        }),
        {} as Record<LearningReviewFilter, number>,
      ),
    [memories],
  );
  const hasActiveLearningFilters =
    scope !== "all" ||
    reviewFilter !== "all" ||
    sortMode !== "confidence-desc" ||
    query.trim().length > 0;
  const feedbackImprovementFilterActive =
    query.trim().toLowerCase() === "feedback-improvement";
  const feedbackImprovementLowConfidenceHref = getLearningHref({
    query: "feedback-improvement",
    reviewFilter: "low-confidence",
    scope,
    sortMode: "confidence-asc",
  });
  const feedbackImprovementLowConfidenceMemories = filtered.filter(
    (memory) => memory.confidence < 0.5,
  );
  const feedbackImprovementQueueLowConfidenceCount =
    feedbackImprovementLowConfidenceMemories.length;
  const feedbackImprovementQueueScopeCount = trackedScopes.filter((item) =>
    filtered.some((memory) => memory.scope === item),
  ).length;
  const feedbackImprovementQueueWorkflowSteps = useMemo(
    () => [
      {
        detail:
          "낮은 신뢰도만 보기와 큐 조건 링크 복사로 재사용 전 근거를 먼저 확인합니다.",
        label: "검토",
        step: "01",
        title: `낮은 신뢰도 ${feedbackImprovementQueueLowConfidenceCount}개`,
      },
      {
        detail:
          "저신뢰도 검증 초안이나 전체 큐 초안으로 Studio에서 규칙 승격 계획을 만듭니다.",
        label: "Studio",
        step: "02",
        title:
          filtered.length > 0 ? `큐 ${filtered.length}개 전송` : "전송 대기",
      },
      {
        detail:
          "큐 리포트와 검증 저장본 링크로 어떤 기준을 반영했는지 추적합니다.",
        label: "기록",
        step: "03",
        title: `포함 scope ${feedbackImprovementQueueScopeCount}/4`,
      },
    ],
    [
      feedbackImprovementQueueLowConfidenceCount,
      feedbackImprovementQueueScopeCount,
      filtered.length,
    ],
  );
  const learningLowConfidenceReviewHref = getLearningHref({
    query: "",
    reviewFilter: "low-confidence",
    scope,
    sortMode: "confidence-asc",
  });
  const learningNextActionGuide = useMemo(() => {
    if (memories.length === 0) {
      return {
        detail:
          "실제 생성 결과에 피드백을 남기거나 직접 기준을 저장해야 다음 Studio 생성에 개인화 컨텍스트가 붙습니다.",
        primaryHref: "/library",
        primaryLabel: "Library 피드백 남기기",
        secondaryHref: "#learning-manual-memory",
        secondaryLabel: "수동 메모리 추가",
        status: "첫 학습 필요",
        title: "첫 학습 메모리를 만들 차례",
      };
    }

    if (learningReadiness.lowConfidenceCount > 0) {
      return {
        detail:
          "신뢰도가 낮은 메모리는 바로 재사용하지 말고 근거를 보강한 뒤 Studio 초안에 반영합니다.",
        primaryHref: learningLowConfidenceReviewHref,
        primaryLabel: "낮은 신뢰도 검토",
        secondaryHref: "#readiness",
        secondaryLabel: "운영 리포트 확인",
        status: "검증 우선",
        title: `${learningReadiness.lowConfidenceCount}개 메모리 검증 필요`,
      };
    }

    const missingScope = learningReadiness.missingScopes[0];

    if (missingScope) {
      return {
        detail:
          "비어 있는 scope를 먼저 채우면 사용자, 회사, 분야, 스킬 기준이 더 균형 있게 프롬프트에 반영됩니다.",
        primaryHref: getLearningHref({
          query: "",
          reviewFilter: "all",
          scope: missingScope,
          sortMode: "confidence-desc",
        }),
        primaryLabel: `${scopeLabels[missingScope]} scope 열기`,
        secondaryHref: "#learning-manual-memory",
        secondaryLabel: "직접 기준 저장",
        status: "커버리지 보강",
        title: `${scopeLabels[missingScope]} 기준을 보강하세요`,
      };
    }

    if (feedbackImprovementFilterActive) {
      return {
        detail:
          "현재 피드백 개선 큐를 품질 규칙, 추가 검증 항목, 외부 AI handoff 체크리스트로 정리합니다.",
        primaryHref: "#learning-feedback-improvement-queue",
        primaryLabel: "큐 액션 확인",
        secondaryHref: feedbackImprovementLowConfidenceHref,
        secondaryLabel: "저신뢰도만 보기",
        status: "큐 운영",
        title: "피드백 개선 규칙을 정리할 차례",
      };
    }

    return {
      detail:
        "학습 준비도는 안정권입니다. Studio에서 새 프롬프트를 생성하고 결과 피드백을 다시 저장해 기준을 갱신합니다.",
      primaryHref: "/studio?draft=learning-readiness",
      primaryLabel: "Studio에서 적용 확인",
      secondaryHref: "#learning-filter-panel",
      secondaryLabel: "현재 조건 점검",
      status: "적용 확인",
      title: "학습 컨텍스트를 생성에 적용하세요",
    };
  }, [
    feedbackImprovementFilterActive,
    feedbackImprovementLowConfidenceHref,
    learningLowConfidenceReviewHref,
    learningReadiness,
    memories.length,
  ]);
  const manualMemoryWorkflowSteps = useMemo(
    () => [
      {
        detail: "새 기준이 적용될 학습 scope를 먼저 고정합니다.",
        label: "범위 선택",
        step: "01",
        title: scopeLabels[manualScope],
      },
      {
        detail: manualContent.trim()
          ? "다음 생성에 반영할 규칙 본문이 준비됐습니다."
          : "한 문장으로도 괜찮으니 반복해서 적용할 기준을 적습니다.",
        label: "규칙 작성",
        step: "02",
        title: manualTitle.trim() || "제목 대기",
      },
      {
        detail:
          "저장 후 해당 scope 필터로 이동해 바로 검토하고 Studio 생성에 반영합니다.",
        label: "생성 반영",
        step: "03",
        title: manualSaved ? "저장됨" : "저장 후 반영",
      },
    ],
    [manualContent, manualSaved, manualScope, manualTitle],
  );

  async function copyReadinessReport() {
    const reportText = buildLearningReadinessReportText({
      baseUrl: typeof window === "undefined" ? undefined : window.location.origin,
      memories,
      readiness: learningReadiness,
    });
    const copied = await copyTextToClipboard(reportText);

    setReadinessReportCopied(copied);
    setReadinessReportCopyFailed(!copied);
    setLearningManualCopy(
      copied
        ? null
        : {
            id: "readiness-report",
            title: "학습 준비도 운영 리포트",
            body: reportText,
          },
    );
  }

  async function copyFilteredMemoryReport() {
    const reportPayload = {
      baseUrl: typeof window === "undefined" ? undefined : window.location.origin,
      filteredMemories: filtered,
      query,
      reviewFilter,
      scope,
      sortMode,
      totalMemories: memories.length,
    };
    const reportText = feedbackImprovementFilterActive
      ? buildFeedbackImprovementQueueReportText(reportPayload)
      : buildFilteredMemoryReportText(reportPayload);
    const copied = await copyTextToClipboard(reportText);

    setFilteredReportCopied(copied);
    setFilteredReportCopyFailed(!copied);
    setReleaseGateCopied(false);
    setReleaseGateCopyFailed(false);
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(
      copied
        ? null
        : {
            id: "filtered-report",
            title: feedbackImprovementFilterActive
              ? "피드백 개선 메모리 큐"
              : "필터 결과",
            body: reportText,
          },
    );
  }

  async function copyMemoryReport(memory: LearningMemory) {
    const reportText = buildSingleMemoryReportText(memory);
    const copied = await copyTextToClipboard(reportText);

    setFilteredReportCopied(false);
    setFilteredReportCopyFailed(false);
    setReleaseGateCopied(false);
    setReleaseGateCopyFailed(false);
    setCopiedMemoryId(copied ? memory.id : "");
    setFailedMemoryCopyId(copied ? "" : memory.id);
    setLearningManualCopy(
      copied
        ? null
        : {
            id: `memory:${memory.id}`,
            title: memory.title,
            body: reportText,
          },
    );
  }

  async function copyFeedbackImprovementReleaseGate() {
    const copied = await copyTextToClipboard(
      feedbackImprovementReleaseGateCommand,
    );

    setReleaseGateCopied(copied);
    setReleaseGateCopyFailed(!copied);
    setFilterLinkCopied(false);
    setFilterLinkCopyFailed(false);
    setFeedbackImprovementLowConfidenceLinkCopied(false);
    setFeedbackImprovementLowConfidenceLinkCopyFailed(false);
    setFilteredReportCopied(false);
    setFilteredReportCopyFailed(false);
    setLearningManualCopy(
      copied
        ? null
        : {
            id: "feedback-improvement-release-gate",
            title: "피드백 개선 큐 release gate",
            body: feedbackImprovementReleaseGateCommand,
          },
    );
  }

  async function copyFilterLink() {
    const href = getLearningHref({ query, reviewFilter, scope, sortMode });
    const linkText =
      formatAbsoluteInternalHref(
        href,
        typeof window === "undefined" ? undefined : window.location.origin,
      ) ?? href;
    const copied = await copyTextToClipboard(linkText);

    setFilterLinkCopied(copied);
    setFilterLinkCopyFailed(!copied);
    setFeedbackImprovementLowConfidenceLinkCopied(false);
    setFeedbackImprovementLowConfidenceLinkCopyFailed(false);
    setReleaseGateCopied(false);
    setReleaseGateCopyFailed(false);
    setLearningManualCopy(
      copied
        ? null
        : {
            id: "filter-link",
            title: "현재 조건 링크",
            body: linkText,
          },
    );
  }

  async function copyFeedbackImprovementLowConfidenceLink() {
    const linkText =
      formatAbsoluteInternalHref(
        feedbackImprovementLowConfidenceHref,
        typeof window === "undefined" ? undefined : window.location.origin,
      ) ?? feedbackImprovementLowConfidenceHref;
    const copied = await copyTextToClipboard(linkText);

    setFeedbackImprovementLowConfidenceLinkCopied(copied);
    setFeedbackImprovementLowConfidenceLinkCopyFailed(!copied);
    setFilterLinkCopied(false);
    setFilterLinkCopyFailed(false);
    setReleaseGateCopied(false);
    setReleaseGateCopyFailed(false);
    setLearningManualCopy(
      copied
        ? null
        : {
            id: "feedback-improvement-low-confidence-link",
            title: "낮은 신뢰도 큐 링크",
            body: linkText,
          },
    );
  }

  function replaceLearningUrl({
    nextQuery = query,
    nextReviewFilter = reviewFilter,
    nextScope = scope,
    nextSortMode = sortMode,
  }: {
    nextQuery?: string;
    nextReviewFilter?: LearningReviewFilter;
    nextScope?: LearningScopeFilter;
    nextSortMode?: LearningSortMode;
  }) {
    setFilterLinkCopied(false);
    setFilterLinkCopyFailed(false);
    setFeedbackImprovementLowConfidenceLinkCopied(false);
    setFeedbackImprovementLowConfidenceLinkCopyFailed(false);
    setFilteredReportCopied(false);
    setFilteredReportCopyFailed(false);
    setReleaseGateCopied(false);
    setReleaseGateCopyFailed(false);
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
    router.replace(
      getLearningHref({
        query: nextQuery,
        reviewFilter: nextReviewFilter,
        scope: nextScope,
        sortMode: nextSortMode,
      }),
      { scroll: false },
    );
  }

  function updateScopeFilter(nextScope: LearningScopeFilter) {
    setScope(nextScope);
    setReadinessReportCopied(false);
    setReadinessReportCopyFailed(false);
    setLearningManualCopy(null);
    replaceLearningUrl({ nextScope });
  }

  function updateReviewFilter(nextReviewFilter: LearningReviewFilter) {
    setReviewFilter(nextReviewFilter);
    replaceLearningUrl({ nextReviewFilter });
  }

  function updateSortMode(nextSortMode: LearningSortMode) {
    setSortMode(nextSortMode);
    replaceLearningUrl({ nextSortMode });
  }

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    replaceLearningUrl({ nextQuery });
  }

  function applyReadinessShortcut({
    nextQuery = "",
    nextReviewFilter,
    nextSortMode,
  }: {
    nextQuery?: string;
    nextReviewFilter: LearningReviewFilter;
    nextSortMode: LearningSortMode;
  }) {
    setQuery(nextQuery);
    setReviewFilter(nextReviewFilter);
    setSortMode(nextSortMode);
    replaceLearningUrl({ nextQuery, nextReviewFilter, nextSortMode });
  }

  function resetLearningFilters() {
    setQuery("");
    setScope("all");
    setReviewFilter("all");
    setSortMode("confidence-desc");
    setReadinessReportCopied(false);
    setReadinessReportCopyFailed(false);
    setFilteredReportCopied(false);
    setFilteredReportCopyFailed(false);
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
    replaceLearningUrl({
      nextQuery: "",
      nextReviewFilter: "all",
      nextScope: "all",
      nextSortMode: "confidence-desc",
    });
  }

  function openMemoryInStudio(memory: LearningMemory) {
    const rawInput = buildMemoryStudioDraftInput(memory);
    const wroteDraft = writeStudioDraft({
      source: "learning-memory",
      rawInput,
      goal: "학습 메모리 기반 프롬프트 작성",
      domain: `${scopeLabels[memory.scope]} 학습 기준`,
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceMemoryId: memory.id,
      sourceTitle: memory.title,
      sourceHref: getLearningHref({
        query: memory.title,
        reviewFilter: "all",
        scope: memory.scope,
        sortMode: "confidence-desc",
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setCopiedMemoryId("");
      setFailedMemoryCopyId(memory.id);
      setLearningManualCopy({
        id: `memory:${memory.id}`,
        title: memory.title,
        body: rawInput,
        reason:
          "Studio 초안 저장이 차단되어 이동하지 않았습니다. 아래 원문을 복사해 Studio에 붙여넣으세요.",
      });
      return;
    }

    router.push("/studio?draft=learning-memory");
  }

  function openFilteredMemoriesInStudio() {
    if (filtered.length === 0) {
      return;
    }

    const studioDraftSource = feedbackImprovementFilterActive
      ? "learning-feedback-improvement"
      : "learning-filter";
    const studioDraftTitle = feedbackImprovementFilterActive
      ? `피드백 개선 메모리 큐 · ${filtered.length}개`
      : formatLearningFilterSourceTitle({
          count: filtered.length,
          query,
          reviewFilter,
          scope,
          sortMode,
        });
    const rawInput = feedbackImprovementFilterActive
      ? buildFeedbackImprovementQueueStudioDraftInput({
          filteredMemories: filtered,
          query,
          reviewFilter,
          scope,
          sortMode,
          totalMemories: memories.length,
        })
      : buildFilteredMemoriesStudioDraftInput({
          filteredMemories: filtered,
          query,
          reviewFilter,
          scope,
          sortMode,
          totalMemories: memories.length,
        });

    const wroteDraft = writeStudioDraft({
      source: studioDraftSource,
      rawInput,
      goal: feedbackImprovementFilterActive
        ? "피드백 개선 메모리 큐 기반 프롬프트 보강"
        : "학습 메모리 묶음 기반 프롬프트 작성",
      domain:
        feedbackImprovementFilterActive
          ? "Feedback improvement learning queue"
          : scope === "all"
          ? "복수 학습 기준"
          : `${scopeLabels[scope]} 학습 기준`,
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle: studioDraftTitle,
      sourceHref: getLearningHref({ query, reviewFilter, scope, sortMode }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setFilteredReportCopied(false);
      setFilteredReportCopyFailed(true);
      setLearningManualCopy({
        id: "filtered-report",
        title: studioDraftTitle,
        body: rawInput,
        reason:
          "Studio 초안 저장이 차단되어 이동하지 않았습니다. 아래 원문을 복사해 Studio에 붙여넣으세요.",
      });
      return;
    }

    router.push(
      feedbackImprovementFilterActive
        ? "/studio?draft=learning-feedback-improvement"
        : "/studio?draft=learning-filter",
    );
  }

  function openFeedbackImprovementLowConfidenceInStudio() {
    if (feedbackImprovementLowConfidenceMemories.length === 0) {
      return;
    }

    const rawInput = buildFeedbackImprovementLowConfidenceStudioDraftInput({
      filteredMemories: feedbackImprovementLowConfidenceMemories,
      scope,
      totalMemories: memories.length,
    });
    const wroteDraft = writeStudioDraft({
      source: "learning-feedback-improvement",
      sourceVariant: "learning-low-confidence-validation",
      rawInput,
      goal: "낮은 신뢰도 피드백 개선 메모리 보강",
      domain: "Feedback improvement low-confidence learning queue",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle: `피드백 개선 낮은 신뢰도 큐 · ${feedbackImprovementLowConfidenceMemories.length}개`,
      sourceHref: feedbackImprovementLowConfidenceHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setFeedbackImprovementLowConfidenceLinkCopied(false);
      setFeedbackImprovementLowConfidenceLinkCopyFailed(true);
      setLearningManualCopy({
        id: "feedback-improvement-low-confidence-studio",
        title: "피드백 개선 낮은 신뢰도 큐",
        body: rawInput,
        reason:
          "Studio 초안 저장이 차단되어 이동하지 않았습니다. 아래 원문을 복사해 Studio에 붙여넣으세요.",
      });
      return;
    }

    router.push("/studio?draft=learning-feedback-improvement");
  }

  function openReadinessReportInStudio() {
    const rawInput = buildLearningReadinessStudioDraftInput({
      baseUrl:
        typeof window === "undefined" ? undefined : window.location.origin,
      memories,
      readiness: learningReadiness,
    });
    const wroteDraft = writeStudioDraft({
      source: "learning-readiness",
      rawInput,
      goal: "학습 메모리 운영 보강 계획",
      domain: "Learning readiness",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Learning 준비도 리포트",
      sourceHref: learningReadinessHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setReadinessReportCopied(false);
      setReadinessReportCopyFailed(true);
      setLearningManualCopy({
        id: "readiness-report",
        title: "Learning 준비도 리포트",
        body: rawInput,
        reason:
          "Studio 초안 저장이 차단되어 이동하지 않았습니다. 아래 원문을 복사해 Studio에 붙여넣으세요.",
      });
      return;
    }

    router.push("/studio?draft=learning-readiness");
  }

  function saveManualMemory() {
    const title = manualTitle.trim();
    const content = manualContent.trim();

    if (!title || !content) {
      return;
    }

    const duplicate = findDuplicateMemory(memories, manualScope, content);

    if (duplicate) {
      setManualValidationMessage(
        `이미 같은 scope에 같은 내용의 메모리가 있습니다 · ${duplicate.title}`,
      );
      setManualSaved(false);
      return;
    }

    const now = new Date().toISOString();
    const tags = parseTags(manualTags);
    const nextMemory: LearningMemory = {
      id: makeId("memory_manual"),
      scope: manualScope,
      sourceType: "manual",
      sourceId: "learning-view",
      title,
      content,
      tags: tags.length ? tags : [manualScope],
      confidence: manualConfidence,
      createdAt: now,
      updatedAt: now,
    };

    setMemories((current) => [nextMemory, ...current]);
    setManualTitle("");
    setManualContent("");
    setManualTags("");
    setManualSaved(true);
    setManualValidationMessage("");
    setDeletedManualMemoryTitle("");
    setEditingMemoryId("");
    setEditValidationMessage("");
    setLearningManualCopy(null);
    updateScopeFilter(manualScope);
  }

  function startEditingManualMemory(memory: LearningMemory) {
    if (memory.sourceType !== "manual") {
      return;
    }

    setEditingMemoryId(memory.id);
    setEditScope(memory.scope);
    setEditTitle(memory.title);
    setEditContent(memory.content);
    setEditTags(memory.tags.join(", "));
    setEditConfidence(memory.confidence);
    setDeletedManualMemoryTitle("");
    setManualSaved(false);
    setManualValidationMessage("");
    setEditValidationMessage("");
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
  }

  function cancelEditingManualMemory() {
    setEditingMemoryId("");
    setEditTitle("");
    setEditContent("");
    setEditTags("");
    setEditValidationMessage("");
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
  }

  function saveEditedManualMemory(memoryId: string) {
    const title = editTitle.trim();
    const content = editContent.trim();

    if (!title || !content) {
      return;
    }

    const duplicate = findDuplicateMemory(memories, editScope, content, memoryId);

    if (duplicate) {
      setEditValidationMessage(
        `이미 같은 scope에 같은 내용의 메모리가 있습니다 · ${duplicate.title}`,
      );
      return;
    }

    const tags = parseTags(editTags);
    const now = new Date().toISOString();

    setMemories((current) =>
      current.map((memory) =>
        memory.id === memoryId && memory.sourceType === "manual"
          ? {
              ...memory,
              scope: editScope,
              title,
              content,
              tags: tags.length ? tags : [editScope],
              confidence: editConfidence,
              updatedAt: now,
            }
          : memory,
      ),
    );
    setEditingMemoryId("");
    setEditValidationMessage("");
    setDeletedManualMemoryTitle("");
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
    updateScopeFilter(editScope);
  }

  function deleteManualMemory(memory: LearningMemory) {
    if (memory.sourceType !== "manual") {
      return;
    }

    const confirmed = window.confirm(
      `"${memory.title}" 수동 메모리를 삭제할까요?`,
    );

    if (!confirmed) {
      return;
    }

    setMemories((current) => current.filter((item) => item.id !== memory.id));
    setDeletedManualMemoryTitle(memory.title);
    setEditingMemoryId("");
    setManualSaved(false);
    setManualValidationMessage("");
    setEditValidationMessage("");
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
  }

  return (
    <>
      <LearningReadinessPanel
        learningReadiness={learningReadiness}
        memories={memories}
        scopeCounts={scopeCounts}
        averageConfidence={averageConfidence}
        learningNextActionGuide={learningNextActionGuide}
        scope={scope}
        applyReadinessShortcut={applyReadinessShortcut}
        updateScopeFilter={updateScopeFilter}
        copyReadinessReport={copyReadinessReport}
        readinessReportCopied={readinessReportCopied}
        readinessReportCopyFailed={readinessReportCopyFailed}
        openReadinessReportInStudio={openReadinessReportInStudio}
        learningManualCopy={learningManualCopy}
        setLearningManualCopy={setLearningManualCopy}
      />

      <LearningFeedbackImprovementQueuePanel
        feedbackImprovementFilterActive={feedbackImprovementFilterActive}
        filtered={filtered}
        feedbackImprovementQueueLowConfidenceCount={
          feedbackImprovementQueueLowConfidenceCount
        }
        feedbackImprovementQueueScopeCount={feedbackImprovementQueueScopeCount}
        feedbackImprovementQueueWorkflowSteps={
          feedbackImprovementQueueWorkflowSteps
        }
        feedbackImprovementLowConfidenceHref={
          feedbackImprovementLowConfidenceHref
        }
        copyFeedbackImprovementLowConfidenceLink={
          copyFeedbackImprovementLowConfidenceLink
        }
        feedbackImprovementLowConfidenceLinkCopied={
          feedbackImprovementLowConfidenceLinkCopied
        }
        feedbackImprovementLowConfidenceLinkCopyFailed={
          feedbackImprovementLowConfidenceLinkCopyFailed
        }
        copyFilterLink={copyFilterLink}
        filterLinkCopied={filterLinkCopied}
        filterLinkCopyFailed={filterLinkCopyFailed}
        openFeedbackImprovementLowConfidenceInStudio={
          openFeedbackImprovementLowConfidenceInStudio
        }
        openFilteredMemoriesInStudio={openFilteredMemoriesInStudio}
        copyFilteredMemoryReport={copyFilteredMemoryReport}
        filteredReportCopied={filteredReportCopied}
        filteredReportCopyFailed={filteredReportCopyFailed}
        copyFeedbackImprovementReleaseGate={copyFeedbackImprovementReleaseGate}
        releaseGateCopied={releaseGateCopied}
        releaseGateCopyFailed={releaseGateCopyFailed}
        learningManualCopy={learningManualCopy}
        setLearningManualCopy={setLearningManualCopy}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <LearningFilterPanel
          scope={scope}
          updateScopeFilter={updateScopeFilter}
          scopeCounts={scopeCounts}
          reviewFilter={reviewFilter}
          updateReviewFilter={updateReviewFilter}
          reviewCounts={reviewCounts}
          sortMode={sortMode}
          updateSortMode={updateSortMode}
          query={query}
          updateQuery={updateQuery}
          filtered={filtered}
          copyFilterLink={copyFilterLink}
          filterLinkCopied={filterLinkCopied}
          filterLinkCopyFailed={filterLinkCopyFailed}
          copyFilteredMemoryReport={copyFilteredMemoryReport}
          filteredReportCopied={filteredReportCopied}
          filteredReportCopyFailed={filteredReportCopyFailed}
          openFilteredMemoriesInStudio={openFilteredMemoriesInStudio}
          hasActiveLearningFilters={hasActiveLearningFilters}
          resetLearningFilters={resetLearningFilters}
          feedbackImprovementFilterActive={feedbackImprovementFilterActive}
          learningManualCopy={learningManualCopy}
          setLearningManualCopy={setLearningManualCopy}
        />

        <LearningManualMemoryPanel
          manualMemoryWorkflowSteps={manualMemoryWorkflowSteps}
          manualScope={manualScope}
          setManualScope={setManualScope}
          setManualValidationMessage={setManualValidationMessage}
          setManualSaved={setManualSaved}
          manualTitle={manualTitle}
          setManualTitle={setManualTitle}
          manualContent={manualContent}
          setManualContent={setManualContent}
          manualTags={manualTags}
          setManualTags={setManualTags}
          manualConfidence={manualConfidence}
          setManualConfidence={setManualConfidence}
          saveManualMemory={saveManualMemory}
          manualSaved={manualSaved}
          manualValidationMessage={manualValidationMessage}
        />

        <LearningMemoryListPanel
          reviewFilter={reviewFilter}
          sortMode={sortMode}
          deletedManualMemoryTitle={deletedManualMemoryTitle}
          filtered={filtered}
          editingMemoryId={editingMemoryId}
          editScope={editScope}
          setEditScope={setEditScope}
          setEditValidationMessage={setEditValidationMessage}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editContent={editContent}
          setEditContent={setEditContent}
          editTags={editTags}
          setEditTags={setEditTags}
          editConfidence={editConfidence}
          setEditConfidence={setEditConfidence}
          editValidationMessage={editValidationMessage}
          saveEditedManualMemory={saveEditedManualMemory}
          cancelEditingManualMemory={cancelEditingManualMemory}
          copyMemoryReport={copyMemoryReport}
          copiedMemoryId={copiedMemoryId}
          failedMemoryCopyId={failedMemoryCopyId}
          openMemoryInStudio={openMemoryInStudio}
          startEditingManualMemory={startEditingManualMemory}
          deleteManualMemory={deleteManualMemory}
          learningManualCopy={learningManualCopy}
          setLearningManualCopy={setLearningManualCopy}
        />
      </div>
    </>
  );
}
