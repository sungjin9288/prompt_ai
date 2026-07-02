import { describe, expect, it } from "vitest";

import {
  buildTargetAiHandoffImprovementBriefText,
  buildTargetAiHandoffPackageText,
  buildTargetAiHandoffReadinessItems,
} from "@/lib/prompt/handoff-package";
import type { PromptAsset, PromptScoreBreakdown, PromptVersion } from "@/lib/prompt/types";

function makeScoreBreakdown(
  overrides: Partial<PromptScoreBreakdown> = {},
): PromptScoreBreakdown {
  return {
    clarity: 4.5,
    context: 4.5,
    outputFormat: 4.5,
    constraints: 4.5,
    expertise: 4.5,
    modelFit: 4.5,
    reusability: 4.5,
    ...overrides,
  };
}

function makeVersion(overrides: Partial<PromptVersion> = {}): PromptVersion {
  return {
    id: "version-1",
    targetModel: "claude",
    modelLabel: "Claude",
    content:
      "Role: Senior analyst\nObjective: Summarize the quarterly report for the leadership team\nConstraints: Do not invent numbers. Mark every assumption explicitly.\nRequired output format: A structured document with headings.",
    qualityScore: 4.6,
    scoreBreakdown: makeScoreBreakdown(),
    assumptions: [],
    missingContext: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makePrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  const version = overrides.versions?.[0] ?? makeVersion();

  return {
    id: "prompt-1",
    title: "분기 보고서 요약",
    source: "local",
    languageStrategy: "hybrid",
    outputLanguage: "korean",
    rawInput: "분기 보고서를 요약해줘",
    goal: "보고서 요약",
    domain: "리서치",
    targetModels: ["claude"],
    versions: [version],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildTargetAiHandoffReadinessItems", () => {
  it("marks every item ready for a strong, complete prompt version", () => {
    const version = makeVersion();
    const items = buildTargetAiHandoffReadinessItems({ version });

    expect(items.every((item) => item.status === "ready")).toBe(true);
  });

  it("marks the prompt body item as review when the content is short", () => {
    const version = makeVersion({ content: "짧은 프롬프트" });
    const items = buildTargetAiHandoffReadinessItems({ version });
    const bodyItem = items.find((item) => item.label === "실행 프롬프트 본문");

    expect(bodyItem?.status).toBe("review");
  });

  it("marks the overall quality score item as blocked below the 3.5 threshold", () => {
    const version = makeVersion({ qualityScore: 3.0 });
    const items = buildTargetAiHandoffReadinessItems({ version });
    const scoreItem = items.find((item) => item.label === "전체 품질 점수");

    expect(scoreItem?.status).toBe("blocked");
  });

  it("marks the overall quality score item as review between 3.5 and 4.2", () => {
    const version = makeVersion({ qualityScore: 3.8 });
    const items = buildTargetAiHandoffReadinessItems({ version });
    const scoreItem = items.find((item) => item.label === "전체 품질 점수");

    expect(scoreItem?.status).toBe("review");
  });

  it("flags missing context as blocked once more than two items are missing", () => {
    const version = makeVersion({
      missingContext: ["a", "b", "c"],
    });
    const items = buildTargetAiHandoffReadinessItems({ version });
    const contextItem = items.find((item) => item.label === "필수 맥락");

    expect(contextItem?.status).toBe("blocked");
  });

  it("flags missing context as review for one or two missing items", () => {
    const version = makeVersion({ missingContext: ["a"] });
    const items = buildTargetAiHandoffReadinessItems({ version });
    const contextItem = items.find((item) => item.label === "필수 맥락");

    expect(contextItem?.status).toBe("review");
  });

  it("flags assumption review as blocked once more than two assumptions are present", () => {
    const version = makeVersion({ assumptions: ["a", "b", "c"] });
    const items = buildTargetAiHandoffReadinessItems({ version });
    const assumptionItem = items.find((item) => item.label === "가정 검토");

    expect(assumptionItem?.status).toBe("blocked");
  });

  it("flags weak sub-scores as blocked when any dimension is below 3.5", () => {
    const version = makeVersion({
      scoreBreakdown: makeScoreBreakdown({ clarity: 3.0 }),
    });
    const items = buildTargetAiHandoffReadinessItems({ version });
    const weakItem = items.find((item) => item.label === "하위 품질 항목");

    expect(weakItem?.status).toBe("blocked");
  });
});

describe("buildTargetAiHandoffImprovementBriefText", () => {
  it("lists only non-ready findings when at least one exists", () => {
    const version = makeVersion({ qualityScore: 3.0 });
    const prompt = makePrompt({ versions: [version] });
    const text = buildTargetAiHandoffImprovementBriefText({ prompt, version });

    expect(text).toContain("전체 품질 점수");
    expect(text).not.toContain("1. 실행 프롬프트 본문");
  });

  it("falls back to listing all readiness items when everything is ready", () => {
    const version = makeVersion();
    const prompt = makePrompt({ versions: [version] });
    const text = buildTargetAiHandoffImprovementBriefText({ prompt, version });

    expect(text).toContain("실행 프롬프트 본문");
    expect(text).toContain("전체 품질 점수");
  });

  it("includes prompt title, domain, and goal in the brief context", () => {
    const version = makeVersion();
    const prompt = makePrompt({ versions: [version] });
    const text = buildTargetAiHandoffImprovementBriefText({ prompt, version });

    expect(text).toContain(prompt.title);
    expect(text).toContain(prompt.domain);
    expect(text).toContain(prompt.goal);
  });

  it("notes when no assumptions or missing context are recorded", () => {
    const version = makeVersion({ assumptions: [], missingContext: [] });
    const prompt = makePrompt({ versions: [version] });
    const text = buildTargetAiHandoffImprovementBriefText({ prompt, version });

    expect(text).toContain("No explicit assumptions recorded.");
    expect(text).toContain("No required missing context recorded.");
  });
});

describe("buildTargetAiHandoffPackageText", () => {
  it("includes the copy-ready prompt content verbatim", () => {
    const version = makeVersion();
    const prompt = makePrompt({ versions: [version] });
    const text = buildTargetAiHandoffPackageText({ prompt, version });

    expect(text).toContain(version.content);
  });

  it("includes the preflight checklist and quality score in the metadata section", () => {
    const version = makeVersion();
    const prompt = makePrompt({ versions: [version] });
    const text = buildTargetAiHandoffPackageText({ prompt, version });

    expect(text).toContain("## Preflight Checklist");
    expect(text).toContain(`${version.qualityScore.toFixed(1)}/5`);
  });

  it("renders 'Not recorded' when the prompt has no language strategy or output language", () => {
    const version = makeVersion();
    const prompt = makePrompt({
      versions: [version],
      languageStrategy: undefined,
      outputLanguage: undefined,
    });
    const text = buildTargetAiHandoffPackageText({ prompt, version });

    expect(text).toContain("Prompt language strategy: Not recorded");
    expect(text).toContain("Target answer language: Not recorded");
  });
});
