import {
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  type PromptAsset,
  type PromptVersion,
} from "@/lib/prompt";
import { getLanguageStrategy, getOutputLanguage } from "@/lib/library/prompt-metrics";

const filenameFallbackId = "prompt";
const maxFilenameSlugLength = 80;

export function buildPromptMarkdown(
  prompt: PromptAsset,
  version: PromptVersion,
): string {
  const tags = prompt.tags ?? [];

  const metadataLines = [
    `- 분야: ${prompt.domain}`,
    `- 대상 AI: ${prompt.targetModels.map((model) => modelLabels[model]).join(", ")}`,
    `- 언어 전략: ${languageStrategyLabels[getLanguageStrategy(prompt)]}`,
    `- 답변 언어: ${outputLanguageLabels[getOutputLanguage(prompt)]}`,
    `- 태그: ${tags.length ? tags.join(", ") : "없음"}`,
    `- 생성일: ${prompt.createdAt}`,
  ];

  return [
    `# ${prompt.title}`,
    "",
    ...metadataLines,
    "",
    "## 원문",
    "",
    prompt.rawInput,
    "",
    `## 프롬프트 (${version.modelLabel})`,
    "",
    version.content,
    "",
  ].join("\n");
}

export function buildPromptJson(prompt: PromptAsset): string {
  return JSON.stringify(prompt, null, 2);
}

function slugifyTitle(title: string): string {
  return title
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, maxFilenameSlugLength)
    .replace(/^-+|-+$/g, "");
}

export function buildPromptExportFilename(
  prompt: PromptAsset,
  ext: "md" | "json",
): string {
  const slug = slugifyTitle(prompt.title);
  const base = slug.length ? slug : prompt.id || filenameFallbackId;

  return `${base}.${ext}`;
}
