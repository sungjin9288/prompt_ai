import type { LoadedStudioDraftSummary } from "@/lib/studio-view/draft-summary";
import { createPromptStudioSourceMeta } from "@/lib/studio/source-meta";
import type { StudioDraft } from "@/lib/studio/draft";
import {
  modelLabels,
  type PromptAsset,
  type PromptImprovementSource,
  type PromptLearningContextMeta,
  type PromptVersion,
  type TargetModel,
} from "@/lib/prompt";

export interface QualityImprovementBaseline {
  appliedAt: string;
  prompt: PromptAsset;
  version: PromptVersion;
}

export function sameTargetModels(first: TargetModel[], second: TargetModel[]) {
  return (
    first.length === second.length &&
    first.every((model) => second.includes(model))
  );
}

export function formatModelLabels(models: TargetModel[]) {
  return models.map((model) => modelLabels[model]).join(", ");
}

export function getSelectOptions(options: string[], currentValue: string) {
  return currentValue && !options.includes(currentValue)
    ? [currentValue, ...options]
    : options;
}

export function stripImprovementTitlePrefix(title: string) {
  let normalized = title.trim();
  const improvementPrefixPattern = /^(?:(\d+)차\s*)?개선본\s*·\s*/;

  while (improvementPrefixPattern.test(normalized)) {
    normalized = normalized.replace(improvementPrefixPattern, "").trim();
  }

  return normalized || "원본 프롬프트";
}

export function getImprovementTitleDepth(title: string) {
  const numberedMatch = title.trim().match(/^(\d+)차\s*개선본\s*·/);

  if (numberedMatch) {
    return Number(numberedMatch[1]);
  }

  return title.trim().startsWith("개선본 ·") ? 1 : 0;
}

export function getSourceImprovementDepth(
  improvementSource: PromptImprovementSource,
  prompts: PromptAsset[],
) {
  const sourcePrompt = prompts.find(
    (prompt) => prompt.id === improvementSource.sourcePromptId,
  );

  if (!sourcePrompt) {
    return getImprovementTitleDepth(improvementSource.sourcePromptTitle);
  }

  const visited = new Set<string>();
  let current: PromptAsset | undefined = sourcePrompt;
  let depth = 0;

  while (current?.improvementSource && !visited.has(current.id)) {
    visited.add(current.id);
    depth += 1;
    const sourcePromptId: string | undefined =
      current.improvementSource.sourcePromptId;

    current = prompts.find(
      (prompt) => prompt.id === sourcePromptId,
    );
  }

  return depth;
}

export function getNextImprovementDepth(
  improvementSource: PromptImprovementSource | null,
  prompts: PromptAsset[],
) {
  return improvementSource
    ? getSourceImprovementDepth(improvementSource, prompts) + 1
    : 0;
}

export function buildImprovementPromptTitle(
  improvementSource: PromptImprovementSource,
  prompts: PromptAsset[],
) {
  const sourcePrompt = prompts.find(
    (prompt) => prompt.id === improvementSource.sourcePromptId,
  );
  const baseTitle = stripImprovementTitlePrefix(
    sourcePrompt?.title ?? improvementSource.sourcePromptTitle,
  );
  const nextDepth = getNextImprovementDepth(improvementSource, prompts);

  return `${nextDepth}차 개선본 · ${baseTitle}`;
}

export function attachImprovementSource(
  prompt: PromptAsset,
  improvementSource: PromptImprovementSource | null,
  prompts: PromptAsset[],
) {
  if (!improvementSource) {
    return prompt;
  }

  return {
    ...prompt,
    title: buildImprovementPromptTitle(improvementSource, prompts),
    improvementSource,
  };
}

export function getDraftQualityImprovementBaseline(
  draft: StudioDraft,
  prompts: PromptAsset[],
): QualityImprovementBaseline | null {
  if (
    draft.source !== "library-improvement" ||
    !draft.sourcePromptId ||
    !draft.sourceVersionId
  ) {
    return null;
  }

  const sourcePrompt = prompts.find(
    (prompt) => prompt.id === draft.sourcePromptId,
  );
  const sourceVersion = sourcePrompt?.versions.find(
    (version) => version.id === draft.sourceVersionId,
  );

  if (!sourcePrompt || !sourceVersion) {
    return null;
  }

  return {
    appliedAt: draft.createdAt,
    prompt: sourcePrompt,
    version: sourceVersion,
  };
}

export function attachLearningContextMeta(
  prompt: PromptAsset,
  learningContext: PromptLearningContextMeta,
) {
  return {
    ...prompt,
    learningContext,
  };
}

export function attachStudioSourceMeta(
  prompt: PromptAsset,
  source: LoadedStudioDraftSummary | null,
): PromptAsset {
  if (!source) {
    return prompt;
  }

  const studioSource = createPromptStudioSourceMeta({
    source: source.source,
    sourceHref: source.href,
    sourceFeedback: source.sourceFeedback,
    sourceTitle: source.title,
    sourceVariant: source.sourceVariant,
    inputPreview: source.inputPreview,
    inputLineCount: source.inputLineCount,
    inputCharCount: source.inputCharCount,
    createdAt: source.createdAt,
  });

  return {
    ...prompt,
    studioSource,
  };
}

export function formatImprovementDepthLabel(depth: number) {
  if (depth <= 1) {
    return "1차 개선본";
  }

  return `${depth}차 개선본`;
}

export function formatScoreDelta(delta: number) {
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`;
}

export function formatCountDelta(delta: number) {
  return `${delta >= 0 ? "+" : ""}${delta}`;
}
