import assert from "node:assert/strict";
import { loadTypescriptModule } from "./lib/load-typescript-module.mjs";
import { readConcatenatedSources, readSource } from "./lib/read-source.mjs";

const studioWorkspaceSource = readSource(
  "src/components/studio/studio-workspace.tsx",
);
const source = [
  readConcatenatedSources([
    "src/lib/studio-view/hrefs.ts",
    "src/lib/studio-view/draft-summary.ts",
    "src/lib/studio-view/learning-memory.ts",
    "src/lib/studio-view/generation.ts",
    "src/lib/studio-view/reports.ts",
  ]),
  studioWorkspaceSource,
].join("\n");
const inputAnalysis = readSource("src/lib/prompt/input-analysis.ts");
const readme = readSource("README.md");
const prd = readSource("docs/personalized-prompt-ai-prd.md");
const developmentBrief = readSource("docs/codex-development-brief.md");
const {
  analyzePromptInputReadiness,
  buildPromptInputReadinessReportText,
} = loadTypescriptModule("src/lib/prompt/input-analysis.ts");
const { decidePromptLanguageStrategy } = loadTypescriptModule(
  "src/lib/prompt/language-decision.ts",
);
const { decideTargetModels } = loadTypescriptModule(
  "src/lib/prompt/target-model-decision.ts",
);

function assertIncludes(text, message) {
  assert.ok(source.includes(text), message);
}

function assertFileIncludes(fileSource, text, message) {
  assert.ok(fileSource.includes(text), message);
}

function assertMatches(pattern, message) {
  assert.match(source, pattern, message);
}

function assertInputAnalysisMatches(pattern, message) {
  assert.match(inputAnalysis, pattern, message);
}

const strongInputAnalysis = analyzePromptInputReadiness({
  domain: "개발",
  goal: "개발 태스크 생성",
  rawInput:
    "우리 회사 SaaS 관리자 화면의 결제 리포트 기능을 개발하려고 한다. 대상 사용자는 운영 매니저이고, 기존 Next.js 코드 구조를 먼저 확인해야 한다. 표 형식의 구현 계획, 파일 범위, 테스트 명령, 금지할 파괴적 작업을 포함해줘.",
});
const weakInputAnalysis = analyzePromptInputReadiness({
  domain: "",
  goal: "",
  rawInput: "앱 아이디어 정리해줘",
});
const unansweredQuestionInputAnalysis = analyzePromptInputReadiness({
  domain: "기획",
  goal: "전문 프롬프트로 변환",
  rawInput:
    "내가 만든 앱 아이디어를 투자자에게 설명할 수 있게 정리하고, 나중에 Codex로 개발할 수 있도록 기능 범위도 나눠줘.\n추가로 답할 보강 질문:\n- 누가 이 결과를 사용하고, 어떤 배경에서 쓰이나요?\n  답:\n- 반드시 지켜야 할 톤, 금지 표현, 분량, 검증 기준이 있나요?\n  답:",
});
const answeredQuestionInputAnalysis = analyzePromptInputReadiness({
  domain: "기획",
  goal: "전문 프롬프트로 변환",
  rawInput:
    "내가 만든 앱 아이디어를 투자자에게 설명할 수 있게 정리하고, 나중에 Codex로 개발할 수 있도록 기능 범위도 나눠줘.\n추가로 답할 보강 질문:\n- 누가 이 결과를 사용하고, 어떤 배경에서 쓰이나요?\n  답: 대상 사용자는 투자자와 운영팀이고, 초기 제품 검토 배경에서 씁니다.\n- 반드시 지켜야 할 톤, 금지 표현, 분량, 검증 기준이 있나요?\n  답: 5개 항목의 표 형식, 과장 금지, 검증 기준 포함.",
});
const partiallyAnsweredQuestionInputAnalysis = analyzePromptInputReadiness({
  domain: "기획",
  goal: "전문 프롬프트로 변환",
  rawInput:
    "내가 만든 앱 아이디어를 투자자에게 설명할 수 있게 정리하고, 나중에 Codex로 개발할 수 있도록 기능 범위도 나눠줘.\n추가로 답할 보강 질문:\n- 누가 이 결과를 사용하고, 어떤 배경에서 쓰이나요?\n  답: 대상 사용자는 투자자와 운영팀이고, 초기 제품 검토 배경에서 씁니다.\n- 반드시 지켜야 할 톤, 금지 표현, 분량, 검증 기준이 있나요?\n  답:",
});
const strongInputAnalysisReport = buildPromptInputReadinessReportText({
  analysis: strongInputAnalysis,
  domain: "개발",
  goal: "개발 태스크 생성",
  rawInput:
    "우리 회사 SaaS 관리자 화면의 결제 리포트 기능을 개발하려고 한다. 대상 사용자는 운영 매니저이고, 기존 Next.js 코드 구조를 먼저 확인해야 한다. 표 형식의 구현 계획, 파일 범위, 테스트 명령, 금지할 파괴적 작업을 포함해줘.",
});
const codexPlanningDecision = decideTargetModels({
  domain: "기획",
  goal: "전문 프롬프트로 변환",
  rawInput:
    "내가 만든 앱 아이디어를 투자자에게 설명할 수 있게 정리하고, 나중에 Codex로 개발할 수 있도록 기능 범위도 나눠줘.",
});
const codexImplementationLanguageDecision = decidePromptLanguageStrategy({
  domain: "개발",
  goal: "Codex implementation brief",
  rawInput:
    "Refactor the billing report component, inspect the Next.js repo first, and include lint, build, and smoke verification commands.",
  targetModels: ["codex"],
});
const companyContextLanguageDecision = decidePromptLanguageStrategy({
  domain: "기획",
  goal: "전문 프롬프트로 변환",
  rawInput:
    "투자자에게 보낼 제품 설명 프롬프트를 만들어줘. 회사명과 내부 용어는 유지해야 해.",
  targetModels: ["gpt"],
  companyProfile: {
    id: "company_language_test",
    companyName: "프롬프트AI스튜디오",
    description: "한국 시장의 창업자와 운영팀을 위한 프롬프트 운영 도구",
    products: ["한영 하이브리드 프롬프트", "학습 메모리"],
    customers: ["국내 스타트업", "운영팀"],
    brandTone: "전문적이고 간결한 한국어",
    internalTerms: ["학습 메모리", "검증 증빙"],
    bannedPhrases: [],
    documentFormats: ["투자자 요약", "Codex 작업 브리프"],
  },
});

assertIncludes(
  'data-testid="studio-loaded-draft-operational-summary"',
  "Studio should expose an operational summary for loaded drafts",
);
assertIncludes(
  'data-testid="studio-input-readiness-summary"',
  "Studio should expose an input readiness summary before generation",
);
assertIncludes(
  'data-testid="studio-input-analysis-preflight"',
  "Studio should expose an input analysis preflight before generation",
);
assertIncludes(
  'testId="studio-generation-operating-flow"',
  "Studio should expose a shared generation operating flow before the workspace panels",
);
assertMatches(
  /import \{[\s\S]*?analyzePromptInputReadiness[\s\S]*?\} from "@\/lib\/prompt";/,
  "Studio should import the prompt input readiness analyzer",
);
assertMatches(
  /import \{[\s\S]*?ContextOperatingFlow[\s\S]*?type ContextOperatingFlowItem[\s\S]*?\} from "@\/components\/context\/context-operating-flow";/,
  "Studio should reuse the shared context operating flow component",
);
assertMatches(
  /const currentInputSummary = useMemo\([\s\S]*?summarizeDraftInput\(rawInput\)[\s\S]*?\[rawInput\]/,
  "Studio input readiness summary should derive input length from the current raw input",
);
assertMatches(
  /const inputReadinessAnalysis = useMemo\([\s\S]*?analyzePromptInputReadiness\(\{ domain, goal, rawInput \}\)[\s\S]*?\[domain, goal, rawInput\]/,
  "Studio should derive input analysis preflight from the current raw input, goal, and domain",
);
assertMatches(
  /function formatInputReadinessLabel\(\{[\s\S]*?missingQuestionCount[\s\S]*?score[\s\S]*?statusLabel[\s\S]*?\}\)[\s\S]*?`\$\{statusLabel\} · \$\{score\}\/100\$\{[\s\S]*?missingQuestionCount \? ` · 남은 \$\{missingQuestionCount\}개` : ""[\s\S]*?\}`/,
  "Studio should format input readiness status, score, and remaining-question count through one readable label helper",
);
assertMatches(
  /const missingQuestionCount = inputReadinessAnalysis\.missingQuestions\.length[\s\S]*?const inputReadinessLabel = formatInputReadinessLabel\(\{[\s\S]*?missingQuestionCount[\s\S]*?score: inputReadinessAnalysis\.score[\s\S]*?statusLabel: inputReadinessAnalysis\.statusLabel/,
  "Studio should derive one input-readiness label for all readiness status surfaces",
);
assertInputAnalysisMatches(
  /export function analyzePromptInputReadiness[\s\S]*?목적[\s\S]*?맥락[\s\S]*?제약[\s\S]*?출력[\s\S]*?missingQuestions[\s\S]*?export function buildPromptInputReadinessReportText/,
  "Prompt input analysis should score purpose, context, constraints, output format, missing questions, and report text",
);
assertInputAnalysisMatches(
  /function getPromptInputAnalysisText[\s\S]*?split\("추가로 답할 보강 질문:"\)[\s\S]*?startsWith\("- "\)[\s\S]*?startsWith\("답:"\)[\s\S]*?answerLines\.push/,
  "Prompt input analysis should ignore appended missing-question scaffolding and analyze only filled answers",
);
assertInputAnalysisMatches(
  /function getOverallStatus\([\s\S]*?items: PromptInputReadinessItem\[\][\s\S]*?allReady = items\.every\(\(item\) => item\.status === "ready"\)[\s\S]*?score >= 80 && allReady/,
  "Prompt input analysis should require every readiness item to be ready before overall status becomes ready",
);
assert.equal(
  strongInputAnalysis.status,
  "ready",
  "Strong prompt input should be ready before generation",
);
assert.ok(
  strongInputAnalysis.score >= 80,
  "Strong prompt input should score at least 80",
);
assert.equal(
  weakInputAnalysis.status,
  "missing",
  "Weak prompt input should require missing context before generation",
);
assert.ok(
  weakInputAnalysis.missingQuestions.length > 0,
  "Weak prompt input should produce missing-context questions",
);
assert.equal(
  unansweredQuestionInputAnalysis.status,
  "review",
  "Unanswered appended question scaffolding should not make prompt input ready",
);
assert.equal(
  unansweredQuestionInputAnalysis.score,
  70,
  "Unanswered appended question scaffolding should not inflate prompt input score",
);
assert.ok(
  unansweredQuestionInputAnalysis.missingQuestions.length > 0,
  "Unanswered appended question scaffolding should still produce missing-context questions",
);
assert.equal(
  partiallyAnsweredQuestionInputAnalysis.status,
  "review",
  "Partially answered appended questions should remain review while any missing question remains",
);
assert.equal(
  partiallyAnsweredQuestionInputAnalysis.missingQuestions.join("\n"),
  "반드시 지켜야 할 톤, 금지 표현, 분량, 검증 기준이 있나요?",
  "Partially answered appended questions should keep only unanswered readiness questions",
);
assert.equal(
  answeredQuestionInputAnalysis.status,
  "ready",
  "Filled appended answers should improve prompt input readiness",
);
assert.ok(
  answeredQuestionInputAnalysis.score > unansweredQuestionInputAnalysis.score,
  "Filled appended answers should score higher than unanswered question scaffolding",
);
assert.match(
  strongInputAnalysisReport,
  /# Studio input analysis preflight[\s\S]*?Score: 100\/100[\s\S]*?Readiness checks[\s\S]*?Next action/,
  "Input analysis report should include status, score, readiness checks, and next action",
);
assert.equal(
  codexPlanningDecision.targetModels.join(","),
  "gpt,codex",
  "Planning input with Codex execution signal should recommend GPT and Codex",
);
assert.match(
  codexPlanningDecision.reason,
  /GPT, Codex/,
  "Target AI recommendation reason should name the actual recommended models",
);
assert.doesNotMatch(
  codexPlanningDecision.reason,
  /Claude/,
  "Target AI recommendation reason should not mention a model that is not recommended",
);
assert.equal(
  codexImplementationLanguageDecision.strategy,
  "english",
  "Codex implementation work should use an all-English prompt language strategy when Korean context does not need preservation",
);
assert.ok(
  codexImplementationLanguageDecision.signals.includes("개발/Codex 작업 신호"),
  "Codex implementation language decision should expose the development signal",
);
assert.equal(
  companyContextLanguageDecision.strategy,
  "hybrid",
  "Korean company, brand, and internal-term context should use a Korean-English hybrid prompt language strategy",
);
assert.ok(
  companyContextLanguageDecision.signals.includes("회사/브랜드 한국어 맥락 감지"),
  "Company-context language decision should expose the Korean company-context signal",
);
assertMatches(
  /const studioGenerationOperatingFlowItems =[\s\S]*?useMemo<ContextOperatingFlowItem\[\]>\([\s\S]*?actionLabel: "원문 확인"[\s\S]*?href: "#studio-raw-input"[\s\S]*?label: "입력"[\s\S]*?step: "01"[\s\S]*?title: rawInput\.trim\(\) \? inputReadinessLabel : "원문 필요"[\s\S]*?actionLabel: "판단 기준 확인"[\s\S]*?href: "#studio-decision-controls"[\s\S]*?label: "AI 판단"[\s\S]*?step: "02"[\s\S]*?actionLabel: "학습 기준 확인"[\s\S]*?href: "#studio-learning-context"[\s\S]*?label: "컨텍스트"[\s\S]*?step: "03"[\s\S]*?actionLabel: "생성 위치로 이동"[\s\S]*?href: "#studio-next-generation-action"[\s\S]*?label: "실행"[\s\S]*?step: "04"/,
  "Studio generation operating flow should map the shared input readiness label, AI decision, learning context, and execution anchors",
);
assertMatches(
  /const studioPreparationSteps = useMemo\(\(\) => \{[\s\S]*?label: "준비"[\s\S]*?rawInput\.trim\(\) \? inputReadinessLabel : "원문 필요"[\s\S]*?currentInputSummary\.inputLineCount[\s\S]*?currentInputSummary\.inputCharCount[\s\S]*?label: "생성"[\s\S]*?formatModelLabels\(selectedModels\)[\s\S]*?promptLanguageDecision\.label[\s\S]*?outputLanguageLabels\[outputLanguage\][\s\S]*?label: "학습"[\s\S]*?appliedContextMemories\.length[\s\S]*?appliedFeedbackCount[\s\S]*?enabledMemoryScopeCount[\s\S]*?label: "저장"[\s\S]*?savePlanLabel[\s\S]*?sourceLabel/,
  "Studio input readiness summary should group the shared input readiness label, generation, learning, and save state",
);
assertMatches(
  /const languageDecisionSummaryItems = useMemo\([\s\S]*?label: "적용 방식"[\s\S]*?promptLanguageDecision\.label[\s\S]*?promptLanguageDecision\.strategy === "english"[\s\S]*?label: "판단 신뢰도"[\s\S]*?promptLanguageDecision\.confidence === "strong"[\s\S]*?promptLanguageDecision\.signals\.join\(" · "\)[\s\S]*?label: "답변 언어"[\s\S]*?outputLanguageLabels\[outputLanguage\][\s\S]*?프롬프트 작성 언어와 별도 설정/,
  "Studio prompt language panel should expose automatic language strategy, confidence, signals, and separate answer-language state",
);
assertMatches(
  /const targetModelSelectionSummaryItems = useMemo\([\s\S]*?label: "적용 상태"[\s\S]*?targetModelRecommendationApplied[\s\S]*?modelsTouched[\s\S]*?"추천과 동일"[\s\S]*?"자동 추천 적용"[\s\S]*?"수동 조정"[\s\S]*?label: "추천 신뢰도"[\s\S]*?targetModelDecision\.confidence === "strong"[\s\S]*?targetModelDecision\.signals\.join\(" · "\)[\s\S]*?label: "선택 도구"[\s\S]*?formatModelLabels\(selectedModels\)[\s\S]*?추천 \$\{formatModelLabels\(recommendedTargetModels\)\}/,
  "Studio target AI panel should expose automatic recommendation state, manual override state, recommendation confidence, signals, and selected tools",
);
assertMatches(
  /const learningContextSummaryItems = useMemo\(\(\) => \{[\s\S]*?getEnabledMemoryScopeLabels\(enabledMemoryScopes\)[\s\S]*?label: "적용 scope"[\s\S]*?`\$\{enabledMemoryScopeCount\}\/4`[\s\S]*?최근 피드백만 반영[\s\S]*?label: "학습 메모리"[\s\S]*?`\$\{appliedContextMemories\.length\}개`[\s\S]*?신뢰도와 최신순 기준으로 반영[\s\S]*?label: "최근 피드백"[\s\S]*?`\$\{appliedFeedbackCount\}개`[\s\S]*?최근 실행 결과를 함께 반영/,
  "Studio learning context panel should expose enabled scope count, applied memory count, and recent feedback count before scope toggles",
);
assertMatches(
  /const learningContextWorkflowSteps = useMemo\(\(\) => \{[\s\S]*?getEnabledMemoryScopeLabels\(enabledMemoryScopes\)[\s\S]*?label: "Scope 선택"[\s\S]*?step: "01"[\s\S]*?`\$\{enabledMemoryScopeCount\}\/4 적용`[\s\S]*?label: "메모리 반영"[\s\S]*?step: "02"[\s\S]*?`\$\{appliedContextMemories\.length\}개 사용`[\s\S]*?label: "생성 저장"[\s\S]*?step: "03"[\s\S]*?title: savePlanLabel/,
  "Studio learning context panel should calculate numbered scope, memory, and save workflow steps",
);
assertMatches(
  /const nextGenerationSummary = useMemo\(\(\) => \{[\s\S]*?const hasPromptInput = Boolean\(rawInput\.trim\(\)\)[\s\S]*?status: hasPromptInput \? inputReadinessAnalysis\.statusLabel : "원문 필요"[\s\S]*?원문을 입력하면 생성 기준이 완성됩니다\.[\s\S]*?inputReadinessAnalysis\.status === "ready"[\s\S]*?현재 기준으로 전문 프롬프트를 생성합니다\.[\s\S]*?inputReadinessAnalysis\.status === "review"[\s\S]*?missingQuestionCount[\s\S]*?남은 보강 질문 \$\{missingQuestionCount\}개를 확인하면 결과가 더 안정됩니다\.[\s\S]*?보강 질문을 확인하면 결과가 더 안정됩니다\.[\s\S]*?목적과 출력 형식을 보강한 뒤 생성하세요\.[\s\S]*?promptLanguageDecision\.label[\s\S]*?formatModelLabels\([\s\S]*?selectedModels[\s\S]*?outputLanguageLabels\[outputLanguage\][\s\S]*?학습 메모리 \$\{appliedContextMemories\.length\}개[\s\S]*?최근 피드백 \$\{appliedFeedbackCount\}개[\s\S]*?저장 \$\{savePlanLabel\}[\s\S]*?source: sourceLabel/,
  "Studio next-generation summary should derive final input-readiness status, remaining-question count, language/model/answer-language detail, learning evidence, and saved-source plan",
);
assertMatches(
  /const nextGenerationMetricItems = \[[\s\S]*?label: "입력 품질"[\s\S]*?rawInput\.trim\(\) \? inputReadinessLabel : "원문 필요"[\s\S]*?label: "상태"[\s\S]*?nextGenerationSummary\.status[\s\S]*?label: "프롬프트 언어"[\s\S]*?promptLanguageDecision\.label[\s\S]*?label: "대상 AI"[\s\S]*?formatModelLabels\(selectedModels\)[\s\S]*?label: "학습 증거"[\s\S]*?appliedContextMemories\.length[\s\S]*?appliedFeedbackCount[\s\S]*?className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-5"[\s\S]*?data-testid="studio-next-generation-metrics"[\s\S]*?nextGenerationMetricItems\.map[\s\S]*?break-words text-xs font-semibold text-soft/,
  "Studio next-generation summary should expose input quality with remaining-question count, status, prompt language, target AI, and learning evidence in a compact final metrics grid",
);
assertMatches(
  /const nextGenerationChecklistItems = useMemo\([\s\S]*?질문을 원문에 붙이고 답을 채운 뒤 생성합니다\.[\s\S]*?label: "입력 보강"[\s\S]*?nextGenerationSummary\.detail[\s\S]*?label: "생성 실행"[\s\S]*?nextGenerationSummary\.status[\s\S]*?nextGenerationSummary\.source[\s\S]*?label: "저장 추적"[\s\S]*?nextGenerationSummary\.savePlan[\s\S]*?data-testid="studio-next-generation-checklist"[\s\S]*?nextGenerationChecklistItems\.map[\s\S]*?item\.label[\s\S]*?item\.value[\s\S]*?item\.detail/,
  "Studio next-generation summary should show a pre-run checklist for input reinforcement, generation execution, and save tracking",
);
assertMatches(
  /const nextGenerationChecklistItems = useMemo\([\s\S]*?label: "입력 보강"[\s\S]*?step: "01"[\s\S]*?label: "생성 실행"[\s\S]*?step: "02"[\s\S]*?label: "저장 추적"[\s\S]*?step: "03"[\s\S]*?data-testid="studio-next-generation-checklist"[\s\S]*?item\.step[\s\S]*?item\.label/,
  "Studio next-generation checklist should show numbered input, generation, and save-tracking stages",
);
assertMatches(
  /data-testid="studio-input-readiness-summary"[\s\S]*?생성 준비[\s\S]*?입력, 언어, 대상 AI, 학습 반영, 저장 흐름[\s\S]*?rawInput\.trim\(\) \? inputReadinessLabel : "원문 필요"[\s\S]*?studioPreparationSteps\.map/,
  "Studio input readiness summary should render the shared input readiness label before generation",
);
assertMatches(
  /data-testid="studio-input-readiness-summary"[\s\S]*?grid-cols-2[\s\S]*?studioPreparationSteps\.map[\s\S]*?step\.label[\s\S]*?step\.value[\s\S]*?step\.detail/,
  "Studio input readiness summary should keep preparation state compact in two columns on mobile",
);
assertMatches(
  /data-testid="studio-input-analysis-preflight"[\s\S]*?입력 분석[\s\S]*?목적, 맥락, 제약, 출력 형식[\s\S]*?inputReadinessLabel[\s\S]*?inputReadinessAnalysis\.summary[\s\S]*?grid grid-cols-2 gap-2 lg:grid-cols-4[\s\S]*?inputReadinessAnalysis\.items\.map[\s\S]*?item\.label[\s\S]*?item\.value[\s\S]*?item\.detail[\s\S]*?보강 질문 \{missingQuestionCount\}개[\s\S]*?inputReadinessAnalysis\.missingQuestions\.map[\s\S]*?onClick=\{copyInputReadinessReport\}[\s\S]*?data-testid="studio-input-analysis-copy"[\s\S]*?onClick=\{applyInputReadinessQuestions\}[\s\S]*?data-testid="studio-input-analysis-apply"/,
  "Studio input analysis preflight should show readiness score, four compact checks, remaining-question count, report copy, and apply actions before generation",
);
assertMatches(
  /async function copyInputReadinessReport\(\)[\s\S]*?buildPromptInputReadinessReportText\(\{[\s\S]*?analysis: inputReadinessAnalysis[\s\S]*?domain[\s\S]*?goal[\s\S]*?rawInput[\s\S]*?copyTextToClipboard\(reportText\)[\s\S]*?id: "input-analysis"[\s\S]*?title: "입력 분석 리포트"/,
  "Studio should copy input analysis as a report with manual fallback",
);
assertMatches(
  /function focusRawInput\(\)[\s\S]*?window\.requestAnimationFrame[\s\S]*?document\.getElementById\("studio-raw-input"\)[\s\S]*?scrollIntoView\(\{ block: "center", behavior: "smooth" \}\)[\s\S]*?focus\(\)[\s\S]*?rawInputElement instanceof HTMLTextAreaElement[\s\S]*?rawInputElement\.value\.length[\s\S]*?setSelectionRange\(inputEnd, inputEnd\)[\s\S]*?function getLoadedDraftSourceLabel/,
  "Studio should focus the raw input and move the cursor to the end after actions that ask the user to answer appended questions",
);
assertMatches(
  /const inputReadinessQuestionBlockApplied = rawInput\.includes\([\s\S]*?"추가로 답할 보강 질문:"[\s\S]*?function applyInputReadinessQuestions\(\)[\s\S]*?inputReadinessAnalysis\.missingQuestions\.length[\s\S]*?inputReadinessQuestionBlockApplied[\s\S]*?이미 추가된 보강 질문에 답을 채운 뒤 다시 생성하세요\.[\s\S]*?focusRawInput\(\)[\s\S]*?return[\s\S]*?missingQuestions\.flatMap[\s\S]*?`- \$\{question\}`[\s\S]*?"  답:"[\s\S]*?setRawInput\(\(current\) => `\$\{current\.trim\(\)\}\$\{questionBlock\}`\)[\s\S]*?입력 분석 보강 질문을 원문에 추가했습니다[\s\S]*?focusRawInput\(\)/,
  "Studio should append input-analysis missing questions only once, keep answer lines, and focus the raw input",
);
assertMatches(
  /<ContextOperatingFlow[\s\S]*?badge=\{[\s\S]*?rawInput\.trim\(\)[\s\S]*?\? inputReadinessLabel[\s\S]*?: "원문 필요"[\s\S]*?\}[\s\S]*?description="Studio는 원문을 바로 생성하지 않고 입력 상태, AI 판단, 학습 컨텍스트, 저장 흐름을 먼저 확인한 뒤 전문 프롬프트를 만듭니다\."[\s\S]*?items=\{studioGenerationOperatingFlowItems\}[\s\S]*?testId="studio-generation-operating-flow"[\s\S]*?title="Studio 생성 운영 흐름"/,
  "Studio should render the shared generation operating flow with the shared input readiness label before detailed controls",
);
assertMatches(
  /id="studio-raw-input"[\s\S]*?id="studio-decision-controls"[\s\S]*?id="studio-next-generation-action"[\s\S]*?id="studio-learning-context"/,
  "Studio generation operating flow anchors should point to stable sections in the workspace",
);
assertMatches(
  /data-testid="studio-next-generation-summary"[\s\S]*?다음 실행[\s\S]*?nextGenerationSummary\.status[\s\S]*?nextGenerationSummary\.title[\s\S]*?nextGenerationSummary\.detail[\s\S]*?nextGenerationSummary\.evidence[\s\S]*?nextGenerationSummary\.source[\s\S]*?inputReadinessAnalysis\.missingQuestions\.length[\s\S]*?onClick=\{applyInputReadinessQuestions\}[\s\S]*?data-testid="studio-next-generation-apply-questions"[\s\S]*?inputReadinessQuestionBlockApplied[\s\S]*?보강 질문 확인[\s\S]*?보강 질문 추가[\s\S]*?onClick=\{generatePrompt\}[\s\S]*?disabled=\{!rawInput\.trim\(\) \|\| isGenerating\}[\s\S]*?전문 프롬프트 생성/,
  "Studio next-generation summary should place final input-question action and generate action beside status, language/model detail, learning evidence, and source tracking",
);
assertMatches(
  /프롬프트 언어[\s\S]*?AI 판단 · \{promptLanguageDecision\.label\}[\s\S]*?promptLanguageDecision\.reason[\s\S]*?사용자 선택 없음[\s\S]*?languageDecisionSummaryItems\.map[\s\S]*?promptLanguageDecision\.signals\.map[\s\S]*?최종 답변 언어[\s\S]*?프롬프트 작성 언어는 위에서 자동 적용하고[\s\S]*?최종 답변 언어만 정합니다[\s\S]*?outputLanguages\.map\(\(item\) =>/,
  "Studio language controls should distinguish automatic prompt language from answer-language configuration",
);
assert.doesNotMatch(
  source,
  /setPromptLanguage|setLanguageStrategy/,
  "Studio should not expose manual prompt-language strategy state",
);
assertMatches(
  /대상 AI 도구[\s\S]*?AI 추천 · \{formatModelLabels\(recommendedTargetModels\)\}[\s\S]*?targetModelDecision\.reason[\s\S]*?targetModelRecommendationApplied[\s\S]*?modelsTouched \? "추천과 동일" : "자동 적용"[\s\S]*?추천 적용[\s\S]*?targetModelSelectionSummaryItems\.map[\s\S]*?targetModelDecision\.signals\.map[\s\S]*?targetModels\.map/,
  "Studio target AI controls should distinguish automatic target AI recommendation from manual model selection",
);
assertMatches(
  /적용 학습 컨텍스트[\s\S]*?appliedContextMemories\.length[\s\S]*?appliedFeedbackCount[\s\S]*?전체 켜기[\s\S]*?메모리 제외[\s\S]*?전체 보기[\s\S]*?learningContextSummaryItems\.map[\s\S]*?memoryScopeOptions\.map/,
  "Studio learning context controls should show learning context summary before scope toggles",
);
assertMatches(
  /id="studio-learning-context"[\s\S]*?learningContextSummaryItems\.map[\s\S]*?data-testid="studio-learning-context-workflow"[\s\S]*?learningContextWorkflowSteps\.map[\s\S]*?item\.step[\s\S]*?item\.label[\s\S]*?item\.title[\s\S]*?item\.detail[\s\S]*?memoryScopeOptions\.map/,
  "Studio learning context controls should show numbered workflow cards between summary metrics and scope toggles",
);
assertMatches(
  /const loadedDraftOperationalSummary = useMemo\(\(\) => \{[\s\S]*?loadedDraftSummary[\s\S]*?loadedDraftSource[\s\S]*?loadedDraftPersistence[\s\S]*?loadedDraftSourceKind/,
  "Studio draft operational summary should require the loaded draft source, persistence, and source-kind metadata",
);
assertMatches(
  /const chainLabel = improvementSource[\s\S]*?formatImprovementDepthLabel\(improvementDraftDepth\)[\s\S]*?"개선 체인 준비"[\s\S]*?"운영 출처 저장"/,
  "Studio draft operational summary should distinguish improvement chains from operational source saves",
);
assertMatches(
  /const saveExpectation = improvementSource[\s\S]*?원본 Library 프롬프트의 다음 개선본[\s\S]*?출처별 운영 이력/,
  "Studio draft operational summary should explain how the generated result will be saved",
);
assertIncludes(
  "저장 시 개선 체인이 아니라 Studio 저장 출처 메타로만 보존됩니다.",
  "Studio draft persistence metadata should use saved-source metadata wording",
);
assertIncludes(
  "Library와 Dashboard의 Studio 저장 출처 breakdown에서 별도 항목으로 추적됩니다.",
  "Studio draft source-kind metadata should describe Dashboard and Library saved-source breakdown tracking",
);
assertMatches(
  /source === "library-missing-source-metadata-queue"[\s\S]*?저장하면 Library 저장 출처 메타 없음 큐 결과로 분리되어 Dashboard와 Library의 저장 출처 breakdown에서 추적됩니다\.[\s\S]*?source === "library-missing-source-metadata-candidate"[\s\S]*?저장하면 Library 저장 출처 메타 없음 후보 결과로 분리되어 일반 저장 방식 후보와 별도로 추적됩니다\./,
  "Studio draft source-kind metadata should explain missing saved-source metadata queue and candidate tracking separately",
);
assertMatches(
  /function buildLibraryStudioSourceHref\([\s\S]*?new URLSearchParams\(\{ studioSource: source \}\)[\s\S]*?studioPersistence[\s\S]*?params\.set\("studio", studioPersistence\)[\s\S]*?promptId[\s\S]*?params\.set\("prompt", promptId\)[\s\S]*?sourceVariant[\s\S]*?params\.set\("studioVariant", sourceVariant\)[\s\S]*?return buildLibraryHref\(params\)[\s\S]*?if \(draft\.source\.startsWith\("library-"\)\) \{[\s\S]*?return buildLibraryStudioSourceHref\(\{[\s\S]*?source: draft\.source[\s\S]*?sourceVariant: draft\.sourceVariant[\s\S]*?\}\)[\s\S]*?\}[\s\S]*?if \(draft\.source\.startsWith\("skills-"\)\) \{[\s\S]*?return "\/skills";[\s\S]*?\}[\s\S]*?if \(draft\.source\.startsWith\("profile-"\)\) \{[\s\S]*?return "\/profile";[\s\S]*?\}[\s\S]*?if \(draft\.source\.startsWith\("company-"\)\) \{[\s\S]*?return "\/company";[\s\S]*?\}[\s\S]*?return "\/learning";/,
  "Studio draft source links should preserve Library saved-source/sourceVariant filters and fall back to Skills, Profile, Company, or Learning source routes",
);
assertMatches(
  /actionLabel: "초안으로 생성"/,
  "Studio draft operational summary should expose a direct generate action label",
);
assertMatches(
  /sourceLinkCopiedLabel: loadedDraftSummary\.sourceVariant[\s\S]*?"세부 유형 링크 복사됨"[\s\S]*?"원본 링크 복사됨"[\s\S]*?sourceLinkCopyLabel: loadedDraftSummary\.sourceVariant[\s\S]*?"세부 유형 링크 복사"[\s\S]*?"원본 링크 복사"[\s\S]*?sourceLinkFailedLabel: loadedDraftSummary\.sourceVariant[\s\S]*?"세부 유형 링크 복사 실패"[\s\S]*?"원본 링크 복사 실패"[\s\S]*?sourceLinkTitle: loadedDraftSummary\.sourceVariant[\s\S]*?"세부 유형 원본 조건 링크"[\s\S]*?"원본 링크"/,
  "Studio loaded draft operational summary should expose sourceVariant-aware source-link copy labels and fallback title",
);
assertMatches(
  /저장 방식[\s\S]*?loadedDraftOperationalSummary\.persistenceLabel[\s\S]*?저장 출처[\s\S]*?loadedDraftOperationalSummary\.sourceLabel[\s\S]*?저장 예정[\s\S]*?loadedDraftOperationalSummary\.chainLabel[\s\S]*?loadedDraftOperationalSummary\.sourceVariantLabel[\s\S]*?세부 초안 유형[\s\S]*?whitespace-nowrap[\s\S]*?onClick=\{generatePrompt\}[\s\S]*?disabled=\{!rawInput\.trim\(\) \|\| isGenerating\}[\s\S]*?loadedDraftOperationalSummary\.actionLabel/,
  "Studio loaded draft card should show persistence, saved source, sourceVariant, save expectation, and a direct generate action",
);
assertMatches(
  /data-testid="studio-loaded-draft-source-action"[\s\S]*?loadedDraftSource\.sourceActionLabel/,
  "Studio loaded draft card should expose the source action label as a stable action",
);
assertMatches(
  /async function copyLoadedDraftSourceLink\(\)[\s\S]*?formatAbsoluteInternalHref\([\s\S]*?loadedDraftSummary\.href[\s\S]*?window\.location\.origin[\s\S]*?const sourceLinkCopyBody = \[[\s\S]*?linkText[\s\S]*?출처 제목: \$\{loadedDraftSummary\.title\}[\s\S]*?Studio 저장 출처: \$\{loadedDraftSourceKind\.label\}[\s\S]*?세부 초안 유형: \$\{loadedDraftSource\.label\}[\s\S]*?원본 경로: \$\{loadedDraftSummary\.href\}[\s\S]*?copyTextToClipboard\(linkText\)[\s\S]*?id: "source-link"[\s\S]*?title:[\s\S]*?loadedDraftOperationalSummary\?\.sourceLinkTitle \?\? "원본 링크"[\s\S]*?body: sourceLinkCopyBody/,
  "Studio loaded draft source link copy should use an absolute URL and include source title, saved-source, and sourceVariant metadata in manual fallback",
);
assertMatches(
  /원본 경로 · \{loadedDraftSummary\.href\}[\s\S]*?원본 링크 복사는 현재 도메인을 포함한 절대 URL로[\s\S]*?Studio 저장 출처 · \{loadedDraftSourceKind\.label\}[\s\S]*?loadedDraftOperationalSummary\?\.sourceVariantLabel[\s\S]*?세부 초안 유형 ·[\s\S]*?loadedDraftOperationalSummary\.sourceVariantLabel[\s\S]*?data-testid="studio-loaded-draft-source-link-copy"[\s\S]*?sourceLinkCopied[\s\S]*?loadedDraftOperationalSummary\?\.sourceLinkCopiedLabel[\s\S]*?studioManualCopy\?\.id === "source-link"[\s\S]*?loadedDraftOperationalSummary\?\.sourceLinkFailedLabel[\s\S]*?loadedDraftOperationalSummary\?\.sourceLinkCopyLabel/,
  "Studio loaded draft card should explain absolute source-link copy, show saved-source/sourceVariant metadata, and expose a stable copy action with failure state",
);
assertFileIncludes(
  readme,
  "Studio 원문 입력 패널은 `생성 준비` 요약에서 입력 분석 상태, 100점 점수, 남은 보강 질문 수, 입력 길이, 목표/분야, 자동 언어 판단, 대상 AI, 적용 학습 메모리, 저장 예정 흐름을 생성 전에 보여줍니다.",
  "README should document Studio input readiness summary",
);
assertFileIncludes(
  readme,
  "Studio 생성 준비 요약은 모바일 2열과 데스크톱 4열로 입력 준비도, 생성 기준, 학습 반영, 저장 예정 상태를 짧게 훑게 합니다.",
  "README should document Studio compact responsive input readiness summary",
);
assertFileIncludes(
  readme,
  "Studio 생성 준비 요약의 상단 배지와 첫 번째 준비 항목은 생성 운영 흐름, 입력 분석 배지, 다음 실행 입력 품질 지표와 같은 입력 준비도 라벨을 사용합니다.",
  "README should document the shared input-readiness label in the preparation summary",
);
assertFileIncludes(
  readme,
  "Studio 입력 분석 프리플라이트는 목적, 맥락, 제약, 출력 형식 준비도를 100점 기준과 모바일 2열 체크로 보여주고 부족 항목은 보강 질문으로 제안합니다.",
  "README should document Studio input analysis preflight",
);
assertFileIncludes(
  readme,
  "Studio 입력 분석 리포트는 clipboard fallback과 수동 복사용 textarea를 제공하고, 보강 질문을 원문에 추가해 생성 전 입력을 바로 다듬을 수 있게 합니다.",
  "README should document Studio input analysis copy fallback and question-append action",
);
assertFileIncludes(
  readme,
  "Studio 생성 운영 흐름은 원문 입력, AI 판단, 학습 컨텍스트, 생성 실행 위치를 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 합니다.",
  "README should document Studio shared generation operating flow",
);
assertFileIncludes(
  readme,
  "Studio 생성 운영 흐름의 입력 단계는 입력 분석 상태와 100점 점수를 먼저 보여주고, 세부 줄 수와 목표/분야는 상세 설명으로 보존합니다.",
  "README should document Studio operating-flow input readiness score",
);
assertFileIncludes(
  readme,
  "Studio 프롬프트 언어 패널은 사용자가 선택하지 않고 AI 자동 판단 결과, 판단 신뢰도, 감지 신호, 답변 언어와의 분리를 보여줍니다.",
  "README should document Studio automatic prompt language decision summary",
);
assertFileIncludes(
  readme,
  "Studio 다음 실행 요약은 입력 분석 상태, 자동 언어 판단, 대상 AI, 답변 언어, 학습 반영 수, 저장 경로를 생성 버튼 옆에서 확인하게 합니다.",
  "README should document Studio next-generation summary",
);
assertFileIncludes(
  readme,
  "Studio 다음 실행 요약은 입력 품질, 상태, 프롬프트 언어, 대상 AI, 학습 증거를 모바일 2열과 데스크톱 5열로 생성 버튼 앞에서 다시 확인하게 합니다.",
  "README should document Studio compact next-generation metrics",
);
assertFileIncludes(
  readme,
  "Studio 다음 실행 요약은 `입력 보강`, `생성 실행`, `저장 추적` 체크를 함께 보여줘 생성 버튼을 누르기 전 보강 여부, 실행 기준, 저장 경로를 한 번에 확인하게 합니다.",
  "README should document Studio next-generation pre-run checklist",
);
assertFileIncludes(
  readme,
  "Studio 다음 실행 체크는 `01 입력 보강`, `02 생성 실행`, `03 저장 추적` 단계 번호를 함께 보여줘 생성 직전 확인 순서를 바로 읽게 합니다.",
  "README should document numbered Studio next-generation checklist",
);
assertFileIncludes(
  readme,
  "Studio 다음 실행 상태는 단순 생성 가능 여부가 아니라 입력 분석 상태를 반영해 `바로 생성`, `검토 후 생성`, `보강 필요` 중 하나로 표시합니다.",
  "README should document input-readiness-based next-generation status",
);
assertFileIncludes(
  readme,
  "Studio 다음 실행 요약은 보강 질문이 남아 있으면 생성 버튼 옆에 `보강 질문 추가`를 표시해 원문 입력으로 바로 반영합니다.",
  "README should document next-generation missing-question apply action",
);
assertFileIncludes(
  readme,
  "`보강 질문 추가`를 누르면 각 질문 아래 `답:` 입력 줄을 원문에 붙인 뒤 원문 입력으로 스크롤하고 포커스하며 커서를 끝으로 옮겨 바로 답을 채울 수 있게 합니다.",
  "README should document next-generation missing-question answer line, focus, and cursor behavior",
);
assertFileIncludes(
  readme,
  "Studio 입력 분석은 `보강 질문 추가`로 붙은 질문 문장과 빈 `답:` 자리 자체를 준비도 신호로 계산하지 않고, 사용자가 채운 답변만 다시 분석 기준에 반영합니다.",
  "README should document that unanswered appended question scaffolding does not inflate readiness",
);
assertFileIncludes(
  readme,
  "Studio 입력 분석은 100점에 가까워도 남은 보강 질문이 있으면 `검토 후 생성`으로 유지하고, 모든 준비 항목이 해결된 경우에만 `바로 생성`으로 전환합니다.",
  "README should document that remaining readiness questions keep Studio in review state",
);
assertFileIncludes(
  readme,
  "Studio 입력 분석과 다음 실행 요약은 남은 보강 질문 수를 같이 표시해 90/100처럼 높은 점수에서도 무엇을 더 채워야 하는지 바로 보이게 합니다.",
  "README should document visible remaining-question counts in analysis and final summary",
);
assertFileIncludes(
  readme,
  "Studio 생성 운영 흐름, 입력 분석 배지, 다음 실행의 입력 품질 지표는 같은 입력 준비도 라벨을 사용해 상태 해석이 화면마다 달라지지 않게 합니다.",
  "README should document the shared input-readiness label across the operating flow, analysis badge, and final input-quality metric",
);
assertFileIncludes(
  readme,
  "Studio 보강 질문 액션은 같은 질문 블록을 중복으로 붙이지 않고, 이미 추가된 상태에서는 `보강 질문 확인`으로 원문 입력에 포커스해 기존 `답:` 줄을 채우게 합니다.",
  "README should document duplicate prevention for appended input-readiness questions",
);
assertFileIncludes(
  readme,
  "Studio 대상 AI 패널은 자동 추천 적용, 추천과 동일, 수동 조정 상태와 추천 신뢰도, 선택 도구를 분리해 보여줍니다.",
  "README should document Studio target AI recommendation and manual override summary",
);
assertFileIncludes(
  readme,
  "Studio 대상 AI 자동 추천 이유는 실제 추천 모델명과 일치해야 하며, Codex 실행 신호가 포함된 기획 입력은 GPT와 Codex 조합으로 설명합니다.",
  "README should document target AI recommendation reason/model consistency",
);
assertFileIncludes(
  prd,
  "Studio 원문 입력 패널은 `생성 준비` 요약에서 입력 분석 상태, 100점 점수, 남은 보강 질문 수, 입력 길이, 목표/분야, 자동 언어 판단, 대상 AI, 적용 학습 메모리, 저장 예정 흐름을 생성 전에 확인할 수 있게 해야 한다.",
  "PRD should document Studio input readiness summary with the shared readiness label",
);
assertFileIncludes(
  prd,
  "Studio 생성 준비 요약은 모바일 2열과 데스크톱 4열로 입력 준비도, 생성 기준, 학습 반영, 저장 예정 상태를 짧게 훑게 해야 한다.",
  "PRD should document compact responsive input readiness summary with input readiness",
);
assertFileIncludes(
  prd,
  "Studio 생성 준비 요약의 상단 배지와 첫 번째 준비 항목은 생성 운영 흐름, 입력 분석 배지, 다음 실행 입력 품질 지표와 같은 입력 준비도 라벨을 사용해야 한다.",
  "PRD should document the shared input-readiness label in the preparation summary",
);
assertFileIncludes(
  prd,
  "Studio 다음 실행 요약은 입력 품질, 상태, 프롬프트 언어, 대상 AI, 학습 증거를 모바일 2열과 데스크톱 5열로 생성 버튼 앞에서 다시 확인하게 해야 한다.",
  "PRD should document Studio compact next-generation metrics with input quality",
);
assertFileIncludes(
  prd,
  "Studio 다음 실행 요약은 `입력 보강`, `생성 실행`, `저장 추적` 체크를 함께 보여줘 생성 버튼을 누르기 전 보강 여부, 실행 기준, 저장 경로를 한 번에 확인하게 해야 한다.",
  "PRD should document Studio next-generation pre-run checklist",
);
assertFileIncludes(
  prd,
  "Studio 다음 실행 체크는 `01 입력 보강`, `02 생성 실행`, `03 저장 추적` 단계 번호를 함께 보여줘 생성 직전 확인 순서를 바로 읽게 해야 한다.",
  "PRD should document numbered Studio next-generation checklist",
);
assertFileIncludes(
  prd,
  "Studio 다음 실행 상태는 단순 생성 가능 여부가 아니라 입력 분석 상태를 반영해 `바로 생성`, `검토 후 생성`, `보강 필요` 중 하나로 표시해야 한다.",
  "PRD should document input-readiness-based next-generation status",
);
assertFileIncludes(
  prd,
  "Studio 다음 실행 요약은 보강 질문이 남아 있으면 생성 버튼 옆에 `보강 질문 추가`를 표시해 원문 입력으로 바로 반영해야 한다.",
  "PRD should document next-generation missing-question apply action",
);
assertFileIncludes(
  prd,
  "`보강 질문 추가`를 누르면 각 질문 아래 `답:` 입력 줄을 원문에 붙인 뒤 원문 입력으로 스크롤하고 포커스하며 커서를 끝으로 옮겨 바로 답을 채울 수 있게 해야 한다.",
  "PRD should document next-generation missing-question answer line, focus, and cursor behavior",
);
assertFileIncludes(
  prd,
  "Studio 입력 분석은 `보강 질문 추가`로 붙은 질문 문장과 빈 `답:` 자리 자체를 준비도 신호로 계산하지 않고, 사용자가 채운 답변만 다시 분석 기준에 반영해야 한다.",
  "PRD should document that unanswered appended question scaffolding does not inflate readiness",
);
assertFileIncludes(
  prd,
  "Studio 입력 분석은 100점에 가까워도 남은 보강 질문이 있으면 `검토 후 생성`으로 유지하고, 모든 준비 항목이 해결된 경우에만 `바로 생성`으로 전환해야 한다.",
  "PRD should document that remaining readiness questions keep Studio in review state",
);
assertFileIncludes(
  prd,
  "Studio 입력 분석과 다음 실행 요약은 남은 보강 질문 수를 같이 표시해 90/100처럼 높은 점수에서도 무엇을 더 채워야 하는지 바로 보이게 해야 한다.",
  "PRD should document visible remaining-question counts in analysis and final summary",
);
assertFileIncludes(
  prd,
  "Studio 생성 운영 흐름, 입력 분석 배지, 다음 실행의 입력 품질 지표는 같은 입력 준비도 라벨을 사용해 상태 해석이 화면마다 달라지지 않게 해야 한다.",
  "PRD should document the shared input-readiness label across the operating flow, analysis badge, and final input-quality metric",
);
assertFileIncludes(
  prd,
  "Studio 보강 질문 액션은 같은 질문 블록을 중복으로 붙이지 않고, 이미 추가된 상태에서는 `보강 질문 확인`으로 원문 입력에 포커스해 기존 `답:` 줄을 채우게 해야 한다.",
  "PRD should document duplicate prevention for appended input-readiness questions",
);
assertFileIncludes(
  prd,
  "대상 AI 자동 추천 이유는 실제 추천 모델명과 일치해야 하며, Codex 실행 신호가 포함된 기획 입력은 GPT와 Codex 조합으로 설명해야 한다.",
  "PRD should document target AI recommendation reason/model consistency",
);
assertFileIncludes(
  prd,
  "Studio 생성 운영 흐름의 입력 단계는 입력 분석 상태와 100점 점수를 먼저 보여주고, 세부 줄 수와 목표/분야는 상세 설명으로 보존해야 한다.",
  "PRD should document Studio operating-flow input readiness score",
);
assertFileIncludes(
  prd,
  "Studio 적용 학습 컨텍스트는 `01 Scope 선택`, `02 메모리 반영`, `03 생성 저장` 단계 카드로 학습 scope 선택, 상위 메모리 반영, Library 저장 추적 순서를 scope 토글보다 먼저 보여줘야 한다.",
  "PRD should document Studio learning context workflow cards",
);
assertFileIncludes(
  developmentBrief,
  "원문 입력 패널은 `생성 준비` 요약에서 입력 분석 상태, 100점 점수, 남은 보강 질문 수, 입력 길이, 목표/분야, 자동 언어 판단, 대상 AI, 적용 학습 메모리, 저장 예정 흐름을 생성 전에 확인",
  "Development brief should document Studio input readiness summary with the shared readiness label",
);
assertFileIncludes(
  developmentBrief,
  "생성 준비 요약은 모바일 2열과 데스크톱 4열로 입력 준비도, 생성 기준, 학습 반영, 저장 예정 상태를 짧게 훑게 함",
  "Development brief should document compact responsive input readiness summary with input readiness",
);
assertFileIncludes(
  developmentBrief,
  "생성 준비 요약의 상단 배지와 첫 번째 준비 항목은 생성 운영 흐름, 입력 분석 배지, 다음 실행 입력 품질 지표와 같은 입력 준비도 라벨을 사용",
  "Development brief should document the shared input-readiness label in the preparation summary",
);
assertFileIncludes(
  developmentBrief,
  "다음 실행 요약은 입력 품질, 상태, 프롬프트 언어, 대상 AI, 학습 증거를 모바일 2열과 데스크톱 5열로 생성 버튼 앞에서 재확인",
  "Development brief should document compact next-generation metrics with input quality",
);
assertFileIncludes(
  developmentBrief,
  "다음 실행 요약은 `입력 보강`, `생성 실행`, `저장 추적` 체크를 함께 보여줘 생성 버튼을 누르기 전 보강 여부, 실행 기준, 저장 경로를 한 번에 확인하게 함",
  "Development brief should document Studio next-generation pre-run checklist",
);
assertFileIncludes(
  developmentBrief,
  "다음 실행 체크는 `01 입력 보강`, `02 생성 실행`, `03 저장 추적` 단계 번호를 함께 보여줘 생성 직전 확인 순서를 바로 읽게 함",
  "Development brief should document numbered Studio next-generation checklist",
);
assertFileIncludes(
  developmentBrief,
  "다음 실행 상태는 단순 생성 가능 여부가 아니라 입력 분석 상태를 반영해 `바로 생성`, `검토 후 생성`, `보강 필요` 중 하나로 표시",
  "Development brief should document input-readiness-based next-generation status",
);
assertFileIncludes(
  developmentBrief,
  "다음 실행 요약은 보강 질문이 남아 있으면 생성 버튼 옆에 `보강 질문 추가`를 표시해 원문 입력으로 바로 반영",
  "Development brief should document next-generation missing-question apply action",
);
assertFileIncludes(
  developmentBrief,
  "`보강 질문 추가`를 누르면 각 질문 아래 `답:` 입력 줄을 원문에 붙인 뒤 원문 입력으로 스크롤하고 포커스하며 커서를 끝으로 옮겨 바로 답을 채울 수 있게 함",
  "Development brief should document next-generation missing-question answer line, focus, and cursor behavior",
);
assertFileIncludes(
  developmentBrief,
  "입력 분석은 `보강 질문 추가`로 붙은 질문 문장과 빈 `답:` 자리 자체를 준비도 신호로 계산하지 않고, 사용자가 채운 답변만 다시 분석 기준에 반영",
  "Development brief should document that unanswered appended question scaffolding does not inflate readiness",
);
assertFileIncludes(
  developmentBrief,
  "입력 분석은 100점에 가까워도 남은 보강 질문이 있으면 `검토 후 생성`으로 유지하고, 모든 준비 항목이 해결된 경우에만 `바로 생성`으로 전환",
  "Development brief should document that remaining readiness questions keep Studio in review state",
);
assertFileIncludes(
  developmentBrief,
  "입력 분석과 다음 실행 요약은 남은 보강 질문 수를 같이 표시해 90/100처럼 높은 점수에서도 무엇을 더 채워야 하는지 바로 보이게 함",
  "Development brief should document visible remaining-question counts in analysis and final summary",
);
assertFileIncludes(
  developmentBrief,
  "생성 운영 흐름, 입력 분석 배지, 다음 실행의 입력 품질 지표는 같은 입력 준비도 라벨을 사용해 상태 해석이 화면마다 달라지지 않게 함",
  "Development brief should document the shared input-readiness label across the operating flow, analysis badge, and final input-quality metric",
);
assertFileIncludes(
  developmentBrief,
  "보강 질문 액션은 같은 질문 블록을 중복으로 붙이지 않고, 이미 추가된 상태에서는 `보강 질문 확인`으로 원문 입력에 포커스해 기존 `답:` 줄을 채우게 함",
  "Development brief should document duplicate prevention for appended input-readiness questions",
);
assertFileIncludes(
  developmentBrief,
  "대상 AI 자동 추천 이유는 실제 추천 모델명과 일치해야 하며, Codex 실행 신호가 포함된 기획 입력은 GPT와 Codex 조합으로 설명",
  "Development brief should document target AI recommendation reason/model consistency",
);
assertFileIncludes(
  developmentBrief,
  "생성 운영 흐름의 입력 단계는 입력 분석 상태와 100점 점수를 먼저 보여주고, 세부 줄 수와 목표/분야는 상세 설명으로 보존",
  "Development brief should document Studio operating-flow input readiness score",
);
assertFileIncludes(
  developmentBrief,
  "Studio 적용 학습 컨텍스트는 `01 Scope 선택`, `02 메모리 반영`, `03 생성 저장` 단계 카드로 학습 scope 선택, 상위 메모리 반영, Library 저장 추적 순서를 scope 토글보다 먼저 보여줌",
  "Development brief should document Studio learning context workflow cards",
);
assertFileIncludes(
  readme,
  "Studio 적용 학습 컨텍스트 패널은 적용 scope 수, 학습 메모리 수, 최근 피드백 수를 scope 토글 위에서 먼저 보여줍니다.",
  "README should document Studio learning context summary",
);
assertFileIncludes(
  readme,
  "Studio 적용 학습 컨텍스트는 `01 Scope 선택`, `02 메모리 반영`, `03 생성 저장` 단계 카드로 학습 scope 선택, 상위 메모리 반영, Library 저장 추적 순서를 scope 토글보다 먼저 보여줍니다.",
  "README should document Studio learning context workflow cards",
);
assertFileIncludes(
  readme,
  "Studio 불러온 초안의 운영 상태 요약: 저장 방식, 저장 출처, 세부 초안 유형, 저장 예정 체인, 생성 후 보존 방식 표시와 직접 생성, 세부 유형 기준 원본 링크 복사 문구와 fallback 출처 제목/세부 유형 메타, 명시 원본 경로가 없는 Library 운영 초안의 저장 출처/세부 유형 필터 fallback, Skills/Profile/Company 초안의 원본 화면 fallback",
  "README should document Studio loaded draft sourceVariant operational summary",
);
assertFileIncludes(
  readme,
  "Dashboard, Learning, Library, Skills, Profile, Company에서 Studio 초안을 열면",
  "README should document that Skills, Profile, and Company can hand off Studio drafts with source links",
);
assertFileIncludes(
  readme,
  "Skills 스킬 편집 화면, Profile/Company 기준 화면까지 복원합니다.",
  "README should document Skills/Profile/Company sourceHref restoration for Studio drafts",
);

console.log("Studio draft operational summary verification passed.");
