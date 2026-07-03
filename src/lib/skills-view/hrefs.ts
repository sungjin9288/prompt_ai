import type { PromptAsset, TargetModel } from "@/lib/prompt";
import { normalizeInternalHref } from "@/lib/navigation/href";
import { getBestVersion } from "@/lib/skills/skill-builder";

export function buildSkillsRouteHref(
  pathname: "/library" | "/skills",
  params: URLSearchParams,
) {
  const query = params.toString();
  const href = query ? `${pathname}?${query}` : pathname;

  return normalizeInternalHref(href) ?? pathname;
}

export function buildPromptLibraryHref(promptId: string, version?: TargetModel) {
  const params = new URLSearchParams({ prompt: promptId });

  if (version) {
    params.set("version", version);
  }

  return buildSkillsRouteHref("/library", params);
}

export function buildSkillHref(skillId: string) {
  const params = new URLSearchParams({ skill: skillId });

  return buildSkillsRouteHref("/skills", params);
}

export function buildSkillRunLibraryHref(prompt: PromptAsset) {
  return buildPromptLibraryHref(prompt.id, getBestVersion(prompt).targetModel);
}
