export interface SupabaseImportPreflightScope {
  backupFingerprint?: string;
  ownerUserId?: string;
  workspaceId?: string;
}

export interface SupabaseImportCurrentScope {
  backupFingerprint: string;
  ownerUserId: string;
  workspaceId: string;
}

export type SupabaseImportPreflightScopeStatus =
  | "current"
  | "missing"
  | "stale";

export type SupabaseImportPreflightScopeChange =
  | "backupFingerprint"
  | "owner_user_id"
  | "workspace_id";

export interface SupabaseImportPreflightScopeChangeDetail {
  currentValue: string;
  field: SupabaseImportPreflightScopeChange;
  label: string;
  preflightValue: string;
}

const scopeChangeLabels: Record<SupabaseImportPreflightScopeChange, string> = {
  backupFingerprint: "backup fingerprint",
  owner_user_id: "owner_user_id",
  workspace_id: "workspace_id",
};

export function normalizeSupabaseImportCurrentScope({
  backupFingerprint,
  ownerUserId,
  workspaceId,
}: SupabaseImportCurrentScope): SupabaseImportCurrentScope {
  return {
    backupFingerprint,
    ownerUserId: ownerUserId.trim(),
    workspaceId: workspaceId.trim(),
  };
}

export function getSupabaseImportPreflightScopeStatus({
  current,
  preflight,
}: {
  current: SupabaseImportCurrentScope;
  preflight?: SupabaseImportPreflightScope;
}): SupabaseImportPreflightScopeStatus {
  if (!preflight) {
    return "missing";
  }

  const normalizedCurrent = normalizeSupabaseImportCurrentScope(current);

  if (
    !preflight.backupFingerprint ||
    !preflight.workspaceId ||
    !preflight.ownerUserId
  ) {
    return "missing";
  }

  return preflight.backupFingerprint === normalizedCurrent.backupFingerprint &&
    preflight.workspaceId === normalizedCurrent.workspaceId &&
    preflight.ownerUserId === normalizedCurrent.ownerUserId
    ? "current"
    : "stale";
}

export function getSupabaseImportPreflightScopeChanges({
  current,
  preflight,
}: {
  current: SupabaseImportCurrentScope;
  preflight?: SupabaseImportPreflightScope;
}): SupabaseImportPreflightScopeChange[] {
  if (
    !preflight?.backupFingerprint ||
    !preflight.workspaceId ||
    !preflight.ownerUserId
  ) {
    return [];
  }

  const normalizedCurrent = normalizeSupabaseImportCurrentScope(current);
  const changes: SupabaseImportPreflightScopeChange[] = [];

  if (preflight.backupFingerprint !== normalizedCurrent.backupFingerprint) {
    changes.push("backupFingerprint");
  }

  if (preflight.workspaceId !== normalizedCurrent.workspaceId) {
    changes.push("workspace_id");
  }

  if (preflight.ownerUserId !== normalizedCurrent.ownerUserId) {
    changes.push("owner_user_id");
  }

  return changes;
}

function getSupabaseImportScopeValue(
  scope: SupabaseImportCurrentScope | SupabaseImportPreflightScope,
  field: SupabaseImportPreflightScopeChange,
) {
  switch (field) {
    case "backupFingerprint":
      return scope.backupFingerprint || "not provided";
    case "workspace_id":
      return scope.workspaceId || "not provided";
    case "owner_user_id":
      return scope.ownerUserId || "not provided";
  }
}

export function getSupabaseImportPreflightScopeChangeDetails({
  current,
  preflight,
}: {
  current: SupabaseImportCurrentScope;
  preflight?: SupabaseImportPreflightScope;
}): SupabaseImportPreflightScopeChangeDetail[] {
  if (!preflight) {
    return [];
  }

  const normalizedCurrent = normalizeSupabaseImportCurrentScope(current);

  return getSupabaseImportPreflightScopeChanges({
    current: normalizedCurrent,
    preflight,
  }).map((field) => ({
    currentValue: getSupabaseImportScopeValue(normalizedCurrent, field),
    field,
    label: scopeChangeLabels[field],
    preflightValue: getSupabaseImportScopeValue(preflight, field),
  }));
}

export function formatSupabaseImportPreflightScopeChanges(
  changes: SupabaseImportPreflightScopeChange[],
) {
  if (changes.length === 0) {
    return "";
  }

  return `Changed scope inputs: ${changes
    .map((change) => scopeChangeLabels[change])
    .join(", ")}`;
}

export function formatSupabaseImportPreflightScopeChangeDetails(
  details: SupabaseImportPreflightScopeChangeDetail[],
) {
  if (details.length === 0) {
    return "";
  }

  return `Changed scope inputs: ${details
    .map(
      (detail) =>
        `${detail.label} (preflight: ${detail.preflightValue} -> current: ${detail.currentValue})`,
    )
    .join(", ")}`;
}

export function getSupabaseImportPreflightScopeError(
  status: SupabaseImportPreflightScopeStatus,
) {
  if (status === "missing") {
    return "먼저 Supabase import API preflight를 실행하세요.";
  }

  if (status === "stale") {
    return "현재 백업 fingerprint 또는 workspace/owner UUID가 preflight 실행 당시와 다릅니다. API preflight를 다시 실행하세요.";
  }

  return "";
}
