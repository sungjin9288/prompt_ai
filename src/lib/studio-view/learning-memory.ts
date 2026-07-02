import {
  formatMemoriesForPrompt,
  stripMemoryReferenceLinks,
} from "@/lib/learning/memory";
import type { LearningMemory, PromptAsset } from "@/lib/prompt";

export function collectRecentFeedback(prompts: PromptAsset[]) {
  return prompts
    .flatMap((prompt) => prompt.feedback)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map(
      (feedback) =>
        `${feedback.feedbackType}: ${feedback.rating}/5 - ${feedback.comment}`,
    )
    .filter((item) => item.trim().length > 0);
}

export function collectLearningContext(prompts: PromptAsset[], memories: LearningMemory[]) {
  return [...formatMemoriesForPrompt(memories), ...collectRecentFeedback(prompts)];
}

export const memoryScopeLabels: Record<LearningMemory["scope"], string> = {
  user: "사용자",
  company: "회사",
  domain: "분야",
  skill: "스킬",
};

export const memoryScopeOptions: Array<{
  scope: LearningMemory["scope"];
  label: string;
  description: string;
}> = [
  {
    scope: "company",
    label: "회사",
    description: "브랜드 톤, 제품, 고객군",
  },
  {
    scope: "user",
    label: "사용자",
    description: "개인 선호와 업무 방식",
  },
  {
    scope: "domain",
    label: "분야",
    description: "산업/업무별 기준",
  },
  {
    scope: "skill",
    label: "스킬",
    description: "반복 업무 패턴",
  },
];

export const disabledMemoryScopeSelection: Record<LearningMemory["scope"], boolean> = {
  user: false,
  company: false,
  domain: false,
  skill: false,
};

export function filterLearningMemories(
  memories: LearningMemory[],
  enabledScopes: Record<LearningMemory["scope"], boolean>,
) {
  return memories.filter((memory) => enabledScopes[memory.scope]);
}

export function getPrioritizedLearningMemories(memories: LearningMemory[], limit = 4) {
  return memories
    .slice()
    .sort((a, b) => {
      if (b.confidence === a.confidence) {
        return b.updatedAt.localeCompare(a.updatedAt);
      }

      return b.confidence - a.confidence;
    })
    .slice(0, limit);
}

export function getMemoryPreview(content: string) {
  const normalized = stripMemoryReferenceLinks(content)
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 128
    ? `${normalized.slice(0, 128).trim()}...`
    : normalized;
}

export function getEnabledMemoryScopeLabels(
  enabledScopes: Record<LearningMemory["scope"], boolean>,
) {
  return memoryScopeOptions
    .filter((item) => enabledScopes[item.scope])
    .map((item) => item.label);
}

export function getDisabledMemoryScopeLabels(
  enabledScopes: Record<LearningMemory["scope"], boolean>,
) {
  return memoryScopeOptions
    .filter((item) => !enabledScopes[item.scope])
    .map((item) => item.label);
}
