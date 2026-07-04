"use client";

import Link from "next/link";
import { Panel, PanelHeader } from "@/components/ui";
import type { GenerationEnginePerformance } from "@/lib/analytics/generation-engine";
import type { LanguageStrategyPerformance } from "@/lib/analytics/language-strategy";
import type { OutputLanguagePerformance } from "@/lib/analytics/output-language";
import type { TargetModelPerformance } from "@/lib/analytics/target-model";
import {
  generationEngineLibraryHref,
  languageStrategyLibraryHref,
  outputLanguageLibraryHref,
  targetModelLibraryHref,
} from "@/lib/dashboard/hrefs";
import {
  formatTimestamp,
  generationEngineStatusLabel,
  outputLanguageStatusLabel,
  strategyStatusLabel,
  targetModelStatusLabel,
} from "@/lib/dashboard/shared";

export interface DashboardPerformancePanelProps {
  targetModelSummaries: TargetModelPerformance[];
  generationEngineSummaries: GenerationEnginePerformance[];
  languageSummaries: LanguageStrategyPerformance[];
  outputLanguageSummaries: OutputLanguagePerformance[];
}

interface PerformanceBucketRowProps {
  href: string;
  label: string;
  latestPromptAt?: string;
  statusLabel: string;
  promptCount: number;
  averageQuality: number;
  feedbackCount: number;
  successRate: number;
}

function PerformanceBucketRow({
  href,
  label,
  latestPromptAt,
  statusLabel,
  promptCount,
  averageQuality,
  feedbackCount,
  successRate,
}: PerformanceBucketRowProps) {
  const qualityText = averageQuality ? averageQuality.toFixed(1) : "데이터 없음";
  const successRateText = feedbackCount ? `${successRate}%` : "데이터 없음";
  const rowLabel = `${label} · 버전/프롬프트 ${promptCount} · 품질 ${qualityText} · 성공률 ${successRateText} · ${statusLabel} · 로 이동`;

  return (
    <li>
      <Link
        href={href}
        aria-label={rowLabel}
        className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 transition hover:border-accent hover:bg-panel-strong"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{label}</p>
          <p className="mt-0.5 text-xs text-muted">
            최근 {formatTimestamp(latestPromptAt)} · {statusLabel}
          </p>
        </div>
        <div
          aria-hidden="true"
          className="flex shrink-0 items-center gap-3 font-mono text-sm"
        >
          <span>{promptCount}</span>
          <span>{qualityText}</span>
          <span>{successRateText}</span>
        </div>
      </Link>
    </li>
  );
}

function PerformanceGroup({
  title,
  children,
  isEmpty,
}: {
  title: string;
  children: React.ReactNode;
  isEmpty: boolean;
}) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-xs font-semibold text-soft">{title}</h3>
      {isEmpty ? (
        <p className="text-xs text-muted">데이터 없음</p>
      ) : (
        <ul className="space-y-1.5">{children}</ul>
      )}
    </div>
  );
}

export function DashboardPerformancePanel({
  targetModelSummaries,
  generationEngineSummaries,
  languageSummaries,
  outputLanguageSummaries,
}: DashboardPerformancePanelProps) {
  return (
    <Panel className="mt-6">
      <PanelHeader
        title="성과 요약"
        description="대상 AI, 생성 엔진, 언어 전략, 답변 언어별 품질/피드백 성과를 한 화면에서 훑고 Library 필터로 이동합니다."
      />
      <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
        <PerformanceGroup
          title="대상 AI"
          isEmpty={targetModelSummaries.length === 0}
        >
          {targetModelSummaries.map((item) => (
            <PerformanceBucketRow
              key={item.targetModel}
              href={targetModelLibraryHref(item.targetModel)}
              label={item.label}
              latestPromptAt={item.latestPromptAt}
              statusLabel={targetModelStatusLabel(item.status)}
              promptCount={item.promptCount}
              averageQuality={item.averageQuality}
              feedbackCount={item.feedbackCount}
              successRate={item.successRate}
            />
          ))}
        </PerformanceGroup>
        <PerformanceGroup
          title="생성 엔진"
          isEmpty={generationEngineSummaries.length === 0}
        >
          {generationEngineSummaries.map((item) => (
            <PerformanceBucketRow
              key={item.engine}
              href={generationEngineLibraryHref(item.engine)}
              label={item.label}
              latestPromptAt={item.latestPromptAt}
              statusLabel={generationEngineStatusLabel(item.status)}
              promptCount={item.promptCount}
              averageQuality={item.averageQuality}
              feedbackCount={item.feedbackCount}
              successRate={item.successRate}
            />
          ))}
        </PerformanceGroup>
        <PerformanceGroup
          title="언어 전략"
          isEmpty={languageSummaries.length === 0}
        >
          {languageSummaries.map((item) => (
            <PerformanceBucketRow
              key={item.strategy}
              href={languageStrategyLibraryHref(item.strategy)}
              label={item.label}
              latestPromptAt={item.latestPromptAt}
              statusLabel={strategyStatusLabel(item.status)}
              promptCount={item.promptCount}
              averageQuality={item.averageQuality}
              feedbackCount={item.feedbackCount}
              successRate={item.successRate}
            />
          ))}
        </PerformanceGroup>
        <PerformanceGroup
          title="답변 언어"
          isEmpty={outputLanguageSummaries.length === 0}
        >
          {outputLanguageSummaries.map((item) => (
            <PerformanceBucketRow
              key={item.outputLanguage}
              href={outputLanguageLibraryHref(item.outputLanguage)}
              label={item.label}
              latestPromptAt={item.latestPromptAt}
              statusLabel={outputLanguageStatusLabel(item.status)}
              promptCount={item.promptCount}
              averageQuality={item.averageQuality}
              feedbackCount={item.feedbackCount}
              successRate={item.successRate}
            />
          ))}
        </PerformanceGroup>
      </div>
    </Panel>
  );
}
