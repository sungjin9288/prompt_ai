import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import {
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
import type { LearningMemory, MemoryScope } from "@/lib/prompt";
import { splitMemoryContentDisplay } from "@/lib/learning/memory";
import {
  confidenceOptions,
  formatDate,
  reviewFilterLabels,
  scopeLabels,
  sortLabels,
  sourceTypeLabels,
  trackedScopes,
  type LearningReviewFilter,
  type LearningSortMode,
} from "@/lib/learning-view/labels";
import type { LearningManualCopy } from "./learning-view-types";

interface LearningMemoryListPanelProps {
  reviewFilter: LearningReviewFilter;
  sortMode: LearningSortMode;
  deletedManualMemoryTitle: string;
  filtered: LearningMemory[];
  editingMemoryId: string;
  editScope: MemoryScope;
  setEditScope: Dispatch<SetStateAction<MemoryScope>>;
  setEditValidationMessage: Dispatch<SetStateAction<string>>;
  editTitle: string;
  setEditTitle: Dispatch<SetStateAction<string>>;
  editContent: string;
  setEditContent: Dispatch<SetStateAction<string>>;
  editTags: string;
  setEditTags: Dispatch<SetStateAction<string>>;
  editConfidence: number;
  setEditConfidence: Dispatch<SetStateAction<number>>;
  editValidationMessage: string;
  saveEditedManualMemory: (memoryId: string) => void;
  cancelEditingManualMemory: () => void;
  copyMemoryReport: (memory: LearningMemory) => void;
  copiedMemoryId: string;
  failedMemoryCopyId: string;
  openMemoryInStudio: (memory: LearningMemory) => void;
  startEditingManualMemory: (memory: LearningMemory) => void;
  deleteManualMemory: (memory: LearningMemory) => void;
  learningManualCopy: LearningManualCopy | null;
  setLearningManualCopy: (copy: LearningManualCopy | null) => void;
}

export function LearningMemoryListPanel({
  reviewFilter,
  sortMode,
  deletedManualMemoryTitle,
  filtered,
  editingMemoryId,
  editScope,
  setEditScope,
  setEditValidationMessage,
  editTitle,
  setEditTitle,
  editContent,
  setEditContent,
  editTags,
  setEditTags,
  editConfidence,
  setEditConfidence,
  editValidationMessage,
  saveEditedManualMemory,
  cancelEditingManualMemory,
  copyMemoryReport,
  copiedMemoryId,
  failedMemoryCopyId,
  openMemoryInStudio,
  startEditingManualMemory,
  deleteManualMemory,
  learningManualCopy,
  setLearningManualCopy,
}: LearningMemoryListPanelProps) {
  return (
        <Panel>
          <PanelHeader
            title="축적된 메모리"
            description={`${reviewFilterLabels[reviewFilter]} 기준 · ${sortLabels[sortMode]}`}
          />
          {deletedManualMemoryTitle ? (
            <div className="border-b border-line bg-surface px-5 py-3">
              <p className="text-xs leading-5 text-muted">
                수동 메모리 삭제됨 · {deletedManualMemoryTitle}
              </p>
            </div>
          ) : null}
          <div className="divide-y divide-line">
            {filtered.map((memory) => {
              const memoryContentDisplay = splitMemoryContentDisplay(
                memory.content,
              );

              return (
              <article
                key={memory.id}
                className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_180px]"
              >
                <div className="min-w-0">
                  {editingMemoryId === memory.id ? (
                    <div className="space-y-3 rounded-md border border-line bg-surface px-3 py-3">
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-soft">
                          범위
                        </span>
                        <select
                          className={selectClass}
                          value={editScope}
                          onChange={(event) => {
                            setEditScope(event.target.value as MemoryScope);
                            setEditValidationMessage("");
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
                        <span className="mb-2 block text-xs font-medium text-soft">
                          제목
                        </span>
                        <input
                          className={inputClass}
                          value={editTitle}
                          onChange={(event) => {
                            setEditTitle(event.target.value);
                            setEditValidationMessage("");
                          }}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-soft">
                          내용
                        </span>
                        <textarea
                          className={`${textareaClass} min-h-28`}
                          value={editContent}
                          onChange={(event) => {
                            setEditContent(event.target.value);
                            setEditValidationMessage("");
                          }}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-soft">
                          태그
                        </span>
                        <input
                          className={inputClass}
                          value={editTags}
                          onChange={(event) => {
                            setEditTags(event.target.value);
                            setEditValidationMessage("");
                          }}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-soft">
                          신뢰도
                        </span>
                        <select
                          className={selectClass}
                          value={editConfidence}
                          onChange={(event) => {
                            setEditConfidence(Number(event.target.value));
                            setEditValidationMessage("");
                          }}
                        >
                          {confidenceOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label} ({item.value.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </label>
                      {editValidationMessage ? (
                        <p className="rounded-md border border-attention/40 bg-background px-3 py-2 text-xs leading-5 text-attention">
                          {editValidationMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                          {scopeLabels[memory.scope]}
                        </span>
                        <span className="text-xs text-muted">
                          {sourceTypeLabels[memory.sourceType]} ·{" "}
                          {formatDate(memory.updatedAt)}
                        </span>
                      </div>
                      <h2 className="mt-3 text-sm font-semibold">{memory.title}</h2>
                      {memoryContentDisplay.body ? (
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-soft">
                          {memoryContentDisplay.body}
                        </p>
                      ) : null}
                      {memoryContentDisplay.links.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {memoryContentDisplay.links.map((link) => (
                            <Link
                              key={`${memory.id}:${link.label}:${link.href}`}
                              href={link.href}
                              className="rounded-md border border-line bg-surface px-2 py-1 text-xs font-semibold text-accent transition hover:border-accent hover:bg-panel-strong"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {memory.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-line px-2 py-1 text-xs text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="self-center">
                  <ScoreBar label="신뢰도" value={memory.confidence * 5} />
                  {editingMemoryId === memory.id ? (
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        className={`${primaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => saveEditedManualMemory(memory.id)}
                        disabled={!editTitle.trim() || !editContent.trim()}
                      >
                        수정 저장
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={cancelEditingManualMemory}
                      >
                        취소
                      </button>
                    </div>
                  ) : memory.sourceType === "manual" ? (
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => copyMemoryReport(memory)}
                      >
                        {copiedMemoryId === memory.id
                          ? "메모리 복사됨"
                          : failedMemoryCopyId === memory.id
                            ? "메모리 복사 실패"
                            : "메모리 복사"}
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => openMemoryInStudio(memory)}
                      >
                        Studio로 보내기
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => startEditingManualMemory(memory)}
                      >
                        수동 메모리 편집
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => deleteManualMemory(memory)}
                      >
                        수동 메모리 삭제
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-2">
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => copyMemoryReport(memory)}
                      >
                        {copiedMemoryId === memory.id
                          ? "메모리 복사됨"
                          : failedMemoryCopyId === memory.id
                            ? "메모리 복사 실패"
                            : "메모리 복사"}
                      </button>
                      <button
                        type="button"
                        className={`${secondaryButtonClass} w-full min-h-9 px-3 py-1.5 text-xs`}
                        onClick={() => openMemoryInStudio(memory)}
                      >
                        Studio로 보내기
                      </button>
                    </div>
                  )}
                </div>
                {learningManualCopy?.id === `memory:${memory.id}` ? (
                  <div className="lg:col-span-2">
                    <ManualCopyPanel
                      copy={learningManualCopy}
                      onClose={() => setLearningManualCopy(null)}
                    />
                  </div>
                ) : null}
              </article>
              );
            })}

            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-sm text-muted">
                아직 학습 메모리가 없습니다. Library에서 프롬프트에 피드백을 남기면 자동으로 생성됩니다.
              </div>
            ) : null}
          </div>
        </Panel>
  );
}
