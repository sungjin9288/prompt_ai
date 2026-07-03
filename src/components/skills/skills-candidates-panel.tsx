import { Panel, PanelHeader } from "@/components/ui";
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
          <div className="px-5 py-10 text-sm leading-6 text-muted">
            아직 후보가 없습니다. Studio에서 프롬프트를 생성하고 Library에 저장하세요.
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
