export type Plan = "free" | "pro";

export type ProFeature = "openai-enhancement" | "cloud-sync";

export type ProFeatureFlags = Record<ProFeature, boolean>;

export interface Entitlements {
  plan: Plan;
  features: ProFeatureFlags;
}

export interface EntitlementsInput {
  storedPlan?: string | null;
  proFeaturesEnabled?: boolean;
}
