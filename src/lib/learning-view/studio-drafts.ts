import type { LearningMemory } from "@/lib/prompt";
import { stripMemoryReferenceLinks } from "@/lib/learning/memory";
import {
  reviewFilterLabels,
  scopeLabels,
  sortLabels,
  sourceTypeLabels,
  type LearningReviewFilter,
  type LearningScopeFilter,
  type LearningSortMode,
} from "./labels";
import { buildLearningReadinessReportText } from "./report-text";
import { getLearningReadiness } from "./readiness";

export function buildMemoryStudioDraftInput(memory: LearningMemory) {
  const memoryContent = stripMemoryReferenceLinks(memory.content);

  return [
    "다음 학습 메모리를 반드시 반영해서 새 프롬프트를 설계해줘.",
    "",
    "## Learning memory",
    `- Title: ${memory.title}`,
    `- Scope: ${scopeLabels[memory.scope]}`,
    `- Source: ${sourceTypeLabels[memory.sourceType]}`,
    `- Confidence: ${memory.confidence.toFixed(2)}`,
    `- Tags: ${memory.tags.length ? memory.tags.join(", ") : "-"}`,
    "",
    "## Memory content",
    memoryContent,
    "",
    "## Task",
    "이 기준을 반영해 GPT, Claude, Codex, Gemini 등에 전달할 수 있는 전문 프롬프트를 만들어줘.",
    "아직 실제 업무 입력이 부족하면, 사용자가 채워야 할 source input과 변수 슬롯을 명확히 분리해줘.",
  ].join("\n");
}

export function buildFilteredMemoriesStudioDraftInput({
  filteredMemories,
  query,
  reviewFilter,
  scope,
  sortMode,
  totalMemories,
}: {
  filteredMemories: LearningMemory[];
  query: string;
  reviewFilter: LearningReviewFilter;
  scope: LearningScopeFilter;
  sortMode: LearningSortMode;
  totalMemories: number;
}) {
  return [
    "다음 학습 메모리 묶음을 반드시 반영해서 새 프롬프트를 설계해줘.",
    "",
    "## Learning filter",
    `- Scope: ${scopeLabels[scope]}`,
    `- Review filter: ${reviewFilterLabels[reviewFilter]}`,
    `- Sort: ${sortLabels[sortMode]}`,
    `- Query: ${query.trim() || "-"}`,
    `- Selected memories: ${filteredMemories.length}/${totalMemories}`,
    "",
    "## Learning memories",
    filteredMemories
      .map((memory, index) =>
        [
          `### ${index + 1}. ${memory.title}`,
          `- Scope: ${scopeLabels[memory.scope]}`,
          `- Source: ${sourceTypeLabels[memory.sourceType]}`,
          `- Confidence: ${memory.confidence.toFixed(2)}`,
          `- Tags: ${memory.tags.length ? memory.tags.join(", ") : "-"}`,
          "",
          stripMemoryReferenceLinks(memory.content),
        ].join("\n"),
      )
      .join("\n\n"),
    "",
    "## Task",
    "위 학습 기준들을 함께 반영해 GPT, Claude, Codex, Gemini 등에 전달할 수 있는 전문 프롬프트를 만들어줘.",
    "기준끼리 충돌하는 부분이 있으면 충돌 항목과 우선순위 제안을 분리해줘.",
    "아직 실제 업무 입력이 부족하면, 사용자가 채워야 할 source input과 변수 슬롯을 명확히 분리해줘.",
  ].join("\n");
}

export function buildFeedbackImprovementQueueStudioDraftInput({
  filteredMemories,
  query,
  reviewFilter,
  scope,
  sortMode,
  totalMemories,
}: {
  filteredMemories: LearningMemory[];
  query: string;
  reviewFilter: LearningReviewFilter;
  scope: LearningScopeFilter;
  sortMode: LearningSortMode;
  totalMemories: number;
}) {
  return [
    "Role:",
    "You are a senior prompt quality operator converting repeated feedback into reusable prompt rules.",
    "",
    "Objective:",
    "Use the feedback-improvement Learning memory queue below to create a practical prompt improvement plan.",
    "",
    "Instructions:",
    "- Treat each memory as an evidence-backed feedback rule, not as a generic note.",
    "- Extract reusable prompting rules for GPT, Claude, Codex, Gemini, and MCP-assisted workflows.",
    "- Separate rules by output format, context completeness, accuracy checks, tone, company criteria, and task workflow when relevant.",
    "- Identify low-confidence or conflicting rules that need more evidence before broad reuse.",
    "- Return Korean operating notes, but write reusable AI instructions in English or Korean-English hybrid when that improves model output.",
    "- Do not invent missing user, company, customer, or domain facts.",
    "",
    "## Feedback improvement queue",
    `- Scope: ${scopeLabels[scope]}`,
    `- Review filter: ${reviewFilterLabels[reviewFilter]}`,
    `- Sort: ${sortLabels[sortMode]}`,
    `- Query: ${query.trim() || "-"}`,
    `- Selected memories: ${filteredMemories.length}/${totalMemories}`,
    "",
    "## Required output",
    "1. Priority prompt rules to reuse immediately",
    "2. Rules that need more feedback evidence",
    "3. Suggested Studio prompt template updates",
    "4. External AI handoff checklist for GPT/Claude/Codex/Gemini",
    "5. Next Learning memory cleanup or merge actions",
    "",
    "## Learning memories",
    filteredMemories
      .map((memory, index) =>
        [
          `### ${index + 1}. ${memory.title}`,
          `- Scope: ${scopeLabels[memory.scope]}`,
          `- Source: ${sourceTypeLabels[memory.sourceType]}`,
          `- Confidence: ${memory.confidence.toFixed(2)}`,
          `- Tags: ${memory.tags.length ? memory.tags.join(", ") : "-"}`,
          "",
          stripMemoryReferenceLinks(memory.content),
        ].join("\n"),
      )
      .join("\n\n"),
  ].join("\n");
}

export function buildFeedbackImprovementLowConfidenceStudioDraftInput({
  filteredMemories,
  scope,
  totalMemories,
}: {
  filteredMemories: LearningMemory[];
  scope: LearningScopeFilter;
  totalMemories: number;
}) {
  return [
    "Role:",
    "You are a senior prompt quality operator auditing low-confidence feedback rules before they are reused in production prompts.",
    "",
    "Objective:",
    "Use the low-confidence feedback-improvement Learning memory subset below to decide what needs more evidence, what should be narrowed, and what should be merged or removed.",
    "",
    "Instructions:",
    "- Treat every memory as provisional until enough execution feedback supports it.",
    "- Do not turn low-confidence memories into reusable prompt rules without a validation plan.",
    "- Separate evidence gaps from rule conflicts, vague wording, duplicated guidance, and scope mismatch.",
    "- For each memory, propose the smallest next action: collect more feedback, narrow scope, merge with a stronger rule, rewrite, or remove.",
    "- Return Korean operating notes, but write validation questions and future AI instructions in English or Korean-English hybrid when that improves model output.",
    "- Do not invent missing user, company, customer, or domain facts.",
    "",
    "## Low-confidence feedback improvement queue",
    `- Scope: ${scopeLabels[scope]}`,
    "- Review filter: 낮은 신뢰도",
    "- Sort: 신뢰도 낮은순",
    "- Query: feedback-improvement",
    `- Selected low-confidence memories: ${filteredMemories.length}/${totalMemories}`,
    "",
    "## Required output",
    "1. Evidence gaps to resolve before reuse",
    "2. Validation questions to collect from Library feedback or external AI runs",
    "3. Rules to narrow by scope, workflow, output format, or target model",
    "4. Merge/rewrite/remove recommendations",
    "5. Updated Learning memory candidates ready to save after validation",
    "",
    "## Low-confidence memories",
    filteredMemories
      .map((memory, index) =>
        [
          `### ${index + 1}. ${memory.title}`,
          `- Scope: ${scopeLabels[memory.scope]}`,
          `- Source: ${sourceTypeLabels[memory.sourceType]}`,
          `- Confidence: ${memory.confidence.toFixed(2)}`,
          `- Tags: ${memory.tags.length ? memory.tags.join(", ") : "-"}`,
          "",
          stripMemoryReferenceLinks(memory.content),
        ].join("\n"),
      )
      .join("\n\n"),
  ].join("\n");
}

export function buildLearningReadinessStudioDraftInput({
  baseUrl,
  memories,
  readiness,
}: {
  baseUrl?: string;
  memories: LearningMemory[];
  readiness: ReturnType<typeof getLearningReadiness>;
}) {
  return [
    "Role:",
    "You are a senior prompt operations strategist improving a personalized AI learning memory system.",
    "",
    "Objective:",
    "Use the Learning readiness report below to create an execution-ready plan that improves personalization coverage and prompt quality.",
    "",
    "Instructions:",
    "- Prioritize missing scopes, low-confidence memories, and stale learning context.",
    "- Separate actions for user, company, domain, and skill memory coverage.",
    "- Use the review links in the report as operating queues.",
    "- Do not invent missing user, company, customer, or domain facts.",
    "- Return the plan in Korean, but write reusable AI prompt instructions in English when useful.",
    "",
    "Learning readiness report:",
    buildLearningReadinessReportText({ baseUrl, memories, readiness }),
  ].join("\n");
}

export function formatLearningFilterSourceTitle({
  count,
  query,
  reviewFilter,
  scope,
  sortMode,
}: {
  count: number;
  query: string;
  reviewFilter: LearningReviewFilter;
  scope: LearningScopeFilter;
  sortMode: LearningSortMode;
}) {
  const parts = [
    scopeLabels[scope],
    reviewFilter !== "all" ? reviewFilterLabels[reviewFilter] : undefined,
    query.trim() ? `검색 ${query.trim()}` : undefined,
    sortMode !== "confidence-desc" ? sortLabels[sortMode] : undefined,
    `${count}개`,
  ].filter(Boolean);

  return parts.join(" · ");
}
