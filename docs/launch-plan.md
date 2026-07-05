# 출시·상용화 계획 (Launch Plan)

수립: 2026-07-05 · 벤치마크: Pretty Prompt ("Grammarly for prompting")

## 벤치마크 요약

Pretty Prompt는 ChatGPT/Claude/Gemini/Perplexity 페이지 안에서 원클릭 프롬프트 개선(Improve),
질문 기반 정제(Refine), 프롬프트 라이브러리를 제공하는 Chrome 확장. 무로그인 즉시 사용,
Free(주 10회) → Lite($4.99/월) → Pro($8.25/월, 무제한·메모리·핫키·폴더) 과금.
확장은 `app.pretty-prompt.com/improve-prompt?source=extension&origin=chatgpt` 형태의
웹 개선 페이지를 연다.

## 현 자산 대비 갭

| # | 갭 | 현재 상태 |
|---|----|-----------|
| 1 | 확장 localhost 전용 | popup.js가 http://localhost 외 차단 |
| 2 | in-page 통합 없음 | popup 전용, content script 없음 |
| 3 | 스토어 자산 없음 | 아이콘/스크린샷/문안 없음 |
| 4 | 배포 없음 | Vercel 미구성, version 0.1.0 |
| 5 | 랜딩/가격/법무 페이지 없음 | 스토어 등록에 privacy policy URL 필수 |
| 6 | 과금 모델 없음 | entitlement 개념 부재 |

## 페이즈

- **P47 확장 프로덕션화 — 완료** (자율): HTTPS 프로덕션 origin 허용 + 설정 UI, 아이콘 생성,
  zip 패키징 스크립트, verify-chrome-extension-smoke 동기.
- **P48 in-page 통합 — 완료** (자율, 핵심 패리티): chatgpt.com/claude.ai/gemini.google.com
  composer에 "개선" 버튼 → 초안 읽기 → /api/integrations/refine → 결과를 입력창에 삽입.
- **P49 /improve 경량 페이지 — 완료** (자율): `?draft=&source=extension&origin=` 초점형 개선
  페이지, 기존 studio draft 흐름 재사용.
- **P50 배포 코드 준비 — 완료** (자율): `src/lib/site/config.ts` 공용 site config seam,
  루트/주요 라우트 메타데이터(title template, OG, Twitter card), `robots.ts`/`sitemap.ts`,
  브랜드 마크 기반 `icon.png`/`apple-icon.png`/`favicon.ico`/`public/og.png`
  (`npm run icons:app`), `next.config.ts` 보안 헤더(X-Content-Type-Options,
  Referrer-Policy, X-Frame-Options, Permissions-Policy). CSP는 이번 단계에 포함하지
  않음 — Tailwind 인라인 스타일과의 상호작용을 별도로 검증해야 하므로 후속 phase 후보로
  남김. 실제 Vercel 프로젝트 연결과 배포 실행은 운영자 게이트(아래 체크리스트) 이후
  진행.
- **P51 랜딩·가격·법무 — 완료** (자율): `/welcome` 마케팅 랜딩(히어로, 기능 4종,
  가격 티저), `/pricing`(Free 이용 가능 / Pro 준비 중), `/privacy`(로컬 저장 원칙,
  확장 권한 표, Chrome Web Store 요구사항 대응), `/terms`(14개 조항, 대한민국
  준거법). `chromeStoreUrl`/`supportEmail` config seam 추가, `sitemap.ts`에 4개
  라우트 등록, 각 페이지 자체 footer로 상호 링크. 법무 문서는 템플릿 기반으로
  작성되었으므로 유료 출시 전 운영자의 법률 검토가 필요합니다.
- **P52 스토어 등록 패키지** (게이트: 개발자 계정 $5): 목록 문안(ko/en), 스크린샷,
  제출 런북.
- **P53 상용화 스캐폴딩** (게이트: Stripe/OpenAI/Supabase 키): entitlement 모델
  (Free=로컬 무제한 / Pro=OpenAI 개선+동기화), 결제·계정 seam과 활성화 런북만.

## 과금 기본안 (조정 가능)

- **Free**: 로컬 엔진 전체 무제한 (서버 비용 0 → 지속 가능, pretty-prompt 대비 차별점).
- **Pro**: OpenAI 기반 고급 개선/Refine + 클라우드 동기화 (키·인프라 활성화 후).

## 운영자 게이트 체크리스트

- [ ] Vercel 계정 연결·프로젝트 생성 (hobby 무료)
- [ ] 도메인 (선택)
- [ ] Chrome Web Store 개발자 계정 ($5 일회)
- [ ] OpenAI API 키 (Pro 기능 활성화 시)
- [ ] Stripe 계정 (결제 활성화 시)
- [ ] Supabase 프로젝트 (동기화 활성화 시)
