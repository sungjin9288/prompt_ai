"use client";

import { primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import {
  feedbackTypeLabels,
  getDraftPersistenceMeta,
  getDraftSourceKindMeta,
  getLoadedDraftSourceLabel,
  type LoadedStudioDraftSummary,
} from "@/lib/studio-view/draft-summary";
import type { StudioManualCopy } from "@/components/studio/studio-view-types";

type LoadedDraftSource = ReturnType<typeof getLoadedDraftSourceLabel>;
type LoadedDraftPersistence = ReturnType<typeof getDraftPersistenceMeta>;
type LoadedDraftSourceKind = ReturnType<typeof getDraftSourceKindMeta>;

interface LoadedDraftOperationalSummary {
  actionLabel: string;
  chainLabel: string;
  saveExpectation: string;
  sourceLinkCopiedLabel: string;
  sourceLinkCopyLabel: string;
  sourceLinkFailedLabel: string;
  sourceLinkTitle: string;
  sourceLabel: string;
  sourceNextAction: string;
  sourceVariantLabel: string | null;
  persistenceLabel: string;
}

interface StudioLoadedDraftPanelProps {
  loadedDraftSummary: LoadedStudioDraftSummary;
  loadedDraftSource: LoadedDraftSource;
  loadedDraftOperationalSummary: LoadedDraftOperationalSummary | null;
  loadedDraftPersistence: LoadedDraftPersistence | null;
  loadedDraftSourceKind: LoadedDraftSourceKind | null;
  rawInput: string;
  isGenerating: boolean;
  sourceLinkCopied: boolean;
  studioManualCopy: StudioManualCopy | null;
  generatePrompt: () => void;
  copyLoadedDraftSourceLink: () => void;
  onDismiss: () => void;
  onCloseManualCopy: () => void;
}

export function StudioLoadedDraftPanel({
  loadedDraftSummary,
  loadedDraftSource,
  loadedDraftOperationalSummary,
  loadedDraftPersistence,
  loadedDraftSourceKind,
  rawInput,
  isGenerating,
  sourceLinkCopied,
  studioManualCopy,
  generatePrompt,
  copyLoadedDraftSourceLink,
  onDismiss,
  onCloseManualCopy,
}: StudioLoadedDraftPanelProps) {
  return (
    <div className="rounded-md border border-accent/40 bg-accent/10 px-3 py-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-accent">
            불러온 초안 · {loadedDraftSource.label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-soft">
            {loadedDraftSummary.title ?? "실행 계획 초안"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {loadedDraftSource.nextAction}
          </p>
          {loadedDraftOperationalSummary ? (
            <div
              className="mt-3 rounded-md border border-accent/20 bg-panel/70 px-3 py-3"
              data-testid="studio-loaded-draft-operational-summary"
            >
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <div className="min-w-0 border-r border-line pr-2">
                  <p className="text-muted">저장 방식</p>
                  <p className="mt-1 break-words font-semibold text-soft">
                    {loadedDraftOperationalSummary.persistenceLabel}
                  </p>
                </div>
                <div className="min-w-0 sm:border-r sm:border-line sm:pr-2">
                  <p className="text-muted">저장 출처</p>
                  <p className="mt-1 break-words font-semibold text-soft">
                    {loadedDraftOperationalSummary.sourceLabel}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-muted">저장 예정</p>
                  <p className="mt-1 break-words font-semibold text-soft">
                    {loadedDraftOperationalSummary.chainLabel}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1 border-t border-line pt-3 text-xs leading-5 text-muted">
                <p>{loadedDraftOperationalSummary.saveExpectation}</p>
                <p>{loadedDraftOperationalSummary.sourceNextAction}</p>
              </div>
              {loadedDraftOperationalSummary.sourceVariantLabel ? (
                <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2 text-xs leading-5">
                  <p className="text-muted">세부 초안 유형</p>
                  <p className="mt-1 break-words font-semibold text-soft">
                    {
                      loadedDraftOperationalSummary.sourceVariantLabel
                    }
                  </p>
                </div>
              ) : null}
              <div className="mt-3 border-t border-line pt-3">
                <button
                  type="button"
                  className={`${primaryButtonClass} min-h-9 w-full whitespace-nowrap px-3 py-1.5 text-xs sm:w-auto`}
                  onClick={generatePrompt}
                  disabled={!rawInput.trim() || isGenerating}
                >
                  {isGenerating
                    ? "생성 중"
                    : loadedDraftOperationalSummary.actionLabel}
                </button>
              </div>
            </div>
          ) : null}
          {loadedDraftSummary.sourceFeedback ? (
            <div className="mt-2 border-l border-accent/50 pl-3">
              <p className="text-[11px] font-semibold text-accent">
                반영 피드백 ·{" "}
                {loadedDraftSummary.sourceFeedback.rating.toFixed(0)}/5 ·{" "}
                {
                  feedbackTypeLabels[
                    loadedDraftSummary.sourceFeedback.feedbackType
                  ]
                }
              </p>
              <p className="mt-1 break-words text-xs leading-5 text-muted">
                {loadedDraftSummary.sourceFeedback.comment}
              </p>
            </div>
          ) : null}
          <p className="mt-1 font-mono text-xs text-muted">
            {new Date(loadedDraftSummary.createdAt).toLocaleString("ko-KR")}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] leading-5 text-muted">
            원본 경로 · {loadedDraftSummary.href}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            원본 링크 복사는 현재 도메인을 포함한 절대 URL로
            제공됩니다.
          </p>
          <div className="mt-3 rounded-md border border-accent/20 bg-panel/70 px-3 py-2">
            <p className="text-[11px] font-semibold text-accent">
              초안 입력 요약 · {loadedDraftSummary.inputLineCount}줄 ·{" "}
              {loadedDraftSummary.inputCharCount}자
            </p>
            <p className="mt-1 break-words text-xs leading-5 text-muted">
              {loadedDraftSummary.inputPreview}
            </p>
          </div>
          {loadedDraftPersistence ? (
            <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2">
              <p className="text-[11px] font-semibold text-soft">
                저장 방식 · {loadedDraftPersistence.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {loadedDraftPersistence.description}
              </p>
            </div>
          ) : null}
          {loadedDraftSourceKind ? (
            <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2">
              <p className="text-[11px] font-semibold text-soft">
                Studio 저장 출처 · {loadedDraftSourceKind.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {loadedDraftSourceKind.description}
              </p>
              {loadedDraftOperationalSummary?.sourceVariantLabel ? (
                <p className="mt-2 break-words text-xs leading-5 text-muted">
                  세부 초안 유형 ·{" "}
                  {
                    loadedDraftOperationalSummary.sourceVariantLabel
                  }
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <a
            className={secondaryButtonClass}
            href={loadedDraftSummary.href}
            data-testid="studio-loaded-draft-source-action"
          >
            {loadedDraftSource.sourceActionLabel}
          </a>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={copyLoadedDraftSourceLink}
            data-testid="studio-loaded-draft-source-link-copy"
          >
            {sourceLinkCopied
              ? (loadedDraftOperationalSummary?.sourceLinkCopiedLabel ??
                "원본 링크 복사됨")
              : studioManualCopy?.id === "source-link"
                ? (loadedDraftOperationalSummary?.sourceLinkFailedLabel ??
                  "원본 링크 복사 실패")
                : (loadedDraftOperationalSummary?.sourceLinkCopyLabel ??
                  "원본 링크 복사")}
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onDismiss}
          >
            안내 닫기
          </button>
        </div>
      </div>
      {studioManualCopy?.id === "source-link" ? (
        <ManualCopyPanel className="mt-4 bg-surface"
          copy={studioManualCopy}
          onClose={onCloseManualCopy}
        />
      ) : null}
    </div>
  );
}
