import { describe, expect, it } from "vitest";

import {
  formatAbsoluteInternalHref,
  normalizeInternalHref,
} from "@/lib/navigation/href";

describe("normalizeInternalHref", () => {
  it("keeps a plain internal path unchanged", () => {
    expect(normalizeInternalHref("/library")).toBe("/library");
  });

  it("preserves query string and hash on an internal path", () => {
    expect(normalizeInternalHref("/studio?tab=result#top")).toBe(
      "/studio?tab=result#top",
    );
  });

  it("trims surrounding whitespace before normalizing", () => {
    expect(normalizeInternalHref("  /dashboard  ")).toBe("/dashboard");
  });

  it("returns undefined for an empty string", () => {
    expect(normalizeInternalHref("")).toBeUndefined();
  });

  it("returns undefined for a whitespace-only string", () => {
    expect(normalizeInternalHref("   ")).toBeUndefined();
  });

  it("returns undefined for non-string input", () => {
    expect(normalizeInternalHref(undefined)).toBeUndefined();
    expect(normalizeInternalHref(null)).toBeUndefined();
    expect(normalizeInternalHref(42)).toBeUndefined();
    expect(normalizeInternalHref({ href: "/library" })).toBeUndefined();
  });

  it("rejects absolute external URLs", () => {
    expect(normalizeInternalHref("https://evil.example.com/path")).toBeUndefined();
    expect(normalizeInternalHref("http://evil.example.com")).toBeUndefined();
  });

  it("rejects protocol-relative URLs", () => {
    expect(normalizeInternalHref("//evil.example.com/path")).toBeUndefined();
  });

  it("rejects javascript: URLs", () => {
    expect(normalizeInternalHref("javascript:alert(1)")).toBeUndefined();
  });

  it("rejects data: URLs", () => {
    expect(normalizeInternalHref("data:text/html,<script>alert(1)</script>")).toBeUndefined();
  });

  it("rejects mailto: URLs", () => {
    expect(normalizeInternalHref("mailto:someone@example.com")).toBeUndefined();
  });

  it("resolves a bare path without a leading slash against the internal origin", () => {
    // URL resolution treats this as relative to the fixed internal origin's root,
    // so it still normalizes to a safe internal path rather than escaping it.
    expect(normalizeInternalHref("library")).toBe("/library");
  });

  it("resolves a relative path segment against the internal origin without escaping it", () => {
    expect(normalizeInternalHref("../secrets")).toBe("/secrets");
  });

  it("rejects backslash-prefixed values that browsers treat as protocol-relative", () => {
    expect(normalizeInternalHref("/\\evil.example.com")).toBeUndefined();
  });
});

describe("formatAbsoluteInternalHref", () => {
  it("returns the normalized internal href when no origin is given", () => {
    expect(formatAbsoluteInternalHref("/library")).toBe("/library");
  });

  it("builds an absolute URL when an origin is provided", () => {
    expect(formatAbsoluteInternalHref("/library", "https://app.example.com")).toBe(
      "https://app.example.com/library",
    );
  });

  it("returns undefined when the underlying href is invalid", () => {
    expect(
      formatAbsoluteInternalHref("https://evil.example.com", "https://app.example.com"),
    ).toBeUndefined();
  });

  it("falls back to the internal href when origin formatting throws", () => {
    expect(formatAbsoluteInternalHref("/library", "not-a-valid-origin")).toBe(
      "/library",
    );
  });
});
