import type { LearningMemory, PromptAsset, PromptSkill } from "@/lib/prompt";
import { buildPromptLibraryHref, buildSkillHref } from "@/lib/skills-view/hrefs";
import { getLearningHref } from "@/lib/learning-view/hrefs";

export type ActivityType =
  | "prompt-created"
  | "prompt-improved"
  | "skill-run"
  | "feedback"
  | "memory-added"
  | "skill-created";

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: ActivityType;
  title: string;
  detail?: string;
  href: string;
}

export interface ActivityDayGroup {
  dayKey: string;
  events: ActivityEvent[];
}

interface BuildActivityTimelineInput {
  prompts: PromptAsset[];
  skills: PromptSkill[];
  memories: LearningMemory[];
}

const learningHref = getLearningHref({
  query: "",
  reviewFilter: "all",
  scope: "all",
  sortMode: "confidence-desc",
});

function derivePromptEventType(prompt: PromptAsset): ActivityType {
  if (prompt.improvementSource) {
    return "prompt-improved";
  }

  if (prompt.sourceSkillId) {
    return "skill-run";
  }

  return "prompt-created";
}

function buildPromptEvent(prompt: PromptAsset): ActivityEvent {
  return {
    id: `prompt-${prompt.id}`,
    timestamp: prompt.createdAt,
    type: derivePromptEventType(prompt),
    title: prompt.title,
    detail: prompt.domain || undefined,
    href: buildPromptLibraryHref(prompt.id),
  };
}

function buildFeedbackEvents(prompt: PromptAsset): ActivityEvent[] {
  return prompt.feedback.map((feedback) => ({
    id: `feedback-${feedback.id}`,
    timestamp: feedback.createdAt || prompt.updatedAt,
    type: "feedback" as const,
    title: prompt.title,
    detail: feedback.comment || undefined,
    href: buildPromptLibraryHref(prompt.id),
  }));
}

function buildSkillEvent(skill: PromptSkill): ActivityEvent {
  return {
    id: `skill-${skill.id}`,
    timestamp: skill.createdAt,
    type: "skill-created",
    title: skill.name,
    detail: skill.description || undefined,
    href: buildSkillHref(skill.id),
  };
}

function buildMemoryEvent(memory: LearningMemory): ActivityEvent {
  return {
    id: `memory-${memory.id}`,
    timestamp: memory.createdAt,
    type: "memory-added",
    title: memory.title,
    detail: memory.content || undefined,
    href: learningHref,
  };
}

function compareEventsDesc(a: ActivityEvent, b: ActivityEvent) {
  const timeDiff = Date.parse(b.timestamp) - Date.parse(a.timestamp);

  if (timeDiff !== 0) {
    return timeDiff;
  }

  return b.id.localeCompare(a.id);
}

export function buildActivityTimeline({
  prompts,
  skills,
  memories,
}: BuildActivityTimelineInput): ActivityEvent[] {
  const promptEvents = prompts.map(buildPromptEvent);
  const feedbackEvents = prompts.flatMap(buildFeedbackEvents);
  const skillEvents = skills.map(buildSkillEvent);
  const memoryEvents = memories.map(buildMemoryEvent);

  return [...promptEvents, ...feedbackEvents, ...skillEvents, ...memoryEvents].sort(
    compareEventsDesc,
  );
}

export function getActivityDayKey(timestamp: string): string {
  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return "unknown";
  }

  return parsed.toISOString().slice(0, 10);
}

export function groupActivityEventsByDay(
  events: ActivityEvent[],
): ActivityDayGroup[] {
  const groups: ActivityDayGroup[] = [];
  const groupIndexByKey = new Map<string, number>();

  for (const event of events) {
    const dayKey = getActivityDayKey(event.timestamp);
    const existingIndex = groupIndexByKey.get(dayKey);

    if (existingIndex === undefined) {
      groupIndexByKey.set(dayKey, groups.length);
      groups.push({ dayKey, events: [event] });
    } else {
      groups[existingIndex] = {
        ...groups[existingIndex],
        events: [...groups[existingIndex].events, event],
      };
    }
  }

  return groups;
}
