import type { LearningMemory, MemoryScope } from "@/lib/prompt";

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

export const scopeLabels: Record<LearningScopeFilter, string> = {
  all: "전체",
  user: "사용자",
  company: "회사",
  domain: "분야",
  skill: "스킬",
};

export const scopes: LearningScopeFilter[] = [
  "all",
  "user",
  "company",
  "domain",
  "skill",
];
export const trackedScopes: MemoryScope[] = ["user", "company", "domain", "skill"];
export const confidenceOptions = [
  { label: "높음", value: 0.85 },
  { label: "보통", value: 0.65 },
  { label: "낮음", value: 0.45 },
];
export const reviewFilterLabels: Record<LearningReviewFilter, string> = {
  all: "전체",
  "low-confidence": "낮은 신뢰도",
  manual: "수동 메모리",
  generated: "자동 생성",
};
export const reviewFilters: LearningReviewFilter[] = [
  "all",
  "low-confidence",
  "manual",
  "generated",
];
export const sortLabels: Record<LearningSortMode, string> = {
  "confidence-desc": "신뢰도 높은순",
  "confidence-asc": "신뢰도 낮은순",
  "updated-desc": "최근 업데이트순",
  "updated-asc": "오래된 업데이트순",
};
export const sortModes: LearningSortMode[] = [
  "confidence-desc",
  "confidence-asc",
  "updated-desc",
  "updated-asc",
];
export const sourceTypeLabels: Record<LearningMemory["sourceType"], string> = {
  feedback: "피드백",
  profile: "프로필",
  company: "회사 기준",
  manual: "수동",
};

export function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

export function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function normalizeMemoryContent(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function findDuplicateMemory(
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

export function matchesReviewFilter(
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

export function compareMemories(
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

export function formatDate(value: string) {
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

export function getLatestMemoryDate(memories: LearningMemory[]) {
  return memories
    .map((memory) => memory.updatedAt)
    .sort((a, b) => b.localeCompare(a))[0];
}
