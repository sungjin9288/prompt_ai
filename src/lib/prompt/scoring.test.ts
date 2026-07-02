import { describe, expect, it } from "vitest";

import { scorePrompt } from "@/lib/prompt/scoring";

const wellStructuredEnglishPrompt = `
Role: Senior product analyst
Objective: Summarize the quarterly report for the leadership team
Background: User context: internal analyst. Company context: SaaS company profile.
Task instructions:
1. Read the source documents.
2. Extract the key metrics.
3. Draft the summary.
Constraints: Do not invent numbers. Mark every assumption explicitly.
Required output format: A structured document with headings and a table.
Quality checklist: Domain criteria, quality bar, review criteria must all be checked.
Source input: paste the quarterly figures here.
Editable variables: [quarter], [team name]
`;

const wellStructuredKoreanPrompt = `
역할: 시니어 제품 분석가
목표: 분기 보고서를 경영진용으로 요약한다
배경: 사용자 맥락과 회사 맥락을 모두 반영해야 한다. 분야 기준도 함께 고려한다.
작업 지시:
1. 원본 문서를 읽는다.
2. 핵심 지표를 추출한다.
3. 요약본을 작성한다.
제약 조건: 임의로 만들지 않는다. 가정은 명시적으로 표기한다.
출력 형식: 표와 섹션으로 구성된 문서.
품질 기준: 분야 기준, 품질 기준, 체크리스트를 모두 확인한다.
입력: 분기 수치를 여기에 붙여넣는다.
[변수], editable variables
`;

describe("scorePrompt", () => {
  it("returns a score in the 1-5 range for an empty prompt", () => {
    const { qualityScore } = scorePrompt("", "general");

    expect(qualityScore).toBeGreaterThanOrEqual(1);
    expect(qualityScore).toBeLessThanOrEqual(5);
  });

  it("gives every breakdown dimension a minimum score of 1 for empty input", () => {
    const { scoreBreakdown } = scorePrompt("", "general");

    for (const value of Object.values(scoreBreakdown)) {
      expect(value).toBeGreaterThanOrEqual(1);
    }
  });

  it("scores a well-structured English prompt higher than an empty prompt", () => {
    const empty = scorePrompt("", "general").qualityScore;
    const structured = scorePrompt(wellStructuredEnglishPrompt, "general").qualityScore;

    expect(structured).toBeGreaterThan(empty);
  });

  it("scores a well-structured Korean prompt higher than an empty prompt", () => {
    const empty = scorePrompt("", "general").qualityScore;
    const structured = scorePrompt(wellStructuredKoreanPrompt, "general").qualityScore;

    expect(structured).toBeGreaterThan(empty);
  });

  it("caps context score at 3 when 3+ unresolved company placeholders remain", () => {
    const content = `
      사용자 맥락 회사 맥락 분야 기준
      회사명: 미지정
      제품/서비스: 미지정
      고객군: 미지정
    `;
    const { scoreBreakdown } = scorePrompt(content, "general");

    expect(scoreBreakdown.context).toBeLessThanOrEqual(3);
  });

  it("does not cap context score when no placeholders are present", () => {
    const content = "사용자 맥락, 회사 맥락, 분야 기준을 모두 포함한 프롬프트입니다.";
    const { scoreBreakdown } = scorePrompt(content, "general");

    expect(scoreBreakdown.context).toBe(5);
  });

  it("rewards codex-specific signals for modelFit when targetModel is codex", () => {
    const codexContent = "코드베이스를 분석하고 테스트를 실행해 검증한다.";
    const genericContent = "일반적인 업무 요청입니다.";

    const codexScore = scorePrompt(codexContent, "codex").scoreBreakdown.modelFit;
    const genericScore = scorePrompt(genericContent, "codex").scoreBreakdown.modelFit;

    expect(codexScore).toBeGreaterThan(genericScore);
  });

  it("gives a flat modelFit score of 4 for the general target model regardless of content", () => {
    const withKeywords = scorePrompt(
      "코드베이스 검증 테스트",
      "general",
    ).scoreBreakdown.modelFit;
    const withoutKeywords = scorePrompt("아무 내용", "general").scoreBreakdown.modelFit;

    expect(withKeywords).toBe(4);
    expect(withoutKeywords).toBe(4);
  });

  it("computes qualityScore as the rounded average of the breakdown values", () => {
    const { qualityScore, scoreBreakdown } = scorePrompt(
      wellStructuredEnglishPrompt,
      "claude",
    );
    const values = Object.values(scoreBreakdown);
    const expectedAverage =
      Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) /
      10;

    expect(qualityScore).toBe(expectedAverage);
  });

  it("keeps every breakdown score within the 1-5 bound for a rich prompt", () => {
    const { scoreBreakdown } = scorePrompt(wellStructuredEnglishPrompt, "gemini");

    for (const value of Object.values(scoreBreakdown)) {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(5);
    }
  });
});
