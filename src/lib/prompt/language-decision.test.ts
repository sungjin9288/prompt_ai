import { describe, expect, it } from "vitest";

import { decidePromptLanguageStrategy } from "@/lib/prompt/language-decision";

describe("decidePromptLanguageStrategy", () => {
  it("chooses hybrid for a long Korean-only prompt needing meaning preservation", () => {
    const decision = decidePromptLanguageStrategy({
      rawInput:
        "우리 회사 고객 지원팀을 위한 안내 문서를 작성해줘. 신규 고객이 자주 묻는 질문에 답하는 문서가 필요해.",
      goal: "고객 지원 문서 작성",
      domain: "고객지원",
      targetModels: ["general"],
    });

    expect(decision.strategy).toBe("hybrid");
    expect(decision.confidence).toBe("strong");
    expect(Array.isArray(decision.signals)).toBe(true);
    expect(decision.signals.length).toBeGreaterThan(0);
    expect(typeof decision.reason).toBe("string");
    expect(decision.reason.length).toBeGreaterThan(0);
  });

  it("chooses english for a mostly-English prompt with little Korean context", () => {
    const decision = decidePromptLanguageStrategy({
      rawInput:
        "Write a marketing email for our new product launch targeting enterprise customers in the US market",
      goal: "Draft a marketing email",
      domain: "marketing",
      targetModels: ["general"],
    });

    expect(decision.strategy).toBe("english");
    expect(decision.confidence).toBe("strong");
  });

  it("chooses english for a code-focused prompt even with a Korean domain label", () => {
    const decision = decidePromptLanguageStrategy({
      rawInput: "Refactor this React component and add tests for the API integration.",
      goal: "Improve code quality",
      domain: "개발",
      targetModels: ["general"],
    });

    expect(decision.strategy).toBe("english");
  });

  it("targets codex model implies code-focused english strategy even without code keywords", () => {
    const decision = decidePromptLanguageStrategy({
      rawInput: "Please help with this task.",
      goal: "Finish the task",
      domain: "general",
      targetModels: ["codex"],
    });

    expect(decision.strategy).toBe("english");
  });

  it("switches to hybrid when company profile carries meaningful Korean context", () => {
    const decision = decidePromptLanguageStrategy({
      rawInput: "Write a product announcement email",
      goal: "Announce the launch",
      domain: "marketing",
      targetModels: ["general"],
      companyProfile: {
        id: "company-1",
        companyName: "프롬프트에이아이스튜디오",
        description: "국내 중소기업을 위한 인공지능 프롬프트 제작 서비스입니다.",
        products: ["프롬프트 스튜디오"],
        customers: ["스타트업 마케터"],
        brandTone: "친근하고 신뢰감 있는 톤",
        internalTerms: ["스튜디오 초안"],
        bannedPhrases: ["절대", "무조건"],
        documentFormats: ["보고서"],
      },
    });

    expect(decision.strategy).toBe("hybrid");
    expect(decision.confidence).toBe("strong");
  });

  it("ignores an empty company profile when deciding strategy", () => {
    const withEmptyProfile = decidePromptLanguageStrategy({
      rawInput: "Write a marketing email for our new product launch to enterprise buyers",
      goal: "Draft a marketing email",
      domain: "marketing",
      targetModels: ["general"],
      companyProfile: {
        id: "company-1",
        companyName: "",
        description: "",
        products: [],
        customers: [],
        brandTone: "",
        internalTerms: [],
        bannedPhrases: [],
        documentFormats: [],
      },
    });
    const withoutProfile = decidePromptLanguageStrategy({
      rawInput: "Write a marketing email for our new product launch to enterprise buyers",
      goal: "Draft a marketing email",
      domain: "marketing",
      targetModels: ["general"],
    });

    expect(withEmptyProfile.strategy).toBe(withoutProfile.strategy);
  });

  it("falls back to a moderate-confidence hybrid default when there is no clear language signal", () => {
    // No Korean or English letters at all (digits only), so none of the
    // english/korean/code-focused branches match and the base fallback applies.
    const decision = decidePromptLanguageStrategy({
      rawInput: "123 456",
      goal: "",
      domain: "",
      targetModels: ["general"],
    });

    expect(decision.strategy).toBe("hybrid");
    expect(decision.confidence).toBe("moderate");
  });

  it("keeps very short English-only input as english strategy with only moderate confidence", () => {
    // "Hi" satisfies the mostlyEnglish check (koreanChars = 0), so the
    // strategy stays "english", but with fewer than 12 English characters
    // there is not enough signal to claim strong confidence.
    const decision = decidePromptLanguageStrategy({
      rawInput: "Hi",
      goal: "",
      domain: "",
      targetModels: ["general"],
    });

    expect(decision.strategy).toBe("english");
    expect(decision.confidence).toBe("moderate");
  });

  it("returns a label consistent with the strategy", () => {
    const decision = decidePromptLanguageStrategy({
      rawInput: "Write a marketing email for our new product launch to enterprise buyers",
      goal: "Draft a marketing email",
      domain: "marketing",
      targetModels: ["general"],
    });

    expect(decision.label).toBeTruthy();
    expect(typeof decision.label).toBe("string");
  });
});
