import {
  isSupabaseWorkspaceUuid,
  type SupabaseImportBatch,
  type SupabaseImportDryRun,
} from "./supabase-import-dry-run";

export interface SupabaseImportUuidMapOptions {
  createUuid?: (pendingId: string) => string;
  ownerUserId: string;
  workspaceId: string;
}

export interface SupabaseImportExecutionPlanOptions
  extends SupabaseImportUuidMapOptions {
  uuidByPendingId?: Record<string, string>;
}

export interface SupabaseImportExecutionRow {
  localId?: string;
  pendingId: string;
  resolvedId: string;
  payload: Record<string, unknown>;
}

export interface SupabaseImportExecutionBatch {
  order: number;
  table: string;
  dependency: string;
  rows: SupabaseImportExecutionRow[];
}

export interface SupabaseImportPendingReference {
  table: string;
  row: number;
  field: string;
  value: string;
}

export interface SupabaseImportArchiveTraceField {
  table: "deleted_prompt_assets";
  row: number;
  field: "original_prompt_asset_id" | "prompt_snapshot";
  value: string;
}

export interface SupabaseImportExecutionPlan {
  archiveTraceFields: SupabaseImportArchiveTraceField[];
  batches: SupabaseImportExecutionBatch[];
  generatedUuidCount: number;
  ownerUserId: string;
  totalRows: number;
  unresolvedPendingReferences: SupabaseImportPendingReference[];
  uuidByPendingId: Record<string, string>;
  workspaceId: string;
}

const PENDING_ID_PREFIX = "pending-";
const WORKSPACE_PENDING_ID = "pending-workspace-1";
const OWNER_USER_PENDING_ID = "pending-auth-user-1";

function createDefaultUuid() {
  const randomUuid = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);

  if (!randomUuid) {
    throw new Error("crypto.randomUUID is required to create an import plan.");
  }

  return randomUuid();
}

function assertSupabaseUuid(label: string, value: string) {
  if (!isSupabaseWorkspaceUuid(value)) {
    throw new Error(`${label} must be a Supabase UUID.`);
  }
}

function normalizeUuidMap(options: SupabaseImportExecutionPlanOptions) {
  const workspaceId = options.workspaceId.trim();
  const ownerUserId = options.ownerUserId.trim();

  assertSupabaseUuid("workspaceId", workspaceId);
  assertSupabaseUuid("ownerUserId", ownerUserId);

  return {
    createUuid: options.createUuid ?? createDefaultUuid,
    ownerUserId,
    providedMap: options.uuidByPendingId ?? {},
    workspaceId,
  };
}

export function createSupabaseImportUuidMap(
  dryRun: SupabaseImportDryRun,
  options: SupabaseImportExecutionPlanOptions,
) {
  const { createUuid, ownerUserId, providedMap, workspaceId } =
    normalizeUuidMap(options);
  const uuidByPendingId: Record<string, string> = {
    ...providedMap,
    [OWNER_USER_PENDING_ID]: ownerUserId,
    [WORKSPACE_PENDING_ID]: workspaceId,
  };

  for (const batch of dryRun.batches) {
    for (const row of batch.rows) {
      if (row.pendingId === WORKSPACE_PENDING_ID) {
        uuidByPendingId[row.pendingId] = workspaceId;
        continue;
      }

      if (!uuidByPendingId[row.pendingId]) {
        uuidByPendingId[row.pendingId] = createUuid(row.pendingId);
      }
    }
  }

  Object.entries(uuidByPendingId).forEach(([pendingId, uuid]) => {
    assertSupabaseUuid(`uuidByPendingId.${pendingId}`, uuid);
  });

  return uuidByPendingId;
}

function fieldPath(parts: Array<string | number>) {
  return parts.map(String).join(".");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolvePendingValue({
  path,
  pendingReferences,
  uuidByPendingId,
  value,
}: {
  path: Array<string | number>;
  pendingReferences: SupabaseImportPendingReference[];
  uuidByPendingId: Record<string, string>;
  value: unknown;
}): unknown {
  if (typeof value === "string") {
    const mappedUuid = uuidByPendingId[value];

    if (mappedUuid) {
      return mappedUuid;
    }

    if (value.includes(PENDING_ID_PREFIX)) {
      pendingReferences.push({
        field: fieldPath(path),
        row: Number(path[1]) || 0,
        table: String(path[0] || ""),
        value,
      });
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      resolvePendingValue({
        path: [...path, index],
        pendingReferences,
        uuidByPendingId,
        value: item,
      }),
    );
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (key === "prompt_snapshot") {
          scanPendingReferences({
            path: [...path, key],
            pendingReferences,
            value: item,
          });
          return [key, item];
        }

        return [
          key,
          resolvePendingValue({
            path: [...path, key],
            pendingReferences,
            uuidByPendingId,
            value: item,
          }),
        ];
      }),
    );
  }

  return value;
}

function scanPendingReferences({
  path,
  pendingReferences,
  value,
}: {
  path: Array<string | number>;
  pendingReferences: SupabaseImportPendingReference[];
  value: unknown;
}) {
  if (typeof value === "string") {
    if (value.includes(PENDING_ID_PREFIX)) {
      pendingReferences.push({
        field: fieldPath(path),
        row: Number(path[1]) || 0,
        table: String(path[0] || ""),
        value,
      });
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      scanPendingReferences({
        path: [...path, index],
        pendingReferences,
        value: item,
      }),
    );
    return;
  }

  if (isRecord(value)) {
    Object.entries(value).forEach(([key, item]) =>
      scanPendingReferences({
        path: [...path, key],
        pendingReferences,
        value: item,
      }),
    );
  }
}

function getArchiveTraceFields(
  batch: SupabaseImportBatch,
): SupabaseImportArchiveTraceField[] {
  if (batch.table !== "deleted_prompt_assets") {
    return [];
  }

  return batch.rows.flatMap((row, rowIndex) => {
    const originalPromptAssetId = row.payload.original_prompt_asset_id;

    return [
      typeof originalPromptAssetId === "string"
        ? {
            field: "original_prompt_asset_id" as const,
            row: rowIndex + 1,
            table: "deleted_prompt_assets" as const,
            value: originalPromptAssetId,
          }
        : null,
      {
        field: "prompt_snapshot" as const,
        row: rowIndex + 1,
        table: "deleted_prompt_assets" as const,
        value: row.localId || "snapshot",
      },
    ].filter((item): item is SupabaseImportArchiveTraceField => item !== null);
  });
}

export function createSupabaseImportExecutionPlan(
  dryRun: SupabaseImportDryRun,
  options: SupabaseImportExecutionPlanOptions,
): SupabaseImportExecutionPlan {
  const workspaceId = options.workspaceId.trim();
  const ownerUserId = options.ownerUserId.trim();
  const uuidByPendingId = createSupabaseImportUuidMap(dryRun, options);
  const unresolvedPendingReferences: SupabaseImportPendingReference[] = [];

  const batches = dryRun.batches.map((batch) => ({
    dependency: batch.dependency,
    order: batch.order,
    rows: batch.rows.map((row, rowIndex) => ({
      localId: row.localId,
      pendingId: row.pendingId,
      payload: resolvePendingValue({
        path: [batch.table, rowIndex + 1],
        pendingReferences: unresolvedPendingReferences,
        uuidByPendingId,
        value: row.payload,
      }) as Record<string, unknown>,
      resolvedId: uuidByPendingId[row.pendingId],
    })),
    table: batch.table,
  }));

  return {
    archiveTraceFields: dryRun.batches.flatMap(getArchiveTraceFields),
    batches,
    generatedUuidCount: Object.keys(uuidByPendingId).length,
    ownerUserId,
    totalRows: dryRun.totalRows,
    unresolvedPendingReferences,
    uuidByPendingId,
    workspaceId,
  };
}

export function buildSupabaseImportExecutionPlanText(
  dryRun: SupabaseImportDryRun,
  options: SupabaseImportExecutionPlanOptions,
) {
  const plan = createSupabaseImportExecutionPlan(dryRun, options);
  const insertPayloadBatches = plan.batches.map((batch) => ({
    dependency: batch.dependency,
    order: batch.order,
    rows: batch.rows.map((row) => row.payload),
    table: batch.table,
  }));

  return [
    "# Prompt AI Studio Supabase Import Execution Plan",
    "",
    "This document is generated locally. It does not connect to Supabase or write data.",
    "",
    "## Summary",
    `- workspaceId: ${plan.workspaceId}`,
    `- ownerUserId: ${plan.ownerUserId}`,
    `- totalRows: ${plan.totalRows}`,
    `- batches: ${plan.batches.length}`,
    `- UUID map entries: ${plan.generatedUuidCount}`,
    `- archive trace fields preserved: ${plan.archiveTraceFields.length}`,
    `- unresolved pending references: ${plan.unresolvedPendingReferences.length}`,
    "",
    "## Acceptance checks before insert",
    "- [ ] No `pending-*` value remains in the execution payload.",
    "- [ ] `deleted_prompt_assets.original_prompt_asset_id` stays as the original local prompt ID.",
    "- [ ] `deleted_prompt_assets.prompt_snapshot` stays as the original deleted prompt JSON.",
    "- [ ] `workspaces.owner_user_id` and `workspace_members.user_id` match the target Supabase auth user.",
    "- [ ] After insert, run row count verification, relationship verification, pending ID audit, and RLS owner access audit.",
    "",
    "## Unresolved pending references",
    ...(plan.unresolvedPendingReferences.length > 0
      ? plan.unresolvedPendingReferences.map(
          (reference) =>
            `- ${reference.table} row ${reference.row} ${reference.field}: ${reference.value}`,
        )
      : ["- None"]),
    "",
    "## Archive trace fields",
    ...(plan.archiveTraceFields.length > 0
      ? plan.archiveTraceFields.map(
          (field) =>
            `- ${field.table} row ${field.row} ${field.field}: ${field.value}`,
        )
      : ["- None"]),
    "",
    "## UUID map",
    "```json",
    JSON.stringify(plan.uuidByPendingId, null, 2),
    "```",
    "",
    "## Insert payload batches",
    "```json",
    JSON.stringify(insertPayloadBatches, null, 2),
    "```",
  ].join("\n");
}
