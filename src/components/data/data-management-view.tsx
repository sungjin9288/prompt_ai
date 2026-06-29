"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import {
  Field,
  PageHeader,
  Panel,
  PanelHeader,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import {
  ContextOperatingFlow,
  type ContextOperatingFlowItem,
} from "@/components/context/context-operating-flow";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import {
  useCompanyProfileStore,
  useDeletedPromptAssetsStore,
  useLearningMemoriesStore,
  usePromptAssetsStore,
  usePromptSkillsStore,
  useRuntimeReadinessSnapshotsStore,
  useUserProfileStore,
  useWorkspaceBackupMetaStore,
} from "@/lib/data/workspace-store";
import {
  ENVIRONMENT_READINESS_ITEMS,
  addEnvironmentRuntimeSnapshot,
  buildEnvironmentExampleText,
  buildEnvironmentOperatorActionPlanText,
  buildEnvironmentReadinessText,
  buildEnvironmentRuntimeSnapshotComparisonText,
  buildEnvironmentRuntimeDiagnosticsText,
  buildEnvironmentRuntimeSnapshotsJson,
  buildEnvironmentRuntimeStatusJson,
  compareEnvironmentRuntimeSnapshot,
  getEnvironmentReadinessCounts,
  type EnvironmentRuntimeSnapshot,
  type EnvironmentRuntimeStatus,
  type EnvironmentReadinessStatus,
  type EnvironmentReleaseGateStage,
} from "@/lib/data/environment-readiness";
import {
  buildSupabaseImporterAdapterContractText,
  createSupabaseImporterPlan,
} from "@/lib/data/supabase-importer";
import {
  buildSupabaseImportExecutionPlanText,
} from "@/lib/data/supabase-import-execution-plan";
import {
  buildSupabaseImportExecutionPacketManifestText,
  buildSupabaseImportExecutionPacketNextActionText,
  formatSupabaseImportExecutionPacketCopyGateLabel,
  getSupabaseImportExecutionPacketCopyActionStatuses,
  getSupabaseImportExecutionPacketManifestItems,
  getSupabaseImportExecutionPacketManifestNextAction,
  getSupabaseImportExecutionPacketManifestStatus,
  getSupabaseImportExecutionPacketManifestSummary,
  type SupabaseImportExecutionPacketManifestItem,
  type SupabaseImportExecutionPacketManifestStatus as ExecutionPacketManifestStatus,
} from "@/lib/data/supabase-import-execution-packet-manifest";
import {
  getSupabaseImportPreflightScopeError as getSupabaseImportPreflightScopeErrorText,
  getSupabaseImportPreflightScopeStatus,
} from "@/lib/data/supabase-import-preflight-scope";
import {
  buildSupabaseImportPendingIdAuditSql,
  buildSupabaseImportReferenceReplacementGuideText,
  buildSupabaseImportRelationshipVerificationSql,
  buildSupabaseImportRlsAccessAuditSql,
  buildSupabaseImportVerificationReportText,
  buildSupabaseImportVerificationSql,
  buildSupabaseMigrationHandoffPackageText,
  buildSupabaseRlsPolicyDraftSql,
  buildSupabaseRlsSmokeTestChecklistText,
  buildSupabaseImportDryRunText,
  createSupabaseImportDryRun,
  getSupabaseImportVerificationCheckCounts,
  isSupabaseWorkspaceUuid,
  type SupabaseImportDryRun,
} from "@/lib/data/supabase-import-dry-run";
import {
  createWorkspaceBackup,
  createWorkspaceBackupMeta,
  getWorkspaceBackupCountChanges,
  getWorkspaceBackupFingerprint,
  isWorkspaceBackupMetaCurrent,
  parseWorkspaceBackup,
  restoreWorkspaceBackup,
  serializeWorkspaceBackup,
  summarizeWorkspaceBackupData,
  type WorkspaceBackupCounts,
  type WorkspaceBackupData,
  type WorkspaceBackup,
  type WorkspaceBackupCountChange,
  type WorkspaceBackupParseResult,
} from "@/lib/storage/workspace-backup";
import { writeStudioDraft } from "@/lib/studio/draft";

const supabaseImportVerificationCheckCounts =
  getSupabaseImportVerificationCheckCounts();
const supabaseImportExecutionPacketSectionCount = 10;

interface ReadinessItem {
  label: string;
  description: string;
  ready: boolean;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
}

interface RestoreImpactItem {
  label: string;
  current: string | number;
  incoming: string | number;
}

interface RestoreRiskItem {
  label: string;
  description: string;
}

interface DataManualCopy {
  title: string;
  body: string;
}

interface MigrationMappingItem {
  table: string;
  source: string;
  records: number;
  status: "ready" | "needs-context" | "future";
  note: string;
}

interface MigrationChecklistItem {
  label: string;
  status: "ready" | "blocked" | "manual";
  detail: string;
}

interface RestoreReportParams {
  backup: WorkspaceBackup;
  currentBackupFingerprint?: string;
  importFingerprint: string;
  importSource: string;
  impactItems: RestoreImpactItem[];
  riskItems: RestoreRiskItem[];
}

interface ImportValidationSummaryProps {
  backup: WorkspaceBackup;
  canRestore: boolean;
  currentExportFingerprint?: string;
  importSource: string;
  rawJson: string;
  restoreAlreadyApplied: boolean;
}

interface ExportActionSummaryProps {
  counts: WorkspaceBackupCounts;
  exportedAt: string;
  fingerprint: string;
  jsonLength: number;
  onCopy: () => void;
  onDownload: () => void;
}

interface RestoreReportSummaryProps extends RestoreReportParams {
  onCopy: () => void;
}

interface MigrationMappingSummaryProps {
  items: MigrationMappingItem[];
  onCopy: () => void;
}

interface MigrationChecklistSummaryProps {
  items: MigrationChecklistItem[];
  onCopy: () => void;
}

interface SupabaseImportDryRunSummaryProps {
  dryRun: SupabaseImportDryRun;
  onCopy: () => void;
}

interface SupabaseReferenceReplacementGuideSummaryProps {
  dryRun: SupabaseImportDryRun;
  onCopy: () => void;
}

interface SupabaseImportExecutionPlanSummaryProps {
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

interface SupabaseImportApiPreflightState {
  backupFingerprint?: string;
  checkedAt?: string;
  data?: SupabaseImportApiPreflightResponse;
  error?: string;
  ownerUserId?: string;
  status: "error" | "idle" | "loading" | "ready";
  workspaceId?: string;
}

interface SupabaseImportApiPreflightResponse {
  auditArtifactText?: string;
  dryRun?: {
    batches: number;
    totalRows: number;
    warnings: unknown[];
  };
  error?: string;
  insertOrder?: Array<{
    dependency: string;
    order: number;
    rowCount: number;
    table: string;
  }>;
  plan?: {
    archiveTraceFields: number;
    generatedUuidCount: number;
    totalRows: number;
    unresolvedPendingReferences: unknown[];
  };
  requiredConfirmation?: string;
  status: string;
  validation?: {
    blockers: string[];
    ok: boolean;
  };
}

interface SupabaseVerificationSqlSummaryProps {
  dryRun: SupabaseImportDryRun;
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
  onWorkspaceIdChange: (value: string) => void;
}

interface SupabaseRelationshipVerificationSqlSummaryProps {
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
}

interface SupabasePendingIdAuditSqlSummaryProps {
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
}

interface SupabaseRlsAccessAuditSqlSummaryProps {
  ownerUserId: string;
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
  onOwnerUserIdChange: (value: string) => void;
}

interface SupabaseRlsPolicyDraftSummaryProps {
  onCopy: () => void;
}

interface SupabaseRlsSmokeTestSummaryProps {
  ownerUserId: string;
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
}

interface SupabaseVerificationReportSummaryProps {
  dryRun: SupabaseImportDryRun;
  ownerUserId: string;
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
}

interface SupabaseMigrationHandoffPackageSummaryProps {
  dryRun: SupabaseImportDryRun;
  ownerUserId: string;
  workspaceId: string;
  onCopyResolved: () => void;
  onCopyTemplate: () => void;
}

interface RuntimeReadinessState {
  data?: EnvironmentRuntimeStatus;
  error?: string;
  status: "error" | "loading" | "ready";
}

interface EnvironmentReadinessSummaryProps {
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

interface DocumentRagReadinessItem {
  artifact: string;
  detail: string;
  evidence: string;
  nextAction: string;
  status: "planned" | "ready";
}

interface DocumentRagReadinessSummaryProps {
  chunks: DocumentRagChunkPreview[];
  onClearDraft: () => void;
  onCopyIngestionPacket: () => void;
  onCopyReadiness: () => void;
  onDocumentFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDocumentNameChange: (value: string) => void;
  onDocumentTextChange: (value: string) => void;
  onOpenInStudio: () => void;
  sourceName: string;
  text: string;
}

interface DocumentRagChunkPreview {
  content: string;
  end: number;
  index: number;
  start: number;
}

const documentRagChunkSize = 900;
const documentRagMaxPreviewChunks = 4;

const documentRagReadinessItems = [
  {
    artifact: "pgvector extension",
    detail: "Supabase schema draft already enables vector support.",
    evidence: "docs/database-schema.sql · create extension vector",
    nextAction: "Confirm embedding dimension and vector index before production.",
    status: "ready",
  },
  {
    artifact: "document_sources",
    detail: "Workspace-scoped source records are defined for upload, url, note, and integration.",
    evidence: "docs/database-schema.sql · document_sources",
    nextAction: "Bind the future upload UI to source metadata and owner workspace.",
    status: "ready",
  },
  {
    artifact: "document_chunks",
    detail: "Chunk rows can store content, metadata, order, and embedding vectors.",
    evidence: "docs/database-schema.sql · document_chunks",
    nextAction: "Add chunking and embedding jobs after the Supabase repository lands.",
    status: "ready",
  },
  {
    artifact: "ingestion gate",
    detail: "The app still needs a trusted parser and file-size/type policy before upload.",
    evidence: "future route handler",
    nextAction: "Accept text-like documents first, reject unsafe or oversized files early.",
    status: "planned",
  },
  {
    artifact: "retrieval gate",
    detail: "Prompt generation still needs a workspace-scoped retrieval contract.",
    evidence: "future prompt context adapter",
    nextAction: "Return cited chunks with source IDs before injecting context into prompts.",
    status: "planned",
  },
] satisfies DocumentRagReadinessItem[];

function formatBackupDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatJsonLength(value: string) {
  return `${value.trim().length.toLocaleString("ko-KR")}자`;
}

function getDocumentRagStatusLabel(status: DocumentRagReadinessItem["status"]) {
  return status === "ready" ? "준비됨" : "설계 필요";
}

function buildDocumentRagReadinessText() {
  const readyItems = documentRagReadinessItems.filter(
    (item) => item.status === "ready",
  );
  const plannedItems = documentRagReadinessItems.filter(
    (item) => item.status === "planned",
  );

  return [
    "# Prompt AI Studio Document RAG Readiness",
    "",
    `- Ready artifacts: ${readyItems.length}/${documentRagReadinessItems.length}`,
    `- Planned gates: ${plannedItems.length}`,
    "- Current scope: schema and operator readiness only; no document upload writes yet.",
    "",
    "## Readiness map",
    ...documentRagReadinessItems.map(
      (item) =>
        `- ${item.artifact}: ${getDocumentRagStatusLabel(item.status)} · ${item.detail} · evidence: ${item.evidence} · next: ${item.nextAction}`,
    ),
    "",
    "## Required gates before upload",
    "- Apply `docs/database-schema.sql` with pgvector enabled.",
    "- Keep uploads workspace-scoped through `document_sources.workspace_id`.",
    "- Split content into deterministic `document_chunks.chunk_index` rows.",
    "- Generate embeddings in a trusted server-side job, not in browser code.",
    "- Return cited source IDs and chunk indexes before using retrieved text in prompt context.",
  ].join("\n");
}

function buildDocumentRagReadinessManualCopyText({
  reportText,
}: {
  reportText: string;
}) {
  const readyItems = documentRagReadinessItems.filter(
    (item) => item.status === "ready",
  );
  const plannedItems = documentRagReadinessItems.filter(
    (item) => item.status === "planned",
  );

  return [
    "# Prompt AI Studio 문서/RAG 준비도",
    "",
    "## 준비도 식별",
    `- 준비된 항목: ${readyItems.length}/${documentRagReadinessItems.length}`,
    `- 설계 필요 항목: ${plannedItems.length}개`,
    `- 리포트 길이: ${formatJsonLength(reportText)}`,
    "",
    "## 실행 전 gate 요약",
    "- pgvector schema exists, but upload execution is not enabled yet.",
    "- document_sources and document_chunks must stay workspace-scoped.",
    "- Embeddings should be generated server-side.",
    "- Retrieved chunks must keep source ID and chunk index citations.",
    "",
    "## Document RAG readiness",
    reportText,
  ].join("\n");
}

function normalizeDocumentRagText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function createDocumentRagChunks(value: string): DocumentRagChunkPreview[] {
  const text = normalizeDocumentRagText(value);

  if (!text) {
    return [];
  }

  const chunks: DocumentRagChunkPreview[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const nextCursor = Math.min(cursor + documentRagChunkSize, text.length);
    const content = text.slice(cursor, nextCursor).trim();

    if (content) {
      chunks.push({
        content,
        end: nextCursor,
        index: chunks.length,
        start: cursor,
      });
    }

    cursor = nextCursor;
  }

  return chunks;
}

function buildDocumentRagIngestionPacketText({
  chunks,
  sourceName,
  text,
}: {
  chunks: DocumentRagChunkPreview[];
  sourceName: string;
  text: string;
}) {
  const normalizedText = normalizeDocumentRagText(text);
  const resolvedSourceName = sourceName.trim() || "untitled-document";

  return [
    "# Prompt AI Studio Document RAG Ingestion Packet",
    "",
    "## Source",
    `- sourceName: ${resolvedSourceName}`,
    "- sourceType: upload",
    "- executionMode: local preview only",
    `- textLength: ${normalizedText.length}`,
    `- chunkSize: ${documentRagChunkSize}`,
    `- chunkCount: ${chunks.length}`,
    "",
    "## Gate",
    "- Do not write these rows until the Supabase repository and server-side embedding job are ready.",
    "- Store one `document_sources` row first, then write ordered `document_chunks` rows.",
    "- Generate embeddings server-side and keep source ID plus chunk index citations.",
    "- Reject unsafe or oversized files before this packet becomes an import job.",
    "",
    "## Chunk preview",
    ...chunks.slice(0, documentRagMaxPreviewChunks).map((chunk) =>
      [
        `### chunk ${chunk.index}`,
        `- range: ${chunk.start}-${chunk.end}`,
        "",
        chunk.content,
      ].join("\n"),
    ),
    chunks.length > documentRagMaxPreviewChunks
      ? `\n- ${chunks.length - documentRagMaxPreviewChunks} additional chunks omitted from preview.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildDocumentRagIngestionPacketManualCopyText({
  chunks,
  packetText,
  sourceName,
  text,
}: {
  chunks: DocumentRagChunkPreview[];
  packetText: string;
  sourceName: string;
  text: string;
}) {
  return [
    "# Prompt AI Studio 문서/RAG 수집 패킷",
    "",
    "## 패킷 식별",
    `- sourceName: ${sourceName.trim() || "untitled-document"}`,
    `- 원문 길이: ${normalizeDocumentRagText(text).length}자`,
    `- chunk 수: ${chunks.length}개`,
    `- 패킷 길이: ${formatJsonLength(packetText)}`,
    "",
    "## 실행 전 gate 요약",
    "- This packet is local preview only.",
    "- document_sources row must be created before document_chunks rows.",
    "- Embeddings must be generated server-side.",
    "- Retrieval must preserve source ID and chunk index citations.",
    "",
    "## Ingestion packet",
    packetText,
  ].join("\n");
}

function buildDocumentRagStudioDraftInput({
  chunks,
  sourceName,
  text,
}: {
  chunks: DocumentRagChunkPreview[];
  sourceName: string;
  text: string;
}) {
  const normalizedText = normalizeDocumentRagText(text);
  const resolvedSourceName = sourceName.trim() || "untitled-document";

  return [
    `문서 이름: ${resolvedSourceName}`,
    `문서 길이: ${normalizedText.length}자`,
    `chunk 수: ${chunks.length}개`,
    "",
    "이 문서 맥락을 바탕으로 외부 AI에 전달할 전문 프롬프트를 작성해줘.",
    "프롬프트 언어는 AI가 문서 성격을 판단해 전체 영어 지시문 또는 한영 하이브리드로 선택해줘.",
    "반드시 source ID와 chunk index를 인용 기준으로 남기고, 문서에 없는 내용은 가정으로 분리해줘.",
    "",
    "## Chunk context",
    ...chunks.slice(0, documentRagMaxPreviewChunks).map((chunk) =>
      [
        `### chunk ${chunk.index}`,
        `range: ${chunk.start}-${chunk.end}`,
        "",
        chunk.content,
      ].join("\n"),
    ),
    chunks.length > documentRagMaxPreviewChunks
      ? `\n추가 chunk ${chunks.length - documentRagMaxPreviewChunks}개는 수집 패킷에서 확인해야 합니다.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildBackupManualCopyText({
  exportedAt,
  fingerprint,
  json,
  counts,
}: {
  counts: WorkspaceBackupCounts;
  exportedAt: string;
  fingerprint: string;
  json: string;
}) {
  return [
    "# Prompt AI Studio 백업 JSON",
    "",
    "## 백업 식별",
    `- 생성 시각: ${formatBackupDate(exportedAt)}`,
    `- 백업 지문: ${fingerprint}`,
    `- JSON 길이: ${formatJsonLength(json)}`,
    "",
    "## 수량 요약",
    `- 프롬프트: ${counts.prompts}개`,
    `- 버전: ${counts.promptVersions}개`,
    `- 피드백: ${counts.feedback}개`,
    `- 학습 메모리: ${counts.memories}개`,
    `- 스킬: ${counts.skills}개`,
    `- 스킬 실행: ${counts.skillRuns}개`,
    `- 삭제 보관함: ${counts.deletedPrompts ?? 0}개`,
    "",
    "## JSON",
    json,
  ].join("\n");
}

function buildRestoreReportManualCopyText({
  backup,
  currentBackupFingerprint,
  importFingerprint,
  importSource,
  impactItems,
  reportText,
  riskItems,
}: RestoreReportParams & {
  reportText: string;
}) {
  const changedItems = impactItems.filter(
    (item) => formatChange(item.current, item.incoming) !== "동일",
  );
  const fingerprintComparison = currentBackupFingerprint
    ? currentBackupFingerprint === importFingerprint
      ? "일치"
      : "다름"
    : "기준 없음";

  return [
    "# Prompt AI Studio 복원 리포트",
    "",
    "## 복원 리포트 식별",
    `- 백업 생성: ${formatBackupDate(backup.exportedAt)}`,
    `- 가져온 방식: ${importSource}`,
    `- 가져온 백업 지문: ${importFingerprint}`,
    `- 최근 백업 기준 지문: ${currentBackupFingerprint || "없음"}`,
    `- 지문 비교: ${fingerprintComparison}`,
    `- 리포트 길이: ${formatJsonLength(reportText)}`,
    "",
    "## 복원 영향 요약",
    `- 변경 항목: ${changedItems.length}개`,
    `- 리스크 항목: ${riskItems.length}개`,
    `- 프롬프트: ${backup.counts.prompts}개`,
    `- 버전: ${backup.counts.promptVersions}개`,
    `- 피드백: ${backup.counts.feedback}개`,
    `- 학습 메모리: ${backup.counts.memories}개`,
    `- 스킬: ${backup.counts.skills}개`,
    `- 삭제 보관함: ${backup.counts.deletedPrompts ?? 0}개`,
    "",
    "## 실행 전 gate 요약",
    "- Keep the original backup JSON file separately before restore.",
    "- Review all changed count and profile fields before replacing browser data.",
    "- If fingerprints differ, confirm this is the intended backup source.",
    "- Restore replaces the current local browser data with the validated backup.",
    "",
    "## Restore report",
    reportText,
  ].join("\n");
}

function buildEnvironmentTemplateManualCopyText({
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

function buildEnvironmentReadinessManualCopyText({
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

function buildRuntimeStatusManualCopyText({
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

function buildRuntimeDiagnosticsManualCopyText({
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

function buildOperatorActionPlanManualCopyText({
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

function buildRuntimeSnapshotsManualCopyText({
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

function buildRuntimeSnapshotComparisonManualCopyText({
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

async function fetchRuntimeReadinessStatus() {
  const response = await fetch("/api/system/readiness", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as EnvironmentRuntimeStatus;
}

async function fetchSupabaseImportApiPreflight({
  backup,
  ownerUserId,
  workspaceId,
}: {
  backup: WorkspaceBackup;
  ownerUserId: string;
  workspaceId: string;
}) {
  const response = await fetch("/api/data/supabase-import", {
    body: JSON.stringify({
      backup,
      execute: false,
      includePayload: false,
      ownerUserId,
      workspaceId,
    }),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const data = (await response.json()) as SupabaseImportApiPreflightResponse;

  if (!response.ok) {
    throw new Error(
      "error" in data && typeof data.error === "string"
        ? data.error
        : `HTTP ${response.status}`,
    );
  }

  return data;
}

function ExportActionSummary({
  counts,
  exportedAt,
  fingerprint,
  jsonLength,
  onCopy,
  onDownload,
}: ExportActionSummaryProps) {
  const items = [
    ["생성 시각", formatBackupDate(exportedAt)],
    ["백업 지문", fingerprint],
    ["JSON 길이", `${jsonLength.toLocaleString("ko-KR")}자`],
    ["프롬프트", `${counts.prompts}개`],
    ["스킬", `${counts.skills}개`],
    ["삭제 보관함", `${counts.deletedPrompts ?? 0}개`],
  ];

  return (
    <div className="rounded-md border border-line bg-surface px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">백업 파일 확보</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            생성된 JSON을 다운로드하거나 복사해 브라우저 밖에도 보관하세요.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onCopy}
          >
            복사
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={onDownload}
          >
            다운로드
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
        {items.map(([label, value]) => (
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
    </div>
  );
}

function CountGrid({ counts }: { counts: WorkspaceBackupCounts }) {
  const items = [
    ["프롬프트", counts.prompts],
    ["버전", counts.promptVersions],
    ["피드백", counts.feedback],
    ["학습 메모리", counts.memories],
    ["스킬", counts.skills],
    ["스킬 실행", counts.skillRuns],
    ["삭제 보관함", counts.deletedPrompts],
  ];

  return (
    <div
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      data-testid="data-workspace-count-metrics"
    >
      {items.map(([label, value]) => (
        <div
          key={label}
          className="min-w-0 rounded-md border border-line bg-surface px-3 py-3 sm:px-4"
        >
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-1 font-mono text-xl font-semibold sm:text-2xl">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function ImportValidationSummary({
  backup,
  canRestore,
  currentExportFingerprint,
  importSource,
  rawJson,
  restoreAlreadyApplied,
}: ImportValidationSummaryProps) {
  const importFingerprint = getWorkspaceBackupFingerprint(rawJson);
  const fingerprintMatchesCurrentExport =
    currentExportFingerprint !== undefined &&
    importFingerprint === currentExportFingerprint;
  const fingerprintMatchStatus =
    currentExportFingerprint === undefined
      ? null
      : fingerprintMatchesCurrentExport
        ? "최근 백업 기준과 일치"
        : "최근 백업 기준과 다름";
  const items = [
    ["백업 앱", backup.app],
    ["스키마", `v${backup.schemaVersion}`],
    ["백업 생성", formatBackupDate(backup.exportedAt)],
    ["가져온 방식", importSource],
    ["백업 지문", importFingerprint],
    ...(fingerprintMatchStatus
      ? [["최근 백업 기준", fingerprintMatchStatus]]
      : []),
    ["JSON 길이", formatJsonLength(rawJson)],
    [
      "복원 상태",
      restoreAlreadyApplied
        ? "복원 완료"
        : canRestore
          ? "복원 실행 가능"
          : "재검증 필요",
    ],
  ];

  return (
    <div className="space-y-4 rounded-md border border-line bg-surface px-4 py-4">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-success">검증 완료</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            백업 식별자와 스키마를 확인했습니다. 복원 전 수량과 핵심 프로필 변화를 함께 확인하세요.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-md border px-3 py-2 text-xs font-semibold ${
            restoreAlreadyApplied
              ? "border-line bg-panel-strong text-muted"
              : "border-success/40 bg-success/10 text-success"
          }`}
        >
          {restoreAlreadyApplied ? "복원 완료" : "복원 대기"}
        </span>
      </div>

      {fingerprintMatchStatus ? (
        <div
          className={`rounded-md border px-3 py-3 text-sm ${
            fingerprintMatchesCurrentExport
              ? "border-success/40 bg-success/10 text-success"
              : "border-danger bg-panel-strong text-danger"
          }`}
        >
          <p className="font-semibold">{fingerprintMatchStatus}</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {fingerprintMatchesCurrentExport
              ? "최근 백업 기준과 같은 지문입니다."
              : "최근 백업 기준과 지문이 다릅니다. 복원 전 파일 출처를 다시 확인하세요."}
          </p>
        </div>
      ) : null}

      <div
        className="grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-import-validation-metrics"
      >
        {items.map(([label, value]) => (
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

      <CountGrid counts={backup.counts} />
    </div>
  );
}

function formatChange(current: string | number, incoming: string | number) {
  if (typeof current === "number" && typeof incoming === "number") {
    const diff = incoming - current;

    if (diff > 0) {
      return `+${diff}`;
    }

    return String(diff);
  }

  return current === incoming ? "동일" : "변경";
}

function getRestoreRiskItems(items: RestoreImpactItem[]): RestoreRiskItem[] {
  return items.flatMap((item) => {
    if (typeof item.current === "number" && typeof item.incoming === "number") {
      if (item.incoming >= item.current) {
        return [];
      }

      return [
        {
          label: item.label,
          description: `현재 ${item.current}개에서 백업 ${item.incoming}개로 줄어듭니다.`,
        },
      ];
    }

    if (
      typeof item.current === "string" &&
      typeof item.incoming === "string" &&
      item.current !== "미설정" &&
      item.current !== item.incoming
    ) {
      return [
        {
          label: item.label,
          description:
            item.incoming === "미설정"
              ? "현재 설정된 값이 백업에서는 미설정입니다."
              : `현재 "${item.current}"에서 "${item.incoming}"으로 바뀝니다.`,
        },
      ];
    }

    return [];
  });
}

function buildRestoreConfirmMessage({
  currentExportFingerprint,
  importFingerprint,
  riskItems,
}: {
  currentExportFingerprint?: string;
  importFingerprint: string;
  riskItems: RestoreRiskItem[];
}) {
  const lines = ["현재 브라우저 데이터를 검증된 백업 내용으로 교체합니다."];

  if (
    currentExportFingerprint !== undefined &&
    currentExportFingerprint !== importFingerprint
  ) {
    lines.push(
      "",
      "최근 백업 기준과 다른 백업입니다.",
      `최근 백업 기준: ${currentExportFingerprint}`,
      `가져온 백업: ${importFingerprint}`,
    );
  }

  if (riskItems.length > 0) {
    const riskLabels = riskItems
      .slice(0, 3)
      .map((item) => item.label)
      .join(", ");
    const suffix = riskItems.length > 3 ? " 외" : "";

    lines.push(
      "",
      `복원 전 확인 필요: ${riskItems.length}개 리스크 (${riskLabels}${suffix})`,
    );
  }

  lines.push("계속할까요?");

  return lines.join("\n");
}

function buildRestoreReportText({
  backup,
  currentBackupFingerprint,
  importFingerprint,
  importSource,
  impactItems,
  riskItems,
}: RestoreReportParams) {
  const changedItems = impactItems.filter(
    (item) => formatChange(item.current, item.incoming) !== "동일",
  );
  const lines = [
    "# Prompt AI Studio 복원 리포트",
    "",
    "## 백업 식별",
    `- 앱: ${backup.app}`,
    `- 스키마: v${backup.schemaVersion}`,
    `- 백업 생성: ${formatBackupDate(backup.exportedAt)}`,
    `- 가져온 방식: ${importSource}`,
    `- 가져온 백업 지문: ${importFingerprint}`,
    `- 최근 백업 기준 지문: ${currentBackupFingerprint || "없음"}`,
    `- 지문 비교: ${
      currentBackupFingerprint
        ? currentBackupFingerprint === importFingerprint
          ? "일치"
          : "다름"
        : "기준 없음"
    }`,
    "",
    "## 수량 요약",
    `- 프롬프트: ${backup.counts.prompts}개`,
    `- 버전: ${backup.counts.promptVersions}개`,
    `- 피드백: ${backup.counts.feedback}개`,
    `- 학습 메모리: ${backup.counts.memories}개`,
    `- 스킬: ${backup.counts.skills}개`,
    `- 스킬 실행: ${backup.counts.skillRuns}개`,
    "",
    "## 복원 영향",
    ...impactItems.map(
      (item) =>
        `- ${item.label}: 현재 ${item.current} / 백업 ${
          item.incoming
        } / 변화 ${formatChange(item.current, item.incoming)}`,
    ),
    "",
    "## 복원 전 리스크",
    ...(riskItems.length > 0
      ? riskItems.map((item) => `- ${item.label}: ${item.description}`)
      : ["- 리스크 없음"]),
    "",
    "## 운영 판단",
    `- 변경 항목: ${changedItems.length}개`,
    `- 리스크 항목: ${riskItems.length}개`,
    "- 복원 전 백업 파일 원본을 별도 보관하세요.",
  ];

  return lines.join("\n");
}

function getMigrationMappingItems(backup: WorkspaceBackup): MigrationMappingItem[] {
  return [
    {
      table: "workspaces",
      source: "백업 단위",
      records: 1,
      status: "needs-context",
      note: "개인/회사 워크스페이스 타입과 소유자 user id 결정 필요",
    },
    {
      table: "workspace_members",
      source: "백업 단위",
      records: 1,
      status: "needs-context",
      note: "초기 owner 멤버를 auth user id와 연결",
    },
    {
      table: "user_profiles",
      source: "data.userProfile",
      records: 1,
      status: "ready",
      note: "역할, 산업, 목표, 출력 선호를 배열 컬럼으로 매핑",
    },
    {
      table: "company_profiles",
      source: "data.companyProfile",
      records: 1,
      status: "ready",
      note: "회사 설명, 제품, 고객군, 브랜드 톤을 workspace 기준으로 매핑",
    },
    {
      table: "prompt_assets",
      source: "data.prompts",
      records: backup.counts.prompts,
      status: "ready",
      note: "원문, 목표, 분야, 대상 AI, 언어 판단, 생성 엔진 보존",
    },
    {
      table: "prompt_versions",
      source: "data.prompts[].versions",
      records: backup.counts.promptVersions,
      status: "ready",
      note: "AI 도구별 프롬프트 본문, 품질 점수, 가정/부족 정보 매핑",
    },
    {
      table: "feedback",
      source: "data.prompts[].feedback",
      records: backup.counts.feedback,
      status: "ready",
      note: "버전별 평점, 코멘트, 피드백 유형 매핑",
    },
    {
      table: "deleted_prompt_assets",
      source: "data.deletedPrompts",
      records: backup.counts.deletedPrompts,
      status: "ready",
      note: "삭제 시각과 원본 프롬프트 전체 snapshot을 보존해 복원/추적 기준 유지",
    },
    {
      table: "learning_memories",
      source: "data.memories",
      records: backup.counts.memories,
      status: "ready",
      note: "scope, source, confidence, tags를 workspace 기준으로 매핑",
    },
    {
      table: "prompt_skills",
      source: "data.skills",
      records: backup.counts.skills,
      status: "ready",
      note: "스킬 템플릿, 대상 AI, 언어 전략, 실행 설정 매핑",
    },
    {
      table: "document_sources / document_chunks",
      source: "추후 문서 업로드",
      records: 0,
      status: "future",
      note: "RAG 문서 업로드 기능 추가 후 별도 마이그레이션",
    },
  ];
}

function getMigrationStatusLabel(status: MigrationMappingItem["status"]) {
  if (status === "ready") {
    return "매핑 가능";
  }

  if (status === "needs-context") {
    return "컨텍스트 필요";
  }

  return "추후";
}

function getChecklistStatusLabel(status: MigrationChecklistItem["status"]) {
  if (status === "ready") {
    return "준비됨";
  }

  if (status === "blocked") {
    return "결정 필요";
  }

  return "수동 확인";
}

function buildMigrationMappingText(items: MigrationMappingItem[]) {
  const readyItems = items.filter((item) => item.status === "ready");
  const contextItems = items.filter((item) => item.status === "needs-context");
  const lines = [
    "# Prompt AI Studio Supabase 마이그레이션 매핑",
    "",
    "## 대상 테이블",
    ...items.map(
      (item) =>
        `- ${item.table}: ${item.records} rows / ${getMigrationStatusLabel(
          item.status,
        )} / ${item.source} / ${item.note}`,
    ),
    "",
    "## 실행 전 결정 필요",
    ...contextItems.map((item) => `- ${item.table}: ${item.note}`),
    "",
    "## 1차 이관 가능 영역",
    ...readyItems.map((item) => `- ${item.table}: ${item.records} rows`),
    "",
    "## 권장 순서",
    "- 1. Supabase auth user와 workspace owner를 확정합니다.",
    "- 2. workspaces와 workspace_members를 먼저 생성합니다.",
    "- 3. user_profiles와 company_profiles를 workspace_id에 연결합니다.",
    "- 4. prompt_assets를 생성한 뒤 prompt_versions와 feedback을 연결합니다.",
    "- 5. deleted_prompt_assets로 삭제 보관함 snapshot을 보존합니다.",
    "- 6. learning_memories와 prompt_skills를 workspace_id 기준으로 이관합니다.",
  ];

  return lines.join("\n");
}

function buildMigrationMappingManualCopyText({
  items,
  mappingText,
}: {
  items: MigrationMappingItem[];
  mappingText: string;
}) {
  const readyItems = items.filter((item) => item.status === "ready");
  const contextItems = items.filter((item) => item.status === "needs-context");
  const futureItems = items.filter((item) => item.status === "future");
  const totalRows = items.reduce((sum, item) => sum + item.records, 0);

  return [
    "# Prompt AI Studio Supabase 마이그레이션 매핑",
    "",
    "## 매핑 식별",
    `- 매핑 테이블: ${items.length}개`,
    `- 1차 이관 가능 테이블: ${readyItems.length}개`,
    `- 컨텍스트 필요 테이블: ${contextItems.length}개`,
    `- 추후 테이블: ${futureItems.length}개`,
    `- 예상 row 수: ${totalRows}개`,
    `- 매핑 길이: ${formatJsonLength(mappingText)}`,
    "",
    "## 실행 전 gate 요약",
    "- Resolve workspace owner and auth user id before creating workspace_members.",
    "- Apply workspaces and workspace_members before workspace-scoped records.",
    "- Preserve deleted_prompt_assets as deleted prompt snapshots during migration.",
    "- Keep document_sources and document_chunks out of the first migration until RAG upload exists.",
    "",
    "## Migration mapping",
    mappingText,
  ].join("\n");
}

function getMigrationChecklistItems({
  backup,
  backupIsCurrent,
  currentBackupFingerprint,
  importFingerprint,
  mappingItems,
  restoreRiskItems,
}: {
  backup: WorkspaceBackup;
  backupIsCurrent: boolean;
  currentBackupFingerprint?: string;
  importFingerprint: string;
  mappingItems: MigrationMappingItem[];
  restoreRiskItems: RestoreRiskItem[];
}): MigrationChecklistItem[] {
  const contextTables = mappingItems.filter(
    (item) => item.status === "needs-context",
  );
  const fingerprintMatches =
    currentBackupFingerprint !== undefined &&
    currentBackupFingerprint === importFingerprint;

  return [
    {
      label: "백업 기준 확정",
      status: backupIsCurrent && fingerprintMatches ? "ready" : "manual",
      detail:
        backupIsCurrent && fingerprintMatches
          ? `최근 백업 기준과 지문이 일치합니다. (${importFingerprint})`
          : "최근 백업 기준, 가져온 파일 출처, 지문 일치 여부를 다시 확인하세요.",
    },
    {
      label: "Supabase 프로젝트 생성",
      status: "blocked",
      detail:
        "프로젝트 URL, anon key, service role key 저장 방식과 배포 환경 변수를 정해야 합니다.",
    },
    {
      label: "초기 사용자와 워크스페이스 owner 결정",
      status: contextTables.length > 0 ? "blocked" : "ready",
      detail:
        contextTables.length > 0
          ? `${contextTables
              .map((item) => item.table)
              .join(", ")} 매핑에 auth user id가 필요합니다.`
          : "워크스페이스 소유자 매핑이 준비되었습니다.",
    },
    {
      label: "스키마 적용",
      status: "manual",
      detail:
        "Supabase SQL editor 또는 migration pipeline에서 docs/database-schema.sql을 적용합니다.",
    },
    {
      label: "RLS 정책 적용",
      status: "blocked",
      detail:
        "workspace_members 기준 read/write 정책과 role별 쓰기 권한을 확정해야 합니다.",
    },
    {
      label: "백업 importer 구현",
      status: backup.schemaVersion === 1 ? "ready" : "blocked",
      detail:
        backup.schemaVersion === 1
          ? "schemaVersion 1 백업을 기준으로 importer를 작성할 수 있습니다."
          : `현재 importer 기준과 다른 백업 스키마입니다. v${backup.schemaVersion}`,
    },
    {
      label: "이관 후 검증 쿼리",
      status: "ready",
      detail: `프롬프트 ${backup.counts.prompts}개, 버전 ${backup.counts.promptVersions}개, 피드백 ${backup.counts.feedback}개, 삭제 보관함 ${backup.counts.deletedPrompts}개 수량을 대조합니다.`,
    },
    {
      label: "롤백 기준",
      status: restoreRiskItems.length > 0 ? "manual" : "ready",
      detail:
        restoreRiskItems.length > 0
          ? `${restoreRiskItems.length}개 복원 리스크가 있어 롤백 기준을 문서화하세요.`
          : "복원 리스크가 없어 기본 백업 파일 보관 기준으로 진행할 수 있습니다.",
    },
  ];
}

function buildMigrationChecklistText(items: MigrationChecklistItem[]) {
  const blockedItems = items.filter((item) => item.status === "blocked");
  const lines = [
    "# Prompt AI Studio Supabase 마이그레이션 실행 체크리스트",
    "",
    "## 체크리스트",
    ...items.map(
      (item) =>
        `- [ ] ${item.label}: ${getChecklistStatusLabel(item.status)} / ${
          item.detail
        }`,
    ),
    "",
    "## 먼저 결정할 항목",
    ...(blockedItems.length > 0
      ? blockedItems.map((item) => `- ${item.label}: ${item.detail}`)
      : ["- 결정 대기 항목 없음"]),
    "",
    "## 권장 실행 순서",
    "- 1. 백업 파일과 지문을 확정합니다.",
    "- 2. Supabase 프로젝트와 환경 변수 보관 방식을 정합니다.",
    "- 3. docs/database-schema.sql을 적용합니다.",
    "- 4. RLS 정책을 적용하고 최소 권한을 검증합니다.",
    "- 5. schemaVersion 1 importer를 실행합니다.",
    "- 6. 수량 검증 쿼리와 샘플 레코드 확인을 완료합니다.",
  ];

  return lines.join("\n");
}

function buildMigrationChecklistManualCopyText({
  checklistText,
  items,
}: {
  checklistText: string;
  items: MigrationChecklistItem[];
}) {
  const readyItems = items.filter((item) => item.status === "ready");
  const blockedItems = items.filter((item) => item.status === "blocked");
  const manualItems = items.filter((item) => item.status === "manual");

  return [
    "# Prompt AI Studio Supabase 마이그레이션 실행 체크리스트",
    "",
    "## 체크리스트 식별",
    `- 체크리스트 항목: ${items.length}개`,
    `- 준비됨: ${readyItems.length}개`,
    `- 결정 필요: ${blockedItems.length}개`,
    `- 수동 확인: ${manualItems.length}개`,
    `- 체크리스트 길이: ${formatJsonLength(checklistText)}`,
    "",
    "## 실행 전 gate 요약",
    "- Confirm backup fingerprint and imported backup source before migration.",
    "- Keep Supabase service role keys server-side only.",
    "- Apply docs/database-schema.sql before running importer code.",
    "- Review RLS policies and run minimum-permission checks before accepting migration.",
    "- Keep rollback criteria and original backup JSON available until verification passes.",
    "",
    "## Migration checklist",
    checklistText,
  ].join("\n");
}

function buildSupabaseImportApiPreflightReportText({
  checkedAt,
  response,
}: {
  checkedAt?: string;
  response: SupabaseImportApiPreflightResponse;
}) {
  return [
    "# Prompt AI Studio Supabase Import API Preflight",
    "",
    `- checkedAt: ${checkedAt || new Date().toISOString()}`,
    `- status: ${response.status}`,
    `- validation: ${response.validation?.ok ? "ok" : "blocked"}`,
    `- dryRunRows: ${response.dryRun?.totalRows ?? response.plan?.totalRows ?? 0}`,
    `- dryRunBatches: ${response.dryRun?.batches ?? 0}`,
    `- insertTables: ${response.insertOrder?.length ?? 0}`,
    `- generatedUuidCount: ${response.plan?.generatedUuidCount ?? 0}`,
    `- archiveTraceFields: ${response.plan?.archiveTraceFields ?? 0}`,
    `- unresolvedPendingReferences: ${
      response.plan?.unresolvedPendingReferences.length ?? 0
    }`,
    `- requiredConfirmation: ${
      response.requiredConfirmation || "not provided"
    }`,
    "",
    "## Validation blockers",
    ...(response.validation?.blockers.length
      ? response.validation.blockers.map((blocker) => `- ${blocker}`)
      : ["- none"]),
    "",
    "## Insert order",
    ...(response.insertOrder?.length
      ? response.insertOrder.map(
          (item) =>
            `- ${item.order}. ${item.table}: ${item.rowCount} rows / dependency: ${item.dependency}`,
        )
      : ["- none"]),
    "",
    "## Execution guard",
    "- This preflight used `execute: false` and did not write to Supabase.",
    "- Real execution still requires server env gates and `confirmation: RUN_SUPABASE_IMPORT`.",
  ].join("\n");
}

function buildSupabaseImportApiPreflightReportManualCopyText({
  backupFingerprint,
  checkedAt,
  ownerUserId,
  preflightText,
  response,
  workspaceId,
}: {
  backupFingerprint: string;
  checkedAt?: string;
  ownerUserId: string;
  preflightText: string;
  response: SupabaseImportApiPreflightResponse;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Import API Preflight",
    "",
    "## Preflight 식별",
    `- 확인 시각: ${formatBackupDate(checkedAt || new Date().toISOString())}`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 리포트 길이: ${formatJsonLength(preflightText)}`,
    "",
    "## Route validation 요약",
    `- Route status: ${response.status}`,
    `- Validation: ${response.validation?.ok ? "ok" : "blocked"}`,
    `- Dry-run rows: ${
      response.dryRun?.totalRows ?? response.plan?.totalRows ?? 0
    }`,
    `- Insert tables: ${response.insertOrder?.length ?? 0}`,
    `- Generated UUIDs: ${response.plan?.generatedUuidCount ?? 0}`,
    `- Unresolved pending references: ${
      response.plan?.unresolvedPendingReferences.length ?? 0
    }`,
    `- Required confirmation: ${
      response.requiredConfirmation || "not provided"
    }`,
    "",
    "## API preflight report",
    preflightText,
  ].join("\n");
}

function buildSupabaseImportApiAuditArtifactManualCopyText({
  artifactText,
  backupFingerprint,
  checkedAt,
  ownerUserId,
  response,
  workspaceId,
}: {
  artifactText: string;
  backupFingerprint: string;
  checkedAt?: string;
  ownerUserId: string;
  response: SupabaseImportApiPreflightResponse;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Import Route Audit Artifact",
    "",
    "## Audit artifact 식별",
    `- 확인 시각: ${formatBackupDate(checkedAt || new Date().toISOString())}`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- Artifact 길이: ${formatJsonLength(artifactText)}`,
    "",
    "## Route audit 요약",
    `- Route status: ${response.status}`,
    `- Execute requested: false (API preflight)`,
    `- Validation: ${response.validation?.ok ? "ok" : "blocked"}`,
    `- Validation blockers: ${response.validation?.blockers.length ?? 0}`,
    `- Dry-run rows: ${
      response.dryRun?.totalRows ?? response.plan?.totalRows ?? 0
    }`,
    `- Insert tables: ${response.insertOrder?.length ?? 0}`,
    `- Required confirmation: ${
      response.requiredConfirmation || "not provided"
    }`,
    "",
    "## Route audit artifact",
    artifactText,
  ].join("\n");
}

function buildSupabaseImporterAdapterContractManualCopyText({
  contractText,
  plan,
}: {
  contractText: string;
  plan: ReturnType<typeof createSupabaseImporterPlan>;
}) {
  return [
    "# Prompt AI Studio Supabase Importer Adapter Contract",
    "",
    "## Adapter 계약 식별",
    `- workspace_id: ${plan.workspaceId}`,
    `- owner_user_id: ${plan.ownerUserId}`,
    `- 계약 길이: ${formatJsonLength(contractText)}`,
    "",
    "## Import plan 요약",
    `- Total rows: ${plan.totalRows}`,
    `- Insert batches: ${plan.batches.length}`,
    `- Generated UUIDs: ${plan.generatedUuidCount}`,
    `- Archive trace fields: ${plan.archiveTraceFields.length}`,
    `- Unresolved pending references: ${plan.unresolvedPendingReferences.length}`,
    "",
    "## Adapter gate 요약",
    "- Adapter must run in a service-role server context.",
    "- Browser/public Supabase clients must not execute importer writes.",
    "- Runner must stop before insert if validation has blockers.",
    "- Runner must insert tables in the listed order.",
    "- Operators must run row count, relationship, pending ID, and RLS owner audits after import.",
    "",
    "## Adapter contract",
    contractText,
  ].join("\n");
}

function buildSupabaseImportExecutionPlanManualCopyText({
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

function buildSupabaseImportDryRunManualCopyText({
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

function buildSupabaseReferenceReplacementGuideManualCopyText({
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

function buildSupabaseImportVerificationSqlManualCopyText({
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

function buildSupabaseRelationshipVerificationSqlManualCopyText({
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

function buildSupabasePendingIdAuditSqlManualCopyText({
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

function buildSupabaseRlsAccessAuditSqlManualCopyText({
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

function buildSupabaseRlsPolicyDraftSqlManualCopyText({
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

function buildSupabaseRlsSmokeTestChecklistManualCopyText({
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

function buildSupabaseVerificationReportManualCopyText({
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

function buildSupabaseMigrationHandoffPackageManualCopyText({
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

function buildSupabaseMigrationRehearsalReportText({
  checkedAt,
  ownerUserId,
  preflight,
  workspaceId,
}: {
  checkedAt?: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Migration Rehearsal",
    "",
    `- checkedAt: ${checkedAt || new Date().toISOString()}`,
    `- workspaceId: ${workspaceId || "not provided"}`,
    `- ownerUserId: ${ownerUserId || "not provided"}`,
    `- preflightStatus: ${preflight.status}`,
    `- validation: ${preflight.validation?.ok ? "ok" : "blocked"}`,
    `- importRows: ${preflight.plan?.totalRows ?? preflight.dryRun?.totalRows ?? 0}`,
    `- insertTables: ${preflight.insertOrder?.length ?? 0}`,
    `- requiredConfirmation: ${preflight.requiredConfirmation || "not provided"}`,
    "",
    "## Rehearsal checklist",
    "- [ ] Confirm backup JSON fingerprint and source owner.",
    "- [ ] Confirm `docs/database-schema.sql` is applied to the target Supabase project.",
    "- [ ] Run `/data` API preflight with `execute: false` and validation status `ok`.",
    "- [ ] Copy and review the import execution plan.",
    "- [ ] Copy and review the importer adapter contract.",
    "- [ ] Keep `SUPABASE_IMPORT_EXECUTION_ENABLED=false` until the controlled write window.",
    "- [ ] During the write window, set the execution gate only in a server-only environment.",
    "- [ ] Execute only with `confirmation: RUN_SUPABASE_IMPORT`.",
    "- [ ] Immediately set `SUPABASE_IMPORT_EXECUTION_ENABLED=false` after the run.",
    "- [ ] Run row count verification SQL.",
    "- [ ] Run relationship verification SQL.",
    "- [ ] Run pending ID audit SQL.",
    "- [ ] Run RLS owner access audit SQL.",
    "- [ ] Apply/review RLS policy draft and complete authenticated RLS smoke test.",
    "- [ ] Attach verification report and handoff package to the migration record.",
    "",
    "## Acceptance gates",
    `- relationship checks: ${supabaseImportVerificationCheckCounts.relationship} / all issue_count 0`,
    `- pending ID checks: ${supabaseImportVerificationCheckCounts.pendingIdAudit} / all issue_count 0`,
    `- RLS owner access checks: ${supabaseImportVerificationCheckCounts.rlsOwnerAccess} / all issue_count 0`,
    `- RLS policy tables: ${supabaseImportVerificationCheckCounts.rlsPolicyTables}`,
    `- handoff sections: ${supabaseImportVerificationCheckCounts.handoffSections}`,
    "",
    "## Insert order",
    ...(preflight.insertOrder?.length
      ? preflight.insertOrder.map(
          (item) =>
            `- ${item.order}. ${item.table}: ${item.rowCount} rows / dependency: ${item.dependency}`,
        )
      : ["- none"]),
    "",
    "## Preflight blockers",
    ...(preflight.validation?.blockers.length
      ? preflight.validation.blockers.map((blocker) => `- ${blocker}`)
      : ["- none"]),
    "",
    "## Required `/data` artifacts",
    "- Import execution plan",
    "- Importer adapter contract",
    "- Row count verification SQL",
    "- Relationship verification SQL",
    "- Pending ID audit SQL",
    "- RLS owner access audit SQL",
    "- RLS policy draft SQL",
    "- RLS smoke test checklist",
    "- Verification report",
    "- Migration handoff package",
  ].join("\n");
}

function buildSupabaseMigrationRehearsalReportManualCopyText({
  backupFingerprint,
  checkedAt,
  ownerUserId,
  preflight,
  rehearsalText,
  workspaceId,
}: {
  backupFingerprint: string;
  checkedAt?: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  rehearsalText: string;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Migration Rehearsal",
    "",
    "## 리허설 식별",
    `- 기준 시각: ${formatBackupDate(checkedAt || new Date().toISOString())}`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 리포트 길이: ${formatJsonLength(rehearsalText)}`,
    "",
    "## 리허설 readiness 요약",
    `- Preflight status: ${preflight.status}`,
    `- Validation: ${preflight.validation?.ok ? "ok" : "blocked"}`,
    `- Validation blockers: ${preflight.validation?.blockers.length ?? 0}`,
    `- Import rows: ${
      preflight.plan?.totalRows ?? preflight.dryRun?.totalRows ?? 0
    }`,
    `- Insert tables: ${preflight.insertOrder?.length ?? 0}`,
    `- Required confirmation: ${
      preflight.requiredConfirmation || "not provided"
    }`,
    `- Handoff sections: ${supabaseImportVerificationCheckCounts.handoffSections}`,
    "",
    "## Migration rehearsal report",
    rehearsalText,
  ].join("\n");
}

function buildSupabasePostImportVerificationEvidenceText({
  backupFingerprint,
  checkedAt,
  ownerUserId,
  preflight,
  workspaceId,
}: {
  backupFingerprint?: string;
  checkedAt?: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Post-import Verification Evidence",
    "",
    `- checkedAt: ${checkedAt || new Date().toISOString()}`,
    `- backupFingerprint: ${backupFingerprint || "not provided"}`,
    `- workspaceId: ${workspaceId || "not provided"}`,
    `- ownerUserId: ${ownerUserId || "not provided"}`,
    `- preflightStatus: ${preflight.status}`,
    `- validation: ${preflight.validation?.ok ? "ok" : "blocked"}`,
    `- importedRowsExpected: ${
      preflight.plan?.totalRows ?? preflight.dryRun?.totalRows ?? 0
    }`,
    `- insertTablesExpected: ${preflight.insertOrder?.length ?? 0}`,
    "",
    "## Required evidence",
    "- [ ] Execution response route audit artifact attached.",
    "- [ ] Row count verification SQL output attached.",
    "- [ ] Relationship verification SQL output attached and all issue_count values are 0.",
    "- [ ] Pending ID audit SQL output attached and all issue_count values are 0.",
    "- [ ] RLS owner access audit SQL output attached and all issue_count values are 0.",
    "- [ ] Authenticated RLS smoke test completed with owner/member/non-member identities.",
    "- [ ] `SUPABASE_IMPORT_EXECUTION_ENABLED=false` confirmed after execution.",
    "- [ ] Rollback decision and operator sign-off recorded.",
    "",
    "## Acceptance gates",
    `- relationship checks: ${supabaseImportVerificationCheckCounts.relationship} / all issue_count 0`,
    `- pending ID checks: ${supabaseImportVerificationCheckCounts.pendingIdAudit} / all issue_count 0`,
    `- RLS owner access checks: ${supabaseImportVerificationCheckCounts.rlsOwnerAccess} / all issue_count 0`,
    `- RLS policy tables: ${supabaseImportVerificationCheckCounts.rlsPolicyTables}`,
    "",
    "## Expected insert order",
    ...(preflight.insertOrder?.length
      ? preflight.insertOrder.map(
          (item) =>
            `- ${item.order}. ${item.table}: ${item.rowCount} rows / dependency: ${item.dependency}`,
        )
      : ["- none"]),
    "",
    "## Evidence slots",
    "",
    "### Execution route audit artifact",
    "Paste the execution response audit artifact here. Do not paste secrets.",
    "",
    "### Row count verification SQL result",
    "Paste table counts and expected counts here.",
    "",
    "### Relationship verification SQL result",
    "Paste relationship issue_count rows here.",
    "",
    "### Pending ID audit SQL result",
    "Paste pending ID issue_count rows here.",
    "",
    "### RLS owner access audit SQL result",
    "Paste owner access issue_count rows here.",
    "",
    "### Authenticated RLS smoke test",
    "- owner result:",
    "- member result:",
    "- non-member result:",
    "",
    "## Rollback triggers",
    "- Any insert response row count does not match the execution plan.",
    "- Any verification SQL returns issue_count greater than 0.",
    "- Any `pending-*` value remains in Supabase rows after import.",
    "- RLS smoke test exposes workspace data to a non-member.",
    "- The execution gate remains enabled after the write window.",
  ].join("\n");
}

function buildSupabasePostImportVerificationEvidenceManualCopyText({
  backupFingerprint,
  checkedAt,
  evidenceText,
  ownerUserId,
  preflight,
  workspaceId,
}: {
  backupFingerprint: string;
  checkedAt?: string;
  evidenceText: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  workspaceId: string;
}) {
  return [
    "# Prompt AI Studio Supabase Post-import 검증 기록지",
    "",
    "## 검증 기록 식별",
    `- 기준 시각: ${formatBackupDate(checkedAt || new Date().toISOString())}`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 기록지 길이: ${formatJsonLength(evidenceText)}`,
    "",
    "## 실행 결과 대조 요약",
    `- Preflight status: ${preflight.status}`,
    `- Validation: ${preflight.validation?.ok ? "ok" : "blocked"}`,
    `- Expected rows: ${
      preflight.plan?.totalRows ?? preflight.dryRun?.totalRows ?? 0
    }`,
    `- Expected insert tables: ${preflight.insertOrder?.length ?? 0}`,
    `- Relationship checks: ${supabaseImportVerificationCheckCounts.relationship}`,
    `- Pending ID checks: ${supabaseImportVerificationCheckCounts.pendingIdAudit}`,
    `- RLS owner access checks: ${supabaseImportVerificationCheckCounts.rlsOwnerAccess}`,
    "",
    "## Post-import verification evidence",
    evidenceText,
  ].join("\n");
}

function buildSupabaseImportExecutionReadinessDecisionText({
  backupFingerprint,
  checkedAt,
  ownerUserId,
  preflight,
  runtimeStatus,
  workspaceId,
}: {
  backupFingerprint?: string;
  checkedAt?: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  runtimeStatus: EnvironmentRuntimeStatus;
  workspaceId: string;
}) {
  const validationOk = preflight.validation?.ok === true;
  const runtimeBlockers = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status === "block",
  );
  const runtimeWarnings = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status === "warn",
  );
  const executionGateEnabled =
    runtimeStatus.supabase.importExecutionEnabled === true;
  const migrationReady = runtimeStatus.supabase.readyForMigration === true;
  const serverImporterReady =
    runtimeStatus.supabase.serverImporterConfigured === true;
  const decision =
    validationOk &&
    migrationReady &&
    serverImporterReady &&
    runtimeBlockers.length === 0
      ? executionGateEnabled
        ? "GO - controlled write window is armed"
        : "READY TO ARM - enable execution gate only for the write window"
      : "BLOCKED - do not execute";
  const blockingReasons = [
    ...(!validationOk
      ? ["API preflight validation is not ok for this backup/workspace/owner."]
      : []),
    ...(!migrationReady
      ? ["Supabase migration env is not fully ready."]
      : []),
    ...(!serverImporterReady
      ? ["Server importer service-role environment is not configured."]
      : []),
    ...runtimeBlockers.map((check) => `${check.label}: ${check.detail}`),
  ];

  return [
    "# Prompt AI Studio Supabase Import Execution Readiness Decision",
    "",
    `- checkedAt: ${checkedAt || new Date().toISOString()}`,
    `- backupFingerprint: ${backupFingerprint || "not provided"}`,
    `- workspaceId: ${workspaceId || "not provided"}`,
    `- ownerUserId: ${ownerUserId || "not provided"}`,
    `- decision: ${decision}`,
    `- preflightValidation: ${validationOk ? "ok" : "blocked"}`,
    `- runtimeStage: ${formatReleaseGateStage(runtimeStatus.releaseGate.stage)}`,
    `- runtimeScore: ${runtimeStatus.releaseGate.score}/100`,
    `- importExecutionGate: ${executionGateEnabled ? "enabled" : "disabled"}`,
    "",
    "## Required operator sequence",
    "- [ ] Confirm this memo uses the same backup fingerprint, workspace_id, and owner_user_id as the execution request.",
    "- [ ] Confirm API preflight validation is `ok`.",
    "- [ ] Confirm server importer env exists only in a trusted server-side context.",
    "- [ ] Enable `SUPABASE_IMPORT_EXECUTION_ENABLED=true` only during the controlled write window.",
    "- [ ] Execute with `confirmation: RUN_SUPABASE_IMPORT`.",
    "- [ ] Immediately set `SUPABASE_IMPORT_EXECUTION_ENABLED=false` after execution.",
    "- [ ] Copy execution route audit artifact.",
    "- [ ] Complete post-import verification evidence record.",
    "",
    "## Blocking reasons",
    ...(blockingReasons.length
      ? blockingReasons.map((reason) => `- ${reason}`)
      : ["- none"]),
    "",
    "## Runtime warnings to review",
    ...(runtimeWarnings.length
      ? runtimeWarnings.map(
          (warning) =>
            `- ${warning.label}: ${warning.detail} / next: ${warning.nextAction}`,
        )
      : ["- none"]),
    "",
    "## Preflight blockers",
    ...(preflight.validation?.blockers.length
      ? preflight.validation.blockers.map((blocker) => `- ${blocker}`)
      : ["- none"]),
    "",
    "## Insert order",
    ...(preflight.insertOrder?.length
      ? preflight.insertOrder.map(
          (item) =>
            `- ${item.order}. ${item.table}: ${item.rowCount} rows / dependency: ${item.dependency}`,
        )
      : ["- none"]),
  ].join("\n");
}

function buildSupabaseImportExecutionReadinessDecisionManualCopyText({
  backupFingerprint,
  checkedAt,
  decisionText,
  ownerUserId,
  preflight,
  runtimeStatus,
  workspaceId,
}: {
  backupFingerprint: string;
  checkedAt: string;
  decisionText: string;
  ownerUserId: string;
  preflight: SupabaseImportApiPreflightResponse;
  runtimeStatus: EnvironmentRuntimeStatus;
  workspaceId: string;
}) {
  const validationOk = preflight.validation?.ok === true;
  const runtimeBlockers = runtimeStatus.releaseGate.checks.filter(
    (check) => check.status === "block",
  );
  const executionGateEnabled =
    runtimeStatus.supabase.importExecutionEnabled === true;
  const migrationReady = runtimeStatus.supabase.readyForMigration === true;
  const serverImporterReady =
    runtimeStatus.supabase.serverImporterConfigured === true;
  const decision =
    validationOk &&
    migrationReady &&
    serverImporterReady &&
    runtimeBlockers.length === 0
      ? executionGateEnabled
        ? "GO - controlled write window is armed"
        : "READY TO ARM - enable execution gate only for the write window"
      : "BLOCKED - do not execute";

  return [
    "# Prompt AI Studio Supabase Import 실행 판정 메모",
    "",
    "## 판정 식별",
    `- 생성 시각: ${formatBackupDate(checkedAt)}`,
    `- 백업 지문: ${backupFingerprint}`,
    `- workspace_id: ${workspaceId}`,
    `- owner_user_id: ${ownerUserId}`,
    `- 메모 길이: ${formatJsonLength(decisionText)}`,
    "",
    "## 실행 판정 요약",
    `- Decision: ${decision}`,
    `- Preflight validation: ${validationOk ? "ok" : "blocked"}`,
    `- Runtime release gate: ${formatReleaseGateStage(
      runtimeStatus.releaseGate.stage,
    )} (${runtimeStatus.releaseGate.score}/100)`,
    `- Runtime blockers: ${runtimeBlockers.length}개`,
    `- Supabase migration ready: ${migrationReady ? "yes" : "no"}`,
    `- Server importer ready: ${serverImporterReady ? "yes" : "no"}`,
    `- Import execution gate: ${
      executionGateEnabled ? "enabled" : "disabled"
    }`,
    "",
    "## Execution readiness decision",
    decisionText,
  ].join("\n");
}

function buildSupabaseImportExecutionPacketText({
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

function buildSupabaseImportExecutionPacketManualCopyText({
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

function buildSupabaseImportExecutionPacketManifestManualCopyText({
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

function buildSupabaseImportExecutionPacketNextActionManualCopyText({
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

function getExecutionPacketManifestStatusClass(
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

function getSupabaseImportExecutionPacketRuntimeState(
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

function buildSupabaseImportExecutionRequestTemplateText({
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

function buildSupabaseImportExecutionRequestTemplateManualCopyText({
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
    "- context: trusted server-side/operator execution window only",
    "",
    "## Execute request template",
    templateText,
  ].join("\n");
}

function buildSupabaseImportExecutionGuardChecklistText({
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

function buildSupabaseImportExecutionGuardChecklistManualCopyText({
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

function RestoreRiskSummary({ items }: { items: RestoreRiskItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-md border border-danger bg-surface px-4 py-4">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-danger">복원 전 확인 필요</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            복원하면 현재 데이터 일부가 줄거나 핵심 프로필 값이 바뀝니다.
          </p>
        </div>
        <span className="shrink-0 rounded-md border border-danger bg-panel-strong px-3 py-2 text-xs font-semibold text-danger">
          {items.length}개 리스크
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-line bg-panel-strong px-3 py-3"
          >
            <p className="text-xs font-semibold text-soft">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocumentRagReadinessSummary({
  chunks,
  onClearDraft,
  onCopyIngestionPacket,
  onCopyReadiness,
  onDocumentFileChange,
  onDocumentNameChange,
  onDocumentTextChange,
  onOpenInStudio,
  sourceName,
  text,
}: DocumentRagReadinessSummaryProps) {
  const readyCount = documentRagReadinessItems.filter(
    (item) => item.status === "ready",
  ).length;
  const plannedCount = documentRagReadinessItems.length - readyCount;
  const normalizedText = normalizeDocumentRagText(text);
  const previewChunks = chunks.slice(0, documentRagMaxPreviewChunks);
  const studioDraftStatus =
    chunks.length > 0 ? "Studio 전송 가능" : "문서 원문 필요";
  const studioDraftSummaryItems = [
    {
      label: "프롬프트 언어",
      value: "자동 판단",
      detail: "전체 영어 또는 한영 하이브리드",
    },
    {
      label: "답변 언어",
      value: "입력 언어와 동일",
      detail: "Studio에서 필요 시 변경 가능",
    },
    {
      label: "전달 chunk",
      value:
        chunks.length > 0
          ? `${Math.min(chunks.length, documentRagMaxPreviewChunks)}/${chunks.length}개`
          : "0개",
      detail: "추가 chunk는 수집 패킷에서 확인",
    },
    {
      label: "인용 기준",
      value: "source ID + chunk index",
      detail: "문서 밖 내용은 가정으로 분리",
    },
  ];

  return (
    <div
      id="data-document-rag"
      className="scroll-mt-28 space-y-4 rounded-md border border-line bg-panel-strong px-4 py-4"
    >
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">문서/RAG 준비도</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            문서 업로드와 pgvector 검색을 바로 붙이기 전에 스키마, 수집,
            임베딩, 검색 인용 gate를 분리해 확인합니다.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onCopyReadiness}
        >
          RAG 준비도 복사
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-2 xl:grid-cols-4"
        data-testid="data-document-rag-summary-metrics"
      >
        <div className="min-w-0 rounded-md border border-line bg-surface px-3 py-3">
          <p className="text-xs text-muted">준비된 항목</p>
          <p className="mt-1 break-words font-mono text-sm text-soft">
            {readyCount}/{documentRagReadinessItems.length}
          </p>
        </div>
        <div className="min-w-0 rounded-md border border-line bg-surface px-3 py-3">
          <p className="text-xs text-muted">설계 필요</p>
          <p className="mt-1 break-words font-mono text-sm text-soft">
            {plannedCount}개
          </p>
        </div>
        <div className="min-w-0 rounded-md border border-line bg-surface px-3 py-3">
          <p className="text-xs text-muted">저장 단위</p>
          <p className="mt-1 break-words font-mono text-sm text-soft">
            document_sources
          </p>
        </div>
        <div className="min-w-0 rounded-md border border-line bg-surface px-3 py-3">
          <p className="text-xs text-muted">검색 단위</p>
          <p className="mt-1 break-words font-mono text-sm text-soft">
            document_chunks.embedding
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {documentRagReadinessItems.map((item) => (
          <div
            className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
            key={item.artifact}
          >
            <p className="text-xs font-semibold text-soft">{item.artifact}</p>
            <p className="mt-1 text-xs text-accent">
              {getDocumentRagStatusLabel(item.status)}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted">{item.detail}</p>
            <p className="mt-2 break-words font-mono text-[11px] leading-5 text-muted">
              {item.evidence}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted">
              {item.nextAction}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3 rounded-md border border-line bg-surface px-3 py-3">
          <div>
            <p className="text-xs font-semibold text-soft">문서 입력</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              지금은 저장하지 않고 chunk 기준만 확인합니다.
            </p>
          </div>

          <Field label="문서 이름">
            <input
              className={inputClass}
              value={sourceName}
              onChange={(event) => onDocumentNameChange(event.target.value)}
              placeholder="company-guide.md"
            />
          </Field>

          <Field label="텍스트 파일">
            <input
              type="file"
              accept=".txt,.md,.json,text/plain,text/markdown,application/json"
              className="block w-full rounded-md border border-dashed border-line bg-panel-strong px-3 py-3 text-sm text-muted file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-background hover:border-accent"
              onChange={onDocumentFileChange}
            />
          </Field>

          <Field label="문서 원문">
            <textarea
              className={`${textareaClass} min-h-56 font-mono text-xs`}
              value={text}
              onChange={(event) => onDocumentTextChange(event.target.value)}
              placeholder="업로드할 문서 본문을 붙여넣으면 chunk preview가 생성됩니다."
            />
          </Field>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className={primaryButtonClass}
              disabled={chunks.length === 0}
              onClick={onOpenInStudio}
            >
              Studio로 보내기
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={chunks.length === 0}
              onClick={onCopyIngestionPacket}
            >
              수집 패킷 복사
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={!sourceName && !text}
              onClick={onClearDraft}
            >
              입력 지우기
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-line bg-surface px-3 py-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-line bg-panel-strong px-3 py-3">
              <p className="text-xs text-muted">원문 길이</p>
              <p className="mt-1 font-mono text-sm text-soft">
                {normalizedText.length.toLocaleString("ko-KR")}자
              </p>
            </div>
            <div className="rounded-md border border-line bg-panel-strong px-3 py-3">
              <p className="text-xs text-muted">chunk 크기</p>
              <p className="mt-1 font-mono text-sm text-soft">
                {documentRagChunkSize.toLocaleString("ko-KR")}자
              </p>
            </div>
            <div className="rounded-md border border-line bg-panel-strong px-3 py-3">
              <p className="text-xs text-muted">chunk 수</p>
              <p className="mt-1 font-mono text-sm text-soft">
                {chunks.length.toLocaleString("ko-KR")}개
              </p>
            </div>
          </div>

          <div className="rounded-md border border-accent/30 bg-panel-strong px-3 py-3">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-soft">
                  Studio 전송 준비
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  문서 맥락을 외부 AI용 전문 프롬프트 초안으로 넘기기 전
                  적용할 기준입니다.
                </p>
              </div>
              <span className="shrink-0 rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-[11px] font-semibold text-accent">
                {studioDraftStatus}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {studioDraftSummaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-line bg-surface px-3 py-3"
                >
                  <p className="text-xs text-muted">{item.label}</p>
                  <p className="mt-1 text-xs font-semibold text-soft">
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {previewChunks.length > 0 ? (
            <div className="space-y-2">
              {previewChunks.map((chunk) => (
                <div
                  className="rounded-md border border-line bg-panel-strong px-3 py-3"
                  key={chunk.index}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs text-accent">
                      chunk {chunk.index}
                    </p>
                    <p className="font-mono text-[11px] text-muted">
                      {chunk.start}-{chunk.end}
                    </p>
                  </div>
                  <p className="mt-2 max-h-20 overflow-auto whitespace-pre-wrap text-xs leading-5 text-muted">
                    {chunk.content}
                  </p>
                </div>
              ))}
              {chunks.length > previewChunks.length ? (
                <p className="text-xs text-muted">
                  나머지 {chunks.length - previewChunks.length}개 chunk는 수집
                  패킷에 요약됩니다.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-line bg-panel-strong px-3 py-10 text-center text-sm text-muted">
              문서 원문을 입력하면 chunk preview가 표시됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RestoreReportSummary({
  backup,
  currentBackupFingerprint,
  importFingerprint,
  importSource,
  impactItems,
  onCopy,
  riskItems,
}: RestoreReportSummaryProps) {
  const changedItems = impactItems.filter(
    (item) => formatChange(item.current, item.incoming) !== "동일",
  );
  const fingerprintStatus =
    currentBackupFingerprint === undefined
      ? "기준 없음"
      : currentBackupFingerprint === importFingerprint
        ? "일치"
        : "다름";
  const items = [
    ["백업 생성", formatBackupDate(backup.exportedAt)],
    ["가져온 방식", importSource],
    ["지문 비교", fingerprintStatus],
    ["변경 항목", `${changedItems.length}개`],
    ["리스크", riskItems.length > 0 ? `${riskItems.length}개` : "없음"],
  ];

  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">복원 리포트</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            검증된 백업의 식별자, 영향, 리스크를 운영 기록용 텍스트로 복사합니다.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onCopy}
        >
          리포트 복사
        </button>
      </div>
      <div
        className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-5"
        data-testid="data-restore-report-metrics"
      >
        {items.map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
          >
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 break-words font-mono text-xs text-soft">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MigrationChecklistSummary({
  items,
  onCopy,
}: MigrationChecklistSummaryProps) {
  const readyCount = items.filter((item) => item.status === "ready").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const manualCount = items.filter((item) => item.status === "manual").length;

  return (
    <div className="space-y-4 rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">
            마이그레이션 실행 체크리스트
          </p>
          <p className="mt-1 text-sm leading-5 text-muted">
            Supabase 연결 전에 결정해야 할 항목과 바로 진행 가능한 항목을
            분리합니다.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onCopy}
        >
          체크리스트 복사
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        data-testid="data-migration-checklist-metrics"
      >
        {[
          ["준비됨", `${readyCount}개`],
          ["결정 필요", `${blockedCount}개`],
          ["수동 확인", `${manualCount}개`],
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

      <div className="grid gap-2 lg:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-line bg-surface px-3 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold text-soft">{item.label}</p>
              <span className="rounded-md border border-line bg-panel-strong px-2 py-1 text-[11px] font-semibold text-muted">
                {getChecklistStatusLabel(item.status)}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MigrationMappingSummary({
  items,
  onCopy,
}: MigrationMappingSummaryProps) {
  const readyCount = items.filter((item) => item.status === "ready").length;
  const contextCount = items.filter(
    (item) => item.status === "needs-context",
  ).length;
  const totalRows = items.reduce((sum, item) => sum + item.records, 0);

  return (
    <div className="space-y-4 rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">Supabase 매핑 미리보기</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            검증된 백업을 `docs/database-schema.sql`의 테이블 기준으로 나누면
            아래 순서로 이관할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onCopy}
        >
          매핑 복사
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        data-testid="data-migration-mapping-metrics"
      >
        {[
          ["매핑 가능", `${readyCount}개 테이블`],
          ["결정 필요", `${contextCount}개 테이블`],
          ["예상 rows", `${totalRows.toLocaleString("ko-KR")}개`],
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 font-medium">테이블</th>
              <th className="px-3 py-2 font-medium">소스</th>
              <th className="px-3 py-2 font-medium">Rows</th>
              <th className="px-3 py-2 font-medium">상태</th>
              <th className="py-2 pl-3 font-medium">메모</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.table}
                className="border-b border-line last:border-b-0"
              >
                <td className="py-2 pr-3 font-mono text-xs text-soft">
                  {item.table}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted">
                  {item.source}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-soft">
                  {item.records}
                </td>
                <td className="px-3 py-2 text-xs text-muted">
                  {getMigrationStatusLabel(item.status)}
                </td>
                <td className="py-2 pl-3 text-xs leading-5 text-muted">
                  {item.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupabaseImportDryRunSummary({
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

function SupabaseReferenceReplacementGuideSummary({
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

function SupabaseImportExecutionPlanSummary({
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

function SupabaseVerificationSqlSummary({
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

function SupabaseRelationshipVerificationSqlSummary({
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

function SupabasePendingIdAuditSqlSummary({
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

function SupabaseRlsAccessAuditSqlSummary({
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

function SupabaseRlsPolicyDraftSummary({
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

function SupabaseRlsSmokeTestSummary({
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

function SupabaseVerificationReportSummary({
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

function SupabaseMigrationHandoffPackageSummary({
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

function formatEnvironmentStatus(status: EnvironmentReadinessStatus) {
  if (status === "active") {
    return "현재";
  }

  if (status === "migration") {
    return "전환";
  }

  return "후속";
}

function getEnvironmentStatusClass(status: EnvironmentReadinessStatus) {
  if (status === "active") {
    return "border-success/40 bg-success/10 text-success";
  }

  if (status === "migration") {
    return "border-accent/40 bg-accent/10 text-accent";
  }

  return "border-line bg-panel-strong text-muted";
}

function formatConfigured(value: boolean | undefined) {
  if (value === undefined) {
    return "미확인";
  }

  return value ? "설정됨" : "미설정";
}

function getConfiguredClass(value: boolean | undefined) {
  if (value === undefined) {
    return "border-line bg-panel-strong text-muted";
  }

  return value
    ? "border-success/40 bg-success/10 text-success"
    : "border-danger/40 bg-danger/10 text-danger";
}

function formatReleaseGateStage(stage: EnvironmentReleaseGateStage) {
  if (stage === "migration-ready") {
    return "Supabase 전환 가능";
  }

  if (stage === "local-ready") {
    return "로컬 운영 가능";
  }

  return "전환 차단";
}

function getReleaseGateStageClass(stage: EnvironmentReleaseGateStage) {
  if (stage === "migration-ready") {
    return "border-success/40 bg-success/10 text-success";
  }

  if (stage === "local-ready") {
    return "border-accent/40 bg-accent/10 text-accent";
  }

  return "border-danger/40 bg-danger/10 text-danger";
}

function getGateCheckClass(status: "block" | "pass" | "warn") {
  if (status === "pass") {
    return "border-success/40 bg-success/10 text-success";
  }

  if (status === "warn") {
    return "border-accent/40 bg-accent/10 text-accent";
  }

  return "border-danger/40 bg-danger/10 text-danger";
}

function EnvironmentReadinessSummary({
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

function BackupUpdateSummary({
  changes,
  onGenerateBackup,
}: {
  changes: WorkspaceBackupCountChange[];
  onGenerateBackup: () => void;
}) {
  return (
    <div className="rounded-md border border-line bg-panel-strong px-4 py-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">백업 업데이트 필요</p>
          <p className="mt-1 text-sm leading-5 text-muted">
            마지막 백업 이후 현재 워크스페이스 수량이 달라졌습니다.
          </p>
        </div>
        <span className="shrink-0 rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted">
          {changes.length}개 항목 변경
        </span>
      </div>
      <div className="mt-4">
        <button
          type="button"
          className={primaryButtonClass}
          onClick={onGenerateBackup}
        >
          백업 갱신
        </button>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {changes.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-line bg-surface px-3 py-3"
          >
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-1 font-mono text-sm text-soft">
              백업 {item.backup} → 현재 {item.current}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getReadinessStage(score: number) {
  if (score >= 80) {
    return "마이그레이션 후보";
  }

  if (score >= 50) {
    return "로컬 운영 중";
  }

  return "기초 설정 필요";
}

function ReadinessChecklist({ items }: { items: ReadinessItem[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-col gap-3 rounded-md border border-line bg-surface px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-soft">{item.label}</p>
              <span
                className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                  item.ready
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-line bg-panel-strong text-muted"
                }`}
              >
                {item.ready ? "완료" : "필요"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-5 text-muted">{item.description}</p>
          </div>
          {item.href ? (
            <Link
              href={item.href}
              className="shrink-0 rounded-md border border-line bg-panel-strong px-3 py-2 text-center text-xs font-semibold text-foreground transition hover:border-accent"
            >
              {item.actionLabel}
            </Link>
          ) : item.onAction ? (
            <button
              type="button"
              className="shrink-0 rounded-md border border-line bg-panel-strong px-3 py-2 text-center text-xs font-semibold text-foreground transition hover:border-accent"
              onClick={item.onAction}
            >
              {item.actionLabel}
            </button>
          ) : (
            <span className="shrink-0 rounded-md border border-line bg-panel-strong px-3 py-2 text-center text-xs font-semibold text-muted">
              {item.actionLabel}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function RestoreImpactPreview({ items }: { items: RestoreImpactItem[] }) {
  return (
    <div className="space-y-3 rounded-md border border-line bg-panel-strong px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-soft">복원 영향 미리보기</p>
        <p className="mt-1 text-sm leading-5 text-muted">
          복원을 실행하면 현재 브라우저 데이터가 아래 백업 기준으로 교체됩니다.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 font-medium">항목</th>
              <th className="px-3 py-2 font-medium">현재</th>
              <th className="px-3 py-2 font-medium">백업</th>
              <th className="py-2 pl-3 font-medium">변화</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.label} className="border-b border-line last:border-b-0">
                <td className="py-2 pr-3 text-soft">{item.label}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted">
                  {item.current}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted">
                  {item.incoming}
                </td>
                <td className="py-2 pl-3 font-mono text-xs text-foreground">
                  {formatChange(item.current, item.incoming)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getManualCopyTitle(successNotice: string) {
  return successNotice
    .replace(/(을|를) 클립보드에 복사했습니다\.$/, "")
    .replace(/(을|를) 복사했습니다\.$/, "")
    .replace(/복사했습니다\.$/, "")
    .trim();
}

function DataManualCopyPanel({
  copy,
  onClose,
}: {
  copy: DataManualCopy;
  onClose: () => void;
}) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-soft">수동 복사 필요</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {copy.title} 복사가 차단됐습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-accent transition hover:text-soft"
        >
          닫기
        </button>
      </div>
      <textarea
        readOnly
        value={copy.body}
        className={`${textareaClass} mt-3 h-52 font-mono text-xs leading-5`}
        aria-label={`수동 복사용 ${copy.title}`}
      />
    </div>
  );
}

export function DataManagementView() {
  const router = useRouter();
  const [userProfile] = useUserProfileStore();
  const [companyProfile] = useCompanyProfileStore();
  const [prompts] = usePromptAssetsStore();
  const [deletedPrompts] = useDeletedPromptAssetsStore();
  const [memories] = useLearningMemoriesStore();
  const [skills] = usePromptSkillsStore();
  const [backupMeta, setBackupMeta] = useWorkspaceBackupMetaStore();
  const [runtimeSnapshots, setRuntimeSnapshots] =
    useRuntimeReadinessSnapshotsStore();
  const [exportJson, setExportJson] = useState("");
  const [importJson, setImportJson] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [validatedJson, setValidatedJson] = useState("");
  const [lastRestoredJson, setLastRestoredJson] = useState("");
  const [verificationWorkspaceId, setVerificationWorkspaceId] = useState("");
  const [verificationOwnerUserId, setVerificationOwnerUserId] = useState("");
  const [documentRagSourceName, setDocumentRagSourceName] = useState("");
  const [documentRagText, setDocumentRagText] = useState("");
  const [runtimeReadiness, setRuntimeReadiness] =
    useState<RuntimeReadinessState>({ status: "loading" });
  const [parseResult, setParseResult] =
    useState<WorkspaceBackupParseResult | null>(null);
  const [notice, setNotice] = useState("");
  const [manualCopy, setManualCopy] = useState<DataManualCopy | null>(null);
  const [supabaseImportApiPreflight, setSupabaseImportApiPreflight] =
    useState<SupabaseImportApiPreflightState>({ status: "idle" });

  const workspaceData = useMemo<WorkspaceBackupData>(
    () => ({
      userProfile,
      companyProfile,
      prompts,
      memories,
      skills,
      deletedPrompts,
    }),
    [companyProfile, deletedPrompts, memories, prompts, skills, userProfile],
  );
  const currentCounts = useMemo(
    () => summarizeWorkspaceBackupData(workspaceData),
    [workspaceData],
  );
  const backupIsCurrent = useMemo(
    () => isWorkspaceBackupMetaCurrent(backupMeta, currentCounts),
    [backupMeta, currentCounts],
  );
  const backupCountChanges = useMemo(
    () =>
      backupMeta.exportedAt
        ? getWorkspaceBackupCountChanges(currentCounts, backupMeta.counts)
        : [],
    [backupMeta, currentCounts],
  );
  const documentRagChunks = useMemo(
    () => createDocumentRagChunks(documentRagText),
    [documentRagText],
  );
  const handleGenerateBackup = useCallback(() => {
    const backup = createWorkspaceBackup(workspaceData);

    setExportJson(serializeWorkspaceBackup(backup));
    setBackupMeta(createWorkspaceBackupMeta(backup));
    setManualCopy(null);
    setNotice(`백업 JSON을 생성했습니다. 기준 시각: ${formatBackupDate(backup.exportedAt)}`);
  }, [setBackupMeta, workspaceData]);
  const readinessItems = useMemo<ReadinessItem[]>(
    () => [
      {
        label: "개인 맥락",
        description: "역할, 산업, 목표, 선호 출력 형식이 생성 기본값으로 저장되어야 합니다.",
        ready:
          Boolean(userProfile.role.trim()) &&
          userProfile.industries.length > 0 &&
          userProfile.goals.length > 0 &&
          userProfile.preferredOutputs.length > 0,
        actionLabel: "개인 설정",
        href: "/profile",
      },
      {
        label: "회사 기준",
        description: "회사명, 설명, 제품, 고객군, 브랜드 톤이 회사 특색을 만드는 기준입니다.",
        ready:
          Boolean(companyProfile.companyName.trim()) &&
          Boolean(companyProfile.description.trim()) &&
          companyProfile.products.length > 0 &&
          companyProfile.customers.length > 0 &&
          Boolean(companyProfile.brandTone.trim()),
        actionLabel: "회사 설정",
        href: "/company",
      },
      {
        label: "생성 데이터",
        description: "저장된 프롬프트와 버전이 있어야 품질 비교와 모델별 분석이 가능합니다.",
        ready: currentCounts.prompts > 0 && currentCounts.promptVersions > 0,
        actionLabel: "Studio 이동",
        href: "/studio",
      },
      {
        label: "피드백 학습",
        description: "피드백 또는 학습 메모리가 있어야 개인화 규칙을 다음 생성에 반영할 수 있습니다.",
        ready: currentCounts.feedback > 0 || currentCounts.memories > 0,
        actionLabel: "학습 확인",
        href: "/learning",
      },
      {
        label: "반복 스킬",
        description: "반복 업무를 스킬로 저장하면 팀/회사 워크스페이스 전환 시 재사용 단위가 됩니다.",
        ready: currentCounts.skills > 0,
        actionLabel: "스킬 관리",
        href: "/skills",
      },
      {
        label: "백업 스냅샷",
        description: "복원 가능한 JSON 백업이 있어야 Supabase 전환 전 데이터를 안전하게 이관할 수 있습니다.",
        ready: backupIsCurrent,
        actionLabel: !backupMeta.exportedAt
          ? "백업 생성"
          : backupIsCurrent
            ? "최신"
            : "백업 갱신",
        onAction: backupIsCurrent ? undefined : handleGenerateBackup,
      },
    ],
    [
      backupIsCurrent,
      backupMeta,
      companyProfile,
      currentCounts,
      handleGenerateBackup,
      userProfile,
    ],
  );
  const readinessScore = Math.round(
    (readinessItems.filter((item) => item.ready).length / readinessItems.length) *
      100,
  );
  const readinessStage = getReadinessStage(readinessScore);
  const readinessDoneCount = readinessItems.filter((item) => item.ready).length;
  const documentRagReadyCount = documentRagReadinessItems.filter(
    (item) => item.status === "ready",
  ).length;
  const dataOperationFlowItems: ContextOperatingFlowItem[] = [
    {
      actionLabel: backupIsCurrent ? "최신" : "백업 생성",
      detail: backupMeta.exportedAt
        ? `${formatBackupDate(backupMeta.exportedAt)} · ${
            backupIsCurrent ? "최신" : `변경 ${backupCountChanges.length}개`
          }`
        : "아직 백업 없음",
      disabled: backupIsCurrent,
      label: "백업",
      onAction: backupIsCurrent ? undefined : handleGenerateBackup,
      step: "01",
      title: backupIsCurrent ? "백업 상태 확인" : "현재 데이터 백업",
    },
    {
      actionLabel: "준비도 보기",
      detail: `${readinessDoneCount}/${readinessItems.length} 준비 · ${readinessScore}%`,
      href: "#data-readiness",
      label: "준비도",
      step: "02",
      title: readinessStage,
    },
    {
      actionLabel: "RAG 확인",
      detail: `${documentRagReadyCount}/${documentRagReadinessItems.length} 준비 · chunk ${documentRagChunks.length}개`,
      href: "#data-document-rag",
      label: "문서/RAG",
      step: "03",
      title: "문서 수집 기준 확인",
    },
    {
      actionLabel: "전환 검토",
      detail: runtimeReadiness.data
        ? `${formatReleaseGateStage(runtimeReadiness.data.releaseGate.stage)} · ${runtimeReadiness.data.releaseGate.score}/100`
        : runtimeReadiness.status === "loading"
          ? "runtime 확인 중"
          : "runtime 재확인 필요",
      href: "#data-supabase-migration",
      label: "Supabase",
      step: "04",
      title: "전환 gate 확인",
    },
  ];
  const dataSafetyWorkflowSteps = [
    {
      detail: backupIsCurrent
        ? "현재 로컬 데이터와 최근 백업 수량이 일치합니다."
        : backupMeta.exportedAt
          ? `변경 ${backupCountChanges.length}개를 반영해 백업을 갱신합니다.`
          : "복원과 전환 전에 먼저 백업 JSON을 생성합니다.",
      label: "백업 고정",
      step: "01",
      title: backupIsCurrent ? "백업 최신" : "백업 필요",
    },
    {
      detail: `${readinessDoneCount}/${readinessItems.length} 준비 · ${readinessScore}% · ${runtimeReadiness.data ? formatReleaseGateStage(runtimeReadiness.data.releaseGate.stage) : "runtime 확인 필요"}`,
      label: "준비도 확인",
      step: "02",
      title: readinessStage,
    },
    {
      detail:
        supabaseImportApiPreflight.status === "ready"
          ? "preflight 결과를 기준으로 execution packet을 복사합니다."
          : "execute=false preflight를 먼저 실행하고 수동 gate를 확인합니다.",
      label: "실행 분리",
      step: "03",
      title:
        supabaseImportApiPreflight.status === "ready"
          ? "패킷 복사 가능"
          : "preflight 필요",
    },
  ];
  const restoreImpactItems = useMemo<RestoreImpactItem[]>(() => {
    if (parseResult?.ok !== true) {
      return [];
    }

    const incomingCounts = parseResult.backup.counts;
    const incomingData = parseResult.backup.data;

    return [
      {
        label: "사용자 프로필",
        current: userProfile.role || "미설정",
        incoming: incomingData.userProfile.role || "미설정",
      },
      {
        label: "회사 프로필",
        current: companyProfile.companyName || "미설정",
        incoming: incomingData.companyProfile.companyName || "미설정",
      },
      {
        label: "프롬프트",
        current: currentCounts.prompts,
        incoming: incomingCounts.prompts,
      },
      {
        label: "버전",
        current: currentCounts.promptVersions,
        incoming: incomingCounts.promptVersions,
      },
      {
        label: "피드백",
        current: currentCounts.feedback,
        incoming: incomingCounts.feedback,
      },
      {
        label: "학습 메모리",
        current: currentCounts.memories,
        incoming: incomingCounts.memories,
      },
      {
        label: "스킬",
        current: currentCounts.skills,
        incoming: incomingCounts.skills,
      },
      {
        label: "스킬 실행",
        current: currentCounts.skillRuns,
        incoming: incomingCounts.skillRuns,
      },
    ];
  }, [companyProfile, currentCounts, parseResult, userProfile]);
  const restoreRiskItems = useMemo(
    () => getRestoreRiskItems(restoreImpactItems),
    [restoreImpactItems],
  );
  const restoreAlreadyApplied =
    parseResult?.ok === true &&
    validatedJson.length > 0 &&
    validatedJson === importJson &&
    lastRestoredJson === validatedJson;
  const canRestore =
    parseResult?.ok === true &&
    validatedJson.length > 0 &&
    validatedJson === importJson &&
    !restoreAlreadyApplied;
  const currentBackupFingerprint = exportJson
    ? getWorkspaceBackupFingerprint(exportJson)
    : backupMeta.fingerprint || undefined;
  const importBackupFingerprint =
    parseResult?.ok === true ? getWorkspaceBackupFingerprint(importJson) : "";
  const migrationMappingItems = useMemo(
    () =>
      parseResult?.ok === true
        ? getMigrationMappingItems(parseResult.backup)
        : [],
    [parseResult],
  );
  const migrationChecklistItems = useMemo(
    () =>
      parseResult?.ok === true
        ? getMigrationChecklistItems({
            backup: parseResult.backup,
            backupIsCurrent,
            currentBackupFingerprint,
            importFingerprint: importBackupFingerprint,
            mappingItems: migrationMappingItems,
            restoreRiskItems,
          })
        : [],
    [
      backupIsCurrent,
      currentBackupFingerprint,
      importBackupFingerprint,
      migrationMappingItems,
      parseResult,
      restoreRiskItems,
    ],
  );
  const supabaseImportDryRun = useMemo(
    () =>
      parseResult?.ok === true
        ? createSupabaseImportDryRun(parseResult.backup)
        : null,
    [parseResult],
  );
  const refreshRuntimeReadiness = useCallback(async () => {
    setRuntimeReadiness((current) => ({
      data: current.data,
      status: "loading",
    }));

    try {
      const data = await fetchRuntimeReadinessStatus();

      setRuntimeReadiness({ data, status: "ready" });
    } catch {
      setRuntimeReadiness({
        error: "런타임 환경 상태를 확인하지 못했습니다.",
        status: "error",
      });
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadRuntimeReadiness() {
      try {
        const data = await fetchRuntimeReadinessStatus();

        if (!ignore) {
          setRuntimeReadiness({ data, status: "ready" });
        }
      } catch {
        if (!ignore) {
          setRuntimeReadiness({
            error: "런타임 환경 상태를 확인하지 못했습니다.",
            status: "error",
          });
        }
      }
    }

    void loadRuntimeReadiness();

    return () => {
      ignore = true;
    };
  }, []);

  function handleVerificationWorkspaceIdChange(value: string) {
    setVerificationWorkspaceId(value);
    setSupabaseImportApiPreflight({ status: "idle" });
  }

  function handleVerificationOwnerUserIdChange(value: string) {
    setVerificationOwnerUserId(value);
    setSupabaseImportApiPreflight({ status: "idle" });
  }

  async function copyDataText(
    text: string,
    successNotice: string,
    failureNotice = "복사에 실패했습니다. 브라우저 권한을 확인하거나 표시된 텍스트를 직접 선택하세요.",
    manualBody = text,
  ) {
    const copied = await copyTextToClipboard(text);

    setNotice(copied ? successNotice : failureNotice);
    setManualCopy(
      copied
        ? null
        : {
            title: getManualCopyTitle(successNotice),
            body: manualBody,
          },
    );
    return copied;
  }

  async function handleCopyBackup() {
    if (!exportJson) {
      return;
    }

    await copyDataText(
      exportJson,
      "백업 JSON을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 텍스트 영역의 내용을 직접 선택하세요.",
      buildBackupManualCopyText({
        counts: backupMeta.counts,
        exportedAt: backupMeta.exportedAt,
        fingerprint:
          backupMeta.fingerprint || getWorkspaceBackupFingerprint(exportJson),
        json: exportJson,
      }),
    );
  }

  function handleDownloadBackup() {
    if (!exportJson) {
      return;
    }

    const blob = new Blob([exportJson], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = `prompt-ai-studio-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(objectUrl);
    setManualCopy(null);
    setNotice("백업 JSON 다운로드를 시작했습니다.");
  }

  function handleValidateBackup() {
    const result = parseWorkspaceBackup(importJson);

    setParseResult(result);
    setValidatedJson(result.ok ? importJson : "");
    setLastRestoredJson("");
    setManualCopy(null);
    setSupabaseImportApiPreflight({ status: "idle" });
    setNotice(result.ok ? "백업 JSON 검증이 완료되었습니다." : result.error);
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const fileContents = await file.text();
      const result = parseWorkspaceBackup(fileContents);

      setImportJson(fileContents);
      setImportFileName(file.name);
      setParseResult(result);
      setValidatedJson(result.ok ? fileContents : "");
      setLastRestoredJson("");
      setManualCopy(null);
      setSupabaseImportApiPreflight({ status: "idle" });
      setNotice(
        result.ok
          ? `${file.name} 파일을 불러오고 검증했습니다.`
          : `${file.name} 파일 검증 실패: ${result.error}`,
      );
    } catch {
      setImportFileName(file.name);
      setParseResult(null);
      setValidatedJson("");
      setLastRestoredJson("");
      setManualCopy(null);
      setSupabaseImportApiPreflight({ status: "idle" });
      setNotice(`${file.name} 파일을 읽지 못했습니다.`);
    } finally {
      event.target.value = "";
    }
  }

  async function handleCopyRestoreReport() {
    if (parseResult?.ok !== true) {
      return;
    }

    const restoreReportParams = {
      backup: parseResult.backup,
      currentBackupFingerprint,
      importFingerprint: importBackupFingerprint,
      importSource: importFileName || "붙여넣기",
      impactItems: restoreImpactItems,
      riskItems: restoreRiskItems,
    };
    const reportText = buildRestoreReportText(restoreReportParams);

    await copyDataText(
      reportText,
      "복원 리포트를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 복원 리포트 식별 요약과 원문을 직접 선택하세요.",
      buildRestoreReportManualCopyText({
        ...restoreReportParams,
        reportText,
      }),
    );
  }

  async function handleCopyMigrationMapping() {
    if (migrationMappingItems.length === 0) {
      return;
    }

    const mappingText = buildMigrationMappingText(migrationMappingItems);

    await copyDataText(
      mappingText,
      "Supabase 매핑 요약을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. Supabase 매핑 식별 요약과 원문을 직접 선택하세요.",
      buildMigrationMappingManualCopyText({
        items: migrationMappingItems,
        mappingText,
      }),
    );
  }

  async function handleCopyMigrationChecklist() {
    if (migrationChecklistItems.length === 0) {
      return;
    }

    const checklistText = buildMigrationChecklistText(migrationChecklistItems);

    await copyDataText(
      checklistText,
      "마이그레이션 체크리스트를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 마이그레이션 체크리스트 식별 요약과 원문을 직접 선택하세요.",
      buildMigrationChecklistManualCopyText({
        checklistText,
        items: migrationChecklistItems,
      }),
    );
  }

  async function handleCopySupabaseImportDryRun() {
    if (!supabaseImportDryRun) {
      return;
    }

    const dryRunText = buildSupabaseImportDryRunText(supabaseImportDryRun);

    await copyDataText(
      dryRunText,
      "Supabase importer dry-run을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. Dry-run 식별 요약과 원문을 직접 선택하세요.",
      buildSupabaseImportDryRunManualCopyText({
        dryRun: supabaseImportDryRun,
        dryRunText,
      }),
    );
  }

  async function handleCopySupabaseReferenceReplacementGuide() {
    if (!supabaseImportDryRun) {
      return;
    }

    const guideText =
      buildSupabaseImportReferenceReplacementGuideText(supabaseImportDryRun);

    await copyDataText(
      guideText,
      "Supabase pending ID 치환 가이드를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. Pending ID 치환 범위 요약과 가이드를 직접 선택하세요.",
      buildSupabaseReferenceReplacementGuideManualCopyText({
        dryRun: supabaseImportDryRun,
        guideText,
      }),
    );
  }

  async function handleCopySupabaseImportExecutionPlan() {
    if (!supabaseImportDryRun) {
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();

    if (
      !isSupabaseWorkspaceUuid(workspaceId) ||
      !isSupabaseWorkspaceUuid(ownerUserId)
    ) {
      setNotice("workspace_id와 owner_user_id UUID 형식을 확인하세요.");
      return;
    }

    const plan = createSupabaseImporterPlan(supabaseImportDryRun, {
      ownerUserId,
      workspaceId,
    });
    const planText = buildSupabaseImportExecutionPlanText(supabaseImportDryRun, {
      ownerUserId,
      uuidByPendingId: plan.uuidByPendingId,
      workspaceId,
    });

    await copyDataText(
      planText,
      "Supabase import 실행 계획을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 실행 계획 식별 요약과 계획 원문을 직접 선택하세요.",
      buildSupabaseImportExecutionPlanManualCopyText({
        plan,
        planText,
      }),
    );
  }

  async function handleCopySupabaseImporterAdapterContract() {
    if (!supabaseImportDryRun) {
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();

    if (
      !isSupabaseWorkspaceUuid(workspaceId) ||
      !isSupabaseWorkspaceUuid(ownerUserId)
    ) {
      setNotice("workspace_id와 owner_user_id UUID 형식을 확인하세요.");
      return;
    }

    const plan = createSupabaseImporterPlan(supabaseImportDryRun, {
      ownerUserId,
      workspaceId,
    });
    const contractText = buildSupabaseImporterAdapterContractText(plan);

    await copyDataText(
      contractText,
      "Supabase importer adapter 계약을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. Adapter 계약 식별 요약과 계약 원문을 직접 선택하세요.",
      buildSupabaseImporterAdapterContractManualCopyText({
        contractText,
        plan,
      }),
    );
  }

  async function handleRunSupabaseImportApiPreflight() {
    if (parseResult?.ok !== true) {
      setNotice("먼저 백업 JSON을 검증하세요.");
      return;
    }

    if (!validatedJson || validatedJson !== importJson) {
      setNotice("현재 백업 JSON을 다시 검증한 뒤 API preflight를 실행하세요.");
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();

    if (
      !isSupabaseWorkspaceUuid(workspaceId) ||
      !isSupabaseWorkspaceUuid(ownerUserId)
    ) {
      setNotice("workspace_id와 owner_user_id UUID 형식을 확인하세요.");
      return;
    }

    setSupabaseImportApiPreflight({ status: "loading" });

    try {
      const data = await fetchSupabaseImportApiPreflight({
        backup: parseResult.backup,
        ownerUserId,
        workspaceId,
      });

      setSupabaseImportApiPreflight({
        backupFingerprint: importBackupFingerprint,
        checkedAt: new Date().toISOString(),
        data,
        ownerUserId,
        status: "ready",
        workspaceId,
      });
      setNotice("Supabase import API preflight가 완료되었습니다.");
    } catch (error) {
      setSupabaseImportApiPreflight({
        checkedAt: new Date().toISOString(),
        error:
          error instanceof Error
            ? error.message
            : "Supabase import API preflight에 실패했습니다.",
        status: "error",
      });
      setNotice("Supabase import API preflight에 실패했습니다.");
    }
  }

  function getSupabaseImportPreflightScopeError() {
    if (
      supabaseImportApiPreflight.status !== "ready" ||
      !supabaseImportApiPreflight.data
    ) {
      return "먼저 Supabase import API preflight를 실행하세요.";
    }

    return getSupabaseImportPreflightScopeErrorText(
      getSupabaseImportPreflightScopeStatus({
        current: {
          backupFingerprint: importBackupFingerprint,
          ownerUserId: verificationOwnerUserId,
          workspaceId: verificationWorkspaceId,
        },
        preflight: supabaseImportApiPreflight,
      }),
    );
  }

  async function handleCopySupabaseImportApiPreflightReport() {
    const preflightScopeError = getSupabaseImportPreflightScopeError();

    if (preflightScopeError) {
      setNotice(preflightScopeError);
      return;
    }

    const preflightData = supabaseImportApiPreflight.data;

    if (!preflightData) {
      return;
    }

    const backupFingerprint = importBackupFingerprint;
    const checkedAt = supabaseImportApiPreflight.checkedAt;
    const ownerUserId = verificationOwnerUserId.trim();
    const workspaceId = verificationWorkspaceId.trim();
    const preflightText = buildSupabaseImportApiPreflightReportText({
      checkedAt,
      response: preflightData,
    });

    await copyDataText(
      preflightText,
      "Supabase import API preflight 리포트를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. API preflight 식별 요약과 리포트를 직접 선택하세요.",
      buildSupabaseImportApiPreflightReportManualCopyText({
        backupFingerprint,
        checkedAt,
        ownerUserId,
        preflightText,
        response: preflightData,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseImportApiAuditArtifact() {
    const preflightScopeError = getSupabaseImportPreflightScopeError();

    if (preflightScopeError) {
      setNotice(preflightScopeError);
      return;
    }

    const preflightData = supabaseImportApiPreflight.data;

    if (!preflightData) {
      return;
    }

    if (!preflightData.auditArtifactText) {
      setNotice("API audit artifact가 응답에 없습니다. preflight를 다시 실행하세요.");
      return;
    }

    const artifactText = preflightData.auditArtifactText;
    const backupFingerprint = importBackupFingerprint;
    const checkedAt = supabaseImportApiPreflight.checkedAt;
    const ownerUserId = verificationOwnerUserId.trim();
    const workspaceId = verificationWorkspaceId.trim();

    await copyDataText(
      artifactText,
      "Supabase import API audit artifact를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. API audit artifact 식별 요약과 원문을 직접 선택하세요.",
      buildSupabaseImportApiAuditArtifactManualCopyText({
        artifactText,
        backupFingerprint,
        checkedAt,
        ownerUserId,
        response: preflightData,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseImportExecutionRequestTemplate() {
    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();

    if (
      !isSupabaseWorkspaceUuid(workspaceId) ||
      !isSupabaseWorkspaceUuid(ownerUserId)
    ) {
      setNotice("workspace_id와 owner_user_id UUID 형식을 확인하세요.");
      return;
    }

    const backupFingerprint = importBackupFingerprint;
    const templateText = buildSupabaseImportExecutionRequestTemplateText({
      backupFingerprint,
      ownerUserId,
      workspaceId,
    });

    await copyDataText(
      templateText,
      "Supabase import 실행 요청 템플릿을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 실행 요청 식별 요약과 템플릿을 직접 선택하세요.",
      buildSupabaseImportExecutionRequestTemplateManualCopyText({
        backupFingerprint,
        ownerUserId,
        templateText,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseImportExecutionGuardChecklist() {
    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();

    if (
      !isSupabaseWorkspaceUuid(workspaceId) ||
      !isSupabaseWorkspaceUuid(ownerUserId)
    ) {
      setNotice("workspace_id와 owner_user_id UUID 형식을 확인하세요.");
      return;
    }

    const backupFingerprint = importBackupFingerprint;
    const checklistText = buildSupabaseImportExecutionGuardChecklistText({
      backupFingerprint,
      ownerUserId,
      workspaceId,
    });

    await copyDataText(
      checklistText,
      "Supabase import 실행 금지 체크리스트를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 실행 금지 식별 요약과 체크리스트를 직접 선택하세요.",
      buildSupabaseImportExecutionGuardChecklistManualCopyText({
        backupFingerprint,
        checklistText,
        ownerUserId,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseMigrationRehearsalReport() {
    const preflightScopeError = getSupabaseImportPreflightScopeError();

    if (preflightScopeError) {
      setNotice(preflightScopeError);
      return;
    }

    const preflightData = supabaseImportApiPreflight.data;

    if (!preflightData) {
      return;
    }

    const backupFingerprint = importBackupFingerprint;
    const checkedAt = supabaseImportApiPreflight.checkedAt;
    const ownerUserId = verificationOwnerUserId.trim();
    const workspaceId = verificationWorkspaceId.trim();
    const rehearsalText = buildSupabaseMigrationRehearsalReportText({
      checkedAt,
      ownerUserId,
      preflight: preflightData,
      workspaceId,
    });

    await copyDataText(
      rehearsalText,
      "Supabase migration rehearsal 리포트를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 리허설 식별 요약과 리포트를 직접 선택하세요.",
      buildSupabaseMigrationRehearsalReportManualCopyText({
        backupFingerprint,
        checkedAt,
        ownerUserId,
        preflight: preflightData,
        rehearsalText,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseImportExecutionReadinessDecision() {
    const preflightScopeError = getSupabaseImportPreflightScopeError();

    if (preflightScopeError) {
      setNotice(preflightScopeError);
      return;
    }

    if (!runtimeReadiness.data) {
      setNotice("운영 환경 readiness 상태를 먼저 새로고침하세요.");
      return;
    }

    const preflightData = supabaseImportApiPreflight.data;

    if (!preflightData) {
      return;
    }

    const backupFingerprint = importBackupFingerprint;
    const checkedAt = new Date().toISOString();
    const ownerUserId = verificationOwnerUserId.trim();
    const workspaceId = verificationWorkspaceId.trim();
    const decisionText = buildSupabaseImportExecutionReadinessDecisionText({
      backupFingerprint,
      checkedAt,
      ownerUserId,
      preflight: preflightData,
      runtimeStatus: runtimeReadiness.data,
      workspaceId,
    });

    await copyDataText(
      decisionText,
      "Supabase import 실행 판정 메모를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 실행 판정 식별 요약과 메모를 직접 선택하세요.",
      buildSupabaseImportExecutionReadinessDecisionManualCopyText({
        backupFingerprint,
        checkedAt,
        decisionText,
        ownerUserId,
        preflight: preflightData,
        runtimeStatus: runtimeReadiness.data,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseImportExecutionPacketManifest() {
    const preflightScopeError = getSupabaseImportPreflightScopeError();

    if (preflightScopeError) {
      setNotice(preflightScopeError);
      return;
    }

    const preflightData = supabaseImportApiPreflight.data;

    if (!preflightData) {
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();
    const manifestItems = getSupabaseImportExecutionPacketManifestItems({
      backupFingerprint: importBackupFingerprint,
      ownerUserId,
      preflightState: supabaseImportApiPreflight,
      runtimeState:
        getSupabaseImportExecutionPacketRuntimeState(runtimeReadiness),
      sectionCount: supabaseImportExecutionPacketSectionCount,
      workspaceId,
    });
    const checkedAt = new Date().toISOString();
    const manifestText = buildSupabaseImportExecutionPacketManifestText({
      backupFingerprint: importBackupFingerprint,
      checkedAt,
      items: manifestItems,
      ownerUserId,
      preflightCheckedAt: supabaseImportApiPreflight.checkedAt,
      workspaceId,
    });

    await copyDataText(
      manifestText,
      "Supabase import execution packet manifest를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. Execution packet manifest 식별 요약과 원문을 직접 선택하세요.",
      buildSupabaseImportExecutionPacketManifestManualCopyText({
        backupFingerprint: importBackupFingerprint,
        checkedAt,
        manifestItems,
        manifestText,
        ownerUserId,
        preflightCheckedAt: supabaseImportApiPreflight.checkedAt,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseImportExecutionPacketNextAction() {
    const preflightData = supabaseImportApiPreflight.data;

    if (!preflightData) {
      setNotice("먼저 Supabase import API preflight를 실행하세요.");
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();
    const manifestItems = getSupabaseImportExecutionPacketManifestItems({
      backupFingerprint: importBackupFingerprint,
      ownerUserId,
      preflightState: supabaseImportApiPreflight,
      runtimeState:
        getSupabaseImportExecutionPacketRuntimeState(runtimeReadiness),
      sectionCount: supabaseImportExecutionPacketSectionCount,
      workspaceId,
    });
    const checkedAt = new Date().toISOString();
    const nextActionText = buildSupabaseImportExecutionPacketNextActionText({
      backupFingerprint: importBackupFingerprint,
      checkedAt,
      items: manifestItems,
      ownerUserId,
      preflightCheckedAt: supabaseImportApiPreflight.checkedAt,
      workspaceId,
    });

    await copyDataText(
      nextActionText,
      "Supabase import execution packet 다음 조치를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. Execution packet 다음 조치 식별 요약과 원문을 직접 선택하세요.",
      buildSupabaseImportExecutionPacketNextActionManualCopyText({
        backupFingerprint: importBackupFingerprint,
        checkedAt,
        manifestItems,
        nextActionText,
        ownerUserId,
        preflightCheckedAt: supabaseImportApiPreflight.checkedAt,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseImportExecutionPacket() {
    if (!supabaseImportDryRun) {
      return;
    }

    const preflightScopeError = getSupabaseImportPreflightScopeError();

    if (preflightScopeError) {
      setNotice(preflightScopeError);
      return;
    }

    if (!runtimeReadiness.data) {
      setNotice("운영 환경 readiness 상태를 먼저 새로고침하세요.");
      return;
    }

    const preflightData = supabaseImportApiPreflight.data;

    if (!preflightData) {
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();

    if (
      !isSupabaseWorkspaceUuid(workspaceId) ||
      !isSupabaseWorkspaceUuid(ownerUserId)
    ) {
      setNotice("workspace_id와 owner_user_id UUID 형식을 확인하세요.");
      return;
    }

    const adapterPlan = createSupabaseImporterPlan(supabaseImportDryRun, {
      ownerUserId,
      workspaceId,
    });
    const checkedAt = new Date().toISOString();
    const manifestItems = getSupabaseImportExecutionPacketManifestItems({
      backupFingerprint: importBackupFingerprint,
      ownerUserId,
      preflightState: supabaseImportApiPreflight,
      runtimeState:
        getSupabaseImportExecutionPacketRuntimeState(runtimeReadiness),
      sectionCount: supabaseImportExecutionPacketSectionCount,
      workspaceId,
    });
    const executionPacketManifestText =
      buildSupabaseImportExecutionPacketManifestText({
        backupFingerprint: importBackupFingerprint,
        checkedAt,
        items: manifestItems,
        ownerUserId,
        preflightCheckedAt: supabaseImportApiPreflight.checkedAt,
        workspaceId,
      });
    const executionPacketText = buildSupabaseImportExecutionPacketText({
      adapterContractText: buildSupabaseImporterAdapterContractText(
        adapterPlan,
      ),
      apiAuditArtifactText: preflightData.auditArtifactText,
      apiPreflightReportText: buildSupabaseImportApiPreflightReportText({
        checkedAt: supabaseImportApiPreflight.checkedAt,
        response: preflightData,
      }),
      executionGuardChecklistText:
        buildSupabaseImportExecutionGuardChecklistText({
          backupFingerprint: importBackupFingerprint,
          ownerUserId,
          workspaceId,
        }),
      executionPacketManifestText,
      executionPlanText: buildSupabaseImportExecutionPlanText(
        supabaseImportDryRun,
        {
          ownerUserId,
          workspaceId,
        },
      ),
      executionReadinessDecisionText:
        buildSupabaseImportExecutionReadinessDecisionText({
          backupFingerprint: importBackupFingerprint,
          checkedAt,
          ownerUserId,
          preflight: preflightData,
          runtimeStatus: runtimeReadiness.data,
          workspaceId,
        }),
      executionRequestTemplateText:
        buildSupabaseImportExecutionRequestTemplateText({
          backupFingerprint: importBackupFingerprint,
          ownerUserId,
          workspaceId,
        }),
      postImportVerificationEvidenceText:
        buildSupabasePostImportVerificationEvidenceText({
          backupFingerprint: importBackupFingerprint,
          checkedAt,
          ownerUserId,
          preflight: preflightData,
          workspaceId,
        }),
      rehearsalReportText: buildSupabaseMigrationRehearsalReportText({
        checkedAt: supabaseImportApiPreflight.checkedAt,
        ownerUserId,
        preflight: preflightData,
        workspaceId,
      }),
    });

    await copyDataText(
      executionPacketText,
      "Supabase import 실행 패킷을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 실행 패킷 식별 요약과 본문을 직접 선택하세요.",
      buildSupabaseImportExecutionPacketManualCopyText({
        backupFingerprint: importBackupFingerprint,
        checkedAt,
        manifestItems,
        ownerUserId,
        packetText: executionPacketText,
        preflightCheckedAt: supabaseImportApiPreflight.checkedAt,
        runtimeStatus: runtimeReadiness.data,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabasePostImportVerificationEvidence() {
    const preflightScopeError = getSupabaseImportPreflightScopeError();

    if (preflightScopeError) {
      setNotice(preflightScopeError);
      return;
    }

    const preflightData = supabaseImportApiPreflight.data;

    if (!preflightData) {
      return;
    }

    const backupFingerprint = importBackupFingerprint;
    const checkedAt = supabaseImportApiPreflight.checkedAt;
    const ownerUserId = verificationOwnerUserId.trim();
    const workspaceId = verificationWorkspaceId.trim();
    const evidenceText = buildSupabasePostImportVerificationEvidenceText({
      backupFingerprint,
      checkedAt,
      ownerUserId,
      preflight: preflightData,
      workspaceId,
    });

    await copyDataText(
      evidenceText,
      "Supabase post-import 검증 기록지를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 검증 기록 식별 요약과 본문을 직접 선택하세요.",
      buildSupabasePostImportVerificationEvidenceManualCopyText({
        backupFingerprint,
        checkedAt,
        evidenceText,
        ownerUserId,
        preflight: preflightData,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseVerificationSql() {
    if (!supabaseImportDryRun) {
      return;
    }

    const verificationSql =
      buildSupabaseImportVerificationSql(supabaseImportDryRun);

    await copyDataText(
      verificationSql,
      "Supabase 검증 SQL을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. Row count 검증 식별 요약과 SQL 원문을 직접 선택하세요.",
      buildSupabaseImportVerificationSqlManualCopyText({
        dryRun: supabaseImportDryRun,
        sql: verificationSql,
      }),
    );
  }

  async function handleCopyResolvedSupabaseVerificationSql() {
    if (!supabaseImportDryRun) {
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();

    if (!isSupabaseWorkspaceUuid(workspaceId)) {
      setNotice("workspace_id UUID 형식을 확인하세요.");
      return;
    }

    const verificationSql = buildSupabaseImportVerificationSql(
      supabaseImportDryRun,
      {
        workspaceId,
      },
    );

    await copyDataText(
      verificationSql,
      "workspace_id가 반영된 Supabase 검증 SQL을 복사했습니다.",
      "클립보드 복사에 실패했습니다. workspace_id 기준 row count 검증 요약과 SQL 원문을 직접 선택하세요.",
      buildSupabaseImportVerificationSqlManualCopyText({
        dryRun: supabaseImportDryRun,
        sql: verificationSql,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseRelationshipVerificationSql() {
    if (!supabaseImportDryRun) {
      return;
    }

    const relationshipSql = buildSupabaseImportRelationshipVerificationSql();

    await copyDataText(
      relationshipSql,
      "Supabase 관계 검증 SQL 템플릿을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 관계 검증 식별 요약과 SQL 원문을 직접 선택하세요.",
      buildSupabaseRelationshipVerificationSqlManualCopyText({
        dryRun: supabaseImportDryRun,
        sql: relationshipSql,
      }),
    );
  }

  async function handleCopyResolvedSupabaseRelationshipVerificationSql() {
    if (!supabaseImportDryRun) {
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();

    if (!isSupabaseWorkspaceUuid(workspaceId)) {
      setNotice("workspace_id UUID 형식을 확인하세요.");
      return;
    }

    const relationshipSql = buildSupabaseImportRelationshipVerificationSql({
      workspaceId,
    });

    await copyDataText(
      relationshipSql,
      "workspace_id가 반영된 Supabase 관계 검증 SQL을 복사했습니다.",
      "클립보드 복사에 실패했습니다. workspace_id 기준 관계 검증 요약과 SQL 원문을 직접 선택하세요.",
      buildSupabaseRelationshipVerificationSqlManualCopyText({
        dryRun: supabaseImportDryRun,
        sql: relationshipSql,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabasePendingIdAuditSql() {
    if (!supabaseImportDryRun) {
      return;
    }

    const pendingIdAuditSql = buildSupabaseImportPendingIdAuditSql();

    await copyDataText(
      pendingIdAuditSql,
      "Supabase pending ID audit SQL 템플릿을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. Pending ID audit 식별 요약과 SQL 원문을 직접 선택하세요.",
      buildSupabasePendingIdAuditSqlManualCopyText({
        dryRun: supabaseImportDryRun,
        sql: pendingIdAuditSql,
      }),
    );
  }

  async function handleCopyResolvedSupabasePendingIdAuditSql() {
    if (!supabaseImportDryRun) {
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();

    if (!isSupabaseWorkspaceUuid(workspaceId)) {
      setNotice("workspace_id UUID 형식을 확인하세요.");
      return;
    }

    const pendingIdAuditSql = buildSupabaseImportPendingIdAuditSql({
      workspaceId,
    });

    await copyDataText(
      pendingIdAuditSql,
      "workspace_id가 반영된 Supabase pending ID audit SQL을 복사했습니다.",
      "클립보드 복사에 실패했습니다. workspace_id 기준 Pending ID audit 요약과 SQL 원문을 직접 선택하세요.",
      buildSupabasePendingIdAuditSqlManualCopyText({
        dryRun: supabaseImportDryRun,
        sql: pendingIdAuditSql,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseRlsAccessAuditSql() {
    if (!supabaseImportDryRun) {
      return;
    }

    const rlsAccessAuditSql = buildSupabaseImportRlsAccessAuditSql();

    await copyDataText(
      rlsAccessAuditSql,
      "Supabase RLS owner access audit SQL 템플릿을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. RLS owner access audit 식별 요약과 SQL 원문을 직접 선택하세요.",
      buildSupabaseRlsAccessAuditSqlManualCopyText({
        dryRun: supabaseImportDryRun,
        sql: rlsAccessAuditSql,
      }),
    );
  }

  async function handleCopyResolvedSupabaseRlsAccessAuditSql() {
    if (!supabaseImportDryRun) {
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();

    if (
      !isSupabaseWorkspaceUuid(workspaceId) ||
      !isSupabaseWorkspaceUuid(ownerUserId)
    ) {
      setNotice("workspace_id와 owner_user_id UUID 형식을 확인하세요.");
      return;
    }

    const rlsAccessAuditSql = buildSupabaseImportRlsAccessAuditSql({
      ownerUserId,
      workspaceId,
    });

    await copyDataText(
      rlsAccessAuditSql,
      "workspace_id와 owner_user_id가 반영된 RLS audit SQL을 복사했습니다.",
      "클립보드 복사에 실패했습니다. workspace_id/owner_user_id 기준 RLS owner audit 요약과 SQL 원문을 직접 선택하세요.",
      buildSupabaseRlsAccessAuditSqlManualCopyText({
        dryRun: supabaseImportDryRun,
        ownerUserId,
        sql: rlsAccessAuditSql,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseRlsPolicyDraftSql() {
    if (!supabaseImportDryRun) {
      return;
    }

    const rlsPolicyDraftSql = buildSupabaseRlsPolicyDraftSql();

    await copyDataText(
      rlsPolicyDraftSql,
      "Supabase RLS policy draft SQL을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. RLS policy draft 식별 요약과 SQL 원문을 직접 선택하세요.",
      buildSupabaseRlsPolicyDraftSqlManualCopyText({
        dryRun: supabaseImportDryRun,
        sql: rlsPolicyDraftSql,
      }),
    );
  }

  async function handleCopySupabaseRlsSmokeTestChecklist() {
    if (!supabaseImportDryRun) {
      return;
    }

    const checklistText = buildSupabaseRlsSmokeTestChecklistText();

    await copyDataText(
      checklistText,
      "Supabase RLS smoke test 체크리스트 템플릿을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. RLS smoke test 식별 요약과 체크리스트를 직접 선택하세요.",
      buildSupabaseRlsSmokeTestChecklistManualCopyText({
        checklistText,
        dryRun: supabaseImportDryRun,
      }),
    );
  }

  async function handleCopyResolvedSupabaseRlsSmokeTestChecklist() {
    if (!supabaseImportDryRun) {
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();

    if (
      !isSupabaseWorkspaceUuid(workspaceId) ||
      !isSupabaseWorkspaceUuid(ownerUserId)
    ) {
      setNotice("workspace_id와 owner_user_id UUID 형식을 확인하세요.");
      return;
    }

    const checklistText = buildSupabaseRlsSmokeTestChecklistText({
      ownerUserId,
      workspaceId,
    });

    await copyDataText(
      checklistText,
      "workspace_id와 owner_user_id가 반영된 RLS smoke test 체크리스트를 복사했습니다.",
      "클립보드 복사에 실패했습니다. workspace_id/owner_user_id 기준 RLS smoke test 요약과 체크리스트를 직접 선택하세요.",
      buildSupabaseRlsSmokeTestChecklistManualCopyText({
        checklistText,
        dryRun: supabaseImportDryRun,
        ownerUserId,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseVerificationReport() {
    if (!supabaseImportDryRun) {
      return;
    }

    const reportText =
      buildSupabaseImportVerificationReportText(supabaseImportDryRun);

    await copyDataText(
      reportText,
      "Supabase 검증 판정 리포트 템플릿을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. Supabase 검증 판정 요약과 리포트 원문을 직접 선택하세요.",
      buildSupabaseVerificationReportManualCopyText({
        dryRun: supabaseImportDryRun,
        reportText,
      }),
    );
  }

  async function handleCopyResolvedSupabaseVerificationReport() {
    if (!supabaseImportDryRun) {
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();

    if (
      !isSupabaseWorkspaceUuid(workspaceId) ||
      !isSupabaseWorkspaceUuid(ownerUserId)
    ) {
      setNotice("workspace_id와 owner_user_id UUID 형식을 확인하세요.");
      return;
    }

    const reportText = buildSupabaseImportVerificationReportText(
      supabaseImportDryRun,
      {
        ownerUserId,
        workspaceId,
      },
    );

    await copyDataText(
      reportText,
      "workspace_id와 owner_user_id가 반영된 Supabase 검증 판정 리포트를 복사했습니다.",
      "클립보드 복사에 실패했습니다. workspace_id/owner_user_id 기준 Supabase 검증 판정 요약과 리포트 원문을 직접 선택하세요.",
      buildSupabaseVerificationReportManualCopyText({
        dryRun: supabaseImportDryRun,
        ownerUserId,
        reportText,
        workspaceId,
      }),
    );
  }

  async function handleCopySupabaseMigrationHandoffPackage() {
    if (!supabaseImportDryRun) {
      return;
    }

    const packageText =
      buildSupabaseMigrationHandoffPackageText(supabaseImportDryRun);

    await copyDataText(
      packageText,
      "Supabase migration handoff package 템플릿을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. Supabase migration handoff 요약과 패키지 원문을 직접 선택하세요.",
      buildSupabaseMigrationHandoffPackageManualCopyText({
        dryRun: supabaseImportDryRun,
        packageText,
      }),
    );
  }

  async function handleCopyResolvedSupabaseMigrationHandoffPackage() {
    if (!supabaseImportDryRun) {
      return;
    }

    const workspaceId = verificationWorkspaceId.trim();
    const ownerUserId = verificationOwnerUserId.trim();

    if (
      !isSupabaseWorkspaceUuid(workspaceId) ||
      !isSupabaseWorkspaceUuid(ownerUserId)
    ) {
      setNotice("workspace_id와 owner_user_id UUID 형식을 확인하세요.");
      return;
    }

    const packageText = buildSupabaseMigrationHandoffPackageText(
      supabaseImportDryRun,
      {
        ownerUserId,
        workspaceId,
      },
    );

    await copyDataText(
      packageText,
      "workspace_id와 owner_user_id가 반영된 Supabase migration handoff package를 복사했습니다.",
      "클립보드 복사에 실패했습니다. workspace_id/owner_user_id 기준 Supabase migration handoff 요약과 패키지 원문을 직접 선택하세요.",
      buildSupabaseMigrationHandoffPackageManualCopyText({
        dryRun: supabaseImportDryRun,
        ownerUserId,
        packageText,
        workspaceId,
      }),
    );
  }

  async function handleCopyEnvironmentTemplate() {
    const environmentTemplateText = buildEnvironmentExampleText();

    await copyDataText(
      environmentTemplateText,
      ".env.local 템플릿을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 환경 변수 노출 기준과 .env.local 템플릿을 직접 선택하세요.",
      buildEnvironmentTemplateManualCopyText({
        templateText: environmentTemplateText,
      }),
    );
  }

  async function handleCopyEnvironmentReadiness() {
    const readinessText = buildEnvironmentReadinessText(runtimeReadiness.data);

    await copyDataText(
      readinessText,
      "운영 환경 readiness 체크리스트를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 운영 환경 readiness 요약과 체크리스트를 직접 선택하세요.",
      buildEnvironmentReadinessManualCopyText({
        checklistText: readinessText,
        runtimeStatus: runtimeReadiness.data,
      }),
    );
  }

  async function handleCopyDocumentRagReadiness() {
    const readinessText = buildDocumentRagReadinessText();

    await copyDataText(
      readinessText,
      "문서/RAG 준비도 리포트를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 문서/RAG 준비도 요약과 리포트를 직접 선택하세요.",
      buildDocumentRagReadinessManualCopyText({
        reportText: readinessText,
      }),
    );
  }

  async function handleDocumentRagFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isTextLike =
      file.type.startsWith("text/") ||
      file.type === "application/json" ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".json");

    if (!isTextLike) {
      setNotice("텍스트, Markdown, JSON 파일만 chunk preview에 사용할 수 있습니다.");
      event.target.value = "";
      return;
    }

    try {
      const fileContents = await file.text();

      setDocumentRagSourceName(file.name);
      setDocumentRagText(fileContents);
      setManualCopy(null);
      setNotice(`${file.name} 문서를 chunk preview로 불러왔습니다.`);
    } catch {
      setNotice(`${file.name} 파일을 읽지 못했습니다.`);
    } finally {
      event.target.value = "";
    }
  }

  function handleClearDocumentRagDraft() {
    setDocumentRagSourceName("");
    setDocumentRagText("");
    setManualCopy(null);
    setNotice("문서/RAG 입력을 지웠습니다.");
  }

  async function handleCopyDocumentRagIngestionPacket() {
    if (documentRagChunks.length === 0) {
      setNotice("문서 원문을 입력한 뒤 수집 패킷을 복사하세요.");
      return;
    }

    const packetText = buildDocumentRagIngestionPacketText({
      chunks: documentRagChunks,
      sourceName: documentRagSourceName,
      text: documentRagText,
    });

    await copyDataText(
      packetText,
      "문서/RAG 수집 패킷을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 문서/RAG 수집 패킷 요약과 원문을 직접 선택하세요.",
      buildDocumentRagIngestionPacketManualCopyText({
        chunks: documentRagChunks,
        packetText,
        sourceName: documentRagSourceName,
        text: documentRagText,
      }),
    );
  }

  function handleOpenDocumentRagInStudio() {
    if (documentRagChunks.length === 0) {
      setNotice("문서 원문을 입력한 뒤 Studio 초안으로 보내세요.");
      return;
    }

    const sourceName = documentRagSourceName.trim() || "untitled-document";
    const rawInput = buildDocumentRagStudioDraftInput({
      chunks: documentRagChunks,
      sourceName,
      text: documentRagText,
    });
    const wroteDraft = writeStudioDraft({
      createdAt: new Date().toISOString(),
      domain: "문서 기반 RAG",
      goal: "문서 맥락 기반 프롬프트 작성",
      outputLanguage: "same_as_input",
      rawInput,
      source: "data-document-rag",
      sourceHref: "/data",
      sourceTitle: `문서/RAG chunk 초안 · ${sourceName}`,
      targetModels: ["gpt", "claude", "gemini"],
    });

    if (!wroteDraft) {
      setManualCopy({
        title: `문서/RAG Studio 초안 · ${sourceName}`,
        body: rawInput,
      });
      setNotice(
        "Studio 초안을 저장하지 못했습니다. 아래 원문을 직접 선택해 복사하세요.",
      );
      return;
    }

    setManualCopy(null);
    router.push("/studio?draft=data-document-rag");
  }

  async function handleCopyRuntimeStatusJson() {
    if (!runtimeReadiness.data) {
      return;
    }

    const runtimeStatusJson = buildEnvironmentRuntimeStatusJson(
      runtimeReadiness.data,
    );

    await copyDataText(
      runtimeStatusJson,
      "런타임 상태 JSON을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 런타임 요약과 JSON을 직접 선택하세요.",
      buildRuntimeStatusManualCopyText({
        json: runtimeStatusJson,
        runtimeStatus: runtimeReadiness.data,
      }),
    );
  }

  async function handleCopyRuntimeDiagnostics() {
    if (!runtimeReadiness.data) {
      return;
    }

    const diagnosticsText = buildEnvironmentRuntimeDiagnosticsText(
      runtimeReadiness.data,
    );

    await copyDataText(
      diagnosticsText,
      "런타임 진단 리포트를 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 런타임 진단 요약과 리포트를 직접 선택하세요.",
      buildRuntimeDiagnosticsManualCopyText({
        diagnosticsText,
        runtimeStatus: runtimeReadiness.data,
      }),
    );
  }

  async function handleCopyOperatorActionPlan() {
    if (!runtimeReadiness.data) {
      return;
    }

    const actionPlanText = buildEnvironmentOperatorActionPlanText(
      runtimeReadiness.data,
    );

    await copyDataText(
      actionPlanText,
      "운영자 조치 계획을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 운영자 조치 요약과 계획을 직접 선택하세요.",
      buildOperatorActionPlanManualCopyText({
        actionPlanText,
        runtimeStatus: runtimeReadiness.data,
      }),
    );
  }

  function handleSaveRuntimeSnapshot() {
    const runtimeStatus = runtimeReadiness.data;

    if (!runtimeStatus) {
      return;
    }

    setRuntimeSnapshots((currentSnapshots) =>
      addEnvironmentRuntimeSnapshot(currentSnapshots, runtimeStatus),
    );
    setManualCopy(null);
    setNotice("현재 런타임 readiness 스냅샷을 저장했습니다.");
  }

  async function handleCopyRuntimeSnapshots() {
    if (runtimeSnapshots.length === 0) {
      return;
    }

    const runtimeSnapshotsJson =
      buildEnvironmentRuntimeSnapshotsJson(runtimeSnapshots);

    await copyDataText(
      runtimeSnapshotsJson,
      "런타임 readiness 스냅샷 JSON을 클립보드에 복사했습니다.",
      "클립보드 복사에 실패했습니다. 런타임 스냅샷 요약과 JSON을 직접 선택하세요.",
      buildRuntimeSnapshotsManualCopyText({
        json: runtimeSnapshotsJson,
        snapshots: runtimeSnapshots,
      }),
    );
  }

  async function handleCopySnapshotComparison() {
    if (!runtimeReadiness.data || runtimeSnapshots.length === 0) {
      return;
    }

    const comparisonText = buildEnvironmentRuntimeSnapshotComparisonText(
      runtimeReadiness.data,
      runtimeSnapshots[0],
    );

    await copyDataText(
      comparisonText,
      "런타임 readiness 스냅샷 비교 리포트를 복사했습니다.",
      "클립보드 복사에 실패했습니다. 런타임 스냅샷 비교 요약과 리포트를 직접 선택하세요.",
      buildRuntimeSnapshotComparisonManualCopyText({
        comparisonText,
        currentStatus: runtimeReadiness.data,
        snapshot: runtimeSnapshots[0],
      }),
    );
  }

  function handleClearRuntimeSnapshots() {
    if (runtimeSnapshots.length === 0) {
      return;
    }

    setRuntimeSnapshots([]);
    setManualCopy(null);
    setNotice("런타임 readiness 스냅샷을 삭제했습니다.");
  }

  function handleRestoreBackup() {
    if (parseResult?.ok !== true || !canRestore) {
      return;
    }

    const confirmed = window.confirm(
      buildRestoreConfirmMessage({
        currentExportFingerprint: currentBackupFingerprint,
        importFingerprint: getWorkspaceBackupFingerprint(importJson),
        riskItems: restoreRiskItems,
      }),
    );

    if (!confirmed) {
      return;
    }

    restoreWorkspaceBackup(parseResult.backup);
    setBackupMeta(createWorkspaceBackupMeta(parseResult.backup));
    setLastRestoredJson(validatedJson);
    setManualCopy(null);
    setNotice("백업 데이터를 복원하고 최근 백업 상태를 최신으로 갱신했습니다.");
  }

  return (
    <>
      <PageHeader
        title="데이터 관리"
        description="현재 브라우저에 저장된 프로필, 프롬프트, 피드백, 학습 메모리, 스킬, 삭제 보관함을 백업하고 복원합니다."
      />

      <div className="space-y-6">
        <ContextOperatingFlow
          badge="destructive action 분리"
          description="백업을 먼저 고정하고 준비도, 문서/RAG, Supabase 전환 gate를 순서대로 확인합니다."
          items={dataOperationFlowItems}
          testId="data-operating-flow"
          title="데이터 운영 흐름"
        />

        <div
          className="grid gap-3 md:grid-cols-3"
          data-testid="data-safety-workflow"
        >
          {dataSafetyWorkflowSteps.map((item) => (
            <div
              className="min-w-0 rounded-md border border-line bg-panel px-4 py-4"
              key={item.step}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-panel-strong font-mono text-xs text-soft">
                  {item.step}
                </span>
                <p className="text-sm font-semibold text-soft">{item.label}</p>
              </div>
              <p className="mt-3 break-words text-sm font-semibold text-accent">
                {item.title}
              </p>
              <p className="mt-2 break-words text-xs leading-5 text-muted">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        <Panel>
          <PanelHeader
            title="워크스페이스 스냅샷"
            description="Supabase 전환 시 그대로 옮겨야 할 현재 로컬 데이터 단위입니다."
          />
          <div className="space-y-5 px-5 py-5">
            <CountGrid counts={currentCounts} />
            <div
              className="grid grid-cols-2 gap-3 text-sm leading-6 text-soft md:grid-cols-2"
              data-testid="data-workspace-context-summary"
            >
              <div className="min-w-0 rounded-md border border-line bg-panel-strong px-3 py-3 sm:px-4">
                <p className="text-xs text-muted">사용자 프로필</p>
                <p className="mt-1 break-words">
                  {userProfile.role || "미설정"}
                </p>
              </div>
              <div className="min-w-0 rounded-md border border-line bg-panel-strong px-3 py-3 sm:px-4">
                <p className="text-xs text-muted">회사 프로필</p>
                <p className="mt-1 break-words">
                  {companyProfile.companyName || "미설정"}
                </p>
              </div>
              <div className="col-span-2 min-w-0 rounded-md border border-line bg-panel-strong px-3 py-3 sm:px-4">
                <p className="text-xs text-muted">최근 백업</p>
                <p className="mt-1 break-words">
                  {backupMeta.exportedAt
                    ? `${formatBackupDate(backupMeta.exportedAt)} · ${
                        backupIsCurrent ? "최신" : "업데이트 필요"
                      } · 프롬프트 ${backupMeta.counts.prompts}개${
                        typeof backupMeta.counts.deletedPrompts === "number"
                          ? ` · 삭제 보관함 ${backupMeta.counts.deletedPrompts}개`
                          : " · 삭제 보관함 0개"
                      }${
                        backupMeta.fingerprint
                          ? ` · 지문 ${backupMeta.fingerprint}`
                          : ""
                      }`
                    : "아직 생성된 백업 없음"}
                </p>
              </div>
            </div>
            {backupCountChanges.length > 0 ? (
              <BackupUpdateSummary
                changes={backupCountChanges}
                onGenerateBackup={handleGenerateBackup}
              />
            ) : null}
          </div>
        </Panel>

        <Panel id="data-readiness" className="scroll-mt-28">
          <PanelHeader
            title="데이터 준비도"
            description="Supabase 전환이나 팀 워크스페이스 확장 전에 현재 로컬 데이터가 갖춰진 정도를 확인합니다."
          />
          <div className="space-y-5 px-5 py-5">
            <div className="flex min-w-0 flex-col gap-4 rounded-md border border-line bg-panel-strong px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-soft">{readinessStage}</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {readinessItems.filter((item) => item.ready).length}개 항목 완료,
                  부족한 항목은 아래 액션에서 바로 보강할 수 있습니다.
                </p>
              </div>
              <div className="min-w-[8rem]">
                <div className="flex items-end justify-between gap-3">
                  <span className="font-mono text-3xl font-semibold">
                    {readinessScore}
                  </span>
                  <span className="pb-1 text-sm text-muted">/ 100</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${readinessScore}%` }}
                  />
                </div>
              </div>
            </div>
            <ReadinessChecklist items={readinessItems} />
            <DocumentRagReadinessSummary
              chunks={documentRagChunks}
              onClearDraft={handleClearDocumentRagDraft}
              onCopyIngestionPacket={handleCopyDocumentRagIngestionPacket}
              onCopyReadiness={handleCopyDocumentRagReadiness}
              onDocumentFileChange={handleDocumentRagFileChange}
              onDocumentNameChange={setDocumentRagSourceName}
              onDocumentTextChange={setDocumentRagText}
              onOpenInStudio={handleOpenDocumentRagInStudio}
              sourceName={documentRagSourceName}
              text={documentRagText}
            />
            <EnvironmentReadinessSummary
              onCopyChecklist={handleCopyEnvironmentReadiness}
              onCopyEnvTemplate={handleCopyEnvironmentTemplate}
              onCopyOperatorActionPlan={handleCopyOperatorActionPlan}
              onCopyRuntimeDiagnostics={handleCopyRuntimeDiagnostics}
              onCopyRuntimeJson={handleCopyRuntimeStatusJson}
              onCopySnapshotComparison={handleCopySnapshotComparison}
              onCopySnapshots={handleCopyRuntimeSnapshots}
              onClearSnapshots={handleClearRuntimeSnapshots}
              onRefreshRuntimeStatus={refreshRuntimeReadiness}
              onSaveSnapshot={handleSaveRuntimeSnapshot}
              runtimeState={runtimeReadiness}
              snapshots={runtimeSnapshots}
            />
          </div>
        </Panel>

        {notice ? (
          <div
            className="rounded-md border border-line bg-panel-strong px-4 py-3 text-sm text-soft"
            role="status"
          >
            {notice}
          </div>
        ) : null}

        {manualCopy ? (
          <DataManualCopyPanel
            copy={manualCopy}
            onClose={() => setManualCopy(null)}
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel>
            <PanelHeader
              title="내보내기"
              description="현재 워크스페이스를 버전이 있는 JSON 백업으로 생성합니다."
            />
            <div className="space-y-4 px-5 py-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className={primaryButtonClass}
                  onClick={handleGenerateBackup}
                >
                  백업 JSON 생성
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={!exportJson}
                  onClick={handleCopyBackup}
                >
                  복사
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={!exportJson}
                  onClick={handleDownloadBackup}
                >
                  다운로드
                </button>
              </div>

              {exportJson && backupMeta.exportedAt ? (
                <ExportActionSummary
                  counts={backupMeta.counts}
                  exportedAt={backupMeta.exportedAt}
                  fingerprint={
                    backupMeta.fingerprint ||
                    getWorkspaceBackupFingerprint(exportJson)
                  }
                  jsonLength={exportJson.trim().length}
                  onCopy={handleCopyBackup}
                  onDownload={handleDownloadBackup}
                />
              ) : null}

              <Field label="백업 JSON">
                <textarea
                  className={`${textareaClass} min-h-[34rem] font-mono text-xs`}
                  value={exportJson}
                  readOnly
                  placeholder="백업 JSON 생성 버튼을 누르면 현재 워크스페이스 데이터가 표시됩니다."
                />
              </Field>
            </div>
          </Panel>

          <Panel id="data-supabase-migration" className="scroll-mt-28">
            <PanelHeader
              title="가져오기"
              description="백업 JSON을 먼저 검증한 뒤 현재 로컬 데이터를 교체합니다."
            />
            <div className="space-y-4 px-5 py-5">
              <Field label="백업 JSON 파일">
                <input
                  type="file"
                  accept="application/json,.json"
                  className="block w-full rounded-md border border-dashed border-line bg-surface px-3 py-3 text-sm text-muted file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-background hover:border-accent"
                  onChange={handleImportFile}
                />
                {importFileName ? (
                  <span className="mt-2 block break-words text-xs text-muted">
                    최근 파일: {importFileName}
                  </span>
                ) : null}
              </Field>

              <Field label="백업 JSON 붙여넣기">
                <textarea
                  className={`${textareaClass} min-h-56 font-mono text-xs`}
                  value={importJson}
                  onChange={(event) => {
                    setImportJson(event.target.value);
                    setImportFileName("");
                    setParseResult(null);
                    setValidatedJson("");
                    setLastRestoredJson("");
                    setManualCopy(null);
                    setSupabaseImportApiPreflight({ status: "idle" });
                  }}
                  placeholder='{"app":"prompt-ai-studio","schemaVersion":1,...}'
                />
              </Field>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={!importJson.trim()}
                  onClick={handleValidateBackup}
                >
                  백업 검증
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center rounded-md border border-danger bg-panel-strong px-4 py-2 text-sm font-semibold text-danger transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canRestore}
                  onClick={handleRestoreBackup}
                >
                  복원 실행
                </button>
              </div>

              {parseResult?.ok === true ? (
                <ImportValidationSummary
                  backup={parseResult.backup}
                  canRestore={canRestore}
                  currentExportFingerprint={currentBackupFingerprint}
                  importSource={importFileName || "붙여넣기"}
                  rawJson={importJson}
                  restoreAlreadyApplied={restoreAlreadyApplied}
                />
              ) : null}

              {parseResult?.ok === true ? (
                <RestoreReportSummary
                  backup={parseResult.backup}
                  currentBackupFingerprint={currentBackupFingerprint}
                  importFingerprint={importBackupFingerprint}
                  importSource={importFileName || "붙여넣기"}
                  impactItems={restoreImpactItems}
                  onCopy={handleCopyRestoreReport}
                  riskItems={restoreRiskItems}
                />
              ) : null}

              {migrationMappingItems.length > 0 ? (
                <MigrationMappingSummary
                  items={migrationMappingItems}
                  onCopy={handleCopyMigrationMapping}
                />
              ) : null}

              {migrationChecklistItems.length > 0 ? (
                <MigrationChecklistSummary
                  items={migrationChecklistItems}
                  onCopy={handleCopyMigrationChecklist}
                />
              ) : null}

              {supabaseImportDryRun ? (
                <SupabaseImportDryRunSummary
                  dryRun={supabaseImportDryRun}
                  onCopy={handleCopySupabaseImportDryRun}
                />
              ) : null}

              {supabaseImportDryRun ? (
                <SupabaseReferenceReplacementGuideSummary
                  dryRun={supabaseImportDryRun}
                  onCopy={handleCopySupabaseReferenceReplacementGuide}
                />
              ) : null}

              {supabaseImportDryRun ? (
                <SupabaseImportExecutionPlanSummary
                  backupFingerprint={importBackupFingerprint}
                  dryRun={supabaseImportDryRun}
                  onCopy={handleCopySupabaseImportExecutionPlan}
                  onCopyApiAuditArtifact={
                    handleCopySupabaseImportApiAuditArtifact
                  }
                  onCopyApiPreflightReport={
                    handleCopySupabaseImportApiPreflightReport
                  }
                  onCopyContract={handleCopySupabaseImporterAdapterContract}
                  onCopyExecutionGuardChecklist={
                    handleCopySupabaseImportExecutionGuardChecklist
                  }
                  onCopyExecutionPacket={
                    handleCopySupabaseImportExecutionPacket
                  }
                  onCopyExecutionPacketManifest={
                    handleCopySupabaseImportExecutionPacketManifest
                  }
                  onCopyExecutionPacketNextAction={
                    handleCopySupabaseImportExecutionPacketNextAction
                  }
                  onCopyExecutionRequestTemplate={
                    handleCopySupabaseImportExecutionRequestTemplate
                  }
                  onCopyExecutionReadinessDecision={
                    handleCopySupabaseImportExecutionReadinessDecision
                  }
                  onCopyPostImportVerificationEvidence={
                    handleCopySupabasePostImportVerificationEvidence
                  }
                  onCopyRehearsalReport={
                    handleCopySupabaseMigrationRehearsalReport
                  }
                  onOwnerUserIdChange={handleVerificationOwnerUserIdChange}
                  onRunApiPreflight={handleRunSupabaseImportApiPreflight}
                  onWorkspaceIdChange={handleVerificationWorkspaceIdChange}
                  ownerUserId={verificationOwnerUserId}
                  preflightState={supabaseImportApiPreflight}
                  runtimeState={runtimeReadiness}
                  workspaceId={verificationWorkspaceId}
                />
              ) : null}

              {supabaseImportDryRun ? (
                <SupabaseVerificationSqlSummary
                  dryRun={supabaseImportDryRun}
                  onCopyResolved={handleCopyResolvedSupabaseVerificationSql}
                  onCopyTemplate={handleCopySupabaseVerificationSql}
                  onWorkspaceIdChange={handleVerificationWorkspaceIdChange}
                  workspaceId={verificationWorkspaceId}
                />
              ) : null}

              {supabaseImportDryRun ? (
                <SupabaseRelationshipVerificationSqlSummary
                  onCopyResolved={
                    handleCopyResolvedSupabaseRelationshipVerificationSql
                  }
                  onCopyTemplate={handleCopySupabaseRelationshipVerificationSql}
                  workspaceId={verificationWorkspaceId}
                />
              ) : null}

              {supabaseImportDryRun ? (
                <SupabasePendingIdAuditSqlSummary
                  onCopyResolved={handleCopyResolvedSupabasePendingIdAuditSql}
                  onCopyTemplate={handleCopySupabasePendingIdAuditSql}
                  workspaceId={verificationWorkspaceId}
                />
              ) : null}

              {supabaseImportDryRun ? (
                <SupabaseRlsAccessAuditSqlSummary
                  onCopyResolved={handleCopyResolvedSupabaseRlsAccessAuditSql}
                  onCopyTemplate={handleCopySupabaseRlsAccessAuditSql}
                  onOwnerUserIdChange={handleVerificationOwnerUserIdChange}
                  ownerUserId={verificationOwnerUserId}
                  workspaceId={verificationWorkspaceId}
                />
              ) : null}

              {supabaseImportDryRun ? (
                <SupabaseRlsPolicyDraftSummary
                  onCopy={handleCopySupabaseRlsPolicyDraftSql}
                />
              ) : null}

              {supabaseImportDryRun ? (
                <SupabaseRlsSmokeTestSummary
                  onCopyResolved={handleCopyResolvedSupabaseRlsSmokeTestChecklist}
                  onCopyTemplate={handleCopySupabaseRlsSmokeTestChecklist}
                  ownerUserId={verificationOwnerUserId}
                  workspaceId={verificationWorkspaceId}
                />
              ) : null}

              {supabaseImportDryRun ? (
                <SupabaseVerificationReportSummary
                  dryRun={supabaseImportDryRun}
                  onCopyResolved={handleCopyResolvedSupabaseVerificationReport}
                  onCopyTemplate={handleCopySupabaseVerificationReport}
                  ownerUserId={verificationOwnerUserId}
                  workspaceId={verificationWorkspaceId}
                />
              ) : null}

              {supabaseImportDryRun ? (
                <SupabaseMigrationHandoffPackageSummary
                  dryRun={supabaseImportDryRun}
                  onCopyResolved={
                    handleCopyResolvedSupabaseMigrationHandoffPackage
                  }
                  onCopyTemplate={handleCopySupabaseMigrationHandoffPackage}
                  ownerUserId={verificationOwnerUserId}
                  workspaceId={verificationWorkspaceId}
                />
              ) : null}

              <RestoreRiskSummary items={restoreRiskItems} />

              {restoreImpactItems.length > 0 ? (
                <RestoreImpactPreview items={restoreImpactItems} />
              ) : null}

              {parseResult?.ok === false ? (
                <div className="rounded-md border border-danger bg-surface px-4 py-3 text-sm text-danger">
                  {parseResult.error}
                </div>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
