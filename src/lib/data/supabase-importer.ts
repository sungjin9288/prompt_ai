import {
  isSupabaseWorkspaceUuid,
  type SupabaseImportDryRun,
} from "./supabase-import-dry-run";
import {
  createSupabaseImportExecutionPlan,
  type SupabaseImportExecutionBatch,
  type SupabaseImportExecutionPlan,
  type SupabaseImportExecutionPlanOptions,
} from "./supabase-import-execution-plan";

export interface SupabaseImportInsertRequest {
  dependency: string;
  order: number;
  rows: Record<string, unknown>[];
  table: string;
}

export interface SupabaseImportInsertResult {
  insertedRows?: number;
  note?: string;
}

export interface SupabaseImportInsertAdapter {
  insertRows: (
    request: SupabaseImportInsertRequest,
  ) => Promise<SupabaseImportInsertResult | void>;
}

export interface SupabaseImporterValidationResult {
  blockers: string[];
  ok: boolean;
}

export interface SupabaseImporterTableResult {
  dependency: string;
  expectedRows: number;
  insertedRows: number;
  note?: string;
  order: number;
  status: "inserted" | "failed";
  table: string;
}

export interface SupabaseImporterRunResult {
  blockers: string[];
  completedRows: number;
  failedTable?: string;
  plan: SupabaseImportExecutionPlan;
  status: "blocked" | "completed" | "failed";
  tableResults: SupabaseImporterTableResult[];
  totalRows: number;
}

function containsPendingReference(value: unknown): boolean {
  if (typeof value === "string") {
    return value.includes("pending-");
  }

  if (Array.isArray(value)) {
    return value.some(containsPendingReference);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(containsPendingReference);
  }

  return false;
}

function getInsertRows(batch: SupabaseImportExecutionBatch) {
  return batch.rows.map((row) => row.payload);
}

function getInsertErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unknown insert error";
}

export function validateSupabaseImportExecutionPlan(
  plan: SupabaseImportExecutionPlan,
): SupabaseImporterValidationResult {
  const blockers: string[] = [];

  if (!isSupabaseWorkspaceUuid(plan.workspaceId)) {
    blockers.push("workspaceId must be a Supabase UUID.");
  }

  if (!isSupabaseWorkspaceUuid(plan.ownerUserId)) {
    blockers.push("ownerUserId must be a Supabase UUID.");
  }

  if (plan.unresolvedPendingReferences.length > 0) {
    blockers.push(
      `${plan.unresolvedPendingReferences.length} unresolved pending-* references remain in the execution plan.`,
    );
  }

  plan.batches.forEach((batch) => {
    batch.rows.forEach((row, rowIndex) => {
      if (!isSupabaseWorkspaceUuid(row.resolvedId)) {
        blockers.push(
          `${batch.table} row ${rowIndex + 1} resolvedId is not a UUID.`,
        );
      }

      if (containsPendingReference(row.payload)) {
        blockers.push(
          `${batch.table} row ${rowIndex + 1} payload still contains pending-* text.`,
        );
      }
    });
  });

  return {
    blockers,
    ok: blockers.length === 0,
  };
}

export function getSupabaseImportInsertRequests(
  plan: SupabaseImportExecutionPlan,
): SupabaseImportInsertRequest[] {
  return plan.batches
    .filter((batch) => batch.rows.length > 0)
    .map((batch) => ({
      dependency: batch.dependency,
      order: batch.order,
      rows: getInsertRows(batch),
      table: batch.table,
    }));
}

export async function runSupabaseImportExecutionPlan(
  plan: SupabaseImportExecutionPlan,
  adapter: SupabaseImportInsertAdapter,
): Promise<SupabaseImporterRunResult> {
  const validation = validateSupabaseImportExecutionPlan(plan);

  if (!validation.ok) {
    return {
      blockers: validation.blockers,
      completedRows: 0,
      plan,
      status: "blocked",
      tableResults: [],
      totalRows: plan.totalRows,
    };
  }

  const tableResults: SupabaseImporterTableResult[] = [];

  for (const request of getSupabaseImportInsertRequests(plan)) {
    try {
      const result = await adapter.insertRows(request);
      const insertedRows = result?.insertedRows ?? request.rows.length;

      if (insertedRows !== request.rows.length) {
        tableResults.push({
          dependency: request.dependency,
          expectedRows: request.rows.length,
          insertedRows,
          note:
            result?.note ||
            `Inserted row count ${insertedRows} did not match expected ${request.rows.length}.`,
          order: request.order,
          status: "failed",
          table: request.table,
        });

        return {
          blockers: [],
          completedRows: tableResults.reduce(
            (sum, tableResult) => sum + tableResult.insertedRows,
            0,
          ),
          failedTable: request.table,
          plan,
          status: "failed",
          tableResults,
          totalRows: plan.totalRows,
        };
      }

      tableResults.push({
        dependency: request.dependency,
        expectedRows: request.rows.length,
        insertedRows,
        note: result?.note,
        order: request.order,
        status: "inserted",
        table: request.table,
      });
    } catch (error) {
      tableResults.push({
        dependency: request.dependency,
        expectedRows: request.rows.length,
        insertedRows: 0,
        note: getInsertErrorMessage(error),
        order: request.order,
        status: "failed",
        table: request.table,
      });

      return {
        blockers: [],
        completedRows: tableResults.reduce(
          (sum, result) => sum + result.insertedRows,
          0,
        ),
        failedTable: request.table,
        plan,
        status: "failed",
        tableResults,
        totalRows: plan.totalRows,
      };
    }
  }

  return {
    blockers: [],
    completedRows: tableResults.reduce(
      (sum, result) => sum + result.insertedRows,
      0,
    ),
    plan,
    status: "completed",
    tableResults,
    totalRows: plan.totalRows,
  };
}

export function createSupabaseImporterPlan(
  dryRun: SupabaseImportDryRun,
  options: SupabaseImportExecutionPlanOptions,
) {
  return createSupabaseImportExecutionPlan(dryRun, options);
}

export function buildSupabaseImporterAdapterContractText(
  plan: SupabaseImportExecutionPlan,
) {
  const validation = validateSupabaseImportExecutionPlan(plan);
  const requests = getSupabaseImportInsertRequests(plan);

  return [
    "# Prompt AI Studio Supabase Importer Adapter Contract",
    "",
    "This contract is for the future server-side importer. It defines the insert order and adapter shape without requiring a Supabase SDK dependency in the MVP.",
    "",
    "## Adapter shape",
    "```ts",
    "interface SupabaseImportInsertAdapter {",
    "  insertRows(request: {",
    "    table: string;",
    "    order: number;",
    "    dependency: string;",
    "    rows: Record<string, unknown>[];",
    "  }): Promise<{ insertedRows?: number; note?: string } | void>;",
    "}",
    "```",
    "",
    "## Validation",
    `- status: ${validation.ok ? "ready" : "blocked"}`,
    ...(validation.blockers.length > 0
      ? validation.blockers.map((blocker) => `- blocker: ${blocker}`)
      : ["- blocker: none"]),
    "",
    "## Insert order",
    ...requests.map(
      (request) =>
        `- ${request.order}. ${request.table}: ${request.rows.length} rows / dependency: ${request.dependency}`,
    ),
    "",
    "## Runner acceptance",
    "- The runner must stop before insert if validation has blockers.",
    "- The runner must insert tables in the listed order.",
    "- The adapter must use a service-role server context, never a browser client.",
    "- After a completed run, operators must run row count, relationship, pending ID, and RLS owner access audits.",
  ].join("\n");
}
