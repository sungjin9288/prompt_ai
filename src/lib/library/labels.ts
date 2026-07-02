import {
  modelLabels,
  promptStudioDraftSourceVariants,
  type Feedback,
  type MemoryScope,
  type PromptAsset,
  type PromptLanguageStrategy,
  type PromptOutputLanguage,
  type PromptStudioDraftSourceVariant,
  type PromptStudioSourceMeta,
  type TargetModel,
} from "@/lib/prompt";
import {
  getPromptStudioSourceLibraryFilterLabel,
  promptStudioDraftSourceOptions,
} from "@/lib/studio/source-registry";
import { getStudioDraftDisplaySourceLabel } from "@/lib/studio/draft-display";
import type { PromptSourceHealthIssueReason } from "@/lib/analytics/prompt-improvement";
import type {
  ImprovementAction,
  ScoreMetricComparison,
} from "@/lib/library/prompt-metrics";

export type LanguageFilter = PromptLanguageStrategy | "all";
export type OutputLanguageFilter = PromptOutputLanguage | "all";
export type TargetModelFilter = TargetModel | "all";
export type LibrarySortMode = "recent" | "quality" | "feedback" | "improvement";
export type PromptDetailMode = "current" | "comparison";
export type LibraryFocusTarget = "feedback";
export type ImprovementFilter =
  | "all"
  | "archived-source"
  | "improved"
  | "regressed"
  | "reimprovement"
  | "unmeasured";
export type SourceReasonFilter = PromptSourceHealthIssueReason | "all";
export type StudioPersistenceFilter = "all" | "chain" | "none" | "ops";
export type StudioSourceFilter = PromptStudioSourceMeta["source"] | "all";
export type StudioSourceVariantFilter = PromptStudioDraftSourceVariant | "all";
export type GenerationEngineFilter = PromptAsset["source"] | "all";
export type LearningScopeFilter = MemoryScope | "untracked" | "all";

export const librarySortModes: LibrarySortMode[] = [
  "recent",
  "quality",
  "feedback",
  "improvement",
];

export const librarySortLabels: Record<LibrarySortMode, string> = {
  recent: "최신순",
  quality: "품질순",
  feedback: "피드백 많은 순",
  improvement: "개선 효과순",
};

export const improvementFilterModes: ImprovementFilter[] = [
  "all",
  "improved",
  "regressed",
  "reimprovement",
  "archived-source",
  "unmeasured",
];

export const improvementFilterLabels: Record<ImprovementFilter, string> = {
  all: "전체",
  improved: "개선됨",
  regressed: "재검토",
  reimprovement: "재개선 후보",
  "archived-source": "보관함 원본",
  unmeasured: "측정 불가",
};

export const sourceReasonFilterModes: SourceReasonFilter[] = [
  "all",
  "archived-source",
  "missing-source",
  "missing-source-version",
  "missing-improved-version",
];

export const sourceReasonFilterLabels: Record<SourceReasonFilter, string> = {
  all: "전체",
  "archived-source": "원본 보관함",
  "missing-source": "원본 누락",
  "missing-source-version": "원본 버전 누락",
  "missing-improved-version": "개선본 버전 누락",
};

export const studioPersistenceFilterModes: StudioPersistenceFilter[] = [
  "all",
  "chain",
  "ops",
  "none",
];

export const studioPersistenceFilterLabels: Record<StudioPersistenceFilter, string> = {
  all: "전체 저장 방식",
  chain: "개선 체인",
  ops: "운영 출처",
  none: "Studio 출처 없음",
};

export const studioSourceFilterModes: StudioSourceFilter[] = [
  "all",
  ...promptStudioDraftSourceOptions,
];

export const studioSourceVariantFilterModes: StudioSourceVariantFilter[] = [
  "all",
  ...promptStudioDraftSourceVariants,
];

export function getStudioSourceFilterLabel(source: StudioSourceFilter) {
  return source === "all"
    ? "전체 Studio 저장 출처"
    : getPromptStudioSourceLibraryFilterLabel(source);
}

export const studioSourceVariantFilterLabels: Record<
  PromptStudioDraftSourceVariant,
  string
> = {
  "dashboard-next-action-queue-verification":
    "Dashboard 다음 실행 큐 완료 확인",
  "feedback-improvement": "Library 피드백 개선 브리프",
  "handoff-improvement": "AI 전달 보강 브리프",
  "learning-low-confidence-validation": "Learning 저신뢰도 피드백 검증",
};

export function getStudioSourceVariantFilterLabel(
  sourceVariant: StudioSourceVariantFilter,
) {
  return sourceVariant === "all"
    ? "전체 세부 초안 유형"
    : studioSourceVariantFilterLabels[sourceVariant];
}

export function getPromptStudioSourceMetaLibraryLabel(
  studioSource: PromptStudioSourceMeta,
) {
  const displayLabel = getStudioDraftDisplaySourceLabel(studioSource);

  return {
    actionLabel: displayLabel.sourceActionLabel,
    label: displayLabel.label,
  };
}

export function getPromptStudioSourceVariantLabel(
  studioSource: PromptStudioSourceMeta | undefined,
) {
  return studioSource?.sourceVariant
    ? getPromptStudioSourceMetaLibraryLabel(studioSource).label
    : undefined;
}

export function summarizePromptStudioSourceVariantLabels(prompts: PromptAsset[]) {
  return summarizePromptStudioSourceVariantItems(prompts).map(
    ({ count, label }) => `${label} ${count}개`,
  );
}

export function summarizePromptStudioSourceVariantItems(prompts: PromptAsset[]) {
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

export const studioPersistenceFilterDescriptions: Record<
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

export const sourceReasonIssueDescriptions: Record<
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

export const generationEngines: PromptAsset["source"][] = ["local", "openai"];

export const generationEngineLabels: Record<GenerationEngineFilter, string> = {
  all: "전체",
  local: "Local builder",
  openai: "OpenAI",
};

export const learningScopeFilters: Exclude<LearningScopeFilter, "all">[] = [
  "company",
  "user",
  "domain",
  "skill",
  "untracked",
];

export const memoryScopeLabels: Record<MemoryScope, string> = {
  user: "사용자",
  company: "회사",
  domain: "분야",
  skill: "스킬",
};

export const feedbackTypeLabels: Record<Feedback["feedbackType"], string> = {
  accuracy: "정확성",
  company_rule: "회사 기준",
  context: "맥락",
  format: "출력 형식",
  other: "기타",
  tone: "톤",
};

export const learningScopeFilterLabels: Record<LearningScopeFilter, string> = {
  all: "전체",
  ...memoryScopeLabels,
  untracked: "기록 없음",
};

export function getPromptStudioSourcePersistenceMeta(
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

export function getPromptStudioSourceRelationshipDescription(
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

export const scoreMetricDefinitions: Array<
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

export function formatPromptImprovementDepth(depth: number) {
  if (depth <= 0) {
    return "개선본";
  }

  return `${depth}차 개선본`;
}

export function formatQualityDelta(delta: number) {
  if (delta > 0) {
    return `+${delta.toFixed(1)}`;
  }

  return delta.toFixed(1);
}

export function getScoreMetricStatus(delta: number): ScoreMetricComparison["status"] {
  if (delta > 0) {
    return "improved";
  }

  if (delta < 0) {
    return "regressed";
  }

  return "unchanged";
}

export function formatTargetModels(models: TargetModel[]) {
  return models.map((model) => modelLabels[model]).join(", ");
}
