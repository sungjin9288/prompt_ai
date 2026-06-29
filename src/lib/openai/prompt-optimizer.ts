import { scorePrompt } from "@/lib/prompt/scoring";
import type { PromptAsset, TargetModel } from "@/lib/prompt/types";

interface OpenAIPromptVersion {
  targetModel: TargetModel;
  content: string;
  assumptions: string[];
  missingContext: string[];
}

interface OpenAIPromptResult {
  title: string;
  versions: OpenAIPromptVersion[];
}

const promptResultSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      description: "Short Korean title for the generated prompt asset.",
    },
    versions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          targetModel: {
            type: "string",
            enum: ["general", "gpt", "claude", "codex", "gemini"],
          },
          content: {
            type: "string",
            description: "Final copy-ready prompt for this target AI tool.",
          },
          assumptions: {
            type: "array",
            items: { type: "string" },
          },
          missingContext: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["targetModel", "content", "assumptions", "missingContext"],
      },
    },
  },
  required: ["title", "versions"],
} as const;

function extractResponseText(response: unknown) {
  if (!response || typeof response !== "object") {
    return "";
  }

  const outputText = (response as { output_text?: unknown }).output_text;

  if (typeof outputText === "string") {
    return outputText;
  }

  const output = (response as { output?: unknown }).output;

  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const content = (item as { content?: unknown }).content;

      if (!Array.isArray(content)) {
        return [];
      }

      return content
        .map((part) => {
          if (!part || typeof part !== "object") {
            return "";
          }

          const text = (part as { text?: unknown }).text;

          return typeof text === "string" ? text : "";
        })
        .filter(Boolean);
    })
    .join("");
}

function parsePromptResult(text: string): OpenAIPromptResult | null {
  try {
    const parsed = JSON.parse(text) as OpenAIPromptResult;

    if (!parsed || !Array.isArray(parsed.versions)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function systemInstruction() {
  return `You are the prompt optimization engine for a personalized prompt operations product.
Return only a valid JSON object.
Each version must be a professional, copy-ready task instruction that the user can paste into GPT, Claude, Codex, Gemini, or a general AI tool.
Reflect the user profile, company rules, domain rules, and recent feedback inside the actual prompt content.
Do not invent unverified facts or numbers. Separate missing information into missingContext or assumptions.
If promptAsset.languageStrategy is "hybrid", write role/task/constraints/output-format instructions in English while preserving Korean user and company context where nuance matters.
If promptAsset.languageStrategy is "english", write the prompt primarily in English while preserving Korean proper nouns, internal terms, and exact source wording when translation may distort meaning.
Use promptAsset.outputLanguage to instruct the target AI's final answer language: "korean" means Korean, "english" means English, and "same_as_input" means the same language as the user's source input.
Codex versions must include codebase inspection, implementation scope, and verification steps.
Claude versions must be suited for long-context document analysis and evidence/assumption separation.
Gemini versions must be suited for document, image, table, and multimodal analysis.
GPT versions must support conversational follow-up edits and structured deliverables.`;
}

function userInstruction(localPrompt: PromptAsset) {
  const versions = localPrompt.versions.map((version) => ({
    targetModel: version.targetModel,
    draftPrompt: version.content,
    assumptions: version.assumptions,
    missingContext: version.missingContext,
  }));

  return JSON.stringify(
    {
      task: "아래 규칙 기반 초안을 더 명확하고 전문적인 AI별 프롬프트로 개선해라.",
      promptAsset: {
        title: localPrompt.title,
        rawInput: localPrompt.rawInput,
        goal: localPrompt.goal,
        domain: localPrompt.domain,
        targetModels: localPrompt.targetModels,
        targetModelDecision: localPrompt.targetModelDecision,
        languageStrategy: localPrompt.languageStrategy ?? "hybrid",
        languageDecision: localPrompt.languageDecision,
        outputLanguage: localPrompt.outputLanguage ?? "korean",
        draftVersions: versions,
      },
      outputRules: [
        "입력 targetModels와 같은 targetModel만 반환한다.",
        "각 content는 섹션 제목을 포함한 copy-ready prompt여야 한다.",
        "회사/개인 맥락이 초안에 있으면 삭제하지 말고 더 자연스럽게 반영한다.",
        "languageStrategy가 hybrid면 영어 지시문과 한국어 맥락 보존을 함께 적용한다.",
        "languageStrategy가 english면 지시문은 영어 중심으로 작성한다.",
        "outputLanguage 값에 맞춰 대상 AI의 최종 답변 언어를 명시한다.",
        "불확실성은 assumptions와 missingContext로 분리한다.",
      ],
    },
    null,
    2,
  );
}

export async function enhancePromptWithOpenAI(localPrompt: PromptAsset) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      prompt: localPrompt,
      mode: "local" as const,
      notice: "OPENAI_API_KEY is not configured. Used local prompt builder.",
    };
  }

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions: systemInstruction(),
      input: userInstruction(localPrompt),
      text: {
        format: {
          type: "json_schema",
          name: "prompt_optimizer_result",
          schema: promptResultSchema,
          strict: true,
        },
        verbosity: "medium",
      },
      max_output_tokens: 12000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const json = (await response.json()) as unknown;
  const parsed = parsePromptResult(extractResponseText(json));

  if (!parsed) {
    throw new Error("OpenAI response did not include valid optimizer JSON.");
  }

  const enhancedVersions = localPrompt.versions.map((version) => {
    const match = parsed.versions.find(
      (candidate) => candidate.targetModel === version.targetModel,
    );

    if (!match?.content.trim()) {
      return version;
    }

    const { qualityScore, scoreBreakdown } = scorePrompt(
      match.content,
      version.targetModel,
    );

    return {
      ...version,
      content: match.content,
      assumptions: match.assumptions.length
        ? match.assumptions
        : version.assumptions,
      missingContext: match.missingContext,
      qualityScore,
      scoreBreakdown,
    };
  });

  return {
    prompt: {
      ...localPrompt,
      title: parsed.title || localPrompt.title,
      source: "openai" as const,
      modelUsed: model,
      versions: enhancedVersions,
      updatedAt: new Date().toISOString(),
    },
    mode: "openai" as const,
    notice: `Enhanced with OpenAI ${model}.`,
  };
}
