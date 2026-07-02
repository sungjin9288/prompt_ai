"use client";

import type React from "react";
import {
  Field,
  Panel,
  PanelHeader,
  inputClass,
  secondaryButtonClass,
  selectClass,
} from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import {
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  type PromptAsset,
  type PromptDeletedAsset,
  type TargetModel,
} from "@/lib/prompt";
import {
  formatTargetModels,
  generationEngineLabels,
  generationEngines,
  getPromptStudioSourceMetaLibraryLabel,
  getStudioSourceFilterLabel,
  getStudioSourceVariantFilterLabel,
  improvementFilterLabels,
  improvementFilterModes,
  learningScopeFilterLabels,
  learningScopeFilters,
  librarySortLabels,
  librarySortModes,
  sourceReasonFilterLabels,
  sourceReasonFilterModes,
  studioPersistenceFilterLabels,
  studioPersistenceFilterModes,
  studioSourceFilterModes,
  studioSourceVariantFilterModes,
  type GenerationEngineFilter,
  type ImprovementFilter,
  type LanguageFilter,
  type LearningScopeFilter,
  type LibrarySortMode,
  type OutputLanguageFilter,
  type PromptDetailMode,
  type SourceReasonFilter,
  type StudioPersistenceFilter,
  type StudioSourceFilter,
  type StudioSourceVariantFilter,
  type TargetModelFilter,
} from "@/lib/library/labels";
import {
  formatEnabledMemoryScopes,
  formatLearningContextCount,
  getImprovementQualityDelta,
  getLanguageStrategy,
  getOutputLanguage,
  getPromptBestQuality,
  getPromptImprovementDepth,
  getPromptSourceHealthIssueReason,
} from "@/lib/library/prompt-metrics";
import {
  formatPromptImprovementDepth,
  formatQualityDelta,
  getPromptStudioSourcePersistenceMeta,
} from "@/lib/library/labels";
import { languageStrategies } from "@/lib/prompt";
import { outputLanguages, targetModels } from "@/lib/prompt";
import {
  buildLibraryDefaultFilterHref,
  getPromptStudioPersistenceFilter,
  getPromptStudioSourceHref,
} from "@/lib/library/hrefs";
import type {
  ActiveFilterItem,
  LibraryManualCopy,
} from "./library-view-types";

export interface LibraryFiltersPanelProps {
  prompts: PromptAsset[];
  deletedPrompts: PromptDeletedAsset[];
  filtered: PromptAsset[];
  selected: PromptAsset | undefined;
  query: string;
  sortMode: LibrarySortMode;
  languageFilter: LanguageFilter;
  outputLanguageFilter: OutputLanguageFilter;
  targetModelFilter: TargetModelFilter;
  generationEngineFilter: GenerationEngineFilter;
  learningScopeFilter: LearningScopeFilter;
  improvementFilter: ImprovementFilter;
  sourceReasonFilter: SourceReasonFilter;
  studioPersistenceFilter: StudioPersistenceFilter;
  studioSourceFilter: StudioSourceFilter;
  studioSourceVariantFilter: StudioSourceVariantFilter;
  improvementFilterCounts: Record<ImprovementFilter, number>;
  sourceReasonFilterCounts: Record<SourceReasonFilter, number>;
  studioPersistenceFilterCounts: Record<StudioPersistenceFilter, number>;
  studioSourceFilterCounts: Record<StudioSourceFilter, number>;
  studioSourceVariantFilterCounts: Record<StudioSourceVariantFilter, number>;
  languageFilterCounts: Record<LanguageFilter, number>;
  outputLanguageFilterCounts: Record<OutputLanguageFilter, number>;
  targetModelFilterCounts: Record<TargetModelFilter, number>;
  generationEngineFilterCounts: Record<GenerationEngineFilter, number>;
  learningScopeFilterCounts: Record<LearningScopeFilter, number>;
  activeFilterItems: ActiveFilterItem[];
  hasActiveFilters: boolean;
  manualCopy: LibraryManualCopy | null;
  deletedPromptTitle: string;
  deletedPromptRecoveryId: string;
  deletedPromptArchiveExpanded: boolean;
  deletedPromptArchiveQuery: string;
  deletedPromptRemoveCandidate: PromptDeletedAsset | null;
  filteredDeletedPrompts: PromptDeletedAsset[];
  visibleDeletedPrompts: PromptDeletedAsset[];
  listStudioSourceLinkCopiedFor: string;
  listStudioSourceOriginalLinkCopiedFor: string;
  listStudioPersistenceLinkCopiedFor: string;
  listStudioOperationalGroupLinkCopiedFor: string;
  filterLinkCopied: boolean;
  renderFilterChip: (item: ActiveFilterItem) => React.ReactNode;
  handleQueryChange: (nextQuery: string) => void;
  handleSortChange: (nextSortMode: LibrarySortMode) => void;
  handleImprovementFilterChange: (nextImprovementFilter: ImprovementFilter) => void;
  handleSourceReasonFilterChange: (
    nextSourceReasonFilter: SourceReasonFilter,
  ) => void;
  handleStudioPersistenceFilterChange: (
    nextStudioPersistenceFilter: StudioPersistenceFilter,
  ) => void;
  handleStudioSourceFilterChange: (
    nextStudioSourceFilter: StudioSourceFilter,
  ) => void;
  handleStudioSourceVariantFilterChange: (
    nextStudioSourceVariantFilter: StudioSourceVariantFilter,
  ) => void;
  handlePromptSelect: (prompt: PromptAsset) => void;
  resetFilters: () => void;
  copyFilterLink: () => Promise<void>;
  copyListStudioFilterLink: (input: {
    bodyLines?: string[];
    href?: string;
    id: LibraryManualCopy["id"];
    promptId: string;
    setCopiedFor: (targetId: string) => void;
    title: string;
  }) => Promise<void>;
  undoPromptDelete: () => void;
  openDeletedPromptArchive: () => void;
  toggleDeletedPromptArchive: () => void;
  restoreDeletedPrompt: (deletedPrompt: PromptDeletedAsset) => void;
  requestDeletedPromptRemove: (deletedPrompt: PromptDeletedAsset) => void;
  cancelDeletedPromptRemove: () => void;
  confirmDeletedPromptRemove: () => void;
  setSelectedId: (id: string) => void;
  setActiveModel: React.Dispatch<React.SetStateAction<TargetModel>>;
  setPromptDetailMode: React.Dispatch<React.SetStateAction<PromptDetailMode>>;
  setCopied: React.Dispatch<React.SetStateAction<boolean>>;
  setFilterLinkCopied: React.Dispatch<React.SetStateAction<boolean>>;
  setDetailLinkCopied: React.Dispatch<React.SetStateAction<boolean>>;
  setImprovementBriefCopied: React.Dispatch<React.SetStateAction<boolean>>;
  setComparisonBriefCopied: React.Dispatch<React.SetStateAction<boolean>>;
  setContextQuestionsCopied: React.Dispatch<React.SetStateAction<boolean>>;
  setManualCopy: React.Dispatch<React.SetStateAction<LibraryManualCopy | null>>;
  setLanguageFilter: React.Dispatch<React.SetStateAction<LanguageFilter>>;
  setOutputLanguageFilter: React.Dispatch<
    React.SetStateAction<OutputLanguageFilter>
  >;
  setTargetModelFilter: React.Dispatch<React.SetStateAction<TargetModelFilter>>;
  setGenerationEngineFilter: React.Dispatch<
    React.SetStateAction<GenerationEngineFilter>
  >;
  setLearningScopeFilter: React.Dispatch<
    React.SetStateAction<LearningScopeFilter>
  >;
  setDeletedPromptArchiveQuery: React.Dispatch<React.SetStateAction<string>>;
  setListStudioSourceLinkCopiedFor: React.Dispatch<
    React.SetStateAction<string>
  >;
  setListStudioSourceOriginalLinkCopiedFor: React.Dispatch<
    React.SetStateAction<string>
  >;
  setListStudioPersistenceLinkCopiedFor: React.Dispatch<
    React.SetStateAction<string>
  >;
  setListStudioOperationalGroupLinkCopiedFor: React.Dispatch<
    React.SetStateAction<string>
  >;
  syncFilterUrl: (input: {
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
    promptId?: string;
    version?: TargetModel;
    detailMode?: PromptDetailMode;
    route?: boolean;
  }) => void;
}

export function LibraryFiltersPanel({
  prompts,
  deletedPrompts,
  filtered,
  selected,
  query,
  sortMode,
  languageFilter,
  outputLanguageFilter,
  targetModelFilter,
  generationEngineFilter,
  learningScopeFilter,
  improvementFilter,
  sourceReasonFilter,
  studioPersistenceFilter,
  studioSourceFilter,
  studioSourceVariantFilter,
  improvementFilterCounts,
  sourceReasonFilterCounts,
  studioPersistenceFilterCounts,
  studioSourceFilterCounts,
  studioSourceVariantFilterCounts,
  languageFilterCounts,
  outputLanguageFilterCounts,
  targetModelFilterCounts,
  generationEngineFilterCounts,
  learningScopeFilterCounts,
  activeFilterItems,
  hasActiveFilters,
  manualCopy,
  deletedPromptTitle,
  deletedPromptRecoveryId,
  deletedPromptArchiveExpanded,
  deletedPromptArchiveQuery,
  deletedPromptRemoveCandidate,
  filteredDeletedPrompts,
  visibleDeletedPrompts,
  listStudioSourceLinkCopiedFor,
  listStudioSourceOriginalLinkCopiedFor,
  listStudioPersistenceLinkCopiedFor,
  listStudioOperationalGroupLinkCopiedFor,
  filterLinkCopied,
  renderFilterChip,
  handleQueryChange,
  handleSortChange,
  handleImprovementFilterChange,
  handleSourceReasonFilterChange,
  handleStudioPersistenceFilterChange,
  handleStudioSourceFilterChange,
  handleStudioSourceVariantFilterChange,
  handlePromptSelect,
  resetFilters,
  copyFilterLink,
  copyListStudioFilterLink,
  undoPromptDelete,
  openDeletedPromptArchive,
  toggleDeletedPromptArchive,
  restoreDeletedPrompt,
  requestDeletedPromptRemove,
  cancelDeletedPromptRemove,
  confirmDeletedPromptRemove,
  setSelectedId,
  setActiveModel,
  setPromptDetailMode,
  setCopied,
  setFilterLinkCopied,
  setDetailLinkCopied,
  setImprovementBriefCopied,
  setComparisonBriefCopied,
  setContextQuestionsCopied,
  setManualCopy,
  setLanguageFilter,
  setOutputLanguageFilter,
  setTargetModelFilter,
  setGenerationEngineFilter,
  setLearningScopeFilter,
  setDeletedPromptArchiveQuery,
  setListStudioSourceLinkCopiedFor,
  setListStudioSourceOriginalLinkCopiedFor,
  setListStudioPersistenceLinkCopiedFor,
  setListStudioOperationalGroupLinkCopiedFor,
  syncFilterUrl,
}: LibraryFiltersPanelProps) {
  return (
	        <Panel id="library-filters">
	          <PanelHeader
	            title="목록"
	            description="언어 전략, 도메인, 목표, 원문으로 좁혀봅니다."
	          />
          {deletedPromptTitle ? (
            <div className="border-b border-line bg-surface px-4 py-3">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 break-words text-xs leading-5 text-muted">
                  프롬프트 삭제됨 · {deletedPromptTitle}
                  <span className="mt-1 block text-[11px] leading-4 text-muted">
                    최근 삭제 항목에서도 복원할 수 있습니다.
                  </span>
                </p>
                {deletedPromptRecoveryId ? (
                  <button
                    type="button"
                    className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-md border border-line bg-panel-strong px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent"
                    onClick={undoPromptDelete}
                  >
                    삭제 취소
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          {deletedPrompts.length ? (
            <div className="border-b border-line bg-surface px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-soft">
                    최근 삭제 항목
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    삭제한 프롬프트를 로컬 보관함에서 검색하고 복원할 수
                    있습니다.
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-muted">
                  {deletedPromptArchiveQuery.trim()
                    ? `${filteredDeletedPrompts.length}/${deletedPrompts.length}`
                    : deletedPrompts.length}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center justify-center rounded-md border border-line bg-panel-strong px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent"
                  onClick={toggleDeletedPromptArchive}
                >
                  {deletedPromptArchiveExpanded ? "접기" : "전체 보기"}
                </button>
                {deletedPromptArchiveExpanded ? (
                  <input
                    className={`${inputClass} min-h-8 flex-1 px-3 py-1.5 text-xs`}
                    value={deletedPromptArchiveQuery}
                    onChange={(event) =>
                      setDeletedPromptArchiveQuery(event.target.value)
                    }
                    placeholder="삭제 항목 검색"
                  />
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                {visibleDeletedPrompts.map((item) => (
                  <div
                    key={item.prompt.id}
                    className="rounded-md border border-line bg-panel px-3 py-2"
                  >
                    <p className="break-words text-xs font-semibold text-soft">
                      {item.prompt.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-muted">
                      삭제 {new Date(item.deletedAt).toLocaleString("ko-KR")}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        className="inline-flex min-h-8 w-full items-center justify-center rounded-md border border-line bg-panel-strong px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent"
                        onClick={() => restoreDeletedPrompt(item)}
                      >
                        복원
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-8 w-full items-center justify-center rounded-md border border-danger/40 bg-panel-strong px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-surface"
                        onClick={() => requestDeletedPromptRemove(item)}
                      >
                        보관함에서 제거
                      </button>
                    </div>
                    {deletedPromptRemoveCandidate?.prompt.id === item.prompt.id ? (
                      <div className="mt-3 rounded-md border border-danger/40 bg-surface px-3 py-3">
                        <p className="text-xs font-semibold text-danger">
                          보관함 제거 확인
                        </p>
                        <p className="mt-1 text-[11px] leading-4 text-muted">
                          이 항목은 최근 삭제 항목에서 완전히 제거되며 앱에서
                          복원할 수 없습니다.
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            className="inline-flex min-h-8 items-center justify-center rounded-md border border-line bg-panel-strong px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent"
                            onClick={cancelDeletedPromptRemove}
                          >
                            유지
                          </button>
                          <button
                            type="button"
                            className="inline-flex min-h-8 items-center justify-center rounded-md border border-danger/50 bg-panel-strong px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-surface"
                            onClick={confirmDeletedPromptRemove}
                          >
                            제거 확인
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
                {visibleDeletedPrompts.length === 0 ? (
                  <div className="rounded-md border border-line bg-panel px-3 py-3">
                    <p className="text-xs leading-5 text-muted">
                      검색 조건에 맞는 삭제 항목이 없습니다.
                    </p>
                  </div>
                ) : null}
              </div>
              {!deletedPromptArchiveExpanded && deletedPrompts.length > 3 ? (
                <p className="mt-2 text-[11px] leading-4 text-muted">
                  외 {deletedPrompts.length - 3}개는 전체 보기에서 복원할 수
                  있습니다.
                </p>
              ) : null}
            </div>
          ) : null}
	          <div className="space-y-3 border-b border-line p-4">
            <Field label="검색">
              <input
                className={inputClass}
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="검색어 입력"
              />
            </Field>
            <Field label="정렬">
              <select
                className={selectClass}
                value={sortMode}
                onChange={(event) =>
                  handleSortChange(event.target.value as LibrarySortMode)
                }
              >
                {librarySortModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {librarySortLabels[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="개선 상태">
              <select
                className={selectClass}
                value={improvementFilter}
                onChange={(event) =>
                  handleImprovementFilterChange(
                    event.target.value as ImprovementFilter,
                  )
                }
              >
                {improvementFilterModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {improvementFilterLabels[mode]}{" "}
                    {improvementFilterCounts[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="개선 출처 사유">
              <select
                className={selectClass}
                value={sourceReasonFilter}
                onChange={(event) =>
                  handleSourceReasonFilterChange(
                    event.target.value as SourceReasonFilter,
                  )
                }
              >
                {sourceReasonFilterModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {sourceReasonFilterLabels[mode]}{" "}
                    {sourceReasonFilterCounts[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Studio 저장 방식">
              <select
                className={selectClass}
                value={studioPersistenceFilter}
                onChange={(event) =>
                  handleStudioPersistenceFilterChange(
                    event.target.value as StudioPersistenceFilter,
                  )
                }
              >
                {studioPersistenceFilterModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {studioPersistenceFilterLabels[mode]}{" "}
                    {studioPersistenceFilterCounts[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Studio 저장 출처">
              <select
                className={selectClass}
                value={studioSourceFilter}
                onChange={(event) =>
                  handleStudioSourceFilterChange(
                    event.target.value as StudioSourceFilter,
                  )
                }
              >
                {studioSourceFilterModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {getStudioSourceFilterLabel(mode)}{" "}
                    {studioSourceFilterCounts[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="세부 초안 유형">
              <select
                className={selectClass}
                value={studioSourceVariantFilter}
                onChange={(event) =>
                  handleStudioSourceVariantFilterChange(
                    event.target.value as StudioSourceVariantFilter,
                  )
                }
              >
                {studioSourceVariantFilterModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {getStudioSourceVariantFilterLabel(mode)}{" "}
                    {studioSourceVariantFilterCounts[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="언어 전략">
              <select
                className={selectClass}
                value={languageFilter}
                onChange={(event) => {
                  const nextLanguage = event.target.value as LanguageFilter;

                  setLanguageFilter(nextLanguage);
                  setSelectedId("");
                  setCopied(false);
                  setFilterLinkCopied(false);
                  setDetailLinkCopied(false);
                  setImprovementBriefCopied(false);
                  setComparisonBriefCopied(false);
                  setContextQuestionsCopied(false);
                  setPromptDetailMode("current");
                  syncFilterUrl({
                    language: nextLanguage,
                    promptId: "",
                    version: undefined,
                    detailMode: "current",
                  });
                }}
              >
                <option value="all">전체 {languageFilterCounts.all}</option>
                {languageStrategies.map((strategy) => (
                  <option key={strategy} value={strategy}>
                    {languageStrategyLabels[strategy]}{" "}
                    {languageFilterCounts[strategy]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="답변 언어">
              <select
                className={selectClass}
                value={outputLanguageFilter}
                onChange={(event) => {
                  const nextOutput = event.target.value as OutputLanguageFilter;

                  setOutputLanguageFilter(nextOutput);
                  setSelectedId("");
                  setCopied(false);
                  setFilterLinkCopied(false);
                  setDetailLinkCopied(false);
                  setImprovementBriefCopied(false);
                  setComparisonBriefCopied(false);
                  setContextQuestionsCopied(false);
                  setPromptDetailMode("current");
                  syncFilterUrl({
                    output: nextOutput,
                    promptId: "",
                    version: undefined,
                    detailMode: "current",
                  });
                }}
              >
                <option value="all">전체 {outputLanguageFilterCounts.all}</option>
                {outputLanguages.map((item) => (
                  <option key={item} value={item}>
                    {outputLanguageLabels[item]} {outputLanguageFilterCounts[item]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="대상 AI 도구">
              <select
                className={selectClass}
                value={targetModelFilter}
                onChange={(event) => {
                  const nextTargetModel = event.target.value as TargetModelFilter;

                  setTargetModelFilter(nextTargetModel);
                  setSelectedId("");
                  setActiveModel(
                    nextTargetModel === "all"
                      ? "gpt"
                      : nextTargetModel,
                  );
                  setCopied(false);
                  setFilterLinkCopied(false);
                  setDetailLinkCopied(false);
                  setImprovementBriefCopied(false);
                  setComparisonBriefCopied(false);
                  setContextQuestionsCopied(false);
                  setPromptDetailMode("current");
                  syncFilterUrl({
                    model: nextTargetModel,
                    promptId: "",
                    version: undefined,
                    detailMode: "current",
                  });
                }}
              >
                <option value="all">전체 {targetModelFilterCounts.all}</option>
                {targetModels.map((model) => (
                  <option key={model} value={model}>
                    {modelLabels[model]} {targetModelFilterCounts[model]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="생성 엔진">
              <select
                className={selectClass}
                value={generationEngineFilter}
                onChange={(event) => {
                  const nextEngine = event.target.value as GenerationEngineFilter;

                  setGenerationEngineFilter(nextEngine);
                  setSelectedId("");
                  setCopied(false);
                  setFilterLinkCopied(false);
                  setDetailLinkCopied(false);
                  setImprovementBriefCopied(false);
                  setComparisonBriefCopied(false);
                  setContextQuestionsCopied(false);
                  setPromptDetailMode("current");
                  syncFilterUrl({
                    engine: nextEngine,
                    promptId: "",
                    version: undefined,
                    detailMode: "current",
                  });
                }}
              >
                <option value="all">전체 {generationEngineFilterCounts.all}</option>
                {generationEngines.map((engine) => (
                  <option key={engine} value={engine}>
                    {generationEngineLabels[engine]}{" "}
                    {generationEngineFilterCounts[engine]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="학습 scope">
              <select
                className={selectClass}
                value={learningScopeFilter}
                onChange={(event) => {
                  const nextLearningScope = event.target.value as LearningScopeFilter;

                  setLearningScopeFilter(nextLearningScope);
                  setSelectedId("");
                  setCopied(false);
                  setFilterLinkCopied(false);
                  setDetailLinkCopied(false);
                  setImprovementBriefCopied(false);
                  setComparisonBriefCopied(false);
                  setContextQuestionsCopied(false);
                  setPromptDetailMode("current");
                  syncFilterUrl({
                    learning: nextLearningScope,
                    promptId: "",
                    version: undefined,
                    detailMode: "current",
                  });
                }}
              >
                <option value="all">전체 {learningScopeFilterCounts.all}</option>
                {learningScopeFilters.map((filter) => (
                  <option key={filter} value={filter}>
                    {learningScopeFilterLabels[filter]}{" "}
                    {learningScopeFilterCounts[filter]}
                  </option>
                ))}
              </select>
            </Field>
            {hasActiveFilters ? (
              <div className="rounded-md border border-line bg-surface px-3 py-3">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs font-semibold text-soft">적용 필터</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeFilterItems.map((item) => renderFilterChip(item))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
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
            ) : null}
          </div>
          <div id="library-results" className="max-h-[720px] overflow-auto">
            {filtered.map((prompt) => {
              const best = getPromptBestQuality(prompt);
              const languageStrategy = getLanguageStrategy(prompt);
              const outputLanguage = getOutputLanguage(prompt);
	              const source = prompt.improvementSource
	                ? prompts.find(
	                    (item) => item.id === prompt.improvementSource?.sourcePromptId,
	                  )
	                : undefined;
	              const deletedSource = prompt.improvementSource?.sourcePromptId
	                ? deletedPrompts.find(
	                    (item) =>
	                      item.prompt.id === prompt.improvementSource?.sourcePromptId,
	                  )
	                : undefined;
	              const listSourcePrompt = source ?? deletedSource?.prompt;
              const improvementDepth = prompt.improvementSource
                ? getPromptImprovementDepth(prompt, prompts, deletedPrompts)
                : 0;
	              const qualityDelta = getImprovementQualityDelta({
	                improvementPrompt: prompt,
	                sourcePrompt: listSourcePrompt,
	              });
              const listSourceHealthIssueReason =
                getPromptSourceHealthIssueReason(
                  prompt,
                  prompts,
                  deletedPrompts,
                );
              const listStudioSourceLabel = prompt.studioSource
                ? getPromptStudioSourceMetaLibraryLabel(prompt.studioSource)
                : undefined;
              const listStudioSourcePersistence = prompt.studioSource
                ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
                : undefined;
              const listStudioPersistenceFilter =
                getPromptStudioPersistenceFilter(prompt);
              const listStudioPersistenceLabel =
                studioPersistenceFilterLabels[listStudioPersistenceFilter];
              const listStudioSourceFilterHref = prompt.studioSource
                ? buildLibraryDefaultFilterHref({
                    studioSource: prompt.studioSource.source,
                    studioVariant: prompt.studioSource.sourceVariant ?? "all",
                    detailMode: "current",
                  })
                : undefined;
              const listStudioSourceOriginalHref = getPromptStudioSourceHref(
                prompt.studioSource,
              );
              const listStudioSourceHasVariant = Boolean(
                prompt.studioSource?.sourceVariant,
              );
              const listStudioSourceCopyLabel = listStudioSourceHasVariant
                ? "세부 유형 링크"
                : "출처 링크";
              const listStudioSourceCopiedLabel = listStudioSourceHasVariant
                ? "세부 유형 링크 복사됨"
                : "출처 링크 복사됨";
              const listStudioSourceFailedLabel = listStudioSourceHasVariant
                ? "세부 유형 링크 실패"
                : "출처 링크 실패";
              const listStudioSourceOpenLabel = listStudioSourceHasVariant
                ? "같은 세부 유형 출처"
                : "같은 저장 출처";
              const listStudioSourceLinkTitle = listStudioSourceHasVariant
                ? "목록 같은 세부 유형 출처 조건 링크"
                : "목록 같은 저장 출처 조건 링크";
              const listStudioOperationalGroupCopyLabel =
                listStudioSourceHasVariant ? "세부 묶음 링크" : "묶음 링크";
              const listStudioOperationalGroupCopiedLabel =
                listStudioSourceHasVariant
                  ? "세부 묶음 링크 복사됨"
                  : "묶음 링크 복사됨";
              const listStudioOperationalGroupFailedLabel =
                listStudioSourceHasVariant
                  ? "세부 묶음 링크 실패"
                  : "묶음 링크 실패";
              const listStudioOperationalGroupOpenLabel =
                listStudioSourceHasVariant
                  ? "같은 세부 유형 묶음"
                  : "같은 운영 묶음";
              const listStudioOperationalGroupLinkTitle =
                listStudioSourceHasVariant
                  ? "목록 같은 세부 유형 운영 묶음 조건 링크"
                  : "목록 같은 운영 묶음 조건 링크";
              const listStudioPersistenceFilterHref =
                buildLibraryDefaultFilterHref({
                  studioPersistence: listStudioPersistenceFilter,
                  detailMode: "current",
                });
              const listStudioOperationalGroupHref = prompt.studioSource
                ? buildLibraryDefaultFilterHref({
                    studioPersistence: listStudioPersistenceFilter,
                    studioSource: prompt.studioSource.source,
                    studioVariant: prompt.studioSource.sourceVariant ?? "all",
                    detailMode: "current",
                  })
                : undefined;

              return (
                <div
                  key={prompt.id}
                  className={`border-b border-line transition ${
                    selected?.id === prompt.id
                      ? "bg-panel-strong"
                      : "hover:bg-surface"
                  }`}
                >
                  <button
                    type="button"
                    className="block w-full px-4 py-4 text-left"
                    onClick={() => handlePromptSelect(prompt)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="line-clamp-2 min-w-0 break-words text-sm font-semibold leading-5">
                            {prompt.title}
                          </p>
                          {prompt.improvementSource ? (
                            <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                              {formatPromptImprovementDepth(improvementDepth)}
                            </span>
                          ) : null}
                          {listSourceHealthIssueReason ? (
                            <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                              {
                                sourceReasonFilterLabels[
                                  listSourceHealthIssueReason
                                ]
                              }
                            </span>
                          ) : null}
                          <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                            {generationEngineLabels[prompt.source]}
                          </span>
                          <span
                            className={`shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] font-semibold ${
                              listStudioSourcePersistence
                                ? "bg-panel text-accent"
                                : "bg-surface text-muted"
                            }`}
                          >
                            {listStudioPersistenceLabel}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-sm text-accent">
                        {best.toFixed(1)}
                      </span>
                    </div>
                    {prompt.improvementSource ? (
                      <p className="mt-2 line-clamp-1 break-words text-xs text-muted">
                        원본 · {prompt.improvementSource.sourcePromptTitle}
                        {deletedSource && !source ? " · 삭제 보관함" : ""}
                        {listSourceHealthIssueReason
                          ? ` · ${sourceReasonFilterLabels[listSourceHealthIssueReason]}`
                          : ""}
                      </p>
                    ) : null}
                    {prompt.studioSource && listStudioSourceLabel ? (
                      <p className="mt-2 line-clamp-1 break-words text-xs text-muted">
                        Studio 저장 출처 · {listStudioSourceLabel.label}
                        {prompt.studioSource.sourceTitle
                          ? ` · ${prompt.studioSource.sourceTitle}`
                          : ""}
                      </p>
                    ) : null}
                    {qualityDelta ? (
                      <p
                        className={`mt-2 text-xs font-semibold ${
                          qualityDelta.delta >= 0
                            ? "text-accent"
                            : "text-muted"
                        }`}
                      >
                        개선 효과 {formatQualityDelta(qualityDelta.delta)} · 원본{" "}
                        {qualityDelta.sourceScore.toFixed(1)} → 개선{" "}
                        {qualityDelta.improvedScore.toFixed(1)}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted">
                      {prompt.domain} ·{" "}
                      {languageStrategyLabels[languageStrategy]} · 답변{" "}
                      {outputLanguageLabels[outputLanguage]} ·{" "}
                      {formatTargetModels(prompt.targetModels)} · 피드백{" "}
                      {prompt.feedback.length}개 ·{" "}
                      {generationEngineLabels[prompt.source]}
                      {prompt.modelUsed ? ` ${prompt.modelUsed}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft">
                        학습 · {formatEnabledMemoryScopes(prompt)}
                      </span>
                      <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[11px] text-muted">
                        {formatLearningContextCount(prompt)}
                      </span>
                    </div>
                  </button>
                  {prompt.studioSource || listStudioPersistenceFilterHref ? (
                    <div className="-mt-2 flex flex-wrap gap-2 px-4 pb-4">
                      {prompt.studioSource &&
                      listStudioSourceLabel &&
                      listStudioSourceFilterHref ? (
                        <>
                          <button
                            type="button"
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            onClick={() =>
                              copyListStudioFilterLink({
                                href: listStudioSourceFilterHref,
                                id: "list-studio-source-link",
                                promptId: prompt.id,
                                setCopiedFor: setListStudioSourceLinkCopiedFor,
                                title: listStudioSourceLinkTitle,
                              })
                            }
                            data-testid={`library-list-studio-source-link-copy-${prompt.id}`}
                          >
                            {listStudioSourceLinkCopiedFor === prompt.id
                              ? listStudioSourceCopiedLabel
                              : manualCopy?.id === "list-studio-source-link" &&
                                  manualCopy.targetId === prompt.id
                                ? listStudioSourceFailedLabel
                                : listStudioSourceCopyLabel}
                          </button>
                          <a
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            href={listStudioSourceFilterHref}
                          >
                            {listStudioSourceOpenLabel}
                          </a>
                        </>
                      ) : null}
                      {prompt.studioSource &&
                      listStudioSourceLabel &&
                      listStudioSourceOriginalHref ? (
                        <>
                          <button
                            type="button"
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            onClick={() =>
                              copyListStudioFilterLink({
                                bodyLines: [
                                  `- 프롬프트: ${prompt.title}`,
                                  `- 저장 출처: ${listStudioSourceLabel.label}`,
                                  prompt.studioSource?.sourceTitle
                                    ? `- 출처 제목: ${prompt.studioSource.sourceTitle}`
                                    : "",
                                  `- 원본 경로: ${listStudioSourceOriginalHref}`,
                                ].filter(Boolean),
                                href: listStudioSourceOriginalHref,
                                id: "list-studio-source-original-link",
                                promptId: prompt.id,
                                setCopiedFor:
                                  setListStudioSourceOriginalLinkCopiedFor,
                                title: "목록 원본 경로 링크",
                              })
                            }
                            data-testid={`library-list-studio-source-original-link-copy-${prompt.id}`}
                          >
                            {listStudioSourceOriginalLinkCopiedFor === prompt.id
                              ? "원본 링크 복사됨"
                              : manualCopy?.id ===
                                    "list-studio-source-original-link" &&
                                  manualCopy.targetId === prompt.id
                                ? "원본 링크 실패"
                                : "원본 링크"}
                          </button>
                          <a
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            href={listStudioSourceOriginalHref}
                          >
                            {listStudioSourceLabel.actionLabel}
                          </a>
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                        onClick={() =>
                          copyListStudioFilterLink({
                            href: listStudioPersistenceFilterHref,
                            id: "list-studio-persistence-link",
                            promptId: prompt.id,
                            setCopiedFor:
                              setListStudioPersistenceLinkCopiedFor,
                            title: "목록 같은 저장 방식 조건 링크",
                          })
                        }
                        data-testid={`library-list-studio-persistence-link-copy-${prompt.id}`}
                      >
                        {listStudioPersistenceLinkCopiedFor === prompt.id
                          ? "저장 링크 복사됨"
                          : manualCopy?.id ===
                                "list-studio-persistence-link" &&
                              manualCopy.targetId === prompt.id
                            ? "저장 링크 실패"
                            : "저장 링크"}
                      </button>
                      <a
                        className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                        href={listStudioPersistenceFilterHref}
                      >
                        같은 저장 방식
                      </a>
                      {listStudioOperationalGroupHref ? (
                        <>
                          <button
                            type="button"
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            onClick={() =>
                              copyListStudioFilterLink({
                                href: listStudioOperationalGroupHref,
                                id: "list-studio-operational-group-link",
                                promptId: prompt.id,
                                setCopiedFor:
                                  setListStudioOperationalGroupLinkCopiedFor,
                                title: listStudioOperationalGroupLinkTitle,
                              })
                            }
                            data-testid={`library-list-studio-operational-group-link-copy-${prompt.id}`}
                          >
                            {listStudioOperationalGroupLinkCopiedFor ===
                            prompt.id
                              ? listStudioOperationalGroupCopiedLabel
                              : manualCopy?.id ===
                                    "list-studio-operational-group-link" &&
                                  manualCopy.targetId === prompt.id
                                ? listStudioOperationalGroupFailedLabel
                                : listStudioOperationalGroupCopyLabel}
                          </button>
                          <a
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            href={listStudioOperationalGroupHref}
                          >
                            {listStudioOperationalGroupOpenLabel}
                          </a>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  {manualCopy?.targetId === prompt.id &&
                  (manualCopy.id === "list-studio-source-link" ||
                    manualCopy.id === "list-studio-source-original-link" ||
                    manualCopy.id === "list-studio-persistence-link" ||
                    manualCopy.id ===
                      "list-studio-operational-group-link") ? (
                    <div className="px-4 pb-4">
                      <ManualCopyPanel
                        copy={manualCopy}
                        onClose={() => setManualCopy(null)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}

            {filtered.length === 0 ? (
              <div className="px-4 py-12">
                {sourceReasonFilter !== "all" ? (
                  <div className="rounded-md border border-line bg-surface px-4 py-4">
                    <p className="text-sm font-semibold text-soft">
                      {sourceReasonFilterLabels[sourceReasonFilter]} 개선본이
                      없습니다.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      해당 출처 사유에 해당하는 개선본이 생기면 이 필터에
                      표시됩니다. Dashboard의 출처 상태를 다시 확인하거나
                      원본 복원, 백업 가져오기 후 재검토할 수 있습니다.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={resetFilters}
                      >
                        필터 초기화
                      </button>
                    </div>
                  </div>
                ) : improvementFilter === "archived-source" ? (
                  <div className="rounded-md border border-line bg-surface px-4 py-4">
                    <p className="text-sm font-semibold text-soft">
                      보관함 원본 개선본이 없습니다.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      삭제된 원본을 참조하는 개선본이 생기면 이 필터에
                      표시됩니다. 원본을 복원하면 개선 출처와 점수 비교가 일반
                      개선 기록으로 다시 연결됩니다.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      {deletedPrompts.length ? (
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          onClick={openDeletedPromptArchive}
                        >
                          최근 삭제 항목 열기
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={resetFilters}
                      >
                        필터 초기화
                      </button>
                    </div>
                  </div>
                ) : improvementFilter === "unmeasured" ? (
                  <div className="rounded-md border border-line bg-surface px-4 py-4">
                    <p className="text-sm font-semibold text-soft">
                      측정 불가 개선본이 없습니다.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      개선 출처가 있지만 원본이 Library와 삭제 보관함 어디에도
                      없으면 이 필터에 표시됩니다. 백업을 가져오거나 원본을 다시
                      저장하면 개선 효과를 계산할 수 있습니다.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={resetFilters}
                      >
                        필터 초기화
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted">검색 결과가 없습니다.</div>
                )}
              </div>
            ) : null}
          </div>
        </Panel>
  );
}
