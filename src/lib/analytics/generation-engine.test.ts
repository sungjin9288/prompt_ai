import { describe, expect, it } from "vitest";

import {
  getLeadingGenerationEngine,
  summarizeGenerationEnginePerformance,
} from "@/lib/analytics/generation-engine";
import type { Feedback, PromptAsset, PromptScoreBreakdown, PromptVersion } from "@/lib/prompt/types";

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

describe("summarizeGenerationEnginePerformance", () => {
  it("returns a summary entry for both local and openai engines even with no prompts", () => {
    const summaries = summarizeGenerationEnginePerformance([]);

    expect(summaries.map((item) => item.engine).sort()).toEqual(["local", "openai"]);
    expect(summaries.every((item) => item.promptCount === 0)).toBe(true);
    expect(summaries.every((item) => item.status === "needs_data")).toBe(true);
  });

  it("splits prompts by source into the matching engine bucket", () => {
    const localPrompt = makePrompt({ id: "local-1", source: "local" });
    const openaiPrompt = makePrompt({ id: "openai-1", source: "openai" });

    const summaries = summarizeGenerationEnginePerformance([localPrompt, openaiPrompt]);
    const local = summaries.find((item) => item.engine === "local");
    const openai = summaries.find((item) => item.engine === "openai");

    expect(local?.promptCount).toBe(1);
    expect(openai?.promptCount).toBe(1);
  });

  it("computes averageQuality as the mean of each prompt's best version score", () => {
    const promptA = makePrompt({
      id: "a",
      source: "local",
      versions: [makeVersion({ id: "a1", qualityScore: 3.0 }), makeVersion({ id: "a2", qualityScore: 5.0 })],
    });
    const promptB = makePrompt({
      id: "b",
      source: "local",
      versions: [makeVersion({ id: "b1", qualityScore: 4.0 })],
    });

    const summaries = summarizeGenerationEnginePerformance([promptA, promptB]);
    const local = summaries.find((item) => item.engine === "local");

    expect(local?.averageQuality).toBeCloseTo(4.5, 5);
  });

  it("marks status as needs_data when feedback count is below 3", () => {
    const prompt = makePrompt({
      source: "openai",
      feedback: [makeFeedback({ rating: 5 }), makeFeedback({ id: "f2", rating: 5 })],
    });

    const summaries = summarizeGenerationEnginePerformance([prompt]);
    const openai = summaries.find((item) => item.engine === "openai");

    expect(openai?.status).toBe("needs_data");
  });

  it("marks status as promising when feedback >= 3 and success rate >= 70", () => {
    const prompt = makePrompt({
      source: "openai",
      feedback: [
        makeFeedback({ id: "f1", rating: 5 }),
        makeFeedback({ id: "f2", rating: 5 }),
        makeFeedback({ id: "f3", rating: 4 }),
      ],
    });

    const summaries = summarizeGenerationEnginePerformance([prompt]);
    const openai = summaries.find((item) => item.engine === "openai");

    expect(openai?.status).toBe("promising");
    expect(openai?.successRate).toBe(100);
  });

  it("marks status as watch when feedback >= 3 but success rate is below 70", () => {
    const prompt = makePrompt({
      source: "openai",
      feedback: [
        makeFeedback({ id: "f1", rating: 2 }),
        makeFeedback({ id: "f2", rating: 2 }),
        makeFeedback({ id: "f3", rating: 5 }),
      ],
    });

    const summaries = summarizeGenerationEnginePerformance([prompt]);
    const openai = summaries.find((item) => item.engine === "openai");

    expect(openai?.status).toBe("watch");
  });

  it("summarizes modelUsage counts sorted by usage descending", () => {
    const prompts = [
      makePrompt({ id: "1", source: "openai", modelUsed: "gpt-5" }),
      makePrompt({ id: "2", source: "openai", modelUsed: "gpt-5" }),
      makePrompt({ id: "3", source: "openai", modelUsed: "gpt-5-mini" }),
    ];

    const summaries = summarizeGenerationEnginePerformance(prompts);
    const openai = summaries.find((item) => item.engine === "openai");

    expect(openai?.modelUsage[0]).toEqual({ model: "gpt-5", count: 2 });
  });
});

describe("getLeadingGenerationEngine", () => {
  it("returns undefined when no engine has any prompts", () => {
    const summaries = summarizeGenerationEnginePerformance([]);

    expect(getLeadingGenerationEngine(summaries)).toBeUndefined();
  });

  it("picks the engine with more feedback when prompt counts differ", () => {
    const localPrompt = makePrompt({
      id: "local-1",
      source: "local",
      feedback: [makeFeedback({ id: "f1" }), makeFeedback({ id: "f2" })],
    });
    const openaiPrompt = makePrompt({ id: "openai-1", source: "openai", feedback: [] });

    const summaries = summarizeGenerationEnginePerformance([localPrompt, openaiPrompt]);
    const leading = getLeadingGenerationEngine(summaries);

    expect(leading?.engine).toBe("local");
  });
});
