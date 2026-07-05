import { describe, expect, it } from "vitest";

import { isProFeatureEnabled, resolveEntitlements } from "@/lib/entitlements/resolve";

describe("resolveEntitlements", () => {
  it("defaults to the free plan with every pro feature disabled", () => {
    const entitlements = resolveEntitlements({});

    expect(entitlements.plan).toBe("free");
    expect(entitlements.features["openai-enhancement"]).toBe(false);
    expect(entitlements.features["cloud-sync"]).toBe(false);
  });

  it("normalizes an unknown stored plan value to free", () => {
    const entitlements = resolveEntitlements({
      storedPlan: "enterprise",
      proFeaturesEnabled: true,
    });

    expect(entitlements.plan).toBe("free");
    expect(entitlements.features["openai-enhancement"]).toBe(false);
    expect(entitlements.features["cloud-sync"]).toBe(false);
  });

  it("treats a missing stored plan as free even when proFeaturesEnabled is true", () => {
    const entitlements = resolveEntitlements({ proFeaturesEnabled: true });

    expect(entitlements.plan).toBe("free");
  });

  it("enables every pro feature only when plan is pro and proFeaturesEnabled is true", () => {
    const entitlements = resolveEntitlements({
      storedPlan: "pro",
      proFeaturesEnabled: true,
    });

    expect(entitlements.plan).toBe("pro");
    expect(entitlements.features["openai-enhancement"]).toBe(true);
    expect(entitlements.features["cloud-sync"]).toBe(true);
  });

  it("keeps the plan free when stored plan is pro but proFeaturesEnabled is not set", () => {
    const entitlements = resolveEntitlements({ storedPlan: "pro" });

    expect(entitlements.plan).toBe("free");
    expect(entitlements.features["openai-enhancement"]).toBe(false);
  });

  it("keeps the plan free when stored plan is pro but proFeaturesEnabled is false", () => {
    const entitlements = resolveEntitlements({
      storedPlan: "pro",
      proFeaturesEnabled: false,
    });

    expect(entitlements.plan).toBe("free");
  });

  it("treats tampered non-string stored plan values as free", () => {
    const entitlements = resolveEntitlements({
      storedPlan: undefined,
      proFeaturesEnabled: true,
    });

    expect(entitlements.plan).toBe("free");
  });

  it("is case-insensitive and trims whitespace when normalizing plan values", () => {
    const entitlements = resolveEntitlements({
      storedPlan: "  PRO  ",
      proFeaturesEnabled: true,
    });

    expect(entitlements.plan).toBe("pro");
  });

  it("reports isProFeatureEnabled per feature", () => {
    const proEntitlements = resolveEntitlements({
      storedPlan: "pro",
      proFeaturesEnabled: true,
    });
    const freeEntitlements = resolveEntitlements({});

    expect(isProFeatureEnabled(proEntitlements, "openai-enhancement")).toBe(true);
    expect(isProFeatureEnabled(proEntitlements, "cloud-sync")).toBe(true);
    expect(isProFeatureEnabled(freeEntitlements, "openai-enhancement")).toBe(false);
    expect(isProFeatureEnabled(freeEntitlements, "cloud-sync")).toBe(false);
  });
});
