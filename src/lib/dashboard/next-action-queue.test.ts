import { describe, expect, it } from "vitest";

import {
  buildDashboardNextActionQueueLinksText,
  buildDashboardNextActionQueueReportText,
  summarizeDashboardNextActionQueue,
  summarizeDashboardNextActionQueueCategoryCounts,
  summarizeDashboardNextActionQueuePriorityCounts,
  type DashboardNextActionQueueItem,
} from "@/lib/dashboard/next-action-queue";
import type { LearningOpsAction } from "@/lib/dashboard/learning-memory";

function makeAction(overrides: Partial<LearningOpsAction> = {}): LearningOpsAction {
  return {
    href: "/learning",
    label: "학습 메모리 검토",
    priority: "medium",
    description: "낮은 신뢰도 메모리를 검토합니다",
    ...overrides,
  };
}

describe("summarizeDashboardNextActionQueue", () => {
  it("tags personalization and learning actions with the correct category and label", () => {
    const personalizationActions = [makeAction({ label: "프로필 보완" })];
    const learningOpsActions = [makeAction({ label: "메모리 정리" })];

    const queue = summarizeDashboardNextActionQueue({
      personalizationActions,
      learningOpsActions,
    });

    const personalizationItem = queue.find((item) => item.label === "프로필 보완");
    const learningItem = queue.find((item) => item.label === "메모리 정리");

    expect(personalizationItem?.category).toBe("personalization");
    expect(personalizationItem?.categoryLabel).toBe("개인화");
    expect(learningItem?.category).toBe("learning");
    expect(learningItem?.categoryLabel).toBe("학습");
  });

  it("sorts items by priority rank so high comes before medium and low", () => {
    const queue = summarizeDashboardNextActionQueue({
      personalizationActions: [makeAction({ label: "낮음", priority: "low" })],
      learningOpsActions: [makeAction({ label: "높음", priority: "high" })],
    });

    expect(queue[0].label).toBe("높음");
  });

  it("caps the resulting queue at 4 items", () => {
    const personalizationActions = Array.from({ length: 3 }, (_, index) =>
      makeAction({ label: `개인화-${index}`, priority: "high" }),
    );
    const learningOpsActions = Array.from({ length: 3 }, (_, index) =>
      makeAction({ label: `학습-${index}`, priority: "high" }),
    );

    const queue = summarizeDashboardNextActionQueue({ personalizationActions, learningOpsActions });

    expect(queue).toHaveLength(4);
  });

  it("assigns each item a unique actionKey derived from category, index, and label", () => {
    const queue = summarizeDashboardNextActionQueue({
      personalizationActions: [makeAction({ label: "A" })],
      learningOpsActions: [makeAction({ label: "B" })],
    });

    const keys = queue.map((item) => item.actionKey);

    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("summarizeDashboardNextActionQueuePriorityCounts", () => {
  it("counts queue items by priority bucket", () => {
    const queue: DashboardNextActionQueueItem[] = [
      { ...makeAction({ priority: "high" }), actionKey: "1", category: "learning", categoryLabel: "학습" },
      { ...makeAction({ priority: "high" }), actionKey: "2", category: "learning", categoryLabel: "학습" },
      { ...makeAction({ priority: "low" }), actionKey: "3", category: "personalization", categoryLabel: "개인화" },
    ];

    const counts = summarizeDashboardNextActionQueuePriorityCounts(queue);

    expect(counts).toEqual({ high: 2, low: 1, medium: 0 });
  });
});

describe("summarizeDashboardNextActionQueueCategoryCounts", () => {
  it("counts queue items by category bucket", () => {
    const queue: DashboardNextActionQueueItem[] = [
      { ...makeAction(), actionKey: "1", category: "learning", categoryLabel: "학습" },
      { ...makeAction(), actionKey: "2", category: "personalization", categoryLabel: "개인화" },
      { ...makeAction(), actionKey: "3", category: "personalization", categoryLabel: "개인화" },
    ];

    const counts = summarizeDashboardNextActionQueueCategoryCounts(queue);

    expect(counts).toEqual({ learning: 1, personalization: 2 });
  });
});

describe("buildDashboardNextActionQueueLinksText", () => {
  it("renders one numbered link line per queue item with priority and category labels", () => {
    const queue: DashboardNextActionQueueItem[] = [
      {
        ...makeAction({ label: "메모리 정리", priority: "high", href: "/learning" }),
        actionKey: "1",
        category: "learning",
        categoryLabel: "학습",
      },
    ];

    const text = buildDashboardNextActionQueueLinksText({ queue });

    expect(text).toContain("1. [High] 학습 · 메모리 정리: /learning");
  });
});

describe("buildDashboardNextActionQueueReportText", () => {
  it("includes readiness figures and per-priority/category counts in the summary section", () => {
    const queue: DashboardNextActionQueueItem[] = [
      {
        ...makeAction({ label: "메모리 정리", priority: "high" }),
        actionKey: "1",
        category: "learning",
        categoryLabel: "학습",
      },
    ];

    const text = buildDashboardNextActionQueueReportText({
      companyCompletion: 80,
      dataReadinessScore: 65,
      memoryCount: 12,
      profileCompletion: 90,
      queue,
      trackedLearningPromptCount: 5,
    });

    expect(text).toContain("전체 운영 준비도: 65%");
    expect(text).toContain("학습 메모리: 12개");
    expect(text).toContain("Queue priority: High 1 · Med 0 · Low 0");
    expect(text).toContain("First action: [High] 학습 · 메모리 정리");
  });

  it("reports '대기 없음' as the first action when the queue is empty", () => {
    const text = buildDashboardNextActionQueueReportText({
      companyCompletion: 0,
      dataReadinessScore: 0,
      memoryCount: 0,
      profileCompletion: 0,
      queue: [],
      trackedLearningPromptCount: 0,
    });

    expect(text).toContain("First action: 대기 없음");
  });
});
