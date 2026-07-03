import assert from "node:assert/strict";
import { loadTypescriptModule } from "./lib/load-typescript-module.mjs";
import { readConcatenatedSources, readSource } from "./lib/read-source.mjs";

const source = readConcatenatedSources([
  "src/lib/skills-view/labels.ts",
  "src/lib/skills-view/hrefs.ts",
  "src/lib/skills-view/report-text.ts",
  "src/components/skills/skills-view-types.ts",
  "src/components/skills/skills-view.tsx",
  "src/components/skills/skills-candidates-panel.tsx",
  "src/components/skills/skills-operations-panel.tsx",
  "src/components/skills/skills-saved-list-panel.tsx",
  "src/components/skills/skills-template-panel.tsx",
]);
const manualCopyPanelSource = readSource(
  "src/components/common/manual-copy-panel.tsx",
);
const readme = readSource("README.md");
const prd = readSource("docs/personalized-prompt-ai-prd.md");
const promptTypes = readSource("src/lib/prompt/types.ts");
const sourceRegistry = readSource("src/lib/studio/source-registry.ts");
const developmentBrief = readSource("docs/codex-development-brief.md");
const { createSkillFromPrompt, getBestVersion } = loadTypescriptModule(
  "src/lib/skills/skill-builder.ts",
);
const { buildSkillRunPrompt, createPromptFromSkillRun } = loadTypescriptModule(
  "src/lib/skills/skill-runner.ts",
);

function assertMatches(pattern, message) {
  assert.match(source, pattern, message);
}

function assertFileIncludes(fileSource, text, message) {
  assert.ok(fileSource.includes(text), message);
}

function assertFileNotIncludes(fileSource, text, message) {
  assert.ok(!fileSource.includes(text), message);
}

const sourcePrompt = {
  id: "prompt_language_contract",
  title: "Codex billing report brief",
  source: "local",
  languageStrategy: "english",
  languageDecision: {
    strategy: "english",
    label: "전체 영어 지시문",
    reason: "개발 또는 Codex 중심 작업은 영어 실행 지시가 안정적입니다.",
    confidence: "strong",
    signals: ["개발/Codex 작업 신호", "실행 지시 안정성 우선"],
  },
  outputLanguage: "english",
  rawInput: "Refactor the billing report component.",
  goal: "Codex implementation brief",
  domain: "개발",
  targetModels: ["codex"],
  versions: [
    {
      id: "version_language_contract",
      targetModel: "codex",
      modelLabel: "Codex",
      content:
        "Role:\nYou are a senior Codex engineer.\n\n품질 기준:\n- Inspect the repository before editing\n- Run lint and build",
      qualityScore: 92,
      scoreBreakdown: {
        clarity: 18,
        context: 18,
        constraints: 18,
        output: 18,
        modelFit: 20,
      },
      assumptions: [],
      missingContext: [],
      createdAt: "2026-06-29T00:00:00.000Z",
    },
  ],
  feedback: [],
  createdAt: "2026-06-29T00:00:00.000Z",
  updatedAt: "2026-06-29T00:00:00.000Z",
};
const sourceSkill = createSkillFromPrompt(
  sourcePrompt,
  getBestVersion(sourcePrompt),
  [],
);
const sourceSkillRunPrompt = buildSkillRunPrompt(
  sourceSkill,
  "Update the payment table and include a release checklist.",
);
const sourceSkillRunAsset = createPromptFromSkillRun(
  sourceSkill,
  "Update the payment table and include a release checklist.",
);

assert.equal(
  sourceSkill.languageStrategy,
  "english",
  "Skills created from prompts should preserve the automatic prompt language strategy",
);
assert.equal(
  sourceSkill.languageDecision?.reason,
  sourcePrompt.languageDecision.reason,
  "Skills created from prompts should preserve the automatic prompt language decision reason",
);
assert.equal(
  sourceSkill.outputLanguage,
  "english",
  "Skills created from prompts should preserve the desired answer language",
);
assert.equal(
  sourceSkill.targetModel,
  "codex",
  "Skills created from prompts should preserve the source target AI",
);
assert.match(
  sourceSkillRunPrompt,
  /Write the final executable prompt primarily in English[\s\S]*?The target AI's final answer must be written in English/,
  "Skill run prompt should apply the preserved English prompt and answer-language guidance",
);
assert.equal(
  sourceSkillRunAsset.languageStrategy,
  "english",
  "Skill run assets should keep the skill language strategy",
);
assert.equal(
  sourceSkillRunAsset.outputLanguage,
  "english",
  "Skill run assets should keep the skill answer language",
);
assert.equal(
  sourceSkillRunAsset.languageDecision?.reason,
  sourcePrompt.languageDecision.reason,
  "Skill run assets should carry the original language decision reason",
);
assert.match(
  sourceSkillRunAsset.versions[0].assumptions.join("\n"),
  /언어 판단 이유: 개발 또는 Codex 중심 작업은 영어 실행 지시가 안정적입니다\.[\s\S]*?최종 답변 언어는 영어로 설정함/,
  "Skill run assumptions should keep language-decision and answer-language evidence",
);

assertMatches(
  /import \{[\s\S]*?ContextOperatingFlow[\s\S]*?type ContextOperatingFlowItem[\s\S]*?\} from "@\/components\/context\/context-operating-flow";/,
  "Skills should reuse the shared context operating flow component",
);
assertMatches(
  /const skillsOperatingFlowItems = useMemo<ContextOperatingFlowItem\[\]>\([\s\S]*?actionLabel: "후보 확인"[\s\S]*?href: "#skills-candidates"[\s\S]*?label: "원본"[\s\S]*?step: "01"[\s\S]*?actionLabel: "템플릿 편집"[\s\S]*?href: "#skills-template"[\s\S]*?label: "템플릿"[\s\S]*?step: "02"[\s\S]*?actionLabel: "실행 영역으로 이동"[\s\S]*?href: "#skills-runner"[\s\S]*?label: "실행"[\s\S]*?step: "03"[\s\S]*?actionLabel: "운영 요약 확인"[\s\S]*?href: "#skills-operations"[\s\S]*?label: "개선"[\s\S]*?step: "04"/,
  "Skills operating flow should map candidate, template, run, and operations anchors",
);
assertMatches(
  /<ContextOperatingFlow[\s\S]*?badge=\{draft\.name\.trim\(\) \? "스킬 편집 중" : "스킬 선택 필요"\}[\s\S]*?description="Skills는 좋은 프롬프트를 바로 자동화하지 않고 원본 확인, 템플릿 정리, 실행 저장, 운영 개선 순서로 반복 업무 자산을 만듭니다\."[\s\S]*?items=\{skillsOperatingFlowItems\}[\s\S]*?testId="skills-operating-flow"[\s\S]*?title="Skills 운영 흐름"/,
  "Skills should render the shared operating flow before candidate and template panels",
);
assertMatches(
  /const skillOperationalSummaryItems = \[[\s\S]*?label: "전체 실행"[\s\S]*?skillRunStats\.totalRuns[\s\S]*?label: "실행 스킬"[\s\S]*?skillRunStats\.activeSkills[\s\S]*?label: "피드백"[\s\S]*?skillRunStats\.feedbackCount[\s\S]*?label: "최근 실행"[\s\S]*?skillRunStats\.latestRun[\s\S]*?label: "반복 상위"[\s\S]*?skillRunStats\.topSkills\.length[\s\S]*?label: "개선 큐"[\s\S]*?skillRunStats\.improvementQueue\.length[\s\S]*?data-testid="skills-operational-metrics"[\s\S]*?grid grid-cols-2 gap-3 text-xs sm:grid-cols-3[\s\S]*?skillOperationalSummaryItems\.map[\s\S]*?min-w-0 rounded-md border border-line bg-surface px-3 py-3[\s\S]*?break-words text-sm font-semibold text-accent/,
  "Skills operational metrics should show run, feedback, latest-run, top-skill, and improvement queue signals in a compact two-column mobile grid and three-column desktop grid",
);
assertMatches(
  /const skillExecutionWorkflowSteps = useMemo\([\s\S]*?label: "템플릿 확인"[\s\S]*?step: "01"[\s\S]*?label: "실행 검증"[\s\S]*?step: "02"[\s\S]*?label: "운영 저장"[\s\S]*?step: "03"[\s\S]*?data-testid="skills-execution-readiness-workflow"[\s\S]*?skillExecutionWorkflowSteps\.map[\s\S]*?item\.step[\s\S]*?item\.label[\s\S]*?item\.title[\s\S]*?item\.detail/,
  "Skills operational summary should render numbered template, run validation, and Library save workflow cards",
);
assertMatches(
  /id="skills-candidates"[\s\S]*?id="skills-operations"[\s\S]*?id="skills-template"[\s\S]*?id="skills-runner"/,
  "Skills operating flow should point to stable candidate, operations, template, and run anchors",
);
assertMatches(
  /function buildSkillRunLibraryHref\(prompt: PromptAsset\)[\s\S]*?buildPromptLibraryHref\(prompt\.id, getBestVersion\(prompt\)\.targetModel\)/,
  "Skills should use one helper for skill-run Library detail links",
);
assertMatches(
  /function buildSkillRunLibraryLinkCopyBody\(\{[\s\S]*?linkText: string[\s\S]*?prompt: PromptAsset[\s\S]*?skillName\?: string[\s\S]*?const bestVersion = getBestVersion\(prompt\)[\s\S]*?실행 프롬프트: \$\{prompt\.title\}[\s\S]*?스킬: \$\{skillName\}[\s\S]*?대상 AI: \$\{modelLabels\[bestVersion\.targetModel\]\}[\s\S]*?품질: \$\{bestVersion\.qualityScore\.toFixed\(1\)\}[\s\S]*?피드백: \$\{prompt\.feedback\.length\}개[\s\S]*?생성일: \$\{formatTimestamp\(prompt\.createdAt\)\}/,
  "Skills should build reusable Library link fallback metadata for saved, latest, and historical skill runs",
);
assertMatches(
  /function buildSkillsOperationalSummaryReportText\(\{[\s\S]*?baseUrl[\s\S]*?stats: SkillRunStats[\s\S]*?# Skills 운영 요약 리포트[\s\S]*?전체 실행 프롬프트: \$\{stats\.totalRuns\}개[\s\S]*?최근 실행:[\s\S]*?formatReportInternalHref\([\s\S]*?buildSkillRunLibraryHref\(stats\.latestRun\)[\s\S]*?baseUrl[\s\S]*?## 반복 사용 상위 스킬[\s\S]*?formatReportInternalHref\([\s\S]*?buildSkillHref\(item\.skill\.id\)[\s\S]*?baseUrl[\s\S]*?## 개선 필요 큐[\s\S]*?formatReportInternalHref\([\s\S]*?buildSkillHref\(item\.skill\.id\)[\s\S]*?baseUrl[\s\S]*?Recommended next actions/,
  "Skills operational summary report should include absolute-ready latest-run Library links and Skills queue links",
);
assertMatches(
  /function buildSkillsOperationalSummaryStudioPrompt\(\{[\s\S]*?baseUrl[\s\S]*?stats: SkillRunStats[\s\S]*?Use the Skills operations report[\s\S]*?Use the Library and Skills links in the report as the operating queues[\s\S]*?buildSkillsOperationalSummaryReportText\(\{ baseUrl, stats \}\)/,
  "Skills operational summary Studio prompt should reuse the absolute-link report as operating queues",
);
assertMatches(
  /import \{ getStudioDraftDisplaySourceLabel \} from "@\/lib\/studio\/draft-display";[\s\S]*?const selectedPromptStudioSourceDisplay = useMemo\(\(\) => \{[\s\S]*?selectedPrompt\?\.studioSource[\s\S]*?getStudioDraftDisplaySourceLabel\([\s\S]*?selectedPrompt\.studioSource[\s\S]*?\)\.label[\s\S]*?sourceTitle: selectedPrompt\.studioSource\.sourceTitle[\s\S]*?sourceVariantLabel: selectedPrompt\.studioSource\.sourceVariant[\s\S]*?\? label[\s\S]*?: null/,
  "Skills selected source prompt should derive Studio saved-source, source title, and sourceVariant display labels",
);
assertMatches(
  /async function copySelectedPromptLibraryLink\(\)[\s\S]*?formatAbsoluteInternalHref\([\s\S]*?selectedPromptLibraryHref[\s\S]*?window\.location\.origin[\s\S]*?const sourceLinkCopyBody = \[[\s\S]*?linkText[\s\S]*?원본 프롬프트: \$\{selectedPrompt\.title\}[\s\S]*?대상 AI: \$\{modelLabels\[selectedPromptBestVersion\.targetModel\]\}[\s\S]*?Studio 저장 출처: \$\{selectedPromptStudioSourceDisplay\.label\}[\s\S]*?세부 초안 유형: \$\{selectedPromptStudioSourceDisplay\.sourceVariantLabel\}[\s\S]*?출처 제목: \$\{selectedPromptStudioSourceDisplay\.sourceTitle\}[\s\S]*?피드백: \$\{selectedPrompt\.feedback\.length\}개[\s\S]*?원본 경로: \$\{selectedPromptLibraryHref\}[\s\S]*?copyTextToClipboard\(linkText\)[\s\S]*?id: "source-link"[\s\S]*?title: "원본 Library 링크"[\s\S]*?body: sourceLinkCopyBody/,
  "Skills selected source prompt Library link fallback should include prompt, target AI, saved-source, source title, sourceVariant, feedback, and original path metadata",
);
assertMatches(
  /async function copyRunPrompt\(\)[\s\S]*?const runPromptCopyBody = \[[\s\S]*?# 실행 프롬프트 · \$\{draft\.name \|\| "이름 없는 스킬"\}[\s\S]*?대상 AI: \$\{modelLabels\[draftWithAutomaticLanguage\.targetModel\]\}[\s\S]*?언어 전략: \$\{[\s\S]*?languageStrategyLabels\[getSkillLanguageStrategy\(draftWithAutomaticLanguage\)\][\s\S]*?답변 언어: \$\{[\s\S]*?outputLanguageLabels\[getSkillOutputLanguage\(draftWithAutomaticLanguage\)\][\s\S]*?실행 입력: \$\{[\s\S]*?runInput\.trim\(\)\.slice\(0, 300\)[\s\S]*?## Prompt[\s\S]*?runPrompt[\s\S]*?copyTextToClipboard\(runPrompt\)[\s\S]*?id: "run"[\s\S]*?title: "실행 프롬프트"[\s\S]*?body: runPromptCopyBody/,
  "Skills run prompt fallback should include skill, target AI, language, input preview, and prompt body metadata",
);
assertMatches(
  /function buildSkillImprovementPlanCopyBody\(\{[\s\S]*?skill: PromptSkill[\s\S]*?insight: SkillFeedbackInsight[\s\S]*?plan: SkillImprovementPlan[\s\S]*?# Skill Improvement Plan · \$\{skill\.name \|\| "이름 없는 스킬"\}[\s\S]*?상태: \$\{feedbackStatusLabel\(insight\.status\)\}[\s\S]*?대상 AI: \$\{modelLabels\[skill\.targetModel\]\}[\s\S]*?언어 전략: \$\{languageStrategyLabels\[getSkillLanguageStrategy\(skill\)\]\}[\s\S]*?답변 언어: \$\{outputLanguageLabels\[getSkillOutputLanguage\(skill\)\]\}[\s\S]*?성공률: \$\{insight\.successRate\}%[\s\S]*?피드백: \$\{insight\.feedbackCount\}개[\s\S]*?## Recommendations[\s\S]*?## Planned Changes[\s\S]*?## Latest Comments/,
  "Skills improvement plan copy body should include skill, AI, language, feedback metrics, recommendations, planned changes, and latest comments",
);
assertMatches(
  /async function copyImprovementPlan\(\)[\s\S]*?buildSkillImprovementPlanCopyBody\(\{[\s\S]*?skill: draftWithAutomaticLanguage[\s\S]*?insight: selectedFeedbackInsight[\s\S]*?plan: improvementPlan[\s\S]*?copyTextToClipboard\(improvementPlanCopyBody\)[\s\S]*?id: "improvement-plan"[\s\S]*?title: "스킬 개선 계획"[\s\S]*?body: improvementPlanCopyBody/,
  "Skills improvement recommendation card should copy a metadata-rich improvement plan with fallback",
);
assertMatches(
  /function buildSkillImprovementPlanStudioPrompt\(\{[\s\S]*?planText: string[\s\S]*?skill: PromptSkill[\s\S]*?const inputGuide = skill\.inputGuide\.trim\(\)[\s\S]*?const outputFormat = skill\.outputFormat\.trim\(\)[\s\S]*?const promptTemplate =[\s\S]*?Role:[\s\S]*?senior prompt engineer improving a reusable AI skill template[\s\S]*?Objective:[\s\S]*?Instructions:[\s\S]*?Current skill context:[\s\S]*?Name: \$\{skill\.name \|\| "이름 없는 스킬"\}[\s\S]*?Target AI: \$\{modelLabels\[skill\.targetModel\]\}[\s\S]*?Language strategy: \$\{languageStrategyLabels\[getSkillLanguageStrategy\(skill\)\]\}[\s\S]*?Input guide:[\s\S]*?inputGuide[\s\S]*?Output format:[\s\S]*?outputFormat[\s\S]*?Quality checklist:[\s\S]*?skill\.qualityChecklist\.map[\s\S]*?Current prompt template:[\s\S]*?promptTemplate[\s\S]*?Skill improvement plan:[\s\S]*?planText/,
  "Skills should build an execution-ready Studio prompt with current skill context and the improvement plan",
);
assertMatches(
  /function openImprovementPlanInStudio\(\)[\s\S]*?const rawInput = buildSkillImprovementPlanStudioPrompt\(\{[\s\S]*?planText: improvementPlanCopyBody[\s\S]*?skill: draftWithAutomaticLanguage[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "skills-improvement-plan"[\s\S]*?rawInput[\s\S]*?goal: "스킬 템플릿 개선 계획"[\s\S]*?targetModels: \[draftWithAutomaticLanguage\.targetModel\][\s\S]*?sourceTitle: `Skills 개선 계획 · \$\{draft\.name \|\| "이름 없는 스킬"\}`[\s\S]*?sourceHref: buildSkillHref\(draft\.id\)[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setImprovementPlanCopied\(false\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "improvement-plan"[\s\S]*?title: "스킬 개선 계획"[\s\S]*?body: rawInput[\s\S]*?Studio 초안을 저장하지 못했습니다\. 아래 개선 계획 원문을 직접 선택해 복사하세요\.[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=skills-improvement-plan"\)/,
  "Skills improvement plan should open a dedicated Studio draft and keep manual fallback when draft storage fails",
);
assertMatches(
  /async function copyTemplate\(\)[\s\S]*?const templateCopyBody = \[[\s\S]*?# 스킬 템플릿 · \$\{draft\.name \|\| "이름 없는 스킬"\}[\s\S]*?대상 AI: \$\{modelLabels\[draftWithAutomaticLanguage\.targetModel\]\}[\s\S]*?언어 전략: \$\{[\s\S]*?languageStrategyLabels\[getSkillLanguageStrategy\(draftWithAutomaticLanguage\)\][\s\S]*?답변 언어: \$\{[\s\S]*?outputLanguageLabels\[getSkillOutputLanguage\(draftWithAutomaticLanguage\)\][\s\S]*?출력 형식: \$\{draft\.outputFormat\.trim\(\)\}[\s\S]*?품질 체크리스트: \$\{draft\.qualityChecklist\.join\(", "\)\}[\s\S]*?## Template[\s\S]*?draft\.promptTemplate[\s\S]*?copyTextToClipboard\(draft\.promptTemplate\)[\s\S]*?id: "template"[\s\S]*?title: "스킬 템플릿"[\s\S]*?body: templateCopyBody/,
  "Skills template fallback should include skill, target AI, language, output format, checklist, and template body metadata",
);
assertMatches(
  /async function copySavedRunLibraryLink\(\)[\s\S]*?savedRunPromptLibraryHref \|\| !savedRunPrompt[\s\S]*?formatAbsoluteInternalHref\([\s\S]*?savedRunPromptLibraryHref[\s\S]*?window\.location\.origin[\s\S]*?buildSkillRunLibraryLinkCopyBody\(\{[\s\S]*?linkText[\s\S]*?prompt: savedRunPrompt[\s\S]*?skillName: draft\.name[\s\S]*?copyTextToClipboard\(linkText\)[\s\S]*?id: "run-link"[\s\S]*?title: "실행 Library 링크"[\s\S]*?body: runLinkCopyBody/,
  "Skills saved run link copy should use absolute URLs with reusable skill-run fallback metadata",
);
assertMatches(
  /async function copyLatestSkillRunLibraryLink\(\)[\s\S]*?latestSkillRunLibraryHref[\s\S]*?skillRunStats\.latestRun[\s\S]*?formatAbsoluteInternalHref\([\s\S]*?latestSkillRunLibraryHref[\s\S]*?window\.location\.origin[\s\S]*?buildSkillRunLibraryLinkCopyBody\(\{[\s\S]*?linkText[\s\S]*?prompt: skillRunStats\.latestRun[\s\S]*?skillName: skillRunStats\.latestRun\.sourceSkillName[\s\S]*?copyTextToClipboard\(linkText\)[\s\S]*?id: "latest-run-link"[\s\S]*?title: "최근 실행 Library 링크"[\s\S]*?body: latestRunLinkCopyBody/,
  "Skills latest run summary should copy an absolute Library link with skill-run fallback metadata",
);
assertMatches(
  /async function copySkillRunHistoryLibraryLink\(prompt: PromptAsset\)[\s\S]*?buildSkillRunLibraryHref\(prompt\)[\s\S]*?formatAbsoluteInternalHref\(runHref, window\.location\.origin\)[\s\S]*?buildSkillRunLibraryLinkCopyBody\(\{[\s\S]*?linkText[\s\S]*?prompt[\s\S]*?skillName: prompt\.sourceSkillName[\s\S]*?copyTextToClipboard\(linkText\)[\s\S]*?id: "run-history-link"[\s\S]*?targetId: prompt\.id[\s\S]*?title: "실행 이력 Library 링크"[\s\S]*?body: runHistoryLinkCopyBody/,
  "Skills run history rows should copy absolute Library links with per-run fallback metadata",
);
assertMatches(
  /async function copySkillsOperationalSummaryReport\(\)[\s\S]*?buildSkillsOperationalSummaryReportText\(\{[\s\S]*?baseUrl: typeof window === "undefined" \? undefined : window\.location\.origin[\s\S]*?stats: skillRunStats[\s\S]*?copyTextToClipboard\(reportText\)[\s\S]*?setOperationsReportCopied\(copiedToClipboard\)[\s\S]*?id: "operations-report"[\s\S]*?title: "Skills 운영 요약 리포트"[\s\S]*?body: reportText/,
  "Skills operational summary report should copy an absolute-link report with manual fallback",
);
assertMatches(
  /function openSkillsOperationalSummaryInStudio\(\)[\s\S]*?const rawInput = buildSkillsOperationalSummaryStudioPrompt\(\{[\s\S]*?baseUrl[\s\S]*?stats: skillRunStats[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "skills-operational-summary"[\s\S]*?rawInput[\s\S]*?goal: "스킬 운영 개선 계획"[\s\S]*?targetModels: \["gpt", "claude", "codex"\][\s\S]*?sourceTitle: "Skills 운영 요약 리포트"[\s\S]*?sourceHref: "\/skills"[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setOperationsReportCopied\(false\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "operations-report"[\s\S]*?title: "Skills 운영 요약 리포트"[\s\S]*?body: rawInput[\s\S]*?Studio 초안을 저장하지 못했습니다\. 아래 운영 요약 원문을 직접 선택해 복사하세요\.[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=skills-operational-summary"\)/,
  "Skills operational summary should open a dedicated Studio draft and keep manual fallback when draft storage fails",
);
assertMatches(
  /type SkillManualCopy = \{[\s\S]*?reason\?: string/,
  "Skills manual copy state should carry a precise reason for copy or Studio draft fallback",
);
assert.match(
  manualCopyPanelSource,
  /copy\.reason \?\? `\$\{copy\.title\} 복사가 차단됐습니다\.`/,
  "Shared manual copy panel should show a precise reason for copy or Studio draft fallback",
);
assertMatches(
  /스킬 운영 요약[\s\S]*?copySkillsOperationalSummaryReport[\s\S]*?운영 리포트 복사됨[\s\S]*?운영 리포트 복사 실패[\s\S]*?운영 리포트 복사[\s\S]*?openSkillsOperationalSummaryInStudio[\s\S]*?리포트 Studio로 보내기[\s\S]*?manualCopy\?\.id === "operations-report"[\s\S]*?ManualCopyPanel[\s\S]*?최근 실행[\s\S]*?skillRunStats\.latestRun\.sourceSkillName[\s\S]*?스킬 · \{skillRunStats\.latestRun\.sourceSkillName\}[\s\S]*?최근 실행 Library 보기[\s\S]*?data-testid="skills-latest-run-link-copy"[\s\S]*?최근 실행 링크 복사됨[\s\S]*?최근 실행 링크 복사 실패[\s\S]*?최근 실행 링크 복사[\s\S]*?manualCopy\?\.id === "latest-run-link"[\s\S]*?ManualCopyPanel/,
  "Skills operational summary should expose report copy, Studio handoff, latest-run skill name, Library navigation, link copy, and fallback",
);
assertMatches(
  /selectedSkillRuns\.map\(\(prompt\) =>[\s\S]*?prompt\.sourceSkillName[\s\S]*?스킬 · \{prompt\.sourceSkillName\}[\s\S]*?openSkillRunInLibrary\(prompt\)[\s\S]*?Library 보기[\s\S]*?copySkillRunHistoryLibraryLink\(prompt\)[\s\S]*?data-testid=\{`skills-run-history-link-copy-\$\{prompt\.id\}`\}[\s\S]*?링크 복사됨[\s\S]*?링크 복사 실패[\s\S]*?manualCopy\?\.id === "run-history-link"[\s\S]*?manualCopy\.targetId === prompt\.id[\s\S]*?ManualCopyPanel/,
  "Skills run history should expose per-run skill name, Library navigation, link copy, and fallback",
);
assertMatches(
  /실행 저장 완료[\s\S]*?savedRunPrompt\.title[\s\S]*?스킬 · \{savedRunPrompt\.sourceSkillName \?\? draft\.name\}[\s\S]*?Library 실행 보기[\s\S]*?copySavedRunLibraryLink[\s\S]*?실행 링크 복사됨[\s\S]*?실행 링크 복사 실패[\s\S]*?manualCopy\?\.id === "run-link"[\s\S]*?ManualCopyPanel/,
  "Skills saved run card should show the skill name and expose saved-run Library navigation, link copy, and fallback",
);
assertMatches(
  /원본 Library 프롬프트[\s\S]*?selectedPromptStudioSourceDisplay[\s\S]*?Studio 저장 출처 ·[\s\S]*?selectedPromptStudioSourceDisplay\.label[\s\S]*?세부 초안 유형[\s\S]*?selectedPromptStudioSourceDisplay\.sourceVariantLabel[\s\S]*?출처 제목 · \{selectedPromptStudioSourceDisplay\.sourceTitle\}[\s\S]*?onClick=\{copySelectedPromptLibraryLink\}[\s\S]*?원본 링크 복사됨[\s\S]*?원본 링크 복사 실패[\s\S]*?manualCopy\?\.id === "source-link"[\s\S]*?ManualCopyPanel/,
  "Skills selected source prompt card should show Studio saved-source/sourceVariant/source-title labels and expose source link copy fallback",
);
assertMatches(
  /성과와 개선 추천[\s\S]*?반영 예정 변경[\s\S]*?copyImprovementPlan[\s\S]*?개선 계획 복사됨[\s\S]*?개선 계획 복사 실패[\s\S]*?개선 계획 복사[\s\S]*?openImprovementPlanInStudio[\s\S]*?Studio로 보내기[\s\S]*?applyImprovementPlan[\s\S]*?manualCopy\?\.id === "improvement-plan"[\s\S]*?ManualCopyPanel/,
  "Skills improvement recommendation card should expose improvement plan copy, Studio handoff, apply, and manual fallback",
);
assertFileIncludes(
  promptTypes,
  '"skills-improvement-plan"',
  "Prompt draft sources should include Skills improvement plan source",
);
assertFileIncludes(
  promptTypes,
  '"skills-operational-summary"',
  "Prompt draft sources should include Skills operational summary source",
);
assertFileIncludes(
  sourceRegistry,
  '"skills-improvement-plan"',
  "Studio source registry should include Skills improvement plan source",
);
assertFileIncludes(
  sourceRegistry,
  '"skills-operational-summary"',
  "Studio source registry should include Skills operational summary source",
);
assertFileIncludes(
  sourceRegistry,
  'sourceActionLabel: "Skills로 돌아가기"',
  "Studio source registry should preserve a Skills return action for Skills operational summary drafts",
);
assertFileIncludes(
  sourceRegistry,
  'sourceActionLabel: "Skills 스킬로 돌아가기"',
  "Studio source registry should preserve a Skills skill return action for Skills improvement plan drafts",
);
assertFileIncludes(
  readme,
  "Skills 운영 요약과 실행 이력에서 최근 실행/개별 실행 Library 링크를 절대 URL로 복사",
  "README should document Skills operational Library link copy actions",
);
assertFileIncludes(
  readme,
  "Skills 운영 흐름은 원본 확인, 템플릿 정리, 실행 저장, 운영 개선을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 합니다.",
  "README should document Skills operating flow",
);
assertFileIncludes(
  readme,
  "Skills 운영 요약 지표는 모바일 2열과 데스크톱 3열로 전체 실행, 실행 스킬, 피드백, 최근 실행, 반복 상위, 개선 큐를 짧게 훑게 합니다.",
  "README should document the compact responsive Skills operational metrics",
);
assertFileIncludes(
  readme,
  "Skills 실행 준비 흐름은 `01 템플릿 확인`, `02 실행 검증`, `03 운영 저장` 단계 카드로 템플릿 상태, 실행 입력/프롬프트 생성, Library 저장과 피드백 수집 순서를 바로 읽게 합니다.",
  "README should document numbered Skills execution readiness workflow cards",
);
assertFileIncludes(
  readme,
  "Skills 운영 리포트 복사/Studio 전송에 최근 실행 Library 링크와 상위/개선 큐 Skills 링크를 절대 URL로 포함",
  "README should document Skills operational report absolute links and Studio handoff",
);
assertFileIncludes(
  readme,
  "Skills 운영 요약을 Studio 초안으로 전송하고 `skills-operational-summary` 저장 출처로 추적",
  "README should document Skills operational summary Studio source tracking",
);
assertFileIncludes(
  readme,
  "Skills 운영 요약과 개선 계획의 Studio 초안은 각각 `Skills로 돌아가기`, `Skills 스킬로 돌아가기` 복귀 액션 라벨로 원래 화면을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시합니다.",
  "README should document Skills Studio draft return actions and fallback",
);
assertFileIncludes(
  readme,
  "Skills 실행 저장/최근 실행/실행 이력 Library 링크 fallback에 실행 프롬프트, 스킬, 대상 AI, 품질, 피드백, 생성일 메타를 포함",
  "README should document Skills skill-run Library link fallback metadata",
);
assertFileIncludes(
  readme,
  "Skills 실행 프롬프트 복사 fallback에 스킬, 대상 AI, 언어 전략, 답변 언어, 실행 입력, 프롬프트 본문을 포함",
  "README should document Skills run prompt fallback metadata",
);
assertFileIncludes(
  readme,
  "Skills 개선 계획 복사 fallback에 스킬, 대상 AI, 언어 전략, 답변 언어, 피드백 지표, 추천 항목, 반영 예정 변경, 최근 코멘트를 포함",
  "README should document Skills improvement plan fallback metadata",
);
assertFileIncludes(
  readme,
  "Skills 개선 계획을 Studio 초안으로 전송하고 `skills-improvement-plan` 저장 출처로 추적",
  "README should document Skills improvement plan Studio draft handoff",
);
assertFileIncludes(
  readme,
  "Skills 개선 계획 Studio 초안에 현재 스킬 설명, 입력 가이드, 출력 형식, 품질 체크리스트, 템플릿 본문을 포함",
  "README should document Skills improvement plan Studio draft context",
);
assertFileIncludes(
  readme,
  "Skills 스킬 템플릿 복사 fallback에 스킬, 대상 AI, 언어 전략, 답변 언어, 출력 형식, 품질 체크리스트, 템플릿 본문을 포함",
  "README should document Skills template fallback metadata",
);
assertFileIncludes(
  readme,
  "Skills 실행 저장/최근 실행/실행 이력 카드에 스킬명을 표시",
  "README should document Skills skill-run cards showing skill names",
);
assertFileIncludes(
  readme,
  "Skills 원본 Library 프롬프트 카드에서 Studio 저장 출처, 세부 초안 유형, 출처 제목을 표시하고 원본 링크 fallback에 원본 경로와 함께 포함",
  "README should document Skills source prompt saved-source/sourceVariant/source-title display and fallback metadata",
);
assertFileIncludes(
  prd,
  "Skills 운영 흐름은 원본 확인, 템플릿 정리, 실행 저장, 운영 개선을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 해야 한다.",
  "PRD should document Skills operating flow",
);
assertFileIncludes(
  prd,
  "Skills 운영 요약 지표는 모바일 2열과 데스크톱 3열로 전체 실행, 실행 스킬, 피드백, 최근 실행, 반복 상위, 개선 큐를 짧게 훑게 해야 한다.",
  "PRD should document the compact responsive Skills operational metrics",
);
assertFileIncludes(
  prd,
  "Skills 실행 준비 흐름은 `01 템플릿 확인`, `02 실행 검증`, `03 운영 저장` 단계 카드로 템플릿 상태, 실행 입력/프롬프트 생성, Library 저장과 피드백 수집 순서를 바로 읽게 해야 한다.",
  "PRD should document numbered Skills execution readiness workflow cards",
);
assertFileIncludes(
  prd,
  "Skills 운영 요약과 개선 계획의 Studio 초안은 각각 `Skills로 돌아가기`, `Skills 스킬로 돌아가기` 복귀 액션 라벨로 원래 화면을 복원해야 하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시해야 한다.",
  "PRD should document Skills Studio draft return actions and fallback",
);
assertFileIncludes(
  developmentBrief,
  "Skills 운영 요약 지표는 모바일 2열과 데스크톱 3열로 전체 실행, 실행 스킬, 피드백, 최근 실행, 반복 상위, 개선 큐를 짧게 훑게 한다",
  "Development brief should document the compact responsive Skills operational metrics",
);
assertFileIncludes(
  developmentBrief,
  "Skills 실행 준비 흐름은 `01 템플릿 확인`, `02 실행 검증`, `03 운영 저장` 단계 카드로 템플릿 상태, 실행 입력/프롬프트 생성, Library 저장과 피드백 수집 순서를 바로 읽게 한다",
  "Development brief should document numbered Skills execution readiness workflow cards",
);
assertFileIncludes(
  developmentBrief,
  "Skills 운영 요약과 개선 계획의 Studio 초안은 각각 `Skills로 돌아가기`, `Skills 스킬로 돌아가기` 복귀 액션 라벨로 원래 화면을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시한다.",
  "Development brief should document Skills Studio draft return actions and fallback",
);
for (const [sourceName, fileSource] of [
  ["README", readme],
  ["PRD", prd],
  ["Development brief", developmentBrief],
]) {
  assertFileNotIncludes(
    fileSource,
    "Skills 운영 요약과 개선 계획의 Studio 초안 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시",
    `${sourceName} should not keep the Skills draft fallback wording without return action labels`,
  );
}

console.log("Skills operational summary verification passed.");
