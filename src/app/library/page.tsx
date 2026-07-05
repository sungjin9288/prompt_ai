import type { Metadata } from "next";
import { LibraryView } from "@/components/library/library-view";
import {
  languageStrategies,
  outputLanguages,
  promptStudioDraftSourceVariants,
  targetModels,
  type MemoryScope,
  type PromptLanguageStrategy,
  type PromptOutputLanguage,
  type PromptStudioDraftSourceVariant,
  type TargetModel,
} from "@/lib/prompt";
import type { PromptSourceHealthIssueReason } from "@/lib/analytics/prompt-improvement";
import { promptStudioDraftSourceOptions } from "@/lib/studio/source-registry";

export const metadata: Metadata = {
  title: "라이브러리",
};

interface LibraryPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const librarySortModes = ["recent", "quality", "feedback", "improvement"] as const;
const improvementFilterModes = [
  "archived-source",
  "improved",
  "regressed",
  "reimprovement",
  "unmeasured",
] as const;
const sourceReasonFilterModes = [
  "archived-source",
  "missing-source",
  "missing-source-version",
  "missing-improved-version",
] as const;
const studioPersistenceFilterModes = ["chain", "ops", "none"] as const;
const studioSourceFilterModes = promptStudioDraftSourceOptions;
const studioSourceVariantFilterModes = promptStudioDraftSourceVariants;
const promptDetailModes = ["current", "comparison"] as const;
const generationEngineModes = ["local", "openai"] as const;
const libraryFocusTargets = ["feedback"] as const;
const learningScopeModes = [
  "user",
  "company",
  "domain",
  "skill",
  "untracked",
] as const;

type LibrarySortMode = (typeof librarySortModes)[number];
type ImprovementFilterMode = (typeof improvementFilterModes)[number];
type SourceReasonFilterMode = PromptSourceHealthIssueReason;
type StudioPersistenceFilterMode = (typeof studioPersistenceFilterModes)[number];
type StudioSourceFilterMode = (typeof studioSourceFilterModes)[number];
type StudioSourceVariantFilterMode = PromptStudioDraftSourceVariant;
type PromptDetailMode = (typeof promptDetailModes)[number];
type GenerationEngineMode = (typeof generationEngineModes)[number];
type LibraryFocusTarget = (typeof libraryFocusTargets)[number];
type LearningScopeMode = MemoryScope | "untracked";

function normalizeTargetModel(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  return targetModels.includes(candidate as TargetModel)
    ? (candidate as TargetModel)
    : undefined;
}

function normalizeLanguageStrategy(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  return languageStrategies.includes(candidate as PromptLanguageStrategy)
    ? (candidate as PromptLanguageStrategy)
    : undefined;
}

function normalizeOutputLanguage(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  return outputLanguages.includes(candidate as PromptOutputLanguage)
    ? (candidate as PromptOutputLanguage)
    : undefined;
}

function normalizeQuery(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const query = candidate?.trim();

  return query ? query : undefined;
}

function normalizePromptId(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const promptId = candidate?.trim();

  return promptId ? promptId : undefined;
}

function normalizeFeedbackId(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const feedbackId = candidate?.trim();

  return feedbackId ? feedbackId : undefined;
}

function normalizeSortMode(value: string | string[] | undefined): LibrarySortMode {
  const candidate = Array.isArray(value) ? value[0] : value;

  return librarySortModes.includes(candidate as LibrarySortMode)
    ? (candidate as LibrarySortMode)
    : "recent";
}

function normalizeImprovementFilter(
  value: string | string[] | undefined,
): ImprovementFilterMode | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;

  return improvementFilterModes.includes(candidate as ImprovementFilterMode)
    ? (candidate as ImprovementFilterMode)
    : undefined;
}

function normalizeSourceReasonFilter(
  value: string | string[] | undefined,
): SourceReasonFilterMode | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;

  return sourceReasonFilterModes.includes(candidate as SourceReasonFilterMode)
    ? (candidate as SourceReasonFilterMode)
    : undefined;
}

function normalizeStudioPersistenceFilter(
  value: string | string[] | undefined,
): StudioPersistenceFilterMode | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;

  return studioPersistenceFilterModes.includes(
    candidate as StudioPersistenceFilterMode,
  )
    ? (candidate as StudioPersistenceFilterMode)
    : undefined;
}

function normalizeStudioSourceFilter(
  value: string | string[] | undefined,
): StudioSourceFilterMode | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;

  return studioSourceFilterModes.includes(candidate as StudioSourceFilterMode)
    ? (candidate as StudioSourceFilterMode)
    : undefined;
}

function normalizeStudioSourceVariantFilter(
  value: string | string[] | undefined,
): StudioSourceVariantFilterMode | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;

  return studioSourceVariantFilterModes.includes(
    candidate as StudioSourceVariantFilterMode,
  )
    ? (candidate as StudioSourceVariantFilterMode)
    : undefined;
}

function normalizePromptDetailMode(
  value: string | string[] | undefined,
): PromptDetailMode {
  const candidate = Array.isArray(value) ? value[0] : value;

  return promptDetailModes.includes(candidate as PromptDetailMode)
    ? (candidate as PromptDetailMode)
    : "current";
}

function normalizeGenerationEngine(
  value: string | string[] | undefined,
): GenerationEngineMode | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;

  return generationEngineModes.includes(candidate as GenerationEngineMode)
    ? (candidate as GenerationEngineMode)
    : undefined;
}

function normalizeLearningScope(
  value: string | string[] | undefined,
): LearningScopeMode | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;

  return learningScopeModes.includes(candidate as LearningScopeMode)
    ? (candidate as LearningScopeMode)
    : undefined;
}

function normalizeLibraryFocus(
  value: string | string[] | undefined,
): LibraryFocusTarget | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;

  return libraryFocusTargets.includes(candidate as LibraryFocusTarget)
    ? (candidate as LibraryFocusTarget)
    : undefined;
}

function normalizeTagFilter(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const tag = candidate?.trim();

  return tag ? tag : undefined;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const initialQuery = normalizeQuery(params.q);
  const initialSortMode = normalizeSortMode(params.sort);
  const initialTargetModel = normalizeTargetModel(params.model);
  const initialActiveModel = normalizeTargetModel(params.version);
  const initialPromptId = normalizePromptId(params.prompt);
  const initialLanguageStrategy = normalizeLanguageStrategy(params.language);
  const initialOutputLanguage = normalizeOutputLanguage(params.output);
  const initialImprovementFilter = normalizeImprovementFilter(params.improvement);
  const initialSourceReasonFilter = normalizeSourceReasonFilter(
    params.sourceReason,
  );
  const initialStudioPersistenceFilter = normalizeStudioPersistenceFilter(
    params.studio,
  );
  const initialStudioSourceFilter = normalizeStudioSourceFilter(
    params.studioSource,
  );
  const initialStudioSourceVariantFilter = normalizeStudioSourceVariantFilter(
    params.studioVariant,
  );
  const initialPromptDetailMode = normalizePromptDetailMode(params.view);
  const initialGenerationEngine = normalizeGenerationEngine(params.engine);
  const initialLearningScope = normalizeLearningScope(params.learn);
  const initialFocusTarget = normalizeLibraryFocus(params.focus);
  const initialFeedbackId = normalizeFeedbackId(params.feedback);
  const initialTagFilter = normalizeTagFilter(params.tag);
  const initialCompanyUpdated = Array.isArray(params.companyUpdated)
    ? params.companyUpdated[0] === "1"
    : params.companyUpdated === "1";
  const initialProfileUpdated = Array.isArray(params.profileUpdated)
    ? params.profileUpdated[0] === "1"
    : params.profileUpdated === "1";

  return (
    <LibraryView
      key={`${initialQuery ?? "all"}:${initialSortMode}:${
        initialTargetModel ?? "all"
      }:${
        initialLanguageStrategy ?? "all"
      }:${initialOutputLanguage ?? "all"}:${initialPromptId ?? "none"}:${
        initialActiveModel ?? "none"
      }:${initialImprovementFilter ?? "all"}:${
        initialSourceReasonFilter ?? "all"
      }:${initialStudioPersistenceFilter ?? "all"}:${
        initialStudioSourceFilter ?? "all"
      }:${initialStudioSourceVariantFilter ?? "all"}:${
        initialGenerationEngine ?? "all"
      }:${
        initialLearningScope ?? "all"
      }:${initialPromptDetailMode}:${
        initialCompanyUpdated ? "company-updated" : "clean"
      }:${initialProfileUpdated ? "profile-updated" : "clean"}:${
        initialFocusTarget ?? "none"
      }:${initialFeedbackId ?? "none"}:${initialTagFilter ?? "all"}`}
      initialQuery={initialQuery}
      initialSortMode={initialSortMode}
      initialPromptId={initialPromptId}
      initialActiveModel={initialActiveModel}
      initialLanguageStrategy={initialLanguageStrategy}
      initialOutputLanguage={initialOutputLanguage}
      initialTargetModel={initialTargetModel}
      initialImprovementFilter={initialImprovementFilter}
      initialSourceReasonFilter={initialSourceReasonFilter}
      initialStudioPersistenceFilter={initialStudioPersistenceFilter}
      initialStudioSourceFilter={initialStudioSourceFilter}
      initialStudioSourceVariantFilter={initialStudioSourceVariantFilter}
      initialPromptDetailMode={initialPromptDetailMode}
      initialGenerationEngine={initialGenerationEngine}
      initialLearningScope={initialLearningScope}
      initialCompanyUpdated={initialCompanyUpdated}
      initialProfileUpdated={initialProfileUpdated}
      initialFocusTarget={initialFocusTarget}
      initialFeedbackId={initialFeedbackId}
      initialTagFilter={initialTagFilter}
    />
  );
}
