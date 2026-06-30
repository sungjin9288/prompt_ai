import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { loadTypescriptModule } from "./lib/load-typescript-module.mjs";

const dataSource = readFileSync(
  "src/components/data/data-management-view.tsx",
  "utf8",
);
const dataSourceFile = ts.createSourceFile(
  "src/components/data/data-management-view.tsx",
  dataSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const manifestSource = readFileSync(
  "src/lib/data/supabase-import-execution-packet-manifest.ts",
  "utf8",
);
const supabaseImportRouteSource = readFileSync(
  "src/app/api/data/supabase-import/route.ts",
  "utf8",
);
const supabaseImportDryRunSource = readFileSync(
  "src/lib/data/supabase-import-dry-run.ts",
  "utf8",
);
const supabaseImportExecutionPlanSource = readFileSync(
  "src/lib/data/supabase-import-execution-plan.ts",
  "utf8",
);
const supabaseImporterSource = readFileSync(
  "src/lib/data/supabase-importer.ts",
  "utf8",
);
const readme = readFileSync("README.md", "utf8");
const prd = readFileSync("docs/personalized-prompt-ai-prd.md", "utf8");
const developmentBrief = readFileSync(
  "docs/codex-development-brief.md",
  "utf8",
);
const storageArchitecture = readFileSync(
  "docs/storage-architecture.md",
  "utf8",
);
const promptTypesSource = readFileSync("src/lib/prompt/types.ts", "utf8");
const sourceRegistrySource = readFileSync(
  "src/lib/studio/source-registry.ts",
  "utf8",
);

const {
  buildSupabaseImportExecutionPacketManifestText,
  buildSupabaseImportExecutionPacketNextActionText,
  formatSupabaseImportExecutionPacketCopyGateLabel,
  getSupabaseImportExecutionPacketCopyActionStatuses,
  getSupabaseImportExecutionPacketManifestItems,
  getSupabaseImportExecutionPacketManifestNextAction,
  getSupabaseImportExecutionPacketManifestStatus,
  getSupabaseImportExecutionPacketManifestSummary,
} = loadTypescriptModule(
  "src/lib/data/supabase-import-execution-packet-manifest.ts",
);
const {
  createSupabaseRestImportAdapter,
  getSupabaseRestImportEnvironmentStatus,
} = loadTypescriptModule("src/lib/data/supabase-rest-import-adapter.ts");
const { runSupabaseImportExecutionPlan } = loadTypescriptModule(
  "src/lib/data/supabase-importer.ts",
);

function assertDataMatches(pattern, message) {
  assert.match(dataSource, pattern, message);
}

function assertDataTestIdCount(testId, expectedCount, message) {
  const escapedTestId = testId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const count =
    dataSource.match(new RegExp(`data-testid="${escapedTestId}"`, "g"))
      ?.length ?? 0;
  assert.equal(count, expectedCount, message);
}

function assertManifestMatches(pattern, message) {
  assert.match(manifestSource, pattern, message);
}

function assertFileIncludes(fileSource, text, message) {
  assert.ok(fileSource.includes(text), message);
}

function assertFileNotIncludes(fileSource, text, message) {
  assert.ok(!fileSource.includes(text), message);
}

function assertFileIncludesInOrder(fileSource, texts, message) {
  let cursor = 0;

  for (const text of texts) {
    const index = fileSource.indexOf(text, cursor);

    assert.notEqual(index, -1, `${message}: missing ${JSON.stringify(text)}`);

    cursor = index + text.length;
  }
}

function normalizePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function withSupabaseImportEnv(env, callback) {
  const keys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_IMPORT_EXECUTION_ENABLED",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

  try {
    for (const key of keys) {
      if (env[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = env[key];
      }
    }

    return callback();
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previous[key];
      }
    }
  }
}

function getLineNumber(position) {
  return dataSourceFile.getLineAndCharacterOfPosition(position).line + 1;
}

function collectCopyDataTextCalls(node, calls = []) {
  if (
    ts.isCallExpression(node) &&
    node.expression.getText(dataSourceFile) === "copyDataText"
  ) {
    calls.push({
      argumentCount: node.arguments.length,
      manualFallbackExpression: node.arguments[3]?.getText(dataSourceFile) ?? "",
      line: getLineNumber(node.getStart(dataSourceFile)),
    });
  }

  ts.forEachChild(node, (child) => {
    collectCopyDataTextCalls(child, calls);
  });

  return calls;
}

const copyDataTextCalls = collectCopyDataTextCalls(dataSourceFile);
const copyDataTextCallsMissingManualFallback = copyDataTextCalls.filter(
  (call) => call.argumentCount < 4,
);
const copyDataTextCallsMissingManualFallbackBuilder = copyDataTextCalls.filter(
  (call) => !/^build[A-Za-z0-9]+ManualCopyText\(/.test(call.manualFallbackExpression),
);

assert.ok(
  copyDataTextCalls.length > 0,
  "Data view should have clipboard copy actions to verify",
);

assert.equal(
  copyDataTextCallsMissingManualFallback.length,
  0,
  `Every Data copyDataText call should include success notice, failure notice, and metadata-rich manual fallback body. Missing calls: ${JSON.stringify(
    copyDataTextCallsMissingManualFallback,
  )}`,
);
assert.equal(
  copyDataTextCallsMissingManualFallbackBuilder.length,
  0,
  `Every Data copyDataText manual fallback should use a dedicated build*ManualCopyText helper. Missing helpers: ${JSON.stringify(
    copyDataTextCallsMissingManualFallbackBuilder,
  )}`,
);

assertDataMatches(
  /interface SupabaseImportExecutionPlanSummaryProps[\s\S]*?onCopyExecutionPacket: \(\) => void;[\s\S]*?onCopyExecutionPacketManifest: \(\) => void;[\s\S]*?onCopyExecutionPacketNextAction: \(\) => void;/,
  "Data import execution plan props should include execution packet manifest and next-action copy actions",
);

assertDataMatches(
  /function buildBackupManualCopyText\(\{[\s\S]*?counts: WorkspaceBackupCounts[\s\S]*?exportedAt: string[\s\S]*?fingerprint: string[\s\S]*?json: string[\s\S]*?# Prompt AI Studio 백업 JSON[\s\S]*?## 백업 식별[\s\S]*?생성 시각: \$\{formatBackupDate\(exportedAt\)\}[\s\S]*?백업 지문: \$\{fingerprint\}[\s\S]*?JSON 길이: \$\{formatJsonLength\(json\)\}[\s\S]*?## 수량 요약[\s\S]*?프롬프트: \$\{counts\.prompts\}개[\s\S]*?삭제 보관함: \$\{counts\.deletedPrompts \?\? 0\}개[\s\S]*?## JSON[\s\S]*?json/,
  "Data backup JSON manual fallback should prepend backup identity, counts, fingerprint, and JSON length before the raw JSON",
);

assertDataMatches(
  /async function copyDataText\([\s\S]*?manualBody = text[\s\S]*?copyTextToClipboard\(text\)[\s\S]*?body: manualBody/,
  "Data copy helper should allow metadata-rich manual fallback bodies while preserving the clipboard payload",
);

assertDataMatches(
  /async function handleCopyBackup\(\)[\s\S]*?copyDataText\([\s\S]*?exportJson[\s\S]*?백업 JSON을 클립보드에 복사했습니다[\s\S]*?buildBackupManualCopyText\(\{[\s\S]*?counts: backupMeta\.counts[\s\S]*?exportedAt: backupMeta\.exportedAt[\s\S]*?fingerprint:[\s\S]*?backupMeta\.fingerprint \|\| getWorkspaceBackupFingerprint\(exportJson\)[\s\S]*?json: exportJson/,
  "Data backup copy should keep raw JSON on clipboard and use the metadata-rich backup fallback body only for manual copy",
);

assertDataMatches(
  /interface DocumentRagReadinessItem[\s\S]*?artifact: string;[\s\S]*?detail: string;[\s\S]*?evidence: string;[\s\S]*?nextAction: string;[\s\S]*?status: "planned" \| "ready";/,
  "Data document RAG readiness should use a typed readiness item contract",
);

assertDataMatches(
  /interface DocumentRagReadinessSummaryProps[\s\S]*?chunks: DocumentRagChunkPreview\[\];[\s\S]*?onClearDraft: \(\) => void;[\s\S]*?onCopyIngestionPacket: \(\) => void;[\s\S]*?onCopyReadiness: \(\) => void;[\s\S]*?onDocumentFileChange: \(event: ChangeEvent<HTMLInputElement>\) => void;[\s\S]*?sourceName: string;[\s\S]*?text: string;/,
  "Data document RAG readiness props should include draft input, file input, chunk preview, clear, readiness copy, and ingestion packet actions",
);

assertDataMatches(
  /interface DocumentRagChunkPreview[\s\S]*?content: string;[\s\S]*?end: number;[\s\S]*?index: number;[\s\S]*?start: number;/,
  "Data document RAG chunk preview should keep content and source text ranges",
);

assertDataMatches(
  /const documentRagReadinessItems = \[[\s\S]*?pgvector extension[\s\S]*?document_sources[\s\S]*?document_chunks[\s\S]*?ingestion gate[\s\S]*?retrieval gate[\s\S]*?satisfies DocumentRagReadinessItem\[\];/,
  "Data document RAG readiness should expose schema, ingestion, and retrieval gates",
);

assertDataMatches(
  /function buildDocumentRagReadinessText\(\)[\s\S]*?# Prompt AI Studio Document RAG Readiness[\s\S]*?Ready artifacts:[\s\S]*?Current scope: schema and operator readiness only; no document upload writes yet[\s\S]*?Required gates before upload[\s\S]*?document_sources\.workspace_id[\s\S]*?document_chunks\.chunk_index[\s\S]*?trusted server-side job[\s\S]*?source IDs and chunk indexes/,
  "Data document RAG readiness report should document schema readiness, local-only scope, workspace scope, chunk order, server-side embeddings, and citation gates",
);

assertDataMatches(
  /function buildDocumentRagReadinessManualCopyText\(\{[\s\S]*?reportText[\s\S]*?# Prompt AI Studio 문서\/RAG 준비도[\s\S]*?준비된 항목:[\s\S]*?설계 필요 항목:[\s\S]*?리포트 길이:[\s\S]*?pgvector schema exists[\s\S]*?document_sources and document_chunks must stay workspace-scoped[\s\S]*?Embeddings should be generated server-side[\s\S]*?Retrieved chunks must keep source ID and chunk index citations/,
  "Data document RAG readiness manual fallback should prepend readiness counts, length, workspace scope, server-side embedding, and citation gates",
);

assertDataMatches(
  /function normalizeDocumentRagText\(value: string\)[\s\S]*?replace\(\/\\r\\n\/g, "\\n"\)[\s\S]*?replace\(\/\\n\{3,\}\/g, "\\n\\n"\)[\s\S]*?trim\(\)/,
  "Data document RAG text normalization should keep chunking deterministic",
);

assertDataMatches(
  /function createDocumentRagChunks\(value: string\)[\s\S]*?const text = normalizeDocumentRagText\(value\)[\s\S]*?while \(cursor < text\.length\)[\s\S]*?documentRagChunkSize[\s\S]*?chunks\.push\(\{[\s\S]*?content[\s\S]*?end: nextCursor[\s\S]*?index: chunks\.length[\s\S]*?start: cursor/,
  "Data document RAG chunk preview should split local text into ordered fixed-size chunks with ranges",
);

assertDataMatches(
  /function buildDocumentRagIngestionPacketText\(\{[\s\S]*?chunks[\s\S]*?sourceName[\s\S]*?text[\s\S]*?# Prompt AI Studio Document RAG Ingestion Packet[\s\S]*?executionMode: local preview only[\s\S]*?chunkCount:[\s\S]*?Do not write these rows until the Supabase repository and server-side embedding job are ready[\s\S]*?document_sources[\s\S]*?document_chunks[\s\S]*?source ID plus chunk index citations[\s\S]*?Chunk preview/,
  "Data document RAG ingestion packet should be local-only and preserve source/chunk citation gates",
);

assertDataMatches(
  /function buildDocumentRagIngestionPacketManualCopyText\(\{[\s\S]*?packetText[\s\S]*?# Prompt AI Studio 문서\/RAG 수집 패킷[\s\S]*?sourceName:[\s\S]*?원문 길이:[\s\S]*?chunk 수:[\s\S]*?패킷 길이:[\s\S]*?This packet is local preview only[\s\S]*?document_sources row must be created before document_chunks rows[\s\S]*?Embeddings must be generated server-side[\s\S]*?Retrieval must preserve source ID and chunk index citations/,
  "Data document RAG ingestion packet manual fallback should prepend source, length, chunk count, local-only, table order, embedding, and citation gates",
);

assertDataMatches(
  /function buildDocumentRagStudioDraftInput\(\{[\s\S]*?chunks[\s\S]*?sourceName[\s\S]*?text[\s\S]*?문서 이름:[\s\S]*?이 문서 맥락을 바탕으로 외부 AI에 전달할 전문 프롬프트를 작성해줘[\s\S]*?전체 영어 지시문 또는 한영 하이브리드[\s\S]*?source ID와 chunk index를 인용 기준으로 남기고[\s\S]*?Chunk context/,
  "Data document RAG Studio draft input should preserve document identity, prompt intent, automatic language strategy, citation rule, and chunk context",
);

assertDataMatches(
  /function DocumentRagReadinessSummary\(\{[\s\S]*?onOpenInStudio[\s\S]*?studioDraftSummaryItems = \[[\s\S]*?프롬프트 언어[\s\S]*?자동 판단[\s\S]*?입력 언어와 동일[\s\S]*?source ID \+ chunk index[\s\S]*?문서\/RAG 준비도[\s\S]*?문서 업로드와 pgvector 검색[\s\S]*?RAG 준비도 복사[\s\S]*?document_sources[\s\S]*?document_chunks\.embedding[\s\S]*?documentRagReadinessItems\.map[\s\S]*?문서 입력[\s\S]*?텍스트 파일[\s\S]*?문서 원문[\s\S]*?Studio로 보내기[\s\S]*?수집 패킷 복사[\s\S]*?Studio 전송 준비[\s\S]*?chunk preview/,
  "Data view should render a document RAG readiness summary with Studio, copy action, storage/search units, and Studio handoff readiness",
);
assertDataMatches(
  /className="grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-document-rag-summary-metrics"[\s\S]*?min-w-0 rounded-md border border-line bg-surface px-3 py-3[\s\S]*?준비된 항목[\s\S]*?break-words font-mono text-sm text-soft[\s\S]*?설계 필요[\s\S]*?저장 단위[\s\S]*?검색 단위[\s\S]*?document_chunks\.embedding/,
  "Data document RAG summary metrics should keep a compact two-column mobile grid and four-column desktop grid",
);

assertDataMatches(
  /async function handleCopyDocumentRagReadiness\(\)[\s\S]*?const readinessText = buildDocumentRagReadinessText\(\)[\s\S]*?copyDataText\([\s\S]*?readinessText[\s\S]*?문서\/RAG 준비도 리포트를 클립보드에 복사했습니다[\s\S]*?buildDocumentRagReadinessManualCopyText\(\{[\s\S]*?reportText: readinessText/,
  "Data document RAG readiness copy should keep the report on the clipboard and expose a metadata-rich manual fallback",
);

assertDataMatches(
  /async function handleDocumentRagFileChange\([\s\S]*?event: ChangeEvent<HTMLInputElement>[\s\S]*?file\.type\.startsWith\("text\/"\)[\s\S]*?application\/json[\s\S]*?setDocumentRagSourceName\(file\.name\)[\s\S]*?setDocumentRagText\(fileContents\)[\s\S]*?chunk preview/,
  "Data document RAG file handler should accept text-like files and load them into the local chunk preview draft",
);

assertDataMatches(
  /async function handleCopyDocumentRagIngestionPacket\(\)[\s\S]*?documentRagChunks\.length === 0[\s\S]*?buildDocumentRagIngestionPacketText\(\{[\s\S]*?chunks: documentRagChunks[\s\S]*?sourceName: documentRagSourceName[\s\S]*?text: documentRagText[\s\S]*?copyDataText\([\s\S]*?packetText[\s\S]*?문서\/RAG 수집 패킷을 클립보드에 복사했습니다[\s\S]*?buildDocumentRagIngestionPacketManualCopyText/,
  "Data document RAG ingestion packet copy should require chunks and expose a metadata-rich manual fallback",
);

assertDataMatches(
  /function handleOpenDocumentRagInStudio\(\)[\s\S]*?documentRagChunks\.length === 0[\s\S]*?const rawInput = buildDocumentRagStudioDraftInput\(\{[\s\S]*?chunks: documentRagChunks[\s\S]*?sourceName[\s\S]*?text: documentRagText[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?domain: "문서 기반 RAG"[\s\S]*?goal: "문서 맥락 기반 프롬프트 작성"[\s\S]*?outputLanguage: "same_as_input"[\s\S]*?rawInput[\s\S]*?source: "data-document-rag"[\s\S]*?sourceHref: "\/data"[\s\S]*?targetModels: \["gpt", "claude", "gemini"\][\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setManualCopy\(\{[\s\S]*?title: `문서\/RAG Studio 초안 · \$\{sourceName\}`[\s\S]*?body: rawInput[\s\S]*?아래 원문을 직접 선택해 복사하세요[\s\S]*?return[\s\S]*?setManualCopy\(null\)[\s\S]*?router\.push\("\/studio\?draft=data-document-rag"\)/,
  "Data document RAG Studio action should keep a source-tracked manual fallback when draft storage fails and navigate only after a saved draft",
);

assertDataMatches(
  /<DocumentRagReadinessSummary[\s\S]*?chunks=\{documentRagChunks\}[\s\S]*?onClearDraft=\{handleClearDocumentRagDraft\}[\s\S]*?onCopyIngestionPacket=\{handleCopyDocumentRagIngestionPacket\}[\s\S]*?onCopyReadiness=\{handleCopyDocumentRagReadiness\}[\s\S]*?onOpenInStudio=\{handleOpenDocumentRagInStudio\}[\s\S]*?sourceName=\{documentRagSourceName\}[\s\S]*?text=\{documentRagText\}/,
  "Data readiness panel should render document RAG draft input and chunk preview before environment readiness",
);
assertDataMatches(
  /import \{[\s\S]*?ContextOperatingFlow[\s\S]*?type ContextOperatingFlowItem[\s\S]*?\} from "@\/components\/context\/context-operating-flow";/,
  "Data view should use the shared context operating flow component",
);
assertDataMatches(
  /const dataOperationFlowItems: ContextOperatingFlowItem\[\] = \[[\s\S]*?backupIsCurrent[\s\S]*?handleGenerateBackup[\s\S]*?readinessDoneCount[\s\S]*?readinessItems\.length[\s\S]*?documentRagReadyCount[\s\S]*?documentRagChunks\.length[\s\S]*?runtimeReadiness\.data[\s\S]*?formatReleaseGateStage\(runtimeReadiness\.data\.releaseGate\.stage\)/,
  "Data operating flow should summarize backup, readiness, document RAG, and runtime gate state without adding new persistence state",
);
assertDataMatches(
  /<ContextOperatingFlow[\s\S]*?badge="destructive action 분리"[\s\S]*?description="백업을 먼저 고정하고 준비도, 문서\/RAG, Supabase 전환 gate를 순서대로 확인합니다\."[\s\S]*?items=\{dataOperationFlowItems\}[\s\S]*?testId="data-operating-flow"[\s\S]*?title="데이터 운영 흐름"/,
  "Data view should render the shared safe operating flow before detailed data sections",
);
assertDataMatches(
  /const dataSafetyWorkflowSteps = \[[\s\S]*?label: "백업 고정"[\s\S]*?step: "01"[\s\S]*?label: "준비도 확인"[\s\S]*?step: "02"[\s\S]*?label: "실행 분리"[\s\S]*?step: "03"[\s\S]*?data-testid="data-safety-workflow"[\s\S]*?dataSafetyWorkflowSteps\.map[\s\S]*?item\.step[\s\S]*?item\.label[\s\S]*?item\.title[\s\S]*?item\.detail/,
  "Data view should render numbered backup, readiness, and separated execution workflow cards",
);
assertDataMatches(
  /<ContextOperatingFlow[\s\S]*?title="데이터 운영 흐름"[\s\S]*?data-testid="data-safety-workflow"[\s\S]*?<Panel>[\s\S]*?<PanelHeader[\s\S]*?title="워크스페이스 스냅샷"/,
  "Data safety workflow should sit between the top operating flow and workspace snapshot details",
);
assertDataMatches(
  /function CountGrid\(\{ counts \}: \{ counts: WorkspaceBackupCounts \}\)[\s\S]*?className="grid grid-cols-2 gap-3 xl:grid-cols-4"[\s\S]*?data-testid="data-workspace-count-metrics"[\s\S]*?프롬프트[\s\S]*?버전[\s\S]*?피드백[\s\S]*?학습 메모리[\s\S]*?삭제 보관함/,
  "Data workspace count metrics should keep a compact two-column mobile grid and four-column desktop grid",
);
assertDataMatches(
  /className="grid grid-cols-2 gap-3 text-sm leading-6 text-soft md:grid-cols-2"[\s\S]*?data-testid="data-workspace-context-summary"[\s\S]*?사용자 프로필[\s\S]*?회사 프로필[\s\S]*?col-span-2[\s\S]*?최근 백업/,
  "Data workspace context summary should show user and company in two mobile columns while keeping the backup summary full-width",
);
assertDataMatches(
  /href: "#data-readiness"[\s\S]*?href: "#data-document-rag"[\s\S]*?href: "#data-supabase-migration"/,
  "Data operating flow should link to readiness, RAG, and migration sections in order",
);
assertFileIncludes(
  dataSource,
  'id="data-readiness"',
  "Data view should expose a readiness section anchor",
);
assertFileIncludes(
  dataSource,
  'id="data-document-rag"',
  "Data view should expose a document RAG section anchor",
);
assertFileIncludes(
  dataSource,
  'id="data-supabase-migration"',
  "Data view should expose a Supabase migration section anchor",
);

assertFileIncludes(
  promptTypesSource,
  '"data-document-rag"',
  "Prompt draft sources should include the Data document RAG Studio source",
);
assertFileIncludes(
  sourceRegistrySource,
  '"data-document-rag"',
  "Prompt Studio source registry should include the Data document RAG source",
);
assertFileIncludes(
  sourceRegistrySource,
  "Data 문서/RAG chunk 초안",
  "Prompt Studio source registry should label Data document RAG drafts",
);
assertFileIncludes(
  sourceRegistrySource,
  "Data 문서/RAG로 돌아가기",
  "Prompt Studio source registry should label Data document RAG source actions as returning to Data",
);
assertFileIncludes(
  promptTypesSource,
  '"data-document-rag",',
  "Prompt draft source type list should keep Data document RAG as an explicit source option",
);
assert.match(
  sourceRegistrySource,
  /"data-document-rag": \{[\s\S]*?dashboardLabel: "Data 문서\/RAG 초안"[\s\S]*?librarySourceLabel: "Data 문서\/RAG chunk 초안"[\s\S]*?sourceActionLabel: "Data 문서\/RAG로 돌아가기"[\s\S]*?studioLabel: "Data 문서\/RAG chunk 초안"[\s\S]*?studioNextAction:[\s\S]*?문서 chunk의 근거와 인용 범위/,
  "Prompt Studio source registry should keep Data document RAG labels, return action, and citation-oriented next action together",
);
assertDataMatches(
  /interface DataManualCopy \{[\s\S]*?id\?: string;[\s\S]*?title: string;[\s\S]*?body: string;[\s\S]*?\}/,
  "Data manual copy state should allow source-specific IDs for regression-safe fallback panels",
);
assertDataMatches(
  /function DataManualCopyPanel\(\{[\s\S]*?data-testid=\{copy\.id \? `data-manual-copy-\$\{copy\.id\}` : undefined\}[\s\S]*?aria-label=\{`수동 복사용 \$\{copy\.title\}`\}/,
  "Data manual copy panel should expose a stable optional test ID while preserving the manual copy textarea label",
);
assertDataMatches(
  /function handleOpenDocumentRagInStudio\(\)[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setManualCopy\(\{[\s\S]*?id: "document-rag-studio"[\s\S]*?title: `문서\/RAG Studio 초안 · \$\{sourceName\}`[\s\S]*?body: rawInput[\s\S]*?\}\);[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=data-document-rag"\)/,
  "Data document RAG Studio fallback should use a stable manual-copy ID and still navigate only after draft storage succeeds",
);

assertDataMatches(
  /function buildRestoreReportManualCopyText\(\{[\s\S]*?backup[\s\S]*?currentBackupFingerprint[\s\S]*?importFingerprint[\s\S]*?importSource[\s\S]*?impactItems[\s\S]*?reportText[\s\S]*?riskItems[\s\S]*?RestoreReportParams &[\s\S]*?reportText: string[\s\S]*?changedItems = impactItems\.filter[\s\S]*?formatChange\(item\.current, item\.incoming\) !== "동일"[\s\S]*?fingerprintComparison = currentBackupFingerprint[\s\S]*?currentBackupFingerprint === importFingerprint[\s\S]*?# Prompt AI Studio 복원 리포트[\s\S]*?## 복원 리포트 식별[\s\S]*?백업 생성: \$\{formatBackupDate\(backup\.exportedAt\)\}[\s\S]*?가져온 방식: \$\{importSource\}[\s\S]*?가져온 백업 지문: \$\{importFingerprint\}[\s\S]*?최근 백업 기준 지문: \$\{currentBackupFingerprint \|\| "없음"\}[\s\S]*?지문 비교: \$\{fingerprintComparison\}[\s\S]*?리포트 길이: \$\{formatJsonLength\(reportText\)\}[\s\S]*?## 복원 영향 요약[\s\S]*?변경 항목: \$\{changedItems\.length\}개[\s\S]*?리스크 항목: \$\{riskItems\.length\}개[\s\S]*?프롬프트: \$\{backup\.counts\.prompts\}개[\s\S]*?삭제 보관함: \$\{backup\.counts\.deletedPrompts \?\? 0\}개[\s\S]*?## 실행 전 gate 요약[\s\S]*?original backup JSON file[\s\S]*?changed count and profile fields[\s\S]*?fingerprints differ[\s\S]*?validated backup[\s\S]*?## Restore report[\s\S]*?reportText/,
  "Data restore report manual fallback should prepend backup identity, fingerprint comparison, report length, changed/risk counts, data counts, pre-restore backup guard, fingerprint guard, and restore replacement guard",
);

assertDataMatches(
  /async function handleCopyRestoreReport\(\)[\s\S]*?const restoreReportParams = \{[\s\S]*?backup: parseResult\.backup[\s\S]*?currentBackupFingerprint[\s\S]*?importFingerprint: importBackupFingerprint[\s\S]*?importSource: importFileName \|\| "붙여넣기"[\s\S]*?impactItems: restoreImpactItems[\s\S]*?riskItems: restoreRiskItems[\s\S]*?\}[\s\S]*?const reportText = buildRestoreReportText\(restoreReportParams\)[\s\S]*?copyDataText\([\s\S]*?reportText[\s\S]*?복원 리포트를 클립보드에 복사했습니다[\s\S]*?buildRestoreReportManualCopyText\(\{[\s\S]*?\.\.\.restoreReportParams[\s\S]*?reportText/,
  "Data restore report copy should keep the original restore report on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildMigrationMappingManualCopyText\(\{[\s\S]*?items: MigrationMappingItem\[\][\s\S]*?mappingText: string[\s\S]*?readyItems = items\.filter[\s\S]*?item\.status === "ready"[\s\S]*?contextItems = items\.filter[\s\S]*?item\.status === "needs-context"[\s\S]*?futureItems = items\.filter[\s\S]*?item\.status === "future"[\s\S]*?totalRows = items\.reduce\(\(sum, item\) => sum \+ item\.records, 0\)[\s\S]*?# Prompt AI Studio Supabase 마이그레이션 매핑[\s\S]*?## 매핑 식별[\s\S]*?매핑 테이블: \$\{items\.length\}개[\s\S]*?1차 이관 가능 테이블: \$\{readyItems\.length\}개[\s\S]*?컨텍스트 필요 테이블: \$\{contextItems\.length\}개[\s\S]*?추후 테이블: \$\{futureItems\.length\}개[\s\S]*?예상 row 수: \$\{totalRows\}개[\s\S]*?매핑 길이: \$\{formatJsonLength\(mappingText\)\}[\s\S]*?## 실행 전 gate 요약[\s\S]*?workspace owner and auth user id[\s\S]*?workspaces and workspace_members[\s\S]*?deleted_prompt_assets[\s\S]*?document_sources and document_chunks[\s\S]*?## Migration mapping[\s\S]*?mappingText/,
  "Data migration mapping manual fallback should prepend table status counts, expected rows, mapping length, workspace owner gate, insert-order gate, deleted snapshot gate, and future RAG table gate",
);

assertDataMatches(
  /async function handleCopyMigrationMapping\(\)[\s\S]*?const mappingText = buildMigrationMappingText\(migrationMappingItems\)[\s\S]*?copyDataText\([\s\S]*?mappingText[\s\S]*?Supabase 매핑 요약을 클립보드에 복사했습니다[\s\S]*?buildMigrationMappingManualCopyText\(\{[\s\S]*?items: migrationMappingItems[\s\S]*?mappingText/,
  "Data migration mapping copy should keep the original mapping on the clipboard and use the status-count fallback body only for manual copy",
);

assertDataMatches(
  /function buildMigrationChecklistManualCopyText\(\{[\s\S]*?checklistText: string[\s\S]*?items: MigrationChecklistItem\[\][\s\S]*?readyItems = items\.filter[\s\S]*?item\.status === "ready"[\s\S]*?blockedItems = items\.filter[\s\S]*?item\.status === "blocked"[\s\S]*?manualItems = items\.filter[\s\S]*?item\.status === "manual"[\s\S]*?# Prompt AI Studio Supabase 마이그레이션 실행 체크리스트[\s\S]*?## 체크리스트 식별[\s\S]*?체크리스트 항목: \$\{items\.length\}개[\s\S]*?준비됨: \$\{readyItems\.length\}개[\s\S]*?결정 필요: \$\{blockedItems\.length\}개[\s\S]*?수동 확인: \$\{manualItems\.length\}개[\s\S]*?체크리스트 길이: \$\{formatJsonLength\(checklistText\)\}[\s\S]*?## 실행 전 gate 요약[\s\S]*?backup fingerprint and imported backup source[\s\S]*?service role keys server-side only[\s\S]*?docs\/database-schema\.sql[\s\S]*?RLS policies[\s\S]*?rollback criteria and original backup JSON[\s\S]*?## Migration checklist[\s\S]*?checklistText/,
  "Data migration checklist manual fallback should prepend checklist status counts, checklist length, backup-source gate, service-role gate, schema gate, RLS gate, and rollback gate",
);

assertDataMatches(
  /async function handleCopyMigrationChecklist\(\)[\s\S]*?const checklistText = buildMigrationChecklistText\(migrationChecklistItems\)[\s\S]*?copyDataText\([\s\S]*?checklistText[\s\S]*?마이그레이션 체크리스트를 클립보드에 복사했습니다[\s\S]*?buildMigrationChecklistManualCopyText\(\{[\s\S]*?checklistText[\s\S]*?items: migrationChecklistItems/,
  "Data migration checklist copy should keep the original checklist on the clipboard and use the status-count fallback body only for manual copy",
);

assertDataMatches(
  /function buildEnvironmentTemplateManualCopyText\(\{[\s\S]*?templateText: string[\s\S]*?counts = getEnvironmentReadinessCounts\(\)[\s\S]*?# Prompt AI Studio \.env\.local Template[\s\S]*?## 템플릿 식별[\s\S]*?템플릿 길이: \$\{formatJsonLength\(templateText\)\}[\s\S]*?Active variables: \$\{counts\.active\}[\s\S]*?Supabase migration variables: \$\{counts\.migration\}[\s\S]*?Future storage variables: \$\{counts\.future\}[\s\S]*?## Exposure guard 요약[\s\S]*?OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY are server-only values[\s\S]*?NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are browser-public values[\s\S]*?SUPABASE_IMPORT_EXECUTION_ENABLED must default to false[\s\S]*?APP_STORAGE_MODE stays local[\s\S]*?Do not commit \.env\.local[\s\S]*?real secret values[\s\S]*?## \.env\.local template[\s\S]*?templateText/,
  "Data environment template manual fallback should prepend template length, readiness counts, server-only guard, browser-public guard, execution gate default, storage-mode guard, and secret-handling guard",
);

assertDataMatches(
  /async function handleCopyEnvironmentTemplate\(\)[\s\S]*?const environmentTemplateText = buildEnvironmentExampleText\(\)[\s\S]*?copyDataText\([\s\S]*?environmentTemplateText[\s\S]*?\.env\.local 템플릿을 클립보드에 복사했습니다[\s\S]*?buildEnvironmentTemplateManualCopyText\(\{[\s\S]*?templateText: environmentTemplateText/,
  "Data environment template copy should keep the raw env template on the clipboard and use the exposure-guard fallback body only for manual copy",
);

assertDataMatches(
  /function buildEnvironmentReadinessManualCopyText\(\{[\s\S]*?checklistText: string[\s\S]*?runtimeStatus\?: EnvironmentRuntimeStatus[\s\S]*?counts = getEnvironmentReadinessCounts\(\)[\s\S]*?actionQueue =[\s\S]*?runtimeStatus\?\.releaseGate\.checks\.filter[\s\S]*?check\.status !== "pass"[\s\S]*?missingVariables =[\s\S]*?runtimeStatus\?\.variables\.filter[\s\S]*?!item\.configured[\s\S]*?# Prompt AI Studio Environment Readiness Checklist[\s\S]*?## Readiness checklist 식별[\s\S]*?체크리스트 길이: \$\{formatJsonLength\(checklistText\)\}[\s\S]*?Active variables: \$\{counts\.active\}[\s\S]*?Supabase migration variables: \$\{counts\.migration\}[\s\S]*?Future storage variables: \$\{counts\.future\}[\s\S]*?## Runtime readiness 요약[\s\S]*?확인 시각:[\s\S]*?runtimeStatus \? formatBackupDate\(runtimeStatus\.checkedAt\) : "not refreshed"[\s\S]*?Release gate:[\s\S]*?formatReleaseGateStage\(runtimeStatus\.releaseGate\.stage\)[\s\S]*?runtimeStatus\.releaseGate\.score[\s\S]*?Generation mode:[\s\S]*?OpenAI[\s\S]*?Local fallback[\s\S]*?Storage mode: \$\{runtimeStatus\?\.storage\.mode \?\? "not refreshed"\}[\s\S]*?Supabase client:[\s\S]*?Server importer:[\s\S]*?Import execution gate:[\s\S]*?Missing variables: \$\{missingVariables\.length\}개[\s\S]*?Action queue: \$\{actionQueue\.length\}개[\s\S]*?## 운영 gate 요약[\s\S]*?server-only and browser-public values separate[\s\S]*?local fallback[\s\S]*?SUPABASE_IMPORT_EXECUTION_ENABLED should stay false[\s\S]*?RLS smoke tests with app-session credentials[\s\S]*?## Environment readiness checklist[\s\S]*?checklistText/,
  "Data environment readiness manual fallback should prepend checklist length, readiness counts, runtime release gate, generation/storage/Supabase summary, missing variables, action queue, secret exposure gate, local fallback gate, execution gate, and app-session RLS gate",
);

assertDataMatches(
  /async function handleCopyEnvironmentReadiness\(\)[\s\S]*?const readinessText = buildEnvironmentReadinessText\(runtimeReadiness\.data\)[\s\S]*?copyDataText\([\s\S]*?readinessText[\s\S]*?운영 환경 readiness 체크리스트를 클립보드에 복사했습니다[\s\S]*?buildEnvironmentReadinessManualCopyText\(\{[\s\S]*?checklistText: readinessText[\s\S]*?runtimeStatus: runtimeReadiness\.data/,
  "Data environment readiness copy should keep the original checklist on the clipboard and use the runtime-summary fallback body only for manual copy",
);

assertDataMatches(
  /function buildRuntimeStatusManualCopyText\(\{[\s\S]*?runtimeStatus: EnvironmentRuntimeStatus[\s\S]*?# Prompt AI Studio 런타임 상태 JSON[\s\S]*?## 런타임 식별[\s\S]*?확인 시각: \$\{formatBackupDate\(runtimeStatus\.checkedAt\)\}[\s\S]*?Release gate: \$\{formatReleaseGateStage\([\s\S]*?runtimeStatus\.releaseGate\.stage[\s\S]*?runtimeStatus\.releaseGate\.score[\s\S]*?JSON 길이: \$\{formatJsonLength\(json\)\}[\s\S]*?## 운영 요약[\s\S]*?Supabase client:[\s\S]*?Server importer:[\s\S]*?Import execution gate:[\s\S]*?Missing variables:[\s\S]*?Action queue:[\s\S]*?## JSON[\s\S]*?json/,
  "Data runtime status JSON manual fallback should prepend checked time, release gate, environment readiness summary, action queue, and JSON length",
);

assertDataMatches(
  /function buildRuntimeDiagnosticsManualCopyText\(\{[\s\S]*?diagnosticsText: string[\s\S]*?runtimeStatus: EnvironmentRuntimeStatus[\s\S]*?actionQueue = runtimeStatus\.releaseGate\.checks\.filter[\s\S]*?check\.status !== "pass"[\s\S]*?missingVariables = runtimeStatus\.variables\.filter[\s\S]*?!item\.configured[\s\S]*?# Prompt AI Studio 런타임 진단 리포트[\s\S]*?## 진단 식별[\s\S]*?확인 시각: \$\{formatBackupDate\(runtimeStatus\.checkedAt\)\}[\s\S]*?Release gate: \$\{formatReleaseGateStage\([\s\S]*?runtimeStatus\.releaseGate\.stage[\s\S]*?runtimeStatus\.releaseGate\.score[\s\S]*?리포트 길이: \$\{formatJsonLength\(diagnosticsText\)\}[\s\S]*?## 운영 요약[\s\S]*?생성 엔진:[\s\S]*?OpenAI[\s\S]*?Local fallback[\s\S]*?Storage mode: \$\{runtimeStatus\.storage\.mode\}[\s\S]*?Supabase client:[\s\S]*?Server importer:[\s\S]*?Project ref:[\s\S]*?Import execution gate:[\s\S]*?Missing variables: \$\{missingVariables\.length\}개[\s\S]*?Action queue: \$\{actionQueue\.length\}개[\s\S]*?## 공유 gate 요약[\s\S]*?Do not paste raw API keys[\s\S]*?operator action queue[\s\S]*?SUPABASE_IMPORT_EXECUTION_ENABLED disabled[\s\S]*?## Runtime diagnostics report[\s\S]*?diagnosticsText/,
  "Data runtime diagnostics manual fallback should prepend checked time, release gate, diagnostics length, generation/storage/Supabase summary, missing variables, action queue, secret-sharing guard, operator queue guard, and import execution gate guard",
);

assertDataMatches(
  /function buildRuntimeSnapshotsManualCopyText\(\{[\s\S]*?snapshots: EnvironmentRuntimeSnapshot\[\][\s\S]*?# Prompt AI Studio 런타임 스냅샷 JSON[\s\S]*?## 스냅샷 식별[\s\S]*?스냅샷 수: \$\{snapshots\.length\}개[\s\S]*?최근 스냅샷 ID: \$\{latestSnapshot\.id\}[\s\S]*?최근 저장 시각: \$\{formatBackupDate\(latestSnapshot\.savedAt\)\}[\s\S]*?최근 확인 시각: \$\{formatBackupDate\(latestSnapshot\.status\.checkedAt\)\}[\s\S]*?최근 Release gate: \$\{formatReleaseGateStage\([\s\S]*?latestSnapshot\.status\.releaseGate\.stage[\s\S]*?latestSnapshot\.status\.releaseGate\.score[\s\S]*?JSON 길이: \$\{formatJsonLength\(json\)\}[\s\S]*?## JSON[\s\S]*?json/,
  "Data runtime snapshots JSON manual fallback should prepend snapshot count, latest snapshot identity, release gate, and JSON length",
);

assertDataMatches(
  /function buildRuntimeSnapshotComparisonManualCopyText\(\{[\s\S]*?comparisonText: string[\s\S]*?currentStatus: EnvironmentRuntimeStatus[\s\S]*?snapshot: EnvironmentRuntimeSnapshot[\s\S]*?comparison = compareEnvironmentRuntimeSnapshot\(currentStatus, snapshot\)[\s\S]*?# Prompt AI Studio 런타임 스냅샷 비교 리포트[\s\S]*?## 비교 리포트 식별[\s\S]*?최근 스냅샷 ID: \$\{snapshot\.id\}[\s\S]*?최근 저장 시각: \$\{formatBackupDate\(snapshot\.savedAt\)\}[\s\S]*?스냅샷 점검 시각: \$\{formatBackupDate\(snapshot\.status\.checkedAt\)\}[\s\S]*?현재 점검 시각: \$\{formatBackupDate\(currentStatus\.checkedAt\)\}[\s\S]*?리포트 길이: \$\{formatJsonLength\(comparisonText\)\}[\s\S]*?## Gate 변화 요약[\s\S]*?이전 stage: \$\{formatReleaseGateStage\(comparison\.snapshotStage\)\}[\s\S]*?현재 stage: \$\{formatReleaseGateStage\(comparison\.currentStage\)\}[\s\S]*?Stage 변경: \$\{comparison\.stageChanged \? "yes" : "no"\}[\s\S]*?Score delta:[\s\S]*?comparison\.scoreDelta[\s\S]*?변수 변경: \$\{comparison\.changedVariables\.length\}개[\s\S]*?Release gate check 변경: \$\{comparison\.changedChecks\.length\}개[\s\S]*?## 후속 확인 gate[\s\S]*?fresh runtime diagnostics report[\s\S]*?save a new runtime readiness snapshot[\s\S]*?no raw secret values[\s\S]*?## Runtime snapshot comparison report[\s\S]*?comparisonText/,
  "Data runtime snapshot comparison manual fallback should prepend snapshot identity, checked times, report length, stage/score movement, changed variable/check counts, and follow-up verification gates",
);

assertDataMatches(
  /async function handleCopyRuntimeStatusJson\(\)[\s\S]*?const runtimeStatusJson = buildEnvironmentRuntimeStatusJson\([\s\S]*?runtimeReadiness\.data[\s\S]*?copyDataText\([\s\S]*?runtimeStatusJson[\s\S]*?런타임 상태 JSON을 클립보드에 복사했습니다[\s\S]*?buildRuntimeStatusManualCopyText\(\{[\s\S]*?json: runtimeStatusJson[\s\S]*?runtimeStatus: runtimeReadiness\.data/,
  "Data runtime status JSON copy should keep raw JSON on clipboard and use a metadata-rich fallback body only for manual copy",
);

assertDataMatches(
  /async function handleCopyRuntimeDiagnostics\(\)[\s\S]*?const diagnosticsText = buildEnvironmentRuntimeDiagnosticsText\([\s\S]*?runtimeReadiness\.data[\s\S]*?\)[\s\S]*?copyDataText\([\s\S]*?diagnosticsText[\s\S]*?런타임 진단 리포트를 클립보드에 복사했습니다[\s\S]*?buildRuntimeDiagnosticsManualCopyText\(\{[\s\S]*?diagnosticsText[\s\S]*?runtimeStatus: runtimeReadiness\.data/,
  "Data runtime diagnostics copy should keep the original diagnostics report on the clipboard and use the runtime-summary fallback body only for manual copy",
);

assertDataMatches(
  /function buildOperatorActionPlanManualCopyText\(\{[\s\S]*?actionPlanText: string[\s\S]*?runtimeStatus: EnvironmentRuntimeStatus[\s\S]*?actionQueue = runtimeStatus\.releaseGate\.checks\.filter[\s\S]*?check\.status !== "pass"[\s\S]*?blockers = runtimeStatus\.releaseGate\.checks\.filter[\s\S]*?check\.status === "block"[\s\S]*?warnings = runtimeStatus\.releaseGate\.checks\.filter[\s\S]*?check\.status === "warn"[\s\S]*?# Prompt AI Studio 운영자 조치 계획[\s\S]*?## 조치 계획 식별[\s\S]*?확인 시각: \$\{formatBackupDate\(runtimeStatus\.checkedAt\)\}[\s\S]*?Release gate: \$\{formatReleaseGateStage\([\s\S]*?runtimeStatus\.releaseGate\.stage[\s\S]*?runtimeStatus\.releaseGate\.score[\s\S]*?계획 길이: \$\{formatJsonLength\(actionPlanText\)\}[\s\S]*?## Action queue 요약[\s\S]*?Action queue: \$\{actionQueue\.length\}개[\s\S]*?Blockers: \$\{blockers\.length\}개[\s\S]*?Warnings: \$\{warnings\.length\}개[\s\S]*?Generation mode: \$\{runtimeStatus\.generation\.mode\}[\s\S]*?Storage mode: \$\{runtimeStatus\.storage\.mode\}[\s\S]*?Import execution gate:[\s\S]*?## 실행 후 확인 gate[\s\S]*?Restart the dev or deployment runtime[\s\S]*?Open `\/data` and refresh runtime readiness[\s\S]*?fresh runtime diagnostics report[\s\S]*?no raw API keys[\s\S]*?service_role keys[\s\S]*?## Operator action plan[\s\S]*?actionPlanText/,
  "Data operator action plan manual fallback should prepend checked time, release gate, plan length, action queue counts, blocker/warning counts, runtime mode, storage mode, import gate, verification steps, and secret-sharing guard",
);

assertDataMatches(
  /async function handleCopyOperatorActionPlan\(\)[\s\S]*?const actionPlanText = buildEnvironmentOperatorActionPlanText\([\s\S]*?runtimeReadiness\.data[\s\S]*?\)[\s\S]*?copyDataText\([\s\S]*?actionPlanText[\s\S]*?운영자 조치 계획을 클립보드에 복사했습니다[\s\S]*?buildOperatorActionPlanManualCopyText\(\{[\s\S]*?actionPlanText[\s\S]*?runtimeStatus: runtimeReadiness\.data/,
  "Data operator action plan copy should keep the original action plan on the clipboard and use the action-queue fallback body only for manual copy",
);

assertDataMatches(
  /async function handleCopyRuntimeSnapshots\(\)[\s\S]*?const runtimeSnapshotsJson =[\s\S]*?buildEnvironmentRuntimeSnapshotsJson\(runtimeSnapshots\)[\s\S]*?copyDataText\([\s\S]*?runtimeSnapshotsJson[\s\S]*?런타임 readiness 스냅샷 JSON을 클립보드에 복사했습니다[\s\S]*?buildRuntimeSnapshotsManualCopyText\(\{[\s\S]*?json: runtimeSnapshotsJson[\s\S]*?snapshots: runtimeSnapshots/,
  "Data runtime snapshots JSON copy should keep raw JSON on clipboard and use a metadata-rich fallback body only for manual copy",
);

assertDataMatches(
  /async function handleCopySnapshotComparison\(\)[\s\S]*?const comparisonText = buildEnvironmentRuntimeSnapshotComparisonText\([\s\S]*?runtimeReadiness\.data[\s\S]*?runtimeSnapshots\[0\][\s\S]*?\)[\s\S]*?copyDataText\([\s\S]*?comparisonText[\s\S]*?런타임 readiness 스냅샷 비교 리포트를 복사했습니다[\s\S]*?buildRuntimeSnapshotComparisonManualCopyText\(\{[\s\S]*?comparisonText[\s\S]*?currentStatus: runtimeReadiness\.data[\s\S]*?snapshot: runtimeSnapshots\[0\]/,
  "Data runtime snapshot comparison copy should keep the original comparison report on the clipboard and use the movement-summary fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseImportDryRunManualCopyText\(\{[\s\S]*?dryRun: SupabaseImportDryRun[\s\S]*?dryRunText: string[\s\S]*?deletedArchiveRows =[\s\S]*?deleted_prompt_assets[\s\S]*?setupWarnings = dryRun\.warningItems\.filter[\s\S]*?relationshipWarnings = dryRun\.warningItems\.filter[\s\S]*?# Prompt AI Studio Supabase Importer Dry-run[\s\S]*?## Dry-run 식별[\s\S]*?schemaVersion: \$\{dryRun\.schemaVersion\}[\s\S]*?Dry-run 길이: \$\{formatJsonLength\(dryRunText\)\}[\s\S]*?## Payload 요약[\s\S]*?Total rows: \$\{dryRun\.totalRows\}[\s\S]*?Insert batches: \$\{dryRun\.batches\.length\}[\s\S]*?Deleted archive rows: \$\{deletedArchiveRows\}[\s\S]*?Pending row IDs: \$\{dryRun\.totalRows\}[\s\S]*?## Warning 요약[\s\S]*?Total warnings: \$\{dryRun\.warnings\.length\}[\s\S]*?Setup warnings: \$\{setupWarnings\.length\}[\s\S]*?Relationship warnings: \$\{relationshipWarnings\.length\}[\s\S]*?## Dry-run gate 요약[\s\S]*?does not connect to Supabase or write data[\s\S]*?pending-\* IDs must be replaced[\s\S]*?deleted_prompt_assets rows preserve deleted prompt snapshots[\s\S]*?review setup and relationship warnings before API preflight[\s\S]*?## Importer dry-run[\s\S]*?dryRunText/,
  "Data importer dry-run manual fallback should prepend schema, row/batch/deleted archive counts, warning categories, local-only guard, pending replacement guard, archive trace guard, and dry-run length",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabaseImportDryRunManualCopyText",
    "const deletedArchiveRows =",
    "deleted_prompt_assets",
    "const setupWarnings = dryRun.warningItems.filter",
    "warning.category === \"setup\"",
    "const relationshipWarnings = dryRun.warningItems.filter",
    "warning.category === \"relationship\"",
    "# Prompt AI Studio Supabase Importer Dry-run",
    "## Dry-run 식별",
    "schemaVersion: ${dryRun.schemaVersion}",
    "Dry-run 길이: ${formatJsonLength(dryRunText)}",
    "## Payload 요약",
    "Total rows: ${dryRun.totalRows}",
    "Insert batches: ${dryRun.batches.length}",
    "Deleted archive rows: ${deletedArchiveRows}",
    "Pending row IDs: ${dryRun.totalRows}",
    "## Warning 요약",
    "Total warnings: ${dryRun.warnings.length}",
    "Setup warnings: ${setupWarnings.length}",
    "Relationship warnings: ${relationshipWarnings.length}",
    "## Dry-run gate 요약",
    "This dry-run is generated locally and does not connect to Supabase or write data.",
    "pending-* IDs must be replaced by the import execution plan before insert.",
    "deleted_prompt_assets rows preserve deleted prompt snapshots for archive trace checks.",
    "Operators must review setup and relationship warnings before API preflight.",
    "## Importer dry-run",
    "dryRunText",
  ],
  "Data importer dry-run manual fallback should keep schema, payload counts, warning counts, local-only gate, pending replacement gate, archive trace gate, and raw dry-run together",
);
assertFileIncludesInOrder(
  supabaseImportDryRunSource,
  [
    "export function buildSupabaseImportDryRunText",
    "# Prompt AI Studio Supabase Importer Dry-run",
    "schemaVersion: ${dryRun.schemaVersion}",
    "totalRows: ${dryRun.totalRows}",
    "batches: ${dryRun.batches.length}",
    "warnings: ${dryRun.warnings.length}",
    "## Insert batches",
    "...dryRun.batches.map",
    "batch.order",
    "batch.table",
    "batch.rows.length",
    "batch.dependency",
    "## Warnings",
    "dryRun.warningItems.length > 0",
    "formatWarningLabel(warning)",
    "- 없음",
    "## Payload preview",
    "JSON.stringify(dryRun.batches, null, 2)",
  ],
  "Supabase importer dry-run text should keep summary, insert batches, warnings, and payload preview in dry-run order",
);

assertDataMatches(
  /async function handleCopySupabaseImportDryRun\(\)[\s\S]*?const dryRunText = buildSupabaseImportDryRunText\(supabaseImportDryRun\)[\s\S]*?copyDataText\([\s\S]*?dryRunText[\s\S]*?Supabase importer dry-run을 클립보드에 복사했습니다[\s\S]*?buildSupabaseImportDryRunManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?dryRunText/,
  "Data importer dry-run copy should keep the original dry-run on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseReferenceReplacementGuideManualCopyText\(\{[\s\S]*?dryRun: SupabaseImportDryRun[\s\S]*?guideText: string[\s\S]*?replacementTables = \[[\s\S]*?prompt_assets[\s\S]*?prompt_versions[\s\S]*?learning_memories[\s\S]*?replacementRows = replacementTables\.flatMap[\s\S]*?deletedArchiveRows =[\s\S]*?deleted_prompt_assets[\s\S]*?# Prompt AI Studio Supabase Pending ID Replacement Guide[\s\S]*?## 치환 가이드 식별[\s\S]*?schemaVersion: \$\{dryRun\.schemaVersion\}[\s\S]*?가이드 길이: \$\{formatJsonLength\(guideText\)\}[\s\S]*?## 치환 범위 요약[\s\S]*?Replacement tables: \$\{replacementTables\.length\}[\s\S]*?Local-to-pending rows: \$\{replacementRows\.length\}[\s\S]*?Deleted archive rows: \$\{deletedArchiveRows\}[\s\S]*?Total dry-run rows: \$\{dryRun\.totalRows\}[\s\S]*?Dry-run warnings: \$\{dryRun\.warnings\.length\}[\s\S]*?## 치환 gate 요약[\s\S]*?Replace every pending-\* primary key and foreign key[\s\S]*?Rewrite active improvement source[\s\S]*?Rewrite learning_memories\.source_id[\s\S]*?Keep deleted_prompt_assets original local IDs[\s\S]*?Run pending ID audit SQL after import[\s\S]*?## Pending ID replacement guide[\s\S]*?guideText/,
  "Data pending ID replacement guide manual fallback should prepend schema, replacement table count, local-to-pending row count, deleted archive rows, warnings, rewrite gates, archive trace gate, pending audit gate, and guide length",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabaseReferenceReplacementGuideManualCopyText",
    "const replacementTables = [",
    "\"user_profiles\"",
    "\"company_profiles\"",
    "\"prompt_assets\"",
    "\"prompt_versions\"",
    "\"feedback\"",
    "\"learning_memories\"",
    "\"prompt_skills\"",
    "const replacementRows = replacementTables.flatMap",
    "const deletedArchiveRows =",
    "deleted_prompt_assets",
    "# Prompt AI Studio Supabase Pending ID Replacement Guide",
    "## 치환 가이드 식별",
    "schemaVersion: ${dryRun.schemaVersion}",
    "가이드 길이: ${formatJsonLength(guideText)}",
    "## 치환 범위 요약",
    "Replacement tables: ${replacementTables.length}",
    "Local-to-pending rows: ${replacementRows.length}",
    "Deleted archive rows: ${deletedArchiveRows}",
    "Total dry-run rows: ${dryRun.totalRows}",
    "Dry-run warnings: ${dryRun.warnings.length}",
    "## 치환 gate 요약",
    "Replace every pending-* primary key and foreign key with a real Supabase UUID before insert.",
    "Rewrite active improvement source prompt/version/feedback references.",
    "Rewrite learning_memories.source_id for feedback, profile, and company sources.",
    "Keep deleted_prompt_assets original local IDs and prompt_snapshot IDs as archive trace values.",
    "Run pending ID audit SQL after import; any remaining pending-* value is a failed import.",
    "## Pending ID replacement guide",
    "guideText",
  ],
  "Data pending ID replacement guide manual fallback should keep replacement scope, row/archive counts, rewrite gates, archive trace gate, pending audit gate, and raw guide together",
);
assertFileIncludesInOrder(
  supabaseImportDryRunSource,
  [
    "export function buildSupabaseImportReferenceReplacementGuideText",
    "const replacementTables = [",
    "\"user_profiles\"",
    "\"company_profiles\"",
    "\"prompt_assets\"",
    "\"prompt_versions\"",
    "\"feedback\"",
    "\"learning_memories\"",
    "\"prompt_skills\"",
    "const tableSections = replacementTables.flatMap",
    "formatPendingReplacementRows(getDryRunBatchRows(dryRun, table))",
    "const deletedArchiveRows = getDryRunBatchRows(dryRun, \"deleted_prompt_assets\");",
    "## Pending ID replacement guide",
    "Use this guide when implementing the real Supabase importer.",
    "### Required rewrites",
    "Replace every `pending-*` primary key and foreign key with a real UUID before insert.",
    "Rewrite `prompt_assets.improvement_source.sourcePromptId` and `sourceVersionId` for active source prompts/versions.",
    "Rewrite `prompt_assets.improvement_source.sourceFeedback.id` and `sourceFeedback.promptVersionId` for active source feedback.",
    "Rewrite `learning_memories.source_id` when `source_type` is `feedback`, `profile`, or `company`.",
    "Keep `deleted_prompt_assets.original_prompt_asset_id` and IDs inside `prompt_snapshot` as archive trace IDs; these are used by deleted-source relationship checks.",
    "After import, run the pending ID audit SQL. Any remaining `pending-*` value is a failed import.",
    "### Local to pending map",
    "...tableSections",
    "### deleted_prompt_assets archive trace IDs",
    "deletedArchiveRows.length > 0",
    "original ID remains in original_prompt_asset_id",
    "- No deleted archive rows",
  ],
  "Supabase pending ID replacement guide should keep rewrite rules, local-to-pending map, and deleted archive trace IDs in guide order",
);

assertDataMatches(
  /async function handleCopySupabaseReferenceReplacementGuide\(\)[\s\S]*?const guideText =[\s\S]*?buildSupabaseImportReferenceReplacementGuideText\(supabaseImportDryRun\)[\s\S]*?copyDataText\([\s\S]*?guideText[\s\S]*?Supabase pending ID 치환 가이드를 클립보드에 복사했습니다[\s\S]*?buildSupabaseReferenceReplacementGuideManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?guideText/,
  "Data pending ID replacement guide copy should keep the original guide on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseImportVerificationSqlManualCopyText\(\{[\s\S]*?dryRun: SupabaseImportDryRun[\s\S]*?sql: string[\s\S]*?workspaceId\?: string[\s\S]*?workspaceScope = workspaceId\?\.trim\(\) \|\| "<workspace_id>"[\s\S]*?deletedArchiveRows =[\s\S]*?deleted_prompt_assets[\s\S]*?# Prompt AI Studio Supabase Import Verification SQL[\s\S]*?## 검증 SQL 식별[\s\S]*?workspace_id: \$\{workspaceScope\}[\s\S]*?schemaVersion: \$\{dryRun\.schemaVersion\}[\s\S]*?SQL 길이: \$\{formatJsonLength\(sql\)\}[\s\S]*?## Row count 검증 요약[\s\S]*?Expected rows: \$\{dryRun\.totalRows\}[\s\S]*?Expected tables: \$\{dryRun\.batches\.length\}[\s\S]*?Deleted archive rows: \$\{deletedArchiveRows\}[\s\S]*?Workspace scope: \$\{workspaceId\?\.trim\(\) \? "resolved" : "template"\}[\s\S]*?## 실행 후 gate 요약[\s\S]*?Run this SQL after the import completes[\s\S]*?row count mismatch blocks migration acceptance[\s\S]*?relationship, pending ID, and RLS owner audits[\s\S]*?## Verification SQL[\s\S]*?sql/,
  "Data row count verification SQL manual fallback should prepend workspace scope, schema, SQL length, expected rows/tables, deleted archive rows, execution gate, mismatch gate, and follow-up audit gates",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabaseImportVerificationSqlManualCopyText",
    "const workspaceScope = workspaceId?.trim() || \"<workspace_id>\";",
    "const deletedArchiveRows =",
    "deleted_prompt_assets",
    "# Prompt AI Studio Supabase Import Verification SQL",
    "## 검증 SQL 식별",
    "workspace_id: ${workspaceScope}",
    "schemaVersion: ${dryRun.schemaVersion}",
    "SQL 길이: ${formatJsonLength(sql)}",
    "## Row count 검증 요약",
    "Expected rows: ${dryRun.totalRows}",
    "Expected tables: ${dryRun.batches.length}",
    "Deleted archive rows: ${deletedArchiveRows}",
    "Workspace scope: ${workspaceId?.trim() ? \"resolved\" : \"template\"}",
    "## 실행 후 gate 요약",
    "Run this SQL after the import completes in the target Supabase project.",
    "Any row count mismatch blocks migration acceptance until reviewed.",
    "Follow with relationship, pending ID, and RLS owner audits.",
    "## Verification SQL",
    "sql",
  ],
  "Data row count verification SQL manual fallback should keep workspace scope, row/table/archive counts, execution gate, mismatch gate, follow-up audit gate, and raw SQL together",
);
assertFileIncludesInOrder(
  supabaseImportDryRunSource,
  [
    "export function buildSupabaseImportVerificationSql",
    "const workspaceId = options.workspaceId?.trim();",
    "const workspaceIdValue =",
    "isSupabaseWorkspaceUuid(workspaceId)",
    "const countChecks = dryRun.batches.map",
    "const countSql = getWorkspaceScopedCountSql(batch.table);",
    "select",
    "${batch.order} as check_order,",
    "'${batch.table}' as table_name,",
    "${batch.rows.length} as expected_rows,",
    "(${countSql}) as actual_rows",
    "-- Prompt AI Studio Supabase import verification",
    "-- Run after importer execution. This query is read-only.",
    "-- Replace <workspace_id> with the imported workspace UUID before running.",
    "-- Target workspace_id: ${workspaceIdValue}",
    "with target_workspace as (",
    "select '${workspaceIdValue}'::uuid as workspace_id",
    "checks as (",
    "countChecks.join(\"\\nunion all\\n\")",
    "select",
    "check_order,",
    "table_name,",
    "expected_rows,",
    "actual_rows,",
    "case when actual_rows = expected_rows",
    "then 'pass'",
    "else 'review'",
    "end as status",
    "from checks",
    "order by check_order;",
  ],
  "Supabase row count verification SQL should keep workspace target, expected/actual count checks, pass/review status, and check-order sorting in SQL order",
);

assertDataMatches(
  /async function handleCopySupabaseVerificationSql\(\)[\s\S]*?const verificationSql =[\s\S]*?buildSupabaseImportVerificationSql\(supabaseImportDryRun\)[\s\S]*?copyDataText\([\s\S]*?verificationSql[\s\S]*?Supabase 검증 SQL을 클립보드에 복사했습니다[\s\S]*?buildSupabaseImportVerificationSqlManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?sql: verificationSql/,
  "Data row count verification SQL template copy should keep the original SQL on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /async function handleCopyResolvedSupabaseVerificationSql\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?const verificationSql = buildSupabaseImportVerificationSql\([\s\S]*?workspaceId[\s\S]*?copyDataText\([\s\S]*?verificationSql[\s\S]*?workspace_id가 반영된 Supabase 검증 SQL을 복사했습니다[\s\S]*?buildSupabaseImportVerificationSqlManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?sql: verificationSql[\s\S]*?workspaceId/,
  "Data resolved row count verification SQL copy should keep workspace_id-resolved SQL on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseRelationshipVerificationSqlManualCopyText\(\{[\s\S]*?dryRun: SupabaseImportDryRun[\s\S]*?sql: string[\s\S]*?workspaceId\?: string[\s\S]*?workspaceScope = workspaceId\?\.trim\(\) \|\| "<workspace_id>"[\s\S]*?relationshipWarnings = dryRun\.warningItems\.filter[\s\S]*?warning\.category === "relationship"[\s\S]*?deletedArchiveRows =[\s\S]*?deleted_prompt_assets[\s\S]*?# Prompt AI Studio Supabase Relationship Verification SQL[\s\S]*?## 관계 검증 SQL 식별[\s\S]*?workspace_id: \$\{workspaceScope\}[\s\S]*?schemaVersion: \$\{dryRun\.schemaVersion\}[\s\S]*?SQL 길이: \$\{formatJsonLength\(sql\)\}[\s\S]*?## 관계 검증 요약[\s\S]*?Relationship checks: \$\{supabaseImportVerificationCheckCounts\.relationship\}[\s\S]*?Relationship warnings: \$\{relationshipWarnings\.length\}[\s\S]*?Deleted archive rows: \$\{deletedArchiveRows\}[\s\S]*?Workspace scope: \$\{workspaceId\?\.trim\(\) \? "resolved" : "template"\}[\s\S]*?## 실행 후 gate 요약[\s\S]*?Run this SQL after row count verification passes[\s\S]*?Every issue_count must be 0[\s\S]*?deleted_prompt_assets snapshots[\s\S]*?pending ID and RLS owner audits[\s\S]*?## Relationship verification SQL[\s\S]*?sql/,
  "Data relationship verification SQL manual fallback should prepend workspace scope, schema, SQL length, relationship checks/warnings, deleted archive rows, execution order, issue_count gate, archive reference gate, and follow-up audit gates",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabaseRelationshipVerificationSqlManualCopyText",
    "const workspaceScope = workspaceId?.trim() || \"<workspace_id>\";",
    "const relationshipWarnings = dryRun.warningItems.filter",
    "warning.category === \"relationship\"",
    "const deletedArchiveRows =",
    "deleted_prompt_assets",
    "# Prompt AI Studio Supabase Relationship Verification SQL",
    "## 관계 검증 SQL 식별",
    "workspace_id: ${workspaceScope}",
    "schemaVersion: ${dryRun.schemaVersion}",
    "SQL 길이: ${formatJsonLength(sql)}",
    "## 관계 검증 요약",
    "Relationship checks: ${supabaseImportVerificationCheckCounts.relationship}",
    "Relationship warnings: ${relationshipWarnings.length}",
    "Deleted archive rows: ${deletedArchiveRows}",
    "Workspace scope: ${workspaceId?.trim() ? \"resolved\" : \"template\"}",
    "## 실행 후 gate 요약",
    "Run this SQL after row count verification passes for the imported workspace.",
    "Every issue_count must be 0 before migration acceptance.",
    "Deleted prompt references are accepted only through deleted_prompt_assets snapshots.",
    "Follow with pending ID and RLS owner audits.",
    "## Relationship verification SQL",
    "sql",
  ],
  "Data relationship verification SQL manual fallback should keep workspace scope, relationship warning/archive counts, execution order, issue_count gate, archive reference gate, follow-up audit gate, and raw SQL together",
);
assertFileIncludesInOrder(
  supabaseImportDryRunSource,
  [
    "export function buildSupabaseImportRelationshipVerificationSql",
    "const workspaceId = options.workspaceId?.trim();",
    "const workspaceIdValue =",
    "isSupabaseWorkspaceUuid(workspaceId)",
    "-- Prompt AI Studio Supabase relationship verification",
    "-- Run after importer execution. This query is read-only.",
    "-- Replace <workspace_id> with the imported workspace UUID before running.",
    "-- Target workspace_id: ${workspaceIdValue}",
    "with target_workspace as (",
    "select '${workspaceIdValue}'::uuid as workspace_id",
    "workspace_prompt_assets as (",
    "workspace_deleted_prompt_assets as (",
    "workspace_deleted_prompt_versions as (",
    "workspace_deleted_prompt_feedback as (",
    "workspace_prompt_skills as (",
    "workspace_learning_memories as (",
    "workspace_user_profiles as (",
    "workspace_company_profiles as (",
    "checks as (",
    "1 as check_order,",
    "prompt_assets.source_skill_id",
    "2 as check_order,",
    "prompt_assets.improvement_source.sourcePromptId",
    "deleted_source_prompt.original_prompt_asset_id",
    "3 as check_order,",
    "prompt_assets.improvement_source.sourceVersionId",
    "deleted_source_version.original_version_id",
    "4 as check_order,",
    "prompt_assets.improvement_source.sourceFeedback.id",
    "deleted_source_feedback.original_feedback_id",
    "5 as check_order,",
    "prompt_assets.improvement_source.sourceFeedback.promptVersionId",
    "6 as check_order,",
    "prompt_assets.improvement_source.sourceFeedback completeness",
    "7 as check_order,",
    "prompt_assets.improvement_source.sourceFeedback pair",
    "13 as check_order,",
    "learning_memories.source_id profile",
    "14 as check_order,",
    "learning_memories.source_id company",
    "issue_count,",
    "case when issue_count = 0",
    "then 'pass'",
    "else 'review'",
    "end as status",
    "from checks",
    "order by check_order;",
  ],
  "Supabase relationship verification SQL should keep workspace CTEs, active/deleted relationship checks, issue_count status, and check-order sorting in SQL order",
);

assertDataMatches(
  /async function handleCopySupabaseRelationshipVerificationSql\(\)[\s\S]*?const relationshipSql = buildSupabaseImportRelationshipVerificationSql\(\)[\s\S]*?copyDataText\([\s\S]*?relationshipSql[\s\S]*?Supabase 관계 검증 SQL 템플릿을 클립보드에 복사했습니다[\s\S]*?buildSupabaseRelationshipVerificationSqlManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?sql: relationshipSql/,
  "Data relationship verification SQL template copy should keep the original SQL on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /async function handleCopyResolvedSupabaseRelationshipVerificationSql\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?const relationshipSql = buildSupabaseImportRelationshipVerificationSql\(\{[\s\S]*?workspaceId[\s\S]*?copyDataText\([\s\S]*?relationshipSql[\s\S]*?workspace_id가 반영된 Supabase 관계 검증 SQL을 복사했습니다[\s\S]*?buildSupabaseRelationshipVerificationSqlManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?sql: relationshipSql[\s\S]*?workspaceId/,
  "Data resolved relationship verification SQL copy should keep workspace_id-resolved SQL on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabasePendingIdAuditSqlManualCopyText\(\{[\s\S]*?dryRun: SupabaseImportDryRun[\s\S]*?sql: string[\s\S]*?workspaceId\?: string[\s\S]*?workspaceScope = workspaceId\?\.trim\(\) \|\| "<workspace_id>"[\s\S]*?replacementTables = \[[\s\S]*?prompt_assets[\s\S]*?prompt_versions[\s\S]*?learning_memories[\s\S]*?replacementRows = replacementTables\.flatMap[\s\S]*?deletedArchiveRows =[\s\S]*?deleted_prompt_assets[\s\S]*?# Prompt AI Studio Supabase Pending ID Audit SQL[\s\S]*?## Pending ID audit SQL 식별[\s\S]*?workspace_id: \$\{workspaceScope\}[\s\S]*?schemaVersion: \$\{dryRun\.schemaVersion\}[\s\S]*?SQL 길이: \$\{formatJsonLength\(sql\)\}[\s\S]*?## Pending ID audit 요약[\s\S]*?Pending ID checks: \$\{supabaseImportVerificationCheckCounts\.pendingIdAudit\}[\s\S]*?Replacement tables: \$\{replacementTables\.length\}[\s\S]*?Local-to-pending rows: \$\{replacementRows\.length\}[\s\S]*?Deleted archive rows: \$\{deletedArchiveRows\}[\s\S]*?Workspace scope: \$\{workspaceId\?\.trim\(\) \? "resolved" : "template"\}[\s\S]*?## 실행 후 gate 요약[\s\S]*?row count and relationship verification pass[\s\S]*?Every issue_count must be 0[\s\S]*?remaining pending-\* value[\s\S]*?Supabase UUIDs[\s\S]*?RLS owner access audit and authenticated RLS smoke tests[\s\S]*?## Pending ID audit SQL[\s\S]*?sql/,
  "Data pending ID audit SQL manual fallback should prepend workspace scope, schema, SQL length, pending check count, replacement table/row counts, deleted archive rows, issue_count gate, UUID rewrite gate, and RLS follow-up gates",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabasePendingIdAuditSqlManualCopyText",
    "const workspaceScope = workspaceId?.trim() || \"<workspace_id>\";",
    "const replacementTables = [",
    "\"user_profiles\"",
    "\"company_profiles\"",
    "\"prompt_assets\"",
    "\"prompt_versions\"",
    "\"feedback\"",
    "\"learning_memories\"",
    "\"prompt_skills\"",
    "const replacementRows = replacementTables.flatMap",
    "const deletedArchiveRows =",
    "deleted_prompt_assets",
    "# Prompt AI Studio Supabase Pending ID Audit SQL",
    "## Pending ID audit SQL 식별",
    "workspace_id: ${workspaceScope}",
    "schemaVersion: ${dryRun.schemaVersion}",
    "SQL 길이: ${formatJsonLength(sql)}",
    "## Pending ID audit 요약",
    "Pending ID checks: ${supabaseImportVerificationCheckCounts.pendingIdAudit}",
    "Replacement tables: ${replacementTables.length}",
    "Local-to-pending rows: ${replacementRows.length}",
    "Deleted archive rows: ${deletedArchiveRows}",
    "Workspace scope: ${workspaceId?.trim() ? \"resolved\" : \"template\"}",
    "## 실행 후 gate 요약",
    "Run this SQL after row count and relationship verification pass.",
    "Every issue_count must be 0 before migration acceptance.",
    "Any remaining pending-* value means the import payload was not fully rewritten to Supabase UUIDs.",
    "Follow with RLS owner access audit and authenticated RLS smoke tests.",
    "## Pending ID audit SQL",
    "sql",
  ],
  "Data pending ID audit SQL manual fallback should keep workspace scope, replacement counts, archive counts, issue_count gate, UUID rewrite gate, RLS follow-up gate, and raw SQL together",
);
assertFileIncludesInOrder(
  supabaseImportDryRunSource,
  [
    "export function buildSupabaseImportPendingIdAuditSql",
    "const workspaceId = options.workspaceId?.trim();",
    "const workspaceIdValue =",
    "isSupabaseWorkspaceUuid(workspaceId)",
    "-- Prompt AI Studio Supabase pending ID audit",
    "-- Run after importer execution. This query is read-only.",
    "-- Replace <workspace_id> with the imported workspace UUID before running.",
    "-- Target workspace_id: ${workspaceIdValue}",
    "with target_workspace as (",
    "select '${workspaceIdValue}'::uuid as workspace_id",
    "workspace_prompt_assets as (",
    "workspace_deleted_prompt_assets as (",
    "workspace_prompt_skills as (",
    "workspace_learning_memories as (",
    "checks as (",
    "1 as check_order,",
    "prompt_assets.improvement_source",
    "jsonb improvement_source should not contain pending-* IDs",
    "2 as check_order,",
    "prompt_assets.language_decision",
    "3 as check_order,",
    "prompt_assets.target_model_decision",
    "4 as check_order,",
    "learning_memories.source_id",
    "5 as check_order,",
    "prompt_skills.language_decision",
    "6 as check_order,",
    "deleted_prompt_assets.prompt_snapshot",
    "deleted prompt snapshot should not contain pending-* IDs",
    "issue_count,",
    "case when issue_count = 0",
    "then 'pass'",
    "else 'review'",
    "end as status",
    "from checks",
    "order by check_order;",
  ],
  "Supabase pending ID audit SQL should keep workspace CTEs, pending-* field checks, issue_count status, and check-order sorting in SQL order",
);

assertDataMatches(
  /async function handleCopySupabasePendingIdAuditSql\(\)[\s\S]*?const pendingIdAuditSql = buildSupabaseImportPendingIdAuditSql\(\)[\s\S]*?copyDataText\([\s\S]*?pendingIdAuditSql[\s\S]*?Supabase pending ID audit SQL 템플릿을 클립보드에 복사했습니다[\s\S]*?buildSupabasePendingIdAuditSqlManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?sql: pendingIdAuditSql/,
  "Data pending ID audit SQL template copy should keep the original SQL on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /async function handleCopyResolvedSupabasePendingIdAuditSql\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?const pendingIdAuditSql = buildSupabaseImportPendingIdAuditSql\(\{[\s\S]*?workspaceId[\s\S]*?copyDataText\([\s\S]*?pendingIdAuditSql[\s\S]*?workspace_id가 반영된 Supabase pending ID audit SQL을 복사했습니다[\s\S]*?buildSupabasePendingIdAuditSqlManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?sql: pendingIdAuditSql[\s\S]*?workspaceId/,
  "Data resolved pending ID audit SQL copy should keep workspace_id-resolved SQL on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseRlsAccessAuditSqlManualCopyText\(\{[\s\S]*?dryRun: SupabaseImportDryRun[\s\S]*?ownerUserId\?: string[\s\S]*?sql: string[\s\S]*?workspaceId\?: string[\s\S]*?workspaceScope = workspaceId\?\.trim\(\) \|\| "<workspace_id>"[\s\S]*?ownerScope = ownerUserId\?\.trim\(\) \|\| "<owner_user_id>"[\s\S]*?deletedArchiveRows =[\s\S]*?deleted_prompt_assets[\s\S]*?# Prompt AI Studio Supabase RLS Owner Access Audit SQL[\s\S]*?## RLS audit SQL 식별[\s\S]*?workspace_id: \$\{workspaceScope\}[\s\S]*?owner_user_id: \$\{ownerScope\}[\s\S]*?schemaVersion: \$\{dryRun\.schemaVersion\}[\s\S]*?SQL 길이: \$\{formatJsonLength\(sql\)\}[\s\S]*?## Owner access audit 요약[\s\S]*?RLS owner access checks: \$\{supabaseImportVerificationCheckCounts\.rlsOwnerAccess\}[\s\S]*?Expected imported rows: \$\{dryRun\.totalRows\}[\s\S]*?Insert batches: \$\{dryRun\.batches\.length\}[\s\S]*?Deleted archive rows: \$\{deletedArchiveRows\}[\s\S]*?Scope:[\s\S]*?workspaceId\?\.trim\(\) && ownerUserId\?\.trim\(\) \? "resolved" : "template"[\s\S]*?## 실행 후 gate 요약[\s\S]*?row count, relationship, and pending ID audits pass[\s\S]*?Every issue_count must be 0[\s\S]*?workspaces\.owner_user_id and workspace_members owner row[\s\S]*?authenticated app-session RLS smoke tests[\s\S]*?## RLS owner access audit SQL[\s\S]*?sql/,
  "Data RLS owner access audit SQL manual fallback should prepend workspace/owner identity, schema, SQL length, owner access check count, imported row/batch/archive counts, issue_count gate, owner mapping gate, and authenticated smoke-test gate",
);
assertFileIncludesInOrder(
  supabaseImportDryRunSource,
  [
    "export function buildSupabaseImportRlsAccessAuditSql",
    "const workspaceId = options.workspaceId?.trim();",
    "const ownerUserId = options.ownerUserId?.trim();",
    "const workspaceIdValue =",
    "isSupabaseWorkspaceUuid(workspaceId)",
    "const ownerUserIdValue =",
    "isSupabaseWorkspaceUuid(ownerUserId)",
    "-- Prompt AI Studio Supabase RLS owner access audit",
    "-- Run after importer execution and before enabling strict production usage.",
    "-- This is a read-only prerequisite audit. It does not replace an authenticated app-session RLS smoke test.",
    "-- Replace <workspace_id> and <owner_user_id> before running.",
    "-- Target workspace_id: ${workspaceIdValue} / owner_user_id: ${ownerUserIdValue}",
    "with target_context as (",
    "select '${workspaceIdValue}'::uuid as workspace_id,",
    "'${ownerUserIdValue}'::uuid as owner_user_id",
    "checks as (",
    "1 as check_order,",
    "workspaces.owner_user_id",
    "2 as check_order,",
    "workspace_members owner row",
    "3 as check_order,",
    "user_profiles owner mapping",
    "4 as check_order,",
    "prompt_assets.created_by_user_id",
    "5 as check_order,",
    "feedback.user_id",
    "6 as check_order,",
    "prompt_skills.created_by_user_id",
    "7 as check_order,",
    "company_profiles workspace mapping",
    "8 as check_order,",
    "deleted_prompt_assets prompt_snapshot",
    "issue_count,",
    "case when issue_count = 0",
    "then 'pass'",
    "else 'review'",
    "end as status",
    "from checks",
    "order by check_order;",
  ],
  "Supabase RLS owner access audit SQL should keep workspace/owner target context, owner mapping checks, issue_count status, and check-order sorting in SQL order",
);

assertDataMatches(
  /async function handleCopySupabaseRlsAccessAuditSql\(\)[\s\S]*?const rlsAccessAuditSql = buildSupabaseImportRlsAccessAuditSql\(\)[\s\S]*?copyDataText\([\s\S]*?rlsAccessAuditSql[\s\S]*?Supabase RLS owner access audit SQL 템플릿을 클립보드에 복사했습니다[\s\S]*?buildSupabaseRlsAccessAuditSqlManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?sql: rlsAccessAuditSql/,
  "Data RLS owner access audit SQL template copy should keep the original SQL on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /async function handleCopyResolvedSupabaseRlsAccessAuditSql\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?const ownerUserId = verificationOwnerUserId\.trim\(\)[\s\S]*?const rlsAccessAuditSql = buildSupabaseImportRlsAccessAuditSql\(\{[\s\S]*?ownerUserId[\s\S]*?workspaceId[\s\S]*?copyDataText\([\s\S]*?rlsAccessAuditSql[\s\S]*?workspace_id와 owner_user_id가 반영된 RLS audit SQL을 복사했습니다[\s\S]*?buildSupabaseRlsAccessAuditSqlManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?ownerUserId[\s\S]*?sql: rlsAccessAuditSql[\s\S]*?workspaceId/,
  "Data resolved RLS owner access audit SQL copy should keep workspace_id/owner_user_id-resolved SQL on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseRlsPolicyDraftSqlManualCopyText\(\{[\s\S]*?dryRun: SupabaseImportDryRun[\s\S]*?sql: string[\s\S]*?# Prompt AI Studio Supabase RLS Policy Draft SQL[\s\S]*?## RLS policy draft 식별[\s\S]*?schemaVersion: \$\{dryRun\.schemaVersion\}[\s\S]*?SQL 길이: \$\{formatJsonLength\(sql\)\}[\s\S]*?## Policy draft 요약[\s\S]*?RLS policy tables: \$\{supabaseImportVerificationCheckCounts\.rlsPolicyTables\}[\s\S]*?Expected imported rows: \$\{dryRun\.totalRows\}[\s\S]*?Insert batches: \$\{dryRun\.batches\.length\}[\s\S]*?Access source: workspace_members[\s\S]*?Write roles: owner, admin, member[\s\S]*?Read roles: owner, admin, member, viewer[\s\S]*?## 적용 전 gate 요약[\s\S]*?Review and adapt this draft before running[\s\S]*?row count, relationship, pending ID, and RLS owner access audits first[\s\S]*?safe search_path and workspace_members role semantics[\s\S]*?authenticated owner\/member\/viewer\/non-member RLS smoke tests[\s\S]*?## RLS policy draft SQL[\s\S]*?sql/,
  "Data RLS policy draft SQL manual fallback should prepend schema, SQL length, policy table count, imported row/batch counts, access source, role semantics, review gate, prerequisite audits, safe helper gate, and authenticated smoke-test gate",
);
assertFileIncludesInOrder(
  supabaseImportDryRunSource,
  [
    "export function buildSupabaseRlsPolicyDraftSql",
    "-- Prompt AI Studio Supabase RLS policy draft",
    "-- Review and adapt before running in a Supabase project.",
    "-- This draft assumes workspace_members is the source of workspace access.",
    "-- Suggested role semantics: owner/admin/member can write; viewer can read.",
    "create or replace function public.is_workspace_member(target_workspace_id uuid)",
    "security definer",
    "set search_path = public",
    "from public.workspace_members member",
    "member.user_id = auth.uid()",
    "create or replace function public.has_workspace_role",
    "allowed_roles text[]",
    "member.role = any(allowed_roles)",
    "alter table public.workspaces enable row level security;",
    "alter table public.workspace_members enable row level security;",
    "alter table public.user_profiles enable row level security;",
    "alter table public.company_profiles enable row level security;",
    "alter table public.prompt_assets enable row level security;",
    "alter table public.prompt_versions enable row level security;",
    "alter table public.feedback enable row level security;",
    "alter table public.deleted_prompt_assets enable row level security;",
    "alter table public.learning_memories enable row level security;",
    "alter table public.prompt_skills enable row level security;",
    "alter table public.document_sources enable row level security;",
    "alter table public.document_chunks enable row level security;",
    "drop policy if exists workspace_read on public.workspaces;",
    "create policy workspace_read on public.workspaces",
    "using (public.is_workspace_member(id));",
    "create policy workspace_insert_owner on public.workspaces",
    "with check (owner_user_id = auth.uid());",
    "create policy workspace_update_owner_admin on public.workspaces",
    "array['owner', 'admin']",
    "create policy workspace_members_write_owner_admin on public.workspace_members",
    "-- Workspace-owned tables with direct workspace_id.",
    "create policy user_profiles_write_member on public.user_profiles",
    "array['owner', 'admin', 'member']",
    "create policy company_profiles_write_member on public.company_profiles",
    "create policy prompt_assets_write_member on public.prompt_assets",
    "create policy deleted_prompt_assets_write_member on public.deleted_prompt_assets",
    "create policy learning_memories_write_member on public.learning_memories",
    "create policy prompt_skills_write_member on public.prompt_skills",
    "create policy document_sources_write_member on public.document_sources",
    "create policy document_chunks_write_member on public.document_chunks",
    "-- Tables scoped through prompt_assets.",
    "create policy prompt_versions_read on public.prompt_versions",
    "public.is_workspace_member(asset.workspace_id)",
    "create policy prompt_versions_write_member on public.prompt_versions",
    "public.has_workspace_role(asset.workspace_id, array['owner', 'admin', 'member'])",
    "create policy feedback_read on public.feedback",
    "create policy feedback_write_member on public.feedback",
    "feedback.user_id = auth.uid()",
  ],
  "Supabase RLS policy draft SQL should keep workspace_members helpers, safe search_path, RLS-enabled tables, role semantics, direct workspace policies, prompt-asset-scoped policies, and feedback auth ownership together",
);

assertDataMatches(
  /async function handleCopySupabaseRlsPolicyDraftSql\(\)[\s\S]*?const rlsPolicyDraftSql = buildSupabaseRlsPolicyDraftSql\(\)[\s\S]*?copyDataText\([\s\S]*?rlsPolicyDraftSql[\s\S]*?Supabase RLS policy draft SQL을 클립보드에 복사했습니다[\s\S]*?buildSupabaseRlsPolicyDraftSqlManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?sql: rlsPolicyDraftSql/,
  "Data RLS policy draft SQL copy should keep the original SQL on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseRlsSmokeTestChecklistManualCopyText\(\{[\s\S]*?checklistText: string[\s\S]*?dryRun: SupabaseImportDryRun[\s\S]*?ownerUserId\?: string[\s\S]*?workspaceId\?: string[\s\S]*?ownerScope = ownerUserId\?\.trim\(\) \|\| "<owner_user_id>"[\s\S]*?workspaceScope = workspaceId\?\.trim\(\) \|\| "<workspace_id>"[\s\S]*?# Prompt AI Studio Supabase RLS Smoke Test Checklist[\s\S]*?## RLS smoke test 식별[\s\S]*?schemaVersion: \$\{dryRun\.schemaVersion\}[\s\S]*?체크리스트 길이: \$\{formatJsonLength\(checklistText\)\}[\s\S]*?workspace_id: \$\{workspaceScope\}[\s\S]*?owner_user_id: \$\{ownerScope\}[\s\S]*?## Smoke test 요약[\s\S]*?RLS policy tables: \$\{supabaseImportVerificationCheckCounts\.rlsPolicyTables\}[\s\S]*?RLS owner access checks: \$\{supabaseImportVerificationCheckCounts\.rlsOwnerAccess\}[\s\S]*?Expected imported rows: \$\{dryRun\.totalRows\}[\s\S]*?Insert batches: \$\{dryRun\.batches\.length\}[\s\S]*?Required sessions: owner, member, viewer, non-member[\s\S]*?## 실행 gate 요약[\s\S]*?RLS policy draft review and rollout[\s\S]*?authenticated app sessions[\s\S]*?service role key[\s\S]*?Owner\/member write cases[\s\S]*?viewer read-only cases[\s\S]*?non-member deny cases[\s\S]*?cross-workspace read or write access[\s\S]*?## RLS smoke test checklist[\s\S]*?checklistText/,
  "Data RLS smoke test checklist manual fallback should prepend schema, checklist length, workspace/owner identity, policy/owner check counts, imported row/batch counts, required sessions, rollout gate, app-session-only gate, role behavior gate, and cross-workspace isolation gate",
);

assertDataMatches(
  /async function handleCopySupabaseRlsSmokeTestChecklist\(\)[\s\S]*?const checklistText = buildSupabaseRlsSmokeTestChecklistText\(\)[\s\S]*?copyDataText\([\s\S]*?checklistText[\s\S]*?Supabase RLS smoke test 체크리스트 템플릿을 클립보드에 복사했습니다[\s\S]*?buildSupabaseRlsSmokeTestChecklistManualCopyText\(\{[\s\S]*?checklistText[\s\S]*?dryRun: supabaseImportDryRun/,
  "Data RLS smoke test checklist copy should keep the original checklist on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /async function handleCopyResolvedSupabaseRlsSmokeTestChecklist\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?const ownerUserId = verificationOwnerUserId\.trim\(\)[\s\S]*?const checklistText = buildSupabaseRlsSmokeTestChecklistText\(\{[\s\S]*?ownerUserId[\s\S]*?workspaceId[\s\S]*?\}\)[\s\S]*?copyDataText\([\s\S]*?checklistText[\s\S]*?workspace_id와 owner_user_id가 반영된 RLS smoke test 체크리스트를 복사했습니다[\s\S]*?buildSupabaseRlsSmokeTestChecklistManualCopyText\(\{[\s\S]*?checklistText[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?ownerUserId[\s\S]*?workspaceId/,
  "Data resolved RLS smoke test checklist copy should keep the resolved checklist on the clipboard and use the workspace/owner-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseVerificationReportManualCopyText\(\{[\s\S]*?dryRun: SupabaseImportDryRun[\s\S]*?ownerUserId\?: string[\s\S]*?reportText: string[\s\S]*?workspaceId\?: string[\s\S]*?ownerScope = ownerUserId\?\.trim\(\) \|\| "<owner_user_id>"[\s\S]*?relationshipWarnings = dryRun\.warningItems\.filter[\s\S]*?warning\.category === "relationship"[\s\S]*?setupWarnings = dryRun\.warningItems\.filter[\s\S]*?warning\.category === "setup"[\s\S]*?workspaceScope = workspaceId\?\.trim\(\) \|\| "<workspace_id>"[\s\S]*?# Prompt AI Studio Supabase Verification Report[\s\S]*?## Verification report 식별[\s\S]*?workspace_id: \$\{workspaceScope\}[\s\S]*?owner_user_id: \$\{ownerScope\}[\s\S]*?schemaVersion: \$\{dryRun\.schemaVersion\}[\s\S]*?리포트 길이: \$\{formatJsonLength\(reportText\)\}[\s\S]*?## 검증 요약[\s\S]*?Expected imported rows: \$\{dryRun\.totalRows\}[\s\S]*?Row count checks: \$\{dryRun\.batches\.length\}[\s\S]*?Relationship checks: \$\{supabaseImportVerificationCheckCounts\.relationship\}[\s\S]*?Pending ID checks: \$\{supabaseImportVerificationCheckCounts\.pendingIdAudit\}[\s\S]*?RLS owner access checks: \$\{supabaseImportVerificationCheckCounts\.rlsOwnerAccess\}[\s\S]*?Setup warnings: \$\{setupWarnings\.length\}[\s\S]*?Relationship warnings: \$\{relationshipWarnings\.length\}[\s\S]*?## Acceptance gate 요약[\s\S]*?Row count, relationship, pending ID, and RLS owner access audits must pass[\s\S]*?Every issue_count[\s\S]*?must be 0[\s\S]*?RLS policy draft must be reviewed[\s\S]*?Authenticated owner\/member\/viewer\/non-member RLS smoke tests must be archived[\s\S]*?## Verification report[\s\S]*?reportText/,
  "Data verification report manual fallback should prepend workspace/owner identity, schema, report length, expected rows, verification check counts, warning counts, audit pass gates, issue_count 0 gate, RLS policy review gate, and smoke-test evidence gate",
);
assertFileIncludesInOrder(
  supabaseImportDryRunSource,
  [
    "export function buildSupabaseImportVerificationReportText",
    "const workspaceIdValue =",
    "isSupabaseWorkspaceUuid(workspaceId)",
    "const ownerUserIdValue =",
    "isSupabaseWorkspaceUuid(ownerUserId)",
    "const setupWarnings = dryRun.warningItems.filter",
    "warning.category === \"setup\"",
    "const relationshipWarnings = dryRun.warningItems.filter",
    "warning.category === \"relationship\"",
    "const checkCounts = getSupabaseImportVerificationCheckCounts();",
    "# Prompt AI Studio Supabase Import Verification Report",
    "## Import target",
    "schemaVersion: ${dryRun.schemaVersion}",
    "workspace_id: ${workspaceIdValue}",
    "owner_user_id: ${ownerUserIdValue}",
    "expected total rows: ${dryRun.totalRows}",
    "row count checks: ${dryRun.batches.length}",
    "relationship checks: ${checkCounts.relationship}",
    "pending ID checks: ${checkCounts.pendingIdAudit}",
    "RLS owner access checks: ${checkCounts.rlsOwnerAccess}",
    "setup warnings: ${setupWarnings.length}",
    "relationship warnings: ${relationshipWarnings.length}",
    "## Required execution order",
    "Run the importer with real Supabase UUIDs, not pending-* dry-run IDs.",
    "Run the row count verification SQL for the imported workspace.",
    "Run the relationship verification SQL for the imported workspace.",
    "Run the pending ID audit SQL for the imported workspace.",
    "Run the RLS owner access audit SQL with workspace_id and owner_user_id.",
    "Review the RLS policy draft before any policy SQL is applied.",
    "Run authenticated RLS smoke tests after policies are enabled.",
    "Save all query outputs with this report.",
    "buildSupabaseImportReferenceReplacementGuideText(dryRun)",
    "## Row count acceptance",
    "...dryRun.batches.map",
    "status pass",
    "## Relationship acceptance",
    "deleted archive source references are accepted through deleted_prompt_assets snapshots.",
    "## Pending ID acceptance",
    "## RLS owner access acceptance",
    "## Authenticated RLS smoke test acceptance",
    "## Dry-run warnings to resolve",
    "formatWarningLabel(warning)",
    "## Rollback or review triggers",
    "Any row count check returns status review.",
    "Any relationship check returns issue_count greater than 0.",
    "Any pending ID audit check returns issue_count greater than 0.",
    "Any RLS owner access audit check returns issue_count greater than 0.",
    "owner_user_id, user_id, or workspace membership is mapped to the wrong user.",
    "RLS policies block the owner from reading imported workspace records.",
    "Any non-member or cross-workspace user can read or write imported records.",
    "## Sign-off",
    "Backup JSON and fingerprint are archived.",
    "Row count SQL output is archived.",
    "Relationship SQL output is archived.",
    "Pending ID audit SQL output is archived.",
    "RLS owner access audit SQL output is archived.",
    "RLS policy draft review decision is recorded.",
    "Authenticated RLS smoke test evidence is archived.",
    "Import is accepted or rollback decision is recorded.",
  ],
  "Supabase verification report should keep import target, execution order, replacement guidance, acceptance checks, warnings, rollback triggers, and sign-off together",
);

assertDataMatches(
  /async function handleCopySupabaseVerificationReport\(\)[\s\S]*?const reportText =[\s\S]*?buildSupabaseImportVerificationReportText\(supabaseImportDryRun\)[\s\S]*?copyDataText\([\s\S]*?reportText[\s\S]*?Supabase 검증 판정 리포트 템플릿을 클립보드에 복사했습니다[\s\S]*?buildSupabaseVerificationReportManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?reportText/,
  "Data verification report copy should keep the original report on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /async function handleCopyResolvedSupabaseVerificationReport\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?const ownerUserId = verificationOwnerUserId\.trim\(\)[\s\S]*?const reportText = buildSupabaseImportVerificationReportText\([\s\S]*?supabaseImportDryRun[\s\S]*?ownerUserId[\s\S]*?workspaceId[\s\S]*?\)[\s\S]*?copyDataText\([\s\S]*?reportText[\s\S]*?workspace_id와 owner_user_id가 반영된 Supabase 검증 판정 리포트를 복사했습니다[\s\S]*?buildSupabaseVerificationReportManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?ownerUserId[\s\S]*?reportText[\s\S]*?workspaceId/,
  "Data resolved verification report copy should keep the resolved report on the clipboard and use the workspace/owner-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseMigrationHandoffPackageManualCopyText\(\{[\s\S]*?dryRun: SupabaseImportDryRun[\s\S]*?ownerUserId\?: string[\s\S]*?packageText: string[\s\S]*?workspaceId\?: string[\s\S]*?ownerScope = ownerUserId\?\.trim\(\) \|\| "<owner_user_id>"[\s\S]*?relationshipWarnings = dryRun\.warningItems\.filter[\s\S]*?warning\.category === "relationship"[\s\S]*?setupWarnings = dryRun\.warningItems\.filter[\s\S]*?warning\.category === "setup"[\s\S]*?workspaceScope = workspaceId\?\.trim\(\) \|\| "<workspace_id>"[\s\S]*?# Prompt AI Studio Supabase Migration Handoff Package[\s\S]*?## Handoff package 식별[\s\S]*?workspace_id: \$\{workspaceScope\}[\s\S]*?owner_user_id: \$\{ownerScope\}[\s\S]*?schemaVersion: \$\{dryRun\.schemaVersion\}[\s\S]*?패키지 길이: \$\{formatJsonLength\(packageText\)\}[\s\S]*?## Handoff package 요약[\s\S]*?Expected imported rows: \$\{dryRun\.totalRows\}[\s\S]*?Insert batches: \$\{dryRun\.batches\.length\}[\s\S]*?Handoff sections: \$\{supabaseImportVerificationCheckCounts\.handoffSections\}[\s\S]*?Relationship checks: \$\{supabaseImportVerificationCheckCounts\.relationship\}[\s\S]*?Pending ID checks: \$\{supabaseImportVerificationCheckCounts\.pendingIdAudit\}[\s\S]*?RLS owner access checks: \$\{supabaseImportVerificationCheckCounts\.rlsOwnerAccess\}[\s\S]*?RLS policy tables: \$\{supabaseImportVerificationCheckCounts\.rlsPolicyTables\}[\s\S]*?Setup warnings: \$\{setupWarnings\.length\}[\s\S]*?Relationship warnings: \$\{relationshipWarnings\.length\}[\s\S]*?## 인수인계 gate 요약[\s\S]*?Read sections in order[\s\S]*?importer dry-run through verification report[\s\S]*?Attach row count, relationship, pending ID, and RLS owner access audit outputs[\s\S]*?Archive RLS policy review decision[\s\S]*?authenticated RLS smoke test evidence[\s\S]*?backup JSON, replacement guide, and local-to-Supabase UUID trace[\s\S]*?## Migration handoff package[\s\S]*?packageText/,
  "Data migration handoff package manual fallback should prepend workspace/owner identity, schema, package length, row/batch counts, handoff sections, verification counts, warning counts, read-order gate, audit evidence gate, RLS evidence gate, and UUID trace gate",
);
assertFileIncludesInOrder(
  supabaseImportDryRunSource,
  [
    "export function buildSupabaseMigrationHandoffPackageText",
    "const workspaceIdValue =",
    "isSupabaseWorkspaceUuid(workspaceId)",
    "const ownerUserIdValue =",
    "isSupabaseWorkspaceUuid(ownerUserId)",
    "const resolvedOptions =",
    "const checkCounts = getSupabaseImportVerificationCheckCounts();",
    "# Prompt AI Studio Supabase Migration Handoff Package",
    "## Package target",
    "schemaVersion: ${dryRun.schemaVersion}",
    "workspace_id: ${workspaceIdValue}",
    "owner_user_id: ${ownerUserIdValue}",
    "expected total rows: ${dryRun.totalRows}",
    "generated sections: ${checkCounts.handoffSections}",
    "## Read order",
    "...supabaseMigrationHandoffSectionTitles.map",
    "## 1. Importer dry-run",
    "buildSupabaseImportDryRunText(dryRun)",
    "## 2. Pending ID replacement guide",
    "buildSupabaseImportReferenceReplacementGuideText(dryRun)",
    "## 3. Row count verification SQL",
    "buildSupabaseImportVerificationSql(dryRun, resolvedOptions)",
    "## 4. Relationship verification SQL",
    "buildSupabaseImportRelationshipVerificationSql(resolvedOptions)",
    "## 5. Pending ID audit SQL",
    "buildSupabaseImportPendingIdAuditSql(resolvedOptions)",
    "## 6. RLS owner access audit SQL",
    "buildSupabaseImportRlsAccessAuditSql(resolvedOptions)",
    "## 7. RLS policy draft SQL",
    "buildSupabaseRlsPolicyDraftSql()",
    "## 8. RLS smoke test checklist",
    "buildSupabaseRlsSmokeTestChecklistText(resolvedOptions)",
    "## 9. Verification report",
    "buildSupabaseImportVerificationReportText(dryRun, resolvedOptions)",
  ],
  "Supabase migration handoff package should keep target identity, read order, SQL audits, RLS checks, and verification report together",
);

assertDataMatches(
  /async function handleCopySupabaseMigrationHandoffPackage\(\)[\s\S]*?const packageText =[\s\S]*?buildSupabaseMigrationHandoffPackageText\(supabaseImportDryRun\)[\s\S]*?copyDataText\([\s\S]*?packageText[\s\S]*?Supabase migration handoff package 템플릿을 클립보드에 복사했습니다[\s\S]*?buildSupabaseMigrationHandoffPackageManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?packageText/,
  "Data migration handoff package copy should keep the original package on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /async function handleCopyResolvedSupabaseMigrationHandoffPackage\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?const ownerUserId = verificationOwnerUserId\.trim\(\)[\s\S]*?const packageText = buildSupabaseMigrationHandoffPackageText\([\s\S]*?supabaseImportDryRun[\s\S]*?ownerUserId[\s\S]*?workspaceId[\s\S]*?\)[\s\S]*?copyDataText\([\s\S]*?packageText[\s\S]*?workspace_id와 owner_user_id가 반영된 Supabase migration handoff package를 복사했습니다[\s\S]*?buildSupabaseMigrationHandoffPackageManualCopyText\(\{[\s\S]*?dryRun: supabaseImportDryRun[\s\S]*?ownerUserId[\s\S]*?packageText[\s\S]*?workspaceId/,
  "Data resolved migration handoff package copy should keep the resolved package on the clipboard and use the workspace/owner-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseImportApiPreflightReportManualCopyText\(\{[\s\S]*?preflightText: string[\s\S]*?response: SupabaseImportApiPreflightResponse[\s\S]*?# Prompt AI Studio Supabase Import API Preflight[\s\S]*?## Preflight 식별[\s\S]*?확인 시각: \$\{formatBackupDate\([\s\S]*?백업 지문: \$\{backupFingerprint\}[\s\S]*?workspace_id: \$\{workspaceId\}[\s\S]*?owner_user_id: \$\{ownerUserId\}[\s\S]*?리포트 길이: \$\{formatJsonLength\(preflightText\)\}[\s\S]*?## Route validation 요약[\s\S]*?Route status: \$\{response\.status\}[\s\S]*?Validation:[\s\S]*?Dry-run rows:[\s\S]*?Insert tables:[\s\S]*?Generated UUIDs:[\s\S]*?Unresolved pending references:[\s\S]*?Required confirmation:[\s\S]*?## API preflight report[\s\S]*?preflightText/,
  "Data API preflight report manual fallback should prepend backup/workspace identity, route validation, row/table counts, confirmation gate, and report length",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabaseImportApiPreflightReportText",
    "# Prompt AI Studio Supabase Import API Preflight",
    "checkedAt: ${checkedAt || new Date().toISOString()}",
    "status: ${response.status}",
    "validation: ${response.validation?.ok ? \"ok\" : \"blocked\"}",
    "dryRunRows: ${response.dryRun?.totalRows ?? response.plan?.totalRows ?? 0}",
    "dryRunBatches: ${response.dryRun?.batches ?? 0}",
    "insertTables: ${response.insertOrder?.length ?? 0}",
    "generatedUuidCount: ${response.plan?.generatedUuidCount ?? 0}",
    "archiveTraceFields: ${response.plan?.archiveTraceFields ?? 0}",
    "unresolvedPendingReferences: ${",
    "response.plan?.unresolvedPendingReferences.length ?? 0",
    "requiredConfirmation: ${",
    "response.requiredConfirmation || \"not provided\"",
    "## Validation blockers",
    "response.validation?.blockers.length",
    "response.validation.blockers.map",
    "## Insert order",
    "response.insertOrder?.length",
    "response.insertOrder.map",
    "item.order",
    "item.table",
    "item.rowCount",
    "item.dependency",
    "## Execution guard",
    "This preflight used `execute: false` and did not write to Supabase.",
    "Real execution still requires server env gates and `confirmation: RUN_SUPABASE_IMPORT`.",
  ],
  "Data API preflight report should keep status, validation, dry-run metrics, UUID metrics, blockers, insert order, and no-write execution guard together",
);

assertDataMatches(
  /async function handleCopySupabaseImportApiPreflightReport\(\)[\s\S]*?const backupFingerprint = importBackupFingerprint[\s\S]*?const checkedAt = supabaseImportApiPreflight\.checkedAt[\s\S]*?const ownerUserId = verificationOwnerUserId\.trim\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?const preflightText = buildSupabaseImportApiPreflightReportText\(\{[\s\S]*?copyDataText\([\s\S]*?preflightText[\s\S]*?Supabase import API preflight 리포트를 클립보드에 복사했습니다[\s\S]*?buildSupabaseImportApiPreflightReportManualCopyText\(\{[\s\S]*?backupFingerprint[\s\S]*?checkedAt[\s\S]*?ownerUserId[\s\S]*?preflightText[\s\S]*?response: preflightData[\s\S]*?workspaceId/,
  "Data API preflight report copy should keep the original report on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseImportApiAuditArtifactManualCopyText\(\{[\s\S]*?artifactText: string[\s\S]*?response: SupabaseImportApiPreflightResponse[\s\S]*?# Prompt AI Studio Supabase Import Route Audit Artifact[\s\S]*?## Audit artifact 식별[\s\S]*?확인 시각: \$\{formatBackupDate\([\s\S]*?백업 지문: \$\{backupFingerprint\}[\s\S]*?workspace_id: \$\{workspaceId\}[\s\S]*?owner_user_id: \$\{ownerUserId\}[\s\S]*?Artifact 길이: \$\{formatJsonLength\(artifactText\)\}[\s\S]*?## Route audit 요약[\s\S]*?Route status: \$\{response\.status\}[\s\S]*?Execute requested: false \(API preflight\)[\s\S]*?Validation:[\s\S]*?Validation blockers:[\s\S]*?Dry-run rows:[\s\S]*?Insert tables:[\s\S]*?Required confirmation:[\s\S]*?## Route audit artifact[\s\S]*?artifactText/,
  "Data API route audit artifact manual fallback should prepend backup/workspace identity, route status, preflight execution mode, validation, row/table counts, confirmation gate, and artifact length",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabaseImportApiAuditArtifactManualCopyText",
    "# Prompt AI Studio Supabase Import Route Audit Artifact",
    "## Audit artifact 식별",
    "확인 시각: ${formatBackupDate(checkedAt || new Date().toISOString())}",
    "백업 지문: ${backupFingerprint}",
    "workspace_id: ${workspaceId}",
    "owner_user_id: ${ownerUserId}",
    "Artifact 길이: ${formatJsonLength(artifactText)}",
    "## Route audit 요약",
    "Route status: ${response.status}",
    "Execute requested: false (API preflight)",
    "Validation: ${response.validation?.ok ? \"ok\" : \"blocked\"}",
    "Validation blockers: ${response.validation?.blockers.length ?? 0}",
    "Dry-run rows: ${",
    "response.dryRun?.totalRows ?? response.plan?.totalRows ?? 0",
    "Insert tables: ${response.insertOrder?.length ?? 0}",
    "Required confirmation: ${",
    "response.requiredConfirmation || \"not provided\"",
    "## Route audit artifact",
    "artifactText",
  ],
  "Data API route audit artifact fallback should keep identity, route status, execute=false mode, validation, row/table counts, confirmation gate, and raw artifact together",
);

assertDataMatches(
  /async function handleCopySupabaseImportApiAuditArtifact\(\)[\s\S]*?const artifactText = preflightData\.auditArtifactText[\s\S]*?const backupFingerprint = importBackupFingerprint[\s\S]*?const checkedAt = supabaseImportApiPreflight\.checkedAt[\s\S]*?const ownerUserId = verificationOwnerUserId\.trim\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?copyDataText\([\s\S]*?artifactText[\s\S]*?Supabase import API audit artifact를 클립보드에 복사했습니다[\s\S]*?buildSupabaseImportApiAuditArtifactManualCopyText\(\{[\s\S]*?artifactText[\s\S]*?backupFingerprint[\s\S]*?checkedAt[\s\S]*?ownerUserId[\s\S]*?response: preflightData[\s\S]*?workspaceId/,
  "Data API route audit artifact copy should keep the original artifact on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseImportExecutionPlanManualCopyText\(\{[\s\S]*?plan: ReturnType<typeof createSupabaseImporterPlan>[\s\S]*?planText: string[\s\S]*?# Prompt AI Studio Supabase Import Execution Plan[\s\S]*?## 실행 계획 식별[\s\S]*?workspace_id: \$\{plan\.workspaceId\}[\s\S]*?owner_user_id: \$\{plan\.ownerUserId\}[\s\S]*?계획 길이: \$\{formatJsonLength\(planText\)\}[\s\S]*?## UUID 치환 요약[\s\S]*?Total rows: \$\{plan\.totalRows\}[\s\S]*?Insert batches: \$\{plan\.batches\.length\}[\s\S]*?UUID map entries: \$\{plan\.generatedUuidCount\}[\s\S]*?Archive trace fields: \$\{plan\.archiveTraceFields\.length\}[\s\S]*?Unresolved pending references: \$\{plan\.unresolvedPendingReferences\.length\}[\s\S]*?## 실행 전 acceptance gate[\s\S]*?No pending-\* value should remain[\s\S]*?original local IDs and prompt_snapshot JSON must stay traceable[\s\S]*?workspace_members\.user_id must match[\s\S]*?does not connect to Supabase or write data[\s\S]*?row count, relationship, pending ID, and RLS owner access audits[\s\S]*?## Import execution plan[\s\S]*?planText/,
  "Data import execution plan manual fallback should prepend workspace identity, UUID replacement counts, trace counts, pending counts, acceptance gates, local-only guard, audit gate, and plan length",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabaseImportExecutionPlanManualCopyText",
    "# Prompt AI Studio Supabase Import Execution Plan",
    "## 실행 계획 식별",
    "workspace_id: ${plan.workspaceId}",
    "owner_user_id: ${plan.ownerUserId}",
    "계획 길이: ${formatJsonLength(planText)}",
    "## UUID 치환 요약",
    "Total rows: ${plan.totalRows}",
    "Insert batches: ${plan.batches.length}",
    "UUID map entries: ${plan.generatedUuidCount}",
    "Archive trace fields: ${plan.archiveTraceFields.length}",
    "Unresolved pending references: ${plan.unresolvedPendingReferences.length}",
    "## 실행 전 acceptance gate",
    "No pending-* value should remain in the execution payload.",
    "deleted_prompt_assets original local IDs and prompt_snapshot JSON must stay traceable.",
    "workspaces.owner_user_id and workspace_members.user_id must match the target Supabase auth user.",
    "This plan is generated locally and does not connect to Supabase or write data.",
    "After insert, run row count, relationship, pending ID, and RLS owner access audits.",
    "## Import execution plan",
    "planText",
  ],
  "Data import execution plan manual fallback should keep identity, UUID counts, trace counts, acceptance gates, local-only guard, audit gate, and raw plan together",
);
assertFileIncludesInOrder(
  supabaseImportExecutionPlanSource,
  [
    "export function buildSupabaseImportExecutionPlanText",
    "const plan = createSupabaseImportExecutionPlan(dryRun, options);",
    "const insertPayloadBatches = plan.batches.map",
    "# Prompt AI Studio Supabase Import Execution Plan",
    "This document is generated locally. It does not connect to Supabase or write data.",
    "## Summary",
    "workspaceId: ${plan.workspaceId}",
    "ownerUserId: ${plan.ownerUserId}",
    "totalRows: ${plan.totalRows}",
    "batches: ${plan.batches.length}",
    "UUID map entries: ${plan.generatedUuidCount}",
    "archive trace fields preserved: ${plan.archiveTraceFields.length}",
    "unresolved pending references: ${plan.unresolvedPendingReferences.length}",
    "## Acceptance checks before insert",
    "No `pending-*` value remains in the execution payload.",
    "`deleted_prompt_assets.original_prompt_asset_id` stays as the original local prompt ID.",
    "`deleted_prompt_assets.prompt_snapshot` stays as the original deleted prompt JSON.",
    "`workspaces.owner_user_id` and `workspace_members.user_id` match the target Supabase auth user.",
    "After insert, run row count verification, relationship verification, pending ID audit, and RLS owner access audit.",
    "## Unresolved pending references",
    "plan.unresolvedPendingReferences.map",
    "## Archive trace fields",
    "plan.archiveTraceFields.map",
    "## UUID map",
    "JSON.stringify(plan.uuidByPendingId, null, 2)",
    "## Insert payload batches",
    "JSON.stringify(insertPayloadBatches, null, 2)",
  ],
  "Supabase import execution plan should keep local-only guard, identity summary, acceptance gates, pending references, archive trace, UUID map, and insert payload batches in plan order",
);

assertDataMatches(
  /async function handleCopySupabaseImportExecutionPlan\(\)[\s\S]*?const plan = createSupabaseImporterPlan\(supabaseImportDryRun,[\s\S]*?const planText = buildSupabaseImportExecutionPlanText\(supabaseImportDryRun,[\s\S]*?uuidByPendingId: plan\.uuidByPendingId[\s\S]*?copyDataText\([\s\S]*?planText[\s\S]*?Supabase import 실행 계획을 클립보드에 복사했습니다[\s\S]*?buildSupabaseImportExecutionPlanManualCopyText\(\{[\s\S]*?plan[\s\S]*?planText/,
  "Data import execution plan copy should reuse the same UUID map, keep the original plan on the clipboard, and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseImporterAdapterContractManualCopyText\(\{[\s\S]*?contractText: string[\s\S]*?plan: ReturnType<typeof createSupabaseImporterPlan>[\s\S]*?# Prompt AI Studio Supabase Importer Adapter Contract[\s\S]*?## Adapter 계약 식별[\s\S]*?workspace_id: \$\{plan\.workspaceId\}[\s\S]*?owner_user_id: \$\{plan\.ownerUserId\}[\s\S]*?계약 길이: \$\{formatJsonLength\(contractText\)\}[\s\S]*?## Import plan 요약[\s\S]*?Total rows: \$\{plan\.totalRows\}[\s\S]*?Insert batches: \$\{plan\.batches\.length\}[\s\S]*?Generated UUIDs: \$\{plan\.generatedUuidCount\}[\s\S]*?Archive trace fields: \$\{plan\.archiveTraceFields\.length\}[\s\S]*?Unresolved pending references: \$\{plan\.unresolvedPendingReferences\.length\}[\s\S]*?## Adapter gate 요약[\s\S]*?service-role server context[\s\S]*?Browser\/public Supabase clients must not execute importer writes[\s\S]*?Runner must stop before insert if validation has blockers[\s\S]*?Runner must insert tables in the listed order[\s\S]*?row count, relationship, pending ID, and RLS owner audits[\s\S]*?## Adapter contract[\s\S]*?contractText/,
  "Data importer adapter contract manual fallback should prepend workspace identity, plan row/batch/UUID/archive/pending counts, server-only gate, insert-order gate, audit gate, and contract length",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabaseImporterAdapterContractManualCopyText",
    "# Prompt AI Studio Supabase Importer Adapter Contract",
    "## Adapter 계약 식별",
    "workspace_id: ${plan.workspaceId}",
    "owner_user_id: ${plan.ownerUserId}",
    "계약 길이: ${formatJsonLength(contractText)}",
    "## Import plan 요약",
    "Total rows: ${plan.totalRows}",
    "Insert batches: ${plan.batches.length}",
    "Generated UUIDs: ${plan.generatedUuidCount}",
    "Archive trace fields: ${plan.archiveTraceFields.length}",
    "Unresolved pending references: ${plan.unresolvedPendingReferences.length}",
    "## Adapter gate 요약",
    "Adapter must run in a service-role server context.",
    "Browser/public Supabase clients must not execute importer writes.",
    "Runner must stop before insert if validation has blockers.",
    "Runner must insert tables in the listed order.",
    "Operators must run row count, relationship, pending ID, and RLS owner audits after import.",
    "## Adapter contract",
    "contractText",
  ],
  "Data importer adapter contract manual fallback should keep identity, plan counts, server-only gate, insert order gate, audit gate, and raw contract together",
);
assertFileIncludesInOrder(
  supabaseImporterSource,
  [
    "export function buildSupabaseImporterAdapterContractText",
    "const validation = validateSupabaseImportExecutionPlan(plan);",
    "const requests = getSupabaseImportInsertRequests(plan);",
    "# Prompt AI Studio Supabase Importer Adapter Contract",
    "This contract is for the future server-side importer.",
    "## Adapter shape",
    "interface SupabaseImportInsertAdapter",
    "insertRows(request: {",
    "table: string;",
    "order: number;",
    "dependency: string;",
    "rows: Record<string, unknown>[];",
    "Promise<{ insertedRows?: number; note?: string } | void>;",
    "## Validation",
    "status: ${validation.ok ? \"ready\" : \"blocked\"}",
    "blocker: none",
    "## Insert order",
    "...requests.map",
    "request.order",
    "request.table",
    "request.rows.length",
    "request.dependency",
    "## Runner acceptance",
    "The runner must stop before insert if validation has blockers.",
    "The runner must insert tables in the listed order.",
    "The adapter must use a service-role server context, never a browser client.",
    "After a completed run, operators must run row count, relationship, pending ID, and RLS owner access audits.",
  ],
  "Supabase importer adapter contract should keep adapter shape, validation, insert order, server-only gate, and post-import audit gate in contract order",
);

assertDataMatches(
  /async function handleCopySupabaseImporterAdapterContract\(\)[\s\S]*?const plan = createSupabaseImporterPlan\(supabaseImportDryRun,[\s\S]*?const contractText = buildSupabaseImporterAdapterContractText\(plan\)[\s\S]*?copyDataText\([\s\S]*?contractText[\s\S]*?Supabase importer adapter 계약을 클립보드에 복사했습니다[\s\S]*?buildSupabaseImporterAdapterContractManualCopyText\(\{[\s\S]*?contractText[\s\S]*?plan/,
  "Data importer adapter contract copy should keep the original contract on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseMigrationRehearsalReportManualCopyText\(\{[\s\S]*?preflight: SupabaseImportApiPreflightResponse[\s\S]*?rehearsalText: string[\s\S]*?# Prompt AI Studio Supabase Migration Rehearsal[\s\S]*?## 리허설 식별[\s\S]*?기준 시각: \$\{formatBackupDate\([\s\S]*?백업 지문: \$\{backupFingerprint\}[\s\S]*?workspace_id: \$\{workspaceId\}[\s\S]*?owner_user_id: \$\{ownerUserId\}[\s\S]*?리포트 길이: \$\{formatJsonLength\(rehearsalText\)\}[\s\S]*?## 리허설 readiness 요약[\s\S]*?Preflight status: \$\{preflight\.status\}[\s\S]*?Validation:[\s\S]*?Validation blockers:[\s\S]*?Import rows:[\s\S]*?Insert tables:[\s\S]*?Required confirmation:[\s\S]*?Handoff sections: \$\{supabaseImportVerificationCheckCounts\.handoffSections\}[\s\S]*?## Migration rehearsal report[\s\S]*?rehearsalText/,
  "Data migration rehearsal manual fallback should prepend backup/workspace identity, validation blockers, row/table counts, confirmation gate, handoff sections, and report length",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabaseMigrationRehearsalReportText",
    "# Prompt AI Studio Supabase Migration Rehearsal",
    "checkedAt: ${checkedAt || new Date().toISOString()}",
    "workspaceId: ${workspaceId || \"not provided\"}",
    "ownerUserId: ${ownerUserId || \"not provided\"}",
    "preflightStatus: ${preflight.status}",
    "validation: ${preflight.validation?.ok ? \"ok\" : \"blocked\"}",
    "importRows: ${preflight.plan?.totalRows ?? preflight.dryRun?.totalRows ?? 0}",
    "insertTables: ${preflight.insertOrder?.length ?? 0}",
    "requiredConfirmation: ${preflight.requiredConfirmation || \"not provided\"}",
    "## Rehearsal checklist",
    "Confirm backup JSON fingerprint and source owner.",
    "Confirm `docs/database-schema.sql` is applied to the target Supabase project.",
    "Run `/data` API preflight with `execute: false` and validation status `ok`.",
    "Copy and review the import execution plan.",
    "Copy and review the importer adapter contract.",
    "Keep `SUPABASE_IMPORT_EXECUTION_ENABLED=false` until the controlled write window.",
    "During the write window, set the execution gate only in a server-only environment.",
    "Execute only with `confirmation: RUN_SUPABASE_IMPORT`.",
    "Immediately set `SUPABASE_IMPORT_EXECUTION_ENABLED=false` after the run.",
    "Run row count verification SQL.",
    "Run relationship verification SQL.",
    "Run pending ID audit SQL.",
    "Run RLS owner access audit SQL.",
    "Apply/review RLS policy draft and complete authenticated RLS smoke test.",
    "Attach verification report and handoff package to the migration record.",
    "## Acceptance gates",
    "relationship checks: ${supabaseImportVerificationCheckCounts.relationship} / all issue_count 0",
    "pending ID checks: ${supabaseImportVerificationCheckCounts.pendingIdAudit} / all issue_count 0",
    "RLS owner access checks: ${supabaseImportVerificationCheckCounts.rlsOwnerAccess} / all issue_count 0",
    "RLS policy tables: ${supabaseImportVerificationCheckCounts.rlsPolicyTables}",
    "handoff sections: ${supabaseImportVerificationCheckCounts.handoffSections}",
    "## Insert order",
    "...(preflight.insertOrder?.length",
    "preflight.insertOrder.map",
    "## Preflight blockers",
    "preflight.validation?.blockers.length",
    "preflight.validation.blockers.map",
    "## Required `/data` artifacts",
    "Import execution plan",
    "Importer adapter contract",
    "Row count verification SQL",
    "Relationship verification SQL",
    "Pending ID audit SQL",
    "RLS owner access audit SQL",
    "RLS policy draft SQL",
    "RLS smoke test checklist",
    "Verification report",
    "Migration handoff package",
  ],
  "Data migration rehearsal report should keep preflight identity, readiness checklist, acceptance gates, insert order, blockers, and required artifacts together",
);

assertDataMatches(
  /async function handleCopySupabaseMigrationRehearsalReport\(\)[\s\S]*?const backupFingerprint = importBackupFingerprint[\s\S]*?const checkedAt = supabaseImportApiPreflight\.checkedAt[\s\S]*?const ownerUserId = verificationOwnerUserId\.trim\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?const rehearsalText = buildSupabaseMigrationRehearsalReportText\(\{[\s\S]*?copyDataText\([\s\S]*?rehearsalText[\s\S]*?Supabase migration rehearsal 리포트를 클립보드에 복사했습니다[\s\S]*?buildSupabaseMigrationRehearsalReportManualCopyText\(\{[\s\S]*?backupFingerprint[\s\S]*?checkedAt[\s\S]*?ownerUserId[\s\S]*?preflight: preflightData[\s\S]*?rehearsalText[\s\S]*?workspaceId/,
  "Data migration rehearsal copy should keep the original report on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseImportExecutionReadinessDecisionManualCopyText\(\{[\s\S]*?decisionText: string[\s\S]*?runtimeStatus: EnvironmentRuntimeStatus[\s\S]*?# Prompt AI Studio Supabase Import 실행 판정 메모[\s\S]*?## 판정 식별[\s\S]*?생성 시각: \$\{formatBackupDate\(checkedAt\)\}[\s\S]*?백업 지문: \$\{backupFingerprint\}[\s\S]*?workspace_id: \$\{workspaceId\}[\s\S]*?owner_user_id: \$\{ownerUserId\}[\s\S]*?메모 길이: \$\{formatJsonLength\(decisionText\)\}[\s\S]*?## 실행 판정 요약[\s\S]*?Decision: \$\{decision\}[\s\S]*?Preflight validation:[\s\S]*?Runtime release gate: \$\{formatReleaseGateStage\([\s\S]*?Runtime blockers: \$\{runtimeBlockers\.length\}개[\s\S]*?Supabase migration ready:[\s\S]*?Server importer ready:[\s\S]*?Import execution gate:[\s\S]*?## Execution readiness decision[\s\S]*?decisionText/,
  "Data execution readiness decision manual fallback should prepend decision identity, runtime gate, blockers, migration readiness, importer readiness, execution gate, and memo length",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabaseImportExecutionReadinessDecisionText",
    "const validationOk = preflight.validation?.ok === true;",
    "const runtimeBlockers = runtimeStatus.releaseGate.checks.filter",
    "check.status === \"block\"",
    "const runtimeWarnings = runtimeStatus.releaseGate.checks.filter",
    "check.status === \"warn\"",
    "const executionGateEnabled =",
    "runtimeStatus.supabase.importExecutionEnabled === true",
    "const migrationReady = runtimeStatus.supabase.readyForMigration === true;",
    "const serverImporterReady =",
    "runtimeStatus.supabase.serverImporterConfigured === true",
    "const decision =",
    "GO - controlled write window is armed",
    "READY TO ARM - enable execution gate only for the write window",
    "BLOCKED - do not execute",
    "const blockingReasons =",
    "API preflight validation is not ok for this backup/workspace/owner.",
    "Supabase migration env is not fully ready.",
    "Server importer service-role environment is not configured.",
    "runtimeBlockers.map",
    "# Prompt AI Studio Supabase Import Execution Readiness Decision",
    "checkedAt: ${checkedAt || new Date().toISOString()}",
    "backupFingerprint: ${backupFingerprint || \"not provided\"}",
    "workspaceId: ${workspaceId || \"not provided\"}",
    "ownerUserId: ${ownerUserId || \"not provided\"}",
    "decision: ${decision}",
    "preflightValidation: ${validationOk ? \"ok\" : \"blocked\"}",
    "runtimeStage: ${formatReleaseGateStage(runtimeStatus.releaseGate.stage)}",
    "runtimeScore: ${runtimeStatus.releaseGate.score}/100",
    "importExecutionGate: ${executionGateEnabled ? \"enabled\" : \"disabled\"}",
    "## Required operator sequence",
    "Confirm this memo uses the same backup fingerprint, workspace_id, and owner_user_id as the execution request.",
    "Confirm API preflight validation is `ok`.",
    "Confirm server importer env exists only in a trusted server-side context.",
    "Enable `SUPABASE_IMPORT_EXECUTION_ENABLED=true` only during the controlled write window.",
    "Execute with `confirmation: RUN_SUPABASE_IMPORT`.",
    "Immediately set `SUPABASE_IMPORT_EXECUTION_ENABLED=false` after execution.",
    "Copy execution route audit artifact.",
    "Complete post-import verification evidence record.",
    "## Blocking reasons",
    "blockingReasons.map",
    "## Runtime warnings to review",
    "runtimeWarnings.map",
    "warning.nextAction",
    "## Preflight blockers",
    "preflight.validation?.blockers.length",
    "preflight.validation.blockers.map",
    "## Insert order",
    "preflight.insertOrder.map",
    "item.order",
    "item.table",
    "item.rowCount",
    "item.dependency",
  ],
  "Data execution readiness decision should keep decision inputs, operator sequence, blockers, runtime warnings, preflight blockers, and insert order together",
);

assertDataMatches(
  /async function handleCopySupabaseImportExecutionReadinessDecision\(\)[\s\S]*?const backupFingerprint = importBackupFingerprint[\s\S]*?const checkedAt = new Date\(\)\.toISOString\(\)[\s\S]*?const ownerUserId = verificationOwnerUserId\.trim\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?const decisionText = buildSupabaseImportExecutionReadinessDecisionText\(\{[\s\S]*?copyDataText\([\s\S]*?decisionText[\s\S]*?Supabase import 실행 판정 메모를 클립보드에 복사했습니다[\s\S]*?buildSupabaseImportExecutionReadinessDecisionManualCopyText\(\{[\s\S]*?backupFingerprint[\s\S]*?checkedAt[\s\S]*?decisionText[\s\S]*?ownerUserId[\s\S]*?preflight: preflightData[\s\S]*?runtimeStatus: runtimeReadiness\.data[\s\S]*?workspaceId/,
  "Data execution readiness decision copy should keep the original memo on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseImportExecutionRequestTemplateManualCopyText\(\{[\s\S]*?templateText: string[\s\S]*?# Prompt AI Studio Supabase Import 실행 요청 템플릿[\s\S]*?## 요청 템플릿 식별[\s\S]*?백업 지문: \$\{backupFingerprint\}[\s\S]*?workspace_id: \$\{workspaceId\}[\s\S]*?owner_user_id: \$\{ownerUserId\}[\s\S]*?템플릿 길이: \$\{formatJsonLength\(templateText\)\}[\s\S]*?## 실행 gate 요약[\s\S]*?execute: true[\s\S]*?confirmation: RUN_SUPABASE_IMPORT[\s\S]*?includePayload: false[\s\S]*?server gate: SUPABASE_IMPORT_EXECUTION_ENABLED=true[\s\S]*?validation gate: API preflight validation must be ok[\s\S]*?trusted server-side\/operator execution window only[\s\S]*?## Execute request template[\s\S]*?templateText/,
  "Data execution request template manual fallback should prepend backup/workspace identity, execute gate, confirmation, payload mode, server gate, validation gate, and template length",
);
assertDataMatches(
  /function buildSupabaseImportExecutionRequestTemplateText\(\{[\s\S]*?backupFingerprint[\s\S]*?ownerUserId[\s\S]*?workspaceId[\s\S]*?# Prompt AI Studio Supabase Import Execute Request Template[\s\S]*?trusted server-side\/operator context[\s\S]*?JSON\.stringify\([\s\S]*?backupJson: "<paste validated Prompt AI Studio backup JSON here>"[\s\S]*?confirmation: "RUN_SUPABASE_IMPORT"[\s\S]*?execute: true[\s\S]*?includePayload: false[\s\S]*?ownerUserId[\s\S]*?workspaceId[\s\S]*?Required preconditions[\s\S]*?backupFingerprint: \$\{backupFingerprint \|\| "not provided"\}[\s\S]*?SUPABASE_IMPORT_EXECUTION_ENABLED=true[\s\S]*?NEXT_PUBLIC_SUPABASE_URL[\s\S]*?SUPABASE_SERVICE_ROLE_KEY[\s\S]*?API preflight returned validation `ok`[\s\S]*?Migration rehearsal report has no unresolved blockers[\s\S]*?Immediate follow-up[\s\S]*?SUPABASE_IMPORT_EXECUTION_ENABLED=false[\s\S]*?Copy the route audit artifact[\s\S]*?Run row count verification SQL[\s\S]*?Run relationship verification SQL[\s\S]*?Run pending ID audit SQL[\s\S]*?Run RLS owner access audit SQL[\s\S]*?Complete authenticated RLS smoke test/,
  "Data execution request template should include the exact execute payload, preconditions, and post-import follow-up checks",
);

assertDataMatches(
  /async function handleCopySupabaseImportExecutionRequestTemplate\(\)[\s\S]*?const backupFingerprint = importBackupFingerprint[\s\S]*?const templateText = buildSupabaseImportExecutionRequestTemplateText\(\{[\s\S]*?copyDataText\([\s\S]*?templateText[\s\S]*?Supabase import 실행 요청 템플릿을 클립보드에 복사했습니다[\s\S]*?buildSupabaseImportExecutionRequestTemplateManualCopyText\(\{[\s\S]*?backupFingerprint[\s\S]*?ownerUserId[\s\S]*?templateText[\s\S]*?workspaceId/,
  "Data execution request template copy should keep the original template on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabaseImportExecutionGuardChecklistManualCopyText\(\{[\s\S]*?checklistText: string[\s\S]*?# Prompt AI Studio Supabase Import 실행 금지 체크리스트[\s\S]*?## 체크리스트 식별[\s\S]*?백업 지문: \$\{backupFingerprint\}[\s\S]*?workspace_id: \$\{workspaceId\}[\s\S]*?owner_user_id: \$\{ownerUserId\}[\s\S]*?체크리스트 길이: \$\{formatJsonLength\(checklistText\)\}[\s\S]*?## 실행 차단 gate 요약[\s\S]*?API preflight must match this exact backup\/workspace\/owner combination[\s\S]*?API preflight validation must be ok[\s\S]*?database-schema\.sql must be applied[\s\S]*?SUPABASE_SERVICE_ROLE_KEY must remain server-side only[\s\S]*?SUPABASE_IMPORT_EXECUTION_ENABLED must be disabled immediately after the run[\s\S]*?Row count, relationship, pending ID, and RLS owner audits must be runnable[\s\S]*?RLS smoke test identities must be prepared[\s\S]*?## Execution guard checklist[\s\S]*?checklistText/,
  "Data execution guard checklist manual fallback should prepend backup/workspace identity, execution-blocking gates, audit readiness, RLS smoke readiness, and checklist length",
);
assertDataMatches(
  /function buildSupabaseImportExecutionGuardChecklistText\(\{[\s\S]*?backupFingerprint[\s\S]*?ownerUserId[\s\S]*?workspaceId[\s\S]*?# Prompt AI Studio Supabase Import Execution Guard[\s\S]*?backupFingerprint: \$\{backupFingerprint \|\| "not provided"\}[\s\S]*?workspaceId: \$\{workspaceId \|\| "not provided"\}[\s\S]*?ownerUserId: \$\{ownerUserId \|\| "not provided"\}[\s\S]*?Do not execute if any item is true[\s\S]*?API preflight has not been run for this exact backup\/workspace\/owner combination[\s\S]*?API preflight validation is not `ok`[\s\S]*?docs\/database-schema\.sql[\s\S]*?Target project ref is unknown or mismatched[\s\S]*?SUPABASE_SERVICE_ROLE_KEY[\s\S]*?browser\/public environment[\s\S]*?SUPABASE_IMPORT_EXECUTION_ENABLED[\s\S]*?would remain true after the run[\s\S]*?Backup JSON fingerprint\/source owner is not recorded[\s\S]*?Rollback artifact and local backup copy are not available[\s\S]*?row count, relationship, pending ID, and RLS owner audits[\s\S]*?RLS smoke test identities are not prepared[\s\S]*?Required after execution[\s\S]*?Copy route audit artifact[\s\S]*?Disable execution gate[\s\S]*?Run verification SQL bundle[\s\S]*?Attach verification report and migration handoff package/,
  "Data execution guard checklist should keep every no-go condition and required post-execution action together",
);

assertDataMatches(
  /async function handleCopySupabaseImportExecutionGuardChecklist\(\)[\s\S]*?const backupFingerprint = importBackupFingerprint[\s\S]*?const checklistText = buildSupabaseImportExecutionGuardChecklistText\(\{[\s\S]*?copyDataText\([\s\S]*?checklistText[\s\S]*?Supabase import 실행 금지 체크리스트를 클립보드에 복사했습니다[\s\S]*?buildSupabaseImportExecutionGuardChecklistManualCopyText\(\{[\s\S]*?backupFingerprint[\s\S]*?checklistText[\s\S]*?ownerUserId[\s\S]*?workspaceId/,
  "Data execution guard checklist copy should keep the original checklist on the clipboard and use the identity-rich fallback body only for manual copy",
);
assertFileIncludesInOrder(
  dataSource,
  [
    "function buildSupabaseImportExecutionPacketText",
    "adapterContractText",
    "apiAuditArtifactText",
    "apiPreflightReportText",
    "executionGuardChecklistText",
    "executionPacketManifestText",
    "executionPlanText",
    "executionReadinessDecisionText",
    "executionRequestTemplateText",
    "postImportVerificationEvidenceText",
    "rehearsalReportText",
    "# Prompt AI Studio Supabase Import Controlled Execution Packet",
    "operator artifact only",
    "does not execute Supabase writes",
    "must not contain service-role secrets",
    "## Packet index",
    "1. Execution packet manifest",
    "2. Execution readiness decision",
    "3. API preflight report",
    "4. Route audit artifact",
    "5. Execution guard checklist",
    "6. Execute request template",
    "7. Migration rehearsal report",
    "8. Post-import verification evidence",
    "9. Import execution plan",
    "10. Importer adapter contract",
    "executionPacketManifestText",
    "executionReadinessDecisionText",
    "apiPreflightReportText",
    "apiAuditArtifactText ||",
    "# Supabase Import Route Audit Artifact",
    "not provided by preflight response",
    "executionGuardChecklistText",
    "executionRequestTemplateText",
    "rehearsalReportText",
    "postImportVerificationEvidenceText",
    "executionPlanText",
    "adapterContractText",
  ],
  "Data controlled execution packet should keep the packet index, non-execution guard, secret guard, manifest, decision, preflight, audit artifact, guard checklist, request template, rehearsal, evidence, plan, and adapter contract together",
);

assertManifestMatches(
  /interface SupabaseImportExecutionPacketManifestItem[\s\S]*?copyDetail\?: string;[\s\S]*?detail\?: string;[\s\S]*?label: string;[\s\S]*?ready: boolean;[\s\S]*?value: string;[\s\S]*?interface SupabaseImportExecutionPacketCopyActionStatus[\s\S]*?action: string;[\s\S]*?detail: string;[\s\S]*?label: string;[\s\S]*?ready: boolean;[\s\S]*?interface SupabaseImportExecutionPacketManifestSummary[\s\S]*?copyGate: "operator review required" \| "resolve waiting items";[\s\S]*?readyCount: number;[\s\S]*?totalCount: number;[\s\S]*?waitingCount: number;/,
  "Data execution packet manifest items should have typed manifest and copy-action status fields",
);

assertDataMatches(
  /from "@\/lib\/data\/supabase-import-execution-packet-manifest";/,
  "Data view should import reusable execution packet manifest helpers from the data lib",
);

assertManifestMatches(
  /import \{[\s\S]*?formatSupabaseImportPreflightScopeChangeDetails[\s\S]*?formatSupabaseImportPreflightScopeChanges[\s\S]*?getSupabaseImportPreflightScopeChangeDetails[\s\S]*?getSupabaseImportPreflightScopeChanges[\s\S]*?getSupabaseImportPreflightScopeStatus[\s\S]*?from "\.\/supabase-import-preflight-scope";[\s\S]*?function getSupabaseImportExecutionPacketManifestItems\(\{[\s\S]*?backupFingerprint[\s\S]*?ownerUserId[\s\S]*?preflightState[\s\S]*?runtimeState[\s\S]*?sectionCount[\s\S]*?workspaceId[\s\S]*?getSupabaseImportPreflightScopeStatus\(\{[\s\S]*?getSupabaseImportPreflightScopeChanges\(\{[\s\S]*?getSupabaseImportPreflightScopeChangeDetails\(\{[\s\S]*?copyDetail: scopeChangeDetail \|\| undefined[\s\S]*?detail: scopeChangeSummary \|\| undefined[\s\S]*?Execution gate[\s\S]*?Packet sections/,
  "Data execution packet manifest lib should derive short display scope detail, full copy scope detail, validation, runtime, gate, and packet-section readiness",
);
assertFileIncludesInOrder(
  manifestSource,
  [
    "export function getSupabaseImportExecutionPacketManifestItems",
    "const trimmedWorkspaceId = workspaceId.trim();",
    "const trimmedOwnerUserId = ownerUserId.trim();",
    "const preflightReady =",
    "const preflightScopeStatus =",
    "const preflightCanUse = preflightReady && preflightScopeStatus === \"current\";",
    "const preflightValidationOk =",
    "const scopeChanges =",
    "const scopeChangeDetails =",
    "const scopeChangeSummary =",
    "const scopeChangeDetail =",
    "label: \"Preflight\"",
    "ready: preflightCanUse",
    "copyDetail: scopeChangeDetail || undefined",
    "detail: scopeChangeSummary || undefined",
    "label: \"Scope\"",
    "ready: preflightCanUse",
    "label: \"Validation\"",
    "ready: preflightValidationOk",
    "label: \"Runtime\"",
    "ready: runtimeState.ready",
    "label: \"Route audit\"",
    "ready: Boolean(preflightState.data?.auditArtifactText)",
    "label: \"Execution gate\"",
    "ready: runtimeState.ready",
    "label: \"Packet sections\"",
    "ready: preflightCanUse && runtimeState.ready",
  ],
  "Data execution packet manifest items should keep preflight, scope, validation, runtime, audit, execution gate, and packet section readiness in review order",
);

assertDataMatches(
  /function getSupabaseImportExecutionPacketRuntimeState\([\s\S]*?runtimeData\?\.supabase\.importExecutionEnabled[\s\S]*?formatReleaseGateStage\(runtimeData\.releaseGate\.stage\)[\s\S]*?status: runtimeState\.status/,
  "Data view should adapt runtime readiness into manifest-specific runtime state",
);

assertDataMatches(
  /getSupabaseImportExecutionPacketManifestItems\(\{[\s\S]*?runtimeState:[\s\S]*?getSupabaseImportExecutionPacketRuntimeState\([\s\S]*?sectionCount: supabaseImportExecutionPacketSectionCount/,
  "Data view should build execution packet manifest items through the reusable manifest item builder",
);

assertManifestMatches(
  /function getSupabaseImportExecutionPacketManifestSummary\([\s\S]*?readyCount = items\.filter\([\s\S]*?waitingCount = items\.length - readyCount[\s\S]*?copyGate:[\s\S]*?"operator review required"[\s\S]*?"resolve waiting items"[\s\S]*?function formatSupabaseImportExecutionPacketCopyGateLabel\([\s\S]*?operator review 필요[\s\S]*?대기 항목 해결 필요[\s\S]*?function buildSupabaseImportExecutionPacketManifestText\(\{[\s\S]*?backupFingerprint[\s\S]*?checkedAt[\s\S]*?items[\s\S]*?ownerUserId[\s\S]*?preflightCheckedAt[\s\S]*?workspaceId[\s\S]*?# Prompt AI Studio Supabase Import Execution Packet Manifest[\s\S]*?ready: \$\{summary\.readyCount\}\/\$\{summary\.totalCount\}[\s\S]*?waitingItems: \$\{summary\.waitingCount\}[\s\S]*?copyGate: \$\{summary\.copyGate\}[\s\S]*?manifestStatus: \$\{manifestStatus\.label\}[\s\S]*?manifestStatusDetail: \$\{manifestStatus\.detail\}[\s\S]*?## Manifest[\s\S]*?## Waiting items[\s\S]*?## Copy actions[\s\S]*?This manifest is a status artifact only/,
  "Data execution packet manifest text should be a copy-ready Markdown artifact with ready counts, status, waiting items, copy actions, and non-execution guardrails",
);

assertManifestMatches(
  /function getSupabaseImportExecutionPacketManifestItemCopyDetail\([\s\S]*?item\.copyDetail \?\? item\.detail[\s\S]*?function formatSupabaseImportExecutionPacketManifestItemLine\([\s\S]*?getSupabaseImportExecutionPacketManifestItemCopyDetail\(item\)[\s\S]*?function getSupabaseImportExecutionPacketManifestNextAction\([\s\S]*?items: SupabaseImportExecutionPacketManifestItem\[\][\s\S]*?detailMode\?: "copy" \| "display"[\s\S]*?const waitingItem = items\.find\(\(item\) => !item\.ready\)[\s\S]*?getSupabaseImportExecutionPacketManifestItemCopyDetail\(waitingItem\)[\s\S]*?saved preflight scope is stale[\s\S]*?Refresh runtime readiness[\s\S]*?controlled execution packet/,
  "Data execution packet manifest should derive a concrete next action with display or copy stale-scope detail from the first waiting item",
);

assertDataMatches(
  /function getExecutionPacketManifestStatusClass\([\s\S]*?border-attention\/40 bg-attention\/10 text-attention/,
  "Data view should keep only display-specific execution packet manifest status styling",
);

assertManifestMatches(
  /function getSupabaseImportExecutionPacketManifestStatus\([\s\S]*?detailMode\?: "copy" \| "display"[\s\S]*?getSupabaseImportExecutionPacketManifestSummary\(items\)[\s\S]*?getSupabaseImportExecutionPacketManifestNextAction\([\s\S]*?function buildSupabaseImportExecutionPacketNextActionText\(\{[\s\S]*?backupFingerprint[\s\S]*?checkedAt[\s\S]*?items[\s\S]*?ownerUserId[\s\S]*?preflightCheckedAt[\s\S]*?workspaceId[\s\S]*?getSupabaseImportExecutionPacketManifestItemCopyDetail\(waitingItem\)[\s\S]*?detailMode: "copy"[\s\S]*?getSupabaseImportExecutionPacketCopyActionStatuses\(items\)[\s\S]*?# Supabase Import Execution Packet Next Action[\s\S]*?manifestReady: \$\{summary\.readyCount\}\/\$\{summary\.totalCount\}[\s\S]*?waitingItems: \$\{summary\.waitingCount\}[\s\S]*?copyGate: \$\{summary\.copyGate\}[\s\S]*?manifestStatus: \$\{manifestStatus\.label\}[\s\S]*?manifestStatusDetail: \$\{manifestStatus\.detail\}[\s\S]*?waitingItem:[\s\S]*?waitingDetail: \$\{waitingDetail \|\| "none"\}[\s\S]*?## Copy actions[\s\S]*?## Next action[\s\S]*?## Guardrail/,
  "Data execution packet next-action text should be copy-ready with manifest context, waiting detail, and guardrails",
);
assertFileIncludesInOrder(
  manifestSource,
  [
    "export function buildSupabaseImportExecutionPacketNextActionText",
    "const summary = getSupabaseImportExecutionPacketManifestSummary(items);",
    "const waitingItem = items.find((item) => !item.ready);",
    "const waitingDetail = waitingItem",
    "getSupabaseImportExecutionPacketManifestItemCopyDetail(waitingItem)",
    "const nextAction = getSupabaseImportExecutionPacketManifestNextAction(items,",
    "detailMode: \"copy\"",
    "const manifestStatus = getSupabaseImportExecutionPacketManifestStatus(items,",
    "const copyActionStatuses =",
    "getSupabaseImportExecutionPacketCopyActionStatuses(items)",
    "# Supabase Import Execution Packet Next Action",
    "checkedAt: ${checkedAt || new Date().toISOString()}",
    "backupFingerprint: ${backupFingerprint || \"not provided\"}",
    "workspaceId: ${workspaceId || \"not provided\"}",
    "ownerUserId: ${ownerUserId || \"not provided\"}",
    "preflightCheckedAt: ${preflightCheckedAt || \"not provided\"}",
    "manifestReady: ${summary.readyCount}/${summary.totalCount}",
    "waitingItems: ${summary.waitingCount}",
    "copyGate: ${summary.copyGate}",
    "manifestStatus: ${manifestStatus.label}",
    "manifestStatusDetail: ${manifestStatus.detail}",
    "waitingItem: ${",
    "waitingDetail: ${waitingDetail || \"none\"}",
    "## Copy actions",
    "...copyActionStatuses.map",
    "formatSupabaseImportExecutionPacketCopyActionStatusLine",
    "## Next action",
    "`- ${nextAction}`",
    "## Guardrail",
    "operator handoff artifact only",
    "does not execute Supabase writes",
  ],
  "Data execution packet next-action text should keep identity, manifest summary, waiting detail, copy actions, next action, and non-execution guardrail in memo order",
);

assertManifestMatches(
  /function getSupabaseImportExecutionPacketCopyActionStatuses\([\s\S]*?action: "대기 항목이 바뀌면 다시 복사해 operator note를 갱신하세요\."[\s\S]*?label: "Next action"[\s\S]*?API preflight를 현재 입력값으로 다시 실행하세요\.[\s\S]*?label: "Manifest"[\s\S]*?runtime readiness를 새로고침하고 current preflight scope를 확인하세요\.[\s\S]*?label: "Controlled packet"[\s\S]*?function formatSupabaseImportExecutionPacketCopyActionStatusLine[\s\S]*?Next:[\s\S]*?action\.action[\s\S]*?function buildSupabaseImportExecutionPacketManifestText\([\s\S]*?detailMode: "copy"[\s\S]*?getSupabaseImportExecutionPacketCopyActionStatuses\(items\)[\s\S]*?## Manifest[\s\S]*?\.\.\.items\.map\(formatSupabaseImportExecutionPacketManifestItemLine\)[\s\S]*?## Waiting items[\s\S]*?waitingItems\.map\(formatSupabaseImportExecutionPacketWaitingItemLine\)[\s\S]*?## Copy actions[\s\S]*?formatSupabaseImportExecutionPacketCopyActionStatusLine[\s\S]*?## Next action[\s\S]*?`\- \$\{nextAction\}`[\s\S]*?## Operator note/,
  "Data execution packet manifest text should include copy-grade stale scope detail and the derived next action before operator guardrails",
);
assertFileIncludesInOrder(
  manifestSource,
  [
    "export function getSupabaseImportExecutionPacketCopyActionStatuses",
    "const scopeReady =",
    "const runtimeReady =",
    "const packetSectionsReady =",
    "대기 항목이 바뀌면 다시 복사해 operator note를 갱신하세요.",
    "첫 대기 항목과 다음 조치를 복사할 수 있습니다.",
    "label: \"Next action\"",
    "manifest를 복사해 실행 패킷 검토 기록에 첨부하세요.",
    "API preflight를 현재 입력값으로 다시 실행하세요.",
    "label: \"Manifest\"",
    "controlled packet을 복사하기 전에 operator review를 완료하세요.",
    "runtime readiness를 새로고침하고 current preflight scope를 확인하세요.",
    "label: \"Controlled packet\"",
    "export function formatSupabaseImportExecutionPacketCopyActionStatusLine",
    "Next: ${action.action}",
  ],
  "Data execution packet copy actions should keep next-action, manifest, and controlled-packet guidance in operator order",
);

assertDataMatches(
  /const supabaseImportExecutionPacketSectionCount = 10;[\s\S]*?function buildSupabaseImportExecutionPacketText\(\{[\s\S]*?executionPacketManifestText[\s\S]*?## Packet index[\s\S]*?1\. Execution packet manifest[\s\S]*?10\. Importer adapter contract[\s\S]*?executionPacketManifestText[\s\S]*?executionReadinessDecisionText/,
  "Data controlled execution packet should include the manifest as the first indexed section",
);

assertDataMatches(
  /function buildSupabaseImportExecutionPacketManualCopyText\(\{[\s\S]*?manifestItems: SupabaseImportExecutionPacketManifestItem\[\][\s\S]*?runtimeStatus: EnvironmentRuntimeStatus[\s\S]*?# Prompt AI Studio Supabase Import 실행 패킷[\s\S]*?## 패킷 식별[\s\S]*?생성 시각: \$\{formatBackupDate\(checkedAt\)\}[\s\S]*?Preflight 시각:[\s\S]*?백업 지문: \$\{backupFingerprint\}[\s\S]*?workspace_id: \$\{workspaceId\}[\s\S]*?owner_user_id: \$\{ownerUserId\}[\s\S]*?패킷 길이: \$\{formatJsonLength\(packetText\)\}[\s\S]*?## 실행 gate 요약[\s\S]*?Manifest status: \$\{manifestStatus\.label\}[\s\S]*?Ready items: \$\{manifestSummary\.readyCount\}\/\$\{manifestSummary\.totalCount\}[\s\S]*?Waiting items: \$\{manifestSummary\.waitingCount\}개[\s\S]*?Copy gate: \$\{formatSupabaseImportExecutionPacketCopyGateLabel[\s\S]*?Runtime release gate: \$\{formatReleaseGateStage\([\s\S]*?runtimeStatus\.releaseGate\.stage[\s\S]*?Import execution gate:[\s\S]*?## Controlled execution packet[\s\S]*?packetText/,
  "Data controlled execution packet manual fallback should prepend packet identity, manifest readiness, copy gate, runtime gate, and packet length",
);

assertDataMatches(
  /function buildSupabaseImportExecutionPacketManifestManualCopyText\(\{[\s\S]*?manifestItems: SupabaseImportExecutionPacketManifestItem\[\][\s\S]*?manifestText: string[\s\S]*?manifestSummary =[\s\S]*?getSupabaseImportExecutionPacketManifestSummary\(manifestItems\)[\s\S]*?manifestStatus =[\s\S]*?getSupabaseImportExecutionPacketManifestStatus\(manifestItems\)[\s\S]*?nextAction = getSupabaseImportExecutionPacketManifestNextAction\([\s\S]*?detailMode: "copy"[\s\S]*?# Prompt AI Studio Supabase Import Execution Packet Manifest[\s\S]*?## Manifest 식별[\s\S]*?생성 시각: \$\{formatBackupDate\(checkedAt\)\}[\s\S]*?Preflight 시각:[\s\S]*?백업 지문: \$\{backupFingerprint\}[\s\S]*?workspace_id: \$\{workspaceId\}[\s\S]*?owner_user_id: \$\{ownerUserId\}[\s\S]*?Manifest 길이: \$\{formatJsonLength\(manifestText\)\}[\s\S]*?## Manifest gate 요약[\s\S]*?Manifest status: \$\{manifestStatus\.label\}[\s\S]*?Manifest detail: \$\{manifestStatus\.detail\}[\s\S]*?Ready items: \$\{manifestSummary\.readyCount\}\/\$\{manifestSummary\.totalCount\}[\s\S]*?Waiting items: \$\{manifestSummary\.waitingCount\}개[\s\S]*?Copy gate: \$\{formatSupabaseImportExecutionPacketCopyGateLabel[\s\S]*?Next action: \$\{nextAction\}[\s\S]*?## Operator guardrails[\s\S]*?status artifact only[\s\S]*?service-role keys[\s\S]*?waiting items are resolved[\s\S]*?## Execution packet manifest[\s\S]*?manifestText/,
  "Data execution packet manifest manual fallback should prepend manifest identity, readiness counts, copy gate, next action, guardrails, and manifest length",
);

assertDataMatches(
  /function buildSupabaseImportExecutionPacketNextActionManualCopyText\(\{[\s\S]*?manifestItems: SupabaseImportExecutionPacketManifestItem\[\][\s\S]*?nextActionText: string[\s\S]*?manifestSummary =[\s\S]*?getSupabaseImportExecutionPacketManifestSummary\(manifestItems\)[\s\S]*?manifestStatus =[\s\S]*?getSupabaseImportExecutionPacketManifestStatus\(manifestItems\)[\s\S]*?waitingItem = manifestItems\.find\(\(item\) => !item\.ready\)[\s\S]*?nextAction = getSupabaseImportExecutionPacketManifestNextAction\([\s\S]*?detailMode: "copy"[\s\S]*?# Prompt AI Studio Supabase Import Execution Packet Next Action[\s\S]*?## 다음 조치 식별[\s\S]*?생성 시각: \$\{formatBackupDate\(checkedAt\)\}[\s\S]*?Preflight 시각:[\s\S]*?백업 지문: \$\{backupFingerprint\}[\s\S]*?workspace_id: \$\{workspaceId\}[\s\S]*?owner_user_id: \$\{ownerUserId\}[\s\S]*?메모 길이: \$\{formatJsonLength\(nextActionText\)\}[\s\S]*?## 다음 조치 gate 요약[\s\S]*?Manifest status: \$\{manifestStatus\.label\}[\s\S]*?Ready items: \$\{manifestSummary\.readyCount\}\/\$\{manifestSummary\.totalCount\}[\s\S]*?Waiting items: \$\{manifestSummary\.waitingCount\}개[\s\S]*?Copy gate: \$\{formatSupabaseImportExecutionPacketCopyGateLabel[\s\S]*?Waiting item:[\s\S]*?Next action: \$\{nextAction\}[\s\S]*?## Operator guardrails[\s\S]*?operator handoff artifact only[\s\S]*?Re-copy this note[\s\S]*?## Next action memo[\s\S]*?nextActionText/,
  "Data execution packet next-action manual fallback should prepend note identity, readiness counts, copy gate, waiting item, next action, guardrails, and note length",
);

assertManifestMatches(
  /label: "Packet sections"[\s\S]*?`\$\{sectionCount\}개`/,
  "Data execution packet manifest should show the supplied controlled packet section count",
);

assertDataMatches(
  /async function handleCopySupabaseImportExecutionPacketManifest\(\)[\s\S]*?getSupabaseImportPreflightScopeError\(\)[\s\S]*?getSupabaseImportExecutionPacketManifestItems\(\{[\s\S]*?backupFingerprint: importBackupFingerprint[\s\S]*?preflightState: supabaseImportApiPreflight[\s\S]*?runtimeState:[\s\S]*?getSupabaseImportExecutionPacketRuntimeState\(runtimeReadiness\)[\s\S]*?sectionCount: supabaseImportExecutionPacketSectionCount[\s\S]*?const checkedAt = new Date\(\)\.toISOString\(\)[\s\S]*?const manifestText = buildSupabaseImportExecutionPacketManifestText\(\{[\s\S]*?preflightCheckedAt: supabaseImportApiPreflight\.checkedAt[\s\S]*?copyDataText\([\s\S]*?manifestText[\s\S]*?Supabase import execution packet manifest를 클립보드에 복사했습니다[\s\S]*?buildSupabaseImportExecutionPacketManifestManualCopyText\(\{[\s\S]*?manifestItems[\s\S]*?manifestText/,
  "Data execution packet manifest copy handler should enforce current preflight scope and use clipboard fallback metadata",
);

assertDataMatches(
  /async function handleCopySupabaseImportExecutionPacketNextAction\(\)[\s\S]*?supabaseImportApiPreflight\.data[\s\S]*?먼저 Supabase import API preflight를 실행하세요[\s\S]*?getSupabaseImportExecutionPacketManifestItems\(\{[\s\S]*?preflightState: supabaseImportApiPreflight[\s\S]*?getSupabaseImportExecutionPacketRuntimeState\(runtimeReadiness\)[\s\S]*?sectionCount: supabaseImportExecutionPacketSectionCount[\s\S]*?const checkedAt = new Date\(\)\.toISOString\(\)[\s\S]*?const nextActionText = buildSupabaseImportExecutionPacketNextActionText\(\{[\s\S]*?preflightCheckedAt: supabaseImportApiPreflight\.checkedAt[\s\S]*?copyDataText\([\s\S]*?nextActionText[\s\S]*?Supabase import execution packet 다음 조치를 클립보드에 복사했습니다[\s\S]*?buildSupabaseImportExecutionPacketNextActionManualCopyText\(\{[\s\S]*?manifestItems[\s\S]*?nextActionText/,
  "Data execution packet next-action copy handler should copy the current blocker/action even when the manifest is not fully ready",
);

assertDataMatches(
  /async function handleCopySupabaseImportExecutionPacket\(\)[\s\S]*?const manifestItems = getSupabaseImportExecutionPacketManifestItems\(\{[\s\S]*?preflightState: supabaseImportApiPreflight[\s\S]*?getSupabaseImportExecutionPacketRuntimeState\(runtimeReadiness\)[\s\S]*?sectionCount: supabaseImportExecutionPacketSectionCount[\s\S]*?const executionPacketManifestText =[\s\S]*?buildSupabaseImportExecutionPacketManifestText\(\{[\s\S]*?items: manifestItems[\s\S]*?buildSupabaseImportExecutionPacketText\(\{[\s\S]*?executionPacketManifestText/,
  "Data full execution packet copy should embed the same manifest artifact used by the standalone manifest copy action",
);

assertDataMatches(
  /async function handleCopySupabaseImportExecutionPacket\(\)[\s\S]*?const executionPacketText = buildSupabaseImportExecutionPacketText\(\{[\s\S]*?executionPacketManifestText[\s\S]*?copyDataText\([\s\S]*?executionPacketText[\s\S]*?Supabase import 실행 패킷을 클립보드에 복사했습니다[\s\S]*?buildSupabaseImportExecutionPacketManualCopyText\(\{[\s\S]*?backupFingerprint: importBackupFingerprint[\s\S]*?checkedAt[\s\S]*?manifestItems[\s\S]*?ownerUserId[\s\S]*?packetText: executionPacketText[\s\S]*?preflightCheckedAt: supabaseImportApiPreflight\.checkedAt[\s\S]*?runtimeStatus: runtimeReadiness\.data[\s\S]*?workspaceId/,
  "Data full execution packet copy should keep the original controlled packet on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /function buildSupabasePostImportVerificationEvidenceManualCopyText\(\{[\s\S]*?evidenceText: string[\s\S]*?preflight: SupabaseImportApiPreflightResponse[\s\S]*?# Prompt AI Studio Supabase Post-import 검증 기록지[\s\S]*?## 검증 기록 식별[\s\S]*?기준 시각: \$\{formatBackupDate\([\s\S]*?백업 지문: \$\{backupFingerprint\}[\s\S]*?workspace_id: \$\{workspaceId\}[\s\S]*?owner_user_id: \$\{ownerUserId\}[\s\S]*?기록지 길이: \$\{formatJsonLength\(evidenceText\)\}[\s\S]*?## 실행 결과 대조 요약[\s\S]*?Preflight status: \$\{preflight\.status\}[\s\S]*?Validation:[\s\S]*?Expected rows:[\s\S]*?Expected insert tables:[\s\S]*?Relationship checks: \$\{supabaseImportVerificationCheckCounts\.relationship\}[\s\S]*?Pending ID checks: \$\{supabaseImportVerificationCheckCounts\.pendingIdAudit\}[\s\S]*?RLS owner access checks: \$\{supabaseImportVerificationCheckCounts\.rlsOwnerAccess\}[\s\S]*?## Post-import verification evidence[\s\S]*?evidenceText/,
  "Data post-import evidence manual fallback should prepend backup/workspace identity, expected rows, acceptance gate counts, and evidence length",
);
assertDataMatches(
  /function buildSupabasePostImportVerificationEvidenceText\(\{[\s\S]*?backupFingerprint[\s\S]*?checkedAt[\s\S]*?ownerUserId[\s\S]*?preflight[\s\S]*?workspaceId[\s\S]*?# Prompt AI Studio Supabase Post-import Verification Evidence[\s\S]*?checkedAt: \$\{checkedAt \|\| new Date\(\)\.toISOString\(\)\}[\s\S]*?backupFingerprint: \$\{backupFingerprint \|\| "not provided"\}[\s\S]*?workspaceId: \$\{workspaceId \|\| "not provided"\}[\s\S]*?ownerUserId: \$\{ownerUserId \|\| "not provided"\}[\s\S]*?preflightStatus: \$\{preflight\.status\}[\s\S]*?validation: \$\{preflight\.validation\?\.ok \? "ok" : "blocked"\}[\s\S]*?importedRowsExpected:[\s\S]*?insertTablesExpected:[\s\S]*?Required evidence[\s\S]*?Execution response route audit artifact attached[\s\S]*?Row count verification SQL output attached[\s\S]*?Relationship verification SQL output attached[\s\S]*?Pending ID audit SQL output attached[\s\S]*?RLS owner access audit SQL output attached[\s\S]*?Authenticated RLS smoke test completed[\s\S]*?SUPABASE_IMPORT_EXECUTION_ENABLED=false[\s\S]*?Rollback decision and operator sign-off recorded[\s\S]*?Acceptance gates[\s\S]*?relationship checks:[\s\S]*?pending ID checks:[\s\S]*?RLS owner access checks:[\s\S]*?RLS policy tables:[\s\S]*?Expected insert order[\s\S]*?Evidence slots[\s\S]*?Execution route audit artifact[\s\S]*?Row count verification SQL result[\s\S]*?Relationship verification SQL result[\s\S]*?Pending ID audit SQL result[\s\S]*?RLS owner access audit SQL result[\s\S]*?Authenticated RLS smoke test[\s\S]*?Rollback triggers[\s\S]*?insert response row count[\s\S]*?issue_count greater than 0[\s\S]*?pending-\*[\s\S]*?non-member[\s\S]*?execution gate remains enabled/,
  "Data post-import evidence should keep identity, required evidence, acceptance gates, evidence slots, and rollback triggers together",
);

assertDataMatches(
  /async function handleCopySupabasePostImportVerificationEvidence\(\)[\s\S]*?const backupFingerprint = importBackupFingerprint[\s\S]*?const checkedAt = supabaseImportApiPreflight\.checkedAt[\s\S]*?const ownerUserId = verificationOwnerUserId\.trim\(\)[\s\S]*?const workspaceId = verificationWorkspaceId\.trim\(\)[\s\S]*?const evidenceText = buildSupabasePostImportVerificationEvidenceText\(\{[\s\S]*?copyDataText\([\s\S]*?evidenceText[\s\S]*?Supabase post-import 검증 기록지를 클립보드에 복사했습니다[\s\S]*?buildSupabasePostImportVerificationEvidenceManualCopyText\(\{[\s\S]*?backupFingerprint[\s\S]*?checkedAt[\s\S]*?evidenceText[\s\S]*?ownerUserId[\s\S]*?preflight: preflightData[\s\S]*?workspaceId/,
  "Data post-import evidence copy should keep the original evidence on the clipboard and use the identity-rich fallback body only for manual copy",
);

assertDataMatches(
  /packetManifestStatus =[\s\S]*?getSupabaseImportExecutionPacketManifestStatus\(packetManifestItems\)[\s\S]*?packetCopyActionStatuses =[\s\S]*?getSupabaseImportExecutionPacketCopyActionStatuses\(packetManifestItems\)[\s\S]*?packetManifestScopeDetail = packetManifestItems\.find[\s\S]*?preflightScopeStatus === "stale"[\s\S]*?packetManifestScopeDetail[\s\S]*?Execution packet manifest[\s\S]*?getExecutionPacketManifestStatusClass\([\s\S]*?packetManifestStatus\.tone[\s\S]*?packetManifestStatus\.label[\s\S]*?data-testid="data-execution-packet-manifest-copy"[\s\S]*?Manifest 복사[\s\S]*?packetManifestStatus\.detail[\s\S]*?packetCopyActionStatuses\.map\(\(action\) =>[\s\S]*?action\.ready \? "ready" : "waiting"[\s\S]*?Next: \{action\.action\}[\s\S]*?packetManifestItems\.map\(\(item\) =>[\s\S]*?item\.detail[\s\S]*?data-testid="data-execution-packet-manifest-next-action"[\s\S]*?Next action[\s\S]*?data-testid="data-execution-packet-next-action-copy"[\s\S]*?다음 조치 복사[\s\S]*?packetManifestNextAction/,
  "Data execution packet manifest UI should expose stale scope detail, manifest status, copy-action statuses, manifest copy, derived next action, and next-action copy",
);
assertDataMatches(
  /function EnvironmentReadinessSummary\([\s\S]*?runtimeSummaryItems = \[[\s\S]*?생성 엔진[\s\S]*?Supabase client[\s\S]*?Server importer[\s\S]*?Storage mode[\s\S]*?className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"[\s\S]*?data-testid="data-environment-readiness-metrics"[\s\S]*?현재 사용[\s\S]*?Supabase 전환[\s\S]*?후속 전환[\s\S]*?className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-runtime-preflight-metrics"[\s\S]*?className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3"[\s\S]*?data-testid="data-runtime-snapshot-metrics"[\s\S]*?저장 수[\s\S]*?최근 stage[\s\S]*?최근 score/,
  "Data environment readiness should expose compact two-column mobile metrics for readiness counts, runtime preflight, and snapshot history",
);
assertDataMatches(
  /className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-import-execution-plan-metrics"[\s\S]*?Payload rows[\s\S]*?UUID map[\s\S]*?Archive snapshots[\s\S]*?상태/,
  "Data import execution plan metrics should keep a compact two-column mobile grid and four-column desktop grid",
);
assertDataTestIdCount(
  "data-import-execution-plan-metrics",
  1,
  "Data import execution plan metrics test id should appear exactly once",
);
assertDataMatches(
  /function ImportValidationSummary\([\s\S]*?백업 앱[\s\S]*?스키마[\s\S]*?백업 생성[\s\S]*?가져온 방식[\s\S]*?복원 상태[\s\S]*?className="grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-import-validation-metrics"/,
  "Data import validation metrics should keep a compact two-column mobile grid and four-column desktop grid",
);
assertDataMatches(
  /function RestoreReportSummary\([\s\S]*?백업 생성[\s\S]*?가져온 방식[\s\S]*?지문 비교[\s\S]*?변경 항목[\s\S]*?리스크[\s\S]*?className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-5"[\s\S]*?data-testid="data-restore-report-metrics"/,
  "Data restore report metrics should keep a compact two-column mobile grid and five-column desktop grid",
);
assertDataMatches(
  /className="grid grid-cols-2 gap-2 sm:grid-cols-3"[\s\S]*?data-testid="data-migration-checklist-metrics"[\s\S]*?준비됨[\s\S]*?결정 필요[\s\S]*?수동 확인/,
  "Data migration checklist metrics should keep two mobile columns before the detailed checklist",
);
assertDataMatches(
  /className="grid grid-cols-2 gap-2 sm:grid-cols-3"[\s\S]*?data-testid="data-migration-mapping-metrics"[\s\S]*?매핑 가능[\s\S]*?결정 필요[\s\S]*?예상 rows/,
  "Data migration mapping metrics should keep two mobile columns before the detailed table",
);
assertDataMatches(
  /className="grid grid-cols-2 gap-2 sm:grid-cols-3"[\s\S]*?data-testid="data-import-dry-run-metrics"[\s\S]*?Insert batches[\s\S]*?예상 rows[\s\S]*?경고/,
  "Data import dry-run metrics should keep two mobile columns before the batch table",
);
assertDataMatches(
  /className="grid grid-cols-2 gap-2"[\s\S]*?data-testid="data-import-dry-run-warning-metrics"[\s\S]*?설정 필요[\s\S]*?관계 참조 확인/,
  "Data import dry-run warning metrics should keep a compact two-column mobile grid",
);
assertDataMatches(
  /className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-reference-replacement-metrics"[\s\S]*?Prompt refs[\s\S]*?Version refs[\s\S]*?Feedback refs[\s\S]*?Archive traces/,
  "Data pending ID replacement metrics should keep a compact two-column mobile grid and separate test id",
);
assertDataTestIdCount(
  "data-reference-replacement-metrics",
  1,
  "Data pending ID replacement metrics test id should appear exactly once",
);
assertDataMatches(
  /className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-api-preflight-summary-metrics"[\s\S]*?Validation[\s\S]*?Insert tables[\s\S]*?Rows[\s\S]*?Confirmation/,
  "Data API preflight summary metrics should keep a compact two-column mobile grid and four-column desktop grid",
);
assertDataMatches(
  /className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-row-count-verification-metrics"[\s\S]*?검증 테이블[\s\S]*?예상 rows[\s\S]*?필터 기준[\s\S]*?최대 batch/,
  "Data row count verification metrics should keep a compact two-column mobile grid before the SQL preview",
);
assertDataMatches(
  /className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-relationship-verification-metrics"[\s\S]*?검증 항목[\s\S]*?정상 기준[\s\S]*?필터 기준[\s\S]*?workspace_id/,
  "Data relationship verification metrics should keep a compact two-column mobile grid before the SQL preview",
);
assertDataMatches(
  /className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-pending-id-audit-metrics"[\s\S]*?검증 항목[\s\S]*?정상 기준[\s\S]*?대상 필드[\s\S]*?workspace_id/,
  "Data pending ID audit metrics should keep a compact two-column mobile grid before the SQL preview",
);
assertDataMatches(
  /className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-rls-access-audit-metrics"[\s\S]*?검증 항목[\s\S]*?정상 기준[\s\S]*?필수 입력[\s\S]*?owner_user_id/,
  "Data RLS owner access audit metrics should keep a compact two-column mobile grid before the SQL preview",
);
assertDataMatches(
  /className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-rls-policy-draft-metrics"[\s\S]*?Helper functions[\s\S]*?RLS tables[\s\S]*?Write roles[\s\S]*?상태/,
  "Data RLS policy draft metrics should keep a compact two-column mobile grid before the SQL preview",
);
assertDataMatches(
  /className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-rls-smoke-test-metrics"[\s\S]*?Test roles[\s\S]*?Allow\/deny[\s\S]*?Cross-workspace[\s\S]*?상태/,
  "Data RLS smoke test metrics should keep a compact two-column mobile grid before the checklist preview",
);
assertDataMatches(
  /className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-verification-report-metrics"[\s\S]*?Row checks[\s\S]*?Relationship checks[\s\S]*?RLS checks[\s\S]*?Setup warnings[\s\S]*?Reference warnings/,
  "Data verification report metrics should keep a compact two-column mobile grid before the report preview",
);
assertDataMatches(
  /className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="data-migration-handoff-metrics"[\s\S]*?Sections[\s\S]*?Expected rows[\s\S]*?Workspace[\s\S]*?Owner/,
  "Data migration handoff metrics should keep a compact two-column mobile grid before the package preview",
);
[
  "data-row-count-verification-metrics",
  "data-relationship-verification-metrics",
  "data-pending-id-audit-metrics",
  "data-rls-access-audit-metrics",
  "data-rls-policy-draft-metrics",
  "data-rls-smoke-test-metrics",
  "data-verification-report-metrics",
  "data-migration-handoff-metrics",
].forEach((testId) => {
  assertDataTestIdCount(
    testId,
    1,
    `Data metric test id ${testId} should appear exactly once`,
  );
});

assertDataMatches(
  /formatSupabaseImportExecutionPacketCopyGateLabel[\s\S]*?getSupabaseImportExecutionPacketManifestSummary[\s\S]*?packetManifestSummary =[\s\S]*?getSupabaseImportExecutionPacketManifestSummary\(packetManifestItems\)[\s\S]*?data-testid="data-execution-packet-manifest-summary"[\s\S]*?Ready items[\s\S]*?`\$\{packetManifestSummary\.readyCount\}\/\$\{packetManifestSummary\.totalCount\}`[\s\S]*?Waiting items[\s\S]*?`\$\{packetManifestSummary\.waitingCount\}개`[\s\S]*?Copy gate[\s\S]*?formatSupabaseImportExecutionPacketCopyGateLabel\([\s\S]*?packetManifestSummary\.copyGate/,
  "Data execution packet manifest UI should summarize ready items, waiting items, and copy gate state above the detailed checklist",
);
assertDataMatches(
  /className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3"[\s\S]*?data-testid="data-execution-packet-manifest-summary"[\s\S]*?Ready items[\s\S]*?Waiting items[\s\S]*?Copy gate/,
  "Data execution packet manifest summary should keep two mobile columns before detailed manifest rows",
);

assertDataMatches(
  /<SupabaseImportExecutionPlanSummary[\s\S]*?onCopyExecutionPacket=\{[\s\S]*?handleCopySupabaseImportExecutionPacket[\s\S]*?onCopyExecutionPacketManifest=\{[\s\S]*?handleCopySupabaseImportExecutionPacketManifest[\s\S]*?onCopyExecutionPacketNextAction=\{[\s\S]*?handleCopySupabaseImportExecutionPacketNextAction/,
  "Data view should pass execution packet manifest and next-action copy handlers into the import execution plan summary",
);

const generatedStaleManifestItems = getSupabaseImportExecutionPacketManifestItems(
  {
    backupFingerprint: "backup:new",
    ownerUserId: "owner-new",
    preflightState: {
      backupFingerprint: "backup:old",
      data: {
        auditArtifactText: "# audit",
        status: "ready",
        validation: {
          ok: true,
        },
      },
      ownerUserId: "owner-new",
      status: "ready",
      workspaceId: "workspace-old",
    },
    runtimeState: {
      importExecutionEnabled: false,
      ready: true,
      releaseGateStageLabel: "ready",
      status: "ready",
    },
    sectionCount: 10,
    workspaceId: "workspace-new",
  },
);

assert.deepEqual(
  normalizePlain(
    generatedStaleManifestItems.map((item) => ({
      copyDetail: item.copyDetail,
      detail: item.detail,
      label: item.label,
      ready: item.ready,
      value: item.value,
    })),
  ),
  [
    {
      label: "Preflight",
      ready: false,
      value: "stale",
    },
    {
      copyDetail:
        "Changed scope inputs: backup fingerprint (preflight: backup:old -> current: backup:new), workspace_id (preflight: workspace-old -> current: workspace-new)",
      detail: "Changed scope inputs: backup fingerprint, workspace_id",
      label: "Scope",
      ready: false,
      value: "재실행 필요",
    },
    {
      label: "Validation",
      ready: false,
      value: "blocked",
    },
    {
      label: "Runtime",
      ready: true,
      value: "ready",
    },
    {
      label: "Route audit",
      ready: true,
      value: "포함",
    },
    {
      label: "Execution gate",
      ready: true,
      value: "disabled",
    },
    {
      label: "Packet sections",
      ready: false,
      value: "대기",
    },
  ],
  "Execution packet manifest item builder should preserve stale scope details and runtime readiness",
);

const staleScopeManifestItems = [
  {
    label: "Preflight",
    ready: false,
    value: "stale",
  },
  {
    copyDetail:
      "Changed scope inputs: workspace_id (preflight: old-workspace -> current: new-workspace)",
    detail: "Changed scope inputs: workspace_id",
    label: "Scope",
    ready: false,
    value: "재실행 필요",
  },
  {
    label: "Validation",
    ready: false,
    value: "blocked",
  },
  {
    label: "Runtime",
    ready: false,
    value: "미확인",
  },
  {
    label: "Route audit",
    ready: true,
    value: "포함",
  },
  {
    label: "Execution gate",
    ready: false,
    value: "미확인",
  },
  {
    label: "Packet sections",
    ready: false,
    value: "대기",
  },
];

assert.deepEqual(
  normalizePlain(
    getSupabaseImportExecutionPacketCopyActionStatuses(
      staleScopeManifestItems,
    ).map((item) => ({
      action: item.action,
      label: item.label,
      ready: item.ready,
    })),
  ),
  [
    {
      action: "대기 항목이 바뀌면 다시 복사해 operator note를 갱신하세요.",
      label: "Next action",
      ready: true,
    },
    {
      action: "API preflight를 현재 입력값으로 다시 실행하세요.",
      label: "Manifest",
      ready: false,
    },
    {
      action:
        "runtime readiness를 새로고침하고 current preflight scope를 확인하세요.",
      label: "Controlled packet",
      ready: false,
    },
  ],
  "Execution packet copy actions should expose actionable waiting steps",
);

assert.match(
  getSupabaseImportExecutionPacketManifestNextAction(staleScopeManifestItems, {
    detailMode: "copy",
  }),
  /old-workspace -> current: new-workspace/,
  "Execution packet next action should use copy-grade stale scope detail",
);

assert.deepEqual(
  normalizePlain(
    getSupabaseImportExecutionPacketManifestStatus(staleScopeManifestItems, {
      detailMode: "copy",
    }),
  ),
  {
    detail:
      "Rerun API preflight because the saved preflight scope is stale. Changed scope inputs: workspace_id (preflight: old-workspace -> current: new-workspace).",
    label: "1/7 ready - waiting: Preflight",
    tone: "blocked",
  },
  "Execution packet status should summarize ready count and first waiting item",
);

assert.deepEqual(
  normalizePlain(
    getSupabaseImportExecutionPacketManifestSummary(staleScopeManifestItems),
  ),
  {
    copyGate: "resolve waiting items",
    readyCount: 1,
    totalCount: 7,
    waitingCount: 6,
  },
  "Execution packet manifest summary should count waiting items and keep the copy gate blocked while items are unresolved",
);

assert.equal(
  formatSupabaseImportExecutionPacketCopyGateLabel("resolve waiting items"),
  "대기 항목 해결 필요",
  "Execution packet copy gate display label should localize waiting state for the UI",
);

const manifestText = buildSupabaseImportExecutionPacketManifestText({
  backupFingerprint: "backup:abc",
  checkedAt: "2026-06-19T00:00:00.000Z",
  items: staleScopeManifestItems,
  ownerUserId: "owner-uuid",
  preflightCheckedAt: "2026-06-18T00:00:00.000Z",
  workspaceId: "workspace-uuid",
});

assert.match(
  manifestText,
  /## Copy actions[\s\S]*Next: API preflight를 현재 입력값으로 다시 실행하세요\./,
  "Execution packet manifest text should include copy-action next steps",
);
assert.match(
  manifestText,
  /- waitingItems: 6[\s\S]*- copyGate: resolve waiting items/,
  "Execution packet manifest text should include the same waiting count and copy gate summary shown in the UI",
);
assert.match(
  manifestText,
  /old-workspace -> current: new-workspace/,
  "Execution packet manifest text should preserve copy-grade stale scope detail",
);

const nextActionText = buildSupabaseImportExecutionPacketNextActionText({
  backupFingerprint: "backup:abc",
  checkedAt: "2026-06-19T00:00:00.000Z",
  items: staleScopeManifestItems,
  ownerUserId: "owner-uuid",
  preflightCheckedAt: "2026-06-18T00:00:00.000Z",
  workspaceId: "workspace-uuid",
});

assert.match(
  nextActionText,
  /waitingDetail: none/,
  "Execution packet next-action text should report no waiting detail when Preflight is the first blocker",
);
assert.match(
  nextActionText,
  /- waitingItems: 6[\s\S]*- copyGate: resolve waiting items/,
  "Execution packet next-action text should include waiting count and copy gate summary",
);
assert.match(
  nextActionText,
  /## Copy actions[\s\S]*Controlled packet:[\s\S]*runtime readiness를 새로고침/,
  "Execution packet next-action text should include controlled-packet action guidance",
);

const readyManifestItems = getSupabaseImportExecutionPacketManifestItems({
  backupFingerprint: "backup:ready",
  ownerUserId: "owner-ready",
  preflightState: {
    backupFingerprint: "backup:ready",
    data: {
      auditArtifactText: "# audit",
      status: "ready",
      validation: {
        ok: true,
      },
    },
    ownerUserId: "owner-ready",
    status: "ready",
    workspaceId: "workspace-ready",
  },
  runtimeState: {
    importExecutionEnabled: true,
    ready: true,
    releaseGateStageLabel: "ready",
    status: "ready",
  },
  sectionCount: 10,
  workspaceId: "workspace-ready",
});

assert.deepEqual(
  normalizePlain(
    readyManifestItems.map((item) => ({
      label: item.label,
      ready: item.ready,
      value: item.value,
    })),
  ),
  [
    {
      label: "Preflight",
      ready: true,
      value: "ready",
    },
    {
      label: "Scope",
      ready: true,
      value: "current",
    },
    {
      label: "Validation",
      ready: true,
      value: "ok",
    },
    {
      label: "Runtime",
      ready: true,
      value: "ready",
    },
    {
      label: "Route audit",
      ready: true,
      value: "포함",
    },
    {
      label: "Execution gate",
      ready: true,
      value: "armed",
    },
    {
      label: "Packet sections",
      ready: true,
      value: "10개",
    },
  ],
  "Execution packet manifest item builder should mark every item ready when preflight scope and runtime are current",
);

assert.deepEqual(
  normalizePlain(
    getSupabaseImportExecutionPacketManifestStatus(readyManifestItems),
  ),
  {
    detail:
      "Controlled packet is ready to copy after operator review; it still does not execute Supabase writes.",
    label: "7/7 ready",
    tone: "ready",
  },
  "Execution packet manifest status should close as ready when every manifest item is ready",
);

assert.deepEqual(
  normalizePlain(
    getSupabaseImportExecutionPacketManifestSummary(readyManifestItems),
  ),
  {
    copyGate: "operator review required",
    readyCount: 7,
    totalCount: 7,
    waitingCount: 0,
  },
  "Execution packet manifest summary should mark the copy gate as operator review when every item is ready",
);

assert.equal(
  formatSupabaseImportExecutionPacketCopyGateLabel(
    "operator review required",
  ),
  "operator review 필요",
  "Execution packet copy gate display label should localize ready state for the UI",
);

assert.deepEqual(
  normalizePlain(
    getSupabaseImportExecutionPacketCopyActionStatuses(readyManifestItems).map(
      (item) => ({
        action: item.action,
        detail: item.detail,
        label: item.label,
        ready: item.ready,
      }),
    ),
  ),
  [
    {
      action:
        "대기 항목이 바뀌면 다시 복사해 operator note를 갱신하세요.",
      detail: "첫 대기 항목과 다음 조치를 복사할 수 있습니다.",
      label: "Next action",
      ready: true,
    },
    {
      action: "manifest를 복사해 실행 패킷 검토 기록에 첨부하세요.",
      detail: "현재 preflight scope로 manifest를 복사할 수 있습니다.",
      label: "Manifest",
      ready: true,
    },
    {
      action:
        "controlled packet을 복사하기 전에 operator review를 완료하세요.",
      detail:
        "runtime readiness가 포함된 controlled packet을 복사할 수 있습니다.",
      label: "Controlled packet",
      ready: true,
    },
  ],
  "Execution packet copy actions should all become ready when manifest items are ready",
);

const readyManifestText = buildSupabaseImportExecutionPacketManifestText({
  backupFingerprint: "backup:ready",
  checkedAt: "2026-06-19T00:00:00.000Z",
  items: readyManifestItems,
  ownerUserId: "owner-ready",
  preflightCheckedAt: "2026-06-19T00:00:00.000Z",
  workspaceId: "workspace-ready",
});

assert.match(
  readyManifestText,
  /- ready: 7\/7/,
  "Ready execution packet manifest text should show every manifest item as ready",
);
assert.match(
  readyManifestText,
  /- waitingItems: 0[\s\S]*- copyGate: operator review required/,
  "Ready execution packet manifest text should include the operator-review copy gate summary",
);
assert.match(
  readyManifestText,
  /## Waiting items\n- none/,
  "Ready execution packet manifest text should show no waiting items",
);
assert.match(
  readyManifestText,
  /Controlled packet: runtime readiness가 포함된 controlled packet을 복사할 수 있습니다\. Next: controlled packet을 복사하기 전에 operator review를 완료하세요\./,
  "Ready execution packet manifest text should keep operator review guidance for the controlled packet",
);

const readyNextActionText = buildSupabaseImportExecutionPacketNextActionText({
  backupFingerprint: "backup:ready",
  checkedAt: "2026-06-19T00:00:00.000Z",
  items: readyManifestItems,
  ownerUserId: "owner-ready",
  preflightCheckedAt: "2026-06-19T00:00:00.000Z",
  workspaceId: "workspace-ready",
});

assert.match(
  readyNextActionText,
  /waitingItem: none/,
  "Ready execution packet next-action text should show no waiting item",
);
assert.match(
  readyNextActionText,
  /waitingDetail: none/,
  "Ready execution packet next-action text should show no waiting detail",
);
assert.match(
  readyNextActionText,
  /- waitingItems: 0[\s\S]*- copyGate: operator review required/,
  "Ready execution packet next-action text should include the operator-review copy gate summary",
);
assert.match(
  readyNextActionText,
  /All manifest items are ready/,
  "Ready execution packet next-action text should direct the operator to copy the controlled packet",
);

assertFileIncludes(
  readme,
  "manifest 복사, 다음 조치 단독 복사",
  "README should document the Data execution packet manifest and next-action copy actions",
);
assertFileIncludes(
  readme,
  "`waitingItems`는 아직 해결되지 않은 manifest 항목 수",
  "README should explain the execution packet manifest waitingItems field",
);
assertFileIncludes(
  readme,
  "`copyGate`는 `resolve waiting items` 또는 `operator review required`",
  "README should explain the execution packet manifest copyGate field",
);
assertFileIncludes(
  readme,
  "Data 상단 운영 흐름은 백업, 데이터 준비도, 문서/RAG, Supabase 전환 gate를 먼저 보여주고 백업 생성과 각 상세 섹션 이동을 안전한 순서로 분리합니다.",
  "README should document the Data operating flow summary",
);
assertFileIncludes(
  readme,
  "Data 안전 실행 순서는 `01 백업 고정`, `02 준비도 확인`, `03 실행 분리` 단계 카드로 백업 최신 여부, 데이터/runtime readiness, execute=false preflight와 execution packet 분리를 먼저 보여줍니다.",
  "README should document the numbered Data safety workflow cards",
);
assertFileIncludes(
  readme,
  "Data 워크스페이스 스냅샷 수량과 문서/RAG 핵심 상태는 모바일 2열과 데스크톱 4열로 압축해 로컬 데이터와 RAG 준비 상태를 짧게 훑게 합니다.",
  "README should document responsive Data snapshot and document RAG metrics",
);
assertFileIncludes(
  readme,
  "Data 운영 환경 readiness와 Supabase 실행 패킷의 핵심 gate 상태는 모바일 2열 요약으로 먼저 보여주고, 상세 체크리스트와 복사 액션은 그대로 분리합니다.",
  "README should document responsive Data runtime and execution packet gate metrics",
);
assertFileIncludes(
  readme,
  "Data 가져오기 검증, 복원 리포트, Supabase 매핑, 체크리스트, dry-run, pending ID 치환 요약은 모바일 2열로 먼저 보여주고 상세 테이블과 실행 gate는 별도로 유지합니다.",
  "README should document responsive Data import and migration metrics",
);
assertFileIncludes(
  readme,
  "Data post-import 검증 SQL, 관계 검증, pending ID audit, RLS audit/policy/smoke, 검증 리포트, migration handoff 요약은 모바일 2열로 먼저 보여주고 SQL/체크리스트/패키지 원문은 별도 preview로 유지합니다.",
  "README should document responsive Data post-import and RLS verification metrics",
);
assertFileIncludes(
  prd,
  "Data 워크스페이스 스냅샷 수량과 문서/RAG 핵심 상태는 모바일 2열과 데스크톱 4열로 압축해 로컬 데이터와 RAG 준비 상태를 짧게 훑게 해야 한다.",
  "PRD should document responsive Data snapshot and document RAG metrics",
);
assertFileIncludes(
  prd,
  "Data 안전 실행 순서는 `01 백업 고정`, `02 준비도 확인`, `03 실행 분리` 단계 카드로 백업 최신 여부, 데이터/runtime readiness, execute=false preflight와 execution packet 분리를 먼저 보여줘야 한다.",
  "PRD should document the numbered Data safety workflow cards",
);
assertFileIncludes(
  prd,
  "Data 운영 환경 readiness와 Supabase 실행 패킷의 핵심 gate 상태는 모바일 2열 요약으로 먼저 보여주고, 상세 체크리스트와 복사 액션은 그대로 분리해야 한다.",
  "PRD should document responsive Data runtime and execution packet gate metrics",
);
assertFileIncludes(
  prd,
  "Data 가져오기 검증, 복원 리포트, Supabase 매핑, 체크리스트, dry-run, pending ID 치환 요약은 모바일 2열로 먼저 보여주고 상세 테이블과 실행 gate는 별도로 유지해야 한다.",
  "PRD should document responsive Data import and migration metrics",
);
assertFileIncludes(
  prd,
  "Data post-import 검증 SQL, 관계 검증, pending ID audit, RLS audit/policy/smoke, 검증 리포트, migration handoff 요약은 모바일 2열로 먼저 보여주고 SQL/체크리스트/패키지 원문은 별도 preview로 유지해야 한다.",
  "PRD should document responsive Data post-import and RLS verification metrics",
);
assertFileIncludes(
  developmentBrief,
  "Data 워크스페이스 스냅샷 수량과 문서/RAG 핵심 상태는 모바일 2열과 데스크톱 4열로 압축해 로컬 데이터와 RAG 준비 상태를 짧게 훑게 한다",
  "Development brief should document responsive Data snapshot and document RAG metrics",
);
assertFileIncludes(
  developmentBrief,
  "Data 안전 실행 순서는 `01 백업 고정`, `02 준비도 확인`, `03 실행 분리` 단계 카드로 백업 최신 여부, 데이터/runtime readiness, execute=false preflight와 execution packet 분리를 먼저 보여준다",
  "Development brief should document the numbered Data safety workflow cards",
);
assertFileIncludes(
  developmentBrief,
  "Data 운영 환경 readiness와 Supabase 실행 패킷의 핵심 gate 상태는 모바일 2열 요약으로 먼저 보여주고, 상세 체크리스트와 복사 액션은 그대로 분리한다",
  "Development brief should document responsive Data runtime and execution packet gate metrics",
);
assertFileIncludes(
  developmentBrief,
  "Data 가져오기 검증, 복원 리포트, Supabase 매핑, 체크리스트, dry-run, pending ID 치환 요약은 모바일 2열로 먼저 보여주고 상세 테이블과 실행 gate는 별도로 유지한다",
  "Development brief should document responsive Data import and migration metrics",
);
assertFileIncludes(
  developmentBrief,
  "Data post-import 검증 SQL, 관계 검증, pending ID audit, RLS audit/policy/smoke, 검증 리포트, migration handoff 요약은 모바일 2열로 먼저 보여주고 SQL/체크리스트/패키지 원문은 별도 preview로 유지한다",
  "Development brief should document responsive Data post-import and RLS verification metrics",
);
assertFileIncludes(
  readme,
  "Data 문서/RAG 준비도",
  "README should document the Data document RAG readiness surface",
);
assertFileIncludes(
  readme,
  "workspace scope, server-side embedding, source ID/chunk index citation",
  "README should document the document RAG upload safety and citation gates",
);
assertFileIncludes(
  readme,
  "local-only ingestion packet",
  "README should document the local-only document RAG ingestion packet",
);
assertFileIncludes(
  readme,
  "`data-document-rag` Studio 초안",
  "README should document the Data document RAG Studio draft source",
);
assertFileIncludes(
  readme,
  "Studio 초안은 `Data 문서/RAG로 돌아가기` 복귀 액션 라벨로 `/data` 원본 경로를 복원합니다.",
  "README should document the Data document RAG Studio source return action label",
);
assertFileIncludes(
  readme,
  "전송 준비 요약에서 프롬프트 언어 자동 판단",
  "README should document the Data document RAG Studio handoff readiness summary",
);
assertFileIncludes(
  readme,
  "저장이 실패하면 이동하지 않고 문서/RAG Studio 원문을 수동 복사용 textarea로 표시",
  "README should document the Data document RAG Studio draft return action and fallback",
);
assertFileNotIncludes(
  readme,
  "Studio 초안 저장이 실패하면 이동하지 않고 문서/RAG Studio 원문을 수동 복사용 textarea로 표시",
  "README should not keep the Data document RAG fallback-only Studio draft wording",
);
assertFileIncludes(
  prd,
  "문서/RAG chunk 맥락을 `data-document-rag` Studio 초안으로 보낼 때 Studio 복귀 액션 라벨은 `Data 문서/RAG로 돌아가기`로 표시하고 원본 경로는 `/data`로 돌아가야 하며, 초안 저장이 실패하면 이동하지 않고 문서/RAG Studio 원문을 수동 복사용 textarea로 표시해야 한다.",
  "PRD should document the Data document RAG Studio draft return action and fallback",
);
assertFileNotIncludes(
  prd,
  "문서/RAG chunk 맥락을 `data-document-rag` Studio 초안으로 보낼 때 초안 저장이 실패하면 이동하지 않고 문서/RAG Studio 원문을 수동 복사용 textarea로 표시해야 한다.",
  "PRD should not keep the Data document RAG fallback-only Studio draft wording",
);
assertFileIncludes(
  developmentBrief,
  "Data 문서/RAG Studio 초안은 복귀 액션 라벨을 `Data 문서/RAG로 돌아가기`로 표시하고 원본 경로를 `/data`로 저장하며, 초안 저장이 실패하면 이동하지 않고 문서/RAG Studio 원문을 수동 복사용 textarea로 표시한다",
  "Development brief should document the Data document RAG Studio draft return action and fallback",
);
assertFileNotIncludes(
  developmentBrief,
  "Data 문서/RAG Studio 초안 저장이 실패하면 이동하지 않고 문서/RAG Studio 원문을 수동 복사용 textarea로 표시한다",
  "Development brief should not keep the Data document RAG fallback-only Studio draft wording",
);
assertFileIncludes(
  storageArchitecture,
  "`waitingItems` as the\nnumber of unresolved manifest items",
  "Storage architecture should explain the execution packet manifest waitingItems field",
);
assertFileIncludes(
  storageArchitecture,
  "`copyGate` as either\n`resolve waiting items` or `operator review required`",
  "Storage architecture should explain the execution packet manifest copyGate field",
);
assertFileIncludes(
  storageArchitecture,
  "the generated execution plan has no validation blockers",
  "Storage architecture should document the Supabase import execution validation gate",
);
assertFileIncludes(
  storageArchitecture,
  "The `/data` screen now exposes document/RAG readiness before upload execution\nexists.",
  "Storage architecture should document the document RAG readiness boundary",
);
assertFileIncludes(
  storageArchitecture,
  "retrieved prompt context must preserve source ID\nand chunk index citations",
  "Storage architecture should document document RAG citation preservation",
);
assertFileIncludes(
  storageArchitecture,
  "local-only chunk preview",
  "Storage architecture should document the document RAG local chunk preview boundary",
);
assertFileIncludes(
  storageArchitecture,
  "source name, text length, chunk count, chunk ranges, table\nwrite order, server-side embedding gate, and retrieval citation requirements",
  "Storage architecture should document the document RAG ingestion packet fields",
);
assertFileIncludes(
  storageArchitecture,
  "sent to Studio as a `data-document-rag` draft",
  "Storage architecture should document the Data document RAG Studio draft handoff",
);
assertFileIncludes(
  storageArchitecture,
  "Studio handoff readiness before navigation",
  "Storage architecture should document the Data document RAG Studio handoff readiness summary",
);
assertFileIncludes(
  storageArchitecture,
  "If draft storage is blocked, the panel stays\non `/data` and shows the document/RAG Studio prompt in the existing manual copy\ntextarea.",
  "Storage architecture should document the Data document RAG Studio draft fallback boundary",
);
assertFileIncludes(
  readme,
  "npm run verify:data-management",
  "README Scripts should document the data-management verification command",
);
assert.match(
  supabaseImportRouteSource,
  /if \(execute\) \{[\s\S]*?if \(!environmentStatus\.executionEnabled\) \{[\s\S]*?status: "execution-disabled"[\s\S]*?\{ status: 403 \}[\s\S]*?if \(body\.confirmation !== SUPABASE_IMPORT_CONFIRMATION\) \{[\s\S]*?status: "confirmation-required"[\s\S]*?\{ status: 400 \}[\s\S]*?if \([\s\S]*?!environmentStatus\.supabaseUrlConfigured[\s\S]*?!environmentStatus\.serviceRoleKeyConfigured[\s\S]*?\) \{[\s\S]*?status: "environment-incomplete"[\s\S]*?\{ status: 503 \}[\s\S]*?if \(!validation\.ok\) \{[\s\S]*?status: "validation-blocked"[\s\S]*?\{ status: 422 \}[\s\S]*?createSupabaseRestImportAdapter[\s\S]*?runSupabaseImportExecutionPlan/,
  "Supabase import route should check execution enabled, confirmation, env readiness, and validation before constructing the write adapter",
);
assert.match(
  supabaseImportRouteSource,
  /status: "environment-incomplete"[\s\S]*?requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION[\s\S]*?validation/,
  "Supabase import route should return the required confirmation string with environment-incomplete execute responses",
);
assert.match(
  supabaseImportRouteSource,
  /status: "validation-blocked"[\s\S]*?requiredConfirmation: SUPABASE_IMPORT_CONFIRMATION[\s\S]*?validation/,
  "Supabase import route should return the required confirmation string with validation-blocked execute responses",
);
assert.match(
  supabaseImportRouteSource,
  /- executionEnabled: \$\{environment\.executionEnabled\}[\s\S]*?- supabaseUrlConfigured: \$\{environment\.supabaseUrlConfigured\}[\s\S]*?- serviceRoleKeyConfigured: \$\{environment\.serviceRoleKeyConfigured\}[\s\S]*?This artifact intentionally contains only configuration booleans/,
  "Supabase import route audit artifact should expose only gate booleans, not secret values",
);
assert.match(
  supabaseImportRouteSource,
  /## Execution result[\s\S]*result[\s\S]*status: \$\{result\.status\}[\s\S]*completedRows: \$\{result\.completedRows\}[\s\S]*totalRows: \$\{result\.totalRows\}[\s\S]*failedTable: \$\{result\.failedTable \|\| "none"\}[\s\S]*Table results[\s\S]*tableResult\.table[\s\S]*tableResult\.status[\s\S]*tableResult\.insertedRows[\s\S]*tableResult\.expectedRows/,
  "Supabase import route audit artifact should include execution result details when a write runs",
);
assert.match(
  supabaseImportRouteSource,
  /const result = await runSupabaseImportExecutionPlan\(plan, adapter\);[\s\S]*const resultSummary = \{[\s\S]*completedRows: result\.completedRows[\s\S]*failedTable: result\.failedTable[\s\S]*status: result\.status[\s\S]*tableResults: result\.tableResults[\s\S]*totalRows: result\.totalRows[\s\S]*return NextResponse\.json\(\{[\s\S]*auditArtifactText: buildSupabaseImportRouteAuditArtifactText\(\{[\s\S]*result: resultSummary[\s\S]*status: result\.status[\s\S]*environment: environmentStatus[\s\S]*result: resultSummary[\s\S]*status: result\.status[\s\S]*validation/,
  "Supabase import route should return the execute result summary and include the same result in the audit artifact",
);

let blockedPlanInsertCalls = 0;
const blockedPlanResult = await runSupabaseImportExecutionPlan(
  {
    archiveTraceFields: [],
    batches: [
      {
        dependency: "workspace",
        order: 1,
        rows: [
          {
            localId: "local-row",
            payload: { id: "pending-workspace", name: "Blocked workspace" },
            resolvedId: "pending-workspace",
            source: "test",
          },
        ],
        table: "workspaces",
      },
    ],
    generatedUuidCount: 0,
    ownerUserId: "not-a-uuid",
    totalRows: 1,
    unresolvedPendingReferences: ["pending-workspace"],
    uuidMap: {},
    workspaceId: "not-a-uuid",
  },
  {
    async insertRows() {
      blockedPlanInsertCalls += 1;

      return { insertedRows: 1 };
    },
  },
);

assert.deepEqual(
  {
    blockers: blockedPlanResult.blockers.length,
    completedRows: blockedPlanResult.completedRows,
    insertCalls: blockedPlanInsertCalls,
    status: blockedPlanResult.status,
    tableResults: blockedPlanResult.tableResults.length,
  },
  {
    blockers: 5,
    completedRows: 0,
    insertCalls: 0,
    status: "blocked",
    tableResults: 0,
  },
  "Supabase importer runner should stop before calling the insert adapter when validation has blockers",
);

const validWorkspaceId = "00000000-0000-4000-8000-000000000001";
const validOwnerUserId = "00000000-0000-4000-8000-000000000002";
const validPromptId = "00000000-0000-4000-8000-000000000003";
const validVersionId = "00000000-0000-4000-8000-000000000004";
const successfulPlanInsertCalls = [];
const successfulPlanResult = await runSupabaseImportExecutionPlan(
  {
    archiveTraceFields: [],
    batches: [
      {
        dependency: "workspace",
        order: 1,
        rows: [
          {
            localId: "workspace-local",
            payload: { id: validWorkspaceId, name: "Validated workspace" },
            resolvedId: validWorkspaceId,
            source: "test",
          },
        ],
        table: "workspaces",
      },
      {
        dependency: "prompt asset",
        order: 2,
        rows: [
          {
            localId: "prompt-local",
            payload: {
              id: validPromptId,
              title: "Validated prompt",
              workspace_id: validWorkspaceId,
            },
            resolvedId: validPromptId,
            source: "test",
          },
          {
            localId: "version-local",
            payload: {
              id: validVersionId,
              prompt_asset_id: validPromptId,
              workspace_id: validWorkspaceId,
            },
            resolvedId: validVersionId,
            source: "test",
          },
        ],
        table: "prompt_assets",
      },
    ],
    generatedUuidCount: 0,
    ownerUserId: validOwnerUserId,
    totalRows: 3,
    unresolvedPendingReferences: [],
    uuidMap: {},
    workspaceId: validWorkspaceId,
  },
  {
    async insertRows(request) {
      successfulPlanInsertCalls.push({
        order: request.order,
        rows: request.rows.length,
        table: request.table,
      });

      return { insertedRows: request.rows.length };
    },
  },
);

assert.deepEqual(
  normalizePlain({
    completedRows: successfulPlanResult.completedRows,
    insertCalls: successfulPlanInsertCalls,
    status: successfulPlanResult.status,
    tableResults: successfulPlanResult.tableResults.map((tableResult) => ({
      insertedRows: tableResult.insertedRows,
      order: tableResult.order,
      status: tableResult.status,
      table: tableResult.table,
    })),
  }),
  {
    completedRows: 3,
    insertCalls: [
      { order: 1, rows: 1, table: "workspaces" },
      { order: 2, rows: 2, table: "prompt_assets" },
    ],
    status: "completed",
    tableResults: [
      {
        insertedRows: 1,
        order: 1,
        status: "inserted",
        table: "workspaces",
      },
      {
        insertedRows: 2,
        order: 2,
        status: "inserted",
        table: "prompt_assets",
      },
    ],
  },
  "Supabase importer runner should call the insert adapter in order and record inserted row counts for valid plans",
);

const failedPlanInsertCalls = [];
const failedPlanResult = await runSupabaseImportExecutionPlan(
  {
    archiveTraceFields: [],
    batches: [
      {
        dependency: "workspace",
        order: 1,
        rows: [
          {
            localId: "workspace-local",
            payload: { id: validWorkspaceId, name: "Validated workspace" },
            resolvedId: validWorkspaceId,
            source: "test",
          },
        ],
        table: "workspaces",
      },
      {
        dependency: "prompt asset",
        order: 2,
        rows: [
          {
            localId: "prompt-local",
            payload: {
              id: validPromptId,
              title: "Validated prompt",
              workspace_id: validWorkspaceId,
            },
            resolvedId: validPromptId,
            source: "test",
          },
        ],
        table: "prompt_assets",
      },
      {
        dependency: "prompt version",
        order: 3,
        rows: [
          {
            localId: "version-local",
            payload: {
              id: validVersionId,
              prompt_asset_id: validPromptId,
              workspace_id: validWorkspaceId,
            },
            resolvedId: validVersionId,
            source: "test",
          },
        ],
        table: "prompt_versions",
      },
    ],
    generatedUuidCount: 0,
    ownerUserId: validOwnerUserId,
    totalRows: 3,
    unresolvedPendingReferences: [],
    uuidMap: {},
    workspaceId: validWorkspaceId,
  },
  {
    async insertRows(request) {
      failedPlanInsertCalls.push({
        order: request.order,
        rows: request.rows.length,
        table: request.table,
      });

      if (request.table === "prompt_assets") {
        throw new Error("Simulated insert failure");
      }

      return { insertedRows: request.rows.length };
    },
  },
);

assert.deepEqual(
  normalizePlain({
    completedRows: failedPlanResult.completedRows,
    failedTable: failedPlanResult.failedTable,
    insertCalls: failedPlanInsertCalls,
    status: failedPlanResult.status,
    tableResults: failedPlanResult.tableResults.map((tableResult) => ({
      insertedRows: tableResult.insertedRows,
      note: tableResult.note || "",
      order: tableResult.order,
      status: tableResult.status,
      table: tableResult.table,
    })),
  }),
  {
    completedRows: 1,
    failedTable: "prompt_assets",
    insertCalls: [
      { order: 1, rows: 1, table: "workspaces" },
      { order: 2, rows: 1, table: "prompt_assets" },
    ],
    status: "failed",
    tableResults: [
      {
        insertedRows: 1,
        note: "",
        order: 1,
        status: "inserted",
        table: "workspaces",
      },
      {
        insertedRows: 0,
        note: "Simulated insert failure",
        order: 2,
        status: "failed",
        table: "prompt_assets",
      },
    ],
  },
  "Supabase importer runner should stop at the first failed insert and keep the completed row count",
);

const mismatchedPlanInsertCalls = [];
const mismatchedPlanResult = await runSupabaseImportExecutionPlan(
  {
    archiveTraceFields: [],
    batches: [
      {
        dependency: "workspace",
        order: 1,
        rows: [
          {
            localId: "workspace-local",
            payload: { id: validWorkspaceId, name: "Validated workspace" },
            resolvedId: validWorkspaceId,
            source: "test",
          },
        ],
        table: "workspaces",
      },
      {
        dependency: "prompt asset",
        order: 2,
        rows: [
          {
            localId: "prompt-local",
            payload: {
              id: validPromptId,
              title: "Validated prompt",
              workspace_id: validWorkspaceId,
            },
            resolvedId: validPromptId,
            source: "test",
          },
          {
            localId: "version-local",
            payload: {
              id: validVersionId,
              prompt_asset_id: validPromptId,
              workspace_id: validWorkspaceId,
            },
            resolvedId: validVersionId,
            source: "test",
          },
        ],
        table: "prompt_assets",
      },
    ],
    generatedUuidCount: 0,
    ownerUserId: validOwnerUserId,
    totalRows: 3,
    unresolvedPendingReferences: [],
    uuidMap: {},
    workspaceId: validWorkspaceId,
  },
  {
    async insertRows(request) {
      mismatchedPlanInsertCalls.push({
        order: request.order,
        rows: request.rows.length,
        table: request.table,
      });

      if (request.table === "prompt_assets") {
        return { insertedRows: 1 };
      }

      return { insertedRows: request.rows.length };
    },
  },
);

assert.deepEqual(
  normalizePlain({
    completedRows: mismatchedPlanResult.completedRows,
    failedTable: mismatchedPlanResult.failedTable,
    insertCalls: mismatchedPlanInsertCalls,
    status: mismatchedPlanResult.status,
    tableResults: mismatchedPlanResult.tableResults.map((tableResult) => ({
      insertedRows: tableResult.insertedRows,
      note: tableResult.note || "",
      order: tableResult.order,
      status: tableResult.status,
      table: tableResult.table,
    })),
  }),
  {
    completedRows: 2,
    failedTable: "prompt_assets",
    insertCalls: [
      { order: 1, rows: 1, table: "workspaces" },
      { order: 2, rows: 2, table: "prompt_assets" },
    ],
    status: "failed",
    tableResults: [
      {
        insertedRows: 1,
        note: "",
        order: 1,
        status: "inserted",
        table: "workspaces",
      },
      {
        insertedRows: 1,
        note: "Inserted row count 1 did not match expected 2.",
        order: 2,
        status: "failed",
        table: "prompt_assets",
      },
    ],
  },
  "Supabase importer runner should fail when inserted row count differs from the requested row count",
);

assert.throws(
  () =>
    createSupabaseRestImportAdapter({
      serviceRoleKey: "",
      supabaseUrl: "https://example.supabase.co",
    }),
  /SUPABASE_SERVICE_ROLE_KEY is required/,
  "Supabase REST import adapter should require the server-only service role key",
);

assert.throws(
  () =>
    createSupabaseRestImportAdapter({
      serviceRoleKey: "service-role-key",
      supabaseUrl: "",
    }),
  /NEXT_PUBLIC_SUPABASE_URL is required/,
  "Supabase REST import adapter should require a Supabase URL",
);

const supabaseRestImportAdapter = createSupabaseRestImportAdapter({
  serviceRoleKey: "service-role-key",
  supabaseUrl: "https://example.supabase.co/",
});
const supabaseRestImportFetchCalls = [];
const supabaseRestImportHttpAdapter = createSupabaseRestImportAdapter({
  fetch: async (url, options) => {
    supabaseRestImportFetchCalls.push({
      body: options.body,
      headers: options.headers,
      method: options.method,
      url: String(url),
    });

    return {
      ok: true,
      status: 201,
      statusText: "Created",
      async text() {
        return "";
      },
    };
  },
  serviceRoleKey: "service-role-key",
  supabaseUrl: "https://example.supabase.co/",
});
const failedSupabaseRestImportHttpAdapter = createSupabaseRestImportAdapter({
  fetch: async () => ({
    ok: false,
    status: 500,
    statusText: "Server Error",
    async text() {
      return "db down";
    },
  }),
  serviceRoleKey: "service-role-key",
  supabaseUrl: "https://example.supabase.co/",
});

await assert.rejects(
  () =>
    supabaseRestImportAdapter.insertRows({
      dependency: "not allowed",
      order: 1,
      rows: [{ id: "row-1" }],
      table: "unexpected_table",
    }),
  /Import table is not allowed: unexpected_table/,
  "Supabase REST import adapter should reject tables outside the import allowlist before any request",
);

assert.deepEqual(
  normalizePlain(
    await supabaseRestImportAdapter.insertRows({
      dependency: "workspace",
      order: 1,
      rows: [],
      table: "workspaces",
    }),
  ),
  { insertedRows: 0, note: "No rows to insert." },
  "Supabase REST import adapter should skip empty insert batches without calling Supabase",
);

assert.deepEqual(
  normalizePlain(
    await supabaseRestImportHttpAdapter.insertRows({
      dependency: "prompt asset",
      order: 2,
      rows: [{ id: "row-1", title: "Validated prompt" }],
      table: "prompt_assets",
    }),
  ),
  {
    insertedRows: 1,
    note: "Inserted via Supabase REST into prompt_assets.",
  },
  "Supabase REST import adapter should report inserted row count after a successful REST request",
);

assert.deepEqual(
  normalizePlain(supabaseRestImportFetchCalls),
  [
    {
      body: JSON.stringify([{ id: "row-1", title: "Validated prompt" }]),
      headers: {
        apikey: "service-role-key",
        Authorization: "Bearer service-role-key",
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      method: "POST",
      url: "https://example.supabase.co/rest/v1/prompt_assets",
    },
  ],
  "Supabase REST import adapter should build the expected REST insert request without leaking writes outside the verifier stub",
);

await assert.rejects(
  () =>
    failedSupabaseRestImportHttpAdapter.insertRows({
      dependency: "prompt asset",
      order: 2,
      rows: [{ id: "row-1" }],
      table: "prompt_assets",
    }),
  /Supabase insert failed for prompt_assets: 500 Server Error \/ db down/,
  "Supabase REST import adapter should preserve Supabase failure status and body in the error message",
);

assert.deepEqual(
  normalizePlain(
    withSupabaseImportEnv({}, () => getSupabaseRestImportEnvironmentStatus()),
  ),
  {
    executionEnabled: false,
    serviceRoleKeyConfigured: false,
    supabaseUrlConfigured: false,
  },
  "Supabase REST import environment status should default every write gate to closed",
);

assert.deepEqual(
  normalizePlain(
    withSupabaseImportEnv(
      {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_IMPORT_EXECUTION_ENABLED: "true",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      },
      () => getSupabaseRestImportEnvironmentStatus(),
    ),
  ),
  {
    executionEnabled: true,
    serviceRoleKeyConfigured: true,
    supabaseUrlConfigured: true,
  },
  "Supabase REST import environment status should only open when explicit server-side gates are configured",
);

console.log(
  `Data management operations verification passed for ${copyDataTextCalls.length} copy actions with dedicated manual fallback builders.`,
);
