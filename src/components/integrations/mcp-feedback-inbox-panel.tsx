"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  Panel,
  PanelHeader,
  secondaryButtonClass,
  selectClass,
  textareaClass,
} from "@/components/ui";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import type { TargetModel } from "@/lib/prompt";
import { writeStudioDraft } from "@/lib/studio/draft";

interface McpFeedbackRecord {
  createdAt?: string;
  id?: string;
  improvementQueueItem?: string;
  learningMemoryCandidate?: string;
  rating?: string;
  resultSummary?: string;
  targetAI?: string;
}

interface McpFeedbackInboxResponse {
  error?: string;
  exists: boolean;
  filteredCount: number;
  inboxPath: string;
  parseErrors: Array<{ line: number; message: string }>;
  ratingCounts: Record<string, number>;
  records: McpFeedbackRecord[];
  targetAICounts: Record<string, number>;
  totalCount: number;
}

type LoadState = "idle" | "loading" | "ready" | "error";
type RatingFilter = "all" | "positive" | "neutral" | "negative";
type TargetAIFilter = "all" | "gpt" | "claude" | "codex" | "gemini" | "general";
type CopyState =
  | "idle"
  | "api"
  | "curl"
  | "evidence"
  | "filterLink"
  | "report"
  | "memory"
  | "saveExample"
  | "studio"
  | "draftError"
  | "error";

interface FeedbackReviewSummaryItem {
  label: string;
  value: string;
}

const ratingFilterOptions = [
  "all",
  "positive",
  "neutral",
  "negative",
] satisfies RatingFilter[];

const targetAIFilterOptions = [
  "all",
  "gpt",
  "claude",
  "codex",
  "gemini",
  "general",
] satisfies TargetAIFilter[];

function FeedbackReviewSummary({
  items,
}: {
  items: FeedbackReviewSummaryItem[];
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 rounded-md border border-line bg-surface p-3 xl:grid-cols-4"
      data-testid="mcp-feedback-review-summary"
    >
      {items.map((item) => (
        <div className="min-w-0" key={item.label}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
            {item.label}
          </p>
          <p className="mt-1 break-words text-xs font-semibold text-soft">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function FeedbackRecordList({
  onCopyEvidence,
  records,
  onCopyLearningMemory,
  onCopySaveExample,
  onCopyStudioDraft,
  onOpenStudioDraft,
}: {
  records: McpFeedbackRecord[];
  onCopyEvidence: (record: McpFeedbackRecord) => void;
  onCopyLearningMemory: (record: McpFeedbackRecord) => void;
  onCopySaveExample: () => void;
  onCopyStudioDraft: (record: McpFeedbackRecord) => void;
  onOpenStudioDraft: (record: McpFeedbackRecord) => void;
}) {
  return (
    <div className="divide-y divide-line rounded-md border border-line bg-surface">
      {records.length ? (
        records.map((record, index) => (
          <FeedbackRecordCard
            key={record.id ?? `${record.createdAt}-${index}`}
            onCopyEvidence={onCopyEvidence}
            onCopyLearningMemory={onCopyLearningMemory}
            onCopyStudioDraft={onCopyStudioDraft}
            onOpenStudioDraft={onOpenStudioDraft}
            record={record}
          />
        ))
      ) : (
        <FeedbackRecordEmptyState onCopySaveExample={onCopySaveExample} />
      )}
    </div>
  );
}

function FeedbackRecordCard({
  record,
  onCopyEvidence,
  onCopyLearningMemory,
  onCopyStudioDraft,
  onOpenStudioDraft,
}: {
  record: McpFeedbackRecord;
  onCopyEvidence: (record: McpFeedbackRecord) => void;
  onCopyLearningMemory: (record: McpFeedbackRecord) => void;
  onCopyStudioDraft: (record: McpFeedbackRecord) => void;
  onOpenStudioDraft: (record: McpFeedbackRecord) => void;
}) {
  return (
    <div className="grid gap-3 px-4 py-3 md:grid-cols-[140px_minmax(0,1fr)]">
      <FeedbackRecordMeta record={record} />
      <div className="min-w-0">
        <FeedbackRecordBody record={record} />
        <FeedbackRecordEvidenceSummary record={record} />
        <FeedbackRecordActions
          onCopyEvidence={onCopyEvidence}
          onCopyLearningMemory={onCopyLearningMemory}
          onCopyStudioDraft={onCopyStudioDraft}
          onOpenStudioDraft={onOpenStudioDraft}
          record={record}
        />
      </div>
    </div>
  );
}

function FeedbackRecordBody({ record }: { record: McpFeedbackRecord }) {
  return (
    <>
      <p className="break-words text-sm leading-6 text-soft">
        {record.resultSummary ?? "No result summary"}
      </p>
      {record.improvementQueueItem ? (
        <p className="mt-2 break-words text-xs leading-5 text-muted">
          {record.improvementQueueItem}
        </p>
      ) : null}
    </>
  );
}

function FeedbackRecordEvidenceSummary({
  record,
}: {
  record: McpFeedbackRecord;
}) {
  const items = [
    {
      label: "Feedback ID",
      value: record.id ?? "unknown",
    },
    {
      label: "저장 gate",
      value: "confirmSave true",
    },
    {
      label: "증빙 상태",
      value: "Evidence ready",
    },
  ];

  return (
    <div
      className="mt-3 grid gap-2 rounded-md border border-line bg-bg p-3 text-xs sm:grid-cols-3"
      data-testid="mcp-feedback-record-evidence-summary"
    >
      {items.map((item) => (
        <div className="min-w-0" key={item.label}>
          <p className="font-semibold text-muted">{item.label}</p>
          <p className="mt-1 break-words font-mono text-soft">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function FeedbackRecordMeta({ record }: { record: McpFeedbackRecord }) {
  return (
    <div className="text-xs text-muted">
      <p className="font-mono text-soft">{record.targetAI ?? "general"}</p>
      <p>{record.rating ?? "neutral"}</p>
      <p>{formatFeedbackTime(record.createdAt)}</p>
    </div>
  );
}

function FeedbackRecordActions({
  record,
  onCopyEvidence,
  onCopyLearningMemory,
  onCopyStudioDraft,
  onOpenStudioDraft,
}: {
  record: McpFeedbackRecord;
  onCopyEvidence: (record: McpFeedbackRecord) => void;
  onCopyLearningMemory: (record: McpFeedbackRecord) => void;
  onCopyStudioDraft: (record: McpFeedbackRecord) => void;
  onOpenStudioDraft: (record: McpFeedbackRecord) => void;
}) {
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <button
        className={secondaryButtonClass}
        onClick={() => onCopyEvidence(record)}
        type="button"
      >
        Feedback 증빙 복사
      </button>
      <button
        className={secondaryButtonClass}
        onClick={() => onCopyLearningMemory(record)}
        type="button"
      >
        Learning candidate 복사
      </button>
      <button
        className={secondaryButtonClass}
        onClick={() => onCopyStudioDraft(record)}
        type="button"
      >
        Studio 개선 초안 복사
      </button>
      <button
        className={secondaryButtonClass}
        onClick={() => onOpenStudioDraft(record)}
        type="button"
      >
        Studio로 보내기
      </button>
    </div>
  );
}

function FeedbackRecordEmptyState({
  onCopySaveExample,
}: {
  onCopySaveExample: () => void;
}) {
  return (
    <div className="space-y-3 px-4 py-5 text-sm leading-6 text-muted">
      <p>
        아직 confirmSave된 MCP feedback이 없습니다. 외부 AI 결과를 사람이
        검토한 뒤 save_execution_feedback을 confirmSave: true로 호출하면
        여기에 표시됩니다.
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>결과 요약과 target AI를 확인합니다.</li>
        <li>학습 신호로 남길 가치가 있을 때만 confirmSave를 true로 둡니다.</li>
        <li>저장 후 새로고침하거나 현재 API/curl로 확인합니다.</li>
      </ol>
      <button
        className={secondaryButtonClass}
        onClick={onCopySaveExample}
        type="button"
      >
        confirmSave 예시 복사
      </button>
    </div>
  );
}

function getFeedbackCopyStatusMessage(copyState: CopyState) {
  switch (copyState) {
    case "api":
      return "현재 API endpoint를 복사했습니다.";
    case "curl":
      return "Curl smoke check를 복사했습니다.";
    case "evidence":
      return "Feedback 증빙 패킷을 복사했습니다.";
    case "filterLink":
      return "현재 필터 링크를 복사했습니다.";
    case "report":
      return "Feedback report를 복사했습니다.";
    case "memory":
      return "Learning memory candidate를 복사했습니다.";
    case "saveExample":
      return "confirmSave 저장 예시를 복사했습니다.";
    case "studio":
      return "Studio 개선 초안을 복사했습니다.";
    default:
      return null;
  }
}

function FeedbackManualCopyTextarea({ value }: { value: string }) {
  return (
    <textarea
      aria-label="MCP feedback manual copy"
      className={`${textareaClass} min-h-32 font-mono text-xs`}
      readOnly
      value={value}
    />
  );
}

function FeedbackCopyStatusNotice({
  copyState,
  manualCopyText,
}: {
  copyState: CopyState;
  manualCopyText: string;
}) {
  const message = getFeedbackCopyStatusMessage(copyState);

  if (message) {
    return <p className="text-sm text-accent">{message}</p>;
  }

  if (copyState !== "error" && copyState !== "draftError") {
    return null;
  }

  const errorMessage =
    copyState === "draftError"
      ? "Studio 초안을 저장하지 못했습니다. 아래 내용을 직접 선택해 복사하세요."
      : "복사에 실패했습니다. 아래 내용을 직접 선택해 복사하세요.";

  return (
    <div className="space-y-3">
      <p className="text-sm text-danger">{errorMessage}</p>
      {manualCopyText ? (
        <FeedbackManualCopyTextarea value={manualCopyText} />
      ) : null}
    </div>
  );
}

function FeedbackParseWarning({
  parseErrorCount,
}: {
  parseErrorCount: number;
}) {
  if (!parseErrorCount) {
    return null;
  }

  return (
    <div className="rounded-md border border-line bg-surface p-3 text-sm text-danger">
      JSONL parse warning: {parseErrorCount} invalid lines
    </div>
  );
}

function FeedbackInboxActions({
  feedback,
  onCopyApiEndpoint,
  onCopyCurlCommand,
  onCopyFilterLink,
  onCopyReport,
  onOpenReportInStudio,
  onRefresh,
  onResetFilters,
  status,
}: {
  feedback: McpFeedbackInboxResponse | null;
  onCopyApiEndpoint: () => void;
  onCopyCurlCommand: () => void;
  onCopyFilterLink: () => void;
  onCopyReport: () => void;
  onOpenReportInStudio: () => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  status: LoadState;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <FeedbackInboxStatus feedback={feedback} />
      <FeedbackInboxActionButtons
        feedback={feedback}
        onCopyApiEndpoint={onCopyApiEndpoint}
        onCopyCurlCommand={onCopyCurlCommand}
        onCopyFilterLink={onCopyFilterLink}
        onCopyReport={onCopyReport}
        onOpenReportInStudio={onOpenReportInStudio}
        onRefresh={onRefresh}
        onResetFilters={onResetFilters}
        status={status}
      />
    </div>
  );
}

function FeedbackInboxStatus({
  feedback,
}: {
  feedback: McpFeedbackInboxResponse | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">
        {feedback?.exists
          ? `${feedback.filteredCount}/${feedback.totalCount} saved feedback records`
          : "No saved feedback inbox yet"}
      </p>
      <p className="mt-1 break-words font-mono text-xs text-muted">
        {feedback?.inboxPath ?? ".prompt-ai-studio/mcp-feedback.jsonl"}
      </p>
    </div>
  );
}

function FeedbackInboxActionButtons({
  feedback,
  onCopyApiEndpoint,
  onCopyCurlCommand,
  onCopyFilterLink,
  onCopyReport,
  onOpenReportInStudio,
  onRefresh,
  onResetFilters,
  status,
}: {
  feedback: McpFeedbackInboxResponse | null;
  onCopyApiEndpoint: () => void;
  onCopyCurlCommand: () => void;
  onCopyFilterLink: () => void;
  onCopyReport: () => void;
  onOpenReportInStudio: () => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  status: LoadState;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        className={secondaryButtonClass}
        disabled={status === "loading"}
        onClick={onRefresh}
        type="button"
      >
        {status === "loading" ? "새로고침 중" : "Feedback inbox 새로고침"}
      </button>
      <button
        className={secondaryButtonClass}
        onClick={onCopyFilterLink}
        type="button"
      >
        현재 필터 링크 복사
      </button>
      <button
        className={secondaryButtonClass}
        onClick={onCopyApiEndpoint}
        type="button"
      >
        현재 API 복사
      </button>
      <button
        className={secondaryButtonClass}
        onClick={onCopyCurlCommand}
        type="button"
      >
        Curl 복사
      </button>
      <button
        className={secondaryButtonClass}
        onClick={onResetFilters}
        type="button"
      >
        필터 초기화
      </button>
      <button
        className={secondaryButtonClass}
        disabled={!feedback}
        onClick={onCopyReport}
        type="button"
      >
        Feedback report 복사
      </button>
      <button
        className={secondaryButtonClass}
        disabled={!feedback?.records.length}
        onClick={onOpenReportInStudio}
        type="button"
      >
        Feedback report Studio로
      </button>
    </div>
  );
}

function FeedbackFilterControls({
  currentApiHref,
  currentCurlCommand,
  feedback,
  onRatingChange,
  onTargetAIChange,
  ratingFilter,
  targetAIFilter,
}: {
  currentApiHref: string;
  currentCurlCommand: string;
  feedback: McpFeedbackInboxResponse | null;
  onRatingChange: (value: RatingFilter) => void;
  onTargetAIChange: (value: TargetAIFilter) => void;
  ratingFilter: RatingFilter;
  targetAIFilter: TargetAIFilter;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,180px)_minmax(0,180px)_minmax(0,1fr)]">
      <FeedbackFilterSelect
        label="Rating"
        onChange={onRatingChange}
        options={ratingFilterOptions}
        value={ratingFilter}
      />
      <FeedbackFilterSelect
        label="Target AI"
        onChange={onTargetAIChange}
        options={targetAIFilterOptions}
        value={targetAIFilter}
      />
      <FeedbackQueueSummary
        currentApiHref={currentApiHref}
        currentCurlCommand={currentCurlCommand}
        feedback={feedback}
      />
    </div>
  );
}

function FeedbackFilterSelect<TValue extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: TValue) => void;
  options: TValue[];
  value: TValue;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <select
        className={selectClass}
        onChange={(event) => onChange(event.target.value as TValue)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FeedbackQueueSummary({
  currentApiHref,
  currentCurlCommand,
  feedback,
}: {
  currentApiHref: string;
  currentCurlCommand: string;
  feedback: McpFeedbackInboxResponse | null;
}) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        Queue summary
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-soft">
        Negative: {feedback?.ratingCounts.negative ?? 0} · Positive:{" "}
        {feedback?.ratingCounts.positive ?? 0} · Codex:{" "}
        {feedback?.targetAICounts.codex ?? 0}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        Current API endpoint
      </p>
      <p className="mt-2 break-words font-mono text-xs leading-5 text-soft">
        {currentApiHref}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        Curl smoke check
      </p>
      <p className="mt-2 break-words font-mono text-xs leading-5 text-soft">
        {currentCurlCommand}
      </p>
    </div>
  );
}

export function McpFeedbackInboxPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const currentFilters = getMcpFeedbackFiltersFromSearchText(searchParamsKey);
  const ratingFilter = currentFilters.rating;
  const targetAIFilter = currentFilters.targetAI;
  const currentApiHref = buildMcpFeedbackInboxApiHref(currentFilters);
  const currentCurlCommand = buildMcpFeedbackInboxCurlCommand(currentApiHref);
  const [feedback, setFeedback] = useState<McpFeedbackInboxResponse | null>(
    null,
  );
  const [status, setStatus] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [manualCopyText, setManualCopyText] = useState("");
  const feedbackReviewSummaryItems = [
    {
      label: "저장 상태",
      value: feedback?.exists ? "confirmSave 기록 있음" : "기록 대기",
    },
    {
      label: "현재 결과",
      value: feedback ? `${feedback.filteredCount}/${feedback.totalCount}` : status,
    },
    {
      label: "현재 필터",
      value: `${ratingFilter}/${targetAIFilter}`,
    },
    {
      label: "검증 상태",
      value: feedback?.parseErrors.length
        ? `JSONL 오류 ${feedback.parseErrors.length}`
        : "curl/API 준비",
    },
  ];

  const loadFeedbackInbox = useCallback(async (
    filters: {
      rating: RatingFilter;
      targetAI: TargetAIFilter;
    },
    markLoading = true,
  ) => {
    if (markLoading) {
      setStatus("loading");
    }

    setError("");
    setCopyState("idle");

    try {
      const response = await fetch(buildMcpFeedbackInboxApiHref(filters), {
        cache: "no-store",
      });
      const data = (await response.json()) as McpFeedbackInboxResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load MCP feedback inbox");
      }

      setFeedback(data);
      setStatus("ready");
    } catch (loadError) {
      setFeedback(null);
      setStatus("error");
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load MCP feedback inbox",
      );
    }
  }, []);

  useEffect(() => {
    const nextFilters = getMcpFeedbackFiltersFromSearchText(searchParamsKey);
    const timer = window.setTimeout(() => {
      void loadFeedbackInbox(nextFilters);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadFeedbackInbox, searchParamsKey]);

  async function copyValue(value: string, nextState: CopyState) {
    const copied = await copyTextToClipboard(value);
    setCopyState(copied ? nextState : "error");
    setManualCopyText(copied ? "" : value);
  }

  function updateRatingFilter(value: RatingFilter) {
    const nextFilters = {
      rating: value,
      targetAI: targetAIFilter,
    };
    replaceMcpFeedbackInboxUrl(nextFilters);
  }

  function updateTargetAIFilter(value: TargetAIFilter) {
    const nextFilters = {
      rating: ratingFilter,
      targetAI: value,
    };
    replaceMcpFeedbackInboxUrl(nextFilters);
  }

  async function copyFeedbackReport() {
    if (!feedback) {
      return;
    }

    await copyValue(
      buildMcpFeedbackReport(
        feedback,
        {
          rating: ratingFilter,
          targetAI: targetAIFilter,
        },
        {
          baseUrl: getCurrentOrigin(),
        },
      ),
      "report",
    );
  }

  async function copyFeedbackFilterLink() {
    await copyValue(
      buildAbsoluteMcpFeedbackInboxUrl({
        rating: ratingFilter,
        targetAI: targetAIFilter,
      }),
      "filterLink",
    );
  }

  async function copyFeedbackApiEndpoint() {
    await copyValue(currentApiHref, "api");
  }

  async function copyFeedbackCurlCommand() {
    await copyValue(currentCurlCommand, "curl");
  }

  async function copyFeedbackEvidence(record: McpFeedbackRecord) {
    await copyValue(buildMcpFeedbackEvidencePacket(record), "evidence");
  }

  async function copyFeedbackSaveExample() {
    await copyValue(
      buildMcpFeedbackSaveExample(targetAIFilter),
      "saveExample",
    );
  }

  function resetFeedbackFilters() {
    const nextFilters = {
      rating: "all",
      targetAI: "all",
    } satisfies {
      rating: RatingFilter;
      targetAI: TargetAIFilter;
    };

    replaceMcpFeedbackInboxUrl(nextFilters);
  }

  function openFeedbackReportInStudio() {
    if (!feedback || feedback.records.length === 0) {
      return;
    }

    const rawInput = buildMcpFeedbackReport(
      feedback,
      {
        rating: ratingFilter,
        targetAI: targetAIFilter,
      },
      {
        baseUrl: getCurrentOrigin(),
      },
    );
    const wroteDraft = writeStudioDraft({
      source: "mcp-feedback-report",
      rawInput,
      goal: "MCP feedback 기반 운영 개선 계획",
      domain: "MCP feedback operations",
      targetModels: getFeedbackTargetModels(targetAIFilter),
      outputLanguage: "korean",
      sourceTitle: formatMcpFeedbackReportSourceTitle(feedback, {
        rating: ratingFilter,
        targetAI: targetAIFilter,
      }),
      sourceHref: buildMcpFeedbackInboxHref({
        rating: ratingFilter,
        targetAI: targetAIFilter,
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setCopyState("draftError");
      setManualCopyText(rawInput);
      return;
    }

    router.push("/studio?draft=mcp-feedback-report");
  }

  async function copyLearningMemoryCandidate(record: McpFeedbackRecord) {
    await copyValue(
      buildLearningMemoryCandidateText(record),
      "memory",
    );
  }

  async function copyStudioImprovementDraft(record: McpFeedbackRecord) {
    await copyValue(
      buildStudioFeedbackImprovementDraft(record),
      "studio",
    );
  }

  function openStudioImprovementDraft(record: McpFeedbackRecord) {
    const rawInput = buildStudioFeedbackImprovementDraft(record);
    const wroteDraft = writeStudioDraft({
      source: "mcp-feedback-improvement",
      rawInput,
      goal: "MCP feedback 기반 handoff 개선",
      domain: `MCP feedback · ${record.targetAI ?? "general"}`,
      targetModels: getFeedbackTargetModels(record.targetAI),
      outputLanguage: "korean",
      sourceTitle: formatMcpFeedbackSourceTitle(record),
      sourceHref: buildMcpFeedbackInboxHref({
        rating: ratingFilter,
        targetAI: targetAIFilter,
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setCopyState("draftError");
      setManualCopyText(rawInput);
      return;
    }

    router.push("/studio?draft=mcp-feedback-improvement");
  }

  function refreshFeedbackInbox() {
    void loadFeedbackInbox({
      rating: ratingFilter,
      targetAI: targetAIFilter,
    });
  }

  return (
    <Panel>
      <PanelHeader
        title="MCP feedback inbox"
        description="save_execution_feedback로 confirmSave된 외부 AI 실행 결과를 최근 항목 기준으로 확인합니다."
      />
      <div className="space-y-4 px-5 py-5">
        <FeedbackInboxActions
          feedback={feedback}
          onCopyApiEndpoint={copyFeedbackApiEndpoint}
          onCopyCurlCommand={copyFeedbackCurlCommand}
          onCopyFilterLink={copyFeedbackFilterLink}
          onCopyReport={copyFeedbackReport}
          onOpenReportInStudio={openFeedbackReportInStudio}
          onRefresh={refreshFeedbackInbox}
          onResetFilters={resetFeedbackFilters}
          status={status}
        />

        <FeedbackReviewSummary items={feedbackReviewSummaryItems} />

        <FeedbackFilterControls
          currentApiHref={currentApiHref}
          currentCurlCommand={currentCurlCommand}
          feedback={feedback}
          onRatingChange={updateRatingFilter}
          onTargetAIChange={updateTargetAIFilter}
          ratingFilter={ratingFilter}
          targetAIFilter={targetAIFilter}
        />

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <FeedbackCopyStatusNotice
          copyState={copyState}
          manualCopyText={manualCopyText}
        />
        <FeedbackParseWarning
          parseErrorCount={feedback?.parseErrors.length ?? 0}
        />

        <FeedbackRecordList
          onCopyEvidence={copyFeedbackEvidence}
          onCopyLearningMemory={copyLearningMemoryCandidate}
          onCopySaveExample={copyFeedbackSaveExample}
          onCopyStudioDraft={copyStudioImprovementDraft}
          onOpenStudioDraft={openStudioImprovementDraft}
          records={feedback?.records ?? []}
        />
      </div>
    </Panel>
  );
}

function buildLearningMemoryCandidateText(record: McpFeedbackRecord) {
  return [
    "# MCP Learning Memory Candidate",
    "",
    `- Target AI: ${record.targetAI ?? "general"}`,
    `- Rating: ${record.rating ?? "neutral"}`,
    `- Created: ${record.createdAt ?? "unknown"}`,
    `- Result: ${record.resultSummary ?? "No result summary"}`,
    record.improvementQueueItem
      ? `- Improvement queue item: ${record.improvementQueueItem}`
      : undefined,
    "",
    record.learningMemoryCandidate ??
      [
        `Target AI: ${record.targetAI ?? "general"}`,
        `Rating: ${record.rating ?? "neutral"}`,
        `Result: ${record.resultSummary ?? "No result summary"}`,
      ].join("\n"),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildMcpFeedbackEvidencePacket(record: McpFeedbackRecord) {
  return [
    "# MCP Feedback Evidence",
    "",
    `- Feedback ID: ${record.id ?? "unknown"}`,
    `- Created: ${record.createdAt ?? "unknown"}`,
    `- Target AI: ${record.targetAI ?? "general"}`,
    `- Rating: ${record.rating ?? "neutral"}`,
    `- Result: ${record.resultSummary ?? "No result summary"}`,
    record.improvementQueueItem
      ? `- Improvement queue item: ${record.improvementQueueItem}`
      : undefined,
    "",
    "Verification:",
    "- This record came from save_execution_feedback after confirmSave true.",
    "- Review the result summary before turning it into a reusable learning memory.",
    "- Compare the learning candidate and Studio improvement draft before reusing this feedback.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildStudioFeedbackImprovementDraft(record: McpFeedbackRecord) {
  return [
    "# Studio Improvement Draft From MCP Feedback",
    "",
    "## Source",
    "",
    "- Source surface: Integrations MCP feedback inbox",
    `- Target AI: ${record.targetAI ?? "general"}`,
    `- Rating: ${record.rating ?? "neutral"}`,
    `- Created: ${record.createdAt ?? "unknown"}`,
    `- Feedback ID: ${record.id ?? "unknown"}`,
    "",
    "## Execution feedback",
    "",
    record.resultSummary ?? "No result summary",
    "",
    "## Learning memory candidate",
    "",
    record.learningMemoryCandidate ??
      [
        `Target AI: ${record.targetAI ?? "general"}`,
        `Rating: ${record.rating ?? "neutral"}`,
        `Result: ${record.resultSummary ?? "No result summary"}`,
      ].join("\n"),
    "",
    "## Improvement request",
    "",
    record.improvementQueueItem ??
      "Rewrite the next target AI handoff package so it directly reflects the execution feedback above.",
    "",
    "## Required output",
    "",
    "1. Improved prompt or handoff package in English or Korean-English hybrid.",
    "2. Applied feedback summary with concrete changes.",
    "3. Missing context or assumptions that still require human review.",
    "4. Verification checklist before sending to the target AI.",
  ].join("\n");
}

function buildMcpFeedbackSaveExample(targetAIFilter: TargetAIFilter) {
  const targetAI = targetAIFilter === "all" ? "codex" : targetAIFilter;

  return JSON.stringify(
    {
      arguments: {
        confirmSave: true,
        notes:
          "Operator reviewed the external AI result and wants to keep this as a learning signal.",
        rating: "positive",
        resultSummary:
          "External AI execution produced a useful result after the reviewed handoff package.",
        targetAI,
      },
      tool: "save_execution_feedback",
    },
    null,
    2,
  );
}

function getFeedbackTargetModels(targetAI?: string): TargetModel[] {
  if (
    targetAI === "gpt" ||
    targetAI === "claude" ||
    targetAI === "codex" ||
    targetAI === "gemini"
  ) {
    return [targetAI];
  }

  return ["gpt", "claude", "codex"];
}

function isRatingFilter(value: unknown): value is RatingFilter {
  return (
    value === "all" ||
    value === "positive" ||
    value === "neutral" ||
    value === "negative"
  );
}

function isTargetAIFilter(value: unknown): value is TargetAIFilter {
  return (
    value === "all" ||
    value === "gpt" ||
    value === "claude" ||
    value === "codex" ||
    value === "gemini" ||
    value === "general"
  );
}

function getMcpFeedbackFiltersFromSearchText(searchText: string): {
  rating: RatingFilter;
  targetAI: TargetAIFilter;
} {
  const params = new URLSearchParams(searchText);
  const rating = params.get("mcpRating");
  const targetAI = params.get("mcpTargetAI");

  return {
    rating: isRatingFilter(rating) ? rating : "all",
    targetAI: isTargetAIFilter(targetAI) ? targetAI : "all",
  };
}

function buildMcpFeedbackInboxHref(filters: {
  rating: RatingFilter;
  targetAI: TargetAIFilter;
}) {
  const params = new URLSearchParams();

  if (filters.rating !== "all") {
    params.set("mcpRating", filters.rating);
  }

  if (filters.targetAI !== "all") {
    params.set("mcpTargetAI", filters.targetAI);
  }

  const query = params.toString();
  const href = query ? `/integrations?${query}` : "/integrations";

  return `${href}#integrations-feedback-inbox`;
}

function buildMcpFeedbackInboxApiHref(
  filters: {
    rating: RatingFilter;
    targetAI: TargetAIFilter;
  },
  limit = 5,
) {
  const params = new URLSearchParams({
    limit: String(limit),
    rating: filters.rating,
    targetAI: filters.targetAI,
  });

  return `/api/integrations/mcp-feedback?${params.toString()}`;
}

function buildMcpFeedbackInboxCurlCommand(apiHref: string) {
  return `curl -sS "http://localhost:3000${apiHref}"`;
}

function getCurrentOrigin() {
  return typeof window === "undefined" ? undefined : window.location.origin;
}

function buildAbsoluteMcpFeedbackInboxUrl(filters: {
  rating: RatingFilter;
  targetAI: TargetAIFilter;
}) {
  const href = buildMcpFeedbackInboxHref(filters);
  const origin = getCurrentOrigin();

  return origin ? `${origin}${href}` : href;
}

function replaceMcpFeedbackInboxUrl(filters: {
  rating: RatingFilter;
  targetAI: TargetAIFilter;
}) {
  if (typeof window === "undefined") {
    return;
  }

  window.history.replaceState(null, "", buildMcpFeedbackInboxHref(filters));
}

function formatMcpFeedbackSourceTitle(record: McpFeedbackRecord) {
  const targetAI = record.targetAI ?? "general";
  const rating = record.rating ?? "neutral";

  return `MCP feedback · ${targetAI} · ${rating} · evidence-ready`;
}

function formatMcpFeedbackReportSourceTitle(
  feedback: McpFeedbackInboxResponse,
  filters: {
    rating: RatingFilter;
    targetAI: TargetAIFilter;
  },
) {
  return `MCP feedback report · ${filters.rating}/${filters.targetAI} · ${feedback.filteredCount} records · trace-ready`;
}

function buildMcpFeedbackReport(
  feedback: McpFeedbackInboxResponse,
  filters: {
    rating: RatingFilter;
    targetAI: TargetAIFilter;
  },
  options: {
    baseUrl?: string;
  } = {},
) {
  const filterHref = buildMcpFeedbackInboxHref(filters);
  const filterLink = options.baseUrl
    ? `${options.baseUrl}${filterHref}`
    : filterHref;
  const records = feedback.records.length
    ? feedback.records
        .map((record, index) =>
          [
            `## ${index + 1}. ${record.targetAI ?? "general"} · ${
              record.rating ?? "neutral"
            }`,
            `- Feedback ID: ${record.id ?? "unknown"}`,
            "- Gate: confirmSave true",
            "- Evidence: ready for audit packet",
            `- Created: ${record.createdAt ?? "unknown"}`,
            `- Result: ${record.resultSummary ?? "No result summary"}`,
            record.improvementQueueItem
              ? `- Improvement: ${record.improvementQueueItem}`
              : undefined,
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n")
    : "No feedback records matched the current filters.";

  return [
    "# MCP Feedback Inbox Report",
    "",
    `- Inbox: ${feedback.inboxPath}`,
    `- Filters: rating=${filters.rating}, targetAI=${filters.targetAI}`,
    `- Filter link: ${filterLink}`,
    `- Records: ${feedback.filteredCount}/${feedback.totalCount}`,
    `- Negative: ${feedback.ratingCounts.negative ?? 0}`,
    `- Positive: ${feedback.ratingCounts.positive ?? 0}`,
    `- Codex: ${feedback.targetAICounts.codex ?? 0}`,
    "",
    "Next check:",
    "- Compare evidence-ready single-record drafts with this trace-ready report before changing reusable learning memory.",
    "",
    records,
  ].join("\n");
}

function formatFeedbackTime(value?: string) {
  if (!value) {
    return "time unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
