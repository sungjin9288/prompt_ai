import {
  languageStrategyLabels,
  outputLanguageLabels,
} from "./defaults";
import {
  buildMissingContextQuestionsText,
  buildPromptQualityReportText,
} from "./scoring";
import type { PromptAsset, PromptVersion } from "./types";

export type TargetAiHandoffReadinessStatus = "ready" | "review" | "blocked";

export interface TargetAiHandoffReadinessItem {
  detail: string;
  label: string;
  status: TargetAiHandoffReadinessStatus;
}

const generationSourceLabels: Record<PromptAsset["source"], string> = {
  local: "Local builder",
  openai: "OpenAI",
};

const readinessStatusLabels: Record<TargetAiHandoffReadinessStatus, string> = {
  blocked: "보강 필요",
  ready: "전달 가능",
  review: "검토 필요",
};

function getThresholdStatus(
  score: number,
): TargetAiHandoffReadinessStatus {
  if (score < 3.5) {
    return "blocked";
  }

  if (score < 4.2) {
    return "review";
  }

  return "ready";
}

function formatReadinessStatus(status: TargetAiHandoffReadinessStatus) {
  return readinessStatusLabels[status];
}

export function buildTargetAiHandoffReadinessItems({
  version,
}: {
  version: PromptVersion;
}): TargetAiHandoffReadinessItem[] {
  const promptBodyLength = version.content.trim().length;
  const weakScores = Object.values(version.scoreBreakdown).filter(
    (score) => score < 4.2,
  ).length;
  const hasBlockingScore = Object.values(version.scoreBreakdown).some(
    (score) => score < 3.5,
  );
  const weakestScore = Math.min(...Object.values(version.scoreBreakdown));
  const missingContextCount = version.missingContext.length;
  const assumptionCount = version.assumptions.length;

  return [
    {
      label: "실행 프롬프트 본문",
      status: promptBodyLength >= 160 ? "ready" : "review",
      detail:
        promptBodyLength >= 160
          ? "외부 AI에 바로 붙여넣을 본문이 준비되어 있습니다."
          : "본문이 짧습니다. 역할, 작업 지시, 출력 형식이 충분한지 확인하세요.",
    },
    {
      label: "전체 품질 점수",
      status: getThresholdStatus(version.qualityScore),
      detail: `${version.qualityScore.toFixed(
        1,
      )}/5 기준입니다. 4.2 미만이면 전송 전 보강을 권장합니다.`,
    },
    {
      label: "대상 AI 적합성",
      status: getThresholdStatus(version.scoreBreakdown.modelFit),
      detail: `${version.modelLabel} 작업 방식 반영 점수 ${version.scoreBreakdown.modelFit.toFixed(
        1,
      )}/5입니다.`,
    },
    {
      label: "필수 맥락",
      status:
        missingContextCount === 0
          ? "ready"
          : missingContextCount <= 2
            ? "review"
            : "blocked",
      detail:
        missingContextCount === 0
          ? "누락 맥락 없이 바로 실행할 수 있습니다."
          : `${missingContextCount}개 맥락이 비어 있습니다. 필요한 경우 질문에 답한 뒤 재생성하세요.`,
    },
    {
      label: "하위 품질 항목",
      status: hasBlockingScore ? "blocked" : weakScores > 0 ? "review" : "ready",
      detail:
        weakScores > 0
          ? `${weakScores}개 항목이 4.2 미만입니다. 최저 점수는 ${weakestScore.toFixed(
              1,
            )}/5입니다.`
          : "모든 하위 품질 항목이 전달 기준을 충족합니다.",
    },
    {
      label: "가정 검토",
      status:
        assumptionCount === 0
          ? "ready"
          : assumptionCount <= 2
            ? "review"
            : "blocked",
      detail:
        assumptionCount === 0
          ? "추가 가정 없이 실행할 수 있습니다."
          : `${assumptionCount}개 가정이 포함되어 있습니다. 사실로 확정하지 말고 필요 시 수정하세요.`,
    },
  ];
}

export function buildTargetAiHandoffImprovementBriefText({
  prompt,
  version,
}: {
  prompt: PromptAsset;
  version: PromptVersion;
}) {
  const readinessItems = buildTargetAiHandoffReadinessItems({ version });
  const findings = readinessItems.filter((item) => item.status !== "ready");
  const priorityFindings = findings.length ? findings : readinessItems;
  const assumptionLines = version.assumptions.length
    ? version.assumptions.map((item) => `- ${item}`).join("\n")
    : "- No explicit assumptions recorded.";
  const missingContextLines = version.missingContext.length
    ? version.missingContext.map((item) => `- ${item}`).join("\n")
    : "- No required missing context recorded.";
  const findingLines = priorityFindings
    .map(
      (item, index) =>
        `${index + 1}. ${item.label} [${formatReadinessStatus(
          item.status,
        )}]: ${item.detail}`,
    )
    .join("\n");

  return `Role:
You are a senior prompt engineer improving a production-ready prompt for ${version.modelLabel}.

Objective:
Rewrite the current prompt so it passes the preflight checklist and becomes safer, clearer, and easier to paste into the target AI.

Context:
- Title: ${prompt.title}
- Domain: ${prompt.domain}
- Goal: ${prompt.goal || "Not specified"}
- Target AI: ${version.modelLabel}
- Prompt language strategy: ${
    prompt.languageStrategy
      ? languageStrategyLabels[prompt.languageStrategy]
      : "Not recorded"
  }
- Target answer language: ${
    prompt.outputLanguage ? outputLanguageLabels[prompt.outputLanguage] : "Not recorded"
  }
- Current quality score: ${version.qualityScore.toFixed(1)}/5

Preflight findings to fix:
${findingLines}

Assumptions to preserve or make explicit:
${assumptionLines}

Missing context to ask about or mark as assumptions:
${missingContextLines}

Instructions:
- Do not invent facts, numbers, company details, sources, or user intent.
- Preserve the original request and target AI tool.
- Make missing information explicit as questions or clearly labeled assumptions.
- Strengthen role, objective, background, task instructions, constraints, output format, and quality checklist.
- Return only the improved copy-ready prompt.

Current prompt:
${version.content}`;
}

export function buildTargetAiHandoffPackageText({
  prompt,
  version,
}: {
  prompt: PromptAsset;
  version: PromptVersion;
}) {
  const readinessItems = buildTargetAiHandoffReadinessItems({ version });

  return [
    `# Target AI Handoff Package · ${prompt.title}`,
    "",
    "## Execution Metadata",
    `- Target AI: ${version.modelLabel}`,
    `- Domain: ${prompt.domain}`,
    `- Goal: ${prompt.goal || "Not specified"}`,
    `- Source engine: ${generationSourceLabels[prompt.source]}${
      prompt.modelUsed ? ` ${prompt.modelUsed}` : ""
    }`,
    `- Prompt language strategy: ${
      prompt.languageStrategy
        ? languageStrategyLabels[prompt.languageStrategy]
        : "Not recorded"
    }`,
    `- Target answer language: ${
      prompt.outputLanguage
        ? outputLanguageLabels[prompt.outputLanguage]
        : "Not recorded"
    }`,
    `- Quality score: ${version.qualityScore.toFixed(1)}/5`,
    "",
    "## Copy-Ready Prompt",
    version.content,
    "",
    "## Preflight Checklist",
    ...readinessItems.map(
      (item) =>
        `- [${formatReadinessStatus(item.status)}] ${item.label}: ${
          item.detail
        }`,
    ),
    "",
    "## Quality Review",
    buildPromptQualityReportText({ prompt, version }),
    "",
    "## Missing Context Questions",
    buildMissingContextQuestionsText({ prompt, version }),
    "",
    "## Operator Note",
    "- Paste the Copy-Ready Prompt section into the target AI first.",
    "- Use the Quality Review and Missing Context Questions sections for review, not as extra instructions unless needed.",
  ].join("\n");
}
