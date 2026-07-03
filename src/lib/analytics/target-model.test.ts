import { describe, expect, it } from "vitest";

import {
  getLeadingTargetModel,
  getRecommendedTargetModel,
  summarizeTargetModelPerformance,
} from "@/lib/analytics/target-model";
import type {
  Feedback,
  PromptAsset,
  PromptScoreBreakdown,
  PromptSkill,
  PromptVersion,
} from "@/lib/prompt/types";

function makeScoreBreakdown(): PromptScoreBreakdown {
  return {
    clarity: 4,
    context: 4,
    outputFormat: 4,
    constraints: 4,
    expertise: 4,
    modelFit: 4,
    reusability: 4,
  };
}

function makeVersion(overrides: Partial<PromptVersion> = {}): PromptVersion {
  return {
    id: "version-1",
    targetModel: "claude",
    modelLabel: "Claude",
    content: "본문",
    qualityScore: 4.0,
    scoreBreakdown: makeScoreBreakdown(),
    assumptions: [],
    missingContext: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: "feedback-1",
    promptVersionId: "version-1",
    rating: 5,
    comment: "좋음",
    feedbackType: "tone",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makePrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  return {
    id: "prompt-1",
    title: "제목",
    source: "local",
    rawInput: "원문",
    goal: "목표",
    domain: "리서치",
    targetModels: ["claude"],
    versions: [makeVersion()],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeSkill(overrides: Partial<PromptSkill> = {}): PromptSkill {
  return {
    id: "skill-1",
    name: "스킬",
    description: "설명",
    domain: "리서치",
    targetModel: "claude",
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

describe("summarizeTargetModelPerformance", () => {
  it("returns an entry for every configured target model even with no prompts", () => {
    const summaries = summarizeTargetModelPerformance([], []);

    expect(summaries.length).toBeGreaterThan(0);
    expect(summaries.every((item) => item.promptCount === 0)).toBe(true);
  });

  it("counts prompt versions per target model, not per prompt", () => {
    const prompt = makePrompt({
      versions: [
        makeVersion({ id: "v1", targetModel: "claude" }),
        makeVersion({ id: "v2", targetModel: "gpt" }),
      ],
    });

    const summaries = summarizeTargetModelPerformance([prompt], []);
    const claude = summaries.find((item) => item.targetModel === "claude");
    const gpt = summaries.find((item) => item.targetModel === "gpt");

    expect(claude?.promptCount).toBe(1);
    expect(gpt?.promptCount).toBe(1);
  });

  it("counts skills scoped to each target model", () => {
    const skills = [makeSkill({ id: "s1", targetModel: "claude" }), makeSkill({ id: "s2", targetModel: "gpt" })];

    const summaries = summarizeTargetModelPerformance([], skills);
    const claude = summaries.find((item) => item.targetModel === "claude");

    expect(claude?.skillCount).toBe(1);
  });

  it("only counts feedback tied to versions of the matching target model", () => {
    const prompt = makePrompt({
      versions: [makeVersion({ id: "claude-v1", targetModel: "claude" })],
      feedback: [makeFeedback({ id: "f1", promptVersionId: "claude-v1", rating: 5 })],
    });

    const summaries = summarizeTargetModelPerformance([prompt], []);
    const claude = summaries.find((item) => item.targetModel === "claude");
    const gpt = summaries.find((item) => item.targetModel === "gpt");

    expect(claude?.feedbackCount).toBe(1);
    expect(gpt?.feedbackCount).toBe(0);
  });

  it("computes averageQuality as the mean qualityScore across that model's versions", () => {
    const prompt = makePrompt({
      versions: [
        makeVersion({ id: "v1", targetModel: "claude", qualityScore: 3.0 }),
        makeVersion({ id: "v2", targetModel: "claude", qualityScore: 5.0 }),
      ],
    });

    const summaries = summarizeTargetModelPerformance([prompt], []);
    const claude = summaries.find((item) => item.targetModel === "claude");

    expect(claude?.averageQuality).toBeCloseTo(4.0, 5);
  });
});

describe("getLeadingTargetModel", () => {
  it("returns undefined when no target model has any prompt versions", () => {
    const summaries = summarizeTargetModelPerformance([], []);

    expect(getLeadingTargetModel(summaries)).toBeUndefined();
  });

  it("prefers the model with more feedback over one with more prompts but less feedback", () => {
    const prompt = makePrompt({
      versions: [
        makeVersion({ id: "claude-v1", targetModel: "claude" }),
        makeVersion({ id: "gpt-v1", targetModel: "gpt" }),
        makeVersion({ id: "gpt-v2", targetModel: "gpt" }),
      ],
      feedback: [makeFeedback({ id: "f1", promptVersionId: "claude-v1", rating: 5 })],
    });

    const summaries = summarizeTargetModelPerformance([prompt], []);
    const leading = getLeadingTargetModel(summaries);

    expect(leading?.targetModel).toBe("claude");
  });
});

describe("getRecommendedTargetModel", () => {
  it("defaults to gpt with 'default' confidence when there is no leading model", () => {
    const summaries = summarizeTargetModelPerformance([], []);

    const recommendation = getRecommendedTargetModel(summaries);

    expect(recommendation.targetModel).toBe("gpt");
    expect(recommendation.confidence).toBe("default");
  });

  it("recommends the leading model with at least moderate confidence once it has 3+ feedback entries", () => {
    const prompt = makePrompt({
      versions: [makeVersion({ id: "claude-v1", targetModel: "claude" })],
      feedback: [
        makeFeedback({ id: "f1", promptVersionId: "claude-v1", rating: 5 }),
        makeFeedback({ id: "f2", promptVersionId: "claude-v1", rating: 5 }),
        makeFeedback({ id: "f3", promptVersionId: "claude-v1", rating: 5 }),
      ],
    });

    const summaries = summarizeTargetModelPerformance([prompt], []);
    const recommendation = getRecommendedTargetModel(summaries);

    expect(recommendation.targetModel).toBe("claude");
    expect(["moderate", "strong"]).toContain(recommendation.confidence);
  });
});
