import { describe, expect, it } from "vitest";

import {
  collectLearningContext,
  collectRecentFeedback,
  filterLearningMemories,
  getDisabledMemoryScopeLabels,
  getEnabledMemoryScopeLabels,
  getMemoryPreview,
  getPrioritizedLearningMemories,
} from "@/lib/studio-view/learning-memory";
import type { Feedback, LearningMemory, PromptAsset } from "@/lib/prompt";

function buildMemory(overrides: Partial<LearningMemory> = {}): LearningMemory {
  return {
    id: `memory_${Math.random()}`,
    scope: "user",
    sourceType: "manual",
    sourceId: "source-1",
    title: "테스트 메모리",
    content: "테스트 내용",
    tags: [],
    confidence: 0.8,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function buildFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    id: `feedback_${Math.random()}`,
    promptVersionId: "version-1",
    rating: 4,
    comment: "좋은 결과입니다",
    feedbackType: "tone",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
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
    versions: [],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const allScopesEnabled: Record<LearningMemory["scope"], boolean> = {
  user: true,
  company: true,
  domain: true,
  skill: true,
};

const allScopesDisabled: Record<LearningMemory["scope"], boolean> = {
  user: false,
  company: false,
  domain: false,
  skill: false,
};

describe("filterLearningMemories", () => {
  it("returns an empty array when given an empty memory list", () => {
    expect(filterLearningMemories([], allScopesEnabled)).toEqual([]);
  });

  it("returns an empty array when all scopes are disabled", () => {
    const memories = [
      buildMemory({ scope: "user" }),
      buildMemory({ scope: "company" }),
    ];

    expect(filterLearningMemories(memories, allScopesDisabled)).toEqual([]);
  });

  it("keeps only memories whose scope is enabled", () => {
    const userMemory = buildMemory({ scope: "user" });
    const companyMemory = buildMemory({ scope: "company" });
    const domainMemory = buildMemory({ scope: "domain" });
    const memories = [userMemory, companyMemory, domainMemory];

    const filtered = filterLearningMemories(memories, {
      user: true,
      company: false,
      domain: true,
      skill: false,
    });

    expect(filtered).toEqual([userMemory, domainMemory]);
  });
});

describe("getPrioritizedLearningMemories", () => {
  it("returns an empty array when given no memories", () => {
    expect(getPrioritizedLearningMemories([])).toEqual([]);
  });

  it("sorts by descending confidence", () => {
    const low = buildMemory({ id: "low", confidence: 0.2 });
    const high = buildMemory({ id: "high", confidence: 0.9 });
    const mid = buildMemory({ id: "mid", confidence: 0.5 });

    const prioritized = getPrioritizedLearningMemories([low, high, mid]);

    expect(prioritized.map((memory) => memory.id)).toEqual(["high", "mid", "low"]);
  });

  it("breaks a confidence tie using the most recently updated memory first", () => {
    const older = buildMemory({
      id: "older",
      confidence: 0.7,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const newer = buildMemory({
      id: "newer",
      confidence: 0.7,
      updatedAt: "2026-06-01T00:00:00.000Z",
    });

    const prioritized = getPrioritizedLearningMemories([older, newer]);

    expect(prioritized.map((memory) => memory.id)).toEqual(["newer", "older"]);
  });

  it("defaults to a limit of 4 memories when limit is not provided", () => {
    const memories = Array.from({ length: 10 }, (_, index) =>
      buildMemory({ id: `memory-${index}`, confidence: index / 10 }),
    );

    expect(getPrioritizedLearningMemories(memories)).toHaveLength(4);
  });

  it("respects a custom limit argument that is smaller than the memory count", () => {
    const memories = Array.from({ length: 10 }, (_, index) =>
      buildMemory({ id: `memory-${index}`, confidence: index / 10 }),
    );

    expect(getPrioritizedLearningMemories(memories, 8)).toHaveLength(8);
  });

  it("returns all memories when the limit exceeds the memory count", () => {
    const memories = [buildMemory(), buildMemory()];

    expect(getPrioritizedLearningMemories(memories, 10)).toHaveLength(2);
  });

  it("does not mutate the original memories array", () => {
    const first = buildMemory({ id: "a", confidence: 0.1 });
    const second = buildMemory({ id: "b", confidence: 0.9 });
    const memories = [first, second];

    getPrioritizedLearningMemories(memories);

    expect(memories[0].id).toBe("a");
    expect(memories[1].id).toBe("b");
  });
});

describe("collectRecentFeedback", () => {
  it("returns an empty array when there are no prompts", () => {
    expect(collectRecentFeedback([])).toEqual([]);
  });

  it("flattens feedback across prompts and formats each entry", () => {
    const prompt = buildPrompt({
      feedback: [buildFeedback({ feedbackType: "tone", rating: 5, comment: "좋아요" })],
    });

    const result = collectRecentFeedback([prompt]);

    expect(result).toEqual(["tone: 5/5 - 좋아요"]);
  });

  it("sorts feedback by most recent createdAt and caps the result at 8 entries", () => {
    const prompt = buildPrompt({
      feedback: Array.from({ length: 12 }, (_, index) =>
        buildFeedback({
          comment: `feedback-${index}`,
          createdAt: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
        }),
      ),
    });

    const result = collectRecentFeedback([prompt]);

    expect(result).toHaveLength(8);
    expect(result[0]).toContain("feedback-11");
  });

  it("filters out entries that end up empty after trimming", () => {
    const prompt = buildPrompt({
      feedback: [buildFeedback({ feedbackType: "other", rating: 3, comment: "" })],
    });

    const result = collectRecentFeedback([prompt]);

    expect(result).toEqual(["other: 3/5 - "].filter((item) => item.trim().length > 0));
  });
});

describe("collectLearningContext", () => {
  it("combines formatted memories with recent feedback", () => {
    const memory = buildMemory({ scope: "user", confidence: 0.9, content: "선호 톤: 친근함" });
    const prompt = buildPrompt({
      feedback: [buildFeedback({ feedbackType: "tone", rating: 5, comment: "좋아요" })],
    });

    const context = collectLearningContext([prompt], [memory]);

    expect(context.some((item) => item.startsWith("memory/user/"))).toBe(true);
    expect(context).toContain("tone: 5/5 - 좋아요");
  });

  it("returns an empty array when there are no memories or prompts", () => {
    expect(collectLearningContext([], [])).toEqual([]);
  });
});

describe("getMemoryPreview", () => {
  it("returns short content unchanged", () => {
    expect(getMemoryPreview("짧은 내용")).toBe("짧은 내용");
  });

  it("truncates content longer than 128 characters and appends an ellipsis", () => {
    const longContent = "가".repeat(200);

    const preview = getMemoryPreview(longContent);

    expect(preview.endsWith("...")).toBe(true);
    expect(preview.length).toBe(131);
  });

  it("collapses internal whitespace/newlines into single spaces", () => {
    expect(getMemoryPreview("첫 줄\n\n  두번째   줄")).toBe("첫 줄 두번째 줄");
  });
});

describe("getEnabledMemoryScopeLabels / getDisabledMemoryScopeLabels", () => {
  it("returns all scope labels enabled when every scope is on", () => {
    const enabled = getEnabledMemoryScopeLabels(allScopesEnabled);

    expect(enabled.sort()).toEqual(["분야", "사용자", "스킬", "회사"].sort());
    expect(getDisabledMemoryScopeLabels(allScopesEnabled)).toEqual([]);
  });

  it("returns all scope labels disabled when every scope is off", () => {
    expect(getEnabledMemoryScopeLabels(allScopesDisabled)).toEqual([]);
    expect(getDisabledMemoryScopeLabels(allScopesDisabled).sort()).toEqual(
      ["분야", "사용자", "스킬", "회사"].sort(),
    );
  });

  it("splits enabled and disabled labels correctly for a mixed selection", () => {
    const mixed: Record<LearningMemory["scope"], boolean> = {
      user: true,
      company: false,
      domain: true,
      skill: false,
    };

    expect(getEnabledMemoryScopeLabels(mixed).sort()).toEqual(["분야", "사용자"].sort());
    expect(getDisabledMemoryScopeLabels(mixed).sort()).toEqual(["스킬", "회사"].sort());
  });
});
