# Codex 개발 브리프

## 1. 개발 목표

개인화 프롬프트 AI 플랫폼의 1차 로컬 MVP를 만든다.

초기 앱은 사용자가 원문을 입력하면 개인/회사 프로필을 반영해 GPT, Claude, Codex, Gemini용 영어 또는 한영 하이브리드 전문 프롬프트를 생성하고 저장하는 웹앱이다.

## 2. 1차 개발 범위

### 포함

- Next.js 기반 앱 생성
- 사용자 프로필 폼
- 회사 프로필 폼
- 원문 입력 화면
- AI 도구 선택
- 전역 헤더는 현재 그룹의 빠른 이동 줄에서 같은 흐름의 기능명과 다음 행동을 함께 보여줘 모바일에서도 다음 화면을 바로 고르게 함
- 프롬프트 생성 결과 화면
- 생성 결과의 결과 실행 순서 요약은 `검토`, `AI 전달`, `저장` 단계별 현재 상태, 다음 확인 항목, 바로 실행할 다음 행동을 액션 버튼 앞에서 먼저 표시
- 생성 결과 액션 묶음은 현재 품질 진단, AI 전달 상태, 저장 상태를 짧은 배지와 판단 문구로 버튼 위에 표시
- 생성 결과 액션 묶음은 `01 검토`, `02 AI 전달`, `03 저장` 단계 번호를 함께 보여줘 버튼 영역만 봐도 실행 순서를 알 수 있게 함
- AI 전달이 차단 상태이면 `AI 전달` 액션 묶음 안에서도 `보강 브리프 적용`을 먼저 제공해 패키지 복사보다 재생성 루프를 우선 실행
- AI 전달 패키지 미리보기는 품질, 전달 상태, 현재 보기, 복사 대상을 모바일 2열과 데스크톱 4열 지표로 먼저 보여주고 전체 패키지와 실행 프롬프트 원문은 별도 preview로 유지한다.
- 저장 운영 요약과 Library/Skill/운영 조건 링크 fallback은 생성 당시 학습 증거와 대표 적용 메모리 제목을 함께 보존
- Library 상세의 학습 컨텍스트 카드는 `01 증거 확인`, `02 리포트 공유`, `03 Studio 개선` 단계로 enabled scope, 적용 메모리/피드백 수, 리포트 복사, Studio 재개선 초안을 연결
- 프롬프트 품질 점수 표시
- 프롬프트 저장
- 라이브러리 목록
- 피드백 입력
- 기본 로컬 데이터 저장 또는 단순 DB 스키마 준비

### 제외

- 결제
- 팀 권한
- 대규모 문서 업로드
- 모델 파인튜닝
- 외부 AI 도구 전체 자동 실행
- 복잡한 워크플로우 자동화

## 3. 추천 기술 스택

- App: Next.js, TypeScript
- Styling: Tailwind CSS
- Components: shadcn/ui 검토
- AI: OpenAI API 우선
- DB: 초기에는 로컬 mock 저장 또는 Supabase Postgres
- Vector Search: MVP 이후 pgvector
- Test: Vitest 또는 Playwright 중 프로젝트 구조에 맞춰 선택

## 4. 첫 화면 구조

### `/`

대시보드.

표시:

- 최근 프롬프트
- 새 프롬프트 생성 버튼
- 저장된 스킬 후보
- 프로필 완성도
- Library, Learning, Skills, 재개선 후보로 이동하는 운영 KPI
- 작성, 저장, 학습, 스킬화, 연결, 백업 6단계 핵심 workflow와 Integrations 이동 액션
- Dashboard 다음 실행 큐는 `01 첫 실행`, `02 실행 계획`, `03 완료 확인` 단계 카드로 우선 항목 처리, 큐 실행 계획, 완료 증거 확인 순서를 먼저 보여줌
- Dashboard 개인화, 다음 실행 큐, Learning 운영 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 원래 Dashboard 맥락을 복원하며, 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시함
- Dashboard 스킬 운영, 피드백 반영 개선, Studio 저장 출처, 저장 출처 메타 없음 큐, 개선 출처 상태 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 Dashboard 맥락을 복원하고, 개선 출처 후보 초안은 `Library 후보로 돌아가기` 복귀 액션 라벨로 대표 후보를 복원하며, 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시함
- 워크스페이스 데이터 준비도 요약과 Data 관리 이동 액션

### `/learning`

학습 메모리 운영 화면.

- Learning 피드백 개선 큐는 `01 검토`, `02 Studio`, `03 기록` 단계 카드를 함께 보여줘 낮은 신뢰도 확인, Studio 검증 초안 전송, 큐 리포트/검증 저장본 기록 순서를 바로 읽게 함
- Learning 수동 메모리 추가는 `01 범위 선택`, `02 규칙 작성`, `03 생성 반영` 단계 카드로 학습 scope, 재사용 규칙, 저장 후 Studio 반영 순서를 폼보다 먼저 보여줌
- Learning 준비도, 필터 결과, 개별 메모리, 피드백 개선 큐의 Studio 초안은 각각 `Learning 준비도로 돌아가기`, `Learning 조건으로 돌아가기`, `Learning 메모리로 돌아가기`, `Learning 피드백 큐로 돌아가기` 복귀 액션 라벨로 원래 조건을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시함

### `/skills`

스킬 운영 화면.

- Skills 운영 흐름은 원본 확인, 템플릿 정리, 실행 저장, 운영 개선을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 한다.
- Skills 운영 요약 지표는 모바일 2열과 데스크톱 3열로 전체 실행, 실행 스킬, 피드백, 최근 실행, 반복 상위, 개선 큐를 짧게 훑게 한다.
- Skills 실행 준비 흐름은 `01 템플릿 확인`, `02 실행 검증`, `03 운영 저장` 단계 카드로 템플릿 상태, 실행 입력/프롬프트 생성, Library 저장과 피드백 수집 순서를 바로 읽게 한다.
- Skills 운영 리포트 복사/Studio 전송에는 최근 실행 Library 링크와 상위/개선 큐 Skills 링크를 절대 URL로 포함한다.
- Skills 운영 요약과 개선 계획의 Studio 초안은 각각 `Skills로 돌아가기`, `Skills 스킬로 돌아가기` 복귀 액션 라벨로 원래 화면을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시한다.

### `/profile`

개인 프로필 설정.

입력:

- 직무
- 산업
- 주요 업무 목표
- 선호 답변 스타일
- 자주 쓰는 출력 형식
- 피해야 할 표현

### `/company`

회사 프로필 설정.

입력:

- 회사명
- 회사 설명
- 제품/서비스
- 고객군
- 브랜드 톤
- 내부 용어
- 금지 표현
- 문서 양식

### `/studio`

프롬프트 생성 화면.

구성:

- 원문 입력
- 분야 선택
- 목표 선택
- AI 자동 프롬프트 언어 판단
- 원문 입력 패널은 `생성 준비` 요약에서 입력 분석 상태, 100점 점수, 남은 보강 질문 수, 입력 길이, 목표/분야, 자동 언어 판단, 대상 AI, 적용 학습 메모리, 저장 예정 흐름을 생성 전에 확인
- 생성 준비 요약은 모바일 2열과 데스크톱 4열로 입력 준비도, 생성 기준, 학습 반영, 저장 예정 상태를 짧게 훑게 함
- 생성 준비 요약의 상단 배지와 첫 번째 준비 항목은 생성 운영 흐름, 입력 분석 배지, 다음 실행 입력 품질 지표와 같은 입력 준비도 라벨을 사용
- Studio 적용 학습 컨텍스트는 `01 Scope 선택`, `02 메모리 반영`, `03 생성 저장` 단계 카드로 학습 scope 선택, 상위 메모리 반영, Library 저장 추적 순서를 scope 토글보다 먼저 보여줌
- 입력 분석 프리플라이트는 목적, 맥락, 제약, 출력 형식 준비도를 100점 기준과 모바일 2열 체크로 보여주고 부족 항목은 보강 질문으로 제안
- 입력 분석 리포트는 clipboard fallback과 수동 복사용 textarea를 제공하고, 보강 질문을 원문에 추가해 생성 전 입력을 바로 다듬을 수 있게 함
- 생성 운영 흐름의 입력 단계는 입력 분석 상태와 100점 점수를 먼저 보여주고, 세부 줄 수와 목표/분야는 상세 설명으로 보존
- 최종 답변 언어 선택
- 대상 AI 선택
- 대상 AI 자동 추천 이유는 실제 추천 모델명과 일치해야 하며, Codex 실행 신호가 포함된 기획 입력은 GPT와 Codex 조합으로 설명
- 다음 실행 요약은 입력 품질, 상태, 프롬프트 언어, 대상 AI, 학습 증거를 모바일 2열과 데스크톱 5열로 생성 버튼 앞에서 재확인
- 다음 실행 요약은 `입력 보강`, `생성 실행`, `저장 추적` 체크를 함께 보여줘 생성 버튼을 누르기 전 보강 여부, 실행 기준, 저장 경로를 한 번에 확인하게 함
- 다음 실행 체크는 `01 입력 보강`, `02 생성 실행`, `03 저장 추적` 단계 번호를 함께 보여줘 생성 직전 확인 순서를 바로 읽게 함
- 다음 실행 상태는 단순 생성 가능 여부가 아니라 입력 분석 상태를 반영해 `바로 생성`, `검토 후 생성`, `보강 필요` 중 하나로 표시
- 다음 실행 요약은 보강 질문이 남아 있으면 생성 버튼 옆에 `보강 질문 추가`를 표시해 원문 입력으로 바로 반영
- `보강 질문 추가`를 누르면 각 질문 아래 `답:` 입력 줄을 원문에 붙인 뒤 원문 입력으로 스크롤하고 포커스하며 커서를 끝으로 옮겨 바로 답을 채울 수 있게 함
- 입력 분석은 `보강 질문 추가`로 붙은 질문 문장과 빈 `답:` 자리 자체를 준비도 신호로 계산하지 않고, 사용자가 채운 답변만 다시 분석 기준에 반영
- 입력 분석은 100점에 가까워도 남은 보강 질문이 있으면 `검토 후 생성`으로 유지하고, 모든 준비 항목이 해결된 경우에만 `바로 생성`으로 전환
- 입력 분석과 다음 실행 요약은 남은 보강 질문 수를 같이 표시해 90/100처럼 높은 점수에서도 무엇을 더 채워야 하는지 바로 보이게 함
- 생성 운영 흐름, 입력 분석 배지, 다음 실행의 입력 품질 지표는 같은 입력 준비도 라벨을 사용해 상태 해석이 화면마다 달라지지 않게 함
- 보강 질문 액션은 같은 질문 블록을 중복으로 붙이지 않고, 이미 추가된 상태에서는 `보강 질문 확인`으로 원문 입력에 포커스해 기존 `답:` 줄을 채우게 함
- 생성 버튼
- AI별 결과 탭
- 품질 점수
- 저장 버튼

Studio 초안 출처 관리:

- 초안 source ID는 `promptStudioDraftSources`에서 관리한다.
- 초안 source variant ID는 `promptStudioDraftSourceVariants`에서 관리하고, variant별 허용 source 규칙과 `sourceFeedback` 필요 여부는 `draft-variants.ts`에 둔다. variant별 표시 예외는 `draft-display.ts`에 둔다.
- `sourceFeedback`은 피드백을 요구하는 유효 variant로 정규화될 때만 Studio draft와 저장 메타에 보존한다.
- Dashboard, Learning, Library, Skills, Profile, Company에서 Studio draft로 넘기는 `sourceHref`는 `normalizeInternalHref` 규칙을 거쳐 내부 경로만 저장한다.
- Profile/Company 보강 화면의 `returnTo`와 저장 후 업데이트 신호 경로도 `normalizeInternalHref` 규칙을 거쳐 내부 경로만 사용한다.
- Profile/Company 맥락 요약은 필수 완료, 부족 항목, 확장 기준, 복귀 위치를 모바일 2열과 데스크톱 4열로 먼저 보여준다.
- Profile/Company AI 적용 프리뷰는 입력한 개인/회사 기준을 GPT, Claude, Codex, Gemini에 붙일 수 있는 영어 또는 한영 하이브리드 적용 지시문으로 미리 보여주고 복사하거나 Studio 초안으로 보낸다.
- Profile/Company AI 적용 프리뷰의 Studio 초안은 각각 `Profile로 돌아가기`, `Company로 돌아가기` 복귀 액션 라벨로 원래 기준 화면을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 적용 프롬프트 원문을 표시한다.
- Profile/Company AI 적용 프리뷰는 `01 기준 확인`, `02 적용 문구`, `03 Studio 전송` 단계 카드로 기준 점검, 영어/한영 하이브리드 지시문 적용, 외부 AI handoff 순서를 먼저 보여준다.
- 내부 링크를 복사용 절대 URL로 바꿀 때는 `formatAbsoluteInternalHref`를 사용한다.
- UI 컴포넌트에서 `@/lib/studio/href`를 직접 import하면 lint가 실패한다. 화면에서는 공용 navigation helper를 사용하고, Studio wrapper는 draft/source meta 계층에만 둔다.
- 저장되는 `studioSource` 메타 조립, optional 필드 조건부 포함, 내부 `sourceHref`, 입력 요약, count, timestamp 정규화는 `source-meta.ts`의 `createPromptStudioSourceMeta`에서 처리한다.
- Dashboard, Library, Studio에 노출되는 source 라벨, 설명, 다음 액션 문구는 `promptStudioSourceRegistry`에서 관리한다.
- 화면별 컴포넌트는 같은 source ID의 라벨을 별도 목록으로 중복 선언하지 않는다.
- 화면별 컴포넌트는 raw `promptStudioSourceRegistry`를 직접 읽지 않고 Dashboard, Library, Studio용 source helper를 통해 라벨을 읽는다. UI 컴포넌트에서 raw registry를 직접 import하면 lint가 실패한다.
- `source-registry.typecheck.ts`는 source ID 목록과 registry key의 불일치, source ID 중복, source variant ID 중복을 TypeScript build에서 잡는 안전장치다.
- 새 source를 추가하면 `npm run lint`, `npm run build`를 통과시킨 뒤 Library `studioSource` URL 필터와 Studio `draft` URL 로딩을 확인한다.

### `/library`

프롬프트 라이브러리.

기능:

- 목록
- 검색
- URL 기반 검색어 진입
- URL 기반 정렬 진입
- 태그 필터
- AI 도구 필터
- Dashboard AI 도구 성과에서 URL 필터 진입
- 언어 전략 필터
- Dashboard 언어 전략 성과에서 URL 필터 진입
- 답변 언어 필터
- Dashboard 답변 언어 성과에서 URL 필터 진입
- Dashboard 개선본 원본 대비 평균 개선폭과 차수별/AI 도구별/분야별 개선 효과 집계
- 수동 필터 변경 시 URL 동기화
- 수동 검색어 변경 시 URL 동기화
- 수동 정렬 변경 시 URL 동기화
- 개선본 원본 대비 점수 변화 기준 개선 효과순 정렬
- 언어 전략/답변 언어/대상 AI/생성 엔진/개선 상태 필터의 옵션별 개수 표시
- 목록/상세의 생성 엔진 배지와 OpenAI 모델명 표시
- Dashboard 생성 엔진별 품질/피드백 성과 요약과 Library 생성 엔진 필터 이동
- Dashboard 생성 엔진 상태 표시: OpenAI 보강 가능 여부와 로컬 fallback 모드 확인
- Dashboard 개선 효과 수치와 재개선 후보 KPI에서 Library 개선 상태 필터로 이동
- Dashboard 출처 상태 조치에서 보관함 원본/측정 불가의 사유별 count를 `sourceReason` Library 필터 링크로 제공하고 Library 목록/상세 출처 사유 배지, 필터 결과 대표 후보, 후보별 메모 복사/Studio 초안 전송, 조치 리포트 복사/Studio 초안 전송을 화면에 표시하며, Dashboard 후보별 메모 복사/Studio 초안 전송과 후보 제목, 원본 상태, 상세 링크를 포함한 전체 Markdown 계획 복사/Studio 초안 전송
- 조건별 검색/필터 해제
- 상단 적용 조건 요약
- 현재 검색/필터/정렬 공유 링크 복사와 초기화
- 상세 보기
- URL 기반 상세 프롬프트/버전 진입
- 상세 프롬프트/버전 링크 복사
- 버전 보기
- AI 도구별 버전 품질/피드백 비교
- 개선본 원본 대비 세부 품질 지표 변화 비교
- 목록/상세의 1차/2차 개선본 차수 배지, 원본/개선본 본문 비교 모드, 개선 체인/후속 재개선 이력, 비교 브리프 복사, Studio 재개선 연결, URL 딥링크 복원
- Dashboard 재개선 후보 큐에서 Library 비교 화면 진입 및 Studio 재개선 시작
- Studio 재개선 결과 저장 시 1차/2차 개선본 제목 차수 표기
- 선택 운영 요약은 `01 확인`, `02 공유`, `03 개선` 단계 카드로 상태 확인, 링크/리포트 공유, Studio 개선 실행 순서를 바로 읽게 함
- 선택 운영 요약 리포트와 AI 전달 보강 브리프의 Studio 초안은 `Library 운영 요약으로 돌아가기`, `Library 원본으로 돌아가기` 복귀 액션 라벨로 선택 상세를 복원하며, 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시함
- Library Studio 저장 방식, 저장 출처, 운영 묶음 리포트와 각 대표 후보의 Studio 초안은 `Library 필터로 돌아가기`, `Library 후보로 돌아가기`, `Library 운영 묶음으로 돌아가기` 복귀 액션 라벨로 해당 조건이나 후보를 복원하며, 저장이 실패하면 이동하지 않고 해당 조치 패널의 수동 복사용 원문 textarea를 표시함
- Library 상세의 학습 컨텍스트, 저장 출처 없음 메모, 개선/피드백/비교 개선 초안은 `Library 학습 증거로 돌아가기`, `원본 저장본으로 돌아가기`, `Library 원본으로 돌아가기`, `Library 피드백으로 돌아가기` 복귀 액션 라벨로 선택 상세를 복원하며, 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시함
- Library 출처 사유 조치 리포트와 대표 후보 메모의 Studio 초안은 `Library 필터로 돌아가기`, `Library 후보로 돌아가기` 복귀 액션 라벨로 출처 사유 조건이나 대표 후보를 복원하며, 저장이 실패하면 이동하지 않고 출처 사유 조치 패널의 수동 복사용 원문 textarea를 표시함
- Library 계열 Studio 초안은 `Library 원본으로 돌아가기`, `Library 피드백으로 돌아가기`, `Library 운영 요약으로 돌아가기`, `Library 필터로 돌아가기`, `Library 후보로 돌아가기`, `Library 운영 묶음으로 돌아가기`, `Library 큐로 돌아가기`, `원본 저장본으로 돌아가기`, `Library 학습 증거로 돌아가기` 복귀 액션 라벨로 원래 Library 조건이나 상세를 복원함
- 선택 버전의 전체 품질 점수, 가정, 부족한 정보 진단
- 선택 버전의 품질 기반 개선 액션, 개선 브리프 복사, Studio 개선 입력 연결, 개선 결과 출처 추적과 품질 개선 효과 표시
- 피드백 보기

### `/integrations`

Chrome, GPT/Claude/Codex/Gemini, MCP 클라이언트 연결 표면.

기능:

- Chrome selection capture, 외부 Gen AI handoff, Codex 작업 지시서, MCP 호출을 같은 prompt package 계약으로 정렬
- Integrations 지원 환경 요약에서 Chrome, ChatGPT/Claude/Gemini, Codex, MCP의 역할과 현재 gate를 모바일 2열과 데스크톱 4열로 먼저 보여주고, 외부 AI 표면은 로컬 smoke evidence 저장 후 reviewRequired package만 전달하는 기준을 명시하게 한다
- Integrations 연결 계약 매트릭스에서 Chrome, ChatGPT/Claude/Gemini, Codex, MCP별 capture, package, review gate, feedback 산출물을 같은 카드 구조로 보여줘 각 환경이 같은 review-required/confirmSave 계약을 어떻게 지키는지 한눈에 확인하게 한다
- Integrations 실행 증거 체크에서 로컬 연결, 정제 결과, 증거 저장, 전달 승인, 피드백 증거별로 남아야 할 evidence와 이동 링크를 먼저 보여줘 외부 AI 실행 전후의 검증 기준을 놓치지 않게 한다
- Integrations Smoke 증거 경로에서 MCP bridge, Chrome popup, Learning feedback 큐 smoke가 각각 command, evidence, result로 어떻게 이어지는지 상단에서 대조하고 상세 섹션으로 이동하게 한다
- Integrations 검증 게이트 요약에서 로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장 기준을 먼저 표시하고 게이트별 상세 이동 제공
- Integrations 검증 게이트 요약은 모바일 2열과 데스크톱 4열로 로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장 상태를 짧게 훑게 한다
- Integrations 운영자 다음 조치에서 로컬 서버 유지, 연결 표면 1개 검증, 로컬 smoke evidence 저장, 외부 AI 전달 전 검토, 실행 결과 피드백 저장 순서를 먼저 보여주고 각 단계의 내가 할 일, 완료 기준, evidence와 관련 상세 섹션 이동, 전체/단계별 다음 조치 Markdown 복사, `integrations-operations-checklist` Studio 초안 전송 제공. Studio 초안 원본 경로는 `#integrations-next-actions`로 돌아오며, 저장 실패 시 이동하지 않고 수동 복사용 다음 조치 원문 표시
- Integrations operations checklist 계열 Studio 복귀 액션 라벨은 `Integrations 원본 섹션으로 돌아가기`로 표시해 운영자 다음 조치, 외부 AI 운영 가이드, 환경별 실행 가이드, MCP smoke runbook 초안이 저장한 원본 섹션 앵커로 돌아가게 한다
- Integrations 외부 AI 운영 가이드에서 운영 단계, 첫 실행, review-required 전달 gate, confirmSave 피드백 저장 gate를 모바일 2열 요약으로 먼저 보여주고 로컬 앱 실행, 연결 표면 1개 선택, review-required 결과 확인, 로컬 smoke evidence 저장, 외부 AI 수동 전달, confirmSave 피드백 저장 판단 순서와 MCP 기본값 예시를 표시한다. 운영 가이드 복사/`integrations-operations-checklist` Studio 초안에는 실행 증거 체크와 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함하며 Studio 초안 원본 경로는 `#integrations-operator-guide`로 돌아오고, 저장 실패 시 이동하지 않고 수동 복사용 운영 가이드 원문 표시
- Integrations 연결 실행 순서에서 로컬 앱, 입력 수집, 증거 저장, 검토 전달, 피드백 저장을 첫 화면에 표시하고, Integrations 운영 흐름 요약에서 Capture, Refine, Evidence, Deliver, Feedback 단계별 owner, artifact, gate를 카드로 먼저 보여준 뒤 상세 표를 유지한다. 이를 통해 입력 수집, reviewRequired 정제, smoke evidence 저장, copy-ready 전달, confirmSave 피드백 저장 책임을 구분하며 섹션별 용도 설명이 포함된 빠른 이동 내비게이션과 Refine API 테스트, MCP 연결 설정, Smoke 증거 경로, 준비도, 환경별 실행 가이드, Feedback inbox 상세 섹션 앵커 이동 제공
- Integrations 자동화 원칙과 출시 순서는 기본 모드를 `Refine automatically, save evidence, deliver with review.`로 표시하고 `local-smoke-evidence`를 `target-ai-handoff` 전에 남기도록 보여줘 감사 출처와 출시 단계가 같은 evidence-first 흐름을 따르게 한다
- 환경별 실행 가이드에서 연결 환경, 대상 AI 범위, smoke evidence 저장과 review-required gate, confirmSave 피드백 경로를 모바일 2열 요약으로 먼저 보여주고 Chrome extension, ChatGPT/Claude/Gemini, Codex, MCP client별 connection mode, trigger, Studio action, output, operator check, target AI를 표시하며 각 환경의 operator check에서 local smoke evidence 저장을 외부 전달과 confirmSave 저장보다 먼저 고정한다. 환경별 체크리스트 복사, 환경별 체크리스트 Studio 전송, 전체 체크리스트 복사, `integrations-operations-checklist` 전체 체크리스트 Studio 전송 패키지는 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함해 직접 MCP 호출, 로컬 API 캡처, copy-ready handoff, Codex 구현 브리프 책임을 분리하고 Studio 초안 원본 경로는 `#integrations-environment-guide`로 돌아오게 한다. Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 체크리스트 원문 표시
- `POST /api/integrations/refine`에서 Chrome/MCP/외부 Gen AI 클라이언트용 원문 정제와 review-required target AI handoff package 반환
- Integrations refine tester에서 source app, target AI, domain, goal, raw input payload를 실행하고 handoff package를 확인/복사
- Integrations refine tester는 수집 경로, 대상 AI, 검토 gate, 전달 패키지 상태를 실행 버튼 앞에서 확인하게 하고, 요청 source/target/domain/goal과 reviewRequired/target package/quality/language 요약을 모바일 2열로 먼저 보여주며, 복사 전 체크리스트에서 로컬 smoke evidence 저장을 먼저 확인하게 하고, raw payload와 handoff package 원문은 별도 preview로 유지해야 한다
- Integrations MCP 연결 설정은 대상 클라이언트 수, 공유 mcpServers config, --self-test 첫 검증, confirmSave 피드백 gate를 모바일 2열 요약으로 먼저 보여주고 `01 로컬 준비`, `02 클라이언트 연결`, `03 검증과 학습` 단계 카드로 dev server/self-test, shared mcpServers config, reviewRequired smoke evidence와 confirmSave feedback 순서를 구분한다. Claude/Codex/GPT-compatible client별 config scope, target AI, use case, operator gate를 카드로 먼저 구분하고 공통 MCP client config, self-test 명령, dev server 명령, runbook 버튼 전 화면 요약과 복사/Studio 초안 원문에 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함하며 Studio 초안 원본 경로는 `#integrations-mcp-connection`으로 돌아오게 한다. `refine_prompt` 운영 체크리스트와 Claude/Codex/GPT-compatible MCP client별 설정 예시, smoke prompt, smoke feedback payload, feedback inbox API 확인, curl smoke check 복사, client별 feedback inbox 필터 링크 이동과 UI/API/curl 검증 경로를 카드로 먼저 보여준 뒤 상세 검증 매트릭스 제공. Codex와 GPT-compatible client는 같은 MCP server config를 공유하되 Codex는 repo-aware 구현 브리프와 별도 operator gate로 분리. Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 runbook 원문 표시
- Integrations 연결 준비도 점검에서 연결 표면, 첫 실행 표면, smoke 명령, smoke evidence 저장과 review-required 승인 gate를 모바일 2열 요약으로 먼저 보여주고 Chrome loaded smoke 체크리스트와 증빙 패킷으로 runtime, capture, result, session restore, evidence fallback 증거를 같은 순서로 확인하고 복사하게 하며 실제 Chrome popup에서 확인한 runtime/source/review gate/target AI/session/evidence result 값을 operator evidence packet, confirmSave false 기본의 `save_execution_feedback` payload, confirmSave true 저장 후 Feedback inbox UI/API/curl 확인 명령으로 복사하게 하고 Chrome extension, MCP client, ChatGPT/Claude/Gemini, Codex별 status gate, install step, smoke test, operator action을 표시하고 준비도 체크리스트와 smoke test 명령 복사
- Integrations MCP feedback inbox에서 `save_execution_feedback`으로 confirmSave된 JSONL 피드백을 최근 항목, rating, target AI 기준으로 읽기 전용 확인하고 저장 상태, 현재 결과, 현재 필터, 검증 상태를 모바일 2열 요약으로 먼저 보여주며 비어 있는 inbox에서는 `confirmSave: true` 저장 예시를 복사해 첫 feedback record를 만들 수 있게 하고 저장된 각 record에서는 Feedback ID, confirmSave gate, 증빙 준비 상태를 확인한 뒤 다음 확인 액션을 포함한 Feedback 증빙 패킷, learning memory candidate, Studio 개선 초안을 복사하게 한다. Learning candidate와 Studio 개선 초안에는 confirmSave true와 evidence-ready trace를 포함해 재사용 전 audit 기준을 보존한다. `mcpRating`/`mcpTargetAI` URL 필터 공유, 현재 필터 링크 복사, 현재 API endpoint 표시/복사, 현재 필터 기준 curl smoke check 표시/복사, 필터 초기화, 원본 필터 링크, record trace, 다음 확인 액션을 포함한 feedback report, Studio에서 단건 evidence-ready 초안과 trace-ready report의 confirmSave evidence trace 비교를 먼저 안내하는 `trace-ready` source title이 붙은 `mcp-feedback-report` 운영 리포트 Studio 초안과 저장 후 confirmSave evidence trace가 저장본에 반영됐는지 확인, learning candidate와 Studio 개선 초안 비교를 먼저 안내하는 `evidence-ready` source title이 붙은 `mcp-feedback-improvement` 단건 Studio 초안 전송, Feedback inbox 복귀 링크 및 원본 필터 링크 보존, Studio 복귀 액션 라벨은 `Feedback inbox로 돌아가기`로 표시하고 클릭 후 같은 `mcpRating`/`mcpTargetAI` 필터와 `#integrations-feedback-inbox` 앵커 복원, Studio 초안 저장 실패 시 수동 복사용 원문 표시
- `extensions/chrome` unpacked Chrome extension scaffold에서 현재 페이지 선택 텍스트 또는 우클릭 `Refine with Prompt AI Studio` context menu 선택을 읽고 저장된 local-only Studio URL과 Target AI/Domain/Goal 설정 기준으로 refine API 호출, review-required handoff package 표시/복사, 브라우저 세션 내 target/source/time 메타가 포함된 마지막 handoff package 복원. Chrome popup 실행 순서는 `01 선택 수집`, `02 Studio 정제`, `03 검토 전달` 단계로 선택 텍스트, local refine API, review-required handoff 복사 흐름을 먼저 표시하고, Smoke evidence 패널은 runtime/capture/refine/deliver/evidence packet 증거를 같은 popup에서 대조하게 하며, Handoff result summary는 review gate, target AI, source, session 저장 상태를 handoff 원문 위에서 먼저 표시하고, Evidence 버튼은 같은 결과 기준의 Chrome handoff evidence packet을 복사하고 실패 시 수동 복사용 evidence textarea를 열며, 정적 preview에서는 Chrome extension runtime unavailable 상태를 표시하고 page selection/session restore를 건너뛰어 layout smoke를 안정화
- `mcp/prompt-ai-studio.mjs` stdio MCP bridge에서 `get_context_profile` read-only 컨텍스트 정책과 operation defaults 도구, `refine_prompt`, `create_handoff_package`, `save_execution_feedback` 도구를 노출하고 MCP 클라이언트 호출을 local refine API의 review-required handoff package와 confirm-save feedback inbox로 변환하며 `PROMPT_AI_STUDIO_TARGET_AI`/`DOMAIN`/`GOAL`/`SOURCE_URL` 환경 기본값 지원
- `refine_prompt`, `get_context_profile`, `create_handoff_package`, `save_execution_feedback` MCP 도구 계약 초안 표시
- 자동 정제는 허용하되 외부 전송은 review-required handoff로 남기는 gate 원칙 표시
- company → user → learning → skill 컨텍스트 우선순위와 English 또는 Korean-English hybrid 언어 전략 표시
- `verify:integrations`에서 route, navigation, Chrome/Gen AI/MCP 표면, MCP 도구 계약, 문서 반영 여부 검증

### `/data`

워크스페이스 데이터 관리.

기능:

- 현재 로컬 데이터 수량 요약
- 백업 JSON 생성, 복사, 다운로드
- 백업 생성 후 JSON 길이/수량/백업 지문 요약과 다운로드/복사 액션 표시
- Data 워크스페이스 스냅샷 수량과 문서/RAG 핵심 상태는 모바일 2열과 데스크톱 4열로 압축해 로컬 데이터와 RAG 준비 상태를 짧게 훑게 한다
- Data 문서/RAG Studio 초안은 복귀 액션 라벨을 `Data 문서/RAG로 돌아가기`로 표시하고 원본 경로를 `/data`로 저장하며, 초안 저장이 실패하면 이동하지 않고 문서/RAG Studio 원문을 수동 복사용 textarea로 표시한다
- 가져오기 검증과 복원 확인창에서 현재 생성본과의 백업 지문 일치 여부와 불일치 경고 표시
- 마지막 백업 생성 시각과 수량 요약 저장
- 마지막 백업 대비 현재 데이터 변경 감지와 백업 업데이트 필요 표시
- 마지막 백업 대비 변경된 데이터 항목 요약
- 변경 항목 요약에서 백업 즉시 갱신
- 백업 JSON 붙여넣기 또는 파일 선택 기반 검증과 복원
- 검증된 백업의 앱 식별자, 스키마, 생성 시각, 입력 방식 요약
- 복원 성공 시 최근 백업 상태를 복원한 백업 기준으로 최신화
- 복원 완료된 동일 검증본의 반복 복원 방지
- 복원 실행 전 현재 데이터와 백업 데이터의 수량/핵심 프로필 영향 미리보기
- 복원 시 데이터 감소와 핵심 프로필 변경 리스크 요약 및 확인창 재표시
- 복원 영향/리스크 리포트 복사의 백업 지문, 영향, 리스크, 원본 백업 보관 gate 요약 fallback 제공
- Dashboard의 워크스페이스 데이터 상태에서 백업 기준 시각과 변경 항목 요약 표시
- Supabase 전환이나 팀 워크스페이스 확장 전 데이터 준비도 체크리스트
- 준비도 체크리스트의 백업 스냅샷 항목에서 즉시 백업 생성/갱신
- 운영 환경 readiness 체크리스트의 runtime gate/action queue 요약 fallback과 `.env.local` 템플릿 복사의 exposure/secret guard 요약 fallback으로 server-only/browser-public 값, import execution gate 기본값, storage mode guard 확인
- Supabase 매핑과 importer dry-run에서 삭제 보관함 snapshot을 `deleted_prompt_assets` 대상으로 포함
- Supabase 마이그레이션 매핑과 실행 체크리스트 복사의 상태별 count, 예상 row, owner/auth, schema/RLS, rollback gate 요약 fallback 제공
- Supabase importer dry-run의 row/batch/warning/deleted archive 요약 fallback, `pending-*` 참조 치환 가이드의 치환 범위/audit gate 요약 fallback, row count verification SQL의 workspace/row/table 요약 fallback, relationship verification SQL의 check/warning/issue_count gate 요약 fallback, pending ID audit SQL의 replacement row/issue_count gate 요약 fallback, RLS owner access audit SQL의 owner mapping/smoke test gate 요약 fallback, RLS policy draft SQL의 review/role/smoke test gate 요약 fallback, RLS smoke test 체크리스트의 workspace/owner session/isolation gate 요약 fallback, verification report의 acceptance gate 요약 fallback, migration handoff package의 section/evidence/UUID trace 요약 fallback 복사
- Data 가져오기 검증, 복원 리포트, Supabase 매핑, 체크리스트, dry-run, pending ID 치환 요약은 모바일 2열로 먼저 보여주고 상세 테이블과 실행 gate는 별도로 유지한다
- Data post-import 검증 SQL, 관계 검증, pending ID audit, RLS audit/policy/smoke, 검증 리포트, migration handoff 요약은 모바일 2열로 먼저 보여주고 SQL/체크리스트/패키지 원문은 별도 preview로 유지한다
- 실제 workspace/owner UUID를 입력해 `pending-*`가 제거된 Supabase import execution plan 복사, UUID 치환/acceptance gate 요약 fallback
- server-only Supabase importer 구현을 위한 `insertRows` adapter 계약과 테이블 삽입 순서 복사, adapter 계약 식별/plan gate 요약 fallback
- `POST /api/data/supabase-import`에서 server-side import plan/adapter contract 반환, 실제 쓰기는 env gate와 confirmation으로 제한
- `/data`에서 `execute:false` API preflight로 server-side import route validation, insert order table, execution packet manifest와 next-action 식별/gate 요약 fallback, route audit artifact와 식별/route audit 요약 fallback, runtime readiness 기반 실행 판정 메모, controlled execution packet, preflight/rehearsal Markdown 리포트, 실행 후 검증 evidence record 확인
- 런타임 상태 JSON, 런타임 진단 리포트, 운영자 조치 계획, 스냅샷 비교 리포트 복사의 확인 시각/release gate/환경 요약/action queue/stage-score 변화 fallback 제공
- Data 안전 실행 순서는 `01 백업 고정`, `02 준비도 확인`, `03 실행 분리` 단계 카드로 백업 최신 여부, 데이터/runtime readiness, execute=false preflight와 execution packet 분리를 먼저 보여준다
- Data 운영 환경 readiness와 Supabase 실행 패킷의 핵심 gate 상태는 모바일 2열 요약으로 먼저 보여주고, 상세 체크리스트와 복사 액션은 그대로 분리한다
- preflight 결과를 백업 fingerprint/workspace_id/owner_user_id에 묶고 값이 바뀌면 stale 표시 및 dependent copy action 차단
- preflight scope 비교는 `src/lib/data/supabase-import-preflight-scope.ts`의 순수 유틸로 분리해 UI와 copy guard가 같은 판정 기준을 사용
- `/data`에서 Supabase import `execute:true` 요청 템플릿과 실행 금지 체크리스트 복사, 요청/체크리스트 식별 및 gate 요약 fallback
- `verify:data-management`에서 `/data`의 `copyDataText` 호출이 failure notice와 metadata-rich manual fallback body를 포함하는지 AST 기반으로 검증

## 5. 핵심 타입 초안

```ts
export type TargetModel = "general" | "gpt" | "claude" | "codex" | "gemini";

export type PromptLanguageStrategy = "english" | "hybrid";

export type PromptOutputLanguage = "korean" | "english" | "same_as_input";

export interface PromptLanguageDecisionMeta {
  strategy: PromptLanguageStrategy;
  label: string;
  reason: string;
  confidence: "moderate" | "strong";
  signals: string[];
}

export interface UserProfile {
  id: string;
  role: string;
  industries: string[];
  goals: string[];
  preferredTone: string;
  preferredOutputs: string[];
  avoidPhrases: string[];
  repeatedTasks: string[];
}

export interface CompanyProfile {
  id: string;
  companyName: string;
  description: string;
  products: string[];
  customers: string[];
  brandTone: string;
  internalTerms: string[];
  bannedPhrases: string[];
  documentFormats: string[];
}

export interface TargetModelDecisionMeta {
  targetModels: TargetModel[];
  reason: string;
  confidence: "moderate" | "strong";
  signals: string[];
}

export interface PromptRequest {
  id: string;
  rawInput: string;
  goal: string;
  domain: string;
  targetModels: TargetModel[];
  targetModelDecision: TargetModelDecisionMeta;
  languageStrategy: PromptLanguageStrategy;
  languageDecision: PromptLanguageDecisionMeta;
  outputLanguage: PromptOutputLanguage;
  createdAt: string;
}

export interface PromptSkill {
  id: string;
  name: string;
  description: string;
  domain: string;
  targetModel: TargetModel;
  languageStrategy: PromptLanguageStrategy;
  languageDecision: PromptLanguageDecisionMeta;
  outputLanguage: PromptOutputLanguage;
  inputGuide: string;
  promptTemplate: string;
  outputFormat: string;
  qualityChecklist: string[];
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromptVersion {
  id: string;
  promptId: string;
  targetModel: TargetModel;
  content: string;
  qualityScore: number;
  scoreBreakdown: PromptScoreBreakdown;
  assumptions: string[];
  missingContext: string[];
  createdAt: string;
}

export interface PromptScoreBreakdown {
  clarity: number;
  context: number;
  outputFormat: number;
  constraints: number;
  expertise: number;
  modelFit: number;
  reusability: number;
}

export interface Feedback {
  id: string;
  promptVersionId: string;
  rating: number;
  comment: string;
  feedbackType: "tone" | "context" | "format" | "accuracy" | "company_rule" | "other";
  createdAt: string;
}
```

## 6. 핵심 로직 구조

```text
src/
  app/
    page.tsx
    profile/page.tsx
    company/page.tsx
    studio/page.tsx
    library/page.tsx
    api/
      generate-prompt/route.ts
  components/
    profile/
    company/
    studio/
    library/
    ui/
  lib/
    prompt/
      analyze-request.ts
      build-base-prompt.ts
      adapters.ts
      score-prompt.ts
      types.ts
    storage/
      local-store.ts
```

## 7. 프롬프트 생성 파이프라인

### Step 1. 요청 분석

입력:

- 사용자 원문
- 선택 분야
- 선택 목표
- 대상 AI 도구
- 대상 AI 도구별 성과 요약

출력:

- 의도
- 필요한 결과물
- 부족한 정보
- 가정

### Step 2. 맥락 구성

입력:

- 사용자 프로필
- 회사 프로필
- 분야별 기본 규칙

출력:

- 프롬프트에 반영할 맥락

### Step 3. 기본 프롬프트 생성

기본 구조:

- 역할
- 목표
- 배경
- 입력
- 작업 지시
- 제약 조건
- 출력 형식
- 품질 기준
- 불확실성 처리

### Step 4. AI별 변환

- `general`
- `gpt`
- `claude`
- `codex`
- `gemini`

### Step 5. 품질 점수 계산

점수 항목:

- 명확성
- 맥락
- 출력 형식
- 제약 조건
- 전문성
- 도구 적합성
- 재사용성

## 8. 1차 구현 태스크

### Task 1. 프로젝트 생성

목표:

Next.js + TypeScript 앱을 만든다.

완료 기준:

- 로컬 개발 서버 실행
- 기본 레이아웃 표시
- `/`, `/profile`, `/company`, `/studio`, `/library` 라우트 생성

### Task 2. 기본 UI 구성

목표:

프롬프트 스튜디오의 주요 화면을 만든다.

완료 기준:

- 프로필 폼 입력 가능
- 회사 폼 입력 가능
- 원문 입력 가능
- AI 도구 선택 가능
- 결과 탭 UI 표시

### Task 3. 로컬 저장 구현

목표:

초기에는 브라우저 localStorage 또는 간단한 파일/DB mock으로 저장한다.

완료 기준:

- 프로필 저장
- 회사 프로필 저장
- 생성된 프롬프트 저장
- 라이브러리에서 조회

### Task 4. 프롬프트 생성 로직 구현

목표:

AI API 연동 전에도 동작하는 규칙 기반 프롬프트 빌더를 만든다.

완료 기준:

- 원문을 기반으로 기본 프롬프트 생성
- GPT/Claude/Codex/Gemini 버전 생성
- 품질 점수 표시

### Task 5. AI API 연동

목표:

OpenAI API를 붙여 프롬프트 분석/개선 품질을 높인다.

완료 기준:

- `.env.example` 제공
- API key 없을 때 graceful fallback
- API key 있을 때 생성 품질 향상
- Studio 생성 엔진 상태에서 OpenAI 보강 가능 여부와 로컬 fallback 모드 표시

### Task 6. 피드백 루프 구현

목표:

사용자의 평가와 코멘트를 저장한다.

완료 기준:

- 점수 입력
- 코멘트 입력
- 피드백 유형 선택
- 다음 생성 시 피드백 요약 반영

## 9. Codex 첫 실행 프롬프트

아래 프롬프트로 첫 개발을 시작하면 된다.

```text
이 워크스페이스에서 개인화 프롬프트 AI 플랫폼의 1차 로컬 MVP를 구현해줘.

우선 outputs/personalized-prompt-ai-prd.md 와 outputs/codex-development-brief.md 를 기준으로 해.

목표:
- Next.js + TypeScript 앱 생성
- `/`, `/profile`, `/company`, `/studio`, `/library` 라우트 구현
- 사용자 프로필과 회사 프로필 입력/저장
- 원문 입력을 GPT, Claude, Codex, Gemini용 전문 프롬프트로 변환
- 품질 점수 표시
- 프롬프트 저장 및 라이브러리 조회

제약:
- 처음에는 외부 DB 없이 localStorage 또는 간단한 로컬 저장으로 시작
- OpenAI API 연동은 구조만 준비하고, API key가 없어도 앱이 동작해야 함
- 과도한 추상화 없이 MVP 검증에 필요한 구조로 구현
- 구현 후 실행 가능한 dev server URL을 알려줘
- 의미 있는 검증을 실행하고 결과를 보고해줘
```

## 10. 검증 체크리스트

개발 후 반드시 확인한다.

- 앱이 로컬에서 실행되는가
- 모든 라우트가 접근 가능한가
- 프로필 저장이 동작하는가
- 회사 프로필 저장이 동작하는가
- 원문 입력 후 AI별 프롬프트가 생성되는가
- 품질 점수가 표시되는가
- 프롬프트 저장 후 라이브러리에서 조회되는가
- 피드백 저장이 동작하는가
- 모바일/데스크톱에서 화면이 깨지지 않는가
- 테스트, 빌드, 린트 중 가능한 검증을 실행했는가

## 11. 개발 중 판단 기준

- 사용자가 바로 써볼 수 있는 기능을 우선한다.
- 처음부터 완벽한 AI 학습을 만들지 않는다.
- 프로필, 회사 맥락, 피드백이 실제 프롬프트에 반영되는지를 우선 검증한다.
- UI는 설명 페이지보다 실제 작업 화면 중심으로 만든다.
- Codex용 프롬프트는 개발자가 바로 작업할 수 있는 수준의 범위, 파일, 검증 조건을 포함해야 한다.
