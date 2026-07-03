"use client";

import {
  Field,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
} from "@/components/ui";
import {
  decidePromptLanguageStrategy,
  decideTargetModels,
  modelLabels,
  outputLanguageLabels,
  outputLanguages,
  targetModels,
  type LearningMemory,
  type PromptInputReadinessAnalysis,
  type PromptOutputLanguage,
  type TargetModel,
} from "@/lib/prompt";
import { getRecommendedOutputLanguage } from "@/lib/analytics/output-language";
import {
  getMemoryPreview,
  memoryScopeLabels,
  memoryScopeOptions,
} from "@/lib/studio-view/learning-memory";
import { formatModelLabels } from "@/lib/studio-view/generation";
import type {
  StudioLearningWorkflowStep,
  StudioMetricItem,
  StudioNextGenerationSummary,
  StudioNumberedStep,
  StudioSummaryItem,
} from "@/components/studio/studio-view-types";

type LanguageDecision = ReturnType<typeof decidePromptLanguageStrategy>;
type TargetModelDecision = ReturnType<typeof decideTargetModels>;
type RecommendedOutputLanguage = ReturnType<typeof getRecommendedOutputLanguage>;
type MemoryScope = LearningMemory["scope"];

interface StudioDecisionControlsPanelProps {
  goal: string;
  domain: string;
  goalOptions: string[];
  domainOptions: string[];
  promptLanguageDecision: LanguageDecision;
  languageDecisionSummaryItems: StudioSummaryItem[];
  outputLanguage: PromptOutputLanguage;
  recommendedOutputLanguage: RecommendedOutputLanguage;
  recommendedTargetModels: TargetModel[];
  targetModelDecision: TargetModelDecision;
  targetModelRecommendationApplied: boolean;
  modelsTouched: boolean;
  targetModelSelectionSummaryItems: StudioSummaryItem[];
  selectedModels: TargetModel[];
  nextGenerationSummary: StudioNextGenerationSummary;
  nextGenerationMetricItems: StudioMetricItem[];
  nextGenerationChecklistItems: StudioNumberedStep[];
  inputReadinessAnalysis: PromptInputReadinessAnalysis;
  inputReadinessQuestionBlockApplied: boolean;
  rawInput: string;
  isGenerating: boolean;
  appliedContextMemories: LearningMemory[];
  appliedFeedbackCount: number;
  learningContextSummaryItems: StudioSummaryItem[];
  learningContextWorkflowSteps: StudioLearningWorkflowStep[];
  enabledMemoryScopes: Record<MemoryScope, boolean>;
  learningMemoryScopeCounts: Record<MemoryScope, number>;
  appliedLearningMemories: LearningMemory[];
  enabledMemoryScopeCount: number;
  memories: LearningMemory[];
  setGoal: (value: string) => void;
  setDomain: (value: string) => void;
  setInputAnalysisCopied: (value: boolean) => void;
  setOutputLanguage: (value: PromptOutputLanguage) => void;
  setManualSelectedModels: (value: TargetModel[] | null) => void;
  toggleModel: (model: TargetModel) => void;
  applyInputReadinessQuestions: () => void;
  generatePrompt: () => void;
  enableAllMemoryScopes: () => void;
  disableAllMemoryScopes: () => void;
  toggleMemoryScope: (scope: MemoryScope) => void;
}

export function StudioDecisionControlsPanel({
  goal,
  domain,
  goalOptions,
  domainOptions,
  promptLanguageDecision,
  languageDecisionSummaryItems,
  outputLanguage,
  recommendedOutputLanguage,
  recommendedTargetModels,
  targetModelDecision,
  targetModelRecommendationApplied,
  modelsTouched,
  targetModelSelectionSummaryItems,
  selectedModels,
  nextGenerationSummary,
  nextGenerationMetricItems,
  nextGenerationChecklistItems,
  inputReadinessAnalysis,
  inputReadinessQuestionBlockApplied,
  rawInput,
  isGenerating,
  appliedContextMemories,
  appliedFeedbackCount,
  learningContextSummaryItems,
  learningContextWorkflowSteps,
  enabledMemoryScopes,
  learningMemoryScopeCounts,
  appliedLearningMemories,
  enabledMemoryScopeCount,
  memories,
  setGoal,
  setDomain,
  setInputAnalysisCopied,
  setOutputLanguage,
  setManualSelectedModels,
  toggleModel,
  applyInputReadinessQuestions,
  generatePrompt,
  enableAllMemoryScopes,
  disableAllMemoryScopes,
  toggleMemoryScope,
}: StudioDecisionControlsPanelProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="목표">
          <select
            className={selectClass}
            value={goal}
            onChange={(event) => {
              setGoal(event.target.value);
              setInputAnalysisCopied(false);
            }}
          >
            {goalOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>

        <Field label="분야">
          <select
            className={selectClass}
            value={domain}
            onChange={(event) => {
              setDomain(event.target.value);
              setInputAnalysisCopied(false);
            }}
          >
            {domainOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>

      <div id="studio-decision-controls">
        <p className="mb-3 text-sm font-medium text-soft">프롬프트 언어</p>
        <div className="rounded-md border border-line bg-surface px-3 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-accent">
                AI 판단 · {promptLanguageDecision.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {promptLanguageDecision.reason}
              </p>
            </div>
            <span className="shrink-0 rounded-md border border-line bg-panel px-3 py-2 text-xs font-semibold text-soft">
              사용자 선택 없음
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {languageDecisionSummaryItems.map((item) => (
              <div
                key={item.label}
                className="rounded-md border border-line bg-panel px-3 py-2"
              >
                <p className="text-[11px] text-muted">{item.label}</p>
                <p className="mt-1 break-words text-xs font-semibold text-soft">
                  {item.value}
                </p>
                <p className="mt-1 break-words text-[11px] leading-4 text-muted">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {promptLanguageDecision.signals.map((signal) => (
              <span
                key={signal}
                className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-soft">최종 답변 언어</p>
        <p className="-mt-2 mb-3 text-xs leading-5 text-muted">
          프롬프트 작성 언어는 위에서 자동 적용하고, 여기서는 대상 AI의
          최종 답변 언어만 정합니다.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {outputLanguages.map((item) => (
            <label
              key={item}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-3 text-sm transition ${
                outputLanguage === item
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line bg-surface text-muted hover:text-foreground"
              }`}
            >
              <input
                type="radio"
                className="sr-only"
                checked={outputLanguage === item}
                onChange={() => setOutputLanguage(item)}
              />
              {outputLanguageLabels[item]}
            </label>
          ))}
        </div>
        <div className="mt-3 rounded-md border border-line bg-surface px-3 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-accent">
                추천 답변 언어 · {recommendedOutputLanguage.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {recommendedOutputLanguage.reason}
              </p>
            </div>
            {recommendedOutputLanguage.outputLanguage !== outputLanguage ? (
              <button
                type="button"
                className={`${secondaryButtonClass} shrink-0`}
                onClick={() =>
                  setOutputLanguage(recommendedOutputLanguage.outputLanguage)
                }
              >
                추천 적용
              </button>
            ) : (
              <span className="shrink-0 rounded-md border border-line bg-panel px-3 py-2 text-xs font-semibold text-soft">
                적용됨
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-soft">대상 AI 도구</p>
        <div className="mb-3 rounded-md border border-line bg-surface px-3 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-accent">
                AI 추천 · {formatModelLabels(recommendedTargetModels)}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {targetModelDecision.reason}
              </p>
            </div>
            {targetModelRecommendationApplied ? (
              <span className="shrink-0 rounded-md border border-line bg-panel px-3 py-2 text-xs font-semibold text-soft">
                {modelsTouched ? "추천과 동일" : "자동 적용"}
              </span>
            ) : (
              <button
                type="button"
                className={`${secondaryButtonClass} shrink-0`}
                onClick={() => {
                  setManualSelectedModels(null);
                }}
              >
                추천 적용
              </button>
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {targetModelSelectionSummaryItems.map((item) => (
              <div
                key={item.label}
                className="rounded-md border border-line bg-panel px-3 py-2"
              >
                <p className="text-[11px] text-muted">{item.label}</p>
                <p className="mt-1 break-words text-xs font-semibold text-soft">
                  {item.value}
                </p>
                <p className="mt-1 break-words text-[11px] leading-4 text-muted">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {targetModelDecision.signals.map((signal) => (
              <span
                key={signal}
                className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-5">
          {targetModels.map((model) => (
            <label
              key={model}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-md border px-3 text-sm transition ${
                selectedModels.includes(model)
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line bg-surface text-muted hover:text-foreground"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedModels.includes(model)}
                onChange={() => toggleModel(model)}
              />
              {modelLabels[model]}
            </label>
          ))}
        </div>
      </div>

      <div
        id="studio-next-generation-action"
        className="rounded-md border border-accent/30 bg-accent/10 px-3 py-3"
        data-testid="studio-next-generation-summary"
      >
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold text-accent">
                다음 실행
              </p>
              <span className="rounded-md border border-accent/40 bg-panel px-2 py-1 text-[11px] font-semibold text-accent">
                {nextGenerationSummary.status}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-soft">
              {nextGenerationSummary.title}
            </p>
            <p className="mt-1 break-words text-xs leading-5 text-muted">
              {nextGenerationSummary.detail}
            </p>
            <p className="mt-1 break-words text-[11px] leading-5 text-muted">
              {nextGenerationSummary.evidence} · 출처{" "}
              {nextGenerationSummary.source}
            </p>
            <div
              className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-5"
              data-testid="studio-next-generation-metrics"
            >
              {nextGenerationMetricItems.map((item) => (
                <div
                  className="min-w-0 rounded-md border border-accent/30 bg-panel px-3 py-2"
                  key={item.label}
                >
                  <p className="text-[11px] text-muted">{item.label}</p>
                  <p className="mt-1 break-words text-xs font-semibold text-soft">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="mt-3 grid gap-2 md:grid-cols-3"
              data-testid="studio-next-generation-checklist"
            >
              {nextGenerationChecklistItems.map((item) => (
                <div
                  className="min-w-0 rounded-md border border-accent/20 bg-panel px-3 py-2"
                  key={item.label}
                >
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
                        {item.step}
                      </span>
                      <p className="break-words text-[11px] font-semibold text-accent">
                        {item.label}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border border-line bg-surface px-2 py-0.5 text-[10px] font-semibold text-soft">
                      {item.value}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-[11px] leading-4 text-muted">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
            {inputReadinessAnalysis.missingQuestions.length ? (
              <button
                className={`${secondaryButtonClass} w-full sm:w-auto`}
                type="button"
                onClick={applyInputReadinessQuestions}
                data-testid="studio-next-generation-apply-questions"
              >
                {inputReadinessQuestionBlockApplied
                  ? "보강 질문 확인"
                  : "보강 질문 추가"}
              </button>
            ) : null}
            <button
              className={`${primaryButtonClass} w-full sm:w-auto`}
              type="button"
              onClick={generatePrompt}
              disabled={!rawInput.trim() || isGenerating}
            >
              {isGenerating ? "생성 중" : "전문 프롬프트 생성"}
            </button>
          </div>
        </div>
      </div>
      <div
        id="studio-learning-context"
        className="rounded-md border border-line bg-surface px-3 py-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-soft">
              적용 학습 컨텍스트
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              생성 시 상위 학습 메모리 {appliedContextMemories.length}개와
              최근 피드백 {appliedFeedbackCount}개를 함께 반영합니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={enableAllMemoryScopes}
            >
              전체 켜기
            </button>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={disableAllMemoryScopes}
            >
              메모리 제외
            </button>
            <a className={secondaryButtonClass} href="/learning">
              전체 보기
            </a>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {learningContextSummaryItems.map((item) => (
            <div
              key={item.label}
              className="rounded-md border border-line bg-panel px-3 py-2"
            >
              <p className="text-[11px] text-muted">{item.label}</p>
              <p className="mt-1 break-words text-xs font-semibold text-soft">
                {item.value}
              </p>
              <p className="mt-1 break-words text-[11px] leading-4 text-muted">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
        <div
          className="mt-3 grid gap-2 lg:grid-cols-3"
          data-testid="studio-learning-context-workflow"
        >
          {learningContextWorkflowSteps.map((item) => (
            <div
              key={item.step}
              className="min-w-0 rounded-md border border-line bg-panel px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] font-semibold text-accent">
                  {item.step}
                </span>
                <p className="text-[11px] font-semibold text-muted">
                  {item.label}
                </p>
              </div>
              <p className="mt-2 break-words text-xs font-semibold text-soft">
                {item.title}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-muted">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {memoryScopeOptions.map((item) => (
            <div
              key={item.scope}
              className={`flex min-h-14 items-start gap-3 rounded-md border px-3 py-2.5 transition ${
                enabledMemoryScopes[item.scope]
                  ? "border-accent bg-accent/10"
                  : "border-line bg-panel text-muted hover:text-foreground"
              }`}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-current"
                  checked={enabledMemoryScopes[item.scope]}
                  onChange={() => toggleMemoryScope(item.scope)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-soft">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-4 text-muted">
                    {item.description}
                  </span>
                </span>
              </label>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className="rounded-md border border-line bg-panel px-2 py-1 font-mono text-xs text-soft">
                  {learningMemoryScopeCounts[item.scope]}
                </span>
                <a
                  className="text-xs font-semibold text-accent hover:text-accent-strong"
                  href={`/learning?scope=${item.scope}`}
                >
                  점검
                </a>
              </div>
            </div>
          ))}
        </div>
        {appliedLearningMemories.length ? (
          <ul className="mt-3 divide-y divide-line">
            {appliedLearningMemories.map((memory) => (
              <li key={memory.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-line bg-panel px-2 py-1 text-xs font-semibold text-soft">
                        {memoryScopeLabels[memory.scope]}
                      </span>
                      <span className="font-mono text-xs text-accent">
                        {memory.confidence.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-2 break-words text-sm font-semibold text-soft">
                      {memory.title}
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-muted">
                      {getMemoryPreview(memory.content)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-md border border-line bg-panel px-3 py-3">
            <p className="text-xs leading-5 text-muted">
              {enabledMemoryScopeCount === 0
                ? "모든 학습 메모리 scope가 꺼져 있습니다. 이번 생성에는 최근 피드백만 학습 신호로 반영됩니다."
                : memories.length
                  ? "선택한 scope에 적용할 학습 메모리가 없습니다. 필요한 scope를 켜거나 Learning에서 메모리를 확인하세요."
                  : "아직 적용할 학습 메모리가 없습니다. 회사 기준을 저장하거나 Library 피드백을 남기면 다음 생성부터 자동 반영됩니다."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
