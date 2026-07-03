import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  buildGitProvenance,
  buildGitProvenanceLines,
} from "./lib/git-provenance.mjs";
import { readConcatenatedSources, readSource } from "./lib/read-source.mjs";

function getOutputPath(args) {
  const outIndex = args.indexOf("--out");

  if (outIndex === -1) {
    return null;
  }

  const outputPath = args[outIndex + 1];

  assert.ok(outputPath, "--out requires a file path");
  assert.equal(
    args.length,
    outIndex + 2,
    "smoke:learning-feedback only accepts --out <file>",
  );

  return outputPath;
}

function buildLearningFeedbackEvidenceText() {
  const gitProvenance = buildGitProvenance();

  return [
    "# Learning Feedback Smoke Evidence",
    "",
    "- route: /learning?review=low-confidence&q=feedback-improvement",
    "- source: learning-feedback-improvement",
    "- sourceVariant: learning-low-confidence-validation",
    "- validationLibraryFilter: /library?studioSource=learning-feedback-improvement&studioVariant=learning-low-confidence-validation",
    "- command: npm run smoke:learning-feedback -- --out output/smoke/learning-feedback-smoke.md",
    "- status: pass",
    "- external services: not contacted",
    "- operator gate: local packet only; external AI handoff still requires review-required output and confirmSave review.",
    ...buildGitProvenanceLines(gitProvenance),
    "",
    "## Verified contract",
    "- Learning renders readiness, low-confidence review, manual memory, and Studio handoff steps in order.",
    "- Feedback-improvement queue metrics stay compact on mobile and desktop.",
    "- Queue actions are grouped into review, Studio, and record steps.",
    "- Queue record actions include release evidence and release-candidate command copy.",
    "- Low-confidence feedback rules use a separate Studio validation draft and Library filter.",
    "- Queue reports include condition links, validation Library links, metrics, release gate commands, actions, and memory details.",
    "- Clipboard and Studio draft failures keep manual copy fallbacks in the current panel.",
    "- Manual memories can be added, edited, deleted, and protected from duplicate scope plus content records.",
  ].join("\n");
}

function writeLearningFeedbackEvidence(outputPath, evidenceText) {
  if (!outputPath) {
    return;
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${evidenceText}\n`, "utf8");
}

const outputPath = getOutputPath(process.argv.slice(2));

const source = readConcatenatedSources([
  "src/lib/learning-view/labels.ts",
  "src/lib/learning-view/hrefs.ts",
  "src/lib/learning-view/readiness.ts",
  "src/lib/learning-view/report-text.ts",
  "src/lib/learning-view/studio-drafts.ts",
  "src/components/learning/learning-view-types.ts",
  "src/components/learning/learning-view.tsx",
  "src/components/learning/learning-readiness-panel.tsx",
  "src/components/learning/learning-feedback-improvement-queue-panel.tsx",
  "src/components/learning/learning-filter-panel.tsx",
  "src/components/learning/learning-manual-memory-panel.tsx",
  "src/components/learning/learning-memory-list-panel.tsx",
]);
const manualCopyPanelSource = readSource(
  "src/components/common/manual-copy-panel.tsx",
);
const promptTypes = readSource("src/lib/prompt/types.ts");
const draftVariants = readSource("src/lib/studio/draft-variants.ts");
const draftDisplay = readSource("src/lib/studio/draft-display.ts");
const sourceRegistry = readSource("src/lib/studio/source-registry.ts");
const libraryView = readConcatenatedSources([
  "src/components/library/library-view.tsx",
  "src/components/library/library-filters-panel.tsx",
  "src/components/library/library-detail-workspace.tsx",
  "src/lib/library/labels.ts",
  "src/lib/library/hrefs.ts",
  "src/lib/library/prompt-metrics.ts",
  "src/lib/library/report-text.ts",
  "src/lib/library/report-notes.ts",
]);
const readme = readSource("README.md");
const prd = readSource("docs/personalized-prompt-ai-prd.md");
const devBrief = readSource("docs/codex-development-brief.md");

function assertMatches(pattern, message) {
  assert.match(source, pattern, message);
}

function assertFileIncludes(fileSource, text, message) {
  assert.ok(fileSource.includes(text), message);
}

function assertFileNotIncludes(fileSource, text, message) {
  assert.ok(!fileSource.includes(text), message);
}

assertMatches(
  /import \{[\s\S]*?ContextOperatingFlow[\s\S]*?type ContextOperatingFlowItem[\s\S]*?\} from "@\/components\/context\/context-operating-flow";/,
  "Learning should reuse the shared context operating flow component",
);
assertMatches(
  /const learningLowConfidenceReviewHref = getLearningHref\(\{[\s\S]*?query: ""[\s\S]*?reviewFilter: "low-confidence"[\s\S]*?scope[\s\S]*?sortMode: "confidence-asc"[\s\S]*?\}\);[\s\S]*?const learningOperatingFlowItems = useMemo<ContextOperatingFlowItem\[\]>\([\s\S]*?actionLabel: "준비도 확인"[\s\S]*?href: "#readiness"[\s\S]*?label: "준비도"[\s\S]*?step: "01"[\s\S]*?actionLabel: "검토 큐 열기"[\s\S]*?href: learningLowConfidenceReviewHref[\s\S]*?label: "검토"[\s\S]*?step: "02"[\s\S]*?actionLabel: "직접 보강"[\s\S]*?href: "#learning-manual-memory"[\s\S]*?label: "보강"[\s\S]*?step: "03"[\s\S]*?actionLabel: "현재 조건 확인"[\s\S]*?feedbackImprovementFilterActive[\s\S]*?"#learning-feedback-improvement-queue"[\s\S]*?"#learning-filter-panel"[\s\S]*?label: "Studio"[\s\S]*?step: "04"/,
  "Learning operating flow should map readiness, low-confidence review, manual memory, and Studio handoff steps",
);
assertMatches(
  /<ContextOperatingFlow[\s\S]*?badge=\{learningReadiness\.label\}[\s\S]*?description="Learning은 저장된 기준을 바로 재사용하지 않고 준비도, 낮은 신뢰도, 수동 보강, Studio 전송 순서로 점검합니다\."[\s\S]*?items=\{learningOperatingFlowItems\}[\s\S]*?testId="learning-operating-flow"[\s\S]*?title="Learning 운영 흐름"/,
  "Learning should render the shared operating flow before the readiness and filter panels",
);
assertMatches(
  /data-testid="learning-summary-metrics"[\s\S]*?grid-cols-2[\s\S]*?md:grid-cols-4[\s\S]*?전체 메모리[\s\S]*?평균 신뢰도[\s\S]*?text-2xl[\s\S]*?sm:text-3xl/,
  "Learning top summary metrics should stay compact in two columns on mobile and four columns on desktop",
);
assertMatches(
  /const learningNextActionGuide = useMemo\(\(\) => \{[\s\S]*?memories\.length === 0[\s\S]*?첫 학습 메모리를 만들 차례[\s\S]*?learningReadiness\.lowConfidenceCount > 0[\s\S]*?낮은 신뢰도 검토[\s\S]*?const missingScope = learningReadiness\.missingScopes\[0\][\s\S]*?커버리지 보강[\s\S]*?feedbackImprovementFilterActive[\s\S]*?피드백 개선 규칙을 정리할 차례[\s\S]*?학습 컨텍스트를 생성에 적용하세요[\s\S]*?\}, \[/,
  "Learning should calculate a state-aware next action guide for first memory, low-confidence review, missing scope coverage, feedback queue, and Studio application",
);
assertMatches(
  /data-testid="learning-summary-metrics"[\s\S]*?data-testid="learning-next-action-guide"[\s\S]*?Next learning action[\s\S]*?learningNextActionGuide\.status[\s\S]*?learningNextActionGuide\.title[\s\S]*?learningNextActionGuide\.detail[\s\S]*?learningNextActionGuide\.primaryHref[\s\S]*?learningNextActionGuide\.secondaryHref[\s\S]*?<Panel id="readiness"/,
  "Learning should render the next action guide between the compact summary metrics and readiness panel",
);
assertMatches(
  /data-testid="learning-readiness-metrics"[\s\S]*?grid-cols-2[\s\S]*?sm:grid-cols-4[\s\S]*?Scope 커버리지[\s\S]*?높은 신뢰도[\s\S]*?낮은 신뢰도[\s\S]*?최근 업데이트/,
  "Learning readiness metrics should stay compact in two columns on mobile and four columns on desktop",
);
assertMatches(
  /<Panel id="readiness"[\s\S]*?id="learning-feedback-improvement-queue"[\s\S]*?id="learning-filter-panel"[\s\S]*?id="learning-manual-memory"/,
  "Learning operating flow should point to stable readiness, feedback queue, filter, and manual-memory anchors",
);
assertMatches(
  /type LearningManualCopy = \{[\s\S]*?id: string;[\s\S]*?title: string;[\s\S]*?body: string;[\s\S]*?reason\?: string;[\s\S]*?\};/,
  "Learning manual copy state should support explicit fallback reasons for blocked Studio drafts",
);
assert.match(
  manualCopyPanelSource,
  /copy\.reason \?\? `\$\{copy\.title\} 복사가 차단됐습니다\.`/,
  "Shared manual copy panel should render explicit fallback reasons when provided",
);

assertMatches(
  /const learningReadinessHref = "\/learning#readiness"[\s\S]*?function buildLearningReadinessReportText\(\{[\s\S]*?baseUrl[\s\S]*?memories[\s\S]*?readiness[\s\S]*?baseUrl\?: string[\s\S]*?const formatLearningHref = \(href: string\) =>[\s\S]*?formatAbsoluteInternalHref\(href, baseUrl\)[\s\S]*?# 학습 준비도 리포트[\s\S]*?## 점검 링크[\s\S]*?준비도 화면:[\s\S]*?formatLearningHref\(learningReadinessHref\)[\s\S]*?전체 학습 메모리:[\s\S]*?getLearningHref\(\{[\s\S]*?reviewFilter: "all"[\s\S]*?sortMode: "confidence-desc"[\s\S]*?낮은 신뢰도:[\s\S]*?reviewFilter: "low-confidence"[\s\S]*?sortMode: "confidence-asc"[\s\S]*?최근 업데이트:[\s\S]*?sortMode: "updated-desc"[\s\S]*?## Scope별 메모리[\s\S]*?formatLearningHref\([\s\S]*?scope[\s\S]*?sortMode: "confidence-desc"/,
  "Learning readiness report should include absolute-ready review and scope links",
);
assertMatches(
  /async function copyReadinessReport\(\)[\s\S]*?buildLearningReadinessReportText\(\{[\s\S]*?baseUrl: typeof window === "undefined" \? undefined : window\.location\.origin[\s\S]*?memories[\s\S]*?readiness: learningReadiness[\s\S]*?copyTextToClipboard\(reportText\)/,
  "Learning readiness report copy should pass the current origin for absolute review links",
);
assertMatches(
  /function buildLearningReadinessStudioDraftInput\(\{[\s\S]*?baseUrl[\s\S]*?memories[\s\S]*?readiness[\s\S]*?Role:[\s\S]*?senior prompt operations strategist[\s\S]*?Use the Learning readiness report below[\s\S]*?missing scopes, low-confidence memories, and stale learning context[\s\S]*?review links[\s\S]*?buildLearningReadinessReportText\(\{ baseUrl, memories, readiness \}\)/,
  "Learning readiness Studio prompt should turn the readiness report into an operating plan",
);
assertMatches(
  /function openReadinessReportInStudio\(\)[\s\S]*?const rawInput = buildLearningReadinessStudioDraftInput\(\{[\s\S]*?baseUrl:[\s\S]*?window\.location\.origin[\s\S]*?memories[\s\S]*?readiness: learningReadiness[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "learning-readiness"[\s\S]*?rawInput,[\s\S]*?goal: "학습 메모리 운영 보강 계획"[\s\S]*?targetModels: \["gpt", "claude", "codex"\][\s\S]*?sourceTitle: "Learning 준비도 리포트"[\s\S]*?sourceHref: learningReadinessHref[\s\S]*?if \(!wroteDraft\)[\s\S]*?setReadinessReportCopyFailed\(true\)[\s\S]*?id: "readiness-report"[\s\S]*?body: rawInput[\s\S]*?Studio 초안 저장이 차단[\s\S]*?return;[\s\S]*?router\.push\("\/studio\?draft=learning-readiness"\)/,
  "Learning readiness report should block Studio navigation and show manual copy when draft storage fails",
);
assertMatches(
  /<Panel id="readiness"[\s\S]*?onClick=\{openReadinessReportInStudio\}[\s\S]*?준비도 Studio로 보내기/,
  "Learning readiness card should expose a Studio draft action",
);
assertMatches(
  /function buildFilteredMemoryReportText\(\{[\s\S]*?baseUrl[\s\S]*?filteredMemories[\s\S]*?baseUrl\?: string[\s\S]*?const filterHref = getLearningHref\(\{ query, reviewFilter, scope, sortMode \}\)[\s\S]*?formatAbsoluteInternalHref\(filterHref, baseUrl\)[\s\S]*?# 학습 메모리 필터 결과[\s\S]*?조건 링크: \$\{absoluteFilterHref\}[\s\S]*?범위: \$\{scopeLabels\[scope\]\}[\s\S]*?검토 기준: \$\{reviewFilterLabels\[reviewFilter\]\}/,
  "Learning filtered memory report should include an absolute-ready filter link before filter metadata",
);
assertMatches(
  /async function copyFilteredMemoryReport\(\)[\s\S]*?const reportPayload = \{[\s\S]*?baseUrl: typeof window === "undefined" \? undefined : window\.location\.origin[\s\S]*?filteredMemories: filtered[\s\S]*?query[\s\S]*?reviewFilter[\s\S]*?scope[\s\S]*?sortMode[\s\S]*?totalMemories: memories\.length[\s\S]*?buildFilteredMemoryReportText\(reportPayload\)[\s\S]*?copyTextToClipboard\(reportText\)/,
  "Learning filtered memory report copy should pass the current origin for absolute filter links",
);
assertMatches(
  /const feedbackImprovementValidationLibraryHref =[\s\S]*?studioSource=learning-feedback-improvement&studioVariant=learning-low-confidence-validation[\s\S]*?const feedbackImprovementReleaseGateCommand =[\s\S]*?npm run verify:evidence -- --out-dir docs\/evidence\\nnpm run verify:release-candidate[\s\S]*?function buildFeedbackImprovementQueueReportText\(\{[\s\S]*?baseUrl[\s\S]*?filteredMemories[\s\S]*?query[\s\S]*?reviewFilter[\s\S]*?scope[\s\S]*?sortMode[\s\S]*?totalMemories[\s\S]*?formatAbsoluteInternalHref\(filterHref, baseUrl\)[\s\S]*?const lowConfidenceHref = getLearningHref\(\{[\s\S]*?query: "feedback-improvement"[\s\S]*?reviewFilter: "low-confidence"[\s\S]*?sortMode: "confidence-asc"[\s\S]*?formatAbsoluteInternalHref\(lowConfidenceHref, baseUrl\)[\s\S]*?formatAbsoluteInternalHref\([\s\S]*?feedbackImprovementValidationLibraryHref[\s\S]*?baseUrl[\s\S]*?# 피드백 개선 메모리 큐 리포트[\s\S]*?## 큐 조건[\s\S]*?조건 링크: \$\{absoluteFilterHref\}[\s\S]*?낮은 신뢰도 큐: \$\{absoluteLowConfidenceHref\}[\s\S]*?저신뢰도 검증 저장본: \$\{absoluteValidationLibraryHref\}[\s\S]*?## 큐 지표[\s\S]*?낮은 신뢰도: \$\{lowConfidenceCount\}개[\s\S]*?포함 scope:[\s\S]*?## 운영 액션[\s\S]*?Studio 템플릿과 외부 AI handoff 체크리스트[\s\S]*?Library 피드백을 추가 수집[\s\S]*?release evidence를 새로 만들고 release-candidate gate[\s\S]*?## 검증 명령[\s\S]*?feedbackImprovementReleaseGateCommand[\s\S]*?## 메모리/,
  "Learning feedback-improvement queue report should include queue condition, low-confidence queue link, validation Library link, metrics, operating actions, release gate commands, and memories",
);
assertMatches(
  /async function copyFilteredMemoryReport\(\)[\s\S]*?const reportPayload = \{[\s\S]*?baseUrl: typeof window === "undefined" \? undefined : window\.location\.origin[\s\S]*?filteredMemories: filtered[\s\S]*?totalMemories: memories\.length[\s\S]*?const reportText = feedbackImprovementFilterActive[\s\S]*?buildFeedbackImprovementQueueReportText\(reportPayload\)[\s\S]*?buildFilteredMemoryReportText\(reportPayload\)[\s\S]*?title: feedbackImprovementFilterActive[\s\S]*?피드백 개선 메모리 큐[\s\S]*?필터 결과/,
  "Learning filtered report copy should use a dedicated feedback-improvement queue report when the queue is active",
);
assertMatches(
  /async function copyFilterLink\(\)[\s\S]*?getLearningHref\(\{ query, reviewFilter, scope, sortMode \}\)[\s\S]*?formatAbsoluteInternalHref\([\s\S]*?href[\s\S]*?window\.location\.origin[\s\S]*?copyTextToClipboard\(linkText\)/,
  "Learning filter link copy should keep using absolute internal links",
);
assertMatches(
  /async function copyFeedbackImprovementReleaseGate\(\)[\s\S]*?copyTextToClipboard\([\s\S]*?feedbackImprovementReleaseGateCommand[\s\S]*?setReleaseGateCopied\(copied\)[\s\S]*?setReleaseGateCopyFailed\(!copied\)[\s\S]*?setFeedbackImprovementLowConfidenceLinkCopied\(false\)[\s\S]*?setFilteredReportCopied\(false\)[\s\S]*?id: "feedback-improvement-release-gate"[\s\S]*?피드백 개선 큐 release gate[\s\S]*?body: feedbackImprovementReleaseGateCommand/,
  "Learning feedback-improvement queue should copy release evidence and release-candidate commands with manual fallback",
);
assertMatches(
  /const feedbackImprovementFilterActive =[\s\S]*?query\.trim\(\)\.toLowerCase\(\) === "feedback-improvement"[\s\S]*?const feedbackImprovementLowConfidenceHref = getLearningHref\(\{[\s\S]*?query: "feedback-improvement"[\s\S]*?reviewFilter: "low-confidence"[\s\S]*?sortMode: "confidence-asc"[\s\S]*?const feedbackImprovementLowConfidenceMemories = filtered\.filter[\s\S]*?const feedbackImprovementQueueLowConfidenceCount =[\s\S]*?feedbackImprovementLowConfidenceMemories\.length[\s\S]*?const feedbackImprovementQueueScopeCount = trackedScopes\.filter[\s\S]*?async function copyFeedbackImprovementLowConfidenceLink\(\)[\s\S]*?feedbackImprovementLowConfidenceHref[\s\S]*?id: "feedback-improvement-low-confidence-link"[\s\S]*?낮은 신뢰도 큐 링크[\s\S]*?data-testid="learning-feedback-improvement-queue"[\s\S]*?피드백 개선 메모리 큐[\s\S]*?현재 큐[\s\S]*?낮은 신뢰도[\s\S]*?포함 scope[\s\S]*?검토[\s\S]*?href=\{feedbackImprovementLowConfidenceHref\}[\s\S]*?낮은 신뢰도만 보기[\s\S]*?onClick=\{copyFeedbackImprovementLowConfidenceLink\}[\s\S]*?낮은 신뢰도 링크 복사됨[\s\S]*?낮은 신뢰도 링크 복사 실패[\s\S]*?낮은 신뢰도 링크 복사[\s\S]*?onClick=\{copyFilterLink\}[\s\S]*?큐 조건 링크 복사됨[\s\S]*?큐 조건 링크 복사 실패[\s\S]*?큐 조건 링크 복사[\s\S]*?Studio[\s\S]*?onClick=\{openFeedbackImprovementLowConfidenceInStudio\}[\s\S]*?disabled=\{feedbackImprovementQueueLowConfidenceCount === 0\}[\s\S]*?낮은 신뢰도 Studio로[\s\S]*?큐 Studio로 보내기[\s\S]*?기록[\s\S]*?큐 리포트 복사[\s\S]*?href=\{feedbackImprovementValidationLibraryHref\}[\s\S]*?검증 저장본 보기[\s\S]*?onClick=\{copyFeedbackImprovementReleaseGate\}[\s\S]*?Release gate 복사됨[\s\S]*?Release gate 복사 실패[\s\S]*?Release gate 복사[\s\S]*?Dashboard로 돌아가기/,
  "Learning should expose a feedback-improvement queue panel grouped into review, Studio, and record actions",
);
assertMatches(
  /data-testid="learning-feedback-improvement-queue"[\s\S]*?data-testid="learning-feedback-improvement-queue-metrics"[\s\S]*?grid-cols-2[\s\S]*?sm:grid-cols-3[\s\S]*?현재 큐[\s\S]*?낮은 신뢰도[\s\S]*?포함 scope/,
  "Learning feedback-improvement queue metrics should stay compact in two columns on mobile and three columns on desktop",
);
assertMatches(
  /const feedbackImprovementQueueWorkflowSteps = useMemo\([\s\S]*?label: "검토"[\s\S]*?step: "01"[\s\S]*?낮은 신뢰도[\s\S]*?label: "Studio"[\s\S]*?step: "02"[\s\S]*?큐 \$\{filtered\.length\}개 전송[\s\S]*?label: "기록"[\s\S]*?step: "03"[\s\S]*?포함 scope/,
  "Learning feedback-improvement queue should calculate numbered review, Studio, and record workflow steps",
);
assertMatches(
  /const manualMemoryWorkflowSteps = useMemo\([\s\S]*?label: "범위 선택"[\s\S]*?step: "01"[\s\S]*?title: scopeLabels\[manualScope\][\s\S]*?manualContent\.trim\(\)[\s\S]*?label: "규칙 작성"[\s\S]*?step: "02"[\s\S]*?manualTitle\.trim\(\) \|\| "제목 대기"[\s\S]*?label: "생성 반영"[\s\S]*?step: "03"[\s\S]*?manualSaved \? "저장됨" : "저장 후 반영"/,
  "Learning manual memory panel should calculate numbered scope, rule, and generation workflow steps",
);
assertMatches(
  /data-testid="learning-feedback-improvement-queue"[\s\S]*?data-testid="learning-feedback-improvement-workflow"[\s\S]*?md:grid-cols-3[\s\S]*?feedbackImprovementQueueWorkflowSteps\.map[\s\S]*?item\.step[\s\S]*?item\.label[\s\S]*?item\.title[\s\S]*?item\.detail[\s\S]*?<div className="grid gap-4">/,
  "Learning feedback-improvement queue should render numbered workflow cards before the detailed action groups",
);
assertMatches(
  /<Panel[\s\S]*?id="learning-manual-memory"[\s\S]*?className="scroll-mt-64 lg:col-start-1 lg:scroll-mt-6"[\s\S]*?data-testid="learning-manual-memory-workflow"[\s\S]*?manualMemoryWorkflowSteps\.map[\s\S]*?item\.step[\s\S]*?item\.label[\s\S]*?item\.title[\s\S]*?item\.detail[\s\S]*?<label className="block">[\s\S]*?범위/,
  "Learning manual memory panel should render numbered workflow cards before the input form",
);
assertMatches(
  /function normalizeMemoryContent\(value: string\)[\s\S]*?value\.replace\(\/\\s\+\/g, " "\)\.trim\(\)\.toLowerCase\(\)[\s\S]*?function findDuplicateMemory\([\s\S]*?exceptId\?: string[\s\S]*?memory\.id !== exceptId[\s\S]*?memory\.scope === scope[\s\S]*?normalizeMemoryContent\(memory\.content\) === normalized/,
  "Learning manual memories should detect duplicate content within the same scope while allowing the edited record itself",
);
assertMatches(
  /function saveManualMemory\(\)[\s\S]*?const duplicate = findDuplicateMemory\(memories, manualScope, content\)[\s\S]*?이미 같은 scope에 같은 내용의 메모리가 있습니다[\s\S]*?sourceType: "manual"[\s\S]*?setMemories\(\(current\) => \[nextMemory, \.\.\.current\]\)[\s\S]*?updateScopeFilter\(manualScope\)/,
  "Learning manual memory create flow should block same-scope duplicates and move the operator to the saved scope",
);
assertMatches(
  /function startEditingManualMemory\(memory: LearningMemory\)[\s\S]*?memory\.sourceType !== "manual"[\s\S]*?setEditingMemoryId\(memory\.id\)[\s\S]*?setEditScope\(memory\.scope\)[\s\S]*?setEditContent\(memory\.content\)[\s\S]*?function saveEditedManualMemory\(memoryId: string\)[\s\S]*?findDuplicateMemory\(memories, editScope, content, memoryId\)[\s\S]*?이미 같은 scope에 같은 내용의 메모리가 있습니다[\s\S]*?memory\.id === memoryId && memory\.sourceType === "manual"[\s\S]*?updatedAt: now[\s\S]*?updateScopeFilter\(editScope\)/,
  "Learning manual memory edit flow should be limited to manual memories, block duplicates, and update the active scope",
);
assertMatches(
  /function deleteManualMemory\(memory: LearningMemory\)[\s\S]*?memory\.sourceType !== "manual"[\s\S]*?window\.confirm\([\s\S]*?수동 메모리를 삭제할까요\?[\s\S]*?setMemories\(\(current\) => current\.filter\(\(item\) => item\.id !== memory\.id\)\)[\s\S]*?setDeletedManualMemoryTitle\(memory\.title\)[\s\S]*?수동 메모리 삭제됨 · \{deletedManualMemoryTitle\}/,
  "Learning manual memory delete flow should be limited to manual memories, ask for confirmation, and show the deleted title",
);
assertMatches(
  /memory\.sourceType === "manual" \? \([\s\S]*?onClick=\{\(\) => startEditingManualMemory\(memory\)\}[\s\S]*?수동 메모리 편집[\s\S]*?onClick=\{\(\) => deleteManualMemory\(memory\)\}[\s\S]*?수동 메모리 삭제/,
  "Learning memory cards should expose edit and delete actions only for manual memories",
);
assertMatches(
  /data-testid="learning-feedback-improvement-queue"[\s\S]*?learningManualCopy\?\.id === "filter-link"[\s\S]*?learningManualCopy\?\.id === "filtered-report"[\s\S]*?learningManualCopy\?\.id ===[\s\S]*?"feedback-improvement-low-confidence-link"[\s\S]*?learningManualCopy\?\.id ===[\s\S]*?"feedback-improvement-release-gate"[\s\S]*?data-testid="learning-feedback-improvement-queue-manual-copy"[\s\S]*?ManualCopyPanel[\s\S]*?!feedbackImprovementFilterActive &&[\s\S]*?learningManualCopy\?\.id === "filter-link"[\s\S]*?learningManualCopy\?\.id === "filtered-report"[\s\S]*?ManualCopyPanel/,
  "Learning feedback-improvement queue should show copy fallback inside the queue and avoid duplicate filter-panel fallback",
);
assertMatches(
  /function openFilteredMemoriesInStudio\(\)[\s\S]*?const studioDraftSource = feedbackImprovementFilterActive[\s\S]*?"learning-feedback-improvement"[\s\S]*?"learning-filter"[\s\S]*?const studioDraftTitle = feedbackImprovementFilterActive[\s\S]*?피드백 개선 메모리 큐 · \$\{filtered\.length\}개[\s\S]*?const rawInput = feedbackImprovementFilterActive[\s\S]*?buildFeedbackImprovementQueueStudioDraftInput[\s\S]*?buildFilteredMemoriesStudioDraftInput[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: studioDraftSource[\s\S]*?rawInput,[\s\S]*?goal: feedbackImprovementFilterActive[\s\S]*?피드백 개선 메모리 큐 기반 프롬프트 보강[\s\S]*?sourceTitle: studioDraftTitle[\s\S]*?if \(!wroteDraft\)[\s\S]*?setFilteredReportCopyFailed\(true\)[\s\S]*?id: "filtered-report"[\s\S]*?title: studioDraftTitle[\s\S]*?body: rawInput[\s\S]*?Studio 초안 저장이 차단[\s\S]*?return;[\s\S]*?router\.push\([\s\S]*?\/studio\?draft=learning-feedback-improvement[\s\S]*?\/studio\?draft=learning-filter/,
  "Learning filtered and feedback-improvement queue Studio handoffs should show manual copy when draft storage fails",
);
assertMatches(
  /function openFeedbackImprovementLowConfidenceInStudio\(\)[\s\S]*?feedbackImprovementLowConfidenceMemories\.length === 0[\s\S]*?const rawInput = buildFeedbackImprovementLowConfidenceStudioDraftInput\(\{[\s\S]*?filteredMemories: feedbackImprovementLowConfidenceMemories[\s\S]*?scope[\s\S]*?totalMemories: memories\.length[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "learning-feedback-improvement"[\s\S]*?sourceVariant: "learning-low-confidence-validation"[\s\S]*?rawInput,[\s\S]*?goal: "낮은 신뢰도 피드백 개선 메모리 보강"[\s\S]*?sourceTitle: `피드백 개선 낮은 신뢰도 큐 · \$\{feedbackImprovementLowConfidenceMemories\.length\}개`[\s\S]*?sourceHref: feedbackImprovementLowConfidenceHref[\s\S]*?if \(!wroteDraft\)[\s\S]*?id: "feedback-improvement-low-confidence-studio"[\s\S]*?body: rawInput[\s\S]*?Studio 초안 저장이 차단[\s\S]*?return;[\s\S]*?router\.push\("\/studio\?draft=learning-feedback-improvement"\)/,
  "Learning feedback-improvement low-confidence queue should show manual copy when draft storage fails",
);
assertMatches(
  /function buildFeedbackImprovementLowConfidenceStudioDraftInput\(\{[\s\S]*?filteredMemories[\s\S]*?scope[\s\S]*?totalMemories[\s\S]*?low-confidence feedback rules before they are reused[\s\S]*?Use the low-confidence feedback-improvement Learning memory subset[\s\S]*?Do not turn low-confidence memories into reusable prompt rules without a validation plan[\s\S]*?collect more feedback, narrow scope, merge with a stronger rule, rewrite, or remove[\s\S]*?Required output[\s\S]*?Evidence gaps to resolve before reuse[\s\S]*?Validation questions to collect from Library feedback or external AI runs[\s\S]*?Merge\/rewrite\/remove recommendations[\s\S]*?Updated Learning memory candidates ready to save after validation[\s\S]*?stripMemoryReferenceLinks\(memory\.content\)/,
  "Learning feedback-improvement low-confidence Studio prompt should focus on validation, evidence gaps, and cleanup decisions",
);
assertMatches(
  /function buildFeedbackImprovementQueueStudioDraftInput\(\{[\s\S]*?filteredMemories[\s\S]*?query[\s\S]*?reviewFilter[\s\S]*?scope[\s\S]*?sortMode[\s\S]*?totalMemories[\s\S]*?senior prompt quality operator[\s\S]*?feedback-improvement Learning memory queue[\s\S]*?Treat each memory as an evidence-backed feedback rule[\s\S]*?GPT, Claude, Codex, Gemini, and MCP-assisted workflows[\s\S]*?Required output[\s\S]*?Priority prompt rules to reuse immediately[\s\S]*?Rules that need more feedback evidence[\s\S]*?External AI handoff checklist for GPT\/Claude\/Codex\/Gemini[\s\S]*?filteredMemories[\s\S]*?stripMemoryReferenceLinks\(memory\.content\)/,
  "Learning feedback-improvement Studio prompt should convert queue memories into reusable prompt quality rules",
);
assertMatches(
  /const rawInput = feedbackImprovementFilterActive[\s\S]*?buildFeedbackImprovementQueueStudioDraftInput\(\{[\s\S]*?filteredMemories: filtered[\s\S]*?query[\s\S]*?reviewFilter[\s\S]*?scope[\s\S]*?sortMode[\s\S]*?totalMemories: memories\.length[\s\S]*?buildFilteredMemoriesStudioDraftInput\(\{/,
  "Learning should use the feedback-improvement prompt builder only for the dedicated queue",
);
assertFileIncludes(
  readme,
  "Learning 필터 결과 리포트에 현재 조건 절대 URL을 포함",
  "README should document Learning filtered report condition links",
);
assertFileIncludes(
  readme,
  "Learning 준비도, 필터 결과, 개별 메모리, 피드백 개선 큐의 Studio 초안은 각각 `Learning 준비도로 돌아가기`, `Learning 조건으로 돌아가기`, `Learning 메모리로 돌아가기`, `Learning 피드백 큐로 돌아가기` 복귀 액션 라벨로 원래 조건을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시합니다.",
  "README should document Learning Studio draft return actions and storage fallback",
);
assertFileIncludes(
  readme,
  "Learning 운영 흐름은 준비도 점검, 낮은 신뢰도 검토, 수동 메모리 보강, 현재 조건 Studio 전송을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 합니다.",
  "README should document the Learning operating flow",
);
assertFileIncludes(
  readme,
  "Learning 상단 메모리 지표와 준비도 지표는 모바일 2열과 데스크톱 4열로 전체 메모리, scope, 신뢰도, 최근 업데이트를 빠르게 훑게 합니다.",
  "README should document the compact responsive Learning summary metrics",
);
assertFileIncludes(
  readme,
  "Learning 상단 다음 학습 액션은 첫 학습, 낮은 신뢰도 검토, 비어 있는 scope 보강, 피드백 개선 큐, Studio 적용 확인 중 현재 우선순위를 골라 바로가기 2개와 함께 보여줍니다.",
  "README should document the Learning next action guide",
);
assertFileIncludes(
  readme,
  "Learning 피드백 개선 큐 지표는 모바일 2열과 데스크톱 3열로 현재 큐, 낮은 신뢰도, 포함 scope를 짧게 확인하게 합니다.",
  "README should document the compact responsive Learning feedback queue metrics",
);
assertFileIncludes(
  readme,
  "Learning 피드백 개선 큐는 `01 검토`, `02 Studio`, `03 기록` 단계 카드를 함께 보여줘 낮은 신뢰도 확인, Studio 검증 초안 전송, 큐 리포트/검증 저장본 기록과 release gate 확인 순서를 바로 읽게 합니다.",
  "README should document the numbered Learning feedback queue workflow cards",
);
assertFileIncludes(
  readme,
  "Learning 수동 메모리 추가는 `01 범위 선택`, `02 규칙 작성`, `03 생성 반영` 단계 카드로 학습 scope, 재사용 규칙, 저장 후 Studio 반영 순서를 폼보다 먼저 보여줍니다.",
  "README should document the numbered Learning manual memory workflow cards",
);
assertFileIncludes(
  readme,
  "Learning 수동 메모리 추가/수정/삭제와 같은 scope+내용 중복 저장 방지로 회사 기준, 개인 선호, 분야 규칙, 스킬 패턴 직접 보강",
  "README should document manual Learning memory edit, delete, and duplicate guards",
);
assertFileIncludes(
  readme,
  "feedback-improvement 검색 조건에서는 피드백 개선 메모리 큐",
  "README should document Learning feedback improvement queue",
);
assertFileIncludes(
  readme,
  "`learning-feedback-improvement` 저장 출처",
  "README should document Learning feedback improvement queue Studio source",
);
assertFileIncludes(
  readme,
  "반복 피드백을 재사용 가능한 프롬프트 품질 규칙",
  "README should document Learning feedback improvement queue specialized Studio prompt",
);
assertFileIncludes(
  readme,
  "피드백 개선 메모리 큐 리포트",
  "README should document Learning feedback improvement queue report",
);
assertFileIncludes(
  readme,
  "`Release gate 복사`",
  "README should document Learning feedback improvement release gate copy",
);
assertFileIncludes(
  readme,
  "release evidence와 release-candidate 명령",
  "README should document Learning feedback improvement release gate commands",
);
assertFileIncludes(
  readme,
  "release gate 명령 복사가 실패하면",
  "README should document Learning feedback improvement release gate copy fallback",
);
assertFileIncludes(
  readme,
  "큐 패널 안에 수동 복사용 textarea",
  "README should document Learning feedback improvement queue copy fallback location",
);
assertFileIncludes(
  readme,
  "`큐 조건 링크 복사`",
  "README should document Learning feedback improvement queue condition link copy",
);
assertFileIncludes(
  readme,
  "`검토`는 `낮은 신뢰도만 보기`, `낮은 신뢰도 링크 복사`, `큐 조건 링크 복사`",
  "README should document Learning feedback improvement low-confidence drilldown actions",
);
assertFileIncludes(
  readme,
  "`낮은 신뢰도 Studio로`",
  "README should document Learning feedback improvement low-confidence Studio handoff",
);
assertFileIncludes(
  readme,
  "낮은 신뢰도 메모리만 `learning-feedback-improvement` 초안",
  "README should document Learning feedback improvement low-confidence subset draft source",
);
assertFileIncludes(
  readme,
  "`learning-low-confidence-validation` sourceVariant",
  "README should document Learning feedback improvement low-confidence sourceVariant",
);
assertFileIncludes(
  readme,
  "`검증 저장본 보기`",
  "README should document Learning feedback improvement validation Library action",
);
assertFileIncludes(
  readme,
  "/library?studioSource=learning-feedback-improvement&studioVariant=learning-low-confidence-validation",
  "README should document Learning feedback improvement validation Library filter URL",
);
assertFileIncludes(
  readme,
  "Library의 세부 초안 유형 필터에서 전체 큐 개선 초안과 구분",
  "README should document Learning low-confidence validation Library filtering",
);
assertFileIncludes(
  readme,
  "검증 질문, 병합/재작성/삭제 판단",
  "README should document Learning feedback improvement low-confidence validation prompt",
);
assertFileIncludes(
  readme,
  "Learning 준비도 리포트에 낮은 신뢰도, 최근 업데이트, scope별 점검 절대 URL을 포함",
  "README should document Learning readiness report review links",
);
assertFileIncludes(
  readme,
  "Learning 준비도 리포트를 Studio 초안으로 전송하고 `learning-readiness` 저장 출처로 추적",
  "README should document Learning readiness Studio handoff",
);
assertFileIncludes(
  readme,
  "`/learning#readiness`",
  "README should document the Learning readiness source anchor",
);
assertFileIncludes(
  prd,
  "필터 결과 리포트에는 현재 조건 절대 URL을 포함",
  "PRD should document Learning filtered report condition links",
);
assertFileIncludes(
  prd,
  "Learning 운영 흐름은 준비도 점검, 낮은 신뢰도 검토, 수동 메모리 보강, 현재 조건 Studio 전송을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 해야 한다.",
  "PRD should document the Learning operating flow",
);
assertFileIncludes(
  prd,
  "Learning 상단 메모리 지표와 준비도 지표는 모바일 2열과 데스크톱 4열로 전체 메모리, scope, 신뢰도, 최근 업데이트를 빠르게 훑게 해야 한다.",
  "PRD should document the compact responsive Learning summary metrics",
);
assertFileIncludes(
  prd,
  "Learning 상단 다음 학습 액션은 첫 학습, 낮은 신뢰도 검토, 비어 있는 scope 보강, 피드백 개선 큐, Studio 적용 확인 중 현재 우선순위를 골라 바로가기 2개와 함께 보여줘야 한다.",
  "PRD should document the Learning next action guide",
);
assertFileIncludes(
  prd,
  "Learning 피드백 개선 큐 지표는 모바일 2열과 데스크톱 3열로 현재 큐, 낮은 신뢰도, 포함 scope를 짧게 확인하게 해야 한다.",
  "PRD should document the compact responsive Learning feedback queue metrics",
);
assertFileIncludes(
  prd,
  "`01 검토`, `02 Studio`, `03 기록` 단계 카드로 낮은 신뢰도 확인, Studio 검증 초안 전송, 큐 리포트/검증 저장본 기록과 release gate 확인 순서를 먼저 보여준 뒤",
  "PRD should document the numbered Learning feedback queue workflow cards",
);
assertFileIncludes(
  prd,
  "`01 범위 선택`, `02 규칙 작성`, `03 생성 반영` 단계 카드로 학습 scope, 재사용 규칙, 저장 후 Studio 반영 순서를 폼보다 먼저 보여줘야 한다.",
  "PRD should document the numbered Learning manual memory workflow cards",
);
assertFileIncludes(
  prd,
  "feedback-improvement 검색 조건에서는 피드백 개선 메모리 큐",
  "PRD should document Learning feedback improvement queue",
);
assertFileIncludes(
  prd,
  "`learning-feedback-improvement` 저장 출처",
  "PRD should document Learning feedback improvement queue Studio source",
);
assertFileIncludes(
  prd,
  "반복 피드백을 재사용 가능한 프롬프트 품질 규칙",
  "PRD should document Learning feedback improvement queue specialized Studio prompt",
);
assertFileIncludes(
  prd,
  "피드백 개선 메모리 큐 리포트",
  "PRD should document Learning feedback improvement queue report",
);
assertFileIncludes(
  prd,
  "`Release gate 복사`",
  "PRD should document Learning feedback improvement release gate copy",
);
assertFileIncludes(
  prd,
  "release evidence와 release-candidate 명령",
  "PRD should document Learning feedback improvement release gate commands",
);
assertFileIncludes(
  prd,
  "release gate 명령 복사가 실패하면",
  "PRD should document Learning feedback improvement release gate copy fallback",
);
assertFileIncludes(
  prd,
  "큐 패널 안에 수동 복사용 textarea",
  "PRD should document Learning feedback improvement queue copy fallback location",
);
assertFileIncludes(
  prd,
  "Learning 준비도, 필터 결과, 개별 메모리, 피드백 개선 큐의 Studio 초안은 각각 `Learning 준비도로 돌아가기`, `Learning 조건으로 돌아가기`, `Learning 메모리로 돌아가기`, `Learning 피드백 큐로 돌아가기` 복귀 액션 라벨로 원래 조건을 복원해야 하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시해야 한다.",
  "PRD should document Learning Studio draft return actions and storage fallback",
);
const staleLearningDraftFallbackOnlyContract = [
  "Learning 준비도, 필터 결과, 개별 메모리, 피드백 개선 큐의 Studio 초안",
  "저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시",
].join(" ");

for (const [sourceName, fileSource, suffix] of [
  ["README", readme, "합니다."],
  ["PRD", prd, "해야 한다."],
  ["Development brief", devBrief, "함"],
]) {
  assertFileNotIncludes(
    fileSource,
    `${staleLearningDraftFallbackOnlyContract}${suffix}`,
    `${sourceName} should not keep the Learning draft fallback wording without return action labels`,
  );
}
assertFileIncludes(
  prd,
  "`큐 조건 링크 복사`",
  "PRD should document Learning feedback improvement queue condition link copy",
);
assertFileIncludes(
  prd,
  "`검토`는 `낮은 신뢰도만 보기`, `낮은 신뢰도 링크 복사`, `큐 조건 링크 복사`",
  "PRD should document Learning feedback improvement low-confidence drilldown actions",
);
assertFileIncludes(
  prd,
  "`낮은 신뢰도 Studio로`",
  "PRD should document Learning feedback improvement low-confidence Studio handoff",
);
assertFileIncludes(
  prd,
  "낮은 신뢰도 메모리만 `learning-feedback-improvement` 초안",
  "PRD should document Learning feedback improvement low-confidence subset draft source",
);
assertFileIncludes(
  prd,
  "`learning-low-confidence-validation` sourceVariant",
  "PRD should document Learning feedback improvement low-confidence sourceVariant",
);
assertFileIncludes(
  prd,
  "`검증 저장본 보기`",
  "PRD should document Learning feedback improvement validation Library action",
);
assertFileIncludes(
  prd,
  "/library?studioSource=learning-feedback-improvement&studioVariant=learning-low-confidence-validation",
  "PRD should document Learning feedback improvement validation Library filter URL",
);
assertFileIncludes(
  prd,
  "Library의 세부 초안 유형 필터에서 전체 큐 개선 초안과 구분",
  "PRD should document Learning low-confidence validation Library filtering",
);
assertFileIncludes(
  prd,
  "검증 질문, 병합/재작성/삭제 판단",
  "PRD should document Learning feedback improvement low-confidence validation prompt",
);
assertFileIncludes(
  prd,
  "준비도 리포트에는 낮은 신뢰도, 최근 업데이트, scope별 점검 절대 URL을 포함",
  "PRD should document Learning readiness report review links",
);
assertFileIncludes(
  prd,
  "준비도 리포트는 Studio 초안으로 전송할 수 있고 `learning-readiness` 저장 출처로 추적해야 하며",
  "PRD should document Learning readiness Studio handoff",
);
assertFileIncludes(
  prd,
  "`/learning#readiness`",
  "PRD should document the Learning readiness source anchor",
);
assertFileIncludes(
  promptTypes,
  '"learning-readiness"',
  "Prompt Studio draft sources should include learning-readiness",
);
assertFileIncludes(
  promptTypes,
  '"learning-feedback-improvement"',
  "Prompt Studio draft sources should include learning-feedback-improvement",
);
assertFileIncludes(
  promptTypes,
  '"learning-low-confidence-validation"',
  "Prompt Studio draft source variants should include learning-low-confidence-validation",
);
assertFileIncludes(
  draftVariants,
  '"learning-low-confidence-validation":',
  "Studio draft variant rules should include learning-low-confidence-validation",
);
assertFileIncludes(
  draftVariants,
  'allowedSources: ["learning-feedback-improvement"]',
  "Learning low-confidence validation variant should only allow learning-feedback-improvement source",
);
assertFileIncludes(
  draftDisplay,
  '"learning-low-confidence-validation":',
  "Studio draft display labels should include learning-low-confidence-validation",
);
assertFileIncludes(
  draftDisplay,
  "Learning 저신뢰도 피드백 검증",
  "Studio draft display should label Learning low-confidence validation drafts",
);
assertFileIncludes(
  libraryView,
  '"learning-low-confidence-validation": "Learning 저신뢰도 피드백 검증"',
  "Library studioVariant filter labels should include Learning low-confidence validation",
);
assertFileIncludes(
  sourceRegistry,
  '"learning-readiness"',
  "Studio source registry should include learning-readiness",
);
assertFileIncludes(
  sourceRegistry,
  '"learning-feedback-improvement"',
  "Studio source registry should include learning-feedback-improvement",
);
assertFileIncludes(
  sourceRegistry,
  "Learning 피드백 개선 메모리 큐",
  "Studio source registry should label Learning feedback improvement queue drafts",
);
assertFileIncludes(
  sourceRegistry,
  "Learning 준비도 리포트",
  "Studio source registry should label Learning readiness drafts",
);
for (const sourceActionLabel of [
  "Learning 준비도로 돌아가기",
  "Learning 조건으로 돌아가기",
  "Learning 메모리로 돌아가기",
  "Learning 피드백 큐로 돌아가기",
]) {
  assertFileIncludes(
    sourceRegistry,
    sourceActionLabel,
    `Studio source registry should include ${sourceActionLabel}`,
  );
}
assertFileIncludes(
  devBrief,
  "Learning 피드백 개선 큐는 `01 검토`, `02 Studio`, `03 기록` 단계 카드를 함께 보여줘 낮은 신뢰도 확인, Studio 검증 초안 전송, 큐 리포트/검증 저장본 기록과 release gate 확인 순서를 바로 읽게 함",
  "Development brief should document the numbered Learning feedback queue workflow cards",
);
assertFileIncludes(
  devBrief,
  "Learning 수동 메모리 추가는 `01 범위 선택`, `02 규칙 작성`, `03 생성 반영` 단계 카드로 학습 scope, 재사용 규칙, 저장 후 Studio 반영 순서를 폼보다 먼저 보여줌",
  "Development brief should document the numbered Learning manual memory workflow cards",
);
assertFileIncludes(
  prd,
  "`manual` 메모리는 목록에서 수정하거나 삭제할 수 있어 잘못 입력한 학습 기준을 정리할 수 있으며, 같은 scope에 같은 내용을 반복 저장하지 못하게 막는다.",
  "PRD should document manual Learning memory edit, delete, and duplicate guards",
);
assertFileIncludes(
  devBrief,
  "프로필, 회사 맥락, 피드백이 실제 프롬프트에 반영되는지를 우선 검증한다.",
  "Development brief should preserve the learning-context implementation priority",
);
assertFileIncludes(
  devBrief,
  "Learning 준비도, 필터 결과, 개별 메모리, 피드백 개선 큐의 Studio 초안은 각각 `Learning 준비도로 돌아가기`, `Learning 조건으로 돌아가기`, `Learning 메모리로 돌아가기`, `Learning 피드백 큐로 돌아가기` 복귀 액션 라벨로 원래 조건을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시함",
  "Development brief should document Learning Studio draft return actions and storage fallback",
);

writeLearningFeedbackEvidence(outputPath, buildLearningFeedbackEvidenceText());

console.log("Learning operational summary verification passed.");
