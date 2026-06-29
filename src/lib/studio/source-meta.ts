import type {
  PromptImprovementFeedbackSource,
  PromptStudioDraftSource,
  PromptStudioDraftSourceVariant,
  PromptStudioSourceMeta,
} from "@/lib/prompt";
import {
  normalizeStudioDraftSourceVariant,
  shouldKeepStudioDraftSourceFeedback,
} from "@/lib/studio/draft-variants";
import { normalizeStudioInternalHref } from "@/lib/studio/href";

export interface PromptStudioSourceMetaInput {
  source: PromptStudioDraftSource;
  sourceVariant?: PromptStudioDraftSourceVariant;
  sourceTitle?: string;
  sourceHref: string;
  sourceFeedback?: PromptImprovementFeedbackSource;
  inputPreview: string;
  inputLineCount: number;
  inputCharCount: number;
  createdAt: string;
}

function normalizeNonNegativeInteger(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function normalizeIsoTimestamp(value: string, fallback: string) {
  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : fallback;
}

export function createPromptStudioSourceMeta(
  source: PromptStudioSourceMetaInput,
): PromptStudioSourceMeta {
  const savedAt = new Date().toISOString();
  const createdAt = normalizeIsoTimestamp(source.createdAt, savedAt);
  const inputPreview = source.inputPreview.trim() || "입력 내용 없음";
  const inputCharCount = normalizeNonNegativeInteger(source.inputCharCount);
  const inputLineCount = normalizeNonNegativeInteger(source.inputLineCount);
  const sourceHref = normalizeStudioInternalHref(source.sourceHref) ?? "/";
  const sourceTitle = source.sourceTitle?.trim();
  const sourceVariant = normalizeStudioDraftSourceVariant({
    source: source.source,
    sourceFeedbackAvailable: Boolean(source.sourceFeedback),
    sourceVariant: source.sourceVariant,
  });
  const studioSource: PromptStudioSourceMeta = {
    type: "studio-draft",
    source: source.source,
    sourceHref,
    inputPreview,
    inputLineCount,
    inputCharCount,
    createdAt,
    savedAt,
  };

  if (sourceVariant) {
    studioSource.sourceVariant = sourceVariant;
  }

  if (sourceTitle) {
    studioSource.sourceTitle = sourceTitle;
  }

  if (
    source.sourceFeedback &&
    shouldKeepStudioDraftSourceFeedback(sourceVariant)
  ) {
    studioSource.sourceFeedback = source.sourceFeedback;
  }

  return studioSource;
}
