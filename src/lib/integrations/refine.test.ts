import { describe, expect, it } from "vitest";

import {
  createIntegrationRefineResponse,
  parseIntegrationRefineRequest,
} from "@/lib/integrations/refine";

describe("parseIntegrationRefineRequest", () => {
  it("errors when rawInput is missing from both the top level and nested request", () => {
    const result = parseIntegrationRefineRequest({ goal: "목표" });

    expect(result.error).toBe("rawInput is required");
    expect(result.value).toBeUndefined();
  });

  it("errors when the body is not an object at all", () => {
    const result = parseIntegrationRefineRequest("not-an-object");

    expect(result.error).toBe("rawInput is required");
  });

  it("prefers a nested request.rawInput over a top-level rawInput", () => {
    const result = parseIntegrationRefineRequest({
      rawInput: "top level",
      request: { rawInput: "nested value" },
    });

    expect(result.value?.request.rawInput).toBe("nested value");
  });

  it("falls back to the top-level rawInput when there is no nested request", () => {
    const result = parseIntegrationRefineRequest({ rawInput: "  hello world  " });

    expect(result.value?.request.rawInput).toBe("hello world");
  });

  it("defaults goal and domain to their Korean fallbacks when absent", () => {
    const result = parseIntegrationRefineRequest({ rawInput: "input" });

    expect(result.value?.request.goal).toBe("전문 프롬프트로 변환");
    expect(result.value?.request.domain).toBe("범용");
  });

  it("normalizes a known source app to lowercase", () => {
    const result = parseIntegrationRefineRequest({ rawInput: "input", sourceApp: "Chrome" });

    expect(result.value?.sourceApp).toBe("chrome");
  });

  it("falls back to 'unknown' for an unrecognized source app", () => {
    const result = parseIntegrationRefineRequest({ rawInput: "input", sourceApp: "carrier-pigeon" });

    expect(result.value?.sourceApp).toBe("unknown");
  });

  it("maps target model aliases like 'chatgpt' and 'openai' to 'gpt'", () => {
    const result = parseIntegrationRefineRequest({
      rawInput: "input",
      targetModels: ["chatgpt", "openai", "claude"],
    });

    expect(result.value?.request.targetModels.sort()).toEqual(["claude", "gpt"].sort());
  });

  it("deduplicates target models after alias resolution", () => {
    const result = parseIntegrationRefineRequest({
      rawInput: "input",
      targetModels: ["chatgpt", "gpt", "openai"],
    });

    expect(result.value?.request.targetModels).toEqual(["gpt"]);
  });

  it("drops the 'auto' alias and unknown target models entirely", () => {
    const result = parseIntegrationRefineRequest({
      rawInput: "input",
      targetModels: ["auto", "some-unknown-model", "codex"],
    });

    expect(result.value?.request.targetModels).toEqual(["codex"]);
  });

  it("accepts a single non-array target model value", () => {
    const result = parseIntegrationRefineRequest({ rawInput: "input", targetModels: "gemini" });

    expect(result.value?.request.targetModels).toEqual(["gemini"]);
  });

  it("prefers request-level targetModels over payload-level targetModels when non-empty", () => {
    const result = parseIntegrationRefineRequest({
      rawInput: "input",
      targetModels: ["gemini"],
      request: { targetModels: ["codex"] },
    });

    expect(result.value?.request.targetModels).toEqual(["codex"]);
  });

  it("falls back to payload-level targetModels when the nested request has none", () => {
    const result = parseIntegrationRefineRequest({
      rawInput: "input",
      targetModels: ["gemini"],
      request: {},
    });

    expect(result.value?.request.targetModels).toEqual(["gemini"]);
  });

  it("accepts targetAI as an alias field for targetModels", () => {
    const result = parseIntegrationRefineRequest({ rawInput: "input", targetAI: ["claude"] });

    expect(result.value?.request.targetModels).toEqual(["claude"]);
  });

  it("normalizes a valid outputLanguage and drops an invalid one", () => {
    const valid = parseIntegrationRefineRequest({ rawInput: "input", outputLanguage: "english" });
    const invalid = parseIntegrationRefineRequest({ rawInput: "input", outputLanguage: "french" });

    expect(valid.value?.request.outputLanguage).toBe("english");
    expect(invalid.value?.request.outputLanguage).toBeUndefined();
  });

  it("trims and filters priorFeedback entries, dropping non-string values", () => {
    const result = parseIntegrationRefineRequest({
      rawInput: "input",
      priorFeedback: ["  keep this  ", "", 42, "also keep"],
    });

    expect(result.value?.priorFeedback).toEqual(["keep this", "also keep"]);
  });

  it("always sets deliveryMode to review_required regardless of input", () => {
    const result = parseIntegrationRefineRequest({ rawInput: "input", deliveryMode: "instant" });

    expect(result.value?.deliveryMode).toBe("review_required");
  });

  it("trims sourceUrl and treats an empty string as undefined", () => {
    const withUrl = parseIntegrationRefineRequest({
      rawInput: "input",
      sourceUrl: "  https://example.com  ",
    });
    const withoutUrl = parseIntegrationRefineRequest({ rawInput: "input", sourceUrl: "   " });

    expect(withUrl.value?.sourceUrl).toBe("https://example.com");
    expect(withoutUrl.value?.sourceUrl).toBeUndefined();
  });
});

describe("createIntegrationRefineResponse", () => {
  it("marks the audit as review_required with the given sourceApp and tool name", () => {
    const response = createIntegrationRefineResponse({
      deliveryMode: "review_required",
      priorFeedback: [],
      request: {
        rawInput: "고객 지원 문서를 작성해줘",
        goal: "고객 지원 문서 작성",
        domain: "고객지원",
        targetModels: ["general"],
      },
      sourceApp: "chrome",
      sourceUrl: "https://example.com/page",
    });

    expect(response.audit.reviewRequired).toBe(true);
    expect(response.audit.tool).toBe("refine_prompt");
    expect(response.audit.sourceApp).toBe("chrome");
    expect(response.audit.sourceUrl).toBe("https://example.com/page");
  });

  it("builds one handoff package per generated prompt version", () => {
    const response = createIntegrationRefineResponse({
      deliveryMode: "review_required",
      priorFeedback: [],
      request: {
        rawInput: "고객 지원 문서를 작성해줘",
        goal: "고객 지원 문서 작성",
        domain: "고객지원",
        targetModels: ["general", "gpt"],
      },
      sourceApp: "web",
    });

    expect(response.handoffPackages).toHaveLength(response.promptPackage.versions.length);
    expect(response.handoffPackages.length).toBeGreaterThan(0);
    response.handoffPackages.forEach((handoffPackage) => {
      expect(typeof handoffPackage.handoffText).toBe("string");
      expect(handoffPackage.handoffText.length).toBeGreaterThan(0);
      expect(handoffPackage.qualityScore).toBeGreaterThanOrEqual(0);
    });
  });

  it("falls back to the default user and company profiles when none are supplied", () => {
    const response = createIntegrationRefineResponse({
      deliveryMode: "review_required",
      priorFeedback: [],
      request: {
        rawInput: "새 기능 기획서를 작성해줘",
        goal: "기획서 작성",
        domain: "기획",
        targetModels: ["general"],
      },
      sourceApp: "mcp",
    });

    expect(response.promptPackage.rawInput).toBe("새 기능 기획서를 작성해줘");
    expect(response.promptPackage.versions.length).toBeGreaterThan(0);
  });
});
