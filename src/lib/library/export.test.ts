import { describe, expect, it } from "vitest";

import {
  buildPromptExportFilename,
  buildPromptJson,
  buildPromptMarkdown,
} from "@/lib/library/export";
import type { PromptAsset, PromptVersion } from "@/lib/prompt/types";

function makeVersion(overrides: Partial<PromptVersion> = {}): PromptVersion {
  return {
    id: "version-1",
    targetModel: "gpt",
    modelLabel: "GPT",
    content: "버전 본문 내용",
    qualityScore: 8.5,
    scoreBreakdown: {
      clarity: 8,
      context: 8,
      outputFormat: 8,
      constraints: 8,
      expertise: 8,
      modelFit: 8,
      reusability: 8,
    },
    assumptions: [],
    missingContext: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makePrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  return {
    id: "prompt-1",
    title: "샘플 프롬프트",
    source: "local",
    rawInput: "원문 입력 내용",
    goal: "목표",
    domain: "마케팅",
    targetModels: ["gpt"],
    versions: [makeVersion()],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildPromptMarkdown", () => {
  it("includes the title as an H1 heading", () => {
    const prompt = makePrompt({ title: "테스트 제목" });
    const markdown = buildPromptMarkdown(prompt, prompt.versions[0]);

    expect(markdown).toContain("# 테스트 제목");
  });

  it("includes domain metadata", () => {
    const prompt = makePrompt({ domain: "영업" });
    const markdown = buildPromptMarkdown(prompt, prompt.versions[0]);

    expect(markdown).toContain("- 분야: 영업");
  });

  it("includes target model labels", () => {
    const prompt = makePrompt({ targetModels: ["gpt", "claude"] });
    const markdown = buildPromptMarkdown(prompt, prompt.versions[0]);

    expect(markdown).toContain("- 대상 AI: GPT, Claude");
  });

  it("includes the language strategy label", () => {
    const prompt = makePrompt({ languageStrategy: "english" });
    const markdown = buildPromptMarkdown(prompt, prompt.versions[0]);

    expect(markdown).toContain("- 언어 전략: 전체 영어 지시문");
  });

  it("defaults the language strategy when missing", () => {
    const prompt = makePrompt({ languageStrategy: undefined });
    const markdown = buildPromptMarkdown(prompt, prompt.versions[0]);

    expect(markdown).toContain("- 언어 전략: 한영 하이브리드");
  });

  it("includes the output language label", () => {
    const prompt = makePrompt({ outputLanguage: "english" });
    const markdown = buildPromptMarkdown(prompt, prompt.versions[0]);

    expect(markdown).toContain("- 답변 언어: 영어");
  });

  it("joins tags when present", () => {
    const prompt = makePrompt({ tags: ["마케팅", "초안"] });
    const markdown = buildPromptMarkdown(prompt, prompt.versions[0]);

    expect(markdown).toContain("- 태그: 마케팅, 초안");
  });

  it("shows a placeholder when tags are missing", () => {
    const prompt = makePrompt({ tags: undefined });
    const markdown = buildPromptMarkdown(prompt, prompt.versions[0]);

    expect(markdown).toContain("- 태그: 없음");
  });

  it("includes the creation date", () => {
    const prompt = makePrompt({ createdAt: "2026-03-15T00:00:00.000Z" });
    const markdown = buildPromptMarkdown(prompt, prompt.versions[0]);

    expect(markdown).toContain("- 생성일: 2026-03-15T00:00:00.000Z");
  });

  it("includes a 원문 section with the raw input", () => {
    const prompt = makePrompt({ rawInput: "이것은 원문입니다" });
    const markdown = buildPromptMarkdown(prompt, prompt.versions[0]);

    expect(markdown).toContain("## 원문");
    expect(markdown).toContain("이것은 원문입니다");
  });

  it("includes a 프롬프트 section labeled with the version's model label", () => {
    const prompt = makePrompt();
    const version = makeVersion({ modelLabel: "Claude", content: "버전 내용입니다" });
    const markdown = buildPromptMarkdown(prompt, version);

    expect(markdown).toContain("## 프롬프트 (Claude)");
    expect(markdown).toContain("버전 내용입니다");
  });

  it("is deterministic for the same input", () => {
    const prompt = makePrompt();
    const first = buildPromptMarkdown(prompt, prompt.versions[0]);
    const second = buildPromptMarkdown(prompt, prompt.versions[0]);

    expect(first).toBe(second);
  });
});

describe("buildPromptJson", () => {
  it("serializes the full prompt asset", () => {
    const prompt = makePrompt();
    const json = buildPromptJson(prompt);
    const parsed = JSON.parse(json) as PromptAsset;

    expect(parsed.id).toBe(prompt.id);
    expect(parsed.title).toBe(prompt.title);
    expect(parsed.versions).toHaveLength(1);
  });

  it("round-trips through JSON.parse without loss", () => {
    const prompt = makePrompt({ tags: ["a", "b"], pinned: true });
    const parsed = JSON.parse(buildPromptJson(prompt)) as PromptAsset;

    expect(parsed).toEqual(prompt);
  });

  it("is pretty-printed with two-space indentation", () => {
    const prompt = makePrompt();
    const json = buildPromptJson(prompt);

    expect(json).toContain('\n  "id"');
  });
});

describe("buildPromptExportFilename", () => {
  it("builds a markdown filename from the title", () => {
    const prompt = makePrompt({ title: "My Prompt Title" });

    expect(buildPromptExportFilename(prompt, "md")).toBe("My-Prompt-Title.md");
  });

  it("builds a json filename from the title", () => {
    const prompt = makePrompt({ title: "My Prompt Title" });

    expect(buildPromptExportFilename(prompt, "json")).toBe(
      "My-Prompt-Title.json",
    );
  });

  it("strips filesystem-unsafe characters", () => {
    const prompt = makePrompt({ title: 'Weird:/\\*?"<>|Title' });

    expect(buildPromptExportFilename(prompt, "md")).toBe("WeirdTitle.md");
  });

  it("preserves Korean titles", () => {
    const prompt = makePrompt({ title: "한글 제목 테스트" });

    expect(buildPromptExportFilename(prompt, "md")).toBe(
      "한글-제목-테스트.md",
    );
  });

  it("falls back to the prompt id for an empty title", () => {
    const prompt = makePrompt({ title: "", id: "prompt-fallback-id" });

    expect(buildPromptExportFilename(prompt, "md")).toBe(
      "prompt-fallback-id.md",
    );
  });

  it("falls back to the prompt id for a whitespace-only title", () => {
    const prompt = makePrompt({ title: "   ", id: "prompt-fallback-id" });

    expect(buildPromptExportFilename(prompt, "json")).toBe(
      "prompt-fallback-id.json",
    );
  });

  it("is deterministic for the same input", () => {
    const prompt = makePrompt();

    expect(buildPromptExportFilename(prompt, "md")).toBe(
      buildPromptExportFilename(prompt, "md"),
    );
  });
});
