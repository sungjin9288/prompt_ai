"use client";

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
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import {
  ContextOperatingFlow,
  type ContextOperatingFlowItem,
} from "@/components/context/context-operating-flow";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
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
  addEnvironmentRuntimeSnapshot,
  buildEnvironmentExampleText,
  buildEnvironmentOperatorActionPlanText,
  buildEnvironmentReadinessText,
  buildEnvironmentRuntimeSnapshotComparisonText,
  buildEnvironmentRuntimeDiagnosticsText,
  buildEnvironmentRuntimeSnapshotsJson,
  buildEnvironmentRuntimeStatusJson,
  type EnvironmentRuntimeStatus,
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
  getSupabaseImportExecutionPacketManifestItems,
} from "@/lib/data/supabase-import-execution-packet-manifest";
import {
  getSupabaseImportPreflightScopeError as getSupabaseImportPreflightScopeErrorText,
  getSupabaseImportPreflightScopeStatus,
} from "@/lib/data/supabase-import-preflight-scope";
import {
  buildSupabaseImportDryRunText,
  createSupabaseImportDryRun,
  isSupabaseWorkspaceUuid,
} from "@/lib/data/supabase-import-dry-run";
import {
  buildSupabaseImportPendingIdAuditSql,
  buildSupabaseImportReferenceReplacementGuideText,
  buildSupabaseImportRelationshipVerificationSql,
  buildSupabaseImportVerificationSql,
} from "@/lib/data/supabase-import-verification-sql";
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
  createWorkspaceBackup,
  createWorkspaceBackupMeta,
  getWorkspaceBackupCountChanges,
  getWorkspaceBackupFingerprint,
  isWorkspaceBackupMetaCurrent,
  parseWorkspaceBackup,
  restoreWorkspaceBackup,
  serializeWorkspaceBackup,
  summarizeWorkspaceBackupData,
  type WorkspaceBackupData,
  type WorkspaceBackup,
  type WorkspaceBackupParseResult,
} from "@/lib/storage/workspace-backup";
import { writeStudioDraft } from "@/lib/studio/draft";
import {
  BackupUpdateSummary,
  buildBackupManualCopyText,
  buildRestoreConfirmMessage,
  buildRestoreReportManualCopyText,
  buildRestoreReportText,
  CountGrid,
  ExportActionSummary,
  getReadinessStage,
  getRestoreRiskItems,
  ImportValidationSummary,
  ReadinessChecklist,
  RestoreImpactPreview,
  RestoreReportSummary,
  RestoreRiskSummary,
  type ReadinessItem,
  type RestoreImpactItem,
} from "./backup-summaries";
import {
  formatBackupDate,
  formatReleaseGateStage,
  supabaseImportExecutionPacketSectionCount,
} from "./data-view-shared";
import {
  buildDocumentRagIngestionPacketManualCopyText,
  buildDocumentRagIngestionPacketText,
  buildDocumentRagReadinessManualCopyText,
  buildDocumentRagReadinessText,
  buildDocumentRagStudioDraftInput,
  createDocumentRagChunks,
  documentRagReadinessItems,
  DocumentRagReadinessSummary,
} from "./document-rag-summaries";
import {
  buildEnvironmentReadinessManualCopyText,
  buildEnvironmentTemplateManualCopyText,
  buildOperatorActionPlanManualCopyText,
  buildRuntimeDiagnosticsManualCopyText,
  buildRuntimeSnapshotComparisonManualCopyText,
  buildRuntimeSnapshotsManualCopyText,
  buildRuntimeStatusManualCopyText,
} from "./environment-report-text";
import {
  buildMigrationChecklistManualCopyText,
  buildMigrationChecklistText,
  buildMigrationMappingManualCopyText,
  buildMigrationMappingText,
  getMigrationChecklistItems,
  getMigrationMappingItems,
  MigrationChecklistSummary,
  MigrationMappingSummary,
} from "./migration-summaries";
import {
  EnvironmentReadinessSummary,
  type RuntimeReadinessState,
} from "./readiness-summaries";
import {
  buildSupabaseImportDryRunManualCopyText,
  buildSupabaseReferenceReplacementGuideManualCopyText,
  SupabaseImportDryRunSummary,
  SupabaseReferenceReplacementGuideSummary,
} from "./supabase-dry-run-summaries";
import {
  buildSupabaseImportExecutionGuardChecklistManualCopyText,
  buildSupabaseImportExecutionGuardChecklistText,
  buildSupabaseImportExecutionPacketManifestManualCopyText,
  buildSupabaseImportExecutionPacketManualCopyText,
  buildSupabaseImportExecutionPacketNextActionManualCopyText,
  buildSupabaseImportExecutionPacketText,
  buildSupabaseImportExecutionRequestTemplateManualCopyText,
  buildSupabaseImportExecutionRequestTemplateText,
} from "./supabase-execution-packet-text";
import {
  buildSupabaseImportExecutionPlanManualCopyText,
  getSupabaseImportExecutionPacketRuntimeState,
  SupabaseImportExecutionPlanSummary,
} from "./supabase-execution-plan-summary";
import {
  buildSupabaseImportApiAuditArtifactManualCopyText,
  buildSupabaseImportApiPreflightReportManualCopyText,
  buildSupabaseImportApiPreflightReportText,
  buildSupabaseImporterAdapterContractManualCopyText,
  type SupabaseImportApiPreflightResponse,
  type SupabaseImportApiPreflightState,
} from "./supabase-preflight-report-text";
import {
  buildSupabaseImportExecutionReadinessDecisionManualCopyText,
  buildSupabaseImportExecutionReadinessDecisionText,
  buildSupabaseMigrationRehearsalReportManualCopyText,
  buildSupabaseMigrationRehearsalReportText,
  buildSupabasePostImportVerificationEvidenceManualCopyText,
  buildSupabasePostImportVerificationEvidenceText,
} from "./supabase-rehearsal-report-text";
import {
  buildSupabaseMigrationHandoffPackageManualCopyText,
  buildSupabaseRlsAccessAuditSqlManualCopyText,
  buildSupabaseRlsPolicyDraftSqlManualCopyText,
  buildSupabaseRlsSmokeTestChecklistManualCopyText,
  buildSupabaseVerificationReportManualCopyText,
  SupabaseMigrationHandoffPackageSummary,
  SupabaseRlsAccessAuditSqlSummary,
  SupabaseRlsPolicyDraftSummary,
  SupabaseRlsSmokeTestSummary,
  SupabaseVerificationReportSummary,
} from "./supabase-rls-summaries";
import {
  buildSupabaseImportVerificationSqlManualCopyText,
  buildSupabasePendingIdAuditSqlManualCopyText,
  buildSupabaseRelationshipVerificationSqlManualCopyText,
  SupabasePendingIdAuditSqlSummary,
  SupabaseRelationshipVerificationSqlSummary,
  SupabaseVerificationSqlSummary,
} from "./supabase-sql-summaries";

interface DataManualCopy {
  id?: string;
  title: string;
  body: string;
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

function getManualCopyTitle(successNotice: string) {
  return successNotice
    .replace(/(을|를) 클립보드에 복사했습니다\.$/, "")
    .replace(/(을|를) 복사했습니다\.$/, "")
    .replace(/복사했습니다\.$/, "")
    .trim();
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
        id: "document-rag-studio",
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
          <ManualCopyPanel
            copy={manualCopy}
            onClose={() => setManualCopy(null)}
            testId={
              manualCopy.id ? `data-manual-copy-${manualCopy.id}` : undefined
            }
            textareaClassName={`${textareaClass} mt-3 h-52 font-mono text-xs leading-5`}
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
