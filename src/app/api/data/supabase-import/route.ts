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

function parseBackupPayload(requestBody: SupabaseImportRequestBody) {
  if (typeof requestBody.backupJson === "string") {
    try {
      return JSON.parse(requestBody.backupJson) as unknown;
    } catch {
      throw new Error("backupJson must be valid JSON.");
    }
  }

  if (requestBody.backup) {
    return requestBody.backup;
  }

  throw new Error("backup or backupJson is required.");
}

function parseWorkspaceBackupForImport(requestBody: SupabaseImportRequestBody) {
  const backupPayload = parseBackupPayload(requestBody);

  if (!isRecord(backupPayload)) {
    throw new Error("backup must be an object.");
  }

  if (backupPayload.app !== "prompt-ai-studio") {
    throw new Error("backup.app must be prompt-ai-studio.");
  }

  if (backupPayload.schemaVersion !== 1) {
    throw new Error("Only backup schemaVersion 1 is supported.");
  }

  if (!isRecord(backupPayload.data)) {
    throw new Error("backup.data is required.");
  }

  const backupData = backupPayload.data;
  const hasRequiredBackupData =
    isRecord(backupData.userProfile) &&
    isRecord(backupData.companyProfile) &&
    Array.isArray(backupData.prompts) &&
    Array.isArray(backupData.memories) &&
    Array.isArray(backupData.skills);

  if (!hasRequiredBackupData) {
    throw new Error(
      "backup.data must include userProfile, companyProfile, prompts, memories, and skills.",
    );
  }

  const normalizedBackupData = {
    companyProfile: backupData.companyProfile,
    deletedPrompts: Array.isArray(backupData.deletedPrompts)
      ? backupData.deletedPrompts
      : [],
    memories: backupData.memories,
    prompts: backupData.prompts,
    skills: backupData.skills,
    userProfile: backupData.userProfile,
  } as WorkspaceBackup["data"];

  return {
    app: "prompt-ai-studio",
    counts: normalizeBackupCounts(normalizedBackupData),
    data: normalizedBackupData,
    exportedAt:
      typeof backupPayload.exportedAt === "string"
        ? backupPayload.exportedAt
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
  backupData: WorkspaceBackup["data"],
): WorkspaceBackup["counts"] {
  return {
    deletedPrompts: backupData.deletedPrompts.length,
    feedback: countNestedArrayRows(backupData.prompts, "feedback"),
    memories: backupData.memories.length,
    promptVersions: countNestedArrayRows(backupData.prompts, "versions"),
    prompts: backupData.prompts.length,
    skillRuns: 0,
    skills: backupData.skills.length,
  };
}

function summarizeInsertRequests(
  insertRequests: SupabaseImportInsertRequests,
  includeRows: boolean,
) {
  return insertRequests.map((request) => ({
    dependency: request.dependency,
    order: request.order,
    rows: includeRows ? request.rows : undefined,
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
  error,
  executeRequested,
  executionSummary,
  importEnvironmentStatus,
  insertOrder,
  requiredConfirmation,
  routeStatus,
  planValidation,
}: {
  checkedAt: string;
  error?: string;
  executeRequested: boolean;
  executionSummary?: SupabaseImportRouteResultSummary;
  importEnvironmentStatus: SupabaseImportEnvironmentStatus;
  insertOrder: SupabaseImportInsertOrder;
  requiredConfirmation: string;
  routeStatus: string;
  planValidation: SupabaseImportPlanValidation;
}) {
  const validationStatus = planValidation.ok ? "ok" : "blocked";
  const routeSummaryLines = [
    `- checkedAt: ${checkedAt}`,
    `- route: POST /api/data/supabase-import`,
    `- executeRequested: ${executeRequested ? "true" : "false"}`,
    `- status: ${routeStatus}`,
    `- validation: ${validationStatus}`,
    `- executionEnabled: ${importEnvironmentStatus.executionEnabled}`,
    `- supabaseUrlConfigured: ${importEnvironmentStatus.supabaseUrlConfigured}`,
    `- serviceRoleKeyConfigured: ${importEnvironmentStatus.serviceRoleKeyConfigured}`,
    `- requiredConfirmation: ${requiredConfirmation}`,
    ...(error ? [`- error: ${error}`] : []),
  ];
  const validationBlockerLines =
    planValidation.blockers.length > 0
      ? planValidation.blockers.map(formatSupabaseImportRouteValidationBlocker)
      : ["- none"];
  const insertOrderLines =
    insertOrder.length > 0
      ? insertOrder.map(formatSupabaseImportRouteInsertOrderItem)
      : ["- none"];
  const executionResultLines = executionSummary
    ? [
        `- status: ${executionSummary.status}`,
        `- completedRows: ${executionSummary.completedRows}`,
        `- totalRows: ${executionSummary.totalRows}`,
        `- failedTable: ${executionSummary.failedTable || "none"}`,
        "",
        "### Table results",
        ...executionSummary.tableResults.map(
          formatSupabaseImportRouteTableResult,
        ),
      ]
    : ["- not executed"];

  return [
    "# Prompt AI Studio Supabase Import Route Audit",
    "",
    ...routeSummaryLines,
    "",
    "## Validation blockers",
    ...validationBlockerLines,
    "",
    "## Insert order",
    ...insertOrderLines,
    "",
    "## Execution result",
    ...executionResultLines,
    "",
    "## Secret handling",
    "- This artifact intentionally contains only configuration booleans, not Supabase keys or raw secret values.",
    "- Do not attach raw service-role secret values or API keys to migration evidence.",
  ].join("\n");
}

function createSupabaseImportBlockedResponse({
  adapterContractText,
  checkedAt,
  importEnvironmentStatus,
  blockerMessage,
  executeRequested,
  httpStatus,
  insertOrder,
  routeStatus,
  planValidation,
}: {
  adapterContractText: string;
  checkedAt: string;
  importEnvironmentStatus: SupabaseImportEnvironmentStatus;
  blockerMessage: string;
  executeRequested: boolean;
  httpStatus: number;
  insertOrder: SupabaseImportInsertOrder;
  routeStatus: string;
  planValidation: SupabaseImportPlanValidation;
}) {
  return NextResponse.json(
    {
      adapterContractText,
      auditArtifactText: buildSupabaseImportRouteAuditArtifactText({
        checkedAt,
        error: blockerMessage,
        executeRequested,
        importEnvironmentStatus,
        insertOrder,
        requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION,
        routeStatus,
        planValidation,
      }),
      environment: importEnvironmentStatus,
      error: blockerMessage,
      insertOrder,
      requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION,
      status: routeStatus,
      validation: planValidation,
    },
    { status: httpStatus },
  );
}

export async function POST(request: Request) {
  try {
    const requestBody = (await request.json()) as SupabaseImportRequestBody;
    const checkedAt = new Date().toISOString();
    const executeRequested = requestBody.execute === true;
    const includePayloadPreview = requestBody.includePayload === true;
    const importEnvironmentStatus =
      getSupabaseRestImportEnvironmentStatus();
    const workspaceId = parseStringField(
      requestBody.workspaceId,
      "workspaceId",
    );
    const ownerUserId = parseStringField(
      requestBody.ownerUserId,
      "ownerUserId",
    );
    const workspaceBackup = parseWorkspaceBackupForImport(requestBody);
    const importDryRun = createSupabaseImportDryRun(workspaceBackup);
    const importPlan = createSupabaseImporterPlan(importDryRun, {
      ownerUserId,
      workspaceId,
    });
    const planValidation = validateSupabaseImportExecutionPlan(importPlan);
    const plannedInsertRequests = getSupabaseImportInsertRequests(importPlan);
    const preflightInsertOrder = summarizeInsertRequests(
      plannedInsertRequests,
      includePayloadPreview,
    );
    const operatorInsertOrder = summarizeInsertRequests(
      plannedInsertRequests,
      false,
    );
    const adapterContractText =
      buildSupabaseImporterAdapterContractText(importPlan);

    if (executeRequested) {
      if (!importEnvironmentStatus.executionEnabled) {
        const blockerMessage =
          "Supabase import execution is disabled. Set SUPABASE_IMPORT_EXECUTION_ENABLED=true in a server-only environment before executing.";

        return createSupabaseImportBlockedResponse({
          adapterContractText,
          checkedAt,
          importEnvironmentStatus,
          blockerMessage,
          executeRequested,
          httpStatus: 403,
          insertOrder: operatorInsertOrder,
          routeStatus: "execution-disabled",
          planValidation,
        });
      }

      if (requestBody.confirmation !== SUPABASE_IMPORT_CONFIRMATION) {
        const blockerMessage = `confirmation must equal ${SUPABASE_IMPORT_CONFIRMATION}.`;

        return createSupabaseImportBlockedResponse({
          adapterContractText,
          checkedAt,
          importEnvironmentStatus,
          blockerMessage,
          executeRequested,
          httpStatus: 400,
          insertOrder: operatorInsertOrder,
          routeStatus: "confirmation-required",
          planValidation,
        });
      }

      if (
        !importEnvironmentStatus.supabaseUrlConfigured ||
        !importEnvironmentStatus.serviceRoleKeyConfigured
      ) {
        const blockerMessage =
          "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for execution.";

        return createSupabaseImportBlockedResponse({
          adapterContractText,
          checkedAt,
          importEnvironmentStatus,
          blockerMessage,
          executeRequested,
          httpStatus: 503,
          insertOrder: operatorInsertOrder,
          routeStatus: "environment-incomplete",
          planValidation,
        });
      }

      if (!planValidation.ok) {
        const blockerMessage =
          "Supabase import execution plan has validation blockers.";

        return createSupabaseImportBlockedResponse({
          adapterContractText,
          checkedAt,
          importEnvironmentStatus,
          blockerMessage,
          executeRequested,
          httpStatus: 422,
          insertOrder: operatorInsertOrder,
          routeStatus: "validation-blocked",
          planValidation,
        });
      }

      const supabaseImportAdapter = createSupabaseRestImportAdapter({
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      });
      const importExecutionResult = await runSupabaseImportExecutionPlan(
        importPlan,
        supabaseImportAdapter,
      );
      const importExecutionSummary: SupabaseImportRouteResultSummary = {
        completedRows: importExecutionResult.completedRows,
        failedTable: importExecutionResult.failedTable,
        status: importExecutionResult.status,
        tableResults: importExecutionResult.tableResults,
        totalRows: importExecutionResult.totalRows,
      };

      return NextResponse.json({
        adapterContractText,
        auditArtifactText: buildSupabaseImportRouteAuditArtifactText({
          checkedAt,
          executeRequested,
          importEnvironmentStatus,
          insertOrder: operatorInsertOrder,
          requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION,
          executionSummary: importExecutionSummary,
          routeStatus: importExecutionResult.status,
          planValidation,
        }),
        environment: importEnvironmentStatus,
        result: importExecutionSummary,
        status: importExecutionResult.status,
        validation: planValidation,
      });
    }

    const preflightStatus = planValidation.ok ? "ready" : "blocked";
    const preflightDryRunResponse = {
      batches: importDryRun.batches.length,
      totalRows: importDryRun.totalRows,
      warnings: importDryRun.warningItems,
    };
    const preflightPlanResponse = {
      archiveTraceFields: importPlan.archiveTraceFields.length,
      generatedUuidCount: importPlan.generatedUuidCount,
      ownerUserId: importPlan.ownerUserId,
      totalRows: importPlan.totalRows,
      unresolvedPendingReferences: importPlan.unresolvedPendingReferences,
      workspaceId: importPlan.workspaceId,
    };

    return NextResponse.json({
      adapterContractText,
      auditArtifactText: buildSupabaseImportRouteAuditArtifactText({
        checkedAt,
        executeRequested,
        importEnvironmentStatus,
        insertOrder: preflightInsertOrder,
        requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION,
        routeStatus: preflightStatus,
        planValidation,
      }),
      dryRun: preflightDryRunResponse,
      insertOrder: preflightInsertOrder,
      requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION,
      plan: preflightPlanResponse,
      status: preflightStatus,
      validation: planValidation,
    });
  } catch (requestError) {
    return NextResponse.json(
      {
        error:
          requestError instanceof Error
            ? requestError.message
            : "Invalid Supabase import request.",
        status: "invalid-request",
      },
      { status: 400 },
    );
  }
}
