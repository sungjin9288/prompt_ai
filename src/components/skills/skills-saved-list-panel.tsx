import { Panel, PanelHeader, inputClass } from "@/components/ui";
import { EmptyState } from "@/components/common/empty-state";
import {
  languageStrategyLabels,
  modelLabels,
  outputLanguageLabels,
  type PromptSkill,
} from "@/lib/prompt";
import {
  getSkillLanguageStrategy,
  getSkillOutputLanguage,
} from "@/lib/skills/skill-runner";
import { formatTimestamp } from "@/lib/skills-view/labels";

interface SkillsSavedListPanelProps {
  query: string;
  setQuery: (value: string) => void;
  filteredSkills: PromptSkill[];
  editSkill: (skill: PromptSkill) => void;
}

export function SkillsSavedListPanel({
  query,
  setQuery,
  filteredSkills,
  editSkill,
}: SkillsSavedListPanelProps) {
  return (
    <Panel>
      <PanelHeader
        title="저장된 스킬"
        description="반복 업무 템플릿으로 재사용할 수 있는 스킬입니다."
      />
      <div className="border-b border-line p-4">
        <input
          className={inputClass}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="스킬 검색"
        />
      </div>
      <div className="max-h-[420px] overflow-auto">
        {filteredSkills.map((skill) => (
          <button
            key={skill.id}
            type="button"
            className="block w-full border-b border-line px-5 py-4 text-left transition hover:bg-surface"
            onClick={() => editSkill(skill)}
          >
            <p className="text-sm font-semibold">{skill.name}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
              {skill.description}
            </p>
            <p className="mt-2 text-xs text-accent">
              {skill.domain} · {modelLabels[skill.targetModel]} ·{" "}
              {languageStrategyLabels[getSkillLanguageStrategy(skill)]} · 사용{" "}
              {skill.usageCount}회 · 답변{" "}
              {outputLanguageLabels[getSkillOutputLanguage(skill)]}
              {skill.lastRunAt ? ` · ${formatTimestamp(skill.lastRunAt)}` : ""}
            </p>
          </button>
        ))}
        {filteredSkills.length === 0 ? (
          <EmptyState
            title="저장된 스킬이 없어요"
            description="위 후보에서 좋은 프롬프트를 골라 스킬 템플릿으로 저장하면, 반복 업무를 한 번에 실행할 수 있어요."
          />
        ) : null}
      </div>
    </Panel>
  );
}
