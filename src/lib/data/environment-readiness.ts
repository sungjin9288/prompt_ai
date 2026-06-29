export type EnvironmentReadinessStatus = "active" | "migration" | "future";

export interface EnvironmentReadinessItem {
  key: string;
  status: EnvironmentReadinessStatus;
  owner: "server" | "browser" | "operator";
  purpose: string;
  validation: string;
  risk: string;
}

export interface EnvironmentRuntimeVariableStatus {
  key: string;
  configured: boolean;
  owner: EnvironmentReadinessItem["owner"];
  status: EnvironmentReadinessStatus;
}

export type EnvironmentReleaseGateStage =
  | "blocked"
  | "local-ready"
  | "migration-ready";

export interface EnvironmentReleaseGateCheck {
  label: string;
  detail: string;
  nextAction: string;
  status: "block" | "pass" | "warn";
}

export interface EnvironmentReleaseGate {
  stage: EnvironmentReleaseGateStage;
  score: number;
  checks: EnvironmentReleaseGateCheck[];
}

export interface EnvironmentRuntimeStatus {
  checkedAt: string;
  generation: {
    configured: boolean;
    mode: "local" | "openai";
    model: string | null;
  };
  storage: {
    configured: boolean;
    mode: string;
  };
  supabase: {
    importExecutionEnabled: boolean;
    projectRefConfigured: boolean;
    publicClientConfigured: boolean;
    readyForMigration: boolean;
    serverImporterConfigured: boolean;
  };
  releaseGate: EnvironmentReleaseGate;
  variables: EnvironmentRuntimeVariableStatus[];
  warnings: string[];
}

export interface EnvironmentRuntimeSnapshot {
  id: string;
  savedAt: string;
  status: EnvironmentRuntimeStatus;
}

export interface EnvironmentRuntimeSnapshotComparison {
  changedChecks: Array<{
    current: EnvironmentReleaseGateCheck["status"];
    label: string;
    snapshot: EnvironmentReleaseGateCheck["status"];
  }>;
  changedVariables: Array<{
    current: boolean;
    key: string;
    snapshot: boolean;
  }>;
  currentStage: EnvironmentReleaseGateStage;
  scoreDelta: number;
  snapshotStage: EnvironmentReleaseGateStage;
  stageChanged: boolean;
}

export type EnvironmentVariableSource = Record<string, string | undefined>;

export const maxEnvironmentRuntimeSnapshots = 5;

export const ENVIRONMENT_READINESS_ITEMS: EnvironmentReadinessItem[] = [
  {
    key: "OPENAI_API_KEY",
    status: "active",
    owner: "server",
    purpose: "OpenAI Responses API 기반 프롬프트 품질 보강에 사용합니다.",
    validation: "/api/generate-prompt/status에서 configured=true인지 확인합니다.",
    risk: "비어 있으면 로컬 fallback으로 동작하므로 기능은 유지되지만 생성 품질 비교가 제한됩니다.",
  },
  {
    key: "OPENAI_MODEL",
    status: "active",
    owner: "server",
    purpose: "OpenAI 보강 생성에 사용할 모델명을 고정합니다.",
    validation: "설정하지 않으면 gpt-5-mini 기본값으로 동작합니다.",
    risk: "모델 변경 시 품질/비용/응답 속도가 달라지므로 릴리스 노트에 기록해야 합니다.",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    status: "migration",
    owner: "browser",
    purpose: "브라우저 Supabase client가 프로젝트 URL을 찾는 데 사용합니다.",
    validation: "Supabase project URL 형식이며 client bundle에 노출되어도 되는 값인지 확인합니다.",
    risk: "잘못된 프로젝트 URL은 인증과 RLS smoke test를 다른 프로젝트에서 실행하게 만듭니다.",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    status: "migration",
    owner: "browser",
    purpose: "RLS가 적용된 app-session 요청의 public anon key로 사용합니다.",
    validation: "anon key인지 확인하고 service_role key를 절대 넣지 않습니다.",
    risk: "service_role key가 브라우저에 노출되면 RLS 검증이 무력화됩니다.",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    status: "migration",
    owner: "server",
    purpose: "서버 전용 importer 또는 관리자 작업에서만 사용합니다.",
    validation: "서버 Route Handler, CLI, 비공개 실행 환경에서만 접근 가능한지 확인합니다.",
    risk: "클라이언트 번들, 로그, handoff 문서에 실제 값이 들어가면 안 됩니다.",
  },
  {
    key: "SUPABASE_PROJECT_REF",
    status: "migration",
    owner: "operator",
    purpose: "운영자가 SQL, migration, smoke evidence를 같은 Supabase 프로젝트 기준으로 묶을 때 사용합니다.",
    validation: "Supabase dashboard의 project ref와 handoff package의 대상 프로젝트가 일치해야 합니다.",
    risk: "프로젝트 ref가 섞이면 검증 SQL과 RLS evidence가 다른 환경 기준으로 기록될 수 있습니다.",
  },
  {
    key: "SUPABASE_IMPORT_EXECUTION_ENABLED",
    status: "migration",
    owner: "server",
    purpose: "server-only Supabase importer route에서 실제 write 실행을 명시적으로 여는 게이트입니다.",
    validation: "실제 이관 리허설 또는 운영 실행 직전에만 true로 설정하고, 실행 후 false로 되돌립니다.",
    risk: "항상 true로 두면 잘못된 요청이 실제 DB write 경로까지 도달할 수 있습니다.",
  },
  {
    key: "APP_STORAGE_MODE",
    status: "future",
    owner: "server",
    purpose: "localStorage, Supabase, hybrid 같은 저장소 모드를 명시적으로 전환할 때 사용합니다.",
    validation: "현재 MVP에서는 사용하지 않으며 Supabase repository 구현 시 도입합니다.",
    risk: "저장소 전환 플래그 없이 배포하면 로컬/원격 데이터 기준이 혼재될 수 있습니다.",
  },
];

function formatStatus(status: EnvironmentReadinessStatus) {
  if (status === "active") {
    return "현재 사용";
  }

  if (status === "migration") {
    return "Supabase 전환 준비";
  }

  return "후속 저장소 전환";
}

function formatOwner(owner: EnvironmentReadinessItem["owner"]) {
  if (owner === "server") {
    return "server only";
  }

  if (owner === "browser") {
    return "browser public";
  }

  return "operator note";
}

export function getEnvironmentReadinessCounts() {
  return ENVIRONMENT_READINESS_ITEMS.reduce(
    (counts, item) => ({
      ...counts,
      [item.status]: counts[item.status] + 1,
    }),
    { active: 0, future: 0, migration: 0 } satisfies Record<
      EnvironmentReadinessStatus,
      number
    >,
  );
}

export function buildEnvironmentExampleText() {
  return [
    "# Active AI generation",
    "OPENAI_API_KEY=",
    "OPENAI_MODEL=gpt-5-mini",
    "",
    "# Supabase migration target",
    "NEXT_PUBLIC_SUPABASE_URL=",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=",
    "SUPABASE_SERVICE_ROLE_KEY=",
    "SUPABASE_PROJECT_REF=",
    "SUPABASE_IMPORT_EXECUTION_ENABLED=false",
    "",
    "# Future storage switch",
    "APP_STORAGE_MODE=local",
  ].join("\n");
}

export function buildEnvironmentRuntimeStatusJson(
  runtimeStatus: EnvironmentRuntimeStatus,
) {
  return JSON.stringify(runtimeStatus, null, 2);
}

function isEnvironmentValueConfigured(value: string | undefined) {
  return Boolean(value?.trim());
}

function getEnvironmentStorageMode(env: EnvironmentVariableSource) {
  const configuredMode = env.APP_STORAGE_MODE?.trim();

  return configuredMode || "local";
}

export function buildEnvironmentRuntimeStatusFromEnv(
  env: EnvironmentVariableSource,
  checkedAt = new Date().toISOString(),
): EnvironmentRuntimeStatus {
  const openAiConfigured = isEnvironmentValueConfigured(env.OPENAI_API_KEY);
  const supabaseUrlConfigured = isEnvironmentValueConfigured(
    env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const supabaseAnonConfigured = isEnvironmentValueConfigured(
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const supabaseServiceConfigured = isEnvironmentValueConfigured(
    env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const supabaseProjectRefConfigured = isEnvironmentValueConfigured(
    env.SUPABASE_PROJECT_REF,
  );
  const supabaseImportExecutionEnabled =
    env.SUPABASE_IMPORT_EXECUTION_ENABLED?.trim() === "true";
  const storageMode = getEnvironmentStorageMode(env);
  const isVariableConfigured = (key: string) => {
    if (key === "OPENAI_API_KEY") {
      return openAiConfigured;
    }

    if (key === "OPENAI_MODEL") {
      return isEnvironmentValueConfigured(env.OPENAI_MODEL);
    }

    if (key === "NEXT_PUBLIC_SUPABASE_URL") {
      return supabaseUrlConfigured;
    }

    if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
      return supabaseAnonConfigured;
    }

    if (key === "SUPABASE_SERVICE_ROLE_KEY") {
      return supabaseServiceConfigured;
    }

    if (key === "SUPABASE_PROJECT_REF") {
      return supabaseProjectRefConfigured;
    }

    if (key === "SUPABASE_IMPORT_EXECUTION_ENABLED") {
      return isEnvironmentValueConfigured(env.SUPABASE_IMPORT_EXECUTION_ENABLED);
    }

    return isEnvironmentValueConfigured(env.APP_STORAGE_MODE);
  };
  const runtimeStatusWithoutGate: Omit<EnvironmentRuntimeStatus, "releaseGate"> =
    {
      checkedAt,
      generation: {
        configured: openAiConfigured,
        mode: openAiConfigured ? "openai" : "local",
        model: openAiConfigured ? env.OPENAI_MODEL || "gpt-5-mini" : null,
      },
      storage: {
        configured: isEnvironmentValueConfigured(env.APP_STORAGE_MODE),
        mode: storageMode,
      },
      supabase: {
        importExecutionEnabled: supabaseImportExecutionEnabled,
        projectRefConfigured: supabaseProjectRefConfigured,
        publicClientConfigured: supabaseUrlConfigured && supabaseAnonConfigured,
        readyForMigration:
          supabaseUrlConfigured &&
          supabaseAnonConfigured &&
          supabaseServiceConfigured &&
          supabaseProjectRefConfigured,
        serverImporterConfigured: supabaseServiceConfigured,
      },
      variables: ENVIRONMENT_READINESS_ITEMS.map((item) => ({
        configured: isVariableConfigured(item.key),
        key: item.key,
        owner: item.owner,
        status: item.status,
      })),
      warnings: [
        ...(openAiConfigured
          ? []
          : ["OPENAI_API_KEY is missing; generation uses local fallback."]),
        ...(supabaseUrlConfigured && supabaseAnonConfigured
          ? []
          : ["Supabase public client env is incomplete."]),
        ...(supabaseServiceConfigured
          ? []
          : ["SUPABASE_SERVICE_ROLE_KEY is missing; server importer cannot run."]),
        ...(storageMode === "local"
          ? []
          : [
              "APP_STORAGE_MODE is not local, but Supabase repository is not implemented yet.",
            ]),
        ...(supabaseImportExecutionEnabled
          ? [
              "SUPABASE_IMPORT_EXECUTION_ENABLED is true; disable it after the import run.",
            ]
          : []),
      ],
    };

  return {
    ...runtimeStatusWithoutGate,
    releaseGate: buildEnvironmentReleaseGate(runtimeStatusWithoutGate),
  };
}

export function buildEnvironmentReleaseGate(
  runtimeStatus: Omit<EnvironmentRuntimeStatus, "releaseGate">,
): EnvironmentReleaseGate {
  const checks: EnvironmentReleaseGateCheck[] = [
    {
      label: "Local fallback",
      detail:
        runtimeStatus.storage.mode === "local"
          ? "localStorage 기반 MVP 운영이 가능합니다."
          : "현재 저장소 모드가 local이 아닙니다.",
      nextAction:
        runtimeStatus.storage.mode === "local"
          ? "현재 로컬 MVP 흐름을 계속 사용할 수 있습니다."
          : "APP_STORAGE_MODE를 local로 되돌리거나 Supabase repository 구현 후 전환하세요.",
      status: runtimeStatus.storage.mode === "local" ? "pass" : "block",
    },
    {
      label: "OpenAI enhancement",
      detail: runtimeStatus.generation.configured
        ? "OpenAI 보강 생성이 활성화되어 있습니다."
        : "OpenAI 키가 없어 로컬 프롬프트 생성으로 운영됩니다.",
      nextAction: runtimeStatus.generation.configured
        ? "Studio에서 OpenAI 보강 생성 품질을 샘플 프롬프트로 확인하세요."
        : "OpenAI 테스트 시점에 OPENAI_API_KEY를 .env.local 또는 배포 환경 변수에 설정하세요.",
      status: runtimeStatus.generation.configured ? "pass" : "warn",
    },
    {
      label: "Supabase public client",
      detail: runtimeStatus.supabase.publicClientConfigured
        ? "Supabase browser client 환경이 준비되어 있습니다."
        : "Supabase URL 또는 anon key가 아직 없습니다.",
      nextAction: runtimeStatus.supabase.publicClientConfigured
        ? "RLS smoke test에서 app-session 요청이 anon key로 실행되는지 확인하세요."
        : "Supabase 프로젝트 생성 후 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.",
      status: runtimeStatus.supabase.publicClientConfigured ? "pass" : "warn",
    },
    {
      label: "Supabase server importer",
      detail: runtimeStatus.supabase.serverImporterConfigured
        ? "서버 전용 importer key가 설정되어 있습니다."
        : "server importer를 실행할 service role key가 없습니다.",
      nextAction: runtimeStatus.supabase.serverImporterConfigured
        ? "service role key가 서버/CLI 환경에만 있는지 배포 설정을 확인하세요."
        : "실제 importer를 만들기 전 SUPABASE_SERVICE_ROLE_KEY를 서버 전용 환경에만 설정하세요.",
      status: runtimeStatus.supabase.serverImporterConfigured ? "pass" : "warn",
    },
    {
      label: "Supabase project ref",
      detail: runtimeStatus.supabase.projectRefConfigured
        ? "Supabase project ref가 설정되어 있습니다."
        : "migration evidence를 묶을 project ref가 없습니다.",
      nextAction: runtimeStatus.supabase.projectRefConfigured
        ? "migration handoff package의 대상 프로젝트와 project ref가 같은지 확인하세요."
        : "Supabase dashboard의 project ref를 SUPABASE_PROJECT_REF에 기록하세요.",
      status: runtimeStatus.supabase.projectRefConfigured ? "pass" : "warn",
    },
    {
      label: "Supabase migration gate",
      detail: runtimeStatus.supabase.readyForMigration
        ? "Supabase 전환용 필수 env가 모두 설정되어 있습니다."
        : "Supabase 전환은 아직 준비되지 않았습니다.",
      nextAction: runtimeStatus.supabase.readyForMigration
        ? "dry-run, verification SQL, RLS smoke checklist 순서로 migration rehearsal을 진행하세요."
        : "Supabase public client, service role key, project ref를 모두 설정한 뒤 상태를 새로고침하세요.",
      status: runtimeStatus.supabase.readyForMigration ? "pass" : "warn",
    },
  ];
  const passCount = checks.filter((check) => check.status === "pass").length;
  const stage = checks.some((check) => check.status === "block")
    ? "blocked"
    : runtimeStatus.supabase.readyForMigration
      ? "migration-ready"
      : "local-ready";

  return {
    checks,
    score: Math.round((passCount / checks.length) * 100),
    stage,
  };
}

function formatReleaseGateStage(stage: EnvironmentReleaseGateStage) {
  if (stage === "migration-ready") {
    return "Supabase migration ready";
  }

  if (stage === "local-ready") {
    return "Local MVP ready";
  }

  return "Blocked";
}

export function buildEnvironmentRuntimeDiagnosticsText(
  runtimeStatus: EnvironmentRuntimeStatus,
) {
  const configuredVariables = runtimeStatus.variables.filter(
    (item) => item.configured,
  );
  const missingVariables = runtimeStatus.variables.filter(
    (item) => !item.configured,
  );
  const blockers = [
    ...(!runtimeStatus.generation.configured
      ? ["OpenAI generation is using local fallback."]
      : []),
    ...(!runtimeStatus.supabase.publicClientConfigured
      ? ["Supabase public client is incomplete."]
      : []),
    ...(!runtimeStatus.supabase.serverImporterConfigured
      ? ["Supabase server importer key is missing."]
      : []),
    ...(!runtimeStatus.supabase.projectRefConfigured
      ? ["Supabase project ref is missing."]
      : []),
    ...(runtimeStatus.storage.mode !== "local"
      ? ["Storage mode is not local, but the Supabase repository is not implemented."]
      : []),
  ];
  const actionQueue = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status !== "pass",
  );

  return [
    "# Prompt AI Studio Runtime Diagnostics",
    "",
    "## Snapshot",
    `- checked_at: ${runtimeStatus.checkedAt}`,
    `- generation_mode: ${runtimeStatus.generation.mode}`,
    `- generation_model: ${runtimeStatus.generation.model || "local fallback"}`,
    `- storage_mode: ${runtimeStatus.storage.mode}`,
    `- configured_variables: ${configuredVariables.length}`,
    `- missing_variables: ${missingVariables.length}`,
    "",
    "## Release gate",
    `- stage: ${formatReleaseGateStage(runtimeStatus.releaseGate.stage)}`,
    `- score: ${runtimeStatus.releaseGate.score}/100`,
    ...runtimeStatus.releaseGate.checks.map(
      (check) =>
        `- [${check.status === "pass" ? "x" : " "}] ${check.label}: ${
          check.status
        } - ${check.detail} Next action: ${check.nextAction}`,
    ),
    "",
    "## Supabase readiness",
    `- public_client_configured: ${
      runtimeStatus.supabase.publicClientConfigured ? "yes" : "no"
    }`,
    `- server_importer_configured: ${
      runtimeStatus.supabase.serverImporterConfigured ? "yes" : "no"
    }`,
    `- project_ref_configured: ${
      runtimeStatus.supabase.projectRefConfigured ? "yes" : "no"
    }`,
    `- ready_for_migration: ${
      runtimeStatus.supabase.readyForMigration ? "yes" : "no"
    }`,
    "",
    "## Variable status",
    ...runtimeStatus.variables.map(
      (item) =>
        `- [${item.configured ? "x" : " "}] ${item.key} (${formatOwner(
          item.owner,
        )}, ${formatStatus(item.status)})`,
    ),
    "",
    "## Warnings",
    ...(runtimeStatus.warnings.length > 0
      ? runtimeStatus.warnings.map((warning) => `- ${warning}`)
      : ["- none"]),
    "",
    "## Operator action queue",
    ...(actionQueue.length > 0
      ? actionQueue.map(
          (check) =>
            `- [ ] ${check.label}: ${check.nextAction} (${check.status})`,
        )
      : ["- [x] No operator action required for runtime readiness."]),
    "",
    "## Release blockers",
    ...(blockers.length > 0
      ? blockers.map((blocker) => `- [ ] ${blocker}`)
      : ["- [x] No runtime environment blockers detected."]),
    "",
    "## Secret handling",
    "- This report contains status booleans and labels only.",
    "- Do not paste raw API keys, Supabase anon keys, or service_role keys into this report.",
  ].join("\n");
}

export function buildEnvironmentOperatorActionPlanText(
  runtimeStatus: EnvironmentRuntimeStatus,
) {
  const actionQueue = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status !== "pass",
  );

  return [
    "# Prompt AI Studio Operator Action Plan",
    "",
    "## Current gate",
    `- checked_at: ${runtimeStatus.checkedAt}`,
    `- stage: ${formatReleaseGateStage(runtimeStatus.releaseGate.stage)}`,
    `- score: ${runtimeStatus.releaseGate.score}/100`,
    `- generation_mode: ${runtimeStatus.generation.mode}`,
    `- storage_mode: ${runtimeStatus.storage.mode}`,
    "",
    "## Action queue",
    ...(actionQueue.length > 0
      ? actionQueue.map(
          (check, index) =>
            `${index + 1}. ${check.label} [${check.status}]\n   - ${check.nextAction}\n   - Verify: ${check.detail}`,
        )
      : ["- No runtime environment action is required."]),
    "",
    "## Verification after changes",
    "- [ ] Restart the dev or deployment runtime after changing environment variables.",
    "- [ ] Open `/data` and click `상태 새로고침`.",
    "- [ ] Confirm release gate stage and score changed as expected.",
    "- [ ] Copy a fresh runtime diagnostics report.",
    "- [ ] Confirm no raw API keys or Supabase keys are pasted into handoff documents.",
    "",
    "## Secret handling",
    "- Set server-only values only in `.env.local`, deployment secrets, or a private CLI environment.",
    "- Never expose `SUPABASE_SERVICE_ROLE_KEY` through `NEXT_PUBLIC_*`, screenshots, docs, or client bundles.",
  ].join("\n");
}

export function createEnvironmentRuntimeSnapshot(
  status: EnvironmentRuntimeStatus,
): EnvironmentRuntimeSnapshot {
  const savedAt = new Date().toISOString();

  return {
    id: `env-${savedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
    savedAt,
    status,
  };
}

export function addEnvironmentRuntimeSnapshot(
  snapshots: EnvironmentRuntimeSnapshot[],
  status: EnvironmentRuntimeStatus,
) {
  return [createEnvironmentRuntimeSnapshot(status), ...snapshots].slice(
    0,
    maxEnvironmentRuntimeSnapshots,
  );
}

export function buildEnvironmentRuntimeSnapshotsJson(
  snapshots: EnvironmentRuntimeSnapshot[],
) {
  return JSON.stringify(
    {
      app: "prompt-ai-studio",
      exportedAt: new Date().toISOString(),
      kind: "runtime-readiness-snapshots",
      snapshots,
    },
    null,
    2,
  );
}

export function compareEnvironmentRuntimeSnapshot(
  currentStatus: EnvironmentRuntimeStatus,
  snapshot: EnvironmentRuntimeSnapshot,
): EnvironmentRuntimeSnapshotComparison {
  const snapshotVariables = new Map(
    snapshot.status.variables.map((item) => [item.key, item.configured]),
  );
  const snapshotChecks = new Map(
    snapshot.status.releaseGate.checks.map((check) => [check.label, check.status]),
  );

  return {
    changedChecks: currentStatus.releaseGate.checks
      .map((check) => ({
        current: check.status,
        label: check.label,
        snapshot: snapshotChecks.get(check.label) || "warn",
      }))
      .filter((item) => item.current !== item.snapshot),
    changedVariables: currentStatus.variables
      .map((item) => ({
        current: item.configured,
        key: item.key,
        snapshot: snapshotVariables.get(item.key) || false,
      }))
      .filter((item) => item.current !== item.snapshot),
    currentStage: currentStatus.releaseGate.stage,
    scoreDelta:
      currentStatus.releaseGate.score - snapshot.status.releaseGate.score,
    snapshotStage: snapshot.status.releaseGate.stage,
    stageChanged:
      currentStatus.releaseGate.stage !== snapshot.status.releaseGate.stage,
  };
}

export function buildEnvironmentRuntimeSnapshotComparisonText(
  currentStatus: EnvironmentRuntimeStatus,
  snapshot: EnvironmentRuntimeSnapshot,
) {
  const comparison = compareEnvironmentRuntimeSnapshot(currentStatus, snapshot);

  return [
    "# Prompt AI Studio Runtime Snapshot Comparison",
    "",
    "## Compared snapshots",
    `- saved_snapshot_id: ${snapshot.id}`,
    `- saved_at: ${snapshot.savedAt}`,
    `- saved_checked_at: ${snapshot.status.checkedAt}`,
    `- current_checked_at: ${currentStatus.checkedAt}`,
    "",
    "## Gate movement",
    `- previous_stage: ${formatReleaseGateStage(comparison.snapshotStage)}`,
    `- current_stage: ${formatReleaseGateStage(comparison.currentStage)}`,
    `- stage_changed: ${comparison.stageChanged ? "yes" : "no"}`,
    `- score_delta: ${comparison.scoreDelta >= 0 ? "+" : ""}${
      comparison.scoreDelta
    }`,
    "",
    "## Variable changes",
    ...(comparison.changedVariables.length > 0
      ? comparison.changedVariables.map(
          (item) =>
            `- ${item.key}: ${item.snapshot ? "configured" : "missing"} -> ${
              item.current ? "configured" : "missing"
            }`,
        )
      : ["- No variable status changes"]),
    "",
    "## Release gate check changes",
    ...(comparison.changedChecks.length > 0
      ? comparison.changedChecks.map(
          (item) => `- ${item.label}: ${item.snapshot} -> ${item.current}`,
        )
      : ["- No release gate check changes"]),
    "",
    "## Next verification",
    "- [ ] If score improved, copy a fresh runtime diagnostics report.",
    "- [ ] If stage changed, save a new runtime readiness snapshot.",
    "- [ ] If variables changed, confirm no raw secret values are included in copied reports.",
  ].join("\n");
}

function buildRuntimeStatusText(runtimeStatus?: EnvironmentRuntimeStatus) {
  if (!runtimeStatus) {
    return [
      "## Runtime status",
      "- not checked in this copied package",
      "- use `/data` or `/api/system/readiness` to inspect current server env state",
      "",
    ];
  }

  return [
    "## Runtime status",
    `- checked_at: ${runtimeStatus.checkedAt}`,
    `- generation_mode: ${runtimeStatus.generation.mode}`,
    `- openai_configured: ${runtimeStatus.generation.configured ? "yes" : "no"}`,
    `- openai_model: ${runtimeStatus.generation.model || "local fallback"}`,
    `- supabase_public_client: ${
      runtimeStatus.supabase.publicClientConfigured ? "configured" : "missing"
    }`,
    `- supabase_server_importer: ${
      runtimeStatus.supabase.serverImporterConfigured ? "configured" : "missing"
    }`,
    `- supabase_project_ref: ${
      runtimeStatus.supabase.projectRefConfigured ? "configured" : "missing"
    }`,
    `- supabase_ready_for_migration: ${
      runtimeStatus.supabase.readyForMigration ? "yes" : "no"
    }`,
    `- storage_mode: ${runtimeStatus.storage.mode}`,
    `- release_gate: ${formatReleaseGateStage(
      runtimeStatus.releaseGate.stage,
    )} (${runtimeStatus.releaseGate.score}/100)`,
    "",
    "### Release gate checks",
    ...runtimeStatus.releaseGate.checks.map(
      (check) =>
        `- [${check.status === "pass" ? "x" : " "}] ${check.label}: ${
          check.status
        } - ${check.detail} Next action: ${check.nextAction}`,
    ),
    "",
    "### Runtime variable checks",
    ...runtimeStatus.variables.map(
      (item) =>
        `- [${item.configured ? "x" : " "}] ${item.key} (${formatOwner(
          item.owner,
        )}, ${formatStatus(item.status)})`,
    ),
    "",
    "### Runtime warnings",
    ...(runtimeStatus.warnings.length > 0
      ? runtimeStatus.warnings.map((warning) => `- ${warning}`)
      : ["- none"]),
    "",
  ];
}

export function buildEnvironmentReadinessText(
  runtimeStatus?: EnvironmentRuntimeStatus,
) {
  const counts = getEnvironmentReadinessCounts();

  return [
    "# Prompt AI Studio Environment Readiness",
    "",
    "## Scope",
    "- Do not paste real secret values into this document.",
    "- Keep browser-public values separate from server-only values.",
    "- Current MVP works without OpenAI or Supabase keys by using local fallback.",
    "- Supabase variables are preparation targets until the repository layer is implemented.",
    "",
    "## Summary",
    `- active variables: ${counts.active}`,
    `- Supabase migration variables: ${counts.migration}`,
    `- future storage variables: ${counts.future}`,
    "",
    ...buildRuntimeStatusText(runtimeStatus),
    "## .env.local template",
    "```bash",
    buildEnvironmentExampleText(),
    "```",
    "",
    "## Checklist",
    ...ENVIRONMENT_READINESS_ITEMS.flatMap((item) => [
      `### ${item.key}`,
      `- status: ${formatStatus(item.status)}`,
      `- exposure: ${formatOwner(item.owner)}`,
      `- purpose: ${item.purpose}`,
      `- validation: ${item.validation}`,
      `- risk: ${item.risk}`,
      "",
    ]),
    "## Verification before production",
    "- [ ] Confirm `.env.local` is ignored by git.",
    "- [ ] Confirm no secret value appears in README, docs, screenshots, or handoff package.",
    "- [ ] Run `npm run lint` and `npm run build` after environment-dependent code changes.",
    "- [ ] Confirm `/api/generate-prompt/status` before testing OpenAI-enhanced generation.",
    "- [ ] Confirm Supabase anon/service keys are never swapped.",
    "- [ ] Run RLS smoke tests with app-session credentials, not service_role.",
  ].join("\n");
}
