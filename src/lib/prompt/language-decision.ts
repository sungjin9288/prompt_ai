import { languageStrategyLabels } from "./defaults";
import type {
  CompanyProfile,
  PromptLanguageDecisionMeta,
  TargetModel,
} from "./types";

export interface PromptLanguageDecisionInput {
  rawInput: string;
  goal: string;
  domain: string;
  targetModels: TargetModel[];
  companyProfile?: CompanyProfile;
}

export type PromptLanguageDecision = PromptLanguageDecisionMeta;

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0;
}

function compactList(items?: string[]) {
  return items?.join(" ") ?? "";
}

function companyContextText(companyProfile?: CompanyProfile) {
  if (!companyProfile) {
    return "";
  }

  const hasCompanySpecificContext = [
    companyProfile.companyName,
    companyProfile.description,
    compactList(companyProfile.products),
    compactList(companyProfile.customers),
    compactList(companyProfile.internalTerms),
    compactList(companyProfile.bannedPhrases),
  ].some((item) => item.trim().length > 0);

  if (!hasCompanySpecificContext) {
    return "";
  }

  return [
    companyProfile.companyName,
    companyProfile.description,
    compactList(companyProfile.products),
    compactList(companyProfile.customers),
    companyProfile.brandTone,
    compactList(companyProfile.internalTerms),
    compactList(companyProfile.bannedPhrases),
    compactList(companyProfile.documentFormats),
  ].join(" ");
}

function hasCodeSignal(text: string, targetModels: TargetModel[], domain: string) {
  const lower = text.toLowerCase();
  const codeKeywords = [
    "api",
    "bug",
    "build",
    "cli",
    "code",
    "codex",
    "component",
    "database",
    "debug",
    "deploy",
    "lint",
    "migration",
    "next.js",
    "pr",
    "react",
    "refactor",
    "repo",
    "schema",
    "test",
    "typescript",
    "개발",
    "구현",
    "디버그",
    "리팩터링",
    "버그",
    "빌드",
    "코드",
    "테스트",
  ];

  return (
    domain.includes("개발") ||
    targetModels.includes("codex") ||
    codeKeywords.some((keyword) => lower.includes(keyword))
  );
}

export function decidePromptLanguageStrategy(
  input: PromptLanguageDecisionInput,
): PromptLanguageDecision {
  const sourceText = [input.rawInput, input.goal, input.domain].join(" ");
  const companyText = companyContextText(input.companyProfile);
  const contextText = [sourceText, companyText].join(" ");
  const koreanChars = countMatches(sourceText, /[ㄱ-ㅎㅏ-ㅣ가-힣]/g);
  const englishChars = countMatches(sourceText, /[A-Za-z]/g);
  const companyKoreanChars = countMatches(companyText, /[ㄱ-ㅎㅏ-ㅣ가-힣]/g);
  const contextKoreanChars = countMatches(contextText, /[ㄱ-ㅎㅏ-ㅣ가-힣]/g);
  const codeFocused = hasCodeSignal(
    sourceText,
    input.targetModels,
    input.domain,
  );
  const mostlyEnglish = englishChars > 0 && englishChars >= koreanChars * 3;
  const koreanSourceNeedsPreservation = koreanChars >= 12;
  const companyContextNeedsPreservation = companyKoreanChars >= 8;
  const contextNeedsPreservation = contextKoreanChars >= 24;

  if (companyContextNeedsPreservation) {
    return {
      strategy: "hybrid",
      label: languageStrategyLabels.hybrid,
      reason:
        "회사명, 브랜드 톤, 내부 용어 같은 한국어 맥락을 정확히 보존해야 하므로 한영 하이브리드로 작성합니다.",
      confidence: "strong",
      signals: ["회사/브랜드 한국어 맥락 감지", "용어 보존 우선"],
    };
  }

  if (codeFocused && !contextNeedsPreservation) {
    return {
      strategy: "english",
      label: languageStrategyLabels.english,
      reason:
        "개발 또는 Codex 중심 작업은 실행 지시, 제약, 검증 단계를 영어로 고정하는 편이 안정적입니다.",
      confidence: mostlyEnglish ? "strong" : "moderate",
      signals: ["개발/Codex 작업 신호", "실행 지시 안정성 우선"],
    };
  }

  if (mostlyEnglish && !koreanSourceNeedsPreservation) {
    return {
      strategy: "english",
      label: languageStrategyLabels.english,
      reason:
        "원문이 영어 중심이고 별도 한국어 맥락 보존 필요성이 낮아 전체 영어 지시문으로 작성합니다.",
      confidence: englishChars >= 12 ? "strong" : "moderate",
      signals: ["영어 중심 원문", "한국어 맥락 낮음"],
    };
  }

  if (koreanSourceNeedsPreservation || contextNeedsPreservation) {
    return {
      strategy: "hybrid",
      label: languageStrategyLabels.hybrid,
      reason:
        "사용자 원문과 업무 맥락의 한국어 의미가 결과 품질에 중요하므로, 지시 구조는 영어로 안정화하고 맥락은 한국어로 보존합니다.",
      confidence: "strong",
      signals: ["한국어 원문/업무 맥락 감지", "의미 보존 우선"],
    };
  }

  return {
    strategy: "hybrid",
    label: languageStrategyLabels.hybrid,
    reason:
      "명확한 영어 중심 작업 신호가 부족하므로 기본적으로 영어 지시 구조와 한국어 맥락 보존을 함께 적용합니다.",
    confidence: "moderate",
    signals: ["기본 안정 전략", "맥락 손실 방지"],
  };
}
