import { describe, expect, it } from "vitest";

import { decideTargetModels } from "@/lib/prompt/target-model-decision";

describe("decideTargetModels", () => {
  it("recommends codex for a coding-flavored request", () => {
    const decision = decideTargetModels({
      rawInput: "이 리포지토리의 버그를 수정하고 테스트를 실행해줘",
      goal: "버그 수정",
      domain: "개발",
    });

    expect(decision.targetModels).toContain("codex");
  });

  it("ranks codex before other models for a strong coding signal", () => {
    const decision = decideTargetModels({
      rawInput: "TypeScript 컴포넌트를 리팩터링하고 eslint, 빌드를 통과시켜줘",
      goal: "리팩터링",
      domain: "개발",
    });

    expect(decision.targetModels[0]).toBe("codex");
  });

  it("recommends claude for long-document analysis and review requests", () => {
    const decision = decideTargetModels({
      rawInput: "이 계약서를 검토하고 리스크 근거를 정리해줘",
      goal: "계약 검토",
      domain: "법률/규정",
    });

    expect(decision.targetModels).toContain("claude");
  });

  it("recommends gemini for multimodal/spreadsheet-heavy input", () => {
    const decision = decideTargetModels({
      rawInput: "이 엑셀 표와 차트 이미지를 분석해줘",
      goal: "자료 분석",
      domain: "리서치",
    });

    expect(decision.targetModels).toContain("gemini");
  });

  it("leans toward gpt for planning/content/sales structuring work", () => {
    const decision = decideTargetModels({
      rawInput: "블로그 콘텐츠 마케팅 로드맵을 기획해줘",
      goal: "콘텐츠 기획",
      domain: "마케팅",
    });

    expect(decision.targetModels).toContain("gpt");
  });

  it("falls back to the base gpt score when no domain signal is present", () => {
    const decision = decideTargetModels({
      rawInput: "그냥 아무 이야기나 해줘",
      goal: "",
      domain: "",
    });

    expect(decision.targetModels).toEqual(["gpt"]);
    expect(decision.signals).toEqual(["기본 범용 구조화"]);
  });

  it("always returns a reason, confidence, and signals shape", () => {
    const decision = decideTargetModels({
      rawInput: "API 서버의 데이터베이스 마이그레이션을 구현해줘",
      goal: "구현",
      domain: "개발",
    });

    expect(typeof decision.reason).toBe("string");
    expect(decision.reason.length).toBeGreaterThan(0);
    expect(["moderate", "strong"]).toContain(decision.confidence);
    expect(Array.isArray(decision.signals)).toBe(true);
    expect(decision.signals.length).toBeGreaterThan(0);
  });

  it("reports strong confidence when multiple distinct signals are detected", () => {
    const decision = decideTargetModels({
      rawInput: "계약서를 검토하고, 마케팅 콘텐츠 로드맵도 함께 기획해줘",
      goal: "검토 및 기획",
      domain: "",
    });

    expect(decision.signals.length).toBeGreaterThanOrEqual(2);
    expect(decision.confidence).toBe("strong");
  });

  it("lets domain alone drive the recommendation even without keyword hits", () => {
    const decision = decideTargetModels({
      rawInput: "이번 주 작업을 도와줘",
      goal: "",
      domain: "개발",
    });

    expect(decision.targetModels).toContain("codex");
    expect(decision.signals).toContain("개발/Codex 실행 신호");
  });

  it("returns at most three target models", () => {
    const decision = decideTargetModels({
      rawInput:
        "코드 버그를 수정하고, 계약서를 검토하고, 엑셀 표를 분석하고, 마케팅 콘텐츠도 기획해줘",
      goal: "복합 작업",
      domain: "",
    });

    expect(decision.targetModels.length).toBeLessThanOrEqual(3);
  });

  it("never returns duplicate target models", () => {
    const decision = decideTargetModels({
      rawInput: "코드 버그를 수정하고 테스트, 빌드, 배포까지 진행해줘",
      goal: "개발",
      domain: "개발",
    });

    expect(new Set(decision.targetModels).size).toBe(decision.targetModels.length);
  });
});
