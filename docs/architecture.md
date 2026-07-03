# Architecture and Contributor Guide

이 문서는 코드베이스의 계층 구조와, 큰 화면 파일을 나눌 때 따르는 리팩토링 플레이북, 그리고 검증 스크립트가 소스와 맺는 계약을 설명합니다. 기획 배경은 `docs/personalized-prompt-ai-prd.md`, 저장소 설계는 `docs/storage-architecture.md`를 참고하세요.

## 계층 구조

앱은 로컬 우선(local-first) 구조입니다. 상태는 브라우저 `localStorage`에 저장되고, 외부 서비스 없이 로컬 규칙 기반으로 프롬프트를 생성합니다. `OPENAI_API_KEY`가 있으면 생성 품질을 보강하고, 없으면 자동으로 로컬 빌더로 동작합니다.

```
src/
  app/                     Next.js App Router 라우트와 API route 핸들러
    api/                   Request -> Response 순수 핸들러 (통합 테스트 대상)
  components/
    <feature>/             화면별 컴포넌트 트리
      <feature>-view.tsx   상태와 핸들러를 소유하는 orchestrator
      <feature>-*-panel.tsx  prop으로 구동되는 표시 전용 패널
      <feature>-view-types.ts  패널이 공유하는 타입
    common/                여러 화면이 공유하는 컴포넌트 (예: ManualCopyPanel)
    ui.tsx                 공통 레이아웃 primitive (Panel, PageHeader 등)
  lib/
    prompt/                생성, 점수, 언어/대상 AI 판단 같은 도메인 로직
    analytics/             성과 집계 요약
    studio/                Studio draft/source-meta/registry 계층 (lint 제한 있음)
    <feature>-view/        화면 컴포넌트에서 추출한 순수 헬퍼 (React 비의존)
    data/                  워크스페이스 저장, 백업, Supabase 마이그레이션 준비
    storage/               localStorage hook 계층
    navigation/            내부 링크 정규화와 절대 URL 변환
    browser/               클립보드 등 브라우저 API 래퍼
scripts/
  verify-*.mjs             소스 계약 검증 스크립트
  lib/                     검증 스크립트가 공유하는 헬퍼
e2e/                       Playwright 스모크 스펙 (수동 실행 전용)
```

### 저장소 hook 계층

`localStorage` 접근은 두 파일로 격리됩니다.

- `src/lib/storage/local-store.ts` — `storageKeys`, 저수준 read/write, `useSyncExternalStore` 기반 `useStoredState<T>` hook, 같은 탭 반응성을 위한 커스텀 이벤트.
- `src/lib/data/workspace-store.ts` — 도메인별 hook(`useUserProfileStore`, `usePromptAssetsStore`, `useLearningMemoriesStore` 등). 각 hook은 하나의 `storageKeys` 항목과 하나의 도메인 타입에 바인딩된 얇은 래퍼입니다.

새 화면에서 워크스페이스 데이터를 읽을 때는 `useStoredState`를 직접 쓰지 말고 `workspace-store.ts`의 도메인 hook을 사용합니다.

## 큰 화면 파일을 나누는 플레이북

화면 컴포넌트가 커지면 두 단계로 나눕니다. 두 단계 모두 함수 본문을 바이트 단위로 보존하고, 검증 스크립트의 소스 로딩만 갱신하는 것이 핵심입니다.

### 1단계 — 순수 헬퍼를 lib로 추출

`export function XView` 앞에 있는 모듈 레벨 순수 함수(리포트 텍스트 빌더, href 빌더, 라벨 맵, 그 함수들이 소유한 타입)를 React 비의존 `src/lib/<feature>-view/*.ts` 모듈로 옮깁니다.

- React 상태/hook/JSX를 참조하는 것은 옮기지 않습니다.
- 함수 본문은 바이트 단위로 동일하게 이동하고, `import`/`export` 줄만 바뀝니다.
- 각 파일은 800줄 이하를 목표로 관심사별로 묶습니다(hrefs, report-text, labels 등).
- 기존 `src/lib/studio`는 draft/registry 계층으로 lint 제한이 있으므로 화면 헬퍼를 넣지 않습니다. Studio 화면 헬퍼는 `src/lib/studio-view`에 둡니다.

예: `src/lib/library`, `src/lib/dashboard`, `src/lib/studio-view`, `src/lib/learning-view`, `src/lib/skills-view`.

### 2단계 — JSX를 패널로 분리

거대한 return JSX를 prop으로 구동되는 형제 패널 컴포넌트로 나눕니다.

- 핸들러(`openXInStudio`, `copyX` 등)는 orchestrator(`XView`)에 이름과 본문을 그대로 남기고, prop으로 패널에 전달합니다. 검증 스크립트가 핸들러 정의를 정규식으로 고정하기 때문입니다.
- JSX 마크업은 그대로 옮깁니다. 요소, className, id, data-testid, aria-label, 한국어 문구를 바꾸지 않습니다.
- prop 이름을 원래 식별자와 동일하게 지어 JSX 본문 자체가 변하지 않게 합니다. 이렇게 하면 검증 정규식이 소스 연결만으로 계속 일치합니다.
- 하나의 큰 closure를 공유하는 섹션은, 나누면 경계마다 수십 개 setter를 다시 넘겨야 해서 크기 외 이득이 없을 때 한 파일로 유지합니다. 이 결정은 커밋 메시지에 남깁니다.

패널 파일 구조의 참고 선례는 `src/components/integrations/`입니다. orchestrator 하나가 여러 형제 패널을 조합합니다.

## 검증 계약

`scripts/verify-*.mjs`는 소스 코드의 형태(핸들러 제어 흐름, 컴포넌트 이름, aria-label, data-testid, 상태 변수명)를 정규식으로 검증하는 계약 테스트입니다. 구조 리팩토링을 할 때는 짝이 되는 검증 스크립트를 함께 갱신해야 합니다.

### 소스 연결 패턴

파일을 나누면 검증 스크립트의 단일 `readSource(path)`를 여러 파일의 연결로 바꿉니다. `scripts/lib/read-source.mjs`의 헬퍼를 사용합니다.

```js
import { readConcatenatedSources, readSource } from "./lib/read-source.mjs";

const source = readConcatenatedSources([
  "src/lib/<feature>-view/labels.ts",   // 헬퍼 정의를 먼저 참조하는 assertion
  "src/components/<feature>/<feature>-view.tsx",   // 핸들러 정의
  "src/components/<feature>/<feature>-panel.tsx",  // 옮겨진 JSX
]);
```

연결 순서는 의미가 있습니다. assertion이 "정의가 먼저, 사용이 나중"을 정규식으로 기대하므로, 헬퍼 파일을 먼저, orchestrator를 그다음, 패널을 마지막에 두어 원래 소스 순서를 보존합니다.

### 규칙

- 함수 본문을 옮길 때는 바이트 단위로 보존하고 `export`만 추가합니다. 검증 정규식이 함수 텍스트를 그대로 대조합니다.
- assertion 정규식은 최대한 건드리지 않습니다. 파일 경계가 바뀌어 실패하면 스크립트의 소스 로딩(연결 목록/순서)을 먼저 고칩니다.
- 컴포넌트 이름을 바꿀 때는 스크립트 내 정규식의 이름을 함께 갱신합니다.
- 검증 스크립트의 파일 읽기/디렉터리 순회/정규식 escape는 `scripts/lib/read-source.mjs`의 `readSource`, `readConcatenatedSources`, `collectFiles`, `escapeRegExp`를 사용합니다.

### Studio draft source 추가

Studio 초안 출처를 새로 추가할 때의 순서는 README의 개발 기준을 따릅니다. 요약하면 `src/lib/prompt/types.ts`에 source ID를 먼저 추가하고, 라벨과 다음 액션 문구는 `src/lib/studio/source-registry.ts`에 추가하며, source ID와 registry key가 어긋나면 `source-registry.typecheck.ts`가 빌드의 TypeScript 단계에서 실패합니다. 화면 컴포넌트는 raw registry를 직접 import하지 않고 화면별 helper를 사용합니다.

## 테스트

세 계층으로 나뉩니다.

- **단위 테스트** — `src/**/*.test.ts`, vitest. `src/lib`의 순수 로직을 실제로 실행해 검증합니다. `@` alias와 node 환경을 사용합니다.
- **통합 테스트** — API route 핸들러(`src/app/api/**/route.test.ts`)를 `Request`로 직접 호출하고 `Response` 상태와 JSON을 검증합니다.
- **E2E** — `e2e/*.spec.ts`, Playwright(chromium). 크리티컬 사용자 흐름을 실제 브라우저로 확인합니다.

명령:

```bash
npm run test        # vitest 단위 + 통합 (verify에 포함됨)
npm run test:e2e    # Playwright (수동 실행 전용, dev 서버 자동 기동)
npx tsc --noEmit    # 테스트 파일까지 타입 체크 (next build는 테스트 파일을 건너뜀)
```

`test:e2e`는 dev 서버를 띄우므로 Next build 잠금을 존중하기 위해 검증 manifest에 등록하지 않고 수동 실행으로 둡니다.

### 테스트 작성 시 주의

- `scripts/verify-secret-safety.mjs`는 `KEY=value` 형태에 민감합니다. 테스트에서 환경 변수를 조작할 때는 `process.env[NAME]` 브래킷 표기를 쓰고, 가짜 값은 스캐너의 사전 승인 placeholder(`"openai-key"`, `"service-role-key"`, `"anon-key"`)를 사용합니다.
- 실제 비밀처럼 보이는 문자열을 픽스처에 넣지 않습니다.

## 검증과 CI

`npm run verify`는 `scripts/verify-all.mjs`를 통해 lint, `test`, `build`, 그리고 모든 `verify:*` 체크를 직렬로 실행합니다. Next build 잠금 때문에 `npm run verify`, `npm run verify:evidence`, `npm run build`를 동시에 실행하지 않습니다.

`.github/workflows/ci.yml`은 push와 pull request에서 두 잡을 실행합니다.

- **verify** — `npm ci` 후 `npx tsc --noEmit`과 `npm run verify`.
- **e2e** — chromium 설치 후 `npm run test:e2e`(별도 러너, `CI=true`).

키 없이 전부 통과합니다. 앱이 로컬 fallback 모드로 빌드/테스트되기 때문입니다.

### Evidence

`docs/evidence`에는 활성 evidence 레코드가 최대 하나만 허용됩니다. 검증 manifest에 체크를 추가한 뒤에는 `npm run verify:evidence -- --out-dir docs/evidence`로 레코드를 재생성하고 이전 파일을 삭제해야 `verify:evidence-hygiene`가 통과합니다. CI는 evidence를 생성하지 않습니다(두 번째 활성 레코드가 생겨 hygiene 검사가 실패하기 때문).

## operator gate 뒤의 작업

다음 항목은 외부 키나 인프라가 준비돼야 진행합니다. 준비 코드(dry-run, preflight, RLS SQL, 로컬 fallback 계약)는 이미 있고, gate를 여는 것이 남은 작업입니다.

- Supabase Postgres 저장소와 백업 importer 실행 경로 — Supabase project와 service-role 환경 필요.
- 문서 업로드 저장, server-side embedding, pgvector 검색 — Supabase schema와 embedding provider 필요.
- OpenAI 라이브 보강 비교 — `OPENAI_API_KEY` 필요.
- 팀/회사 워크스페이스 — 인증, 멤버 역할, ownership 정책 확정 필요.
