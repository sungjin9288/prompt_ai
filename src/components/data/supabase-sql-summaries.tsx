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
  buildSupabaseImportPendingIdAuditSql,
  buildSupabaseImportRelationshipVerificationSql,
  buildSupabaseImportVerificationSql,
} from "@/lib/data/supabase-import-verification-sql";
import {
  formatJsonLength,
  supabaseImportVerificationCheckCounts,
} from "./data-view-shared";

export interface SupabaseVerificationSqlSummaryProps {
  dryRun: SupabaseImportDryRun;
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
  onWorkspaceIdChange: (value: string) => void;
}

export interface SupabaseRelationshipVerificationSqlSummaryProps {
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
}

export interface SupabasePendingIdAuditSqlSummaryProps {
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
}

export function buildSupabaseImportVerificationSqlManualCopyText({
  dryRun,
  sql,
  workspaceId,
}: {
  dryRun: SupabaseImportDryRun;
  sql: string;
  workspaceId?: string;
}) {
  const workspaceScope = workspaceId?.trim() || "<workspace_id>";
  const deletedArchiveRows =
    dryRun.batches.find((batch) => batch.table === "deleted_prompt_assets")
      ?.rows.length ?? 0;

  return [
    "# Prompt AI Studio Supabase Import Verification SQL",
    "",
    "## 검증 SQL 식별",
    `- workspace_id: ${workspaceScope}`,
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- SQL 길이: ${formatJsonLength(sql)}`,
    "",
    "## Row count 검증 요약",
    `- Expected rows: ${dryRun.totalRows}`,
    `- Expected tables: ${dryRun.batches.length}`,
    `- Deleted archive rows: ${deletedArchiveRows}`,
    `- Workspace scope: ${workspaceId?.trim() ? "resolved" : "template"}`,
    "",
    "## 실행 후 gate 요약",
    "- Run this SQL after the import completes in the target Supabase project.",
    "- Any row count mismatch blocks migration acceptance until reviewed.",
    "- Follow with relationship, pending ID, and RLS owner audits.",
    "",
    "## Verification SQL",
    sql,
  ].join("\n");
}

export function buildSupabaseRelationshipVerificationSqlManualCopyText({
  dryRun,
  sql,
  workspaceId,
}: {
  dryRun: SupabaseImportDryRun;
  sql: string;
  workspaceId?: string;
}) {
  const workspaceScope = workspaceId?.trim() || "<workspace_id>";
  const relationshipWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "relationship",
  );
  const deletedArchiveRows =
    dryRun.batches.find((batch) => batch.table === "deleted_prompt_assets")
      ?.rows.length ?? 0;

  return [
    "# Prompt AI Studio Supabase Relationship Verification SQL",
    "",
    "## 관계 검증 SQL 식별",
    `- workspace_id: ${workspaceScope}`,
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- SQL 길이: ${formatJsonLength(sql)}`,
    "",
    "## 관계 검증 요약",
    `- Relationship checks: ${supabaseImportVerificationCheckCounts.relationship}`,
    `- Relationship warnings: ${relationshipWarnings.length}`,
    `- Deleted archive rows: ${deletedArchiveRows}`,
    `- Workspace scope: ${workspaceId?.trim() ? "resolved" : "template"}`,
    "",
    "## 실행 후 gate 요약",
    "- Run this SQL after row count verification passes for the imported workspace.",
    "- Every issue_count must be 0 before migration acceptance.",
    "- Deleted prompt references are accepted only through deleted_prompt_assets snapshots.",
    "- Follow with pending ID and RLS owner audits.",
    "",
    "## Relationship verification SQL",
    sql,
  ].join("\n");
}

export function buildSupabasePendingIdAuditSqlManualCopyText({
  dryRun,
  sql,
  workspaceId,
}: {
  dryRun: SupabaseImportDryRun;
  sql: string;
  workspaceId?: string;
}) {
  const workspaceScope = workspaceId?.trim() || "<workspace_id>";
  const replacementTables = [
    "user_profiles",
    "company_profiles",
    "prompt_assets",
    "prompt_versions",
    "feedback",
    "learning_memories",
    "prompt_skills",
  ];
  const replacementRows = replacementTables.flatMap(
    (table) =>
      dryRun.batches
        .find((batch) => batch.table === table)
        ?.rows.filter((row) => row.localId) ?? [],
  );
  const deletedArchiveRows =
    dryRun.batches.find((batch) => batch.table === "deleted_prompt_assets")
      ?.rows.length ?? 0;

  return [
    "# Prompt AI Studio Supabase Pending ID Audit SQL",
    "",
    "## Pending ID audit SQL 식별",
    `- workspace_id: ${workspaceScope}`,
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- SQL 길이: ${formatJsonLength(sql)}`,
    "",
    "## Pending ID audit 요약",
    `- Pending ID checks: ${supabaseImportVerificationCheckCounts.pendingIdAudit}`,
    `- Replacement tables: ${replacementTables.length}`,
    `- Local-to-pending rows: ${replacementRows.length}`,
    `- Deleted archive rows: ${deletedArchiveRows}`,
    `- Workspace scope: ${workspaceId?.trim() ? "resolved" : "template"}`,
    "",
    "## 실행 후 gate 요약",
    "- Run this SQL after row count and relationship verification pass.",
    "- Every issue_count must be 0 before migration acceptance.",
    "- Any remaining pending-* value means the import payload was not fully rewritten to Supabase UUIDs.",
    "- Follow with RLS owner access audit and authenticated RLS smoke tests.",
    "",
    "## Pending ID audit SQL",
    sql,
  ].join("\n");
}

export function SupabaseVerificationSqlSummary({
  dryRun,
  onCopyResolved,
  onCopyTemplate,
  onWorkspaceIdChange,
  workspaceId,
}: SupabaseVerificationSqlSummaryProps) {
  const trimmedWorkspaceId = workspaceId.trim();
  const hasWorkspaceId = trimmedWorkspaceId.length > 0;
  const workspaceIdIsValid = isSupabaseWorkspaceUuid(trimmedWorkspaceId);
  const sqlPreview = buildSupabaseImportVerificationSql(dryRun, {
    workspaceId: workspaceIdIsValid ? trimmedWorkspaceId : undefined,
  });
  const largestBatch = dryRun.batches.reduce<SupabaseImportDryRun["batches"][number] | null>(
    (largest, batch) =>
      largest === null || batch.rows.length > largest.rows.length ? batch : largest,
    null,
  );

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">검증 SQL</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            importer 실행 후 `&lt;workspace_id&gt;`를 실제 UUID로 바꿔
            워크스페이스 범위 row 수를 대조합니다.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onCopyTemplate}
        >
          템플릿 SQL 복사
        </button>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-row-count-verification-metrics"
      >
        {[
          ["검증 테이블", `${dryRun.batches.length}개`],
          ["예상 rows", `${dryRun.totalRows.toLocaleString("ko-KR")}개`],
          [
            "필터 기준",
            "workspace_id",
          ],
          [
            "최대 batch",
            largestBatch
              ? `${largestBatch.table} ${largestBatch.rows.length}개`
              : "없음",
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

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
        <Field
          label="실제 workspace_id"
          hint="Supabase importer 실행 후 생성된 workspaces.id UUID를 입력하면 아래 SQL과 복사 내용에 반영됩니다."
        >
          <input
            className={inputClass}
            value={workspaceId}
            onChange={(event) => onWorkspaceIdChange(event.target.value)}
            placeholder="00000000-0000-4000-8000-000000000000"
          />
        </Field>
        <button
          type="button"
          className={primaryButtonClass}
          disabled={!workspaceIdIsValid}
          onClick={onCopyResolved}
        >
          치환 SQL 복사
        </button>
      </div>

      {hasWorkspaceId && !workspaceIdIsValid ? (
        <div className="mt-3 rounded-md border border-danger bg-surface px-3 py-3 text-xs leading-5 text-danger">
          workspace_id는 Supabase UUID 형식이어야 합니다. 형식이 맞을 때만
          치환 SQL을 복사할 수 있습니다.
        </div>
      ) : null}

      <pre className="mt-4 max-h-60 overflow-auto rounded-md border border-line bg-surface p-3 text-xs leading-5 text-muted">
        {sqlPreview}
      </pre>
    </div>
  );
}

export function SupabaseRelationshipVerificationSqlSummary({
  onCopyResolved,
  onCopyTemplate,
  workspaceId,
}: SupabaseRelationshipVerificationSqlSummaryProps) {
  const trimmedWorkspaceId = workspaceId.trim();
  const workspaceIdIsValid = isSupabaseWorkspaceUuid(trimmedWorkspaceId);
  const sqlPreview = buildSupabaseImportRelationshipVerificationSql({
    workspaceId: workspaceIdIsValid ? trimmedWorkspaceId : undefined,
  });

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">관계 검증 SQL</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            importer 실행 후 row 수뿐 아니라 프롬프트, 버전, 피드백, 스킬,
            학습 메모리 참조가 같은 workspace 안에서 이어지는지 확인합니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onCopyTemplate}
          >
            관계 템플릿 복사
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!workspaceIdIsValid}
            onClick={onCopyResolved}
          >
            관계 SQL 복사
          </button>
        </div>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-relationship-verification-metrics"
      >
        {[
          [
            "검증 항목",
            `${supabaseImportVerificationCheckCounts.relationship}개`,
          ],
          ["정상 기준", "issue_count 0"],
          ["필터 기준", "workspace_id"],
          [
            "workspace_id",
            workspaceIdIsValid ? "입력됨" : "템플릿",
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

export function SupabasePendingIdAuditSqlSummary({
  onCopyResolved,
  onCopyTemplate,
  workspaceId,
}: SupabasePendingIdAuditSqlSummaryProps) {
  const trimmedWorkspaceId = workspaceId.trim();
  const workspaceIdIsValid = isSupabaseWorkspaceUuid(trimmedWorkspaceId);
  const sqlPreview = buildSupabaseImportPendingIdAuditSql({
    workspaceId: workspaceIdIsValid ? trimmedWorkspaceId : undefined,
  });

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">Pending ID audit SQL</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            importer 실행 후 dry-run용 `pending-*` 값이 jsonb나 text 참조 필드에
            남아 있는지 확인합니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onCopyTemplate}
          >
            Pending 템플릿 복사
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!workspaceIdIsValid}
            onClick={onCopyResolved}
          >
            Pending SQL 복사
          </button>
        </div>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-pending-id-audit-metrics"
      >
        {[
          [
            "검증 항목",
            `${supabaseImportVerificationCheckCounts.pendingIdAudit}개`,
          ],
          ["정상 기준", "issue_count 0"],
          ["대상 필드", "jsonb/text"],
          [
            "workspace_id",
            workspaceIdIsValid ? "입력됨" : "템플릿",
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
