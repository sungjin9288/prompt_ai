import { type EnvironmentRuntimeStatus } from "@/lib/data/environment-readiness";
import {
  formatSupabaseImportExecutionPacketCopyGateLabel,
  getSupabaseImportExecutionPacketManifestNextAction,
  getSupabaseImportExecutionPacketManifestStatus,
  getSupabaseImportExecutionPacketManifestSummary,
  type SupabaseImportExecutionPacketManifestItem,
} from "@/lib/data/supabase-import-execution-packet-manifest";
import {
  formatBackupDate,
  formatJsonLength,
  formatReleaseGateStage,
} from "./data-view-shared";

export function buildSupabaseImportExecutionPacketText({
  adapterContractText,
  apiAuditArtifactText,
  apiPreflightReportText,
  executionGuardChecklistText,
  executionPacketManifestText,
  executionPlanText,
  executionReadinessDecisionText,
  executionRequestTemplateText,
  postImportVerificationEvidenceText,
  rehearsalReportText,
}: {
  adapterContractText: string;
  apiAuditArtifactText?: string;
  apiPreflightReportText: string;
  executionGuardChecklistText: string;
  executionPacketManifestText: string;
  executionPlanText: string;
  executionReadinessDecisionText: string;
  executionRequestTemplateText: string;
  postImportVerificationEvidenceText: string;
  rehearsalReportText: string;
}) {
  return [
    "# Prompt AI Studio Supabase Import Controlled Execution Packet",
    "",
    "This packet is an operator artifact only. It does not execute Supabase writes and must not contain service-role secrets.",
    "",
    "## Packet index",
    "1. Execution packet manifest",
    "2. Execution readiness decision",
    "3. API preflight report",
    "4. Route audit artifact",
    "5. Execution guard checklist",
    "6. Execute request template",
    "7. Migration rehearsal report",
    "8. Post-import verification evidence",
    "9. Import execution plan",
    "10. Importer adapter contract",
    "",
    "---",
    "",
    executionPacketManifestText,
    "",
    "---",
    "",
    executionReadinessDecisionText,
    "",
    "---",
    "",
    apiPreflightReportText,
    "",
    "---",
    "",
    apiAuditArtifactText ||
      "# Supabase Import Route Audit Artifact\n\n- not provided by preflight response",
    "",
    "---",
    "",
    executionGuardChecklistText,
    "",
    "---",
    "",
    executionRequestTemplateText,
    "",
    "---",
    "",
    rehearsalReportText,
    "",
    "---",
    "",
    postImportVerificationEvidenceText,
    "",
    "---",
    "",
    executionPlanText,
    "",
    "---",
    "",
    adapterContractText,
  ].join("\n");
}

export function buildSupabaseImportExecutionPacketManualCopyText({
  backupFingerprint,
  checkedAt,
  manifestItems,
  ownerUserId,
  packetText,
  preflightCheckedAt,
  runtimeStatus,
  workspaceId,
}: {
  backupFingerprint: string;
  checkedAt: string;
  manifestItems: SupabaseImportExecutionPacketManifestItem[];
  ownerUserId: string;
  packetText: string;
  preflightCheckedAt?: string;
  runtimeStatus: EnvironmentRuntimeStatus;
  workspaceId: string;
}) {
  const manifestSummary =
    getSupabaseImportExecutionPacketManifestSummary(manifestItems);
  const manifestStatus =
    getSupabaseImportExecutionPacketManifestStatus(manifestItems);

  return [
    "# Prompt AI Studio Supabase Import 실행 패킷",
    "",
    "## 패킷 식별",
    `- 생성 시각: ${formatBackupDate(checkedAt)}`,
    `- Preflight 시각: ${
      preflightCheckedAt ? formatBackupDate(preflightCheckedAt) : "미확인"
    }`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 패킷 길이: ${formatJsonLength(packetText)}`,
    "",
    "## 실행 gate 요약",
    `- Manifest status: ${manifestStatus.label}`,
    `- Manifest detail: ${manifestStatus.detail}`,
    `- Ready items: ${manifestSummary.readyCount}/${manifestSummary.totalCount}`,
    `- Waiting items: ${manifestSummary.waitingCount}개`,
    `- Copy gate: ${formatSupabaseImportExecutionPacketCopyGateLabel(
      manifestSummary.copyGate,
    )}`,
    `- Runtime release gate: ${formatReleaseGateStage(
      runtimeStatus.releaseGate.stage,
    )} (${runtimeStatus.releaseGate.score}/100)`,
    `- Import execution gate: ${
      runtimeStatus.supabase.importExecutionEnabled ? "enabled" : "disabled"
    }`,
    "",
    "## Controlled execution packet",
    packetText,
  ].join("\n");
}

export function buildSupabaseImportExecutionPacketManifestManualCopyText({
  backupFingerprint,
  checkedAt,
  manifestItems,
  manifestText,
  ownerUserId,
  preflightCheckedAt,
  workspaceId,
}: {
  backupFingerprint: string;
  checkedAt: string;
  manifestItems: SupabaseImportExecutionPacketManifestItem[];
  manifestText: string;
  ownerUserId: string;
  preflightCheckedAt?: string;
  workspaceId: string;
}) {
  const manifestSummary =
    getSupabaseImportExecutionPacketManifestSummary(manifestItems);
  const manifestStatus =
    getSupabaseImportExecutionPacketManifestStatus(manifestItems);
  const nextAction = getSupabaseImportExecutionPacketManifestNextAction(
    manifestItems,
    {
      detailMode: "copy",
    },
  );

  return [
    "# Prompt AI Studio Supabase Import Execution Packet Manifest",
    "",
    "## Manifest 식별",
    `- 생성 시각: ${formatBackupDate(checkedAt)}`,
    `- Preflight 시각: ${
      preflightCheckedAt ? formatBackupDate(preflightCheckedAt) : "미확인"
    }`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- Manifest 길이: ${formatJsonLength(manifestText)}`,
    "",
    "## Manifest gate 요약",
    `- Manifest status: ${manifestStatus.label}`,
    `- Manifest detail: ${manifestStatus.detail}`,
    `- Ready items: ${manifestSummary.readyCount}/${manifestSummary.totalCount}`,
    `- Waiting items: ${manifestSummary.waitingCount}개`,
    `- Copy gate: ${formatSupabaseImportExecutionPacketCopyGateLabel(
      manifestSummary.copyGate,
    )}`,
    `- Next action: ${nextAction}`,
    "",
    "## Operator guardrails",
    "- This manifest is a status artifact only and does not execute Supabase writes.",
    "- Do not paste service-role keys or other secrets into this document.",
    "- Copy the full controlled execution packet only after waiting items are resolved or operator review is complete.",
    "",
    "## Execution packet manifest",
    manifestText,
  ].join("\n");
}

export function buildSupabaseImportExecutionPacketNextActionManualCopyText({
  backupFingerprint,
  checkedAt,
  manifestItems,
  nextActionText,
  ownerUserId,
  preflightCheckedAt,
  workspaceId,
}: {
  backupFingerprint: string;
  checkedAt: string;
  manifestItems: SupabaseImportExecutionPacketManifestItem[];
  nextActionText: string;
  ownerUserId: string;
  preflightCheckedAt?: string;
  workspaceId: string;
}) {
  const manifestSummary =
    getSupabaseImportExecutionPacketManifestSummary(manifestItems);
  const manifestStatus =
    getSupabaseImportExecutionPacketManifestStatus(manifestItems);
  const waitingItem = manifestItems.find((item) => !item.ready);
  const nextAction = getSupabaseImportExecutionPacketManifestNextAction(
    manifestItems,
    {
      detailMode: "copy",
    },
  );

  return [
    "# Prompt AI Studio Supabase Import Execution Packet Next Action",
    "",
    "## 다음 조치 식별",
    `- 생성 시각: ${formatBackupDate(checkedAt)}`,
    `- Preflight 시각: ${
      preflightCheckedAt ? formatBackupDate(preflightCheckedAt) : "미확인"
    }`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 메모 길이: ${formatJsonLength(nextActionText)}`,
    "",
    "## 다음 조치 gate 요약",
    `- Manifest status: ${manifestStatus.label}`,
    `- Ready items: ${manifestSummary.readyCount}/${manifestSummary.totalCount}`,
    `- Waiting items: ${manifestSummary.waitingCount}개`,
    `- Copy gate: ${formatSupabaseImportExecutionPacketCopyGateLabel(
      manifestSummary.copyGate,
    )}`,
    `- Waiting item: ${
      waitingItem ? `${waitingItem.label} (${waitingItem.value})` : "none"
    }`,
    `- Next action: ${nextAction}`,
    "",
    "## Operator guardrails",
    "- This next-action note is an operator handoff artifact only and does not execute Supabase writes.",
    "- Re-copy this note if preflight scope, runtime readiness, or manifest waiting items change.",
    "",
    "## Next action memo",
    nextActionText,
  ].join("\n");
}

export function buildSupabaseImportExecutionRequestTemplateText({
  backupFingerprint,
  ownerUserId,
  workspaceId,
}: {
  backupFingerprint?: string;
  ownerUserId: string;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Import Execute Request Template",
    "",
    "Use this only from a trusted server-side/operator context after rehearsal has passed.",
    "",
    "```json",
    JSON.stringify(
      {
        backupJson: "<paste validated Prompt AI Studio backup JSON here>",
        confirmation: "RUN_SUPABASE_IMPORT",
        execute: true,
        includePayload: false,
        ownerUserId,
        workspaceId,
      },
      null,
      2,
    ),
    "```",
    "",
    "## Required preconditions",
    `- backupFingerprint: ${backupFingerprint || "not provided"}`,
    "- `SUPABASE_IMPORT_EXECUTION_ENABLED=true` is set only in the server environment for the execution window.",
    "- `NEXT_PUBLIC_SUPABASE_URL` points to the target project.",
    "- `SUPABASE_SERVICE_ROLE_KEY` is configured server-side and is not exposed in browser/public env.",
    "- API preflight returned validation `ok` for the same backup/workspace/owner IDs.",
    "- Migration rehearsal report has no unresolved blockers.",
    "",
    "## Immediate follow-up",
    "- Set `SUPABASE_IMPORT_EXECUTION_ENABLED=false` immediately after execution.",
    "- Copy the route audit artifact from the execution response.",
    "- Run row count verification SQL.",
    "- Run relationship verification SQL.",
    "- Run pending ID audit SQL.",
    "- Run RLS owner access audit SQL.",
    "- Complete authenticated RLS smoke test.",
  ].join("\n");
}

export function buildSupabaseImportExecutionRequestTemplateManualCopyText({
  backupFingerprint,
  ownerUserId,
  templateText,
  workspaceId,
}: {
  backupFingerprint: string;
  ownerUserId: string;
  templateText: string;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Import 실행 요청 템플릿",
    "",
    "## 요청 템플릿 식별",
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 템플릿 길이: ${formatJsonLength(templateText)}`,
    "",
    "## 실행 gate 요약",
    "- execute: true",
    "- confirmation: RUN_SUPABASE_IMPORT",
    "- includePayload: false",
    "- server gate: SUPABASE_IMPORT_EXECUTION_ENABLED=true",
    "- validation gate: API preflight validation must be ok",
    "- context: trusted server-side/operator execution window only",
    "",
    "## Execute request template",
    templateText,
  ].join("\n");
}

export function buildSupabaseImportExecutionGuardChecklistText({
  backupFingerprint,
  ownerUserId,
  workspaceId,
}: {
  backupFingerprint?: string;
  ownerUserId: string;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Import Execution Guard",
    "",
    `- backupFingerprint: ${backupFingerprint || "not provided"}`,
    `- workspaceId: ${workspaceId || "not provided"}`,
    `- ownerUserId: ${ownerUserId || "not provided"}`,
    "",
    "## Do not execute if any item is true",
    "- [ ] API preflight has not been run for this exact backup/workspace/owner combination.",
    "- [ ] API preflight validation is not `ok`.",
    "- [ ] `docs/database-schema.sql` has not been applied to the target Supabase project.",
    "- [ ] Target project ref is unknown or mismatched.",
    "- [ ] `SUPABASE_SERVICE_ROLE_KEY` is present in any browser/public environment.",
    "- [ ] `SUPABASE_IMPORT_EXECUTION_ENABLED` would remain true after the run.",
    "- [ ] Backup JSON fingerprint/source owner is not recorded.",
    "- [ ] Rollback artifact and local backup copy are not available.",
    "- [ ] The operator cannot run row count, relationship, pending ID, and RLS owner audits immediately after import.",
    "- [ ] RLS smoke test identities are not prepared.",
    "",
    "## Required after execution",
    "- [ ] Copy route audit artifact.",
    "- [ ] Disable execution gate.",
    "- [ ] Run verification SQL bundle.",
    "- [ ] Attach verification report and migration handoff package.",
  ].join("\n");
}

export function buildSupabaseImportExecutionGuardChecklistManualCopyText({
  backupFingerprint,
  checklistText,
  ownerUserId,
  workspaceId,
}: {
  backupFingerprint: string;
  checklistText: string;
  ownerUserId: string;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Import 실행 금지 체크리스트",
    "",
    "## 체크리스트 식별",
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 체크리스트 길이: ${formatJsonLength(checklistText)}`,
    "",
    "## 실행 차단 gate 요약",
    "- API preflight must match this exact backup/workspace/owner combination.",
    "- API preflight validation must be ok.",
    "- database-schema.sql must be applied to the target Supabase project.",
    "- SUPABASE_SERVICE_ROLE_KEY must remain server-side only.",
    "- SUPABASE_IMPORT_EXECUTION_ENABLED must be disabled immediately after the run.",
    "- Row count, relationship, pending ID, and RLS owner audits must be runnable immediately after import.",
    "- RLS smoke test identities must be prepared.",
    "",
    "## Execution guard checklist",
    checklistText,
  ].join("\n");
}
