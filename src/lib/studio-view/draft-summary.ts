import { getStudioDraftDisplaySourceLabel } from "@/lib/studio/draft-display";
import type { StudioDraft } from "@/lib/studio/draft";
import { getPromptStudioSourceStudioLabel } from "@/lib/studio/source-registry";

export interface LoadedStudioDraftSummary {
  source: StudioDraft["source"];
  sourceVariant?: StudioDraft["sourceVariant"];
  sourceFeedback?: StudioDraft["sourceFeedback"];
  href: string;
  inputCharCount: number;
  inputLineCount: number;
  inputPreview: string;
  title?: string;
  createdAt: string;
}

export const feedbackTypeLabels: Record<
  NonNullable<StudioDraft["sourceFeedback"]>["feedbackType"],
  string
> = {
  accuracy: "정확성",
  company_rule: "회사 기준",
  context: "맥락",
  format: "출력 형식",
  other: "기타",
  tone: "톤",
};

export function summarizeDraftInput(value: string) {
  const trimmed = value.trim();
  const firstMeaningfulLine = trimmed
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  const inputPreview =
    firstMeaningfulLine && firstMeaningfulLine.length > 140
      ? `${firstMeaningfulLine.slice(0, 140)}...`
      : firstMeaningfulLine || "입력 내용 없음";

  return {
    inputCharCount: trimmed.length,
    inputLineCount: trimmed ? trimmed.split("\n").length : 0,
    inputPreview,
  };
}

export function formatInputReadinessLabel({
  missingQuestionCount,
  score,
  statusLabel,
}: {
  missingQuestionCount: number;
  score: number;
  statusLabel: string;
}) {
  return `${statusLabel} · ${score}/100${
    missingQuestionCount ? ` · 남은 ${missingQuestionCount}개` : ""
  }`;
}

export function focusRawInput() {
  window.requestAnimationFrame(() => {
    const rawInputElement = document.getElementById("studio-raw-input");

    rawInputElement?.scrollIntoView({ block: "center", behavior: "smooth" });
    rawInputElement?.focus();

    if (rawInputElement instanceof HTMLTextAreaElement) {
      const inputEnd = rawInputElement.value.length;

      rawInputElement.setSelectionRange(inputEnd, inputEnd);
    }
  });
}

export function getLoadedDraftSourceLabel(summary: LoadedStudioDraftSummary) {
  return getStudioDraftDisplaySourceLabel({
    source: summary.source,
    sourceFeedback: summary.sourceFeedback,
    sourceTitle: summary.title,
    sourceVariant: summary.sourceVariant,
  });
}

export function getDraftPersistenceMeta(source: StudioDraft["source"]) {
  return source === "library-improvement"
    ? {
        label: "개선 체인",
        description: "저장 시 원본 Library 프롬프트의 개선본으로 연결됩니다.",
      }
    : {
        label: "운영 출처",
        description: "저장 시 개선 체인이 아니라 Studio 저장 출처 메타로만 보존됩니다.",
      };
}

export function getDraftSourceKindMeta(source: StudioDraft["source"]) {
  const sourceLabel = getPromptStudioSourceStudioLabel(source);
  const missingSourceMetadataDescription =
    source === "library-missing-source-metadata-queue"
      ? "저장하면 Library 저장 출처 메타 없음 큐 결과로 분리되어 Dashboard와 Library의 저장 출처 breakdown에서 추적됩니다."
      : source === "library-missing-source-metadata-candidate"
        ? "저장하면 Library 저장 출처 메타 없음 후보 결과로 분리되어 일반 저장 방식 후보와 별도로 추적됩니다."
        : null;

  return {
    label: sourceLabel.label,
    description:
      missingSourceMetadataDescription ??
      (source === "library-improvement"
        ? "Library 개선 체인으로 저장되어 품질 비교와 재개선 판단에 사용됩니다."
        : "Library와 Dashboard의 Studio 저장 출처 breakdown에서 별도 항목으로 추적됩니다."),
  };
}
