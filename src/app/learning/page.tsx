import {
  LearningView,
  type LearningReviewFilter,
  type LearningScopeFilter,
  type LearningSortMode,
} from "@/components/learning/learning-view";

const validLearningScopes: LearningScopeFilter[] = [
  "all",
  "user",
  "company",
  "domain",
  "skill",
];
const validLearningReviewFilters: LearningReviewFilter[] = [
  "all",
  "low-confidence",
  "manual",
  "generated",
];
const validLearningSortModes: LearningSortMode[] = [
  "confidence-desc",
  "confidence-asc",
  "updated-desc",
  "updated-asc",
];

function parseLearningScope(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return validLearningScopes.includes(rawValue as LearningScopeFilter)
    ? (rawValue as LearningScopeFilter)
    : "all";
}

function parseLearningReviewFilter(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return validLearningReviewFilters.includes(rawValue as LearningReviewFilter)
    ? (rawValue as LearningReviewFilter)
    : "all";
}

function parseLearningSortMode(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return validLearningSortModes.includes(rawValue as LearningSortMode)
    ? (rawValue as LearningSortMode)
    : "confidence-desc";
}

function parseLearningQuery(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return rawValue?.slice(0, 120) ?? "";
}

export default async function LearningPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    review?: string | string[];
    scope?: string | string[];
    sort?: string | string[];
  }>;
}) {
  const params = await searchParams;

  return (
    <LearningView
      initialQuery={parseLearningQuery(params.q)}
      initialReviewFilter={parseLearningReviewFilter(params.review)}
      initialScope={parseLearningScope(params.scope)}
      initialSortMode={parseLearningSortMode(params.sort)}
    />
  );
}
