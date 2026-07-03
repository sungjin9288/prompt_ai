import { describe, expect, it } from "vitest";

import { duplicatePromptAsset } from "@/lib/library/duplicate";
import type { PromptAsset } from "@/lib/prompt/types";

function makePrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  return {
    id: "prompt-1",
    title: "샘플 프롬프트",
    source: "local",
    rawInput: "raw input",
    goal: "goal",
    domain: "domain",
    targetModels: ["gpt", "claude"],
    tags: ["marketing", "draft"],
    pinned: true,
    sourceSkillId: "skill-1",
    sourceSkillName: "스킬 이름",
    improvementSource: {
      type: "library-improvement",
      sourcePromptId: "source-1",
      sourcePromptTitle: "원본 프롬프트",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    studioSource: {
      type: "studio-draft",
      source: "dashboard-personalization",
      sourceHref: "/dashboard",
      inputPreview: "preview",
      inputLineCount: 1,
      inputCharCount: 10,
      createdAt: "2026-01-01T00:00:00.000Z",
      savedAt: "2026-01-01T00:00:00.000Z",
    },
    learningContext: {
      enabledScopes: { user: true, company: false, domain: false, skill: false },
      appliedMemoryCount: 2,
      recentFeedbackCount: 1,
      appliedMemoryIds: ["mem-1"],
      appliedMemoryTitles: ["메모리 제목"],
      appliedMemoryScopes: ["user"],
    },
    versions: [
      {
        id: "version-1",
        targetModel: "gpt",
        modelLabel: "GPT",
        content: "content 1",
        qualityScore: 8.5,
        scoreBreakdown: {
          clarity: 8,
          context: 8,
          outputFormat: 8,
          constraints: 8,
          expertise: 8,
          modelFit: 8,
          reusability: 8,
        },
        assumptions: ["assumption"],
        missingContext: ["missing"],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "version-2",
        targetModel: "claude",
        modelLabel: "Claude",
        content: "content 2",
        qualityScore: 9,
        scoreBreakdown: {
          clarity: 9,
          context: 9,
          outputFormat: 9,
          constraints: 9,
          expertise: 9,
          modelFit: 9,
          reusability: 9,
        },
        assumptions: [],
        missingContext: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    feedback: [
      {
        id: "feedback-1",
        promptVersionId: "version-1",
        rating: 5,
        comment: "좋아요",
        feedbackType: "format",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("duplicatePromptAsset", () => {
  it("appends the (사본) suffix to the title", () => {
    const prompt = makePrompt({ title: "마케팅 카피" });
    const duplicate = duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: ["version-3", "version-4"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(duplicate.title).toBe("마케팅 카피 (사본)");
  });

  it("assigns the supplied new id", () => {
    const prompt = makePrompt();
    const duplicate = duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: ["version-3", "version-4"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(duplicate.id).toBe("prompt-2");
    expect(duplicate.id).not.toBe(prompt.id);
  });

  it("remaps each version to the supplied new version ids in order", () => {
    const prompt = makePrompt();
    const duplicate = duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: ["version-3", "version-4"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(duplicate.versions.map((version) => version.id)).toEqual([
      "version-3",
      "version-4",
    ]);
    expect(duplicate.versions.map((version) => version.targetModel)).toEqual([
      "gpt",
      "claude",
    ]);
  });

  it("preserves version content and quality metadata", () => {
    const prompt = makePrompt();
    const duplicate = duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: ["version-3", "version-4"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(duplicate.versions[0].content).toBe("content 1");
    expect(duplicate.versions[0].qualityScore).toBe(8.5);
    expect(duplicate.versions[0].scoreBreakdown).toEqual(
      prompt.versions[0].scoreBreakdown,
    );
  });

  it("applies the supplied timestamp to createdAt, updatedAt, and each version's createdAt", () => {
    const prompt = makePrompt();
    const timestamp = "2026-02-01T00:00:00.000Z";
    const duplicate = duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: ["version-3", "version-4"],
      timestamp,
    });

    expect(duplicate.createdAt).toBe(timestamp);
    expect(duplicate.updatedAt).toBe(timestamp);
    expect(duplicate.versions.every((version) => version.createdAt === timestamp)).toBe(
      true,
    );
  });

  it("clears feedback on the duplicate", () => {
    const prompt = makePrompt();
    const duplicate = duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: ["version-3", "version-4"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(duplicate.feedback).toEqual([]);
  });

  it("does not carry over pinned state", () => {
    const prompt = makePrompt({ pinned: true });
    const duplicate = duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: ["version-3", "version-4"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(duplicate.pinned).toBeUndefined();
  });

  it("clears provenance metadata (sourceSkillId, sourceSkillName, improvementSource, studioSource, learningContext)", () => {
    const prompt = makePrompt();
    const duplicate = duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: ["version-3", "version-4"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(duplicate.sourceSkillId).toBeUndefined();
    expect(duplicate.sourceSkillName).toBeUndefined();
    expect(duplicate.improvementSource).toBeUndefined();
    expect(duplicate.studioSource).toBeUndefined();
    expect(duplicate.learningContext).toBeUndefined();
  });

  it("copies tags into a new array rather than sharing the reference", () => {
    const prompt = makePrompt({ tags: ["a", "b"] });
    const duplicate = duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: ["version-3", "version-4"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(duplicate.tags).toEqual(["a", "b"]);
    expect(duplicate.tags).not.toBe(prompt.tags);
  });

  it("preserves source, goal, domain, targetModels, language, and target model decision fields", () => {
    const prompt = makePrompt({
      languageStrategy: "hybrid",
      outputLanguage: "korean",
    });
    const duplicate = duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: ["version-3", "version-4"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(duplicate.source).toBe(prompt.source);
    expect(duplicate.rawInput).toBe(prompt.rawInput);
    expect(duplicate.goal).toBe(prompt.goal);
    expect(duplicate.domain).toBe(prompt.domain);
    expect(duplicate.targetModels).toEqual(prompt.targetModels);
    expect(duplicate.languageStrategy).toBe("hybrid");
    expect(duplicate.outputLanguage).toBe("korean");
  });

  it("does not mutate the original prompt or its arrays", () => {
    const prompt = makePrompt();
    const originalVersionsSnapshot = prompt.versions.map((version) => ({
      ...version,
    }));
    const originalTags = [...(prompt.tags ?? [])];

    duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: ["version-3", "version-4"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(prompt.versions).toEqual(originalVersionsSnapshot);
    expect(prompt.tags).toEqual(originalTags);
    expect(prompt.feedback.length).toBe(1);
  });

  it("throws when versionIds length does not match prompt.versions length", () => {
    const prompt = makePrompt();

    expect(() =>
      duplicatePromptAsset(prompt, {
        id: "prompt-2",
        versionIds: ["version-3"],
        timestamp: "2026-02-01T00:00:00.000Z",
      }),
    ).toThrow();
  });

  it("handles prompts with no versions when versionIds is also empty", () => {
    const prompt = makePrompt({ versions: [] });
    const duplicate = duplicatePromptAsset(prompt, {
      id: "prompt-2",
      versionIds: [],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(duplicate.versions).toEqual([]);
  });
});
