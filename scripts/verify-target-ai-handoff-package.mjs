import assert from "node:assert/strict";
import { loadTypescriptModule } from "./lib/load-typescript-module.mjs";
import { readSource } from "./lib/read-source.mjs";

const {
  buildTargetAiHandoffImprovementBriefText,
  buildTargetAiHandoffPackageText,
} = loadTypescriptModule("src/lib/prompt/handoff-package.ts");
const handoffPreviewSource = readSource(
  "src/components/prompt/target-ai-handoff-preview-panel.tsx",
);
const readme = readSource("README.md");
const prd = readSource("docs/personalized-prompt-ai-prd.md");
const developmentBrief = readSource("docs/codex-development-brief.md");

function assertFileIncludes(fileSource, text, message) {
  assert.ok(fileSource.includes(text), message);
}

const version = {
  assumptions: ["Assume missing company details are not invented."],
  content: "Role:\nYou are a careful assistant.\n\nTask instructions:\nDo the work.",
  createdAt: "2026-06-16T00:00:00.000Z",
  id: "version_gpt",
  missingContext: ["회사/서비스 설명"],
  modelLabel: "GPT",
  qualityScore: 4.6,
  scoreBreakdown: {
    clarity: 5,
    constraints: 5,
    context: 3,
    expertise: 5,
    modelFit: 5,
    outputFormat: 5,
    reusability: 4,
  },
  targetModel: "gpt",
};
const prompt = {
  createdAt: "2026-06-16T00:00:00.000Z",
  domain: "기획",
  feedback: [],
  goal: "전문 프롬프트로 변환",
  id: "prompt_sample",
  languageStrategy: "hybrid",
  outputLanguage: "korean",
  rawInput: "앱 아이디어를 투자자에게 설명해줘.",
  source: "local",
  targetModels: ["gpt"],
  title: "기획 · 전문 프롬프트",
  updatedAt: "2026-06-16T00:00:00.000Z",
  versions: [version],
};

const packageText = buildTargetAiHandoffPackageText({ prompt, version });
const improvementBriefText = buildTargetAiHandoffImprovementBriefText({
  prompt,
  version,
});

assert.match(packageText, /^# Target AI Handoff Package · 기획 · 전문 프롬프트/);
assert.match(packageText, /## Execution Metadata/);
assert.match(packageText, /- Target AI: GPT/);
assert.match(packageText, /- Source engine: Local builder/);
assert.match(packageText, /- Prompt language strategy: 한영 하이브리드/);
assert.match(packageText, /- Target answer language: 한국어/);
assert.match(packageText, /## Copy-Ready Prompt/);
assert.match(packageText, /You are a careful assistant/);
assert.match(packageText, /## Preflight Checklist/);
assert.match(packageText, /전체 품질 점수/);
assert.match(packageText, /대상 AI 적합성/);
assert.match(packageText, /필수 맥락/);
assert.match(packageText, /## Quality Review/);
assert.match(packageText, /Prompt AI Studio Quality Report/);
assert.match(packageText, /## Missing Context Questions/);
assert.match(packageText, /회사\/서비스 설명/);
assert.match(packageText, /## Operator Note/);

assert.match(improvementBriefText, /^Role:/);
assert.match(improvementBriefText, /Preflight findings to fix/);
assert.match(improvementBriefText, /필수 맥락/);
assert.match(improvementBriefText, /Return only the improved copy-ready prompt/);
assert.match(improvementBriefText, /Current prompt:/);
assert.match(improvementBriefText, /You are a careful assistant/);

assert.match(
  handoffPreviewSource,
  /const readinessCounts = readinessItems\.reduce\([\s\S]*?blocked: 0[\s\S]*?ready: 0[\s\S]*?review: 0/,
);
assert.match(
  handoffPreviewSource,
  /const handoffPreviewSummaryItems = \[[\s\S]*?label: "품질"[\s\S]*?qualityScore\.toFixed\(1\)[\s\S]*?label: "전달 상태"[\s\S]*?readinessCounts\.ready[\s\S]*?readinessCounts\.review[\s\S]*?readinessCounts\.blocked[\s\S]*?label: "현재 보기"[\s\S]*?previewMode === "run-prompt"[\s\S]*?label: "복사 대상"[\s\S]*?본문만[\s\S]*?리포트 포함/,
);
assert.match(
  handoffPreviewSource,
  /className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3 lg:grid-cols-4"[\s\S]*?data-testid="target-ai-handoff-preview-summary"[\s\S]*?handoffPreviewSummaryItems\.map[\s\S]*?break-words text-xs font-semibold text-soft/,
);
assertFileIncludes(
  readme,
  "AI 전달 패키지 미리보기는 품질, 전달 상태, 현재 보기, 복사 대상을 모바일 2열과 데스크톱 4열 지표로 먼저 보여주고 전체 패키지와 실행 프롬프트 원문은 별도 preview로 유지합니다.",
  "README should document the target AI handoff preview summary metrics",
);
assertFileIncludes(
  prd,
  "AI 전달 패키지 미리보기는 품질, 전달 상태, 현재 보기, 복사 대상을 모바일 2열과 데스크톱 4열 지표로 먼저 보여주고 전체 패키지와 실행 프롬프트 원문은 별도 preview로 유지해야 한다.",
  "PRD should document the target AI handoff preview summary metrics",
);
assertFileIncludes(
  developmentBrief,
  "AI 전달 패키지 미리보기는 품질, 전달 상태, 현재 보기, 복사 대상을 모바일 2열과 데스크톱 4열 지표로 먼저 보여주고 전체 패키지와 실행 프롬프트 원문은 별도 preview로 유지한다.",
  "Development brief should document the target AI handoff preview summary metrics",
);

console.log("Target AI handoff package verification passed.");
