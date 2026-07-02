import {
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  type Feedback,
  type MemoryScope,
  type PromptAsset,
  type PromptVersion,
} from "@/lib/prompt";
import { formatAbsoluteInternalHref } from "@/lib/navigation/href";
import {
  feedbackTypeLabels,
  formatQualityDelta,
  generationEngineLabels,
  memoryScopeLabels,
} from "@/lib/library/labels";
import {
  getLanguageStrategy,
  getOutputLanguage,
  type ImprovementAction,
  type ImprovementScoreComparison,
} from "@/lib/library/prompt-metrics";

export function buildLearningContextReportText(prompt: PromptAsset) {
  const context = prompt.learningContext;

  if (!context) {
    return [
      `# 학습 컨텍스트 리포트 · ${prompt.title}`,
      "",
      "- 상태: 학습 컨텍스트 메타 없음",
      "- 설명: 이 프롬프트는 학습 컨텍스트 메타 저장 기능 도입 전 생성됐습니다.",
      `- 생성 엔진: ${generationEngineLabels[prompt.source]}${
        prompt.modelUsed ? ` ${prompt.modelUsed}` : ""
      }`,
      `- 분야: ${prompt.domain}`,
      `- 목표: ${prompt.goal}`,
    ].join("\n");
  }

  const enabledScopes = Object.entries(context.enabledScopes)
    .filter(([, isEnabled]) => isEnabled)
    .map(([scope]) => memoryScopeLabels[scope as MemoryScope]);
  const disabledScopes = Object.entries(context.enabledScopes)
    .filter(([, isEnabled]) => !isEnabled)
    .map(([scope]) => memoryScopeLabels[scope as MemoryScope]);

  return [
    `# 학습 컨텍스트 리포트 · ${prompt.title}`,
    "",
    `- 생성 엔진: ${generationEngineLabels[prompt.source]}${
      prompt.modelUsed ? ` ${prompt.modelUsed}` : ""
    }`,
    `- 분야: ${prompt.domain}`,
    `- 목표: ${prompt.goal}`,
    `- Enabled scope: ${
      enabledScopes.length ? enabledScopes.join(", ") : "학습 메모리 제외"
    }`,
    `- Disabled scope: ${
      disabledScopes.length ? disabledScopes.join(", ") : "없음"
    }`,
    `- 적용 학습 메모리: ${context.appliedMemoryCount}개`,
    `- 최근 피드백: ${context.recentFeedbackCount}개`,
    "",
    "## 적용 메모리",
    context.appliedMemoryTitles.length
      ? context.appliedMemoryTitles.map((title) => `- ${title}`).join("\n")
      : "- 적용 메모리 없음",
  ].join("\n");
}

export function buildLearningContextStudioDraftText({
  baseUrl,
  detailHref,
  prompt,
}: {
  baseUrl: string;
  detailHref: string;
  prompt: PromptAsset;
}) {
  const detailLink = formatAbsoluteInternalHref(detailHref, baseUrl) ?? detailHref;

  return [
    buildLearningContextReportText(prompt),
    "",
    "## Library 추적",
    `- Library 상세: ${detailLink}`,
    "- 다음 작업: 이 학습 증거가 현재 프롬프트 품질에 충분히 반영됐는지 확인하고 재개선 계획을 작성합니다.",
  ].join("\n");
}

export function buildImprovementBrief({
  actions,
  feedback,
  prompt,
  version,
}: {
  actions: ImprovementAction[];
  feedback?: Feedback;
  prompt: PromptAsset;
  version: PromptVersion;
}) {
  const assumptions = version.assumptions.length
    ? version.assumptions.map((item) => `- ${item}`).join("\n")
    : "- No explicit assumptions recorded.";
  const missingContext = version.missingContext.length
    ? version.missingContext.map((item) => `- ${item}`).join("\n")
    : "- No required missing context recorded.";
  const priorityActions = actions
    .map(
      (item, index) =>
        `${index + 1}. ${item.label} (${item.score.toFixed(1)}/5): ${
          item.recommendation
        }`,
    )
    .join("\n");
  const feedbackSection = feedback
    ? `
User feedback to apply:
- Rating: ${feedback.rating}/5
- Type: ${feedbackTypeLabels[feedback.feedbackType]}
- Comment: ${feedback.comment}`
    : "";

  return `Role:
You are a senior prompt engineer improving a production prompt for ${modelLabels[version.targetModel]}.

Objective:
Rewrite the current prompt so it is clearer, more reusable, and better aligned with the target AI tool while preserving the original intent.

Context:
- Title: ${prompt.title}
- Domain: ${prompt.domain}
- Goal: ${prompt.goal}
- Language strategy: ${languageStrategyLabels[getLanguageStrategy(prompt)]}
- Desired answer language: ${outputLanguageLabels[getOutputLanguage(prompt)]}
- Target AI tool: ${modelLabels[version.targetModel]}
- Current quality score: ${version.qualityScore.toFixed(1)}/5

Priority improvements:
${priorityActions}

Assumptions to preserve or make explicit:
${assumptions}

Missing context to ask about or mark as assumptions:
${missingContext}
${feedbackSection}

Instructions:
- Do not invent facts, numbers, or company-specific details.
- Separate facts, assumptions, and verification-needed items.
- Treat supplied user feedback as the primary revision signal when it is present.
- Keep the prompt practical enough to paste directly into the target AI tool.
- Return only the improved prompt.

Current prompt:
${version.content}`;
}

export function buildPromptComparisonBrief({
  delta,
  improvedScore,
  improvedVersion,
  prompt,
  scoreComparison,
  sourceScore,
  sourceVersion,
}: {
  delta: number;
  improvedScore: number;
  improvedVersion: PromptVersion;
  prompt: PromptAsset;
  scoreComparison: ImprovementScoreComparison;
  sourceScore: number;
  sourceVersion: PromptVersion;
}) {
  const sourceExcerpt =
    sourceVersion.content.length > 1800
      ? `${sourceVersion.content.slice(0, 1800)}\n[Source prompt excerpt truncated in this comparison brief.]`
      : sourceVersion.content;
  const improvedExcerpt =
    improvedVersion.content.length > 1800
      ? `${improvedVersion.content.slice(0, 1800)}\n[Improved prompt excerpt truncated in this comparison brief.]`
      : improvedVersion.content;
  const metricChanges = scoreComparison.metrics
    .map(
      (metric) =>
        `- ${metric.label}: ${metric.sourceScore.toFixed(1)} -> ${metric.improvedScore.toFixed(
          1,
        )} (${formatQualityDelta(metric.delta)}, ${metric.status})`,
    )
    .join("\n");
  const strongestImprovement = scoreComparison.strongestImprovement
    ? `${scoreComparison.strongestImprovement.label} ${formatQualityDelta(
        scoreComparison.strongestImprovement.delta,
      )}`
    : "No metric increased.";
  const reviewCandidate = scoreComparison.reviewCandidate
    ? `${scoreComparison.reviewCandidate.label} ${formatQualityDelta(
        scoreComparison.reviewCandidate.delta,
      )}: ${scoreComparison.reviewCandidate.recommendation}`
    : "No review candidate.";

  return `Role:
You are a senior prompt quality reviewer.

Objective:
Compare the source prompt and improved prompt, then propose the next practical improvement step while preserving the original intent.

Context:
- Title: ${prompt.title}
- Domain: ${prompt.domain}
- Goal: ${prompt.goal}
- Source AI tool: ${modelLabels[sourceVersion.targetModel]}
- Improved AI tool: ${modelLabels[improvedVersion.targetModel]}
- Source score: ${sourceScore.toFixed(1)}/5
- Improved score: ${improvedScore.toFixed(1)}/5
- Overall delta: ${formatQualityDelta(delta)}

Metric changes:
${metricChanges}

Summary signals:
- Improved metrics: ${scoreComparison.improvedCount}
- Unchanged metrics: ${scoreComparison.unchangedCount}
- Review metrics: ${scoreComparison.regressedCount}
- Strongest improvement: ${strongestImprovement}
- Next review candidate: ${reviewCandidate}

Instructions:
- Identify what materially changed between the source prompt and improved prompt.
- Keep improvements grounded in the supplied text and scores.
- Do not invent company facts, performance numbers, or missing business context.
- Recommend the next revision only if it would improve clarity, constraints, model fit, or reusability.
- Keep Korean context and internal terms intact where nuance matters.

Required output:
1. Change summary
2. Remaining weakness
3. Next revision plan
4. Copy-ready revised prompt

Source prompt excerpt:
${sourceExcerpt}

Improved prompt excerpt:
${improvedExcerpt}`;
}
