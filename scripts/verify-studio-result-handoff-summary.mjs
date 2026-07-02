import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const studioWorkspaceSource = readFileSync(
  "src/components/studio/studio-workspace.tsx",
  "utf8",
);
const source = [
  "src/lib/studio-view/hrefs.ts",
  "src/lib/studio-view/draft-summary.ts",
  "src/lib/studio-view/learning-memory.ts",
  "src/lib/studio-view/generation.ts",
  "src/lib/studio-view/reports.ts",
]
  .map((path) => readFileSync(path, "utf8"))
  .concat(studioWorkspaceSource)
  .join("\n");
const readme = readFileSync("README.md", "utf8");
const prd = readFileSync("docs/personalized-prompt-ai-prd.md", "utf8");
const developmentBrief = readFileSync("docs/codex-development-brief.md", "utf8");

function assertIncludes(text, message) {
  assert.ok(source.includes(text), message);
}

function assertMatches(pattern, message) {
  assert.match(source, pattern, message);
}

function assertFileIncludes(fileSource, text, message) {
  assert.ok(fileSource.includes(text), message);
}

assertIncludes(
  'data-testid="studio-result-handoff-summary"',
  "Studio result panel should expose a target AI handoff summary",
);
assertIncludes(
  'data-testid="studio-generated-save-operational-summary"',
  "Studio result panel should expose a generated prompt save operational summary",
);
assertIncludes(
  'data-testid="studio-result-action-groups"',
  "Studio result panel should expose grouped result actions",
);
assertIncludes(
  'data-testid="studio-result-review-action-guide"',
  "Studio result action groups should explain when to use review actions",
);
assertIncludes(
  'data-testid="studio-result-handoff-action-guide"',
  "Studio result action groups should explain when to use target AI handoff actions",
);
assertIncludes(
  'data-testid="studio-result-save-action-guide"',
  "Studio result action groups should explain when to use save actions",
);
assertIncludes(
  'data-testid="studio-result-workflow-summary"',
  "Studio result panel should expose the review, AI handoff, and save workflow summary",
);
assertMatches(
  /const activeTargetAiHandoffSummary = useMemo\(\(\) => \{[\s\S]*?summarizeTargetAiReadinessItems\(\s*activeTargetAiHandoffReadinessItems,[\s\S]*?priorityItem/,
  "Studio result handoff summary should derive readiness counts and the priority preflight item",
);
assertMatches(
  /const status: TargetAiHandoffReadinessStatus = readiness\.blocked[\s\S]*?"blocked"[\s\S]*?: readiness\.review[\s\S]*?"review"[\s\S]*?: "ready"/,
  "Studio result handoff summary should classify blocked, review, and ready states",
);
assertMatches(
  /const actionLabel =[\s\S]*?"보강 브리프 적용"[\s\S]*?"검토 후 패키지 확인"[\s\S]*?"AI 전달 패키지 실행"/,
  "Studio result handoff summary should expose the next action for each readiness state",
);
assertMatches(
  /AI 전달 상태[\s\S]*?activeTargetAiHandoffSummary\.actionLabel[\s\S]*?targetAiReadinessStatusLabels[\s\S]*?targetAiReadinessStatusOrder\.map/,
  "Studio result panel should render status label, action label, and readiness counts before the prompt body",
);
assertMatches(
  /activeTargetAiHandoffSummary\.status === "blocked"[\s\S]*?primaryButtonClass[\s\S]*?secondaryButtonClass[\s\S]*?disabled=\{\s*externalHandoffBlockedByPendingRegeneration\s*\}/,
  "Studio result handoff summary action should use the primary action for blocked state and lock while regeneration is pending",
);
assertMatches(
  /onClick=\{\(\) => \{[\s\S]*?activeTargetAiHandoffSummary\.status ===[\s\S]*?"blocked"[\s\S]*?applyTargetAiHandoffImprovementBrief\(\);[\s\S]*?setTargetAiPackagePreviewKey\(\s*activeTargetAiPackageKey,\s*\)/,
  "Studio result handoff summary action should apply the improvement brief or open the handoff package",
);
assertMatches(
  /우선 확인[\s\S]*?activeTargetAiHandoffSummary\.priorityItem\.label[\s\S]*?activeTargetAiHandoffSummary\.priorityItem\.detail/,
  "Studio result handoff summary should show the priority preflight item",
);
assertIncludes(
  'data-testid="studio-result-handoff-review-queue"',
  "Studio result panel should expose a target AI handoff review queue",
);
assertMatches(
  /const activeTargetAiHandoffReviewQueue = useMemo\(\(\) => \{[\s\S]*?activeTargetAiHandoffReadinessItems[\s\S]*?sort\(\(first, second\) => \{[\s\S]*?first\.status === "blocked"[\s\S]*?first\.status === "review"[\s\S]*?slice\(0, 3\)[\s\S]*?action:[\s\S]*?"보강 브리프에 반영"[\s\S]*?"가정과 맥락 확인"[\s\S]*?"실행 프롬프트로 전달"/,
  "Studio result handoff review queue should prioritize blocked, review, and ready items with next actions",
);
assertMatches(
  /data-testid="studio-result-handoff-review-queue"[\s\S]*?전달 전 검토 큐[\s\S]*?복사 전에 차단, 검토, 전달 가능 항목 순서로[\s\S]*?상위 \{activeTargetAiHandoffReviewQueue\.length\}개[\s\S]*?activeTargetAiHandoffReviewQueue\.map[\s\S]*?item\.label[\s\S]*?targetAiReadinessStatusLabels\[item\.status\][\s\S]*?item\.detail[\s\S]*?다음 행동 · \{item\.action\}/,
  "Studio result handoff review queue should render prioritized labels, statuses, details, and next actions before the prompt body",
);
assertMatches(
  /const generatedSaveOperationalSummary = useMemo\(\(\) => \{[\s\S]*?generated\.improvementSource[\s\S]*?"개선 체인"[\s\S]*?getDraftPersistenceMeta\(draftSourceForSave\.source\)\.label[\s\S]*?"Studio 출처 없음"/,
  "Studio generated save summary should classify improvement-chain, operational-source, and direct Studio saves",
);
assertMatches(
  /const generatedLearningContext = generated\.learningContext[\s\S]*?const learningScopeLabel = generatedLearningContext[\s\S]*?getEnabledMemoryScopeLabels\(generatedLearningContext\.enabledScopes\)[\s\S]*?const learningEvidenceLabel = generatedLearningContext[\s\S]*?scope \$\{learningScopeLabel\}[\s\S]*?메모리 \$\{generatedLearningContext\.appliedMemoryCount\}개[\s\S]*?피드백 \$\{generatedLearningContext\.recentFeedbackCount\}개[\s\S]*?const learningMemoryTitleLabel[\s\S]*?appliedMemoryTitles\.slice\(0, 2\)\.join\(", "\)[\s\S]*?learningEvidenceLabel[\s\S]*?learningMemoryTitleLabel/,
  "Studio generated save summary should preserve learning scope, memory count, feedback count, and representative memory titles",
);
assertIncludes(
  "저장하면 개선 체인이 아니라 Studio 저장 출처 메타로 보존되어 기능 흐름별 운영 이력에서 추적됩니다.",
  "Studio generated save summary should use saved-source metadata wording for operational-source saves",
);
assertMatches(
  /const statusLabel = saveBlockedByPendingRegeneration[\s\S]*?"재생성 필요"[\s\S]*?savedCurrent[\s\S]*?"저장 완료"[\s\S]*?: "저장 가능"/,
  "Studio generated save summary should expose pending, saved, and saveable states",
);
assertMatches(
  /const actionKind = saveBlockedByPendingRegeneration[\s\S]*?\? "regenerate"[\s\S]*?savedCurrent && savedPromptLibraryHref[\s\S]*?\? "open-library"[\s\S]*?: "save"/,
  "Studio generated save summary should map save state to regenerate, open Library, or save actions",
);
assertMatches(
  /function runGeneratedSaveOperationalSummaryAction\(\)[\s\S]*?actionKind === "regenerate"[\s\S]*?generatePrompt\(\)[\s\S]*?actionKind === "open-library"[\s\S]*?openSavedPromptInLibrary\(\)[\s\S]*?savePrompt\(\)/,
  "Studio generated save summary CTA should execute regenerate, open Library, or save actions",
);
assertMatches(
  /async function copySavedPromptLibraryLink\(\)[\s\S]*?formatAbsoluteInternalHref\([\s\S]*?savedPromptLibraryHref[\s\S]*?window\.location\.origin[\s\S]*?const savedLibraryLinkCopyBody = \[[\s\S]*?linkText[\s\S]*?프롬프트: \$\{generated\.title\}[\s\S]*?대상 AI: \$\{modelLabels\[activeVersion\.targetModel\]\}[\s\S]*?저장 방식: \$\{generatedSaveOperationalSummary\.persistenceLabel\}[\s\S]*?저장 출처: \$\{generatedSaveOperationalSummary\.sourceLabel\}[\s\S]*?출처 제목: \$\{generatedSaveOperationalSummary\.sourceTitle\}[\s\S]*?세부 초안 유형: \$\{generatedSaveOperationalSummary\.sourceVariantLabel\}[\s\S]*?학습 증거: \$\{generatedSaveOperationalSummary\.learningEvidenceLabel\}[\s\S]*?적용 메모리: \$\{generatedSaveOperationalSummary\.learningMemoryTitleLabel\}[\s\S]*?Library 기록: \$\{generatedSaveOperationalSummary\.libraryRecordLabel\}[\s\S]*?copyTextToClipboard\(linkText\)[\s\S]*?id: "saved-library-link"[\s\S]*?title: "저장 프롬프트 링크"[\s\S]*?body: savedLibraryLinkCopyBody/,
  "Studio saved Library detail link fallback should include prompt, target AI, saved-source, source title, sourceVariant, learning evidence, and Library record metadata",
);
assertMatches(
  /"saved-skill-link"[\s\S]*?const \[savedSkillLinkCopied, setSavedSkillLinkCopied\][\s\S]*?setSavedSkillLinkCopied\(false\)[\s\S]*?async function copySavedPromptSkillLink\(\)[\s\S]*?formatAbsoluteInternalHref\([\s\S]*?savedPromptSkillHref[\s\S]*?window\.location\.origin[\s\S]*?const savedSkillLinkCopyBody = \[[\s\S]*?linkText[\s\S]*?프롬프트: \$\{generated\.title\}[\s\S]*?대상 AI: \$\{modelLabels\[activeVersion\.targetModel\]\}[\s\S]*?저장 방식: \$\{generatedSaveOperationalSummary\.persistenceLabel\}[\s\S]*?저장 출처: \$\{generatedSaveOperationalSummary\.sourceLabel\}[\s\S]*?출처 제목: \$\{generatedSaveOperationalSummary\.sourceTitle\}[\s\S]*?세부 초안 유형: \$\{generatedSaveOperationalSummary\.sourceVariantLabel\}[\s\S]*?학습 증거: \$\{generatedSaveOperationalSummary\.learningEvidenceLabel\}[\s\S]*?적용 메모리: \$\{generatedSaveOperationalSummary\.learningMemoryTitleLabel\}[\s\S]*?Skill 전환: 저장 프롬프트를 스킬 템플릿 후보로 불러옵니다\.[\s\S]*?copyTextToClipboard\(linkText\)[\s\S]*?id: "saved-skill-link"[\s\S]*?title: "Skill 전환 링크"[\s\S]*?body: savedSkillLinkCopyBody/,
  "Studio saved Skill transition link fallback should include prompt, target AI, saved-source, source title, sourceVariant, learning evidence, and Skill transition metadata",
);
assertMatches(
  /const recoveryActionLabel =[\s\S]*?actionKind === "regenerate" && pendingRegenerationRecovery[\s\S]*?\? "이전 결과 유지"[\s\S]*?: null/,
  "Studio generated save summary should expose a keep-previous action while regeneration is pending",
);
assertMatches(
  /const sourceVariantLabel = draftSourceForSave\?\.sourceVariant[\s\S]*?getStudioDraftDisplaySourceLabel\(draftSourceForSave\)\.label[\s\S]*?const sourceActionLabel =[\s\S]*?savedCurrent && savedPromptStudioSourceHref[\s\S]*?sourceVariantLabel[\s\S]*?"세부 유형 출처 보기"[\s\S]*?: "저장 출처 보기"[\s\S]*?const sourceActionDetail = sourceActionLabel[\s\S]*?세부 초안 유형이 \$\{sourceVariantLabel\}인 저장본[\s\S]*?저장 출처가 \$\{sourceLabel\}인 저장본/,
  "Studio generated save summary should expose sourceVariant-aware source actions and explain the Library source filter after saved Studio-source results",
);
assertMatches(
  /function buildSavedPromptStudioOperationalGroupHref\(prompt: PromptAsset\)[\s\S]*?return buildLibraryStudioSourceHref\(\{[\s\S]*?promptId: prompt\.id[\s\S]*?source: prompt\.studioSource\.source[\s\S]*?sourceVariant: prompt\.studioSource\.sourceVariant[\s\S]*?studioPersistence[\s\S]*?\}\)/,
  "Studio generated save summary should build a sourceVariant-aware combined Library operation group href for saved Studio-source prompts",
);
assertMatches(
  /function buildSavedPromptStudioSourceHref\(prompt: PromptAsset\)[\s\S]*?return buildLibraryStudioSourceHref\(\{[\s\S]*?promptId: prompt\.id[\s\S]*?source: prompt\.studioSource\.source[\s\S]*?sourceVariant: prompt\.studioSource\.sourceVariant[\s\S]*?\}\)/,
  "Studio generated save summary should build a sourceVariant-aware Library source href for saved Studio-source prompts",
);
assertMatches(
  /function buildSavedPromptStudioPersistenceHref\(prompt: PromptAsset\)[\s\S]*?studio: studioPersistence[\s\S]*?prompt: prompt\.id/,
  "Studio generated save summary should build a Library persistence filter href for saved Studio-source prompts",
);
assertMatches(
  /const persistenceActionLabel =[\s\S]*?savedCurrent && savedPromptStudioPersistenceHref[\s\S]*?\? "저장 방식으로 보기"[\s\S]*?: null/,
  "Studio generated save summary should expose a persistence filter action after saved Studio-source results",
);
assertMatches(
  /const groupActionLabel =[\s\S]*?savedCurrent && savedPromptStudioOperationalGroupHref[\s\S]*?sourceVariantLabel[\s\S]*?"세부 유형 묶음 보기"[\s\S]*?: "운영 묶음 보기"[\s\S]*?: null/,
  "Studio generated save summary should expose a sourceVariant-aware operation group action after saved Studio-source results",
);
assertMatches(
  /function openSavedPromptStudioPersistenceInLibrary\(\)[\s\S]*?savedPromptStudioPersistenceHref[\s\S]*?router\.push\(savedPromptStudioPersistenceHref\)/,
  "Studio generated save summary persistence action should open the Library persistence filter",
);
assertMatches(
  /function openSavedPromptStudioOperationalGroupInLibrary\(\)[\s\S]*?savedPromptStudioOperationalGroupHref[\s\S]*?router\.push\(savedPromptStudioOperationalGroupHref\)/,
  "Studio generated save summary operation group action should open the combined Library filter",
);
assertMatches(
  /async function copySavedPromptOperationalLink\(\{[\s\S]*?href: string \| null[\s\S]*?saved-studio-source-link[\s\S]*?saved-studio-persistence-link[\s\S]*?saved-studio-operational-group-link[\s\S]*?formatAbsoluteInternalHref\(href, window\.location\.origin\)[\s\S]*?const operationalLinkCopyBody = \[[\s\S]*?linkText[\s\S]*?조건: \$\{title\}[\s\S]*?저장 방식: \$\{generatedSaveOperationalSummary\.persistenceLabel\}[\s\S]*?저장 출처: \$\{generatedSaveOperationalSummary\.sourceLabel\}[\s\S]*?출처 제목: \$\{generatedSaveOperationalSummary\.sourceTitle\}[\s\S]*?세부 초안 유형: \$\{generatedSaveOperationalSummary\.sourceVariantLabel\}[\s\S]*?학습 증거: \$\{generatedSaveOperationalSummary\.learningEvidenceLabel\}[\s\S]*?적용 메모리: \$\{generatedSaveOperationalSummary\.learningMemoryTitleLabel\}[\s\S]*?Library 기록: \$\{generatedSaveOperationalSummary\.libraryRecordLabel\}[\s\S]*?copyTextToClipboard\(linkText\)[\s\S]*?setSavedOperationalLinkCopiedKey[\s\S]*?body: operationalLinkCopyBody/,
  "Studio generated save summary should copy saved source, persistence, and operation-group links as absolute URLs with saved-source/source-title/sourceVariant learning fallback metadata",
);
assertMatches(
  /저장 운영 상태[\s\S]*?generatedSaveOperationalSummary\.statusLabel[\s\S]*?generatedSaveOperationalSummary\.sourceActionDetail[\s\S]*?runGeneratedSaveOperationalSummaryAction[\s\S]*?generatedSaveOperationalSummary\.actionLabel[\s\S]*?generatedSaveOperationalSummary\.recoveryActionLabel[\s\S]*?keepPreviousGeneratedResult[\s\S]*?generatedSaveOperationalSummary\.sourceActionLabel[\s\S]*?openSavedPromptStudioSourceInLibrary[\s\S]*?data-testid="studio-generated-save-source-action"[\s\S]*?data-testid="studio-generated-save-source-link-copy"[\s\S]*?generatedSaveOperationalSummary\.sourceLinkCopyLabel[\s\S]*?generatedSaveOperationalSummary\.persistenceActionLabel[\s\S]*?openSavedPromptStudioPersistenceInLibrary[\s\S]*?data-testid="studio-generated-save-persistence-action"[\s\S]*?data-testid="studio-generated-save-persistence-link-copy"[\s\S]*?방식 링크 복사[\s\S]*?generatedSaveOperationalSummary\.groupActionLabel[\s\S]*?openSavedPromptStudioOperationalGroupInLibrary[\s\S]*?data-testid="studio-generated-save-operational-group-action"[\s\S]*?data-testid="studio-generated-save-operational-group-link-copy"[\s\S]*?generatedSaveOperationalSummary\.groupLinkCopyLabel[\s\S]*?저장 방식[\s\S]*?generatedSaveOperationalSummary\.persistenceLabel[\s\S]*?저장 출처[\s\S]*?generatedSaveOperationalSummary\.sourceLabel[\s\S]*?Library 기록[\s\S]*?generatedSaveOperationalSummary\.libraryRecordLabel[\s\S]*?generatedSaveOperationalSummary\.sourceTitle[\s\S]*?출처 제목[\s\S]*?generatedSaveOperationalSummary\.sourceTitle[\s\S]*?generatedSaveOperationalSummary\.sourceVariantLabel[\s\S]*?세부 초안 유형/,
  "Studio generated save summary should render status, source action detail, direct actions, saved source, source title, persistence, sourceVariant-aware operation actions and link-copy actions, and Library record labels before save actions",
);
assertMatches(
  /저장 운영 상태[\s\S]*?학습 증거 ·[\s\S]*?generatedSaveOperationalSummary\.learningEvidenceLabel[\s\S]*?학습 증거[\s\S]*?generatedSaveOperationalSummary\.learningEvidenceLabel[\s\S]*?generatedSaveOperationalSummary\.learningMemoryTitleLabel[\s\S]*?적용 메모리/,
  "Studio generated save summary should render learning evidence and representative applied memory in the save operation card",
);
assertMatches(
  /const generatedResultWorkflowSteps = useMemo\(\(\) => \{[\s\S]*?action: qualityInsights\.length \? "품질 리포트 복사" : "현재 버전 복사"[\s\S]*?action: activeTargetAiHandoffSummary\.actionLabel[\s\S]*?status: activeTargetAiHandoffSummary\.actionLabel[\s\S]*?action: generatedSaveOperationalSummary\.actionLabel[\s\S]*?generatedSaveOperationalSummary\.persistenceLabel[\s\S]*?generatedSaveOperationalSummary\.sourceLabel[\s\S]*?status: generatedSaveOperationalSummary\.statusLabel/,
  "Studio result workflow summary should reuse quality, AI handoff, and save operational state with the next action for each step",
);
assertMatches(
  /const generatedResultActionGroupSummaries = useMemo\(\(\) => \{[\s\S]*?activeTargetAiHandoffSummary\.status === "blocked"[\s\S]*?"차단 항목이 있으면 패키지 전달보다 보강 브리프를 먼저 적용합니다\."[\s\S]*?"패키지를 열어 가정과 누락 맥락을 확인한 뒤 외부 AI로 보냅니다\."[\s\S]*?"실행 프롬프트나 전체 패키지 중 필요한 형태를 바로 복사합니다\."[\s\S]*?handoffBadge:[\s\S]*?targetAiReadinessStatusLabels\[activeTargetAiHandoffSummary\.status\][\s\S]*?reviewBadge: qualityInsights\.length[\s\S]*?saveBadge: generatedSaveOperationalSummary\.statusLabel/,
  "Studio result action group guides should derive review, handoff, save guidance, and compact status badges from current result state",
);
assertMatches(
  /data-testid="studio-result-workflow-summary"[\s\S]*?결과 실행 순서[\s\S]*?검토 후 AI 전달[\s\S]*?generatedResultWorkflowSteps\.map[\s\S]*?step\.label[\s\S]*?step\.status[\s\S]*?step\.detail[\s\S]*?다음 행동 · \{step\.action\}[\s\S]*?data-testid="studio-result-action-groups"/,
  "Studio result workflow summary should render the ordered review, AI handoff, save guidance, and next action before grouped actions",
);
assertMatches(
  /data-testid="studio-result-action-groups"[\s\S]*?검토[\s\S]*?generatedResultActionGroupSummaries\.reviewBadge[\s\S]*?data-testid="studio-result-review-action-guide"[\s\S]*?generatedResultActionGroupSummaries\.review[\s\S]*?onClick=\{\(\) => copyPrompt\(\)\}[\s\S]*?현재 버전 복사[\s\S]*?copyQualityReport[\s\S]*?품질 리포트 복사[\s\S]*?AI 전달[\s\S]*?generatedResultActionGroupSummaries\.handoffBadge[\s\S]*?data-testid="studio-result-handoff-action-guide"[\s\S]*?generatedResultActionGroupSummaries\.handoff[\s\S]*?activeTargetAiHandoffSummary\?\.status ===[\s\S]*?"blocked"[\s\S]*?onClick=\{applyTargetAiHandoffImprovementBrief\}[\s\S]*?보강 브리프 적용[\s\S]*?copyTargetAiHandoffPackage[\s\S]*?AI 전달 패키지 복사[\s\S]*?aria-expanded=\{targetAiPackagePreviewOpen\}[\s\S]*?AI 전달 패키지 보기[\s\S]*?저장[\s\S]*?generatedResultActionGroupSummaries\.saveBadge[\s\S]*?data-testid="studio-result-save-action-guide"[\s\S]*?generatedResultActionGroupSummaries\.save[\s\S]*?onClick=\{savePrompt\}[\s\S]*?라이브러리에 저장/,
  "Studio result action groups should separate review, AI handoff, and save actions with compact status badges, a blocked-state improvement action, and state-aware guidance while preserving fallback labels",
);
assertMatches(
  /data-testid="studio-result-action-groups"[\s\S]*?01[\s\S]*?검토[\s\S]*?02[\s\S]*?AI 전달[\s\S]*?03[\s\S]*?저장/,
  "Studio result action groups should show numbered review, AI handoff, and save stages for quick scanning",
);
assertMatches(
  /savedPromptStudioSourceHref[\s\S]*?generatedSaveOperationalSummary\?\.sourceActionLabel[\s\S]*?"저장 출처 보기"/,
  "Studio saved-result action bar should use the same sourceVariant-aware saved source action wording",
);
assertMatches(
  /Skill로 전환[\s\S]*?onClick=\{copySavedPromptSkillLink\}[\s\S]*?savedSkillLinkCopied[\s\S]*?"Skill 링크 복사됨"[\s\S]*?studioManualCopy\?\.id === "saved-skill-link"[\s\S]*?"Skill 링크 복사 실패"[\s\S]*?"Skill 링크 복사"/,
  "Studio saved-result action bar should expose a copied/failure-aware Skill transition link copy action",
);
assertFileIncludes(
  readme,
  "Studio 생성 결과 액션은 `검토`, `AI 전달`, `저장` 흐름으로 나뉘며 현재 버전/품질 리포트 복사, AI 전달 패키지 복사/보기, Library 저장을 같은 fallback 정책으로 제공합니다.",
  "README should document Studio grouped result actions",
);
assertFileIncludes(
  readme,
  "각 액션 묶음은 현재 품질 진단, AI 전달 상태, 저장 상태를 짧은 배지와 판단 문구로 버튼 위에 표시해 사용자가 복사, 전달, 저장 순서를 바로 고르게 합니다.",
  "README should document Studio state-aware action group guidance",
);
assertFileIncludes(
  readme,
  "Studio 생성 결과 액션 묶음은 `01 검토`, `02 AI 전달`, `03 저장` 단계 번호를 함께 보여줘 버튼 영역만 봐도 실행 순서를 알 수 있게 합니다.",
  "README should document numbered Studio result action groups",
);
assertFileIncludes(
  readme,
  "AI 전달이 차단 상태이면 `AI 전달` 액션 묶음 안에서도 `보강 브리프 적용`을 먼저 제공해 패키지 복사보다 재생성 루프를 우선 실행하게 합니다.",
  "README should document Studio blocked handoff action group improvement action",
);
assertFileIncludes(
  prd,
  "Studio 생성 결과 액션 묶음은 현재 품질 진단, AI 전달 상태, 저장 상태를 짧은 배지와 판단 문구로 버튼 위에 표시해야 한다",
  "PRD should document Studio result action group badges",
);
assertFileIncludes(
  prd,
  "Studio 생성 결과 액션 묶음은 `01 검토`, `02 AI 전달`, `03 저장` 단계 번호를 함께 보여줘 버튼 영역만 봐도 실행 순서를 알 수 있게 해야 한다",
  "PRD should document numbered Studio result action groups",
);
assertFileIncludes(
  prd,
  "AI 전달이 차단 상태이면 `AI 전달` 액션 묶음 안에서도 `보강 브리프 적용`을 먼저 제공해 패키지 복사보다 재생성 루프를 우선 실행하게 해야 한다",
  "PRD should document Studio blocked handoff action group improvement action",
);
assertFileIncludes(
  developmentBrief,
  "생성 결과 액션 묶음은 현재 품질 진단, AI 전달 상태, 저장 상태를 짧은 배지와 판단 문구로 버튼 위에 표시",
  "Development brief should document Studio result action group badges",
);
assertFileIncludes(
  developmentBrief,
  "생성 결과 액션 묶음은 `01 검토`, `02 AI 전달`, `03 저장` 단계 번호를 함께 보여줘 버튼 영역만 봐도 실행 순서를 알 수 있게 함",
  "Development brief should document numbered Studio result action groups",
);
assertFileIncludes(
  developmentBrief,
  "AI 전달이 차단 상태이면 `AI 전달` 액션 묶음 안에서도 `보강 브리프 적용`을 먼저 제공해 패키지 복사보다 재생성 루프를 우선 실행",
  "Development brief should document Studio blocked handoff action group improvement action",
);
assertFileIncludes(
  readme,
  "Studio 생성 결과는 결과 실행 순서 요약에서 `검토`, `AI 전달`, `저장`의 현재 상태, 다음 확인 항목, 바로 실행할 다음 행동을 액션 버튼 앞에서 먼저 보여줍니다.",
  "README should document Studio result workflow summary",
);
assertFileIncludes(
  prd,
  "Studio 생성 결과의 결과 실행 순서 요약은 각 단계의 현재 상태, 다음 확인 항목, 바로 실행할 다음 행동을 액션 버튼 앞에서 먼저 보여줘야 한다",
  "PRD should document Studio result workflow summary with next actions",
);
assertFileIncludes(
  prd,
  "Studio 저장 운영 요약과 `Library 링크 복사`, `Skill 링크 복사`, 저장 출처/저장 방식/운영 묶음 조건 링크 fallback은 생성 당시 학습 증거와 대표 적용 메모리 제목을 함께 보존해야 한다",
  "PRD should document Studio saved-result learning evidence metadata",
);
assertFileIncludes(
  developmentBrief,
  "생성 결과의 결과 실행 순서 요약은 `검토`, `AI 전달`, `저장` 단계별 현재 상태, 다음 확인 항목, 바로 실행할 다음 행동을 액션 버튼 앞에서 먼저 표시",
  "Development brief should document Studio result workflow summary with next actions",
);
assertFileIncludes(
  developmentBrief,
  "저장 운영 요약과 Library/Skill/운영 조건 링크 fallback은 생성 당시 학습 증거와 대표 적용 메모리 제목을 함께 보존",
  "Development brief should document Studio saved-result learning evidence metadata",
);
assertFileIncludes(
  readme,
  "Studio 생성 결과의 `전달 전 검토 큐`는 차단, 검토, 전달 가능 항목 순서로 상위 3개를 보여주고 각 항목의 다음 행동을 복사 전에 확인하게 합니다.",
  "README should document Studio result handoff review queue",
);
assertFileIncludes(
  readme,
  "저장 후 운영 상태 요약에서는 저장 출처, 저장 방식, 출처 제목, 세부 초안 유형, 학습 증거, 운영 묶음 Library 조건으로 바로 이동하거나 각 조건 링크를 현재 도메인을 포함한 절대 URL과 fallback 운영 메타로 복사",
  "README should document Studio saved-result sourceVariant-aware operational condition link copy actions",
);
assertFileIncludes(
  readme,
  "저장 후 운영 상태 요약에서는 저장 출처, 저장 방식, 출처 제목, 세부 초안 유형, 학습 증거, 운영 묶음 Library 조건으로 바로 이동하거나 각 조건 링크를 현재 도메인을 포함한 절대 URL과 fallback 운영 메타로 복사할 수 있습니다.",
  "README should document Studio saved-result learning evidence in save summary",
);
assertFileIncludes(
  readme,
  "`Library 링크 복사`, `Skill 링크 복사`, 저장 출처/저장 방식/운영 묶음 조건 링크 fallback은 같은 학습 증거와 대표 적용 메모리 제목을 포함합니다.",
  "README should document Studio saved-result learning evidence in copied fallback metadata",
);
assertFileIncludes(
  readme,
  "`Library 링크 복사`로 같은 상세 링크와 저장 운영 메타를 외부 리뷰나 팀 공유에 전달",
  "README should document Studio saved Library detail link fallback metadata",
);
assertFileIncludes(
  readme,
  "`Skill 링크 복사`는 같은 저장 운영 메타와 함께 스킬 전환 경로를 공유",
  "README should document Studio saved Skill transition link fallback metadata",
);
assertFileIncludes(
  readme,
  "sourceVariant가 있는 저장본의 저장 출처/운영 묶음 링크는 `studioVariant` 조건을 포함",
  "README should document Studio saved-result studioVariant condition links",
);

console.log("Studio result handoff summary verification passed.");
