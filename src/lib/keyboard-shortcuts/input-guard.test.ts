import { describe, expect, it } from "vitest";

import {
  hasBlockingModifier,
  isEditableTarget,
} from "@/lib/keyboard-shortcuts/input-guard";

function fakeElement(tagName: string, isContentEditable = false) {
  return { tagName, isContentEditable } as unknown as EventTarget;
}

describe("isEditableTarget", () => {
  it("treats input elements as editable", () => {
    expect(isEditableTarget(fakeElement("INPUT"))).toBe(true);
  });

  it("treats textarea elements as editable", () => {
    expect(isEditableTarget(fakeElement("TEXTAREA"))).toBe(true);
  });

  it("treats select elements as editable", () => {
    expect(isEditableTarget(fakeElement("SELECT"))).toBe(true);
  });

  it("treats contenteditable elements as editable", () => {
    expect(isEditableTarget(fakeElement("DIV", true))).toBe(true);
  });

  it("treats a plain div as non-editable", () => {
    expect(isEditableTarget(fakeElement("DIV"))).toBe(false);
  });

  it("treats a null target as non-editable", () => {
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe("hasBlockingModifier", () => {
  it("returns true when ctrlKey is held", () => {
    expect(
      hasBlockingModifier({ ctrlKey: true, metaKey: false, altKey: false }),
    ).toBe(true);
  });

  it("returns true when metaKey is held", () => {
    expect(
      hasBlockingModifier({ ctrlKey: false, metaKey: true, altKey: false }),
    ).toBe(true);
  });

  it("returns true when altKey is held", () => {
    expect(
      hasBlockingModifier({ ctrlKey: false, metaKey: false, altKey: true }),
    ).toBe(true);
  });

  it("returns false when no modifier is held", () => {
    expect(
      hasBlockingModifier({ ctrlKey: false, metaKey: false, altKey: false }),
    ).toBe(false);
  });
});
