import {
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  type PromptAsset,
  type PromptSkill,
} from "@/lib/prompt";
import { formatAbsoluteInternalHref } from "@/lib/navigation/href";
import {
  getSkillLanguageStrategy,
  getSkillOutputLanguage,
  type SkillFeedbackInsight,
  type SkillRunStats,
} from "@/lib/skills/skill-runner";
import type { SkillImprovementPlan } from "@/lib/skills/skill-improver";
import { getBestVersion } from "@/lib/skills/skill-builder";
import { buildSkillHref, buildSkillRunLibraryHref } from "./hrefs";
import { feedbackStatusLabel, formatTimestamp } from "./labels";

export function buildSkillRunLibraryLinkCopyBody({
  linkText,
  prompt,
  skillName,
}: {
  linkText: string;
  prompt: PromptAsset;
  skillName?: string;
}) {
  const bestVersion = getBestVersion(prompt);

  return [
    linkText,
    "",
    `- 실행 프롬프트: ${prompt.title}`,
    skillName ? `- 스킬: ${skillName}` : undefined,
    `- 대상 AI: ${modelLabels[bestVersion.targetModel]}`,
    `- 품질: ${bestVersion.qualityScore.toFixed(1)}`,
    `- 피드백: ${prompt.feedback.length}개`,
    `- 생성일: ${formatTimestamp(prompt.createdAt)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatReportInternalHref(href: string, baseUrl?: string) {
  return formatAbsoluteInternalHref(href, baseUrl) ?? href;
}

export function buildSkillsOperationalSummaryReportText({
  baseUrl,
  stats,
}: {
  baseUrl?: string;
  stats: SkillRunStats;
}) {
  return [
    "# Skills 운영 요약 리포트",
    "",
    "## Summary",
    `- 전체 실행 프롬프트: ${stats.totalRuns}개`,
    `- 실행된 스킬: ${stats.activeSkills}개`,
    `- 실행 피드백: ${stats.feedbackCount}개`,
    `- 최근 실행: ${
      stats.latestRun
        ? `${stats.latestRun.title} · ${formatTimestamp(
            stats.latestRun.createdAt,
          )} · ${formatReportInternalHref(
            buildSkillRunLibraryHref(stats.latestRun),
            baseUrl,
          )}`
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
              )} · ${formatReportInternalHref(
                buildSkillHref(item.skill.id),
                baseUrl,
              )}`,
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
              } · ${formatReportInternalHref(
                buildSkillHref(item.skill.id),
                baseUrl,
              )}`,
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

export function buildSkillsOperationalSummaryStudioPrompt({
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
    "Use the Skills operations report below to create an execution-ready improvement plan for reusable prompt skills.",
    "",
    "Instructions:",
    "- Prioritize skills that are used often, lack feedback, or are in the improvement queue.",
    "- Separate actions for feedback collection, prompt template improvement, input guide refinement, and quality checklist updates.",
    "- Use the Library and Skills links in the report as the operating queues.",
    "- Do not invent missing user, company, customer, or performance facts.",
    "- Return the plan in Korean, but write reusable AI prompt instructions in English when useful.",
    "",
    "Skills operations report:",
    buildSkillsOperationalSummaryReportText({ baseUrl, stats }),
  ].join("\n");
}

export function buildSkillImprovementPlanCopyBody({
  skill,
  insight,
  plan,
}: {
  skill: PromptSkill;
  insight: SkillFeedbackInsight;
  plan: SkillImprovementPlan;
}) {
  return [
    `# Skill Improvement Plan · ${skill.name || "이름 없는 스킬"}`,
    "",
    `- 상태: ${feedbackStatusLabel(insight.status)}`,
    `- 대상 AI: ${modelLabels[skill.targetModel]}`,
    `- 언어 전략: ${languageStrategyLabels[getSkillLanguageStrategy(skill)]}`,
    `- 답변 언어: ${outputLanguageLabels[getSkillOutputLanguage(skill)]}`,
    insight.feedbackCount
      ? `- 성공률: ${insight.successRate}%`
      : "- 성공률: 측정 전",
    `- 피드백: ${insight.feedbackCount}개`,
    insight.feedbackCount
      ? `- 평균 평가: ${insight.averageRating.toFixed(1)}`
      : undefined,
    insight.lowRatingCount ? `- 낮은 평가: ${insight.lowRatingCount}개` : undefined,
    insight.topFeedbackType
      ? `- 주요 피드백 유형: ${insight.topFeedbackType}`
      : undefined,
    "",
    "## Recommendations",
    ...insight.recommendations.map((item) => `- ${item}`),
    "",
    "## Planned Changes",
    ...plan.changes.map((item) => `- ${item}`),
    insight.latestComments.length ? "" : undefined,
    insight.latestComments.length ? "## Latest Comments" : undefined,
    ...insight.latestComments.map((comment) => `- ${comment}`),
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSkillImprovementPlanStudioPrompt({
  planText,
  skill,
}: {
  planText: string;
  skill: PromptSkill;
}) {
  const inputGuide = skill.inputGuide.trim() || "입력 가이드가 아직 없습니다.";
  const outputFormat = skill.outputFormat.trim() || "출력 형식이 아직 없습니다.";
  const promptTemplate =
    skill.promptTemplate.trim() || "스킬 템플릿이 아직 없습니다.";

  return [
    "Role:",
    "You are a senior prompt engineer improving a reusable AI skill template.",
    "",
    "Objective:",
    `Turn the skill improvement plan below into a concrete template refinement plan for "${skill.name || "이름 없는 스킬"}".`,
    "",
    "Instructions:",
    "- Identify the exact template, input guide, output format, and quality checklist changes to make.",
    "- Preserve the selected target AI, language strategy, and output language decisions unless the plan shows a clear reason to change them.",
    "- Separate immediate edits from feedback that needs more evidence.",
    "- Do not invent user, company, customer, or performance facts that are not present in the plan.",
    "- Return the plan in Korean, but write reusable AI prompt instructions in English when useful.",
    "",
    "Current skill context:",
    `- Name: ${skill.name || "이름 없는 스킬"}`,
    `- Description: ${skill.description || "설명 없음"}`,
    `- Domain: ${skill.domain || "범용"}`,
    `- Target AI: ${modelLabels[skill.targetModel]}`,
    `- Language strategy: ${languageStrategyLabels[getSkillLanguageStrategy(skill)]}`,
    `- Output language: ${outputLanguageLabels[getSkillOutputLanguage(skill)]}`,
    `- Tags: ${skill.tags.length ? skill.tags.join(", ") : "없음"}`,
    "",
    "Input guide:",
    inputGuide,
    "",
    "Output format:",
    outputFormat,
    "",
    "Quality checklist:",
    skill.qualityChecklist.length
      ? skill.qualityChecklist.map((item) => `- ${item}`).join("\n")
      : "- 아직 품질 체크리스트가 없습니다.",
    "",
    "Current prompt template:",
    promptTemplate,
    "",
    "Skill improvement plan:",
    planText,
  ].join("\n");
}
