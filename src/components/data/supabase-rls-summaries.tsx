"use client";

import {
  Field,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import {
  isSupabaseWorkspaceUuid,
  type SupabaseImportDryRun,
} from "@/lib/data/supabase-import-dry-run";
import {
  buildSupabaseImportRlsAccessAuditSql,
  buildSupabaseRlsPolicyDraftSql,
  buildSupabaseRlsSmokeTestChecklistText,
} from "@/lib/data/supabase-import-rls-sql";
import {
  buildSupabaseImportVerificationReportText,
  buildSupabaseMigrationHandoffPackageText,
} from "@/lib/data/supabase-import-report-text";
import {
  formatJsonLength,
  supabaseImportVerificationCheckCounts,
} from "./data-view-shared";

export interface SupabaseRlsAccessAuditSqlSummaryProps {
  ownerUserId: string;
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
  onOwnerUserIdChange: (value: string) => void;
}

export interface SupabaseRlsPolicyDraftSummaryProps {
  onCopy: () => void;
}

export interface SupabaseRlsSmokeTestSummaryProps {
  ownerUserId: string;
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
}

export interface SupabaseVerificationReportSummaryProps {
  dryRun: SupabaseImportDryRun;
  ownerUserId: string;
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
}

export interface SupabaseMigrationHandoffPackageSummaryProps {
  dryRun: SupabaseImportDryRun;
  ownerUserId: string;
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
}

export function buildSupabaseRlsAccessAuditSqlManualCopyText({
  dryRun,
  ownerUserId,
  sql,
  workspaceId,
}: {
  dryRun: SupabaseImportDryRun;
  ownerUserId?: string;
  sql: string;
  workspaceId?: string;
}) {
  const workspaceScope = workspaceId?.trim() || "<workspace_id>";
  const ownerScope = ownerUserId?.trim() || "<owner_user_id>";
  const deletedArchiveRows =
    dryRun.batches.find((batch) => batch.table === "deleted_prompt_assets")
      ?.rows.length ?? 0;

  return [
    "# Prompt AI Studio Supabase RLS Owner Access Audit SQL",
    "",
    "## RLS audit SQL 식별",
    `- workspace_id: ${workspaceScope}`,
    `- owner_user_id: ${ownerScope}`,
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- SQL 길이: ${formatJsonLength(sql)}`,
    "",
    "## Owner access audit 요약",
    `- RLS owner access checks: ${supabaseImportVerificationCheckCounts.rlsOwnerAccess}`,
    `- Expected imported rows: ${dryRun.totalRows}`,
    `- Insert batches: ${dryRun.batches.length}`,
    `- Deleted archive rows: ${deletedArchiveRows}`,
    `- Scope: ${
      workspaceId?.trim() && ownerUserId?.trim() ? "resolved" : "template"
    }`,
    "",
    "## 실행 후 gate 요약",
    "- Run this SQL after row count, relationship, and pending ID audits pass.",
    "- Every issue_count must be 0 before RLS policy rollout or migration acceptance.",
    "- workspaces.owner_user_id and workspace_members owner row must match the target Supabase auth user.",
    "- This read-only audit does not replace authenticated app-session RLS smoke tests.",
    "",
    "## RLS owner access audit SQL",
    sql,
  ].join("\n");
}

export function buildSupabaseRlsPolicyDraftSqlManualCopyText({
  dryRun,
  sql,
}: {
  dryRun: SupabaseImportDryRun;
  sql: string;
}) {
  return [
    "# Prompt AI Studio Supabase RLS Policy Draft SQL",
    "",
    "## RLS policy draft 식별",
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- SQL 길이: ${formatJsonLength(sql)}`,
    "",
    "## Policy draft 요약",
    `- RLS policy tables: ${supabaseImportVerificationCheckCounts.rlsPolicyTables}`,
    `- Expected imported rows: ${dryRun.totalRows}`,
    `- Insert batches: ${dryRun.batches.length}`,
    "- Access source: workspace_members",
    "- Write roles: owner, admin, member",
    "- Read roles: owner, admin, member, viewer",
    "",
    "## 적용 전 gate 요약",
    "- Review and adapt this draft before running it in a Supabase project.",
    "- Run row count, relationship, pending ID, and RLS owner access audits first.",
    "- Confirm helper functions use a safe search_path and workspace_members role semantics.",
    "- Run authenticated owner/member/viewer/non-member RLS smoke tests after policy rollout.",
    "",
    "## RLS policy draft SQL",
    sql,
  ].join("\n");
}

export function buildSupabaseRlsSmokeTestChecklistManualCopyText({
  checklistText,
  dryRun,
  ownerUserId,
  workspaceId,
}: {
  checklistText: string;
  dryRun: SupabaseImportDryRun;
  ownerUserId?: string;
  workspaceId?: string;
}) {
  const ownerScope = ownerUserId?.trim() || "<owner_user_id>";
  const workspaceScope = workspaceId?.trim() || "<workspace_id>";

  return [
    "# Prompt AI Studio Supabase RLS Smoke Test Checklist",
    "",
    "## RLS smoke test 식별",
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- 체크리스트 길이: ${formatJsonLength(checklistText)}`,
    `- workspace_id: ${workspaceScope}`,
    `- owner_user_id: ${ownerScope}`,
    "",
    "## Smoke test 요약",
    `- RLS policy tables: ${supabaseImportVerificationCheckCounts.rlsPolicyTables}`,
    `- RLS owner access checks: ${supabaseImportVerificationCheckCounts.rlsOwnerAccess}`,
    `- Expected imported rows: ${dryRun.totalRows}`,
    `- Insert batches: ${dryRun.batches.length}`,
    "- Required sessions: owner, member, viewer, non-member",
    "",
    "## 실행 gate 요약",
    "- Run after RLS policy draft review and rollout in the target Supabase project.",
    "- Use authenticated app sessions; do not use a service role key for smoke tests.",
    "- Owner/member write cases, viewer read-only cases, and non-member deny cases must pass.",
    "- Any cross-workspace read or write access is a failed rollout.",
    "",
    "## RLS smoke test checklist",
    checklistText,
  ].join("\n");
}

export function buildSupabaseVerificationReportManualCopyText({
  dryRun,
  ownerUserId,
  reportText,
  workspaceId,
}: {
  dryRun: SupabaseImportDryRun;
  ownerUserId?: string;
  reportText: string;
  workspaceId?: string;
}) {
  const ownerScope = ownerUserId?.trim() || "<owner_user_id>";
  const relationshipWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "relationship",
  );
  const setupWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "setup",
  );
  const workspaceScope = workspaceId?.trim() || "<workspace_id>";

  return [
    "# Prompt AI Studio Supabase Verification Report",
    "",
    "## Verification report 식별",
    `- workspace_id: ${workspaceScope}`,
    `- owner_user_id: ${ownerScope}`,
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- 리포트 길이: ${formatJsonLength(reportText)}`,
    "",
    "## 검증 요약",
    `- Expected imported rows: ${dryRun.totalRows}`,
    `- Row count checks: ${dryRun.batches.length}`,
    `- Relationship checks: ${supabaseImportVerificationCheckCounts.relationship}`,
    `- Pending ID checks: ${supabaseImportVerificationCheckCounts.pendingIdAudit}`,
    `- RLS owner access checks: ${supabaseImportVerificationCheckCounts.rlsOwnerAccess}`,
    `- Setup warnings: ${setupWarnings.length}`,
    `- Relationship warnings: ${relationshipWarnings.length}`,
    "",
    "## Acceptance gate 요약",
    "- Row count, relationship, pending ID, and RLS owner access audits must pass.",
    "- Every issue_count in relationship, pending ID, and RLS owner access outputs must be 0.",
    "- RLS policy draft must be reviewed before policy SQL is applied.",
    "- Authenticated owner/member/viewer/non-member RLS smoke tests must be archived with evidence.",
    "",
    "## Verification report",
    reportText,
  ].join("\n");
}

export function buildSupabaseMigrationHandoffPackageManualCopyText({
  dryRun,
  ownerUserId,
  packageText,
  workspaceId,
}: {
  dryRun: SupabaseImportDryRun;
  ownerUserId?: string;
  packageText: string;
  workspaceId?: string;
}) {
  const ownerScope = ownerUserId?.trim() || "<owner_user_id>";
  const relationshipWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "relationship",
  );
  const setupWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "setup",
  );
  const workspaceScope = workspaceId?.trim() || "<workspace_id>";

  return [
    "# Prompt AI Studio Supabase Migration Handoff Package",
    "",
    "## Handoff package 식별",
    `- workspace_id: ${workspaceScope}`,
    `- owner_user_id: ${ownerScope}`,
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- 패키지 길이: ${formatJsonLength(packageText)}`,
    "",
    "## Handoff package 요약",
    `- Expected imported rows: ${dryRun.totalRows}`,
    `- Insert batches: ${dryRun.batches.length}`,
    `- Handoff sections: ${supabaseImportVerificationCheckCounts.handoffSections}`,
    `- Relationship checks: ${supabaseImportVerificationCheckCounts.relationship}`,
    `- Pending ID checks: ${supabaseImportVerificationCheckCounts.pendingIdAudit}`,
    `- RLS owner access checks: ${supabaseImportVerificationCheckCounts.rlsOwnerAccess}`,
    `- RLS policy tables: ${supabaseImportVerificationCheckCounts.rlsPolicyTables}`,
    `- Setup warnings: ${setupWarnings.length}`,
    `- Relationship warnings: ${relationshipWarnings.length}`,
    "",
    "## 인수인계 gate 요약",
    "- Read sections in order from importer dry-run through verification report.",
    "- Attach row count, relationship, pending ID, and RLS owner access audit outputs.",
    "- Archive RLS policy review decision and authenticated RLS smoke test evidence.",
    "- Keep backup JSON, replacement guide, and local-to-Supabase UUID trace together.",
    "",
    "## Migration handoff package",
    packageText,
  ].join("\n");
}

export function SupabaseRlsAccessAuditSqlSummary({
  onCopyResolved,
  onCopyTemplate,
  onOwnerUserIdChange,
  ownerUserId,
  workspaceId,
}: SupabaseRlsAccessAuditSqlSummaryProps) {
  const trimmedWorkspaceId = workspaceId.trim();
  const trimmedOwnerUserId = ownerUserId.trim();
  const workspaceIdIsValid = isSupabaseWorkspaceUuid(trimmedWorkspaceId);
  const ownerUserIdIsValid = isSupabaseWorkspaceUuid(trimmedOwnerUserId);
  const canCopyResolved = workspaceIdIsValid && ownerUserIdIsValid;
  const sqlPreview = buildSupabaseImportRlsAccessAuditSql({
    ownerUserId: ownerUserIdIsValid ? trimmedOwnerUserId : undefined,
    workspaceId: workspaceIdIsValid ? trimmedWorkspaceId : undefined,
  });

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">RLS owner access audit SQL</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            RLS 정책 적용 전 owner user와 workspace membership 전제조건이 맞는지
            read-only로 확인합니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onCopyTemplate}
          >
            RLS 템플릿 복사
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!canCopyResolved}
            onClick={onCopyResolved}
          >
            RLS SQL 복사
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <Field
          label="실제 owner_user_id"
          hint="Supabase auth.users.id와 workspaces.owner_user_id에 들어간 owner UUID입니다."
        >
          <input
            className={inputClass}
            value={ownerUserId}
            onChange={(event) => onOwnerUserIdChange(event.target.value)}
            placeholder="00000000-0000-4000-8000-000000000000"
          />
        </Field>
        <span
          className={`min-h-10 rounded-md border px-3 py-2 text-center text-xs font-semibold ${
            canCopyResolved
              ? "border-success/40 bg-success/10 text-success"
              : "border-line bg-surface text-muted"
          }`}
        >
          {canCopyResolved ? "치환 가능" : "UUID 필요"}
        </span>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-rls-access-audit-metrics"
      >
        {[
          [
            "검증 항목",
            `${supabaseImportVerificationCheckCounts.rlsOwnerAccess}개`,
          ],
          ["정상 기준", "issue_count 0"],
          ["필수 입력", "workspace + owner"],
          [
            "owner_user_id",
            ownerUserIdIsValid ? "입력됨" : "템플릿",
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
          >
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 break-words font-mono text-sm text-soft">
              {value}
            </p>
          </div>
        ))}
      </div>

      <pre className="mt-4 max-h-60 overflow-auto rounded-md border border-line bg-surface p-3 text-xs leading-5 text-muted">
        {sqlPreview}
      </pre>
    </div>
  );
}

export function SupabaseRlsPolicyDraftSummary({
  onCopy,
}: SupabaseRlsPolicyDraftSummaryProps) {
  const sqlPreview = buildSupabaseRlsPolicyDraftSql();

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">RLS policy draft SQL</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            workspace_members 기반 read/write policy 초안입니다. Supabase
            프로젝트에 적용하기 전 역할 범위와 정책명을 리뷰해야 합니다.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onCopy}
        >
          Policy draft 복사
        </button>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-rls-policy-draft-metrics"
      >
        {[
          ["Helper functions", "2개"],
          [
            "RLS tables",
            `${supabaseImportVerificationCheckCounts.rlsPolicyTables}개`,
          ],
          ["Write roles", "owner/admin/member"],
          ["상태", "리뷰 필요"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
          >
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 break-words font-mono text-sm text-soft">
              {value}
            </p>
          </div>
        ))}
      </div>

      <pre className="mt-4 max-h-60 overflow-auto rounded-md border border-line bg-surface p-3 text-xs leading-5 text-muted">
        {sqlPreview}
      </pre>
    </div>
  );
}

export function SupabaseRlsSmokeTestSummary({
  onCopyResolved,
  onCopyTemplate,
  ownerUserId,
  workspaceId,
}: SupabaseRlsSmokeTestSummaryProps) {
  const trimmedWorkspaceId = workspaceId.trim();
  const trimmedOwnerUserId = ownerUserId.trim();
  const workspaceIdIsValid = isSupabaseWorkspaceUuid(trimmedWorkspaceId);
  const ownerUserIdIsValid = isSupabaseWorkspaceUuid(trimmedOwnerUserId);
  const canCopyResolved = workspaceIdIsValid && ownerUserIdIsValid;
  const checklistPreview = buildSupabaseRlsSmokeTestChecklistText({
    ownerUserId: ownerUserIdIsValid ? trimmedOwnerUserId : undefined,
    workspaceId: workspaceIdIsValid ? trimmedWorkspaceId : undefined,
  });

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">RLS smoke test checklist</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            RLS 정책 적용 후 실제 인증 세션으로 owner, member, viewer,
            non-member 접근을 검증하는 체크리스트입니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onCopyTemplate}
          >
            Smoke 템플릿 복사
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!canCopyResolved}
            onClick={onCopyResolved}
          >
            Smoke 체크리스트 복사
          </button>
        </div>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-rls-smoke-test-metrics"
      >
        {[
          ["Test roles", "4개"],
          ["Allow/deny", "모두 확인"],
          ["Cross-workspace", "필수"],
          [
            "상태",
            canCopyResolved ? "치환 가능" : "UUID 필요",
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
          >
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 break-words font-mono text-sm text-soft">
              {value}
            </p>
          </div>
        ))}
      </div>

      <pre className="mt-4 max-h-60 overflow-auto rounded-md border border-line bg-surface p-3 text-xs leading-5 text-muted">
        {checklistPreview}
      </pre>
    </div>
  );
}

export function SupabaseVerificationReportSummary({
  dryRun,
  onCopyResolved,
  onCopyTemplate,
  ownerUserId,
  workspaceId,
}: SupabaseVerificationReportSummaryProps) {
  const trimmedWorkspaceId = workspaceId.trim();
  const trimmedOwnerUserId = ownerUserId.trim();
  const workspaceIdIsValid = isSupabaseWorkspaceUuid(trimmedWorkspaceId);
  const ownerUserIdIsValid = isSupabaseWorkspaceUuid(trimmedOwnerUserId);
  const canCopyResolved = workspaceIdIsValid && ownerUserIdIsValid;
  const setupWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "setup",
  );
  const relationshipWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "relationship",
  );
  const reportPreview = buildSupabaseImportVerificationReportText(dryRun, {
    ownerUserId: ownerUserIdIsValid ? trimmedOwnerUserId : undefined,
    workspaceId: workspaceIdIsValid ? trimmedWorkspaceId : undefined,
  });

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">검증 판정 리포트</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            importer 실행 후 SQL 결과를 판정하고, 통과 기준과 rollback 기준을
            운영 기록으로 남깁니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onCopyTemplate}
          >
            리포트 템플릿 복사
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!canCopyResolved}
            onClick={onCopyResolved}
          >
            치환 리포트 복사
          </button>
        </div>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-verification-report-metrics"
      >
        {[
          ["Row checks", `${dryRun.batches.length}개`],
          [
            "Relationship checks",
            `${supabaseImportVerificationCheckCounts.relationship}개`,
          ],
          [
            "RLS checks",
            `${supabaseImportVerificationCheckCounts.rlsOwnerAccess}개`,
          ],
          ["Setup warnings", `${setupWarnings.length}개`],
          ["Reference warnings", `${relationshipWarnings.length}개`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
          >
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 break-words font-mono text-sm text-soft">
              {value}
            </p>
          </div>
        ))}
      </div>

      <pre className="mt-4 max-h-60 overflow-auto rounded-md border border-line bg-surface p-3 text-xs leading-5 text-muted">
        {reportPreview}
      </pre>
    </div>
  );
}

export function SupabaseMigrationHandoffPackageSummary({
  dryRun,
  onCopyResolved,
  onCopyTemplate,
  ownerUserId,
  workspaceId,
}: SupabaseMigrationHandoffPackageSummaryProps) {
  const trimmedWorkspaceId = workspaceId.trim();
  const trimmedOwnerUserId = ownerUserId.trim();
  const workspaceIdIsValid = isSupabaseWorkspaceUuid(trimmedWorkspaceId);
  const ownerUserIdIsValid = isSupabaseWorkspaceUuid(trimmedOwnerUserId);
  const canCopyResolved = workspaceIdIsValid && ownerUserIdIsValid;
  const packagePreview = buildSupabaseMigrationHandoffPackageText(dryRun, {
    ownerUserId: ownerUserIdIsValid ? trimmedOwnerUserId : undefined,
    workspaceId: workspaceIdIsValid ? trimmedWorkspaceId : undefined,
  });

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">Migration handoff package</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            dry-run, 검증 SQL, RLS draft, smoke checklist, 판정 리포트를 하나의
            운영 handoff 문서로 묶습니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onCopyTemplate}
          >
            Package 템플릿 복사
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!canCopyResolved}
            onClick={onCopyResolved}
          >
            치환 Package 복사
          </button>
        </div>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-migration-handoff-metrics"
      >
        {[
          [
            "Sections",
            `${supabaseImportVerificationCheckCounts.handoffSections}개`,
          ],
          ["Expected rows", `${dryRun.totalRows.toLocaleString("ko-KR")}개`],
          ["Workspace", workspaceIdIsValid ? "입력됨" : "템플릿"],
          ["Owner", ownerUserIdIsValid ? "입력됨" : "템플릿"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
          >
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 break-words font-mono text-sm text-soft">
              {value}
            </p>
          </div>
        ))}
      </div>

      <pre className="mt-4 max-h-60 overflow-auto rounded-md border border-line bg-surface p-3 text-xs leading-5 text-muted">
        {packagePreview}
      </pre>
    </div>
  );
}
