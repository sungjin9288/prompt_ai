import { describe, expect, it } from "vitest";

import {
  buildLibraryHref,
  buildLibraryStudioSourceHref,
  buildSavedPromptLibraryHref,
  buildSavedPromptSkillHref,
  buildSavedPromptStudioOperationalGroupHref,
  buildSavedPromptStudioPersistenceHref,
  buildSavedPromptStudioSourceHref,
  buildStudioDraftSourceHref,
  getSavedPromptStudioPersistenceFilter,
} from "@/lib/studio-view/hrefs";
import type { PromptAsset, PromptStudioSourceMeta } from "@/lib/prompt";
import type { StudioDraft } from "@/lib/studio/draft";

function buildPrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  return {
    id: "prompt-1",
    title: "테스트 프롬프트",
    source: "local",
    rawInput: "입력",
    goal: "목표",
    domain: "범용",
    targetModels: ["general"],
    versions: [],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function buildDraft(overrides: Partial<StudioDraft> = {}): StudioDraft {
  return {
    source: "library-improvement",
    rawInput: "입력",
    goal: "목표",
    domain: "범용",
    targetModels: ["general"],
    outputLanguage: "korean",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildLibraryHref", () => {
  it("returns the bare /library path for empty params", () => {
    expect(buildLibraryHref(new URLSearchParams())).toBe("/library");
  });

  it("appends the query string for non-empty params", () => {
    const params = new URLSearchParams({ prompt: "abc" });

    expect(buildLibraryHref(params)).toBe("/library?prompt=abc");
  });
});

describe("buildLibraryStudioSourceHref", () => {
  it("builds an href with only the studioSource param by default", () => {
    const href = buildLibraryStudioSourceHref({ source: "library-operational-summary" });

    expect(href).toBe("/library?studioSource=library-operational-summary");
  });

  it("includes studio persistence, prompt id, and source variant when provided", () => {
    const href = buildLibraryStudioSourceHref({
      promptId: "prompt-1",
      source: "library-improvement",
      sourceVariant: "feedback-improvement",
      studioPersistence: "chain",
    });

    expect(href).toBe(
      "/library?studioSource=library-improvement&studio=chain&prompt=prompt-1&studioVariant=feedback-improvement",
    );
  });
});

describe("buildStudioDraftSourceHref", () => {
  it("prefers an explicit valid sourceHref over any source-based fallback", () => {
    const draft = buildDraft({ sourceHref: "/learning?scope=user" });

    expect(buildStudioDraftSourceHref(draft)).toBe("/learning?scope=user");
  });

  it("routes dashboard-* sources without a sourceHref to the home page", () => {
    const draft = buildDraft({ source: "dashboard-learning-ops", sourceHref: undefined });

    expect(buildStudioDraftSourceHref(draft)).toBe("/");
  });

  it("routes library-improvement drafts to the library filtered by prompt and version", () => {
    const draft = buildDraft({
      source: "library-improvement",
      sourceHref: undefined,
      sourcePromptId: "prompt-1",
      sourceVersionModel: "gpt",
    });

    expect(buildStudioDraftSourceHref(draft)).toBe("/library?prompt=prompt-1&version=gpt");
  });

  it("routes learning-memory drafts with a sourceTitle to a learning search", () => {
    const draft = buildDraft({
      source: "learning-memory",
      sourceHref: undefined,
      sourceTitle: "회사 기준 메모리",
    });

    expect(buildStudioDraftSourceHref(draft)).toBe(
      "/learning?q=%ED%9A%8C%EC%82%AC+%EA%B8%B0%EC%A4%80+%EB%A9%94%EB%AA%A8%EB%A6%AC",
    );
  });

  it("routes other library-* sources through buildLibraryStudioSourceHref", () => {
    const draft = buildDraft({
      source: "library-studio-source-candidate",
      sourceHref: undefined,
    });

    expect(buildStudioDraftSourceHref(draft)).toBe(
      "/library?studioSource=library-studio-source-candidate",
    );
  });

  it("routes skills-* sources to /skills", () => {
    const draft = buildDraft({ source: "skills-operational-summary", sourceHref: undefined });

    expect(buildStudioDraftSourceHref(draft)).toBe("/skills");
  });

  it("routes profile-* sources to the profile context editor", () => {
    const draft = buildDraft({ source: "profile-context-application", sourceHref: undefined });

    expect(buildStudioDraftSourceHref(draft)).toBe("/context?section=profile#profile");
  });

  it("routes company-* sources to the company context editor", () => {
    const draft = buildDraft({ source: "company-context-application", sourceHref: undefined });

    expect(buildStudioDraftSourceHref(draft)).toBe("/context?section=company#company");
  });

  it("falls back to /learning for any other source with no matching branch", () => {
    const draft = buildDraft({
      source: "integrations-operations-checklist",
      sourceHref: undefined,
    });

    expect(buildStudioDraftSourceHref(draft)).toBe("/learning");
  });
});

describe("buildSavedPromptLibraryHref", () => {
  it("builds an href keyed by the prompt id without a version", () => {
    expect(buildSavedPromptLibraryHref(buildPrompt())).toBe("/library?prompt=prompt-1");
  });

  it("includes the version param when supplied", () => {
    expect(buildSavedPromptLibraryHref(buildPrompt(), "claude")).toBe(
      "/library?prompt=prompt-1&version=claude",
    );
  });
});

describe("buildSavedPromptSkillHref", () => {
  it("builds a /skills href keyed by the prompt id", () => {
    expect(buildSavedPromptSkillHref(buildPrompt())).toBe("/skills?prompt=prompt-1");
  });
});

describe("buildSavedPromptStudioSourceHref", () => {
  it("returns null when the prompt has no studio source", () => {
    expect(buildSavedPromptStudioSourceHref(buildPrompt())).toBeNull();
  });

  it("builds a library href from the prompt's studio source", () => {
    const prompt = buildPrompt({
      studioSource: {
        source: "library-improvement",
        sourceVariant: "handoff-improvement",
      } as PromptStudioSourceMeta,
    });

    expect(buildSavedPromptStudioSourceHref(prompt)).toBe(
      "/library?studioSource=library-improvement&prompt=prompt-1&studioVariant=handoff-improvement",
    );
  });
});

describe("getSavedPromptStudioPersistenceFilter", () => {
  it("returns null when the prompt has no studio source", () => {
    expect(getSavedPromptStudioPersistenceFilter(buildPrompt())).toBeNull();
  });

  it("returns 'chain' for a library-improvement studio source", () => {
    const prompt = buildPrompt({
      studioSource: { source: "library-improvement" } as PromptStudioSourceMeta,
    });

    expect(getSavedPromptStudioPersistenceFilter(prompt)).toBe("chain");
  });

  it("returns 'ops' for any other studio source", () => {
    const prompt = buildPrompt({
      studioSource: { source: "dashboard-learning-ops" } as PromptStudioSourceMeta,
    });

    expect(getSavedPromptStudioPersistenceFilter(prompt)).toBe("ops");
  });
});

describe("buildSavedPromptStudioPersistenceHref", () => {
  it("returns null when the prompt has no studio source", () => {
    expect(buildSavedPromptStudioPersistenceHref(buildPrompt())).toBeNull();
  });

  it("builds an href with the studio persistence mode and prompt id", () => {
    const prompt = buildPrompt({
      studioSource: { source: "library-improvement" } as PromptStudioSourceMeta,
    });

    expect(buildSavedPromptStudioPersistenceHref(prompt)).toBe(
      "/library?studio=chain&prompt=prompt-1",
    );
  });
});

describe("buildSavedPromptStudioOperationalGroupHref", () => {
  it("returns null when the prompt has no studio source", () => {
    expect(buildSavedPromptStudioOperationalGroupHref(buildPrompt())).toBeNull();
  });

  it("builds the full operational-group href including the persistence filter", () => {
    const prompt = buildPrompt({
      studioSource: {
        source: "dashboard-learning-ops",
        sourceVariant: "learning-low-confidence-validation",
      } as PromptStudioSourceMeta,
    });

    expect(buildSavedPromptStudioOperationalGroupHref(prompt)).toBe(
      "/library?studioSource=dashboard-learning-ops&studio=ops&prompt=prompt-1&studioVariant=learning-low-confidence-validation",
    );
  });
});
