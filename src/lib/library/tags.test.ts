import { describe, expect, it } from "vitest";

import {
  addTagToPrompt,
  collectAllTags,
  getPromptTags,
  normalizeTag,
  promptHasTag,
  removeTagFromPrompt,
} from "@/lib/library/tags";
import type { PromptAsset } from "@/lib/prompt/types";

function makePrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  return {
    id: "prompt-1",
    title: "Sample prompt",
    source: "local",
    rawInput: "raw input",
    goal: "goal",
    domain: "domain",
    targetModels: ["gpt"],
    versions: [],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getPromptTags", () => {
  it("returns an empty array when tags is undefined", () => {
    const prompt = makePrompt();

    expect(getPromptTags(prompt)).toEqual([]);
  });

  it("returns the prompt's tags when present", () => {
    const prompt = makePrompt({ tags: ["marketing", "draft"] });

    expect(getPromptTags(prompt)).toEqual(["marketing", "draft"]);
  });
});

describe("normalizeTag", () => {
  it("trims whitespace", () => {
    expect(normalizeTag("  marketing  ")).toBe("marketing");
  });

  it("lowercases the tag", () => {
    expect(normalizeTag("Marketing")).toBe("marketing");
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(normalizeTag("   ")).toBe("");
  });
});

describe("addTagToPrompt", () => {
  it("adds a normalized tag immutably", () => {
    const prompt = makePrompt();
    const updated = addTagToPrompt(prompt, "  Marketing ");

    expect(updated).not.toBe(prompt);
    expect(updated.tags).toEqual(["marketing"]);
    expect(prompt.tags).toBeUndefined();
  });

  it("does not add duplicate tags", () => {
    const prompt = makePrompt({ tags: ["marketing"] });
    const updated = addTagToPrompt(prompt, "Marketing");

    expect(updated.tags).toEqual(["marketing"]);
  });

  it("returns the same prompt reference when tag is empty", () => {
    const prompt = makePrompt();
    const updated = addTagToPrompt(prompt, "   ");

    expect(updated).toBe(prompt);
  });

  it("appends to existing tags without mutating the original array", () => {
    const originalTags = ["marketing"];
    const prompt = makePrompt({ tags: originalTags });
    const updated = addTagToPrompt(prompt, "draft");

    expect(updated.tags).toEqual(["marketing", "draft"]);
    expect(originalTags).toEqual(["marketing"]);
  });
});

describe("removeTagFromPrompt", () => {
  it("removes a matching tag immutably", () => {
    const prompt = makePrompt({ tags: ["marketing", "draft"] });
    const updated = removeTagFromPrompt(prompt, "marketing");

    expect(updated).not.toBe(prompt);
    expect(updated.tags).toEqual(["draft"]);
    expect(prompt.tags).toEqual(["marketing", "draft"]);
  });

  it("normalizes the tag before comparing", () => {
    const prompt = makePrompt({ tags: ["marketing"] });
    const updated = removeTagFromPrompt(prompt, "  Marketing  ");

    expect(updated.tags).toEqual([]);
  });

  it("is a no-op when the tag is not present", () => {
    const prompt = makePrompt({ tags: ["marketing"] });
    const updated = removeTagFromPrompt(prompt, "draft");

    expect(updated.tags).toEqual(["marketing"]);
  });
});

describe("collectAllTags", () => {
  it("returns a unique sorted list of tags across prompts", () => {
    const prompts = [
      makePrompt({ id: "1", tags: ["marketing", "draft"] }),
      makePrompt({ id: "2", tags: ["draft", "sales"] }),
      makePrompt({ id: "3" }),
    ];

    expect(collectAllTags(prompts)).toEqual(["draft", "marketing", "sales"]);
  });

  it("returns an empty array when no prompts have tags", () => {
    const prompts = [makePrompt({ id: "1" }), makePrompt({ id: "2" })];

    expect(collectAllTags(prompts)).toEqual([]);
  });
});

describe("promptHasTag", () => {
  it("returns true when the prompt has the tag", () => {
    const prompt = makePrompt({ tags: ["marketing"] });

    expect(promptHasTag(prompt, "marketing")).toBe(true);
  });

  it("returns false when the prompt does not have the tag", () => {
    const prompt = makePrompt({ tags: ["marketing"] });

    expect(promptHasTag(prompt, "draft")).toBe(false);
  });
});
