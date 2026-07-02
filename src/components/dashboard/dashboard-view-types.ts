import type { StudioPersistenceMode } from "@/lib/dashboard/shared";

export type CopyStatus = "idle" | "copied" | "failed";

export interface KeyedCopyStatus {
  key: string;
  status: "copied" | "failed";
}

export interface LabeledCopyStatus {
  label: string;
  status: "copied" | "failed";
}

export interface StudioPersistenceKeyedCopyStatus {
  key: StudioPersistenceMode;
  status: "copied" | "failed";
}

export interface DashboardManualCopy {
  title: string;
  body: string;
}
