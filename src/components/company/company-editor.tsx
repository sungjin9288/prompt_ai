"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Field,
  PageHeader,
  Panel,
  PanelHeader,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import { normalizeInternalHref } from "@/lib/navigation/href";
import type { CompanyProfile } from "@/lib/prompt";
import { writeStudioDraft } from "@/lib/studio/draft";
import {
  useCompanyProfileStore,
  useLearningMemoriesStore,
} from "@/lib/data/workspace-store";
import { upsertCompanyProfileMemory } from "@/lib/learning/memory";
import { listToText, textToList } from "@/lib/storage/local-store";
import { copyTextToClipboard } from "@/lib/browser/clipboard";

interface CompanyReadinessItem {
  id: string;
  label: string;
  description: string;
  ready: boolean;
  questions: string[];
}

interface CompanyManualCopy {
  title: string;
  body: string;
  reason?: string;
}

function hasText(value: string) {
  return value.trim().length > 0;
}

function hasItems(value: string[]) {
  return value.length > 0;
}

function formatPromptList(values: string[], fallback: string) {
  const items = values.map((value) => value.trim()).filter(Boolean);

  return items.length ? items.map((value) => `- ${value}`).join("\n") : fallback;
}

function getSafeReturnPath(returnTo?: string) {
  const returnPath = normalizeInternalHref(returnTo);

  if (!returnPath) {
    return "/studio";
  }

  if (
    returnPath === "/" ||
    returnPath.startsWith("/library") ||
    returnPath.startsWith("/studio")
  ) {
    return returnPath;
  }

  return "/studio";
}

function getReturnLabel(returnPath: string) {
  if (returnPath.startsWith("/library")) {
    return "Library로 돌아가기";
  }

  if (returnPath.startsWith("/studio")) {
    return "Studio로 돌아가기";
  }

  return "Dashboard로 돌아가기";
}

function withCompanyUpdatedSignal(returnPath: string) {
  const url = new URL(returnPath, "http://prompt-ai-studio.local");

  url.searchParams.set("companyUpdated", "1");

  return normalizeInternalHref(`${url.pathname}${url.search}${url.hash}`) ?? "/studio";
}

function getCompanyReadinessItems(company: CompanyProfile) {
  return [
    {
      id: "company-name",
      label: "회사명",
      description: "프롬프트가 어느 브랜드/회사 기준으로 작성되는지 고정합니다.",
      ready: hasText(company.companyName),
      questions: [
        "외부에 노출해도 되는 공식 회사명 또는 프로젝트명은 무엇인가요?",
        "프롬프트 안에서 회사명을 그대로 써도 되나요, 아니면 제품명 중심으로 써야 하나요?",
      ],
    },
    {
      id: "company-description",
      label: "회사 설명",
      description: "해결하는 문제, 시장 맥락, 포지셔닝을 프롬프트에 반영합니다.",
      ready: hasText(company.description),
      questions: [
        "회사가 해결하는 핵심 문제를 한 문장으로 쓰면 무엇인가요?",
        "현재 시장에서 어떤 고객 상황 또는 업무 흐름을 개선하려고 하나요?",
        "경쟁 서비스와 비교했을 때 반드시 지켜야 할 포지셔닝은 무엇인가요?",
      ],
    },
    {
      id: "company-products",
      label: "제품/서비스",
      description: "생성 결과가 실제 제공물과 어긋나지 않게 합니다.",
      ready: hasItems(company.products),
      questions: [
        "현재 제공 중이거나 만들고 있는 핵심 제품/서비스는 무엇인가요?",
        "각 제품/서비스가 고객에게 제공하는 주요 결과물은 무엇인가요?",
      ],
    },
    {
      id: "company-customers",
      label: "고객군",
      description: "대상 독자, 구매자, 사용자 관점에 맞춘 표현을 만들게 합니다.",
      ready: hasItems(company.customers),
      questions: [
        "이 결과물을 읽거나 사용할 핵심 고객/독자는 누구인가요?",
        "그 고객이 가장 중요하게 보는 문제, 욕구, 반대 의견은 무엇인가요?",
        "고객에게 피해야 할 표현이나 과장으로 보일 수 있는 표현은 무엇인가요?",
      ],
    },
    {
      id: "company-brand-tone",
      label: "브랜드 톤",
      description: "회사답게 보이는 문체와 의사결정 기준을 유지합니다.",
      ready: hasText(company.brandTone),
      questions: [
        "답변은 얼마나 직접적, 전문적, 친근하게 보여야 하나요?",
        "회사 결과물에서 반드시 피해야 하는 톤은 무엇인가요?",
      ],
    },
  ] satisfies CompanyReadinessItem[];
}

function getCompanyAdvancedItems(company: CompanyProfile) {
  return [
    {
      id: "company-internal-terms",
      label: "내부 용어",
      ready: hasItems(company.internalTerms),
      description: "반복적으로 쓰는 제품명, 기능명, 조직 용어를 일관되게 적용합니다.",
    },
    {
      id: "company-banned-phrases",
      label: "금지 표현",
      ready: hasItems(company.bannedPhrases),
      description: "과장, 법적 리스크, 브랜드와 맞지 않는 표현을 줄입니다.",
    },
    {
      id: "company-document-formats",
      label: "선호 문서 구조",
      ready: hasItems(company.documentFormats),
      description: "PRD, 제안서, 보고서처럼 자주 쓰는 산출물 구조를 재사용합니다.",
    },
  ];
}

function buildCompanyContextQuestions(company: CompanyProfile) {
  const missingItems = getCompanyReadinessItems(company).filter((item) => !item.ready);
  const targetItems =
    missingItems.length > 0 ? missingItems : getCompanyReadinessItems(company);
  const missingText = missingItems.length
    ? missingItems.map((item) => `- ${item.label}`).join("\n")
    : "- 기본 회사 맥락은 모두 입력됨";
  const questions = targetItems
    .map(
      (item, index) => `${index + 1}. ${item.label}
${item.questions.map((question) => `   - ${question}`).join("\n")}`,
    )
    .join("\n");

  return `# Prompt AI Studio Company Context Questions

## Current status
- Company name: ${company.companyName || "미입력"}
- Brand tone: ${company.brandTone || "미입력"}

## Missing required context
${missingText}

## Questions to answer
${questions}

## Where to update
- Company page: fill company name, description, products/services, customers, and brand tone first.
- Advanced fields: add internal terms, banned phrases, and preferred document formats when the basic context is ready.
- Studio: regenerate the prompt after updating company context.`;
}

function buildCompanyContextApplicationPrompt({
  company,
  completion,
  missingReadinessCount,
}: {
  company: CompanyProfile;
  completion: number;
  missingReadinessCount: number;
}) {
  return `# Company Context Application

## Goal
Convert this company profile into a reusable instruction block for GPT, Claude, Codex, and Gemini prompts. The final prompt should be all English for development/Codex-heavy work, or Korean-English hybrid when brand wording, customer nuance, or Korean market context must be preserved.

## Current readiness
- Required context completion: ${completion}%
- Missing required fields: ${missingReadinessCount}

## Company profile
- Company name: ${company.companyName || "Not provided"}
- Description: ${company.description || "Not provided"}
- Brand tone: ${company.brandTone || "Not provided"}

## Products or services
${formatPromptList(company.products, "- Not provided")}

## Customers
${formatPromptList(company.customers, "- Not provided")}

## Internal terms
${formatPromptList(company.internalTerms, "- Not provided")}

## Banned phrases
${formatPromptList(company.bannedPhrases, "- Not provided")}

## Preferred document formats
${formatPromptList(company.documentFormats, "- Not provided")}

## Required output
1. Write a concise company instruction block.
2. Separate hard brand rules from softer tone preferences.
3. Explain when company context should override personal preferences.
4. Create a short checklist to verify that future prompts reflect this company profile.
5. Keep the instruction practical enough to paste into GPT, Claude, Codex, or Gemini.`;
}

function CompanyManualCopyPanel({
  copy,
  onClose,
}: {
  copy: CompanyManualCopy;
  onClose: () => void;
}) {
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-soft">수동 복사 필요</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            {copy.reason ?? `${copy.title} 복사가 차단됐습니다.`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-accent transition hover:text-soft"
        >
          닫기
        </button>
      </div>
      <textarea
        readOnly
        value={copy.body}
        className="mt-3 h-40 w-full resize-y rounded-md border border-line bg-panel px-3 py-2 font-mono text-xs leading-5 text-soft outline-none"
        aria-label={`수동 복사용 ${copy.title}`}
      />
    </div>
  );
}

export function CompanyEditor({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const [company, setCompany] = useCompanyProfileStore();
  const [, setMemories] = useLearningMemoriesStore();
  const [saved, setSaved] = useState(false);
  const [questionsCopied, setQuestionsCopied] = useState(false);
  const [questionsCopyFailed, setQuestionsCopyFailed] = useState(false);
  const [applicationCopied, setApplicationCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState<CompanyManualCopy | null>(null);
  const readinessItems = useMemo(
    () => getCompanyReadinessItems(company),
    [company],
  );
  const advancedItems = useMemo(() => getCompanyAdvancedItems(company), [company]);
  const readyCount = readinessItems.filter((item) => item.ready).length;
  const completion = Math.round((readyCount / readinessItems.length) * 100);
  const nextMissingItem = readinessItems.find((item) => !item.ready);
  const missingReadinessCount = readinessItems.length - readyCount;
  const advancedReadyCount = advancedItems.filter((item) => item.ready).length;
  const returnPath = getSafeReturnPath(returnTo);
  const companyContextSummaryItems = [
    { label: "필수 완료", value: `${readyCount}/${readinessItems.length}` },
    { label: "부족 항목", value: `${missingReadinessCount}개` },
    { label: "확장 기준", value: `${advancedReadyCount}/${advancedItems.length}` },
    { label: "복귀 위치", value: getReturnLabel(returnPath) },
  ];
  const companyApplicationPrompt = buildCompanyContextApplicationPrompt({
    company,
    completion,
    missingReadinessCount,
  });
  const companyApplicationSignals = [
    {
      label: "프롬프트 언어",
      value: "영어 우선 · 한영 하이브리드 자동 판단",
    },
    {
      label: "적용 우선순위",
      value: nextMissingItem
        ? `${nextMissingItem.label} 보강 후 적용`
        : "회사 설명, 고객군, 브랜드 톤 즉시 적용",
    },
    {
      label: "대상 AI",
      value: "GPT · Claude · Codex · Gemini",
    },
    {
      label: "학습 메모리",
      value: saved ? "저장됨 · company scope 반영" : "저장 후 company scope 반영",
    },
  ];
  const companyApplicationWorkflowSteps = [
    {
      detail: nextMissingItem
        ? `${nextMissingItem.label}을 먼저 채우면 회사 기준이 더 선명해집니다.`
        : "회사 설명, 제품, 고객군, 브랜드 톤을 적용 기준으로 사용합니다.",
      label: "기준 확인",
      step: "01",
      title: nextMissingItem ? "보강 후 적용" : "즉시 적용 가능",
    },
    {
      detail:
        "회사 포지셔닝과 금지 표현은 개인 선호보다 먼저 적용하고, 한국어 맥락은 한영 하이브리드로 보존합니다.",
      label: "적용 문구",
      step: "02",
      title: "회사 기준 우선",
    },
    {
      detail:
        "복사하거나 Studio 초안으로 보내 GPT, Claude, Codex, Gemini 지시문에 붙입니다.",
      label: "Studio 전송",
      step: "03",
      title: "외부 AI handoff 준비",
    },
  ];

  function update<K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) {
    setSaved(false);
    setQuestionsCopied(false);
    setQuestionsCopyFailed(false);
    setApplicationCopied(false);
    setManualCopy(null);
    setCompany((current) => ({ ...current, [key]: value }));
  }

  async function copyCompanyContextQuestions() {
    const questionsText = buildCompanyContextQuestions(company);
    const copied = await copyTextToClipboard(questionsText);

    setQuestionsCopied(copied);
    setQuestionsCopyFailed(!copied);
    setManualCopy(
      copied
        ? null
        : {
            title: "회사 맥락 질문",
            body: questionsText,
          },
    );
  }

  function saveCompanyContext() {
    setSaved(true);
    setManualCopy(null);
    setMemories((current) => upsertCompanyProfileMemory(current, company));
  }

  async function copyCompanyApplicationPrompt() {
    const copied = await copyTextToClipboard(companyApplicationPrompt);

    setApplicationCopied(copied);
    setManualCopy(
      copied
        ? null
        : {
            title: "회사 기준 적용 프롬프트",
            body: companyApplicationPrompt,
          },
    );
  }

  function openCompanyApplicationInStudio() {
    const wroteDraft = writeStudioDraft({
      source: "company-context-application",
      rawInput: companyApplicationPrompt,
      goal: "회사 기준 적용 프롬프트 설계",
      domain: company.products[0] || "Company AI operations",
      targetModels: ["gpt", "claude", "codex", "gemini"],
      outputLanguage: "korean",
      sourceTitle: "Company 회사 기준 적용 프리뷰",
      sourceHref: "/company",
      createdAt: new Date().toISOString(),
    });

    if (!wroteDraft) {
      setApplicationCopied(false);
      setManualCopy({
        title: "회사 기준 적용 프롬프트",
        body: companyApplicationPrompt,
        reason:
          "Studio 초안을 저장하지 못했습니다. 아래 적용 프롬프트를 직접 선택해 복사하세요.",
      });
      return;
    }

    router.push("/studio?draft=company-context-application");
  }

  function saveAndReturn() {
    saveCompanyContext();
    router.push(withCompanyUpdatedSignal(returnPath));
  }

  return (
    <>
      <PageHeader
        title="회사 기준"
        description="브랜드 톤, 내부 용어, 금지 표현, 문서 양식이 회사 특색을 담는 기준 데이터입니다."
        action={
          <a className={secondaryButtonClass} href={returnPath}>
            {getReturnLabel(returnPath)}
          </a>
        }
      />

      <div className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <Panel>
            <PanelHeader
              title="회사 맥락 완성도"
              description="Studio 품질 진단에서 부족한 회사/고객 맥락을 먼저 채우는 기준입니다."
            />
            <div className="space-y-5 p-5">
              <div
                className="grid grid-cols-2 gap-3 md:grid-cols-4"
                data-testid="company-context-summary-metrics"
              >
                {companyContextSummaryItems.map((item) => (
                  <div
                    className="min-w-0 rounded-md border border-line bg-surface p-3"
                    key={item.label}
                  >
                    <p className="text-xs text-muted">{item.label}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-accent">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-soft">
                    기본 맥락 {readyCount}/{readinessItems.length}
                  </span>
                  <span className="font-mono text-foreground">
                    {completion}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              <div
                className="grid grid-cols-2 gap-3 md:grid-cols-2"
                data-testid="company-readiness-metrics"
              >
                {readinessItems.map((item) => (
                  <a
                    className="min-w-0 rounded-md border border-line bg-surface p-3 transition hover:border-accent sm:p-4"
                    href={`#${item.id}`}
                    key={item.id}
                  >
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words text-xs font-semibold text-foreground sm:text-sm">
                          {item.label}
                        </p>
                        <p className="mt-1 break-words text-xs leading-5 text-muted">
                          {item.description}
                        </p>
                      </div>
                      <span
                        className={`w-fit shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                          item.ready
                            ? "bg-accent/15 text-accent"
                            : "bg-surface-strong text-muted"
                        }`}
                      >
                        {item.ready ? "완료" : "필요"}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="다음 보강 액션"
              description="부족한 정보를 질문으로 정리해서 바로 채울 수 있게 합니다."
            />
            <div className="space-y-4 p-5">
              <div className="rounded-md border border-line bg-surface p-4">
                <p className="text-sm font-semibold text-foreground">
                  {nextMissingItem
                    ? `${nextMissingItem.label}부터 보강`
                    : "기본 회사 맥락 준비 완료"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {nextMissingItem
                    ? nextMissingItem.description
                    : "이제 내부 용어, 금지 표현, 문서 구조를 채우면 회사 특색이 더 안정적으로 반영됩니다."}
                </p>
              </div>

              <div className="grid gap-2">
                {nextMissingItem ? (
                  <a
                    className={`${primaryButtonClass} w-full`}
                    href={`#${nextMissingItem.id}`}
                  >
                    다음 항목 입력
                  </a>
                ) : (
                  <a
                    className={`${primaryButtonClass} w-full`}
                    href="#company-internal-terms"
                  >
                    확장 기준 입력
                  </a>
                )}
                <button
                  className={`${secondaryButtonClass} w-full`}
                  type="button"
                  onClick={copyCompanyContextQuestions}
                >
                  {questionsCopied
                    ? "보강 질문 복사됨"
                    : questionsCopyFailed
                      ? "보강 질문 복사 실패"
                      : "회사 맥락 질문 복사"}
                </button>
                {manualCopy ? (
                  <CompanyManualCopyPanel
                    copy={manualCopy}
                    onClose={() => setManualCopy(null)}
                  />
                ) : null}
              </div>

              <div
                className="rounded-md border border-line bg-surface p-4"
                data-testid="company-context-application-preview"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      AI 적용 프리뷰
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      입력한 회사 기준이 외부 AI 지시문에 어떻게 들어갈지
                      먼저 확인합니다.
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-accent/15 px-2 py-1 text-xs font-semibold text-accent">
                    company context
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {companyApplicationSignals.map((item) => (
                    <div
                      className="min-w-0 rounded-md border border-line bg-panel p-3"
                      key={item.label}
                    >
                      <p className="text-xs text-muted">{item.label}</p>
                      <p className="mt-1 break-words text-xs font-semibold text-soft">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  className="mt-4 grid gap-3"
                  data-testid="company-context-application-workflow"
                >
                  {companyApplicationWorkflowSteps.map((item) => (
                    <div
                      className="rounded-md border border-line bg-panel p-3"
                      key={item.step}
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] font-semibold text-accent">
                          {item.step}
                        </span>
                        <p className="text-xs font-semibold text-muted">
                          {item.label}
                        </p>
                      </div>
                      <p className="mt-2 break-words text-xs font-semibold text-soft">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-muted">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-md border border-line bg-panel p-3">
                  <p className="text-xs font-semibold text-muted">
                    프롬프트 기준 미리보기
                  </p>
                  <p className="mt-2 text-sm leading-6 text-soft">
                    Apply company positioning, customer context, brand tone, and
                    prohibited wording before personal preferences when they
                    conflict. Preserve Korean brand or market nuance with a
                    Korean-English hybrid prompt when needed.
                  </p>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    className={secondaryButtonClass}
                    type="button"
                    onClick={copyCompanyApplicationPrompt}
                  >
                    {applicationCopied ? "적용 프롬프트 복사됨" : "적용 프롬프트 복사"}
                  </button>
                  <button
                    className={primaryButtonClass}
                    type="button"
                    onClick={openCompanyApplicationInStudio}
                  >
                    적용 프리뷰 Studio로
                  </button>
                </div>
              </div>

              <div className="space-y-2 border-t border-line pt-4">
                {advancedItems.map((item) => (
                  <a
                    className="flex min-w-0 items-start justify-between gap-3 rounded-md px-2 py-2 text-sm transition hover:bg-surface"
                    href={`#${item.id}`}
                    key={item.id}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-soft">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        {item.description}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-muted">
                      {item.ready ? "완료" : "선택"}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel>
        <PanelHeader
          title="회사/브랜드 학습 기준"
          description="초기에는 직접 입력한 회사 맥락을 프롬프트에 주입합니다."
        />
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <Field label="회사명">
            <input
              id="company-name"
              className={inputClass}
              value={company.companyName}
              onChange={(event) => update("companyName", event.target.value)}
              placeholder="예: Prompt AI Studio"
            />
          </Field>

          <Field label="브랜드 톤">
            <input
              id="company-brand-tone"
              className={inputClass}
              value={company.brandTone}
              onChange={(event) => update("brandTone", event.target.value)}
            />
          </Field>

          <Field label="회사 설명">
            <textarea
              id="company-description"
              className={textareaClass}
              rows={6}
              value={company.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="회사가 해결하는 문제, 제품 방향, 시장 맥락"
            />
          </Field>

          <Field label="제품/서비스" hint="줄바꿈 또는 쉼표로 구분">
            <textarea
              id="company-products"
              className={textareaClass}
              rows={6}
              value={listToText(company.products)}
              onChange={(event) => update("products", textToList(event.target.value))}
            />
          </Field>

          <Field label="고객군">
            <textarea
              id="company-customers"
              className={textareaClass}
              rows={5}
              value={listToText(company.customers)}
              onChange={(event) => update("customers", textToList(event.target.value))}
            />
          </Field>

          <Field label="내부 용어">
            <textarea
              id="company-internal-terms"
              className={textareaClass}
              rows={5}
              value={listToText(company.internalTerms)}
              onChange={(event) =>
                update("internalTerms", textToList(event.target.value))
              }
            />
          </Field>

          <Field label="금지 표현">
            <textarea
              id="company-banned-phrases"
              className={textareaClass}
              rows={5}
              value={listToText(company.bannedPhrases)}
              onChange={(event) =>
                update("bannedPhrases", textToList(event.target.value))
              }
            />
          </Field>

          <Field label="선호 문서 구조">
            <textarea
              id="company-document-formats"
              className={textareaClass}
              rows={5}
              value={listToText(company.documentFormats)}
              onChange={(event) =>
                update("documentFormats", textToList(event.target.value))
              }
            />
          </Field>

          <div className="flex flex-col justify-end gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <button
              className={secondaryButtonClass}
              type="button"
              onClick={saveCompanyContext}
            >
              {saved ? "저장됨 · 학습 반영" : "회사 기준 저장"}
            </button>
            <button
              className={primaryButtonClass}
              type="button"
              onClick={saveAndReturn}
            >
              저장 후 {getReturnLabel(returnPath)}
            </button>
          </div>
        </div>
      </Panel>
    </>
  );
}
