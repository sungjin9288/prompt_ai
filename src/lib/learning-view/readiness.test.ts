import { describe, expect, it } from "vitest";

import { getLearningReadiness } from "@/lib/learning-view/readiness";
import type { LearningMemory, MemoryScope } from "@/lib/prompt";

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

describe("getLearningReadiness", () => {
  it("returns the empty-state label and a zero score when there are no memories", () => {
    const readiness = getLearningReadiness([]);

    expect(readiness.score).toBe(0);
    expect(readiness.label).toBe("학습 시작 필요");
    expect(readiness.coveredScopes).toEqual([]);
    expect(readiness.missingScopes).toEqual(["user", "company", "domain", "skill"]);
    expect(readiness.averageConfidence).toBe(0);
    expect(readiness.actions[0]).toContain("첫 학습 메모리");
  });

  it("counts memories per scope and separates covered vs missing scopes", () => {
    const memories = [
      buildMemory({ scope: "user" }),
      buildMemory({ scope: "user" }),
      buildMemory({ scope: "company" }),
    ];

    const readiness = getLearningReadiness(memories);

    expect(readiness.scopeCounts.user).toBe(2);
    expect(readiness.scopeCounts.company).toBe(1);
    expect(readiness.scopeCounts.domain).toBe(0);
    expect(readiness.scopeCounts.skill).toBe(0);
    expect(readiness.coveredScopes.sort()).toEqual(["company", "user"]);
    expect(readiness.missingScopes.sort()).toEqual(["domain", "skill"]);
  });

  it("counts low-confidence (<0.5) and high-confidence (>=0.75) memories separately", () => {
    const memories = [
      buildMemory({ confidence: 0.3 }),
      buildMemory({ confidence: 0.49 }),
      buildMemory({ confidence: 0.5 }),
      buildMemory({ confidence: 0.75 }),
      buildMemory({ confidence: 0.9 }),
    ];

    const readiness = getLearningReadiness(memories);

    expect(readiness.lowConfidenceCount).toBe(2);
    expect(readiness.highConfidenceCount).toBe(2);
  });

  it("reports 'operation ready' label once score is high and at least 3 scopes are covered", () => {
    const allScopes: MemoryScope[] = ["user", "company", "domain", "skill"];
    const memories = allScopes.flatMap((scope) => [
      buildMemory({ scope, confidence: 0.95 }),
      buildMemory({ scope, confidence: 0.95 }),
    ]);

    const readiness = getLearningReadiness(memories);

    expect(readiness.coveredScopes.length).toBe(4);
    expect(readiness.score).toBeGreaterThanOrEqual(75);
    expect(readiness.label).toBe("운영 준비 양호");
    expect(readiness.tone).toContain("success");
  });

  it("reports 'expanding' label for a mid-range score with partial scope coverage", () => {
    const memories = [
      buildMemory({ scope: "user", confidence: 0.6 }),
      buildMemory({ scope: "company", confidence: 0.6 }),
    ];

    const readiness = getLearningReadiness(memories);

    expect(readiness.label).toBe("학습 확장 중");
    expect(readiness.tone).toContain("attention");
  });

  it("reports 'needs reinforcement' when memories exist but score/coverage stay low", () => {
    const memories = [buildMemory({ scope: "user", confidence: 0.1 })];

    const readiness = getLearningReadiness(memories);

    expect(readiness.label).toBe("보강 필요");
  });

  it("suggests actions for each missing scope, capped at 4 total actions", () => {
    const memories = [buildMemory({ scope: "user", confidence: 0.9 })];

    const readiness = getLearningReadiness(memories);

    expect(readiness.actions.length).toBeLessThanOrEqual(4);
    expect(readiness.actions.some((action) => action.includes("회사 기준"))).toBe(true);
  });

  it("falls back to a generic action when no specific action applies", () => {
    const allScopes: MemoryScope[] = ["user", "company", "domain", "skill"];
    const memories = allScopes.map((scope) => buildMemory({ scope, confidence: 0.9 }));

    const readiness = getLearningReadiness(memories);

    expect(readiness.actions).toEqual(["Studio에서 새 프롬프트를 생성하고 결과 품질을 비교합니다."]);
  });

  it("returns the most recently updated memory date as latestMemoryDate", () => {
    const memories = [
      buildMemory({ updatedAt: "2026-01-01T00:00:00.000Z" }),
      buildMemory({ updatedAt: "2026-06-01T00:00:00.000Z" }),
      buildMemory({ updatedAt: "2026-03-01T00:00:00.000Z" }),
    ];

    const readiness = getLearningReadiness(memories);

    expect(readiness.latestMemoryDate).toBe("2026-06-01T00:00:00.000Z");
  });
});
