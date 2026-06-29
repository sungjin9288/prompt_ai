import type { PromptSkill } from "@/lib/prompt";
import type { SkillFeedbackInsight } from "@/lib/skills/skill-runner";

export interface SkillImprovementPlan {
  canApply: boolean;
  changes: string[];
  nextSkill: PromptSkill;
}

const feedbackSectionTitle = "피드백 기반 개선 지시:";

function truncate(value: string, limit = 120) {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= limit) {
    return compact;
  }

  return `${compact.slice(0, limit)}...`;
}

function appendUnique(items: string[], additions: string[], limit = 12) {
  const seen = new Set(items.map((item) => item.trim()));

  return [
    ...items,
    ...additions.filter((item) => {
      const normalized = item.trim();

      if (!normalized || seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    }),
  ].slice(0, limit);
}

function appendTextOnce(value: string, addition: string) {
  const trimmed = value.trim();

  if (trimmed.includes(addition)) {
    return trimmed;
  }

  return trimmed ? `${trimmed}\n${addition}` : addition;
}

function replaceFeedbackSection(promptTemplate: string, lines: string[]) {
  const trimmed = promptTemplate.trim();
  const marker = `\n\n${feedbackSectionTitle}`;
  const markerIndex = trimmed.indexOf(marker);
  const base = markerIndex === -1 ? trimmed : trimmed.slice(0, markerIndex).trim();

  return `${base}\n\n${feedbackSectionTitle}\n${lines
    .map((line) => `- ${line}`)
    .join("\n")}`;
}

function guidanceForType(type?: string) {
  switch (type) {
    case "format":
      return {
        promptLines: [
          "출력물에는 실제 사용 가능한 목차, 예시 구조, 분량 또는 시간 기준을 포함한다.",
          "결과가 바로 실행 가능한지 확인할 수 있도록 확인 질문과 품질 체크리스트를 분리한다.",
        ],
        outputAddition:
          "실행 가능한 목차/예시 구조, 분량 또는 시간 기준, 확인 질문, 품질 체크리스트",
        checklist: [
          "출력 형식에 실제 사용 가능한 목차나 예시 구조가 포함되어 있는가",
          "분량, 시간, 표 형식 등 실행 기준이 충분히 구체적인가",
        ],
        inputGuide:
          "원하는 결과물의 분량, 목차 수준, 사용 상황, 반드시 포함할 예시를 함께 입력한다.",
      };
    case "tone":
      return {
        promptLines: [
          "사용자와 회사의 선호 톤을 결과물의 첫 번째 제약 조건으로 반영한다.",
          "과장된 표현, 모호한 표현, 금지 표현이 있으면 대체 문구를 제안한다.",
        ],
        outputAddition: "톤 기준, 대체 문구, 최종 문안",
        checklist: [
          "사용자/회사 톤 기준이 결과물 문장에 직접 반영되어 있는가",
          "과장되거나 모호한 표현을 더 명확한 문장으로 바꿨는가",
        ],
        inputGuide:
          "원하는 톤, 피해야 할 표현, 참고할 회사 문체 예시를 함께 입력한다.",
      };
    case "context":
      return {
        promptLines: [
          "입력 자료를 배경, 대상, 원문, 제약 조건, 성공 기준으로 분리해 해석한다.",
          "부족한 맥락은 가정과 확인 질문으로 나눠 표시한다.",
        ],
        outputAddition: "입력 맥락 요약, 가정, 확인 질문, 최종 결과",
        checklist: [
          "배경, 대상, 원문, 제약 조건이 분리되어 있는가",
          "부족한 맥락을 가정과 확인 질문으로 구분했는가",
        ],
        inputGuide:
          "배경, 대상, 원문 자료, 제약 조건, 성공 기준을 분리해서 입력한다.",
      };
    case "accuracy":
      return {
        promptLines: [
          "확인되지 않은 수치, 사례, 성과, 고객명은 단정하지 않는다.",
          "불확실한 내용은 확인 필요 항목으로 분리한다.",
        ],
        outputAddition: "근거, 가정, 확인 필요 항목, 최종 결과",
        checklist: [
          "확인되지 않은 사실을 단정하지 않았는가",
          "가정과 확인 필요 항목이 명확히 분리되어 있는가",
        ],
        inputGuide:
          "검증된 자료와 추정 내용을 구분하고, 출처나 확인 필요 항목을 함께 입력한다.",
      };
    case "company_rule":
      return {
        promptLines: [
          "회사 내부 용어, 금지 표현, 브랜드 톤을 제약 조건에 반영한다.",
          "회사 기준과 충돌하는 문장은 대체 표현을 제안한다.",
        ],
        outputAddition: "회사 기준 반영 내역, 대체 표현, 최종 결과",
        checklist: [
          "회사 내부 용어와 금지 표현 기준을 반영했는가",
          "회사 기준과 충돌하는 표현을 대체했는가",
        ],
        inputGuide:
          "회사 내부 용어, 금지 표현, 브랜드 톤, 반드시 지켜야 할 문서 구조를 함께 입력한다.",
      };
    default:
      return {
        promptLines: [
          "최근 실행 피드백에서 지적된 문제를 먼저 보완한다.",
          "결과물의 사용 상황과 품질 기준을 더 명확히 드러낸다.",
        ],
        outputAddition: "개선 반영 내역, 최종 결과, 확인 질문",
        checklist: [
          "최근 피드백의 지적 사항이 결과물 구조에 반영되어 있는가",
          "최종 결과를 바로 사용할 수 있을 만큼 구체적인가",
        ],
        inputGuide:
          "최근 피드백에서 아쉬웠던 점과 이번 실행에서 반드시 보완할 기준을 함께 입력한다.",
      };
  }
}

export function buildSkillImprovementPlan(
  skill: PromptSkill,
  insight: SkillFeedbackInsight,
): SkillImprovementPlan {
  if (insight.feedbackCount === 0) {
    return {
      canApply: false,
      changes: [
        "실행 프롬프트에 피드백이 쌓이면 템플릿 개선안을 적용할 수 있습니다.",
      ],
      nextSkill: skill,
    };
  }

  const guidance = guidanceForType(insight.topFeedbackType);
  const latestComment = insight.latestComments[0]
    ? `최근 피드백 코멘트: ${truncate(insight.latestComments[0])}`
    : "최근 피드백 코멘트를 개선 기준으로 반영한다.";
  const promptLines = [...guidance.promptLines, latestComment];
  const nextSkill: PromptSkill = {
    ...skill,
    inputGuide: appendTextOnce(skill.inputGuide, guidance.inputGuide),
    outputFormat: appendTextOnce(skill.outputFormat, guidance.outputAddition),
    promptTemplate: replaceFeedbackSection(skill.promptTemplate, promptLines),
    qualityChecklist: appendUnique(skill.qualityChecklist, guidance.checklist),
    tags: appendUnique(skill.tags, ["feedback-improved"], 10),
  };

  return {
    canApply: true,
    changes: [
      "프롬프트 템플릿에 피드백 기반 개선 지시를 추가합니다.",
      "입력 가이드에 이번 실행에서 더 구체적으로 받아야 할 정보를 추가합니다.",
      "출력 형식과 품질 체크리스트를 최근 피드백 유형에 맞게 보강합니다.",
    ],
    nextSkill,
  };
}
