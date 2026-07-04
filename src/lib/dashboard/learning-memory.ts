import {
  modelLabels,
  type LearningMemory,
  type MemoryScope,
  type PromptAsset,
  type PromptImprovementFeedbackSource,
  type PromptVersion,
  type TargetModel,
} from "@/lib/prompt";
import { feedbackTypeToScope } from "@/lib/learning/memory";
import {
  feedbackTypeLabels,
  formatTimestamp,
  makeId,
} from "@/lib/dashboard/shared";
import {
  learningScopeLearningHref,
  learningScopeLibraryHref,
  promptDetailLibraryHref,
  promptFeedbackLibraryHref,
} from "@/lib/dashboard/hrefs";

export function feedbackImprovementMemoryConfidence(rating: number) {
  if (rating >= 5) {
    return 0.9;
  }

  if (rating >= 4) {
    return 0.8;
  }

  if (rating >= 3) {
    return 0.7;
  }

  return 0.6;
}

export type FeedbackBasedImprovementRecord = {
  prompt: PromptAsset;
  sourcePrompt: PromptAsset;
  sourceVersion: PromptVersion;
  improvedVersion: PromptVersion;
  targetModel: TargetModel;
  sourceFeedback: PromptImprovementFeedbackSource;
  delta: number;
  createdAt: string;
  sourceDeletedAt?: string;
};

export function buildFeedbackImprovementLearningMemory(
  record: FeedbackBasedImprovementRecord,
): LearningMemory {
  const now = new Date().toISOString();
  const sourceFeedbackId = record.sourceFeedback.id;
  const scope = feedbackTypeToScope(record.sourceFeedback.feedbackType);
  const domain = record.sourcePrompt.domain || record.prompt.domain || "범용";

  return {
    id: makeId("memory_feedback_improvement"),
    scope,
    sourceType: sourceFeedbackId ? "feedback" : "manual",
    sourceId:
      sourceFeedbackId ??
      `feedback-improvement:${record.sourcePrompt.id}:${record.prompt.id}`,
    title: `피드백 개선 규칙 · ${domain} · ${modelLabels[record.targetModel]}`,
    content: [
      `반복 피드백: ${feedbackTypeLabels[
        record.sourceFeedback.feedbackType
      ]} · ${record.sourceFeedback.rating.toFixed(0)}/5`,
      `적용 규칙: ${record.sourceFeedback.comment}`,
      `다음 ${modelLabels[record.targetModel]} 프롬프트에서는 같은 유형의 요청에 대해 출력 형식, 단계, 검증 기준을 더 명확히 고정합니다.`,
      `근거 개선본: ${promptDetailLibraryHref(
        record.prompt.id,
        record.targetModel,
      )}`,
      record.sourceDeletedAt
        ? `원본 피드백: 원본이 삭제 보관함에 있습니다. 개선본 상세에서 원본 복원 후 확인하세요. ${promptDetailLibraryHref(
            record.prompt.id,
            record.targetModel,
          )}`
        : `원본 피드백: ${promptFeedbackLibraryHref(
            record.sourcePrompt.id,
            record.sourceFeedback.id,
            record.targetModel,
          )}`,
    ].join("\n"),
    tags: [
      domain,
      record.targetModel,
      record.sourceFeedback.feedbackType,
      "feedback-improvement",
      "dashboard",
    ],
    confidence: feedbackImprovementMemoryConfidence(
      record.sourceFeedback.rating,
    ),
    createdAt: now,
    updatedAt: now,
  };
}

export type LearningScopeSummary = {
  scope: MemoryScope | "untracked";
  label: string;
  promptCount: number;
  memoryCount: number;
  averageQuality: number;
  latestPromptAt?: string;
  latestMemoryAt?: string;
};

export type LearningReviewQueue = {
  id: "latest" | "low-confidence" | "manual";
  href: string;
  label: string;
  count: number;
  description: string;
};

export type LearningOpsAction = {
  href: string;
  label: string;
  priority: "high" | "low" | "medium";
  description: string;
};

export const learningScopeLabels: Record<LearningScopeSummary["scope"], string> = {
  user: "사용자",
  company: "회사",
  domain: "분야",
  skill: "스킬",
  untracked: "기록 없음",
};

export const learningScopeOrder: LearningScopeSummary["scope"][] = [
  "company",
  "user",
  "domain",
  "skill",
  "untracked",
];

export function getPromptBestQuality(prompt: PromptAsset) {
  return Math.max(...prompt.versions.map((version) => version.qualityScore));
}

export function summarizeLearningContextUsage(
  prompts: PromptAsset[],
  memories: LearningMemory[],
) {
  return learningScopeOrder.map((scope) => {
    const scopedPrompts = prompts.filter((prompt) => {
      if (scope === "untracked") {
        return !prompt.learningContext;
      }

      return Boolean(prompt.learningContext?.enabledScopes[scope]);
    });
    const scopedMemories =
      scope === "untracked"
        ? []
        : memories.filter((memory) => memory.scope === scope);
    const averageQuality = scopedPrompts.length
      ? scopedPrompts.reduce(
          (sum, prompt) => sum + getPromptBestQuality(prompt),
          0,
        ) / scopedPrompts.length
      : 0;
    const latestPromptAt = scopedPrompts
      .map((prompt) => prompt.createdAt)
      .sort((left, right) => right.localeCompare(left))[0];
    const latestMemoryAt = scopedMemories
      .map((memory) => memory.updatedAt)
      .sort((left, right) => right.localeCompare(left))[0];

    return {
      scope,
      label: learningScopeLabels[scope],
      promptCount: scopedPrompts.length,
      memoryCount: scopedMemories.length,
      averageQuality,
      latestPromptAt,
      latestMemoryAt,
    };
  });
}

export function summarizeLearningReviewQueues(
  memories: LearningMemory[],
): LearningReviewQueue[] {
  const latestMemoryAt = memories
    .map((memory) => memory.updatedAt)
    .sort((left, right) => right.localeCompare(left))[0];

  return [
    {
      id: "low-confidence",
      href: "/learning?review=low-confidence&sort=confidence-asc",
      label: "낮은 신뢰도",
      count: memories.filter((memory) => memory.confidence < 0.5).length,
      description: "보강하거나 병합할 메모리",
    },
    {
      id: "manual",
      href: "/learning?review=manual&sort=updated-desc",
      label: "수동 메모리",
      count: memories.filter((memory) => memory.sourceType === "manual").length,
      description: "직접 입력한 기준 점검",
    },
    {
      id: "latest",
      href: "/learning?sort=updated-desc",
      label: "최근 업데이트",
      count: memories.length,
      description: `최근 ${formatTimestamp(latestMemoryAt)}`,
    },
  ];
}

export function learningOpsPriorityLabel(priority: LearningOpsAction["priority"]) {
  switch (priority) {
    case "high":
      return "High";
    case "medium":
      return "Med";
    default:
      return "Low";
  }
}

export function learningOpsPriorityRank(priority: LearningOpsAction["priority"]) {
  switch (priority) {
    case "high":
      return 0;
    case "medium":
      return 1;
    default:
      return 2;
  }
}

export function summarizeLearningOpsActions({
  memories,
  queues,
  scopeSummaries,
  trackedPromptCount,
}: {
  memories: LearningMemory[];
  queues: LearningReviewQueue[];
  scopeSummaries: LearningScopeSummary[];
  trackedPromptCount: number;
}): LearningOpsAction[] {
  const actions: LearningOpsAction[] = [];
  const lowConfidenceQueue = queues.find((item) => item.id === "low-confidence");
  const manualQueue = queues.find((item) => item.id === "manual");
  const untrackedSummary = scopeSummaries.find(
    (item) => item.scope === "untracked",
  );
  const missingMemoryScopes = scopeSummaries.filter(
    (item) => item.scope !== "untracked" && item.memoryCount === 0,
  );

  if (memories.length === 0) {
    actions.push({
      href: "/learning",
      label: "첫 학습 메모리 만들기",
      priority: "high",
      description: "사용자, 회사, 분야, 스킬 기준 중 최소 1개를 먼저 저장",
    });
  }

  if (lowConfidenceQueue && lowConfidenceQueue.count > 0) {
    actions.push({
      href: lowConfidenceQueue.href,
      label: "낮은 신뢰도 메모리 보강",
      priority: "high",
      description: `${lowConfidenceQueue.count}개 메모리의 기준, 예외, 적용 조건을 명확히 정리`,
    });
  }

  if (missingMemoryScopes.length > 0) {
    actions.push({
      href: learningScopeLearningHref(missingMemoryScopes[0].scope),
      label: "비어 있는 scope 보강",
      priority: "medium",
      description: `${missingMemoryScopes
        .map((item) => item.label)
        .join(", ")} scope에 재사용 가능한 학습 기준 추가`,
    });
  }

  if (trackedPromptCount === 0 && memories.length > 0) {
    actions.push({
      href: "/studio",
      label: "학습 반영 프롬프트 생성",
      priority: "medium",
      description: "저장된 학습 메모리가 실제 프롬프트 생성에 반영되는지 첫 저장본으로 확인",
    });
  }

  if (untrackedSummary && untrackedSummary.promptCount > 0) {
    actions.push({
      href: learningScopeLibraryHref("untracked"),
      label: "학습 메타 미기록 프롬프트 점검",
      priority: "medium",
      description: `${untrackedSummary.promptCount}개 저장본을 현재 학습 기준으로 재개선하거나 재저장`,
    });
  }

  if (manualQueue && manualQueue.count > 0) {
    actions.push({
      href: manualQueue.href,
      label: "수동 메모리 정합성 점검",
      priority: "low",
      description: `${manualQueue.count}개 수동 기준의 중복, 충돌, 오래된 표현 확인`,
    });
  }

  if (actions.length === 0) {
    actions.push({
      href: "/learning?sort=updated-desc",
      label: "주간 학습 품질 점검 유지",
      priority: "low",
      description: "최근 업데이트 기준으로 메모리 변화와 프롬프트 반영 상태 확인",
    });
  }

  return actions.slice(0, 4);
}

export function summarizePersonalizationActions({
  companyCompletion,
  companyMemoryCount,
  profileCompletion,
  promptCount,
  trackedPromptCount,
  userMemoryCount,
}: {
  companyCompletion: number;
  companyMemoryCount: number;
  profileCompletion: number;
  promptCount: number;
  trackedPromptCount: number;
  userMemoryCount: number;
}): LearningOpsAction[] {
  const actions: LearningOpsAction[] = [];

  if (profileCompletion < 80) {
    actions.push({
      href: "/context?section=profile&returnTo=%2F#profile",
      label: "개인 프로필 보강",
      priority: "high",
      description: `현재 ${profileCompletion}%입니다. 역할, 산업, 목표, 선호 출력 형식을 먼저 채우세요.`,
    });
  }

  if (companyCompletion < 80) {
    actions.push({
      href: "/context?section=company&returnTo=%2F#company",
      label: "회사 기준 보강",
      priority: "high",
      description: `현재 ${companyCompletion}%입니다. 제품, 고객군, 브랜드 톤을 명확히 저장하세요.`,
    });
  }

  if (profileCompletion >= 80 && userMemoryCount === 0) {
    actions.push({
      href: "/context?section=profile&returnTo=%2F#profile",
      label: "개인 기준 메모리 반영",
      priority: "medium",
      description: "프로필 저장으로 user scope 학습 메모리를 만들어 다음 생성에 반영하세요.",
    });
  }

  if (companyCompletion >= 80 && companyMemoryCount === 0) {
    actions.push({
      href: "/context?section=company&returnTo=%2F#company",
      label: "회사 기준 메모리 반영",
      priority: "medium",
      description: "회사 기준 저장으로 company scope 학습 메모리를 만들어 다음 생성에 반영하세요.",
    });
  }

  if (promptCount === 0) {
    actions.push({
      href: "/studio",
      label: "첫 개인화 프롬프트 생성",
      priority: "medium",
      description: "프로필과 회사 기준을 반영한 첫 저장 프롬프트를 만들어 품질 기준을 확인하세요.",
    });
  } else if (trackedPromptCount === 0) {
    actions.push({
      href: "/studio",
      label: "학습 반영 프롬프트 재생성",
      priority: "medium",
      description: "기존 저장본을 현재 학습 기준으로 다시 생성해 learning context 메타를 남기세요.",
    });
  }

  if (actions.length === 0) {
    actions.push({
      href: "/learning?sort=updated-desc",
      label: "개인화 기준 정기 점검",
      priority: "low",
      description: "최근 메모리와 저장 프롬프트를 주기적으로 확인해 오래된 기준을 정리하세요.",
    });
  }

  return actions.slice(0, 4);
}
