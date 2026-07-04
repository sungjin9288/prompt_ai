import { describe, expect, it } from "vitest";

import {
  getLeadingOutputLanguage,
  getRecommendedOutputLanguage,
  summarizeOutputLanguagePerformance,
  type OutputLanguagePerformance,
} from "@/lib/analytics/output-language";
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

function buildFeedback(rating: number): Feedback {
  return {
    id: `feedback_${rating}_${Math.random()}`,
    promptVersionId: "version_x",
    rating,
    comment: "테스트 피드백",
    feedbackType: "tone",
    createdAt: "2026-01-02T00:00:00.000Z",
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

describe("summarizeOutputLanguagePerformance", () => {
  it("defaults prompts without an explicit outputLanguage to korean", () => {
    const prompts = [buildPrompt({ outputLanguage: undefined })];

    const summaries = summarizeOutputLanguagePerformance(prompts, []);
    const korean = summaries.find((item) => item.outputLanguage === "korean");
    const english = summaries.find((item) => item.outputLanguage === "english");

    expect(korean?.promptCount).toBe(1);
    expect(english?.promptCount).toBe(0);
  });

  it("buckets prompts and skills across all three output languages", () => {
    const prompts = [
      buildPrompt({ outputLanguage: "korean" }),
      buildPrompt({ outputLanguage: "english" }),
      buildPrompt({ outputLanguage: "same_as_input" }),
      buildPrompt({ outputLanguage: "same_as_input" }),
    ];
    const skills = [
      buildSkill({ outputLanguage: "english" }),
      buildSkill({ outputLanguage: undefined }),
    ];

    const summaries = summarizeOutputLanguagePerformance(prompts, skills);
    const korean = summaries.find((item) => item.outputLanguage === "korean");
    const english = summaries.find((item) => item.outputLanguage === "english");
    const sameAsInput = summaries.find((item) => item.outputLanguage === "same_as_input");

    expect(korean?.promptCount).toBe(1);
    expect(korean?.skillCount).toBe(1);
    expect(english?.promptCount).toBe(1);
    expect(english?.skillCount).toBe(1);
    expect(sameAsInput?.promptCount).toBe(2);
  });

  it("computes success rate as the share of feedback rated 4 or higher", () => {
    const prompt = buildPrompt({
      outputLanguage: "english",
      feedback: [buildFeedback(5), buildFeedback(3), buildFeedback(3), buildFeedback(2)],
    });

    const summaries = summarizeOutputLanguagePerformance([prompt], []);
    const english = summaries.find((item) => item.outputLanguage === "english");

    expect(english?.feedbackCount).toBe(4);
    expect(english?.successRate).toBe(25);
  });

  it("averages the best version score per prompt for the output language", () => {
    const prompts = [
      buildPrompt({ outputLanguage: "korean", versions: [buildVersion(50), buildVersion(70)] }),
      buildPrompt({ outputLanguage: "korean", versions: [buildVersion(30)] }),
    ];

    const summaries = summarizeOutputLanguagePerformance(prompts, []);
    const korean = summaries.find((item) => item.outputLanguage === "korean");

    // best-of per prompt: 70 and 30 -> average 50
    expect(korean?.averageQuality).toBe(50);
  });

  it("marks needs_data status when feedback is below 3", () => {
    const prompt = buildPrompt({
      outputLanguage: "korean",
      feedback: [buildFeedback(5)],
    });

    const summaries = summarizeOutputLanguagePerformance([prompt], []);
    const korean = summaries.find((item) => item.outputLanguage === "korean");

    expect(korean?.status).toBe("needs_data");
  });

  it("marks promising status once feedback reaches 3 with success rate at least 70", () => {
    const prompt = buildPrompt({
      outputLanguage: "korean",
      feedback: [buildFeedback(5), buildFeedback(4), buildFeedback(4)],
    });

    const summaries = summarizeOutputLanguagePerformance([prompt], []);
    const korean = summaries.find((item) => item.outputLanguage === "korean");

    expect(korean?.status).toBe("promising");
  });

  it("marks watch status once feedback reaches 3 but success rate stays below 70", () => {
    const prompt = buildPrompt({
      outputLanguage: "korean",
      feedback: [buildFeedback(5), buildFeedback(2), buildFeedback(2)],
    });

    const summaries = summarizeOutputLanguagePerformance([prompt], []);
    const korean = summaries.find((item) => item.outputLanguage === "korean");

    expect(korean?.status).toBe("watch");
  });

  it("reports the most recent prompt createdAt as latestPromptAt", () => {
    const prompts = [
      buildPrompt({ outputLanguage: "english", createdAt: "2026-01-01T00:00:00.000Z" }),
      buildPrompt({ outputLanguage: "english", createdAt: "2026-05-01T00:00:00.000Z" }),
    ];

    const summaries = summarizeOutputLanguagePerformance(prompts, []);
    const english = summaries.find((item) => item.outputLanguage === "english");

    expect(english?.latestPromptAt).toBe("2026-05-01T00:00:00.000Z");
  });
});

describe("getLeadingOutputLanguage", () => {
  function buildSummary(
    overrides: Partial<OutputLanguagePerformance>,
  ): OutputLanguagePerformance {
    return {
      outputLanguage: "korean",
      label: "한국어",
      promptCount: 1,
      skillCount: 0,
      feedbackCount: 0,
      successRate: 0,
      averageQuality: 0,
      status: "needs_data",
      ...overrides,
    };
  }

  it("excludes output languages with zero prompts", () => {
    const summaries = [
      buildSummary({ outputLanguage: "korean", promptCount: 0, feedbackCount: 20 }),
      buildSummary({ outputLanguage: "english", promptCount: 1, feedbackCount: 1 }),
    ];

    const leading = getLeadingOutputLanguage(summaries);

    expect(leading?.outputLanguage).toBe("english");
  });

  it("ranks by feedbackCount first", () => {
    const summaries = [
      buildSummary({ outputLanguage: "korean", feedbackCount: 8, successRate: 20 }),
      buildSummary({ outputLanguage: "english", feedbackCount: 2, successRate: 100 }),
    ];

    const leading = getLeadingOutputLanguage(summaries);

    expect(leading?.outputLanguage).toBe("korean");
  });

  it("breaks a feedbackCount tie using successRate, then averageQuality", () => {
    const tiedOnFeedback = [
      buildSummary({ outputLanguage: "korean", feedbackCount: 4, successRate: 50 }),
      buildSummary({ outputLanguage: "english", feedbackCount: 4, successRate: 90 }),
    ];
    const tiedOnSuccessRate = [
      buildSummary({
        outputLanguage: "korean",
        feedbackCount: 4,
        successRate: 90,
        averageQuality: 40,
      }),
      buildSummary({
        outputLanguage: "same_as_input",
        feedbackCount: 4,
        successRate: 90,
        averageQuality: 95,
      }),
    ];

    expect(getLeadingOutputLanguage(tiedOnFeedback)?.outputLanguage).toBe("english");
    expect(getLeadingOutputLanguage(tiedOnSuccessRate)?.outputLanguage).toBe("same_as_input");
  });

  it("returns undefined when nothing has prompt data", () => {
    const summaries = [
      buildSummary({ outputLanguage: "korean", promptCount: 0 }),
      buildSummary({ outputLanguage: "english", promptCount: 0 }),
      buildSummary({ outputLanguage: "same_as_input", promptCount: 0 }),
    ];

    expect(getLeadingOutputLanguage(summaries)).toBeUndefined();
  });
});

describe("getRecommendedOutputLanguage", () => {
  it("falls back to the default korean recommendation with no data", () => {
    const summaries = summarizeOutputLanguagePerformance([], []);

    const recommendation = getRecommendedOutputLanguage(summaries);

    expect(recommendation.outputLanguage).toBe("korean");
    expect(recommendation.confidence).toBe("default");
  });

  it("recommends the leading output language with strong confidence when promising", () => {
    const prompt = buildPrompt({
      outputLanguage: "english",
      feedback: [buildFeedback(5), buildFeedback(5), buildFeedback(4)],
    });
    const summaries = summarizeOutputLanguagePerformance([prompt], []);

    const recommendation = getRecommendedOutputLanguage(summaries);

    expect(recommendation.outputLanguage).toBe("english");
    expect(recommendation.confidence).toBe("strong");
  });

  it("recommends the leading output language with moderate confidence when only 'watch'", () => {
    const prompt = buildPrompt({
      outputLanguage: "same_as_input",
      feedback: [buildFeedback(5), buildFeedback(1), buildFeedback(1)],
    });
    const summaries = summarizeOutputLanguagePerformance([prompt], []);

    const recommendation = getRecommendedOutputLanguage(summaries);

    expect(recommendation.outputLanguage).toBe("same_as_input");
    expect(recommendation.confidence).toBe("moderate");
  });

  it("recommends by prompt volume with moderate confidence when feedback is under 3", () => {
    const prompts = [
      buildPrompt({ outputLanguage: "english" }),
      buildPrompt({ outputLanguage: "english" }),
      buildPrompt({ outputLanguage: "english" }),
    ];
    const summaries = summarizeOutputLanguagePerformance(prompts, []);

    const recommendation = getRecommendedOutputLanguage(summaries);

    expect(recommendation.outputLanguage).toBe("english");
    expect(recommendation.confidence).toBe("moderate");
    expect(recommendation.reason).toContain("3개 프롬프트");
  });

  it("falls back to default korean when leading language has under 3 prompts and under 3 feedback", () => {
    const prompt = buildPrompt({ outputLanguage: "english" });
    const summaries = summarizeOutputLanguagePerformance([prompt], []);

    const recommendation = getRecommendedOutputLanguage(summaries);

    expect(recommendation.outputLanguage).toBe("korean");
    expect(recommendation.confidence).toBe("default");
  });
});
