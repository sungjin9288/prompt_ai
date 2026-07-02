"use client";

import Link from "next/link";
import {
  Panel,
  PanelHeader,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import type { CompanyProfile, UserProfile } from "@/lib/prompt";
import {
  learningOpsPriorityLabel,
  type LearningOpsAction,
} from "@/lib/dashboard/learning-memory";
import type {
  CopyStatus,
  DashboardManualCopy,
  LabeledCopyStatus,
} from "./dashboard-view-types";

export interface DashboardPersonalizationPanelProps {
  userProfile: UserProfile;
  companyProfile: CompanyProfile;
  profileCompletion: number;
  companyCompletion: number;
  userMemoryCount: number;
  companyMemoryCount: number;
  dataReadinessScore: number;
  personalizationActions: LearningOpsAction[];
  personalizationActionCopyStatus: LabeledCopyStatus | null;
  personalizationReportCopyStatus: CopyStatus;
  personalizationManualCopy: DashboardManualCopy | null;
  openPersonalizationActionInStudio: (
    action: LearningOpsAction,
    fallbackTarget?: "personalization" | "next-action-queue",
  ) => void;
  copyPersonalizationActionReport: (action: LearningOpsAction) => Promise<void>;
  copyPersonalizationReport: () => Promise<void>;
  openPersonalizationReportInStudio: () => void;
  setPersonalizationManualCopy: (value: DashboardManualCopy | null) => void;
}

export function DashboardPersonalizationPanel({
  userProfile,
  companyProfile,
  profileCompletion,
  companyCompletion,
  userMemoryCount,
  companyMemoryCount,
  dataReadinessScore,
  personalizationActions,
  personalizationActionCopyStatus,
  personalizationReportCopyStatus,
  personalizationManualCopy,
  openPersonalizationActionInStudio,
  copyPersonalizationActionReport,
  copyPersonalizationReport,
  openPersonalizationReportInStudio,
  setPersonalizationManualCopy,
}: DashboardPersonalizationPanelProps) {
  return (
          <Panel>
            <PanelHeader
              title="개인화 기준"
              description="프로필, 회사 기준, 학습 메모리 반영 상태를 바로 점검합니다."
            />
            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-3">
                <div className="rounded-md border border-line bg-surface px-4 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-soft">개인 프로필</span>
                    <span className="font-mono text-accent">
                      {profileCompletion}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-panel">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>사용자 메모리 {userMemoryCount}개</span>
                    <span>역할 {userProfile.role || "미설정"}</span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link
                      href="/profile?returnTo=/"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      개인 기준 편집
                    </Link>
                    <Link
                      href="/learning?scope=user"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      사용자 메모리
                    </Link>
                  </div>
                </div>

                <div className="rounded-md border border-line bg-surface px-4 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-soft">회사 프로필</span>
                    <span className="font-mono text-attention">
                      {companyCompletion}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-panel">
                    <div
                      className="h-full bg-attention"
                      style={{ width: `${companyCompletion}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>회사 메모리 {companyMemoryCount}개</span>
                    <span>회사 {companyProfile.companyName || "미설정"}</span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <Link
                      href="/company?returnTo=/"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      회사 기준 편집
                    </Link>
                    <Link
                      href="/learning?scope=company"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      회사 메모리
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-line bg-surface px-4 py-4">
                <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-soft">
                      개인화 보강 큐
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      다음 생성 품질에 바로 영향을 주는 기준부터 정리합니다.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-accent">
                    {personalizationActions.length}
                  </span>
                </div>
                <div className="grid gap-2">
                  {personalizationActions.map((item) => (
                    <div
                      key={`${item.label}-${item.href}`}
                      className="rounded-md border border-line bg-panel px-3 py-3"
                    >
                      <Link
                        href={item.href}
                        className="block transition hover:text-accent"
                      >
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-xs font-semibold text-soft">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted">
                              {item.description}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs ${
                              item.priority === "high"
                                ? "text-accent"
                                : item.priority === "medium"
                                  ? "text-soft"
                                  : "text-muted"
                            }`}
                          >
                            {learningOpsPriorityLabel(item.priority)}
                          </span>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={() => openPersonalizationActionInStudio(item)}
                        data-testid="dashboard-personalization-action-studio"
                        className={`${secondaryButtonClass} mt-3 min-h-9 w-full px-3 py-1.5 text-xs`}
                      >
                        조치 Studio로 보내기
                      </button>
                      <button
                        type="button"
                        onClick={() => copyPersonalizationActionReport(item)}
                        data-testid="dashboard-personalization-action-copy"
                        className={`${secondaryButtonClass} mt-2 min-h-9 w-full px-3 py-1.5 text-xs`}
                      >
                        {personalizationActionCopyStatus?.label === item.label
                          ? personalizationActionCopyStatus.status === "copied"
                            ? "조치 복사됨"
                            : "조치 복사 실패"
                          : "조치 복사"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-line bg-surface px-4 py-4">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-soft">
                      개인화 기준 리포트
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted">
                      개인/회사 기준, 학습 scope, 다음 보강 액션을 Markdown으로
                      내보냅니다.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-accent">
                    {dataReadinessScore}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyPersonalizationReport}
                  data-testid="dashboard-personalization-report-copy"
                  className={`${secondaryButtonClass} mt-4 w-full`}
                >
                  {personalizationReportCopyStatus === "copied"
                    ? "개인화 리포트 복사됨"
                    : personalizationReportCopyStatus === "failed"
                      ? "개인화 리포트 복사 실패"
                      : "개인화 리포트 복사"}
                </button>
                <button
                  type="button"
                  onClick={openPersonalizationReportInStudio}
                  data-testid="dashboard-personalization-report-studio"
                  className={`${secondaryButtonClass} mt-2 w-full`}
                >
                  리포트 Studio로 보내기
                </button>
                {personalizationManualCopy ? (
                  <ManualCopyPanel
                    copy={personalizationManualCopy}
                    onClose={() => setPersonalizationManualCopy(null)}
                    className="mt-4 bg-panel"
                    height="h-36"
                    textareaBackground="bg-surface"
                    ariaLabel="수동 복사용 개인화 기준 리포트"
                  />
                ) : null}
              </div>

              <Link href="/skills" className={`${primaryButtonClass} w-full`}>
                스킬 빌더 열기
              </Link>
            </div>
          </Panel>
  );
}
