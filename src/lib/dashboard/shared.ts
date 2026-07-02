import {
  modelLabels,
  type Feedback,
  type PromptStudioDraftSource,
  type PromptStudioDraftSourceVariant,
} from "@/lib/prompt";
import { type LanguageStrategyPerformance } from "@/lib/analytics/language-strategy";
import { type OutputLanguagePerformance } from "@/lib/analytics/output-language";
import { type TargetModelPerformance } from "@/lib/analytics/target-model";
import { type GenerationEnginePerformance } from "@/lib/analytics/generation-engine";

export interface GenerationEngineStatus {
  configured: boolean;
  model: string | null;
  mode: "local" | "openai";
}

export type StudioPersistenceMode = "chain" | "none" | "ops";

export interface StudioPersistenceSummaryItem {
  mode: StudioPersistenceMode;
  label: string;
  description: string;
  count: number;
}

export interface StudioSourceSummaryItem {
  source: PromptStudioDraftSource;
  label: string;
  description: string;
  nextAction: string;
  count: number;
  sourceExamples: {
    href: string;
    originalActionLabel?: string;
    originalHref?: string;
    title: string;
  }[];
  sourceTitles: string[];
  sourceVariantLabels: string[];
  sourceVariantLinks: {
    count: number;
    href: string;
    label: string;
    sourceVariant: PromptStudioDraftSourceVariant;
  }[];
}

export function completion(values: string[]) {
  const filled = values.filter((value) => value.trim().length > 0).length;
  return Math.round((filled / values.length) * 100);
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

export function strategyStatusLabel(status: LanguageStrategyPerformance["status"]) {
  switch (status) {
    case "promising":
      return "우수";
    case "watch":
      return "관찰";
    default:
      return "데이터 부족";
  }
}

export function outputLanguageStatusLabel(status: OutputLanguagePerformance["status"]) {
  switch (status) {
    case "promising":
      return "우수";
    case "watch":
      return "관찰";
    default:
      return "데이터 부족";
  }
}

export function targetModelStatusLabel(status: TargetModelPerformance["status"]) {
  switch (status) {
    case "promising":
      return "우수";
    case "watch":
      return "관찰";
    default:
      return "데이터 부족";
  }
}

export function generationEngineStatusLabel(
  status: GenerationEnginePerformance["status"],
) {
  switch (status) {
    case "promising":
      return "우수";
    case "watch":
      return "관찰";
    default:
      return "데이터 부족";
  }
}

export const feedbackTypeLabels: Record<Feedback["feedbackType"], string> = {
  accuracy: "정확성",
  company_rule: "회사 기준",
  context: "맥락",
  format: "출력 형식",
  other: "기타",
  tone: "톤",
};

export function formatTargetModelLabels(models: string[]) {
  return models
    .map((model) => modelLabels[model as keyof typeof modelLabels] ?? model)
    .join(", ");
}

export function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

export function formatSignedScore(value: number) {
  if (value > 0) {
    return `+${value.toFixed(1)}`;
  }

  return value.toFixed(1);
}

export function formatDashboardDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "날짜 없음";
  }

  return date.toLocaleDateString("ko-KR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export function formatReportList(values: string[]) {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);

  return cleaned.length ? cleaned.join(", ") : "미설정";
}

export function formatReadinessLabel(completionValue: number) {
  if (completionValue >= 80) {
    return "ready";
  }

  if (completionValue >= 50) {
    return "partial";
  }

  return "needs-input";
}
