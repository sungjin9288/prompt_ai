"use client";

import {
  Field,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import {
  formatSupabaseImportExecutionPacketCopyGateLabel,
  getSupabaseImportExecutionPacketCopyActionStatuses,
  getSupabaseImportExecutionPacketManifestItems,
  getSupabaseImportExecutionPacketManifestNextAction,
  getSupabaseImportExecutionPacketManifestStatus,
  getSupabaseImportExecutionPacketManifestSummary,
  type SupabaseImportExecutionPacketManifestStatus as ExecutionPacketManifestStatus,
} from "@/lib/data/supabase-import-execution-packet-manifest";
import { getSupabaseImportPreflightScopeStatus } from "@/lib/data/supabase-import-preflight-scope";
import {
  isSupabaseWorkspaceUuid,
  type SupabaseImportDryRun,
} from "@/lib/data/supabase-import-dry-run";
import { createSupabaseImporterPlan } from "@/lib/data/supabase-importer";
import {
  formatBackupDate,
  formatJsonLength,
  formatReleaseGateStage,
  supabaseImportExecutionPacketSectionCount,
} from "./data-view-shared";
import { type RuntimeReadinessState } from "./readiness-summaries";
import { type SupabaseImportApiPreflightState } from "./supabase-preflight-report-text";

export interface SupabaseImportExecutionPlanSummaryProps {
  backupFingerprint: string;
  dryRun: SupabaseImportDryRun;
  onCopyContract: () => void;
  onCopy: () => void;
  onCopyApiAuditArtifact: () => void;
  onCopyApiPreflightReport: () => void;
  onCopyExecutionGuardChecklist: () => void;
  onCopyExecutionPacket: () => void;
  onCopyExecutionPacketManifest: () => void;
  onCopyExecutionPacketNextAction: () => void;
  onCopyExecutionRequestTemplate: () => void;
  onCopyExecutionReadinessDecision: () => void;
  onCopyPostImportVerificationEvidence: () => void;
  onCopyRehearsalReport: () => void;
  onRunApiPreflight: () => void;
  onOwnerUserIdChange: (value: string) => void;
  onWorkspaceIdChange: (value: string) => void;
  ownerUserId: string;
  preflightState: SupabaseImportApiPreflightState;
  runtimeState: RuntimeReadinessState;
  workspaceId: string;
}

export function buildSupabaseImportExecutionPlanManualCopyText({
  plan,
  planText,
}: {
  plan: ReturnType<typeof createSupabaseImporterPlan>;
  planText: string;
}) {
  return [
    "# Prompt AI Studio Supabase Import Execution Plan",
    "",
    "## 실행 계획 식별",
    `- workspace_id: ${plan.workspaceId}`,
    `- owner_user_id: ${plan.ownerUserId}`,
    `- 계획 길이: ${formatJsonLength(planText)}`,
    "",
    "## UUID 치환 요약",
    `- Total rows: ${plan.totalRows}`,
    `- Insert batches: ${plan.batches.length}`,
    `- UUID map entries: ${plan.generatedUuidCount}`,
    `- Archive trace fields: ${plan.archiveTraceFields.length}`,
    `- Unresolved pending references: ${plan.unresolvedPendingReferences.length}`,
    "",
    "## 실행 전 acceptance gate",
    "- No pending-* value should remain in the execution payload.",
    "- deleted_prompt_assets original local IDs and prompt_snapshot JSON must stay traceable.",
    "- workspaces.owner_user_id and workspace_members.user_id must match the target Supabase auth user.",
    "- This plan is generated locally and does not connect to Supabase or write data.",
    "- After insert, run row count, relationship, pending ID, and RLS owner access audits.",
    "",
    "## Import execution plan",
    planText,
  ].join("\n");
}

export function getExecutionPacketManifestStatusClass(
  tone: ExecutionPacketManifestStatus["tone"],
) {
  if (tone === "ready") {
    return "border-success/40 bg-success/10 text-success";
  }

  if (tone === "attention") {
    return "border-attention/40 bg-attention/10 text-attention";
  }

  return "border-danger/40 bg-danger/10 text-danger";
}

export function getSupabaseImportExecutionPacketRuntimeState(
  runtimeState: RuntimeReadinessState,
) {
  const runtimeData = runtimeState.data;

  return {
    importExecutionEnabled: runtimeData?.supabase.importExecutionEnabled,
    ready: Boolean(runtimeData),
    releaseGateStageLabel: runtimeData
      ? formatReleaseGateStage(runtimeData.releaseGate.stage)
      : undefined,
    status: runtimeState.status,
  };
}

export function SupabaseImportExecutionPlanSummary({
  backupFingerprint,
  dryRun,
  onCopy,
  onCopyApiAuditArtifact,
  onCopyApiPreflightReport,
  onCopyContract,
  onCopyExecutionGuardChecklist,
  onCopyExecutionPacket,
  onCopyExecutionPacketManifest,
  onCopyExecutionPacketNextAction,
  onCopyExecutionRequestTemplate,
  onCopyExecutionReadinessDecision,
  onCopyPostImportVerificationEvidence,
  onCopyRehearsalReport,
  onRunApiPreflight,
  onOwnerUserIdChange,
  onWorkspaceIdChange,
  ownerUserId,
  preflightState,
  runtimeState,
  workspaceId,
}: SupabaseImportExecutionPlanSummaryProps) {
  const trimmedWorkspaceId = workspaceId.trim();
  const trimmedOwnerUserId = ownerUserId.trim();
  const workspaceIdIsValid = isSupabaseWorkspaceUuid(trimmedWorkspaceId);
  const ownerUserIdIsValid = isSupabaseWorkspaceUuid(trimmedOwnerUserId);
  const canCopyPlan = workspaceIdIsValid && ownerUserIdIsValid;
  const deletedRows =
    dryRun.batches.find((batch) => batch.table === "deleted_prompt_assets")
      ?.rows || [];
  const uuidMapEntries = dryRun.totalRows + 1;
  const preflightReady =
    preflightState.status === "ready" && Boolean(preflightState.data);
  const preflightScopeStatus = preflightReady
    ? getSupabaseImportPreflightScopeStatus({
        current: {
          backupFingerprint,
          ownerUserId: trimmedOwnerUserId,
          workspaceId: trimmedWorkspaceId,
        },
        preflight: preflightState,
      })
    : "missing";
  const preflightMatchesCurrent =
    preflightScopeStatus === "current";
  const preflightCanUse = preflightReady && preflightMatchesCurrent;
  const runtimeData = runtimeState.data;
  const packetManifestItems = getSupabaseImportExecutionPacketManifestItems({
    backupFingerprint,
    ownerUserId,
    preflightState,
    runtimeState: getSupabaseImportExecutionPacketRuntimeState(runtimeState),
    sectionCount: supabaseImportExecutionPacketSectionCount,
    workspaceId,
  });
  const packetManifestNextAction =
    getSupabaseImportExecutionPacketManifestNextAction(packetManifestItems);
  const packetManifestStatus =
    getSupabaseImportExecutionPacketManifestStatus(packetManifestItems);
  const packetCopyActionStatuses =
    getSupabaseImportExecutionPacketCopyActionStatuses(packetManifestItems);
  const packetManifestSummary =
    getSupabaseImportExecutionPacketManifestSummary(packetManifestItems);
  const packetManifestScopeDetail = packetManifestItems.find(
    (item) => item.label === "Scope",
  )?.detail;

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">
            Import execution plan
          </p>
          <p className="mt-1 text-sm leading-5 text-muted">
            실제 Supabase UUID를 기준으로 `pending-*` 참조를 제거한 insert
            payload 초안을 생성합니다. Supabase에 연결하거나 데이터를 쓰지는
            않습니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!canCopyPlan}
            onClick={onCopyContract}
          >
            Adapter 계약 복사
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={!canCopyPlan}
            onClick={onCopy}
          >
            실행 계획 복사
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!canCopyPlan || preflightState.status === "loading"}
            onClick={onRunApiPreflight}
          >
            API preflight
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!canCopyPlan}
            onClick={onCopyExecutionGuardChecklist}
          >
            금지 체크리스트
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!canCopyPlan}
            onClick={onCopyExecutionRequestTemplate}
          >
            실행 템플릿
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Field
          label="실제 workspace_id"
          hint="workspaces.id에 사용할 Supabase UUID입니다. 아래 검증 SQL 입력과 같은 값으로 재사용됩니다."
        >
          <input
            className={inputClass}
            value={workspaceId}
            onChange={(event) => onWorkspaceIdChange(event.target.value)}
            placeholder="00000000-0000-4000-8000-000000000000"
          />
        </Field>
        <Field
          label="실제 owner_user_id"
          hint="Supabase auth.users.id와 workspaces.owner_user_id에 들어갈 owner UUID입니다."
        >
          <input
            className={inputClass}
            value={ownerUserId}
            onChange={(event) => onOwnerUserIdChange(event.target.value)}
            placeholder="00000000-0000-4000-8000-000000000000"
          />
        </Field>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-import-execution-plan-metrics"
      >
        {[
          ["Payload rows", `${dryRun.totalRows.toLocaleString("ko-KR")}개`],
          ["UUID map", `${uuidMapEntries.toLocaleString("ko-KR")}개`],
          ["Archive snapshots", `${deletedRows.length}개`],
          ["상태", canCopyPlan ? "생성 가능" : "UUID 필요"],
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

      {!canCopyPlan ? (
        <div className="mt-3 rounded-md border border-line bg-surface px-3 py-3 text-xs leading-5 text-muted">
          workspace_id와 owner_user_id가 모두 UUID 형식일 때 실행 계획을 복사할
          수 있습니다.
        </div>
      ) : null}

      {preflightState.status !== "idle" ? (
        <div className="mt-4 rounded-md border border-line bg-surface px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-soft">
              Server import API preflight
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {preflightState.status === "ready" && preflightState.data ? (
                <>
                  <button
                    type="button"
                    className="rounded-md border border-line bg-panel-strong px-2 py-1 text-[11px] font-semibold text-foreground transition hover:border-accent"
                    disabled={!preflightCanUse}
                    onClick={onCopyApiAuditArtifact}
                  >
                    API audit
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-line bg-panel-strong px-2 py-1 text-[11px] font-semibold text-foreground transition hover:border-accent"
                    disabled={!preflightCanUse}
                    onClick={onCopyApiPreflightReport}
                  >
                    리포트 복사
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-line bg-panel-strong px-2 py-1 text-[11px] font-semibold text-foreground transition hover:border-accent"
                    disabled={!preflightCanUse || !runtimeState.data}
                    onClick={onCopyExecutionReadinessDecision}
                  >
                    실행 판정
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-line bg-panel-strong px-2 py-1 text-[11px] font-semibold text-foreground transition hover:border-accent"
                    disabled={!preflightCanUse || !runtimeState.data}
                    onClick={onCopyExecutionPacket}
                  >
                    실행 패킷
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-line bg-panel-strong px-2 py-1 text-[11px] font-semibold text-foreground transition hover:border-accent"
                    disabled={!preflightCanUse}
                    onClick={onCopyRehearsalReport}
                  >
                    리허설 리포트
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-line bg-panel-strong px-2 py-1 text-[11px] font-semibold text-foreground transition hover:border-accent"
                    disabled={!preflightCanUse}
                    onClick={onCopyPostImportVerificationEvidence}
                  >
                    검증 기록지
                  </button>
                </>
              ) : null}
              <span
                className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                  preflightState.status === "ready"
                      ? preflightScopeStatus === "current"
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-danger/40 bg-danger/10 text-danger"
                    : preflightState.status === "error"
                      ? "border-danger bg-panel-strong text-danger"
                      : "border-line bg-panel-strong text-muted"
                }`}
              >
                {preflightState.status === "loading"
                  ? "확인 중"
                  : preflightState.status === "ready"
                    ? preflightMatchesCurrent
                      ? preflightState.data?.status || "ready"
                      : "재실행 필요"
                    : "실패"}
              </span>
            </div>
          </div>
          {preflightState.status === "ready" && preflightState.data ? (
            <div
              className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4"
              data-testid="data-api-preflight-summary-metrics"
            >
              {[
                [
                  "Validation",
                  preflightState.data.validation?.ok ? "ok" : "blocked",
                ],
                [
                  "Insert tables",
                  `${preflightState.data.insertOrder?.length ?? 0}개`,
                ],
                [
                  "Rows",
                  `${preflightState.data.plan?.totalRows ?? dryRun.totalRows}개`,
                ],
                [
                  "Confirmation",
                  preflightState.data.requiredConfirmation || "미지정",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="min-w-0 rounded-md border border-line bg-panel-strong px-3 py-3"
                >
                  <p className="text-xs text-muted">{label}</p>
                  <p className="mt-1 break-words font-mono text-sm text-soft">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {preflightReady && preflightScopeStatus === "stale" ? (
            <p className="mt-2 text-xs leading-5 text-danger">
              현재 백업 fingerprint 또는 workspace/owner UUID가 preflight 실행
              당시와 다릅니다. {packetManifestScopeDetail ?? ""} API
              preflight를 다시 실행하세요.
            </p>
          ) : null}
          {preflightState.status === "ready" && preflightState.data ? (
            <div className="mt-3 rounded-md border border-line bg-panel-strong px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-soft">
                  Execution packet manifest
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${getExecutionPacketManifestStatusClass(
                      packetManifestStatus.tone,
                    )}`}
                  >
                    {packetManifestStatus.label}
                  </span>
                  <button
                    type="button"
                    className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-foreground transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!preflightCanUse}
                    onClick={onCopyExecutionPacketManifest}
                    data-testid="data-execution-packet-manifest-copy"
                  >
                    Manifest 복사
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                {packetManifestStatus.detail}
              </p>
              <div
                className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3"
                data-testid="data-execution-packet-manifest-summary"
              >
                {[
                  [
                    "Ready items",
                    `${packetManifestSummary.readyCount}/${packetManifestSummary.totalCount}`,
                  ],
                  ["Waiting items", `${packetManifestSummary.waitingCount}개`],
                  [
                    "Copy gate",
                    formatSupabaseImportExecutionPacketCopyGateLabel(
                      packetManifestSummary.copyGate,
                    ),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-md border border-line bg-surface px-3 py-2"
                  >
                    <p className="text-[11px] text-muted">{label}</p>
                    <p className="mt-1 break-words text-xs font-semibold text-soft">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {packetCopyActionStatuses.map((action) => (
                  <div
                    key={action.label}
                    className={`min-w-0 rounded-md border px-3 py-2 ${
                      action.ready
                        ? "border-success/30 bg-success/10"
                        : "border-line bg-surface"
                    }`}
                  >
                    <p className="text-[11px] text-muted">{action.label}</p>
                    <p
                      className={`mt-1 text-xs font-semibold ${
                        action.ready ? "text-success" : "text-soft"
                      }`}
                    >
                      {action.ready ? "ready" : "waiting"}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-muted">
                      {action.detail}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-muted">
                      Next: {action.action}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 xl:grid-cols-3">
                {packetManifestItems.map((item) => (
                  <div
                    key={item.label}
                    className={`min-w-0 rounded-md border px-3 py-2 ${
                      item.ready
                        ? "border-success/30 bg-success/10"
                        : "border-line bg-surface"
                    }`}
                  >
                    <p className="text-xs text-muted">{item.label}</p>
                    <p
                      className={`mt-1 break-words font-mono text-xs ${
                        item.ready ? "text-success" : "text-soft"
                      }`}
                    >
                      {item.value}
                    </p>
                    {item.detail ? (
                      <p className="mt-1 text-[11px] leading-4 text-muted">
                        {item.detail}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
              <div
                className="mt-3 rounded-md border border-line bg-surface px-3 py-2"
                data-testid="data-execution-packet-manifest-next-action"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-soft">Next action</p>
                  <button
                    type="button"
                    className="rounded-md border border-line bg-panel-strong px-2 py-1 text-[11px] font-semibold text-foreground transition hover:border-accent"
                    onClick={onCopyExecutionPacketNextAction}
                    data-testid="data-execution-packet-next-action-copy"
                  >
                    다음 조치 복사
                  </button>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {packetManifestNextAction}
                </p>
              </div>
              {!runtimeData ? (
                <p className="mt-2 text-xs leading-5 text-muted">
                  `상태 새로고침`으로 runtime readiness를 확인하면 실행 판정과
                  실행 패킷을 함께 복사할 수 있습니다.
                </p>
              ) : null}
            </div>
          ) : null}
          {preflightState.status === "error" ? (
            <p className="mt-2 text-xs leading-5 text-danger">
              {preflightState.error}
            </p>
          ) : null}
          {preflightState.status === "ready" &&
          preflightState.data?.insertOrder?.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[32rem] border-collapse text-left text-xs">
                <thead className="text-muted">
                  <tr className="border-b border-line">
                    <th className="py-2 pr-3 font-medium">Order</th>
                    <th className="px-3 py-2 font-medium">Table</th>
                    <th className="px-3 py-2 font-medium">Rows</th>
                    <th className="py-2 pl-3 font-medium">Dependency</th>
                  </tr>
                </thead>
                <tbody>
                  {preflightState.data.insertOrder.map((item) => (
                    <tr
                      key={`${item.order}-${item.table}`}
                      className="border-b border-line last:border-b-0"
                    >
                      <td className="py-2 pr-3 font-mono text-muted">
                        {item.order}
                      </td>
                      <td className="px-3 py-2 font-mono text-soft">
                        {item.table}
                      </td>
                      <td className="px-3 py-2 font-mono text-muted">
                        {item.rowCount}
                      </td>
                      <td className="py-2 pl-3 text-muted">
                        {item.dependency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {preflightState.checkedAt ? (
            <p className="mt-2 text-xs text-muted">
              확인 시각: {formatBackupDate(preflightState.checkedAt)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
