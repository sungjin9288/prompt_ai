import { type EnvironmentRuntimeStatus } from "@/lib/data/environment-readiness";
import {
  formatBackupDate,
  formatJsonLength,
  formatReleaseGateStage,
  supabaseImportVerificationCheckCounts,
} from "./data-view-shared";
import { type SupabaseImportApiPreflightResponse } from "./supabase-preflight-report-text";

export function buildSupabaseMigrationRehearsalReportText({
  checkedAt,
  ownerUserId,
  preflight,
  workspaceId,
}: {
  checkedAt?: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Migration Rehearsal",
    "",
    `- checkedAt: ${checkedAt || new Date().toISOString()}`,
    `- workspaceId: ${workspaceId || "not provided"}`,
    `- ownerUserId: ${ownerUserId || "not provided"}`,
    `- preflightStatus: ${preflight.status}`,
    `- validation: ${preflight.validation?.ok ? "ok" : "blocked"}`,
    `- importRows: ${preflight.plan?.totalRows ?? preflight.dryRun?.totalRows ?? 0}`,
    `- insertTables: ${preflight.insertOrder?.length ?? 0}`,
    `- requiredConfirmation: ${preflight.requiredConfirmation || "not provided"}`,
    "",
    "## Rehearsal checklist",
    "- [ ] Confirm backup JSON fingerprint and source owner.",
    "- [ ] Confirm `docs/database-schema.sql` is applied to the target Supabase project.",
    "- [ ] Run `/data` API preflight with `execute: false` and validation status `ok`.",
    "- [ ] Copy and review the import execution plan.",
    "- [ ] Copy and review the importer adapter contract.",
    "- [ ] Keep `SUPABASE_IMPORT_EXECUTION_ENABLED=false` until the controlled write window.",
    "- [ ] During the write window, set the execution gate only in a server-only environment.",
    "- [ ] Execute only with `confirmation: RUN_SUPABASE_IMPORT`.",
    "- [ ] Immediately set `SUPABASE_IMPORT_EXECUTION_ENABLED=false` after the run.",
    "- [ ] Run row count verification SQL.",
    "- [ ] Run relationship verification SQL.",
    "- [ ] Run pending ID audit SQL.",
    "- [ ] Run RLS owner access audit SQL.",
    "- [ ] Apply/review RLS policy draft and complete authenticated RLS smoke test.",
    "- [ ] Attach verification report and handoff package to the migration record.",
    "",
    "## Acceptance gates",
    `- relationship checks: ${supabaseImportVerificationCheckCounts.relationship} / all issue_count 0`,
    `- pending ID checks: ${supabaseImportVerificationCheckCounts.pendingIdAudit} / all issue_count 0`,
    `- RLS owner access checks: ${supabaseImportVerificationCheckCounts.rlsOwnerAccess} / all issue_count 0`,
    `- RLS policy tables: ${supabaseImportVerificationCheckCounts.rlsPolicyTables}`,
    `- handoff sections: ${supabaseImportVerificationCheckCounts.handoffSections}`,
    "",
    "## Insert order",
    ...(preflight.insertOrder?.length
      ? preflight.insertOrder.map(
          (item) =>
            `- ${item.order}. ${item.table}: ${item.rowCount} rows / dependency: ${item.dependency}`,
        )
      : ["- none"]),
    "",
    "## Preflight blockers",
    ...(preflight.validation?.blockers.length
      ? preflight.validation.blockers.map((blocker) => `- ${blocker}`)
      : ["- none"]),
    "",
    "## Required `/data` artifacts",
    "- Import execution plan",
    "- Importer adapter contract",
    "- Row count verification SQL",
    "- Relationship verification SQL",
    "- Pending ID audit SQL",
    "- RLS owner access audit SQL",
    "- RLS policy draft SQL",
    "- RLS smoke test checklist",
    "- Verification report",
    "- Migration handoff package",
  ].join("\n");
}

export function buildSupabaseMigrationRehearsalReportManualCopyText({
  backupFingerprint,
  checkedAt,
  ownerUserId,
  preflight,
  rehearsalText,
  workspaceId,
}: {
  backupFingerprint: string;
  checkedAt?: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  rehearsalText: string;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Migration Rehearsal",
    "",
    "## 리허설 식별",
    `- 기준 시각: ${formatBackupDate(checkedAt || new Date().toISOString())}`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 리포트 길이: ${formatJsonLength(rehearsalText)}`,
    "",
    "## 리허설 readiness 요약",
    `- Preflight status: ${preflight.status}`,
    `- Validation: ${preflight.validation?.ok ? "ok" : "blocked"}`,
    `- Validation blockers: ${preflight.validation?.blockers.length ?? 0}`,
    `- Import rows: ${
      preflight.plan?.totalRows ?? preflight.dryRun?.totalRows ?? 0
    }`,
    `- Insert tables: ${preflight.insertOrder?.length ?? 0}`,
    `- Required confirmation: ${
      preflight.requiredConfirmation || "not provided"
    }`,
    `- Handoff sections: ${supabaseImportVerificationCheckCounts.handoffSections}`,
    "",
    "## Migration rehearsal report",
    rehearsalText,
  ].join("\n");
}

export function buildSupabasePostImportVerificationEvidenceText({
  backupFingerprint,
  checkedAt,
  ownerUserId,
  preflight,
  workspaceId,
}: {
  backupFingerprint?: string;
  checkedAt?: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Post-import Verification Evidence",
    "",
    `- checkedAt: ${checkedAt || new Date().toISOString()}`,
    `- backupFingerprint: ${backupFingerprint || "not provided"}`,
    `- workspaceId: ${workspaceId || "not provided"}`,
    `- ownerUserId: ${ownerUserId || "not provided"}`,
    `- preflightStatus: ${preflight.status}`,
    `- validation: ${preflight.validation?.ok ? "ok" : "blocked"}`,
    `- importedRowsExpected: ${
      preflight.plan?.totalRows ?? preflight.dryRun?.totalRows ?? 0
    }`,
    `- insertTablesExpected: ${preflight.insertOrder?.length ?? 0}`,
    "",
    "## Required evidence",
    "- [ ] Execution response route audit artifact attached.",
    "- [ ] Row count verification SQL output attached.",
    "- [ ] Relationship verification SQL output attached and all issue_count values are 0.",
    "- [ ] Pending ID audit SQL output attached and all issue_count values are 0.",
    "- [ ] RLS owner access audit SQL output attached and all issue_count values are 0.",
    "- [ ] Authenticated RLS smoke test completed with owner/member/non-member identities.",
    "- [ ] `SUPABASE_IMPORT_EXECUTION_ENABLED=false` confirmed after execution.",
    "- [ ] Rollback decision and operator sign-off recorded.",
    "",
    "## Acceptance gates",
    `- relationship checks: ${supabaseImportVerificationCheckCounts.relationship} / all issue_count 0`,
    `- pending ID checks: ${supabaseImportVerificationCheckCounts.pendingIdAudit} / all issue_count 0`,
    `- RLS owner access checks: ${supabaseImportVerificationCheckCounts.rlsOwnerAccess} / all issue_count 0`,
    `- RLS policy tables: ${supabaseImportVerificationCheckCounts.rlsPolicyTables}`,
    "",
    "## Expected insert order",
    ...(preflight.insertOrder?.length
      ? preflight.insertOrder.map(
          (item) =>
            `- ${item.order}. ${item.table}: ${item.rowCount} rows / dependency: ${item.dependency}`,
        )
      : ["- none"]),
    "",
    "## Evidence slots",
    "",
    "### Execution route audit artifact",
    "Paste the execution response audit artifact here. Do not paste secrets.",
    "",
    "### Row count verification SQL result",
    "Paste table counts and expected counts here.",
    "",
    "### Relationship verification SQL result",
    "Paste relationship issue_count rows here.",
    "",
    "### Pending ID audit SQL result",
    "Paste pending ID issue_count rows here.",
    "",
    "### RLS owner access audit SQL result",
    "Paste owner access issue_count rows here.",
    "",
    "### Authenticated RLS smoke test",
    "- owner result:",
    "- member result:",
    "- non-member result:",
    "",
    "## Rollback triggers",
    "- Any insert response row count does not match the execution plan.",
    "- Any verification SQL returns issue_count greater than 0.",
    "- Any `pending-*` value remains in Supabase rows after import.",
    "- RLS smoke test exposes workspace data to a non-member.",
    "- The execution gate remains enabled after the write window.",
  ].join("\n");
}

export function buildSupabasePostImportVerificationEvidenceManualCopyText({
  backupFingerprint,
  checkedAt,
  evidenceText,
  ownerUserId,
  preflight,
  workspaceId,
}: {
  backupFingerprint: string;
  checkedAt?: string;
  evidenceText: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Post-import 검증 기록지",
    "",
    "## 검증 기록 식별",
    `- 기준 시각: ${formatBackupDate(checkedAt || new Date().toISOString())}`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 기록지 길이: ${formatJsonLength(evidenceText)}`,
    "",
    "## 실행 결과 대조 요약",
    `- Preflight status: ${preflight.status}`,
    `- Validation: ${preflight.validation?.ok ? "ok" : "blocked"}`,
    `- Expected rows: ${
      preflight.plan?.totalRows ?? preflight.dryRun?.totalRows ?? 0
    }`,
    `- Expected insert tables: ${preflight.insertOrder?.length ?? 0}`,
    `- Relationship checks: ${supabaseImportVerificationCheckCounts.relationship}`,
    `- Pending ID checks: ${supabaseImportVerificationCheckCounts.pendingIdAudit}`,
    `- RLS owner access checks: ${supabaseImportVerificationCheckCounts.rlsOwnerAccess}`,
    "",
    "## Post-import verification evidence",
    evidenceText,
  ].join("\n");
}

export function buildSupabaseImportExecutionReadinessDecisionText({
  backupFingerprint,
  checkedAt,
  ownerUserId,
  preflight,
  runtimeStatus,
  workspaceId,
}: {
  backupFingerprint?: string;
  checkedAt?: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  runtimeStatus: EnvironmentRuntimeStatus;
  workspaceId: string;
}) {
  const validationOk = preflight.validation?.ok === true;
  const runtimeBlockers = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status === "block",
  );
  const runtimeWarnings = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status === "warn",
  );
  const executionGateEnabled =
    runtimeStatus.supabase.importExecutionEnabled === true;
  const migrationReady = runtimeStatus.supabase.readyForMigration === true;
  const serverImporterReady =
    runtimeStatus.supabase.serverImporterConfigured === true;
  const decision =
    validationOk &&
    migrationReady &&
    serverImporterReady &&
    runtimeBlockers.length === 0
      ? executionGateEnabled
        ? "GO - controlled write window is armed"
        : "READY TO ARM - enable execution gate only for the write window"
      : "BLOCKED - do not execute";
  const blockingReasons = [
    ...(!validationOk
      ? ["API preflight validation is not ok for this backup/workspace/owner."]
      : []),
    ...(!migrationReady
      ? ["Supabase migration env is not fully ready."]
      : []),
    ...(!serverImporterReady
      ? ["Server importer service-role environment is not configured."]
      : []),
    ...runtimeBlockers.map((check) => `${check.label}: ${check.detail}`),
  ];

  return [
    "# Prompt AI Studio Supabase Import Execution Readiness Decision",
    "",
    `- checkedAt: ${checkedAt || new Date().toISOString()}`,
    `- backupFingerprint: ${backupFingerprint || "not provided"}`,
    `- workspaceId: ${workspaceId || "not provided"}`,
    `- ownerUserId: ${ownerUserId || "not provided"}`,
    `- decision: ${decision}`,
    `- preflightValidation: ${validationOk ? "ok" : "blocked"}`,
    `- runtimeStage: ${formatReleaseGateStage(runtimeStatus.releaseGate.stage)}`,
    `- runtimeScore: ${runtimeStatus.releaseGate.score}/100`,
    `- importExecutionGate: ${executionGateEnabled ? "enabled" : "disabled"}`,
    "",
    "## Required operator sequence",
    "- [ ] Confirm this memo uses the same backup fingerprint, workspace_id, and owner_user_id as the execution request.",
    "- [ ] Confirm API preflight validation is `ok`.",
    "- [ ] Confirm server importer env exists only in a trusted server-side context.",
    "- [ ] Enable `SUPABASE_IMPORT_EXECUTION_ENABLED=true` only during the controlled write window.",
    "- [ ] Execute with `confirmation: RUN_SUPABASE_IMPORT`.",
    "- [ ] Immediately set `SUPABASE_IMPORT_EXECUTION_ENABLED=false` after execution.",
    "- [ ] Copy execution route audit artifact.",
    "- [ ] Complete post-import verification evidence record.",
    "",
    "## Blocking reasons",
    ...(blockingReasons.length
      ? blockingReasons.map((reason) => `- ${reason}`)
      : ["- none"]),
    "",
    "## Runtime warnings to review",
    ...(runtimeWarnings.length
      ? runtimeWarnings.map(
          (warning) =>
            `- ${warning.label}: ${warning.detail} / next: ${warning.nextAction}`,
        )
      : ["- none"]),
    "",
    "## Preflight blockers",
    ...(preflight.validation?.blockers.length
      ? preflight.validation.blockers.map((blocker) => `- ${blocker}`)
      : ["- none"]),
    "",
    "## Insert order",
    ...(preflight.insertOrder?.length
      ? preflight.insertOrder.map(
          (item) =>
            `- ${item.order}. ${item.table}: ${item.rowCount} rows / dependency: ${item.dependency}`,
        )
      : ["- none"]),
  ].join("\n");
}

export function buildSupabaseImportExecutionReadinessDecisionManualCopyText({
  backupFingerprint,
  checkedAt,
  decisionText,
  ownerUserId,
  preflight,
  runtimeStatus,
  workspaceId,
}: {
  backupFingerprint: string;
  checkedAt: string;
  decisionText: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  runtimeStatus: EnvironmentRuntimeStatus;
  workspaceId: string;
}) {
  const validationOk = preflight.validation?.ok === true;
  const runtimeBlockers = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status === "block",
  );
  const executionGateEnabled =
    runtimeStatus.supabase.importExecutionEnabled === true;
  const migrationReady = runtimeStatus.supabase.readyForMigration === true;
  const serverImporterReady =
    runtimeStatus.supabase.serverImporterConfigured === true;
  const decision =
    validationOk &&
    migrationReady &&
    serverImporterReady &&
    runtimeBlockers.length === 0
      ? executionGateEnabled
        ? "GO - controlled write window is armed"
        : "READY TO ARM - enable execution gate only for the write window"
      : "BLOCKED - do not execute";

  return [
    "# Prompt AI Studio Supabase Import 실행 판정 메모",
    "",
    "## 판정 식별",
    `- 생성 시각: ${formatBackupDate(checkedAt)}`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 메모 길이: ${formatJsonLength(decisionText)}`,
    "",
    "## 실행 판정 요약",
    `- Decision: ${decision}`,
    `- Preflight validation: ${validationOk ? "ok" : "blocked"}`,
    `- Runtime release gate: ${formatReleaseGateStage(
      runtimeStatus.releaseGate.stage,
    )} (${runtimeStatus.releaseGate.score}/100)`,
    `- Runtime blockers: ${runtimeBlockers.length}개`,
    `- Supabase migration ready: ${migrationReady ? "yes" : "no"}`,
    `- Server importer ready: ${serverImporterReady ? "yes" : "no"}`,
    `- Import execution gate: ${
      executionGateEnabled ? "enabled" : "disabled"
    }`,
    "",
    "## Execution readiness decision",
    decisionText,
  ].join("\n");
}
