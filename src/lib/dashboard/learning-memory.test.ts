import { describe, expect, it } from "vitest";

import {
  buildFeedbackImprovementLearningMemory,
  feedbackImprovementMemoryConfidence,
  learningOpsPriorityLabel,
  learningOpsPriorityRank,
  summarizeLearningContextUsage,
  summarizeLearningOpsActions,
  summarizeLearningReviewQueues,
  summarizePersonalizationActions,
  type FeedbackBasedImprovementRecord,
  type LearningReviewQueue,
  type LearningScopeSummary,
} from "@/lib/dashboard/learning-memory";
import type {
  LearningMemory,
  PromptAsset,
  PromptImprovementFeedbackSource,
  PromptScoreBreakdown,
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

describe("feedbackImprovementMemoryConfidence", () => {
  it("returns 0.9 for a perfect rating of 5", () => {
    expect(feedbackImprovementMemoryConfidence(5)).toBe(0.9);
  });

  it("returns 0.8 for a rating of 4", () => {
    expect(feedbackImprovementMemoryConfidence(4)).toBe(0.8);
  });

  it("returns 0.7 for a rating of 3", () => {
    expect(feedbackImprovementMemoryConfidence(3)).toBe(0.7);
  });

  it("returns 0.6 for any rating below 3", () => {
    expect(feedbackImprovementMemoryConfidence(1)).toBe(0.6);
    expect(feedbackImprovementMemoryConfidence(2)).toBe(0.6);
  });
});

describe("buildFeedbackImprovementLearningMemory", () => {
  function buildRecord(
    overrides: Partial<FeedbackBasedImprovementRecord> = {},
  ): FeedbackBasedImprovementRecord {
    const sourcePrompt = buildPrompt({ id: "source-prompt", domain: "마케팅" });
    const prompt = buildPrompt({ id: "improved-prompt", domain: "마케팅" });
    const sourceFeedback: PromptImprovementFeedbackSource = {
      id: "feedback-1",
      rating: 5,
      feedbackType: "tone",
      comment: "더 친근한 톤으로",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    return {
      prompt,
      sourcePrompt,
      sourceVersion: buildVersion(),
      improvedVersion: buildVersion({ id: "version-improved" }),
      targetModel: "gpt",
      sourceFeedback,
      delta: 5,
      createdAt: "2026-01-02T00:00:00.000Z",
      ...overrides,
    };
  }

  it("derives scope from the source feedback type via feedbackTypeToScope", () => {
    const record = buildRecord({
      sourceFeedback: {
        id: "feedback-2",
        rating: 5,
        feedbackType: "company_rule",
        comment: "회사 규칙 준수",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    const memory = buildFeedbackImprovementLearningMemory(record);

    expect(memory.scope).toBe("company");
  });

  it("uses the feedback id as sourceId and sourceType 'feedback' when an id exists", () => {
    const record = buildRecord();

    const memory = buildFeedbackImprovementLearningMemory(record);

    expect(memory.sourceType).toBe("feedback");
    expect(memory.sourceId).toBe("feedback-1");
  });

  it("falls back to a synthetic sourceId and sourceType 'manual' when the feedback has no id", () => {
    const record = buildRecord({
      sourceFeedback: {
        rating: 4,
        feedbackType: "tone",
        comment: "톤 조정",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    const memory = buildFeedbackImprovementLearningMemory(record);

    expect(memory.sourceType).toBe("manual");
    expect(memory.sourceId).toBe("feedback-improvement:source-prompt:improved-prompt");
  });

  it("sets confidence based on the feedback rating", () => {
    const record = buildRecord({
      sourceFeedback: {
        id: "feedback-3",
        rating: 3,
        feedbackType: "tone",
        comment: "보통",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    const memory = buildFeedbackImprovementLearningMemory(record);

    expect(memory.confidence).toBe(0.7);
  });

  it("includes a restoration note instead of a direct feedback link when sourceDeletedAt is set", () => {
    const record = buildRecord({ sourceDeletedAt: "2026-02-01T00:00:00.000Z" });

    const memory = buildFeedbackImprovementLearningMemory(record);

    expect(memory.content).toContain("삭제 보관함");
    expect(memory.content).toContain("근거 개선본:");
  });

  it("links directly to the original feedback when the source is not deleted", () => {
    const record = buildRecord({ sourceDeletedAt: undefined });

    const memory = buildFeedbackImprovementLearningMemory(record);

    expect(memory.content).toContain("원본 피드백:");
    expect(memory.content).not.toContain("삭제 보관함");
  });

  it("falls back to '범용' domain when neither prompt has a domain", () => {
    const record = buildRecord({
      sourcePrompt: buildPrompt({ id: "source-prompt", domain: "" }),
      prompt: buildPrompt({ id: "improved-prompt", domain: "" }),
    });

    const memory = buildFeedbackImprovementLearningMemory(record);

    expect(memory.title).toContain("범용");
  });
});

describe("summarizeLearningContextUsage", () => {
  it("counts an 'untracked' prompt as one with no learningContext at all", () => {
    const prompts = [buildPrompt({ learningContext: undefined })];

    const summaries = summarizeLearningContextUsage(prompts, []);
    const untracked = summaries.find((item) => item.scope === "untracked");

    expect(untracked?.promptCount).toBe(1);
  });

  it("buckets prompts by which learning scopes are enabled", () => {
    const withCompany = buildPrompt({
      id: "p1",
      learningContext: {
        enabledScopes: { user: false, company: true, domain: false, skill: false },
        appliedMemoryCount: 0,
        recentFeedbackCount: 0,
        appliedMemoryIds: [],
        appliedMemoryTitles: [],
        appliedMemoryScopes: [],
      },
    });
    const withUserAndDomain = buildPrompt({
      id: "p2",
      learningContext: {
        enabledScopes: { user: true, company: false, domain: true, skill: false },
        appliedMemoryCount: 0,
        recentFeedbackCount: 0,
        appliedMemoryIds: [],
        appliedMemoryTitles: [],
        appliedMemoryScopes: [],
      },
    });

    const summaries = summarizeLearningContextUsage([withCompany, withUserAndDomain], []);

    expect(summaries.find((item) => item.scope === "company")?.promptCount).toBe(1);
    expect(summaries.find((item) => item.scope === "user")?.promptCount).toBe(1);
    expect(summaries.find((item) => item.scope === "domain")?.promptCount).toBe(1);
    expect(summaries.find((item) => item.scope === "skill")?.promptCount).toBe(0);
  });

  it("computes the average of each prompt's best version score for the scope", () => {
    const prompt = buildPrompt({
      versions: [buildVersion({ qualityScore: 40 }), buildVersion({ qualityScore: 60 })],
      learningContext: {
        enabledScopes: { user: true, company: false, domain: false, skill: false },
        appliedMemoryCount: 0,
        recentFeedbackCount: 0,
        appliedMemoryIds: [],
        appliedMemoryTitles: [],
        appliedMemoryScopes: [],
      },
    });

    const summaries = summarizeLearningContextUsage([prompt], []);
    const user = summaries.find((item) => item.scope === "user");

    expect(user?.averageQuality).toBe(60);
  });

  it("counts memories per scope but always reports zero memories for 'untracked'", () => {
    const memories = [
      buildMemory({ scope: "user" }),
      buildMemory({ scope: "company" }),
      buildMemory({ scope: "company" }),
    ];

    const summaries = summarizeLearningContextUsage([], memories);

    expect(summaries.find((item) => item.scope === "user")?.memoryCount).toBe(1);
    expect(summaries.find((item) => item.scope === "company")?.memoryCount).toBe(2);
    expect(summaries.find((item) => item.scope === "untracked")?.memoryCount).toBe(0);
  });

  it("follows the fixed scope order: company, user, domain, skill, untracked", () => {
    const summaries = summarizeLearningContextUsage([], []);

    expect(summaries.map((item) => item.scope)).toEqual([
      "company",
      "user",
      "domain",
      "skill",
      "untracked",
    ]);
  });
});

describe("summarizeLearningReviewQueues", () => {
  it("counts low-confidence memories (<0.5) into the low-confidence queue", () => {
    const memories = [
      buildMemory({ confidence: 0.3 }),
      buildMemory({ confidence: 0.49 }),
      buildMemory({ confidence: 0.6 }),
    ];

    const queues = summarizeLearningReviewQueues(memories);
    const lowConfidence = queues.find((queue) => queue.id === "low-confidence");

    expect(lowConfidence?.count).toBe(2);
  });

  it("counts manually sourced memories into the manual queue", () => {
    const memories = [
      buildMemory({ sourceType: "manual" }),
      buildMemory({ sourceType: "feedback" }),
    ];

    const queues = summarizeLearningReviewQueues(memories);
    const manual = queues.find((queue) => queue.id === "manual");

    expect(manual?.count).toBe(1);
  });

  it("reports the total memory count for the 'latest' queue", () => {
    const memories = [buildMemory(), buildMemory(), buildMemory()];

    const queues = summarizeLearningReviewQueues(memories);
    const latest = queues.find((queue) => queue.id === "latest");

    expect(latest?.count).toBe(3);
  });

  it("returns all three queues even when there are no memories", () => {
    const queues = summarizeLearningReviewQueues([]);

    expect(queues.map((queue) => queue.id).sort()).toEqual(
      ["latest", "low-confidence", "manual"].sort(),
    );
    queues.forEach((queue) => expect(queue.count).toBe(0));
  });
});

describe("learningOpsPriorityLabel / learningOpsPriorityRank", () => {
  it("labels 'high' as 'High' and ranks it first", () => {
    expect(learningOpsPriorityLabel("high")).toBe("High");
    expect(learningOpsPriorityRank("high")).toBe(0);
  });

  it("labels 'medium' as 'Med' and ranks it second", () => {
    expect(learningOpsPriorityLabel("medium")).toBe("Med");
    expect(learningOpsPriorityRank("medium")).toBe(1);
  });

  it("labels 'low' as 'Low' and ranks it last", () => {
    expect(learningOpsPriorityLabel("low")).toBe("Low");
    expect(learningOpsPriorityRank("low")).toBe(2);
  });
});

describe("summarizeLearningOpsActions", () => {
  const emptyQueues: LearningReviewQueue[] = [
    { id: "low-confidence", href: "/a", label: "낮은 신뢰도", count: 0, description: "" },
    { id: "manual", href: "/b", label: "수동", count: 0, description: "" },
    { id: "latest", href: "/c", label: "최근", count: 0, description: "" },
  ];
  const fullScopeSummaries: LearningScopeSummary[] = [
    { scope: "company", label: "회사", promptCount: 1, memoryCount: 1, averageQuality: 80 },
    { scope: "user", label: "사용자", promptCount: 1, memoryCount: 1, averageQuality: 80 },
    { scope: "domain", label: "분야", promptCount: 1, memoryCount: 1, averageQuality: 80 },
    { scope: "skill", label: "스킬", promptCount: 1, memoryCount: 1, averageQuality: 80 },
    { scope: "untracked", label: "기록 없음", promptCount: 0, memoryCount: 0, averageQuality: 0 },
  ];

  it("recommends creating the first learning memory when there are none", () => {
    const actions = summarizeLearningOpsActions({
      memories: [],
      queues: emptyQueues,
      scopeSummaries: fullScopeSummaries,
      trackedPromptCount: 0,
    });

    expect(actions[0].label).toBe("첫 학습 메모리 만들기");
    expect(actions[0].priority).toBe("high");
  });

  it("recommends reinforcing low-confidence memories when the queue has entries", () => {
    const queues: LearningReviewQueue[] = emptyQueues.map((queue) =>
      queue.id === "low-confidence" ? { ...queue, count: 3 } : queue,
    );

    const actions = summarizeLearningOpsActions({
      memories: [buildMemory()],
      queues,
      scopeSummaries: fullScopeSummaries,
      trackedPromptCount: 1,
    });

    expect(actions.some((action) => action.label === "낮은 신뢰도 메모리 보강")).toBe(true);
  });

  it("recommends filling in scopes that have zero memories", () => {
    const scopeSummaries: LearningScopeSummary[] = fullScopeSummaries.map((summary) =>
      summary.scope === "skill" ? { ...summary, memoryCount: 0 } : summary,
    );

    const actions = summarizeLearningOpsActions({
      memories: [buildMemory()],
      queues: emptyQueues,
      scopeSummaries,
      trackedPromptCount: 1,
    });

    expect(actions.some((action) => action.label === "비어 있는 scope 보강")).toBe(true);
  });

  it("recommends generating a learning-aware prompt when memories exist but no prompt is tracked", () => {
    const actions = summarizeLearningOpsActions({
      memories: [buildMemory()],
      queues: emptyQueues,
      scopeSummaries: fullScopeSummaries,
      trackedPromptCount: 0,
    });

    expect(actions.some((action) => action.label === "학습 반영 프롬프트 생성")).toBe(true);
  });

  it("recommends reviewing untracked prompts when the untracked bucket has prompts", () => {
    const scopeSummaries: LearningScopeSummary[] = fullScopeSummaries.map((summary) =>
      summary.scope === "untracked" ? { ...summary, promptCount: 2 } : summary,
    );

    const actions = summarizeLearningOpsActions({
      memories: [buildMemory()],
      queues: emptyQueues,
      scopeSummaries,
      trackedPromptCount: 1,
    });

    expect(actions.some((action) => action.label === "학습 메타 미기록 프롬프트 점검")).toBe(true);
  });

  it("recommends reviewing manual memories when the manual queue has entries", () => {
    const queues: LearningReviewQueue[] = emptyQueues.map((queue) =>
      queue.id === "manual" ? { ...queue, count: 2 } : queue,
    );

    const actions = summarizeLearningOpsActions({
      memories: [buildMemory()],
      queues,
      scopeSummaries: fullScopeSummaries,
      trackedPromptCount: 1,
    });

    expect(actions.some((action) => action.label === "수동 메모리 정합성 점검")).toBe(true);
  });

  it("falls back to a generic weekly-review action when nothing else applies", () => {
    const actions = summarizeLearningOpsActions({
      memories: [buildMemory()],
      queues: emptyQueues,
      scopeSummaries: fullScopeSummaries,
      trackedPromptCount: 1,
    });

    expect(actions).toEqual([
      {
        href: "/learning?sort=updated-desc",
        label: "주간 학습 품질 점검 유지",
        priority: "low",
        description: "최근 업데이트 기준으로 메모리 변화와 프롬프트 반영 상태 확인",
      },
    ]);
  });

  it("caps the returned action list at 4 entries", () => {
    const queues: LearningReviewQueue[] = [
      { id: "low-confidence", href: "/a", label: "낮은 신뢰도", count: 5, description: "" },
      { id: "manual", href: "/b", label: "수동", count: 5, description: "" },
      { id: "latest", href: "/c", label: "최근", count: 5, description: "" },
    ];
    const scopeSummaries: LearningScopeSummary[] = fullScopeSummaries.map((summary) =>
      summary.scope === "skill" || summary.scope === "untracked"
        ? { ...summary, memoryCount: 0, promptCount: 3 }
        : summary,
    );

    const actions = summarizeLearningOpsActions({
      memories: [],
      queues,
      scopeSummaries,
      trackedPromptCount: 0,
    });

    expect(actions.length).toBeLessThanOrEqual(4);
  });
});

describe("summarizePersonalizationActions", () => {
  const baseArgs = {
    companyCompletion: 100,
    companyMemoryCount: 1,
    profileCompletion: 100,
    promptCount: 1,
    trackedPromptCount: 1,
    userMemoryCount: 1,
  };

  it("recommends filling the personal profile when profileCompletion is below 80", () => {
    const actions = summarizePersonalizationActions({ ...baseArgs, profileCompletion: 50 });

    expect(actions.some((action) => action.label === "개인 프로필 보강")).toBe(true);
  });

  it("recommends filling company criteria when companyCompletion is below 80", () => {
    const actions = summarizePersonalizationActions({ ...baseArgs, companyCompletion: 40 });

    expect(actions.some((action) => action.label === "회사 기준 보강")).toBe(true);
  });

  it("recommends creating a user-scope memory once profile is complete but no memory exists", () => {
    const actions = summarizePersonalizationActions({
      ...baseArgs,
      profileCompletion: 90,
      userMemoryCount: 0,
    });

    expect(actions.some((action) => action.label === "개인 기준 메모리 반영")).toBe(true);
  });

  it("recommends creating a company-scope memory once company profile is complete but no memory exists", () => {
    const actions = summarizePersonalizationActions({
      ...baseArgs,
      companyCompletion: 90,
      companyMemoryCount: 0,
    });

    expect(actions.some((action) => action.label === "회사 기준 메모리 반영")).toBe(true);
  });

  it("recommends creating the first personalized prompt when promptCount is zero", () => {
    const actions = summarizePersonalizationActions({ ...baseArgs, promptCount: 0 });

    expect(actions.some((action) => action.label === "첫 개인화 프롬프트 생성")).toBe(true);
  });

  it("recommends regenerating with learning context when prompts exist but none are tracked", () => {
    const actions = summarizePersonalizationActions({
      ...baseArgs,
      promptCount: 3,
      trackedPromptCount: 0,
    });

    expect(actions.some((action) => action.label === "학습 반영 프롬프트 재생성")).toBe(true);
  });

  it("falls back to a periodic-review action when everything is already in good shape", () => {
    const actions = summarizePersonalizationActions(baseArgs);

    expect(actions).toEqual([
      {
        href: "/learning?sort=updated-desc",
        label: "개인화 기준 정기 점검",
        priority: "low",
        description: "최근 메모리와 저장 프롬프트를 주기적으로 확인해 오래된 기준을 정리하세요.",
      },
    ]);
  });

  it("caps the returned action list at 4 entries", () => {
    const actions = summarizePersonalizationActions({
      companyCompletion: 10,
      companyMemoryCount: 0,
      profileCompletion: 10,
      promptCount: 0,
      trackedPromptCount: 0,
      userMemoryCount: 0,
    });

    expect(actions.length).toBeLessThanOrEqual(4);
  });
});
