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
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import {
  languageStrategyLabels,
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
import { summarizeLanguageStrategyPerformance } from "@/lib/analytics/language-strategy";
import { summarizeOutputLanguagePerformance } from "@/lib/analytics/output-language";
import { summarizeTargetModelPerformance } from "@/lib/analytics/target-model";
import { summarizeGenerationEnginePerformance } from "@/lib/analytics/generation-engine";
import {
  formatAbsoluteInternalHref,
  normalizeInternalHref,
} from "@/lib/navigation/href";
import {
  summarizePromptImprovementPerformance,
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
  formatTargetModelLabels,
} from "@/lib/dashboard/shared";
import {
  buildPromptLibraryHref,
  buildSkillHref,
  improvementLibraryHref,
  studioPersistenceLibraryHref,
  studioSourceLibraryHref,
  learningScopeLibraryHref,
  learningScopeLearningHref,
  promptDetailLibraryHref,
} from "@/lib/dashboard/hrefs";
import {
  buildFeedbackImprovementLearningMemory,
  type LearningOpsAction,
  type FeedbackBasedImprovementRecord,
  summarizeLearningContextUsage,
  summarizeLearningReviewQueues,
  learningOpsPriorityLabel,
  summarizeLearningOpsActions,
  summarizePersonalizationActions,
} from "@/lib/dashboard/learning-memory";
import {
  type DashboardNextActionQueueItem,
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
  summarizeSourceHealthIssueReasons,
  sourceHealthIssueKey,
  buildDashboardSourceHealthCandidateMemo,
  buildDashboardReimprovementBrief,
} from "@/lib/dashboard/source-reports";
import { DashboardNextActionQueuePanel } from "./dashboard-next-action-queue-panel";
import { DashboardImprovementPanel } from "./dashboard-improvement-panel";
import { DashboardPersonalizationPanel } from "./dashboard-personalization-panel";
import { DashboardSkillOpsPanel } from "./dashboard-skill-ops-panel";
import { DashboardPerformancePanel } from "./dashboard-performance-panel";
import { DashboardActivitySection } from "./dashboard-activity-section";

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
  const outputLanguageSummaries = useMemo(
    () => summarizeOutputLanguagePerformance(prompts, skills),
    [prompts, skills],
  );
  const targetModelSummaries = useMemo(
    () => summarizeTargetModelPerformance(prompts, skills),
    [prompts, skills],
  );
  const generationEngineSummaries = useMemo(
    () => summarizeGenerationEnginePerformance(prompts),
    [prompts],
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

      <DashboardNextActionQueuePanel
        copyDashboardNextActionQueueItemLink={copyDashboardNextActionQueueItemLink}
        copyDashboardNextActionQueueItemReport={copyDashboardNextActionQueueItemReport}
        copyDashboardNextActionQueueLinks={copyDashboardNextActionQueueLinks}
        copyDashboardNextActionQueueReport={copyDashboardNextActionQueueReport}
        copyDashboardNextActionQueueVerificationChecklist={copyDashboardNextActionQueueVerificationChecklist}
        dashboardNextActionQueue={dashboardNextActionQueue}
        dashboardNextActionQueueCategoryCounts={dashboardNextActionQueueCategoryCounts}
        dashboardNextActionQueueFirstAction={dashboardNextActionQueueFirstAction}
        dashboardNextActionQueueLinkCopyStatus={dashboardNextActionQueueLinkCopyStatus}
        dashboardNextActionQueueLinksCopyStatus={dashboardNextActionQueueLinksCopyStatus}
        dashboardNextActionQueueManualCopy={dashboardNextActionQueueManualCopy}
        dashboardNextActionQueuePriorityCounts={dashboardNextActionQueuePriorityCounts}
        dashboardNextActionQueueReportCopyStatus={dashboardNextActionQueueReportCopyStatus}
        dashboardNextActionQueueVerificationCopyStatus={dashboardNextActionQueueVerificationCopyStatus}
        dashboardNextActionQueueWorkflowSteps={dashboardNextActionQueueWorkflowSteps}
        learningOpsActionCopyStatus={learningOpsActionCopyStatus}
        openDashboardNextActionQueueInStudio={openDashboardNextActionQueueInStudio}
        openDashboardNextActionQueueVerificationInStudio={openDashboardNextActionQueueVerificationInStudio}
        openLearningOpsActionInStudio={openLearningOpsActionInStudio}
        openPersonalizationActionInStudio={openPersonalizationActionInStudio}
        personalizationActionCopyStatus={personalizationActionCopyStatus}
        setDashboardNextActionQueueManualCopy={setDashboardNextActionQueueManualCopy}
      />

      <DashboardPerformancePanel
        targetModelSummaries={targetModelSummaries}
        generationEngineSummaries={generationEngineSummaries}
        languageSummaries={languageSummaries}
        outputLanguageSummaries={outputLanguageSummaries}
      />

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

      <DashboardImprovementPanel
        copyFeedbackImprovementOpsReport={copyFeedbackImprovementOpsReport}
        copyFeedbackImprovementPriorityReport={copyFeedbackImprovementPriorityReport}
        copyMissingSourceMetadataQueueLink={copyMissingSourceMetadataQueueLink}
        copyMissingSourceMetadataQueuePrompt={copyMissingSourceMetadataQueuePrompt}
        copySourceHealthActionReport={copySourceHealthActionReport}
        copySourceHealthCandidateMemo={copySourceHealthCandidateMemo}
        copySourceHealthLink={copySourceHealthLink}
        copyStudioPersistenceAllLink={copyStudioPersistenceAllLink}
        copyStudioPersistenceLink={copyStudioPersistenceLink}
        copyStudioSourceAllFilterLink={copyStudioSourceAllFilterLink}
        copyStudioSourceExampleLink={copyStudioSourceExampleLink}
        copyStudioSourceFilterLink={copyStudioSourceFilterLink}
        copyStudioSourceOpsReport={copyStudioSourceOpsReport}
        copyStudioSourceVariantFilterLink={copyStudioSourceVariantFilterLink}
        feedbackBasedImprovementRecords={feedbackBasedImprovementRecords}
        feedbackImprovementArchivedSourceCount={feedbackImprovementArchivedSourceCount}
        feedbackImprovementAverageDelta={feedbackImprovementAverageDelta}
        feedbackImprovementMemorySaveCount={feedbackImprovementMemorySaveCount}
        feedbackImprovementMemorySaveStatus={feedbackImprovementMemorySaveStatus}
        feedbackImprovementOpsManualCopy={feedbackImprovementOpsManualCopy}
        feedbackImprovementOpsReportCopyStatus={feedbackImprovementOpsReportCopyStatus}
        feedbackImprovementPriorityCopyStatus={feedbackImprovementPriorityCopyStatus}
        feedbackImprovementPriorityMemoryPreview={feedbackImprovementPriorityMemoryPreview}
        feedbackImprovementPriorityMemorySaveStatus={feedbackImprovementPriorityMemorySaveStatus}
        feedbackImprovementPriorityRecord={feedbackImprovementPriorityRecord}
        feedbackImprovementReviewCount={feedbackImprovementReviewCount}
        improvementSummary={improvementSummary}
        missingSourceMetadataQueueCopyStatus={missingSourceMetadataQueueCopyStatus}
        missingSourceMetadataQueueLinkCopyStatus={missingSourceMetadataQueueLinkCopyStatus}
        missingSourceMetadataQueueManualCopy={missingSourceMetadataQueueManualCopy}
        missingSourceMetadataSummary={missingSourceMetadataSummary}
        openFeedbackImprovementOpsReportInStudio={openFeedbackImprovementOpsReportInStudio}
        openFeedbackImprovementPriorityInStudio={openFeedbackImprovementPriorityInStudio}
        openMissingSourceMetadataQueueInStudio={openMissingSourceMetadataQueueInStudio}
        openReimprovementInStudio={openReimprovementInStudio}
        openSourceHealthActionReportInStudio={openSourceHealthActionReportInStudio}
        openSourceHealthCandidateInStudio={openSourceHealthCandidateInStudio}
        openStudioSourceOpsReportInStudio={openStudioSourceOpsReportInStudio}
        saveFeedbackImprovementMemories={saveFeedbackImprovementMemories}
        saveFeedbackImprovementPriorityMemory={saveFeedbackImprovementPriorityMemory}
        setFeedbackImprovementOpsManualCopy={setFeedbackImprovementOpsManualCopy}
        setMissingSourceMetadataQueueManualCopy={setMissingSourceMetadataQueueManualCopy}
        setSourceHealthManualCopy={setSourceHealthManualCopy}
        setStudioPersistenceManualCopy={setStudioPersistenceManualCopy}
        setStudioSourceExampleManualCopy={setStudioSourceExampleManualCopy}
        setStudioSourceFilterManualCopy={setStudioSourceFilterManualCopy}
        setStudioSourceOpsManualCopy={setStudioSourceOpsManualCopy}
        sourceHealthActionCopyStatus={sourceHealthActionCopyStatus}
        sourceHealthCandidateCopyStatus={sourceHealthCandidateCopyStatus}
        sourceHealthLinkCopyStatus={sourceHealthLinkCopyStatus}
        sourceHealthManualCopy={sourceHealthManualCopy}
        sourceHealthPreviewIssues={sourceHealthPreviewIssues}
        sourceHealthReasonBreakdown={sourceHealthReasonBreakdown}
        studioPersistenceAllLinkCopyStatus={studioPersistenceAllLinkCopyStatus}
        studioPersistenceLinkCopyStatus={studioPersistenceLinkCopyStatus}
        studioPersistenceManualCopy={studioPersistenceManualCopy}
        studioPersistenceSummary={studioPersistenceSummary}
        studioSourceAllFilterLinkCopyStatus={studioSourceAllFilterLinkCopyStatus}
        studioSourceExampleLinkCopyStatus={studioSourceExampleLinkCopyStatus}
        studioSourceExampleManualCopy={studioSourceExampleManualCopy}
        studioSourceFilterLinkCopyStatus={studioSourceFilterLinkCopyStatus}
        studioSourceFilterManualCopy={studioSourceFilterManualCopy}
        studioSourceOpsManualCopy={studioSourceOpsManualCopy}
        studioSourceOpsReportCopyStatus={studioSourceOpsReportCopyStatus}
        studioSourceSummary={studioSourceSummary}
      />

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
          <DashboardPersonalizationPanel
            companyCompletion={companyCompletion}
            companyMemoryCount={companyMemoryCount}
            companyProfile={companyProfile}
            copyPersonalizationActionReport={copyPersonalizationActionReport}
            copyPersonalizationReport={copyPersonalizationReport}
            dataReadinessScore={dataReadinessScore}
            openPersonalizationActionInStudio={openPersonalizationActionInStudio}
            openPersonalizationReportInStudio={openPersonalizationReportInStudio}
            personalizationActionCopyStatus={personalizationActionCopyStatus}
            personalizationActions={personalizationActions}
            personalizationManualCopy={personalizationManualCopy}
            personalizationReportCopyStatus={personalizationReportCopyStatus}
            profileCompletion={profileCompletion}
            setPersonalizationManualCopy={setPersonalizationManualCopy}
            userMemoryCount={userMemoryCount}
            userProfile={userProfile}
          />

          <DashboardSkillOpsPanel
            copySkillOpsLatestRunLink={copySkillOpsLatestRunLink}
            copySkillOpsReport={copySkillOpsReport}
            copySkillOpsSkillLink={copySkillOpsSkillLink}
            openSkillOpsReportInStudio={openSkillOpsReportInStudio}
            setSkillOpsManualCopy={setSkillOpsManualCopy}
            skillOpsLatestRunLinkCopyStatus={skillOpsLatestRunLinkCopyStatus}
            skillOpsManualCopy={skillOpsManualCopy}
            skillOpsReportCopyStatus={skillOpsReportCopyStatus}
            skillOpsSkillLinkCopyStatus={skillOpsSkillLinkCopyStatus}
            skillRunStats={skillRunStats}
          />
        </div>
      </div>

      <DashboardActivitySection />
    </>
  );
}
