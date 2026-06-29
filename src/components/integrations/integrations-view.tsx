import Link from "next/link";
import { Suspense } from "react";

import {
  PageHeader,
  Panel,
  PanelHeader,
  secondaryButtonClass,
} from "@/components/ui";
import {
  ContextOperatingFlow,
  type ContextOperatingFlowItem,
} from "@/components/context/context-operating-flow";
import { McpFeedbackInboxPanel } from "./mcp-feedback-inbox-panel";
import { IntegrationRefineTester } from "./integration-refine-tester";
import { McpConnectionPanel } from "./mcp-connection-panel";
import { EnvironmentPlaybookPanel } from "./environment-playbook-panel";
import { ConnectionReadinessPanel } from "./connection-readiness-panel";
import { OperatorNextActionsPanel } from "./operator-next-actions-panel";
import { ExternalAiOperatorGuidePanel } from "./external-ai-operator-guide-panel";

const connectionSurfaces = [
  {
    channel: "Chrome",
    href: "#integrations-refine-tester",
    role: "웹페이지, 문서, SaaS 화면에서 선택한 텍스트를 Studio 정제 입력으로 보냅니다.",
    status: "입력 수집",
    summary: "선택 텍스트를 local refine API로 보냅니다.",
    handoff: "selection, page title, source URL, target AI hint",
    guard: "민감 정보 감지와 전송 전 검토",
  },
  {
    channel: "ChatGPT / Claude / Gemini",
    href: "#integrations-environment-guide",
    role: "정제된 영어 또는 한영 하이브리드 전문 프롬프트를 대상 AI별 실행 지시서로 전달합니다.",
    status: "검토 전달",
    summary: "로컬 smoke evidence 저장 후 reviewRequired package만 붙여넣습니다.",
    handoff: "target model, final prompt, output language, quality notes",
    guard: "로컬 증거 저장과 붙여넣기 전 최종 리뷰",
  },
  {
    channel: "Codex",
    href: "#integrations-operator-guide",
    role: "개발 작업은 파일 범위, 검증 명령, 완료 기준을 포함한 작업 지시서로 전환합니다.",
    status: "개발 지시",
    summary: "파일 범위, 검증 명령, 완료 기준을 포함합니다.",
    handoff: "repo context, task scope, acceptance checks, risk notes",
    guard: "파괴적 명령과 외부 시스템 작업 차단",
  },
  {
    channel: "MCP",
    href: "#integrations-mcp-connection",
    role: "외부 클라이언트가 Prompt AI Studio의 정제, 컨텍스트 조회, 피드백 저장 기능을 도구처럼 호출합니다.",
    status: "도구 호출",
    summary: "refine, context, handoff, feedback 도구를 연결합니다.",
    handoff: "tool call, workspace context, prompt package, audit event",
    guard: "workspace scope와 사용자 승인 gate",
  },
];

type ConnectionSurface = (typeof connectionSurfaces)[number];

const executionContractRows = [
  {
    surface: "Chrome",
    capture: "선택 텍스트와 source URL",
    package: "reviewRequired handoff package",
    reviewGate: "popup에서 사람이 복사 전 확인",
    feedback: "MCP feedback 또는 Studio feedback로 저장",
  },
  {
    surface: "ChatGPT / Claude / Gemini",
    capture: "검토된 handoff package",
    package: "대상 AI별 실행 프롬프트",
    reviewGate: "붙여넣기 전 operator review",
    feedback: "결과 요약과 rating을 confirmSave 후 저장",
  },
  {
    surface: "Codex",
    capture: "repo-aware 작업 요청",
    package: "파일 범위, 검증 명령, 완료 기준",
    reviewGate: "파괴적 명령과 외부 시스템 작업 차단",
    feedback: "구현 결과와 검증 증거를 다음 개선 후보로 저장",
  },
  {
    surface: "MCP",
    capture: "tool call과 allowed context scope",
    package: "refine_prompt 또는 create_handoff_package 결과",
    reviewGate: "reviewRequired와 confirmSave gate",
    feedback: "save_execution_feedback으로 inbox/audit event 기록",
  },
] satisfies Array<{
  surface: string;
  capture: string;
  package: string;
  reviewGate: string;
  feedback: string;
}>;

const executionEvidenceRows = [
  {
    label: "01 로컬 연결",
    action: "local app과 refine API가 응답하는지 확인합니다.",
    evidence: "localhost:3000, POST /api/integrations/refine",
    href: "#integrations-readiness",
    linkLabel: "준비도 확인",
  },
  {
    label: "02 정제 결과",
    action: "선택 텍스트나 MCP rawInput이 reviewRequired package로 변환되는지 봅니다.",
    evidence: "reviewRequired true, target handoff package",
    href: "#integrations-refine-tester",
    linkLabel: "Refine 테스트",
  },
  {
    label: "03 증거 저장",
    action: "외부 AI 전달 전에 Chrome, MCP, Learning smoke evidence를 파일로 남깁니다.",
    evidence: "Chrome, MCP, Learning smoke evidence file",
    href: "#integrations-smoke-evidence-path",
    linkLabel: "Smoke 증거 확인",
  },
  {
    label: "04 전달 승인",
    action: "외부 AI로 붙여넣기 전에 operator가 package와 누락 맥락을 확인합니다.",
    evidence: "copy-ready prompt, missing context review",
    href: "#integrations-environment-guide",
    linkLabel: "실행 가이드",
  },
  {
    label: "05 피드백 증거",
    action: "실행 결과가 의미 있을 때만 confirmSave true로 feedback inbox에 저장합니다.",
    evidence: "rating, result summary, inbox record",
    href: "#integrations-feedback-inbox",
    linkLabel: "Feedback 확인",
  },
] satisfies Array<{
  label: string;
  action: string;
  evidence: string;
  href: string;
  linkLabel: string;
}>;

const smokeEvidenceRows = [
  {
    label: "Integrated preflight",
    command: "npm run smoke:integrations",
    evidence: "Chrome, MCP, Learning packets and integrations-smoke-summary.md",
    href: "#integrations-smoke-evidence-path",
    result: "Integrated smoke summary",
  },
  {
    label: "MCP bridge",
    command: "npm run smoke:mcp -- --out output/smoke/mcp-bridge-smoke.md",
    evidence: "tools/list, refine_prompt, create_handoff_package, local evidence file",
    href: "#integrations-mcp-connection",
    result: "MCP smoke evidence",
  },
  {
    label: "Chrome popup",
    command:
      "npm run smoke:chrome-extension -- --out output/smoke/chrome-extension-smoke.md",
    evidence: "manifest, local-only permissions, popup evidence fallback",
    href: "#integrations-readiness",
    result: "Chrome smoke evidence",
  },
  {
    label: "Learning feedback",
    command:
      "npm run smoke:learning-feedback -- --out output/smoke/learning-feedback-smoke.md",
    evidence: "low-confidence validation draft, Library filter, queue fallback",
    href: "/learning?review=low-confidence&q=feedback-improvement#learning-feedback-improvement-queue",
    result: "Learning smoke evidence",
  },
] satisfies Array<{
  label: string;
  command: string;
  evidence: string;
  href: string;
  result: string;
}>;

const smokeEvidenceRunOrder = [
  {
    gate: "npm run smoke:integrations",
    label: "01 로컬 packet",
    task:
      "Chrome, MCP, Learning smoke packet과 통합 summary를 한 번에 갱신합니다.",
  },
  {
    gate: "reviewRequired actual result",
    label: "02 실제 증빙",
    task: "외부 전달 전에 실제 Chrome, MCP, Learning 증빙 필드를 기록합니다.",
  },
  {
    gate: "confirmSave reviewed feedback",
    label: "03 피드백 기록",
    task: "외부 AI 결과를 검토한 뒤 학습 가치가 있을 때만 피드백을 저장합니다.",
  },
] satisfies Array<{
  gate: string;
  label: string;
  task: string;
}>;

const integrationOperationFlow = [
  {
    artifact: "raw input, source app, target AI hint",
    detailHref: "#integrations-refine-tester",
    detailLabel: "Refine API 테스트",
    gate: "민감 정보와 누락 맥락 확인",
    owner: "Chrome, Studio, or MCP client",
    phase: "Capture",
  },
  {
    artifact: "reviewRequired handoff package",
    detailHref: "#integrations-mcp-connection",
    detailLabel: "MCP 연결 설정",
    gate: "언어 전략과 가정 검토",
    owner: "Prompt AI Studio",
    phase: "Refine",
  },
  {
    artifact: "Chrome, MCP, Learning smoke evidence",
    detailHref: "#integrations-smoke-evidence-path",
    detailLabel: "Smoke 증거 경로",
    gate: "외부 AI 전달 전 로컬 증거 저장",
    owner: "Operator",
    phase: "Evidence",
  },
  {
    artifact: "copy-ready prompt or Codex implementation brief",
    detailHref: "#integrations-environment-guide",
    detailLabel: "환경별 실행 가이드",
    gate: "외부 전송 전 operator review",
    owner: "Operator",
    phase: "Deliver",
  },
  {
    artifact: "rating, result summary, learning candidate",
    detailHref: "#integrations-feedback-inbox",
    detailLabel: "Feedback inbox",
    gate: "confirmSave true일 때만 저장",
    owner: "External AI result reviewer",
    phase: "Feedback",
  },
] satisfies Array<{
  artifact: string;
  detailHref: string;
  detailLabel: string;
  gate: string;
  owner: string;
  phase: string;
}>;

function formatOperationStep(index: number) {
  return String(index + 1).padStart(2, "0");
}

function OperationStepNumber({ index }: { index: number }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-panel-strong font-mono text-xs text-soft">
      {formatOperationStep(index)}
    </span>
  );
}

function OperationFlowCards() {
  return (
    <div
      className="grid gap-3 px-5 pb-4 md:grid-cols-2 xl:grid-cols-5"
      data-testid="integrations-operation-flow-cards"
    >
      {integrationOperationFlow.map((step, index) => (
        <div
          className="min-w-0 rounded-md border border-line bg-surface p-4"
          key={step.phase}
        >
          <div className="flex items-center gap-3">
            <OperationStepNumber index={index} />
            <p className="break-words text-sm font-semibold text-foreground">
              {step.phase}
            </p>
          </div>
          <dl className="mt-4 space-y-3 text-sm leading-6">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Owner
              </dt>
              <dd className="mt-1 break-words text-soft">{step.owner}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Artifact
              </dt>
              <dd className="mt-1 break-words text-soft">
                {step.artifact}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Gate
              </dt>
              <dd className="mt-1 break-words text-muted">{step.gate}</dd>
            </div>
          </dl>
          <Link
            className="mt-4 inline-flex text-sm font-semibold text-accent transition hover:text-soft"
            href={step.detailHref}
          >
            {step.detailLabel}
          </Link>
        </div>
      ))}
    </div>
  );
}

function OperationFlowTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
          <tr>
            <th className="px-5 py-3 font-semibold">Phase</th>
            <th className="px-5 py-3 font-semibold">Owner</th>
            <th className="px-5 py-3 font-semibold">Artifact</th>
            <th className="px-5 py-3 font-semibold">Gate</th>
            <th className="px-5 py-3 font-semibold">상세 이동</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {integrationOperationFlow.map((step, index) => (
            <tr key={step.phase}>
              <td className="px-5 py-4 align-top">
                <div className="flex items-center gap-3">
                  <OperationStepNumber index={index} />
                  <span className="font-semibold text-foreground">
                    {step.phase}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4 align-top text-muted">
                {step.owner}
              </td>
              <td className="px-5 py-4 align-top text-soft">
                {step.artifact}
              </td>
              <td className="px-5 py-4 align-top text-muted">
                {step.gate}
              </td>
              <td className="px-5 py-4 align-top">
                <Link
                  className="text-sm font-semibold text-accent transition hover:text-soft"
                  href={step.detailHref}
                >
                  {step.detailLabel}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const integrationQuickLinks = [
  {
    description: "전체 운영 단계",
    href: "#integrations-operation-flow",
    label: "운영 흐름",
  },
  {
    description: "local refine 호출",
    href: "#integrations-refine-tester",
    label: "Refine API",
  },
  {
    description: "client config와 smoke",
    href: "#integrations-mcp-connection",
    label: "MCP 연결",
  },
  {
    description: "환경별 install gate",
    href: "#integrations-readiness",
    label: "준비도",
  },
  {
    description: "confirmSave 결과",
    href: "#integrations-feedback-inbox",
    label: "Feedback inbox",
  },
  {
    description: "환경별 실행 책임",
    href: "#integrations-environment-guide",
    label: "환경별 가이드",
  },
  {
    description: "오늘 실행 순서",
    href: "#integrations-operator-guide",
    label: "운영 가이드",
  },
] satisfies Array<{
  description: string;
  href: string;
  label: string;
}>;

const integrationExecutionStrip: ContextOperatingFlowItem[] = [
  {
    actionLabel: "준비도 확인",
    detail: "dev server와 local refine API가 먼저 살아 있어야 합니다.",
    href: "#integrations-readiness",
    label: "로컬 앱",
    step: "01",
    title: "localhost:3000",
  },
  {
    actionLabel: "Refine 테스트",
    detail: "Chrome, Studio, MCP가 원문과 source context를 보냅니다.",
    href: "#integrations-refine-tester",
    label: "입력 수집",
    step: "02",
    title: "source app",
  },
  {
    actionLabel: "Smoke 증거 확인",
    detail: "외부 AI 전달 전에 Chrome, MCP, Learning smoke evidence를 남깁니다.",
    href: "#integrations-smoke-evidence-path",
    label: "증거 저장",
    step: "03",
    title: "local evidence",
  },
  {
    actionLabel: "실행 가이드",
    detail: "reviewRequired package를 사람이 확인한 뒤 외부 AI에 전달합니다.",
    href: "#integrations-environment-guide",
    label: "검토 전달",
    step: "04",
    title: "GPT/Claude/Codex/Gemini",
  },
  {
    actionLabel: "Feedback 확인",
    detail: "confirmSave true인 실행 결과만 feedback inbox에 남깁니다.",
    href: "#integrations-feedback-inbox",
    label: "피드백 저장",
    step: "05",
    title: "MCP feedback",
  },
];

const integrationGateSummary = [
  {
    check: "PROMPT_AI_STUDIO_URL and local refine API",
    detail:
      "Chrome, Studio, and MCP clients refine against the local app surface before any external AI delivery.",
    href: "#integrations-refine-tester",
    label: "Local-first automation",
    linkLabel: "Refine API 확인",
  },
  {
    check: "Integrated summary and Chrome, MCP, Learning smoke evidence files",
    detail:
      "The operator saves local smoke evidence before any prompt package leaves the Studio workflow.",
    href: "#integrations-smoke-evidence-path",
    label: "Evidence saved before delivery",
    linkLabel: "Smoke 증거 확인",
  },
  {
    check: "reviewRequired handoff package",
    detail:
      "GPT, Claude, Codex, and Gemini receive copy-ready packages only after operator review.",
    href: "#integrations-environment-guide",
    label: "Review-required delivery",
    linkLabel: "전달 책임 확인",
  },
  {
    check: "confirmSave true",
    detail:
      "External AI execution feedback is written to the MCP feedback inbox only after explicit confirmation.",
    href: "#integrations-feedback-inbox",
    label: "Confirmed feedback save",
    linkLabel: "Feedback inbox 확인",
  },
] satisfies Array<{
  check: string;
  detail: string;
  href: string;
  label: string;
  linkLabel: string;
}>;

function QuickNavigation() {
  return (
    <nav
      aria-label="Integrations quick navigation"
      className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-panel px-4 py-3"
    >
      <span className="mr-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        빠른 이동
      </span>
      {integrationQuickLinks.map((link) => (
        <Link
          className="min-w-[148px] rounded-md border border-line bg-surface px-3 py-2 transition hover:border-accent"
          href={link.href}
          key={link.href}
        >
          <span className="block text-sm font-semibold text-soft transition hover:text-accent">
            {link.label}
          </span>
          <span className="mt-1 block text-xs text-muted">
            {link.description}
          </span>
        </Link>
      ))}
    </nav>
  );
}

function ConnectionSurfaceSummaryPanel() {
  return (
    <Panel>
      <PanelHeader
        title="지원 환경 요약"
        description="Chrome, 외부 Gen AI, Codex, MCP에서 같은 정제 기준을 쓰되 전송 전 검토 gate를 유지합니다."
      />
      <div
        className="grid grid-cols-2 gap-3 px-5 pb-5 md:grid-cols-4"
        data-testid="integrations-surface-summary"
      >
        {connectionSurfaces.map((surface) => (
          <Link
            className="min-w-0 rounded-md border border-line bg-surface p-3 transition hover:border-accent/60 hover:bg-accent/5 sm:p-4"
            href={surface.href}
            key={surface.channel}
          >
            <span className="block break-words text-sm font-semibold text-foreground">
              {surface.channel}
            </span>
            <span className="mt-2 inline-flex rounded-md border border-line bg-panel px-2 py-1 text-xs font-semibold text-muted">
              {surface.status}
            </span>
            <span className="mt-3 block break-words text-xs leading-5 text-muted sm:text-sm sm:leading-6">
              {surface.summary}
            </span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

function ExecutionContractDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm leading-6 text-soft">
        {value}
      </dd>
    </div>
  );
}

function ExecutionContractMatrix() {
  return (
    <Panel>
      <PanelHeader
        title="연결 계약 매트릭스"
        description="각 실행 환경이 같은 정제, 검토, 피드백 계약을 어떤 산출물로 지키는지 확인합니다."
      />
      <div
        className="grid gap-3 px-5 pb-5 lg:grid-cols-2"
        data-testid="integrations-execution-contract-matrix"
      >
        {executionContractRows.map((row) => (
          <div
            className="min-w-0 rounded-md border border-line bg-surface p-4"
            key={row.surface}
          >
            <p className="break-words text-sm font-semibold text-foreground">
              {row.surface}
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <ExecutionContractDetail label="Capture" value={row.capture} />
              <ExecutionContractDetail label="Package" value={row.package} />
              <ExecutionContractDetail
                label="Review gate"
                value={row.reviewGate}
              />
              <ExecutionContractDetail label="Feedback" value={row.feedback} />
            </dl>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ExecutionEvidenceChecklist() {
  return (
    <Panel>
      <PanelHeader
        title="실행 증거 체크"
        description="외부 AI로 넘기기 전에 남아야 하는 확인 증거를 단계별로 고정합니다."
      />
      <div
        className="grid gap-3 px-5 pb-5 md:grid-cols-2 xl:grid-cols-5"
        data-testid="integrations-execution-evidence-checklist"
      >
        {executionEvidenceRows.map((row) => (
          <div
            className="min-w-0 rounded-md border border-line bg-surface p-4"
            key={row.label}
          >
            <p className="break-words text-sm font-semibold text-foreground">
              {row.label}
            </p>
            <p className="mt-2 break-words text-sm leading-6 text-soft">
              {row.action}
            </p>
            <p className="mt-3 break-words font-mono text-xs leading-5 text-muted">
              {row.evidence}
            </p>
            <Link
              className="mt-4 inline-flex text-sm font-semibold text-accent transition hover:text-soft"
              href={row.href}
            >
              {row.linkLabel}
            </Link>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SmokeEvidencePath() {
  return (
    <Panel>
      <PanelHeader
        title="Smoke 증거 경로"
        description="MCP self-test, Chrome popup smoke, feedback 저장이 어떤 증거로 이어지는지 한 줄로 대조합니다."
      />
      <div
        className="grid gap-3 border-b border-line px-5 pb-4 md:grid-cols-3"
        data-testid="integrations-smoke-evidence-run-order"
      >
        {smokeEvidenceRunOrder.map((step) => (
          <div
            className="min-w-0 rounded-md border border-line bg-surface p-4"
            key={step.label}
          >
            <p className="break-words text-sm font-semibold text-foreground">
              {step.label}
            </p>
            <p className="mt-2 break-words text-sm leading-6 text-soft">
              {step.task}
            </p>
            <p className="mt-3 break-words font-mono text-xs leading-5 text-muted">
              {step.gate}
            </p>
          </div>
        ))}
      </div>
      <div
        className="grid gap-3 px-5 py-5 md:grid-cols-2 xl:grid-cols-4"
        data-testid="integrations-smoke-evidence-path"
      >
        {smokeEvidenceRows.map((row) => (
          <Link
            className="min-w-0 rounded-md border border-line bg-surface p-4 transition hover:border-accent/60 hover:bg-accent/5"
            href={row.href}
            key={row.label}
          >
            <span className="block break-words text-sm font-semibold text-foreground">
              {row.label}
            </span>
            <span className="mt-3 block break-words font-mono text-xs leading-5 text-soft">
              {row.command}
            </span>
            <span className="mt-3 block break-words text-xs leading-5 text-muted">
              {row.evidence}
            </span>
            <span className="mt-3 inline-flex rounded-md border border-line bg-panel px-2 py-1 text-xs font-semibold text-accent">
              {row.result}
            </span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

function GateSummaryPanel() {
  return (
    <Panel>
      <PanelHeader
        title="검증 게이트 요약"
        description="외부 AI 연결은 로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장 게이트를 통과합니다."
      />
      <div
        className="grid grid-cols-2 gap-3 px-5 pb-5 md:grid-cols-4"
        data-testid="integrations-gate-summary-metrics"
      >
        {integrationGateSummary.map((gate) => (
          <div
            className="min-w-0 rounded-md border border-line bg-surface p-3 sm:p-4"
            key={gate.label}
          >
            <p className="break-words text-xs font-semibold text-foreground sm:text-sm">
              {gate.label}
            </p>
            <p className="mt-2 break-words text-xs leading-5 text-muted sm:text-sm sm:leading-6">
              {gate.detail}
            </p>
            <p className="mt-3 break-words font-mono text-xs leading-5 text-soft">
              {gate.check}
            </p>
            <Link
              className="mt-4 inline-flex text-sm font-semibold text-accent transition hover:text-soft"
              href={gate.href}
            >
              {gate.linkLabel}
            </Link>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const mcpToolContracts = [
  {
    name: "refine_prompt",
    input: "rawInput, sourceApp, targetAI, domainHint",
    output: "target-specific prompt package",
  },
  {
    name: "get_context_profile",
    input: "workspaceId, allowedScopes",
    output: "user, company, learning, skill context summary",
  },
  {
    name: "create_handoff_package",
    input: "promptId or draft, targetAI, deliveryMode",
    output: "copy-ready prompt, quality review, missing context, operator notes",
  },
  {
    name: "save_execution_feedback",
    input: "promptId, targetAI, resultSummary, rating, notes",
    output: "learning memory candidate and improvement queue item",
  },
];

const rolloutSteps = [
  "Chrome selection capture and Studio draft handoff",
  "Local smoke evidence before target AI handoff",
  "Target AI prompt package copy/export contract",
  "Local MCP server with read-only context tools",
  "MCP refine_prompt write path with review-required delivery",
  "Feedback return loop from external AI execution results",
];

const automationPrincipleRows = [
  { label: "Refine API", value: "POST /api/integrations/refine" },
  { label: "Chrome extension", value: "extensions/chrome" },
  {
    label: "Context priority",
    value: "company → user → learning → skill",
  },
  {
    label: "Language strategy",
    value: "English or Korean-English hybrid",
  },
  {
    label: "Audit source",
    value:
      "chrome-selection, mcp-refine, local-smoke-evidence, target-ai-handoff",
  },
];

function ConnectionSurfaceDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="font-semibold text-soft">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}

function ConnectionSurfaceRow({ surface }: { surface: ConnectionSurface }) {
  return (
    <div className="grid gap-3 px-5 py-4 md:grid-cols-[140px_minmax(0,1fr)]">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {surface.channel}
        </p>
        <p className="mt-1 text-xs text-muted">handoff surface</p>
      </div>
      <div className="min-w-0 space-y-2">
        <p className="break-words text-sm leading-6 text-soft">
          {surface.role}
        </p>
        <dl className="grid gap-2 text-xs text-muted sm:grid-cols-2">
          <ConnectionSurfaceDetail label="Payload" value={surface.handoff} />
          <ConnectionSurfaceDetail label="Gate" value={surface.guard} />
        </dl>
      </div>
    </div>
  );
}

function ConnectionSurfacesPanel() {
  return (
    <Panel>
      <PanelHeader
        title="연결 표면"
        description="브라우저, 외부 Gen AI, 개발 환경, MCP 호출이 같은 handoff package를 공유합니다."
      />
      <div className="divide-y divide-line">
        {connectionSurfaces.map((surface) => (
          <ConnectionSurfaceRow key={surface.channel} surface={surface} />
        ))}
      </div>
    </Panel>
  );
}

function AutomationPrincipleRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line pb-2 last:border-b-0 last:pb-0">
      <span>{label}</span>
      <span className="text-right text-muted">{value}</span>
    </div>
  );
}

function AutomationPrinciplesPanel() {
  return (
    <Panel>
      <PanelHeader
        title="자동 정제 원칙"
        description="자동화는 정제까지 빠르게 처리하고, 외부 전송은 검토 가능한 산출물로 남깁니다."
      />
      <div className="space-y-4 px-5 py-5">
        <div className="rounded-md border border-line bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Default Mode
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            Refine automatically, save evidence, deliver with review.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Chrome이나 MCP에서 들어온 원문은 즉시 정제하되, ChatGPT,
            Claude, Codex, Gemini로 보내기 전에는 로컬 smoke evidence,
            prompt package, 누락 맥락을 확인합니다.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-soft">
          {automationPrincipleRows.map((row) => (
            <AutomationPrincipleRow
              key={row.label}
              label={row.label}
              value={row.value}
            />
          ))}
        </div>
      </div>
    </Panel>
  );
}

function McpToolContractDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-soft">{label}</dt>
      <dd className="mt-1 break-words text-xs leading-5 text-muted">
        {value}
      </dd>
    </div>
  );
}

function McpToolContractCard({
  tool,
}: {
  tool: (typeof mcpToolContracts)[number];
}) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-surface p-4">
      <p className="break-words font-mono text-xs font-semibold text-foreground">
        {tool.name}
      </p>
      <dl className="mt-4 grid gap-3">
        <McpToolContractDetail label="Input" value={tool.input} />
        <McpToolContractDetail label="Output" value={tool.output} />
      </dl>
    </div>
  );
}

function McpToolContractCards() {
  return (
    <div
      className="grid gap-3 px-5 pb-4 md:grid-cols-2"
      data-testid="mcp-tool-contract-cards"
    >
      {mcpToolContracts.map((tool) => (
        <McpToolContractCard key={tool.name} tool={tool} />
      ))}
    </div>
  );
}

function McpToolContractPanel() {
  return (
    <Panel>
      <PanelHeader
        title="MCP 도구 계약"
        description="외부 클라이언트가 호출할 최소 도구를 먼저 고정합니다."
      />
      <McpToolContractCards />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Tool</th>
              <th className="px-5 py-3 font-semibold">Input</th>
              <th className="px-5 py-3 font-semibold">Output</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {mcpToolContracts.map((tool) => (
              <tr key={tool.name}>
                <td className="px-5 py-4 font-mono text-xs text-foreground">
                  {tool.name}
                </td>
                <td className="px-5 py-4 text-muted">{tool.input}</td>
                <td className="px-5 py-4 text-soft">{tool.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function RolloutOrderPanel() {
  return (
    <Panel>
      <PanelHeader
        title="출시 순서"
        description="Chrome에서 시작해 MCP와 피드백 루프까지 단계적으로 확장합니다."
      />
      <ol className="divide-y divide-line px-5">
        {rolloutSteps.map((step, index) => (
          <li
            className="grid gap-3 py-4 sm:grid-cols-[44px_minmax(0,1fr)]"
            key={step}
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-panel-strong font-mono text-xs text-soft">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="break-words text-sm leading-6 text-soft">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export function IntegrationsView() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="외부 AI 연결"
        description="Chrome, GPT, Claude, Codex, Gemini, MCP 클라이언트에서 같은 개인/회사/학습 기준으로 프롬프트를 정제하고 전달하는 연결 설계입니다."
        action={
          <Link className={secondaryButtonClass} href="/studio">
            Studio에서 정제 시작
          </Link>
        }
      />

      <div>
        <ContextOperatingFlow
          badge="review-required handoff"
          description="외부 AI 연결은 자동 정제와 사람 검토를 분리합니다. 먼저 로컬에서 정제하고, 검토 가능한 패키지만 전달한 뒤, 확인된 결과만 학습 루프로 되돌립니다."
          items={integrationExecutionStrip}
          testId="integrations-execution-flow"
          title="연결 실행 순서"
        />
      </div>

      <ConnectionSurfaceSummaryPanel />

      <ExecutionContractMatrix />

      <ExecutionEvidenceChecklist />

      <SmokeEvidencePath />

      <QuickNavigation />

      <GateSummaryPanel />

      <div className="scroll-mt-24" id="integrations-next-actions">
        <OperatorNextActionsPanel />
      </div>

      <ExternalAiOperatorGuidePanel />

      <Panel>
        <div className="scroll-mt-24" id="integrations-operation-flow" />
        <PanelHeader
          title="운영 흐름"
          description="입력 수집부터 정제, 증거 저장, 외부 AI 전달, 실행 피드백 저장까지 한 줄의 책임 흐름으로 확인합니다."
        />
        <OperationFlowCards />
        <OperationFlowTable />
      </Panel>

      <div className="scroll-mt-24" id="integrations-refine-tester">
        <IntegrationRefineTester />
      </div>

      <div className="scroll-mt-24" id="integrations-mcp-connection">
        <McpConnectionPanel />
      </div>

      <div className="scroll-mt-24" id="integrations-readiness">
        <ConnectionReadinessPanel />
      </div>

      <div className="scroll-mt-24" id="integrations-feedback-inbox">
        <Suspense fallback={<McpFeedbackInboxFallback />}>
          <McpFeedbackInboxPanel />
        </Suspense>
      </div>

      <div className="scroll-mt-24" id="integrations-environment-guide">
        <EnvironmentPlaybookPanel />
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <ConnectionSurfacesPanel />
        <AutomationPrinciplesPanel />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <McpToolContractPanel />
        <RolloutOrderPanel />
      </section>
    </div>
  );
}

function McpFeedbackInboxFallback() {
  return (
    <Panel>
      <PanelHeader
        title="MCP feedback inbox"
        description="save_execution_feedback로 confirmSave된 외부 AI 실행 결과를 최근 항목 기준으로 확인합니다."
      />
      <div className="px-5 py-5 text-sm text-muted">
        Feedback inbox 필터를 준비하는 중입니다.
      </div>
    </Panel>
  );
}
