import Link from "next/link";
import { Suspense } from "react";

import {
  PageHeader,
  Panel,
  PanelHeader,
  secondaryButtonClass,
} from "@/components/ui";
import { McpFeedbackInboxPanel } from "./mcp-feedback-inbox-panel";
import { IntegrationRefineTester } from "./integration-refine-tester";
import { McpConnectionPanel } from "./mcp-connection-panel";
import { EnvironmentPlaybookPanel } from "./environment-playbook-panel";
import { ConnectionReadinessPanel } from "./connection-readiness-panel";

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
    href: "#integrations-environment-guide",
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
    artifact: "Chrome, MCP bridge, MCP client, Learning smoke evidence",
    detailHref: "#integrations-readiness",
    detailLabel: "연결 준비도",
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
] satisfies Array<{
  description: string;
  href: string;
  label: string;
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

      <QuickNavigation />

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

      <ConnectionSurfacesPanel />

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
