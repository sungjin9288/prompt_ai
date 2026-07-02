import { formatAbsoluteInternalHref } from "@/lib/navigation/href";
import {
  learningOpsPriorityLabel,
  learningOpsPriorityRank,
  type LearningOpsAction,
} from "@/lib/dashboard/learning-memory";

export type DashboardNextActionQueueItem = LearningOpsAction & {
  actionKey: string;
  category: "learning" | "personalization";
  categoryLabel: string;
};

export type DashboardNextActionQueuePriorityCounts = Record<
  LearningOpsAction["priority"],
  number
>;

export type DashboardNextActionQueueCategoryCounts = Record<
  DashboardNextActionQueueItem["category"],
  number
>;

export const dashboardNextActionQueueVerificationChecklist = [
  "원본 화면에서 변경된 필드, 메모리, 메타 확인",
  "Studio 프롬프트를 재생성하거나 검토",
  "외부 AI handoff에 재사용 가능할 때만 저장",
];

export function summarizeDashboardNextActionQueue({
  learningOpsActions,
  personalizationActions,
}: {
  learningOpsActions: LearningOpsAction[];
  personalizationActions: LearningOpsAction[];
}): DashboardNextActionQueueItem[] {
  return [
    ...personalizationActions.map((action, index) => ({
      ...action,
      actionKey: `personalization-${index}-${action.label}`,
      category: "personalization" as const,
      categoryLabel: "개인화",
    })),
    ...learningOpsActions.map((action, index) => ({
      ...action,
      actionKey: `learning-${index}-${action.label}`,
      category: "learning" as const,
      categoryLabel: "학습",
    })),
  ]
    .sort(
      (left, right) =>
        learningOpsPriorityRank(left.priority) -
          learningOpsPriorityRank(right.priority) ||
        left.categoryLabel.localeCompare(right.categoryLabel, "ko"),
    )
    .slice(0, 4);
}

export function summarizeDashboardNextActionQueuePriorityCounts(
  queue: DashboardNextActionQueueItem[],
): DashboardNextActionQueuePriorityCounts {
  return queue.reduce<DashboardNextActionQueuePriorityCounts>(
    (counts, item) => {
      counts[item.priority] += 1;

      return counts;
    },
    {
      high: 0,
      low: 0,
      medium: 0,
    },
  );
}

export function summarizeDashboardNextActionQueueCategoryCounts(
  queue: DashboardNextActionQueueItem[],
): DashboardNextActionQueueCategoryCounts {
  return queue.reduce<DashboardNextActionQueueCategoryCounts>(
    (counts, item) => {
      counts[item.category] += 1;

      return counts;
    },
    {
      learning: 0,
      personalization: 0,
    },
  );
}

export function buildDashboardNextActionQueueLinksText({
  baseUrl,
  queue,
}: {
  baseUrl?: string;
  queue: DashboardNextActionQueueItem[];
}) {
  return [
    "# Dashboard 다음 실행 큐 링크",
    "",
    ...queue.map((item, index) => {
      const actionHref = formatAbsoluteInternalHref(item.href, baseUrl) ?? item.href;

      return `${index + 1}. [${learningOpsPriorityLabel(item.priority)}] ${
        item.categoryLabel
      } · ${item.label}: ${actionHref}`;
    }),
  ].join("\n");
}

export function buildDashboardNextActionQueueVerificationChecklistText() {
  return [
    "# Dashboard 다음 실행 큐 완료 확인",
    "",
    ...dashboardNextActionQueueVerificationChecklist.map(
      (item, index) => `${index + 1}. ${item}`,
    ),
  ].join("\n");
}

export function buildDashboardNextActionQueueReportText({
  baseUrl,
  companyCompletion,
  dataReadinessScore,
  memoryCount,
  profileCompletion,
  queue,
  trackedLearningPromptCount,
}: {
  baseUrl?: string;
  companyCompletion: number;
  dataReadinessScore: number;
  memoryCount: number;
  profileCompletion: number;
  queue: DashboardNextActionQueueItem[];
  trackedLearningPromptCount: number;
}) {
  const priorityCounts = summarizeDashboardNextActionQueuePriorityCounts(queue);
  const categoryCounts = summarizeDashboardNextActionQueueCategoryCounts(queue);
  const firstAction = queue[0];
  const firstActionHref = firstAction
    ? formatAbsoluteInternalHref(firstAction.href, baseUrl) ?? firstAction.href
    : null;

  return [
    "# Dashboard 다음 실행 큐 리포트",
    "",
    "## Readiness",
    `- 전체 운영 준비도: ${dataReadinessScore}%`,
    `- 개인 프로필: ${profileCompletion}%`,
    `- 회사 프로필: ${companyCompletion}%`,
    `- 학습 메모리: ${memoryCount}개`,
    `- 학습 메타 보존 프롬프트: ${trackedLearningPromptCount}개`,
    `- Queue priority: High ${priorityCounts.high} · Med ${priorityCounts.medium} · Low ${priorityCounts.low}`,
    `- Queue category: 개인화 ${categoryCounts.personalization} · 학습 ${categoryCounts.learning}`,
    `- First action: ${
      firstAction
        ? `[${learningOpsPriorityLabel(firstAction.priority)}] ${
            firstAction.categoryLabel
          } · ${firstAction.label} · ${firstActionHref}`
        : "대기 없음"
    }`,
    "",
    "## Prioritized queue",
    queue
      .map((item, index) => {
        const actionHref = formatAbsoluteInternalHref(item.href, baseUrl) ?? item.href;

        return `${index + 1}. [${learningOpsPriorityLabel(item.priority)}] ${
          item.categoryLabel
        } · ${item.label}: ${item.description} · ${actionHref}`;
      })
      .join("\n"),
    "",
    "## Execution rule",
    "- Run High items first, then regenerate or review a Studio prompt to confirm quality impact.",
    "- Keep profile/company facts exact and only add Learning memories when the rule is reusable.",
    "",
    "## Verification checklist",
    ...dashboardNextActionQueueVerificationChecklist.map((item) => `- ${item}`),
  ].join("\n");
}

export function buildDashboardNextActionQueueStudioPrompt({
  baseUrl,
  companyCompletion,
  dataReadinessScore,
  memoryCount,
  profileCompletion,
  queue,
  trackedLearningPromptCount,
}: {
  baseUrl?: string;
  companyCompletion: number;
  dataReadinessScore: number;
  memoryCount: number;
  profileCompletion: number;
  queue: DashboardNextActionQueueItem[];
  trackedLearningPromptCount: number;
}) {
  return [
    "Role:",
    "You are a senior AI operations planner turning a prioritized dashboard queue into executable work.",
    "",
    "Objective:",
    "Create a concise execution plan for the Dashboard next action queue.",
    "",
    "Instructions:",
    "- Preserve the priority order unless a dependency clearly requires a different sequence.",
    "- For each action, name the exact workspace area to update: Profile, Company, Learning, Studio, or Library.",
    "- Define what data to collect, what to change, and how to verify that future GPT, Claude, Codex, and Gemini prompts improve.",
    "- Return the plan in Korean, but write reusable AI prompt instructions in English when useful.",
    "",
    "Dashboard next action queue report:",
    buildDashboardNextActionQueueReportText({
      baseUrl,
      companyCompletion,
      dataReadinessScore,
      memoryCount,
      profileCompletion,
      queue,
      trackedLearningPromptCount,
    }),
  ].join("\n");
}

export function buildDashboardNextActionQueueVerificationStudioPrompt({
  baseUrl,
  companyCompletion,
  dataReadinessScore,
  memoryCount,
  profileCompletion,
  queue,
  trackedLearningPromptCount,
}: {
  baseUrl?: string;
  companyCompletion: number;
  dataReadinessScore: number;
  memoryCount: number;
  profileCompletion: number;
  queue: DashboardNextActionQueueItem[];
  trackedLearningPromptCount: number;
}) {
  return [
    "Role:",
    "You are a senior AI operations QA reviewer verifying completed personalization and Learning actions.",
    "",
    "Objective:",
    "Create a concise verification plan for the Dashboard next action queue completion checklist.",
    "",
    "Instructions:",
    "- Use the checklist to verify each completed action before saving any new reusable rule.",
    "- For each priority item, name the exact evidence that proves completion.",
    "- Define one Studio prompt regeneration or review check that confirms quality impact.",
    "- Return the plan in Korean, but keep reusable AI handoff instructions in English when they should be copied into GPT, Claude, Codex, or Gemini.",
    "",
    "Completion checklist:",
    buildDashboardNextActionQueueVerificationChecklistText(),
    "",
    "Dashboard next action queue report:",
    buildDashboardNextActionQueueReportText({
      baseUrl,
      companyCompletion,
      dataReadinessScore,
      memoryCount,
      profileCompletion,
      queue,
      trackedLearningPromptCount,
    }),
  ].join("\n");
}
