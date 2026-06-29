"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  PageHeader,
  Panel,
  PanelHeader,
  ScoreBar,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
  textareaClass,
} from "@/components/ui";
import {
  ContextOperatingFlow,
  type ContextOperatingFlowItem,
} from "@/components/context/context-operating-flow";
import type { LearningMemory, MemoryScope } from "@/lib/prompt";
import { useLearningMemoriesStore } from "@/lib/data/workspace-store";
import {
  formatAbsoluteInternalHref,
  normalizeInternalHref,
} from "@/lib/navigation/href";
import {
  splitMemoryContentDisplay,
  stripMemoryReferenceLinks,
} from "@/lib/learning/memory";
import { writeStudioDraft } from "@/lib/studio/draft";
import { copyTextToClipboard } from "@/lib/browser/clipboard";

export type LearningScopeFilter = MemoryScope | "all";
export type LearningReviewFilter =
  | "all"
  | "low-confidence"
  | "manual"
  | "generated";
export type LearningSortMode =
  | "confidence-desc"
  | "confidence-asc"
  | "updated-desc"
  | "updated-asc";
type LearningManualCopy = {
  id: string;
  title: string;
  body: string;
  reason?: string;
};

const scopeLabels: Record<LearningScopeFilter, string> = {
  all: "전체",
  user: "사용자",
  company: "회사",
  domain: "분야",
  skill: "스킬",
};

const scopes: LearningScopeFilter[] = [
  "all",
  "user",
  "company",
  "domain",
  "skill",
];
const trackedScopes: MemoryScope[] = ["user", "company", "domain", "skill"];
const confidenceOptions = [
  { label: "높음", value: 0.85 },
  { label: "보통", value: 0.65 },
  { label: "낮음", value: 0.45 },
];
const reviewFilterLabels: Record<LearningReviewFilter, string> = {
  all: "전체",
  "low-confidence": "낮은 신뢰도",
  manual: "수동 메모리",
  generated: "자동 생성",
};
const reviewFilters: LearningReviewFilter[] = [
  "all",
  "low-confidence",
  "manual",
  "generated",
];
const sortLabels: Record<LearningSortMode, string> = {
  "confidence-desc": "신뢰도 높은순",
  "confidence-asc": "신뢰도 낮은순",
  "updated-desc": "최근 업데이트순",
  "updated-asc": "오래된 업데이트순",
};
const learningReadinessHref = "/learning#readiness";
const feedbackImprovementValidationLibraryHref =
  normalizeInternalHref(
    "/library?studioSource=learning-feedback-improvement&studioVariant=learning-low-confidence-validation",
  ) ?? "/library";
const feedbackImprovementReleaseGateCommand =
  "npm run verify:evidence -- --out-dir docs/evidence\nnpm run verify:release-candidate";
const sortModes: LearningSortMode[] = [
  "confidence-desc",
  "confidence-asc",
  "updated-desc",
  "updated-asc",
];
const sourceTypeLabels: Record<LearningMemory["sourceType"], string> = {
  feedback: "피드백",
  profile: "프로필",
  company: "회사 기준",
  manual: "수동",
};

function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeMemoryContent(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function findDuplicateMemory(
  memories: LearningMemory[],
  scope: MemoryScope,
  content: string,
  exceptId?: string,
) {
  const normalized = normalizeMemoryContent(content);

  return memories.find(
    (memory) =>
      memory.id !== exceptId &&
      memory.scope === scope &&
      normalizeMemoryContent(memory.content) === normalized,
  );
}

function LearningManualCopyPanel({
  copy,
  onClose,
}: {
  copy: LearningManualCopy;
  onClose: () => void;
}) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-soft">수동 복사 필요</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {copy.reason ?? `${copy.title} 복사가 차단됐습니다.`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-accent transition hover:text-soft"
        >
          닫기
        </button>
      </div>
      <textarea
        readOnly
        value={copy.body}
        className="mt-3 h-40 w-full resize-y rounded-md border border-line bg-panel px-3 py-2 font-mono text-xs leading-5 text-soft outline-none"
        aria-label={`수동 복사용 ${copy.title}`}
      />
    </div>
  );
}

function matchesReviewFilter(
  memory: LearningMemory,
  reviewFilter: LearningReviewFilter,
) {
  if (reviewFilter === "low-confidence") {
    return memory.confidence < 0.5;
  }

  if (reviewFilter === "manual") {
    return memory.sourceType === "manual";
  }

  if (reviewFilter === "generated") {
    return memory.sourceType !== "manual";
  }

  return true;
}

function compareMemories(
  first: LearningMemory,
  second: LearningMemory,
  sortMode: LearningSortMode,
) {
  if (sortMode === "confidence-asc") {
    if (first.confidence === second.confidence) {
      return second.updatedAt.localeCompare(first.updatedAt);
    }

    return first.confidence - second.confidence;
  }

  if (sortMode === "updated-desc") {
    if (second.updatedAt === first.updatedAt) {
      return second.confidence - first.confidence;
    }

    return second.updatedAt.localeCompare(first.updatedAt);
  }

  if (sortMode === "updated-asc") {
    if (first.updatedAt === second.updatedAt) {
      return second.confidence - first.confidence;
    }

    return first.updatedAt.localeCompare(second.updatedAt);
  }

  if (second.confidence === first.confidence) {
    return second.updatedAt.localeCompare(first.updatedAt);
  }

  return second.confidence - first.confidence;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getLatestMemoryDate(memories: LearningMemory[]) {
  return memories
    .map((memory) => memory.updatedAt)
    .sort((a, b) => b.localeCompare(a))[0];
}

function getLearningReadiness(memories: LearningMemory[]) {
  const scopeCounts = trackedScopes.reduce(
    (result, scope) => ({
      ...result,
      [scope]: memories.filter((memory) => memory.scope === scope).length,
    }),
    {} as Record<MemoryScope, number>,
  );
  const coveredScopes = trackedScopes.filter((scope) => scopeCounts[scope] > 0);
  const missingScopes = trackedScopes.filter((scope) => scopeCounts[scope] === 0);
  const averageConfidence =
    memories.length === 0
      ? 0
      : memories.reduce((sum, memory) => sum + memory.confidence, 0) /
        memories.length;
  const lowConfidenceCount = memories.filter(
    (memory) => memory.confidence < 0.5,
  ).length;
  const highConfidenceCount = memories.filter(
    (memory) => memory.confidence >= 0.75,
  ).length;
  const score = Math.round(
    Math.min(
      100,
      memories.length * 8 +
        coveredScopes.length * 14 +
        averageConfidence * 28 -
        lowConfidenceCount * 4,
    ),
  );

  let label = "학습 시작 필요";
  let description =
    "아직 생성에 반영할 학습 메모리가 충분하지 않습니다.";
  let tone = "border-danger/40 text-danger";

  if (score >= 75 && coveredScopes.length >= 3) {
    label = "운영 준비 양호";
    description =
      "대부분의 핵심 scope에 생성 기준이 쌓여 있어 Studio 반영 품질을 확인할 수 있습니다.";
    tone = "border-success/50 text-success";
  } else if (score >= 45 || coveredScopes.length >= 2) {
    label = "학습 확장 중";
    description =
      "일부 scope는 준비됐지만 반복 사용을 위해 추가 피드백과 기준 보강이 필요합니다.";
    tone = "border-attention/50 text-attention";
  } else if (memories.length > 0) {
    label = "보강 필요";
    description =
      "학습 메모리는 있지만 scope 커버리지나 신뢰도가 아직 낮습니다.";
    tone = "border-attention/50 text-attention";
  }

  const actions = [
    memories.length === 0
      ? "Library에서 실제 생성 결과에 피드백을 남겨 첫 학습 메모리를 만듭니다."
      : "",
    missingScopes.includes("company")
      ? "회사 기준 화면에서 브랜드 톤, 제품, 고객군을 저장합니다."
      : "",
    missingScopes.includes("user")
      ? "사용자 선호가 드러나는 피드백을 tone 또는 other 유형으로 남깁니다."
      : "",
    missingScopes.includes("domain")
      ? "분야별 정확성/맥락 피드백을 남겨 domain 기준을 늘립니다."
      : "",
    missingScopes.includes("skill")
      ? "반복 업무의 출력 형식 피드백을 남겨 skill 패턴을 만듭니다."
      : "",
    lowConfidenceCount > 0
      ? "낮은 신뢰도 메모리는 같은 기준의 추가 피드백으로 보강합니다."
      : "",
  ].filter(Boolean);

  return {
    actions: actions.length
      ? actions.slice(0, 4)
      : ["Studio에서 새 프롬프트를 생성하고 결과 품질을 비교합니다."],
    averageConfidence,
    coveredScopes,
    highConfidenceCount,
    label,
    latestMemoryDate: getLatestMemoryDate(memories),
    lowConfidenceCount,
    missingScopes,
    score,
    scopeCounts,
    tone,
    description,
  };
}

function buildLearningReadinessReportText({
  baseUrl,
  memories,
  readiness,
}: {
  baseUrl?: string;
  memories: LearningMemory[];
  readiness: ReturnType<typeof getLearningReadiness>;
}) {
  const formatLearningHref = (href: string) =>
    formatAbsoluteInternalHref(href, baseUrl) ?? href;

  return [
    "# 학습 준비도 리포트",
    "",
    `- 상태: ${readiness.label}`,
    `- 준비도 점수: ${readiness.score}/100`,
    `- 전체 메모리: ${memories.length}개`,
    `- 평균 신뢰도: ${
      memories.length ? readiness.averageConfidence.toFixed(2) : "-"
    }`,
    `- Scope 커버리지: ${readiness.coveredScopes.length}/4`,
    `- Covered scope: ${
      readiness.coveredScopes.length
        ? readiness.coveredScopes.map((scope) => scopeLabels[scope]).join(", ")
        : "없음"
    }`,
    `- Missing scope: ${
      readiness.missingScopes.length
        ? readiness.missingScopes.map((scope) => scopeLabels[scope]).join(", ")
        : "없음"
    }`,
    `- 높은 신뢰도 메모리: ${readiness.highConfidenceCount}개`,
    `- 낮은 신뢰도 메모리: ${readiness.lowConfidenceCount}개`,
    `- 최근 업데이트: ${
      readiness.latestMemoryDate ? formatDate(readiness.latestMemoryDate) : "-"
    }`,
    "",
    "## 다음 액션",
    readiness.actions.map((action) => `- ${action}`).join("\n"),
    "",
    "## 점검 링크",
    `- 준비도 화면: ${formatLearningHref(learningReadinessHref)}`,
    `- 전체 학습 메모리: ${formatLearningHref(
      getLearningHref({
        query: "",
        reviewFilter: "all",
        scope: "all",
        sortMode: "confidence-desc",
      }),
    )}`,
    `- 낮은 신뢰도: ${formatLearningHref(
      getLearningHref({
        query: "",
        reviewFilter: "low-confidence",
        scope: "all",
        sortMode: "confidence-asc",
      }),
    )}`,
    `- 최근 업데이트: ${formatLearningHref(
      getLearningHref({
        query: "",
        reviewFilter: "all",
        scope: "all",
        sortMode: "updated-desc",
      }),
    )}`,
    "",
    "## Scope별 메모리",
    trackedScopes
      .map(
        (scope) =>
          `- ${scopeLabels[scope]}: ${readiness.scopeCounts[scope]}개 · ${formatLearningHref(
            getLearningHref({
              query: "",
              reviewFilter: "all",
              scope,
              sortMode: "confidence-desc",
            }),
          )}`,
      )
      .join("\n"),
  ].join("\n");
}

function buildFilteredMemoryReportText({
  baseUrl,
  filteredMemories,
  query,
  reviewFilter,
  scope,
  sortMode,
  totalMemories,
}: {
  baseUrl?: string;
  filteredMemories: LearningMemory[];
  query: string;
  reviewFilter: LearningReviewFilter;
  scope: LearningScopeFilter;
  sortMode: LearningSortMode;
  totalMemories: number;
}) {
  const filterHref = getLearningHref({ query, reviewFilter, scope, sortMode });
  const absoluteFilterHref =
    formatAbsoluteInternalHref(filterHref, baseUrl) ?? filterHref;

  return [
    "# 학습 메모리 필터 결과",
    "",
    "## 조건",
    `- 조건 링크: ${absoluteFilterHref}`,
    `- 범위: ${scopeLabels[scope]}`,
    `- 검토 기준: ${reviewFilterLabels[reviewFilter]}`,
    `- 정렬: ${sortLabels[sortMode]}`,
    `- 검색어: ${query.trim() || "-"}`,
    `- 결과: ${filteredMemories.length}/${totalMemories}개`,
    "",
    "## 메모리",
    filteredMemories.length
      ? filteredMemories
          .map((memory, index) =>
            [
              `### ${index + 1}. ${memory.title}`,
              `- Scope: ${scopeLabels[memory.scope]}`,
              `- Source: ${sourceTypeLabels[memory.sourceType]}`,
              `- Confidence: ${memory.confidence.toFixed(2)}`,
              `- Updated: ${formatDate(memory.updatedAt)}`,
              `- Tags: ${memory.tags.length ? memory.tags.join(", ") : "-"}`,
              "",
              memory.content,
            ].join("\n"),
          )
          .join("\n\n")
      : "현재 조건에 맞는 학습 메모리가 없습니다.",
  ].join("\n");
}

function buildFeedbackImprovementQueueReportText({
  baseUrl,
  filteredMemories,
  query,
  reviewFilter,
  scope,
  sortMode,
  totalMemories,
}: {
  baseUrl?: string;
  filteredMemories: LearningMemory[];
  query: string;
  reviewFilter: LearningReviewFilter;
  scope: LearningScopeFilter;
  sortMode: LearningSortMode;
  totalMemories: number;
}) {
  const filterHref = getLearningHref({ query, reviewFilter, scope, sortMode });
  const absoluteFilterHref =
    formatAbsoluteInternalHref(filterHref, baseUrl) ?? filterHref;
  const lowConfidenceHref = getLearningHref({
    query: "feedback-improvement",
    reviewFilter: "low-confidence",
    scope,
    sortMode: "confidence-asc",
  });
  const absoluteLowConfidenceHref =
    formatAbsoluteInternalHref(lowConfidenceHref, baseUrl) ?? lowConfidenceHref;
  const absoluteValidationLibraryHref =
    formatAbsoluteInternalHref(
      feedbackImprovementValidationLibraryHref,
      baseUrl,
    ) ?? feedbackImprovementValidationLibraryHref;
  const lowConfidenceCount = filteredMemories.filter(
    (memory) => memory.confidence < 0.5,
  ).length;
  const coveredScopeLabels = trackedScopes
    .filter((item) => filteredMemories.some((memory) => memory.scope === item))
    .map((item) => scopeLabels[item]);

  return [
    "# 피드백 개선 메모리 큐 리포트",
    "",
    "## 큐 조건",
    `- 조건 링크: ${absoluteFilterHref}`,
    `- 낮은 신뢰도 큐: ${absoluteLowConfidenceHref}`,
    `- 저신뢰도 검증 저장본: ${absoluteValidationLibraryHref}`,
    `- 범위: ${scopeLabels[scope]}`,
    `- 검토 기준: ${reviewFilterLabels[reviewFilter]}`,
    `- 정렬: ${sortLabels[sortMode]}`,
    `- 검색어: ${query.trim() || "-"}`,
    `- 결과: ${filteredMemories.length}/${totalMemories}개`,
    "",
    "## 큐 지표",
    `- 낮은 신뢰도: ${lowConfidenceCount}개`,
    `- 포함 scope: ${coveredScopeLabels.length ? coveredScopeLabels.join(", ") : "-"}`,
    "",
    "## 운영 액션",
    "- 높은 신뢰도 규칙은 Studio 템플릿과 외부 AI handoff 체크리스트에 반영합니다.",
    "- 낮은 신뢰도 규칙은 Library 피드백을 추가 수집한 뒤 재저장합니다.",
    "- 충돌하는 규칙은 scope와 적용 업무를 좁혀 별도 Learning memory로 분리합니다.",
    "- 큐 반영 후 release evidence를 새로 만들고 release-candidate gate를 확인합니다.",
    "",
    "## 검증 명령",
    feedbackImprovementReleaseGateCommand,
    "",
    "## 메모리",
    filteredMemories.length
      ? filteredMemories
          .map((memory, index) =>
            [
              `### ${index + 1}. ${memory.title}`,
              `- Scope: ${scopeLabels[memory.scope]}`,
              `- Source: ${sourceTypeLabels[memory.sourceType]}`,
              `- Confidence: ${memory.confidence.toFixed(2)}`,
              `- Updated: ${formatDate(memory.updatedAt)}`,
              `- Tags: ${memory.tags.length ? memory.tags.join(", ") : "-"}`,
              "",
              memory.content,
            ].join("\n"),
          )
          .join("\n\n")
      : "현재 피드백 개선 큐에 포함된 학습 메모리가 없습니다.",
  ].join("\n");
}

function buildSingleMemoryReportText(memory: LearningMemory) {
  return [
    "# 학습 메모리",
    "",
    `## ${memory.title}`,
    `- Scope: ${scopeLabels[memory.scope]}`,
    `- Source: ${sourceTypeLabels[memory.sourceType]}`,
    `- Confidence: ${memory.confidence.toFixed(2)}`,
    `- Updated: ${formatDate(memory.updatedAt)}`,
    `- Tags: ${memory.tags.length ? memory.tags.join(", ") : "-"}`,
    "",
    "## Content",
    memory.content,
  ].join("\n");
}

function buildMemoryStudioDraftInput(memory: LearningMemory) {
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

function buildFilteredMemoriesStudioDraftInput({
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

function buildFeedbackImprovementQueueStudioDraftInput({
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

function buildFeedbackImprovementLowConfidenceStudioDraftInput({
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

function buildLearningReadinessStudioDraftInput({
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

function formatLearningFilterSourceTitle({
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

function buildLearningHref(params: URLSearchParams) {
  const queryString = params.toString();
  const href = queryString ? `/learning?${queryString}` : "/learning";

  return normalizeInternalHref(href) ?? "/learning";
}

function getLearningHref({
  query,
  reviewFilter,
  scope,
  sortMode,
}: {
  query: string;
  reviewFilter: LearningReviewFilter;
  scope: LearningScopeFilter;
  sortMode: LearningSortMode;
}) {
  const params = new URLSearchParams();
  const trimmedQuery = query.trim();

  if (scope !== "all") {
    params.set("scope", scope);
  }

  if (reviewFilter !== "all") {
    params.set("review", reviewFilter);
  }

  if (sortMode !== "confidence-desc") {
    params.set("sort", sortMode);
  }

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  return buildLearningHref(params);
}

export function LearningView({
  initialQuery = "",
  initialReviewFilter = "all",
  initialScope = "all",
  initialSortMode = "confidence-desc",
}: {
  initialQuery?: string;
  initialReviewFilter?: LearningReviewFilter;
  initialScope?: LearningScopeFilter;
  initialSortMode?: LearningSortMode;
}) {
  const router = useRouter();
  const [memories, setMemories] = useLearningMemoriesStore();
  const [query, setQuery] = useState(initialQuery);
  const [scope, setScope] = useState<LearningScopeFilter>(initialScope);
  const [reviewFilter, setReviewFilter] =
    useState<LearningReviewFilter>(initialReviewFilter);
  const [sortMode, setSortMode] =
    useState<LearningSortMode>(initialSortMode);
  const [readinessReportCopied, setReadinessReportCopied] = useState(false);
  const [readinessReportCopyFailed, setReadinessReportCopyFailed] =
    useState(false);
  const [filterLinkCopied, setFilterLinkCopied] = useState(false);
  const [filterLinkCopyFailed, setFilterLinkCopyFailed] = useState(false);
  const [
    feedbackImprovementLowConfidenceLinkCopied,
    setFeedbackImprovementLowConfidenceLinkCopied,
  ] = useState(false);
  const [
    feedbackImprovementLowConfidenceLinkCopyFailed,
    setFeedbackImprovementLowConfidenceLinkCopyFailed,
  ] = useState(false);
  const [filteredReportCopied, setFilteredReportCopied] = useState(false);
  const [filteredReportCopyFailed, setFilteredReportCopyFailed] =
    useState(false);
  const [releaseGateCopied, setReleaseGateCopied] = useState(false);
  const [releaseGateCopyFailed, setReleaseGateCopyFailed] = useState(false);
  const [copiedMemoryId, setCopiedMemoryId] = useState("");
  const [failedMemoryCopyId, setFailedMemoryCopyId] = useState("");
  const [learningManualCopy, setLearningManualCopy] =
    useState<LearningManualCopy | null>(null);
  const [manualScope, setManualScope] = useState<MemoryScope>(
    initialScope === "all" ? "company" : initialScope,
  );
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualTags, setManualTags] = useState("");
  const [manualConfidence, setManualConfidence] = useState(0.85);
  const [manualSaved, setManualSaved] = useState(false);
  const [manualValidationMessage, setManualValidationMessage] = useState("");
  const [deletedManualMemoryTitle, setDeletedManualMemoryTitle] = useState("");
  const [editingMemoryId, setEditingMemoryId] = useState("");
  const [editScope, setEditScope] = useState<MemoryScope>("company");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editConfidence, setEditConfidence] = useState(0.85);
  const [editValidationMessage, setEditValidationMessage] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return memories
      .filter((memory) => scope === "all" || memory.scope === scope)
      .filter((memory) => matchesReviewFilter(memory, reviewFilter))
      .filter((memory) => {
        if (!needle) {
          return true;
        }

        return [memory.title, memory.content, memory.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => compareMemories(a, b, sortMode));
  }, [memories, query, reviewFilter, scope, sortMode]);

  const scopeCounts = useMemo(
    () =>
      scopes.reduce(
        (result, item) => ({
          ...result,
          [item]:
            item === "all"
              ? memories.length
              : memories.filter((memory) => memory.scope === item).length,
        }),
        {} as Record<MemoryScope | "all", number>,
      ),
    [memories],
  );

  const averageConfidence =
    memories.length === 0
      ? 0
      : memories.reduce((sum, memory) => sum + memory.confidence, 0) /
        memories.length;
  const learningReadiness = useMemo(
    () => getLearningReadiness(memories),
    [memories],
  );
  const reviewCounts = useMemo(
    () =>
      reviewFilters.reduce(
        (result, item) => ({
          ...result,
          [item]: memories.filter((memory) => matchesReviewFilter(memory, item))
            .length,
        }),
        {} as Record<LearningReviewFilter, number>,
      ),
    [memories],
  );
  const hasActiveLearningFilters =
    scope !== "all" ||
    reviewFilter !== "all" ||
    sortMode !== "confidence-desc" ||
    query.trim().length > 0;
  const feedbackImprovementFilterActive =
    query.trim().toLowerCase() === "feedback-improvement";
  const feedbackImprovementLowConfidenceHref = getLearningHref({
    query: "feedback-improvement",
    reviewFilter: "low-confidence",
    scope,
    sortMode: "confidence-asc",
  });
  const feedbackImprovementLowConfidenceMemories = filtered.filter(
    (memory) => memory.confidence < 0.5,
  );
  const feedbackImprovementQueueLowConfidenceCount =
    feedbackImprovementLowConfidenceMemories.length;
  const feedbackImprovementQueueScopeCount = trackedScopes.filter((item) =>
    filtered.some((memory) => memory.scope === item),
  ).length;
  const feedbackImprovementQueueWorkflowSteps = useMemo(
    () => [
      {
        detail:
          "낮은 신뢰도만 보기와 큐 조건 링크 복사로 재사용 전 근거를 먼저 확인합니다.",
        label: "검토",
        step: "01",
        title: `낮은 신뢰도 ${feedbackImprovementQueueLowConfidenceCount}개`,
      },
      {
        detail:
          "저신뢰도 검증 초안이나 전체 큐 초안으로 Studio에서 규칙 승격 계획을 만듭니다.",
        label: "Studio",
        step: "02",
        title:
          filtered.length > 0 ? `큐 ${filtered.length}개 전송` : "전송 대기",
      },
      {
        detail:
          "큐 리포트와 검증 저장본 링크로 어떤 기준을 반영했는지 추적합니다.",
        label: "기록",
        step: "03",
        title: `포함 scope ${feedbackImprovementQueueScopeCount}/4`,
      },
    ],
    [
      feedbackImprovementQueueLowConfidenceCount,
      feedbackImprovementQueueScopeCount,
      filtered.length,
    ],
  );
  const learningLowConfidenceReviewHref = getLearningHref({
    query: "",
    reviewFilter: "low-confidence",
    scope,
    sortMode: "confidence-asc",
  });
  const learningOperatingFlowItems = useMemo<ContextOperatingFlowItem[]>(
    () => [
      {
        actionLabel: "준비도 확인",
        detail: `Scope ${learningReadiness.coveredScopes.length}/4 · 낮은 신뢰도 ${learningReadiness.lowConfidenceCount}개`,
        href: "#readiness",
        label: "준비도",
        step: "01",
        title: `${learningReadiness.score}/100 · ${learningReadiness.label}`,
      },
      {
        actionLabel: "검토 큐 열기",
        detail: "신뢰도가 낮은 메모리는 재사용 전에 근거와 scope를 다시 확인합니다.",
        href: learningLowConfidenceReviewHref,
        label: "검토",
        step: "02",
        title: `낮은 신뢰도 ${learningReadiness.lowConfidenceCount}개`,
      },
      {
        actionLabel: "직접 보강",
        detail: "회사 기준, 개인 선호, 분야 규칙, 스킬 패턴을 수동 메모리로 저장합니다.",
        href: "#learning-manual-memory",
        label: "보강",
        step: "03",
        title: "수동 메모리",
      },
      {
        actionLabel: "현재 조건 확인",
        detail: feedbackImprovementFilterActive
          ? "피드백 개선 큐를 Studio 검증 초안이나 운영 리포트로 전환합니다."
          : "현재 필터 결과를 복사하거나 Studio 초안으로 전환합니다.",
        href: feedbackImprovementFilterActive
          ? "#learning-feedback-improvement-queue"
          : "#learning-filter-panel",
        label: "Studio",
        step: "04",
        title: `${filtered.length}개 조건`,
      },
    ],
    [
      feedbackImprovementFilterActive,
      filtered.length,
      learningLowConfidenceReviewHref,
      learningReadiness.coveredScopes.length,
      learningReadiness.label,
      learningReadiness.lowConfidenceCount,
      learningReadiness.score,
    ],
  );
  const learningNextActionGuide = useMemo(() => {
    if (memories.length === 0) {
      return {
        detail:
          "실제 생성 결과에 피드백을 남기거나 직접 기준을 저장해야 다음 Studio 생성에 개인화 컨텍스트가 붙습니다.",
        primaryHref: "/library",
        primaryLabel: "Library 피드백 남기기",
        secondaryHref: "#learning-manual-memory",
        secondaryLabel: "수동 메모리 추가",
        status: "첫 학습 필요",
        title: "첫 학습 메모리를 만들 차례",
      };
    }

    if (learningReadiness.lowConfidenceCount > 0) {
      return {
        detail:
          "신뢰도가 낮은 메모리는 바로 재사용하지 말고 근거를 보강한 뒤 Studio 초안에 반영합니다.",
        primaryHref: learningLowConfidenceReviewHref,
        primaryLabel: "낮은 신뢰도 검토",
        secondaryHref: "#readiness",
        secondaryLabel: "운영 리포트 확인",
        status: "검증 우선",
        title: `${learningReadiness.lowConfidenceCount}개 메모리 검증 필요`,
      };
    }

    const missingScope = learningReadiness.missingScopes[0];

    if (missingScope) {
      return {
        detail:
          "비어 있는 scope를 먼저 채우면 사용자, 회사, 분야, 스킬 기준이 더 균형 있게 프롬프트에 반영됩니다.",
        primaryHref: getLearningHref({
          query: "",
          reviewFilter: "all",
          scope: missingScope,
          sortMode: "confidence-desc",
        }),
        primaryLabel: `${scopeLabels[missingScope]} scope 열기`,
        secondaryHref: "#learning-manual-memory",
        secondaryLabel: "직접 기준 저장",
        status: "커버리지 보강",
        title: `${scopeLabels[missingScope]} 기준을 보강하세요`,
      };
    }

    if (feedbackImprovementFilterActive) {
      return {
        detail:
          "현재 피드백 개선 큐를 품질 규칙, 추가 검증 항목, 외부 AI handoff 체크리스트로 정리합니다.",
        primaryHref: "#learning-feedback-improvement-queue",
        primaryLabel: "큐 액션 확인",
        secondaryHref: feedbackImprovementLowConfidenceHref,
        secondaryLabel: "저신뢰도만 보기",
        status: "큐 운영",
        title: "피드백 개선 규칙을 정리할 차례",
      };
    }

    return {
      detail:
        "학습 준비도는 안정권입니다. Studio에서 새 프롬프트를 생성하고 결과 피드백을 다시 저장해 기준을 갱신합니다.",
      primaryHref: "/studio?draft=learning-readiness",
      primaryLabel: "Studio에서 적용 확인",
      secondaryHref: "#learning-filter-panel",
      secondaryLabel: "현재 조건 점검",
      status: "적용 확인",
      title: "학습 컨텍스트를 생성에 적용하세요",
    };
  }, [
    feedbackImprovementFilterActive,
    feedbackImprovementLowConfidenceHref,
    learningLowConfidenceReviewHref,
    learningReadiness,
    memories.length,
  ]);
  const manualMemoryWorkflowSteps = useMemo(
    () => [
      {
        detail: "새 기준이 적용될 학습 scope를 먼저 고정합니다.",
        label: "범위 선택",
        step: "01",
        title: scopeLabels[manualScope],
      },
      {
        detail: manualContent.trim()
          ? "다음 생성에 반영할 규칙 본문이 준비됐습니다."
          : "한 문장으로도 괜찮으니 반복해서 적용할 기준을 적습니다.",
        label: "규칙 작성",
        step: "02",
        title: manualTitle.trim() || "제목 대기",
      },
      {
        detail:
          "저장 후 해당 scope 필터로 이동해 바로 검토하고 Studio 생성에 반영합니다.",
        label: "생성 반영",
        step: "03",
        title: manualSaved ? "저장됨" : "저장 후 반영",
      },
    ],
    [manualContent, manualSaved, manualScope, manualTitle],
  );

  async function copyReadinessReport() {
    const reportText = buildLearningReadinessReportText({
      baseUrl: typeof window === "undefined" ? undefined : window.location.origin,
      memories,
      readiness: learningReadiness,
    });
    const copied = await copyTextToClipboard(reportText);

    setReadinessReportCopied(copied);
    setReadinessReportCopyFailed(!copied);
    setLearningManualCopy(
      copied
        ? null
        : {
            id: "readiness-report",
            title: "학습 준비도 운영 리포트",
            body: reportText,
          },
    );
  }

  async function copyFilteredMemoryReport() {
    const reportPayload = {
      baseUrl: typeof window === "undefined" ? undefined : window.location.origin,
      filteredMemories: filtered,
      query,
      reviewFilter,
      scope,
      sortMode,
      totalMemories: memories.length,
    };
    const reportText = feedbackImprovementFilterActive
      ? buildFeedbackImprovementQueueReportText(reportPayload)
      : buildFilteredMemoryReportText(reportPayload);
    const copied = await copyTextToClipboard(reportText);

    setFilteredReportCopied(copied);
    setFilteredReportCopyFailed(!copied);
    setReleaseGateCopied(false);
    setReleaseGateCopyFailed(false);
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(
      copied
        ? null
        : {
            id: "filtered-report",
            title: feedbackImprovementFilterActive
              ? "피드백 개선 메모리 큐"
              : "필터 결과",
            body: reportText,
          },
    );
  }

  async function copyMemoryReport(memory: LearningMemory) {
    const reportText = buildSingleMemoryReportText(memory);
    const copied = await copyTextToClipboard(reportText);

    setFilteredReportCopied(false);
    setFilteredReportCopyFailed(false);
    setReleaseGateCopied(false);
    setReleaseGateCopyFailed(false);
    setCopiedMemoryId(copied ? memory.id : "");
    setFailedMemoryCopyId(copied ? "" : memory.id);
    setLearningManualCopy(
      copied
        ? null
        : {
            id: `memory:${memory.id}`,
            title: memory.title,
            body: reportText,
          },
    );
  }

  async function copyFeedbackImprovementReleaseGate() {
    const copied = await copyTextToClipboard(
      feedbackImprovementReleaseGateCommand,
    );

    setReleaseGateCopied(copied);
    setReleaseGateCopyFailed(!copied);
    setFilterLinkCopied(false);
    setFilterLinkCopyFailed(false);
    setFeedbackImprovementLowConfidenceLinkCopied(false);
    setFeedbackImprovementLowConfidenceLinkCopyFailed(false);
    setFilteredReportCopied(false);
    setFilteredReportCopyFailed(false);
    setLearningManualCopy(
      copied
        ? null
        : {
            id: "feedback-improvement-release-gate",
            title: "피드백 개선 큐 release gate",
            body: feedbackImprovementReleaseGateCommand,
          },
    );
  }

  async function copyFilterLink() {
    const href = getLearningHref({ query, reviewFilter, scope, sortMode });
    const linkText =
      formatAbsoluteInternalHref(
        href,
        typeof window === "undefined" ? undefined : window.location.origin,
      ) ?? href;
    const copied = await copyTextToClipboard(linkText);

    setFilterLinkCopied(copied);
    setFilterLinkCopyFailed(!copied);
    setFeedbackImprovementLowConfidenceLinkCopied(false);
    setFeedbackImprovementLowConfidenceLinkCopyFailed(false);
    setReleaseGateCopied(false);
    setReleaseGateCopyFailed(false);
    setLearningManualCopy(
      copied
        ? null
        : {
            id: "filter-link",
            title: "현재 조건 링크",
            body: linkText,
          },
    );
  }

  async function copyFeedbackImprovementLowConfidenceLink() {
    const linkText =
      formatAbsoluteInternalHref(
        feedbackImprovementLowConfidenceHref,
        typeof window === "undefined" ? undefined : window.location.origin,
      ) ?? feedbackImprovementLowConfidenceHref;
    const copied = await copyTextToClipboard(linkText);

    setFeedbackImprovementLowConfidenceLinkCopied(copied);
    setFeedbackImprovementLowConfidenceLinkCopyFailed(!copied);
    setFilterLinkCopied(false);
    setFilterLinkCopyFailed(false);
    setReleaseGateCopied(false);
    setReleaseGateCopyFailed(false);
    setLearningManualCopy(
      copied
        ? null
        : {
            id: "feedback-improvement-low-confidence-link",
            title: "낮은 신뢰도 큐 링크",
            body: linkText,
          },
    );
  }

  function replaceLearningUrl({
    nextQuery = query,
    nextReviewFilter = reviewFilter,
    nextScope = scope,
    nextSortMode = sortMode,
  }: {
    nextQuery?: string;
    nextReviewFilter?: LearningReviewFilter;
    nextScope?: LearningScopeFilter;
    nextSortMode?: LearningSortMode;
  }) {
    setFilterLinkCopied(false);
    setFilterLinkCopyFailed(false);
    setFeedbackImprovementLowConfidenceLinkCopied(false);
    setFeedbackImprovementLowConfidenceLinkCopyFailed(false);
    setFilteredReportCopied(false);
    setFilteredReportCopyFailed(false);
    setReleaseGateCopied(false);
    setReleaseGateCopyFailed(false);
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
    router.replace(
      getLearningHref({
        query: nextQuery,
        reviewFilter: nextReviewFilter,
        scope: nextScope,
        sortMode: nextSortMode,
      }),
      { scroll: false },
    );
  }

  function updateScopeFilter(nextScope: LearningScopeFilter) {
    setScope(nextScope);
    setReadinessReportCopied(false);
    setReadinessReportCopyFailed(false);
    setLearningManualCopy(null);
    replaceLearningUrl({ nextScope });
  }

  function updateReviewFilter(nextReviewFilter: LearningReviewFilter) {
    setReviewFilter(nextReviewFilter);
    replaceLearningUrl({ nextReviewFilter });
  }

  function updateSortMode(nextSortMode: LearningSortMode) {
    setSortMode(nextSortMode);
    replaceLearningUrl({ nextSortMode });
  }

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    replaceLearningUrl({ nextQuery });
  }

  function applyReadinessShortcut({
    nextQuery = "",
    nextReviewFilter,
    nextSortMode,
  }: {
    nextQuery?: string;
    nextReviewFilter: LearningReviewFilter;
    nextSortMode: LearningSortMode;
  }) {
    setQuery(nextQuery);
    setReviewFilter(nextReviewFilter);
    setSortMode(nextSortMode);
    replaceLearningUrl({ nextQuery, nextReviewFilter, nextSortMode });
  }

  function resetLearningFilters() {
    setQuery("");
    setScope("all");
    setReviewFilter("all");
    setSortMode("confidence-desc");
    setReadinessReportCopied(false);
    setReadinessReportCopyFailed(false);
    setFilteredReportCopied(false);
    setFilteredReportCopyFailed(false);
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
    replaceLearningUrl({
      nextQuery: "",
      nextReviewFilter: "all",
      nextScope: "all",
      nextSortMode: "confidence-desc",
    });
  }

  function openMemoryInStudio(memory: LearningMemory) {
    const rawInput = buildMemoryStudioDraftInput(memory);
    const wroteDraft = writeStudioDraft({
      source: "learning-memory",
      rawInput,
      goal: "학습 메모리 기반 프롬프트 작성",
      domain: `${scopeLabels[memory.scope]} 학습 기준`,
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceMemoryId: memory.id,
      sourceTitle: memory.title,
      sourceHref: getLearningHref({
        query: memory.title,
        reviewFilter: "all",
        scope: memory.scope,
        sortMode: "confidence-desc",
      }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setCopiedMemoryId("");
      setFailedMemoryCopyId(memory.id);
      setLearningManualCopy({
        id: `memory:${memory.id}`,
        title: memory.title,
        body: rawInput,
        reason:
          "Studio 초안 저장이 차단되어 이동하지 않았습니다. 아래 원문을 복사해 Studio에 붙여넣으세요.",
      });
      return;
    }

    router.push("/studio?draft=learning-memory");
  }

  function openFilteredMemoriesInStudio() {
    if (filtered.length === 0) {
      return;
    }

    const studioDraftSource = feedbackImprovementFilterActive
      ? "learning-feedback-improvement"
      : "learning-filter";
    const studioDraftTitle = feedbackImprovementFilterActive
      ? `피드백 개선 메모리 큐 · ${filtered.length}개`
      : formatLearningFilterSourceTitle({
          count: filtered.length,
          query,
          reviewFilter,
          scope,
          sortMode,
        });
    const rawInput = feedbackImprovementFilterActive
      ? buildFeedbackImprovementQueueStudioDraftInput({
          filteredMemories: filtered,
          query,
          reviewFilter,
          scope,
          sortMode,
          totalMemories: memories.length,
        })
      : buildFilteredMemoriesStudioDraftInput({
          filteredMemories: filtered,
          query,
          reviewFilter,
          scope,
          sortMode,
          totalMemories: memories.length,
        });

    const wroteDraft = writeStudioDraft({
      source: studioDraftSource,
      rawInput,
      goal: feedbackImprovementFilterActive
        ? "피드백 개선 메모리 큐 기반 프롬프트 보강"
        : "학습 메모리 묶음 기반 프롬프트 작성",
      domain:
        feedbackImprovementFilterActive
          ? "Feedback improvement learning queue"
          : scope === "all"
          ? "복수 학습 기준"
          : `${scopeLabels[scope]} 학습 기준`,
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle: studioDraftTitle,
      sourceHref: getLearningHref({ query, reviewFilter, scope, sortMode }),
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setFilteredReportCopied(false);
      setFilteredReportCopyFailed(true);
      setLearningManualCopy({
        id: "filtered-report",
        title: studioDraftTitle,
        body: rawInput,
        reason:
          "Studio 초안 저장이 차단되어 이동하지 않았습니다. 아래 원문을 복사해 Studio에 붙여넣으세요.",
      });
      return;
    }

    router.push(
      feedbackImprovementFilterActive
        ? "/studio?draft=learning-feedback-improvement"
        : "/studio?draft=learning-filter",
    );
  }

  function openFeedbackImprovementLowConfidenceInStudio() {
    if (feedbackImprovementLowConfidenceMemories.length === 0) {
      return;
    }

    const rawInput = buildFeedbackImprovementLowConfidenceStudioDraftInput({
      filteredMemories: feedbackImprovementLowConfidenceMemories,
      scope,
      totalMemories: memories.length,
    });
    const wroteDraft = writeStudioDraft({
      source: "learning-feedback-improvement",
      sourceVariant: "learning-low-confidence-validation",
      rawInput,
      goal: "낮은 신뢰도 피드백 개선 메모리 보강",
      domain: "Feedback improvement low-confidence learning queue",
      targetModels: ["gpt"],
      outputLanguage: "korean",
      sourceTitle: `피드백 개선 낮은 신뢰도 큐 · ${feedbackImprovementLowConfidenceMemories.length}개`,
      sourceHref: feedbackImprovementLowConfidenceHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setFeedbackImprovementLowConfidenceLinkCopied(false);
      setFeedbackImprovementLowConfidenceLinkCopyFailed(true);
      setLearningManualCopy({
        id: "feedback-improvement-low-confidence-studio",
        title: "피드백 개선 낮은 신뢰도 큐",
        body: rawInput,
        reason:
          "Studio 초안 저장이 차단되어 이동하지 않았습니다. 아래 원문을 복사해 Studio에 붙여넣으세요.",
      });
      return;
    }

    router.push("/studio?draft=learning-feedback-improvement");
  }

  function openReadinessReportInStudio() {
    const rawInput = buildLearningReadinessStudioDraftInput({
      baseUrl:
        typeof window === "undefined" ? undefined : window.location.origin,
      memories,
      readiness: learningReadiness,
    });
    const wroteDraft = writeStudioDraft({
      source: "learning-readiness",
      rawInput,
      goal: "학습 메모리 운영 보강 계획",
      domain: "Learning readiness",
      targetModels: ["gpt", "claude", "codex"],
      outputLanguage: "korean",
      sourceTitle: "Learning 준비도 리포트",
      sourceHref: learningReadinessHref,
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setReadinessReportCopied(false);
      setReadinessReportCopyFailed(true);
      setLearningManualCopy({
        id: "readiness-report",
        title: "Learning 준비도 리포트",
        body: rawInput,
        reason:
          "Studio 초안 저장이 차단되어 이동하지 않았습니다. 아래 원문을 복사해 Studio에 붙여넣으세요.",
      });
      return;
    }

    router.push("/studio?draft=learning-readiness");
  }

  function saveManualMemory() {
    const title = manualTitle.trim();
    const content = manualContent.trim();

    if (!title || !content) {
      return;
    }

    const duplicate = findDuplicateMemory(memories, manualScope, content);

    if (duplicate) {
      setManualValidationMessage(
        `이미 같은 scope에 같은 내용의 메모리가 있습니다 · ${duplicate.title}`,
      );
      setManualSaved(false);
      return;
    }

    const now = new Date().toISOString();
    const tags = parseTags(manualTags);
    const nextMemory: LearningMemory = {
      id: makeId("memory_manual"),
      scope: manualScope,
      sourceType: "manual",
      sourceId: "learning-view",
      title,
      content,
      tags: tags.length ? tags : [manualScope],
      confidence: manualConfidence,
      createdAt: now,
      updatedAt: now,
    };

    setMemories((current) => [nextMemory, ...current]);
    setManualTitle("");
    setManualContent("");
    setManualTags("");
    setManualSaved(true);
    setManualValidationMessage("");
    setDeletedManualMemoryTitle("");
    setEditingMemoryId("");
    setEditValidationMessage("");
    setLearningManualCopy(null);
    updateScopeFilter(manualScope);
  }

  function startEditingManualMemory(memory: LearningMemory) {
    if (memory.sourceType !== "manual") {
      return;
    }

    setEditingMemoryId(memory.id);
    setEditScope(memory.scope);
    setEditTitle(memory.title);
    setEditContent(memory.content);
    setEditTags(memory.tags.join(", "));
    setEditConfidence(memory.confidence);
    setDeletedManualMemoryTitle("");
    setManualSaved(false);
    setManualValidationMessage("");
    setEditValidationMessage("");
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
  }

  function cancelEditingManualMemory() {
    setEditingMemoryId("");
    setEditTitle("");
    setEditContent("");
    setEditTags("");
    setEditValidationMessage("");
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
  }

  function saveEditedManualMemory(memoryId: string) {
    const title = editTitle.trim();
    const content = editContent.trim();

    if (!title || !content) {
      return;
    }

    const duplicate = findDuplicateMemory(memories, editScope, content, memoryId);

    if (duplicate) {
      setEditValidationMessage(
        `이미 같은 scope에 같은 내용의 메모리가 있습니다 · ${duplicate.title}`,
      );
      return;
    }

    const tags = parseTags(editTags);
    const now = new Date().toISOString();

    setMemories((current) =>
      current.map((memory) =>
        memory.id === memoryId && memory.sourceType === "manual"
          ? {
              ...memory,
              scope: editScope,
              title,
              content,
              tags: tags.length ? tags : [editScope],
              confidence: editConfidence,
              updatedAt: now,
            }
          : memory,
      ),
    );
    setEditingMemoryId("");
    setEditValidationMessage("");
    setDeletedManualMemoryTitle("");
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
    updateScopeFilter(editScope);
  }

  function deleteManualMemory(memory: LearningMemory) {
    if (memory.sourceType !== "manual") {
      return;
    }

    const confirmed = window.confirm(
      `"${memory.title}" 수동 메모리를 삭제할까요?`,
    );

    if (!confirmed) {
      return;
    }

    setMemories((current) => current.filter((item) => item.id !== memory.id));
    setDeletedManualMemoryTitle(memory.title);
    setEditingMemoryId("");
    setManualSaved(false);
    setManualValidationMessage("");
    setEditValidationMessage("");
    setCopiedMemoryId("");
    setFailedMemoryCopyId("");
    setLearningManualCopy(null);
  }

  return (
    <>
      <PageHeader
        title="학습 메모리"
        description="피드백에서 추출된 사용자, 회사, 분야, 스킬 기준을 확인합니다. 이 메모리는 다음 프롬프트 생성에 함께 반영됩니다."
      />

      <ContextOperatingFlow
        badge={learningReadiness.label}
        description="Learning은 저장된 기준을 바로 재사용하지 않고 준비도, 낮은 신뢰도, 수동 보강, Studio 전송 순서로 점검합니다."
        items={learningOperatingFlowItems}
        testId="learning-operating-flow"
        title="Learning 운영 흐름"
      />

      <div
        data-testid="learning-summary-metrics"
        className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
      >
        {[
          ["전체 메모리", memories.length.toString()],
          ["사용자", scopeCounts.user.toString()],
          ["회사", scopeCounts.company.toString()],
          ["평균 신뢰도", memories.length ? averageConfidence.toFixed(2) : "-"],
        ].map(([label, value]) => (
          <Panel key={label} className="min-w-0 px-4 py-3 sm:px-5 sm:py-4">
            <p className="break-words text-xs leading-4 text-muted sm:text-sm">
              {label}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold sm:text-3xl">
              {value}
            </p>
          </Panel>
        ))}
      </div>

      <Panel
        data-testid="learning-next-action-guide"
        className="mt-4 px-4 py-4 sm:px-5"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase text-muted">
                Next learning action
              </p>
              <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                {learningNextActionGuide.status}
              </span>
            </div>
            <h2 className="mt-2 break-words text-base font-semibold text-soft">
              {learningNextActionGuide.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              {learningNextActionGuide.detail}
            </p>
          </div>
          <div className="grid shrink-0 gap-2 sm:grid-cols-2 md:w-[360px]">
            <Link
              href={learningNextActionGuide.primaryHref}
              className={`${primaryButtonClass} justify-center text-center`}
            >
              {learningNextActionGuide.primaryLabel}
            </Link>
            <Link
              href={learningNextActionGuide.secondaryHref}
              className={`${secondaryButtonClass} justify-center text-center`}
            >
              {learningNextActionGuide.secondaryLabel}
            </Link>
          </div>
        </div>
      </Panel>

      <Panel id="readiness" className="mt-4 scroll-mt-6 px-5 py-4">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-soft">학습 준비도</p>
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${learningReadiness.tone}`}
                  >
                    {learningReadiness.label}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {learningReadiness.description}
                </p>
              </div>
              <span className="shrink-0 rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm font-semibold text-soft">
                {learningReadiness.score}/100
              </span>
            </div>

            <div
              data-testid="learning-readiness-metrics"
              className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              <div className="rounded-md border border-line bg-surface px-3 py-3">
                <p className="text-xs text-muted">Scope 커버리지</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                  {learningReadiness.coveredScopes.length}/4
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-line bg-surface px-3 py-3 text-left transition hover:border-accent/50 hover:bg-accent/5"
                onClick={() =>
                  applyReadinessShortcut({
                    nextReviewFilter: "all",
                    nextSortMode: "confidence-desc",
                  })
                }
              >
                <p className="text-xs text-muted">높은 신뢰도</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                  {learningReadiness.highConfidenceCount}
                </p>
              </button>
              <button
                type="button"
                className="rounded-md border border-line bg-surface px-3 py-3 text-left transition hover:border-attention/50 hover:bg-attention/5"
                onClick={() =>
                  applyReadinessShortcut({
                    nextReviewFilter: "low-confidence",
                    nextSortMode: "confidence-asc",
                  })
                }
              >
                <p className="text-xs text-muted">낮은 신뢰도</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                  {learningReadiness.lowConfidenceCount}
                </p>
              </button>
              <button
                type="button"
                className="rounded-md border border-line bg-surface px-3 py-3 text-left transition hover:border-accent/50 hover:bg-accent/5"
                onClick={() =>
                  applyReadinessShortcut({
                    nextReviewFilter: "all",
                    nextSortMode: "updated-desc",
                  })
                }
              >
                <p className="text-xs text-muted">최근 업데이트</p>
                <p className="mt-1 break-words text-sm font-semibold text-soft">
                  {learningReadiness.latestMemoryDate
                    ? formatDate(learningReadiness.latestMemoryDate)
                    : "-"}
                </p>
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {trackedScopes.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${
                    scope === item
                      ? "border-accent bg-accent/10 text-accent"
                      : learningReadiness.scopeCounts[item] > 0
                        ? "border-accent/40 bg-accent/10 text-accent hover:border-accent"
                        : "border-line bg-surface text-muted hover:text-foreground"
                  }`}
                  onClick={() => updateScopeFilter(item)}
                >
                  {scopeLabels[item]} {learningReadiness.scopeCounts[item]}
                </button>
              ))}
              {scope !== "all" ? (
                <button
                  type="button"
                  className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold text-muted transition hover:text-foreground"
                  onClick={() => updateScopeFilter("all")}
                >
                  전체 보기
                </button>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 rounded-md border border-line bg-surface px-4 py-3">
            <p className="text-sm font-semibold text-soft">다음 보강 액션</p>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
              {learningReadiness.actions.map((action) => (
                <li key={action} className="break-words">
                  - {action}
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className={`${secondaryButtonClass} w-full`}
                onClick={copyReadinessReport}
              >
                {readinessReportCopied
                  ? "운영 리포트 복사됨"
                  : readinessReportCopyFailed
                    ? "운영 리포트 복사 실패"
                  : "운영 리포트 복사"}
              </button>
              <button
                type="button"
                className={`${secondaryButtonClass} w-full`}
                onClick={openReadinessReportInStudio}
              >
                준비도 Studio로 보내기
              </button>
            </div>
            {learningManualCopy?.id === "readiness-report" ? (
              <div className="mt-4">
                <LearningManualCopyPanel
                  copy={learningManualCopy}
                  onClose={() => setLearningManualCopy(null)}
                />
              </div>
            ) : null}
          </div>
        </div>
      </Panel>

      {feedbackImprovementFilterActive ? (
        <Panel
          id="learning-feedback-improvement-queue"
          className="mt-4 px-5 py-4"
          data-testid="learning-feedback-improvement-queue"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_260px] lg:items-start">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-soft">
                피드백 개선 메모리 큐
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Dashboard에서 저장한 피드백 개선 규칙을 현재 Learning 조건으로
                점검합니다. 반복 피드백을 Studio 생성 기준으로 승격하기 전에
                scope, 신뢰도, 원본 링크를 확인하세요.
              </p>
              <div
                data-testid="learning-feedback-improvement-queue-metrics"
                className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                <div className="rounded-md border border-line bg-surface px-3 py-3">
                  <p className="text-xs text-muted">현재 큐</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                    {filtered.length}
                  </p>
                </div>
                <div className="rounded-md border border-line bg-surface px-3 py-3">
                  <p className="text-xs text-muted">낮은 신뢰도</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                    {feedbackImprovementQueueLowConfidenceCount}
                  </p>
                </div>
                <div className="rounded-md border border-line bg-surface px-3 py-3">
                  <p className="text-xs text-muted">포함 scope</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-soft">
                    {feedbackImprovementQueueScopeCount}/4
                  </p>
                </div>
              </div>
              <div
                data-testid="learning-feedback-improvement-workflow"
                className="mt-4 grid gap-3 md:grid-cols-3"
              >
                {feedbackImprovementQueueWorkflowSteps.map((item) => (
                  <div
                    key={item.step}
                    className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] font-semibold text-accent">
                        {item.step}
                      </span>
                      <p className="text-xs font-semibold text-muted">
                        {item.label}
                      </p>
                    </div>
                    <p className="mt-3 break-words text-sm font-semibold text-soft">
                      {item.title}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-muted">검토</p>
                <div className="grid gap-2">
                  <Link
                    href={feedbackImprovementLowConfidenceHref}
                    className={`${secondaryButtonClass} w-full`}
                  >
                    낮은 신뢰도만 보기
                  </Link>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} w-full`}
                    onClick={copyFeedbackImprovementLowConfidenceLink}
                  >
                    {feedbackImprovementLowConfidenceLinkCopied
                      ? "낮은 신뢰도 링크 복사됨"
                      : feedbackImprovementLowConfidenceLinkCopyFailed
                        ? "낮은 신뢰도 링크 복사 실패"
                        : "낮은 신뢰도 링크 복사"}
                  </button>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} w-full`}
                    onClick={copyFilterLink}
                  >
                    {filterLinkCopied
                      ? "큐 조건 링크 복사됨"
                      : filterLinkCopyFailed
                        ? "큐 조건 링크 복사 실패"
                        : "큐 조건 링크 복사"}
                  </button>
                </div>
              </div>
              <div className="border-t border-line pt-3">
                <p className="mb-2 text-xs font-semibold text-muted">Studio</p>
                <div className="grid gap-2">
                  <button
                    type="button"
                    className={`${primaryButtonClass} w-full`}
                    onClick={openFeedbackImprovementLowConfidenceInStudio}
                    disabled={feedbackImprovementQueueLowConfidenceCount === 0}
                  >
                    낮은 신뢰도 Studio로
                  </button>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} w-full`}
                    onClick={openFilteredMemoriesInStudio}
                    disabled={filtered.length === 0}
                  >
                    큐 Studio로 보내기
                  </button>
                </div>
              </div>
              <div className="border-t border-line pt-3">
                <p className="mb-2 text-xs font-semibold text-muted">기록</p>
                <div className="grid gap-2">
                  <button
                    type="button"
                    className={`${secondaryButtonClass} w-full`}
                    onClick={copyFilteredMemoryReport}
                  >
                    {filteredReportCopied
                      ? "큐 리포트 복사됨"
                      : filteredReportCopyFailed
                        ? "큐 리포트 복사 실패"
                        : "큐 리포트 복사"}
                  </button>
                  <Link
                    href={feedbackImprovementValidationLibraryHref}
                    className={`${secondaryButtonClass} w-full`}
                  >
                    검증 저장본 보기
                  </Link>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} w-full`}
                    onClick={copyFeedbackImprovementReleaseGate}
                  >
                    {releaseGateCopied
                      ? "Release gate 복사됨"
                      : releaseGateCopyFailed
                        ? "Release gate 복사 실패"
                        : "Release gate 복사"}
                  </button>
                  <Link href="/" className={`${secondaryButtonClass} w-full`}>
                    Dashboard로 돌아가기
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {learningManualCopy?.id === "filter-link" ||
          learningManualCopy?.id === "filtered-report" ||
          learningManualCopy?.id ===
            "feedback-improvement-low-confidence-link" ||
          learningManualCopy?.id ===
            "feedback-improvement-release-gate" ||
          learningManualCopy?.id ===
            "feedback-improvement-low-confidence-studio" ? (
            <div
              className="mt-4"
              data-testid="learning-feedback-improvement-queue-manual-copy"
            >
              <LearningManualCopyPanel
                copy={learningManualCopy}
                onClose={() => setLearningManualCopy(null)}
              />
            </div>
          ) : null}
        </Panel>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <Panel id="learning-filter-panel" className="scroll-mt-6">
          <PanelHeader
            title="필터"
            description="메모리 범위, 검토 기준, 정렬로 학습 데이터를 좁혀봅니다."
          />
          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">범위</span>
              <select
                className={selectClass}
                value={scope}
                onChange={(event) =>
                  updateScopeFilter(event.target.value as LearningScopeFilter)
                }
              >
                {scopes.map((item) => (
                  <option key={item} value={item}>
                    {scopeLabels[item]} ({scopeCounts[item]})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">
                검토 기준
              </span>
              <select
                className={selectClass}
                value={reviewFilter}
                onChange={(event) =>
                  updateReviewFilter(event.target.value as LearningReviewFilter)
                }
              >
                {reviewFilters.map((item) => (
                  <option key={item} value={item}>
                    {reviewFilterLabels[item]} ({reviewCounts[item]})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">정렬</span>
              <select
                className={selectClass}
                value={sortMode}
                onChange={(event) =>
                  updateSortMode(event.target.value as LearningSortMode)
                }
              >
                {sortModes.map((item) => (
                  <option key={item} value={item}>
                    {sortLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">검색</span>
              <input
                className={inputClass}
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="톤, 회사 기준, Codex 등"
              />
            </label>
            <div className="rounded-md border border-line bg-surface px-3 py-3 text-xs leading-5 text-muted">
              현재 조건 {filtered.length}개 · 낮은 신뢰도{" "}
              {reviewCounts["low-confidence"]}개 · 수동 {reviewCounts.manual}개
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                className={`${secondaryButtonClass} w-full`}
                onClick={copyFilterLink}
              >
                {filterLinkCopied
                  ? "조건 링크 복사됨"
                  : filterLinkCopyFailed
                    ? "조건 링크 복사 실패"
                    : "현재 조건 링크 복사"}
              </button>
              <button
                type="button"
                className={`${secondaryButtonClass} w-full`}
                onClick={copyFilteredMemoryReport}
              >
                {filteredReportCopied
                  ? "필터 결과 복사됨"
                  : filteredReportCopyFailed
                    ? "필터 결과 복사 실패"
                  : "필터 결과 복사"}
              </button>
              <button
                type="button"
                className={`${secondaryButtonClass} w-full`}
                onClick={openFilteredMemoriesInStudio}
                disabled={filtered.length === 0}
              >
                필터 결과 Studio로 보내기
              </button>
              {hasActiveLearningFilters ? (
                <button
                  type="button"
                  className={`${secondaryButtonClass} w-full`}
                  onClick={resetLearningFilters}
                >
                  조건 초기화
                </button>
              ) : null}
            </div>
            {!feedbackImprovementFilterActive &&
            (learningManualCopy?.id === "filter-link" ||
              learningManualCopy?.id === "filtered-report") ? (
              <LearningManualCopyPanel
                copy={learningManualCopy}
                onClose={() => setLearningManualCopy(null)}
              />
            ) : null}
          </div>
        </Panel>

        <Panel
          id="learning-manual-memory"
          className="scroll-mt-64 lg:col-start-1 lg:scroll-mt-6"
        >
          <PanelHeader
            title="수동 메모리 추가"
            description="회사 기준, 개인 선호, 분야 규칙, 반복 업무 패턴을 직접 학습 메모리로 저장합니다."
          />
          <div className="space-y-4 p-5">
            <div
              data-testid="learning-manual-memory-workflow"
              className="grid gap-3"
            >
              {manualMemoryWorkflowSteps.map((item) => (
                <div
                  key={item.step}
                  className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] font-semibold text-accent">
                      {item.step}
                    </span>
                    <p className="text-xs font-semibold text-muted">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-3 break-words text-sm font-semibold text-soft">
                    {item.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">범위</span>
              <select
                className={selectClass}
                value={manualScope}
                onChange={(event) => {
                  setManualScope(event.target.value as MemoryScope);
                  setManualValidationMessage("");
                  setManualSaved(false);
                }}
              >
                {trackedScopes.map((item) => (
                  <option key={item} value={item}>
                    {scopeLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">제목</span>
              <input
                className={inputClass}
                value={manualTitle}
                onChange={(event) => {
                  setManualTitle(event.target.value);
                  setManualSaved(false);
                  setManualValidationMessage("");
                }}
                placeholder="예: 투자자 문서 회사 기준"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">내용</span>
              <textarea
                className={`${textareaClass} min-h-28`}
                value={manualContent}
                onChange={(event) => {
                  setManualContent(event.target.value);
                  setManualSaved(false);
                  setManualValidationMessage("");
                }}
                placeholder="다음 생성에 반영할 구체적인 기준을 적어주세요."
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">태그</span>
              <input
                className={inputClass}
                value={manualTags}
                onChange={(event) => {
                  setManualTags(event.target.value);
                  setManualSaved(false);
                  setManualValidationMessage("");
                }}
                placeholder="기획, 투자자, Codex"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">
                신뢰도
              </span>
              <select
                className={selectClass}
                value={manualConfidence}
                onChange={(event) => {
                  setManualConfidence(Number(event.target.value));
                  setManualSaved(false);
                  setManualValidationMessage("");
                }}
              >
                {confidenceOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label} ({item.value.toFixed(2)})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={`${primaryButtonClass} w-full`}
              onClick={saveManualMemory}
              disabled={!manualTitle.trim() || !manualContent.trim()}
            >
              {manualSaved ? "저장됨" : "학습 메모리 저장"}
            </button>
            {manualValidationMessage ? (
              <p className="rounded-md border border-attention/40 bg-surface px-3 py-2 text-xs leading-5 text-attention">
                {manualValidationMessage}
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="축적된 메모리"
            description={`${reviewFilterLabels[reviewFilter]} 기준 · ${sortLabels[sortMode]}`}
          />
          {deletedManualMemoryTitle ? (
            <div className="border-b border-line bg-surface px-5 py-3">
              <p className="text-xs leading-5 text-muted">
                수동 메모리 삭제됨 · {deletedManualMemoryTitle}
              </p>
            </div>
          ) : null}
          <div className="divide-y divide-line">
            {filtered.map((memory) => {
              const memoryContentDisplay = splitMemoryContentDisplay(
                memory.content,
              );

              return (
              <article
                key={memory.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_180px]"
              >
                <div className="min-w-0">
                  {editingMemoryId === memory.id ? (
                    <div className="space-y-3 rounded-md border border-line bg-surface px-3 py-3">
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-soft">
                          범위
                        </span>
                        <select
                          className={selectClass}
                          value={editScope}
                          onChange={(event) => {
                            setEditScope(event.target.value as MemoryScope);
                            setEditValidationMessage("");
                          }}
                        >
                          {trackedScopes.map((item) => (
                            <option key={item} value={item}>
                              {scopeLabels[item]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-soft">
                          제목
                        </span>
                        <input
                          className={inputClass}
                          value={editTitle}
                          onChange={(event) => {
                            setEditTitle(event.target.value);
                            setEditValidationMessage("");
                          }}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-soft">
                          내용
                        </span>
                        <textarea
                          className={`${textareaClass} min-h-28`}
                          value={editContent}
                          onChange={(event) => {
                            setEditContent(event.target.value);
                            setEditValidationMessage("");
                          }}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-soft">
                          태그
                        </span>
                        <input
                          className={inputClass}
                          value={editTags}
                          onChange={(event) => {
                            setEditTags(event.target.value);
                            setEditValidationMessage("");
                          }}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-soft">
                          신뢰도
                        </span>
                        <select
                          className={selectClass}
                          value={editConfidence}
                          onChange={(event) => {
                            setEditConfidence(Number(event.target.value));
                            setEditValidationMessage("");
                          }}
                        >
                          {confidenceOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label} ({item.value.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </label>
                      {editValidationMessage ? (
                        <p className="rounded-md border border-attention/40 bg-background px-3 py-2 text-xs leading-5 text-attention">
                          {editValidationMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                          {scopeLabels[memory.scope]}
                        </span>
                        <span className="text-xs text-muted">
                          {sourceTypeLabels[memory.sourceType]} ·{" "}
                          {formatDate(memory.updatedAt)}
                        </span>
                      </div>
                      <h2 className="mt-3 text-sm font-semibold">{memory.title}</h2>
                      {memoryContentDisplay.body ? (
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-soft">
                          {memoryContentDisplay.body}
                        </p>
                      ) : null}
                      {memoryContentDisplay.links.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {memoryContentDisplay.links.map((link) => (
                            <Link
                              key={`${memory.id}:${link.label}:${link.href}`}
                              href={link.href}
                              className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold text-accent transition hover:border-accent hover:bg-panel-strong"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {memory.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-line px-2 py-1 text-xs text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="self-center">
                  <ScoreBar label="신뢰도" value={memory.confidence * 5} />
                  {editingMemoryId === memory.id ? (
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        className={`${primaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => saveEditedManualMemory(memory.id)}
                        disabled={!editTitle.trim() || !editContent.trim()}
                      >
                        수정 저장
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={cancelEditingManualMemory}
                      >
                        취소
                      </button>
                    </div>
                  ) : memory.sourceType === "manual" ? (
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => copyMemoryReport(memory)}
                      >
                        {copiedMemoryId === memory.id
                          ? "메모리 복사됨"
                          : failedMemoryCopyId === memory.id
                            ? "메모리 복사 실패"
                            : "메모리 복사"}
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => openMemoryInStudio(memory)}
                      >
                        Studio로 보내기
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => startEditingManualMemory(memory)}
                      >
                        수동 메모리 편집
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => deleteManualMemory(memory)}
                      >
                        수동 메모리 삭제
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => copyMemoryReport(memory)}
                      >
                        {copiedMemoryId === memory.id
                          ? "메모리 복사됨"
                          : failedMemoryCopyId === memory.id
                            ? "메모리 복사 실패"
                            : "메모리 복사"}
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => openMemoryInStudio(memory)}
                      >
                        Studio로 보내기
                      </button>
                    </div>
                  )}
                </div>
                {learningManualCopy?.id === `memory:${memory.id}` ? (
                  <div className="lg:col-span-2">
                    <LearningManualCopyPanel
                      copy={learningManualCopy}
                      onClose={() => setLearningManualCopy(null)}
                    />
                  </div>
                ) : null}
              </article>
              );
            })}

            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-sm text-muted">
                아직 학습 메모리가 없습니다. Library에서 프롬프트에 피드백을 남기면 자동으로 생성됩니다.
              </div>
            ) : null}
          </div>
        </Panel>
      </div>
    </>
  );
}
