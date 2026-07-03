import { normalizeInternalHref } from "@/lib/navigation/href";
import type { LearningReviewFilter, LearningScopeFilter, LearningSortMode } from "./labels";

export const learningReadinessHref = "/learning#readiness";
export const feedbackImprovementValidationLibraryHref =
  normalizeInternalHref(
    "/library?studioSource=learning-feedback-improvement&studioVariant=learning-low-confidence-validation",
  ) ?? "/library";
export const feedbackImprovementReleaseGateCommand =
  "npm run verify:evidence -- --out-dir docs/evidence\nnpm run verify:release-candidate";

export function buildLearningHref(params: URLSearchParams) {
  const queryString = params.toString();
  const href = queryString ? `/learning?${queryString}` : "/learning";

  return normalizeInternalHref(href) ?? "/learning";
}

export function getLearningHref({
  query,
  reviewFilter,
  scope,
  sortMode,
}: {
  query: string;
  reviewFilter: LearningReviewFilter;
  scope: LearningScopeFilter;
  sortMode: LearningSortMode;
}) {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();

  if (scope !== "all") {
    params.set("scope", scope);
  }

  if (reviewFilter !== "all") {
    params.set("review", reviewFilter);
  }

  if (sortMode !== "confidence-desc") {
    params.set("sort", sortMode);
  }

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  return buildLearningHref(params);
}
