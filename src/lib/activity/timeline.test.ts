import { describe, expect, it } from "vitest";

import type { LearningMemory, PromptAsset, PromptSkill } from "@/lib/prompt";
import {
  buildActivityTimeline,
  getActivityDayKey,
  groupActivityEventsByDay,
} from "@/lib/activity/timeline";

function makePrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  return {
    id: "prompt-1",
    title: "테스트 프롬프트",
    source: "local",
    rawInput: "raw",
    goal: "goal",
    domain: "마케팅",
    targetModels: ["general"],
    versions: [],
    feedback: [],
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-01T09:00:00.000Z",
    ...overrides,
  };
}

function makeSkill(overrides: Partial<PromptSkill> = {}): PromptSkill {
  return {
    id: "skill-1",
    name: "테스트 스킬",
    description: "설명",
    domain: "마케팅",
    targetModel: "general",
    inputGuide: "",
    promptTemplate: "",
    outputFormat: "",
    qualityChecklist: [],
    tags: [],
    usageCount: 0,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
    ...overrides,
  };
}

function makeMemory(overrides: Partial<LearningMemory> = {}): LearningMemory {
  return {
    id: "memory-1",
    scope: "user",
    sourceType: "manual",
    sourceId: "source-1",
    title: "테스트 메모리",
    content: "내용",
    tags: [],
    confidence: 0.8,
    createdAt: "2026-07-01T07:00:00.000Z",
    updatedAt: "2026-07-01T07:00:00.000Z",
    ...overrides,
  };
}

describe("buildActivityTimeline", () => {
  it("returns an empty array for empty input", () => {
    expect(buildActivityTimeline({ prompts: [], skills: [], memories: [] })).toEqual(
      [],
    );
  });

  it("derives a prompt-created event for a plain prompt", () => {
    const [event] = buildActivityTimeline({
      prompts: [makePrompt()],
      skills: [],
      memories: [],
    });

    expect(event.type).toBe("prompt-created");
    expect(event.id).toBe("prompt-prompt-1");
    expect(event.timestamp).toBe("2026-07-01T09:00:00.000Z");
    expect(event.title).toBe("테스트 프롬프트");
    expect(event.href).toContain("prompt=prompt-1");
  });

  it("derives a prompt-improved event when improvementSource is present", () => {
    const [event] = buildActivityTimeline({
      prompts: [
        makePrompt({
          improvementSource: {
            type: "library-improvement",
          } as PromptAsset["improvementSource"],
        }),
      ],
      skills: [],
      memories: [],
    });

    expect(event.type).toBe("prompt-improved");
  });

  it("derives a skill-run event when sourceSkillId is present", () => {
    const [event] = buildActivityTimeline({
      prompts: [makePrompt({ sourceSkillId: "skill-1" })],
      skills: [],
      memories: [],
    });

    expect(event.type).toBe("skill-run");
  });

  it("prefers improvementSource over sourceSkillId", () => {
    const [event] = buildActivityTimeline({
      prompts: [
        makePrompt({
          sourceSkillId: "skill-1",
          improvementSource: {
            type: "library-improvement",
          } as PromptAsset["improvementSource"],
        }),
      ],
      skills: [],
      memories: [],
    });

    expect(event.type).toBe("prompt-improved");
  });

  it("derives a feedback event per feedback entry with its own timestamp", () => {
    const events = buildActivityTimeline({
      prompts: [
        makePrompt({
          feedback: [
            {
              id: "feedback-1",
              promptVersionId: "version-1",
              rating: 5,
              comment: "좋아요",
              feedbackType: "tone",
              createdAt: "2026-07-02T10:00:00.000Z",
            },
          ],
        }),
      ],
      skills: [],
      memories: [],
    });

    const feedbackEvent = events.find((event) => event.type === "feedback");

    expect(feedbackEvent).toBeDefined();
    expect(feedbackEvent?.id).toBe("feedback-feedback-1");
    expect(feedbackEvent?.timestamp).toBe("2026-07-02T10:00:00.000Z");
    expect(feedbackEvent?.detail).toBe("좋아요");
  });

  it("falls back to prompt.updatedAt when feedback has no timestamp", () => {
    const events = buildActivityTimeline({
      prompts: [
        makePrompt({
          updatedAt: "2026-07-03T00:00:00.000Z",
          feedback: [
            {
              id: "feedback-2",
              promptVersionId: "version-1",
              rating: 4,
              comment: "",
              feedbackType: "other",
              createdAt: "",
            },
          ],
        }),
      ],
      skills: [],
      memories: [],
    });

    const feedbackEvent = events.find((event) => event.type === "feedback");

    expect(feedbackEvent?.timestamp).toBe("2026-07-03T00:00:00.000Z");
  });

  it("derives a skill-created event for each skill", () => {
    const [event] = buildActivityTimeline({
      prompts: [],
      skills: [makeSkill()],
      memories: [],
    });

    expect(event.type).toBe("skill-created");
    expect(event.id).toBe("skill-skill-1");
    expect(event.href).toContain("skill=skill-1");
  });

  it("derives a memory-added event for each memory", () => {
    const [event] = buildActivityTimeline({
      prompts: [],
      skills: [],
      memories: [makeMemory()],
    });

    expect(event.type).toBe("memory-added");
    expect(event.id).toBe("memory-memory-1");
    expect(event.href).toBe("/learning");
  });

  it("orders all events newest first across mixed sources", () => {
    const events = buildActivityTimeline({
      prompts: [makePrompt({ id: "p1", createdAt: "2026-07-01T00:00:00.000Z" })],
      skills: [makeSkill({ id: "s1", createdAt: "2026-07-03T00:00:00.000Z" })],
      memories: [makeMemory({ id: "m1", createdAt: "2026-07-02T00:00:00.000Z" })],
    });

    expect(events.map((event) => event.id)).toEqual([
      "skill-s1",
      "memory-m1",
      "prompt-p1",
    ]);
  });

  it("breaks timestamp ties deterministically by id descending", () => {
    const events = buildActivityTimeline({
      prompts: [
        makePrompt({ id: "a", createdAt: "2026-07-01T00:00:00.000Z" }),
        makePrompt({ id: "b", createdAt: "2026-07-01T00:00:00.000Z" }),
      ],
      skills: [],
      memories: [],
    });

    expect(events.map((event) => event.id)).toEqual(["prompt-b", "prompt-a"]);
  });

  it("is deterministic across repeated calls with the same input", () => {
    const input = {
      prompts: [makePrompt()],
      skills: [makeSkill()],
      memories: [makeMemory()],
    };

    expect(buildActivityTimeline(input)).toEqual(buildActivityTimeline(input));
  });
});

describe("getActivityDayKey", () => {
  it("returns the ISO date portion of a timestamp", () => {
    expect(getActivityDayKey("2026-07-03T12:34:56.000Z")).toBe("2026-07-03");
  });

  it("returns unknown for an invalid timestamp", () => {
    expect(getActivityDayKey("not-a-date")).toBe("unknown");
  });
});

describe("groupActivityEventsByDay", () => {
  it("groups events sharing the same calendar day", () => {
    const events = buildActivityTimeline({
      prompts: [
        makePrompt({ id: "p1", createdAt: "2026-07-02T09:00:00.000Z" }),
        makePrompt({ id: "p2", createdAt: "2026-07-02T18:00:00.000Z" }),
        makePrompt({ id: "p3", createdAt: "2026-07-01T09:00:00.000Z" }),
      ],
      skills: [],
      memories: [],
    });

    const groups = groupActivityEventsByDay(events);

    expect(groups).toHaveLength(2);
    expect(groups[0].dayKey).toBe("2026-07-02");
    expect(groups[0].events).toHaveLength(2);
    expect(groups[1].dayKey).toBe("2026-07-01");
    expect(groups[1].events).toHaveLength(1);
  });

  it("returns an empty array when there are no events", () => {
    expect(groupActivityEventsByDay([])).toEqual([]);
  });
});
