import { describe, expect, it } from "vitest";

import { resolveContextSection } from "@/lib/context/section";

describe("resolveContextSection", () => {
  it("resolves the literal 'company' value to the company section", () => {
    expect(resolveContextSection("company")).toBe("company");
  });

  it("resolves the literal 'profile' value to the profile section", () => {
    expect(resolveContextSection("profile")).toBe("profile");
  });

  it("defaults an unknown section value to profile", () => {
    expect(resolveContextSection("unknown-section")).toBe("profile");
  });

  it("defaults an empty string to profile", () => {
    expect(resolveContextSection("")).toBe("profile");
  });

  it("defaults undefined to profile", () => {
    expect(resolveContextSection(undefined)).toBe("profile");
  });

  it("is case sensitive: 'Company' does not match the company branch", () => {
    expect(resolveContextSection("Company")).toBe("profile");
  });
});
