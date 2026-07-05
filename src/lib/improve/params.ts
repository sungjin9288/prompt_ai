import type { TargetModel } from "@/lib/prompt";

export const improveDraftMaxLength = 4000;

export type ImproveSource = "extension" | "unknown";

export type ImproveOrigin = "chatgpt" | "claude" | "gemini" | "unknown";

export interface ImproveParams {
  draft: string;
  source: ImproveSource;
  origin: ImproveOrigin;
}

const improveOrigins: ImproveOrigin[] = ["chatgpt", "claude", "gemini"];

const originTargetModels: Record<ImproveOrigin, TargetModel> = {
  chatgpt: "gpt",
  claude: "claude",
  gemini: "gemini",
  unknown: "general",
};

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function decodeDraftParam(rawDraft: string): string {
  if (!rawDraft) {
    return "";
  }

  try {
    return decodeURIComponent(rawDraft);
  } catch {
    return rawDraft;
  }
}

export function capImproveDraft(draft: string): string {
  return draft.slice(0, improveDraftMaxLength);
}

function normalizeImproveSource(rawSource: string): ImproveSource {
  return rawSource === "extension" ? "extension" : "unknown";
}

export function normalizeImproveOrigin(rawOrigin: string): ImproveOrigin {
  const normalized = rawOrigin.toLowerCase();

  return improveOrigins.includes(normalized as ImproveOrigin)
    ? (normalized as ImproveOrigin)
    : "unknown";
}

export function getImproveOriginTargetModel(
  origin: ImproveOrigin,
): TargetModel {
  return originTargetModels[origin];
}

export function resolveImproveParams(searchParams: {
  draft?: string | string[];
  source?: string | string[];
  origin?: string | string[];
}): ImproveParams {
  const rawDraft = firstValue(searchParams.draft);
  const rawSource = firstValue(searchParams.source);
  const rawOrigin = firstValue(searchParams.origin);

  return {
    draft: capImproveDraft(decodeDraftParam(rawDraft)),
    source: normalizeImproveSource(rawSource),
    origin: normalizeImproveOrigin(rawOrigin),
  };
}
