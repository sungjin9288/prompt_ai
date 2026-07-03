import { Panel, PanelHeader, secondaryButtonClass } from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import type { SkillRunStats } from "@/lib/skills/skill-runner";
import { getBestVersion } from "@/lib/skills/skill-builder";
import { formatTimestamp } from "@/lib/skills-view/labels";
import type { SkillManualCopy } from "./skills-view-types";

interface SkillOperationalSummaryItem {
  label: string;
  value: string;
}

interface SkillExecutionWorkflowStep {
  detail: string;
  label: string;
  step: string;
  title: string;
}

interface SkillsOperationsPanelProps {
  skillRunStats: SkillRunStats;
  skillOperationalSummaryItems: SkillOperationalSummaryItem[];
  skillExecutionWorkflowSteps: SkillExecutionWorkflowStep[];
  operationsReportCopied: boolean;
  latestRunLibraryLinkCopied: boolean;
  manualCopy: SkillManualCopy | null;
  setManualCopy: (copy: SkillManualCopy | null) => void;
  copySkillsOperationalSummaryReport: () => void;
  openSkillsOperationalSummaryInStudio: () => void;
  openLatestSkillRunInLibrary: () => void;
  copyLatestSkillRunLibraryLink: () => void;
  editSkillById: (skillId: string) => void;
}

export function SkillsOperationsPanel({
  skillRunStats,
  skillOperationalSummaryItems,
  skillExecutionWorkflowSteps,
  operationsReportCopied,
  latestRunLibraryLinkCopied,
  manualCopy,
  setManualCopy,
  copySkillsOperationalSummaryReport,
  openSkillsOperationalSummaryInStudio,
  openLatestSkillRunInLibrary,
  copyLatestSkillRunLibraryLink,
  editSkillById,
}: SkillsOperationsPanelProps) {
  return (
    <Panel id="skills-operations" className="scroll-mt-6">
      <PanelHeader
        title="스킬 운영 요약"
        description="Library에 저장된 실행 프롬프트를 기준으로 반복 사용 성과를 집계합니다."
      />
      <div className="space-y-4 p-5">
        <div
          data-testid="skills-operational-metrics"
          className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3"
        >
          {skillOperationalSummaryItems.map((item) => (
            <div
              className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
              key={item.label}
            >
              <p className="text-muted">{item.label}</p>
              <p className="mt-1 break-words text-sm font-semibold text-accent">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div
          className="grid gap-3 text-xs md:grid-cols-3"
          data-testid="skills-execution-readiness-workflow"
        >
          {skillExecutionWorkflowSteps.map((item) => (
            <div
              className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
              key={item.step}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-panel-strong font-mono text-xs text-soft">
                  {item.step}
                </span>
                <p className="font-semibold text-soft">{item.label}</p>
              </div>
              <p className="mt-3 break-words text-sm font-semibold text-accent">
                {item.title}
              </p>
              <p className="mt-2 break-words leading-5 text-muted">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            className={secondaryButtonClass}
            type="button"
            onClick={copySkillsOperationalSummaryReport}
          >
            {operationsReportCopied
              ? "운영 리포트 복사됨"
              : manualCopy?.id === "operations-report"
                ? "운영 리포트 복사 실패"
                : "운영 리포트 복사"}
          </button>
          <button
            className={secondaryButtonClass}
            type="button"
            onClick={openSkillsOperationalSummaryInStudio}
          >
            리포트 Studio로 보내기
          </button>
        </div>
        {manualCopy?.id === "operations-report" ? (
          <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
            copy={manualCopy}
            onClose={() => setManualCopy(null)}
          />
        ) : null}

        {skillRunStats.latestRun ? (
          <div className="rounded-md border border-line bg-surface px-3 py-3">
            <p className="text-xs font-semibold text-soft">최근 실행</p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-soft">
              {skillRunStats.latestRun.title}
            </p>
            {skillRunStats.latestRun.sourceSkillName ? (
              <p className="mt-1 text-xs font-medium text-accent">
                스킬 · {skillRunStats.latestRun.sourceSkillName}
              </p>
            ) : null}
            <p className="mt-2 text-xs leading-5 text-muted">
              {formatTimestamp(skillRunStats.latestRun.createdAt)} · 품질{" "}
              {getBestVersion(skillRunStats.latestRun).qualityScore.toFixed(1)} ·
              피드백 {skillRunStats.latestRun.feedback.length}개
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                className={secondaryButtonClass}
                type="button"
                onClick={openLatestSkillRunInLibrary}
              >
                최근 실행 Library 보기
              </button>
              <button
                className={secondaryButtonClass}
                type="button"
                onClick={copyLatestSkillRunLibraryLink}
                data-testid="skills-latest-run-link-copy"
              >
                {latestRunLibraryLinkCopied
                  ? "최근 실행 링크 복사됨"
                  : manualCopy?.id === "latest-run-link"
                    ? "최근 실행 링크 복사 실패"
                    : "최근 실행 링크 복사"}
              </button>
            </div>
            {manualCopy?.id === "latest-run-link" ? (
              <div className="mt-3">
                <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                  copy={manualCopy}
                  onClose={() => setManualCopy(null)}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <p className="rounded-md border border-line bg-surface px-3 py-3 text-xs leading-5 text-muted">
            아직 저장된 스킬 실행 프롬프트가 없습니다. 스킬 실행 후
            Library에 저장하면 운영 요약이 채워집니다.
          </p>
        )}

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">반복 사용 상위 스킬</p>
            <p className="text-xs text-muted">
              {skillRunStats.topSkills.length}개
            </p>
          </div>
          <div className="mt-3 divide-y divide-line rounded-md border border-line bg-surface">
            {skillRunStats.topSkills.map((item) => (
              <button
                key={item.skill.id}
                type="button"
                className="block w-full px-3 py-3 text-left transition hover:bg-panel"
                onClick={() => editSkillById(item.skill.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-xs font-semibold text-soft">
                    {item.skill.name}
                  </p>
                  <span className="shrink-0 font-mono text-xs text-accent">
                    {item.runCount}회
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">
                  평균 품질{" "}
                  {item.averageScore ? item.averageScore.toFixed(1) : "-"} ·
                  성공률 {item.feedbackCount ? `${item.successRate}%` : "-"} ·
                  최근 {formatTimestamp(item.latestRunAt)}
                </p>
              </button>
            ))}

            {skillRunStats.topSkills.length === 0 ? (
              <p className="px-3 py-3 text-xs leading-5 text-muted">
                반복 사용 순위는 실행 프롬프트를 Library에 저장한 뒤 표시됩니다.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">개선 필요 큐</p>
            <p className="text-xs text-muted">
              {skillRunStats.improvementQueue.length}개
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {skillRunStats.improvementQueue.slice(0, 3).map((item) => (
              <button
                key={item.skill.id}
                type="button"
                className="block w-full rounded-md border border-line bg-surface px-3 py-3 text-left transition hover:bg-panel"
                onClick={() => editSkillById(item.skill.id)}
              >
                <p className="line-clamp-2 text-xs font-semibold text-soft">
                  {item.skill.name}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  피드백 {item.feedbackCount}개 · 성공률{" "}
                  {item.feedbackCount ? `${item.successRate}%` : "-"} ·
                  개선 추천 확인
                </p>
              </button>
            ))}

            {skillRunStats.improvementQueue.length === 0 ? (
              <p className="rounded-md border border-line bg-surface px-3 py-3 text-xs leading-5 text-muted">
                현재 개선 큐가 비어 있습니다. 실행 결과에 피드백이 쌓이면
                우선순위를 자동 계산합니다.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Panel>
  );
}
