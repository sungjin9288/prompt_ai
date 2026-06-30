import { NextResponse } from "next/server";
import { createSupabaseImportDryRun } from "@/lib/data/supabase-import-dry-run";
import {
  buildSupabaseImporterAdapterContractText,
  createSupabaseImporterPlan,
  getSupabaseImportInsertRequests,
  runSupabaseImportExecutionPlan,
  validateSupabaseImportExecutionPlan,
} from "@/lib/data/supabase-importer";
import {
  createSupabaseRestImportAdapter,
  getSupabaseRestImportEnvironmentStatus,
} from "@/lib/data/supabase-rest-import-adapter";
import type { WorkspaceBackup } from "@/lib/storage/workspace-backup";

const SUPABASE_IMPORT_CONFIRMATION = "RUN_SUPABASE_IMPORT";

interface SupabaseImportRequestBody {
  backup?: unknown;
  backupJson?: unknown;
  confirmation?: unknown;
  execute?: unknown;
  includePayload?: unknown;
  ownerUserId?: unknown;
  workspaceId?: unknown;
}

type SupabaseImportInsertRequests = ReturnType<
  typeof getSupabaseImportInsertRequests
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBackupPayload(body: SupabaseImportRequestBody) {
  if (typeof body.backupJson === "string") {
    try {
      return JSON.parse(body.backupJson) as unknown;
    } catch {
      throw new Error("backupJson must be valid JSON.");
    }
  }

  if (body.backup) {
    return body.backup;
  }

  throw new Error("backup or backupJson is required.");
}

function parseWorkspaceBackupForImport(body: SupabaseImportRequestBody) {
  const backup = parseBackupPayload(body);

  if (!isRecord(backup)) {
    throw new Error("backup must be an object.");
  }

  if (backup.app !== "prompt-ai-studio") {
    throw new Error("backup.app must be prompt-ai-studio.");
  }

  if (backup.schemaVersion !== 1) {
    throw new Error("Only backup schemaVersion 1 is supported.");
  }

  if (!isRecord(backup.data)) {
    throw new Error("backup.data is required.");
  }

  const data = backup.data;
  const hasRequiredData =
    isRecord(data.userProfile) &&
    isRecord(data.companyProfile) &&
    Array.isArray(data.prompts) &&
    Array.isArray(data.memories) &&
    Array.isArray(data.skills);

  if (!hasRequiredData) {
    throw new Error(
      "backup.data must include userProfile, companyProfile, prompts, memories, and skills.",
    );
  }

  const normalizedData = {
    companyProfile: data.companyProfile,
    deletedPrompts: Array.isArray(data.deletedPrompts) ? data.deletedPrompts : [],
    memories: data.memories,
    prompts: data.prompts,
    skills: data.skills,
    userProfile: data.userProfile,
  } as WorkspaceBackup["data"];

  return {
    app: "prompt-ai-studio",
    counts: normalizeBackupCounts(normalizedData),
    data: normalizedData,
    exportedAt:
      typeof backup.exportedAt === "string"
        ? backup.exportedAt
        : new Date().toISOString(),
    schemaVersion: 1,
  } as WorkspaceBackup;
}

function parseStringField(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function countNestedArrayRows(
  rows: unknown[],
  field: "feedback" | "versions",
) {
  let count = 0;

  rows.forEach((row) => {
    if (!isRecord(row) || !Array.isArray(row[field])) {
      return;
    }

    count += row[field].length;
  });

  return count;
}

function normalizeBackupCounts(
  data: WorkspaceBackup["data"],
): WorkspaceBackup["counts"] {
  return {
    deletedPrompts: data.deletedPrompts.length,
    feedback: countNestedArrayRows(data.prompts, "feedback"),
    memories: data.memories.length,
    promptVersions: countNestedArrayRows(data.prompts, "versions"),
    prompts: data.prompts.length,
    skillRuns: 0,
    skills: data.skills.length,
  };
}

function summarizeInsertRequests(
  requests: SupabaseImportInsertRequests,
  includePayload: boolean,
) {
  return requests.map((request) => ({
    dependency: request.dependency,
    order: request.order,
    rows: includePayload ? request.rows : undefined,
    rowCount: request.rows.length,
    table: request.table,
  }));
}

type SupabaseImportEnvironmentStatus = ReturnType<
  typeof getSupabaseRestImportEnvironmentStatus
>;
type SupabaseImportInsertOrder = ReturnType<typeof summarizeInsertRequests>;
type SupabaseImportRouteInsertOrderItem = SupabaseImportInsertOrder[number];
type SupabaseImportPlanValidation = ReturnType<
  typeof validateSupabaseImportExecutionPlan
>;
type SupabaseImportRouteResultSummary = {
  completedRows: number;
  failedTable?: string;
  status: string;
  tableResults: Array<{
    expectedRows: number;
    insertedRows: number;
    note?: string;
    order: number;
    status: string;
    table: string;
  }>;
  totalRows: number;
};
type SupabaseImportRouteTableResult =
  SupabaseImportRouteResultSummary["tableResults"][number];

function formatSupabaseImportRouteTableResult(
  tableResult: SupabaseImportRouteTableResult,
) {
  const note = tableResult.note ? ` / ${tableResult.note}` : "";

  return `- ${tableResult.order}. ${tableResult.table}: ${tableResult.status} / inserted ${tableResult.insertedRows}/${tableResult.expectedRows}${note}`;
}

function formatSupabaseImportRouteInsertOrderItem(
  item: SupabaseImportRouteInsertOrderItem,
) {
  return `- ${item.order}. ${item.table}: ${item.rowCount} rows / dependency: ${item.dependency}`;
}

function formatSupabaseImportRouteValidationBlocker(blocker: string) {
  return `- ${blocker}`;
}

function buildSupabaseImportRouteAuditArtifactText({
  checkedAt,
  environment,
  error,
  execute,
  insertOrder,
  requiredConfirmation,
  result,
  status,
  validation,
}: {
  checkedAt: string;
  environment: SupabaseImportEnvironmentStatus;
  error?: string;
  execute: boolean;
  insertOrder: SupabaseImportInsertOrder;
  requiredConfirmation: string;
  result?: SupabaseImportRouteResultSummary;
  status: string;
  validation: SupabaseImportPlanValidation;
}) {
  return [
    "# Prompt AI Studio Supabase Import Route Audit",
    "",
    `- checkedAt: ${checkedAt}`,
    `- route: POST /api/data/supabase-import`,
    `- executeRequested: ${execute ? "true" : "false"}`,
    `- status: ${status}`,
    `- validation: ${validation.ok ? "ok" : "blocked"}`,
    `- executionEnabled: ${environment.executionEnabled}`,
    `- supabaseUrlConfigured: ${environment.supabaseUrlConfigured}`,
    `- serviceRoleKeyConfigured: ${environment.serviceRoleKeyConfigured}`,
    `- requiredConfirmation: ${requiredConfirmation}`,
    ...(error ? [`- error: ${error}`] : []),
    "",
    "## Validation blockers",
    ...(validation.blockers.length > 0
      ? validation.blockers.map(formatSupabaseImportRouteValidationBlocker)
      : ["- none"]),
    "",
    "## Insert order",
    ...(insertOrder.length > 0
      ? insertOrder.map(formatSupabaseImportRouteInsertOrderItem)
      : ["- none"]),
    "",
    "## Execution result",
    ...(result
      ? [
          `- status: ${result.status}`,
          `- completedRows: ${result.completedRows}`,
          `- totalRows: ${result.totalRows}`,
          `- failedTable: ${result.failedTable || "none"}`,
          "",
          "### Table results",
          ...result.tableResults.map(formatSupabaseImportRouteTableResult),
        ]
      : ["- not executed"]),
    "",
    "## Secret handling",
    "- This artifact intentionally contains only configuration booleans, not Supabase keys or raw secret values.",
    "- Do not attach raw service-role secret values or API keys to migration evidence.",
  ].join("\n");
}

function createSupabaseImportBlockedResponse({
  adapterContractText,
  checkedAt,
  environmentStatus,
  error,
  execute,
  httpStatus,
  insertOrder,
  status,
  validation,
}: {
  adapterContractText: string;
  checkedAt: string;
  environmentStatus: SupabaseImportEnvironmentStatus;
  error: string;
  execute: boolean;
  httpStatus: number;
  insertOrder: SupabaseImportInsertOrder;
  status: string;
  validation: SupabaseImportPlanValidation;
}) {
  return NextResponse.json(
    {
      adapterContractText,
      auditArtifactText: buildSupabaseImportRouteAuditArtifactText({
        checkedAt,
        environment: environmentStatus,
        error,
        execute,
        insertOrder,
        requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION,
        status,
        validation,
      }),
      environment: environmentStatus,
      error,
      insertOrder,
      requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION,
      status,
      validation,
    },
    { status: httpStatus },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SupabaseImportRequestBody;
    const checkedAt = new Date().toISOString();
    const execute = body.execute === true;
    const includePayload = body.includePayload === true;
    const environmentStatus = getSupabaseRestImportEnvironmentStatus();
    const workspaceId = parseStringField(body.workspaceId, "workspaceId");
    const ownerUserId = parseStringField(body.ownerUserId, "ownerUserId");
    const backup = parseWorkspaceBackupForImport(body);
    const dryRun = createSupabaseImportDryRun(backup);
    const plan = createSupabaseImporterPlan(dryRun, {
      ownerUserId,
      workspaceId,
    });
    const validation = validateSupabaseImportExecutionPlan(plan);
    const insertRequests = getSupabaseImportInsertRequests(plan);
    const preflightInsertOrder = summarizeInsertRequests(
      insertRequests,
      includePayload,
    );
    const operatorInsertOrder = summarizeInsertRequests(
      insertRequests,
      false,
    );
    const adapterContractText = buildSupabaseImporterAdapterContractText(plan);

    if (execute) {
      if (!environmentStatus.executionEnabled) {
        const error =
          "Supabase import execution is disabled. Set SUPABASE_IMPORT_EXECUTION_ENABLED=true in a server-only environment before executing.";

        return createSupabaseImportBlockedResponse({
          adapterContractText,
          checkedAt,
          environmentStatus,
          error,
          execute,
          httpStatus: 403,
          insertOrder: operatorInsertOrder,
          status: "execution-disabled",
          validation,
        });
      }

      if (body.confirmation !== SUPABASE_IMPORT_CONFIRMATION) {
        const error = `confirmation must equal ${SUPABASE_IMPORT_CONFIRMATION}.`;

        return createSupabaseImportBlockedResponse({
          adapterContractText,
          checkedAt,
          environmentStatus,
          error,
          execute,
          httpStatus: 400,
          insertOrder: operatorInsertOrder,
          status: "confirmation-required",
          validation,
        });
      }

      if (
        !environmentStatus.supabaseUrlConfigured ||
        !environmentStatus.serviceRoleKeyConfigured
      ) {
        const error =
          "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for execution.";

        return createSupabaseImportBlockedResponse({
          adapterContractText,
          checkedAt,
          environmentStatus,
          error,
          execute,
          httpStatus: 503,
          insertOrder: operatorInsertOrder,
          status: "environment-incomplete",
          validation,
        });
      }

      if (!validation.ok) {
        const error =
          "Supabase import execution plan has validation blockers.";

        return createSupabaseImportBlockedResponse({
          adapterContractText,
          checkedAt,
          environmentStatus,
          error,
          execute,
          httpStatus: 422,
          insertOrder: operatorInsertOrder,
          status: "validation-blocked",
          validation,
        });
      }

      const adapter = createSupabaseRestImportAdapter({
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      });
      const result = await runSupabaseImportExecutionPlan(plan, adapter);
      const resultSummary: SupabaseImportRouteResultSummary = {
        completedRows: result.completedRows,
        failedTable: result.failedTable,
        status: result.status,
        tableResults: result.tableResults,
        totalRows: result.totalRows,
      };

      return NextResponse.json({
        adapterContractText,
        auditArtifactText: buildSupabaseImportRouteAuditArtifactText({
          checkedAt,
          environment: environmentStatus,
          execute,
          insertOrder: operatorInsertOrder,
          requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION,
          result: resultSummary,
          status: result.status,
          validation,
        }),
        environment: environmentStatus,
        result: resultSummary,
        status: result.status,
        validation,
      });
    }

    const preflightStatus = validation.ok ? "ready" : "blocked";

    return NextResponse.json({
      adapterContractText,
      auditArtifactText: buildSupabaseImportRouteAuditArtifactText({
        checkedAt,
        environment: environmentStatus,
        execute,
        insertOrder: preflightInsertOrder,
        requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION,
        status: preflightStatus,
        validation,
      }),
      dryRun: {
        batches: dryRun.batches.length,
        totalRows: dryRun.totalRows,
        warnings: dryRun.warningItems,
      },
      insertOrder: preflightInsertOrder,
      requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION,
      plan: {
        archiveTraceFields: plan.archiveTraceFields.length,
        generatedUuidCount: plan.generatedUuidCount,
        ownerUserId: plan.ownerUserId,
        totalRows: plan.totalRows,
        unresolvedPendingReferences: plan.unresolvedPendingReferences,
        workspaceId: plan.workspaceId,
      },
      status: preflightStatus,
      validation,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid Supabase import request.",
        status: "invalid-request",
      },
      { status: 400 },
    );
  }
}
