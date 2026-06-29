import {
  languageStrategies,
  languageStrategyLabels,
  type PromptAsset,
  type PromptLanguageStrategy,
  type PromptSkill,
} from "@/lib/prompt";

export interface LanguageStrategyPerformance {
  strategy: PromptLanguageStrategy;
  label: string;
  promptCount: number;
  skillCount: number;
  feedbackCount: number;
  successRate: number;
  averageQuality: number;
  latestPromptAt?: string;
  status: "needs_data" | "promising" | "watch";
}

export interface LanguageStrategyRecommendation {
  strategy: PromptLanguageStrategy;
  label: string;
  reason: string;
  confidence: "default" | "moderate" | "strong";
}

function resolvePromptStrategy(prompt: PromptAsset): PromptLanguageStrategy {
  return prompt.languageStrategy ?? "hybrid";
}

function resolveSkillStrategy(skill: PromptSkill): PromptLanguageStrategy {
  return skill.languageStrategy ?? "hybrid";
}

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

export function summarizeLanguageStrategyPerformance(
  prompts: PromptAsset[],
  skills: PromptSkill[],
): LanguageStrategyPerformance[] {
  return languageStrategies.map((strategy) => {
    const strategyPrompts = prompts.filter(
      (prompt) => resolvePromptStrategy(prompt) === strategy,
    );
    const feedback = strategyPrompts.flatMap((prompt) => prompt.feedback);
    const positiveFeedback = feedback.filter((item) => item.rating >= 4);
    const averageQuality = strategyPrompts.length
      ? strategyPrompts.reduce((sum, prompt) => sum + getBestScore(prompt), 0) /
        strategyPrompts.length
      : 0;
    const successRate = feedback.length
      ? Math.round((positiveFeedback.length / feedback.length) * 100)
      : 0;

    return {
      strategy,
      label: languageStrategyLabels[strategy],
      promptCount: strategyPrompts.length,
      skillCount: skills.filter((skill) => resolveSkillStrategy(skill) === strategy)
        .length,
      feedbackCount: feedback.length,
      successRate,
      averageQuality,
      latestPromptAt: getLatestDate(strategyPrompts),
      status: getStatus(feedback.length, successRate),
    };
  });
}

export function getLeadingLanguageStrategy(
  summaries: LanguageStrategyPerformance[],
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

      return b.averageQuality - a.averageQuality;
    })[0];
}

export function getRecommendedLanguageStrategy(
  summaries: LanguageStrategyPerformance[],
): LanguageStrategyRecommendation {
  const leading = getLeadingLanguageStrategy(summaries);

  if (!leading) {
    return {
      strategy: "hybrid",
      label: languageStrategyLabels.hybrid,
      reason:
        "아직 비교 데이터가 부족하므로 영어 지시 구조와 한국어 맥락을 함께 보존하는 기본 전략을 사용합니다.",
      confidence: "default",
    };
  }

  if (leading.feedbackCount >= 3) {
    return {
      strategy: leading.strategy,
      label: leading.label,
      reason: `${leading.feedbackCount}개 피드백 기준 성공률 ${leading.successRate}%로 현재 가장 안정적입니다.`,
      confidence: leading.status === "promising" ? "strong" : "moderate",
    };
  }

  if (leading.promptCount >= 3) {
    return {
      strategy: leading.strategy,
      label: leading.label,
      reason: `${leading.promptCount}개 프롬프트의 평균 품질 ${leading.averageQuality.toFixed(
        1,
      )}점을 기준으로 우선 추천합니다. 피드백이 더 쌓이면 추천 정확도가 높아집니다.`,
      confidence: "moderate",
    };
  }

  return {
    strategy: "hybrid",
    label: languageStrategyLabels.hybrid,
    reason:
      "아직 피드백 표본이 작으므로 기본 전략을 유지합니다. 영어 지시 구조와 한국어 맥락 보존을 함께 적용합니다.",
    confidence: "default",
  };
}
