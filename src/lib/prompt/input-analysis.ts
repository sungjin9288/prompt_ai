export type PromptInputReadinessStatus = "ready" | "review" | "missing";

export interface PromptInputReadinessItem {
  detail: string;
  label: string;
  status: PromptInputReadinessStatus;
  value: string;
}

export interface PromptInputReadinessAnalysis {
  action: string;
  items: PromptInputReadinessItem[];
  missingQuestions: string[];
  score: number;
  status: PromptInputReadinessStatus;
  statusLabel: string;
  summary: string;
}

const intentSignals = [
  "작성",
  "정리",
  "분석",
  "비교",
  "설계",
  "기획",
  "개발",
  "보고",
  "추천",
  "개선",
  "rewrite",
  "analyze",
  "compare",
  "build",
  "plan",
];

const contextSignals = [
  "대상",
  "사용자",
  "고객",
  "회사",
  "서비스",
  "제품",
  "상황",
  "배경",
  "목적",
  "audience",
  "context",
  "customer",
  "product",
  "company",
];

const constraintSignals = [
  "하지마",
  "금지",
  "제외",
  "반드시",
  "조건",
  "제약",
  "톤",
  "분량",
  "마감",
  "주의",
  "avoid",
  "must",
  "constraint",
  "tone",
  "limit",
];

const outputSignals = [
  "표",
  "리스트",
  "문서",
  "보고서",
  "체크리스트",
  "프롬프트",
  "코드",
  "초안",
  "형식",
  "table",
  "list",
  "report",
  "checklist",
  "format",
  "draft",
];

function hasSignal(text: string, signals: string[]) {
  const normalized = text.toLocaleLowerCase();

  return signals.some((signal) => normalized.includes(signal.toLocaleLowerCase()));
}

function getPromptInputAnalysisText(rawInput: string) {
  const [mainInput, ...questionSections] = rawInput.split("추가로 답할 보강 질문:");

  if (questionSections.length === 0) {
    return rawInput;
  }

  const answerLines: string[] = [];
  let collectingAnswer = false;

  for (const line of questionSections.join("\n").split("\n")) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("- ")) {
      collectingAnswer = false;
      continue;
    }

    if (trimmed.startsWith("답:")) {
      const answer = trimmed.replace(/^답:\s*/, "").trim();

      if (answer) {
        answerLines.push(answer);
      }

      collectingAnswer = true;
      continue;
    }

    if (collectingAnswer) {
      answerLines.push(trimmed);
    }
  }

  return [mainInput.trim(), ...answerLines].filter(Boolean).join("\n");
}

function getStatus(ready: boolean, partial: boolean): PromptInputReadinessStatus {
  if (ready) {
    return "ready";
  }

  return partial ? "review" : "missing";
}

function getItemScore(status: PromptInputReadinessStatus) {
  if (status === "ready") {
    return 25;
  }

  return status === "review" ? 15 : 5;
}

function getOverallStatus(
  score: number,
  items: PromptInputReadinessItem[],
): PromptInputReadinessStatus {
  const allReady = items.every((item) => item.status === "ready");

  if (score >= 80 && allReady) {
    return "ready";
  }

  return score >= 55 ? "review" : "missing";
}

function getOverallLabel(status: PromptInputReadinessStatus) {
  if (status === "ready") {
    return "바로 생성";
  }

  return status === "review" ? "검토 후 생성" : "보강 필요";
}

function getMissingQuestions(items: PromptInputReadinessItem[]) {
  const questions: Record<string, string> = {
    "목적": "이번 프롬프트로 최종적으로 얻고 싶은 결과는 무엇인가요?",
    "맥락": "누가 이 결과를 사용하고, 어떤 배경에서 쓰이나요?",
    "제약": "반드시 지켜야 할 톤, 금지 표현, 분량, 검증 기준이 있나요?",
    "출력": "원하는 산출물 형식은 문서, 표, 체크리스트, 코드 중 무엇인가요?",
  };

  return items
    .filter((item) => item.status !== "ready")
    .map((item) => questions[item.label])
    .filter(Boolean)
    .slice(0, 4);
}

export function analyzePromptInputReadiness({
  domain,
  goal,
  rawInput,
}: {
  domain: string;
  goal: string;
  rawInput: string;
}): PromptInputReadinessAnalysis {
  const trimmed = getPromptInputAnalysisText(rawInput).trim();
  const hasInput = trimmed.length > 0;
  const hasEnoughInput = trimmed.length >= 80;
  const hasStrongInput = trimmed.length >= 180;
  const hasGoal = goal.trim().length > 0;
  const hasDomain = domain.trim().length > 0;
  const intentReady = hasInput && (hasGoal || hasSignal(trimmed, intentSignals));
  const contextReady =
    hasStrongInput || (hasDomain && hasSignal(trimmed, contextSignals));
  const constraintsReady = hasSignal(trimmed, constraintSignals);
  const outputReady = hasSignal(trimmed, outputSignals) || hasGoal;

  const items: PromptInputReadinessItem[] = [
    {
      detail: intentReady
        ? "목표와 실행 동사가 확인됩니다."
        : "작업 목적을 한 문장으로 더 적어주세요.",
      label: "목적",
      status: getStatus(intentReady, hasInput),
      value: intentReady ? "확인" : "부족",
    },
    {
      detail: contextReady
        ? "분야와 배경 정보가 생성 맥락으로 쓰일 수 있습니다."
        : "대상, 사용처, 배경을 조금 더 넣으면 결과가 안정됩니다.",
      label: "맥락",
      status: getStatus(contextReady, hasEnoughInput || hasDomain),
      value: contextReady ? "충분" : "보강",
    },
    {
      detail: constraintsReady
        ? "톤, 금지, 조건 같은 제약 신호가 있습니다."
        : "제약이 없으면 Studio가 안전 기본값을 적용합니다.",
      label: "제약",
      status: getStatus(constraintsReady, hasEnoughInput),
      value: constraintsReady ? "명시" : "기본값",
    },
    {
      detail: outputReady
        ? "산출물 형식이나 목표 기반 출력 구조를 잡을 수 있습니다."
        : "표, 문서, 체크리스트처럼 원하는 형식을 적어주세요.",
      label: "출력",
      status: getStatus(outputReady, hasInput),
      value: outputReady ? "확인" : "부족",
    },
  ];
  const score = items.reduce((sum, item) => sum + getItemScore(item.status), 0);
  const status = getOverallStatus(score, items);
  const statusLabel = getOverallLabel(status);

  return {
    action:
      status === "ready"
        ? "이 기준으로 생성해도 됩니다."
        : status === "review"
          ? "부족 항목을 확인한 뒤 생성하세요."
          : "목적과 출력 형식을 먼저 보강하세요.",
    items,
    missingQuestions: getMissingQuestions(items),
    score,
    status,
    statusLabel,
    summary:
      status === "ready"
        ? "목적, 맥락, 출력 기준이 충분해 대상 AI별 전문 프롬프트로 변환할 수 있습니다."
        : status === "review"
          ? "생성은 가능하지만 일부 기준이 약해 가정이나 보강 질문이 함께 들어갑니다."
          : "원문 기준이 부족해 생성 전에 핵심 맥락을 더 적는 편이 좋습니다.",
  };
}

export function buildPromptInputReadinessReportText({
  analysis,
  domain,
  goal,
  rawInput,
}: {
  analysis: PromptInputReadinessAnalysis;
  domain: string;
  goal: string;
  rawInput: string;
}) {
  const trimmed = getPromptInputAnalysisText(rawInput).trim();

  return [
    "# Studio input analysis preflight",
    "",
    `- Status: ${analysis.statusLabel}`,
    `- Score: ${analysis.score}/100`,
    `- Goal: ${goal || "미지정"}`,
    `- Domain: ${domain || "미지정"}`,
    `- Input length: ${trimmed.length} chars`,
    "",
    "## Summary",
    analysis.summary,
    "",
    "## Readiness checks",
    ...analysis.items.map(
      (item) =>
        `- ${item.label}: ${item.value} (${item.status}) - ${item.detail}`,
    ),
    "",
    "## Missing questions",
    analysis.missingQuestions.length
      ? analysis.missingQuestions.map((question) => `- ${question}`).join("\n")
      : "- 추가 보강 질문 없음",
    "",
    "## Next action",
    analysis.action,
  ].join("\n");
}
