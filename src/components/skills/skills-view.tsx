"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Field,
  PageHeader,
  Panel,
  PanelHeader,
  ScoreBar,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
  textareaClass,
} from "@/components/ui";
import {
  ContextOperatingFlow,
  type ContextOperatingFlowItem,
} from "@/components/context/context-operating-flow";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import {
  decidePromptLanguageStrategy,
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  outputLanguages,
  type PromptAsset,
  type PromptOutputLanguage,
  type PromptSkill,
  type TargetModel,
} from "@/lib/prompt";
import {
  useCompanyProfileStore,
  useLearningMemoriesStore,
  usePromptAssetsStore,
  usePromptSkillsStore,
} from "@/lib/data/workspace-store";
import {
  formatAbsoluteInternalHref,
  normalizeInternalHref,
} from "@/lib/navigation/href";
import {
  createSkillFromPrompt,
  getBestVersion,
  getSkillCandidates,
} from "@/lib/skills/skill-builder";
import {
  buildSkillImprovementPlan,
  type SkillImprovementPlan,
} from "@/lib/skills/skill-improver";
import {
  buildSkillRunPrompt,
  createPromptFromSkillRun,
  getSkillLanguageStrategy,
  getSkillOutputLanguage,
  getSkillFeedbackInsight,
  getSkillRunStats,
  listSkillRuns,
  type SkillFeedbackInsight,
  type SkillRunStats,
} from "@/lib/skills/skill-runner";
import { writeStudioDraft } from "@/lib/studio/draft";
import { getStudioDraftDisplaySourceLabel } from "@/lib/studio/draft-display";
import { listToText, textToList } from "@/lib/storage/local-store";
import { copyTextToClipboard } from "@/lib/browser/clipboard";

type SkillManualCopy = {
  id:
    | "template"
    | "run"
    | "source-link"
    | "run-link"
    | "latest-run-link"
    | "run-history-link"
    | "improvement-plan"
    | "operations-report";
  targetId?: string;
  title: string;
  body: string;
  reason?: string;
};

function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

function emptySkill(): PromptSkill {
  const now = new Date().toISOString();

  return {
    id: makeId("skill"),
    name: "",
    description: "",
    domain: "범용",
    targetModel: "gpt",
    languageStrategy: "hybrid",
    outputLanguage: "korean",
    inputGuide: "",
    promptTemplate: "",
    outputFormat: "",
    qualityChecklist: [],
    tags: [],
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function formatTimestamp(value?: string) {
  if (!value) {
    return "아직 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function feedbackStatusLabel(status: "collect_feedback" | "improve" | "healthy") {
  switch (status) {
    case "healthy":
      return "안정";
    case "improve":
      return "개선 필요";
    default:
      return "피드백 수집";
  }
}

function buildSkillsRouteHref(
  pathname: "/library" | "/skills",
  params: URLSearchParams,
) {
  const query = params.toString();
  const href = query ? `${pathname}?${query}` : pathname;

  return normalizeInternalHref(href) ?? pathname;
}

function buildPromptLibraryHref(promptId: string, version?: TargetModel) {
  const params = new URLSearchParams({ prompt: promptId });

  if (version) {
    params.set("version", version);
  }

  return buildSkillsRouteHref("/library", params);
}

function buildSkillHref(skillId: string) {
  const params = new URLSearchParams({ skill: skillId });

  return buildSkillsRouteHref("/skills", params);
}

function buildSkillRunLibraryHref(prompt: PromptAsset) {
  return buildPromptLibraryHref(prompt.id, getBestVersion(prompt).targetModel);
}

function buildSkillRunLibraryLinkCopyBody({
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

function formatReportInternalHref(href: string, baseUrl?: string) {
  return formatAbsoluteInternalHref(href, baseUrl) ?? href;
}

function buildSkillsOperationalSummaryReportText({
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

function buildSkillsOperationalSummaryStudioPrompt({
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

function buildSkillImprovementPlanCopyBody({
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

function buildSkillImprovementPlanStudioPrompt({
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

export function SkillsView({
  initialPromptId,
  initialSkillId,
}: {
  initialPromptId?: string;
  initialSkillId?: string;
}) {
  const router = useRouter();
  const [companyProfile] = useCompanyProfileStore();
  const [prompts, setPrompts] = usePromptAssetsStore();
  const [memories] = useLearningMemoriesStore();
  const [skills, setSkills] = usePromptSkillsStore();
  const [draft, setDraft] = useState<PromptSkill>(() => emptySkill());
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [runInput, setRunInput] = useState("");
  const [runPrompt, setRunPrompt] = useState("");
  const [runCopied, setRunCopied] = useState(false);
  const [runNotice, setRunNotice] = useState("");
  const [improvementNotice, setImprovementNotice] = useState("");
  const [improvementPlanCopied, setImprovementPlanCopied] = useState(false);
  const [operationsReportCopied, setOperationsReportCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState<SkillManualCopy | null>(null);
  const [initialPromptLoaded, setInitialPromptLoaded] = useState(false);
  const [initialSkillLoaded, setInitialSkillLoaded] = useState(false);
  const [sourceLinkCopied, setSourceLinkCopied] = useState(false);
  const [savedRunPrompt, setSavedRunPrompt] = useState<PromptAsset | null>(null);
  const [runLibraryLinkCopied, setRunLibraryLinkCopied] = useState(false);
  const [latestRunLibraryLinkCopied, setLatestRunLibraryLinkCopied] =
    useState(false);
  const [historyRunLibraryLinkCopiedId, setHistoryRunLibraryLinkCopiedId] =
    useState("");

  const candidates = useMemo(() => getSkillCandidates(prompts), [prompts]);

  const filteredSkills = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return skills;
    }

    return skills.filter((skill) =>
      [
        skill.name,
        skill.description,
        skill.domain,
        languageStrategyLabels[getSkillLanguageStrategy(skill)],
        outputLanguageLabels[getSkillOutputLanguage(skill)],
        skill.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, skills]);

  const selectedPrompt = useMemo(
    () => prompts.find((prompt) => prompt.id === selectedPromptId),
    [prompts, selectedPromptId],
  );
  const selectedPromptBestVersion = useMemo(
    () => (selectedPrompt ? getBestVersion(selectedPrompt) : undefined),
    [selectedPrompt],
  );
  const selectedPromptStudioSourceDisplay = useMemo(() => {
    if (!selectedPrompt?.studioSource) {
      return null;
    }

    const label = getStudioDraftDisplaySourceLabel(
      selectedPrompt.studioSource,
    ).label;

    return {
      label,
      sourceTitle: selectedPrompt.studioSource.sourceTitle,
      sourceVariantLabel: selectedPrompt.studioSource.sourceVariant
        ? label
        : null,
    };
  }, [selectedPrompt]);
  const selectedPromptLibraryHref = selectedPrompt
    ? buildPromptLibraryHref(
        selectedPrompt.id,
        selectedPromptBestVersion?.targetModel,
      )
    : null;
  const savedRunPromptLibraryHref = savedRunPrompt
    ? buildPromptLibraryHref(
        savedRunPrompt.id,
        savedRunPrompt.versions[0]?.targetModel,
      )
    : null;
  const skillRunStats = useMemo(
    () => getSkillRunStats(prompts, skills),
    [prompts, skills],
  );
  const skillOperationalSummaryItems = [
    { label: "전체 실행", value: `${skillRunStats.totalRuns}개` },
    { label: "실행 스킬", value: `${skillRunStats.activeSkills}개` },
    { label: "피드백", value: `${skillRunStats.feedbackCount}개` },
    {
      label: "최근 실행",
      value: skillRunStats.latestRun
        ? skillRunStats.latestRun.title
        : "아직 없음",
    },
    { label: "반복 상위", value: `${skillRunStats.topSkills.length}개` },
    { label: "개선 큐", value: `${skillRunStats.improvementQueue.length}개` },
  ];
  const latestSkillRunLibraryHref = skillRunStats.latestRun
    ? buildPromptLibraryHref(
        skillRunStats.latestRun.id,
        skillRunStats.latestRun.versions[0]?.targetModel,
      )
    : null;
  const selectedSkillRuns = useMemo(
    () => listSkillRuns(prompts, draft).slice(0, 5),
    [draft, prompts],
  );
  const selectedFeedbackInsight = useMemo(
    () => getSkillFeedbackInsight(prompts, draft),
    [draft, prompts],
  );
  const improvementPlan = useMemo(
    () => buildSkillImprovementPlan(draft, selectedFeedbackInsight),
    [draft, selectedFeedbackInsight],
  );
  const skillLanguageDecision = useMemo(
    () =>
      decidePromptLanguageStrategy({
        rawInput: [
          draft.name,
          draft.description,
          draft.inputGuide,
          draft.promptTemplate,
          draft.outputFormat,
        ]
          .filter((item) => item.trim().length > 0)
          .join("\n"),
        goal: draft.description || draft.outputFormat || "스킬 실행",
        domain: draft.domain,
        targetModels: [draft.targetModel],
        companyProfile,
      }),
    [
      companyProfile,
      draft.description,
      draft.domain,
      draft.inputGuide,
      draft.name,
      draft.outputFormat,
      draft.promptTemplate,
      draft.targetModel,
    ],
  );
  const draftWithAutomaticLanguage = useMemo(
    () => ({
      ...draft,
      languageStrategy: skillLanguageDecision.strategy,
      languageDecision: skillLanguageDecision,
    }),
    [draft, skillLanguageDecision],
  );
  const skillsOperatingFlowItems = useMemo<ContextOperatingFlowItem[]>(
    () => [
      {
        actionLabel: "후보 확인",
        detail: selectedPrompt
          ? `${selectedPrompt.domain} · 피드백 ${selectedPrompt.feedback.length}개`
          : `추천 후보 ${candidates.length}개에서 시작합니다.`,
        href: "#skills-candidates",
        label: "원본",
        step: "01",
        title: selectedPrompt ? selectedPrompt.title : "스킬 후보 선택",
      },
      {
        actionLabel: "템플릿 편집",
        detail: `${modelLabels[draftWithAutomaticLanguage.targetModel]} · ${skillLanguageDecision.label} · 답변 ${outputLanguageLabels[getSkillOutputLanguage(draftWithAutomaticLanguage)]}`,
        href: "#skills-template",
        label: "템플릿",
        step: "02",
        title: draft.name.trim() || "스킬 이름 필요",
      },
      {
        actionLabel: "실행 영역으로 이동",
        detail: savedRunPrompt
          ? `최근 저장 · 품질 ${savedRunPrompt.versions[0]?.qualityScore.toFixed(1) ?? "-"}`
          : `현재 실행 이력 ${selectedSkillRuns.length || draft.usageCount}회`,
        href: "#skills-runner",
        label: "실행",
        step: "03",
        title: runPrompt ? "실행 프롬프트 준비" : "샘플 실행 필요",
      },
      {
        actionLabel: "운영 요약 확인",
        detail: `반복 상위 ${skillRunStats.topSkills.length}개 · 개선 큐 ${skillRunStats.improvementQueue.length}개`,
        href: "#skills-operations",
        label: "개선",
        step: "04",
        title: `전체 실행 ${skillRunStats.totalRuns}개`,
      },
    ],
    [
      candidates.length,
      draft.name,
      draft.usageCount,
      draftWithAutomaticLanguage,
      runPrompt,
      savedRunPrompt,
      selectedPrompt,
      selectedSkillRuns.length,
      skillLanguageDecision.label,
      skillRunStats.improvementQueue.length,
      skillRunStats.topSkills.length,
      skillRunStats.totalRuns,
    ],
  );
  const skillExecutionWorkflowSteps = useMemo(
    () => [
      {
        detail: draft.promptTemplate.trim()
          ? `${modelLabels[draftWithAutomaticLanguage.targetModel]} · ${skillLanguageDecision.label}`
          : "스킬 이름, 입력 가이드, 템플릿을 먼저 채웁니다.",
        label: "템플릿 확인",
        step: "01",
        title: draft.promptTemplate.trim() ? "템플릿 준비" : "템플릿 필요",
      },
      {
        detail: runPrompt
          ? "실행 프롬프트를 복사하거나 Library에 저장할 수 있습니다."
          : runInput.trim()
            ? "실행 프롬프트 생성으로 검증 문구를 확인합니다."
            : "실행 예시 입력을 채워 샘플 결과를 검증합니다.",
        label: "실행 검증",
        step: "02",
        title: runPrompt
          ? "프롬프트 생성됨"
          : runInput.trim()
            ? "입력 준비"
            : "실행 입력 필요",
      },
      {
        detail: savedRunPrompt
          ? `${savedRunPrompt.title} · Library 추적 가능`
          : `실행 이력 ${selectedSkillRuns.length}개 · ${feedbackStatusLabel(
              selectedFeedbackInsight.status,
            )}`,
        label: "운영 저장",
        step: "03",
        title: savedRunPrompt ? "Library 저장 완료" : "저장 후 피드백 수집",
      },
    ],
    [
      draft.promptTemplate,
      draftWithAutomaticLanguage.targetModel,
      runInput,
      runPrompt,
      savedRunPrompt,
      selectedFeedbackInsight.status,
      selectedSkillRuns.length,
      skillLanguageDecision.label,
    ],
  );

  function clearRunState(clearInput = false) {
    setRunPrompt("");
    setRunCopied(false);
    setRunNotice("");
    setManualCopy(null);
    setSourceLinkCopied(false);
    setSavedRunPrompt(null);
    setRunLibraryLinkCopied(false);

    if (clearInput) {
      setRunInput("");
    }
  }

  function update<K extends keyof PromptSkill>(key: K, value: PromptSkill[K]) {
    setSaved(false);
    setCopied(false);
    clearRunState();
    setImprovementNotice("");
    setImprovementPlanCopied(false);
    setOperationsReportCopied(false);
    setSourceLinkCopied(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function loadFromPrompt(promptId: string) {
    const prompt = prompts.find((item) => item.id === promptId);

    setSelectedPromptId(promptId);
    setCopied(false);
    setSaved(false);
    setImprovementNotice("");
    setImprovementPlanCopied(false);
    setOperationsReportCopied(false);
    setManualCopy(null);
    setSourceLinkCopied(false);
    clearRunState(true);

    if (!prompt) {
      return;
    }

    const version = getBestVersion(prompt);
    setDraft(createSkillFromPrompt(prompt, version, memories));
  }

  useEffect(() => {
    if (!initialPromptId || initialPromptLoaded) {
      return;
    }

    const prompt = prompts.find((item) => item.id === initialPromptId);

    if (!prompt) {
      return;
    }

    const version = getBestVersion(prompt);
    const nextDraft = createSkillFromPrompt(prompt, version, memories);
    const timeoutId = window.setTimeout(() => {
      setSelectedPromptId(initialPromptId);
      setCopied(false);
      setSaved(false);
      setImprovementNotice("");
      setImprovementPlanCopied(false);
      setOperationsReportCopied(false);
      setManualCopy(null);
      setSourceLinkCopied(false);
      setSavedRunPrompt(null);
      setRunLibraryLinkCopied(false);
      setRunPrompt("");
      setRunCopied(false);
      setRunNotice("");
      setRunInput("");
      setDraft(nextDraft);
      setInitialPromptLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialPromptId, initialPromptLoaded, memories, prompts]);

  useEffect(() => {
    if (
      !initialSkillId ||
      initialSkillLoaded ||
      initialPromptId ||
      initialPromptLoaded
    ) {
      return;
    }

    const skill = skills.find((item) => item.id === initialSkillId);

    if (!skill) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDraft(skill);
      setSelectedPromptId(skill.sourcePromptId ?? "");
      setCopied(false);
      setSaved(false);
      setImprovementNotice("");
      setImprovementPlanCopied(false);
      setOperationsReportCopied(false);
      setManualCopy(null);
      setSourceLinkCopied(false);
      setSavedRunPrompt(null);
      setRunLibraryLinkCopied(false);
      setRunPrompt("");
      setRunCopied(false);
      setRunNotice("");
      setRunInput("");
      setInitialSkillLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    initialPromptId,
    initialPromptLoaded,
    initialSkillId,
    initialSkillLoaded,
    skills,
  ]);

  function saveSkill() {
    if (!draft.name.trim() || !draft.promptTemplate.trim()) {
      return;
    }

    const now = new Date().toISOString();
    const nextSkill = {
      ...draftWithAutomaticLanguage,
      name: draft.name.trim(),
      languageStrategy: skillLanguageDecision.strategy,
      languageDecision: skillLanguageDecision,
      outputLanguage: getSkillOutputLanguage(draft),
      updatedAt: now,
    };

    setSkills((current) => {
      const exists = current.some((skill) => skill.id === nextSkill.id);

      if (exists) {
        return current.map((skill) =>
          skill.id === nextSkill.id ? nextSkill : skill,
        );
      }

      return [nextSkill, ...current];
    });
    setDraft(nextSkill);
    setSaved(true);
  }

  function fillSavedSkillRunExample() {
    const sourceInput = selectedPrompt?.rawInput.trim();
    const sourceExcerpt =
      sourceInput && sourceInput.length > 220
        ? `${sourceInput.slice(0, 220)}...`
        : sourceInput;
    const exampleInput = [
      `업무 상황: ${draft.domain} 관련 반복 작업을 이 스킬로 테스트합니다.`,
      `목표: ${draft.description || draft.name || "저장한 스킬의 목적에 맞는 결과물을 만든다."}`,
      sourceExcerpt ? `원본 참고: ${sourceExcerpt}` : null,
      "제약: 검증되지 않은 수치나 사실은 만들지 말고, 부족한 정보는 질문 또는 가정으로 분리합니다.",
      "원하는 출력: 핵심 요약, 실행 단계, 체크리스트, 다음 액션.",
    ]
      .filter(Boolean)
      .join("\n");

    setRunInput(exampleInput);
    setRunPrompt("");
    setRunCopied(false);
    setManualCopy(null);
    setRunNotice(
      "실행 예시 입력을 채웠습니다. 실행 프롬프트 생성을 눌러 결과를 확인하세요.",
    );
  }

  function editSkill(skill: PromptSkill) {
    setDraft(skill);
    setSelectedPromptId(skill.sourcePromptId ?? "");
    setCopied(false);
    setSaved(false);
    setImprovementNotice("");
    setImprovementPlanCopied(false);
    setOperationsReportCopied(false);
    setManualCopy(null);
    setSourceLinkCopied(false);
    clearRunState(true);
  }

  function openSelectedPromptInLibrary() {
    if (!selectedPromptLibraryHref) {
      return;
    }

    router.push(selectedPromptLibraryHref);
  }

  async function copySelectedPromptLibraryLink() {
    if (!selectedPromptLibraryHref) {
      return;
    }

    const linkText =
      typeof window === "undefined"
        ? selectedPromptLibraryHref
        : (formatAbsoluteInternalHref(
            selectedPromptLibraryHref,
            window.location.origin,
          ) ?? selectedPromptLibraryHref);
    const sourceLinkCopyBody = [
      linkText,
      "",
      selectedPrompt ? `- 원본 프롬프트: ${selectedPrompt.title}` : undefined,
      selectedPromptBestVersion
        ? `- 대상 AI: ${modelLabels[selectedPromptBestVersion.targetModel]}`
        : undefined,
      selectedPromptStudioSourceDisplay
        ? `- Studio 저장 출처: ${selectedPromptStudioSourceDisplay.label}`
        : undefined,
      selectedPromptStudioSourceDisplay?.sourceVariantLabel
        ? `- 세부 초안 유형: ${selectedPromptStudioSourceDisplay.sourceVariantLabel}`
        : undefined,
      selectedPromptStudioSourceDisplay?.sourceTitle
        ? `- 출처 제목: ${selectedPromptStudioSourceDisplay.sourceTitle}`
        : undefined,
      selectedPrompt
        ? `- 피드백: ${selectedPrompt.feedback.length}개`
        : undefined,
      `- 원본 경로: ${selectedPromptLibraryHref}`,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyTextToClipboard(linkText);

    setSourceLinkCopied(copiedToClipboard);
    setManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "source-link",
            title: "원본 Library 링크",
            body: sourceLinkCopyBody,
          },
    );
  }

  async function copyTemplate() {
    if (!draft.promptTemplate.trim()) {
      return;
    }

    const templateCopyBody = [
      `# 스킬 템플릿 · ${draft.name || "이름 없는 스킬"}`,
      "",
      `- 대상 AI: ${modelLabels[draftWithAutomaticLanguage.targetModel]}`,
      `- 언어 전략: ${
        languageStrategyLabels[getSkillLanguageStrategy(draftWithAutomaticLanguage)]
      }`,
      `- 답변 언어: ${
        outputLanguageLabels[getSkillOutputLanguage(draftWithAutomaticLanguage)]
      }`,
      draft.outputFormat.trim()
        ? `- 출력 형식: ${draft.outputFormat.trim()}`
        : undefined,
      draft.qualityChecklist.length
        ? `- 품질 체크리스트: ${draft.qualityChecklist.join(", ")}`
        : undefined,
      "",
      "## Template",
      draft.promptTemplate,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyTextToClipboard(draft.promptTemplate);

    setCopied(copiedToClipboard);
    setManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "template",
            title: "스킬 템플릿",
            body: templateCopyBody,
          },
    );
  }

  function generateRunPrompt() {
    if (!draft.promptTemplate.trim() || !runInput.trim()) {
      return;
    }

    setRunPrompt(buildSkillRunPrompt(draftWithAutomaticLanguage, runInput));
    setRunCopied(false);
    setManualCopy(null);
    setRunNotice("");
  }

  async function copyRunPrompt() {
    if (!runPrompt.trim()) {
      return;
    }

    const runPromptCopyBody = [
      `# 실행 프롬프트 · ${draft.name || "이름 없는 스킬"}`,
      "",
      `- 대상 AI: ${modelLabels[draftWithAutomaticLanguage.targetModel]}`,
      `- 언어 전략: ${
        languageStrategyLabels[getSkillLanguageStrategy(draftWithAutomaticLanguage)]
      }`,
      `- 답변 언어: ${
        outputLanguageLabels[getSkillOutputLanguage(draftWithAutomaticLanguage)]
      }`,
      runInput.trim()
        ? `- 실행 입력: ${
            runInput.trim().length > 300
              ? `${runInput.trim().slice(0, 300)}...`
              : runInput.trim()
          }`
        : undefined,
      "",
      "## Prompt",
      runPrompt,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyTextToClipboard(runPrompt);

    setRunCopied(copiedToClipboard);
    setManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "run",
            title: "실행 프롬프트",
            body: runPromptCopyBody,
          },
    );
  }

  function openSavedRunInLibrary() {
    if (!savedRunPromptLibraryHref) {
      return;
    }

    router.push(savedRunPromptLibraryHref);
  }

  function openLatestSkillRunInLibrary() {
    if (!latestSkillRunLibraryHref) {
      return;
    }

    router.push(latestSkillRunLibraryHref);
  }

  function openSkillRunInLibrary(prompt: PromptAsset) {
    router.push(buildSkillRunLibraryHref(prompt));
  }

  function editSkillById(skillId: string) {
    const skill = skills.find((item) => item.id === skillId);

    if (!skill) {
      return;
    }

    editSkill(skill);
  }

  async function copySavedRunLibraryLink() {
    if (!savedRunPromptLibraryHref || !savedRunPrompt) {
      return;
    }

    const linkText =
      typeof window === "undefined"
        ? savedRunPromptLibraryHref
        : (formatAbsoluteInternalHref(
            savedRunPromptLibraryHref,
            window.location.origin,
          ) ?? savedRunPromptLibraryHref);
    const runLinkCopyBody = buildSkillRunLibraryLinkCopyBody({
      linkText,
      prompt: savedRunPrompt,
      skillName: draft.name,
    });
    const copiedToClipboard = await copyTextToClipboard(linkText);

    setRunLibraryLinkCopied(copiedToClipboard);
    setManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "run-link",
            title: "실행 Library 링크",
            body: runLinkCopyBody,
          },
    );
  }

  async function copyLatestSkillRunLibraryLink() {
    if (!latestSkillRunLibraryHref || !skillRunStats.latestRun) {
      return;
    }

    const linkText =
      typeof window === "undefined"
        ? latestSkillRunLibraryHref
        : (formatAbsoluteInternalHref(
            latestSkillRunLibraryHref,
            window.location.origin,
          ) ?? latestSkillRunLibraryHref);
    const latestRunLinkCopyBody = buildSkillRunLibraryLinkCopyBody({
      linkText,
      prompt: skillRunStats.latestRun,
      skillName: skillRunStats.latestRun.sourceSkillName,
    });
    const copiedToClipboard = await copyTextToClipboard(linkText);

    setLatestRunLibraryLinkCopied(copiedToClipboard);
    setManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "latest-run-link",
            targetId: skillRunStats.latestRun.id,
            title: "최근 실행 Library 링크",
            body: latestRunLinkCopyBody,
          },
    );
  }

  async function copySkillRunHistoryLibraryLink(prompt: PromptAsset) {
    const runHref = buildSkillRunLibraryHref(prompt);
    const linkText =
      typeof window === "undefined"
        ? runHref
        : (formatAbsoluteInternalHref(runHref, window.location.origin) ??
          runHref);
    const runHistoryLinkCopyBody = buildSkillRunLibraryLinkCopyBody({
      linkText,
      prompt,
      skillName: prompt.sourceSkillName,
    });
    const copiedToClipboard = await copyTextToClipboard(linkText);

    setHistoryRunLibraryLinkCopiedId(copiedToClipboard ? prompt.id : "");
    setManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "run-history-link",
            targetId: prompt.id,
            title: "실행 이력 Library 링크",
            body: runHistoryLinkCopyBody,
          },
    );
  }

  async function copySkillsOperationalSummaryReport() {
    const reportText = buildSkillsOperationalSummaryReportText({
      baseUrl: typeof window === "undefined" ? undefined : window.location.origin,
      stats: skillRunStats,
    });
    const copiedToClipboard = await copyTextToClipboard(reportText);

    setOperationsReportCopied(copiedToClipboard);
    setManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "operations-report",
            title: "Skills 운영 요약 리포트",
            body: reportText,
          },
    );
  }

  function openSkillsOperationalSummaryInStudio() {
    const baseUrl =
      typeof window === "undefined" ? undefined : window.location.origin;
    const rawInput = buildSkillsOperationalSummaryStudioPrompt({
      baseUrl,
      stats: skillRunStats,
    });

    const wroteDraft = writeStudioDraft({
      source: "skills-operational-summary",
      rawInput,
      goal: "스킬 운영 개선 계획",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Skills 운영 요약 리포트",
      sourceHref: "/skills",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setOperationsReportCopied(false);
      setManualCopy({
        id: "operations-report",
        title: "Skills 운영 요약 리포트",
        body: rawInput,
        reason:
          "Studio 초안을 저장하지 못했습니다. 아래 운영 요약 원문을 직접 선택해 복사하세요.",
      });
      return;
    }

    router.push("/studio?draft=skills-operational-summary");
  }

  function saveRunToLibrary() {
    if (!draft.promptTemplate.trim() || !runInput.trim()) {
      return;
    }

    const runAt = new Date().toISOString();
    const asset = createPromptFromSkillRun(draftWithAutomaticLanguage, runInput);

    setPrompts((current) => [asset, ...current]);
    setSkills((current) =>
      current.map((skill) =>
        skill.id === draft.id
          ? {
              ...skill,
              languageStrategy: skillLanguageDecision.strategy,
              languageDecision: skillLanguageDecision,
              outputLanguage: getSkillOutputLanguage(draft),
              usageCount: skill.usageCount + 1,
              lastRunAt: runAt,
              updatedAt: runAt,
            }
          : skill,
      ),
    );
    setDraft((current) => ({
      ...current,
      languageStrategy: skillLanguageDecision.strategy,
      languageDecision: skillLanguageDecision,
      outputLanguage: getSkillOutputLanguage(draft),
      usageCount: current.usageCount + 1,
      lastRunAt: runAt,
      updatedAt: runAt,
    }));
    setRunPrompt(asset.versions[0].content);
    setSavedRunPrompt(asset);
    setRunLibraryLinkCopied(false);
    setLatestRunLibraryLinkCopied(false);
    setHistoryRunLibraryLinkCopiedId("");
    setManualCopy(null);
    setRunNotice("Library에 실행 프롬프트가 저장되었습니다.");
  }

  async function copyImprovementPlan() {
    const improvementPlanCopyBody = buildSkillImprovementPlanCopyBody({
      skill: draftWithAutomaticLanguage,
      insight: selectedFeedbackInsight,
      plan: improvementPlan,
    });
    const copiedToClipboard = await copyTextToClipboard(improvementPlanCopyBody);

    setImprovementPlanCopied(copiedToClipboard);
    setManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "improvement-plan",
            title: "스킬 개선 계획",
            body: improvementPlanCopyBody,
          },
    );
  }

  function openImprovementPlanInStudio() {
    const improvementPlanCopyBody = buildSkillImprovementPlanCopyBody({
      skill: draftWithAutomaticLanguage,
      insight: selectedFeedbackInsight,
      plan: improvementPlan,
    });
    const rawInput = buildSkillImprovementPlanStudioPrompt({
      planText: improvementPlanCopyBody,
      skill: draftWithAutomaticLanguage,
    });

    const wroteDraft = writeStudioDraft({
      source: "skills-improvement-plan",
      rawInput,
      goal: "스킬 템플릿 개선 계획",
      domain: draft.domain || "AI operations",
      targetModels: [draftWithAutomaticLanguage.targetModel],
      outputLanguage: getSkillOutputLanguage(draftWithAutomaticLanguage),
      sourceTitle: `Skills 개선 계획 · ${draft.name || "이름 없는 스킬"}`,
      sourceHref: buildSkillHref(draft.id),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setImprovementPlanCopied(false);
      setManualCopy({
        id: "improvement-plan",
        title: "스킬 개선 계획",
        body: rawInput,
        reason:
          "Studio 초안을 저장하지 못했습니다. 아래 개선 계획 원문을 직접 선택해 복사하세요.",
      });
      return;
    }

    router.push("/studio?draft=skills-improvement-plan");
  }

  function applyImprovementPlan() {
    if (!improvementPlan.canApply) {
      return;
    }

    setDraft(improvementPlan.nextSkill);
    setSaved(false);
    setCopied(false);
    setImprovementPlanCopied(false);
    clearRunState();
    setImprovementNotice(
      "개선안이 템플릿에 반영되었습니다. 내용을 확인한 뒤 스킬 저장을 누르세요.",
    );
  }

  return (
    <>
      <PageHeader
        title="스킬 빌더"
        description="저장된 프롬프트와 학습 메모리를 반복 업무 템플릿으로 전환합니다."
      />

      <ContextOperatingFlow
        badge={draft.name.trim() ? "스킬 편집 중" : "스킬 선택 필요"}
        description="Skills는 좋은 프롬프트를 바로 자동화하지 않고 원본 확인, 템플릿 정리, 실행 저장, 운영 개선 순서로 반복 업무 자산을 만듭니다."
        items={skillsOperatingFlowItems}
        testId="skills-operating-flow"
        title="Skills 운영 흐름"
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Panel id="skills-candidates" className="scroll-mt-6">
            <PanelHeader
              title="스킬 후보"
              description="품질 점수와 피드백이 높은 프롬프트를 우선 추천합니다."
            />
            <div className="divide-y divide-line">
              {candidates.map(({ prompt, bestVersion, score }) => (
                <button
                  key={prompt.id}
                  type="button"
                  className={`block w-full px-5 py-4 text-left transition hover:bg-surface ${
                    selectedPromptId === prompt.id ? "bg-panel-strong" : ""
                  }`}
                  onClick={() => loadFromPrompt(prompt.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-sm font-semibold">{prompt.title}</p>
                    <span className="font-mono text-sm text-accent">
                      {score.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {prompt.domain} · {bestVersion.modelLabel} ·{" "}
                    {languageStrategyLabels[prompt.languageStrategy ?? "hybrid"]} ·
                    답변 {outputLanguageLabels[prompt.outputLanguage ?? "korean"]} ·
                    피드백 {prompt.feedback.length}개
                  </p>
                </button>
              ))}

              {candidates.length === 0 ? (
                <div className="px-5 py-10 text-sm leading-6 text-muted">
                  아직 후보가 없습니다. Studio에서 프롬프트를 생성하고 Library에 저장하세요.
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel id="skills-operations" className="scroll-mt-6">
            <PanelHeader
              title="스킬 운영 요약"
              description="Library에 저장된 실행 프롬프트를 기준으로 반복 사용 성과를 집계합니다."
            />
            <div className="space-y-4 p-5">
              <div
                data-testid="skills-operational-metrics"
                className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3"
              >
                {skillOperationalSummaryItems.map((item) => (
                  <div
                    className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
                    key={item.label}
                  >
                    <p className="text-muted">{item.label}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-accent">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="grid gap-3 text-xs md:grid-cols-3"
                data-testid="skills-execution-readiness-workflow"
              >
                {skillExecutionWorkflowSteps.map((item) => (
                  <div
                    className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
                    key={item.step}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-panel-strong font-mono text-xs text-soft">
                        {item.step}
                      </span>
                      <p className="font-semibold text-soft">{item.label}</p>
                    </div>
                    <p className="mt-3 break-words text-sm font-semibold text-accent">
                      {item.title}
                    </p>
                    <p className="mt-2 break-words leading-5 text-muted">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className={secondaryButtonClass}
                  type="button"
                  onClick={copySkillsOperationalSummaryReport}
                >
                  {operationsReportCopied
                    ? "운영 리포트 복사됨"
                    : manualCopy?.id === "operations-report"
                      ? "운영 리포트 복사 실패"
                      : "운영 리포트 복사"}
                </button>
                <button
                  className={secondaryButtonClass}
                  type="button"
                  onClick={openSkillsOperationalSummaryInStudio}
                >
                  리포트 Studio로 보내기
                </button>
              </div>
              {manualCopy?.id === "operations-report" ? (
                <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                  copy={manualCopy}
                  onClose={() => setManualCopy(null)}
                />
              ) : null}

              {skillRunStats.latestRun ? (
                <div className="rounded-md border border-line bg-surface px-3 py-3">
                  <p className="text-xs font-semibold text-soft">최근 실행</p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold text-soft">
                    {skillRunStats.latestRun.title}
                  </p>
                  {skillRunStats.latestRun.sourceSkillName ? (
                    <p className="mt-1 text-xs font-medium text-accent">
                      스킬 · {skillRunStats.latestRun.sourceSkillName}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {formatTimestamp(skillRunStats.latestRun.createdAt)} · 품질{" "}
                    {getBestVersion(skillRunStats.latestRun).qualityScore.toFixed(1)} ·
                    피드백 {skillRunStats.latestRun.feedback.length}개
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      className={secondaryButtonClass}
                      type="button"
                      onClick={openLatestSkillRunInLibrary}
                    >
                      최근 실행 Library 보기
                    </button>
                    <button
                      className={secondaryButtonClass}
                      type="button"
                      onClick={copyLatestSkillRunLibraryLink}
                      data-testid="skills-latest-run-link-copy"
                    >
                      {latestRunLibraryLinkCopied
                        ? "최근 실행 링크 복사됨"
                        : manualCopy?.id === "latest-run-link"
                          ? "최근 실행 링크 복사 실패"
                          : "최근 실행 링크 복사"}
                    </button>
                  </div>
                  {manualCopy?.id === "latest-run-link" ? (
                    <div className="mt-3">
                      <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                        copy={manualCopy}
                        onClose={() => setManualCopy(null)}
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="rounded-md border border-line bg-surface px-3 py-3 text-xs leading-5 text-muted">
                  아직 저장된 스킬 실행 프롬프트가 없습니다. 스킬 실행 후
                  Library에 저장하면 운영 요약이 채워집니다.
                </p>
              )}

              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">반복 사용 상위 스킬</p>
                  <p className="text-xs text-muted">
                    {skillRunStats.topSkills.length}개
                  </p>
                </div>
                <div className="mt-3 divide-y divide-line rounded-md border border-line bg-surface">
                  {skillRunStats.topSkills.map((item) => (
                    <button
                      key={item.skill.id}
                      type="button"
                      className="block w-full px-3 py-3 text-left transition hover:bg-panel"
                      onClick={() => editSkillById(item.skill.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-xs font-semibold text-soft">
                          {item.skill.name}
                        </p>
                        <span className="shrink-0 font-mono text-xs text-accent">
                          {item.runCount}회
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        평균 품질{" "}
                        {item.averageScore ? item.averageScore.toFixed(1) : "-"} ·
                        성공률 {item.feedbackCount ? `${item.successRate}%` : "-"} ·
                        최근 {formatTimestamp(item.latestRunAt)}
                      </p>
                    </button>
                  ))}

                  {skillRunStats.topSkills.length === 0 ? (
                    <p className="px-3 py-3 text-xs leading-5 text-muted">
                      반복 사용 순위는 실행 프롬프트를 Library에 저장한 뒤 표시됩니다.
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">개선 필요 큐</p>
                  <p className="text-xs text-muted">
                    {skillRunStats.improvementQueue.length}개
                  </p>
                </div>
                <div className="mt-3 space-y-2">
                  {skillRunStats.improvementQueue.slice(0, 3).map((item) => (
                    <button
                      key={item.skill.id}
                      type="button"
                      className="block w-full rounded-md border border-line bg-surface px-3 py-3 text-left transition hover:bg-panel"
                      onClick={() => editSkillById(item.skill.id)}
                    >
                      <p className="line-clamp-2 text-xs font-semibold text-soft">
                        {item.skill.name}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        피드백 {item.feedbackCount}개 · 성공률{" "}
                        {item.feedbackCount ? `${item.successRate}%` : "-"} ·
                        개선 추천 확인
                      </p>
                    </button>
                  ))}

                  {skillRunStats.improvementQueue.length === 0 ? (
                    <p className="rounded-md border border-line bg-surface px-3 py-3 text-xs leading-5 text-muted">
                      현재 개선 큐가 비어 있습니다. 실행 결과에 피드백이 쌓이면
                      우선순위를 자동 계산합니다.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="저장된 스킬"
              description="반복 업무 템플릿으로 재사용할 수 있는 스킬입니다."
            />
            <div className="border-b border-line p-4">
              <input
                className={inputClass}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="스킬 검색"
              />
            </div>
            <div className="max-h-[420px] overflow-auto">
              {filteredSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  className="block w-full border-b border-line px-5 py-4 text-left transition hover:bg-surface"
                  onClick={() => editSkill(skill)}
                >
                  <p className="text-sm font-semibold">{skill.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                    {skill.description}
                  </p>
                  <p className="mt-2 text-xs text-accent">
                    {skill.domain} · {modelLabels[skill.targetModel]} ·{" "}
                    {languageStrategyLabels[getSkillLanguageStrategy(skill)]} · 사용{" "}
                    {skill.usageCount}회 · 답변{" "}
                    {outputLanguageLabels[getSkillOutputLanguage(skill)]}
                    {skill.lastRunAt ? ` · ${formatTimestamp(skill.lastRunAt)}` : ""}
                  </p>
                </button>
              ))}
              {filteredSkills.length === 0 ? (
                <div className="px-5 py-10 text-sm text-muted">
                  저장된 스킬이 없습니다.
                </div>
              ) : null}
            </div>
          </Panel>
        </div>

        <Panel id="skills-template" className="min-h-[820px] scroll-mt-6">
          <PanelHeader
            title="스킬 템플릿"
            description={
              selectedPrompt
                ? `${selectedPrompt.domain} 프롬프트를 기반으로 편집 중`
                : "후보를 선택하거나 직접 스킬을 작성합니다."
            }
          />

          {selectedPrompt ? (
            <div className="border-b border-line px-5 py-4">
              <div className="rounded-md border border-accent/20 bg-panel px-4 py-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-accent">
                      원본 Library 프롬프트
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-soft">
                      {selectedPrompt.title}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      {selectedPrompt.domain} ·{" "}
                      {selectedPromptBestVersion?.modelLabel ?? "선택 버전"} ·
                      품질{" "}
                      {selectedPromptBestVersion
                        ? selectedPromptBestVersion.qualityScore.toFixed(1)
                        : "-"}{" "}
                      · 피드백 {selectedPrompt.feedback.length}개
                    </p>
                    {selectedPromptStudioSourceDisplay ? (
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Studio 저장 출처 ·{" "}
                        {selectedPromptStudioSourceDisplay.label}
                        {selectedPromptStudioSourceDisplay.sourceVariantLabel
                          ? ` · 세부 초안 유형 ${selectedPromptStudioSourceDisplay.sourceVariantLabel}`
                          : ""}
                      </p>
                    ) : null}
                    {selectedPromptStudioSourceDisplay?.sourceTitle ? (
                      <p className="mt-1 break-words text-xs leading-5 text-muted">
                        출처 제목 · {selectedPromptStudioSourceDisplay.sourceTitle}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                    <button
                      className={`${secondaryButtonClass} w-full sm:w-auto`}
                      type="button"
                      onClick={openSelectedPromptInLibrary}
                    >
                      Library 원본으로 돌아가기
                    </button>
                    <button
                      className={`${secondaryButtonClass} w-full sm:w-auto`}
                      type="button"
                      onClick={copySelectedPromptLibraryLink}
                    >
                      {sourceLinkCopied
                        ? "원본 링크 복사됨"
                        : manualCopy?.id === "source-link"
                          ? "원본 링크 복사 실패"
                          : "원본 링크 복사"}
                    </button>
                  </div>
                </div>
                {manualCopy?.id === "source-link" ? (
                  <div className="mt-3">
                    <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                      copy={manualCopy}
                      onClose={() => setManualCopy(null)}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-0 xl:grid-cols-[1fr_320px]">
            <div className="space-y-5 border-b border-line p-5 xl:border-b-0 xl:border-r">
              <div className="grid gap-4 lg:grid-cols-[1fr_150px_180px]">
                <Field label="스킬 이름">
                  <input
                    className={inputClass}
                    value={draft.name}
                    onChange={(event) => update("name", event.target.value)}
                    placeholder="예: IR 피치 정리"
                  />
                </Field>

                <Field label="대상 AI">
                  <select
                    className={selectClass}
                    value={draft.targetModel}
                    onChange={(event) =>
                      update("targetModel", event.target.value as TargetModel)
                    }
                  >
                    <option value="general">범용</option>
                    <option value="gpt">GPT</option>
                    <option value="claude">Claude</option>
                    <option value="codex">Codex</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </Field>

                <Field label="답변 언어">
                  <select
                    className={selectClass}
                    value={getSkillOutputLanguage(draft)}
                    onChange={(event) =>
                      update(
                        "outputLanguage",
                        event.target.value as PromptOutputLanguage,
                      )
                    }
                  >
                    {outputLanguages.map((item) => (
                      <option key={item} value={item}>
                        {outputLanguageLabels[item]}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="rounded-md border border-line bg-surface px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-accent">
                      AI 언어 판단 · {skillLanguageDecision.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      {skillLanguageDecision.reason}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-line bg-panel px-3 py-2 text-xs font-semibold text-soft">
                    자동 적용
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skillLanguageDecision.signals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
                    >
                      {signal}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="분야">
                  <input
                    className={inputClass}
                    value={draft.domain}
                    onChange={(event) => update("domain", event.target.value)}
                  />
                </Field>

                <Field label="태그" hint="줄바꿈 또는 쉼표로 구분">
                  <input
                    className={inputClass}
                    value={draft.tags.join(", ")}
                    onChange={(event) => update("tags", textToList(event.target.value))}
                  />
                </Field>
              </div>

              <Field label="설명">
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={draft.description}
                  onChange={(event) => update("description", event.target.value)}
                />
              </Field>

              <Field label="입력 가이드">
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={draft.inputGuide}
                  onChange={(event) => update("inputGuide", event.target.value)}
                />
              </Field>

              <Field label="프롬프트 템플릿">
                <textarea
                  className={`${textareaClass} min-h-[360px] font-mono text-[13px]`}
                  value={draft.promptTemplate}
                  onChange={(event) => update("promptTemplate", event.target.value)}
                />
              </Field>
            </div>

            <aside className="space-y-5 p-5">
              <div>
                <p className="mb-2 text-sm font-semibold">출력 형식</p>
                <textarea
                  className={textareaClass}
                  rows={5}
                  value={draft.outputFormat}
                  onChange={(event) => update("outputFormat", event.target.value)}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">품질 체크리스트</p>
                <textarea
                  className={textareaClass}
                  rows={7}
                  value={listToText(draft.qualityChecklist)}
                  onChange={(event) =>
                    update("qualityChecklist", textToList(event.target.value))
                  }
                />
              </div>

              <div className="space-y-3">
                <ScoreBar
                  label="템플릿 완성도"
                  value={
                    [
                      draft.name,
                      draft.description,
                      draft.inputGuide,
                      draft.promptTemplate,
                      draft.outputFormat,
                    ].filter((item) => item.trim()).length
                  }
                />
                <ScoreBar
                  label="체크리스트"
                  value={Math.min(5, draft.qualityChecklist.length)}
                />
              </div>

              <div
                id="skills-runner"
                className="scroll-mt-6 space-y-3 rounded-md border border-line bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">실행 이력</p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      현재 스킬에서 생성된 실행 프롬프트 기록입니다.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg font-semibold text-accent">
                      {selectedSkillRuns.length || draft.usageCount}
                    </p>
                    <p className="text-xs text-muted">회</p>
                  </div>
                </div>

                <div className="rounded-md border border-line bg-panel px-3 py-2 text-xs">
                  <p className="text-muted">언어 전략</p>
                  <p className="mt-1 font-semibold text-soft">
                    {skillLanguageDecision.label}
                  </p>
                  <p className="mt-2 leading-5 text-muted">
                    {skillLanguageDecision.reason}
                  </p>
                  <p className="mt-2 text-muted">답변 언어</p>
                  <p className="mt-1 font-semibold text-soft">
                    {outputLanguageLabels[getSkillOutputLanguage(draft)]}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted">최근 실행</p>
                    <p className="mt-1 font-medium">
                      {formatTimestamp(selectedSkillRuns[0]?.createdAt ?? draft.lastRunAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">평균 품질</p>
                    <p className="mt-1 font-mono font-medium">
                      {selectedSkillRuns.length
                        ? (
                            selectedSkillRuns.reduce(
                              (sum, prompt) =>
                                sum + getBestVersion(prompt).qualityScore,
                              0,
                            ) / selectedSkillRuns.length
                          ).toFixed(1)
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-line">
                  {selectedSkillRuns.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="py-3 transition hover:bg-panel"
                    >
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs font-medium">
                            {prompt.title}
                          </p>
                          {prompt.sourceSkillName ? (
                            <p className="mt-1 text-xs font-medium text-accent">
                              스킬 · {prompt.sourceSkillName}
                            </p>
                          ) : null}
                          <p className="mt-1 text-xs text-muted">
                            {formatTimestamp(prompt.createdAt)} ·{" "}
                            {languageStrategyLabels[prompt.languageStrategy ?? "hybrid"]} ·
                            답변{" "}
                            {outputLanguageLabels[prompt.outputLanguage ?? "korean"]} ·
                            품질 {getBestVersion(prompt).qualityScore.toFixed(1)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            className={secondaryButtonClass}
                            onClick={() => openSkillRunInLibrary(prompt)}
                          >
                            Library 보기
                          </button>
                          <button
                            type="button"
                            className={secondaryButtonClass}
                            onClick={() => copySkillRunHistoryLibraryLink(prompt)}
                            data-testid={`skills-run-history-link-copy-${prompt.id}`}
                          >
                            {historyRunLibraryLinkCopiedId === prompt.id
                              ? "링크 복사됨"
                              : manualCopy?.id === "run-history-link" &&
                                  manualCopy.targetId === prompt.id
                                ? "링크 복사 실패"
                                : "링크 복사"}
                          </button>
                        </div>
                      </div>
                      {manualCopy?.id === "run-history-link" &&
                      manualCopy.targetId === prompt.id ? (
                        <div className="mt-3">
                          <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                            copy={manualCopy}
                            onClose={() => setManualCopy(null)}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}

                  {selectedSkillRuns.length === 0 ? (
                    <p className="py-3 text-xs leading-5 text-muted">
                      아직 저장된 실행 이력이 없습니다. 아래에서 실행 프롬프트를
                      생성하고 Library에 저장하면 기록됩니다.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 rounded-md border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">성과와 개선 추천</p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      실행 프롬프트 피드백을 기준으로 스킬 개선 방향을 계산합니다.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 text-xs font-medium text-soft">
                    {feedbackStatusLabel(selectedFeedbackInsight.status)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted">성공률</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {selectedFeedbackInsight.feedbackCount
                        ? `${selectedFeedbackInsight.successRate}%`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">피드백</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {selectedFeedbackInsight.feedbackCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">평균 평가</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {selectedFeedbackInsight.feedbackCount
                        ? selectedFeedbackInsight.averageRating.toFixed(1)
                        : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-soft">추천 항목</p>
                  <ul className="space-y-2">
                    {selectedFeedbackInsight.recommendations.map((item) => (
                      <li key={item} className="text-xs leading-5 text-muted">
                        - {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedFeedbackInsight.latestComments.length ? (
                  <div className="border-t border-line pt-3">
                    <p className="mb-2 text-xs font-semibold text-soft">
                      최근 코멘트
                    </p>
                    <div className="space-y-2">
                      {selectedFeedbackInsight.latestComments.map((comment) => (
                        <p key={comment} className="text-xs leading-5 text-muted">
                          {comment}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="border-t border-line pt-3">
                  <p className="mb-2 text-xs font-semibold text-soft">
                    반영 예정 변경
                  </p>
                  <ul className="space-y-2">
                    {improvementPlan.changes.map((item) => (
                      <li key={item} className="text-xs leading-5 text-muted">
                        - {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <button
                      className={secondaryButtonClass}
                      type="button"
                      onClick={copyImprovementPlan}
                    >
                      {improvementPlanCopied
                        ? "개선 계획 복사됨"
                        : manualCopy?.id === "improvement-plan"
                          ? "개선 계획 복사 실패"
                          : "개선 계획 복사"}
                    </button>
                    <button
                      className={secondaryButtonClass}
                      type="button"
                      onClick={openImprovementPlanInStudio}
                    >
                      Studio로 보내기
                    </button>
                    <button
                      className={secondaryButtonClass}
                      type="button"
                      onClick={applyImprovementPlan}
                      disabled={!improvementPlan.canApply}
                    >
                      개선안 템플릿에 반영
                    </button>
                  </div>
                  {manualCopy?.id === "improvement-plan" ? (
                    <div className="mt-3">
                      <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                        copy={manualCopy}
                        onClose={() => setManualCopy(null)}
                      />
                    </div>
                  ) : null}
                  {improvementNotice ? (
                    <p className="mt-2 text-xs font-medium text-accent">
                      {improvementNotice}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 rounded-md border border-line bg-surface p-4">
                <div>
                  <p className="text-sm font-semibold">스킬 실행</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    이번 작업 자료를 넣어 실행용 프롬프트를 만들고 Library에 저장합니다.
                  </p>
                </div>
                <textarea
                  className={textareaClass}
                  rows={6}
                  value={runInput}
                  onChange={(event) => {
                    setRunInput(event.target.value);
                    clearRunState();
                  }}
                  placeholder="이번 실행에 넣을 실제 자료, 조건, 대상, 원하는 결과를 입력"
                />
                <button
                  className={secondaryButtonClass}
                  type="button"
                  onClick={generateRunPrompt}
                  disabled={!draft.promptTemplate.trim() || !runInput.trim()}
                >
                  실행 프롬프트 생성
                </button>

                {runPrompt ? (
                  <div className="space-y-3">
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-panel p-3 font-mono text-[12px] leading-5 text-muted">
                      {runPrompt}
                    </pre>
                    <div className="grid gap-2">
                      <button
                        className={secondaryButtonClass}
                        type="button"
                        onClick={copyRunPrompt}
                      >
                        {runCopied
                          ? "실행 프롬프트 복사됨"
                          : manualCopy?.id === "run"
                            ? "실행 프롬프트 복사 실패"
                            : "실행 프롬프트 복사"}
                      </button>
                      <button
                        className={primaryButtonClass}
                        type="button"
                        onClick={saveRunToLibrary}
                      >
                        Library에 저장
                      </button>
                    </div>
                    {manualCopy?.id === "run" ? (
                      <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                        copy={manualCopy}
                        onClose={() => setManualCopy(null)}
                      />
                    ) : null}
                  </div>
                ) : null}

                {runNotice ? (
                  <p className="text-xs font-medium text-accent">{runNotice}</p>
                ) : null}
                {savedRunPrompt ? (
                  <div className="rounded-md border border-accent/20 bg-panel px-4 py-3">
                    <p className="text-xs font-semibold text-soft">
                      실행 저장 완료
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-soft">
                      {savedRunPrompt.title}
                    </p>
                    <p className="mt-1 text-xs font-medium text-accent">
                      스킬 · {savedRunPrompt.sourceSkillName ?? draft.name}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      Library 상세에서 실행 프롬프트 품질, 피드백, 재개선
                      흐름을 이어서 확인할 수 있습니다. 품질{" "}
                      {savedRunPrompt.versions[0]?.qualityScore.toFixed(1) ?? "-"}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <button
                        className={secondaryButtonClass}
                        type="button"
                        onClick={openSavedRunInLibrary}
                      >
                        Library 실행 보기
                      </button>
                      <button
                        className={secondaryButtonClass}
                        type="button"
                        onClick={copySavedRunLibraryLink}
                      >
                        {runLibraryLinkCopied
                          ? "실행 링크 복사됨"
                          : manualCopy?.id === "run-link"
                            ? "실행 링크 복사 실패"
                            : "실행 링크 복사"}
                      </button>
                    </div>
                    {manualCopy?.id === "run-link" ? (
                      <div className="mt-3">
                        <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                          copy={manualCopy}
                          onClose={() => setManualCopy(null)}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-3">
                <button
                  className={primaryButtonClass}
                  type="button"
                  onClick={saveSkill}
                  disabled={!draft.name.trim() || !draft.promptTemplate.trim()}
                >
                  {saved ? "스킬 저장됨" : "스킬 저장"}
                </button>
                {saved ? (
                  <div className="rounded-md border border-accent/20 bg-panel px-4 py-3">
                    <p className="text-xs font-semibold text-soft">
                      저장 완료
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      반복 업무로 사용하기 전에 샘플 입력으로 실행 프롬프트를
                      한 번 검증하세요.
                    </p>
                    <button
                      className={`${secondaryButtonClass} mt-3 w-full`}
                      type="button"
                      onClick={fillSavedSkillRunExample}
                    >
                      실행 예시 채우기
                    </button>
                  </div>
                ) : null}
                <button
                  className={secondaryButtonClass}
                  type="button"
                  onClick={copyTemplate}
                  disabled={!draft.promptTemplate.trim()}
                >
                  {copied
                    ? "복사됨"
                    : manualCopy?.id === "template"
                      ? "템플릿 복사 실패"
                      : "템플릿 복사"}
                </button>
                {manualCopy?.id === "template" ? (
                  <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                    copy={manualCopy}
                    onClose={() => setManualCopy(null)}
                  />
                ) : null}
                <button
                  className={secondaryButtonClass}
                  type="button"
                  onClick={() => {
                    setDraft(emptySkill());
                    setSelectedPromptId("");
                    setCopied(false);
                    setSaved(false);
                    setImprovementNotice("");
                    setImprovementPlanCopied(false);
                    setManualCopy(null);
                    clearRunState(true);
                  }}
                >
                  새 스킬 직접 작성
                </button>
              </div>
            </aside>
          </div>
        </Panel>
      </div>
    </>
  );
}
