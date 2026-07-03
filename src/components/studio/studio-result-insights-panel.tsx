"use client";

import { ScoreBar, secondaryButtonClass } from "@/components/ui";
import {
  comparePromptQualityVersions,
  getPromptQualityInsights,
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  type PromptAsset,
  type PromptLearningContextMeta,
  type PromptVersion,
} from "@/lib/prompt";
import {
  formatCountDelta,
  formatImprovementDepthLabel,
  formatScoreDelta,
  type QualityImprovementBaseline,
} from "@/lib/studio-view/generation";
import {
  getRegenerationSaveDecision,
  regenerationSaveDecisionClassNames,
  targetAiReadinessStatusClassNames,
  targetAiReadinessStatusLabels,
  targetAiReadinessStatusOrder,
  type TargetAiReadinessComparison,
} from "@/lib/studio-view/reports";
import type { StudioManualCopy } from "@/components/studio/studio-view-types";

type QualityComparison = ReturnType<typeof comparePromptQualityVersions>;
type RegenerationSaveDecision = ReturnType<typeof getRegenerationSaveDecision>;

interface StudioResultInsightsPanelProps {
  generated: PromptAsset;
  activeVersion: PromptVersion;
  generatedImprovementDepth: number;
  generatedLearningContext: PromptLearningContextMeta | undefined;
  generatedEnabledScopeLabels: string[];
  generatedDisabledScopeLabels: string[];
  qualityImprovementBaseline: QualityImprovementBaseline | null;
  qualityComparison: QualityComparison | null;
  regenerationSaveDecision: RegenerationSaveDecision | null;
  targetAiReadinessComparison: TargetAiReadinessComparison | null;
  qualityInsights: ReturnType<typeof getPromptQualityInsights>;
  learningContextReportCopied: boolean;
  qualityComparisonCopied: boolean;
  contextQuestionsCopied: boolean;
  studioManualCopy: StudioManualCopy | null;
  copyLearningContextReport: () => void;
  copyQualityComparisonReport: () => void;
  applyQualityImprovementBrief: () => void;
  copyMissingContextQuestions: () => void;
  setQualityImprovementBaseline: (value: QualityImprovementBaseline | null) => void;
  setQualityComparisonCopied: (value: boolean) => void;
  setStudioManualCopy: (value: StudioManualCopy | null) => void;
}

export function StudioResultInsightsPanel({
  generated,
  activeVersion,
  generatedImprovementDepth,
  generatedLearningContext,
  generatedEnabledScopeLabels,
  generatedDisabledScopeLabels,
  qualityImprovementBaseline,
  qualityComparison,
  regenerationSaveDecision,
  targetAiReadinessComparison,
  qualityInsights,
  learningContextReportCopied,
  qualityComparisonCopied,
  contextQuestionsCopied,
  studioManualCopy,
  copyLearningContextReport,
  copyQualityComparisonReport,
  applyQualityImprovementBrief,
  copyMissingContextQuestions,
  setQualityImprovementBaseline,
  setQualityComparisonCopied,
  setStudioManualCopy,
}: StudioResultInsightsPanelProps) {
  return (
    <aside className="space-y-5 p-5">
      {generated.improvementSource ? (
        <div className="rounded-md border border-line bg-surface px-4 py-3">
          <p className="text-xs text-muted">Library 연결</p>
          <p className="mt-1 break-words text-sm font-semibold text-soft">
            {generated.title}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">
            {generated.improvementSource.sourceVersionModel
              ? `${modelLabels[generated.improvementSource.sourceVersionModel]} 버전을 기준으로 만든 ${formatImprovementDepthLabel(
                  generatedImprovementDepth,
                )}입니다.`
              : `Library 선택 버전을 기준으로 만든 ${formatImprovementDepthLabel(
                  generatedImprovementDepth,
                )}입니다.`}
          </p>
        </div>
      ) : null}

      <div className="rounded-md border border-line bg-surface px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">학습 반영</p>
          <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-soft">
            {generatedLearningContext
              ? `${generatedLearningContext.appliedMemoryCount}+${generatedLearningContext.recentFeedbackCount}`
              : "미기록"}
          </span>
        </div>
        {generatedLearningContext ? (
          <>
            <p className="mt-2 text-xs leading-5 text-muted">
              메모리 {generatedLearningContext.appliedMemoryCount}개와
              최근 피드백{" "}
              {generatedLearningContext.recentFeedbackCount}개를 생성
              당시 컨텍스트로 사용했습니다.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {generatedEnabledScopeLabels.length ? (
                generatedEnabledScopeLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted">
                  메모리 scope 없음
                </span>
              )}
            </div>
            {generatedDisabledScopeLabels.length ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                제외 scope · {generatedDisabledScopeLabels.join(", ")}
              </p>
            ) : null}
            {generatedLearningContext.appliedMemoryTitles.length ? (
              <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
                {generatedLearningContext.appliedMemoryTitles
                  .slice(0, 3)
                  .map((title) => (
                    <li key={title} className="break-words">
                      - {title}
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs leading-5 text-muted">
                생성 당시 적용된 학습 메모리는 없습니다.
              </p>
            )}
            <button
              type="button"
              className={`${secondaryButtonClass} mt-4 w-full`}
              onClick={copyLearningContextReport}
            >
              {learningContextReportCopied
                ? "학습 리포트 복사됨"
                : studioManualCopy?.id === "learning-report"
                  ? "학습 리포트 복사 실패"
                  : "학습 리포트 복사"}
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-xs leading-5 text-muted">
              이 결과는 학습 컨텍스트 메타 저장 전 생성됐습니다.
            </p>
            <button
              type="button"
              className={`${secondaryButtonClass} mt-4 w-full`}
              onClick={copyLearningContextReport}
            >
              {learningContextReportCopied
                ? "학습 리포트 복사됨"
                : studioManualCopy?.id === "learning-report"
                  ? "학습 리포트 복사 실패"
                  : "학습 리포트 복사"}
            </button>
          </>
        )}
      </div>

      <div>
        <p className="text-sm text-muted">품질 점수</p>
        <p className="mt-1 font-mono text-4xl font-semibold text-accent">
          {activeVersion.qualityScore.toFixed(1)}
        </p>
        <p className="mt-2 text-xs text-muted">
          {generated.source === "openai"
            ? `OpenAI · ${generated.modelUsed}`
            : "Local builder"}
        </p>
        <p className="mt-2 text-xs text-muted">
          언어 전략 ·{" "}
          {languageStrategyLabels[generated.languageStrategy ?? "hybrid"]}
        </p>
        <p className="mt-2 text-xs text-muted">
          답변 언어 ·{" "}
          {outputLanguageLabels[generated.outputLanguage ?? "korean"]}
        </p>
      </div>

      <div className="space-y-3">
        <ScoreBar label="명확성" value={activeVersion.scoreBreakdown.clarity} />
        <ScoreBar label="맥락" value={activeVersion.scoreBreakdown.context} />
        <ScoreBar
          label="출력 형식"
          value={activeVersion.scoreBreakdown.outputFormat}
        />
        <ScoreBar
          label="제약 조건"
          value={activeVersion.scoreBreakdown.constraints}
        />
        <ScoreBar
          label="전문성"
          value={activeVersion.scoreBreakdown.expertise}
        />
        <ScoreBar
          label="도구 적합성"
          value={activeVersion.scoreBreakdown.modelFit}
        />
        <ScoreBar
          label="재사용성"
          value={activeVersion.scoreBreakdown.reusability}
        />
      </div>

      {qualityImprovementBaseline ? (
        <div className="rounded-md border border-line bg-surface px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">재생성 비교</p>
            <span
              className={`shrink-0 rounded-md border px-2 py-1 font-mono text-xs ${
                qualityComparison
                  ? qualityComparison.scoreDelta > 0
                    ? "border-success/50 text-success"
                    : qualityComparison.scoreDelta < 0
                      ? "border-danger/50 text-danger"
                      : "border-line text-soft"
                  : "border-line text-muted"
              }`}
            >
              {qualityComparison
                ? formatScoreDelta(qualityComparison.scoreDelta)
                : "대기"}
            </span>
          </div>
          {qualityComparison ? (
            <>
              <p className="mt-2 text-xs leading-5 text-muted">
                {qualityImprovementBaseline.version.qualityScore.toFixed(
                  1,
                )}{" "}
                → {activeVersion.qualityScore.toFixed(1)} · 개선{" "}
                {qualityComparison.improvedCount}개, 하락{" "}
                {qualityComparison.regressedCount}개
              </p>
              {regenerationSaveDecision ? (
                <div
                  className={`mt-3 rounded-md border px-3 py-2 ${
                    regenerationSaveDecisionClassNames[
                      regenerationSaveDecision.status
                    ]
                  }`}
                >
                  <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-xs font-semibold">
                      저장 판정 · {regenerationSaveDecision.label}
                    </p>
                    <span className="font-mono text-[11px]">
                      {formatScoreDelta(qualityComparison.scoreDelta)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5">
                    {regenerationSaveDecision.detail}
                  </p>
                </div>
              ) : null}
              <div className="mt-3 space-y-2">
                {qualityComparison.scoreChanges.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-muted">{item.label}</span>
                    <span
                      className={`font-mono ${
                        item.delta > 0
                          ? "text-success"
                          : item.delta < 0
                            ? "text-danger"
                            : "text-soft"
                      }`}
                    >
                      {item.previous.toFixed(1)} →{" "}
                      {item.current.toFixed(1)} (
                      {formatScoreDelta(item.delta)})
                    </span>
                  </div>
                ))}
              </div>
              {targetAiReadinessComparison ? (
                <div className="mt-4 border-t border-line pt-3">
                  <p className="text-xs font-semibold text-soft">
                    전달 준비 비교
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {targetAiReadinessStatusOrder.map((status) => {
                      const delta =
                        targetAiReadinessComparison.deltas[status];

                      return (
                        <div
                          className="rounded-md border border-line bg-panel-strong px-3 py-2"
                          key={status}
                        >
                          <p className="text-[11px] text-muted">
                            {targetAiReadinessStatusLabels[status]}
                          </p>
                          <div className="mt-1 flex items-baseline justify-between gap-2">
                            <span
                              className={`font-mono text-sm font-semibold ${
                                targetAiReadinessStatusClassNames[
                                  status
                                ]
                              }`}
                            >
                              {
                                targetAiReadinessComparison.current[
                                  status
                                ]
                              }
                            </span>
                            <span
                              className={`font-mono text-[11px] ${
                                delta === 0
                                  ? "text-muted"
                                  : status === "ready"
                                    ? delta > 0
                                      ? "text-success"
                                      : "text-danger"
                                    : delta < 0
                                      ? "text-success"
                                      : "text-danger"
                              }`}
                            >
                              {formatCountDelta(delta)}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-muted">
                            이전{" "}
                            {
                              targetAiReadinessComparison.previous[
                                status
                              ]
                            }
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  className={`${secondaryButtonClass} w-full`}
                  onClick={copyQualityComparisonReport}
                >
                  {qualityComparisonCopied
                    ? "비교 리포트 복사됨"
                    : studioManualCopy?.id === "quality-comparison"
                      ? "비교 리포트 복사 실패"
                      : "비교 리포트 복사"}
                </button>
                <button
                  type="button"
                  className={`${secondaryButtonClass} w-full`}
                  onClick={() => {
                    setQualityImprovementBaseline(null);
                    setQualityComparisonCopied(false);
                    setStudioManualCopy(null);
                  }}
                >
                  비교 기준 해제
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-xs leading-5 text-muted">
                품질 진단 기반 입력이 반영됐습니다. 다시 생성하면 현재
                결과와 기준 버전의 점수 변화를 비교합니다.
              </p>
              <button
                type="button"
                className={`${secondaryButtonClass} mt-4 w-full`}
                onClick={() => {
                  setQualityImprovementBaseline(null);
                  setQualityComparisonCopied(false);
                }}
              >
                비교 기준 해제
              </button>
            </>
          )}
        </div>
      ) : null}

      <div className="rounded-md border border-line bg-surface px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">품질 진단</p>
          <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-soft">
            {qualityInsights.length}개
          </span>
        </div>
        <ul className="mt-3 space-y-3">
          {qualityInsights.length ? (
            qualityInsights.map((insight) => (
              <li key={insight.key} className="text-sm leading-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                      insight.severity === "improve"
                        ? "border-danger/50 text-danger"
                        : insight.severity === "watch"
                          ? "border-attention/50 text-attention"
                          : "border-line text-soft"
                    }`}
                  >
                    {insight.label} {insight.score.toFixed(1)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {insight.reason}
                </p>
                <p className="mt-1 text-xs leading-5 text-soft">
                  {insight.action}
                </p>
              </li>
            ))
          ) : (
            <li className="text-xs leading-5 text-muted">
              현재 점수 기준으로 낮은 항목은 없습니다. 저장 전 실제
              사용 목적과 최신 맥락만 확인하세요.
            </li>
          )}
        </ul>
        <button
          type="button"
          className={`${secondaryButtonClass} mt-4 w-full`}
          onClick={applyQualityImprovementBrief}
          disabled={!qualityInsights.length}
        >
          재생성 입력으로 반영
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">가정</p>
        <ul className="space-y-2 text-sm leading-5 text-muted">
          {activeVersion.assumptions.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">추가 정보</p>
        <ul className="space-y-2 text-sm leading-5 text-muted">
          {activeVersion.missingContext.length ? (
            activeVersion.missingContext.map((item) => (
              <li key={item}>- {item}</li>
            ))
          ) : (
            <li>- 현재 입력만으로 생성 가능</li>
          )}
        </ul>
        {activeVersion.missingContext.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <a
              className={`${secondaryButtonClass} w-full`}
              href="/profile?returnTo=%2Fstudio"
            >
              개인 프로필 보강
            </a>
            <a
              className={`${secondaryButtonClass} w-full`}
              href="/company?returnTo=%2Fstudio"
            >
              회사 정보 보강
            </a>
            <button
              type="button"
              className={`${secondaryButtonClass} w-full sm:col-span-2`}
              onClick={copyMissingContextQuestions}
            >
              {contextQuestionsCopied
                ? "보강 질문 복사됨"
                : studioManualCopy?.id === "missing-context"
                  ? "보강 질문 복사 실패"
                  : "보강 질문 복사"}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
