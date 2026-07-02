import {
  type MemoryScope,
  type PromptAsset,
  type PromptStudioDraftSource,
  type PromptStudioDraftSourceVariant,
} from "@/lib/prompt";
import { normalizeInternalHref } from "@/lib/navigation/href";
import { type PromptSourceHealthIssueReason } from "@/lib/analytics/prompt-improvement";
import { type StudioPersistenceMode } from "@/lib/dashboard/shared";

export function normalizeDashboardInternalHref(href: string, fallback: string) {
  return normalizeInternalHref(href) ?? fallback;
}

export function buildDashboardLibraryHref(params = new URLSearchParams()) {
  const query = params.toString();
  const href = query ? `/library?${query}` : "/library";

  return normalizeDashboardInternalHref(href, "/library");
}

export function buildPromptLibraryHref(prompt: PromptAsset) {
  const params = new URLSearchParams({ prompt: prompt.id });
  const version = prompt.versions[0]?.targetModel;

  if (version) {
    params.set("version", version);
  }

  return buildDashboardLibraryHref(params);
}

export function buildSkillHref(skillId: string) {
  const params = new URLSearchParams({ skill: skillId });

  return normalizeDashboardInternalHref(`/skills?${params.toString()}`, "/skills");
}

export function targetModelLibraryHref(targetModel?: string) {
  const params = new URLSearchParams();

  if (targetModel) {
    params.set("model", targetModel);
  }

  return buildDashboardLibraryHref(params);
}

export function improvementLibraryHref({
  depth,
  domain,
  improvement,
  sourceReason,
  targetModel,
}: {
  depth?: number;
  domain?: string;
  improvement?:
    | "archived-source"
    | "improved"
    | "regressed"
    | "reimprovement"
    | "unmeasured";
  sourceReason?: PromptSourceHealthIssueReason;
  targetModel?: string;
} = {}) {
  const params = new URLSearchParams();
  const query = [
    "개선 효과",
    depth ? `${depth}차 개선본` : undefined,
    domain,
  ]
    .filter(Boolean)
    .join(" ");

  params.set("q", query);
  params.set("sort", "improvement");

  if (targetModel) {
    params.set("model", targetModel);
  }

  if (improvement) {
    params.set("improvement", improvement);
  }

  if (sourceReason) {
    params.set("sourceReason", sourceReason);
  }

  return buildDashboardLibraryHref(params);
}

export function languageStrategyLibraryHref(language?: string) {
  const params = new URLSearchParams();

  if (language) {
    params.set("language", language);
  }

  return buildDashboardLibraryHref(params);
}

export function outputLanguageLibraryHref(output?: string) {
  const params = new URLSearchParams();

  if (output) {
    params.set("output", output);
  }

  return buildDashboardLibraryHref(params);
}

export function generationEngineLibraryHref(engine?: string) {
  const params = new URLSearchParams();

  if (engine) {
    params.set("engine", engine);
  }

  return buildDashboardLibraryHref(params);
}

export function studioPersistenceLibraryHref(mode?: StudioPersistenceMode) {
  const params = new URLSearchParams();

  if (mode) {
    params.set("studio", mode);
  }

  return buildDashboardLibraryHref(params);
}

export function studioSourceLibraryHref({
  source,
  sourceVariant,
}: {
  source?: PromptStudioDraftSource;
  sourceVariant?: PromptStudioDraftSourceVariant;
} = {}) {
  const params = new URLSearchParams();

  if (source) {
    params.set("studioSource", source);
  }

  if (sourceVariant) {
    params.set("studioVariant", sourceVariant);
  }

  return buildDashboardLibraryHref(params);
}

export function learningScopeLibraryHref(scope?: MemoryScope | "untracked") {
  const params = new URLSearchParams();

  if (scope) {
    params.set("learn", scope);
  }

  return buildDashboardLibraryHref(params);
}

export function learningScopeLearningHref(scope?: MemoryScope | "untracked") {
  const href =
    scope && scope !== "untracked" ? `/learning?scope=${scope}` : "/learning";

  return normalizeDashboardInternalHref(href, "/learning");
}

export function feedbackImprovementLearningHref() {
  const params = new URLSearchParams({
    q: "feedback-improvement",
    sort: "updated-desc",
  });

  return normalizeDashboardInternalHref(
    `/learning?${params.toString()}`,
    "/learning",
  );
}

export function promptDetailLibraryHref(
  promptId?: string,
  targetModel?: string,
  view?: "comparison",
) {
  if (!promptId) {
    return improvementLibraryHref();
  }

  const params = new URLSearchParams({ prompt: promptId });

  if (targetModel) {
    params.set("version", targetModel);
  }

  if (view) {
    params.set("view", view);
  }

  return buildDashboardLibraryHref(params);
}

export function promptFeedbackLibraryHref(
  promptId?: string,
  feedbackId?: string,
  targetModel?: string,
) {
  if (!promptId || !feedbackId) {
    return promptDetailLibraryHref(promptId, targetModel);
  }

  const params = new URLSearchParams({ prompt: promptId });

  if (targetModel) {
    params.set("version", targetModel);
  }

  params.set("focus", "feedback");
  params.set("feedback", feedbackId);

  return buildDashboardLibraryHref(params);
}
