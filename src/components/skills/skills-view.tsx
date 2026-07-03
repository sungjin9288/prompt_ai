"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui";
import {
  ContextOperatingFlow,
  type ContextOperatingFlowItem,
} from "@/components/context/context-operating-flow";
import {
  decidePromptLanguageStrategy,
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  type PromptAsset,
  type PromptSkill,
} from "@/lib/prompt";
import {
  useCompanyProfileStore,
  useLearningMemoriesStore,
  usePromptAssetsStore,
  usePromptSkillsStore,
} from "@/lib/data/workspace-store";
import { formatAbsoluteInternalHref } from "@/lib/navigation/href";
import {
  createSkillFromPrompt,
  getBestVersion,
  getSkillCandidates,
} from "@/lib/skills/skill-builder";
import { buildSkillImprovementPlan } from "@/lib/skills/skill-improver";
import {
  buildSkillRunPrompt,
  createPromptFromSkillRun,
  getSkillLanguageStrategy,
  getSkillOutputLanguage,
  getSkillFeedbackInsight,
  getSkillRunStats,
  listSkillRuns,
} from "@/lib/skills/skill-runner";
import { writeStudioDraft } from "@/lib/studio/draft";
import { getStudioDraftDisplaySourceLabel } from "@/lib/studio/draft-display";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import { emptySkill, feedbackStatusLabel } from "@/lib/skills-view/labels";
import {
  buildPromptLibraryHref,
  buildSkillHref,
  buildSkillRunLibraryHref,
} from "@/lib/skills-view/hrefs";
import {
  buildSkillImprovementPlanCopyBody,
  buildSkillImprovementPlanStudioPrompt,
  buildSkillRunLibraryLinkCopyBody,
  buildSkillsOperationalSummaryReportText,
  buildSkillsOperationalSummaryStudioPrompt,
} from "@/lib/skills-view/report-text";
import type { SkillManualCopy } from "./skills-view-types";
import { SkillsCandidatesPanel } from "./skills-candidates-panel";
import { SkillsOperationsPanel } from "./skills-operations-panel";
import { SkillsSavedListPanel } from "./skills-saved-list-panel";
import { SkillsTemplatePanel } from "./skills-template-panel";

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

  function resetSkillDraft() {
    setDraft(emptySkill());
    setSelectedPromptId("");
    setCopied(false);
    setSaved(false);
    setImprovementNotice("");
    setImprovementPlanCopied(false);
    setManualCopy(null);
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
          <SkillsCandidatesPanel
            candidates={candidates}
            selectedPromptId={selectedPromptId}
            loadFromPrompt={loadFromPrompt}
          />

          <SkillsOperationsPanel
            skillRunStats={skillRunStats}
            skillOperationalSummaryItems={skillOperationalSummaryItems}
            skillExecutionWorkflowSteps={skillExecutionWorkflowSteps}
            operationsReportCopied={operationsReportCopied}
            latestRunLibraryLinkCopied={latestRunLibraryLinkCopied}
            manualCopy={manualCopy}
            setManualCopy={setManualCopy}
            copySkillsOperationalSummaryReport={copySkillsOperationalSummaryReport}
            openSkillsOperationalSummaryInStudio={
              openSkillsOperationalSummaryInStudio
            }
            openLatestSkillRunInLibrary={openLatestSkillRunInLibrary}
            copyLatestSkillRunLibraryLink={copyLatestSkillRunLibraryLink}
            editSkillById={editSkillById}
          />

          <SkillsSavedListPanel
            query={query}
            setQuery={setQuery}
            filteredSkills={filteredSkills}
            editSkill={editSkill}
          />
        </div>

        <SkillsTemplatePanel
          selectedPrompt={selectedPrompt}
          selectedPromptBestVersion={selectedPromptBestVersion}
          selectedPromptStudioSourceDisplay={selectedPromptStudioSourceDisplay}
          sourceLinkCopied={sourceLinkCopied}
          draft={draft}
          skillLanguageDecision={skillLanguageDecision}
          selectedSkillRuns={selectedSkillRuns}
          selectedFeedbackInsight={selectedFeedbackInsight}
          improvementPlan={improvementPlan}
          runInput={runInput}
          runPrompt={runPrompt}
          runCopied={runCopied}
          runNotice={runNotice}
          savedRunPrompt={savedRunPrompt}
          runLibraryLinkCopied={runLibraryLinkCopied}
          historyRunLibraryLinkCopiedId={historyRunLibraryLinkCopiedId}
          improvementPlanCopied={improvementPlanCopied}
          improvementNotice={improvementNotice}
          copied={copied}
          saved={saved}
          manualCopy={manualCopy}
          setManualCopy={setManualCopy}
          setRunInput={setRunInput}
          update={update}
          clearRunState={clearRunState}
          openSelectedPromptInLibrary={openSelectedPromptInLibrary}
          copySelectedPromptLibraryLink={copySelectedPromptLibraryLink}
          openSkillRunInLibrary={openSkillRunInLibrary}
          copySkillRunHistoryLibraryLink={copySkillRunHistoryLibraryLink}
          copyImprovementPlan={copyImprovementPlan}
          openImprovementPlanInStudio={openImprovementPlanInStudio}
          applyImprovementPlan={applyImprovementPlan}
          generateRunPrompt={generateRunPrompt}
          copyRunPrompt={copyRunPrompt}
          saveRunToLibrary={saveRunToLibrary}
          openSavedRunInLibrary={openSavedRunInLibrary}
          copySavedRunLibraryLink={copySavedRunLibraryLink}
          saveSkill={saveSkill}
          fillSavedSkillRunExample={fillSavedSkillRunExample}
          copyTemplate={copyTemplate}
          resetSkillDraft={resetSkillDraft}
        />
      </div>
    </>
  );
}
