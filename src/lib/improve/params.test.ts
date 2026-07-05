import { describe, expect, it } from "vitest";

import {
  capImproveDraft,
  getImproveOriginTargetModel,
  improveDraftMaxLength,
  normalizeImproveOrigin,
  resolveImproveParams,
} from "@/lib/improve/params";

describe("resolveImproveParams", () => {
  it("returns an empty editor state when no params are provided", () => {
    const result = resolveImproveParams({});

    expect(result).toEqual({
      draft: "",
      source: "unknown",
      origin: "unknown",
    });
  });

  it("decodes a URI-encoded draft", () => {
    const original = "초안 & 텍스트";

    const result = resolveImproveParams({
      draft: encodeURIComponent(original),
    });

    expect(result.draft).toBe(original);
  });

  it("falls back to the raw draft when decodeURIComponent throws on malformed input", () => {
    const malformed = "%E0%A4%A";

    const result = resolveImproveParams({ draft: malformed });

    expect(result.draft).toBe(malformed);
  });

  it("caps the draft length after decoding", () => {
    const longDraft = "a".repeat(improveDraftMaxLength + 500);

    const result = resolveImproveParams({ draft: longDraft });

    expect(result.draft).toHaveLength(improveDraftMaxLength);
  });

  it("normalizes source to extension only for the exact literal", () => {
    expect(resolveImproveParams({ source: "extension" }).source).toBe(
      "extension",
    );
    expect(resolveImproveParams({ source: "something-else" }).source).toBe(
      "unknown",
    );
    expect(resolveImproveParams({ source: undefined }).source).toBe(
      "unknown",
    );
  });

  it("normalizes known origins case-insensitively and rejects unknown ones", () => {
    expect(normalizeImproveOrigin("ChatGPT")).toBe("chatgpt");
    expect(normalizeImproveOrigin("chatgpt")).toBe("chatgpt");
    expect(normalizeImproveOrigin("CLAUDE")).toBe("claude");
    expect(normalizeImproveOrigin("gemini")).toBe("gemini");
    expect(normalizeImproveOrigin("bing")).toBe("unknown");
  });

  it("takes the first value when searchParams provide arrays", () => {
    const result = resolveImproveParams({
      draft: ["첫번째", "두번째"],
      source: ["extension", "web"],
      origin: ["claude", "gemini"],
    });

    expect(result).toEqual({
      draft: "첫번째",
      source: "extension",
      origin: "claude",
    });
  });

  it("maps each known origin to its target AI model", () => {
    expect(getImproveOriginTargetModel("chatgpt")).toBe("gpt");
    expect(getImproveOriginTargetModel("claude")).toBe("claude");
    expect(getImproveOriginTargetModel("gemini")).toBe("gemini");
    expect(getImproveOriginTargetModel("unknown")).toBe("general");
  });

  it("caps a plain string to the max length", () => {
    const longDraft = "b".repeat(improveDraftMaxLength + 10);

    expect(capImproveDraft(longDraft)).toHaveLength(improveDraftMaxLength);
  });
});
