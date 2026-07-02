import { describe, expect, it } from "vitest";

import { createPromptPackage } from "@/lib/prompt/generate";
import { defaultCompanyProfile, defaultUserProfile } from "@/lib/prompt/defaults";
import type { PromptRequestInput } from "@/lib/prompt/types";

const baseRequest: PromptRequestInput = {
  rawInput: "신규 기능에 대한 사용자 온보딩 이메일 초안을 작성해줘",
  goal: "온보딩 이메일 작성",
  domain: "마케팅",
  targetModels: ["gpt", "claude", "codex", "gemini"],
};

describe("createPromptPackage", () => {
  it("creates one version per requested target model", () => {
    const asset = createPromptPackage(baseRequest);

    expect(asset.versions).toHaveLength(4);
    expect(asset.versions.map((version) => version.targetModel)).toEqual([
      "gpt",
      "claude",
      "codex",
      "gemini",
    ]);
  });

  it("includes the core prompt sections in every generated version", () => {
    const asset = createPromptPackage(baseRequest);

    for (const version of asset.versions) {
      expect(version.content).toContain("Role:");
      expect(version.content).toContain("Objective:");
      expect(version.content).toContain("Context to preserve:");
      expect(version.content).toContain("Source input:");
      expect(version.content).toContain("Task instructions:");
      expect(version.content).toContain("Constraints:");
      expect(version.content).toContain("Required output format:");
    }
  });

  it("embeds the raw user input verbatim in the source input section", () => {
    const asset = createPromptPackage(baseRequest);

    expect(asset.versions[0].content).toContain(baseRequest.rawInput);
  });

  it("adds GPT-specific instructions only for the gpt version", () => {
    const asset = createPromptPackage(baseRequest);
    const gptVersion = asset.versions.find((version) => version.targetModel === "gpt");
    const claudeVersion = asset.versions.find(
      (version) => version.targetModel === "claude",
    );

    expect(gptVersion?.content).toContain("GPT-specific instructions:");
    expect(claudeVersion?.content).not.toContain("GPT-specific instructions:");
  });

  it("adds Claude-specific instructions only for the claude version", () => {
    const asset = createPromptPackage(baseRequest);
    const claudeVersion = asset.versions.find(
      (version) => version.targetModel === "claude",
    );
    const gptVersion = asset.versions.find((version) => version.targetModel === "gpt");

    expect(claudeVersion?.content).toContain("Claude-specific instructions:");
    expect(gptVersion?.content).not.toContain("Claude-specific instructions:");
  });

  it("adds Codex-specific engineering instructions only for the codex version", () => {
    const asset = createPromptPackage(baseRequest);
    const codexVersion = asset.versions.find(
      (version) => version.targetModel === "codex",
    );

    expect(codexVersion?.content).toContain("Codex-specific instructions:");
    expect(codexVersion?.content).toContain("senior full-stack engineer");
  });

  it("adds Gemini-specific multimodal instructions only for the gemini version", () => {
    const asset = createPromptPackage(baseRequest);
    const geminiVersion = asset.versions.find(
      (version) => version.targetModel === "gemini",
    );

    expect(geminiVersion?.content).toContain("Gemini-specific instructions:");
    expect(geminiVersion?.content).toContain("multimodal");
  });

  it("uses a general-purpose tool optimization note for the general target model", () => {
    const asset = createPromptPackage({ ...baseRequest, targetModels: ["general"] });

    expect(asset.versions[0].content).toContain(
      "This prompt is optimized for general-purpose AI tools.",
    );
  });

  it("directs the target AI's final answer language according to outputLanguage", () => {
    const englishAsset = createPromptPackage({
      ...baseRequest,
      targetModels: ["general"],
      outputLanguage: "english",
    });
    const koreanAsset = createPromptPackage({
      ...baseRequest,
      targetModels: ["general"],
      outputLanguage: "korean",
    });

    expect(englishAsset.versions[0].content).toContain(
      "final answer must be written in English",
    );
    expect(koreanAsset.versions[0].content).toContain(
      "final answer must be written in Korean",
    );
  });

  it("defaults outputLanguage to korean when not provided", () => {
    const asset = createPromptPackage({ ...baseRequest, targetModels: ["general"] });

    expect(asset.outputLanguage).toBe("korean");
  });

  it("applies hybrid language strategy instructions by default", () => {
    const asset = createPromptPackage({ ...baseRequest, targetModels: ["general"] });

    expect(asset.languageStrategy).toBe("hybrid");
    expect(asset.versions[0].content).toContain(
      "Preserve Korean user context, company terms, brand tone, internal terms, and source wording",
    );
  });

  it("applies english-only language strategy instructions when requested", () => {
    const asset = createPromptPackage({
      ...baseRequest,
      targetModels: ["general"],
      languageStrategy: "english",
    });

    expect(asset.versions[0].content).toContain(
      "Write the operational prompt primarily in English for model stability.",
    );
  });

  it("reflects the company profile fields inside the generated context block", () => {
    const asset = createPromptPackage(
      baseRequest,
      defaultUserProfile,
      {
        ...defaultCompanyProfile,
        companyName: "Acme Corp",
        description: "B2B SaaS platform",
      },
    );

    expect(asset.versions[0].content).toContain("Acme Corp");
    expect(asset.versions[0].content).toContain("B2B SaaS platform");
  });

  it("auto-decides target models when none are provided in the request", () => {
    const asset = createPromptPackage({
      ...baseRequest,
      targetModels: [],
      rawInput: "이 리포지토리의 버그를 수정하고 테스트를 실행해줘",
      domain: "개발",
    });

    expect(asset.targetModels.length).toBeGreaterThan(0);
    expect(asset.targetModelDecision.targetModels).toEqual(asset.targetModels);
  });

  it("falls back to 범용 as the domain when none is provided", () => {
    const asset = createPromptPackage({ ...baseRequest, domain: "" });

    expect(asset.domain).toBe("범용");
  });

  it("records a missing-context item when the raw input is very short", () => {
    const asset = createPromptPackage({
      ...baseRequest,
      rawInput: "이메일 초안",
    });

    expect(asset.versions[0].missingContext.length).toBeGreaterThan(0);
  });

  it("assigns a unique id and createdAt timestamp to each version", () => {
    const asset = createPromptPackage(baseRequest);
    const ids = asset.versions.map((version) => version.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const version of asset.versions) {
      expect(() => new Date(version.createdAt).toISOString()).not.toThrow();
    }
  });
});
