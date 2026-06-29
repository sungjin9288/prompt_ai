"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  TargetAiHandoffPreviewPanel,
  type HandoffPreviewMode,
} from "@/components/prompt/target-ai-handoff-preview-panel";
import {
  languageStrategies,
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  outputLanguages,
  promptStudioDraftSourceVariants,
  targetModels,
  buildMissingContextQuestionsText,
  buildTargetAiHandoffImprovementBriefText,
  buildTargetAiHandoffPackageText,
  buildTargetAiHandoffReadinessItems,
  type Feedback,
  type MemoryScope,
  type PromptAsset,
  type PromptDeletedAsset,
  type PromptLanguageStrategy,
  type PromptOutputLanguage,
  type PromptScoreBreakdown,
  type PromptStudioSourceMeta,
  type PromptStudioDraftSourceVariant,
  type PromptVersion,
  type TargetAiHandoffReadinessItem,
  type TargetModel,
} from "@/lib/prompt";
import {
  createMemoryFromFeedback,
  mergeMemoryList,
} from "@/lib/learning/memory";
import {
  useDeletedPromptAssetsStore,
  useLearningMemoriesStore,
  usePromptAssetsStore,
} from "@/lib/data/workspace-store";
import {
  formatAbsoluteInternalHref,
  normalizeInternalHref,
} from "@/lib/navigation/href";
import { writeStudioDraft } from "@/lib/studio/draft";
import {
  getPromptStudioSourceLibraryFilterLabel,
  promptStudioDraftSourceOptions,
} from "@/lib/studio/source-registry";
import { getStudioDraftDisplaySourceLabel } from "@/lib/studio/draft-display";
import {
  reimprovementQualityThreshold,
  type PromptSourceHealthIssueReason,
} from "@/lib/analytics/prompt-improvement";
import { copyTextToClipboard } from "@/lib/browser/clipboard";

function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

type LanguageFilter = PromptLanguageStrategy | "all";
type OutputLanguageFilter = PromptOutputLanguage | "all";
type TargetModelFilter = TargetModel | "all";
type GenerationEngineFilter = PromptAsset["source"] | "all";
type LearningScopeFilter = MemoryScope | "untracked" | "all";
type SourceReasonFilter = PromptSourceHealthIssueReason | "all";
type StudioPersistenceFilter = "all" | "chain" | "none" | "ops";
type StudioSourceFilter = PromptStudioSourceMeta["source"] | "all";
type StudioSourceVariantFilter = PromptStudioDraftSourceVariant | "all";
type ImprovementFilter =
  | "all"
  | "archived-source"
  | "improved"
  | "regressed"
  | "reimprovement"
  | "unmeasured";
type LibrarySortMode = "recent" | "quality" | "feedback" | "improvement";
type PromptDetailMode = "current" | "comparison";
type LibraryFocusTarget = "feedback";
type ActiveFilterId =
  | "language"
  | "output"
  | "model"
  | "engine"
  | "learning"
  | "improvement"
  | "source-reason"
  | "studio-persistence"
  | "studio-source"
  | "studio-variant"
  | "query"
  | "sort";

interface ActiveFilterItem {
  id: ActiveFilterId;
  label: string;
  removeLabel: string;
}

type LibraryManualCopy = {
  id:
    | "prompt"
    | "target-ai-package"
    | "target-ai-improvement-brief"
    | "filter-link"
    | "detail-link"
    | "improvement-brief"
    | "missing-context"
    | "learning-report"
    | "comparison-brief"
    | "source-health-filter-link"
    | "source-health-filter-report"
    | "source-health-candidate-link"
    | "source-health-candidate-note"
    | "selected-operational-summary-report"
    | "selected-operational-group-link"
    | "selected-operational-source-link"
    | "selected-operational-persistence-link"
    | "selected-studio-source-link"
    | "selected-studio-source-original-link"
    | "selected-studio-persistence-link"
    | "list-studio-source-link"
    | "list-studio-source-original-link"
    | "list-studio-persistence-link"
    | "list-studio-operational-group-link"
    | "studio-operational-group-link"
    | "studio-operational-group-report"
    | "studio-persistence-link"
    | "studio-persistence-report"
    | "studio-persistence-candidate-note"
    | "studio-source-link"
    | "studio-source-report"
    | "studio-source-candidate-note"
    | "studio-variant-link"
    | "no-source-meta-note";
  targetId?: string;
  title: string;
  body: string;
};

function LibraryManualCopyPanel({
  copy,
  onClose,
}: {
  copy: LibraryManualCopy;
  onClose: () => void;
}) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-soft">수동 복사 필요</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {copy.title} 복사가 차단됐습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-accent transition hover:text-soft"
        >
          닫기
        </button>
      </div>
      <textarea
        readOnly
        value={copy.body}
        className="mt-3 h-40 w-full resize-y rounded-md border border-line bg-panel px-3 py-2 font-mono text-xs leading-5 text-soft outline-none"
        aria-label={`수동 복사용 ${copy.title}`}
      />
    </div>
  );
}

const librarySortModes: LibrarySortMode[] = [
  "recent",
  "quality",
  "feedback",
  "improvement",
];

const librarySortLabels: Record<LibrarySortMode, string> = {
  recent: "최신순",
  quality: "품질순",
  feedback: "피드백 많은 순",
  improvement: "개선 효과순",
};

const improvementFilterModes: ImprovementFilter[] = [
  "all",
  "improved",
  "regressed",
  "reimprovement",
  "archived-source",
  "unmeasured",
];

const improvementFilterLabels: Record<ImprovementFilter, string> = {
  all: "전체",
  improved: "개선됨",
  regressed: "재검토",
  reimprovement: "재개선 후보",
  "archived-source": "보관함 원본",
  unmeasured: "측정 불가",
};

const sourceReasonFilterModes: SourceReasonFilter[] = [
  "all",
  "archived-source",
  "missing-source",
  "missing-source-version",
  "missing-improved-version",
];

const sourceReasonFilterLabels: Record<SourceReasonFilter, string> = {
  all: "전체",
  "archived-source": "원본 보관함",
  "missing-source": "원본 누락",
  "missing-source-version": "원본 버전 누락",
  "missing-improved-version": "개선본 버전 누락",
};

const studioPersistenceFilterModes: StudioPersistenceFilter[] = [
  "all",
  "chain",
  "ops",
  "none",
];

const studioPersistenceFilterLabels: Record<StudioPersistenceFilter, string> = {
  all: "전체 저장 방식",
  chain: "개선 체인",
  ops: "운영 출처",
  none: "Studio 출처 없음",
};

const studioSourceFilterModes: StudioSourceFilter[] = [
  "all",
  ...promptStudioDraftSourceOptions,
];

const studioSourceVariantFilterModes: StudioSourceVariantFilter[] = [
  "all",
  ...promptStudioDraftSourceVariants,
];

function getStudioSourceFilterLabel(source: StudioSourceFilter) {
  return source === "all"
    ? "전체 Studio 저장 출처"
    : getPromptStudioSourceLibraryFilterLabel(source);
}

const studioSourceVariantFilterLabels: Record<
  PromptStudioDraftSourceVariant,
  string
> = {
  "dashboard-next-action-queue-verification":
    "Dashboard 다음 실행 큐 완료 확인",
  "feedback-improvement": "Library 피드백 개선 브리프",
  "handoff-improvement": "AI 전달 보강 브리프",
  "learning-low-confidence-validation": "Learning 저신뢰도 피드백 검증",
};

function getStudioSourceVariantFilterLabel(
  sourceVariant: StudioSourceVariantFilter,
) {
  return sourceVariant === "all"
    ? "전체 세부 초안 유형"
    : studioSourceVariantFilterLabels[sourceVariant];
}

function getPromptStudioSourceMetaLibraryLabel(
  studioSource: PromptStudioSourceMeta,
) {
  const displayLabel = getStudioDraftDisplaySourceLabel(studioSource);

  return {
    actionLabel: displayLabel.sourceActionLabel,
    label: displayLabel.label,
  };
}

function getPromptStudioSourceVariantLabel(
  studioSource: PromptStudioSourceMeta | undefined,
) {
  return studioSource?.sourceVariant
    ? getPromptStudioSourceMetaLibraryLabel(studioSource).label
    : undefined;
}

function summarizePromptStudioSourceVariantLabels(prompts: PromptAsset[]) {
  return summarizePromptStudioSourceVariantItems(prompts).map(
    ({ count, label }) => `${label} ${count}개`,
  );
}

function summarizePromptStudioSourceVariantItems(prompts: PromptAsset[]) {
  const counts = prompts.reduce<
    Partial<
      Record<
        PromptStudioDraftSourceVariant,
        {
          count: number;
          label: string;
          sourceVariant: PromptStudioDraftSourceVariant;
        }
      >
    >
  >(
    (accumulator, prompt) => {
      const sourceVariant = prompt.studioSource?.sourceVariant;

      if (!sourceVariant) {
        return accumulator;
      }

      const variantLabel = getPromptStudioSourceVariantLabel(
        prompt.studioSource,
      );

      if (!variantLabel) {
        return accumulator;
      }

      const previous = accumulator[sourceVariant];

      accumulator[sourceVariant] = {
        count: (previous?.count ?? 0) + 1,
        label: previous?.label ?? variantLabel,
        sourceVariant,
      };

      return accumulator;
    },
    {},
  );

  return Object.values(counts)
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.label.localeCompare(right.label, "ko") ||
        left.sourceVariant.localeCompare(right.sourceVariant),
    );
}

const studioPersistenceFilterDescriptions: Record<
  Exclude<StudioPersistenceFilter, "all">,
  string
> = {
  chain:
    "원본 Library 프롬프트와 개선본이 연결되어 개선 효과 분석에 포함되는 저장본입니다.",
  ops:
    "Dashboard, Library, Learning, Skills 등 운영 화면에서 만든 초안으로, 개선 체인이 아니라 저장 출처 메타로 추적됩니다.",
  none:
    "초기 데이터 또는 직접 저장된 프롬프트처럼 Studio 저장 출처 메타가 아직 없는 저장본입니다.",
};

const sourceReasonIssueDescriptions: Record<
  PromptSourceHealthIssueReason,
  string
> = {
  "archived-source":
    "원본이 삭제 보관함에 있어 복원하면 개선 효과 추적을 더 안정적으로 유지할 수 있습니다.",
  "missing-source":
    "원본 프롬프트를 찾을 수 없어 백업 가져오기나 원본 재저장이 필요합니다.",
  "missing-source-version":
    "원본 프롬프트는 있지만 비교 기준 버전을 찾을 수 없어 버전 연결을 확인해야 합니다.",
  "missing-improved-version":
    "개선본에서 비교할 대상 버전을 찾을 수 없어 저장된 개선본 버전을 확인해야 합니다.",
};

const generationEngines: PromptAsset["source"][] = ["local", "openai"];

const generationEngineLabels: Record<GenerationEngineFilter, string> = {
  all: "전체",
  local: "Local builder",
  openai: "OpenAI",
};

const learningScopeFilters: Exclude<LearningScopeFilter, "all">[] = [
  "company",
  "user",
  "domain",
  "skill",
  "untracked",
];

const memoryScopeLabels: Record<MemoryScope, string> = {
  user: "사용자",
  company: "회사",
  domain: "분야",
  skill: "스킬",
};

const feedbackTypeLabels: Record<Feedback["feedbackType"], string> = {
  accuracy: "정확성",
  company_rule: "회사 기준",
  context: "맥락",
  format: "출력 형식",
  other: "기타",
  tone: "톤",
};

const learningScopeFilterLabels: Record<LearningScopeFilter, string> = {
  all: "전체",
  ...memoryScopeLabels,
  untracked: "기록 없음",
};

function getPromptStudioSourceHref(source?: PromptStudioSourceMeta) {
  return normalizeInternalHref(source?.sourceHref);
}

function buildContextEditorHref({
  fallbackReturnTo,
  pathname,
  returnTo,
}: {
  fallbackReturnTo: string;
  pathname: "/company" | "/profile";
  returnTo?: string;
}) {
  const normalizedReturnTo =
    normalizeInternalHref(returnTo) ??
    normalizeInternalHref(fallbackReturnTo) ??
    "/library";
  const params = new URLSearchParams({ returnTo: normalizedReturnTo });

  return normalizeInternalHref(`${pathname}?${params.toString()}`) ?? pathname;
}

function getPromptStudioSourcePersistenceMeta(
  source: PromptStudioSourceMeta["source"],
) {
  return source === "library-improvement"
    ? {
        label: "개선 체인",
        description: "이 저장본은 원본 Library 프롬프트의 개선본으로 연결됩니다.",
      }
    : {
        label: "운영 출처",
        description: "이 저장본은 개선 체인이 아니라 Studio 저장 출처 메타로만 추적됩니다.",
      };
}

function getPromptStudioSourceRelationshipDescription(
  source: PromptStudioSourceMeta["source"],
) {
  if (source === "library-no-source-meta") {
    return "저장 출처 메타가 없던 Library 저장본을 Studio에서 운영 기준으로 다시 정리한 결과입니다.";
  }

  if (source === "library-improvement") {
    return "원본 Library 프롬프트를 개선 체인으로 다시 생성한 결과입니다.";
  }

  if (source.startsWith("library-")) {
    return "Library의 필터, 후보, 상세 메모에서 Studio로 보낸 운영 결과입니다.";
  }

  if (source.startsWith("dashboard-")) {
    return "Dashboard의 운영 진단이나 권장 조치에서 Studio로 보낸 결과입니다.";
  }

  return "Learning의 필터 또는 메모리 기준에서 Studio로 보낸 결과입니다.";
}

function getPromptStudioPersistenceFilter(prompt: PromptAsset) {
  if (!prompt.studioSource) {
    return "none" satisfies StudioPersistenceFilter;
  }

  return prompt.studioSource.source === "library-improvement"
    ? ("chain" satisfies StudioPersistenceFilter)
    : ("ops" satisfies StudioPersistenceFilter);
}

type ScoreMetricKey = keyof PromptScoreBreakdown;

interface ImprovementAction {
  key: ScoreMetricKey;
  label: string;
  recommendation: string;
  score: number;
}

interface ScoreMetricComparison {
  key: ScoreMetricKey;
  label: string;
  recommendation: string;
  sourceScore: number;
  improvedScore: number;
  delta: number;
  status: "improved" | "regressed" | "unchanged";
}

interface ImprovementScoreComparison {
  improvedCount: number;
  regressedCount: number;
  unchangedCount: number;
  metrics: ScoreMetricComparison[];
  strongestImprovement?: ScoreMetricComparison;
  reviewCandidate?: ScoreMetricComparison;
}

const scoreMetricDefinitions: Array<
  Omit<ImprovementAction, "score">
> = [
  {
    key: "clarity",
    label: "명확성",
    recommendation: "역할, 목표, 성공 기준을 더 직접적인 문장으로 분리합니다.",
  },
  {
    key: "context",
    label: "맥락",
    recommendation: "사용자/회사/분야 배경과 실제 사용 상황을 앞부분에 보강합니다.",
  },
  {
    key: "outputFormat",
    label: "출력 형식",
    recommendation: "목차, 표, 체크리스트, JSON 등 기대 산출물 형식을 명시합니다.",
  },
  {
    key: "constraints",
    label: "제약 조건",
    recommendation: "금지 표현, 검증 기준, 범위 밖 작업, 사실 확인 규칙을 추가합니다.",
  },
  {
    key: "expertise",
    label: "전문성",
    recommendation: "분야별 판단 기준, 용어, 평가 관점을 더 구체화합니다.",
  },
  {
    key: "modelFit",
    label: "도구 적합성",
    recommendation: "대상 AI 도구의 강점에 맞게 단계, 추론 방식, 산출물 요구를 조정합니다.",
  },
  {
    key: "reusability",
    label: "재사용성",
    recommendation: "반복 사용 가능한 변수, 입력 슬롯, 체크리스트 구조로 정리합니다.",
  },
];

function getLanguageStrategy(prompt: PromptAsset): PromptLanguageStrategy {
  return prompt.languageStrategy ?? "hybrid";
}

function getOutputLanguage(prompt: PromptAsset): PromptOutputLanguage {
  return prompt.outputLanguage ?? "korean";
}

function getLanguageDecisionText(prompt: PromptAsset) {
  return (
    prompt.languageDecision?.reason ??
    "이전 데이터이거나 판단 메타가 저장되기 전 생성된 프롬프트입니다."
  );
}

function getTargetModelDecisionText(prompt: PromptAsset) {
  return (
    prompt.targetModelDecision?.reason ??
    "이전 데이터이거나 대상 AI 추천 메타가 저장되기 전 생성된 프롬프트입니다."
  );
}

function formatEnabledMemoryScopes(prompt: PromptAsset) {
  const scopes = prompt.learningContext?.enabledScopes;

  if (!scopes) {
    return "기록 없음";
  }

  const enabled = Object.entries(scopes)
    .filter(([, isEnabled]) => isEnabled)
    .map(([scope]) => memoryScopeLabels[scope as MemoryScope]);

  return enabled.length ? enabled.join(", ") : "학습 메모리 제외";
}

function formatLearningContextCount(prompt: PromptAsset) {
  return prompt.learningContext
    ? `메모리 ${prompt.learningContext.appliedMemoryCount} · 피드백 ${prompt.learningContext.recentFeedbackCount}`
    : "메타 없음";
}

function promptMatchesLearningScope(
  prompt: PromptAsset,
  learningFilter: LearningScopeFilter,
) {
  if (learningFilter === "all") {
    return true;
  }

  if (learningFilter === "untracked") {
    return !prompt.learningContext;
  }

  return Boolean(prompt.learningContext?.enabledScopes[learningFilter]);
}

function buildLearningContextReportText(prompt: PromptAsset) {
  const context = prompt.learningContext;

  if (!context) {
    return [
      `# 학습 컨텍스트 리포트 · ${prompt.title}`,
      "",
      "- 상태: 학습 컨텍스트 메타 없음",
      "- 설명: 이 프롬프트는 학습 컨텍스트 메타 저장 기능 도입 전 생성됐습니다.",
      `- 생성 엔진: ${generationEngineLabels[prompt.source]}${
        prompt.modelUsed ? ` ${prompt.modelUsed}` : ""
      }`,
      `- 분야: ${prompt.domain}`,
      `- 목표: ${prompt.goal}`,
    ].join("\n");
  }

  const enabledScopes = Object.entries(context.enabledScopes)
    .filter(([, isEnabled]) => isEnabled)
    .map(([scope]) => memoryScopeLabels[scope as MemoryScope]);
  const disabledScopes = Object.entries(context.enabledScopes)
    .filter(([, isEnabled]) => !isEnabled)
    .map(([scope]) => memoryScopeLabels[scope as MemoryScope]);

  return [
    `# 학습 컨텍스트 리포트 · ${prompt.title}`,
    "",
    `- 생성 엔진: ${generationEngineLabels[prompt.source]}${
      prompt.modelUsed ? ` ${prompt.modelUsed}` : ""
    }`,
    `- 분야: ${prompt.domain}`,
    `- 목표: ${prompt.goal}`,
    `- Enabled scope: ${
      enabledScopes.length ? enabledScopes.join(", ") : "학습 메모리 제외"
    }`,
    `- Disabled scope: ${
      disabledScopes.length ? disabledScopes.join(", ") : "없음"
    }`,
    `- 적용 학습 메모리: ${context.appliedMemoryCount}개`,
    `- 최근 피드백: ${context.recentFeedbackCount}개`,
    "",
    "## 적용 메모리",
    context.appliedMemoryTitles.length
      ? context.appliedMemoryTitles.map((title) => `- ${title}`).join("\n")
      : "- 적용 메모리 없음",
  ].join("\n");
}

function buildLearningContextStudioDraftText({
  baseUrl,
  detailHref,
  prompt,
}: {
  baseUrl: string;
  detailHref: string;
  prompt: PromptAsset;
}) {
  const detailLink = formatAbsoluteInternalHref(detailHref, baseUrl) ?? detailHref;

  return [
    buildLearningContextReportText(prompt),
    "",
    "## Library 추적",
    `- Library 상세: ${detailLink}`,
    "- 다음 작업: 이 학습 증거가 현재 프롬프트 품질에 충분히 반영됐는지 확인하고 재개선 계획을 작성합니다.",
  ].join("\n");
}

function formatTargetModels(models: TargetModel[]) {
  return models.map((model) => modelLabels[model]).join(", ");
}

function getPromptBestQuality(prompt: PromptAsset) {
  return Math.max(...prompt.versions.map((version) => version.qualityScore));
}

function getPromptTimestamp(prompt: PromptAsset) {
  return new Date(prompt.updatedAt || prompt.createdAt).getTime();
}

function getVersionFeedbackStats(prompt: PromptAsset, promptVersionId: string) {
  const feedback = prompt.feedback.filter(
    (item) => item.promptVersionId === promptVersionId,
  );
  const averageRating = feedback.length
    ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length
    : undefined;

  return {
    averageRating,
    count: feedback.length,
  };
}

function getSourceVersion(
  improvementPrompt: PromptAsset,
  sourcePrompt?: PromptAsset,
) {
  if (!sourcePrompt || !improvementPrompt.improvementSource) {
    return undefined;
  }

  const { sourceVersionId, sourceVersionModel } =
    improvementPrompt.improvementSource;

  return (
    sourcePrompt.versions.find((version) => version.id === sourceVersionId) ??
    sourcePrompt.versions.find(
      (version) => version.targetModel === sourceVersionModel,
    ) ??
    sourcePrompt.versions[0]
  );
}

function getImprovedVersion(
  improvementPrompt: PromptAsset,
  sourceVersion?: PromptVersion,
  preferredVersion?: PromptVersion,
) {
  return (
    preferredVersion ??
    improvementPrompt.versions.find(
      (version) => version.targetModel === sourceVersion?.targetModel,
    ) ??
    improvementPrompt.versions[0]
  );
}

function getImprovementQualityDelta({
  improvementPrompt,
  preferredVersion,
  sourcePrompt,
}: {
  improvementPrompt: PromptAsset;
  preferredVersion?: PromptVersion;
  sourcePrompt?: PromptAsset;
}) {
  const sourceVersion = getSourceVersion(improvementPrompt, sourcePrompt);
  const improvedVersion = getImprovedVersion(
    improvementPrompt,
    sourceVersion,
    preferredVersion,
  );

  if (!sourceVersion || !improvedVersion) {
    return undefined;
  }

  return {
    delta: improvedVersion.qualityScore - sourceVersion.qualityScore,
    improvedScore: improvedVersion.qualityScore,
    improvedVersion,
    sourceScore: sourceVersion.qualityScore,
    sourceVersion,
  };
}

function findPromptById(
  promptId: string | undefined,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  if (!promptId) {
    return undefined;
  }

  return (
    prompts.find((item) => item.id === promptId) ??
    deletedPrompts.find((item) => item.prompt.id === promptId)?.prompt
  );
}

function hasArchivedSourcePrompt(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  const sourcePromptId = prompt.improvementSource?.sourcePromptId;

  if (!sourcePromptId) {
    return false;
  }

  const activeSource = prompts.some((item) => item.id === sourcePromptId);
  const archivedSource = deletedPrompts.some(
    (item) => item.prompt.id === sourcePromptId,
  );

  return !activeSource && archivedSource;
}

function getPromptSourceHealthIssueReason(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
): PromptSourceHealthIssueReason | undefined {
  if (!prompt.improvementSource) {
    return undefined;
  }

  const sourcePromptId = prompt.improvementSource.sourcePromptId;
  const activeSource = prompts.find((item) => item.id === sourcePromptId);
  const deletedSource = deletedPrompts.find(
    (item) => item.prompt.id === sourcePromptId,
  );
  const sourcePrompt = activeSource ?? deletedSource?.prompt;
  const sourceVersion = getSourceVersion(prompt, sourcePrompt);
  const improvedVersion = getImprovedVersion(prompt, sourceVersion);

  if (!sourcePrompt) {
    return "missing-source";
  }

  if (!sourceVersion) {
    return "missing-source-version";
  }

  if (!improvedVersion) {
    return "missing-improved-version";
  }

  return !activeSource && deletedSource ? "archived-source" : undefined;
}

function getPromptImprovementDelta(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  if (!prompt.improvementSource) {
    return undefined;
  }

  const sourcePrompt = findPromptById(
    prompt.improvementSource.sourcePromptId,
    prompts,
    deletedPrompts,
  );

  return getImprovementQualityDelta({
    improvementPrompt: prompt,
    sourcePrompt,
  })?.delta;
}

function isPromptReimprovementCandidate(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  if (!prompt.improvementSource) {
    return false;
  }

  const sourcePrompt = findPromptById(
    prompt.improvementSource.sourcePromptId,
    prompts,
    deletedPrompts,
  );
  const improvement = getImprovementQualityDelta({
    improvementPrompt: prompt,
    sourcePrompt,
  });

  return Boolean(
    improvement &&
      (improvement.delta <= 0 ||
        improvement.improvedScore < reimprovementQualityThreshold),
  );
}

function getPromptImprovementStatus(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
): Exclude<
  ImprovementFilter,
  "all" | "archived-source" | "reimprovement"
> | undefined {
  if (!prompt.improvementSource) {
    return undefined;
  }

  const delta = getPromptImprovementDelta(prompt, prompts, deletedPrompts);

  if (delta === undefined) {
    return "unmeasured";
  }

  return delta >= 0 ? "improved" : "regressed";
}

function getPromptImprovementFilterMatch(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
  filter: Exclude<ImprovementFilter, "all">,
) {
  if (filter === "archived-source") {
    return hasArchivedSourcePrompt(prompt, prompts, deletedPrompts);
  }

  return filter === "reimprovement"
    ? isPromptReimprovementCandidate(prompt, prompts, deletedPrompts)
    : getPromptImprovementStatus(prompt, prompts, deletedPrompts) === filter;
}

function getPromptImprovementLineage(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  const lineage: PromptAsset[] = [];
  const visited = new Set<string>();
  let current: PromptAsset | undefined = prompt;

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    lineage.unshift(current);

    const sourcePromptId: string | undefined =
      current.improvementSource?.sourcePromptId;

    if (!sourcePromptId) {
      break;
    }

    current = findPromptById(sourcePromptId, prompts, deletedPrompts);
  }

  return lineage;
}

function getPromptImprovementDepth(
  prompt: PromptAsset,
  prompts: PromptAsset[],
  deletedPrompts: PromptDeletedAsset[],
) {
  return Math.max(
    0,
    getPromptImprovementLineage(prompt, prompts, deletedPrompts).length - 1,
  );
}

function formatPromptImprovementDepth(depth: number) {
  if (depth <= 0) {
    return "개선본";
  }

  return `${depth}차 개선본`;
}

function formatQualityDelta(delta: number) {
  if (delta > 0) {
    return `+${delta.toFixed(1)}`;
  }

  return delta.toFixed(1);
}

function getScoreMetricStatus(delta: number): ScoreMetricComparison["status"] {
  if (delta > 0) {
    return "improved";
  }

  if (delta < 0) {
    return "regressed";
  }

  return "unchanged";
}

function buildImprovementScoreComparison({
  improvedVersion,
  sourceVersion,
}: {
  improvedVersion: PromptVersion;
  sourceVersion: PromptVersion;
}): ImprovementScoreComparison {
  const metrics = scoreMetricDefinitions.map((definition) => {
    const sourceScore = sourceVersion.scoreBreakdown[definition.key];
    const improvedScore = improvedVersion.scoreBreakdown[definition.key];
    const delta = improvedScore - sourceScore;

    return {
      ...definition,
      delta,
      improvedScore,
      sourceScore,
      status: getScoreMetricStatus(delta),
    };
  });
  const improvedMetrics = metrics.filter((metric) => metric.delta > 0);
  const regressedMetrics = metrics.filter((metric) => metric.delta < 0);
  const strongestImprovement = improvedMetrics
    .slice()
    .sort((left, right) => right.delta - left.delta)[0];
  const reviewCandidate =
    regressedMetrics.slice().sort((left, right) => left.delta - right.delta)[0] ??
    metrics
      .slice()
      .sort(
        (left, right) =>
          left.improvedScore - right.improvedScore || left.delta - right.delta,
      )[0];

  return {
    improvedCount: improvedMetrics.length,
    metrics,
    regressedCount: regressedMetrics.length,
    reviewCandidate,
    strongestImprovement,
    unchangedCount: metrics.length - improvedMetrics.length - regressedMetrics.length,
  };
}

function getImprovementActions(version: PromptVersion): ImprovementAction[] {
  const rankedActions = scoreMetricDefinitions
    .map((definition) => ({
      ...definition,
      score: version.scoreBreakdown[definition.key],
    }))
    .sort((left, right) => left.score - right.score);
  const weakActions = rankedActions.filter((item) => item.score < 4.5);

  return (weakActions.length ? weakActions : rankedActions).slice(0, 3);
}

function buildImprovementBrief({
  actions,
  feedback,
  prompt,
  version,
}: {
  actions: ImprovementAction[];
  feedback?: Feedback;
  prompt: PromptAsset;
  version: PromptVersion;
}) {
  const assumptions = version.assumptions.length
    ? version.assumptions.map((item) => `- ${item}`).join("\n")
    : "- No explicit assumptions recorded.";
  const missingContext = version.missingContext.length
    ? version.missingContext.map((item) => `- ${item}`).join("\n")
    : "- No required missing context recorded.";
  const priorityActions = actions
    .map(
      (item, index) =>
        `${index + 1}. ${item.label} (${item.score.toFixed(1)}/5): ${
          item.recommendation
        }`,
    )
    .join("\n");
  const feedbackSection = feedback
    ? `
User feedback to apply:
- Rating: ${feedback.rating}/5
- Type: ${feedbackTypeLabels[feedback.feedbackType]}
- Comment: ${feedback.comment}`
    : "";

  return `Role:
You are a senior prompt engineer improving a production prompt for ${modelLabels[version.targetModel]}.

Objective:
Rewrite the current prompt so it is clearer, more reusable, and better aligned with the target AI tool while preserving the original intent.

Context:
- Title: ${prompt.title}
- Domain: ${prompt.domain}
- Goal: ${prompt.goal}
- Language strategy: ${languageStrategyLabels[getLanguageStrategy(prompt)]}
- Desired answer language: ${outputLanguageLabels[getOutputLanguage(prompt)]}
- Target AI tool: ${modelLabels[version.targetModel]}
- Current quality score: ${version.qualityScore.toFixed(1)}/5

Priority improvements:
${priorityActions}

Assumptions to preserve or make explicit:
${assumptions}

Missing context to ask about or mark as assumptions:
${missingContext}
${feedbackSection}

Instructions:
- Do not invent facts, numbers, or company-specific details.
- Separate facts, assumptions, and verification-needed items.
- Treat supplied user feedback as the primary revision signal when it is present.
- Keep the prompt practical enough to paste directly into the target AI tool.
- Return only the improved prompt.

Current prompt:
${version.content}`;
}

function buildPromptComparisonBrief({
  delta,
  improvedScore,
  improvedVersion,
  prompt,
  scoreComparison,
  sourceScore,
  sourceVersion,
}: {
  delta: number;
  improvedScore: number;
  improvedVersion: PromptVersion;
  prompt: PromptAsset;
  scoreComparison: ImprovementScoreComparison;
  sourceScore: number;
  sourceVersion: PromptVersion;
}) {
  const sourceExcerpt =
    sourceVersion.content.length > 1800
      ? `${sourceVersion.content.slice(0, 1800)}\n[Source prompt excerpt truncated in this comparison brief.]`
      : sourceVersion.content;
  const improvedExcerpt =
    improvedVersion.content.length > 1800
      ? `${improvedVersion.content.slice(0, 1800)}\n[Improved prompt excerpt truncated in this comparison brief.]`
      : improvedVersion.content;
  const metricChanges = scoreComparison.metrics
    .map(
      (metric) =>
        `- ${metric.label}: ${metric.sourceScore.toFixed(1)} -> ${metric.improvedScore.toFixed(
          1,
        )} (${formatQualityDelta(metric.delta)}, ${metric.status})`,
    )
    .join("\n");
  const strongestImprovement = scoreComparison.strongestImprovement
    ? `${scoreComparison.strongestImprovement.label} ${formatQualityDelta(
        scoreComparison.strongestImprovement.delta,
      )}`
    : "No metric increased.";
  const reviewCandidate = scoreComparison.reviewCandidate
    ? `${scoreComparison.reviewCandidate.label} ${formatQualityDelta(
        scoreComparison.reviewCandidate.delta,
      )}: ${scoreComparison.reviewCandidate.recommendation}`
    : "No review candidate.";

  return `Role:
You are a senior prompt quality reviewer.

Objective:
Compare the source prompt and improved prompt, then propose the next practical improvement step while preserving the original intent.

Context:
- Title: ${prompt.title}
- Domain: ${prompt.domain}
- Goal: ${prompt.goal}
- Source AI tool: ${modelLabels[sourceVersion.targetModel]}
- Improved AI tool: ${modelLabels[improvedVersion.targetModel]}
- Source score: ${sourceScore.toFixed(1)}/5
- Improved score: ${improvedScore.toFixed(1)}/5
- Overall delta: ${formatQualityDelta(delta)}

Metric changes:
${metricChanges}

Summary signals:
- Improved metrics: ${scoreComparison.improvedCount}
- Unchanged metrics: ${scoreComparison.unchangedCount}
- Review metrics: ${scoreComparison.regressedCount}
- Strongest improvement: ${strongestImprovement}
- Next review candidate: ${reviewCandidate}

Instructions:
- Identify what materially changed between the source prompt and improved prompt.
- Keep improvements grounded in the supplied text and scores.
- Do not invent company facts, performance numbers, or missing business context.
- Recommend the next revision only if it would improve clarity, constraints, model fit, or reusability.
- Keep Korean context and internal terms intact where nuance matters.

Required output:
1. Change summary
2. Remaining weakness
3. Next revision plan
4. Copy-ready revised prompt

Source prompt excerpt:
${sourceExcerpt}

Improved prompt excerpt:
${improvedExcerpt}`;
}

function buildSourceReasonFilterReport({
  baseUrl,
  deletedPrompts,
  prompts,
  reason,
  resultPrompts,
  filterHref,
}: {
  baseUrl: string;
  deletedPrompts: PromptDeletedAsset[];
  prompts: PromptAsset[];
  reason: PromptSourceHealthIssueReason;
  resultPrompts: PromptAsset[];
  filterHref: string;
}) {
  const formatReportHref = (href: string) =>
    formatAbsoluteInternalHref(href, baseUrl) ?? href;
  const issueRows = resultPrompts.slice(0, 20).map((prompt, index) => {
    const sourcePromptId = prompt.improvementSource?.sourcePromptId;
    const activeSource = prompts.find((item) => item.id === sourcePromptId);
    const deletedSource = deletedPrompts.find(
      (item) => item.prompt.id === sourcePromptId,
    );
    const sourcePrompt = activeSource ?? deletedSource?.prompt;
    const sourceVersion = getSourceVersion(prompt, sourcePrompt);
    const detailHref = buildLibraryFilterHref({
      search: "",
      sort: "recent",
      language: "all",
      output: "all",
      model: "all",
      engine: "all",
      learning: "all",
      improvement: reason === "archived-source" ? "archived-source" : "unmeasured",
      sourceReason: reason,
      promptId: prompt.id,
      version: prompt.versions[0]?.targetModel,
      detailMode: "current",
    });
    const sourceStatus = activeSource
      ? "활성 Library 원본"
      : deletedSource
        ? `삭제 보관함 원본 (${new Date(
            deletedSource.deletedAt,
          ).toLocaleString("ko-KR")})`
        : "원본 없음";

    return [
      `${index + 1}. ${prompt.title}`,
      `   - 프롬프트 ID: ${prompt.id}`,
      `   - 분야/목표: ${prompt.domain} / ${prompt.goal}`,
      `   - 사유: ${sourceReasonFilterLabels[reason]}`,
      `   - 원본 제목: ${prompt.improvementSource?.sourcePromptTitle ?? "없음"}`,
      `   - 원본 상태: ${sourceStatus}`,
      `   - 원본 버전: ${
        sourceVersion ? modelLabels[sourceVersion.targetModel] : "확인 필요"
      }`,
      `   - 개선본 버전: ${prompt.versions
        .map((version) => modelLabels[version.targetModel])
        .join(", ")}`,
      `   - 상세 링크: ${formatReportHref(detailHref)}`,
    ].join("\n");
  });

  const omittedCount = Math.max(0, resultPrompts.length - issueRows.length);

  return [
    "# Library 출처 사유 조치 리포트",
    "",
    `- 필터 사유: ${sourceReasonFilterLabels[reason]}`,
    `- 현재 결과: ${resultPrompts.length}개`,
    `- Library 필터 링크: ${formatReportHref(filterHref)}`,
    `- 생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    "",
    "## 조치 기준",
    `- ${sourceReasonIssueDescriptions[reason]}`,
    "- 품질 점수 비교보다 원본 복원, 버전 연결, 백업 확인을 먼저 처리합니다.",
    "- 원본 또는 버전을 복원한 뒤 Dashboard와 Library에서 개선 효과를 다시 확인합니다.",
    "",
    "## 확인 후보",
    issueRows.length ? issueRows.join("\n\n") : "- 현재 조건에 맞는 후보가 없습니다.",
    omittedCount ? `\n\n외 ${omittedCount}개 후보는 Library 필터 링크에서 확인합니다.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSourceReasonCandidateNote({
  baseUrl,
  detailHref,
  prompt,
  reason,
  sourceStatus,
  sourceVersion,
}: {
  baseUrl: string;
  detailHref: string;
  prompt: PromptAsset;
  reason: PromptSourceHealthIssueReason;
  sourceStatus: string;
  sourceVersion?: PromptVersion;
}) {
  const formatCandidateHref = (href: string) =>
    formatAbsoluteInternalHref(href, baseUrl) ?? href;

  return [
    "# Library 출처 후보 메모",
    "",
    `- 후보: ${prompt.title}`,
    `- 프롬프트 ID: ${prompt.id}`,
    `- 분야/목표: ${prompt.domain} / ${prompt.goal}`,
    `- 사유: ${sourceReasonFilterLabels[reason]}`,
    `- 원본 제목: ${prompt.improvementSource?.sourcePromptTitle ?? "없음"}`,
    `- 원본 상태: ${sourceStatus}`,
    `- 원본 버전: ${
      sourceVersion ? modelLabels[sourceVersion.targetModel] : "확인 필요"
    }`,
    `- 개선본 버전: ${prompt.versions
      .map((version) => modelLabels[version.targetModel])
      .join(", ")}`,
    `- 상세 링크: ${formatCandidateHref(detailHref)}`,
    "",
    "## 조치 기준",
    `- ${sourceReasonIssueDescriptions[reason]}`,
    "- 품질 점수 비교보다 원본 복원, 버전 연결, 백업 확인을 먼저 처리합니다.",
    "- 복원 후 Dashboard와 Library에서 개선 효과 계산이 정상인지 다시 확인합니다.",
  ].join("\n");
}

function buildStudioPersistenceFilterReport({
  baseUrl,
  filter,
  filterHref,
  resultPrompts,
}: {
  baseUrl: string;
  filter: Exclude<StudioPersistenceFilter, "all">;
  filterHref: string;
  resultPrompts: PromptAsset[];
}) {
  const rows = resultPrompts.slice(0, 20).map((prompt, index) => {
    const sourceMeta = prompt.studioSource
      ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
      : undefined;
    const sourceLabel = sourceMeta?.label ?? "Studio 출처 없음";
    const sourceTitle =
      prompt.studioSource?.sourceTitle ?? "저장 출처 메타 없음";
    const sourceHref = getPromptStudioSourceHref(prompt.studioSource);
    const sourceVariantLabel = getPromptStudioSourceVariantLabel(
      prompt.studioSource,
    );
    const detailHref = buildLibraryFilterHref({
      search: "",
      sort: "recent",
      language: "all",
      output: "all",
      model: "all",
      engine: "all",
      learning: "all",
      improvement: "all",
      sourceReason: "all",
      studioPersistence: filter,
      promptId: prompt.id,
      version: prompt.versions[0]?.targetModel,
      detailMode: "current",
    });

    return [
      `${index + 1}. ${prompt.title}`,
      `   - 프롬프트 ID: ${prompt.id}`,
      `   - 분야/목표: ${prompt.domain} / ${prompt.goal}`,
      `   - 저장 방식: ${sourceLabel}`,
      `   - Studio 출처: ${sourceTitle}`,
      sourceVariantLabel
        ? `   - 세부 초안 유형: ${sourceVariantLabel}`
        : undefined,
      sourceHref ? `   - 출처 링크: ${baseUrl}${sourceHref}` : undefined,
      `   - 상세 링크: ${baseUrl}${detailHref}`,
    ]
      .filter(Boolean)
      .join("\n");
  });
  const omittedCount = Math.max(0, resultPrompts.length - rows.length);
  const sourceVariantSummary =
    summarizePromptStudioSourceVariantLabels(resultPrompts);

  return [
    filter === "none"
      ? "# Library 저장 출처 메타 없음 큐 리포트"
      : "# Library Studio 저장 방식 리포트",
    "",
    `- 저장 방식: ${studioPersistenceFilterLabels[filter]}`,
    `- 현재 결과: ${resultPrompts.length}개`,
    sourceVariantSummary.length
      ? `- 세부 초안 유형: ${sourceVariantSummary.join(", ")}`
      : undefined,
    `- Library 필터 링크: ${baseUrl}${filterHref}`,
    `- 생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    "",
    "## 해석 기준",
    `- ${studioPersistenceFilterDescriptions[filter]}`,
    "- 개선 체인은 품질 비교와 재개선 판단에 사용하고, 운영 출처는 출처/복원/점검 흐름으로 분리해 관리합니다.",
    "- Studio 출처 없음 항목은 저장 출처 메타를 다시 부여할지, 레거시 저장본으로 유지할지 결정합니다.",
    "",
    "## 확인 후보",
    rows.length ? rows.join("\n\n") : "- 현재 조건에 맞는 후보가 없습니다.",
    omittedCount ? `\n\n외 ${omittedCount}개 후보는 Library 필터 링크에서 확인합니다.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildStudioPersistenceCandidateNote({
  baseUrl,
  detailHref,
  filter,
  prompt,
  sourceDescription,
  sourceLabel,
  sourceTitle,
}: {
  baseUrl: string;
  detailHref: string;
  filter: Exclude<StudioPersistenceFilter, "all">;
  prompt: PromptAsset;
  sourceDescription: string;
  sourceLabel: string;
  sourceTitle: string;
}) {
  const sourceHref = getPromptStudioSourceHref(prompt.studioSource);
  const sourceVariantLabel = getPromptStudioSourceVariantLabel(
    prompt.studioSource,
  );

  return [
    filter === "none"
      ? "# Library 저장 출처 메타 없음 후보 메모"
      : "# Library Studio 저장 방식 후보 메모",
    "",
    `- 후보: ${prompt.title}`,
    `- 프롬프트 ID: ${prompt.id}`,
    `- 분야/목표: ${prompt.domain} / ${prompt.goal}`,
    `- 필터 저장 방식: ${studioPersistenceFilterLabels[filter]}`,
    `- 현재 저장 방식: ${sourceLabel}`,
    `- Studio 출처: ${sourceTitle}`,
    sourceVariantLabel ? `- 세부 초안 유형: ${sourceVariantLabel}` : undefined,
    sourceHref ? `- 출처 링크: ${baseUrl}${sourceHref}` : undefined,
    `- 상세 링크: ${baseUrl}${detailHref}`,
    "",
    "## 해석 기준",
    `- ${sourceDescription}`,
    "- 개선 체인은 품질 비교와 재개선 판단에 사용하고, 운영 출처는 출처/복원/점검 흐름으로 분리해 관리합니다.",
    "- Studio 출처 없음 항목은 저장 출처 메타를 다시 부여할지, 레거시 저장본으로 유지할지 결정합니다.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildStudioOperationalGroupReport({
  baseUrl,
  filterHref,
  persistenceFilter,
  resultPrompts,
  sourceFilter,
}: {
  baseUrl: string;
  filterHref: string;
  persistenceFilter: Exclude<StudioPersistenceFilter, "all">;
  resultPrompts: PromptAsset[];
  sourceFilter: Exclude<StudioSourceFilter, "all">;
}) {
  const rows = resultPrompts.slice(0, 20).map((prompt, index) => {
    const sourceMeta = prompt.studioSource
      ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
      : undefined;
    const sourceTitle = prompt.studioSource?.sourceTitle ?? "출처 제목 없음";
    const sourceHref = getPromptStudioSourceHref(prompt.studioSource);
    const sourceVariantLabel = getPromptStudioSourceVariantLabel(
      prompt.studioSource,
    );
    const detailHref = buildLibraryFilterHref({
      search: "",
      sort: "recent",
      language: "all",
      output: "all",
      model: "all",
      engine: "all",
      learning: "all",
      improvement: "all",
      sourceReason: "all",
      studioPersistence: persistenceFilter,
      studioSource: sourceFilter,
      promptId: prompt.id,
      version: prompt.versions[0]?.targetModel,
      detailMode: "current",
    });

    return [
      `${index + 1}. ${prompt.title}`,
      `   - 프롬프트 ID: ${prompt.id}`,
      `   - 분야/목표: ${prompt.domain} / ${prompt.goal}`,
      `   - 저장 방식: ${sourceMeta?.label ?? "Studio 출처 없음"}`,
      `   - Studio 저장 출처: ${getStudioSourceFilterLabel(sourceFilter)}`,
      sourceVariantLabel
        ? `   - 세부 초안 유형: ${sourceVariantLabel}`
        : undefined,
      `   - Studio 출처 제목: ${sourceTitle}`,
      sourceHref ? `   - 출처 링크: ${baseUrl}${sourceHref}` : undefined,
      `   - 상세 링크: ${baseUrl}${detailHref}`,
    ]
      .filter(Boolean)
      .join("\n");
  });
  const omittedCount = Math.max(0, resultPrompts.length - rows.length);
  const sourceVariantSummary =
    summarizePromptStudioSourceVariantLabels(resultPrompts);

  return [
    "# Library Studio 운영 묶음 리포트",
    "",
    `- 저장 방식: ${studioPersistenceFilterLabels[persistenceFilter]}`,
    `- 저장 출처: ${getStudioSourceFilterLabel(sourceFilter)}`,
    `- 현재 결과: ${resultPrompts.length}개`,
    sourceVariantSummary.length
      ? `- 세부 초안 유형: ${sourceVariantSummary.join(", ")}`
      : undefined,
    `- Library 필터 링크: ${baseUrl}${filterHref}`,
    `- 생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    "",
    "## 점검 기준",
    `- ${studioPersistenceFilterDescriptions[persistenceFilter]}`,
    "- 같은 저장 출처와 같은 저장 방식이 함께 적용된 결과만 운영 묶음으로 검토합니다.",
    "- 후보별 출처 제목, 출처 링크, 상세 링크를 확인해 이 묶음을 유지할지 재분류할지 결정합니다.",
    "",
    "## 확인 후보",
    rows.length ? rows.join("\n\n") : "- 현재 조건에 맞는 후보가 없습니다.",
    omittedCount ? `\n\n외 ${omittedCount}개 후보는 Library 필터 링크에서 확인합니다.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildStudioSourceFilterReport({
  baseUrl,
  filter,
  filterHref,
  resultPrompts,
}: {
  baseUrl: string;
  filter: Exclude<StudioSourceFilter, "all">;
  filterHref: string;
  resultPrompts: PromptAsset[];
}) {
  const rows = resultPrompts.slice(0, 20).map((prompt, index) => {
    const sourceMeta = prompt.studioSource
      ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
      : undefined;
    const sourceHref = getPromptStudioSourceHref(prompt.studioSource);
    const sourceVariantLabel = getPromptStudioSourceVariantLabel(
      prompt.studioSource,
    );
    const detailHref = buildLibraryFilterHref({
      search: "",
      sort: "recent",
      language: "all",
      output: "all",
      model: "all",
      engine: "all",
      learning: "all",
      improvement: "all",
      sourceReason: "all",
      studioSource: filter,
      promptId: prompt.id,
      version: prompt.versions[0]?.targetModel,
      detailMode: "current",
    });

    return [
      `${index + 1}. ${prompt.title}`,
      `   - 프롬프트 ID: ${prompt.id}`,
      `   - 분야/목표: ${prompt.domain} / ${prompt.goal}`,
      `   - Studio 저장 출처: ${getStudioSourceFilterLabel(filter)}`,
      sourceVariantLabel
        ? `   - 세부 초안 유형: ${sourceVariantLabel}`
        : undefined,
      `   - 저장 방식: ${sourceMeta?.label ?? "Studio 출처 없음"}`,
      `   - Studio 출처 제목: ${
        prompt.studioSource?.sourceTitle ?? "출처 제목 없음"
      }`,
      sourceHref ? `   - 출처 링크: ${baseUrl}${sourceHref}` : undefined,
      `   - 상세 링크: ${baseUrl}${detailHref}`,
    ]
      .filter(Boolean)
      .join("\n");
  });
  const omittedCount = Math.max(0, resultPrompts.length - rows.length);
  const sourceVariantSummary =
    summarizePromptStudioSourceVariantLabels(resultPrompts);

  return [
    "# Library Studio 저장 출처 리포트",
    "",
    `- 저장 출처: ${getStudioSourceFilterLabel(filter)}`,
    `- 현재 결과: ${resultPrompts.length}개`,
    sourceVariantSummary.length
      ? `- 세부 초안 유형: ${sourceVariantSummary.join(", ")}`
      : undefined,
    `- Library 필터 링크: ${baseUrl}${filterHref}`,
    `- 생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    "",
    "## 점검 기준",
    "- 같은 저장 출처에서 저장된 프롬프트가 실제 운영 목적과 맞는지 확인합니다.",
    "- 개선 체인으로 관리해야 할 항목이 운영 출처로만 저장됐는지 분리합니다.",
    "- 출처 링크가 끊겼거나 제목이 모호한 항목은 후보 메모로 세부 복원 기준을 정리합니다.",
    "",
    "## 확인 후보",
    rows.length ? rows.join("\n\n") : "- 현재 조건에 맞는 후보가 없습니다.",
    omittedCount ? `\n\n외 ${omittedCount}개 후보는 Library 필터 링크에서 확인합니다.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildStudioSourceCandidateNote({
  baseUrl,
  detailHref,
  filter,
  prompt,
  sourceLabel,
  sourceTitle,
}: {
  baseUrl: string;
  detailHref: string;
  filter: Exclude<StudioSourceFilter, "all">;
  prompt: PromptAsset;
  sourceLabel: string;
  sourceTitle: string;
}) {
  const sourceHref = getPromptStudioSourceHref(prompt.studioSource);
  const sourceMeta = prompt.studioSource
    ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
    : undefined;
  const sourceVariantLabel = getPromptStudioSourceVariantLabel(
    prompt.studioSource,
  );

  return [
    "# Library Studio 저장 출처 후보 메모",
    "",
    `- 후보: ${prompt.title}`,
    `- 프롬프트 ID: ${prompt.id}`,
    `- 분야/목표: ${prompt.domain} / ${prompt.goal}`,
    `- 필터 저장 출처: ${getStudioSourceFilterLabel(filter)}`,
    `- 현재 저장 출처: ${sourceLabel}`,
    sourceVariantLabel ? `- 세부 초안 유형: ${sourceVariantLabel}` : undefined,
    `- 저장 방식: ${sourceMeta?.label ?? "Studio 출처 없음"}`,
    `- Studio 출처 제목: ${sourceTitle}`,
    sourceHref ? `- 출처 링크: ${baseUrl}${sourceHref}` : undefined,
    `- 상세 링크: ${baseUrl}${detailHref}`,
    "",
    "## 점검 기준",
    "- 이 저장본이 해당 기능 흐름에서 만들어진 것이 맞는지 확인합니다.",
    "- 개선 체인으로 연결해야 하는 항목이면 Library 개선 브리프 흐름으로 다시 저장합니다.",
    "- 운영 출처로 유지할 항목은 sourceTitle/sourceHref가 재방문 가능한지 확인합니다.",
  ]
    .filter(Boolean)
    .join("\n");
}

type SelectedOperationalSummary = {
  actionKind: "comparison" | "handoff-improve" | "package" | "source-detail";
  actionLabel: string;
  chainDescription: string;
  chainLabel: string;
  groupActionHref?: string;
  groupActionLabel?: string;
  handoffStatusDescription: string;
  handoffStatusLabel: string;
  nextAction: string;
  nextActionDescription: string;
  persistenceActionHref?: string;
  persistenceActionLabel?: string;
  persistenceLabel: string;
  sourceActionHref?: string;
  sourceActionLabel?: string;
  sourceLabel: string;
  sourceOriginalActionLabel?: string;
  sourceOriginalHref?: string;
  sourceTitle?: string;
  sourceVariantLabel?: string;
};

function buildSelectedOperationalSummaryReport({
  baseUrl,
  detailHref,
  prompt,
  readinessItems,
  summary,
  version,
}: {
  baseUrl: string;
  detailHref: string;
  prompt: PromptAsset;
  readinessItems: TargetAiHandoffReadinessItem[];
  summary: SelectedOperationalSummary;
  version: PromptVersion;
}) {
  const actionLinks = [
    summary.groupActionHref && summary.groupActionLabel
      ? `- ${summary.groupActionLabel}: ${baseUrl}${summary.groupActionHref}`
      : undefined,
    summary.sourceActionHref && summary.sourceActionLabel
      ? `- ${summary.sourceActionLabel}: ${baseUrl}${summary.sourceActionHref}`
      : undefined,
    summary.sourceOriginalHref && summary.sourceOriginalActionLabel
      ? `- ${summary.sourceOriginalActionLabel}: ${baseUrl}${summary.sourceOriginalHref}`
      : undefined,
    summary.persistenceActionHref && summary.persistenceActionLabel
      ? `- ${summary.persistenceActionLabel}: ${baseUrl}${summary.persistenceActionHref}`
      : undefined,
  ].filter(Boolean);
  const readinessRows = readinessItems.map(
    (item) => `- [${item.status}] ${item.label}: ${item.detail}`,
  );

  return [
    `# Library 운영 요약 · ${prompt.title}`,
    "",
    `- 프롬프트 ID: ${prompt.id}`,
    `- 버전: ${modelLabels[version.targetModel]}`,
    `- 분야/목표: ${prompt.domain} / ${prompt.goal}`,
    `- 상세 링크: ${baseUrl}${detailHref}`,
    `- 생성 시각: ${new Date().toLocaleString("ko-KR")}`,
    "",
    "## 운영 상태",
    `- 다음 액션: ${summary.nextAction}`,
    `- CTA: ${summary.actionLabel}`,
    `- AI 전달 상태: ${summary.handoffStatusLabel}`,
    `- 저장 방식: ${summary.persistenceLabel}`,
    `- 출처: ${summary.sourceLabel}`,
    summary.sourceVariantLabel
      ? `- 세부 초안 유형: ${summary.sourceVariantLabel}`
      : undefined,
    summary.sourceTitle ? `- 출처 제목: ${summary.sourceTitle}` : undefined,
    summary.sourceOriginalHref
      ? `- 원본 경로: ${baseUrl}${summary.sourceOriginalHref}`
      : undefined,
    `- 체인: ${summary.chainLabel}`,
    "",
    "## 판단 근거",
    `- ${summary.nextActionDescription}`,
    `- ${summary.handoffStatusDescription}`,
    `- ${summary.chainDescription}`,
    "",
    "## 조건 링크",
    actionLinks.length ? actionLinks.join("\n") : "- 연결된 조건 링크 없음",
    "",
    "## AI 전달 readiness",
    readinessRows.length ? readinessRows.join("\n") : "- readiness 항목 없음",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildNoSourceMetaNote({
  baseUrl,
  detailHref,
  prompt,
  sourceDescription,
  sourceLabel,
  version,
}: {
  baseUrl: string;
  detailHref: string;
  prompt: PromptAsset;
  sourceDescription: string;
  sourceLabel: string;
  version?: PromptVersion;
}) {
  return [
    "# Library 저장 출처 메타 없음 점검 메모",
    "",
    `- 프롬프트: ${prompt.title}`,
    `- 프롬프트 ID: ${prompt.id}`,
    `- 분야/목표: ${prompt.domain} / ${prompt.goal}`,
    `- 저장 방식: ${sourceLabel}`,
    `- 저장 방식 설명: ${sourceDescription}`,
    `- 현재 버전: ${version ? modelLabels[version.targetModel] : "확인 필요"}`,
    `- 품질 점수: ${version ? version.qualityScore.toFixed(1) : "확인 필요"}`,
    `- 상세 링크: ${baseUrl}${detailHref}`,
    "",
    "## 점검 기준",
    "- 직접 작성하거나 가져온 저장본이면 Studio 출처 없음으로 유지합니다.",
    "- Dashboard, Learning, Library, Skills 조치에서 만든 결과라면 Studio 저장 출처가 있는 초안 흐름으로 다시 저장합니다.",
    "- 같은 저장 방식 필터에서 비슷한 항목을 함께 검토합니다.",
  ].join("\n");
}

function buildLibraryFilterHref({
  search,
  sort,
  language,
  output,
  model,
  engine,
  learning,
  improvement,
  sourceReason = "all",
  studioPersistence = "all",
  studioSource = "all",
  studioVariant = "all",
  promptId,
  version,
  detailMode,
  focusTarget,
  feedbackId,
}: {
  search: string;
  sort: LibrarySortMode;
  language: LanguageFilter;
  output: OutputLanguageFilter;
  model: TargetModelFilter;
  engine: GenerationEngineFilter;
  learning: LearningScopeFilter;
  improvement: ImprovementFilter;
  sourceReason?: SourceReasonFilter;
  studioPersistence?: StudioPersistenceFilter;
  studioSource?: StudioSourceFilter;
  studioVariant?: StudioSourceVariantFilter;
  promptId?: string;
  version?: TargetModel;
  detailMode?: PromptDetailMode;
  focusTarget?: LibraryFocusTarget;
  feedbackId?: string;
}) {
  const params = new URLSearchParams();
  const trimmedSearch = search.trim();
  const trimmedPromptId = promptId?.trim();

  if (trimmedSearch) {
    params.set("q", trimmedSearch);
  }

  if (sort !== "recent") {
    params.set("sort", sort);
  }

  if (language !== "all") {
    params.set("language", language);
  }

  if (output !== "all") {
    params.set("output", output);
  }

  if (model !== "all") {
    params.set("model", model);
  }

  if (engine !== "all") {
    params.set("engine", engine);
  }

  if (learning !== "all") {
    params.set("learn", learning);
  }

  if (improvement !== "all") {
    params.set("improvement", improvement);
  }

  if (sourceReason !== "all") {
    params.set("sourceReason", sourceReason);
  }

  if (studioPersistence !== "all") {
    params.set("studio", studioPersistence);
  }

  if (studioSource !== "all") {
    params.set("studioSource", studioSource);
  }

  if (studioVariant !== "all") {
    params.set("studioVariant", studioVariant);
  }

  if (trimmedPromptId) {
    params.set("prompt", trimmedPromptId);

    if (version) {
      params.set("version", version);
    }

    if (detailMode === "comparison") {
      params.set("view", detailMode);
    }

    if (focusTarget) {
      params.set("focus", focusTarget);
    }

    if (feedbackId?.trim()) {
      params.set("feedback", feedbackId.trim());
    }
  }

  const query = params.toString();
  const href = query ? `/library?${query}` : "/library";

  return normalizeInternalHref(href) ?? "/library";
}

type LibraryFilterHrefOptions = Parameters<typeof buildLibraryFilterHref>[0];

export function LibraryView({
  initialQuery,
  initialSortMode,
  initialPromptId,
  initialActiveModel,
  initialLanguageStrategy,
  initialOutputLanguage,
  initialTargetModel,
  initialImprovementFilter,
  initialSourceReasonFilter,
  initialStudioPersistenceFilter,
  initialStudioSourceFilter,
  initialStudioSourceVariantFilter,
  initialPromptDetailMode,
  initialGenerationEngine,
  initialLearningScope,
  initialCompanyUpdated = false,
  initialProfileUpdated = false,
  initialFocusTarget,
  initialFeedbackId,
}: {
  initialQuery?: string;
  initialSortMode?: LibrarySortMode;
  initialPromptId?: string;
  initialActiveModel?: TargetModel;
  initialLanguageStrategy?: PromptLanguageStrategy;
  initialOutputLanguage?: PromptOutputLanguage;
  initialTargetModel?: TargetModel;
  initialImprovementFilter?: Exclude<ImprovementFilter, "all">;
  initialSourceReasonFilter?: Exclude<SourceReasonFilter, "all">;
  initialStudioPersistenceFilter?: Exclude<StudioPersistenceFilter, "all">;
  initialStudioSourceFilter?: Exclude<StudioSourceFilter, "all">;
  initialStudioSourceVariantFilter?: Exclude<StudioSourceVariantFilter, "all">;
  initialPromptDetailMode?: PromptDetailMode;
  initialGenerationEngine?: PromptAsset["source"];
  initialLearningScope?: Exclude<LearningScopeFilter, "all">;
  initialCompanyUpdated?: boolean;
  initialProfileUpdated?: boolean;
  initialFocusTarget?: LibraryFocusTarget;
  initialFeedbackId?: string;
}) {
  const router = useRouter();
  const [prompts, setPrompts] = usePromptAssetsStore();
  const [deletedPrompts, setDeletedPrompts] = useDeletedPromptAssetsStore();
  const [, setMemories] = useLearningMemoriesStore();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [sortMode, setSortMode] = useState<LibrarySortMode>(
    initialSortMode ?? "recent",
  );
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>(
    initialLanguageStrategy ?? "all",
  );
  const [outputLanguageFilter, setOutputLanguageFilter] =
    useState<OutputLanguageFilter>(initialOutputLanguage ?? "all");
  const [targetModelFilter, setTargetModelFilter] =
    useState<TargetModelFilter>(initialTargetModel ?? "all");
  const [generationEngineFilter, setGenerationEngineFilter] =
    useState<GenerationEngineFilter>(initialGenerationEngine ?? "all");
  const [learningScopeFilter, setLearningScopeFilter] =
    useState<LearningScopeFilter>(initialLearningScope ?? "all");
  const [improvementFilter, setImprovementFilter] =
    useState<ImprovementFilter>(initialImprovementFilter ?? "all");
  const [sourceReasonFilter, setSourceReasonFilter] =
    useState<SourceReasonFilter>(initialSourceReasonFilter ?? "all");
  const [studioPersistenceFilter, setStudioPersistenceFilter] =
    useState<StudioPersistenceFilter>(initialStudioPersistenceFilter ?? "all");
  const [studioSourceFilter, setStudioSourceFilter] =
    useState<StudioSourceFilter>(initialStudioSourceFilter ?? "all");
  const [studioSourceVariantFilter, setStudioSourceVariantFilter] =
    useState<StudioSourceVariantFilter>(
      initialStudioSourceVariantFilter ?? "all",
    );
  const [selectedId, setSelectedId] = useState<string>(initialPromptId ?? "");
  const [activeModel, setActiveModel] = useState<TargetModel>(
    initialActiveModel ?? initialTargetModel ?? "gpt",
  );
  const [rating, setRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState<Feedback["feedbackType"]>("format");
  const [comment, setComment] = useState("");
  const [latestFeedbackId, setLatestFeedbackId] = useState("");
  const [copied, setCopied] = useState(false);
  const [targetAiPackageCopiedKey, setTargetAiPackageCopiedKey] =
    useState("");
  const [
    targetAiImprovementBriefCopiedKey,
    setTargetAiImprovementBriefCopiedKey,
  ] = useState("");
  const [targetAiPackagePreviewOpen, setTargetAiPackagePreviewOpen] =
    useState(false);
  const [targetAiPackagePreviewMode, setTargetAiPackagePreviewMode] =
    useState<HandoffPreviewMode>("package");
  const [filterLinkCopied, setFilterLinkCopied] = useState(false);
  const [detailLinkCopied, setDetailLinkCopied] = useState(false);
  const [improvementBriefCopied, setImprovementBriefCopied] = useState(false);
  const [comparisonBriefCopied, setComparisonBriefCopied] = useState(false);
  const [sourceHealthReportCopied, setSourceHealthReportCopied] =
    useState(false);
  const [sourceHealthCandidateCopiedId, setSourceHealthCandidateCopiedId] =
    useState("");
  const [
    sourceHealthCandidateLinkCopiedId,
    setSourceHealthCandidateLinkCopiedId,
  ] = useState("");
  const [studioPersistenceReportCopied, setStudioPersistenceReportCopied] =
    useState(false);
  const [
    studioPersistenceCandidateCopiedId,
    setStudioPersistenceCandidateCopiedId,
  ] = useState("");
  const [studioSourceReportCopied, setStudioSourceReportCopied] =
    useState(false);
  const [
    studioOperationalGroupReportCopied,
    setStudioOperationalGroupReportCopied,
  ] = useState(false);
  const [studioSourceCandidateCopiedId, setStudioSourceCandidateCopiedId] =
    useState("");
  const [contextQuestionsCopied, setContextQuestionsCopied] = useState(false);
  const [learningContextReportCopiedFor, setLearningContextReportCopiedFor] =
    useState("");
  const [noSourceMetaNoteCopiedFor, setNoSourceMetaNoteCopiedFor] =
    useState("");
  const [
    selectedStudioSourceLinkCopiedFor,
    setSelectedStudioSourceLinkCopiedFor,
  ] = useState("");
  const [
    selectedStudioSourceOriginalLinkCopiedFor,
    setSelectedStudioSourceOriginalLinkCopiedFor,
  ] = useState("");
  const [
    selectedStudioPersistenceLinkCopiedFor,
    setSelectedStudioPersistenceLinkCopiedFor,
  ] = useState("");
  const [
    selectedOperationalGroupLinkCopiedFor,
    setSelectedOperationalGroupLinkCopiedFor,
  ] = useState("");
  const [
    selectedOperationalSourceLinkCopiedFor,
    setSelectedOperationalSourceLinkCopiedFor,
  ] = useState("");
  const [
    selectedOperationalPersistenceLinkCopiedFor,
    setSelectedOperationalPersistenceLinkCopiedFor,
  ] = useState("");
  const [listStudioSourceLinkCopiedFor, setListStudioSourceLinkCopiedFor] =
    useState("");
  const [
    listStudioSourceOriginalLinkCopiedFor,
    setListStudioSourceOriginalLinkCopiedFor,
  ] = useState("");
  const [
    listStudioPersistenceLinkCopiedFor,
    setListStudioPersistenceLinkCopiedFor,
  ] = useState("");
  const [
    listStudioOperationalGroupLinkCopiedFor,
    setListStudioOperationalGroupLinkCopiedFor,
  ] = useState("");
  const [studioVariantLinkCopiedFor, setStudioVariantLinkCopiedFor] =
    useState("");
  const [
    selectedOperationalSummaryReportCopiedFor,
    setSelectedOperationalSummaryReportCopiedFor,
  ] = useState("");
  const [contextQuestionsCopyFailed, setContextQuestionsCopyFailed] =
    useState(false);
  const [manualCopy, setManualCopy] = useState<LibraryManualCopy | null>(null);
  const [deletedPromptTitle, setDeletedPromptTitle] = useState("");
  const [deletedPromptRecoveryId, setDeletedPromptRecoveryId] = useState("");
  const [deletedPromptArchiveExpanded, setDeletedPromptArchiveExpanded] =
    useState(false);
  const [deletedPromptArchiveQuery, setDeletedPromptArchiveQuery] = useState("");
  const [deletePromptCandidate, setDeletePromptCandidate] =
    useState<PromptAsset | null>(null);
  const [deletedPromptRemoveCandidate, setDeletedPromptRemoveCandidate] =
    useState<PromptDeletedAsset | null>(null);
  const [companyUpdateNoticeVisible, setCompanyUpdateNoticeVisible] =
    useState(initialCompanyUpdated);
  const [profileUpdateNoticeVisible, setProfileUpdateNoticeVisible] =
    useState(initialProfileUpdated);
  const [promptDetailMode, setPromptDetailMode] =
    useState<PromptDetailMode>(initialPromptDetailMode ?? "current");
  const [highlightedFeedbackId, setHighlightedFeedbackId] = useState(
    initialFeedbackId ?? "",
  );
  const improvementFilterCounts = useMemo(
    () =>
      improvementFilterModes.reduce(
        (counts, mode) => ({
          ...counts,
          [mode]:
            mode === "all"
              ? prompts.length
              : prompts.filter((prompt) =>
                  getPromptImprovementFilterMatch(
                    prompt,
                    prompts,
                    deletedPrompts,
                    mode,
                  ),
                ).length,
        }),
        {} as Record<ImprovementFilter, number>,
      ),
    [deletedPrompts, prompts],
  );
  const sourceReasonFilterCounts = useMemo(
    () =>
      sourceReasonFilterModes.reduce(
        (counts, mode) => ({
          ...counts,
          [mode]:
            mode === "all"
              ? prompts.filter((prompt) =>
                  Boolean(prompt.improvementSource),
                ).length
              : prompts.filter(
                  (prompt) =>
                    getPromptSourceHealthIssueReason(
                      prompt,
                      prompts,
                      deletedPrompts,
                    ) === mode,
                ).length,
        }),
        {} as Record<SourceReasonFilter, number>,
      ),
    [deletedPrompts, prompts],
  );
  const studioPersistenceFilterCounts = useMemo(
    () =>
      studioPersistenceFilterModes.reduce(
        (counts, mode) => ({
          ...counts,
          [mode]:
            mode === "all"
              ? prompts.length
              : prompts.filter(
                  (prompt) => getPromptStudioPersistenceFilter(prompt) === mode,
                ).length,
        }),
        {} as Record<StudioPersistenceFilter, number>,
      ),
    [prompts],
  );
  const studioSourceFilterCounts = useMemo(
    () =>
      studioSourceFilterModes.reduce(
        (counts, mode) => ({
          ...counts,
          [mode]:
            mode === "all"
              ? prompts.filter((prompt) => prompt.studioSource).length
              : prompts.filter(
                  (prompt) => prompt.studioSource?.source === mode,
                ).length,
        }),
        {} as Record<StudioSourceFilter, number>,
      ),
    [prompts],
  );
  const studioSourceVariantFilterCounts = useMemo(
    () =>
      studioSourceVariantFilterModes.reduce(
        (counts, mode) => ({
          ...counts,
          [mode]:
            mode === "all"
              ? prompts.filter((prompt) => prompt.studioSource?.sourceVariant)
                  .length
              : prompts.filter(
                  (prompt) => prompt.studioSource?.sourceVariant === mode,
                ).length,
        }),
        {} as Record<StudioSourceVariantFilter, number>,
      ),
    [prompts],
  );
  const languageFilterCounts = useMemo(
    () =>
      languageStrategies.reduce(
        (counts, strategy) => ({
          ...counts,
          [strategy]: prompts.filter(
            (prompt) => getLanguageStrategy(prompt) === strategy,
          ).length,
        }),
        { all: prompts.length } as Record<LanguageFilter, number>,
      ),
    [prompts],
  );
  const outputLanguageFilterCounts = useMemo(
    () =>
      outputLanguages.reduce(
        (counts, outputLanguage) => ({
          ...counts,
          [outputLanguage]: prompts.filter(
            (prompt) => getOutputLanguage(prompt) === outputLanguage,
          ).length,
        }),
        { all: prompts.length } as Record<OutputLanguageFilter, number>,
      ),
    [prompts],
  );
  const targetModelFilterCounts = useMemo(
    () =>
      targetModels.reduce(
        (counts, targetModel) => ({
          ...counts,
          [targetModel]: prompts.filter((prompt) =>
            prompt.versions.some((version) => version.targetModel === targetModel),
          ).length,
        }),
        { all: prompts.length } as Record<TargetModelFilter, number>,
      ),
    [prompts],
  );
  const generationEngineFilterCounts = useMemo(
    () =>
      generationEngines.reduce(
        (counts, engine) => ({
          ...counts,
          [engine]: prompts.filter((prompt) => prompt.source === engine).length,
        }),
        { all: prompts.length } as Record<GenerationEngineFilter, number>,
      ),
    [prompts],
  );
  const learningScopeFilterCounts = useMemo(
    () =>
      learningScopeFilters.reduce(
        (counts, filter) => ({
          ...counts,
          [filter]: prompts.filter((prompt) =>
            promptMatchesLearningScope(prompt, filter),
          ).length,
        }),
        { all: prompts.length } as Record<LearningScopeFilter, number>,
      ),
    [prompts],
  );
  const activeFilterItems = useMemo<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];
    const trimmedQuery = query.trim();

    if (languageFilter !== "all") {
      items.push({
        id: "language",
        label: `언어 전략 ${languageStrategyLabels[languageFilter]}`,
        removeLabel: "언어 전략 필터 해제",
      });
    }

    if (outputLanguageFilter !== "all") {
      items.push({
        id: "output",
        label: `답변 ${outputLanguageLabels[outputLanguageFilter]}`,
        removeLabel: "답변 언어 필터 해제",
      });
    }

    if (targetModelFilter !== "all") {
      items.push({
        id: "model",
        label: `대상 ${modelLabels[targetModelFilter]}`,
        removeLabel: "대상 AI 도구 필터 해제",
      });
    }

    if (generationEngineFilter !== "all") {
      items.push({
        id: "engine",
        label: `엔진 ${generationEngineLabels[generationEngineFilter]}`,
        removeLabel: "생성 엔진 필터 해제",
      });
    }

    if (learningScopeFilter !== "all") {
      items.push({
        id: "learning",
        label: `학습 ${learningScopeFilterLabels[learningScopeFilter]}`,
        removeLabel: "학습 scope 필터 해제",
      });
    }

    if (improvementFilter !== "all") {
      items.push({
        id: "improvement",
        label: `개선 ${improvementFilterLabels[improvementFilter]}`,
        removeLabel: "개선 상태 필터 해제",
      });
    }

    if (sourceReasonFilter !== "all") {
      items.push({
        id: "source-reason",
        label: `출처 사유 ${sourceReasonFilterLabels[sourceReasonFilter]}`,
        removeLabel: "출처 사유 필터 해제",
      });
    }

    if (studioPersistenceFilter !== "all") {
      items.push({
        id: "studio-persistence",
        label: `저장 방식 ${studioPersistenceFilterLabels[studioPersistenceFilter]}`,
        removeLabel: "Studio 저장 방식 필터 해제",
      });
    }

    if (studioSourceFilter !== "all") {
      items.push({
        id: "studio-source",
        label: `Studio 저장 출처 ${getStudioSourceFilterLabel(studioSourceFilter)}`,
        removeLabel: "Studio 저장 출처 필터 해제",
      });
    }

    if (studioSourceVariantFilter !== "all") {
      items.push({
        id: "studio-variant",
        label: `세부 초안 유형 ${getStudioSourceVariantFilterLabel(
          studioSourceVariantFilter,
        )}`,
        removeLabel: "세부 초안 유형 필터 해제",
      });
    }

    if (trimmedQuery) {
      items.push({
        id: "query",
        label: `검색 ${trimmedQuery}`,
        removeLabel: "검색어 해제",
      });
    }

    if (sortMode !== "recent") {
      items.push({
        id: "sort",
        label: `정렬 ${librarySortLabels[sortMode]}`,
        removeLabel: "정렬 기준 해제",
      });
    }

    return items;
  }, [
    generationEngineFilter,
    improvementFilter,
    languageFilter,
    learningScopeFilter,
    outputLanguageFilter,
    query,
    sourceReasonFilter,
    studioSourceFilter,
    studioSourceVariantFilter,
    studioPersistenceFilter,
    sortMode,
    targetModelFilter,
  ]);
  const hasActiveFilters = activeFilterItems.length > 0;
  const buildCurrentLibraryHref = useCallback(
    (overrides: Partial<LibraryFilterHrefOptions> = {}) =>
      buildLibraryFilterHref({
        search: query,
        sort: sortMode,
        language: languageFilter,
        output: outputLanguageFilter,
        model: targetModelFilter,
        engine: generationEngineFilter,
        learning: learningScopeFilter,
        improvement: improvementFilter,
        sourceReason: sourceReasonFilter,
        studioPersistence: studioPersistenceFilter,
        studioSource: studioSourceFilter,
        studioVariant: studioSourceVariantFilter,
        promptId: selectedId,
        version: activeModel,
        detailMode: promptDetailMode,
        ...overrides,
      }),
    [
      activeModel,
      generationEngineFilter,
      improvementFilter,
      languageFilter,
      learningScopeFilter,
      outputLanguageFilter,
      promptDetailMode,
      query,
      selectedId,
      sortMode,
      sourceReasonFilter,
      studioPersistenceFilter,
      studioSourceFilter,
      studioSourceVariantFilter,
      targetModelFilter,
    ],
  );

  function syncFilterUrl({
    search = query,
    sort = sortMode,
    language = languageFilter,
    output = outputLanguageFilter,
    model = targetModelFilter,
    engine = generationEngineFilter,
    learning = learningScopeFilter,
    improvement = improvementFilter,
    sourceReason = sourceReasonFilter,
    studioPersistence = studioPersistenceFilter,
    studioSource = studioSourceFilter,
    studioVariant = studioSourceVariantFilter,
    promptId = selectedId,
    version = activeModel,
    detailMode = promptDetailMode,
    route = true,
  }: {
    search?: string;
    sort?: LibrarySortMode;
    language?: LanguageFilter;
    output?: OutputLanguageFilter;
    model?: TargetModelFilter;
    engine?: GenerationEngineFilter;
    learning?: LearningScopeFilter;
    improvement?: ImprovementFilter;
    sourceReason?: SourceReasonFilter;
    studioPersistence?: StudioPersistenceFilter;
    studioSource?: StudioSourceFilter;
    studioVariant?: StudioSourceVariantFilter;
    promptId?: string;
    version?: TargetModel;
    detailMode?: PromptDetailMode;
    route?: boolean;
  }) {
    const href = buildLibraryFilterHref({
      search,
      sort,
      language,
      output,
      model,
      engine,
      learning,
      improvement,
      sourceReason,
      studioPersistence,
      studioSource,
      studioVariant,
      promptId,
      version,
      detailMode,
    });

    if (route) {
      router.replace(href, { scroll: false });
      return;
    }

    window.history.replaceState(null, "", href);
  }

  function clearCompanyUpdateNotice() {
    setCompanyUpdateNoticeVisible(false);
    syncFilterUrl({ route: false });
  }

  function clearProfileUpdateNotice() {
    setProfileUpdateNoticeVisible(false);
    syncFilterUrl({ route: false });
  }

  function resetFilters() {
    setQuery("");
    setSortMode("recent");
    setLanguageFilter("all");
    setOutputLanguageFilter("all");
    setTargetModelFilter("all");
    setGenerationEngineFilter("all");
    setLearningScopeFilter("all");
    setImprovementFilter("all");
    setSourceReasonFilter("all");
    setStudioPersistenceFilter("all");
    setStudioSourceFilter("all");
    setStudioSourceVariantFilter("all");
    setSelectedId("");
    setActiveModel("gpt");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setContextQuestionsCopyFailed(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    router.replace("/library", { scroll: false });
  }

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      search: nextQuery,
      promptId: "",
      version: undefined,
      detailMode: "current",
      route: false,
    });
  }

  function handleSortChange(nextSortMode: LibrarySortMode) {
    setSortMode(nextSortMode);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      sort: nextSortMode,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function handleImprovementFilterChange(
    nextImprovementFilter: ImprovementFilter,
  ) {
    setImprovementFilter(nextImprovementFilter);
    setSourceReasonFilter("all");
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      improvement: nextImprovementFilter,
      sourceReason: "all",
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function handleSourceReasonFilterChange(nextSourceReasonFilter: SourceReasonFilter) {
    const nextImprovementFilter =
      nextSourceReasonFilter === "all"
        ? improvementFilter
        : nextSourceReasonFilter === "archived-source"
          ? "archived-source"
          : "unmeasured";

    setSourceReasonFilter(nextSourceReasonFilter);
    setImprovementFilter(nextImprovementFilter);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      improvement: nextImprovementFilter,
      sourceReason: nextSourceReasonFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function handleStudioPersistenceFilterChange(
    nextStudioPersistenceFilter: StudioPersistenceFilter,
  ) {
    setStudioPersistenceFilter(nextStudioPersistenceFilter);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      studioPersistence: nextStudioPersistenceFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function handleStudioSourceFilterChange(
    nextStudioSourceFilter: StudioSourceFilter,
  ) {
    setStudioSourceFilter(nextStudioSourceFilter);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      studioSource: nextStudioSourceFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function handleStudioSourceVariantFilterChange(
    nextStudioSourceVariantFilter: StudioSourceVariantFilter,
  ) {
    setStudioSourceVariantFilter(nextStudioSourceVariantFilter);
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      studioVariant: nextStudioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function removeFilterItem(filterId: ActiveFilterId) {
    setSelectedId("");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setSourceHealthReportCopied(false);
    setStudioPersistenceReportCopied(false);
    setStudioPersistenceCandidateCopiedId("");
    setStudioSourceReportCopied(false);
    setStudioOperationalGroupReportCopied(false);
    setStudioSourceCandidateCopiedId("");
    setContextQuestionsCopied(false);
    setManualCopy(null);
    setPromptDetailMode("current");

    if (filterId === "query") {
      setQuery("");
      syncFilterUrl({
        search: "",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "language") {
      setLanguageFilter("all");
      syncFilterUrl({
        language: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "output") {
      setOutputLanguageFilter("all");
      syncFilterUrl({
        output: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "sort") {
      setSortMode("recent");
      syncFilterUrl({
        sort: "recent",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "improvement") {
      setImprovementFilter("all");
      setSourceReasonFilter("all");
      syncFilterUrl({
        improvement: "all",
        sourceReason: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "source-reason") {
      setSourceReasonFilter("all");
      syncFilterUrl({
        sourceReason: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "studio-persistence") {
      setStudioPersistenceFilter("all");
      syncFilterUrl({
        studioPersistence: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "studio-source") {
      setStudioSourceFilter("all");
      syncFilterUrl({
        studioSource: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "studio-variant") {
      setStudioSourceVariantFilter("all");
      syncFilterUrl({
        studioVariant: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "engine") {
      setGenerationEngineFilter("all");
      syncFilterUrl({
        engine: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    if (filterId === "learning") {
      setLearningScopeFilter("all");
      syncFilterUrl({
        learning: "all",
        promptId: "",
        version: undefined,
        detailMode: "current",
      });
      return;
    }

    setTargetModelFilter("all");
    setActiveModel("gpt");
    syncFilterUrl({
      model: "all",
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function renderFilterChip(item: ActiveFilterItem) {
    return (
      <span
        key={item.id}
        className="inline-flex max-w-full items-center gap-1 rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
      >
        <span className="min-w-0 break-words">{item.label}</span>
        <button
          type="button"
          className="-mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted transition hover:bg-surface hover:text-foreground"
          aria-label={item.removeLabel}
          title={item.removeLabel}
          onClick={() => removeFilterItem(item.id)}
        >
          x
        </button>
      </span>
    );
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matches = prompts.filter((prompt) => {
      const matchesLanguage =
        languageFilter === "all" || getLanguageStrategy(prompt) === languageFilter;
      const matchesOutputLanguage =
        outputLanguageFilter === "all" ||
        getOutputLanguage(prompt) === outputLanguageFilter;
      const matchesTargetModel =
        targetModelFilter === "all" ||
        prompt.versions.some(
          (version) => version.targetModel === targetModelFilter,
        );
      const matchesGenerationEngine =
        generationEngineFilter === "all" ||
        prompt.source === generationEngineFilter;
      const matchesLearningScope = promptMatchesLearningScope(
        prompt,
        learningScopeFilter,
      );
      const matchesImprovement =
        improvementFilter === "all" ||
        getPromptImprovementFilterMatch(
          prompt,
          prompts,
          deletedPrompts,
          improvementFilter,
        );
      const matchesSourceReason =
        sourceReasonFilter === "all" ||
        getPromptSourceHealthIssueReason(prompt, prompts, deletedPrompts) ===
          sourceReasonFilter;
      const matchesStudioPersistence =
        studioPersistenceFilter === "all" ||
        getPromptStudioPersistenceFilter(prompt) === studioPersistenceFilter;
      const matchesStudioSource =
        studioSourceFilter === "all" ||
        prompt.studioSource?.source === studioSourceFilter;
      const matchesStudioSourceVariant =
        studioSourceVariantFilter === "all" ||
        prompt.studioSource?.sourceVariant === studioSourceVariantFilter;
      const matchesQuery =
        !needle ||
        [
          prompt.title,
          prompt.rawInput,
          prompt.goal,
          prompt.domain,
          languageStrategyLabels[getLanguageStrategy(prompt)],
          prompt.languageDecision?.reason,
          prompt.languageDecision?.signals?.join(" "),
          prompt.targetModelDecision?.reason,
          prompt.targetModelDecision?.signals?.join(" "),
          prompt.targetModelDecision?.targetModels?.join(" "),
          prompt.targetModels.join(" "),
          generationEngineLabels[prompt.source],
          prompt.modelUsed,
          prompt.improvementSource?.sourcePromptTitle,
          prompt.improvementSource?.sourceVersionModel,
          prompt.studioSource?.sourceTitle,
          prompt.studioSource?.sourceHref,
          prompt.studioSource
            ? getPromptStudioSourceMetaLibraryLabel(prompt.studioSource).label
            : undefined,
          prompt.studioSource?.sourceVariant
            ? getStudioSourceVariantFilterLabel(
                prompt.studioSource.sourceVariant,
              )
            : undefined,
          prompt.studioSource
            ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
                .label
            : undefined,
          prompt.learningContext?.appliedMemoryTitles.join(" "),
          prompt.learningContext?.appliedMemoryScopes
            .map((scope) => memoryScopeLabels[scope])
            .join(" "),
          formatEnabledMemoryScopes(prompt),
          prompt.improvementSource
            ? `${formatPromptImprovementDepth(
                getPromptImprovementDepth(prompt, prompts, deletedPrompts),
              )} 재개선 개선 효과 품질 변화 ${
                isPromptReimprovementCandidate(prompt, prompts, deletedPrompts)
                  ? "재개선 후보"
                  : ""
              } ${
                hasArchivedSourcePrompt(prompt, prompts, deletedPrompts)
                  ? "삭제 보관함 보관함 원본"
                  : ""
              }`
            : undefined,
          prompt.versions.map((version) => modelLabels[version.targetModel]).join(" "),
          outputLanguageLabels[getOutputLanguage(prompt)],
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);

      return (
        matchesLanguage &&
        matchesOutputLanguage &&
        matchesTargetModel &&
        matchesGenerationEngine &&
        matchesLearningScope &&
        matchesImprovement &&
        matchesSourceReason &&
        matchesStudioPersistence &&
        matchesStudioSource &&
        matchesStudioSourceVariant &&
        matchesQuery
      );
    });

    return matches.sort((left, right) => {
      if (sortMode === "quality") {
        return (
          getPromptBestQuality(right) - getPromptBestQuality(left) ||
          getPromptTimestamp(right) - getPromptTimestamp(left)
        );
      }

      if (sortMode === "feedback") {
        return (
          right.feedback.length - left.feedback.length ||
          getPromptTimestamp(right) - getPromptTimestamp(left)
        );
      }

      if (sortMode === "improvement") {
        const leftDelta = getPromptImprovementDelta(
          left,
          prompts,
          deletedPrompts,
        );
        const rightDelta = getPromptImprovementDelta(
          right,
          prompts,
          deletedPrompts,
        );
        const leftHasDelta = leftDelta !== undefined;
        const rightHasDelta = rightDelta !== undefined;

        if (leftHasDelta && rightHasDelta) {
          return (
            rightDelta - leftDelta ||
            getPromptTimestamp(right) - getPromptTimestamp(left)
          );
        }

        if (leftHasDelta !== rightHasDelta) {
          return rightHasDelta ? 1 : -1;
        }

        return getPromptTimestamp(right) - getPromptTimestamp(left);
      }

      return getPromptTimestamp(right) - getPromptTimestamp(left);
    });
  }, [
    languageFilter,
    learningScopeFilter,
    generationEngineFilter,
    deletedPrompts,
    improvementFilter,
    outputLanguageFilter,
    prompts,
    query,
    sourceReasonFilter,
    sortMode,
    studioPersistenceFilter,
    studioSourceFilter,
    studioSourceVariantFilter,
    targetModelFilter,
  ]);
  const sourceReasonActionCandidates = useMemo(() => {
    if (sourceReasonFilter === "all") {
      return [];
    }

    return filtered.slice(0, 3).map((prompt) => {
      const sourcePromptId = prompt.improvementSource?.sourcePromptId;
      const activeSource = prompts.find((item) => item.id === sourcePromptId);
      const deletedSource = deletedPrompts.find(
        (item) => item.prompt.id === sourcePromptId,
      );
      const sourceStatus = activeSource
        ? "활성 원본"
        : deletedSource
          ? "삭제 보관함"
          : "원본 없음";
      const sourceStatusDetail = activeSource
        ? "활성 Library 원본"
        : deletedSource
          ? `삭제 보관함 원본 (${new Date(
              deletedSource.deletedAt,
            ).toLocaleString("ko-KR")})`
          : "원본 없음";
      const sourcePrompt = activeSource ?? deletedSource?.prompt;
      const sourceVersion = getSourceVersion(prompt, sourcePrompt);
      const detailHref = buildCurrentLibraryHref({
        promptId: prompt.id,
        version: prompt.versions[0]?.targetModel,
        detailMode: "current",
      });

      return {
        detailHref,
        id: prompt.id,
        note: buildSourceReasonCandidateNote({
          baseUrl: typeof window === "undefined" ? "" : window.location.origin,
          detailHref,
          prompt,
          reason: sourceReasonFilter,
          sourceStatus: sourceStatusDetail,
          sourceVersion,
        }),
        prompt,
        sourceStatus,
        sourceTitle: prompt.improvementSource?.sourcePromptTitle ?? "원본 없음",
        title: prompt.title,
      };
    });
  }, [
    buildCurrentLibraryHref,
    deletedPrompts,
    filtered,
    prompts,
    sourceReasonFilter,
  ]);
  const studioPersistenceActionCandidates = useMemo(() => {
    if (studioPersistenceFilter === "all") {
      return [];
    }

    return filtered.slice(0, 3).map((prompt) => {
      const sourceMeta = prompt.studioSource
        ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
        : undefined;
      const sourceDescription =
        sourceMeta?.description ?? studioPersistenceFilterDescriptions.none;
      const sourceLabel = sourceMeta?.label ?? "Studio 출처 없음";
      const sourceTitle =
        prompt.studioSource?.sourceTitle ?? "저장 출처 메타 없음";
      const sourceVariantLabel = getPromptStudioSourceVariantLabel(
        prompt.studioSource,
      );
      const detailHref = buildCurrentLibraryHref({
        promptId: prompt.id,
        version: prompt.versions[0]?.targetModel,
        detailMode: "current",
      });

      return {
        detailHref,
        id: prompt.id,
        note: buildStudioPersistenceCandidateNote({
          baseUrl: typeof window === "undefined" ? "" : window.location.origin,
          detailHref,
          filter: studioPersistenceFilter,
          prompt,
          sourceDescription,
          sourceLabel,
          sourceTitle,
        }),
        prompt,
        sourceDescription,
        sourceLabel,
        sourceTitle,
        sourceVariantLabel,
        title: prompt.title,
      };
    });
  }, [
    buildCurrentLibraryHref,
    filtered,
    studioPersistenceFilter,
  ]);
  const studioSourceActionCandidates = useMemo(() => {
    if (studioSourceFilter === "all") {
      return [];
    }

    return filtered.slice(0, 3).map((prompt) => {
      const sourceLabel = prompt.studioSource
        ? getPromptStudioSourceMetaLibraryLabel(prompt.studioSource).label
        : "Studio 출처 없음";
      const sourceTitle = prompt.studioSource?.sourceTitle ?? "출처 제목 없음";
      const sourceVariantLabel = getPromptStudioSourceVariantLabel(
        prompt.studioSource,
      );
      const detailHref = buildCurrentLibraryHref({
        promptId: prompt.id,
        version: prompt.versions[0]?.targetModel,
        detailMode: "current",
      });

      return {
        detailHref,
        id: prompt.id,
        note: buildStudioSourceCandidateNote({
          baseUrl: typeof window === "undefined" ? "" : window.location.origin,
          detailHref,
          filter: studioSourceFilter,
          prompt,
          sourceLabel,
          sourceTitle,
        }),
        prompt,
        sourceLabel,
        sourceTitle,
        sourceVariantLabel,
        title: prompt.title,
      };
    });
  }, [
    buildCurrentLibraryHref,
    filtered,
    studioSourceFilter,
  ]);
  const studioSourceVariantSummaryLinks = useMemo(
    () =>
      studioSourceFilter === "all"
        ? []
        : summarizePromptStudioSourceVariantItems(filtered).map((item) => ({
            ...item,
            href: buildCurrentLibraryHref({
              studioVariant: item.sourceVariant,
              promptId: "",
              version: undefined,
              detailMode: "current",
            }),
          })),
    [
      buildCurrentLibraryHref,
      filtered,
      studioSourceFilter,
    ],
  );
  const studioPersistenceVariantSummaryLinks = useMemo(
    () =>
      studioPersistenceFilter === "all"
        ? []
        : summarizePromptStudioSourceVariantItems(filtered).map((item) => ({
            ...item,
            href: buildCurrentLibraryHref({
              studioVariant: item.sourceVariant,
              promptId: "",
              version: undefined,
              detailMode: "current",
            }),
          })),
    [
      buildCurrentLibraryHref,
      filtered,
      studioPersistenceFilter,
    ],
  );

  const selected = useMemo(() => {
    const fallback = filtered[0];
    return filtered.find((prompt) => prompt.id === selectedId) ?? fallback;
  }, [filtered, selectedId]);

  const activeVersion =
    selected?.versions.find((version) => version.targetModel === activeModel) ??
    selected?.versions[0];
  const activeTargetAiPackageCopyKey =
    selected && activeVersion ? `${selected.id}:${activeVersion.id}` : "";
  const activeTargetAiHandoffPackageText = useMemo(
    () =>
      selected && activeVersion
        ? buildTargetAiHandoffPackageText({
            prompt: selected,
            version: activeVersion,
          })
        : "",
    [activeVersion, selected],
  );
  const activeTargetAiHandoffImprovementBriefText = useMemo(
    () =>
      selected && activeVersion
        ? buildTargetAiHandoffImprovementBriefText({
            prompt: selected,
            version: activeVersion,
          })
        : "",
    [activeVersion, selected],
  );
  const activeTargetAiHandoffReadinessItems = useMemo(
    () =>
      activeVersion
        ? buildTargetAiHandoffReadinessItems({ version: activeVersion })
        : [],
    [activeVersion],
  );
  const selectedStudioSource = selected?.studioSource;
  const selectedStudioSourceHasVariant = Boolean(
    selectedStudioSource?.sourceVariant,
  );
  const selectedStudioSourceLabel = selectedStudioSource
    ? getPromptStudioSourceMetaLibraryLabel(selectedStudioSource)
    : undefined;
  const selectedStudioSourceLinkCopyLabel = selectedStudioSourceHasVariant
    ? "세부 유형 링크 복사"
    : "출처 링크 복사";
  const selectedStudioSourceLinkCopiedLabel = selectedStudioSourceHasVariant
    ? "세부 유형 링크 복사됨"
    : "출처 링크 복사됨";
  const selectedStudioSourceLinkFailedLabel = selectedStudioSourceHasVariant
    ? "세부 유형 링크 복사 실패"
    : "출처 링크 복사 실패";
  const selectedStudioSourceLinkOpenLabel = selectedStudioSourceHasVariant
    ? "같은 세부 유형 출처 보기"
    : "같은 저장 출처 보기";
  const selectedStudioSourceLinkTitle = selectedStudioSourceHasVariant
    ? "같은 세부 유형 출처 조건 링크"
    : "같은 저장 출처 조건 링크";
  const selectedStudioOperationalGroupLinkCopyLabel =
    selectedStudioSourceHasVariant
      ? "세부 묶음 링크 복사"
      : "운영 묶음 링크 복사";
  const selectedStudioOperationalGroupLinkCopiedLabel =
    selectedStudioSourceHasVariant
      ? "세부 묶음 링크 복사됨"
      : "운영 묶음 링크 복사됨";
  const selectedStudioOperationalGroupLinkFailedLabel =
    selectedStudioSourceHasVariant
      ? "세부 묶음 링크 복사 실패"
      : "운영 묶음 링크 복사 실패";
  const selectedStudioOperationalGroupLinkTitle = selectedStudioSourceHasVariant
    ? "같은 세부 유형 운영 묶음 조건 링크"
    : "같은 운영 묶음 조건 링크";
  const selectedStudioSourcePersistence = selectedStudioSource
    ? getPromptStudioSourcePersistenceMeta(selectedStudioSource.source)
    : undefined;
  const selectedStudioSourceRelationshipDescription = selectedStudioSource
    ? getPromptStudioSourceRelationshipDescription(selectedStudioSource.source)
    : undefined;
  const selectedStudioPersistenceFilter = selected
    ? getPromptStudioPersistenceFilter(selected)
    : undefined;
  const selectedStudioPersistenceLabel = selectedStudioPersistenceFilter
    ? studioPersistenceFilterLabels[selectedStudioPersistenceFilter]
    : undefined;
  const selectedStudioPersistenceDescription =
    selectedStudioPersistenceFilter
      ? studioPersistenceFilterDescriptions[selectedStudioPersistenceFilter]
      : undefined;
  const selectedStudioSourceHref =
    getPromptStudioSourceHref(selectedStudioSource);
  const selectedStudioSourceFilterHref = selectedStudioSource
    ? buildLibraryFilterHref({
        search: "",
        sort: "recent",
        language: "all",
        output: "all",
        model: "all",
        engine: "all",
        learning: "all",
        improvement: "all",
        sourceReason: "all",
        studioPersistence: "all",
        studioSource: selectedStudioSource.source,
        studioVariant: selectedStudioSource.sourceVariant ?? "all",
        detailMode: "current",
      })
    : undefined;
  const selectedStudioPersistenceFilterHref = selected
    ? buildLibraryFilterHref({
        search: "",
        sort: "recent",
        language: "all",
        output: "all",
        model: "all",
        engine: "all",
        learning: "all",
        improvement: "all",
        sourceReason: "all",
        studioPersistence: selectedStudioPersistenceFilter,
        studioSource: "all",
        detailMode: "current",
      })
    : undefined;
  const selectedStudioOperationalGroupHref =
    selectedStudioSource && selectedStudioPersistenceFilter
      ? buildLibraryFilterHref({
          search: "",
          sort: "recent",
          language: "all",
          output: "all",
          model: "all",
          engine: "all",
          learning: "all",
          improvement: "all",
          sourceReason: "all",
          studioPersistence: selectedStudioPersistenceFilter,
          studioSource: selectedStudioSource.source,
          studioVariant: selectedStudioSource.sourceVariant ?? "all",
          detailMode: "current",
        })
      : undefined;

  useEffect(() => {
    if (initialFocusTarget !== "feedback" || !selected) {
      return;
    }

    const focusFeedbackTarget = () => {
      const target = highlightedFeedbackId
        ? document.getElementById(`library-feedback-${highlightedFeedbackId}`)
        : null;
      const fallback = document.getElementById("library-feedback-section");

      (target ?? fallback)?.scrollIntoView({
        behavior: "auto",
        block: "center",
      });

      if (target instanceof HTMLElement) {
        target.focus({ preventScroll: true });
      }
    };

    const firstTimeout = window.setTimeout(focusFeedbackTarget, 120);
    const secondTimeout = window.setTimeout(focusFeedbackTarget, 420);

    return () => {
      window.clearTimeout(firstTimeout);
      window.clearTimeout(secondTimeout);
    };
  }, [highlightedFeedbackId, initialFocusTarget, selected]);

  const sourcePrompt = useMemo(() => {
    if (!selected?.improvementSource?.sourcePromptId) {
      return undefined;
    }

    return prompts.find(
      (prompt) => prompt.id === selected.improvementSource?.sourcePromptId,
    );
  }, [prompts, selected]);
  const deletedSourcePrompt = useMemo(() => {
    if (!selected?.improvementSource?.sourcePromptId || sourcePrompt) {
      return undefined;
    }

    return deletedPrompts.find(
      (item) => item.prompt.id === selected.improvementSource?.sourcePromptId,
    );
  }, [deletedPrompts, selected, sourcePrompt]);
  const recoverableSourcePrompt = sourcePrompt ?? deletedSourcePrompt?.prompt;
  const linkedImprovementPrompts = useMemo(() => {
    if (!selected) {
      return [];
    }

    return prompts
      .filter(
        (prompt) => prompt.improvementSource?.sourcePromptId === selected.id,
      )
      .sort((left, right) => getPromptTimestamp(right) - getPromptTimestamp(left))
      .slice(0, 3);
  }, [prompts, selected]);
  const selectedImprovementLineage = useMemo(() => {
    if (!selected) {
      return [];
    }

    return getPromptImprovementLineage(selected, prompts, deletedPrompts);
  }, [deletedPrompts, prompts, selected]);
  const selectedImprovementDepth = Math.max(
    0,
    selectedImprovementLineage.length - 1,
  );
  const selectedImprovementQualityDelta = useMemo(() => {
    if (!selected?.improvementSource) {
      return undefined;
    }

    return getImprovementQualityDelta({
      improvementPrompt: selected,
      preferredVersion: activeVersion,
      sourcePrompt: recoverableSourcePrompt,
    });
  }, [activeVersion, recoverableSourcePrompt, selected]);
  const selectedSourceHealthIssueReason = useMemo(() => {
    if (!selected?.improvementSource) {
      return undefined;
    }

    return getPromptSourceHealthIssueReason(selected, prompts, deletedPrompts);
  }, [deletedPrompts, prompts, selected]);
  const selectedImprovementScoreComparison = useMemo(() => {
    if (!selectedImprovementQualityDelta) {
      return undefined;
    }

    return buildImprovementScoreComparison({
      improvedVersion: selectedImprovementQualityDelta.improvedVersion,
      sourceVersion: selectedImprovementQualityDelta.sourceVersion,
    });
  }, [selectedImprovementQualityDelta]);
  const selectedPromptComparisonBrief = useMemo(() => {
    if (
      !selected ||
      !selectedImprovementQualityDelta ||
      !selectedImprovementScoreComparison
    ) {
      return undefined;
    }

    return buildPromptComparisonBrief({
      delta: selectedImprovementQualityDelta.delta,
      improvedScore: selectedImprovementQualityDelta.improvedScore,
      improvedVersion: selectedImprovementQualityDelta.improvedVersion,
      prompt: selected,
      scoreComparison: selectedImprovementScoreComparison,
      sourceScore: selectedImprovementQualityDelta.sourceScore,
      sourceVersion: selectedImprovementQualityDelta.sourceVersion,
    });
  }, [selected, selectedImprovementQualityDelta, selectedImprovementScoreComparison]);
  const selectedOperationalSummary = useMemo<
    SelectedOperationalSummary | undefined
  >(() => {
    if (!selected || !activeVersion) {
      return undefined;
    }

    const blockedReadinessCount = activeTargetAiHandoffReadinessItems.filter(
      (item) => item.status === "blocked",
    ).length;
    const reviewReadinessCount = activeTargetAiHandoffReadinessItems.filter(
      (item) => item.status === "review",
    ).length;
    const handoffStatusLabel = blockedReadinessCount
      ? "보강 필요"
      : reviewReadinessCount
        ? "검토 후 전달"
        : "전달 가능";
    const handoffStatusDescription = blockedReadinessCount
      ? `${blockedReadinessCount}개 전달 전 차단 항목이 있습니다. 보강 브리프를 먼저 적용하세요.`
      : reviewReadinessCount
        ? `${reviewReadinessCount}개 검토 항목이 있습니다. 맥락과 가정을 확인한 뒤 전달하세요.`
        : "현재 버전은 외부 AI 전달 기준을 충족합니다.";
    const persistenceLabel =
      selectedStudioPersistenceLabel ??
      (selected.improvementSource ? "개선 체인" : "Studio 출처 없음");
    const sourceLabel =
      selectedStudioSourceLabel?.label ??
      (selected.improvementSource ? "Library 개선본" : "직접 저장/레거시");
    const sourceVariantLabel =
      getPromptStudioSourceVariantLabel(selectedStudioSource);
    const chainLabel =
      selectedImprovementDepth > 0
        ? formatPromptImprovementDepth(selectedImprovementDepth)
        : linkedImprovementPrompts.length
          ? "원본 프롬프트"
          : "단독 저장본";
    const chainDescription =
      selectedImprovementDepth > 0
        ? `원본부터 현재까지 ${selectedImprovementLineage.length}단계로 연결되어 있습니다.`
        : linkedImprovementPrompts.length
          ? `${linkedImprovementPrompts.length}개 후속 개선본이 이 프롬프트를 기준으로 연결되어 있습니다.`
          : "아직 연결된 개선 체인이 없습니다.";
    const nextAction = selectedSourceHealthIssueReason
      ? "원본 상태 확인"
      : blockedReadinessCount || reviewReadinessCount
        ? "AI 전달 전 보강"
        : selectedImprovementQualityDelta?.delta !== undefined &&
            selectedImprovementQualityDelta.delta < 0
          ? "재개선 후보 검토"
          : "AI 전달 패키지 실행";
    const actionKind = selectedSourceHealthIssueReason
      ? "source-detail"
      : blockedReadinessCount || reviewReadinessCount
        ? "handoff-improve"
        : selectedImprovementQualityDelta?.delta !== undefined &&
            selectedImprovementQualityDelta.delta < 0
          ? "comparison"
          : "package";
    const actionLabel =
      actionKind === "source-detail"
        ? "출처 카드 확인"
        : actionKind === "handoff-improve"
          ? "Studio에서 보강"
          : actionKind === "comparison"
            ? "원본 비교 보기"
            : "패키지 보기";
    const sourceActionLabel = selectedStudioSourceFilterHref
      ? selectedStudioSourceHasVariant
        ? "세부 유형 출처 보기"
        : "저장 출처 보기"
      : undefined;
    const persistenceActionLabel = selectedStudioPersistenceFilterHref
      ? "저장 방식으로 보기"
      : undefined;
    const groupActionLabel = selectedStudioOperationalGroupHref
      ? selectedStudioSourceHasVariant
        ? "세부 유형 묶음 보기"
        : "운영 묶음 보기"
      : undefined;
    const nextActionDescription = selectedSourceHealthIssueReason
      ? "품질 판단보다 원본 복원, 버전 연결, 삭제 보관함 상태를 먼저 확인합니다."
      : blockedReadinessCount || reviewReadinessCount
        ? "보강 브리프를 Studio로 보내 새 결과를 만든 뒤 복사/저장합니다."
        : selectedImprovementQualityDelta?.delta !== undefined &&
            selectedImprovementQualityDelta.delta < 0
          ? "원본 대비 점수가 낮아진 항목을 비교 모드에서 확인하고 재개선합니다."
          : "패키지 미리보기에서 실행 프롬프트와 검토 체크리스트를 함께 전달합니다.";

    return {
      actionKind,
      actionLabel,
      chainDescription,
      chainLabel,
      groupActionHref: selectedStudioOperationalGroupHref,
      groupActionLabel,
      handoffStatusDescription,
      handoffStatusLabel,
      nextAction,
      nextActionDescription,
      persistenceActionHref: selectedStudioPersistenceFilterHref,
      persistenceActionLabel,
      persistenceLabel,
      sourceActionHref: selectedStudioSourceFilterHref,
      sourceActionLabel,
      sourceLabel,
      sourceOriginalActionLabel: selectedStudioSourceLabel?.actionLabel,
      sourceOriginalHref: selectedStudioSourceHref,
      sourceTitle: selectedStudioSource?.sourceTitle,
      sourceVariantLabel,
    };
  }, [
    activeTargetAiHandoffReadinessItems,
    activeVersion,
    linkedImprovementPrompts.length,
    selected,
    selectedImprovementDepth,
    selectedImprovementLineage.length,
    selectedImprovementQualityDelta?.delta,
    selectedSourceHealthIssueReason,
    selectedStudioOperationalGroupHref,
    selectedStudioPersistenceFilterHref,
    selectedStudioSourceFilterHref,
    selectedStudioSourceHasVariant,
    selectedStudioSourceHref,
    selectedStudioPersistenceLabel,
    selectedStudioSource,
    selectedStudioSourceLabel?.actionLabel,
    selectedStudioSourceLabel?.label,
  ]);
  const libraryOperatingFlowItems = useMemo<ContextOperatingFlowItem[]>(
    () => [
      {
        actionLabel: "조건 확인",
        detail: hasActiveFilters
          ? `${activeFilterItems.length}개 조건으로 ${filtered.length}개 저장본을 보고 있습니다.`
          : `전체 ${prompts.length}개 저장본을 최근 순서로 확인합니다.`,
        href: "#library-filters",
        label: "검색",
        step: "01",
        title: hasActiveFilters ? "필터 적용 중" : "전체 Library",
      },
      {
        actionLabel: "목록 확인",
        detail: `현재 조건의 결과 ${filtered.length}개에서 저장본, 품질, 출처 배지를 비교합니다.`,
        href: "#library-results",
        label: "목록",
        step: "02",
        title: filtered.length ? "결과 비교" : "결과 없음",
      },
      {
        actionLabel: "운영 요약",
        detail:
          selected && activeVersion
            ? `${selected.domain} · ${modelLabels[activeVersion.targetModel]} 버전의 다음 액션을 확인합니다.`
            : "저장본을 선택하면 AI 전달 readiness와 다음 액션을 확인합니다.",
        href: "#library-selected-operational-summary",
        label: "상태",
        step: "03",
        title: selectedOperationalSummary?.nextAction ?? "선택 대기",
      },
      {
        actionLabel: "추적 확인",
        detail: selectedOperationalSummary
          ? `${selectedOperationalSummary.persistenceLabel} · ${selectedOperationalSummary.sourceLabel} · ${selectedOperationalSummary.chainLabel}`
          : "저장 방식, Studio 출처, 개선 체인을 한 번에 추적합니다.",
        href: "#library-detail-workspace",
        label: "추적",
        step: "04",
        title: selectedOperationalSummary?.sourceLabel ?? "출처/이력",
      },
    ],
    [
      activeFilterItems.length,
      activeVersion,
      filtered.length,
      hasActiveFilters,
      prompts.length,
      selected,
      selectedOperationalSummary,
    ],
  );
  const selectedOperationalWorkflowSteps = useMemo(() => {
    if (!selectedOperationalSummary) {
      return [];
    }

    return [
      {
        detail: selectedOperationalSummary.handoffStatusLabel,
        label: "확인",
        step: "01",
        title: selectedOperationalSummary.nextAction,
      },
      {
        detail: "리포트 또는 조건 링크로 공유",
        label: "공유",
        step: "02",
        title: "운영 요약 복사",
      },
      {
        detail: selectedOperationalSummary.nextActionDescription,
        label: "개선",
        step: "03",
        title: selectedOperationalSummary.actionLabel,
      },
    ];
  }, [selectedOperationalSummary]);
  const selectedLearningContextWorkflowSteps = useMemo(() => {
    if (!selected) {
      return [];
    }

    return [
      {
        detail: formatLearningContextCount(selected),
        label: "증거 확인",
        step: "01",
        title: formatEnabledMemoryScopes(selected),
      },
      {
        detail: "enabled/disabled scope와 적용 메모리를 Markdown으로 복사합니다.",
        label: "리포트 공유",
        step: "02",
        title: "학습 컨텍스트 리포트",
      },
      {
        detail: "같은 학습 증거를 Studio 초안으로 보내 재개선 계획을 만듭니다.",
        label: "Studio 개선",
        step: "03",
        title: "학습 기준 재점검",
      },
    ];
  }, [selected]);
  const activePromptDetailMode =
    selectedImprovementQualityDelta && promptDetailMode === "comparison"
      ? "comparison"
      : "current";
  const selectedDetailReturnHref =
    selected && activeVersion
      ? buildLibraryFilterHref({
          search: query,
          sort: sortMode,
          language: languageFilter,
          output: outputLanguageFilter,
          model: targetModelFilter,
          engine: generationEngineFilter,
          learning: learningScopeFilter,
          improvement: improvementFilter,
          sourceReason: sourceReasonFilter,
          studioPersistence: studioPersistenceFilter,
          studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
          promptId: selected.id,
          version: activeVersion.targetModel,
          detailMode: activePromptDetailMode,
        })
      : "/library";
  const companyContextHref = buildContextEditorHref({
    fallbackReturnTo: "/library",
    pathname: "/company",
    returnTo: selectedDetailReturnHref,
  });
  const profileContextHref = buildContextEditorHref({
    fallbackReturnTo: "/library",
    pathname: "/profile",
    returnTo: selectedDetailReturnHref,
  });
  const versionComparisons = useMemo(() => {
    if (!selected) {
      return [];
    }

    const bestQuality = getPromptBestQuality(selected);
    const feedbackStats = selected.versions.map((version) => ({
      stats: getVersionFeedbackStats(selected, version.id),
      version,
    }));
    const mostFeedback = Math.max(
      0,
      ...feedbackStats.map((item) => item.stats.count),
    );

    return feedbackStats.map(({ stats, version }) => ({
      averageRating: stats.averageRating,
      feedbackCount: stats.count,
      isBestQuality: version.qualityScore === bestQuality,
      isMostReviewed: stats.count > 0 && stats.count === mostFeedback,
      version,
    }));
  }, [selected]);
  const improvementActions = useMemo(
    () => (activeVersion ? getImprovementActions(activeVersion) : []),
    [activeVersion],
  );
  const sortedDeletedPrompts = useMemo(
    () =>
      deletedPrompts
        .slice()
        .sort((left, right) => right.deletedAt.localeCompare(left.deletedAt)),
    [deletedPrompts],
  );
  const filteredDeletedPrompts = useMemo(() => {
    const normalizedQuery = deletedPromptArchiveQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return sortedDeletedPrompts;
    }

    return sortedDeletedPrompts.filter((item) => {
      const searchable = [
        item.prompt.title,
        item.prompt.domain,
        item.prompt.goal,
        item.prompt.languageStrategy,
        item.prompt.outputLanguage,
        item.prompt.source,
        item.prompt.versions.map((version) => version.content).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [deletedPromptArchiveQuery, sortedDeletedPrompts]);
  const visibleDeletedPrompts = deletedPromptArchiveExpanded
    ? filteredDeletedPrompts
    : filteredDeletedPrompts.slice(0, 3);

  function handlePromptSelect(prompt: PromptAsset) {
    const nextActiveModel =
      targetModelFilter !== "all" &&
      prompt.versions.some((version) => version.targetModel === targetModelFilter)
        ? targetModelFilter
        : prompt.versions[0]?.targetModel ?? "general";

    setSelectedId(prompt.id);
    setActiveModel(nextActiveModel);
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setContextQuestionsCopied(false);
    setNoSourceMetaNoteCopiedFor("");
    setLatestFeedbackId("");
    setHighlightedFeedbackId("");
    setDeletePromptCandidate(null);
    setDeletedPromptRemoveCandidate(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      promptId: prompt.id,
      version: nextActiveModel,
      detailMode: "current",
    });
  }

  function getLinkedImprovementPromptCount(prompt: PromptAsset) {
    return prompts.filter(
      (item) => item.improvementSource?.sourcePromptId === prompt.id,
    ).length;
  }

  function requestSelectedPromptDelete() {
    if (!selected) {
      return;
    }

    setDeletePromptCandidate(selected);
    setDeletedPromptRemoveCandidate(null);
    setManualCopy(null);
  }

  function cancelPromptDelete() {
    setDeletePromptCandidate(null);
  }

  function requestDeletedPromptRemove(deletedPrompt: PromptDeletedAsset) {
    setDeletedPromptRemoveCandidate(deletedPrompt);
    setDeletePromptCandidate(null);
    setManualCopy(null);
  }

  function cancelDeletedPromptRemove() {
    setDeletedPromptRemoveCandidate(null);
  }

  function confirmDeletedPromptRemove() {
    if (!deletedPromptRemoveCandidate) {
      return;
    }

    const removedPromptId = deletedPromptRemoveCandidate.prompt.id;

    setDeletedPrompts((current) =>
      current.filter((item) => item.prompt.id !== removedPromptId),
    );
    setDeletedPromptRemoveCandidate(null);

    if (deletedPromptRecoveryId === removedPromptId) {
      setDeletedPromptTitle("");
      setDeletedPromptRecoveryId("");
    }

    if (deletedPrompts.length <= 1) {
      setDeletedPromptArchiveExpanded(false);
      setDeletedPromptArchiveQuery("");
    }
  }

  function toggleDeletedPromptArchive() {
    setDeletedPromptArchiveExpanded((current) => {
      const nextExpanded = !current;

      if (!nextExpanded) {
        setDeletedPromptArchiveQuery("");
      }

      return nextExpanded;
    });
  }

  function openDeletedPromptArchive() {
    setDeletedPromptArchiveExpanded(true);
    setDeletedPromptArchiveQuery("");
  }

  function confirmPromptDelete() {
    if (!deletePromptCandidate) {
      return;
    }

    const promptToDelete = deletePromptCandidate;

    setPrompts((current) =>
      current.filter((prompt) => prompt.id !== promptToDelete.id),
    );
    setDeletedPrompts((current) => [
      {
        prompt: promptToDelete,
        deletedAt: new Date().toISOString(),
      },
      ...current.filter((item) => item.prompt.id !== promptToDelete.id),
    ]);
    setDeletedPromptTitle(promptToDelete.title);
    setDeletedPromptRecoveryId(promptToDelete.id);
    setDeletePromptCandidate(null);
    setSelectedId("");
    setActiveModel("gpt");
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setContextQuestionsCopied(false);
    setContextQuestionsCopyFailed(false);
    setLatestFeedbackId("");
    setHighlightedFeedbackId("");
    setManualCopy(null);
    setPromptDetailMode("current");
    setDeletedPromptRemoveCandidate(null);
    syncFilterUrl({
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
  }

  function undoPromptDelete() {
    const deletedPrompt = deletedPrompts.find(
      (item) => item.prompt.id === deletedPromptRecoveryId,
    );

    if (!deletedPrompt) {
      return;
    }

    restoreDeletedPrompt(deletedPrompt);
  }

  function restoreDeletedPrompt(deletedPrompt: PromptDeletedAsset) {
    const restoredPrompt = deletedPrompt.prompt;
    const nextActiveModel = restoredPrompt.versions[0]?.targetModel ?? "general";

    setPrompts((current) =>
      current.some((prompt) => prompt.id === restoredPrompt.id)
        ? current
        : [restoredPrompt, ...current],
    );
    setDeletedPrompts((current) =>
      current.filter((item) => item.prompt.id !== restoredPrompt.id),
    );
    if (deletedPrompts.length <= 1) {
      setDeletedPromptArchiveExpanded(false);
      setDeletedPromptArchiveQuery("");
    }
    setSelectedId(restoredPrompt.id);
    setActiveModel(nextActiveModel);
    setDeletedPromptTitle("");
    setDeletedPromptRecoveryId("");
    setDeletePromptCandidate(null);
    setDeletedPromptRemoveCandidate(null);
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setContextQuestionsCopied(false);
    setContextQuestionsCopyFailed(false);
    setLatestFeedbackId("");
    setHighlightedFeedbackId("");
    setManualCopy(null);
    setPromptDetailMode("current");
    syncFilterUrl({
      promptId: restoredPrompt.id,
      version: nextActiveModel,
      detailMode: "current",
    });
  }

  function handleVersionChange(nextActiveModel: TargetModel) {
    if (!selected) {
      return;
    }

    setActiveModel(nextActiveModel);
    setCopied(false);
    setFilterLinkCopied(false);
    setDetailLinkCopied(false);
    setImprovementBriefCopied(false);
    setComparisonBriefCopied(false);
    setContextQuestionsCopied(false);
    setContextQuestionsCopyFailed(false);
    setLatestFeedbackId("");
    setHighlightedFeedbackId("");
    setManualCopy(null);
    syncFilterUrl({
      promptId: selected.id,
      version: nextActiveModel,
      detailMode: activePromptDetailMode,
    });
  }

  function handlePromptDetailModeChange(nextDetailMode: PromptDetailMode) {
    setPromptDetailMode(nextDetailMode);
    setDetailLinkCopied(false);
    setFilterLinkCopied(false);
    setComparisonBriefCopied(false);
    setContextQuestionsCopied(false);
    setLatestFeedbackId("");
    setHighlightedFeedbackId("");

    if (!selected || !activeVersion) {
      return;
    }

    syncFilterUrl({
      promptId: selected.id,
      version: activeVersion.targetModel,
      detailMode: nextDetailMode,
      route: false,
    });
  }

  function openPromptDetail(promptId: string, preferredVersion?: TargetModel) {
    const prompt = prompts.find((item) => item.id === promptId);

    if (!prompt) {
      return;
    }

    const nextVersion =
      preferredVersion &&
      prompt.versions.some((version) => version.targetModel === preferredVersion)
        ? preferredVersion
        : prompt.versions[0]?.targetModel;

    const href = buildLibraryFilterHref({
      search: "",
      sort: "recent",
      language: "all",
      output: "all",
      model: "all",
      engine: "all",
      learning: "all",
      improvement: "all",
      promptId: prompt.id,
      version: nextVersion,
      detailMode: "current",
    });

    router.push(href);
  }

  function openPromptFeedbackDetail(
    promptId: string,
    feedbackId: string,
    preferredVersion?: TargetModel,
  ) {
    const prompt = prompts.find((item) => item.id === promptId);

    if (!prompt) {
      return;
    }

    const nextVersion =
      preferredVersion &&
      prompt.versions.some((version) => version.targetModel === preferredVersion)
        ? preferredVersion
        : prompt.versions[0]?.targetModel;
    const href = buildLibraryFilterHref({
      search: "",
      sort: "recent",
      language: "all",
      output: "all",
      model: "all",
      engine: "all",
      learning: "all",
      improvement: "all",
      promptId: prompt.id,
      version: nextVersion,
      detailMode: "current",
      focusTarget: "feedback",
      feedbackId,
    });

    router.push(href);
  }

  function addFeedback() {
    if (!selected || !activeVersion || !comment.trim()) {
      return;
    }

    const feedback: Feedback = {
      id: makeId("feedback"),
      promptVersionId: activeVersion.id,
      rating,
      comment,
      feedbackType,
      createdAt: new Date().toISOString(),
    };

    setPrompts((current) =>
      current.map((prompt) =>
        prompt.id === selected.id
          ? {
              ...prompt,
              feedback: [feedback, ...prompt.feedback],
              updatedAt: new Date().toISOString(),
            }
          : prompt,
      ),
    );
    setMemories((current) =>
      mergeMemoryList(
        current,
        createMemoryFromFeedback(selected, activeVersion, feedback),
      ),
    );
    setComment("");
    setLatestFeedbackId(feedback.id);
    setHighlightedFeedbackId(feedback.id);
  }

  async function copyLibraryText(copy: LibraryManualCopy) {
    const copiedToClipboard = await copyTextToClipboard(copy.body);

    setManualCopy(copiedToClipboard ? null : copy);

    return copiedToClipboard;
  }

  async function copyStudioVariantFilterLink({
    href,
    label,
    sourceVariant,
  }: {
    href: string;
    label: string;
    sourceVariant: PromptStudioDraftSourceVariant;
  }) {
    const linkText =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copiedToClipboard = await copyLibraryText({
      id: "studio-variant-link",
      targetId: sourceVariant,
      title: `세부 초안 유형 조건 링크 · ${label}`,
      body: linkText,
    });

    setStudioVariantLinkCopiedFor(copiedToClipboard ? sourceVariant : "");
  }

  async function copyPrompt(title = "현재 버전") {
    if (!activeVersion) {
      return;
    }

    const copiedToClipboard = await copyLibraryText({
      id: "prompt",
      title,
      body: activeVersion.content,
    });

    setCopied(copiedToClipboard);
  }

  async function copyTargetAiHandoffPackage() {
    if (!selected || !activeVersion) {
      return;
    }

    const copyKey = `${selected.id}:${activeVersion.id}`;
    const copiedToClipboard = await copyLibraryText({
      id: "target-ai-package",
      targetId: copyKey,
      title: "AI 전달 패키지",
      body: activeTargetAiHandoffPackageText,
    });

    setTargetAiPackageCopiedKey(copiedToClipboard ? copyKey : "");
  }

  async function copyTargetAiHandoffImprovementBrief() {
    if (!selected || !activeVersion) {
      return;
    }

    const copyKey = `${selected.id}:${activeVersion.id}`;
    const copiedToClipboard = await copyLibraryText({
      id: "target-ai-improvement-brief",
      targetId: copyKey,
      title: "AI 전달 보강 브리프",
      body: activeTargetAiHandoffImprovementBriefText,
    });

    setTargetAiImprovementBriefCopiedKey(copiedToClipboard ? copyKey : "");
  }

  async function copySelectedOperationalSummaryReport() {
    if (!selected || !activeVersion || !selectedOperationalSummary) {
      return;
    }

    const copiedToClipboard = await copyLibraryText({
      id: "selected-operational-summary-report",
      targetId: selected.id,
      title: "선택 운영 요약 리포트",
      body: buildSelectedOperationalSummaryReport({
        baseUrl: window.location.origin,
        detailHref: selectedDetailReturnHref,
        prompt: selected,
        readinessItems: activeTargetAiHandoffReadinessItems,
        summary: selectedOperationalSummary,
        version: activeVersion,
      }),
    });

    setSelectedOperationalSummaryReportCopiedFor(
      copiedToClipboard ? selected.id : "",
    );
  }

  function openSelectedOperationalSummaryReportInStudio() {
    if (!selected || !activeVersion || !selectedOperationalSummary) {
      return;
    }

    const rawInput = buildSelectedOperationalSummaryReport({
      baseUrl: window.location.origin,
      detailHref: selectedDetailReturnHref,
      prompt: selected,
      readinessItems: activeTargetAiHandoffReadinessItems,
      summary: selectedOperationalSummary,
      version: activeVersion,
    });
    const wroteDraft = writeStudioDraft({
      source: "library-operational-summary",
      rawInput,
      goal: "Library 운영 요약 기반 다음 조치 정리",
      domain: selected.domain || "운영",
      targetModels: [activeVersion.targetModel],
      outputLanguage: "korean",
      sourceTitle: `운영 요약 · ${selected.title}`,
      sourceHref: selectedDetailReturnHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setSelectedOperationalSummaryReportCopiedFor("");
      setManualCopy({
        id: "selected-operational-summary-report",
        targetId: selected.id,
        title: "선택 운영 요약 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-operational-summary");
  }

  function openTargetAiHandoffImprovementInStudio() {
    if (!selected || !activeVersion) {
      return;
    }

    const rawInput = activeTargetAiHandoffImprovementBriefText;
    const wroteDraft = writeStudioDraft({
      source: "library-improvement",
      sourceVariant: "handoff-improvement",
      rawInput,
      goal: "프롬프트 개선",
      domain: selected.domain,
      targetModels: [activeVersion.targetModel],
      outputLanguage: getOutputLanguage(selected),
      sourcePromptId: selected.id,
      sourceVersionId: activeVersion.id,
      sourceVersionModel: activeVersion.targetModel,
      sourceTitle: selected.title,
      sourceHref: buildLibraryFilterHref({
        search: query,
        sort: sortMode,
        language: languageFilter,
        output: outputLanguageFilter,
        model: targetModelFilter,
        engine: generationEngineFilter,
        learning: learningScopeFilter,
        improvement: improvementFilter,
        sourceReason: sourceReasonFilter,
        studioPersistence: studioPersistenceFilter,
        studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
        promptId: selected.id,
        version: activeVersion.targetModel,
        detailMode: activePromptDetailMode,
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setTargetAiImprovementBriefCopiedKey("");
      setManualCopy({
        id: "target-ai-improvement-brief",
        targetId: activeTargetAiPackageCopyKey,
        title: "AI 전달 보강 브리프",
        body: rawInput,
      });
      setTargetAiPackagePreviewOpen(true);
      return;
    }

    router.push("/studio?draft=library-improvement");
  }

  function runSelectedOperationalSummaryAction() {
    if (!selectedOperationalSummary) {
      return;
    }

    if (selectedOperationalSummary.actionKind === "source-detail") {
      document
        .getElementById("library-improvement-source-card")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (selectedOperationalSummary.actionKind === "handoff-improve") {
      openTargetAiHandoffImprovementInStudio();
      return;
    }

    if (selectedOperationalSummary.actionKind === "comparison") {
      handlePromptDetailModeChange("comparison");
      return;
    }

    setTargetAiPackagePreviewOpen(true);
  }

  async function copyFilterLink() {
    const href = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: selectedId,
      version: selectedId ? activeVersion?.targetModel : undefined,
      detailMode: selectedId ? activePromptDetailMode : "current",
    });

    const linkText =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copiedToClipboard = await copyLibraryText({
      id: "filter-link",
      title: "공유 링크",
      body: linkText,
    });

    setFilterLinkCopied(copiedToClipboard);
  }

  async function copySourceReasonFilterReport() {
    if (sourceReasonFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const copiedToClipboard = await copyLibraryText({
      id: "source-health-filter-report",
      title: "출처 사유 조치 리포트",
      body: buildSourceReasonFilterReport({
        baseUrl: window.location.origin,
        deletedPrompts,
        prompts,
        reason: sourceReasonFilter,
        resultPrompts: filtered,
        filterHref,
      }),
    });

    setSourceHealthReportCopied(copiedToClipboard);
  }

  async function copySourceReasonFilterLink() {
    if (sourceReasonFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const linkText =
      formatAbsoluteInternalHref(filterHref, window.location.origin) ??
      filterHref;
    const copiedToClipboard = await copyLibraryText({
      id: "source-health-filter-link",
      title: "출처 사유 조건 링크",
      body: linkText,
    });

    setFilterLinkCopied(copiedToClipboard);
  }

  async function copyStudioPersistenceFilterReport() {
    if (studioPersistenceFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const reportTitle =
      studioPersistenceFilter === "none"
        ? "저장 출처 메타 없음 큐 리포트"
        : "Studio 저장 방식 리포트";
    const copiedToClipboard = await copyLibraryText({
      id: "studio-persistence-report",
      title: reportTitle,
      body: buildStudioPersistenceFilterReport({
        baseUrl: window.location.origin,
        filter: studioPersistenceFilter,
        filterHref,
        resultPrompts: filtered,
      }),
    });

    setStudioPersistenceReportCopied(copiedToClipboard);
  }

  async function copyStudioPersistenceFilterLink() {
    if (studioPersistenceFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const linkText =
      formatAbsoluteInternalHref(filterHref, window.location.origin) ??
      filterHref;
    const copiedToClipboard = await copyLibraryText({
      id: "studio-persistence-link",
      title:
        studioPersistenceFilter === "none"
          ? "저장 출처 메타 없음 큐 링크"
          : "Studio 저장 방식 조건 링크",
      body: linkText,
    });

    setFilterLinkCopied(copiedToClipboard);
  }

  function openStudioPersistenceFilterReportInStudio() {
    if (studioPersistenceFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const sourceTitle =
      studioPersistenceFilter === "none"
        ? "저장 출처 메타 없음 큐"
        : `Studio 저장 방식 · ${studioPersistenceFilterLabels[studioPersistenceFilter]}`;
    const rawInput = buildStudioPersistenceFilterReport({
      baseUrl: window.location.origin,
      filter: studioPersistenceFilter,
      filterHref,
      resultPrompts: filtered,
    });
    const draftHref =
      studioPersistenceFilter === "none"
        ? "/studio?draft=library-missing-source-metadata-queue"
        : "/studio?draft=library-studio-persistence-filter";

    const wroteDraft = writeStudioDraft({
      source:
        studioPersistenceFilter === "none"
          ? "library-missing-source-metadata-queue"
          : "library-studio-persistence-filter",
      rawInput,
      goal:
        studioPersistenceFilter === "none"
          ? "저장 출처 메타 없음 큐 운영 기준 정리"
          : "Studio 저장 방식 운영 기준 정리",
      domain: "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle,
      sourceHref: filterHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioPersistenceReportCopied(false);
      setManualCopy({
        id: "studio-persistence-report",
        title:
          studioPersistenceFilter === "none"
            ? "저장 출처 메타 없음 큐 리포트"
            : "Studio 저장 방식 리포트",
        body: rawInput,
      });
      return;
    }

    router.push(draftHref);
  }

  async function copyStudioPersistenceCandidateNote(
    candidate: (typeof studioPersistenceActionCandidates)[number],
  ) {
    const copiedToClipboard = await copyLibraryText({
      id: "studio-persistence-candidate-note",
      targetId: candidate.id,
      title:
        studioPersistenceFilter === "none"
          ? "저장 출처 메타 없음 후보 메모"
          : "Studio 저장 방식 후보 메모",
      body: candidate.note,
    });

    setStudioPersistenceCandidateCopiedId(
      copiedToClipboard ? candidate.id : "",
    );
  }

  function openStudioPersistenceCandidateInStudio(
    candidate: (typeof studioPersistenceActionCandidates)[number],
  ) {
    const rawInput = candidate.note;
    const draftHref =
      studioPersistenceFilter === "none"
        ? "/studio?draft=library-missing-source-metadata-candidate"
        : "/studio?draft=library-studio-persistence-candidate";
    const wroteDraft = writeStudioDraft({
      source:
        studioPersistenceFilter === "none"
          ? "library-missing-source-metadata-candidate"
          : "library-studio-persistence-candidate",
      rawInput,
      goal:
        studioPersistenceFilter === "none"
          ? "저장 출처 메타 없음 후보 관리 기준 정리"
          : "Studio 저장 방식 후보 관리 기준 정리",
      domain: candidate.prompt.domain || "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle:
        studioPersistenceFilter === "none"
          ? `저장 출처 메타 없음 후보 · ${candidate.title}`
          : `Studio 저장 방식 후보 · ${candidate.title}`,
      sourceHref: candidate.detailHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioPersistenceCandidateCopiedId("");
      setManualCopy({
        id: "studio-persistence-candidate-note",
        targetId: candidate.id,
        title:
          studioPersistenceFilter === "none"
            ? "저장 출처 메타 없음 후보 메모"
            : "Studio 저장 방식 후보 메모",
        body: rawInput,
      });
      return;
    }

    router.push(draftHref);
  }

  async function copyStudioOperationalGroupReport() {
    if (studioPersistenceFilter === "all" || studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const copiedToClipboard = await copyLibraryText({
      id: "studio-operational-group-report",
      title: "Studio 운영 묶음 리포트",
      body: buildStudioOperationalGroupReport({
        baseUrl: window.location.origin,
        filterHref,
        persistenceFilter: studioPersistenceFilter,
        resultPrompts: filtered,
        sourceFilter: studioSourceFilter,
      }),
    });

    setStudioOperationalGroupReportCopied(copiedToClipboard);
  }

  async function copyStudioOperationalGroupFilterLink() {
    if (studioPersistenceFilter === "all" || studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const linkText =
      formatAbsoluteInternalHref(filterHref, window.location.origin) ??
      filterHref;
    const copiedToClipboard = await copyLibraryText({
      id: "studio-operational-group-link",
      title: "Studio 운영 묶음 조건 링크",
      body: linkText,
    });

    setFilterLinkCopied(copiedToClipboard);
  }

  function openStudioOperationalGroupReportInStudio() {
    if (studioPersistenceFilter === "all" || studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const sourceTitle = `Studio 운영 묶음 · ${
      studioPersistenceFilterLabels[studioPersistenceFilter]
    } · ${getStudioSourceFilterLabel(studioSourceFilter)}`;
    const rawInput = buildStudioOperationalGroupReport({
      baseUrl: window.location.origin,
      filterHref,
      persistenceFilter: studioPersistenceFilter,
      resultPrompts: filtered,
      sourceFilter: studioSourceFilter,
    });

    const wroteDraft = writeStudioDraft({
      source: "library-studio-operational-group",
      rawInput,
      goal: "Studio 운영 묶음 기준 정리",
      domain: "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle,
      sourceHref: filterHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioOperationalGroupReportCopied(false);
      setManualCopy({
        id: "studio-operational-group-report",
        title: "Studio 운영 묶음 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-studio-operational-group");
  }

  async function copyStudioSourceFilterReport() {
    if (studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const copiedToClipboard = await copyLibraryText({
      id: "studio-source-report",
      title: "Studio 저장 출처 리포트",
      body: buildStudioSourceFilterReport({
        baseUrl: window.location.origin,
        filter: studioSourceFilter,
        filterHref,
        resultPrompts: filtered,
      }),
    });

    setStudioSourceReportCopied(copiedToClipboard);
  }

  async function copyStudioSourceFilterLink() {
    if (studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const linkText =
      formatAbsoluteInternalHref(filterHref, window.location.origin) ??
      filterHref;
    const copiedToClipboard = await copyLibraryText({
      id: "studio-source-link",
      title: "Studio 저장 출처 조건 링크",
      body: linkText,
    });

    setFilterLinkCopied(copiedToClipboard);
  }

  function openStudioSourceFilterReportInStudio() {
    if (studioSourceFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const sourceTitle = `Studio 저장 출처 · ${getStudioSourceFilterLabel(
      studioSourceFilter,
    )}`;
    const rawInput = buildStudioSourceFilterReport({
      baseUrl: window.location.origin,
      filter: studioSourceFilter,
      filterHref,
      resultPrompts: filtered,
    });

    const wroteDraft = writeStudioDraft({
      source: "library-studio-source-filter",
      rawInput,
      goal: "Studio 저장 출처 운영 기준 정리",
      domain: "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle,
      sourceHref: filterHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioSourceReportCopied(false);
      setManualCopy({
        id: "studio-source-report",
        title: "Studio 저장 출처 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-studio-source-filter");
  }

  async function copyStudioSourceCandidateNote(
    candidate: (typeof studioSourceActionCandidates)[number],
  ) {
    const copiedToClipboard = await copyLibraryText({
      id: "studio-source-candidate-note",
      targetId: candidate.id,
      title: "Studio 저장 출처 후보 메모",
      body: candidate.note,
    });

    setStudioSourceCandidateCopiedId(copiedToClipboard ? candidate.id : "");
  }

  function openStudioSourceCandidateInStudio(
    candidate: (typeof studioSourceActionCandidates)[number],
  ) {
    const rawInput = candidate.note;
    const wroteDraft = writeStudioDraft({
      source: "library-studio-source-candidate",
      rawInput,
      goal: "Studio 저장 출처 후보 관리 기준 정리",
      domain: candidate.prompt.domain || "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle: `Studio 저장 출처 후보 · ${candidate.title}`,
      sourceHref: candidate.detailHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setStudioSourceCandidateCopiedId("");
      setManualCopy({
        id: "studio-source-candidate-note",
        targetId: candidate.id,
        title: "Studio 저장 출처 후보 메모",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-studio-source-candidate");
  }

  async function copySourceReasonCandidateNote(
    candidate: (typeof sourceReasonActionCandidates)[number],
  ) {
    const copiedToClipboard = await copyLibraryText({
      id: "source-health-candidate-note",
      targetId: candidate.id,
      title: "출처 후보 메모",
      body: candidate.note,
    });

    setSourceHealthCandidateCopiedId(copiedToClipboard ? candidate.id : "");
  }

  async function copySourceReasonCandidateLink(
    candidate: (typeof sourceReasonActionCandidates)[number],
  ) {
    const linkText =
      formatAbsoluteInternalHref(candidate.detailHref, window.location.origin) ??
      candidate.detailHref;
    const copiedToClipboard = await copyLibraryText({
      id: "source-health-candidate-link",
      targetId: candidate.id,
      title: "출처 후보 상세 링크",
      body: linkText,
    });

    setSourceHealthCandidateLinkCopiedId(
      copiedToClipboard ? candidate.id : "",
    );
  }

  function openSourceReasonCandidateInStudio(
    candidate: (typeof sourceReasonActionCandidates)[number],
  ) {
    const rawInput = candidate.note;
    const wroteDraft = writeStudioDraft({
      source: "library-source-health-candidate",
      rawInput,
      goal: "개선 출처 후보 복원 계획",
      domain: candidate.prompt.domain || "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle: `출처 후보 · ${candidate.title}`,
      sourceHref: candidate.detailHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setSourceHealthCandidateCopiedId("");
      setManualCopy({
        id: "source-health-candidate-note",
        targetId: candidate.id,
        title: "출처 후보 메모",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-source-health-candidate");
  }

  function openSourceReasonFilterReportInStudio() {
    if (sourceReasonFilter === "all") {
      return;
    }

    const filterHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: "",
      version: undefined,
      detailMode: "current",
    });
    const sourceTitle = `출처 사유 조치 · ${sourceReasonFilterLabels[sourceReasonFilter]}`;
    const rawInput = buildSourceReasonFilterReport({
      baseUrl: window.location.origin,
      deletedPrompts,
      prompts,
      reason: sourceReasonFilter,
      resultPrompts: filtered,
      filterHref,
    });

    const wroteDraft = writeStudioDraft({
      source: "library-source-health-filter",
      rawInput,
      goal: "개선 출처 복원 계획",
      domain: "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle,
      sourceHref: filterHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setSourceHealthReportCopied(false);
      setManualCopy({
        id: "source-health-filter-report",
        title: "출처 사유 조치 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-source-health-filter");
  }

  async function copyDetailLink() {
    if (!selected || !activeVersion) {
      return;
    }

    const href = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: selected.id,
      version: activeVersion.targetModel,
      detailMode: activePromptDetailMode,
    });

    const linkText =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copiedToClipboard = await copyLibraryText({
      id: "detail-link",
      title: "상세 링크",
      body: linkText,
    });

    setDetailLinkCopied(copiedToClipboard);
  }

  async function copyImprovementBrief() {
    if (!selected || !activeVersion) {
      return;
    }

    const briefText = buildImprovementBrief({
      actions: improvementActions,
      prompt: selected,
      version: activeVersion,
    });
    const copiedToClipboard = await copyLibraryText({
      id: "improvement-brief",
      title: "개선 브리프",
      body: briefText,
    });

    setImprovementBriefCopied(copiedToClipboard);
  }

  async function copyMissingContextQuestions() {
    if (!selected || !activeVersion) {
      return;
    }

    const questionsText = buildMissingContextQuestionsText({
      prompt: selected,
      version: activeVersion,
    });
    const copiedToClipboard = await copyLibraryText({
      id: "missing-context",
      title: "보강 질문",
      body: questionsText,
    });

    setContextQuestionsCopied(copiedToClipboard);
    setContextQuestionsCopyFailed(!copiedToClipboard);
  }

  async function copyLearningContextReport() {
    if (!selected) {
      return;
    }

    const reportText = buildLearningContextReportText(selected);
    const copiedToClipboard = await copyLibraryText({
      id: "learning-report",
      title: "학습 컨텍스트 리포트",
      body: reportText,
    });

    setLearningContextReportCopiedFor(copiedToClipboard ? selected.id : "");
  }

  function openLearningContextReportInStudio() {
    if (!selected) {
      return;
    }

    const rawInput = buildLearningContextStudioDraftText({
      baseUrl: window.location.origin,
      detailHref: selectedDetailReturnHref,
      prompt: selected,
    });
    const wroteDraft = writeStudioDraft({
      source: "library-learning-context",
      rawInput,
      goal: "학습 컨텍스트 기반 프롬프트 재개선",
      domain: selected.domain || "운영",
      targetModels: activeVersion
        ? [activeVersion.targetModel]
        : selected.targetModels.length
          ? selected.targetModels
          : ["gpt"],
      outputLanguage: getOutputLanguage(selected),
      sourceTitle: `학습 컨텍스트 · ${selected.title}`,
      sourceHref: selectedDetailReturnHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setLearningContextReportCopiedFor("");
      setManualCopy({
        id: "learning-report",
        targetId: selected.id,
        title: "학습 컨텍스트 리포트",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-learning-context");
  }

  async function copyNoSourceMetaNote() {
    if (
      !selected ||
      selectedStudioSource ||
      !selectedStudioPersistenceLabel ||
      !selectedStudioPersistenceDescription
    ) {
      return;
    }

    const detailHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: selected.id,
      version: activeVersion?.targetModel,
      detailMode: activePromptDetailMode,
    });
    const noteText = buildNoSourceMetaNote({
      baseUrl: window.location.origin,
      detailHref,
      prompt: selected,
      sourceDescription: selectedStudioPersistenceDescription,
      sourceLabel: selectedStudioPersistenceLabel,
      version: activeVersion,
    });
    const copiedToClipboard = await copyLibraryText({
      id: "no-source-meta-note",
      targetId: selected.id,
      title: "저장 출처 없음 메모",
      body: noteText,
    });

    setNoSourceMetaNoteCopiedFor(copiedToClipboard ? selected.id : "");
  }

  function openNoSourceMetaNoteInStudio() {
    if (
      !selected ||
      selectedStudioSource ||
      !selectedStudioPersistenceLabel ||
      !selectedStudioPersistenceDescription
    ) {
      return;
    }

    const detailHref = buildLibraryFilterHref({
      search: query,
      sort: sortMode,
      language: languageFilter,
      output: outputLanguageFilter,
      model: targetModelFilter,
      engine: generationEngineFilter,
      learning: learningScopeFilter,
      improvement: improvementFilter,
      sourceReason: sourceReasonFilter,
      studioPersistence: studioPersistenceFilter,
      studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
      promptId: selected.id,
      version: activeVersion?.targetModel,
      detailMode: activePromptDetailMode,
    });
    const noteText = buildNoSourceMetaNote({
      baseUrl: window.location.origin,
      detailHref,
      prompt: selected,
      sourceDescription: selectedStudioPersistenceDescription,
      sourceLabel: selectedStudioPersistenceLabel,
      version: activeVersion,
    });

    const wroteDraft = writeStudioDraft({
      source: "library-no-source-meta",
      rawInput: noteText,
      goal: "저장 출처 메타 없음 저장본 운영 기준 정리",
      domain: selected.domain || "운영",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle: `저장 출처 메타 없음 · ${selected.title}`,
      sourceHref: detailHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setNoSourceMetaNoteCopiedFor("");
      setManualCopy({
        id: "no-source-meta-note",
        targetId: selected.id,
        title: "저장 출처 없음 메모",
        body: noteText,
      });
      return;
    }

    router.push("/studio?draft=library-no-source-meta");
  }

  async function copySelectedStudioPersistenceFilterLink() {
    if (!selected || !selectedStudioPersistenceFilterHref) {
      return;
    }

    const linkText =
      formatAbsoluteInternalHref(
        selectedStudioPersistenceFilterHref,
        window.location.origin,
      ) ?? selectedStudioPersistenceFilterHref;
    const copyBody = [
      linkText,
      "",
      `- 프롬프트: ${selected.title}`,
      selectedStudioPersistenceLabel
        ? `- 저장 방식: ${selectedStudioPersistenceLabel}`
        : undefined,
      selectedStudioSourceLabel
        ? `- 저장 출처: ${selectedStudioSourceLabel.label}`
        : undefined,
      selectedStudioSource?.sourceTitle
        ? `- 출처 제목: ${selectedStudioSource.sourceTitle}`
        : undefined,
      selectedOperationalSummary?.sourceVariantLabel
        ? `- 세부 초안 유형: ${selectedOperationalSummary.sourceVariantLabel}`
        : undefined,
      `- 조건: 같은 저장 방식`,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyLibraryText({
      id: "selected-studio-persistence-link",
      targetId: selected.id,
      title: "같은 저장 방식 조건 링크",
      body: copyBody,
    });

    setSelectedStudioPersistenceLinkCopiedFor(
      copiedToClipboard ? selected.id : "",
    );
  }

  async function copySelectedOperationalSummaryFilterLink({
    href,
    id,
    setCopiedFor,
    title,
    conditionLabel,
  }: {
    conditionLabel: string;
    href?: string;
    id: LibraryManualCopy["id"];
    setCopiedFor: (targetId: string) => void;
    title: string;
  }) {
    if (!selected || !href) {
      return;
    }

    const linkText =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copyBody = [
      linkText,
      "",
      `- 프롬프트: ${selected.title}`,
      selectedOperationalSummary
        ? `- 저장 방식: ${selectedOperationalSummary.persistenceLabel}`
        : undefined,
      selectedOperationalSummary
        ? `- 저장 출처: ${selectedOperationalSummary.sourceLabel}`
        : undefined,
      selectedOperationalSummary?.sourceTitle
        ? `- 출처 제목: ${selectedOperationalSummary.sourceTitle}`
        : undefined,
      selectedOperationalSummary?.sourceVariantLabel
        ? `- 세부 초안 유형: ${selectedOperationalSummary.sourceVariantLabel}`
        : undefined,
      `- 조건: ${conditionLabel}`,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyLibraryText({
      id,
      targetId: selected.id,
      title,
      body: copyBody,
    });

    setCopiedFor(copiedToClipboard ? selected.id : "");
  }

  async function copySelectedOperationalGroupFilterLink() {
    await copySelectedOperationalSummaryFilterLink({
      conditionLabel: selectedStudioSourceHasVariant
        ? "같은 세부 유형 운영 묶음"
        : "같은 운영 묶음",
      href: selectedStudioOperationalGroupHref,
      id: "selected-operational-group-link",
      setCopiedFor: setSelectedOperationalGroupLinkCopiedFor,
      title: selectedStudioOperationalGroupLinkTitle,
    });
  }

  async function copySelectedOperationalSourceFilterLink() {
    await copySelectedOperationalSummaryFilterLink({
      conditionLabel: selectedStudioSourceHasVariant
        ? "같은 세부 유형 출처"
        : "같은 저장 출처",
      href: selectedStudioSourceFilterHref,
      id: "selected-operational-source-link",
      setCopiedFor: setSelectedOperationalSourceLinkCopiedFor,
      title: selectedStudioSourceLinkTitle,
    });
  }

  async function copySelectedOperationalPersistenceFilterLink() {
    await copySelectedOperationalSummaryFilterLink({
      conditionLabel: "같은 저장 방식",
      href: selectedStudioPersistenceFilterHref,
      id: "selected-operational-persistence-link",
      setCopiedFor: setSelectedOperationalPersistenceLinkCopiedFor,
      title: "같은 저장 방식 조건 링크",
    });
  }

  async function copyListStudioFilterLink({
    bodyLines,
    href,
    id,
    promptId,
    setCopiedFor,
    title,
  }: {
    bodyLines?: string[];
    href?: string;
    id: LibraryManualCopy["id"];
    promptId: string;
    setCopiedFor: (targetId: string) => void;
    title: string;
  }) {
    if (!href) {
      return;
    }

    const linkText =
      formatAbsoluteInternalHref(href, window.location.origin) ?? href;
    const copyBody = bodyLines?.length
      ? [linkText, "", ...bodyLines].join("\n")
      : linkText;
    const copiedToClipboard = await copyLibraryText({
      id,
      targetId: promptId,
      title,
      body: copyBody,
    });

    setCopiedFor(copiedToClipboard ? promptId : "");
  }

  async function copySelectedStudioSourceFilterLink() {
    if (!selected || !selectedStudioSourceFilterHref) {
      return;
    }

    const linkText =
      formatAbsoluteInternalHref(
        selectedStudioSourceFilterHref,
        window.location.origin,
      ) ?? selectedStudioSourceFilterHref;
    const copyBody = [
      linkText,
      "",
      `- 프롬프트: ${selected.title}`,
      selectedStudioPersistenceLabel
        ? `- 저장 방식: ${selectedStudioPersistenceLabel}`
        : undefined,
      selectedStudioSourceLabel
        ? `- 저장 출처: ${selectedStudioSourceLabel.label}`
        : undefined,
      selectedStudioSource?.sourceTitle
        ? `- 출처 제목: ${selectedStudioSource.sourceTitle}`
        : undefined,
      selectedOperationalSummary?.sourceVariantLabel
        ? `- 세부 초안 유형: ${selectedOperationalSummary.sourceVariantLabel}`
        : undefined,
      `- 조건: ${
        selectedStudioSourceHasVariant ? "같은 세부 유형 출처" : "같은 저장 출처"
      }`,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyLibraryText({
      id: "selected-studio-source-link",
      targetId: selected.id,
      title: selectedStudioSourceLinkTitle,
      body: copyBody,
    });

    setSelectedStudioSourceLinkCopiedFor(copiedToClipboard ? selected.id : "");
  }

  async function copySelectedStudioSourceOriginalLink() {
    if (!selected || !selectedStudioSourceHref) {
      return;
    }

    const linkText =
      formatAbsoluteInternalHref(
        selectedStudioSourceHref,
        window.location.origin,
      ) ?? selectedStudioSourceHref;
    const copyBody = [
      linkText,
      "",
      `- 프롬프트: ${selected.title}`,
      selectedStudioSourceLabel
        ? `- 저장 출처: ${selectedStudioSourceLabel.label}`
        : undefined,
      selectedStudioSource?.sourceTitle
        ? `- 출처 제목: ${selectedStudioSource.sourceTitle}`
        : undefined,
      `- 원본 경로: ${selectedStudioSourceHref}`,
    ]
      .filter(Boolean)
      .join("\n");
    const copiedToClipboard = await copyLibraryText({
      id: "selected-studio-source-original-link",
      targetId: selected.id,
      title: "원본 경로 링크",
      body: copyBody,
    });

    setSelectedStudioSourceOriginalLinkCopiedFor(
      copiedToClipboard ? selected.id : "",
    );
  }

  async function copyComparisonBrief() {
    if (!selectedPromptComparisonBrief) {
      return;
    }

    const copiedToClipboard = await copyLibraryText({
      id: "comparison-brief",
      title: "비교 브리프",
      body: selectedPromptComparisonBrief,
    });

    setComparisonBriefCopied(copiedToClipboard);
  }

  function openImprovementInStudio() {
    if (!selected || !activeVersion) {
      return;
    }

    const rawInput = buildImprovementBrief({
      actions: improvementActions,
      prompt: selected,
      version: activeVersion,
    });
    const wroteDraft = writeStudioDraft({
      source: "library-improvement",
      rawInput,
      goal: "프롬프트 개선",
      domain: selected.domain,
      targetModels: [activeVersion.targetModel],
      outputLanguage: getOutputLanguage(selected),
      sourcePromptId: selected.id,
      sourceVersionId: activeVersion.id,
      sourceVersionModel: activeVersion.targetModel,
      sourceTitle: selected.title,
      sourceHref: buildLibraryFilterHref({
        search: query,
        sort: sortMode,
        language: languageFilter,
        output: outputLanguageFilter,
        model: targetModelFilter,
        engine: generationEngineFilter,
        learning: learningScopeFilter,
        improvement: improvementFilter,
        sourceReason: sourceReasonFilter,
        studioPersistence: studioPersistenceFilter,
        studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
        promptId: selected.id,
        version: activeVersion.targetModel,
        detailMode: activePromptDetailMode,
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setImprovementBriefCopied(false);
      setManualCopy({
        id: "improvement-brief",
        targetId: selected.id,
        title: "개선 브리프",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-improvement");
  }

  function openFeedbackImprovementInStudio(feedback: Feedback) {
    if (!selected) {
      return;
    }

    const feedbackVersion =
      selected.versions.find((version) => version.id === feedback.promptVersionId) ??
      activeVersion;

    if (!feedbackVersion) {
      return;
    }

    const rawInput = buildImprovementBrief({
      actions: getImprovementActions(feedbackVersion),
      feedback,
      prompt: selected,
      version: feedbackVersion,
    });
    const wroteDraft = writeStudioDraft({
      source: "library-improvement",
      sourceVariant: "feedback-improvement",
      rawInput,
      goal: "프롬프트 개선",
      domain: selected.domain,
      targetModels: [feedbackVersion.targetModel],
      outputLanguage: getOutputLanguage(selected),
      sourcePromptId: selected.id,
      sourceVersionId: feedbackVersion.id,
      sourceVersionModel: feedbackVersion.targetModel,
      sourceFeedback: {
        id: feedback.id,
        promptVersionId: feedback.promptVersionId,
        rating: feedback.rating,
        feedbackType: feedback.feedbackType,
        comment: feedback.comment,
        createdAt: feedback.createdAt,
      },
      sourceTitle: selected.title,
      sourceHref: buildLibraryFilterHref({
        search: query,
        sort: sortMode,
        language: languageFilter,
        output: outputLanguageFilter,
        model: targetModelFilter,
        engine: generationEngineFilter,
        learning: learningScopeFilter,
        improvement: improvementFilter,
        sourceReason: sourceReasonFilter,
        studioPersistence: studioPersistenceFilter,
        studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
        promptId: selected.id,
        version: feedbackVersion.targetModel,
        detailMode: activePromptDetailMode,
        focusTarget: "feedback",
        feedbackId: feedback.id,
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setManualCopy({
        id: "improvement-brief",
        targetId: feedback.id,
        title: "피드백 개선 브리프",
        body: rawInput,
      });
      return;
    }

    router.push("/studio?draft=library-improvement");
  }

  function openCompanyContextImprovementInStudio() {
    setCompanyUpdateNoticeVisible(false);
    openImprovementInStudio();
  }

  function openProfileContextImprovementInStudio() {
    setProfileUpdateNoticeVisible(false);
    openImprovementInStudio();
  }

  function openComparisonImprovementInStudio() {
    if (
      !selected ||
      !selectedImprovementQualityDelta ||
      !selectedPromptComparisonBrief
    ) {
      return;
    }

    const { improvedVersion } = selectedImprovementQualityDelta;

    const wroteDraft = writeStudioDraft({
      source: "library-improvement",
      rawInput: selectedPromptComparisonBrief,
      goal: "프롬프트 재개선",
      domain: selected.domain,
      targetModels: [improvedVersion.targetModel],
      outputLanguage: getOutputLanguage(selected),
      sourcePromptId: selected.id,
      sourceVersionId: improvedVersion.id,
      sourceVersionModel: improvedVersion.targetModel,
      sourceTitle: selected.title,
      sourceHref: buildLibraryFilterHref({
        search: query,
        sort: sortMode,
        language: languageFilter,
        output: outputLanguageFilter,
        model: targetModelFilter,
        engine: generationEngineFilter,
        learning: learningScopeFilter,
        improvement: improvementFilter,
        sourceReason: sourceReasonFilter,
        studioPersistence: studioPersistenceFilter,
        studioSource: studioSourceFilter,
      studioVariant: studioSourceVariantFilter,
        promptId: selected.id,
        version: improvedVersion.targetModel,
        detailMode: "comparison",
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setComparisonBriefCopied(false);
      setManualCopy({
        id: "comparison-brief",
        targetId: selected.id,
        title: "비교 브리프",
        body: selectedPromptComparisonBrief,
      });
      return;
    }

    router.push("/studio?draft=library-improvement");
  }

  function renderStudioVariantSummaryLinks(
    links: typeof studioSourceVariantSummaryLinks,
  ) {
    if (!links.length) {
      return null;
    }

    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs leading-5">
        <span className="font-semibold text-soft">세부 초안 유형</span>
        {links.map((variant) => (
          <span
            key={variant.sourceVariant}
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
              data-testid="library-studio-variant-filter-link-copy"
              className="font-semibold text-accent transition hover:text-soft"
              onClick={() => copyStudioVariantFilterLink(variant)}
            >
              {studioVariantLinkCopiedFor === variant.sourceVariant
                ? "복사됨"
                : manualCopy?.id === "studio-variant-link" &&
                    manualCopy.targetId === variant.sourceVariant
                  ? "실패"
                  : "복사"}
            </button>
          </span>
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="프롬프트 라이브러리"
        description="저장된 프롬프트를 검색하고, 언어 전략과 AI별 버전을 확인하며, 피드백을 학습 데이터로 축적합니다."
      />

      {companyUpdateNoticeVisible ? (
        <div className="mb-5 rounded-md border border-line bg-surface px-4 py-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-soft">
                회사 기준이 업데이트됐습니다.
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                현재 프롬프트를 Studio에서 개선하면 새 회사 맥락을 반영한
                버전을 만들 수 있습니다.
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
                onClick={openCompanyContextImprovementInStudio}
                disabled={!selected || !activeVersion}
              >
                Studio에서 회사 기준 반영
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
                현재 프롬프트를 Studio에서 개선하면 새 역할, 산업, 목표,
                선호 톤을 반영한 버전을 만들 수 있습니다.
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
                onClick={openProfileContextImprovementInStudio}
                disabled={!selected || !activeVersion}
              >
                Studio에서 개인 기준 반영
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-5">
        <ContextOperatingFlow
          badge={`${filtered.length}/${prompts.length} 저장본`}
          badgeHref="#library-results"
          description="검색 조건, 목록 결과, 선택 프롬프트의 운영 요약, 출처/이력 추적을 같은 순서로 확인합니다."
          items={libraryOperatingFlowItems}
          testId="library-operating-flow"
          title="Library 운영 흐름"
        />
      </div>

      {hasActiveFilters ? (
        <div className="mb-5 rounded-md border border-line bg-surface px-4 py-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-soft">현재 보기</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeFilterItems.map((item) => renderFilterChip(item))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <p className="font-mono text-sm text-accent">
                결과 {filtered.length}개
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={copyFilterLink}
                >
                  {filterLinkCopied
                    ? "링크 복사됨"
                    : manualCopy?.id === "filter-link"
                      ? "공유 링크 복사 실패"
                      : "공유 링크 복사"}
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={resetFilters}
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
          {manualCopy?.id === "filter-link" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {sourceReasonFilter !== "all" ? (
        <div
          data-testid="library-source-reason-action"
          className="mb-5 rounded-md border border-line bg-surface px-4 py-3"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-soft">
                출처 사유 조치
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {sourceReasonFilterLabels[sourceReasonFilter]} 기준으로 현재
                Library 결과 {filtered.length}개를 복원/백업 확인 리포트로
                정리합니다.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copySourceReasonFilterLink}
                data-testid="library-source-reason-action-link"
              >
                {filterLinkCopied
                  ? "출처 사유 링크 복사됨"
                  : manualCopy?.id === "source-health-filter-link"
                    ? "출처 사유 링크 복사 실패"
                    : "출처 사유 링크 복사"}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copySourceReasonFilterReport}
              >
                {sourceHealthReportCopied
                  ? "조치 리포트 복사됨"
                  : manualCopy?.id === "source-health-filter-report"
                    ? "조치 리포트 복사 실패"
                    : "조치 리포트 복사"}
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={openSourceReasonFilterReportInStudio}
              >
                Studio로 보내기
              </button>
            </div>
          </div>
          <div
            data-testid="library-source-reason-candidates"
            className="mt-3 rounded-md border border-line bg-panel px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-soft">대표 후보</p>
              <span className="font-mono text-[11px] text-muted">
                {sourceReasonActionCandidates.length}/{filtered.length}
              </span>
            </div>
            {sourceReasonActionCandidates.length ? (
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {sourceReasonActionCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-md border border-line bg-surface px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 min-w-0 break-words text-xs font-semibold text-soft">
                        {candidate.title}
                      </p>
                      <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] text-muted">
                        {candidate.sourceStatus}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 break-words text-[11px] text-muted">
                      원본 · {candidate.sourceTitle}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                      <Link
                        href={candidate.detailHref}
                        className={secondaryButtonClass}
                      >
                        보기
                      </Link>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => copySourceReasonCandidateLink(candidate)}
                        data-testid="library-source-reason-candidate-link"
                      >
                        {sourceHealthCandidateLinkCopiedId === candidate.id
                          ? "상세 링크 복사됨"
                          : manualCopy?.id ===
                                "source-health-candidate-link" &&
                              manualCopy.targetId === candidate.id
                            ? "상세 링크 복사 실패"
                            : "상세 링크 복사"}
                      </button>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => copySourceReasonCandidateNote(candidate)}
                      >
                        {sourceHealthCandidateCopiedId === candidate.id
                          ? "메모 복사됨"
                          : manualCopy?.id ===
                                "source-health-candidate-note" &&
                              manualCopy.targetId === candidate.id
                            ? "메모 복사 실패"
                            : "메모 복사"}
                      </button>
                      <button
                        type="button"
                        className={primaryButtonClass}
                        onClick={() =>
                          openSourceReasonCandidateInStudio(candidate)
                        }
                      >
                        Studio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-muted">
                현재 조건에 해당하는 대표 후보가 없습니다. Dashboard 또는
                백업 복원 후 다시 확인하세요.
              </p>
            )}
          </div>
          {manualCopy?.id === "source-health-filter-link" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "source-health-filter-report" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "source-health-candidate-note" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {studioPersistenceFilter !== "all" && studioSourceFilter !== "all" ? (
        <div
          data-testid="library-studio-operational-group-action"
          className="mb-5 rounded-md border border-line bg-surface px-4 py-3"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-soft">
                Studio 운영 묶음 조치
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {studioPersistenceFilterLabels[studioPersistenceFilter]} ·{" "}
                {getStudioSourceFilterLabel(studioSourceFilter)} 조건이 함께
                적용된 Library 결과 {filtered.length}개를 운영 묶음
                리포트로 정리합니다.
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">
                같은 기능 흐름과 같은 저장 방식이 모두 맞는 후보만 유지,
                재분류, 재개선 기준으로 점검합니다.
              </p>
              {renderStudioVariantSummaryLinks(studioSourceVariantSummaryLinks)}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioOperationalGroupFilterLink}
                data-testid="library-studio-operational-group-action-link"
              >
                {filterLinkCopied
                  ? "운영 묶음 링크 복사됨"
                  : manualCopy?.id === "studio-operational-group-link"
                    ? "운영 묶음 링크 복사 실패"
                    : "운영 묶음 링크 복사"}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioOperationalGroupReport}
                data-testid="library-studio-operational-group-action-copy"
              >
                {studioOperationalGroupReportCopied
                  ? "운영 묶음 리포트 복사됨"
                  : manualCopy?.id === "studio-operational-group-report"
                    ? "운영 묶음 리포트 복사 실패"
                    : "운영 묶음 리포트 복사"}
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={openStudioOperationalGroupReportInStudio}
                data-testid="library-studio-operational-group-action-studio"
              >
                Studio로 보내기
              </button>
            </div>
          </div>
          {manualCopy?.id === "studio-operational-group-link" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "studio-operational-group-report" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {studioPersistenceFilter !== "all" ? (
        <div
          data-testid="library-studio-persistence-action"
          className="mb-5 rounded-md border border-line bg-surface px-4 py-3"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-soft">
                {studioPersistenceFilter === "none"
                  ? "저장 출처 메타 없음 큐"
                  : "Studio 저장 방식 조치"}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {studioPersistenceFilter === "none"
                  ? `현재 Library 결과 ${filtered.length}개를 저장 출처 메타 없음 큐로 정리합니다.`
                  : `${studioPersistenceFilterLabels[studioPersistenceFilter]} 기준으로 현재 Library 결과 ${filtered.length}개를 저장 방식 리포트로 정리합니다.`}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">
                {studioPersistenceFilterDescriptions[studioPersistenceFilter]}
              </p>
              {renderStudioVariantSummaryLinks(
                studioPersistenceVariantSummaryLinks,
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioPersistenceFilterLink}
                data-testid="library-studio-persistence-action-link"
              >
                {filterLinkCopied
                  ? studioPersistenceFilter === "none"
                    ? "큐 링크 복사됨"
                    : "저장 방식 링크 복사됨"
                  : manualCopy?.id === "studio-persistence-link"
                    ? studioPersistenceFilter === "none"
                      ? "큐 링크 복사 실패"
                      : "저장 방식 링크 복사 실패"
                    : studioPersistenceFilter === "none"
                      ? "큐 링크 복사"
                      : "저장 방식 링크 복사"}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioPersistenceFilterReport}
                data-testid="library-studio-persistence-action-copy"
              >
                {studioPersistenceReportCopied
                  ? studioPersistenceFilter === "none"
                    ? "큐 리포트 복사됨"
                    : "저장 방식 리포트 복사됨"
                  : manualCopy?.id === "studio-persistence-report"
                    ? studioPersistenceFilter === "none"
                      ? "큐 리포트 복사 실패"
                      : "저장 방식 리포트 복사 실패"
                    : studioPersistenceFilter === "none"
                      ? "큐 리포트 복사"
                      : "저장 방식 리포트 복사"}
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={openStudioPersistenceFilterReportInStudio}
                data-testid="library-studio-persistence-action-studio"
              >
                Studio로 보내기
              </button>
            </div>
          </div>
          <div
            data-testid="library-studio-persistence-candidates"
            className="mt-3 rounded-md border border-line bg-panel px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-soft">대표 후보</p>
              <span className="font-mono text-[11px] text-muted">
                {studioPersistenceActionCandidates.length}/{filtered.length}
              </span>
            </div>
            {studioPersistenceActionCandidates.length ? (
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {studioPersistenceActionCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-md border border-line bg-surface px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 min-w-0 break-words text-xs font-semibold text-soft">
                        {candidate.title}
                      </p>
                      <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] text-muted">
                        {candidate.sourceLabel}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 break-words text-[11px] text-muted">
                      출처 · {candidate.sourceTitle}
                    </p>
                    {candidate.sourceVariantLabel ? (
                      <p className="mt-1 line-clamp-1 break-words text-[11px] text-soft">
                        세부 유형 · {candidate.sourceVariantLabel}
                      </p>
                    ) : null}
                    <p className="mt-1 line-clamp-2 break-words text-[11px] leading-4 text-muted">
                      {candidate.sourceDescription}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
                      <Link
                        href={candidate.detailHref}
                        className={secondaryButtonClass}
                      >
                        상세
                      </Link>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        data-testid="library-studio-persistence-candidate-copy"
                        onClick={() =>
                          copyStudioPersistenceCandidateNote(candidate)
                        }
                      >
                        {studioPersistenceCandidateCopiedId === candidate.id
                          ? studioPersistenceFilter === "none"
                            ? "후보 메모 복사됨"
                            : "메모 복사됨"
                          : manualCopy?.id ===
                                "studio-persistence-candidate-note" &&
                              manualCopy.targetId === candidate.id
                            ? studioPersistenceFilter === "none"
                              ? "후보 메모 복사 실패"
                              : "메모 복사 실패"
                            : studioPersistenceFilter === "none"
                              ? "후보 메모 복사"
                              : "메모 복사"}
                      </button>
                      <button
                        type="button"
                        className={primaryButtonClass}
                        data-testid="library-studio-persistence-candidate-studio"
                        onClick={() =>
                          openStudioPersistenceCandidateInStudio(candidate)
                        }
                      >
                        Studio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-muted">
                현재 조건에 해당하는 대표 후보가 없습니다.
              </p>
            )}
          </div>
          {manualCopy?.id === "studio-persistence-link" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "studio-persistence-report" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "studio-persistence-candidate-note" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {studioSourceFilter !== "all" ? (
        <div
          data-testid="library-studio-source-action"
          className="mb-5 rounded-md border border-line bg-surface px-4 py-3"
        >
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-soft">
                Studio 저장 출처 조치
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {getStudioSourceFilterLabel(studioSourceFilter)} 기준으로 현재
                Library 결과 {filtered.length}개를 저장 출처 리포트로
                정리합니다.
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">
                같은 기능 흐름에서 저장된 프롬프트를 묶어 출처 링크, 개선
                체인 여부, 운영 목적을 함께 점검합니다.
              </p>
              {renderStudioVariantSummaryLinks(studioSourceVariantSummaryLinks)}
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioSourceFilterLink}
                data-testid="library-studio-source-action-link"
              >
                {filterLinkCopied
                  ? "저장 출처 링크 복사됨"
                  : manualCopy?.id === "studio-source-link"
                    ? "저장 출처 링크 복사 실패"
                    : "저장 출처 링크 복사"}
              </button>
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={copyStudioSourceFilterReport}
                data-testid="library-studio-source-action-copy"
              >
                {studioSourceReportCopied
                  ? "저장 출처 리포트 복사됨"
                  : manualCopy?.id === "studio-source-report"
                    ? "저장 출처 리포트 복사 실패"
                    : "저장 출처 리포트 복사"}
              </button>
              <button
                type="button"
                className={primaryButtonClass}
                onClick={openStudioSourceFilterReportInStudio}
                data-testid="library-studio-source-action-studio"
              >
                Studio로 보내기
              </button>
            </div>
          </div>
          <div
            data-testid="library-studio-source-candidates"
            className="mt-3 rounded-md border border-line bg-panel px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-soft">대표 후보</p>
              <span className="font-mono text-[11px] text-muted">
                {studioSourceActionCandidates.length}/{filtered.length}
              </span>
            </div>
            {studioSourceActionCandidates.length ? (
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {studioSourceActionCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-md border border-line bg-surface px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 min-w-0 break-words text-xs font-semibold text-soft">
                        {candidate.title}
                      </p>
                      <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] text-muted">
                        {candidate.sourceLabel}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 break-words text-[11px] text-muted">
                      출처 · {candidate.sourceTitle}
                    </p>
                    {candidate.sourceVariantLabel ? (
                      <p className="mt-1 line-clamp-1 break-words text-[11px] text-soft">
                        세부 유형 · {candidate.sourceVariantLabel}
                      </p>
                    ) : null}
                    <div className="mt-3 grid gap-2 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
                      <Link
                        href={candidate.detailHref}
                        className={secondaryButtonClass}
                      >
                        상세
                      </Link>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        data-testid="library-studio-source-candidate-copy"
                        onClick={() => copyStudioSourceCandidateNote(candidate)}
                      >
                        {studioSourceCandidateCopiedId === candidate.id
                          ? "메모 복사됨"
                          : manualCopy?.id ===
                                "studio-source-candidate-note" &&
                              manualCopy.targetId === candidate.id
                            ? "메모 복사 실패"
                            : "메모 복사"}
                      </button>
                      <button
                        type="button"
                        className={primaryButtonClass}
                        data-testid="library-studio-source-candidate-studio"
                        onClick={() =>
                          openStudioSourceCandidateInStudio(candidate)
                        }
                      >
                        Studio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-muted">
                현재 조건에 해당하는 대표 후보가 없습니다.
              </p>
            )}
          </div>
          {manualCopy?.id === "studio-source-link" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "studio-source-report" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
          {manualCopy?.id === "studio-source-candidate-note" ? (
            <div className="mt-3">
              <LibraryManualCopyPanel
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {manualCopy?.id === "studio-variant-link" ? (
        <div className="mb-5">
          <LibraryManualCopyPanel
            copy={manualCopy}
            onClose={() => setManualCopy(null)}
          />
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[380px_1fr]">
	        <Panel id="library-filters">
	          <PanelHeader
	            title="목록"
	            description="언어 전략, 도메인, 목표, 원문으로 좁혀봅니다."
	          />
          {deletedPromptTitle ? (
            <div className="border-b border-line bg-surface px-4 py-3">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 break-words text-xs leading-5 text-muted">
                  프롬프트 삭제됨 · {deletedPromptTitle}
                  <span className="mt-1 block text-[11px] leading-4 text-muted">
                    최근 삭제 항목에서도 복원할 수 있습니다.
                  </span>
                </p>
                {deletedPromptRecoveryId ? (
                  <button
                    type="button"
                    className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-md border border-line bg-panel-strong px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent"
                    onClick={undoPromptDelete}
                  >
                    삭제 취소
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          {deletedPrompts.length ? (
            <div className="border-b border-line bg-surface px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-soft">
                    최근 삭제 항목
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    삭제한 프롬프트를 로컬 보관함에서 검색하고 복원할 수
                    있습니다.
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-muted">
                  {deletedPromptArchiveQuery.trim()
                    ? `${filteredDeletedPrompts.length}/${deletedPrompts.length}`
                    : deletedPrompts.length}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center justify-center rounded-md border border-line bg-panel-strong px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent"
                  onClick={toggleDeletedPromptArchive}
                >
                  {deletedPromptArchiveExpanded ? "접기" : "전체 보기"}
                </button>
                {deletedPromptArchiveExpanded ? (
                  <input
                    className={`${inputClass} min-h-8 flex-1 px-3 py-1.5 text-xs`}
                    value={deletedPromptArchiveQuery}
                    onChange={(event) =>
                      setDeletedPromptArchiveQuery(event.target.value)
                    }
                    placeholder="삭제 항목 검색"
                  />
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                {visibleDeletedPrompts.map((item) => (
                  <div
                    key={item.prompt.id}
                    className="rounded-md border border-line bg-panel px-3 py-2"
                  >
                    <p className="break-words text-xs font-semibold text-soft">
                      {item.prompt.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-muted">
                      삭제 {new Date(item.deletedAt).toLocaleString("ko-KR")}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        className="inline-flex min-h-8 w-full items-center justify-center rounded-md border border-line bg-panel-strong px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent"
                        onClick={() => restoreDeletedPrompt(item)}
                      >
                        복원
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-8 w-full items-center justify-center rounded-md border border-danger/40 bg-panel-strong px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-surface"
                        onClick={() => requestDeletedPromptRemove(item)}
                      >
                        보관함에서 제거
                      </button>
                    </div>
                    {deletedPromptRemoveCandidate?.prompt.id === item.prompt.id ? (
                      <div className="mt-3 rounded-md border border-danger/40 bg-surface px-3 py-3">
                        <p className="text-xs font-semibold text-danger">
                          보관함 제거 확인
                        </p>
                        <p className="mt-1 text-[11px] leading-4 text-muted">
                          이 항목은 최근 삭제 항목에서 완전히 제거되며 앱에서
                          복원할 수 없습니다.
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            className="inline-flex min-h-8 items-center justify-center rounded-md border border-line bg-panel-strong px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent"
                            onClick={cancelDeletedPromptRemove}
                          >
                            유지
                          </button>
                          <button
                            type="button"
                            className="inline-flex min-h-8 items-center justify-center rounded-md border border-danger/50 bg-panel-strong px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-surface"
                            onClick={confirmDeletedPromptRemove}
                          >
                            제거 확인
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
                {visibleDeletedPrompts.length === 0 ? (
                  <div className="rounded-md border border-line bg-panel px-3 py-3">
                    <p className="text-xs leading-5 text-muted">
                      검색 조건에 맞는 삭제 항목이 없습니다.
                    </p>
                  </div>
                ) : null}
              </div>
              {!deletedPromptArchiveExpanded && deletedPrompts.length > 3 ? (
                <p className="mt-2 text-[11px] leading-4 text-muted">
                  외 {deletedPrompts.length - 3}개는 전체 보기에서 복원할 수
                  있습니다.
                </p>
              ) : null}
            </div>
          ) : null}
	          <div className="space-y-3 border-b border-line p-4">
            <Field label="검색">
              <input
                className={inputClass}
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="검색어 입력"
              />
            </Field>
            <Field label="정렬">
              <select
                className={selectClass}
                value={sortMode}
                onChange={(event) =>
                  handleSortChange(event.target.value as LibrarySortMode)
                }
              >
                {librarySortModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {librarySortLabels[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="개선 상태">
              <select
                className={selectClass}
                value={improvementFilter}
                onChange={(event) =>
                  handleImprovementFilterChange(
                    event.target.value as ImprovementFilter,
                  )
                }
              >
                {improvementFilterModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {improvementFilterLabels[mode]}{" "}
                    {improvementFilterCounts[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="개선 출처 사유">
              <select
                className={selectClass}
                value={sourceReasonFilter}
                onChange={(event) =>
                  handleSourceReasonFilterChange(
                    event.target.value as SourceReasonFilter,
                  )
                }
              >
                {sourceReasonFilterModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {sourceReasonFilterLabels[mode]}{" "}
                    {sourceReasonFilterCounts[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Studio 저장 방식">
              <select
                className={selectClass}
                value={studioPersistenceFilter}
                onChange={(event) =>
                  handleStudioPersistenceFilterChange(
                    event.target.value as StudioPersistenceFilter,
                  )
                }
              >
                {studioPersistenceFilterModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {studioPersistenceFilterLabels[mode]}{" "}
                    {studioPersistenceFilterCounts[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Studio 저장 출처">
              <select
                className={selectClass}
                value={studioSourceFilter}
                onChange={(event) =>
                  handleStudioSourceFilterChange(
                    event.target.value as StudioSourceFilter,
                  )
                }
              >
                {studioSourceFilterModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {getStudioSourceFilterLabel(mode)}{" "}
                    {studioSourceFilterCounts[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="세부 초안 유형">
              <select
                className={selectClass}
                value={studioSourceVariantFilter}
                onChange={(event) =>
                  handleStudioSourceVariantFilterChange(
                    event.target.value as StudioSourceVariantFilter,
                  )
                }
              >
                {studioSourceVariantFilterModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {getStudioSourceVariantFilterLabel(mode)}{" "}
                    {studioSourceVariantFilterCounts[mode]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="언어 전략">
              <select
                className={selectClass}
                value={languageFilter}
                onChange={(event) => {
                  const nextLanguage = event.target.value as LanguageFilter;

                  setLanguageFilter(nextLanguage);
                  setSelectedId("");
                  setCopied(false);
                  setFilterLinkCopied(false);
                  setDetailLinkCopied(false);
                  setImprovementBriefCopied(false);
                  setComparisonBriefCopied(false);
                  setContextQuestionsCopied(false);
                  setPromptDetailMode("current");
                  syncFilterUrl({
                    language: nextLanguage,
                    promptId: "",
                    version: undefined,
                    detailMode: "current",
                  });
                }}
              >
                <option value="all">전체 {languageFilterCounts.all}</option>
                {languageStrategies.map((strategy) => (
                  <option key={strategy} value={strategy}>
                    {languageStrategyLabels[strategy]}{" "}
                    {languageFilterCounts[strategy]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="답변 언어">
              <select
                className={selectClass}
                value={outputLanguageFilter}
                onChange={(event) => {
                  const nextOutput = event.target.value as OutputLanguageFilter;

                  setOutputLanguageFilter(nextOutput);
                  setSelectedId("");
                  setCopied(false);
                  setFilterLinkCopied(false);
                  setDetailLinkCopied(false);
                  setImprovementBriefCopied(false);
                  setComparisonBriefCopied(false);
                  setContextQuestionsCopied(false);
                  setPromptDetailMode("current");
                  syncFilterUrl({
                    output: nextOutput,
                    promptId: "",
                    version: undefined,
                    detailMode: "current",
                  });
                }}
              >
                <option value="all">전체 {outputLanguageFilterCounts.all}</option>
                {outputLanguages.map((item) => (
                  <option key={item} value={item}>
                    {outputLanguageLabels[item]} {outputLanguageFilterCounts[item]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="대상 AI 도구">
              <select
                className={selectClass}
                value={targetModelFilter}
                onChange={(event) => {
                  const nextTargetModel = event.target.value as TargetModelFilter;

                  setTargetModelFilter(nextTargetModel);
                  setSelectedId("");
                  setActiveModel(
                    nextTargetModel === "all"
                      ? "gpt"
                      : nextTargetModel,
                  );
                  setCopied(false);
                  setFilterLinkCopied(false);
                  setDetailLinkCopied(false);
                  setImprovementBriefCopied(false);
                  setComparisonBriefCopied(false);
                  setContextQuestionsCopied(false);
                  setPromptDetailMode("current");
                  syncFilterUrl({
                    model: nextTargetModel,
                    promptId: "",
                    version: undefined,
                    detailMode: "current",
                  });
                }}
              >
                <option value="all">전체 {targetModelFilterCounts.all}</option>
                {targetModels.map((model) => (
                  <option key={model} value={model}>
                    {modelLabels[model]} {targetModelFilterCounts[model]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="생성 엔진">
              <select
                className={selectClass}
                value={generationEngineFilter}
                onChange={(event) => {
                  const nextEngine = event.target.value as GenerationEngineFilter;

                  setGenerationEngineFilter(nextEngine);
                  setSelectedId("");
                  setCopied(false);
                  setFilterLinkCopied(false);
                  setDetailLinkCopied(false);
                  setImprovementBriefCopied(false);
                  setComparisonBriefCopied(false);
                  setContextQuestionsCopied(false);
                  setPromptDetailMode("current");
                  syncFilterUrl({
                    engine: nextEngine,
                    promptId: "",
                    version: undefined,
                    detailMode: "current",
                  });
                }}
              >
                <option value="all">전체 {generationEngineFilterCounts.all}</option>
                {generationEngines.map((engine) => (
                  <option key={engine} value={engine}>
                    {generationEngineLabels[engine]}{" "}
                    {generationEngineFilterCounts[engine]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="학습 scope">
              <select
                className={selectClass}
                value={learningScopeFilter}
                onChange={(event) => {
                  const nextLearningScope = event.target.value as LearningScopeFilter;

                  setLearningScopeFilter(nextLearningScope);
                  setSelectedId("");
                  setCopied(false);
                  setFilterLinkCopied(false);
                  setDetailLinkCopied(false);
                  setImprovementBriefCopied(false);
                  setComparisonBriefCopied(false);
                  setContextQuestionsCopied(false);
                  setPromptDetailMode("current");
                  syncFilterUrl({
                    learning: nextLearningScope,
                    promptId: "",
                    version: undefined,
                    detailMode: "current",
                  });
                }}
              >
                <option value="all">전체 {learningScopeFilterCounts.all}</option>
                {learningScopeFilters.map((filter) => (
                  <option key={filter} value={filter}>
                    {learningScopeFilterLabels[filter]}{" "}
                    {learningScopeFilterCounts[filter]}
                  </option>
                ))}
              </select>
            </Field>
            {hasActiveFilters ? (
              <div className="rounded-md border border-line bg-surface px-3 py-3">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs font-semibold text-soft">적용 필터</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeFilterItems.map((item) => renderFilterChip(item))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={copyFilterLink}
                    >
                      {filterLinkCopied
                        ? "링크 복사됨"
                        : manualCopy?.id === "filter-link"
                          ? "공유 링크 복사 실패"
                          : "공유 링크 복사"}
                    </button>
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={resetFilters}
                    >
                      초기화
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div id="library-results" className="max-h-[720px] overflow-auto">
            {filtered.map((prompt) => {
              const best = getPromptBestQuality(prompt);
              const languageStrategy = getLanguageStrategy(prompt);
              const outputLanguage = getOutputLanguage(prompt);
	              const source = prompt.improvementSource
	                ? prompts.find(
	                    (item) => item.id === prompt.improvementSource?.sourcePromptId,
	                  )
	                : undefined;
	              const deletedSource = prompt.improvementSource?.sourcePromptId
	                ? deletedPrompts.find(
	                    (item) =>
	                      item.prompt.id === prompt.improvementSource?.sourcePromptId,
	                  )
	                : undefined;
	              const listSourcePrompt = source ?? deletedSource?.prompt;
              const improvementDepth = prompt.improvementSource
                ? getPromptImprovementDepth(prompt, prompts, deletedPrompts)
                : 0;
	              const qualityDelta = getImprovementQualityDelta({
	                improvementPrompt: prompt,
	                sourcePrompt: listSourcePrompt,
	              });
              const listSourceHealthIssueReason =
                getPromptSourceHealthIssueReason(
                  prompt,
                  prompts,
                  deletedPrompts,
                );
              const listStudioSourceLabel = prompt.studioSource
                ? getPromptStudioSourceMetaLibraryLabel(prompt.studioSource)
                : undefined;
              const listStudioSourcePersistence = prompt.studioSource
                ? getPromptStudioSourcePersistenceMeta(prompt.studioSource.source)
                : undefined;
              const listStudioPersistenceFilter =
                getPromptStudioPersistenceFilter(prompt);
              const listStudioPersistenceLabel =
                studioPersistenceFilterLabels[listStudioPersistenceFilter];
              const listStudioSourceFilterHref = prompt.studioSource
                ? buildLibraryFilterHref({
                    search: "",
                    sort: "recent",
                    language: "all",
                    output: "all",
                    model: "all",
                    engine: "all",
                    learning: "all",
                    improvement: "all",
                    sourceReason: "all",
                    studioPersistence: "all",
                    studioSource: prompt.studioSource.source,
                    studioVariant: prompt.studioSource.sourceVariant ?? "all",
                    detailMode: "current",
                  })
                : undefined;
              const listStudioSourceOriginalHref = getPromptStudioSourceHref(
                prompt.studioSource,
              );
              const listStudioSourceHasVariant = Boolean(
                prompt.studioSource?.sourceVariant,
              );
              const listStudioSourceCopyLabel = listStudioSourceHasVariant
                ? "세부 유형 링크"
                : "출처 링크";
              const listStudioSourceCopiedLabel = listStudioSourceHasVariant
                ? "세부 유형 링크 복사됨"
                : "출처 링크 복사됨";
              const listStudioSourceFailedLabel = listStudioSourceHasVariant
                ? "세부 유형 링크 실패"
                : "출처 링크 실패";
              const listStudioSourceOpenLabel = listStudioSourceHasVariant
                ? "같은 세부 유형 출처"
                : "같은 저장 출처";
              const listStudioSourceLinkTitle = listStudioSourceHasVariant
                ? "목록 같은 세부 유형 출처 조건 링크"
                : "목록 같은 저장 출처 조건 링크";
              const listStudioOperationalGroupCopyLabel =
                listStudioSourceHasVariant ? "세부 묶음 링크" : "묶음 링크";
              const listStudioOperationalGroupCopiedLabel =
                listStudioSourceHasVariant
                  ? "세부 묶음 링크 복사됨"
                  : "묶음 링크 복사됨";
              const listStudioOperationalGroupFailedLabel =
                listStudioSourceHasVariant
                  ? "세부 묶음 링크 실패"
                  : "묶음 링크 실패";
              const listStudioOperationalGroupOpenLabel =
                listStudioSourceHasVariant
                  ? "같은 세부 유형 묶음"
                  : "같은 운영 묶음";
              const listStudioOperationalGroupLinkTitle =
                listStudioSourceHasVariant
                  ? "목록 같은 세부 유형 운영 묶음 조건 링크"
                  : "목록 같은 운영 묶음 조건 링크";
              const listStudioPersistenceFilterHref = buildLibraryFilterHref({
                search: "",
                sort: "recent",
                language: "all",
                output: "all",
                model: "all",
                engine: "all",
                learning: "all",
                improvement: "all",
                sourceReason: "all",
                studioPersistence: listStudioPersistenceFilter,
                studioSource: "all",
                detailMode: "current",
              });
              const listStudioOperationalGroupHref = prompt.studioSource
                ? buildLibraryFilterHref({
                    search: "",
                    sort: "recent",
                    language: "all",
                    output: "all",
                    model: "all",
                    engine: "all",
                    learning: "all",
                    improvement: "all",
                    sourceReason: "all",
                    studioPersistence: listStudioPersistenceFilter,
                    studioSource: prompt.studioSource.source,
                    studioVariant: prompt.studioSource.sourceVariant ?? "all",
                    detailMode: "current",
                  })
                : undefined;

              return (
                <div
                  key={prompt.id}
                  className={`border-b border-line transition ${
                    selected?.id === prompt.id
                      ? "bg-panel-strong"
                      : "hover:bg-surface"
                  }`}
                >
                  <button
                    type="button"
                    className="block w-full px-4 py-4 text-left"
                    onClick={() => handlePromptSelect(prompt)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="line-clamp-2 min-w-0 break-words text-sm font-semibold leading-5">
                            {prompt.title}
                          </p>
                          {prompt.improvementSource ? (
                            <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                              {formatPromptImprovementDepth(improvementDepth)}
                            </span>
                          ) : null}
                          {listSourceHealthIssueReason ? (
                            <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                              {
                                sourceReasonFilterLabels[
                                  listSourceHealthIssueReason
                                ]
                              }
                            </span>
                          ) : null}
                          <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                            {generationEngineLabels[prompt.source]}
                          </span>
                          <span
                            className={`shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] font-semibold ${
                              listStudioSourcePersistence
                                ? "bg-panel text-accent"
                                : "bg-surface text-muted"
                            }`}
                          >
                            {listStudioPersistenceLabel}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-sm text-accent">
                        {best.toFixed(1)}
                      </span>
                    </div>
                    {prompt.improvementSource ? (
                      <p className="mt-2 line-clamp-1 break-words text-xs text-muted">
                        원본 · {prompt.improvementSource.sourcePromptTitle}
                        {deletedSource && !source ? " · 삭제 보관함" : ""}
                        {listSourceHealthIssueReason
                          ? ` · ${sourceReasonFilterLabels[listSourceHealthIssueReason]}`
                          : ""}
                      </p>
                    ) : null}
                    {prompt.studioSource && listStudioSourceLabel ? (
                      <p className="mt-2 line-clamp-1 break-words text-xs text-muted">
                        Studio 저장 출처 · {listStudioSourceLabel.label}
                        {prompt.studioSource.sourceTitle
                          ? ` · ${prompt.studioSource.sourceTitle}`
                          : ""}
                      </p>
                    ) : null}
                    {qualityDelta ? (
                      <p
                        className={`mt-2 text-xs font-semibold ${
                          qualityDelta.delta >= 0
                            ? "text-accent"
                            : "text-muted"
                        }`}
                      >
                        개선 효과 {formatQualityDelta(qualityDelta.delta)} · 원본{" "}
                        {qualityDelta.sourceScore.toFixed(1)} → 개선{" "}
                        {qualityDelta.improvedScore.toFixed(1)}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-muted">
                      {prompt.domain} ·{" "}
                      {languageStrategyLabels[languageStrategy]} · 답변{" "}
                      {outputLanguageLabels[outputLanguage]} ·{" "}
                      {formatTargetModels(prompt.targetModels)} · 피드백{" "}
                      {prompt.feedback.length}개 ·{" "}
                      {generationEngineLabels[prompt.source]}
                      {prompt.modelUsed ? ` ${prompt.modelUsed}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft">
                        학습 · {formatEnabledMemoryScopes(prompt)}
                      </span>
                      <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-[11px] text-muted">
                        {formatLearningContextCount(prompt)}
                      </span>
                    </div>
                  </button>
                  {prompt.studioSource || listStudioPersistenceFilterHref ? (
                    <div className="-mt-2 flex flex-wrap gap-2 px-4 pb-4">
                      {prompt.studioSource &&
                      listStudioSourceLabel &&
                      listStudioSourceFilterHref ? (
                        <>
                          <button
                            type="button"
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            onClick={() =>
                              copyListStudioFilterLink({
                                href: listStudioSourceFilterHref,
                                id: "list-studio-source-link",
                                promptId: prompt.id,
                                setCopiedFor: setListStudioSourceLinkCopiedFor,
                                title: listStudioSourceLinkTitle,
                              })
                            }
                            data-testid={`library-list-studio-source-link-copy-${prompt.id}`}
                          >
                            {listStudioSourceLinkCopiedFor === prompt.id
                              ? listStudioSourceCopiedLabel
                              : manualCopy?.id === "list-studio-source-link" &&
                                  manualCopy.targetId === prompt.id
                                ? listStudioSourceFailedLabel
                                : listStudioSourceCopyLabel}
                          </button>
                          <a
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            href={listStudioSourceFilterHref}
                          >
                            {listStudioSourceOpenLabel}
                          </a>
                        </>
                      ) : null}
                      {prompt.studioSource &&
                      listStudioSourceLabel &&
                      listStudioSourceOriginalHref ? (
                        <>
                          <button
                            type="button"
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            onClick={() =>
                              copyListStudioFilterLink({
                                bodyLines: [
                                  `- 프롬프트: ${prompt.title}`,
                                  `- 저장 출처: ${listStudioSourceLabel.label}`,
                                  prompt.studioSource?.sourceTitle
                                    ? `- 출처 제목: ${prompt.studioSource.sourceTitle}`
                                    : "",
                                  `- 원본 경로: ${listStudioSourceOriginalHref}`,
                                ].filter(Boolean),
                                href: listStudioSourceOriginalHref,
                                id: "list-studio-source-original-link",
                                promptId: prompt.id,
                                setCopiedFor:
                                  setListStudioSourceOriginalLinkCopiedFor,
                                title: "목록 원본 경로 링크",
                              })
                            }
                            data-testid={`library-list-studio-source-original-link-copy-${prompt.id}`}
                          >
                            {listStudioSourceOriginalLinkCopiedFor === prompt.id
                              ? "원본 링크 복사됨"
                              : manualCopy?.id ===
                                    "list-studio-source-original-link" &&
                                  manualCopy.targetId === prompt.id
                                ? "원본 링크 실패"
                                : "원본 링크"}
                          </button>
                          <a
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            href={listStudioSourceOriginalHref}
                          >
                            {listStudioSourceLabel.actionLabel}
                          </a>
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                        onClick={() =>
                          copyListStudioFilterLink({
                            href: listStudioPersistenceFilterHref,
                            id: "list-studio-persistence-link",
                            promptId: prompt.id,
                            setCopiedFor:
                              setListStudioPersistenceLinkCopiedFor,
                            title: "목록 같은 저장 방식 조건 링크",
                          })
                        }
                        data-testid={`library-list-studio-persistence-link-copy-${prompt.id}`}
                      >
                        {listStudioPersistenceLinkCopiedFor === prompt.id
                          ? "저장 링크 복사됨"
                          : manualCopy?.id ===
                                "list-studio-persistence-link" &&
                              manualCopy.targetId === prompt.id
                            ? "저장 링크 실패"
                            : "저장 링크"}
                      </button>
                      <a
                        className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                        href={listStudioPersistenceFilterHref}
                      >
                        같은 저장 방식
                      </a>
                      {listStudioOperationalGroupHref ? (
                        <>
                          <button
                            type="button"
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            onClick={() =>
                              copyListStudioFilterLink({
                                href: listStudioOperationalGroupHref,
                                id: "list-studio-operational-group-link",
                                promptId: prompt.id,
                                setCopiedFor:
                                  setListStudioOperationalGroupLinkCopiedFor,
                                title: listStudioOperationalGroupLinkTitle,
                              })
                            }
                            data-testid={`library-list-studio-operational-group-link-copy-${prompt.id}`}
                          >
                            {listStudioOperationalGroupLinkCopiedFor ===
                            prompt.id
                              ? listStudioOperationalGroupCopiedLabel
                              : manualCopy?.id ===
                                    "list-studio-operational-group-link" &&
                                  manualCopy.targetId === prompt.id
                                ? listStudioOperationalGroupFailedLabel
                                : listStudioOperationalGroupCopyLabel}
                          </button>
                          <a
                            className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-soft transition hover:border-accent hover:text-accent"
                            href={listStudioOperationalGroupHref}
                          >
                            {listStudioOperationalGroupOpenLabel}
                          </a>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  {manualCopy?.targetId === prompt.id &&
                  (manualCopy.id === "list-studio-source-link" ||
                    manualCopy.id === "list-studio-source-original-link" ||
                    manualCopy.id === "list-studio-persistence-link" ||
                    manualCopy.id ===
                      "list-studio-operational-group-link") ? (
                    <div className="px-4 pb-4">
                      <LibraryManualCopyPanel
                        copy={manualCopy}
                        onClose={() => setManualCopy(null)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}

            {filtered.length === 0 ? (
              <div className="px-4 py-12">
                {sourceReasonFilter !== "all" ? (
                  <div className="rounded-md border border-line bg-surface px-4 py-4">
                    <p className="text-sm font-semibold text-soft">
                      {sourceReasonFilterLabels[sourceReasonFilter]} 개선본이
                      없습니다.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      해당 출처 사유에 해당하는 개선본이 생기면 이 필터에
                      표시됩니다. Dashboard의 출처 상태를 다시 확인하거나
                      원본 복원, 백업 가져오기 후 재검토할 수 있습니다.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={resetFilters}
                      >
                        필터 초기화
                      </button>
                    </div>
                  </div>
                ) : improvementFilter === "archived-source" ? (
                  <div className="rounded-md border border-line bg-surface px-4 py-4">
                    <p className="text-sm font-semibold text-soft">
                      보관함 원본 개선본이 없습니다.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      삭제된 원본을 참조하는 개선본이 생기면 이 필터에
                      표시됩니다. 원본을 복원하면 개선 출처와 점수 비교가 일반
                      개선 기록으로 다시 연결됩니다.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      {deletedPrompts.length ? (
                        <button
                          type="button"
                          className={secondaryButtonClass}
                          onClick={openDeletedPromptArchive}
                        >
                          최근 삭제 항목 열기
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={resetFilters}
                      >
                        필터 초기화
                      </button>
                    </div>
                  </div>
                ) : improvementFilter === "unmeasured" ? (
                  <div className="rounded-md border border-line bg-surface px-4 py-4">
                    <p className="text-sm font-semibold text-soft">
                      측정 불가 개선본이 없습니다.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      개선 출처가 있지만 원본이 Library와 삭제 보관함 어디에도
                      없으면 이 필터에 표시됩니다. 백업을 가져오거나 원본을 다시
                      저장하면 개선 효과를 계산할 수 있습니다.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={resetFilters}
                      >
                        필터 초기화
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted">검색 결과가 없습니다.</div>
                )}
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel id="library-detail-workspace" className="min-h-[720px]">
          {selected && activeVersion ? (
            <>
              <PanelHeader
                title={selected.title}
                description={`${selected.domain} · ${selected.goal} · ${
                  languageStrategyLabels[getLanguageStrategy(selected)]
                } · 답변 ${outputLanguageLabels[getOutputLanguage(selected)]}`}
              />

              <div className="grid min-h-[640px] min-w-0 gap-0 xl:grid-cols-[1fr_300px]">
                <div className="min-w-0 border-b border-line xl:border-b-0 xl:border-r">
                  <div className="flex gap-1 overflow-x-auto border-b border-line px-4 py-3">
                    {selected.versions.map((version) => (
                      <button
                        key={version.id}
                        type="button"
                        className={`shrink-0 rounded-md px-3 py-2 text-sm transition ${
                          activeVersion.targetModel === version.targetModel
                            ? "bg-panel-strong text-foreground"
                            : "text-muted hover:bg-surface hover:text-foreground"
                        }`}
                        onClick={() => {
                          handleVersionChange(version.targetModel);
                        }}
                      >
                        {modelLabels[version.targetModel]}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-soft">
                          프롬프트 본문
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {activePromptDetailMode === "comparison"
                            ? "원본과 개선본의 지시문을 함께 확인합니다."
                            : `${modelLabels[activeVersion.targetModel]} 버전 기준`}
                        </p>
                      </div>
                      {selectedImprovementQualityDelta ? (
                        <div
                          className="inline-flex w-full rounded-md border border-line bg-surface p-1 sm:w-auto"
                          aria-label="프롬프트 본문 보기 모드"
                        >
                          {(
                            [
                              ["current", "현재 버전"],
                              ["comparison", "원본 비교"],
                            ] as const
                          ).map(([mode, label]) => (
                            <button
                              key={mode}
                              type="button"
                              className={`min-h-9 flex-1 rounded px-3 py-1.5 text-sm font-semibold transition sm:flex-none ${
                                activePromptDetailMode === mode
                                  ? "bg-panel-strong text-foreground"
                                  : "text-muted hover:text-foreground"
                              }`}
                              onClick={() =>
                                handlePromptDetailModeChange(mode)
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {activePromptDetailMode === "comparison" &&
                    selectedImprovementQualityDelta ? (
                      <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
                        <div className="min-w-0 overflow-hidden rounded-md border border-line bg-surface">
                          <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-xs text-muted">원본</p>
                              <p className="mt-1 truncate text-sm font-semibold text-soft">
                                {modelLabels[
                                  selectedImprovementQualityDelta.sourceVersion
                                    .targetModel
                                ]}
                              </p>
                            </div>
                            <span className="font-mono text-sm text-muted">
                              {selectedImprovementQualityDelta.sourceScore.toFixed(
                                1,
                              )}
                            </span>
                          </div>
                          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap p-4 font-mono text-[13px] leading-6 text-soft">
                            {
                              selectedImprovementQualityDelta.sourceVersion
                                .content
                            }
                          </pre>
                        </div>

                        <div className="min-w-0 overflow-hidden rounded-md border border-line bg-surface">
                          <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-xs text-muted">개선본</p>
                              <p className="mt-1 truncate text-sm font-semibold text-soft">
                                {modelLabels[
                                  selectedImprovementQualityDelta
                                    .improvedVersion.targetModel
                                ]}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm text-accent">
                                {selectedImprovementQualityDelta.improvedScore.toFixed(
                                  1,
                                )}
                              </p>
                              <p
                                className={`mt-1 font-mono text-xs ${
                                  selectedImprovementQualityDelta.delta >= 0
                                    ? "text-accent"
                                    : "text-muted"
                                }`}
                              >
                                {formatQualityDelta(
                                  selectedImprovementQualityDelta.delta,
                                )}
                              </p>
                            </div>
                          </div>
                          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap p-4 font-mono text-[13px] leading-6 text-soft">
                            {
                              selectedImprovementQualityDelta.improvedVersion
                                .content
                            }
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-md border border-line bg-surface p-4 font-mono text-[13px] leading-6 text-soft">
                        {activeVersion.content}
                      </pre>
                    )}

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <button
                        className={secondaryButtonClass}
                        type="button"
                        onClick={() => copyPrompt()}
                      >
                        {copied
                          ? "복사됨"
                          : manualCopy?.id === "prompt"
                            ? "현재 버전 복사 실패"
                            : "현재 버전 복사"}
                      </button>
                      <button
                        className={secondaryButtonClass}
                        type="button"
                        onClick={copyTargetAiHandoffPackage}
                      >
                        {targetAiPackageCopiedKey ===
                        activeTargetAiPackageCopyKey
                          ? "전달 패키지 복사됨"
                          : manualCopy?.id === "target-ai-package" &&
                              manualCopy.targetId ===
                                activeTargetAiPackageCopyKey
                            ? "전달 패키지 복사 실패"
                            : "AI 전달 패키지 복사"}
                      </button>
                      <button
                        aria-expanded={targetAiPackagePreviewOpen}
                        className={secondaryButtonClass}
                        type="button"
                        onClick={() =>
                          setTargetAiPackagePreviewOpen((current) => !current)
                        }
                      >
                        {targetAiPackagePreviewOpen
                          ? "패키지 닫기"
                          : "AI 전달 패키지 보기"}
                      </button>
                      <button
                        className={secondaryButtonClass}
                        type="button"
                        onClick={copyDetailLink}
                      >
                        {detailLinkCopied
                          ? "상세 링크 복사됨"
                          : manualCopy?.id === "detail-link"
                            ? "상세 링크 복사 실패"
                            : "상세 링크 복사"}
                      </button>
                      {activePromptDetailMode === "comparison" &&
                      selectedPromptComparisonBrief ? (
                        <>
                          <button
                            className={secondaryButtonClass}
                            type="button"
                            onClick={copyComparisonBrief}
                          >
                            {comparisonBriefCopied
                              ? "비교 브리프 복사됨"
                              : manualCopy?.id === "comparison-brief"
                                ? "비교 브리프 복사 실패"
                                : "비교 브리프 복사"}
                          </button>
                          <button
                            className={primaryButtonClass}
                            type="button"
                            onClick={openComparisonImprovementInStudio}
                          >
                            Studio에서 재개선
	                          </button>
	                        </>
	                      ) : null}
	                      <button
	                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-danger/50 bg-panel-strong px-4 py-2 text-sm font-semibold text-danger transition hover:bg-surface"
	                        type="button"
	                        onClick={requestSelectedPromptDelete}
	                      >
	                        프롬프트 삭제
	                      </button>
	                    </div>
                    {targetAiPackagePreviewOpen ? (
                      <TargetAiHandoffPreviewPanel
                        handoffPackageText={activeTargetAiHandoffPackageText}
                        improvementBriefButtonLabel={
                          targetAiImprovementBriefCopiedKey ===
                          activeTargetAiPackageCopyKey
                            ? "보강 브리프 복사됨"
                            : manualCopy?.id ===
                                  "target-ai-improvement-brief" &&
                                manualCopy.targetId ===
                                  activeTargetAiPackageCopyKey
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
                          openTargetAiHandoffImprovementInStudio
                        }
                        onPreviewModeChange={setTargetAiPackagePreviewMode}
                        openImprovementButtonLabel="Studio에서 보강"
                        packageButtonLabel={
                          targetAiPackageCopiedKey ===
                          activeTargetAiPackageCopyKey
                            ? "전달 패키지 복사됨"
                            : manualCopy?.id === "target-ai-package" &&
                                manualCopy.targetId ===
                                  activeTargetAiPackageCopyKey
                              ? "전달 패키지 복사 실패"
                              : "패키지 복사"
                        }
                        previewMode={targetAiPackagePreviewMode}
                        previewModeName="library-target-ai-handoff-preview-mode"
                        qualityScore={activeVersion.qualityScore}
                        readinessItems={activeTargetAiHandoffReadinessItems}
                        runPromptText={activeVersion.content}
                        runPromptButtonLabel={
                          copied
                            ? "실행 프롬프트 복사됨"
                            : manualCopy?.id === "prompt"
                              ? "실행 프롬프트 복사 실패"
                              : "실행 프롬프트 복사"
                        }
                      />
                    ) : null}
	                    {deletePromptCandidate ? (
	                      <div className="mt-4 rounded-md border border-danger/40 bg-surface px-4 py-3">
	                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
	                          <div className="min-w-0">
	                            <p className="text-sm font-semibold text-danger">
	                              삭제 확인
	                            </p>
	                            <p className="mt-1 break-words text-sm font-semibold text-soft">
	                              {deletePromptCandidate.title}
	                            </p>
	                            <p className="mt-2 text-xs leading-5 text-muted">
	                              저장 버전 {deletePromptCandidate.versions.length}개 ·
	                              저장 피드백 {deletePromptCandidate.feedback.length}개 ·
	                              연결 개선본{" "}
	                              {getLinkedImprovementPromptCount(deletePromptCandidate)}
	                              개
	                            </p>
	                            <p className="mt-2 text-xs leading-5 text-danger">
                              확인하면 이 프롬프트와 피드백이 현재 워크스페이스
                              Library에서 제거됩니다. 삭제 후에는 목록 상단의 최근
                              삭제 항목에서 복원할 수 있습니다.
	                            </p>
	                          </div>
	                          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
	                            <button
	                              type="button"
	                              className={secondaryButtonClass}
	                              onClick={cancelPromptDelete}
	                            >
	                              삭제 안 함
	                            </button>
	                            <button
	                              type="button"
	                              className="inline-flex min-h-10 items-center justify-center rounded-md border border-danger/50 bg-panel-strong px-4 py-2 text-sm font-semibold text-danger transition hover:bg-surface"
	                              onClick={confirmPromptDelete}
	                            >
	                              삭제 확인
	                            </button>
	                          </div>
	                        </div>
	                      </div>
	                    ) : null}
	                    {manualCopy?.id === "prompt" ||
                    (manualCopy?.id === "target-ai-package" &&
                      manualCopy.targetId === activeTargetAiPackageCopyKey) ||
                    manualCopy?.id === "detail-link" ||
                    manualCopy?.id === "comparison-brief" ? (
                      <div className="mt-4">
                        <LibraryManualCopyPanel
                          copy={manualCopy}
                          onClose={() => setManualCopy(null)}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <aside className="space-y-5 p-5">
                  {selectedOperationalSummary ? (
                    <div
                      id="library-selected-operational-summary"
                      className="rounded-md border border-line bg-surface px-4 py-3"
                      data-testid="library-selected-operational-summary"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-muted">운영 상태</p>
                          <p className="mt-1 break-words text-sm font-semibold text-soft">
                            {selectedOperationalSummary.nextAction}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-semibold text-accent">
                            {selectedOperationalSummary.handoffStatusLabel}
                          </span>
                          <button
                            type="button"
                            className={
                              selectedOperationalSummary.actionKind ===
                              "handoff-improve"
                                ? `${primaryButtonClass} min-h-8 whitespace-nowrap px-3 py-1.5 text-xs`
                                : `${secondaryButtonClass} min-h-8 whitespace-nowrap px-3 py-1.5 text-xs`
                            }
                            onClick={runSelectedOperationalSummaryAction}
                          >
                            {selectedOperationalSummary.actionLabel}
                          </button>
                          <button
                            type="button"
                            className={`${secondaryButtonClass} min-h-8 whitespace-nowrap px-3 py-1.5 text-xs`}
                            onClick={copySelectedOperationalSummaryReport}
                            data-testid="library-selected-operational-summary-report-copy"
                          >
                            {selectedOperationalSummaryReportCopiedFor ===
                            selected.id
                              ? "운영 요약 복사됨"
                              : manualCopy?.id ===
                                    "selected-operational-summary-report" &&
                                  manualCopy.targetId === selected.id
                                ? "운영 요약 복사 실패"
                                : "운영 요약 복사"}
                          </button>
                          <button
                            type="button"
                            className={`${primaryButtonClass} min-h-8 whitespace-nowrap px-3 py-1.5 text-xs`}
                            onClick={openSelectedOperationalSummaryReportInStudio}
                            data-testid="library-selected-operational-summary-studio"
                          >
                            요약 Studio로
                          </button>
                        </div>
                      </div>

                      <div
                        className="mt-3 grid gap-2 md:grid-cols-3"
                        data-testid="library-selected-operational-workflow"
                      >
                        {selectedOperationalWorkflowSteps.map((step) => (
                          <div
                            key={step.step}
                            className="min-w-0 rounded-md border border-line bg-panel px-3 py-2"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0 rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
                                {step.step}
                              </span>
                              <p className="break-words text-[11px] font-semibold text-soft">
                                {step.label}
                              </p>
                            </div>
                            <p className="mt-2 break-words text-xs font-semibold text-soft">
                              {step.title}
                            </p>
                            <p className="mt-1 break-words text-[11px] leading-4 text-muted">
                              {step.detail}
                            </p>
                          </div>
                        ))}
                      </div>

                      {selectedOperationalSummary.groupActionHref ||
                      selectedOperationalSummary.sourceActionHref ||
                      selectedOperationalSummary.persistenceActionHref ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {selectedOperationalSummary.groupActionHref &&
                          selectedOperationalSummary.groupActionLabel ? (
                            <>
                              <button
                                type="button"
                                className={`${secondaryButtonClass} w-full`}
                                onClick={
                                  copySelectedOperationalGroupFilterLink
                                }
                                data-testid="library-selected-operational-group-link-copy"
                              >
                                {selectedOperationalGroupLinkCopiedFor ===
                                selected.id
                                  ? selectedStudioOperationalGroupLinkCopiedLabel
                                  : manualCopy?.id ===
                                        "selected-operational-group-link" &&
                                      manualCopy.targetId === selected.id
                                    ? selectedStudioOperationalGroupLinkFailedLabel
                                    : selectedStudioOperationalGroupLinkCopyLabel}
                              </button>
                              <a
                                className={`${secondaryButtonClass} w-full`}
                                href={selectedOperationalSummary.groupActionHref}
                              >
                                {selectedOperationalSummary.groupActionLabel}
                              </a>
                            </>
                          ) : null}
                          {selectedOperationalSummary.sourceActionHref &&
                          selectedOperationalSummary.sourceActionLabel ? (
                            <>
                              <button
                                type="button"
                                className={`${secondaryButtonClass} w-full`}
                                onClick={
                                  copySelectedOperationalSourceFilterLink
                                }
                                data-testid="library-selected-operational-source-link-copy"
                              >
                                {selectedOperationalSourceLinkCopiedFor ===
                                selected.id
                                  ? selectedStudioSourceLinkCopiedLabel
                                  : manualCopy?.id ===
                                        "selected-operational-source-link" &&
                                      manualCopy.targetId === selected.id
                                    ? selectedStudioSourceLinkFailedLabel
                                    : selectedStudioSourceLinkCopyLabel}
                              </button>
                              <a
                                className={`${secondaryButtonClass} w-full`}
                                href={selectedOperationalSummary.sourceActionHref}
                              >
                                {selectedOperationalSummary.sourceActionLabel}
                              </a>
                            </>
                          ) : null}
                          {selectedOperationalSummary.persistenceActionHref &&
                          selectedOperationalSummary.persistenceActionLabel ? (
                            <>
                              <button
                                type="button"
                                className={`${secondaryButtonClass} w-full`}
                                onClick={
                                  copySelectedOperationalPersistenceFilterLink
                                }
                                data-testid="library-selected-operational-persistence-link-copy"
                              >
                                {selectedOperationalPersistenceLinkCopiedFor ===
                                selected.id
                                  ? "저장 방식 링크 복사됨"
                                  : manualCopy?.id ===
                                        "selected-operational-persistence-link" &&
                                      manualCopy.targetId === selected.id
                                    ? "저장 방식 링크 복사 실패"
                                    : "저장 방식 링크 복사"}
                              </button>
                              <a
                                className={`${secondaryButtonClass} w-full`}
                                href={
                                  selectedOperationalSummary.persistenceActionHref
                                }
                              >
                                {
                                  selectedOperationalSummary.persistenceActionLabel
                                }
                              </a>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                      {manualCopy?.targetId === selected.id &&
                      (manualCopy.id === "selected-operational-group-link" ||
                        manualCopy.id === "selected-operational-source-link" ||
                        manualCopy.id ===
                          "selected-operational-persistence-link" ||
                        manualCopy.id ===
                          "selected-operational-summary-report") ? (
                        <div className="mt-3">
                          <LibraryManualCopyPanel
                            copy={manualCopy}
                            onClose={() => setManualCopy(null)}
                          />
                        </div>
                      ) : null}

                      <div
                        className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3"
                        data-testid="library-selected-operational-status-grid"
                      >
                        <div className="min-w-0 border-r border-line pr-2">
                          <p className="text-muted">저장 방식</p>
                          <p className="mt-1 break-words font-semibold text-soft">
                            {selectedOperationalSummary.persistenceLabel}
                          </p>
                        </div>
                        <div className="min-w-0 sm:border-r sm:border-line sm:pr-2">
                          <p className="text-muted">출처</p>
                          <p className="mt-1 break-words font-semibold text-soft">
                            {selectedOperationalSummary.sourceLabel}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-muted">체인</p>
                          <p className="mt-1 break-words font-semibold text-soft">
                            {selectedOperationalSummary.chainLabel}
                          </p>
                        </div>
                      </div>
                      {selectedOperationalSummary.sourceVariantLabel ? (
                        <div className="mt-2 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5">
                          <p className="text-muted">세부 초안 유형</p>
                          <p className="mt-1 break-words font-semibold text-soft">
                            {selectedOperationalSummary.sourceVariantLabel}
                          </p>
                        </div>
                      ) : null}
                      {selectedOperationalSummary.sourceTitle ? (
                        <div className="mt-2 rounded-md border border-line bg-surface px-3 py-2 text-xs leading-5">
                          <p className="text-muted">출처 제목</p>
                          <p className="mt-1 break-words font-semibold text-soft">
                            {selectedOperationalSummary.sourceTitle}
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-3 space-y-2 border-t border-line pt-3 text-xs leading-5 text-muted">
                        <p>{selectedOperationalSummary.nextActionDescription}</p>
                        <p>{selectedOperationalSummary.handoffStatusDescription}</p>
                        <p>{selectedOperationalSummary.chainDescription}</p>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <p className="text-sm text-muted">품질 점수</p>
                    <p className="mt-1 font-mono text-4xl font-semibold text-accent">
                      {activeVersion.qualityScore.toFixed(1)}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      생성 엔진 · {generationEngineLabels[selected.source]}
                      {selected.modelUsed ? ` ${selected.modelUsed}` : ""}
                    </p>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted">학습 컨텍스트</p>
                        <p className="mt-1 text-sm font-semibold text-soft">
                          {formatEnabledMemoryScopes(selected)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-soft">
                        {selected.learningContext
                          ? `${selected.learningContext.appliedMemoryCount}+${selected.learningContext.recentFeedbackCount}`
                          : "-"}
                      </span>
                    </div>
                    {selected.learningContext ? (
                      <>
                        <p className="mt-2 text-xs leading-5 text-muted">
                          학습 메모리 {selected.learningContext.appliedMemoryCount}
                          개, 최근 피드백{" "}
                          {selected.learningContext.recentFeedbackCount}개를 생성
                          컨텍스트로 사용했습니다.
                        </p>
                        <div
                          className="mt-3 grid gap-2"
                          data-testid="library-learning-context-workflow"
                        >
                          {selectedLearningContextWorkflowSteps.map((step) => (
                            <div
                              key={step.step}
                              className="rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="shrink-0 rounded-md border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-semibold text-accent">
                                  {step.step}
                                </span>
                                <p className="font-semibold text-soft">
                                  {step.label}
                                </p>
                              </div>
                              <p className="mt-2 break-words font-semibold text-soft">
                                {step.title}
                              </p>
                              <p className="mt-1 text-muted">{step.detail}</p>
                            </div>
                          ))}
                        </div>
                        {selected.learningContext.appliedMemoryTitles.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selected.learningContext.appliedMemoryTitles
                              .slice(0, 4)
                              .map((title) => (
                                <span
                                  key={title}
                                  className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
                                >
                                  {title}
                                </span>
                              ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="mt-2 text-xs leading-5 text-muted">
                        이 프롬프트는 학습 컨텍스트 메타 저장 전 생성됐습니다.
                      </p>
                    )}
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full`}
                        onClick={copyLearningContextReport}
                      >
                        {learningContextReportCopiedFor === selected.id
                          ? "리포트 복사됨"
                          : manualCopy?.id === "learning-report"
                            ? "리포트 복사 실패"
                            : "학습 컨텍스트 리포트 복사"}
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full`}
                        onClick={openLearningContextReportInStudio}
                      >
                        학습 리포트 Studio로
                      </button>
                    </div>
                    {manualCopy?.id === "learning-report" ? (
                      <div className="mt-3">
                        <LibraryManualCopyPanel
                          copy={manualCopy}
                          onClose={() => setManualCopy(null)}
                        />
                      </div>
	                    ) : null}
	                  </div>

	                  {selectedStudioSource && selectedStudioSourceLabel ? (
	                    <div className="rounded-md border border-line bg-surface px-4 py-3">
	                      <div className="flex min-w-0 items-start justify-between gap-3">
	                        <div className="min-w-0">
		                          <p className="text-xs text-muted">Studio 저장 출처</p>
	                          <p className="mt-1 break-words text-sm font-semibold text-soft">
	                            {selectedStudioSourceLabel.label}
	                          </p>
	                        </div>
	                        <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-semibold text-accent">
	                          {selectedStudioSourcePersistence?.label ?? "저장 추적"}
	                        </span>
	                      </div>
	                      {selectedStudioSource.sourceTitle ? (
	                        <p className="mt-2 break-words text-xs leading-5 text-muted">
	                          {selectedStudioSource.sourceTitle}
	                        </p>
	                      ) : null}
	                      <p className="mt-2 text-xs leading-5 text-muted">
	                        초안 입력 {selectedStudioSource.inputLineCount}줄 ·{" "}
	                        {selectedStudioSource.inputCharCount}자
	                      </p>
	                      <p className="mt-1 break-words text-xs leading-5 text-muted">
	                        {selectedStudioSource.inputPreview}
	                      </p>
	                      {selectedStudioSourcePersistence ? (
	                        <p className="mt-2 text-xs leading-5 text-muted">
	                          {selectedStudioSourcePersistence.description}
	                        </p>
	                      ) : null}
	                      {selectedStudioSourceRelationshipDescription ? (
	                        <p className="mt-2 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5 text-soft">
	                          {selectedStudioSourceRelationshipDescription}
	                        </p>
	                      ) : null}
	                      {selectedStudioSourceFilterHref ||
	                      selectedStudioPersistenceFilterHref ? (
	                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
	                          {selectedStudioSourceFilterHref ? (
	                            <>
	                              <button
	                                type="button"
	                                className={`${secondaryButtonClass} w-full`}
	                                onClick={copySelectedStudioSourceFilterLink}
	                                data-testid="library-selected-studio-source-link-copy"
	                              >
	                                {selectedStudioSourceLinkCopiedFor ===
	                                selected.id
	                                  ? selectedStudioSourceLinkCopiedLabel
	                                  : manualCopy?.id ===
	                                        "selected-studio-source-link" &&
	                                      manualCopy.targetId === selected.id
	                                    ? selectedStudioSourceLinkFailedLabel
	                                    : selectedStudioSourceLinkCopyLabel}
	                              </button>
	                              <a
	                                className={`${secondaryButtonClass} w-full`}
	                                href={selectedStudioSourceFilterHref}
	                              >
	                                {selectedStudioSourceLinkOpenLabel}
	                              </a>
	                            </>
	                          ) : null}
	                          {selectedStudioPersistenceFilterHref &&
	                          selectedStudioSourcePersistence ? (
	                            <>
	                              <button
	                                type="button"
	                                className={`${secondaryButtonClass} w-full`}
	                                onClick={
	                                  copySelectedStudioPersistenceFilterLink
	                                }
	                                data-testid="library-selected-studio-persistence-link-copy"
	                              >
	                                {selectedStudioPersistenceLinkCopiedFor ===
	                                selected.id
	                                  ? "저장 방식 링크 복사됨"
	                                  : manualCopy?.id ===
	                                        "selected-studio-persistence-link" &&
	                                      manualCopy.targetId === selected.id
	                                    ? "저장 방식 링크 복사 실패"
	                                    : "저장 방식 링크 복사"}
	                              </button>
	                              <a
	                                className={`${secondaryButtonClass} w-full`}
	                                href={selectedStudioPersistenceFilterHref}
	                              >
	                                같은 저장 방식 보기
	                              </a>
	                            </>
	                          ) : null}
	                        </div>
	                      ) : null}
	                      {manualCopy?.id === "selected-studio-source-link" &&
	                      manualCopy.targetId === selected.id ? (
	                        <div className="mt-3">
	                          <LibraryManualCopyPanel
	                            copy={manualCopy}
	                            onClose={() => setManualCopy(null)}
	                          />
	                        </div>
	                      ) : null}
	                      {manualCopy?.id ===
	                        "selected-studio-persistence-link" &&
	                      manualCopy.targetId === selected.id ? (
	                        <div className="mt-3">
	                          <LibraryManualCopyPanel
	                            copy={manualCopy}
	                            onClose={() => setManualCopy(null)}
	                          />
	                        </div>
	                      ) : null}
	                      <p className="mt-2 font-mono text-[11px] leading-5 text-muted">
	                        저장 시각 ·{" "}
	                        {new Date(selectedStudioSource.savedAt).toLocaleString(
	                          "ko-KR",
	                        )}
	                      </p>
	                      {selectedStudioSourceHref ? (
	                        <>
	                          <p className="mt-1 break-all font-mono text-[11px] leading-5 text-muted">
	                            원본 경로 · {selectedStudioSourceHref}
	                          </p>
	                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
	                            <button
	                              type="button"
	                              className={`${secondaryButtonClass} w-full`}
	                              onClick={copySelectedStudioSourceOriginalLink}
	                              data-testid="library-selected-studio-source-original-link-copy"
	                            >
	                              {selectedStudioSourceOriginalLinkCopiedFor ===
	                              selected.id
	                                ? "원본 링크 복사됨"
	                                : manualCopy?.id ===
	                                      "selected-studio-source-original-link" &&
	                                    manualCopy.targetId === selected.id
	                                  ? "원본 링크 복사 실패"
	                                  : "원본 링크 복사"}
	                            </button>
	                            <a
	                              className={`${secondaryButtonClass} w-full`}
	                              href={selectedStudioSourceHref}
	                            >
	                              {selectedStudioSourceLabel.actionLabel}
	                            </a>
	                          </div>
	                          {manualCopy?.id ===
	                            "selected-studio-source-original-link" &&
	                          manualCopy.targetId === selected.id ? (
	                            <div className="mt-3">
	                              <LibraryManualCopyPanel
	                                copy={manualCopy}
	                                onClose={() => setManualCopy(null)}
	                              />
	                            </div>
	                          ) : null}
	                        </>
	                      ) : null}
	                    </div>
	                  ) : null}

	                  {selected &&
	                  !selectedStudioSource &&
	                  selectedStudioPersistenceLabel ? (
	                    <div className="rounded-md border border-line bg-surface px-4 py-3">
	                      <div className="flex min-w-0 items-start justify-between gap-3">
	                        <div className="min-w-0">
		                          <p className="text-xs text-muted">Studio 저장 출처</p>
	                          <p className="mt-1 break-words text-sm font-semibold text-soft">
	                            저장 출처 메타 없음
	                          </p>
	                        </div>
	                        <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 text-[11px] font-semibold text-muted">
	                          {selectedStudioPersistenceLabel}
	                        </span>
	                      </div>
	                      {selectedStudioPersistenceDescription ? (
	                        <p className="mt-2 text-xs leading-5 text-muted">
	                          {selectedStudioPersistenceDescription}
	                        </p>
	                      ) : null}
	                      <p className="mt-2 text-xs leading-5 text-muted">
	                        이 저장본은 Studio 초안의 원본 화면, 입력 요약, 저장 출처가
	                        기록되기 전 생성됐거나 직접 저장된 항목입니다.
	                      </p>
	                      <div className="mt-3 rounded-md border border-line bg-panel px-3 py-2">
	                        <p className="text-[11px] font-semibold text-soft">
	                          점검 기준
	                        </p>
	                        <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
	                          <li>
	                            직접 작성하거나 가져온 저장본이면 출처 없음으로 유지합니다.
	                          </li>
	                          <li>
	                            Dashboard, Learning, Library, Skills 조치에서 만든 결과라면
	                            Studio 저장 출처가 있는 초안 흐름으로 다시 저장합니다.
	                          </li>
	                        </ul>
	                      </div>
	                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
	                        <button
	                          type="button"
	                          className={`${secondaryButtonClass} w-full`}
	                          onClick={copyNoSourceMetaNote}
	                        >
	                          {noSourceMetaNoteCopiedFor === selected.id
	                            ? "메모 복사됨"
	                            : manualCopy?.id === "no-source-meta-note" &&
	                                manualCopy.targetId === selected.id
	                              ? "메모 복사 실패"
	                              : "저장 출처 없음 메모 복사"}
	                        </button>
	                        <button
	                          type="button"
	                          className={`${secondaryButtonClass} w-full`}
	                          onClick={openNoSourceMetaNoteInStudio}
	                        >
	                          Studio로 보내기
	                        </button>
	                      </div>
	                      {manualCopy?.id === "no-source-meta-note" &&
	                      manualCopy.targetId === selected.id ? (
	                        <div className="mt-3">
	                          <LibraryManualCopyPanel
	                            copy={manualCopy}
	                            onClose={() => setManualCopy(null)}
	                          />
	                        </div>
	                      ) : null}
	                      {selectedStudioPersistenceFilterHref ? (
	                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
	                          <button
	                            type="button"
	                            className={`${secondaryButtonClass} w-full`}
	                            onClick={copySelectedStudioPersistenceFilterLink}
	                            data-testid="library-no-source-meta-persistence-link"
	                          >
	                            {selectedStudioPersistenceLinkCopiedFor ===
	                            selected.id
	                              ? "저장 방식 링크 복사됨"
	                              : manualCopy?.id ===
	                                    "selected-studio-persistence-link" &&
	                                  manualCopy.targetId === selected.id
	                                ? "저장 방식 링크 복사 실패"
	                                : "저장 방식 링크 복사"}
	                          </button>
	                          <a
	                            className={`${secondaryButtonClass} w-full`}
	                            href={selectedStudioPersistenceFilterHref}
	                          >
	                            같은 저장 방식 보기
	                          </a>
	                        </div>
	                      ) : null}
	                      {manualCopy?.id ===
	                        "selected-studio-persistence-link" &&
	                      manualCopy.targetId === selected.id ? (
	                        <div className="mt-3">
	                          <LibraryManualCopyPanel
	                            copy={manualCopy}
	                            onClose={() => setManualCopy(null)}
	                          />
	                        </div>
	                      ) : null}
	                    </div>
	                  ) : null}

	                  {selectedImprovementLineage.length > 1 ? (
	                    <div className="rounded-md border border-line bg-surface px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted">개선 체인</p>
                          <p className="mt-1 text-sm font-semibold text-soft">
                            원본부터 현재까지
                          </p>
                        </div>
                        <span className="font-mono text-xs text-accent">
                          {selectedImprovementDepth}차
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {selectedImprovementLineage.map((lineagePrompt, index) => {
                          const isCurrent = lineagePrompt.id === selected.id;
                          const nextPrompt = selectedImprovementLineage[index + 1];
                          const preferredVersion =
                            nextPrompt?.improvementSource?.sourcePromptId ===
                            lineagePrompt.id
                              ? nextPrompt.improvementSource.sourceVersionModel
                              : lineagePrompt.versions[0]?.targetModel;
                          const stageLabel =
                            index === 0 ? "원본" : `${index}차 개선`;

                          return (
                            <button
                              key={lineagePrompt.id}
                              type="button"
                              className={`w-full rounded-md border px-3 py-3 text-left transition disabled:cursor-default ${
                                isCurrent
                                  ? "border-accent bg-accent/10"
                                  : "border-line bg-panel hover:border-accent"
                              }`}
                              disabled={isCurrent}
                              onClick={() =>
                                openPromptDetail(lineagePrompt.id, preferredVersion)
                              }
                            >
                              <div className="flex min-w-0 items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-accent">
                                  {stageLabel}
                                </p>
                                {isCurrent ? (
                                  <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] text-soft">
                                    현재
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 line-clamp-2 break-words text-sm font-semibold text-soft">
                                {lineagePrompt.title}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {selected.improvementSource ? (
                    <div
                      className="rounded-md border border-line bg-surface px-4 py-3"
                      data-testid="library-improvement-source-card"
                      id="library-improvement-source-card"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-muted">개선 출처</p>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                          {selectedSourceHealthIssueReason ? (
                            <span className="rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                              {
                                sourceReasonFilterLabels[
                                  selectedSourceHealthIssueReason
                                ]
                              }
                            </span>
                          ) : null}
                          <span className="rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                            {formatPromptImprovementDepth(
                              selectedImprovementDepth,
                            )}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 break-words text-sm font-semibold text-soft">
                        {selected.improvementSource.sourcePromptTitle}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-muted">
                        {selected.improvementSource.sourceVersionModel
                          ? `${modelLabels[selected.improvementSource.sourceVersionModel]} 버전 기준`
                          : "Library 선택 버전 기준"}
                      </p>
                      {selectedSourceHealthIssueReason ? (
                        <p className="mt-2 rounded-md border border-line bg-panel px-3 py-2 text-xs leading-5 text-muted">
                          {
                            sourceReasonIssueDescriptions[
                              selectedSourceHealthIssueReason
                            ]
                          }
                        </p>
                      ) : null}
                      {selected.improvementSource.sourceFeedback ? (
                        <div className="mt-3 border-l border-accent/50 pl-3">
                          <p className="text-[11px] font-semibold text-accent">
                            반영 피드백 ·{" "}
                            {selected.improvementSource.sourceFeedback.rating.toFixed(
                              0,
                            )}
                            /5 ·{" "}
                            {
                              feedbackTypeLabels[
                                selected.improvementSource.sourceFeedback
                                  .feedbackType
                              ]
                            }
                          </p>
                          <p className="mt-1 break-words text-xs leading-5 text-muted">
                            {selected.improvementSource.sourceFeedback.comment}
                          </p>
                        </div>
                      ) : null}
	                      {sourcePrompt ? (
	                        <div className="mt-3 grid gap-2">
	                          <button
                            type="button"
                            className={`${secondaryButtonClass} w-full`}
                            onClick={() =>
                              openPromptDetail(
                                sourcePrompt.id,
                                selected.improvementSource?.sourceVersionModel,
                              )
                            }
                          >
                            원본 보기
                          </button>
                          {selected.improvementSource.sourceFeedback?.id ? (
                            <button
                              type="button"
                              className={`${secondaryButtonClass} w-full`}
                              onClick={() =>
                                openPromptFeedbackDetail(
                                  sourcePrompt.id,
                                  selected.improvementSource?.sourceFeedback
                                    ?.id ?? "",
                                  selected.improvementSource?.sourceVersionModel,
                                )
                              }
                            >
                              원본 피드백 보기
                            </button>
	                          ) : null}
	                        </div>
	                      ) : deletedSourcePrompt ? (
	                        <div className="mt-3 rounded-md border border-line bg-panel px-3 py-3">
	                          <div className="flex min-w-0 items-start justify-between gap-3">
	                            <div className="min-w-0">
	                              <p className="text-xs font-semibold text-soft">
	                                원본이 삭제 보관함에 있습니다.
	                              </p>
	                              <p className="mt-1 break-words text-xs leading-5 text-muted">
	                                삭제{" "}
	                                {new Date(
	                                  deletedSourcePrompt.deletedAt,
	                                ).toLocaleString("ko-KR")}
	                              </p>
	                            </div>
	                            <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-semibold text-muted">
	                              보관됨
	                            </span>
	                          </div>
	                          <button
	                            type="button"
	                            className={`${secondaryButtonClass} mt-3 w-full`}
	                            onClick={() => restoreDeletedPrompt(deletedSourcePrompt)}
	                          >
	                            원본 복원
	                          </button>
	                        </div>
	                      ) : (
	                        <p className="mt-3 text-xs leading-5 text-muted">
	                          원본이 현재 워크스페이스에 없습니다.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {selectedImprovementQualityDelta ? (
                    <div className="rounded-md border border-line bg-surface px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted">개선 효과</p>
                          <p
                            className={`mt-1 font-mono text-3xl font-semibold ${
                              selectedImprovementQualityDelta.delta >= 0
                                ? "text-accent"
                                : "text-muted"
                            }`}
                          >
                            {formatQualityDelta(
                              selectedImprovementQualityDelta.delta,
                            )}
                          </p>
                        </div>
                        <span className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted">
                          {modelLabels[
                            selectedImprovementQualityDelta.sourceVersion
                              .targetModel
                          ]}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md border border-line bg-panel px-3 py-2">
                          <p className="text-muted">원본</p>
                          <p className="mt-1 font-mono text-sm text-soft">
                            {selectedImprovementQualityDelta.sourceScore.toFixed(1)}
                          </p>
                        </div>
                        <div className="rounded-md border border-line bg-panel px-3 py-2">
                          <p className="text-muted">개선본</p>
                          <p className="mt-1 font-mono text-sm text-soft">
                            {selectedImprovementQualityDelta.improvedScore.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {selectedImprovementScoreComparison &&
                  selectedImprovementQualityDelta ? (
                    <div className="rounded-md border border-line bg-surface px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted">원본 대비 품질 변화</p>
                          <p className="mt-1 text-sm font-semibold text-soft">
                            세부 지표 비교
                          </p>
                        </div>
                        <span className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted">
                          {modelLabels[
                            selectedImprovementQualityDelta.sourceVersion
                              .targetModel
                          ]}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="border-r border-line pr-2">
                          <p className="text-muted">개선</p>
                          <p className="mt-1 font-mono text-sm text-accent">
                            {selectedImprovementScoreComparison.improvedCount}
                          </p>
                        </div>
                        <div className="border-r border-line pr-2">
                          <p className="text-muted">유지</p>
                          <p className="mt-1 font-mono text-sm text-soft">
                            {selectedImprovementScoreComparison.unchangedCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted">재검토</p>
                          <p className="mt-1 font-mono text-sm text-muted">
                            {selectedImprovementScoreComparison.regressedCount}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {selectedImprovementScoreComparison.strongestImprovement ? (
                          <div className="border-l-2 border-accent pl-3">
                            <p className="text-xs text-muted">가장 좋아진 항목</p>
                            <p className="mt-1 text-sm font-semibold text-soft">
                              {
                                selectedImprovementScoreComparison
                                  .strongestImprovement.label
                              }{" "}
                              <span className="font-mono text-accent">
                                {formatQualityDelta(
                                  selectedImprovementScoreComparison
                                    .strongestImprovement.delta,
                                )}
                              </span>
                            </p>
                          </div>
                        ) : null}
                        {selectedImprovementScoreComparison.reviewCandidate ? (
                          <div className="border-l-2 border-line pl-3">
                            <p className="text-xs text-muted">다음 재검토 항목</p>
                            <p className="mt-1 text-sm font-semibold text-soft">
                              {
                                selectedImprovementScoreComparison.reviewCandidate
                                  .label
                              }{" "}
                              <span
                                className={`font-mono ${
                                  selectedImprovementScoreComparison
                                    .reviewCandidate.delta < 0
                                    ? "text-muted"
                                    : "text-soft"
                                }`}
                              >
                                {formatQualityDelta(
                                  selectedImprovementScoreComparison
                                    .reviewCandidate.delta,
                                )}
                              </span>
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted">
                              {
                                selectedImprovementScoreComparison.reviewCandidate
                                  .recommendation
                              }
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 space-y-2">
                        {selectedImprovementScoreComparison.metrics.map(
                          (metric) => (
                            <div
                              key={metric.key}
                              className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-line pt-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-2">
                                  <p className="truncate font-semibold text-soft">
                                    {metric.label}
                                  </p>
                                  <span
                                    className={`shrink-0 rounded border border-line px-1.5 py-0.5 text-[11px] ${
                                      metric.status === "improved"
                                        ? "text-accent"
                                        : metric.status === "regressed"
                                          ? "text-muted"
                                          : "text-soft"
                                    }`}
                                  >
                                    {metric.status === "improved"
                                      ? "개선"
                                      : metric.status === "regressed"
                                        ? "재검토"
                                        : "유지"}
                                  </span>
                                </div>
                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel">
                                  <div
                                    className="h-full rounded-full bg-accent"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.max(0, metric.improvedScore * 20),
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-soft">
                                  {metric.sourceScore.toFixed(1)} →{" "}
                                  {metric.improvedScore.toFixed(1)}
                                </p>
                                <p
                                  className={`mt-1 font-mono ${
                                    metric.delta >= 0
                                      ? "text-accent"
                                      : "text-muted"
                                  }`}
                                >
                                  {formatQualityDelta(metric.delta)}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : null}

                  {linkedImprovementPrompts.length ? (
                    <div className="rounded-md border border-line bg-surface px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted">후속 개선본</p>
                          <p className="mt-1 text-sm font-semibold text-soft">
                            현재 기준 재개선 이력
                          </p>
                        </div>
                        <span className="font-mono text-xs text-accent">
                          {linkedImprovementPrompts.length}개
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {linkedImprovementPrompts.map((prompt) => {
                          const qualityDelta = getImprovementQualityDelta({
                            improvementPrompt: prompt,
                            sourcePrompt: selected,
                          });

                          return (
                            <button
                              key={prompt.id}
                              type="button"
                              className="w-full rounded-md border border-line bg-panel px-3 py-3 text-left transition hover:border-accent"
                              onClick={() =>
                                openPromptDetail(
                                  prompt.id,
                                  prompt.versions[0]?.targetModel,
                                )
                              }
                            >
                              <p className="line-clamp-2 break-words text-sm font-semibold text-soft">
                                {prompt.title}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-muted">
                                  {selectedImprovementDepth + 1}차 개선
                                </span>
                                <span className="font-mono text-accent">
                                  {getPromptBestQuality(prompt).toFixed(1)}
                                </span>
                                {qualityDelta ? (
                                  <span
                                    className={
                                      qualityDelta.delta >= 0
                                        ? "text-accent"
                                        : "text-muted"
                                    }
                                  >
                                    개선 효과{" "}
                                    {formatQualityDelta(qualityDelta.delta)}
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted">버전 비교</p>
                        <p className="mt-1 text-sm font-semibold text-soft">
                          AI 도구별 품질과 피드백
                        </p>
                      </div>
                      <span className="font-mono text-xs text-accent">
                        {versionComparisons.length}개
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {versionComparisons.map(
                        ({
                          averageRating,
                          feedbackCount,
                          isBestQuality,
                          isMostReviewed,
                          version,
                        }) => {
                          const isActive =
                            activeVersion.targetModel === version.targetModel;

                          return (
                            <button
                              key={version.id}
                              type="button"
                              className={`w-full rounded-md border px-3 py-3 text-left transition ${
                                isActive
                                  ? "border-accent bg-panel-strong"
                                  : "border-line bg-panel hover:border-accent"
                              }`}
                              onClick={() => {
                                handleVersionChange(version.targetModel);
                              }}
                            >
                              <div className="flex min-w-0 items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-soft">
                                    {modelLabels[version.targetModel]}
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {isActive ? (
                                      <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-muted">
                                        선택됨
                                      </span>
                                    ) : null}
                                    {isBestQuality ? (
                                      <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-muted">
                                        최고 품질
                                      </span>
                                    ) : null}
                                    {isMostReviewed ? (
                                      <span className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-muted">
                                        피드백 최다
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                <span className="font-mono text-sm text-accent">
                                  {version.qualityScore.toFixed(1)}
                                </span>
                              </div>

                              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p className="text-muted">품질</p>
                                  <p className="mt-1 font-mono text-soft">
                                    {version.qualityScore.toFixed(1)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted">피드백</p>
                                  <p className="mt-1 font-mono text-soft">
                                    {feedbackCount}개
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted">평균</p>
                                  <p className="mt-1 font-mono text-soft">
                                    {averageRating
                                      ? averageRating.toFixed(1)
                                      : "-"}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface">
                                <div
                                  className="h-full rounded-full bg-accent"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, version.qualityScore * 20),
                                    )}%`,
                                  }}
                                />
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="text-xs text-muted">언어 전략</p>
                    <p className="mt-1 text-sm font-semibold text-soft">
                      {languageStrategyLabels[getLanguageStrategy(selected)]}
                    </p>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="text-xs text-muted">AI 판단 이유</p>
                    <p className="mt-2 text-xs leading-5 text-soft">
                      {getLanguageDecisionText(selected)}
                    </p>
                    {selected.languageDecision?.signals.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selected.languageDecision.signals.map((signal) => (
                          <span
                            key={signal}
                            className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
                          >
                            {signal}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="text-xs text-muted">AI 도구 추천 이유</p>
                    <p className="mt-1 text-sm font-semibold text-soft">
                      {formatTargetModels(
                        selected.targetModelDecision?.targetModels ??
                          selected.targetModels,
                      )}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-soft">
                      {getTargetModelDecisionText(selected)}
                    </p>
                    {selected.targetModelDecision?.signals.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selected.targetModelDecision.signals.map((signal) => (
                          <span
                            key={signal}
                            className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
                          >
                            {signal}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="text-xs text-muted">답변 언어</p>
                    <p className="mt-1 text-sm font-semibold text-soft">
                      {outputLanguageLabels[getOutputLanguage(selected)]}
                    </p>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted">품질 진단</p>
                        <p className="mt-1 text-sm font-semibold text-soft">
                          전체 점수 기준
                        </p>
                      </div>
                      <span className="font-mono text-xs text-accent">
                        {activeVersion.qualityScore.toFixed(1)}/5
                      </span>
                    </div>
                    <div className="mt-3 space-y-3">
                      <ScoreBar
                        label="명확성"
                        value={activeVersion.scoreBreakdown.clarity}
                      />
                      <ScoreBar
                        label="맥락"
                        value={activeVersion.scoreBreakdown.context}
                      />
                      <ScoreBar
                        label="출력 형식"
                        value={activeVersion.scoreBreakdown.outputFormat}
                      />
                      <ScoreBar
                        label="제약 조건"
                        value={activeVersion.scoreBreakdown.constraints}
                      />
                      <ScoreBar
                        label="전문성"
                        value={activeVersion.scoreBreakdown.expertise}
                      />
                      <ScoreBar
                        label="도구 적합성"
                        value={activeVersion.scoreBreakdown.modelFit}
                      />
                      <ScoreBar
                        label="재사용성"
                        value={activeVersion.scoreBreakdown.reusability}
                      />
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <p className="text-xs text-muted">맥락 진단</p>
                    <div className="mt-3 space-y-4">
                      <div>
                        <p className="mb-2 text-sm font-semibold text-soft">가정</p>
                        <ul className="space-y-2 text-xs leading-5 text-muted">
                          {activeVersion.assumptions.length ? (
                            activeVersion.assumptions.map((item, index) => (
                              <li key={`${item}-${index}`}>- {item}</li>
                            ))
                          ) : (
                            <li>- 명시된 가정 없음</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-semibold text-soft">
                          부족한 정보
                        </p>
                        <ul className="space-y-2 text-xs leading-5 text-muted">
                          {activeVersion.missingContext.length ? (
                            activeVersion.missingContext.map((item, index) => (
                              <li key={`${item}-${index}`}>- {item}</li>
                            ))
                          ) : (
                            <li>- 현재 입력만으로 생성 가능</li>
                          )}
                        </ul>
                        {activeVersion.missingContext.length ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                            <a
                              className={`${secondaryButtonClass} w-full`}
                              href={profileContextHref}
                            >
                              개인 프로필 보강
                            </a>
                            <a
                              className={`${secondaryButtonClass} w-full`}
                              href={companyContextHref}
                            >
                              회사 정보 보강
                            </a>
                            <button
                              className={`${secondaryButtonClass} w-full`}
                              type="button"
                              onClick={copyMissingContextQuestions}
                            >
                              {contextQuestionsCopied
                                ? "보강 질문 복사됨"
                                : contextQuestionsCopyFailed
                                  ? "보강 질문 복사 실패"
                                  : "보강 질문 복사"}
                            </button>
                            {manualCopy?.id === "missing-context" ? (
                              <div className="sm:col-span-2 xl:col-span-1">
                                <LibraryManualCopyPanel
                                  copy={manualCopy}
                                  onClose={() => setManualCopy(null)}
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-line bg-surface px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted">개선 액션</p>
                        <p className="mt-1 text-sm font-semibold text-soft">
                          브리프 복사 기준
                        </p>
                      </div>
                      <span className="font-mono text-xs text-accent">
                        {improvementActions.length}개
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {improvementActions.map((item) => (
                        <div
                          key={item.key}
                          className="rounded-md border border-line bg-panel px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-soft">
                              {item.label}
                            </p>
                            <span className="font-mono text-xs text-accent">
                              {item.score.toFixed(1)}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-muted">
                            {item.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                      <button
                        className={primaryButtonClass}
                        type="button"
                        onClick={openImprovementInStudio}
                      >
                        Studio에서 개선
                      </button>
                      <button
                        className={secondaryButtonClass}
                        type="button"
                        onClick={copyImprovementBrief}
                      >
                        {improvementBriefCopied
                          ? "개선 브리프 복사됨"
                          : manualCopy?.id === "improvement-brief"
                            ? "개선 브리프 복사 실패"
                            : "개선 브리프 복사"}
                      </button>
                    </div>
                    {manualCopy?.id === "improvement-brief" ? (
                      <div className="mt-3">
                        <LibraryManualCopyPanel
                          copy={manualCopy}
                          onClose={() => setManualCopy(null)}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-line pt-5">
                    <p className="mb-3 text-sm font-semibold">피드백 추가</p>
                    <div className="space-y-3">
                      <Field label="점수">
                        <select
                          className={selectClass}
                          value={rating}
                          onChange={(event) => setRating(Number(event.target.value))}
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="유형">
                        <select
                          className={selectClass}
                          value={feedbackType}
                          onChange={(event) =>
                            setFeedbackType(event.target.value as Feedback["feedbackType"])
                          }
                        >
                          <option value="format">출력 형식</option>
                          <option value="tone">톤</option>
                          <option value="context">맥락</option>
                          <option value="accuracy">정확성</option>
                          <option value="company_rule">회사 기준</option>
                          <option value="other">기타</option>
                        </select>
                      </Field>
                      <Field label="코멘트">
                        <textarea
                          className={textareaClass}
                          rows={4}
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          placeholder="예: 이 구조는 좋지만 회사 톤이 더 차분해야 함"
                        />
                      </Field>
                      <button
                        className={`${primaryButtonClass} w-full`}
                        type="button"
                        onClick={addFeedback}
                        disabled={!comment.trim()}
                      >
                        피드백 저장
                      </button>
                    </div>
                  </div>

                  <div id="library-feedback-section" className="scroll-mt-6">
                    <p className="mb-2 text-sm font-semibold">최근 피드백</p>
                    <div className="space-y-2">
                      {selected.feedback.slice(0, 5).map((feedback) => {
                        const isHighlighted =
                          highlightedFeedbackId === feedback.id ||
                          latestFeedbackId === feedback.id;

                        return (
                          <div
                            key={feedback.id}
                            id={`library-feedback-${feedback.id}`}
                            tabIndex={-1}
                            className={`scroll-mt-6 rounded-md border p-3 text-sm outline-none transition ${
                              isHighlighted
                                ? "border-accent bg-accent/10"
                                : "border-line bg-surface"
                            }`}
                          >
                            <div className="flex min-w-0 items-start justify-between gap-2">
                              <p className="font-mono text-xs text-accent">
                                {feedback.rating}/5 ·{" "}
                                {feedbackTypeLabels[feedback.feedbackType]}
                              </p>
                              {latestFeedbackId === feedback.id ? (
                                <span className="shrink-0 rounded border border-line bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-soft">
                                  저장됨
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 leading-5 text-muted">
                              {feedback.comment}
                            </p>
                            <button
                              type="button"
                              className={`${secondaryButtonClass} mt-3 w-full`}
                              onClick={() => openFeedbackImprovementInStudio(feedback)}
                            >
                              이 피드백으로 Studio 개선
                            </button>
                          </div>
                        );
                      })}
                      {selected.feedback.length === 0 ? (
                        <p className="text-sm text-muted">아직 피드백이 없습니다.</p>
                      ) : null}
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="flex min-h-[720px] items-center justify-center px-5 text-center text-sm text-muted">
              {prompts.length
                ? "필터 조건에 맞는 프롬프트가 없습니다."
                : "저장된 프롬프트가 없습니다. Studio에서 생성 후 저장하세요."}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
