"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  PageHeader,
  Panel,
  PanelHeader,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import {
  ContextOperatingFlow,
  type ContextOperatingFlowItem,
} from "@/components/context/context-operating-flow";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import {
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  type LearningMemory,
  type PromptStudioDraftSource,
  type PromptStudioDraftSourceVariant,
} from "@/lib/prompt";
import {
  useCompanyProfileStore,
  useDeletedPromptAssetsStore,
  useLearningMemoriesStore,
  usePromptAssetsStore,
  usePromptSkillsStore,
  useUserProfileStore,
  useWorkspaceBackupMetaStore,
} from "@/lib/data/workspace-store";
import {
  getWorkspaceBackupCountChanges,
  isWorkspaceBackupMetaCurrent,
  summarizeWorkspaceBackupData,
} from "@/lib/storage/workspace-backup";
import {
  getLeadingLanguageStrategy,
  summarizeLanguageStrategyPerformance,
} from "@/lib/analytics/language-strategy";
import {
  getLeadingOutputLanguage,
  summarizeOutputLanguagePerformance,
} from "@/lib/analytics/output-language";
import {
  getLeadingTargetModel,
  getRecommendedTargetModel,
  summarizeTargetModelPerformance,
} from "@/lib/analytics/target-model";
import {
  getLeadingGenerationEngine,
  summarizeGenerationEnginePerformance,
} from "@/lib/analytics/generation-engine";
import {
  formatAbsoluteInternalHref,
  normalizeInternalHref,
} from "@/lib/navigation/href";
import {
  reimprovementQualityThreshold,
  summarizePromptImprovementPerformance,
  type PromptImprovementGroup,
  type PromptImprovementRecord,
  type PromptSourceHealthIssue,
} from "@/lib/analytics/prompt-improvement";
import { mergeMemoryList } from "@/lib/learning/memory";
import { getSkillRunStats } from "@/lib/skills/skill-runner";
import { writeStudioDraft } from "@/lib/studio/draft";
import {
  getPromptStudioSourceDashboardSummary,
  promptStudioDraftSourceOptions,
} from "@/lib/studio/source-registry";
import { getStudioDraftDisplaySourceLabel } from "@/lib/studio/draft-display";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import {
  type GenerationEngineStatus,
  type StudioPersistenceMode,
  type StudioPersistenceSummaryItem,
  type StudioSourceSummaryItem,
  completion,
  formatTimestamp,
  strategyStatusLabel,
  outputLanguageStatusLabel,
  targetModelStatusLabel,
  generationEngineStatusLabel,
  feedbackTypeLabels,
  formatTargetModelLabels,
  formatSignedScore,
  formatDashboardDate,
} from "@/lib/dashboard/shared";
import {
  buildPromptLibraryHref,
  buildSkillHref,
  targetModelLibraryHref,
  improvementLibraryHref,
  languageStrategyLibraryHref,
  outputLanguageLibraryHref,
  generationEngineLibraryHref,
  studioPersistenceLibraryHref,
  studioSourceLibraryHref,
  learningScopeLibraryHref,
  learningScopeLearningHref,
  feedbackImprovementLearningHref,
  promptDetailLibraryHref,
  promptFeedbackLibraryHref,
} from "@/lib/dashboard/hrefs";
import {
  buildFeedbackImprovementLearningMemory,
  type LearningOpsAction,
  type FeedbackBasedImprovementRecord,
  learningScopeLabels,
  summarizeLearningContextUsage,
  summarizeLearningReviewQueues,
  learningOpsPriorityLabel,
  summarizeLearningOpsActions,
  summarizePersonalizationActions,
} from "@/lib/dashboard/learning-memory";
import {
  type DashboardNextActionQueueItem,
  dashboardNextActionQueueVerificationChecklist,
  summarizeDashboardNextActionQueue,
  summarizeDashboardNextActionQueuePriorityCounts,
  summarizeDashboardNextActionQueueCategoryCounts,
  buildDashboardNextActionQueueLinksText,
  buildDashboardNextActionQueueVerificationChecklistText,
  buildDashboardNextActionQueueReportText,
  buildDashboardNextActionQueueStudioPrompt,
  buildDashboardNextActionQueueVerificationStudioPrompt,
} from "@/lib/dashboard/next-action-queue";
import {
  buildDashboardPersonalizationReportText,
  buildDashboardPersonalizationStudioPrompt,
  buildDashboardPersonalizationActionStudioPrompt,
  buildDashboardPersonalizationActionReportText,
  buildDashboardLearningOpsReportText,
  buildDashboardLearningOpsStudioPrompt,
  buildDashboardLearningActionReportText,
  buildDashboardLearningActionStudioPrompt,
  buildDashboardSkillOpsReportText,
  buildDashboardSkillOpsStudioPrompt,
} from "@/lib/dashboard/personalization-reports";
import {
  buildDashboardFeedbackImprovementOpsReportText,
  buildDashboardFeedbackImprovementPriorityReportText,
  buildDashboardFeedbackImprovementOpsStudioPrompt,
  buildDashboardFeedbackImprovementPriorityStudioPrompt,
  buildDashboardStudioSourceOpsReportText,
  buildDashboardStudioSourceOpsStudioPrompt,
  buildDashboardMissingSourceMetadataQueueStudioPrompt,
  buildDashboardSourceHealthActionReport,
  buildDashboardSourceHealthActionStudioPrompt,
  sourceHealthIssueReasonLabel,
  summarizeSourceHealthIssueReasons,
  sourceHealthIssueKey,
  buildDashboardSourceHealthCandidateMemo,
  feedbackImprovementPriorityReason,
  improvementStatusLabel,
  reimprovementReason,
  buildDashboardReimprovementBrief,
} from "@/lib/dashboard/source-reports";

function ImprovementGroupLink({ group }: { group: PromptImprovementGroup }) {
  return (
    <Link
      href={improvementLibraryHref({
        depth: group.depth,
        domain: group.targetModel || group.depth ? undefined : group.label,
        targetModel: group.targetModel,
      })}
      className="rounded-md border border-line bg-surface px-4 py-4 transition hover:border-accent hover:bg-panel-strong"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold">{group.label}</p>
          <p className="mt-1 text-xs text-muted">
            {group.count}개 개선본 · {improvementStatusLabel(group.averageDelta)} ·
            최고 {formatSignedScore(group.bestDelta)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-md border border-line bg-panel px-2 py-1 text-xs ${
            group.averageDelta >= 0 ? "text-accent" : "text-muted"
          }`}
        >
          {formatSignedScore(group.averageDelta)}
        </span>
      </div>
    </Link>
  );
}

const workflowItems = [
  {
    href: "/studio",
    step: "01",
    title: "작성",
    description: "원문을 영어 또는 한영 하이브리드 전문 프롬프트로 변환",
  },
  {
    href: "/library",
    step: "02",
    title: "저장",
    description: "AI별 버전과 피드백을 라이브러리에 축적",
  },
  {
    href: "/learning",
    step: "03",
    title: "학습",
    description: "사용자/회사/분야 기준을 메모리로 관리",
  },
  {
    href: "/skills",
    step: "04",
    title: "스킬화",
    description: "반복 업무를 실행 가능한 프롬프트 스킬로 전환",
  },
  {
    href: "/integrations",
    step: "05",
    title: "연결",
    description: "Chrome, MCP, 외부 AI 전달 흐름을 검토 후 실행",
  },
  {
    href: "/data",
    step: "06",
    title: "백업",
    description: "워크스페이스 데이터를 내보내고 복원",
  },
];

export function DashboardView() {
  const router = useRouter();
  const [userProfile] = useUserProfileStore();
  const [companyProfile] = useCompanyProfileStore();
  const [prompts] = usePromptAssetsStore();
  const [deletedPrompts] = useDeletedPromptAssetsStore();
  const [memories, setMemories] = useLearningMemoriesStore();
  const [skills] = usePromptSkillsStore();
  const [backupMeta] = useWorkspaceBackupMetaStore();
  const [engineStatus, setEngineStatus] =
    useState<GenerationEngineStatus | null>(null);
  const [engineStatusFailed, setEngineStatusFailed] = useState(false);
  const [
    personalizationReportCopyStatus,
    setPersonalizationReportCopyStatus,
  ] = useState<"idle" | "copied" | "failed">("idle");
  const [
    personalizationActionCopyStatus,
    setPersonalizationActionCopyStatus,
  ] = useState<{
    label: string;
    status: "copied" | "failed";
  } | null>(null);
  const [personalizationManualCopy, setPersonalizationManualCopy] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [learningOpsReportCopyStatus, setLearningOpsReportCopyStatus] =
    useState<"idle" | "copied" | "failed">("idle");
  const [learningOpsActionCopyStatus, setLearningOpsActionCopyStatus] =
    useState<{
      label: string;
      status: "copied" | "failed";
    } | null>(null);
  const [learningOpsManualCopy, setLearningOpsManualCopy] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [
    dashboardNextActionQueueReportCopyStatus,
    setDashboardNextActionQueueReportCopyStatus,
  ] = useState<"idle" | "copied" | "failed">("idle");
  const [
    dashboardNextActionQueueLinksCopyStatus,
    setDashboardNextActionQueueLinksCopyStatus,
  ] = useState<"idle" | "copied" | "failed">("idle");
  const [
    dashboardNextActionQueueVerificationCopyStatus,
    setDashboardNextActionQueueVerificationCopyStatus,
  ] = useState<"idle" | "copied" | "failed">("idle");
  const [
    dashboardNextActionQueueLinkCopyStatus,
    setDashboardNextActionQueueLinkCopyStatus,
  ] = useState<{
    key: string;
    status: "copied" | "failed";
  } | null>(null);
  const [
    dashboardNextActionQueueManualCopy,
    setDashboardNextActionQueueManualCopy,
  ] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [skillOpsReportCopyStatus, setSkillOpsReportCopyStatus] =
    useState<"idle" | "copied" | "failed">("idle");
  const [skillOpsLatestRunLinkCopyStatus, setSkillOpsLatestRunLinkCopyStatus] =
    useState<"idle" | "copied" | "failed">("idle");
  const [skillOpsSkillLinkCopyStatus, setSkillOpsSkillLinkCopyStatus] =
    useState<{
      key: string;
      status: "copied" | "failed";
    } | null>(null);
  const [skillOpsManualCopy, setSkillOpsManualCopy] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [
    feedbackImprovementOpsReportCopyStatus,
    setFeedbackImprovementOpsReportCopyStatus,
  ] = useState<"idle" | "copied" | "failed">("idle");
  const [
    feedbackImprovementPriorityCopyStatus,
    setFeedbackImprovementPriorityCopyStatus,
  ] = useState<"idle" | "copied" | "failed">("idle");
  const [
    feedbackImprovementOpsManualCopy,
    setFeedbackImprovementOpsManualCopy,
  ] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [sourceHealthActionCopyStatus, setSourceHealthActionCopyStatus] =
    useState<"idle" | "copied" | "failed">("idle");
  const [sourceHealthCandidateCopyStatus, setSourceHealthCandidateCopyStatus] =
    useState<{
      key: string;
      status: "copied" | "failed";
    } | null>(null);
  const [sourceHealthLinkCopyStatus, setSourceHealthLinkCopyStatus] = useState<{
    key: string;
    status: "copied" | "failed";
  } | null>(null);
  const [sourceHealthManualCopy, setSourceHealthManualCopy] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [studioSourceOpsReportCopyStatus, setStudioSourceOpsReportCopyStatus] =
    useState<"idle" | "copied" | "failed">("idle");
  const [studioSourceOpsManualCopy, setStudioSourceOpsManualCopy] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [
    missingSourceMetadataQueueCopyStatus,
    setMissingSourceMetadataQueueCopyStatus,
  ] = useState<"idle" | "copied" | "failed">("idle");
  const [
    missingSourceMetadataQueueLinkCopyStatus,
    setMissingSourceMetadataQueueLinkCopyStatus,
  ] = useState<"idle" | "copied" | "failed">("idle");
  const [
    missingSourceMetadataQueueManualCopy,
    setMissingSourceMetadataQueueManualCopy,
  ] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [
    studioPersistenceLinkCopyStatus,
    setStudioPersistenceLinkCopyStatus,
  ] = useState<{
    key: StudioPersistenceMode;
    status: "copied" | "failed";
  } | null>(null);
  const [
    studioPersistenceAllLinkCopyStatus,
    setStudioPersistenceAllLinkCopyStatus,
  ] = useState<"idle" | "copied" | "failed">("idle");
  const [
    studioPersistenceManualCopy,
    setStudioPersistenceManualCopy,
  ] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [
    studioSourceExampleLinkCopyStatus,
    setStudioSourceExampleLinkCopyStatus,
  ] = useState<{
    key: string;
    status: "copied" | "failed";
  } | null>(null);
  const [
    studioSourceExampleManualCopy,
    setStudioSourceExampleManualCopy,
  ] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [
    studioSourceAllFilterLinkCopyStatus,
    setStudioSourceAllFilterLinkCopyStatus,
  ] = useState<"idle" | "copied" | "failed">("idle");
  const [
    studioSourceFilterLinkCopyStatus,
    setStudioSourceFilterLinkCopyStatus,
  ] = useState<{
    key: string;
    status: "copied" | "failed";
  } | null>(null);
  const [
    studioSourceFilterManualCopy,
    setStudioSourceFilterManualCopy,
  ] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [
    feedbackImprovementMemorySaveStatus,
    setFeedbackImprovementMemorySaveStatus,
  ] = useState<"idle" | "saved" | "skipped">("idle");
  const [
    feedbackImprovementPriorityMemorySaveStatus,
    setFeedbackImprovementPriorityMemorySaveStatus,
  ] = useState<"idle" | "saved" | "skipped">("idle");
  const [
    feedbackImprovementPriorityMemoryPreview,
    setFeedbackImprovementPriorityMemoryPreview,
  ] = useState<LearningMemory | null>(null);
  const [
    feedbackImprovementMemorySaveCount,
    setFeedbackImprovementMemorySaveCount,
  ] = useState(0);

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

  const profileCompletion = useMemo(
    () =>
      completion([
        userProfile.role,
        userProfile.industries.join(","),
        userProfile.goals.join(","),
        userProfile.preferredTone,
        userProfile.preferredOutputs.join(","),
      ]),
    [userProfile],
  );

  const companyCompletion = useMemo(
    () =>
      completion([
        companyProfile.companyName,
        companyProfile.description,
        companyProfile.products.join(","),
        companyProfile.customers.join(","),
        companyProfile.brandTone,
      ]),
    [companyProfile],
  );

  const avgScore =
    prompts.length === 0
      ? 0
      : prompts.reduce((sum, prompt) => {
          const best = Math.max(
            ...prompt.versions.map((version) => version.qualityScore),
          );
          return sum + best;
        }, 0) / prompts.length;
  const workspaceCounts = useMemo(
    () =>
      summarizeWorkspaceBackupData({
        userProfile,
        companyProfile,
        prompts,
        memories,
        skills,
        deletedPrompts,
      }),
    [companyProfile, deletedPrompts, memories, prompts, skills, userProfile],
  );
  const backupIsCurrent = useMemo(
    () => isWorkspaceBackupMetaCurrent(backupMeta, workspaceCounts),
    [backupMeta, workspaceCounts],
  );
  const backupCountChanges = useMemo(
    () =>
      backupMeta.exportedAt
        ? getWorkspaceBackupCountChanges(workspaceCounts, backupMeta.counts)
        : [],
    [backupMeta, workspaceCounts],
  );
  const backupDeletedPromptCount = backupMeta.counts.deletedPrompts ?? 0;
  const backupStatusText = !backupMeta.exportedAt
    ? "아직 생성된 백업이 없습니다."
    : backupIsCurrent
      ? `${formatTimestamp(backupMeta.exportedAt)} 백업 기준 최신 상태입니다. 삭제 보관함 ${backupDeletedPromptCount}개를 포함합니다.`
      : `${formatTimestamp(backupMeta.exportedAt)} 백업 이후 ${backupCountChanges.length}개 데이터 항목이 변경됐습니다. 삭제 보관함 ${backupDeletedPromptCount}개가 백업 기준입니다.`;
  const dataReadinessChecks = useMemo(
    () => [
      { label: "개인", ready: profileCompletion >= 80 },
      { label: "회사", ready: companyCompletion >= 80 },
      { label: "생성", ready: workspaceCounts.prompts > 0 },
      {
        label: "학습",
        ready: workspaceCounts.feedback > 0 || workspaceCounts.memories > 0,
      },
      { label: "스킬", ready: workspaceCounts.skills > 0 },
      { label: "백업", ready: backupIsCurrent },
    ],
    [backupIsCurrent, companyCompletion, profileCompletion, workspaceCounts],
  );
  const dataReadinessDone = dataReadinessChecks.filter((item) => item.ready).length;
  const dataReadinessScore = Math.round(
    (dataReadinessDone / dataReadinessChecks.length) * 100,
  );
  const userMemoryCount = useMemo(
    () => memories.filter((memory) => memory.scope === "user").length,
    [memories],
  );
  const companyMemoryCount = useMemo(
    () => memories.filter((memory) => memory.scope === "company").length,
    [memories],
  );
  const skillRunStats = useMemo(
    () => getSkillRunStats(prompts, skills),
    [prompts, skills],
  );
  const languageSummaries = useMemo(
    () => summarizeLanguageStrategyPerformance(prompts, skills),
    [prompts, skills],
  );
  const leadingLanguageStrategy = useMemo(
    () => getLeadingLanguageStrategy(languageSummaries),
    [languageSummaries],
  );
  const outputLanguageSummaries = useMemo(
    () => summarizeOutputLanguagePerformance(prompts, skills),
    [prompts, skills],
  );
  const leadingOutputLanguage = useMemo(
    () => getLeadingOutputLanguage(outputLanguageSummaries),
    [outputLanguageSummaries],
  );
  const targetModelSummaries = useMemo(
    () => summarizeTargetModelPerformance(prompts, skills),
    [prompts, skills],
  );
  const leadingTargetModel = useMemo(
    () => getLeadingTargetModel(targetModelSummaries),
    [targetModelSummaries],
  );
  const recommendedTargetModel = useMemo(
    () => getRecommendedTargetModel(targetModelSummaries),
    [targetModelSummaries],
  );
  const generationEngineSummaries = useMemo(
    () => summarizeGenerationEnginePerformance(prompts),
    [prompts],
  );
  const leadingGenerationEngine = useMemo(
    () => getLeadingGenerationEngine(generationEngineSummaries),
    [generationEngineSummaries],
  );
  const learningScopeSummaries = useMemo(
    () => summarizeLearningContextUsage(prompts, memories),
    [memories, prompts],
  );
  const learningReviewQueues = useMemo(
    () => summarizeLearningReviewQueues(memories),
    [memories],
  );
  const trackedLearningPromptCount = useMemo(
    () => prompts.filter((prompt) => prompt.learningContext).length,
    [prompts],
  );
  const personalizationActions = useMemo(
    () =>
      summarizePersonalizationActions({
        companyCompletion,
        companyMemoryCount,
        profileCompletion,
        promptCount: prompts.length,
        trackedPromptCount: trackedLearningPromptCount,
        userMemoryCount,
      }),
    [
      companyCompletion,
      companyMemoryCount,
      profileCompletion,
      prompts.length,
      trackedLearningPromptCount,
      userMemoryCount,
    ],
  );
  const learningOpsActions = useMemo(
    () =>
      summarizeLearningOpsActions({
        memories,
        queues: learningReviewQueues,
        scopeSummaries: learningScopeSummaries,
        trackedPromptCount: trackedLearningPromptCount,
      }),
    [
      learningReviewQueues,
      learningScopeSummaries,
      memories,
      trackedLearningPromptCount,
    ],
  );
  const dashboardNextActionQueue = useMemo(
    () =>
      summarizeDashboardNextActionQueue({
        learningOpsActions,
        personalizationActions,
      }),
    [learningOpsActions, personalizationActions],
  );
  const dashboardNextActionQueuePriorityCounts = useMemo(
    () => summarizeDashboardNextActionQueuePriorityCounts(dashboardNextActionQueue),
    [dashboardNextActionQueue],
  );
  const dashboardNextActionQueueCategoryCounts = useMemo(
    () => summarizeDashboardNextActionQueueCategoryCounts(dashboardNextActionQueue),
    [dashboardNextActionQueue],
  );
  const dashboardNextActionQueueFirstAction = dashboardNextActionQueue[0] ?? null;
  const dashboardNextActionQueueWorkflowSteps = useMemo(
    () => [
      {
        detail: dashboardNextActionQueueFirstAction
          ? `${dashboardNextActionQueueFirstAction.categoryLabel} 항목을 먼저 열고 필요한 기준을 보강합니다.`
          : "처리할 개인화 또는 학습 항목이 없으면 정기 점검만 유지합니다.",
        label: "첫 실행",
        step: "01",
        title: dashboardNextActionQueueFirstAction
          ? dashboardNextActionQueueFirstAction.label
          : "대기 없음",
      },
      {
        detail:
          "큐 리포트나 Studio 실행 계획으로 여러 조치를 한 번에 정리합니다.",
        label: "실행 계획",
        step: "02",
        title: `High ${dashboardNextActionQueuePriorityCounts.high} · Med ${dashboardNextActionQueuePriorityCounts.medium} · Low ${dashboardNextActionQueuePriorityCounts.low}`,
      },
      {
        detail:
          "완료 확인 체크리스트로 원본 화면, Studio 재검토, 저장 기준을 확인합니다.",
        label: "완료 확인",
        step: "03",
        title: `개인화 ${dashboardNextActionQueueCategoryCounts.personalization} · 학습 ${dashboardNextActionQueueCategoryCounts.learning}`,
      },
    ],
    [
      dashboardNextActionQueueCategoryCounts.learning,
      dashboardNextActionQueueCategoryCounts.personalization,
      dashboardNextActionQueueFirstAction,
      dashboardNextActionQueuePriorityCounts.high,
      dashboardNextActionQueuePriorityCounts.low,
      dashboardNextActionQueuePriorityCounts.medium,
    ],
  );
  const improvementSummary = useMemo(
    () => summarizePromptImprovementPerformance(prompts, deletedPrompts),
    [deletedPrompts, prompts],
  );
  const studioPersistenceSummary = useMemo<StudioPersistenceSummaryItem[]>(() => {
    const counts: Record<StudioPersistenceMode, number> = {
      chain: 0,
      none: 0,
      ops: 0,
    };

    prompts.forEach((prompt) => {
      if (!prompt.studioSource) {
        counts.none += 1;
        return;
      }

      if (prompt.studioSource.source === "library-improvement") {
        counts.chain += 1;
        return;
      }

      counts.ops += 1;
    });

    return [
      {
        mode: "chain",
        label: "개선 체인",
        description: "원본 프롬프트와 개선본이 품질 비교 대상으로 연결됨",
        count: counts.chain,
      },
      {
        mode: "ops",
        label: "운영 출처",
        description: "Dashboard, Library, Learning, Skills 등 운영 초안에서 저장됨",
        count: counts.ops,
      },
      {
        mode: "none",
        label: "Studio 출처 없음",
        description:
          "저장 출처 메타 없음. Library에서 유지 또는 재저장 기준 점검",
        count: counts.none,
      },
    ];
  }, [prompts]);
  const missingSourceMetadataSummary = studioPersistenceSummary.find(
    (item) => item.mode === "none",
  );
  const studioSourceSummary = useMemo<StudioSourceSummaryItem[]>(() => {
    const counts = prompts.reduce(
      (accumulator, prompt) => {
        if (prompt.studioSource) {
          accumulator[prompt.studioSource.source] =
            (accumulator[prompt.studioSource.source] ?? 0) + 1;
        }

        return accumulator;
      },
      {} as Partial<Record<PromptStudioDraftSource, number>>,
    );
    const sourceTitles = prompts.reduce(
      (accumulator, prompt) => {
        const source = prompt.studioSource?.source;
        const sourceTitle = prompt.studioSource?.sourceTitle?.trim();

        if (!source || !sourceTitle) {
          return accumulator;
        }

        const titles = accumulator[source] ?? [];

        if (!titles.includes(sourceTitle) && titles.length < 3) {
          accumulator[source] = [...titles, sourceTitle];
        }

        return accumulator;
      },
      {} as Partial<Record<PromptStudioDraftSource, string[]>>,
    );
    const sourceExamples = prompts.reduce(
      (accumulator, prompt) => {
        const source = prompt.studioSource?.source;
        const sourceTitle = prompt.studioSource?.sourceTitle?.trim();

        if (!source || !sourceTitle) {
          return accumulator;
        }

        const originalHref = normalizeInternalHref(
          prompt.studioSource?.sourceHref,
        );
        const originalActionLabel = prompt.studioSource
          ? getStudioDraftDisplaySourceLabel(prompt.studioSource)
              .sourceActionLabel
          : undefined;
        const examples = accumulator[source] ?? [];

        if (
          !examples.some((example) => example.title === sourceTitle) &&
          examples.length < 3
        ) {
          accumulator[source] = [
            ...examples,
            {
              href: promptDetailLibraryHref(prompt.id),
              originalActionLabel,
              originalHref,
              title: sourceTitle,
            },
          ];
        }

        return accumulator;
      },
      {} as Partial<
        Record<
          PromptStudioDraftSource,
          {
            href: string;
            originalActionLabel?: string;
            originalHref?: string;
            title: string;
          }[]
        >
      >,
    );
    const sourceVariantCounts = prompts.reduce(
      (accumulator, prompt) => {
        const studioSource = prompt.studioSource;

        if (!studioSource?.sourceVariant) {
          return accumulator;
        }

        const variantCounts = accumulator[studioSource.source] ?? {};
        const variantLabel = getStudioDraftDisplaySourceLabel(studioSource).label;
        const previousVariant = variantCounts[studioSource.sourceVariant];

        accumulator[studioSource.source] = {
          ...variantCounts,
          [studioSource.sourceVariant]: {
            count: (previousVariant?.count ?? 0) + 1,
            label: variantLabel,
          },
        };

        return accumulator;
      },
      {} as Partial<
        Record<
          PromptStudioDraftSource,
          Partial<
            Record<
              PromptStudioDraftSourceVariant,
              { count: number; label: string }
            >
          >
        >
      >,
    );

    return promptStudioDraftSourceOptions
      .map((source) => {
        const count = counts[source] ?? 0;
        const sourceSummary = getPromptStudioSourceDashboardSummary(source);
        const sourceVariantLinks = Object.entries(
          sourceVariantCounts[source] ?? {},
        )
          .sort(
            ([leftVariant, leftValue], [rightVariant, rightValue]) =>
              rightValue.count - leftValue.count ||
              leftValue.label.localeCompare(rightValue.label, "ko") ||
              leftVariant.localeCompare(rightVariant),
          )
          .map(([sourceVariant, value]) => ({
            count: value.count,
            href: studioSourceLibraryHref({
              source,
              sourceVariant: sourceVariant as PromptStudioDraftSourceVariant,
            }),
            label: value.label,
            sourceVariant: sourceVariant as PromptStudioDraftSourceVariant,
          }));
        const sourceVariantLabels = sourceVariantLinks.map(
          (item) => `${item.label} ${item.count}개`,
        );

        return {
          source,
          label: sourceSummary.label,
          description: sourceSummary.description,
          nextAction: sourceSummary.nextAction,
          count,
          sourceExamples: sourceExamples[source] ?? [],
          sourceTitles: sourceTitles[source] ?? [],
          sourceVariantLabels,
          sourceVariantLinks,
        };
      })
      .filter((item) => item.count > 0)
      .sort(
        (left, right) =>
          right.count - left.count || left.label.localeCompare(right.label),
      )
      .slice(0, 4);
  }, [prompts]);
  const sourceHealthPreviewIssues = useMemo(
    () => improvementSummary.sourceHealthIssues.slice(0, 3),
    [improvementSummary.sourceHealthIssues],
  );
  const sourceHealthReasonBreakdown = useMemo(
    () => summarizeSourceHealthIssueReasons(improvementSummary.sourceHealthIssues),
    [improvementSummary.sourceHealthIssues],
  );
  const feedbackBasedImprovementRecords = useMemo<
    FeedbackBasedImprovementRecord[]
  >(
    () =>
      prompts
        .filter((prompt) => prompt.improvementSource?.sourceFeedback)
        .flatMap((prompt) => {
          const sourcePromptId = prompt.improvementSource?.sourcePromptId;
          const deletedSourcePrompt = deletedPrompts.find(
            (item) => item.prompt.id === sourcePromptId,
          );
          const sourcePrompt =
            prompts.find((item) => item.id === sourcePromptId) ??
            deletedSourcePrompt?.prompt;
          const sourceVersion =
            sourcePrompt?.versions.find(
              (version) =>
                version.id === prompt.improvementSource?.sourceVersionId,
            ) ??
            sourcePrompt?.versions.find(
              (version) =>
                version.targetModel ===
                prompt.improvementSource?.sourceVersionModel,
            ) ??
            sourcePrompt?.versions[0];
          const improvedVersion =
            prompt.versions.find(
              (version) => version.targetModel === sourceVersion?.targetModel,
            ) ?? prompt.versions[0];

          if (
            !sourcePrompt ||
            !sourceVersion ||
            !improvedVersion ||
            !prompt.improvementSource?.sourceFeedback
          ) {
            return [];
          }

          return [
            {
              prompt,
              sourcePrompt,
              sourceVersion,
              improvedVersion,
              targetModel: sourceVersion.targetModel,
              sourceFeedback: prompt.improvementSource.sourceFeedback,
              delta: improvedVersion.qualityScore - sourceVersion.qualityScore,
              createdAt: prompt.updatedAt || prompt.createdAt,
              sourceDeletedAt: deletedSourcePrompt?.deletedAt,
            },
          ];
        })
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        ),
    [deletedPrompts, prompts],
  );
  const feedbackImprovementAverageDelta = feedbackBasedImprovementRecords.length
    ? feedbackBasedImprovementRecords.reduce(
        (sum, record) => sum + record.delta,
        0,
      ) / feedbackBasedImprovementRecords.length
    : 0;
  const feedbackImprovementReviewCount =
    feedbackBasedImprovementRecords.filter((record) => record.delta <= 0).length;
  const feedbackImprovementArchivedSourceCount =
    feedbackBasedImprovementRecords.filter((record) => record.sourceDeletedAt)
      .length;
  const feedbackImprovementPriorityRecord =
    feedbackBasedImprovementRecords.find((record) => record.sourceDeletedAt) ??
    feedbackBasedImprovementRecords.find((record) => record.delta <= 0) ??
    feedbackBasedImprovementRecords[0] ??
    null;
  const summaryMetrics = [
    {
      href: "/library",
      label: "저장 프롬프트",
      value: prompts.length.toString(),
    },
    {
      href: "/library?sort=quality",
      label: "평균 품질",
      value: avgScore ? avgScore.toFixed(1) : "-",
    },
    {
      href: "/learning",
      label: "학습 메모리",
      value: memories.length.toString(),
    },
    {
      href: "/library?learn=company",
      label: "학습 반영",
      value: trackedLearningPromptCount.toString(),
    },
    {
      href: "/skills",
      label: "스킬",
      value: skills.length.toString(),
    },
    {
      href: "/skills",
      label: "스킬 실행",
      value: skillRunStats.totalRuns.toString(),
    },
    {
      href: "/skills",
      label: "스킬 개선",
      value: skillRunStats.improvementQueue.length.toString(),
    },
    {
      href: improvementLibraryHref({ improvement: "reimprovement" }),
      label: "재개선 후보",
      value: improvementSummary.reimprovementQueue.length.toString(),
    },
    {
      href: improvementLibraryHref({ improvement: "archived-source" }),
      label: "보관함 원본",
      value: improvementSummary.archivedSourceCount.toString(),
    },
    {
      href: improvementLibraryHref({ improvement: "unmeasured" }),
      label: "측정 불가",
      value: improvementSummary.unmeasuredCount.toString(),
    },
  ];
  const dashboardOperatingFlowItems: ContextOperatingFlowItem[] = [
    {
      actionLabel: "Data 열기",
      detail: `${dataReadinessDone}/${dataReadinessChecks.length} 준비 · ${dataReadinessScore}%`,
      href: "/data",
      label: "준비",
      step: "01",
      title: "데이터와 백업 상태 확인",
    },
    {
      actionLabel: "첫 실행 열기",
      detail: dashboardNextActionQueueFirstAction
        ? `${learningOpsPriorityLabel(
            dashboardNextActionQueueFirstAction.priority,
          )} · ${dashboardNextActionQueueFirstAction.categoryLabel}`
        : "정기 점검",
      href: dashboardNextActionQueueFirstAction?.href ?? "/learning",
      label: "첫 실행",
      step: "02",
      title: dashboardNextActionQueueFirstAction?.label ?? "학습 기준 점검",
    },
    {
      actionLabel: "Studio 열기",
      detail: engineStatusFailed
        ? "Fallback"
        : engineStatus?.mode === "openai"
          ? "OpenAI 보강"
          : "Local fallback",
      href: "/studio",
      label: "생성",
      step: "03",
      title: "Studio에서 프롬프트 생성",
    },
    {
      actionLabel: "Library 열기",
      detail: "복사 · Studio 전송 · 저장",
      href: "/library",
      label: "검증",
      step: "04",
      title: "결과와 이력 확인",
    },
  ];
  const dashboardExecutionSummaryItems = [
    {
      actionLabel: "열기",
      detail: dashboardNextActionQueueFirstAction
        ? `${learningOpsPriorityLabel(
            dashboardNextActionQueueFirstAction.priority,
          )} · ${dashboardNextActionQueueFirstAction.categoryLabel}`
        : "정기 점검 기준으로 학습 메모리를 먼저 확인합니다.",
      href: dashboardNextActionQueueFirstAction?.href ?? "/learning",
      label: "먼저 처리",
      title: dashboardNextActionQueueFirstAction?.label ?? "학습 기준 점검",
    },
    {
      actionLabel: "Studio",
      detail: engineStatusFailed
        ? "상태 확인 실패 · 로컬 fallback 기준으로 생성합니다."
        : engineStatus?.mode === "openai"
          ? `OpenAI Responses API · ${engineStatus.model}`
          : "API 키 없이 로컬 프롬프트 빌더로 생성합니다.",
      href: "/studio",
      label: "생성 상태",
      title:
        !engineStatusFailed && engineStatus?.mode === "openai"
          ? "OpenAI 보강 가능"
          : "Local fallback",
    },
    {
      actionLabel: "Library",
      detail: `${improvementSummary.reimprovementQueue.length}개 재개선 후보 · ${feedbackImprovementReviewCount}개 피드백 재검토`,
      href: "/library",
      label: "검증 위치",
      title: `${prompts.length}개 저장본`,
    },
  ];

  function openReimprovementInStudio(record: PromptImprovementRecord) {
    const rawInput = buildDashboardReimprovementBrief(record);
    const wroteDraft = writeStudioDraft({
      source: "library-improvement",
      rawInput,
      goal: "프롬프트 재개선",
      domain: record.prompt.domain || record.sourcePrompt.domain,
      targetModels: [record.targetModel],
      outputLanguage: record.prompt.outputLanguage ?? "korean",
      sourcePromptId: record.prompt.id,
      sourceVersionId: record.improvedVersion.id,
      sourceVersionModel: record.targetModel,
      sourceTitle: record.prompt.title,
      sourceHref: promptDetailLibraryHref(record.prompt.id, record.targetModel),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setFeedbackImprovementPriorityCopyStatus("failed");
      setFeedbackImprovementOpsManualCopy({
        title: `${record.prompt.title} 재개선 Studio 초안`,
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-improvement");
  }

  async function copyPersonalizationReport() {
    const reportText = buildDashboardPersonalizationReportText({
      baseUrl: window.location.origin,
      companyMemoryCount,
      companyProfile,
      companyCompletion,
      dataReadinessScore,
      learningOpsActions,
      memories,
      personalizationActions,
      profileCompletion,
      prompts,
      scopeSummaries: learningScopeSummaries,
      skills,
      trackedLearningPromptCount,
      userMemoryCount,
      userProfile,
    });
    const copied = await copyTextToClipboard(reportText);

    setPersonalizationReportCopyStatus(copied ? "copied" : "failed");
    setPersonalizationManualCopy(
      copied
        ? null
        : {
            title: "개인화 기준 리포트",
            body: reportText,
          },
    );
  }

  async function copyPersonalizationActionReport(action: LearningOpsAction) {
    const reportText = buildDashboardPersonalizationActionReportText({
      action,
      baseUrl: window.location.origin,
      companyMemoryCount,
      companyProfile,
      companyCompletion,
      dataReadinessScore,
      learningOpsActions,
      memories,
      personalizationActions,
      profileCompletion,
      prompts,
      scopeSummaries: learningScopeSummaries,
      skills,
      trackedLearningPromptCount,
      userMemoryCount,
      userProfile,
    });
    const copied = await copyTextToClipboard(reportText);

    setPersonalizationActionCopyStatus({
      label: action.label,
      status: copied ? "copied" : "failed",
    });
    setPersonalizationManualCopy(
      copied
        ? null
        : {
            title: action.label,
            body: reportText,
          },
    );
  }

  function openPersonalizationReportInStudio() {
    const rawInput = buildDashboardPersonalizationStudioPrompt({
      baseUrl: window.location.origin,
      companyMemoryCount,
      companyProfile,
      companyCompletion,
      dataReadinessScore,
      learningOpsActions,
      memories,
      personalizationActions,
      profileCompletion,
      prompts,
      scopeSummaries: learningScopeSummaries,
      skills,
      trackedLearningPromptCount,
      userMemoryCount,
      userProfile,
    });
    const wroteDraft = writeStudioDraft({
      source: "dashboard-personalization",
      rawInput,
      goal: "개인화 기준 개선 계획",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Dashboard 개인화 기준 리포트",
      sourceHref: "/",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setPersonalizationReportCopyStatus("failed");
      setPersonalizationManualCopy({
        title: "Dashboard 개인화 기준 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=dashboard-personalization");
  }

  function openPersonalizationActionInStudio(
    action: LearningOpsAction,
    fallbackTarget: "personalization" | "next-action-queue" =
      "personalization",
  ) {
    const rawInput = buildDashboardPersonalizationActionStudioPrompt({
      action,
      baseUrl: window.location.origin,
      companyMemoryCount,
      companyProfile,
      companyCompletion,
      dataReadinessScore,
      learningOpsActions,
      memories,
      personalizationActions,
      profileCompletion,
      prompts,
      scopeSummaries: learningScopeSummaries,
      skills,
      trackedLearningPromptCount,
      userMemoryCount,
      userProfile,
    });
    const wroteDraft = writeStudioDraft({
      source: "dashboard-personalization-action",
      rawInput,
      goal: action.label,
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: action.label,
      sourceHref: "/",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setPersonalizationActionCopyStatus({
        label: action.label,
        status: "failed",
      });
      const fallback = {
        title: `${action.label} Studio 초안`,
        body: rawInput,
      };

      if (fallbackTarget === "next-action-queue") {
        setDashboardNextActionQueueManualCopy(fallback);
      } else {
        setPersonalizationManualCopy(fallback);
      }
      return;
    }

    router.push("/studio?draft=dashboard-personalization-action");
  }

  async function copyDashboardNextActionQueueReport() {
    const reportText = buildDashboardNextActionQueueReportText({
      baseUrl: window.location.origin,
      companyCompletion,
      dataReadinessScore,
      memoryCount: memories.length,
      profileCompletion,
      queue: dashboardNextActionQueue,
      trackedLearningPromptCount,
    });
    const copied = await copyTextToClipboard(reportText);

    setDashboardNextActionQueueReportCopyStatus(copied ? "copied" : "failed");
    setDashboardNextActionQueueManualCopy(
      copied
        ? null
        : {
            title: "Dashboard 다음 실행 큐 리포트",
            body: reportText,
          },
    );
  }

  async function copyDashboardNextActionQueueLinks() {
    const linksText = buildDashboardNextActionQueueLinksText({
      baseUrl: window.location.origin,
      queue: dashboardNextActionQueue,
    });
    const copied = await copyTextToClipboard(linksText);

    setDashboardNextActionQueueLinksCopyStatus(copied ? "copied" : "failed");
    setDashboardNextActionQueueManualCopy(
      copied
        ? null
        : {
            title: "Dashboard 다음 실행 큐 링크",
            body: linksText,
          },
    );
  }

  async function copyDashboardNextActionQueueVerificationChecklist() {
    const checklistText = buildDashboardNextActionQueueVerificationChecklistText();
    const copied = await copyTextToClipboard(checklistText);

    setDashboardNextActionQueueVerificationCopyStatus(
      copied ? "copied" : "failed",
    );
    setDashboardNextActionQueueManualCopy(
      copied
        ? null
        : {
            title: "Dashboard 다음 실행 큐 완료 확인",
            body: checklistText,
          },
    );
  }

  function openDashboardNextActionQueueVerificationInStudio() {
    const rawInput = buildDashboardNextActionQueueVerificationStudioPrompt({
      baseUrl: window.location.origin,
      companyCompletion,
      dataReadinessScore,
      memoryCount: memories.length,
      profileCompletion,
      queue: dashboardNextActionQueue,
      trackedLearningPromptCount,
    });
    const wroteDraft = writeStudioDraft({
      source: "dashboard-next-action-queue",
      sourceVariant: "dashboard-next-action-queue-verification",
      rawInput,
      goal: "Dashboard 다음 실행 큐 완료 확인 계획",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Dashboard 다음 실행 큐 완료 확인",
      sourceHref: "/",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setDashboardNextActionQueueVerificationCopyStatus("failed");
      setDashboardNextActionQueueManualCopy({
        title: "Dashboard 다음 실행 큐 완료 확인",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=dashboard-next-action-queue-verification");
  }

  async function copyDashboardNextActionQueueItemLink(
    item: DashboardNextActionQueueItem,
  ) {
    const absoluteHref = formatAbsoluteInternalHref(
      item.href,
      window.location.origin,
    ) ?? item.href;
    const copied = await copyTextToClipboard(absoluteHref);

    setDashboardNextActionQueueLinkCopyStatus({
      key: item.actionKey,
      status: copied ? "copied" : "failed",
    });
    setDashboardNextActionQueueManualCopy(
      copied
        ? null
        : {
            title: `${item.label} 링크`,
            body: absoluteHref,
          },
    );
  }

  async function copyDashboardNextActionQueueItemReport(
    item: DashboardNextActionQueueItem,
  ) {
    const reportText =
      item.category === "personalization"
        ? buildDashboardPersonalizationActionReportText({
            action: item,
            baseUrl: window.location.origin,
            companyMemoryCount,
            companyProfile,
            companyCompletion,
            dataReadinessScore,
            learningOpsActions,
            memories,
            personalizationActions,
            profileCompletion,
            prompts,
            scopeSummaries: learningScopeSummaries,
            skills,
            trackedLearningPromptCount,
            userMemoryCount,
            userProfile,
          })
        : buildDashboardLearningActionReportText({
            action: item,
            baseUrl: window.location.origin,
            memories,
            queues: learningReviewQueues,
            scopeSummaries: learningScopeSummaries,
            trackedPromptCount: trackedLearningPromptCount,
          });
    const copied = await copyTextToClipboard(reportText);

    if (item.category === "personalization") {
      setPersonalizationActionCopyStatus({
        label: item.label,
        status: copied ? "copied" : "failed",
      });
    } else {
      setLearningOpsActionCopyStatus({
        label: item.label,
        status: copied ? "copied" : "failed",
      });
    }

    setDashboardNextActionQueueManualCopy(
      copied
        ? null
        : {
            title: `${item.label} 리포트`,
            body: reportText,
          },
    );
  }

  function openDashboardNextActionQueueInStudio() {
    const rawInput = buildDashboardNextActionQueueStudioPrompt({
      baseUrl: window.location.origin,
      companyCompletion,
      dataReadinessScore,
      memoryCount: memories.length,
      profileCompletion,
      queue: dashboardNextActionQueue,
      trackedLearningPromptCount,
    });
    const wroteDraft = writeStudioDraft({
      source: "dashboard-next-action-queue",
      rawInput,
      goal: "Dashboard 다음 실행 큐 실행 계획",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Dashboard 다음 실행 큐",
      sourceHref: "/",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setDashboardNextActionQueueReportCopyStatus("failed");
      setDashboardNextActionQueueManualCopy({
        title: "Dashboard 다음 실행 큐",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=dashboard-next-action-queue");
  }

  async function copyLearningOpsReport() {
    const reportText = buildDashboardLearningOpsReportText({
      actions: learningOpsActions,
      baseUrl: window.location.origin,
      memories,
      queues: learningReviewQueues,
      scopeSummaries: learningScopeSummaries,
      trackedPromptCount: trackedLearningPromptCount,
    });
    const copied = await copyTextToClipboard(
      reportText,
    );

    setLearningOpsReportCopyStatus(copied ? "copied" : "failed");
    setLearningOpsManualCopy(
      copied
        ? null
        : {
            title: "학습 운영 리포트",
            body: reportText,
          },
    );
  }

  async function copyLearningOpsActionReport(action: LearningOpsAction) {
    const reportText = buildDashboardLearningActionReportText({
      action,
      baseUrl: window.location.origin,
      memories,
      queues: learningReviewQueues,
      scopeSummaries: learningScopeSummaries,
      trackedPromptCount: trackedLearningPromptCount,
    });
    const copied = await copyTextToClipboard(
      reportText,
    );

    setLearningOpsActionCopyStatus({
      label: action.label,
      status: copied ? "copied" : "failed",
    });
    setLearningOpsManualCopy(
      copied
        ? null
        : {
            title: action.label,
            body: reportText,
          },
    );
  }

  function openLearningOpsReportInStudio() {
    const rawInput = buildDashboardLearningOpsStudioPrompt({
      actions: learningOpsActions,
      baseUrl: window.location.origin,
      memories,
      queues: learningReviewQueues,
      scopeSummaries: learningScopeSummaries,
      trackedPromptCount: trackedLearningPromptCount,
    });
    const wroteDraft = writeStudioDraft({
      source: "dashboard-learning-ops",
      rawInput,
      goal: "학습 운영 개선 계획",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Dashboard Learning 운영 리포트",
      sourceHref: "/",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setLearningOpsReportCopyStatus("failed");
      setLearningOpsManualCopy({
        title: "Dashboard Learning 운영 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=dashboard-learning-ops");
  }

  function openLearningOpsActionInStudio(
    action: LearningOpsAction,
    fallbackTarget: "learning" | "next-action-queue" = "learning",
  ) {
    const rawInput = buildDashboardLearningActionStudioPrompt({
      action,
      baseUrl: window.location.origin,
      memories,
      queues: learningReviewQueues,
      scopeSummaries: learningScopeSummaries,
      trackedPromptCount: trackedLearningPromptCount,
    });
    const wroteDraft = writeStudioDraft({
      source: "dashboard-learning-action",
      rawInput,
      goal: action.label,
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: action.label,
      sourceHref: "/",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setLearningOpsActionCopyStatus({
        label: action.label,
        status: "failed",
      });
      const fallback = {
        title: `${action.label} Studio 초안`,
        body: rawInput,
      };

      if (fallbackTarget === "next-action-queue") {
        setDashboardNextActionQueueManualCopy(fallback);
      } else {
        setLearningOpsManualCopy(fallback);
      }
      return;
    }

    router.push("/studio?draft=dashboard-learning-action");
  }

  async function copySkillOpsReport() {
    const reportText = buildDashboardSkillOpsReportText({
      baseUrl: window.location.origin,
      stats: skillRunStats,
    });
    const copied = await copyTextToClipboard(reportText);

    setSkillOpsReportCopyStatus(copied ? "copied" : "failed");
    setSkillOpsManualCopy(
      copied
        ? null
        : {
            title: "스킬 운영 리포트",
            body: reportText,
          },
    );
  }

  async function copySkillOpsLatestRunLink() {
    if (!skillRunStats.latestRun) {
      return;
    }

    const href = buildPromptLibraryHref(skillRunStats.latestRun);
    const absoluteHref =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copied = await copyTextToClipboard(absoluteHref);

    setSkillOpsLatestRunLinkCopyStatus(copied ? "copied" : "failed");
    setSkillOpsManualCopy(
      copied
        ? null
        : {
            title: "최근 스킬 실행 Library 링크",
            body: absoluteHref,
          },
    );
  }

  async function copySkillOpsSkillLink({
    key,
    skillId,
    title,
  }: {
    key: string;
    skillId: string;
    title: string;
  }) {
    const href = buildSkillHref(skillId);
    const absoluteHref =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copied = await copyTextToClipboard(absoluteHref);

    setSkillOpsSkillLinkCopyStatus({
      key,
      status: copied ? "copied" : "failed",
    });
    setSkillOpsManualCopy(
      copied
        ? null
        : {
            title,
            body: absoluteHref,
          },
    );
  }

  function openSkillOpsReportInStudio() {
    const rawInput = buildDashboardSkillOpsStudioPrompt({
      baseUrl: window.location.origin,
      stats: skillRunStats,
    });
    const wroteDraft = writeStudioDraft({
      source: "dashboard-skill-ops",
      rawInput,
      goal: "스킬 운영 개선 계획",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Dashboard 스킬 운영 리포트",
      sourceHref: "/",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setSkillOpsReportCopyStatus("failed");
      setSkillOpsManualCopy({
        title: "Dashboard 스킬 운영 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=dashboard-skill-ops");
  }

  async function copyFeedbackImprovementOpsReport() {
    const reportText = buildDashboardFeedbackImprovementOpsReportText({
      baseUrl: window.location.origin,
      improvementSummary,
      records: feedbackBasedImprovementRecords,
    });
    const copied = await copyTextToClipboard(reportText);

    setFeedbackImprovementOpsReportCopyStatus(copied ? "copied" : "failed");
    setFeedbackImprovementOpsManualCopy(
      copied
        ? null
        : {
            title: "피드백 반영 개선 리포트",
            body: reportText,
          },
    );
  }

  function openFeedbackImprovementOpsReportInStudio() {
    const rawInput = buildDashboardFeedbackImprovementOpsStudioPrompt({
      baseUrl: window.location.origin,
      improvementSummary,
      records: feedbackBasedImprovementRecords,
    });
    const wroteDraft = writeStudioDraft({
      source: "dashboard-feedback-improvement-ops",
      rawInput,
      goal: "피드백 반영 개선 계획",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Dashboard 피드백 반영 개선 리포트",
      sourceHref: "/",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setFeedbackImprovementOpsReportCopyStatus("failed");
      setFeedbackImprovementOpsManualCopy({
        title: "Dashboard 피드백 반영 개선 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=dashboard-feedback-improvement-ops");
  }

  async function copyFeedbackImprovementPriorityReport() {
    if (!feedbackImprovementPriorityRecord) {
      return;
    }

    const reportText = buildDashboardFeedbackImprovementPriorityReportText({
      baseUrl: window.location.origin,
      record: feedbackImprovementPriorityRecord,
    });
    const copied = await copyTextToClipboard(reportText);

    setFeedbackImprovementPriorityCopyStatus(copied ? "copied" : "failed");
    setFeedbackImprovementOpsManualCopy(
      copied
        ? null
        : {
            title: "피드백 개선 우선 점검 리포트",
            body: reportText,
          },
    );
  }

  function openFeedbackImprovementPriorityInStudio() {
    if (!feedbackImprovementPriorityRecord) {
      return;
    }

    const rawInput = buildDashboardFeedbackImprovementPriorityStudioPrompt({
      baseUrl: window.location.origin,
      record: feedbackImprovementPriorityRecord,
    });
    const wroteDraft = writeStudioDraft({
      source: "dashboard-feedback-improvement-ops",
      rawInput,
      goal: "피드백 개선 우선 점검 계획",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Dashboard 피드백 개선 우선 점검",
      sourceHref: "/",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setFeedbackImprovementPriorityCopyStatus("failed");
      setFeedbackImprovementOpsManualCopy({
        title: "Dashboard 피드백 개선 우선 점검",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=dashboard-feedback-improvement-ops");
  }

  function openStudioSourceOpsReportInStudio() {
    const rawInput = buildDashboardStudioSourceOpsStudioPrompt({
      baseUrl: window.location.origin,
      persistenceSummary: studioPersistenceSummary,
      sourceSummary: studioSourceSummary,
    });
    const wroteDraft = writeStudioDraft({
      source: "dashboard-studio-source-ops",
      rawInput,
      goal: "Studio 저장 출처 운영 기준 정리",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Dashboard Studio 저장 출처 운영 리포트",
      sourceHref: "/",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioSourceOpsReportCopyStatus("failed");
      setStudioSourceOpsManualCopy({
        title: "Dashboard Studio 저장 출처 운영 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=dashboard-studio-source-ops");
  }

  async function copyStudioSourceOpsReport() {
    const reportText = buildDashboardStudioSourceOpsReportText({
      baseUrl: window.location.origin,
      persistenceSummary: studioPersistenceSummary,
      sourceSummary: studioSourceSummary,
    });
    const copied = await copyTextToClipboard(reportText);

    setStudioSourceOpsReportCopyStatus(copied ? "copied" : "failed");
    setStudioSourceOpsManualCopy(
      copied
        ? null
        : {
            title: "Dashboard Studio 저장 출처 운영 리포트",
            body: reportText,
          },
    );
  }

  async function copyMissingSourceMetadataQueuePrompt() {
    const promptText = buildDashboardMissingSourceMetadataQueueStudioPrompt({
      baseUrl: window.location.origin,
      persistenceSummary: studioPersistenceSummary,
    });
    const copied = await copyTextToClipboard(promptText);

    setMissingSourceMetadataQueueCopyStatus(copied ? "copied" : "failed");
    setMissingSourceMetadataQueueManualCopy(
      copied
        ? null
        : {
            title: "Dashboard 저장 출처 메타 없음 큐 운영 프롬프트",
            body: promptText,
          },
    );
  }

  async function copyMissingSourceMetadataQueueLink() {
    const queueHref =
      formatAbsoluteInternalHref(
        studioPersistenceLibraryHref("none"),
        window.location.origin,
      ) ?? studioPersistenceLibraryHref("none");
    const copied = await copyTextToClipboard(queueHref);

    setMissingSourceMetadataQueueLinkCopyStatus(copied ? "copied" : "failed");
    setMissingSourceMetadataQueueManualCopy(
      copied
        ? null
        : {
            title: "Dashboard 저장 출처 메타 없음 큐 링크",
            body: queueHref,
          },
    );
  }

  function openMissingSourceMetadataQueueInStudio() {
    const rawInput = buildDashboardMissingSourceMetadataQueueStudioPrompt({
      baseUrl: window.location.origin,
      persistenceSummary: studioPersistenceSummary,
    });
    const wroteDraft = writeStudioDraft({
      source: "library-missing-source-metadata-queue",
      rawInput,
      goal: "저장 출처 메타 없음 큐 운영 기준 정리",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Dashboard 저장 출처 메타 없음 큐",
      sourceHref: studioPersistenceLibraryHref("none"),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setMissingSourceMetadataQueueCopyStatus("failed");
      setMissingSourceMetadataQueueManualCopy({
        title: "Dashboard 저장 출처 메타 없음 큐",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-missing-source-metadata-queue");
  }

  async function copyStudioPersistenceLink(item: StudioPersistenceSummaryItem) {
    const href = studioPersistenceLibraryHref(item.mode);
    const absoluteHref =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copied = await copyTextToClipboard(absoluteHref);

    setStudioPersistenceLinkCopyStatus({
      key: item.mode,
      status: copied ? "copied" : "failed",
    });
    setStudioPersistenceManualCopy(
      copied
        ? null
        : {
            title: `Studio 저장 방식 링크 · ${item.label}`,
            body: absoluteHref,
          },
    );
  }

  async function copyStudioPersistenceAllLink() {
    const href = "/library";
    const absoluteHref =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copied = await copyTextToClipboard(absoluteHref);

    setStudioPersistenceAllLinkCopyStatus(copied ? "copied" : "failed");
    setStudioPersistenceManualCopy(
      copied
        ? null
        : {
            title: "Studio 저장 방식 전체 링크",
            body: absoluteHref,
          },
    );
  }

  async function copyStudioSourceExampleLink({
    href,
    linkLabel = "대표 저장본 상세",
    originalHref,
    title,
  }: {
    href: string;
    linkLabel?: string;
    originalHref?: string;
    title: string;
  }) {
    const absoluteHref =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const absoluteOriginalHref = originalHref
      ? (formatAbsoluteInternalHref(originalHref, window.location.origin) ??
        originalHref)
      : null;
    const manualCopyBody = [
      absoluteHref,
      "",
      `- 출처 제목: ${title}`,
      `- 링크 유형: ${linkLabel}`,
      ...(absoluteOriginalHref ? [`- 원본 경로: ${absoluteOriginalHref}`] : []),
    ].join("\n");
    const copied = await copyTextToClipboard(absoluteHref);

    setStudioSourceExampleLinkCopyStatus({
      key: href,
      status: copied ? "copied" : "failed",
    });
    setStudioSourceExampleManualCopy(
      copied
        ? null
        : {
            title: `${linkLabel} 링크 · ${title}`,
            body: manualCopyBody,
          },
    );
  }

  async function copyStudioSourceFilterLink({
    source,
    label,
  }: {
    source: PromptStudioDraftSource;
    label: string;
  }) {
    const href = studioSourceLibraryHref({ source });
    const absoluteHref =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copied = await copyTextToClipboard(absoluteHref);

    setStudioSourceFilterLinkCopyStatus({
      key: source,
      status: copied ? "copied" : "failed",
    });
    setStudioSourceFilterManualCopy(
      copied
        ? null
        : {
            title: `Studio 저장 출처 필터 링크 · ${label}`,
            body: absoluteHref,
          },
    );
  }

  async function copyStudioSourceVariantFilterLink({
    href,
    label,
    source,
    sourceVariant,
  }: {
    href: string;
    label: string;
    source: PromptStudioDraftSource;
    sourceVariant: PromptStudioDraftSourceVariant;
  }) {
    const absoluteHref =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const key = `${source}:${sourceVariant}`;
    const copied = await copyTextToClipboard(absoluteHref);

    setStudioSourceFilterLinkCopyStatus({
      key,
      status: copied ? "copied" : "failed",
    });
    setStudioSourceFilterManualCopy(
      copied
        ? null
        : {
            title: `Studio 세부 초안 유형 필터 링크 · ${label}`,
            body: absoluteHref,
          },
    );
  }

  async function copyStudioSourceAllFilterLink() {
    const href = studioSourceLibraryHref();
    const absoluteHref =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copied = await copyTextToClipboard(absoluteHref);

    setStudioSourceAllFilterLinkCopyStatus(copied ? "copied" : "failed");
    setStudioSourceFilterManualCopy(
      copied
        ? null
        : {
            title: "Studio 저장 출처 전체 필터 링크",
            body: absoluteHref,
          },
    );
  }

  async function copySourceHealthActionReport() {
    const reportText = buildDashboardSourceHealthActionReport({
      improvementSummary,
      baseUrl: window.location.origin,
    });
    const copied = await copyTextToClipboard(reportText);

    setSourceHealthActionCopyStatus(copied ? "copied" : "failed");
    setSourceHealthManualCopy(
      copied
        ? null
        : {
            title: "개선 출처 상태 조치 계획",
            body: reportText,
      },
    );
  }

  async function copySourceHealthCandidateMemo(issue: PromptSourceHealthIssue) {
    const memoText = buildDashboardSourceHealthCandidateMemo(
      issue,
      window.location.origin,
    );
    const copied = await copyTextToClipboard(memoText);
    const candidateKey = sourceHealthIssueKey(issue);

    setSourceHealthCandidateCopyStatus({
      key: candidateKey,
      status: copied ? "copied" : "failed",
    });
    setSourceHealthManualCopy(
      copied
        ? null
        : {
            title: "개선 출처 상태 후보 메모",
            body: memoText,
          },
    );
  }

  async function copySourceHealthLink({
    href,
    key,
    title,
  }: {
    href: string;
    key: string;
    title: string;
  }) {
    const absoluteHref =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copied = await copyTextToClipboard(absoluteHref);

    setSourceHealthLinkCopyStatus({
      key,
      status: copied ? "copied" : "failed",
    });
    setSourceHealthManualCopy(
      copied
        ? null
        : {
            title,
            body: absoluteHref,
          },
    );
  }

  function openSourceHealthCandidateInStudio(issue: PromptSourceHealthIssue) {
    const rawInput = buildDashboardSourceHealthCandidateMemo(
      issue,
      window.location.origin,
    );
    const wroteDraft = writeStudioDraft({
      source: "dashboard-source-health-candidate",
      rawInput,
      goal: "개선 출처 후보 정리 계획",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: issue.prompt.title,
      sourceHref: promptDetailLibraryHref(issue.prompt.id, issue.targetModel),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setSourceHealthCandidateCopyStatus({
        key: sourceHealthIssueKey(issue),
        status: "failed",
      });
      setSourceHealthManualCopy({
        title: "개선 출처 상태 후보 Studio 초안",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=dashboard-source-health-candidate");
  }

  function openSourceHealthActionReportInStudio() {
    const rawInput = buildDashboardSourceHealthActionStudioPrompt({
      improvementSummary,
      baseUrl: window.location.origin,
    });
    const wroteDraft = writeStudioDraft({
      source: "dashboard-source-health-action",
      rawInput,
      goal: "개선 출처 상태 정리 계획",
      domain: "AI operations",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Dashboard 개선 출처 상태 조치 계획",
      sourceHref: "/",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setSourceHealthActionCopyStatus("failed");
      setSourceHealthManualCopy({
        title: "Dashboard 개선 출처 상태 조치 계획",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=dashboard-source-health-action");
  }

  function saveFeedbackImprovementPriorityMemory() {
    if (!feedbackImprovementPriorityRecord) {
      setFeedbackImprovementPriorityMemorySaveStatus("skipped");
      setFeedbackImprovementPriorityMemoryPreview(null);
      return;
    }

    const priorityMemory = buildFeedbackImprovementLearningMemory(
      feedbackImprovementPriorityRecord,
    );

    setMemories((current) =>
      mergeMemoryList(current, priorityMemory),
    );
    setFeedbackImprovementPriorityMemoryPreview(priorityMemory);
    setFeedbackImprovementPriorityMemorySaveStatus("saved");
  }

  function saveFeedbackImprovementMemories() {
    const memoriesToSave = feedbackBasedImprovementRecords.map(
      buildFeedbackImprovementLearningMemory,
    );

    if (memoriesToSave.length === 0) {
      setFeedbackImprovementMemorySaveCount(0);
      setFeedbackImprovementMemorySaveStatus("skipped");
      return;
    }

    setMemories((current) =>
      memoriesToSave.reduce(
        (nextMemories, memory) => mergeMemoryList(nextMemories, memory),
        current,
      ),
    );
    setFeedbackImprovementMemorySaveCount(memoriesToSave.length);
    setFeedbackImprovementMemorySaveStatus("saved");
  }

  return (
    <>
      <PageHeader
        title="개인화 프롬프트 운영 대시보드"
        description="원문을 영어 또는 한영 하이브리드 전문 프롬프트로 바꾸고, AI별 버전과 피드백을 축적하는 작업 공간입니다."
        action={
          <Link href="/studio" className={primaryButtonClass}>
            새 프롬프트 생성
          </Link>
        }
      />

      <section
        className="mb-6 rounded-lg border border-line bg-panel px-5 py-4"
        data-testid="dashboard-execution-summary"
      >
        <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-soft">
              오늘의 실행 요약
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              첫 실행, 생성 상태, 저장 검증 위치를 한 줄로 확인합니다.
            </p>
          </div>
          <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted">
            준비도 {dataReadinessScore}%
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {dashboardExecutionSummaryItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group min-w-0 rounded-md border border-line bg-surface px-4 py-3 transition hover:border-accent hover:bg-panel-strong"
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="text-xs font-semibold text-muted">
                  {item.label}
                </span>
                <span className="shrink-0 text-xs font-semibold text-accent">
                  {item.actionLabel}
                </span>
              </div>
              <p className="mt-3 break-words text-sm font-semibold text-soft">
                {item.title}
              </p>
              <p className="mt-2 break-words text-xs leading-5 text-muted group-hover:text-soft">
                {item.detail}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mb-6">
        <ContextOperatingFlow
          badge="Studio에서 시작"
          badgeHref="/studio"
          description="준비 상태를 확인하고 첫 실행 항목을 처리한 뒤 생성 결과를 저장 이력까지 확인합니다."
          items={dashboardOperatingFlowItems}
          testId="dashboard-operating-flow"
          title="오늘 운영 흐름"
        />
      </div>

      <div
        className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6"
        data-testid="dashboard-workflow-shortcuts"
      >
        {workflowItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-lg border border-line bg-panel px-4 py-4 transition hover:border-accent hover:bg-panel-strong"
          >
            <p className="font-mono text-xs text-accent">{item.step}</p>
            <p className="mt-2 text-base font-semibold">{item.title}</p>
            <p className="mt-2 text-xs leading-5 text-muted group-hover:text-soft">
              {item.description}
            </p>
          </Link>
        ))}
      </div>

      <div
        data-testid="dashboard-summary-metrics"
        className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-8"
      >
        {summaryMetrics.map(({ href, label, value }) => (
          <Link
            key={label}
            href={href}
            className="min-w-0 rounded-lg border border-line bg-panel px-4 py-3 transition hover:border-accent hover:bg-panel-strong sm:px-5 sm:py-4"
          >
            <p className="break-words text-xs leading-4 text-muted sm:text-sm">
              {label}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold sm:text-3xl">
              {value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-line bg-panel px-5 py-4">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-soft">생성 엔진 상태</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {engineStatusFailed
                ? "상태 확인에 실패했습니다. 생성 시 로컬 fallback이 적용됩니다."
                : engineStatus?.configured
                  ? `OpenAI Responses API · ${engineStatus.model}`
                  : "로컬 프롬프트 빌더 · OpenAI 키 없음"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:items-center">
            <span className="rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold text-soft">
              {engineStatus?.mode === "openai" ? "보강 가능" : "Fallback"}
            </span>
            <Link href="/studio" className={secondaryButtonClass}>
              Studio에서 생성
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-panel px-5 py-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-soft">
                워크스페이스 데이터 상태
              </p>
              <span className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold text-muted">
                {dataReadinessDone}/{dataReadinessChecks.length} 준비
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted">
              {backupStatusText}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {dataReadinessChecks.map((item) => (
                <span
                  key={item.label}
                  className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                    item.ready
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-line bg-surface text-muted"
                  }`}
                >
                  {item.label}
                </span>
              ))}
            </div>
            {backupCountChanges.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {backupCountChanges.map((item) => (
                  <span
                    key={item.label}
                    className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs text-muted"
                  >
                    {item.label} {item.backup}→{item.current}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="flex items-end justify-between gap-3">
              <span className="font-mono text-3xl font-semibold">
                {dataReadinessScore}
              </span>
              <span className="pb-1 text-sm text-muted">/ 100</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${dataReadinessScore}%` }}
              />
            </div>
            <Link href="/data" className={`${secondaryButtonClass} mt-3 w-full`}>
              Data 관리 열기
            </Link>
          </div>
        </div>
      </div>

      <Panel className="mt-4">
        <PanelHeader
          title="다음 실행 큐"
          description="개인화와 학습 기준 중 지금 처리할 일을 우선순위로 묶었습니다."
        />
        <div
          className="grid gap-0 divide-y divide-line lg:grid-cols-[260px_1fr] lg:divide-x lg:divide-y-0"
          data-testid="dashboard-next-action-queue"
        >
          <div className="px-5 py-5">
            <p className="text-sm font-semibold text-soft">현재 우선순위</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-accent">
              {dashboardNextActionQueue.length}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-md border border-line bg-surface px-2 py-2">
                <p className="font-mono text-sm font-semibold text-accent">
                  {dashboardNextActionQueuePriorityCounts.high}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted">
                  High
                </p>
              </div>
              <div className="rounded-md border border-line bg-surface px-2 py-2">
                <p className="font-mono text-sm font-semibold text-soft">
                  {dashboardNextActionQueuePriorityCounts.medium}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted">
                  Med
                </p>
              </div>
              <div className="rounded-md border border-line bg-surface px-2 py-2">
                <p className="font-mono text-sm font-semibold text-muted">
                  {dashboardNextActionQueuePriorityCounts.low}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted">
                  Low
                </p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-line bg-surface px-2 py-2">
                <p className="font-mono text-sm font-semibold text-soft">
                  {dashboardNextActionQueueCategoryCounts.personalization}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted">
                  개인화
                </p>
              </div>
              <div className="rounded-md border border-line bg-surface px-2 py-2">
                <p className="font-mono text-sm font-semibold text-soft">
                  {dashboardNextActionQueueCategoryCounts.learning}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted">
                  학습
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              High 항목을 먼저 처리하고, 완료 후 Studio에서 새 프롬프트를 생성해
              품질 변화를 확인합니다.
            </p>
            <div
              data-testid="dashboard-next-action-workflow"
              className="mt-3 grid gap-2"
            >
              {dashboardNextActionQueueWorkflowSteps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-md border border-line bg-surface px-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] font-semibold text-accent">
                      {item.step}
                    </span>
                    <p className="text-xs font-semibold text-muted">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-2 break-words text-xs font-semibold text-soft">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
            {dashboardNextActionQueueFirstAction ? (
              <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  첫 실행
                </p>
                <p className="mt-1 break-words text-xs font-semibold text-soft">
                  {`[${learningOpsPriorityLabel(
                    dashboardNextActionQueueFirstAction.priority,
                  )}] ${dashboardNextActionQueueFirstAction.categoryLabel} · ${
                    dashboardNextActionQueueFirstAction.label
                  }`}
                </p>
                <div className="mt-3 grid gap-2">
                  <Link
                    href={dashboardNextActionQueueFirstAction.href}
                    data-testid="dashboard-next-action-first-open"
                    className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                  >
                    첫 실행 열기
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      copyDashboardNextActionQueueItemLink(
                        dashboardNextActionQueueFirstAction,
                      )
                    }
                    data-testid="dashboard-next-action-first-link-copy"
                    className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                  >
                    {dashboardNextActionQueueLinkCopyStatus?.key ===
                      dashboardNextActionQueueFirstAction.actionKey &&
                    dashboardNextActionQueueLinkCopyStatus.status === "copied"
                      ? "첫 실행 링크 복사됨"
                      : dashboardNextActionQueueLinkCopyStatus?.key ===
                            dashboardNextActionQueueFirstAction.actionKey &&
                          dashboardNextActionQueueLinkCopyStatus.status ===
                            "failed"
                        ? "첫 실행 링크 실패"
                        : "첫 실행 링크 복사"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dashboardNextActionQueueFirstAction.category ===
                      "personalization"
                        ? openPersonalizationActionInStudio(
                            dashboardNextActionQueueFirstAction,
                            "next-action-queue",
                          )
                        : openLearningOpsActionInStudio(
                            dashboardNextActionQueueFirstAction,
                            "next-action-queue",
                          )
                    }
                    data-testid="dashboard-next-action-first-studio"
                    className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                  >
                    첫 실행 Studio로
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyDashboardNextActionQueueItemReport(
                        dashboardNextActionQueueFirstAction,
                      )
                    }
                    data-testid="dashboard-next-action-first-report-copy"
                    className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                  >
                    {dashboardNextActionQueueFirstAction.category ===
                      "personalization" &&
                    personalizationActionCopyStatus?.label ===
                      dashboardNextActionQueueFirstAction.label &&
                    personalizationActionCopyStatus.status === "copied"
                      ? "첫 실행 리포트 복사됨"
                      : dashboardNextActionQueueFirstAction.category ===
                            "personalization" &&
                          personalizationActionCopyStatus?.label ===
                            dashboardNextActionQueueFirstAction.label &&
                          personalizationActionCopyStatus.status === "failed"
                        ? "첫 실행 리포트 실패"
                        : dashboardNextActionQueueFirstAction.category ===
                              "learning" &&
                            learningOpsActionCopyStatus?.label ===
                              dashboardNextActionQueueFirstAction.label &&
                            learningOpsActionCopyStatus.status === "copied"
                          ? "첫 실행 리포트 복사됨"
                          : dashboardNextActionQueueFirstAction.category ===
                                "learning" &&
                              learningOpsActionCopyStatus?.label ===
                                dashboardNextActionQueueFirstAction.label &&
                              learningOpsActionCopyStatus.status === "failed"
                            ? "첫 실행 리포트 실패"
                            : "첫 실행 리포트 복사"}
                  </button>
                </div>
              </div>
            ) : null}
            <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                완료 확인
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
                {dashboardNextActionQueueVerificationChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copyDashboardNextActionQueueVerificationChecklist}
                  data-testid="dashboard-next-action-queue-verification-copy"
                  className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                >
                  {dashboardNextActionQueueVerificationCopyStatus === "copied"
                    ? "완료 확인 복사됨"
                    : dashboardNextActionQueueVerificationCopyStatus === "failed"
                      ? "완료 확인 복사 실패"
                      : "완료 확인 복사"}
                </button>
                <button
                  type="button"
                  onClick={openDashboardNextActionQueueVerificationInStudio}
                  data-testid="dashboard-next-action-queue-verification-studio"
                  className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                >
                  완료 확인 Studio로
                </button>
              </div>
            </div>
            <Link href="/learning" className={`${secondaryButtonClass} mt-4 w-full`}>
              Learning 전체 보기
            </Link>
            <div className="mt-2 grid gap-2">
              <button
                type="button"
                onClick={copyDashboardNextActionQueueReport}
                data-testid="dashboard-next-action-queue-report-copy"
                className={`${secondaryButtonClass} w-full`}
              >
                  {dashboardNextActionQueueReportCopyStatus === "copied"
                    ? "큐 리포트 복사됨"
                    : dashboardNextActionQueueReportCopyStatus === "failed"
                      ? "큐 리포트 복사 실패"
                      : "큐 리포트 복사"}
              </button>
              <button
                type="button"
                onClick={copyDashboardNextActionQueueLinks}
                data-testid="dashboard-next-action-queue-links-copy"
                className={`${secondaryButtonClass} w-full`}
              >
                {dashboardNextActionQueueLinksCopyStatus === "copied"
                  ? "큐 링크 복사됨"
                  : dashboardNextActionQueueLinksCopyStatus === "failed"
                    ? "큐 링크 복사 실패"
                    : "큐 링크 목록 복사"}
              </button>
              <button
                type="button"
                onClick={openDashboardNextActionQueueInStudio}
                data-testid="dashboard-next-action-queue-studio"
                className={`${secondaryButtonClass} w-full`}
              >
                큐 Studio로 보내기
              </button>
            </div>
          </div>
          <div className="divide-y divide-line">
            {dashboardNextActionQueue.map((item) => {
              const copyStatus =
                item.category === "personalization"
                  ? personalizationActionCopyStatus?.label === item.label
                    ? personalizationActionCopyStatus.status
                    : null
                  : learningOpsActionCopyStatus?.label === item.label
                    ? learningOpsActionCopyStatus.status
                    : null;
              const linkCopyStatus =
                dashboardNextActionQueueLinkCopyStatus?.key === item.actionKey
                  ? dashboardNextActionQueueLinkCopyStatus.status
                  : null;

              return (
                <div
                  key={item.actionKey}
                  className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold text-muted">
                        {item.categoryLabel}
                      </span>
                      <span
                        className={`rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs ${
                          item.priority === "high"
                            ? "text-accent"
                            : item.priority === "medium"
                              ? "text-soft"
                              : "text-muted"
                        }`}
                      >
                        {learningOpsPriorityLabel(item.priority)}
                      </span>
                    </div>
                    <Link
                      href={item.href}
                      className="mt-2 block transition hover:text-accent"
                    >
                      <p className="break-words text-sm font-semibold">
                        {item.label}
                      </p>
                      <p className="mt-1 break-words text-xs leading-5 text-muted">
                        {item.description}
                      </p>
                    </Link>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[480px] lg:grid-cols-4">
                    <Link
                      href={item.href}
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      바로 열기
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        item.category === "personalization"
                          ? openPersonalizationActionInStudio(
                              item,
                              "next-action-queue",
                            )
                          : openLearningOpsActionInStudio(
                              item,
                              "next-action-queue",
                            )
                      }
                      data-testid="dashboard-next-action-studio"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      Studio로
                    </button>
                    <button
                      type="button"
                      onClick={() => copyDashboardNextActionQueueItemLink(item)}
                      data-testid="dashboard-next-action-link-copy"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      {linkCopyStatus === "copied"
                        ? "링크 복사됨"
                        : linkCopyStatus === "failed"
                          ? "복사 실패"
                          : "링크 복사"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyDashboardNextActionQueueItemReport(item)}
                      data-testid="dashboard-next-action-copy"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      {copyStatus === "copied"
                        ? "복사됨"
                        : copyStatus === "failed"
                          ? "복사 실패"
                          : "리포트 복사"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {dashboardNextActionQueueManualCopy ? (
          <div className="border-t border-line px-5 py-4">
            <ManualCopyPanel
              copy={dashboardNextActionQueueManualCopy}
              onClose={() => setDashboardNextActionQueueManualCopy(null)}
              height="h-36"
              ariaLabel="수동 복사용 Dashboard 다음 실행 큐 리포트"
            />
          </div>
        ) : null}
      </Panel>

      <Panel className="mt-6">
        <PanelHeader
          title="AI 도구 성과"
          description="GPT, Claude, Codex, Gemini별 생성 품질과 피드백 성공률을 추적합니다."
        />
        <div className="grid gap-0 divide-y divide-line lg:grid-cols-[1fr_260px] lg:divide-x lg:divide-y-0">
          <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-5">
            {targetModelSummaries.map((item) => (
              <Link
                key={item.targetModel}
                href={targetModelLibraryHref(item.targetModel)}
                className="rounded-md border border-line bg-surface px-4 py-4 transition hover:border-accent hover:bg-panel-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      최근 {formatTimestamp(item.latestPromptAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 text-xs text-soft">
                    {targetModelStatusLabel(item.status)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted">버전</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.promptCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">품질</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.averageQuality ? item.averageQuality.toFixed(1) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">성공률</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.feedbackCount ? `${item.successRate}%` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">스킬</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.skillCount}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="px-5 py-5">
            <p className="text-sm font-semibold">현재 우세 도구</p>
            <p className="mt-2 text-2xl font-semibold text-accent">
              {leadingTargetModel?.label ?? "아직 없음"}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {recommendedTargetModel.reason}
            </p>
            <Link
              href={targetModelLibraryHref(leadingTargetModel?.targetModel)}
              className={`${primaryButtonClass} mt-4 w-full`}
            >
              모델별 피드백 보기
            </Link>
          </div>
        </div>
      </Panel>

      <Panel className="mt-6">
        <PanelHeader
          title="생성 엔진 성과"
          description="로컬 규칙 기반 빌더와 OpenAI 보강본의 품질, 피드백, 모델 사용을 비교합니다."
        />
        <div className="grid gap-0 divide-y divide-line lg:grid-cols-[1fr_260px] lg:divide-x lg:divide-y-0">
          <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
            {generationEngineSummaries.map((item) => (
              <Link
                key={item.engine}
                href={generationEngineLibraryHref(item.engine)}
                className="rounded-md border border-line bg-surface px-4 py-4 transition hover:border-accent hover:bg-panel-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      최근 {formatTimestamp(item.latestPromptAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 text-xs text-soft">
                    {generationEngineStatusLabel(item.status)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted">프롬프트</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.promptCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">품질</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.averageQuality ? item.averageQuality.toFixed(1) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">성공률</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.feedbackCount ? `${item.successRate}%` : "-"}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-muted">
                  {item.modelUsage.length
                    ? item.modelUsage
                        .slice(0, 2)
                        .map((usage) => `${usage.model} ${usage.count}`)
                        .join(" · ")
                    : item.engine === "openai"
                      ? "OpenAI 모델 사용 기록 없음"
                      : "오프라인 규칙 기반 생성"}
                </p>
              </Link>
            ))}
          </div>
          <div className="px-5 py-5">
            <p className="text-sm font-semibold">현재 우세 엔진</p>
            <p className="mt-2 text-2xl font-semibold text-accent">
              {leadingGenerationEngine?.label ?? "아직 없음"}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              피드백이 쌓이면 OpenAI 보강이 실제 품질과 성공률을 얼마나 개선하는지
              로컬 빌더와 비교할 수 있습니다.
            </p>
            <Link
              href={generationEngineLibraryHref(leadingGenerationEngine?.engine)}
              className={`${primaryButtonClass} mt-4 w-full`}
            >
              엔진별 프롬프트 보기
            </Link>
          </div>
        </div>
      </Panel>

      <Panel className="mt-6">
        <PanelHeader
          title="학습 컨텍스트 사용"
          description="저장 프롬프트가 어떤 학습 scope를 반영했는지 추적하고 Library와 Learning 점검 화면으로 바로 이동합니다."
        />
        <div className="grid gap-0 divide-y divide-line lg:grid-cols-[1fr_260px] lg:divide-x lg:divide-y-0">
          <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-5">
            {learningScopeSummaries.map((item) => (
              <div
                key={item.scope}
                className="rounded-md border border-line bg-surface px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      프롬프트 최근 {formatTimestamp(item.latestPromptAt)}
                    </p>
                    {item.scope !== "untracked" ? (
                      <p className="mt-1 text-xs text-muted">
                        메모리 최근 {formatTimestamp(item.latestMemoryAt)}
                      </p>
                    ) : null}
                    {item.scope === "untracked" ? (
                      <p className="mt-1 text-xs text-muted">
                        학습 메모리와 직접 연결되지 않은 저장본
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-soft">
                    {item.promptCount}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted">프롬프트</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.promptCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">메모리</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.scope === "untracked" ? "-" : item.memoryCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">품질</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.averageQuality ? item.averageQuality.toFixed(1) : "-"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <Link
                    href={learningScopeLibraryHref(item.scope)}
                    className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                  >
                    프롬프트 보기
                  </Link>
                  <Link
                    href={learningScopeLearningHref(item.scope)}
                    className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                  >
                    {item.scope === "untracked" ? "Learning 전체" : "메모리 점검"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-5">
            <p className="text-sm font-semibold">학습 메타 보존</p>
            <p className="mt-2 font-mono text-4xl font-semibold text-accent">
              {trackedLearningPromptCount}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              생성 당시 enabled scope와 적용 메모리 수가 저장된 프롬프트입니다.
              기록 없음은 학습 메타 도입 전 저장된 프롬프트입니다.
            </p>
            <Link
              href={learningScopeLibraryHref(
                trackedLearningPromptCount ? "company" : "untracked",
              )}
              className={`${primaryButtonClass} mt-4 w-full`}
            >
              학습 반영 프롬프트 보기
            </Link>
            <Link href="/learning" className={`${secondaryButtonClass} mt-2 w-full`}>
              Learning 메모리 점검
            </Link>
            <button
              type="button"
              onClick={copyLearningOpsReport}
              className={`${secondaryButtonClass} mt-2 w-full`}
            >
              {learningOpsReportCopyStatus === "copied"
                ? "학습 운영 리포트 복사됨"
                : learningOpsReportCopyStatus === "failed"
                  ? "학습 운영 리포트 복사 실패"
                  : "학습 운영 리포트 복사"}
            </button>
            <button
              type="button"
              onClick={openLearningOpsReportInStudio}
              className={`${secondaryButtonClass} mt-2 w-full`}
            >
              리포트 Studio로 보내기
            </button>
            {learningOpsManualCopy ? (
              <ManualCopyPanel
                copy={learningOpsManualCopy}
                onClose={() => setLearningOpsManualCopy(null)}
                className="mt-4 bg-surface"
                ariaLabel="수동 복사용 Learning 운영 리포트"
              />
            ) : null}
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-sm font-semibold">운영 점검 큐</p>
              <div className="mt-3 grid gap-2">
                {learningReviewQueues.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-md border border-line bg-surface px-3 py-3 transition hover:border-accent hover:bg-panel-strong"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-xs font-semibold text-soft">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {item.description}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-accent">
                        {item.count}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-sm font-semibold">권장 조치</p>
              <div className="mt-3 grid gap-2">
                {learningOpsActions.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-md border border-line bg-surface px-3 py-3"
                  >
                    <Link
                      href={item.href}
                      className="block transition hover:text-accent"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-xs font-semibold text-soft">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted">
                            {item.description}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs ${
                            item.priority === "high"
                              ? "text-accent"
                              : item.priority === "medium"
                                ? "text-soft"
                                : "text-muted"
                          }`}
                        >
                          {learningOpsPriorityLabel(item.priority)}
                        </span>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => openLearningOpsActionInStudio(item)}
                      className={`${secondaryButtonClass} mt-3 min-h-9 w-full px-3 py-1.5 text-xs`}
                    >
                      조치 Studio로 보내기
                    </button>
                    <button
                      type="button"
                      onClick={() => copyLearningOpsActionReport(item)}
                      className={`${secondaryButtonClass} mt-2 min-h-9 w-full px-3 py-1.5 text-xs`}
                    >
                      {learningOpsActionCopyStatus?.label === item.label
                        ? learningOpsActionCopyStatus.status === "copied"
                          ? "조치 복사됨"
                          : "조치 복사 실패"
                        : "조치 복사"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="mt-6">
        <PanelHeader
          title="언어 전략 성과"
          description="영어 지시문과 한영 하이브리드 중 어떤 전략이 더 잘 작동하는지 추적합니다."
        />
        <div className="grid gap-0 divide-y divide-line lg:grid-cols-[1fr_240px] lg:divide-x lg:divide-y-0">
          <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
            {languageSummaries.map((item) => (
              <Link
                key={item.strategy}
                href={languageStrategyLibraryHref(item.strategy)}
                className="rounded-md border border-line bg-surface px-4 py-4 transition hover:border-accent hover:bg-panel-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs text-muted">
                      최근 {formatTimestamp(item.latestPromptAt)}
                    </p>
                  </div>
                  <span className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-soft">
                    {strategyStatusLabel(item.status)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-muted">프롬프트</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.promptCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">품질</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.averageQuality ? item.averageQuality.toFixed(1) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">성공률</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.feedbackCount ? `${item.successRate}%` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">스킬</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.skillCount}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="px-5 py-5">
            <p className="text-sm font-semibold">현재 우세 전략</p>
            <p className="mt-2 text-2xl font-semibold text-accent">
              {leadingLanguageStrategy?.label ?? "아직 없음"}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              피드백이 3개 이상 쌓이면 성공률 기준으로 전략 판단이 더 안정됩니다.
            </p>
            <Link
              href={languageStrategyLibraryHref(leadingLanguageStrategy?.strategy)}
              className={`${primaryButtonClass} mt-4 w-full`}
            >
              피드백 확인
            </Link>
          </div>
        </div>
      </Panel>

      <Panel className="mt-6">
        <PanelHeader
          title="답변 언어 성과"
          description="한국어, 영어, 입력 언어 동일 옵션별 품질과 피드백 성공률을 추적합니다."
        />
        <div className="grid gap-0 divide-y divide-line lg:grid-cols-[1fr_240px] lg:divide-x lg:divide-y-0">
          <div className="grid gap-4 px-5 py-5 md:grid-cols-3">
            {outputLanguageSummaries.map((item) => (
              <Link
                key={item.outputLanguage}
                href={outputLanguageLibraryHref(item.outputLanguage)}
                className="rounded-md border border-line bg-surface px-4 py-4 transition hover:border-accent hover:bg-panel-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-xs text-muted">
                      최근 {formatTimestamp(item.latestPromptAt)}
                    </p>
                  </div>
                  <span className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-soft">
                    {outputLanguageStatusLabel(item.status)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted">프롬프트</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.promptCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">품질</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.averageQuality ? item.averageQuality.toFixed(1) : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">성공률</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.feedbackCount ? `${item.successRate}%` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">스킬</p>
                    <p className="mt-1 font-mono text-base font-semibold">
                      {item.skillCount}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="px-5 py-5">
            <p className="text-sm font-semibold">현재 우세 답변 언어</p>
            <p className="mt-2 text-2xl font-semibold text-accent">
              {leadingOutputLanguage?.label ?? "아직 없음"}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              답변 언어는 선호도와 업무 목적의 영향이 큽니다. 피드백이 쌓이면
              반복 업무별 기본값을 조정할 근거로 사용합니다.
            </p>
            <Link
              href={outputLanguageLibraryHref(leadingOutputLanguage?.outputLanguage)}
              className={`${primaryButtonClass} mt-4 w-full`}
            >
              언어별 피드백 보기
            </Link>
          </div>
        </div>
      </Panel>

      <Panel className="mt-6">
        <PanelHeader
          title="프롬프트 개선 효과"
          description="Library 개선본의 원본 대비 품질 점수 변화를 차수, 분야, AI 도구별로 집계합니다."
        />
        <div className="grid gap-0 divide-y divide-line xl:grid-cols-[280px_1fr_1fr_1fr] xl:divide-x xl:divide-y-0">
          <div className="px-5 py-5">
            <p className="text-sm font-semibold">평균 개선폭</p>
            <p
              className={`mt-2 font-mono text-4xl font-semibold ${
                improvementSummary.averageDelta >= 0 ? "text-accent" : "text-muted"
              }`}
            >
              {improvementSummary.measurableCount
                ? formatSignedScore(improvementSummary.averageDelta)
                : "-"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
              <Link
                href={improvementLibraryHref()}
                className="rounded-md px-2 py-2 transition hover:bg-surface"
              >
                <p className="text-muted">측정</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {improvementSummary.measurableCount}
                </p>
              </Link>
              <Link
                href={improvementLibraryHref({ improvement: "improved" })}
                className="rounded-md px-2 py-2 transition hover:bg-surface"
              >
                <p className="text-muted">개선</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {improvementSummary.improvedCount}
                </p>
              </Link>
              <Link
                href={improvementLibraryHref({ improvement: "regressed" })}
                className="rounded-md px-2 py-2 transition hover:bg-surface"
              >
                <p className="text-muted">재검토</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {improvementSummary.regressedCount}
                </p>
              </Link>
              <Link
                href={improvementLibraryHref({ improvement: "archived-source" })}
                className="rounded-md px-2 py-2 transition hover:bg-surface"
              >
                <p className="text-muted">보관함</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {improvementSummary.archivedSourceCount}
                </p>
              </Link>
              <Link
                href={improvementLibraryHref({ improvement: "unmeasured" })}
                className="rounded-md px-2 py-2 transition hover:bg-surface"
              >
                <p className="text-muted">미측정</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {improvementSummary.unmeasuredCount}
                </p>
              </Link>
            </div>
            <div
              data-testid="dashboard-studio-persistence-summary"
              className="mt-4 border-l border-line pl-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-soft">
                  Studio 저장 방식
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    data-testid="dashboard-studio-persistence-all-link-copy"
                    className="text-[11px] font-semibold text-accent transition hover:text-soft"
                    onClick={copyStudioPersistenceAllLink}
                  >
                    {studioPersistenceAllLinkCopyStatus === "copied"
                      ? "전체 링크 복사됨"
                      : studioPersistenceAllLinkCopyStatus === "failed"
                        ? "전체 링크 실패"
                        : "전체 링크"}
                  </button>
                  <Link
                    href="/library"
                    className="text-[11px] font-semibold text-accent transition hover:text-soft"
                  >
                    전체 보기
                  </Link>
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                개선 체인은 품질 비교에 쓰고, 운영 출처는 복원/점검 초안으로
                분리해 봅니다.
              </p>
              <Link
                href={studioPersistenceLibraryHref("none")}
                data-testid="dashboard-missing-source-metadata-queue"
                className="mt-3 block rounded-md border border-line bg-surface px-3 py-2 transition hover:bg-panel-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-soft">
                      저장 출처 메타 없음 큐
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-muted">
                      유지할 직접 저장본과 추적 가능한 Studio 흐름으로 다시
                      저장할 항목을 나눕니다.
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold text-soft">
                    {missingSourceMetadataSummary?.count ?? 0}
                  </span>
                </div>
              </Link>
              <div className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-3">
                <button
                  type="button"
                  data-testid="dashboard-missing-source-metadata-queue-link-copy"
                  className="rounded-md border border-line px-3 py-2 text-left text-[11px] font-semibold text-accent transition hover:bg-surface hover:text-soft"
                  onClick={copyMissingSourceMetadataQueueLink}
                >
                  {missingSourceMetadataQueueLinkCopyStatus === "copied"
                    ? "복사됨"
                    : missingSourceMetadataQueueLinkCopyStatus === "failed"
                      ? "복사 실패"
                      : "큐 링크 복사"}
                </button>
                <button
                  type="button"
                  data-testid="dashboard-missing-source-metadata-queue-copy"
                  className="rounded-md border border-line px-3 py-2 text-left text-[11px] font-semibold text-accent transition hover:bg-surface hover:text-soft"
                  onClick={copyMissingSourceMetadataQueuePrompt}
                >
                  {missingSourceMetadataQueueCopyStatus === "copied"
                    ? "복사됨"
                    : missingSourceMetadataQueueCopyStatus === "failed"
                      ? "복사 실패"
                      : "큐 프롬프트 복사"}
                </button>
                <button
                  type="button"
                  data-testid="dashboard-missing-source-metadata-queue-studio"
                  className="rounded-md border border-line px-3 py-2 text-left text-[11px] font-semibold text-accent transition hover:bg-surface hover:text-soft"
                  onClick={openMissingSourceMetadataQueueInStudio}
                >
                  큐 운영 기준 Studio로
                </button>
              </div>
              {missingSourceMetadataQueueManualCopy ? (
                <ManualCopyPanel
                  copy={missingSourceMetadataQueueManualCopy}
                  onClose={() => setMissingSourceMetadataQueueManualCopy(null)}
                  className="mt-3 bg-surface"
                  showHeading={false}
                  height="h-32"
                  ariaLabel="수동 복사용 저장 출처 메타 없음 큐 운영 프롬프트"
                />
              ) : null}
              <div className="mt-3 grid gap-2 text-[11px]">
                {studioPersistenceSummary.map((item) => (
                  <div
                    key={item.mode}
                    className="rounded-md bg-surface px-3 py-2 transition hover:bg-panel-strong"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-soft">
                          {item.label}
                        </p>
                        <p className="mt-1 line-clamp-2 leading-4 text-muted">
                          {item.description}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-soft">
                        {item.count}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Link
                        href={studioPersistenceLibraryHref(item.mode)}
                        className="rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                      >
                        보기
                      </Link>
                      <button
                        type="button"
                        data-testid="dashboard-studio-persistence-link-copy"
                        className="rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                        onClick={() => copyStudioPersistenceLink(item)}
                      >
                        {studioPersistenceLinkCopyStatus?.key === item.mode &&
                        studioPersistenceLinkCopyStatus.status === "copied"
                          ? "링크 복사됨"
                          : studioPersistenceLinkCopyStatus?.key ===
                                item.mode &&
                              studioPersistenceLinkCopyStatus.status === "failed"
                            ? "링크 실패"
                            : "링크 복사"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {studioPersistenceManualCopy ? (
                <ManualCopyPanel
                  copy={studioPersistenceManualCopy}
                  onClose={() => setStudioPersistenceManualCopy(null)}
                  className="mt-3 bg-surface"
                  showHeading={false}
                  height="h-24"
                  ariaLabel="수동 복사용 Studio 저장 방식 링크"
                />
              ) : null}
              <div className="mt-3 border-t border-line pt-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold text-soft">
                    Studio 저장 출처
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-accent transition hover:text-soft"
                      onClick={copyStudioSourceOpsReport}
                    >
                      {studioSourceOpsReportCopyStatus === "copied"
                        ? "복사됨"
                        : studioSourceOpsReportCopyStatus === "failed"
                          ? "복사 실패"
                          : "복사"}
                    </button>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-accent transition hover:text-soft"
                      onClick={openStudioSourceOpsReportInStudio}
                    >
                      Studio로
                    </button>
                    <button
                      type="button"
                      data-testid="dashboard-studio-source-all-filter-link-copy"
                      className="text-[11px] font-semibold text-accent transition hover:text-soft"
                      onClick={copyStudioSourceAllFilterLink}
                    >
                      {studioSourceAllFilterLinkCopyStatus === "copied"
                        ? "전체 링크 복사됨"
                        : studioSourceAllFilterLinkCopyStatus === "failed"
                          ? "전체 링크 실패"
                          : "전체 링크"}
                    </button>
                    <Link
                      href={studioSourceLibraryHref()}
                      className="text-[11px] font-semibold text-muted transition hover:text-accent"
                    >
                      전체
                    </Link>
                  </div>
                </div>
                {studioSourceSummary.length ? (
                  <div className="mt-2 grid gap-2 text-[11px]">
                    {studioSourceSummary.map((item) => (
                      <div
                        key={item.source}
                        className="rounded-md px-2 py-2 transition hover:bg-surface"
                      >
                        <Link
                          href={studioSourceLibraryHref({ source: item.source })}
                          className="block"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-soft">
                                {item.label}
                              </p>
                              <p className="mt-1 line-clamp-2 leading-4 text-muted">
                                {item.description}
                              </p>
                              <p className="mt-1 line-clamp-2 leading-4 text-accent">
                                {item.nextAction}
                              </p>
                              {item.sourceTitles.length ? (
                                <p className="mt-1 line-clamp-2 leading-4 text-muted">
                                  대표 출처 · {item.sourceTitles.join(", ")}
                                </p>
                              ) : null}
                            </div>
                            <span className="shrink-0 font-mono text-soft">
                              {item.count}
                            </span>
                          </div>
                        </Link>
                        {item.sourceVariantLinks.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.sourceVariantLinks.map((variant) => {
                              const variantCopyKey = `${item.source}:${variant.sourceVariant}`;

                              return (
                                <span
                                  key={variantCopyKey}
                                  className="inline-flex items-center gap-1 rounded border border-line bg-panel px-1.5 py-0.5"
                                >
                                  <Link
                                    href={variant.href}
                                    className="font-semibold text-soft transition hover:text-accent"
                                  >
                                    {variant.label} {variant.count}개
                                  </Link>
                                  <button
                                    type="button"
                                    data-testid="dashboard-studio-source-variant-filter-link-copy"
                                    className="font-semibold text-accent transition hover:text-soft"
                                    onClick={() =>
                                      copyStudioSourceVariantFilterLink({
                                        href: variant.href,
                                        label: variant.label,
                                        source: item.source,
                                        sourceVariant: variant.sourceVariant,
                                      })
                                    }
                                  >
                                    {studioSourceFilterLinkCopyStatus?.key ===
                                      variantCopyKey &&
                                    studioSourceFilterLinkCopyStatus.status ===
                                      "copied"
                                      ? "복사됨"
                                      : studioSourceFilterLinkCopyStatus?.key ===
                                            variantCopyKey &&
                                          studioSourceFilterLinkCopyStatus.status ===
                                            "failed"
                                        ? "실패"
                                        : "복사"}
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          data-testid="dashboard-studio-source-filter-link-copy"
                          className="mt-2 rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                          onClick={() => copyStudioSourceFilterLink(item)}
                        >
                          {studioSourceFilterLinkCopyStatus?.key ===
                            item.source &&
                          studioSourceFilterLinkCopyStatus.status === "copied"
                            ? "필터 링크 복사됨"
                            : studioSourceFilterLinkCopyStatus?.key ===
                                  item.source &&
                                studioSourceFilterLinkCopyStatus.status ===
                                  "failed"
                              ? "필터 링크 실패"
                              : "필터 링크 복사"}
                        </button>
                        {item.sourceExamples.length ? (
                          <div className="mt-2 grid gap-1.5 border-t border-line pt-2">
                            {item.sourceExamples.slice(0, 2).map((example) => (
                              <div
                                key={`${item.source}-${example.href}`}
                                className="flex min-w-0 items-center gap-1.5"
                              >
                                <Link
                                  href={example.href}
                                  className="min-w-0 flex-1 truncate rounded-md border border-line bg-panel px-2 py-1 font-semibold text-muted transition hover:text-accent"
                                >
                                  {example.title}
                                </Link>
                                <button
                                  type="button"
                                  className="shrink-0 rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                                  onClick={() =>
                                    copyStudioSourceExampleLink({
                                      ...example,
                                      linkLabel: "대표 저장본 상세",
                                    })
                                  }
                                >
                                  {studioSourceExampleLinkCopyStatus?.key ===
                                    example.href &&
                                  studioSourceExampleLinkCopyStatus.status ===
                                    "copied"
                                    ? "복사됨"
                                    : studioSourceExampleLinkCopyStatus?.key ===
                                          example.href &&
                                        studioSourceExampleLinkCopyStatus.status ===
                                          "failed"
                                      ? "실패"
                                      : "복사"}
                                </button>
                                {example.originalHref ? (
                                  <>
                                    <Link
                                      href={example.originalHref}
                                      className="shrink-0 rounded-md border border-line px-2 py-1 font-semibold text-soft transition hover:bg-panel hover:text-accent"
                                    >
                                      {example.originalActionLabel ?? "원본"}
                                    </Link>
                                    <button
                                      type="button"
                                      className="shrink-0 rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                                      onClick={() =>
                                        copyStudioSourceExampleLink({
                                          href: example.originalHref ?? "",
                                          linkLabel:
                                            example.originalActionLabel ??
                                            "원본 경로",
                                          originalHref: example.originalHref,
                                          title: example.title,
                                        })
                                      }
                                    >
                                      {studioSourceExampleLinkCopyStatus?.key ===
                                        example.originalHref &&
                                      studioSourceExampleLinkCopyStatus.status ===
                                        "copied"
                                        ? "원본 복사됨"
                                        : studioSourceExampleLinkCopyStatus?.key ===
                                              example.originalHref &&
                                            studioSourceExampleLinkCopyStatus.status ===
                                              "failed"
                                          ? "원본 실패"
                                          : "원본 복사"}
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            ))}
                            {item.count >
                            Math.min(item.sourceExamples.length, 2) ? (
                              <span className="rounded-md border border-line px-2 py-1 font-mono text-muted">
                                +
                                {item.count -
                                  Math.min(item.sourceExamples.length, 2)}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-md bg-surface px-2 py-2 text-[11px] leading-4 text-muted">
                    아직 Studio 저장 출처 메타가 있는 저장본이 없습니다.
                  </p>
                )}
                {studioSourceOpsManualCopy ? (
                  <ManualCopyPanel
                    copy={studioSourceOpsManualCopy}
                    onClose={() => setStudioSourceOpsManualCopy(null)}
                    className="mt-3 bg-surface"
                    showHeading={false}
                    height="h-36"
                    ariaLabel="수동 복사용 Studio 저장 출처 운영 리포트"
                  />
                ) : null}
                {studioSourceExampleManualCopy ? (
                  <ManualCopyPanel
                    copy={studioSourceExampleManualCopy}
                    onClose={() => setStudioSourceExampleManualCopy(null)}
                    className="mt-3 bg-surface"
                    showHeading={false}
                    height="h-24"
                    ariaLabel="수동 복사용 대표 저장본 링크"
                  />
                ) : null}
                {studioSourceFilterManualCopy ? (
                  <ManualCopyPanel
                    copy={studioSourceFilterManualCopy}
                    onClose={() => setStudioSourceFilterManualCopy(null)}
                    className="mt-3 bg-surface"
                    showHeading={false}
                    height="h-24"
                    ariaLabel="수동 복사용 Studio 저장 출처 필터 링크"
                  />
                ) : null}
              </div>
            </div>
            <div className="mt-4 border-l border-line pl-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-soft">출처 상태 조치</p>
                <span className="font-mono text-xs text-muted">
                  {improvementSummary.archivedSourceCount +
                    improvementSummary.unmeasuredCount}
                  개
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                {improvementSummary.archivedSourceCount ||
                improvementSummary.unmeasuredCount
                  ? "보관함 원본은 복원 여부를 확인하고, 측정 불가 항목은 원본 연결을 먼저 정리합니다."
                  : "현재 복원 또는 원본 연결 확인이 필요한 개선본은 없습니다."}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                {[
                  {
                    href: improvementLibraryHref({
                      improvement: "archived-source",
                    }),
                    key: "source-health-archived-source",
                    label: `보관함 원본 ${improvementSummary.archivedSourceCount}개`,
                    title: "출처 상태 링크 · 보관함 원본",
                  },
                  {
                    href: improvementLibraryHref({ improvement: "unmeasured" }),
                    key: "source-health-unmeasured",
                    label: `측정 불가 ${improvementSummary.unmeasuredCount}개`,
                    title: "출처 상태 링크 · 측정 불가",
                  },
                ].map((item) => (
                  <span key={item.key} className="inline-flex items-center gap-2">
                    <Link
                      href={item.href}
                      className="font-semibold text-accent transition hover:text-soft"
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      data-testid="dashboard-source-health-link-copy"
                      className="font-semibold text-muted transition hover:text-accent"
                      onClick={() => copySourceHealthLink(item)}
                    >
                      {sourceHealthLinkCopyStatus?.key === item.key &&
                      sourceHealthLinkCopyStatus.status === "copied"
                        ? "링크 복사됨"
                        : sourceHealthLinkCopyStatus?.key === item.key &&
                            sourceHealthLinkCopyStatus.status === "failed"
                          ? "링크 실패"
                          : "링크 복사"}
                    </button>
                  </span>
                ))}
              </div>
              <div
                data-testid="dashboard-source-health-reasons"
                className="mt-3 grid grid-cols-2 gap-2 text-[11px]"
              >
                {sourceHealthReasonBreakdown.map((item) => {
                  const sourceHealthReasonHref = improvementLibraryHref({
                    improvement:
                      item.reason === "archived-source"
                        ? "archived-source"
                        : "unmeasured",
                    sourceReason: item.reason,
                  });
                  const sourceHealthReasonKey = `source-health-reason-${item.reason}`;

                  return (
                    <div
                      key={item.reason}
                      className="rounded-md bg-surface px-2 py-2 transition hover:bg-panel-strong"
                    >
                      <Link
                        href={sourceHealthReasonHref}
                        className="block"
                      >
                        <p className="truncate text-muted">{item.label}</p>
                        <p className="mt-1 font-mono font-semibold text-soft">
                          {item.count}
                        </p>
                      </Link>
                      <button
                        type="button"
                        data-testid="dashboard-source-health-reason-link-copy"
                        className="mt-2 rounded-md border border-line px-2 py-1 font-semibold text-accent transition hover:bg-panel hover:text-soft"
                        onClick={() =>
                          copySourceHealthLink({
                            href: sourceHealthReasonHref,
                            key: sourceHealthReasonKey,
                            title: `출처 상태 사유 링크 · ${item.label}`,
                          })
                        }
                      >
                        {sourceHealthLinkCopyStatus?.key ===
                          sourceHealthReasonKey &&
                        sourceHealthLinkCopyStatus.status === "copied"
                          ? "링크 복사됨"
                          : sourceHealthLinkCopyStatus?.key ===
                                sourceHealthReasonKey &&
                              sourceHealthLinkCopyStatus.status === "failed"
                            ? "링크 실패"
                            : "링크 복사"}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div
                data-testid="dashboard-source-health-candidates"
                className="mt-3 space-y-2 rounded-md bg-surface px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-soft">
                    대표 확인 후보
                  </p>
                  <span className="font-mono text-[11px] text-muted">
                    {sourceHealthPreviewIssues.length}/
                    {improvementSummary.sourceHealthIssues.length}
                  </span>
                </div>
                {sourceHealthPreviewIssues.length ? (
                  <div className="space-y-2">
                    {sourceHealthPreviewIssues.map((issue) => {
                      const candidateKey = sourceHealthIssueKey(issue);
                      const candidateDetailHref = promptDetailLibraryHref(
                        issue.prompt.id,
                        issue.targetModel,
                      );
                      const candidateDetailLinkKey = `${candidateKey}-detail-link`;
                      const candidateCopyStatus =
                        sourceHealthCandidateCopyStatus?.key === candidateKey
                          ? sourceHealthCandidateCopyStatus.status
                          : null;
                      const candidateDetailLinkCopyStatus =
                        sourceHealthLinkCopyStatus?.key === candidateDetailLinkKey
                          ? sourceHealthLinkCopyStatus.status
                          : null;

                      return (
                        <div
                          key={candidateKey}
                          className="rounded-md border border-line bg-panel px-3 py-2"
                        >
                          <Link
                            href={candidateDetailHref}
                            className="block transition hover:text-accent"
                          >
                            <span className="block truncate text-xs font-semibold text-soft">
                              {issue.prompt.title}
                            </span>
                            <span className="mt-1 block break-words text-[11px] leading-4 text-muted">
                              {sourceHealthIssueReasonLabel(issue.reason)}
                              {issue.sourcePrompt
                                ? ` · 원본: ${issue.sourcePrompt.title}${
                                    issue.sourceDeletedAt
                                      ? " (삭제 보관함)"
                                      : ""
                                  }`
                                : ""}
                            </span>
                          </Link>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                            <button
                              type="button"
                              onClick={() => copySourceHealthCandidateMemo(issue)}
                              data-testid="dashboard-source-health-candidate-copy"
                              className="text-[11px] font-semibold text-accent transition hover:text-soft"
                            >
                              {candidateCopyStatus === "copied"
                                ? "후보 메모 복사됨"
                                : candidateCopyStatus === "failed"
                                  ? "후보 메모 복사 실패"
                                  : "후보 메모 복사"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                copySourceHealthLink({
                                  href: candidateDetailHref,
                                  key: candidateDetailLinkKey,
                                  title: `출처 상태 후보 상세 링크 · ${issue.prompt.title}`,
                                })
                              }
                              data-testid="dashboard-source-health-candidate-link-copy"
                              className="text-[11px] font-semibold text-accent transition hover:text-soft"
                            >
                              {candidateDetailLinkCopyStatus === "copied"
                                ? "상세 링크 복사됨"
                                : candidateDetailLinkCopyStatus === "failed"
                                  ? "상세 링크 복사 실패"
                                  : "상세 링크 복사"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openSourceHealthCandidateInStudio(issue)}
                              data-testid="dashboard-source-health-candidate-studio"
                              className="text-[11px] font-semibold text-accent transition hover:text-soft"
                            >
                              Studio로 보내기
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs leading-5 text-muted">
                    현재 화면에서 바로 확인할 출처 상태 후보는 없습니다.
                  </p>
                )}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copySourceHealthActionReport}
                  data-testid="dashboard-source-health-action-copy"
                  className={secondaryButtonClass}
                >
                  {sourceHealthActionCopyStatus === "copied"
                    ? "조치 계획 복사됨"
                    : sourceHealthActionCopyStatus === "failed"
                      ? "조치 계획 복사 실패"
                      : "조치 계획 복사"}
                </button>
                <button
                  type="button"
                  onClick={openSourceHealthActionReportInStudio}
                  data-testid="dashboard-source-health-action-studio"
                  className={secondaryButtonClass}
                >
                  Studio로 보내기
                </button>
              </div>
              {sourceHealthManualCopy ? (
                <ManualCopyPanel
                  copy={sourceHealthManualCopy}
                  onClose={() => setSourceHealthManualCopy(null)}
                  className="mt-3 bg-surface"
                  showHeading={false}
                  height="h-36"
                  ariaLabel="수동 복사용 개선 출처 상태 조치 계획 또는 링크"
                />
              ) : null}
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              {improvementSummary.bestRecord
                ? `${improvementSummary.bestRecord.sourcePrompt.title}에서 ${formatSignedScore(
                    improvementSummary.bestRecord.delta,
                  )}점 개선된 기록이 가장 큽니다.`
                : improvementSummary.totalImprovementPrompts
                  ? "개선본은 있지만 원본 연결이 없어 아직 효과를 계산할 수 없습니다."
                  : "아직 저장된 개선본이 없습니다. Library 상세에서 개선 브리프를 Studio로 보내 생성하세요."}
            </p>
            <Link
              href={promptDetailLibraryHref(
                improvementSummary.bestRecord?.prompt.id,
                improvementSummary.bestRecord?.targetModel,
              )}
              className={`${primaryButtonClass} mt-4 w-full`}
            >
              개선 기록 보기
            </Link>
          </div>

          <div className="px-5 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">차수별 개선</p>
                <p className="mt-1 text-xs text-muted">1차와 재개선 단계 기준</p>
              </div>
              <span className="font-mono text-xs text-accent">
                {improvementSummary.byDepth.length}개
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {improvementSummary.byDepth.slice(0, 4).map((group) => (
                <ImprovementGroupLink key={group.id} group={group} />
              ))}
            </div>
            {improvementSummary.byDepth.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                측정 가능한 차수별 개선 기록이 없습니다.
              </p>
            ) : null}
          </div>

          <div className="px-5 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">AI 도구별 개선</p>
                <p className="mt-1 text-xs text-muted">원본 버전 기준으로 집계</p>
              </div>
              <span className="font-mono text-xs text-accent">
                {improvementSummary.byTargetModel.length}개
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {improvementSummary.byTargetModel.slice(0, 4).map((group) => (
                <ImprovementGroupLink key={group.id} group={group} />
              ))}
            </div>
            {improvementSummary.byTargetModel.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                측정 가능한 AI 도구별 개선 기록이 없습니다.
              </p>
            ) : null}
          </div>

          <div className="px-5 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">분야별 개선</p>
                <p className="mt-1 text-xs text-muted">원본 프롬프트 분야 기준</p>
              </div>
              <span className="font-mono text-xs text-accent">
                {improvementSummary.byDomain.length}개
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {improvementSummary.byDomain.slice(0, 4).map((group) => (
                <ImprovementGroupLink key={group.id} group={group} />
              ))}
            </div>
            {improvementSummary.byDomain.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                측정 가능한 분야별 개선 기록이 없습니다.
              </p>
            ) : null}
          </div>
        </div>
        <div className="border-t border-line px-5 py-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">재개선 후보</p>
              <p className="mt-1 text-xs text-muted">
                원본 대비 하락/유지 또는 품질{" "}
                {reimprovementQualityThreshold.toFixed(1)} 미만 개선본
              </p>
            </div>
            <Link
              href={improvementLibraryHref({ improvement: "reimprovement" })}
              className="text-xs font-semibold text-accent transition hover:text-soft"
            >
              후보 필터 열기
            </Link>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {improvementSummary.reimprovementQueue.slice(0, 3).map((record) => (
              <div
                key={record.prompt.id}
                className="min-w-0 rounded-md border border-line bg-surface px-4 py-4"
              >
                <Link
                  href={promptDetailLibraryHref(
                    record.prompt.id,
                    record.targetModel,
                    "comparison",
                  )}
                  className="block min-w-0 transition hover:text-accent"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {record.prompt.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        원본 · {record.sourcePrompt.title}
                        {record.sourceDeletedAt ? " · 삭제 보관함" : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs ${
                        record.delta >= 0 ? "text-accent" : "text-muted"
                      }`}
                    >
                      {formatSignedScore(record.delta)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted">차수</p>
                      <p className="mt-1 font-mono text-sm font-semibold">
                        {record.depth}차
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">도구</p>
                      <p className="mt-1 text-sm font-semibold">
                        {modelLabels[record.targetModel]}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">품질</p>
                      <p className="mt-1 font-mono text-sm font-semibold">
                        {record.improvedScore.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </Link>
                <p className="mt-4 text-xs leading-5 text-muted">
                  {reimprovementReason(record)}
                </p>
                <button
                  type="button"
                  onClick={() => openReimprovementInStudio(record)}
                  className={`${secondaryButtonClass} mt-4 w-full`}
                >
                  Studio에서 재개선
                </button>
              </div>
            ))}
          </div>
          {improvementSummary.reimprovementQueue.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              현재 재개선 후보가 없습니다. 개선본을 저장하고 피드백을 쌓으면
              우선순위가 자동으로 잡힙니다.
            </p>
          ) : null}
        </div>
        <div className="border-t border-line px-5 py-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold">피드백 반영 개선본</p>
              <p className="mt-1 text-xs text-muted">
                Library 피드백을 출처로 저장된 개선본과 반영 코멘트를 추적합니다.
              </p>
            </div>
            <Link
              href={improvementLibraryHref()}
              className="text-xs font-semibold text-accent transition hover:text-soft"
            >
              개선 기록 전체
            </Link>
          </div>
          <div
            className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
            data-testid="dashboard-feedback-improvement-metrics"
          >
            <div className="rounded-md border border-line bg-surface px-3 py-3">
              <p className="text-xs text-muted">피드백 개선본</p>
              <p className="mt-1 font-mono text-lg font-semibold text-soft">
                {feedbackBasedImprovementRecords.length}
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface px-3 py-3">
              <p className="text-xs text-muted">평균 개선폭</p>
              <p
                className={`mt-1 font-mono text-lg font-semibold ${
                  feedbackImprovementAverageDelta >= 0
                    ? "text-accent"
                    : "text-muted"
                }`}
              >
                {feedbackBasedImprovementRecords.length
                  ? formatSignedScore(feedbackImprovementAverageDelta)
                  : "-"}
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface px-3 py-3">
              <p className="text-xs text-muted">재검토 필요</p>
              <p className="mt-1 font-mono text-lg font-semibold text-soft">
                {feedbackImprovementReviewCount}
              </p>
            </div>
            <div className="rounded-md border border-line bg-surface px-3 py-3">
              <p className="text-xs text-muted">보관함 원본</p>
              <p className="mt-1 font-mono text-lg font-semibold text-soft">
                {feedbackImprovementArchivedSourceCount}
              </p>
            </div>
          </div>
          {feedbackImprovementPriorityRecord ? (
            <div
              className="mb-4 rounded-md border border-accent/30 bg-accent/10 px-4 py-4"
              data-testid="dashboard-feedback-improvement-priority"
            >
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-accent">
                    우선 점검 ·{" "}
                    {feedbackImprovementPriorityRecord.sourceDeletedAt
                      ? "보관함 원본"
                      : feedbackImprovementPriorityRecord.delta <= 0
                        ? "재검토 필요"
                        : "최근 개선본"}
                  </p>
                  <Link
                    href={promptDetailLibraryHref(
                      feedbackImprovementPriorityRecord.prompt.id,
                      feedbackImprovementPriorityRecord.targetModel,
                    )}
                    className="mt-1 block truncate text-sm font-semibold text-soft transition hover:text-accent"
                  >
                    {feedbackImprovementPriorityRecord.prompt.title}
                  </Link>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {feedbackImprovementPriorityReason(
                      feedbackImprovementPriorityRecord,
                    )}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                    <div className="min-w-0 rounded-md border border-accent/20 bg-panel/70 px-2 py-2">
                      <p className="text-muted">AI 도구</p>
                      <p className="mt-1 font-semibold text-soft">
                        {modelLabels[feedbackImprovementPriorityRecord.targetModel]}
                      </p>
                    </div>
                    <div className="min-w-0 rounded-md border border-accent/20 bg-panel/70 px-2 py-2">
                      <p className="text-muted">점수 변화</p>
                      <p className="mt-1 font-mono font-semibold text-soft">
                        {feedbackImprovementPriorityRecord.sourceVersion.qualityScore.toFixed(
                          1,
                        )}{" "}
                        →{" "}
                        {feedbackImprovementPriorityRecord.improvedVersion.qualityScore.toFixed(
                          1,
                        )}{" "}
                        (
                        {formatSignedScore(
                          feedbackImprovementPriorityRecord.delta,
                        )}
                        )
                      </p>
                    </div>
                    <div className="min-w-0 rounded-md border border-accent/20 bg-panel/70 px-2 py-2">
                      <p className="text-muted">피드백</p>
                      <p className="mt-1 truncate font-semibold text-soft">
                        {feedbackTypeLabels[
                          feedbackImprovementPriorityRecord.sourceFeedback
                            .feedbackType
                        ]}{" "}
                        ·{" "}
                        {feedbackImprovementPriorityRecord.sourceFeedback.rating.toFixed(
                          0,
                        )}
                        /5
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:min-w-64 lg:grid-cols-1">
                  <Link
                    href={promptDetailLibraryHref(
                      feedbackImprovementPriorityRecord.prompt.id,
                      feedbackImprovementPriorityRecord.targetModel,
                    )}
                    className={`${primaryButtonClass} w-full`}
                  >
                    우선 개선본 보기
                  </Link>
                  {feedbackImprovementPriorityRecord.sourceDeletedAt ? (
                    <Link
                      href={promptDetailLibraryHref(
                        feedbackImprovementPriorityRecord.prompt.id,
                        feedbackImprovementPriorityRecord.targetModel,
                      )}
                      className={`${secondaryButtonClass} w-full`}
                    >
                      원본 복원 확인
                    </Link>
                  ) : (
                    <Link
                      href={promptFeedbackLibraryHref(
                        feedbackImprovementPriorityRecord.sourcePrompt.id,
                        feedbackImprovementPriorityRecord.sourceFeedback.id,
                        feedbackImprovementPriorityRecord.targetModel,
                      )}
                      className={`${secondaryButtonClass} w-full`}
                    >
                      원본 피드백 보기
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={copyFeedbackImprovementPriorityReport}
                    data-testid="dashboard-feedback-improvement-priority-copy"
                    className={`${secondaryButtonClass} w-full`}
                  >
                    {feedbackImprovementPriorityCopyStatus === "copied"
                      ? "우선 리포트 복사됨"
                      : feedbackImprovementPriorityCopyStatus === "failed"
                        ? "우선 리포트 복사 실패"
                        : "우선 리포트 복사"}
                  </button>
                  <button
                    type="button"
                    onClick={openFeedbackImprovementPriorityInStudio}
                    data-testid="dashboard-feedback-improvement-priority-studio"
                    className={`${secondaryButtonClass} w-full`}
                  >
                    우선 계획 Studio로
                  </button>
                  <button
                    type="button"
                    onClick={saveFeedbackImprovementPriorityMemory}
                    data-testid="dashboard-feedback-improvement-priority-memory-save"
                    className={`${secondaryButtonClass} w-full`}
                  >
                    {feedbackImprovementPriorityMemorySaveStatus === "saved"
                      ? "우선 메모리 저장됨"
                      : feedbackImprovementPriorityMemorySaveStatus ===
                          "skipped"
                        ? "저장할 우선 메모리 없음"
                        : "우선 메모리 저장"}
                  </button>
                  {feedbackImprovementPriorityMemorySaveStatus === "saved" &&
                  feedbackImprovementPriorityMemoryPreview ? (
                    <div
                      data-testid="dashboard-feedback-improvement-priority-memory-summary"
                      className="border-t border-accent/20 pt-2 text-xs leading-5 text-muted"
                    >
                      <p className="font-semibold text-soft">저장된 메모리</p>
                      <p className="mt-1 truncate">
                        {feedbackImprovementPriorityMemoryPreview.title}
                      </p>
                      <p>
                        {
                          learningScopeLabels[
                            feedbackImprovementPriorityMemoryPreview.scope
                          ]
                        }{" "}
                        scope · 신뢰도{" "}
                        {Math.round(
                          feedbackImprovementPriorityMemoryPreview.confidence *
                            100,
                        )}
                        %
                      </p>
                    </div>
                  ) : null}
                  {feedbackImprovementPriorityMemorySaveStatus === "saved" ? (
                    <Link
                      href={feedbackImprovementLearningHref()}
                      data-testid="dashboard-feedback-improvement-priority-learning-link"
                      className={`${secondaryButtonClass} w-full`}
                    >
                      우선 메모리 확인
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          <div className="mb-4 grid gap-2 md:grid-cols-3">
            <button
              type="button"
              onClick={copyFeedbackImprovementOpsReport}
              data-testid="dashboard-feedback-improvement-report-copy"
              className={secondaryButtonClass}
            >
              {feedbackImprovementOpsReportCopyStatus === "copied"
                ? "피드백 개선 리포트 복사됨"
                : feedbackImprovementOpsReportCopyStatus === "failed"
                  ? "피드백 개선 리포트 복사 실패"
                  : "피드백 개선 리포트 복사"}
            </button>
            <button
              type="button"
              onClick={openFeedbackImprovementOpsReportInStudio}
              data-testid="dashboard-feedback-improvement-report-studio"
              className={secondaryButtonClass}
            >
              리포트 Studio로 보내기
            </button>
            <button
              type="button"
              onClick={saveFeedbackImprovementMemories}
              data-testid="dashboard-feedback-improvement-memory-save"
              className={secondaryButtonClass}
              disabled={feedbackBasedImprovementRecords.length === 0}
            >
              {feedbackImprovementMemorySaveStatus === "saved"
                ? `학습 메모리 ${feedbackImprovementMemorySaveCount}개 저장됨`
                : feedbackImprovementMemorySaveStatus === "skipped"
                  ? "저장할 메모리 없음"
                  : "반영 피드백 메모리 저장"}
            </button>
          </div>
          {feedbackImprovementMemorySaveStatus !== "idle" ? (
            <div className="mb-4 flex flex-col gap-2 rounded-md border border-line bg-surface px-3 py-2 text-xs leading-5 text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>
                {feedbackImprovementMemorySaveStatus === "saved"
                  ? "반복 피드백 규칙을 Learning 메모리에 저장했습니다. 다음 Studio 생성 컨텍스트에 반영됩니다."
                  : "저장할 피드백 기반 개선본이 없습니다."}
              </p>
              {feedbackImprovementMemorySaveStatus === "saved" ? (
                <Link
                  href={feedbackImprovementLearningHref()}
                  data-testid="dashboard-feedback-improvement-learning-link"
                  className="shrink-0 font-semibold text-accent transition hover:text-soft"
                >
                  Learning에서 확인
                </Link>
              ) : null}
            </div>
          ) : null}
          {feedbackImprovementOpsManualCopy ? (
            <ManualCopyPanel
              copy={feedbackImprovementOpsManualCopy}
              onClose={() => setFeedbackImprovementOpsManualCopy(null)}
              className="mb-4 bg-surface"
              ariaLabel="수동 복사용 피드백 반영 개선 리포트"
            />
          ) : null}
          <div className="grid gap-3 lg:grid-cols-3">
            {feedbackBasedImprovementRecords.slice(0, 3).map((record) => (
              <div
                key={`${record.prompt.id}:${record.sourceFeedback.id ?? record.createdAt}`}
                className="min-w-0 rounded-md border border-line bg-surface px-4 py-4"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={promptDetailLibraryHref(
                        record.prompt.id,
                        record.targetModel,
                      )}
                      className="block truncate text-sm font-semibold transition hover:text-accent"
                    >
                      {record.prompt.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      원본 · {record.sourcePrompt.title}
                      {record.sourceDeletedAt ? " · 삭제 보관함" : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs ${
                      record.delta >= 0 ? "text-accent" : "text-muted"
                    }`}
                  >
                    {formatSignedScore(record.delta)}
                  </span>
                </div>

                <div className="mt-4 border-l border-accent/50 pl-3">
                  <p className="text-[11px] font-semibold text-accent">
                    반영 피드백 · {record.sourceFeedback.rating.toFixed(0)}/5 ·{" "}
                    {feedbackTypeLabels[record.sourceFeedback.feedbackType]}
                  </p>
                  <p className="mt-1 line-clamp-3 break-words text-xs leading-5 text-muted">
                    {record.sourceFeedback.comment}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                  <div className="min-w-0 rounded-md border border-line bg-panel px-2 py-2">
                    <p className="text-muted">AI 도구</p>
                    <p className="mt-1 font-semibold text-soft">
                      {modelLabels[record.targetModel]}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-md border border-line bg-panel px-2 py-2">
                    <p className="text-muted">점수 변화</p>
                    <p className="mt-1 font-mono font-semibold text-soft">
                      {record.sourceVersion.qualityScore.toFixed(1)} →{" "}
                      {record.improvedVersion.qualityScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-md border border-line bg-panel px-2 py-2">
                    <p className="text-muted">생성일</p>
                    <p className="mt-1 font-mono font-semibold text-soft">
                      {formatDashboardDate(record.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link
                    href={promptDetailLibraryHref(
                      record.prompt.id,
                      record.targetModel,
                    )}
                    className={`${secondaryButtonClass} w-full`}
                  >
                    개선본 보기
                  </Link>
                  {record.sourceDeletedAt ? (
                    <Link
                      href={promptDetailLibraryHref(
                        record.prompt.id,
                        record.targetModel,
                      )}
                      className={`${secondaryButtonClass} w-full`}
                    >
                      원본 복원
                    </Link>
                  ) : (
                    <Link
                      href={promptFeedbackLibraryHref(
                        record.sourcePrompt.id,
                        record.sourceFeedback.id,
                        record.targetModel,
                      )}
                      className={`${secondaryButtonClass} w-full`}
                    >
                      원본 피드백
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          {feedbackBasedImprovementRecords.length === 0 ? (
            <p className="text-sm leading-6 text-muted">
              아직 피드백 출처가 보존된 개선본이 없습니다. Library 최근 피드백의
              `이 피드백으로 Studio 개선`으로 만든 개선본을 저장하면 여기에
              표시됩니다.
            </p>
          ) : null}
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <PanelHeader
            title="최근 프롬프트"
            description="최근 생성한 프롬프트와 가장 높은 품질 점수를 확인합니다."
          />
          <div className="divide-y divide-line">
            {prompts.slice(0, 6).map((prompt) => {
              const best = Math.max(
                ...prompt.versions.map((version) => version.qualityScore),
              );

              return (
                <div
                  key={prompt.id}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{prompt.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {prompt.domain} ·{" "}
                      {languageStrategyLabels[prompt.languageStrategy ?? "hybrid"]} ·{" "}
                      답변 {outputLanguageLabels[prompt.outputLanguage ?? "korean"]} ·{" "}
                      {formatTargetModelLabels(prompt.targetModels)}
                    </p>
                  </div>
                  <div className="font-mono text-sm text-accent">{best.toFixed(1)}</div>
                </div>
              );
            })}
            {prompts.length === 0 ? (
              <div className="px-5 py-12 text-sm text-muted">
                아직 저장된 프롬프트가 없습니다. Studio에서 첫 작업을 생성하세요.
              </div>
            ) : null}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="개인화 기준"
              description="프로필, 회사 기준, 학습 메모리 반영 상태를 바로 점검합니다."
            />
            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-3">
                <div className="rounded-md border border-line bg-surface px-4 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-soft">개인 프로필</span>
                    <span className="font-mono text-accent">
                      {profileCompletion}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-panel">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>사용자 메모리 {userMemoryCount}개</span>
                    <span>역할 {userProfile.role || "미설정"}</span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link
                      href="/profile?returnTo=/"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      개인 기준 편집
                    </Link>
                    <Link
                      href="/learning?scope=user"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      사용자 메모리
                    </Link>
                  </div>
                </div>

                <div className="rounded-md border border-line bg-surface px-4 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-soft">회사 프로필</span>
                    <span className="font-mono text-attention">
                      {companyCompletion}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-panel">
                    <div
                      className="h-full bg-attention"
                      style={{ width: `${companyCompletion}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>회사 메모리 {companyMemoryCount}개</span>
                    <span>회사 {companyProfile.companyName || "미설정"}</span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link
                      href="/company?returnTo=/"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      회사 기준 편집
                    </Link>
                    <Link
                      href="/learning?scope=company"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      회사 메모리
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-line bg-surface px-4 py-4">
                <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-soft">
                      개인화 보강 큐
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      다음 생성 품질에 바로 영향을 주는 기준부터 정리합니다.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-accent">
                    {personalizationActions.length}
                  </span>
                </div>
                <div className="grid gap-2">
                  {personalizationActions.map((item) => (
                    <div
                      key={`${item.label}-${item.href}`}
                      className="rounded-md border border-line bg-panel px-3 py-3"
                    >
                      <Link
                        href={item.href}
                        className="block transition hover:text-accent"
                      >
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-xs font-semibold text-soft">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted">
                              {item.description}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs ${
                              item.priority === "high"
                                ? "text-accent"
                                : item.priority === "medium"
                                  ? "text-soft"
                                  : "text-muted"
                            }`}
                          >
                            {learningOpsPriorityLabel(item.priority)}
                          </span>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => openPersonalizationActionInStudio(item)}
                        data-testid="dashboard-personalization-action-studio"
                        className={`${secondaryButtonClass} mt-3 min-h-9 w-full px-3 py-1.5 text-xs`}
                      >
                        조치 Studio로 보내기
                      </button>
                      <button
                        type="button"
                        onClick={() => copyPersonalizationActionReport(item)}
                        data-testid="dashboard-personalization-action-copy"
                        className={`${secondaryButtonClass} mt-2 min-h-9 w-full px-3 py-1.5 text-xs`}
                      >
                        {personalizationActionCopyStatus?.label === item.label
                          ? personalizationActionCopyStatus.status === "copied"
                            ? "조치 복사됨"
                            : "조치 복사 실패"
                          : "조치 복사"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-line bg-surface px-4 py-4">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-soft">
                      개인화 기준 리포트
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      개인/회사 기준, 학습 scope, 다음 보강 액션을 Markdown으로
                      내보냅니다.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-accent">
                    {dataReadinessScore}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyPersonalizationReport}
                  data-testid="dashboard-personalization-report-copy"
                  className={`${secondaryButtonClass} mt-4 w-full`}
                >
                  {personalizationReportCopyStatus === "copied"
                    ? "개인화 리포트 복사됨"
                    : personalizationReportCopyStatus === "failed"
                      ? "개인화 리포트 복사 실패"
                      : "개인화 리포트 복사"}
                </button>
                <button
                  type="button"
                  onClick={openPersonalizationReportInStudio}
                  data-testid="dashboard-personalization-report-studio"
                  className={`${secondaryButtonClass} mt-2 w-full`}
                >
                  리포트 Studio로 보내기
                </button>
                {personalizationManualCopy ? (
                  <ManualCopyPanel
                    copy={personalizationManualCopy}
                    onClose={() => setPersonalizationManualCopy(null)}
                    className="mt-4 bg-panel"
                    height="h-36"
                    textareaBackground="bg-surface"
                    ariaLabel="수동 복사용 개인화 기준 리포트"
                  />
                ) : null}
              </div>

              <Link href="/skills" className={`${primaryButtonClass} w-full`}>
                스킬 빌더 열기
              </Link>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="스킬 실행 현황"
              description="실제로 반복 사용된 스킬과 최근 실행 기록입니다."
            />
            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted">활성 스킬</p>
                  <p className="mt-1 font-mono text-2xl font-semibold">
                    {skillRunStats.activeSkills}
                  </p>
                </div>
                <div>
                  <p className="text-muted">최근 실행</p>
                  <p className="mt-2 text-xs font-medium">
                    {formatTimestamp(skillRunStats.latestRun?.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted">피드백</p>
                  <p className="mt-1 font-mono text-2xl font-semibold">
                    {skillRunStats.feedbackCount}
                  </p>
                </div>
              </div>

              {skillRunStats.latestRun ? (
                <div className="rounded-md border border-line bg-surface px-3 py-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-soft">최근 실행</p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-soft">
                        {skillRunStats.latestRun.title}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-muted">
                        {formatTimestamp(skillRunStats.latestRun.createdAt)} · 품질{" "}
                        {skillRunStats.latestRun.versions[0]?.qualityScore.toFixed(
                          1,
                        ) ?? "-"}{" "}
                        · 피드백 {skillRunStats.latestRun.feedback.length}개
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link
                        href={buildPromptLibraryHref(skillRunStats.latestRun)}
                        className={`${secondaryButtonClass} w-full sm:w-auto`}
                      >
                        Library 실행 보기
                      </Link>
                      <button
                        type="button"
                        onClick={copySkillOpsLatestRunLink}
                        className={`${secondaryButtonClass} w-full sm:w-auto`}
                        data-testid="dashboard-skill-latest-run-link-copy"
                      >
                        {skillOpsLatestRunLinkCopyStatus === "copied"
                          ? "실행 링크 복사됨"
                          : skillOpsLatestRunLinkCopyStatus === "failed"
                            ? "실행 링크 복사 실패"
                            : "실행 링크 복사"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="divide-y divide-line">
                {skillRunStats.topSkills.map((item) => {
                  const skillLinkKey = `top-${item.skill.id}`;
                  const skillLinkStatus =
                    skillOpsSkillLinkCopyStatus?.key === skillLinkKey
                      ? skillOpsSkillLinkCopyStatus.status
                      : null;

                  return (
                    <div
                      key={item.skill.id}
                      className="grid gap-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.skill.name}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {item.skill.domain} · 최근{" "}
                          {formatTimestamp(item.latestRunAt)}
                        </p>
                        <p className="mt-2 font-mono text-xs text-accent sm:hidden">
                          {item.runCount}회 실행 · 성공률{" "}
                          {item.feedbackCount ? `${item.successRate}%` : "미평가"}
                        </p>
                      </div>
                      <div className="grid gap-2 sm:min-w-40">
                        <div className="hidden text-left sm:block sm:text-right">
                          <p className="font-mono text-sm text-accent">
                            {item.runCount}회 실행
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            성공률{" "}
                            {item.feedbackCount
                              ? `${item.successRate}%`
                              : "미평가"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={buildSkillHref(item.skill.id)}
                            className={`${secondaryButtonClass} px-3 py-2 text-xs`}
                          >
                            Skills 보기
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              copySkillOpsSkillLink({
                                key: skillLinkKey,
                                skillId: item.skill.id,
                                title: "반복 사용 상위 스킬 링크",
                              })
                            }
                            className={`${secondaryButtonClass} px-3 py-2 text-xs`}
                            data-testid="dashboard-skill-top-link-copy"
                          >
                            {skillLinkStatus === "copied"
                              ? "링크 복사됨"
                              : skillLinkStatus === "failed"
                                ? "복사 실패"
                                : "링크 복사"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {skillRunStats.topSkills.length === 0 ? (
                  <div className="py-6 text-sm leading-6 text-muted">
                    아직 실행 이력이 없습니다. Skills에서 스킬을 실행하고 Library에
                    저장하면 이곳에 집계됩니다.
                  </div>
                ) : null}
              </div>

              <div className="border-t border-line pt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <p className="font-semibold">개선 대기</p>
                  <p className="font-mono text-accent">
                    {skillRunStats.improvementQueue.length}
                  </p>
                </div>
                <div className="space-y-2">
                  {skillRunStats.improvementQueue.slice(0, 3).map((item) => {
                    const skillLinkKey = `improvement-${item.skill.id}`;
                    const skillLinkStatus =
                      skillOpsSkillLinkCopyStatus?.key === skillLinkKey
                        ? skillOpsSkillLinkCopyStatus.status
                        : null;

                    return (
                      <div
                        key={item.skill.id}
                        className="grid gap-2 text-xs sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-muted">{item.skill.name}</p>
                          <p className="mt-1 font-mono text-soft">
                            {item.feedbackCount
                              ? `${item.successRate}% · 피드백 ${item.feedbackCount}개`
                              : "피드백 필요"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={buildSkillHref(item.skill.id)}
                            className={`${secondaryButtonClass} px-3 py-2 text-xs`}
                          >
                            Skills 보기
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              copySkillOpsSkillLink({
                                key: skillLinkKey,
                                skillId: item.skill.id,
                                title: "개선 대기 스킬 링크",
                              })
                            }
                            className={`${secondaryButtonClass} px-3 py-2 text-xs`}
                            data-testid="dashboard-skill-improvement-link-copy"
                          >
                            {skillLinkStatus === "copied"
                              ? "링크 복사됨"
                              : skillLinkStatus === "failed"
                                ? "복사 실패"
                                : "링크 복사"}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {skillRunStats.improvementQueue.length === 0 ? (
                    <p className="text-xs leading-5 text-muted">
                      현재 개선 대기 스킬이 없습니다.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 border-t border-line pt-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copySkillOpsReport}
                  className={secondaryButtonClass}
                >
                  {skillOpsReportCopyStatus === "copied"
                    ? "스킬 운영 리포트 복사됨"
                    : skillOpsReportCopyStatus === "failed"
                      ? "스킬 운영 리포트 복사 실패"
                      : "스킬 운영 리포트 복사"}
                </button>
                <button
                  type="button"
                  onClick={openSkillOpsReportInStudio}
                  className={secondaryButtonClass}
                >
                  리포트 Studio로 보내기
                </button>
              </div>

              {skillOpsManualCopy ? (
                <ManualCopyPanel
                  copy={skillOpsManualCopy}
                  onClose={() => setSkillOpsManualCopy(null)}
                  ariaLabel="수동 복사용 스킬 운영 리포트 또는 링크"
                />
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
