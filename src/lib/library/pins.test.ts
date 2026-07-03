import { describe, expect, it } from "vitest";

import { isPromptPinned, setPromptPinned, sortPinnedFirst } from "@/lib/library/pins";
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

describe("isPromptPinned", () => {
  it("returns false when pinned is undefined", () => {
    const prompt = makePrompt();

    expect(isPromptPinned(prompt)).toBe(false);
  });

  it("returns false when pinned is explicitly false", () => {
    const prompt = makePrompt({ pinned: false });

    expect(isPromptPinned(prompt)).toBe(false);
  });

  it("returns true when pinned is true", () => {
    const prompt = makePrompt({ pinned: true });

    expect(isPromptPinned(prompt)).toBe(true);
  });
});

describe("setPromptPinned", () => {
  it("pins the matching prompt immutably", () => {
    const prompts = [makePrompt({ id: "1" }), makePrompt({ id: "2" })];
    const updated = setPromptPinned(prompts, "1", true);

    expect(updated).not.toBe(prompts);
    expect(updated[0]).not.toBe(prompts[0]);
    expect(updated[0].pinned).toBe(true);
    expect(prompts[0].pinned).toBeUndefined();
  });

  it("does not touch prompts that don't match the id", () => {
    const prompts = [makePrompt({ id: "1" }), makePrompt({ id: "2" })];
    const updated = setPromptPinned(prompts, "1", true);

    expect(updated[1]).toBe(prompts[1]);
  });

  it("unpins by dropping the pinned field", () => {
    const prompts = [makePrompt({ id: "1", pinned: true })];
    const updated = setPromptPinned(prompts, "1", false);

    expect(updated[0]).not.toBe(prompts[0]);
    expect(updated[0].pinned).toBeUndefined();
    expect("pinned" in updated[0]).toBe(false);
  });

  it("is a no-op array copy when the id is not present", () => {
    const prompts = [makePrompt({ id: "1" })];
    const updated = setPromptPinned(prompts, "missing", true);

    expect(updated).toEqual(prompts);
    expect(updated[0]).toBe(prompts[0]);
  });

  it("does not mutate the original prompts array", () => {
    const prompts = [makePrompt({ id: "1" })];
    setPromptPinned(prompts, "1", true);

    expect(prompts[0].pinned).toBeUndefined();
  });
});

describe("sortPinnedFirst", () => {
  it("moves pinned prompts to the front", () => {
    const prompts = [
      makePrompt({ id: "1" }),
      makePrompt({ id: "2", pinned: true }),
      makePrompt({ id: "3" }),
    ];

    expect(sortPinnedFirst(prompts).map((p) => p.id)).toEqual(["2", "1", "3"]);
  });

  it("preserves relative order within the pinned group", () => {
    const prompts = [
      makePrompt({ id: "1", pinned: true }),
      makePrompt({ id: "2" }),
      makePrompt({ id: "3", pinned: true }),
    ];

    expect(sortPinnedFirst(prompts).map((p) => p.id)).toEqual(["1", "3", "2"]);
  });

  it("preserves relative order within the unpinned group", () => {
    const prompts = [
      makePrompt({ id: "1" }),
      makePrompt({ id: "2" }),
      makePrompt({ id: "3", pinned: true }),
    ];

    expect(sortPinnedFirst(prompts).map((p) => p.id)).toEqual(["3", "1", "2"]);
  });

  it("returns a new array without mutating the input", () => {
    const prompts = [makePrompt({ id: "1" }), makePrompt({ id: "2", pinned: true })];
    const original = [...prompts];
    const updated = sortPinnedFirst(prompts);

    expect(updated).not.toBe(prompts);
    expect(prompts).toEqual(original);
  });

  it("returns an empty array for empty input", () => {
    expect(sortPinnedFirst([])).toEqual([]);
  });

  it("is a no-op ordering when no prompts are pinned", () => {
    const prompts = [makePrompt({ id: "1" }), makePrompt({ id: "2" })];

    expect(sortPinnedFirst(prompts).map((p) => p.id)).toEqual(["1", "2"]);
  });

  it("keeps all prompts pinned in original order when every prompt is pinned", () => {
    const prompts = [
      makePrompt({ id: "1", pinned: true }),
      makePrompt({ id: "2", pinned: true }),
    ];

    expect(sortPinnedFirst(prompts).map((p) => p.id)).toEqual(["1", "2"]);
  });
});
