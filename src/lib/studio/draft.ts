"use client";

import {
  outputLanguages,
  targetModels,
  type Feedback,
  type PromptImprovementFeedbackSource,
  type PromptImprovementSource,
  type PromptOutputLanguage,
  type PromptStudioDraftSource,
  type TargetModel,
} from "@/lib/prompt";
import {
  normalizeStudioDraftSourceVariant,
  shouldKeepStudioDraftSourceFeedback,
  type StudioDraftSourceVariant,
} from "@/lib/studio/draft-variants";
import { normalizeStudioInternalHref } from "@/lib/studio/href";
import { isPromptStudioDraftSource } from "@/lib/studio/source-registry";

export const studioDraftStorageKey = "prompt-ai-studio:studio-draft";

export type StudioDraftSourceFeedback = PromptImprovementFeedbackSource;

export interface StudioDraft {
  source: PromptStudioDraftSource;
  sourceVariant?: StudioDraftSourceVariant;
  rawInput: string;
  goal: string;
  domain: string;
  targetModels: TargetModel[];
  outputLanguage: PromptOutputLanguage;
  sourceMemoryId?: string;
  sourcePromptId?: string;
  sourceVersionId?: string;
  sourceVersionModel?: TargetModel;
  sourceFeedback?: StudioDraftSourceFeedback;
  sourceTitle?: string;
  sourceHref?: string;
  createdAt: string;
}

function isTargetModel(value: unknown): value is TargetModel {
  return (
    typeof value === "string" && targetModels.includes(value as TargetModel)
  );
}

function isOutputLanguage(value: unknown): value is PromptOutputLanguage {
  return (
    typeof value === "string" &&
    outputLanguages.includes(value as PromptOutputLanguage)
  );
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function isFeedbackType(value: unknown): value is Feedback["feedbackType"] {
  return (
    value === "accuracy" ||
    value === "company_rule" ||
    value === "context" ||
    value === "format" ||
    value === "other" ||
    value === "tone"
  );
}

function normalizeStudioDraftSourceFeedback(
  value: unknown,
): StudioDraftSourceFeedback | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const feedback = value as Partial<StudioDraftSourceFeedback>;

  if (
    typeof feedback.rating !== "number" ||
    !Number.isFinite(feedback.rating) ||
    !isFeedbackType(feedback.feedbackType) ||
    typeof feedback.comment !== "string" ||
    !feedback.comment.trim()
  ) {
    return undefined;
  }

  return {
    id: normalizeOptionalString(feedback.id),
    promptVersionId: normalizeOptionalString(feedback.promptVersionId),
    rating: Math.min(5, Math.max(1, feedback.rating)),
    feedbackType: feedback.feedbackType,
    comment: feedback.comment,
    createdAt:
      typeof feedback.createdAt === "string"
        ? feedback.createdAt
        : new Date().toISOString(),
  };
}

function normalizeStudioDraft(value: unknown): StudioDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const draft = value as Partial<StudioDraft>;
  const targetModelList = Array.isArray(draft.targetModels)
    ? draft.targetModels.filter(isTargetModel)
    : [];

  if (
    !isPromptStudioDraftSource(draft.source) ||
    typeof draft.rawInput !== "string" ||
    !draft.rawInput.trim() ||
    typeof draft.goal !== "string" ||
    !draft.goal.trim() ||
    typeof draft.domain !== "string" ||
    !draft.domain.trim() ||
    !isOutputLanguage(draft.outputLanguage)
  ) {
    return null;
  }

  const sourceFeedback = normalizeStudioDraftSourceFeedback(draft.sourceFeedback);
  const sourceVariant = normalizeStudioDraftSourceVariant({
    source: draft.source,
    sourceFeedbackAvailable: Boolean(sourceFeedback),
    sourceVariant: draft.sourceVariant,
  });

  return {
    source: draft.source,
    sourceVariant,
    rawInput: draft.rawInput,
    goal: draft.goal,
    domain: draft.domain,
    targetModels: targetModelList.length ? targetModelList : ["gpt"],
    outputLanguage: draft.outputLanguage,
    sourceMemoryId: normalizeOptionalString(draft.sourceMemoryId),
    sourcePromptId: normalizeOptionalString(draft.sourcePromptId),
    sourceVersionId: normalizeOptionalString(draft.sourceVersionId),
    sourceVersionModel: isTargetModel(draft.sourceVersionModel)
      ? draft.sourceVersionModel
      : undefined,
    sourceFeedback: shouldKeepStudioDraftSourceFeedback(sourceVariant)
      ? sourceFeedback
      : undefined,
    sourceTitle: normalizeOptionalString(draft.sourceTitle),
    sourceHref: normalizeStudioInternalHref(draft.sourceHref),
    createdAt:
      typeof draft.createdAt === "string"
        ? draft.createdAt
        : new Date().toISOString(),
  };
}

export function writeStudioDraft(draft: StudioDraft) {
  if (typeof window === "undefined") {
    return false;
  }

  const normalizedDraft = normalizeStudioDraft(draft);

  if (!normalizedDraft) {
    return false;
  }

  try {
    window.sessionStorage.setItem(
      studioDraftStorageKey,
      JSON.stringify(normalizedDraft),
    );
    return true;
  } catch {
    return false;
  }
}

export function readStudioDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  let raw: string | null;

  try {
    raw = window.sessionStorage.getItem(studioDraftStorageKey);
  } catch {
    return null;
  }

  if (!raw) {
    return null;
  }

  try {
    const draft = normalizeStudioDraft(JSON.parse(raw));

    if (!draft) {
      clearStudioDraft();
    }

    return draft;
  } catch {
    clearStudioDraft();
    return null;
  }
}

export function clearStudioDraft() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(studioDraftStorageKey);
  } catch {
    return;
  }
}

export function createImprovementSourceFromDraft(
  draft: StudioDraft,
): PromptImprovementSource | null {
  if (draft.source !== "library-improvement" || !draft.sourcePromptId) {
    return null;
  }

  const sourceFeedback = shouldKeepStudioDraftSourceFeedback(
    draft.sourceVariant,
  )
    ? draft.sourceFeedback
    : undefined;

  const improvementSource: PromptImprovementSource = {
    type: "library-improvement",
    sourcePromptId: draft.sourcePromptId,
    sourcePromptTitle: draft.sourceTitle ?? "원본 프롬프트",
    sourceVersionId: draft.sourceVersionId,
    sourceVersionModel: draft.sourceVersionModel,
    createdAt: draft.createdAt,
  };

  if (sourceFeedback) {
    improvementSource.sourceFeedback = sourceFeedback;
  }

  return improvementSource;
}
