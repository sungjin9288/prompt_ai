import { describe, expect, it } from "vitest";

import {
  listPromptImprovementRecords,
  summarizePromptImprovementPerformance,
} from "@/lib/analytics/prompt-improvement";
import type {
  PromptAsset,
  PromptDeletedAsset,
  PromptScoreBreakdown,
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
    qualityScore: 3.5,
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
    title: "원본 프롬프트",
    source: "local",
    rawInput: "원문 입력",
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

describe("listPromptImprovementRecords", () => {
  it("links an improved prompt back to its source prompt and version", () => {
    const sourceVersion = makeVersion({ id: "source-v1", qualityScore: 3.0 });
    const sourcePrompt = makePrompt({
      id: "source-prompt",
      versions: [sourceVersion],
    });
    const improvedVersion = makeVersion({ id: "improved-v1", qualityScore: 4.2 });
    const improvedPrompt = makePrompt({
      id: "improved-prompt",
      versions: [improvedVersion],
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "source-prompt",
        sourcePromptTitle: sourcePrompt.title,
        sourceVersionId: "source-v1",
        sourceVersionModel: "claude",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    const records = listPromptImprovementRecords([sourcePrompt, improvedPrompt]);

    expect(records).toHaveLength(1);
    expect(records[0].sourcePrompt.id).toBe("source-prompt");
    expect(records[0].prompt.id).toBe("improved-prompt");
    expect(records[0].sourceVersion.id).toBe("source-v1");
    expect(records[0].improvedVersion.id).toBe("improved-v1");
  });

  it("computes delta as improved score minus source score", () => {
    const sourceVersion = makeVersion({ id: "source-v1", qualityScore: 3.0 });
    const sourcePrompt = makePrompt({ id: "source-prompt", versions: [sourceVersion] });
    const improvedVersion = makeVersion({ id: "improved-v1", qualityScore: 4.2 });
    const improvedPrompt = makePrompt({
      id: "improved-prompt",
      versions: [improvedVersion],
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "source-prompt",
        sourcePromptTitle: sourcePrompt.title,
        sourceVersionId: "source-v1",
        sourceVersionModel: "claude",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    const [record] = listPromptImprovementRecords([sourcePrompt, improvedPrompt]);

    expect(record.delta).toBeCloseTo(1.2, 5);
    expect(record.sourceScore).toBe(3.0);
    expect(record.improvedScore).toBe(4.2);
  });

  it("counts multi-step improvement chains with increasing depth", () => {
    const v1 = makeVersion({ id: "v1", qualityScore: 3.0 });
    const promptA = makePrompt({ id: "prompt-a", versions: [v1] });

    const v2 = makeVersion({ id: "v2", qualityScore: 3.6 });
    const promptB = makePrompt({
      id: "prompt-b",
      versions: [v2],
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "prompt-a",
        sourcePromptTitle: promptA.title,
        sourceVersionId: "v1",
        sourceVersionModel: "claude",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    const v3 = makeVersion({ id: "v3", qualityScore: 4.4 });
    const promptC = makePrompt({
      id: "prompt-c",
      versions: [v3],
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "prompt-b",
        sourcePromptTitle: promptB.title,
        sourceVersionId: "v2",
        sourceVersionModel: "claude",
        createdAt: "2026-01-03T00:00:00.000Z",
      },
    });

    const records = listPromptImprovementRecords([promptA, promptB, promptC]);
    const recordB = records.find((record) => record.prompt.id === "prompt-b");
    const recordC = records.find((record) => record.prompt.id === "prompt-c");

    expect(recordB?.depth).toBe(1);
    expect(recordC?.depth).toBe(2);
  });

  it("resolves the source prompt from deletedPrompts when it was removed", () => {
    const sourceVersion = makeVersion({ id: "source-v1", qualityScore: 3.0 });
    const sourcePrompt = makePrompt({ id: "source-prompt", versions: [sourceVersion] });
    const deletedPrompts: PromptDeletedAsset[] = [
      { prompt: sourcePrompt, deletedAt: "2026-01-05T00:00:00.000Z" },
    ];
    const improvedVersion = makeVersion({ id: "improved-v1", qualityScore: 4.0 });
    const improvedPrompt = makePrompt({
      id: "improved-prompt",
      versions: [improvedVersion],
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "source-prompt",
        sourcePromptTitle: sourcePrompt.title,
        sourceVersionId: "source-v1",
        sourceVersionModel: "claude",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    const records = listPromptImprovementRecords([improvedPrompt], deletedPrompts);

    expect(records).toHaveLength(1);
    expect(records[0].sourceDeletedAt).toBe("2026-01-05T00:00:00.000Z");
  });

  it("skips prompts without an improvementSource", () => {
    const prompt = makePrompt();

    expect(listPromptImprovementRecords([prompt])).toHaveLength(0);
  });

  it("skips an improvement prompt whose source prompt cannot be found at all", () => {
    const improvedPrompt = makePrompt({
      id: "improved-prompt",
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "missing-source",
        sourcePromptTitle: "missing",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    expect(listPromptImprovementRecords([improvedPrompt])).toHaveLength(0);
  });
});

describe("summarizePromptImprovementPerformance", () => {
  function buildImprovementPair(delta: number, improvedScore: number) {
    const sourceVersion = makeVersion({
      id: `source-v-${improvedScore}`,
      qualityScore: improvedScore - delta,
    });
    const sourcePrompt = makePrompt({
      id: `source-${improvedScore}`,
      versions: [sourceVersion],
    });
    const improvedVersion = makeVersion({
      id: `improved-v-${improvedScore}`,
      qualityScore: improvedScore,
    });
    const improvedPrompt = makePrompt({
      id: `improved-${improvedScore}`,
      versions: [improvedVersion],
      domain: sourcePrompt.domain,
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: sourcePrompt.id,
        sourcePromptTitle: sourcePrompt.title,
        sourceVersionId: sourceVersion.id,
        sourceVersionModel: "claude",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    return { sourcePrompt, improvedPrompt };
  }

  it("computes the average delta across all measurable improvement records", () => {
    const pairA = buildImprovementPair(1.0, 4.0);
    const pairB = buildImprovementPair(2.0, 4.5);

    const summary = summarizePromptImprovementPerformance([
      pairA.sourcePrompt,
      pairA.improvedPrompt,
      pairB.sourcePrompt,
      pairB.improvedPrompt,
    ]);

    expect(summary.measurableCount).toBe(2);
    expect(summary.averageDelta).toBeCloseTo(1.5, 5);
  });

  it("separates improved records from regressed records", () => {
    const improved = buildImprovementPair(0.5, 4.0);
    const regressed = buildImprovementPair(-0.5, 3.0);

    const summary = summarizePromptImprovementPerformance([
      improved.sourcePrompt,
      improved.improvedPrompt,
      regressed.sourcePrompt,
      regressed.improvedPrompt,
    ]);

    expect(summary.improvedCount).toBe(1);
    expect(summary.regressedCount).toBe(1);
  });

  it("queues records for reimprovement when delta is non-positive or below the quality threshold", () => {
    const belowThreshold = buildImprovementPair(0.3, 4.0);

    const summary = summarizePromptImprovementPerformance([
      belowThreshold.sourcePrompt,
      belowThreshold.improvedPrompt,
    ]);

    expect(summary.reimprovementQueue).toHaveLength(1);
    expect(summary.reimprovementQueue[0].improvedScore).toBeLessThan(4.2);
  });

  it("does not queue a record above the quality threshold with positive delta", () => {
    const strongImprovement = buildImprovementPair(1.0, 4.5);

    const summary = summarizePromptImprovementPerformance([
      strongImprovement.sourcePrompt,
      strongImprovement.improvedPrompt,
    ]);

    expect(summary.reimprovementQueue).toHaveLength(0);
  });

  it("groups records by target model with correct counts", () => {
    const pairA = buildImprovementPair(1.0, 4.0);
    const pairB = buildImprovementPair(0.5, 3.8);

    const summary = summarizePromptImprovementPerformance([
      pairA.sourcePrompt,
      pairA.improvedPrompt,
      pairB.sourcePrompt,
      pairB.improvedPrompt,
    ]);

    const claudeGroup = summary.byTargetModel.find((group) => group.id === "claude");

    expect(claudeGroup?.count).toBe(2);
  });

  it("groups records by domain using the source prompt's domain", () => {
    const pair = buildImprovementPair(1.0, 4.0);
    pair.sourcePrompt.domain = "개발";
    pair.improvedPrompt.domain = "개발";

    const summary = summarizePromptImprovementPerformance([
      pair.sourcePrompt,
      pair.improvedPrompt,
    ]);

    const devGroup = summary.byDomain.find((group) => group.id === "개발");

    expect(devGroup?.count).toBe(1);
  });

  it("returns zeroed-out summary fields for an empty prompt list", () => {
    const summary = summarizePromptImprovementPerformance([]);

    expect(summary.totalImprovementPrompts).toBe(0);
    expect(summary.measurableCount).toBe(0);
    expect(summary.averageDelta).toBe(0);
    expect(summary.bestRecord).toBeUndefined();
    expect(summary.reimprovementQueue).toHaveLength(0);
  });

  it("flags archived-source health issues when the source prompt was deleted", () => {
    const pair = buildImprovementPair(1.0, 4.5);
    const deletedPrompts: PromptDeletedAsset[] = [
      { prompt: pair.sourcePrompt, deletedAt: "2026-01-05T00:00:00.000Z" },
    ];

    const summary = summarizePromptImprovementPerformance(
      [pair.improvedPrompt],
      deletedPrompts,
    );

    expect(summary.archivedSourceCount).toBe(1);
    expect(summary.sourceHealthIssues[0].reason).toBe("archived-source");
  });

  it("flags a missing-source health issue when the source prompt cannot be found", () => {
    const improvedPrompt = makePrompt({
      id: "orphan-improved",
      improvementSource: {
        type: "library-improvement",
        sourcePromptId: "does-not-exist",
        sourcePromptTitle: "missing",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    });

    const summary = summarizePromptImprovementPerformance([improvedPrompt]);

    expect(summary.totalImprovementPrompts).toBe(1);
    expect(summary.measurableCount).toBe(0);
    expect(summary.unmeasuredCount).toBe(1);
    expect(summary.sourceHealthIssues[0].reason).toBe("missing-source");
  });
});
