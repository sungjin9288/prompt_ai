import { formatCountDelta } from "@/lib/studio-view/generation";
import {
  getDisabledMemoryScopeLabels,
  getEnabledMemoryScopeLabels,
} from "@/lib/studio-view/learning-memory";
import { generationEngineLabels } from "@/lib/analytics/generation-engine";
import {
  buildTargetAiHandoffReadinessItems,
  type PromptAsset,
  type PromptQualityComparison,
  type TargetAiHandoffReadinessStatus,
} from "@/lib/prompt";

export const targetAiReadinessStatusLabels: Record<
  TargetAiHandoffReadinessStatus,
  string
> = {
  blocked: "보강 필요",
  ready: "전달 가능",
  review: "검토 필요",
};

export const targetAiReadinessStatusClassNames: Record<
  TargetAiHandoffReadinessStatus,
  string
> = {
  blocked: "text-danger",
  ready: "text-success",
  review: "text-accent",
};

export const targetAiReadinessStatusOrder: TargetAiHandoffReadinessStatus[] = [
  "ready",
  "review",
  "blocked",
];

export function summarizeTargetAiReadinessItems(
  items: ReturnType<typeof buildTargetAiHandoffReadinessItems>,
) {
  return items.reduce<Record<TargetAiHandoffReadinessStatus, number>>(
    (summary, item) => ({
      ...summary,
      [item.status]: summary[item.status] + 1,
    }),
    {
      blocked: 0,
      ready: 0,
      review: 0,
    },
  );
}

export type TargetAiReadinessSummary = ReturnType<
  typeof summarizeTargetAiReadinessItems
>;

export interface TargetAiReadinessComparison {
  current: TargetAiReadinessSummary;
  deltas: TargetAiReadinessSummary;
  previous: TargetAiReadinessSummary;
}

export type RegenerationSaveDecisionStatus = "hold" | "review" | "save";

export const regenerationSaveDecisionClassNames: Record<
  RegenerationSaveDecisionStatus,
  string
> = {
  hold: "border-danger/50 bg-danger/10 text-danger",
  review: "border-accent/40 bg-accent/10 text-accent",
  save: "border-success/40 bg-success/10 text-success",
};

export function getRegenerationSaveDecision({
  qualityComparison,
  readinessComparison,
}: {
  qualityComparison: PromptQualityComparison;
  readinessComparison: TargetAiReadinessComparison | null;
}) {
  const readiness = readinessComparison?.current;
  const readinessDeltas = readinessComparison?.deltas;

  if (readiness && readiness.blocked > 0) {
    return {
      detail:
        "보강 필요 항목이 남아 있습니다. 외부 AI에 전달하기 전에 한 번 더 보강하세요.",
      label: "보류 권장",
      status: "hold" as const,
    };
  }

  if (qualityComparison.scoreDelta < 0 || qualityComparison.regressedCount > 2) {
    return {
      detail:
        "전체 점수나 다수 품질 항목이 하락했습니다. 원본과 본문을 비교한 뒤 저장 여부를 판단하세요.",
      label: "보류 권장",
      status: "hold" as const,
    };
  }

  if (readinessDeltas && readinessDeltas.blocked > 0) {
    return {
      detail:
        "이번 재생성에서 보강 필요 항목이 늘었습니다. 전달 준비 상태를 먼저 안정화하세요.",
      label: "보류 권장",
      status: "hold" as const,
    };
  }

  if (
    qualityComparison.scoreDelta === 0 ||
    qualityComparison.regressedCount > 0 ||
    (readiness && readiness.review > 0)
  ) {
    return {
      detail:
        "저장은 가능하지만 하락 항목이나 검토 필요 항목을 확인한 뒤 저장하세요.",
      label: "검토 후 저장",
      status: "review" as const,
    };
  }

  return {
    detail:
      "점수와 전달 준비 상태가 모두 저장 기준을 충족합니다. 저장 후보로 적합합니다.",
    label: "저장 권장",
    status: "save" as const,
  };
}

export function buildRegenerationSaveDecisionReportSection({
  decision,
}: {
  decision: ReturnType<typeof getRegenerationSaveDecision>;
}) {
  return [
    "",
    "## Studio save recommendation",
    `- Decision: ${decision.label}`,
    `- Rationale: ${decision.detail}`,
  ].join("\n");
}

export function buildTargetAiReadinessComparisonReportSection({
  current,
  deltas,
  previous,
}: TargetAiReadinessComparison) {
  return [
    "",
    "## Target AI handoff readiness",
    ...targetAiReadinessStatusOrder.map((status) => {
      const delta = deltas[status];

      return `- ${targetAiReadinessStatusLabels[status]}: ${previous[status]} -> ${
        current[status]
      } (${formatCountDelta(delta)})`;
    }),
    "",
    "## Handoff decision",
    current.blocked > 0
      ? "- Current version still has blocking handoff items. Improve before sending to the target AI."
      : current.review > 0
        ? "- Current version can be tested, but review flagged handoff items before production use."
        : "- Current version has no handoff readiness blockers or review items.",
  ].join("\n");
}

export function buildStudioLearningContextReportText(prompt: PromptAsset) {
  const context = prompt.learningContext;

  if (!context) {
    return [
      `# 학습 반영 리포트 · ${prompt.title}`,
      "",
      "- 상태: 학습 컨텍스트 메타 없음",
      "- 설명: 이 결과는 학습 컨텍스트 메타 저장 기능 도입 전 생성됐습니다.",
      `- 생성 엔진: ${generationEngineLabels[prompt.source]}${
        prompt.modelUsed ? ` ${prompt.modelUsed}` : ""
      }`,
      `- 분야: ${prompt.domain}`,
      `- 목표: ${prompt.goal}`,
    ].join("\n");
  }

  const enabledScopes = getEnabledMemoryScopeLabels(context.enabledScopes);
  const disabledScopes = getDisabledMemoryScopeLabels(context.enabledScopes);

  return [
    `# 학습 반영 리포트 · ${prompt.title}`,
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
