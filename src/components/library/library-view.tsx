"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PageHeader,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import { type HandoffPreviewMode } from "@/components/prompt/target-ai-handoff-preview-panel";
import {
  languageStrategies,
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  outputLanguages,
  targetModels,
  buildMissingContextQuestionsText,
  buildTargetAiHandoffImprovementBriefText,
  buildTargetAiHandoffPackageText,
  buildTargetAiHandoffReadinessItems,
  type Feedback,
  type PromptAsset,
  type PromptDeletedAsset,
  type PromptLanguageStrategy,
  type PromptOutputLanguage,
  type PromptStudioDraftSourceVariant,
  type TargetModel,
} from "@/lib/prompt";
import {
  createMemoryFromFeedback,
  mergeMemoryList,
} from "@/lib/learning/memory";
import {
  useDeletedPromptAssetsStore,
  useLearningMemoriesStore,
  usePromptAssetsStore,
} from "@/lib/data/workspace-store";
import { formatAbsoluteInternalHref } from "@/lib/navigation/href";
import { writeStudioDraft } from "@/lib/studio/draft";
import { useLoadSampleWorkspace } from "@/lib/samples/use-load-sample-workspace";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import { announce } from "@/lib/browser/announcer";
import {
  normalizeImportedPrompt,
  type ParsedPromptImport,
} from "@/lib/library/import";
import { PromptImportDialog } from "@/components/library/prompt-import-dialog";
import {
  formatPromptImprovementDepth,
  generationEngineLabels,
  generationEngines,
  getPromptStudioSourceMetaLibraryLabel,
  getPromptStudioSourcePersistenceMeta,
  getPromptStudioSourceRelationshipDescription,
  getPromptStudioSourceVariantLabel,
  getStudioSourceFilterLabel,
  getStudioSourceVariantFilterLabel,
  improvementFilterLabels,
  improvementFilterModes,
  learningScopeFilterLabels,
  learningScopeFilters,
  librarySortLabels,
  memoryScopeLabels,
  sourceReasonFilterLabels,
  sourceReasonFilterModes,
  studioPersistenceFilterDescriptions,
  studioPersistenceFilterLabels,
  studioPersistenceFilterModes,
  studioSourceFilterModes,
  studioSourceVariantFilterModes,
  summarizePromptStudioSourceVariantItems,
  type GenerationEngineFilter,
  type ImprovementFilter,
  type LanguageFilter,
  type LearningScopeFilter,
  type LibraryFocusTarget,
  type LibrarySortMode,
  type OutputLanguageFilter,
  type PromptDetailMode,
  type SourceReasonFilter,
  type StudioPersistenceFilter,
  type StudioSourceFilter,
  type StudioSourceVariantFilter,
  type TagFilter,
  type TargetModelFilter,
} from "@/lib/library/labels";
import {
  buildContextEditorHref,
  buildLibraryDefaultFilterHref,
  buildLibraryFilterHref,
  getPromptStudioPersistenceFilter,
  getPromptStudioSourceHref,
  type LibraryFilterHrefOptions,
} from "@/lib/library/hrefs";
import { buildPromptLibraryHref } from "@/lib/skills-view/hrefs";
import { duplicatePromptAsset } from "@/lib/library/duplicate";
import {
  getImprovementActions,
  getImprovementQualityDelta,
  getLanguageStrategy,
  getOutputLanguage,
  getPromptBestQuality,
  getPromptImprovementDelta,
  getPromptImprovementDepth,
  getPromptImprovementFilterMatch,
  getPromptImprovementLineage,
  getPromptSourceHealthIssueReason,
  getPromptTimestamp,
  getSourceVersion,
  getVersionFeedbackStats,
  hasArchivedSourcePrompt,
  isPromptReimprovementCandidate,
  makeId,
  buildImprovementScoreComparison,
  formatEnabledMemoryScopes,
  formatLearningContextCount,
  promptMatchesLearningScope,
} from "@/lib/library/prompt-metrics";
import {
  addTagToPrompt,
  collectAllTags,
  getPromptTags,
  promptHasTag,
  removeTagFromPrompt,
} from "@/lib/library/tags";
import {
  isPromptPinned,
  setPromptPinned,
  sortPinnedFirst,
} from "@/lib/library/pins";
import {
  buildImprovementBrief,
  buildLearningContextReportText,
  buildLearningContextStudioDraftText,
  buildPromptComparisonBrief,
} from "@/lib/library/report-text";
import {
  buildNoSourceMetaNote,
  buildSelectedOperationalSummaryReport,
  buildSourceReasonCandidateNote,
  buildSourceReasonFilterReport,
  buildStudioOperationalGroupReport,
  buildStudioPersistenceCandidateNote,
  buildStudioPersistenceFilterReport,
  buildStudioSourceCandidateNote,
  buildStudioSourceFilterReport,
  type SelectedOperationalSummary,
} from "@/lib/library/report-notes";
import type {
  ActiveFilterId,
  ActiveFilterItem,
  LibraryManualCopy,
} from "./library-view-types";
import { LibraryFiltersPanel } from "./library-filters-panel";
import { LibraryDetailWorkspace } from "./library-detail-workspace";

export function LibraryView({
  initialQuery,
  initialSortMode,
  initialPromptId,
  initialActiveModel,
  initialLanguageStrategy,
  initialOutputLanguage,
  initialTargetModel,
  initialImprovementFilter,
  initialSourceReasonFilter,
  initialStudioPersistenceFilter,
  initialStudioSourceFilter,
  initialStudioSourceVariantFilter,
  initialTagFilter,
  initialPromptDetailMode,
  initialGenerationEngine,
  initialLearningScope,
  initialCompanyUpdated = false,
  initialProfileUpdated = false,
  initialFocusTarget,
  initialFeedbackId,
}: {
  initialQuery?: string;
  initialSortMode?: LibrarySortMode;
  initialPromptId?: string;
  initialActiveModel?: TargetModel;
  initialLanguageStrategy?: PromptLanguageStrategy;
  initialOutputLanguage?: PromptOutputLanguage;
  initialTargetModel?: TargetModel;
  initialImprovementFilter?: Exclude<ImprovementFilter, "all">;
  initialSourceReasonFilter?: Exclude<SourceReasonFilter, "all">;
  initialStudioPersistenceFilter?: Exclude<StudioPersistenceFilter, "all">;
  initialStudioSourceFilter?: Exclude<StudioSourceFilter, "all">;
  initialStudioSourceVariantFilter?: Exclude<StudioSourceVariantFilter, "all">;
  initialTagFilter?: TagFilter;
  initialPromptDetailMode?: PromptDetailMode;
  initialGenerationEngine?: PromptAsset["source"];
  initialLearningScope?: Exclude<LearningScopeFilter, "all">;
  initialCompanyUpdated?: boolean;
  initialProfileUpdated?: boolean;
  initialFocusTarget?: LibraryFocusTarget;
  initialFeedbackId?: string;
}) {
  const router = useRouter();
  const [prompts, setPrompts] = usePromptAssetsStore();
  const [deletedPrompts, setDeletedPrompts] = useDeletedPromptAssetsStore();
  const [, setMemories] = useLearningMemoriesStore();
  const loadSampleWorkspace = useLoadSampleWorkspace();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [sortMode, setSortMode] = useState<LibrarySortMode>(
    initialSortMode ?? "recent",
  );
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>(
    initialLanguageStrategy ?? "all",
  );
  const [outputLanguageFilter, setOutputLanguageFilter] =
    useState<OutputLanguageFilter>(initialOutputLanguage ?? "all");
  const [targetModelFilter, setTargetModelFilter] =
    useState<TargetModelFilter>(initialTargetModel ?? "all");
  const [generationEngineFilter, setGenerationEngineFilter] =
    useState<GenerationEngineFilter>(initialGenerationEngine ?? "all");
  const [learningScopeFilter, setLearningScopeFilter] =
    useState<LearningScopeFilter>(initialLearningScope ?? "all");
  const [improvementFilter, setImprovementFilter] =
    useState<ImprovementFilter>(initialImprovementFilter ?? "all");
  const [sourceReasonFilter, setSourceReasonFilter] =
    useState<SourceReasonFilter>(initialSourceReasonFilter ?? "all");
  const [studioPersistenceFilter, setStudioPersistenceFilter] =
    useState<StudioPersistenceFilter>(initialStudioPersistenceFilter ?? "all");
  const [studioSourceFilter, setStudioSourceFilter] =
    useState<StudioSourceFilter>(initialStudioSourceFilter ?? "all");
  const [studioSourceVariantFilter, setStudioSourceVariantFilter] =
    useState<StudioSourceVariantFilter>(
      initialStudioSourceVariantFilter ?? "all",
    );
  const [tagFilter, setTagFilter] = useState<TagFilter>(
    initialTagFilter ?? "all",
  );
  const [newTagInput, setNewTagInput] = useState("");
  const [selectedId, setSelectedId] = useState<string>(initialPromptId ?? "");
  const [activeModel, setActiveModel] = useState<TargetModel>(
    initialActiveModel ?? initialTargetModel ?? "gpt",
  );
  const [rating, setRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState<Feedback["feedbackType"]>("format");
  const [comment, setComment] = useState("");
  const [latestFeedbackId, setLatestFeedbackId] = useState("");
  const [copied, setCopied] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [targetAiPackageCopiedKey, setTargetAiPackageCopiedKey] =
    useState("");
  const [
    targetAiImprovementBriefCopiedKey,
    setTargetAiImprovementBriefCopiedKey,
  ] = useState("");
  const [targetAiPackagePreviewOpen, setTargetAiPackagePreviewOpen] =
    useState(false);
  const [targetAiPackagePreviewMode, setTargetAiPackagePreviewMode] =
    useState<HandoffPreviewMode>("package");
  const [filterLinkCopied, setFilterLinkCopied] = useState(false);
  const [detailLinkCopied, setDetailLinkCopied] = useState(false);
  const [improvementBriefCopied, setImprovementBriefCopied] = useState(false);
  const [comparisonBriefCopied, setComparisonBriefCopied] = useState(false);
  const [sourceHealthReportCopied, setSourceHealthReportCopied] =
    useState(false);
  const [sourceHealthCandidateCopiedId, setSourceHealthCandidateCopiedId] =
    useState("");
  const [
    sourceHealthCandidateLinkCopiedId,
    setSourceHealthCandidateLinkCopiedId,
  ] = useState("");
  const [studioPersistenceReportCopied, setStudioPersistenceReportCopied] =
    useState(false);
  const [
    studioPersistenceCandidateCopiedId,
    setStudioPersistenceCandidateCopiedId,
  ] = useState("");
  const [studioSourceReportCopied, setStudioSourceReportCopied] =
    useState(false);
  const [
    studioOperationalGroupReportCopied,
    setStudioOperationalGroupReportCopied,
  ] = useState(false);
  const [studioSourceCandidateCopiedId, setStudioSourceCandidateCopiedId] =
    useState("");
  const [contextQuestionsCopied, setContextQuestionsCopied] = useState(false);
  const [learningContextReportCopiedFor, setLearningContextReportCopiedFor] =
    useState("");
  const [noSourceMetaNoteCopiedFor, setNoSourceMetaNoteCopiedFor] =
    useState("");
  const [
    selectedStudioSourceLinkCopiedFor,
    setSelectedStudioSourceLinkCopiedFor,
  ] = useState("");
  const [
    selectedStudioSourceOriginalLinkCopiedFor,
    setSelectedStudioSourceOriginalLinkCopiedFor,
  ] = useState("");
  const [
    selectedStudioPersistenceLinkCopiedFor,
    setSelectedStudioPersistenceLinkCopiedFor,
  ] = useState("");
  const [
    selectedOperationalGroupLinkCopiedFor,
    setSelectedOperationalGroupLinkCopiedFor,
  ] = useState("");
  const [
    selectedOperationalSourceLinkCopiedFor,
    setSelectedOperationalSourceLinkCopiedFor,
  ] = useState("");
  const [
    selectedOperationalPersistenceLinkCopiedFor,
    setSelectedOperationalPersistenceLinkCopiedFor,
  ] = useState("");
  const [listStudioSourceLinkCopiedFor, setListStudioSourceLinkCopiedFor] =
    useState("");
  const [
    listStudioSourceOriginalLinkCopiedFor,
    setListStudioSourceOriginalLinkCopiedFor,
  ] = useState("");
  const [
    listStudioPersistenceLinkCopiedFor,
    setListStudioPersistenceLinkCopiedFor,
  ] = useState("");
  const [
    listStudioOperationalGroupLinkCopiedFor,
    setListStudioOperationalGroupLinkCopiedFor,
  ] = useState("");
  const [studioVariantLinkCopiedFor, setStudioVariantLinkCopiedFor] =
    useState("");
  const [
    selectedOperationalSummaryReportCopiedFor,
    setSelectedOperationalSummaryReportCopiedFor,
  ] = useState("");
  const [contextQuestionsCopyFailed, setContextQuestionsCopyFailed] =
    useState(false);
  const [manualCopy, setManualCopy] = useState<LibraryManualCopy | null>(null);
  const [deletedPromptTitle, setDeletedPromptTitle] = useState("");
  const [deletedPromptRecoveryId, setDeletedPromptRecoveryId] = useState("");
  const [deletedPromptArchiveExpanded, setDeletedPromptArchiveExpanded] =
    useState(false);
  const [deletedPromptArchiveQuery, setDeletedPromptArchiveQuery] = useState("");
  const [deletePromptCandidate, setDeletePromptCandidate] =
    useState<PromptAsset | null>(null);
  const [deletedPromptRemoveCandidate, setDeletedPromptRemoveCandidate] =
    useState<PromptDeletedAsset | null>(null);
  const [companyUpdateNoticeVisible, setCompanyUpdateNoticeVisible] =
    useState(initialCompanyUpdated);
  const [profileUpdateNoticeVisible, setProfileUpdateNoticeVisible] =
    useState(initialProfileUpdated);
  const [promptDetailMode, setPromptDetailMode] =
    useState<PromptDetailMode>(initialPromptDetailMode ?? "current");
  const [highlightedFeedbackId, setHighlightedFeedbackId] = useState(
    initialFeedbackId ?? "",
  );
  const improvementFilterCounts = useMemo(
    () =>
      improvementFilterModes.reduce(
        (counts, mode) => ({
          ...counts,
          [mode]:
            mode === "all"
              ? prompts.length
              : prompts.filter((prompt) =>
                  getPromptImprovementFilterMatch(
                    prompt,
                    prompts,
                    deletedPrompts,
                    mode,
                  ),
                ).length,
        }),
        {} as Record<ImprovementFilter, number>,
      ),
    [deletedPrompts, prompts],
  );
  const sourceReasonFilterCounts = useMemo(
    () =>
      sourceReasonFilterModes.reduce(
        (counts, mode) => ({
          ...counts,
          [mode]:
            mode === "all"
              ? prompts.filter((prompt) =>
                  Boolean(prompt.improvementSource),
                ).length
              : prompts.filter(
                  (prompt) =>
                    getPromptSourceHealthIssueReason(
                      prompt,
                      prompts,
                      deletedPrompts,
                    ) === mode,
                ).length,
        }),
        {} as Record<SourceReasonFilter, number>,
      ),
    [deletedPrompts, prompts],
  );
  const studioPersistenceFilterCounts = useMemo(
    () =>
      studioPersistenceFilterModes.reduce(
        (counts, mode) => ({
          ...counts,
          [mode]:
            mode === "all"
              ? prompts.length
              : prompts.filter(
                  (prompt) => getPromptStudioPersistenceFilter(prompt) === mode,
                ).length,
        }),
        {} as Record<StudioPersistenceFilter, number>,
      ),
    [prompts],
  );
  const studioSourceFilterCounts = useMemo(
    () =>
      studioSourceFilterModes.reduce(
        (counts, mode) => ({
          ...counts,
          [mode]:
            mode === "all"
              ? prompts.filter((prompt) => prompt.studioSource).length
              : prompts.filter(
                  (prompt) => prompt.studioSource?.source === mode,
                ).length,
        }),
        {} as Record<StudioSourceFilter, number>,
      ),
    [prompts],
  );
  const studioSourceVariantFilterCounts = useMemo(
    () =>
      studioSourceVariantFilterModes.reduce(
        (counts, mode) => ({
          ...counts,
          [mode]:
            mode === "all"
              ? prompts.filter((prompt) => prompt.studioSource?.sourceVariant)
                  .length
              : prompts.filter(
                  (prompt) => prompt.studioSource?.sourceVariant === mode,
                ).length,
        }),
        {} as Record<StudioSourceVariantFilter, number>,
      ),
    [prompts],
  );
  const languageFilterCounts = useMemo(
    () =>
      languageStrategies.reduce(
        (counts, strategy) => ({
          ...counts,
          [strategy]: prompts.filter(
            (prompt) => getLanguageStrategy(prompt) === strategy,
          ).length,
        }),
        { all: prompts.length } as Record<LanguageFilter, number>,
      ),
    [prompts],
  );
  const outputLanguageFilterCounts = useMemo(
    () =>
      outputLanguages.reduce(
        (counts, outputLanguage) => ({
          ...counts,
          [outputLanguage]: prompts.filter(
            (prompt) => getOutputLanguage(prompt) === outputLanguage,
          ).length,
        }),
        { all: prompts.length } as Record<OutputLanguageFilter, number>,
      ),
    [prompts],
  );
  const targetModelFilterCounts = useMemo(
    () =>
      targetModels.reduce(
        (counts, targetModel) => ({
          ...counts,
          [targetModel]: prompts.filter((prompt) =>
            prompt.versions.some((version) => version.targetModel === targetModel),
          ).length,
        }),
        { all: prompts.length } as Record<TargetModelFilter, number>,
      ),
    [prompts],
  );
  const generationEngineFilterCounts = useMemo(
    () =>
      generationEngines.reduce(
        (counts, engine) => ({
          ...counts,
          [engine]: prompts.filter((prompt) => prompt.source === engine).length,
        }),
        { all: prompts.length } as Record<GenerationEngineFilter, number>,
      ),
    [prompts],
  );
  const learningScopeFilterCounts = useMemo(
    () =>
      learningScopeFilters.reduce(
        (counts, filter) => ({
          ...counts,
          [filter]: prompts.filter((prompt) =>
            promptMatchesLearningScope(prompt, filter),
          ).length,
        }),
        { all: prompts.length } as Record<LearningScopeFilter, number>,
      ),
    [prompts],
  );
  const activeFilterItems = useMemo<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];
    const trimmedQuery = query.trim();

    if (languageFilter !== "all") {
      items.push({
        id: "language",
        label: `언어 전략 ${languageStrategyLabels[languageFilter]}`,
        removeLabel: "언어 전략 필터 해제",
      });
    }

    if (outputLanguageFilter !== "all") {
      items.push({
        id: "output",
        label: `답변 ${outputLanguageLabels[outputLanguageFilter]}`,
        removeLabel: "답변 언어 필터 해제",
      });
    }

    if (targetModelFilter !== "all") {
      items.push({
        id: "model",
        label: `대상 ${modelLabels[targetModelFilter]}`,
        removeLabel: "대상 AI 도구 필터 해제",
      });
    }

    if (generationEngineFilter !== "all") {
      items.push({
        id: "engine",
        label: `엔진 ${generationEngineLabels[generationEngineFilter]}`,
        removeLabel: "생성 엔진 필터 해제",
      });
    }

    if (learningScopeFilter !== "all") {
      items.push({
        id: "learning",
        label: `학습 ${learningScopeFilterLabels[learningScopeFilter]}`,
        removeLabel: "학습 scope 필터 해제",
      });
    }

    if (improvementFilter !== "all") {
      items.push({
        id: "improvement",
        label: `개선 ${improvementFilterLabels[improvementFilter]}`,
        removeLabel: "개선 상태 필터 해제",
      });
    }

    if (sourceReasonFilter !== "all") {
      items.push({
        id: "source-reason",
        label: `출처 사유 ${sourceReasonFilterLabels[sourceReasonFilter]}`,
        removeLabel: "출처 사유 필터 해제",
      });
    }

    if (studioPersistenceFilter !== "all") {
      items.push({
        id: "studio-persistence",
        label: `저장 방식 ${studioPersistenceFilterLabels[studioPersistenceFilter]}`,
        removeLabel: "Studio 저장 방식 필터 해제",
      });
    }

    if (studioSourceFilter !== "all") {
      items.push({
        id: "studio-source",
        label: `Studio 저장 출처 ${getStudioSourceFilterLabel(studioSourceFilter)}`,
        removeLabel: "Studio 저장 출처 필터 해제",
      });
    }

    if (studioSourceVariantFilter !== "all") {
      items.push({
        id: "studio-variant",
        label: `세부 초안 유형 ${getStudioSourceVariantFilterLabel(
          studioSourceVariantFilter,
        )}`,
        removeLabel: "세부 초안 유형 필터 해제",
      });
    }

    if (tagFilter !== "all") {
      items.push({
        id: "tag",
        label: `태그 ${tagFilter}`,
        removeLabel: "태그 필터 해제",
      });
    }

    if (trimmedQuery) {
      items.push({
        id: "query",
        label: `검색 ${trimmedQuery}`,
        removeLabel: "검색어 해제",
      });
    }

    if (sortMode !== "recent") {
      items.push({
        id: "sort",
        label: `정렬 ${librarySortLabels[sortMode]}`,
        removeLabel: "정렬 기준 해제",
      });
    }

    return items;
  }, [
    generationEngineFilter,
    improvementFilter,
    languageFilter,
    learningScopeFilter,
    outputLanguageFilter,
    query,
    sourceReasonFilter,
    studioSourceFilter,
    studioSourceVariantFilter,
    studioPersistenceFilter,
    sortMode,
    tagFilter,
    targetModelFilter,
  ]);
  const hasActiveFilters = activeFilterItems.length > 0;
  const buildCurrentLibraryHref = useCallback(
    (overrides: Partial<LibraryFilterHrefOptions> = {}) =>
      buildLibraryFilterHref({
        search: query,
        sort: sortMode,
        language: languageFilter,
        output: outputLanguageFilter,
        model: targetModelFilter,
        engine: generationEngineFilter,
        learning: learningScopeFilter,
        improvement: improvementFilter,
        sourceReason: sourceReasonFilter,
        studioPersistence: studioPersistenceFilter,
        studioSource: studioSourceFilter,
        studioVariant: studioSourceVariantFilter,
        tag: tagFilter,
        promptId: selectedId,
        version: activeModel,
        detailMode: promptDetailMode,
        ...overrides,
      }),
    [
      activeModel,
      generationEngineFilter,
      improvementFilter,
      languageFilter,
      learningScopeFilter,
      outputLanguageFilter,
      promptDetailMode,
      query,
      selectedId,
      sortMode,
      sourceReasonFilter,
      studioPersistenceFilter,
      studioSourceFilter,
      studioSourceVariantFilter,
      tagFilter,
      targetModelFilter,
    ],
  );

  function syncFilterUrl({
    search = query,
    sort = sortMode,
    language = languageFilter,
    output = outputLanguageFilter,
    model = targetModelFilter,
    engine = generationEngineFilter,
    learning = learningScopeFilter,
    improvement = improvementFilter,
    sourceReason = sourceReasonFilter,
    studioPersistence = studioPersistenceFilter,
    studioSource = studioSourceFilter,
    studioVariant = studioSourceVariantFilter,
    tag = tagFilter,
    promptId = selectedId,
    version = activeModel,
    detailMode = promptDetailMode,
    route = true,
  }: {
    search?: string;
    sort?: LibrarySortMode;
    language?: LanguageFilter;
    output?: OutputLanguageFilter;
    model?: TargetModelFilter;
    engine?: GenerationEngineFilter;
    learning?: LearningScopeFilter;
    improvement?: ImprovementFilter;
    sourceReason?: SourceReasonFilter;
    studioPersistence?: StudioPersistenceFilter;
    studioSource?: StudioSourceFilter;
    studioVariant?: StudioSourceVariantFilter;
    tag?: TagFilter;
    promptId?: string;
    version?: TargetModel;
    detailMode?: PromptDetailMode;
    route?: boolean;
  }) {
    const href = buildLibraryFilterHref({
      search,
      sort,
      language,
      output,
      model,
      engine,
      learning,
      improvement,
      sourceReason,
      studioPersistence,
      studioSource,
      studioVariant,
      tag,
      promptId,
      version,
      detailMode,
    });

    if (route) {
      router.replace(href, { scroll: false });
      return;
    }

    window.history.replaceState(null, "", href);
  }

  function clearCompanyUpdateNotice() {
    setCompanyUpdateNoticeVisible(false);
    syncFilterUrl({ route: false });
  }

  function clearProfileUpdateNotice() {
    setProfileUpdateNoticeVisible(false);
    syncFilterUrl({ route: false });
  }

  function resetFilters() {
    setQuery("");
    setSortMode("recent");
    setLanguageFilter("all");
    setOutputLanguageFilter("all");
    setTargetModelFilter("all");
    setGenerationEngineFilter("all");
    setLearningScopeFilter("all");
    setImprovementFilter("all");
    setSourceReasonFilter("all");
    setStudioPersistenceFilter("all");
    setStudioSourceFilter("all");
    setStudioSourceVariantFilter("all");
    setTagFilter("all");
    setNewTagInput("");
    setSelectedId("");
    setActiveModel("gpt");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setContextQuestionsCopyFailed(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    router.replace("/library", { scroll: false });
  }

  function handleTagFilterChange(nextTagFilter: TagFilter) {
    setTagFilter(nextTagFilter);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      tag: nextTagFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      search: nextQuery,
      promptId: "",
      version: undefined,
      detailMode: "current",
      route: false,
    });
  }

  function handleSortChange(nextSortMode: LibrarySortMode) {
    setSortMode(nextSortMode);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      sort: nextSortMode,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function handleImprovementFilterChange(
    nextImprovementFilter: ImprovementFilter,
  ) {
    setImprovementFilter(nextImprovementFilter);
    setSourceReasonFilter("all");
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      improvement: nextImprovementFilter,
      sourceReason: "all",
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function handleSourceReasonFilterChange(nextSourceReasonFilter: SourceReasonFilter) {
    const nextImprovementFilter =
      nextSourceReasonFilter === "all"
        ? improvementFilter
        : nextSourceReasonFilter === "archived-source"
          ? "archived-source"
          : "unmeasured";

    setSourceReasonFilter(nextSourceReasonFilter);
    setImprovementFilter(nextImprovementFilter);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      improvement: nextImprovementFilter,
      sourceReason: nextSourceReasonFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function handleStudioPersistenceFilterChange(
    nextStudioPersistenceFilter: StudioPersistenceFilter,
  ) {
    setStudioPersistenceFilter(nextStudioPersistenceFilter);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      studioPersistence: nextStudioPersistenceFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function handleStudioSourceFilterChange(
    nextStudioSourceFilter: StudioSourceFilter,
  ) {
    setStudioSourceFilter(nextStudioSourceFilter);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      studioSource: nextStudioSourceFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function handleStudioSourceVariantFilterChange(
    nextStudioSourceVariantFilter: StudioSourceVariantFilter,
  ) {
    setStudioSourceVariantFilter(nextStudioSourceVariantFilter);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      studioVariant: nextStudioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function removeFilterItem(filterId: ActiveFilterId) {
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");

    if (filterId === "query") {
      setQuery("");
      syncFilterUrl({
        search: "",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "language") {
      setLanguageFilter("all");
      syncFilterUrl({
        language: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "output") {
      setOutputLanguageFilter("all");
      syncFilterUrl({
        output: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "sort") {
      setSortMode("recent");
      syncFilterUrl({
        sort: "recent",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "improvement") {
      setImprovementFilter("all");
      setSourceReasonFilter("all");
      syncFilterUrl({
        improvement: "all",
        sourceReason: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "source-reason") {
      setSourceReasonFilter("all");
      syncFilterUrl({
        sourceReason: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "studio-persistence") {
      setStudioPersistenceFilter("all");
      syncFilterUrl({
        studioPersistence: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "studio-source") {
      setStudioSourceFilter("all");
      syncFilterUrl({
        studioSource: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "studio-variant") {
      setStudioSourceVariantFilter("all");
      syncFilterUrl({
        studioVariant: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "tag") {
      setTagFilter("all");
      syncFilterUrl({
        tag: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "engine") {
      setGenerationEngineFilter("all");
      syncFilterUrl({
        engine: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "learning") {
      setLearningScopeFilter("all");
      syncFilterUrl({
        learning: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    setTargetModelFilter("all");
    setActiveModel("gpt");
    syncFilterUrl({
      model: "all",
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function renderFilterChip(item: ActiveFilterItem) {
    return (
      <span
        key={item.id}
        className="inline-flex max-w-full items-center gap-1 rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
      >
        <span className="min-w-0 break-words">{item.label}</span>
        <button
          type="button"
          className="-mr-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted transition hover:bg-surface hover:text-foreground"
          aria-label={item.removeLabel}
          title={item.removeLabel}
          onClick={() => removeFilterItem(item.id)}
        >
          <span aria-hidden="true">×</span>
        </button>
      </span>
    );
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matches = prompts.filter((prompt) => {
      const matchesLanguage =
        languageFilter === "all" || getLanguageStrategy(prompt) === languageFilter;
      const matchesOutputLanguage =
        outputLanguageFilter === "all" ||
        getOutputLanguage(prompt) === outputLanguageFilter;
      const matchesTargetModel =
        targetModelFilter === "all" ||
        prompt.versions.some(
          (version) => version.targetModel === targetModelFilter,
        );
      const matchesGenerationEngine =
        generationEngineFilter === "all" ||
        prompt.source === generationEngineFilter;
      const matchesLearningScope = promptMatchesLearningScope(
        prompt,
        learningScopeFilter,
      );
      const matchesImprovement =
        improvementFilter === "all" ||
        getPromptImprovementFilterMatch(
          prompt,
          prompts,
          deletedPrompts,
          improvementFilter,
        );
      const matchesSourceReason =
        sourceReasonFilter === "all" ||
        getPromptSourceHealthIssueReason(prompt, prompts, deletedPrompts) ===
          sourceReasonFilter;
      const matchesStudioPersistence =
        studioPersistenceFilter === "all" ||
        getPromptStudioPersistenceFilter(prompt) === studioPersistenceFilter;
      const matchesStudioSource =
        studioSourceFilter === "all" ||
        prompt.studioSource?.source === studioSourceFilter;
      const matchesStudioSourceVariant =
        studioSourceVariantFilter === "all" ||
        prompt.studioSource?.sourceVariant === studioSourceVariantFilter;
      const matchesTag =
        tagFilter === "all" || promptHasTag(prompt, tagFilter);
      const matchesQuery =
        !needle ||
        [
          prompt.title,
          prompt.rawInput,
          prompt.goal,
          prompt.domain,
          getPromptTags(prompt).join(" "),
          languageStrategyLabels[getLanguageStrategy(prompt)],
          prompt.languageDecision?.reason,
          prompt.languageDecision?.signals?.join(" "),
          prompt.targetModelDecision?.reason,
          prompt.targetModelDecision?.signals?.join(" "),
          prompt.targetModelDecision?.targetModels?.join(" "),
          prompt.targetModels.join(" "),
          generationEngineLabels[prompt.source],
          prompt.modelUsed,
          prompt.improvementSource?.sourcePromptTitle,
          prompt.improvementSource?.sourceVersionModel,
          prompt.studioSource?.sourceTitle,
          prompt.studioSource?.sourceHref,
          prompt.studioSource
            ? getPromptStudioSourceMetaLibraryLabel(prompt.studioSource).label
            : undefined,
          prompt.studioSource?.sourceVariant
            ? getStudioSourceVariantFilterLabel(
                prompt.studioSource.sourceVariant,
              )
            : undefined,
          prompt.studioSource
            ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
                .label
            : undefined,
          prompt.learningContext?.appliedMemoryTitles.join(" "),
          prompt.learningContext?.appliedMemoryScopes
            .map((scope) => memoryScopeLabels[scope])
            .join(" "),
          formatEnabledMemoryScopes(prompt),
          prompt.improvementSource
            ? `${formatPromptImprovementDepth(
                getPromptImprovementDepth(prompt, prompts, deletedPrompts),
              )} 재개선 개선 효과 품질 변화 ${
                isPromptReimprovementCandidate(prompt, prompts, deletedPrompts)
                  ? "재개선 후보"
                  : ""
              } ${
                hasArchivedSourcePrompt(prompt, prompts, deletedPrompts)
                  ? "삭제 보관함 보관함 원본"
                  : ""
              }`
            : undefined,
          prompt.versions.map((version) => modelLabels[version.targetModel]).join(" "),
          outputLanguageLabels[getOutputLanguage(prompt)],
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      return (
        matchesLanguage &&
        matchesOutputLanguage &&
        matchesTargetModel &&
        matchesGenerationEngine &&
        matchesLearningScope &&
        matchesImprovement &&
        matchesSourceReason &&
        matchesStudioPersistence &&
        matchesStudioSource &&
        matchesStudioSourceVariant &&
        matchesTag &&
        matchesQuery
      );
    });

    const sorted = matches.sort((left, right) => {
      if (sortMode === "quality") {
        return (
          getPromptBestQuality(right) - getPromptBestQuality(left) ||
          getPromptTimestamp(right) - getPromptTimestamp(left)
        );
      }

      if (sortMode === "feedback") {
        return (
          right.feedback.length - left.feedback.length ||
          getPromptTimestamp(right) - getPromptTimestamp(left)
        );
      }

      if (sortMode === "improvement") {
        const leftDelta = getPromptImprovementDelta(
          left,
          prompts,
          deletedPrompts,
        );
        const rightDelta = getPromptImprovementDelta(
          right,
          prompts,
          deletedPrompts,
        );
        const leftHasDelta = leftDelta !== undefined;
        const rightHasDelta = rightDelta !== undefined;

        if (leftHasDelta && rightHasDelta) {
          return (
            rightDelta - leftDelta ||
            getPromptTimestamp(right) - getPromptTimestamp(left)
          );
        }

        if (leftHasDelta !== rightHasDelta) {
          return rightHasDelta ? 1 : -1;
        }

        return getPromptTimestamp(right) - getPromptTimestamp(left);
      }

      return getPromptTimestamp(right) - getPromptTimestamp(left);
    });

    return sortPinnedFirst(sorted);
  }, [
    languageFilter,
    learningScopeFilter,
    generationEngineFilter,
    deletedPrompts,
    improvementFilter,
    outputLanguageFilter,
    prompts,
    query,
    sourceReasonFilter,
    sortMode,
    studioPersistenceFilter,
    studioSourceFilter,
    studioSourceVariantFilter,
    tagFilter,
    targetModelFilter,
  ]);
  const sourceReasonActionCandidates = useMemo(() => {
    if (sourceReasonFilter === "all") {
      return [];
    }

    return filtered.slice(0, 3).map((prompt) => {
      const sourcePromptId = prompt.improvementSource?.sourcePromptId;
      const activeSource = prompts.find((item) => item.id === sourcePromptId);
      const deletedSource = deletedPrompts.find(
        (item) => item.prompt.id === sourcePromptId,
      );
      const sourceStatus = activeSource
        ? "활성 원본"
        : deletedSource
          ? "삭제 보관함"
          : "원본 없음";
      const sourceStatusDetail = activeSource
        ? "활성 Library 원본"
        : deletedSource
          ? `삭제 보관함 원본 (${new Date(
              deletedSource.deletedAt,
            ).toLocaleString("ko-KR")})`
          : "원본 없음";
      const sourcePrompt = activeSource ?? deletedSource?.prompt;
      const sourceVersion = getSourceVersion(prompt, sourcePrompt);
      const detailHref = buildCurrentLibraryHref({
        promptId: prompt.id,
        version: prompt.versions[0]?.targetModel,
        detailMode: "current",
      });

      return {
        detailHref,
        id: prompt.id,
        note: buildSourceReasonCandidateNote({
          baseUrl: typeof window === "undefined" ? "" : window.location.origin,
          detailHref,
          prompt,
          reason: sourceReasonFilter,
          sourceStatus: sourceStatusDetail,
          sourceVersion,
        }),
        prompt,
        sourceStatus,
        sourceTitle: prompt.improvementSource?.sourcePromptTitle ?? "원본 없음",
        title: prompt.title,
      };
    });
  }, [
    buildCurrentLibraryHref,
    deletedPrompts,
    filtered,
    prompts,
    sourceReasonFilter,
  ]);
  const studioPersistenceActionCandidates = useMemo(() => {
    if (studioPersistenceFilter === "all") {
      return [];
    }

    return filtered.slice(0, 3).map((prompt) => {
      const sourceMeta = prompt.studioSource
        ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
        : undefined;
      const sourceDescription =
        sourceMeta?.description ?? studioPersistenceFilterDescriptions.none;
      const sourceLabel = sourceMeta?.label ?? "Studio 출처 없음";
      const sourceTitle =
        prompt.studioSource?.sourceTitle ?? "저장 출처 메타 없음";
      const sourceVariantLabel = getPromptStudioSourceVariantLabel(
        prompt.studioSource,
      );
      const detailHref = buildCurrentLibraryHref({
        promptId: prompt.id,
        version: prompt.versions[0]?.targetModel,
        detailMode: "current",
      });

      return {
        detailHref,
        id: prompt.id,
        note: buildStudioPersistenceCandidateNote({
          baseUrl: typeof window === "undefined" ? "" : window.location.origin,
          detailHref,
          filter: studioPersistenceFilter,
          prompt,
          sourceDescription,
          sourceLabel,
          sourceTitle,
        }),
        prompt,
        sourceDescription,
        sourceLabel,
        sourceTitle,
        sourceVariantLabel,
        title: prompt.title,
      };
    });
  }, [
    buildCurrentLibraryHref,
    filtered,
    studioPersistenceFilter,
  ]);
  const studioSourceActionCandidates = useMemo(() => {
    if (studioSourceFilter === "all") {
      return [];
    }

    return filtered.slice(0, 3).map((prompt) => {
      const sourceLabel = prompt.studioSource
        ? getPromptStudioSourceMetaLibraryLabel(prompt.studioSource).label
        : "Studio 출처 없음";
      const sourceTitle = prompt.studioSource?.sourceTitle ?? "출처 제목 없음";
      const sourceVariantLabel = getPromptStudioSourceVariantLabel(
        prompt.studioSource,
      );
      const detailHref = buildCurrentLibraryHref({
        promptId: prompt.id,
        version: prompt.versions[0]?.targetModel,
        detailMode: "current",
      });

      return {
        detailHref,
        id: prompt.id,
        note: buildStudioSourceCandidateNote({
          baseUrl: typeof window === "undefined" ? "" : window.location.origin,
          detailHref,
          filter: studioSourceFilter,
          prompt,
          sourceLabel,
          sourceTitle,
        }),
        prompt,
        sourceLabel,
        sourceTitle,
        sourceVariantLabel,
        title: prompt.title,
      };
    });
  }, [
    buildCurrentLibraryHref,
    filtered,
    studioSourceFilter,
  ]);
  const studioSourceVariantSummaryLinks = useMemo(
    () =>
      studioSourceFilter === "all"
        ? []
        : summarizePromptStudioSourceVariantItems(filtered).map((item) => ({
            ...item,
            href: buildCurrentLibraryHref({
              studioVariant: item.sourceVariant,
              promptId: "",
              version: undefined,
              detailMode: "current",
            }),
          })),
    [
      buildCurrentLibraryHref,
      filtered,
      studioSourceFilter,
    ],
  );
  const studioPersistenceVariantSummaryLinks = useMemo(
    () =>
      studioPersistenceFilter === "all"
        ? []
        : summarizePromptStudioSourceVariantItems(filtered).map((item) => ({
            ...item,
            href: buildCurrentLibraryHref({
              studioVariant: item.sourceVariant,
              promptId: "",
              version: undefined,
              detailMode: "current",
            }),
          })),
    [
      buildCurrentLibraryHref,
      filtered,
      studioPersistenceFilter,
    ],
  );

  const allTags = useMemo(() => collectAllTags(prompts), [prompts]);

  const selected = useMemo(() => {
    const fallback = filtered[0];
    return filtered.find((prompt) => prompt.id === selectedId) ?? fallback;
  }, [filtered, selectedId]);

  const activeVersion =
    selected?.versions.find((version) => version.targetModel === activeModel) ??
    selected?.versions[0];
  const activeTargetAiPackageCopyKey =
    selected && activeVersion ? `${selected.id}:${activeVersion.id}` : "";
  const activeTargetAiHandoffPackageText = useMemo(
    () =>
      selected && activeVersion
        ? buildTargetAiHandoffPackageText({
            prompt: selected,
            version: activeVersion,
          })
        : "",
    [activeVersion, selected],
  );
  const activeTargetAiHandoffImprovementBriefText = useMemo(
    () =>
      selected && activeVersion
        ? buildTargetAiHandoffImprovementBriefText({
            prompt: selected,
            version: activeVersion,
          })
        : "",
    [activeVersion, selected],
  );
  const activeTargetAiHandoffReadinessItems = useMemo(
    () =>
      activeVersion
        ? buildTargetAiHandoffReadinessItems({ version: activeVersion })
        : [],
    [activeVersion],
  );
  const selectedStudioSource = selected?.studioSource;
  const selectedStudioSourceHasVariant = Boolean(
    selectedStudioSource?.sourceVariant,
  );
  const selectedStudioSourceLabel = selectedStudioSource
    ? getPromptStudioSourceMetaLibraryLabel(selectedStudioSource)
    : undefined;
  const selectedStudioSourceLinkCopyLabel = selectedStudioSourceHasVariant
    ? "세부 유형 링크 복사"
    : "출처 링크 복사";
  const selectedStudioSourceLinkCopiedLabel = selectedStudioSourceHasVariant
    ? "세부 유형 링크 복사됨"
    : "출처 링크 복사됨";
  const selectedStudioSourceLinkFailedLabel = selectedStudioSourceHasVariant
    ? "세부 유형 링크 복사 실패"
    : "출처 링크 복사 실패";
  const selectedStudioSourceLinkOpenLabel = selectedStudioSourceHasVariant
    ? "같은 세부 유형 출처 보기"
    : "같은 저장 출처 보기";
  const selectedStudioSourceLinkTitle = selectedStudioSourceHasVariant
    ? "같은 세부 유형 출처 조건 링크"
    : "같은 저장 출처 조건 링크";
  const selectedStudioOperationalGroupLinkCopyLabel =
    selectedStudioSourceHasVariant
      ? "세부 묶음 링크 복사"
      : "운영 묶음 링크 복사";
  const selectedStudioOperationalGroupLinkCopiedLabel =
    selectedStudioSourceHasVariant
      ? "세부 묶음 링크 복사됨"
      : "운영 묶음 링크 복사됨";
  const selectedStudioOperationalGroupLinkFailedLabel =
    selectedStudioSourceHasVariant
      ? "세부 묶음 링크 복사 실패"
      : "운영 묶음 링크 복사 실패";
  const selectedStudioOperationalGroupLinkTitle = selectedStudioSourceHasVariant
    ? "같은 세부 유형 운영 묶음 조건 링크"
    : "같은 운영 묶음 조건 링크";
  const selectedStudioSourcePersistence = selectedStudioSource
    ? getPromptStudioSourcePersistenceMeta(selectedStudioSource.source)
    : undefined;
  const selectedStudioSourceRelationshipDescription = selectedStudioSource
    ? getPromptStudioSourceRelationshipDescription(selectedStudioSource.source)
    : undefined;
  const selectedStudioPersistenceFilter = selected
    ? getPromptStudioPersistenceFilter(selected)
    : undefined;
  const selectedStudioPersistenceLabel = selectedStudioPersistenceFilter
    ? studioPersistenceFilterLabels[selectedStudioPersistenceFilter]
    : undefined;
  const selectedStudioPersistenceDescription =
    selectedStudioPersistenceFilter
      ? studioPersistenceFilterDescriptions[selectedStudioPersistenceFilter]
      : undefined;
  const selectedStudioSourceHref =
    getPromptStudioSourceHref(selectedStudioSource);
  const selectedStudioSourceFilterHref = selectedStudioSource
    ? buildLibraryDefaultFilterHref({
        studioSource: selectedStudioSource.source,
        studioVariant: selectedStudioSource.sourceVariant ?? "all",
        detailMode: "current",
      })
    : undefined;
  const selectedStudioPersistenceFilterHref = selected
    ? buildLibraryDefaultFilterHref({
        studioPersistence: selectedStudioPersistenceFilter,
        detailMode: "current",
      })
    : undefined;
  const selectedStudioOperationalGroupHref =
    selectedStudioSource && selectedStudioPersistenceFilter
      ? buildLibraryDefaultFilterHref({
          studioPersistence: selectedStudioPersistenceFilter,
          studioSource: selectedStudioSource.source,
          studioVariant: selectedStudioSource.sourceVariant ?? "all",
          detailMode: "current",
        })
      : undefined;

  useEffect(() => {
    if (initialFocusTarget !== "feedback" || !selected) {
      return;
    }

    const focusFeedbackTarget = () => {
      const target = highlightedFeedbackId
        ? document.getElementById(`library-feedback-${highlightedFeedbackId}`)
        : null;
      const fallback = document.getElementById("library-feedback-section");

      (target ?? fallback)?.scrollIntoView({
        behavior: "auto",
        block: "center",
      });

      if (target instanceof HTMLElement) {
        target.focus({ preventScroll: true });
      }
    };

    const firstTimeout = window.setTimeout(focusFeedbackTarget, 120);
    const secondTimeout = window.setTimeout(focusFeedbackTarget, 420);

    return () => {
      window.clearTimeout(firstTimeout);
      window.clearTimeout(secondTimeout);
    };
  }, [highlightedFeedbackId, initialFocusTarget, selected]);

  const sourcePrompt = useMemo(() => {
    if (!selected?.improvementSource?.sourcePromptId) {
      return undefined;
    }

    return prompts.find(
      (prompt) => prompt.id === selected.improvementSource?.sourcePromptId,
    );
  }, [prompts, selected]);
  const deletedSourcePrompt = useMemo(() => {
    if (!selected?.improvementSource?.sourcePromptId || sourcePrompt) {
      return undefined;
    }

    return deletedPrompts.find(
      (item) => item.prompt.id === selected.improvementSource?.sourcePromptId,
    );
  }, [deletedPrompts, selected, sourcePrompt]);
  const recoverableSourcePrompt = sourcePrompt ?? deletedSourcePrompt?.prompt;
  const linkedImprovementPrompts = useMemo(() => {
    if (!selected) {
      return [];
    }

    return prompts
      .filter(
        (prompt) => prompt.improvementSource?.sourcePromptId === selected.id,
      )
      .sort((left, right) => getPromptTimestamp(right) - getPromptTimestamp(left))
      .slice(0, 3);
  }, [prompts, selected]);
  const selectedImprovementLineage = useMemo(() => {
    if (!selected) {
      return [];
    }

    return getPromptImprovementLineage(selected, prompts, deletedPrompts);
  }, [deletedPrompts, prompts, selected]);
  const selectedImprovementDepth = Math.max(
    0,
    selectedImprovementLineage.length - 1,
  );
  const selectedImprovementQualityDelta = useMemo(() => {
    if (!selected?.improvementSource) {
      return undefined;
    }

    return getImprovementQualityDelta({
      improvementPrompt: selected,
      preferredVersion: activeVersion,
      sourcePrompt: recoverableSourcePrompt,
    });
  }, [activeVersion, recoverableSourcePrompt, selected]);
  const selectedSourceHealthIssueReason = useMemo(() => {
    if (!selected?.improvementSource) {
      return undefined;
    }

    return getPromptSourceHealthIssueReason(selected, prompts, deletedPrompts);
  }, [deletedPrompts, prompts, selected]);
  const selectedImprovementScoreComparison = useMemo(() => {
    if (!selectedImprovementQualityDelta) {
      return undefined;
    }

    return buildImprovementScoreComparison({
      improvedVersion: selectedImprovementQualityDelta.improvedVersion,
      sourceVersion: selectedImprovementQualityDelta.sourceVersion,
    });
  }, [selectedImprovementQualityDelta]);
  const selectedPromptComparisonBrief = useMemo(() => {
    if (
      !selected ||
      !selectedImprovementQualityDelta ||
      !selectedImprovementScoreComparison
    ) {
      return undefined;
    }

    return buildPromptComparisonBrief({
      delta: selectedImprovementQualityDelta.delta,
      improvedScore: selectedImprovementQualityDelta.improvedScore,
      improvedVersion: selectedImprovementQualityDelta.improvedVersion,
      prompt: selected,
      scoreComparison: selectedImprovementScoreComparison,
      sourceScore: selectedImprovementQualityDelta.sourceScore,
      sourceVersion: selectedImprovementQualityDelta.sourceVersion,
    });
  }, [selected, selectedImprovementQualityDelta, selectedImprovementScoreComparison]);
  const selectedOperationalSummary = useMemo<
    SelectedOperationalSummary | undefined
  >(() => {
    if (!selected || !activeVersion) {
      return undefined;
    }

    const blockedReadinessCount = activeTargetAiHandoffReadinessItems.filter(
      (item) => item.status === "blocked",
    ).length;
    const reviewReadinessCount = activeTargetAiHandoffReadinessItems.filter(
      (item) => item.status === "review",
    ).length;
    const handoffStatusLabel = blockedReadinessCount
      ? "보강 필요"
      : reviewReadinessCount
        ? "검토 후 전달"
        : "전달 가능";
    const handoffStatusDescription = blockedReadinessCount
      ? `${blockedReadinessCount}개 전달 전 차단 항목이 있습니다. 보강 브리프를 먼저 적용하세요.`
      : reviewReadinessCount
        ? `${reviewReadinessCount}개 검토 항목이 있습니다. 맥락과 가정을 확인한 뒤 전달하세요.`
        : "현재 버전은 외부 AI 전달 기준을 충족합니다.";
    const persistenceLabel =
      selectedStudioPersistenceLabel ??
      (selected.improvementSource ? "개선 체인" : "Studio 출처 없음");
    const sourceLabel =
      selectedStudioSourceLabel?.label ??
      (selected.improvementSource ? "Library 개선본" : "직접 저장/레거시");
    const sourceVariantLabel =
      getPromptStudioSourceVariantLabel(selectedStudioSource);
    const chainLabel =
      selectedImprovementDepth > 0
        ? formatPromptImprovementDepth(selectedImprovementDepth)
        : linkedImprovementPrompts.length
          ? "원본 프롬프트"
          : "단독 저장본";
    const chainDescription =
      selectedImprovementDepth > 0
        ? `원본부터 현재까지 ${selectedImprovementLineage.length}단계로 연결되어 있습니다.`
        : linkedImprovementPrompts.length
          ? `${linkedImprovementPrompts.length}개 후속 개선본이 이 프롬프트를 기준으로 연결되어 있습니다.`
          : "아직 연결된 개선 체인이 없습니다.";
    const nextAction = selectedSourceHealthIssueReason
      ? "원본 상태 확인"
      : blockedReadinessCount || reviewReadinessCount
        ? "AI 전달 전 보강"
        : selectedImprovementQualityDelta?.delta !== undefined &&
            selectedImprovementQualityDelta.delta < 0
          ? "재개선 후보 검토"
          : "AI 전달 패키지 실행";
    const actionKind = selectedSourceHealthIssueReason
      ? "source-detail"
      : blockedReadinessCount || reviewReadinessCount
        ? "handoff-improve"
        : selectedImprovementQualityDelta?.delta !== undefined &&
            selectedImprovementQualityDelta.delta < 0
          ? "comparison"
          : "package";
    const actionLabel =
      actionKind === "source-detail"
        ? "출처 카드 확인"
        : actionKind === "handoff-improve"
          ? "Studio에서 보강"
          : actionKind === "comparison"
            ? "원본 비교 보기"
            : "패키지 보기";
    const sourceActionLabel = selectedStudioSourceFilterHref
      ? selectedStudioSourceHasVariant
        ? "세부 유형 출처 보기"
        : "저장 출처 보기"
      : undefined;
    const persistenceActionLabel = selectedStudioPersistenceFilterHref
      ? "저장 방식으로 보기"
      : undefined;
    const groupActionLabel = selectedStudioOperationalGroupHref
      ? selectedStudioSourceHasVariant
        ? "세부 유형 묶음 보기"
        : "운영 묶음 보기"
      : undefined;
    const nextActionDescription = selectedSourceHealthIssueReason
      ? "품질 판단보다 원본 복원, 버전 연결, 삭제 보관함 상태를 먼저 확인합니다."
      : blockedReadinessCount || reviewReadinessCount
        ? "보강 브리프를 Studio로 보내 새 결과를 만든 뒤 복사/저장합니다."
        : selectedImprovementQualityDelta?.delta !== undefined &&
            selectedImprovementQualityDelta.delta < 0
          ? "원본 대비 점수가 낮아진 항목을 비교 모드에서 확인하고 재개선합니다."
          : "패키지 미리보기에서 실행 프롬프트와 검토 체크리스트를 함께 전달합니다.";

    return {
      actionKind,
      actionLabel,
      chainDescription,
      chainLabel,
      groupActionHref: selectedStudioOperationalGroupHref,
      groupActionLabel,
      handoffStatusDescription,
      handoffStatusLabel,
      nextAction,
      nextActionDescription,
      persistenceActionHref: selectedStudioPersistenceFilterHref,
      persistenceActionLabel,
      persistenceLabel,
      sourceActionHref: selectedStudioSourceFilterHref,
      sourceActionLabel,
      sourceLabel,
      sourceOriginalActionLabel: selectedStudioSourceLabel?.actionLabel,
      sourceOriginalHref: selectedStudioSourceHref,
      sourceTitle: selectedStudioSource?.sourceTitle,
      sourceVariantLabel,
    };
  }, [
    activeTargetAiHandoffReadinessItems,
    activeVersion,
    linkedImprovementPrompts.length,
    selected,
    selectedImprovementDepth,
    selectedImprovementLineage.length,
    selectedImprovementQualityDelta?.delta,
    selectedSourceHealthIssueReason,
    selectedStudioOperationalGroupHref,
    selectedStudioPersistenceFilterHref,
    selectedStudioSourceFilterHref,
    selectedStudioSourceHasVariant,
    selectedStudioSourceHref,
    selectedStudioPersistenceLabel,
    selectedStudioSource,
    selectedStudioSourceLabel?.actionLabel,
    selectedStudioSourceLabel?.label,
  ]);
  const selectedOperationalWorkflowSteps = useMemo(() => {
    if (!selectedOperationalSummary) {
      return [];
    }

    return [
      {
        detail: selectedOperationalSummary.handoffStatusLabel,
        label: "확인",
        step: "01",
        title: selectedOperationalSummary.nextAction,
      },
      {
        detail: "리포트 또는 조건 링크로 공유",
        label: "공유",
        step: "02",
        title: "운영 요약 복사",
      },
      {
        detail: selectedOperationalSummary.nextActionDescription,
        label: "개선",
        step: "03",
        title: selectedOperationalSummary.actionLabel,
      },
    ];
  }, [selectedOperationalSummary]);
  const selectedLearningContextWorkflowSteps = useMemo(() => {
    if (!selected) {
      return [];
    }

    return [
      {
        detail: formatLearningContextCount(selected),
        label: "증거 확인",
        step: "01",
        title: formatEnabledMemoryScopes(selected),
      },
      {
        detail: "enabled/disabled scope와 적용 메모리를 Markdown으로 복사합니다.",
        label: "리포트 공유",
        step: "02",
        title: "학습 컨텍스트 리포트",
      },
      {
        detail: "같은 학습 증거를 Studio 초안으로 보내 재개선 계획을 만듭니다.",
        label: "Studio 개선",
        step: "03",
        title: "학습 기준 재점검",
      },
    ];
  }, [selected]);
  const activePromptDetailMode =
    selectedImprovementQualityDelta && promptDetailMode === "comparison"
      ? "comparison"
      : "current";
  const selectedDetailReturnHref =
    selected && activeVersion
      ? buildCurrentLibraryHref({
          promptId: selected.id,
          version: activeVersion.targetModel,
          detailMode: activePromptDetailMode,
        })
      : "/library";
  const companyContextHref = buildContextEditorHref({
    fallbackReturnTo: "/library",
    pathname: "/company",
    returnTo: selectedDetailReturnHref,
  });
  const profileContextHref = buildContextEditorHref({
    fallbackReturnTo: "/library",
    pathname: "/profile",
    returnTo: selectedDetailReturnHref,
  });
  const versionComparisons = useMemo(() => {
    if (!selected) {
      return [];
    }

    const bestQuality = getPromptBestQuality(selected);
    const feedbackStats = selected.versions.map((version) => ({
      stats: getVersionFeedbackStats(selected, version.id),
      version,
    }));
    const mostFeedback = Math.max(
      0,
      ...feedbackStats.map((item) => item.stats.count),
    );

    return feedbackStats.map(({ stats, version }) => ({
      averageRating: stats.averageRating,
      feedbackCount: stats.count,
      isBestQuality: version.qualityScore === bestQuality,
      isMostReviewed: stats.count > 0 && stats.count === mostFeedback,
      version,
    }));
  }, [selected]);
  const improvementActions = useMemo(
    () => (activeVersion ? getImprovementActions(activeVersion) : []),
    [activeVersion],
  );
  const sortedDeletedPrompts = useMemo(
    () =>
      deletedPrompts
        .slice()
        .sort((left, right) => right.deletedAt.localeCompare(left.deletedAt)),
    [deletedPrompts],
  );
  const filteredDeletedPrompts = useMemo(() => {
    const normalizedQuery = deletedPromptArchiveQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return sortedDeletedPrompts;
    }

    return sortedDeletedPrompts.filter((item) => {
      const searchable = [
        item.prompt.title,
        item.prompt.domain,
        item.prompt.goal,
        item.prompt.languageStrategy,
        item.prompt.outputLanguage,
        item.prompt.source,
        item.prompt.versions.map((version) => version.content).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [deletedPromptArchiveQuery, sortedDeletedPrompts]);
  const visibleDeletedPrompts = deletedPromptArchiveExpanded
    ? filteredDeletedPrompts
    : filteredDeletedPrompts.slice(0, 3);

  function handlePromptSelect(prompt: PromptAsset) {
    const nextActiveModel =
      targetModelFilter !== "all" &&
      prompt.versions.some((version) => version.targetModel === targetModelFilter)
        ? targetModelFilter
        : prompt.versions[0]?.targetModel ?? "general";

    setSelectedId(prompt.id);
    setActiveModel(nextActiveModel);
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setContextQuestionsCopied(false);
    setNoSourceMetaNoteCopiedFor("");
    setLatestFeedbackId("");
    setHighlightedFeedbackId("");
    setDeletePromptCandidate(null);
    setDeletedPromptRemoveCandidate(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      promptId: prompt.id,
      version: nextActiveModel,
      detailMode: "current",
    });
  }

  function getLinkedImprovementPromptCount(prompt: PromptAsset) {
    return prompts.filter(
      (item) => item.improvementSource?.sourcePromptId === prompt.id,
    ).length;
  }

  function requestSelectedPromptDelete() {
    if (!selected) {
      return;
    }

    setDeletePromptCandidate(selected);
    setDeletedPromptRemoveCandidate(null);
    setManualCopy(null);
  }

  function cancelPromptDelete() {
    setDeletePromptCandidate(null);
  }

  function requestDeletedPromptRemove(deletedPrompt: PromptDeletedAsset) {
    setDeletedPromptRemoveCandidate(deletedPrompt);
    setDeletePromptCandidate(null);
    setManualCopy(null);
  }

  function cancelDeletedPromptRemove() {
    setDeletedPromptRemoveCandidate(null);
  }

  function confirmDeletedPromptRemove() {
    if (!deletedPromptRemoveCandidate) {
      return;
    }

    const removedPromptId = deletedPromptRemoveCandidate.prompt.id;

    setDeletedPrompts((current) =>
      current.filter((item) => item.prompt.id !== removedPromptId),
    );
    setDeletedPromptRemoveCandidate(null);

    if (deletedPromptRecoveryId === removedPromptId) {
      setDeletedPromptTitle("");
      setDeletedPromptRecoveryId("");
    }

    if (deletedPrompts.length <= 1) {
      setDeletedPromptArchiveExpanded(false);
      setDeletedPromptArchiveQuery("");
    }
  }

  function toggleDeletedPromptArchive() {
    setDeletedPromptArchiveExpanded((current) => {
      const nextExpanded = !current;

      if (!nextExpanded) {
        setDeletedPromptArchiveQuery("");
      }

      return nextExpanded;
    });
  }

  function openDeletedPromptArchive() {
    setDeletedPromptArchiveExpanded(true);
    setDeletedPromptArchiveQuery("");
  }

  function confirmPromptDelete() {
    if (!deletePromptCandidate) {
      return;
    }

    const promptToDelete = deletePromptCandidate;

    setPrompts((current) =>
      current.filter((prompt) => prompt.id !== promptToDelete.id),
    );
    setDeletedPrompts((current) => [
      {
        prompt: promptToDelete,
        deletedAt: new Date().toISOString(),
      },
      ...current.filter((item) => item.prompt.id !== promptToDelete.id),
    ]);
    setDeletedPromptTitle(promptToDelete.title);
    setDeletedPromptRecoveryId(promptToDelete.id);
    setDeletePromptCandidate(null);
    setSelectedId("");
    setActiveModel("gpt");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setContextQuestionsCopied(false);
    setContextQuestionsCopyFailed(false);
    setLatestFeedbackId("");
    setHighlightedFeedbackId("");
    setManualCopy(null);
    setPromptDetailMode("current");
    setDeletedPromptRemoveCandidate(null);
    syncFilterUrl({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function undoPromptDelete() {
    const deletedPrompt = deletedPrompts.find(
      (item) => item.prompt.id === deletedPromptRecoveryId,
    );

    if (!deletedPrompt) {
      return;
    }

    restoreDeletedPrompt(deletedPrompt);
  }

  function restoreDeletedPrompt(deletedPrompt: PromptDeletedAsset) {
    const restoredPrompt = deletedPrompt.prompt;
    const nextActiveModel = restoredPrompt.versions[0]?.targetModel ?? "general";

    setPrompts((current) =>
      current.some((prompt) => prompt.id === restoredPrompt.id)
        ? current
        : [restoredPrompt, ...current],
    );
    setDeletedPrompts((current) =>
      current.filter((item) => item.prompt.id !== restoredPrompt.id),
    );
    if (deletedPrompts.length <= 1) {
      setDeletedPromptArchiveExpanded(false);
      setDeletedPromptArchiveQuery("");
    }
    setSelectedId(restoredPrompt.id);
    setActiveModel(nextActiveModel);
    setDeletedPromptTitle("");
    setDeletedPromptRecoveryId("");
    setDeletePromptCandidate(null);
    setDeletedPromptRemoveCandidate(null);
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setContextQuestionsCopied(false);
    setContextQuestionsCopyFailed(false);
    setLatestFeedbackId("");
    setHighlightedFeedbackId("");
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      promptId: restoredPrompt.id,
      version: nextActiveModel,
      detailMode: "current",
    });
  }

  function handleVersionChange(nextActiveModel: TargetModel) {
    if (!selected) {
      return;
    }

    setActiveModel(nextActiveModel);
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setContextQuestionsCopied(false);
    setContextQuestionsCopyFailed(false);
    setLatestFeedbackId("");
    setHighlightedFeedbackId("");
    setManualCopy(null);
    syncFilterUrl({
      promptId: selected.id,
      version: nextActiveModel,
      detailMode: activePromptDetailMode,
    });
  }

  function handlePromptDetailModeChange(nextDetailMode: PromptDetailMode) {
    setPromptDetailMode(nextDetailMode);
    setDetailLinkCopied(false);
    setFilterLinkCopied(false);
    setComparisonBriefCopied(false);
    setContextQuestionsCopied(false);
    setLatestFeedbackId("");
    setHighlightedFeedbackId("");

    if (!selected || !activeVersion) {
      return;
    }

    syncFilterUrl({
      promptId: selected.id,
      version: activeVersion.targetModel,
      detailMode: nextDetailMode,
      route: false,
    });
  }

  function openPromptDetail(promptId: string, preferredVersion?: TargetModel) {
    const prompt = prompts.find((item) => item.id === promptId);

    if (!prompt) {
      return;
    }

    const nextVersion =
      preferredVersion &&
      prompt.versions.some((version) => version.targetModel === preferredVersion)
        ? preferredVersion
        : prompt.versions[0]?.targetModel;

    const href = buildLibraryDefaultFilterHref({
      promptId: prompt.id,
      version: nextVersion,
      detailMode: "current",
    });

    router.push(href);
  }

  function openPromptFeedbackDetail(
    promptId: string,
    feedbackId: string,
    preferredVersion?: TargetModel,
  ) {
    const prompt = prompts.find((item) => item.id === promptId);

    if (!prompt) {
      return;
    }

    const nextVersion =
      preferredVersion &&
      prompt.versions.some((version) => version.targetModel === preferredVersion)
        ? preferredVersion
        : prompt.versions[0]?.targetModel;
    const href = buildLibraryDefaultFilterHref({
      promptId: prompt.id,
      version: nextVersion,
      detailMode: "current",
      focusTarget: "feedback",
      feedbackId,
    });

    router.push(href);
  }

  function addFeedback() {
    if (!selected || !activeVersion || !comment.trim()) {
      return;
    }

    const feedback: Feedback = {
      id: makeId("feedback"),
      promptVersionId: activeVersion.id,
      rating,
      comment,
      feedbackType,
      createdAt: new Date().toISOString(),
    };

    setPrompts((current) =>
      current.map((prompt) =>
        prompt.id === selected.id
          ? {
              ...prompt,
              feedback: [feedback, ...prompt.feedback],
              updatedAt: new Date().toISOString(),
            }
          : prompt,
      ),
    );
    setMemories((current) =>
      mergeMemoryList(
        current,
        createMemoryFromFeedback(selected, activeVersion, feedback),
      ),
    );
    setComment("");
    setLatestFeedbackId(feedback.id);
    setHighlightedFeedbackId(feedback.id);
  }

  function addPromptTag(promptId: string, tag: string) {
    setPrompts((current) =>
      current.map((prompt) =>
        prompt.id === promptId ? addTagToPrompt(prompt, tag) : prompt,
      ),
    );
    setNewTagInput("");
  }

  function removePromptTag(promptId: string, tag: string) {
    setPrompts((current) =>
      current.map((prompt) =>
        prompt.id === promptId ? removeTagFromPrompt(prompt, tag) : prompt,
      ),
    );
  }

  function togglePromptPin(promptId: string) {
    setPrompts((current) => {
      const target = current.find((prompt) => prompt.id === promptId);

      if (!target) {
        return current;
      }

      return setPromptPinned(current, promptId, !isPromptPinned(target));
    });
  }

  function duplicateSelectedPrompt(promptId: string) {
    const target = prompts.find((prompt) => prompt.id === promptId);

    if (!target) {
      return;
    }

    const duplicate = duplicatePromptAsset(target, {
      id: makeId("prompt"),
      versionIds: target.versions.map(() => makeId("version")),
      timestamp: new Date().toISOString(),
    });

    setPrompts((current) => [duplicate, ...current]);
    router.push(
      buildPromptLibraryHref(duplicate.id, duplicate.versions[0]?.targetModel),
    );
  }

  function importPrompt(parsed: ParsedPromptImport) {
    const imported = normalizeImportedPrompt(parsed, {
      id: makeId("prompt"),
      versionIds: parsed.versions.map(() => makeId("version")),
      timestamp: new Date().toISOString(),
    });

    setPrompts((current) => [imported, ...current]);
    setImportDialogOpen(false);
    router.push(
      buildPromptLibraryHref(imported.id, imported.versions[0]?.targetModel),
    );
    announce("프롬프트를 가져왔습니다.");
  }

  async function copyLibraryText(copy: LibraryManualCopy) {
    const copiedToClipboard = await copyTextToClipboard(copy.body);

    setManualCopy(copiedToClipboard ? null : copy);

    return copiedToClipboard;
  }

  async function copyStudioVariantFilterLink({
    href,
    label,
    sourceVariant,
  }: {
    href: string;
    label: string;
    sourceVariant: PromptStudioDraftSourceVariant;
  }) {
    const linkText =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copiedToClipboard = await copyLibraryText({
      id: "studio-variant-link",
      targetId: sourceVariant,
      title: `세부 초안 유형 조건 링크 · ${label}`,
      body: linkText,
    });

    setStudioVariantLinkCopiedFor(copiedToClipboard ? sourceVariant : "");
  }

  async function copyPrompt(title = "현재 버전") {
    if (!activeVersion) {
      return;
    }

    const copiedToClipboard = await copyLibraryText({
      id: "prompt",
      title,
      body: activeVersion.content,
    });

    setCopied(copiedToClipboard);
  }

  async function copyTargetAiHandoffPackage() {
    if (!selected || !activeVersion) {
      return;
    }

    const copyKey = `${selected.id}:${activeVersion.id}`;
    const copiedToClipboard = await copyLibraryText({
      id: "target-ai-package",
      targetId: copyKey,
      title: "AI 전달 패키지",
      body: activeTargetAiHandoffPackageText,
    });

    setTargetAiPackageCopiedKey(copiedToClipboard ? copyKey : "");
  }

  async function copyTargetAiHandoffImprovementBrief() {
    if (!selected || !activeVersion) {
      return;
    }

    const copyKey = `${selected.id}:${activeVersion.id}`;
    const copiedToClipboard = await copyLibraryText({
      id: "target-ai-improvement-brief",
      targetId: copyKey,
      title: "AI 전달 보강 브리프",
      body: activeTargetAiHandoffImprovementBriefText,
    });

    setTargetAiImprovementBriefCopiedKey(copiedToClipboard ? copyKey : "");
  }

  async function copySelectedOperationalSummaryReport() {
    if (!selected || !activeVersion || !selectedOperationalSummary) {
      return;
    }

    const copiedToClipboard = await copyLibraryText({
      id: "selected-operational-summary-report",
      targetId: selected.id,
      title: "선택 운영 요약 리포트",
      body: buildSelectedOperationalSummaryReport({
        baseUrl: window.location.origin,
        detailHref: selectedDetailReturnHref,
        prompt: selected,
        readinessItems: activeTargetAiHandoffReadinessItems,
        summary: selectedOperationalSummary,
        version: activeVersion,
      }),
    });

    setSelectedOperationalSummaryReportCopiedFor(
      copiedToClipboard ? selected.id : "",
    );
  }

  function openSelectedOperationalSummaryReportInStudio() {
    if (!selected || !activeVersion || !selectedOperationalSummary) {
      return;
    }

    const rawInput = buildSelectedOperationalSummaryReport({
      baseUrl: window.location.origin,
      detailHref: selectedDetailReturnHref,
      prompt: selected,
      readinessItems: activeTargetAiHandoffReadinessItems,
      summary: selectedOperationalSummary,
      version: activeVersion,
    });
    const wroteDraft = writeStudioDraft({
      source: "library-operational-summary",
      rawInput,
      goal: "Library 운영 요약 기반 다음 조치 정리",
      domain: selected.domain || "운영",
      targetModels: [activeVersion.targetModel],
      outputLanguage: "korean",
      sourceTitle: `운영 요약 · ${selected.title}`,
      sourceHref: selectedDetailReturnHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setSelectedOperationalSummaryReportCopiedFor("");
      setManualCopy({
        id: "selected-operational-summary-report",
        targetId: selected.id,
        title: "선택 운영 요약 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-operational-summary");
  }

  function openTargetAiHandoffImprovementInStudio() {
    if (!selected || !activeVersion) {
      return;
    }

    const rawInput = activeTargetAiHandoffImprovementBriefText;
    const wroteDraft = writeStudioDraft({
      source: "library-improvement",
      sourceVariant: "handoff-improvement",
      rawInput,
      goal: "프롬프트 개선",
      domain: selected.domain,
      targetModels: [activeVersion.targetModel],
      outputLanguage: getOutputLanguage(selected),
      sourcePromptId: selected.id,
      sourceVersionId: activeVersion.id,
      sourceVersionModel: activeVersion.targetModel,
      sourceTitle: selected.title,
      sourceHref: buildCurrentLibraryHref({
        promptId: selected.id,
        version: activeVersion.targetModel,
        detailMode: activePromptDetailMode,
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setTargetAiImprovementBriefCopiedKey("");
      setManualCopy({
        id: "target-ai-improvement-brief",
        targetId: activeTargetAiPackageCopyKey,
        title: "AI 전달 보강 브리프",
        body: rawInput,
      });
      setTargetAiPackagePreviewOpen(true);
      return;
    }

    router.push("/studio?draft=library-improvement");
  }

  function runSelectedOperationalSummaryAction() {
    if (!selectedOperationalSummary) {
      return;
    }

    if (selectedOperationalSummary.actionKind === "source-detail") {
      document
        .getElementById("library-improvement-source-card")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (selectedOperationalSummary.actionKind === "handoff-improve") {
      openTargetAiHandoffImprovementInStudio();
      return;
    }

    if (selectedOperationalSummary.actionKind === "comparison") {
      handlePromptDetailModeChange("comparison");
      return;
    }

    setTargetAiPackagePreviewOpen(true);
  }

  async function copyFilterLink() {
    const href = buildCurrentLibraryHref({
      promptId: selectedId,
      version: selectedId ? activeVersion?.targetModel : undefined,
      detailMode: selectedId ? activePromptDetailMode : "current",
    });

    const linkText =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copiedToClipboard = await copyLibraryText({
      id: "filter-link",
      title: "공유 링크",
      body: linkText,
    });

    setFilterLinkCopied(copiedToClipboard);
  }

  async function copySourceReasonFilterReport() {
    if (sourceReasonFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const copiedToClipboard = await copyLibraryText({
      id: "source-health-filter-report",
      title: "출처 사유 조치 리포트",
      body: buildSourceReasonFilterReport({
        baseUrl: window.location.origin,
        deletedPrompts,
        prompts,
        reason: sourceReasonFilter,
        resultPrompts: filtered,
        filterHref,
      }),
    });

    setSourceHealthReportCopied(copiedToClipboard);
  }

  async function copySourceReasonFilterLink() {
    if (sourceReasonFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const linkText =
      formatAbsoluteInternalHref(filterHref, window.location.origin) ??
      filterHref;
    const copiedToClipboard = await copyLibraryText({
      id: "source-health-filter-link",
      title: "출처 사유 조건 링크",
      body: linkText,
    });

    setFilterLinkCopied(copiedToClipboard);
  }

  async function copyStudioPersistenceFilterReport() {
    if (studioPersistenceFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const reportTitle =
      studioPersistenceFilter === "none"
        ? "저장 출처 메타 없음 큐 리포트"
        : "Studio 저장 방식 리포트";
    const copiedToClipboard = await copyLibraryText({
      id: "studio-persistence-report",
      title: reportTitle,
      body: buildStudioPersistenceFilterReport({
        baseUrl: window.location.origin,
        filter: studioPersistenceFilter,
        filterHref,
        resultPrompts: filtered,
      }),
    });

    setStudioPersistenceReportCopied(copiedToClipboard);
  }

  async function copyStudioPersistenceFilterLink() {
    if (studioPersistenceFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const linkText =
      formatAbsoluteInternalHref(filterHref, window.location.origin) ??
      filterHref;
    const copiedToClipboard = await copyLibraryText({
      id: "studio-persistence-link",
      title:
        studioPersistenceFilter === "none"
          ? "저장 출처 메타 없음 큐 링크"
          : "Studio 저장 방식 조건 링크",
      body: linkText,
    });

    setFilterLinkCopied(copiedToClipboard);
  }

  function openStudioPersistenceFilterReportInStudio() {
    if (studioPersistenceFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const sourceTitle =
      studioPersistenceFilter === "none"
        ? "저장 출처 메타 없음 큐"
        : `Studio 저장 방식 · ${studioPersistenceFilterLabels[studioPersistenceFilter]}`;
    const rawInput = buildStudioPersistenceFilterReport({
      baseUrl: window.location.origin,
      filter: studioPersistenceFilter,
      filterHref,
      resultPrompts: filtered,
    });
    const draftHref =
      studioPersistenceFilter === "none"
        ? "/studio?draft=library-missing-source-metadata-queue"
        : "/studio?draft=library-studio-persistence-filter";

    const wroteDraft = writeStudioDraft({
      source:
        studioPersistenceFilter === "none"
          ? "library-missing-source-metadata-queue"
          : "library-studio-persistence-filter",
      rawInput,
      goal:
        studioPersistenceFilter === "none"
          ? "저장 출처 메타 없음 큐 운영 기준 정리"
          : "Studio 저장 방식 운영 기준 정리",
      domain: "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle,
      sourceHref: filterHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioPersistenceReportCopied(false);
      setManualCopy({
        id: "studio-persistence-report",
        title:
          studioPersistenceFilter === "none"
            ? "저장 출처 메타 없음 큐 리포트"
            : "Studio 저장 방식 리포트",
        body: rawInput,
      });
      return;
    }

    router.push(draftHref);
  }

  async function copyStudioPersistenceCandidateNote(
    candidate: (typeof studioPersistenceActionCandidates)[number],
  ) {
    const copiedToClipboard = await copyLibraryText({
      id: "studio-persistence-candidate-note",
      targetId: candidate.id,
      title:
        studioPersistenceFilter === "none"
          ? "저장 출처 메타 없음 후보 메모"
          : "Studio 저장 방식 후보 메모",
      body: candidate.note,
    });

    setStudioPersistenceCandidateCopiedId(
      copiedToClipboard ? candidate.id : "",
    );
  }

  function openStudioPersistenceCandidateInStudio(
    candidate: (typeof studioPersistenceActionCandidates)[number],
  ) {
    const rawInput = candidate.note;
    const draftHref =
      studioPersistenceFilter === "none"
        ? "/studio?draft=library-missing-source-metadata-candidate"
        : "/studio?draft=library-studio-persistence-candidate";
    const wroteDraft = writeStudioDraft({
      source:
        studioPersistenceFilter === "none"
          ? "library-missing-source-metadata-candidate"
          : "library-studio-persistence-candidate",
      rawInput,
      goal:
        studioPersistenceFilter === "none"
          ? "저장 출처 메타 없음 후보 관리 기준 정리"
          : "Studio 저장 방식 후보 관리 기준 정리",
      domain: candidate.prompt.domain || "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle:
        studioPersistenceFilter === "none"
          ? `저장 출처 메타 없음 후보 · ${candidate.title}`
          : `Studio 저장 방식 후보 · ${candidate.title}`,
      sourceHref: candidate.detailHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioPersistenceCandidateCopiedId("");
      setManualCopy({
        id: "studio-persistence-candidate-note",
        targetId: candidate.id,
        title:
          studioPersistenceFilter === "none"
            ? "저장 출처 메타 없음 후보 메모"
            : "Studio 저장 방식 후보 메모",
        body: rawInput,
      });
      return;
    }

    router.push(draftHref);
  }

  async function copyStudioOperationalGroupReport() {
    if (studioPersistenceFilter === "all" || studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const copiedToClipboard = await copyLibraryText({
      id: "studio-operational-group-report",
      title: "Studio 운영 묶음 리포트",
      body: buildStudioOperationalGroupReport({
        baseUrl: window.location.origin,
        filterHref,
        persistenceFilter: studioPersistenceFilter,
        resultPrompts: filtered,
        sourceFilter: studioSourceFilter,
      }),
    });

    setStudioOperationalGroupReportCopied(copiedToClipboard);
  }

  async function copyStudioOperationalGroupFilterLink() {
    if (studioPersistenceFilter === "all" || studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const linkText =
      formatAbsoluteInternalHref(filterHref, window.location.origin) ??
      filterHref;
    const copiedToClipboard = await copyLibraryText({
      id: "studio-operational-group-link",
      title: "Studio 운영 묶음 조건 링크",
      body: linkText,
    });

    setFilterLinkCopied(copiedToClipboard);
  }

  function openStudioOperationalGroupReportInStudio() {
    if (studioPersistenceFilter === "all" || studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const sourceTitle = `Studio 운영 묶음 · ${
      studioPersistenceFilterLabels[studioPersistenceFilter]
    } · ${getStudioSourceFilterLabel(studioSourceFilter)}`;
    const rawInput = buildStudioOperationalGroupReport({
      baseUrl: window.location.origin,
      filterHref,
      persistenceFilter: studioPersistenceFilter,
      resultPrompts: filtered,
      sourceFilter: studioSourceFilter,
    });

    const wroteDraft = writeStudioDraft({
      source: "library-studio-operational-group",
      rawInput,
      goal: "Studio 운영 묶음 기준 정리",
      domain: "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle,
      sourceHref: filterHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioOperationalGroupReportCopied(false);
      setManualCopy({
        id: "studio-operational-group-report",
        title: "Studio 운영 묶음 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-studio-operational-group");
  }

  async function copyStudioSourceFilterReport() {
    if (studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const copiedToClipboard = await copyLibraryText({
      id: "studio-source-report",
      title: "Studio 저장 출처 리포트",
      body: buildStudioSourceFilterReport({
        baseUrl: window.location.origin,
        filter: studioSourceFilter,
        filterHref,
        resultPrompts: filtered,
      }),
    });

    setStudioSourceReportCopied(copiedToClipboard);
  }

  async function copyStudioSourceFilterLink() {
    if (studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const linkText =
      formatAbsoluteInternalHref(filterHref, window.location.origin) ??
      filterHref;
    const copiedToClipboard = await copyLibraryText({
      id: "studio-source-link",
      title: "Studio 저장 출처 조건 링크",
      body: linkText,
    });

    setFilterLinkCopied(copiedToClipboard);
  }

  function openStudioSourceFilterReportInStudio() {
    if (studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const sourceTitle = `Studio 저장 출처 · ${getStudioSourceFilterLabel(
      studioSourceFilter,
    )}`;
    const rawInput = buildStudioSourceFilterReport({
      baseUrl: window.location.origin,
      filter: studioSourceFilter,
      filterHref,
      resultPrompts: filtered,
    });

    const wroteDraft = writeStudioDraft({
      source: "library-studio-source-filter",
      rawInput,
      goal: "Studio 저장 출처 운영 기준 정리",
      domain: "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle,
      sourceHref: filterHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioSourceReportCopied(false);
      setManualCopy({
        id: "studio-source-report",
        title: "Studio 저장 출처 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-studio-source-filter");
  }

  async function copyStudioSourceCandidateNote(
    candidate: (typeof studioSourceActionCandidates)[number],
  ) {
    const copiedToClipboard = await copyLibraryText({
      id: "studio-source-candidate-note",
      targetId: candidate.id,
      title: "Studio 저장 출처 후보 메모",
      body: candidate.note,
    });

    setStudioSourceCandidateCopiedId(copiedToClipboard ? candidate.id : "");
  }

  function openStudioSourceCandidateInStudio(
    candidate: (typeof studioSourceActionCandidates)[number],
  ) {
    const rawInput = candidate.note;
    const wroteDraft = writeStudioDraft({
      source: "library-studio-source-candidate",
      rawInput,
      goal: "Studio 저장 출처 후보 관리 기준 정리",
      domain: candidate.prompt.domain || "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle: `Studio 저장 출처 후보 · ${candidate.title}`,
      sourceHref: candidate.detailHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioSourceCandidateCopiedId("");
      setManualCopy({
        id: "studio-source-candidate-note",
        targetId: candidate.id,
        title: "Studio 저장 출처 후보 메모",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-studio-source-candidate");
  }

  async function copySourceReasonCandidateNote(
    candidate: (typeof sourceReasonActionCandidates)[number],
  ) {
    const copiedToClipboard = await copyLibraryText({
      id: "source-health-candidate-note",
      targetId: candidate.id,
      title: "출처 후보 메모",
      body: candidate.note,
    });

    setSourceHealthCandidateCopiedId(copiedToClipboard ? candidate.id : "");
  }

  async function copySourceReasonCandidateLink(
    candidate: (typeof sourceReasonActionCandidates)[number],
  ) {
    const linkText =
      formatAbsoluteInternalHref(candidate.detailHref, window.location.origin) ??
      candidate.detailHref;
    const copiedToClipboard = await copyLibraryText({
      id: "source-health-candidate-link",
      targetId: candidate.id,
      title: "출처 후보 상세 링크",
      body: linkText,
    });

    setSourceHealthCandidateLinkCopiedId(
      copiedToClipboard ? candidate.id : "",
    );
  }

  function openSourceReasonCandidateInStudio(
    candidate: (typeof sourceReasonActionCandidates)[number],
  ) {
    const rawInput = candidate.note;
    const wroteDraft = writeStudioDraft({
      source: "library-source-health-candidate",
      rawInput,
      goal: "개선 출처 후보 복원 계획",
      domain: candidate.prompt.domain || "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle: `출처 후보 · ${candidate.title}`,
      sourceHref: candidate.detailHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setSourceHealthCandidateCopiedId("");
      setManualCopy({
        id: "source-health-candidate-note",
        targetId: candidate.id,
        title: "출처 후보 메모",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-source-health-candidate");
  }

  function openSourceReasonFilterReportInStudio() {
    if (sourceReasonFilter === "all") {
      return;
    }

    const filterHref = buildCurrentLibraryHref({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const sourceTitle = `출처 사유 조치 · ${sourceReasonFilterLabels[sourceReasonFilter]}`;
    const rawInput = buildSourceReasonFilterReport({
      baseUrl: window.location.origin,
      deletedPrompts,
      prompts,
      reason: sourceReasonFilter,
      resultPrompts: filtered,
      filterHref,
    });

    const wroteDraft = writeStudioDraft({
      source: "library-source-health-filter",
      rawInput,
      goal: "개선 출처 복원 계획",
      domain: "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle,
      sourceHref: filterHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setSourceHealthReportCopied(false);
      setManualCopy({
        id: "source-health-filter-report",
        title: "출처 사유 조치 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-source-health-filter");
  }

  async function copyDetailLink() {
    if (!selected || !activeVersion) {
      return;
    }

    const href = buildCurrentLibraryHref({
      promptId: selected.id,
      version: activeVersion.targetModel,
      detailMode: activePromptDetailMode,
    });

    const linkText =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copiedToClipboard = await copyLibraryText({
      id: "detail-link",
      title: "상세 링크",
      body: linkText,
    });

    setDetailLinkCopied(copiedToClipboard);
  }

  async function copyImprovementBrief() {
    if (!selected || !activeVersion) {
      return;
    }

    const briefText = buildImprovementBrief({
      actions: improvementActions,
      prompt: selected,
      version: activeVersion,
    });
    const copiedToClipboard = await copyLibraryText({
      id: "improvement-brief",
      title: "개선 브리프",
      body: briefText,
    });

    setImprovementBriefCopied(copiedToClipboard);
  }

  async function copyMissingContextQuestions() {
    if (!selected || !activeVersion) {
      return;
    }

    const questionsText = buildMissingContextQuestionsText({
      prompt: selected,
      version: activeVersion,
    });
    const copiedToClipboard = await copyLibraryText({
      id: "missing-context",
      title: "보강 질문",
      body: questionsText,
    });

    setContextQuestionsCopied(copiedToClipboard);
    setContextQuestionsCopyFailed(!copiedToClipboard);
  }

  async function copyLearningContextReport() {
    if (!selected) {
      return;
    }

    const reportText = buildLearningContextReportText(selected);
    const copiedToClipboard = await copyLibraryText({
      id: "learning-report",
      title: "학습 컨텍스트 리포트",
      body: reportText,
    });

    setLearningContextReportCopiedFor(copiedToClipboard ? selected.id : "");
  }

  function openLearningContextReportInStudio() {
    if (!selected) {
      return;
    }

    const rawInput = buildLearningContextStudioDraftText({
      baseUrl: window.location.origin,
      detailHref: selectedDetailReturnHref,
      prompt: selected,
    });
    const wroteDraft = writeStudioDraft({
      source: "library-learning-context",
      rawInput,
      goal: "학습 컨텍스트 기반 프롬프트 재개선",
      domain: selected.domain || "운영",
      targetModels: activeVersion
        ? [activeVersion.targetModel]
        : selected.targetModels.length
          ? selected.targetModels
          : ["gpt"],
      outputLanguage: getOutputLanguage(selected),
      sourceTitle: `학습 컨텍스트 · ${selected.title}`,
      sourceHref: selectedDetailReturnHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setLearningContextReportCopiedFor("");
      setManualCopy({
        id: "learning-report",
        targetId: selected.id,
        title: "학습 컨텍스트 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-learning-context");
  }

  async function copyNoSourceMetaNote() {
    if (
      !selected ||
      selectedStudioSource ||
      !selectedStudioPersistenceLabel ||
      !selectedStudioPersistenceDescription
    ) {
      return;
    }

    const detailHref = buildCurrentLibraryHref({
      promptId: selected.id,
      version: activeVersion?.targetModel,
      detailMode: activePromptDetailMode,
    });
    const noteText = buildNoSourceMetaNote({
      baseUrl: window.location.origin,
      detailHref,
      prompt: selected,
      sourceDescription: selectedStudioPersistenceDescription,
      sourceLabel: selectedStudioPersistenceLabel,
      version: activeVersion,
    });
    const copiedToClipboard = await copyLibraryText({
      id: "no-source-meta-note",
      targetId: selected.id,
      title: "저장 출처 없음 메모",
      body: noteText,
    });

    setNoSourceMetaNoteCopiedFor(copiedToClipboard ? selected.id : "");
  }

  function openNoSourceMetaNoteInStudio() {
    if (
      !selected ||
      selectedStudioSource ||
      !selectedStudioPersistenceLabel ||
      !selectedStudioPersistenceDescription
    ) {
      return;
    }

    const detailHref = buildCurrentLibraryHref({
      promptId: selected.id,
      version: activeVersion?.targetModel,
      detailMode: activePromptDetailMode,
    });
    const noteText = buildNoSourceMetaNote({
      baseUrl: window.location.origin,
      detailHref,
      prompt: selected,
      sourceDescription: selectedStudioPersistenceDescription,
      sourceLabel: selectedStudioPersistenceLabel,
      version: activeVersion,
    });

    const wroteDraft = writeStudioDraft({
      source: "library-no-source-meta",
      rawInput: noteText,
      goal: "저장 출처 메타 없음 저장본 운영 기준 정리",
      domain: selected.domain || "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle: `저장 출처 메타 없음 · ${selected.title}`,
      sourceHref: detailHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setNoSourceMetaNoteCopiedFor("");
      setManualCopy({
        id: "no-source-meta-note",
        targetId: selected.id,
        title: "저장 출처 없음 메모",
        body: noteText,
      });
      return;
    }

    router.push("/studio?draft=library-no-source-meta");
  }

  async function copySelectedStudioPersistenceFilterLink() {
    if (!selected || !selectedStudioPersistenceFilterHref) {
      return;
    }

    const linkText =
      formatAbsoluteInternalHref(
        selectedStudioPersistenceFilterHref,
        window.location.origin,
      ) ?? selectedStudioPersistenceFilterHref;
    const copyBody = [
      linkText,
      "",
      `- 프롬프트: ${selected.title}`,
      selectedStudioPersistenceLabel
        ? `- 저장 방식: ${selectedStudioPersistenceLabel}`
        : undefined,
      selectedStudioSourceLabel
        ? `- 저장 출처: ${selectedStudioSourceLabel.label}`
        : undefined,
      selectedStudioSource?.sourceTitle
        ? `- 출처 제목: ${selectedStudioSource.sourceTitle}`
        : undefined,
      selectedOperationalSummary?.sourceVariantLabel
        ? `- 세부 초안 유형: ${selectedOperationalSummary.sourceVariantLabel}`
        : undefined,
      `- 조건: 같은 저장 방식`,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyLibraryText({
      id: "selected-studio-persistence-link",
      targetId: selected.id,
      title: "같은 저장 방식 조건 링크",
      body: copyBody,
    });

    setSelectedStudioPersistenceLinkCopiedFor(
      copiedToClipboard ? selected.id : "",
    );
  }

  async function copySelectedOperationalSummaryFilterLink({
    href,
    id,
    setCopiedFor,
    title,
    conditionLabel,
  }: {
    conditionLabel: string;
    href?: string;
    id: LibraryManualCopy["id"];
    setCopiedFor: (targetId: string) => void;
    title: string;
  }) {
    if (!selected || !href) {
      return;
    }

    const linkText =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copyBody = [
      linkText,
      "",
      `- 프롬프트: ${selected.title}`,
      selectedOperationalSummary
        ? `- 저장 방식: ${selectedOperationalSummary.persistenceLabel}`
        : undefined,
      selectedOperationalSummary
        ? `- 저장 출처: ${selectedOperationalSummary.sourceLabel}`
        : undefined,
      selectedOperationalSummary?.sourceTitle
        ? `- 출처 제목: ${selectedOperationalSummary.sourceTitle}`
        : undefined,
      selectedOperationalSummary?.sourceVariantLabel
        ? `- 세부 초안 유형: ${selectedOperationalSummary.sourceVariantLabel}`
        : undefined,
      `- 조건: ${conditionLabel}`,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyLibraryText({
      id,
      targetId: selected.id,
      title,
      body: copyBody,
    });

    setCopiedFor(copiedToClipboard ? selected.id : "");
  }

  async function copySelectedOperationalGroupFilterLink() {
    await copySelectedOperationalSummaryFilterLink({
      conditionLabel: selectedStudioSourceHasVariant
        ? "같은 세부 유형 운영 묶음"
        : "같은 운영 묶음",
      href: selectedStudioOperationalGroupHref,
      id: "selected-operational-group-link",
      setCopiedFor: setSelectedOperationalGroupLinkCopiedFor,
      title: selectedStudioOperationalGroupLinkTitle,
    });
  }

  async function copySelectedOperationalSourceFilterLink() {
    await copySelectedOperationalSummaryFilterLink({
      conditionLabel: selectedStudioSourceHasVariant
        ? "같은 세부 유형 출처"
        : "같은 저장 출처",
      href: selectedStudioSourceFilterHref,
      id: "selected-operational-source-link",
      setCopiedFor: setSelectedOperationalSourceLinkCopiedFor,
      title: selectedStudioSourceLinkTitle,
    });
  }

  async function copySelectedOperationalPersistenceFilterLink() {
    await copySelectedOperationalSummaryFilterLink({
      conditionLabel: "같은 저장 방식",
      href: selectedStudioPersistenceFilterHref,
      id: "selected-operational-persistence-link",
      setCopiedFor: setSelectedOperationalPersistenceLinkCopiedFor,
      title: "같은 저장 방식 조건 링크",
    });
  }

  async function copyListStudioFilterLink({
    bodyLines,
    href,
    id,
    promptId,
    setCopiedFor,
    title,
  }: {
    bodyLines?: string[];
    href?: string;
    id: LibraryManualCopy["id"];
    promptId: string;
    setCopiedFor: (targetId: string) => void;
    title: string;
  }) {
    if (!href) {
      return;
    }

    const linkText =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copyBody = bodyLines?.length
      ? [linkText, "", ...bodyLines].join("\n")
      : linkText;
    const copiedToClipboard = await copyLibraryText({
      id,
      targetId: promptId,
      title,
      body: copyBody,
    });

    setCopiedFor(copiedToClipboard ? promptId : "");
  }

  async function copySelectedStudioSourceFilterLink() {
    if (!selected || !selectedStudioSourceFilterHref) {
      return;
    }

    const linkText =
      formatAbsoluteInternalHref(
        selectedStudioSourceFilterHref,
        window.location.origin,
      ) ?? selectedStudioSourceFilterHref;
    const copyBody = [
      linkText,
      "",
      `- 프롬프트: ${selected.title}`,
      selectedStudioPersistenceLabel
        ? `- 저장 방식: ${selectedStudioPersistenceLabel}`
        : undefined,
      selectedStudioSourceLabel
        ? `- 저장 출처: ${selectedStudioSourceLabel.label}`
        : undefined,
      selectedStudioSource?.sourceTitle
        ? `- 출처 제목: ${selectedStudioSource.sourceTitle}`
        : undefined,
      selectedOperationalSummary?.sourceVariantLabel
        ? `- 세부 초안 유형: ${selectedOperationalSummary.sourceVariantLabel}`
        : undefined,
      `- 조건: ${
        selectedStudioSourceHasVariant ? "같은 세부 유형 출처" : "같은 저장 출처"
      }`,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyLibraryText({
      id: "selected-studio-source-link",
      targetId: selected.id,
      title: selectedStudioSourceLinkTitle,
      body: copyBody,
    });

    setSelectedStudioSourceLinkCopiedFor(copiedToClipboard ? selected.id : "");
  }

  async function copySelectedStudioSourceOriginalLink() {
    if (!selected || !selectedStudioSourceHref) {
      return;
    }

    const linkText =
      formatAbsoluteInternalHref(
        selectedStudioSourceHref,
        window.location.origin,
      ) ?? selectedStudioSourceHref;
    const copyBody = [
      linkText,
      "",
      `- 프롬프트: ${selected.title}`,
      selectedStudioSourceLabel
        ? `- 저장 출처: ${selectedStudioSourceLabel.label}`
        : undefined,
      selectedStudioSource?.sourceTitle
        ? `- 출처 제목: ${selectedStudioSource.sourceTitle}`
        : undefined,
      `- 원본 경로: ${selectedStudioSourceHref}`,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyLibraryText({
      id: "selected-studio-source-original-link",
      targetId: selected.id,
      title: "원본 경로 링크",
      body: copyBody,
    });

    setSelectedStudioSourceOriginalLinkCopiedFor(
      copiedToClipboard ? selected.id : "",
    );
  }

  async function copyComparisonBrief() {
    if (!selectedPromptComparisonBrief) {
      return;
    }

    const copiedToClipboard = await copyLibraryText({
      id: "comparison-brief",
      title: "비교 브리프",
      body: selectedPromptComparisonBrief,
    });

    setComparisonBriefCopied(copiedToClipboard);
  }

  function openImprovementInStudio() {
    if (!selected || !activeVersion) {
      return;
    }

    const rawInput = buildImprovementBrief({
      actions: improvementActions,
      prompt: selected,
      version: activeVersion,
    });
    const wroteDraft = writeStudioDraft({
      source: "library-improvement",
      rawInput,
      goal: "프롬프트 개선",
      domain: selected.domain,
      targetModels: [activeVersion.targetModel],
      outputLanguage: getOutputLanguage(selected),
      sourcePromptId: selected.id,
      sourceVersionId: activeVersion.id,
      sourceVersionModel: activeVersion.targetModel,
      sourceTitle: selected.title,
      sourceHref: buildCurrentLibraryHref({
        promptId: selected.id,
        version: activeVersion.targetModel,
        detailMode: activePromptDetailMode,
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setImprovementBriefCopied(false);
      setManualCopy({
        id: "improvement-brief",
        targetId: selected.id,
        title: "개선 브리프",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-improvement");
  }

  function openFeedbackImprovementInStudio(feedback: Feedback) {
    if (!selected) {
      return;
    }

    const feedbackVersion =
      selected.versions.find((version) => version.id === feedback.promptVersionId) ??
      activeVersion;

    if (!feedbackVersion) {
      return;
    }

    const rawInput = buildImprovementBrief({
      actions: getImprovementActions(feedbackVersion),
      feedback,
      prompt: selected,
      version: feedbackVersion,
    });
    const wroteDraft = writeStudioDraft({
      source: "library-improvement",
      sourceVariant: "feedback-improvement",
      rawInput,
      goal: "프롬프트 개선",
      domain: selected.domain,
      targetModels: [feedbackVersion.targetModel],
      outputLanguage: getOutputLanguage(selected),
      sourcePromptId: selected.id,
      sourceVersionId: feedbackVersion.id,
      sourceVersionModel: feedbackVersion.targetModel,
      sourceFeedback: {
        id: feedback.id,
        promptVersionId: feedback.promptVersionId,
        rating: feedback.rating,
        feedbackType: feedback.feedbackType,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
      },
      sourceTitle: selected.title,
      sourceHref: buildCurrentLibraryHref({
        promptId: selected.id,
        version: feedbackVersion.targetModel,
        detailMode: activePromptDetailMode,
        focusTarget: "feedback",
        feedbackId: feedback.id,
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setManualCopy({
        id: "improvement-brief",
        targetId: feedback.id,
        title: "피드백 개선 브리프",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-improvement");
  }

  function openCompanyContextImprovementInStudio() {
    setCompanyUpdateNoticeVisible(false);
    openImprovementInStudio();
  }

  function openProfileContextImprovementInStudio() {
    setProfileUpdateNoticeVisible(false);
    openImprovementInStudio();
  }

  function openComparisonImprovementInStudio() {
    if (
      !selected ||
      !selectedImprovementQualityDelta ||
      !selectedPromptComparisonBrief
    ) {
      return;
    }

    const { improvedVersion } = selectedImprovementQualityDelta;

    const wroteDraft = writeStudioDraft({
      source: "library-improvement",
      rawInput: selectedPromptComparisonBrief,
      goal: "프롬프트 재개선",
      domain: selected.domain,
      targetModels: [improvedVersion.targetModel],
      outputLanguage: getOutputLanguage(selected),
      sourcePromptId: selected.id,
      sourceVersionId: improvedVersion.id,
      sourceVersionModel: improvedVersion.targetModel,
      sourceTitle: selected.title,
      sourceHref: buildCurrentLibraryHref({
        promptId: selected.id,
        version: improvedVersion.targetModel,
        detailMode: "comparison",
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setComparisonBriefCopied(false);
      setManualCopy({
        id: "comparison-brief",
        targetId: selected.id,
        title: "비교 브리프",
        body: selectedPromptComparisonBrief,
      });
      return;
    }

    router.push("/studio?draft=library-improvement");
  }

  function renderStudioVariantSummaryLinks(
    links: typeof studioSourceVariantSummaryLinks,
  ) {
    if (!links.length) {
      return null;
    }

    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs leading-5">
        <span className="font-semibold text-soft">세부 초안 유형</span>
        {links.map((variant) => (
          <span
            key={variant.sourceVariant}
            className="inline-flex items-center gap-1 rounded border border-line bg-panel px-1.5 py-0.5"
          >
            <Link
              href={variant.href}
              className="font-semibold text-soft transition hover:text-accent"
            >
              {variant.label} {variant.count}개
            </Link>
            <button
              type="button"
              data-testid="library-studio-variant-filter-link-copy"
              className="font-semibold text-accent transition hover:text-soft"
              onClick={() => copyStudioVariantFilterLink(variant)}
            >
              {studioVariantLinkCopiedFor === variant.sourceVariant
                ? "복사됨"
                : manualCopy?.id === "studio-variant-link" &&
                    manualCopy.targetId === variant.sourceVariant
                  ? "실패"
                  : "복사"}
            </button>
          </span>
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="프롬프트 라이브러리"
        description="저장된 프롬프트를 검색하고, 언어 전략과 AI별 버전을 확인하며, 피드백을 학습 데이터로 축적합니다."
        action={
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={() => setImportDialogOpen(true)}
          >
            가져오기
          </button>
        }
      />

      <PromptImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={importPrompt}
      />

      {companyUpdateNoticeVisible ? (
        <div className="mb-5 rounded-md border border-line bg-surface px-4 py-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-soft">
                회사 기준이 업데이트됐습니다.
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                현재 프롬프트를 Studio에서 개선하면 새 회사 맥락을 반영한
                버전을 만들 수 있습니다.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                className={secondaryButtonClass}
                type="button"
                onClick={clearCompanyUpdateNotice}
              >
                알림 닫기
              </button>
              <button
                className={primaryButtonClass}
                type="button"
                onClick={openCompanyContextImprovementInStudio}
                disabled={!selected || !activeVersion}
              >
                Studio에서 회사 기준 반영
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {profileUpdateNoticeVisible ? (
        <div className="mb-5 rounded-md border border-line bg-surface px-4 py-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-soft">
                개인 프로필이 업데이트됐습니다.
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                현재 프롬프트를 Studio에서 개선하면 새 역할, 산업, 목표,
                선호 톤을 반영한 버전을 만들 수 있습니다.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                className={secondaryButtonClass}
                type="button"
                onClick={clearProfileUpdateNotice}
              >
                알림 닫기
              </button>
              <button
                className={primaryButtonClass}
                type="button"
                onClick={openProfileContextImprovementInStudio}
                disabled={!selected || !activeVersion}
              >
                Studio에서 개인 기준 반영
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {hasActiveFilters ? (
        <div className="mb-5 rounded-md border border-line bg-surface px-4 py-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-soft">현재 보기</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeFilterItems.map((item) => renderFilterChip(item))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <p className="font-mono text-sm text-accent">
                결과 {filtered.length}개
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={copyFilterLink}
                >
                  {filterLinkCopied
                    ? "링크 복사됨"
                    : manualCopy?.id === "filter-link"
                      ? "공유 링크 복사 실패"
                      : "공유 링크 복사"}
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={resetFilters}
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
          {manualCopy?.id === "filter-link" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {sourceReasonFilter !== "all" ? (
        <div
          data-testid="library-source-reason-action"
          className="mb-5 rounded-md border border-line bg-surface px-4 py-3"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-soft">
                출처 사유 조치
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {sourceReasonFilterLabels[sourceReasonFilter]} 기준으로 현재
                Library 결과 {filtered.length}개를 복원/백업 확인 리포트로
                정리합니다.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copySourceReasonFilterLink}
                data-testid="library-source-reason-action-link"
              >
                {filterLinkCopied
                  ? "출처 사유 링크 복사됨"
                  : manualCopy?.id === "source-health-filter-link"
                    ? "출처 사유 링크 복사 실패"
                    : "출처 사유 링크 복사"}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copySourceReasonFilterReport}
              >
                {sourceHealthReportCopied
                  ? "조치 리포트 복사됨"
                  : manualCopy?.id === "source-health-filter-report"
                    ? "조치 리포트 복사 실패"
                    : "조치 리포트 복사"}
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={openSourceReasonFilterReportInStudio}
              >
                Studio로 보내기
              </button>
            </div>
          </div>
          <div
            data-testid="library-source-reason-candidates"
            className="mt-3 rounded-md border border-line bg-panel px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-soft">대표 후보</p>
              <span className="font-mono text-[11px] text-muted">
                {sourceReasonActionCandidates.length}/{filtered.length}
              </span>
            </div>
            {sourceReasonActionCandidates.length ? (
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {sourceReasonActionCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-md border border-line bg-surface px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 min-w-0 break-words text-xs font-semibold text-soft">
                        {candidate.title}
                      </p>
                      <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] text-muted">
                        {candidate.sourceStatus}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 break-words text-[11px] text-muted">
                      원본 · {candidate.sourceTitle}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                      <Link
                        href={candidate.detailHref}
                        className={secondaryButtonClass}
                      >
                        보기
                      </Link>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => copySourceReasonCandidateLink(candidate)}
                        data-testid="library-source-reason-candidate-link"
                      >
                        {sourceHealthCandidateLinkCopiedId === candidate.id
                          ? "상세 링크 복사됨"
                          : manualCopy?.id ===
                                "source-health-candidate-link" &&
                              manualCopy.targetId === candidate.id
                            ? "상세 링크 복사 실패"
                            : "상세 링크 복사"}
                      </button>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => copySourceReasonCandidateNote(candidate)}
                      >
                        {sourceHealthCandidateCopiedId === candidate.id
                          ? "메모 복사됨"
                          : manualCopy?.id ===
                                "source-health-candidate-note" &&
                              manualCopy.targetId === candidate.id
                            ? "메모 복사 실패"
                            : "메모 복사"}
                      </button>
                      <button
                        type="button"
                        className={primaryButtonClass}
                        onClick={() =>
                          openSourceReasonCandidateInStudio(candidate)
                        }
                      >
                        Studio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-muted">
                현재 조건에 해당하는 대표 후보가 없습니다. Dashboard 또는
                백업 복원 후 다시 확인하세요.
              </p>
            )}
          </div>
          {manualCopy?.id === "source-health-filter-link" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "source-health-filter-report" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "source-health-candidate-note" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {studioPersistenceFilter !== "all" && studioSourceFilter !== "all" ? (
        <div
          data-testid="library-studio-operational-group-action"
          className="mb-5 rounded-md border border-line bg-surface px-4 py-3"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-soft">
                Studio 운영 묶음 조치
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {studioPersistenceFilterLabels[studioPersistenceFilter]} ·{" "}
                {getStudioSourceFilterLabel(studioSourceFilter)} 조건이 함께
                적용된 Library 결과 {filtered.length}개를 운영 묶음
                리포트로 정리합니다.
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">
                같은 기능 흐름과 같은 저장 방식이 모두 맞는 후보만 유지,
                재분류, 재개선 기준으로 점검합니다.
              </p>
              {renderStudioVariantSummaryLinks(studioSourceVariantSummaryLinks)}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioOperationalGroupFilterLink}
                data-testid="library-studio-operational-group-action-link"
              >
                {filterLinkCopied
                  ? "운영 묶음 링크 복사됨"
                  : manualCopy?.id === "studio-operational-group-link"
                    ? "운영 묶음 링크 복사 실패"
                    : "운영 묶음 링크 복사"}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioOperationalGroupReport}
                data-testid="library-studio-operational-group-action-copy"
              >
                {studioOperationalGroupReportCopied
                  ? "운영 묶음 리포트 복사됨"
                  : manualCopy?.id === "studio-operational-group-report"
                    ? "운영 묶음 리포트 복사 실패"
                    : "운영 묶음 리포트 복사"}
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={openStudioOperationalGroupReportInStudio}
                data-testid="library-studio-operational-group-action-studio"
              >
                Studio로 보내기
              </button>
            </div>
          </div>
          {manualCopy?.id === "studio-operational-group-link" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "studio-operational-group-report" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {studioPersistenceFilter !== "all" ? (
        <div
          data-testid="library-studio-persistence-action"
          className="mb-5 rounded-md border border-line bg-surface px-4 py-3"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-soft">
                {studioPersistenceFilter === "none"
                  ? "저장 출처 메타 없음 큐"
                  : "Studio 저장 방식 조치"}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {studioPersistenceFilter === "none"
                  ? `현재 Library 결과 ${filtered.length}개를 저장 출처 메타 없음 큐로 정리합니다.`
                  : `${studioPersistenceFilterLabels[studioPersistenceFilter]} 기준으로 현재 Library 결과 ${filtered.length}개를 저장 방식 리포트로 정리합니다.`}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">
                {studioPersistenceFilterDescriptions[studioPersistenceFilter]}
              </p>
              {renderStudioVariantSummaryLinks(
                studioPersistenceVariantSummaryLinks,
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioPersistenceFilterLink}
                data-testid="library-studio-persistence-action-link"
              >
                {filterLinkCopied
                  ? studioPersistenceFilter === "none"
                    ? "큐 링크 복사됨"
                    : "저장 방식 링크 복사됨"
                  : manualCopy?.id === "studio-persistence-link"
                    ? studioPersistenceFilter === "none"
                      ? "큐 링크 복사 실패"
                      : "저장 방식 링크 복사 실패"
                    : studioPersistenceFilter === "none"
                      ? "큐 링크 복사"
                      : "저장 방식 링크 복사"}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioPersistenceFilterReport}
                data-testid="library-studio-persistence-action-copy"
              >
                {studioPersistenceReportCopied
                  ? studioPersistenceFilter === "none"
                    ? "큐 리포트 복사됨"
                    : "저장 방식 리포트 복사됨"
                  : manualCopy?.id === "studio-persistence-report"
                    ? studioPersistenceFilter === "none"
                      ? "큐 리포트 복사 실패"
                      : "저장 방식 리포트 복사 실패"
                    : studioPersistenceFilter === "none"
                      ? "큐 리포트 복사"
                      : "저장 방식 리포트 복사"}
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={openStudioPersistenceFilterReportInStudio}
                data-testid="library-studio-persistence-action-studio"
              >
                Studio로 보내기
              </button>
            </div>
          </div>
          <div
            data-testid="library-studio-persistence-candidates"
            className="mt-3 rounded-md border border-line bg-panel px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-soft">대표 후보</p>
              <span className="font-mono text-[11px] text-muted">
                {studioPersistenceActionCandidates.length}/{filtered.length}
              </span>
            </div>
            {studioPersistenceActionCandidates.length ? (
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {studioPersistenceActionCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-md border border-line bg-surface px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 min-w-0 break-words text-xs font-semibold text-soft">
                        {candidate.title}
                      </p>
                      <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] text-muted">
                        {candidate.sourceLabel}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 break-words text-[11px] text-muted">
                      출처 · {candidate.sourceTitle}
                    </p>
                    {candidate.sourceVariantLabel ? (
                      <p className="mt-1 line-clamp-1 break-words text-[11px] text-soft">
                        세부 유형 · {candidate.sourceVariantLabel}
                      </p>
                    ) : null}
                    <p className="mt-1 line-clamp-2 break-words text-[11px] leading-4 text-muted">
                      {candidate.sourceDescription}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
                      <Link
                        href={candidate.detailHref}
                        className={secondaryButtonClass}
                      >
                        상세
                      </Link>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        data-testid="library-studio-persistence-candidate-copy"
                        onClick={() =>
                          copyStudioPersistenceCandidateNote(candidate)
                        }
                      >
                        {studioPersistenceCandidateCopiedId === candidate.id
                          ? studioPersistenceFilter === "none"
                            ? "후보 메모 복사됨"
                            : "메모 복사됨"
                          : manualCopy?.id ===
                                "studio-persistence-candidate-note" &&
                              manualCopy.targetId === candidate.id
                            ? studioPersistenceFilter === "none"
                              ? "후보 메모 복사 실패"
                              : "메모 복사 실패"
                            : studioPersistenceFilter === "none"
                              ? "후보 메모 복사"
                              : "메모 복사"}
                      </button>
                      <button
                        type="button"
                        className={primaryButtonClass}
                        data-testid="library-studio-persistence-candidate-studio"
                        onClick={() =>
                          openStudioPersistenceCandidateInStudio(candidate)
                        }
                      >
                        Studio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-muted">
                현재 조건에 해당하는 대표 후보가 없습니다.
              </p>
            )}
          </div>
          {manualCopy?.id === "studio-persistence-link" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "studio-persistence-report" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "studio-persistence-candidate-note" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {studioSourceFilter !== "all" ? (
        <div
          data-testid="library-studio-source-action"
          className="mb-5 rounded-md border border-line bg-surface px-4 py-3"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-soft">
                Studio 저장 출처 조치
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {getStudioSourceFilterLabel(studioSourceFilter)} 기준으로 현재
                Library 결과 {filtered.length}개를 저장 출처 리포트로
                정리합니다.
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">
                같은 기능 흐름에서 저장된 프롬프트를 묶어 출처 링크, 개선
                체인 여부, 운영 목적을 함께 점검합니다.
              </p>
              {renderStudioVariantSummaryLinks(studioSourceVariantSummaryLinks)}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioSourceFilterLink}
                data-testid="library-studio-source-action-link"
              >
                {filterLinkCopied
                  ? "저장 출처 링크 복사됨"
                  : manualCopy?.id === "studio-source-link"
                    ? "저장 출처 링크 복사 실패"
                    : "저장 출처 링크 복사"}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioSourceFilterReport}
                data-testid="library-studio-source-action-copy"
              >
                {studioSourceReportCopied
                  ? "저장 출처 리포트 복사됨"
                  : manualCopy?.id === "studio-source-report"
                    ? "저장 출처 리포트 복사 실패"
                    : "저장 출처 리포트 복사"}
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={openStudioSourceFilterReportInStudio}
                data-testid="library-studio-source-action-studio"
              >
                Studio로 보내기
              </button>
            </div>
          </div>
          <div
            data-testid="library-studio-source-candidates"
            className="mt-3 rounded-md border border-line bg-panel px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-soft">대표 후보</p>
              <span className="font-mono text-[11px] text-muted">
                {studioSourceActionCandidates.length}/{filtered.length}
              </span>
            </div>
            {studioSourceActionCandidates.length ? (
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {studioSourceActionCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-md border border-line bg-surface px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 min-w-0 break-words text-xs font-semibold text-soft">
                        {candidate.title}
                      </p>
                      <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] text-muted">
                        {candidate.sourceLabel}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 break-words text-[11px] text-muted">
                      출처 · {candidate.sourceTitle}
                    </p>
                    {candidate.sourceVariantLabel ? (
                      <p className="mt-1 line-clamp-1 break-words text-[11px] text-soft">
                        세부 유형 · {candidate.sourceVariantLabel}
                      </p>
                    ) : null}
                    <div className="mt-3 grid gap-2 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
                      <Link
                        href={candidate.detailHref}
                        className={secondaryButtonClass}
                      >
                        상세
                      </Link>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        data-testid="library-studio-source-candidate-copy"
                        onClick={() => copyStudioSourceCandidateNote(candidate)}
                      >
                        {studioSourceCandidateCopiedId === candidate.id
                          ? "메모 복사됨"
                          : manualCopy?.id ===
                                "studio-source-candidate-note" &&
                              manualCopy.targetId === candidate.id
                            ? "메모 복사 실패"
                            : "메모 복사"}
                      </button>
                      <button
                        type="button"
                        className={primaryButtonClass}
                        data-testid="library-studio-source-candidate-studio"
                        onClick={() =>
                          openStudioSourceCandidateInStudio(candidate)
                        }
                      >
                        Studio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-muted">
                현재 조건에 해당하는 대표 후보가 없습니다.
              </p>
            )}
          </div>
          {manualCopy?.id === "studio-source-link" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "studio-source-report" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "studio-source-candidate-note" ? (
            <div className="mt-3">
              <ManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {manualCopy?.id === "studio-variant-link" ? (
        <div className="mb-5">
          <ManualCopyPanel
            copy={manualCopy}
            onClose={() => setManualCopy(null)}
          />
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[380px_1fr]">
        <LibraryFiltersPanel
          activeFilterItems={activeFilterItems}
          allTags={allTags}
          handleTagFilterChange={handleTagFilterChange}
          tagFilter={tagFilter}
          cancelDeletedPromptRemove={cancelDeletedPromptRemove}
          confirmDeletedPromptRemove={confirmDeletedPromptRemove}
          copyFilterLink={copyFilterLink}
          copyListStudioFilterLink={copyListStudioFilterLink}
          deletedPromptArchiveExpanded={deletedPromptArchiveExpanded}
          deletedPromptArchiveQuery={deletedPromptArchiveQuery}
          deletedPromptRecoveryId={deletedPromptRecoveryId}
          deletedPromptRemoveCandidate={deletedPromptRemoveCandidate}
          deletedPromptTitle={deletedPromptTitle}
          deletedPrompts={deletedPrompts}
          filterLinkCopied={filterLinkCopied}
          filtered={filtered}
          filteredDeletedPrompts={filteredDeletedPrompts}
          generationEngineFilter={generationEngineFilter}
          generationEngineFilterCounts={generationEngineFilterCounts}
          handleImprovementFilterChange={handleImprovementFilterChange}
          handlePromptSelect={handlePromptSelect}
          handleQueryChange={handleQueryChange}
          handleSortChange={handleSortChange}
          handleSourceReasonFilterChange={handleSourceReasonFilterChange}
          handleStudioPersistenceFilterChange={handleStudioPersistenceFilterChange}
          handleStudioSourceFilterChange={handleStudioSourceFilterChange}
          handleStudioSourceVariantFilterChange={handleStudioSourceVariantFilterChange}
          hasActiveFilters={hasActiveFilters}
          improvementFilter={improvementFilter}
          improvementFilterCounts={improvementFilterCounts}
          languageFilter={languageFilter}
          languageFilterCounts={languageFilterCounts}
          learningScopeFilter={learningScopeFilter}
          learningScopeFilterCounts={learningScopeFilterCounts}
          listStudioOperationalGroupLinkCopiedFor={listStudioOperationalGroupLinkCopiedFor}
          listStudioPersistenceLinkCopiedFor={listStudioPersistenceLinkCopiedFor}
          listStudioSourceLinkCopiedFor={listStudioSourceLinkCopiedFor}
          listStudioSourceOriginalLinkCopiedFor={listStudioSourceOriginalLinkCopiedFor}
          manualCopy={manualCopy}
          openDeletedPromptArchive={openDeletedPromptArchive}
          outputLanguageFilter={outputLanguageFilter}
          outputLanguageFilterCounts={outputLanguageFilterCounts}
          prompts={prompts}
          query={query}
          renderFilterChip={renderFilterChip}
          requestDeletedPromptRemove={requestDeletedPromptRemove}
          resetFilters={resetFilters}
          restoreDeletedPrompt={restoreDeletedPrompt}
          selected={selected}
          setActiveModel={setActiveModel}
          setComparisonBriefCopied={setComparisonBriefCopied}
          setContextQuestionsCopied={setContextQuestionsCopied}
          setCopied={setCopied}
          setDeletedPromptArchiveQuery={setDeletedPromptArchiveQuery}
          setDetailLinkCopied={setDetailLinkCopied}
          setFilterLinkCopied={setFilterLinkCopied}
          setGenerationEngineFilter={setGenerationEngineFilter}
          setImprovementBriefCopied={setImprovementBriefCopied}
          setLanguageFilter={setLanguageFilter}
          setLearningScopeFilter={setLearningScopeFilter}
          setListStudioOperationalGroupLinkCopiedFor={setListStudioOperationalGroupLinkCopiedFor}
          setListStudioPersistenceLinkCopiedFor={setListStudioPersistenceLinkCopiedFor}
          setListStudioSourceLinkCopiedFor={setListStudioSourceLinkCopiedFor}
          setListStudioSourceOriginalLinkCopiedFor={setListStudioSourceOriginalLinkCopiedFor}
          setManualCopy={setManualCopy}
          setOutputLanguageFilter={setOutputLanguageFilter}
          setPromptDetailMode={setPromptDetailMode}
          setSelectedId={setSelectedId}
          setTargetModelFilter={setTargetModelFilter}
          sortMode={sortMode}
          sourceReasonFilter={sourceReasonFilter}
          sourceReasonFilterCounts={sourceReasonFilterCounts}
          studioPersistenceFilter={studioPersistenceFilter}
          studioPersistenceFilterCounts={studioPersistenceFilterCounts}
          studioSourceFilter={studioSourceFilter}
          studioSourceFilterCounts={studioSourceFilterCounts}
          studioSourceVariantFilter={studioSourceVariantFilter}
          studioSourceVariantFilterCounts={studioSourceVariantFilterCounts}
          syncFilterUrl={syncFilterUrl}
          targetModelFilter={targetModelFilter}
          targetModelFilterCounts={targetModelFilterCounts}
          toggleDeletedPromptArchive={toggleDeletedPromptArchive}
          undoPromptDelete={undoPromptDelete}
          visibleDeletedPrompts={visibleDeletedPrompts}
        />

        <LibraryDetailWorkspace
          activePromptDetailMode={activePromptDetailMode}
          activeTargetAiHandoffPackageText={activeTargetAiHandoffPackageText}
          activeTargetAiHandoffReadinessItems={activeTargetAiHandoffReadinessItems}
          activeTargetAiPackageCopyKey={activeTargetAiPackageCopyKey}
          activeVersion={activeVersion}
          addFeedback={addFeedback}
          addPromptTag={addPromptTag}
          removePromptTag={removePromptTag}
          newTagInput={newTagInput}
          setNewTagInput={setNewTagInput}
          isSelectedPinned={selected ? isPromptPinned(selected) : false}
          togglePromptPin={togglePromptPin}
          duplicateSelectedPrompt={duplicateSelectedPrompt}
          cancelPromptDelete={cancelPromptDelete}
          comment={comment}
          companyContextHref={companyContextHref}
          comparisonBriefCopied={comparisonBriefCopied}
          confirmPromptDelete={confirmPromptDelete}
          contextQuestionsCopied={contextQuestionsCopied}
          contextQuestionsCopyFailed={contextQuestionsCopyFailed}
          copied={copied}
          copyComparisonBrief={copyComparisonBrief}
          copyDetailLink={copyDetailLink}
          copyImprovementBrief={copyImprovementBrief}
          copyLearningContextReport={copyLearningContextReport}
          copyMissingContextQuestions={copyMissingContextQuestions}
          copyNoSourceMetaNote={copyNoSourceMetaNote}
          copyPrompt={copyPrompt}
          copySelectedOperationalGroupFilterLink={copySelectedOperationalGroupFilterLink}
          copySelectedOperationalPersistenceFilterLink={copySelectedOperationalPersistenceFilterLink}
          copySelectedOperationalSourceFilterLink={copySelectedOperationalSourceFilterLink}
          copySelectedOperationalSummaryReport={copySelectedOperationalSummaryReport}
          copySelectedStudioPersistenceFilterLink={copySelectedStudioPersistenceFilterLink}
          copySelectedStudioSourceFilterLink={copySelectedStudioSourceFilterLink}
          copySelectedStudioSourceOriginalLink={copySelectedStudioSourceOriginalLink}
          copyTargetAiHandoffImprovementBrief={copyTargetAiHandoffImprovementBrief}
          copyTargetAiHandoffPackage={copyTargetAiHandoffPackage}
          deletePromptCandidate={deletePromptCandidate}
          deletedSourcePrompt={deletedSourcePrompt}
          detailLinkCopied={detailLinkCopied}
          feedbackType={feedbackType}
          getLinkedImprovementPromptCount={getLinkedImprovementPromptCount}
          handlePromptDetailModeChange={handlePromptDetailModeChange}
          handleVersionChange={handleVersionChange}
          highlightedFeedbackId={highlightedFeedbackId}
          improvementActions={improvementActions}
          improvementBriefCopied={improvementBriefCopied}
          latestFeedbackId={latestFeedbackId}
          learningContextReportCopiedFor={learningContextReportCopiedFor}
          linkedImprovementPrompts={linkedImprovementPrompts}
          loadSampleWorkspace={loadSampleWorkspace}
          manualCopy={manualCopy}
          noSourceMetaNoteCopiedFor={noSourceMetaNoteCopiedFor}
          openComparisonImprovementInStudio={openComparisonImprovementInStudio}
          openFeedbackImprovementInStudio={openFeedbackImprovementInStudio}
          openImprovementInStudio={openImprovementInStudio}
          openLearningContextReportInStudio={openLearningContextReportInStudio}
          openNoSourceMetaNoteInStudio={openNoSourceMetaNoteInStudio}
          openPromptDetail={openPromptDetail}
          openPromptFeedbackDetail={openPromptFeedbackDetail}
          openSelectedOperationalSummaryReportInStudio={openSelectedOperationalSummaryReportInStudio}
          openTargetAiHandoffImprovementInStudio={openTargetAiHandoffImprovementInStudio}
          profileContextHref={profileContextHref}
          prompts={prompts}
          rating={rating}
          requestSelectedPromptDelete={requestSelectedPromptDelete}
          restoreDeletedPrompt={restoreDeletedPrompt}
          runSelectedOperationalSummaryAction={runSelectedOperationalSummaryAction}
          selected={selected}
          selectedImprovementDepth={selectedImprovementDepth}
          selectedImprovementLineage={selectedImprovementLineage}
          selectedImprovementQualityDelta={selectedImprovementQualityDelta}
          selectedImprovementScoreComparison={selectedImprovementScoreComparison}
          selectedLearningContextWorkflowSteps={selectedLearningContextWorkflowSteps}
          selectedOperationalGroupLinkCopiedFor={selectedOperationalGroupLinkCopiedFor}
          selectedOperationalPersistenceLinkCopiedFor={selectedOperationalPersistenceLinkCopiedFor}
          selectedOperationalSourceLinkCopiedFor={selectedOperationalSourceLinkCopiedFor}
          selectedOperationalSummary={selectedOperationalSummary}
          selectedOperationalSummaryReportCopiedFor={selectedOperationalSummaryReportCopiedFor}
          selectedOperationalWorkflowSteps={selectedOperationalWorkflowSteps}
          selectedPromptComparisonBrief={selectedPromptComparisonBrief}
          selectedSourceHealthIssueReason={selectedSourceHealthIssueReason}
          selectedStudioOperationalGroupLinkCopiedLabel={selectedStudioOperationalGroupLinkCopiedLabel}
          selectedStudioOperationalGroupLinkCopyLabel={selectedStudioOperationalGroupLinkCopyLabel}
          selectedStudioOperationalGroupLinkFailedLabel={selectedStudioOperationalGroupLinkFailedLabel}
          selectedStudioPersistenceDescription={selectedStudioPersistenceDescription}
          selectedStudioPersistenceFilterHref={selectedStudioPersistenceFilterHref}
          selectedStudioPersistenceLabel={selectedStudioPersistenceLabel}
          selectedStudioPersistenceLinkCopiedFor={selectedStudioPersistenceLinkCopiedFor}
          selectedStudioSource={selectedStudioSource}
          selectedStudioSourceFilterHref={selectedStudioSourceFilterHref}
          selectedStudioSourceHref={selectedStudioSourceHref}
          selectedStudioSourceLabel={selectedStudioSourceLabel}
          selectedStudioSourceLinkCopiedFor={selectedStudioSourceLinkCopiedFor}
          selectedStudioSourceLinkCopiedLabel={selectedStudioSourceLinkCopiedLabel}
          selectedStudioSourceLinkCopyLabel={selectedStudioSourceLinkCopyLabel}
          selectedStudioSourceLinkFailedLabel={selectedStudioSourceLinkFailedLabel}
          selectedStudioSourceLinkOpenLabel={selectedStudioSourceLinkOpenLabel}
          selectedStudioSourceOriginalLinkCopiedFor={selectedStudioSourceOriginalLinkCopiedFor}
          selectedStudioSourcePersistence={selectedStudioSourcePersistence}
          selectedStudioSourceRelationshipDescription={selectedStudioSourceRelationshipDescription}
          setComment={setComment}
          setFeedbackType={setFeedbackType}
          setManualCopy={setManualCopy}
          setRating={setRating}
          setTargetAiPackagePreviewMode={setTargetAiPackagePreviewMode}
          setTargetAiPackagePreviewOpen={setTargetAiPackagePreviewOpen}
          sourcePrompt={sourcePrompt}
          targetAiImprovementBriefCopiedKey={targetAiImprovementBriefCopiedKey}
          targetAiPackageCopiedKey={targetAiPackageCopiedKey}
          targetAiPackagePreviewMode={targetAiPackagePreviewMode}
          targetAiPackagePreviewOpen={targetAiPackagePreviewOpen}
          versionComparisons={versionComparisons}
        />
      </div>
    </>
  );
}
