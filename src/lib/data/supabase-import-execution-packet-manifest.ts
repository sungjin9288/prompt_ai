import {
  formatSupabaseImportPreflightScopeChangeDetails,
  formatSupabaseImportPreflightScopeChanges,
  getSupabaseImportPreflightScopeChangeDetails,
  getSupabaseImportPreflightScopeChanges,
  getSupabaseImportPreflightScopeStatus,
  type SupabaseImportPreflightScope,
} from "./supabase-import-preflight-scope";

export interface SupabaseImportExecutionPacketManifestItem {
  copyDetail?: string;
  detail?: string;
  label: string;
  ready: boolean;
  value: string;
}

export interface SupabaseImportExecutionPacketManifestStatus {
  detail: string;
  label: string;
  tone: "attention" | "blocked" | "ready";
}

export interface SupabaseImportExecutionPacketCopyActionStatus {
  action: string;
  detail: string;
  label: string;
  ready: boolean;
}

export interface SupabaseImportExecutionPacketManifestSummary {
  copyGate: "operator review required" | "resolve waiting items";
  readyCount: number;
  totalCount: number;
  waitingCount: number;
}

export interface SupabaseImportExecutionPacketPreflightState
  extends SupabaseImportPreflightScope {
  data?: {
    auditArtifactText?: string;
    status?: string;
    validation?: {
      ok?: boolean;
    };
  };
  status: "error" | "idle" | "loading" | "ready";
}

export interface SupabaseImportExecutionPacketRuntimeState {
  importExecutionEnabled?: boolean;
  ready: boolean;
  releaseGateStageLabel?: string;
  status: "error" | "loading" | "ready";
}

export function getSupabaseImportExecutionPacketManifestItems({
  backupFingerprint,
  ownerUserId,
  preflightState,
  runtimeState,
  sectionCount,
  workspaceId,
}: {
  backupFingerprint: string;
  ownerUserId: string;
  preflightState: SupabaseImportExecutionPacketPreflightState;
  runtimeState: SupabaseImportExecutionPacketRuntimeState;
  sectionCount: number;
  workspaceId: string;
}): SupabaseImportExecutionPacketManifestItem[] {
  const trimmedWorkspaceId = workspaceId.trim();
  const trimmedOwnerUserId = ownerUserId.trim();
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
  const preflightCanUse = preflightReady && preflightScopeStatus === "current";
  const preflightValidationOk =
    preflightCanUse && preflightState.data?.validation?.ok === true;
  const scopeChanges =
    preflightScopeStatus === "stale"
      ? getSupabaseImportPreflightScopeChanges({
          current: {
            backupFingerprint,
            ownerUserId: trimmedOwnerUserId,
            workspaceId: trimmedWorkspaceId,
          },
          preflight: preflightState,
        })
      : [];
  const scopeChangeDetails =
    preflightScopeStatus === "stale"
      ? getSupabaseImportPreflightScopeChangeDetails({
          current: {
            backupFingerprint,
            ownerUserId: trimmedOwnerUserId,
            workspaceId: trimmedWorkspaceId,
          },
          preflight: preflightState,
        })
      : [];
  const scopeChangeSummary =
    formatSupabaseImportPreflightScopeChanges(scopeChanges);
  const scopeChangeDetail =
    formatSupabaseImportPreflightScopeChangeDetails(scopeChangeDetails);

  return [
    {
      label: "Preflight",
      ready: preflightCanUse,
      value: preflightReady
        ? preflightScopeStatus === "current"
          ? preflightState.data?.status || "ready"
          : "stale"
        : "대기",
    },
    {
      copyDetail: scopeChangeDetail || undefined,
      detail: scopeChangeSummary || undefined,
      label: "Scope",
      ready: preflightCanUse,
      value: preflightReady
        ? preflightScopeStatus === "current"
          ? "current"
          : "재실행 필요"
        : "대기",
    },
    {
      label: "Validation",
      ready: preflightValidationOk,
      value: preflightReady
        ? preflightValidationOk
          ? "ok"
          : "blocked"
        : "대기",
    },
    {
      label: "Runtime",
      ready: runtimeState.ready,
      value: runtimeState.ready
        ? runtimeState.releaseGateStageLabel || "미확인"
        : runtimeState.status === "loading"
          ? "확인 중"
          : "미확인",
    },
    {
      label: "Route audit",
      ready: Boolean(preflightState.data?.auditArtifactText),
      value: preflightState.data?.auditArtifactText ? "포함" : "미포함",
    },
    {
      label: "Execution gate",
      ready: runtimeState.ready,
      value: runtimeState.ready
        ? runtimeState.importExecutionEnabled
          ? "armed"
          : "disabled"
        : "미확인",
    },
    {
      label: "Packet sections",
      ready: preflightCanUse && runtimeState.ready,
      value:
        preflightCanUse && runtimeState.ready ? `${sectionCount}개` : "대기",
    },
  ];
}

export function getSupabaseImportExecutionPacketManifestItemCopyDetail(
  item: SupabaseImportExecutionPacketManifestItem,
) {
  return item.copyDetail ?? item.detail;
}

export function formatSupabaseImportExecutionPacketManifestItemLine(
  item: SupabaseImportExecutionPacketManifestItem,
) {
  const detail = getSupabaseImportExecutionPacketManifestItemCopyDetail(item);

  return `- [${item.ready ? "x" : " "}] ${item.label}: ${item.value}${
    detail ? ` / ${detail}` : ""
  }`;
}

export function formatSupabaseImportExecutionPacketWaitingItemLine(
  item: SupabaseImportExecutionPacketManifestItem,
) {
  const detail = getSupabaseImportExecutionPacketManifestItemCopyDetail(item);

  return `- ${item.label}: ${item.value}${detail ? ` / ${detail}` : ""}`;
}

export function getSupabaseImportExecutionPacketManifestItemByLabel(
  items: SupabaseImportExecutionPacketManifestItem[],
  label: string,
) {
  return items.find((item) => item.label === label);
}

export function getSupabaseImportExecutionPacketCopyActionStatuses(
  items: SupabaseImportExecutionPacketManifestItem[],
): SupabaseImportExecutionPacketCopyActionStatus[] {
  const scopeReady =
    getSupabaseImportExecutionPacketManifestItemByLabel(items, "Scope")
      ?.ready === true;
  const runtimeReady =
    getSupabaseImportExecutionPacketManifestItemByLabel(items, "Runtime")
      ?.ready === true;
  const packetSectionsReady =
    getSupabaseImportExecutionPacketManifestItemByLabel(
      items,
      "Packet sections",
    )?.ready === true;

  return [
    {
      action: "대기 항목이 바뀌면 다시 복사해 operator note를 갱신하세요.",
      detail: "첫 대기 항목과 다음 조치를 복사할 수 있습니다.",
      label: "Next action",
      ready: true,
    },
    {
      action: scopeReady
        ? "manifest를 복사해 실행 패킷 검토 기록에 첨부하세요."
        : "API preflight를 현재 입력값으로 다시 실행하세요.",
      detail: scopeReady
        ? "현재 preflight scope로 manifest를 복사할 수 있습니다."
        : "현재 백업 fingerprint와 workspace/owner UUID로 API preflight를 다시 실행해야 합니다.",
      label: "Manifest",
      ready: scopeReady,
    },
    {
      action:
        packetSectionsReady && runtimeReady
          ? "controlled packet을 복사하기 전에 operator review를 완료하세요."
          : "runtime readiness를 새로고침하고 current preflight scope를 확인하세요.",
      detail:
        packetSectionsReady && runtimeReady
          ? "runtime readiness가 포함된 controlled packet을 복사할 수 있습니다."
          : "current preflight scope와 runtime readiness가 모두 필요합니다.",
      label: "Controlled packet",
      ready: packetSectionsReady && runtimeReady,
    },
  ];
}

export function formatSupabaseImportExecutionPacketCopyActionStatusLine(
  action: SupabaseImportExecutionPacketCopyActionStatus,
) {
  return `- [${action.ready ? "x" : " "}] ${action.label}: ${
    action.detail
  } Next: ${action.action}`;
}

export function getSupabaseImportExecutionPacketManifestSummary(
  items: SupabaseImportExecutionPacketManifestItem[],
): SupabaseImportExecutionPacketManifestSummary {
  const readyCount = items.filter((item) => item.ready).length;
  const waitingCount = items.length - readyCount;

  return {
    copyGate:
      waitingCount === 0 ? "operator review required" : "resolve waiting items",
    readyCount,
    totalCount: items.length,
    waitingCount,
  };
}

export function formatSupabaseImportExecutionPacketCopyGateLabel(
  copyGate: SupabaseImportExecutionPacketManifestSummary["copyGate"],
) {
  return copyGate === "operator review required"
    ? "operator review 필요"
    : "대기 항목 해결 필요";
}

export function getSupabaseImportExecutionPacketManifestNextAction(
  items: SupabaseImportExecutionPacketManifestItem[],
  options: { detailMode?: "copy" | "display" } = {},
) {
  const waitingItem = items.find((item) => !item.ready);

  if (!waitingItem) {
    return "All manifest items are ready. Copy the controlled execution packet and complete operator review before any server-side write window.";
  }

  const waitingDetail =
    options.detailMode === "copy"
      ? getSupabaseImportExecutionPacketManifestItemCopyDetail(waitingItem)
      : waitingItem.detail;

  switch (waitingItem.label) {
    case "Preflight":
      if (waitingItem.value === "stale") {
        const scopeItem = getSupabaseImportExecutionPacketManifestItemByLabel(
          items,
          "Scope",
        );
        const scopeDetail =
          scopeItem && options.detailMode === "copy"
            ? getSupabaseImportExecutionPacketManifestItemCopyDetail(scopeItem)
            : scopeItem?.detail;

        return scopeDetail
          ? `Rerun API preflight because the saved preflight scope is stale. ${scopeDetail}.`
          : "Rerun API preflight because the saved preflight scope does not match the current backup or UUID inputs.";
      }

      return "Run API preflight with the current backup fingerprint, workspace_id, and owner_user_id.";
    case "Scope":
      return waitingDetail
        ? `Rerun API preflight because the saved preflight scope is stale. ${waitingDetail}.`
        : "Rerun API preflight because the saved preflight scope does not match the current backup or UUID inputs.";
    case "Validation":
      return "Resolve API preflight validation blockers before preparing the controlled execution packet.";
    case "Runtime":
      return "Refresh runtime readiness so the packet includes the current release gate and Supabase execution gate state.";
    case "Route audit":
      return "Rerun API preflight and confirm the route audit artifact is included in the response.";
    case "Execution gate":
      return "Refresh runtime readiness before deciding whether the server-side execution gate is disabled or armed.";
    case "Packet sections":
      return "Complete current preflight scope and runtime readiness before copying the full controlled execution packet.";
    default:
      return `Review ${waitingItem.label} before copying the controlled execution packet.`;
  }
}

export function getSupabaseImportExecutionPacketManifestStatus(
  items: SupabaseImportExecutionPacketManifestItem[],
  options: { detailMode?: "copy" | "display" } = {},
): SupabaseImportExecutionPacketManifestStatus {
  const waitingItem = items.find((item) => !item.ready);
  const summary = getSupabaseImportExecutionPacketManifestSummary(items);
  const nextAction = getSupabaseImportExecutionPacketManifestNextAction(
    items,
    options,
  );

  if (!waitingItem) {
    return {
      detail:
        "Controlled packet is ready to copy after operator review; it still does not execute Supabase writes.",
      label: `${summary.readyCount}/${summary.totalCount} ready`,
      tone: "ready",
    };
  }

  return {
    detail: nextAction,
    label: `${summary.readyCount}/${summary.totalCount} ready - waiting: ${waitingItem.label}`,
    tone: waitingItem.label === "Runtime" ? "attention" : "blocked",
  };
}

export function buildSupabaseImportExecutionPacketNextActionText({
  backupFingerprint,
  checkedAt,
  items,
  ownerUserId,
  preflightCheckedAt,
  workspaceId,
}: {
  backupFingerprint?: string;
  checkedAt?: string;
  items: SupabaseImportExecutionPacketManifestItem[];
  ownerUserId: string;
  preflightCheckedAt?: string;
  workspaceId: string;
}) {
  const summary = getSupabaseImportExecutionPacketManifestSummary(items);
  const waitingItem = items.find((item) => !item.ready);
  const waitingDetail = waitingItem
    ? getSupabaseImportExecutionPacketManifestItemCopyDetail(waitingItem)
    : undefined;
  const nextAction = getSupabaseImportExecutionPacketManifestNextAction(items, {
    detailMode: "copy",
  });
  const manifestStatus = getSupabaseImportExecutionPacketManifestStatus(items, {
    detailMode: "copy",
  });
  const copyActionStatuses =
    getSupabaseImportExecutionPacketCopyActionStatuses(items);

  return [
    "# Supabase Import Execution Packet Next Action",
    "",
    `- checkedAt: ${checkedAt || new Date().toISOString()}`,
    `- backupFingerprint: ${backupFingerprint || "not provided"}`,
    `- workspaceId: ${workspaceId || "not provided"}`,
    `- ownerUserId: ${ownerUserId || "not provided"}`,
    `- preflightCheckedAt: ${preflightCheckedAt || "not provided"}`,
    `- manifestReady: ${summary.readyCount}/${summary.totalCount}`,
    `- waitingItems: ${summary.waitingCount}`,
    `- copyGate: ${summary.copyGate}`,
    `- manifestStatus: ${manifestStatus.label}`,
    `- manifestStatusDetail: ${manifestStatus.detail}`,
    `- waitingItem: ${
      waitingItem ? `${waitingItem.label} (${waitingItem.value})` : "none"
    }`,
    `- waitingDetail: ${waitingDetail || "none"}`,
    "",
    "## Copy actions",
    ...copyActionStatuses.map(
      formatSupabaseImportExecutionPacketCopyActionStatusLine,
    ),
    "",
    "## Next action",
    `- ${nextAction}`,
    "",
    "## Guardrail",
    "- This note is an operator handoff artifact only and does not execute Supabase writes.",
  ].join("\n");
}

export function buildSupabaseImportExecutionPacketManifestText({
  backupFingerprint,
  checkedAt,
  items,
  ownerUserId,
  preflightCheckedAt,
  workspaceId,
}: {
  backupFingerprint?: string;
  checkedAt?: string;
  items: SupabaseImportExecutionPacketManifestItem[];
  ownerUserId: string;
  preflightCheckedAt?: string;
  workspaceId: string;
}) {
  const summary = getSupabaseImportExecutionPacketManifestSummary(items);
  const waitingItems = items.filter((item) => !item.ready);
  const nextAction = getSupabaseImportExecutionPacketManifestNextAction(items, {
    detailMode: "copy",
  });
  const manifestStatus = getSupabaseImportExecutionPacketManifestStatus(items, {
    detailMode: "copy",
  });
  const copyActionStatuses =
    getSupabaseImportExecutionPacketCopyActionStatuses(items);

  return [
    "# Prompt AI Studio Supabase Import Execution Packet Manifest",
    "",
    `- checkedAt: ${checkedAt || new Date().toISOString()}`,
    `- backupFingerprint: ${backupFingerprint || "not provided"}`,
    `- workspaceId: ${workspaceId || "not provided"}`,
    `- ownerUserId: ${ownerUserId || "not provided"}`,
    `- preflightCheckedAt: ${preflightCheckedAt || "not provided"}`,
    `- ready: ${summary.readyCount}/${summary.totalCount}`,
    `- waitingItems: ${summary.waitingCount}`,
    `- copyGate: ${summary.copyGate}`,
    `- manifestStatus: ${manifestStatus.label}`,
    `- manifestStatusDetail: ${manifestStatus.detail}`,
    "",
    "## Manifest",
    ...items.map(formatSupabaseImportExecutionPacketManifestItemLine),
    "",
    "## Waiting items",
    ...(waitingItems.length
      ? waitingItems.map(formatSupabaseImportExecutionPacketWaitingItemLine)
      : ["- none"]),
    "",
    "## Copy actions",
    ...copyActionStatuses.map(
      formatSupabaseImportExecutionPacketCopyActionStatusLine,
    ),
    "",
    "## Next action",
    `- ${nextAction}`,
    "",
    "## Operator note",
    "- This manifest is a status artifact only and does not execute Supabase writes.",
    "- Do not paste service-role keys or other secrets into this document.",
    "- Copy the full controlled execution packet only after preflight scope is current and runtime readiness has been reviewed.",
  ].join("\n");
}
