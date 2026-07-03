import { describe, expect, it } from "vitest";

import {
  buildImprovementScoreComparison,
  findPromptById,
  getImprovementActions,
  getImprovementQualityDelta,
  getLanguageStrategy,
  getOutputLanguage,
  getPromptBestQuality,
  getPromptImprovementDepth,
  getPromptImprovementStatus,
  getPromptSourceHealthIssueReason,
  hasArchivedSourcePrompt,
  isPromptReimprovementCandidate,
  promptMatchesLearningScope,
} from "@/lib/library/prompt-metrics";
import type {
  PromptAsset,
  PromptDeletedAsset,
  PromptScoreBreakdown,
  PromptVersion,
} from "@/lib/prompt/types";

function makeScoreBreakdown(overrides: Partial<PromptScoreBreakdown> = {}): PromptScoreBreakdown {
  return {
    clarity: 4,
    context: 4,
    outputFormat: 4,
    constraints: 4,
    expertise: 4,
    modelFit: 4,
    reusability: 4,
    ...overrides,
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

describe("getLanguageStrategy / getOutputLanguage", () => {
  it("defaults languageStrategy to hybrid and outputLanguage to korean when unset", () => {
    const prompt = makePrompt({ languageStrategy: undefined, outputLanguage: undefined });

    expect(getLanguageStrategy(prompt)).toBe("hybrid");
    expect(getOutputLanguage(prompt)).toBe("korean");
  });

  it("returns the explicitly set languageStrategy and outputLanguage", () => {
    const prompt = makePrompt({ languageStrategy: "english", outputLanguage: "english" });

    expect(getLanguageStrategy(prompt)).toBe("english");
    expect(getOutputLanguage(prompt)).toBe("english");
  });
});

describe("getPromptBestQuality", () => {
  it("returns the maximum qualityScore across all versions", () => {
    const prompt = makePrompt({
      versions: [
        makeVersion({ id: "v1", qualityScore: 3.0 }),
        makeVersion({ id: "v2", qualityScore: 4.7 }),
      ],
    });

    expect(getPromptBestQuality(prompt)).toBe(4.7);
  });
});

describe("promptMatchesLearningScope", () => {
  it("matches everything when filter is 'all'", () => {
    expect(promptMatchesLearningScope(makePrompt(), "all")).toBe(true);
  });

  it("matches only prompts without learningContext when filter is 'untracked'", () => {
    const untracked = makePrompt({ learningContext: undefined });
    const tracked = makePrompt({
      learningContext: {
        enabledScopes: { user: true, company: false, domain: false, skill: false },
        appliedMemoryCount: 1,
        recentFeedbackCount: 0,
        appliedMemoryIds: [],
        appliedMemoryTitles: [],
        appliedMemoryScopes: [],
      },
    });

    expect(promptMatchesLearningScope(untracked, "untracked")).toBe(true);
    expect(promptMatchesLearningScope(tracked, "untracked")).toBe(false);
  });

  it("matches a specific scope only when that scope is enabled in learningContext", () => {
    const withCompanyScope = makePrompt({
      learningContext: {
        enabledScopes: { user: false, company: true, domain: false, skill: false },
        appliedMemoryCount: 1,
        recentFeedbackCount: 0,
        appliedMemoryIds: [],
        appliedMemoryTitles: [],
        appliedMemoryScopes: [],
      },
    });

    expect(promptMatchesLearningScope(withCompanyScope, "company")).toBe(true);
    expect(promptMatchesLearningScope(withCompanyScope, "user")).toBe(false);
  });
});

describe("findPromptById", () => {
  it("finds a prompt among active prompts", () => {
    const prompt = makePrompt({ id: "active-1" });

    expect(findPromptById("active-1", [prompt], [])?.id).toBe("active-1");
  });

  it("falls back to deletedPrompts when the prompt is not active", () => {
    const deletedPrompt = makePrompt({ id: "deleted-1" });
    const deleted: PromptDeletedAsset[] = [
      { prompt: deletedPrompt, deletedAt: "2026-01-05T00:00:00.000Z" },
    ];

    expect(findPromptById("deleted-1", [], deleted)?.id).toBe("deleted-1");
  });

  it("returns undefined when promptId is undefined", () => {
    expect(findPromptById(undefined, [makePrompt()], [])).toBeUndefined();
  });
});

describe("hasArchivedSourcePrompt / getPromptSourceHealthIssueReason", () => {
  function makeImprovedPrompt(sourcePromptId: string) {
    return makePrompt({
      id: "improved-1",
      improvementSource: {
        type: "library-improvement",
        sourcePromptId,
        sourcePromptTitle: "원본",
        sourceVersionId: "version-1",
        sourceVersionModel: "claude",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });
  }

  it("returns true only when the source prompt exists in deletedPrompts but not in active prompts", () => {
    const sourcePrompt = makePrompt({ id: "source-1" });
    const improved = makeImprovedPrompt("source-1");
    const deleted: PromptDeletedAsset[] = [
      { prompt: sourcePrompt, deletedAt: "2026-01-05T00:00:00.000Z" },
    ];

    expect(hasArchivedSourcePrompt(improved, [], deleted)).toBe(true);
    expect(hasArchivedSourcePrompt(improved, [sourcePrompt], deleted)).toBe(false);
  });

  it("returns 'missing-source' when the source prompt cannot be found anywhere", () => {
    const improved = makeImprovedPrompt("does-not-exist");

    expect(getPromptSourceHealthIssueReason(improved, [], [])).toBe("missing-source");
  });

  it("returns 'archived-source' when the source prompt is only present among deletedPrompts", () => {
    const sourcePrompt = makePrompt({ id: "source-1" });
    const improved = makeImprovedPrompt("source-1");
    const deleted: PromptDeletedAsset[] = [
      { prompt: sourcePrompt, deletedAt: "2026-01-05T00:00:00.000Z" },
    ];

    expect(getPromptSourceHealthIssueReason(improved, [], deleted)).toBe("archived-source");
  });

  it("returns undefined for a prompt with no improvementSource", () => {
    expect(getPromptSourceHealthIssueReason(makePrompt(), [], [])).toBeUndefined();
  });
});

describe("getImprovementQualityDelta", () => {
  it("computes delta as improved minus source quality score", () => {
    const sourcePrompt = makePrompt({ id: "source-1", versions: [makeVersion({ id: "sv1", qualityScore: 3.0 })] });
    const improvedPrompt = makePrompt({
      id: "improved-1",
      versions: [makeVersion({ id: "iv1", qualityScore: 4.5, targetModel: "claude" })],
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "source-1",
        sourcePromptTitle: "원본",
        sourceVersionId: "sv1",
        sourceVersionModel: "claude",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    const delta = getImprovementQualityDelta({ improvementPrompt: improvedPrompt, sourcePrompt });

    expect(delta?.delta).toBeCloseTo(1.5, 5);
  });

  it("returns undefined when there is no source prompt", () => {
    const improvedPrompt = makePrompt();

    expect(getImprovementQualityDelta({ improvementPrompt: improvedPrompt })).toBeUndefined();
  });
});

describe("getPromptImprovementStatus", () => {
  it("returns 'improved' when the delta is non-negative", () => {
    const sourcePrompt = makePrompt({ id: "source-1", versions: [makeVersion({ id: "sv1", qualityScore: 3.0 })] });
    const improvedPrompt = makePrompt({
      id: "improved-1",
      versions: [makeVersion({ id: "iv1", qualityScore: 4.0, targetModel: "claude" })],
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "source-1",
        sourcePromptTitle: "원본",
        sourceVersionId: "sv1",
        sourceVersionModel: "claude",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    expect(getPromptImprovementStatus(improvedPrompt, [sourcePrompt], [])).toBe("improved");
  });

  it("returns 'unmeasured' when the delta cannot be computed", () => {
    const improvedPrompt = makePrompt({
      id: "improved-1",
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "missing-source",
        sourcePromptTitle: "원본",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    expect(getPromptImprovementStatus(improvedPrompt, [], [])).toBe("unmeasured");
  });
});

describe("isPromptReimprovementCandidate", () => {
  it("flags a prompt whose delta is non-positive as a reimprovement candidate", () => {
    const sourcePrompt = makePrompt({ id: "source-1", versions: [makeVersion({ id: "sv1", qualityScore: 4.0 })] });
    const improvedPrompt = makePrompt({
      id: "improved-1",
      versions: [makeVersion({ id: "iv1", qualityScore: 3.5, targetModel: "claude" })],
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "source-1",
        sourcePromptTitle: "원본",
        sourceVersionId: "sv1",
        sourceVersionModel: "claude",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    expect(isPromptReimprovementCandidate(improvedPrompt, [sourcePrompt], [])).toBe(true);
  });

  it("does not flag a strong positive-delta improvement above the quality threshold", () => {
    const sourcePrompt = makePrompt({ id: "source-1", versions: [makeVersion({ id: "sv1", qualityScore: 3.0 })] });
    const improvedPrompt = makePrompt({
      id: "improved-1",
      versions: [makeVersion({ id: "iv1", qualityScore: 4.8, targetModel: "claude" })],
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "source-1",
        sourcePromptTitle: "원본",
        sourceVersionId: "sv1",
        sourceVersionModel: "claude",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    expect(isPromptReimprovementCandidate(improvedPrompt, [sourcePrompt], [])).toBe(false);
  });
});

describe("getPromptImprovementDepth", () => {
  it("returns 0 for a prompt with no improvement lineage", () => {
    expect(getPromptImprovementDepth(makePrompt(), [], [])).toBe(0);
  });

  it("counts each improvement hop in a multi-step chain", () => {
    const promptA = makePrompt({ id: "a" });
    const promptB = makePrompt({
      id: "b",
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "a",
        sourcePromptTitle: "A",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });
    const promptC = makePrompt({
      id: "c",
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "b",
        sourcePromptTitle: "B",
        createdAt: "2026-01-03T00:00:00.000Z",
      },
    });

    expect(getPromptImprovementDepth(promptC, [promptA, promptB, promptC], [])).toBe(2);
  });
});

describe("buildImprovementScoreComparison", () => {
  it("classifies each score metric as improved, regressed, or unchanged", () => {
    const sourceVersion = makeVersion({
      scoreBreakdown: makeScoreBreakdown({ clarity: 3, context: 4, outputFormat: 4 }),
    });
    const improvedVersion = makeVersion({
      scoreBreakdown: makeScoreBreakdown({ clarity: 5, context: 3, outputFormat: 4 }),
    });

    const comparison = buildImprovementScoreComparison({ sourceVersion, improvedVersion });

    expect(comparison.improvedCount).toBe(1);
    expect(comparison.regressedCount).toBe(1);
    expect(comparison.strongestImprovement?.key).toBe("clarity");
    expect(comparison.reviewCandidate?.key).toBe("context");
  });
});

describe("getImprovementActions", () => {
  it("returns the lowest-scoring metrics first, capped at 3", () => {
    const version = makeVersion({
      scoreBreakdown: makeScoreBreakdown({
        clarity: 2,
        context: 3,
        outputFormat: 5,
        constraints: 5,
        expertise: 5,
        modelFit: 5,
        reusability: 5,
      }),
    });

    const actions = getImprovementActions(version);

    expect(actions).toHaveLength(2);
    expect(actions[0].key).toBe("clarity");
    expect(actions[1].key).toBe("context");
  });

  it("falls back to the top 3 ranked metrics when nothing scores below 4.5", () => {
    const version = makeVersion({
      scoreBreakdown: makeScoreBreakdown({
        clarity: 5,
        context: 5,
        outputFormat: 5,
        constraints: 5,
        expertise: 5,
        modelFit: 5,
        reusability: 4.7,
      }),
    });

    const actions = getImprovementActions(version);

    expect(actions).toHaveLength(3);
  });
});
