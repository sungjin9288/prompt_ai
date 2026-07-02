import {
  SUPABASE_OWNER_USER_ID_PLACEHOLDER,
  SUPABASE_WORKSPACE_ID_PLACEHOLDER,
  buildSupabaseImportDryRunText,
  formatWarningLabel,
  isSupabaseWorkspaceUuid,
  type SupabaseImportDryRun,
} from "./supabase-import-dry-run";
import {
  buildSupabaseImportPendingIdAuditSql,
  buildSupabaseImportReferenceReplacementGuideText,
  buildSupabaseImportRelationshipVerificationSql,
  buildSupabaseImportVerificationSql,
} from "./supabase-import-verification-sql";
import {
  buildSupabaseImportRlsAccessAuditSql,
  buildSupabaseRlsPolicyDraftSql,
  buildSupabaseRlsSmokeTestChecklistText,
} from "./supabase-import-rls-sql";

const supabaseMigrationHandoffSectionTitles = [
  "Importer dry-run",
  "Pending ID replacement guide",
  "Row count verification SQL",
  "Relationship verification SQL",
  "Pending ID audit SQL",
  "RLS owner access audit SQL",
  "RLS policy draft SQL",
  "RLS smoke test checklist",
  "Verification report",
] as const;

function countSqlChecks(sql: string) {
  const checkOrders = [...sql.matchAll(/\b(\d+) as check_order,/g)].map(
    (match) => Number(match[1]),
  );

  if (checkOrders.length === 0) {
    return 0;
  }

  const uniqueOrders = new Set(checkOrders);
  const highestOrder = Math.max(...checkOrders);
  const isSequential =
    uniqueOrders.size === checkOrders.length &&
    checkOrders.length === highestOrder &&
    checkOrders.every((order) => order >= 1 && order <= highestOrder);

  if (!isSequential) {
    throw new Error(
      `Supabase SQL check_order values must be contiguous from 1. Found: ${checkOrders.join(
        ", ",
      )}`,
    );
  }

  return checkOrders.length;
}

function countRlsPolicyTables(sql: string) {
  const tableNames = [
    ...sql.matchAll(/alter table public\.([a-z_]+) enable row level security;/g),
  ].map((match) => match[1]);

  return new Set(tableNames).size;
}

export function getSupabaseImportVerificationCheckCounts() {
  return {
    handoffSections: supabaseMigrationHandoffSectionTitles.length,
    pendingIdAudit: countSqlChecks(buildSupabaseImportPendingIdAuditSql()),
    relationship: countSqlChecks(buildSupabaseImportRelationshipVerificationSql()),
    rlsOwnerAccess: countSqlChecks(buildSupabaseImportRlsAccessAuditSql()),
    rlsPolicyTables: countRlsPolicyTables(buildSupabaseRlsPolicyDraftSql()),
  };
}

export function buildSupabaseImportVerificationReportText(
  dryRun: SupabaseImportDryRun,
  options: { ownerUserId?: string; workspaceId?: string } = {},
) {
  const workspaceId = options.workspaceId?.trim();
  const ownerUserId = options.ownerUserId?.trim();
  const workspaceIdValue =
    workspaceId && isSupabaseWorkspaceUuid(workspaceId)
      ? workspaceId
      : SUPABASE_WORKSPACE_ID_PLACEHOLDER;
  const ownerUserIdValue =
    ownerUserId && isSupabaseWorkspaceUuid(ownerUserId)
      ? ownerUserId
      : SUPABASE_OWNER_USER_ID_PLACEHOLDER;
  const setupWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "setup",
  );
  const relationshipWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "relationship",
  );
  const checkCounts = getSupabaseImportVerificationCheckCounts();

  return [
    "# Prompt AI Studio Supabase Import Verification Report",
    "",
    "## Import target",
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- workspace_id: ${workspaceIdValue}`,
    `- owner_user_id: ${ownerUserIdValue}`,
    `- expected total rows: ${dryRun.totalRows}`,
    `- row count checks: ${dryRun.batches.length}`,
    `- relationship checks: ${checkCounts.relationship}`,
    `- pending ID checks: ${checkCounts.pendingIdAudit}`,
    `- RLS owner access checks: ${checkCounts.rlsOwnerAccess}`,
    `- setup warnings: ${setupWarnings.length}`,
    `- relationship warnings: ${relationshipWarnings.length}`,
    "",
    "## Required execution order",
    "- [ ] Run the importer with real Supabase UUIDs, not pending-* dry-run IDs.",
    "- [ ] Run the row count verification SQL for the imported workspace.",
    "- [ ] Run the relationship verification SQL for the imported workspace.",
    "- [ ] Run the pending ID audit SQL for the imported workspace.",
    "- [ ] Run the RLS owner access audit SQL with workspace_id and owner_user_id.",
    "- [ ] Review the RLS policy draft before any policy SQL is applied.",
    "- [ ] Run authenticated RLS smoke tests after policies are enabled.",
    "- [ ] Save all query outputs with this report.",
    "",
    buildSupabaseImportReferenceReplacementGuideText(dryRun),
    "",
    "## Row count acceptance",
    ...dryRun.batches.map(
      (batch) =>
        `- [ ] ${batch.table}: expected_rows ${batch.rows.length}, status pass`,
    ),
    "",
    "## Relationship acceptance",
    "- [ ] prompt_assets.source_skill_id issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourcePromptId issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourceVersionId issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourceFeedback.id issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourceFeedback.promptVersionId issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourceFeedback completeness issue_count 0",
    "- [ ] prompt_assets.improvement_source.sourceFeedback pair issue_count 0",
    "- [ ] deleted archive source references are accepted through deleted_prompt_assets snapshots.",
    "- [ ] feedback.prompt_version_id issue_count 0",
    "- [ ] prompt_skills.source_prompt_id issue_count 0",
    "- [ ] prompt_skills.source_version_id issue_count 0",
    "- [ ] prompt_skills source prompt/version pair issue_count 0",
    "- [ ] learning_memories feedback source_id issue_count 0",
    "- [ ] learning_memories profile source_id issue_count 0",
    "- [ ] learning_memories company source_id issue_count 0",
    "",
    "## Pending ID acceptance",
    "- [ ] prompt_assets.improvement_source issue_count 0",
    "- [ ] prompt_assets.language_decision issue_count 0",
    "- [ ] prompt_assets.target_model_decision issue_count 0",
    "- [ ] learning_memories.source_id issue_count 0",
    "- [ ] prompt_skills.language_decision issue_count 0",
    "- [ ] deleted_prompt_assets.prompt_snapshot issue_count 0",
    "",
    "## RLS owner access acceptance",
    "- [ ] workspaces.owner_user_id issue_count 0",
    "- [ ] workspace_members owner row issue_count 0",
    "- [ ] user_profiles owner mapping issue_count 0",
    "- [ ] prompt_assets.created_by_user_id issue_count 0",
    "- [ ] feedback.user_id issue_count 0",
    "- [ ] prompt_skills.created_by_user_id issue_count 0",
    "- [ ] company_profiles workspace mapping issue_count 0",
    "- [ ] deleted_prompt_assets prompt_snapshot issue_count 0",
    "",
    "## Authenticated RLS smoke test acceptance",
    "- [ ] Owner session allow/deny cases pass.",
    "- [ ] Member session allow/deny cases pass.",
    "- [ ] Viewer session read-only cases pass.",
    "- [ ] Non-member session deny cases pass.",
    "- [ ] Cross-workspace isolation cases pass.",
    "",
    "## Dry-run warnings to resolve",
    ...(dryRun.warningItems.length > 0
      ? dryRun.warningItems.map((warning) => `- [ ] ${formatWarningLabel(warning)}`)
      : ["- [x] No dry-run warnings"]),
    "",
    "## Rollback or review triggers",
    "- Any row count check returns status review.",
    "- Any relationship check returns issue_count greater than 0.",
    "- Any pending ID audit check returns issue_count greater than 0.",
    "- Any RLS owner access audit check returns issue_count greater than 0.",
    "- owner_user_id, user_id, or workspace membership is mapped to the wrong user.",
    "- RLS policies block the owner from reading imported workspace records.",
    "- Any non-member or cross-workspace user can read or write imported records.",
    "",
    "## Sign-off",
    "- [ ] Backup JSON and fingerprint are archived.",
    "- [ ] Row count SQL output is archived.",
    "- [ ] Relationship SQL output is archived.",
    "- [ ] Pending ID audit SQL output is archived.",
    "- [ ] RLS owner access audit SQL output is archived.",
    "- [ ] RLS policy draft review decision is recorded.",
    "- [ ] Authenticated RLS smoke test evidence is archived.",
    "- [ ] Import is accepted or rollback decision is recorded.",
  ].join("\n");
}

export function buildSupabaseMigrationHandoffPackageText(
  dryRun: SupabaseImportDryRun,
  options: { ownerUserId?: string; workspaceId?: string } = {},
) {
  const workspaceId = options.workspaceId?.trim();
  const ownerUserId = options.ownerUserId?.trim();
  const workspaceIdValue =
    workspaceId && isSupabaseWorkspaceUuid(workspaceId)
      ? workspaceId
      : SUPABASE_WORKSPACE_ID_PLACEHOLDER;
  const ownerUserIdValue =
    ownerUserId && isSupabaseWorkspaceUuid(ownerUserId)
      ? ownerUserId
      : SUPABASE_OWNER_USER_ID_PLACEHOLDER;
  const resolvedOptions = {
    ownerUserId:
      ownerUserIdValue === SUPABASE_OWNER_USER_ID_PLACEHOLDER
        ? undefined
        : ownerUserIdValue,
    workspaceId:
      workspaceIdValue === SUPABASE_WORKSPACE_ID_PLACEHOLDER
        ? undefined
        : workspaceIdValue,
  };
  const checkCounts = getSupabaseImportVerificationCheckCounts();

  return [
    "# Prompt AI Studio Supabase Migration Handoff Package",
    "",
    "## Package target",
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- workspace_id: ${workspaceIdValue}`,
    `- owner_user_id: ${ownerUserIdValue}`,
    `- expected total rows: ${dryRun.totalRows}`,
    `- generated sections: ${checkCounts.handoffSections}`,
    "",
    "## Read order",
    ...supabaseMigrationHandoffSectionTitles.map(
      (title, index) => `- ${index + 1}. ${title}`,
    ),
    "",
    "## 1. Importer dry-run",
    buildSupabaseImportDryRunText(dryRun),
    "",
    "## 2. Pending ID replacement guide",
    buildSupabaseImportReferenceReplacementGuideText(dryRun),
    "",
    "## 3. Row count verification SQL",
    "```sql",
    buildSupabaseImportVerificationSql(dryRun, resolvedOptions),
    "```",
    "",
    "## 4. Relationship verification SQL",
    "```sql",
    buildSupabaseImportRelationshipVerificationSql(resolvedOptions),
    "```",
    "",
    "## 5. Pending ID audit SQL",
    "```sql",
    buildSupabaseImportPendingIdAuditSql(resolvedOptions),
    "```",
    "",
    "## 6. RLS owner access audit SQL",
    "```sql",
    buildSupabaseImportRlsAccessAuditSql(resolvedOptions),
    "```",
    "",
    "## 7. RLS policy draft SQL",
    "```sql",
    buildSupabaseRlsPolicyDraftSql(),
    "```",
    "",
    "## 8. RLS smoke test checklist",
    buildSupabaseRlsSmokeTestChecklistText(resolvedOptions),
    "",
    "## 9. Verification report",
    buildSupabaseImportVerificationReportText(dryRun, resolvedOptions),
  ].join("\n");
}
