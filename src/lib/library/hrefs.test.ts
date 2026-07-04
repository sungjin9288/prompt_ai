import { describe, expect, it } from "vitest";

import {
  buildContextEditorHref,
  buildLibraryDefaultFilterHref,
  buildLibraryFilterHref,
  getPromptStudioPersistenceFilter,
  getPromptStudioSourceHref,
} from "@/lib/library/hrefs";
import type { PromptAsset, PromptStudioSourceMeta } from "@/lib/prompt";

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

describe("getPromptStudioSourceHref", () => {
  it("returns undefined when the prompt has no studio source", () => {
    expect(getPromptStudioSourceHref(undefined)).toBeUndefined();
  });

  it("normalizes an internal href from the studio source", () => {
    const source = { sourceHref: "/library?prompt=abc" } as PromptStudioSourceMeta;

    expect(getPromptStudioSourceHref(source)).toBe("/library?prompt=abc");
  });

  it("rejects an external href from the studio source", () => {
    const source = { sourceHref: "https://evil.example.com/x" } as PromptStudioSourceMeta;

    expect(getPromptStudioSourceHref(source)).toBeUndefined();
  });
});

describe("buildContextEditorHref", () => {
  it("emits the /context?section=profile shape with a hash for the profile pathname", () => {
    const href = buildContextEditorHref({
      fallbackReturnTo: "/library",
      pathname: "/profile",
    });

    expect(href).toBe("/context?section=profile&returnTo=%2Flibrary#profile");
  });

  it("emits the /context?section=company shape with a hash for the company pathname", () => {
    const href = buildContextEditorHref({
      fallbackReturnTo: "/library",
      pathname: "/company",
    });

    expect(href).toBe("/context?section=company&returnTo=%2Flibrary#company");
  });

  it("prefers an explicit returnTo over the fallback", () => {
    const href = buildContextEditorHref({
      fallbackReturnTo: "/library",
      pathname: "/profile",
      returnTo: "/studio",
    });

    expect(href).toBe("/context?section=profile&returnTo=%2Fstudio#profile");
  });

  it("falls back to /library when both returnTo and fallbackReturnTo are invalid", () => {
    const href = buildContextEditorHref({
      fallbackReturnTo: "https://evil.example.com",
      pathname: "/profile",
      returnTo: "https://also-evil.example.com",
    });

    expect(href).toBe("/context?section=profile&returnTo=%2Flibrary#profile");
  });
});

describe("getPromptStudioPersistenceFilter", () => {
  it("returns 'none' when the prompt has no studio source", () => {
    expect(getPromptStudioPersistenceFilter(buildPrompt())).toBe("none");
  });

  it("returns 'chain' when the studio source is a library-improvement", () => {
    const prompt = buildPrompt({
      studioSource: {
        source: "library-improvement",
      } as PromptStudioSourceMeta,
    });

    expect(getPromptStudioPersistenceFilter(prompt)).toBe("chain");
  });

  it("returns 'ops' for any other studio source", () => {
    const prompt = buildPrompt({
      studioSource: {
        source: "dashboard-learning-ops",
      } as PromptStudioSourceMeta,
    });

    expect(getPromptStudioPersistenceFilter(prompt)).toBe("ops");
  });
});

describe("buildLibraryFilterHref", () => {
  const baseArgs = {
    search: "",
    sort: "recent" as const,
    language: "all" as const,
    output: "all" as const,
    model: "all" as const,
    engine: "all" as const,
    learning: "all" as const,
    improvement: "all" as const,
  };

  it("returns the bare /library path when every filter is at its default", () => {
    expect(buildLibraryFilterHref(baseArgs)).toBe("/library");
  });

  it("adds a q param for a trimmed search term", () => {
    const href = buildLibraryFilterHref({ ...baseArgs, search: "  광고 문구  " });

    expect(href).toBe(`/library?q=${encodeURIComponent("광고 문구").replace(/%20/g, "+")}`);
  });

  it("adds the model filter as ?model=", () => {
    expect(buildLibraryFilterHref({ ...baseArgs, model: "gpt" })).toBe("/library?model=gpt");
  });

  it("adds the engine filter as ?engine=", () => {
    expect(buildLibraryFilterHref({ ...baseArgs, engine: "openai" })).toBe(
      "/library?engine=openai",
    );
  });

  it("adds the language filter as ?language=", () => {
    expect(buildLibraryFilterHref({ ...baseArgs, language: "english" })).toBe(
      "/library?language=english",
    );
  });

  it("combines multiple non-default filters in a single query string", () => {
    const href = buildLibraryFilterHref({
      ...baseArgs,
      model: "claude",
      engine: "openai",
      language: "hybrid",
    });

    expect(href).toBe("/library?language=hybrid&model=claude&engine=openai");
  });

  it("adds prompt-detail params (version, view, focus, feedback) only when promptId is present", () => {
    const withoutPromptId = buildLibraryFilterHref({
      ...baseArgs,
      version: "gpt",
      detailMode: "comparison",
      focusTarget: "feedback",
      feedbackId: "fb-1",
    });
    const withPromptId = buildLibraryFilterHref({
      ...baseArgs,
      promptId: "prompt-1",
      version: "gpt",
      detailMode: "comparison",
      focusTarget: "feedback",
      feedbackId: "fb-1",
    });

    expect(withoutPromptId).toBe("/library");
    expect(withPromptId).toBe(
      "/library?prompt=prompt-1&version=gpt&view=comparison&focus=feedback&feedback=fb-1",
    );
  });

  it("trims promptId and feedbackId before including them", () => {
    const href = buildLibraryFilterHref({
      ...baseArgs,
      promptId: "  prompt-1  ",
      feedbackId: "  fb-1  ",
    });

    expect(href).toBe("/library?prompt=prompt-1&feedback=fb-1");
  });
});

describe("buildLibraryDefaultFilterHref", () => {
  it("returns the bare /library href with no overrides", () => {
    expect(buildLibraryDefaultFilterHref()).toBe("/library");
  });

  it("applies overrides on top of the all-defaults baseline", () => {
    expect(buildLibraryDefaultFilterHref({ model: "gemini" })).toBe("/library?model=gemini");
  });
});
