import { describe, expect, it } from "vitest";

import {
  buildSkillRunPrompt,
  createPromptFromSkillRun,
  getSkillRunStats,
  listSkillRuns,
} from "@/lib/skills/skill-runner";
import type { PromptAsset, PromptSkill } from "@/lib/prompt/types";

function makeSkill(overrides: Partial<PromptSkill> = {}): PromptSkill {
  return {
    id: "skill-1",
    name: "분기 보고서 스킬",
    description: "분기 보고서를 요약하는 스킬입니다",
    domain: "리서치",
    targetModel: "claude",
    inputGuide: "요약할 원문을 붙여넣습니다",
    promptTemplate: "역할: 분석가\n목표: 분기 보고서 요약",
    outputFormat: "요약, 핵심 지표, 리스크",
    qualityChecklist: ["핵심 수치가 정확한가", "리스크가 명시되었는가"],
    tags: ["리서치", "claude", "skill"],
    usageCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makePrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  return {
    id: "prompt-1",
    title: "분기 보고서 스킬 · 실행",
    source: "local",
    rawInput: "1분기 매출 데이터를 요약해줘",
    goal: "스킬 실행",
    domain: "리서치",
    targetModels: ["claude"],
    versions: [
      {
        id: "version-1",
        targetModel: "claude",
        modelLabel: "Claude",
        content: "본문",
        qualityScore: 4.0,
        scoreBreakdown: {
          clarity: 4,
          context: 4,
          outputFormat: 4,
          constraints: 4,
          expertise: 4,
          modelFit: 4,
          reusability: 4,
        },
        assumptions: [],
        missingContext: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildSkillRunPrompt", () => {
  it("includes the skill name, domain, template, and trimmed run input", () => {
    const skill = makeSkill();
    const prompt = buildSkillRunPrompt(skill, "  분기 매출을 정리해줘  ");

    expect(prompt).toContain(skill.name);
    expect(prompt).toContain(skill.domain);
    expect(prompt).toContain(skill.promptTemplate);
    expect(prompt).toContain("분기 매출을 정리해줘");
    expect(prompt).not.toContain("  분기 매출을 정리해줘  \n\nTask");
  });

  it("renders each quality checklist item as a bullet line", () => {
    const skill = makeSkill({ qualityChecklist: ["A 확인", "B 확인"] });
    const prompt = buildSkillRunPrompt(skill, "입력");

    expect(prompt).toContain("- A 확인");
    expect(prompt).toContain("- B 확인");
  });

  it("falls back to a default quality checklist line when the skill has none", () => {
    const skill = makeSkill({ qualityChecklist: [] });
    const prompt = buildSkillRunPrompt(skill, "입력");

    expect(prompt).toContain("- 역할, 목표, 입력, 제약 조건, 출력 형식이 분리되어 있는가");
  });

  it("uses hybrid-strategy language guidance by default when languageStrategy is unset", () => {
    const skill = makeSkill({ languageStrategy: undefined });
    const prompt = buildSkillRunPrompt(skill, "입력");

    expect(prompt).toContain(
      "Use English for role, objective, task instructions, constraints, output format, and quality criteria.",
    );
  });

  it("uses english-strategy language guidance when languageStrategy is 'english'", () => {
    const skill = makeSkill({ languageStrategy: "english" });
    const prompt = buildSkillRunPrompt(skill, "입력");

    expect(prompt).toContain("Write the final executable prompt primarily in English.");
  });
});

describe("createPromptFromSkillRun", () => {
  it("links the generated prompt back to the source skill", () => {
    const skill = makeSkill();
    const prompt = createPromptFromSkillRun(skill, "1분기 매출 데이터를 요약해줘");

    expect(prompt.sourceSkillId).toBe(skill.id);
    expect(prompt.sourceSkillName).toBe(skill.name);
    expect(prompt.goal).toBe("스킬 실행");
    expect(prompt.domain).toBe(skill.domain);
    expect(prompt.targetModels).toEqual([skill.targetModel]);
  });

  it("builds a single scored version whose content matches buildSkillRunPrompt output", () => {
    const skill = makeSkill();
    const prompt = createPromptFromSkillRun(skill, "1분기 매출 데이터를 요약해줘");

    expect(prompt.versions).toHaveLength(1);
    expect(prompt.versions[0].content).toBe(
      buildSkillRunPrompt(skill, "1분기 매출 데이터를 요약해줘"),
    );
    expect(prompt.versions[0].qualityScore).toBeGreaterThan(0);
  });

  it("flags missing context when the run input is blank", () => {
    const skill = makeSkill();
    const prompt = createPromptFromSkillRun(skill, "   ");

    expect(prompt.versions[0].missingContext).toContain(
      "이번 실행 입력이 비어 있으면 실제 자료가 필요함",
    );
  });

  it("does not flag missing context when the run input has content", () => {
    const skill = makeSkill();
    const prompt = createPromptFromSkillRun(skill, "실제 데이터 있음");

    expect(prompt.versions[0].missingContext).toHaveLength(0);
  });

  it("truncates a long run input to build a compact title", () => {
    const skill = makeSkill();
    const longInput = "가".repeat(50);
    const prompt = createPromptFromSkillRun(skill, longInput);

    expect(prompt.title.length).toBeLessThan(longInput.length + skill.name.length + 10);
    expect(prompt.title).toContain("...");
  });
});

describe("listSkillRuns", () => {
  it("returns only prompts created from a skill run when no skill filter is given", () => {
    const skillRun = makePrompt({ id: "run-1" });
    const regularPrompt = makePrompt({ id: "regular-1", goal: "일반 목표", sourceSkillId: undefined });

    const runs = listSkillRuns([skillRun, regularPrompt]);

    expect(runs.map((prompt) => prompt.id)).toEqual(["run-1"]);
  });

  it("filters runs to the given skill via sourceSkillId", () => {
    const skillA = makeSkill({ id: "skill-a" });
    const skillB = makeSkill({ id: "skill-b" });
    const runForA = makePrompt({ id: "run-a", sourceSkillId: "skill-a" });
    const runForB = makePrompt({ id: "run-b", sourceSkillId: "skill-b" });

    const runsForA = listSkillRuns([runForA, runForB], skillA);

    expect(runsForA.map((prompt) => prompt.id)).toEqual(["run-a"]);
    expect(listSkillRuns([runForA, runForB], skillB).map((prompt) => prompt.id)).toEqual(["run-b"]);
  });

  it("sorts matching runs by createdAt descending", () => {
    const older = makePrompt({ id: "older", createdAt: "2026-01-01T00:00:00.000Z" });
    const newer = makePrompt({ id: "newer", createdAt: "2026-02-01T00:00:00.000Z" });

    const runs = listSkillRuns([older, newer]);

    expect(runs.map((prompt) => prompt.id)).toEqual(["newer", "older"]);
  });
});

describe("getSkillRunStats", () => {
  it("counts total runs and active skills with at least one run", () => {
    const skill = makeSkill();
    const run = makePrompt({ sourceSkillId: skill.id });

    const stats = getSkillRunStats([run], [skill]);

    expect(stats.totalRuns).toBe(1);
    expect(stats.activeSkills).toBe(1);
    expect(stats.latestRun?.id).toBe(run.id);
  });

  it("excludes skills with zero runs and no prior usageCount from topSkills", () => {
    const unusedSkill = makeSkill({ id: "unused", usageCount: 0 });

    const stats = getSkillRunStats([], [unusedSkill]);

    expect(stats.topSkills).toHaveLength(0);
    expect(stats.activeSkills).toBe(0);
  });

  it("sums feedback across all skill-run prompts", () => {
    const skill = makeSkill();
    const run = makePrompt({
      sourceSkillId: skill.id,
      feedback: [
        {
          id: "f1",
          promptVersionId: "version-1",
          rating: 5,
          comment: "좋음",
          feedbackType: "tone",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    const stats = getSkillRunStats([run], [skill]);

    expect(stats.feedbackCount).toBe(1);
  });
});
