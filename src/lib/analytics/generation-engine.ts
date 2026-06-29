import type { PromptAsset } from "@/lib/prompt";

export type GenerationEngine = PromptAsset["source"];

export interface GenerationEnginePerformance {
  engine: GenerationEngine;
  label: string;
  promptCount: number;
  feedbackCount: number;
  successRate: number;
  averageQuality: number;
  latestPromptAt?: string;
  modelUsage: Array<{ model: string; count: number }>;
  status: "needs_data" | "promising" | "watch";
}

const generationEngines: GenerationEngine[] = ["local", "openai"];

export const generationEngineLabels: Record<GenerationEngine, string> = {
  local: "Local builder",
  openai: "OpenAI",
};

function getBestScore(prompt: PromptAsset) {
  if (!prompt.versions.length) {
    return 0;
  }

  return Math.max(...prompt.versions.map((version) => version.qualityScore));
}

function getLatestDate(prompts: PromptAsset[]) {
  return prompts
    .map((prompt) => prompt.createdAt)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function getStatus(feedbackCount: number, successRate: number) {
  if (feedbackCount < 3) {
    return "needs_data" as const;
  }

  return successRate >= 70 ? ("promising" as const) : ("watch" as const);
}

function summarizeModelUsage(prompts: PromptAsset[]) {
  const usage = prompts.reduce<Record<string, number>>((counts, prompt) => {
    if (!prompt.modelUsed) {
      return counts;
    }

    return {
      ...counts,
      [prompt.modelUsed]: (counts[prompt.modelUsed] ?? 0) + 1,
    };
  }, {});

  return Object.entries(usage)
    .map(([model, count]) => ({ model, count }))
    .sort((left, right) => right.count - left.count || left.model.localeCompare(right.model));
}

export function summarizeGenerationEnginePerformance(
  prompts: PromptAsset[],
): GenerationEnginePerformance[] {
  return generationEngines.map((engine) => {
    const enginePrompts = prompts.filter((prompt) => prompt.source === engine);
    const feedback = enginePrompts.flatMap((prompt) => prompt.feedback);
    const positiveFeedback = feedback.filter((item) => item.rating >= 4);
    const averageQuality = enginePrompts.length
      ? enginePrompts.reduce((sum, prompt) => sum + getBestScore(prompt), 0) /
        enginePrompts.length
      : 0;
    const successRate = feedback.length
      ? Math.round((positiveFeedback.length / feedback.length) * 100)
      : 0;

    return {
      engine,
      label: generationEngineLabels[engine],
      promptCount: enginePrompts.length,
      feedbackCount: feedback.length,
      successRate,
      averageQuality,
      latestPromptAt: getLatestDate(enginePrompts),
      modelUsage: summarizeModelUsage(enginePrompts),
      status: getStatus(feedback.length, successRate),
    };
  });
}

export function getLeadingGenerationEngine(
  summaries: GenerationEnginePerformance[],
) {
  return summaries
    .filter((item) => item.promptCount > 0)
    .slice()
    .sort((a, b) => {
      if (b.feedbackCount !== a.feedbackCount) {
        return b.feedbackCount - a.feedbackCount;
      }

      if (b.successRate !== a.successRate) {
        return b.successRate - a.successRate;
      }

      if (b.averageQuality !== a.averageQuality) {
        return b.averageQuality - a.averageQuality;
      }

      return b.promptCount - a.promptCount;
    })[0];
}
