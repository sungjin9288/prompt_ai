import {
  compareEnvironmentRuntimeSnapshot,
  getEnvironmentReadinessCounts,
  type EnvironmentRuntimeSnapshot,
  type EnvironmentRuntimeStatus,
} from "@/lib/data/environment-readiness";
import {
  formatBackupDate,
  formatJsonLength,
  formatReleaseGateStage,
} from "./data-view-shared";

export function buildEnvironmentTemplateManualCopyText({
  templateText,
}: {
  templateText: string;
}) {
  const counts = getEnvironmentReadinessCounts();

  return [
    "# Prompt AI Studio .env.local Template",
    "",
    "## 템플릿 식별",
    `- 템플릿 길이: ${formatJsonLength(templateText)}`,
    `- Active variables: ${counts.active}`,
    `- Supabase migration variables: ${counts.migration}`,
    `- Future storage variables: ${counts.future}`,
    "",
    "## Exposure guard 요약",
    "- OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY are server-only values.",
    "- NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are browser-public values.",
    "- SUPABASE_IMPORT_EXECUTION_ENABLED must default to false outside a controlled server-side import window.",
    "- APP_STORAGE_MODE stays local until the storage migration is intentionally enabled.",
    "- Do not commit .env.local or paste real secret values into docs, screenshots, or handoff packages.",
    "",
    "## .env.local template",
    templateText,
  ].join("\n");
}

export function buildEnvironmentReadinessManualCopyText({
  checklistText,
  runtimeStatus,
}: {
  checklistText: string;
  runtimeStatus?: EnvironmentRuntimeStatus;
}) {
  const counts = getEnvironmentReadinessCounts();
  const actionQueue =
    runtimeStatus?.releaseGate.checks.filter((check) => check.status !== "pass") ??
    [];
  const missingVariables =
    runtimeStatus?.variables.filter((item) => !item.configured) ?? [];

  return [
    "# Prompt AI Studio Environment Readiness Checklist",
    "",
    "## Readiness checklist 식별",
    `- 체크리스트 길이: ${formatJsonLength(checklistText)}`,
    `- Active variables: ${counts.active}`,
    `- Supabase migration variables: ${counts.migration}`,
    `- Future storage variables: ${counts.future}`,
    "",
    "## Runtime readiness 요약",
    `- 확인 시각: ${
      runtimeStatus ? formatBackupDate(runtimeStatus.checkedAt) : "not refreshed"
    }`,
    `- Release gate: ${
      runtimeStatus
        ? `${formatReleaseGateStage(runtimeStatus.releaseGate.stage)} (${runtimeStatus.releaseGate.score}/100)`
        : "not refreshed"
    }`,
    `- Generation mode: ${
      runtimeStatus
        ? runtimeStatus.generation.mode === "openai"
          ? `OpenAI · ${runtimeStatus.generation.model}`
          : "Local fallback"
        : "not refreshed"
    }`,
    `- Storage mode: ${runtimeStatus?.storage.mode ?? "not refreshed"}`,
    `- Supabase client: ${
      runtimeStatus
        ? runtimeStatus.supabase.publicClientConfigured
          ? "configured"
          : "missing"
        : "not refreshed"
    }`,
    `- Server importer: ${
      runtimeStatus
        ? runtimeStatus.supabase.serverImporterConfigured
          ? "configured"
          : "missing"
        : "not refreshed"
    }`,
    `- Import execution gate: ${
      runtimeStatus
        ? runtimeStatus.supabase.importExecutionEnabled
          ? "enabled"
          : "disabled"
        : "not refreshed"
    }`,
    `- Missing variables: ${missingVariables.length}개`,
    `- Action queue: ${actionQueue.length}개`,
    "",
    "## 운영 gate 요약",
    "- Keep server-only and browser-public values separate before sharing this checklist.",
    "- The MVP remains usable with local fallback when OpenAI or Supabase variables are missing.",
    "- SUPABASE_IMPORT_EXECUTION_ENABLED should stay false until a controlled server-side import window.",
    "- Run RLS smoke tests with app-session credentials, not a service_role key.",
    "",
    "## Environment readiness checklist",
    checklistText,
  ].join("\n");
}

export function buildRuntimeStatusManualCopyText({
  json,
  runtimeStatus,
}: {
  json: string;
  runtimeStatus: EnvironmentRuntimeStatus;
}) {
  const missingVariables = runtimeStatus.variables.filter(
    (item) => !item.configured,
  );
  const actionQueue = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status !== "pass",
  );

  return [
    "# Prompt AI Studio 런타임 상태 JSON",
    "",
    "## 런타임 식별",
    `- 확인 시각: ${formatBackupDate(runtimeStatus.checkedAt)}`,
    `- Release gate: ${formatReleaseGateStage(
      runtimeStatus.releaseGate.stage,
    )} (${runtimeStatus.releaseGate.score}/100)`,
    `- JSON 길이: ${formatJsonLength(json)}`,
    "",
    "## 운영 요약",
    `- 생성 엔진: ${
      runtimeStatus.generation.mode === "openai"
        ? `OpenAI · ${runtimeStatus.generation.model}`
        : "Local fallback"
    }`,
    `- Storage mode: ${runtimeStatus.storage.mode}`,
    `- Supabase client: ${
      runtimeStatus.supabase.publicClientConfigured ? "configured" : "missing"
    }`,
    `- Server importer: ${
      runtimeStatus.supabase.serverImporterConfigured ? "configured" : "missing"
    }`,
    `- Project ref: ${
      runtimeStatus.supabase.projectRefConfigured ? "configured" : "missing"
    }`,
    `- Import execution gate: ${
      runtimeStatus.supabase.importExecutionEnabled ? "enabled" : "disabled"
    }`,
    `- Missing variables: ${missingVariables.length}개`,
    `- Action queue: ${actionQueue.length}개`,
    "",
    "## JSON",
    json,
  ].join("\n");
}

export function buildRuntimeDiagnosticsManualCopyText({
  diagnosticsText,
  runtimeStatus,
}: {
  diagnosticsText: string;
  runtimeStatus: EnvironmentRuntimeStatus;
}) {
  const actionQueue = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status !== "pass",
  );
  const missingVariables = runtimeStatus.variables.filter(
    (item) => !item.configured,
  );

  return [
    "# Prompt AI Studio 런타임 진단 리포트",
    "",
    "## 진단 식별",
    `- 확인 시각: ${formatBackupDate(runtimeStatus.checkedAt)}`,
    `- Release gate: ${formatReleaseGateStage(
      runtimeStatus.releaseGate.stage,
    )} (${runtimeStatus.releaseGate.score}/100)`,
    `- 리포트 길이: ${formatJsonLength(diagnosticsText)}`,
    "",
    "## 운영 요약",
    `- 생성 엔진: ${
      runtimeStatus.generation.mode === "openai"
        ? `OpenAI · ${runtimeStatus.generation.model}`
        : "Local fallback"
    }`,
    `- Storage mode: ${runtimeStatus.storage.mode}`,
    `- Supabase client: ${
      runtimeStatus.supabase.publicClientConfigured ? "configured" : "missing"
    }`,
    `- Server importer: ${
      runtimeStatus.supabase.serverImporterConfigured ? "configured" : "missing"
    }`,
    `- Project ref: ${
      runtimeStatus.supabase.projectRefConfigured ? "configured" : "missing"
    }`,
    `- Import execution gate: ${
      runtimeStatus.supabase.importExecutionEnabled ? "enabled" : "disabled"
    }`,
    `- Missing variables: ${missingVariables.length}개`,
    `- Action queue: ${actionQueue.length}개`,
    "",
    "## 공유 gate 요약",
    "- Do not paste raw API keys, Supabase anon keys, or service_role keys into this report.",
    "- Treat warning/block release gate checks as the operator action queue.",
    "- Keep SUPABASE_IMPORT_EXECUTION_ENABLED disabled unless a controlled server-side import window is active.",
    "",
    "## Runtime diagnostics report",
    diagnosticsText,
  ].join("\n");
}

export function buildOperatorActionPlanManualCopyText({
  actionPlanText,
  runtimeStatus,
}: {
  actionPlanText: string;
  runtimeStatus: EnvironmentRuntimeStatus;
}) {
  const actionQueue = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status !== "pass",
  );
  const blockers = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status === "block",
  );
  const warnings = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status === "warn",
  );

  return [
    "# Prompt AI Studio 운영자 조치 계획",
    "",
    "## 조치 계획 식별",
    `- 확인 시각: ${formatBackupDate(runtimeStatus.checkedAt)}`,
    `- Release gate: ${formatReleaseGateStage(
      runtimeStatus.releaseGate.stage,
    )} (${runtimeStatus.releaseGate.score}/100)`,
    `- 계획 길이: ${formatJsonLength(actionPlanText)}`,
    "",
    "## Action queue 요약",
    `- Action queue: ${actionQueue.length}개`,
    `- Blockers: ${blockers.length}개`,
    `- Warnings: ${warnings.length}개`,
    `- Generation mode: ${runtimeStatus.generation.mode}`,
    `- Storage mode: ${runtimeStatus.storage.mode}`,
    `- Import execution gate: ${
      runtimeStatus.supabase.importExecutionEnabled ? "enabled" : "disabled"
    }`,
    "",
    "## 실행 후 확인 gate",
    "- Restart the dev or deployment runtime after environment variable changes.",
    "- Open `/data` and refresh runtime readiness after changes.",
    "- Copy a fresh runtime diagnostics report after the release gate changes.",
    "- Confirm no raw API keys, Supabase anon keys, or service_role keys are pasted into handoff documents.",
    "",
    "## Operator action plan",
    actionPlanText,
  ].join("\n");
}

export function buildRuntimeSnapshotsManualCopyText({
  json,
  snapshots,
}: {
  json: string;
  snapshots: EnvironmentRuntimeSnapshot[];
}) {
  const latestSnapshot = snapshots[0];

  return [
    "# Prompt AI Studio 런타임 스냅샷 JSON",
    "",
    "## 스냅샷 식별",
    `- 스냅샷 수: ${snapshots.length}개`,
    `- 최근 스냅샷 ID: ${latestSnapshot.id}`,
    `- 최근 저장 시각: ${formatBackupDate(latestSnapshot.savedAt)}`,
    `- 최근 확인 시각: ${formatBackupDate(latestSnapshot.status.checkedAt)}`,
    `- 최근 Release gate: ${formatReleaseGateStage(
      latestSnapshot.status.releaseGate.stage,
    )} (${latestSnapshot.status.releaseGate.score}/100)`,
    `- JSON 길이: ${formatJsonLength(json)}`,
    "",
    "## JSON",
    json,
  ].join("\n");
}

export function buildRuntimeSnapshotComparisonManualCopyText({
  comparisonText,
  currentStatus,
  snapshot,
}: {
  comparisonText: string;
  currentStatus: EnvironmentRuntimeStatus;
  snapshot: EnvironmentRuntimeSnapshot;
}) {
  const comparison = compareEnvironmentRuntimeSnapshot(currentStatus, snapshot);

  return [
    "# Prompt AI Studio 런타임 스냅샷 비교 리포트",
    "",
    "## 비교 리포트 식별",
    `- 최근 스냅샷 ID: ${snapshot.id}`,
    `- 최근 저장 시각: ${formatBackupDate(snapshot.savedAt)}`,
    `- 스냅샷 점검 시각: ${formatBackupDate(snapshot.status.checkedAt)}`,
    `- 현재 점검 시각: ${formatBackupDate(currentStatus.checkedAt)}`,
    `- 리포트 길이: ${formatJsonLength(comparisonText)}`,
    "",
    "## Gate 변화 요약",
    `- 이전 stage: ${formatReleaseGateStage(comparison.snapshotStage)}`,
    `- 현재 stage: ${formatReleaseGateStage(comparison.currentStage)}`,
    `- Stage 변경: ${comparison.stageChanged ? "yes" : "no"}`,
    `- Score delta: ${comparison.scoreDelta >= 0 ? "+" : ""}${
      comparison.scoreDelta
    }`,
    `- 변수 변경: ${comparison.changedVariables.length}개`,
    `- Release gate check 변경: ${comparison.changedChecks.length}개`,
    "",
    "## 후속 확인 gate",
    "- If score improved, copy a fresh runtime diagnostics report.",
    "- If stage changed, save a new runtime readiness snapshot.",
    "- If variables changed, confirm no raw secret values are included in copied reports.",
    "",
    "## Runtime snapshot comparison report",
    comparisonText,
  ].join("\n");
}
