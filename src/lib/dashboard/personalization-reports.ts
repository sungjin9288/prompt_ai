import {
  type CompanyProfile,
  type LearningMemory,
  type PromptAsset,
  type UserProfile,
} from "@/lib/prompt";
import { formatAbsoluteInternalHref } from "@/lib/navigation/href";
import { type SkillRunStats } from "@/lib/skills/skill-runner";
import {
  formatReadinessLabel,
  formatReportList,
  formatTimestamp,
} from "@/lib/dashboard/shared";
import { buildPromptLibraryHref, buildSkillHref } from "@/lib/dashboard/hrefs";
import {
  learningOpsPriorityLabel,
  type LearningOpsAction,
  type LearningReviewQueue,
  type LearningScopeSummary,
} from "@/lib/dashboard/learning-memory";

export function buildDashboardPersonalizationReportText({
  baseUrl,
  companyMemoryCount,
  companyProfile,
  companyCompletion,
  dataReadinessScore,
  learningOpsActions,
  memories,
  personalizationActions,
  profileCompletion,
  prompts,
  scopeSummaries,
  skills,
  trackedLearningPromptCount,
  userMemoryCount,
  userProfile,
}: {
  baseUrl?: string;
  companyMemoryCount: number;
  companyProfile: CompanyProfile;
  companyCompletion: number;
  dataReadinessScore: number;
  learningOpsActions: LearningOpsAction[];
  memories: LearningMemory[];
  personalizationActions: LearningOpsAction[];
  profileCompletion: number;
  prompts: PromptAsset[];
  scopeSummaries: LearningScopeSummary[];
  skills: { id: string }[];
  trackedLearningPromptCount: number;
  userMemoryCount: number;
  userProfile: UserProfile;
}) {
  return [
    "# 개인화 기준 리포트",
    "",
    "## Readiness",
    `- 전체 운영 준비도: ${dataReadinessScore}%`,
    `- 개인 프로필: ${profileCompletion}% (${formatReadinessLabel(
      profileCompletion,
    )})`,
    `- 회사 프로필: ${companyCompletion}% (${formatReadinessLabel(
      companyCompletion,
    )})`,
    `- 저장 프롬프트: ${prompts.length}개`,
    `- 학습 메모리: ${memories.length}개`,
    `- 학습 메타 보존 프롬프트: ${trackedLearningPromptCount}개`,
    `- 스킬: ${skills.length}개`,
    "",
    "## User profile",
    `- Role: ${userProfile.role || "미설정"}`,
    `- Industries: ${formatReportList(userProfile.industries)}`,
    `- Goals: ${formatReportList(userProfile.goals)}`,
    `- Preferred tone: ${userProfile.preferredTone || "미설정"}`,
    `- Preferred outputs: ${formatReportList(userProfile.preferredOutputs)}`,
    `- Avoid phrases: ${formatReportList(userProfile.avoidPhrases)}`,
    `- Repeated tasks: ${formatReportList(userProfile.repeatedTasks)}`,
    `- User memory count: ${userMemoryCount}개`,
    "",
    "## Company profile",
    `- Company: ${companyProfile.companyName || "미설정"}`,
    `- Description: ${companyProfile.description || "미설정"}`,
    `- Products/services: ${formatReportList(companyProfile.products)}`,
    `- Customers: ${formatReportList(companyProfile.customers)}`,
    `- Brand tone: ${companyProfile.brandTone || "미설정"}`,
    `- Internal terms: ${formatReportList(companyProfile.internalTerms)}`,
    `- Banned phrases: ${formatReportList(companyProfile.bannedPhrases)}`,
    `- Document formats: ${formatReportList(companyProfile.documentFormats)}`,
    `- Company memory count: ${companyMemoryCount}개`,
    "",
    "## Learning scope coverage",
    scopeSummaries
      .map(
        (item) =>
          `- ${item.label}: prompts ${item.promptCount} · memories ${
            item.scope === "untracked" ? "-" : item.memoryCount
          } · avg quality ${
            item.averageQuality ? item.averageQuality.toFixed(1) : "-"
          }`,
      )
      .join("\n"),
    "",
    "## Next personalization actions",
    personalizationActions
      .map((item) => {
        const actionHref = formatAbsoluteInternalHref(item.href, baseUrl);

        return `- [${learningOpsPriorityLabel(item.priority)}] ${item.label}: ${
          item.description
        } · ${actionHref}`;
      })
      .join("\n"),
    "",
    "## Learning operations actions",
    learningOpsActions
      .map((item) => {
        const actionHref = formatAbsoluteInternalHref(item.href, baseUrl);

        return `- [${learningOpsPriorityLabel(item.priority)}] ${item.label}: ${
          item.description
        } · ${actionHref}`;
      })
      .join("\n"),
    "",
    "## Usage note",
    "- Use this report as grounding context when asking GPT, Claude, Codex, or Gemini to improve prompts.",
    "- Do not paste private customer data or secrets into external AI tools unless the workspace owner explicitly approves it.",
  ].join("\n");
}

export function buildDashboardPersonalizationStudioPrompt({
  baseUrl,
  companyMemoryCount,
  companyProfile,
  companyCompletion,
  dataReadinessScore,
  learningOpsActions,
  memories,
  personalizationActions,
  profileCompletion,
  prompts,
  scopeSummaries,
  skills,
  trackedLearningPromptCount,
  userMemoryCount,
  userProfile,
}: {
  baseUrl?: string;
  companyMemoryCount: number;
  companyProfile: CompanyProfile;
  companyCompletion: number;
  dataReadinessScore: number;
  learningOpsActions: LearningOpsAction[];
  memories: LearningMemory[];
  personalizationActions: LearningOpsAction[];
  profileCompletion: number;
  prompts: PromptAsset[];
  scopeSummaries: LearningScopeSummary[];
  skills: { id: string }[];
  trackedLearningPromptCount: number;
  userMemoryCount: number;
  userProfile: UserProfile;
}) {
  return [
    "Role:",
    "You are a senior AI personalization strategist improving a prompt engineering workspace.",
    "",
    "Objective:",
    "Use the personalization report below to create an execution-ready plan that improves future GPT, Claude, Codex, and Gemini prompt quality.",
    "",
    "Instructions:",
    "- Identify the highest-impact profile, company, and learning-memory gaps.",
    "- Propose concrete memory updates, profile edits, and prompt generation rules.",
    "- Separate quick fixes, structured data to collect, and quality measurement checks.",
    "- Preserve user/company facts exactly as provided; do not invent missing customer, product, or performance details.",
    "- Return the plan in Korean, but write reusable AI prompt instructions in English when useful.",
    "",
    "Personalization report:",
    buildDashboardPersonalizationReportText({
      baseUrl,
      companyMemoryCount,
      companyProfile,
      companyCompletion,
      dataReadinessScore,
      learningOpsActions,
      memories,
      personalizationActions,
      profileCompletion,
      prompts,
      scopeSummaries,
      skills,
      trackedLearningPromptCount,
      userMemoryCount,
      userProfile,
    }),
  ].join("\n");
}

export function buildDashboardPersonalizationActionStudioPrompt({
  action,
  baseUrl,
  companyMemoryCount,
  companyProfile,
  companyCompletion,
  dataReadinessScore,
  learningOpsActions,
  memories,
  personalizationActions,
  profileCompletion,
  prompts,
  scopeSummaries,
  skills,
  trackedLearningPromptCount,
  userMemoryCount,
  userProfile,
}: {
  action: LearningOpsAction;
  baseUrl?: string;
  companyMemoryCount: number;
  companyProfile: CompanyProfile;
  companyCompletion: number;
  dataReadinessScore: number;
  learningOpsActions: LearningOpsAction[];
  memories: LearningMemory[];
  personalizationActions: LearningOpsAction[];
  profileCompletion: number;
  prompts: PromptAsset[];
  scopeSummaries: LearningScopeSummary[];
  skills: { id: string }[];
  trackedLearningPromptCount: number;
  userMemoryCount: number;
  userProfile: UserProfile;
}) {
  const actionHref = formatAbsoluteInternalHref(action.href, baseUrl);

  return [
    "Role:",
    "You are a senior AI personalization operator executing one improvement action.",
    "",
    "Selected action:",
    `- Priority: ${learningOpsPriorityLabel(action.priority)}`,
    `- Action: ${action.label}`,
    `- Description: ${action.description}`,
    `- Review link: ${actionHref}`,
    "",
    "Objective:",
    "Create a focused execution plan for this personalization action.",
    "",
    "Instructions:",
    "- Explain exactly what to update in Profile, Company, Learning, Studio, or Library.",
    "- Include the concrete questions or data points the operator should collect.",
    "- Suggest memory candidates or prompt rules only when they are supported by the report.",
    "- Add a short verification checklist for confirming the action improved future prompts.",
    "- Return the plan in Korean, but write reusable AI prompt instructions in English when useful.",
    "",
    "Personalization report:",
    buildDashboardPersonalizationReportText({
      baseUrl,
      companyMemoryCount,
      companyProfile,
      companyCompletion,
      dataReadinessScore,
      learningOpsActions,
      memories,
      personalizationActions,
      profileCompletion,
      prompts,
      scopeSummaries,
      skills,
      trackedLearningPromptCount,
      userMemoryCount,
      userProfile,
    }),
  ].join("\n");
}

export function buildDashboardPersonalizationActionReportText({
  action,
  baseUrl,
  companyMemoryCount,
  companyProfile,
  companyCompletion,
  dataReadinessScore,
  learningOpsActions,
  memories,
  personalizationActions,
  profileCompletion,
  prompts,
  scopeSummaries,
  skills,
  trackedLearningPromptCount,
  userMemoryCount,
  userProfile,
}: {
  action: LearningOpsAction;
  baseUrl?: string;
  companyMemoryCount: number;
  companyProfile: CompanyProfile;
  companyCompletion: number;
  dataReadinessScore: number;
  learningOpsActions: LearningOpsAction[];
  memories: LearningMemory[];
  personalizationActions: LearningOpsAction[];
  profileCompletion: number;
  prompts: PromptAsset[];
  scopeSummaries: LearningScopeSummary[];
  skills: { id: string }[];
  trackedLearningPromptCount: number;
  userMemoryCount: number;
  userProfile: UserProfile;
}) {
  const actionHref = formatAbsoluteInternalHref(action.href, baseUrl);

  return [
    "# 개인화 보강 조치 리포트",
    "",
    "## Selected action",
    `- Priority: ${learningOpsPriorityLabel(action.priority)}`,
    `- Action: ${action.label}`,
    `- Description: ${action.description}`,
    `- Review link: ${actionHref}`,
    "",
    "## Personalization context",
    buildDashboardPersonalizationReportText({
      baseUrl,
      companyMemoryCount,
      companyProfile,
      companyCompletion,
      dataReadinessScore,
      learningOpsActions,
      memories,
      personalizationActions,
      profileCompletion,
      prompts,
      scopeSummaries,
      skills,
      trackedLearningPromptCount,
      userMemoryCount,
      userProfile,
    }),
  ].join("\n");
}

export function buildDashboardLearningOpsReportText({
  actions,
  baseUrl,
  memories,
  queues,
  scopeSummaries,
  trackedPromptCount,
}: {
  actions: LearningOpsAction[];
  baseUrl?: string;
  memories: LearningMemory[];
  queues: LearningReviewQueue[];
  scopeSummaries: LearningScopeSummary[];
  trackedPromptCount: number;
}) {
  return [
    "# Learning 운영 리포트",
    "",
    "## Summary",
    `- 전체 학습 메모리: ${memories.length}개`,
    `- 학습 메타 보존 프롬프트: ${trackedPromptCount}개`,
    "",
    "## 운영 점검 큐",
    queues
      .map((item) => {
        const queueHref = formatAbsoluteInternalHref(item.href, baseUrl);

        return `- ${item.label}: ${item.count}개 · ${item.description} · ${queueHref}`;
      })
      .join("\n"),
    "",
    "## 권장 조치 큐",
    actions
      .map((item) => {
        const actionHref = formatAbsoluteInternalHref(item.href, baseUrl);

        return `- [${learningOpsPriorityLabel(item.priority)}] ${item.label}: ${
          item.description
        } · ${actionHref}`;
      })
      .join("\n"),
    "",
    "## Scope별 현황",
    scopeSummaries
      .map((item) =>
        [
          `### ${item.label}`,
          `- 프롬프트: ${item.promptCount}개`,
          `- 메모리: ${
            item.scope === "untracked" ? "-" : `${item.memoryCount}개`
          }`,
          `- 평균 품질: ${
            item.averageQuality ? item.averageQuality.toFixed(1) : "-"
          }`,
          `- 최근 프롬프트: ${formatTimestamp(item.latestPromptAt)}`,
          `- 최근 메모리: ${
            item.scope === "untracked"
              ? "-"
              : formatTimestamp(item.latestMemoryAt)
          }`,
        ].join("\n"),
      )
      .join("\n\n"),
  ].join("\n");
}

export function buildDashboardLearningOpsStudioPrompt({
  actions,
  baseUrl,
  memories,
  queues,
  scopeSummaries,
  trackedPromptCount,
}: {
  actions: LearningOpsAction[];
  baseUrl?: string;
  memories: LearningMemory[];
  queues: LearningReviewQueue[];
  scopeSummaries: LearningScopeSummary[];
  trackedPromptCount: number;
}) {
  return [
    "Role:",
    "You are a senior AI operations strategist improving a personalized prompt engineering system.",
    "",
    "Objective:",
    "Use the Learning operations report below to create a practical improvement plan for memory quality, scope coverage, and prompt personalization.",
    "",
    "Instructions:",
    "- Prioritize actions that improve future GPT, Claude, Codex, and Gemini prompts.",
    "- Separate quick fixes, memory cleanup, new memory candidates, and measurement checks.",
    "- Identify low-confidence or stale learning areas that should be reviewed first.",
    "- Do not invent user, company, customer, or performance facts that are not present in the report.",
    "- Return the plan in Korean, but keep reusable AI prompt instructions in English when useful.",
    "",
    "Learning operations report:",
    buildDashboardLearningOpsReportText({
      actions,
      baseUrl,
      memories,
      queues,
      scopeSummaries,
      trackedPromptCount,
    }),
  ].join("\n");
}

export function buildDashboardLearningActionReportText({
  action,
  baseUrl,
  memories,
  queues,
  scopeSummaries,
  trackedPromptCount,
}: {
  action: LearningOpsAction;
  baseUrl?: string;
  memories: LearningMemory[];
  queues: LearningReviewQueue[];
  scopeSummaries: LearningScopeSummary[];
  trackedPromptCount: number;
}) {
  const actionHref = formatAbsoluteInternalHref(action.href, baseUrl);

  return [
    "# Learning 권장 조치 리포트",
    "",
    "## Selected action",
    `- Priority: ${learningOpsPriorityLabel(action.priority)}`,
    `- Action: ${action.label}`,
    `- Description: ${action.description}`,
    `- Review link: ${actionHref}`,
    "",
    "## Dashboard context",
    buildDashboardLearningOpsReportText({
      actions: [action],
      baseUrl,
      memories,
      queues,
      scopeSummaries,
      trackedPromptCount,
    }),
  ].join("\n");
}

export function buildDashboardLearningActionStudioPrompt({
  action,
  baseUrl,
  memories,
  queues,
  scopeSummaries,
  trackedPromptCount,
}: {
  action: LearningOpsAction;
  baseUrl?: string;
  memories: LearningMemory[];
  queues: LearningReviewQueue[];
  scopeSummaries: LearningScopeSummary[];
  trackedPromptCount: number;
}) {
  const actionHref = formatAbsoluteInternalHref(action.href, baseUrl);

  return [
    "Role:",
    "You are a senior prompt operations specialist improving one learning operation task.",
    "",
    "Objective:",
    `Create an execution-ready plan for this action: ${action.label}.`,
    "",
    "Selected action:",
    `- Priority: ${learningOpsPriorityLabel(action.priority)}`,
    `- Description: ${action.description}`,
    `- Review link: ${actionHref}`,
    "",
    "Instructions:",
    "- Explain the concrete steps to complete this action.",
    "- Suggest memory updates, merge rules, or review criteria that would improve future prompts.",
    "- Include a short checklist the operator can use inside Learning or Library.",
    "- Do not invent user, company, customer, or performance facts that are not present in the context.",
    "- Return the plan in Korean, but write reusable prompt instructions in English when helpful.",
    "",
    "Dashboard context:",
    buildDashboardLearningActionReportText({
      action,
      baseUrl,
      memories,
      queues,
      scopeSummaries,
      trackedPromptCount,
    }),
  ].join("\n");
}

export function buildDashboardSkillOpsReportText({
  baseUrl,
  stats,
}: {
  baseUrl?: string;
  stats: SkillRunStats;
}) {
  const formatSkillOpsHref = (href: string) =>
    formatAbsoluteInternalHref(href, baseUrl) ?? href;

  return [
    "# 스킬 운영 리포트",
    "",
    "## Summary",
    `- 전체 실행 프롬프트: ${stats.totalRuns}개`,
    `- 실행된 스킬: ${stats.activeSkills}개`,
    `- 실행 피드백: ${stats.feedbackCount}개`,
    `- 최근 실행: ${
      stats.latestRun
        ? `${stats.latestRun.title} · ${formatTimestamp(
            stats.latestRun.createdAt,
          )} · ${formatSkillOpsHref(buildPromptLibraryHref(stats.latestRun))}`
        : "아직 없음"
    }`,
    "",
    "## 반복 사용 상위 스킬",
    stats.topSkills.length
      ? stats.topSkills
          .map(
            (item) =>
              `- ${item.skill.name}: ${item.runCount}회 · 평균 품질 ${
                item.averageScore ? item.averageScore.toFixed(1) : "-"
              } · 성공률 ${
                item.feedbackCount ? `${item.successRate}%` : "미평가"
              } · 최근 ${formatTimestamp(
                item.latestRunAt,
              )} · ${formatSkillOpsHref(buildSkillHref(item.skill.id))}`,
          )
          .join("\n")
      : "- 아직 실행 이력이 없습니다.",
    "",
    "## 개선 필요 큐",
    stats.improvementQueue.length
      ? stats.improvementQueue
          .map(
            (item) =>
              `- ${item.skill.name}: 피드백 ${item.feedbackCount}개 · 성공률 ${
                item.feedbackCount ? `${item.successRate}%` : "미평가"
              } · ${formatSkillOpsHref(buildSkillHref(item.skill.id))}`,
          )
          .join("\n")
      : "- 현재 개선 대기 스킬이 없습니다.",
    "",
    "## Recommended next actions",
    "- 피드백이 없는 실행 프롬프트에는 결과 평가를 먼저 남깁니다.",
    "- 반복 사용 상위 스킬은 입력 가이드와 출력 형식을 더 고정해 재현성을 높입니다.",
    "- 개선 필요 큐의 스킬은 최근 코멘트와 낮은 평가 유형을 기준으로 템플릿 개선안을 반영합니다.",
  ].join("\n");
}

export function buildDashboardSkillOpsStudioPrompt({
  baseUrl,
  stats,
}: {
  baseUrl?: string;
  stats: SkillRunStats;
}) {
  return [
    "Role:",
    "You are a senior prompt operations strategist improving reusable AI skills.",
    "",
    "Objective:",
    "Use the skill operations report below to create an execution-ready improvement plan for reusable prompt skills.",
    "",
    "Instructions:",
    "- Prioritize skills that are used often, lack feedback, or are in the improvement queue.",
    "- Separate actions for feedback collection, prompt template improvement, input guide refinement, and quality checklist updates.",
    "- Use the Library and Skills links in the report as the operating queues.",
    "- Do not invent missing user, company, customer, or performance facts.",
    "- Return the plan in Korean, but write reusable AI prompt instructions in English when useful.",
    "",
    "Skill operations report:",
    buildDashboardSkillOpsReportText({ baseUrl, stats }),
  ].join("\n");
}
