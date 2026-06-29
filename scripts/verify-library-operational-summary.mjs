import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/components/library/library-view.tsx", "utf8");
const libraryPageSource = readFileSync("src/app/library/page.tsx", "utf8");
const promptTypesSource = readFileSync("src/lib/prompt/types.ts", "utf8");
const sourceRegistrySource = readFileSync(
  "src/lib/studio/source-registry.ts",
  "utf8",
);
const draftDisplaySource = readFileSync(
  "src/lib/studio/draft-display.ts",
  "utf8",
);
const readme = readFileSync("README.md", "utf8");
const prd = readFileSync("docs/personalized-prompt-ai-prd.md", "utf8");
const developmentBrief = readFileSync("docs/codex-development-brief.md", "utf8");

function assertIncludes(text, message) {
  assert.ok(source.includes(text), message);
}

function assertMatches(pattern, message) {
  assert.match(source, pattern, message);
}

function assertNotIncludes(text, message) {
  assert.ok(!source.includes(text), message);
}

function assertFileIncludes(fileSource, text, message) {
  assert.ok(fileSource.includes(text), message);
}

assertIncludes(
  "ContextOperatingFlow",
  "Library should reuse the shared context operating flow component",
);
assertIncludes(
  "type ContextOperatingFlowItem",
  "Library operating flow items should use the shared typed item contract",
);
assertMatches(
  /const libraryOperatingFlowItems = useMemo<ContextOperatingFlowItem\[\]>/,
  "Library should derive a typed top-level operating flow",
);
assertIncludes(
  'testId="library-operating-flow"',
  "Library should expose a stable test id for its top operating flow",
);
assertIncludes(
  'title="Library 운영 흐름"',
  "Library operating flow should have a clear visible title",
);
assertIncludes(
  'href: "#library-filters"',
  "Library operating flow should link to the filter workspace",
);
assertIncludes(
  'href: "#library-results"',
  "Library operating flow should link to filtered results",
);
assertIncludes(
  'href: "#library-selected-operational-summary"',
  "Library operating flow should link to the selected operational summary",
);
assertIncludes(
  'href: "#library-detail-workspace"',
  "Library operating flow should link to the selected detail workspace",
);
assertIncludes(
  'id="library-filters"',
  "Library filter panel should expose a stable anchor",
);
assertIncludes(
  'id="library-results"',
  "Library results list should expose a stable anchor",
);
assertIncludes(
  'id="library-detail-workspace"',
  "Library detail workspace should expose a stable anchor",
);
assertIncludes(
  'id="library-selected-operational-summary"',
  "Library selected operational summary should expose a stable anchor",
);
assertIncludes(
  'data-testid="library-selected-operational-summary"',
  "Library detail should expose a selected prompt operational summary",
);
assertMatches(
  /data-testid="library-selected-operational-summary"[\s\S]*?grid-cols-2[\s\S]*?sm:grid-cols-3[\s\S]*?data-testid="library-selected-operational-status-grid"[\s\S]*?저장 방식[\s\S]*?selectedOperationalSummary\.persistenceLabel[\s\S]*?출처[\s\S]*?selectedOperationalSummary\.sourceLabel[\s\S]*?체인[\s\S]*?selectedOperationalSummary\.chainLabel/,
  "Library selected operational status grid should stay compact in two columns on mobile and three columns on desktop",
);
assertMatches(
  /const selectedOperationalWorkflowSteps = useMemo\(\(\) => \{[\s\S]*?selectedOperationalSummary\.handoffStatusLabel[\s\S]*?label: "확인"[\s\S]*?step: "01"[\s\S]*?리포트 또는 조건 링크로 공유[\s\S]*?label: "공유"[\s\S]*?step: "02"[\s\S]*?selectedOperationalSummary\.nextActionDescription[\s\S]*?label: "개선"[\s\S]*?step: "03"[\s\S]*?data-testid="library-selected-operational-workflow"[\s\S]*?selectedOperationalWorkflowSteps\.map[\s\S]*?step\.step[\s\S]*?step\.label[\s\S]*?step\.title[\s\S]*?step\.detail/,
  "Library selected operational summary should show numbered check, share, and improve workflow cards",
);
assertFileIncludes(
  readme,
  "Library 운영 흐름은 검색 조건, 목록 결과, 선택 프롬프트 운영 요약, 출처/이력 추적을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 합니다.",
  "README should document the Library top operating flow",
);
assertFileIncludes(
  readme,
  "Library 선택 운영 요약의 저장 방식, 출처, 체인은 모바일 2열과 데스크톱 3열로 압축해 상세 패널에서도 보존 방식과 다음 조치를 빠르게 확인하게 합니다.",
  "README should document the compact responsive Library selected operational summary",
);
assertFileIncludes(
  readme,
  "Library 선택 운영 요약은 `01 확인`, `02 공유`, `03 개선` 단계 카드를 함께 보여줘 저장본을 열었을 때 상태 확인, 링크/리포트 공유, Studio 개선 실행 순서를 바로 읽게 합니다.",
  "README should document numbered Library selected operational workflow",
);
assertFileIncludes(
  readme,
  "Library 선택 운영 요약 리포트와 AI 전달 보강 브리프의 Studio 초안 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시합니다.",
  "README should document Library selected Studio draft storage fallback",
);
assertFileIncludes(
  readme,
  "Library Studio 저장 방식, 저장 출처, 운영 묶음 리포트와 각 대표 후보의 Studio 초안 저장이 실패하면 이동하지 않고 해당 조치 패널의 수동 복사용 원문 textarea를 표시합니다.",
  "README should document Library filter operation Studio draft storage fallback",
);
assertFileIncludes(
  prd,
  "Library 운영 흐름은 검색 조건, 목록 결과, 선택 프롬프트 운영 요약, 출처/이력 추적을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 해야 한다.",
  "PRD should require the Library top operating flow",
);
assertFileIncludes(
  prd,
  "Library 선택 운영 요약의 저장 방식, 출처, 체인은 모바일 2열과 데스크톱 3열로 압축해 상세 패널에서도 보존 방식과 다음 조치를 빠르게 확인하게 해야 한다.",
  "PRD should require the compact responsive Library selected operational summary",
);
assertFileIncludes(
  prd,
  "Library 선택 운영 요약은 `01 확인`, `02 공유`, `03 개선` 단계 카드를 함께 보여줘 저장본을 열었을 때 상태 확인, 링크/리포트 공유, Studio 개선 실행 순서를 바로 읽게 해야 한다.",
  "PRD should require numbered Library selected operational workflow",
);
assertFileIncludes(
  prd,
  "Library 선택 운영 요약 리포트와 AI 전달 보강 브리프의 Studio 초안 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시해야 한다.",
  "PRD should document Library selected Studio draft storage fallback",
);
assertFileIncludes(
  prd,
  "Library Studio 저장 방식, 저장 출처, 운영 묶음 리포트와 각 대표 후보의 Studio 초안 저장이 실패하면 이동하지 않고 해당 조치 패널의 수동 복사용 원문 textarea를 표시해야 한다.",
  "PRD should document Library filter operation Studio draft storage fallback",
);
assertFileIncludes(
  promptTypesSource,
  '"library-learning-context"',
  "Prompt Studio draft sources should include Library learning context reports",
);
assertFileIncludes(
  sourceRegistrySource,
  '"library-learning-context":',
  "Studio source registry should define Library learning context reports",
);
assertFileIncludes(
  sourceRegistrySource,
  "Library 학습 컨텍스트 리포트",
  "Studio source registry should label Library learning context reports",
);
for (const sourceActionLabel of [
  "Library 원본으로 돌아가기",
  "Library 운영 요약으로 돌아가기",
  "Library 필터로 돌아가기",
  "Library 후보로 돌아가기",
  "Library 운영 묶음으로 돌아가기",
  "Library 큐로 돌아가기",
  "원본 저장본으로 돌아가기",
  "Library 학습 증거로 돌아가기",
]) {
  assertFileIncludes(
    sourceRegistrySource,
    sourceActionLabel,
    `Studio source registry should include ${sourceActionLabel}`,
  );
}
assertFileIncludes(
  draftDisplaySource,
  'sourceActionLabel: "Library 피드백으로 돌아가기"',
  "Studio draft display should return feedback variants to the Library feedback source",
);
assertFileIncludes(
  draftDisplaySource,
  'sourceActionLabel: "Library 원본으로 돌아가기"',
  "Studio draft display should return handoff variants to the Library source",
);
assertMatches(
  /function buildLearningContextStudioDraftText\(\{[\s\S]*?buildLearningContextReportText\(prompt\)[\s\S]*?Library 추적[\s\S]*?Library 상세: \$\{detailLink\}[\s\S]*?재개선 계획/,
  "Library learning context Studio draft should reuse the report and include a traceable Library detail link",
);
assertMatches(
  /const selectedLearningContextWorkflowSteps = useMemo\(\(\) => \{[\s\S]*?formatLearningContextCount\(selected\)[\s\S]*?label: "증거 확인"[\s\S]*?step: "01"[\s\S]*?label: "리포트 공유"[\s\S]*?step: "02"[\s\S]*?label: "Studio 개선"[\s\S]*?step: "03"/,
  "Library selected learning context card should calculate evidence, report, and Studio improvement workflow steps",
);
assertMatches(
  /function openLearningContextReportInStudio\(\)[\s\S]*?const rawInput = buildLearningContextStudioDraftText\(\{[\s\S]*?detailHref: selectedDetailReturnHref[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-learning-context"[\s\S]*?rawInput[\s\S]*?sourceTitle: `학습 컨텍스트 · \$\{selected\.title\}`[\s\S]*?sourceHref: selectedDetailReturnHref[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setLearningContextReportCopiedFor\(""\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "learning-report"[\s\S]*?targetId: selected\.id[\s\S]*?title: "학습 컨텍스트 리포트"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-learning-context"\)/,
  "Library selected learning context report should open in Studio with a stable learning-context source id and keep manual fallback when draft storage fails",
);
assertMatches(
  /data-testid="library-learning-context-workflow"[\s\S]*?selectedLearningContextWorkflowSteps\.map[\s\S]*?step\.step[\s\S]*?step\.label[\s\S]*?step\.title[\s\S]*?step\.detail[\s\S]*?학습 컨텍스트 리포트 복사[\s\S]*?openLearningContextReportInStudio[\s\S]*?학습 리포트 Studio로/,
  "Library selected learning context card should render workflow cards and a Studio handoff action beside report copy",
);
assertFileIncludes(
  readme,
  "Library 상세의 학습 컨텍스트 카드는 `01 증거 확인`, `02 리포트 공유`, `03 Studio 개선` 단계로 enabled scope, 적용 메모리/피드백 수, 리포트 복사, Studio 재개선 초안을 한 번에 이어줍니다.",
  "README should document the Library learning context workflow and Studio handoff",
);
assertFileIncludes(
  prd,
  "Library 상세의 학습 컨텍스트 카드는 `01 증거 확인`, `02 리포트 공유`, `03 Studio 개선` 단계로 enabled scope, 적용 메모리/피드백 수, 리포트 복사, Studio 재개선 초안을 한 번에 이어줘야 한다.",
  "PRD should require the Library learning context workflow and Studio handoff",
);
assertFileIncludes(
  developmentBrief,
  "Library 상세의 학습 컨텍스트 카드는 `01 증거 확인`, `02 리포트 공유`, `03 Studio 개선` 단계로 enabled scope, 적용 메모리/피드백 수, 리포트 복사, Studio 재개선 초안을 연결",
  "Development brief should document the Library learning context workflow and Studio handoff",
);
assertFileIncludes(
  developmentBrief,
  "선택 운영 요약 리포트와 AI 전달 보강 브리프의 Studio 초안 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시함",
  "Development brief should document Library selected Studio draft storage fallback",
);
assertFileIncludes(
  developmentBrief,
  "Library Studio 저장 방식, 저장 출처, 운영 묶음 리포트와 각 대표 후보의 Studio 초안 저장이 실패하면 이동하지 않고 해당 조치 패널의 수동 복사용 원문 textarea를 표시함",
  "Development brief should document Library filter operation Studio draft storage fallback",
);
assertFileIncludes(
  readme,
  "Library 상세의 학습 컨텍스트, 저장 출처 없음 메모, 개선/피드백/비교 개선 초안 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시합니다.",
  "README should document Library detail Studio draft fallback",
);
assertFileIncludes(
  prd,
  "Library 상세의 학습 컨텍스트, 저장 출처 없음 메모, 개선/피드백/비교 개선 초안 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시해야 한다.",
  "PRD should document Library detail Studio draft fallback",
);
assertFileIncludes(
  developmentBrief,
  "Library 상세의 학습 컨텍스트, 저장 출처 없음 메모, 개선/피드백/비교 개선 초안 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시함",
  "Development brief should document Library detail Studio draft fallback",
);
assertFileIncludes(
  readme,
  "Library 출처 사유 조치 리포트와 대표 후보 메모의 Studio 초안 저장이 실패하면 이동하지 않고 출처 사유 조치 패널의 수동 복사용 원문 textarea를 표시합니다.",
  "README should document Library source-health Studio draft fallback",
);
assertFileIncludes(
  prd,
  "Library 출처 사유 조치 리포트와 대표 후보 메모의 Studio 초안 저장이 실패하면 이동하지 않고 출처 사유 조치 패널의 수동 복사용 원문 textarea를 표시해야 한다.",
  "PRD should document Library source-health Studio draft fallback",
);
assertFileIncludes(
  developmentBrief,
  "Library 출처 사유 조치 리포트와 대표 후보 메모의 Studio 초안 저장이 실패하면 이동하지 않고 출처 사유 조치 패널의 수동 복사용 원문 textarea를 표시함",
  "Development brief should document Library source-health Studio draft fallback",
);
assertFileIncludes(
  readme,
  "Library 계열 Studio 초안은 `Library 원본으로 돌아가기`, `Library 피드백으로 돌아가기`, `Library 운영 요약으로 돌아가기`, `Library 필터로 돌아가기`, `Library 후보로 돌아가기`, `Library 운영 묶음으로 돌아가기`, `Library 큐로 돌아가기`, `원본 저장본으로 돌아가기`, `Library 학습 증거로 돌아가기` 복귀 액션 라벨로 원래 Library 조건이나 상세를 복원합니다.",
  "README should document Library return action labels",
);
assertFileIncludes(
  prd,
  "Library 계열 Studio 초안은 `Library 원본으로 돌아가기`, `Library 피드백으로 돌아가기`, `Library 운영 요약으로 돌아가기`, `Library 필터로 돌아가기`, `Library 후보로 돌아가기`, `Library 운영 묶음으로 돌아가기`, `Library 큐로 돌아가기`, `원본 저장본으로 돌아가기`, `Library 학습 증거로 돌아가기` 복귀 액션 라벨로 원래 Library 조건이나 상세를 복원해야 한다.",
  "PRD should document Library return action labels",
);
assertFileIncludes(
  developmentBrief,
  "Library 계열 Studio 초안은 `Library 원본으로 돌아가기`, `Library 피드백으로 돌아가기`, `Library 운영 요약으로 돌아가기`, `Library 필터로 돌아가기`, `Library 후보로 돌아가기`, `Library 운영 묶음으로 돌아가기`, `Library 큐로 돌아가기`, `원본 저장본으로 돌아가기`, `Library 학습 증거로 돌아가기` 복귀 액션 라벨로 원래 Library 조건이나 상세를 복원함",
  "Development brief should document Library return action labels",
);
assertMatches(
  /const selectedOperationalSummary = useMemo[\s\S]*?\(\(\) => \{[\s\S]*?blockedReadinessCount[\s\S]*?reviewReadinessCount[\s\S]*?handoffStatusLabel/,
  "Library operational summary should derive handoff readiness from preflight items",
);
assertMatches(
  /selectedStudioPersistenceLabel[\s\S]*?\?\?[\s\S]*?selected\.improvementSource \? "개선 체인" : "Studio 출처 없음"/,
  "Library operational summary should explain persistence even when Studio source metadata is missing",
);
assertMatches(
  /selectedImprovementDepth > 0[\s\S]*?formatPromptImprovementDepth\(selectedImprovementDepth\)[\s\S]*?linkedImprovementPrompts\.length[\s\S]*?"원본 프롬프트"[\s\S]*?"단독 저장본"/,
  "Library operational summary should distinguish improved, source, and standalone prompts",
);
assertMatches(
  /selectedSourceHealthIssueReason[\s\S]*?\? "원본 상태 확인"[\s\S]*?blockedReadinessCount \|\| reviewReadinessCount[\s\S]*?\? "AI 전달 전 보강"[\s\S]*?selectedImprovementQualityDelta\?\.delta[\s\S]*?\? "재개선 후보 검토"[\s\S]*?: "AI 전달 패키지 실행"/,
  "Library operational summary should prioritize source health, handoff readiness, reimprovement, and execution actions",
);
assertMatches(
  /const actionKind = selectedSourceHealthIssueReason[\s\S]*?\? "source-detail"[\s\S]*?blockedReadinessCount \|\| reviewReadinessCount[\s\S]*?\? "handoff-improve"[\s\S]*?selectedImprovementQualityDelta\?\.delta[\s\S]*?\? "comparison"[\s\S]*?: "package"/,
  "Library operational summary should map each prioritized action to an executable action kind",
);
assertMatches(
  /const actionLabel =[\s\S]*?actionKind === "source-detail"[\s\S]*?"출처 카드 확인"[\s\S]*?actionKind === "handoff-improve"[\s\S]*?"Studio에서 보강"[\s\S]*?actionKind === "comparison"[\s\S]*?"원본 비교 보기"[\s\S]*?: "패키지 보기"/,
  "Library operational summary should expose a direct CTA label for each action kind",
);
assertMatches(
  /const sourceActionLabel = selectedStudioSourceFilterHref[\s\S]*?selectedStudioSourceHasVariant[\s\S]*?"세부 유형 출처 보기"[\s\S]*?: "저장 출처 보기"[\s\S]*?: undefined/,
  "Library operational summary should expose a sourceVariant-aware secondary saved-source filter action when source metadata exists",
);
assertMatches(
  /sourceTitle: selectedStudioSource\?\.sourceTitle/,
  "Library operational summary should retain the specific Studio source title when source metadata exists",
);
assertMatches(
  /const persistenceActionLabel = selectedStudioPersistenceFilterHref[\s\S]*?"저장 방식으로 보기"[\s\S]*?: undefined/,
  "Library operational summary should expose a secondary Studio persistence filter action when persistence metadata exists",
);
assertMatches(
  /const selectedStudioOperationalGroupHref =[\s\S]*?selectedStudioSource && selectedStudioPersistenceFilter[\s\S]*?studioPersistence: selectedStudioPersistenceFilter[\s\S]*?studioSource: selectedStudioSource\.source/,
  "Library operational summary should build a combined Studio source and persistence filter href for exact operation cohorts",
);
assertMatches(
  /listStudioOperationalGroupOpenLabel =[\s\S]*?같은 세부 유형 묶음[\s\S]*?같은 운영 묶음[\s\S]*?const listStudioOperationalGroupHref = prompt\.studioSource[\s\S]*?studioPersistence: listStudioPersistenceFilter[\s\S]*?studioSource: prompt\.studioSource\.source/,
  "Library list items should expose a sourceVariant-aware direct combined operation cohort filter when source and persistence metadata exist",
);
assertIncludes(
  "async function copyListStudioFilterLink({",
  "Library list items should share a reusable operation filter link copier",
);
assertIncludes(
  "bodyLines?: string[];",
  "Library list Studio filter link copier should accept optional fallback metadata",
);
assertIncludes(
  "const copyBody = bodyLines?.length",
  "Library list Studio filter link copier should build a metadata-aware copy body",
);
assertIncludes(
  "body: copyBody,",
  "Library list Studio filter link copier should copy the metadata-aware body",
);
assertMatches(
  /listStudioSourceLinkTitle = listStudioSourceHasVariant[\s\S]*?"목록 같은 세부 유형 출처 조건 링크"[\s\S]*?: "목록 같은 저장 출처 조건 링크"[\s\S]*?id: "list-studio-source-link"[\s\S]*?title: listStudioSourceLinkTitle[\s\S]*?library-list-studio-source-link-copy-\$\{prompt\.id\}[\s\S]*?listStudioSourceCopyLabel[\s\S]*?listStudioSourceOpenLabel/,
  "Library list items should copy and open sourceVariant-aware same saved-source filter links",
);
assertMatches(
  /const listStudioSourceOriginalHref = getPromptStudioSourceHref\([\s\S]*?prompt\.studioSource[\s\S]*?bodyLines: \[[\s\S]*?프롬프트: \$\{prompt\.title\}[\s\S]*?저장 출처: \$\{listStudioSourceLabel\.label\}[\s\S]*?출처 제목: \$\{prompt\.studioSource\.sourceTitle\}[\s\S]*?원본 경로: \$\{listStudioSourceOriginalHref\}[\s\S]*?id: "list-studio-source-original-link"[\s\S]*?title: "목록 원본 경로 링크"[\s\S]*?library-list-studio-source-original-link-copy-\$\{prompt\.id\}[\s\S]*?원본 링크 복사됨[\s\S]*?원본 링크 실패[\s\S]*?원본 링크[\s\S]*?href=\{listStudioSourceOriginalHref\}[\s\S]*?\{listStudioSourceLabel\.actionLabel\}/,
  "Library list items should copy and open the original Studio sourceHref with source-title fallback metadata when source metadata exists",
);
assertMatches(
  /id: "list-studio-persistence-link"[\s\S]*?title: "목록 같은 저장 방식 조건 링크"[\s\S]*?library-list-studio-persistence-link-copy-\$\{prompt\.id\}[\s\S]*?저장 링크[\s\S]*?같은 저장 방식/,
  "Library list items should copy and open the same-storage filter link",
);
assertMatches(
  /listStudioOperationalGroupLinkTitle =[\s\S]*?listStudioSourceHasVariant[\s\S]*?"목록 같은 세부 유형 운영 묶음 조건 링크"[\s\S]*?: "목록 같은 운영 묶음 조건 링크"[\s\S]*?id: "list-studio-operational-group-link"[\s\S]*?title: listStudioOperationalGroupLinkTitle[\s\S]*?library-list-studio-operational-group-link-copy-\$\{prompt\.id\}[\s\S]*?listStudioOperationalGroupCopyLabel[\s\S]*?listStudioOperationalGroupOpenLabel/,
  "Library list items should copy and open sourceVariant-aware operation cohort filter links",
);
assertMatches(
  /manualCopy\?\.targetId === prompt\.id[\s\S]*?manualCopy\.id === "list-studio-source-link"[\s\S]*?manualCopy\.id === "list-studio-source-original-link"[\s\S]*?manualCopy\.id === "list-studio-persistence-link"[\s\S]*?manualCopy\.id ===[\s\S]*?"list-studio-operational-group-link"[\s\S]*?LibraryManualCopyPanel/,
  "Library list item operation filter and original source copy actions should expose a local fallback panel",
);
assertMatches(
  /const groupActionLabel = selectedStudioOperationalGroupHref[\s\S]*?selectedStudioSourceHasVariant[\s\S]*?"세부 유형 묶음 보기"[\s\S]*?: "운영 묶음 보기"[\s\S]*?: undefined/,
  "Library operational summary should expose a sourceVariant-aware combined operation cohort action when both Studio source and persistence metadata exist",
);
assertMatches(
  /function runSelectedOperationalSummaryAction\(\)[\s\S]*?actionKind === "source-detail"[\s\S]*?getElementById\("library-improvement-source-card"\)[\s\S]*?scrollIntoView[\s\S]*?actionKind === "handoff-improve"[\s\S]*?openTargetAiHandoffImprovementInStudio\(\)[\s\S]*?actionKind === "comparison"[\s\S]*?handlePromptDetailModeChange\("comparison"\)[\s\S]*?setTargetAiPackagePreviewOpen\(true\)/,
  "Library operational summary CTA should execute source, Studio improvement, comparison, and package preview actions",
);
assertMatches(
  /<p className="text-xs text-muted">운영 상태<\/p>[\s\S]*?selectedOperationalSummary\.actionKind[\s\S]*?runSelectedOperationalSummaryAction[\s\S]*?selectedOperationalSummary\.actionLabel[\s\S]*?selectedOperationalSummary\.groupActionHref[\s\S]*?selectedOperationalSummary\.groupActionLabel[\s\S]*?selectedOperationalSummary\.sourceActionHref[\s\S]*?selectedOperationalSummary\.sourceActionLabel[\s\S]*?selectedOperationalSummary\.persistenceActionHref[\s\S]*?selectedOperationalSummary\.persistenceActionLabel[\s\S]*?저장 방식[\s\S]*?출처[\s\S]*?체인[\s\S]*?selectedOperationalSummary\.sourceVariantLabel[\s\S]*?세부 초안 유형[\s\S]*?selectedOperationalSummary\.sourceTitle[\s\S]*?출처 제목/,
  "Library operational summary should show operation status, direct action, filter actions, persistence, source, sourceVariant, chain, and source-title labels in the detail panel",
);
assertMatches(
  /function buildSelectedOperationalSummaryReport\([\s\S]*?summary\.sourceOriginalHref && summary\.sourceOriginalActionLabel[\s\S]*?summary\.sourceOriginalHref[\s\S]*?# Library 운영 요약 · \$\{prompt\.title\}[\s\S]*?## 운영 상태[\s\S]*?summary\.nextAction[\s\S]*?summary\.handoffStatusLabel[\s\S]*?summary\.sourceVariantLabel[\s\S]*?`- 세부 초안 유형: \$\{summary\.sourceVariantLabel\}`[\s\S]*?summary\.sourceTitle \? `- 출처 제목: \$\{summary\.sourceTitle\}` : undefined[\s\S]*?summary\.sourceOriginalHref[\s\S]*?`- 원본 경로: \$\{baseUrl\}\$\{summary\.sourceOriginalHref\}`[\s\S]*?## 조건 링크[\s\S]*?## AI 전달 readiness/,
  "Library selected operational summary should build a shareable markdown report with sourceVariant, source title, and original sourceHref when available",
);
assertMatches(
  /sourceOriginalActionLabel: selectedStudioSourceLabel\?\.actionLabel[\s\S]*?sourceOriginalHref: selectedStudioSourceHref[\s\S]*?selectedStudioSourceHref[\s\S]*?selectedStudioSourceLabel\?\.actionLabel/,
  "Library operational summary should retain the original sourceHref and action label for copied reports",
);
assertMatches(
  /function copySelectedOperationalSummaryReport\(\)[\s\S]*?id: "selected-operational-summary-report"[\s\S]*?title: "선택 운영 요약 리포트"[\s\S]*?buildSelectedOperationalSummaryReport\([\s\S]*?detailHref: selectedDetailReturnHref[\s\S]*?readinessItems: activeTargetAiHandoffReadinessItems[\s\S]*?setSelectedOperationalSummaryReportCopiedFor\([\s\S]*?copiedToClipboard \? selected\.id : ""/,
  "Library selected operational summary should copy the selected prompt operation report with fallback metadata",
);
assertMatches(
  /function openSelectedOperationalSummaryReportInStudio\(\)[\s\S]*?const rawInput = buildSelectedOperationalSummaryReport\(\{[\s\S]*?detailHref: selectedDetailReturnHref[\s\S]*?readinessItems: activeTargetAiHandoffReadinessItems[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-operational-summary"[\s\S]*?rawInput[\s\S]*?sourceTitle: `운영 요약 · \$\{selected\.title\}`[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setSelectedOperationalSummaryReportCopiedFor\(""\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "selected-operational-summary-report"[\s\S]*?targetId: selected\.id[\s\S]*?title: "선택 운영 요약 리포트"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-operational-summary"\)/,
  "Library selected operational summary report should open in Studio with a stable source id and keep manual fallback when draft storage fails",
);
assertMatches(
  /function openTargetAiHandoffImprovementInStudio\(\)[\s\S]*?const rawInput = activeTargetAiHandoffImprovementBriefText[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-improvement"[\s\S]*?sourceVariant: "handoff-improvement"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setTargetAiImprovementBriefCopiedKey\(""\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "target-ai-improvement-brief"[\s\S]*?targetId: activeTargetAiPackageCopyKey[\s\S]*?title: "AI 전달 보강 브리프"[\s\S]*?body: rawInput[\s\S]*?setTargetAiPackagePreviewOpen\(true\)[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-improvement"\)/,
  "Library target AI handoff improvement draft should keep the preview-local manual fallback when draft storage fails",
);
assertMatches(
  /function openImprovementInStudio\(\)[\s\S]*?const rawInput = buildImprovementBrief\(\{[\s\S]*?actions: improvementActions[\s\S]*?version: activeVersion[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-improvement"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setImprovementBriefCopied\(false\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "improvement-brief"[\s\S]*?targetId: selected\.id[\s\S]*?title: "개선 브리프"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-improvement"\)/,
  "Library standard improvement draft should keep manual fallback when draft storage fails",
);
assertMatches(
  /function openFeedbackImprovementInStudio\(feedback: Feedback\)[\s\S]*?const rawInput = buildImprovementBrief\(\{[\s\S]*?feedback[\s\S]*?version: feedbackVersion[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?sourceVariant: "feedback-improvement"[\s\S]*?rawInput[\s\S]*?sourceFeedback:[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setManualCopy\(\{[\s\S]*?id: "improvement-brief"[\s\S]*?targetId: feedback\.id[\s\S]*?title: "피드백 개선 브리프"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-improvement"\)/,
  "Library feedback improvement draft should keep manual fallback when draft storage fails",
);
assertMatches(
  /function openComparisonImprovementInStudio\(\)[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?rawInput: selectedPromptComparisonBrief[\s\S]*?goal: "프롬프트 재개선"[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setComparisonBriefCopied\(false\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "comparison-brief"[\s\S]*?targetId: selected\.id[\s\S]*?title: "비교 브리프"[\s\S]*?body: selectedPromptComparisonBrief[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-improvement"\)/,
  "Library comparison improvement draft should keep manual fallback when draft storage fails",
);
assertMatches(
  /function copySelectedOperationalSummaryFilterLink\([\s\S]*?conditionLabel: string[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?const copyBody = \[[\s\S]*?프롬프트: \$\{selected\.title\}[\s\S]*?저장 방식: \$\{selectedOperationalSummary\.persistenceLabel\}[\s\S]*?저장 출처: \$\{selectedOperationalSummary\.sourceLabel\}[\s\S]*?출처 제목: \$\{selectedOperationalSummary\.sourceTitle\}[\s\S]*?세부 초안 유형: \$\{selectedOperationalSummary\.sourceVariantLabel\}[\s\S]*?조건: \$\{conditionLabel\}[\s\S]*?targetId: selected\.id[\s\S]*?body: copyBody[\s\S]*?setCopiedFor\(copiedToClipboard \? selected\.id : ""\)/,
  "Library selected operational summary should share a reusable selected-prompt filter link copier with prompt, saved-source, source-title, sourceVariant, and condition fallback metadata",
);
assertMatches(
  /selectedStudioOperationalGroupLinkTitle = selectedStudioSourceHasVariant[\s\S]*?"같은 세부 유형 운영 묶음 조건 링크"[\s\S]*?: "같은 운영 묶음 조건 링크"[\s\S]*?function copySelectedOperationalGroupFilterLink\(\)[\s\S]*?conditionLabel: selectedStudioSourceHasVariant[\s\S]*?"같은 세부 유형 운영 묶음"[\s\S]*?: "같은 운영 묶음"[\s\S]*?href: selectedStudioOperationalGroupHref[\s\S]*?id: "selected-operational-group-link"[\s\S]*?title: selectedStudioOperationalGroupLinkTitle/,
  "Library selected operational summary should copy a sourceVariant-aware exact operation cohort link",
);
assertMatches(
  /selectedStudioSourceLinkTitle = selectedStudioSourceHasVariant[\s\S]*?"같은 세부 유형 출처 조건 링크"[\s\S]*?: "같은 저장 출처 조건 링크"[\s\S]*?function copySelectedOperationalSourceFilterLink\(\)[\s\S]*?conditionLabel: selectedStudioSourceHasVariant[\s\S]*?"같은 세부 유형 출처"[\s\S]*?: "같은 저장 출처"[\s\S]*?href: selectedStudioSourceFilterHref[\s\S]*?id: "selected-operational-source-link"[\s\S]*?title: selectedStudioSourceLinkTitle/,
  "Library selected operational summary should copy a sourceVariant-aware saved-source link",
);
assertMatches(
  /function copySelectedOperationalPersistenceFilterLink\(\)[\s\S]*?conditionLabel: "같은 저장 방식"[\s\S]*?href: selectedStudioPersistenceFilterHref[\s\S]*?id: "selected-operational-persistence-link"[\s\S]*?title: "같은 저장 방식 조건 링크"/,
  "Library selected operational summary should copy a storage-mode link",
);
assertMatches(
  /data-testid="library-selected-operational-summary"[\s\S]*?library-selected-operational-summary-report-copy[\s\S]*?운영 요약 복사[\s\S]*?library-selected-operational-summary-studio[\s\S]*?요약 Studio로[\s\S]*?library-selected-operational-group-link-copy[\s\S]*?selectedStudioOperationalGroupLinkCopyLabel[\s\S]*?library-selected-operational-source-link-copy[\s\S]*?selectedStudioSourceLinkCopyLabel[\s\S]*?library-selected-operational-persistence-link-copy[\s\S]*?저장 방식 링크 복사[\s\S]*?manualCopy\.id === "selected-operational-group-link"[\s\S]*?manualCopy\.id === "selected-operational-source-link"[\s\S]*?manualCopy\.id ===[\s\S]*?"selected-operational-persistence-link"[\s\S]*?manualCopy\.id ===[\s\S]*?"selected-operational-summary-report"[\s\S]*?LibraryManualCopyPanel/,
  "Library selected operational summary should expose sourceVariant-aware shareable operation, source, and persistence links with local fallback",
);
assertMatches(
  /function copySourceReasonFilterLink\(\)[\s\S]*?sourceReason: sourceReasonFilter[\s\S]*?promptId: ""[\s\S]*?id: "source-health-filter-link"[\s\S]*?title: "출처 사유 조건 링크"[\s\S]*?setFilterLinkCopied\(copiedToClipboard\)/,
  "Library source-health action panel should copy a shareable source-reason condition link",
);
assertMatches(
  /function buildSourceReasonFilterReport\(\{[\s\S]*?baseUrl[\s\S]*?const formatReportHref = \(href: string\) =>[\s\S]*?formatAbsoluteInternalHref\(href, baseUrl\)[\s\S]*?상세 링크: \$\{formatReportHref\(detailHref\)\}[\s\S]*?Library 필터 링크: \$\{formatReportHref\(filterHref\)\}/,
  "Library source-health action report should format filter and candidate detail links through the shared absolute href helper",
);
assertMatches(
  /function buildSourceReasonCandidateNote\(\{[\s\S]*?baseUrl[\s\S]*?const formatCandidateHref = \(href: string\) =>[\s\S]*?formatAbsoluteInternalHref\(href, baseUrl\)[\s\S]*?상세 링크: \$\{formatCandidateHref\(detailHref\)\}/,
  "Library source-health candidate notes should format detail links through the shared absolute href helper",
);
assertMatches(
  /async function copySourceReasonCandidateLink\([\s\S]*?candidate: \(typeof sourceReasonActionCandidates\)\[number\][\s\S]*?formatAbsoluteInternalHref\(candidate\.detailHref, window\.location\.origin\)[\s\S]*?id: "source-health-candidate-link"[\s\S]*?title: "출처 후보 상세 링크"[\s\S]*?setSourceHealthCandidateLinkCopiedId/,
  "Library source-health candidate cards should copy absolute detail links with fallback metadata",
);
assertMatches(
  /function openSourceReasonFilterReportInStudio\(\)[\s\S]*?const rawInput = buildSourceReasonFilterReport\(\{[\s\S]*?reason: sourceReasonFilter[\s\S]*?resultPrompts: filtered[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-source-health-filter"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setSourceHealthReportCopied\(false\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "source-health-filter-report"[\s\S]*?title: "출처 사유 조치 리포트"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-source-health-filter"\)/,
  "Library source-health filter report should keep manual fallback when draft storage fails",
);
assertMatches(
  /function openSourceReasonCandidateInStudio\([\s\S]*?candidate: \(typeof sourceReasonActionCandidates\)\[number\][\s\S]*?const rawInput = candidate\.note[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-source-health-candidate"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setSourceHealthCandidateCopiedId\(""\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "source-health-candidate-note"[\s\S]*?targetId: candidate\.id[\s\S]*?title: "출처 후보 메모"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-source-health-candidate"\)/,
  "Library source-health candidates should keep manual fallback when draft storage fails",
);
assertMatches(
  /data-testid="library-source-reason-action"[\s\S]*?출처 사유 조치[\s\S]*?현재[\s\S]*?Library 결과 \{filtered\.length\}개를 복원\/백업 확인 리포트로[\s\S]*?library-source-reason-action-link[\s\S]*?출처 사유 링크 복사[\s\S]*?조치 리포트 복사[\s\S]*?Studio로 보내기[\s\S]*?data-testid="library-source-reason-candidates"[\s\S]*?href=\{candidate\.detailHref\}[\s\S]*?보기[\s\S]*?data-testid="library-source-reason-candidate-link"[\s\S]*?상세 링크 복사됨[\s\S]*?상세 링크 복사[\s\S]*?manualCopy\?\.id === "source-health-filter-link"[\s\S]*?LibraryManualCopyPanel/,
  "Library source-health action panel should show source-reason link copy, candidate detail navigation/link copy, fallback, report, and Studio actions",
);
assertFileIncludes(
  readme,
  "Library의 출처 사유 조치 패널도 같은 기준으로 대표 후보를 상세 화면으로 바로 열거나 후보 상세 링크를 절대 URL로 복사",
  "README should document Library source-reason candidate detail navigation and link copy",
);
assertFileIncludes(
  readme,
  "`sourceVariant`가 있으면 완료 확인, 피드백 개선, AI 전달 보강처럼 세부 초안 유형까지 반영한 라벨",
  "README should document Library saved-source cards using sourceVariant-aware labels",
);
assertFileIncludes(
  readme,
  "sourceVariant가 있는 저장본은 같은 세부 유형 출처/묶음 조건 링크로 표시하고 절대 URL 복사 문구도 세부 유형 기준으로 구분",
  "README should document sourceVariant-aware Library list/detail filter link labels and copy wording",
);
assertFileIncludes(
  readme,
  "Library의 Studio 저장 출처 리포트, 운영 묶음 리포트, 저장 출처 후보 메모도 sourceVariant가 있으면 `세부 초안 유형`을 포함",
  "README should document Library saved-source reports and candidate notes including sourceVariant labels",
);
assertFileIncludes(
  readme,
  "Library의 Studio 저장 방식 필터, Studio 저장 출처 필터, 운영 묶음 패널도 sourceVariant 세부 초안 유형 count를 표시하고 각 세부 유형 필터 링크를 열거나 절대 URL로 복사",
  "README should document Library storage-mode, saved-source, and operation cohort panels showing sourceVariant counts with link navigation and copy actions",
);
assertFileIncludes(
  readme,
  "세부 초안 유형 필터는 `studioVariant` URL 조건으로 공유",
  "README should document the shareable Library studioVariant filter",
);
assertMatches(
  /function copySelectedStudioPersistenceFilterLink\(\)[\s\S]*?selectedStudioPersistenceFilterHref[\s\S]*?const copyBody = \[[\s\S]*?프롬프트: \$\{selected\.title\}[\s\S]*?저장 방식: \$\{selectedStudioPersistenceLabel\}[\s\S]*?저장 출처: \$\{selectedStudioSourceLabel\.label\}[\s\S]*?출처 제목: \$\{selectedStudioSource\.sourceTitle\}[\s\S]*?세부 초안 유형: \$\{selectedOperationalSummary\.sourceVariantLabel\}[\s\S]*?조건: 같은 저장 방식[\s\S]*?id: "selected-studio-persistence-link"[\s\S]*?title: "같은 저장 방식 조건 링크"[\s\S]*?body: copyBody[\s\S]*?setSelectedStudioPersistenceLinkCopiedFor\([\s\S]*?copiedToClipboard \? selected\.id : ""[\s\S]*?\)/,
  "Library no-source-meta/detail storage-mode filter link should copy with prompt, saved-source, source-title, sourceVariant, and condition fallback metadata",
);
assertMatches(
  /저장 출처 메타 없음[\s\S]*?저장 출처 없음 메모 복사[\s\S]*?Studio로 보내기[\s\S]*?selectedStudioPersistenceFilterHref[\s\S]*?library-no-source-meta-persistence-link[\s\S]*?저장 방식 링크 복사[\s\S]*?같은 저장 방식 보기[\s\S]*?manualCopy\?\.id ===[\s\S]*?"selected-studio-persistence-link"[\s\S]*?LibraryManualCopyPanel/,
  "Library no-source-meta detail card should expose saved-source metadata wording, storage-mode link copy, fallback, and navigation actions",
);
assertMatches(
  /function openNoSourceMetaNoteInStudio\(\)[\s\S]*?const noteText = buildNoSourceMetaNote\(\{[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-no-source-meta"[\s\S]*?rawInput: noteText[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setNoSourceMetaNoteCopiedFor\(""\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "no-source-meta-note"[\s\S]*?targetId: selected\.id[\s\S]*?title: "저장 출처 없음 메모"[\s\S]*?body: noteText[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-no-source-meta"\)/,
  "Library no-source-meta detail draft should keep manual fallback when draft storage fails",
);
assertMatches(
  /function copySelectedStudioSourceFilterLink\(\)[\s\S]*?selectedStudioSourceFilterHref[\s\S]*?const copyBody = \[[\s\S]*?프롬프트: \$\{selected\.title\}[\s\S]*?저장 방식: \$\{selectedStudioPersistenceLabel\}[\s\S]*?저장 출처: \$\{selectedStudioSourceLabel\.label\}[\s\S]*?출처 제목: \$\{selectedStudioSource\.sourceTitle\}[\s\S]*?세부 초안 유형: \$\{selectedOperationalSummary\.sourceVariantLabel\}[\s\S]*?조건: \$\{[\s\S]*?selectedStudioSourceHasVariant \? "같은 세부 유형 출처" : "같은 저장 출처"[\s\S]*?id: "selected-studio-source-link"[\s\S]*?title: selectedStudioSourceLinkTitle[\s\S]*?body: copyBody[\s\S]*?setSelectedStudioSourceLinkCopiedFor\(copiedToClipboard \? selected\.id : ""\)/,
  "Library selected Studio source detail card should copy the selected prompt's sourceVariant-aware saved-source filter link with prompt, saved-source, source-title, sourceVariant, and condition fallback metadata",
);
assertMatches(
  /selectedStudioSource && selectedStudioSourceLabel[\s\S]*?Studio 저장 출처[\s\S]*?library-selected-studio-source-link-copy[\s\S]*?selectedStudioSourceLinkCopiedLabel[\s\S]*?selectedStudioSourceLinkFailedLabel[\s\S]*?selectedStudioSourceLinkCopyLabel[\s\S]*?selectedStudioSourceLinkOpenLabel[\s\S]*?manualCopy\?\.id === "selected-studio-source-link"[\s\S]*?LibraryManualCopyPanel/,
  "Library selected Studio source detail card should expose sourceVariant-aware saved-source link copy, fallback, and navigation actions",
);
assertMatches(
  /function copySelectedStudioSourceOriginalLink\(\)[\s\S]*?selectedStudioSourceHref[\s\S]*?formatAbsoluteInternalHref\([\s\S]*?selectedStudioSourceHref[\s\S]*?const copyBody = \[[\s\S]*?프롬프트: \$\{selected\.title\}[\s\S]*?저장 출처: \$\{selectedStudioSourceLabel\.label\}[\s\S]*?출처 제목: \$\{selectedStudioSource\.sourceTitle\}[\s\S]*?원본 경로: \$\{selectedStudioSourceHref\}[\s\S]*?id: "selected-studio-source-original-link"[\s\S]*?title: "원본 경로 링크"[\s\S]*?body: copyBody[\s\S]*?setSelectedStudioSourceOriginalLinkCopiedFor/,
  "Library selected Studio source detail card should copy the original sourceHref as an absolute URL with fallback metadata",
);
assertMatches(
  /selectedStudioSourceHref[\s\S]*?원본 경로 · \{selectedStudioSourceHref\}[\s\S]*?library-selected-studio-source-original-link-copy[\s\S]*?원본 링크 복사됨[\s\S]*?원본 링크 복사 실패[\s\S]*?원본 링크 복사[\s\S]*?href=\{selectedStudioSourceHref\}[\s\S]*?\{selectedStudioSourceLabel\.actionLabel\}[\s\S]*?manualCopy\?\.id ===[\s\S]*?"selected-studio-source-original-link"[\s\S]*?LibraryManualCopyPanel/,
  "Library selected Studio source detail card should show the original sourceHref, copy it, navigate to it, and expose fallback UI",
);
assertMatches(
  /selectedStudioSource && selectedStudioSourceLabel[\s\S]*?Studio 저장 출처[\s\S]*?library-selected-studio-persistence-link-copy[\s\S]*?저장 방식 링크 복사[\s\S]*?같은 저장 방식 보기[\s\S]*?manualCopy\?\.id ===[\s\S]*?"selected-studio-persistence-link"[\s\S]*?LibraryManualCopyPanel/,
  "Library selected Studio source detail card should expose storage-mode link copy, fallback, and navigation actions",
);
assertMatches(
  /id: "studio-source"[\s\S]*?label: `Studio 저장 출처 \$\{getStudioSourceFilterLabel\(studioSourceFilter\)\}`[\s\S]*?removeLabel: "Studio 저장 출처 필터 해제"/,
  "Library active filter chips should use saved-source wording for Studio source filters",
);
assertMatches(
  /function getStudioSourceFilterLabel\(source: StudioSourceFilter\)[\s\S]*?\? "전체 Studio 저장 출처"/,
  "Library Studio source filter should label the all option as saved source",
);
assertMatches(
  /import \{ getStudioDraftDisplaySourceLabel \} from "@\/lib\/studio\/draft-display";[\s\S]*?function getPromptStudioSourceMetaLibraryLabel\([\s\S]*?studioSource: PromptStudioSourceMeta[\s\S]*?getStudioDraftDisplaySourceLabel\(studioSource\)[\s\S]*?actionLabel: displayLabel\.sourceActionLabel[\s\S]*?label: displayLabel\.label/,
  "Library should derive saved-source display labels from Studio source metadata variants",
);
assertMatches(
  /function getPromptStudioSourceVariantLabel\([\s\S]*?studioSource: PromptStudioSourceMeta \| undefined[\s\S]*?studioSource\?\.sourceVariant[\s\S]*?getPromptStudioSourceMetaLibraryLabel\(studioSource\)\.label/,
  "Library should expose a helper for optional sourceVariant labels in copied saved-source reports",
);
assertMatches(
  /function summarizePromptStudioSourceVariantLabels\(prompts: PromptAsset\[\]\)[\s\S]*?summarizePromptStudioSourceVariantItems\(prompts\)\.map[\s\S]*?\$\{label\} \$\{count\}개/,
  "Library should format sourceVariant labels for saved-source filter reports",
);
assertMatches(
  /promptStudioDraftSourceVariants[\s\S]*?type StudioSourceVariantFilter = PromptStudioDraftSourceVariant \| "all"[\s\S]*?studioSourceVariantFilterModes[\s\S]*?getStudioSourceVariantFilterLabel/,
  "Library should define Studio sourceVariant filter modes and labels from prompt source variants",
);
assertMatches(
  /studioVariant = "all"[\s\S]*?studioVariant\?: StudioSourceVariantFilter[\s\S]*?params\.set\("studioVariant", studioVariant\)/,
  "Library filter href builder should preserve sourceVariant filters in shareable URLs",
);
assertMatches(
  /initialStudioSourceVariantFilter[\s\S]*?useState<StudioSourceVariantFilter>[\s\S]*?studioSourceVariantFilter !== "all"[\s\S]*?id: "studio-variant"[\s\S]*?세부 초안 유형/,
  "Library should initialize and expose an active chip for the sourceVariant filter",
);
assertMatches(
  /studioSourceVariantFilterCounts[\s\S]*?prompt\.studioSource\?\.sourceVariant[\s\S]*?handleStudioSourceVariantFilterChange[\s\S]*?Field label="세부 초안 유형"/,
  "Library should count and render the sourceVariant filter select",
);
assertMatches(
  /const matchesStudioSourceVariant =[\s\S]*?studioSourceVariantFilter === "all"[\s\S]*?prompt\.studioSource\?\.sourceVariant === studioSourceVariantFilter[\s\S]*?matchesStudioSourceVariant/,
  "Library should apply sourceVariant filtering to the prompt list",
);
assertFileIncludes(
  libraryPageSource,
  "promptStudioDraftSourceVariants",
  "Library page should import prompt source variant modes for URL parsing",
);
assertFileIncludes(
  libraryPageSource,
  "normalizeStudioSourceVariantFilter",
  "Library page should normalize the studioVariant URL parameter",
);
assertFileIncludes(
  libraryPageSource,
  "params.studioVariant",
  "Library page should read the studioVariant URL parameter",
);
assertMatches(
  /prompt\.studioSource[\s\S]*?\? getPromptStudioSourceMetaLibraryLabel\(prompt\.studioSource\)\.label[\s\S]*?: undefined[\s\S]*?const sourceLabel = prompt\.studioSource[\s\S]*?\? getPromptStudioSourceMetaLibraryLabel\(prompt\.studioSource\)\.label[\s\S]*?: "Studio 출처 없음"[\s\S]*?const selectedStudioSourceLabel = selectedStudioSource[\s\S]*?\? getPromptStudioSourceMetaLibraryLabel\(selectedStudioSource\)[\s\S]*?: undefined[\s\S]*?const listStudioSourceLabel = prompt\.studioSource[\s\S]*?\? getPromptStudioSourceMetaLibraryLabel\(prompt\.studioSource\)/,
  "Library search, source candidates, detail, and list cards should use variant-aware saved-source labels",
);
assertIncludes(
  "Studio 저장 출처 메타가 아직 없는 저장본입니다.",
  "Library storage-mode descriptions should use saved-source metadata wording for missing Studio source metadata",
);
assertIncludes(
  "Studio 저장 출처 메타로만 추적됩니다.",
  "Library selected source detail should use saved-source metadata wording for operational-source saves",
);
assertMatches(
  /Studio 저장 출처 · \{listStudioSourceLabel\.label\}/,
  "Library list cards should label Studio source metadata as saved source",
);
assertMatches(
  /source:[\s\S]*?studioPersistenceFilter === "none"[\s\S]*?"library-missing-source-metadata-queue"[\s\S]*?"library-studio-persistence-filter"[\s\S]*?studioPersistenceFilter === "none"[\s\S]*?"저장 출처 메타 없음 큐 운영 기준 정리"[\s\S]*?"Studio 저장 방식 운영 기준 정리"[\s\S]*?sourceTitle/,
  "Library Studio persistence reports should open Studio drafts with storage-mode wording and a missing saved-source metadata queue goal",
);
assertMatches(
  /function openStudioPersistenceFilterReportInStudio\(\)[\s\S]*?const rawInput = buildStudioPersistenceFilterReport\(\{[\s\S]*?filter: studioPersistenceFilter[\s\S]*?resultPrompts: filtered[\s\S]*?const draftHref =[\s\S]*?library-missing-source-metadata-queue[\s\S]*?library-studio-persistence-filter[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setStudioPersistenceReportCopied\(false\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "studio-persistence-report"[\s\S]*?저장 출처 메타 없음 큐 리포트[\s\S]*?Studio 저장 방식 리포트[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\(draftHref\)/,
  "Library Studio persistence reports should keep manual fallback when draft storage fails",
);
assertMatches(
  /source:[\s\S]*?studioPersistenceFilter === "none"[\s\S]*?"library-missing-source-metadata-candidate"[\s\S]*?"library-studio-persistence-candidate"[\s\S]*?studioPersistenceFilter === "none"[\s\S]*?"저장 출처 메타 없음 후보 관리 기준 정리"[\s\S]*?"Studio 저장 방식 후보 관리 기준 정리"[\s\S]*?sourceTitle/,
  "Library Studio persistence candidates should open Studio drafts with storage-mode wording and a missing saved-source metadata candidate goal",
);
assertMatches(
  /function openStudioPersistenceCandidateInStudio\([\s\S]*?candidate: \(typeof studioPersistenceActionCandidates\)\[number\][\s\S]*?const rawInput = candidate\.note[\s\S]*?const draftHref =[\s\S]*?library-missing-source-metadata-candidate[\s\S]*?library-studio-persistence-candidate[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setStudioPersistenceCandidateCopiedId\(""\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "studio-persistence-candidate-note"[\s\S]*?targetId: candidate\.id[\s\S]*?저장 출처 메타 없음 후보 메모[\s\S]*?Studio 저장 방식 후보 메모[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\(draftHref\)/,
  "Library Studio persistence candidates should keep manual fallback when draft storage fails",
);
assertMatches(
  /function copyStudioPersistenceFilterLink\(\)[\s\S]*?studioPersistence: studioPersistenceFilter[\s\S]*?studioSource: studioSourceFilter[\s\S]*?promptId: ""[\s\S]*?id: "studio-persistence-link"[\s\S]*?"저장 출처 메타 없음 큐 링크"[\s\S]*?"Studio 저장 방식 조건 링크"[\s\S]*?setFilterLinkCopied\(copiedToClipboard\)/,
  "Library Studio persistence action panel should copy a shareable storage-mode condition link and queue link for missing saved-source metadata",
);
assertMatches(
  /data-testid="library-studio-persistence-action"[\s\S]*?저장 출처 메타 없음 큐[\s\S]*?Studio 저장 방식 조치[\s\S]*?현재 Library 결과 \$\{filtered\.length\}개를 저장 출처 메타 없음 큐로 정리합니다\.[\s\S]*?현재 Library 결과 \$\{filtered\.length\}개를 저장 방식 리포트로 정리합니다\.[\s\S]*?renderStudioVariantSummaryLinks\([\s\S]*?studioPersistenceVariantSummaryLinks[\s\S]*?library-studio-persistence-action-link[\s\S]*?큐 링크 복사[\s\S]*?저장 방식 링크 복사[\s\S]*?큐 리포트 복사[\s\S]*?저장 방식 리포트 복사[\s\S]*?Studio로 보내기[\s\S]*?manualCopy\?\.id === "studio-persistence-link"[\s\S]*?LibraryManualCopyPanel/,
  "Library Studio persistence action panel should clearly describe missing saved-source metadata queue, storage-mode variant summary links, link, report, fallback, and Studio actions",
);
assertMatches(
  /function buildStudioPersistenceFilterReport[\s\S]*?const sourceVariantLabel = getPromptStudioSourceVariantLabel\([\s\S]*?prompt\.studioSource[\s\S]*?Studio 출처: \$\{sourceTitle\}[\s\S]*?세부 초안 유형: \$\{sourceVariantLabel\}[\s\S]*?const sourceVariantSummary =[\s\S]*?summarizePromptStudioSourceVariantLabels\(resultPrompts\)[\s\S]*?저장 방식: \$\{studioPersistenceFilterLabels\[filter\]\}[\s\S]*?세부 초안 유형: \$\{sourceVariantSummary\.join\(", "\)\}/,
  "Library Studio persistence reports should include sourceVariant row labels and summary counts",
);
assertMatches(
  /function buildStudioPersistenceCandidateNote[\s\S]*?const sourceVariantLabel = getPromptStudioSourceVariantLabel\([\s\S]*?prompt\.studioSource[\s\S]*?현재 저장 방식: \$\{sourceLabel\}[\s\S]*?Studio 출처: \$\{sourceTitle\}[\s\S]*?세부 초안 유형: \$\{sourceVariantLabel\}/,
  "Library Studio persistence candidate notes should include sourceVariant labels",
);
assertMatches(
  /const studioPersistenceActionCandidates = useMemo[\s\S]*?const sourceVariantLabel = getPromptStudioSourceVariantLabel\([\s\S]*?prompt\.studioSource[\s\S]*?sourceVariantLabel,[\s\S]*?data-testid="library-studio-persistence-candidates"[\s\S]*?candidate\.sourceVariantLabel[\s\S]*?세부 유형 · \{candidate\.sourceVariantLabel\}/,
  "Library Studio persistence candidate cards should show sourceVariant labels next to each representative candidate",
);
assertIncludes(
  "# Library 저장 출처 메타 없음 큐 리포트",
  "Library storage-mode reports should title the no-source metadata queue distinctly",
);
assertIncludes(
  "# Library 저장 출처 메타 없음 후보 메모",
  "Library storage-mode candidate notes should title missing saved-source metadata candidates distinctly",
);
assertMatches(
  /library-studio-persistence-candidate-copy[\s\S]*?후보 메모 복사[\s\S]*?메모 복사[\s\S]*?library-studio-persistence-candidate-studio/,
  "Library storage-mode candidate cards should use candidate memo wording for missing saved-source metadata queues",
);
assertIncludes(
  "Studio 출처 없음 항목은 저장 출처 메타를 다시 부여할지, 레거시 저장본으로 유지할지 결정합니다.",
  "Library storage-mode reports should guide missing saved-source metadata review",
);
assertMatches(
  /function copyStudioSourceFilterLink\(\)[\s\S]*?studioPersistence: studioPersistenceFilter[\s\S]*?studioSource: studioSourceFilter[\s\S]*?promptId: ""[\s\S]*?id: "studio-source-link"[\s\S]*?title: "Studio 저장 출처 조건 링크"[\s\S]*?setFilterLinkCopied\(copiedToClipboard\)/,
  "Library Studio source action panel should copy a shareable saved-source condition link",
);
assertMatches(
  /function openStudioOperationalGroupReportInStudio\(\)[\s\S]*?const rawInput = buildStudioOperationalGroupReport\(\{[\s\S]*?persistenceFilter: studioPersistenceFilter[\s\S]*?sourceFilter: studioSourceFilter[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-studio-operational-group"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setStudioOperationalGroupReportCopied\(false\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "studio-operational-group-report"[\s\S]*?title: "Studio 운영 묶음 리포트"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-studio-operational-group"\)/,
  "Library Studio operational group report should keep manual fallback when draft storage fails",
);
assertMatches(
  /function openStudioSourceFilterReportInStudio\(\)[\s\S]*?const rawInput = buildStudioSourceFilterReport\(\{[\s\S]*?filter: studioSourceFilter[\s\S]*?resultPrompts: filtered[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-studio-source-filter"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setStudioSourceReportCopied\(false\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "studio-source-report"[\s\S]*?title: "Studio 저장 출처 리포트"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-studio-source-filter"\)/,
  "Library Studio source report should keep manual fallback when draft storage fails",
);
assertMatches(
  /function openStudioSourceCandidateInStudio\([\s\S]*?candidate: \(typeof studioSourceActionCandidates\)\[number\][\s\S]*?const rawInput = candidate\.note[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "library-studio-source-candidate"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setStudioSourceCandidateCopiedId\(""\)[\s\S]*?setManualCopy\(\{[\s\S]*?id: "studio-source-candidate-note"[\s\S]*?targetId: candidate\.id[\s\S]*?title: "Studio 저장 출처 후보 메모"[\s\S]*?body: rawInput[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=library-studio-source-candidate"\)/,
  "Library Studio source candidates should keep manual fallback when draft storage fails",
);
assertMatches(
  /data-testid="library-studio-source-action"[\s\S]*?Studio 저장 출처 조치[\s\S]*?현재[\s\S]*?Library 결과 \{filtered\.length\}개를 저장 출처 리포트로[\s\S]*?renderStudioVariantSummaryLinks\(studioSourceVariantSummaryLinks\)[\s\S]*?library-studio-source-action-link[\s\S]*?저장 출처 링크 복사[\s\S]*?저장 출처 리포트 복사[\s\S]*?Studio로 보내기[\s\S]*?manualCopy\?\.id === "studio-source-link"[\s\S]*?LibraryManualCopyPanel/,
  "Library Studio source action panel should clearly describe saved-source link, variant summary links, report, fallback, and Studio actions",
);
assertMatches(
  /const studioSourceActionCandidates = useMemo[\s\S]*?const sourceVariantLabel = getPromptStudioSourceVariantLabel\([\s\S]*?prompt\.studioSource[\s\S]*?sourceVariantLabel,[\s\S]*?data-testid="library-studio-source-candidates"[\s\S]*?candidate\.sourceVariantLabel[\s\S]*?세부 유형 · \{candidate\.sourceVariantLabel\}/,
  "Library Studio source candidate cards should show sourceVariant labels next to each representative candidate",
);
assertMatches(
  /function buildStudioSourceFilterReport[\s\S]*?const sourceVariantLabel = getPromptStudioSourceVariantLabel\([\s\S]*?prompt\.studioSource[\s\S]*?Studio 저장 출처:[\s\S]*?세부 초안 유형: \$\{sourceVariantLabel\}[\s\S]*?const sourceVariantSummary =[\s\S]*?summarizePromptStudioSourceVariantLabels\(resultPrompts\)[\s\S]*?# Library Studio 저장 출처 리포트[\s\S]*?세부 초안 유형: \$\{sourceVariantSummary\.join\(", "\)\}[\s\S]*?같은 저장 출처에서 저장된 프롬프트/,
  "Library Studio source report should include sourceVariant row labels, summary counts, and saved-source wording",
);
assertMatches(
  /function buildStudioOperationalGroupReport[\s\S]*?const sourceVariantLabel = getPromptStudioSourceVariantLabel\([\s\S]*?prompt\.studioSource[\s\S]*?Studio 저장 출처: \$\{getStudioSourceFilterLabel\(sourceFilter\)\}[\s\S]*?세부 초안 유형: \$\{sourceVariantLabel\}[\s\S]*?const sourceVariantSummary =[\s\S]*?summarizePromptStudioSourceVariantLabels\(resultPrompts\)[\s\S]*?# Library Studio 운영 묶음 리포트[\s\S]*?저장 출처: \$\{getStudioSourceFilterLabel\(sourceFilter\)\}[\s\S]*?세부 초안 유형: \$\{sourceVariantSummary\.join\(", "\)\}[\s\S]*?같은 저장 출처와 같은 저장 방식/,
  "Library should build a combined Studio operation cohort report with sourceVariant row labels, summary counts, and saved-source wording",
);
assertMatches(
  /function buildStudioSourceCandidateNote[\s\S]*?const sourceVariantLabel = getPromptStudioSourceVariantLabel\([\s\S]*?prompt\.studioSource[\s\S]*?# Library Studio 저장 출처 후보 메모[\s\S]*?필터 저장 출처:[\s\S]*?현재 저장 출처:[\s\S]*?세부 초안 유형:[\s\S]*?sourceTitle\/sourceHref/,
  "Library Studio source candidate notes should include sourceVariant labels and use saved-source wording",
);
assertMatches(
  /function openStudioSourceCandidateInStudio\([\s\S]*?source: "library-studio-source-candidate"[\s\S]*?goal: "Studio 저장 출처 후보 관리 기준 정리"[\s\S]*?sourceTitle: `Studio 저장 출처 후보 · \$\{candidate\.title\}`/,
  "Library Studio source candidates should open Studio drafts with saved-source wording",
);
assertMatches(
  /function copyStudioOperationalGroupFilterLink\(\)[\s\S]*?studioPersistence: studioPersistenceFilter[\s\S]*?studioSource: studioSourceFilter[\s\S]*?promptId: ""[\s\S]*?id: "studio-operational-group-link"[\s\S]*?title: "Studio 운영 묶음 조건 링크"[\s\S]*?setFilterLinkCopied\(copiedToClipboard\)/,
  "Library combined operation cohort panel should copy a shareable filter link without binding a selected prompt",
);
assertMatches(
  /data-testid="library-studio-operational-group-action"[\s\S]*?Studio 운영 묶음 조치[\s\S]*?조건이 함께[\s\S]*?운영 묶음[\s\S]*?리포트로 정리합니다[\s\S]*?renderStudioVariantSummaryLinks\(studioSourceVariantSummaryLinks\)[\s\S]*?library-studio-operational-group-action-link[\s\S]*?운영 묶음 링크 복사[\s\S]*?운영 묶음 리포트 복사[\s\S]*?Studio로 보내기[\s\S]*?manualCopy\?\.id === "studio-operational-group-link"[\s\S]*?LibraryManualCopyPanel/,
  "Library should show combined operation cohort variant summary links, link copy, local fallback, report copy, and Studio actions when source and persistence filters are both active",
);
assertMatches(
  /function summarizePromptStudioSourceVariantLabels\(prompts: PromptAsset\[\]\)[\s\S]*?summarizePromptStudioSourceVariantItems\(prompts\)[\s\S]*?function summarizePromptStudioSourceVariantItems\(prompts: PromptAsset\[\]\)[\s\S]*?PromptStudioDraftSourceVariant[\s\S]*?sourceVariant = prompt\.studioSource\?\.sourceVariant[\s\S]*?right\.count - left\.count/,
  "Library should derive sourceVariant summary items from sourceVariant IDs before formatting text summaries",
);
assertMatches(
  /studioSourceVariantSummaryLinks[\s\S]*?summarizePromptStudioSourceVariantItems\(filtered\)\.map\(\(item\)[\s\S]*?studioVariant: item\.sourceVariant[\s\S]*?studioPersistenceVariantSummaryLinks[\s\S]*?studioVariant: item\.sourceVariant/,
  "Library should build shareable sourceVariant filter hrefs for saved-source and storage-mode summary links",
);
assertMatches(
  /async function copyStudioVariantFilterLink\(\{[\s\S]*?sourceVariant: PromptStudioDraftSourceVariant[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?id: "studio-variant-link"[\s\S]*?targetId: sourceVariant[\s\S]*?세부 초안 유형 조건 링크[\s\S]*?setStudioVariantLinkCopiedFor/,
  "Library sourceVariant summary links should copy absolute URLs with manual fallback metadata",
);
assertMatches(
  /function renderStudioVariantSummaryLinks\([\s\S]*?세부 초안 유형[\s\S]*?href=\{variant\.href\}[\s\S]*?\{variant\.label\} \{variant\.count\}개[\s\S]*?data-testid="library-studio-variant-filter-link-copy"[\s\S]*?copyStudioVariantFilterLink\(variant\)[\s\S]*?복사됨[\s\S]*?실패[\s\S]*?manualCopy\?\.id === "studio-variant-link"[\s\S]*?LibraryManualCopyPanel/,
  "Library action panels should render sourceVariant summary links with per-variant copy actions and fallback UI",
);
assertMatches(
  /function openStudioOperationalGroupReportInStudio\(\)[\s\S]*?source: "library-studio-operational-group"[\s\S]*?router\.push\("\/studio\?draft=library-studio-operational-group"\)/,
  "Library combined operation cohort report should open in Studio with a stable source id",
);
assertFileIncludes(
  promptTypesSource,
  '"library-operational-summary"',
  "Prompt Studio draft source list should include the Library selected operation summary source",
);
assertFileIncludes(
  sourceRegistrySource,
  '"library-operational-summary"',
  "Prompt Studio source registry should label the Library selected operation summary source",
);
assertFileIncludes(
  sourceRegistrySource,
  '"skills-improvement-plan"',
  "Prompt Studio source registry should include the Skills improvement plan source for Library saved-source labels",
);
assertFileIncludes(
  sourceRegistrySource,
  'librarySourceLabel: "Skills 스킬 개선 계획"',
  "Prompt Studio source registry should label Skills improvement plan saves in Library",
);
assertFileIncludes(
  sourceRegistrySource,
  'sourceActionLabel: "Skills 스킬로 돌아가기"',
  "Prompt Studio source registry should expose a Skills source action label for Library saved-source actions",
);
assertFileIncludes(
  sourceRegistrySource,
  'dashboardLabel: "Library 저장 출처 리포트"',
  "Prompt Studio source registry should use saved-source wording for Library source filter reports",
);
assertFileIncludes(
  sourceRegistrySource,
  'dashboardDescription: "Studio 저장 출처와 저장 방식 결합 리포트에서 저장됨"',
  "Prompt Studio source registry should use saved-source wording for Library operation cohort descriptions",
);
assertFileIncludes(
  sourceRegistrySource,
  "같은 Studio 저장 출처와 저장 방식으로 묶인 후보",
  "Prompt Studio source registry should use saved-source wording for Library operation cohort next action",
);
assertFileIncludes(
  sourceRegistrySource,
  "선택한 저장본의 저장 출처 메타 상태",
  "Prompt Studio source registry should use saved-source metadata wording for Library persistence candidates",
);
assertFileIncludes(
  sourceRegistrySource,
  "Studio 저장 출처가 있는 흐름",
  "Prompt Studio source registry should use saved-source wording for no-source metadata drafts",
);
assertFileIncludes(
  sourceRegistrySource,
  'dashboardLabel: "Library 저장 출처 없음 메모"',
  "Prompt Studio source registry should use saved-source wording for no-source metadata notes",
);
assertFileIncludes(
  sourceRegistrySource,
  'librarySourceLabel: "Library 저장 출처 메타 없음 메모"',
  "Prompt Studio source registry should label no-source metadata notes as saved-source metadata notes",
);
assertFileIncludes(
  sourceRegistrySource,
  'dashboardLabel: "Library 저장 출처 후보"',
  "Prompt Studio source registry should use saved-source wording for Library source candidates",
);
assertFileIncludes(
  readme,
  "Dashboard, Library, Learning, Skills에서 넘어온 실제 Studio 초안 출처",
  "README should document Skills as a saved-source flow in Dashboard and Library source breakdowns",
);
assertFileIncludes(
  readme,
  "Dashboard, Learning, Library, Skills에서 Studio draft로 넘기는 `sourceHref`",
  "README development standards should include Skills in Studio draft sourceHref handling",
);
assertFileIncludes(
  readme,
  "Skills 개선 계획 링크로 되돌아갈 수 있습니다",
  "README should document Library saves returning to Skills improvement plans",
);
assertFileIncludes(
  readme,
  "Library 상세의 Studio 저장 출처 카드는 원본 경로를 절대 URL로 복사",
  "README should document Library selected Studio source original link copy",
);
assertFileIncludes(
  readme,
  "선택 운영 요약 리포트에도 원본 경로와 원본 화면 복귀 링크를 포함",
  "README should document selected operational summary reports including original source links",
);
assertFileIncludes(
  readme,
  "Library 목록 카드에서도 원본 경로를 절대 URL로 복사",
  "README should document Library list cards copying original Studio source links",
);
assertFileIncludes(
  prd,
  "Dashboard, Library, Learning, Skills에서 넘어온 실제 Studio 초안 저장 출처",
  "PRD should include Skills in the Dashboard Studio saved-source breakdown scope",
);
assertFileIncludes(
  prd,
  "Dashboard, Learning, Library, Skills에서 Studio 초안을",
  "PRD should include Skills in Studio draft source panel requirements",
);
assertFileIncludes(
  prd,
  "Library 상세의 Studio 저장 출처 카드는 원본 경로를 절대 URL로 복사",
  "PRD should require Library selected Studio source original link copy",
);
assertFileIncludes(
  prd,
  "선택 운영 요약 리포트에도 원본 경로와 원본 화면 복귀 링크를 포함",
  "PRD should require selected operational summary reports to include original source links",
);
assertFileIncludes(
  prd,
  "Library 목록 카드에서도 원본 경로를 절대 URL로 복사",
  "PRD should require Library list cards to copy original Studio source links",
);
assertFileIncludes(
  promptTypesSource,
  '"library-studio-operational-group"',
  "Prompt Studio draft source list should include the Library operation cohort source",
);
assertFileIncludes(
  promptTypesSource,
  '"library-missing-source-metadata-queue"',
  "Prompt Studio draft source list should include the missing saved-source metadata queue source",
);
assertFileIncludes(
  promptTypesSource,
  '"library-missing-source-metadata-candidate"',
  "Prompt Studio draft source list should include the missing saved-source metadata candidate source",
);
assertFileIncludes(
  sourceRegistrySource,
  '"library-studio-operational-group"',
  "Prompt Studio source registry should label the Library operation cohort source",
);
assertFileIncludes(
  sourceRegistrySource,
  'dashboardLabel: "Library 저장 출처 메타 없음 큐"',
  "Prompt Studio source registry should separate missing saved-source metadata queue saves",
);
assertFileIncludes(
  sourceRegistrySource,
  'dashboardLabel: "Library 저장 출처 메타 없음 후보"',
  "Prompt Studio source registry should separate missing saved-source metadata candidate saves",
);
assertNotIncludes(
  "출처 운영\n                리포트",
  "Library Studio persistence action panel should not describe storage-mode reports as source operation reports",
);
assertIncludes(
  'data-testid="library-improvement-source-card"',
  "Library source-health action should have a stable improvement source card target",
);

console.log("Library operational summary verification passed.");
