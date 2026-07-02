import { describe, expect, it } from "vitest";

import { analyzePromptInputReadiness } from "@/lib/prompt/input-analysis";

describe("analyzePromptInputReadiness", () => {
  it("scores the floor (5 points per missing item = 20) and reports missing status for fully empty input", () => {
    const analysis = analyzePromptInputReadiness({
      domain: "",
      goal: "",
      rawInput: "",
    });

    // Every item defaults to "missing" (5 pts) rather than 0, since getItemScore
    // never returns 0 - the floor for 4 missing items is 20, not 0.
    expect(analysis.score).toBe(20);
    expect(analysis.status).toBe("missing");
    expect(analysis.statusLabel).toBe("보강 필요");
  });

  it("marks every readiness item as missing when there is no input at all", () => {
    const analysis = analyzePromptInputReadiness({
      domain: "",
      goal: "",
      rawInput: "",
    });

    for (const item of analysis.items) {
      expect(item.status).toBe("missing");
    }
  });

  it("caps the score at 100 for the four readiness items (25 points each)", () => {
    const analysis = analyzePromptInputReadiness({
      domain: "마케팅",
      goal: "제품 소개 문서를 작성한다",
      rawInput:
        "마케팅팀 대상 사용자를 위한 신규 제품 소개 문서를 표 형식으로 작성해줘. 반드시 금지 표현 없이 400자 이내로 정리하고, 고객 후기와 회사 배경을 함께 담아줘. 체크리스트 형태의 검증 기준도 함께 제공해줘.",
    });

    expect(analysis.score).toBeLessThanOrEqual(100);
    expect(analysis.score).toBe(100);
    expect(analysis.status).toBe("ready");
  });

  it("marks intent ready when a goal is present even without intent-signal keywords", () => {
    const analysis = analyzePromptInputReadiness({
      domain: "",
      goal: "Ship the release notes",
      rawInput: "Some short text without explicit action verbs",
    });

    const intentItem = analysis.items.find((item) => item.label === "목적");

    expect(intentItem?.status).toBe("ready");
  });

  it("marks intent missing when there is no goal and no intent-signal keyword", () => {
    const analysis = analyzePromptInputReadiness({
      domain: "",
      goal: "",
      rawInput: "random unrelated text with no clear action",
    });

    const intentItem = analysis.items.find((item) => item.label === "목적");

    expect(intentItem?.status).not.toBe("ready");
  });

  it("marks context ready when input is long enough on its own (>= 180 chars)", () => {
    const longInput = "배경 설명 없이 아주 긴 텍스트만 반복합니다. ".repeat(10);
    const analysis = analyzePromptInputReadiness({
      domain: "",
      goal: "",
      rawInput: longInput,
    });

    const contextItem = analysis.items.find((item) => item.label === "맥락");

    expect(longInput.length).toBeGreaterThanOrEqual(180);
    expect(contextItem?.status).toBe("ready");
  });

  it("marks constraints ready only when a constraint signal keyword is present", () => {
    const withConstraint = analyzePromptInputReadiness({
      domain: "",
      goal: "",
      rawInput: "이 작업은 반드시 정중한 톤을 지켜야 한다",
    });
    const withoutConstraint = analyzePromptInputReadiness({
      domain: "",
      goal: "",
      rawInput: "이 작업에 대한 정보가 여기 없습니다 그냥 평범한 문장입니다",
    });

    const withItem = withConstraint.items.find((item) => item.label === "제약");
    const withoutItem = withoutConstraint.items.find((item) => item.label === "제약");

    expect(withItem?.status).toBe("ready");
    expect(withoutItem?.status).not.toBe("ready");
  });

  it("marks output ready when a goal is present even without an output-format keyword", () => {
    const analysis = analyzePromptInputReadiness({
      domain: "",
      goal: "Write the summary",
      rawInput: "Just some plain text",
    });

    const outputItem = analysis.items.find((item) => item.label === "출력");

    expect(outputItem?.status).toBe("ready");
  });

  it("produces missing-question prompts only for non-ready items, capped at 4", () => {
    const analysis = analyzePromptInputReadiness({
      domain: "",
      goal: "",
      rawInput: "",
    });

    expect(analysis.missingQuestions.length).toBeLessThanOrEqual(4);
    expect(analysis.missingQuestions.length).toBeGreaterThan(0);
  });

  it("returns no missing questions when every item is ready", () => {
    const analysis = analyzePromptInputReadiness({
      domain: "마케팅",
      goal: "제품 소개 문서를 작성한다",
      rawInput:
        "마케팅팀 대상 사용자를 위한 신규 제품 소개 문서를 표 형식으로 작성해줘. 반드시 금지 표현 없이 400자 이내로 정리하고, 고객 후기와 회사 배경을 함께 담아줘. 체크리스트 형태의 검증 기준도 함께 제공해줘.",
    });

    expect(analysis.missingQuestions).toHaveLength(0);
  });

  it("stays at review status when score is 80+ but not every item is individually ready", () => {
    const analysis = analyzePromptInputReadiness({
      domain: "",
      goal: "Write something",
      rawInput: "Plain text with a table request but no explicit tone constraint",
    });
    const contextItem = analysis.items.find((item) => item.label === "맥락");

    // Score reaches the 80-point ready threshold, but the "맥락" (context) item
    // is still "missing" - the overall status requires every item to be ready,
    // not just the aggregate score, so it stays at "review".
    expect(analysis.score).toBeGreaterThanOrEqual(80);
    expect(contextItem?.status).toBe("missing");
    expect(analysis.status).toBe("review");
  });

  it("parses reinforcement answers appended after the augmentation-question marker", () => {
    const withAnswers = analyzePromptInputReadiness({
      domain: "",
      goal: "",
      rawInput: [
        "짧은 초기 입력",
        "추가로 답할 보강 질문:",
        "1. 목적이 무엇인가요?",
        "답: 반드시 지켜야 할 톤은 정중함이며 표 형식으로 출력해줘.",
      ].join("\n"),
    });

    const constraintItem = withAnswers.items.find((item) => item.label === "제약");
    const outputItem = withAnswers.items.find((item) => item.label === "출력");

    expect(constraintItem?.status).toBe("ready");
    expect(outputItem?.status).toBe("ready");
  });
});
