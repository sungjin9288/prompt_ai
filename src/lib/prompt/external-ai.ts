import type { TargetModel } from "@/lib/prompt";

export interface ExternalAiTarget {
  label: string;
  url: string;
}

const externalAiTargets: Record<TargetModel, ExternalAiTarget> = {
  general: { label: "ChatGPT", url: "https://chatgpt.com/" },
  gpt: { label: "ChatGPT", url: "https://chatgpt.com/" },
  codex: { label: "ChatGPT", url: "https://chatgpt.com/" },
  claude: { label: "Claude", url: "https://claude.ai/new" },
  gemini: { label: "Gemini", url: "https://gemini.google.com/app" },
};

export function getExternalAiTarget(
  targetModel: TargetModel,
): ExternalAiTarget {
  return externalAiTargets[targetModel];
}

export function getExternalAiLabel(targetModel: TargetModel): string {
  return getExternalAiTarget(targetModel).label;
}
