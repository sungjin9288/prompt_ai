import { describe, expect, it } from "vitest";

import { createSkillFromPrompt, getBestVersion, getSkillCandidates } from "@/lib/skills/skill-builder";
import type {
  LearningMemory,
  PromptAsset,
  PromptScoreBreakdown,
  PromptVersion,
} from "@/lib/prompt/types";

function makeScoreBreakdown(): PromptScoreBreakdown {
  return {
    clarity: 4,
    context: 4,
    outputFormat: 4,
    constraints: 4,
    expertise: 4,
    modelFit: 4,
    reusability: 4,
  };
}

function makeVersion(overrides: Partial<PromptVersion> = {}): PromptVersion {
  return {
    id: "version-1",
    targetModel: "claude",
    modelLabel: "Claude",
    content: "역할: 분석가\n품질 기준:\n- 근거가 명확한가\n- 출력 형식이 구체적인가",
    qualityScore: 4.0,
    scoreBreakdown: makeScoreBreakdown(),
    assumptions: [],
    missingContext: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makePrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  return {
    id: "prompt-1",
    title: "분기 보고서 스킬화",
    source: "local",
    rawInput: "분기 보고서를 요약해줘",
    goal: "보고서 요약",
    domain: "리서치",
    targetModels: ["claude"],
    versions: [makeVersion()],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeMemory(overrides: Partial<LearningMemory> = {}): LearningMemory {
  return {
    id: "memory-1",
    scope: "domain",
    sourceType: "feedback",
    sourceId: "feedback-1",
    title: "메모리 제목",
    content: "요약은 항상 표 형식으로 제공한다",
    tags: ["리서치"],
    confidence: 0.8,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getBestVersion", () => {
  it("selects the version with the highest quality score", () => {
    const low = makeVersion({ id: "low", qualityScore: 2.5 });
    const high = makeVersion({ id: "high", qualityScore: 4.8 });
    const prompt = makePrompt({ versions: [low, high] });

    expect(getBestVersion(prompt).id).toBe("high");
  });
});

describe("createSkillFromPrompt", () => {
  it("derives domain, targetModel, and template from the prompt and version", () => {
    const version = makeVersion();
    const prompt = makePrompt({ versions: [version] });
    const skill = createSkillFromPrompt(prompt, version, []);

    expect(skill.domain).toBe(prompt.domain);
    expect(skill.targetModel).toBe(version.targetModel);
    expect(skill.sourcePromptId).toBe(prompt.id);
    expect(skill.sourceVersionId).toBe(version.id);
    expect(skill.promptTemplate).toContain(version.content);
  });

  it("preserves the Korean prompt domain and goal wording in the generated name and description", () => {
    const version = makeVersion();
    const prompt = makePrompt({ domain: "법률/규정", goal: "계약서 검토" });
    const skill = createSkillFromPrompt(prompt, version, []);

    expect(skill.name).toBe("법률/규정 스킬");
    expect(skill.description).toContain("계약서 검토");
    expect(skill.description).toContain(version.modelLabel);
  });

  it("defaults languageStrategy to hybrid and outputLanguage to korean when unset on the prompt", () => {
    const version = makeVersion();
    const prompt = makePrompt({ languageStrategy: undefined, outputLanguage: undefined });
    const skill = createSkillFromPrompt(prompt, version, []);

    expect(skill.languageStrategy).toBe("hybrid");
    expect(skill.outputLanguage).toBe("korean");
  });

  it("extracts the quality checklist from the '품질 기준:' section of the prompt content", () => {
    const version = makeVersion({
      content: "역할: 분석가\n품질 기준:\n- 근거가 명확한가\n- 출력 형식이 구체적인가",
    });
    const prompt = makePrompt({ versions: [version] });
    const skill = createSkillFromPrompt(prompt, version, []);

    expect(skill.qualityChecklist).toEqual([
      "근거가 명확한가",
      "출력 형식이 구체적인가",
    ]);
  });

  it("falls back to a default quality checklist when no '품질 기준:' section exists", () => {
    const version = makeVersion({ content: "역할: 분석가\n목표: 요약" });
    const prompt = makePrompt({ versions: [version] });
    const skill = createSkillFromPrompt(prompt, version, []);

    expect(skill.qualityChecklist.length).toBeGreaterThan(0);
    expect(skill.qualityChecklist).toContain("역할과 목표가 명확한가");
  });

  it("includes matching domain memory notes in the prompt template", () => {
    const version = makeVersion();
    const prompt = makePrompt({ domain: "리서치" });
    const memory = makeMemory({ tags: ["리서치"], content: "표 형식으로 정리한다" });
    const skill = createSkillFromPrompt(prompt, version, [memory]);

    expect(skill.promptTemplate).toContain("반복 반영 메모리:");
    expect(skill.promptTemplate).toContain("표 형식으로 정리한다");
  });

  it("includes company-scoped memories regardless of domain tag match", () => {
    const version = makeVersion();
    const prompt = makePrompt({ domain: "리서치" });
    const memory = makeMemory({
      scope: "company",
      tags: ["마케팅"],
      content: "회사 공통 규칙을 적용한다",
    });
    const skill = createSkillFromPrompt(prompt, version, [memory]);

    expect(skill.promptTemplate).toContain("회사 공통 규칙을 적용한다");
  });

  it("omits the memory notes section entirely when no memories match", () => {
    const version = makeVersion();
    const prompt = makePrompt({ domain: "리서치" });
    const unrelatedMemory = makeMemory({ scope: "domain", tags: ["마케팅"] });
    const skill = createSkillFromPrompt(prompt, version, [unrelatedMemory]);

    expect(skill.promptTemplate).not.toContain("반복 반영 메모리:");
  });

  it("tags the skill with domain, targetModel, and the literal 'skill' tag", () => {
    const version = makeVersion();
    const prompt = makePrompt({ domain: "리서치" });
    const skill = createSkillFromPrompt(prompt, version, []);

    expect(skill.tags).toEqual(["리서치", version.targetModel, "skill"]);
  });

  it("initializes usageCount at zero", () => {
    const version = makeVersion();
    const prompt = makePrompt();
    const skill = createSkillFromPrompt(prompt, version, []);

    expect(skill.usageCount).toBe(0);
  });
});

describe("getSkillCandidates", () => {
  it("ranks prompts by best version quality score plus a feedback bonus", () => {
    const lowScoreVersion = makeVersion({ id: "low", qualityScore: 3.0 });
    const lowScorePrompt = makePrompt({
      id: "prompt-low",
      versions: [lowScoreVersion],
      feedback: [],
    });

    const highScoreVersion = makeVersion({ id: "high", qualityScore: 4.5 });
    const highScorePrompt = makePrompt({
      id: "prompt-high",
      versions: [highScoreVersion],
      feedback: [],
    });

    const candidates = getSkillCandidates([lowScorePrompt, highScorePrompt]);

    expect(candidates[0].prompt.id).toBe("prompt-high");
  });

  it("limits results to at most eight candidates", () => {
    const prompts = Array.from({ length: 12 }, (_, index) =>
      makePrompt({
        id: `prompt-${index}`,
        versions: [makeVersion({ id: `v-${index}`, qualityScore: index })],
      }),
    );

    expect(getSkillCandidates(prompts)).toHaveLength(8);
  });
});
