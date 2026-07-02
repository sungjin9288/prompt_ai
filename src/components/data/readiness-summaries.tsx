"use client";

import {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import {
  ENVIRONMENT_READINESS_ITEMS,
  buildEnvironmentReadinessText,
  compareEnvironmentRuntimeSnapshot,
  getEnvironmentReadinessCounts,
  type EnvironmentRuntimeSnapshot,
  type EnvironmentRuntimeStatus,
  type EnvironmentReadinessStatus,
  type EnvironmentReleaseGateStage,
} from "@/lib/data/environment-readiness";
import { formatBackupDate, formatReleaseGateStage } from "./data-view-shared";

export interface RuntimeReadinessState {
  data?: EnvironmentRuntimeStatus;
  error?: string;
  status: "error" | "loading" | "ready";
}

export interface EnvironmentReadinessSummaryProps {
  onCopyChecklist: () => void;
  onCopyEnvTemplate: () => void;
  onCopyOperatorActionPlan: () => void;
  onCopyRuntimeDiagnostics: () => void;
  onCopyRuntimeJson: () => void;
  onCopySnapshots: () => void;
  onCopySnapshotComparison: () => void;
  onClearSnapshots: () => void;
  onRefreshRuntimeStatus: () => void;
  onSaveSnapshot: () => void;
  runtimeState: RuntimeReadinessState;
  snapshots: EnvironmentRuntimeSnapshot[];
}

export function formatEnvironmentStatus(status: EnvironmentReadinessStatus) {
  if (status === "active") {
    return "현재";
  }

  if (status === "migration") {
    return "전환";
  }

  return "후속";
}

export function getEnvironmentStatusClass(status: EnvironmentReadinessStatus) {
  if (status === "active") {
    return "border-success/40 bg-success/10 text-success";
  }

  if (status === "migration") {
    return "border-accent/40 bg-accent/10 text-accent";
  }

  return "border-line bg-panel-strong text-muted";
}

export function formatConfigured(value: boolean | undefined) {
  if (value === undefined) {
    return "미확인";
  }

  return value ? "설정됨" : "미설정";
}

export function getConfiguredClass(value: boolean | undefined) {
  if (value === undefined) {
    return "border-line bg-panel-strong text-muted";
  }

  return value
    ? "border-success/40 bg-success/10 text-success"
    : "border-danger/40 bg-danger/10 text-danger";
}

export function getReleaseGateStageClass(stage: EnvironmentReleaseGateStage) {
  if (stage === "migration-ready") {
    return "border-success/40 bg-success/10 text-success";
  }

  if (stage === "local-ready") {
    return "border-accent/40 bg-accent/10 text-accent";
  }

  return "border-danger/40 bg-danger/10 text-danger";
}

export function getGateCheckClass(status: "block" | "pass" | "warn") {
  if (status === "pass") {
    return "border-success/40 bg-success/10 text-success";
  }

  if (status === "warn") {
    return "border-accent/40 bg-accent/10 text-accent";
  }

  return "border-danger/40 bg-danger/10 text-danger";
}

export function EnvironmentReadinessSummary({
  onCopyChecklist,
  onCopyEnvTemplate,
  onCopyOperatorActionPlan,
  onCopyRuntimeDiagnostics,
  onCopyRuntimeJson,
  onCopySnapshotComparison,
  onCopySnapshots,
  onClearSnapshots,
  onRefreshRuntimeStatus,
  onSaveSnapshot,
  runtimeState,
  snapshots,
}: EnvironmentReadinessSummaryProps) {
  const counts = getEnvironmentReadinessCounts();
  const runtimeData = runtimeState.data;
  const preview = buildEnvironmentReadinessText(runtimeData);
  const latestSnapshot = snapshots[0];
  const snapshotComparison =
    runtimeData && latestSnapshot
      ? compareEnvironmentRuntimeSnapshot(runtimeData, latestSnapshot)
      : null;
  const actionQueue =
    runtimeData?.releaseGate.checks.filter(
      (check) => check.status !== "pass",
    ) || [];
  const runtimeSummaryItems = [
    [
      "생성 엔진",
      runtimeData
        ? runtimeData.generation.mode === "openai"
          ? `OpenAI · ${runtimeData.generation.model}`
          : "Local fallback"
        : runtimeState.status === "loading"
          ? "확인 중"
          : "미확인",
    ],
    [
      "Supabase client",
      runtimeData
        ? formatConfigured(runtimeData.supabase.publicClientConfigured)
        : "미확인",
    ],
    [
      "Server importer",
      runtimeData
        ? formatConfigured(runtimeData.supabase.serverImporterConfigured)
        : "미확인",
    ],
    ["Storage mode", runtimeData?.storage.mode || "local"],
  ];

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">
            운영 환경 readiness
          </p>
          <p className="mt-1 text-sm leading-5 text-muted">
            OpenAI 보강 생성과 Supabase 전환에 필요한 환경 변수, 노출 범위,
            검증 기준, 현재 서버 설정 상태를 한 번에 정리합니다.
          </p>
        </div>
        <div className="grid shrink-0 gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onRefreshRuntimeStatus}
          >
            상태 새로고침
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!runtimeData}
            onClick={onCopyRuntimeJson}
          >
            상태 JSON 복사
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!runtimeData}
            onClick={onCopyRuntimeDiagnostics}
          >
            진단 리포트 복사
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!runtimeData}
            onClick={onCopyOperatorActionPlan}
          >
            조치 계획 복사
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            disabled={!runtimeData}
            onClick={onSaveSnapshot}
          >
            스냅샷 저장
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onCopyEnvTemplate}
          >
            .env 템플릿 복사
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={onCopyChecklist}
          >
            Readiness 복사
          </button>
        </div>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"
        data-testid="data-environment-readiness-metrics"
      >
        {[
          ["현재 사용", `${counts.active}개`],
          ["Supabase 전환", `${counts.migration}개`],
          ["후속 전환", `${counts.future}개`],
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

      <div className="mt-4 rounded-md border border-line bg-surface px-3 py-3">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-soft">Runtime preflight</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              실제 값은 표시하지 않고 설정 여부만 서버에서 확인합니다.
            </p>
          </div>
          <span
            className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${
              runtimeState.status === "ready"
                ? "border-success/40 bg-success/10 text-success"
                : runtimeState.status === "loading"
                  ? "border-line bg-panel-strong text-muted"
                  : "border-danger/40 bg-danger/10 text-danger"
            }`}
          >
            {runtimeState.status === "ready"
              ? "확인 완료"
              : runtimeState.status === "loading"
                ? "확인 중"
                : "확인 실패"}
          </span>
        </div>

        <div
          className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4"
          data-testid="data-runtime-preflight-metrics"
        >
          {runtimeSummaryItems.map(([label, value]) => (
            <div
              key={label}
              className="min-w-0 rounded-md border border-line bg-panel-strong px-3 py-3"
            >
              <p className="text-xs text-muted">{label}</p>
              <p className="mt-1 break-words font-mono text-xs text-soft">
                {value}
              </p>
            </div>
          ))}
        </div>

        {runtimeData ? (
          <div className="mt-3 rounded-md border border-line bg-panel-strong px-3 py-3">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-soft">Release gate</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  로컬 운영과 Supabase 전환 기준을 분리해 판정합니다.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-semibold ${getReleaseGateStageClass(
                    runtimeData.releaseGate.stage,
                  )}`}
                >
                  {formatReleaseGateStage(runtimeData.releaseGate.stage)}
                </span>
                <span className="rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs font-semibold text-soft">
                  {runtimeData.releaseGate.score}/100
                </span>
              </div>
            </div>
            <div className="mt-3 grid gap-2 lg:grid-cols-2">
              {runtimeData.releaseGate.checks.map((check) => (
                <div
                  key={check.label}
                  className="rounded-md border border-line bg-surface px-3 py-3"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-soft">
                      {check.label}
                    </p>
                    <span
                      className={`rounded-md border px-2 py-1 text-xs font-semibold ${getGateCheckClass(
                        check.status,
                      )}`}
                    >
                      {check.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {check.detail}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-soft">
                    {check.nextAction}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {actionQueue.length > 0 ? (
          <div className="mt-3 rounded-md border border-accent/40 bg-accent/10 px-3 py-3">
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-accent">
                Operator action queue
              </p>
              <span className="rounded-md border border-accent/40 bg-surface px-2 py-1 font-mono text-xs font-semibold text-accent">
                {actionQueue.length}개 조치
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {actionQueue.map((check) => (
                <div
                  key={check.label}
                  className="rounded-md border border-line bg-surface px-3 py-3"
                >
                  <p className="text-xs font-semibold text-soft">{check.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {check.nextAction}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {runtimeData?.warnings.length ? (
          <div className="mt-3 space-y-1">
            {runtimeData.warnings.map((warning) => (
              <p key={warning} className="text-xs leading-5 text-muted">
                {warning}
              </p>
            ))}
          </div>
        ) : runtimeState.error ? (
          <p className="mt-3 text-xs leading-5 text-danger">
            {runtimeState.error}
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-md border border-line bg-surface px-3 py-3">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-soft">
              Runtime snapshot history
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              최근 readiness 점검 결과를 브라우저에 최대 5개까지 보관합니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={snapshots.length === 0}
              onClick={onCopySnapshots}
            >
              스냅샷 JSON 복사
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={!snapshotComparison}
              onClick={onCopySnapshotComparison}
            >
              비교 리포트 복사
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={snapshots.length === 0}
              onClick={onClearSnapshots}
            >
              스냅샷 삭제
            </button>
          </div>
        </div>

        <div
          className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"
          data-testid="data-runtime-snapshot-metrics"
        >
          {[
            ["저장 수", `${snapshots.length}개`],
            [
              "최근 stage",
              latestSnapshot
                ? formatReleaseGateStage(latestSnapshot.status.releaseGate.stage)
                : "없음",
            ],
            [
              "최근 score",
              latestSnapshot
                ? `${latestSnapshot.status.releaseGate.score}/100`
                : "없음",
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              className="min-w-0 rounded-md border border-line bg-panel-strong px-3 py-3"
            >
              <p className="text-xs text-muted">{label}</p>
              <p className="mt-1 break-words font-mono text-xs text-soft">
                {value}
              </p>
            </div>
          ))}
        </div>

        {latestSnapshot ? (
          <div className="mt-3 space-y-3">
            <p className="break-words text-xs leading-5 text-muted">
              최근 저장: {formatBackupDate(latestSnapshot.savedAt)} · 기준 점검{" "}
              {formatBackupDate(latestSnapshot.status.checkedAt)}
            </p>
            {snapshotComparison ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  [
                    "Stage 변화",
                    snapshotComparison.stageChanged ? "변경됨" : "동일",
                  ],
                  [
                    "Score 변화",
                    `${snapshotComparison.scoreDelta >= 0 ? "+" : ""}${
                      snapshotComparison.scoreDelta
                    }`,
                  ],
                  [
                    "변수 변화",
                    `${snapshotComparison.changedVariables.length}개`,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-w-0 rounded-md border border-line bg-panel-strong px-3 py-3"
                  >
                    <p className="text-xs text-muted">{label}</p>
                    <p className="mt-1 break-words font-mono text-xs text-soft">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {ENVIRONMENT_READINESS_ITEMS.map((item) => {
          const variableStatus = runtimeData?.variables.find(
            (variable) => variable.key === item.key,
          );

          return (
            <div
              key={item.key}
              className="rounded-md border border-line bg-surface px-3 py-3"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="break-all font-mono text-xs font-semibold text-soft">
                  {item.key}
                </p>
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-semibold ${getEnvironmentStatusClass(
                    item.status,
                  )}`}
                >
                  {formatEnvironmentStatus(item.status)}
                </span>
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-semibold ${getConfiguredClass(
                    variableStatus?.configured,
                  )}`}
                >
                  {formatConfigured(variableStatus?.configured)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">{item.purpose}</p>
            </div>
          );
        })}
      </div>

      <pre className="mt-4 max-h-52 overflow-auto rounded-md border border-line bg-surface p-3 text-xs leading-5 text-muted">
        {preview}
      </pre>
    </div>
  );
}
