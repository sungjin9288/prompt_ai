import type { Metadata } from "next";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Panel } from "@/components/ui";
import { chromeStoreUrl } from "@/lib/site/config";

export const metadata: Metadata = {
  title: "홈",
};

const features = [
  {
    title: "ChatGPT/Claude/Gemini 안에서 원클릭 개선",
    description:
      "Chrome 확장을 설치하면 chatgpt.com, claude.ai, gemini.google.com 입력창 옆에 개선 버튼이 붙습니다. 클릭 한 번으로 초안을 다듬어 입력창에 바로 채워줍니다.",
  },
  {
    title: "품질 점수와 버전 관리가 있는 라이브러리",
    description:
      "생성한 프롬프트는 품질 점수와 함께 저장되고, 개선을 거듭할 때마다 버전 이력으로 남아 원본과 개선본을 비교할 수 있습니다.",
  },
  {
    title: "피드백이 다음 생성에 반영되는 학습 루프",
    description:
      "저장하거나 개선할 때 남긴 신호가 개인화 기준으로 쌓여 다음 프롬프트 생성에 반영됩니다.",
  },
  {
    title: "데이터는 브라우저에만 — 계정·서버 불필요",
    description:
      "프롬프트, 설정, 학습 데이터는 모두 브라우저 로컬 저장소에 남습니다. 로그인이나 별도 서버 없이 바로 시작할 수 있습니다.",
  },
];

export default function WelcomePage() {
  const isChromeStoreReady = chromeStoreUrl.length > 0;

  return (
    <div className="mx-auto max-w-4xl">
      <section className="flex flex-col gap-6 border-b border-line pb-10 pt-4 text-center sm:pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Prompt AI Studio
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
          프롬프트를 전문가 수준으로 — 로컬에서, 무료로
        </h1>
        <p className="text-balance text-sm leading-6 text-muted sm:text-base">
          별도 서버나 계정 없이 브라우저에서 바로 프롬프트를 다듬고, 저장하고,
          개선하는 로컬 우선 워크스페이스입니다.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-background transition hover:bg-accent-strong sm:w-auto"
          >
            바로 시작하기
          </Link>
          {isChromeStoreReady ? (
            <a
              href={chromeStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-control-border bg-panel-strong px-6 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent sm:w-auto"
            >
              Chrome 확장 설치
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-md border border-control-border bg-panel-strong px-6 py-2.5 text-sm font-semibold text-muted opacity-50 sm:w-auto"
            >
              Chrome 확장 설치 · 출시 준비 중
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-4 py-10 sm:grid-cols-2">
        {features.map((feature) => (
          <Panel key={feature.title} className="p-5">
            <h2 className="text-base font-semibold text-foreground">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {feature.description}
            </p>
          </Panel>
        ))}
      </section>

      <Panel className="flex flex-col items-center gap-3 p-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          로컬 엔진은 무제한, 영구 무료
        </h2>
        <p className="max-w-xl text-sm leading-6 text-muted">
          서버 비용이 들지 않는 로컬 생성 엔진은 계속 무료로 제공됩니다. 클라우드
          동기화가 필요한 Pro 요금제는 준비 중입니다.
        </p>
        <Link
          href="/pricing"
          className="text-sm font-semibold text-accent transition hover:text-accent-strong"
        >
          가격 정책 보기 →
        </Link>
      </Panel>

      <MarketingFooter />
    </div>
  );
}
