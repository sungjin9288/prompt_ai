import {
  targetModels,
  type PromptAsset,
  type PromptScoreBreakdown,
  type PromptVersion,
  type TargetModel,
} from "@/lib/prompt";

export interface ParsedPromptImport {
  title: string;
  source: PromptAsset["source"];
  modelUsed?: string;
  rawInput: string;
  goal: string;
  domain: string;
  targetModels: TargetModel[];
  tags?: string[];
  languageStrategy?: PromptAsset["languageStrategy"];
  outputLanguage?: PromptAsset["outputLanguage"];
  versions: PromptVersion[];
  createdAt: string;
  updatedAt: string;
}

export type PromptImportResult =
  | { ok: true; prompt: ParsedPromptImport }
  | { ok: false; error: string };

export interface NormalizeImportedPromptParams {
  id: string;
  versionIds: string[];
  timestamp: string;
}

const scoreBreakdownKeys: (keyof PromptScoreBreakdown)[] = [
  "clarity",
  "context",
  "outputFormat",
  "constraints",
  "expertise",
  "modelFit",
  "reusability",
];

const promptSources: PromptAsset["source"][] = ["local", "openai"];
const languageStrategyValues: NonNullable<PromptAsset["languageStrategy"]>[] =
  ["english", "hybrid"];
const outputLanguageValues: NonNullable<PromptAsset["outputLanguage"]>[] = [
  "korean",
  "english",
  "same_as_input",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function normalizeScoreBreakdown(value: unknown): PromptScoreBreakdown {
  const source = isRecord(value) ? value : {};

  return scoreBreakdownKeys.reduce((acc, key) => {
    const rawValue = source[key];

    return {
      ...acc,
      [key]: isFiniteNumber(rawValue) ? rawValue : 0,
    };
  }, {} as PromptScoreBreakdown);
}

function normalizeTargetModel(value: unknown): TargetModel | undefined {
  return typeof value === "string" &&
    (targetModels as string[]).includes(value)
    ? (value as TargetModel)
    : undefined;
}

function parseVersion(
  value: unknown,
  index: number,
): { ok: true; version: PromptVersion } | { ok: false; error: string } {
  if (!isRecord(value)) {
    return {
      ok: false,
      error: `versions[${index}]이 올바른 형식이 아닙니다.`,
    };
  }

  if (!isNonEmptyString(value.content)) {
    return {
      ok: false,
      error: `versions[${index}].content가 없거나 비어 있습니다.`,
    };
  }

  const targetModel = normalizeTargetModel(value.targetModel);

  if (!targetModel) {
    return {
      ok: false,
      error: `versions[${index}].targetModel이 올바르지 않습니다.`,
    };
  }

  const modelLabel = isNonEmptyString(value.modelLabel)
    ? value.modelLabel
    : targetModel;
  const qualityScore = isFiniteNumber(value.qualityScore)
    ? value.qualityScore
    : 0;
  const assumptions = isStringArray(value.assumptions) ? value.assumptions : [];
  const missingContext = isStringArray(value.missingContext)
    ? value.missingContext
    : [];
  const createdAt = isNonEmptyString(value.createdAt)
    ? value.createdAt
    : new Date(0).toISOString();

  return {
    ok: true,
    version: {
      id: isNonEmptyString(value.id) ? value.id : `imported-version-${index}`,
      targetModel,
      modelLabel,
      content: value.content,
      qualityScore,
      scoreBreakdown: normalizeScoreBreakdown(value.scoreBreakdown),
      assumptions,
      missingContext,
      createdAt,
    },
  };
}

function parseVersions(
  value: unknown,
): { ok: true; versions: PromptVersion[] } | { ok: false; error: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: "versions가 비어 있거나 배열이 아닙니다." };
  }

  const versions: PromptVersion[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const parsed = parseVersion(value[index], index);

    if (!parsed.ok) {
      return parsed;
    }

    versions.push(parsed.version);
  }

  return { ok: true, versions };
}

function parseTargetModels(value: unknown, versions: PromptVersion[]): TargetModel[] {
  if (Array.isArray(value)) {
    const normalized = value
      .map(normalizeTargetModel)
      .filter((model): model is TargetModel => Boolean(model));

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return [...new Set(versions.map((version) => version.targetModel))];
}

function normalizeSource(value: unknown): PromptAsset["source"] {
  return typeof value === "string" &&
    (promptSources as string[]).includes(value)
    ? (value as PromptAsset["source"])
    : "local";
}

function normalizeLanguageStrategy(
  value: unknown,
): PromptAsset["languageStrategy"] {
  return typeof value === "string" &&
    (languageStrategyValues as string[]).includes(value)
    ? (value as PromptAsset["languageStrategy"])
    : undefined;
}

function normalizeOutputLanguage(value: unknown): PromptAsset["outputLanguage"] {
  return typeof value === "string" &&
    (outputLanguageValues as string[]).includes(value)
    ? (value as PromptAsset["outputLanguage"])
    : undefined;
}

function parseSinglePrompt(candidate: unknown): PromptImportResult {
  if (!isRecord(candidate)) {
    return { ok: false, error: "프롬프트 객체 형식이 올바르지 않습니다." };
  }

  if (!isNonEmptyString(candidate.title)) {
    return { ok: false, error: "title이 없거나 비어 있습니다." };
  }

  if (!isNonEmptyString(candidate.rawInput)) {
    return { ok: false, error: "rawInput이 없거나 비어 있습니다." };
  }

  const versionsResult = parseVersions(candidate.versions);

  if (!versionsResult.ok) {
    return versionsResult;
  }

  const goal = isNonEmptyString(candidate.goal) ? candidate.goal : "";
  const domain = isNonEmptyString(candidate.domain) ? candidate.domain : "";
  const tags = isStringArray(candidate.tags) ? candidate.tags : undefined;
  const modelUsed = isNonEmptyString(candidate.modelUsed)
    ? candidate.modelUsed
    : undefined;
  const createdAt = isNonEmptyString(candidate.createdAt)
    ? candidate.createdAt
    : new Date(0).toISOString();
  const updatedAt = isNonEmptyString(candidate.updatedAt)
    ? candidate.updatedAt
    : createdAt;

  return {
    ok: true,
    prompt: {
      title: candidate.title,
      source: normalizeSource(candidate.source),
      modelUsed,
      rawInput: candidate.rawInput,
      goal,
      domain,
      targetModels: parseTargetModels(
        candidate.targetModels,
        versionsResult.versions,
      ),
      tags,
      languageStrategy: normalizeLanguageStrategy(candidate.languageStrategy),
      outputLanguage: normalizeOutputLanguage(candidate.outputLanguage),
      versions: versionsResult.versions,
      createdAt,
      updatedAt,
    },
  };
}

export function parsePromptImport(text: string): PromptImportResult {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON 형식이 올바르지 않습니다." };
  }

  const candidate = Array.isArray(parsedJson) ? parsedJson[0] : parsedJson;

  if (Array.isArray(parsedJson) && parsedJson.length === 0) {
    return { ok: false, error: "가져올 프롬프트가 배열에 없습니다." };
  }

  return parseSinglePrompt(candidate);
}

export function normalizeImportedPrompt(
  parsed: ParsedPromptImport,
  { id, versionIds, timestamp }: NormalizeImportedPromptParams,
): PromptAsset {
  if (versionIds.length !== parsed.versions.length) {
    throw new Error(
      `normalizeImportedPrompt: versionIds length (${versionIds.length}) must match parsed.versions length (${parsed.versions.length})`,
    );
  }

  return {
    id,
    title: parsed.title,
    source: parsed.source,
    modelUsed: parsed.modelUsed,
    languageStrategy: parsed.languageStrategy,
    outputLanguage: parsed.outputLanguage,
    tags: parsed.tags ? [...parsed.tags] : undefined,
    rawInput: parsed.rawInput,
    goal: parsed.goal,
    domain: parsed.domain,
    targetModels: [...parsed.targetModels],
    versions: parsed.versions.map((version, index) => ({
      ...version,
      id: versionIds[index],
      createdAt: timestamp,
    })),
    feedback: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
