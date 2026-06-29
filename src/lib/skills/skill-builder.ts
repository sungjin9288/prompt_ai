import type {
  LearningMemory,
  PromptAsset,
  PromptSkill,
  PromptVersion,
} from "@/lib/prompt";
import { stripMemoryReferenceLinks } from "@/lib/learning/memory";

function makeId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}

function normalizeChecklist(items: string[]) {
  return items
    .map((item) => item.replace(/^- /, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function extractChecklistFromPrompt(content: string) {
  const marker = "품질 기준:";
  const index = content.indexOf(marker);

  if (index === -1) {
    return [];
  }

  return normalizeChecklist(
    content
      .slice(index + marker.length)
      .split("\n")
      .filter((line) => line.trim().startsWith("-")),
  );
}

function topMemoriesForDomain(domain: string, memories: LearningMemory[]) {
  return memories
    .filter((memory) => memory.tags.includes(domain) || memory.scope === "company")
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4)
    .map((memory) => stripMemoryReferenceLinks(memory.content))
    .filter(Boolean);
}

export function getBestVersion(prompt: PromptAsset): PromptVersion {
  return prompt.versions
    .slice()
    .sort((a, b) => b.qualityScore - a.qualityScore)[0];
}

export function createSkillFromPrompt(
  prompt: PromptAsset,
  version: PromptVersion,
  memories: LearningMemory[],
): PromptSkill {
  const now = new Date().toISOString();
  const memoryNotes = topMemoriesForDomain(prompt.domain, memories);
  const checklist = extractChecklistFromPrompt(version.content);

  return {
    id: makeId("skill"),
    name: `${prompt.domain} 스킬`,
    description: `${prompt.goal} 작업을 ${version.modelLabel}에 맞게 반복 실행하는 템플릿`,
    domain: prompt.domain,
    targetModel: version.targetModel,
    languageStrategy: prompt.languageStrategy ?? "hybrid",
    languageDecision: prompt.languageDecision,
    outputLanguage: prompt.outputLanguage ?? "korean",
    sourcePromptId: prompt.id,
    sourceVersionId: version.id,
    inputGuide:
      "이번 작업의 배경, 대상, 원문 자료, 반드시 반영할 제약 조건을 입력한다.",
    promptTemplate: `${version.content}

반복 실행 입력:
[여기에 이번 실행의 실제 자료와 조건을 넣는다]${
      memoryNotes.length
        ? `\n\n반복 반영 메모리:\n${memoryNotes.map((item) => `- ${item}`).join("\n")}`
        : ""
    }`,
    outputFormat: "최종 프롬프트, 실행 결과 구조, 확인 질문, 품질 체크리스트",
    qualityChecklist: checklist.length
      ? checklist
      : [
          "역할과 목표가 명확한가",
          "입력 자료와 제약 조건이 분리되어 있는가",
          "출력 형식이 바로 실행 가능할 만큼 구체적인가",
        ],
    tags: [prompt.domain, version.targetModel, "skill"],
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function getSkillCandidates(prompts: PromptAsset[]) {
  return prompts
    .map((prompt) => {
      const bestVersion = getBestVersion(prompt);

      return {
        prompt,
        bestVersion,
        score: bestVersion.qualityScore + prompt.feedback.length * 0.3,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
