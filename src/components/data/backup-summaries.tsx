"use client";

import Link from "next/link";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import {
  getWorkspaceBackupFingerprint,
  type WorkspaceBackupCounts,
  type WorkspaceBackup,
  type WorkspaceBackupCountChange,
} from "@/lib/storage/workspace-backup";
import { formatBackupDate, formatJsonLength } from "./data-view-shared";

export interface ReadinessItem {
  label: string;
  description: string;
  ready: boolean;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
}

export interface RestoreImpactItem {
  label: string;
  current: string | number;
  incoming: string | number;
}

export interface RestoreRiskItem {
  label: string;
  description: string;
}

export interface RestoreReportParams {
  backup: WorkspaceBackup;
  currentBackupFingerprint?: string;
  importFingerprint: string;
  importSource: string;
  impactItems: RestoreImpactItem[];
  riskItems: RestoreRiskItem[];
}

export interface ImportValidationSummaryProps {
  backup: WorkspaceBackup;
  canRestore: boolean;
  currentExportFingerprint?: string;
  importSource: string;
  rawJson: string;
  restoreAlreadyApplied: boolean;
}

export interface ExportActionSummaryProps {
  counts: WorkspaceBackupCounts;
  exportedAt: string;
  fingerprint: string;
  jsonLength: number;
  onCopy: () => void;
  onDownload: () => void;
}

export interface RestoreReportSummaryProps extends RestoreReportParams {
  onCopy: () => void;
}

export function buildBackupManualCopyText({
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

export function buildRestoreReportManualCopyText({
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

export function ExportActionSummary({
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

export function CountGrid({ counts }: { counts: WorkspaceBackupCounts }) {
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

export function ImportValidationSummary({
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

export function formatChange(current: string | number, incoming: string | number) {
  if (typeof current === "number" && typeof incoming === "number") {
    const diff = incoming - current;

    if (diff > 0) {
      return `+${diff}`;
    }

    return String(diff);
  }

  return current === incoming ? "동일" : "변경";
}

export function getRestoreRiskItems(items: RestoreImpactItem[]): RestoreRiskItem[] {
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

export function buildRestoreConfirmMessage({
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

export function buildRestoreReportText({
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

export function RestoreRiskSummary({ items }: { items: RestoreRiskItem[] }) {
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

export function RestoreReportSummary({
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

export function BackupUpdateSummary({
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

export function getReadinessStage(score: number) {
  if (score >= 80) {
    return "마이그레이션 후보";
  }

  if (score >= 50) {
    return "로컬 운영 중";
  }

  return "기초 설정 필요";
}

export function ReadinessChecklist({ items }: { items: ReadinessItem[] }) {
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

export function RestoreImpactPreview({ items }: { items: RestoreImpactItem[] }) {
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
