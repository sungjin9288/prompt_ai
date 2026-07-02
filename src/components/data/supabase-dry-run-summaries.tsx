"use client";

import { secondaryButtonClass } from "@/components/ui";
import { type SupabaseImportDryRun } from "@/lib/data/supabase-import-dry-run";
import { buildSupabaseImportReferenceReplacementGuideText } from "@/lib/data/supabase-import-verification-sql";
import { formatJsonLength } from "./data-view-shared";

export interface SupabaseImportDryRunSummaryProps {
  dryRun: SupabaseImportDryRun;
  onCopy: () => void;
}

export interface SupabaseReferenceReplacementGuideSummaryProps {
  dryRun: SupabaseImportDryRun;
  onCopy: () => void;
}

export function buildSupabaseImportDryRunManualCopyText({
  dryRun,
  dryRunText,
}: {
  dryRun: SupabaseImportDryRun;
  dryRunText: string;
}) {
  const deletedArchiveRows =
    dryRun.batches.find((batch) => batch.table === "deleted_prompt_assets")
      ?.rows.length ?? 0;
  const setupWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "setup",
  );
  const relationshipWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "relationship",
  );

  return [
    "# Prompt AI Studio Supabase Importer Dry-run",
    "",
    "## Dry-run 식별",
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- Dry-run 길이: ${formatJsonLength(dryRunText)}`,
    "",
    "## Payload 요약",
    `- Total rows: ${dryRun.totalRows}`,
    `- Insert batches: ${dryRun.batches.length}`,
    `- Deleted archive rows: ${deletedArchiveRows}`,
    `- Pending row IDs: ${dryRun.totalRows}`,
    "",
    "## Warning 요약",
    `- Total warnings: ${dryRun.warnings.length}`,
    `- Setup warnings: ${setupWarnings.length}`,
    `- Relationship warnings: ${relationshipWarnings.length}`,
    "",
    "## Dry-run gate 요약",
    "- This dry-run is generated locally and does not connect to Supabase or write data.",
    "- pending-* IDs must be replaced by the import execution plan before insert.",
    "- deleted_prompt_assets rows preserve deleted prompt snapshots for archive trace checks.",
    "- Operators must review setup and relationship warnings before API preflight.",
    "",
    "## Importer dry-run",
    dryRunText,
  ].join("\n");
}

export function buildSupabaseReferenceReplacementGuideManualCopyText({
  dryRun,
  guideText,
}: {
  dryRun: SupabaseImportDryRun;
  guideText: string;
}) {
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
    "# Prompt AI Studio Supabase Pending ID Replacement Guide",
    "",
    "## 치환 가이드 식별",
    `- schemaVersion: ${dryRun.schemaVersion}`,
    `- 가이드 길이: ${formatJsonLength(guideText)}`,
    "",
    "## 치환 범위 요약",
    `- Replacement tables: ${replacementTables.length}`,
    `- Local-to-pending rows: ${replacementRows.length}`,
    `- Deleted archive rows: ${deletedArchiveRows}`,
    `- Total dry-run rows: ${dryRun.totalRows}`,
    `- Dry-run warnings: ${dryRun.warnings.length}`,
    "",
    "## 치환 gate 요약",
    "- Replace every pending-* primary key and foreign key with a real Supabase UUID before insert.",
    "- Rewrite active improvement source prompt/version/feedback references.",
    "- Rewrite learning_memories.source_id for feedback, profile, and company sources.",
    "- Keep deleted_prompt_assets original local IDs and prompt_snapshot IDs as archive trace values.",
    "- Run pending ID audit SQL after import; any remaining pending-* value is a failed import.",
    "",
    "## Pending ID replacement guide",
    guideText,
  ].join("\n");
}

export function SupabaseImportDryRunSummary({
  dryRun,
  onCopy,
}: SupabaseImportDryRunSummaryProps) {
  const setupWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "setup",
  );
  const relationshipWarnings = dryRun.warningItems.filter(
    (warning) => warning.category === "relationship",
  );

  return (
    <div className="space-y-4 rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">
            Importer dry-run
          </p>
          <p className="mt-1 text-sm leading-5 text-muted">
            검증된 백업을 실제 DB write 없이 insert batch 순서와 payload로
            펼칩니다.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onCopy}
        >
          Dry-run 복사
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        data-testid="data-import-dry-run-metrics"
      >
        {[
          ["Insert batches", `${dryRun.batches.length}개`],
          ["예상 rows", `${dryRun.totalRows.toLocaleString("ko-KR")}개`],
          ["경고", `${dryRun.warnings.length}개`],
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

      {dryRun.warningItems.length > 0 ? (
        <div
          className="grid grid-cols-2 gap-2"
          data-testid="data-import-dry-run-warning-metrics"
        >
          {[
            ["설정 필요", `${setupWarnings.length}개`],
            ["관계 참조 확인", `${relationshipWarnings.length}개`],
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
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 font-medium">순서</th>
              <th className="px-3 py-2 font-medium">테이블</th>
              <th className="px-3 py-2 font-medium">Rows</th>
              <th className="py-2 pl-3 font-medium">Dependency</th>
            </tr>
          </thead>
          <tbody>
            {dryRun.batches.map((batch) => (
              <tr
                key={batch.table}
                className="border-b border-line last:border-b-0"
              >
                <td className="py-2 pr-3 font-mono text-xs text-soft">
                  {batch.order}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-soft">
                  {batch.table}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-soft">
                  {batch.rows.length}
                </td>
                <td className="py-2 pl-3 font-mono text-xs text-muted">
                  {batch.dependency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dryRun.warningItems.length > 0 ? (
        <div className="grid gap-2 lg:grid-cols-2">
          {dryRun.warningItems.map((warning) => (
            <div
              key={`${warning.category}-${warning.message}`}
              className="rounded-md border border-line bg-surface px-3 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-line bg-panel-strong px-2 py-1 text-[11px] font-semibold text-muted">
                  {warning.category === "setup" ? "설정 필요" : "관계 참조"}
                </span>
                <span className="rounded-md border border-line bg-panel-strong px-2 py-1 text-[11px] font-semibold text-muted">
                  {warning.severity === "required" ? "필수" : "검토"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                {warning.message}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SupabaseReferenceReplacementGuideSummary({
  dryRun,
  onCopy,
}: SupabaseReferenceReplacementGuideSummaryProps) {
  const promptRows =
    dryRun.batches.find((batch) => batch.table === "prompt_assets")?.rows || [];
  const versionRows =
    dryRun.batches.find((batch) => batch.table === "prompt_versions")?.rows || [];
  const feedbackRows =
    dryRun.batches.find((batch) => batch.table === "feedback")?.rows || [];
  const deletedRows =
    dryRun.batches.find((batch) => batch.table === "deleted_prompt_assets")
      ?.rows || [];
  const guidePreview = buildSupabaseImportReferenceReplacementGuideText(dryRun);

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">
            Pending ID replacement guide
          </p>
          <p className="mt-1 text-sm leading-5 text-muted">
            dry-run의 local ID와 pending ID를 실제 Supabase UUID로 치환해야 할
            위치와 삭제 보관함 trace ID 유지 기준을 분리합니다.
          </p>
        </div>
        <button type="button" className={secondaryButtonClass} onClick={onCopy}>
          치환 가이드 복사
        </button>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-reference-replacement-metrics"
      >
        {[
          ["Prompt refs", `${promptRows.length}개`],
          ["Version refs", `${versionRows.length}개`],
          ["Feedback refs", `${feedbackRows.length}개`],
          ["Archive traces", `${deletedRows.length}개`],
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
        {guidePreview}
      </pre>
    </div>
  );
}
