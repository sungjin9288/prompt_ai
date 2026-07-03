import { describe, expect, it } from "vitest";

import {
  findGoToShortcut,
  formatGoToDescription,
  goToShortcuts,
} from "@/lib/keyboard-shortcuts/go-to-registry";

describe("go-to-registry", () => {
  it("maps every documented shortcut key to a unique href", () => {
    const keys = goToShortcuts.map((shortcut) => shortcut.key);
    const hrefs = goToShortcuts.map((shortcut) => shortcut.href);

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("finds a shortcut by its key", () => {
    expect(findGoToShortcut("l")).toEqual({
      key: "l",
      href: "/library",
      label: "라이브러리",
    });
  });

  it("is case-insensitive", () => {
    expect(findGoToShortcut("L")).toEqual(findGoToShortcut("l"));
  });

  it("returns undefined for an unmapped key", () => {
    expect(findGoToShortcut("z")).toBeUndefined();
  });

  it("uses 으로 after a final consonant and 로 after a vowel or ㄹ", () => {
    expect(formatGoToDescription("홈")).toBe("홈으로 이동");
    expect(formatGoToDescription("작성")).toBe("작성으로 이동");
    expect(formatGoToDescription("학습")).toBe("학습으로 이동");
    expect(formatGoToDescription("활동")).toBe("활동으로 이동");
    expect(formatGoToDescription("개인")).toBe("개인으로 이동");
    expect(formatGoToDescription("라이브러리")).toBe("라이브러리로 이동");
    expect(formatGoToDescription("스킬")).toBe("스킬로 이동");
    expect(formatGoToDescription("연결")).toBe("연결로 이동");
    expect(formatGoToDescription("회사")).toBe("회사로 이동");
    expect(formatGoToDescription("데이터")).toBe("데이터로 이동");
  });
});
