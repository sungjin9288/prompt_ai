import type {
  Entitlements,
  EntitlementsInput,
  Plan,
  ProFeature,
  ProFeatureFlags,
} from "@/lib/entitlements/types";

const validPlans: readonly Plan[] = ["free", "pro"];

const allProFeaturesDisabled: ProFeatureFlags = {
  "openai-enhancement": false,
  "cloud-sync": false,
};

const allProFeaturesEnabled: ProFeatureFlags = {
  "openai-enhancement": true,
  "cloud-sync": true,
};

function normalizePlan(storedPlan: string | null | undefined): Plan {
  if (typeof storedPlan !== "string") {
    return "free";
  }

  const candidate = storedPlan.trim().toLowerCase();

  return (validPlans as readonly string[]).includes(candidate)
    ? (candidate as Plan)
    : "free";
}

export function resolveEntitlements(input: EntitlementsInput): Entitlements {
  const plan = normalizePlan(input.storedPlan);
  const proActive = plan === "pro" && input.proFeaturesEnabled === true;

  return {
    plan: proActive ? "pro" : "free",
    features: proActive ? allProFeaturesEnabled : allProFeaturesDisabled,
  };
}

export function isProFeatureEnabled(
  entitlements: Entitlements,
  feature: ProFeature,
): boolean {
  return entitlements.features[feature] === true;
}
