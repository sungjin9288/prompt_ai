import type { Dispatch, SetStateAction } from "react";
import {
  Panel,
  PanelHeader,
  inputClass,
  primaryButtonClass,
  selectClass,
  textareaClass,
} from "@/components/ui";
import type { MemoryScope } from "@/lib/prompt";
import {
  confidenceOptions,
  scopeLabels,
  trackedScopes,
} from "@/lib/learning-view/labels";

type ManualMemoryWorkflowStep = {
  detail: string;
  label: string;
  step: string;
  title: string;
};

interface LearningManualMemoryPanelProps {
  manualMemoryWorkflowSteps: ManualMemoryWorkflowStep[];
  manualScope: MemoryScope;
  setManualScope: Dispatch<SetStateAction<MemoryScope>>;
  setManualValidationMessage: Dispatch<SetStateAction<string>>;
  setManualSaved: Dispatch<SetStateAction<boolean>>;
  manualTitle: string;
  setManualTitle: Dispatch<SetStateAction<string>>;
  manualContent: string;
  setManualContent: Dispatch<SetStateAction<string>>;
  manualTags: string;
  setManualTags: Dispatch<SetStateAction<string>>;
  manualConfidence: number;
  setManualConfidence: Dispatch<SetStateAction<number>>;
  saveManualMemory: () => void;
  manualSaved: boolean;
  manualValidationMessage: string;
}

export function LearningManualMemoryPanel({
  manualMemoryWorkflowSteps,
  manualScope,
  setManualScope,
  setManualValidationMessage,
  setManualSaved,
  manualTitle,
  setManualTitle,
  manualContent,
  setManualContent,
  manualTags,
  setManualTags,
  manualConfidence,
  setManualConfidence,
  saveManualMemory,
  manualSaved,
  manualValidationMessage,
}: LearningManualMemoryPanelProps) {
  return (
        <Panel
          id="learning-manual-memory"
          className="scroll-mt-64 lg:col-start-1 lg:scroll-mt-6"
        >
          <PanelHeader
            title="수동 메모리 추가"
            description="회사 기준, 개인 선호, 분야 규칙, 반복 업무 패턴을 직접 학습 메모리로 저장합니다."
          />
          <div className="space-y-4 p-5">
            <div
              data-testid="learning-manual-memory-workflow"
              className="grid gap-3"
            >
              {manualMemoryWorkflowSteps.map((item) => (
                <div
                  key={item.step}
                  className="min-w-0 rounded-md border border-line bg-surface px-3 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] font-semibold text-accent">
                      {item.step}
                    </span>
                    <p className="text-xs font-semibold text-muted">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-3 break-words text-sm font-semibold text-soft">
                    {item.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">범위</span>
              <select
                className={selectClass}
                value={manualScope}
                onChange={(event) => {
                  setManualScope(event.target.value as MemoryScope);
                  setManualValidationMessage("");
                  setManualSaved(false);
                }}
              >
                {trackedScopes.map((item) => (
                  <option key={item} value={item}>
                    {scopeLabels[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">제목</span>
              <input
                className={inputClass}
                value={manualTitle}
                onChange={(event) => {
                  setManualTitle(event.target.value);
                  setManualSaved(false);
                  setManualValidationMessage("");
                }}
                placeholder="예: 투자자 문서 회사 기준"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">내용</span>
              <textarea
                className={`${textareaClass} min-h-28`}
                value={manualContent}
                onChange={(event) => {
                  setManualContent(event.target.value);
                  setManualSaved(false);
                  setManualValidationMessage("");
                }}
                placeholder="다음 생성에 반영할 구체적인 기준을 적어주세요."
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">태그</span>
              <input
                className={inputClass}
                value={manualTags}
                onChange={(event) => {
                  setManualTags(event.target.value);
                  setManualSaved(false);
                  setManualValidationMessage("");
                }}
                placeholder="기획, 투자자, Codex"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-soft">
                신뢰도
              </span>
              <select
                className={selectClass}
                value={manualConfidence}
                onChange={(event) => {
                  setManualConfidence(Number(event.target.value));
                  setManualSaved(false);
                  setManualValidationMessage("");
                }}
              >
                {confidenceOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label} ({item.value.toFixed(2)})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={`${primaryButtonClass} w-full`}
              onClick={saveManualMemory}
              disabled={!manualTitle.trim() || !manualContent.trim()}
            >
              {manualSaved ? "저장됨" : "학습 메모리 저장"}
            </button>
            {manualValidationMessage ? (
              <p className="rounded-md border border-attention/40 bg-surface px-3 py-2 text-xs leading-5 text-attention">
                {manualValidationMessage}
              </p>
            ) : null}
          </div>
        </Panel>
  );
}
