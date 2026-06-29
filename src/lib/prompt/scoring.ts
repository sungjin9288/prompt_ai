import type {
  PromptAsset,
  PromptScoreBreakdown,
  PromptVersion,
  TargetModel,
} from "./types";

type PromptScoreKey = keyof PromptScoreBreakdown;

export interface PromptQualityInsight {
  action: string;
  key: PromptScoreKey;
  label: string;
  reason: string;
  score: number;
  severity: "good" | "watch" | "improve";
}

export interface PromptQualityScoreChange {
  current: number;
  delta: number;
  key: PromptScoreKey;
  label: string;
  previous: number;
}

export interface PromptQualityComparison {
  currentScore: number;
  improvedCount: number;
  regressedCount: number;
  scoreChanges: PromptQualityScoreChange[];
  scoreDelta: number;
  unchangedCount: number;
  previousScore: number;
}

export const promptScoreLabels: Record<PromptScoreKey, string> = {
  clarity: "명확성",
  context: "맥락",
  outputFormat: "출력 형식",
  constraints: "제약 조건",
  expertise: "전문성",
  modelFit: "도구 적합성",
  reusability: "재사용성",
};

const promptScorePriority: PromptScoreKey[] = [
  "clarity",
  "context",
  "outputFormat",
  "constraints",
  "expertise",
  "modelFit",
  "reusability",
];

const promptScoreGuidance: Record<
  PromptScoreKey,
  { action: string; reason: string }
> = {
  clarity: {
    reason: "AI가 수행해야 할 역할, 목표, 작업 범위가 더 선명해야 합니다.",
    action:
      "Role, Objective, Task instructions를 한 문장씩 더 구체화하고 완료 기준을 추가하세요.",
  },
  context: {
    reason: "사용자/회사/분야 맥락이 결과물 판단 기준까지 충분히 이어지지 않았습니다.",
    action:
      "사용자 역할, 회사 제품, 고객군, 내부 용어, 최근 피드백 중 이번 작업에 필요한 항목을 Background에 넣으세요.",
  },
  outputFormat: {
    reason: "최종 산출물의 형식이 모호하면 AI가 답변 구조를 임의로 정할 수 있습니다.",
    action:
      "Required output format에 섹션명, 표 컬럼, 글자 수, 체크리스트 항목 수 같은 구체 조건을 추가하세요.",
  },
  constraints: {
    reason: "하지 말아야 할 것과 검증해야 할 것이 약하면 환각이나 과장 위험이 커집니다.",
    action:
      "Constraints에 금지 표현, 근거 없는 수치 금지, 가정 표기, 확인 필요 항목 분리를 명시하세요.",
  },
  expertise: {
    reason: "분야별 판단 기준과 전문 체크리스트가 더 강하게 반영될 여지가 있습니다.",
    action:
      "Quality checklist에 해당 분야의 평가 기준, 리스크, 용어 기준, 검토 관점을 3개 이상 추가하세요.",
  },
  modelFit: {
    reason: "선택한 AI 도구의 강점과 작업 방식에 맞춘 지시가 더 필요합니다.",
    action:
      "대상 AI별로 긴 문서, 코드 검증, 표/자료 분석, 단계별 추론 등 도구에 맞는 실행 방식을 추가하세요.",
  },
  reusability: {
    reason: "비슷한 업무에 반복 사용하기 위한 변수화와 입력 슬롯이 부족합니다.",
    action:
      "Editable variables, Source input, Constraints, Output format을 재사용 가능한 슬롯 형태로 정리하세요.",
  },
};

function normalizeForScoring(content: string) {
  return content.toLocaleLowerCase();
}

function hasAny(content: string, options: string[]) {
  const normalized = normalizeForScoring(content);

  return options.some((item) => normalized.includes(item.toLocaleLowerCase()));
}

function scorePresence(content: string, required: string[][]) {
  const hits = required.filter((item) => hasAny(content, item)).length;
  return Math.max(1, Math.min(5, Math.round((hits / required.length) * 5)));
}

function countContextPlaceholders(content: string) {
  const placeholders = [
    "회사명: 미지정",
    "제품/서비스: 미지정",
    "고객군: 미지정",
    "내부 용어: 미지정",
    "금지 표현: 미지정",
    "company name: not specified",
    "products/services: not specified",
    "customers: not specified",
    "internal terms: not specified",
    "banned phrases: not specified",
  ];
  const normalized = normalizeForScoring(content);

  return placeholders.filter((item) =>
    normalized.includes(item.toLocaleLowerCase()),
  ).length;
}

function applyContextCompletenessCap(score: number, content: string) {
  const placeholderCount = countContextPlaceholders(content);

  if (placeholderCount >= 3) {
    return Math.min(score, 3);
  }

  if (placeholderCount > 0) {
    return Math.min(score, 4);
  }

  return score;
}

function average(values: number[]) {
  return (
    Math.round(
      (values.reduce((sum, value) => sum + value, 0) / values.length) * 10,
    ) / 10
  );
}

export function scorePrompt(
  content: string,
  targetModel: TargetModel,
): { qualityScore: number; scoreBreakdown: PromptScoreBreakdown } {
  const sectionScore = scorePresence(content, [
    ["역할:", "role:"],
    ["목표:", "objective:"],
    ["배경:", "background:", "context to preserve:"],
    ["작업 지시:", "task instructions:"],
    ["제약 조건:", "constraints:"],
    ["출력 형식:", "required output format:", "output format:"],
    ["품질 기준:", "quality bar:", "quality checklist:"],
  ]);

  const context = applyContextCompletenessCap(
    scorePresence(content, [
      ["사용자 맥락", "user context", "user profile"],
      ["회사 맥락", "company context", "company profile"],
      ["분야 기준", "domain criteria", "domain rules"],
    ]),
    content,
  );
  const outputFormat = scorePresence(content, [
    ["출력 형식:", "required output format:", "output format:"],
    ["1."],
    ["2."],
    ["3."],
  ]);
  const constraints = scorePresence(content, [
    ["제약 조건:", "constraints:"],
    ["임의로 만들지", "do not invent", "do not fabricate"],
    ["가정", "assumption", "assumptions"],
  ]);
  const expertise = scorePresence(content, [
    ["분야 기준", "domain criteria", "domain rules"],
    ["품질 기준", "quality bar", "quality criteria"],
    ["체크", "checklist", "review criteria"],
  ]);
  const modelFit =
    targetModel === "codex"
      ? scorePresence(content, [
          ["코드베이스", "codebase"],
          ["검증", "verification", "verify"],
          ["테스트", "test", "tests"],
        ])
      : targetModel === "claude"
        ? scorePresence(content, [
            ["긴 문서", "long document", "long documents"],
            ["근거", "evidence"],
            ["판단 기준", "evaluation criteria", "criteria"],
          ])
        : targetModel === "gemini"
          ? scorePresence(content, [
              ["자료", "source material", "documents"],
              ["표", "table", "tables"],
              ["출처", "source", "sources"],
            ])
          : targetModel === "gpt"
            ? scorePresence(content, [
                ["질문", "question", "questions"],
                ["단계", "stage", "step", "step-by-step"],
                ["구조화", "structure", "structured"],
              ])
            : 4;
  const reusability = scorePresence(content, [
    ["입력:", "source input:"],
    ["[", "editable variables", "variables"],
    ["출력 형식:", "required output format:", "output format:"],
  ]);

  const scoreBreakdown = {
    clarity: sectionScore,
    context,
    outputFormat,
    constraints,
    expertise,
    modelFit,
    reusability,
  };

  return {
    qualityScore: average(Object.values(scoreBreakdown)),
    scoreBreakdown,
  };
}

function getSeverity(score: number): PromptQualityInsight["severity"] {
  if (score < 3.5) {
    return "improve";
  }

  if (score < 4.2) {
    return "watch";
  }

  return "good";
}

function sortPromptScoreEntries(
  first: [PromptScoreKey, number],
  second: [PromptScoreKey, number],
) {
  if (first[1] !== second[1]) {
    return first[1] - second[1];
  }

  return (
    promptScorePriority.indexOf(first[0]) - promptScorePriority.indexOf(second[0])
  );
}

export function getPromptQualityInsights(
  version: PromptVersion,
): PromptQualityInsight[] {
  const entries = Object.entries(version.scoreBreakdown) as Array<
    [PromptScoreKey, number]
  >;
  const sorted = entries.sort(sortPromptScoreEntries);
  const selected = sorted.filter(([, score]) => score < 4.2).slice(0, 3);

  return selected.map(([key, score]) => ({
    key,
    label: promptScoreLabels[key],
    score,
    severity: getSeverity(score),
    reason: promptScoreGuidance[key].reason,
    action: promptScoreGuidance[key].action,
  }));
}

export function buildPromptQualityReportText({
  prompt,
  version,
}: {
  prompt: PromptAsset;
  version: PromptVersion;
}) {
  const insights = getPromptQualityInsights(version);
  const scoreRows = promptScorePriority.map(
    (key) =>
      `- ${promptScoreLabels[key]}: ${version.scoreBreakdown[key].toFixed(1)}/5`,
  );

  return [
    "# Prompt AI Studio Quality Report",
    "",
    "## Prompt",
    `- Title: ${prompt.title}`,
    `- Domain: ${prompt.domain}`,
    `- Goal: ${prompt.goal || "Not specified"}`,
    `- Target AI: ${version.modelLabel}`,
    `- Overall quality score: ${version.qualityScore.toFixed(1)}/5`,
    `- Created at: ${version.createdAt}`,
    "",
    "## Score breakdown",
    ...scoreRows,
    "",
    "## Priority improvements",
    ...(insights.length
      ? insights.map(
          (insight, index) =>
            `${index + 1}. ${insight.label} (${insight.score.toFixed(1)}/5) - ${
              insight.action
            }`,
        )
      : [
          "- No priority improvements. Keep the current prompt unless content review finds qualitative issues.",
        ]),
    "",
    "## Assumptions",
    ...(version.assumptions.length
      ? version.assumptions.map((item) => `- ${item}`)
      : ["- None"]),
    "",
    "## Missing context",
    ...(version.missingContext.length
      ? version.missingContext.map((item) => `- ${item}`)
      : ["- Current input is enough to proceed."]),
    "",
    "## Next action",
    insights.length
      ? "- Apply the priority improvements before saving or sending this prompt when the score is below 4.2."
      : "- No score-driven regeneration is required. Review missing context and real-use fit before saving.",
  ].join("\n");
}

function getMissingContextQuestions(item: string) {
  if (item.includes("회사") || item.toLocaleLowerCase().includes("company")) {
    return [
      "회사/서비스를 한 문장으로 설명하면 무엇인가요?",
      "현재 제공 중이거나 만들고 있는 핵심 제품/서비스는 무엇인가요?",
      "경쟁 서비스와 비교했을 때 반드시 지켜야 할 포지셔닝이나 톤은 무엇인가요?",
    ];
  }

  if (
    item.includes("고객") ||
    item.includes("독자") ||
    item.toLocaleLowerCase().includes("customer") ||
    item.toLocaleLowerCase().includes("audience")
  ) {
    return [
      "이 결과물을 읽거나 사용할 핵심 고객/독자는 누구인가요?",
      "그 고객이 가장 중요하게 보는 문제, 욕구, 반대 의견은 무엇인가요?",
      "고객에게 피해야 할 표현이나 과장으로 보일 수 있는 표현은 무엇인가요?",
    ];
  }

  if (item.includes("분야") || item.toLocaleLowerCase().includes("domain")) {
    return [
      "이번 작업은 어떤 업무 분야나 의사결정 맥락에 속하나요?",
      "해당 분야에서 반드시 포함해야 할 판단 기준은 무엇인가요?",
      "해당 분야에서 피해야 할 리스크나 검증 필요 항목은 무엇인가요?",
    ];
  }

  return [
    `${item}를 구체적으로 채우려면 어떤 정보가 필요한가요?`,
    "이 정보가 없을 때 사용할 수 있는 안전한 가정은 무엇인가요?",
    "답변 품질을 위해 반드시 확인해야 할 기준은 무엇인가요?",
  ];
}

export function buildMissingContextQuestionsText({
  prompt,
  version,
}: {
  prompt: PromptAsset;
  version: PromptVersion;
}) {
  const missingContext = version.missingContext.length
    ? version.missingContext
    : ["현재 입력만으로 생성 가능"];

  return [
    "# Prompt AI Studio Context Completion Questions",
    "",
    "## Prompt",
    `- Title: ${prompt.title}`,
    `- Domain: ${prompt.domain}`,
    `- Goal: ${prompt.goal || "Not specified"}`,
    `- Target AI: ${version.modelLabel}`,
    `- Current quality score: ${version.qualityScore.toFixed(1)}/5`,
    "",
    "## Missing context",
    ...missingContext.map((item) => `- ${item}`),
    "",
    "## Questions to answer",
    ...missingContext.flatMap((item, index) => [
      `${index + 1}. ${item}`,
      ...getMissingContextQuestions(item).map((question) => `   - ${question}`),
    ]),
    "",
    "## Where to update",
    "- Company page: fill company description, products/services, customers, brand tone, internal terms, and banned phrases.",
    "- Profile page: fill role, industries, goals, preferred outputs, and avoid phrases when the missing context is personal rather than company-specific.",
    "- Studio: regenerate the prompt after updating the missing context.",
  ].join("\n");
}

export function buildPromptQualityImprovementBrief({
  prompt,
  version,
}: {
  prompt: PromptAsset;
  version: PromptVersion;
}) {
  const insights = getPromptQualityInsights(version);
  const improvementItems = insights.map(
    (insight, index) =>
      `${index + 1}. ${insight.label} (${insight.score.toFixed(1)}/5): ${
        insight.action
      }`,
  );
  const missingItems = version.missingContext.length
    ? version.missingContext.map((item) => `- ${item}`)
    : ["- 현재 입력만으로 진행 가능"];

  return [
    "다음 프롬프트를 품질 진단 결과에 따라 한 단계 더 개선해줘.",
    "",
    "개선 목표:",
    "- 현재 프롬프트의 의도와 맥락은 유지한다.",
    "- 낮은 점수 항목을 우선 보강한다.",
    "- 대상 AI에 바로 붙여넣을 수 있는 영어 또는 한영 하이브리드 전문 프롬프트로 다시 작성한다.",
    "- 부족한 정보는 임의로 채우지 말고 가정 또는 질문으로 분리한다.",
    "",
    "현재 프롬프트 정보:",
    `- 제목: ${prompt.title}`,
    `- 분야: ${prompt.domain}`,
    `- 목표: ${prompt.goal || "미지정"}`,
    `- 대상 AI: ${version.modelLabel}`,
    `- 현재 품질 점수: ${version.qualityScore.toFixed(1)}/5`,
    "",
    "우선 개선 액션:",
    ...(improvementItems.length
      ? improvementItems
      : [
          "1. 현재 점수 기준으로 낮은 항목은 없습니다. 실제 사용 목적, 최신 맥락, 문체 선호만 검토하세요.",
        ]),
    "",
    "부족한 정보:",
    ...missingItems,
    "",
    "재작성 조건:",
    "- Role, Objective, Background, Source input, Task instructions, Constraints, Required output format, Quality checklist를 명확히 구분한다.",
    "- 재사용 가능한 변수나 입력 슬롯을 포함한다.",
    "- 검증되지 않은 사실, 수치, 회사 주장은 만들지 않는다.",
    "- 최종 답변 언어 조건과 대상 AI별 실행 방식을 유지한다.",
    "",
    "현재 프롬프트:",
    "```text",
    version.content,
    "```",
  ].join("\n");
}

export function comparePromptQualityVersions({
  current,
  previous,
}: {
  current: PromptVersion;
  previous: PromptVersion;
}): PromptQualityComparison {
  const scoreChanges = promptScorePriority.map((key) => {
    const previousScore = previous.scoreBreakdown[key];
    const currentScore = current.scoreBreakdown[key];

    return {
      current: currentScore,
      delta: Math.round((currentScore - previousScore) * 10) / 10,
      key,
      label: promptScoreLabels[key],
      previous: previousScore,
    };
  });

  return {
    currentScore: current.qualityScore,
    improvedCount: scoreChanges.filter((item) => item.delta > 0).length,
    regressedCount: scoreChanges.filter((item) => item.delta < 0).length,
    scoreChanges,
    scoreDelta:
      Math.round((current.qualityScore - previous.qualityScore) * 10) / 10,
    unchangedCount: scoreChanges.filter((item) => item.delta === 0).length,
    previousScore: previous.qualityScore,
  };
}

export function buildPromptQualityComparisonReportText({
  comparison,
  currentPrompt,
  currentVersion,
  previousPrompt,
  previousVersion,
}: {
  comparison: PromptQualityComparison;
  currentPrompt: PromptAsset;
  currentVersion: PromptVersion;
  previousPrompt: PromptAsset;
  previousVersion: PromptVersion;
}) {
  return [
    "# Prompt AI Studio Quality Regeneration Comparison",
    "",
    "## Compared versions",
    `- Previous title: ${previousPrompt.title}`,
    `- Previous target AI: ${previousVersion.modelLabel}`,
    `- Previous score: ${comparison.previousScore.toFixed(1)}/5`,
    `- Current title: ${currentPrompt.title}`,
    `- Current target AI: ${currentVersion.modelLabel}`,
    `- Current score: ${comparison.currentScore.toFixed(1)}/5`,
    `- Score delta: ${comparison.scoreDelta >= 0 ? "+" : ""}${comparison.scoreDelta.toFixed(1)}`,
    "",
    "## Score movement",
    `- Improved items: ${comparison.improvedCount}`,
    `- Regressed items: ${comparison.regressedCount}`,
    `- Unchanged items: ${comparison.unchangedCount}`,
    "",
    "## Breakdown",
    ...comparison.scoreChanges.map(
      (item) =>
        `- ${item.label}: ${item.previous.toFixed(1)} -> ${item.current.toFixed(
          1,
        )} (${item.delta >= 0 ? "+" : ""}${item.delta.toFixed(1)})`,
    ),
    "",
    "## Save decision",
    comparison.scoreDelta > 0
      ? "- Current version improved overall quality. Review regressions before saving."
      : comparison.scoreDelta === 0
        ? "- Current version has the same overall score. Compare the body before saving."
        : "- Current version regressed overall quality. Keep improving before saving unless the content is qualitatively better.",
  ].join("\n");
}
