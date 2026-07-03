import type { PromptAsset } from "@/lib/prompt";

export function getPromptTags(prompt: PromptAsset): string[] {
  return prompt.tags ?? [];
}

export function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase();
}

export function addTagToPrompt(prompt: PromptAsset, rawTag: string): PromptAsset {
  const normalized = normalizeTag(rawTag);

  if (!normalized) {
    return prompt;
  }

  const existingTags = getPromptTags(prompt);

  if (existingTags.includes(normalized)) {
    return prompt;
  }

  return {
    ...prompt,
    tags: [...existingTags, normalized],
  };
}

export function removeTagFromPrompt(prompt: PromptAsset, rawTag: string): PromptAsset {
  const normalized = normalizeTag(rawTag);
  const existingTags = getPromptTags(prompt);

  return {
    ...prompt,
    tags: existingTags.filter((tag) => tag !== normalized),
  };
}

export function collectAllTags(prompts: PromptAsset[]): string[] {
  const tagSet = new Set<string>();

  for (const prompt of prompts) {
    for (const tag of getPromptTags(prompt)) {
      tagSet.add(tag);
    }
  }

  return [...tagSet].sort((left, right) => left.localeCompare(right, "ko"));
}

export function promptHasTag(prompt: PromptAsset, tag: string): boolean {
  return getPromptTags(prompt).includes(tag);
}
