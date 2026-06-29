import {
  buildTargetAiHandoffPackageText,
  buildTargetAiHandoffReadinessItems,
  createPromptPackage,
  defaultCompanyProfile,
  defaultUserProfile,
  targetModels,
} from "@/lib/prompt";
import type {
  CompanyProfile,
  PromptOutputLanguage,
  PromptRequestInput,
  TargetModel,
  UserProfile,
} from "@/lib/prompt/types";

export type IntegrationSourceApp =
  | "chrome"
  | "mcp"
  | "chatgpt"
  | "claude"
  | "codex"
  | "gemini"
  | "web"
  | "unknown";

export type IntegrationDeliveryMode = "review_required";

export interface IntegrationRefineRequest {
  companyProfile?: CompanyProfile;
  deliveryMode: IntegrationDeliveryMode;
  priorFeedback: string[];
  request: PromptRequestInput;
  sourceApp: IntegrationSourceApp;
  sourceUrl?: string;
  userProfile?: UserProfile;
}

export interface IntegrationRefineResponse {
  audit: {
    deliveryMode: IntegrationDeliveryMode;
    reviewRequired: true;
    sourceApp: IntegrationSourceApp;
    sourceUrl?: string;
    tool: "refine_prompt";
  };
  handoffPackages: Array<{
    handoffText: string;
    modelLabel: string;
    qualityScore: number;
    readiness: ReturnType<typeof buildTargetAiHandoffReadinessItems>;
    targetModel: TargetModel;
  }>;
  promptPackage: ReturnType<typeof createPromptPackage>;
}

export interface IntegrationRefineParseResult {
  error?: string;
  value?: IntegrationRefineRequest;
}

const sourceApps: IntegrationSourceApp[] = [
  "chrome",
  "mcp",
  "chatgpt",
  "claude",
  "codex",
  "gemini",
  "web",
  "unknown",
];

const outputLanguages: PromptOutputLanguage[] = [
  "korean",
  "english",
  "same_as_input",
];

const targetAliases: Record<string, TargetModel | "auto"> = {
  auto: "auto",
  chatgpt: "gpt",
  claude: "claude",
  codex: "codex",
  gemini: "gemini",
  gpt: "gpt",
  openai: "gpt",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeSourceApp(value: unknown): IntegrationSourceApp {
  const sourceApp = optionalString(value).toLowerCase();

  return sourceApps.includes(sourceApp as IntegrationSourceApp)
    ? (sourceApp as IntegrationSourceApp)
    : "unknown";
}

function normalizeTargetModels(value: unknown): TargetModel[] {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];
  const normalized = rawValues
    .map((item) => optionalString(item).toLowerCase())
    .map((item) => targetAliases[item] ?? item)
    .filter(
      (item): item is TargetModel =>
        item !== "auto" && targetModels.includes(item as TargetModel),
    );

  return Array.from(new Set(normalized));
}

function normalizeOutputLanguage(value: unknown) {
  const outputLanguage = optionalString(value);

  return outputLanguages.includes(outputLanguage as PromptOutputLanguage)
    ? (outputLanguage as PromptOutputLanguage)
    : undefined;
}

export function parseIntegrationRefineRequest(
  body: unknown,
): IntegrationRefineParseResult {
  const payload = asRecord(body);
  const nestedRequest = asRecord(payload.request);
  const rawInput =
    optionalString(nestedRequest.rawInput) || optionalString(payload.rawInput);

  if (!rawInput) {
    return { error: "rawInput is required" };
  }

  const targetModelsFromRequest = normalizeTargetModels(
    nestedRequest.targetModels ?? nestedRequest.targetAI,
  );
  const targetModelsFromPayload = normalizeTargetModels(
    payload.targetModels ?? payload.targetAI,
  );

  return {
    value: {
      companyProfile: payload.companyProfile as CompanyProfile | undefined,
      deliveryMode: "review_required",
      priorFeedback: optionalStringArray(payload.priorFeedback),
      request: {
        domain:
          optionalString(nestedRequest.domain) ||
          optionalString(payload.domain) ||
          "범용",
        goal:
          optionalString(nestedRequest.goal) ||
          optionalString(payload.goal) ||
          "전문 프롬프트로 변환",
        outputLanguage: normalizeOutputLanguage(
          nestedRequest.outputLanguage ?? payload.outputLanguage,
        ),
        rawInput,
        targetModels: targetModelsFromRequest.length
          ? targetModelsFromRequest
          : targetModelsFromPayload,
      },
      sourceApp: normalizeSourceApp(payload.sourceApp),
      sourceUrl: optionalString(payload.sourceUrl) || undefined,
      userProfile: payload.userProfile as UserProfile | undefined,
    },
  };
}

export function createIntegrationRefineResponse(
  input: IntegrationRefineRequest,
): IntegrationRefineResponse {
  const promptPackage = createPromptPackage(
    input.request,
    input.userProfile ?? defaultUserProfile,
    input.companyProfile ?? defaultCompanyProfile,
    input.priorFeedback,
  );

  return {
    audit: {
      deliveryMode: input.deliveryMode,
      reviewRequired: true,
      sourceApp: input.sourceApp,
      sourceUrl: input.sourceUrl,
      tool: "refine_prompt",
    },
    handoffPackages: promptPackage.versions.map((version) => ({
      handoffText: buildTargetAiHandoffPackageText({
        prompt: promptPackage,
        version,
      }),
      modelLabel: version.modelLabel,
      qualityScore: version.qualityScore,
      readiness: buildTargetAiHandoffReadinessItems({ version }),
      targetModel: version.targetModel,
    })),
    promptPackage,
  };
}
