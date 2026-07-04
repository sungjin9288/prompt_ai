import { describe, expect, it } from "vitest";

import {
  buildDashboardLibraryHref,
  buildPromptLibraryHref,
  buildSkillHref,
  feedbackImprovementLearningHref,
  generationEngineLibraryHref,
  improvementLibraryHref,
  languageStrategyLibraryHref,
  learningScopeLearningHref,
  learningScopeLibraryHref,
  outputLanguageLibraryHref,
  promptDetailLibraryHref,
  promptFeedbackLibraryHref,
  studioPersistenceLibraryHref,
  studioSourceLibraryHref,
  targetModelLibraryHref,
} from "@/lib/dashboard/hrefs";
import type { PromptAsset, PromptScoreBreakdown } from "@/lib/prompt";

const scoreBreakdown: PromptScoreBreakdown = {
  clarity: 8,
  context: 8,
  outputFormat: 8,
  constraints: 8,
  expertise: 8,
  modelFit: 8,
  reusability: 8,
};

function encodeQueryValue(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

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

describe("buildDashboardLibraryHref", () => {
  it("returns the bare /library path for empty params", () => {
    expect(buildDashboardLibraryHref()).toBe("/library");
  });

  it("appends the query string for non-empty params", () => {
    expect(buildDashboardLibraryHref(new URLSearchParams({ model: "gpt" }))).toBe(
      "/library?model=gpt",
    );
  });
});

describe("buildPromptLibraryHref", () => {
  it("includes the first version's target model when versions exist", () => {
    const prompt = buildPrompt({
      versions: [
        {
          id: "v1",
          targetModel: "claude",
          modelLabel: "Claude",
          content: "내용",
          qualityScore: 80,
          scoreBreakdown,
          assumptions: [],
          missingContext: [],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    expect(buildPromptLibraryHref(prompt)).toBe("/library?prompt=prompt-1&version=claude");
  });

  it("omits the version param when there are no versions", () => {
    expect(buildPromptLibraryHref(buildPrompt())).toBe("/library?prompt=prompt-1");
  });
});

describe("buildSkillHref", () => {
  it("builds a /skills href keyed by skill id", () => {
    expect(buildSkillHref("skill-1")).toBe("/skills?skill=skill-1");
  });
});

describe("targetModelLibraryHref", () => {
  it("omits the model param when no target model is given", () => {
    expect(targetModelLibraryHref()).toBe("/library");
  });

  it("includes the model param when given", () => {
    expect(targetModelLibraryHref("codex")).toBe("/library?model=codex");
  });
});

describe("improvementLibraryHref", () => {
  it("builds the default query with only the improvement sort applied", () => {
    expect(improvementLibraryHref()).toBe(
      `/library?q=${encodeQueryValue("개선 효과")}&sort=improvement`,
    );
  });

  it("includes the depth and domain in the q param when provided", () => {
    const href = improvementLibraryHref({ depth: 2, domain: "마케팅" });

    expect(href).toBe(
      `/library?q=${encodeQueryValue("개선 효과 2차 개선본 마케팅")}&sort=improvement`,
    );
  });

  it("includes targetModel, improvement, and sourceReason params when provided", () => {
    const href = improvementLibraryHref({
      targetModel: "gpt",
      improvement: "regressed",
      sourceReason: "missing-source",
    });

    expect(href).toContain("model=gpt");
    expect(href).toContain("improvement=regressed");
    expect(href).toContain("sourceReason=missing-source");
  });
});

describe("languageStrategyLibraryHref / outputLanguageLibraryHref / generationEngineLibraryHref", () => {
  it("omit their param when no value is given", () => {
    expect(languageStrategyLibraryHref()).toBe("/library");
    expect(outputLanguageLibraryHref()).toBe("/library");
    expect(generationEngineLibraryHref()).toBe("/library");
  });

  it("set the matching query param when a value is given", () => {
    expect(languageStrategyLibraryHref("hybrid")).toBe("/library?language=hybrid");
    expect(outputLanguageLibraryHref("english")).toBe("/library?output=english");
    expect(generationEngineLibraryHref("openai")).toBe("/library?engine=openai");
  });
});

describe("studioPersistenceLibraryHref / studioSourceLibraryHref", () => {
  it("omit params when no arguments are given", () => {
    expect(studioPersistenceLibraryHref()).toBe("/library");
    expect(studioSourceLibraryHref()).toBe("/library");
  });

  it("include studio mode and source/variant params when given", () => {
    expect(studioPersistenceLibraryHref("chain")).toBe("/library?studio=chain");
    expect(
      studioSourceLibraryHref({
        source: "library-improvement",
        sourceVariant: "feedback-improvement",
      }),
    ).toBe("/library?studioSource=library-improvement&studioVariant=feedback-improvement");
  });
});

describe("learningScopeLibraryHref", () => {
  it("omits the learn param when no scope is given", () => {
    expect(learningScopeLibraryHref()).toBe("/library");
  });

  it("sets the learn param for a tracked scope", () => {
    expect(learningScopeLibraryHref("domain")).toBe("/library?learn=domain");
  });

  it("sets the learn param for the untracked pseudo-scope too", () => {
    expect(learningScopeLibraryHref("untracked")).toBe("/library?learn=untracked");
  });
});

describe("learningScopeLearningHref", () => {
  it("returns the bare /learning path when no scope is given", () => {
    expect(learningScopeLearningHref()).toBe("/learning");
  });

  it("returns the bare /learning path for the untracked pseudo-scope", () => {
    expect(learningScopeLearningHref("untracked")).toBe("/learning");
  });

  it("appends ?scope= for a real tracked scope", () => {
    expect(learningScopeLearningHref("skill")).toBe("/learning?scope=skill");
  });
});

describe("feedbackImprovementLearningHref", () => {
  it("builds a fixed learning search for feedback-improvement sorted by recency", () => {
    expect(feedbackImprovementLearningHref()).toBe(
      "/learning?q=feedback-improvement&sort=updated-desc",
    );
  });
});

describe("promptDetailLibraryHref", () => {
  it("falls back to improvementLibraryHref() when no promptId is given", () => {
    expect(promptDetailLibraryHref()).toBe(improvementLibraryHref());
  });

  it("builds an href from just the promptId when no other params are given", () => {
    expect(promptDetailLibraryHref("prompt-1")).toBe("/library?prompt=prompt-1");
  });

  it("includes targetModel and comparison view params when given", () => {
    expect(promptDetailLibraryHref("prompt-1", "gemini", "comparison")).toBe(
      "/library?prompt=prompt-1&version=gemini&view=comparison",
    );
  });
});

describe("promptFeedbackLibraryHref", () => {
  it("falls back to promptDetailLibraryHref when promptId or feedbackId is missing", () => {
    expect(promptFeedbackLibraryHref(undefined, "fb-1")).toBe(promptDetailLibraryHref(undefined));
    expect(promptFeedbackLibraryHref("prompt-1", undefined)).toBe(
      promptDetailLibraryHref("prompt-1"),
    );
  });

  it("builds an href focused on the feedback entry when both ids are present", () => {
    expect(promptFeedbackLibraryHref("prompt-1", "fb-1", "claude")).toBe(
      "/library?prompt=prompt-1&version=claude&focus=feedback&feedback=fb-1",
    );
  });
});
