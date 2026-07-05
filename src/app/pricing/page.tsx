import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Panel, PanelHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "가격",
};

const freeFeatures = [
  "로컬 생성 엔진 무제한 사용",
  "라이브러리, 버전 관리, 학습 루프 전체 기능",
  "Chrome 확장 in-page 개선",
  "모든 데이터 브라우저 로컬 보관",
];

const proFeatures = [
  "OpenAI 기반 고급 개선·Refine",
  "기기 간 클라우드 동기화",
  "우선 지원",
];

const faqItems = [
  {
    question: "데이터는 어디에 저장되나요?",
    answer:
      "프롬프트, 설정, 학습 데이터는 모두 사용자 브라우저의 로컬 저장소에 저장됩니다. 별도 서버로 전송되지 않습니다.",
  },
  {
    question: "정말 무료인가요?",
    answer:
      "네. 로컬 생성 엔진은 서버 비용이 들지 않기 때문에 Free 요금제로 무제한 계속 제공됩니다.",
  },
  {
    question: "Pro는 언제 나오나요?",
    answer:
      "OpenAI 기반 고급 개선과 클라우드 동기화를 포함한 Pro 요금제는 준비 중이며, 가격과 출시 시점은 출시 시 공개됩니다.",
  },
  {
    question: "확장은 어떤 사이트를 지원하나요?",
    answer: "현재 ChatGPT(chatgpt.com), Claude(claude.ai), Gemini(gemini.google.com)를 지원합니다.",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <section className="border-b border-line pb-8 pt-4 text-center sm:pt-8">
        <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
          가격
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          로컬 엔진은 서버 비용이 없어 영구 무료입니다 — 이것이 다른 서비스와의
          가장 큰 차이입니다.
        </p>
      </section>

      <section className="grid gap-4 py-8 sm:grid-cols-2">
        <Panel className="flex flex-col">
          <PanelHeader title="Free · 현재 이용 가능" description="₩0" />
          <div className="flex flex-1 flex-col gap-4 p-5">
            <ul className="flex flex-1 flex-col gap-2 text-sm text-muted">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition hover:bg-accent-strong"
            >
              바로 시작하기
            </Link>
          </div>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader title="Pro · 준비 중" description="가격 출시 시 공개" />
          <div className="flex flex-1 flex-col gap-4 p-5">
            <ul className="flex flex-1 flex-col gap-2 text-sm text-muted">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-muted">·</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled
              className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-md border border-control-border bg-panel-strong px-4 py-2 text-sm font-semibold text-muted opacity-50"
            >
              준비 중
            </button>
          </div>
        </Panel>
      </section>

      <Panel className="p-5 text-center">
        <p className="text-sm leading-6 text-muted">
          로컬 엔진은 브라우저에서 실행되어 서버 비용이 들지 않습니다. 그래서
          Free 요금제는 영구적으로 무료로 유지됩니다.
        </p>
      </Panel>

      <section className="py-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          자주 묻는 질문
        </h2>
        <div className="flex flex-col gap-3">
          {faqItems.map((item) => (
            <Panel key={item.question} className="p-5">
              <h3 className="text-sm font-semibold text-foreground">
                {item.question}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {item.answer}
              </p>
            </Panel>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
