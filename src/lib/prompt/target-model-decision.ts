import type { TargetModel, TargetModelDecisionMeta } from "./types";

export interface TargetModelDecisionInput {
  rawInput: string;
  goal: string;
  domain: string;
}

export type TargetModelDecision = TargetModelDecisionMeta;

const modelOrder: TargetModel[] = ["gpt", "claude", "codex", "gemini"];
const modelNames: Record<TargetModel, string> = {
  claude: "Claude",
  codex: "Codex",
  general: "범용",
  gemini: "Gemini",
  gpt: "GPT",
};

const codeKeywords = [
  "api",
  "app router",
  "bug",
  "build",
  "cli",
  "code",
  "codex",
  "component",
  "database",
  "debug",
  "deploy",
  "eslint",
  "lint",
  "migration",
  "next.js",
  "pr",
  "react",
  "refactor",
  "repo",
  "schema",
  "test",
  "tsx",
  "typescript",
  "개발",
  "구현",
  "디버그",
  "리팩터링",
  "버그",
  "빌드",
  "배포",
  "코드",
  "테스트",
];

const documentKeywords = [
  "analysis",
  "compare",
  "contract",
  "document",
  "evidence",
  "legal",
  "policy",
  "proposal",
  "report",
  "research",
  "review",
  "검토",
  "계약",
  "규정",
  "근거",
  "리서치",
  "문서",
  "법률",
  "보고서",
  "분석",
  "비교",
  "자료",
  "정책",
  "조사",
  "제안서",
  "평가",
];

const multimodalKeywords = [
  "audio",
  "chart",
  "csv",
  "excel",
  "image",
  "pdf",
  "photo",
  "screenshot",
  "spreadsheet",
  "table",
  "video",
  "그림",
  "사진",
  "스크린샷",
  "스프레드시트",
  "엑셀",
  "영상",
  "이미지",
  "차트",
  "캡처",
  "표",
];

const contentKeywords = [
  "blog",
  "brand",
  "content",
  "copy",
  "email",
  "investor",
  "marketing",
  "pitch",
  "sales",
  "story",
  "광고",
  "마케팅",
  "브랜드",
  "블로그",
  "세일즈",
  "스토리",
  "영업",
  "이메일",
  "카피",
  "콘텐츠",
  "투자",
  "피치",
];

const planningKeywords = [
  "prd",
  "plan",
  "roadmap",
  "scope",
  "strategy",
  "task",
  "기획",
  "계획",
  "로드맵",
  "범위",
  "전략",
  "태스크",
];

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function uniqueSignals(signals: string[]) {
  return Array.from(new Set(signals));
}

function formatReason(targetModels: TargetModel[], signals: string[]) {
  const modelList = targetModels.map((model) => modelNames[model]).join(", ");

  if (
    targetModels.includes("codex") &&
    signals.includes("개발/Codex 실행 신호")
  ) {
    return `개발, 코드, 검증 흐름이 감지되어 ${modelList}를 추천합니다. Codex는 구현 범위와 검증 절차에, GPT는 요구사항 구조화와 후속 수정에 적합합니다.`;
  }

  if (
    targetModels.includes("gemini") &&
    signals.includes("문서/표/이미지 자료 신호")
  ) {
    return `표, 이미지, 문서 같은 자료 처리 신호가 있어 ${modelList}를 추천합니다. Gemini는 자료 해석에, GPT는 프롬프트 구조 정리에 적합합니다.`;
  }

  if (
    targetModels.includes("claude") &&
    signals.includes("긴 맥락/근거 분리 신호")
  ) {
    return `긴 문서 분석, 비교, 정책/계약 검토처럼 근거와 가정 분리가 중요한 작업으로 판단해 ${modelList}를 추천합니다.`;
  }

  if (signals.includes("기획/콘텐츠/세일즈 구조화")) {
    return `기획, 콘텐츠, 세일즈처럼 구조화와 반복 수정이 중요한 작업으로 판단해 ${modelList}를 추천합니다.`;
  }

  return `명확한 단일 도구 신호가 강하지 않아 ${modelList}를 추천합니다.`;
}

export function decideTargetModels(
  input: TargetModelDecisionInput,
): TargetModelDecision {
  const text = [input.rawInput, input.goal, input.domain].join(" ").toLowerCase();
  const scores: Record<TargetModel, number> = {
    general: 0,
    gpt: 1,
    claude: 0,
    codex: 0,
    gemini: 0,
  };
  const signals: string[] = [];

  if (input.domain.includes("개발") || includesAny(text, codeKeywords)) {
    scores.codex += 5;
    scores.gpt += 2;
    signals.push("개발/Codex 실행 신호");
  }

  if (
    ["리서치", "법률/규정", "교육"].some((domain) =>
      input.domain.includes(domain),
    ) ||
    includesAny(text, documentKeywords)
  ) {
    scores.claude += 4;
    scores.gpt += 1;
    signals.push("긴 맥락/근거 분리 신호");
  }

  if (includesAny(text, multimodalKeywords)) {
    scores.gemini += 4;
    scores.gpt += 1;
    signals.push("문서/표/이미지 자료 신호");
  }

  if (
    ["기획", "마케팅", "IR/투자", "콘텐츠", "세일즈", "운영"].some(
      (domain) => input.domain.includes(domain),
    ) ||
    includesAny(text, contentKeywords) ||
    includesAny(text, planningKeywords)
  ) {
    scores.gpt += 3;
    scores.claude += 2;
    signals.push("기획/콘텐츠/세일즈 구조화");
  }

  const ranked = modelOrder
    .filter((model) => scores[model] > 0)
    .sort((a, b) => {
      const scoreDelta = scores[b] - scores[a];

      return scoreDelta || modelOrder.indexOf(a) - modelOrder.indexOf(b);
    });

  const normalizedTargetModels = ranked
    .filter((model, index) => index < 2 || scores[model] >= 4)
    .slice(0, 3);
  const normalizedSignals = uniqueSignals(
    signals.length ? signals : ["기본 범용 구조화"],
  );
  const confidence =
    normalizedSignals.length >= 2 || scores[normalizedTargetModels[0]] >= 5
      ? "strong"
      : "moderate";

  return {
    targetModels: normalizedTargetModels,
    reason: formatReason(normalizedTargetModels, normalizedSignals),
    confidence,
    signals: normalizedSignals,
  };
}
