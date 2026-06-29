# 개인화 프롬프트 AI 플랫폼 MVP PRD

## 1. 제품 개요

### 작업명

`Personalized Prompt AI Studio`

제품명은 확정하지 않는다. 초기 개발 단계에서는 기능과 구조를 먼저 검증한다.

### 한 줄 정의

사용자가 대략적으로 적은 생각, 업무 요청, 질문, 글감을 개인/회사/분야 맥락에 맞게 해석하고, GPT, Claude, Codex, Gemini 등 각 AI 도구에 적합한 전문 프롬프트로 변환, 테스트, 저장, 개선하는 AI 프롬프트 개발 플랫폼.

### 제품 목표

- 사용자의 모호한 요청을 명확하고 실행 가능한 프롬프트로 바꾼다.
- 개인의 업무 방식, 말투, 선호 결과물, 반복 업무를 학습한다.
- 회사의 브랜드 톤, 내부 용어, 문서 양식, 금지 표현, 업무 기준을 반영한다.
- 분야별 전문 프롬프트 구조를 축적한다.
- 좋은 프롬프트를 라이브러리, 버전, 스킬 단위로 관리한다.
- 사용자의 피드백과 실행 결과를 다음 프롬프트 개선에 반영한다.

### 초기 포지셔닝

처음부터 대기업용 프롬프트 관리 플랫폼으로 시작하지 않는다. 1차 목표는 창업자 본인이 실제로 사용하면서 제품의 학습 구조와 프롬프트 품질을 검증하는 개인용 MVP다. 단, 데이터 구조는 나중에 팀/회사 단위로 확장 가능하게 설계한다.

## 2. 문제 정의

### 사용자 문제

많은 사용자는 AI에게 무엇을 시켜야 하는지 알고 있지만, AI가 잘 수행할 수 있도록 정확한 프롬프트로 바꾸는 데 어려움을 겪는다.

대표적인 문제는 다음과 같다.

- 요청이 모호해서 결과물이 매번 달라진다.
- 직무, 산업, 회사 맥락이 반영되지 않는다.
- 좋은 프롬프트를 만들어도 재사용하거나 개선하기 어렵다.
- GPT, Claude, Codex, Gemini처럼 AI 도구별 강점이 다른데 같은 프롬프트를 그대로 사용한다.
- 회사에서는 브랜드 톤, 보안, 내부 기준, 품질 관리가 필요하다.
- 반복 업무를 AI 스킬로 만들고 싶지만 체계적인 저장/학습 구조가 없다.

### 핵심 기회

AI를 더 잘 쓰는 사람은 단순히 프롬프트 문장을 잘 쓰는 사람이 아니라, 목적, 맥락, 제약, 자료, 출력 형식, 평가 기준을 잘 구조화하는 사람이다. 이 제품은 그 구조화 과정을 소프트웨어로 만든다.

## 3. 핵심 사용자

### 1차 사용자

창업자, 기획자, 마케터, 개발자, 컨설턴트, 콘텐츠 제작자처럼 여러 분야의 업무를 AI와 함께 처리하는 개인 전문가.

### 2차 사용자

소규모 팀 또는 회사. 팀 내부에서 반복적으로 사용하는 프롬프트, 업무 양식, 브랜드 톤, 문서 기준을 표준화하려는 조직.

### 장기 사용자

산업별 전문 업무를 AI 기반으로 자동화하려는 회사. 예: 부동산, 금융, 교육, 의료, 법률, 제조, 커머스, SaaS, 콘텐츠, 채용, 컨설팅.

## 4. 제품 원칙

- 프롬프트를 일회성 문장이 아니라 재사용 가능한 업무 자산으로 관리한다.
- 처음부터 모델 파인튜닝에 의존하지 않는다.
- 개인화는 프로필, 문서 검색, 피드백, 실행 기록, 스킬 저장을 조합해 구현한다.
- 사용자가 입력한 원문을 없애지 않고, 정제 과정과 개선 이유를 보여준다.
- AI별 프롬프트는 단순 번역이 아니라 목적에 맞는 작업 지시서로 변환한다.
- Chrome, GPT, Claude, Codex, Gemini, MCP 클라이언트 어디에서 호출해도 같은 개인/회사/학습 기준으로 정제된 프롬프트를 받을 수 있어야 한다.
- 자동화는 프롬프트 정제와 패키징을 빠르게 처리하되, 외부 AI에 전달하기 전에는 검토 가능한 handoff package를 남긴다. Integrations 화면은 로컬 앱, 입력 수집, 증거 저장, 검토 전달, 피드백 저장 순서를 먼저 보여줘 자동화와 사람 검토 책임을 분리한다.
- Integrations 지원 환경 요약은 Chrome, ChatGPT/Claude/Gemini, Codex, MCP의 역할과 현재 gate를 모바일 2열과 데스크톱 4열로 먼저 보여주고, 외부 AI 표면은 로컬 smoke evidence 저장 후 reviewRequired package만 전달하는 기준을 명시해야 한다.
- Integrations 연결 계약 매트릭스는 Chrome, ChatGPT/Claude/Gemini, Codex, MCP별 capture, package, review gate, feedback 산출물을 같은 카드 구조로 보여줘 각 환경이 같은 review-required/confirmSave 계약을 어떻게 지키는지 한눈에 확인하게 해야 한다.
- Integrations 실행 증거 체크는 로컬 연결, 정제 결과, 증거 저장, 전달 승인, 피드백 증거별로 남아야 할 evidence와 이동 링크를 먼저 보여줘 외부 AI 실행 전후의 검증 기준을 놓치지 않게 해야 한다.
- Integrations Smoke 증거 경로는 MCP bridge, Chrome popup, Learning feedback 큐 smoke가 각각 command, evidence, result로 어떻게 이어지는지 상단에서 대조하고 상세 섹션으로 이동하게 해야 한다.
- Integrations 검증 게이트 요약은 로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장 상태를 모바일 2열과 데스크톱 4열로 먼저 보여줘야 한다.
- Integrations 운영 흐름은 Capture, Refine, Evidence, Deliver, Feedback 단계별 owner, artifact, gate를 카드로 먼저 보여준 뒤 상세 표를 유지해야 한다.
- Integrations 자동화 원칙과 출시 순서는 기본 모드를 `Refine automatically, save evidence, deliver with review.`로 표시하고 `local-smoke-evidence`를 `target-ai-handoff` 전에 남기도록 보여줘 감사 출처와 출시 단계가 같은 evidence-first 흐름을 따라야 한다.
- Chrome popup 실행 순서는 `01 선택 수집`, `02 Studio 정제`, `03 검토 전달` 단계로 선택 텍스트, local refine API, review-required handoff 복사 흐름을 먼저 보여줘야 한다.
- Chrome popup Smoke evidence 패널은 runtime/capture/refine/deliver/evidence packet 증거를 같은 popup에서 보여줘 정적 preview와 loaded extension smoke를 같은 기준으로 확인하게 해야 한다.
- Chrome popup handoff result summary는 review gate, target AI, source, session 저장 상태를 handoff 원문 위에서 먼저 보여줘 복사 가능 여부를 판단하게 해야 한다.
- Chrome popup Evidence 버튼은 생성 또는 복원된 handoff 결과의 review gate, target AI, source, session, model, quality, domain, goal을 Chrome handoff evidence packet으로 복사하고 실패 시 수동 복사용 evidence textarea를 열게 해야 한다.
- Chrome popup 정적 preview는 Chrome extension runtime unavailable 상태를 표시하고 page selection/session restore를 건너뛰어 layout smoke를 안정적으로 수행할 수 있어야 한다.
- 외부 정제 API는 `POST /api/integrations/refine`을 기준으로 시작하고, 응답에는 `reviewRequired`, target별 handoff package, 품질 점검, 누락 맥락을 포함한다.
- Integrations refine tester는 수집 경로, 대상 AI, 검토 gate, 전달 패키지 상태를 실행 버튼 앞에서 확인하게 하고, 요청 source/target/domain/goal과 reviewRequired/target package/quality/language 요약을 모바일 2열로 먼저 보여주며, 복사 전 체크리스트에서 로컬 smoke evidence 저장을 먼저 확인하게 하고, raw payload와 handoff package 원문은 별도 preview로 유지해야 한다.
- Integrations MCP feedback inbox는 `save_execution_feedback`으로 confirmSave된 외부 AI 실행 피드백을 저장 상태, 현재 결과, 현재 필터, 검증 상태의 모바일 2열 요약으로 먼저 보여주고, 비어 있는 inbox에서는 `confirmSave: true` 저장 예시를 복사해 첫 feedback record를 만들 수 있게 하며, 저장된 각 record에서는 Feedback ID, confirmSave gate, 증빙 준비 상태를 확인한 뒤 다음 확인 액션을 포함한 Feedback 증빙 패킷, learning memory candidate, Studio 개선 초안을 복사하고 learning candidate와 Studio 개선 초안에는 confirmSave true와 evidence-ready trace를 포함해 재사용 전 audit 기준을 보존해야 한다. 단건 개선 초안의 `evidence-ready` source title과 feedback report의 `trace-ready` source title에는 같은 record trace와 다음 확인 액션을 포함해야 한다. Studio에서 단건 개선 초안을 불러오면 learning candidate와 Studio 개선 초안 비교를 먼저 안내하고, feedback report 초안을 불러오면 단건 evidence-ready 초안과 trace-ready report의 confirmSave evidence trace 비교를 먼저 안내해야 한다. 저장 후에도 confirmSave evidence trace와 각 비교 결과가 저장본에 반영됐는지 확인하게 하고 Feedback inbox 복귀 링크를 보존해야 하며, 복귀 액션 라벨은 `Feedback inbox로 돌아가기`로 표시하고 클릭 후 같은 `mcpRating`/`mcpTargetAI` 필터와 `#integrations-feedback-inbox` 앵커를 복원해야 한다. Studio 초안 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시해야 한다.
- Integrations operations checklist 계열 Studio 전송은 운영자 다음 조치, 외부 AI 운영 가이드, 환경별 실행 가이드, MCP smoke runbook 초안 저장에 실패하면 Studio로 이동하지 않고 해당 원문을 수동 복사용 textarea로 표시해야 한다. Studio 복귀 액션 라벨은 `Integrations 원본 섹션으로 돌아가기`로 표시해 각 초안이 저장한 원본 섹션 앵커로 돌아가야 한다.
- Integrations 운영자 다음 조치 Studio 초안의 원본 경로는 `/integrations#integrations-next-actions`로 저장해 Studio에서 원본으로 돌아갈 때 운영자 다음 조치 섹션을 복원해야 한다.
- Integrations 외부 AI 운영 가이드 Studio 초안의 원본 경로는 `/integrations#integrations-operator-guide`로 저장해 Studio에서 원본으로 돌아갈 때 외부 AI 운영 가이드 섹션을 복원해야 한다.
- Integrations 연결 준비도는 연결 표면, 첫 실행 표면, smoke 명령, smoke evidence 저장과 review-required 승인 gate를 모바일 2열 요약으로 먼저 보여줘야 한다.
- Integrations 연결 준비도는 Chrome loaded smoke 체크리스트와 증빙 패킷으로 runtime, capture, result, session restore, evidence fallback 증거를 같은 순서로 보여주고 복사하게 해 실제 extension 로드 상태의 통과 기준과 기록 기준을 확인하게 해야 한다.
- Integrations 연결 준비도는 실제 Chrome popup에서 확인한 runtime, source, review gate, target AI, session, evidence result 값을 operator evidence packet, confirmSave false 기본의 `save_execution_feedback` payload, confirmSave true 저장 후 Feedback inbox UI/API/curl 확인 명령으로 복사하게 해 자동화 도구가 extension 로드를 직접 수행하지 못해도 실행 증빙, 학습 후보, 저장 확인 경로를 제품 안에 남기게 해야 한다.
- Integrations 외부 AI 운영 가이드는 운영 단계, 첫 실행, review-required 전달 gate, confirmSave 피드백 저장 gate를 모바일 2열 요약으로 먼저 보여주고, 외부 AI 전달 전 로컬 smoke evidence 저장 단계와 실행 증거 체크를 포함해야 한다. 운영 가이드 복사와 `integrations-operations-checklist` Studio 초안은 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함해야 한다.
- Integrations MCP 연결 설정은 대상 클라이언트 수, 공유 mcpServers config, --self-test 첫 검증, confirmSave 피드백 gate를 모바일 2열 요약으로 먼저 보여줘야 한다.
- Integrations MCP 연결 설정은 `01 로컬 준비`, `02 클라이언트 연결`, `03 검증과 학습` 단계 카드로 dev server/self-test, shared mcpServers config, reviewRequired smoke evidence와 confirmSave feedback 순서를 먼저 보여줘야 한다.
- Integrations MCP runbook 섹션은 복사와 Studio 초안 버튼 전에 감사 출처와 evidence gate 요약을 먼저 보여줘야 한다.
- Integrations MCP end-to-end smoke runbook 복사와 `integrations-operations-checklist` Studio 초안은 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함해야 한다.
- Integrations MCP runbook Studio 초안의 원본 경로는 `/integrations#integrations-mcp-connection`으로 저장해 Studio에서 원본으로 돌아갈 때 MCP 연결 섹션을 복원해야 한다.
- Integrations MCP client examples는 Claude/Codex/GPT-compatible client별 config scope, target AI, use case, operator gate를 카드로 먼저 구분해 보여줘야 한다.
- Integrations MCP feedback verification은 client별 UI filter, API endpoint, curl check를 카드로 먼저 보여준 뒤 상세 검증 매트릭스를 유지해야 한다.
- Integrations 환경별 실행 가이드는 연결 환경, 대상 AI 범위, smoke evidence 저장과 review-required gate, confirmSave 피드백 경로를 모바일 2열 요약으로 먼저 보여줘야 한다.
- Integrations 환경별 실행 가이드는 Chrome extension, ChatGPT/Claude/Gemini, Codex, MCP client별 operator check에서 local smoke evidence 저장을 외부 전달과 confirmSave 저장보다 먼저 확인하게 해야 한다. 환경별 체크리스트 복사와 `integrations-operations-checklist` Studio 초안은 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함해야 한다.
- Integrations 환경별 체크리스트 Studio 초안의 원본 경로는 `/integrations#integrations-environment-guide`로 저장해 Studio에서 원본으로 돌아갈 때 환경별 실행 가이드 섹션을 복원해야 한다.
- 대상 AI 도구는 사용자가 매번 직접 고르는 값이 아니라 원문, 목표, 분야를 바탕으로 시스템이 우선 추천하고, 사용자가 필요하면 조정할 수 있어야 한다.
- 대상 AI 추천 결과는 추천 모델, 판단 이유, 신뢰도, 감지 신호를 함께 저장해 Library에서 검토할 수 있어야 한다.
- 대상 AI 자동 추천 이유는 실제 추천 모델명과 일치해야 하며, Codex 실행 신호가 포함된 기획 입력은 GPT와 Codex 조합으로 설명해야 한다.
- 사용자는 한국어로 입력할 수 있고, 시스템은 원문, 분야, 대상 AI, 회사 맥락을 판단해 전체 영어 지시문 또는 한영 하이브리드 전문 프롬프트로 변환한다.
- 프롬프트 언어 전략은 사용자가 직접 고르는 값이 아니라 시스템이 자동 판단한다. 개발/Codex 중심 작업은 전체 영어 지시문을 우선하고, 한국어 원문/회사/시장 맥락 보존이 중요한 작업은 한영 하이브리드를 적용한다.
- 자동 판단 결과는 전략값뿐 아니라 판단 이유, 신뢰도, 감지 신호를 함께 저장해 나중에 Library와 Skills에서 검토할 수 있어야 한다.
- 프롬프트 작성 언어와 대상 AI의 최종 답변 언어는 분리한다. 기본 답변 언어는 한국어이며, 필요하면 영어 또는 입력 언어와 동일하게 지정할 수 있다.
- 회사 맥락은 개인 취향보다 우선할 수 있어야 한다.
- 검증되지 않은 사실, 수치, 법률/의료/금융 판단은 임의 생성하지 않도록 프롬프트 레벨에서 제어한다.
- 모바일과 데스크톱 모두에서 화면은 단순하고 읽기 쉬워야 한다.
- 공통 운영 흐름 컴포넌트는 모바일에서는 단계별 행으로 압축하고 데스크톱에서는 4단계 카드로 보여주되 같은 정보와 액션을 유지해야 한다.
- Profile/Company 기본 맥락 준비도는 모바일 2열로 필수 항목 상태를 압축해 보강할 항목을 빠르게 확인하게 해야 한다.
- Profile/Company 맥락 요약은 필수 완료, 부족 항목, 확장 기준, 복귀 위치를 모바일 2열과 데스크톱 4열로 먼저 보여줘야 한다.
- Profile/Company AI 적용 프리뷰는 입력한 개인/회사 기준을 GPT, Claude, Codex, Gemini에 붙일 수 있는 영어 또는 한영 하이브리드 적용 지시문으로 미리 보여주고 복사하거나 Studio 초안으로 보낼 수 있어야 한다.
- Profile/Company AI 적용 프리뷰의 Studio 초안 저장이 실패하면 이동하지 않고 수동 복사용 적용 프롬프트 원문을 표시해야 한다.
- Profile/Company AI 적용 프리뷰는 `01 기준 확인`, `02 적용 문구`, `03 Studio 전송` 단계 카드로 기준 점검, 영어/한영 하이브리드 지시문 적용, 외부 AI handoff 순서를 먼저 보여줘야 한다.
- 기능 화면은 현재 상태, 핵심 작업, 다음 행동이 한눈에 보이는 순서로 배치한다.
- 전역 헤더는 현재 그룹의 빠른 이동 줄에서 같은 흐름의 기능명과 다음 행동을 함께 보여줘 모바일에서도 다음 화면을 바로 고르게 해야 한다.
- 위험 행동은 검증 또는 확인 단계를 분리해 실수로 실행되지 않게 한다.

## 5. MVP 범위

### 반드시 포함할 기능

1. 사용자 프로필
   - 직무
   - 산업
   - 업무 목표
   - 선호 답변 스타일
   - 자주 쓰는 출력 형식
   - 피해야 할 표현
   - 완성도와 다음 보강 액션을 표시한다.
   - Profile/Company 상단 운영 흐름은 필수 맥락 입력, 보강 질문 복사, user/company scope 학습 반영, 원래 작업 화면 복귀를 먼저 보여줘야 한다.
   - 부족한 개인 맥락 질문을 복사할 수 있어야 하며 clipboard 권한 제한 환경에서는 fallback과 수동 복사용 textarea를 제공한다.
   - 저장 시 user scope 학습 메모리로 반영해 다음 Studio 생성 컨텍스트에서 사용할 수 있어야 한다.

2. 회사/브랜드 프로필
   - 회사 설명
   - 제품/서비스 설명
   - 고객군
   - 브랜드 톤
   - 내부 용어
   - 금지 표현
   - 선호 문서 구조
   - 기본 회사 맥락 입력, 보강 질문 복사, company scope 학습 반영, 원래 작업 화면 복귀를 상단 운영 흐름에서 먼저 보여줘야 한다.

3. 원문 입력 기반 프롬프트 변환
   - 사용자가 자유롭게 요청을 적는다.
   - 시스템이 목적, 맥락, 결과물, 부족한 정보, 적합한 AI 도구를 분석한다.
   - 적합한 대상 AI 도구를 자동 추천하되, 사용자가 필요하면 추천과 다른 조합으로 조정할 수 있다.
   - 전체 영어 지시문 또는 한영 하이브리드 전문 프롬프트 초안을 자동 판단해 만든다.

4. AI 도구별 프롬프트 생성
   - 범용 프롬프트
   - GPT용 프롬프트
   - Claude용 프롬프트
   - Codex용 프롬프트
   - Gemini용 프롬프트
   - 대상 AI 도구 추천은 원문/목표/분야 기반으로 자동 판단하고, 추천 이유와 감지 신호를 프롬프트 자산에 저장
   - 언어 전략: 전체 영어 지시문, 한영 하이브리드
   - 언어 전략은 사용자 선택이 아니라 원문/분야/대상 AI/회사 맥락 기반 자동 판단
   - 판단 이유와 감지 신호를 프롬프트 자산에 저장
   - 최종 답변 언어: 한국어, 영어, 입력 언어와 동일

5. 프롬프트 품질 점수
   - 명확성
   - 맥락 충분성
   - 출력 형식 구체성
   - 제약 조건 명확성
   - 도구 적합성
   - 재사용 가능성
   - Studio의 현재 버전, 품질 리포트, 학습 리포트, 보강 질문, 비교 리포트 복사는 clipboard 권한 제한 환경에서도 fallback을 시도하고 실패 시 수동 복사용 textarea를 제공
	   - Studio 생성 결과 액션은 `검토`, `AI 전달`, `저장` 흐름으로 나뉘며 현재 버전/품질 리포트 복사, AI 전달 패키지 복사/보기, Library 저장을 같은 fallback 정책으로 제공해야 한다
	   - Studio 생성 결과 액션 묶음은 현재 품질 진단, AI 전달 상태, 저장 상태를 짧은 배지와 판단 문구로 버튼 위에 표시해야 한다
	   - Studio 생성 결과 액션 묶음은 `01 검토`, `02 AI 전달`, `03 저장` 단계 번호를 함께 보여줘 버튼 영역만 봐도 실행 순서를 알 수 있게 해야 한다
	   - AI 전달이 차단 상태이면 `AI 전달` 액션 묶음 안에서도 `보강 브리프 적용`을 먼저 제공해 패키지 복사보다 재생성 루프를 우선 실행하게 해야 한다
   - Studio 생성 결과의 결과 실행 순서 요약은 각 단계의 현재 상태, 다음 확인 항목, 바로 실행할 다음 행동을 액션 버튼 앞에서 먼저 보여줘야 한다
   - AI 전달 패키지 미리보기는 품질, 전달 상태, 현재 보기, 복사 대상을 모바일 2열과 데스크톱 4열 지표로 먼저 보여주고 전체 패키지와 실행 프롬프트 원문은 별도 preview로 유지해야 한다.
   - Studio 생성 결과 저장 후 저장된 프롬프트의 Library 상세와 현재 활성 버전으로 바로 이동하거나 같은 상세 링크를 복사하고, 저장 프롬프트를 Skills 빌더로 바로 전환할 수 있어야 한다
   - Studio 저장 운영 요약과 `Library 링크 복사`, `Skill 링크 복사`, 저장 출처/저장 방식/운영 묶음 조건 링크 fallback은 생성 당시 학습 증거와 대표 적용 메모리 제목을 함께 보존해야 한다

6. 프롬프트 라이브러리
   - 저장
   - 태그
   - 분야
   - 목적
   - AI 도구
   - AI 도구 필터
   - 언어 전략
   - 최종 답변 언어
   - 답변 언어 필터
   - URL 기반 검색/필터/정렬/상세 프롬프트/버전 진입, 수동 검색/필터/정렬 변경 시 URL 동기화, 조건별 해제, 상단 적용 조건 요약, 현재 검색/필터/정렬 공유 링크 복사와 초기화
   - 개선본 원본 대비 점수 변화 기준 개선 효과순 정렬
   - 언어 전략/답변 언어/대상 AI/생성 엔진/개선 상태 필터의 옵션별 개수 표시
   - 학습 scope 필터와 URL 공유
   - 목록/상세의 생성 엔진 배지와 OpenAI 모델명 표시
   - Dashboard 생성 엔진별 품질/피드백 성과 요약과 Library 생성 엔진 필터 이동
   - Dashboard 생성 엔진 상태 표시: OpenAI 보강 가능 여부와 로컬 fallback 모드 확인
   - 버전
   - 상세 프롬프트/버전 링크 복사
   - 현재 버전, 공유 링크, 상세 링크, 학습 리포트, 보강 질문, 비교/개선 브리프 복사는 clipboard 권한 제한 환경에서도 fallback을 시도하고 실패 시 수동 복사용 textarea를 제공
   - AI 도구별 버전 품질/피드백 비교
   - 개선본 원본 대비 세부 품질 지표 변화 비교
   - 목록/상세의 1차/2차 개선본 차수 배지, 원본/개선본 본문 비교 모드, 개선 체인/후속 재개선 이력, 비교 브리프 복사, Studio 재개선 연결, URL 딥링크 복원
   - Library 운영 흐름은 검색 조건, 목록 결과, 선택 프롬프트 운영 요약, 출처/이력 추적을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 해야 한다.
   - Library 선택 운영 요약의 저장 방식, 출처, 체인은 모바일 2열과 데스크톱 3열로 압축해 상세 패널에서도 보존 방식과 다음 조치를 빠르게 확인하게 해야 한다.
   - Library 선택 운영 요약은 `01 확인`, `02 공유`, `03 개선` 단계 카드를 함께 보여줘 저장본을 열었을 때 상태 확인, 링크/리포트 공유, Studio 개선 실행 순서를 바로 읽게 해야 한다.
   - Library 선택 운영 요약 리포트와 AI 전달 보강 브리프의 Studio 초안 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시해야 한다.
   - Library Studio 저장 방식, 저장 출처, 운영 묶음 리포트와 각 대표 후보의 Studio 초안 저장이 실패하면 이동하지 않고 해당 조치 패널의 수동 복사용 원문 textarea를 표시해야 한다.
   - Library 상세의 학습 컨텍스트, 저장 출처 없음 메모, 개선/피드백/비교 개선 초안 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시해야 한다.
   - Library 출처 사유 조치 리포트와 대표 후보 메모의 Studio 초안 저장이 실패하면 이동하지 않고 출처 사유 조치 패널의 수동 복사용 원문 textarea를 표시해야 한다.
   - Library 계열 Studio 초안은 `Library 원본으로 돌아가기`, `Library 피드백으로 돌아가기`, `Library 운영 요약으로 돌아가기`, `Library 필터로 돌아가기`, `Library 후보로 돌아가기`, `Library 운영 묶음으로 돌아가기`, `Library 큐로 돌아가기`, `원본 저장본으로 돌아가기`, `Library 학습 증거로 돌아가기` 복귀 액션 라벨로 원래 Library 조건이나 상세를 복원해야 한다.
   - Studio 재개선 결과 저장 시 1차/2차 개선본 제목 차수 표기
   - 선택 버전의 전체 품질 점수, 가정, 부족한 정보 진단
   - 선택 버전의 품질 기반 개선 액션, 개선 브리프 복사, Studio 개선 입력 연결, 개선 결과 출처 추적과 품질 개선 효과 표시
   - 성공 여부

7. 실행 기록 및 피드백
   - 어떤 프롬프트를 생성했는지 저장
   - 사용자가 결과에 점수와 코멘트를 남긴다.
   - 좋은 결과를 낸 프롬프트를 다음 생성에 반영한다.
   - 대상 AI 도구별 품질 점수와 피드백 성공률을 요약한다.
   - Library 최근 피드백에서는 개별 피드백의 점수, 유형, 코멘트를 개선 브리프에 포함해 Studio 개선 초안으로 바로 전환할 수 있어야 한다.
   - 개선본의 원본 대비 평균 개선폭과 차수별/AI 도구별/분야별 개선 효과를 Dashboard에서 요약한다.
   - Dashboard 개선 효과 수치와 재개선 후보 KPI 클릭 시 Library의 개선 상태 필터로 이동한다.
   - Dashboard 재개선 후보 큐에서 Library 비교 화면으로 이동하거나 Studio 재개선을 바로 시작한다.
   - Dashboard 상단 운영 KPI에서 Library, Learning, Skills, 재개선 후보로 바로 이동한다.
   - Dashboard에서 워크스페이스 데이터 준비도와 Data 관리 이동 액션을 제공한다.
   - Dashboard에서 학습 컨텍스트 사용 현황을 요약하고 Library/Learning 학습 scope 필터로 이동한다.
   - Dashboard의 개인화 기준 패널에서 Profile/Company 편집, 저장 후 Dashboard 복귀, user/company 학습 메모리 점검으로 바로 이동할 수 있어야 한다.
   - Dashboard의 개인화 보강 큐에서 개인 프로필, 회사 기준, user/company 학습 메모리, 학습 메타 보존 프롬프트 상태를 기준으로 다음 보강 액션을 우선순위로 보여주고, 각 조치를 Markdown 복사 또는 Studio 실행 계획 초안으로 보낼 수 있어야 한다.
   - Dashboard의 다음 실행 큐에서 개인화 보강 액션과 Learning 운영 액션을 통합 우선순위, High/Med/Low 개수, 개인화/학습 개수, 첫 실행 항목, 완료 확인 체크리스트로 보여주고, Dashboard 다음 실행 큐는 `01 첫 실행`, `02 실행 계획`, `03 완료 확인` 단계 카드로 우선 항목 처리, 큐 실행 계획, 완료 증거 확인 순서를 먼저 보여줘야 한다. 첫 실행 항목을 원본 화면으로 바로 열거나 절대 URL 링크로 복사하거나 Studio 초안 또는 단일 조치 리포트로 전환할 수 있어야 한다. 각 항목도 원본 화면으로 바로 열거나 조건 링크를 절대 URL로 복사하거나 Studio 초안 또는 단일 조치 리포트로 전환할 수 있어야 하며, 큐 전체를 절대 URL 링크 목록, Markdown 리포트, 또는 Studio 실행 계획 초안으로 보내고 완료 확인 체크리스트를 Studio 완료 확인 계획 초안으로 보낼 수 있어야 한다.
   - Dashboard 오늘의 실행 요약은 첫 실행 항목, 생성 상태, 저장 검증 위치를 첫 화면 상단에서 한 줄로 정리해 바로 이동하게 해야 한다.
   - Dashboard 핵심 workflow는 작성, 저장, 학습, 스킬화, 연결, 백업 6단계를 상단에서 보여주고 연결 단계에서 Chrome, MCP, 외부 AI 전달 흐름으로 바로 이동하게 해야 한다.
   - Dashboard 상단 KPI는 모바일 2열 요약과 데스크톱 8열 요약을 유지해 저장본, 품질, 학습, 스킬, 재개선 상태를 짧게 훑게 해야 한다.
   - Dashboard의 개인화 기준 리포트 복사와 Studio 초안 전송으로 개인/회사 프로필, 학습 scope coverage, 다음 보강 액션을 개선 계획으로 전환할 수 있어야 한다.
   - Dashboard에서 낮은 신뢰도, 수동 메모리, 최근 업데이트 기준의 Learning 운영 점검 큐와 권장 조치 큐로 이동하고, 권장 조치별 Markdown 복사/Studio 초안 또는 전체 학습 운영 현황 Markdown 리포트/Studio 초안으로 보낼 수 있어야 하며, Dashboard 복사는 clipboard 권한 제한 환경에서도 fallback을 시도해야 한다.
   - Dashboard의 Studio 저장 출처 breakdown은 Skills 개선 계획 source를 포함한 저장 출처별 다음 확인 액션, Library 필터 링크, 저장 방식 요약을 Studio 운영 리포트 초안으로 보낼 수 있어야 하며, 저장 결과는 `dashboard-studio-source-ops` 저장 출처로 추적되어야 한다.
   - Dashboard 스킬 운영, 피드백 반영 개선, Studio 저장 출처, 저장 출처 메타 없음 큐, 개선 출처 상태 Studio 초안 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시해야 한다.
   - 언어 전략별 품질 점수와 피드백 성공률을 요약한다.
   - 답변 언어별 품질 점수와 피드백 성공률을 요약한다.
   - 대상 AI 도구별 성과는 Dashboard에서 비교하고, 클릭 시 Library의 해당 AI 도구 필터로 이동해 피드백을 검토할 수 있어야 한다.
   - 대상 AI 도구별 성과는 이후 자동 추천 로직을 개선할 근거로 사용한다.
   - 언어 전략별 성과는 Dashboard에서 비교하고, 클릭 시 Library의 해당 언어 전략 필터로 이동해 피드백을 검토할 수 있어야 한다.
   - 답변 언어별 성과는 Dashboard에서 비교하고, 클릭 시 Library의 해당 답변 언어 필터로 이동해 피드백을 검토할 수 있어야 한다.
   - Studio에서는 현재 입력 맥락 기준으로 언어 전략을 자동 판단한다.
   - 축적된 성과를 바탕으로 Studio에서 추천 답변 언어를 제안한다.
   - Studio에서는 생성 전 적용될 상위 학습 메모리와 최근 피드백 개수를 미리 보여준다.
   - Studio에서는 사용자/회사/분야/스킬 학습 메모리 scope별 반영 여부를 생성별로 조정할 수 있다.
   - Dashboard, Learning, Library, Skills에서 Studio 초안을 불러오면 초안 출처, 원본 조치, 다음 실행 액션, 초안 입력 요약, 원본 경로, 원본 화면 복귀 링크와 원본 링크 복사를 입력 화면에서 확인할 수 있어야 한다.
   - Learning에서는 학습 준비도, scope 커버리지, 낮은 신뢰도 메모리, 다음 보강 액션을 보여주고 운영 리포트를 복사할 수 있어야 한다.
   - Learning에서는 scope 배지, 범위, 검토 기준, 정렬, 검색 필터가 `/learning?scope=company&review=low-confidence&sort=confidence-asc&q=tone` 같은 URL 공유 가능한 필터로 동작해야 하며 현재 조건 링크, 필터 결과 Markdown, 개별 메모리 Markdown을 복사하고 개별 메모리와 필터 결과 메모리 묶음을 Studio 초안으로 보낸 뒤 조건을 초기화할 수 있어야 한다. Learning 복사는 clipboard 권한 제한 환경에서도 fallback을 시도하고 실패 상태를 표시해야 한다. Learning 준비도, 필터 결과, 개별 메모리, 피드백 개선 큐의 Studio 초안은 각각 `Learning 준비도로 돌아가기`, `Learning 조건으로 돌아가기`, `Learning 메모리로 돌아가기`, `Learning 피드백 큐로 돌아가기` 복귀 액션 라벨로 원래 조건을 복원해야 하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시해야 한다.
   - Learning에서는 높은/낮은 신뢰도와 최근 업데이트 지표를 클릭해 해당 점검 조건으로 목록을 즉시 전환할 수 있어야 한다.
   - Learning에서는 낮은 신뢰도, 수동 메모리, 자동 생성 메모리를 검토 기준으로 좁혀보고 신뢰도/업데이트 시각 기준으로 정렬할 수 있어야 한다.
   - Learning에서는 사용자가 회사 기준, 개인 선호, 분야 규칙, 스킬 패턴을 수동 메모리로 직접 저장하고 잘못 입력한 manual 메모리를 수정하거나 삭제할 수 있어야 한다.
   - Learning에서는 manual 메모리 추가/수정 시 같은 scope에 같은 내용을 반복 저장하지 못하게 막아야 한다.

8. 스킬 후보 생성
   - 반복적으로 성공한 프롬프트를 스킬로 전환할 수 있게 제안한다.
   - `/skills?prompt=...` 딥링크는 저장된 프롬프트를 스킬 템플릿 후보로 자동 로드한다.
   - Skills는 불러온 원본 Library 프롬프트의 제목, 버전, 품질, 피드백 수, Studio 저장 출처, 세부 초안 유형, 출처 제목, 원본 보기, 원본 링크 복사를 제공해야 하며, 원본 링크 fallback에는 원본 경로를 포함해야 한다.
   - 스킬은 대상 AI, 자동 판단된 언어 전략, 판단 이유, 최종 답변 언어를 함께 저장한다.
   - 스킬 저장 후 샘플 실행 입력을 채워 실행 프롬프트 생성 전 검증을 시작할 수 있어야 한다.
   - 실행 프롬프트를 Library에 저장한 뒤 저장된 실행 결과 상세로 이동하거나 링크를 복사할 수 있어야 한다.
   - Skills의 스킬별 실행 이력에서는 각 실행 프롬프트를 Library 상세로 바로 열어 품질, 피드백, 재개선 흐름을 이어갈 수 있어야 한다.
   - Skills 운영 흐름은 원본 확인, 템플릿 정리, 실행 저장, 운영 개선을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 해야 한다.
   - Skills 운영 요약 지표는 모바일 2열과 데스크톱 3열로 전체 실행, 실행 스킬, 피드백, 최근 실행, 반복 상위, 개선 큐를 짧게 훑게 해야 한다.
   - Skills 실행 준비 흐름은 `01 템플릿 확인`, `02 실행 검증`, `03 운영 저장` 단계 카드로 템플릿 상태, 실행 입력/프롬프트 생성, Library 저장과 피드백 수집 순서를 바로 읽게 해야 한다.
   - Skills 운영 요약에서는 Library에 저장된 실행 프롬프트를 기준으로 전체 실행 수, 실행된 스킬 수, 피드백 수, 최근 실행, 반복 사용 상위 스킬, 개선 필요 큐를 집계하고, 운영 리포트 복사/Studio 전송 시 최근 실행 Library 링크와 상위/개선 큐 Skills 링크를 절대 URL로 포함해야 한다.
   - Skills 운영 요약과 개선 계획의 Studio 초안은 각각 `Skills로 돌아가기`, `Skills 스킬로 돌아가기` 복귀 액션 라벨로 원래 화면을 복원해야 하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시해야 한다.
   - Dashboard의 스킬 실행 현황에서는 최근 실행을 Library 상세로 열고, 반복 사용 상위 스킬과 개선 대기 스킬을 `/skills?skill=...` 딥링크로 바로 편집할 수 있어야 한다.
   - Dashboard의 스킬 실행 현황은 실행 수, 최근 실행, 반복 사용 상위 스킬, 개선 필요 큐를 Markdown 리포트로 복사하거나 Studio 개선 계획 초안으로 보낼 수 있어야 한다.
   - 스킬 원본 Library 링크, 템플릿, 실행 프롬프트 복사는 clipboard 권한 제한 환경에서도 fallback을 시도하고 실패 시 수동 복사용 textarea를 제공해야 한다.
   - MVP에서는 외부 AI 도구 자동 실행까지 만들지 않고, 스킬 명세, 프롬프트 템플릿, 실행용 프롬프트 저장, 실행 이력 집계, 피드백 기반 개선 추천과 템플릿 반영까지 제공한다.

9. 워크스페이스 데이터 관리
   - 사용자 프로필, 회사 프로필, 프롬프트, 피드백, 학습 메모리, 스킬을 하나의 백업 JSON으로 내보낸다.
   - 백업 생성 후에는 생성 시각, JSON 길이, 주요 수량, 동일 백업 대조용 지문을 요약하고 다운로드/복사 액션을 바로 제공하며, 가져오기 검증과 복원 확인창에서 현재 생성본과의 지문 일치 여부와 불일치 경고를 표시한다.
   - Data 워크스페이스 스냅샷 수량과 문서/RAG 핵심 상태는 모바일 2열과 데스크톱 4열로 압축해 로컬 데이터와 RAG 준비 상태를 짧게 훑게 해야 한다.
   - 문서/RAG chunk 맥락을 `data-document-rag` Studio 초안으로 보낼 때 Studio 복귀 액션 라벨은 `Data 문서/RAG로 돌아가기`로 표시하고 원본 경로는 `/data`로 돌아가야 하며, 초안 저장이 실패하면 이동하지 않고 문서/RAG Studio 원문을 수동 복사용 textarea로 표시해야 한다.
   - 마지막 백업 생성 시각과 수량 요약을 저장해 Dashboard와 Data 관리에서 백업 상태, 기준 시각, 변경 항목을 확인할 수 있게 한다.
   - 마지막 백업 대비 현재 데이터 수량이 달라지면 백업 업데이트 필요 상태, 변경된 데이터 항목, 즉시 갱신 액션을 표시한다.
   - 붙여넣기 또는 파일 선택으로 가져온 백업 JSON은 앱 식별자와 스키마 버전을 검증하고, 생성 시각과 입력 방식을 요약한 뒤 복원한다.
   - 복원이 완료되면 최근 백업 상태를 복원한 백업 기준으로 갱신해 Dashboard와 Data 관리의 최신 여부를 일치시킨다.
   - 복원 완료된 동일 검증본은 재검증 또는 입력 변경 전까지 반복 복원할 수 없게 한다.
   - 복원 실행 전 현재 데이터와 백업 데이터의 수량 및 핵심 프로필 변화를 미리 보여주고, 데이터 감소나 핵심 프로필 변경 리스크를 별도로 요약하며, 최종 확인창에서도 리스크 수와 주요 항목을 다시 표시한다.
   - 백업 JSON, 복원 리포트, Supabase SQL/체크리스트, 런타임 진단 복사는 clipboard 권한 제한 환경에서도 fallback을 시도하고 실패 시 수동 복사용 textarea를 제공해야 한다. 백업 JSON fallback은 백업 지문, 생성 시각, JSON 길이, 데이터 수량 요약을 원문 JSON 앞에 포함해야 한다. 복원 리포트 fallback은 백업 생성 시각, 가져온 방식, 가져온 백업 지문, 최근 백업 기준 지문, 지문 비교, 변경 항목 수, 리스크 항목 수, 데이터 수량, 복원 전 원본 백업 보관 gate를 원문 리포트 앞에 포함해야 한다. 마이그레이션 매핑 fallback은 매핑 테이블 수, ready/needs-context/future 상태 수, 예상 row 수, workspace owner gate, insert order gate, 삭제 보관함 snapshot gate, RAG 추후 테이블 gate를 원문 매핑 앞에 포함해야 한다. 마이그레이션 체크리스트 fallback은 준비됨/결정 필요/수동 확인 count, 백업 지문 확인 gate, service role server-side gate, schema 적용 gate, RLS 검토 gate, rollback gate를 원문 체크리스트 앞에 포함해야 한다. `.env.local` 템플릿 fallback은 active/migration/future 변수 수, server-only 값, browser-public 값, import execution gate 기본값, storage mode guard, secret commit 금지 기준을 원문 템플릿 앞에 포함해야 한다. environment readiness checklist fallback은 active/migration/future 변수 수, 확인 시각, release gate, generation/storage/Supabase 설정 요약, missing variable 수, action queue 수, local fallback gate, app-session RLS smoke gate를 원문 체크리스트 앞에 포함해야 한다. 런타임 상태 JSON fallback은 확인 시각, release gate, 생성 엔진, Supabase readiness, action queue를 원문 JSON 앞에 포함해야 한다. 런타임 진단 리포트 fallback은 확인 시각, release gate, 생성 엔진, storage mode, Supabase client/server importer/project ref, import execution gate, missing variable 수, action queue 수, secret 공유 금지 기준을 원문 리포트 앞에 포함해야 한다. 운영자 조치 계획 fallback은 확인 시각, release gate, action queue/blocker/warning 수, generation/storage mode, import execution gate, runtime refresh와 secret-sharing 확인 gate를 원문 계획 앞에 포함해야 한다. 스냅샷 JSON fallback은 스냅샷 수와 최근 스냅샷 ID/저장 시각/release gate를 포함해야 한다. 스냅샷 비교 리포트 fallback은 최근 스냅샷 ID, 저장/점검 시각, 현재 점검 시각, 이전/현재 stage, score delta, 변수 변경 수, release gate check 변경 수, 후속 진단/스냅샷 저장/secret 확인 gate를 원문 리포트 앞에 포함해야 한다. importer dry-run fallback은 schemaVersion, total rows, insert batches, deleted archive rows, pending row IDs, setup/relationship warning 수, local-only guard, pending replacement guard, archive trace guard를 원문 dry-run 앞에 포함해야 한다. pending ID 치환 가이드 fallback은 schemaVersion, replacement table 수, local-to-pending row 수, deleted archive rows, dry-run warning 수, pending primary/foreign key 치환 gate, active source rewrite gate, learning source rewrite gate, archive trace 유지 gate, pending ID audit gate를 원문 가이드 앞에 포함해야 한다. row count verification SQL fallback은 workspace_id, schemaVersion, expected rows/tables, deleted archive rows, workspace scope, post-import gate를 원문 SQL 앞에 포함해야 한다. relationship verification SQL fallback은 workspace_id, schemaVersion, relationship checks, relationship warnings, deleted archive rows, workspace scope, issue_count 0 gate, deleted_prompt_assets snapshot 허용 기준을 원문 SQL 앞에 포함해야 한다. pending ID audit SQL fallback은 workspace_id, schemaVersion, pending ID check 수, replacement table/row 수, deleted archive rows, workspace scope, issue_count 0 gate, pending-* 완전 치환 gate를 원문 SQL 앞에 포함해야 한다. RLS owner access audit SQL fallback은 workspace_id, owner_user_id, schemaVersion, RLS owner access check 수, expected imported rows/batches, deleted archive rows, owner mapping gate, authenticated app-session smoke test gate를 원문 SQL 앞에 포함해야 한다. RLS policy draft SQL fallback은 schemaVersion, policy table 수, expected imported rows/batches, workspace_members 접근 기준, read/write role semantics, review/adapt gate, prerequisite audit gate, authenticated smoke test gate를 원문 SQL 앞에 포함해야 한다. RLS smoke test checklist fallback은 schemaVersion, workspace/owner 식별, policy table 수, owner access check 수, expected rows/batches, required sessions, authenticated app-session-only gate, role behavior gate, cross-workspace isolation gate를 원문 체크리스트 앞에 포함해야 한다. verification report fallback은 workspace/owner 식별, schemaVersion, expected rows, row/relationship/pending ID/RLS check 수, warning 수, issue_count 0 gate, RLS policy review gate, RLS smoke evidence gate를 원문 리포트 앞에 포함해야 한다. migration handoff package fallback은 workspace/owner 식별, schemaVersion, expected rows/batches, handoff section 수, verification check 수, warning 수, read-order gate, audit evidence gate, RLS evidence gate, UUID trace gate를 원문 패키지 앞에 포함해야 한다. API preflight fallback은 확인 시각, 백업 지문, workspace/owner UUID, route status, validation, dry-run row/table 수, confirmation gate를 원문 preflight 리포트 앞에 포함해야 한다. route audit artifact fallback은 확인 시각, 백업 지문, workspace/owner UUID, route status, execute=false preflight 모드, validation, dry-run row/table 수, confirmation gate를 원문 artifact 앞에 포함해야 한다. import execution plan fallback은 workspace/owner UUID, total rows, insert batches, UUID map entries, archive trace fields, unresolved pending references, pending 제거/보관함 trace/owner 매핑 acceptance gate, local-only guard, post-import audit gate를 원문 계획 앞에 포함해야 한다. adapter contract fallback은 workspace/owner UUID, total rows, insert batches, generated UUIDs, archive trace fields, unresolved pending references, service-role server-only gate, insert order gate, post-import audit gate를 원문 계약 앞에 포함해야 한다. migration rehearsal fallback은 기준 시각, 백업 지문, workspace/owner UUID, preflight status, validation blocker 수, row/table 수, confirmation gate, handoff section 수를 원문 리허설 리포트 앞에 포함해야 한다. 실행 판정 메모 fallback은 생성 시각, 백업 지문, workspace/owner UUID, decision, preflight validation, runtime release gate, runtime blocker 수, migration/importer readiness, import execution gate를 원문 판정 메모 앞에 포함해야 한다. execute 요청 템플릿 fallback은 백업 지문, workspace/owner UUID, `execute:true`, `confirmation: RUN_SUPABASE_IMPORT`, `includePayload:false`, server execution gate를 원문 요청 템플릿 앞에 포함해야 한다. 실행 금지 체크리스트 fallback은 백업 지문, workspace/owner UUID, preflight 일치/validation, schema 적용, service role server-only, execution gate 종료, post-import audit와 RLS smoke 준비 상태를 원문 체크리스트 앞에 포함해야 한다. controlled execution packet fallback은 생성 시각, preflight 시각, 백업 지문, workspace/owner UUID, manifest ready/waiting, copy gate, runtime release gate, import execution gate를 원문 패킷 앞에 포함해야 한다. execution packet manifest fallback은 생성/preflight 시각, 백업 지문, workspace/owner UUID, manifest status/detail, ready/waiting count, copy gate, next action, 비실행/secret guard를 원문 manifest 앞에 포함해야 한다. execution packet next-action fallback은 생성/preflight 시각, 백업 지문, workspace/owner UUID, manifest status, ready/waiting count, copy gate, waiting item, next action, 재복사 gate를 원문 메모 앞에 포함해야 한다. post-import evidence fallback은 기준 시각, 백업 지문, workspace/owner UUID, 예상 row/table 수, relationship/pending ID/RLS acceptance gate 수를 원문 검증 기록지 앞에 포함해야 한다.
   - Data 안전 실행 순서는 `01 백업 고정`, `02 준비도 확인`, `03 실행 분리` 단계 카드로 백업 최신 여부, 데이터/runtime readiness, execute=false preflight와 execution packet 분리를 먼저 보여줘야 한다.
   - Data 운영 환경 readiness와 Supabase 실행 패킷의 핵심 gate 상태는 모바일 2열 요약으로 먼저 보여주고, 상세 체크리스트와 복사 액션은 그대로 분리해야 한다.
   - Data 가져오기 검증, 복원 리포트, Supabase 매핑, 체크리스트, dry-run, pending ID 치환 요약은 모바일 2열로 먼저 보여주고 상세 테이블과 실행 gate는 별도로 유지해야 한다.
   - Data post-import 검증 SQL, 관계 검증, pending ID audit, RLS audit/policy/smoke, 검증 리포트, migration handoff 요약은 모바일 2열로 먼저 보여주고 SQL/체크리스트/패키지 원문은 별도 preview로 유지해야 한다.
   - Supabase 전환이나 팀 워크스페이스 확장 전 데이터 준비도 체크리스트를 제공하고, 백업 스냅샷 항목에서 즉시 백업 생성 또는 갱신을 실행할 수 있게 한다.
   - Supabase 전환 전까지는 브라우저 localStorage 손실을 줄이고, 이후 DB 마이그레이션 입력 포맷으로 사용한다.

### MVP에서 제외할 기능

- 실제 모델 파인튜닝
- 복잡한 팀 권한 관리
- 결제
- 외부 AI 도구 자동 실행 전체 연동
- 대규모 문서 업로드/검색
- 프롬프트 마켓플레이스
- 완전 자동 에이전트 실행

단, 데이터 모델은 나중에 위 기능을 추가할 수 있도록 확장성을 남긴다.

## 6. AI 학습 구조

이 제품에서 말하는 AI 학습은 초기에는 모델 자체를 재훈련하는 것이 아니다. 서비스가 사용자와 회사의 맥락을 계속 축적하고, 그 맥락을 다음 프롬프트 생성에 반영하는 구조를 의미한다.

### 학습 레이어

#### Layer 1. 프로필 학습

사용자의 직무, 산업, 선호 스타일, 반복 업무, 출력 형식, 피해야 할 표현을 저장한다. 저장된 프로필은 user scope 학습 메모리로 upsert되어 다음 프롬프트 생성 컨텍스트에 반영된다.

예:

- 사용자는 기획/개발/마케팅 업무를 모두 다룬다.
- 답변은 실행 계획 중심을 선호한다.
- 과장된 표현보다 검증 가능한 표현을 선호한다.
- 최종 결과물은 표, 체크리스트, PRD, 개발 태스크 형태를 자주 사용한다.

#### Layer 2. 회사 맥락 학습

회사의 브랜드 톤, 서비스 설명, 타깃 고객, 금지 표현, 내부 용어, 제안서 구조를 저장한다.

예:

- 회사 설명에서는 기술 과장을 피한다.
- B2B 고객에게는 비용 절감보다 운영 효율을 먼저 강조한다.
- 보고서는 배경, 문제, 해결안, 실행 계획, 리스크 순서로 작성한다.

#### Layer 3. 분야별 구조 학습

산업과 직무별로 좋은 프롬프트 구조를 저장한다.

예:

- 마케팅: 타깃, 메시지, 채널, CTA, KPI
- 개발: 요구사항, 제약, 파일 구조, 테스트, 검증
- 투자/IR: 문제, 시장, 솔루션, 수익 모델, 경쟁, 실행 계획
- 콘텐츠: 독자, 목적, 톤, 구조, SEO 키워드, 금지 표현
- 법률/금융/의료: 사실 확인, 면책, 출처, 전문가 검토 필요성

#### Layer 4. 피드백 학습

사용자의 피드백을 구조화해 저장한다.

피드백 예:

- "이 톤은 좋다"
- "너무 일반적이다"
- "결과가 바로 실행하기 어렵다"
- "이 형식으로 계속 만들어줘"
- "우리 회사에서는 이 표현을 쓰면 안 된다"

반영 방식:

- 말투 피드백은 사용자 프로필에 반영한다.
- 회사 기준 피드백은 회사 프로필에 반영한다.
- 분야 전문성 피드백은 분야별 규칙 후보로 저장한다.
- 특정 프롬프트 성과는 프롬프트 버전 점수에 반영한다.
- 대상 AI 도구별 성공률은 Dashboard에서 비교해 자동 추천 로직 개선 근거로 활용한다.
- 언어 전략별 성공률은 Dashboard에서 비교해 자동 판단 로직 개선 근거로 활용한다.
- Studio에서는 사용자가 언어 전략을 고르지 않고, 시스템이 판단한 전략을 바로 적용한다.

#### Layer 5. 스킬화

반복적으로 좋은 결과를 내는 프롬프트를 스킬로 저장한다.

스킬 예:

- `IR 피치 정리`
- `시장조사 보고서 생성`
- `블로그 SEO 초안 작성`
- `Codex 개발 태스크 생성`
- `고객 인터뷰 분석`
- `제안서 구조화`

스킬은 다음 정보를 가진다.

- 스킬 목적
- 입력해야 할 자료
- 사용할 AI 도구
- 기본 프롬프트 구조
- 출력 형식
- 품질 체크리스트
- 성공 사례
- 실패 사례

#### Layer 6. 고급 학습

데이터가 충분히 쌓이면 다음 단계로 확장한다.

- 프롬프트 성공/실패 데이터셋 구축
- 산업별 프롬프트 평가셋 구축
- 모델별 출력 품질 비교
- 특정 업무에 대한 파인튜닝 검토
- 회사별 전용 어시스턴트 생성

## 7. 프롬프트 최적화 엔진

### 입력

사용자는 자유롭게 요청을 적는다.

예:

```text
내가 생각한 앱 아이디어를 투자자한테 설명할 수 있게 정리해줘.
그리고 나중에 개발할 수 있게 기능도 좀 나눠줘.
```

### 처리 단계

1. 의도 분석
   - 사용자가 원하는 결과물이 무엇인지 파악한다.
   - 예: IR 설명, MVP 기능 정리, 개발 태스크화

2. 맥락 보강
   - 사용자 프로필, 회사 프로필, 분야별 규칙을 불러온다.

3. 부족한 정보 탐지
   - 필요한 정보가 없으면 질문을 생성한다.
   - 단, MVP에서는 질문 없이 합리적 가정을 명시하고 프롬프트를 생성하는 옵션을 기본으로 둔다.

4. 기본 프롬프트 생성
   - 역할
   - 목적
   - 배경
   - 입력 자료
   - 제약 조건
   - 출력 형식
   - 품질 기준

5. AI 도구별 어댑터 적용
   - GPT용
   - Claude용
   - Codex용
   - Gemini용

6. 품질 점수 계산
   - 명확성
   - 맥락 충분성
   - 제약 조건
   - 출력 형식
   - 모델 적합성
   - 재사용성

7. 저장 및 피드백
   - 프롬프트와 품질 점수를 저장한다.
   - 사용자가 결과 피드백을 남길 수 있게 한다.

### 프롬프트 생성 표준 구조

```text
역할:
[AI가 맡아야 할 전문 역할]

목표:
[이번 작업의 구체적인 목표]

배경:
[사용자/회사/산업 맥락]

입력:
[사용자가 제공한 원문 또는 자료]

작업 지시:
[해야 할 일]

제약 조건:
[하지 말아야 할 것, 지켜야 할 기준]

출력 형식:
[표, 목록, JSON, 문서 구조, 코드 변경 계획 등]

품질 기준:
[좋은 결과물인지 판단하는 기준]

불확실성 처리:
[모르는 내용은 추정하지 말고 질문하거나 가정으로 표시]
```

## 8. AI 도구별 어댑터 방향

### 범용 프롬프트

모든 AI 도구에 붙여넣을 수 있는 기본형이다. 가장 안정적인 구조를 제공한다.

### GPT용

대화형 작업, 구조화된 문서, 아이디어 정리, 마케팅/기획/리서치에 적합한 형태로 구성한다.

초기 프롬프트 특징:

- 목적과 출력 형식을 명확히 지정
- 부족한 정보는 질문하거나 가정으로 표시
- 표, 체크리스트, 단계별 계획을 잘 생성하도록 설계

### Claude용

긴 문서, 분석, 비교, 리라이팅, 정책/문서 검토에 적합한 형태로 구성한다.

초기 프롬프트 특징:

- 긴 입력 문서와 작업 지시를 분리
- 판단 기준과 금지 사항을 명확히 표시
- 문서형 결과물의 구조를 세밀하게 지정

### Codex용

개발 작업, 코드 수정, 리팩터링, 테스트, 리포지토리 분석에 적합한 형태로 구성한다.

초기 프롬프트 특징:

- 목표와 수정 범위를 명확히 지정
- 먼저 코드베이스를 읽고 기존 패턴을 따르도록 지시
- 구현 후 테스트, 빌드, 린트 등 검증을 요구
- 변경 파일, 검증 결과, 남은 리스크를 최종 보고하도록 요구

### Gemini용

멀티모달 입력, 문서/이미지/표 기반 분석, 검색/요약성 작업에 적합한 형태로 구성한다.

초기 프롬프트 특징:

- 입력 자료와 분석 기준을 명확히 분리
- 비교, 요약, 표준화된 출력에 강한 구조 사용
- 불확실한 정보는 출처 또는 가정으로 표시

## 9. 주요 화면

### 1. 대시보드

목적:

- 최근 생성한 프롬프트 확인
- 자주 쓰는 스킬 실행
- 품질 점수가 높은 프롬프트 확인
- 개선이 필요한 프롬프트 확인

핵심 요소:

- 최근 작업
- 내 스킬
- 추천 개선
- 분야별 사용량
- 성공률 높은 프롬프트

### 2. 새 프롬프트 생성

목적:

사용자의 원문을 전문 프롬프트로 변환한다.

구성:

- 원문 입력창
- 목적 선택
- 분야 선택
- AI 도구 선택
- 개인 프로필 반영 토글
- 회사 프로필 반영 토글
- 생성 버튼

### 3. 프롬프트 스튜디오

목적:

생성된 프롬프트를 비교, 수정, 저장한다.

구성:

- 왼쪽: 사용자 원문
- 중앙: 생성된 프롬프트
- 오른쪽: 품질 점수, 반영된 맥락, 부족한 정보
- 하단: GPT/Claude/Codex/Gemini 버전 탭

### 4. 라이브러리

목적:

저장된 프롬프트를 업무 자산으로 관리한다.

구성:

- 검색
- 태그
- 분야
- AI 도구
- 품질 점수
- 버전 기록
- 성공/실패 기록

### 5. 프로필 설정

목적:

개인화 학습의 기준 데이터를 관리한다.

구성:

- 개인 업무 프로필
- 선호 답변 스타일
- 자주 쓰는 출력 형식
- 피해야 할 표현
- 반복 업무

### 6. 회사 설정

목적:

회사 특성과 브랜드 기준을 관리한다.

구성:

- 회사 소개
- 제품/서비스 설명
- 고객군
- 브랜드 톤
- 내부 용어
- 금지 표현
- 문서 양식

### 7. 실행 기록/피드백

목적:

프롬프트 결과와 사용자 피드백을 학습 데이터로 저장한다.

구성:

- 실행 날짜
- 사용한 AI 도구
- 원문
- 생성 프롬프트
- 결과 요약
- 사용자 점수
- 피드백 코멘트
- 다음에 반영할 항목

### 8. 스킬 빌더

목적:

반복 업무를 스킬로 저장한다.

구성:

- 스킬 이름
- 설명
- 입력 자료
- 기본 프롬프트
- 출력 형식
- 품질 체크리스트
- 추천 AI 도구
- 사용 횟수
- 마지막 실행 시각
- 최근 실행 프롬프트
- 평균 품질 점수
- 피드백 수
- 성공률
- 개선 추천 항목
- 개선안 반영 상태

## 10. 데이터 모델 초안

### `users`

- `id`
- `email`
- `name`
- `created_at`

### `workspaces`

- `id`
- `owner_user_id`
- `name`
- `type`: `personal` 또는 `company`
- `created_at`

### `user_profiles`

- `id`
- `user_id`
- `role`
- `industries`
- `goals`
- `preferred_tone`
- `preferred_outputs`
- `avoid_phrases`
- `repeated_tasks`
- `updated_at`

### `company_profiles`

- `id`
- `workspace_id`
- `company_name`
- `description`
- `products`
- `customers`
- `brand_tone`
- `internal_terms`
- `banned_phrases`
- `document_formats`
- `updated_at`

### `domain_profiles`

- `id`
- `name`
- `description`
- `prompt_rules`
- `quality_checklist`
- `risk_notes`

### `prompt_requests`

- `id`
- `workspace_id`
- `user_id`
- `raw_input`
- `goal`
- `domain`
- `target_models`
- `created_at`

### `prompts`

- `id`
- `request_id`
- `title`
- `domain`
- `status`
- `best_version_id`
- `created_at`

### `prompt_versions`

- `id`
- `prompt_id`
- `target_model`
- `content`
- `quality_score`
- `score_breakdown`
- `assumptions`
- `missing_context`
- `created_at`

### `prompt_runs`

- `id`
- `prompt_version_id`
- `target_model`
- `input_payload`
- `output_text`
- `run_status`
- `created_at`

### `feedback`

- `id`
- `prompt_run_id`
- `user_id`
- `rating`
- `comment`
- `feedback_type`
- `learning_action`
- `created_at`

### `memories`

- `id`
- `workspace_id`
- `user_id`
- `scope`: `user`, `company`, `domain`, `skill`
- `content`
- `source`
- `confidence`
- `created_at`
- `updated_at`

### `skills`

- `id`
- `workspace_id`
- `name`
- `description`
- `domain`
- `target_model`
- `input_schema`
- `prompt_template`
- `output_format`
- `quality_checklist`
- `created_at`
- `updated_at`

### `deleted_prompts`

- `prompt`
- `deleted_at`
- `workspace_id` (서버 저장소 전환 시)
- `deleted_by_user_id` (서버 저장소 전환 시)

## 11. 프롬프트 품질 점수 기준

각 항목은 1점에서 5점으로 평가한다.
점수 로직은 한영 하이브리드 프롬프트를 기본 전제로 하며, `Role`, `Objective`, `Constraints`, `Required output format`, `Quality checklist` 같은 영어 섹션명과 한국어 섹션명을 같은 평가 신호로 인정한다.
단, 회사명, 제품/서비스, 고객군 등 핵심 맥락이 `미지정`으로 남아 있으면 맥락 점수를 제한한다.
이는 섹션 구조는 좋지만 실제 사용 맥락이 비어 있는 프롬프트가 과대평가되지 않게 하기 위한 기준이다.

### 명확성

AI가 무엇을 해야 하는지 명확한가.

### 맥락 충분성

사용자, 회사, 분야 맥락이 충분히 들어갔는가.

### 출력 형식

결과물이 어떤 형태여야 하는지 구체적인가.

### 제약 조건

하지 말아야 할 것과 주의할 점이 명확한가.

### 전문성

해당 분야의 판단 기준, 용어, 체크리스트가 반영되었는가.

### AI 도구 적합성

선택한 AI 도구의 용도에 맞게 프롬프트가 변환되었는가.

### 재사용성

비슷한 업무에 다시 쓸 수 있는 구조인가.

### 품질 진단 리포트

Studio는 생성된 버전의 점수 breakdown에서 낮은 항목을 우선순위로 추출한다.
각 항목은 낮은 이유와 바로 수정할 수 있는 개선 액션을 함께 보여준다.
사용자는 저장 전 또는 다른 사람에게 공유하기 전 `품질 리포트 복사`로 다음 정보를 Markdown으로 내보낼 수 있다. Studio 복사 액션은 clipboard 권한이 제한된 브라우저에서도 fallback 복사를 시도하고, 그래도 실패하면 버튼 실패 상태와 수동 복사용 textarea를 표시한다.

- 프롬프트 제목, 분야, 목표, 대상 AI
- 전체 품질 점수와 항목별 점수
- 우선 개선 액션
- 생성 시 적용된 가정
- 부족한 정보

생성 결과를 Library에 저장하면 Studio는 저장 완료 안내, `Library에서 보기`, `Library 링크 복사`, `Skill로 전환` 액션을 표시한다. 이 액션은 저장된 프롬프트 상세와 현재 활성 버전을 열거나 같은 상세 링크를 복사해 사용자가 버전 비교, 피드백 저장, 재개선 브리프 흐름으로 바로 이어가고 외부 리뷰에 공유할 수 있게 한다. Library 상세의 `프롬프트 삭제`는 내부 확인 패널에서 저장 버전, 피드백, 연결된 개선본 수를 보여준 뒤 최종 삭제를 실행해 테스트 저장본이나 불필요한 항목을 안전하게 정리하고, 삭제 항목을 로컬 보관함의 `최근 삭제 항목`에 남겨 Library 목록에서 다시 복원할 수 있어야 한다. 보관함은 최근 항목을 우선 표시하고 `전체 보기`와 검색으로 오래된 삭제 항목도 복원할 수 있어야 한다. 삭제된 원본을 참조하는 개선본은 개선 출처 카드에서 원본이 보관함에 있음을 표시하고 `원본 복원`으로 추적 체인을 회복할 수 있어야 한다. Dashboard의 개선 효과 분석도 삭제 보관함 원본과 원본 누락 미측정 개선본을 포함해 평균 개선폭, 재개선 후보, 피드백 반영 개선본을 계산하고, `보관함 원본` 지표에서 해당 개선본만 Library 필터로 열 수 있어야 한다. 해당 필터가 비어 있으면 Library는 전용 빈 상태에서 최근 삭제 항목 열기와 필터 초기화를 제공해 복원 흐름을 안내해야 한다. Library 최근 피드백의 `이 피드백으로 Studio 개선`은 해당 점수, 유형, 코멘트를 개선 브리프에 포함해 표준 `프롬프트 개선` 목표의 피드백 반영 재작업을 바로 시작하게 하며, Studio 출처 카드에서 반영 피드백 요약을 구조화해 보여주고 `Library 피드백으로 돌아가기`로 원본 피드백 카드에 복귀하게 한다. 저장된 피드백 기반 개선본은 Library 상세의 개선 출처 카드에 반영 피드백을 보존하고 `원본 피드백 보기`로 원본 피드백 카드까지 추적할 수 있어야 하며, Dashboard의 `피드백 반영 개선본` 큐에서도 피드백 개선본 수, 평균 개선폭, 재검토 필요, 보관함 원본 지표와 우선 점검 항목, 최근 반영 코멘트, AI 도구, 점수 변화, 생성일, 개선본 상세, 원본 피드백 링크를 함께 확인하고 리포트 복사 또는 Studio 개선 계획 초안으로 반복 피드백을 운영 액션으로 전환할 수 있어야 한다. 우선 점검 항목은 `우선 리포트 복사`와 `우선 계획 Studio로`를 제공해 단일 개선본의 원본 상태, 피드백, 점수 변화, 다음 조치를 별도 실행 패키지로 만들 수 있어야 하며, `우선 메모리 저장`으로 해당 피드백 규칙만 Learning memory에 저장한 뒤 저장된 메모리 제목, scope, 신뢰도를 패널에서 확인하고 `우선 메모리 확인`으로 `feedback-improvement` 필터를 바로 열 수 있어야 한다. 피드백 개선 리포트와 Studio 개선 계획 초안은 개선본 상세과 원본 피드백 링크를 절대 URL로 포함하고 보관함 원본/측정 불가 필터 링크도 함께 제공해야 한다. Dashboard의 `반영 피드백 메모리 저장`은 피드백 유형을 Learning scope로 변환하고, 개선본/원본 피드백 링크를 포함한 Learning memory 규칙으로 저장해 다음 Studio 생성 컨텍스트에 반영할 수 있어야 하며, 저장 후 `Learning에서 확인` 링크로 `feedback-improvement` 메모리 필터 화면을 바로 열 수 있어야 한다. `Skill로 전환`은 `/skills?prompt=...`로 이동해 저장된 프롬프트를 스킬 템플릿 후보로 자동 로드한다. Skills는 불러온 원본 Library 프롬프트의 제목, 버전, 품질, 피드백 수, Studio 저장 출처, 세부 초안 유형, 출처 제목을 표시하고 Library 원본 복귀와 원본 링크 복사를 제공하며, 원본 링크 fallback에는 원본 경로를 포함한다. 스킬 저장 후에는 `실행 예시 채우기`로 샘플 실행 입력을 채워 실행 프롬프트 생성 전 검증을 시작할 수 있게 한다. 실행 프롬프트를 Library에 저장하면 저장된 실행 결과의 제목과 품질 점수를 표시하고, `Library 실행 보기`와 `실행 링크 복사`로 해당 실행 결과 상세를 추적할 수 있게 한다. 스킬별 실행 이력의 각 실행 프롬프트는 Library 상세로 바로 열 수 있어 피드백 저장과 재개선 흐름으로 이어진다. Skills 운영 요약은 Library에 저장된 실행 프롬프트를 기준으로 전체 실행 수, 실행된 스킬 수, 피드백 수, 최근 실행, 반복 사용 상위 스킬, 개선 필요 큐를 집계하고 최근 실행 상세 또는 해당 스킬 편집으로 바로 이어지게 한다. Dashboard의 스킬 실행 현황도 같은 실행 데이터를 요약하며, 최근 실행은 Library 상세로, 반복 사용 상위 스킬과 개선 대기 스킬은 `/skills?skill=...`로 해당 스킬 편집 화면을 바로 연다. 또한 스킬 운영 리포트를 최근 실행 Library 링크와 반복 사용/개선 대기 Skills 링크를 포함한 Markdown으로 복사하거나 Studio 개선 계획 초안으로 보내 실행 피드백 수집, 템플릿 보강, 입력 가이드 정리, 품질 체크리스트 개선 계획을 만들 수 있게 한다.

`측정 불가` 개선 필터가 비어 있으면 Library는 원본이 active 목록과 삭제 보관함 어디에도 없는 경우에만 이 필터가 채워진다는 안내와 필터 초기화 액션을 제공해야 한다.

Dashboard는 개선 효과 패널의 `Studio 저장 방식` 요약에서 개선 체인, 운영 출처, Studio 출처 없음 count를 바로 보고 해당 Library 필터로 이동할 수 있게 해야 한다. 같은 영역의 `Studio 저장 출처` breakdown은 Dashboard, Library, Learning, Skills에서 넘어온 실제 Studio 초안 저장 출처 상위 항목을 보여주고 각 항목을 `studioSource` Library 필터로 바로 열 수 있게 해야 하며, 대표 저장본 상세 링크와 원본 경로도 바로 열거나 복사할 수 있게 해야 한다. 대표 저장본 상세 링크와 원본 경로 복사 fallback은 출처 제목, 링크 유형, 원본 경로를 수동 복사용 textarea에 포함해야 한다. `Studio로` 액션은 저장 출처별 저장 방식, 다음 확인 액션, Library 필터 링크, 대표 저장본 상세 링크, 원본 경로를 포함한 운영 리포트를 Studio 초안으로 전환할 수 있어야 한다. 이 초안으로 저장한 결과는 `dashboard-studio-source-ops` Studio source로 보존되어 Dashboard와 Library의 저장 출처 breakdown에서 별도 추적되어야 한다. 같은 패널의 `출처 상태 조치`에서는 삭제 보관함 원본과 측정 불가 개선본을 해당 Library 필터로 바로 열고, 원본 누락/버전 누락 같은 사유별 count를 클릭해 `sourceReason` Library 필터로 좁힌 뒤 Library 목록/상세의 출처 사유 배지, 필터 결과 대표 후보, `조치 리포트 복사`/`Studio로 보내기`로 상태를 확인할 수 있게 해야 한다. 이후 후보별 메모 복사 또는 후보 1개 단위의 Studio 초안 전송으로 세부 복원 계획을 만들 수 있게 해야 한다. Library의 `Studio 저장 방식` 필터는 선택 시 대표 후보, 후보별 메모 복사/Studio 전송, `저장 방식 리포트 복사`/`Studio로 보내기`를 제공해 개선 체인, 운영 출처, 저장 출처 메타 없음 저장본을 운영자가 바로 점검하고 Studio 초안으로 이어갈 수 있어야 한다. Studio는 불러온 초안 패널에서 저장 방식과 `Studio 저장 출처`를 함께 표시해, 사용자가 저장 전 추적 방식과 기능 흐름을 확인할 수 있어야 한다. 추가로 `Studio 저장 출처` 필터는 실제 Studio 초안 저장 출처를 `studioSource` URL 조건으로 좁히고, 선택 시 저장 출처 리포트와 대표 후보 메모/Studio 전송을 제공해 운영 출처 안에서도 어떤 기능 흐름에서 저장됐는지 바로 분리할 수 있어야 한다. Library 목록 카드와 상세의 Studio 저장 출처 카드도 같은 저장 출처와 같은 저장 방식 필터 이동을 제공하고, 저장 출처 메타가 없는 저장본도 목록/상세에서 `저장 출처 메타 없음`과 점검 기준으로 식별해 `저장 출처 없음 메모 복사`, Studio 초안 전송, 또는 같은 저장 방식 필터로 모아 볼 수 있어야 한다. 저장 출처 리포트/후보와 저장 출처 없음 메모 초안은 저장 방식 리포트/후보와 별도 Studio source로 저장되어 Dashboard와 Library의 저장 출처 breakdown에서도 분리되어야 한다. 전체 `조치 계획 복사`/`Studio로 보내기`는 복원/원본 연결 확인 순서를 Markdown 실행 계획이나 Studio 초안으로 전환한다. 이 실행 계획은 사유별 breakdown, 대표 후보 프롬프트 제목, 원본 상태, 상세 링크를 함께 포함해 운영자가 먼저 확인할 항목을 바로 찾을 수 있어야 한다. 피드백 개선 리포트와 Studio 개선 계획 초안도 같은 수치와 필터 링크를 포함해, 운영자가 품질 점수만 보기 전에 복원/출처 확인 작업을 먼저 분리할 수 있어야 한다. 개선 효과 패널의 Studio 초안 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시해야 한다.

부족한 정보가 있는 경우 Studio는 `추가 정보` 영역에서 다음 액션을 제공한다.

- 회사 정보 보강 화면으로 이동
- 개인 프로필 보강 화면으로 이동
- 부족한 맥락을 채우기 위한 질문 목록 복사

개인 프로필 보강 화면은 역할, 자주 다루는 산업/업무, 목표, 선호 톤, 선호 출력 형식을 기본 맥락 완성도 기준으로 보여준다.
`개인 프로필 저장`은 현재 사용자 프로필을 user scope 학습 메모리로 upsert해 Learning 화면과 다음 프롬프트 생성 컨텍스트에 반영한다.
개인 프로필과 회사 정보 보강 화면은 Studio 또는 Library의 `returnTo` 경로를 안전한 내부 경로로만 해석해 원래 작업 화면으로 돌아갈 수 있게 한다. 저장 후 복귀 시 Studio는 새 개인/회사 기준 재생성 CTA를, Library는 현재 프롬프트를 Studio에서 개인/회사 기준 반영 개선으로 넘기는 CTA를 표시한다.
Learning의 피드백 개선 규칙 메모리는 본문에 저장된 `근거 개선본`과 `원본 피드백` 내부 링크를 카드 액션으로 분리해, 사용자가 학습 기준을 검토할 때 해당 Library 개선본과 피드백 원문으로 바로 돌아갈 수 있어야 한다.
Studio 생성 컨텍스트, Skills 템플릿, Learning의 단일/필터 `Studio로 보내기` 초안에 학습 메모리를 주입할 때는 같은 메모리의 추적 링크 줄을 제외하고 실제 적용 규칙 본문만 전달해, 외부 AI 도구에 내부 URL이 불필요하게 섞이지 않게 해야 한다.
이 업데이트 알림은 `profileUpdated` 또는 `companyUpdated` 신호를 URL에서 제거해 반복 노출을 막는다.
회사 정보 보강 화면은 회사명, 회사 설명, 제품/서비스, 고객군, 브랜드 톤을 기본 맥락 완성도 기준으로 보여준다.
사용자는 부족한 항목으로 바로 이동하거나, 회사 맥락 질문 목록을 복사한 뒤 답변을 정리해 입력할 수 있다. 회사 맥락 질문 복사는 clipboard 권한 제한 환경에서도 fallback을 시도하고 실패 시 수동 복사용 textarea를 제공해야 한다.
기본 맥락이 채워지면 내부 용어, 금지 표현, 선호 문서 구조를 확장 기준으로 보강한다.
`회사 기준 저장`은 현재 회사 프로필을 company scope 학습 메모리로 upsert해 Learning 화면과 다음 프롬프트 생성 컨텍스트에 반영한다.
Learning 화면은 전체 메모리, scope 커버리지, 높은/낮은 신뢰도 메모리, 최근 업데이트를 기준으로 학습 준비도를 계산하고 다음 보강 액션을 보여준다. Learning 상단 메모리 지표와 준비도 지표는 모바일 2열과 데스크톱 4열로 전체 메모리, scope, 신뢰도, 최근 업데이트를 빠르게 훑게 해야 한다. Learning 상단 다음 학습 액션은 첫 학습, 낮은 신뢰도 검토, 비어 있는 scope 보강, 피드백 개선 큐, Studio 적용 확인 중 현재 우선순위를 골라 바로가기 2개와 함께 보여줘야 한다. 준비도 리포트에는 낮은 신뢰도, 최근 업데이트, scope별 점검 절대 URL을 포함해야 한다.
`운영 리포트 복사`는 학습 준비도, covered/missing scope, 신뢰도 분포, 다음 액션을 Markdown으로 내보낸다. 준비도 리포트는 Studio 초안으로 전송할 수 있고 `learning-readiness` 저장 출처로 추적해야 하며, 저장 출처 원본 경로는 `/learning#readiness`로 준비도 패널에 바로 복귀해야 한다.
Learning의 scope 배지와 범위, 검토 기준, 정렬, 검색 필터는 `/learning?scope=company&review=low-confidence&sort=confidence-asc&q=tone`처럼 URL을 갱신해 사용자/회사/분야/스킬 메모리 점검 링크를 공유할 수 있게 한다. Learning 운영 흐름은 준비도 점검, 낮은 신뢰도 검토, 수동 메모리 보강, 현재 조건 Studio 전송을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 해야 한다. Learning 상단 다음 학습 액션은 첫 학습, 낮은 신뢰도 검토, 비어 있는 scope 보강, 피드백 개선 큐, Studio 적용 확인 중 현재 우선순위를 골라 바로가기 2개와 함께 보여줘야 한다. `현재 조건 링크 복사`로 운영자가 보고 있는 학습 점검 조건을 바로 복사할 수 있고, `필터 결과 복사`로 현재 목록의 조건과 메모리를 Markdown으로 내보낼 수 있으며, 필터 결과 리포트에는 현재 조건 절대 URL을 포함해야 한다. 각 카드의 `메모리 복사`로 단일 학습 기준만 Markdown으로 내보낼 수 있다. feedback-improvement 검색 조건에서는 피드백 개선 메모리 큐를 표시해 현재 큐 수, 낮은 신뢰도, 포함 scope를 보여주고, Learning 피드백 개선 큐 지표는 모바일 2열과 데스크톱 3열로 현재 큐, 낮은 신뢰도, 포함 scope를 짧게 확인하게 해야 한다. `01 검토`, `02 Studio`, `03 기록` 단계 카드로 낮은 신뢰도 확인, Studio 검증 초안 전송, 큐 리포트/검증 저장본 기록 순서를 먼저 보여준 뒤 상세 액션은 `검토`, `Studio`, `기록` 흐름으로 나눠 보여줘야 한다. `검토`는 `낮은 신뢰도만 보기`, `낮은 신뢰도 링크 복사`, `큐 조건 링크 복사`를 제공하고, `Studio`는 `낮은 신뢰도 Studio로`와 `큐 Studio로 보내기`를 제공하며, `기록`은 `큐 리포트 복사`, `검증 저장본 보기`, `Dashboard로 돌아가기`를 제공해야 한다. `낮은 신뢰도 Studio로`는 현재 큐의 낮은 신뢰도 메모리만 `learning-feedback-improvement` 초안으로 보내 추가 근거 수집, 충돌 규칙 분리, 재저장 계획을 먼저 작성하게 해야 하며, 전용 초안은 `learning-low-confidence-validation` sourceVariant로 저장되어 Library의 세부 초안 유형 필터에서 전체 큐 개선 초안과 구분되고 검증 질문, 병합/재작성/삭제 판단, 검증 후 저장할 Learning memory 후보를 요구해야 한다. `검증 저장본 보기`와 큐 리포트의 저신뢰도 검증 저장본 링크는 `/library?studioSource=learning-feedback-improvement&studioVariant=learning-low-confidence-validation` 조건으로 저장된 검증 결과만 바로 열어야 한다. `큐 리포트 복사`는 조건 링크, 낮은 신뢰도 큐 링크, 저신뢰도 검증 저장본 링크, 큐 지표, 운영 액션, 메모리 목록을 포함한 피드백 개선 메모리 큐 리포트를 만들어야 한다. 큐 리포트나 큐 조건 링크, 낮은 신뢰도 링크 복사가 실패하면 큐 패널 안에 수동 복사용 textarea를 표시해 현재 작업 맥락을 유지해야 한다. 해당 큐에서 Studio로 보낸 초안은 `learning-feedback-improvement` 저장 출처로 추적해 일반 Learning 필터 초안과 구분해야 하며, 반복 피드백을 재사용 가능한 프롬프트 품질 규칙, 추가 검증이 필요한 규칙, GPT/Claude/Codex/Gemini handoff 체크리스트로 변환하도록 지시해야 한다. Learning 준비도, 필터 결과, 개별 메모리, 피드백 개선 큐의 Studio 초안은 각각 `Learning 준비도로 돌아가기`, `Learning 조건으로 돌아가기`, `Learning 메모리로 돌아가기`, `Learning 피드백 큐로 돌아가기` 복귀 액션 라벨로 원래 조건을 복원해야 하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시해야 한다. Learning 복사 액션은 clipboard 권한이 제한된 브라우저에서도 fallback 복사를 시도하고, 그래도 실패하면 버튼 실패 상태와 수동 복사용 textarea를 표시한다. `Studio로 보내기`는 해당 메모리를 반영한 Studio 초안을 열고, `필터 결과 Studio로 보내기`는 현재 조건의 메모리 묶음을 반영한 Studio 초안을 열어 새 프롬프트 작성으로 이어준다. Studio 출처 카드의 필터 결과 제목은 scope, 검색어, 정렬, 결과 수를 함께 표시해 어떤 Learning 조건을 불러왔는지 바로 확인하게 해야 한다. `조건 초기화`로 기본 점검 상태로 돌아갈 수 있고, 높은/낮은 신뢰도와 최근 업데이트 지표는 클릭하면 해당 점검 조건으로 목록을 즉시 전환한다.
Learning 목록은 낮은 신뢰도, 수동 메모리, 자동 생성 메모리 기준으로 좁혀볼 수 있고 신뢰도/업데이트 시각 기준으로 정렬해 보강 대상을 빠르게 찾을 수 있게 한다.
Learning의 `수동 메모리 추가`는 피드백을 기다리지 않고 회사 기준, 개인 선호, 분야 규칙, 스킬 패턴을 직접 저장해 다음 Studio 생성 컨텍스트에 반영할 수 있게 한다. `01 범위 선택`, `02 규칙 작성`, `03 생성 반영` 단계 카드로 학습 scope, 재사용 규칙, 저장 후 Studio 반영 순서를 폼보다 먼저 보여줘야 한다. `manual` 메모리는 목록에서 수정하거나 삭제할 수 있어 잘못 입력한 학습 기준을 정리할 수 있으며, 같은 scope에 같은 내용을 반복 저장하지 못하게 막는다.
Dashboard의 `학습 컨텍스트 사용` 패널은 scope별 저장 프롬프트와 학습 메모리 수를 함께 보여주고, Library 필터와 Learning scope 점검 링크를 분리해 제공한다.
Dashboard의 `개인화 보강 큐`는 개인 프로필 완성도, 회사 기준 완성도, user/company 학습 메모리, 학습 메타 보존 프롬프트 상태를 기준으로 다음 보강 액션을 우선순위로 보여주고, 각 조치를 Markdown으로 복사하거나 Studio 실행 계획 초안으로 보낼 수 있게 한다.
Dashboard의 `다음 실행 큐`는 개인화 보강 큐와 Learning 권장 조치 큐를 합쳐 High/Med/Low 우선순위로 정렬하고 우선순위별 개수, 개인화/학습 개수, 첫 실행 항목, 완료 확인 체크리스트를 보여주며, Dashboard 다음 실행 큐는 `01 첫 실행`, `02 실행 계획`, `03 완료 확인` 단계 카드로 우선 항목 처리, 큐 실행 계획, 완료 증거 확인 순서를 먼저 보여줘야 한다. 완료 확인 체크리스트만 별도 Markdown으로 복사하거나 Studio 완료 확인 계획 초안으로 보낼 수 있게 한다. 첫 실행 항목을 원본 화면으로 바로 열거나 절대 URL 링크로 복사하거나 Studio 실행 계획 초안으로 보내거나 단일 조치 리포트로 복사할 수 있고, 각 항목도 원본 화면으로 바로 열거나 조건 링크를 절대 URL로 복사하거나 Studio 실행 계획 초안으로 보내거나 단일 조치 리포트로 복사할 수 있게 한다. `큐 링크 목록 복사`는 전체 큐의 절대 URL만 가볍게 내보내고, `큐 리포트 복사`와 `큐 Studio로 보내기`는 통합 큐 전체를 절대 URL 링크, High/Med/Low 개수, 개인화/학습 개수, 첫 실행 항목, 첫 실행 절대 URL, 완료 후 검증 체크리스트가 포함된 하나의 실행 계획 입력으로 전환한다. `완료 확인 Studio로`는 같은 체크리스트와 큐 리포트를 검증 계획 입력으로 전환하고 `dashboard-next-action-queue-verification` sourceVariant로 저장해 실행 계획 초안과 구분한다. 큐 안에서 실행한 링크/리포트/완료 확인 복사가 clipboard 제한으로 실패하면 같은 큐 패널 하단에 수동 복사용 Markdown textarea를 표시한다. 다음 실행 큐 Studio 초안 저장이 실패해도 이동하지 않고 같은 큐 패널 하단에 원문 textarea를 표시해야 한다.
Dashboard의 `개인화 기준 리포트 복사`는 개인 프로필, 회사 프로필, 학습 scope coverage, 다음 보강 액션을 절대 URL 링크가 포함된 Markdown으로 내보내 외부 AI 도구나 운영 리뷰에 전달할 수 있게 한다. `리포트 Studio로 보내기`는 같은 리포트를 개인화 기준 개선 계획 초안으로 열어 프로필 보강, 메모리 후보, 측정 체크를 바로 설계할 수 있게 한다. 복사 실패나 Studio 초안 저장 실패 시 수동 복사용 textarea를 표시하고 이동하지 않는다.
Dashboard의 Learning 운영 점검 큐는 낮은 신뢰도, 수동 메모리, 최근 업데이트 기준의 Learning 필터 화면으로 바로 이동하게 한다. 권장 조치 큐는 낮은 신뢰도, 비어 있는 scope, 학습 메타 미기록 프롬프트, 수동 메모리 정합성을 우선순위로 정리한다. 각 권장 조치의 `조치 복사`는 해당 조치만 절대 URL 링크가 포함된 Markdown 리포트로 내보내고, `조치 Studio로 보내기`는 해당 조치만 실행 계획 프롬프트 초안으로 열어 작은 단위로 보강 작업을 시작하게 한다. `학습 운영 리포트 복사`는 전체 학습 메모리, 학습 메타 보존 프롬프트, 운영 점검 큐, 권장 조치 큐, scope별 현황을 절대 URL 링크가 포함된 Markdown으로 내보낸다. Dashboard 복사 액션은 clipboard 권한이 제한된 브라우저에서도 fallback 복사를 시도하고, 그래도 실패하면 수동 복사용 Markdown textarea와 실패 상태를 표시한다. `리포트 Studio로 보내기`는 같은 리포트를 학습 운영 개선 계획 프롬프트 초안으로 열어 메모리 정리, 보강 후보, 측정 체크를 바로 설계할 수 있게 한다. Learning 운영 Studio 초안 저장이 실패하면 이동하지 않고 해당 원문을 수동 복사용 textarea로 표시해야 한다.
Studio 원문 입력 패널은 `생성 준비` 요약에서 입력 분석 상태, 100점 점수, 남은 보강 질문 수, 입력 길이, 목표/분야, 자동 언어 판단, 대상 AI, 적용 학습 메모리, 저장 예정 흐름을 생성 전에 확인할 수 있게 해야 한다.
Studio 생성 준비 요약은 모바일 2열과 데스크톱 4열로 입력 준비도, 생성 기준, 학습 반영, 저장 예정 상태를 짧게 훑게 해야 한다.
Studio 생성 준비 요약의 상단 배지와 첫 번째 준비 항목은 생성 운영 흐름, 입력 분석 배지, 다음 실행 입력 품질 지표와 같은 입력 준비도 라벨을 사용해야 한다.
Studio 입력 분석 프리플라이트는 목적, 맥락, 제약, 출력 형식 준비도를 100점 기준과 모바일 2열 체크로 보여주고 부족 항목은 보강 질문으로 제안해야 한다.
Studio 입력 분석 리포트는 clipboard fallback과 수동 복사용 textarea를 제공하고, 보강 질문을 원문에 추가해 생성 전 입력을 바로 다듬을 수 있게 해야 한다.
Studio 생성 운영 흐름의 입력 단계는 입력 분석 상태와 100점 점수를 먼저 보여주고, 세부 줄 수와 목표/분야는 상세 설명으로 보존해야 한다.
Studio 다음 실행 요약은 입력 품질, 상태, 프롬프트 언어, 대상 AI, 학습 증거를 모바일 2열과 데스크톱 5열로 생성 버튼 앞에서 다시 확인하게 해야 한다.
Studio 다음 실행 요약은 `입력 보강`, `생성 실행`, `저장 추적` 체크를 함께 보여줘 생성 버튼을 누르기 전 보강 여부, 실행 기준, 저장 경로를 한 번에 확인하게 해야 한다.
Studio 다음 실행 체크는 `01 입력 보강`, `02 생성 실행`, `03 저장 추적` 단계 번호를 함께 보여줘 생성 직전 확인 순서를 바로 읽게 해야 한다.
Studio 다음 실행 상태는 단순 생성 가능 여부가 아니라 입력 분석 상태를 반영해 `바로 생성`, `검토 후 생성`, `보강 필요` 중 하나로 표시해야 한다.
Studio 다음 실행 요약은 보강 질문이 남아 있으면 생성 버튼 옆에 `보강 질문 추가`를 표시해 원문 입력으로 바로 반영해야 한다.
`보강 질문 추가`를 누르면 각 질문 아래 `답:` 입력 줄을 원문에 붙인 뒤 원문 입력으로 스크롤하고 포커스하며 커서를 끝으로 옮겨 바로 답을 채울 수 있게 해야 한다.
Studio 입력 분석은 `보강 질문 추가`로 붙은 질문 문장과 빈 `답:` 자리 자체를 준비도 신호로 계산하지 않고, 사용자가 채운 답변만 다시 분석 기준에 반영해야 한다.
Studio 입력 분석은 100점에 가까워도 남은 보강 질문이 있으면 `검토 후 생성`으로 유지하고, 모든 준비 항목이 해결된 경우에만 `바로 생성`으로 전환해야 한다.
Studio 입력 분석과 다음 실행 요약은 남은 보강 질문 수를 같이 표시해 90/100처럼 높은 점수에서도 무엇을 더 채워야 하는지 바로 보이게 해야 한다.
Studio 생성 운영 흐름, 입력 분석 배지, 다음 실행의 입력 품질 지표는 같은 입력 준비도 라벨을 사용해 상태 해석이 화면마다 달라지지 않게 해야 한다.
Studio 보강 질문 액션은 같은 질문 블록을 중복으로 붙이지 않고, 이미 추가된 상태에서는 `보강 질문 확인`으로 원문 입력에 포커스해 기존 `답:` 줄을 채우게 해야 한다.
Studio의 `적용 학습 컨텍스트`는 다음 생성에 들어갈 상위 학습 메모리와 최근 피드백 개수를 생성 전 확인할 수 있게 한다. Studio 적용 학습 컨텍스트는 `01 Scope 선택`, `02 메모리 반영`, `03 생성 저장` 단계 카드로 학습 scope 선택, 상위 메모리 반영, Library 저장 추적 순서를 scope 토글보다 먼저 보여줘야 한다.
사용자는 사용자/회사/분야/스킬 학습 메모리 scope를 생성별로 켜고 끌 수 있으며, 마지막 선택은 브라우저에 저장된다.
Studio의 scope 카드에는 현재 scope별 학습 메모리 수와 Learning 점검 링크가 표시되어 `/learning?scope=skill` 같은 필터 화면으로 바로 이동할 수 있다.
`전체 켜기`와 `메모리 제외`로 학습 메모리 반영 강도를 한 번에 조정할 수 있다.
비활성화된 scope는 OpenAI 요청과 로컬 fallback 생성 컨텍스트에서 제외된다.
Studio 생성 결과는 저장 전 학습 반영 요약을 제공해 생성 당시 사용된 메모리/피드백 수, enabled scope, 제외 scope, 대표 메모리 제목을 확인하거나 `학습 리포트 복사`로 내보낼 수 있게 한다. 저장 후 운영 상태 요약과 `Library 링크 복사`, `Skill 링크 복사`, 저장 출처/저장 방식/운영 묶음 조건 링크 fallback은 같은 학습 증거와 대표 적용 메모리 제목을 함께 보여줘야 한다.
Dashboard, Learning, Library, Skills, Profile, Company에서 Studio 초안을 열면 원문 입력 위에 초안 출처, 원본 조치 제목, 다음 실행 액션, 초안 입력 요약, 원본 경로, 원본 화면 복귀 링크와 원본 링크 복사를 표시해 사용자가 해당 초안의 목적을 확인한 뒤 생성하거나 원래 맥락으로 돌아갈 수 있게 한다. Library 출처 사유 후보 초안은 후보 1개의 원본 상태, 사유, 상세 링크를 보존해 세부 복원 계획으로 바로 이어져야 하며, 저장 시 개선 체인이 아니라 Studio 저장 출처 정보로만 보존되어야 한다. Studio와 Library 목록/상세는 초안 저장 방식을 `개선 체인` 또는 `운영 출처`로 표시해야 하며, Library는 저장 방식 필터로 개선 체인, 운영 출처, Studio 출처 없음 항목을 URL 공유 가능한 조건으로 좁힐 수 있어야 한다. 원본 화면 복귀 링크는 StudioDraft의 안전한 내부 `sourceHref`를 우선 사용해 Learning 필터 조건과 Library 선택 프롬프트/버전, Skills 스킬 편집 화면, Profile/Company 기준 화면까지 복원한다. Studio에서 이 초안으로 생성한 프롬프트를 Library에 저장하면 Studio 저장 출처 정보를 함께 보존해 저장된 항목 상세에서도 원본 Learning 조건, Dashboard 리포트, Library 개선 브리프, Skills 개선 계획 링크, Profile/Company 기준 적용 프리뷰로 되돌아갈 수 있게 한다. Library 목록 카드에서도 원본 경로를 절대 URL로 복사하고 원본 화면 복귀 액션을 제공해야 한다. Library 상세의 Studio 저장 출처 카드는 원본 경로를 절대 URL로 복사하고 원본 화면 복귀 액션을 더 자세한 저장 출처 정보와 함께 제공해야 한다. 선택 운영 요약 리포트에도 원본 경로와 원본 화면 복귀 링크를 포함해야 한다. 원본 링크 복사는 clipboard 권한 제한 환경에서도 fallback을 시도하고 실패 시 프롬프트 제목, 저장 출처, 출처 제목, 원본 경로가 포함된 수동 복사용 textarea를 표시한다. Library 상세의 같은 저장 방식/저장 출처/운영 묶음 조건 링크 복사 fallback은 프롬프트 제목, 저장 방식, 저장 출처, 출처 제목, 세부 초안 유형, 조건명을 포함해야 한다.
저장된 프롬프트는 생성 당시 enabled scope, 적용 메모리 수, 최근 피드백 수, 대표 메모리 제목을 `learningContext` 메타로 보존하고 Library 상세에서 확인할 수 있다.
Library 목록은 각 프롬프트의 학습 scope와 메모리/피드백 반영 수를 배지로 표시한다.
Library의 `학습 scope` 필터는 사용자/회사/분야/스킬 또는 학습 메타 미기록 프롬프트를 URL 공유 가능한 조건으로 좁혀 볼 수 있게 한다.
Library 상세의 `학습 컨텍스트 리포트 복사`는 생성 엔진, enabled/disabled scope, 적용 메모리 제목을 Markdown으로 내보낸다.
Library 상세의 학습 컨텍스트 카드는 `01 증거 확인`, `02 리포트 공유`, `03 Studio 개선` 단계로 enabled scope, 적용 메모리/피드백 수, 리포트 복사, Studio 재개선 초안을 한 번에 이어줘야 한다.
Library에 저장된 프롬프트 상세도 `부족한 정보`가 남아 있는 버전에서는 회사 정보 보강 이동과 보강 질문 복사 액션을 제공한다. Library 복사 액션은 clipboard 권한이 제한되거나 응답이 지연되는 브라우저에서도 fallback 복사를 시도하고, 그래도 실패하면 버튼 실패 상태와 수동 복사용 textarea를 표시한다.
회사 정보 보강 화면은 Studio 또는 Library에서 전달한 안전한 내부 `returnTo` 경로를 사용해, 상단 복귀 링크와 `저장 후 돌아가기` 버튼으로 사용자가 보강 전 작업 위치로 돌아갈 수 있게 한다.
`저장 후 돌아가기`로 복귀한 Studio는 회사 기준 업데이트 안내와 재생성 CTA를 보여주고, Library는 선택된 저장 프롬프트를 Studio 개선 브리프로 넘겨 새 회사 맥락을 반영하게 한다.
업데이트 안내는 사용자가 닫거나 반영 CTA를 실행하면 현재 URL에서 `companyUpdated` 신호를 제거해 반복 표시하지 않는다.

사용자가 `재생성 입력으로 반영`을 선택하면 Studio는 현재 버전의 본문, 우선 개선 액션, 부족한 정보를 새 원문 입력으로 구성한다.
목표는 `프롬프트 개선`으로 바뀌고 대상 AI는 현재 보고 있는 버전을 기준으로 유지된다.
이 흐름은 Library에 저장하기 전에 품질 진단을 반영한 두 번째 생성 결과를 만들기 위한 저장 전 개선 루프다.
재생성 전 버전은 세션 비교 기준으로만 보관한다.
재생성 결과가 나오면 Studio는 전체 품질 점수 변화, 항목별 점수 변화, 개선/하락 항목 수를 보여준다.
사용자는 `비교 리포트 복사`로 이전 버전과 현재 버전의 점수 이동을 Markdown으로 복사할 수 있다.
이 비교 기준은 사용자가 저장 버튼을 누르기 전 검토를 돕기 위한 임시 상태이며, Library 데이터에는 자동 저장하지 않는다.

## 12. 주요 사용자 흐름

### 흐름 1. 첫 사용

1. 사용자가 개인 프로필을 입력한다.
2. 회사 프로필을 선택적으로 입력한다.
3. 자주 하는 업무를 3개 이상 입력한다.
4. 시스템이 초기 추천 스킬을 만든다.

### 흐름 2. 원문을 전문 프롬프트로 변환

1. 사용자가 원문을 입력한다.
2. 분야와 AI 도구를 선택한다.
3. 시스템이 원문을 분석한다.
4. 개인/회사 맥락을 반영한다.
5. AI 도구별 프롬프트를 생성한다.
6. 품질 점수와 개선 포인트를 보여준다.
7. 사용자가 복사하거나 저장한다.

### 흐름 3. 피드백 학습

1. 사용자가 프롬프트를 실행한다.
2. 결과가 좋았는지 점수를 남긴다.
3. 어떤 점이 좋거나 나빴는지 코멘트를 남긴다.
4. 시스템이 피드백 유형을 분류한다.
5. 다음 프롬프트 생성에 반영할 메모리 후보를 만든다.
6. 사용자가 승인하면 프로필 또는 회사 규칙에 반영한다.

### 흐름 4. 스킬 전환

1. 특정 프롬프트가 반복 사용된다.
2. 품질 점수와 피드백이 좋다.
3. 시스템이 스킬 전환을 제안한다.
4. 사용자가 스킬 이름, 입력값, 출력 형식을 확정한다.
5. 사용자가 이번 실행 입력을 넣어 실행용 프롬프트를 생성한다.
6. 실행 프롬프트는 Library에 저장되고 이후 재사용된다.
7. Dashboard와 Skills에서 실행 횟수, 최근 실행, 평균 품질을 확인한다.
8. 실행 프롬프트 피드백을 기준으로 성공률과 개선 추천을 확인한다.
9. 사용자가 개선안을 검토한 뒤 스킬 템플릿, 출력 형식, 품질 체크리스트에 반영한다.

## 13. 기술 구조 제안

### 초기 스택

- 프론트엔드: Next.js, TypeScript
- 스타일: Tailwind CSS 또는 shadcn/ui 기반 컴포넌트
- 백엔드: Next.js Route Handler
- 데이터베이스: Supabase Postgres
- 벡터 검색: Supabase pgvector, 이후 필요 시 전용 벡터 DB 검토
- AI API: OpenAI API 우선 연동, 이후 Anthropic/Google 연동
- 인증: MVP 개인용은 단순 로컬/단일 사용자로 시작 가능, 외부 테스트 전 Supabase Auth 추가

### 초기 아키텍처

```text
Web UI
  |
  v
Next.js API Routes
  |
  +-- Prompt Optimizer Service
  +-- Profile Context Service
  +-- Model Adapter Service
  +-- Quality Scoring Service
  +-- Feedback Learning Service
  |
  v
Postgres
```

### 서비스 모듈

#### `Profile Context Service`

사용자 프로필, 회사 프로필, 분야 규칙, 메모리를 불러와 프롬프트 생성에 필요한 맥락을 만든다.

#### `Prompt Optimizer Service`

사용자 원문을 분석하고 기본 프롬프트 구조를 만든다.

#### `Model Adapter Service`

기본 프롬프트를 GPT, Claude, Codex, Gemini용으로 변환한다.

#### `Quality Scoring Service`

생성된 프롬프트를 기준표에 따라 평가한다.

#### `Feedback Learning Service`

사용자 피드백을 분류하고 개인/회사/분야/스킬 메모리 후보로 저장한다.

## 14. 개발 로드맵

### Phase 0. 기획 확정

산출물:

- MVP PRD
- 개발 브리프
- 초기 데이터 모델
- 첫 화면 구조

완료 기준:

- MVP 포함/제외 기능이 명확하다.
- 첫 번째 개발 범위가 Codex로 실행 가능한 태스크로 쪼개져 있다.

### Phase 1. 로컬 프로토타입

목표:

로그인 없이 개인용으로 프롬프트 생성 흐름을 검증한다.

기능:

- 사용자 프로필 입력
- 회사 프로필 입력
- 원문 입력
- AI 도구 선택
- 프롬프트 생성
- 품질 점수 표시
- 로컬 저장 또는 DB 저장

완료 기준:

- 실제로 원문을 넣으면 GPT/Claude/Codex/Gemini용 프롬프트가 생성된다.
- 사용자가 생성 결과를 복사할 수 있다.
- 생성 기록이 저장된다.

### Phase 2. MVP 앱

목표:

개인 사용자가 반복적으로 쓸 수 있는 최소 제품을 만든다.

기능:

- 라이브러리
- 버전 관리
- 피드백
- 프로필 기반 개인화
- 회사 프로필 기반 개인화
- 스킬 저장

완료 기준:

- 같은 사용자가 여러 작업을 수행하며 프롬프트 품질이 개선되는 흐름이 있다.
- 좋은 프롬프트를 저장하고 재사용할 수 있다.

### Phase 3. 팀/회사 확장

목표:

회사 특색과 팀 표준을 반영한다.

기능:

- 워크스페이스
- 회사 규칙
- 승인된 프롬프트
- 팀 공유
- 권한
- 감사 로그

완료 기준:

- 회사별 프롬프트 기준을 만들 수 있다.
- 팀원이 같은 기준으로 프롬프트를 생성할 수 있다.

### Phase 4. 고급 학습

목표:

데이터 기반으로 더 전문화된 프롬프트와 업무 스킬을 만든다.

기능:

- 문서 기반 검색
- 분야별 평가셋
- 모델별 성능 비교
- 특정 업무 파인튜닝 검토
- 자동 스킬 추천

완료 기준:

- 실제 사용 기록 기반으로 프롬프트 개선 제안이 가능하다.
- 특정 분야/회사에 특화된 프롬프트 품질이 일반 템플릿보다 높다는 근거가 있다.

## 15. 1차 MVP 성공 기준

### 제품 기준

- 사용자가 1분 안에 원문을 입력하고 전문 프롬프트를 받을 수 있다.
- AI 도구별 프롬프트 차이가 명확하다.
- 사용자가 결과를 저장하고 다시 찾을 수 있다.
- 피드백이 다음 생성에 반영되는 흐름이 있다.

### 품질 기준

- 생성된 프롬프트가 역할, 목표, 배경, 작업 지시, 제약 조건, 출력 형식을 포함한다.
- Codex용 프롬프트는 개발 범위, 코드베이스 탐색, 검증 조건을 포함한다.
- 회사 프로필의 금지 표현이 생성 프롬프트에 반영된다.
- 사용자 선호 출력 형식이 반영된다.

### 개발 기준

- 로컬에서 앱 실행 가능
- 주요 폼과 생성 흐름 동작
- DB 저장 또는 로컬 저장 동작
- 핵심 로직에 대한 최소 테스트 존재
- `.env.example` 포함
- Studio 생성 엔진 상태에서 OpenAI 보강 가능 여부와 로컬 fallback 모드 표시

## 16. 초기 리스크

### 프롬프트 품질이 주관적일 수 있음

대응:

품질 점수 기준을 명확히 만들고, 사용자 피드백을 함께 저장한다.

### 모델별 어댑터가 실제 성능 차이를 만들지 못할 수 있음

대응:

초기에는 도구별 사용 목적 차이를 명확히 반영하고, 실제 실행 결과를 비교해 개선한다.

### 개인화가 단순 변수 치환처럼 보일 수 있음

대응:

프로필, 회사 규칙, 피드백, 분야별 구조를 함께 반영한다.

### 학습 기능이 과장되어 보일 수 있음

대응:

초기 제품 설명에서는 파인튜닝이 아니라 프로필/메모리/피드백 기반 개인화라고 명확히 표현한다.

### 회사 데이터 보안 이슈

대응:

회사 문서 업로드와 외부 공유 기능은 MVP 이후로 미루고, 데이터 삭제/내보내기 구조를 초기에 고려한다.

## 17. 나중에 검토할 기능

- 문서 업로드 후 RAG 기반 프롬프트 생성
- 웹 리서치 기반 프롬프트 보강
- 팀별 프롬프트 승인 워크플로우
- 프롬프트 A/B 테스트
- 모델별 실행 결과 비교
- 자동 프롬프트 리팩터링
- 프롬프트 성과 대시보드
- 업종별 프롬프트 팩
- 프롬프트 마켓플레이스
- 회사 전용 AI 어시스턴트
- 브라우저 확장 프로그램
- Slack/Notion/GitHub 연동

## 18. 결론

이 제품의 1차 목표는 프롬프트를 잘 모르는 사람에게 템플릿을 주는 것이 아니다. 사용자의 생각과 업무 맥락을 AI가 실행 가능한 전문 작업 지시서로 바꾸고, 그 지시서를 계속 개선되는 자산으로 관리하는 것이다.

초기 MVP는 개인용 프롬프트 스튜디오로 시작한다. 이후 회사 프로필, 팀 공유, 문서 기반 검색, 고급 학습, 파인튜닝 검토로 확장한다.
