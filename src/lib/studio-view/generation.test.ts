import { describe, expect, it } from "vitest";

import {
  attachImprovementSource,
  attachLearningContextMeta,
  attachStudioSourceMeta,
  formatCountDelta,
  formatImprovementDepthLabel,
  formatModelLabels,
  formatScoreDelta,
  getDraftQualityImprovementBaseline,
  getImprovementTitleDepth,
  getNextImprovementDepth,
  getSelectOptions,
  getSourceImprovementDepth,
  sameTargetModels,
  stripImprovementTitlePrefix,
} from "@/lib/studio-view/generation";
import type {
  PromptAsset,
  PromptImprovementSource,
  PromptLearningContextMeta,
  PromptScoreBreakdown,
  PromptVersion,
} from "@/lib/prompt";
import type { StudioDraft } from "@/lib/studio/draft";
import type { LoadedStudioDraftSummary } from "@/lib/studio-view/draft-summary";

const scoreBreakdown: PromptScoreBreakdown = {
  clarity: 8,
  context: 8,
  outputFormat: 8,
  constraints: 8,
  expertise: 8,
  modelFit: 8,
  reusability: 8,
};

function buildVersion(overrides: Partial<PromptVersion> = {}): PromptVersion {
  return {
    id: "version-1",
    targetModel: "general",
    modelLabel: "범용",
    content: "내용",
    qualityScore: 70,
    scoreBreakdown,
    assumptions: [],
    missingContext: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
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
    versions: [buildVersion()],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("sameTargetModels", () => {
  it("returns true for identical model lists regardless of order", () => {
    expect(sameTargetModels(["gpt", "claude"], ["claude", "gpt"])).toBe(true);
  });

  it("returns false when the lists have different lengths", () => {
    expect(sameTargetModels(["gpt"], ["gpt", "claude"])).toBe(false);
  });

  it("returns false when the lists have the same length but different models", () => {
    expect(sameTargetModels(["gpt", "claude"], ["gpt", "gemini"])).toBe(false);
  });

  it("returns true for two empty lists", () => {
    expect(sameTargetModels([], [])).toBe(true);
  });
});

describe("formatModelLabels", () => {
  it("joins model labels with a comma and space", () => {
    expect(formatModelLabels(["gpt", "claude"])).toBe("GPT, Claude");
  });

  it("returns an empty string for an empty model list", () => {
    expect(formatModelLabels([])).toBe("");
  });
});

describe("getSelectOptions", () => {
  it("returns the options unchanged when the current value is already included", () => {
    expect(getSelectOptions(["a", "b"], "a")).toEqual(["a", "b"]);
  });

  it("prepends the current value when it is missing from the options", () => {
    expect(getSelectOptions(["a", "b"], "c")).toEqual(["c", "a", "b"]);
  });

  it("returns the options unchanged when the current value is empty", () => {
    expect(getSelectOptions(["a", "b"], "")).toEqual(["a", "b"]);
  });
});

describe("stripImprovementTitlePrefix", () => {
  it("strips a numbered improvement prefix", () => {
    expect(stripImprovementTitlePrefix("2차 개선본 · 원본 제목")).toBe("원본 제목");
  });

  it("strips an un-numbered improvement prefix", () => {
    expect(stripImprovementTitlePrefix("개선본 · 원본 제목")).toBe("원본 제목");
  });

  it("strips repeated nested improvement prefixes", () => {
    expect(stripImprovementTitlePrefix("3차 개선본 · 2차 개선본 · 원본 제목")).toBe("원본 제목");
  });

  it("returns the fallback title when stripping leaves an empty string", () => {
    expect(stripImprovementTitlePrefix("개선본 · ")).toBe("원본 프롬프트");
  });

  it("returns titles without a prefix unchanged (aside from trimming)", () => {
    expect(stripImprovementTitlePrefix("  평범한 제목  ")).toBe("평범한 제목");
  });
});

describe("getImprovementTitleDepth", () => {
  it("extracts the numeric depth from a numbered improvement title", () => {
    expect(getImprovementTitleDepth("4차 개선본 · 제목")).toBe(4);
  });

  it("returns 1 for an un-numbered improvement title", () => {
    expect(getImprovementTitleDepth("개선본 · 제목")).toBe(1);
  });

  it("returns 0 for a title with no improvement prefix", () => {
    expect(getImprovementTitleDepth("평범한 제목")).toBe(0);
  });
});

describe("getSourceImprovementDepth", () => {
  it("falls back to the title-derived depth when the source prompt cannot be found", () => {
    const source: PromptImprovementSource = {
      type: "library-improvement",
      sourcePromptId: "missing-id",
      sourcePromptTitle: "2차 개선본 · 원본",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    expect(getSourceImprovementDepth(source, [])).toBe(2);
  });

  it("walks the improvementSource chain to compute depth", () => {
    const original = buildPrompt({ id: "p0", title: "원본" });
    const first = buildPrompt({
      id: "p1",
      title: "1차 개선본 · 원본",
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "p0",
        sourcePromptTitle: "원본",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    const second = buildPrompt({
      id: "p2",
      title: "2차 개선본 · 원본",
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "p1",
        sourcePromptTitle: "1차 개선본 · 원본",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });
    const prompts = [original, first, second];

    const source: PromptImprovementSource = {
      type: "library-improvement",
      sourcePromptId: "p2",
      sourcePromptTitle: "2차 개선본 · 원본",
      createdAt: "2026-01-03T00:00:00.000Z",
    };

    // p2 -> p1 -> p0 (has no improvementSource) = depth 2
    expect(getSourceImprovementDepth(source, prompts)).toBe(2);
  });

  it("stops walking the chain if a cycle is detected to avoid an infinite loop", () => {
    const cyclicA = buildPrompt({
      id: "a",
      title: "A",
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "b",
        sourcePromptTitle: "B",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    const cyclicB = buildPrompt({
      id: "b",
      title: "B",
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "a",
        sourcePromptTitle: "A",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
    const prompts = [cyclicA, cyclicB];

    const source: PromptImprovementSource = {
      type: "library-improvement",
      sourcePromptId: "a",
      sourcePromptTitle: "A",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    expect(() => getSourceImprovementDepth(source, prompts)).not.toThrow();
    expect(Number.isFinite(getSourceImprovementDepth(source, prompts))).toBe(true);
  });
});

describe("getNextImprovementDepth", () => {
  it("returns 0 when there is no improvement source", () => {
    expect(getNextImprovementDepth(null, [])).toBe(0);
  });

  it("returns the source depth plus one when an improvement source exists", () => {
    const source: PromptImprovementSource = {
      type: "library-improvement",
      sourcePromptId: "missing",
      sourcePromptTitle: "2차 개선본 · 원본",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    expect(getNextImprovementDepth(source, [])).toBe(3);
  });
});

describe("attachImprovementSource", () => {
  it("returns the prompt unchanged when there is no improvement source", () => {
    const prompt = buildPrompt();

    expect(attachImprovementSource(prompt, null, [])).toBe(prompt);
  });

  it("retitles the prompt using the computed improvement depth and attaches the source", () => {
    const prompt = buildPrompt({ title: "무관한 제목" });
    const source: PromptImprovementSource = {
      type: "library-improvement",
      sourcePromptId: "missing",
      sourcePromptTitle: "1차 개선본 · 기존 제목",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    const result = attachImprovementSource(prompt, source, []);

    expect(result.title).toBe("2차 개선본 · 기존 제목");
    expect(result.improvementSource).toEqual(source);
    // original prompt object is not mutated
    expect(prompt.title).toBe("무관한 제목");
  });
});

describe("getDraftQualityImprovementBaseline", () => {
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

  it("returns null when the draft source is not library-improvement", () => {
    const draft = buildDraft({ source: "learning-memory" });

    expect(getDraftQualityImprovementBaseline(draft, [])).toBeNull();
  });

  it("returns null when sourcePromptId or sourceVersionId is missing", () => {
    const draft = buildDraft({ sourcePromptId: undefined, sourceVersionId: "v1" });

    expect(getDraftQualityImprovementBaseline(draft, [])).toBeNull();
  });

  it("returns null when the referenced prompt or version cannot be found", () => {
    const draft = buildDraft({ sourcePromptId: "missing", sourceVersionId: "v1" });

    expect(getDraftQualityImprovementBaseline(draft, [buildPrompt()])).toBeNull();
  });

  it("returns the baseline prompt and version when both are found", () => {
    const version = buildVersion({ id: "v1" });
    const prompt = buildPrompt({ id: "prompt-1", versions: [version] });
    const draft = buildDraft({ sourcePromptId: "prompt-1", sourceVersionId: "v1" });

    const baseline = getDraftQualityImprovementBaseline(draft, [prompt]);

    expect(baseline?.prompt).toBe(prompt);
    expect(baseline?.version).toBe(version);
    expect(baseline?.appliedAt).toBe(draft.createdAt);
  });
});

describe("attachLearningContextMeta", () => {
  it("returns a new prompt object with the learningContext attached", () => {
    const prompt = buildPrompt();
    const learningContext: PromptLearningContextMeta = {
      enabledScopes: { user: true, company: false, domain: false, skill: false },
      appliedMemoryCount: 1,
      recentFeedbackCount: 0,
      appliedMemoryIds: ["memory-1"],
      appliedMemoryTitles: ["제목"],
      appliedMemoryScopes: ["user"],
    };

    const result = attachLearningContextMeta(prompt, learningContext);

    expect(result.learningContext).toEqual(learningContext);
    expect(result).not.toBe(prompt);
    expect(prompt.learningContext).toBeUndefined();
  });
});

describe("attachStudioSourceMeta", () => {
  it("returns the prompt unchanged when no source summary is given", () => {
    const prompt = buildPrompt();

    expect(attachStudioSourceMeta(prompt, null)).toBe(prompt);
  });

  it("attaches a normalized studioSource when a source summary is given", () => {
    const prompt = buildPrompt();
    const summary: LoadedStudioDraftSummary = {
      source: "library-improvement",
      href: "/library?prompt=abc",
      inputCharCount: 42,
      inputLineCount: 3,
      inputPreview: "미리보기",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    const result = attachStudioSourceMeta(prompt, summary);

    expect(result.studioSource?.source).toBe("library-improvement");
    expect(result.studioSource?.sourceHref).toBe("/library?prompt=abc");
    expect(result.studioSource?.inputCharCount).toBe(42);
  });
});

describe("formatImprovementDepthLabel", () => {
  it("labels depth 0 and 1 both as '1차 개선본'", () => {
    expect(formatImprovementDepthLabel(0)).toBe("1차 개선본");
    expect(formatImprovementDepthLabel(1)).toBe("1차 개선본");
  });

  it("labels deeper depths with their own number", () => {
    expect(formatImprovementDepthLabel(3)).toBe("3차 개선본");
  });
});

describe("formatScoreDelta", () => {
  it("prefixes a positive delta with a plus sign and one decimal place", () => {
    expect(formatScoreDelta(4.567)).toBe("+4.6");
  });

  it("does not add an extra sign for a negative delta", () => {
    expect(formatScoreDelta(-2.3)).toBe("-2.3");
  });

  it("prefixes zero with a plus sign", () => {
    expect(formatScoreDelta(0)).toBe("+0.0");
  });
});

describe("formatCountDelta", () => {
  it("prefixes a positive count delta with a plus sign", () => {
    expect(formatCountDelta(5)).toBe("+5");
  });

  it("does not add an extra sign for a negative count delta", () => {
    expect(formatCountDelta(-3)).toBe("-3");
  });

  it("prefixes zero with a plus sign", () => {
    expect(formatCountDelta(0)).toBe("+0");
  });
});
