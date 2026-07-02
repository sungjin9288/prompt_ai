import { normalizeInternalHref } from "@/lib/navigation/href";
import type { PromptAsset, TargetModel } from "@/lib/prompt";
import type { StudioDraft } from "@/lib/studio/draft";

export function buildLibraryHref(params: URLSearchParams) {
  const query = params.toString();
  const href = query ? `/library?${query}` : "/library";

  return normalizeInternalHref(href) ?? "/library";
}

export function buildLibraryStudioSourceHref({
  promptId,
  source,
  sourceVariant,
  studioPersistence,
}: {
  promptId?: string;
  source: StudioDraft["source"];
  sourceVariant?: StudioDraft["sourceVariant"];
  studioPersistence?: "chain" | "ops";
}) {
  const params = new URLSearchParams({ studioSource: source });

  if (studioPersistence) {
    params.set("studio", studioPersistence);
  }

  if (promptId) {
    params.set("prompt", promptId);
  }

  if (sourceVariant) {
    params.set("studioVariant", sourceVariant);
  }

  return buildLibraryHref(params);
}

export function buildStudioDraftSourceHref(draft: StudioDraft) {
  const sourceHref = normalizeInternalHref(draft.sourceHref);

  if (sourceHref) {
    return sourceHref;
  }

  if (draft.source.startsWith("dashboard-")) {
    return "/";
  }

  if (draft.source === "library-improvement") {
    const params = new URLSearchParams();

    if (draft.sourcePromptId) {
      params.set("prompt", draft.sourcePromptId);
    }

    if (draft.sourceVersionModel) {
      params.set("version", draft.sourceVersionModel);
    }

    return buildLibraryHref(params);
  }

  if (draft.source === "learning-memory" && draft.sourceTitle) {
    const params = new URLSearchParams({ q: draft.sourceTitle });

    return normalizeInternalHref(`/learning?${params.toString()}`) ?? "/learning";
  }

  if (draft.source.startsWith("library-")) {
    return buildLibraryStudioSourceHref({
      source: draft.source,
      sourceVariant: draft.sourceVariant,
    });
  }

  if (draft.source.startsWith("skills-")) {
    return "/skills";
  }

  if (draft.source.startsWith("profile-")) {
    return "/profile";
  }

  if (draft.source.startsWith("company-")) {
    return "/company";
  }

  return "/learning";
}

export function buildSavedPromptLibraryHref(prompt: PromptAsset, version?: TargetModel) {
  const params = new URLSearchParams({ prompt: prompt.id });

  if (version) {
    params.set("version", version);
  }

  return buildLibraryHref(params);
}

export function buildSavedPromptSkillHref(prompt: PromptAsset) {
  const params = new URLSearchParams({ prompt: prompt.id });

  return normalizeInternalHref(`/skills?${params.toString()}`) ?? "/skills";
}

export function buildSavedPromptStudioSourceHref(prompt: PromptAsset) {
  if (!prompt.studioSource) {
    return null;
  }

  return buildLibraryStudioSourceHref({
    promptId: prompt.id,
    source: prompt.studioSource.source,
    sourceVariant: prompt.studioSource.sourceVariant,
  });
}

export function getSavedPromptStudioPersistenceFilter(prompt: PromptAsset) {
  if (!prompt.studioSource) {
    return null;
  }

  return prompt.studioSource.source === "library-improvement"
    ? "chain"
    : "ops";
}

export function buildSavedPromptStudioPersistenceHref(prompt: PromptAsset) {
  const studioPersistence = getSavedPromptStudioPersistenceFilter(prompt);

  if (!studioPersistence) {
    return null;
  }

  const params = new URLSearchParams({
    studio: studioPersistence,
    prompt: prompt.id,
  });

  return buildLibraryHref(params);
}

export function buildSavedPromptStudioOperationalGroupHref(prompt: PromptAsset) {
  if (!prompt.studioSource) {
    return null;
  }

  const studioPersistence = getSavedPromptStudioPersistenceFilter(prompt);

  if (!studioPersistence) {
    return null;
  }

  return buildLibraryStudioSourceHref({
    promptId: prompt.id,
    source: prompt.studioSource.source,
    sourceVariant: prompt.studioSource.sourceVariant,
    studioPersistence,
  });
}

export function removeCompanyUpdatedSignalFromCurrentPath() {
  const url = new URL(window.location.href);

  url.searchParams.delete("companyUpdated");

  return `${url.pathname}${url.search}${url.hash}`;
}

export function removeProfileUpdatedSignalFromCurrentPath() {
  const url = new URL(window.location.href);

  url.searchParams.delete("profileUpdated");

  return `${url.pathname}${url.search}${url.hash}`;
}

export function removeDraftRequestFromCurrentPath() {
  const url = new URL(window.location.href);

  url.searchParams.delete("draft");

  return `${url.pathname}${url.search}${url.hash}`;
}

export function replaceCurrentPathWithoutDraftRequest() {
  window.history.replaceState(null, "", removeDraftRequestFromCurrentPath());
}
