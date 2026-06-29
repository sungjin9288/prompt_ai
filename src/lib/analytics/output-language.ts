import {
  outputLanguageLabels,
  outputLanguages,
  type PromptAsset,
  type PromptOutputLanguage,
  type PromptSkill,
} from "@/lib/prompt";

export interface OutputLanguagePerformance {
  outputLanguage: PromptOutputLanguage;
  label: string;
  promptCount: number;
  skillCount: number;
  feedbackCount: number;
  successRate: number;
  averageQuality: number;
  latestPromptAt?: string;
  status: "needs_data" | "promising" | "watch";
}

export interface OutputLanguageRecommendation {
  outputLanguage: PromptOutputLanguage;
  label: string;
  reason: string;
  confidence: "default" | "moderate" | "strong";
}

function resolvePromptOutputLanguage(
  prompt: PromptAsset,
): PromptOutputLanguage {
  return prompt.outputLanguage ?? "korean";
}

function resolveSkillOutputLanguage(skill: PromptSkill): PromptOutputLanguage {
  return skill.outputLanguage ?? "korean";
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

export function summarizeOutputLanguagePerformance(
  prompts: PromptAsset[],
  skills: PromptSkill[],
): OutputLanguagePerformance[] {
  return outputLanguages.map((outputLanguage) => {
    const languagePrompts = prompts.filter(
      (prompt) => resolvePromptOutputLanguage(prompt) === outputLanguage,
    );
    const feedback = languagePrompts.flatMap((prompt) => prompt.feedback);
    const positiveFeedback = feedback.filter((item) => item.rating >= 4);
    const averageQuality = languagePrompts.length
      ? languagePrompts.reduce((sum, prompt) => sum + getBestScore(prompt), 0) /
        languagePrompts.length
      : 0;
    const successRate = feedback.length
      ? Math.round((positiveFeedback.length / feedback.length) * 100)
      : 0;

    return {
      outputLanguage,
      label: outputLanguageLabels[outputLanguage],
      promptCount: languagePrompts.length,
      skillCount: skills.filter(
        (skill) => resolveSkillOutputLanguage(skill) === outputLanguage,
      ).length,
      feedbackCount: feedback.length,
      successRate,
      averageQuality,
      latestPromptAt: getLatestDate(languagePrompts),
      status: getStatus(feedback.length, successRate),
    };
  });
}

export function getLeadingOutputLanguage(
  summaries: OutputLanguagePerformance[],
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

export function getRecommendedOutputLanguage(
  summaries: OutputLanguagePerformance[],
): OutputLanguageRecommendation {
  const leading = getLeadingOutputLanguage(summaries);

  if (!leading) {
    return {
      outputLanguage: "korean",
      label: outputLanguageLabels.korean,
      reason:
        "아직 비교 데이터가 부족하므로 한국어 답변을 기본값으로 사용합니다.",
      confidence: "default",
    };
  }

  if (leading.feedbackCount >= 3) {
    return {
      outputLanguage: leading.outputLanguage,
      label: leading.label,
      reason: `${leading.feedbackCount}개 피드백 기준 성공률 ${leading.successRate}%로 현재 가장 안정적입니다.`,
      confidence: leading.status === "promising" ? "strong" : "moderate",
    };
  }

  if (leading.promptCount >= 3) {
    return {
      outputLanguage: leading.outputLanguage,
      label: leading.label,
      reason: `${leading.promptCount}개 프롬프트의 평균 품질 ${leading.averageQuality.toFixed(
        1,
      )}점을 기준으로 우선 추천합니다. 피드백이 더 쌓이면 추천 정확도가 높아집니다.`,
      confidence: "moderate",
    };
  }

  return {
    outputLanguage: "korean",
    label: outputLanguageLabels.korean,
    reason:
      "아직 답변 언어별 표본이 작으므로 한국어를 유지합니다. 영어 답변이 필요한 업무는 수동으로 선택할 수 있습니다.",
    confidence: "default",
  };
}
