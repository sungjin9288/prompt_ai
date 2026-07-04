import { describe, expect, it } from "vitest";

import {
  getLeadingLanguageStrategy,
  getRecommendedLanguageStrategy,
  summarizeLanguageStrategyPerformance,
  type LanguageStrategyPerformance,
} from "@/lib/analytics/language-strategy";
import type {
  Feedback,
  PromptAsset,
  PromptScoreBreakdown,
  PromptSkill,
  PromptVersion,
} from "@/lib/prompt";

const scoreBreakdown: PromptScoreBreakdown = {
  clarity: 8,
  context: 8,
  outputFormat: 8,
  constraints: 8,
  expertise: 8,
  modelFit: 8,
  reusability: 8,
};

function buildVersion(qualityScore: number): PromptVersion {
  return {
    id: `version_${qualityScore}_${Math.random()}`,
    targetModel: "general",
    modelLabel: "범용",
    content: "테스트 프롬프트 본문",
    qualityScore,
    scoreBreakdown,
    assumptions: [],
    missingContext: [],
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function buildFeedback(rating: number, createdAt = "2026-01-02T00:00:00.000Z"): Feedback {
  return {
    id: `feedback_${rating}_${Math.random()}`,
    promptVersionId: "version_x",
    rating,
    comment: "테스트 피드백",
    feedbackType: "tone",
    createdAt,
  };
}

function buildPrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  return {
    id: `prompt_${Math.random()}`,
    title: "테스트 프롬프트",
    source: "local",
    rawInput: "테스트 입력",
    goal: "테스트 목표",
    domain: "범용",
    targetModels: ["general"],
    versions: [buildVersion(70)],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function buildSkill(overrides: Partial<PromptSkill> = {}): PromptSkill {
  return {
    id: `skill_${Math.random()}`,
    name: "테스트 스킬",
    description: "설명",
    domain: "범용",
    targetModel: "general",
    inputGuide: "가이드",
    promptTemplate: "템플릿",
    outputFormat: "형식",
    qualityChecklist: [],
    tags: [],
    usageCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("summarizeLanguageStrategyPerformance", () => {
  it("defaults prompts without an explicit languageStrategy to hybrid", () => {
    const prompts = [buildPrompt({ languageStrategy: undefined })];

    const summaries = summarizeLanguageStrategyPerformance(prompts, []);
    const hybrid = summaries.find((item) => item.strategy === "hybrid");
    const english = summaries.find((item) => item.strategy === "english");

    expect(hybrid?.promptCount).toBe(1);
    expect(english?.promptCount).toBe(0);
  });

  it("splits prompts and skills into their respective strategy buckets", () => {
    const prompts = [
      buildPrompt({ languageStrategy: "hybrid" }),
      buildPrompt({ languageStrategy: "english" }),
      buildPrompt({ languageStrategy: "english" }),
    ];
    const skills = [
      buildSkill({ languageStrategy: "hybrid" }),
      buildSkill({ languageStrategy: undefined }),
    ];

    const summaries = summarizeLanguageStrategyPerformance(prompts, skills);
    const hybrid = summaries.find((item) => item.strategy === "hybrid");
    const english = summaries.find((item) => item.strategy === "english");

    expect(hybrid?.promptCount).toBe(1);
    expect(hybrid?.skillCount).toBe(2);
    expect(english?.promptCount).toBe(2);
    expect(english?.skillCount).toBe(0);
  });

  it("computes success rate as the share of feedback rated 4 or higher", () => {
    const prompt = buildPrompt({
      languageStrategy: "hybrid",
      feedback: [buildFeedback(5), buildFeedback(4), buildFeedback(2), buildFeedback(1)],
    });

    const summaries = summarizeLanguageStrategyPerformance([prompt], []);
    const hybrid = summaries.find((item) => item.strategy === "hybrid");

    expect(hybrid?.feedbackCount).toBe(4);
    expect(hybrid?.successRate).toBe(50);
  });

  it("averages the best version score across prompts in the strategy", () => {
    const prompts = [
      buildPrompt({ languageStrategy: "english", versions: [buildVersion(60), buildVersion(80)] }),
      buildPrompt({ languageStrategy: "english", versions: [buildVersion(90)] }),
    ];

    const summaries = summarizeLanguageStrategyPerformance(prompts, []);
    const english = summaries.find((item) => item.strategy === "english");

    // best-of per prompt: 80 and 90 -> average 85
    expect(english?.averageQuality).toBe(85);
  });

  it("treats a prompt with no versions as contributing zero quality", () => {
    const prompt = buildPrompt({ languageStrategy: "hybrid", versions: [] });

    const summaries = summarizeLanguageStrategyPerformance([prompt], []);
    const hybrid = summaries.find((item) => item.strategy === "hybrid");

    expect(hybrid?.averageQuality).toBe(0);
  });

  it("marks a strategy as needs_data when feedback count is below 3", () => {
    const prompt = buildPrompt({
      languageStrategy: "hybrid",
      feedback: [buildFeedback(5), buildFeedback(5)],
    });

    const summaries = summarizeLanguageStrategyPerformance([prompt], []);
    const hybrid = summaries.find((item) => item.strategy === "hybrid");

    expect(hybrid?.status).toBe("needs_data");
  });

  it("marks a strategy as promising once feedback reaches 3 and success rate is at least 70", () => {
    const prompt = buildPrompt({
      languageStrategy: "hybrid",
      feedback: [buildFeedback(5), buildFeedback(4), buildFeedback(4)],
    });

    const summaries = summarizeLanguageStrategyPerformance([prompt], []);
    const hybrid = summaries.find((item) => item.strategy === "hybrid");

    expect(hybrid?.feedbackCount).toBe(3);
    expect(hybrid?.successRate).toBe(100);
    expect(hybrid?.status).toBe("promising");
  });

  it("marks a strategy as watch when feedback reaches 3 but success rate stays below 70", () => {
    const prompt = buildPrompt({
      languageStrategy: "hybrid",
      feedback: [buildFeedback(5), buildFeedback(2), buildFeedback(2)],
    });

    const summaries = summarizeLanguageStrategyPerformance([prompt], []);
    const hybrid = summaries.find((item) => item.strategy === "hybrid");

    expect(hybrid?.status).toBe("watch");
  });

  it("reports the most recently created prompt's date as latestPromptAt", () => {
    const prompts = [
      buildPrompt({ languageStrategy: "hybrid", createdAt: "2026-01-01T00:00:00.000Z" }),
      buildPrompt({ languageStrategy: "hybrid", createdAt: "2026-03-01T00:00:00.000Z" }),
      buildPrompt({ languageStrategy: "hybrid", createdAt: "2026-02-01T00:00:00.000Z" }),
    ];

    const summaries = summarizeLanguageStrategyPerformance(prompts, []);
    const hybrid = summaries.find((item) => item.strategy === "hybrid");

    expect(hybrid?.latestPromptAt).toBe("2026-03-01T00:00:00.000Z");
  });

  it("returns undefined latestPromptAt for a strategy with no prompts", () => {
    const summaries = summarizeLanguageStrategyPerformance([], []);
    const english = summaries.find((item) => item.strategy === "english");

    expect(english?.latestPromptAt).toBeUndefined();
  });
});

describe("getLeadingLanguageStrategy", () => {
  function buildSummary(
    overrides: Partial<LanguageStrategyPerformance>,
  ): LanguageStrategyPerformance {
    return {
      strategy: "hybrid",
      label: "한영 하이브리드",
      promptCount: 1,
      skillCount: 0,
      feedbackCount: 0,
      successRate: 0,
      averageQuality: 0,
      status: "needs_data",
      ...overrides,
    };
  }

  it("excludes strategies with zero prompts from contention", () => {
    const summaries = [
      buildSummary({ strategy: "hybrid", promptCount: 0, feedbackCount: 10, successRate: 90 }),
      buildSummary({ strategy: "english", promptCount: 2, feedbackCount: 1, successRate: 10 }),
    ];

    const leading = getLeadingLanguageStrategy(summaries);

    expect(leading?.strategy).toBe("english");
  });

  it("ranks by feedbackCount first even when successRate is lower", () => {
    const summaries = [
      buildSummary({ strategy: "hybrid", feedbackCount: 10, successRate: 40 }),
      buildSummary({ strategy: "english", feedbackCount: 3, successRate: 100 }),
    ];

    const leading = getLeadingLanguageStrategy(summaries);

    expect(leading?.strategy).toBe("hybrid");
  });

  it("breaks a feedbackCount tie using successRate", () => {
    const summaries = [
      buildSummary({ strategy: "hybrid", feedbackCount: 5, successRate: 40 }),
      buildSummary({ strategy: "english", feedbackCount: 5, successRate: 80 }),
    ];

    const leading = getLeadingLanguageStrategy(summaries);

    expect(leading?.strategy).toBe("english");
  });

  it("breaks a feedbackCount and successRate tie using averageQuality", () => {
    const summaries = [
      buildSummary({ strategy: "hybrid", feedbackCount: 5, successRate: 80, averageQuality: 60 }),
      buildSummary({ strategy: "english", feedbackCount: 5, successRate: 80, averageQuality: 90 }),
    ];

    const leading = getLeadingLanguageStrategy(summaries);

    expect(leading?.strategy).toBe("english");
  });

  it("returns undefined when no strategy has any prompts", () => {
    const summaries = [
      buildSummary({ strategy: "hybrid", promptCount: 0 }),
      buildSummary({ strategy: "english", promptCount: 0 }),
    ];

    expect(getLeadingLanguageStrategy(summaries)).toBeUndefined();
  });
});

describe("getRecommendedLanguageStrategy", () => {
  it("falls back to the default hybrid recommendation when no strategy has data", () => {
    const summaries = summarizeLanguageStrategyPerformance([], []);

    const recommendation = getRecommendedLanguageStrategy(summaries);

    expect(recommendation.strategy).toBe("hybrid");
    expect(recommendation.confidence).toBe("default");
  });

  it("recommends the leading strategy with strong confidence once it is promising", () => {
    const prompt = buildPrompt({
      languageStrategy: "english",
      feedback: [buildFeedback(5), buildFeedback(4), buildFeedback(5)],
    });
    const summaries = summarizeLanguageStrategyPerformance([prompt], []);

    const recommendation = getRecommendedLanguageStrategy(summaries);

    expect(recommendation.strategy).toBe("english");
    expect(recommendation.confidence).toBe("strong");
  });

  it("recommends the leading strategy with moderate confidence when feedback exists but is only 'watch'", () => {
    const prompt = buildPrompt({
      languageStrategy: "english",
      feedback: [buildFeedback(5), buildFeedback(1), buildFeedback(1)],
    });
    const summaries = summarizeLanguageStrategyPerformance([prompt], []);

    const recommendation = getRecommendedLanguageStrategy(summaries);

    expect(recommendation.strategy).toBe("english");
    expect(recommendation.confidence).toBe("moderate");
  });

  it("recommends by prompt volume with moderate confidence when feedback is under 3", () => {
    const prompts = [
      buildPrompt({ languageStrategy: "hybrid" }),
      buildPrompt({ languageStrategy: "hybrid" }),
      buildPrompt({ languageStrategy: "hybrid" }),
    ];
    const summaries = summarizeLanguageStrategyPerformance(prompts, []);

    const recommendation = getRecommendedLanguageStrategy(summaries);

    expect(recommendation.strategy).toBe("hybrid");
    expect(recommendation.confidence).toBe("moderate");
    expect(recommendation.reason).toContain("3개 프롬프트");
  });

  it("falls back to default hybrid when the leading strategy has fewer than 3 prompts and fewer than 3 feedback", () => {
    const prompt = buildPrompt({ languageStrategy: "english" });
    const summaries = summarizeLanguageStrategyPerformance([prompt], []);

    const recommendation = getRecommendedLanguageStrategy(summaries);

    expect(recommendation.strategy).toBe("hybrid");
    expect(recommendation.confidence).toBe("default");
  });
});
