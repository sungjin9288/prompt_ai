import { type PromptAsset, type PromptStudioSourceMeta, type TargetModel } from "@/lib/prompt";
import { normalizeInternalHref } from "@/lib/navigation/href";
import {
  type GenerationEngineFilter,
  type ImprovementFilter,
  type LanguageFilter,
  type LearningScopeFilter,
  type LibraryFocusTarget,
  type LibrarySortMode,
  type OutputLanguageFilter,
  type PromptDetailMode,
  type SourceReasonFilter,
  type StudioPersistenceFilter,
  type StudioSourceFilter,
  type StudioSourceVariantFilter,
  type TargetModelFilter,
} from "@/lib/library/labels";

export function getPromptStudioSourceHref(source?: PromptStudioSourceMeta) {
  return normalizeInternalHref(source?.sourceHref);
}

export function buildContextEditorHref({
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

export function getPromptStudioPersistenceFilter(prompt: PromptAsset) {
  if (!prompt.studioSource) {
    return "none" satisfies StudioPersistenceFilter;
  }

  return prompt.studioSource.source === "library-improvement"
    ? ("chain" satisfies StudioPersistenceFilter)
    : ("ops" satisfies StudioPersistenceFilter);
}

export function buildLibraryFilterHref({
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

export type LibraryFilterHrefOptions = Parameters<typeof buildLibraryFilterHref>[0];

export function buildLibraryDefaultFilterHref(
  overrides: Partial<LibraryFilterHrefOptions> = {},
) {
  return buildLibraryFilterHref({
    search: "",
    sort: "recent",
    language: "all",
    output: "all",
    model: "all",
    engine: "all",
    learning: "all",
    improvement: "all",
    ...overrides,
  });
}
