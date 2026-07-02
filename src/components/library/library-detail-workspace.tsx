"use client";

import type React from "react";
import {
  Field,
  Panel,
  PanelHeader,
  ScoreBar,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
  textareaClass,
} from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import {
  TargetAiHandoffPreviewPanel,
  type HandoffPreviewMode,
} from "@/components/prompt/target-ai-handoff-preview-panel";
import {
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  buildTargetAiHandoffReadinessItems,
  type Feedback,
  type PromptAsset,
  type PromptDeletedAsset,
  type TargetModel,
} from "@/lib/prompt";
import type { PromptSourceHealthIssueReason } from "@/lib/analytics/prompt-improvement";
import {
  feedbackTypeLabels,
  formatPromptImprovementDepth,
  formatQualityDelta,
  formatTargetModels,
  generationEngineLabels,
  getPromptStudioSourceMetaLibraryLabel,
  getPromptStudioSourcePersistenceMeta,
  sourceReasonFilterLabels,
  sourceReasonIssueDescriptions,
  type PromptDetailMode,
} from "@/lib/library/labels";
import {
  formatEnabledMemoryScopes,
  getImprovementActions,
  getImprovementQualityDelta,
  getLanguageDecisionText,
  getLanguageStrategy,
  getOutputLanguage,
  getPromptBestQuality,
  getPromptImprovementLineage,
  getTargetModelDecisionText,
  buildImprovementScoreComparison,
} from "@/lib/library/prompt-metrics";
import type { SelectedOperationalSummary } from "@/lib/library/report-notes";
import type { LibraryManualCopy } from "./library-view-types";

type WorkflowStep = {
  detail: string;
  label: string;
  step: string;
  title: string;
};

type VersionComparison = {
  averageRating: number | undefined;
  feedbackCount: number;
  isBestQuality: boolean;
  isMostReviewed: boolean;
  version: PromptAsset["versions"][number];
};

export interface LibraryDetailWorkspaceProps {
  prompts: PromptAsset[];
  selected: PromptAsset | undefined;
  activeVersion: PromptAsset["versions"][number] | undefined;
  sourcePrompt: PromptAsset | undefined;
  deletedSourcePrompt: PromptDeletedAsset | undefined;
  linkedImprovementPrompts: PromptAsset[];
  selectedImprovementLineage: ReturnType<typeof getPromptImprovementLineage>;
  selectedImprovementDepth: number;
  selectedImprovementQualityDelta:
    | ReturnType<typeof getImprovementQualityDelta>
    | undefined;
  selectedImprovementScoreComparison:
    | ReturnType<typeof buildImprovementScoreComparison>
    | undefined;
  selectedSourceHealthIssueReason: PromptSourceHealthIssueReason | undefined;
  selectedPromptComparisonBrief: string | undefined;
  selectedOperationalSummary: SelectedOperationalSummary | undefined;
  selectedOperationalWorkflowSteps: WorkflowStep[];
  selectedLearningContextWorkflowSteps: WorkflowStep[];
  versionComparisons: VersionComparison[];
  improvementActions: ReturnType<typeof getImprovementActions>;
  activePromptDetailMode: PromptDetailMode;
  activeTargetAiPackageCopyKey: string;
  activeTargetAiHandoffPackageText: string;
  activeTargetAiHandoffReadinessItems: ReturnType<
    typeof buildTargetAiHandoffReadinessItems
  >;
  companyContextHref: string;
  profileContextHref: string;
  selectedStudioSource: PromptAsset["studioSource"];
  selectedStudioSourceLabel:
    | ReturnType<typeof getPromptStudioSourceMetaLibraryLabel>
    | undefined;
  selectedStudioSourcePersistence:
    | ReturnType<typeof getPromptStudioSourcePersistenceMeta>
    | undefined;
  selectedStudioSourceRelationshipDescription: string | undefined;
  selectedStudioPersistenceLabel: string | undefined;
  selectedStudioPersistenceDescription: string | undefined;
  selectedStudioSourceHref: string | undefined;
  selectedStudioSourceFilterHref: string | undefined;
  selectedStudioPersistenceFilterHref: string | undefined;
  selectedStudioSourceLinkCopyLabel: string;
  selectedStudioSourceLinkCopiedLabel: string;
  selectedStudioSourceLinkFailedLabel: string;
  selectedStudioSourceLinkOpenLabel: string;
  selectedStudioOperationalGroupLinkCopyLabel: string;
  selectedStudioOperationalGroupLinkCopiedLabel: string;
  selectedStudioOperationalGroupLinkFailedLabel: string;
  manualCopy: LibraryManualCopy | null;
  comment: string;
  rating: number;
  feedbackType: Feedback["feedbackType"];
  copied: boolean;
  detailLinkCopied: boolean;
  improvementBriefCopied: boolean;
  comparisonBriefCopied: boolean;
  contextQuestionsCopied: boolean;
  contextQuestionsCopyFailed: boolean;
  latestFeedbackId: string;
  highlightedFeedbackId: string;
  learningContextReportCopiedFor: string;
  noSourceMetaNoteCopiedFor: string;
  selectedOperationalSummaryReportCopiedFor: string;
  selectedOperationalGroupLinkCopiedFor: string;
  selectedOperationalSourceLinkCopiedFor: string;
  selectedOperationalPersistenceLinkCopiedFor: string;
  selectedStudioSourceLinkCopiedFor: string;
  selectedStudioSourceOriginalLinkCopiedFor: string;
  selectedStudioPersistenceLinkCopiedFor: string;
  targetAiPackageCopiedKey: string;
  targetAiImprovementBriefCopiedKey: string;
  targetAiPackagePreviewOpen: boolean;
  targetAiPackagePreviewMode: HandoffPreviewMode;
  deletePromptCandidate: PromptAsset | null;
  handleVersionChange: (nextActiveModel: TargetModel) => void;
  handlePromptDetailModeChange: (nextDetailMode: PromptDetailMode) => void;
  openPromptDetail: (promptId: string, preferredVersion?: TargetModel) => void;
  openPromptFeedbackDetail: (
    promptId: string,
    feedbackId: string,
    preferredVersion?: TargetModel,
  ) => void;
  getLinkedImprovementPromptCount: (prompt: PromptAsset) => number;
  runSelectedOperationalSummaryAction: () => void;
  copyPrompt: (title?: string) => Promise<void>;
  copyDetailLink: () => Promise<void>;
  copyImprovementBrief: () => Promise<void>;
  copyMissingContextQuestions: () => Promise<void>;
  copyComparisonBrief: () => Promise<void>;
  copyLearningContextReport: () => Promise<void>;
  copyNoSourceMetaNote: () => Promise<void>;
  copyTargetAiHandoffPackage: () => Promise<void>;
  copyTargetAiHandoffImprovementBrief: () => Promise<void>;
  copySelectedOperationalSummaryReport: () => Promise<void>;
  copySelectedOperationalGroupFilterLink: () => Promise<void>;
  copySelectedOperationalSourceFilterLink: () => Promise<void>;
  copySelectedOperationalPersistenceFilterLink: () => Promise<void>;
  copySelectedStudioSourceFilterLink: () => Promise<void>;
  copySelectedStudioSourceOriginalLink: () => Promise<void>;
  copySelectedStudioPersistenceFilterLink: () => Promise<void>;
  openImprovementInStudio: () => void;
  openComparisonImprovementInStudio: () => void;
  openFeedbackImprovementInStudio: (feedback: Feedback) => void;
  openLearningContextReportInStudio: () => void;
  openNoSourceMetaNoteInStudio: () => void;
  openSelectedOperationalSummaryReportInStudio: () => void;
  openTargetAiHandoffImprovementInStudio: () => void;
  addFeedback: () => void;
  requestSelectedPromptDelete: () => void;
  confirmPromptDelete: () => void;
  cancelPromptDelete: () => void;
  restoreDeletedPrompt: (deletedPrompt: PromptDeletedAsset) => void;
  setComment: React.Dispatch<React.SetStateAction<string>>;
  setRating: React.Dispatch<React.SetStateAction<number>>;
  setFeedbackType: React.Dispatch<
    React.SetStateAction<Feedback["feedbackType"]>
  >;
  setManualCopy: React.Dispatch<React.SetStateAction<LibraryManualCopy | null>>;
  setTargetAiPackagePreviewOpen: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  setTargetAiPackagePreviewMode: React.Dispatch<
    React.SetStateAction<HandoffPreviewMode>
  >;
}

export function LibraryDetailWorkspace({
  prompts,
  selected,
  activeVersion,
  sourcePrompt,
  deletedSourcePrompt,
  linkedImprovementPrompts,
  selectedImprovementLineage,
  selectedImprovementDepth,
  selectedImprovementQualityDelta,
  selectedImprovementScoreComparison,
  selectedSourceHealthIssueReason,
  selectedPromptComparisonBrief,
  selectedOperationalSummary,
  selectedOperationalWorkflowSteps,
  selectedLearningContextWorkflowSteps,
  versionComparisons,
  improvementActions,
  activePromptDetailMode,
  activeTargetAiPackageCopyKey,
  activeTargetAiHandoffPackageText,
  activeTargetAiHandoffReadinessItems,
  companyContextHref,
  profileContextHref,
  selectedStudioSource,
  selectedStudioSourceLabel,
  selectedStudioSourcePersistence,
  selectedStudioSourceRelationshipDescription,
  selectedStudioPersistenceLabel,
  selectedStudioPersistenceDescription,
  selectedStudioSourceHref,
  selectedStudioSourceFilterHref,
  selectedStudioPersistenceFilterHref,
  selectedStudioSourceLinkCopyLabel,
  selectedStudioSourceLinkCopiedLabel,
  selectedStudioSourceLinkFailedLabel,
  selectedStudioSourceLinkOpenLabel,
  selectedStudioOperationalGroupLinkCopyLabel,
  selectedStudioOperationalGroupLinkCopiedLabel,
  selectedStudioOperationalGroupLinkFailedLabel,
  manualCopy,
  comment,
  rating,
  feedbackType,
  copied,
  detailLinkCopied,
  improvementBriefCopied,
  comparisonBriefCopied,
  contextQuestionsCopied,
  contextQuestionsCopyFailed,
  latestFeedbackId,
  highlightedFeedbackId,
  learningContextReportCopiedFor,
  noSourceMetaNoteCopiedFor,
  selectedOperationalSummaryReportCopiedFor,
  selectedOperationalGroupLinkCopiedFor,
  selectedOperationalSourceLinkCopiedFor,
  selectedOperationalPersistenceLinkCopiedFor,
  selectedStudioSourceLinkCopiedFor,
  selectedStudioSourceOriginalLinkCopiedFor,
  selectedStudioPersistenceLinkCopiedFor,
  targetAiPackageCopiedKey,
  targetAiImprovementBriefCopiedKey,
  targetAiPackagePreviewOpen,
  targetAiPackagePreviewMode,
  deletePromptCandidate,
  handleVersionChange,
  handlePromptDetailModeChange,
  openPromptDetail,
  openPromptFeedbackDetail,
  getLinkedImprovementPromptCount,
  runSelectedOperationalSummaryAction,
  copyPrompt,
  copyDetailLink,
  copyImprovementBrief,
  copyMissingContextQuestions,
  copyComparisonBrief,
  copyLearningContextReport,
  copyNoSourceMetaNote,
  copyTargetAiHandoffPackage,
  copyTargetAiHandoffImprovementBrief,
  copySelectedOperationalSummaryReport,
  copySelectedOperationalGroupFilterLink,
  copySelectedOperationalSourceFilterLink,
  copySelectedOperationalPersistenceFilterLink,
  copySelectedStudioSourceFilterLink,
  copySelectedStudioSourceOriginalLink,
  copySelectedStudioPersistenceFilterLink,
  openImprovementInStudio,
  openComparisonImprovementInStudio,
  openFeedbackImprovementInStudio,
  openLearningContextReportInStudio,
  openNoSourceMetaNoteInStudio,
  openSelectedOperationalSummaryReportInStudio,
  openTargetAiHandoffImprovementInStudio,
  addFeedback,
  requestSelectedPromptDelete,
  confirmPromptDelete,
  cancelPromptDelete,
  restoreDeletedPrompt,
  setComment,
  setRating,
  setFeedbackType,
  setManualCopy,
  setTargetAiPackagePreviewOpen,
  setTargetAiPackagePreviewMode,
}: LibraryDetailWorkspaceProps) {
  return (
        <Panel id="library-detail-workspace" className="min-h-[720px]">
          {selected && activeVersion ? (
            <>
              <PanelHeader
                title={selected.title}
                description={`${selected.domain} · ${selected.goal} · ${
                  languageStrategyLabels[getLanguageStrategy(selected)]
                } · 답변 ${outputLanguageLabels[getOutputLanguage(selected)]}`}
              />

              <div className="grid min-h-[640px] min-w-0 gap-0 xl:grid-cols-[1fr_300px]">
                <div className="min-w-0 border-b border-line xl:border-b-0 xl:border-r">
                  <div className="flex gap-1 overflow-x-auto border-b border-line px-4 py-3">
                    {selected.versions.map((version) => (
                      <button
                        key={version.id}
                        type="button"
                        className={`shrink-0 rounded-md px-3 py-2 text-sm transition ${
                          activeVersion.targetModel === version.targetModel
                            ? "bg-panel-strong text-foreground"
                            : "text-muted hover:bg-surface hover:text-foreground"
                        }`}
                        onClick={() => {
                          handleVersionChange(version.targetModel);
                        }}
                      >
                        {modelLabels[version.targetModel]}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-soft">
                          프롬프트 본문
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {activePromptDetailMode === "comparison"
                            ? "원본과 개선본의 지시문을 함께 확인합니다."
                            : `${modelLabels[activeVersion.targetModel]} 버전 기준`}
                        </p>
                      </div>
                      {selectedImprovementQualityDelta ? (
                        <div
                          className="inline-flex w-full rounded-md border border-line bg-surface p-1 sm:w-auto"
                          aria-label="프롬프트 본문 보기 모드"
                        >
                          {(
                            [
                              ["current", "현재 버전"],
                              ["comparison", "원본 비교"],
                            ] as const
                          ).map(([mode, label]) => (
                            <button
                              key={mode}
                              type="button"
                              className={`min-h-9 flex-1 rounded px-3 py-1.5 text-sm font-semibold transition sm:flex-none ${
                                activePromptDetailMode === mode
                                  ? "bg-panel-strong text-foreground"
                                  : "text-muted hover:text-foreground"
                              }`}
                              onClick={() =>
                                handlePromptDetailModeChange(mode)
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {activePromptDetailMode === "comparison" &&
                    selectedImprovementQualityDelta ? (
                      <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
                        <div className="min-w-0 overflow-hidden rounded-md border border-line bg-surface">
                          <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-xs text-muted">원본</p>
                              <p className="mt-1 truncate text-sm font-semibold text-soft">
                                {modelLabels[
                                  selectedImprovementQualityDelta.sourceVersion
                                    .targetModel
                                ]}
                              </p>
                            </div>
                            <span className="font-mono text-sm text-muted">
                              {selectedImprovementQualityDelta.sourceScore.toFixed(
                                1,
                              )}
                            </span>
                          </div>
                          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap p-4 font-mono text-[13px] leading-6 text-soft">
                            {
                              selectedImprovementQualityDelta.sourceVersion
                                .content
                            }
                          </pre>
                        </div>

                        <div className="min-w-0 overflow-hidden rounded-md border border-line bg-surface">
                          <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-xs text-muted">개선본</p>
                              <p className="mt-1 truncate text-sm font-semibold text-soft">
                                {modelLabels[
                                  selectedImprovementQualityDelta
                                    .improvedVersion.targetModel
                                ]}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm text-accent">
                                {selectedImprovementQualityDelta.improvedScore.toFixed(
                                  1,
                                )}
                              </p>
                              <p
                                className={`mt-1 font-mono text-xs ${
                                  selectedImprovementQualityDelta.delta >= 0
                                    ? "text-accent"
                                    : "text-muted"
                                }`}
                              >
                                {formatQualityDelta(
                                  selectedImprovementQualityDelta.delta,
                                )}
                              </p>
                            </div>
                          </div>
                          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap p-4 font-mono text-[13px] leading-6 text-soft">
                            {
                              selectedImprovementQualityDelta.improvedVersion
                                .content
                            }
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-md border border-line bg-surface p-4 font-mono text-[13px] leading-6 text-soft">
                        {activeVersion.content}
                      </pre>
                    )}

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <button
                        className={secondaryButtonClass}
                        type="button"
                        onClick={() => copyPrompt()}
                      >
                        {copied
                          ? "복사됨"
                          : manualCopy?.id === "prompt"
                            ? "현재 버전 복사 실패"
                            : "현재 버전 복사"}
                      </button>
                      <button
                        className={secondaryButtonClass}
                        type="button"
                        onClick={copyTargetAiHandoffPackage}
                      >
                        {targetAiPackageCopiedKey ===
                        activeTargetAiPackageCopyKey
                          ? "전달 패키지 복사됨"
                          : manualCopy?.id === "target-ai-package" &&
                              manualCopy.targetId ===
                                activeTargetAiPackageCopyKey
                            ? "전달 패키지 복사 실패"
                            : "AI 전달 패키지 복사"}
                      </button>
                      <button
                        aria-expanded={targetAiPackagePreviewOpen}
                        className={secondaryButtonClass}
                        type="button"
                        onClick={() =>
                          setTargetAiPackagePreviewOpen((current) => !current)
                        }
                      >
                        {targetAiPackagePreviewOpen
                          ? "패키지 닫기"
                          : "AI 전달 패키지 보기"}
                      </button>
                      <button
                        className={secondaryButtonClass}
                        type="button"
                        onClick={copyDetailLink}
                      >
                        {detailLinkCopied
                          ? "상세 링크 복사됨"
                          : manualCopy?.id === "detail-link"
                            ? "상세 링크 복사 실패"
                            : "상세 링크 복사"}
                      </button>
                      {activePromptDetailMode === "comparison" &&
                      selectedPromptComparisonBrief ? (
                        <>
                          <button
                            className={secondaryButtonClass}
                            type="button"
                            onClick={copyComparisonBrief}
                          >
                            {comparisonBriefCopied
                              ? "비교 브리프 복사됨"
                              : manualCopy?.id === "comparison-brief"
                                ? "비교 브리프 복사 실패"
                                : "비교 브리프 복사"}
                          </button>
                          <button
                            className={primaryButtonClass}
                            type="button"
                            onClick={openComparisonImprovementInStudio}
                          >
                            Studio에서 재개선
	                          </button>
	                        </>
	                      ) : null}
	                      <button
	                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-danger/50 bg-panel-strong px-4 py-2 text-sm font-semibold text-danger transition hover:bg-surface"
	                        type="button"
	                        onClick={requestSelectedPromptDelete}
	                      >
	                        프롬프트 삭제
	                      </button>
	                    </div>
                    {targetAiPackagePreviewOpen ? (
                      <TargetAiHandoffPreviewPanel
                        handoffPackageText={activeTargetAiHandoffPackageText}
                        improvementBriefButtonLabel={
                          targetAiImprovementBriefCopiedKey ===
                          activeTargetAiPackageCopyKey
                            ? "보강 브리프 복사됨"
                            : manualCopy?.id ===
                                  "target-ai-improvement-brief" &&
                                manualCopy.targetId ===
                                  activeTargetAiPackageCopyKey
                              ? "보강 브리프 복사 실패"
                              : "보강 브리프 복사"
                        }
                        modelLabel={modelLabels[activeVersion.targetModel]}
                        onCopyImprovementBrief={
                          copyTargetAiHandoffImprovementBrief
                        }
                        onCopyPackage={copyTargetAiHandoffPackage}
                        onCopyRunPrompt={() => copyPrompt("실행 프롬프트")}
                        onOpenImprovementInStudio={
                          openTargetAiHandoffImprovementInStudio
                        }
                        onPreviewModeChange={setTargetAiPackagePreviewMode}
                        openImprovementButtonLabel="Studio에서 보강"
                        packageButtonLabel={
                          targetAiPackageCopiedKey ===
                          activeTargetAiPackageCopyKey
                            ? "전달 패키지 복사됨"
                            : manualCopy?.id === "target-ai-package" &&
                                manualCopy.targetId ===
                                  activeTargetAiPackageCopyKey
                              ? "전달 패키지 복사 실패"
                              : "패키지 복사"
                        }
                        previewMode={targetAiPackagePreviewMode}
                        previewModeName="library-target-ai-handoff-preview-mode"
                        qualityScore={activeVersion.qualityScore}
                        readinessItems={activeTargetAiHandoffReadinessItems}
                        runPromptText={activeVersion.content}
                        runPromptButtonLabel={
                          copied
                            ? "실행 프롬프트 복사됨"
                            : manualCopy?.id === "prompt"
                              ? "실행 프롬프트 복사 실패"
                              : "실행 프롬프트 복사"
                        }
                      />
                    ) : null}
	                    {deletePromptCandidate ? (
	                      <div className="mt-4 rounded-md border border-danger/40 bg-surface px-4 py-3">
	                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
	                          <div className="min-w-0">
	                            <p className="text-sm font-semibold text-danger">
	                              삭제 확인
	                            </p>
	                            <p className="mt-1 break-words text-sm font-semibold text-soft">
	                              {deletePromptCandidate.title}
	                            </p>
	                            <p className="mt-2 text-xs leading-5 text-muted">
	                              저장 버전 {deletePromptCandidate.versions.length}개 ·
	                              저장 피드백 {deletePromptCandidate.feedback.length}개 ·
	                              연결 개선본{" "}
	                              {getLinkedImprovementPromptCount(deletePromptCandidate)}
	                              개
	                            </p>
	                            <p className="mt-2 text-xs leading-5 text-danger">
                              확인하면 이 프롬프트와 피드백이 현재 워크스페이스
                              Library에서 제거됩니다. 삭제 후에는 목록 상단의 최근
                              삭제 항목에서 복원할 수 있습니다.
	                            </p>
	                          </div>
	                          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
	                            <button
	                              type="button"
	                              className={secondaryButtonClass}
	                              onClick={cancelPromptDelete}
	                            >
	                              삭제 안 함
	                            </button>
	                            <button
	                              type="button"
	                              className="inline-flex min-h-10 items-center justify-center rounded-md border border-danger/50 bg-panel-strong px-4 py-2 text-sm font-semibold text-danger transition hover:bg-surface"
	                              onClick={confirmPromptDelete}
	                            >
	                              삭제 확인
	                            </button>
	                          </div>
	                        </div>
	                      </div>
	                    ) : null}
	                    {manualCopy?.id === "prompt" ||
                    (manualCopy?.id === "target-ai-package" &&
                      manualCopy.targetId === activeTargetAiPackageCopyKey) ||
                    manualCopy?.id === "detail-link" ||
                    manualCopy?.id === "comparison-brief" ? (
                      <div className="mt-4">
                        <ManualCopyPanel
                          copy={manualCopy}
                          onClose={() => setManualCopy(null)}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <aside className="space-y-5 p-5">
                  {selectedOperationalSummary ? (
                    <div
                      id="library-selected-operational-summary"
                      className="rounded-md border border-line bg-surface px-4 py-3"
                      data-testid="library-selected-operational-summary"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-muted">운영 상태</p>
                          <p className="mt-1 break-words text-sm font-semibold text-soft">
                            {selectedOperationalSummary.nextAction}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-semibold text-accent">
                            {selectedOperationalSummary.handoffStatusLabel}
                          </span>
                          <button
                            type="button"
                            className={
                              selectedOperationalSummary.actionKind ===
                              "handoff-improve"
                                ? `${primaryButtonClass} min-h-8 whitespace-nowrap px-3 py-1.5 text-xs`
                                : `${secondaryButtonClass} min-h-8 whitespace-nowrap px-3 py-1.5 text-xs`
                            }
                            onClick={runSelectedOperationalSummaryAction}
                          >
                            {selectedOperationalSummary.actionLabel}
                          </button>
                          <button
                            type="button"
                            className={`${secondaryButtonClass} min-h-8 whitespace-nowrap px-3 py-1.5 text-xs`}
                            onClick={copySelectedOperationalSummaryReport}
                            data-testid="library-selected-operational-summary-report-copy"
                          >
                            {selectedOperationalSummaryReportCopiedFor ===
                            selected.id
                              ? "운영 요약 복사됨"
                              : manualCopy?.id ===
                                    "selected-operational-summary-report" &&
                                  manualCopy.targetId === selected.id
                                ? "운영 요약 복사 실패"
                                : "운영 요약 복사"}
                          </button>
                          <button
                            type="button"
                            className={`${primaryButtonClass} min-h-8 whitespace-nowrap px-3 py-1.5 text-xs`}
                            onClick={openSelectedOperationalSummaryReportInStudio}
                            data-testid="library-selected-operational-summary-studio"
                          >
                            요약 Studio로
                          </button>
                        </div>
                      </div>

                      <div
                        className="mt-3 grid gap-2 md:grid-cols-3"
                        data-testid="library-selected-operational-workflow"
                      >
                        {selectedOperationalWorkflowSteps.map((step) => (
                          <div
                            key={step.step}
                            className="min-w-0 rounded-md border border-line bg-panel px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0 rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
                                {step.step}
                              </span>
                              <p className="break-words text-[11px] font-semibold text-soft">
                                {step.label}
                              </p>
                            </div>
                            <p className="mt-2 break-words text-xs font-semibold text-soft">
                              {step.title}
                            </p>
                            <p className="mt-1 break-words text-[11px] leading-4 text-muted">
                              {step.detail}
                            </p>
                          </div>
                        ))}
                      </div>

                      {selectedOperationalSummary.groupActionHref ||
                      selectedOperationalSummary.sourceActionHref ||
                      selectedOperationalSummary.persistenceActionHref ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {selectedOperationalSummary.groupActionHref &&
                          selectedOperationalSummary.groupActionLabel ? (
                            <>
                              <button
                                type="button"
                                className={`${secondaryButtonClass} w-full`}
                                onClick={
                                  copySelectedOperationalGroupFilterLink
                                }
                                data-testid="library-selected-operational-group-link-copy"
                              >
                                {selectedOperationalGroupLinkCopiedFor ===
                                selected.id
                                  ? selectedStudioOperationalGroupLinkCopiedLabel
                                  : manualCopy?.id ===
                                        "selected-operational-group-link" &&
                                      manualCopy.targetId === selected.id
                                    ? selectedStudioOperationalGroupLinkFailedLabel
                                    : selectedStudioOperationalGroupLinkCopyLabel}
                              </button>
                              <a
                                className={`${secondaryButtonClass} w-full`}
                                href={selectedOperationalSummary.groupActionHref}
                              >
                                {selectedOperationalSummary.groupActionLabel}
                              </a>
                            </>
                          ) : null}
                          {selectedOperationalSummary.sourceActionHref &&
                          selectedOperationalSummary.sourceActionLabel ? (
                            <>
                              <button
                                type="button"
                                className={`${secondaryButtonClass} w-full`}
                                onClick={
                                  copySelectedOperationalSourceFilterLink
                                }
                                data-testid="library-selected-operational-source-link-copy"
                              >
                                {selectedOperationalSourceLinkCopiedFor ===
                                selected.id
                                  ? selectedStudioSourceLinkCopiedLabel
                                  : manualCopy?.id ===
                                        "selected-operational-source-link" &&
                                      manualCopy.targetId === selected.id
                                    ? selectedStudioSourceLinkFailedLabel
                                    : selectedStudioSourceLinkCopyLabel}
                              </button>
                              <a
                                className={`${secondaryButtonClass} w-full`}
                                href={selectedOperationalSummary.sourceActionHref}
                              >
                                {selectedOperationalSummary.sourceActionLabel}
                              </a>
                            </>
                          ) : null}
                          {selectedOperationalSummary.persistenceActionHref &&
                          selectedOperationalSummary.persistenceActionLabel ? (
                            <>
                              <button
                                type="button"
                                className={`${secondaryButtonClass} w-full`}
                                onClick={
                                  copySelectedOperationalPersistenceFilterLink
                                }
                                data-testid="library-selected-operational-persistence-link-copy"
                              >
                                {selectedOperationalPersistenceLinkCopiedFor ===
                                selected.id
                                  ? "저장 방식 링크 복사됨"
                                  : manualCopy?.id ===
                                        "selected-operational-persistence-link" &&
                                      manualCopy.targetId === selected.id
                                    ? "저장 방식 링크 복사 실패"
                                    : "저장 방식 링크 복사"}
                              </button>
                              <a
                                className={`${secondaryButtonClass} w-full`}
                                href={
                                  selectedOperationalSummary.persistenceActionHref
                                }
                              >
                                {
                                  selectedOperationalSummary.persistenceActionLabel
                                }
                              </a>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                      {manualCopy?.targetId === selected.id &&
                      (manualCopy.id === "selected-operational-group-link" ||
                        manualCopy.id === "selected-operational-source-link" ||
                        manualCopy.id ===
                          "selected-operational-persistence-link" ||
                        manualCopy.id ===
                          "selected-operational-summary-report") ? (
                        <div className="mt-3">
                          <ManualCopyPanel
                            copy={manualCopy}
                            onClose={() => setManualCopy(null)}
                          />
                        </div>
                      ) : null}

                      <div
                        className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3"
                        data-testid="library-selected-operational-status-grid"
                      >
                        <div className="min-w-0 border-r border-line pr-2">
                          <p className="text-muted">저장 방식</p>
                          <p className="mt-1 break-words font-semibold text-soft">
                            {selectedOperationalSummary.persistenceLabel}
                          </p>
                        </div>
                        <div className="min-w-0 sm:border-r sm:border-line sm:pr-2">
                          <p className="text-muted">출처</p>
                          <p className="mt-1 break-words font-semibold text-soft">
                            {selectedOperationalSummary.sourceLabel}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted">체인</p>
                          <p className="mt-1 break-words font-semibold text-soft">
                            {selectedOperationalSummary.chainLabel}
                          </p>
                        </div>
                      </div>
                      {selectedOperationalSummary.sourceVariantLabel ? (
                        <div className="mt-2 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5">
                          <p className="text-muted">세부 초안 유형</p>
                          <p className="mt-1 break-words font-semibold text-soft">
                            {selectedOperationalSummary.sourceVariantLabel}
                          </p>
                        </div>
                      ) : null}
                      {selectedOperationalSummary.sourceTitle ? (
                        <div className="mt-2 rounded-md border border-line bg-surface px-3 py-2 text-xs leading-5">
                          <p className="text-muted">출처 제목</p>
                          <p className="mt-1 break-words font-semibold text-soft">
                            {selectedOperationalSummary.sourceTitle}
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-3 space-y-2 border-t border-line pt-3 text-xs leading-5 text-muted">
                        <p>{selectedOperationalSummary.nextActionDescription}</p>
                        <p>{selectedOperationalSummary.handoffStatusDescription}</p>
                        <p>{selectedOperationalSummary.chainDescription}</p>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <p className="text-sm text-muted">품질 점수</p>
                    <p className="mt-1 font-mono text-4xl font-semibold text-accent">
                      {activeVersion.qualityScore.toFixed(1)}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      생성 엔진 · {generationEngineLabels[selected.source]}
                      {selected.modelUsed ? ` ${selected.modelUsed}` : ""}
                    </p>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted">학습 컨텍스트</p>
                        <p className="mt-1 text-sm font-semibold text-soft">
                          {formatEnabledMemoryScopes(selected)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-soft">
                        {selected.learningContext
                          ? `${selected.learningContext.appliedMemoryCount}+${selected.learningContext.recentFeedbackCount}`
                          : "-"}
                      </span>
                    </div>
                    {selected.learningContext ? (
                      <>
                        <p className="mt-2 text-xs leading-5 text-muted">
                          학습 메모리 {selected.learningContext.appliedMemoryCount}
                          개, 최근 피드백{" "}
                          {selected.learningContext.recentFeedbackCount}개를 생성
                          컨텍스트로 사용했습니다.
                        </p>
                        <div
                          className="mt-3 grid gap-2"
                          data-testid="library-learning-context-workflow"
                        >
                          {selectedLearningContextWorkflowSteps.map((step) => (
                            <div
                              key={step.step}
                              className="rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="shrink-0 rounded-md border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-semibold text-accent">
                                  {step.step}
                                </span>
                                <p className="font-semibold text-soft">
                                  {step.label}
                                </p>
                              </div>
                              <p className="mt-2 break-words font-semibold text-soft">
                                {step.title}
                              </p>
                              <p className="mt-1 text-muted">{step.detail}</p>
                            </div>
                          ))}
                        </div>
                        {selected.learningContext.appliedMemoryTitles.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selected.learningContext.appliedMemoryTitles
                              .slice(0, 4)
                              .map((title) => (
                                <span
                                  key={title}
                                  className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
                                >
                                  {title}
                                </span>
                              ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="mt-2 text-xs leading-5 text-muted">
                        이 프롬프트는 학습 컨텍스트 메타 저장 전 생성됐습니다.
                      </p>
                    )}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full`}
                        onClick={copyLearningContextReport}
                      >
                        {learningContextReportCopiedFor === selected.id
                          ? "리포트 복사됨"
                          : manualCopy?.id === "learning-report"
                            ? "리포트 복사 실패"
                            : "학습 컨텍스트 리포트 복사"}
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full`}
                        onClick={openLearningContextReportInStudio}
                      >
                        학습 리포트 Studio로
                      </button>
                    </div>
                    {manualCopy?.id === "learning-report" ? (
                      <div className="mt-3">
                        <ManualCopyPanel
                          copy={manualCopy}
                          onClose={() => setManualCopy(null)}
                        />
                      </div>
	                    ) : null}
	                  </div>

	                  {selectedStudioSource && selectedStudioSourceLabel ? (
	                    <div className="rounded-md border border-line bg-surface px-4 py-3">
	                      <div className="flex min-w-0 items-start justify-between gap-3">
	                        <div className="min-w-0">
		                          <p className="text-xs text-muted">Studio 저장 출처</p>
	                          <p className="mt-1 break-words text-sm font-semibold text-soft">
	                            {selectedStudioSourceLabel.label}
	                          </p>
	                        </div>
	                        <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-semibold text-accent">
	                          {selectedStudioSourcePersistence?.label ?? "저장 추적"}
	                        </span>
	                      </div>
	                      {selectedStudioSource.sourceTitle ? (
	                        <p className="mt-2 break-words text-xs leading-5 text-muted">
	                          {selectedStudioSource.sourceTitle}
	                        </p>
	                      ) : null}
	                      <p className="mt-2 text-xs leading-5 text-muted">
	                        초안 입력 {selectedStudioSource.inputLineCount}줄 ·{" "}
	                        {selectedStudioSource.inputCharCount}자
	                      </p>
	                      <p className="mt-1 break-words text-xs leading-5 text-muted">
	                        {selectedStudioSource.inputPreview}
	                      </p>
	                      {selectedStudioSourcePersistence ? (
	                        <p className="mt-2 text-xs leading-5 text-muted">
	                          {selectedStudioSourcePersistence.description}
	                        </p>
	                      ) : null}
	                      {selectedStudioSourceRelationshipDescription ? (
	                        <p className="mt-2 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5 text-soft">
	                          {selectedStudioSourceRelationshipDescription}
	                        </p>
	                      ) : null}
	                      {selectedStudioSourceFilterHref ||
	                      selectedStudioPersistenceFilterHref ? (
	                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
	                          {selectedStudioSourceFilterHref ? (
	                            <>
	                              <button
	                                type="button"
	                                className={`${secondaryButtonClass} w-full`}
	                                onClick={copySelectedStudioSourceFilterLink}
	                                data-testid="library-selected-studio-source-link-copy"
	                              >
	                                {selectedStudioSourceLinkCopiedFor ===
	                                selected.id
	                                  ? selectedStudioSourceLinkCopiedLabel
	                                  : manualCopy?.id ===
	                                        "selected-studio-source-link" &&
	                                      manualCopy.targetId === selected.id
	                                    ? selectedStudioSourceLinkFailedLabel
	                                    : selectedStudioSourceLinkCopyLabel}
	                              </button>
	                              <a
	                                className={`${secondaryButtonClass} w-full`}
	                                href={selectedStudioSourceFilterHref}
	                              >
	                                {selectedStudioSourceLinkOpenLabel}
	                              </a>
	                            </>
	                          ) : null}
	                          {selectedStudioPersistenceFilterHref &&
	                          selectedStudioSourcePersistence ? (
	                            <>
	                              <button
	                                type="button"
	                                className={`${secondaryButtonClass} w-full`}
	                                onClick={
	                                  copySelectedStudioPersistenceFilterLink
	                                }
	                                data-testid="library-selected-studio-persistence-link-copy"
	                              >
	                                {selectedStudioPersistenceLinkCopiedFor ===
	                                selected.id
	                                  ? "저장 방식 링크 복사됨"
	                                  : manualCopy?.id ===
	                                        "selected-studio-persistence-link" &&
	                                      manualCopy.targetId === selected.id
	                                    ? "저장 방식 링크 복사 실패"
	                                    : "저장 방식 링크 복사"}
	                              </button>
	                              <a
	                                className={`${secondaryButtonClass} w-full`}
	                                href={selectedStudioPersistenceFilterHref}
	                              >
	                                같은 저장 방식 보기
	                              </a>
	                            </>
	                          ) : null}
	                        </div>
	                      ) : null}
	                      {manualCopy?.id === "selected-studio-source-link" &&
	                      manualCopy.targetId === selected.id ? (
	                        <div className="mt-3">
	                          <ManualCopyPanel
	                            copy={manualCopy}
	                            onClose={() => setManualCopy(null)}
	                          />
	                        </div>
	                      ) : null}
	                      {manualCopy?.id ===
	                        "selected-studio-persistence-link" &&
	                      manualCopy.targetId === selected.id ? (
	                        <div className="mt-3">
	                          <ManualCopyPanel
	                            copy={manualCopy}
	                            onClose={() => setManualCopy(null)}
	                          />
	                        </div>
	                      ) : null}
	                      <p className="mt-2 font-mono text-[11px] leading-5 text-muted">
	                        저장 시각 ·{" "}
	                        {new Date(selectedStudioSource.savedAt).toLocaleString(
	                          "ko-KR",
	                        )}
	                      </p>
	                      {selectedStudioSourceHref ? (
	                        <>
	                          <p className="mt-1 break-all font-mono text-[11px] leading-5 text-muted">
	                            원본 경로 · {selectedStudioSourceHref}
	                          </p>
	                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
	                            <button
	                              type="button"
	                              className={`${secondaryButtonClass} w-full`}
	                              onClick={copySelectedStudioSourceOriginalLink}
	                              data-testid="library-selected-studio-source-original-link-copy"
	                            >
	                              {selectedStudioSourceOriginalLinkCopiedFor ===
	                              selected.id
	                                ? "원본 링크 복사됨"
	                                : manualCopy?.id ===
	                                      "selected-studio-source-original-link" &&
	                                    manualCopy.targetId === selected.id
	                                  ? "원본 링크 복사 실패"
	                                  : "원본 링크 복사"}
	                            </button>
	                            <a
	                              className={`${secondaryButtonClass} w-full`}
	                              href={selectedStudioSourceHref}
	                            >
	                              {selectedStudioSourceLabel.actionLabel}
	                            </a>
	                          </div>
	                          {manualCopy?.id ===
	                            "selected-studio-source-original-link" &&
	                          manualCopy.targetId === selected.id ? (
	                            <div className="mt-3">
	                              <ManualCopyPanel
	                                copy={manualCopy}
	                                onClose={() => setManualCopy(null)}
	                              />
	                            </div>
	                          ) : null}
	                        </>
	                      ) : null}
	                    </div>
	                  ) : null}

	                  {selected &&
	                  !selectedStudioSource &&
	                  selectedStudioPersistenceLabel ? (
	                    <div className="rounded-md border border-line bg-surface px-4 py-3">
	                      <div className="flex min-w-0 items-start justify-between gap-3">
	                        <div className="min-w-0">
		                          <p className="text-xs text-muted">Studio 저장 출처</p>
	                          <p className="mt-1 break-words text-sm font-semibold text-soft">
	                            저장 출처 메타 없음
	                          </p>
	                        </div>
	                        <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-semibold text-muted">
	                          {selectedStudioPersistenceLabel}
	                        </span>
	                      </div>
	                      {selectedStudioPersistenceDescription ? (
	                        <p className="mt-2 text-xs leading-5 text-muted">
	                          {selectedStudioPersistenceDescription}
	                        </p>
	                      ) : null}
	                      <p className="mt-2 text-xs leading-5 text-muted">
	                        이 저장본은 Studio 초안의 원본 화면, 입력 요약, 저장 출처가
	                        기록되기 전 생성됐거나 직접 저장된 항목입니다.
	                      </p>
	                      <div className="mt-3 rounded-md border border-line bg-panel px-3 py-2">
	                        <p className="text-[11px] font-semibold text-soft">
	                          점검 기준
	                        </p>
	                        <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
	                          <li>
	                            직접 작성하거나 가져온 저장본이면 출처 없음으로 유지합니다.
	                          </li>
	                          <li>
	                            Dashboard, Learning, Library, Skills 조치에서 만든 결과라면
	                            Studio 저장 출처가 있는 초안 흐름으로 다시 저장합니다.
	                          </li>
	                        </ul>
	                      </div>
	                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
	                        <button
	                          type="button"
	                          className={`${secondaryButtonClass} w-full`}
	                          onClick={copyNoSourceMetaNote}
	                        >
	                          {noSourceMetaNoteCopiedFor === selected.id
	                            ? "메모 복사됨"
	                            : manualCopy?.id === "no-source-meta-note" &&
	                                manualCopy.targetId === selected.id
	                              ? "메모 복사 실패"
	                              : "저장 출처 없음 메모 복사"}
	                        </button>
	                        <button
	                          type="button"
	                          className={`${secondaryButtonClass} w-full`}
	                          onClick={openNoSourceMetaNoteInStudio}
	                        >
	                          Studio로 보내기
	                        </button>
	                      </div>
	                      {manualCopy?.id === "no-source-meta-note" &&
	                      manualCopy.targetId === selected.id ? (
	                        <div className="mt-3">
	                          <ManualCopyPanel
	                            copy={manualCopy}
	                            onClose={() => setManualCopy(null)}
	                          />
	                        </div>
	                      ) : null}
	                      {selectedStudioPersistenceFilterHref ? (
	                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
	                          <button
	                            type="button"
	                            className={`${secondaryButtonClass} w-full`}
	                            onClick={copySelectedStudioPersistenceFilterLink}
	                            data-testid="library-no-source-meta-persistence-link"
	                          >
	                            {selectedStudioPersistenceLinkCopiedFor ===
	                            selected.id
	                              ? "저장 방식 링크 복사됨"
	                              : manualCopy?.id ===
	                                    "selected-studio-persistence-link" &&
	                                  manualCopy.targetId === selected.id
	                                ? "저장 방식 링크 복사 실패"
	                                : "저장 방식 링크 복사"}
	                          </button>
	                          <a
	                            className={`${secondaryButtonClass} w-full`}
	                            href={selectedStudioPersistenceFilterHref}
	                          >
	                            같은 저장 방식 보기
	                          </a>
	                        </div>
	                      ) : null}
	                      {manualCopy?.id ===
	                        "selected-studio-persistence-link" &&
	                      manualCopy.targetId === selected.id ? (
	                        <div className="mt-3">
	                          <ManualCopyPanel
	                            copy={manualCopy}
	                            onClose={() => setManualCopy(null)}
	                          />
	                        </div>
	                      ) : null}
	                    </div>
	                  ) : null}

	                  {selectedImprovementLineage.length > 1 ? (
	                    <div className="rounded-md border border-line bg-surface px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted">개선 체인</p>
                          <p className="mt-1 text-sm font-semibold text-soft">
                            원본부터 현재까지
                          </p>
                        </div>
                        <span className="font-mono text-xs text-accent">
                          {selectedImprovementDepth}차
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {selectedImprovementLineage.map((lineagePrompt, index) => {
                          const isCurrent = lineagePrompt.id === selected.id;
                          const nextPrompt = selectedImprovementLineage[index + 1];
                          const preferredVersion =
                            nextPrompt?.improvementSource?.sourcePromptId ===
                            lineagePrompt.id
                              ? nextPrompt.improvementSource.sourceVersionModel
                              : lineagePrompt.versions[0]?.targetModel;
                          const stageLabel =
                            index === 0 ? "원본" : `${index}차 개선`;

                          return (
                            <button
                              key={lineagePrompt.id}
                              type="button"
                              className={`w-full rounded-md border px-3 py-3 text-left transition disabled:cursor-default ${
                                isCurrent
                                  ? "border-accent bg-accent/10"
                                  : "border-line bg-panel hover:border-accent"
                              }`}
                              disabled={isCurrent}
                              onClick={() =>
                                openPromptDetail(lineagePrompt.id, preferredVersion)
                              }
                            >
                              <div className="flex min-w-0 items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-accent">
                                  {stageLabel}
                                </p>
                                {isCurrent ? (
                                  <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] text-soft">
                                    현재
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 line-clamp-2 break-words text-sm font-semibold text-soft">
                                {lineagePrompt.title}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {selected.improvementSource ? (
                    <div
                      className="rounded-md border border-line bg-surface px-4 py-3"
                      data-testid="library-improvement-source-card"
                      id="library-improvement-source-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-muted">개선 출처</p>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                          {selectedSourceHealthIssueReason ? (
                            <span className="rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                              {
                                sourceReasonFilterLabels[
                                  selectedSourceHealthIssueReason
                                ]
                              }
                            </span>
                          ) : null}
                          <span className="rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                            {formatPromptImprovementDepth(
                              selectedImprovementDepth,
                            )}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 break-words text-sm font-semibold text-soft">
                        {selected.improvementSource.sourcePromptTitle}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-muted">
                        {selected.improvementSource.sourceVersionModel
                          ? `${modelLabels[selected.improvementSource.sourceVersionModel]} 버전 기준`
                          : "Library 선택 버전 기준"}
                      </p>
                      {selectedSourceHealthIssueReason ? (
                        <p className="mt-2 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5 text-muted">
                          {
                            sourceReasonIssueDescriptions[
                              selectedSourceHealthIssueReason
                            ]
                          }
                        </p>
                      ) : null}
                      {selected.improvementSource.sourceFeedback ? (
                        <div className="mt-3 border-l border-accent/50 pl-3">
                          <p className="text-[11px] font-semibold text-accent">
                            반영 피드백 ·{" "}
                            {selected.improvementSource.sourceFeedback.rating.toFixed(
                              0,
                            )}
                            /5 ·{" "}
                            {
                              feedbackTypeLabels[
                                selected.improvementSource.sourceFeedback
                                  .feedbackType
                              ]
                            }
                          </p>
                          <p className="mt-1 break-words text-xs leading-5 text-muted">
                            {selected.improvementSource.sourceFeedback.comment}
                          </p>
                        </div>
                      ) : null}
	                      {sourcePrompt ? (
	                        <div className="mt-3 grid gap-2">
	                          <button
                            type="button"
                            className={`${secondaryButtonClass} w-full`}
                            onClick={() =>
                              openPromptDetail(
                                sourcePrompt.id,
                                selected.improvementSource?.sourceVersionModel,
                              )
                            }
                          >
                            원본 보기
                          </button>
                          {selected.improvementSource.sourceFeedback?.id ? (
                            <button
                              type="button"
                              className={`${secondaryButtonClass} w-full`}
                              onClick={() =>
                                openPromptFeedbackDetail(
                                  sourcePrompt.id,
                                  selected.improvementSource?.sourceFeedback
                                    ?.id ?? "",
                                  selected.improvementSource?.sourceVersionModel,
                                )
                              }
                            >
                              원본 피드백 보기
                            </button>
	                          ) : null}
	                        </div>
	                      ) : deletedSourcePrompt ? (
	                        <div className="mt-3 rounded-md border border-line bg-panel px-3 py-3">
	                          <div className="flex min-w-0 items-start justify-between gap-3">
	                            <div className="min-w-0">
	                              <p className="text-xs font-semibold text-soft">
	                                원본이 삭제 보관함에 있습니다.
	                              </p>
	                              <p className="mt-1 break-words text-xs leading-5 text-muted">
	                                삭제{" "}
	                                {new Date(
	                                  deletedSourcePrompt.deletedAt,
	                                ).toLocaleString("ko-KR")}
	                              </p>
	                            </div>
	                            <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted">
	                              보관됨
	                            </span>
	                          </div>
	                          <button
	                            type="button"
	                            className={`${secondaryButtonClass} mt-3 w-full`}
	                            onClick={() => restoreDeletedPrompt(deletedSourcePrompt)}
	                          >
	                            원본 복원
	                          </button>
	                        </div>
	                      ) : (
	                        <p className="mt-3 text-xs leading-5 text-muted">
	                          원본이 현재 워크스페이스에 없습니다.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {selectedImprovementQualityDelta ? (
                    <div className="rounded-md border border-line bg-surface px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted">개선 효과</p>
                          <p
                            className={`mt-1 font-mono text-3xl font-semibold ${
                              selectedImprovementQualityDelta.delta >= 0
                                ? "text-accent"
                                : "text-muted"
                            }`}
                          >
                            {formatQualityDelta(
                              selectedImprovementQualityDelta.delta,
                            )}
                          </p>
                        </div>
                        <span className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted">
                          {modelLabels[
                            selectedImprovementQualityDelta.sourceVersion
                              .targetModel
                          ]}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md border border-line bg-panel px-3 py-2">
                          <p className="text-muted">원본</p>
                          <p className="mt-1 font-mono text-sm text-soft">
                            {selectedImprovementQualityDelta.sourceScore.toFixed(1)}
                          </p>
                        </div>
                        <div className="rounded-md border border-line bg-panel px-3 py-2">
                          <p className="text-muted">개선본</p>
                          <p className="mt-1 font-mono text-sm text-soft">
                            {selectedImprovementQualityDelta.improvedScore.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {selectedImprovementScoreComparison &&
                  selectedImprovementQualityDelta ? (
                    <div className="rounded-md border border-line bg-surface px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted">원본 대비 품질 변화</p>
                          <p className="mt-1 text-sm font-semibold text-soft">
                            세부 지표 비교
                          </p>
                        </div>
                        <span className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted">
                          {modelLabels[
                            selectedImprovementQualityDelta.sourceVersion
                              .targetModel
                          ]}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="border-r border-line pr-2">
                          <p className="text-muted">개선</p>
                          <p className="mt-1 font-mono text-sm text-accent">
                            {selectedImprovementScoreComparison.improvedCount}
                          </p>
                        </div>
                        <div className="border-r border-line pr-2">
                          <p className="text-muted">유지</p>
                          <p className="mt-1 font-mono text-sm text-soft">
                            {selectedImprovementScoreComparison.unchangedCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted">재검토</p>
                          <p className="mt-1 font-mono text-sm text-muted">
                            {selectedImprovementScoreComparison.regressedCount}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {selectedImprovementScoreComparison.strongestImprovement ? (
                          <div className="border-l-2 border-accent pl-3">
                            <p className="text-xs text-muted">가장 좋아진 항목</p>
                            <p className="mt-1 text-sm font-semibold text-soft">
                              {
                                selectedImprovementScoreComparison
                                  .strongestImprovement.label
                              }{" "}
                              <span className="font-mono text-accent">
                                {formatQualityDelta(
                                  selectedImprovementScoreComparison
                                    .strongestImprovement.delta,
                                )}
                              </span>
                            </p>
                          </div>
                        ) : null}
                        {selectedImprovementScoreComparison.reviewCandidate ? (
                          <div className="border-l-2 border-line pl-3">
                            <p className="text-xs text-muted">다음 재검토 항목</p>
                            <p className="mt-1 text-sm font-semibold text-soft">
                              {
                                selectedImprovementScoreComparison.reviewCandidate
                                  .label
                              }{" "}
                              <span
                                className={`font-mono ${
                                  selectedImprovementScoreComparison
                                    .reviewCandidate.delta < 0
                                    ? "text-muted"
                                    : "text-soft"
                                }`}
                              >
                                {formatQualityDelta(
                                  selectedImprovementScoreComparison
                                    .reviewCandidate.delta,
                                )}
                              </span>
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted">
                              {
                                selectedImprovementScoreComparison.reviewCandidate
                                  .recommendation
                              }
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 space-y-2">
                        {selectedImprovementScoreComparison.metrics.map(
                          (metric) => (
                            <div
                              key={metric.key}
                              className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-line pt-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-2">
                                  <p className="truncate font-semibold text-soft">
                                    {metric.label}
                                  </p>
                                  <span
                                    className={`shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] ${
                                      metric.status === "improved"
                                        ? "text-accent"
                                        : metric.status === "regressed"
                                          ? "text-muted"
                                          : "text-soft"
                                    }`}
                                  >
                                    {metric.status === "improved"
                                      ? "개선"
                                      : metric.status === "regressed"
                                        ? "재검토"
                                        : "유지"}
                                  </span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel">
                                  <div
                                    className="h-full rounded-full bg-accent"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.max(0, metric.improvedScore * 20),
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-soft">
                                  {metric.sourceScore.toFixed(1)} →{" "}
                                  {metric.improvedScore.toFixed(1)}
                                </p>
                                <p
                                  className={`mt-1 font-mono ${
                                    metric.delta >= 0
                                      ? "text-accent"
                                      : "text-muted"
                                  }`}
                                >
                                  {formatQualityDelta(metric.delta)}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}

                  {linkedImprovementPrompts.length ? (
                    <div className="rounded-md border border-line bg-surface px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted">후속 개선본</p>
                          <p className="mt-1 text-sm font-semibold text-soft">
                            현재 기준 재개선 이력
                          </p>
                        </div>
                        <span className="font-mono text-xs text-accent">
                          {linkedImprovementPrompts.length}개
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {linkedImprovementPrompts.map((prompt) => {
                          const qualityDelta = getImprovementQualityDelta({
                            improvementPrompt: prompt,
                            sourcePrompt: selected,
                          });

                          return (
                            <button
                              key={prompt.id}
                              type="button"
                              className="w-full rounded-md border border-line bg-panel px-3 py-3 text-left transition hover:border-accent"
                              onClick={() =>
                                openPromptDetail(
                                  prompt.id,
                                  prompt.versions[0]?.targetModel,
                                )
                              }
                            >
                              <p className="line-clamp-2 break-words text-sm font-semibold text-soft">
                                {prompt.title}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-muted">
                                  {selectedImprovementDepth + 1}차 개선
                                </span>
                                <span className="font-mono text-accent">
                                  {getPromptBestQuality(prompt).toFixed(1)}
                                </span>
                                {qualityDelta ? (
                                  <span
                                    className={
                                      qualityDelta.delta >= 0
                                        ? "text-accent"
                                        : "text-muted"
                                    }
                                  >
                                    개선 효과{" "}
                                    {formatQualityDelta(qualityDelta.delta)}
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted">버전 비교</p>
                        <p className="mt-1 text-sm font-semibold text-soft">
                          AI 도구별 품질과 피드백
                        </p>
                      </div>
                      <span className="font-mono text-xs text-accent">
                        {versionComparisons.length}개
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {versionComparisons.map(
                        ({
                          averageRating,
                          feedbackCount,
                          isBestQuality,
                          isMostReviewed,
                          version,
                        }) => {
                          const isActive =
                            activeVersion.targetModel === version.targetModel;

                          return (
                            <button
                              key={version.id}
                              type="button"
                              className={`w-full rounded-md border px-3 py-3 text-left transition ${
                                isActive
                                  ? "border-accent bg-panel-strong"
                                  : "border-line bg-panel hover:border-accent"
                              }`}
                              onClick={() => {
                                handleVersionChange(version.targetModel);
                              }}
                            >
                              <div className="flex min-w-0 items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-soft">
                                    {modelLabels[version.targetModel]}
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {isActive ? (
                                      <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-muted">
                                        선택됨
                                      </span>
                                    ) : null}
                                    {isBestQuality ? (
                                      <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-muted">
                                        최고 품질
                                      </span>
                                    ) : null}
                                    {isMostReviewed ? (
                                      <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-muted">
                                        피드백 최다
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <span className="font-mono text-sm text-accent">
                                  {version.qualityScore.toFixed(1)}
                                </span>
                              </div>

                              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p className="text-muted">품질</p>
                                  <p className="mt-1 font-mono text-soft">
                                    {version.qualityScore.toFixed(1)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted">피드백</p>
                                  <p className="mt-1 font-mono text-soft">
                                    {feedbackCount}개
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted">평균</p>
                                  <p className="mt-1 font-mono text-soft">
                                    {averageRating
                                      ? averageRating.toFixed(1)
                                      : "-"}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                                <div
                                  className="h-full rounded-full bg-accent"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, version.qualityScore * 20),
                                    )}%`,
                                  }}
                                />
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="text-xs text-muted">언어 전략</p>
                    <p className="mt-1 text-sm font-semibold text-soft">
                      {languageStrategyLabels[getLanguageStrategy(selected)]}
                    </p>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="text-xs text-muted">AI 판단 이유</p>
                    <p className="mt-2 text-xs leading-5 text-soft">
                      {getLanguageDecisionText(selected)}
                    </p>
                    {selected.languageDecision?.signals.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selected.languageDecision.signals.map((signal) => (
                          <span
                            key={signal}
                            className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
                          >
                            {signal}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="text-xs text-muted">AI 도구 추천 이유</p>
                    <p className="mt-1 text-sm font-semibold text-soft">
                      {formatTargetModels(
                        selected.targetModelDecision?.targetModels ??
                          selected.targetModels,
                      )}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-soft">
                      {getTargetModelDecisionText(selected)}
                    </p>
                    {selected.targetModelDecision?.signals.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selected.targetModelDecision.signals.map((signal) => (
                          <span
                            key={signal}
                            className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
                          >
                            {signal}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="text-xs text-muted">답변 언어</p>
                    <p className="mt-1 text-sm font-semibold text-soft">
                      {outputLanguageLabels[getOutputLanguage(selected)]}
                    </p>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted">품질 진단</p>
                        <p className="mt-1 text-sm font-semibold text-soft">
                          전체 점수 기준
                        </p>
                      </div>
                      <span className="font-mono text-xs text-accent">
                        {activeVersion.qualityScore.toFixed(1)}/5
                      </span>
                    </div>
                    <div className="mt-3 space-y-3">
                      <ScoreBar
                        label="명확성"
                        value={activeVersion.scoreBreakdown.clarity}
                      />
                      <ScoreBar
                        label="맥락"
                        value={activeVersion.scoreBreakdown.context}
                      />
                      <ScoreBar
                        label="출력 형식"
                        value={activeVersion.scoreBreakdown.outputFormat}
                      />
                      <ScoreBar
                        label="제약 조건"
                        value={activeVersion.scoreBreakdown.constraints}
                      />
                      <ScoreBar
                        label="전문성"
                        value={activeVersion.scoreBreakdown.expertise}
                      />
                      <ScoreBar
                        label="도구 적합성"
                        value={activeVersion.scoreBreakdown.modelFit}
                      />
                      <ScoreBar
                        label="재사용성"
                        value={activeVersion.scoreBreakdown.reusability}
                      />
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="text-xs text-muted">맥락 진단</p>
                    <div className="mt-3 space-y-4">
                      <div>
                        <p className="mb-2 text-sm font-semibold text-soft">가정</p>
                        <ul className="space-y-2 text-xs leading-5 text-muted">
                          {activeVersion.assumptions.length ? (
                            activeVersion.assumptions.map((item, index) => (
                              <li key={`${item}-${index}`}>- {item}</li>
                            ))
                          ) : (
                            <li>- 명시된 가정 없음</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-semibold text-soft">
                          부족한 정보
                        </p>
                        <ul className="space-y-2 text-xs leading-5 text-muted">
                          {activeVersion.missingContext.length ? (
                            activeVersion.missingContext.map((item, index) => (
                              <li key={`${item}-${index}`}>- {item}</li>
                            ))
                          ) : (
                            <li>- 현재 입력만으로 생성 가능</li>
                          )}
                        </ul>
                        {activeVersion.missingContext.length ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                            <a
                              className={`${secondaryButtonClass} w-full`}
                              href={profileContextHref}
                            >
                              개인 프로필 보강
                            </a>
                            <a
                              className={`${secondaryButtonClass} w-full`}
                              href={companyContextHref}
                            >
                              회사 정보 보강
                            </a>
                            <button
                              className={`${secondaryButtonClass} w-full`}
                              type="button"
                              onClick={copyMissingContextQuestions}
                            >
                              {contextQuestionsCopied
                                ? "보강 질문 복사됨"
                                : contextQuestionsCopyFailed
                                  ? "보강 질문 복사 실패"
                                  : "보강 질문 복사"}
                            </button>
                            {manualCopy?.id === "missing-context" ? (
                              <div className="sm:col-span-2 xl:col-span-1">
                                <ManualCopyPanel
                                  copy={manualCopy}
                                  onClose={() => setManualCopy(null)}
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted">개선 액션</p>
                        <p className="mt-1 text-sm font-semibold text-soft">
                          브리프 복사 기준
                        </p>
                      </div>
                      <span className="font-mono text-xs text-accent">
                        {improvementActions.length}개
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {improvementActions.map((item) => (
                        <div
                          key={item.key}
                          className="rounded-md border border-line bg-panel px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-soft">
                              {item.label}
                            </p>
                            <span className="font-mono text-xs text-accent">
                              {item.score.toFixed(1)}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-muted">
                            {item.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                      <button
                        className={primaryButtonClass}
                        type="button"
                        onClick={openImprovementInStudio}
                      >
                        Studio에서 개선
                      </button>
                      <button
                        className={secondaryButtonClass}
                        type="button"
                        onClick={copyImprovementBrief}
                      >
                        {improvementBriefCopied
                          ? "개선 브리프 복사됨"
                          : manualCopy?.id === "improvement-brief"
                            ? "개선 브리프 복사 실패"
                            : "개선 브리프 복사"}
                      </button>
                    </div>
                    {manualCopy?.id === "improvement-brief" ? (
                      <div className="mt-3">
                        <ManualCopyPanel
                          copy={manualCopy}
                          onClose={() => setManualCopy(null)}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-line pt-5">
                    <p className="mb-3 text-sm font-semibold">피드백 추가</p>
                    <div className="space-y-3">
                      <Field label="점수">
                        <select
                          className={selectClass}
                          value={rating}
                          onChange={(event) => setRating(Number(event.target.value))}
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="유형">
                        <select
                          className={selectClass}
                          value={feedbackType}
                          onChange={(event) =>
                            setFeedbackType(event.target.value as Feedback["feedbackType"])
                          }
                        >
                          <option value="format">출력 형식</option>
                          <option value="tone">톤</option>
                          <option value="context">맥락</option>
                          <option value="accuracy">정확성</option>
                          <option value="company_rule">회사 기준</option>
                          <option value="other">기타</option>
                        </select>
                      </Field>
                      <Field label="코멘트">
                        <textarea
                          className={textareaClass}
                          rows={4}
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          placeholder="예: 이 구조는 좋지만 회사 톤이 더 차분해야 함"
                        />
                      </Field>
                      <button
                        className={`${primaryButtonClass} w-full`}
                        type="button"
                        onClick={addFeedback}
                        disabled={!comment.trim()}
                      >
                        피드백 저장
                      </button>
                    </div>
                  </div>

                  <div id="library-feedback-section" className="scroll-mt-6">
                    <p className="mb-2 text-sm font-semibold">최근 피드백</p>
                    <div className="space-y-2">
                      {selected.feedback.slice(0, 5).map((feedback) => {
                        const isHighlighted =
                          highlightedFeedbackId === feedback.id ||
                          latestFeedbackId === feedback.id;

                        return (
                          <div
                            key={feedback.id}
                            id={`library-feedback-${feedback.id}`}
                            tabIndex={-1}
                            className={`scroll-mt-6 rounded-md border p-3 text-sm outline-none transition ${
                              isHighlighted
                                ? "border-accent bg-accent/10"
                                : "border-line bg-surface"
                            }`}
                          >
                            <div className="flex min-w-0 items-start justify-between gap-2">
                              <p className="font-mono text-xs text-accent">
                                {feedback.rating}/5 ·{" "}
                                {feedbackTypeLabels[feedback.feedbackType]}
                              </p>
                              {latestFeedbackId === feedback.id ? (
                                <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-soft">
                                  저장됨
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 leading-5 text-muted">
                              {feedback.comment}
                            </p>
                            <button
                              type="button"
                              className={`${secondaryButtonClass} mt-3 w-full`}
                              onClick={() => openFeedbackImprovementInStudio(feedback)}
                            >
                              이 피드백으로 Studio 개선
                            </button>
                          </div>
                        );
                      })}
                      {selected.feedback.length === 0 ? (
                        <p className="text-sm text-muted">아직 피드백이 없습니다.</p>
                      ) : null}
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="flex min-h-[720px] items-center justify-center px-5 text-center text-sm text-muted">
              {prompts.length
                ? "필터 조건에 맞는 프롬프트가 없습니다."
                : "저장된 프롬프트가 없습니다. Studio에서 생성 후 저장하세요."}
            </div>
          )}
        </Panel>
  );
}
