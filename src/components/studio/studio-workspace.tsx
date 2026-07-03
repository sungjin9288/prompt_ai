"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Field,
  PageHeader,
  Panel,
  PanelHeader,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import {
  ContextOperatingFlow,
  type ContextOperatingFlowItem,
} from "@/components/context/context-operating-flow";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import { StudioInputAnalysisPanel } from "@/components/studio/studio-input-analysis-panel";
import { StudioLoadedDraftPanel } from "@/components/studio/studio-loaded-draft-panel";
import { StudioDecisionControlsPanel } from "@/components/studio/studio-decision-controls-panel";
import { StudioResultInsightsPanel } from "@/components/studio/studio-result-insights-panel";
import type { StudioManualCopy } from "@/components/studio/studio-view-types";
import {
  TargetAiHandoffPreviewPanel,
  type HandoffPreviewMode,
} from "@/components/prompt/target-ai-handoff-preview-panel";
import {
  analyzePromptInputReadiness,
  buildMissingContextQuestionsText,
  buildPromptInputReadinessReportText,
  buildPromptQualityComparisonReportText,
  buildPromptQualityImprovementBrief,
  buildPromptQualityReportText,
  buildTargetAiHandoffImprovementBriefText,
  buildTargetAiHandoffPackageText,
  buildTargetAiHandoffReadinessItems,
  comparePromptQualityVersions,
  createPromptPackage,
  decidePromptLanguageStrategy,
  decideTargetModels,
  defaultDomains,
  defaultGoals,
  getPromptQualityInsights,
  modelLabels,
  outputLanguageLabels,
  type LearningMemory,
  type PromptImprovementSource,
  type PromptLearningContextMeta,
  type PromptOutputLanguage,
  type PromptAsset,
  type TargetAiHandoffReadinessStatus,
  type TargetModel,
} from "@/lib/prompt";
import {
  defaultStudioMemoryScopeSelection,
  useCompanyProfileStore,
  useLearningMemoriesStore,
  usePromptAssetsStore,
  usePromptSkillsStore,
  useStudioMemoryScopeStore,
  useUserProfileStore,
} from "@/lib/data/workspace-store";
import { formatAbsoluteInternalHref } from "@/lib/navigation/href";
import {
  getRecommendedOutputLanguage,
  summarizeOutputLanguagePerformance,
} from "@/lib/analytics/output-language";
import {
  clearStudioDraft,
  createImprovementSourceFromDraft,
  readStudioDraft,
} from "@/lib/studio/draft";
import { buildStudioDraftLoadedNotice, getStudioDraftDisplaySourceLabel } from "@/lib/studio/draft-display";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import { openExternalUrl } from "@/lib/browser/open-external-url";
import { getExternalAiTarget } from "@/lib/prompt/external-ai";
import {
  buildSavedPromptLibraryHref,
  buildSavedPromptSkillHref,
  buildSavedPromptStudioOperationalGroupHref,
  buildSavedPromptStudioPersistenceHref,
  buildSavedPromptStudioSourceHref,
  buildStudioDraftSourceHref,
  removeCompanyUpdatedSignalFromCurrentPath,
  removeProfileUpdatedSignalFromCurrentPath,
  replaceCurrentPathWithoutDraftRequest,
} from "@/lib/studio-view/hrefs";
import {
  focusRawInput,
  formatInputReadinessLabel,
  getDraftPersistenceMeta,
  getDraftSourceKindMeta,
  getLoadedDraftSourceLabel,
  summarizeDraftInput,
  type LoadedStudioDraftSummary,
} from "@/lib/studio-view/draft-summary";
import {
  collectLearningContext,
  collectRecentFeedback,
  disabledMemoryScopeSelection,
  filterLearningMemories,
  getDisabledMemoryScopeLabels,
  getEnabledMemoryScopeLabels,
  getPrioritizedLearningMemories,
  memoryScopeOptions,
} from "@/lib/studio-view/learning-memory";
import {
  attachImprovementSource,
  attachLearningContextMeta,
  attachStudioSourceMeta,
  formatImprovementDepthLabel,
  formatModelLabels,
  formatScoreDelta,
  getDraftQualityImprovementBaseline,
  getImprovementTitleDepth,
  getNextImprovementDepth,
  getSelectOptions,
  sameTargetModels,
  type QualityImprovementBaseline,
} from "@/lib/studio-view/generation";
import {
  buildRegenerationSaveDecisionReportSection,
  buildStudioLearningContextReportText,
  buildTargetAiReadinessComparisonReportSection,
  getRegenerationSaveDecision,
  regenerationSaveDecisionClassNames,
  summarizeTargetAiReadinessItems,
  targetAiReadinessStatusClassNames,
  targetAiReadinessStatusLabels,
  targetAiReadinessStatusOrder,
  type TargetAiReadinessComparison,
} from "@/lib/studio-view/reports";

interface GeneratePromptResponse {
  prompt?: PromptAsset;
  mode?: "local" | "openai";
  notice?: string;
  error?: string;
}

interface GenerationEngineStatus {
  configured: boolean;
  model: string | null;
  mode: "local" | "openai";
}

interface PendingRegenerationRecovery {
  activeModel: TargetModel;
  domain: string;
  goal: string;
  manualSelectedModels: TargetModel[] | null;
  outputLanguage: PromptOutputLanguage;
  qualityImprovementBaseline: QualityImprovementBaseline | null;
  rawInput: string;
  savedCurrent: boolean;
  targetAiPackagePreviewKey: string;
  targetAiPackagePreviewMode: HandoffPreviewMode;
}

const initialRawInput =
  "내가 만든 앱 아이디어를 투자자에게 설명할 수 있게 정리하고, 나중에 Codex로 개발할 수 있도록 기능 범위도 나눠줘.";
const qualityImprovementGoal = "프롬프트 개선";

export function StudioWorkspace({
  companyUpdated = false,
  profileUpdated = false,
}: {
  companyUpdated?: boolean;
  profileUpdated?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftRequest = searchParams.get("draft");
  const [userProfile] = useUserProfileStore();
  const [companyProfile] = useCompanyProfileStore();
  const [prompts, setPrompts] = usePromptAssetsStore();
  const [memories] = useLearningMemoriesStore();
  const [skills] = usePromptSkillsStore();
  const [rawInput, setRawInput] = useState(initialRawInput);
  const [goal, setGoal] = useState(defaultGoals[0]);
  const [domain, setDomain] = useState(defaultDomains[0]);
  const [outputLanguage, setOutputLanguage] =
    useState<PromptOutputLanguage>("korean");
  const [manualSelectedModels, setManualSelectedModels] =
    useState<TargetModel[] | null>(null);
  const [generated, setGenerated] = useState<PromptAsset | null>(null);
  const [activeModel, setActiveModel] = useState<TargetModel>("gpt");
  const [savedCurrent, setSavedCurrent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contextQuestionsCopied, setContextQuestionsCopied] = useState(false);
  const [qualityReportCopied, setQualityReportCopied] = useState(false);
  const [targetAiPackageCopied, setTargetAiPackageCopied] = useState(false);
  const [targetAiImprovementBriefCopied, setTargetAiImprovementBriefCopied] =
    useState(false);
  const [targetAiPackagePreviewKey, setTargetAiPackagePreviewKey] =
    useState("");
  const [targetAiPackagePreviewMode, setTargetAiPackagePreviewMode] =
    useState<HandoffPreviewMode>("package");
  const [qualityComparisonCopied, setQualityComparisonCopied] = useState(false);
  const [learningContextReportCopied, setLearningContextReportCopied] =
    useState(false);
  const [inputAnalysisCopied, setInputAnalysisCopied] = useState(false);
  const [savedLibraryLinkCopied, setSavedLibraryLinkCopied] = useState(false);
  const [savedSkillLinkCopied, setSavedSkillLinkCopied] = useState(false);
  const [savedOperationalLinkCopiedKey, setSavedOperationalLinkCopiedKey] =
    useState("");
  const [studioManualCopy, setStudioManualCopy] =
    useState<StudioManualCopy | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationNotice, setGenerationNotice] = useState("");
  const [pendingRegenerationNotice, setPendingRegenerationNotice] =
    useState("");
  const [pendingRegenerationRecovery, setPendingRegenerationRecovery] =
    useState<PendingRegenerationRecovery | null>(null);
  const [loadedDraftSummary, setLoadedDraftSummary] =
    useState<LoadedStudioDraftSummary | null>(null);
  const [draftSourceForSave, setDraftSourceForSave] =
    useState<LoadedStudioDraftSummary | null>(null);
  const [sourceLinkCopied, setSourceLinkCopied] = useState(false);
  const [engineStatus, setEngineStatus] =
    useState<GenerationEngineStatus | null>(null);
  const [engineStatusFailed, setEngineStatusFailed] = useState(false);
  const [improvementSource, setImprovementSource] =
    useState<PromptImprovementSource | null>(null);
  const [qualityImprovementBaseline, setQualityImprovementBaseline] =
    useState<QualityImprovementBaseline | null>(null);
  const [companyUpdateNoticeVisible, setCompanyUpdateNoticeVisible] =
    useState(companyUpdated);
  const [profileUpdateNoticeVisible, setProfileUpdateNoticeVisible] =
    useState(profileUpdated);
  const [storedMemoryScopes, setStoredMemoryScopes] =
    useStudioMemoryScopeStore();
  const enabledMemoryScopes = useMemo(
    () => ({
      ...defaultStudioMemoryScopeSelection,
      ...storedMemoryScopes,
    }),
    [storedMemoryScopes],
  );

  const activeVersion = useMemo(
    () =>
      generated?.versions.find((version) => version.targetModel === activeModel) ??
      generated?.versions[0],
    [activeModel, generated],
  );
  const activeTargetAiPackageKey =
    generated && activeVersion ? `${generated.id}:${activeVersion.id}` : "";
  const targetAiPackagePreviewOpen =
    targetAiPackagePreviewKey === activeTargetAiPackageKey;
  const activeTargetAiHandoffPackageText = useMemo(
    () =>
      generated && activeVersion
        ? buildTargetAiHandoffPackageText({
            prompt: generated,
            version: activeVersion,
          })
        : "",
    [activeVersion, generated],
  );
  const activeTargetAiHandoffImprovementBriefText = useMemo(
    () =>
      generated && activeVersion
        ? buildTargetAiHandoffImprovementBriefText({
            prompt: generated,
            version: activeVersion,
          })
        : "",
    [activeVersion, generated],
  );
  const activeTargetAiHandoffReadinessItems = useMemo(
    () =>
      activeVersion
        ? buildTargetAiHandoffReadinessItems({ version: activeVersion })
        : [],
    [activeVersion],
  );

  const savedPromptLibraryHref =
    generated && savedCurrent
      ? buildSavedPromptLibraryHref(generated, activeVersion?.targetModel)
      : null;
  const savedPromptSkillHref =
    generated && savedCurrent ? buildSavedPromptSkillHref(generated) : null;
  const savedPromptStudioSourceHref =
    generated && savedCurrent ? buildSavedPromptStudioSourceHref(generated) : null;
  const savedPromptStudioPersistenceHref =
    generated && savedCurrent
      ? buildSavedPromptStudioPersistenceHref(generated)
      : null;
  const savedPromptStudioOperationalGroupHref =
    generated && savedCurrent
      ? buildSavedPromptStudioOperationalGroupHref(generated)
      : null;
  const targetModelDecision = useMemo(
    () =>
      decideTargetModels({
        rawInput,
        goal,
        domain,
      }),
    [domain, goal, rawInput],
  );
  const recommendedTargetModels = targetModelDecision.targetModels;
  const selectedModels = manualSelectedModels ?? recommendedTargetModels;
  const modelsTouched = manualSelectedModels !== null;
  const targetModelRecommendationApplied = sameTargetModels(
    selectedModels,
    recommendedTargetModels,
  );
  const targetModelSelectionSummaryItems = useMemo(
    () => [
      {
        label: "적용 상태",
        value: targetModelRecommendationApplied
          ? modelsTouched
            ? "추천과 동일"
            : "자동 추천 적용"
          : "수동 조정",
        detail: targetModelRecommendationApplied
          ? "현재 선택이 AI 추천과 일치"
          : "추천 적용으로 자동 추천값 복귀 가능",
      },
      {
        label: "추천 신뢰도",
        value: targetModelDecision.confidence === "strong" ? "높음" : "보통",
        detail: targetModelDecision.signals.join(" · "),
      },
      {
        label: "선택 도구",
        value: formatModelLabels(selectedModels),
        detail: `추천 ${formatModelLabels(recommendedTargetModels)}`,
      },
    ],
    [
      modelsTouched,
      recommendedTargetModels,
      selectedModels,
      targetModelDecision,
      targetModelRecommendationApplied,
    ],
  );
  const promptLanguageDecision = useMemo(
    () =>
      decidePromptLanguageStrategy({
        rawInput,
        goal,
        domain,
        targetModels: selectedModels,
        companyProfile,
      }),
    [companyProfile, domain, goal, rawInput, selectedModels],
  );
  const outputLanguageSummaries = useMemo(
    () => summarizeOutputLanguagePerformance(prompts, skills),
    [prompts, skills],
  );
  const recommendedOutputLanguage = useMemo(
    () => getRecommendedOutputLanguage(outputLanguageSummaries),
    [outputLanguageSummaries],
  );
  const goalOptions = useMemo(
    () => getSelectOptions(defaultGoals, goal),
    [goal],
  );
  const domainOptions = useMemo(
    () => getSelectOptions(defaultDomains, domain),
    [domain],
  );
  const improvementDraftDepth = useMemo(
    () => getNextImprovementDepth(improvementSource, prompts),
    [improvementSource, prompts],
  );
  const savePlanLabel = improvementSource
    ? formatImprovementDepthLabel(improvementDraftDepth)
    : draftSourceForSave
      ? getDraftPersistenceMeta(draftSourceForSave.source).label
      : "Library 저장본";
  const generatedImprovementDepth = generated?.improvementSource
    ? getImprovementTitleDepth(generated.title)
    : 0;
  const qualityInsights = useMemo(
    () => (activeVersion ? getPromptQualityInsights(activeVersion) : []),
    [activeVersion],
  );
  const qualityComparison = useMemo(() => {
    if (
      !activeVersion ||
      !qualityImprovementBaseline ||
      activeVersion.id === qualityImprovementBaseline.version.id ||
      activeVersion.targetModel !== qualityImprovementBaseline.version.targetModel
    ) {
      return null;
    }

    return comparePromptQualityVersions({
      current: activeVersion,
      previous: qualityImprovementBaseline.version,
    });
  }, [activeVersion, qualityImprovementBaseline]);
  const targetAiReadinessComparison = useMemo(() => {
    if (
      !activeVersion ||
      !qualityImprovementBaseline ||
      activeVersion.id === qualityImprovementBaseline.version.id ||
      activeVersion.targetModel !== qualityImprovementBaseline.version.targetModel
    ) {
      return null;
    }

    const current = summarizeTargetAiReadinessItems(
      buildTargetAiHandoffReadinessItems({ version: activeVersion }),
    );
    const previous = summarizeTargetAiReadinessItems(
      buildTargetAiHandoffReadinessItems({
        version: qualityImprovementBaseline.version,
      }),
    );

    return {
      current,
      deltas: {
        blocked: current.blocked - previous.blocked,
        ready: current.ready - previous.ready,
        review: current.review - previous.review,
      },
      previous,
    } satisfies TargetAiReadinessComparison;
  }, [activeVersion, qualityImprovementBaseline]);
  const activeTargetAiHandoffSummary = useMemo(() => {
    if (!activeVersion) {
      return null;
    }

    const readiness = summarizeTargetAiReadinessItems(
      activeTargetAiHandoffReadinessItems,
    );
    const priorityItem =
      activeTargetAiHandoffReadinessItems.find(
        (item) => item.status === "blocked",
      ) ??
      activeTargetAiHandoffReadinessItems.find(
        (item) => item.status === "review",
      ) ??
      activeTargetAiHandoffReadinessItems[0];
    const status: TargetAiHandoffReadinessStatus = readiness.blocked
      ? "blocked"
      : readiness.review
        ? "review"
        : "ready";
    const actionLabel =
      status === "blocked"
        ? "보강 브리프 적용"
        : status === "review"
          ? "검토 후 패키지 확인"
          : "AI 전달 패키지 실행";
    const detail =
      status === "blocked"
        ? "전달 전 차단 항목이 남아 있습니다. 보강 브리프를 적용해 새 결과를 만든 뒤 복사/저장하세요."
        : status === "review"
          ? "바로 테스트할 수 있지만, 검토 항목의 가정과 누락 맥락을 먼저 확인하세요."
          : "현재 버전은 외부 AI에 붙여넣을 실행 프롬프트와 검토 체크리스트가 준비됐습니다.";

    return {
      actionLabel,
      detail,
      priorityItem,
      readiness,
      status,
    };
  }, [activeTargetAiHandoffReadinessItems, activeVersion]);
  const activeTargetAiHandoffReviewQueue = useMemo(() => {
    if (!activeVersion) {
      return [];
    }

    return activeTargetAiHandoffReadinessItems
      .slice()
      .sort((first, second) => {
        const firstPriority =
          first.status === "blocked" ? 0 : first.status === "review" ? 1 : 2;
        const secondPriority =
          second.status === "blocked" ? 0 : second.status === "review" ? 1 : 2;

        return firstPriority - secondPriority;
      })
      .slice(0, 3)
      .map((item) => ({
        ...item,
        action:
          item.status === "blocked"
            ? "보강 브리프에 반영"
            : item.status === "review"
              ? "가정과 맥락 확인"
              : "실행 프롬프트로 전달",
      }));
  }, [activeTargetAiHandoffReadinessItems, activeVersion]);
  const regenerationSaveDecision = useMemo(
    () =>
      qualityComparison
        ? getRegenerationSaveDecision({
            qualityComparison,
            readinessComparison: targetAiReadinessComparison,
          })
        : null,
    [qualityComparison, targetAiReadinessComparison],
  );
  const externalHandoffBlockedByPendingRegeneration = Boolean(
    pendingRegenerationNotice,
  );
  const saveBlockedByPendingRegeneration =
    externalHandoffBlockedByPendingRegeneration;
  const generatedSaveOperationalSummary = useMemo(() => {
    if (!generated) {
      return null;
    }

    const persistenceLabel = generated.improvementSource
      ? "개선 체인"
      : draftSourceForSave
        ? getDraftPersistenceMeta(draftSourceForSave.source).label
        : "Studio 출처 없음";
    const sourceVariantLabel = draftSourceForSave?.sourceVariant
      ? getStudioDraftDisplaySourceLabel(draftSourceForSave).label
      : null;
    const sourceLabel = draftSourceForSave
      ? getStudioDraftDisplaySourceLabel(draftSourceForSave).label
      : "직접 Studio 생성";
    const sourceTitle = draftSourceForSave?.title ?? null;
    const libraryRecordLabel = generated.improvementSource
      ? formatImprovementDepthLabel(generatedImprovementDepth)
      : "Library 저장본";
    const generatedLearningContext = generated.learningContext;
    const learningScopeLabel = generatedLearningContext
      ? getEnabledMemoryScopeLabels(generatedLearningContext.enabledScopes).join(
          ", ",
        ) || "학습 메모리 제외"
      : "미기록";
    const learningEvidenceLabel = generatedLearningContext
      ? `scope ${learningScopeLabel} · 메모리 ${generatedLearningContext.appliedMemoryCount}개 · 피드백 ${generatedLearningContext.recentFeedbackCount}개`
      : "학습 컨텍스트 미기록";
    const learningMemoryTitleLabel =
      generatedLearningContext?.appliedMemoryTitles.length
        ? generatedLearningContext.appliedMemoryTitles.slice(0, 2).join(", ")
        : null;
    const actionKind = saveBlockedByPendingRegeneration
      ? "regenerate"
      : savedCurrent && savedPromptLibraryHref
        ? "open-library"
        : "save";
    const actionLabel =
      actionKind === "regenerate"
        ? "재생성 실행"
        : actionKind === "open-library"
          ? "Library에서 보기"
          : generated.improvementSource
            ? `${formatImprovementDepthLabel(generatedImprovementDepth)} 저장`
            : "라이브러리에 저장";
    const recoveryActionLabel =
      actionKind === "regenerate" && pendingRegenerationRecovery
        ? "이전 결과 유지"
        : null;
    const sourceActionLabel =
      savedCurrent && savedPromptStudioSourceHref
        ? sourceVariantLabel
          ? "세부 유형 출처 보기"
          : "저장 출처 보기"
        : null;
    const sourceActionDetail = sourceActionLabel
      ? sourceVariantLabel
        ? `Library에서 세부 초안 유형이 ${sourceVariantLabel}인 저장본을 확인합니다.`
        : `Library에서 저장 출처가 ${sourceLabel}인 저장본을 확인합니다.`
      : null;
    const sourceLinkCopyLabel = sourceVariantLabel
      ? "세부 유형 링크 복사"
      : "출처 링크 복사";
    const sourceLinkCopiedLabel = sourceVariantLabel
      ? "세부 유형 링크 복사됨"
      : "출처 링크 복사됨";
    const sourceLinkFailedLabel = sourceVariantLabel
      ? "세부 유형 링크 복사 실패"
      : "출처 링크 복사 실패";
    const sourceLinkTitle = sourceVariantLabel
      ? "세부 유형 출처 조건 링크"
      : "저장 출처 조건 링크";
    const persistenceActionLabel =
      savedCurrent && savedPromptStudioPersistenceHref
        ? "저장 방식으로 보기"
        : null;
    const groupActionLabel =
      savedCurrent && savedPromptStudioOperationalGroupHref
        ? sourceVariantLabel
          ? "세부 유형 묶음 보기"
          : "운영 묶음 보기"
        : null;
    const groupLinkCopyLabel = sourceVariantLabel
      ? "세부 묶음 링크 복사"
      : "묶음 링크 복사";
    const groupLinkCopiedLabel = sourceVariantLabel
      ? "세부 묶음 링크 복사됨"
      : "묶음 링크 복사됨";
    const groupLinkFailedLabel = sourceVariantLabel
      ? "세부 묶음 링크 복사 실패"
      : "묶음 링크 복사 실패";
    const groupLinkTitle = sourceVariantLabel
      ? "세부 유형 운영 묶음 조건 링크"
      : "운영 묶음 조건 링크";
    const statusLabel = saveBlockedByPendingRegeneration
      ? "재생성 필요"
      : savedCurrent
        ? "저장 완료"
        : "저장 가능";
    const detail = saveBlockedByPendingRegeneration
      ? "보강 브리프가 원문에 반영된 상태입니다. 새 결과를 생성한 뒤 저장하세요."
      : savedCurrent
        ? "현재 결과가 Library에 저장되어 상세 보기, 링크 복사, Skill 전환으로 이어갈 수 있습니다."
        : generated.improvementSource
          ? "저장하면 원본 Library 프롬프트의 다음 개선본으로 연결되어 품질 비교와 재개선 판단에 사용됩니다."
          : draftSourceForSave
            ? "저장하면 개선 체인이 아니라 Studio 저장 출처 메타로 보존되어 기능 흐름별 운영 이력에서 추적됩니다."
            : "저장하면 Studio에서 직접 만든 Library 프롬프트로 보존됩니다.";

    return {
      actionKind,
      actionLabel,
      detail,
      groupActionLabel,
      groupLinkCopiedLabel,
      groupLinkCopyLabel,
      groupLinkFailedLabel,
      groupLinkTitle,
      libraryRecordLabel,
      learningEvidenceLabel,
      learningMemoryTitleLabel,
      learningScopeLabel,
      persistenceActionLabel,
      persistenceLabel,
      recoveryActionLabel,
      sourceActionDetail,
      sourceActionLabel,
      sourceLabel,
      sourceLinkCopiedLabel,
      sourceLinkCopyLabel,
      sourceLinkFailedLabel,
      sourceLinkTitle,
      sourceTitle,
      sourceVariantLabel,
      statusLabel,
    };
  }, [
    draftSourceForSave,
    generated,
    generatedImprovementDepth,
    pendingRegenerationRecovery,
    saveBlockedByPendingRegeneration,
    savedCurrent,
    savedPromptLibraryHref,
    savedPromptStudioOperationalGroupHref,
    savedPromptStudioPersistenceHref,
    savedPromptStudioSourceHref,
  ]);
  const generatedResultWorkflowSteps = useMemo(() => {
    if (
      !generated ||
      !activeVersion ||
      !activeTargetAiHandoffSummary ||
      !generatedSaveOperationalSummary
    ) {
      return [];
    }

    return [
      {
        action: qualityInsights.length ? "품질 리포트 복사" : "현재 버전 복사",
        detail: qualityInsights.length
          ? "품질 진단과 현재 버전 본문을 먼저 확인하세요."
          : "현재 버전 본문과 사용 목적만 최종 확인하세요.",
        label: "검토",
        status: qualityInsights.length
          ? `${qualityInsights.length}개 진단`
          : "진단 없음",
      },
      {
        action: activeTargetAiHandoffSummary.actionLabel,
        detail: activeTargetAiHandoffSummary.priorityItem
          ? activeTargetAiHandoffSummary.priorityItem.label
          : activeTargetAiHandoffSummary.detail,
        label: "AI 전달",
        status: activeTargetAiHandoffSummary.actionLabel,
      },
      {
        action: generatedSaveOperationalSummary.actionLabel,
        detail: `${generatedSaveOperationalSummary.persistenceLabel} · ${generatedSaveOperationalSummary.sourceLabel}`,
        label: "저장",
        status: generatedSaveOperationalSummary.statusLabel,
      },
    ];
  }, [
    activeTargetAiHandoffSummary,
    activeVersion,
    generated,
    generatedSaveOperationalSummary,
    qualityInsights.length,
  ]);
  const generatedResultActionGroupSummaries = useMemo(() => {
    if (
      !generated ||
      !activeVersion ||
      !activeTargetAiHandoffSummary ||
      !generatedSaveOperationalSummary
    ) {
      return null;
    }

    return {
      handoff:
        activeTargetAiHandoffSummary.status === "blocked"
          ? "차단 항목이 있으면 패키지 전달보다 보강 브리프를 먼저 적용합니다."
          : activeTargetAiHandoffSummary.status === "review"
            ? "패키지를 열어 가정과 누락 맥락을 확인한 뒤 외부 AI로 보냅니다."
            : "실행 프롬프트나 전체 패키지 중 필요한 형태를 바로 복사합니다.",
      handoffBadge:
        targetAiReadinessStatusLabels[activeTargetAiHandoffSummary.status],
      review: qualityInsights.length
        ? `${qualityInsights.length}개 품질 진단을 확인한 뒤 본문이나 리포트를 복사합니다.`
        : "본문만 확인해도 되는 상태입니다. 필요하면 품질 리포트를 남깁니다.",
      reviewBadge: qualityInsights.length
        ? `${qualityInsights.length}개 진단`
        : "진단 없음",
      save: saveBlockedByPendingRegeneration
        ? "보강 브리프가 반영됐으므로 새 결과를 만든 뒤 저장합니다."
        : savedCurrent
          ? "이미 저장된 결과입니다. Library와 Skill 전환 링크로 이어갑니다."
          : `저장 방식은 ${generatedSaveOperationalSummary.persistenceLabel}이고, ${generatedSaveOperationalSummary.sourceLabel} 이력을 남깁니다.`,
      saveBadge: generatedSaveOperationalSummary.statusLabel,
    };
  }, [
    activeTargetAiHandoffSummary,
    activeVersion,
    generated,
    generatedSaveOperationalSummary,
    qualityInsights.length,
    saveBlockedByPendingRegeneration,
    savedCurrent,
  ]);
  const filteredLearningMemories = useMemo(
    () => filterLearningMemories(memories, enabledMemoryScopes),
    [enabledMemoryScopes, memories],
  );
  const appliedLearningMemories = useMemo(
    () => getPrioritizedLearningMemories(filteredLearningMemories),
    [filteredLearningMemories],
  );
  const learningMemoryScopeCounts = useMemo(
    () =>
      memoryScopeOptions.reduce(
        (result, item) => ({
          ...result,
          [item.scope]: memories.filter((memory) => memory.scope === item.scope)
            .length,
        }),
        {} as Record<LearningMemory["scope"], number>,
      ),
    [memories],
  );
  const appliedContextMemories = useMemo(
    () => getPrioritizedLearningMemories(filteredLearningMemories, 8),
    [filteredLearningMemories],
  );
  const learningContext = useMemo(
    () => collectLearningContext(prompts, filteredLearningMemories),
    [filteredLearningMemories, prompts],
  );
  const enabledMemoryScopeCount = useMemo(
    () => Object.values(enabledMemoryScopes).filter(Boolean).length,
    [enabledMemoryScopes],
  );
  const appliedFeedbackCount = useMemo(
    () => collectRecentFeedback(prompts).length,
    [prompts],
  );
  const learningContextSummaryItems = useMemo(() => {
    const enabledScopeLabels = getEnabledMemoryScopeLabels(enabledMemoryScopes);

    return [
      {
        label: "적용 scope",
        value: `${enabledMemoryScopeCount}/4`,
        detail: enabledScopeLabels.length
          ? enabledScopeLabels.join(", ")
          : "최근 피드백만 반영",
      },
      {
        label: "학습 메모리",
        value: `${appliedContextMemories.length}개`,
        detail:
          appliedContextMemories.length > 0
            ? "신뢰도와 최신순 기준으로 반영"
            : "적용 가능한 메모리 없음",
      },
      {
        label: "최근 피드백",
        value: `${appliedFeedbackCount}개`,
        detail:
          appliedFeedbackCount > 0
            ? "최근 실행 결과를 함께 반영"
            : "저장된 피드백 없음",
      },
    ];
  }, [
    appliedContextMemories.length,
    appliedFeedbackCount,
    enabledMemoryScopeCount,
    enabledMemoryScopes,
  ]);
  const learningContextWorkflowSteps = useMemo(() => {
    const enabledScopeLabels = getEnabledMemoryScopeLabels(enabledMemoryScopes);

    return [
      {
        detail: enabledScopeLabels.length
          ? enabledScopeLabels.join(", ")
          : "최근 피드백만 생성에 반영합니다.",
        label: "Scope 선택",
        step: "01",
        title: `${enabledMemoryScopeCount}/4 적용`,
      },
      {
        detail:
          appliedContextMemories.length > 0
            ? "신뢰도와 최신순으로 고른 메모리를 원문 해석에 붙입니다."
            : "Learning에서 수동 메모리나 피드백 규칙을 먼저 보강하세요.",
        label: "메모리 반영",
        step: "02",
        title: `${appliedContextMemories.length}개 사용`,
      },
      {
        detail:
          "생성 결과를 저장하면 적용 scope와 대표 메모리 제목이 Library에 남습니다.",
        label: "생성 저장",
        step: "03",
        title: savePlanLabel,
      },
    ];
  }, [
    appliedContextMemories.length,
    enabledMemoryScopeCount,
    enabledMemoryScopes,
    savePlanLabel,
  ]);
  const learningContextMeta = useMemo<PromptLearningContextMeta>(
    () => ({
      enabledScopes: enabledMemoryScopes,
      appliedMemoryCount: appliedContextMemories.length,
      recentFeedbackCount: appliedFeedbackCount,
      appliedMemoryIds: appliedContextMemories.map((memory) => memory.id),
      appliedMemoryTitles: appliedContextMemories.map((memory) => memory.title),
      appliedMemoryScopes: Array.from(
        new Set(appliedContextMemories.map((memory) => memory.scope)),
      ),
    }),
    [appliedContextMemories, appliedFeedbackCount, enabledMemoryScopes],
  );
  const generatedLearningContext = generated?.learningContext;
  const generatedEnabledScopeLabels = useMemo(
    () =>
      generatedLearningContext
        ? getEnabledMemoryScopeLabels(generatedLearningContext.enabledScopes)
        : [],
    [generatedLearningContext],
  );
  const generatedDisabledScopeLabels = useMemo(
    () =>
      generatedLearningContext
        ? getDisabledMemoryScopeLabels(generatedLearningContext.enabledScopes)
        : [],
    [generatedLearningContext],
  );
  const loadedDraftSource = loadedDraftSummary
    ? getLoadedDraftSourceLabel(loadedDraftSummary)
    : null;
  const loadedDraftPersistence = loadedDraftSummary
    ? getDraftPersistenceMeta(loadedDraftSummary.source)
    : null;
  const loadedDraftSourceKind = loadedDraftSummary
    ? getDraftSourceKindMeta(loadedDraftSummary.source)
    : null;
  const loadedDraftOperationalSummary = useMemo(() => {
    if (
      !loadedDraftSummary ||
      !loadedDraftSource ||
      !loadedDraftPersistence ||
      !loadedDraftSourceKind
    ) {
      return null;
    }

    const chainLabel = improvementSource
      ? formatImprovementDepthLabel(improvementDraftDepth)
      : loadedDraftPersistence.label === "개선 체인"
        ? "개선 체인 준비"
        : "운영 출처 저장";
    const saveExpectation = improvementSource
      ? "생성 결과를 저장하면 원본 Library 프롬프트의 다음 개선본으로 연결됩니다."
      : "생성 결과를 저장하면 개선 효과 계산이 아니라 출처별 운영 이력으로 보존됩니다.";

    return {
      actionLabel: "초안으로 생성",
      chainLabel,
      saveExpectation,
      sourceLinkCopiedLabel: loadedDraftSummary.sourceVariant
        ? "세부 유형 링크 복사됨"
        : "원본 링크 복사됨",
      sourceLinkCopyLabel: loadedDraftSummary.sourceVariant
        ? "세부 유형 링크 복사"
        : "원본 링크 복사",
      sourceLinkFailedLabel: loadedDraftSummary.sourceVariant
        ? "세부 유형 링크 복사 실패"
        : "원본 링크 복사 실패",
      sourceLinkTitle: loadedDraftSummary.sourceVariant
        ? "세부 유형 원본 조건 링크"
        : "원본 링크",
      sourceLabel: loadedDraftSourceKind.label,
      sourceNextAction: loadedDraftSource.nextAction,
      sourceVariantLabel: loadedDraftSummary.sourceVariant
        ? loadedDraftSource.label
        : null,
      persistenceLabel: loadedDraftPersistence.label,
    };
  }, [
    improvementDraftDepth,
    improvementSource,
    loadedDraftPersistence,
    loadedDraftSource,
    loadedDraftSourceKind,
    loadedDraftSummary,
  ]);
  const currentInputSummary = useMemo(
    () => summarizeDraftInput(rawInput),
    [rawInput],
  );
  const inputReadinessAnalysis = useMemo(
    () => analyzePromptInputReadiness({ domain, goal, rawInput }),
    [domain, goal, rawInput],
  );
  const missingQuestionCount = inputReadinessAnalysis.missingQuestions.length;
  const inputReadinessLabel = formatInputReadinessLabel({
    missingQuestionCount,
    score: inputReadinessAnalysis.score,
    statusLabel: inputReadinessAnalysis.statusLabel,
  });
  const inputReadinessQuestionBlockApplied = rawInput.includes(
    "추가로 답할 보강 질문:",
  );
  const languageDecisionSummaryItems = useMemo(
    () => [
      {
        label: "적용 방식",
        value: promptLanguageDecision.label,
        detail:
          promptLanguageDecision.strategy === "english"
            ? "지시 구조를 영어로 고정"
            : "영어 지시 구조와 한국어 맥락 보존",
      },
      {
        label: "판단 신뢰도",
        value:
          promptLanguageDecision.confidence === "strong" ? "높음" : "보통",
        detail: promptLanguageDecision.signals.join(" · "),
      },
      {
        label: "답변 언어",
        value: outputLanguageLabels[outputLanguage],
        detail: "프롬프트 작성 언어와 별도 설정",
      },
    ],
    [outputLanguage, promptLanguageDecision],
  );
  const studioPreparationSteps = useMemo(() => {
    const sourceLabel = loadedDraftSource?.label ?? "직접 입력";

    return [
      {
        label: "준비",
        value: rawInput.trim() ? inputReadinessLabel : "원문 필요",
        detail: rawInput.trim()
          ? `${currentInputSummary.inputLineCount}줄 · ${currentInputSummary.inputCharCount}자 · ${goal} · ${domain}`
          : `${goal} · ${domain}`,
      },
      {
        label: "생성",
        value: formatModelLabels(selectedModels),
        detail: `${promptLanguageDecision.label} · ${outputLanguageLabels[outputLanguage]}`,
      },
      {
        label: "학습",
        value: `메모리 ${appliedContextMemories.length}개`,
        detail: `최근 피드백 ${appliedFeedbackCount}개 · scope ${enabledMemoryScopeCount}/4`,
      },
      {
        label: "저장",
        value: savePlanLabel,
        detail: sourceLabel,
      },
    ];
  }, [
    appliedContextMemories.length,
    appliedFeedbackCount,
    currentInputSummary.inputCharCount,
    currentInputSummary.inputLineCount,
    domain,
    enabledMemoryScopeCount,
    goal,
    inputReadinessLabel,
    loadedDraftSource,
    outputLanguage,
    promptLanguageDecision.label,
    rawInput,
    savePlanLabel,
    selectedModels,
  ]);
  const nextGenerationSummary = useMemo(() => {
    const sourceLabel = loadedDraftSource?.label ?? "직접 입력";

    const hasPromptInput = Boolean(rawInput.trim());

    return {
      status: hasPromptInput ? inputReadinessAnalysis.statusLabel : "원문 필요",
      title: !hasPromptInput
        ? "원문을 입력하면 생성 기준이 완성됩니다."
        : inputReadinessAnalysis.status === "ready"
          ? "현재 기준으로 전문 프롬프트를 생성합니다."
          : inputReadinessAnalysis.status === "review"
            ? missingQuestionCount
              ? `남은 보강 질문 ${missingQuestionCount}개를 확인하면 결과가 더 안정됩니다.`
              : "보강 질문을 확인하면 결과가 더 안정됩니다."
            : "목적과 출력 형식을 보강한 뒤 생성하세요.",
      detail: `${promptLanguageDecision.label} · ${formatModelLabels(
        selectedModels,
      )} · ${outputLanguageLabels[outputLanguage]}`,
      evidence: `학습 메모리 ${appliedContextMemories.length}개 · 최근 피드백 ${appliedFeedbackCount}개 · 저장 ${savePlanLabel}`,
      savePlan: savePlanLabel,
      source: sourceLabel,
    };
  }, [
    appliedContextMemories.length,
    appliedFeedbackCount,
    missingQuestionCount,
    inputReadinessAnalysis.status,
    inputReadinessAnalysis.statusLabel,
    loadedDraftSource,
    outputLanguage,
    promptLanguageDecision.label,
    rawInput,
    savePlanLabel,
    selectedModels,
  ]);
  const nextGenerationMetricItems = [
    {
      label: "입력 품질",
      value: rawInput.trim() ? inputReadinessLabel : "원문 필요",
    },
    { label: "상태", value: nextGenerationSummary.status },
    { label: "프롬프트 언어", value: promptLanguageDecision.label },
    { label: "대상 AI", value: formatModelLabels(selectedModels) },
    {
      label: "학습 증거",
      value: `학습 ${appliedContextMemories.length} · 피드백 ${appliedFeedbackCount}`,
    },
  ];
  const nextGenerationChecklistItems = useMemo(
    () => [
      {
        detail: missingQuestionCount
          ? "질문을 원문에 붙이고 답을 채운 뒤 생성합니다."
          : rawInput.trim()
            ? "추가 보강 없이 현재 입력을 사용할 수 있습니다."
            : "원문을 입력하면 입력 분석이 시작됩니다.",
        label: "입력 보강",
        step: "01",
        value: missingQuestionCount
          ? `${missingQuestionCount}개 질문`
          : rawInput.trim()
            ? "확인됨"
            : "대기",
      },
      {
        detail: rawInput.trim()
          ? nextGenerationSummary.detail
          : "원문 입력 후 생성 버튼이 활성화됩니다.",
        label: "생성 실행",
        step: "02",
        value: rawInput.trim() ? nextGenerationSummary.status : "원문 필요",
      },
      {
        detail: `${nextGenerationSummary.source} 출처로 생성 후 Library에 기록합니다.`,
        label: "저장 추적",
        step: "03",
        value: nextGenerationSummary.savePlan,
      },
    ],
    [
      missingQuestionCount,
      nextGenerationSummary.detail,
      nextGenerationSummary.savePlan,
      nextGenerationSummary.source,
      nextGenerationSummary.status,
      rawInput,
    ],
  );
  const studioGenerationOperatingFlowItems =
    useMemo<ContextOperatingFlowItem[]>(
      () => [
        {
          actionLabel: "원문 확인",
          detail: rawInput.trim()
            ? `${currentInputSummary.inputLineCount}줄 · ${currentInputSummary.inputCharCount}자 · ${goal} · ${domain}`
            : "원문을 먼저 입력해야 생성 기준이 완성됩니다.",
          href: "#studio-raw-input",
          label: "입력",
          step: "01",
          title: rawInput.trim() ? inputReadinessLabel : "원문 필요",
        },
        {
          actionLabel: "판단 기준 확인",
          detail: `${formatModelLabels(selectedModels)} · ${outputLanguageLabels[outputLanguage]}`,
          href: "#studio-decision-controls",
          label: "AI 판단",
          step: "02",
          title: promptLanguageDecision.label,
        },
        {
          actionLabel: "학습 기준 확인",
          detail: `최근 피드백 ${appliedFeedbackCount}개 · scope ${enabledMemoryScopeCount}/4`,
          href: "#studio-learning-context",
          label: "컨텍스트",
          step: "03",
          title: `메모리 ${appliedContextMemories.length}개`,
        },
        {
          actionLabel: "생성 위치로 이동",
          detail: `${nextGenerationSummary.evidence} · 출처 ${nextGenerationSummary.source}`,
          href: "#studio-next-generation-action",
          label: "실행",
          step: "04",
          title: nextGenerationSummary.status,
        },
      ],
      [
        appliedContextMemories.length,
        appliedFeedbackCount,
        currentInputSummary.inputCharCount,
        currentInputSummary.inputLineCount,
        domain,
        enabledMemoryScopeCount,
        goal,
        inputReadinessLabel,
        nextGenerationSummary.evidence,
        nextGenerationSummary.source,
        nextGenerationSummary.status,
        outputLanguage,
        promptLanguageDecision.label,
        rawInput,
        selectedModels,
      ],
    );

  useEffect(() => {
    const draft = readStudioDraft();

    if (!draft) {
      if (draftRequest) {
        const timeout = window.setTimeout(() => {
          setGenerationNotice(
            "불러올 Studio 초안을 찾을 수 없습니다. 원본 화면에서 다시 Studio로 보내주세요.",
          );
          replaceCurrentPathWithoutDraftRequest();
        }, 0);

        return () => window.clearTimeout(timeout);
      }

      return;
    }

    const draftTargetModels = draft.targetModels.length
      ? draft.targetModels
      : (["gpt"] satisfies TargetModel[]);
    const draftImprovementSource = createImprovementSourceFromDraft(draft);
    const draftQualityImprovementBaseline =
      getDraftQualityImprovementBaseline(draft, prompts);

    const timeout = window.setTimeout(() => {
      setRawInput(draft.rawInput);
      setGoal(draft.goal);
      setDomain(draft.domain);
      setOutputLanguage(draft.outputLanguage);
      setManualSelectedModels(draftTargetModels);
      setImprovementSource(draftImprovementSource);
      setGenerated(null);
      setActiveModel(draftTargetModels[0] ?? "gpt");
      setSavedCurrent(false);
      setCopied(false);
      setContextQuestionsCopied(false);
      setQualityReportCopied(false);
      setTargetAiPackageCopied(false);
      setTargetAiImprovementBriefCopied(false);
      setQualityComparisonCopied(false);
      setLearningContextReportCopied(false);
      setInputAnalysisCopied(false);
      setStudioManualCopy(null);
      setQualityImprovementBaseline(draftQualityImprovementBaseline);
      setPendingRegenerationNotice("");
      setPendingRegenerationRecovery(null);
      setSourceLinkCopied(false);
      const nextDraftSummary: LoadedStudioDraftSummary = {
        source: draft.source,
        sourceVariant: draft.sourceVariant,
        sourceFeedback: draft.sourceFeedback,
        href: buildStudioDraftSourceHref(draft),
        ...summarizeDraftInput(draft.rawInput),
        title: draft.sourceTitle,
        createdAt: draft.createdAt,
      };

      setLoadedDraftSummary(nextDraftSummary);
      setDraftSourceForSave(nextDraftSummary);
      setGenerationNotice(buildStudioDraftLoadedNotice(draft));
      clearStudioDraft();
      replaceCurrentPathWithoutDraftRequest();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [draftRequest, prompts]);

  useEffect(() => {
    let cancelled = false;

    async function loadEngineStatus() {
      try {
        const response = await fetch("/api/generate-prompt/status");
        const status = (await response.json()) as GenerationEngineStatus;

        if (!cancelled) {
          setEngineStatus(status);
          setEngineStatusFailed(false);
        }
      } catch {
        if (!cancelled) {
          setEngineStatus(null);
          setEngineStatusFailed(true);
        }
      }
    }

    void loadEngineStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleModel(model: TargetModel) {
    setManualSelectedModels((current) => {
      const base = current ?? recommendedTargetModels;

      if (base.includes(model)) {
        return base.length === 1
          ? base
          : base.filter((item) => item !== model);
      }

      return [...base, model];
    });
  }

  function toggleMemoryScope(scope: LearningMemory["scope"]) {
    setStoredMemoryScopes((current) => ({
      ...defaultStudioMemoryScopeSelection,
      ...current,
      [scope]: !enabledMemoryScopes[scope],
    }));
  }

  function enableAllMemoryScopes() {
    setStoredMemoryScopes(defaultStudioMemoryScopeSelection);
  }

  function disableAllMemoryScopes() {
    setStoredMemoryScopes(disabledMemoryScopeSelection);
  }

  async function generatePrompt() {
    const request = {
      rawInput,
      goal,
      domain,
      targetModels: selectedModels,
      targetModelDecision: {
        ...targetModelDecision,
        targetModels: selectedModels,
      },
      languageStrategy: promptLanguageDecision.strategy,
      languageDecision: promptLanguageDecision,
      outputLanguage,
    };

    setIsGenerating(true);
    setGenerationNotice("");
    setPendingRegenerationNotice("");
    setPendingRegenerationRecovery(null);
    setLoadedDraftSummary(null);
    setSourceLinkCopied(false);

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request,
          userProfile,
          companyProfile,
          priorFeedback: learningContext,
        }),
      });

      const result = (await response.json()) as GeneratePromptResponse;

      if (!response.ok || !result.prompt) {
        throw new Error(result.error || "Prompt generation failed.");
      }

      const nextPrompt = attachImprovementSource(
        attachStudioSourceMeta(
          attachLearningContextMeta(result.prompt, learningContextMeta),
          draftSourceForSave,
        ),
        improvementSource,
        prompts,
      );

      setGenerated(nextPrompt);
      setActiveModel(nextPrompt.versions[0]?.targetModel ?? "general");
      setContextQuestionsCopied(false);
      setTargetAiPackageCopied(false);
      setTargetAiImprovementBriefCopied(false);
      setQualityComparisonCopied(false);
      setLearningContextReportCopied(false);
      setGenerationNotice(
        result.mode === "openai"
          ? result.notice || "OpenAI로 생성 품질을 보강했습니다."
          : result.notice || "로컬 프롬프트 빌더로 생성했습니다.",
      );
    } catch (error) {
      const fallback = createPromptPackage(
        request,
        userProfile,
        companyProfile,
        learningContext,
      );

      const fallbackPrompt = attachImprovementSource(
        attachStudioSourceMeta(
          attachLearningContextMeta(fallback, learningContextMeta),
          draftSourceForSave,
        ),
        improvementSource,
        prompts,
      );

      setGenerated(fallbackPrompt);
      setActiveModel(fallbackPrompt.versions[0]?.targetModel ?? "general");
      setContextQuestionsCopied(false);
      setTargetAiPackageCopied(false);
      setTargetAiImprovementBriefCopied(false);
      setQualityComparisonCopied(false);
      setLearningContextReportCopied(false);
      setGenerationNotice(
        error instanceof Error
          ? `API 호출 실패. 로컬 빌더로 생성했습니다. ${error.message}`
          : "API 호출 실패. 로컬 빌더로 생성했습니다.",
      );
    } finally {
      setSavedCurrent(false);
      setCopied(false);
      setContextQuestionsCopied(false);
      setQualityReportCopied(false);
      setTargetAiPackageCopied(false);
      setLearningContextReportCopied(false);
      setInputAnalysisCopied(false);
      setSavedLibraryLinkCopied(false);
      setStudioManualCopy(null);
      setIsGenerating(false);
    }
  }

  function clearCompanyUpdateNotice() {
    setCompanyUpdateNoticeVisible(false);
    router.replace(removeCompanyUpdatedSignalFromCurrentPath(), { scroll: false });
  }

  function clearProfileUpdateNotice() {
    setProfileUpdateNoticeVisible(false);
    router.replace(removeProfileUpdatedSignalFromCurrentPath(), { scroll: false });
  }

  async function generateWithCompanyContext() {
    await generatePrompt();
    clearCompanyUpdateNotice();
  }

  async function generateWithProfileContext() {
    await generatePrompt();
    clearProfileUpdateNotice();
  }

  function savePrompt() {
    if (!generated) {
      return;
    }

    if (saveBlockedByPendingRegeneration) {
      setGenerationNotice(
        "보강 브리프가 원문에 반영된 상태입니다. 새 결과를 생성한 뒤 저장하세요.",
      );
      return;
    }

    setPrompts((current) => [generated, ...current]);
    setSavedCurrent(true);
    setSavedLibraryLinkCopied(false);
    setSavedSkillLinkCopied(false);
    setSavedOperationalLinkCopiedKey("");
  }

  function openSavedPromptInLibrary() {
    if (!savedPromptLibraryHref) {
      return;
    }

    router.push(savedPromptLibraryHref);
  }

  async function runGeneratedSaveOperationalSummaryAction() {
    if (!generatedSaveOperationalSummary) {
      return;
    }

    if (generatedSaveOperationalSummary.actionKind === "regenerate") {
      await generatePrompt();
      return;
    }

    if (generatedSaveOperationalSummary.actionKind === "open-library") {
      openSavedPromptInLibrary();
      return;
    }

    savePrompt();
  }

  function openSavedPromptInSkills() {
    if (!savedPromptSkillHref) {
      return;
    }

    router.push(savedPromptSkillHref);
  }

  async function copySavedPromptSkillLink() {
    if (!savedPromptSkillHref) {
      return;
    }

    const linkText =
      typeof window === "undefined"
        ? savedPromptSkillHref
        : (formatAbsoluteInternalHref(
            savedPromptSkillHref,
            window.location.origin,
          ) ?? savedPromptSkillHref);
    const savedSkillLinkCopyBody = [
      linkText,
      "",
      generated ? `- 프롬프트: ${generated.title}` : undefined,
      activeVersion
        ? `- 대상 AI: ${modelLabels[activeVersion.targetModel]}`
        : undefined,
      generatedSaveOperationalSummary
        ? `- 저장 방식: ${generatedSaveOperationalSummary.persistenceLabel}`
        : undefined,
      generatedSaveOperationalSummary
        ? `- 저장 출처: ${generatedSaveOperationalSummary.sourceLabel}`
        : undefined,
      generatedSaveOperationalSummary?.sourceTitle
        ? `- 출처 제목: ${generatedSaveOperationalSummary.sourceTitle}`
        : undefined,
      generatedSaveOperationalSummary?.sourceVariantLabel
        ? `- 세부 초안 유형: ${generatedSaveOperationalSummary.sourceVariantLabel}`
        : undefined,
      generatedSaveOperationalSummary
        ? `- 학습 증거: ${generatedSaveOperationalSummary.learningEvidenceLabel}`
        : undefined,
      generatedSaveOperationalSummary?.learningMemoryTitleLabel
        ? `- 적용 메모리: ${generatedSaveOperationalSummary.learningMemoryTitleLabel}`
        : undefined,
      generatedSaveOperationalSummary
        ? `- Skill 전환: 저장 프롬프트를 스킬 템플릿 후보로 불러옵니다.`
        : undefined,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyTextToClipboard(linkText);

    setSavedSkillLinkCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "saved-skill-link",
            title: "Skill 전환 링크",
            body: savedSkillLinkCopyBody,
          },
    );
  }

  function openSavedPromptStudioSourceInLibrary() {
    if (!savedPromptStudioSourceHref) {
      return;
    }

    router.push(savedPromptStudioSourceHref);
  }

  function openSavedPromptStudioPersistenceInLibrary() {
    if (!savedPromptStudioPersistenceHref) {
      return;
    }

    router.push(savedPromptStudioPersistenceHref);
  }

  function openSavedPromptStudioOperationalGroupInLibrary() {
    if (!savedPromptStudioOperationalGroupHref) {
      return;
    }

    router.push(savedPromptStudioOperationalGroupHref);
  }

  async function copySavedPromptLibraryLink() {
    if (!savedPromptLibraryHref) {
      return;
    }

    const linkText =
      typeof window === "undefined"
        ? savedPromptLibraryHref
        : (formatAbsoluteInternalHref(
            savedPromptLibraryHref,
            window.location.origin,
          ) ?? savedPromptLibraryHref);
    const savedLibraryLinkCopyBody = [
      linkText,
      "",
      generated ? `- 프롬프트: ${generated.title}` : undefined,
      activeVersion
        ? `- 대상 AI: ${modelLabels[activeVersion.targetModel]}`
        : undefined,
      generatedSaveOperationalSummary
        ? `- 저장 방식: ${generatedSaveOperationalSummary.persistenceLabel}`
        : undefined,
      generatedSaveOperationalSummary
        ? `- 저장 출처: ${generatedSaveOperationalSummary.sourceLabel}`
        : undefined,
      generatedSaveOperationalSummary?.sourceTitle
        ? `- 출처 제목: ${generatedSaveOperationalSummary.sourceTitle}`
        : undefined,
      generatedSaveOperationalSummary?.sourceVariantLabel
        ? `- 세부 초안 유형: ${generatedSaveOperationalSummary.sourceVariantLabel}`
        : undefined,
      generatedSaveOperationalSummary
        ? `- 학습 증거: ${generatedSaveOperationalSummary.learningEvidenceLabel}`
        : undefined,
      generatedSaveOperationalSummary?.learningMemoryTitleLabel
        ? `- 적용 메모리: ${generatedSaveOperationalSummary.learningMemoryTitleLabel}`
        : undefined,
      generatedSaveOperationalSummary
        ? `- Library 기록: ${generatedSaveOperationalSummary.libraryRecordLabel}`
        : undefined,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyTextToClipboard(linkText);

    setSavedLibraryLinkCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "saved-library-link",
            title: "저장 프롬프트 링크",
            body: savedLibraryLinkCopyBody,
          },
    );
  }

  async function copySavedPromptOperationalLink({
    href,
    id,
    title,
  }: {
    href: string | null;
    id:
      | "saved-studio-source-link"
      | "saved-studio-persistence-link"
      | "saved-studio-operational-group-link";
    title: string;
  }) {
    if (!href) {
      return;
    }

    const linkText =
      typeof window === "undefined"
        ? href
        : (formatAbsoluteInternalHref(href, window.location.origin) ?? href);
    const operationalLinkCopyBody = [
      linkText,
      "",
      `- 조건: ${title}`,
      generatedSaveOperationalSummary
        ? `- 저장 방식: ${generatedSaveOperationalSummary.persistenceLabel}`
        : undefined,
      generatedSaveOperationalSummary
        ? `- 저장 출처: ${generatedSaveOperationalSummary.sourceLabel}`
        : undefined,
      generatedSaveOperationalSummary?.sourceTitle
        ? `- 출처 제목: ${generatedSaveOperationalSummary.sourceTitle}`
        : undefined,
      generatedSaveOperationalSummary?.sourceVariantLabel
        ? `- 세부 초안 유형: ${generatedSaveOperationalSummary.sourceVariantLabel}`
        : undefined,
      generatedSaveOperationalSummary
        ? `- 학습 증거: ${generatedSaveOperationalSummary.learningEvidenceLabel}`
        : undefined,
      generatedSaveOperationalSummary?.learningMemoryTitleLabel
        ? `- 적용 메모리: ${generatedSaveOperationalSummary.learningMemoryTitleLabel}`
        : undefined,
      generatedSaveOperationalSummary
        ? `- Library 기록: ${generatedSaveOperationalSummary.libraryRecordLabel}`
        : undefined,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyTextToClipboard(linkText);

    setSavedOperationalLinkCopiedKey(copiedToClipboard ? id : "");
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id,
            title,
            body: operationalLinkCopyBody,
          },
    );
  }

  async function copyLoadedDraftSourceLink() {
    if (!loadedDraftSummary) {
      return;
    }

    const linkText =
      typeof window === "undefined"
        ? loadedDraftSummary.href
        : (formatAbsoluteInternalHref(
            loadedDraftSummary.href,
            window.location.origin,
          ) ?? loadedDraftSummary.href);
    const sourceLinkCopyBody = [
      linkText,
      "",
      loadedDraftSummary.title
        ? `- 출처 제목: ${loadedDraftSummary.title}`
        : undefined,
      loadedDraftSourceKind
        ? `- Studio 저장 출처: ${loadedDraftSourceKind.label}`
        : undefined,
      loadedDraftSummary.sourceVariant && loadedDraftSource
        ? `- 세부 초안 유형: ${loadedDraftSource.label}`
        : undefined,
      `- 원본 경로: ${loadedDraftSummary.href}`,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyTextToClipboard(linkText);

    setSourceLinkCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "source-link",
            title:
              loadedDraftOperationalSummary?.sourceLinkTitle ?? "원본 링크",
            body: sourceLinkCopyBody,
          },
    );
  }

  async function copyPrompt(title = "현재 버전") {
    if (!activeVersion) {
      return;
    }

    if (externalHandoffBlockedByPendingRegeneration) {
      setGenerationNotice(
        "보강 브리프가 원문에 반영된 상태입니다. 새 결과를 생성한 뒤 복사하세요.",
      );
      return;
    }

    const copiedToClipboard = await copyTextToClipboard(activeVersion.content);

    setCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "prompt",
            title,
            body: activeVersion.content,
          },
    );
  }

  async function copyPromptAndOpenExternalAi() {
    if (!activeVersion) {
      return;
    }

    if (externalHandoffBlockedByPendingRegeneration) {
      setGenerationNotice(
        "보강 브리프가 원문에 반영된 상태입니다. 새 결과를 생성한 뒤 복사하세요.",
      );
      return;
    }

    const externalAiTarget = getExternalAiTarget(activeVersion.targetModel);
    const copiedToClipboard = await copyTextToClipboard(activeVersion.content);

    setCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "prompt",
            title: "현재 버전",
            body: activeVersion.content,
          },
    );

    if (copiedToClipboard) {
      openExternalUrl(externalAiTarget.url);
    }
  }

  async function copyQualityReport() {
    if (!generated || !activeVersion) {
      return;
    }

    const reportText = buildPromptQualityReportText({
      prompt: generated,
      version: activeVersion,
    });
    const copiedToClipboard = await copyTextToClipboard(reportText);

    setQualityReportCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "quality-report",
            title: "품질 리포트",
            body: reportText,
          },
    );
  }

  async function copyTargetAiHandoffPackage() {
    if (!generated || !activeVersion) {
      return;
    }

    if (externalHandoffBlockedByPendingRegeneration) {
      setGenerationNotice(
        "보강 브리프가 원문에 반영된 상태입니다. 새 결과를 생성한 뒤 AI 전달 패키지를 복사하세요.",
      );
      return;
    }

    const copiedToClipboard = await copyTextToClipboard(
      activeTargetAiHandoffPackageText,
    );

    setTargetAiPackageCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "target-ai-package",
            title: "AI 전달 패키지",
            body: activeTargetAiHandoffPackageText,
          },
    );
  }

  async function copyTargetAiHandoffImprovementBrief() {
    if (!generated || !activeVersion) {
      return;
    }

    const copiedToClipboard = await copyTextToClipboard(
      activeTargetAiHandoffImprovementBriefText,
    );

    setTargetAiImprovementBriefCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "target-ai-improvement-brief",
            title: "AI 전달 보강 브리프",
            body: activeTargetAiHandoffImprovementBriefText,
          },
    );
  }

  async function copyLearningContextReport() {
    if (!generated) {
      return;
    }

    const reportText = buildStudioLearningContextReportText(generated);
    const copiedToClipboard = await copyTextToClipboard(reportText);

    setLearningContextReportCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "learning-report",
            title: "학습 리포트",
            body: reportText,
          },
    );
  }

  async function copyMissingContextQuestions() {
    if (!generated || !activeVersion) {
      return;
    }

    const questionsText = buildMissingContextQuestionsText({
      prompt: generated,
      version: activeVersion,
    });
    const copiedToClipboard = await copyTextToClipboard(questionsText);

    setContextQuestionsCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "missing-context",
            title: "보강 질문",
            body: questionsText,
          },
    );
  }

  async function copyInputReadinessReport() {
    const reportText = buildPromptInputReadinessReportText({
      analysis: inputReadinessAnalysis,
      domain,
      goal,
      rawInput,
    });
    const copiedToClipboard = await copyTextToClipboard(reportText);

    setInputAnalysisCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "input-analysis",
            title: "입력 분석 리포트",
            body: reportText,
          },
    );
  }

  function applyInputReadinessQuestions() {
    if (!inputReadinessAnalysis.missingQuestions.length) {
      setGenerationNotice("현재 입력 분석에는 추가 보강 질문이 없습니다.");
      return;
    }

    if (inputReadinessQuestionBlockApplied) {
      setGenerationNotice(
        "이미 추가된 보강 질문에 답을 채운 뒤 다시 생성하세요.",
      );
      focusRawInput();
      return;
    }

    const questionBlock = [
      "",
      "추가로 답할 보강 질문:",
      ...inputReadinessAnalysis.missingQuestions.flatMap((question) => [
        `- ${question}`,
        "  답:",
      ]),
    ].join("\n");

    setRawInput((current) => `${current.trim()}${questionBlock}`);
    setInputAnalysisCopied(false);
    setStudioManualCopy((current) =>
      current?.id === "input-analysis" ? null : current,
    );
    setGenerationNotice(
      "입력 분석 보강 질문을 원문에 추가했습니다. 답을 채운 뒤 다시 생성하세요.",
    );
    focusRawInput();
  }

  async function copyQualityComparisonReport() {
    if (
      !generated ||
      !activeVersion ||
      !qualityImprovementBaseline ||
      !qualityComparison
    ) {
      return;
    }

    const baseReportText = buildPromptQualityComparisonReportText({
      comparison: qualityComparison,
      currentPrompt: generated,
      currentVersion: activeVersion,
      previousPrompt: qualityImprovementBaseline.prompt,
      previousVersion: qualityImprovementBaseline.version,
    });
    const reportText = [
      baseReportText,
      ...(targetAiReadinessComparison
        ? [
            buildTargetAiReadinessComparisonReportSection(
              targetAiReadinessComparison,
            ),
          ]
        : []),
      ...(regenerationSaveDecision
        ? [
            buildRegenerationSaveDecisionReportSection({
              decision: regenerationSaveDecision,
            }),
          ]
        : []),
    ].join("\n");
    const copiedToClipboard = await copyTextToClipboard(reportText);

    setQualityComparisonCopied(copiedToClipboard);
    setStudioManualCopy(
      copiedToClipboard
        ? null
        : {
            id: "quality-comparison",
            title: "비교 리포트",
            body: reportText,
          },
    );
  }

  function capturePendingRegenerationRecovery() {
    setPendingRegenerationRecovery(
      (current): PendingRegenerationRecovery =>
        current ?? {
          activeModel,
          domain,
          goal,
          manualSelectedModels,
          outputLanguage,
          qualityImprovementBaseline,
          rawInput,
          savedCurrent,
          targetAiPackagePreviewKey,
          targetAiPackagePreviewMode,
        },
    );
  }

  function keepPreviousGeneratedResult() {
    if (!pendingRegenerationRecovery) {
      return;
    }

    setRawInput(pendingRegenerationRecovery.rawInput);
    setGoal(pendingRegenerationRecovery.goal);
    setDomain(pendingRegenerationRecovery.domain);
    setOutputLanguage(pendingRegenerationRecovery.outputLanguage);
    setManualSelectedModels(pendingRegenerationRecovery.manualSelectedModels);
    setActiveModel(pendingRegenerationRecovery.activeModel);
    setSavedCurrent(pendingRegenerationRecovery.savedCurrent);
    setTargetAiPackagePreviewKey(
      pendingRegenerationRecovery.targetAiPackagePreviewKey,
    );
    setTargetAiPackagePreviewMode(
      pendingRegenerationRecovery.targetAiPackagePreviewMode,
    );
    setQualityImprovementBaseline(
      pendingRegenerationRecovery.qualityImprovementBaseline,
    );
    setPendingRegenerationNotice("");
    setPendingRegenerationRecovery(null);
    setCopied(false);
    setContextQuestionsCopied(false);
    setQualityReportCopied(false);
    setTargetAiPackageCopied(false);
    setTargetAiImprovementBriefCopied(false);
    setQualityComparisonCopied(false);
    setLearningContextReportCopied(false);
    setInputAnalysisCopied(false);
    setStudioManualCopy(null);
    setGenerationNotice(
      "이전 입력 상태로 복귀했습니다. 기존 생성 결과를 다시 복사하거나 저장할 수 있습니다.",
    );
  }

  function applyQualityImprovementBrief() {
    if (!generated || !activeVersion) {
      return;
    }

    capturePendingRegenerationRecovery();
    setRawInput(
      buildPromptQualityImprovementBrief({
        prompt: generated,
        version: activeVersion,
      }),
    );
    setQualityImprovementBaseline({
      appliedAt: new Date().toISOString(),
      prompt: generated,
      version: activeVersion,
    });
    setGoal(qualityImprovementGoal);
    setDomain(generated.domain);
    setManualSelectedModels([activeVersion.targetModel]);
    setActiveModel(activeVersion.targetModel);
    setSavedCurrent(false);
    setCopied(false);
    setContextQuestionsCopied(false);
    setQualityReportCopied(false);
    setTargetAiPackageCopied(false);
    setTargetAiImprovementBriefCopied(false);
    setQualityComparisonCopied(false);
    setLearningContextReportCopied(false);
    setGenerationNotice(
      "품질 진단 기반 재생성 입력을 원문에 반영했습니다. 내용을 확인하고 다시 생성하세요.",
    );
    setPendingRegenerationNotice(
      "품질 진단 기반 재생성 입력이 준비됐습니다. 아래 결과는 이전 버전입니다.",
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function applyTargetAiHandoffImprovementBrief() {
    if (!generated || !activeVersion) {
      return;
    }

    capturePendingRegenerationRecovery();
    setRawInput(activeTargetAiHandoffImprovementBriefText);
    setQualityImprovementBaseline({
      appliedAt: new Date().toISOString(),
      prompt: generated,
      version: activeVersion,
    });
    setGoal(qualityImprovementGoal);
    setDomain(generated.domain);
    setManualSelectedModels([activeVersion.targetModel]);
    setActiveModel(activeVersion.targetModel);
    setSavedCurrent(false);
    setCopied(false);
    setContextQuestionsCopied(false);
    setQualityReportCopied(false);
    setTargetAiPackageCopied(false);
    setTargetAiImprovementBriefCopied(false);
    setTargetAiPackagePreviewKey("");
    setQualityComparisonCopied(false);
    setLearningContextReportCopied(false);
    setInputAnalysisCopied(false);
    setStudioManualCopy(null);
    setGenerationNotice(
      "AI 전달 보강 브리프를 원문에 반영했습니다. 내용을 확인하고 다시 생성하세요.",
    );
    setPendingRegenerationNotice(
      "AI 전달 보강 브리프가 원문에 반영됐습니다. 아래 결과는 이전 버전입니다.",
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <PageHeader
        title="프롬프트 스튜디오"
        description="사용자 원문을 개인/회사/분야 맥락에 맞게 해석하고 영어 또는 한영 하이브리드 전문 프롬프트로 변환합니다."
      />

      {companyUpdateNoticeVisible ? (
        <div className="mb-5 rounded-md border border-line bg-surface px-4 py-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-soft">
                회사 기준이 업데이트됐습니다.
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                다시 생성하면 새 회사 설명, 제품/서비스, 고객군, 브랜드 톤이
                프롬프트에 반영됩니다.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                className={secondaryButtonClass}
                type="button"
                onClick={clearCompanyUpdateNotice}
              >
                알림 닫기
              </button>
              <button
                className={primaryButtonClass}
                type="button"
                onClick={generateWithCompanyContext}
                disabled={!rawInput.trim() || isGenerating}
              >
                {isGenerating ? "생성 중" : "새 회사 기준으로 생성"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {profileUpdateNoticeVisible ? (
        <div className="mb-5 rounded-md border border-line bg-surface px-4 py-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-soft">
                개인 프로필이 업데이트됐습니다.
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                다시 생성하면 새 역할, 산업, 목표, 선호 톤과 출력 형식이
                프롬프트에 반영됩니다.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                className={secondaryButtonClass}
                type="button"
                onClick={clearProfileUpdateNotice}
              >
                알림 닫기
              </button>
              <button
                className={primaryButtonClass}
                type="button"
                onClick={generateWithProfileContext}
                disabled={!rawInput.trim() || isGenerating}
              >
                {isGenerating ? "생성 중" : "새 개인 기준으로 생성"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ContextOperatingFlow
        badge={
          rawInput.trim()
            ? inputReadinessLabel
            : "원문 필요"
        }
        description="Studio는 원문을 바로 생성하지 않고 입력 상태, AI 판단, 학습 컨텍스트, 저장 흐름을 먼저 확인한 뒤 전문 프롬프트를 만듭니다."
        items={studioGenerationOperatingFlowItems}
        testId="studio-generation-operating-flow"
        title="Studio 생성 운영 흐름"
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel>
          <PanelHeader
            title="원문 입력"
            description="대충 적은 생각이어도 됩니다. 시스템이 목적, 맥락, 제약, 출력 형식으로 재구성합니다."
          />
          <div className="space-y-5 p-5">
            <Field label="사용자 원문">
              <textarea
                id="studio-raw-input"
                className={`${textareaClass} min-h-44`}
                value={rawInput}
                onChange={(event) => {
                  setRawInput(event.target.value);
                  setInputAnalysisCopied(false);
                }}
              />
            </Field>
            <StudioInputAnalysisPanel
              rawInput={rawInput}
              inputReadinessLabel={inputReadinessLabel}
              studioPreparationSteps={studioPreparationSteps}
              inputReadinessAnalysis={inputReadinessAnalysis}
              missingQuestionCount={missingQuestionCount}
              inputAnalysisCopied={inputAnalysisCopied}
              inputReadinessQuestionBlockApplied={
                inputReadinessQuestionBlockApplied
              }
              studioManualCopy={studioManualCopy}
              copyInputReadinessReport={copyInputReadinessReport}
              applyInputReadinessQuestions={applyInputReadinessQuestions}
              onCloseManualCopy={() => setStudioManualCopy(null)}
            />

            {loadedDraftSummary && loadedDraftSource ? (
              <StudioLoadedDraftPanel
                loadedDraftSummary={loadedDraftSummary}
                loadedDraftSource={loadedDraftSource}
                loadedDraftOperationalSummary={loadedDraftOperationalSummary}
                loadedDraftPersistence={loadedDraftPersistence}
                loadedDraftSourceKind={loadedDraftSourceKind}
                rawInput={rawInput}
                isGenerating={isGenerating}
                sourceLinkCopied={sourceLinkCopied}
                studioManualCopy={studioManualCopy}
                generatePrompt={generatePrompt}
                copyLoadedDraftSourceLink={copyLoadedDraftSourceLink}
                onDismiss={() => {
                  setLoadedDraftSummary(null);
                  setSourceLinkCopied(false);
                  setStudioManualCopy((current) =>
                    current?.id === "source-link" ? null : current,
                  );
                }}
                onCloseManualCopy={() => setStudioManualCopy(null)}
              />
            ) : null}

            {improvementSource ? (
              <div className="rounded-md border border-line bg-surface px-3 py-3">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-accent">
                      {improvementDraftDepth > 1
                        ? "Library 재개선 출처"
                        : "Library 개선 출처"}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-soft">
                      {improvementSource.sourcePromptTitle}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      {improvementSource.sourceVersionModel
                        ? `${modelLabels[improvementSource.sourceVersionModel]} 버전 기준`
                        : "선택 버전 기준"}
                    </p>
                    <p className="mt-1 font-mono text-xs text-accent">
                      저장 예정 · {formatImprovementDepthLabel(improvementDraftDepth)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} shrink-0`}
                    onClick={() => setImprovementSource(null)}
                  >
                    출처 해제
                  </button>
                </div>
              </div>
            ) : null}

            <StudioDecisionControlsPanel
              goal={goal}
              domain={domain}
              goalOptions={goalOptions}
              domainOptions={domainOptions}
              promptLanguageDecision={promptLanguageDecision}
              languageDecisionSummaryItems={languageDecisionSummaryItems}
              outputLanguage={outputLanguage}
              recommendedOutputLanguage={recommendedOutputLanguage}
              recommendedTargetModels={recommendedTargetModels}
              targetModelDecision={targetModelDecision}
              targetModelRecommendationApplied={targetModelRecommendationApplied}
              modelsTouched={modelsTouched}
              targetModelSelectionSummaryItems={targetModelSelectionSummaryItems}
              selectedModels={selectedModels}
              nextGenerationSummary={nextGenerationSummary}
              nextGenerationMetricItems={nextGenerationMetricItems}
              nextGenerationChecklistItems={nextGenerationChecklistItems}
              inputReadinessAnalysis={inputReadinessAnalysis}
              inputReadinessQuestionBlockApplied={
                inputReadinessQuestionBlockApplied
              }
              rawInput={rawInput}
              isGenerating={isGenerating}
              appliedContextMemories={appliedContextMemories}
              appliedFeedbackCount={appliedFeedbackCount}
              learningContextSummaryItems={learningContextSummaryItems}
              learningContextWorkflowSteps={learningContextWorkflowSteps}
              enabledMemoryScopes={enabledMemoryScopes}
              learningMemoryScopeCounts={learningMemoryScopeCounts}
              appliedLearningMemories={appliedLearningMemories}
              enabledMemoryScopeCount={enabledMemoryScopeCount}
              memories={memories}
              setGoal={setGoal}
              setDomain={setDomain}
              setInputAnalysisCopied={setInputAnalysisCopied}
              setOutputLanguage={setOutputLanguage}
              setManualSelectedModels={setManualSelectedModels}
              toggleModel={toggleModel}
              applyInputReadinessQuestions={applyInputReadinessQuestions}
              generatePrompt={generatePrompt}
              enableAllMemoryScopes={enableAllMemoryScopes}
              disableAllMemoryScopes={disableAllMemoryScopes}
              toggleMemoryScope={toggleMemoryScope}
            />
            <div className="rounded-md border border-line bg-surface px-3 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-soft">생성 엔진</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {engineStatusFailed
                      ? "상태 확인 실패. 생성 시 로컬 fallback이 적용됩니다."
                      : engineStatus?.configured
                        ? `OpenAI Responses API · ${engineStatus.model}`
                        : "로컬 프롬프트 빌더 · OpenAI 키 없음"}
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-line bg-panel px-3 py-2 text-xs font-semibold text-soft">
                  {engineStatus?.mode === "openai" ? "보강 가능" : "Fallback"}
                </span>
              </div>
            </div>
            {generationNotice ? (
              <p
                role="status"
                aria-live="polite"
                className="rounded-md border border-line bg-surface px-3 py-2 text-xs leading-5 text-muted"
              >
                {generationNotice}
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel className="min-h-[720px]">
          <PanelHeader
            title="생성 결과"
            description="탭을 전환해 AI 도구별 지시문과 자동 판단된 언어 전략을 확인합니다."
          />

          {generated && activeVersion ? (
            <div className="grid min-h-[640px] gap-0 xl:grid-cols-[1fr_280px]">
              <div className="border-b border-line xl:border-b-0 xl:border-r">
                <div className="flex gap-1 overflow-x-auto border-b border-line px-4 py-3">
                  {generated.versions.map((version) => (
                    <button
                      key={version.id}
                      type="button"
                      className={`shrink-0 rounded-md px-3 py-2 text-sm transition ${
                        activeModel === version.targetModel
                          ? "bg-panel-strong text-foreground"
                          : "text-muted hover:bg-surface hover:text-foreground"
                      }`}
                      onClick={() => {
                        setActiveModel(version.targetModel);
                        setCopied(false);
                        setContextQuestionsCopied(false);
                        setQualityReportCopied(false);
                        setTargetAiPackageCopied(false);
                        setQualityComparisonCopied(false);
                        setLearningContextReportCopied(false);
                        setSavedLibraryLinkCopied(false);
                        setStudioManualCopy(null);
                      }}
                    >
                      {version.modelLabel}
                    </button>
                  ))}
	                </div>
	                <div className="p-5">
	                  {pendingRegenerationNotice ? (
	                    <div className="mb-4 rounded-md border border-accent/40 bg-accent/10 px-3 py-3 text-accent">
	                      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	                        <div>
	                          <p className="text-xs font-semibold">재생성 대기</p>
	                          <p className="mt-1 text-xs leading-5">
	                            {pendingRegenerationNotice} 새 결과를 만들려면 다시 생성하세요.
	                          </p>
	                        </div>
	                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
	                          {pendingRegenerationRecovery ? (
	                            <button
	                              type="button"
	                              className="rounded-md border border-current/30 bg-transparent px-3 py-2 text-xs font-semibold transition hover:bg-panel/70"
	                              onClick={keepPreviousGeneratedResult}
	                            >
	                              이전 결과 유지
	                            </button>
	                          ) : null}
	                          <button
	                            type="button"
	                            className="rounded-md border border-current/30 bg-panel/80 px-3 py-2 text-xs font-semibold transition hover:bg-panel-strong disabled:cursor-not-allowed disabled:opacity-60"
	                            onClick={generatePrompt}
	                            disabled={!rawInput.trim() || isGenerating}
	                          >
	                            {isGenerating ? "생성 중" : "재생성 실행"}
	                          </button>
	                        </div>
	                      </div>
	                    </div>
	                  ) : null}
                    {activeTargetAiHandoffSummary ? (
                      <div
                        className="mb-4 rounded-md border border-line bg-surface px-3 py-3"
                        data-testid="studio-result-handoff-summary"
                      >
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs text-muted">AI 전달 상태</p>
                            <p className="mt-1 break-words text-sm font-semibold text-soft">
                              {activeTargetAiHandoffSummary.actionLabel}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted">
                              {activeTargetAiHandoffSummary.detail}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                            <span
                              className={`inline-flex min-h-7 items-center justify-center rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-semibold ${
                                targetAiReadinessStatusClassNames[
                                  activeTargetAiHandoffSummary.status
                                ]
                              }`}
                            >
                              {
                                targetAiReadinessStatusLabels[
                                  activeTargetAiHandoffSummary.status
                                ]
                              }
                            </span>
                            <button
                              type="button"
                              className={`${
                                activeTargetAiHandoffSummary.status === "blocked"
                                  ? primaryButtonClass
                                  : secondaryButtonClass
                              } w-full whitespace-nowrap sm:w-auto`}
                              disabled={
                                externalHandoffBlockedByPendingRegeneration
                              }
                              title={
                                externalHandoffBlockedByPendingRegeneration
                                  ? "보강 브리프가 반영되어 새 결과를 만든 뒤 실행할 수 있습니다."
                                  : undefined
                              }
                              onClick={() => {
                                if (
                                  activeTargetAiHandoffSummary.status ===
                                  "blocked"
                                ) {
                                  applyTargetAiHandoffImprovementBrief();
                                  return;
                                }

                                setTargetAiPackagePreviewKey(
                                  activeTargetAiPackageKey,
                                );
                              }}
                            >
                              {externalHandoffBlockedByPendingRegeneration
                                ? "재생성 후 실행"
                                : activeTargetAiHandoffSummary.actionLabel}
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          {targetAiReadinessStatusOrder.map((status) => (
                            <div
                              key={status}
                              className="min-w-0 border-r border-line pr-2 last:border-r-0 last:pr-0"
                            >
                              <p className="text-muted">
                                {targetAiReadinessStatusLabels[status]}
                              </p>
                              <p
                                className={`mt-1 font-mono text-sm font-semibold ${
                                  targetAiReadinessStatusClassNames[status]
                                }`}
                              >
                                {activeTargetAiHandoffSummary.readiness[status]}
                              </p>
                            </div>
                          ))}
                        </div>
                        {activeTargetAiHandoffSummary.priorityItem ? (
                          <p className="mt-3 border-t border-line pt-3 text-xs leading-5 text-muted">
                            우선 확인 ·{" "}
                            <span className="font-semibold text-soft">
                              {activeTargetAiHandoffSummary.priorityItem.label}
                            </span>{" "}
                            — {activeTargetAiHandoffSummary.priorityItem.detail}
                          </p>
                        ) : null}
                        {activeTargetAiHandoffReviewQueue.length ? (
                          <div
                            className="mt-3 border-t border-line pt-3"
                            data-testid="studio-result-handoff-review-queue"
                          >
                            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-soft">
                                  전달 전 검토 큐
                                </p>
                                <p className="mt-1 text-xs leading-5 text-muted">
                                  복사 전에 차단, 검토, 전달 가능 항목 순서로
                                  확인합니다.
                                </p>
                              </div>
                              <span className="w-fit rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-semibold text-muted">
                                상위 {activeTargetAiHandoffReviewQueue.length}개
                              </span>
                            </div>
                            <div className="mt-3 grid gap-2 md:grid-cols-3">
                              {activeTargetAiHandoffReviewQueue.map((item) => (
                                <div
                                  className="min-w-0 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5"
                                  key={`${item.status}-${item.label}`}
                                >
                                  <div className="flex min-w-0 items-center justify-between gap-2">
                                    <p className="min-w-0 break-words font-semibold text-soft">
                                      {item.label}
                                    </p>
                                    <span
                                      className={`shrink-0 font-semibold ${
                                        targetAiReadinessStatusClassNames[
                                          item.status
                                        ]
                                      }`}
                                    >
                                      {targetAiReadinessStatusLabels[item.status]}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-muted">{item.detail}</p>
                                  <p className="mt-2 border-t border-line pt-2 font-semibold text-soft">
                                    다음 행동 · {item.action}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
	                  <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-md border border-line bg-surface p-4 font-mono text-[13px] leading-6 text-soft">
	                    {activeVersion.content}
	                  </pre>
                    {generatedSaveOperationalSummary ? (
                      <div
                        className="mt-4 rounded-md border border-line bg-surface px-3 py-3"
                        data-testid="studio-generated-save-operational-summary"
                      >
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs text-muted">저장 운영 상태</p>
                            <p className="mt-1 break-words text-sm font-semibold text-soft">
                              {generatedSaveOperationalSummary.statusLabel}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted">
                              {generatedSaveOperationalSummary.detail}
                            </p>
                            {generatedSaveOperationalSummary.sourceActionDetail ? (
                              <p className="mt-1 text-xs leading-5 text-muted">
                                {
                                  generatedSaveOperationalSummary.sourceActionDetail
                                }
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs leading-5 text-muted">
                              학습 증거 ·{" "}
                              {
                                generatedSaveOperationalSummary.learningEvidenceLabel
                              }
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                            <span className="rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-semibold text-accent">
                              {generatedSaveOperationalSummary.persistenceLabel}
                            </span>
                            <button
                              type="button"
                              className={`${
                                generatedSaveOperationalSummary.actionKind ===
                                "open-library"
                                  ? secondaryButtonClass
                                  : primaryButtonClass
                              } w-full whitespace-nowrap sm:w-auto`}
                              onClick={runGeneratedSaveOperationalSummaryAction}
                              disabled={
                                generatedSaveOperationalSummary.actionKind ===
                                  "regenerate" &&
                                (!rawInput.trim() || isGenerating)
                              }
                            >
                              {generatedSaveOperationalSummary.actionKind ===
                                "regenerate" && isGenerating
                                ? "생성 중"
                                : generatedSaveOperationalSummary.actionLabel}
                            </button>
                            {generatedSaveOperationalSummary.recoveryActionLabel ? (
                              <button
                                type="button"
                                className={`${secondaryButtonClass} w-full whitespace-nowrap sm:w-auto`}
                                onClick={keepPreviousGeneratedResult}
                              >
                                {
                                  generatedSaveOperationalSummary.recoveryActionLabel
                                }
                              </button>
                            ) : null}
                            {generatedSaveOperationalSummary.sourceActionLabel ? (
                              <>
                                <button
                                  type="button"
                                  className={`${secondaryButtonClass} w-full whitespace-nowrap sm:w-auto`}
                                  onClick={openSavedPromptStudioSourceInLibrary}
                                  data-testid="studio-generated-save-source-action"
                                >
                                  {
                                    generatedSaveOperationalSummary.sourceActionLabel
                                  }
                                </button>
                                <button
                                  type="button"
                                  className={`${secondaryButtonClass} w-full whitespace-nowrap sm:w-auto`}
                                  onClick={() =>
                                    copySavedPromptOperationalLink({
                                      href: savedPromptStudioSourceHref,
                                      id: "saved-studio-source-link",
                                      title:
                                        generatedSaveOperationalSummary.sourceLinkTitle,
                                    })
                                  }
                                  data-testid="studio-generated-save-source-link-copy"
                                >
                                  {savedOperationalLinkCopiedKey ===
                                  "saved-studio-source-link"
                                    ? generatedSaveOperationalSummary.sourceLinkCopiedLabel
                                    : studioManualCopy?.id ===
                                        "saved-studio-source-link"
                                      ? generatedSaveOperationalSummary.sourceLinkFailedLabel
                                      : generatedSaveOperationalSummary.sourceLinkCopyLabel}
                                </button>
                              </>
                            ) : null}
                            {generatedSaveOperationalSummary.persistenceActionLabel ? (
                              <>
                                <button
                                  type="button"
                                  className={`${secondaryButtonClass} w-full whitespace-nowrap sm:w-auto`}
                                  onClick={
                                    openSavedPromptStudioPersistenceInLibrary
                                  }
                                  data-testid="studio-generated-save-persistence-action"
                                >
                                  {
                                    generatedSaveOperationalSummary.persistenceActionLabel
                                  }
                                </button>
                                <button
                                  type="button"
                                  className={`${secondaryButtonClass} w-full whitespace-nowrap sm:w-auto`}
                                  onClick={() =>
                                    copySavedPromptOperationalLink({
                                      href: savedPromptStudioPersistenceHref,
                                      id: "saved-studio-persistence-link",
                                      title: "저장 방식 조건 링크",
                                    })
                                  }
                                  data-testid="studio-generated-save-persistence-link-copy"
                                >
                                  {savedOperationalLinkCopiedKey ===
                                  "saved-studio-persistence-link"
                                    ? "방식 링크 복사됨"
                                    : studioManualCopy?.id ===
                                        "saved-studio-persistence-link"
                                      ? "방식 링크 복사 실패"
                                      : "방식 링크 복사"}
                                </button>
                              </>
                            ) : null}
                            {generatedSaveOperationalSummary.groupActionLabel ? (
                              <>
                                <button
                                  type="button"
                                  className={`${secondaryButtonClass} w-full whitespace-nowrap sm:w-auto`}
                                  onClick={
                                    openSavedPromptStudioOperationalGroupInLibrary
                                  }
                                  data-testid="studio-generated-save-operational-group-action"
                                >
                                  {
                                    generatedSaveOperationalSummary.groupActionLabel
                                  }
                                </button>
                                <button
                                  type="button"
                                  className={`${secondaryButtonClass} w-full whitespace-nowrap sm:w-auto`}
                                  onClick={() =>
                                    copySavedPromptOperationalLink({
                                      href: savedPromptStudioOperationalGroupHref,
                                      id: "saved-studio-operational-group-link",
                                      title:
                                        generatedSaveOperationalSummary.groupLinkTitle,
                                    })
                                  }
                                  data-testid="studio-generated-save-operational-group-link-copy"
                                >
                                  {savedOperationalLinkCopiedKey ===
                                  "saved-studio-operational-group-link"
                                    ? generatedSaveOperationalSummary.groupLinkCopiedLabel
                                    : studioManualCopy?.id ===
                                        "saved-studio-operational-group-link"
                                      ? generatedSaveOperationalSummary.groupLinkFailedLabel
                                      : generatedSaveOperationalSummary.groupLinkCopyLabel}
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div className="min-w-0 border-r border-line pr-2">
                            <p className="text-muted">저장 방식</p>
                            <p className="mt-1 break-words font-semibold text-soft">
                              {generatedSaveOperationalSummary.persistenceLabel}
                            </p>
                          </div>
                          <div className="min-w-0 border-r border-line pr-2">
                            <p className="text-muted">저장 출처</p>
                            <p className="mt-1 break-words font-semibold text-soft">
                              {generatedSaveOperationalSummary.sourceLabel}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-muted">Library 기록</p>
                            <p className="mt-1 break-words font-semibold text-soft">
                              {
                                generatedSaveOperationalSummary.libraryRecordLabel
                              }
                            </p>
                          </div>
                        </div>
                        {generatedSaveOperationalSummary.sourceTitle ? (
                          <div className="mt-2 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5">
                            <p className="text-muted">출처 제목</p>
                            <p className="mt-1 break-words font-semibold text-soft">
                              {generatedSaveOperationalSummary.sourceTitle}
                            </p>
                          </div>
                        ) : null}
                        {generatedSaveOperationalSummary.sourceVariantLabel ? (
                          <div className="mt-2 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5">
                            <p className="text-muted">세부 초안 유형</p>
                            <p className="mt-1 break-words font-semibold text-soft">
                              {
                                generatedSaveOperationalSummary.sourceVariantLabel
                              }
                            </p>
                          </div>
                        ) : null}
                        <div className="mt-2 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5">
                          <p className="text-muted">학습 증거</p>
                          <p className="mt-1 break-words font-semibold text-soft">
                            {
                              generatedSaveOperationalSummary.learningEvidenceLabel
                            }
                          </p>
                          {generatedSaveOperationalSummary.learningMemoryTitleLabel ? (
                            <p className="mt-1 break-words text-muted">
                              적용 메모리 ·{" "}
                              {
                                generatedSaveOperationalSummary.learningMemoryTitleLabel
                              }
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    {generatedResultWorkflowSteps.length ? (
                      <div
                        className="mt-4 rounded-md border border-line bg-surface px-3 py-3"
                        data-testid="studio-result-workflow-summary"
                      >
                        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs text-muted">결과 실행 순서</p>
                            <p className="mt-1 text-sm font-semibold text-soft">
                              검토 후 AI 전달, 필요하면 Library 저장까지 이어갑니다.
                            </p>
                          </div>
                          <span className="w-fit rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-semibold text-accent">
                            3단계
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-3">
                          {generatedResultWorkflowSteps.map((step) => (
                            <div
                              key={step.label}
                              className="min-w-0 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5"
                            >
                              <div className="flex min-w-0 items-center justify-between gap-2">
                                <p className="font-semibold text-soft">
                                  {step.label}
                                </p>
                                <span className="min-w-0 break-words rounded-md border border-line bg-surface px-2 py-0.5 text-right text-[11px] font-semibold text-muted">
                                  {step.status}
                                </span>
                              </div>
                              <p className="mt-2 text-muted">{step.detail}</p>
                              <p className="mt-2 border-t border-line pt-2 font-semibold text-soft">
                                다음 행동 · {step.action}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
	                    <div
	                      className="mt-4 grid gap-3 lg:grid-cols-3"
	                      data-testid="studio-result-action-groups"
	                    >
	                      <div className="rounded-md border border-line bg-surface px-3 py-3">
	                        <div className="flex min-w-0 items-center justify-between gap-2">
	                          <div className="flex min-w-0 items-center gap-2">
	                            <span className="shrink-0 rounded-md border border-line bg-panel px-1.5 py-0.5 text-[10px] font-semibold text-accent">
	                              01
	                            </span>
	                            <p className="text-xs font-semibold text-soft">
	                              검토
	                            </p>
	                          </div>
	                          {generatedResultActionGroupSummaries ? (
	                            <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted">
	                              {generatedResultActionGroupSummaries.reviewBadge}
	                            </span>
	                          ) : null}
	                        </div>
	                        {generatedResultActionGroupSummaries ? (
	                          <p
	                            className="mt-1 text-xs leading-5 text-muted"
	                            data-testid="studio-result-review-action-guide"
	                          >
	                            {generatedResultActionGroupSummaries.review}
	                          </p>
	                        ) : null}
	                        <div className="mt-2 grid gap-2">
	                          <button
	                            className={`${secondaryButtonClass} w-full`}
	                            type="button"
	                            onClick={() => copyPrompt()}
	                            disabled={externalHandoffBlockedByPendingRegeneration}
	                            title={
	                              externalHandoffBlockedByPendingRegeneration
	                                ? "보강 브리프가 반영되어 새 결과를 만든 뒤 복사할 수 있습니다."
	                                : undefined
	                            }
	                          >
	                            {externalHandoffBlockedByPendingRegeneration
	                              ? "재생성 후 복사"
	                              : copied
	                                ? "복사됨"
	                                : studioManualCopy?.id === "prompt"
	                                  ? "현재 버전 복사 실패"
	                                  : "현재 버전 복사"}
	                          </button>
	                          <button
	                            className={`${secondaryButtonClass} w-full`}
	                            type="button"
	                            onClick={copyQualityReport}
	                          >
	                            {qualityReportCopied
	                              ? "리포트 복사됨"
	                              : studioManualCopy?.id === "quality-report"
	                                ? "품질 리포트 복사 실패"
	                                : "품질 리포트 복사"}
	                          </button>
	                          {activeVersion ? (
	                            <button
	                              className={`${primaryButtonClass} w-full`}
	                              type="button"
	                              onClick={copyPromptAndOpenExternalAi}
	                              disabled={
	                                externalHandoffBlockedByPendingRegeneration
	                              }
	                              title={`프롬프트를 복사하고 ${getExternalAiTarget(activeVersion.targetModel).label}을 새 탭에서 엽니다.`}
	                              data-testid="studio-result-copy-and-open-external-ai"
	                            >
	                              {`복사 후 ${getExternalAiTarget(activeVersion.targetModel).label}에서 열기`}
	                            </button>
	                          ) : null}
	                        </div>
	                      </div>
	                      <div className="rounded-md border border-line bg-surface px-3 py-3">
	                        <div className="flex min-w-0 items-center justify-between gap-2">
	                          <div className="flex min-w-0 items-center gap-2">
	                            <span className="shrink-0 rounded-md border border-line bg-panel px-1.5 py-0.5 text-[10px] font-semibold text-accent">
	                              02
	                            </span>
	                            <p className="text-xs font-semibold text-soft">
	                              AI 전달
	                            </p>
	                          </div>
	                          {generatedResultActionGroupSummaries ? (
	                            <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted">
	                              {generatedResultActionGroupSummaries.handoffBadge}
	                            </span>
	                          ) : null}
	                        </div>
	                        {generatedResultActionGroupSummaries ? (
	                          <p
	                            className="mt-1 text-xs leading-5 text-muted"
	                            data-testid="studio-result-handoff-action-guide"
	                          >
	                            {generatedResultActionGroupSummaries.handoff}
	                          </p>
	                        ) : null}
	                        <div className="mt-2 grid gap-2">
	                          {activeTargetAiHandoffSummary?.status ===
	                          "blocked" ? (
	                            <button
	                              className={`${primaryButtonClass} w-full`}
	                              type="button"
	                              onClick={applyTargetAiHandoffImprovementBrief}
	                              disabled={
	                                externalHandoffBlockedByPendingRegeneration
	                              }
	                              title={
	                                externalHandoffBlockedByPendingRegeneration
	                                  ? "보강 브리프가 반영되어 새 결과를 만든 뒤 다시 적용할 수 있습니다."
	                                  : undefined
	                              }
	                            >
	                              {externalHandoffBlockedByPendingRegeneration
	                                ? "재생성 후 보강"
	                                : "보강 브리프 적용"}
	                            </button>
	                          ) : null}
	                          <button
	                            className={`${secondaryButtonClass} w-full`}
	                            type="button"
	                            onClick={copyTargetAiHandoffPackage}
	                            disabled={externalHandoffBlockedByPendingRegeneration}
	                            title={
	                              externalHandoffBlockedByPendingRegeneration
	                                ? "보강 브리프가 반영되어 새 결과를 만든 뒤 AI 전달 패키지를 복사할 수 있습니다."
	                                : undefined
	                            }
	                          >
	                            {externalHandoffBlockedByPendingRegeneration
	                              ? "재생성 후 패키지 복사"
	                              : targetAiPackageCopied
	                                ? "전달 패키지 복사됨"
	                                : studioManualCopy?.id === "target-ai-package"
	                                  ? "전달 패키지 복사 실패"
	                                  : "AI 전달 패키지 복사"}
	                          </button>
	                          <button
	                            aria-expanded={targetAiPackagePreviewOpen}
	                            className={`${secondaryButtonClass} w-full`}
	                            type="button"
	                            disabled={externalHandoffBlockedByPendingRegeneration}
	                            title={
	                              externalHandoffBlockedByPendingRegeneration
	                                ? "보강 브리프가 반영되어 새 결과를 만든 뒤 AI 전달 패키지를 확인할 수 있습니다."
	                                : undefined
	                            }
	                            onClick={() =>
	                              setTargetAiPackagePreviewKey((current) =>
	                                current === activeTargetAiPackageKey
	                                  ? ""
	                                  : activeTargetAiPackageKey,
	                              )
	                            }
	                          >
	                            {externalHandoffBlockedByPendingRegeneration
	                              ? "재생성 후 패키지 보기"
	                              : targetAiPackagePreviewOpen
	                                ? "패키지 닫기"
	                                : "AI 전달 패키지 보기"}
	                          </button>
	                        </div>
	                      </div>
	                      <div className="rounded-md border border-line bg-surface px-3 py-3">
	                        <div className="flex min-w-0 items-center justify-between gap-2">
	                          <div className="flex min-w-0 items-center gap-2">
	                            <span className="shrink-0 rounded-md border border-line bg-panel px-1.5 py-0.5 text-[10px] font-semibold text-accent">
	                              03
	                            </span>
	                            <p className="text-xs font-semibold text-soft">
	                              저장
	                            </p>
	                          </div>
	                          {generatedResultActionGroupSummaries ? (
	                            <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted">
	                              {generatedResultActionGroupSummaries.saveBadge}
	                            </span>
	                          ) : null}
	                        </div>
	                        {generatedResultActionGroupSummaries ? (
	                          <p
	                            className="mt-1 text-xs leading-5 text-muted"
	                            data-testid="studio-result-save-action-guide"
	                          >
	                            {generatedResultActionGroupSummaries.save}
	                          </p>
	                        ) : null}
	                        <div className="mt-2 grid gap-2">
	                          <button
	                            className={`${primaryButtonClass} w-full`}
	                            type="button"
	                            onClick={savePrompt}
	                            disabled={
	                              savedCurrent || saveBlockedByPendingRegeneration
	                            }
	                            title={
	                              saveBlockedByPendingRegeneration
	                                ? "보강 브리프가 반영되어 새 결과를 만든 뒤 저장할 수 있습니다."
	                                : undefined
	                            }
	                          >
	                            {saveBlockedByPendingRegeneration
	                              ? "재생성 후 저장"
	                              : generated.improvementSource
	                                ? savedCurrent
	                                  ? `${formatImprovementDepthLabel(
	                                      generatedImprovementDepth,
	                                    )} 저장됨`
	                                  : `${formatImprovementDepthLabel(
	                                      generatedImprovementDepth,
	                                    )} 저장`
	                                : savedCurrent
	                                  ? "라이브러리에 저장됨"
	                                  : "라이브러리에 저장"}
	                          </button>
	                        </div>
	                      </div>
	                    </div>
	                  {regenerationSaveDecision ? (
	                    <div
	                      aria-live="polite"
	                      className={`mt-3 rounded-md border px-3 py-2 ${
	                        regenerationSaveDecisionClassNames[
	                          regenerationSaveDecision.status
	                        ]
	                      }`}
	                    >
	                      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
	                        <p className="text-xs font-semibold">
	                          저장 전 판정 · {regenerationSaveDecision.label}
	                        </p>
	                        {qualityComparison ? (
	                          <span className="font-mono text-[11px]">
	                            {formatScoreDelta(qualityComparison.scoreDelta)}
	                          </span>
	                        ) : null}
	                      </div>
	                      <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
	                        <p className="text-xs leading-5">
	                          {regenerationSaveDecision.detail}
	                        </p>
	                        {regenerationSaveDecision.status !== "save" ? (
	                          <button
	                            type="button"
	                            className="shrink-0 rounded-md border border-current/30 bg-panel/80 px-3 py-1.5 text-xs font-semibold transition hover:bg-panel-strong"
	                            onClick={applyTargetAiHandoffImprovementBrief}
	                          >
	                            보강 브리프 적용
	                          </button>
	                        ) : null}
	                      </div>
	                    </div>
	                  ) : null}
	                  {targetAiPackagePreviewOpen &&
	                  !externalHandoffBlockedByPendingRegeneration ? (
	                    <TargetAiHandoffPreviewPanel
                      handoffPackageText={activeTargetAiHandoffPackageText}
                      improvementBriefButtonLabel={
                        targetAiImprovementBriefCopied
                          ? "보강 브리프 복사됨"
                          : studioManualCopy?.id ===
                              "target-ai-improvement-brief"
                            ? "보강 브리프 복사 실패"
                            : "보강 브리프 복사"
                      }
                      modelLabel={modelLabels[activeVersion.targetModel]}
                      onCopyImprovementBrief={
                        copyTargetAiHandoffImprovementBrief
                      }
                      onCopyPackage={copyTargetAiHandoffPackage}
                      onCopyRunPrompt={() => copyPrompt("실행 프롬프트")}
                      onOpenImprovementInStudio={
                        applyTargetAiHandoffImprovementBrief
                      }
                      onPreviewModeChange={setTargetAiPackagePreviewMode}
                      openImprovementButtonLabel="Studio에서 보강"
                      packageButtonLabel={
                        targetAiPackageCopied
                          ? "전달 패키지 복사됨"
                          : studioManualCopy?.id === "target-ai-package"
                            ? "전달 패키지 복사 실패"
                            : "패키지 복사"
                      }
                      previewMode={targetAiPackagePreviewMode}
                      previewModeName="studio-target-ai-handoff-preview-mode"
                      qualityScore={activeVersion.qualityScore}
                      readinessItems={activeTargetAiHandoffReadinessItems}
                      runPromptText={activeVersion.content}
                      runPromptButtonLabel={
                        copied
                          ? "실행 프롬프트 복사됨"
                          : studioManualCopy?.id === "prompt"
                            ? "실행 프롬프트 복사 실패"
                            : "실행 프롬프트 복사"
                      }
                    />
                  ) : null}
                  {studioManualCopy && studioManualCopy.id !== "input-analysis" ? (
                    <ManualCopyPanel className="mt-4 bg-surface"
                      copy={studioManualCopy}
                      onClose={() => setStudioManualCopy(null)}
                    />
                  ) : null}
                  {savedPromptLibraryHref ? (
                    <div className="mt-4 rounded-md border border-accent/20 bg-panel px-4 py-3">
                      <p className="text-xs font-semibold text-soft">
                        저장 완료
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Library 상세에서 버전 비교, 피드백 저장, 재개선
                        브리프를 이어서 확인할 수 있습니다.
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <button
                          className={`${secondaryButtonClass} w-full sm:w-auto`}
                          type="button"
                          onClick={openSavedPromptInLibrary}
                        >
                          Library에서 보기
                        </button>
                        <button
                          className={`${secondaryButtonClass} w-full sm:w-auto`}
                          type="button"
                          onClick={copySavedPromptLibraryLink}
                        >
                          {savedLibraryLinkCopied
                            ? "Library 링크 복사됨"
                            : studioManualCopy?.id === "saved-library-link"
                              ? "Library 링크 복사 실패"
                              : "Library 링크 복사"}
                        </button>
                        <button
                          className={`${secondaryButtonClass} w-full sm:w-auto`}
                          type="button"
                          onClick={openSavedPromptInSkills}
                        >
                          Skill로 전환
                        </button>
                        <button
                          className={`${secondaryButtonClass} w-full sm:w-auto`}
                          type="button"
                          onClick={copySavedPromptSkillLink}
                        >
                          {savedSkillLinkCopied
                            ? "Skill 링크 복사됨"
                            : studioManualCopy?.id === "saved-skill-link"
                              ? "Skill 링크 복사 실패"
                              : "Skill 링크 복사"}
                        </button>
                        {savedPromptStudioSourceHref ? (
                          <button
                            className={`${secondaryButtonClass} w-full sm:w-auto`}
                            type="button"
                            onClick={openSavedPromptStudioSourceInLibrary}
                          >
                            {generatedSaveOperationalSummary?.sourceActionLabel ??
                              "저장 출처 보기"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <StudioResultInsightsPanel
                generated={generated}
                activeVersion={activeVersion}
                generatedImprovementDepth={generatedImprovementDepth}
                generatedLearningContext={generatedLearningContext}
                generatedEnabledScopeLabels={generatedEnabledScopeLabels}
                generatedDisabledScopeLabels={generatedDisabledScopeLabels}
                qualityImprovementBaseline={qualityImprovementBaseline}
                qualityComparison={qualityComparison}
                regenerationSaveDecision={regenerationSaveDecision}
                targetAiReadinessComparison={targetAiReadinessComparison}
                qualityInsights={qualityInsights}
                learningContextReportCopied={learningContextReportCopied}
                qualityComparisonCopied={qualityComparisonCopied}
                contextQuestionsCopied={contextQuestionsCopied}
                studioManualCopy={studioManualCopy}
                copyLearningContextReport={copyLearningContextReport}
                copyQualityComparisonReport={copyQualityComparisonReport}
                applyQualityImprovementBrief={applyQualityImprovementBrief}
                copyMissingContextQuestions={copyMissingContextQuestions}
                setQualityImprovementBaseline={setQualityImprovementBaseline}
                setQualityComparisonCopied={setQualityComparisonCopied}
                setStudioManualCopy={setStudioManualCopy}
              />
            </div>
          ) : (
            <div className="flex min-h-[640px] items-center justify-center px-5 text-center text-sm text-muted">
              원문을 입력하고 대상 AI 도구를 선택하면 결과가 여기에 표시됩니다.
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
