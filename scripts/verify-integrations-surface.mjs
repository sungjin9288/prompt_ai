import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadTypescriptModule } from "./lib/load-typescript-module.mjs";

const appShell = readFileSync("src/components/app-shell.tsx", "utf8");
const page = readFileSync("src/app/integrations/page.tsx", "utf8");
const route = readFileSync("src/app/api/integrations/refine/route.ts", "utf8");
const mcpFeedbackRoute = readFileSync(
  "src/app/api/integrations/mcp-feedback/route.ts",
  "utf8",
);
const refineContract = readFileSync("src/lib/integrations/refine.ts", "utf8");
const mcpFeedbackInbox = readFileSync(
  "src/lib/integrations/mcp-feedback-inbox.ts",
  "utf8",
);
const promptTypes = readFileSync("src/lib/prompt/types.ts", "utf8");
const sourceRegistry = readFileSync("src/lib/studio/source-registry.ts", "utf8");
const refineTester = readFileSync(
  "src/components/integrations/integration-refine-tester.tsx",
  "utf8",
);
const mcpFeedbackInboxPanel = readFileSync(
  "src/components/integrations/mcp-feedback-inbox-panel.tsx",
  "utf8",
);
const mcpConnectionPanel = readFileSync(
  "src/components/integrations/mcp-connection-panel.tsx",
  "utf8",
);
const connectionReadinessPanel = readFileSync(
  "src/components/integrations/connection-readiness-panel.tsx",
  "utf8",
);
const environmentPlaybookPanel = readFileSync(
  "src/components/integrations/environment-playbook-panel.tsx",
  "utf8",
);
const operatorNextActionsPanel = readFileSync(
  "src/components/integrations/operator-next-actions-panel.tsx",
  "utf8",
);
const externalAiOperatorGuidePanel = readFileSync(
  "src/components/integrations/external-ai-operator-guide-panel.tsx",
  "utf8",
);
const view = readFileSync(
  "src/components/integrations/integrations-view.tsx",
  "utf8",
);
const readme = readFileSync("README.md", "utf8");
const prd = readFileSync("docs/personalized-prompt-ai-prd.md", "utf8");
const developmentBrief = readFileSync(
  "docs/codex-development-brief.md",
  "utf8",
);
const externalAiOperatorGuide = readFileSync(
  "docs/external-ai-operator-guide.md",
  "utf8",
);
const chromeBackgroundJs = readFileSync("extensions/chrome/background.js", "utf8");
const chromeManifest = readFileSync("extensions/chrome/manifest.json", "utf8");
const chromePopupHtml = readFileSync("extensions/chrome/popup.html", "utf8");
const chromePopupCss = readFileSync("extensions/chrome/popup.css", "utf8");
const chromePopupJs = readFileSync("extensions/chrome/popup.js", "utf8");
const chromeReadme = readFileSync("extensions/chrome/README.md", "utf8");
const mcpBridge = readFileSync("mcp/prompt-ai-studio.mjs", "utf8");
const mcpReadme = readFileSync("mcp/README.md", "utf8");

function assertIncludes(source, text, message) {
  assert.ok(source.includes(text), message);
}

const {
  createIntegrationRefineResponse,
  parseIntegrationRefineRequest,
} = loadTypescriptModule("src/lib/integrations/refine.ts");
const {
  normalizeMcpFeedbackInboxLimit,
  parseMcpFeedbackInboxText,
} = loadTypescriptModule("src/lib/integrations/mcp-feedback-inbox.ts");

assert.match(
  appShell,
  /href: "\/integrations"[\s\S]*?label: "연결"[\s\S]*?nextAction: "외부 AI 전달"[\s\S]*?summary: "Chrome, MCP, Gen AI 환경 연결"/,
  "App navigation should expose the Integrations route with shell context",
);
assertIncludes(
  page,
  "IntegrationsView",
  "Integrations route should render the integrations view",
);
assertIncludes(
  view,
  "IntegrationRefineTester",
  "Integrations view should render the refine tester",
);
assertIncludes(
  view,
  "McpConnectionPanel",
  "Integrations view should render the MCP connection panel",
);
assertIncludes(
  view,
  "ConnectionReadinessPanel",
  "Integrations view should render the connection readiness panel",
);
assertIncludes(
  view,
  "McpFeedbackInboxPanel",
  "Integrations view should render the MCP feedback inbox panel",
);
assertIncludes(
  view,
  "Suspense",
  "Integrations view should wrap query-aware panels in Suspense",
);
assertIncludes(
  view,
  "McpFeedbackInboxFallback",
  "Integrations view should provide an MCP feedback inbox fallback",
);
assertIncludes(
  view,
  "EnvironmentPlaybookPanel",
  "Integrations view should render the environment playbook panel",
);
assertIncludes(
  view,
  "OperatorNextActionsPanel",
  "Integrations view should render the operator next actions panel",
);
assertIncludes(
  view,
  "ExternalAiOperatorGuidePanel",
  "Integrations view should render the external AI operator guide panel",
);

for (const requiredText of [
  "Integrations quick navigation",
  "QuickNavigation",
  "integrationQuickLinks",
  "빠른 이동",
  "description",
  "전체 운영 단계",
  "local refine 호출",
  "client config와 smoke",
  "환경별 install gate",
  "confirmSave 결과",
  "환경별 실행 책임",
  "오늘 실행 순서",
  "운영 가이드",
  "연결 실행 순서",
  "ContextOperatingFlow",
  "ContextOperatingFlowItem",
  "integrationExecutionStrip",
  "review-required handoff",
  "로컬 앱",
  "입력 수집",
  "증거 저장",
  "검토 전달",
  "피드백 저장",
  "준비도 확인",
  "Refine 테스트",
  "실행 가이드",
  "Feedback 확인",
  "localhost:3000",
  "source app",
  "local evidence",
  "GPT/Claude/Codex/Gemini",
  "MCP feedback",
  "dev server와 local refine API",
  "외부 AI 전달 전에 Chrome, MCP, Learning smoke evidence를 남깁니다.",
  "reviewRequired package를 사람이 확인",
  "confirmSave true인 실행 결과",
  "검증 게이트 요약",
  "GateSummaryPanel",
  "integrationGateSummary",
  "Local-first automation",
  "Evidence saved before delivery",
  "Review-required delivery",
  "Confirmed feedback save",
  "PROMPT_AI_STUDIO_URL and local refine API",
  "Chrome, MCP, and Learning smoke evidence files",
  "The operator saves local smoke evidence before any prompt package leaves the Studio workflow.",
  "reviewRequired handoff package",
  "confirmSave true",
  "Refine API 확인",
  "Smoke 증거 확인",
  "전달 책임 확인",
  "Feedback inbox 확인",
  "로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장",
  "OperatorNextActionsPanel",
  "ExternalAiOperatorGuidePanel",
  "ConnectionSurfaceSummaryPanel",
  "executionContractRows",
  "ExecutionContractDetail",
  "ExecutionContractMatrix",
  "연결 계약 매트릭스",
  'data-testid="integrations-execution-contract-matrix"',
  "선택 텍스트와 source URL",
  "대상 AI별 실행 프롬프트",
  "파일 범위, 검증 명령, 완료 기준",
  "save_execution_feedback으로 inbox/audit event 기록",
  "executionEvidenceRows",
  "ExecutionEvidenceChecklist",
  "실행 증거 체크",
  'data-testid="integrations-execution-evidence-checklist"',
  "local app과 refine API",
  "reviewRequired true, target handoff package",
  "03 증거 저장",
  "Chrome, MCP, Learning smoke evidence file",
  "copy-ready prompt, missing context review",
  "rating, result summary, inbox record",
  "smokeEvidenceRows",
  "SmokeEvidencePath",
  "Smoke 증거 경로",
  'data-testid="integrations-smoke-evidence-path"',
  "npm run smoke:mcp -- --out docs/evidence/mcp-bridge-smoke.md",
  "npm run smoke:chrome-extension -- --out docs/evidence/chrome-extension-smoke.md",
  "npm run smoke:learning-feedback -- --out docs/evidence/learning-feedback-smoke.md",
  "Learning smoke evidence",
  "Evidence",
  "Chrome, MCP, Learning smoke evidence",
  "외부 AI 전달 전 로컬 증거 저장",
  "ConnectionSurfacesPanel",
  "ConnectionSurfaceRow",
  "ConnectionSurfaceDetail",
  "AutomationPrinciplesPanel",
  "automationPrincipleRows",
  "AutomationPrincipleRow",
  "McpToolContractPanel",
  "RolloutOrderPanel",
  "운영 흐름",
  "integrationOperationFlow",
  'data-testid="integrations-operation-flow-cards"',
  "formatOperationStep",
  "OperationStepNumber",
  "OperationFlowCards",
  "OperationFlowTable",
  "detailHref",
  "detailLabel",
  "Capture",
  "Refine",
  "Deliver",
  "Feedback",
  "raw input, source app, target AI hint",
  "reviewRequired handoff package",
  "copy-ready prompt or Codex implementation brief",
  "rating, result summary, learning candidate",
  "confirmSave true일 때만 저장",
  "상세 이동",
  "#integrations-operation-flow",
  "#integrations-refine-tester",
  "#integrations-mcp-connection",
  "#integrations-readiness",
  "#integrations-environment-guide",
  "#integrations-feedback-inbox",
  "#integrations-operator-guide",
  'id="integrations-operation-flow"',
  'id="integrations-refine-tester"',
  'id="integrations-mcp-connection"',
  'id="integrations-readiness"',
  'id="integrations-feedback-inbox"',
  'id="integrations-environment-guide"',
  "scroll-mt-24",
  "Chrome",
  "ChatGPT / Claude / Gemini",
  "Codex",
  "MCP",
  "지원 환경 요약",
  'data-testid="integrations-surface-summary"',
  "입력 수집",
  "검토 전달",
  "개발 지시",
  "도구 호출",
  "선택 텍스트를 local refine API로 보냅니다.",
  "로컬 smoke evidence 저장 후 reviewRequired package만 붙여넣습니다.",
  "로컬 증거 저장과 붙여넣기 전 최종 리뷰",
  "파일 범위, 검증 명령, 완료 기준을 포함합니다.",
  "refine, context, handoff, feedback 도구를 연결합니다.",
  "Refine automatically, save evidence, deliver with review.",
  "English or Korean-English hybrid",
  "chrome-selection, mcp-refine, local-smoke-evidence, target-ai-handoff",
  "로컬 smoke evidence,",
  "refine_prompt",
  "get_context_profile",
  "create_handoff_package",
  "save_execution_feedback",
  "POST /api/integrations/refine",
  "extensions/chrome",
  "connectionSurfaces",
  "handoff surface",
  "Payload",
  "Gate",
  "mcpToolContracts",
  "McpToolContractDetail",
  "McpToolContractCard",
  "McpToolContractCards",
  'data-testid="mcp-tool-contract-cards"',
  "rolloutSteps",
  "Local smoke evidence before target AI handoff",
  "MCP 도구 계약",
  "출시 순서",
]) {
  assertIncludes(
    view,
    requiredText,
    `Integrations view should include ${requiredText}`,
  );
}

assert.match(
  view,
  /import \{[\s\S]*?ContextOperatingFlow[\s\S]*?type ContextOperatingFlowItem[\s\S]*?\} from "@\/components\/context\/context-operating-flow";/,
  "Integrations view should use the shared context operating flow component",
);
assert.match(
  view,
  /const integrationExecutionStrip: ContextOperatingFlowItem\[\] = \[[\s\S]*?actionLabel: "준비도 확인"[\s\S]*?href: "#integrations-readiness"[\s\S]*?label: "로컬 앱"[\s\S]*?step: "01"[\s\S]*?title: "localhost:3000"[\s\S]*?actionLabel: "Refine 테스트"[\s\S]*?href: "#integrations-refine-tester"[\s\S]*?title: "source app"[\s\S]*?actionLabel: "Smoke 증거 확인"[\s\S]*?href: "#integrations-smoke-evidence-path"[\s\S]*?label: "증거 저장"[\s\S]*?step: "03"[\s\S]*?title: "local evidence"[\s\S]*?actionLabel: "실행 가이드"[\s\S]*?href: "#integrations-environment-guide"[\s\S]*?step: "04"[\s\S]*?title: "GPT\/Claude\/Codex\/Gemini"[\s\S]*?actionLabel: "Feedback 확인"[\s\S]*?href: "#integrations-feedback-inbox"[\s\S]*?step: "05"[\s\S]*?title: "MCP feedback"/,
  "Integrations execution strip should map local app, capture, smoke evidence, review delivery, and feedback to shared operating-flow items",
);
assert.match(
  view,
  /<ContextOperatingFlow[\s\S]*?badge="review-required handoff"[\s\S]*?description="외부 AI 연결은 자동 정제와 사람 검토를 분리합니다\.[\s\S]*?items=\{integrationExecutionStrip\}[\s\S]*?testId="integrations-execution-flow"[\s\S]*?title="연결 실행 순서"/,
  "Integrations view should render the shared execution flow before quick navigation",
);
assert.match(
  view,
  /function QuickNavigation\(\)[\s\S]*?aria-label="Integrations quick navigation"[\s\S]*?integrationQuickLinks\.map[\s\S]*?link\.href[\s\S]*?link\.label[\s\S]*?link\.description[\s\S]*?<QuickNavigation \/>/,
  "Integrations quick navigation should render quick links through a dedicated component",
);
assert.match(
  view,
  /const connectionSurfaces = \[[\s\S]*?channel: "Chrome"[\s\S]*?href: "#integrations-refine-tester"[\s\S]*?status: "입력 수집"[\s\S]*?summary: "선택 텍스트를 local refine API로 보냅니다\."[\s\S]*?channel: "ChatGPT \/ Claude \/ Gemini"[\s\S]*?href: "#integrations-environment-guide"[\s\S]*?status: "검토 전달"[\s\S]*?channel: "Codex"[\s\S]*?href: "#integrations-operator-guide"[\s\S]*?status: "개발 지시"[\s\S]*?channel: "MCP"[\s\S]*?href: "#integrations-mcp-connection"[\s\S]*?status: "도구 호출"/,
  "Integrations connection surfaces should define top-level summary links for Chrome, external Gen AI, Codex, and MCP",
);
assert.match(
  view,
  /function ConnectionSurfaceSummaryPanel\(\)[\s\S]*?지원 환경 요약[\s\S]*?data-testid="integrations-surface-summary"[\s\S]*?connectionSurfaces\.map[\s\S]*?href=\{surface\.href\}[\s\S]*?surface\.channel[\s\S]*?surface\.status[\s\S]*?surface\.summary[\s\S]*?<ConnectionSurfaceSummaryPanel \/>/,
  "Integrations should render a compact support-environment summary before detailed navigation",
);
assert.match(
  view,
  /const executionContractRows = \[[\s\S]*?surface: "Chrome"[\s\S]*?capture: "선택 텍스트와 source URL"[\s\S]*?package: "reviewRequired handoff package"[\s\S]*?surface: "ChatGPT \/ Claude \/ Gemini"[\s\S]*?package: "대상 AI별 실행 프롬프트"[\s\S]*?surface: "Codex"[\s\S]*?package: "파일 범위, 검증 명령, 완료 기준"[\s\S]*?surface: "MCP"[\s\S]*?package: "refine_prompt 또는 create_handoff_package 결과"[\s\S]*?feedback: "save_execution_feedback으로 inbox\/audit event 기록"/,
  "Integrations execution contract matrix should define per-surface capture, package, review, and feedback contracts",
);
assert.match(
  view,
  /function ExecutionContractDetail[\s\S]*?label: string[\s\S]*?value: string[\s\S]*?<dt[\s\S]*?\{label\}[\s\S]*?<dd[\s\S]*?\{value\}[\s\S]*?function ExecutionContractMatrix\(\)[\s\S]*?연결 계약 매트릭스[\s\S]*?data-testid="integrations-execution-contract-matrix"[\s\S]*?executionContractRows\.map[\s\S]*?row\.surface[\s\S]*?<ExecutionContractDetail label="Capture" value=\{row\.capture\} \/>[\s\S]*?<ExecutionContractDetail label="Package" value=\{row\.package\} \/>[\s\S]*?<ExecutionContractDetail[\s\S]*?label="Review gate"[\s\S]*?value=\{row\.reviewGate\}[\s\S]*?<ExecutionContractDetail label="Feedback" value=\{row\.feedback\} \/>/,
  "Integrations execution contract matrix should render each surface with capture, package, review, and feedback details",
);
assert.match(
  view,
  /const executionEvidenceRows = \[[\s\S]*?label: "01 로컬 연결"[\s\S]*?localhost:3000, POST \/api\/integrations\/refine[\s\S]*?label: "02 정제 결과"[\s\S]*?reviewRequired true, target handoff package[\s\S]*?label: "03 증거 저장"[\s\S]*?Chrome, MCP, Learning smoke evidence file[\s\S]*?href: "#integrations-smoke-evidence-path"[\s\S]*?label: "04 전달 승인"[\s\S]*?copy-ready prompt, missing context review[\s\S]*?label: "05 피드백 증거"[\s\S]*?rating, result summary, inbox record/,
  "Integrations execution evidence checklist should define local, refine, smoke evidence, delivery, and feedback evidence gates",
);
assert.match(
  view,
  /function ExecutionEvidenceChecklist\(\)[\s\S]*?실행 증거 체크[\s\S]*?data-testid="integrations-execution-evidence-checklist"[\s\S]*?executionEvidenceRows\.map[\s\S]*?row\.label[\s\S]*?row\.action[\s\S]*?row\.evidence[\s\S]*?row\.href[\s\S]*?row\.linkLabel/,
  "Integrations execution evidence checklist should render actionable proof rows with detail links",
);
assert.match(
  view,
  /const smokeEvidenceRows = \[[\s\S]*?label: "MCP bridge"[\s\S]*?npm run smoke:mcp -- --out docs\/evidence\/mcp-bridge-smoke\.md[\s\S]*?tools\/list, refine_prompt, create_handoff_package, local evidence file[\s\S]*?result: "MCP smoke evidence"[\s\S]*?label: "Chrome popup"[\s\S]*?npm run smoke:chrome-extension -- --out docs\/evidence\/chrome-extension-smoke\.md[\s\S]*?manifest, local-only permissions, popup evidence fallback[\s\S]*?result: "Chrome smoke evidence"[\s\S]*?label: "Learning feedback"[\s\S]*?npm run smoke:learning-feedback -- --out docs\/evidence\/learning-feedback-smoke\.md[\s\S]*?low-confidence validation draft, Library filter, queue fallback[\s\S]*?\/learning\?review=low-confidence&q=feedback-improvement#learning-feedback-improvement-queue[\s\S]*?result: "Learning smoke evidence"/,
  "Integrations smoke evidence path should define MCP, Chrome, and Learning evidence output commands",
);
assert.match(
  view,
  /function SmokeEvidencePath\(\)[\s\S]*?Smoke 증거 경로[\s\S]*?data-testid="integrations-smoke-evidence-path"[\s\S]*?smokeEvidenceRows\.map[\s\S]*?href=\{row\.href\}[\s\S]*?row\.label[\s\S]*?row\.command[\s\S]*?row\.evidence[\s\S]*?row\.result/,
  "Integrations smoke evidence path should render command, evidence, result, and detail link for each smoke route",
);
assert.match(
  view,
  /function GateSummaryPanel\(\)[\s\S]*?className="grid grid-cols-2 gap-3 px-5 pb-5 md:grid-cols-4"[\s\S]*?data-testid="integrations-gate-summary-metrics"[\s\S]*?integrationGateSummary\.map[\s\S]*?gate\.label[\s\S]*?gate\.detail[\s\S]*?gate\.check[\s\S]*?gate\.href[\s\S]*?gate\.linkLabel[\s\S]*?<GateSummaryPanel \/>/,
  "Integrations gate summary should keep a compact two-column mobile grid and four-column desktop grid",
);
assert.match(
  view,
  /<ContextOperatingFlow[\s\S]*?<ConnectionSurfaceSummaryPanel \/>[\s\S]*?<ExecutionContractMatrix \/>[\s\S]*?<ExecutionEvidenceChecklist \/>[\s\S]*?<SmokeEvidencePath \/>[\s\S]*?<QuickNavigation \/>[\s\S]*?<GateSummaryPanel \/>/,
  "Integrations view should keep execution flow, support-environment summary, execution contract matrix, evidence checklist, smoke evidence path, quick navigation, and gate summary in reading order",
);
assert.match(
  view,
  /const integrationOperationFlow = \[[\s\S]*?phase: "Capture"[\s\S]*?phase: "Refine"[\s\S]*?artifact: "Chrome, MCP, Learning smoke evidence"[\s\S]*?detailHref: "#integrations-smoke-evidence-path"[\s\S]*?gate: "외부 AI 전달 전 로컬 증거 저장"[\s\S]*?phase: "Evidence"[\s\S]*?phase: "Deliver"[\s\S]*?phase: "Feedback"[\s\S]*?function OperationFlowCards\(\)[\s\S]*?className="grid gap-3 px-5 pb-4 md:grid-cols-2 xl:grid-cols-5"[\s\S]*?data-testid="integrations-operation-flow-cards"[\s\S]*?integrationOperationFlow\.map[\s\S]*?step\.phase[\s\S]*?step\.owner[\s\S]*?step\.artifact[\s\S]*?step\.gate[\s\S]*?step\.detailHref[\s\S]*?step\.detailLabel/,
  "Integrations operation flow should render readable cards for capture, refine, evidence, delivery, and feedback before the detailed wide table",
);
assert.match(
  view,
  /function OperationFlowTable\(\)[\s\S]*?<div className="overflow-x-auto">[\s\S]*?min-w-\[1180px\][\s\S]*?integrationOperationFlow\.map[\s\S]*?OperationStepNumber[\s\S]*?step\.phase[\s\S]*?step\.owner[\s\S]*?step\.artifact[\s\S]*?step\.gate[\s\S]*?step\.detailHref[\s\S]*?step\.detailLabel/,
  "Integrations operation flow table should keep the detailed wide comparison view",
);
assert.match(
  view,
  /<OperationFlowCards \/>[\s\S]*?<OperationFlowTable \/>/,
  "Integrations operation flow should show cards before the detailed table in the reading order",
);
assert.match(
  view,
  /function ConnectionSurfaceDetail[\s\S]*?label: string[\s\S]*?value: string[\s\S]*?<dt[\s\S]*?\{label\}[\s\S]*?<dd[\s\S]*?\{value\}[\s\S]*?function ConnectionSurfaceRow[\s\S]*?surface: ConnectionSurface[\s\S]*?surface\.channel[\s\S]*?surface\.role[\s\S]*?<ConnectionSurfaceDetail label="Payload" value=\{surface\.handoff\} \/>[\s\S]*?<ConnectionSurfaceDetail label="Gate" value=\{surface\.guard\} \/>[\s\S]*?function ConnectionSurfacesPanel\(\)[\s\S]*?connectionSurfaces\.map[\s\S]*?<ConnectionSurfaceRow key=\{surface\.channel\} surface=\{surface\} \/>[\s\S]*?<ConnectionSurfacesPanel \/>/,
  "Integrations view should render connection surfaces through dedicated row and detail components",
);
assert.match(
  view,
  /const automationPrincipleRows = \[[\s\S]*?label: "Refine API"[\s\S]*?POST \/api\/integrations\/refine[\s\S]*?label: "Chrome extension"[\s\S]*?extensions\/chrome[\s\S]*?label: "Context priority"[\s\S]*?company → user → learning → skill[\s\S]*?label: "Language strategy"[\s\S]*?English or Korean-English hybrid[\s\S]*?label: "Audit source"[\s\S]*?chrome-selection, mcp-refine, local-smoke-evidence, target-ai-handoff[\s\S]*?function AutomationPrincipleRow[\s\S]*?label: string[\s\S]*?value: string[\s\S]*?\{label\}[\s\S]*?\{value\}[\s\S]*?function AutomationPrinciplesPanel\(\)[\s\S]*?Refine automatically, save evidence, deliver with review\.[\s\S]*?로컬 smoke evidence[\s\S]*?automationPrincipleRows\.map[\s\S]*?<AutomationPrincipleRow[\s\S]*?label=\{row\.label\}[\s\S]*?value=\{row\.value\}[\s\S]*?<AutomationPrinciplesPanel \/>/,
  "Integrations view should render automation principles through a dedicated data list and row component",
);
assert.match(
  view,
  /function McpToolContractDetail[\s\S]*?label: string[\s\S]*?value: string[\s\S]*?<dt[\s\S]*?\{label\}[\s\S]*?<dd[\s\S]*?\{value\}[\s\S]*?function McpToolContractCard[\s\S]*?tool: \(typeof mcpToolContracts\)\[number\][\s\S]*?tool\.name[\s\S]*?<McpToolContractDetail label="Input" value=\{tool\.input\} \/>[\s\S]*?<McpToolContractDetail label="Output" value=\{tool\.output\} \/>[\s\S]*?function McpToolContractCards\(\)[\s\S]*?data-testid="mcp-tool-contract-cards"[\s\S]*?mcpToolContracts\.map[\s\S]*?<McpToolContractCard key=\{tool\.name\} tool=\{tool\} \/>/,
  "Integrations view should render MCP tool contracts through readable cards before the detailed table",
);
assert.match(
  view,
  /function McpToolContractPanel\(\)[\s\S]*?MCP 도구 계약[\s\S]*?<McpToolContractCards \/>[\s\S]*?min-w-\[680px\][\s\S]*?mcpToolContracts\.map[\s\S]*?tool\.name[\s\S]*?tool\.input[\s\S]*?tool\.output[\s\S]*?<McpToolContractPanel \/>/,
  "Integrations view should keep MCP tool contract cards before the detailed table",
);
assert.match(
  view,
  /const rolloutSteps = \[[\s\S]*?Chrome selection capture and Studio draft handoff[\s\S]*?Local smoke evidence before target AI handoff[\s\S]*?Target AI prompt package copy\/export contract[\s\S]*?function RolloutOrderPanel\(\)[\s\S]*?출시 순서[\s\S]*?rolloutSteps\.map[\s\S]*?String\(index \+ 1\)\.padStart\(2, "0"\)[\s\S]*?step[\s\S]*?<RolloutOrderPanel \/>/,
  "Integrations view should render rollout order with local smoke evidence before target AI handoff",
);
assert.match(
  view,
  /<ConnectionSurfacesPanel \/>[\s\S]*?<AutomationPrinciplesPanel \/>[\s\S]*?<McpToolContractPanel \/>[\s\S]*?<RolloutOrderPanel \/>/,
  "Integrations view should keep connection surfaces, principles, MCP contracts, and rollout order in reading order",
);

for (const requiredText of [
  '"use client"',
  "운영자 다음 조치",
  "지금 유저가 직접 확인해야 하는 설치, 연결, smoke evidence, 전달, 피드백 저장 순서를 먼저 고정합니다.",
  "operatorNextActions",
  "로컬 서버 유지",
  "연결 표면 1개 검증",
  "로컬 smoke evidence 저장",
  "외부 AI 전달 전 검토",
  "실행 결과 피드백 저장",
  "operatorTask",
  "completionGate",
  "내가 할 일",
  "완료 기준",
  "터미널에서 npm run dev를 유지하고 localhost:3000 접속을 확인합니다.",
  "브라우저에서 /integrations가 열리고 refine API tester가 응답합니다.",
  "Chrome extension 또는 MCP client 중 하나를 먼저 연결하고 smoke test를 실행합니다.",
  "Chrome handoff 또는 MCP refine_prompt 결과에 reviewRequired가 포함됩니다.",
  "외부 AI에 붙여넣기 전에 Chrome, MCP, Learning feedback smoke evidence 명령을 실행합니다.",
  "Chrome, MCP, Learning feedback smoke evidence 파일이 모두 생성됩니다.",
  "npm run smoke:chrome-extension -- --out docs/evidence/chrome-extension-smoke.md; npm run smoke:mcp -- --out docs/evidence/mcp-bridge-smoke.md; npm run smoke:learning-feedback -- --out docs/evidence/learning-feedback-smoke.md",
  "정제 결과를 그대로 자동 전송하지 않고, 복사 전에 최종 prompt package를 검토합니다.",
  "대상 AI, 언어 전략, 가정, 누락 맥락을 확인한 handoff package만 전달합니다.",
  "외부 AI 실행 결과를 요약하고, 저장 동의가 있을 때만 feedback inbox에 남깁니다.",
  "confirmSave true로 저장된 피드백이 Feedback inbox에서 조회됩니다.",
  "OperatorNextAction",
  "operatorActionSummaryItems",
  "buildOperatorNextActionChecklist",
  "buildOperatorNextActionsChecklist",
  "OperatorActionSummary",
  "OperatorActionToolbar",
  "OperatorActionDetail",
  "OperatorActionList",
  "OperatorManualCopyTextarea",
  "OperatorManualCopyNotice",
  'data-testid="operator-next-actions-summary"',
  'data-testid="operator-next-actions-toolbar"',
  'data-testid="operator-next-actions-list"',
  "현재 순서",
  "서버 유지 → 연결 1개 검증 → smoke evidence 저장 → 외부 AI 전달 → 피드백 저장",
  "첫 검증",
  "Chrome extension 또는 MCP client 중 하나만 먼저 연결",
  "전달 원칙",
  "smoke evidence 저장 후 reviewRequired package만 전달",
  "학습 루프",
  "confirmSave true일 때만 Feedback inbox에 저장",
  "# Prompt AI Studio Operator Next Action:",
  "# Prompt AI Studio Operator Next Actions",
  "Gate: local-first automation, smoke evidence saved, review-required external delivery, confirmed feedback save.",
  "Save local smoke evidence before external AI delivery.",
  "Detail link: /integrations",
  "Final review:",
  "다음 조치 복사",
  "다음 조치 Studio로",
  "조치 복사",
  "전체 다음 조치 복사",
  "전체 다음 조치 Studio로",
  "`${item.label} 조치 복사`",
  "`${item.label} Studio로`",
  "copyOperatorAction",
  "copyOperatorActions",
  "openOperatorActionInStudio",
  "openOperatorActionsInStudio",
  "copyTextToClipboard",
  "writeStudioDraft",
  "draftError",
  "Studio 초안을 저장하지 못했습니다. 아래 다음 조치 패키지를 직접 선택해 복사하세요.",
  'setCopyState("draftError")',
  "setManualCopyText(rawInput)",
  'source: "integrations-operations-checklist"',
  'router.push("/studio?draft=integrations-operations-checklist")',
  'sourceTitle: "Integrations 운영자 다음 조치"',
  "External AI integrations · single operator action",
  "Confirm this single operator action before moving to the next connection step.",
  "Do not send unreviewed content to an external AI account.",
  'sourceHref: "/integrations"',
  'targetModels: ["gpt", "claude", "codex", "gemini"]',
  "Operator next actions manual copy",
  "운영자 다음 조치 패키지를 복사했습니다.",
  "조치 패키지를 복사했습니다.",
  "아래 다음 조치 패키지를 직접 선택해 복사하세요.",
  "Keep the Studio dev server running before testing any external surface.",
  "Install one connection surface first, then run the matching smoke test.",
  "Save the local smoke evidence before any external AI delivery.",
  "Paste only the reviewed handoff package into GPT, Claude, Codex, or Gemini.",
  "Save execution feedback only after confirming the external AI result.",
  "#integrations-operation-flow",
  "#integrations-readiness",
  "#integrations-environment-guide",
  "#integrations-feedback-inbox",
]) {
  assertIncludes(
    operatorNextActionsPanel,
    requiredText,
    `Operator next actions panel should include ${requiredText}`,
  );
}

assert.match(
  operatorNextActionsPanel,
  /const operatorActionSummaryItems = \[[\s\S]*?label: "현재 순서"[\s\S]*?서버 유지 → 연결 1개 검증 → smoke evidence 저장 → 외부 AI 전달 → 피드백 저장[\s\S]*?label: "첫 검증"[\s\S]*?Chrome extension 또는 MCP client 중 하나만 먼저 연결[\s\S]*?label: "전달 원칙"[\s\S]*?smoke evidence 저장 후 reviewRequired package만 전달[\s\S]*?label: "학습 루프"[\s\S]*?confirmSave true일 때만 Feedback inbox에 저장/,
  "Operator next actions panel should define a compact summary before the detailed action list",
);
assert.match(
  operatorNextActionsPanel,
  /function OperatorActionSummary\(\)[\s\S]*?data-testid="operator-next-actions-summary"[\s\S]*?operatorActionSummaryItems\.map[\s\S]*?item\.label[\s\S]*?item\.value[\s\S]*?<OperatorActionSummary \/>/,
  "Operator next actions panel should render a compact summary from dedicated summary items",
);
assert.match(
  operatorNextActionsPanel,
  /function OperatorActionToolbar[\s\S]*?data-testid="operator-next-actions-toolbar"[\s\S]*?전체 다음 조치 복사[\s\S]*?onClick=\{onCopyAll\}[\s\S]*?다음 조치 복사[\s\S]*?전체 다음 조치 Studio로[\s\S]*?onClick=\{onOpenAllInStudio\}[\s\S]*?다음 조치 Studio로[\s\S]*?<OperatorActionToolbar[\s\S]*?onCopyAll=\{copyOperatorActions\}[\s\S]*?onOpenAllInStudio=\{openOperatorActionsInStudio\}/,
  "Operator next actions panel should render the whole-checklist actions through a dedicated toolbar",
);
assert.match(
  operatorNextActionsPanel,
  /function OperatorActionDetail[\s\S]*?label: string[\s\S]*?value: string[\s\S]*?<dt[\s\S]*?\{label\}[\s\S]*?<dd[\s\S]*?\{value\}/,
  "Operator next actions panel should render repeated detail cells through a dedicated detail component",
);
assert.match(
  operatorNextActionsPanel,
  /function OperatorActionList[\s\S]*?data-testid="operator-next-actions-list"[\s\S]*?operatorNextActions\.map[\s\S]*?item\.label[\s\S]*?item\.action[\s\S]*?<OperatorActionDetail[\s\S]*?label="내가 할 일"[\s\S]*?value=\{item\.operatorTask\}[\s\S]*?<OperatorActionDetail[\s\S]*?label="완료 기준"[\s\S]*?value=\{item\.completionGate\}[\s\S]*?<OperatorActionDetail label="Evidence" value=\{item\.evidence\} \/>[\s\S]*?href=\{item\.href\}[\s\S]*?onCopyAction\(item\)[\s\S]*?onOpenActionInStudio\(item\)[\s\S]*?<OperatorActionList[\s\S]*?onCopyAction=\{copyOperatorAction\}[\s\S]*?onOpenActionInStudio=\{openOperatorActionInStudio\}/,
  "Operator next actions panel should render operator steps through a dedicated list wired to copy and Studio actions",
);
assert.match(
  operatorNextActionsPanel,
  /function OperatorManualCopyTextarea[\s\S]*?value: string[\s\S]*?Operator next actions manual copy[\s\S]*?className=\{`\$\{textareaClass\} min-h-40 font-mono text-xs`\}[\s\S]*?readOnly[\s\S]*?value=\{value\}/,
  "Operator next actions panel should render manual fallback text through a dedicated textarea component",
);
assert.match(
  operatorNextActionsPanel,
  /function OperatorManualCopyNotice[\s\S]*?copyState === "idle"[\s\S]*?return null[\s\S]*?const isError = copyState === "error" \|\| copyState === "draftError"[\s\S]*?복사에 실패했습니다\. 아래 다음 조치 패키지를 직접 선택해 복사하세요\.[\s\S]*?Studio 초안을 저장하지 못했습니다\. 아래 다음 조치 패키지를 직접 선택해 복사하세요\.[\s\S]*?운영자 다음 조치 패키지를 복사했습니다\.[\s\S]*?isError \? "text-danger" : "text-accent"[\s\S]*?<OperatorManualCopyTextarea value=\{manualCopyText\} \/>[\s\S]*?<OperatorManualCopyNotice[\s\S]*?copyState=\{copyState\}[\s\S]*?manualCopyText=\{manualCopyText\}/,
  "Operator next actions panel should render copy status, draft fallback, and manual fallback through a dedicated notice",
);
assert.match(
  operatorNextActionsPanel,
  /function openOperatorActionsInStudio\(\)[\s\S]*?const rawInput = buildOperatorNextActionsChecklist\(\)[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "integrations-operations-checklist"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setCopyState\("draftError"\)[\s\S]*?setManualCopyText\(rawInput\)[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=integrations-operations-checklist"\)/,
  "Operator next actions panel should keep the whole next-actions checklist in manual fallback when Studio draft storage fails",
);
assert.match(
  operatorNextActionsPanel,
  /function openOperatorActionInStudio\(item: OperatorNextAction\)[\s\S]*?const rawInput = buildOperatorNextActionChecklist\(item\)[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "integrations-operations-checklist"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setCopyState\("draftError"\)[\s\S]*?setManualCopyText\(rawInput\)[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=integrations-operations-checklist"\)/,
  "Operator next actions panel should keep the single next-action checklist in manual fallback when Studio draft storage fails",
);
assert.match(
  operatorNextActionsPanel,
  /<OperatorActionSummary \/>[\s\S]*?<OperatorActionToolbar[\s\S]*?<OperatorActionList[\s\S]*?<OperatorManualCopyNotice/,
  "Operator next actions panel should keep summary, toolbar, action list, and copy fallback in reading order",
);

for (const requiredText of [
  '"use client"',
  "외부 AI 운영 가이드",
  "ExternalAiOperatorStep",
  "commands: string[]",
  "McpDefaultExample",
  "ExternalAiOperatorSummary",
  "TargetAiDeliveryRule",
  "ExternalAiEvidenceCheck",
  "targetAiDeliveryRules",
  "externalAiEvidenceChecks",
  "TargetAiDeliveryRuleCard",
  "TargetAiDeliveryRules",
  "ExternalAiEvidenceChecklist",
  "ExternalAiOperatorStepItem",
  "ExternalAiOperatorStepList",
  "ExternalAiOperatorGate",
  "McpDefaultExamples",
  "ExternalAiOperatorManualCopyTextarea",
  "ExternalAiOperatorCopyNotice",
  "externalAiOperatorSteps",
  "externalAiOperatorSummaryItems",
  'data-testid="external-ai-operator-summary"',
  'data-testid="external-ai-delivery-rules"',
  "운영 단계",
  "첫 실행",
  "전달 gate",
  "피드백 저장",
  "Target AI delivery rules",
  "general prompt package",
  "context-heavy prompt package",
  "implementation brief",
  "research and source package",
  "목표, 제약, 원하는 출력 형식을 확인합니다.",
  "긴 맥락과 판단 기준을 함께 전달합니다.",
  "파일 범위, 검증 명령, 완료 기준을 포함합니다.",
  "자료 비교, 멀티모달 힌트, 출처 맥락을 분리합니다.",
  "실행 증거 체크",
  "localhost:3000과 POST /api/integrations/refine 응답을 확인합니다.",
  "reviewRequired true와 target handoff package를 확인합니다.",
  "Chrome, MCP, Learning smoke evidence file을 먼저 남깁니다.",
  "copy-ready prompt와 missing context review를 확인한 뒤 붙여넣습니다.",
  "rating, result summary, inbox record를 confirmSave true 후 확인합니다.",
  "Execution evidence checklist",
  "Audit source order: chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff.",
  "Keep local-smoke-evidence before target-ai-handoff.",
  "mcpDefaultExamples",
  "buildExternalAiOperatorGuidePackage",
  "# Prompt AI Studio External AI Operator Guide",
  "로컬 앱 실행",
  "연결 표면 1개 선택",
  "review-required 결과 확인",
  "로컬 smoke evidence 저장",
  "npm run smoke:chrome-extension -- --out docs/evidence/chrome-extension-smoke.md",
  "npm run smoke:mcp -- --out docs/evidence/mcp-bridge-smoke.md",
  "npm run smoke:learning-feedback -- --out docs/evidence/learning-feedback-smoke.md",
  "외부 AI로 넘기기 전에 Chrome, MCP, Learning feedback 증거 파일을 남깁니다.",
  "외부 AI에 수동 전달",
  "실행 결과 저장 판단",
  "Gate: local-first automation, smoke evidence saved, review-required external delivery, confirmed feedback save.",
  "자동화는 정제까지, 외부 전달은 증거 저장 후 검토 복사.",
  "smoke evidence, handoff package, reviewRequired",
  "MCP 기본값 예시",
  "PROMPT_AI_STUDIO_TARGET_AI=codex",
  "PROMPT_AI_STUDIO_SOURCE_URL=mcp://codex",
  "운영 가이드 복사",
  "운영 가이드 Studio로",
  "외부 AI 운영 가이드 복사",
  "외부 AI 운영 가이드 Studio로",
  "copyOperatorGuide",
  "openOperatorGuideInStudio",
  "copyTextToClipboard",
  "writeStudioDraft",
  "draftError",
  "Studio 초안을 저장하지 못했습니다. 아래 운영 가이드를 직접 선택해 복사하세요.",
  'setCopyState("draftError")',
  "setManualCopyText(rawInput)",
  'source: "integrations-operations-checklist"',
  'router.push("/studio?draft=integrations-operations-checklist")',
  'sourceTitle: "Integrations 외부 AI 운영 가이드"',
  'sourceHref: "/integrations#integrations-operator-guide"',
  'targetModels: ["gpt", "claude", "codex", "gemini"]',
  "External AI operator guide manual copy",
  "외부 AI 운영 가이드를 복사했습니다.",
  "복사에 실패했습니다. 아래 운영 가이드를 직접 선택해 복사하세요.",
  'id="integrations-operator-guide"',
]) {
  assertIncludes(
    externalAiOperatorGuidePanel,
    requiredText,
    `External AI operator guide panel should include ${requiredText}`,
  );
}

assert.match(
  externalAiOperatorGuidePanel,
  /const externalAiOperatorSummaryItems = \[[\s\S]*?label: "운영 단계"[\s\S]*?externalAiOperatorSteps\.length[\s\S]*?label: "첫 실행"[\s\S]*?externalAiOperatorSteps\[0\]\.action[\s\S]*?label: "전달 gate"[\s\S]*?review-required[\s\S]*?label: "피드백 저장"[\s\S]*?confirmSave/,
  "External AI operator guide should derive step count, first run step, delivery gate, and feedback save gate",
);
assert.match(
  externalAiOperatorGuidePanel,
  /function ExternalAiOperatorSummary\(\)[\s\S]*?className="grid grid-cols-2 gap-2 border-b border-line px-5 py-4 xl:grid-cols-4"[\s\S]*?data-testid="external-ai-operator-summary"[\s\S]*?externalAiOperatorSummaryItems\.map[\s\S]*?break-words text-xs font-semibold text-soft[\s\S]*?<ExternalAiOperatorSummary \/>/,
  "External AI operator guide should render the operator summary as a compact two-column mobile grid",
);
assert.match(
  externalAiOperatorGuidePanel,
  /const targetAiDeliveryRules = \[[\s\S]*?general prompt package[\s\S]*?target: "GPT"[\s\S]*?context-heavy prompt package[\s\S]*?target: "Claude"[\s\S]*?implementation brief[\s\S]*?target: "Codex"[\s\S]*?research and source package[\s\S]*?target: "Gemini"[\s\S]*?\] satisfies TargetAiDeliveryRule\[\]/,
  "External AI operator guide should define target AI delivery rules for GPT, Claude, Codex, and Gemini",
);
assert.match(
  externalAiOperatorGuidePanel,
  /function TargetAiDeliveryRuleCard[\s\S]*?rule: TargetAiDeliveryRule[\s\S]*?rule\.target[\s\S]*?rule\.mode[\s\S]*?rule\.guard[\s\S]*?function TargetAiDeliveryRules\(\)[\s\S]*?data-testid="external-ai-delivery-rules"[\s\S]*?targetAiDeliveryRules\.map[\s\S]*?<TargetAiDeliveryRuleCard key=\{rule\.target\} rule=\{rule\} \/>[\s\S]*?<TargetAiDeliveryRules \/>/,
  "External AI operator guide should render target AI delivery rules through dedicated cards",
);
assert.match(
  externalAiOperatorGuidePanel,
  /"## Target AI delivery rules"[\s\S]*?targetAiDeliveryRules\.flatMap[\s\S]*?`### \$\{rule\.target\}`[\s\S]*?`- Mode: \$\{rule\.mode\}`[\s\S]*?`- Guard: \$\{rule\.guard\}`[\s\S]*?"## Execution evidence checklist"/,
  "External AI operator guide package should include target AI delivery rules before the operator steps",
);
assert.match(
  externalAiOperatorGuidePanel,
  /const externalAiEvidenceChecks = \[[\s\S]*?action: "localhost:3000과 POST \/api\/integrations\/refine 응답[\s\S]*?label: "01 로컬 연결"[\s\S]*?action: "reviewRequired true와 target handoff package[\s\S]*?label: "02 정제 결과"[\s\S]*?action: "Chrome, MCP, Learning smoke evidence file[\s\S]*?label: "03 증거 저장"[\s\S]*?action: "copy-ready prompt와 missing context review[\s\S]*?label: "04 전달 승인"[\s\S]*?action: "rating, result summary, inbox record[\s\S]*?label: "05 피드백 증거"[\s\S]*?\] satisfies ExternalAiEvidenceCheck\[\]/,
  "External AI operator guide should define execution evidence checks for local, refine, smoke evidence, delivery, and feedback proof",
);
assert.match(
  externalAiOperatorGuidePanel,
  /"## Execution evidence checklist"[\s\S]*?externalAiEvidenceChecks\.flatMap[\s\S]*?`### \$\{check\.label\}`[\s\S]*?`- Action: \$\{check\.action\}`[\s\S]*?`- Evidence: \$\{check\.evidence\}`[\s\S]*?Audit source order: chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff\.[\s\S]*?Keep local-smoke-evidence before target-ai-handoff\.[\s\S]*?"## 내가 할 일"/,
  "External AI operator guide package should include execution evidence checks and audit source order before operator steps",
);
assert.match(
  externalAiOperatorGuidePanel,
  /function ExternalAiEvidenceChecklist\(\)[\s\S]*?실행 증거 체크[\s\S]*?local-smoke-evidence가 target-ai-handoff보다[\s\S]*?externalAiEvidenceChecks\.map[\s\S]*?check\.label[\s\S]*?check\.action[\s\S]*?check\.evidence[\s\S]*?<ExternalAiEvidenceChecklist \/>/,
  "External AI operator guide should render execution evidence checks before the operator step list",
);
assert.match(
  externalAiOperatorGuidePanel,
  /function ExternalAiOperatorStepItem[\s\S]*?index: number[\s\S]*?step: ExternalAiOperatorStep[\s\S]*?String\(index \+ 1\)\.padStart\(2, "0"\)[\s\S]*?step\.action[\s\S]*?step\.commands\.map[\s\S]*?command[\s\S]*?step\.detail[\s\S]*?function ExternalAiOperatorStepList\(\)[\s\S]*?externalAiOperatorSteps\.map[\s\S]*?<ExternalAiOperatorStepItem[\s\S]*?index=\{index\}[\s\S]*?key=\{step\.action\}[\s\S]*?step=\{step\}[\s\S]*?<ExternalAiOperatorStepList \/>/,
  "External AI operator guide should render the execution steps through a dedicated step list",
);
assert.match(
  externalAiOperatorGuidePanel,
  /function ExternalAiOperatorGate\(\)[\s\S]*?Operator Gate[\s\S]*?자동화는 정제까지, 외부 전달은 증거 저장 후 검토 복사\.[\s\S]*?smoke evidence, handoff package, reviewRequired[\s\S]*?<ExternalAiOperatorGate \/>/,
  "External AI operator guide should render the operator gate through a dedicated component",
);
assert.match(
  externalAiOperatorGuidePanel,
  /function McpDefaultExamples\(\)[\s\S]*?MCP 기본값 예시[\s\S]*?mcpDefaultExamples\.map[\s\S]*?item\.surface[\s\S]*?item\.env[\s\S]*?<McpDefaultExamples \/>/,
  "External AI operator guide should render MCP defaults through a dedicated component",
);
assert.match(
  externalAiOperatorGuidePanel,
  /function ExternalAiOperatorManualCopyTextarea[\s\S]*?value: string[\s\S]*?External AI operator guide manual copy[\s\S]*?className=\{`\$\{textareaClass\} min-h-48 font-mono text-xs`\}[\s\S]*?readOnly[\s\S]*?value=\{value\}/,
  "External AI operator guide should render manual fallback text through a dedicated textarea component",
);
assert.match(
  externalAiOperatorGuidePanel,
  /function ExternalAiOperatorCopyNotice[\s\S]*?copyState === "idle"[\s\S]*?return null[\s\S]*?const isError = copyState === "error" \|\| copyState === "draftError"[\s\S]*?복사에 실패했습니다\. 아래 운영 가이드를 직접 선택해 복사하세요\.[\s\S]*?Studio 초안을 저장하지 못했습니다\. 아래 운영 가이드를 직접 선택해 복사하세요\.[\s\S]*?외부 AI 운영 가이드를 복사했습니다\.[\s\S]*?isError \? "text-danger" : "text-accent"[\s\S]*?<ExternalAiOperatorManualCopyTextarea value=\{manualCopyText\} \/>[\s\S]*?<ExternalAiOperatorCopyNotice[\s\S]*?copyState=\{copyState\}[\s\S]*?manualCopyText=\{manualCopyText\}/,
  "External AI operator guide should render copy status, draft fallback, and manual fallback through a dedicated notice",
);
assert.match(
  externalAiOperatorGuidePanel,
  /function openOperatorGuideInStudio\(\)[\s\S]*?const rawInput = buildExternalAiOperatorGuidePackage\(\)[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "integrations-operations-checklist"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setCopyState\("draftError"\)[\s\S]*?setManualCopyText\(rawInput\)[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=integrations-operations-checklist"\)/,
  "External AI operator guide should keep the operator guide in manual fallback when Studio draft storage fails",
);
assert.match(
  externalAiOperatorGuidePanel,
  /<ExternalAiOperatorSummary \/>[\s\S]*?<TargetAiDeliveryRules \/>[\s\S]*?<ExternalAiEvidenceChecklist \/>[\s\S]*?<ExternalAiOperatorStepList \/>[\s\S]*?<ExternalAiOperatorGate \/>[\s\S]*?<McpDefaultExamples \/>[\s\S]*?<ExternalAiOperatorCopyNotice/,
  "External AI operator guide should keep summary, target AI rules, evidence checks, steps, gate, MCP defaults, and copy notice in reading order",
);

for (const requiredText of [
  '"use client"',
  "환경별 실행 가이드",
  "environmentPlaybooks",
  "environmentSummaryItems",
  "environmentEvidenceTrace",
  "EnvironmentSummary",
  "EnvironmentPlaybookRow",
  "EnvironmentPlaybookTable",
  "EnvironmentManualCopyTextarea",
  "EnvironmentCopyNotice",
  'data-testid="environment-playbook-summary"',
  'data-testid="environment-playbook-cards"',
  "EnvironmentPlaybookCardDetail",
  "EnvironmentPlaybookCard",
  "EnvironmentPlaybookCards",
  "연결 환경",
  "운영 gate",
  "피드백 경로",
  "Chrome extension",
  "ChatGPT / Claude / Gemini",
  "Codex",
  "MCP client",
  "Connection mode",
  "connectionMode",
  "Local API capture → review-required handoff",
  "Copy-ready handoff, not direct account automation",
  "Scoped implementation brief with operator approval gates",
  "Direct local tool calls through the stdio MCP bridge",
  "Save local smoke evidence, then confirm sensitive text, missing context, and reviewRequired before copy.",
  "Check local smoke evidence, final prompt, answer language, assumptions, and reviewRequired before paste.",
  "Save local smoke evidence, then review files, checks, destructive commands, migrations, and external writes.",
  "Save local smoke evidence before delivery, then save execution feedback only with confirmSave: true after review.",
  "Operator check",
  "Target AI",
  "Action",
  "체크리스트 복사",
  "Studio로",
  "전체 체크리스트 복사",
  "전체 체크리스트 Studio로",
  "buildEnvironmentPlaybookChecklist",
  "buildAllEnvironmentPlaybookChecklist",
  "formatTargetModels",
  "copyAllPlaybookChecklists",
  "openAllPlaybookChecklistsInStudio",
  "openPlaybookChecklistInStudio",
  "copyChecklist",
  "copyPlaybookChecklist",
  "copyTextToClipboard",
  "writeStudioDraft",
  "draftError",
  "Studio 초안을 저장하지 못했습니다. 아래 체크리스트를 직접 선택해 복사하세요.",
  'setCopyState("draftError")',
  "setManualCopyText(rawInput)",
  'source: "integrations-operations-checklist"',
  'router.push("/studio?draft=integrations-operations-checklist")',
  'sourceHref: "/integrations#integrations-environment-guide"',
  'targetModels: ["gpt", "claude", "codex", "gemini"]',
  'targetModels: ["codex"]',
  "- Connection mode:",
  "- Target AI:",
  "formatTargetModels(playbook.targetModels)",
  "playbook.targetModels",
  "manualCopyText",
  "Environment checklist manual copy",
  "# Prompt AI Studio External AI Operations Checklist",
  "Final review:",
  "전체 운영 패키지",
  "아래 체크리스트를 직접 선택해 복사하세요.",
  "Gate: refine automatically, save local smoke evidence, deliver with review.",
  "Audit source order: chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff.",
  "Keep local-smoke-evidence before target-ai-handoff.",
  "- Save local smoke evidence before delivery.",
  "confirmSave: true",
]) {
  assertIncludes(
    environmentPlaybookPanel,
    requiredText,
    `Environment playbook panel should include ${requiredText}`,
  );
}

assert.match(
  environmentPlaybookPanel,
  /const environmentSummaryItems = \[[\s\S]*?label: "연결 환경"[\s\S]*?environmentPlaybooks\.length[\s\S]*?label: "대상 AI"[\s\S]*?GPT, Claude, Codex, Gemini[\s\S]*?label: "운영 gate"[\s\S]*?evidence \+ review-required[\s\S]*?label: "피드백 경로"[\s\S]*?confirmSave/,
  "Environment playbook panel should derive environment count, target AI coverage, review gate, and feedback path",
);
assert.match(
  environmentPlaybookPanel,
  /const environmentEvidenceTrace = \[[\s\S]*?Audit source order: chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff\.[\s\S]*?Keep local-smoke-evidence before target-ai-handoff\.[\s\S]*?\] satisfies string\[\]/,
  "Environment playbook panel should define a reusable evidence trace for copied checklists",
);
assert.match(
  environmentPlaybookPanel,
  /function buildEnvironmentPlaybookChecklist[\s\S]*?Gate: refine automatically, save local smoke evidence, deliver with review\.[\s\S]*?\.\.\.environmentEvidenceTrace[\s\S]*?function buildAllEnvironmentPlaybookChecklist[\s\S]*?Gate: refine automatically, save local smoke evidence, deliver with review\.[\s\S]*?Scope: Chrome extension, ChatGPT \/ Claude \/ Gemini, Codex, MCP client\.[\s\S]*?\.\.\.environmentEvidenceTrace/,
  "Environment playbook copied checklists should include the shared evidence trace after the delivery gate",
);
assert.match(
  environmentPlaybookPanel,
  /function EnvironmentSummary\(\)[\s\S]*?className="grid grid-cols-2 gap-2 border-b border-line px-5 py-4 xl:grid-cols-4"[\s\S]*?data-testid="environment-playbook-summary"[\s\S]*?environmentSummaryItems\.map[\s\S]*?break-words text-xs font-semibold text-soft[\s\S]*?<EnvironmentSummary \/>/,
  "Environment playbook panel should render the environment summary as a compact two-column mobile grid",
);
assert.match(
  environmentPlaybookPanel,
  /function EnvironmentPlaybookCardDetail[\s\S]*?label: string[\s\S]*?value: string[\s\S]*?<dt[\s\S]*?\{label\}[\s\S]*?<dd[\s\S]*?\{value\}[\s\S]*?function EnvironmentPlaybookCard[\s\S]*?playbook: EnvironmentPlaybook[\s\S]*?playbook\.environment[\s\S]*?playbook\.connectionMode[\s\S]*?formatTargetModels\(playbook\.targetModels\)[\s\S]*?<EnvironmentPlaybookCardDetail[\s\S]*?label="Trigger"[\s\S]*?value=\{playbook\.trigger\}[\s\S]*?<EnvironmentPlaybookCardDetail[\s\S]*?label="Operator check"[\s\S]*?value=\{playbook\.operatorCheck\}[\s\S]*?onCopy\(playbook\)[\s\S]*?onOpenInStudio\(playbook\)/,
  "Environment playbook panel should render each environment through a compact card with trigger, operator check, target AI, and actions",
);
assert.match(
  environmentPlaybookPanel,
  /function EnvironmentPlaybookCards[\s\S]*?data-testid="environment-playbook-cards"[\s\S]*?environmentPlaybooks\.map[\s\S]*?<EnvironmentPlaybookCard[\s\S]*?key=\{playbook\.environment\}[\s\S]*?onCopy=\{onCopy\}[\s\S]*?onOpenInStudio=\{onOpenInStudio\}[\s\S]*?playbook=\{playbook\}[\s\S]*?<EnvironmentPlaybookCards[\s\S]*?onCopy=\{copyPlaybookChecklist\}[\s\S]*?onOpenInStudio=\{openPlaybookChecklistInStudio\}/,
  "Environment playbook panel should show scannable environment cards before the wide table",
);
assert.match(
  environmentPlaybookPanel,
  /function EnvironmentPlaybookRow[\s\S]*?playbook: EnvironmentPlaybook[\s\S]*?playbook\.environment[\s\S]*?playbook\.connectionMode[\s\S]*?playbook\.trigger[\s\S]*?playbook\.action[\s\S]*?playbook\.output[\s\S]*?playbook\.operatorCheck[\s\S]*?formatTargetModels\(playbook\.targetModels\)[\s\S]*?onCopy\(playbook\)[\s\S]*?onOpenInStudio\(playbook\)[\s\S]*?function EnvironmentPlaybookTable[\s\S]*?min-w-\[1080px\][\s\S]*?environmentPlaybooks\.map[\s\S]*?<EnvironmentPlaybookRow[\s\S]*?onCopy=\{onCopy\}[\s\S]*?onOpenInStudio=\{onOpenInStudio\}[\s\S]*?playbook=\{playbook\}[\s\S]*?<EnvironmentPlaybookTable[\s\S]*?onCopy=\{copyPlaybookChecklist\}[\s\S]*?onOpenInStudio=\{openPlaybookChecklistInStudio\}/,
  "Environment playbook panel should render detailed environment rows through a dedicated table component",
);
assert.match(
  environmentPlaybookPanel,
  /function EnvironmentManualCopyTextarea[\s\S]*?value: string[\s\S]*?Environment checklist manual copy[\s\S]*?className=\{`\$\{textareaClass\} min-h-40 font-mono text-xs`\}[\s\S]*?readOnly[\s\S]*?value=\{value\}/,
  "Environment playbook panel should render manual fallback text through a dedicated textarea component",
);
assert.match(
  environmentPlaybookPanel,
  /function EnvironmentCopyNotice[\s\S]*?copyState === "idle"[\s\S]*?return null[\s\S]*?const isError = copyState === "error" \|\| copyState === "draftError"[\s\S]*?복사에 실패했습니다\. 아래 체크리스트를 직접 선택해 복사하세요\.[\s\S]*?Studio 초안을 저장하지 못했습니다\. 아래 체크리스트를 직접 선택해 복사하세요\.[\s\S]*?`\$\{copyState\} 체크리스트를 복사했습니다\.`[\s\S]*?isError \? "text-danger" : "text-accent"[\s\S]*?<EnvironmentManualCopyTextarea value=\{manualCopyText\} \/>[\s\S]*?<EnvironmentCopyNotice[\s\S]*?copyState=\{copyState\}[\s\S]*?manualCopyText=\{manualCopyText\}/,
  "Environment playbook panel should render copy status, draft fallback, and manual fallback through a dedicated notice",
);
assert.match(
  environmentPlaybookPanel,
  /function openAllPlaybookChecklistsInStudio\(\)[\s\S]*?const rawInput = buildAllEnvironmentPlaybookChecklist\(\)[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "integrations-operations-checklist"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setCopyState\("draftError"\)[\s\S]*?setManualCopyText\(rawInput\)[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=integrations-operations-checklist"\)/,
  "Environment playbook panel should keep the full environment checklist in manual fallback when Studio draft storage fails",
);
assert.match(
  environmentPlaybookPanel,
  /function openAllPlaybookChecklistsInStudio\(\)[\s\S]*?writeStudioDraft\(\{[\s\S]*?sourceTitle: "Integrations 전체 운영 체크리스트"[\s\S]*?sourceHref: "\/integrations#integrations-environment-guide"/,
  "Environment playbook full Studio draft should return to the environment guide anchor",
);
assert.match(
  environmentPlaybookPanel,
  /function openPlaybookChecklistInStudio[\s\S]*?const rawInput = buildEnvironmentPlaybookChecklist\(playbook\)[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "integrations-operations-checklist"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setCopyState\("draftError"\)[\s\S]*?setManualCopyText\(rawInput\)[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=integrations-operations-checklist"\)/,
  "Environment playbook panel should keep the single environment checklist in manual fallback when Studio draft storage fails",
);
assert.match(
  environmentPlaybookPanel,
  /function openPlaybookChecklistInStudio[\s\S]*?writeStudioDraft\(\{[\s\S]*?sourceTitle: `Integrations \$\{playbook\.environment\} 체크리스트`[\s\S]*?sourceHref: "\/integrations#integrations-environment-guide"/,
  "Environment playbook single Studio draft should return to the environment guide anchor",
);
assert.match(
  environmentPlaybookPanel,
  /<EnvironmentSummary \/>[\s\S]*?<EnvironmentPlaybookCards[\s\S]*?<EnvironmentPlaybookTable[\s\S]*?<EnvironmentCopyNotice/,
  "Environment playbook panel should keep summary, cards, table, and copy notice in reading order",
);

for (const requiredText of [
  '"use client"',
  "Refine API 테스트",
  "/api/integrations/refine",
  "payloadPreview",
  "SummaryItem",
  "RefineSelectOption",
  "RefineExecutionSummary",
  "RefineRequestMetrics",
  "HandoffReviewMetrics",
  "RefineActionBar",
  "RefineStatusNotice",
  "RefineSelectField",
  "RefineTextField",
  "RefineRawInputField",
  "RequestPayloadPreview",
  "HandoffPackagePreview",
  "integrationRefineExecutionItems",
  "requestSummaryItems",
  "handoffReviewItems",
  "handoffReviewChecklistItems",
  'data-testid="integrations-refine-execution-summary"',
  'data-testid="integrations-refine-request-metrics"',
  'data-testid="integrations-handoff-review-metrics"',
  'data-testid="integrations-handoff-review-checklist"',
  "수집 경로",
  "검토 gate",
  "전달 패키지",
  "복사 가능",
  "Review gate",
  "Target package",
  "Quality",
  "Language",
  "Before copy",
  "smoke evidence",
  "로컬 smoke evidence 저장 후 복사",
  "target package",
  "language strategy",
  "missing context",
  "확인 후 외부 AI에 붙여넣기",
  "handoff package 본문에서 누락 맥락을 확인",
  "Handoff package 복사",
  "copyTextToClipboard",
  "reviewRequired",
]) {
  assertIncludes(
    refineTester,
    requiredText,
    `Integrations refine tester should include ${requiredText}`,
  );
}

assert.match(
  refineTester,
  /const handoffReadyLabel = selectedPackage[\s\S]*?"복사 가능"[\s\S]*?result[\s\S]*?"패키지 없음"[\s\S]*?"실행 전"[\s\S]*?const integrationRefineExecutionItems = \[[\s\S]*?label: "수집 경로"[\s\S]*?sourceApp[\s\S]*?label: "대상 AI"[\s\S]*?targetAI[\s\S]*?label: "검토 gate"[\s\S]*?reviewRequired[\s\S]*?label: "전달 패키지"[\s\S]*?handoffReadyLabel/,
  "Integrations refine tester should derive source route, target AI, review gate, and handoff readiness before the action buttons",
);
assert.match(
  refineTester,
  /function RefineExecutionSummary[\s\S]*?className="grid grid-cols-2 gap-2 rounded-md border border-line bg-surface p-3 xl:grid-cols-4"[\s\S]*?data-testid="integrations-refine-execution-summary"[\s\S]*?items\.map[\s\S]*?break-words text-xs font-semibold text-soft[\s\S]*?<RefineExecutionSummary items=\{integrationRefineExecutionItems\} \/>/,
  "Integrations refine tester should render a compact execution summary above the refine action buttons",
);
assert.match(
  refineTester,
  /function RefineRequestMetrics[\s\S]*?className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="integrations-refine-request-metrics"[\s\S]*?items\.map[\s\S]*?break-words text-sm font-semibold[\s\S]*?requestSummaryItems = \[[\s\S]*?label: "Source app"[\s\S]*?label: "Target AI"[\s\S]*?label: "Domain"[\s\S]*?label: "Goal"[\s\S]*?<RequestPayloadPreview[\s\S]*?items=\{requestSummaryItems\}/,
  "Integrations refine tester should show request source, target, domain, and goal in a compact two-column mobile metrics grid",
);
assert.match(
  refineTester,
  /function HandoffReviewMetrics[\s\S]*?className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4"[\s\S]*?data-testid="integrations-handoff-review-metrics"[\s\S]*?items\.map[\s\S]*?break-words text-sm font-semibold[\s\S]*?handoffReviewItems = \[[\s\S]*?label: "Review gate"[\s\S]*?label: "Target package"[\s\S]*?label: "Quality"[\s\S]*?label: "Language"[\s\S]*?<HandoffPackagePreview[\s\S]*?items=\{handoffReviewItems\}/,
  "Integrations refine tester should show review gate, package, quality, and language in a compact two-column mobile metrics grid",
);
assert.match(
  refineTester,
  /function HandoffReviewChecklist[\s\S]*?data-testid="integrations-handoff-review-checklist"[\s\S]*?Before copy[\s\S]*?items\.map[\s\S]*?item\.label[\s\S]*?item\.value[\s\S]*?const handoffReviewChecklistItems = \[[\s\S]*?label: "smoke evidence"[\s\S]*?로컬 smoke evidence 저장 후 복사[\s\S]*?label: "reviewRequired"[\s\S]*?확인 후 외부 AI에 붙여넣기[\s\S]*?label: "target package"[\s\S]*?selectedPackage\?\.modelLabel[\s\S]*?label: "language strategy"[\s\S]*?result\?\.promptPackage\.languageStrategy[\s\S]*?label: "missing context"[\s\S]*?handoff package 본문에서 누락 맥락을 확인/,
  "Integrations refine tester should render a pre-copy review checklist for smoke evidence, reviewRequired, target package, language strategy, and missing context",
);
assert.match(
  refineTester,
  /<HandoffReviewMetrics items=\{items\} \/>[\s\S]*?<HandoffReviewChecklist items=\{checklistItems\} \/>[\s\S]*?<textarea/,
  "Integrations refine tester should show the pre-copy checklist between the review metrics and the handoff text",
);
assert.match(
  refineTester,
  /function RefineActionBar[\s\S]*?canCopy: boolean[\s\S]*?canRun: boolean[\s\S]*?status: RefineStatus[\s\S]*?disabled=\{status === "loading" \|\| !canRun\}[\s\S]*?Refine 실행[\s\S]*?disabled=\{!canCopy\}[\s\S]*?Handoff package 복사[\s\S]*?<RefineActionBar[\s\S]*?canCopy=\{Boolean\(selectedPackage\)\}[\s\S]*?canRun=\{Boolean\(rawInput\.trim\(\)\)\}[\s\S]*?onCopy=\{copyHandoffPackage\}[\s\S]*?onRun=\{refinePrompt\}[\s\S]*?status=\{status\}/,
  "Integrations refine tester should render refine and copy controls through a dedicated action bar",
);
assert.match(
  refineTester,
  /function RefineStatusNotice[\s\S]*?error: string[\s\S]*?status: RefineStatus[\s\S]*?text-sm text-danger[\s\S]*?status !== "copied"[\s\S]*?return null[\s\S]*?Handoff package를 복사했습니다\.[\s\S]*?<RefineStatusNotice error=\{error\} status=\{status\} \/>/,
  "Integrations refine tester should render error and copy status through a dedicated notice",
);
assert.match(
  refineTester,
  /type RefineSelectOption<TValue extends string>[\s\S]*?label: string[\s\S]*?value: TValue[\s\S]*?function RefineSelectField<TValue extends string>[\s\S]*?label: string[\s\S]*?onChange: \(value: TValue\) => void[\s\S]*?options: Array<RefineSelectOption<TValue>>[\s\S]*?value: TValue[\s\S]*?\{label\}[\s\S]*?onChange\(event\.target\.value as TValue\)[\s\S]*?options\.map/,
  "Integrations refine tester should render select inputs through a typed shared select field",
);
assert.match(
  refineTester,
  /<RefineSelectField[\s\S]*?label="Source app"[\s\S]*?onChange=\{setSourceApp\}[\s\S]*?options=\{sourceAppOptions\}[\s\S]*?value=\{sourceApp\}[\s\S]*?<RefineSelectField[\s\S]*?label="Target AI"[\s\S]*?onChange=\{setTargetAI\}[\s\S]*?options=\{targetAiOptions\}[\s\S]*?value=\{targetAI\}/,
  "Integrations refine tester should wire source app and target AI selects through the shared select field",
);
assert.match(
  refineTester,
  /function RefineTextField[\s\S]*?label: string[\s\S]*?onChange: \(value: string\) => void[\s\S]*?value: string[\s\S]*?\{label\}[\s\S]*?className=\{inputClass\}[\s\S]*?onChange\(event\.target\.value\)[\s\S]*?<RefineTextField[\s\S]*?label="Domain"[\s\S]*?onChange=\{setDomain\}[\s\S]*?value=\{domain\}[\s\S]*?<RefineTextField[\s\S]*?label="Goal"[\s\S]*?onChange=\{setGoal\}[\s\S]*?value=\{goal\}/,
  "Integrations refine tester should wire domain and goal through a shared text field",
);
assert.match(
  refineTester,
  /function RefineRawInputField[\s\S]*?onChange: \(value: string\) => void[\s\S]*?value: string[\s\S]*?Raw input[\s\S]*?className=\{`\$\{textareaClass\} min-h-40`\}[\s\S]*?onChange\(event\.target\.value\)[\s\S]*?<RefineRawInputField onChange=\{setRawInput\} value=\{rawInput\} \/>/,
  "Integrations refine tester should wire raw input through a dedicated textarea field",
);
assert.match(
  refineTester,
  /function RequestPayloadPreview[\s\S]*?payloadPreview: string[\s\S]*?Request payload[\s\S]*?<RefineRequestMetrics items=\{items\} \/>[\s\S]*?\{payloadPreview\}[\s\S]*?<RequestPayloadPreview[\s\S]*?items=\{requestSummaryItems\}[\s\S]*?payloadPreview=\{payloadPreview\}/,
  "Integrations refine tester should render request metrics and payload through a dedicated preview component",
);
assert.match(
  refineTester,
  /function HandoffPackagePreview[\s\S]*?checklistItems[\s\S]*?items[\s\S]*?result[\s\S]*?selectedPackage[\s\S]*?checklistItems: SummaryItem\[\][\s\S]*?result: RefineResponse \| null[\s\S]*?selectedPackage: HandoffPackage \| undefined[\s\S]*?Review required[\s\S]*?Not generated[\s\S]*?selectedPackage\.modelLabel[\s\S]*?selectedPackage\.qualityScore\.toFixed\(1\)[\s\S]*?<HandoffReviewMetrics items=\{items\} \/>[\s\S]*?<HandoffReviewChecklist items=\{checklistItems\} \/>[\s\S]*?selectedPackage\?\.handoffText[\s\S]*?<HandoffPackagePreview[\s\S]*?checklistItems=\{handoffReviewChecklistItems\}[\s\S]*?items=\{handoffReviewItems\}[\s\S]*?result=\{result\}[\s\S]*?selectedPackage=\{selectedPackage\}/,
  "Integrations refine tester should render review gate, package metadata, pre-copy checklist, and handoff text through a dedicated preview component",
);
assert.match(
  refineTester,
  /<RefineExecutionSummary items=\{integrationRefineExecutionItems\} \/>[\s\S]*?<RefineActionBar[\s\S]*?<RefineStatusNotice[\s\S]*?<RequestPayloadPreview[\s\S]*?<HandoffPackagePreview[\s\S]*?checklistItems=\{handoffReviewChecklistItems\}/,
  "Integrations refine tester should keep execution summary, actions, status, request preview, and handoff preview checklist in reading order",
);

for (const requiredText of [
  '"use client"',
  "MCP 연결 설정",
  "Claude, Codex, GPT 계열 MCP 클라이언트",
  "mcpConnectionSummaryItems",
  'data-testid="mcp-connection-summary"',
  "McpConnectionSummary",
  "mcpSetupWorkflowSteps",
  "McpSetupWorkflow",
  'data-testid="mcp-setup-workflow"',
  "01 로컬 준비",
  "02 클라이언트 연결",
  "03 검증과 학습",
  "local server + MCP bridge self-test",
  "shared config, target AI별 handoff contract",
  "reviewRequired smoke evidence + confirmed feedback",
  "McpSetupCommandBar",
  "McpClientConfigPanel",
  "McpSetupManualCopyTextarea",
  "McpSetupManualCopyNotice",
  "McpToolOverview",
  "McpOperatorChecklist",
  "McpEndToEndRunbookSection",
  "ClientExamplesSection",
  "ClientSmokePromptsSection",
  "SmokeFeedbackPayloadSection",
  'data-testid="mcp-setup-command-bar"',
  'data-testid="mcp-runbook-section"',
  'data-testid="mcp-client-examples-section"',
  'data-testid="mcp-smoke-prompts-section"',
  'data-testid="mcp-feedback-payload-section"',
  "대상 클라이언트",
  "공유 config",
  "첫 검증",
  "피드백 gate",
  "useRouter",
  "mcpServers",
  "prompt-ai-studio",
  "mcp/prompt-ai-studio.mjs",
  "PROMPT_AI_STUDIO_URL",
  "get_context_profile",
  "refine_prompt",
  "create_handoff_package",
  "save_execution_feedback",
  "MCP config 복사",
  "Self-test 명령 복사",
  "Dev server 명령 복사",
  "clientSetupExamples",
  "Client examples",
  "McpCardDetail",
  "ClientSetupCard",
  "ClientSetupCards",
  "ClientSetupTable",
  "FeedbackVerificationCard",
  "ClientSmokeTest",
  "SmokeFeedbackTemplate",
  "ClientSmokePromptRow",
  "ClientSmokePromptTable",
  "SmokeFeedbackPayloadRow",
  "SmokeFeedbackPayloadTable",
  "data-testid=\"mcp-client-setup-cards\"",
  "Claude",
  "Codex",
  "GPT-compatible MCP client",
  "Same MCP server config as GPT-compatible clients",
  "Any client that accepts an mcpServers entry",
  "Config scope",
  "Target AI",
  "Use case",
  "Operator gate",
  "설정 예시 복사",
  "buildClientSetupNote",
  "Shared MCP server config:",
  "Codex와 GPT-compatible MCP client는 같은 server config",
  "target AI별 handoff",
  "Repo-aware implementation briefs",
  "do not assume repo access or code execution",
  "clientSmokeTests",
  "Client smoke prompts",
  "Tool sequence",
  "Smoke prompt",
  "Acceptance",
  "테스트 프롬프트 복사",
  "buildClientSmokeTestPrompt",
  "Prompt AI Studio MCP Smoke Test:",
  "get_context_profile → refine_prompt",
  "get_context_profile → create_handoff_package",
  "MCP-enabled client",
  "reviewRequired",
  "destructive-command approval notes",
  "does not assume repo access",
  "smoke-prompt",
  "smokeFeedbackTemplates",
  "Smoke feedback payloads",
  "buildSmokeFeedbackPayload",
  "save_execution_feedback payload",
  "피드백 payload 복사",
  "feedback-payload",
  "confirmSave: false",
  "Set confirmSave to true only after the operator reviews the actual smoke result.",
  "mcp-smoke-",
  "reviewGate",
  "mcpSmokeRunbookSteps",
  "mcpEvidenceTrace",
  "mcpEvidenceTraceSummaryItems",
  "mcpFeedbackInboxApiChecks",
  "mcpFeedbackInboxCurlChecks",
  "mcpFeedbackInboxFilterLinks",
  "mcpFeedbackVerificationChecks",
  "FeedbackVerificationCards",
  "FeedbackVerificationTable",
  "data-testid=\"mcp-feedback-verification-cards\"",
  "End-to-end smoke runbook",
  "전체 runbook 복사",
  "Inbox API 복사",
  "Curl checks 복사",
  "Runbook Studio로",
  "Claude inbox",
  "Codex inbox",
  "GPT inbox",
  "Feedback verification matrix",
  "UI filter",
  "API endpoint",
  "Curl check",
  "Curl 복사",
  "openRunbookInStudio",
  "writeStudioDraft",
  "draftError",
  "Studio 초안을 저장하지 못했습니다. 아래 runbook을 직접 선택해 복사하세요.",
  'setCopyState("draftError")',
  "setManualCopyText(rawInput)",
  'source: "integrations-operations-checklist"',
  'sourceHref: "/integrations#integrations-mcp-connection"',
  'router.push("/studio?draft=integrations-operations-checklist")',
  "MCP end-to-end smoke 운영 개선 계획",
  "External AI integrations · MCP smoke runbook",
  "Integrations MCP end-to-end smoke runbook",
  "buildMcpEndToEndSmokeRunbook",
  "buildMcpFeedbackInboxApiCheckList",
  "buildMcpFeedbackInboxCurlCheckList",
  "Prompt AI Studio MCP End-to-End Smoke Runbook",
  "Audit source order: chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff.",
  "Keep local-smoke-evidence before target-ai-handoff.",
  "data-testid=\"mcp-runbook-evidence-trace-summary\"",
  "감사 출처",
  "증거 gate",
  "/api/integrations/mcp-feedback?targetAI=codex&rating=positive",
  'curl -sS "http://localhost:3000/api/integrations/mcp-feedback?limit=5&rating=positive&targetAI=codex"',
  "/integrations?mcpTargetAI=codex&mcpRating=positive",
  "Feedback inbox curl checks:",
  "Feedback inbox UI filters:",
  "feedback inbox API",
  "runbook",
  "inbox-api",
  "inbox-curl",
  "manualCopyText",
  "MCP setup manual copy",
  "아래 내용을 직접 선택해 복사하세요.",
  "textareaClass",
  "copyTextToClipboard",
  "review-required handoff package",
]) {
  assertIncludes(
    mcpConnectionPanel,
    requiredText,
    `MCP connection panel should include ${requiredText}`,
  );
}

assert.match(
  mcpConnectionPanel,
  /const mcpConnectionSummaryItems = \[[\s\S]*?label: "대상 클라이언트"[\s\S]*?clientSetupExamples\.length[\s\S]*?label: "공유 config"[\s\S]*?mcpServers[\s\S]*?label: "첫 검증"[\s\S]*?--self-test[\s\S]*?label: "피드백 gate"[\s\S]*?confirmSave/,
  "MCP connection panel should derive client count, shared config, self-test gate, and feedback gate",
);
assert.match(
  mcpConnectionPanel,
  /function McpConnectionSummary\(\)[\s\S]*?className="grid grid-cols-2 gap-2 border-b border-line px-5 py-4 xl:grid-cols-4"[\s\S]*?data-testid="mcp-connection-summary"[\s\S]*?mcpConnectionSummaryItems\.map[\s\S]*?break-words text-xs font-semibold text-soft[\s\S]*?<McpConnectionSummary \/>/,
  "MCP connection panel should render a compact two-column mobile setup summary through a dedicated component",
);
assert.match(
  mcpConnectionPanel,
  /const mcpSetupWorkflowSteps = \[[\s\S]*?local server \+ MCP bridge self-test[\s\S]*?label: "01 로컬 준비"[\s\S]*?shared config, target AI별 handoff contract[\s\S]*?label: "02 클라이언트 연결"[\s\S]*?reviewRequired smoke evidence \+ confirmed feedback[\s\S]*?label: "03 검증과 학습"/,
  "MCP connection panel should define a visible setup workflow for local setup, client config, and feedback verification",
);
assert.match(
  mcpConnectionPanel,
  /const mcpEvidenceTrace = \[[\s\S]*?Audit source order: chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff\.[\s\S]*?Keep local-smoke-evidence before target-ai-handoff\.[\s\S]*?\] satisfies string\[\]/,
  "MCP connection panel should define a reusable evidence trace for the end-to-end runbook",
);
assert.match(
  mcpConnectionPanel,
  /function buildMcpEndToEndSmokeRunbook\(\)[\s\S]*?Gate: local-first automation, smoke evidence saved, review-required external delivery, and confirmSave only after operator review\.[\s\S]*?\.\.\.mcpEvidenceTrace[\s\S]*?Steps:/,
  "MCP end-to-end smoke runbook should include the shared evidence trace before runbook steps",
);
assert.match(
  mcpConnectionPanel,
  /function openRunbookInStudio\(\)[\s\S]*?writeStudioDraft\(\{[\s\S]*?source: "integrations-operations-checklist"[\s\S]*?sourceTitle: "Integrations MCP end-to-end smoke runbook"[\s\S]*?sourceHref: "\/integrations#integrations-mcp-connection"[\s\S]*?router\.push\("\/studio\?draft=integrations-operations-checklist"\)/,
  "MCP runbook Studio draft should return to the MCP connection anchor",
);
assert.match(
  mcpConnectionPanel,
  /const mcpEvidenceTraceSummaryItems = \[[\s\S]*?label: "감사 출처"[\s\S]*?chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff[\s\S]*?label: "증거 gate"[\s\S]*?local-smoke-evidence before target-ai-handoff[\s\S]*?\] satisfies Array<\{ label: string; value: string \}>/,
  "MCP connection panel should define a visible evidence trace summary for the runbook section",
);
assert.match(
  mcpConnectionPanel,
  /function McpEndToEndRunbookSection[\s\S]*?data-testid="mcp-runbook-evidence-trace-summary"[\s\S]*?mcpEvidenceTraceSummaryItems\.map[\s\S]*?item\.label[\s\S]*?item\.value[\s\S]*?onCopy\(buildMcpEndToEndSmokeRunbook\(\), "runbook"\)/,
  "MCP runbook section should show the evidence trace summary before copy and Studio actions",
);
assert.match(
  mcpConnectionPanel,
  /function McpSetupWorkflow\(\)[\s\S]*?data-testid="mcp-setup-workflow"[\s\S]*?mcpSetupWorkflowSteps\.map[\s\S]*?step\.label[\s\S]*?step\.action[\s\S]*?step\.gate[\s\S]*?<McpSetupWorkflow \/>/,
  "MCP connection panel should render setup workflow cards before detailed client configuration",
);
assert.match(
  mcpConnectionPanel,
  /const mcpSelfTestCommand =[\s\S]*?"npm run smoke:mcp -- --out docs\/evidence\/mcp-bridge-smoke\.md";/,
  "MCP connection self-test command should save a local evidence packet",
);
assert.match(
  mcpConnectionPanel,
  /function McpSetupCommandBar[\s\S]*?data-testid="mcp-setup-command-bar"[\s\S]*?onCopy\(mcpConfigJson, "config"\)[\s\S]*?MCP config 복사[\s\S]*?onCopy\(mcpSelfTestCommand, "self-test"\)[\s\S]*?Self-test 명령 복사[\s\S]*?onCopy\(mcpDevCommand, "dev"\)[\s\S]*?Dev server 명령 복사[\s\S]*?<McpSetupCommandBar onCopy=\{copyValue\} \/>/,
  "MCP connection panel should render setup copy commands through a dedicated command bar",
);
assert.match(
  mcpConnectionPanel,
  /function McpClientConfigPanel\(\)[\s\S]*?Client config[\s\S]*?Codex와 GPT-compatible MCP client는 같은 server config[\s\S]*?target AI별 handoff contract[\s\S]*?mcpConfigJson[\s\S]*?<McpClientConfigPanel \/>/,
  "MCP connection panel should render shared client config through a dedicated component",
);
assert.match(
  mcpConnectionPanel,
  /function McpSetupManualCopyTextarea[\s\S]*?value: string[\s\S]*?MCP setup manual copy[\s\S]*?className=\{`\$\{textareaClass\} min-h-40 font-mono text-xs`\}[\s\S]*?readOnly[\s\S]*?value=\{value\}/,
  "MCP connection panel should render manual fallback text through a dedicated textarea component",
);
assert.match(
  mcpConnectionPanel,
  /function McpSetupManualCopyNotice[\s\S]*?copyState === "idle"[\s\S]*?return null[\s\S]*?const isError = copyState === "error" \|\| copyState === "draftError"[\s\S]*?복사에 실패했습니다\. 아래 내용을 직접 선택해 복사하세요\.[\s\S]*?Studio 초안을 저장하지 못했습니다\. 아래 runbook을 직접 선택해 복사하세요\.[\s\S]*?복사했습니다\.[\s\S]*?isError \? "text-danger" : "text-accent"[\s\S]*?<McpSetupManualCopyTextarea value=\{manualCopyText\} \/>[\s\S]*?<McpSetupManualCopyNotice[\s\S]*?copyState=\{copyState\}[\s\S]*?manualCopyText=\{manualCopyText\}/,
  "MCP connection panel should render copy status, draft fallback, and fallback through a dedicated notice",
);
assert.match(
  mcpConnectionPanel,
  /function openRunbookInStudio\(\)[\s\S]*?const rawInput = buildMcpEndToEndSmokeRunbook\(\)[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "integrations-operations-checklist"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setCopyState\("draftError"\)[\s\S]*?setManualCopyText\(rawInput\)[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=integrations-operations-checklist"\)/,
  "MCP connection panel should keep the smoke runbook in manual fallback when Studio draft storage fails",
);
assert.match(
  mcpConnectionPanel,
  /function McpToolOverview\(\)[\s\S]*?Tool[\s\S]*?get_context_profile, refine_prompt, create_handoff_package,[\s\S]*?save_execution_feedback[\s\S]*?confirmSave가 true일 때만 로컬 inbox에 저장합니다[\s\S]*?<McpToolOverview \/>/,
  "MCP connection panel should render MCP tool behavior through a dedicated overview",
);
assert.match(
  mcpConnectionPanel,
  /function McpOperatorChecklist\(\)[\s\S]*?Operator checklist[\s\S]*?setupChecks\.map[\s\S]*?break-words[\s\S]*?<McpOperatorChecklist \/>/,
  "MCP connection panel should render setup checks through a dedicated checklist",
);
assert.match(
  mcpConnectionPanel,
  /<McpConnectionSummary \/>[\s\S]*?<McpSetupWorkflow \/>[\s\S]*?<McpSetupCommandBar[\s\S]*?<McpClientConfigPanel \/>[\s\S]*?<McpSetupManualCopyNotice[\s\S]*?<McpToolOverview \/>[\s\S]*?<McpOperatorChecklist \/>/,
  "MCP connection panel should keep summary, setup workflow, setup commands, config, copy fallback, tool overview, and checklist in reading order",
);
assert.match(
  mcpConnectionPanel,
  /function McpEndToEndRunbookSection[\s\S]*?data-testid="mcp-runbook-section"[\s\S]*?End-to-end smoke runbook[\s\S]*?buildMcpEndToEndSmokeRunbook\(\), "runbook"[\s\S]*?buildMcpFeedbackInboxApiCheckList\(\), "inbox-api"[\s\S]*?buildMcpFeedbackInboxCurlCheckList\(\), "inbox-curl"[\s\S]*?onOpenInStudio[\s\S]*?mcpSmokeRunbookSteps\.map[\s\S]*?mcpFeedbackInboxFilterLinks\.map[\s\S]*?Feedback verification matrix[\s\S]*?<FeedbackVerificationCards onCopy=\{onCopy\} \/>[\s\S]*?<FeedbackVerificationTable onCopy=\{onCopy\} \/>[\s\S]*?<McpEndToEndRunbookSection[\s\S]*?onCopy=\{copyValue\}[\s\S]*?onOpenInStudio=\{openRunbookInStudio\}/,
  "MCP connection panel should render runbook, inbox filters, and feedback verification through a dedicated section",
);
assert.match(
  mcpConnectionPanel,
  /function ClientExamplesSection[\s\S]*?data-testid="mcp-client-examples-section"[\s\S]*?Client examples[\s\S]*?공통 MCP bridge[\s\S]*?<ClientSetupCards onCopy=\{onCopy\} \/>[\s\S]*?<ClientSetupTable onCopy=\{onCopy\} \/>[\s\S]*?<ClientExamplesSection onCopy=\{copyValue\} \/>/,
  "MCP connection panel should render client setup examples through a dedicated section",
);
assert.match(
  mcpConnectionPanel,
  /function ClientSmokePromptsSection[\s\S]*?data-testid="mcp-smoke-prompts-section"[\s\S]*?Client smoke prompts[\s\S]*?tool 호출을 유도하는 검증[\s\S]*?<ClientSmokePromptTable onCopy=\{onCopy\} \/>[\s\S]*?<ClientSmokePromptsSection onCopy=\{copyValue\} \/>/,
  "MCP connection panel should render smoke prompts through a dedicated section",
);
assert.match(
  mcpConnectionPanel,
  /function SmokeFeedbackPayloadSection[\s\S]*?data-testid="mcp-feedback-payload-section"[\s\S]*?Smoke feedback payloads[\s\S]*?save_execution_feedback payload[\s\S]*?confirmSave를 true로 바꿉니다[\s\S]*?<SmokeFeedbackPayloadTable onCopy=\{onCopy\} \/>[\s\S]*?<SmokeFeedbackPayloadSection onCopy=\{copyValue\} \/>/,
  "MCP connection panel should render feedback payload templates through a dedicated section",
);
assert.match(
  mcpConnectionPanel,
  /<McpEndToEndRunbookSection[\s\S]*?<ClientExamplesSection onCopy=\{copyValue\} \/>[\s\S]*?<ClientSmokePromptsSection onCopy=\{copyValue\} \/>[\s\S]*?<SmokeFeedbackPayloadSection onCopy=\{copyValue\} \/>/,
  "MCP connection panel should keep runbook, client examples, smoke prompts, and feedback payloads in reading order",
);
assert.match(
  mcpConnectionPanel,
  /function McpCardDetail[\s\S]*?label: string[\s\S]*?tone\?: "soft" \| "muted" \| "mono-soft" \| "mono-muted"[\s\S]*?value: string[\s\S]*?<dt[\s\S]*?\{label\}[\s\S]*?<dd[\s\S]*?\{value\}[\s\S]*?function ClientSetupCard[\s\S]*?setup: ClientSetupExample[\s\S]*?setup\.client[\s\S]*?setup\.targetAI[\s\S]*?buildClientSetupNote\(setup\)[\s\S]*?<McpCardDetail label="Config scope" value=\{setup\.configScope\} \/>[\s\S]*?<McpCardDetail label="Use case" value=\{setup\.useCase\} \/>[\s\S]*?<McpCardDetail[\s\S]*?label="Operator gate"[\s\S]*?value=\{setup\.operatorGate\}[\s\S]*?function ClientSetupCards[\s\S]*?data-testid="mcp-client-setup-cards"[\s\S]*?clientSetupExamples\.map[\s\S]*?<ClientSetupCard key=\{setup\.client\} onCopy=\{onCopy\} setup=\{setup\} \/>/,
  "MCP connection panel should render client setup examples through dedicated cards and shared detail cells before the wide table",
);
assert.match(
  mcpConnectionPanel,
  /function FeedbackVerificationCard[\s\S]*?check: FeedbackVerificationCheck[\s\S]*?check\.client[\s\S]*?check\.uiHref[\s\S]*?onCopy\(check\.curlCommand, "inbox-curl"\)[\s\S]*?<McpCardDetail[\s\S]*?label="API endpoint"[\s\S]*?value=\{check\.apiHref\}[\s\S]*?<McpCardDetail[\s\S]*?label="Curl check"[\s\S]*?value=\{check\.curlCommand\}[\s\S]*?function FeedbackVerificationCards[\s\S]*?data-testid="mcp-feedback-verification-cards"[\s\S]*?mcpFeedbackVerificationChecks\.map[\s\S]*?<FeedbackVerificationCard[\s\S]*?check=\{check\}[\s\S]*?onCopy=\{onCopy\}/,
  "MCP connection panel should render feedback verification paths through dedicated cards and shared detail cells before the wide matrix",
);
assert.match(
  mcpConnectionPanel,
  /function ClientSetupTable[\s\S]*?min-w-\[920px\][\s\S]*?clientSetupExamples\.map[\s\S]*?setup\.client[\s\S]*?setup\.configScope[\s\S]*?setup\.targetAI[\s\S]*?setup\.useCase[\s\S]*?setup\.operatorGate/,
  "MCP connection panel should keep the detailed client setup table",
);
assert.match(
  mcpConnectionPanel,
  /function FeedbackVerificationTable[\s\S]*?min-w-\[980px\][\s\S]*?mcpFeedbackVerificationChecks\.map[\s\S]*?check\.client[\s\S]*?check\.uiHref[\s\S]*?check\.apiHref[\s\S]*?check\.curlCommand/,
  "MCP connection panel should keep the detailed feedback verification table",
);
assert.match(
  mcpConnectionPanel,
  /function ClientSmokePromptRow[\s\S]*?smokeTest: ClientSmokeTest[\s\S]*?smokeTest\.client[\s\S]*?smokeTest\.toolSequence[\s\S]*?smokeTest\.prompt[\s\S]*?smokeTest\.acceptance[\s\S]*?buildClientSmokeTestPrompt\(smokeTest\)[\s\S]*?"smoke-prompt"[\s\S]*?function ClientSmokePromptTable[\s\S]*?min-w-\[900px\][\s\S]*?clientSmokeTests\.map[\s\S]*?<ClientSmokePromptRow[\s\S]*?onCopy=\{onCopy\}[\s\S]*?smokeTest=\{smokeTest\}[\s\S]*?<ClientSmokePromptsSection onCopy=\{copyValue\} \/>/,
  "MCP connection panel should render client smoke prompts through a dedicated table component",
);
assert.match(
  mcpConnectionPanel,
  /function SmokeFeedbackPayloadRow[\s\S]*?template: SmokeFeedbackTemplate[\s\S]*?template\.client[\s\S]*?template\.targetAI[\s\S]*?template\.resultSummary[\s\S]*?confirmSave defaults to false[\s\S]*?buildSmokeFeedbackPayload\(template\)[\s\S]*?"feedback-payload"[\s\S]*?function SmokeFeedbackPayloadTable[\s\S]*?min-w-\[900px\][\s\S]*?smokeFeedbackTemplates\.map[\s\S]*?<SmokeFeedbackPayloadRow[\s\S]*?onCopy=\{onCopy\}[\s\S]*?template=\{template\}[\s\S]*?<SmokeFeedbackPayloadSection onCopy=\{copyValue\} \/>/,
  "MCP connection panel should render smoke feedback payloads through a dedicated table component",
);
assert.match(
  mcpConnectionPanel,
  /<FeedbackVerificationCards onCopy=\{onCopy\} \/>[\s\S]*?<FeedbackVerificationTable onCopy=\{onCopy\} \/>/,
  "MCP connection panel should show feedback verification cards before the detailed table",
);
assert.match(
  mcpConnectionPanel,
  /<ClientSetupCards onCopy=\{onCopy\} \/>[\s\S]*?<ClientSetupTable onCopy=\{onCopy\} \/>/,
  "MCP connection panel should show client setup cards before the detailed table",
);

for (const requiredText of [
  '"use client"',
  "연결 준비도 점검",
  "ConnectionReadinessCheck",
  "ConnectionReadinessSummary",
  "ConnectionReadinessCardDetail",
  "ConnectionReadinessCard",
  "ConnectionReadinessCards",
  "ChromeLoadedSmokeCheck",
  "ChromeLoadedSmokeCard",
  "ChromeLoadedSmokeChecklist",
  "ConnectionReadinessRow",
  "ConnectionReadinessTable",
  "ConnectionReadinessManualCopyTextarea",
  "ConnectionReadinessCopyNotice",
  "readinessChecks",
  "chromeLoadedSmokeChecks",
  "chromeLoadedEvidenceRows",
  "chromeLoadedOperatorEvidenceFields",
  "readinessSummaryItems",
  'data-testid="connection-readiness-summary"',
  'data-testid="chrome-loaded-smoke-checklist"',
  'data-testid="chrome-loaded-evidence-packet"',
  'data-testid="chrome-loaded-operator-evidence"',
  'data-testid="connection-readiness-cards"',
  "연결 표면",
  "첫 실행",
  "Smoke 명령",
  "승인 gate",
  "Chrome extension",
  "MCP client",
  "ChatGPT / Claude / Gemini",
  "Codex",
  "Status gate",
  "Install step",
  "Smoke test",
  "Operator action",
  "준비도 체크리스트 복사",
  "Smoke test 명령 복사",
  "Chrome smoke 체크리스트 복사",
  "Chrome 증빙 패킷 복사",
  "실제 Chrome 증빙",
  "실제 Chrome 증빙 복사",
  "Chrome feedback payload 복사",
  "Feedback inbox 확인 복사",
  "실제 Chrome loaded extension 증빙을 복사했습니다.",
  "Chrome save_execution_feedback payload를 복사했습니다.",
  "Chrome feedback inbox 확인 명령을 복사했습니다.",
  "buildConnectionReadinessChecklist",
  "buildSmokeTestCommandBlock",
  "buildChromeLoadedExtensionSmokeChecklist",
  "buildChromeLoadedExtensionEvidencePacket",
  "buildChromeLoadedOperatorEvidencePacket",
  "buildChromeLoadedFeedbackPayload",
  "buildChromeFeedbackInboxCheck",
  "Connection readiness manual copy",
  "Prompt AI Studio Connection Readiness Checklist",
  "Prompt AI Studio Chrome Loaded Extension Smoke",
  "Prompt AI Studio Chrome Loaded Extension Evidence",
  "Prompt AI Studio Chrome Loaded Extension Operator Evidence",
  "local-first automation, smoke evidence saved, review-required external delivery",
  "loaded Chrome extension, local refine API, review-required handoff, session restore",
  "Chrome loaded smoke",
  "session restore, evidence fallback 증거를 같은 순서로 확인합니다.",
  "01 Runtime",
  "02 Capture",
  "03 Result",
  "04 Restore",
  "05 Evidence",
  "popup status is not Chrome extension runtime unavailable",
  "Review gate, Target AI, Source, Session summary appears",
  "reopen popup restores saved handoff; Clear removes it",
  "Evidence button copies packet; manual textarea opens on copy failure",
  "extension loaded, localhost:3000 reachable",
  "selected text, page title, source URL reviewed",
  "reviewRequired handoff summary checked before copy",
  "session restore checked, stale package cleared when needed",
  "Chrome handoff evidence packet copied or manual fallback selected",
  "actual loaded-extension smoke evidence",
  "Set confirmSave to true only after the external AI result is reviewed.",
  "Prompt AI Studio Chrome Feedback Inbox Check",
  "run this after save_execution_feedback confirmSave true",
  "mcpRating=positive",
  "mcpTargetAI",
  "/api/integrations/mcp-feedback?limit=5&rating=positive&targetAI=",
  "Load unpacked 후 popup에서 확인한 값을 그대로 적고",
  "Chrome loaded extension 증빙 패킷을 복사했습니다.",
  "chrome://extensions",
  "Load unpacked",
  "tools/list",
  "refine_prompt",
  "npm run dev",
  "npm run smoke:mcp -- --out docs/evidence/mcp-bridge-smoke.md",
  "npm run verify:integrations",
  "review-required handoff package",
  "copyTextToClipboard",
  "inputClass",
  "save_execution_feedback",
]) {
  assertIncludes(
    connectionReadinessPanel,
    requiredText,
    `Connection readiness panel should include ${requiredText}`,
  );
}

assert.match(
  connectionReadinessPanel,
  /const readinessSummaryItems = \[[\s\S]*?label: "연결 표면"[\s\S]*?readinessChecks\.length[\s\S]*?label: "첫 실행"[\s\S]*?readinessChecks\[0\]\.surface[\s\S]*?label: "Smoke 명령"[\s\S]*?smokeTestCommands\.length[\s\S]*?label: "승인 gate"[\s\S]*?evidence \+ review-required/,
  "Connection readiness panel should derive surface count, first run surface, smoke command count, and approval gate",
);
assert.match(
  connectionReadinessPanel,
  /const smokeTestCommands = \[[\s\S]*?npm run dev[\s\S]*?npm run smoke:chrome-extension -- --out docs\/evidence\/chrome-extension-smoke\.md[\s\S]*?npm run smoke:mcp -- --out docs\/evidence\/mcp-bridge-smoke\.md[\s\S]*?npm run smoke:learning-feedback -- --out docs\/evidence\/learning-feedback-smoke\.md[\s\S]*?npm run verify:integrations/,
  "Connection readiness smoke command copy should include local smoke evidence output commands",
);
assert.match(
  connectionReadinessPanel,
  /function ConnectionReadinessSummary\(\)[\s\S]*?className="grid grid-cols-2 gap-2 border-b border-line px-5 py-4 xl:grid-cols-4"[\s\S]*?data-testid="connection-readiness-summary"[\s\S]*?readinessSummaryItems\.map[\s\S]*?break-words text-xs font-semibold text-soft[\s\S]*?<ConnectionReadinessSummary \/>/,
  "Connection readiness panel should render the readiness summary as a compact two-column mobile grid",
);
assert.match(
  connectionReadinessPanel,
  /const chromeLoadedSmokeChecks = \[[\s\S]*?step: "01 Runtime"[\s\S]*?popup status is not Chrome extension runtime unavailable[\s\S]*?step: "02 Capture"[\s\S]*?selection and source URL collected[\s\S]*?step: "03 Result"[\s\S]*?Review gate, Target AI, Source, Session summary appears[\s\S]*?step: "04 Restore"[\s\S]*?reopen popup restores saved handoff; Clear removes it[\s\S]*?step: "05 Evidence"[\s\S]*?Evidence button copies packet; manual textarea opens on copy failure/,
  "Connection readiness panel should define the loaded Chrome extension smoke evidence sequence through evidence fallback",
);
assert.match(
  connectionReadinessPanel,
  /function buildChromeLoadedExtensionSmokeChecklist\(\)[\s\S]*?Prompt AI Studio Chrome Loaded Extension Smoke[\s\S]*?chromeLoadedSmokeChecks\.flatMap[\s\S]*?check\.gate[\s\S]*?check\.evidence[\s\S]*?check\.operatorCheck[\s\S]*?The handoff result summary shows review gate, target AI, source, and session state before copying[\s\S]*?The Evidence button copies the Chrome handoff evidence packet or opens the manual textarea/,
  "Connection readiness panel should build a copyable loaded Chrome smoke checklist",
);
assert.match(
  connectionReadinessPanel,
  /const chromeLoadedEvidenceRows = \[[\s\S]*?label: "Runtime"[\s\S]*?extension loaded, localhost:3000 reachable[\s\S]*?label: "Capture"[\s\S]*?selected text, page title, source URL reviewed[\s\S]*?label: "Result"[\s\S]*?reviewRequired handoff summary checked before copy[\s\S]*?label: "Restore"[\s\S]*?session restore checked, stale package cleared when needed[\s\S]*?label: "Evidence"[\s\S]*?Chrome handoff evidence packet copied or manual fallback selected/,
  "Connection readiness panel should define the loaded Chrome extension evidence packet rows including manual fallback",
);
assert.match(
  connectionReadinessPanel,
  /function buildChromeLoadedExtensionEvidencePacket\(\)[\s\S]*?Prompt AI Studio Chrome Loaded Extension Evidence[\s\S]*?chromeLoadedEvidenceRows\.map[\s\S]*?Operator decision:[\s\S]*?Copy only after review gate, target AI, source, and session state are checked[\s\S]*?Save execution feedback only after the external AI result is reviewed/,
  "Connection readiness panel should build a copyable loaded Chrome extension evidence packet",
);
assert.match(
  connectionReadinessPanel,
  /const chromeLoadedOperatorEvidenceFields = \[[\s\S]*?key: "runtime"[\s\S]*?extension runtime connected · local Studio URL only[\s\S]*?key: "source"[\s\S]*?Example Page \(example\.com\)[\s\S]*?key: "reviewGate"[\s\S]*?reviewRequired[\s\S]*?key: "targetAI"[\s\S]*?codex[\s\S]*?key: "session"[\s\S]*?Saved Jun 29 02:30[\s\S]*?key: "evidenceResult"[\s\S]*?Evidence packet copied or manual fallback selected/,
  "Connection readiness panel should define actual Chrome loaded evidence input fields",
);
assert.match(
  connectionReadinessPanel,
  /function buildChromeLoadedOperatorEvidencePacket[\s\S]*?Prompt AI Studio Chrome Loaded Extension Operator Evidence[\s\S]*?actual loaded-extension smoke evidence[\s\S]*?chromeLoadedOperatorEvidenceFields\.map[\s\S]*?draft\[field\.key\][\s\S]*?Operator decision:[\s\S]*?Save execution feedback only after the external AI result is reviewed/,
  "Connection readiness panel should build a copyable actual Chrome loaded evidence packet",
);
assert.match(
  connectionReadinessPanel,
  /function buildChromeLoadedFeedbackPayload\(draft: ChromeLoadedEvidenceDraft\)[\s\S]*?const targetAI[\s\S]*?confirmSave: false[\s\S]*?Set confirmSave to true only after the external AI result is reviewed[\s\S]*?rating: "positive"[\s\S]*?resultSummary: `Chrome loaded extension smoke passed[\s\S]*?targetAI[\s\S]*?tool: "save_execution_feedback"/,
  "Connection readiness panel should build a gated save_execution_feedback payload from actual Chrome evidence",
);
assert.match(
  connectionReadinessPanel,
  /function buildChromeFeedbackInboxCheck\(draft: ChromeLoadedEvidenceDraft\)[\s\S]*?const targetAI[\s\S]*?encodeURIComponent\(targetAI\)[\s\S]*?Prompt AI Studio Chrome Feedback Inbox Check[\s\S]*?save_execution_feedback confirmSave true[\s\S]*?mcpRating=positive&mcpTargetAI=\$\{encodedTargetAI\}#integrations-feedback-inbox[\s\S]*?\/api\/integrations\/mcp-feedback\?limit=5&rating=positive&targetAI=\$\{encodedTargetAI\}[\s\S]*?curl -sS/,
  "Connection readiness panel should build a Chrome feedback inbox UI/API/curl check from actual Chrome evidence",
);
assert.match(
  connectionReadinessPanel,
  /function ChromeLoadedSmokeCard[\s\S]*?check: ChromeLoadedSmokeCheck[\s\S]*?check\.step[\s\S]*?check\.gate[\s\S]*?Evidence[\s\S]*?check\.evidence[\s\S]*?Operator check[\s\S]*?check\.operatorCheck[\s\S]*?function ChromeLoadedSmokeChecklist[\s\S]*?onCopyEvidence[\s\S]*?data-testid="chrome-loaded-smoke-checklist"[\s\S]*?Chrome loaded smoke[\s\S]*?Chrome smoke 체크리스트 복사[\s\S]*?Chrome 증빙 패킷 복사[\s\S]*?lg:grid-cols-5[\s\S]*?chromeLoadedSmokeChecks\.map[\s\S]*?data-testid="chrome-loaded-evidence-packet"[\s\S]*?chromeLoadedEvidenceRows\.map/,
  "Connection readiness panel should render loaded Chrome smoke cards and evidence packet rows with copy support",
);
assert.match(
  connectionReadinessPanel,
  /function ChromeLoadedOperatorEvidence[\s\S]*?draft: ChromeLoadedEvidenceDraft[\s\S]*?onCopyFeedback[\s\S]*?onCopyFeedbackCheck[\s\S]*?data-testid="chrome-loaded-operator-evidence"[\s\S]*?실제 Chrome 증빙[\s\S]*?Load unpacked 후 popup에서 확인한 값을 그대로 적고[\s\S]*?실제 Chrome 증빙 복사[\s\S]*?onClick=\{onCopyFeedback\}[\s\S]*?Chrome feedback payload 복사[\s\S]*?onClick=\{onCopyFeedbackCheck\}[\s\S]*?Feedback inbox 확인 복사[\s\S]*?chromeLoadedOperatorEvidenceFields\.map[\s\S]*?className=\{inputClass\}[\s\S]*?onChange\(field\.key, event\.target\.value\)[\s\S]*?value=\{draft\[field\.key\]\}/,
  "Connection readiness panel should render actual Chrome loaded evidence inputs with copy support",
);
assert.match(
  connectionReadinessPanel,
  /function ConnectionReadinessCardDetail[\s\S]*?label: string[\s\S]*?value: string[\s\S]*?<dt[\s\S]*?\{label\}[\s\S]*?<dd[\s\S]*?\{value\}[\s\S]*?function ConnectionReadinessCard[\s\S]*?check: ConnectionReadinessCheck[\s\S]*?check\.surface[\s\S]*?check\.statusGate[\s\S]*?<ConnectionReadinessCardDetail[\s\S]*?label="Install"[\s\S]*?value=\{check\.installStep\}[\s\S]*?<ConnectionReadinessCardDetail[\s\S]*?label="Operator action"[\s\S]*?value=\{check\.operatorAction\}/,
  "Connection readiness panel should render each surface through a compact card with install and operator action details",
);
assert.match(
  connectionReadinessPanel,
  /function ConnectionReadinessCards\(\)[\s\S]*?data-testid="connection-readiness-cards"[\s\S]*?readinessChecks\.map[\s\S]*?<ConnectionReadinessCard check=\{check\} key=\{check\.surface\} \/>[\s\S]*?<ConnectionReadinessCards \/>/,
  "Connection readiness panel should show scannable readiness cards before the wide table",
);
assert.match(
  connectionReadinessPanel,
  /function ConnectionReadinessRow[\s\S]*?check: ConnectionReadinessCheck[\s\S]*?check\.surface[\s\S]*?check\.statusGate[\s\S]*?check\.installStep[\s\S]*?check\.smokeTest[\s\S]*?check\.operatorAction[\s\S]*?function ConnectionReadinessTable\(\)[\s\S]*?min-w-\[980px\][\s\S]*?readinessChecks\.map[\s\S]*?<ConnectionReadinessRow key=\{check\.surface\} check=\{check\} \/>[\s\S]*?<ConnectionReadinessTable \/>/,
  "Connection readiness panel should render detailed readiness rows through a dedicated table component",
);
assert.match(
  connectionReadinessPanel,
  /function ConnectionReadinessManualCopyTextarea[\s\S]*?value: string[\s\S]*?Connection readiness manual copy[\s\S]*?className=\{`\$\{textareaClass\} min-h-40 font-mono text-xs`\}[\s\S]*?readOnly[\s\S]*?value=\{value\}/,
  "Connection readiness panel should render manual fallback text through a dedicated textarea component",
);
assert.match(
  connectionReadinessPanel,
  /function ConnectionReadinessCopyNotice[\s\S]*?copyState === "idle"[\s\S]*?return null[\s\S]*?복사에 실패했습니다\. 아래 내용을 직접 선택해 복사하세요\.[\s\S]*?연결 준비도 체크리스트를 복사했습니다\.[\s\S]*?Chrome loaded smoke 체크리스트를 복사했습니다\.[\s\S]*?Chrome loaded extension 증빙 패킷을 복사했습니다\.[\s\S]*?실제 Chrome loaded extension 증빙을 복사했습니다\.[\s\S]*?Chrome save_execution_feedback payload를 복사했습니다\.[\s\S]*?Chrome feedback inbox 확인 명령을 복사했습니다\.[\s\S]*?Smoke test 명령을 복사했습니다\.[\s\S]*?<ConnectionReadinessManualCopyTextarea value=\{manualCopyText\} \/>[\s\S]*?<ConnectionReadinessCopyNotice[\s\S]*?copyState=\{copyState\}[\s\S]*?manualCopyText=\{manualCopyText\}/,
  "Connection readiness panel should render copy status and manual fallback through a dedicated notice",
);
assert.match(
  connectionReadinessPanel,
  /<ConnectionReadinessSummary \/>[\s\S]*?<ChromeLoadedSmokeChecklist[\s\S]*?buildChromeLoadedExtensionSmokeChecklist\(\)[\s\S]*?<ChromeLoadedOperatorEvidence[\s\S]*?buildChromeLoadedOperatorEvidencePacket\(chromeLoadedEvidenceDraft\)[\s\S]*?buildChromeLoadedFeedbackPayload\(chromeLoadedEvidenceDraft\)[\s\S]*?buildChromeFeedbackInboxCheck\(chromeLoadedEvidenceDraft\)[\s\S]*?<ConnectionReadinessCards \/>[\s\S]*?<ConnectionReadinessTable \/>[\s\S]*?<ConnectionReadinessCopyNotice/,
  "Connection readiness panel should show the summary, loaded Chrome smoke checklist, actual Chrome evidence inputs, readiness cards, detailed table, and copy notice in reading order",
);

for (const requiredText of [
  '"use client"',
  "MCP feedback inbox",
  "useSearchParams",
  "/api/integrations/mcp-feedback?",
  "Feedback inbox 새로고침",
  "현재 필터 링크 복사",
  "현재 API 복사",
  "Curl 복사",
  "필터 초기화",
  "현재 API endpoint를 복사했습니다.",
  "Curl smoke check를 복사했습니다.",
  "Feedback 증빙 패킷을 복사했습니다.",
  "현재 필터 링크를 복사했습니다.",
  "Feedback report 복사",
  "Feedback report Studio로",
  "feedbackReviewSummaryItems",
  "ratingFilterOptions",
  "targetAIFilterOptions",
  "FeedbackInboxActions",
  "FeedbackInboxStatus",
  "FeedbackInboxActionButtons",
  "FeedbackFilterControls",
  "FeedbackFilterSelect",
  "FeedbackQueueSummary",
  "FeedbackReviewSummary",
  "FeedbackRecordList",
  "FeedbackRecordCard",
  "FeedbackRecordBody",
  "FeedbackRecordEvidenceSummary",
  "FeedbackRecordMeta",
  "FeedbackRecordActions",
  "FeedbackRecordEmptyState",
  "getFeedbackCopyStatusMessage",
  "FeedbackManualCopyTextarea",
  "FeedbackCopyStatusNotice",
  "FeedbackParseWarning",
  'data-testid="mcp-feedback-review-summary"',
  "저장 상태",
  "현재 결과",
  "현재 필터",
  "검증 상태",
  "confirmSave 기록 있음",
  "curl/API 준비",
  "manualCopyText",
  "MCP feedback manual copy",
  'data-testid="mcp-feedback-record-evidence-summary"',
  "Feedback ID",
  "저장 gate",
  "증빙 상태",
  "Evidence ready",
  "Feedback 증빙 복사",
  "Learning candidate 복사",
  "confirmSave 예시 복사",
  "confirmSave 저장 예시를 복사했습니다.",
  "Studio 개선 초안 복사",
  "Studio로 보내기",
  "buildMcpFeedbackReport",
  "buildMcpFeedbackEvidencePacket",
  "buildLearningMemoryCandidateText",
  "buildStudioFeedbackImprovementDraft",
  "buildMcpFeedbackSaveExample",
  "buildMcpFeedbackInboxHref",
  "buildMcpFeedbackInboxApiHref",
  "buildMcpFeedbackInboxCurlCommand",
  "buildAbsoluteMcpFeedbackInboxUrl",
  "getCurrentOrigin",
  "replaceMcpFeedbackInboxUrl",
  "getMcpFeedbackFiltersFromSearchText",
  "copyFeedbackFilterLink",
  "resetFeedbackFilters",
  "mcpRating",
  "mcpTargetAI",
  "window.history.replaceState",
  "writeStudioDraft",
  "draftError",
  'source: "mcp-feedback-improvement"',
  'source: "mcp-feedback-report"',
  'router.push("/studio?draft=mcp-feedback-improvement")',
  'router.push("/studio?draft=mcp-feedback-report")',
  "# MCP Learning Memory Candidate",
  "# Studio Improvement Draft From MCP Feedback",
  "copyTextToClipboard",
  "# MCP Feedback Inbox Report",
  "Filter link:",
  "Feedback ID:",
  "Gate: confirmSave true",
  "Evidence: ready for audit packet",
  "Next check:",
  "Compare evidence-ready single-record drafts with this trace-ready report before changing reusable learning memory.",
  "evidence-ready",
  "trace-ready",
  "Queue summary",
  "Current API endpoint",
  "Curl smoke check",
  'curl -sS "http://localhost:3000${apiHref}"',
  "Operator reviewed the external AI result and wants to keep this as a learning signal.",
  "External AI execution produced a useful result after the reviewed handoff package.",
  "copyFeedbackApiEndpoint",
  "copyFeedbackCurlCommand",
  "copyFeedbackEvidence",
  "copyFeedbackSaveExample",
  "textareaClass",
  "Studio 초안을 저장하지 못했습니다. 아래 내용을 직접 선택해 복사하세요.",
  "ratingFilter",
  "targetAIFilter",
  "save_execution_feedback",
  "# MCP Feedback Evidence",
  "This record came from save_execution_feedback after confirmSave true.",
  "Compare the learning candidate and Studio improvement draft before reusing this feedback.",
  "confirmSave: true",
  "JSONL parse warning",
]) {
  assertIncludes(
    mcpFeedbackInboxPanel,
    requiredText,
    `MCP feedback inbox panel should include ${requiredText}`,
  );
}

assert.match(
  mcpFeedbackInboxPanel,
  /const feedbackReviewSummaryItems = \[[\s\S]*?label: "저장 상태"[\s\S]*?confirmSave 기록 있음[\s\S]*?label: "현재 결과"[\s\S]*?feedback\.filteredCount[\s\S]*?feedback\.totalCount[\s\S]*?label: "현재 필터"[\s\S]*?ratingFilter[\s\S]*?targetAIFilter[\s\S]*?label: "검증 상태"[\s\S]*?feedback\?\.parseErrors\.length[\s\S]*?curl\/API 준비/,
  "MCP feedback inbox should derive saved status, filtered result count, current filters, and JSONL/API verification state",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackReviewSummary[\s\S]*?className="grid grid-cols-2 gap-2 rounded-md border border-line bg-surface p-3 xl:grid-cols-4"[\s\S]*?data-testid="mcp-feedback-review-summary"[\s\S]*?items\.map[\s\S]*?break-words text-xs font-semibold text-soft[\s\S]*?<FeedbackReviewSummary items=\{feedbackReviewSummaryItems\} \/>/,
  "MCP feedback inbox should render a compact feedback review summary in a two-column mobile grid",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackInboxActions[\s\S]*?<FeedbackInboxStatus feedback=\{feedback\} \/>[\s\S]*?<FeedbackInboxActionButtons[\s\S]*?feedback=\{feedback\}[\s\S]*?onCopyApiEndpoint=\{onCopyApiEndpoint\}[\s\S]*?onCopyCurlCommand=\{onCopyCurlCommand\}[\s\S]*?onCopyFilterLink=\{onCopyFilterLink\}[\s\S]*?onCopyReport=\{onCopyReport\}[\s\S]*?onOpenReportInStudio=\{onOpenReportInStudio\}[\s\S]*?onRefresh=\{onRefresh\}[\s\S]*?onResetFilters=\{onResetFilters\}[\s\S]*?status=\{status\}[\s\S]*?<FeedbackInboxActions[\s\S]*?onCopyApiEndpoint=\{copyFeedbackApiEndpoint\}[\s\S]*?onCopyCurlCommand=\{copyFeedbackCurlCommand\}[\s\S]*?onCopyFilterLink=\{copyFeedbackFilterLink\}[\s\S]*?onCopyReport=\{copyFeedbackReport\}[\s\S]*?onOpenReportInStudio=\{openFeedbackReportInStudio\}[\s\S]*?onRefresh=\{refreshFeedbackInbox\}[\s\S]*?onResetFilters=\{resetFeedbackFilters\}/,
  "MCP feedback inbox should render header actions through a dedicated component wired to copy, refresh, reset, and Studio actions",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackInboxStatus[\s\S]*?feedback: McpFeedbackInboxResponse \| null[\s\S]*?feedback\?\.exists[\s\S]*?feedback\.filteredCount[\s\S]*?feedback\.totalCount[\s\S]*?No saved feedback inbox yet[\s\S]*?feedback\?\.inboxPath[\s\S]*?\.prompt-ai-studio\/mcp-feedback\.jsonl/,
  "MCP feedback inbox should render saved count and inbox path through a dedicated status component",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackInboxActionButtons[\s\S]*?status: LoadState[\s\S]*?disabled=\{status === "loading"\}[\s\S]*?Feedback inbox 새로고침[\s\S]*?onCopyFilterLink[\s\S]*?현재 필터 링크 복사[\s\S]*?onCopyApiEndpoint[\s\S]*?현재 API 복사[\s\S]*?onCopyCurlCommand[\s\S]*?Curl 복사[\s\S]*?onResetFilters[\s\S]*?필터 초기화[\s\S]*?disabled=\{!feedback\}[\s\S]*?Feedback report 복사[\s\S]*?disabled=\{!feedback\?\.records\.length\}[\s\S]*?Feedback report Studio로/,
  "MCP feedback inbox should render refresh, copy, reset, report, and Studio controls through a dedicated button group",
);
assert.match(
  mcpFeedbackInboxPanel,
  /const ratingFilterOptions = \[[\s\S]*?"positive"[\s\S]*?"neutral"[\s\S]*?"negative"[\s\S]*?\] satisfies RatingFilter\[\][\s\S]*?const targetAIFilterOptions = \[[\s\S]*?"gpt"[\s\S]*?"claude"[\s\S]*?"codex"[\s\S]*?"gemini"[\s\S]*?"general"[\s\S]*?\] satisfies TargetAIFilter\[\]/,
  "MCP feedback inbox should keep typed filter option lists outside the render path",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackFilterControls[\s\S]*?<FeedbackFilterSelect[\s\S]*?label="Rating"[\s\S]*?onChange=\{onRatingChange\}[\s\S]*?options=\{ratingFilterOptions\}[\s\S]*?value=\{ratingFilter\}[\s\S]*?<FeedbackFilterSelect[\s\S]*?label="Target AI"[\s\S]*?onChange=\{onTargetAIChange\}[\s\S]*?options=\{targetAIFilterOptions\}[\s\S]*?value=\{targetAIFilter\}[\s\S]*?<FeedbackQueueSummary[\s\S]*?currentApiHref=\{currentApiHref\}[\s\S]*?currentCurlCommand=\{currentCurlCommand\}[\s\S]*?feedback=\{feedback\}/,
  "MCP feedback inbox should render filter controls and queue summary through a dedicated component",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackFilterSelect<TValue extends string>[\s\S]*?label: string[\s\S]*?onChange: \(value: TValue\) => void[\s\S]*?options: TValue\[\][\s\S]*?value: TValue[\s\S]*?\{label\}[\s\S]*?onChange\(event\.target\.value as TValue\)[\s\S]*?options\.map/,
  "MCP feedback inbox should render typed select controls through a shared filter select component",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackQueueSummary[\s\S]*?feedback: McpFeedbackInboxResponse \| null[\s\S]*?Queue summary[\s\S]*?feedback\?\.ratingCounts\.negative[\s\S]*?feedback\?\.ratingCounts\.positive[\s\S]*?feedback\?\.targetAICounts\.codex[\s\S]*?Current API endpoint[\s\S]*?currentApiHref[\s\S]*?Curl smoke check[\s\S]*?currentCurlCommand/,
  "MCP feedback inbox should render queue totals and smoke endpoints through a dedicated summary component",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackRecordList[\s\S]*?records\.map[\s\S]*?<FeedbackRecordCard[\s\S]*?onCopyEvidence=\{onCopyEvidence\}[\s\S]*?onCopyLearningMemory=\{onCopyLearningMemory\}[\s\S]*?onCopyStudioDraft=\{onCopyStudioDraft\}[\s\S]*?onOpenStudioDraft=\{onOpenStudioDraft\}[\s\S]*?record=\{record\}[\s\S]*?<FeedbackRecordEmptyState onCopySaveExample=\{onCopySaveExample\} \/>[\s\S]*?<FeedbackRecordList[\s\S]*?onCopyEvidence=\{copyFeedbackEvidence\}[\s\S]*?onCopySaveExample=\{copyFeedbackSaveExample\}[\s\S]*?records=\{feedback\?\.records \?\? \[\]\}/,
  "MCP feedback inbox should render feedback records through a dedicated list component with copy and Studio actions",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackRecordCard[\s\S]*?record: McpFeedbackRecord[\s\S]*?onCopyEvidence[\s\S]*?<FeedbackRecordMeta record=\{record\} \/>[\s\S]*?<FeedbackRecordBody record=\{record\} \/>[\s\S]*?<FeedbackRecordEvidenceSummary record=\{record\} \/>[\s\S]*?<FeedbackRecordActions[\s\S]*?onCopyEvidence=\{onCopyEvidence\}[\s\S]*?record=\{record\}/,
  "MCP feedback inbox should render each feedback row through a dedicated record card",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackRecordBody[\s\S]*?record: McpFeedbackRecord[\s\S]*?record\.resultSummary[\s\S]*?No result summary[\s\S]*?record\.improvementQueueItem/,
  "MCP feedback inbox should render result summary and improvement queue text through a dedicated body component",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackRecordEvidenceSummary[\s\S]*?record: McpFeedbackRecord[\s\S]*?label: "Feedback ID"[\s\S]*?value: record\.id \?\? "unknown"[\s\S]*?label: "저장 gate"[\s\S]*?value: "confirmSave true"[\s\S]*?label: "증빙 상태"[\s\S]*?value: "Evidence ready"[\s\S]*?data-testid="mcp-feedback-record-evidence-summary"[\s\S]*?break-words font-mono text-soft/,
  "MCP feedback inbox should show record provenance before copy actions",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackRecordMeta[\s\S]*?record\.targetAI[\s\S]*?record\.rating[\s\S]*?formatFeedbackTime\(record\.createdAt\)/,
  "MCP feedback inbox should render target AI, rating, and time through a dedicated meta component",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackRecordActions[\s\S]*?onCopyEvidence\(record\)[\s\S]*?Feedback 증빙 복사[\s\S]*?onCopyLearningMemory\(record\)[\s\S]*?Learning candidate 복사[\s\S]*?onCopyStudioDraft\(record\)[\s\S]*?Studio 개선 초안 복사[\s\S]*?onOpenStudioDraft\(record\)[\s\S]*?Studio로 보내기/,
  "MCP feedback inbox should render record copy and Studio actions through a dedicated action component",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackRecordEmptyState[\s\S]*?onCopySaveExample[\s\S]*?아직 confirmSave된 MCP feedback이 없습니다[\s\S]*?save_execution_feedback을 confirmSave: true[\s\S]*?결과 요약과 target AI를 확인합니다[\s\S]*?confirmSave를 true로 둡니다[\s\S]*?현재 API\/curl로 확인합니다[\s\S]*?onClick=\{onCopySaveExample\}[\s\S]*?confirmSave 예시 복사/,
  "MCP feedback inbox should render no-feedback guidance and a confirmSave example copy action through a dedicated empty state",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function getFeedbackCopyStatusMessage\(copyState: CopyState\)[\s\S]*?case "api":[\s\S]*?현재 API endpoint를 복사했습니다\.[\s\S]*?case "curl":[\s\S]*?Curl smoke check를 복사했습니다\.[\s\S]*?case "evidence":[\s\S]*?Feedback 증빙 패킷을 복사했습니다\.[\s\S]*?case "filterLink":[\s\S]*?현재 필터 링크를 복사했습니다\.[\s\S]*?case "report":[\s\S]*?Feedback report를 복사했습니다\.[\s\S]*?case "memory":[\s\S]*?Learning memory candidate를 복사했습니다\.[\s\S]*?case "saveExample":[\s\S]*?confirmSave 저장 예시를 복사했습니다\.[\s\S]*?case "studio":[\s\S]*?Studio 개선 초안을 복사했습니다\./,
  "MCP feedback inbox should centralize copy status labels in a helper",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function buildMcpFeedbackEvidencePacket\(record: McpFeedbackRecord\)[\s\S]*?# MCP Feedback Evidence[\s\S]*?Feedback ID: \$\{record\.id \?\? "unknown"\}[\s\S]*?Target AI: \$\{record\.targetAI \?\? "general"\}[\s\S]*?Rating: \$\{record\.rating \?\? "neutral"\}[\s\S]*?Result: \$\{record\.resultSummary \?\? "No result summary"\}[\s\S]*?This record came from save_execution_feedback after confirmSave true[\s\S]*?Review the result summary before turning it into a reusable learning memory[\s\S]*?Compare the learning candidate and Studio improvement draft before reusing this feedback/,
  "MCP feedback inbox should build a copyable feedback evidence packet from each saved record",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function buildLearningMemoryCandidateText\(record: McpFeedbackRecord\)[\s\S]*?# MCP Learning Memory Candidate[\s\S]*?Feedback ID: \$\{record\.id \?\? "unknown"\}[\s\S]*?Gate: confirmSave true[\s\S]*?Evidence: ready for audit packet[\s\S]*?Result: \$\{record\.resultSummary \?\? "No result summary"\}/,
  "MCP feedback learning memory candidate should carry confirmSave and evidence readiness before reusable memory text",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function buildStudioFeedbackImprovementDraft\(record: McpFeedbackRecord\)[\s\S]*?# Studio Improvement Draft From MCP Feedback[\s\S]*?## Execution feedback[\s\S]*?Gate: confirmSave true[\s\S]*?Evidence: ready for audit packet[\s\S]*?## Raw feedback summary[\s\S]*?## Required output[\s\S]*?Confirm this improvement still traces back to confirmSave true feedback evidence/,
  "MCP feedback Studio improvement draft should carry confirmSave evidence trace into the required output",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function buildMcpFeedbackInboxHref[\s\S]*?const query = params\.toString\(\)[\s\S]*?const href = query \? `\/integrations\?\$\{query\}` : "\/integrations"[\s\S]*?return `\$\{href\}#integrations-feedback-inbox`/,
  "MCP feedback inbox links should preserve filters and return to the feedback inbox section",
);
assert.match(
  mcpFeedbackInboxPanel,
  /sourceTitle: formatMcpFeedbackSourceTitle\(record\)[\s\S]*?function formatMcpFeedbackSourceTitle\(record: McpFeedbackRecord\)[\s\S]*?MCP feedback · \$\{targetAI\} · \$\{rating\} · evidence-ready/,
  "MCP feedback single-record Studio draft source title should show evidence-ready status",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function buildMcpFeedbackReport[\s\S]*?Feedback ID: \$\{record\.id \?\? "unknown"\}[\s\S]*?Gate: confirmSave true[\s\S]*?Evidence: ready for audit packet[\s\S]*?Result: \$\{record\.resultSummary \?\? "No result summary"\}[\s\S]*?# MCP Feedback Inbox Report[\s\S]*?Filter link: \$\{filterLink\}[\s\S]*?Next check:[\s\S]*?Compare evidence-ready single-record drafts with this trace-ready report before changing reusable learning memory/,
  "MCP feedback report should include record trace lines and a next check action for saved feedback evidence",
);
assert.match(
  mcpFeedbackInboxPanel,
  /sourceTitle: formatMcpFeedbackReportSourceTitle\(feedback[\s\S]*?function formatMcpFeedbackReportSourceTitle[\s\S]*?MCP feedback report · \$\{filters\.rating\}\/\$\{filters\.targetAI\} · \$\{feedback\.filteredCount\} records · trace-ready/,
  "MCP feedback report Studio draft source title should show trace-ready status",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function buildMcpFeedbackSaveExample\(targetAIFilter: TargetAIFilter\)[\s\S]*?targetAIFilter === "all" \? "codex" : targetAIFilter[\s\S]*?confirmSave: true[\s\S]*?rating: "positive"[\s\S]*?resultSummary[\s\S]*?targetAI[\s\S]*?tool: "save_execution_feedback"/,
  "MCP feedback inbox should build a copyable confirmSave true save_execution_feedback example from the current target AI filter",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackManualCopyTextarea[\s\S]*?value: string[\s\S]*?MCP feedback manual copy[\s\S]*?className=\{`\$\{textareaClass\} min-h-32 font-mono text-xs`\}[\s\S]*?readOnly[\s\S]*?value=\{value\}/,
  "MCP feedback inbox should render manual fallback text through a dedicated textarea component",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackCopyStatusNotice[\s\S]*?getFeedbackCopyStatusMessage\(copyState\)[\s\S]*?text-sm text-accent[\s\S]*?copyState !== "error" && copyState !== "draftError"[\s\S]*?const errorMessage[\s\S]*?copyState === "draftError"[\s\S]*?Studio 초안을 저장하지 못했습니다\. 아래 내용을 직접 선택해 복사하세요\.[\s\S]*?복사에 실패했습니다\. 아래 내용을 직접 선택해 복사하세요\.[\s\S]*?<FeedbackManualCopyTextarea value=\{manualCopyText\} \/>[\s\S]*?<FeedbackCopyStatusNotice[\s\S]*?copyState=\{copyState\}[\s\S]*?manualCopyText=\{manualCopyText\}/,
  "MCP feedback inbox should render success, copy fallback, and Studio draft fallback through a dedicated notice component",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function openFeedbackReportInStudio\(\)[\s\S]*?const rawInput = buildMcpFeedbackReport[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "mcp-feedback-report"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setCopyState\("draftError"\)[\s\S]*?setManualCopyText\(rawInput\)[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=mcp-feedback-report"\)/,
  "MCP feedback report Studio handoff should keep the report text in a manual fallback when draft storage fails",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function openStudioImprovementDraft\(record: McpFeedbackRecord\)[\s\S]*?const rawInput = buildStudioFeedbackImprovementDraft\(record\)[\s\S]*?const wroteDraft = writeStudioDraft\(\{[\s\S]*?source: "mcp-feedback-improvement"[\s\S]*?rawInput[\s\S]*?if \(!wroteDraft\) \{[\s\S]*?setCopyState\("draftError"\)[\s\S]*?setManualCopyText\(rawInput\)[\s\S]*?return[\s\S]*?router\.push\("\/studio\?draft=mcp-feedback-improvement"\)/,
  "MCP feedback single-record Studio handoff should keep the improvement draft in a manual fallback when draft storage fails",
);
assert.match(
  mcpFeedbackInboxPanel,
  /function FeedbackParseWarning[\s\S]*?parseErrorCount: number[\s\S]*?if \(!parseErrorCount\)[\s\S]*?return null[\s\S]*?JSONL parse warning: \{parseErrorCount\} invalid lines[\s\S]*?<FeedbackParseWarning[\s\S]*?parseErrorCount=\{feedback\?\.parseErrors\.length \?\? 0\}/,
  "MCP feedback inbox should render JSONL parse warnings through a dedicated component",
);
assert.match(
  mcpFeedbackInboxPanel,
  /<FeedbackCopyStatusNotice[\s\S]*?<FeedbackParseWarning[\s\S]*?<FeedbackRecordList/,
  "MCP feedback inbox should show copy status before parse warnings and the feedback record list",
);

assertIncludes(
  promptTypes,
  '"integrations-operations-checklist"',
  "Prompt Studio draft sources should include integrations operations checklist",
);
assertIncludes(
  promptTypes,
  '"mcp-feedback-improvement"',
  "Prompt Studio draft sources should include MCP feedback improvement",
);
assertIncludes(
  promptTypes,
  '"mcp-feedback-report"',
  "Prompt Studio draft sources should include MCP feedback report",
);
assertIncludes(
  sourceRegistry,
  '"integrations-operations-checklist"',
  "Prompt Studio source registry should include integrations operations checklist",
);
assertIncludes(
  sourceRegistry,
  "Integrations 외부 AI 운영 체크리스트",
  "Prompt Studio source registry should label integrations operations checklist",
);
assertIncludes(
  sourceRegistry,
  '"mcp-feedback-improvement"',
  "Prompt Studio source registry should include MCP feedback improvement",
);
assertIncludes(
  sourceRegistry,
  '"mcp-feedback-report"',
  "Prompt Studio source registry should include MCP feedback report",
);
assertIncludes(
  sourceRegistry,
  "MCP feedback 개선 초안",
  "Prompt Studio source registry should label MCP feedback improvement",
);
assertIncludes(
  sourceRegistry,
  "confirmSave true evidence trace를 확인한 뒤 다음 handoff package를 더 명확하게 재작성하세요.",
  "Prompt Studio source registry should give MCP feedback improvement a confirmSave evidence trace next action",
);
assertIncludes(
  sourceRegistry,
  "confirmSave true evidence trace와 개선 초안 비교 결과가 다음 handoff에 반영됐는지 확인",
  "Prompt Studio source registry should keep MCP feedback improvement confirmSave evidence trace after save",
);
assertIncludes(
  sourceRegistry,
  "Feedback inbox 보기",
  "Prompt Studio source registry should route MCP feedback drafts back to the feedback inbox",
);
assertIncludes(
  sourceRegistry,
  "단건 evidence-ready 초안과 trace-ready 리포트의 confirmSave evidence trace를 비교한 뒤 반복 개선 규칙과 다음 운영 액션을 정리하세요.",
  "Prompt Studio source registry should give MCP feedback report a confirmSave trace comparison next action",
);
assertIncludes(
  sourceRegistry,
  "단건 evidence-ready 초안, trace-ready 리포트, confirmSave evidence trace가 저장본에 반영됐는지 확인",
  "Prompt Studio source registry should keep MCP feedback report confirmSave trace comparison after save",
);
assertIncludes(
  sourceRegistry,
  "MCP feedback 운영 리포트",
  "Prompt Studio source registry should label MCP feedback report",
);

for (const requiredText of [
  "POST(request: Request)",
  "OPTIONS(request: Request)",
  "createIntegrationRefineResponse",
  "parseIntegrationRefineRequest",
]) {
  assertIncludes(
    route,
    requiredText,
    `Integrations refine route should include ${requiredText}`,
  );
}

for (const requiredText of [
  'dynamic = "force-dynamic"',
  "GET(request: Request)",
  ".prompt-ai-studio",
  "mcp-feedback.jsonl",
  "parseMcpFeedbackInboxText",
  "rating",
  "targetAI",
  "Cache-Control",
  "no-store",
]) {
  assertIncludes(
    mcpFeedbackRoute,
    requiredText,
    `MCP feedback route should include ${requiredText}`,
  );
}

for (const requiredText of [
  "parseMcpFeedbackInboxText",
  "normalizeMcpFeedbackInboxLimit",
  "normalizeMcpFeedbackFilter",
  "McpFeedbackRecord",
  "filteredCount",
  "ratingCounts",
  "targetAICounts",
  "parseErrors",
  "filteredRecords.slice(-limit).reverse()",
]) {
  assertIncludes(
    mcpFeedbackInbox,
    requiredText,
    `MCP feedback inbox parser should include ${requiredText}`,
  );
}

for (const requiredText of [
  "refine_prompt",
  "reviewRequired: true",
  "review_required",
  "handoffPackages",
  "buildTargetAiHandoffPackageText",
  "createPromptPackage",
]) {
  assertIncludes(
    refineContract,
    requiredText,
    `Integrations refine contract should include ${requiredText}`,
  );
}

for (const requiredText of [
  '"manifest_version": 3',
  '"Prompt AI Studio Refine"',
  '"background.js"',
  '"activeTab"',
  '"contextMenus"',
  '"scripting"',
  '"storage"',
  '"http://localhost/*"',
  '"http://127.0.0.1/*"',
]) {
  assertIncludes(
    chromeManifest,
    requiredText,
    `Chrome extension manifest should include ${requiredText}`,
  );
}

for (const requiredText of [
  "Chrome Refine",
  "Studio URL",
  'id="studioUrl"',
  "http://localhost:3000",
  "Refine selected text",
  "Handoff package",
  'id="clearButton"',
  'id="evidenceButton"',
  "Evidence",
  "Clear",
  'rel="icon"',
  'href="data:,"',
  "resultActions",
  'aria-label="Chrome refine workflow"',
  "workflowStep",
  "01",
  "선택 수집",
  "02",
  "Studio 정제",
  "03",
  "검토 전달",
  "review-required handoff",
  'aria-label="Chrome smoke evidence"',
  "Smoke evidence",
  "local only",
  "evidencePanel",
  "evidenceList",
  "evidenceRow",
  "Runtime",
  'id="runtimeEvidence"',
  "checking Chrome runtime",
  "selected text + source URL",
  "POST /api/integrations/refine · reviewRequired",
  "copy-ready handoff after operator review",
  "handoff evidence packet + manual fallback",
  'aria-label="Handoff review summary"',
  "handoffReview",
  "handoffReviewItem",
  "Review gate",
  'id="reviewGateMeta"',
  "Target AI",
  'id="targetMeta"',
  "Source",
  'id="sourceMeta"',
  "Session",
  'id="sessionMeta"',
  'id="evidenceFallback"',
  'id="evidenceText"',
  "Chrome handoff evidence manual copy",
  "Evidence copy failed. Select this packet manually.",
  "Not saved",
  "popup.js",
]) {
  assertIncludes(
    chromePopupHtml,
    requiredText,
    `Chrome extension popup HTML should include ${requiredText}`,
  );
}

for (const requiredText of [
  ".workflow",
  ".workflowStep",
  ".workflowIndex",
  "grid-template-columns: 34px 1fr",
  "rgba(103, 212, 195, 0.12)",
  ".evidencePanel",
  ".evidenceHeader",
  ".evidenceList",
  ".evidenceRow",
  "grid-template-columns: 78px 1fr",
  ".handoffReview",
  ".handoffReviewItem",
  ".resultHeader .resultActions",
  "flex-wrap: wrap",
  ".evidenceFallback",
  ".evidenceFallback[hidden]",
  "flex: 1 1 0",
  "grid-template-columns: 1fr 1fr",
  ".handoffReviewItem dd",
  "overflow-wrap: anywhere",
]) {
  assertIncludes(
    chromePopupCss,
    requiredText,
    `Chrome extension popup CSS should include ${requiredText}`,
  );
}

assert.match(
  chromePopupHtml,
  /aria-label="Chrome smoke evidence"[\s\S]*?Runtime[\s\S]*?id="runtimeEvidence"[\s\S]*?Capture[\s\S]*?selected text \+ source URL[\s\S]*?Refine[\s\S]*?POST \/api\/integrations\/refine · reviewRequired[\s\S]*?Deliver[\s\S]*?copy-ready handoff after operator review[\s\S]*?Evidence[\s\S]*?handoff evidence packet \+ manual fallback[\s\S]*?id="copyButton"[\s\S]*?id="evidenceButton"[\s\S]*?id="clearButton"[\s\S]*?aria-label="Handoff review summary"[\s\S]*?id="reviewGateMeta"[\s\S]*?id="targetMeta"[\s\S]*?id="sourceMeta"[\s\S]*?id="sessionMeta"[\s\S]*?<textarea id="handoffText"[\s\S]*?id="evidenceFallback"[\s\S]*?id="evidenceText"/,
  "Chrome popup should show smoke evidence, handoff review summary, handoff text, and manual evidence fallback in reading order",
);
assert.match(
  chromePopupCss,
  /\.handoffReview[\s\S]*?grid-template-columns: 1fr 1fr[\s\S]*?\.handoffReviewItem[\s\S]*?min-width: 0[\s\S]*?\.handoffReviewItem dd[\s\S]*?overflow-wrap: anywhere[\s\S]*?\.evidenceFallback[\s\S]*?display: grid[\s\S]*?\.evidenceFallback\[hidden\][\s\S]*?display: none[\s\S]*?#handoffText,[\s\S]*?#evidenceText/,
  "Chrome popup handoff review summary and evidence fallback should stay compact, readable, and hidden until needed",
);

for (const requiredText of [
  "prompt-ai-studio-refine-selection",
  "Refine with Prompt AI Studio",
  "contexts: [\"selection\"]",
  "chrome.storage.session.set",
  "pendingSelection",
  "chrome.action.setBadgeText",
]) {
  assertIncludes(
    chromeBackgroundJs,
    requiredText,
    `Chrome extension background script should include ${requiredText}`,
  );
}

for (const requiredText of [
  "defaultStudioUrl",
  "defaultTargetAI",
  "defaultDomain",
  "defaultGoal",
  "studioUrlStorageKey",
  "targetAIStorageKey",
  "domainStorageKey",
  "goalStorageKey",
  "lastHandoffStorageKey",
  'prompt-ai-studio:url',
  'prompt-ai-studio:target-ai',
  'prompt-ai-studio:domain',
  'prompt-ai-studio:goal',
  'prompt-ai-studio:last-handoff',
  "getChromeExtensionApi",
  "globalThis.chrome",
  "Chrome extension runtime is unavailable; settings were normalized for this preview only.",
  "normalizeStudioUrl",
  "normalizeTargetAI",
  "normalizeTextSetting",
  "localHostnames",
  "getRefineApiUrl",
  "buildHandoffMeta",
  "formatSavedAt",
  "formatSourceLabel",
  "buildRestoredHandoffStatus",
  "runtimeEvidence",
  "reviewGateMeta",
  "targetMeta",
  "sourceMeta",
  "sessionMeta",
  "evidenceFallback",
  "evidenceText",
  "currentEvidencePacket",
  "setHandoffReviewSummary",
  "setRuntimeEvidence",
  "setCurrentEvidencePacket",
  "formatQualityScore",
  "buildHandoffReviewSummary",
  "buildChromeHandoffEvidencePacket",
  "buildRestoredHandoffReviewSummary",
  "Prompt AI Studio Chrome Handoff Evidence",
  "review-required handoff, operator-reviewed delivery, session trace",
  "Model label",
  "Quality score",
  "Operator decision:",
  "Copy only after review gate, target AI, source, and session state are checked.",
  "Chrome handoff evidence packet copied.",
  "Clipboard copy failed. Select the evidence packet manually.",
  'reviewGate: "reviewRequired"',
  "Saved in session",
  "Session restored",
  "hydrateSettings",
  "savePopupSettings",
  "hydrateLastHandoff",
  "saveLastHandoffPackage",
  "clearLastHandoff",
  "copyEvidencePacket",
  "Popup settings saved for local refine requests.",
  "api.storage.local.get",
  "api.storage.local.set",
  "api.storage.session.set",
  "api.storage.session.remove(lastHandoffStorageKey)",
  "Last handoff package restored",
  "target:",
  "saved:",
  "Last handoff package cleared.",
  "requestedTargetAI",
  "sourceTitle",
  "sourceUrl",
  'source: "chrome-refine"',
  "initializePopup",
  "Load this folder as an unpacked Chrome extension to read page selections and restore handoff packages.",
  "extension runtime connected · local Studio URL only",
  "preview only · Chrome runtime unavailable",
  "getRefineApiUrl()",
  "api.storage.session.get",
  "pendingSelection",
  "Context menu selection is ready",
  "api.scripting.executeScript",
  "tab.title || \"\"",
  "tab.url || \"\"",
  "window.getSelection",
  'sourceApp: "chrome"',
  "review required",
  "navigator.clipboard.writeText",
]) {
  assertIncludes(
    chromePopupJs,
    requiredText,
    `Chrome extension popup script should include ${requiredText}`,
  );
}

assert.match(
  chromePopupJs,
  /async function getCurrentSelection\(\)[\s\S]*?const tab = await getActiveTab\(\)[\s\S]*?if \(!api \|\| !tab\?\.id\)[\s\S]*?try \{[\s\S]*?api\.scripting\.executeScript[\s\S]*?window\.getSelection\(\)\?\.toString\(\)[\s\S]*?return result \|\| \{ selection: "", title: tab\.title \|\| "", url: tab\.url \|\| "" \}[\s\S]*?catch \{[\s\S]*?return \{ selection: "", title: tab\.title \|\| "", url: tab\.url \|\| "" \}/,
  "Chrome popup should fall back to active tab metadata when selection scripting is blocked",
);
assert.match(
  chromePopupJs,
  /function setRuntimeEvidence\(api = getChromeExtensionApi\(\)\)[\s\S]*?runtimeEvidence\.textContent = api[\s\S]*?extension runtime connected · local Studio URL only[\s\S]*?preview only · Chrome runtime unavailable[\s\S]*?initializePopup[\s\S]*?await hydrateSettings\(\)[\s\S]*?setRuntimeEvidence\(\)/,
  "Chrome popup script should expose the loaded extension runtime state before smoke evidence is reviewed",
);
assert.match(
  chromePopupJs,
  /function setHandoffReviewSummary\(summary = \{\}\)[\s\S]*?reviewGateMeta\.textContent[\s\S]*?targetMeta\.textContent[\s\S]*?sourceMeta\.textContent[\s\S]*?sessionMeta\.textContent/,
  "Chrome popup script should update the handoff review summary through one helper",
);
assert.match(
  chromePopupJs,
  /function setCurrentEvidencePacket\(packet = ""\)[\s\S]*?currentEvidencePacket = packet[\s\S]*?evidenceText\.value = packet[\s\S]*?evidenceFallback\.hidden = true[\s\S]*?evidenceButton\.disabled = !packet\.trim\(\)[\s\S]*?function buildChromeHandoffEvidencePacket\(details\)[\s\S]*?Prompt AI Studio Chrome Handoff Evidence[\s\S]*?details\.summary\.reviewGate[\s\S]*?details\.summary\.target[\s\S]*?details\.summary\.source[\s\S]*?details\.summary\.session/,
  "Chrome popup script should build and gate the Chrome handoff evidence packet",
);
assert.match(
  chromePopupJs,
  /hydrateLastHandoff[\s\S]*?const restoredSummary = buildRestoredHandoffReviewSummary\(cached\)[\s\S]*?setHandoffReviewSummary\(restoredSummary\)[\s\S]*?setCurrentEvidencePacket\([\s\S]*?buildChromeHandoffEvidencePacket[\s\S]*?refineSelection[\s\S]*?setCurrentEvidencePacket\(\)[\s\S]*?const handoffSummary = buildHandoffReviewSummary\(firstPackage, current, savedAt\)[\s\S]*?setHandoffReviewSummary\(handoffSummary\)[\s\S]*?setCurrentEvidencePacket\([\s\S]*?buildChromeHandoffEvidencePacket[\s\S]*?catch \(error\)[\s\S]*?setHandoffReviewSummary\(\)[\s\S]*?setCurrentEvidencePacket\(\)[\s\S]*?clearLastHandoff[\s\S]*?setHandoffReviewSummary\(\)[\s\S]*?setCurrentEvidencePacket\(\)/,
  "Chrome popup should refresh the handoff review summary and evidence packet on restore, refine start, refine success, error, and clear",
);
assert.match(
  chromePopupJs,
  /function copyEvidencePacket\(\)[\s\S]*?currentEvidencePacket\.trim\(\)[\s\S]*?navigator\.clipboard\.writeText\(currentEvidencePacket\)[\s\S]*?evidenceFallback\.hidden = true[\s\S]*?Chrome handoff evidence packet copied[\s\S]*?catch[\s\S]*?evidenceFallback\.hidden = false[\s\S]*?evidenceText\.focus\(\)[\s\S]*?evidenceText\.select\(\)[\s\S]*?Clipboard copy failed\. Select the evidence packet manually\.[\s\S]*?evidenceButton\.addEventListener\("click", copyEvidencePacket\)/,
  "Chrome popup should copy the current handoff evidence packet and reveal manual fallback on clipboard failure",
);

assertIncludes(
  chromeReadme,
  "Load unpacked",
  "Chrome extension README should document local loading",
);
assertIncludes(
  chromeReadme,
  "npm run smoke:chrome-extension",
  "Chrome extension README should document the local smoke command",
);
assertIncludes(
  chromeReadme,
  "manifest, background selection",
  "Chrome extension README should document the static smoke coverage",
);
assertIncludes(
  chromeReadme,
  "Refine with Prompt AI Studio",
  "Chrome extension README should document the context menu flow",
);
assertIncludes(
  chromeReadme,
  "Invalid or non-local URLs fall back to `http://localhost:3000`.",
  "Chrome extension README should document the local Studio URL guard",
);
assertIncludes(
  chromeReadme,
  "Use `Clear` when the restored",
  "Chrome extension README should document clearing restored handoff packages",
);
assertIncludes(
  chromeReadme,
  "`01 선택 수집`, `02 Studio 정제`,",
  "Chrome extension README should document the popup workflow order",
);
assertIncludes(
  chromeReadme,
  "local refine, and review-required handoff delivery",
  "Chrome extension README should document local refine and handoff delivery",
);
assertIncludes(
  chromeReadme,
  "`Smoke evidence` panel for runtime, capture, refine",
  "Chrome extension README should document the smoke evidence panel",
);
assertIncludes(
  chromeReadme,
  "handoff result area summarizes review gate, target AI, source, and session",
  "Chrome extension README should document the handoff result summary",
);
assertIncludes(
  chromeReadme,
  "Use `Evidence` after a handoff is generated or restored",
  "Chrome extension README should document the Evidence packet action",
);
assertIncludes(
  chromeReadme,
  "manual evidence textarea",
  "Chrome extension README should document the Evidence manual fallback",
);
assertIncludes(
  chromeReadme,
  "Static preview",
  "Chrome extension README should document static preview behavior",
);
assertIncludes(
  chromeReadme,
  "Chrome extension runtime is unavailable",
  "Chrome extension README should document the non-extension runtime status",
);

for (const requiredText of [
  "2025-11-25",
  "initialize",
  "notifications/initialized",
  "tools/list",
  "tools/call",
  "refine_prompt",
  "get_context_profile",
  "create_handoff_package",
  "save_execution_feedback",
  "normalizeHandoffArguments",
  "normalizeFeedbackArguments",
  "PROMPT_AI_STUDIO_FEEDBACK_INBOX",
  "PROMPT_AI_STUDIO_CONTEXT_PROFILE",
  "PROMPT_AI_STUDIO_URL",
  "PROMPT_AI_STUDIO_TARGET_AI",
  "PROMPT_AI_STUDIO_DOMAIN",
  "PROMPT_AI_STUDIO_GOAL",
  "PROMPT_AI_STUDIO_SOURCE_URL",
  "getOperationDefaults",
  "formatOperationDefaults",
  "callRefineWithLocalFallback",
  "createLocalFallbackRefineResponse",
  "Local refine API was unavailable",
  "create_handoff_package fallback self-test",
  "operationDefaults",
  "/api/integrations/refine",
  "structuredContent",
  "createContextProfileResult",
  "reviewRequired",
  "process.stdout.write",
]) {
  assertIncludes(
    mcpBridge,
    requiredText,
    `MCP bridge should include ${requiredText}`,
  );
}

for (const requiredText of [
  "Prompt AI Studio MCP Bridge",
  "get_context_profile",
  "refine_prompt",
  "create_handoff_package",
  "save_execution_feedback",
  "PROMPT_AI_STUDIO_FEEDBACK_INBOX",
  "PROMPT_AI_STUDIO_CONTEXT_PROFILE",
  "PROMPT_AI_STUDIO_TARGET_AI",
  "PROMPT_AI_STUDIO_DOMAIN",
  "PROMPT_AI_STUDIO_GOAL",
  "PROMPT_AI_STUDIO_SOURCE_URL",
  "operation defaults",
  "arguments still take priority.",
  "POST /api/integrations/refine",
  "local MCP fallback package",
  "HTTP errors from a running API are still surfaced as errors",
  "review-required",
  "PROMPT_AI_STUDIO_URL",
  "mcpServers",
  "npm run smoke:mcp",
  "--self-test",
  "temp feedback inbox check",
  "save_execution_feedback` with `confirmSave: true",
  "verifies the same parser used by the Integrations feedback inbox",
]) {
  assertIncludes(
    mcpReadme,
    requiredText,
    `MCP bridge README should include ${requiredText}`,
  );
}

for (const requiredText of [
  "External AI Operator Guide",
  "네가 먼저 할 일",
  "npm run dev",
  "http://localhost:3000/integrations",
  "npm run verify:integrations",
  "로컬 smoke evidence 저장",
  "npm run smoke:learning-feedback -- --out docs/evidence/learning-feedback-smoke.md",
  "실행 증거 체크",
  "로컬 연결: `localhost:3000`과 `POST /api/integrations/refine` 응답을 확인합니다.",
  "정제 결과: `reviewRequired true`와 target handoff package를 확인합니다.",
  "증거 저장: Chrome, MCP, Learning smoke evidence file을 먼저 남깁니다.",
  "전달 승인: copy-ready prompt와 missing context review를 확인한 뒤 붙여넣습니다.",
  "피드백 증거: rating, result summary, inbox record를 `confirmSave: true` 후 확인합니다.",
  "Refine automatically, save evidence, deliver with review.",
  "`chrome-selection`, `mcp-refine`, `local-smoke-evidence`, `target-ai-handoff` 순서",
  "`local-smoke-evidence`가 `target-ai-handoff`보다 먼저 있어야 합니다.",
  "Chrome으로 테스트",
  "npm run smoke:chrome-extension",
  "npm run smoke:chrome-extension -- --out docs/evidence/chrome-extension-smoke.md",
  "Refine with Prompt AI Studio",
  "Studio URL: http://localhost:3000",
  "Codex MCP 설정",
  "npm run smoke:mcp",
  "npm run smoke:mcp -- --out docs/evidence/mcp-bridge-smoke.md",
  "mcp/prompt-ai-studio.mjs --self-test --out docs/evidence/mcp-bridge-smoke.md",
  "PROMPT_AI_STUDIO_TARGET_AI",
  "PROMPT_AI_STUDIO_SOURCE_URL",
  "Use prompt-ai-studio get_context_profile, then refine_prompt.",
  "Claude 또는 GPT-compatible MCP 설정",
  "MCP 도구 사용 순서",
  "get_context_profile",
  "refine_prompt",
  "create_handoff_package",
  "save_execution_feedback",
  "피드백 저장 기준",
  "confirmSave",
  "Learning feedback 큐 smoke evidence를 남깁니다.",
  "Learning feedback 큐 확인",
  "운영 원칙",
  "외부 AI 계정으로의 전달은 항상 사람이 검토한 뒤 복사합니다.",
]) {
  assertIncludes(
    externalAiOperatorGuide,
    requiredText,
    `External AI operator guide should include ${requiredText}`,
  );
}

const mcpSelfTestOutput = execFileSync("npm", ["run", "smoke:mcp"], {
  encoding: "utf8",
});

assertIncludes(
  mcpSelfTestOutput,
  "Prompt AI Studio MCP bridge self-test passed.",
  "MCP bridge self-test should pass",
);

const chromeSmokeOutput = execFileSync("npm", ["run", "smoke:chrome-extension"], {
  encoding: "utf8",
});

assertIncludes(
  chromeSmokeOutput,
  "Chrome extension smoke verification passed.",
  "Chrome extension static smoke should pass",
);

const feedbackInboxPath = join(
  mkdtempSync(join(tmpdir(), "prompt-ai-studio-mcp-")),
  "feedback.jsonl",
);
const mcpToolListOutput = execFileSync(
  "node",
  ["mcp/prompt-ai-studio.mjs"],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      PROMPT_AI_STUDIO_FEEDBACK_INBOX: feedbackInboxPath,
      PROMPT_AI_STUDIO_TARGET_AI: "codex",
      PROMPT_AI_STUDIO_DOMAIN: "개발",
      PROMPT_AI_STUDIO_GOAL: "전문 프롬프트로 변환",
      PROMPT_AI_STUDIO_SOURCE_URL: "mcp://verify",
    },
    input: [
      '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}',
      '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_context_profile","arguments":{"allowedScopes":["company","user"],"purpose":"verify context policy"}}}',
      '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"create_handoff_package","arguments":{"draft":"Package this draft for Codex execution.","targetAI":"codex","deliveryMode":"review_required"}}}',
      '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"save_execution_feedback","arguments":{"resultSummary":"Codex execution passed lint and build.","rating":"positive","targetAI":"codex","confirmSave":true}}}',
      "",
    ].join("\n"),
  },
);

assertIncludes(
  mcpToolListOutput,
  "get_context_profile",
  "MCP bridge stdio tools/list should expose get_context_profile",
);
assertIncludes(
  mcpToolListOutput,
  "Prompt AI Studio Context Profile",
  "MCP bridge stdio tools/call should return a context profile summary",
);
assertIncludes(
  mcpToolListOutput,
  "Operation defaults: targetAI: codex",
  "MCP bridge stdio get_context_profile should expose operation defaults",
);
assertIncludes(
  mcpToolListOutput,
  "create_handoff_package",
  "MCP bridge stdio tools/list should expose create_handoff_package",
);
assertIncludes(
  mcpToolListOutput,
  "Target AI Handoff Package",
  "MCP bridge stdio create_handoff_package should return a handoff package",
);
assertIncludes(
  mcpToolListOutput,
  "save_execution_feedback",
  "MCP bridge stdio tools/list should expose save_execution_feedback",
);
assertIncludes(
  mcpToolListOutput,
  "Prompt AI Studio Execution Feedback",
  "MCP bridge stdio save_execution_feedback should return a feedback summary",
);
assertIncludes(
  mcpToolListOutput,
  '"saved":true',
  "MCP bridge stdio save_execution_feedback should report confirmed saves",
);
const savedFeedbackInboxText = readFileSync(feedbackInboxPath, "utf8");
assertIncludes(
  savedFeedbackInboxText,
  "Codex execution passed lint and build.",
  "MCP bridge stdio save_execution_feedback should write confirmed feedback",
);
const savedFeedbackSnapshot = parseMcpFeedbackInboxText(savedFeedbackInboxText, {
  rating: "positive",
  targetAI: "codex",
});
assert.equal(
  savedFeedbackSnapshot.filteredCount,
  1,
  "MCP bridge confirmed feedback should be readable through the feedback inbox parser",
);
assert.equal(
  savedFeedbackSnapshot.records[0]?.targetAI,
  "codex",
  "MCP bridge confirmed feedback should preserve targetAI",
);
assert.equal(
  savedFeedbackSnapshot.records[0]?.rating,
  "positive",
  "MCP bridge confirmed feedback should preserve rating",
);
assert.equal(
  savedFeedbackSnapshot.records[0]?.resultSummary,
  "Codex execution passed lint and build.",
  "MCP bridge confirmed feedback should preserve result summary",
);
assertIncludes(
  mcpToolListOutput,
  "readOnly",
  "MCP bridge stdio tools/call should return structured read-only context",
);

assertIncludes(
  readme,
  "Chrome, GPT/Claude/Codex/Gemini, MCP 클라이언트 연결 표면",
  "README should document the external AI integrations surface",
);
assertIncludes(
  readme,
  "Integrations 운영 흐름 요약",
  "README should document the integrations operation flow summary",
);
assertIncludes(
  readme,
  "Integrations 지원 환경 요약: Chrome, ChatGPT/Claude/Gemini, Codex, MCP의 역할과 현재 gate를 모바일 2열과 데스크톱 4열로 먼저 보여주고, 외부 AI 표면은 로컬 smoke evidence 저장 후 reviewRequired package만 전달하는 기준을 명시",
  "README should document the integrations support environment summary",
);
assertIncludes(
  readme,
  "Integrations 연결 계약 매트릭스: Chrome, ChatGPT/Claude/Gemini, Codex, MCP별 capture, package, review gate, feedback 산출물을 같은 카드 구조로 보여줘 각 환경이 같은 review-required/confirmSave 계약을 어떻게 지키는지 한눈에 확인하게 합니다.",
  "README should document the integrations execution contract matrix",
);
assertIncludes(
  readme,
  "Integrations 실행 증거 체크: 로컬 연결, 정제 결과, 증거 저장, 전달 승인, 피드백 증거별로 남아야 할 evidence와 이동 링크를 먼저 보여줘 외부 AI 실행 전후의 검증 기준을 놓치지 않게 합니다.",
  "README should document the integrations execution evidence checklist",
);
assertIncludes(
  readme,
  "Integrations Smoke 증거 경로: MCP bridge, Chrome popup, Learning feedback 큐 smoke가 각각 command, evidence, result로 어떻게 이어지는지 상단에서 대조하고 상세 섹션으로 이동하게 합니다.",
  "README should document the integrations smoke evidence path",
);
assertIncludes(
  readme,
  "Capture, Refine, Evidence, Deliver, Feedback",
  "README should document the integrations operation flow phases",
);
assertIncludes(
  readme,
  "Capture, Refine, Evidence, Deliver, Feedback 단계별 owner, artifact, gate를 카드로 먼저 보여준 뒤 상세 표를 유지합니다.",
  "README should document responsive integrations operation flow cards",
);
assertIncludes(
  readme,
  "Integrations 자동화 원칙과 출시 순서는 기본 모드를 `Refine automatically, save evidence, deliver with review.`로 표시하고 `local-smoke-evidence`를 `target-ai-handoff` 전에 남기도록 보여줘 감사 출처와 출시 단계가 같은 evidence-first 흐름을 따르게 합니다.",
  "README should document local smoke evidence in automation principles and rollout order",
);
assertIncludes(
  readme,
  "상세 섹션 앵커 이동",
  "README should document operation flow detail anchors",
);
assertIncludes(
  readme,
  "빠른 이동 내비게이션",
  "README should document integrations quick navigation",
);
assertIncludes(
  readme,
  "섹션별 용도 설명",
  "README should document integrations quick navigation descriptions",
);
assertIncludes(
  readme,
  "검증 게이트 요약",
  "README should document integrations gate summary",
);
assertIncludes(
  readme,
  "로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장",
  "README should document integrations gate summary stages",
);
assertIncludes(
  readme,
  "게이트별 상세 이동",
  "README should document integrations gate summary links",
);
assertIncludes(
  readme,
  "Integrations 검증 게이트 요약은 모바일 2열과 데스크톱 4열로 로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장 상태를 짧게 훑게 합니다.",
  "README should document responsive integrations gate summary metrics",
);
assertIncludes(
  readme,
  "Integrations 외부 AI 운영 가이드",
  "README should document the external AI operator guide panel",
);
assertIncludes(
  readme,
  "로컬 앱 실행, 연결 표면 1개 선택, review-required 결과 확인",
  "README should document the external AI operator guide steps",
);
assertIncludes(
  readme,
  "운영 단계, 첫 실행, review-required 전달 gate, confirmSave 피드백 저장 gate를 모바일 2열 요약으로 먼저 보여주고",
  "README should document external AI operator guide summary metrics",
);
assertIncludes(
  readme,
  "로컬 smoke evidence 저장, 외부 AI 수동 전달, confirmSave 피드백 저장 판단 순서",
  "README should document external AI operator guide smoke evidence step",
);
assertIncludes(
  readme,
  "운영 가이드 복사/`integrations-operations-checklist` Studio 초안에는 실행 증거 체크와 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함",
  "README should document external AI operator guide copied package evidence checklist and audit source order",
);
assertIncludes(
  readme,
  "운영 가이드 복사",
  "README should document external AI operator guide copy",
);
assertIncludes(
  readme,
  "Studio 초안 전송 제공",
  "README should document external AI operator guide Studio handoff",
);
assertIncludes(
  readme,
  "Integrations 환경별 실행 가이드",
  "README should document the environment playbook guide",
);
assertIncludes(
  readme,
  "연결 환경, 대상 AI 범위, smoke evidence 저장과 review-required gate, confirmSave 피드백 경로를 모바일 2열 요약으로 먼저 보여주고",
  "README should document environment playbook summary metrics",
);
assertIncludes(
  readme,
  "각 환경의 operator check에서 local smoke evidence 저장을 외부 전달과 confirmSave 저장보다 먼저 고정합니다.",
  "README should document environment operator checks as evidence-first",
);
assertIncludes(
  readme,
  "전체 체크리스트 Studio 전송 패키지에는 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함하고",
  "README should document environment checklist audit source order",
);
assertIncludes(
  readme,
  "Studio 초안 원본 경로는 `#integrations-environment-guide`로 돌아오게 합니다.",
  "README should document environment checklist Studio source anchor",
);
assertIncludes(
  readme,
  "docs/external-ai-operator-guide.md",
  "README should link the external AI operator guide",
);
assertIncludes(
  readme,
  "환경별 체크리스트 복사",
  "README should document environment checklist copy",
);
assertIncludes(
  readme,
  "전체 체크리스트 복사",
  "README should document all-environment checklist copy",
);
assertIncludes(
  readme,
  "전체 체크리스트 Studio 전송 패키지",
  "README should document all-environment checklist Studio handoff",
);
assertIncludes(
  readme,
  "환경별 체크리스트 Studio 전송",
  "README should document per-environment checklist Studio handoff",
);
assertIncludes(
  readme,
  "integrations-operations-checklist",
  "README should document integrations operations checklist source",
);
assertIncludes(
  readme,
  "Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 다음 조치 원문을 표시",
  "README should document operator next actions Studio draft fallback",
);
assertIncludes(
  readme,
  "Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 운영 가이드 원문을 표시",
  "README should document external AI operator guide Studio draft fallback",
);
assertIncludes(
  readme,
  "Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 체크리스트 원문을 표시",
  "README should document environment checklist Studio draft fallback",
);
assertIncludes(
  readme,
  "Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 runbook 원문을 표시",
  "README should document MCP runbook Studio draft fallback",
);
assertIncludes(
  readme,
  "runbook 버튼 전 화면 요약과 복사/Studio 초안 원문에 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함",
  "README should document MCP runbook visible and copied audit source order",
);
assertIncludes(
  readme,
  "Studio 초안 원본 경로는 `#integrations-mcp-connection`으로 돌아오게 합니다.",
  "README should document MCP runbook Studio source anchor",
);
assertIncludes(
  readme,
  "Chrome extension, ChatGPT/Claude/Gemini, Codex, MCP client별 connection mode, trigger, Studio action, output, operator check",
  "README should document the environment playbook fields",
);
assertIncludes(
  readme,
  "target AI",
  "README should document target AI visibility",
);
assertIncludes(
  readme,
  "POST /api/integrations/refine",
  "README should document the integrations refine API",
);
assertIncludes(
  readme,
  "Integrations refine tester",
  "README should document the integrations refine tester",
);
assertIncludes(
  readme,
  "Integrations refine tester는 수집 경로, 대상 AI, 검토 gate, 전달 패키지 상태를 실행 버튼 앞에서 확인하게 하고, 요청 source/target/domain/goal과 reviewRequired/target package/quality/language 요약을 모바일 2열로 먼저 보여주며, 복사 전 체크리스트에서 로컬 smoke evidence 저장을 먼저 확인하게 하고, raw payload와 handoff package 원문은 별도 preview로 유지합니다.",
  "README should document the refine tester handoff review metrics",
);
assertIncludes(
  readme,
  "extensions/chrome",
  "README should document the Chrome extension scaffold",
);
assertIncludes(
  readme,
  "Chrome popup 실행 순서는 `01 선택 수집`, `02 Studio 정제`, `03 검토 전달` 단계로 선택 텍스트, local refine API, review-required handoff 복사 흐름을 먼저 보여주고",
  "README should document the Chrome popup workflow order",
);
assertIncludes(
  readme,
  "Smoke evidence 패널은 runtime/capture/refine/deliver/evidence packet 증거를 같은 popup에서 대조하게 합니다.",
  "README should document the Chrome popup smoke evidence panel",
);
assertIncludes(
  readme,
  "Handoff result summary는 review gate, target AI, source, session 저장 상태를 handoff 원문 위에서 먼저 보여주며",
  "README should document the Chrome popup handoff result summary",
);
assertIncludes(
  readme,
  "Evidence 버튼은 같은 결과 기준의 Chrome handoff evidence packet을 복사하고 실패 시 수동 복사용 evidence textarea를 엽니다.",
  "README should document the Chrome popup handoff evidence packet and manual fallback",
);
assertIncludes(
  readme,
  "정적 preview에서는 Chrome extension runtime unavailable 상태를 표시하고 page selection/session restore를 건너뛰어 layout smoke를 안정적으로 수행합니다.",
  "README should document Chrome popup static preview behavior",
);
assertIncludes(
  readme,
  "mcp/prompt-ai-studio.mjs",
  "README should document the MCP bridge",
);
assertIncludes(
  readme,
  "Integrations MCP 연결 설정은 대상 클라이언트 수, 공유 mcpServers config, --self-test 첫 검증, confirmSave 피드백 gate를 모바일 2열 요약으로 먼저 보여주고",
  "README should document MCP connection summary metrics",
);
assertIncludes(
  readme,
  "Claude/Codex/GPT-compatible client별 config scope, target AI, use case, operator gate를 카드로 먼저 구분하고",
  "README should document MCP client setup cards",
);
assertIncludes(
  readme,
  "UI/API/curl 검증 경로를 카드로 먼저 보여준 뒤 상세 검증 매트릭스",
  "README should document MCP feedback verification cards",
);
assertIncludes(
  readme,
  "GET /api/integrations/mcp-feedback",
  "README should document the MCP feedback inbox API",
);
assertIncludes(
  readme,
  "저장 상태, 현재 결과, 현재 필터, 검증 상태를 모바일 2열 요약으로 먼저 보여주며",
  "README should document MCP feedback review summary metrics",
);
assertIncludes(
  readme,
  "다음 확인 액션을 포함한 Feedback 증빙 패킷",
  "README should document MCP feedback evidence next action",
);
assertIncludes(
  readme,
  "Learning candidate와 Studio 개선 초안은 confirmSave true와 evidence-ready trace를 포함해 재사용 전 audit 기준을 보존합니다.",
  "README should document MCP feedback reusable drafts carrying confirmSave evidence trace",
);
assertIncludes(
  readme,
  "원본 필터 링크, record trace, 다음 확인 액션을 포함한 feedback report",
  "README should document MCP feedback record evidence and Studio improvement draft copy",
);
assertIncludes(
  readme,
  "`trace-ready` source title이 붙은 `mcp-feedback-report` 운영 리포트 Studio 초안",
  "README should document MCP feedback report trace-ready Studio title",
);
assertIncludes(
  readme,
  "저장 후 confirmSave evidence trace가 저장본에 반영됐는지 확인",
  "README should document MCP feedback saved result confirmSave evidence trace check",
);
assertIncludes(
  readme,
  "`evidence-ready` source title이 붙은 `mcp-feedback-improvement` 단건 Studio 초안",
  "README should document MCP feedback improvement evidence-ready Studio title",
);
assertIncludes(
  readme,
  "mcp-feedback-improvement",
  "README should document MCP feedback Studio draft source",
);
assertIncludes(
  readme,
  "mcp-feedback-report",
  "README should document MCP feedback report Studio draft source",
);
assertIncludes(
  readme,
  "mcpRating",
  "README should document MCP feedback URL rating filter",
);
assertIncludes(
  readme,
  "Integrations 연결 실행 순서: 로컬 앱, 입력 수집, 증거 저장, 검토 전달, 피드백 저장을 첫 화면에서 확인",
  "README should document the integrations execution strip",
);
assertIncludes(
  readme,
  "Chrome loaded smoke 체크리스트와 증빙 패킷으로 runtime, capture, result, session restore, evidence fallback 증거를 같은 순서로 확인하고 복사하게 하며",
  "README should document connection readiness loaded Chrome evidence",
);
assertIncludes(
  readme,
  "실제 Chrome popup에서 확인한 runtime/source/review gate/target AI/session/evidence result 값을 operator evidence packet, confirmSave false 기본의 `save_execution_feedback` payload, confirmSave true 저장 후 Feedback inbox UI/API/curl 확인 명령으로 복사하게 하고",
  "README should document actual Chrome loaded operator evidence",
);
assertIncludes(
  readme,
  "mcpTargetAI",
  "README should document MCP feedback URL target AI filter",
);
assertIncludes(
  readme,
  "현재 필터 링크 복사",
  "README should document MCP feedback filter link copy",
);
assertIncludes(
  readme,
  "원본 필터 링크, record trace, 다음 확인 액션을 포함한 feedback report",
  "README should document MCP feedback report filter link",
);
assertIncludes(
  readme,
  "필터 초기화",
  "README should document MCP feedback filter reset",
);
assertIncludes(
  readme,
  "npm run verify:integrations",
  "README Scripts should document the integrations verification command",
);
assertIncludes(
  prd,
  "로컬 앱, 입력 수집, 증거 저장, 검토 전달, 피드백 저장",
  "PRD should document the integrations execution sequence",
);
assertIncludes(
  prd,
  "Chrome, GPT, Claude, Codex, Gemini, MCP 클라이언트",
  "PRD should include the external AI and MCP integration direction",
);
assertIncludes(
  prd,
  "Integrations 지원 환경 요약은 Chrome, ChatGPT/Claude/Gemini, Codex, MCP의 역할과 현재 gate를 모바일 2열과 데스크톱 4열로 먼저 보여주고, 외부 AI 표면은 로컬 smoke evidence 저장 후 reviewRequired package만 전달하는 기준을 명시해야 한다.",
  "PRD should document the integrations support environment summary",
);
assertIncludes(
  prd,
  "Integrations 연결 계약 매트릭스는 Chrome, ChatGPT/Claude/Gemini, Codex, MCP별 capture, package, review gate, feedback 산출물을 같은 카드 구조로 보여줘 각 환경이 같은 review-required/confirmSave 계약을 어떻게 지키는지 한눈에 확인하게 해야 한다.",
  "PRD should document the integrations execution contract matrix",
);
assertIncludes(
  prd,
  "Integrations 실행 증거 체크는 로컬 연결, 정제 결과, 증거 저장, 전달 승인, 피드백 증거별로 남아야 할 evidence와 이동 링크를 먼저 보여줘 외부 AI 실행 전후의 검증 기준을 놓치지 않게 해야 한다.",
  "PRD should document the integrations execution evidence checklist",
);
assertIncludes(
  prd,
  "Integrations Smoke 증거 경로는 MCP bridge, Chrome popup, Learning feedback 큐 smoke가 각각 command, evidence, result로 어떻게 이어지는지 상단에서 대조하고 상세 섹션으로 이동하게 해야 한다.",
  "PRD should document the integrations smoke evidence path",
);
assertIncludes(
  prd,
  "Integrations 운영 흐름은 Capture, Refine, Evidence, Deliver, Feedback 단계별 owner, artifact, gate를 카드로 먼저 보여준 뒤 상세 표를 유지해야 한다.",
  "PRD should document the evidence step in the integrations operation flow",
);
assertIncludes(
  prd,
  "Integrations 자동화 원칙과 출시 순서는 기본 모드를 `Refine automatically, save evidence, deliver with review.`로 표시하고 `local-smoke-evidence`를 `target-ai-handoff` 전에 남기도록 보여줘 감사 출처와 출시 단계가 같은 evidence-first 흐름을 따라야 한다.",
  "PRD should document local smoke evidence in automation principles and rollout order",
);
assertIncludes(
  prd,
  "Integrations 검증 게이트 요약은 로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장 상태를 모바일 2열과 데스크톱 4열로 먼저 보여줘야 한다.",
  "PRD should document integrations gate summary evidence stage",
);
assertIncludes(
  prd,
  "Chrome popup 실행 순서는 `01 선택 수집`, `02 Studio 정제`, `03 검토 전달` 단계로 선택 텍스트, local refine API, review-required handoff 복사 흐름을 먼저 보여줘야 한다.",
  "PRD should document the Chrome popup workflow order",
);
assertIncludes(
  prd,
  "Chrome popup Smoke evidence 패널은 runtime/capture/refine/deliver/evidence packet 증거를 같은 popup에서 보여줘 정적 preview와 loaded extension smoke를 같은 기준으로 확인하게 해야 한다.",
  "PRD should document the Chrome popup smoke evidence panel",
);
assertIncludes(
  prd,
  "Chrome popup handoff result summary는 review gate, target AI, source, session 저장 상태를 handoff 원문 위에서 먼저 보여줘 복사 가능 여부를 판단하게 해야 한다.",
  "PRD should document the Chrome popup handoff result summary",
);
assertIncludes(
  prd,
  "Chrome popup Evidence 버튼은 생성 또는 복원된 handoff 결과의 review gate, target AI, source, session, model, quality, domain, goal을 Chrome handoff evidence packet으로 복사하고 실패 시 수동 복사용 evidence textarea를 열게 해야 한다.",
  "PRD should document the Chrome popup handoff evidence packet and manual fallback",
);
assertIncludes(
  prd,
  "Chrome popup 정적 preview는 Chrome extension runtime unavailable 상태를 표시하고 page selection/session restore를 건너뛰어 layout smoke를 안정적으로 수행할 수 있어야 한다.",
  "PRD should document Chrome popup static preview behavior",
);
assertIncludes(
  prd,
  "Integrations 연결 준비도는 Chrome loaded smoke 체크리스트와 증빙 패킷으로 runtime, capture, result, session restore, evidence fallback 증거를 같은 순서로 보여주고 복사하게 해 실제 extension 로드 상태의 통과 기준과 기록 기준을 확인하게 해야 한다.",
  "PRD should document the loaded Chrome smoke checklist and evidence packet",
);
assertIncludes(
  prd,
  "Integrations 연결 준비도는 실제 Chrome popup에서 확인한 runtime, source, review gate, target AI, session, evidence result 값을 operator evidence packet, confirmSave false 기본의 `save_execution_feedback` payload, confirmSave true 저장 후 Feedback inbox UI/API/curl 확인 명령으로 복사하게 해 자동화 도구가 extension 로드를 직접 수행하지 못해도 실행 증빙, 학습 후보, 저장 확인 경로를 제품 안에 남기게 해야 한다.",
  "PRD should document actual Chrome loaded operator evidence",
);
assertIncludes(
  prd,
  "Integrations refine tester는 수집 경로, 대상 AI, 검토 gate, 전달 패키지 상태를 실행 버튼 앞에서 확인하게 하고, 요청 source/target/domain/goal과 reviewRequired/target package/quality/language 요약을 모바일 2열로 먼저 보여주며, 복사 전 체크리스트에서 로컬 smoke evidence 저장을 먼저 확인하게 하고, raw payload와 handoff package 원문은 별도 preview로 유지해야 한다.",
  "PRD should document the refine tester handoff review metrics",
);
assertIncludes(
  prd,
  "Integrations MCP feedback inbox는 `save_execution_feedback`으로 confirmSave된 외부 AI 실행 피드백을 저장 상태, 현재 결과, 현재 필터, 검증 상태의 모바일 2열 요약으로 먼저 보여주고, 비어 있는 inbox에서는 `confirmSave: true` 저장 예시를 복사해 첫 feedback record를 만들 수 있게 하며, 저장된 각 record에서는 Feedback ID, confirmSave gate, 증빙 준비 상태를 확인한 뒤 다음 확인 액션을 포함한 Feedback 증빙 패킷, learning memory candidate, Studio 개선 초안을 복사하고 learning candidate와 Studio 개선 초안에는 confirmSave true와 evidence-ready trace를 포함해 재사용 전 audit 기준을 보존해야 한다. 단건 개선 초안의 `evidence-ready` source title과 feedback report의 `trace-ready` source title에는 같은 record trace와 다음 확인 액션을 포함해야 한다. Studio에서 단건 개선 초안을 불러오면 learning candidate와 Studio 개선 초안 비교를 먼저 안내하고, feedback report 초안을 불러오면 단건 evidence-ready 초안과 trace-ready report의 confirmSave evidence trace 비교를 먼저 안내해야 한다. 저장 후에도 confirmSave evidence trace와 각 비교 결과가 저장본에 반영됐는지 확인하게 하고 Feedback inbox 복귀 링크를 보존해야 하며, 복귀 클릭 후 같은 `mcpRating`/`mcpTargetAI` 필터와 `#integrations-feedback-inbox` 앵커를 복원해야 한다. Studio 초안 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시해야 한다.",
  "PRD should document MCP feedback review summary metrics",
);
assertIncludes(
  prd,
  "Integrations operations checklist 계열 Studio 전송은 운영자 다음 조치, 외부 AI 운영 가이드, 환경별 실행 가이드, MCP smoke runbook 초안 저장에 실패하면 Studio로 이동하지 않고 해당 원문을 수동 복사용 textarea로 표시해야 한다.",
  "PRD should document integrations operations checklist Studio draft fallback",
);
assertIncludes(
  prd,
  "Integrations 연결 준비도는 연결 표면, 첫 실행 표면, smoke 명령, smoke evidence 저장과 review-required 승인 gate를 모바일 2열 요약으로 먼저 보여줘야 한다.",
  "PRD should document connection readiness summary metrics",
);
assertIncludes(
  prd,
  "Integrations 외부 AI 운영 가이드는 운영 단계, 첫 실행, review-required 전달 gate, confirmSave 피드백 저장 gate를 모바일 2열 요약으로 먼저 보여주고, 외부 AI 전달 전 로컬 smoke evidence 저장 단계와 실행 증거 체크를 포함해야 한다.",
  "PRD should document external AI operator guide summary metrics and evidence checklist",
);
assertIncludes(
  prd,
  "운영 가이드 복사와 `integrations-operations-checklist` Studio 초안은 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함해야 한다.",
  "PRD should document external AI operator guide copied package audit source order",
);
assertIncludes(
  prd,
  "Integrations MCP 연결 설정은 대상 클라이언트 수, 공유 mcpServers config, --self-test 첫 검증, confirmSave 피드백 gate를 모바일 2열 요약으로 먼저 보여줘야 한다.",
  "PRD should document MCP connection summary metrics",
);
assertIncludes(
  prd,
  "Integrations MCP runbook 섹션은 복사와 Studio 초안 버튼 전에 감사 출처와 evidence gate 요약을 먼저 보여줘야 한다.",
  "PRD should document MCP runbook visible evidence trace summary",
);
assertIncludes(
  prd,
  "Integrations MCP end-to-end smoke runbook 복사와 `integrations-operations-checklist` Studio 초안은 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함해야 한다.",
  "PRD should document MCP runbook audit source order",
);
assertIncludes(
  prd,
  "Integrations MCP runbook Studio 초안의 원본 경로는 `/integrations#integrations-mcp-connection`으로 저장해 Studio에서 원본으로 돌아갈 때 MCP 연결 섹션을 복원해야 한다.",
  "PRD should document MCP runbook Studio source anchor",
);
assertIncludes(
  prd,
  "Integrations MCP client examples는 Claude/Codex/GPT-compatible client별 config scope, target AI, use case, operator gate를 카드로 먼저 구분해 보여줘야 한다.",
  "PRD should document MCP client setup cards",
);
assertIncludes(
  prd,
  "Integrations MCP feedback verification은 client별 UI filter, API endpoint, curl check를 카드로 먼저 보여준 뒤 상세 검증 매트릭스를 유지해야 한다.",
  "PRD should document MCP feedback verification cards",
);
assertIncludes(
  prd,
  "Integrations 환경별 실행 가이드는 연결 환경, 대상 AI 범위, smoke evidence 저장과 review-required gate, confirmSave 피드백 경로를 모바일 2열 요약으로 먼저 보여줘야 한다.",
  "PRD should document environment playbook summary metrics",
);
assertIncludes(
  prd,
  "Integrations 환경별 실행 가이드는 Chrome extension, ChatGPT/Claude/Gemini, Codex, MCP client별 operator check에서 local smoke evidence 저장을 외부 전달과 confirmSave 저장보다 먼저 확인하게 해야 한다.",
  "PRD should document environment operator checks as evidence-first",
);
assertIncludes(
  prd,
  "환경별 체크리스트 복사와 `integrations-operations-checklist` Studio 초안은 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함해야 한다.",
  "PRD should document environment checklist audit source order",
);
assertIncludes(
  prd,
  "Integrations 환경별 체크리스트 Studio 초안의 원본 경로는 `/integrations#integrations-environment-guide`로 저장해 Studio에서 원본으로 돌아갈 때 환경별 실행 가이드 섹션을 복원해야 한다.",
  "PRD should document environment checklist Studio source anchor",
);
assertIncludes(
  developmentBrief,
  "### `/integrations`",
  "Development brief should document the Integrations route",
);
assertIncludes(
  developmentBrief,
  "Integrations 연결 실행 순서",
  "Development brief should document the integrations execution sequence",
);
assertIncludes(
  developmentBrief,
  "로컬 앱, 입력 수집, 증거 저장, 검토 전달, 피드백 저장을 첫 화면에 표시",
  "Development brief should document the evidence step in the integrations execution sequence",
);
assertIncludes(
  developmentBrief,
  "smoke evidence 저장, copy-ready 전달, confirmSave 피드백 저장 책임",
  "Development brief should document smoke evidence responsibility in the integrations execution sequence",
);
assertIncludes(
  developmentBrief,
  "Integrations 지원 환경 요약에서 Chrome, ChatGPT/Claude/Gemini, Codex, MCP의 역할과 현재 gate를 모바일 2열과 데스크톱 4열로 먼저 보여주고, 외부 AI 표면은 로컬 smoke evidence 저장 후 reviewRequired package만 전달하는 기준을 명시하게 한다",
  "Development brief should document the integrations support environment summary",
);
assertIncludes(
  developmentBrief,
  "Integrations 연결 계약 매트릭스에서 Chrome, ChatGPT/Claude/Gemini, Codex, MCP별 capture, package, review gate, feedback 산출물을 같은 카드 구조로 보여줘 각 환경이 같은 review-required/confirmSave 계약을 어떻게 지키는지 한눈에 확인하게 한다",
  "Development brief should document the integrations execution contract matrix",
);
assertIncludes(
  developmentBrief,
  "Integrations 실행 증거 체크에서 로컬 연결, 정제 결과, 증거 저장, 전달 승인, 피드백 증거별로 남아야 할 evidence와 이동 링크를 먼저 보여줘 외부 AI 실행 전후의 검증 기준을 놓치지 않게 한다",
  "Development brief should document the integrations execution evidence checklist",
);
assertIncludes(
  developmentBrief,
  "Integrations Smoke 증거 경로에서 MCP bridge, Chrome popup, Learning feedback 큐 smoke가 각각 command, evidence, result로 어떻게 이어지는지 상단에서 대조하고 상세 섹션으로 이동하게 한다",
  "Development brief should document the integrations smoke evidence path",
);
assertIncludes(
  developmentBrief,
  "Integrations 연결 준비도 점검에서 연결 표면, 첫 실행 표면, smoke 명령, smoke evidence 저장과 review-required 승인 gate를 모바일 2열 요약으로 먼저 보여주고",
  "Development brief should document connection readiness summary metrics",
);
assertIncludes(
  developmentBrief,
  "Integrations 운영 흐름 요약",
  "Development brief should document the integrations operation flow summary",
);
assertIncludes(
  developmentBrief,
  "Capture, Refine, Evidence, Deliver, Feedback",
  "Development brief should document the integrations operation flow phases",
);
assertIncludes(
  developmentBrief,
  "Capture, Refine, Evidence, Deliver, Feedback 단계별 owner, artifact, gate를 카드로 먼저 보여준 뒤 상세 표를 유지한다",
  "Development brief should document responsive integrations operation flow cards",
);
assertIncludes(
  developmentBrief,
  "Integrations 자동화 원칙과 출시 순서는 기본 모드를 `Refine automatically, save evidence, deliver with review.`로 표시하고 `local-smoke-evidence`를 `target-ai-handoff` 전에 남기도록 보여줘 감사 출처와 출시 단계가 같은 evidence-first 흐름을 따르게 한다",
  "Development brief should document local smoke evidence in automation principles and rollout order",
);
assertIncludes(
  developmentBrief,
  "상세 섹션 앵커 이동",
  "Development brief should document operation flow detail anchors",
);
assertIncludes(
  developmentBrief,
  "빠른 이동 내비게이션",
  "Development brief should document integrations quick navigation",
);
assertIncludes(
  developmentBrief,
  "섹션별 용도 설명",
  "Development brief should document integrations quick navigation descriptions",
);
assertIncludes(
  developmentBrief,
  "검증 게이트 요약",
  "Development brief should document integrations gate summary",
);
assertIncludes(
  developmentBrief,
  "로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장",
  "Development brief should document integrations gate summary stages",
);
assertIncludes(
  developmentBrief,
  "Integrations 검증 게이트 요약은 모바일 2열과 데스크톱 4열로 로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장 상태를 짧게 훑게 한다",
  "Development brief should document responsive integrations gate summary metrics",
);
assertIncludes(
  developmentBrief,
  "게이트별 상세 이동",
  "Development brief should document integrations gate summary links",
);
assertIncludes(
  developmentBrief,
  "Integrations 외부 AI 운영 가이드",
  "Development brief should document the external AI operator guide panel",
);
assertIncludes(
  developmentBrief,
  "로컬 앱 실행, 연결 표면 1개 선택, review-required 결과 확인",
  "Development brief should document the external AI operator guide steps",
);
assertIncludes(
  developmentBrief,
  "운영 단계, 첫 실행, review-required 전달 gate, confirmSave 피드백 저장 gate를 모바일 2열 요약으로 먼저 보여주고",
  "Development brief should document external AI operator guide summary metrics",
);
assertIncludes(
  developmentBrief,
  "로컬 smoke evidence 저장, 외부 AI 수동 전달, confirmSave 피드백 저장 판단 순서",
  "Development brief should document external AI operator guide smoke evidence step",
);
assertIncludes(
  developmentBrief,
  "운영 가이드 복사/`integrations-operations-checklist` Studio 초안에는 실행 증거 체크와 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함",
  "Development brief should document external AI operator guide copied package evidence checklist and audit source order",
);
assertIncludes(
  developmentBrief,
  "운영 가이드 복사",
  "Development brief should document external AI operator guide copy",
);
assertIncludes(
  developmentBrief,
  "Studio 초안 전송 제공",
  "Development brief should document external AI operator guide Studio handoff",
);
assertIncludes(
  developmentBrief,
  "환경별 실행 가이드",
  "Development brief should document the environment playbook guide",
);
assertIncludes(
  developmentBrief,
  "환경별 실행 가이드에서 연결 환경, 대상 AI 범위, smoke evidence 저장과 review-required gate, confirmSave 피드백 경로를 모바일 2열 요약으로 먼저 보여주고",
  "Development brief should document environment playbook summary metrics",
);
assertIncludes(
  developmentBrief,
  "각 환경의 operator check에서 local smoke evidence 저장을 외부 전달과 confirmSave 저장보다 먼저 고정한다.",
  "Development brief should document environment operator checks as evidence-first",
);
assertIncludes(
  developmentBrief,
  "`integrations-operations-checklist` 전체 체크리스트 Studio 전송 패키지는 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함",
  "Development brief should document environment checklist audit source order",
);
assertIncludes(
  developmentBrief,
  "Studio 초안 원본 경로는 `#integrations-environment-guide`로 돌아오게 한다.",
  "Development brief should document environment checklist Studio source anchor",
);
assertIncludes(
  developmentBrief,
  "환경별 체크리스트 복사",
  "Development brief should document environment checklist copy",
);
assertIncludes(
  developmentBrief,
  "전체 체크리스트 복사",
  "Development brief should document all-environment checklist copy",
);
assertIncludes(
  developmentBrief,
  "전체 체크리스트 Studio 전송 패키지",
  "Development brief should document all-environment checklist Studio handoff",
);
assertIncludes(
  developmentBrief,
  "환경별 체크리스트 Studio 전송",
  "Development brief should document per-environment checklist Studio handoff",
);
assertIncludes(
  developmentBrief,
  "integrations-operations-checklist",
  "Development brief should document integrations operations checklist source",
);
assertIncludes(
  developmentBrief,
  "Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 다음 조치 원문 표시",
  "Development brief should document operator next actions Studio draft fallback",
);
assertIncludes(
  developmentBrief,
  "Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 운영 가이드 원문 표시",
  "Development brief should document external AI operator guide Studio draft fallback",
);
assertIncludes(
  developmentBrief,
  "Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 체크리스트 원문 표시",
  "Development brief should document environment checklist Studio draft fallback",
);
assertIncludes(
  developmentBrief,
  "Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 runbook 원문 표시",
  "Development brief should document MCP runbook Studio draft fallback",
);
assertIncludes(
  developmentBrief,
  "runbook 버튼 전 화면 요약과 복사/Studio 초안 원문에 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함",
  "Development brief should document MCP runbook visible and copied audit source order",
);
assertIncludes(
  developmentBrief,
  "Studio 초안 원본 경로는 `#integrations-mcp-connection`으로 돌아오게 한다.",
  "Development brief should document MCP runbook Studio source anchor",
);
assertIncludes(
  developmentBrief,
  "Chrome extension, ChatGPT/Claude/Gemini, Codex, MCP client별 connection mode, trigger, Studio action, output, operator check",
  "Development brief should document the environment playbook fields",
);
assertIncludes(
  developmentBrief,
  "target AI",
  "Development brief should document target AI visibility",
);
assertIncludes(
  developmentBrief,
  "`POST /api/integrations/refine`",
  "Development brief should document the Integrations refine API",
);
assertIncludes(
  developmentBrief,
  "Integrations refine tester는 수집 경로, 대상 AI, 검토 gate, 전달 패키지 상태를 실행 버튼 앞에서 확인하게 하고, 요청 source/target/domain/goal과 reviewRequired/target package/quality/language 요약을 모바일 2열로 먼저 보여주며, 복사 전 체크리스트에서 로컬 smoke evidence 저장을 먼저 확인하게 하고, raw payload와 handoff package 원문은 별도 preview로 유지해야 한다",
  "Development brief should document the refine tester handoff review metrics",
);
assertIncludes(
  developmentBrief,
  "`extensions/chrome`",
  "Development brief should document the Chrome extension scaffold",
);
assertIncludes(
  developmentBrief,
  "Chrome popup 실행 순서는 `01 선택 수집`, `02 Studio 정제`, `03 검토 전달` 단계로 선택 텍스트, local refine API, review-required handoff 복사 흐름을 먼저 표시",
  "Development brief should document the Chrome popup workflow order",
);
assertIncludes(
  developmentBrief,
  "Smoke evidence 패널은 runtime/capture/refine/deliver/evidence packet 증거를 같은 popup에서 대조하게 하며",
  "Development brief should document the Chrome popup smoke evidence panel",
);
assertIncludes(
  developmentBrief,
  "Handoff result summary는 review gate, target AI, source, session 저장 상태를 handoff 원문 위에서 먼저 표시하고",
  "Development brief should document the Chrome popup handoff result summary",
);
assertIncludes(
  developmentBrief,
  "Evidence 버튼은 같은 결과 기준의 Chrome handoff evidence packet을 복사하고 실패 시 수동 복사용 evidence textarea를 열며",
  "Development brief should document the Chrome popup handoff evidence packet and manual fallback",
);
assertIncludes(
  developmentBrief,
  "정적 preview에서는 Chrome extension runtime unavailable 상태를 표시하고 page selection/session restore를 건너뛰어 layout smoke를 안정화",
  "Development brief should document Chrome popup static preview behavior",
);
assertIncludes(
  developmentBrief,
  "Chrome loaded smoke 체크리스트와 증빙 패킷으로 runtime, capture, result, session restore, evidence fallback 증거를 같은 순서로 확인하고 복사하게 하며",
  "Development brief should document the loaded Chrome smoke checklist and evidence packet",
);
assertIncludes(
  developmentBrief,
  "실제 Chrome popup에서 확인한 runtime/source/review gate/target AI/session/evidence result 값을 operator evidence packet, confirmSave false 기본의 `save_execution_feedback` payload, confirmSave true 저장 후 Feedback inbox UI/API/curl 확인 명령으로 복사하게 하고",
  "Development brief should document actual Chrome loaded operator evidence",
);
assertIncludes(
  developmentBrief,
  "`mcp/prompt-ai-studio.mjs`",
  "Development brief should document the MCP bridge",
);
assertIncludes(
  developmentBrief,
  "Integrations MCP 연결 설정은 대상 클라이언트 수, 공유 mcpServers config, --self-test 첫 검증, confirmSave 피드백 gate를 모바일 2열 요약으로 먼저 보여주고",
  "Development brief should document MCP connection summary metrics",
);
assertIncludes(
  developmentBrief,
  "Claude/Codex/GPT-compatible client별 config scope, target AI, use case, operator gate를 카드로 먼저 구분하고",
  "Development brief should document MCP client setup cards",
);
assertIncludes(
  developmentBrief,
  "UI/API/curl 검증 경로를 카드로 먼저 보여준 뒤 상세 검증 매트릭스",
  "Development brief should document MCP feedback verification cards",
);
assertIncludes(
  developmentBrief,
  "Integrations MCP feedback inbox",
  "Development brief should document the MCP feedback inbox",
);
assertIncludes(
  developmentBrief,
  "다음 확인 액션을 포함한 Feedback 증빙 패킷",
  "Development brief should document MCP feedback evidence next action",
);
assertIncludes(
  developmentBrief,
  "Learning candidate와 Studio 개선 초안에는 confirmSave true와 evidence-ready trace를 포함해 재사용 전 audit 기준을 보존한다.",
  "Development brief should document MCP feedback reusable drafts carrying confirmSave evidence trace",
);
assertIncludes(
  developmentBrief,
  "원본 필터 링크, record trace, 다음 확인 액션을 포함한 feedback report",
  "Development brief should document MCP feedback review summary metrics",
);
assertIncludes(
  developmentBrief,
  "`trace-ready` source title이 붙은 `mcp-feedback-report` 운영 리포트 Studio 초안",
  "Development brief should document MCP feedback report trace-ready Studio title",
);
assertIncludes(
  developmentBrief,
  "저장 후 confirmSave evidence trace가 저장본에 반영됐는지 확인",
  "Development brief should document MCP feedback saved result confirmSave evidence trace check",
);
assertIncludes(
  developmentBrief,
  "`evidence-ready` source title이 붙은 `mcp-feedback-improvement` 단건 Studio 초안",
  "Development brief should document MCP feedback improvement evidence-ready Studio title",
);
assertIncludes(
  developmentBrief,
  "mcp-feedback-improvement",
  "Development brief should document MCP feedback Studio draft source",
);
assertIncludes(
  developmentBrief,
  "mcp-feedback-report",
  "Development brief should document MCP feedback report Studio draft source",
);
assertIncludes(
  developmentBrief,
  "mcpRating",
  "Development brief should document MCP feedback URL rating filter",
);
assertIncludes(
  developmentBrief,
  "mcpTargetAI",
  "Development brief should document MCP feedback URL target AI filter",
);
assertIncludes(
  developmentBrief,
  "현재 필터 링크 복사",
  "Development brief should document MCP feedback filter link copy",
);
assertIncludes(
  developmentBrief,
  "원본 필터 링크, record trace, 다음 확인 액션을 포함한 feedback report",
  "Development brief should document MCP feedback report filter link",
);
assertIncludes(
  developmentBrief,
  "필터 초기화",
  "Development brief should document MCP feedback filter reset",
);

const feedbackSnapshot = parseMcpFeedbackInboxText(
  [
    JSON.stringify({
      createdAt: "2026-06-22T00:00:00.000Z",
      rating: "negative",
      resultSummary: "First result",
      targetAI: "claude",
    }),
    "not-json",
    JSON.stringify({
      createdAt: "2026-06-22T00:01:00.000Z",
      rating: "positive",
      resultSummary: "Second result",
      targetAI: "codex",
    }),
    "",
  ].join("\n"),
  { limit: 1 },
);
const filteredFeedbackSnapshot = parseMcpFeedbackInboxText(
  [
    JSON.stringify({
      createdAt: "2026-06-22T00:00:00.000Z",
      rating: "negative",
      resultSummary: "Claude result",
      targetAI: "claude",
    }),
    JSON.stringify({
      createdAt: "2026-06-22T00:01:00.000Z",
      rating: "positive",
      resultSummary: "Codex result",
      targetAI: "codex",
    }),
  ].join("\n"),
  { rating: "negative", targetAI: "claude" },
);

assert.equal(
  normalizeMcpFeedbackInboxLimit("999"),
  50,
  "MCP feedback inbox limit should be capped",
);
assert.equal(
  feedbackSnapshot.totalCount,
  2,
  "MCP feedback inbox parser should count valid records",
);
assert.equal(
  feedbackSnapshot.filteredCount,
  2,
  "MCP feedback inbox parser should count filtered records",
);
assert.equal(
  feedbackSnapshot.records[0]?.resultSummary,
  "Second result",
  "MCP feedback inbox parser should return most recent records first",
);
assert.equal(
  feedbackSnapshot.parseErrors.length,
  1,
  "MCP feedback inbox parser should report invalid JSONL lines",
);
assert.equal(
  feedbackSnapshot.ratingCounts.positive,
  1,
  "MCP feedback inbox parser should count ratings",
);
assert.equal(
  feedbackSnapshot.targetAICounts.codex,
  1,
  "MCP feedback inbox parser should count target AI values",
);
assert.equal(
  filteredFeedbackSnapshot.filteredCount,
  1,
  "MCP feedback inbox parser should filter by rating and target AI",
);
assert.equal(
  filteredFeedbackSnapshot.records[0]?.resultSummary,
  "Claude result",
  "MCP feedback inbox parser should return matching filtered records",
);

const chromeParseResult = parseIntegrationRefineRequest({
  domain: "개발",
  goal: "개발 태스크 생성",
  rawInput:
    "Next.js 앱에서 Chrome selection capture와 MCP 자동 프롬프트 정제 API를 구현하고 검증해줘",
  sourceApp: "chrome",
  sourceUrl: "https://example.com/spec",
  targetAI: "codex",
});

assert.ok(
  chromeParseResult.value,
  "Chrome integration refine request should parse",
);
assert.equal(
  chromeParseResult.value.deliveryMode,
  "review_required",
  "Integration refine requests should always require review before delivery",
);
assert.equal(
  chromeParseResult.value.request.targetModels[0],
  "codex",
  "Integration refine parser should normalize targetAI aliases",
);

const chromeResponse = createIntegrationRefineResponse(chromeParseResult.value);
assert.equal(
  chromeResponse.audit.tool,
  "refine_prompt",
  "Integration refine response should be tagged as refine_prompt",
);
assert.equal(
  chromeResponse.audit.reviewRequired,
  true,
  "Integration refine response should require review",
);
assert.equal(
  chromeResponse.audit.sourceApp,
  "chrome",
  "Integration refine response should preserve source app",
);
assert.equal(
  chromeResponse.handoffPackages[0]?.targetModel,
  "codex",
  "Integration refine response should return a Codex handoff package",
);
assert.match(
  chromeResponse.handoffPackages[0]?.handoffText ?? "",
  /# Target AI Handoff Package[\s\S]*Preflight Checklist[\s\S]*Copy-Ready Prompt/,
  "Integration refine response should include a copy-ready handoff package with preflight review",
);
assert.ok(
  chromeResponse.handoffPackages[0]?.readiness.length > 0,
  "Integration refine response should include readiness items",
);

const mcpParseResult = parseIntegrationRefineRequest({
  request: {
    domain: "법률/규정",
    goal: "검토 프롬프트 생성",
    rawInput: "회사 정책 문서를 검토해서 리스크와 확인 질문을 정리해줘",
    targetModels: ["claude"],
  },
  sourceApp: "mcp",
});

assert.ok(mcpParseResult.value, "MCP integration refine request should parse");

const mcpResponse = createIntegrationRefineResponse(mcpParseResult.value);
assert.equal(
  mcpResponse.audit.sourceApp,
  "mcp",
  "MCP refine response should preserve source app",
);
assert.equal(
  mcpResponse.handoffPackages[0]?.targetModel,
  "claude",
  "MCP refine response should return a Claude handoff package",
);

const invalidParseResult = parseIntegrationRefineRequest({
  sourceApp: "chrome",
});

assert.equal(
  invalidParseResult.error,
  "rawInput is required",
  "Integration refine parser should reject missing raw input",
);

console.log(
  `Integrations surface verification passed with ${chromeResponse.handoffPackages.length + mcpResponse.handoffPackages.length} exercised handoff packages.`,
);
