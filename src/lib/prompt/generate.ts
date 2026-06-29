import {
  defaultCompanyProfile,
  defaultUserProfile,
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
} from "./defaults";
import { getDomainProfile } from "./domain-profiles";
import { decidePromptLanguageStrategy } from "./language-decision";
import { scorePrompt } from "./scoring";
import { decideTargetModels } from "./target-model-decision";
import type {
  CompanyProfile,
  PromptLanguageStrategy,
  PromptOutputLanguage,
  PromptAsset,
  PromptRequestInput,
  TargetModel,
  UserProfile,
} from "./types";

function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

function list(items: string[], fallback = "없음") {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  return clean.length ? clean.map((item) => `- ${item}`).join("\n") : `- ${fallback}`;
}

function inlineList(items: string[], fallback = "미지정") {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  return clean.length ? clean.join(", ") : fallback;
}

function shortTitle(rawInput: string, goal: string, domain: string) {
  const compact = rawInput.replace(/\s+/g, " ").trim();
  const source = compact.length > 42 ? `${compact.slice(0, 42)}...` : compact;
  return `${domain || "범용"} · ${goal || "프롬프트 변환"} · ${
    source || "새 요청"
  }`;
}

function resolveLanguageStrategy(
  request: PromptRequestInput,
): PromptLanguageStrategy {
  return request.languageStrategy ?? "hybrid";
}

function resolveOutputLanguage(request: PromptRequestInput): PromptOutputLanguage {
  return request.outputLanguage ?? "korean";
}

function outputLanguageInstruction(outputLanguage: PromptOutputLanguage) {
  switch (outputLanguage) {
    case "english":
      return "The target AI's final answer must be written in English.";
    case "same_as_input":
      return "The target AI's final answer must match the user's source input language.";
    default:
      return "The target AI's final answer must be written in Korean.";
  }
}

function buildAssumptions(
  request: PromptRequestInput,
  userProfile: UserProfile,
  companyProfile: CompanyProfile,
) {
  const languageStrategy = resolveLanguageStrategy(request);
  const outputLanguage = resolveOutputLanguage(request);
  const assumptions = [
    "사용자 원문에 없는 세부 조건은 임의 사실이 아니라 작업 가정으로 표시한다.",
    "최종 결과물은 바로 복사해 다른 AI 도구에 붙여넣을 수 있는 지시문이어야 한다.",
    `대상 AI의 최종 답변 언어는 ${outputLanguageLabels[outputLanguage]}로 설정한다.`,
    languageStrategy === "hybrid"
      ? "프롬프트 구조 지시는 영어로 작성하고, 한국어 사용자/회사 맥락은 원문 의미를 보존한다."
      : "프롬프트 지시는 영어 중심으로 작성하되, 한국어 고유명사와 내부 용어는 보존한다.",
  ];

  if (request.languageDecision?.reason) {
    assumptions.push(`언어 전략 자동 판단 이유: ${request.languageDecision.reason}`);
  }

  if (request.targetModelDecision?.reason) {
    assumptions.push(`대상 AI 자동 추천 이유: ${request.targetModelDecision.reason}`);
  }

  if (!companyProfile.companyName.trim()) {
    assumptions.push(
      "회사명은 아직 확정되지 않았으므로 회사 맥락은 일반 브랜드 기준으로 반영한다.",
    );
  }

  if (!request.goal.trim()) {
    assumptions.push(
      "명시 목표가 없으면 원문을 전문 프롬프트로 변환하는 것을 기본 목표로 둔다.",
    );
  }

  if (!userProfile.role.trim()) {
    assumptions.push("사용자 직무가 없으면 다분야 개인 전문가 기준으로 작성한다.");
  }

  return assumptions;
}

function buildMissingContext(request: PromptRequestInput, companyProfile: CompanyProfile) {
  const missing: string[] = [];

  if (request.rawInput.trim().length < 40) {
    missing.push("작업 배경과 원하는 결과물의 사용처");
  }

  if (!companyProfile.description.trim()) {
    missing.push("회사/서비스 설명");
  }

  if (!companyProfile.customers.length) {
    missing.push("타깃 고객 또는 독자");
  }

  if (!request.domain.trim()) {
    missing.push("업무 분야");
  }

  return missing;
}

function buildContextBlock(
  userProfile: UserProfile,
  companyProfile: CompanyProfile,
  domain: string,
  priorFeedback: string[],
) {
  const domainProfile = getDomainProfile(domain);

  return `사용자 맥락:
- 역할: ${userProfile.role || defaultUserProfile.role}
- 산업: ${inlineList(userProfile.industries)}
- 주요 목표: ${inlineList(userProfile.goals)}
- 선호 톤: ${userProfile.preferredTone || defaultUserProfile.preferredTone}
- 선호 출력: ${inlineList(userProfile.preferredOutputs)}
- 피해야 할 표현: ${inlineList(userProfile.avoidPhrases)}

회사 맥락:
- 회사명: ${companyProfile.companyName || "미지정"}
- 설명: ${companyProfile.description || defaultCompanyProfile.brandTone}
- 제품/서비스: ${inlineList(companyProfile.products)}
- 고객군: ${inlineList(companyProfile.customers)}
- 브랜드 톤: ${companyProfile.brandTone || defaultCompanyProfile.brandTone}
- 내부 용어: ${inlineList(companyProfile.internalTerms)}
- 금지 표현: ${inlineList(companyProfile.bannedPhrases)}
- 선호 문서 구조: ${inlineList(companyProfile.documentFormats)}

분야 기준:
- 분야: ${domainProfile.name}
- 설명: ${domainProfile.description}
- 프롬프트 규칙:
${list(domainProfile.promptRules)}
- 추천 출력 형식:
${list(domainProfile.outputFormats)}
- 품질 체크리스트:
${list(domainProfile.qualityChecklist)}
- 리스크:
${list(domainProfile.riskNotes)}

최근 피드백:
${list(priorFeedback.slice(0, 5), "아직 축적된 피드백 없음")}`;
}

function buildBasePrompt(
  request: PromptRequestInput,
  userProfile: UserProfile,
  companyProfile: CompanyProfile,
  priorFeedback: string[],
) {
  const domainProfile = getDomainProfile(request.domain);
  const languageStrategy = resolveLanguageStrategy(request);
  const outputLanguage = resolveOutputLanguage(request);
  const context = buildContextBlock(
    userProfile,
    companyProfile,
    request.domain,
    priorFeedback,
  );
  const languageRules =
    languageStrategy === "hybrid"
      ? `Language strategy:
- Use English for the role, task, constraints, reasoning instructions, output format, and quality criteria.
- Preserve Korean user context, company terms, brand tone, internal terms, and source wording where nuance matters.
- ${outputLanguageInstruction(outputLanguage)}
- Do not translate Korean brand/internal terms if translation may change their meaning.`
      : `Language strategy:
- Write the operational prompt primarily in English for model stability.
- Preserve Korean proper nouns, brand terms, internal terms, and source quotes exactly when needed.
- ${outputLanguageInstruction(outputLanguage)}
- If a Korean term has no reliable English equivalent, keep the original Korean term and explain it briefly.`;

  return `Role:
You are a senior prompt strategist who rewrites rough user requests into precise, copy-ready AI task instructions for the ${domainProfile.name} domain.

Objective:
Rewrite the user's source input into a professional prompt for "${request.goal || "professional prompt creation"}". The result must be specific enough for the selected AI tool to execute directly.

${languageRules}

Context to preserve:
${context}

Source input:
${request.rawInput}

Task instructions:
1. Interpret the user's intent, expected deliverable, hidden constraints, and likely success criteria.
2. Reflect the user profile, company profile, domain rules, and recent feedback in the rewritten prompt.
3. Include clear sections for role, objective, background, source input, instructions, constraints, output format, and quality checklist.
4. Separate missing information into explicit questions or assumptions instead of inventing facts.
5. Make the final prompt copy-ready for the target AI tool.

Constraints:
- Do not invent unverified facts, numbers, legal/medical/financial judgments, or company claims.
- Do not use company-banned phrases or expressions the user wants to avoid.
- Prioritize executable steps, decision criteria, and concrete output structure over generic advice.
- Mark uncertainty as assumptions, questions, or verification-needed items.

Required output format:
1. Final prompt
2. Reflected user/company/domain context
3. Missing information or assumptions
4. Quality checklist

Quality bar:
- The task for the target AI must be unambiguous.
- The expected output format must be concrete.
- User and company context must appear inside the actual prompt, not only in explanation.
- The structure must be reusable for repeated work.

Uncertainty handling:
Never present unknown information as fact. Use assumptions, questions, and verification-needed notes.`;
}

function applyAdapter(
  basePrompt: string,
  targetModel: TargetModel,
  languageStrategy: PromptLanguageStrategy,
  outputLanguage: PromptOutputLanguage,
) {
  const answerLanguageReminder = outputLanguageInstruction(outputLanguage);
  const languageReminder =
    languageStrategy === "hybrid"
      ? `Keep the prompt hybrid: English operational instructions and Korean context preserved where useful. ${answerLanguageReminder}`
      : `Keep the prompt primarily English, while preserving Korean proper nouns, internal terms, and source wording when translation may distort meaning. ${answerLanguageReminder}`;

  if (targetModel === "general") {
    return `${basePrompt}

Tool optimization:
This prompt is optimized for general-purpose AI tools. Focus on clear structure, constraints, and output format rather than model-specific features.

Language reminder:
${languageReminder}`;
  }

  if (targetModel === "gpt") {
    return `${basePrompt}

GPT-specific instructions:
- Structure the response in three stages: intent analysis, prompt rewrite, and improvement suggestions.
- If information is missing, ask up to five clarification questions and also provide an executable assumption-based version.
- Use tables, checklists, and step-by-step action plans when they improve clarity.
- End with editable variables so the user can quickly revise the prompt in follow-up turns.

Language reminder:
${languageReminder}`;
  }

  if (targetModel === "claude") {
    return `${basePrompt}

Claude-specific instructions:
- Assume the input may include long documents or complex context; separate source material from evaluation criteria.
- Distinguish evidence, inference, and assumptions.
- For document-style outputs, maintain clear section headings and subcriteria.
- For policies, contracts, company rules, or sensitive topics, provide review points instead of overconfident conclusions.

Language reminder:
${languageReminder}`;
  }

  if (targetModel === "codex") {
    return `${basePrompt}

Codex-specific instructions:
- Act as a senior full-stack engineer.
- Inspect the codebase structure, existing components, data flow, and style rules before editing.
- Separate implementation scope from out-of-scope work and avoid unnecessary large refactors.
- Read relevant files before making changes and follow existing patterns.
- After implementation, run practical verification such as type checks, lint, tests, build, and runtime checks.
- In the final response, summarize changed files, implementation details, verification results, and remaining risks.
- Ask for confirmation before adding external dependencies, running migrations, or making destructive changes.

Language reminder:
${languageReminder}`;
  }

  return `${basePrompt}

Gemini-specific instructions:
- Assume documents, images, tables, or long materials may be provided; separate analysis criteria by source type.
- Use tables for comparison and summaries when useful.
- Distinguish source-backed claims from inference.
- For multimodal material, separate visible facts, interpretation, and verification-needed items.
- If material is missing, list the required files, images, tables, or links.

Language reminder:
${languageReminder}`;
}

export function createPromptPackage(
  request: PromptRequestInput,
  userProfile = defaultUserProfile,
  companyProfile = defaultCompanyProfile,
  priorFeedback: string[] = [],
): PromptAsset {
  const now = new Date().toISOString();
  const computedTargetModelDecision =
    request.targetModelDecision ??
    decideTargetModels({
      rawInput: request.rawInput,
      goal: request.goal,
      domain: request.domain,
    });
  const requestModels = request.targetModels.length
    ? request.targetModels
    : computedTargetModelDecision.targetModels;
  const targetModelDecision = {
    ...computedTargetModelDecision,
    targetModels: requestModels,
  };
  const computedLanguageDecision =
    request.languageDecision ??
    decidePromptLanguageStrategy({
      rawInput: request.rawInput,
      goal: request.goal,
      domain: request.domain,
      targetModels: requestModels,
      companyProfile,
    });
  const languageStrategy =
    request.languageStrategy ?? computedLanguageDecision.strategy;
  const languageDecision = {
    ...computedLanguageDecision,
    strategy: languageStrategy,
    label: languageStrategyLabels[languageStrategy],
  };
  const outputLanguage = resolveOutputLanguage(request);
  const normalizedRequest = {
    ...request,
    targetModels: requestModels,
    targetModelDecision,
    languageStrategy,
    languageDecision,
    outputLanguage,
  };
  const basePrompt = buildBasePrompt(
    normalizedRequest,
    userProfile,
    companyProfile,
    priorFeedback,
  );
  const assumptions = buildAssumptions(
    normalizedRequest,
    userProfile,
    companyProfile,
  );
  const missingContext = buildMissingContext(normalizedRequest, companyProfile);

  const versions = requestModels.map((targetModel) => {
    const content = applyAdapter(
      basePrompt,
      targetModel,
      languageStrategy,
      outputLanguage,
    );
    const { qualityScore, scoreBreakdown } = scorePrompt(content, targetModel);

    return {
      id: makeId("version"),
      targetModel,
      modelLabel: modelLabels[targetModel],
      content,
      qualityScore,
      scoreBreakdown,
      assumptions,
      missingContext,
      createdAt: now,
    };
  });

  return {
    id: makeId("prompt"),
    title: shortTitle(request.rawInput, request.goal, request.domain),
    source: "local",
    languageStrategy,
    languageDecision,
    outputLanguage,
    rawInput: request.rawInput,
    goal: request.goal,
    domain: request.domain || "범용",
    targetModels: requestModels,
    targetModelDecision,
    versions,
    feedback: [],
    createdAt: now,
    updatedAt: now,
  };
}
