import assert from "node:assert/strict";
import { readSource } from "./lib/read-source.mjs";

const profileSource = readSource("src/components/profile/profile-editor.tsx");
const companySource = readSource("src/components/company/company-editor.tsx");
const readme = readSource("README.md");
const prd = readSource("docs/personalized-prompt-ai-prd.md");
const developmentBrief = readSource("docs/codex-development-brief.md");
const promptTypesSource = readSource("src/lib/prompt/types.ts");
const sourceRegistrySource = readSource("src/lib/studio/source-registry.ts");

function assertProfileMatches(pattern, message) {
  assert.match(profileSource, pattern, message);
}

function assertCompanyMatches(pattern, message) {
  assert.match(companySource, pattern, message);
}

function assertFileIncludes(fileSource, text, message) {
  assert.ok(fileSource.includes(text), message);
}

function assertFileNotIncludes(fileSource, text, message) {
  assert.ok(!fileSource.includes(text), message);
}

assertProfileMatches(
  /import \{ writeStudioDraft \} from "@\/lib\/studio\/draft";/,
  "Profile should import the Studio draft writer for context application handoff",
);
assertProfileMatches(
  /const readyCount = readinessItems\.filter\(\(item\) => item\.ready\)\.length/,
  "Profile should compute a ready-item count from readiness items without new persistence state",
);
assertProfileMatches(
  /className="grid grid-cols-2 gap-3 md:grid-cols-2"[\s\S]*?data-testid="profile-readiness-metrics"[\s\S]*?min-w-0 rounded-md border border-line bg-surface p-3[\s\S]*?break-words text-xs font-semibold/,
  "Profile readiness metrics should keep a compact two-column mobile grid with stable wrapping",
);
assertProfileMatches(
  /const advancedReadyCount = advancedItems\.filter\(\(item\) => item\.ready\)\.length[\s\S]*?const profileContextSummaryItems = \[[\s\S]*?label: "필수 완료"[\s\S]*?readyCount[\s\S]*?readinessItems\.length[\s\S]*?label: "부족 항목"[\s\S]*?missingReadinessCount[\s\S]*?label: "확장 기준"[\s\S]*?advancedReadyCount[\s\S]*?advancedItems\.length[\s\S]*?label: "복귀 위치"[\s\S]*?getReturnLabel\(returnPath\)[\s\S]*?className="grid grid-cols-2 gap-3 md:grid-cols-4"[\s\S]*?data-testid="profile-context-summary-metrics"[\s\S]*?profileContextSummaryItems\.map[\s\S]*?break-words text-sm font-semibold text-accent/,
  "Profile context summary should expose required, missing, advanced, and return-target metrics in a two-column mobile grid",
);
assertProfileMatches(
  /function buildProfileContextApplicationPrompt[\s\S]*?User Personalization Context Application[\s\S]*?all English[\s\S]*?Korean-English hybrid[\s\S]*?GPT, Claude, Codex, or Gemini/,
  "Profile should build a reusable AI-facing context application prompt with English/hybrid guidance",
);
assertProfileMatches(
  /const profileApplicationSignals = \[[\s\S]*?프롬프트 언어[\s\S]*?영어 우선 · 한영 하이브리드 자동 판단[\s\S]*?대상 AI[\s\S]*?GPT · Claude · Codex · Gemini[\s\S]*?학습 메모리[\s\S]*?user scope/,
  "Profile application preview should summarize language routing, target AI, and user memory state",
);
assertProfileMatches(
  /const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "profile-context-application"[\s\S]*?rawInput: profileApplicationPrompt[\s\S]*?targetModels: \["gpt", "claude", "codex", "gemini"\][\s\S]*?sourceHref: "\/profile"[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setApplicationCopied\(false\)[\s\S]*?setManualCopy\(\{[\s\S]*?title: "개인화 기준 적용 프롬프트"[\s\S]*?body: profileApplicationPrompt[\s\S]*?Studio 초안을 저장하지 못했습니다\. 아래 적용 프롬프트를 직접 선택해 복사하세요\.[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=profile-context-application"\)/,
  "Profile application preview should send a traceable Studio draft and keep manual fallback when draft storage fails",
);
assertProfileMatches(
  /interface ProfileManualCopy[\s\S]*?reason\?: string[\s\S]*?copy\.reason \?\? `\$\{copy\.title\} 복사가 차단됐습니다\.`/,
  "Profile manual copy panel should show a precise reason for copy or Studio draft fallback",
);
assertProfileMatches(
  /data-testid="profile-context-application-preview"[\s\S]*?AI 적용 프리뷰[\s\S]*?all-English prompting[\s\S]*?Korean-English hybrid prompting[\s\S]*?copyProfileApplicationPrompt[\s\S]*?openProfileApplicationInStudio/,
  "Profile should render a compact application preview with copy and Studio actions",
);
assertProfileMatches(
  /const profileApplicationWorkflowSteps = \[[\s\S]*?label: "기준 확인"[\s\S]*?step: "01"[\s\S]*?label: "적용 문구"[\s\S]*?step: "02"[\s\S]*?영어 또는 한영 하이브리드[\s\S]*?label: "Studio 전송"[\s\S]*?step: "03"[\s\S]*?외부 AI handoff 준비/,
  "Profile application preview should calculate numbered context review, prompt wording, and Studio handoff workflow steps",
);
assertProfileMatches(
  /data-testid="profile-context-application-preview"[\s\S]*?data-testid="profile-context-application-workflow"[\s\S]*?profileApplicationWorkflowSteps\.map[\s\S]*?item\.step[\s\S]*?item\.label[\s\S]*?item\.title[\s\S]*?item\.detail[\s\S]*?프롬프트 기준 미리보기/,
  "Profile application preview should render numbered workflow cards before the prompt wording preview",
);
assertCompanyMatches(
  /import \{ writeStudioDraft \} from "@\/lib\/studio\/draft";/,
  "Company should import the Studio draft writer for context application handoff",
);
assertCompanyMatches(
  /const readyCount = readinessItems\.filter\(\(item\) => item\.ready\)\.length/,
  "Company should compute a ready-item count from readiness items without new persistence state",
);
assertCompanyMatches(
  /className="grid grid-cols-2 gap-3 md:grid-cols-2"[\s\S]*?data-testid="company-readiness-metrics"[\s\S]*?min-w-0 rounded-md border border-line bg-surface p-3[\s\S]*?break-words text-xs font-semibold/,
  "Company readiness metrics should keep a compact two-column mobile grid with stable wrapping",
);
assertCompanyMatches(
  /const advancedReadyCount = advancedItems\.filter\(\(item\) => item\.ready\)\.length[\s\S]*?const companyContextSummaryItems = \[[\s\S]*?label: "필수 완료"[\s\S]*?readyCount[\s\S]*?readinessItems\.length[\s\S]*?label: "부족 항목"[\s\S]*?missingReadinessCount[\s\S]*?label: "확장 기준"[\s\S]*?advancedReadyCount[\s\S]*?advancedItems\.length[\s\S]*?label: "복귀 위치"[\s\S]*?getReturnLabel\(returnPath\)[\s\S]*?className="grid grid-cols-2 gap-3 md:grid-cols-4"[\s\S]*?data-testid="company-context-summary-metrics"[\s\S]*?companyContextSummaryItems\.map[\s\S]*?break-words text-sm font-semibold text-accent/,
  "Company context summary should expose required, missing, advanced, and return-target metrics in a two-column mobile grid",
);
assertCompanyMatches(
  /function buildCompanyContextApplicationPrompt[\s\S]*?Company Context Application[\s\S]*?all English[\s\S]*?Korean-English hybrid[\s\S]*?company context should override personal preferences[\s\S]*?GPT, Claude, Codex, or Gemini/,
  "Company should build a reusable AI-facing context application prompt with English/hybrid and priority guidance",
);
assertCompanyMatches(
  /const companyApplicationSignals = \[[\s\S]*?프롬프트 언어[\s\S]*?영어 우선 · 한영 하이브리드 자동 판단[\s\S]*?대상 AI[\s\S]*?GPT · Claude · Codex · Gemini[\s\S]*?학습 메모리[\s\S]*?company scope/,
  "Company application preview should summarize language routing, target AI, and company memory state",
);
assertCompanyMatches(
  /const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "company-context-application"[\s\S]*?rawInput: companyApplicationPrompt[\s\S]*?targetModels: \["gpt", "claude", "codex", "gemini"\][\s\S]*?sourceHref: "\/company"[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setApplicationCopied\(false\)[\s\S]*?setManualCopy\(\{[\s\S]*?title: "회사 기준 적용 프롬프트"[\s\S]*?body: companyApplicationPrompt[\s\S]*?Studio 초안을 저장하지 못했습니다\. 아래 적용 프롬프트를 직접 선택해 복사하세요\.[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=company-context-application"\)/,
  "Company application preview should send a traceable Studio draft and keep manual fallback when draft storage fails",
);
assertCompanyMatches(
  /interface CompanyManualCopy[\s\S]*?reason\?: string[\s\S]*?copy\.reason \?\? `\$\{copy\.title\} 복사가 차단됐습니다\.`/,
  "Company manual copy panel should show a precise reason for copy or Studio draft fallback",
);
assertCompanyMatches(
  /data-testid="company-context-application-preview"[\s\S]*?AI 적용 프리뷰[\s\S]*?company positioning[\s\S]*?Korean-English hybrid prompt[\s\S]*?copyCompanyApplicationPrompt[\s\S]*?openCompanyApplicationInStudio/,
  "Company should render a compact application preview with copy and Studio actions",
);
assertCompanyMatches(
  /const companyApplicationWorkflowSteps = \[[\s\S]*?label: "기준 확인"[\s\S]*?step: "01"[\s\S]*?label: "적용 문구"[\s\S]*?step: "02"[\s\S]*?회사 기준 우선[\s\S]*?label: "Studio 전송"[\s\S]*?step: "03"[\s\S]*?외부 AI handoff 준비/,
  "Company application preview should calculate numbered context review, prompt wording, and Studio handoff workflow steps",
);
assertCompanyMatches(
  /data-testid="company-context-application-preview"[\s\S]*?data-testid="company-context-application-workflow"[\s\S]*?companyApplicationWorkflowSteps\.map[\s\S]*?item\.step[\s\S]*?item\.label[\s\S]*?item\.title[\s\S]*?item\.detail[\s\S]*?프롬프트 기준 미리보기/,
  "Company application preview should render numbered workflow cards before the prompt wording preview",
);
assertFileIncludes(
  promptTypesSource,
  '"profile-context-application"',
  "Prompt source type list should include Profile context application drafts",
);
assertFileIncludes(
  promptTypesSource,
  '"company-context-application"',
  "Prompt source type list should include Company context application drafts",
);
assertFileIncludes(
  sourceRegistrySource,
  "Profile 개인화 기준 적용 프리뷰",
  "Source registry should label Profile context application drafts",
);
assertFileIncludes(
  sourceRegistrySource,
  'sourceActionLabel: "Profile로 돌아가기"',
  "Source registry should expose the Profile return action label",
);
assertFileIncludes(
  sourceRegistrySource,
  "Company 회사 기준 적용 프리뷰",
  "Source registry should label Company context application drafts",
);
assertFileIncludes(
  sourceRegistrySource,
  'sourceActionLabel: "Company로 돌아가기"',
  "Source registry should expose the Company return action label",
);

assertFileIncludes(
  readme,
  "Profile/Company 기본 맥락 준비도는 모바일 2열로 필수 항목 상태를 압축해 보강할 항목을 빠르게 확인하게 합니다.",
  "README should document responsive Profile/Company readiness metrics",
);
assertFileIncludes(
  readme,
  "Profile/Company 맥락 요약은 필수 완료, 부족 항목, 확장 기준, 복귀 위치를 모바일 2열과 데스크톱 4열로 먼저 보여줍니다.",
  "README should document the Profile/Company context summary metrics",
);
assertFileIncludes(
  readme,
  "Profile/Company AI 적용 프리뷰는 입력한 개인/회사 기준을 GPT, Claude, Codex, Gemini에 붙일 수 있는 영어 또는 한영 하이브리드 적용 지시문으로 미리 보여주고 복사하거나 Studio 초안으로 보냅니다.",
  "README should document Profile/Company AI application previews",
);
assertFileIncludes(
  readme,
  "Profile/Company AI 적용 프리뷰의 Studio 초안은 각각 `Profile로 돌아가기`, `Company로 돌아가기` 복귀 액션 라벨로 원래 기준 화면을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 적용 프롬프트 원문을 표시합니다.",
  "README should document Profile/Company Studio draft return actions and fallback",
);
assertFileIncludes(
  readme,
  "Profile/Company AI 적용 프리뷰는 `01 기준 확인`, `02 적용 문구`, `03 Studio 전송` 단계 카드로 기준 점검, 영어/한영 하이브리드 지시문 적용, 외부 AI handoff 순서를 먼저 보여줍니다.",
  "README should document the numbered Profile/Company AI application workflow cards",
);
assertFileIncludes(
  prd,
  "Profile/Company 기본 맥락 준비도는 모바일 2열로 필수 항목 상태를 압축해 보강할 항목을 빠르게 확인하게 해야 한다.",
  "PRD should document responsive Profile/Company readiness metrics",
);
assertFileIncludes(
  prd,
  "Profile/Company 맥락 요약은 필수 완료, 부족 항목, 확장 기준, 복귀 위치를 모바일 2열과 데스크톱 4열로 먼저 보여줘야 한다.",
  "PRD should document the Profile/Company context summary metrics",
);
assertFileIncludes(
  prd,
  "Profile/Company AI 적용 프리뷰는 입력한 개인/회사 기준을 GPT, Claude, Codex, Gemini에 붙일 수 있는 영어 또는 한영 하이브리드 적용 지시문으로 미리 보여주고 복사하거나 Studio 초안으로 보낼 수 있어야 한다.",
  "PRD should document Profile/Company AI application previews",
);
assertFileIncludes(
  prd,
  "Profile/Company AI 적용 프리뷰의 Studio 초안은 각각 `Profile로 돌아가기`, `Company로 돌아가기` 복귀 액션 라벨로 원래 기준 화면을 복원해야 하며, 저장이 실패하면 이동하지 않고 수동 복사용 적용 프롬프트 원문을 표시해야 한다.",
  "PRD should document Profile/Company Studio draft return actions and fallback",
);
assertFileIncludes(
  prd,
  "Profile/Company AI 적용 프리뷰는 `01 기준 확인`, `02 적용 문구`, `03 Studio 전송` 단계 카드로 기준 점검, 영어/한영 하이브리드 지시문 적용, 외부 AI handoff 순서를 먼저 보여줘야 한다.",
  "PRD should document the numbered Profile/Company AI application workflow cards",
);
assertFileIncludes(
  developmentBrief,
  "Profile/Company 맥락 요약은 필수 완료, 부족 항목, 확장 기준, 복귀 위치를 모바일 2열과 데스크톱 4열로 먼저 보여준다.",
  "Development brief should document the Profile/Company context summary metrics",
);
assertFileIncludes(
  developmentBrief,
  "Profile/Company AI 적용 프리뷰는 입력한 개인/회사 기준을 GPT, Claude, Codex, Gemini에 붙일 수 있는 영어 또는 한영 하이브리드 적용 지시문으로 미리 보여주고 복사하거나 Studio 초안으로 보낸다.",
  "Development brief should document Profile/Company AI application previews",
);
assertFileIncludes(
  developmentBrief,
  "Profile/Company AI 적용 프리뷰의 Studio 초안은 각각 `Profile로 돌아가기`, `Company로 돌아가기` 복귀 액션 라벨로 원래 기준 화면을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 적용 프롬프트 원문을 표시한다.",
  "Development brief should document Profile/Company Studio draft return actions and fallback",
);
assertFileIncludes(
  developmentBrief,
  "Profile/Company AI 적용 프리뷰는 `01 기준 확인`, `02 적용 문구`, `03 Studio 전송` 단계 카드로 기준 점검, 영어/한영 하이브리드 지시문 적용, 외부 AI handoff 순서를 먼저 보여준다.",
  "Development brief should document the numbered Profile/Company AI application workflow cards",
);

const staleProfileCompanyDraftFallbackOnlyContract = [
  "Profile/Company AI 적용 프리뷰의 Studio 초안",
  "저장이 실패하면 이동하지 않고 수동 복사용 적용 프롬프트 원문을 표시",
].join(" ");

for (const [sourceName, fileSource, suffix] of [
  ["README", readme, "합니다."],
  ["PRD", prd, "해야 한다."],
  ["Development brief", developmentBrief, "한다."],
]) {
  assertFileNotIncludes(
    fileSource,
    `${staleProfileCompanyDraftFallbackOnlyContract}${suffix}`,
    `${sourceName} should not keep the Profile/Company draft fallback wording without return action labels`,
  );
}

console.log("Profile and Company context operating flow verification passed.");
