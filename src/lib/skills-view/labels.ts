import type { PromptSkill } from "@/lib/prompt";

export function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

export function emptySkill(): PromptSkill {
  const now = new Date().toISOString();

  return {
    id: makeId("skill"),
    name: "",
    description: "",
    domain: "범용",
    targetModel: "gpt",
    languageStrategy: "hybrid",
    outputLanguage: "korean",
    inputGuide: "",
    promptTemplate: "",
    outputFormat: "",
    qualityChecklist: [],
    tags: [],
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function formatTimestamp(value?: string) {
  if (!value) {
    return "아직 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function feedbackStatusLabel(status: "collect_feedback" | "improve" | "healthy") {
  switch (status) {
    case "healthy":
      return "안정";
    case "improve":
      return "개선 필요";
    default:
      return "피드백 수집";
  }
}
