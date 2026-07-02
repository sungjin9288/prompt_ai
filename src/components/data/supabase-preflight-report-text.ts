import { createSupabaseImporterPlan } from "@/lib/data/supabase-importer";
import { formatBackupDate, formatJsonLength } from "./data-view-shared";

export interface SupabaseImportApiPreflightState {
  backupFingerprint?: string;
  checkedAt?: string;
  data?: SupabaseImportApiPreflightResponse;
  error?: string;
  ownerUserId?: string;
  status: "error" | "idle" | "loading" | "ready";
  workspaceId?: string;
}

export interface SupabaseImportApiPreflightResponse {
  auditArtifactText?: string;
  dryRun?: {
    batches: number;
    totalRows: number;
    warnings: unknown[];
  };
  error?: string;
  insertOrder?: Array<{
    dependency: string;
    order: number;
    rowCount: number;
    table: string;
  }>;
  plan?: {
    archiveTraceFields: number;
    generatedUuidCount: number;
    totalRows: number;
    unresolvedPendingReferences: unknown[];
  };
  requiredConfirmation?: string;
  status: string;
  validation?: {
    blockers: string[];
    ok: boolean;
  };
}

export function buildSupabaseImportApiPreflightReportText({
  checkedAt,
  response,
}: {
  checkedAt?: string;
  response: SupabaseImportApiPreflightResponse;
}) {
  return [
    "# Prompt AI Studio Supabase Import API Preflight",
    "",
    `- checkedAt: ${checkedAt || new Date().toISOString()}`,
    `- status: ${response.status}`,
    `- validation: ${response.validation?.ok ? "ok" : "blocked"}`,
    `- dryRunRows: ${response.dryRun?.totalRows ?? response.plan?.totalRows ?? 0}`,
    `- dryRunBatches: ${response.dryRun?.batches ?? 0}`,
    `- insertTables: ${response.insertOrder?.length ?? 0}`,
    `- generatedUuidCount: ${response.plan?.generatedUuidCount ?? 0}`,
    `- archiveTraceFields: ${response.plan?.archiveTraceFields ?? 0}`,
    `- unresolvedPendingReferences: ${
      response.plan?.unresolvedPendingReferences.length ?? 0
    }`,
    `- requiredConfirmation: ${
      response.requiredConfirmation || "not provided"
    }`,
    "",
    "## Validation blockers",
    ...(response.validation?.blockers.length
      ? response.validation.blockers.map((blocker) => `- ${blocker}`)
      : ["- none"]),
    "",
    "## Insert order",
    ...(response.insertOrder?.length
      ? response.insertOrder.map(
          (item) =>
            `- ${item.order}. ${item.table}: ${item.rowCount} rows / dependency: ${item.dependency}`,
        )
      : ["- none"]),
    "",
    "## Execution guard",
    "- This preflight used `execute: false` and did not write to Supabase.",
    "- Real execution still requires server env gates and `confirmation: RUN_SUPABASE_IMPORT`.",
  ].join("\n");
}

export function buildSupabaseImportApiPreflightReportManualCopyText({
  backupFingerprint,
  checkedAt,
  ownerUserId,
  preflightText,
  response,
  workspaceId,
}: {
  backupFingerprint: string;
  checkedAt?: string;
  ownerUserId: string;
  preflightText: string;
  response: SupabaseImportApiPreflightResponse;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Import API Preflight",
    "",
    "## Preflight 식별",
    `- 확인 시각: ${formatBackupDate(checkedAt || new Date().toISOString())}`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 리포트 길이: ${formatJsonLength(preflightText)}`,
    "",
    "## Route validation 요약",
    `- Route status: ${response.status}`,
    `- Validation: ${response.validation?.ok ? "ok" : "blocked"}`,
    `- Dry-run rows: ${
      response.dryRun?.totalRows ?? response.plan?.totalRows ?? 0
    }`,
    `- Insert tables: ${response.insertOrder?.length ?? 0}`,
    `- Generated UUIDs: ${response.plan?.generatedUuidCount ?? 0}`,
    `- Unresolved pending references: ${
      response.plan?.unresolvedPendingReferences.length ?? 0
    }`,
    `- Required confirmation: ${
      response.requiredConfirmation || "not provided"
    }`,
    "",
    "## API preflight report",
    preflightText,
  ].join("\n");
}

export function buildSupabaseImportApiAuditArtifactManualCopyText({
  artifactText,
  backupFingerprint,
  checkedAt,
  ownerUserId,
  response,
  workspaceId,
}: {
  artifactText: string;
  backupFingerprint: string;
  checkedAt?: string;
  ownerUserId: string;
  response: SupabaseImportApiPreflightResponse;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Import Route Audit Artifact",
    "",
    "## Audit artifact 식별",
    `- 확인 시각: ${formatBackupDate(checkedAt || new Date().toISOString())}`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- Artifact 길이: ${formatJsonLength(artifactText)}`,
    "",
    "## Route audit 요약",
    `- Route status: ${response.status}`,
    `- Execute requested: false (API preflight)`,
    `- Validation: ${response.validation?.ok ? "ok" : "blocked"}`,
    `- Validation blockers: ${response.validation?.blockers.length ?? 0}`,
    `- Dry-run rows: ${
      response.dryRun?.totalRows ?? response.plan?.totalRows ?? 0
    }`,
    `- Insert tables: ${response.insertOrder?.length ?? 0}`,
    `- Required confirmation: ${
      response.requiredConfirmation || "not provided"
    }`,
    "",
    "## Route audit artifact",
    artifactText,
  ].join("\n");
}

export function buildSupabaseImporterAdapterContractManualCopyText({
  contractText,
  plan,
}: {
  contractText: string;
  plan: ReturnType<typeof createSupabaseImporterPlan>;
}) {
  return [
    "# Prompt AI Studio Supabase Importer Adapter Contract",
    "",
    "## Adapter 계약 식별",
    `- workspace_id: ${plan.workspaceId}`,
    `- owner_user_id: ${plan.ownerUserId}`,
    `- 계약 길이: ${formatJsonLength(contractText)}`,
    "",
    "## Import plan 요약",
    `- Total rows: ${plan.totalRows}`,
    `- Insert batches: ${plan.batches.length}`,
    `- Generated UUIDs: ${plan.generatedUuidCount}`,
    `- Archive trace fields: ${plan.archiveTraceFields.length}`,
    `- Unresolved pending references: ${plan.unresolvedPendingReferences.length}`,
    "",
    "## Adapter gate 요약",
    "- Adapter must run in a service-role server context.",
    "- Browser/public Supabase clients must not execute importer writes.",
    "- Runner must stop before insert if validation has blockers.",
    "- Runner must insert tables in the listed order.",
    "- Operators must run row count, relationship, pending ID, and RLS owner audits after import.",
    "",
    "## Adapter contract",
    contractText,
  ].join("\n");
}
