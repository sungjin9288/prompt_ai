import {
  promptStudioDraftSourceVariants,
  type PromptStudioDraftSource,
  type PromptStudioDraftSourceVariant,
} from "@/lib/prompt";

export type StudioDraftSourceVariant = PromptStudioDraftSourceVariant;

const studioDraftVariantRules: Record<
  StudioDraftSourceVariant,
  {
    allowedSources: readonly PromptStudioDraftSource[];
    requiresSourceFeedback: boolean;
  }
> = {
  "dashboard-next-action-queue-verification": {
    allowedSources: ["dashboard-next-action-queue"],
    requiresSourceFeedback: false,
  },
  "feedback-improvement": {
    allowedSources: ["library-improvement"],
    requiresSourceFeedback: true,
  },
  "handoff-improvement": {
    allowedSources: ["library-improvement"],
    requiresSourceFeedback: false,
  },
  "learning-low-confidence-validation": {
    allowedSources: ["learning-feedback-improvement"],
    requiresSourceFeedback: false,
  },
};

export function isStudioDraftSourceVariant(
  value: unknown,
): value is StudioDraftSourceVariant {
  return (
    typeof value === "string" &&
    promptStudioDraftSourceVariants.includes(value as StudioDraftSourceVariant)
  );
}

export function isStudioDraftSourceVariantReady({
  source,
  sourceFeedbackAvailable,
  sourceVariant,
}: {
  source: PromptStudioDraftSource;
  sourceFeedbackAvailable: boolean;
  sourceVariant: StudioDraftSourceVariant;
}) {
  const rule = studioDraftVariantRules[sourceVariant];

  return (
    rule.allowedSources.includes(source) &&
    (!rule.requiresSourceFeedback || sourceFeedbackAvailable)
  );
}

export function normalizeStudioDraftSourceVariant({
  source,
  sourceFeedbackAvailable,
  sourceVariant,
}: {
  source: PromptStudioDraftSource;
  sourceFeedbackAvailable: boolean;
  sourceVariant: unknown;
}) {
  if (!isStudioDraftSourceVariant(sourceVariant)) {
    return undefined;
  }

  return isStudioDraftSourceVariantReady({
    source,
    sourceFeedbackAvailable,
    sourceVariant,
  })
    ? sourceVariant
    : undefined;
}

export function shouldKeepStudioDraftSourceFeedback(
  sourceVariant: StudioDraftSourceVariant | undefined,
) {
  return sourceVariant
    ? studioDraftVariantRules[sourceVariant].requiresSourceFeedback
    : false;
}
