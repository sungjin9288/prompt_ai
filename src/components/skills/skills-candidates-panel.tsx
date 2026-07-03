import { Panel, PanelHeader } from "@/components/ui";
import { EmptyState } from "@/components/common/empty-state";
import { languageStrategyLabels, outputLanguageLabels } from "@/lib/prompt";
import type { getSkillCandidates } from "@/lib/skills/skill-builder";

interface SkillsCandidatesPanelProps {
  candidates: ReturnType<typeof getSkillCandidates>;
  selectedPromptId: string;
  loadFromPrompt: (promptId: string) => void;
}

export function SkillsCandidatesPanel({
  candidates,
  selectedPromptId,
  loadFromPrompt,
}: SkillsCandidatesPanelProps) {
  return (
    <Panel id="skills-candidates" className="scroll-mt-6">
      <PanelHeader
        title="스킬 후보"
        description="품질 점수와 피드백이 높은 프롬프트를 우선 추천합니다."
      />
      <div className="divide-y divide-line">
        {candidates.map(({ prompt, bestVersion, score }) => (
          <button
            key={prompt.id}
            type="button"
            className={`block w-full px-5 py-4 text-left transition hover:bg-surface ${
              selectedPromptId === prompt.id ? "bg-panel-strong" : ""
            }`}
            onClick={() => loadFromPrompt(prompt.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-2 text-sm font-semibold">{prompt.title}</p>
              <span className="font-mono text-sm text-accent">
                {score.toFixed(1)}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              {prompt.domain} · {bestVersion.modelLabel} ·{" "}
              {languageStrategyLabels[prompt.languageStrategy ?? "hybrid"]} ·
              답변 {outputLanguageLabels[prompt.outputLanguage ?? "korean"]} ·
              피드백 {prompt.feedback.length}개
            </p>
          </button>
        ))}

        {candidates.length === 0 ? (
          <EmptyState
            title="아직 스킬 후보가 없어요"
            description="Studio에서 프롬프트를 생성해 Library에 저장하면, 반복 실행할 스킬 후보로 여기에 나타나요."
            action={{ label: "Studio 열기", href: "/studio" }}
          />
        ) : null}
      </div>
    </Panel>
  );
}
