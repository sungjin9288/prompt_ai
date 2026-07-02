import { describe, expect, it } from "vitest";

import { createPromptStudioSourceMeta } from "@/lib/studio/source-meta";
import type { PromptImprovementFeedbackSource } from "@/lib/prompt";

const baseInput = {
  source: "dashboard-next-action-queue" as const,
  sourceHref: "/dashboard",
  inputPreview: "some input preview",
  inputLineCount: 3,
  inputCharCount: 42,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const sampleFeedback: PromptImprovementFeedbackSource = {
  id: "feedback-1",
  promptVersionId: "version-1",
  rating: 4,
  feedbackType: "tone",
  comment: "Needs a friendlier tone",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("createPromptStudioSourceMeta", () => {
  it("sets the fixed studio-draft type and preserves the given source", () => {
    const meta = createPromptStudioSourceMeta(baseInput);

    expect(meta.type).toBe("studio-draft");
    expect(meta.source).toBe("dashboard-next-action-queue");
  });

  it("normalizes the sourceHref through the internal href contract", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      sourceHref: "https://evil.example.com/steal",
    });

    expect(meta.sourceHref).toBe("/");
  });

  it("keeps a valid internal sourceHref unchanged", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      sourceHref: "/library/prompt-1",
    });

    expect(meta.sourceHref).toBe("/library/prompt-1");
  });

  it("falls back to a placeholder when inputPreview is blank", () => {
    const meta = createPromptStudioSourceMeta({ ...baseInput, inputPreview: "   " });

    expect(meta.inputPreview).toBe("입력 내용 없음");
  });

  it("trims a non-blank inputPreview", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      inputPreview: "  hello world  ",
    });

    expect(meta.inputPreview).toBe("hello world");
  });

  it("clamps negative char/line counts to zero", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      inputCharCount: -5,
      inputLineCount: -1,
    });

    expect(meta.inputCharCount).toBe(0);
    expect(meta.inputLineCount).toBe(0);
  });

  it("floors non-integer char/line counts", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      inputCharCount: 10.7,
      inputLineCount: 2.9,
    });

    expect(meta.inputCharCount).toBe(10);
    expect(meta.inputLineCount).toBe(2);
  });

  it("treats non-finite char/line counts as zero", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      inputCharCount: Number.NaN,
      inputLineCount: Number.POSITIVE_INFINITY,
    });

    expect(meta.inputCharCount).toBe(0);
    expect(meta.inputLineCount).toBe(0);
  });

  it("normalizes a valid createdAt to an ISO timestamp", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    expect(meta.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("falls back to savedAt when createdAt is not a valid date", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      createdAt: "not-a-date",
    });

    expect(meta.createdAt).toBe(meta.savedAt);
  });

  it("omits sourceTitle when not provided", () => {
    const meta = createPromptStudioSourceMeta(baseInput);

    expect(meta.sourceTitle).toBeUndefined();
  });

  it("includes a trimmed sourceTitle when provided", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      sourceTitle: "  My Prompt Title  ",
    });

    expect(meta.sourceTitle).toBe("My Prompt Title");
  });

  it("omits sourceTitle when it is blank after trimming", () => {
    const meta = createPromptStudioSourceMeta({ ...baseInput, sourceTitle: "   " });

    expect(meta.sourceTitle).toBeUndefined();
  });

  it("omits sourceVariant when none is provided", () => {
    const meta = createPromptStudioSourceMeta(baseInput);

    expect(meta.sourceVariant).toBeUndefined();
  });

  it("omits sourceVariant when the source does not match the variant's allowed sources", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      source: "dashboard-personalization",
      sourceVariant: "dashboard-next-action-queue-verification",
    });

    expect(meta.sourceVariant).toBeUndefined();
  });

  it("keeps a valid sourceVariant when the source matches its allowed sources", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      source: "dashboard-next-action-queue",
      sourceVariant: "dashboard-next-action-queue-verification",
    });

    expect(meta.sourceVariant).toBe("dashboard-next-action-queue-verification");
  });

  it("drops sourceFeedback for a variant that does not require it", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      source: "dashboard-next-action-queue",
      sourceVariant: "dashboard-next-action-queue-verification",
      sourceFeedback: sampleFeedback,
    });

    expect(meta.sourceFeedback).toBeUndefined();
  });

  it("keeps sourceFeedback for a variant that requires it", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      source: "library-improvement",
      sourceVariant: "feedback-improvement",
      sourceFeedback: sampleFeedback,
    });

    expect(meta.sourceFeedback).toEqual(sampleFeedback);
  });

  it("drops sourceFeedback entirely when there is no sourceVariant", () => {
    const meta = createPromptStudioSourceMeta({
      ...baseInput,
      sourceFeedback: sampleFeedback,
    });

    expect(meta.sourceFeedback).toBeUndefined();
  });
});
