import { describe, expect, it } from "vitest";

import { buildPromptJson } from "@/lib/library/export";
import {
  normalizeImportedPrompt,
  parsePromptImport,
} from "@/lib/library/import";
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

describe("parsePromptImport", () => {
  it("round-trips a prior buildPromptJson export", () => {
    const prompt = makePrompt({ tags: ["a", "b"] });
    const json = buildPromptJson(prompt);
    const result = parsePromptImport(json);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prompt.title).toBe(prompt.title);
      expect(result.prompt.rawInput).toBe(prompt.rawInput);
      expect(result.prompt.goal).toBe(prompt.goal);
      expect(result.prompt.domain).toBe(prompt.domain);
      expect(result.prompt.versions).toHaveLength(1);
      expect(result.prompt.versions[0].content).toBe(
        prompt.versions[0].content,
      );
      expect(result.prompt.tags).toEqual(["a", "b"]);
    }
  });

  it("returns a Korean error for malformed JSON", () => {
    const result = parsePromptImport("{ not valid json");

    expect(result).toEqual({
      ok: false,
      error: "JSON 형식이 올바르지 않습니다.",
    });
  });

  it("returns a specific error when title is missing", () => {
    const prompt = makePrompt();
    const json = JSON.parse(buildPromptJson(prompt));
    delete json.title;

    const result = parsePromptImport(JSON.stringify(json));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("title");
    }
  });

  it("returns a specific error when rawInput is missing", () => {
    const prompt = makePrompt();
    const json = JSON.parse(buildPromptJson(prompt));
    delete json.rawInput;

    const result = parsePromptImport(JSON.stringify(json));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("rawInput");
    }
  });

  it("returns a specific error when versions is missing", () => {
    const prompt = makePrompt();
    const json = JSON.parse(buildPromptJson(prompt));
    delete json.versions;

    const result = parsePromptImport(JSON.stringify(json));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("versions");
    }
  });

  it("returns an error when versions is an empty array", () => {
    const prompt = makePrompt({ versions: [] });
    const json = buildPromptJson(prompt);

    const result = parsePromptImport(json);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("versions");
    }
  });

  it("returns an error when a version is missing content", () => {
    const prompt = makePrompt();
    const json = JSON.parse(buildPromptJson(prompt));
    delete json.versions[0].content;

    const result = parsePromptImport(JSON.stringify(json));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("content");
    }
  });

  it("returns an error when a version has an invalid targetModel", () => {
    const prompt = makePrompt();
    const json = JSON.parse(buildPromptJson(prompt));
    json.versions[0].targetModel = "not-a-model";

    const result = parsePromptImport(JSON.stringify(json));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("targetModel");
    }
  });

  it("normalizes a version's scoreBreakdown by defaulting missing keys to 0", () => {
    const prompt = makePrompt();
    const json = JSON.parse(buildPromptJson(prompt));
    json.versions[0].scoreBreakdown = { clarity: 9 };

    const result = parsePromptImport(JSON.stringify(json));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prompt.versions[0].scoreBreakdown).toEqual({
        clarity: 9,
        context: 0,
        outputFormat: 0,
        constraints: 0,
        expertise: 0,
        modelFit: 0,
        reusability: 0,
      });
    }
  });

  it("normalizes a completely missing scoreBreakdown to all zeros", () => {
    const prompt = makePrompt();
    const json = JSON.parse(buildPromptJson(prompt));
    delete json.versions[0].scoreBreakdown;

    const result = parsePromptImport(JSON.stringify(json));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prompt.versions[0].scoreBreakdown).toEqual({
        clarity: 0,
        context: 0,
        outputFormat: 0,
        constraints: 0,
        expertise: 0,
        modelFit: 0,
        reusability: 0,
      });
    }
  });

  it("takes the first element when the JSON is an array", () => {
    const first = makePrompt({ title: "첫 번째" });
    const second = makePrompt({ title: "두 번째" });

    const result = parsePromptImport(JSON.stringify([first, second]));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prompt.title).toBe("첫 번째");
    }
  });

  it("returns an error for an empty array", () => {
    const result = parsePromptImport(JSON.stringify([]));

    expect(result.ok).toBe(false);
  });

  it("rejects a JSON value that is not an object (e.g. a string)", () => {
    const result = parsePromptImport(JSON.stringify("just a string"));

    expect(result.ok).toBe(false);
  });

  it("defaults targetModels from versions when targetModels is missing", () => {
    const prompt = makePrompt({ targetModels: [] });
    const json = JSON.parse(buildPromptJson(prompt));
    delete json.targetModels;

    const result = parsePromptImport(JSON.stringify(json));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.prompt.targetModels).toEqual(["gpt"]);
    }
  });

  it("is deterministic for the same input", () => {
    const prompt = makePrompt();
    const json = buildPromptJson(prompt);

    const first = parsePromptImport(json);
    const second = parsePromptImport(json);

    expect(first).toEqual(second);
  });
});

describe("normalizeImportedPrompt", () => {
  it("keeps the title as-is without a 사본 suffix", () => {
    const prompt = makePrompt({ title: "원본 제목" });
    const parseResult = parsePromptImport(buildPromptJson(prompt));

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const normalized = normalizeImportedPrompt(parseResult.prompt, {
      id: "new-id",
      versionIds: ["new-version-1"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(normalized.title).toBe("원본 제목");
  });

  it("clears feedback on normalize", () => {
    const prompt = makePrompt();
    const parseResult = parsePromptImport(buildPromptJson(prompt));

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const normalized = normalizeImportedPrompt(parseResult.prompt, {
      id: "new-id",
      versionIds: ["new-version-1"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(normalized.feedback).toEqual([]);
  });

  it("omits pinned and provenance fields", () => {
    const prompt = makePrompt();
    const parseResult = parsePromptImport(buildPromptJson(prompt));

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const normalized = normalizeImportedPrompt(parseResult.prompt, {
      id: "new-id",
      versionIds: ["new-version-1"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(normalized.pinned).toBeUndefined();
    expect(normalized.sourceSkillId).toBeUndefined();
    expect(normalized.sourceSkillName).toBeUndefined();
    expect(normalized.improvementSource).toBeUndefined();
    expect(normalized.studioSource).toBeUndefined();
    expect(normalized.learningContext).toBeUndefined();
  });

  it("assigns the given fresh id and version ids", () => {
    const prompt = makePrompt();
    const parseResult = parsePromptImport(buildPromptJson(prompt));

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const normalized = normalizeImportedPrompt(parseResult.prompt, {
      id: "fresh-prompt-id",
      versionIds: ["fresh-version-id"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(normalized.id).toBe("fresh-prompt-id");
    expect(normalized.id).not.toBe(prompt.id);
    expect(normalized.versions[0].id).toBe("fresh-version-id");
    expect(normalized.versions[0].id).not.toBe(prompt.versions[0].id);
  });

  it("uses the given timestamp for createdAt, updatedAt, and version createdAt", () => {
    const prompt = makePrompt();
    const parseResult = parsePromptImport(buildPromptJson(prompt));

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const normalized = normalizeImportedPrompt(parseResult.prompt, {
      id: "new-id",
      versionIds: ["new-version-1"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(normalized.createdAt).toBe("2026-02-01T00:00:00.000Z");
    expect(normalized.updatedAt).toBe("2026-02-01T00:00:00.000Z");
    expect(normalized.versions[0].createdAt).toBe("2026-02-01T00:00:00.000Z");
  });

  it("preserves content, versions, targetModels, tags, and language settings", () => {
    const prompt = makePrompt({
      tags: ["marketing"],
      languageStrategy: "english",
      outputLanguage: "korean",
    });
    const parseResult = parsePromptImport(buildPromptJson(prompt));

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const normalized = normalizeImportedPrompt(parseResult.prompt, {
      id: "new-id",
      versionIds: ["new-version-1"],
      timestamp: "2026-02-01T00:00:00.000Z",
    });

    expect(normalized.versions[0].content).toBe(prompt.versions[0].content);
    expect(normalized.targetModels).toEqual(prompt.targetModels);
    expect(normalized.tags).toEqual(["marketing"]);
    expect(normalized.languageStrategy).toBe("english");
    expect(normalized.outputLanguage).toBe("korean");
  });

  it("is deterministic for the same input and params", () => {
    const prompt = makePrompt();
    const parseResult = parsePromptImport(buildPromptJson(prompt));

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    const params = {
      id: "new-id",
      versionIds: ["new-version-1"],
      timestamp: "2026-02-01T00:00:00.000Z",
    };

    const first = normalizeImportedPrompt(parseResult.prompt, params);
    const second = normalizeImportedPrompt(parseResult.prompt, params);

    expect(first).toEqual(second);
  });

  it("throws when versionIds length does not match parsed versions length", () => {
    const prompt = makePrompt();
    const parseResult = parsePromptImport(buildPromptJson(prompt));

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) return;

    expect(() =>
      normalizeImportedPrompt(parseResult.prompt, {
        id: "new-id",
        versionIds: [],
        timestamp: "2026-02-01T00:00:00.000Z",
      }),
    ).toThrow();
  });
});
