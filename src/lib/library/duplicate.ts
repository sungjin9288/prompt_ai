import type { PromptAsset } from "@/lib/prompt/types";

export interface DuplicatePromptAssetParams {
  id: string;
  versionIds: string[];
  timestamp: string;
}

export function duplicatePromptAsset(
  prompt: PromptAsset,
  { id, versionIds, timestamp }: DuplicatePromptAssetParams,
): PromptAsset {
  if (versionIds.length !== prompt.versions.length) {
    throw new Error(
      `duplicatePromptAsset: versionIds length (${versionIds.length}) must match prompt.versions length (${prompt.versions.length})`,
    );
  }

  return {
    id,
    title: `${prompt.title} (사본)`,
    source: prompt.source,
    modelUsed: prompt.modelUsed,
    languageStrategy: prompt.languageStrategy,
    languageDecision: prompt.languageDecision,
    outputLanguage: prompt.outputLanguage,
    tags: prompt.tags ? [...prompt.tags] : undefined,
    rawInput: prompt.rawInput,
    goal: prompt.goal,
    domain: prompt.domain,
    targetModels: [...prompt.targetModels],
    targetModelDecision: prompt.targetModelDecision,
    versions: prompt.versions.map((version, index) => ({
      ...version,
      id: versionIds[index],
      createdAt: timestamp,
    })),
    feedback: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
