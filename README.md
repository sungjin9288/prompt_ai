# Prompt AI Studio

개인/회사/분야 맥락을 반영해 사용자의 원문을 GPT, Claude, Codex, Gemini용 영어 또는 한영 하이브리드 전문 프롬프트로 변환하는 로컬 MVP입니다.

## 현재 범위

- 사용자 프로필 저장
- 사용자 프로필 완성도, 보강 질문 복사, 저장 시 user scope 학습 메모리 반영
- 회사/브랜드 기준 저장
- Profile/Company 상단 운영 흐름은 필수 맥락 입력, 보강 질문 복사, user/company scope 학습 반영, 원래 작업 화면 복귀를 먼저 보여줍니다.
- Profile/Company AI 적용 프리뷰는 입력한 개인/회사 기준을 GPT, Claude, Codex, Gemini에 붙일 수 있는 영어 또는 한영 하이브리드 적용 지시문으로 미리 보여주고 복사하거나 Studio 초안으로 보냅니다.
- Profile/Company AI 적용 프리뷰의 Studio 초안은 각각 `Profile로 돌아가기`, `Company로 돌아가기` 복귀 액션 라벨로 원래 기준 화면을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 적용 프롬프트 원문을 표시합니다.
- Profile/Company AI 적용 프리뷰는 `01 기준 확인`, `02 적용 문구`, `03 Studio 전송` 단계 카드로 기준 점검, 영어/한영 하이브리드 지시문 적용, 외부 AI handoff 순서를 먼저 보여줍니다.
- 원문 기반 프롬프트 생성
- 원문/목표/분야 기반 대상 AI 도구 자동 추천
- 자동 대상 AI 추천 이유와 신호 저장
- 대상 AI 자동 추천 이유는 실제 추천 모델명과 일치하게 표시
- 대상 AI 도구별 품질/피드백 성과 요약
- 원문/분야/대상 AI 기반 자동 프롬프트 언어 판단
- 자동 언어 판단 이유와 신호 저장
- 최종 답변 언어 설정: 한국어, 영어, 입력 언어와 동일
- GPT, Claude, Codex, Gemini용 어댑터
- Chrome, GPT/Claude/Codex/Gemini, MCP 클라이언트 연결 표면
- 외부 Gen AI 환경에서 같은 개인/회사/학습 기준으로 자동 정제하고 검토 후 전달하는 Integrations 운영 화면
- Integrations 지원 환경 요약: Chrome, ChatGPT/Claude/Gemini, Codex, MCP의 역할과 현재 gate를 모바일 2열과 데스크톱 4열로 먼저 보여주고, 외부 AI 표면은 로컬 smoke evidence 저장 후 reviewRequired package만 전달하는 기준을 명시
- Integrations 연결 계약 매트릭스: Chrome, ChatGPT/Claude/Gemini, Codex, MCP별 capture, package, review gate, feedback 산출물을 같은 카드 구조로 보여줘 각 환경이 같은 review-required/confirmSave 계약을 어떻게 지키는지 한눈에 확인하게 합니다.
- Integrations 실행 증거 체크: 로컬 연결, 정제 결과, 증거 저장, 전달 승인, 피드백 증거별로 남아야 할 evidence와 이동 링크를 먼저 보여줘 외부 AI 실행 전후의 검증 기준을 놓치지 않게 합니다.
- Integrations Smoke 증거 경로: `npm run smoke:integrations` local packet summary, actual evidence, reviewed feedback record 순서를 먼저 보여주고 Integrated preflight, MCP bridge, MCP client, Chrome popup, Learning feedback 큐 smoke가 각각 command, evidence, result로 어떻게 이어지는지 대조하며 상세 섹션으로 이동하게 합니다.
- Integrations 검증 게이트 요약: 로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장 기준을 먼저 확인하고 게이트별 상세 이동 제공
- Integrations 검증 게이트 요약은 모바일 2열과 데스크톱 4열로 로컬 정제, 증거 저장, 검토 후 전달, 명시적 피드백 저장 상태를 짧게 훑게 합니다.
- Integrations 운영자 다음 조치: 로컬 서버 유지, 연결 표면 1개 검증, `npm run smoke:integrations` 로컬 smoke evidence 저장, 외부 AI 전달 전 검토, 실행 결과 피드백 저장, release evidence와 release-candidate 확인 순서를 상단에서 확인하고 Chrome loaded extension, MCP client, Learning feedback 실제 증빙 필드를 먼저 보여줍니다. 각 단계의 내가 할 일, 완료 기준, evidence와 관련 상세 섹션 이동, 전체/단계별 다음 조치 Markdown 복사, `integrations-operations-checklist` Studio 초안 전송 제공. Studio 초안 원본 경로는 `#integrations-next-actions`로 돌아오며, Studio 복귀 액션 라벨은 `Integrations 원본 섹션으로 돌아가기`로 표시하고, 저장 실패 시 이동하지 않고 수동 복사용 다음 조치 원문을 표시
- Integrations 외부 AI 운영 가이드: 운영 단계, 첫 실행, review-required 전달 gate, confirmSave 피드백 저장 gate를 모바일 2열 요약으로 먼저 보여주고 로컬 앱 실행, 연결 표면 1개 선택, review-required 결과 확인, `npm run smoke:integrations` 로컬 smoke evidence 저장, 외부 AI 수동 전달, confirmSave 피드백 저장 판단 순서와 단계별 확인 기준, MCP 기본값 예시를 한 화면에 표시합니다. 운영 가이드 복사/`integrations-operations-checklist` Studio 초안에는 실행 증거 체크와 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함하고 Studio 초안 원본 경로는 `#integrations-operator-guide`로 돌아오며, Studio 복귀 액션 라벨은 `Integrations 원본 섹션으로 돌아가기`로 표시하고, 저장 실패 시 이동하지 않고 수동 복사용 운영 가이드 원문을 표시
- Integrations 연결 실행 순서: 로컬 앱, 입력 수집, 증거 저장, 검토 전달, 피드백 저장을 첫 화면에서 확인하고, Integrations 운영 흐름 요약에서 Capture, Refine, Evidence, Deliver, Feedback 단계별 owner, artifact, gate를 카드로 먼저 보여준 뒤 상세 표를 유지합니다. 섹션별 용도 설명이 포함된 빠른 이동 내비게이션과 Refine API 테스트, MCP 연결 설정, Smoke 증거 경로, 준비도, 환경별 실행 가이드, Feedback inbox 상세 섹션 앵커 이동 제공
- Integrations 자동화 원칙과 출시 순서는 기본 모드를 `Refine automatically, save evidence, deliver with review.`로 표시하고 `local-smoke-evidence`를 `target-ai-handoff` 전에 남기도록 보여줘 감사 출처와 출시 단계가 같은 evidence-first 흐름을 따르게 합니다.
- Integrations 환경별 실행 가이드: 연결 환경, 대상 AI 범위, `npm run smoke:integrations` smoke evidence와 review-required gate, confirmSave 피드백 경로를 모바일 2열 요약으로 먼저 보여주고 Chrome extension, ChatGPT/Claude/Gemini, Codex, MCP client별 connection mode, trigger, first action, Studio action, output, operator check, target AI를 한 화면에서 확인하며 각 환경의 operator check에서 `npm run smoke:integrations` 실행을 외부 전달과 confirmSave 저장보다 먼저 고정합니다. 환경별 체크리스트 복사, 환경별 체크리스트 Studio 전송, 전체 체크리스트 복사, `integrations-operations-checklist` 전체 체크리스트 Studio 전송 패키지에는 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함하고 Studio 초안 원본 경로는 `#integrations-environment-guide`로 돌아오며, Studio 복귀 액션 라벨은 `Integrations 원본 섹션으로 돌아가기`로 표시합니다. Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 체크리스트 원문을 표시
- `POST /api/integrations/refine` 외부 정제 API: Chrome/MCP/외부 Gen AI 클라이언트가 원문을 보내면 review-required target AI handoff package 반환
- Integrations refine tester에서 Chrome/MCP payload를 직접 실행하고 target AI handoff package를 복사
- Integrations refine tester는 수집 경로, 대상 AI, 검토 gate, 전달 패키지 상태를 실행 버튼 앞에서 확인하게 하고, 요청 source/target/domain/goal과 reviewRequired/target package/quality/language 요약을 모바일 2열로 먼저 보여주며, 복사 전 체크리스트에서 로컬 smoke evidence 저장을 먼저 확인하게 하고, raw payload와 handoff package 원문은 별도 preview로 유지합니다.
- Integrations MCP 연결 설정은 대상 클라이언트 수, 공유 mcpServers config, --self-test 첫 검증, confirmSave 피드백 gate를 모바일 2열 요약으로 먼저 보여주고 `01 로컬 준비`, `02 클라이언트 연결`, `03 검증과 학습` 단계 카드로 dev server/self-test, shared mcpServers config, reviewRequired package, `npm run smoke:mcp-client`, `npm run smoke:integrations`, confirmSave feedback 순서를 구분합니다. Claude/Codex/GPT-compatible client별 config scope, target AI, use case, operator gate를 카드로 먼저 구분하고 공통 MCP client config, self-test 명령, client smoke 명령, 통합 smoke 명령, dev server 명령, runbook 버튼 전 화면 요약과 복사/Studio 초안 원문에 `chrome-selection -> mcp-refine -> local-smoke-evidence -> target-ai-handoff` 감사 출처 순서를 포함하며 Studio 초안 원본 경로는 `#integrations-mcp-connection`으로 돌아오고, Studio 복귀 액션 라벨은 `Integrations 원본 섹션으로 돌아가기`로 표시합니다. `refine_prompt` 운영 체크리스트와 Claude/Codex/GPT-compatible MCP client별 설정 예시, smoke prompt, smoke feedback payload, feedback inbox API 확인, curl smoke check 복사, client별 feedback inbox 필터 링크 이동과 UI/API/curl 검증 경로를 카드로 먼저 보여준 뒤 상세 검증 매트릭스 제공. 실제 MCP client에서 확인한 client/tool sequence/review gate/target AI/evidence result/integrated smoke result/feedback record를 증빙 패킷, confirmSave false feedback payload, inbox 확인 명령으로 복사하게 합니다. Codex와 GPT-compatible client는 같은 MCP server config를 공유하되 Codex는 repo-aware 구현 브리프와 별도 operator gate로 분리. Studio 초안 저장 실패 시 이동하지 않고 수동 복사용 runbook 원문을 표시
- Integrations 연결 준비도 점검에서 연결 표면, 첫 실행 표면, `npm run smoke:integrations`를 포함한 smoke 명령, smoke evidence 저장과 review-required 승인 gate를 모바일 2열 요약으로 먼저 보여주고, Chrome loaded smoke 체크리스트와 증빙 패킷으로 runtime, capture, result, session restore, evidence fallback 증거를 같은 순서로 확인하고 복사하게 하며, 실제 Chrome popup에서 확인한 runtime/source/review gate/target AI/session/evidence result 값을 operator evidence packet, confirmSave false 기본의 `save_execution_feedback` payload, confirmSave true 저장 후 Feedback inbox UI/API/curl 확인 명령으로 복사하게 하고, Chrome extension, MCP client, ChatGPT/Claude/Gemini, Codex별 status gate, install step, smoke test, operator action, operator evidence를 확인하며 준비도 체크리스트와 smoke test 명령 복사
- `extensions/chrome` unpacked Chrome extension scaffold: 선택 텍스트 또는 우클릭 `Refine with Prompt AI Studio` context menu 선택을 저장된 local-only Studio URL과 Target AI/Domain/Goal 설정 기준으로 refine API에 보내고 review-required handoff package 표시/복사, 브라우저 세션 내 target/source/time 메타가 포함된 마지막 handoff package 복원. Chrome popup 실행 순서는 `01 선택 수집`, `02 Studio 정제`, `03 검토 전달` 단계로 선택 텍스트, local refine API, review-required handoff 복사 흐름을 먼저 보여주고, Smoke evidence 패널은 runtime/capture/refine/deliver/evidence packet 증거를 같은 popup에서 대조하게 합니다. Handoff result summary는 review gate, target AI, source, session 저장 상태를 handoff 원문 위에서 먼저 보여주며, Evidence 버튼은 같은 결과 기준의 Chrome handoff evidence packet을 복사하고 실패 시 수동 복사용 evidence textarea를 엽니다. 정적 preview에서는 Chrome extension runtime unavailable 상태를 표시하고 page selection/session restore를 건너뛰어 layout smoke를 안정적으로 수행합니다.
- `mcp/prompt-ai-studio.mjs` stdio MCP bridge: MCP 클라이언트에서 `get_context_profile`로 read-only 컨텍스트 정책과 operation defaults를 확인하고 `refine_prompt`/`create_handoff_package`로 local refine API를 호출해 review-required handoff package 반환, `PROMPT_AI_STUDIO_TARGET_AI`/`DOMAIN`/`GOAL`/`SOURCE_URL` 환경 기본값 지원, `save_execution_feedback`은 `confirmSave: true`일 때만 로컬 feedback inbox에 저장
- `GET /api/integrations/mcp-feedback`와 Integrations MCP feedback inbox 패널: confirmSave된 외부 AI 실행 피드백 JSONL을 최근 항목, rating, target AI 기준으로 읽기 전용 확인하고 저장 상태, 현재 결과, 현재 필터, 검증 상태를 모바일 2열 요약으로 먼저 보여주며, 비어 있는 inbox에서는 `confirmSave: true` 저장 예시를 복사해 첫 feedback record를 만들 수 있게 하고, 저장된 각 record에서는 Feedback ID, confirmSave gate, 증빙 준비 상태를 먼저 확인한 뒤 다음 확인 액션을 포함한 Feedback 증빙 패킷, learning memory candidate, Studio 개선 초안을 복사하게 합니다. Learning candidate와 Studio 개선 초안은 confirmSave true와 evidence-ready trace를 포함해 재사용 전 audit 기준을 보존합니다. `mcpRating`/`mcpTargetAI` URL 필터 공유, 현재 필터 링크 복사/현재 API endpoint 표시와 복사/현재 필터 기준 curl smoke check 표시와 복사/필터 초기화, 원본 필터 링크, record trace, 다음 확인 액션을 포함한 feedback report, Studio에서 단건 evidence-ready 초안과 trace-ready report 비교를 먼저 안내하는 `trace-ready` source title이 붙은 `mcp-feedback-report` 운영 리포트 Studio 초안과 저장 후 confirmSave evidence trace가 저장본에 반영됐는지 확인, learning candidate와 Studio 개선 초안 비교를 먼저 안내하는 `evidence-ready` source title이 붙은 `mcp-feedback-improvement` 단건 Studio 초안 전송, Feedback inbox 복귀 링크 및 원본 필터 링크 보존, Studio 복귀 액션 라벨은 `Feedback inbox로 돌아가기`로 표시하고 클릭 후 같은 `mcpRating`/`mcpTargetAI` 필터와 `#integrations-feedback-inbox` 앵커 복원, Studio 초안 저장 실패 시 수동 복사용 원문 표시
- Data 문서/RAG 준비도와 로컬 수집 패킷: `document_sources`, `document_chunks`, `pgvector`, ingestion gate, retrieval gate를 `/data` 준비도 영역에서 확인하고 텍스트/Markdown/JSON 문서를 붙여넣거나 파일로 불러와 chunk preview, workspace scope, server-side embedding, source ID/chunk index citation 기준을 복사 가능한 운영 노트와 local-only ingestion packet으로 남김. 같은 chunk 맥락은 `data-document-rag` Studio 초안으로 전송되어 저장 후 Library의 Studio 저장 출처로 추적되며, Studio 초안은 `Data 문서/RAG로 돌아가기` 복귀 액션 라벨로 `/data` 원본 경로를 복원합니다. 전송 준비 요약에서 프롬프트 언어 자동 판단, 입력 언어와 동일한 답변 언어, 전달 chunk 범위, 인용 기준을 먼저 확인합니다. 저장이 실패하면 이동하지 않고 문서/RAG Studio 원문을 수동 복사용 textarea로 표시
- 한국어/영어 섹션 구조를 함께 인식하는 프롬프트 품질 점수
- Studio 입력 분석 프리플라이트: 목적, 맥락, 제약, 출력 형식 준비도를 생성 전에 100점 기준과 모바일 2열 체크로 확인하고 부족 항목은 보강 질문으로 제안
- Studio 입력 분석 리포트 복사의 clipboard fallback, 실패 상태, 수동 복사용 textarea 표시, 보강 질문 원문 추가 액션
- Studio 생성 운영 흐름의 입력 단계에서 입력 분석 상태와 100점 점수 선노출
- Studio 생성 결과의 품질 진단, 우선 개선 액션, 품질 리포트 복사, 진단 기반 재생성 입력 반영, 세션 품질 비교, 저장 후 Library 상세 이동, 상세 링크 복사와 Skill 전환
- Studio 현재 버전/품질 리포트/학습 리포트/보강 질문/비교 리포트 복사의 clipboard fallback, 실패 상태, 수동 복사용 textarea 표시
- localStorage 기반 라이브러리
- 대상 AI 도구별 라이브러리 필터링
- Dashboard 대상 AI 성과에서 Library 모델 필터로 이동
- 언어 전략별 라이브러리 필터링
- Dashboard 언어 전략 성과에서 Library 언어 전략 필터로 이동
- 답변 언어별 라이브러리 필터링
- Dashboard 답변 언어 성과에서 Library 답변 언어 필터로 이동
- Library 검색어/필터/정렬 URL 동기화, 조건별 해제, 상단 적용 조건 요약과 공유/초기화 액션
- Library 개선본 원본 대비 점수 변화 기준 개선 효과순 정렬
- Library 언어 전략/답변 언어/대상 AI/생성 엔진/개선 상태 필터의 옵션별 개수 표시
- Library 학습 scope 필터와 URL 공유
- Library 목록/상세의 생성 엔진 배지와 OpenAI 모델명 표시
- Dashboard 생성 엔진별 품질/피드백 성과 요약과 Library 생성 엔진 필터 이동
- Dashboard 생성 엔진 상태 표시: OpenAI 보강 가능 여부와 로컬 fallback 모드 확인
- Library 상세 프롬프트/버전 딥링크와 상세 링크 복사
- Library 현재 버전/공유 링크/상세 링크/학습 리포트/보강 질문/비교·개선 브리프 복사의 clipboard fallback, 실패 상태, 수동 복사용 textarea 표시
- Library 상세의 AI 도구별 버전 품질/피드백 비교
- Library 상세의 개선본 원본 대비 세부 품질 지표 변화 비교
- Library 목록/상세의 1차/2차 개선본 차수 배지, 원본/개선본 본문 비교 모드, 개선 체인/후속 재개선 이력, 비교 브리프 복사, Studio 재개선 연결, URL 딥링크 복원
- Library 운영 흐름은 검색 조건, 목록 결과, 선택 프롬프트 운영 요약, 출처/이력 추적을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 합니다.
- Library 상세/리스트의 선택 프롬프트 운영 상태 요약: 저장 방식, 출처, 세부 초안 유형, 저장 출처 제목, 개선 체인, AI 전달 readiness, 다음 권장 액션 표시와 직접 실행, 선택 운영 요약 리포트 복사와 Studio 전송, 출처 사유/저장 출처/저장 방식/운영 묶음 이동과 선택 운영 요약/목록 카드 조건 링크 복사, 출처 사유 대표 후보 상세 이동/링크 복사, 선택 출처/선택 저장 방식/저장 출처 메타 없음 저장 방식 링크, 조건 링크와 리포트 복사, Studio 전송
- Library 선택 운영 요약의 저장 방식, 출처, 체인은 모바일 2열과 데스크톱 3열로 압축해 상세 패널에서도 보존 방식과 다음 조치를 빠르게 확인하게 합니다.
- Library 선택 운영 요약은 `01 확인`, `02 공유`, `03 개선` 단계 카드를 함께 보여줘 저장본을 열었을 때 상태 확인, 링크/리포트 공유, Studio 개선 실행 순서를 바로 읽게 합니다.
- Studio 불러온 초안의 운영 상태 요약: 저장 방식, 저장 출처, 세부 초안 유형, 저장 예정 체인, 생성 후 보존 방식 표시와 직접 생성, 세부 유형 기준 원본 링크 복사 문구와 fallback 출처 제목/세부 유형 메타, 명시 원본 경로가 없는 Library 운영 초안의 저장 출처/세부 유형 필터 fallback, Skills/Profile/Company 초안의 원본 화면 fallback
- Studio 생성 결과의 AI 전달 상태 요약과 저장 운영 상태 요약: 보강 필요/검토 필요/전달 가능 개수, 우선 확인 항목, 전달 전 검토 큐, 저장 방식/저장 출처/출처 제목/세부 초안 유형/Library 기록/학습 증거, 저장/재생성/이전 결과 유지/Library 이동/저장 출처 이동/저장 방식 이동/운영 묶음 이동 액션 표시와 직접 실행, sourceVariant가 있으면 `studioVariant` 조건을 포함한 저장 출처/운영 묶음 링크와 세부 유형 기준 복사 문구 제공, 저장 출처/저장 방식/운영 묶음 조건 링크 절대 URL과 학습 증거가 포함된 fallback 운영 메타 복사
- Studio 생성 결과는 결과 실행 순서 요약에서 `검토`, `AI 전달`, `저장`의 현재 상태, 다음 확인 항목, 바로 실행할 다음 행동을 액션 버튼 앞에서 먼저 보여줍니다. 각 액션 묶음은 현재 품질 진단, AI 전달 상태, 저장 상태를 짧은 배지와 판단 문구로 버튼 위에 표시해 사용자가 복사, 전달, 저장 순서를 바로 고르게 합니다.
- Studio 생성 결과 액션 묶음은 `01 검토`, `02 AI 전달`, `03 저장` 단계 번호를 함께 보여줘 버튼 영역만 봐도 실행 순서를 알 수 있게 합니다.
- AI 전달이 차단 상태이면 `AI 전달` 액션 묶음 안에서도 `보강 브리프 적용`을 먼저 제공해 패키지 복사보다 재생성 루프를 우선 실행하게 합니다.
- Studio 재개선 결과 저장 시 1차/2차 개선본 제목 차수 표기
- Library 상세의 전체 품질 점수, 가정, 부족한 정보 진단
- Library 상세의 품질 기반 개선 액션, 개선 브리프 복사, Studio 개선 입력 연결, 개선 결과 출처 추적과 품질 개선 효과 표시
- Dashboard의 개선본 원본 대비 평균 개선폭, 차수별/AI 도구별/분야별 개선 효과 집계
- Dashboard 개선 효과 수치와 재개선 후보 KPI에서 Library 개선 상태 필터로 이동
- Dashboard Studio 저장 방식 전체/항목별 Library 필터 이동/링크 복사
- Dashboard 재개선 후보 큐에서 Library 비교 화면 이동 및 Studio 재개선 시작
- Dashboard Studio 저장 출처 breakdown에서 출처별 다음 조치, Skills 개선 계획 source, sourceVariant 세부 유형 count와 `studioVariant` Library 필터 링크 이동/복사, 대표 저장 출처 제목 확인, 대표 저장본 외 잔여 count 표시, 전체/출처별 Library 필터 이동/링크 복사, 대표 저장본 상세 링크와 원본 경로 직접 이동/복사, 대표 저장본/원본 링크 fallback의 출처 제목·링크 유형·원본 경로 메타, 대표 저장본 상세 링크·원본 경로·필터 링크를 절대 URL로 포함한 저장 출처 운영 리포트 복사와 Studio 초안 전송, 저장 출처 메타 없음 큐 링크/운영 프롬프트 복사와 Studio 초안의 절대 URL 큐 링크 포함
- Dashboard 출처 상태 조치의 보관함 원본/측정 불가/사유별 Library 필터 이동과 링크 복사, 대표 후보 상세 링크 복사, 절대 URL 기반 조치 리포트와 후보 메모
- Dashboard 학습 컨텍스트 사용 현황과 Library/Learning 학습 scope 필터 이동
- Dashboard 개인화 기준에서 Profile/Company 편집, 저장 후 Dashboard 복귀, user/company 학습 메모리 점검으로 바로 이동
- Dashboard 개인화 보강 큐에서 프로필, 회사 기준, 학습 메모리, 첫 개인화 생성 우선순위 확인 및 조치별 Markdown 복사/Studio 초안 전송
- Dashboard 다음 실행 큐에서 개인화 보강 액션과 Learning 운영 액션을 통합 우선순위, High/Med/Low 개수, 개인화/학습 개수, 첫 실행 항목, 완료 확인 체크리스트로 보고 첫 실행 바로 열기/링크 복사/Studio 전송/리포트 복사, 항목별 링크 복사/Studio 초안/조치 리포트, 큐 전체 링크 목록/리포트 복사와 Studio 초안 전송, 완료 확인 Studio 계획 전송
- Dashboard 다음 실행 큐는 `01 첫 실행`, `02 실행 계획`, `03 완료 확인` 단계 카드로 우선 항목 처리, 큐 실행 계획, 완료 증거 확인 순서를 먼저 보여줍니다.
- Dashboard 개인화 기준 리포트 복사와 Studio 초안 전송으로 개인/회사 프로필, 학습 scope, 다음 보강 액션을 개선 계획으로 전환
- Dashboard Learning 운영 점검 큐에서 낮은 신뢰도, 수동 메모리, 최근 업데이트 필터 이동, 권장 조치 큐, 조치별 복사/Studio 초안, 학습 운영 리포트 복사와 Studio 초안 연결
- Dashboard 개인화, 다음 실행 큐, Learning 운영 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 원래 Dashboard 맥락을 복원하며, 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시합니다.
- Dashboard Learning 운영 리포트/조치 복사의 clipboard fallback
- 언어 전략별 품질/피드백 성과 요약
- 답변 언어별 품질/피드백 성과 요약
- Studio와 Skills의 AI 자동 언어 전략 판단
- Studio 프롬프트 언어 패널은 사용자가 선택하지 않고 AI 자동 판단 결과, 판단 신뢰도, 감지 신호, 답변 언어와의 분리를 보여줍니다.
- Studio 다음 실행 요약은 입력 분석 상태, 자동 언어 판단, 대상 AI, 답변 언어, 학습 반영 수, 저장 경로를 생성 버튼 옆에서 확인하게 합니다.
- Studio 다음 실행 요약은 입력 품질, 상태, 프롬프트 언어, 대상 AI, 학습 증거를 모바일 2열과 데스크톱 5열로 생성 버튼 앞에서 다시 확인하게 합니다.
- Studio 다음 실행 요약은 `입력 보강`, `생성 실행`, `저장 추적` 체크를 함께 보여줘 생성 버튼을 누르기 전 보강 여부, 실행 기준, 저장 경로를 한 번에 확인하게 합니다.
- Studio 대상 AI 패널은 자동 추천 적용, 추천과 동일, 수동 조정 상태와 추천 신뢰도, 선택 도구를 분리해 보여줍니다.
- Studio 적용 학습 컨텍스트 패널은 적용 scope 수, 학습 메모리 수, 최근 피드백 수를 scope 토글 위에서 먼저 보여줍니다.
- Studio 적용 학습 컨텍스트는 `01 Scope 선택`, `02 메모리 반영`, `03 생성 저장` 단계 카드로 학습 scope 선택, 상위 메모리 반영, Library 저장 추적 순서를 scope 토글보다 먼저 보여줍니다.
- Studio 생성 운영 흐름은 원문 입력, AI 판단, 학습 컨텍스트, 생성 실행 위치를 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 합니다.
- 성과 기반 Studio 추천 답변 언어
- 회사 맥락 질문 복사의 clipboard fallback, 실패 상태, 수동 복사용 textarea 표시
- 피드백 저장 및 다음 생성 시 반영
- 피드백 기반 학습 메모리 자동 생성
- Library 최근 피드백에서 해당 피드백을 반영한 Studio 개선 초안으로 바로 전환
- Studio 생성 전 적용 학습 컨텍스트 미리보기
- Studio 생성 전 사용자/회사/분야/스킬 학습 메모리 scope 반영 여부 선택
- Dashboard/Learning/Library Studio 초안의 출처, 원본 조치, 다음 실행 액션, 초안 입력 요약, 원본 경로, 원본 화면 복귀 링크와 원본 링크 복사
- 사용자/회사/분야/스킬 scope별 학습 메모리 화면
- Learning 학습 준비도, scope 커버리지, 보강 액션, 운영 리포트 복사와 Studio 초안 연결
- Learning scope/검토 기준/정렬/검색어 URL 공유, 조건 링크/필터 결과/개별 메모리 복사, 개별/필터 결과 Studio 초안 연결, 조건 초기화 및 준비도 지표/배지 필터 이동
- Learning 운영 흐름은 준비도 점검, 낮은 신뢰도 검토, 수동 메모리 보강, 현재 조건 Studio 전송을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 합니다.
- Learning 상단 메모리 지표와 준비도 지표는 모바일 2열과 데스크톱 4열로 전체 메모리, scope, 신뢰도, 최근 업데이트를 빠르게 훑게 합니다.
- Learning 상단 다음 학습 액션은 첫 학습, 낮은 신뢰도 검토, 비어 있는 scope 보강, 피드백 개선 큐, Studio 적용 확인 중 현재 우선순위를 골라 바로가기 2개와 함께 보여줍니다.
- Learning 피드백 개선 큐 지표는 모바일 2열과 데스크톱 3열로 현재 큐, 낮은 신뢰도, 포함 scope를 짧게 확인하게 합니다.
- Learning 피드백 개선 큐는 `01 검토`, `02 Studio`, `03 기록` 단계 카드를 함께 보여줘 낮은 신뢰도 확인, Studio 검증 초안 전송, 큐 리포트/검증 저장본 기록과 release gate 확인 순서를 바로 읽게 합니다.
- Learning 준비도 리포트에 낮은 신뢰도, 최근 업데이트, scope별 점검 절대 URL을 포함
- Learning 준비도 리포트를 Studio 초안으로 전송하고 `learning-readiness` 저장 출처로 추적
- Learning 필터 결과 리포트에 현재 조건 절대 URL을 포함
- Learning 준비도, 필터 결과, 개별 메모리, 피드백 개선 큐의 Studio 초안은 각각 `Learning 준비도로 돌아가기`, `Learning 조건으로 돌아가기`, `Learning 메모리로 돌아가기`, `Learning 피드백 큐로 돌아가기` 복귀 액션 라벨로 원래 조건을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시합니다.
- Learning 운영 리포트/조건 링크/필터 결과/개별 메모리 복사의 clipboard fallback, 실패 상태, 수동 복사용 textarea 표시
- Learning 낮은 신뢰도/수동/자동 생성 검토 기준 필터와 신뢰도/업데이트 정렬
- Learning 수동 메모리 추가/수정/삭제와 같은 scope+내용 중복 저장 방지로 회사 기준, 개인 선호, 분야 규칙, 스킬 패턴 직접 보강
- Learning 수동 메모리 추가는 `01 범위 선택`, `02 규칙 작성`, `03 생성 반영` 단계 카드로 학습 scope, 재사용 규칙, 저장 후 Studio 반영 순서를 폼보다 먼저 보여줍니다.
- 저장 프롬프트 기반 스킬 빌더와 `/skills?prompt=...` 딥링크 자동 로드
- 스킬별 자동 언어 판단과 답변 언어 보존 및 실행 프롬프트 반영
- 스킬 저장 후 실행 예시 입력 채우기, 실행 프롬프트 생성, Library 저장 후 상세 이동/링크 복사, 스킬별 실행 이력 Library 상세 이동
- Skills 운영 요약에서 전체 실행, 실행 스킬, 피드백, 최근 실행, 반복 사용 상위 스킬, 개선 필요 큐 집계
- Skills 운영 흐름은 원본 확인, 템플릿 정리, 실행 저장, 운영 개선을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 합니다.
- Skills 운영 요약 지표는 모바일 2열과 데스크톱 3열로 전체 실행, 실행 스킬, 피드백, 최근 실행, 반복 상위, 개선 큐를 짧게 훑게 합니다.
- Skills 실행 준비 흐름은 `01 템플릿 확인`, `02 실행 검증`, `03 운영 저장` 단계 카드로 템플릿 상태, 실행 입력/프롬프트 생성, Library 저장과 피드백 수집 순서를 바로 읽게 합니다.
- Skills 운영 요약과 개선 계획의 Studio 초안은 각각 `Skills로 돌아가기`, `Skills 스킬로 돌아가기` 복귀 액션 라벨로 원래 화면을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 원문을 표시합니다.
- Skills 운영 요약과 실행 이력에서 최근 실행/개별 실행 Library 링크를 절대 URL로 복사
- Skills 운영 리포트 복사/Studio 전송에 최근 실행 Library 링크와 상위/개선 큐 Skills 링크를 절대 URL로 포함
- Skills 운영 요약을 Studio 초안으로 전송하고 `skills-operational-summary` 저장 출처로 추적
- Skills 원본 Library 프롬프트 카드에서 Studio 저장 출처, 세부 초안 유형, 출처 제목을 표시하고 원본 링크 fallback에 원본 경로와 함께 포함
- Skills 실행 저장/최근 실행/실행 이력 카드에 스킬명을 표시
- Skills 실행 저장/최근 실행/실행 이력 Library 링크 fallback에 실행 프롬프트, 스킬, 대상 AI, 품질, 피드백, 생성일 메타를 포함
- Skills 실행 프롬프트 복사 fallback에 스킬, 대상 AI, 언어 전략, 답변 언어, 실행 입력, 프롬프트 본문을 포함
- Skills 개선 계획 복사 fallback에 스킬, 대상 AI, 언어 전략, 답변 언어, 피드백 지표, 추천 항목, 반영 예정 변경, 최근 코멘트를 포함
- Skills 개선 계획을 Studio 초안으로 전송하고 `skills-improvement-plan` 저장 출처로 추적
- Skills 개선 계획 Studio 초안에 현재 스킬 설명, 입력 가이드, 출력 형식, 품질 체크리스트, 템플릿 본문을 포함
- Skills 스킬 템플릿 복사 fallback에 스킬, 대상 AI, 언어 전략, 답변 언어, 출력 형식, 품질 체크리스트, 템플릿 본문을 포함
- 스킬 원본 Library 링크/템플릿/실행 프롬프트 복사의 clipboard fallback, 실패 상태, 수동 복사용 textarea 표시
- 스킬 실행 이력 및 Dashboard 성과 집계, 최근 실행 Library 상세 이동/링크 복사, 반복 사용/개선 대기 Skills 딥링크 복사, 스킬 편집 딥링크, 절대 URL 링크를 포함한 스킬 운영 리포트 복사/Studio 초안 전송
- 스킬별 성공률/피드백 기반 개선 추천
- 피드백 기반 스킬 템플릿 개선안 반영
- 도메인 저장소 hook 레이어로 localStorage 의존성 격리
- 워크스페이스 데이터 백업/검증/복원
- 백업 JSON 파일 선택 기반 가져오기와 즉시 검증
- 백업 생성 후 JSON 길이/수량/백업 지문 요약과 다운로드/복사 액션 표시
- Data 워크스페이스 스냅샷 수량과 문서/RAG 핵심 상태는 모바일 2열과 데스크톱 4열로 압축해 로컬 데이터와 RAG 준비 상태를 짧게 훑게 합니다.
- 마지막 백업 메타에 백업 지문 저장
- 가져오기 검증과 복원 확인창에서 최근 백업 기준과의 백업 지문 일치 여부와 불일치 경고 표시
- 검증된 백업의 앱 식별자, 스키마, 생성 시각, 입력 방식 요약
- 복원 성공 시 최근 백업 상태를 복원한 백업 기준으로 최신화
- 복원 완료된 동일 검증본의 반복 복원 방지
- 마지막 백업 생성 시각과 수량 요약 저장
- 마지막 백업 대비 현재 데이터 변경 감지와 백업 업데이트 필요 표시
- 마지막 백업 대비 변경된 데이터 항목 요약
- 변경 항목 요약에서 백업 즉시 갱신
- 복원 전 현재 데이터와 백업 데이터의 영향 미리보기
- 복원 시 데이터 감소와 핵심 프로필 변경 리스크 요약 및 확인창 재표시
- 검증된 백업의 복원 영향/리스크 리포트 복사와 지문/영향/리스크 요약 fallback
- Data 상단 운영 흐름은 백업, 데이터 준비도, 문서/RAG, Supabase 전환 gate를 먼저 보여주고 백업 생성과 각 상세 섹션 이동을 안전한 순서로 분리합니다.
- Data 안전 실행 순서는 `01 백업 고정`, `02 준비도 확인`, `03 실행 분리` 단계 카드로 백업 최신 여부, 데이터/runtime readiness, execute=false preflight와 execution packet 분리를 먼저 보여줍니다.
- 검증된 백업의 Supabase 테이블 매핑 미리보기와 매핑 요약 복사
- Supabase 전환 전 실행 체크리스트와 결정 필요 항목 복사
- 검증된 백업의 Supabase importer dry-run 배치/payload 복사와 row/batch/warning/deleted archive 요약 fallback
- Supabase importer dry-run의 설정/관계 참조 경고 분류와 pending ID 치환 가이드의 치환 범위/audit gate 요약 fallback
- Supabase importer 실행 후 workspace_id 범위 row 수 검증 SQL 복사와 row/table/workspace 요약 fallback
- Supabase importer 실행 후 실제 workspace_id를 반영한 검증 SQL 복사와 resolved workspace scope fallback
- Supabase importer 실행 후 관계 참조 무결성 검증 SQL 복사와 relationship check/warning 요약 fallback
- Supabase importer 실행 후 pending-* ID 잔존 audit SQL 복사와 replacement row/issue_count gate 요약 fallback
- Supabase importer 실행 후 RLS owner access 전제조건 audit SQL 복사와 owner mapping/smoke test gate 요약 fallback
- Supabase workspace_members 기반 RLS policy draft SQL 복사와 review/role/smoke test gate 요약 fallback
- Supabase RLS 인증 세션 smoke test 체크리스트 복사와 session/isolation gate 요약 fallback
- Supabase importer 실행 후 row/관계 검증 판정 리포트 복사와 acceptance gate 요약 fallback
- Supabase 마이그레이션 handoff package 일괄 복사와 section/evidence/UUID trace 요약 fallback
- Supabase importer 구현 전 `pending-*`를 실제 UUID로 치환한 import execution plan 복사와 UUID 치환/acceptance gate 요약 fallback
- Supabase server-side importer 구현용 insert adapter 계약 복사와 adapter 계약 식별/plan gate 요약 fallback
- `POST /api/data/supabase-import` server-only import plan API
- `/data`에서 `POST /api/data/supabase-import` execute=false preflight 실행과 preflight 리포트 식별/route validation 요약 fallback
- Supabase import route audit artifact 복사와 artifact 식별/route audit 요약 fallback
- Supabase import preflight와 runtime readiness 기반 실행 판정 메모 복사와 판정 식별/runtime gate 요약 fallback
- Supabase import 실행 전 manifest를 포함한 핵심 산출물을 하나로 묶은 controlled execution packet 복사와 패킷 식별/gate 요약 fallback
- Supabase import execution packet manifest로 포함 증적/대기 항목/다음 조치와 stale scope 변경 항목 확인, `waitingItems`/`copyGate` 요약 확인, manifest 복사, 다음 조치 단독 복사와 manifest/next-action 식별 요약 fallback
- Supabase import preflight scope guard로 백업 fingerprint/UUID 변경 시 재실행 안내
- Supabase migration rehearsal 리포트 복사와 리허설 식별/readiness 요약 fallback
- Supabase import 실행 후 검증 evidence record 복사와 검증 기록 식별/acceptance gate 요약 fallback
- Supabase import `execute=true` 요청 템플릿의 요청 식별/gate 요약 fallback과 실행 금지 체크리스트의 식별/차단 gate 요약 fallback 복사
- OpenAI/Supabase 운영 환경 readiness 체크리스트와 `.env.local` 템플릿 복사, readiness 체크리스트의 runtime gate/action queue 요약 fallback과 `.env.local` 템플릿의 exposure/secret guard 요약 fallback
- `/api/system/readiness` 기반 OpenAI/Supabase 런타임 설정 상태 확인
- 런타임 상태 JSON과 비밀값 없는 Markdown 진단 리포트 복사, 런타임 JSON과 진단 리포트 fallback의 확인 시각/release gate/환경 요약 포함
- 로컬 운영 가능 여부와 Supabase 전환 가능 여부를 분리한 release gate 판정
- release gate warning/block 항목의 operator action queue 표시
- operator action queue 기반 실행용 조치 계획 복사와 action queue/blocker/warning 요약 fallback
- 런타임 readiness 스냅샷 저장, 최근 상태 요약, 스냅샷 JSON 복사, 스냅샷 JSON fallback의 최근 스냅샷 식별 정보 포함
- 현재 runtime readiness와 최근 스냅샷 비교 및 비교 리포트 복사, stage/score/변수/check 변화 요약 fallback
- Data 운영 환경 readiness와 Supabase 실행 패킷의 핵심 gate 상태는 모바일 2열 요약으로 먼저 보여주고, 상세 체크리스트와 복사 액션은 그대로 분리합니다.
- Data 가져오기 검증, 복원 리포트, Supabase 매핑, 체크리스트, dry-run, pending ID 치환 요약은 모바일 2열로 먼저 보여주고 상세 테이블과 실행 gate는 별도로 유지합니다.
- Data post-import 검증 SQL, 관계 검증, pending ID audit, RLS audit/policy/smoke, 검증 리포트, migration handoff 요약은 모바일 2열로 먼저 보여주고 SQL/체크리스트/패키지 원문은 별도 preview로 유지합니다.
- Data 관리의 백업/복원 리포트/Supabase SQL/런타임 진단 복사의 clipboard fallback, 실패 상태, 수동 복사용 textarea 표시, 백업 JSON fallback의 백업 지문/생성 시각/수량 요약, 복원 리포트 fallback의 백업 지문/영향/리스크 요약, 마이그레이션 매핑/체크리스트 fallback의 상태별 count와 실행 전 gate 요약, 런타임 JSON fallback의 release gate/스냅샷 식별 요약, API preflight fallback의 식별/route validation 요약, migration rehearsal fallback의 리허설 식별/readiness 요약, 실행 판정 메모 fallback의 판정 식별/runtime gate 요약, execute 요청 템플릿 fallback의 요청 식별/gate 요약, controlled execution packet fallback의 패킷 식별/gate 요약, post-import evidence fallback의 검증 기록 식별/acceptance gate 요약 포함
- Supabase 마이그레이션 매핑과 dry-run에서 삭제 보관함 snapshot을 `deleted_prompt_assets` 이관 대상으로 포함, 매핑/체크리스트 상태 요약 fallback 제공
- Data 관리의 마이그레이션/팀 워크스페이스 확장 준비도 체크리스트
- 준비도 체크리스트의 백업 스냅샷 항목에서 즉시 백업 생성/갱신
- 모바일/데스크톱 공통 가독성을 위한 단순 네비게이션
- 공통 운영 흐름 컴포넌트는 모바일에서는 단계별 행으로 압축하고 데스크톱에서는 4단계 카드로 보여줘 같은 정보와 액션을 유지합니다.
- Profile/Company 기본 맥락 준비도는 모바일 2열로 필수 항목 상태를 압축해 보강할 항목을 빠르게 확인하게 합니다.
- Profile/Company 맥락 요약은 필수 완료, 부족 항목, 확장 기준, 복귀 위치를 모바일 2열과 데스크톱 4열로 먼저 보여줍니다.
- Profile/Company AI 적용 프리뷰는 입력한 개인/회사 기준을 GPT, Claude, Codex, Gemini에 붙일 수 있는 영어 또는 한영 하이브리드 적용 지시문으로 미리 보여주고 복사하거나 Studio 초안으로 보냅니다.
- Profile/Company AI 적용 프리뷰의 Studio 초안은 각각 `Profile로 돌아가기`, `Company로 돌아가기` 복귀 액션 라벨로 원래 기준 화면을 복원하며, 저장이 실패하면 이동하지 않고 수동 복사용 적용 프롬프트 원문을 표시합니다.
- Profile/Company AI 적용 프리뷰는 `01 기준 확인`, `02 적용 문구`, `03 Studio 전송` 단계 카드로 기준 점검, 영어/한영 하이브리드 지시문 적용, 외부 AI handoff 순서를 먼저 보여줍니다.
- 전역 헤더는 현재 섹션의 역할과 다음 행동을 함께 보여줘 기능이 많아져도 사용자가 위치와 다음 조치를 바로 파악하게 합니다.
- 전역 헤더는 주요 메뉴를 운영, 작업, 기준, 시스템 그룹으로 나눠 많은 기능도 한눈에 스캔하고 현재 섹션의 그룹 맥락을 바로 확인하게 합니다.
- 전역 헤더는 현재 그룹의 빠른 이동 줄에서 같은 흐름의 기능명과 다음 행동을 함께 보여줘 모바일에서도 다음 화면을 바로 고르게 합니다.
- 핵심 기능 흐름을 한눈에 보는 Dashboard 작업 바로가기
- Dashboard 상단 운영 흐름은 준비 상태, 첫 실행 항목, 생성 엔진, 결과 검증 순서를 한 줄로 보여주고 각 단계에서 Data, Learning, Studio, Library로 바로 이동하게 합니다.
- Dashboard 오늘의 실행 요약은 첫 실행 항목, 생성 상태, 저장 검증 위치를 첫 화면 상단에서 한 줄로 정리해 바로 이동하게 합니다.
- Dashboard 핵심 workflow는 작성, 저장, 학습, 스킬화, 연결, 백업 6단계를 상단에서 보여주고 연결 단계에서 Chrome, MCP, 외부 AI 전달 흐름으로 바로 이동하게 합니다.
- Dashboard 상단 KPI는 모바일 2열 요약과 데스크톱 8열 요약을 유지해 저장본, 품질, 학습, 스킬, 재개선 상태를 짧게 훑게 합니다.
- Dashboard 워크스페이스 데이터 상태, 백업 기준 시각, 변경 항목 요약과 Data 관리 이동
- Dashboard 상단 운영 KPI에서 Library, Learning, Skills, 재개선 후보로 바로 이동
- `OPENAI_API_KEY`가 있으면 OpenAI Responses API로 생성 품질 보강
- API 키가 없거나 호출 실패 시 로컬 프롬프트 빌더로 자동 fallback
- Studio 생성 엔진 상태 표시: OpenAI 보강 가능 여부와 로컬 fallback 모드 확인

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

기획 기준 문서는 `docs/`에 있습니다.

외부 AI 연결 운영 가이드:

- `docs/external-ai-operator-guide.md`

저장소 설계:

- `docs/storage-architecture.md`
- `docs/database-schema.sql`

UI 기준:

- 모바일에서는 주요 메뉴를 선택형 메뉴로 단순화합니다.
- 데스크톱에서는 짧은 한국어 탭으로 주요 기능을 노출합니다.
- 한 화면에는 현재 작업에 필요한 정보와 다음 행동만 우선 배치합니다.
- 기능 추가보다 읽기 순서, 버튼 위치, 복원/삭제 같은 위험 행동의 분리를 우선합니다.

개발 기준:

- Studio 초안 출처를 추가할 때는 [src/lib/prompt/types.ts](/Users/sungjin/dev/personal/prompt-ai-studio/src/lib/prompt/types.ts)의 `promptStudioDraftSources`에 source ID를 먼저 추가합니다.
- Studio 초안 variant를 추가할 때는 같은 파일의 `promptStudioDraftSourceVariants`에 variant ID를 추가하고, variant별 허용 source 규칙과 `sourceFeedback` 필요 여부는 [src/lib/studio/draft-variants.ts](/Users/sungjin/dev/personal/prompt-ai-studio/src/lib/studio/draft-variants.ts)에 둡니다. variant별 표시 예외는 [src/lib/studio/draft-display.ts](/Users/sungjin/dev/personal/prompt-ai-studio/src/lib/studio/draft-display.ts)에 둡니다.
- `sourceFeedback`은 피드백을 요구하는 유효 variant로 정규화될 때만 Studio draft와 저장 메타에 보존합니다.
- Dashboard, Learning, Library, Skills에서 Studio draft로 넘기는 `sourceHref`는 [src/lib/navigation/href.ts](/Users/sungjin/dev/personal/prompt-ai-studio/src/lib/navigation/href.ts)의 `normalizeInternalHref` 규칙을 거쳐 내부 경로만 저장합니다. Profile/Company 기준 적용 초안도 같은 규칙을 사용해 원본 기준 화면으로 돌아갑니다.
- 내부 링크를 복사용 절대 URL로 바꿀 때는 같은 파일의 `formatAbsoluteInternalHref`를 사용합니다.
- UI 컴포넌트에서 [src/lib/studio/href.ts](/Users/sungjin/dev/personal/prompt-ai-studio/src/lib/studio/href.ts)를 직접 import하면 lint가 실패합니다. 화면에서는 공용 navigation helper를 사용하고, Studio wrapper는 draft/source meta 계층에만 둡니다.
- 저장되는 `studioSource` 메타 조립, optional 필드 조건부 포함, 내부 `sourceHref`, 입력 요약, count, timestamp 정규화는 [src/lib/studio/source-meta.ts](/Users/sungjin/dev/personal/prompt-ai-studio/src/lib/studio/source-meta.ts)의 `createPromptStudioSourceMeta`에서 처리합니다.
- 같은 source ID의 화면 라벨과 다음 액션 문구는 [src/lib/studio/source-registry.ts](/Users/sungjin/dev/personal/prompt-ai-studio/src/lib/studio/source-registry.ts)의 `promptStudioSourceRegistry`에 추가합니다.
- Dashboard, Library, Studio 라벨은 registry에서 파생되므로 각 화면에 별도 문자열 목록을 만들지 않습니다.
- 화면 컴포넌트는 raw `promptStudioSourceRegistry`를 직접 읽지 않고 `getPromptStudioSourceDashboardSummary`, `getPromptStudioSourceLibraryLabel`, `getPromptStudioSourceStudioLabel` 같은 화면별 helper를 사용합니다. UI 컴포넌트에서 raw registry를 직접 import하면 lint가 실패합니다.
- source ID와 registry key가 어긋나거나 source ID/variant ID가 중복되면 [src/lib/studio/source-registry.typecheck.ts](/Users/sungjin/dev/personal/prompt-ai-studio/src/lib/studio/source-registry.typecheck.ts)가 `npm run build`의 TypeScript 단계에서 실패하게 합니다.
- 새 source를 추가한 뒤에는 `npm run lint`, `npm run build`를 실행하고, 가능하면 Library `studioSource` 필터와 Studio `draft` 로딩을 한 번씩 브라우저에서 확인합니다.

## Environment

`.env.local`:

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5-mini

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
SUPABASE_IMPORT_EXECUTION_ENABLED=false

APP_STORAGE_MODE=local
```

`OPENAI_API_KEY`가 비어 있으면 앱은 외부 API 없이 로컬 규칙 기반 생성으로 동작합니다. Studio의 생성 엔진 상태에서 현재 OpenAI 보강 가능 여부를 확인할 수 있습니다.
Supabase 변수는 아직 저장소 연결 코드가 아닌 전환 준비용입니다. `/data`의 운영 환경 readiness에서 server-only 값과 browser-public 값을 구분해 확인하고 템플릿을 복사할 수 있습니다.
`/api/system/readiness`는 실제 비밀값을 반환하지 않고 설정 여부, 생성 모드, storage mode, Supabase 전환 준비 상태만 반환합니다.
`/data`에서는 이 응답을 JSON 그대로 복사하거나, 운영 공유용 Markdown 진단 리포트로 복사할 수 있습니다.
같은 응답의 release gate는 현재 로컬 MVP 운영 가능 여부와 Supabase migration 가능 여부를 분리해 보여줍니다.
warning 또는 block 상태인 gate 항목은 `/data`에서 operator action queue로 모아 다음 조치를 확인할 수 있습니다.
`조치 계획 복사`는 이 queue만 짧은 실행 계획으로 정리해 운영자에게 전달할 수 있게 합니다.
`스냅샷 저장`은 현재 runtime readiness 결과를 브라우저에 최대 5개까지 보관해 이후 설정 변경 전후를 비교할 수 있게 합니다.
스냅샷이 있으면 `/data`에서 현재 runtime readiness와 최근 스냅샷의 stage, score, 변수 상태 변화를 비교하고 리포트로 복사할 수 있습니다.
Data 관리의 백업 JSON, 복원 리포트, Supabase 마이그레이션 SQL/체크리스트, 런타임 진단 복사는 clipboard 권한이 제한되거나 응답이 지연되는 브라우저에서도 fallback 복사를 시도하고, 그래도 실패하면 수동 복사용 textarea를 표시합니다. 백업 JSON fallback은 순수 JSON 앞에 백업 지문, 생성 시각, JSON 길이, 데이터 수량 요약을 붙여 어떤 백업인지 먼저 식별할 수 있게 합니다. 복원 리포트 fallback은 원문 리포트 앞에 백업 생성 시각, 가져온 방식, 가져온 백업 지문, 최근 백업 기준 지문, 지문 비교, 변경 항목 수, 리스크 항목 수, 데이터 수량, 복원 전 원본 백업 보관 gate를 붙여 실제 복원 전 확인 기준을 먼저 대조할 수 있게 합니다. 마이그레이션 매핑 fallback은 원문 매핑 앞에 매핑 테이블 수, ready/needs-context/future 상태 수, 예상 row 수, workspace owner gate, insert order gate, 삭제 보관함 snapshot gate, RAG 추후 테이블 gate를 붙여 이관 범위를 먼저 대조할 수 있게 합니다. 마이그레이션 체크리스트 fallback은 원문 체크리스트 앞에 준비됨/결정 필요/수동 확인 count, 백업 지문 확인 gate, service role server-side gate, schema 적용 gate, RLS 검토 gate, rollback gate를 붙여 실행 전 차단 조건을 먼저 점검할 수 있게 합니다. `.env.local` 템플릿 fallback은 템플릿 앞에 active/migration/future 변수 수, server-only 값, browser-public 값, import execution gate 기본값, storage mode guard, secret commit 금지 기준을 붙여 환경 변수 노출 기준을 먼저 대조할 수 있게 합니다. environment readiness checklist fallback은 체크리스트 앞에 active/migration/future 변수 수, 확인 시각, release gate, generation/storage/Supabase 설정 요약, missing variable 수, action queue 수, local fallback gate, app-session RLS smoke gate를 붙여 운영 환경 준비 기준을 먼저 대조할 수 있게 합니다. 런타임 상태 JSON fallback은 확인 시각, release gate, 생성 엔진, Supabase readiness, action queue를 먼저 보여주고, 런타임 진단 리포트 fallback은 리포트 앞에 확인 시각, release gate, 생성 엔진, storage mode, Supabase client/server importer/project ref, import execution gate, missing variable 수, action queue 수, secret 공유 금지 기준을 붙여 운영 공유 기준을 먼저 대조할 수 있게 합니다. 운영자 조치 계획 fallback은 계획 앞에 확인 시각, release gate, action queue/blocker/warning 수, generation/storage mode, import execution gate, runtime refresh와 secret-sharing 확인 gate를 붙여 실행 후 검증 기준을 먼저 대조할 수 있게 합니다. 스냅샷 JSON fallback은 스냅샷 수와 최근 스냅샷 ID/저장 시각/release gate를 먼저 보여줍니다. 스냅샷 비교 리포트 fallback은 원문 리포트 앞에 최근 스냅샷 ID, 저장/점검 시각, 현재 점검 시각, 이전/현재 stage, score delta, 변수 변경 수, release gate check 변경 수, 후속 진단/스냅샷 저장/secret 확인 gate를 붙여 runtime 변화 기준을 먼저 대조할 수 있게 합니다. importer dry-run fallback은 원문 dry-run 앞에 schemaVersion, total rows, insert batches, deleted archive rows, pending row IDs, setup/relationship warning 수, local-only guard, pending replacement guard, archive trace guard를 붙여 preflight 전 입력 상태를 먼저 확인할 수 있게 합니다. pending ID 치환 가이드 fallback은 가이드 앞에 schemaVersion, replacement table 수, local-to-pending row 수, deleted archive rows, dry-run warning 수, pending primary/foreign key 치환 gate, active source rewrite gate, learning source rewrite gate, archive trace 유지 gate, pending ID audit gate를 붙여 실제 UUID 치환 범위를 먼저 확인할 수 있게 합니다. row count verification SQL fallback은 SQL 앞에 workspace_id, schemaVersion, expected rows/tables, deleted archive rows, workspace scope, post-import gate를 붙여 실행 후 수량 검증 기준을 먼저 대조할 수 있게 합니다. relationship verification SQL fallback은 SQL 앞에 workspace_id, schemaVersion, relationship checks, relationship warnings, deleted archive rows, workspace scope, issue_count 0 gate, deleted_prompt_assets snapshot 허용 기준을 붙여 관계 무결성 검증 기준을 먼저 대조할 수 있게 합니다. pending ID audit SQL fallback은 SQL 앞에 workspace_id, schemaVersion, pending ID check 수, replacement table/row 수, deleted archive rows, workspace scope, issue_count 0 gate, pending-* 완전 치환 gate를 붙여 실제 Supabase UUID 치환 완료 여부를 먼저 대조할 수 있게 합니다. RLS owner access audit SQL fallback은 SQL 앞에 workspace_id, owner_user_id, schemaVersion, RLS owner access check 수, expected imported rows/batches, deleted archive rows, owner mapping gate, authenticated app-session smoke test gate를 붙여 RLS 전제조건을 먼저 대조할 수 있게 합니다. RLS policy draft SQL fallback은 SQL 앞에 schemaVersion, policy table 수, expected imported rows/batches, workspace_members 접근 기준, read/write role semantics, review/adapt gate, prerequisite audit gate, authenticated smoke test gate를 붙여 정책 적용 전 검토 기준을 먼저 대조할 수 있게 합니다. RLS smoke test checklist fallback은 체크리스트 앞에 schemaVersion, workspace/owner 식별, policy table 수, owner access check 수, expected rows/batches, required sessions, authenticated app-session-only gate, role behavior gate, cross-workspace isolation gate를 붙여 실제 세션 검증 기준을 먼저 대조할 수 있게 합니다. verification report fallback은 리포트 앞에 workspace/owner 식별, schemaVersion, expected rows, row/relationship/pending ID/RLS check 수, warning 수, issue_count 0 gate, RLS policy review gate, RLS smoke evidence gate를 붙여 실행 후 검증 판정 기준을 먼저 대조할 수 있게 합니다. migration handoff package fallback은 패키지 앞에 workspace/owner 식별, schemaVersion, expected rows/batches, handoff section 수, verification check 수, warning 수, read-order gate, audit evidence gate, RLS evidence gate, UUID trace gate를 붙여 최종 인수인계 기준을 먼저 대조할 수 있게 합니다. API preflight fallback은 리포트 앞에 확인 시각, 백업 지문, workspace/owner UUID, route status, validation, dry-run row/table 수, confirmation gate를 붙여 preflight 결과가 어떤 입력 조합 기준인지 먼저 대조할 수 있게 합니다. route audit artifact fallback은 artifact 앞에 확인 시각, 백업 지문, workspace/owner UUID, route status, execute=false preflight 모드, validation, dry-run row/table 수, confirmation gate를 붙여 route 증적 기준을 먼저 확인할 수 있게 합니다. import execution plan fallback은 계획 앞에 workspace/owner UUID, total rows, insert batches, UUID map entries, archive trace fields, unresolved pending references, pending 제거/보관함 trace/owner 매핑 acceptance gate, local-only guard, post-import audit gate를 붙여 UUID 치환 기준을 먼저 대조할 수 있게 합니다. adapter contract fallback은 계약 앞에 workspace/owner UUID, total rows, insert batches, generated UUIDs, archive trace fields, unresolved pending references, service-role server-only gate, insert order gate, post-import audit gate를 붙여 구현 기준을 먼저 검토할 수 있게 합니다. migration rehearsal fallback은 리포트 앞에 기준 시각, 백업 지문, workspace/owner UUID, preflight status, validation blocker 수, row/table 수, confirmation gate, handoff section 수를 붙여 실행 전 리허설 상태를 먼저 검토할 수 있게 합니다. 실행 판정 메모 fallback은 메모 앞에 생성 시각, 백업 지문, workspace/owner UUID, decision, preflight validation, runtime release gate, runtime blocker 수, migration/importer readiness, import execution gate를 붙여 실제 write 가능 여부를 먼저 판단할 수 있게 합니다. execute 요청 템플릿 fallback은 템플릿 앞에 백업 지문, workspace/owner UUID, `execute:true`, `confirmation: RUN_SUPABASE_IMPORT`, `includePayload:false`, server execution gate를 붙여 실제 write 요청 조건을 먼저 확인할 수 있게 합니다. 실행 금지 체크리스트 fallback은 체크리스트 앞에 백업 지문, workspace/owner UUID, preflight 일치/validation, schema 적용, service role server-only, execution gate 종료, post-import audit와 RLS smoke 준비 상태를 붙여 실행 차단 조건을 먼저 점검할 수 있게 합니다. controlled execution packet fallback은 원문 패킷 앞에 생성 시각, preflight 시각, 백업 지문, workspace/owner UUID, manifest ready/waiting, copy gate, runtime release gate, import execution gate를 붙여 긴 패킷을 수동 복사할 때 먼저 검토할 수 있게 합니다. execution packet manifest fallback은 원문 manifest 앞에 생성/preflight 시각, 백업 지문, workspace/owner UUID, manifest status/detail, ready/waiting count, copy gate, next action, 비실행/secret guard를 붙여 controlled packet 복사 전 상태를 먼저 대조할 수 있게 합니다. execution packet next-action fallback은 원문 메모 앞에 생성/preflight 시각, 백업 지문, workspace/owner UUID, manifest status, ready/waiting count, copy gate, waiting item, next action, 재복사 gate를 붙여 현재 차단 항목을 먼저 확인할 수 있게 합니다. post-import evidence fallback은 검증 기록지 앞에 기준 시각, 백업 지문, workspace/owner UUID, 예상 row/table 수, relationship/pending ID/RLS acceptance gate 수를 붙여 실행 후 증적 묶음을 먼저 대조할 수 있게 합니다.
Supabase 목표 스키마와 dry-run은 삭제 보관함을 `deleted_prompt_assets`로 분리해 `prompt_snapshot` JSON과 삭제 시각을 보존합니다. 따라서 active Library에서 제거된 원본도 마이그레이션 후 복원/추적 판단에 사용할 수 있습니다.
Supabase dry-run payload는 active 프롬프트/버전/피드백/profile/company 참조를 `pending-*` import ID로 치환해, 실제 importer에서 같은 위치를 Supabase UUID로 바꿔야 하는 지점을 명확히 보여줍니다. 삭제 보관함 원본 참조는 `deleted_prompt_assets.original_prompt_asset_id`와 snapshot 버전 ID로 검증합니다.
Supabase verification report와 migration handoff package는 pending ID replacement guide를 포함해 local ID, dry-run ID, 실제 UUID 치환 대상, 삭제 보관함 trace ID 유지 기준을 함께 전달합니다.
`Import execution plan`은 입력한 실제 workspace/owner UUID와 새 UUID 맵을 기준으로 `pending-*`가 제거된 insert payload 초안을 복사합니다. 이 기능은 Supabase에 연결하거나 데이터를 쓰지 않으며, 이후 server-side importer 구현의 변환 기준으로 사용합니다.
`Adapter 계약 복사`는 실제 server-side importer가 구현해야 할 `insertRows` 인터페이스와 테이블 삽입 순서를 Markdown으로 내보냅니다. 실제 DB 쓰기는 browser client가 아니라 service-role server context에서만 연결해야 합니다.
`POST /api/data/supabase-import`는 같은 변환을 서버 Route Handler에서 실행해 dry-run 요약, validation, insert order, adapter contract를 반환합니다. `execute=true`로 실제 Supabase REST insert를 실행하려면 서버 환경에서 `SUPABASE_IMPORT_EXECUTION_ENABLED=true`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`가 설정되어 있고 요청 본문에 `confirmation: "RUN_SUPABASE_IMPORT"`가 있어야 하며 execution plan validation이 `ok`여야 합니다. 이 조건 중 하나라도 빠지면 route는 write를 차단합니다.
`API preflight`는 `/data`에서 검증된 백업과 workspace/owner UUID를 server route에 `execute:false`로 보내 route-level validation, insert order, confirmation gate를 확인합니다. 결과는 화면 table, 대기 항목과 다음 조치 및 stale scope 변경 항목을 포함한 execution packet manifest, 다음 조치 단독 메모, route audit artifact, Markdown preflight 리포트, runtime readiness를 합친 실행 판정 메모, manifest를 포함한 controlled execution packet, migration rehearsal 리포트, 실행 후 검증 evidence record로 확인할 수 있으며, 이 버튼은 실제 DB write를 실행하지 않습니다.
execution packet manifest와 다음 조치 메모의 `waitingItems`는 아직 해결되지 않은 manifest 항목 수를 나타내고, `copyGate`는 `resolve waiting items` 또는 `operator review required`로 controlled packet 복사 전 상태를 표시합니다. `/data` 화면은 같은 값을 한국어 운영 문구로 보여줘 대기 항목 해결 단계인지 operator review 단계인지 먼저 판단할 수 있게 합니다.
preflight 결과는 실행 당시 백업 fingerprint, workspace_id, owner_user_id에 묶입니다. 이후 백업 JSON이나 UUID가 바뀌면 stale 상태로 표시하고 관련 복사 액션을 막아 같은 조합으로 preflight를 다시 실행하게 합니다.
`실행 템플릿`과 `금지 체크리스트`는 실제 `execute:true` 요청을 서버 운영 환경에서 실행하기 전에 필요한 JSON 형태와 차단 조건을 복사합니다. 화면에서는 실행하지 않고, preflight 통과와 gate 확인을 전제로 한 운영 산출물만 제공합니다.

Studio의 생성 결과 패널은 품질 점수의 낮은 항목을 우선순위로 해석해 개선 액션을 보여주고, `품질 리포트 복사`로 점수 breakdown, 가정, 부족한 정보를 Markdown으로 내보낼 수 있습니다. Studio 생성 결과 액션은 `검토`, `AI 전달`, `저장` 흐름으로 나뉘며 현재 버전/품질 리포트 복사, AI 전달 패키지 복사/보기, Library 저장을 같은 fallback 정책으로 제공합니다. 결과 실행 순서 요약은 각 단계의 현재 상태, 다음 확인 항목, 바로 실행할 다음 행동을 먼저 보여주고, 각 액션 묶음은 현재 품질 진단, AI 전달 상태, 저장 상태를 짧은 배지와 판단 문구로 버튼 위에 표시해 사용자가 복사, 전달, 저장 순서를 바로 고르게 합니다. Studio 생성 결과 액션 묶음은 `01 검토`, `02 AI 전달`, `03 저장` 단계 번호를 함께 보여줘 버튼 영역만 봐도 실행 순서를 알 수 있게 합니다. AI 전달이 차단 상태이면 `AI 전달` 액션 묶음 안에서도 `보강 브리프 적용`을 먼저 제공해 패키지 복사보다 재생성 루프를 우선 실행하게 합니다. Studio 생성 결과의 `전달 전 검토 큐`는 차단, 검토, 전달 가능 항목 순서로 상위 3개를 보여주고 각 항목의 다음 행동을 복사 전에 확인하게 합니다. AI 전달 패키지 미리보기는 품질, 전달 상태, 현재 보기, 복사 대상을 모바일 2열과 데스크톱 4열 지표로 먼저 보여주고 전체 패키지와 실행 프롬프트 원문은 별도 preview로 유지합니다. 생성 결과를 저장하면 `Library에서 보기`로 저장된 프롬프트 상세와 현재 활성 버전을 바로 열어 버전 비교, 피드백 저장, 재개선 브리프로 이어갈 수 있고, `Library 링크 복사`로 같은 상세 링크와 저장 운영 메타를 외부 리뷰나 팀 공유에 전달할 수 있습니다. Library 상세의 `프롬프트 삭제`는 내부 확인 패널에서 저장 버전, 피드백, 연결된 개선본 수를 보여준 뒤 최종 삭제를 실행해 테스트 저장본이나 불필요한 항목을 안전하게 정리하고, 삭제 항목을 로컬 보관함의 `최근 삭제 항목`에 남겨 Library 목록에서 다시 복원할 수 있습니다. 보관함은 최근 항목을 먼저 보여주고 `전체 보기`와 검색으로 오래된 삭제 항목도 찾을 수 있습니다. 삭제된 원본을 참조하는 개선본은 개선 출처 카드에서 원본이 보관함에 있음을 표시하고 `원본 복원`으로 추적 체인을 회복할 수 있습니다. Dashboard의 개선 효과 분석도 삭제 보관함 원본과 원본 누락 미측정 개선본을 포함해 평균 개선폭, 재개선 후보, 피드백 반영 개선본을 계산하고, `보관함 원본` 지표에서 해당 개선본만 Library 필터로 열 수 있습니다. 해당 필터가 비어 있으면 Library는 전용 빈 상태에서 최근 삭제 항목 열기와 필터 초기화를 제공해 복원 흐름을 안내합니다. Library 최근 피드백의 `이 피드백으로 Studio 개선`은 해당 점수, 유형, 코멘트를 개선 브리프에 포함해 표준 `프롬프트 개선` 목표의 피드백 개선 초안으로 재작업을 바로 시작하며, Studio 저장 출처 카드에서 반영 피드백 요약을 별도로 표시하고 `Library 피드백으로 돌아가기`로 원본 피드백 카드에 복귀합니다. 저장된 피드백 기반 개선본도 Library 상세의 개선 출처 카드에 반영 피드백을 보존하고 `원본 피드백 보기`로 추적할 수 있으며, Dashboard의 `피드백 반영 개선본` 큐에서 피드백 개선본 수, 평균 개선폭, 재검토 필요, 보관함 원본 지표와 우선 점검 항목, 최근 반영 코멘트, AI 도구, 점수 변화, 생성일, 개선본/원본 피드백 링크를 함께 확인하고 `피드백 개선 리포트 복사` 또는 `리포트 Studio로 보내기`로 반복 피드백을 개선 계획으로 전환할 수 있습니다. 우선 점검 항목은 `우선 리포트 복사`와 `우선 계획 Studio로`로 단일 개선본의 원본 상태, 피드백, 점수 변화, 다음 조치만 따로 실행 패키지로 만들 수 있고, `우선 메모리 저장`으로 해당 피드백 규칙만 Learning memory에 저장한 뒤 저장된 메모리 제목, scope, 신뢰도를 패널에서 확인하고 `우선 메모리 확인`으로 feedback-improvement 필터를 바로 열 수 있습니다. 피드백 개선 리포트와 Studio 개선 계획 초안은 개선본 상세, 원본 피드백, 보관함 원본, 측정 불가 필터를 절대 URL로 포함합니다. `반영 피드백 메모리 저장`은 같은 코멘트를 Learning memory 규칙으로 축적해 다음 Studio 생성 컨텍스트에 반영하고, 저장 후 `Learning에서 확인`으로 feedback-improvement 메모리 필터를 바로 엽니다. `Skill로 전환`은 `/skills?prompt=...`로 이동해 저장된 프롬프트를 스킬 템플릿 후보로 바로 불러오고, `Skill 링크 복사`는 같은 저장 운영 메타와 함께 스킬 전환 경로를 공유합니다. Skills는 불러온 원본 Library 프롬프트의 제목, 버전, 품질, 피드백 수를 표시하고 Library 원본 복귀/링크 복사를 제공하며, 스킬 저장 후 `실행 예시 채우기`로 샘플 실행 입력을 넣어 실행 프롬프트를 바로 검증할 수 있습니다. Skills 운영 흐름은 원본 확인, 템플릿 정리, 실행 저장, 운영 개선을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 합니다. 실행 프롬프트를 Library에 저장하면 `Library 실행 보기`와 `실행 링크 복사`로 저장된 실행 결과를 바로 추적할 수 있고, 스킬별 실행 이력의 `Library 보기`로 과거 실행 상세와 피드백 화면도 바로 열 수 있습니다. Skills 운영 요약은 Library에 저장된 실행 프롬프트를 기준으로 전체 실행 수, 실행된 스킬 수, 피드백 수, 최근 실행, 반복 사용 상위 스킬, 개선 필요 큐를 집계합니다. Dashboard의 스킬 실행 현황은 같은 실행 데이터를 요약하고, 최근 실행은 Library 상세로, 반복 사용 상위 스킬과 개선 대기 스킬은 `/skills?skill=...`로 해당 스킬 편집 화면을 바로 엽니다. `스킬 운영 리포트 복사`는 실행 수, 최근 실행 Library 링크, 상위 스킬 Skills 링크, 개선 필요 큐 Skills 링크를 절대 URL이 포함된 Markdown으로 내보내고, `리포트 Studio로 보내기`는 같은 내용을 `skills-operational-summary` 저장 출처의 스킬 운영 개선 계획 초안으로 엽니다. Studio와 Skills 복사 액션은 clipboard 권한이 제한된 브라우저에서도 fallback 복사를 시도하고, 그래도 실패하면 버튼 실패 상태와 수동 복사용 textarea를 표시합니다.
`측정 불가` 개선 필터가 비어 있으면 Library는 원본이 active 목록과 삭제 보관함 어디에도 없는 경우에만 이 필터가 채워진다는 안내와 필터 초기화 액션을 제공합니다.
Dashboard는 개선 효과 패널의 `Studio 저장 방식` 요약에서 전체 Library 또는 개선 체인, 운영 출처, Studio 출처 없음 count를 바로 보고 해당 Library 필터로 이동하거나 조건 링크를 절대 URL로 복사할 수 있게 합니다. Studio 출처 없음 설명은 저장 출처 메타 없음 항목의 유지 또는 재저장 기준 점검으로 안내합니다. Dashboard의 Studio 저장 방식 패널은 저장 출처 메타 없음 큐를 별도 링크로 노출해 직접 저장본 유지와 추적 가능한 Studio 흐름 재저장 대상을 빠르게 나누게 합니다. 같은 큐 카드의 `큐 링크 복사` 액션은 Library 큐 조건 링크를 절대 URL로 복사하고, `큐 프롬프트 복사` 액션은 절대 URL 큐 링크를 포함한 운영 프롬프트를 바로 복사하며, `큐 운영 기준 Studio로` 액션은 Library 필터를 거치지 않고 절대 URL 큐 링크를 포함한 `library-missing-source-metadata-queue` 초안으로 바로 전환해 큐 운영 기준을 작성하게 합니다. Library는 이 조건을 `저장 출처 메타 없음 큐` 조치 패널, 큐 링크 복사, 큐 리포트, 저장 출처 메타 없음 후보 메모로 받아 같은 이름의 운영 흐름을 유지합니다. 큐 리포트와 후보 메모를 Studio로 보내 저장한 결과는 `library-missing-source-metadata-queue`, `library-missing-source-metadata-candidate` source로 분리되어 일반 저장 방식 리포트/후보와 별도로 추적됩니다. 같은 영역의 `Studio 저장 출처` breakdown은 Dashboard, Library, Learning, Skills에서 넘어온 실제 Studio 초안 출처 상위 항목을 보여주고 sourceVariant 세부 유형 count도 함께 표시하며, 세부 유형 count는 `studioVariant` Library 필터 링크로 바로 열거나 절대 URL로 복사할 수 있습니다. 전체 Studio 저장 출처 필터나 각 항목도 `studioSource` Library 필터로 바로 열거나 필터 링크를 절대 URL로 복사합니다. `Studio로` 액션은 저장 출처별 저장 방식, 저장 출처 메타 없음 큐, 다음 확인 액션, 세부 유형, Library 필터 링크를 포함한 운영 리포트를 Studio 초안으로 전환합니다. 이 초안으로 저장한 결과는 `dashboard-studio-source-ops` Studio source로 보존되어 Dashboard와 Library의 저장 출처 breakdown에서 별도 추적됩니다. 같은 패널의 `출처 상태 조치`에서는 보관함 원본과 측정 불가 개선본을 바로 Library 필터로 열거나 조건 링크를 복사하고, 원본 누락/버전 누락 같은 사유별 count를 클릭해 `sourceReason` Library 필터로 좁히거나 링크를 복사한 뒤 Library 목록/상세의 출처 사유 배지와 필터 결과 대표 후보, 후보 상세 링크 복사, `조치 리포트 복사`/`Studio로 보내기`로 상태를 확인할 수 있게 합니다. 조치 리포트와 Studio 초안에는 보관함 원본/측정 불가 요약 링크, 사유별 필터 링크, 대표 후보 상세 링크를 절대 URL로 포함해 외부 AI나 팀 문서에 붙여넣어도 바로 열 수 있습니다. 후보별 `메모 복사` 또는 `Studio` 전송으로 후보 1개의 세부 복원 계획을 만들 수 있고, 이 후보 메모도 상세 링크를 절대 URL로 보존합니다. 이 후보 초안은 저장 시 개선 체인이 아니라 Studio 저장 출처 정보로만 보존해 개선 효과 분석을 오염시키지 않으며, Studio와 Library 목록/상세는 저장 방식을 `개선 체인`, `운영 출처`, `Studio 출처 없음`으로 표시합니다. Studio는 불러온 초안 패널에서 저장 방식과 `Studio 저장 출처`를 함께 보여줘 저장 전에 추적 방식과 기능 흐름을 확인하게 합니다. Library의 `Studio 저장 방식` 필터는 개선 체인, 운영 출처, Studio 출처 없음 항목을 URL 공유 가능한 조건으로 좁혀 보고, `Studio 저장 출처` 필터는 실제 Studio 초안 출처를 URL 조건으로 더 좁혀 봅니다. Library 목록 카드와 상세의 Studio 저장 출처 카드는 `sourceVariant`가 있으면 완료 확인, 피드백 개선, AI 전달 보강처럼 세부 초안 유형까지 반영한 라벨로 표시합니다. Library의 Studio 저장 출처 리포트, 운영 묶음 리포트, 저장 출처 후보 메모도 sourceVariant가 있으면 `세부 초안 유형`을 포함합니다. Library 목록 카드와 상세의 Studio 저장 출처 카드에서도 같은 저장 출처와 같은 저장 방식 필터로 바로 이동할 수 있고, sourceVariant가 있는 저장본은 같은 세부 유형 출처/묶음 조건 링크로 표시하고 절대 URL 복사 문구도 세부 유형 기준으로 구분합니다. 저장 출처 메타가 없는 저장본도 목록/상세에서 `저장 출처 메타 없음`과 점검 기준을 확인한 뒤 `저장 출처 없음 메모 복사`, `Studio로 보내기`, 또는 같은 저장 방식 필터로 모아 볼 수 있습니다. 선택 시 저장 방식 리포트와 저장 출처 리포트, 대표 후보, 후보별 `메모 복사`/`Studio` 전송을 제공해 운영자가 저장 출처 메타 상태와 기능 흐름별 저장 목적을 바로 점검하거나 Studio 초안으로 이어갈 수 있게 합니다. 저장 출처 리포트/후보와 저장 출처 없음 메모는 저장 방식 리포트와 별도 Studio source로 저장되어 Dashboard와 Library의 저장 출처 breakdown에서도 분리됩니다. 전체 `조치 계획 복사`/`Studio로 보내기`는 복원/원본 연결 확인 순서를 Markdown 실행 계획이나 Studio 초안으로 전환합니다. 이 실행 계획에는 사유별 breakdown, 대표 후보 프롬프트 제목, 원본 상태, 상세 링크를 함께 포함해 운영자가 먼저 확인할 항목을 바로 찾을 수 있습니다. 피드백 개선 리포트와 Studio 개선 계획 초안에도 같은 수치와 필터 링크를 포함해 복원/출처 확인을 품질 판단보다 먼저 처리할 수 있게 합니다.
Library의 Studio 저장 방식 필터, Studio 저장 출처 필터, 운영 묶음 패널도 sourceVariant 세부 초안 유형 count를 표시하고 각 세부 유형 필터 링크를 열거나 절대 URL로 복사할 수 있으며, 대표 후보 카드에는 후보별 세부 유형을 함께 보여줘 현재 필터 결과의 세부 흐름 분포를 바로 확인하게 합니다. Library 목록 카드에서도 원본 경로를 절대 URL로 복사하거나 원본 화면으로 바로 열 수 있고, 복사 fallback에는 프롬프트 제목, 저장 출처, 출처 제목, 원본 경로를 포함합니다. Library 상세의 Studio 저장 출처 카드와 선택 운영 요약의 같은 저장 방식/저장 출처/운영 묶음 조건 링크는 복사 fallback에 프롬프트 제목, 저장 방식, 저장 출처, 출처 제목, 세부 초안 유형, 조건명을 포함합니다. Library 상세의 Studio 저장 출처 카드는 원본 경로를 절대 URL로 복사하고 원본 화면으로 바로 돌아가는 액션을 더 자세한 저장 출처 정보와 함께 제공하며, 복사 fallback에도 같은 출처 제목 메타를 포함합니다. 이를 통해 Skills 개선 계획 같은 운영 초안의 원래 맥락을 외부 리뷰에도 공유할 수 있습니다. 선택 운영 요약 리포트에도 원본 경로와 원본 화면 복귀 링크를 포함해 요약만 복사해도 원래 작업 화면을 추적할 수 있습니다. 세부 초안 유형 필터는 `studioVariant` URL 조건으로 공유할 수 있어 완료 확인, 피드백 개선, AI 전달 보강 저장본만 따로 좁혀볼 수 있습니다.
Library 선택 운영 요약 리포트와 AI 전달 보강 브리프의 Studio 초안은 `Library 운영 요약으로 돌아가기`, `Library 원본으로 돌아가기` 복귀 액션 라벨로 선택 상세를 복원하며, 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시합니다.
Library Studio 저장 방식, 저장 출처, 운영 묶음 리포트와 각 대표 후보의 Studio 초안은 `Library 필터로 돌아가기`, `Library 후보로 돌아가기`, `Library 운영 묶음으로 돌아가기` 복귀 액션 라벨로 해당 조건이나 후보를 복원하며, 저장이 실패하면 이동하지 않고 해당 조치 패널의 수동 복사용 원문 textarea를 표시합니다.
Library 상세의 학습 컨텍스트, 저장 출처 없음 메모, 개선/피드백/비교 개선 초안은 `Library 학습 증거로 돌아가기`, `원본 저장본으로 돌아가기`, `Library 원본으로 돌아가기`, `Library 피드백으로 돌아가기` 복귀 액션 라벨로 선택 상세를 복원하며, 저장이 실패하면 이동하지 않고 선택 상세의 수동 복사용 원문 textarea를 표시합니다.
Library 출처 사유 조치 리포트와 대표 후보 메모의 Studio 초안은 `Library 필터로 돌아가기`, `Library 후보로 돌아가기` 복귀 액션 라벨로 출처 사유 조건이나 대표 후보를 복원하며, 저장이 실패하면 이동하지 않고 출처 사유 조치 패널의 수동 복사용 원문 textarea를 표시합니다.
Library 계열 Studio 초안은 `Library 원본으로 돌아가기`, `Library 피드백으로 돌아가기`, `Library 운영 요약으로 돌아가기`, `Library 필터로 돌아가기`, `Library 후보로 돌아가기`, `Library 운영 묶음으로 돌아가기`, `Library 큐로 돌아가기`, `원본 저장본으로 돌아가기`, `Library 학습 증거로 돌아가기` 복귀 액션 라벨로 원래 Library 조건이나 상세를 복원합니다.
Library의 출처 사유 조치 패널도 같은 기준으로 대표 후보를 상세 화면으로 바로 열거나 후보 상세 링크를 절대 URL로 복사할 수 있고, 조치 리포트와 후보 메모의 필터/상세 링크는 공통 절대 URL formatter를 통해 생성됩니다.
품질 점수는 한영 섹션 구조를 인식하되, 회사명/제품/고객군 같은 핵심 맥락이 `미지정`이면 맥락 점수를 제한해 구조만 좋은 프롬프트가 과대평가되지 않게 합니다.
부족한 정보가 있으면 Studio의 `추가 정보`에서 회사 정보 보강 화면으로 이동하거나, `보강 질문 복사`로 회사/고객/분야 맥락을 채우기 위한 질문 목록을 복사할 수 있습니다.
회사 기준 화면은 회사명, 설명, 제품/서비스, 고객군, 브랜드 톤의 기본 맥락 완성도를 보여주고, 부족한 항목별 질문 복사와 Studio 복귀 액션을 제공합니다. 회사 맥락 질문 복사는 clipboard 권한이 제한된 브라우저에서도 fallback 복사를 시도하고, 그래도 실패하면 버튼 실패 상태와 수동 복사용 textarea를 표시합니다.
`회사 기준 저장`은 현재 회사 프로필을 company scope 학습 메모리로 upsert해 `/learning`에서 확인하고 다음 프롬프트 생성 컨텍스트에도 반영합니다.
Learning 화면은 전체 메모리, scope 커버리지, 높은/낮은 신뢰도 메모리, 최근 업데이트를 기준으로 학습 준비도를 계산하고 다음 보강 액션을 보여줍니다. 피드백 개선 규칙 메모리는 `근거 개선본`과 `원본 피드백` 링크를 카드에서 바로 열 수 있어 저장된 학습 기준의 출처를 역추적할 수 있습니다. Studio와 Skills 생성 컨텍스트, Learning의 `Studio로 보내기` 초안에는 이 추적 링크를 제외한 규칙 본문만 반영해 외부 AI 지시문이 불필요한 내부 URL로 오염되지 않게 합니다.
`운영 리포트 복사`는 학습 준비도, covered/missing scope, 신뢰도 분포, 다음 액션을 Markdown으로 내보냅니다. `준비도 Studio로 보내기`는 같은 리포트를 학습 메모리 운영 보강 계획 초안으로 열고 `learning-readiness` 저장 출처로 추적하며, 저장 출처 원본 경로는 `/learning#readiness`로 준비도 패널에 바로 복귀합니다.
Learning의 scope 배지와 범위, 검토 기준, 정렬, 검색 필터는 `/learning?scope=company&review=low-confidence&sort=confidence-asc&q=tone`처럼 URL을 갱신해 사용자/회사/분야/스킬 메모리 점검 링크를 공유할 수 있게 합니다. Learning 운영 흐름은 준비도 점검, 낮은 신뢰도 검토, 수동 메모리 보강, 현재 조건 Studio 전송을 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 합니다. Learning 상단 다음 학습 액션은 첫 학습, 낮은 신뢰도 검토, 비어 있는 scope 보강, 피드백 개선 큐, Studio 적용 확인 중 현재 우선순위를 골라 바로가기 2개와 함께 보여줍니다. `현재 조건 링크 복사`로 운영자가 보고 있는 학습 점검 조건을 바로 복사할 수 있고, `필터 결과 복사`로 현재 목록의 조건과 메모리를 Markdown으로 내보낼 수 있으며, 각 카드의 `메모리 복사`로 단일 학습 기준만 Markdown으로 내보낼 수 있습니다. feedback-improvement 검색 조건에서는 피드백 개선 메모리 큐를 표시해 현재 큐 수, 낮은 신뢰도, 포함 scope를 확인하고 `01 검토`, `02 Studio`, `03 기록` 단계 카드로 낮은 신뢰도 확인, Studio 검증 초안 전송, 큐 리포트/검증 저장본 기록과 release gate 확인 순서를 먼저 보여준 뒤 상세 액션을 `검토`, `Studio`, `기록` 흐름으로 나눠 보여줍니다. `검토`는 `낮은 신뢰도만 보기`, `낮은 신뢰도 링크 복사`, `큐 조건 링크 복사`를 제공하고, `Studio`는 `낮은 신뢰도 Studio로`와 `큐 Studio로 보내기`를 제공하며, `기록`은 `큐 리포트 복사`, `검증 저장본 보기`, `Release gate 복사`, `Dashboard로 돌아가기`를 제공합니다. `낮은 신뢰도 Studio로`는 현재 큐의 낮은 신뢰도 메모리만 `learning-feedback-improvement` 초안으로 보내 추가 근거 수집, 충돌 규칙 분리, 재저장 계획을 먼저 작성하게 하며, 전용 초안은 `learning-low-confidence-validation` sourceVariant로 저장되어 Library의 세부 초안 유형 필터에서 전체 큐 개선 초안과 구분되고 검증 질문, 병합/재작성/삭제 판단, 검증 후 저장할 Learning memory 후보를 요구합니다. `검증 저장본 보기`와 큐 리포트의 저신뢰도 검증 저장본 링크는 `/library?studioSource=learning-feedback-improvement&studioVariant=learning-low-confidence-validation` 조건으로 저장된 검증 결과만 바로 엽니다. `큐 리포트 복사`는 일반 필터 결과가 아니라 조건 링크, 낮은 신뢰도 큐 링크, 저신뢰도 검증 저장본 링크, 큐 지표, 운영 액션, release evidence와 release-candidate 명령, 메모리 목록을 포함한 피드백 개선 메모리 큐 리포트를 만듭니다. 큐 리포트나 큐 조건 링크, 낮은 신뢰도 링크, release gate 명령 복사가 실패하면 큐 패널 안에 수동 복사용 textarea를 표시해 현재 작업 맥락을 유지합니다. 이 큐에서 Studio로 보낸 초안은 `learning-feedback-improvement` 저장 출처로 추적되어 Studio와 Library에서 일반 Learning 필터 초안과 구분되며, 반복 피드백을 재사용 가능한 프롬프트 품질 규칙, 추가 검증이 필요한 규칙, GPT/Claude/Codex/Gemini handoff 체크리스트로 변환하도록 지시합니다. Learning 복사 액션은 clipboard 권한이 제한된 브라우저에서도 fallback 복사를 시도하고, 그래도 실패하면 버튼 실패 상태와 수동 복사용 textarea를 표시합니다. `Studio로 보내기`는 해당 메모리를 반영한 Studio 초안을 열고, `필터 결과 Studio로 보내기`는 현재 조건의 메모리 묶음을 반영한 Studio 초안을 열어 새 프롬프트 작성으로 이어줍니다. Studio 저장 출처 카드의 필터 결과 제목은 scope, 검색어, 정렬, 결과 수를 함께 표시해 어떤 Learning 조건을 불러왔는지 바로 확인하게 합니다. `조건 초기화`로 기본 점검 상태로 돌아갈 수 있고, 높은/낮은 신뢰도와 최근 업데이트 지표는 클릭하면 해당 점검 조건으로 목록을 즉시 전환합니다.
Learning 목록은 낮은 신뢰도, 수동 메모리, 자동 생성 메모리 기준으로 좁혀볼 수 있고 신뢰도/업데이트 시각 기준으로 정렬해 보강 대상을 빠르게 찾을 수 있습니다.
Learning의 `수동 메모리 추가`는 피드백을 기다리지 않고 회사 기준, 개인 선호, 분야 규칙, 스킬 패턴을 직접 저장해 다음 Studio 생성 컨텍스트에 반영할 수 있게 합니다. `manual` 메모리는 목록에서 수정하거나 삭제할 수 있어 잘못 입력한 학습 기준을 정리할 수 있으며, 같은 scope에 같은 내용을 반복 저장하지 못하게 막습니다.
Dashboard의 `학습 컨텍스트 사용` 패널은 scope별 저장 프롬프트와 학습 메모리 수를 함께 보여주고, Library 필터와 Learning scope 점검 링크를 분리해 제공합니다.
Dashboard의 `개인화 보강 큐`는 개인 프로필 완성도, 회사 기준 완성도, user/company 학습 메모리, 학습 메타 보존 프롬프트 상태를 기준으로 다음 보강 액션을 우선순위로 보여주고, 각 조치를 Markdown으로 복사하거나 Studio 실행 계획 초안으로 보낼 수 있게 합니다.
Dashboard의 `다음 실행 큐`는 개인화 보강 큐와 Learning 권장 조치 큐를 합쳐 High/Med/Low 우선순위로 정렬하고 우선순위별 개수, 개인화/학습 개수, 첫 실행 항목, 완료 확인 체크리스트를 보여주며, `01 첫 실행`, `02 실행 계획`, `03 완료 확인` 단계 카드로 우선 항목 처리, 큐 실행 계획, 완료 증거 확인 순서를 먼저 보여줍니다. 완료 확인 체크리스트만 별도 Markdown으로 복사하거나 Studio 완료 확인 계획 초안으로 보낼 수 있게 합니다. 첫 실행 항목을 바로 열거나 절대 URL 링크로 복사하거나 Studio 실행 계획 초안으로 보내거나 단일 조치 리포트로 복사할 수 있고, 각 항목도 원본 화면으로 바로 열거나 조건 링크를 절대 URL로 복사하거나 Studio 실행 계획 초안으로 보내거나 단일 조치 리포트로 복사할 수 있습니다. `큐 링크 목록 복사`는 전체 큐의 절대 URL만 가볍게 내보내고, `큐 리포트 복사`와 `큐 Studio로 보내기`는 통합 큐 전체를 절대 URL 링크, High/Med/Low 개수, 개인화/학습 개수, 첫 실행 항목, 첫 실행 절대 URL, 완료 후 검증 체크리스트가 포함된 하나의 실행 계획 입력으로 전환합니다. `완료 확인 Studio로`는 같은 체크리스트와 큐 리포트를 검증 계획 입력으로 전환하고 `dashboard-next-action-queue-verification` sourceVariant로 저장해 실행 계획 초안과 구분합니다. 큐 안에서 실행한 링크/리포트/완료 확인 복사가 clipboard 제한으로 실패하면 같은 큐 패널 하단에 수동 복사용 Markdown textarea를 표시합니다.
Dashboard의 `개인화 기준 리포트 복사`는 개인 프로필, 회사 프로필, 학습 scope coverage, 다음 보강 액션을 절대 URL 링크가 포함된 Markdown으로 내보내 외부 AI 도구나 운영 리뷰에 전달할 수 있게 합니다. `리포트 Studio로 보내기`는 같은 리포트를 개인화 기준 개선 계획 초안으로 열어 프로필 보강, 메모리 후보, 측정 체크를 바로 설계할 수 있게 합니다. 이 복사 액션도 clipboard fallback과 수동 복사용 textarea를 제공합니다.
Dashboard의 Learning 운영 점검 큐는 낮은 신뢰도, 수동 메모리, 최근 업데이트 기준의 Learning 필터 화면으로 바로 이동하게 합니다. 권장 조치 큐는 낮은 신뢰도, 비어 있는 scope, 학습 메타 미기록 프롬프트, 수동 메모리 정합성을 우선순위로 정리합니다. 각 권장 조치의 `조치 복사`는 해당 조치만 절대 URL 링크가 포함된 Markdown 리포트로 내보내고, `조치 Studio로 보내기`는 해당 조치만 실행 계획 프롬프트 초안으로 열어 작은 단위로 보강 작업을 시작하게 합니다. `학습 운영 리포트 복사`는 전체 학습 메모리, 학습 메타 보존 프롬프트, 운영 점검 큐, 권장 조치 큐, scope별 현황을 절대 URL 링크가 포함된 Markdown으로 내보냅니다. Dashboard 복사 액션은 clipboard 권한이 제한된 브라우저에서도 fallback 복사를 시도하고, 그래도 실패하면 수동 복사용 Markdown textarea와 실패 상태를 표시합니다. `리포트 Studio로 보내기`는 같은 리포트를 학습 운영 개선 계획 프롬프트 초안으로 열어 메모리 정리, 보강 후보, 측정 체크를 바로 설계할 수 있게 합니다.
Dashboard의 스킬 운영, 피드백 반영 개선, Studio 저장 출처, 저장 출처 메타 없음 큐, 개선 출처 상태 Studio 초안은 `Dashboard로 돌아가기` 복귀 액션 라벨로 Dashboard 맥락을 복원하고, 개선 출처 후보 초안은 `Library 후보로 돌아가기` 복귀 액션 라벨로 대표 후보를 복원하며, 저장이 실패하면 이동하지 않고 해당 패널의 수동 복사용 원문 textarea를 표시합니다.
Studio 원문 입력 패널은 `생성 준비` 요약에서 입력 분석 상태, 100점 점수, 남은 보강 질문 수, 입력 길이, 목표/분야, 자동 언어 판단, 대상 AI, 적용 학습 메모리, 저장 예정 흐름을 생성 전에 보여줍니다.
Studio 생성 준비 요약은 모바일 2열과 데스크톱 4열로 입력 준비도, 생성 기준, 학습 반영, 저장 예정 상태를 짧게 훑게 합니다.
Studio 생성 준비 요약의 상단 배지와 첫 번째 준비 항목은 생성 운영 흐름, 입력 분석 배지, 다음 실행 입력 품질 지표와 같은 입력 준비도 라벨을 사용합니다.
Studio 입력 분석 프리플라이트는 목적, 맥락, 제약, 출력 형식 준비도를 100점 기준과 모바일 2열 체크로 보여주고 부족 항목은 보강 질문으로 제안합니다.
Studio 입력 분석 리포트는 clipboard fallback과 수동 복사용 textarea를 제공하고, 보강 질문을 원문에 추가해 생성 전 입력을 바로 다듬을 수 있게 합니다.
Studio 생성 운영 흐름은 원문 입력, AI 판단, 학습 컨텍스트, 생성 실행 위치를 상단에서 같은 순서로 보여주고 각 상세 섹션으로 바로 이동하게 합니다.
Studio 생성 운영 흐름의 입력 단계는 입력 분석 상태와 100점 점수를 먼저 보여주고, 세부 줄 수와 목표/분야는 상세 설명으로 보존합니다.
Studio 다음 실행 요약은 입력 품질, 상태, 프롬프트 언어, 대상 AI, 학습 증거를 모바일 2열과 데스크톱 5열로 생성 버튼 앞에서 다시 확인하게 합니다.
Studio 다음 실행 요약은 `입력 보강`, `생성 실행`, `저장 추적` 체크를 함께 보여줘 생성 버튼을 누르기 전 보강 여부, 실행 기준, 저장 경로를 한 번에 확인하게 합니다.
Studio 다음 실행 체크는 `01 입력 보강`, `02 생성 실행`, `03 저장 추적` 단계 번호를 함께 보여줘 생성 직전 확인 순서를 바로 읽게 합니다.
Studio 다음 실행 상태는 단순 생성 가능 여부가 아니라 입력 분석 상태를 반영해 `바로 생성`, `검토 후 생성`, `보강 필요` 중 하나로 표시합니다.
Studio 다음 실행 요약은 보강 질문이 남아 있으면 생성 버튼 옆에 `보강 질문 추가`를 표시해 원문 입력으로 바로 반영합니다.
`보강 질문 추가`를 누르면 각 질문 아래 `답:` 입력 줄을 원문에 붙인 뒤 원문 입력으로 스크롤하고 포커스하며 커서를 끝으로 옮겨 바로 답을 채울 수 있게 합니다.
Studio 입력 분석은 `보강 질문 추가`로 붙은 질문 문장과 빈 `답:` 자리 자체를 준비도 신호로 계산하지 않고, 사용자가 채운 답변만 다시 분석 기준에 반영합니다.
Studio 입력 분석은 100점에 가까워도 남은 보강 질문이 있으면 `검토 후 생성`으로 유지하고, 모든 준비 항목이 해결된 경우에만 `바로 생성`으로 전환합니다.
Studio 입력 분석과 다음 실행 요약은 남은 보강 질문 수를 같이 표시해 90/100처럼 높은 점수에서도 무엇을 더 채워야 하는지 바로 보이게 합니다.
Studio 생성 운영 흐름, 입력 분석 배지, 다음 실행의 입력 품질 지표는 같은 입력 준비도 라벨을 사용해 상태 해석이 화면마다 달라지지 않게 합니다.
Studio 보강 질문 액션은 같은 질문 블록을 중복으로 붙이지 않고, 이미 추가된 상태에서는 `보강 질문 확인`으로 원문 입력에 포커스해 기존 `답:` 줄을 채우게 합니다.
Studio 대상 AI 자동 추천 이유는 실제 추천 모델명과 일치해야 하며, Codex 실행 신호가 포함된 기획 입력은 GPT와 Codex 조합으로 설명합니다.
Studio의 `적용 학습 컨텍스트`는 다음 생성에 들어갈 상위 학습 메모리와 최근 피드백 개수를 보여주고, 사용자/회사/분야/스킬 학습 메모리 scope를 생성별로 켜고 끌 수 있게 합니다.
Studio의 scope 카드에는 현재 scope별 학습 메모리 수와 Learning 점검 링크가 표시되어 `/learning?scope=skill` 같은 필터 화면으로 바로 이동할 수 있습니다.
`전체 켜기`와 `메모리 제외`로 학습 메모리 반영 강도를 한 번에 조정할 수 있습니다.
마지막 scope 선택은 브라우저에 저장되며, 비활성화한 scope의 학습 메모리는 OpenAI 요청과 로컬 fallback 생성 컨텍스트에서 제외됩니다.
Studio 생성 결과는 저장 전에 학습 반영 요약을 보여주며, 생성 당시 사용된 메모리/피드백 수, enabled scope, 제외 scope, 대표 메모리 제목을 확인하거나 `학습 리포트 복사`로 내보낼 수 있습니다. 저장 후 운영 상태 요약에서는 저장 출처, 저장 방식, 출처 제목, 세부 초안 유형, 학습 증거, 운영 묶음 Library 조건으로 바로 이동하거나 각 조건 링크를 현재 도메인을 포함한 절대 URL과 fallback 운영 메타로 복사할 수 있습니다. `Library 링크 복사`, `Skill 링크 복사`, 저장 출처/저장 방식/운영 묶음 조건 링크 fallback은 같은 학습 증거와 대표 적용 메모리 제목을 포함합니다. sourceVariant가 있는 저장본의 저장 출처/운영 묶음 링크는 `studioVariant` 조건을 포함하고, 버튼과 복사 실패 문구도 세부 유형 기준으로 표시됩니다.
Dashboard, Learning, Library, Skills, Profile, Company에서 Studio 초안을 열면 원문 입력 위에 불러온 초안 출처, 조치 제목, 다음 실행 액션, 초안 입력 요약, 원본 경로, 원본 화면 복귀 링크와 `원본 링크 복사`를 표시해 사용자가 왜 이 초안이 열렸는지 바로 확인하고 원래 맥락으로 돌아갈 수 있습니다. 각 화면은 StudioDraft에 안전한 내부 `sourceHref`를 함께 저장해 Learning 필터 조건, Library 선택 프롬프트/버전, Skills 스킬 편집 화면, Profile/Company 기준 화면까지 복원합니다. Studio에서 이 초안으로 생성한 프롬프트를 Library에 저장하면 `Studio 저장 출처` 메타도 함께 보존해 저장 후에도 원본 Learning 조건, Dashboard 리포트, Library 개선 브리프, Skills 개선 계획 링크로 되돌아갈 수 있습니다. Profile/Company 기준 적용 초안은 같은 방식으로 기준 적용 프리뷰에 돌아갈 수 있습니다. 원본 링크 복사는 현재 도메인을 포함한 절대 URL로 제공되며 clipboard 권한 제한 환경에서도 fallback을 시도하고, 실패하면 수동 복사용 textarea를 제공합니다.
저장된 프롬프트는 생성 당시 enabled scope, 적용 메모리 수, 최근 피드백 수, 대표 메모리 제목을 `learningContext` 메타로 보존하고 Library 상세에서 확인할 수 있습니다.
Library 목록은 각 프롬프트의 학습 scope와 메모리/피드백 반영 수를 배지로 표시합니다.
Library의 `학습 scope` 필터는 사용자/회사/분야/스킬 또는 학습 메타 미기록 프롬프트를 URL 공유 가능한 조건으로 좁혀 볼 수 있게 합니다.
Library 상세의 `학습 컨텍스트 리포트 복사`는 생성 엔진, enabled/disabled scope, 적용 메모리 제목을 Markdown으로 내보냅니다.
Library 상세의 학습 컨텍스트 카드는 `01 증거 확인`, `02 리포트 공유`, `03 Studio 개선` 단계로 enabled scope, 적용 메모리/피드백 수, 리포트 복사, Studio 재개선 초안을 한 번에 이어줍니다.
Library의 저장된 프롬프트 상세에서도 부족한 정보가 남아 있으면 개인 프로필/회사 정보 보강 이동과 보강 질문 복사 액션을 제공합니다. Library 복사 액션은 clipboard 권한이 제한되거나 응답이 지연되는 브라우저에서도 fallback 복사를 시도하고, 그래도 실패하면 버튼 실패 상태와 수동 복사용 textarea를 표시합니다.
개인 프로필과 회사 정보 보강 화면은 Studio 또는 Library에서 전달된 `returnTo` 경로를 `normalizeInternalHref` 기준의 안전한 내부 경로로만 해석해, 상단 복귀 링크와 `저장 후 돌아가기` 버튼으로 보강 후 원래 작업 화면으로 돌아갈 수 있게 합니다.
`저장 후 돌아가기`로 복귀하면 Studio는 새 개인/회사 기준으로 재생성 CTA를, Library는 현재 프롬프트를 Studio에서 개인/회사 기준 반영 개선으로 넘기는 CTA를 표시합니다.
이 업데이트 알림은 `알림 닫기` 또는 반영 CTA를 누르면 현재 URL에서 `profileUpdated` 또는 `companyUpdated` 신호를 제거해 반복 노출을 막습니다.
`재생성 입력으로 반영`을 누르면 현재 버전과 우선 개선 액션을 원문 입력으로 옮겨 저장 전 재생성 루프를 바로 실행할 수 있습니다.
재생성 후에는 세션 기준으로 이전 버전 대비 전체 점수와 항목별 점수 변화를 비교하고, `비교 리포트 복사`로 Markdown 리포트를 내보낼 수 있습니다. 이 비교 기준은 브라우저 세션 상태이며 Library 저장 데이터에는 자동으로 쓰지 않습니다.

수동 확인 가이드:

- Library 상세에서 `개인 프로필 보강` 또는 `회사 정보 보강`으로 이동한 뒤 `저장 후 돌아가기`를 눌러 원래 Library 상세로 복귀하는지 확인합니다.
- Library에서 프롬프트 삭제 후 `최근 삭제 항목`의 `복원`, `보관함에서 제거`, `제거 확인` 흐름이 분리되어 동작하는지 확인합니다.
- Studio에서 저장 후 `Library 링크 복사`, `원본 링크 복사`, `Skill로 전환`이 내부 경로 기반으로 동작하는지 확인합니다.
- Learning에서 조건 링크를 복사했을 때 현재 필터가 포함된 절대 URL이 클립보드에 들어가는지 확인합니다.
- Skills에서 원본/실행 Library 링크 복사 후 새 탭에 붙여넣어 같은 Library 상세가 열리는지 확인합니다.

## Scripts

```bash
npm run dev
npm run start
npm run smoke:chrome-extension
npm run smoke:integrations
npm run smoke:learning-feedback
npm run smoke:mcp
npm run smoke:mcp-client
npm run verify
npm run verify:app-shell
npm run verify:build-stability
npm run verify:data-management
npm run verify:dashboard-source
npm run verify:evidence
npm run verify:evidence-cli
npm run verify:evidence-hygiene
npm run verify:evidence -- --help
npm run verify:docs
npm run verify:integrations
npm run verify:library-summary
npm run verify:learning-summary
npm run verify:manifest
npm run verify:navigation-href
npm run verify:openai-comparison
npm run verify:openai-fallback
npm run verify:prompt-package
npm run verify:profile-company
npm run verify:release-candidate
npm run verify:repo-boundary
npm run verify:runtime
npm run verify:secrets
npm run verify:smoke-evidence
npm run verify:scope
npm run verify:studio-draft-fallbacks
npm run verify:studio-draft-summary
npm run verify:studio-result-summary
npm run verify:skills-summary
npm run verify:studio-safety
npm run verify:terminology
npm run lint
npm run build
```

`npm run verify:evidence` prints a Markdown verification record to stdout. It
includes git branch/commit provenance, working tree state, command results,
runtime readiness booleans, release gate status, and the Supabase import
execution gate state without printing secret values. Runtime variable rows use
`variable KEY; configured yes/no` wording instead of environment assignment
syntax, so evidence can be scanned without looking like a secret value. Failed
checks include bounded stdout/stderr excerpts with basic key/token redaction.
`npm run smoke:mcp` runs the local MCP bridge self-test without contacting GPT,
Claude, Codex, Gemini, OpenAI, or Supabase. Use it before connecting a real MCP
client. Add `-- --out path/to/mcp-smoke.md` to save the local MCP smoke
evidence packet.
`npm run smoke:mcp-client` runs a local stdio JSON-RPC client sequence against
the MCP bridge, confirms a review-required handoff, and writes confirmed
feedback to a temporary JSONL inbox without contacting external AI. Add
`-- --out path/to/mcp-client-smoke.md` to save the local MCP client smoke
evidence packet.
`npm run smoke:chrome-extension` checks the unpacked Chrome extension manifest,
background service worker, popup workflow, local-only URL guard, session restore,
and evidence fallback before loading it in Chrome. Add
`-- --out path/to/chrome-smoke.md` to save the local smoke evidence packet.
`npm run smoke:learning-feedback` checks the Learning feedback-improvement
queue, low-confidence Studio validation draft, Library validation filter, queue
report links, and manual copy fallback contract. Add
`-- --out path/to/learning-feedback-smoke.md` to save the local Learning smoke
evidence packet.
`npm run smoke:integrations` writes the Chrome, MCP bridge, MCP client, and
Learning smoke evidence packets plus `integrations-smoke-summary.md` to
`output/smoke` in one preflight pass before any actual external AI handoff. The
summary records git branch/commit provenance, working tree state, and changed
file count for the local preflight packet set.
`npm run verify` and `npm run verify:evidence` use the same verification check
manifest so the executed gate and the handoff evidence stay aligned. Evidence
records include both the npm script name and the resolved command.
Use shell redirection when you need to attach it to a release or migration handoff.
You can also write the same Markdown directly with
`npm run verify:evidence -- --out docs/verification-evidence.md`.
Use `npm run verify:evidence -- --out-dir docs/evidence` when you want the
script to create a timestamped evidence filename automatically. The script
fails fast for unknown options, and `--out` / `--out-dir` are mutually
exclusive.
Run `npm run verify`, `npm run verify:evidence`, and `npm run build` one at a
time because Next.js uses a production build lock.
`npm run verify:evidence-cli` checks the fast CLI paths for help output,
invalid option handling, output option conflicts, redaction, git provenance, and
failure evidence writing without running a full production build. It also guards
the runtime variable evidence format so missing keys do not look like secret
assignments.
`npm run verify:evidence-hygiene` checks that `docs/evidence` has its README,
keeps at most one active timestamped evidence record, requires git provenance,
and rejects runtime variable rows that look like secret assignments.
`npm run verify:docs` checks that the README Scripts block documents package
scripts and core verification notes.
`npm run verify:app-shell` checks that the global navigation keeps each primary
section's role and next action visible in the header.
`npm run verify:integrations` checks that the Integrations route, navigation,
Chrome/Gen AI/MCP surfaces, MCP tool contract, and product docs stay aligned.
`npm run verify:build-stability` checks that runtime source stays free of
network Google font imports and keeps local app font stacks defined for stable
offline production builds.
`npm run verify:dashboard-source` checks that Dashboard Studio source
operations use saved-source wording in the UI, Studio draft, registry, and
README.
`npm run verify:data-management` checks that Data management exposes the
Supabase import execution packet manifest, waiting summary, copy gate, and
next-action note as copy-ready operational artifacts. It also parses `/data`
copy handlers and fails if a `copyDataText` call omits the failure notice and
metadata-rich manual fallback body. It also checks that the Supabase REST
import adapter keeps write gates server-only, rejects unexpected tables, and
skips empty batches without calling Supabase. It also checks the REST insert
URL, method, headers, JSON body, success count, and failure response message
through a local fetch stub. It also checks that the import route returns explicit execute-gate and validation-blocked responses before any write adapter can run.
For allowed execute responses, it checks that the route returns the execution
result summary and embeds the same result in the route audit artifact.
It also checks that the execute request template keeps the exact execute JSON
payload, required preconditions, and post-import follow-up checks together.
It also checks that the execution guard checklist keeps every no-go condition
and required post-execution action together.
It also checks that the post-import evidence record keeps identity, required
evidence, acceptance gates, evidence slots, and rollback triggers together.
It also checks that the migration handoff package keeps target identity, read
order, SQL audits, RLS checks, and the verification report together.
It also checks that the verification report keeps import target, execution
order, replacement guidance, acceptance checks, warnings, rollback triggers,
and sign-off together.
It also checks that the migration rehearsal report keeps preflight identity,
readiness checklist, acceptance gates, insert order, blockers, and required
artifacts together.
It also checks that the execution readiness decision keeps decision inputs,
operator sequence, blockers, runtime warnings, preflight blockers, and insert
order together.
It also checks that the controlled execution packet keeps the packet index,
non-execution guard, secret guard, and every required execution artifact in
order.
It also checks that the execution packet manifest keeps readiness items and
copy actions in the operator review order.
It also checks that the execution packet next-action memo keeps identity,
manifest summary, waiting detail, copy actions, next action, and the
non-execution guardrail in memo order.
It also checks that the API preflight report keeps status, validation,
dry-run metrics, UUID metrics, blockers, insert order, and no-write guard
together.
It also checks that the route audit artifact fallback keeps identity, route
status, execute=false mode, validation, row/table counts, confirmation gate,
and the raw artifact together.
It also checks that the import execution plan keeps the local-only guard,
identity summary, acceptance gates, pending references, archive trace, UUID
map, and insert payload batches together.
It also checks that the importer adapter contract keeps the adapter shape,
validation, insert order, server-only gate, and post-import audit gate together.
`npm run verify:library-summary` checks that the Library detail panel keeps the
selected prompt operation summary, handoff status, source, persistence, and
chain labels visible.
`npm run verify:learning-summary` checks that Learning filtered-memory reports
include the current filter condition as an absolute URL and keep filter-link
copy fallback coverage.
`npm run verify:manifest` checks that the shared verification manifest matches
package scripts, runs first inside `npm run verify`, and keeps the
release-candidate gate tied to repo boundary, evidence hygiene, local smoke
evidence, and secret safety checks.
`npm run verify:navigation-href` checks that shared internal route helpers reject
external or protocol-relative URLs, preserve path/query/hash, and format copy
links through normalized internal hrefs.
`npm run verify:openai-fallback` checks that prompt generation stays on the
local builder when `OPENAI_API_KEY` is absent and that the status route reports
local mode without exposing a model value. It also checks that `.env.example`,
runtime readiness, and the operator-gated OpenAI next step stay aligned.
`npm run verify:openai-comparison` builds the same local prompt fixture used for
OpenAI rollout checks, keeps the default run offline, and documents the
`OPENAI_API_KEY` plus `OPENAI_COMPARISON_LIVE=1` gate for a live comparison.
Add `-- --out path/to/openai-comparison.md` when the comparison packet should be
saved as an operator evidence artifact.
`npm run verify:prompt-package` checks that the Target AI handoff package keeps
its copy-ready prompt, quality review, missing context, and operator notes.
`npm run verify:profile-company` checks that Profile and Company keep the
context operating flow, question copy, learning-memory save, and return action
visible before the detailed forms.
`npm run verify:release-candidate` checks active evidence hygiene, local smoke
evidence packets, secret scan, and root temporary directory cleanup before a
grouped commit or handoff.
`npm run verify:repo-boundary` checks that this project is the active git
top-level instead of a loose folder inside the parent `/Users/sungjin/dev` repo.
`npm run verify:runtime` checks key runtime readiness scenarios so the Data UI,
system readiness API, and verification evidence keep the same release gate
rules.
`npm run verify:scope` checks Supabase preflight scope drift for backup
fingerprint, workspace_id, and owner_user_id changes. Add
`-- --out path/to/supabase-scope-guard.md` to save the no-write operator
handoff artifact.
`npm run verify:secrets` scans source, scripts, and docs for OpenAI/Supabase
secret-like values while allowing documented placeholders.
`npm run verify:smoke-evidence` checks that `output/smoke` contains its local
README plus exactly the integrated summary, Chrome, MCP bridge, MCP client, and
Learning smoke evidence packets and that each packet keeps its local-only or
review-required contract text.
`npm run verify:studio-draft-fallbacks` checks that every Studio draft write
stores the result in `wroteDraft` and immediately returns from its manual
fallback guard.
`npm run verify:studio-draft-summary` checks that Studio loaded drafts keep the
operation summary, persistence, saved source, and save expectation visible.
`npm run verify:studio-result-summary` checks that Studio generated results keep
the target AI handoff summary, readiness counts, and priority preflight item
visible before the prompt body.
`npm run verify:skills-summary` checks that Skills operation summary and run
history links can be copied as absolute Library URLs with manual fallback.
`npm run verify:studio-safety` checks that Studio blocks stale generated
prompts, AI handoff packages, package previews, and saves while regeneration is
pending.
`npm run verify:terminology` checks README, docs, source, and scripts for
current Studio saved-source wording and blocks old source-kind/source-metadata
terms from returning.

## Release Evidence Checklist

- [ ] Run one verification command at a time; do not run `npm run verify`,
      `npm run verify:evidence`, or `npm run build` concurrently.
- [ ] Run `npm run verify` before release, handoff, or migration rehearsal.
- [ ] Generate a handoff artifact with
      `npm run verify:evidence -- --out-dir docs/evidence` or a private
      evidence directory.
- [ ] Confirm the evidence status is `pass` and includes every shared manifest
      check, including `verify:manifest`, `verify:docs`, `verify:secrets`,
      `lint`, and `build`.
- [ ] Confirm the evidence includes git branch, commit, working tree state, and
      changed file count captured before the grouped commit is created.
- [ ] Before the first grouped commit, run `npm run verify:repo-boundary` and
      confirm this project is the git top-level at
      `/Users/sungjin/dev/personal/prompt-ai-studio`, not a loose untracked
      folder inside the parent `/Users/sungjin/dev` repo.
- [ ] Confirm runtime readiness matches the intended mode before enabling any
      Supabase import execution gate.
- [ ] Confirm no raw OpenAI API keys, Supabase anon keys, service role keys, or
      tokens are pasted into release notes, screenshots, or handoff documents.

## 다음 개발 후보

바로 진행 가능한 작업과 operator gate가 필요한 작업을 분리합니다.

### 로컬에서 바로 진행

- Integrations 실제 사용 smoke: Chrome extension 또는 MCP client 중 하나를
  선택해 review-required handoff package와 feedback inbox 저장 흐름을 확인합니다.
  실제 연결 전에 `npm run smoke:integrations`로 Chrome, MCP bridge, MCP
  client, Learning local smoke packet과 `integrations-smoke-summary.md`를 한
  번에 갱신합니다.
  Chrome부터 시작할 때는 `npm run smoke:chrome-extension`으로 unpacked
  extension 파일 계약을 먼저 확인합니다. 증빙 파일이 필요하면
  `npm run smoke:chrome-extension -- --out output/smoke/chrome-extension-smoke.md`를
  붙입니다.
  MCP부터 시작할 때는 `npm run smoke:mcp`로 로컬 bridge 계약을 먼저 확인합니다.
  증빙 파일이 필요하면
  `npm run smoke:mcp -- --out output/smoke/mcp-bridge-smoke.md`를 붙입니다.
  실제 client 호출 흐름까지 확인하려면
  `npm run smoke:mcp-client -- --out output/smoke/mcp-client-smoke.md`를 붙입니다.
- Learning feedback 개선 큐 정리: `npm run smoke:learning-feedback`로 낮은
  신뢰도 Studio 검증 초안, 큐 리포트, Library 검증 저장본 필터 계약을 먼저
  확인합니다. 증빙 파일이 필요하면
  `npm run smoke:learning-feedback -- --out output/smoke/learning-feedback-smoke.md`를
  붙입니다. 그 뒤 실제 낮은 신뢰도 메모리를 Studio 검증 초안으로 보내고
  Library에서 추적합니다.
- Release candidate 정리: 관련 변경을 묶기 전 `npm run verify:evidence`로
  최신 증빙을 만들고 `npm run verify:release-candidate`로 active evidence,
  local smoke evidence, secret scan, 루트 임시 산출물 정리를 확인합니다. 첫
  grouped commit 전에는 `npm run verify:repo-boundary`로
  `/Users/sungjin/dev/personal/prompt-ai-studio` 독립 repo 경계를 확인합니다.

### operator gate 이후 진행

- OpenAI API 기반 프롬프트 분석 고도화: `OPENAI_API_KEY`와 사용할 모델을
  operator가 넣기 전에는 `npm run verify:openai-fallback`으로 local fallback
  계약을 확인합니다. key를 넣은 뒤에는
  `OPENAI_COMPARISON_LIVE=1 npm run verify:openai-comparison`으로 같은 입력의
  로컬 fallback과 OpenAI 보강 결과를 비교합니다. 증빙 파일이 필요하면
  `-- --out docs/evidence/openai-comparison-live.md`를 붙여 같은 comparison
  packet을 저장합니다.
- Supabase Postgres 저장소와 백업 JSON importer 구현: Supabase project,
  service-role server 환경, RLS smoke 기준이 준비된 뒤 write path를 엽니다.
  operator가 실제 Supabase 정보를 넣기 전에는
  `npm run verify:scope -- --out docs/evidence/supabase-scope-guard.md`로
  backup fingerprint, workspace_id, owner_user_id scope guard 증빙을 먼저
  남깁니다.
- 문서 업로드 저장, server-side embedding, pgvector 검색 실행 경로 구현:
  Supabase schema와 embedding provider가 정해진 뒤 진행합니다.
- 팀/회사 워크스페이스: 인증, 멤버 역할, workspace ownership 정책을 먼저
  확정한 뒤 진행합니다.

각 후보를 시작하기 전에는 README의 Release Evidence Checklist를 기준으로
현재 runtime readiness와 필요한 권한 gate를 먼저 확인합니다.
