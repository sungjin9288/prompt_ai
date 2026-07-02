import {
  type PromptAsset,
  type PromptDeletedAsset,
  type PromptLanguageStrategy,
  type PromptOutputLanguage,
  type PromptScoreBreakdown,
  type PromptVersion,
} from "@/lib/prompt";
import {
  reimprovementQualityThreshold,
  type PromptSourceHealthIssueReason,
} from "@/lib/analytics/prompt-improvement";
import {
  getScoreMetricStatus,
  memoryScopeLabels,
  scoreMetricDefinitions,
  type ImprovementFilter,
  type LearningScopeFilter,
} from "@/lib/library/labels";
import type { MemoryScope } from "@/lib/prompt";

export type ScoreMetricKey = keyof PromptScoreBreakdown;

export interface ImprovementAction {
  key: ScoreMetricKey;
  label: string;
  recommendation: string;
  score: number;
}

export interface ScoreMetricComparison {
  key: ScoreMetricKey;
  label: string;
  recommendation: string;
  sourceScore: number;
  improvedScore: number;
  delta: number;
  status: "improved" | "regressed" | "unchanged";
}

export interface ImprovementScoreComparison {
  improvedCount: number;
  regressedCount: number;
  unchangedCount: number;
  metrics: ScoreMetricComparison[];
  strongestImprovement?: ScoreMetricComparison;
  reviewCandidate?: ScoreMetricComparison;
}

export function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

export function getLanguageStrategy(prompt: PromptAsset): PromptLanguageStrategy {
  return prompt.languageStrategy ?? "hybrid";
}

export function getOutputLanguage(prompt: PromptAsset): PromptOutputLanguage {
  return prompt.outputLanguage ?? "korean";
}

export function getLanguageDecisionText(prompt: PromptAsset) {
  return (
    prompt.languageDecision?.reason ??
    "이전 데이터이거나 판단 메타가 저장되기 전 생성된 프롬프트입니다."
  );
}

export function getTargetModelDecisionText(prompt: PromptAsset) {
  return (
    prompt.targetModelDecision?.reason ??
    "이전 데이터이거나 대상 AI 추천 메타가 저장되기 전 생성된 프롬프트입니다."
  );
}

export function formatEnabledMemoryScopes(prompt: PromptAsset) {
  const scopes = prompt.learningContext?.enabledScopes;

  if (!scopes) {
    return "기록 없음";
  }

  const enabled = Object.entries(scopes)
    .filter(([, isEnabled]) => isEnabled)
    .map(([scope]) => memoryScopeLabels[scope as MemoryScope]);

  return enabled.length ? enabled.join(", ") : "학습 메모리 제외";
}

export function formatLearningContextCount(prompt: PromptAsset) {
  return prompt.learningContext
    ? `메모리 ${prompt.learningContext.appliedMemoryCount} · 피드백 ${prompt.learningContext.recentFeedbackCount}`
    : "메타 없음";
}

export function promptMatchesLearningScope(
  prompt: PromptAsset,
  learningFilter: LearningScopeFilter,
) {
  if (learningFilter === "all") {
    return true;
  }

  if (learningFilter === "untracked") {
    return !prompt.learningContext;
  }

  return Boolean(prompt.learningContext?.enabledScopes[learningFilter]);
}

export function getPromptBestQuality(prompt: PromptAsset) {
  return Math.max(...prompt.versions.map((version) => version.qualityScore));
}

export function getPromptTimestamp(prompt: PromptAsset) {
  return new Date(prompt.updatedAt || prompt.createdAt).getTime();
}

export function getVersionFeedbackStats(prompt: PromptAsset, promptVersionId: string) {
  const feedback = prompt.feedback.filter(
    (item) => item.promptVersionId === promptVersionId,
  );
  const averageRating = feedback.length
    ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length
    : undefined;

  return {
    averageRating,
    count: feedback.length,
  };
}

export function getSourceVersion(
  improvementPrompt: PromptAsset,
  sourcePrompt?: PromptAsset,
) {
  if (!sourcePrompt || !improvementPrompt.improvementSource) {
    return undefined;
  }

  const { sourceVersionId, sourceVersionModel } =
    improvementPrompt.improvementSource;

  return (
    sourcePrompt.versions.find((version) => version.id === sourceVersionId) ??
    sourcePrompt.versions.find(
      (version) => version.targetModel === sourceVersionModel,
    ) ??
    sourcePrompt.versions[0]
  );
}

export function getImprovedVersion(
  improvementPrompt: PromptAsset,
  sourceVersion?: PromptVersion,
  preferredVersion?: PromptVersion,
) {
  return (
    preferredVersion ??
    improvementPrompt.versions.find(
      (version) => version.targetModel === sourceVersion?.targetModel,
    ) ??
    improvementPrompt.versions[0]
  );
}

export function getImprovementQualityDelta({
  improvementPrompt,
  preferredVersion,
  sourcePrompt,
}: {
  improvementPrompt: PromptAsset;
  preferredVersion?: PromptVersion;
  sourcePrompt?: PromptAsset;
}) {
  const sourceVersion = getSourceVersion(improvementPrompt, sourcePrompt);
  const improvedVersion = getImprovedVersion(
    improvementPrompt,
    sourceVersion,
    preferredVersion,
  );

  if (!sourceVersion || !improvedVersion) {
    return undefined;
  }

  return {
    delta: improvedVersion.qualityScore - sourceVersion.qualityScore,
    improvedScore: improvedVersion.qualityScore,
    improvedVersion,
    sourceScore: sourceVersion.qualityScore,
    sourceVersion,
  };
}

export function findPromptById(
  promptId: string | undefined,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  if (!promptId) {
    return undefined;
  }

  return (
    prompts.find((item) => item.id === promptId) ??
    deletedPrompts.find((item) => item.prompt.id === promptId)?.prompt
  );
}

export function hasArchivedSourcePrompt(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  const sourcePromptId = prompt.improvementSource?.sourcePromptId;

  if (!sourcePromptId) {
    return false;
  }

  const activeSource = prompts.some((item) => item.id === sourcePromptId);
  const archivedSource = deletedPrompts.some(
    (item) => item.prompt.id === sourcePromptId,
  );

  return !activeSource && archivedSource;
}

export function getPromptSourceHealthIssueReason(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
): PromptSourceHealthIssueReason | undefined {
  if (!prompt.improvementSource) {
    return undefined;
  }

  const sourcePromptId = prompt.improvementSource.sourcePromptId;
  const activeSource = prompts.find((item) => item.id === sourcePromptId);
  const deletedSource = deletedPrompts.find(
    (item) => item.prompt.id === sourcePromptId,
  );
  const sourcePrompt = activeSource ?? deletedSource?.prompt;
  const sourceVersion = getSourceVersion(prompt, sourcePrompt);
  const improvedVersion = getImprovedVersion(prompt, sourceVersion);

  if (!sourcePrompt) {
    return "missing-source";
  }

  if (!sourceVersion) {
    return "missing-source-version";
  }

  if (!improvedVersion) {
    return "missing-improved-version";
  }

  return !activeSource && deletedSource ? "archived-source" : undefined;
}

export function getPromptImprovementDelta(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  if (!prompt.improvementSource) {
    return undefined;
  }

  const sourcePrompt = findPromptById(
    prompt.improvementSource.sourcePromptId,
    prompts,
    deletedPrompts,
  );

  return getImprovementQualityDelta({
    improvementPrompt: prompt,
    sourcePrompt,
  })?.delta;
}

export function isPromptReimprovementCandidate(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  if (!prompt.improvementSource) {
    return false;
  }

  const sourcePrompt = findPromptById(
    prompt.improvementSource.sourcePromptId,
    prompts,
    deletedPrompts,
  );
  const improvement = getImprovementQualityDelta({
    improvementPrompt: prompt,
    sourcePrompt,
  });

  return Boolean(
    improvement &&
      (improvement.delta <= 0 ||
        improvement.improvedScore < reimprovementQualityThreshold),
  );
}

export function getPromptImprovementStatus(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
): Exclude<
  ImprovementFilter,
  "all" | "archived-source" | "reimprovement"
> | undefined {
  if (!prompt.improvementSource) {
    return undefined;
  }

  const delta = getPromptImprovementDelta(prompt, prompts, deletedPrompts);

  if (delta === undefined) {
    return "unmeasured";
  }

  return delta >= 0 ? "improved" : "regressed";
}

export function getPromptImprovementFilterMatch(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
  filter: Exclude<ImprovementFilter, "all">,
) {
  if (filter === "archived-source") {
    return hasArchivedSourcePrompt(prompt, prompts, deletedPrompts);
  }

  return filter === "reimprovement"
    ? isPromptReimprovementCandidate(prompt, prompts, deletedPrompts)
    : getPromptImprovementStatus(prompt, prompts, deletedPrompts) === filter;
}

export function getPromptImprovementLineage(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  const lineage: PromptAsset[] = [];
  const visited = new Set<string>();
  let current: PromptAsset | undefined = prompt;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    lineage.unshift(current);

    const sourcePromptId: string | undefined =
      current.improvementSource?.sourcePromptId;

    if (!sourcePromptId) {
      break;
    }

    current = findPromptById(sourcePromptId, prompts, deletedPrompts);
  }

  return lineage;
}

export function getPromptImprovementDepth(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  return Math.max(
    0,
    getPromptImprovementLineage(prompt, prompts, deletedPrompts).length - 1,
  );
}

export function buildImprovementScoreComparison({
  improvedVersion,
  sourceVersion,
}: {
  improvedVersion: PromptVersion;
  sourceVersion: PromptVersion;
}): ImprovementScoreComparison {
  const metrics = scoreMetricDefinitions.map((definition) => {
    const sourceScore = sourceVersion.scoreBreakdown[definition.key];
    const improvedScore = improvedVersion.scoreBreakdown[definition.key];
    const delta = improvedScore - sourceScore;

    return {
      ...definition,
      delta,
      improvedScore,
      sourceScore,
      status: getScoreMetricStatus(delta),
    };
  });
  const improvedMetrics = metrics.filter((metric) => metric.delta > 0);
  const regressedMetrics = metrics.filter((metric) => metric.delta < 0);
  const strongestImprovement = improvedMetrics
    .slice()
    .sort((left, right) => right.delta - left.delta)[0];
  const reviewCandidate =
    regressedMetrics.slice().sort((left, right) => left.delta - right.delta)[0] ??
    metrics
      .slice()
      .sort(
        (left, right) =>
          left.improvedScore - right.improvedScore || left.delta - right.delta,
      )[0];

  return {
    improvedCount: improvedMetrics.length,
    metrics,
    regressedCount: regressedMetrics.length,
    reviewCandidate,
    strongestImprovement,
    unchangedCount: metrics.length - improvedMetrics.length - regressedMetrics.length,
  };
}

export function getImprovementActions(version: PromptVersion): ImprovementAction[] {
  const rankedActions = scoreMetricDefinitions
    .map((definition) => ({
      ...definition,
      score: version.scoreBreakdown[definition.key],
    }))
    .sort((left, right) => left.score - right.score);
  const weakActions = rankedActions.filter((item) => item.score < 4.5);

  return (weakActions.length ? weakActions : rankedActions).slice(0, 3);
}
