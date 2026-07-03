import {
  Field,
  Panel,
  PanelHeader,
  ScoreBar,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  selectClass,
  textareaClass,
} from "@/components/ui";
import { ManualCopyPanel } from "@/components/common/manual-copy-panel";
import {
  decidePromptLanguageStrategy,
  languageStrategyLabels,
  outputLanguageLabels,
  outputLanguages,
  type PromptAsset,
  type PromptOutputLanguage,
  type PromptSkill,
  type TargetModel,
} from "@/lib/prompt";
import {
  getSkillOutputLanguage,
  type SkillFeedbackInsight,
} from "@/lib/skills/skill-runner";
import type { SkillImprovementPlan } from "@/lib/skills/skill-improver";
import { getBestVersion } from "@/lib/skills/skill-builder";
import { listToText, textToList } from "@/lib/storage/local-store";
import { feedbackStatusLabel, formatTimestamp } from "@/lib/skills-view/labels";
import type { SkillManualCopy } from "./skills-view-types";

interface SelectedPromptStudioSourceDisplay {
  label: string;
  sourceTitle?: string;
  sourceVariantLabel: string | null;
}

interface SkillsTemplatePanelProps {
  selectedPrompt?: PromptAsset;
  selectedPromptBestVersion?: ReturnType<typeof getBestVersion>;
  selectedPromptStudioSourceDisplay: SelectedPromptStudioSourceDisplay | null;
  sourceLinkCopied: boolean;
  draft: PromptSkill;
  skillLanguageDecision: ReturnType<typeof decidePromptLanguageStrategy>;
  selectedSkillRuns: PromptAsset[];
  selectedFeedbackInsight: SkillFeedbackInsight;
  improvementPlan: SkillImprovementPlan;
  runInput: string;
  runPrompt: string;
  runCopied: boolean;
  runNotice: string;
  savedRunPrompt: PromptAsset | null;
  runLibraryLinkCopied: boolean;
  historyRunLibraryLinkCopiedId: string;
  improvementPlanCopied: boolean;
  improvementNotice: string;
  copied: boolean;
  saved: boolean;
  manualCopy: SkillManualCopy | null;
  setManualCopy: (copy: SkillManualCopy | null) => void;
  setRunInput: (value: string) => void;
  update: <K extends keyof PromptSkill>(key: K, value: PromptSkill[K]) => void;
  clearRunState: (clearInput?: boolean) => void;
  openSelectedPromptInLibrary: () => void;
  copySelectedPromptLibraryLink: () => void;
  openSkillRunInLibrary: (prompt: PromptAsset) => void;
  copySkillRunHistoryLibraryLink: (prompt: PromptAsset) => void;
  copyImprovementPlan: () => void;
  openImprovementPlanInStudio: () => void;
  applyImprovementPlan: () => void;
  generateRunPrompt: () => void;
  copyRunPrompt: () => void;
  saveRunToLibrary: () => void;
  openSavedRunInLibrary: () => void;
  copySavedRunLibraryLink: () => void;
  saveSkill: () => void;
  fillSavedSkillRunExample: () => void;
  copyTemplate: () => void;
  resetSkillDraft: () => void;
}

export function SkillsTemplatePanel({
  selectedPrompt,
  selectedPromptBestVersion,
  selectedPromptStudioSourceDisplay,
  sourceLinkCopied,
  draft,
  skillLanguageDecision,
  selectedSkillRuns,
  selectedFeedbackInsight,
  improvementPlan,
  runInput,
  runPrompt,
  runCopied,
  runNotice,
  savedRunPrompt,
  runLibraryLinkCopied,
  historyRunLibraryLinkCopiedId,
  improvementPlanCopied,
  improvementNotice,
  copied,
  saved,
  manualCopy,
  setManualCopy,
  setRunInput,
  update,
  clearRunState,
  openSelectedPromptInLibrary,
  copySelectedPromptLibraryLink,
  openSkillRunInLibrary,
  copySkillRunHistoryLibraryLink,
  copyImprovementPlan,
  openImprovementPlanInStudio,
  applyImprovementPlan,
  generateRunPrompt,
  copyRunPrompt,
  saveRunToLibrary,
  openSavedRunInLibrary,
  copySavedRunLibraryLink,
  saveSkill,
  fillSavedSkillRunExample,
  copyTemplate,
  resetSkillDraft,
}: SkillsTemplatePanelProps) {
  return (
    <Panel id="skills-template" className="min-h-[820px] scroll-mt-6">
      <PanelHeader
        title="스킬 템플릿"
        description={
          selectedPrompt
            ? `${selectedPrompt.domain} 프롬프트를 기반으로 편집 중`
            : "후보를 선택하거나 직접 스킬을 작성합니다."
        }
      />

      {selectedPrompt ? (
        <div className="border-b border-line px-5 py-4">
          <div className="rounded-md border border-accent/20 bg-panel px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold text-accent">
                  원본 Library 프롬프트
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-soft">
                  {selectedPrompt.title}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {selectedPrompt.domain} ·{" "}
                  {selectedPromptBestVersion?.modelLabel ?? "선택 버전"} ·
                  품질{" "}
                  {selectedPromptBestVersion
                    ? selectedPromptBestVersion.qualityScore.toFixed(1)
                    : "-"}{" "}
                  · 피드백 {selectedPrompt.feedback.length}개
                </p>
                {selectedPromptStudioSourceDisplay ? (
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Studio 저장 출처 ·{" "}
                    {selectedPromptStudioSourceDisplay.label}
                    {selectedPromptStudioSourceDisplay.sourceVariantLabel
                      ? ` · 세부 초안 유형 ${selectedPromptStudioSourceDisplay.sourceVariantLabel}`
                      : ""}
                  </p>
                ) : null}
                {selectedPromptStudioSourceDisplay?.sourceTitle ? (
                  <p className="mt-1 break-words text-xs leading-5 text-muted">
                    출처 제목 · {selectedPromptStudioSourceDisplay.sourceTitle}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                <button
                  className={`${secondaryButtonClass} w-full sm:w-auto`}
                  type="button"
                  onClick={openSelectedPromptInLibrary}
                >
                  Library 원본으로 돌아가기
                </button>
                <button
                  className={`${secondaryButtonClass} w-full sm:w-auto`}
                  type="button"
                  onClick={copySelectedPromptLibraryLink}
                >
                  {sourceLinkCopied
                    ? "원본 링크 복사됨"
                    : manualCopy?.id === "source-link"
                      ? "원본 링크 복사 실패"
                      : "원본 링크 복사"}
                </button>
              </div>
            </div>
            {manualCopy?.id === "source-link" ? (
              <div className="mt-3">
                <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                  copy={manualCopy}
                  onClose={() => setManualCopy(null)}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-0 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5 border-b border-line p-5 xl:border-b-0 xl:border-r">
          <div className="grid gap-4 lg:grid-cols-[1fr_150px_180px]">
            <Field label="스킬 이름">
              <input
                className={inputClass}
                value={draft.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="예: IR 피치 정리"
              />
            </Field>

            <Field label="대상 AI">
              <select
                className={selectClass}
                value={draft.targetModel}
                onChange={(event) =>
                  update("targetModel", event.target.value as TargetModel)
                }
              >
                <option value="general">범용</option>
                <option value="gpt">GPT</option>
                <option value="claude">Claude</option>
                <option value="codex">Codex</option>
                <option value="gemini">Gemini</option>
              </select>
            </Field>

            <Field label="답변 언어">
              <select
                className={selectClass}
                value={getSkillOutputLanguage(draft)}
                onChange={(event) =>
                  update(
                    "outputLanguage",
                    event.target.value as PromptOutputLanguage,
                  )
                }
              >
                {outputLanguages.map((item) => (
                  <option key={item} value={item}>
                    {outputLanguageLabels[item]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="rounded-md border border-line bg-surface px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-accent">
                  AI 언어 판단 · {skillLanguageDecision.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {skillLanguageDecision.reason}
                </p>
              </div>
              <span className="shrink-0 rounded-md border border-line bg-panel px-3 py-2 text-xs font-semibold text-soft">
                자동 적용
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {skillLanguageDecision.signals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="분야">
              <input
                className={inputClass}
                value={draft.domain}
                onChange={(event) => update("domain", event.target.value)}
              />
            </Field>

            <Field label="태그" hint="줄바꿈 또는 쉼표로 구분">
              <input
                className={inputClass}
                value={draft.tags.join(", ")}
                onChange={(event) => update("tags", textToList(event.target.value))}
              />
            </Field>
          </div>

          <Field label="설명">
            <textarea
              className={textareaClass}
              rows={3}
              value={draft.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </Field>

          <Field label="입력 가이드">
            <textarea
              className={textareaClass}
              rows={3}
              value={draft.inputGuide}
              onChange={(event) => update("inputGuide", event.target.value)}
            />
          </Field>

          <Field label="프롬프트 템플릿">
            <textarea
              className={`${textareaClass} min-h-[360px] font-mono text-[13px]`}
              value={draft.promptTemplate}
              onChange={(event) => update("promptTemplate", event.target.value)}
            />
          </Field>
        </div>

        <aside className="space-y-5 p-5">
          <div>
            <p className="mb-2 text-sm font-semibold">출력 형식</p>
            <textarea
              className={textareaClass}
              rows={5}
              value={draft.outputFormat}
              onChange={(event) => update("outputFormat", event.target.value)}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">품질 체크리스트</p>
            <textarea
              className={textareaClass}
              rows={7}
              value={listToText(draft.qualityChecklist)}
              onChange={(event) =>
                update("qualityChecklist", textToList(event.target.value))
              }
            />
          </div>

          <div className="space-y-3">
            <ScoreBar
              label="템플릿 완성도"
              value={
                [
                  draft.name,
                  draft.description,
                  draft.inputGuide,
                  draft.promptTemplate,
                  draft.outputFormat,
                ].filter((item) => item.trim()).length
              }
            />
            <ScoreBar
              label="체크리스트"
              value={Math.min(5, draft.qualityChecklist.length)}
            />
          </div>

          <div
            id="skills-runner"
            className="scroll-mt-6 space-y-3 rounded-md border border-line bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">실행 이력</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  현재 스킬에서 생성된 실행 프롬프트 기록입니다.
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-semibold text-accent">
                  {selectedSkillRuns.length || draft.usageCount}
                </p>
                <p className="text-xs text-muted">회</p>
              </div>
            </div>

            <div className="rounded-md border border-line bg-panel px-3 py-2 text-xs">
              <p className="text-muted">언어 전략</p>
              <p className="mt-1 font-semibold text-soft">
                {skillLanguageDecision.label}
              </p>
              <p className="mt-2 leading-5 text-muted">
                {skillLanguageDecision.reason}
              </p>
              <p className="mt-2 text-muted">답변 언어</p>
              <p className="mt-1 font-semibold text-soft">
                {outputLanguageLabels[getSkillOutputLanguage(draft)]}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted">최근 실행</p>
                <p className="mt-1 font-medium">
                  {formatTimestamp(selectedSkillRuns[0]?.createdAt ?? draft.lastRunAt)}
                </p>
              </div>
              <div>
                <p className="text-muted">평균 품질</p>
                <p className="mt-1 font-mono font-medium">
                  {selectedSkillRuns.length
                    ? (
                        selectedSkillRuns.reduce(
                          (sum, prompt) =>
                            sum + getBestVersion(prompt).qualityScore,
                          0,
                        ) / selectedSkillRuns.length
                      ).toFixed(1)
                    : "-"}
                </p>
              </div>
            </div>

            <div className="divide-y divide-line">
              {selectedSkillRuns.map((prompt) => (
                <div
                  key={prompt.id}
                  className="py-3 transition hover:bg-panel"
                >
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-medium">
                        {prompt.title}
                      </p>
                      {prompt.sourceSkillName ? (
                        <p className="mt-1 text-xs font-medium text-accent">
                          스킬 · {prompt.sourceSkillName}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted">
                        {formatTimestamp(prompt.createdAt)} ·{" "}
                        {languageStrategyLabels[prompt.languageStrategy ?? "hybrid"]} ·
                        답변{" "}
                        {outputLanguageLabels[prompt.outputLanguage ?? "korean"]} ·
                        품질 {getBestVersion(prompt).qualityScore.toFixed(1)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => openSkillRunInLibrary(prompt)}
                      >
                        Library 보기
                      </button>
                      <button
                        type="button"
                        className={secondaryButtonClass}
                        onClick={() => copySkillRunHistoryLibraryLink(prompt)}
                        data-testid={`skills-run-history-link-copy-${prompt.id}`}
                      >
                        {historyRunLibraryLinkCopiedId === prompt.id
                          ? "링크 복사됨"
                          : manualCopy?.id === "run-history-link" &&
                              manualCopy.targetId === prompt.id
                            ? "링크 복사 실패"
                            : "링크 복사"}
                      </button>
                    </div>
                  </div>
                  {manualCopy?.id === "run-history-link" &&
                  manualCopy.targetId === prompt.id ? (
                    <div className="mt-3">
                      <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                        copy={manualCopy}
                        onClose={() => setManualCopy(null)}
                      />
                    </div>
                  ) : null}
                </div>
              ))}

              {selectedSkillRuns.length === 0 ? (
                <p className="py-3 text-xs leading-5 text-muted">
                  아직 저장된 실행 이력이 없습니다. 아래에서 실행 프롬프트를
                  생성하고 Library에 저장하면 기록됩니다.
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">성과와 개선 추천</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  실행 프롬프트 피드백을 기준으로 스킬 개선 방향을 계산합니다.
                </p>
              </div>
              <span className="shrink-0 rounded-md border border-line bg-panel px-2 py-1 text-xs font-medium text-soft">
                {feedbackStatusLabel(selectedFeedbackInsight.status)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-muted">성공률</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {selectedFeedbackInsight.feedbackCount
                    ? `${selectedFeedbackInsight.successRate}%`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted">피드백</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {selectedFeedbackInsight.feedbackCount}
                </p>
              </div>
              <div>
                <p className="text-muted">평균 평가</p>
                <p className="mt-1 font-mono text-base font-semibold">
                  {selectedFeedbackInsight.feedbackCount
                    ? selectedFeedbackInsight.averageRating.toFixed(1)
                    : "-"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-soft">추천 항목</p>
              <ul className="space-y-2">
                {selectedFeedbackInsight.recommendations.map((item) => (
                  <li key={item} className="text-xs leading-5 text-muted">
                    - {item}
                  </li>
                ))}
              </ul>
            </div>

            {selectedFeedbackInsight.latestComments.length ? (
              <div className="border-t border-line pt-3">
                <p className="mb-2 text-xs font-semibold text-soft">
                  최근 코멘트
                </p>
                <div className="space-y-2">
                  {selectedFeedbackInsight.latestComments.map((comment) => (
                    <p key={comment} className="text-xs leading-5 text-muted">
                      {comment}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="border-t border-line pt-3">
              <p className="mb-2 text-xs font-semibold text-soft">
                반영 예정 변경
              </p>
              <ul className="space-y-2">
                {improvementPlan.changes.map((item) => (
                  <li key={item} className="text-xs leading-5 text-muted">
                    - {item}
                  </li>
                ))}
              </ul>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button
                  className={secondaryButtonClass}
                  type="button"
                  onClick={copyImprovementPlan}
                >
                  {improvementPlanCopied
                    ? "개선 계획 복사됨"
                    : manualCopy?.id === "improvement-plan"
                      ? "개선 계획 복사 실패"
                      : "개선 계획 복사"}
                </button>
                <button
                  className={secondaryButtonClass}
                  type="button"
                  onClick={openImprovementPlanInStudio}
                >
                  Studio로 보내기
                </button>
                <button
                  className={secondaryButtonClass}
                  type="button"
                  onClick={applyImprovementPlan}
                  disabled={!improvementPlan.canApply}
                >
                  개선안 템플릿에 반영
                </button>
              </div>
              {manualCopy?.id === "improvement-plan" ? (
                <div className="mt-3">
                  <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                    copy={manualCopy}
                    onClose={() => setManualCopy(null)}
                  />
                </div>
              ) : null}
              {improvementNotice ? (
                <p className="mt-2 text-xs font-medium text-accent">
                  {improvementNotice}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-line bg-surface p-4">
            <div>
              <p className="text-sm font-semibold">스킬 실행</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                이번 작업 자료를 넣어 실행용 프롬프트를 만들고 Library에 저장합니다.
              </p>
            </div>
            <textarea
              className={textareaClass}
              rows={6}
              value={runInput}
              onChange={(event) => {
                setRunInput(event.target.value);
                clearRunState();
              }}
              placeholder="이번 실행에 넣을 실제 자료, 조건, 대상, 원하는 결과를 입력"
            />
            <button
              className={secondaryButtonClass}
              type="button"
              onClick={generateRunPrompt}
              disabled={!draft.promptTemplate.trim() || !runInput.trim()}
            >
              실행 프롬프트 생성
            </button>

            {runPrompt ? (
              <div className="space-y-3">
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-panel p-3 font-mono text-[12px] leading-5 text-muted">
                  {runPrompt}
                </pre>
                <div className="grid gap-2">
                  <button
                    className={secondaryButtonClass}
                    type="button"
                    onClick={copyRunPrompt}
                  >
                    {runCopied
                      ? "실행 프롬프트 복사됨"
                      : manualCopy?.id === "run"
                        ? "실행 프롬프트 복사 실패"
                        : "실행 프롬프트 복사"}
                  </button>
                  <button
                    className={primaryButtonClass}
                    type="button"
                    onClick={saveRunToLibrary}
                  >
                    Library에 저장
                  </button>
                </div>
                {manualCopy?.id === "run" ? (
                  <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                    copy={manualCopy}
                    onClose={() => setManualCopy(null)}
                  />
                ) : null}
              </div>
            ) : null}

            {runNotice ? (
              <p className="text-xs font-medium text-accent">{runNotice}</p>
            ) : null}
            {savedRunPrompt ? (
              <div className="rounded-md border border-accent/20 bg-panel px-4 py-3">
                <p className="text-xs font-semibold text-soft">
                  실행 저장 완료
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-soft">
                  {savedRunPrompt.title}
                </p>
                <p className="mt-1 text-xs font-medium text-accent">
                  스킬 · {savedRunPrompt.sourceSkillName ?? draft.name}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Library 상세에서 실행 프롬프트 품질, 피드백, 재개선
                  흐름을 이어서 확인할 수 있습니다. 품질{" "}
                  {savedRunPrompt.versions[0]?.qualityScore.toFixed(1) ?? "-"}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    className={secondaryButtonClass}
                    type="button"
                    onClick={openSavedRunInLibrary}
                  >
                    Library 실행 보기
                  </button>
                  <button
                    className={secondaryButtonClass}
                    type="button"
                    onClick={copySavedRunLibraryLink}
                  >
                    {runLibraryLinkCopied
                      ? "실행 링크 복사됨"
                      : manualCopy?.id === "run-link"
                        ? "실행 링크 복사 실패"
                        : "실행 링크 복사"}
                  </button>
                </div>
                {manualCopy?.id === "run-link" ? (
                  <div className="mt-3">
                    <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                      copy={manualCopy}
                      onClose={() => setManualCopy(null)}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3">
            <button
              className={primaryButtonClass}
              type="button"
              onClick={saveSkill}
              disabled={!draft.name.trim() || !draft.promptTemplate.trim()}
            >
              {saved ? "스킬 저장됨" : "스킬 저장"}
            </button>
            {saved ? (
              <div className="rounded-md border border-accent/20 bg-panel px-4 py-3">
                <p className="text-xs font-semibold text-soft">
                  저장 완료
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  반복 업무로 사용하기 전에 샘플 입력으로 실행 프롬프트를
                  한 번 검증하세요.
                </p>
                <button
                  className={`${secondaryButtonClass} mt-3 w-full`}
                  type="button"
                  onClick={fillSavedSkillRunExample}
                >
                  실행 예시 채우기
                </button>
              </div>
            ) : null}
            <button
              className={secondaryButtonClass}
              type="button"
              onClick={copyTemplate}
              disabled={!draft.promptTemplate.trim()}
            >
              {copied
                ? "복사됨"
                : manualCopy?.id === "template"
                  ? "템플릿 복사 실패"
                  : "템플릿 복사"}
            </button>
            {manualCopy?.id === "template" ? (
              <ManualCopyPanel className="bg-panel" textareaBackground="bg-surface"
                copy={manualCopy}
                onClose={() => setManualCopy(null)}
              />
            ) : null}
            <button
              className={secondaryButtonClass}
              type="button"
              onClick={resetSkillDraft}
            >
              새 스킬 직접 작성
            </button>
          </div>
        </aside>
      </div>
    </Panel>
  );
}
