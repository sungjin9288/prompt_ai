"use client";

import Link from "next/link";
import {
  Panel,
  PanelHeader,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import { modelLabels } from "@/lib/prompt";
import type {
  PromptStudioDraftSource,
  PromptStudioDraftSourceVariant,
} from "@/lib/prompt";
import {
  reimprovementQualityThreshold,
  type PromptImprovementGroup,
  type PromptImprovementRecord,
  type PromptImprovementSummary,
  type PromptSourceHealthIssue,
} from "@/lib/analytics/prompt-improvement";
import {
  formatSignedScore,
  formatDashboardDate,
  feedbackTypeLabels,
  type StudioPersistenceSummaryItem,
  type StudioSourceSummaryItem,
} from "@/lib/dashboard/shared";
import {
  improvementLibraryHref,
  studioPersistenceLibraryHref,
  studioSourceLibraryHref,
  feedbackImprovementLearningHref,
  promptDetailLibraryHref,
  promptFeedbackLibraryHref,
} from "@/lib/dashboard/hrefs";
import {
  learningScopeLabels,
  type FeedbackBasedImprovementRecord,
} from "@/lib/dashboard/learning-memory";
import {
  sourceHealthIssueReasonLabel,
  summarizeSourceHealthIssueReasons,
  sourceHealthIssueKey,
  feedbackImprovementPriorityReason,
  improvementStatusLabel,
  reimprovementReason,
} from "@/lib/dashboard/source-reports";
import type {
  CopyStatus,
  DashboardManualCopy,
  KeyedCopyStatus,
  StudioPersistenceKeyedCopyStatus,
} from "./dashboard-view-types";

type SourceHealthReasonBreakdown = ReturnType<
  typeof summarizeSourceHealthIssueReasons
>;

function ImprovementGroupLink({ group }: { group: PromptImprovementGroup }) {
  return (
    <Link
      href={improvementLibraryHref({
        depth: group.depth,
        domain: group.targetModel || group.depth ? undefined : group.label,
        targetModel: group.targetModel,
      })}
      className="rounded-md border border-line bg-surface px-4 py-4 transition hover:border-accent hover:bg-panel-strong"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold">{group.label}</p>
          <p className="mt-1 text-xs text-muted">
            {group.count}개 개선본 · {improvementStatusLabel(group.averageDelta)} ·
            최고 {formatSignedScore(group.bestDelta)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-md border border-line bg-panel px-2 py-1 text-xs ${
            group.averageDelta >= 0 ? "text-accent" : "text-muted"
          }`}
        >
          {formatSignedScore(group.averageDelta)}
        </span>
      </div>
    </Link>
  );
}

export interface DashboardImprovementPanelProps {
  improvementSummary: PromptImprovementSummary;
  studioPersistenceSummary: StudioPersistenceSummaryItem[];
  missingSourceMetadataSummary: StudioPersistenceSummaryItem | undefined;
  studioSourceSummary: StudioSourceSummaryItem[];
  sourceHealthPreviewIssues: PromptSourceHealthIssue[];
  sourceHealthReasonBreakdown: SourceHealthReasonBreakdown;
  feedbackBasedImprovementRecords: FeedbackBasedImprovementRecord[];
  feedbackImprovementAverageDelta: number;
  feedbackImprovementReviewCount: number;
  feedbackImprovementArchivedSourceCount: number;
  feedbackImprovementPriorityRecord: FeedbackBasedImprovementRecord | null;
  studioPersistenceAllLinkCopyStatus: CopyStatus;
  studioPersistenceLinkCopyStatus: StudioPersistenceKeyedCopyStatus | null;
  studioPersistenceManualCopy: DashboardManualCopy | null;
  missingSourceMetadataQueueCopyStatus: CopyStatus;
  missingSourceMetadataQueueLinkCopyStatus: CopyStatus;
  missingSourceMetadataQueueManualCopy: DashboardManualCopy | null;
  studioSourceOpsReportCopyStatus: CopyStatus;
  studioSourceOpsManualCopy: DashboardManualCopy | null;
  studioSourceAllFilterLinkCopyStatus: CopyStatus;
  studioSourceFilterLinkCopyStatus: KeyedCopyStatus | null;
  studioSourceFilterManualCopy: DashboardManualCopy | null;
  studioSourceExampleLinkCopyStatus: KeyedCopyStatus | null;
  studioSourceExampleManualCopy: DashboardManualCopy | null;
  sourceHealthLinkCopyStatus: KeyedCopyStatus | null;
  sourceHealthCandidateCopyStatus: KeyedCopyStatus | null;
  sourceHealthActionCopyStatus: CopyStatus;
  sourceHealthManualCopy: DashboardManualCopy | null;
  feedbackImprovementPriorityCopyStatus: CopyStatus;
  feedbackImprovementPriorityMemorySaveStatus: "idle" | "saved" | "skipped";
  feedbackImprovementPriorityMemoryPreview:
    | import("@/lib/prompt").LearningMemory
    | null;
  feedbackImprovementOpsReportCopyStatus: CopyStatus;
  feedbackImprovementMemorySaveStatus: "idle" | "saved" | "skipped";
  feedbackImprovementMemorySaveCount: number;
  feedbackImprovementOpsManualCopy: DashboardManualCopy | null;
  copyStudioPersistenceAllLink: () => Promise<void>;
  copyStudioPersistenceLink: (item: StudioPersistenceSummaryItem) => Promise<void>;
  copyMissingSourceMetadataQueueLink: () => Promise<void>;
  copyMissingSourceMetadataQueuePrompt: () => Promise<void>;
  openMissingSourceMetadataQueueInStudio: () => void;
  copyStudioSourceOpsReport: () => Promise<void>;
  openStudioSourceOpsReportInStudio: () => void;
  copyStudioSourceAllFilterLink: () => Promise<void>;
  copyStudioSourceFilterLink: (input: {
    source: PromptStudioDraftSource;
    label: string;
  }) => Promise<void>;
  copyStudioSourceVariantFilterLink: (input: {
    href: string;
    label: string;
    source: PromptStudioDraftSource;
    sourceVariant: PromptStudioDraftSourceVariant;
  }) => Promise<void>;
  copyStudioSourceExampleLink: (input: {
    href: string;
    linkLabel?: string;
    originalHref?: string;
    title: string;
  }) => Promise<void>;
  copySourceHealthLink: (input: {
    href: string;
    key: string;
    title: string;
  }) => Promise<void>;
  copySourceHealthCandidateMemo: (issue: PromptSourceHealthIssue) => Promise<void>;
  openSourceHealthCandidateInStudio: (issue: PromptSourceHealthIssue) => void;
  copySourceHealthActionReport: () => Promise<void>;
  openSourceHealthActionReportInStudio: () => void;
  openReimprovementInStudio: (record: PromptImprovementRecord) => void;
  copyFeedbackImprovementPriorityReport: () => Promise<void>;
  openFeedbackImprovementPriorityInStudio: () => void;
  saveFeedbackImprovementPriorityMemory: () => void;
  copyFeedbackImprovementOpsReport: () => Promise<void>;
  openFeedbackImprovementOpsReportInStudio: () => void;
  saveFeedbackImprovementMemories: () => void;
  setMissingSourceMetadataQueueManualCopy: (
    value: DashboardManualCopy | null,
  ) => void;
  setStudioPersistenceManualCopy: (value: DashboardManualCopy | null) => void;
  setStudioSourceOpsManualCopy: (value: DashboardManualCopy | null) => void;
  setStudioSourceExampleManualCopy: (value: DashboardManualCopy | null) => void;
  setStudioSourceFilterManualCopy: (value: DashboardManualCopy | null) => void;
  setSourceHealthManualCopy: (value: DashboardManualCopy | null) => void;
  setFeedbackImprovementOpsManualCopy: (
    value: DashboardManualCopy | null,
  ) => void;
}

export function DashboardImprovementPanel({
  improvementSummary,
  studioPersistenceSummary,
  missingSourceMetadataSummary,
  studioSourceSummary,
  sourceHealthPreviewIssues,
  sourceHealthReasonBreakdown,
  feedbackBasedImprovementRecords,
  feedbackImprovementAverageDelta,
  feedbackImprovementReviewCount,
  feedbackImprovementArchivedSourceCount,
  feedbackImprovementPriorityRecord,
  studioPersistenceAllLinkCopyStatus,
  studioPersistenceLinkCopyStatus,
  studioPersistenceManualCopy,
  missingSourceMetadataQueueCopyStatus,
  missingSourceMetadataQueueLinkCopyStatus,
  missingSourceMetadataQueueManualCopy,
  studioSourceOpsReportCopyStatus,
  studioSourceOpsManualCopy,
  studioSourceAllFilterLinkCopyStatus,
  studioSourceFilterLinkCopyStatus,
  studioSourceFilterManualCopy,
  studioSourceExampleLinkCopyStatus,
  studioSourceExampleManualCopy,
  sourceHealthLinkCopyStatus,
  sourceHealthCandidateCopyStatus,
  sourceHealthActionCopyStatus,
  sourceHealthManualCopy,
  feedbackImprovementPriorityCopyStatus,
  feedbackImprovementPriorityMemorySaveStatus,
  feedbackImprovementPriorityMemoryPreview,
  feedbackImprovementOpsReportCopyStatus,
  feedbackImprovementMemorySaveStatus,
  feedbackImprovementMemorySaveCount,
  feedbackImprovementOpsManualCopy,
  copyStudioPersistenceAllLink,
  copyStudioPersistenceLink,
  copyMissingSourceMetadataQueueLink,
  copyMissingSourceMetadataQueuePrompt,
  openMissingSourceMetadataQueueInStudio,
  copyStudioSourceOpsReport,
  openStudioSourceOpsReportInStudio,
  copyStudioSourceAllFilterLink,
  copyStudioSourceFilterLink,
  copyStudioSourceVariantFilterLink,
  copyStudioSourceExampleLink,
  copySourceHealthLink,
  copySourceHealthCandidateMemo,
  openSourceHealthCandidateInStudio,
  copySourceHealthActionReport,
  openSourceHealthActionReportInStudio,
  openReimprovementInStudio,
  copyFeedbackImprovementPriorityReport,
  openFeedbackImprovementPriorityInStudio,
  saveFeedbackImprovementPriorityMemory,
  copyFeedbackImprovementOpsReport,
  openFeedbackImprovementOpsReportInStudio,
  saveFeedbackImprovementMemories,
  setMissingSourceMetadataQueueManualCopy,
  setStudioPersistenceManualCopy,
  setStudioSourceOpsManualCopy,
  setStudioSourceExampleManualCopy,
  setStudioSourceFilterManualCopy,
  setSourceHealthManualCopy,
  setFeedbackImprovementOpsManualCopy,
}: DashboardImprovementPanelProps) {
  return (
      <Panel className="mt-6">
        <PanelHeader
          title="프롬프트 개선 효과"
          description="Library 개선본의 원본 대비 품질 점수 변화를 차수, 분야, AI 도구별로 집계합니다."
        />
        <div className="grid gap-0 divide-y divide-line xl:grid-cols-[280px_1fr_1fr_1fr] xl:divide-x xl:divide-y-0">
          <div className="px-5 py-5">
            <p className="text-sm font-semibold">평균 개선폭</p>
            <p
              className={`mt-2 font-mono text-4xl font-semibold ${
                improvementSummary.averageDelta >= 0 ? "text-accent" : "text-muted"
              }`}
            >
              {improvementSummary.measurableCount
                ? formatSignedScore(improvementSummary.averageDelta)
                : "-"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
              <Link
                href={improvementLibraryHref()}
                className="rounded-md px-2 py-2 transition hover:bg-surface"
              >
                <p className="text-muted">측정</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {improvementSummary.measurableCount}
                </p>
              </Link>
              <Link
                href={improvementLibraryHref({ improvement: "improved" })}
                className="rounded-md px-2 py-2 transition hover:bg-surface"
              >
                <p className="text-muted">개선</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {improvementSummary.improvedCount}
                </p>
              </Link>
              <Link
                href={improvementLibraryHref({ improvement: "regressed" })}
                className="rounded-md px-2 py-2 transition hover:bg-surface"
              >
                <p className="text-muted">재검토</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {improvementSummary.regressedCount}
                </p>
              </Link>
              <Link
                href={improvementLibraryHref({ improvement: "archived-source" })}
                className="rounded-md px-2 py-2 transition hover:bg-surface"
              >
                <p className="text-muted">보관함</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {improvementSummary.archivedSourceCount}
                </p>
              </Link>
              <Link
                href={improvementLibraryHref({ improvement: "unmeasured" })}
                className="rounded-md px-2 py-2 transition hover:bg-surface"
              >
                <p className="text-muted">미측정</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {improvementSummary.unmeasuredCount}
                </p>
              </Link>
            </div>
            <div
              data-testid="dashboard-studio-persistence-summary"
              className="mt-4 border-l border-line pl-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-soft">
                  Studio 저장 방식
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    data-testid="dashboard-studio-persistence-all-link-copy"
                    className="text-[11px] font-semibold text-accent transition hover:text-soft"
                    onClick={copyStudioPersistenceAllLink}
                  >
                    {studioPersistenceAllLinkCopyStatus === "copied"
                      ? "전체 링크 복사됨"
                      : studioPersistenceAllLinkCopyStatus === "failed"
                        ? "전체 링크 실패"
                        : "전체 링크"}
                  </button>
                  <Link
                    href="/library"
                    className="text-[11px] font-semibold text-accent transition hover:text-soft"
                  >
                    전체 보기
                  </Link>
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                개선 체인은 품질 비교에 쓰고, 운영 출처는 복원/점검 초안으로
                분리해 봅니다.
              </p>
              <Link
                href={studioPersistenceLibraryHref("none")}
                data-testid="dashboard-missing-source-metadata-queue"
                className="mt-3 block rounded-md border border-line bg-surface px-3 py-2 transition hover:bg-panel-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-soft">
                      저장 출처 메타 없음 큐
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-muted">
                      유지할 직접 저장본과 추적 가능한 Studio 흐름으로 다시
                      저장할 항목을 나눕니다.
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold text-soft">
                    {missingSourceMetadataSummary?.count ?? 0}
                  </span>
                </div>
              </Link>
              <div className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-3">
                <button
                  type="button"
                  data-testid="dashboard-missing-source-metadata-queue-link-copy"
                  className="rounded-md border border-line px-3 py-2 text-left text-[11px] font-semibold text-accent transition hover:bg-surface hover:text-soft"
                  onClick={copyMissingSourceMetadataQueueLink}
                >
                  {missingSourceMetadataQueueLinkCopyStatus === "copied"
                    ? "복사됨"
                    : missingSourceMetadataQueueLinkCopyStatus === "failed"
                      ? "복사 실패"
                      : "큐 링크 복사"}
                </button>
                <button
                  type="button"
                  data-testid="dashboard-missing-source-metadata-queue-copy"
                  className="rounded-md border border-line px-3 py-2 text-left text-[11px] font-semibold text-accent transition hover:bg-surface hover:text-soft"
                  onClick={copyMissingSourceMetadataQueuePrompt}
                >
                  {missingSourceMetadataQueueCopyStatus === "copied"
                    ? "복사됨"
                    : missingSourceMetadataQueueCopyStatus === "failed"
                      ? "복사 실패"
                      : "큐 프롬프트 복사"}
                </button>
                <button
                  type="button"
                  data-testid="dashboard-missing-source-metadata-queue-studio"
                  className="rounded-md border border-line px-3 py-2 text-left text-[11px] font-semibold text-accent transition hover:bg-surface hover:text-soft"
                  onClick={openMissingSourceMetadataQueueInStudio}
                >
                  큐 운영 기준 Studio로
                </button>
              </div>
              {missingSourceMetadataQueueManualCopy ? (
                <ManualCopyPanel
                  copy={missingSourceMetadataQueueManualCopy}
                  onClose={() => setMissingSourceMetadataQueueManualCopy(null)}
                  className="mt-3 bg-surface"
                  showHeading={false}
                  height="h-32"
                  ariaLabel="수동 복사용 저장 출처 메타 없음 큐 운영 프롬프트"
                />
              ) : null}
              <div className="mt-3 grid gap-2 text-[11px]">
                {studioPersistenceSummary.map((item) => (
                  <div
                    key={item.mode}
                    className="rounded-md bg-surface px-3 py-2 transition hover:bg-panel-strong"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-soft">
                          {item.label}
                        </p>
                        <p className="mt-1 line-clamp-2 leading-4 text-muted">
                          {item.description}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-soft">
                        {item.count}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Link
                        href={studioPersistenceLibraryHref(item.mode)}
                        className="rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                      >
                        보기
                      </Link>
                      <button
                        type="button"
                        data-testid="dashboard-studio-persistence-link-copy"
                        className="rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                        onClick={() => copyStudioPersistenceLink(item)}
                      >
                        {studioPersistenceLinkCopyStatus?.key === item.mode &&
                        studioPersistenceLinkCopyStatus.status === "copied"
                          ? "링크 복사됨"
                          : studioPersistenceLinkCopyStatus?.key ===
                                item.mode &&
                              studioPersistenceLinkCopyStatus.status === "failed"
                            ? "링크 실패"
                            : "링크 복사"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {studioPersistenceManualCopy ? (
                <ManualCopyPanel
                  copy={studioPersistenceManualCopy}
                  onClose={() => setStudioPersistenceManualCopy(null)}
                  className="mt-3 bg-surface"
                  showHeading={false}
                  height="h-24"
                  ariaLabel="수동 복사용 Studio 저장 방식 링크"
                />
              ) : null}
              <div className="mt-3 border-t border-line pt-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold text-soft">
                    Studio 저장 출처
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-accent transition hover:text-soft"
                      onClick={copyStudioSourceOpsReport}
                    >
                      {studioSourceOpsReportCopyStatus === "copied"
                        ? "복사됨"
                        : studioSourceOpsReportCopyStatus === "failed"
                          ? "복사 실패"
                          : "복사"}
                    </button>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-accent transition hover:text-soft"
                      onClick={openStudioSourceOpsReportInStudio}
                    >
                      Studio로
                    </button>
                    <button
                      type="button"
                      data-testid="dashboard-studio-source-all-filter-link-copy"
                      className="text-[11px] font-semibold text-accent transition hover:text-soft"
                      onClick={copyStudioSourceAllFilterLink}
                    >
                      {studioSourceAllFilterLinkCopyStatus === "copied"
                        ? "전체 링크 복사됨"
                        : studioSourceAllFilterLinkCopyStatus === "failed"
                          ? "전체 링크 실패"
                          : "전체 링크"}
                    </button>
                    <Link
                      href={studioSourceLibraryHref()}
                      className="text-[11px] font-semibold text-muted transition hover:text-accent"
                    >
                      전체
                    </Link>
                  </div>
                </div>
                {studioSourceSummary.length ? (
                  <div className="mt-2 grid gap-2 text-[11px]">
                    {studioSourceSummary.map((item) => (
                      <div
                        key={item.source}
                        className="rounded-md px-2 py-2 transition hover:bg-surface"
                      >
                        <Link
                          href={studioSourceLibraryHref({ source: item.source })}
                          className="block"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-soft">
                                {item.label}
                              </p>
                              <p className="mt-1 line-clamp-2 leading-4 text-muted">
                                {item.description}
                              </p>
                              <p className="mt-1 line-clamp-2 leading-4 text-accent">
                                {item.nextAction}
                              </p>
                              {item.sourceTitles.length ? (
                                <p className="mt-1 line-clamp-2 leading-4 text-muted">
                                  대표 출처 · {item.sourceTitles.join(", ")}
                                </p>
                              ) : null}
                            </div>
                            <span className="shrink-0 font-mono text-soft">
                              {item.count}
                            </span>
                          </div>
                        </Link>
                        {item.sourceVariantLinks.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.sourceVariantLinks.map((variant) => {
                              const variantCopyKey = `${item.source}:${variant.sourceVariant}`;

                              return (
                                <span
                                  key={variantCopyKey}
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
                                    data-testid="dashboard-studio-source-variant-filter-link-copy"
                                    className="font-semibold text-accent transition hover:text-soft"
                                    onClick={() =>
                                      copyStudioSourceVariantFilterLink({
                                        href: variant.href,
                                        label: variant.label,
                                        source: item.source,
                                        sourceVariant: variant.sourceVariant,
                                      })
                                    }
                                  >
                                    {studioSourceFilterLinkCopyStatus?.key ===
                                      variantCopyKey &&
                                    studioSourceFilterLinkCopyStatus.status ===
                                      "copied"
                                      ? "복사됨"
                                      : studioSourceFilterLinkCopyStatus?.key ===
                                            variantCopyKey &&
                                          studioSourceFilterLinkCopyStatus.status ===
                                            "failed"
                                        ? "실패"
                                        : "복사"}
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          data-testid="dashboard-studio-source-filter-link-copy"
                          className="mt-2 rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                          onClick={() => copyStudioSourceFilterLink(item)}
                        >
                          {studioSourceFilterLinkCopyStatus?.key ===
                            item.source &&
                          studioSourceFilterLinkCopyStatus.status === "copied"
                            ? "필터 링크 복사됨"
                            : studioSourceFilterLinkCopyStatus?.key ===
                                  item.source &&
                                studioSourceFilterLinkCopyStatus.status ===
                                  "failed"
                              ? "필터 링크 실패"
                              : "필터 링크 복사"}
                        </button>
                        {item.sourceExamples.length ? (
                          <div className="mt-2 grid gap-1.5 border-t border-line pt-2">
                            {item.sourceExamples.slice(0, 2).map((example) => (
                              <div
                                key={`${item.source}-${example.href}`}
                                className="flex min-w-0 items-center gap-1.5"
                              >
                                <Link
                                  href={example.href}
                                  className="min-w-0 flex-1 truncate rounded-md border border-line bg-panel px-2 py-1 font-semibold text-muted transition hover:text-accent"
                                >
                                  {example.title}
                                </Link>
                                <button
                                  type="button"
                                  className="shrink-0 rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                                  onClick={() =>
                                    copyStudioSourceExampleLink({
                                      ...example,
                                      linkLabel: "대표 저장본 상세",
                                    })
                                  }
                                >
                                  {studioSourceExampleLinkCopyStatus?.key ===
                                    example.href &&
                                  studioSourceExampleLinkCopyStatus.status ===
                                    "copied"
                                    ? "복사됨"
                                    : studioSourceExampleLinkCopyStatus?.key ===
                                          example.href &&
                                        studioSourceExampleLinkCopyStatus.status ===
                                          "failed"
                                      ? "실패"
                                      : "복사"}
                                </button>
                                {example.originalHref ? (
                                  <>
                                    <Link
                                      href={example.originalHref}
                                      className="shrink-0 rounded-md border border-line px-2 py-1 font-semibold text-soft transition hover:bg-panel hover:text-accent"
                                    >
                                      {example.originalActionLabel ?? "원본"}
                                    </Link>
                                    <button
                                      type="button"
                                      className="shrink-0 rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                                      onClick={() =>
                                        copyStudioSourceExampleLink({
                                          href: example.originalHref ?? "",
                                          linkLabel:
                                            example.originalActionLabel ??
                                            "원본 경로",
                                          originalHref: example.originalHref,
                                          title: example.title,
                                        })
                                      }
                                    >
                                      {studioSourceExampleLinkCopyStatus?.key ===
                                        example.originalHref &&
                                      studioSourceExampleLinkCopyStatus.status ===
                                        "copied"
                                        ? "원본 복사됨"
                                        : studioSourceExampleLinkCopyStatus?.key ===
                                              example.originalHref &&
                                            studioSourceExampleLinkCopyStatus.status ===
                                              "failed"
                                          ? "원본 실패"
                                          : "원본 복사"}
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            ))}
                            {item.count >
                            Math.min(item.sourceExamples.length, 2) ? (
                              <span className="rounded-md border border-line px-2 py-1 font-mono text-muted">
                                +
                                {item.count -
                                  Math.min(item.sourceExamples.length, 2)}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-md bg-surface px-2 py-2 text-[11px] leading-4 text-muted">
                    아직 Studio 저장 출처 메타가 있는 저장본이 없습니다.
                  </p>
                )}
                {studioSourceOpsManualCopy ? (
                  <ManualCopyPanel
                    copy={studioSourceOpsManualCopy}
                    onClose={() => setStudioSourceOpsManualCopy(null)}
                    className="mt-3 bg-surface"
                    showHeading={false}
                    height="h-36"
                    ariaLabel="수동 복사용 Studio 저장 출처 운영 리포트"
                  />
                ) : null}
                {studioSourceExampleManualCopy ? (
                  <ManualCopyPanel
                    copy={studioSourceExampleManualCopy}
                    onClose={() => setStudioSourceExampleManualCopy(null)}
                    className="mt-3 bg-surface"
                    showHeading={false}
                    height="h-24"
                    ariaLabel="수동 복사용 대표 저장본 링크"
                  />
                ) : null}
                {studioSourceFilterManualCopy ? (
                  <ManualCopyPanel
                    copy={studioSourceFilterManualCopy}
                    onClose={() => setStudioSourceFilterManualCopy(null)}
                    className="mt-3 bg-surface"
                    showHeading={false}
                    height="h-24"
                    ariaLabel="수동 복사용 Studio 저장 출처 필터 링크"
                  />
                ) : null}
              </div>
            </div>
            <div className="mt-4 border-l border-line pl-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-soft">출처 상태 조치</p>
                <span className="font-mono text-xs text-muted">
                  {improvementSummary.archivedSourceCount +
                    improvementSummary.unmeasuredCount}
                  개
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                {improvementSummary.archivedSourceCount ||
                improvementSummary.unmeasuredCount
                  ? "보관함 원본은 복원 여부를 확인하고, 측정 불가 항목은 원본 연결을 먼저 정리합니다."
                  : "현재 복원 또는 원본 연결 확인이 필요한 개선본은 없습니다."}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {[
                  {
                    href: improvementLibraryHref({
                      improvement: "archived-source",
                    }),
                    key: "source-health-archived-source",
                    label: `보관함 원본 ${improvementSummary.archivedSourceCount}개`,
                    title: "출처 상태 링크 · 보관함 원본",
                  },
                  {
                    href: improvementLibraryHref({ improvement: "unmeasured" }),
                    key: "source-health-unmeasured",
                    label: `측정 불가 ${improvementSummary.unmeasuredCount}개`,
                    title: "출처 상태 링크 · 측정 불가",
                  },
                ].map((item) => (
                  <span key={item.key} className="inline-flex items-center gap-2">
                    <Link
                      href={item.href}
                      className="font-semibold text-accent transition hover:text-soft"
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      data-testid="dashboard-source-health-link-copy"
                      className="font-semibold text-muted transition hover:text-accent"
                      onClick={() => copySourceHealthLink(item)}
                    >
                      {sourceHealthLinkCopyStatus?.key === item.key &&
                      sourceHealthLinkCopyStatus.status === "copied"
                        ? "링크 복사됨"
                        : sourceHealthLinkCopyStatus?.key === item.key &&
                            sourceHealthLinkCopyStatus.status === "failed"
                          ? "링크 실패"
                          : "링크 복사"}
                    </button>
                  </span>
                ))}
              </div>
              <div
                data-testid="dashboard-source-health-reasons"
                className="mt-3 grid grid-cols-2 gap-2 text-[11px]"
              >
                {sourceHealthReasonBreakdown.map((item) => {
                  const sourceHealthReasonHref = improvementLibraryHref({
                    improvement:
                      item.reason === "archived-source"
                        ? "archived-source"
                        : "unmeasured",
                    sourceReason: item.reason,
                  });
                  const sourceHealthReasonKey = `source-health-reason-${item.reason}`;

                  return (
                    <div
                      key={item.reason}
                      className="rounded-md bg-surface px-2 py-2 transition hover:bg-panel-strong"
                    >
                      <Link
                        href={sourceHealthReasonHref}
                        className="block"
                      >
                        <p className="truncate text-muted">{item.label}</p>
                        <p className="mt-1 font-mono font-semibold text-soft">
                          {item.count}
                        </p>
                      </Link>
                      <button
                        type="button"
                        data-testid="dashboard-source-health-reason-link-copy"
                        className="mt-2 rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                        onClick={() =>
                          copySourceHealthLink({
                            href: sourceHealthReasonHref,
                            key: sourceHealthReasonKey,
                            title: `출처 상태 사유 링크 · ${item.label}`,
                          })
                        }
                      >
                        {sourceHealthLinkCopyStatus?.key ===
                          sourceHealthReasonKey &&
                        sourceHealthLinkCopyStatus.status === "copied"
                          ? "링크 복사됨"
                          : sourceHealthLinkCopyStatus?.key ===
                                sourceHealthReasonKey &&
                              sourceHealthLinkCopyStatus.status === "failed"
                            ? "링크 실패"
                            : "링크 복사"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div
                data-testid="dashboard-source-health-candidates"
                className="mt-3 space-y-2 rounded-md bg-surface px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-soft">
                    대표 확인 후보
                  </p>
                  <span className="font-mono text-[11px] text-muted">
                    {sourceHealthPreviewIssues.length}/
                    {improvementSummary.sourceHealthIssues.length}
                  </span>
                </div>
                {sourceHealthPreviewIssues.length ? (
                  <div className="space-y-2">
                    {sourceHealthPreviewIssues.map((issue) => {
                      const candidateKey = sourceHealthIssueKey(issue);
                      const candidateDetailHref = promptDetailLibraryHref(
                        issue.prompt.id,
                        issue.targetModel,
                      );
                      const candidateDetailLinkKey = `${candidateKey}-detail-link`;
                      const candidateCopyStatus =
                        sourceHealthCandidateCopyStatus?.key === candidateKey
                          ? sourceHealthCandidateCopyStatus.status
                          : null;
                      const candidateDetailLinkCopyStatus =
                        sourceHealthLinkCopyStatus?.key === candidateDetailLinkKey
                          ? sourceHealthLinkCopyStatus.status
                          : null;

                      return (
                        <div
                          key={candidateKey}
                          className="rounded-md border border-line bg-panel px-3 py-2"
                        >
                          <Link
                            href={candidateDetailHref}
                            className="block transition hover:text-accent"
                          >
                            <span className="block truncate text-xs font-semibold text-soft">
                              {issue.prompt.title}
                            </span>
                            <span className="mt-1 block break-words text-[11px] leading-4 text-muted">
                              {sourceHealthIssueReasonLabel(issue.reason)}
                              {issue.sourcePrompt
                                ? ` · 원본: ${issue.sourcePrompt.title}${
                                    issue.sourceDeletedAt
                                      ? " (삭제 보관함)"
                                      : ""
                                  }`
                                : ""}
                            </span>
                          </Link>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                            <button
                              type="button"
                              onClick={() => copySourceHealthCandidateMemo(issue)}
                              data-testid="dashboard-source-health-candidate-copy"
                              className="text-[11px] font-semibold text-accent transition hover:text-soft"
                            >
                              {candidateCopyStatus === "copied"
                                ? "후보 메모 복사됨"
                                : candidateCopyStatus === "failed"
                                  ? "후보 메모 복사 실패"
                                  : "후보 메모 복사"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                copySourceHealthLink({
                                  href: candidateDetailHref,
                                  key: candidateDetailLinkKey,
                                  title: `출처 상태 후보 상세 링크 · ${issue.prompt.title}`,
                                })
                              }
                              data-testid="dashboard-source-health-candidate-link-copy"
                              className="text-[11px] font-semibold text-accent transition hover:text-soft"
                            >
                              {candidateDetailLinkCopyStatus === "copied"
                                ? "상세 링크 복사됨"
                                : candidateDetailLinkCopyStatus === "failed"
                                  ? "상세 링크 복사 실패"
                                  : "상세 링크 복사"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openSourceHealthCandidateInStudio(issue)}
                              data-testid="dashboard-source-health-candidate-studio"
                              className="text-[11px] font-semibold text-accent transition hover:text-soft"
                            >
                              Studio로 보내기
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs leading-5 text-muted">
                    현재 화면에서 바로 확인할 출처 상태 후보는 없습니다.
                  </p>
                )}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copySourceHealthActionReport}
                  data-testid="dashboard-source-health-action-copy"
                  className={secondaryButtonClass}
                >
                  {sourceHealthActionCopyStatus === "copied"
                    ? "조치 계획 복사됨"
                    : sourceHealthActionCopyStatus === "failed"
                      ? "조치 계획 복사 실패"
                      : "조치 계획 복사"}
                </button>
                <button
                  type="button"
                  onClick={openSourceHealthActionReportInStudio}
                  data-testid="dashboard-source-health-action-studio"
                  className={secondaryButtonClass}
                >
                  Studio로 보내기
                </button>
              </div>
              {sourceHealthManualCopy ? (
                <ManualCopyPanel
                  copy={sourceHealthManualCopy}
                  onClose={() => setSourceHealthManualCopy(null)}
                  className="mt-3 bg-surface"
                  showHeading={false}
                  height="h-36"
                  ariaLabel="수동 복사용 개선 출처 상태 조치 계획 또는 링크"
                />
              ) : null}
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              {improvementSummary.bestRecord
                ? `${improvementSummary.bestRecord.sourcePrompt.title}에서 ${formatSignedScore(
                    improvementSummary.bestRecord.delta,
                  )}점 개선된 기록이 가장 큽니다.`
                : improvementSummary.totalImprovementPrompts
                  ? "개선본은 있지만 원본 연결이 없어 아직 효과를 계산할 수 없습니다."
                  : "아직 저장된 개선본이 없습니다. Library 상세에서 개선 브리프를 Studio로 보내 생성하세요."}
            </p>
            <Link
              href={promptDetailLibraryHref(
                improvementSummary.bestRecord?.prompt.id,
                improvementSummary.bestRecord?.targetModel,
              )}
              className={`${primaryButtonClass} mt-4 w-full`}
            >
              개선 기록 보기
            </Link>
          </div>

          <div className="px-5 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">차수별 개선</p>
                <p className="mt-1 text-xs text-muted">1차와 재개선 단계 기준</p>
              </div>
              <span className="font-mono text-xs text-accent">
                {improvementSummary.byDepth.length}개
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {improvementSummary.byDepth.slice(0, 4).map((group) => (
                <ImprovementGroupLink key={group.id} group={group} />
              ))}
            </div>
            {improvementSummary.byDepth.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                측정 가능한 차수별 개선 기록이 없습니다.
              </p>
            ) : null}
          </div>

          <div className="px-5 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">AI 도구별 개선</p>
                <p className="mt-1 text-xs text-muted">원본 버전 기준으로 집계</p>
              </div>
              <span className="font-mono text-xs text-accent">
                {improvementSummary.byTargetModel.length}개
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {improvementSummary.byTargetModel.slice(0, 4).map((group) => (
                <ImprovementGroupLink key={group.id} group={group} />
              ))}
            </div>
            {improvementSummary.byTargetModel.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                측정 가능한 AI 도구별 개선 기록이 없습니다.
              </p>
            ) : null}
          </div>

          <div className="px-5 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">분야별 개선</p>
                <p className="mt-1 text-xs text-muted">원본 프롬프트 분야 기준</p>
              </div>
              <span className="font-mono text-xs text-accent">
                {improvementSummary.byDomain.length}개
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {improvementSummary.byDomain.slice(0, 4).map((group) => (
                <ImprovementGroupLink key={group.id} group={group} />
              ))}
            </div>
            {improvementSummary.byDomain.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                측정 가능한 분야별 개선 기록이 없습니다.
              </p>
            ) : null}
          </div>
        </div>
        <div className="border-t border-line px-5 py-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">재개선 후보</p>
              <p className="mt-1 text-xs text-muted">
                원본 대비 하락/유지 또는 품질{" "}
                {reimprovementQualityThreshold.toFixed(1)} 미만 개선본
              </p>
            </div>
            <Link
              href={improvementLibraryHref({ improvement: "reimprovement" })}
              className="text-xs font-semibold text-accent transition hover:text-soft"
            >
              후보 필터 열기
            </Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {improvementSummary.reimprovementQueue.slice(0, 3).map((record) => (
              <div
                key={record.prompt.id}
                className="min-w-0 rounded-md border border-line bg-surface px-4 py-4"
              >
                <Link
                  href={promptDetailLibraryHref(
                    record.prompt.id,
                    record.targetModel,
                    "comparison",
                  )}
                  className="block min-w-0 transition hover:text-accent"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {record.prompt.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        원본 · {record.sourcePrompt.title}
                        {record.sourceDeletedAt ? " · 삭제 보관함" : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs ${
                        record.delta >= 0 ? "text-accent" : "text-muted"
                      }`}
                    >
                      {formatSignedScore(record.delta)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted">차수</p>
                      <p className="mt-1 font-mono text-sm font-semibold">
                        {record.depth}차
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">도구</p>
                      <p className="mt-1 text-sm font-semibold">
                        {modelLabels[record.targetModel]}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">품질</p>
                      <p className="mt-1 font-mono text-sm font-semibold">
                        {record.improvedScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </Link>
                <p className="mt-4 text-xs leading-5 text-muted">
                  {reimprovementReason(record)}
                </p>
                <button
                  type="button"
                  onClick={() => openReimprovementInStudio(record)}
                  className={`${secondaryButtonClass} mt-4 w-full`}
                >
                  Studio에서 재개선
                </button>
              </div>
            ))}
          </div>
          {improvementSummary.reimprovementQueue.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              현재 재개선 후보가 없습니다. 개선본을 저장하고 피드백을 쌓으면
              우선순위가 자동으로 잡힙니다.
            </p>
          ) : null}
        </div>
        <div className="border-t border-line px-5 py-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">피드백 반영 개선본</p>
              <p className="mt-1 text-xs text-muted">
                Library 피드백을 출처로 저장된 개선본과 반영 코멘트를 추적합니다.
              </p>
            </div>
            <Link
              href={improvementLibraryHref()}
              className="text-xs font-semibold text-accent transition hover:text-soft"
            >
              개선 기록 전체
            </Link>
          </div>
          <div
            className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
            data-testid="dashboard-feedback-improvement-metrics"
          >
            <div className="rounded-md border border-line bg-surface px-3 py-3">
              <p className="text-xs text-muted">피드백 개선본</p>
              <p className="mt-1 font-mono text-lg font-semibold text-soft">
                {feedbackBasedImprovementRecords.length}
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface px-3 py-3">
              <p className="text-xs text-muted">평균 개선폭</p>
              <p
                className={`mt-1 font-mono text-lg font-semibold ${
                  feedbackImprovementAverageDelta >= 0
                    ? "text-accent"
                    : "text-muted"
                }`}
              >
                {feedbackBasedImprovementRecords.length
                  ? formatSignedScore(feedbackImprovementAverageDelta)
                  : "-"}
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface px-3 py-3">
              <p className="text-xs text-muted">재검토 필요</p>
              <p className="mt-1 font-mono text-lg font-semibold text-soft">
                {feedbackImprovementReviewCount}
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface px-3 py-3">
              <p className="text-xs text-muted">보관함 원본</p>
              <p className="mt-1 font-mono text-lg font-semibold text-soft">
                {feedbackImprovementArchivedSourceCount}
              </p>
            </div>
          </div>
          {feedbackImprovementPriorityRecord ? (
            <div
              className="mb-4 rounded-md border border-accent/30 bg-accent/10 px-4 py-4"
              data-testid="dashboard-feedback-improvement-priority"
            >
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-accent">
                    우선 점검 ·{" "}
                    {feedbackImprovementPriorityRecord.sourceDeletedAt
                      ? "보관함 원본"
                      : feedbackImprovementPriorityRecord.delta <= 0
                        ? "재검토 필요"
                        : "최근 개선본"}
                  </p>
                  <Link
                    href={promptDetailLibraryHref(
                      feedbackImprovementPriorityRecord.prompt.id,
                      feedbackImprovementPriorityRecord.targetModel,
                    )}
                    className="mt-1 block truncate text-sm font-semibold text-soft transition hover:text-accent"
                  >
                    {feedbackImprovementPriorityRecord.prompt.title}
                  </Link>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {feedbackImprovementPriorityReason(
                      feedbackImprovementPriorityRecord,
                    )}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                    <div className="min-w-0 rounded-md border border-accent/20 bg-panel/70 px-2 py-2">
                      <p className="text-muted">AI 도구</p>
                      <p className="mt-1 font-semibold text-soft">
                        {modelLabels[feedbackImprovementPriorityRecord.targetModel]}
                      </p>
                    </div>
                    <div className="min-w-0 rounded-md border border-accent/20 bg-panel/70 px-2 py-2">
                      <p className="text-muted">점수 변화</p>
                      <p className="mt-1 font-mono font-semibold text-soft">
                        {feedbackImprovementPriorityRecord.sourceVersion.qualityScore.toFixed(
                          1,
                        )}{" "}
                        →{" "}
                        {feedbackImprovementPriorityRecord.improvedVersion.qualityScore.toFixed(
                          1,
                        )}{" "}
                        (
                        {formatSignedScore(
                          feedbackImprovementPriorityRecord.delta,
                        )}
                        )
                      </p>
                    </div>
                    <div className="min-w-0 rounded-md border border-accent/20 bg-panel/70 px-2 py-2">
                      <p className="text-muted">피드백</p>
                      <p className="mt-1 truncate font-semibold text-soft">
                        {feedbackTypeLabels[
                          feedbackImprovementPriorityRecord.sourceFeedback
                            .feedbackType
                        ]}{" "}
                        ·{" "}
                        {feedbackImprovementPriorityRecord.sourceFeedback.rating.toFixed(
                          0,
                        )}
                        /5
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:min-w-64 lg:grid-cols-1">
                  <Link
                    href={promptDetailLibraryHref(
                      feedbackImprovementPriorityRecord.prompt.id,
                      feedbackImprovementPriorityRecord.targetModel,
                    )}
                    className={`${primaryButtonClass} w-full`}
                  >
                    우선 개선본 보기
                  </Link>
                  {feedbackImprovementPriorityRecord.sourceDeletedAt ? (
                    <Link
                      href={promptDetailLibraryHref(
                        feedbackImprovementPriorityRecord.prompt.id,
                        feedbackImprovementPriorityRecord.targetModel,
                      )}
                      className={`${secondaryButtonClass} w-full`}
                    >
                      원본 복원 확인
                    </Link>
                  ) : (
                    <Link
                      href={promptFeedbackLibraryHref(
                        feedbackImprovementPriorityRecord.sourcePrompt.id,
                        feedbackImprovementPriorityRecord.sourceFeedback.id,
                        feedbackImprovementPriorityRecord.targetModel,
                      )}
                      className={`${secondaryButtonClass} w-full`}
                    >
                      원본 피드백 보기
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={copyFeedbackImprovementPriorityReport}
                    data-testid="dashboard-feedback-improvement-priority-copy"
                    className={`${secondaryButtonClass} w-full`}
                  >
                    {feedbackImprovementPriorityCopyStatus === "copied"
                      ? "우선 리포트 복사됨"
                      : feedbackImprovementPriorityCopyStatus === "failed"
                        ? "우선 리포트 복사 실패"
                        : "우선 리포트 복사"}
                  </button>
                  <button
                    type="button"
                    onClick={openFeedbackImprovementPriorityInStudio}
                    data-testid="dashboard-feedback-improvement-priority-studio"
                    className={`${secondaryButtonClass} w-full`}
                  >
                    우선 계획 Studio로
                  </button>
                  <button
                    type="button"
                    onClick={saveFeedbackImprovementPriorityMemory}
                    data-testid="dashboard-feedback-improvement-priority-memory-save"
                    className={`${secondaryButtonClass} w-full`}
                  >
                    {feedbackImprovementPriorityMemorySaveStatus === "saved"
                      ? "우선 메모리 저장됨"
                      : feedbackImprovementPriorityMemorySaveStatus ===
                          "skipped"
                        ? "저장할 우선 메모리 없음"
                        : "우선 메모리 저장"}
                  </button>
                  {feedbackImprovementPriorityMemorySaveStatus === "saved" &&
                  feedbackImprovementPriorityMemoryPreview ? (
                    <div
                      data-testid="dashboard-feedback-improvement-priority-memory-summary"
                      className="border-t border-accent/20 pt-2 text-xs leading-5 text-muted"
                    >
                      <p className="font-semibold text-soft">저장된 메모리</p>
                      <p className="mt-1 truncate">
                        {feedbackImprovementPriorityMemoryPreview.title}
                      </p>
                      <p>
                        {
                          learningScopeLabels[
                            feedbackImprovementPriorityMemoryPreview.scope
                          ]
                        }{" "}
                        scope · 신뢰도{" "}
                        {Math.round(
                          feedbackImprovementPriorityMemoryPreview.confidence *
                            100,
                        )}
                        %
                      </p>
                    </div>
                  ) : null}
                  {feedbackImprovementPriorityMemorySaveStatus === "saved" ? (
                    <Link
                      href={feedbackImprovementLearningHref()}
                      data-testid="dashboard-feedback-improvement-priority-learning-link"
                      className={`${secondaryButtonClass} w-full`}
                    >
                      우선 메모리 확인
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          <div className="mb-4 grid gap-2 md:grid-cols-3">
            <button
              type="button"
              onClick={copyFeedbackImprovementOpsReport}
              data-testid="dashboard-feedback-improvement-report-copy"
              className={secondaryButtonClass}
            >
              {feedbackImprovementOpsReportCopyStatus === "copied"
                ? "피드백 개선 리포트 복사됨"
                : feedbackImprovementOpsReportCopyStatus === "failed"
                  ? "피드백 개선 리포트 복사 실패"
                  : "피드백 개선 리포트 복사"}
            </button>
            <button
              type="button"
              onClick={openFeedbackImprovementOpsReportInStudio}
              data-testid="dashboard-feedback-improvement-report-studio"
              className={secondaryButtonClass}
            >
              리포트 Studio로 보내기
            </button>
            <button
              type="button"
              onClick={saveFeedbackImprovementMemories}
              data-testid="dashboard-feedback-improvement-memory-save"
              className={secondaryButtonClass}
              disabled={feedbackBasedImprovementRecords.length === 0}
            >
              {feedbackImprovementMemorySaveStatus === "saved"
                ? `학습 메모리 ${feedbackImprovementMemorySaveCount}개 저장됨`
                : feedbackImprovementMemorySaveStatus === "skipped"
                  ? "저장할 메모리 없음"
                  : "반영 피드백 메모리 저장"}
            </button>
          </div>
          {feedbackImprovementMemorySaveStatus !== "idle" ? (
            <div className="mb-4 flex flex-col gap-2 rounded-md border border-line bg-surface px-3 py-2 text-xs leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>
                {feedbackImprovementMemorySaveStatus === "saved"
                  ? "반복 피드백 규칙을 Learning 메모리에 저장했습니다. 다음 Studio 생성 컨텍스트에 반영됩니다."
                  : "저장할 피드백 기반 개선본이 없습니다."}
              </p>
              {feedbackImprovementMemorySaveStatus === "saved" ? (
                <Link
                  href={feedbackImprovementLearningHref()}
                  data-testid="dashboard-feedback-improvement-learning-link"
                  className="shrink-0 font-semibold text-accent transition hover:text-soft"
                >
                  Learning에서 확인
                </Link>
              ) : null}
            </div>
          ) : null}
          {feedbackImprovementOpsManualCopy ? (
            <ManualCopyPanel
              copy={feedbackImprovementOpsManualCopy}
              onClose={() => setFeedbackImprovementOpsManualCopy(null)}
              className="mb-4 bg-surface"
              ariaLabel="수동 복사용 피드백 반영 개선 리포트"
            />
          ) : null}
          <div className="grid gap-3 lg:grid-cols-3">
            {feedbackBasedImprovementRecords.slice(0, 3).map((record) => (
              <div
                key={`${record.prompt.id}:${record.sourceFeedback.id ?? record.createdAt}`}
                className="min-w-0 rounded-md border border-line bg-surface px-4 py-4"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={promptDetailLibraryHref(
                        record.prompt.id,
                        record.targetModel,
                      )}
                      className="block truncate text-sm font-semibold transition hover:text-accent"
                    >
                      {record.prompt.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      원본 · {record.sourcePrompt.title}
                      {record.sourceDeletedAt ? " · 삭제 보관함" : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs ${
                      record.delta >= 0 ? "text-accent" : "text-muted"
                    }`}
                  >
                    {formatSignedScore(record.delta)}
                  </span>
                </div>

                <div className="mt-4 border-l border-accent/50 pl-3">
                  <p className="text-[11px] font-semibold text-accent">
                    반영 피드백 · {record.sourceFeedback.rating.toFixed(0)}/5 ·{" "}
                    {feedbackTypeLabels[record.sourceFeedback.feedbackType]}
                  </p>
                  <p className="mt-1 line-clamp-3 break-words text-xs leading-5 text-muted">
                    {record.sourceFeedback.comment}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                  <div className="min-w-0 rounded-md border border-line bg-panel px-2 py-2">
                    <p className="text-muted">AI 도구</p>
                    <p className="mt-1 font-semibold text-soft">
                      {modelLabels[record.targetModel]}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-md border border-line bg-panel px-2 py-2">
                    <p className="text-muted">점수 변화</p>
                    <p className="mt-1 font-mono font-semibold text-soft">
                      {record.sourceVersion.qualityScore.toFixed(1)} →{" "}
                      {record.improvedVersion.qualityScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-md border border-line bg-panel px-2 py-2">
                    <p className="text-muted">생성일</p>
                    <p className="mt-1 font-mono font-semibold text-soft">
                      {formatDashboardDate(record.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link
                    href={promptDetailLibraryHref(
                      record.prompt.id,
                      record.targetModel,
                    )}
                    className={`${secondaryButtonClass} w-full`}
                  >
                    개선본 보기
                  </Link>
                  {record.sourceDeletedAt ? (
                    <Link
                      href={promptDetailLibraryHref(
                        record.prompt.id,
                        record.targetModel,
                      )}
                      className={`${secondaryButtonClass} w-full`}
                    >
                      원본 복원
                    </Link>
                  ) : (
                    <Link
                      href={promptFeedbackLibraryHref(
                        record.sourcePrompt.id,
                        record.sourceFeedback.id,
                        record.targetModel,
                      )}
                      className={`${secondaryButtonClass} w-full`}
                    >
                      원본 피드백
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          {feedbackBasedImprovementRecords.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              아직 피드백 출처가 보존된 개선본이 없습니다. Library 최근 피드백의
              `이 피드백으로 Studio 개선`으로 만든 개선본을 저장하면 여기에
              표시됩니다.
            </p>
          ) : null}
        </div>
      </Panel>
  );
}
