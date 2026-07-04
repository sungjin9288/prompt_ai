import assert from "node:assert/strict";
import { readConcatenatedSources, readSource } from "./lib/read-source.mjs";

const dashboardViewSource = readSource(
  "src/components/dashboard/dashboard-view.tsx",
);
const dashboardPanelSources = [
  "src/components/dashboard/dashboard-next-action-queue-panel.tsx",
  "src/components/dashboard/dashboard-improvement-panel.tsx",
  "src/components/dashboard/dashboard-personalization-panel.tsx",
  "src/components/dashboard/dashboard-skill-ops-panel.tsx",
].map((path) => readSource(path));
const dashboardSource = [
  readConcatenatedSources([
    "src/lib/dashboard/shared.ts",
    "src/lib/dashboard/hrefs.ts",
    "src/lib/dashboard/learning-memory.ts",
    "src/lib/dashboard/next-action-queue.ts",
    "src/lib/dashboard/personalization-reports.ts",
    "src/lib/dashboard/source-reports.ts",
  ]),
  dashboardViewSource,
  ...dashboardPanelSources,
].join("\n");
const sourceRegistrySource = readSource("src/lib/studio/source-registry.ts");
const promptTypesSource = readSource("src/lib/prompt/types.ts");
const draftVariantsSource = readSource("src/lib/studio/draft-variants.ts");
const draftDisplaySource = readSource("src/lib/studio/draft-display.ts");
const readme = readSource("README.md");
const prdSource = readSource("docs/personalized-prompt-ai-prd.md");
const developmentBrief = readSource("docs/codex-development-brief.md");

function assertDashboardMatches(pattern, message) {
  assert.match(dashboardSource, pattern, message);
}

function assertFileIncludes(fileSource, text, message) {
  assert.ok(fileSource.includes(text), message);
}

function assertFileNotIncludes(fileSource, text, message) {
  assert.ok(!fileSource.includes(text), message);
}

function assertFileNotMatches(fileSource, pattern, message) {
  assert.doesNotMatch(fileSource, pattern, message);
}

function assertDashboardNotIncludes(text, message) {
  assert.ok(!dashboardSource.includes(text), message);
}

assertDashboardMatches(
  /function buildDashboardStudioSourceOpsReportText\(\{[\s\S]*?baseUrl[\s\S]*?const formatReportHref = \(href: string\) =>[\s\S]*?formatAbsoluteInternalHref\(href, baseUrl\)[\s\S]*?# Studio 저장 출처 운영 리포트[\s\S]*?Studio 저장 출처: \$\{sourceSummary\.length\}개[\s\S]*?저장 출처 메타 없음: \$\{missingSourceMetadataCount\}개 · \$\{formatReportHref[\s\S]*?## 저장 출처[\s\S]*?세부 유형: \$\{item\.sourceVariantLabels\.join\(", "\)\}[\s\S]*?세부 유형 필터:[\s\S]*?\$\{variant\.label\} \$\{variant\.count\}개: \$\{formatReportHref[\s\S]*?대표 출처 제목: \$\{item\.sourceTitles\.join\(", "\)\}[\s\S]*?대표 저장본:[\s\S]*?\$\{example\.title\}: \$\{formatReportHref\(example\.href\)\}[\s\S]*?원본 경로: \$\{formatReportHref[\s\S]*?example\.originalHref[\s\S]*?대표 저장본 외: \$\{item\.count - item\.sourceExamples\.length\}개[\s\S]*?## 저장 출처 메타 없음 큐[\s\S]*?Dashboard, Library, Learning, Skills 조치[\s\S]*?Dashboard, Library, Learning, Skills 출처가 섞여 있는 경우 같은 저장 출처별로 목적과 재사용 기준을 분리합니다\./,
  "Dashboard Studio source ops report should use saved-source wording and include Skills-aware source criteria, variant labels/filter links, representative saved-source detail links, original source links, and remaining counts",
);

assertDashboardMatches(
  /function openStudioSourceOpsReportInStudio\(\)[\s\S]*?const rawInput = buildDashboardStudioSourceOpsStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?sourceSummary: studioSourceSummary[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-studio-source-ops"[\s\S]*?rawInput[\s\S]*?goal: "Studio 저장 출처 운영 기준 정리"[\s\S]*?sourceTitle: "Dashboard Studio 저장 출처 운영 리포트"[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setStudioSourceOpsReportCopyStatus\("failed"\)[\s\S]*?setStudioSourceOpsManualCopy\(\{[\s\S]*?title: "Dashboard Studio 저장 출처 운영 리포트"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-studio-source-ops"\)/,
  "Dashboard Studio source ops draft should open in Studio with saved-source goal and keep manual fallback when draft storage fails",
);
assertDashboardMatches(
  /async function copyStudioSourceOpsReport\(\)[\s\S]*?buildDashboardStudioSourceOpsReportText\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?persistenceSummary: studioPersistenceSummary[\s\S]*?sourceSummary: studioSourceSummary[\s\S]*?copyTextToClipboard\(reportText\)[\s\S]*?setStudioSourceOpsReportCopyStatus[\s\S]*?setStudioSourceOpsManualCopy/,
  "Dashboard Studio source ops report should be copyable with absolute links and fallback metadata",
);
assertDashboardMatches(
  /async function copyMissingSourceMetadataQueuePrompt\(\)[\s\S]*?buildDashboardMissingSourceMetadataQueueStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?persistenceSummary: studioPersistenceSummary[\s\S]*?copyTextToClipboard\(promptText\)[\s\S]*?setMissingSourceMetadataQueueCopyStatus[\s\S]*?setMissingSourceMetadataQueueManualCopy/,
  "Dashboard missing saved-source metadata queue prompt should be copyable with an absolute queue link and fallback metadata",
);
assertDashboardMatches(
  /async function copyMissingSourceMetadataQueueLink\(\)[\s\S]*?formatAbsoluteInternalHref\([\s\S]*?studioPersistenceLibraryHref\("none"\)[\s\S]*?window\.location\.origin[\s\S]*?copyTextToClipboard\(queueHref\)[\s\S]*?setMissingSourceMetadataQueueLinkCopyStatus[\s\S]*?Dashboard 저장 출처 메타 없음 큐 링크/,
  "Dashboard missing saved-source metadata queue link should copy as an absolute internal link with fallback metadata",
);
assertDashboardMatches(
  /async function copyStudioPersistenceLink\(item: StudioPersistenceSummaryItem\)[\s\S]*?const href = studioPersistenceLibraryHref\(item\.mode\)[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?copyTextToClipboard\(absoluteHref\)[\s\S]*?setStudioPersistenceLinkCopyStatus[\s\S]*?Studio 저장 방식 링크/,
  "Dashboard Studio persistence links should copy as absolute internal links with fallback metadata",
);
assertDashboardMatches(
  /async function copyStudioPersistenceAllLink\(\)[\s\S]*?const href = "\/library"[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?copyTextToClipboard\(absoluteHref\)[\s\S]*?setStudioPersistenceAllLinkCopyStatus[\s\S]*?Studio 저장 방식 전체 링크/,
  "Dashboard Studio persistence all-link should copy as an absolute internal link with fallback metadata",
);
assertDashboardMatches(
  /async function copySourceHealthLink\(\{[\s\S]*?href: string[\s\S]*?key: string[\s\S]*?title: string[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?copyTextToClipboard\(absoluteHref\)[\s\S]*?setSourceHealthLinkCopyStatus[\s\S]*?setSourceHealthManualCopy/,
  "Dashboard source-health links should copy as absolute internal links with fallback metadata",
);
assertDashboardMatches(
  /function buildDashboardSourceHealthActionReport\(\{[\s\S]*?baseUrl[\s\S]*?const formatSourceHealthHref = \(href: string\) =>[\s\S]*?formatAbsoluteInternalHref\(href, baseUrl\)[\s\S]*?## Source health links[\s\S]*?formatSourceHealthHref\(archivedSourceHref\)[\s\S]*?formatSourceHealthHref\(unmeasuredHref\)[\s\S]*?## Reason breakdown[\s\S]*?sourceReason: item\.reason[\s\S]*?formatSourceHealthHref\([\s\S]*?reasonHref/,
  "Dashboard source-health action report should include absolute summary and per-reason filter links",
);
assertDashboardMatches(
  /function formatSourceHealthIssueLine\([\s\S]*?baseUrl\?: string[\s\S]*?rawDetailHref = promptDetailLibraryHref[\s\S]*?formatAbsoluteInternalHref\(rawDetailHref, baseUrl\)[\s\S]*?상세: \$\{detailHref\}/,
  "Dashboard source-health report candidate lines should include absolute detail links when a base URL is supplied",
);
assertDashboardMatches(
  /function buildDashboardSourceHealthCandidateMemo\([\s\S]*?baseUrl\?: string[\s\S]*?rawDetailHref = promptDetailLibraryHref[\s\S]*?formatAbsoluteInternalHref\(rawDetailHref, baseUrl\)[\s\S]*?상세 링크: \$\{detailHref\}/,
  "Dashboard source-health candidate memos should include absolute detail links when copied or sent to Studio",
);
assertDashboardMatches(
  /async function copySourceHealthActionReport\(\)[\s\S]*?buildDashboardSourceHealthActionReport\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?copyTextToClipboard\(reportText\)/,
  "Dashboard source-health action report copy should use absolute links",
);
assertDashboardMatches(
  /copySourceHealthCandidateMemo\(issue: PromptSourceHealthIssue\)[\s\S]*?buildDashboardSourceHealthCandidateMemo\([\s\S]*?window\.location\.origin[\s\S]*?copyTextToClipboard\(memoText\)/,
  "Dashboard source-health candidate memo copy should use absolute links",
);
assertDashboardMatches(
  /function openSourceHealthActionReportInStudio\(\)[\s\S]*?const rawInput = buildDashboardSourceHealthActionStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-source-health-action"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setSourceHealthActionCopyStatus\("failed"\)[\s\S]*?setSourceHealthManualCopy\(\{[\s\S]*?title: "Dashboard 개선 출처 상태 조치 계획"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-source-health-action"\)/,
  "Dashboard source-health action Studio draft should use absolute report links and keep manual fallback when draft storage fails",
);
assertDashboardMatches(
  /function openSourceHealthCandidateInStudio\(issue: PromptSourceHealthIssue\)[\s\S]*?const rawInput = buildDashboardSourceHealthCandidateMemo\([\s\S]*?window\.location\.origin[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-source-health-candidate"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setSourceHealthCandidateCopyStatus\(\{[\s\S]*?key: sourceHealthIssueKey\(issue\)[\s\S]*?status: "failed"[\s\S]*?setSourceHealthManualCopy\(\{[\s\S]*?title: "개선 출처 상태 후보 Studio 초안"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-source-health-candidate"\)/,
  "Dashboard source-health candidate Studio draft should use absolute detail links and keep manual fallback when draft storage fails",
);

assertDashboardMatches(
  /function buildDashboardMissingSourceMetadataQueueStudioPrompt\(\{[\s\S]*?baseUrl[\s\S]*?const formatQueueHref = \(href: string\) =>[\s\S]*?formatAbsoluteInternalHref\(href, baseUrl\)[\s\S]*?Missing saved-source metadata queue:[\s\S]*?Library 큐: \$\{formatQueueHref\(studioPersistenceLibraryHref\("none"\)\)\}[\s\S]*?재저장 기준: Dashboard, Library, Learning, Skills 조치/,
  "Dashboard should build a focused Studio prompt for the missing saved-source metadata queue with an absolute Library queue link and Skills-aware criteria",
);
assertDashboardMatches(
  /type DashboardNextActionQueueItem = LearningOpsAction & \{[\s\S]*?category: "learning" \| "personalization"[\s\S]*?function summarizeDashboardNextActionQueue\(\{[\s\S]*?personalizationActions\.map[\s\S]*?categoryLabel: "개인화"[\s\S]*?learningOpsActions\.map[\s\S]*?categoryLabel: "학습"[\s\S]*?learningOpsPriorityRank[\s\S]*?slice\(0, 4\)/,
  "Dashboard should merge personalization and Learning actions into a prioritized next-action queue",
);
assertDashboardMatches(
  /function buildDashboardNextActionQueueReportText\(\{[\s\S]*?baseUrl[\s\S]*?const priorityCounts = summarizeDashboardNextActionQueuePriorityCounts\(queue\)[\s\S]*?const categoryCounts = summarizeDashboardNextActionQueueCategoryCounts\(queue\)[\s\S]*?const firstAction = queue\[0\][\s\S]*?const firstActionHref = firstAction[\s\S]*?formatAbsoluteInternalHref\(firstAction\.href, baseUrl\)[\s\S]*?# Dashboard 다음 실행 큐 리포트[\s\S]*?Queue priority: High \$\{priorityCounts\.high\} · Med \$\{priorityCounts\.medium\} · Low \$\{priorityCounts\.low\}[\s\S]*?Queue category: 개인화 \$\{categoryCounts\.personalization\} · 학습 \$\{categoryCounts\.learning\}[\s\S]*?First action:[\s\S]*?learningOpsPriorityLabel\(firstAction\.priority\)[\s\S]*?firstActionHref[\s\S]*?## Prioritized queue[\s\S]*?formatAbsoluteInternalHref\(item\.href, baseUrl\)[\s\S]*?learningOpsPriorityLabel\(item\.priority\)[\s\S]*?## Execution rule[\s\S]*?## Verification checklist[\s\S]*?dashboardNextActionQueueVerificationChecklist\.map/,
  "Dashboard should build a copy-ready next-action queue report with summary counts, first action, absolute links, and a verification checklist",
);
assertDashboardMatches(
  /const dashboardNextActionQueueVerificationChecklist = \[[\s\S]*?원본 화면에서 변경된 필드, 메모리, 메타 확인[\s\S]*?Studio 프롬프트를 재생성하거나 검토[\s\S]*?외부 AI handoff에 재사용 가능할 때만 저장[\s\S]*?function buildDashboardNextActionQueueVerificationChecklistText\(\)[\s\S]*?# Dashboard 다음 실행 큐 완료 확인[\s\S]*?dashboardNextActionQueueVerificationChecklist\.map/,
  "Dashboard should build a reusable next-action queue verification checklist text",
);
assertDashboardMatches(
  /function buildDashboardNextActionQueueLinksText\(\{[\s\S]*?baseUrl[\s\S]*?# Dashboard 다음 실행 큐 링크[\s\S]*?formatAbsoluteInternalHref\(item\.href, baseUrl\) \?\? item\.href[\s\S]*?learningOpsPriorityLabel\(item\.priority\)/,
  "Dashboard should build a lightweight next-action queue links list with absolute action links",
);
assertDashboardMatches(
  /function buildDashboardNextActionQueueStudioPrompt\(\{[\s\S]*?baseUrl[\s\S]*?Dashboard next action queue report:[\s\S]*?buildDashboardNextActionQueueReportText\(\{[\s\S]*?baseUrl/,
  "Dashboard should build a Studio prompt from the full next-action queue report with absolute links",
);
assertDashboardMatches(
  /function buildDashboardNextActionQueueVerificationStudioPrompt\(\{[\s\S]*?baseUrl[\s\S]*?Create a concise verification plan for the Dashboard next action queue completion checklist[\s\S]*?Completion checklist:[\s\S]*?buildDashboardNextActionQueueVerificationChecklistText\(\)[\s\S]*?Dashboard next action queue report:[\s\S]*?buildDashboardNextActionQueueReportText\(\{[\s\S]*?baseUrl/,
  "Dashboard should build a Studio verification prompt from the completion checklist and full queue report with absolute links",
);
assertDashboardMatches(
  /async function copyDashboardNextActionQueueReport\(\)[\s\S]*?buildDashboardNextActionQueueReportText\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?queue: dashboardNextActionQueue[\s\S]*?copyTextToClipboard\(reportText\)[\s\S]*?setDashboardNextActionQueueReportCopyStatus[\s\S]*?setDashboardNextActionQueueManualCopy/,
  "Dashboard next-action queue report should be copyable with manual fallback",
);
assertDashboardMatches(
  /async function copyDashboardNextActionQueueLinks\(\)[\s\S]*?buildDashboardNextActionQueueLinksText\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?queue: dashboardNextActionQueue[\s\S]*?copyTextToClipboard\(linksText\)[\s\S]*?setDashboardNextActionQueueLinksCopyStatus[\s\S]*?setDashboardNextActionQueueManualCopy/,
  "Dashboard next-action queue links list should be copyable with manual fallback",
);
assertDashboardMatches(
  /async function copyDashboardNextActionQueueVerificationChecklist\(\)[\s\S]*?buildDashboardNextActionQueueVerificationChecklistText\(\)[\s\S]*?copyTextToClipboard\(checklistText\)[\s\S]*?setDashboardNextActionQueueVerificationCopyStatus[\s\S]*?setDashboardNextActionQueueManualCopy[\s\S]*?Dashboard 다음 실행 큐 완료 확인/,
  "Dashboard next-action queue verification checklist should be copyable with manual fallback",
);
assertDashboardMatches(
  /function openDashboardNextActionQueueVerificationInStudio\(\)[\s\S]*?const rawInput = buildDashboardNextActionQueueVerificationStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?queue: dashboardNextActionQueue[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-next-action-queue"[\s\S]*?sourceVariant: "dashboard-next-action-queue-verification"[\s\S]*?rawInput[\s\S]*?goal: "Dashboard 다음 실행 큐 완료 확인 계획"[\s\S]*?sourceTitle: "Dashboard 다음 실행 큐 완료 확인"[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setDashboardNextActionQueueVerificationCopyStatus\("failed"\)[\s\S]*?setDashboardNextActionQueueManualCopy\(\{[\s\S]*?title: "Dashboard 다음 실행 큐 완료 확인"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-next-action-queue-verification"\)/,
  "Dashboard next-action queue verification checklist should keep manual fallback when draft storage fails and navigate only after a saved variant-marked draft",
);
assertDashboardMatches(
  /async function copyDashboardNextActionQueueItemLink\([\s\S]*?item: DashboardNextActionQueueItem[\s\S]*?formatAbsoluteInternalHref\([\s\S]*?item\.href[\s\S]*?window\.location\.origin[\s\S]*?copyTextToClipboard\(absoluteHref\)[\s\S]*?setDashboardNextActionQueueLinkCopyStatus[\s\S]*?setDashboardNextActionQueueManualCopy/,
  "Dashboard next-action queue item links should copy as absolute URLs with manual fallback",
);
assertDashboardMatches(
  /async function copyDashboardNextActionQueueItemReport\([\s\S]*?item: DashboardNextActionQueueItem[\s\S]*?item\.category === "personalization"[\s\S]*?buildDashboardPersonalizationActionReportText\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?buildDashboardLearningActionReportText\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?copyTextToClipboard\(reportText\)[\s\S]*?setPersonalizationActionCopyStatus[\s\S]*?setLearningOpsActionCopyStatus[\s\S]*?setDashboardNextActionQueueManualCopy[\s\S]*?title: `\$\{item\.label\} 리포트`/,
  "Dashboard next-action queue item reports should copy with queue-local manual fallback",
);
assertDashboardMatches(
  /function openDashboardNextActionQueueInStudio\(\)[\s\S]*?const rawInput = buildDashboardNextActionQueueStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?queue: dashboardNextActionQueue[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-next-action-queue"[\s\S]*?rawInput[\s\S]*?goal: "Dashboard 다음 실행 큐 실행 계획"[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setDashboardNextActionQueueReportCopyStatus\("failed"\)[\s\S]*?setDashboardNextActionQueueManualCopy\(\{[\s\S]*?title: "Dashboard 다음 실행 큐"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-next-action-queue"\)/,
  "Dashboard next-action queue should keep manual fallback when draft storage fails and navigate only after a saved dedicated Studio draft",
);
assertDashboardMatches(
  /다음 실행 큐[\s\S]*?data-testid="dashboard-next-action-queue"[\s\S]*?data-testid="dashboard-next-action-queue-report-copy"[\s\S]*?data-testid="dashboard-next-action-queue-links-copy"[\s\S]*?data-testid="dashboard-next-action-queue-studio"[\s\S]*?dashboardNextActionQueue\.map[\s\S]*?바로 열기[\s\S]*?openPersonalizationActionInStudio\([\s\S]*?item[\s\S]*?"next-action-queue"[\s\S]*?openLearningOpsActionInStudio\([\s\S]*?item[\s\S]*?"next-action-queue"[\s\S]*?data-testid="dashboard-next-action-studio"[\s\S]*?copyDashboardNextActionQueueItemLink\(item\)[\s\S]*?data-testid="dashboard-next-action-link-copy"[\s\S]*?copyDashboardNextActionQueueItemReport\(item\)[\s\S]*?data-testid="dashboard-next-action-copy"/,
  "Dashboard next-action queue should expose open, Studio, and report-copy actions for personalization and Learning items",
);
assertDashboardMatches(
  /const dashboardNextActionQueuePriorityCounts = useMemo\([\s\S]*?summarizeDashboardNextActionQueuePriorityCounts\(dashboardNextActionQueue\)[\s\S]*?dashboardNextActionQueuePriorityCounts\.high[\s\S]*?dashboardNextActionQueuePriorityCounts\.medium[\s\S]*?dashboardNextActionQueuePriorityCounts\.low/,
  "Dashboard next-action queue should show High/Med/Low priority counts",
);
assertDashboardMatches(
  /const dashboardNextActionQueueCategoryCounts = useMemo\([\s\S]*?summarizeDashboardNextActionQueueCategoryCounts\(dashboardNextActionQueue\)[\s\S]*?dashboardNextActionQueueCategoryCounts\.personalization[\s\S]*?dashboardNextActionQueueCategoryCounts\.learning/,
  "Dashboard next-action queue should show personalization/Learning category counts",
);
assertDashboardMatches(
  /const dashboardNextActionQueueFirstAction = dashboardNextActionQueue\[0\] \?\? null[\s\S]*?dashboardNextActionQueueFirstAction \?[\s\S]*?첫 실행[\s\S]*?learningOpsPriorityLabel\([\s\S]*?dashboardNextActionQueueFirstAction\.priority[\s\S]*?dashboardNextActionQueueFirstAction\.categoryLabel[\s\S]*?dashboardNextActionQueueFirstAction\.label[\s\S]*?data-testid="dashboard-next-action-first-open"[\s\S]*?첫 실행 열기[\s\S]*?copyDashboardNextActionQueueItemLink\([\s\S]*?dashboardNextActionQueueFirstAction[\s\S]*?data-testid="dashboard-next-action-first-link-copy"[\s\S]*?첫 실행 링크 복사됨[\s\S]*?첫 실행 링크 실패[\s\S]*?첫 실행 링크 복사[\s\S]*?openPersonalizationActionInStudio\([\s\S]*?dashboardNextActionQueueFirstAction[\s\S]*?"next-action-queue"[\s\S]*?openLearningOpsActionInStudio\([\s\S]*?dashboardNextActionQueueFirstAction[\s\S]*?"next-action-queue"[\s\S]*?data-testid="dashboard-next-action-first-studio"[\s\S]*?첫 실행 Studio로[\s\S]*?copyDashboardNextActionQueueItemReport\([\s\S]*?dashboardNextActionQueueFirstAction[\s\S]*?data-testid="dashboard-next-action-first-report-copy"[\s\S]*?첫 실행 리포트 복사됨[\s\S]*?첫 실행 리포트 실패[\s\S]*?첫 실행 리포트 복사/,
  "Dashboard next-action queue should show and expose open/link-copy/Studio/report-copy actions for the first item",
);
assertDashboardMatches(
  /const dashboardNextActionQueueWorkflowSteps = useMemo\([\s\S]*?label: "첫 실행"[\s\S]*?step: "01"[\s\S]*?dashboardNextActionQueueFirstAction\.label[\s\S]*?label: "실행 계획"[\s\S]*?step: "02"[\s\S]*?High \$\{dashboardNextActionQueuePriorityCounts\.high\}[\s\S]*?label: "완료 확인"[\s\S]*?step: "03"[\s\S]*?개인화 \$\{dashboardNextActionQueueCategoryCounts\.personalization\}/,
  "Dashboard next-action queue should calculate numbered first-run, execution-plan, and verification workflow cards",
);
assertDashboardMatches(
  /data-testid="dashboard-next-action-queue"[\s\S]*?High 항목을 먼저 처리하고[\s\S]*?data-testid="dashboard-next-action-workflow"[\s\S]*?dashboardNextActionQueueWorkflowSteps\.map[\s\S]*?item\.step[\s\S]*?item\.label[\s\S]*?item\.title[\s\S]*?item\.detail[\s\S]*?dashboardNextActionQueueFirstAction \?/,
  "Dashboard next-action queue should render numbered workflow cards before first-action and verification controls",
);
assertDashboardMatches(
  /const dashboardExecutionSummaryItems = \[[\s\S]*?dashboardNextActionQueueFirstAction[\s\S]*?learningOpsPriorityLabel\([\s\S]*?dashboardNextActionQueueFirstAction\.priority[\s\S]*?label: "먼저 처리"[\s\S]*?engineStatusFailed[\s\S]*?engineStatus\?\.mode === "openai"[\s\S]*?OpenAI Responses API[\s\S]*?label: "생성 상태"[\s\S]*?Local fallback[\s\S]*?improvementSummary\.reimprovementQueue\.length[\s\S]*?feedbackImprovementReviewCount[\s\S]*?label: "검증 위치"[\s\S]*?prompts\.length/,
  "Dashboard execution summary should derive first action, generation status, and Library verification from existing state",
);
assertDashboardMatches(
  /data-testid="dashboard-execution-summary"[\s\S]*?workflowItems\.map/,
  "Dashboard should render the execution summary before the detailed workflow shortcuts",
);
assertDashboardMatches(
  /const workflowItems = \[[\s\S]*?href: "\/studio"[\s\S]*?step: "01"[\s\S]*?title: "작성"[\s\S]*?href: "\/library"[\s\S]*?step: "02"[\s\S]*?title: "저장"[\s\S]*?href: "\/learning"[\s\S]*?step: "03"[\s\S]*?title: "학습"[\s\S]*?href: "\/skills"[\s\S]*?step: "04"[\s\S]*?title: "스킬화"[\s\S]*?href: "\/integrations"[\s\S]*?step: "05"[\s\S]*?title: "연결"[\s\S]*?Chrome, MCP, 외부 AI 전달 흐름을 검토 후 실행[\s\S]*?href: "\/data"[\s\S]*?step: "06"[\s\S]*?title: "백업"/,
  "Dashboard workflow shortcuts should include Studio, Library, Learning, Skills, Integrations, and Data in order",
);
assertDashboardMatches(
  /className="mb-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6"[\s\S]*?data-testid="dashboard-workflow-shortcuts"[\s\S]*?workflowItems\.map[\s\S]*?item\.step[\s\S]*?item\.title[\s\S]*?item\.description/,
  "Dashboard workflow shortcuts should render six scannable steps in three columns on tablet and six columns on wide screens",
);
assertDashboardMatches(
  /data-testid="dashboard-execution-summary"[\s\S]*?오늘의 실행 요약[\s\S]*?첫 실행, 생성 상태, 저장 검증 위치를 한 줄로 확인합니다\.[\s\S]*?준비도 \{dataReadinessScore\}%[\s\S]*?dashboardExecutionSummaryItems\.map[\s\S]*?item\.label[\s\S]*?item\.actionLabel[\s\S]*?item\.title[\s\S]*?item\.detail/,
  "Dashboard should render the execution summary metrics before the detailed workflow shortcuts",
);
assertDashboardMatches(
  /data-testid="dashboard-summary-metrics"[\s\S]*?grid-cols-2[\s\S]*?summaryMetrics\.map[\s\S]*?sm:text-sm[\s\S]*?text-2xl[\s\S]*?sm:text-3xl/,
  "Dashboard summary metrics should stay compact and two-column on mobile while retaining desktop scale",
);
assertDashboardMatches(
  /완료 확인[\s\S]*?dashboardNextActionQueueVerificationChecklist\.map[\s\S]*?data-testid="dashboard-next-action-queue-verification-copy"[\s\S]*?완료 확인 복사됨[\s\S]*?완료 확인 복사 실패[\s\S]*?완료 확인 복사[\s\S]*?data-testid="dashboard-next-action-queue-verification-studio"[\s\S]*?완료 확인 Studio로/,
  "Dashboard next-action queue should show, copy, and send a verification checklist to Studio in the panel",
);
assertDashboardMatches(
  /dashboardNextActionQueueManualCopy[\s\S]*?수동 복사용 Dashboard 다음 실행 큐 리포트/,
  "Dashboard next-action queue report should expose a manual copy fallback",
);
assertDashboardMatches(
  /function buildDashboardPersonalizationReportText\(\{[\s\S]*?baseUrl[\s\S]*?## Next personalization actions[\s\S]*?formatAbsoluteInternalHref\(item\.href, baseUrl\)[\s\S]*?## Learning operations actions[\s\S]*?formatAbsoluteInternalHref\(item\.href, baseUrl\)/,
  "Dashboard personalization report should use absolute links for personalization and Learning actions",
);
assertDashboardMatches(
  /function buildDashboardPersonalizationActionReportText\(\{[\s\S]*?baseUrl[\s\S]*?formatAbsoluteInternalHref\(action\.href, baseUrl\)[\s\S]*?Review link: \$\{actionHref\}[\s\S]*?buildDashboardPersonalizationReportText\(\{[\s\S]*?baseUrl/,
  "Dashboard personalization action reports should use absolute review links and context links",
);
assertDashboardMatches(
  /async function copyPersonalizationReport\(\)[\s\S]*?buildDashboardPersonalizationReportText\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?copyTextToClipboard\(reportText\)/,
  "Dashboard personalization report copy should use absolute links",
);
assertDashboardMatches(
  /function openPersonalizationReportInStudio\(\)[\s\S]*?const rawInput = buildDashboardPersonalizationStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-personalization"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setPersonalizationReportCopyStatus\("failed"\)[\s\S]*?setPersonalizationManualCopy\(\{[\s\S]*?title: "Dashboard 개인화 기준 리포트"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-personalization"\)/,
  "Dashboard personalization report Studio draft should keep manual fallback when draft storage fails",
);
assertDashboardMatches(
  /function openPersonalizationActionInStudio\([\s\S]*?action: LearningOpsAction[\s\S]*?fallbackTarget: "personalization" \| "next-action-queue"[\s\S]*?const rawInput = buildDashboardPersonalizationActionStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-personalization-action"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setPersonalizationActionCopyStatus\(\{[\s\S]*?status: "failed"[\s\S]*?title: `\$\{action\.label\} Studio 초안`[\s\S]*?setDashboardNextActionQueueManualCopy\(fallback\)[\s\S]*?setPersonalizationManualCopy\(fallback\)[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-personalization-action"\)/,
  "Dashboard personalization action Studio draft should use absolute action links and keep the right manual fallback when draft storage fails",
);
assertDashboardMatches(
  /function buildDashboardLearningOpsReportText\(\{[\s\S]*?baseUrl[\s\S]*?## 운영 점검 큐[\s\S]*?formatAbsoluteInternalHref\(item\.href, baseUrl\)[\s\S]*?## 권장 조치 큐[\s\S]*?formatAbsoluteInternalHref\(item\.href, baseUrl\)/,
  "Dashboard Learning operations report should use absolute links for review queues and actions",
);
assertDashboardMatches(
  /function buildDashboardLearningActionReportText\(\{[\s\S]*?baseUrl[\s\S]*?formatAbsoluteInternalHref\(action\.href, baseUrl\)[\s\S]*?Review link: \$\{actionHref\}[\s\S]*?buildDashboardLearningOpsReportText\(\{[\s\S]*?baseUrl/,
  "Dashboard Learning action reports should use absolute review links and context links",
);
assertDashboardMatches(
  /async function copyLearningOpsReport\(\)[\s\S]*?buildDashboardLearningOpsReportText\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?copyTextToClipboard/,
  "Dashboard Learning operations report copy should use absolute links",
);
assertDashboardMatches(
  /function openLearningOpsReportInStudio\(\)[\s\S]*?const rawInput = buildDashboardLearningOpsStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-learning-ops"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setLearningOpsReportCopyStatus\("failed"\)[\s\S]*?setLearningOpsManualCopy\(\{[\s\S]*?title: "Dashboard Learning 운영 리포트"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-learning-ops"\)/,
  "Dashboard Learning operations report Studio draft should keep manual fallback when draft storage fails",
);
assertDashboardMatches(
  /function openLearningOpsActionInStudio\([\s\S]*?action: LearningOpsAction[\s\S]*?fallbackTarget: "learning" \| "next-action-queue"[\s\S]*?const rawInput = buildDashboardLearningActionStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-learning-action"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setLearningOpsActionCopyStatus\(\{[\s\S]*?status: "failed"[\s\S]*?title: `\$\{action\.label\} Studio 초안`[\s\S]*?setDashboardNextActionQueueManualCopy\(fallback\)[\s\S]*?setLearningOpsManualCopy\(fallback\)[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-learning-action"\)/,
  "Dashboard Learning action Studio draft should use absolute action links and keep the right manual fallback when draft storage fails",
);
assertDashboardMatches(
  /function openMissingSourceMetadataQueueInStudio\(\)[\s\S]*?const rawInput = buildDashboardMissingSourceMetadataQueueStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-missing-source-metadata-queue"[\s\S]*?rawInput[\s\S]*?goal: "저장 출처 메타 없음 큐 운영 기준 정리"[\s\S]*?sourceTitle: "Dashboard 저장 출처 메타 없음 큐"[\s\S]*?sourceHref: studioPersistenceLibraryHref\("none"\)[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setMissingSourceMetadataQueueCopyStatus\("failed"\)[\s\S]*?setMissingSourceMetadataQueueManualCopy\(\{[\s\S]*?title: "Dashboard 저장 출처 메타 없음 큐"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-missing-source-metadata-queue"\)/,
  "Dashboard missing saved-source metadata queue should open as the dedicated queue Studio source and keep manual fallback when draft storage fails",
);
assertDashboardMatches(
  /openStudioSourceOpsReportInStudio[\s\S]*?Studio 저장 출처[\s\S]*?studioSourceSummary\.map/,
  "Dashboard Studio source breakdown heading should use saved-source wording",
);
assertDashboardMatches(
  /Studio 저장 출처[\s\S]*?onClick=\{copyStudioSourceOpsReport\}[\s\S]*?studioSourceOpsReportCopyStatus === "copied"[\s\S]*?복사됨[\s\S]*?openStudioSourceOpsReportInStudio/,
  "Dashboard Studio source breakdown should expose report copy before the Studio draft action",
);
assertDashboardMatches(
  /interface StudioSourceSummaryItem \{[\s\S]*?sourceExamples: \{[\s\S]*?href: string;[\s\S]*?originalActionLabel\?: string;[\s\S]*?originalHref\?: string;[\s\S]*?title: string;/,
  "Dashboard Studio source summary item should retain original source link metadata for representative saved prompts",
);
assertDashboardMatches(
  /const sourceExamples = prompts\.reduce[\s\S]*?const originalHref = normalizeInternalHref\([\s\S]*?prompt\.studioSource\?\.sourceHref[\s\S]*?const originalActionLabel = prompt\.studioSource[\s\S]*?getStudioDraftDisplaySourceLabel\(prompt\.studioSource\)[\s\S]*?sourceActionLabel[\s\S]*?href: promptDetailLibraryHref\(prompt\.id\)[\s\S]*?originalActionLabel,[\s\S]*?originalHref,[\s\S]*?title: sourceTitle/,
  "Dashboard Studio source summary should collect representative saved prompt detail links and original source links",
);
assertDashboardMatches(
  /const sourceVariantCounts = prompts\.reduce[\s\S]*?studioSource\?\.sourceVariant[\s\S]*?getStudioDraftDisplaySourceLabel\(studioSource\)\.label[\s\S]*?sourceVariantLinks = Object\.entries[\s\S]*?studioSourceLibraryHref\(\{[\s\S]*?source,[\s\S]*?sourceVariant:[\s\S]*?sourceVariantLabels = sourceVariantLinks\.map[\s\S]*?sourceExamples: sourceExamples\[source\] \?\? \[\][\s\S]*?sourceTitles: sourceTitles\[source\] \?\? \[\][\s\S]*?sourceVariantLabels,[\s\S]*?sourceVariantLinks/,
  "Dashboard Studio source summary should collect representative titles and sourceVariant labels/links per source",
);
assertDashboardMatches(
  /const missingSourceMetadataSummary = studioPersistenceSummary\.find[\s\S]*?href=\{studioPersistenceLibraryHref\("none"\)\}[\s\S]*?data-testid="dashboard-missing-source-metadata-queue"[\s\S]*?저장 출처 메타 없음 큐[\s\S]*?missingSourceMetadataSummary\?\.count \?\? 0[\s\S]*?data-testid="dashboard-missing-source-metadata-queue-studio"[\s\S]*?onClick=\{openMissingSourceMetadataQueueInStudio\}[\s\S]*?큐 운영 기준 Studio로/,
  "Dashboard should expose a direct missing saved-source metadata queue link and Studio draft action",
);
assertDashboardMatches(
  /data-testid="dashboard-missing-source-metadata-queue-copy"[\s\S]*?onClick=\{copyMissingSourceMetadataQueuePrompt\}[\s\S]*?missingSourceMetadataQueueCopyStatus === "copied"[\s\S]*?복사됨[\s\S]*?큐 프롬프트 복사[\s\S]*?data-testid="dashboard-missing-source-metadata-queue-studio"/,
  "Dashboard should expose a copy action for the missing saved-source metadata queue prompt before the Studio action",
);
assertDashboardMatches(
  /data-testid="dashboard-missing-source-metadata-queue-link-copy"[\s\S]*?onClick=\{copyMissingSourceMetadataQueueLink\}[\s\S]*?missingSourceMetadataQueueLinkCopyStatus === "copied"[\s\S]*?복사됨[\s\S]*?큐 링크 복사[\s\S]*?data-testid="dashboard-missing-source-metadata-queue-copy"/,
  "Dashboard should expose a copy action for the missing saved-source metadata queue link before prompt and Studio actions",
);
assertDashboardMatches(
  /data-testid="dashboard-studio-persistence-all-link-copy"[\s\S]*?onClick=\{copyStudioPersistenceAllLink\}[\s\S]*?studioPersistenceAllLinkCopyStatus === "copied"[\s\S]*?전체 링크 복사됨[\s\S]*?<Link[\s\S]*?href="\/library"[\s\S]*?전체 보기/,
  "Dashboard Studio persistence heading should expose an all-link copy action before the all navigation link",
);
assertDashboardMatches(
  /studioPersistenceSummary\.map\(\(item\) =>[\s\S]*?href=\{studioPersistenceLibraryHref\(item\.mode\)\}[\s\S]*?보기[\s\S]*?data-testid="dashboard-studio-persistence-link-copy"[\s\S]*?onClick=\{\(\) => copyStudioPersistenceLink\(item\)\}[\s\S]*?studioPersistenceLinkCopyStatus\?\.key === item\.mode[\s\S]*?링크 복사됨[\s\S]*?링크 복사/,
  "Dashboard Studio persistence cards should expose view and per-mode link copy actions without nested links",
);
assertDashboardMatches(
  /data-testid="dashboard-source-health-link-copy"[\s\S]*?onClick=\{\(\) => copySourceHealthLink\(item\)\}[\s\S]*?sourceHealthLinkCopyStatus\?\.key === item\.key[\s\S]*?링크 복사됨[\s\S]*?링크 복사/,
  "Dashboard source-health summary links should expose absolute link copy actions",
);
assertDashboardMatches(
  /data-testid="dashboard-source-health-reasons"[\s\S]*?sourceHealthReasonHref = improvementLibraryHref[\s\S]*?sourceReason: item\.reason[\s\S]*?data-testid="dashboard-source-health-reason-link-copy"[\s\S]*?copySourceHealthLink\(\{[\s\S]*?href: sourceHealthReasonHref[\s\S]*?key: sourceHealthReasonKey[\s\S]*?출처 상태 사유 링크/,
  "Dashboard source-health reason cards should expose per-reason absolute link copy actions",
);
assertDashboardMatches(
  /sourceHealthPreviewIssues\.map\(\(issue\) =>[\s\S]*?candidateDetailHref = promptDetailLibraryHref\([\s\S]*?candidateDetailLinkKey = `\$\{candidateKey\}-detail-link`[\s\S]*?href=\{candidateDetailHref\}[\s\S]*?copySourceHealthLink\(\{[\s\S]*?href: candidateDetailHref[\s\S]*?key: candidateDetailLinkKey[\s\S]*?출처 상태 후보 상세 링크[\s\S]*?data-testid="dashboard-source-health-candidate-link-copy"/,
  "Dashboard source-health candidate cards should expose absolute detail link copy actions",
);
assertDashboardMatches(
  /studioSourceSummary\.map\(\(item\)[\s\S]*?<div[\s\S]*?key=\{item\.source\}[\s\S]*?<Link[\s\S]*?href=\{studioSourceLibraryHref\(\{ source: item\.source \}\)\}[\s\S]*?item\.nextAction[\s\S]*?item\.sourceTitles\.length[\s\S]*?대표 출처 · \{item\.sourceTitles\.join\(", "\)\}[\s\S]*?item\.sourceVariantLinks\.length[\s\S]*?item\.sourceVariantLinks\.map\(\(variant\)[\s\S]*?href=\{variant\.href\}[\s\S]*?\{variant\.label\} \{variant\.count\}개[\s\S]*?data-testid="dashboard-studio-source-variant-filter-link-copy"[\s\S]*?copyStudioSourceVariantFilterLink\(\{[\s\S]*?href: variant\.href[\s\S]*?sourceVariant: variant\.sourceVariant[\s\S]*?복사됨[\s\S]*?item\.sourceExamples\.length[\s\S]*?item\.sourceExamples\.slice\(0, 2\)\.map\(\(example\)[\s\S]*?href=\{example\.href\}[\s\S]*?\{example\.title\}[\s\S]*?copyStudioSourceExampleLink\(\{[\s\S]*?\.\.\.example[\s\S]*?linkLabel: "대표 저장본 상세"[\s\S]*?example\.originalHref[\s\S]*?href=\{example\.originalHref\}[\s\S]*?\{example\.originalActionLabel \?\? "원본"\}[\s\S]*?copyStudioSourceExampleLink\(\{[\s\S]*?href: example\.originalHref[\s\S]*?linkLabel:[\s\S]*?example\.originalActionLabel \?\?[\s\S]*?"원본 경로"[\s\S]*?originalHref: example\.originalHref[\s\S]*?title: example\.title[\s\S]*?원본 복사[\s\S]*?item\.count >[\s\S]*?Math\.min\(item\.sourceExamples\.length, 2\)[\s\S]*?item\.count -[\s\S]*?Math\.min\(item\.sourceExamples\.length, 2\)/,
  "Dashboard Studio source cards should show linked/copied variant filters, representative saved-source titles, detail links, original source links/copy actions, and actual remaining counts without nested links",
);
assertDashboardMatches(
  /async function copyStudioSourceExampleLink\(\{[\s\S]*?href,[\s\S]*?linkLabel = "대표 저장본 상세"[\s\S]*?originalHref,[\s\S]*?title,[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?const absoluteOriginalHref = originalHref[\s\S]*?const manualCopyBody = \[[\s\S]*?`- 출처 제목: \$\{title\}`[\s\S]*?`- 링크 유형: \$\{linkLabel\}`[\s\S]*?`- 원본 경로: \$\{absoluteOriginalHref\}`[\s\S]*?copyTextToClipboard\(absoluteHref\)[\s\S]*?setStudioSourceExampleLinkCopyStatus[\s\S]*?body: manualCopyBody/,
  "Dashboard representative saved-source and original links should copy absolute internal links with source-title/original-path fallback metadata",
);
assertDashboardMatches(
  /async function copyStudioSourceFilterLink\(\{[\s\S]*?source: PromptStudioDraftSource[\s\S]*?const href = studioSourceLibraryHref\(\{ source \}\)[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?copyTextToClipboard\(absoluteHref\)[\s\S]*?setStudioSourceFilterLinkCopyStatus[\s\S]*?Studio 저장 출처 필터 링크/,
  "Dashboard Studio source filter links should copy absolute internal links with fallback metadata",
);
assertDashboardMatches(
  /async function copyStudioSourceVariantFilterLink\(\{[\s\S]*?sourceVariant: PromptStudioDraftSourceVariant[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?const key = `\$\{source\}:\$\{sourceVariant\}`[\s\S]*?copyTextToClipboard\(absoluteHref\)[\s\S]*?setStudioSourceFilterLinkCopyStatus[\s\S]*?Studio 세부 초안 유형 필터 링크/,
  "Dashboard Studio sourceVariant filter links should copy absolute internal links with fallback metadata",
);
assertDashboardMatches(
  /async function copyStudioSourceAllFilterLink\(\)[\s\S]*?const href = studioSourceLibraryHref\(\)[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?copyTextToClipboard\(absoluteHref\)[\s\S]*?setStudioSourceAllFilterLinkCopyStatus[\s\S]*?Studio 저장 출처 전체 필터 링크/,
  "Dashboard Studio source all-filter link should copy as an absolute internal link with fallback metadata",
);
assertDashboardMatches(
  /function buildDashboardSkillOpsReportText\(\{[\s\S]*?baseUrl[\s\S]*?stats: SkillRunStats[\s\S]*?const formatSkillOpsHref = \(href: string\) =>[\s\S]*?formatAbsoluteInternalHref\(href, baseUrl\)[\s\S]*?# 스킬 운영 리포트[\s\S]*?최근 실행:[\s\S]*?formatSkillOpsHref\(buildPromptLibraryHref\(stats\.latestRun\)\)[\s\S]*?## 반복 사용 상위 스킬[\s\S]*?formatSkillOpsHref\(buildSkillHref\(item\.skill\.id\)\)[\s\S]*?## 개선 필요 큐[\s\S]*?formatSkillOpsHref\(buildSkillHref\(item\.skill\.id\)\)/,
  "Dashboard skill ops report should include absolute-ready latest-run Library links and Skills queue links",
);
assertDashboardMatches(
  /function buildDashboardSkillOpsStudioPrompt\(\{[\s\S]*?baseUrl[\s\S]*?stats: SkillRunStats[\s\S]*?Use the Library and Skills links in the report as the operating queues[\s\S]*?buildDashboardSkillOpsReportText\(\{ baseUrl, stats \}\)/,
  "Dashboard skill ops Studio prompt should reuse the absolute-link report as operating queues",
);
assertDashboardMatches(
  /async function copySkillOpsReport\(\)[\s\S]*?buildDashboardSkillOpsReportText\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?stats: skillRunStats[\s\S]*?copyTextToClipboard\(reportText\)/,
  "Dashboard skill ops report copy should include absolute report links",
);
assertDashboardMatches(
  /function openSkillOpsReportInStudio\(\)[\s\S]*?const rawInput = buildDashboardSkillOpsStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?stats: skillRunStats[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-skill-ops"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setSkillOpsReportCopyStatus\("failed"\)[\s\S]*?setSkillOpsManualCopy\(\{[\s\S]*?title: "Dashboard 스킬 운영 리포트"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-skill-ops"\)/,
  "Dashboard skill ops Studio draft should include absolute report links and keep manual fallback when draft storage fails",
);
assertDashboardMatches(
  /async function copySkillOpsLatestRunLink\(\)[\s\S]*?skillRunStats\.latestRun[\s\S]*?buildPromptLibraryHref\(skillRunStats\.latestRun\)[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?copyTextToClipboard\(absoluteHref\)[\s\S]*?setSkillOpsLatestRunLinkCopyStatus[\s\S]*?최근 스킬 실행 Library 링크/,
  "Dashboard skill ops latest run should copy an absolute Library link with fallback metadata",
);
assertDashboardMatches(
  /async function copySkillOpsSkillLink\(\{[\s\S]*?key[\s\S]*?skillId[\s\S]*?title[\s\S]*?const href = buildSkillHref\(skillId\)[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?copyTextToClipboard\(absoluteHref\)[\s\S]*?setSkillOpsSkillLinkCopyStatus[\s\S]*?setSkillOpsManualCopy/,
  "Dashboard skill ops skill links should copy absolute Skills links with fallback metadata",
);
assertDashboardMatches(
  /스킬 실행 현황[\s\S]*?최근 실행[\s\S]*?href=\{buildPromptLibraryHref\(skillRunStats\.latestRun\)\}[\s\S]*?Library 실행 보기[\s\S]*?data-testid="dashboard-skill-latest-run-link-copy"[\s\S]*?실행 링크 복사됨[\s\S]*?실행 링크 복사 실패[\s\S]*?실행 링크 복사/,
  "Dashboard skill ops latest run card should expose Library navigation and link copy actions",
);
assertDashboardMatches(
  /skillRunStats\.topSkills\.map\(\(item\) => \{[\s\S]*?skillLinkKey = `top-\$\{item\.skill\.id\}`[\s\S]*?href=\{buildSkillHref\(item\.skill\.id\)\}[\s\S]*?Skills 보기[\s\S]*?copySkillOpsSkillLink\(\{[\s\S]*?key: skillLinkKey[\s\S]*?skillId: item\.skill\.id[\s\S]*?반복 사용 상위 스킬 링크[\s\S]*?data-testid="dashboard-skill-top-link-copy"[\s\S]*?링크 복사됨[\s\S]*?링크 복사/,
  "Dashboard top skill rows should expose Skills navigation and absolute link copy actions",
);
assertDashboardMatches(
  /skillRunStats\.improvementQueue\.slice\(0, 3\)\.map\(\(item\) => \{[\s\S]*?skillLinkKey = `improvement-\$\{item\.skill\.id\}`[\s\S]*?href=\{buildSkillHref\(item\.skill\.id\)\}[\s\S]*?Skills 보기[\s\S]*?copySkillOpsSkillLink\(\{[\s\S]*?key: skillLinkKey[\s\S]*?skillId: item\.skill\.id[\s\S]*?개선 대기 스킬 링크[\s\S]*?data-testid="dashboard-skill-improvement-link-copy"[\s\S]*?링크 복사됨[\s\S]*?링크 복사/,
  "Dashboard improvement queue rows should expose Skills navigation and absolute link copy actions",
);
assertDashboardMatches(
  /data-testid="dashboard-studio-source-all-filter-link-copy"[\s\S]*?onClick=\{copyStudioSourceAllFilterLink\}[\s\S]*?studioSourceAllFilterLinkCopyStatus === "copied"[\s\S]*?전체 링크 복사됨[\s\S]*?<Link[\s\S]*?href=\{studioSourceLibraryHref\(\)\}[\s\S]*?전체/,
  "Dashboard Studio source heading should expose an all-filter link copy action before the all-filter navigation link",
);
assertDashboardMatches(
  /data-testid="dashboard-studio-source-filter-link-copy"[\s\S]*?onClick=\{\(\) => copyStudioSourceFilterLink\(item\)\}[\s\S]*?studioSourceFilterLinkCopyStatus\?\.key ===[\s\S]*?item\.source[\s\S]*?필터 링크 복사됨[\s\S]*?필터 링크 복사/,
  "Dashboard Studio source cards should expose per-source filter link copy actions",
);
assertDashboardMatches(
  /studioSourceExampleManualCopy[\s\S]*?수동 복사용 대표 저장본 링크/,
  "Dashboard representative saved-source detail links should expose a manual copy fallback",
);
assertDashboardMatches(
  /studioPersistenceManualCopy[\s\S]*?수동 복사용 Studio 저장 방식 링크/,
  "Dashboard Studio persistence links should expose a manual copy fallback",
);
assertDashboardMatches(
  /studioSourceFilterManualCopy[\s\S]*?수동 복사용 Studio 저장 출처 필터 링크/,
  "Dashboard Studio source filter links should expose a manual copy fallback",
);
assertDashboardMatches(
  /sourceHealthManualCopy[\s\S]*?수동 복사용 개선 출처 상태 조치 계획 또는 링크/,
  "Dashboard source-health links should share the source-health manual copy fallback",
);
assertDashboardMatches(
  /skillOpsManualCopy[\s\S]*?수동 복사용 스킬 운영 리포트 또는 링크/,
  "Dashboard skill ops report and latest run links should share a manual copy fallback",
);
assertDashboardMatches(
  /studioSourceOpsManualCopy[\s\S]*?수동 복사용 Studio 저장 출처 운영 리포트/,
  "Dashboard Studio source ops report should expose a manual copy fallback",
);
assertDashboardMatches(
  /missingSourceMetadataQueueManualCopy[\s\S]*?수동 복사용 저장 출처 메타 없음 큐 운영 프롬프트/,
  "Dashboard missing saved-source metadata queue prompt should expose a manual copy fallback",
);

assertFileIncludes(
  sourceRegistrySource,
  'dashboardLabel: "Dashboard 저장 출처 운영"',
  "Source registry should use saved-source wording for the Dashboard source ops dashboard label",
);
assertFileIncludes(
  sourceRegistrySource,
  'dashboardDescription: "Studio 저장 출처 운영 리포트에서 저장됨"',
  "Source registry should use saved-source wording for the Dashboard source ops description",
);
assertFileIncludes(
  sourceRegistrySource,
  'librarySourceLabel: "Dashboard Studio 저장 출처 운영"',
  "Source registry should use saved-source wording for the Dashboard source ops Library label",
);
assertFileIncludes(
  sourceRegistrySource,
  'studioLabel: "Dashboard Studio 저장 출처 운영"',
  "Source registry should use saved-source wording for the Dashboard source ops Studio label",
);
assertFileIncludes(
  sourceRegistrySource,
  'sourceActionLabel: "Dashboard로 돌아가기"',
  "Source registry should expose the Dashboard return action label",
);
assertFileIncludes(
  sourceRegistrySource,
  "Studio 저장 출처별 저장본을 점검",
  "Source registry should describe Dashboard source ops as saved-source review work",
);
assertFileIncludes(
  sourceRegistrySource,
  'dashboardLabel: "Skills 개선 계획"',
  "Source registry should expose Skills improvement plan in Dashboard saved-source breakdown",
);
assertFileIncludes(
  sourceRegistrySource,
  'libraryFilterLabel: "Skills 개선 계획"',
  "Source registry should expose Skills improvement plan as a Library saved-source filter",
);
assertFileIncludes(
  sourceRegistrySource,
  'sourceActionLabel: "Skills 스킬로 돌아가기"',
  "Source registry should preserve a Skills return action for Skills improvement plan drafts",
);
assertFileIncludes(
  sourceRegistrySource,
  'dashboardLabel: "Library 저장 출처 메타 없음 큐"',
  "Source registry should expose missing saved-source metadata queue saves as a separate Dashboard source category",
);
assertFileIncludes(
  sourceRegistrySource,
  "저장 출처 메타 없음 저장본의 유지 또는 추적 가능한 Studio 흐름 재저장 기준 확인",
  "Source registry should describe the queue next action as missing saved-source metadata review work",
);
assertFileIncludes(
  sourceRegistrySource,
  'dashboardLabel: "Library 저장 출처 메타 없음 후보"',
  "Source registry should expose missing saved-source metadata candidate saves as a separate Dashboard source category",
);
assertFileIncludes(
  sourceRegistrySource,
  '"dashboard-source-health-candidate"',
  "Source registry should expose Dashboard source-health candidate drafts",
);
assertFileIncludes(
  sourceRegistrySource,
  'sourceActionLabel: "Library 후보로 돌아가기"',
  "Source registry should expose the Library candidate return action label",
);
assertFileIncludes(
  sourceRegistrySource,
  "저장 출처 메타 없음 후보의 유지 또는 재저장 기준 확인",
  "Source registry should describe the candidate next action as missing saved-source metadata review work",
);

assertFileIncludes(
  readme,
  "Dashboard Studio 저장 출처 breakdown",
  "README feature scope should document Dashboard saved-source breakdown wording",
);
assertFileIncludes(
  readme,
  "sourceVariant 세부 유형 count",
  "README should document Dashboard Studio source breakdown variant counts",
);
assertFileIncludes(
  readme,
  "`Studio 저장 출처` breakdown",
  "README detailed flow should document Dashboard saved-source breakdown wording",
);
assertFileIncludes(
  readme,
  "`Studio 저장 출처` 필터",
  "README detailed flow should document Library saved-source filter wording",
);
assertFileIncludes(
  readme,
  "Studio 저장 출처 카드",
  "README should document saved-source card wording across Studio and Library flows",
);
assertFileIncludes(
  readme,
  "Studio 저장 출처 정보로만 보존",
  "README should document saved-source information wording for operational-source saves",
);
assertFileIncludes(
  readme,
  "저장 출처 없음 메모",
  "README should document saved-source missing metadata note wording",
);
assertFileIncludes(
  readme,
  "Studio 출처 없음 설명은 저장 출처 메타 없음 항목의 유지 또는 재저장 기준 점검",
  "README should document Dashboard guidance for missing saved-source metadata persistence",
);
assertFileIncludes(
  readme,
  "`Studio 저장 방식` 요약에서 전체 Library 또는 개선 체인, 운영 출처, Studio 출처 없음 count를 바로 보고 해당 Library 필터로 이동하거나 조건 링크를 절대 URL로 복사",
  "README should document Dashboard Studio persistence all-link and per-mode link copy actions",
);
assertFileIncludes(
  readme,
  "저장 출처 메타 없음 큐",
  "README should document Dashboard source ops missing saved-source metadata queue",
);
assertFileIncludes(
  readme,
  "Dashboard의 Studio 저장 방식 패널은 저장 출처 메타 없음 큐를 별도 링크로 노출",
  "README should document the Dashboard direct missing saved-source metadata queue link",
);
assertFileIncludes(
  readme,
  "Dashboard 오늘의 실행 요약은 첫 실행 항목, 생성 상태, 저장 검증 위치를 첫 화면 상단에서 한 줄로 정리해 바로 이동하게 합니다.",
  "README should document the Dashboard execution summary",
);
assertFileIncludes(
  readme,
  "Dashboard 핵심 workflow는 작성, 저장, 학습, 스킬화, 연결, 백업 6단계를 상단에서 보여주고 연결 단계에서 Chrome, MCP, 외부 AI 전달 흐름으로 바로 이동하게 합니다.",
  "README should document the Dashboard workflow shortcuts including Integrations",
);
assertFileIncludes(
  readme,
  "Dashboard 상단 KPI는 모바일 2열 요약과 데스크톱 8열 요약을 유지해 저장본, 품질, 학습, 스킬, 재개선 상태를 짧게 훑게 합니다.",
  "README should document the compact responsive Dashboard KPI summary",
);
assertFileIncludes(
  readme,
  "`큐 링크 목록 복사`는 전체 큐의 절대 URL만 가볍게 내보내고",
  "README should document Dashboard next-action queue item link copy actions",
);
assertFileIncludes(
  readme,
  "High/Med/Low 개수",
  "README should document Dashboard next-action queue priority counts",
);
assertFileIncludes(
  readme,
  "개인화/학습 개수",
  "README should document Dashboard next-action queue category counts",
);
assertFileIncludes(
  readme,
  "첫 실행 항목",
  "README should document Dashboard next-action queue first action",
);
assertFileIncludes(
  readme,
  "첫 실행 바로 열기/링크 복사/Studio 전송/리포트 복사",
  "README should document Dashboard next-action queue first-action shortcuts",
);
assertFileIncludes(
  readme,
  "Dashboard 다음 실행 큐는 `01 첫 실행`, `02 실행 계획`, `03 완료 확인` 단계 카드로 우선 항목 처리, 큐 실행 계획, 완료 증거 확인 순서를 먼저 보여줍니다.",
  "README should document the numbered Dashboard next-action workflow cards",
);
assertFileIncludes(
  readme,
  "같은 큐 패널 하단에 수동 복사용 Markdown textarea",
  "README should document Dashboard next-action queue local manual copy fallback",
);
assertFileIncludes(
  readme,
  "완료 후 검증 체크리스트",
  "README should document Dashboard next-action queue verification checklist",
);
assertFileIncludes(
  readme,
  "완료 확인 체크리스트",
  "README should document Dashboard next-action queue visible verification checklist",
);
assertFileIncludes(
  readme,
  "완료 확인 체크리스트만 별도 Markdown으로 복사",
  "README should document Dashboard next-action queue verification-only copy",
);
assertFileIncludes(
  readme,
  "Studio 완료 확인 계획",
  "README should document Dashboard next-action queue verification Studio plan",
);
assertFileIncludes(
  readme,
  "`완료 확인 Studio로`",
  "README should document Dashboard next-action queue verification Studio action",
);
assertFileIncludes(
  readme,
  "`dashboard-next-action-queue-verification` sourceVariant",
  "README should document Dashboard next-action queue verification source variant tracking",
);
assertFileIncludes(
  readme,
  "링크/리포트/완료 확인 복사가 clipboard 제한으로 실패하면",
  "README should document Dashboard next-action queue verification copy fallback",
);
assertFileIncludes(
  readme,
  "Dashboard 개인화, 다음 실행 큐, Learning 운영 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 원래 Dashboard 맥락을 복원하며, 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시합니다.",
  "README should document Dashboard top operations Studio draft return action and fallback",
);
assertFileIncludes(
  readme,
  "Dashboard의 스킬 운영, 피드백 반영 개선, Studio 저장 출처, 저장 출처 메타 없음 큐, 개선 출처 상태 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 Dashboard 맥락을 복원하고, 개선 출처 후보 초안은 `Library 후보로 돌아가기` 복귀 액션 라벨로 대표 후보를 복원하며, 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시합니다.",
  "README should document Dashboard improvement/source operations Studio draft return actions and fallback",
);
assertFileIncludes(
  readme,
  "개인 프로필, 회사 프로필, 학습 scope coverage, 다음 보강 액션을 절대 URL 링크가 포함된 Markdown",
  "README should document Dashboard personalization reports with absolute links",
);
assertFileIncludes(
  readme,
  "`학습 운영 리포트 복사`는 전체 학습 메모리, 학습 메타 보존 프롬프트, 운영 점검 큐, 권장 조치 큐, scope별 현황을 절대 URL 링크가 포함된 Markdown",
  "README should document Dashboard Learning reports with absolute links",
);
assertFileIncludes(
  sourceRegistrySource,
  'dashboardLabel: "Dashboard 다음 실행 큐"',
  "Source registry should expose Dashboard next-action queue drafts",
);
assertFileIncludes(
  sourceRegistrySource,
  'sourceActionLabel: "Dashboard로 돌아가기"',
  "Source registry should expose Dashboard return action labels for top operations drafts",
);
assertFileIncludes(
  sourceRegistrySource,
  "개인화와 Learning 액션을 한 번에 정리",
  "Source registry should describe Dashboard next-action queue execution planning",
);
assertFileIncludes(
  promptTypesSource,
  '"dashboard-next-action-queue-verification"',
  "Prompt types should expose a Dashboard next-action queue verification source variant",
);
assertFileIncludes(
  draftVariantsSource,
  '"dashboard-next-action-queue-verification":',
  "Draft variant rules should include the Dashboard next-action queue verification variant",
);
assertFileIncludes(
  draftVariantsSource,
  'allowedSources: ["dashboard-next-action-queue"]',
  "Dashboard next-action queue verification variant should only be allowed for the Dashboard next-action queue source",
);
assertFileIncludes(
  draftVariantsSource,
  "requiresSourceFeedback: false",
  "Dashboard next-action queue verification variant should not require source feedback",
);
assertFileIncludes(
  draftDisplaySource,
  'label: "Dashboard 다음 실행 큐 완료 확인"',
  "Draft display should label Dashboard next-action queue verification drafts distinctly",
);
assertFileIncludes(
  draftDisplaySource,
  "완료된 개인화와 Learning 액션의 증거",
  "Draft display should explain the Dashboard next-action queue verification next action",
);
assertFileIncludes(
  prdSource,
  "Dashboard의 Studio 저장 출처 breakdown",
  "PRD should use saved-source wording for Dashboard Studio source operations",
);
assertFileIncludes(
  prdSource,
  "Skills 개선 계획 source",
  "PRD should document that Dashboard Studio source breakdown includes Skills improvement plan sources",
);
assertFileIncludes(
  prdSource,
  "`큐 링크 목록 복사`는 전체 큐의 절대 URL만 가볍게 내보내고",
  "PRD should document Dashboard next-action queue item link copy actions",
);
assertFileIncludes(
  prdSource,
  "High/Med/Low 개수",
  "PRD should document Dashboard next-action queue priority counts",
);
assertFileIncludes(
  prdSource,
  "개인화/학습 개수",
  "PRD should document Dashboard next-action queue category counts",
);
assertFileIncludes(
  prdSource,
  "첫 실행 항목",
  "PRD should document Dashboard next-action queue first action",
);
assertFileIncludes(
  prdSource,
  "첫 실행 절대 URL",
  "PRD should document Dashboard next-action queue first-action absolute URL",
);
assertFileIncludes(
  prdSource,
  "첫 실행 항목을 원본 화면으로 바로 열거나 절대 URL 링크로 복사하거나 Studio 초안 또는 단일 조치 리포트로 전환할 수 있어야 한다",
  "PRD should document Dashboard next-action queue first-action shortcuts",
);
assertFileIncludes(
  prdSource,
  "Dashboard 다음 실행 큐는 `01 첫 실행`, `02 실행 계획`, `03 완료 확인` 단계 카드로 우선 항목 처리, 큐 실행 계획, 완료 증거 확인 순서를 먼저 보여줘야 한다.",
  "PRD should document the numbered Dashboard next-action workflow cards",
);
assertFileIncludes(
  prdSource,
  "Dashboard 오늘의 실행 요약은 첫 실행 항목, 생성 상태, 저장 검증 위치를 첫 화면 상단에서 한 줄로 정리해 바로 이동하게 해야 한다.",
  "PRD should document the Dashboard execution summary",
);
assertFileIncludes(
  prdSource,
  "Dashboard 핵심 workflow는 작성, 저장, 학습, 스킬화, 연결, 백업 6단계를 상단에서 보여주고 연결 단계에서 Chrome, MCP, 외부 AI 전달 흐름으로 바로 이동하게 해야 한다.",
  "PRD should document the Dashboard workflow shortcuts including Integrations",
);
assertFileIncludes(
  prdSource,
  "Dashboard 스킬 운영, 피드백 반영 개선, Studio 저장 출처, 저장 출처 메타 없음 큐, 개선 출처 상태 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 Dashboard 맥락을 복원하고, 개선 출처 후보 초안은 `Library 후보로 돌아가기` 복귀 액션 라벨로 대표 후보를 복원해야 하며, 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시해야 한다.",
  "PRD should document Dashboard improvement/source operations Studio draft return actions and fallback",
);
assertFileIncludes(
  developmentBrief,
  "작성, 저장, 학습, 스킬화, 연결, 백업 6단계 핵심 workflow와 Integrations 이동 액션",
  "Development brief should document the Dashboard workflow shortcuts including Integrations",
);
assertFileIncludes(
  developmentBrief,
  "Dashboard 다음 실행 큐는 `01 첫 실행`, `02 실행 계획`, `03 완료 확인` 단계 카드로 우선 항목 처리, 큐 실행 계획, 완료 증거 확인 순서를 먼저 보여줌",
  "Development brief should document the numbered Dashboard next-action workflow cards",
);
assertFileIncludes(
  developmentBrief,
  "Dashboard 개인화, 다음 실행 큐, Learning 운영 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 원래 Dashboard 맥락을 복원하며, 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시함",
  "Development brief should document Dashboard top operations Studio draft return action and fallback",
);
assertFileIncludes(
  developmentBrief,
  "Dashboard 스킬 운영, 피드백 반영 개선, Studio 저장 출처, 저장 출처 메타 없음 큐, 개선 출처 상태 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 Dashboard 맥락을 복원하고, 개선 출처 후보 초안은 `Library 후보로 돌아가기` 복귀 액션 라벨로 대표 후보를 복원하며, 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시함",
  "Development brief should document Dashboard improvement/source operations Studio draft return actions and fallback",
);

const staleDashboardImprovementDraftFallback =
  "Dashboard 스킬 운영, 피드백 반영 개선, Studio 저장 출처, 저장 출처 메타 없음 큐, 개선 출처 상태 Studio 초안 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시";
const staleDashboardTopOperationsDraftFallback =
  "Dashboard 개인화, 다음 실행 큐, Learning 운영 Studio 초안 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시";

assertFileNotIncludes(
  readme,
  `Dashboard의 스킬 운영, 피드백 반영 개선, Studio 저장 출처, 저장 출처 메타 없음 큐, 개선 출처 상태 Studio 초안 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시합니다.`,
  "README should not keep the Dashboard improvement/source fallback-only Studio draft contract",
);
assertFileNotIncludes(
  prdSource,
  `${staleDashboardImprovementDraftFallback}해야 한다.`,
  "PRD should not keep the Dashboard improvement/source fallback-only Studio draft contract",
);
assertFileNotIncludes(
  developmentBrief,
  `${staleDashboardImprovementDraftFallback}함`,
  "Development brief should not keep the Dashboard improvement/source fallback-only Studio draft contract",
);
assertFileNotIncludes(
  readme,
  `${staleDashboardTopOperationsDraftFallback}합니다.`,
  "README should not keep the Dashboard top operations fallback-only Studio draft contract",
);
assertFileNotIncludes(
  developmentBrief,
  `${staleDashboardTopOperationsDraftFallback}함`,
  "Development brief should not keep the Dashboard top operations fallback-only Studio draft contract",
);
assertFileNotIncludes(
  prdSource,
  "다음 실행 큐 Studio 초안 저장이 실패해도 이동하지 않고 같은 큐 패널 하단에 원문 textarea를 표시해야 한다.",
  "PRD should not keep the Dashboard next-action fallback-only Studio draft contract",
);
assertFileNotIncludes(
  prdSource,
  "Dashboard의 `개인화 기준 리포트 복사`는 개인 프로필, 회사 프로필, 학습 scope coverage, 다음 보강 액션을 절대 URL 링크가 포함된 Markdown으로 내보내 외부 AI 도구나 운영 리뷰에 전달할 수 있게 한다. `리포트 Studio로 보내기`는 같은 리포트를 개인화 기준 개선 계획 초안으로 열어 프로필 보강, 메모리 후보, 측정 체크를 바로 설계할 수 있게 한다. 복사 실패나 Studio 초안 저장 실패 시 수동 복사용 textarea를 표시하고 이동하지 않는다.",
  "PRD should not keep the Dashboard personalization fallback-only Studio draft contract",
);
assertFileNotIncludes(
  prdSource,
  "Learning 운영 Studio 초안 저장이 실패하면 이동하지 않고 해당 원문을 수동 복사용 textarea로 표시해야 한다.",
  "PRD should not keep the Dashboard Learning operations fallback-only Studio draft contract",
);
assertFileIncludes(
  prdSource,
  "Dashboard 상단 KPI는 모바일 2열 요약과 데스크톱 8열 요약을 유지해 저장본, 품질, 학습, 스킬, 재개선 상태를 짧게 훑게 해야 한다.",
  "PRD should document the compact responsive Dashboard KPI summary",
);
assertFileIncludes(
  prdSource,
  "같은 큐 패널 하단에 수동 복사용 Markdown textarea",
  "PRD should document Dashboard next-action queue local manual copy fallback",
);
assertFileIncludes(
  prdSource,
  "완료 후 검증 체크리스트",
  "PRD should document Dashboard next-action queue verification checklist",
);
assertFileIncludes(
  prdSource,
  "완료 확인 체크리스트",
  "PRD should document Dashboard next-action queue visible verification checklist",
);
assertFileIncludes(
  prdSource,
  "완료 확인 체크리스트만 별도 Markdown으로 복사",
  "PRD should document Dashboard next-action queue verification-only copy",
);
assertFileIncludes(
  prdSource,
  "Studio 완료 확인 계획",
  "PRD should document Dashboard next-action queue verification Studio plan",
);
assertFileIncludes(
  prdSource,
  "`완료 확인 Studio로`",
  "PRD should document Dashboard next-action queue verification Studio action",
);
assertFileIncludes(
  prdSource,
  "`dashboard-next-action-queue-verification` sourceVariant",
  "PRD should document Dashboard next-action queue verification source variant tracking",
);
assertFileIncludes(
  prdSource,
  "링크/리포트/완료 확인 복사가 clipboard 제한으로 실패하면",
  "PRD should document Dashboard next-action queue verification copy fallback",
);
assertFileIncludes(
  prdSource,
  "다음 실행 큐 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 Dashboard 큐 맥락을 복원해야 하며, 저장이 실패해도 이동하지 않고 같은 큐 패널 하단에 원문 textarea를 표시해야 한다.",
  "PRD should document Dashboard next-action queue Studio draft return action and fallback",
);
assertFileIncludes(
  prdSource,
  "Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 개인화 보강 맥락을 복원해야 하며, 복사 실패나 Studio 초안 저장 실패 시 수동 복사용 textarea를 표시하고 이동하지 않는다.",
  "PRD should document Dashboard personalization Studio draft return action and fallback",
);
assertFileIncludes(
  prdSource,
  "Learning 운영 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 Dashboard 학습 운영 맥락을 복원해야 하며, 저장이 실패하면 이동하지 않고 해당 원문을 수동 복사용 textarea로 표시해야 한다.",
  "PRD should document Dashboard Learning operations Studio draft return action and fallback",
);
assertFileIncludes(
  prdSource,
  "Dashboard 스킬 운영, 피드백 반영 개선, Studio 저장 출처, 저장 출처 메타 없음 큐, 개선 출처 상태 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 Dashboard 맥락을 복원하고, 개선 출처 후보 초안은 `Library 후보로 돌아가기` 복귀 액션 라벨로 대표 후보를 복원해야 하며, 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시해야 한다.",
  "PRD should document Dashboard improvement/source operations Studio draft return actions and fallback",
);
assertFileIncludes(
  prdSource,
  "개선 효과 패널의 Studio 저장 출처 운영/출처 상태 조치 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 Dashboard 패널 맥락을 복원하고, 출처 상태 후보 초안은 `Library 후보로 돌아가기` 복귀 액션 라벨로 대표 후보를 복원해야 하며, 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시해야 한다.",
  "PRD should document Dashboard improvement panel Studio draft return actions and storage fallback",
);
assertFileNotIncludes(
  prdSource,
  "개선 효과 패널의 Studio 초안 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시해야 한다.",
  "PRD should not keep the Dashboard improvement panel fallback-only Studio draft contract",
);
assertFileIncludes(
  prdSource,
  "개인 프로필, 회사 프로필, 학습 scope coverage, 다음 보강 액션을 절대 URL 링크가 포함된 Markdown",
  "PRD should document Dashboard personalization reports with absolute links",
);
assertFileIncludes(
  prdSource,
  "`학습 운영 리포트 복사`는 전체 학습 메모리, 학습 메타 보존 프롬프트, 운영 점검 큐, 권장 조치 큐, scope별 현황을 절대 URL 링크가 포함된 Markdown",
  "PRD should document Dashboard Learning reports with absolute links",
);
assertFileIncludes(
  prdSource,
  "Studio 저장 출처 정보로만 보존",
  "PRD should describe Studio drafts as saved-source metadata",
);
assertFileNotIncludes(
  prdSource,
  ["Studio", "출처", "종류"].join(" "),
  "PRD should not use old source-kind wording for Studio source operations",
);
assertFileNotMatches(
  prdSource,
  new RegExp(["(?<!저장 )출처", "메타", "없음"].join(" ")),
  "PRD should not use old missing source metadata wording",
);
assertFileIncludes(
  readme,
  "세부 유형 count는 `studioVariant` Library 필터 링크로 바로 열거나 절대 URL로 복사할 수 있습니다.",
  "README should document Dashboard Studio sourceVariant filter link navigation and copy actions",
);
assertFileIncludes(
  readme,
  "전체 Studio 저장 출처 필터나 각 항목도 `studioSource` Library 필터로 바로 열거나 필터 링크를 절대 URL로 복사",
  "README should document Dashboard Studio source all-filter and per-source filter link copy actions",
);
assertFileIncludes(
  readme,
  "`출처 상태 조치`에서는 보관함 원본과 측정 불가 개선본을 바로 Library 필터로 열거나 조건 링크를 복사",
  "README should document Dashboard source-health summary link copy actions",
);
assertFileIncludes(
  readme,
  "후보 상세 링크 복사",
  "README should document Dashboard source-health candidate detail link copy actions",
);
assertFileIncludes(
  readme,
  "`큐 링크 복사` 액션은 Library 큐 조건 링크를 절대 URL로 복사",
  "README should document the Dashboard direct missing saved-source metadata queue link copy action",
);
assertFileIncludes(
  readme,
  "`큐 프롬프트 복사` 액션은 절대 URL 큐 링크를 포함한 운영 프롬프트를 바로 복사",
  "README should document the Dashboard direct missing saved-source metadata queue prompt copy action with an absolute queue link",
);
assertFileIncludes(
  readme,
  "`큐 운영 기준 Studio로` 액션은 Library 필터를 거치지 않고 절대 URL 큐 링크를 포함한 `library-missing-source-metadata-queue` 초안으로 바로 전환",
  "README should document the Dashboard direct missing saved-source metadata queue Studio action with an absolute queue link",
);
assertFileIncludes(
  dashboardSource,
  "Studio 저장 출처 메타 저장본",
  "Dashboard source ops report should count saved-source metadata records",
);
assertFileIncludes(
  dashboardSource,
  "저장 출처 메타 없음. Library에서 유지 또는 재저장 기준 점검",
  "Dashboard persistence summary should guide missing saved-source metadata review",
);
assertFileIncludes(
  dashboardSource,
  "## 저장 출처 메타 없음 큐",
  "Dashboard source ops report should expose a dedicated missing saved-source metadata queue",
);
assertFileIncludes(
  dashboardSource,
  "Treat the missing saved-source metadata queue as an explicit operating queue",
  "Dashboard source ops Studio prompt should treat missing saved-source metadata as an operating queue",
);
assertFileIncludes(
  dashboardSource,
  "Library 저장 출처 없음 메모는 저장 출처 메타가 없는 항목",
  "Dashboard source ops criteria should describe missing saved-source metadata notes",
);
assertFileIncludes(
  dashboardSource,
  "아직 Studio 저장 출처 메타가 있는 저장본이 없습니다.",
  "Dashboard source ops empty state should use saved-source metadata wording",
);
assertDashboardMatches(
  /function openReimprovementInStudio\(record: PromptImprovementRecord\)[\s\S]*?const rawInput = buildDashboardReimprovementBrief\(record\)[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-improvement"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setFeedbackImprovementPriorityCopyStatus\("failed"\)[\s\S]*?setFeedbackImprovementOpsManualCopy\(\{[\s\S]*?title: `\$\{record\.prompt\.title\} 재개선 Studio 초안`[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-improvement"\)/,
  "Dashboard reimprovement Studio draft should keep feedback-improvement manual fallback when draft storage fails",
);
assertDashboardMatches(
  /function buildDashboardFeedbackImprovementOpsReportText\(\{[\s\S]*?baseUrl[\s\S]*?const formatReportHref = \(href: string\) =>[\s\S]*?formatAbsoluteInternalHref\(href, baseUrl\)[\s\S]*?# 피드백 반영 개선 리포트[\s\S]*?보관함 원본 개선본: \$\{formatReportHref\(archivedSourceHref\)\}[\s\S]*?측정 불가 개선본: \$\{formatReportHref\(unmeasuredHref\)\}[\s\S]*?개선본 상세: \$\{formatReportHref[\s\S]*?promptDetailLibraryHref[\s\S]*?원본 피드백: \$\{formatReportHref[\s\S]*?promptFeedbackLibraryHref[\s\S]*?생성일: \$\{formatDashboardDate\(record\.createdAt\)\}/,
  "Dashboard feedback improvement report should include absolute source-health/detail/feedback links and created dates",
);
assertDashboardMatches(
  /copyFeedbackImprovementOpsReport\(\)[\s\S]*?buildDashboardFeedbackImprovementOpsReportText\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?records: feedbackBasedImprovementRecords/,
  "Dashboard feedback improvement report copy should use absolute links",
);
assertDashboardMatches(
  /openFeedbackImprovementOpsReportInStudio\(\)[\s\S]*?const rawInput = buildDashboardFeedbackImprovementOpsStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?records: feedbackBasedImprovementRecords[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-feedback-improvement-ops"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setFeedbackImprovementOpsReportCopyStatus\("failed"\)[\s\S]*?setFeedbackImprovementOpsManualCopy\(\{[\s\S]*?title: "Dashboard 피드백 반영 개선 리포트"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-feedback-improvement-ops"\)/,
  "Dashboard feedback improvement Studio draft should use the absolute-link report and keep manual fallback when draft storage fails",
);
assertDashboardMatches(
  /data-testid="dashboard-feedback-improvement-metrics"[\s\S]*?피드백 개선본[\s\S]*?feedbackBasedImprovementRecords\.length[\s\S]*?평균 개선폭[\s\S]*?formatSignedScore\(feedbackImprovementAverageDelta\)[\s\S]*?재검토 필요[\s\S]*?feedbackImprovementReviewCount[\s\S]*?보관함 원본[\s\S]*?feedbackImprovementArchivedSourceCount/,
  "Dashboard feedback improvement section should expose operator metrics before the record cards",
);
assertDashboardMatches(
  /const feedbackImprovementPriorityRecord =[\s\S]*?find\(\(record\) => record\.sourceDeletedAt\)[\s\S]*?find\(\(record\) => record\.delta <= 0\)[\s\S]*?feedbackBasedImprovementRecords\[0\][\s\S]*?data-testid="dashboard-feedback-improvement-priority"[\s\S]*?우선 점검[\s\S]*?feedbackImprovementPriorityReason\([\s\S]*?feedbackImprovementPriorityRecord[\s\S]*?우선 개선본 보기[\s\S]*?원본 복원 확인[\s\S]*?원본 피드백 보기/,
  "Dashboard feedback improvement section should expose a prioritized first review item with direct detail and source-feedback actions",
);
assertDashboardMatches(
  /function buildDashboardFeedbackImprovementPriorityReportText\(\{[\s\S]*?baseUrl[\s\S]*?record[\s\S]*?# 피드백 개선 우선 점검 리포트[\s\S]*?feedbackImprovementPriorityReason\(record\)[\s\S]*?개선본 상세: \$\{improvedHref\}[\s\S]*?원본 피드백: \$\{sourceFeedbackHref\}[\s\S]*?Required action/,
  "Dashboard feedback priority report should build a focused single-record Markdown package with absolute detail and feedback links",
);
assertDashboardMatches(
  /copyFeedbackImprovementPriorityReport\(\)[\s\S]*?buildDashboardFeedbackImprovementPriorityReportText\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?record: feedbackImprovementPriorityRecord[\s\S]*?setFeedbackImprovementPriorityCopyStatus[\s\S]*?피드백 개선 우선 점검 리포트/,
  "Dashboard feedback priority report should be copyable with manual fallback",
);
assertDashboardMatches(
  /openFeedbackImprovementPriorityInStudio\(\)[\s\S]*?const rawInput = buildDashboardFeedbackImprovementPriorityStudioPrompt\(\{[\s\S]*?baseUrl: window\.location\.origin[\s\S]*?record: feedbackImprovementPriorityRecord[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "dashboard-feedback-improvement-ops"[\s\S]*?rawInput[\s\S]*?goal: "피드백 개선 우선 점검 계획"[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setFeedbackImprovementPriorityCopyStatus\("failed"\)[\s\S]*?setFeedbackImprovementOpsManualCopy\(\{[\s\S]*?title: "Dashboard 피드백 개선 우선 점검"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=dashboard-feedback-improvement-ops"\)/,
  "Dashboard feedback priority report should open as a focused Studio plan and keep manual fallback when draft storage fails",
);
assertDashboardMatches(
  /data-testid="dashboard-feedback-improvement-priority-copy"[\s\S]*?우선 리포트 복사됨[\s\S]*?우선 리포트 복사 실패[\s\S]*?우선 리포트 복사[\s\S]*?data-testid="dashboard-feedback-improvement-priority-studio"[\s\S]*?우선 계획 Studio로/,
  "Dashboard feedback priority panel should expose copy and Studio actions",
);
assertDashboardMatches(
  /function saveFeedbackImprovementPriorityMemory\(\)[\s\S]*?const priorityMemory = buildFeedbackImprovementLearningMemory\([\s\S]*?feedbackImprovementPriorityRecord[\s\S]*?mergeMemoryList\(current, priorityMemory\)[\s\S]*?setFeedbackImprovementPriorityMemoryPreview\(priorityMemory\)[\s\S]*?setFeedbackImprovementPriorityMemorySaveStatus\("saved"\)[\s\S]*?data-testid="dashboard-feedback-improvement-priority-memory-save"[\s\S]*?우선 메모리 저장됨[\s\S]*?우선 메모리 저장[\s\S]*?data-testid="dashboard-feedback-improvement-priority-memory-summary"[\s\S]*?저장된 메모리[\s\S]*?feedbackImprovementPriorityMemoryPreview\.title[\s\S]*?신뢰도[\s\S]*?data-testid="dashboard-feedback-improvement-priority-learning-link"[\s\S]*?우선 메모리 확인/,
  "Dashboard feedback priority panel should save the priority feedback rule as a single Learning memory, summarize the saved memory, and expose a Learning link",
);
assertDashboardMatches(
  /feedbackBasedImprovementRecords\.slice\(0, 3\)\.map[\s\S]*?AI 도구[\s\S]*?modelLabels\[record\.targetModel\][\s\S]*?점수 변화[\s\S]*?record\.sourceVersion\.qualityScore\.toFixed\(1\)[\s\S]*?record\.improvedVersion\.qualityScore\.toFixed\(1\)[\s\S]*?생성일[\s\S]*?formatDashboardDate\(record\.createdAt\)/,
  "Dashboard feedback improvement cards should show target AI, score movement, and created date",
);
assertFileIncludes(
  readme,
  "피드백 개선본 수, 평균 개선폭, 재검토 필요, 보관함 원본 지표",
  "README should document Dashboard feedback improvement operator metrics",
);
assertFileIncludes(
  readme,
  "우선 점검 항목",
  "README should document Dashboard feedback improvement priority review item",
);
assertFileIncludes(
  readme,
  "우선 리포트 복사",
  "README should document Dashboard feedback improvement priority report copy action",
);
assertFileIncludes(
  readme,
  "우선 계획 Studio로",
  "README should document Dashboard feedback improvement priority Studio action",
);
assertFileIncludes(
  readme,
  "우선 메모리 저장",
  "README should document Dashboard feedback improvement priority memory save action",
);
assertFileIncludes(
  readme,
  "저장된 메모리 제목, scope, 신뢰도",
  "README should document Dashboard feedback improvement priority memory save summary",
);
assertFileIncludes(
  readme,
  "절대 URL로 포함",
  "README should document feedback improvement report absolute links",
);
assertFileIncludes(
  prdSource,
  "피드백 개선본 수, 평균 개선폭, 재검토 필요, 보관함 원본 지표",
  "PRD should document Dashboard feedback improvement operator metrics",
);
assertFileIncludes(
  prdSource,
  "우선 점검 항목",
  "PRD should document Dashboard feedback improvement priority review item",
);
assertFileIncludes(
  prdSource,
  "우선 리포트 복사",
  "PRD should document Dashboard feedback improvement priority report copy action",
);
assertFileIncludes(
  prdSource,
  "우선 계획 Studio로",
  "PRD should document Dashboard feedback improvement priority Studio action",
);
assertFileIncludes(
  prdSource,
  "우선 메모리 저장",
  "PRD should document Dashboard feedback improvement priority memory save action",
);
assertFileIncludes(
  prdSource,
  "저장된 메모리 제목, scope, 신뢰도",
  "PRD should document Dashboard feedback improvement priority memory save summary",
);
assertFileIncludes(
  prdSource,
  "개선본 상세과 원본 피드백 링크를 절대 URL로 포함",
  "PRD should document Dashboard feedback improvement absolute detail and feedback links",
);

assertDashboardNotIncludes(
  ["Studio", "출처", "종류"].join(" "),
  "Dashboard view should not show source-kind wording for Studio source operations",
);
assertDashboardNotIncludes(
  ["Studio", "출처", "메타"].join(" "),
  "Dashboard view should not show old Studio source metadata wording",
);
assertDashboardNotIncludes(
  ["출처", "종류", "운영", "리포트"].join(" "),
  "Dashboard view should not title source operations reports as source-kind reports",
);

console.log("Dashboard Studio source ops verification passed.");
