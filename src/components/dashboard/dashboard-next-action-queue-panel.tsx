"use client";

import Link from "next/link";
import { Panel, PanelHeader, secondaryButtonClass } from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import {
  learningOpsPriorityLabel,
  type LearningOpsAction,
} from "@/lib/dashboard/learning-memory";
import {
  type DashboardNextActionQueueItem,
  type DashboardNextActionQueuePriorityCounts,
  type DashboardNextActionQueueCategoryCounts,
  dashboardNextActionQueueVerificationChecklist,
} from "@/lib/dashboard/next-action-queue";
import type {
  CopyStatus,
  DashboardManualCopy,
  KeyedCopyStatus,
  LabeledCopyStatus,
} from "./dashboard-view-types";

interface DashboardNextActionQueueWorkflowStep {
  detail: string;
  label: string;
  step: string;
  title: string;
}

export interface DashboardNextActionQueuePanelProps {
  dashboardNextActionQueue: DashboardNextActionQueueItem[];
  dashboardNextActionQueuePriorityCounts: DashboardNextActionQueuePriorityCounts;
  dashboardNextActionQueueCategoryCounts: DashboardNextActionQueueCategoryCounts;
  dashboardNextActionQueueFirstAction: DashboardNextActionQueueItem | null;
  dashboardNextActionQueueWorkflowSteps: DashboardNextActionQueueWorkflowStep[];
  dashboardNextActionQueueLinkCopyStatus: KeyedCopyStatus | null;
  dashboardNextActionQueueReportCopyStatus: CopyStatus;
  dashboardNextActionQueueLinksCopyStatus: CopyStatus;
  dashboardNextActionQueueVerificationCopyStatus: CopyStatus;
  dashboardNextActionQueueManualCopy: DashboardManualCopy | null;
  personalizationActionCopyStatus: LabeledCopyStatus | null;
  learningOpsActionCopyStatus: LabeledCopyStatus | null;
  copyDashboardNextActionQueueItemLink: (
    item: DashboardNextActionQueueItem,
  ) => Promise<void>;
  copyDashboardNextActionQueueItemReport: (
    item: DashboardNextActionQueueItem,
  ) => Promise<void>;
  copyDashboardNextActionQueueReport: () => Promise<void>;
  copyDashboardNextActionQueueLinks: () => Promise<void>;
  copyDashboardNextActionQueueVerificationChecklist: () => Promise<void>;
  openDashboardNextActionQueueInStudio: () => void;
  openDashboardNextActionQueueVerificationInStudio: () => void;
  openPersonalizationActionInStudio: (
    action: LearningOpsAction,
    fallbackTarget?: "personalization" | "next-action-queue",
  ) => void;
  openLearningOpsActionInStudio: (
    action: LearningOpsAction,
    fallbackTarget: "learning" | "next-action-queue",
  ) => void;
  setDashboardNextActionQueueManualCopy: (value: DashboardManualCopy | null) => void;
}

export function DashboardNextActionQueuePanel({
  dashboardNextActionQueue,
  dashboardNextActionQueuePriorityCounts,
  dashboardNextActionQueueCategoryCounts,
  dashboardNextActionQueueFirstAction,
  dashboardNextActionQueueWorkflowSteps,
  dashboardNextActionQueueLinkCopyStatus,
  dashboardNextActionQueueReportCopyStatus,
  dashboardNextActionQueueLinksCopyStatus,
  dashboardNextActionQueueVerificationCopyStatus,
  dashboardNextActionQueueManualCopy,
  personalizationActionCopyStatus,
  learningOpsActionCopyStatus,
  copyDashboardNextActionQueueItemLink,
  copyDashboardNextActionQueueItemReport,
  copyDashboardNextActionQueueReport,
  copyDashboardNextActionQueueLinks,
  copyDashboardNextActionQueueVerificationChecklist,
  openDashboardNextActionQueueInStudio,
  openDashboardNextActionQueueVerificationInStudio,
  openPersonalizationActionInStudio,
  openLearningOpsActionInStudio,
  setDashboardNextActionQueueManualCopy,
}: DashboardNextActionQueuePanelProps) {
  return (
      <Panel className="mt-4">
        <PanelHeader
          title="다음 실행 큐"
          description="개인화와 학습 기준 중 지금 처리할 일을 우선순위로 묶었습니다."
        />
        <div
          className="grid gap-0 divide-y divide-line lg:grid-cols-[260px_1fr] lg:divide-x lg:divide-y-0"
          data-testid="dashboard-next-action-queue"
        >
          <div className="px-5 py-5">
            <p className="text-sm font-semibold text-soft">현재 우선순위</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-accent">
              {dashboardNextActionQueue.length}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-md border border-line bg-surface px-2 py-2">
                <p className="font-mono text-sm font-semibold text-accent">
                  {dashboardNextActionQueuePriorityCounts.high}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted">
                  High
                </p>
              </div>
              <div className="rounded-md border border-line bg-surface px-2 py-2">
                <p className="font-mono text-sm font-semibold text-soft">
                  {dashboardNextActionQueuePriorityCounts.medium}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted">
                  Med
                </p>
              </div>
              <div className="rounded-md border border-line bg-surface px-2 py-2">
                <p className="font-mono text-sm font-semibold text-muted">
                  {dashboardNextActionQueuePriorityCounts.low}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted">
                  Low
                </p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-md border border-line bg-surface px-2 py-2">
                <p className="font-mono text-sm font-semibold text-soft">
                  {dashboardNextActionQueueCategoryCounts.personalization}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted">
                  개인화
                </p>
              </div>
              <div className="rounded-md border border-line bg-surface px-2 py-2">
                <p className="font-mono text-sm font-semibold text-soft">
                  {dashboardNextActionQueueCategoryCounts.learning}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-muted">
                  학습
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              High 항목을 먼저 처리하고, 완료 후 Studio에서 새 프롬프트를 생성해
              품질 변화를 확인합니다.
            </p>
            <div
              data-testid="dashboard-next-action-workflow"
              className="mt-3 grid gap-2"
            >
              {dashboardNextActionQueueWorkflowSteps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-md border border-line bg-surface px-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] font-semibold text-accent">
                      {item.step}
                    </span>
                    <p className="text-xs font-semibold text-muted">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-2 break-words text-xs font-semibold text-soft">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
            {dashboardNextActionQueueFirstAction ? (
              <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                  첫 실행
                </p>
                <p className="mt-1 break-words text-xs font-semibold text-soft">
                  {`[${learningOpsPriorityLabel(
                    dashboardNextActionQueueFirstAction.priority,
                  )}] ${dashboardNextActionQueueFirstAction.categoryLabel} · ${
                    dashboardNextActionQueueFirstAction.label
                  }`}
                </p>
                <div className="mt-3 grid gap-2">
                  <Link
                    href={dashboardNextActionQueueFirstAction.href}
                    data-testid="dashboard-next-action-first-open"
                    className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                  >
                    첫 실행 열기
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      copyDashboardNextActionQueueItemLink(
                        dashboardNextActionQueueFirstAction,
                      )
                    }
                    data-testid="dashboard-next-action-first-link-copy"
                    className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                  >
                    {dashboardNextActionQueueLinkCopyStatus?.key ===
                      dashboardNextActionQueueFirstAction.actionKey &&
                    dashboardNextActionQueueLinkCopyStatus.status === "copied"
                      ? "첫 실행 링크 복사됨"
                      : dashboardNextActionQueueLinkCopyStatus?.key ===
                            dashboardNextActionQueueFirstAction.actionKey &&
                          dashboardNextActionQueueLinkCopyStatus.status ===
                            "failed"
                        ? "첫 실행 링크 실패"
                        : "첫 실행 링크 복사"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dashboardNextActionQueueFirstAction.category ===
                      "personalization"
                        ? openPersonalizationActionInStudio(
                            dashboardNextActionQueueFirstAction,
                            "next-action-queue",
                          )
                        : openLearningOpsActionInStudio(
                            dashboardNextActionQueueFirstAction,
                            "next-action-queue",
                          )
                    }
                    data-testid="dashboard-next-action-first-studio"
                    className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                  >
                    첫 실행 Studio로
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyDashboardNextActionQueueItemReport(
                        dashboardNextActionQueueFirstAction,
                      )
                    }
                    data-testid="dashboard-next-action-first-report-copy"
                    className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                  >
                    {dashboardNextActionQueueFirstAction.category ===
                      "personalization" &&
                    personalizationActionCopyStatus?.label ===
                      dashboardNextActionQueueFirstAction.label &&
                    personalizationActionCopyStatus.status === "copied"
                      ? "첫 실행 리포트 복사됨"
                      : dashboardNextActionQueueFirstAction.category ===
                            "personalization" &&
                          personalizationActionCopyStatus?.label ===
                            dashboardNextActionQueueFirstAction.label &&
                          personalizationActionCopyStatus.status === "failed"
                        ? "첫 실행 리포트 실패"
                        : dashboardNextActionQueueFirstAction.category ===
                              "learning" &&
                            learningOpsActionCopyStatus?.label ===
                              dashboardNextActionQueueFirstAction.label &&
                            learningOpsActionCopyStatus.status === "copied"
                          ? "첫 실행 리포트 복사됨"
                          : dashboardNextActionQueueFirstAction.category ===
                                "learning" &&
                              learningOpsActionCopyStatus?.label ===
                                dashboardNextActionQueueFirstAction.label &&
                              learningOpsActionCopyStatus.status === "failed"
                            ? "첫 실행 리포트 실패"
                            : "첫 실행 리포트 복사"}
                  </button>
                </div>
              </div>
            ) : null}
            <div className="mt-3 rounded-md border border-line bg-surface px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                완료 확인
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
                {dashboardNextActionQueueVerificationChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copyDashboardNextActionQueueVerificationChecklist}
                  data-testid="dashboard-next-action-queue-verification-copy"
                  className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                >
                  {dashboardNextActionQueueVerificationCopyStatus === "copied"
                    ? "완료 확인 복사됨"
                    : dashboardNextActionQueueVerificationCopyStatus === "failed"
                      ? "완료 확인 복사 실패"
                      : "완료 확인 복사"}
                </button>
                <button
                  type="button"
                  onClick={openDashboardNextActionQueueVerificationInStudio}
                  data-testid="dashboard-next-action-queue-verification-studio"
                  className={`${secondaryButtonClass} min-h-8 px-3 py-1.5 text-xs`}
                >
                  완료 확인 Studio로
                </button>
              </div>
            </div>
            <Link href="/learning" className={`${secondaryButtonClass} mt-4 w-full`}>
              Learning 전체 보기
            </Link>
            <div className="mt-2 grid gap-2">
              <button
                type="button"
                onClick={copyDashboardNextActionQueueReport}
                data-testid="dashboard-next-action-queue-report-copy"
                className={`${secondaryButtonClass} w-full`}
              >
                  {dashboardNextActionQueueReportCopyStatus === "copied"
                    ? "큐 리포트 복사됨"
                    : dashboardNextActionQueueReportCopyStatus === "failed"
                      ? "큐 리포트 복사 실패"
                      : "큐 리포트 복사"}
              </button>
              <button
                type="button"
                onClick={copyDashboardNextActionQueueLinks}
                data-testid="dashboard-next-action-queue-links-copy"
                className={`${secondaryButtonClass} w-full`}
              >
                {dashboardNextActionQueueLinksCopyStatus === "copied"
                  ? "큐 링크 복사됨"
                  : dashboardNextActionQueueLinksCopyStatus === "failed"
                    ? "큐 링크 복사 실패"
                    : "큐 링크 목록 복사"}
              </button>
              <button
                type="button"
                onClick={openDashboardNextActionQueueInStudio}
                data-testid="dashboard-next-action-queue-studio"
                className={`${secondaryButtonClass} w-full`}
              >
                큐 Studio로 보내기
              </button>
            </div>
          </div>
          <div className="divide-y divide-line">
            {dashboardNextActionQueue.map((item) => {
              const copyStatus =
                item.category === "personalization"
                  ? personalizationActionCopyStatus?.label === item.label
                    ? personalizationActionCopyStatus.status
                    : null
                  : learningOpsActionCopyStatus?.label === item.label
                    ? learningOpsActionCopyStatus.status
                    : null;
              const linkCopyStatus =
                dashboardNextActionQueueLinkCopyStatus?.key === item.actionKey
                  ? dashboardNextActionQueueLinkCopyStatus.status
                  : null;

              return (
                <div
                  key={item.actionKey}
                  className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold text-muted">
                        {item.categoryLabel}
                      </span>
                      <span
                        className={`rounded-md border border-line bg-surface px-2 py-1 font-mono text-xs ${
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
                    <Link
                      href={item.href}
                      className="mt-2 block transition hover:text-accent"
                    >
                      <p className="break-words text-sm font-semibold">
                        {item.label}
                      </p>
                      <p className="mt-1 break-words text-xs leading-5 text-muted">
                        {item.description}
                      </p>
                    </Link>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[480px] lg:grid-cols-4">
                    <Link
                      href={item.href}
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      바로 열기
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        item.category === "personalization"
                          ? openPersonalizationActionInStudio(
                              item,
                              "next-action-queue",
                            )
                          : openLearningOpsActionInStudio(
                              item,
                              "next-action-queue",
                            )
                      }
                      data-testid="dashboard-next-action-studio"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      Studio로
                    </button>
                    <button
                      type="button"
                      onClick={() => copyDashboardNextActionQueueItemLink(item)}
                      data-testid="dashboard-next-action-link-copy"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      {linkCopyStatus === "copied"
                        ? "링크 복사됨"
                        : linkCopyStatus === "failed"
                          ? "복사 실패"
                          : "링크 복사"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyDashboardNextActionQueueItemReport(item)}
                      data-testid="dashboard-next-action-copy"
                      className={`${secondaryButtonClass} min-h-9 px-3 py-1.5 text-xs`}
                    >
                      {copyStatus === "copied"
                        ? "복사됨"
                        : copyStatus === "failed"
                          ? "복사 실패"
                          : "리포트 복사"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {dashboardNextActionQueueManualCopy ? (
          <div className="border-t border-line px-5 py-4">
            <ManualCopyPanel
              copy={dashboardNextActionQueueManualCopy}
              onClose={() => setDashboardNextActionQueueManualCopy(null)}
              height="h-36"
              ariaLabel="수동 복사용 Dashboard 다음 실행 큐 리포트"
            />
          </div>
        ) : null}
      </Panel>
  );
}
