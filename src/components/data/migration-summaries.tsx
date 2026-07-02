"use client";

import { secondaryButtonClass } from "@/components/ui";
import { type WorkspaceBackup } from "@/lib/storage/workspace-backup";
import { type RestoreRiskItem } from "./backup-summaries";
import { formatJsonLength } from "./data-view-shared";

export interface MigrationMappingItem {
  table: string;
  source: string;
  records: number;
  status: "ready" | "needs-context" | "future";
  note: string;
}

export interface MigrationChecklistItem {
  label: string;
  status: "ready" | "blocked" | "manual";
  detail: string;
}

export interface MigrationMappingSummaryProps {
  items: MigrationMappingItem[];
  onCopy: () => void;
}

export interface MigrationChecklistSummaryProps {
  items: MigrationChecklistItem[];
  onCopy: () => void;
}

export function getMigrationMappingItems(backup: WorkspaceBackup): MigrationMappingItem[] {
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

export function getMigrationStatusLabel(status: MigrationMappingItem["status"]) {
  if (status === "ready") {
    return "매핑 가능";
  }

  if (status === "needs-context") {
    return "컨텍스트 필요";
  }

  return "추후";
}

export function getChecklistStatusLabel(status: MigrationChecklistItem["status"]) {
  if (status === "ready") {
    return "준비됨";
  }

  if (status === "blocked") {
    return "결정 필요";
  }

  return "수동 확인";
}

export function buildMigrationMappingText(items: MigrationMappingItem[]) {
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

export function buildMigrationMappingManualCopyText({
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

export function getMigrationChecklistItems({
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

export function buildMigrationChecklistText(items: MigrationChecklistItem[]) {
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

export function buildMigrationChecklistManualCopyText({
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

export function MigrationChecklistSummary({
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

export function MigrationMappingSummary({
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
