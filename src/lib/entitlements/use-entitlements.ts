"use client";

import { useMemo } from "react";

import { usePlanStore } from "@/lib/data/workspace-store";
import { resolveEntitlements } from "@/lib/entitlements/resolve";
import type { Entitlements } from "@/lib/entitlements/types";

export function useEntitlements(): Entitlements {
  const [storedPlan] = usePlanStore();

  return useMemo(
    () => resolveEntitlements({ storedPlan, proFeaturesEnabled: false }),
    [storedPlan],
  );
}
