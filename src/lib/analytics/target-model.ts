import {
  modelLabels,
  targetModels,
  type PromptAsset,
  type PromptSkill,
  type TargetModel,
} from "@/lib/prompt";

export interface TargetModelPerformance {
  targetModel: TargetModel;
  label: string;
  promptCount: number;
  skillCount: number;
  feedbackCount: number;
  successRate: number;
  averageQuality: number;
  latestPromptAt?: string;
  status: "needs_data" | "promising" | "watch";
}

export interface TargetModelRecommendation {
  targetModel: TargetModel;
  label: string;
  reason: string;
  confidence: "default" | "moderate" | "strong";
}

function getStatus(feedbackCount: number, successRate: number) {
  if (feedbackCount < 3) {
    return "needs_data" as const;
  }

  return successRate >= 70 ? ("promising" as const) : ("watch" as const);
}

function getLatestDate(values: string[]) {
  return values
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

export function summarizeTargetModelPerformance(
  prompts: PromptAsset[],
  skills: PromptSkill[],
): TargetModelPerformance[] {
  return targetModels.map((targetModel) => {
    const modelVersions = prompts.flatMap((prompt) =>
      prompt.versions
        .filter((version) => version.targetModel === targetModel)
        .map((version) => ({ prompt, version })),
    );
    const modelVersionIds = new Set(
      modelVersions.map(({ version }) => version.id),
    );
    const feedback = prompts.flatMap((prompt) =>
      prompt.feedback.filter((item) => modelVersionIds.has(item.promptVersionId)),
    );
    const positiveFeedback = feedback.filter((item) => item.rating >= 4);
    const averageQuality = modelVersions.length
      ? modelVersions.reduce(
          (sum, item) => sum + item.version.qualityScore,
          0,
        ) / modelVersions.length
      : 0;
    const successRate = feedback.length
      ? Math.round((positiveFeedback.length / feedback.length) * 100)
      : 0;

    return {
      targetModel,
      label: modelLabels[targetModel],
      promptCount: modelVersions.length,
      skillCount: skills.filter((skill) => skill.targetModel === targetModel).length,
      feedbackCount: feedback.length,
      successRate,
      averageQuality,
      latestPromptAt: getLatestDate(
        modelVersions.map(
          ({ prompt, version }) => version.createdAt || prompt.createdAt,
        ),
      ),
      status: getStatus(feedback.length, successRate),
    };
  });
}

export function getLeadingTargetModel(summaries: TargetModelPerformance[]) {
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

export function getRecommendedTargetModel(
  summaries: TargetModelPerformance[],
): TargetModelRecommendation {
  const leading = getLeadingTargetModel(summaries);

  if (!leading) {
    return {
      targetModel: "gpt",
      label: modelLabels.gpt,
      reason:
        "아직 모델별 비교 데이터가 없어 범용 구조화와 후속 수정이 쉬운 GPT를 기본 추천 기준으로 둡니다.",
      confidence: "default",
    };
  }

  if (leading.feedbackCount >= 3) {
    return {
      targetModel: leading.targetModel,
      label: leading.label,
      reason: `${leading.feedbackCount}개 피드백 기준 성공률 ${leading.successRate}%로 현재 가장 안정적입니다.`,
      confidence: leading.status === "promising" ? "strong" : "moderate",
    };
  }

  if (leading.promptCount >= 3) {
    return {
      targetModel: leading.targetModel,
      label: leading.label,
      reason: `${leading.promptCount}개 버전의 평균 품질 ${leading.averageQuality.toFixed(
        1,
      )}점을 기준으로 우선 관찰합니다. 피드백이 더 쌓이면 추천 정확도가 높아집니다.`,
      confidence: "moderate",
    };
  }

  return {
    targetModel: leading.targetModel,
    label: leading.label,
    reason:
      "아직 모델별 표본이 작으므로 현재 생성 이력이 있는 모델을 관찰 대상으로 둡니다.",
    confidence: "default",
  };
}
