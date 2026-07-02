"use client";

import Link from "next/link";
import { Panel, PanelHeader, secondaryButtonClass } from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import type { SkillRunStats } from "@/lib/skills/skill-runner";
import { formatTimestamp } from "@/lib/dashboard/shared";
import { buildPromptLibraryHref, buildSkillHref } from "@/lib/dashboard/hrefs";
import type {
  CopyStatus,
  DashboardManualCopy,
  KeyedCopyStatus,
} from "./dashboard-view-types";

export interface DashboardSkillOpsPanelProps {
  skillRunStats: SkillRunStats;
  skillOpsLatestRunLinkCopyStatus: CopyStatus;
  skillOpsSkillLinkCopyStatus: KeyedCopyStatus | null;
  skillOpsReportCopyStatus: CopyStatus;
  skillOpsManualCopy: DashboardManualCopy | null;
  copySkillOpsLatestRunLink: () => Promise<void>;
  copySkillOpsSkillLink: (input: {
    key: string;
    skillId: string;
    title: string;
  }) => Promise<void>;
  copySkillOpsReport: () => Promise<void>;
  openSkillOpsReportInStudio: () => void;
  setSkillOpsManualCopy: (value: DashboardManualCopy | null) => void;
}

export function DashboardSkillOpsPanel({
  skillRunStats,
  skillOpsLatestRunLinkCopyStatus,
  skillOpsSkillLinkCopyStatus,
  skillOpsReportCopyStatus,
  skillOpsManualCopy,
  copySkillOpsLatestRunLink,
  copySkillOpsSkillLink,
  copySkillOpsReport,
  openSkillOpsReportInStudio,
  setSkillOpsManualCopy,
}: DashboardSkillOpsPanelProps) {
  return (
          <Panel>
            <PanelHeader
              title="스킬 실행 현황"
              description="실제로 반복 사용된 스킬과 최근 실행 기록입니다."
            />
            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted">활성 스킬</p>
                  <p className="mt-1 font-mono text-2xl font-semibold">
                    {skillRunStats.activeSkills}
                  </p>
                </div>
                <div>
                  <p className="text-muted">최근 실행</p>
                  <p className="mt-2 text-xs font-medium">
                    {formatTimestamp(skillRunStats.latestRun?.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted">피드백</p>
                  <p className="mt-1 font-mono text-2xl font-semibold">
                    {skillRunStats.feedbackCount}
                  </p>
                </div>
              </div>

              {skillRunStats.latestRun ? (
                <div className="rounded-md border border-line bg-surface px-3 py-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-soft">최근 실행</p>
                      <p className="mt-1 line-clamp-2 text-sm font-semibold text-soft">
                        {skillRunStats.latestRun.title}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-muted">
                        {formatTimestamp(skillRunStats.latestRun.createdAt)} · 품질{" "}
                        {skillRunStats.latestRun.versions[0]?.qualityScore.toFixed(
                          1,
                        ) ?? "-"}{" "}
                        · 피드백 {skillRunStats.latestRun.feedback.length}개
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link
                        href={buildPromptLibraryHref(skillRunStats.latestRun)}
                        className={`${secondaryButtonClass} w-full sm:w-auto`}
                      >
                        Library 실행 보기
                      </Link>
                      <button
                        type="button"
                        onClick={copySkillOpsLatestRunLink}
                        className={`${secondaryButtonClass} w-full sm:w-auto`}
                        data-testid="dashboard-skill-latest-run-link-copy"
                      >
                        {skillOpsLatestRunLinkCopyStatus === "copied"
                          ? "실행 링크 복사됨"
                          : skillOpsLatestRunLinkCopyStatus === "failed"
                            ? "실행 링크 복사 실패"
                            : "실행 링크 복사"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="divide-y divide-line">
                {skillRunStats.topSkills.map((item) => {
                  const skillLinkKey = `top-${item.skill.id}`;
                  const skillLinkStatus =
                    skillOpsSkillLinkCopyStatus?.key === skillLinkKey
                      ? skillOpsSkillLinkCopyStatus.status
                      : null;

                  return (
                    <div
                      key={item.skill.id}
                      className="grid gap-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {item.skill.name}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {item.skill.domain} · 최근{" "}
                          {formatTimestamp(item.latestRunAt)}
                        </p>
                        <p className="mt-2 font-mono text-xs text-accent sm:hidden">
                          {item.runCount}회 실행 · 성공률{" "}
                          {item.feedbackCount ? `${item.successRate}%` : "미평가"}
                        </p>
                      </div>
                      <div className="grid gap-2 sm:min-w-40">
                        <div className="hidden text-left sm:block sm:text-right">
                          <p className="font-mono text-sm text-accent">
                            {item.runCount}회 실행
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            성공률{" "}
                            {item.feedbackCount
                              ? `${item.successRate}%`
                              : "미평가"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={buildSkillHref(item.skill.id)}
                            className={`${secondaryButtonClass} px-3 py-2 text-xs`}
                          >
                            Skills 보기
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              copySkillOpsSkillLink({
                                key: skillLinkKey,
                                skillId: item.skill.id,
                                title: "반복 사용 상위 스킬 링크",
                              })
                            }
                            className={`${secondaryButtonClass} px-3 py-2 text-xs`}
                            data-testid="dashboard-skill-top-link-copy"
                          >
                            {skillLinkStatus === "copied"
                              ? "링크 복사됨"
                              : skillLinkStatus === "failed"
                                ? "복사 실패"
                                : "링크 복사"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {skillRunStats.topSkills.length === 0 ? (
                  <div className="py-6 text-sm leading-6 text-muted">
                    아직 실행 이력이 없습니다. Skills에서 스킬을 실행하고 Library에
                    저장하면 이곳에 집계됩니다.
                  </div>
                ) : null}
              </div>

              <div className="border-t border-line pt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <p className="font-semibold">개선 대기</p>
                  <p className="font-mono text-accent">
                    {skillRunStats.improvementQueue.length}
                  </p>
                </div>
                <div className="space-y-2">
                  {skillRunStats.improvementQueue.slice(0, 3).map((item) => {
                    const skillLinkKey = `improvement-${item.skill.id}`;
                    const skillLinkStatus =
                      skillOpsSkillLinkCopyStatus?.key === skillLinkKey
                        ? skillOpsSkillLinkCopyStatus.status
                        : null;

                    return (
                      <div
                        key={item.skill.id}
                        className="grid gap-2 text-xs sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-muted">{item.skill.name}</p>
                          <p className="mt-1 font-mono text-soft">
                            {item.feedbackCount
                              ? `${item.successRate}% · 피드백 ${item.feedbackCount}개`
                              : "피드백 필요"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={buildSkillHref(item.skill.id)}
                            className={`${secondaryButtonClass} px-3 py-2 text-xs`}
                          >
                            Skills 보기
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              copySkillOpsSkillLink({
                                key: skillLinkKey,
                                skillId: item.skill.id,
                                title: "개선 대기 스킬 링크",
                              })
                            }
                            className={`${secondaryButtonClass} px-3 py-2 text-xs`}
                            data-testid="dashboard-skill-improvement-link-copy"
                          >
                            {skillLinkStatus === "copied"
                              ? "링크 복사됨"
                              : skillLinkStatus === "failed"
                                ? "복사 실패"
                                : "링크 복사"}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {skillRunStats.improvementQueue.length === 0 ? (
                    <p className="text-xs leading-5 text-muted">
                      현재 개선 대기 스킬이 없습니다.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 border-t border-line pt-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={copySkillOpsReport}
                  className={secondaryButtonClass}
                >
                  {skillOpsReportCopyStatus === "copied"
                    ? "스킬 운영 리포트 복사됨"
                    : skillOpsReportCopyStatus === "failed"
                      ? "스킬 운영 리포트 복사 실패"
                      : "스킬 운영 리포트 복사"}
                </button>
                <button
                  type="button"
                  onClick={openSkillOpsReportInStudio}
                  className={secondaryButtonClass}
                >
                  리포트 Studio로 보내기
                </button>
              </div>

              {skillOpsManualCopy ? (
                <ManualCopyPanel
                  copy={skillOpsManualCopy}
                  onClose={() => setSkillOpsManualCopy(null)}
                  ariaLabel="수동 복사용 스킬 운영 리포트 또는 링크"
                />
              ) : null}
            </div>
          </Panel>
  );
}
