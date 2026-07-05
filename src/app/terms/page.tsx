import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Panel } from "@/components/ui";
import { supportEmail } from "@/lib/site/config";

export const metadata: Metadata = {
  title: "이용약관",
};

const clauses = [
  {
    title: "1. 서비스 성격",
    body: "Prompt AI Studio(이하 '서비스')는 브라우저에서 실행되는 로컬 우선 프롬프트 작성 도구입니다. 별도 계정 가입 없이 이용할 수 있으며, 사용자 콘텐츠는 원칙적으로 사용자의 브라우저에만 저장됩니다.",
  },
  {
    title: "2. 이용 자격",
    body: "누구나 별도 절차 없이 서비스를 이용할 수 있습니다. 관련 법령을 위반하는 목적으로 서비스를 이용해서는 안 됩니다.",
  },
  {
    title: "3. 이용자 콘텐츠 소유권",
    body: "사용자가 입력하거나 생성한 모든 프롬프트, 초안, 기준 데이터의 소유권은 전적으로 사용자에게 있습니다. 서비스는 이용자 콘텐츠에 대해 어떠한 권리도 주장하지 않습니다.",
  },
  {
    title: "4. Free 요금제",
    body: "로컬 생성 엔진과 관련 핵심 기능은 서버 비용이 발생하지 않는 구조로 제공되며, Free 요금제로 무기한 무료로 이용할 수 있습니다.",
  },
  {
    title: "5. Pro 요금제",
    body: "OpenAI 기반 고급 개선, 클라우드 동기화 등을 포함한 Pro 요금제는 준비 중이며, 활성화 시점과 조건은 별도 공지를 통해 안내합니다.",
  },
  {
    title: "6. 확장 프로그램",
    body: "Chrome 확장은 지원 대상 사이트(ChatGPT, Claude, Gemini)의 페이지 구조 변경에 따라 일시적으로 동작하지 않을 수 있습니다. 이는 서비스 결함이 아니며, 확인 즉시 수정을 시도합니다.",
  },
  {
    title: "7. 서비스 변경",
    body: "운영자는 기능 추가, 변경, 중단을 사전 고지 없이 진행할 수 있습니다. 중대한 변경 사항은 가능한 한 사전에 안내합니다.",
  },
  {
    title: "8. 무보증",
    body: "서비스는 '있는 그대로' 제공되며, 특정 목적 적합성이나 오류 없는 동작을 보증하지 않습니다.",
  },
  {
    title: "9. 책임 한계",
    body: "서비스 이용 또는 이용 불능으로 발생하는 손해에 대해 운영자는 관련 법령이 허용하는 최대 범위 내에서 책임을 지지 않습니다.",
  },
  {
    title: "10. 데이터 손실",
    body: "사용자 콘텐츠는 브라우저 로컬 저장소에 보관되므로, 브라우저 데이터 삭제, 기기 변경, 저장소 손상 등으로 데이터가 유실될 수 있습니다. 중요한 데이터는 서비스 내 내보내기 기능으로 사용자가 직접 백업해야 합니다.",
  },
  {
    title: "11. 지식재산권",
    body: "서비스의 소프트웨어, 디자인, 로고 등에 대한 권리는 운영자 또는 정당한 권리자에게 있습니다.",
  },
  {
    title: "12. 약관 변경",
    body: "운영자는 본 약관을 변경할 수 있으며, 변경 시 이 페이지의 최종 수정일을 갱신합니다.",
  },
  {
    title: "13. 준거법 및 관할",
    body: "본 약관은 대한민국 법률에 따라 해석되며, 서비스와 관련해 분쟁이 발생하는 경우 대한민국 법원을 관할 법원으로 합니다.",
  },
  {
    title: "14. 문의",
    body: `이용약관에 대한 문의는 ${supportEmail}로 연락해 주세요.`,
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="border-b border-line pb-6 pt-4 sm:pt-8">
        <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
          이용약관
        </h1>
        <p className="mt-2 text-sm text-muted">최종 수정일: 2026년 7월 5일</p>
      </header>

      <div className="flex flex-col gap-4 py-8 text-sm leading-6 text-muted">
        {clauses.map((clause) => (
          <Panel key={clause.title} className="p-5">
            <h2 className="mb-2 text-base font-semibold text-foreground">
              {clause.title}
            </h2>
            <p>{clause.body}</p>
          </Panel>
        ))}
      </div>

      <MarketingFooter />
    </div>
  );
}
