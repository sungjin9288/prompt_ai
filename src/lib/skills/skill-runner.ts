import type {
  PromptAsset,
  PromptLanguageStrategy,
  PromptOutputLanguage,
  PromptSkill,
  PromptVersion,
} from "@/lib/prompt";
import {
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
} from "@/lib/prompt/defaults";
import { scorePrompt } from "@/lib/prompt/scoring";

export interface SkillRunSummary {
  skill: PromptSkill;
  runCount: number;
  latestRunAt?: string;
  averageScore: number;
  feedbackCount: number;
  successRate: number;
  improvementNeeded: boolean;
}

export interface SkillRunStats {
  totalRuns: number;
  activeSkills: number;
  latestRun?: PromptAsset;
  topSkills: SkillRunSummary[];
  feedbackCount: number;
  improvementQueue: SkillRunSummary[];
}

export interface SkillFeedbackInsight {
  feedbackCount: number;
  averageRating: number;
  successRate: number;
  lowRatingCount: number;
  topFeedbackType?: string;
  latestComments: string[];
  recommendations: string[];
  status: "collect_feedback" | "improve" | "healthy";
}

function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

function compactTitle(input: string) {
  const compacted = input.replace(/\s+/g, " ").trim();

  if (compacted.length <= 34) {
    return compacted;
  }

  return `${compacted.slice(0, 34)}...`;
}

function getBestScore(prompt: PromptAsset) {
  return Math.max(...prompt.versions.map((version) => version.qualityScore));
}

function isSameSkillRun(prompt: PromptAsset, skill: PromptSkill) {
  if (prompt.sourceSkillId) {
    return prompt.sourceSkillId === skill.id;
  }

  return (
    prompt.goal === "스킬 실행" &&
    (prompt.sourceSkillName === skill.name ||
      prompt.title.startsWith(`${skill.name} · 실행`))
  );
}

export function isSkillRunPrompt(prompt: PromptAsset) {
  return prompt.goal === "스킬 실행" || Boolean(prompt.sourceSkillId);
}

export function listSkillRuns(prompts: PromptAsset[], skill?: PromptSkill) {
  return prompts
    .filter((prompt) =>
      skill ? isSameSkillRun(prompt, skill) : isSkillRunPrompt(prompt),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

function getTopFeedbackType(runs: PromptAsset[]) {
  const counts = runs
    .flatMap((prompt) => prompt.feedback)
    .reduce<Record<string, number>>((acc, feedback) => {
      acc[feedback.feedbackType] = (acc[feedback.feedbackType] ?? 0) + 1;
      return acc;
    }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function recommendationForFeedbackType(type?: string) {
  switch (type) {
    case "format":
      return "출력 형식 섹션에 예시 구조와 필수 항목을 더 명확히 고정합니다.";
    case "tone":
      return "사용자/회사 톤 기준을 스킬 템플릿 상단의 제약 조건에 더 강하게 반영합니다.";
    case "context":
      return "입력 가이드에 배경, 대상, 원문, 반드시 반영할 조건을 분리해서 받도록 보강합니다.";
    case "accuracy":
      return "불확실성 처리와 확인 필요 항목을 출력 형식에 별도 섹션으로 고정합니다.";
    case "company_rule":
      return "회사 내부 용어, 금지 표현, 브랜드 톤을 스킬 템플릿의 품질 기준에 추가합니다.";
    default:
      return "최근 코멘트를 기준으로 체크리스트와 출력 형식을 한 번 더 구체화합니다.";
  }
}

export function getSkillLanguageStrategy(
  skill: PromptSkill,
): PromptLanguageStrategy {
  return skill.languageStrategy ?? "hybrid";
}

export function getSkillOutputLanguage(skill: PromptSkill): PromptOutputLanguage {
  return skill.outputLanguage ?? "korean";
}

function outputLanguageGuidance(outputLanguage: PromptOutputLanguage) {
  switch (outputLanguage) {
    case "english":
      return "The target AI's final answer must be written in English.";
    case "same_as_input":
      return "The target AI's final answer must match the user's current run input language.";
    default:
      return "The target AI's final answer must be written in Korean.";
  }
}

function languageGuidance(
  strategy: PromptLanguageStrategy,
  outputLanguage: PromptOutputLanguage,
) {
  if (strategy === "english") {
    return `Language strategy:
- Write the final executable prompt primarily in English.
- Preserve Korean proper nouns, internal terms, brand terms, and exact source wording when translation may distort meaning.
- ${outputLanguageGuidance(outputLanguage)}
- If a Korean term has no reliable English equivalent, keep it in Korean and explain it briefly.`;
  }

  return `Language strategy:
- Use English for role, objective, task instructions, constraints, output format, and quality criteria.
- Preserve Korean user context, company terms, brand tone, internal terms, and source wording where nuance matters.
- ${outputLanguageGuidance(outputLanguage)}
- Do not translate Korean brand/internal terms if translation may change their meaning.`;
}

export function getSkillFeedbackInsight(
  prompts: PromptAsset[],
  skill: PromptSkill,
): SkillFeedbackInsight {
  const runs = listSkillRuns(prompts, skill);
  const feedback = runs
    .flatMap((prompt) => prompt.feedback)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const feedbackCount = feedback.length;
  const positiveCount = feedback.filter((item) => item.rating >= 4).length;
  const lowRatingFeedback = feedback.filter((item) => item.rating <= 3);
  const averageRating =
    feedbackCount === 0
      ? 0
      : feedback.reduce((sum, item) => sum + item.rating, 0) / feedbackCount;
  const successRate =
    feedbackCount === 0 ? 0 : Math.round((positiveCount / feedbackCount) * 100);
  const topFeedbackType = getTopFeedbackType(runs);
  const latestComments = feedback.slice(0, 3).map((item) => item.comment);

  if (feedbackCount === 0) {
    return {
      feedbackCount,
      averageRating,
      successRate,
      lowRatingCount: 0,
      topFeedbackType,
      latestComments,
      status: "collect_feedback",
      recommendations: [
        "실행 프롬프트 결과에 최소 3개의 피드백을 남겨야 개선 판단이 안정적입니다.",
        "우선 출력 형식, 톤, 회사 기준 중 하나를 선택해 평가를 축적합니다.",
      ],
    };
  }

  if (averageRating < 4 || lowRatingFeedback.length > 0) {
    return {
      feedbackCount,
      averageRating,
      successRate,
      lowRatingCount: lowRatingFeedback.length,
      topFeedbackType,
      latestComments,
      status: "improve",
      recommendations: [
        recommendationForFeedbackType(topFeedbackType),
        lowRatingFeedback[0]
          ? `낮은 점수 코멘트 반영: ${lowRatingFeedback[0].comment}`
          : "낮은 점수 유형을 기준으로 스킬 템플릿을 보강합니다.",
      ],
    };
  }

  return {
    feedbackCount,
    averageRating,
    successRate,
    lowRatingCount: 0,
    topFeedbackType,
    latestComments,
    status: "healthy",
    recommendations: [
      "현재 성공률이 높습니다. 반복 사용 입력 예시를 1개 더 추가해 재현성을 높입니다.",
      "좋은 피드백 코멘트를 품질 체크리스트에 반영해 스킬 기준으로 고정합니다.",
    ],
  };
}

export function getSkillRunStats(
  prompts: PromptAsset[],
  skills: PromptSkill[],
): SkillRunStats {
  const allRuns = listSkillRuns(prompts);
  const topSkills = skills
    .map((skill) => {
      const runs = listSkillRuns(prompts, skill);
      const feedbackInsight = getSkillFeedbackInsight(prompts, skill);
      const averageScore =
        runs.length === 0
          ? 0
          : runs.reduce((sum, prompt) => sum + getBestScore(prompt), 0) /
            runs.length;

      return {
        skill,
        runCount: runs.length || skill.usageCount,
        latestRunAt: runs[0]?.createdAt ?? skill.lastRunAt,
        averageScore,
        feedbackCount: feedbackInsight.feedbackCount,
        successRate: feedbackInsight.successRate,
        improvementNeeded: feedbackInsight.status !== "healthy",
      };
    })
    .filter((item) => item.runCount > 0)
    .sort((a, b) => {
      if (b.runCount !== a.runCount) {
        return b.runCount - a.runCount;
      }

      return (
        new Date(b.latestRunAt ?? 0).getTime() -
        new Date(a.latestRunAt ?? 0).getTime()
      );
    })
    .slice(0, 5);

  return {
    totalRuns: allRuns.length,
    activeSkills: topSkills.length,
    latestRun: allRuns[0],
    topSkills,
    feedbackCount: allRuns.reduce(
      (sum, prompt) => sum + prompt.feedback.length,
      0,
    ),
    improvementQueue: topSkills
      .filter((item) => item.improvementNeeded)
      .sort((a, b) => {
        if (a.feedbackCount !== b.feedbackCount) {
          return a.feedbackCount - b.feedbackCount;
        }

        return a.successRate - b.successRate;
      }),
  };
}

export function buildSkillRunPrompt(skill: PromptSkill, runInput: string) {
  const languageStrategy = getSkillLanguageStrategy(skill);
  const outputLanguage = getSkillOutputLanguage(skill);
  const checklist = skill.qualityChecklist.length
    ? skill.qualityChecklist.map((item) => `- ${item}`).join("\n")
    : "- 역할, 목표, 입력, 제약 조건, 출력 형식이 분리되어 있는가";

  return `Role:
You are a senior prompt operator executing the "${skill.name}" skill for ${modelLabels[skill.targetModel]}.

Objective:
Combine the saved skill template with the current run input and produce a copy-ready prompt for ${modelLabels[skill.targetModel]}.

${languageGuidance(languageStrategy, outputLanguage)}

Skill metadata:
- Name: ${skill.name}
- Domain: ${skill.domain}
- Target AI: ${modelLabels[skill.targetModel]}
- Language strategy: ${languageStrategyLabels[languageStrategy]}
- Final answer language: ${outputLanguageLabels[outputLanguage]}

Skill description:
${skill.description || "설명 없음"}

Input guide:
${skill.inputGuide || "이번 작업의 배경, 원문 자료, 제약 조건을 명확히 반영한다."}

Skill template:
${skill.promptTemplate}

Current run input:
${runInput.trim()}

Task instructions:
1. Preserve the useful structure of the saved skill template.
2. Adapt the prompt to the actual context, material, audience, and constraints in the current run input.
3. Do not invent missing information. Separate missing context into assumptions, questions, or verification-needed notes.
4. Produce the final prompt as something the user can paste directly into ${modelLabels[skill.targetModel]}.
5. Keep the prompt aligned with the selected language strategy.

Constraints:
- Do not assert unverified facts, numbers, customer names, performance claims, or sensitive judgments.
- If the current run input conflicts with the saved template, prioritize the current run input.
- Mark ambiguity as assumptions or clarification questions.
- Keep company terms, banned expressions, and brand tone constraints from the template.

Output format:
${skill.outputFormat || "최종 프롬프트, 가정, 확인 질문, 품질 체크리스트"}

Quality checklist:
${checklist}`;
}

export function createPromptFromSkillRun(
  skill: PromptSkill,
  runInput: string,
): PromptAsset {
  const now = new Date().toISOString();
  const languageStrategy = getSkillLanguageStrategy(skill);
  const outputLanguage = getSkillOutputLanguage(skill);
  const content = buildSkillRunPrompt(skill, runInput);
  const { qualityScore, scoreBreakdown } = scorePrompt(content, skill.targetModel);
  const version: PromptVersion = {
    id: makeId("version"),
    targetModel: skill.targetModel,
    modelLabel: modelLabels[skill.targetModel],
    content,
    qualityScore,
    scoreBreakdown,
    assumptions: [
      "저장된 스킬 템플릿을 기반으로 생성됨",
      skill.languageDecision
        ? `언어 판단 이유: ${skill.languageDecision.reason}`
        : `${languageStrategyLabels[languageStrategy]} 언어 전략을 적용함`,
      `${languageStrategyLabels[languageStrategy]} 언어 전략을 적용함`,
      `최종 답변 언어는 ${outputLanguageLabels[outputLanguage]}로 설정함`,
    ],
    missingContext: runInput.trim()
      ? []
      : ["이번 실행 입력이 비어 있으면 실제 자료가 필요함"],
    createdAt: now,
  };

  return {
    id: makeId("prompt"),
    title: `${skill.name} · 실행 · ${compactTitle(runInput) || "입력 없음"}`,
    source: "local",
    languageStrategy,
    languageDecision: skill.languageDecision,
    outputLanguage,
    sourceSkillId: skill.id,
    sourceSkillName: skill.name,
    rawInput: runInput,
    goal: "스킬 실행",
    domain: skill.domain,
    targetModels: [skill.targetModel],
    versions: [version],
    feedback: [],
    createdAt: now,
    updatedAt: now,
  };
}
