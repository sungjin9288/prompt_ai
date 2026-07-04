import { describe, expect, it } from "vitest";

import {
  applyCopyActionResult,
  clearCopyActionKey,
  initialCopyActionState,
} from "@/lib/browser/use-copy-action";

describe("useCopyAction state machine", () => {
  it("starts with no keys tracked", () => {
    expect(initialCopyActionState).toEqual({});
  });

  it("marks the key as copied on success", () => {
    const nextState = applyCopyActionResult(
      initialCopyActionState,
      "questions",
      true,
    );

    expect(nextState).toEqual({ questions: "copied" });
  });

  it("marks the key as failed on failure", () => {
    const nextState = applyCopyActionResult(
      initialCopyActionState,
      "questions",
      false,
    );

    expect(nextState).toEqual({ questions: "failed" });
  });

  it("tracks independent keys without clobbering each other", () => {
    const afterQuestions = applyCopyActionResult(
      initialCopyActionState,
      "questions",
      true,
    );
    const afterApplication = applyCopyActionResult(
      afterQuestions,
      "application",
      true,
    );

    expect(afterApplication).toEqual({
      questions: "copied",
      application: "copied",
    });
  });

  it("overwrites the status for the same key on a later call", () => {
    const failed = applyCopyActionResult(
      initialCopyActionState,
      "questions",
      false,
    );
    const succeeded = applyCopyActionResult(failed, "questions", true);

    expect(succeeded).toEqual({ questions: "copied" });
  });

  it("clears a single key without affecting other tracked keys", () => {
    const state = applyCopyActionResult(
      applyCopyActionResult(initialCopyActionState, "questions", true),
      "application",
      true,
    );

    const cleared = clearCopyActionKey(state, "application");

    expect(cleared).toEqual({ questions: "copied" });
  });

  it("returns the same state reference when clearing an untracked key", () => {
    const state = applyCopyActionResult(
      initialCopyActionState,
      "questions",
      true,
    );

    expect(clearCopyActionKey(state, "unused")).toBe(state);
  });
});
