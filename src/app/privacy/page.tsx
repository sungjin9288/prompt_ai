import type { Metadata } from "next";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { Panel } from "@/components/ui";
import { supportEmail } from "@/lib/site/config";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
};

const permissionRows = [
  {
    permission: "activeTab",
    reason: "사용자가 확장 아이콘이나 우클릭 메뉴를 실행한 현재 탭에서만 선택 텍스트를 읽기 위해 필요합니다.",
  },
  {
    permission: "storage",
    reason: "Studio 연결 주소, 세션 상태 등 확장 설정을 브라우저에 저장하기 위해 필요합니다.",
  },
  {
    permission: "contextMenus",
    reason: "선택한 텍스트를 바로 개선할 수 있는 우클릭 메뉴 항목을 추가하기 위해 필요합니다.",
  },
  {
    permission: "scripting",
    reason: "ChatGPT/Claude/Gemini 페이지의 입력창 옆에 개선 버튼을 삽입하기 위해 필요합니다.",
  },
  {
    permission: "content_scripts (chatgpt.com, claude.ai, gemini.google.com)",
    reason: "지원하는 세 사이트의 입력창을 감지하고 개선 버튼과 결과를 표시하기 위해 필요합니다.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="border-b border-line pb-6 pt-4 sm:pt-8">
        <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
          개인정보 처리방침
        </h1>
        <p className="mt-2 text-sm text-muted">최종 수정일: 2026년 7월 5일</p>
      </header>

      <div className="flex flex-col gap-6 py-8 text-sm leading-6 text-muted">
        <Panel className="p-5">
          <h2 className="mb-2 text-base font-semibold text-foreground">
            1. 로컬 저장 원칙
          </h2>
          <p>
            Prompt AI Studio에서 생성·저장하는 모든 프롬프트, 프로필/회사 기준,
            학습 데이터, 설정 값은 사용자 브라우저의 로컬 저장소(localStorage)에만
            저장됩니다. 별도 서버 데이터베이스에 사용자 콘텐츠를 저장하지
            않습니다.
          </p>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-2 text-base font-semibold text-foreground">
            2. 서버로 전송되는 데이터
          </h2>
          <p>
            서버로 전송되는 것은 사용자가 Chrome 확장의 개선 버튼, `/improve`
            페이지, 또는 MCP 연결을 통해 명시적으로 보낸 프롬프트 초안뿐입니다.
            이 초안은 개선 결과를 계산하는 데만 사용되며, 처리 후 서버에
            저장하지 않습니다.
          </p>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-2 text-base font-semibold text-foreground">
            3. 쿠키와 추적
          </h2>
          <p>
            이 서비스는 광고 또는 사용자 추적 목적의 쿠키, 방문자 분석
            스크립트(예: Google Analytics, PostHog 등)를 사용하지 않습니다.
            서비스 내 &quot;분석&quot; 화면은 사용자의 로컬 데이터를 브라우저
            안에서 집계해 보여주는 통계 요약이며, 외부로 전송되거나 운영자에게
            공유되지 않습니다.
          </p>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-2 text-base font-semibold text-foreground">
            4. Chrome 확장 권한
          </h2>
          <p className="mb-3">
            Chrome 확장은 아래 권한만 요청하며, 각 권한은 명시된 기능에만
            사용됩니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-line text-left text-soft">
                  <th className="py-2 pr-4 font-semibold">권한</th>
                  <th className="py-2 font-semibold">사용 목적</th>
                </tr>
              </thead>
              <tbody>
                {permissionRows.map((row) => (
                  <tr key={row.permission} className="border-b border-line">
                    <td className="py-2 pr-4 font-mono text-soft">
                      {row.permission}
                    </td>
                    <td className="py-2">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-2 text-base font-semibold text-foreground">
            5. 데이터 삭제
          </h2>
          <p>
            브라우저 저장소를 초기화하거나 서비스 내 데이터 관리 화면에서
            초기화하면 모든 로컬 데이터가 즉시 삭제됩니다. 서버에 보관되는
            사용자 콘텐츠가 없으므로 별도의 서버 측 삭제 절차가 필요하지
            않습니다.
          </p>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-2 text-base font-semibold text-foreground">
            6. 정책 준수
          </h2>
          <p>
            본 방침은 Chrome Web Store 개발자 프로그램 정책의 개인정보
            공개 요구사항을 충족하기 위해 작성되었습니다. 확장이 수집·전송하는
            데이터 범위가 변경되면 이 페이지와 스토어 등록 정보를 함께
            갱신합니다.
          </p>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-2 text-base font-semibold text-foreground">
            7. 문의
          </h2>
          <p>
            개인정보 처리방침에 대한 문의는 {supportEmail}로 연락해 주세요.
          </p>
        </Panel>
      </div>

      <MarketingFooter />
    </div>
  );
}
