# 상용화 활성화 런북 (Commercialization Runbook)

이 문서는 Free 로컬 엔진이 이미 무제한으로 동작하는 상태에서, Pro(OpenAI 고급 개선 + 클라우드
동기화)와 실제 결제를 켜기 위해 운영자가 순서대로 실행할 작업을 정리합니다. 코드는 이미
`src/lib/entitlements/`의 entitlement seam과 Studio의 Pro 안내 칩까지 준비되어 있으며, 이
문서에 있는 어떤 단계도 자동으로 실행되지 않습니다. 모든 단계는 운영자가 키/계정을 확보한
뒤 직접 수행합니다.

## 0. 현재 상태 요약

- Free 로컬 엔진: 서버 비용 없이 이미 무제한 제공 중 (`npm run verify` 기준 회귀 없음).
- Entitlement 모델: `src/lib/entitlements/resolve.ts`의 `resolveEntitlements`가 유일한
  판단 지점입니다. 지금은 항상 `{ storedPlan, proFeaturesEnabled: false }`로 호출되므로
  모든 사용자가 free로 귀결됩니다.
- Studio의 생성 엔진 상태 카드는 OpenAI 키가 있어도 `proFeaturesEnabled`가 꺼져 있으면
  `Pro 준비 중` 칩과 `/pricing` 링크만 보여주고, 어떤 기능도 막지 않습니다.
- 이 문서의 1~3단계를 마치기 전까지는 Pro가 실제로 켜지지 않습니다 — 지금 상태에서 결제나
  키 설정 없이 이 문서만 읽어도 앱 동작은 바뀌지 않습니다.

## 1. OpenAI 키 활성화

**비용: 사용량 기반 (OpenAI 종량 과금, MVP 단계에서는 월 수 달러~수십 달러 추정)**

1. `.env.local`(또는 배포 환경 변수)에 다음을 설정합니다.
   - `OPENAI_API_KEY` — OpenAI 프로젝트 API 키. `src/lib/openai/prompt-optimizer.ts`가
     이 값이 없으면 자동으로 로컬 규칙 기반 생성으로 fallback합니다.
   - `OPENAI_MODEL` — 기본값은 `gpt-5-mini`. 비용을 낮게 유지하려면 mini/저비용 모델을
     유지하고, 품질이 부족하면 더 큰 모델로 교체합니다.
2. 이 값을 설정하면 즉시 시작되는 것: `POST /api/generate-prompt`가 OpenAI Responses API로
   보강을 시도하고, `GET /api/generate-prompt/status`가 `configured: true`를 반환합니다.
   Studio의 생성 엔진 상태 카드 문구도 `OpenAI Responses API · {model}`로 바뀝니다. 다만
   Pro 칩이 사라지려면 3단계의 `proFeaturesEnabled` 스위치도 함께 켜야 합니다 (아래 4단계
   참고) — 키만 넣는다고 무료 사용자에게 자동으로 열리지 않습니다.
3. 비용 통제:
   - 저비용 모델(`OPENAI_MODEL=gpt-5-mini` 등)을 기본값으로 유지합니다.
   - OpenAI 대시보드에서 프로젝트별 사용량 한도(hard limit)를 설정합니다.
   - `max_output_tokens`는 이미 `src/lib/openai/prompt-optimizer.ts`에 12000으로
     고정되어 있습니다. 비용이 예상보다 크면 이 값을 낮추는 것을 우선 검토합니다.
   - Pro 전용으로 전환한 뒤에는 요청 빈도 제한(rate limit)을 두는 것을 권장합니다. 현재
     레포에는 사용자별 rate limit 코드가 없으므로, Stripe 연동(3단계) 시점에 함께
     추가하는 것을 검토합니다.
4. 검증:
   - `npm run verify:openai-fallback` — 키가 없을 때 로컬 fallback이 정확히 동작하는지
     확인합니다 (프로세스 환경 변수를 일시적으로 지우고 검증).
   - `npm run verify:openai-comparison` — 로컬 생성과 OpenAI 생성 결과 비교 evidence를
     만듭니다. 실제 실 API 호출로 비교하려면 `OPENAI_COMPARISON_LIVE=1`과 함께 실행합니다
     (과금 발생, 필요할 때만 수동 실행).
   - Studio 화면에서 생성 엔진 상태 카드가 `OpenAI Responses API · {model}`로 바뀌는지
     수동 확인합니다.

## 2. Supabase 동기화

**비용: Supabase 무료 티어로 시작 가능, 사용량 증가 시 유료 티어 (프로젝트당 월 $25~)**

오늘 이미 존재하는 것:

- 로컬 백업 JSON 내보내기/복원 (`src/lib/storage/workspace-backup.ts`).
- Supabase 목표 스키마, dry-run 변환, RLS 정책 초안, 검증 SQL 생성기
  (`src/lib/data/supabase-import-*.ts`). 삭제 보관함은 `deleted_prompt_assets`로 분리되어
  마이그레이션 후에도 추적 가능합니다.
- `POST /api/data/supabase-import` — 서버 Route Handler. `execute=false`(기본값)이면
  dry-run만 수행하고 실제 DB에 쓰지 않습니다. `execute=true`로 실제 insert를 실행하려면
  `SUPABASE_IMPORT_EXECUTION_ENABLED=true`, `NEXT_PUBLIC_SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`가 서버 환경에 설정되어 있고 요청에
  `confirmation: "RUN_SUPABASE_IMPORT"`가 포함되어야 합니다.
- `/data` 화면의 API preflight, execution plan, adapter 계약 내보내기로 실제 importer
  구현 전 검증까지 가능합니다.

실제 동기화(로그인한 사용자가 여러 기기에서 같은 데이터를 보는 것)를 위해 아직 없는 것:

1. **인증** — 현재 앱은 로그인이 없는 완전 로컬 저장 구조입니다. Supabase Auth(이메일 매직
   링크 또는 OAuth)를 붙이고, 로그인 세션에서 `workspace_id`/`owner_user_id`를 발급하는
   흐름이 필요합니다. 이 저장소에는 아직 로그인 UI/세션 코드가 없습니다.
2. **RLS 적용** — `src/lib/data/supabase-import-rls-sql.ts`가 정책 초안을 생성하지만,
   실제 Supabase 프로젝트에 적용하고 인증된 세션으로 smoke test를 실행하는 것은 운영자
   작업입니다 (`/data`의 RLS smoke test checklist 참고).
3. **쓰기 경로 전환** — 지금은 로컬 저장이 유일한 진실의 원천(source of truth)입니다.
   실시간 동기화를 하려면 `src/lib/storage/local-store.ts`의 `useStoredState`를 Supabase
   백엔드로 교체하거나 병행하는 계층을 새로 설계해야 하며, 이는 이번 P53 스캐폴딩 범위
   밖입니다.

권장 활성화 순서:

1. Supabase 프로젝트 생성 → `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/
   `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_PROJECT_REF` 설정.
2. `/data`에서 스키마 SQL, RLS 정책 초안을 복사해 Supabase SQL editor에 적용.
3. 테스트 계정으로 백업 JSON 하나를 dry-run → `execute:true`로 1회 마이그레이션 리허설.
4. RLS 정책 검증 SQL과 smoke test checklist로 소유자 격리를 확인.
5. 인증 UI/세션 코드를 추가하고, 로그인 후에만 `cloud-sync` 기능을 노출하도록
   `resolveEntitlements` 호출부(4단계 참고)를 연결.
6. 검증: `npm run verify:scope`, `npm run verify:data-management`.

## 3. Stripe 결제

**비용: 거래당 수수료 (Stripe 기본 요율, 국내 카드 기준 확인 필요), 월 고정비 없음**

이 로컬 우선 앱에는 무거운 Stripe Billing/고객 포털이 필요하지 않습니다. 권장 구조:

1. **Payment Link 또는 Checkout Session** — 별도 카트/구독 관리 UI 없이 Stripe가 호스팅하는
   결제 페이지로 연결합니다. MVP에서는 Payment Link가 가장 적은 코드로 시작할 수 있습니다.
2. **Webhook 라우트 1개 추가** — 예: `src/app/api/billing/webhook/route.ts` (신규 파일).
   `checkout.session.completed` 또는 `customer.subscription.updated` 이벤트를 받아 결제
   완료 사용자의 plan을 "pro"로 기록합니다. Stripe webhook 서명 검증
   (`STRIPE_WEBHOOK_SECRET`)이 필수입니다.
3. **정확히 이 지점만 코드가 바뀝니다**:
   - `src/lib/entitlements/resolve.ts`의 `resolveEntitlements` 호출부 — 지금은 프론트엔드
     `use-entitlements.ts`가 로컬 저장값만 읽지만, 결제 연동 후에는 서버에서 검증한
     `storedPlan`(예: Supabase에 저장된 구독 상태)과 서버 설정
     `proFeaturesEnabled`(예: `PRO_FEATURES_ENABLED=true` 같은 운영 스위치)를 넘기도록
     입력 소스만 교체합니다. `resolveEntitlements` 함수 시그니처와 무료/Pro 판정 로직
     자체는 바뀌지 않습니다.
   - 신규 webhook route 1개 — 위 2번.
   - 고객 포털은 MVP에서 생략합니다 (플랜 변경/해지는 운영자가 Stripe 대시보드에서 수동
     처리하거나, 필요해지면 후속 단계에서 추가).
4. **한국 특이사항**:
   - Stripe로 KRW 결제를 받을 수 있지만, 카드사/PG 정책에 따라 국내 카드 성공률이
     달라질 수 있습니다. 정식 출시 전 실제 국내 카드로 테스트 결제를 권장합니다.
   - 대안으로 토스페이먼츠(TossPayments)를 고려할 수 있습니다. 토스페이먼츠는 국내
     카드/간편결제(카카오페이, 네이버페이 등) 지원이 강점이지만, Stripe처럼 글로벌
     webhook 생태계가 표준화되어 있지 않으므로 별도 SDK 연동과 정산 흐름을 검토해야
     합니다. 해외 사용자 비중이 낮고 국내 결제 경험이 중요하다면 1순위로 검토할 수
     있습니다.
   - 사업자 등록, 통신판매업 신고, 전자상거래법상 청약철회 안내 등 국내 결제 관련 법무
     검토는 이 문서 범위 밖이며 별도로 진행해야 합니다.

## 4. 가격 결정 체크리스트

Pro를 실제로 켜기 전에 결정해야 할 항목:

- [ ] **가격 포지션**: Pretty Prompt의 Lite($4.99/월)~Pro($8.25/월) 구간을 기준으로
      OpenAI 보강 + 클라우드 동기화 가치를 어느 지점에 놓을지 결정합니다. 이 앱은 Free가
      Pretty Prompt의 Pro 기능(무제한, 로컬 저장)을 이미 포함하므로, Pro는 순수하게
      OpenAI 품질과 동기화 프리미엄으로 포지셔닝합니다.
- [ ] **KRW 가격**: USD 앵커(예: $4.99~$8.25)를 원화로 변환할 때 환율 변동 버퍼와
      Stripe/PG 수수료를 반영한 실제 수취액을 계산합니다.
- [ ] **트라이얼 정책**: 무료 체험 기간을 둘지, OpenAI 비용을 고려해 체험 없이 바로
      유료로 시작할지 결정합니다. 체험을 두면 OpenAI 사용량 한도(1단계)를 트라이얼
      사용자에게도 별도로 걸어야 합니다.
- [ ] **연간 vs 월간**: 연간 결제 할인 여부와 그에 따른 Stripe Price 객체 구성을
      결정합니다.
- [ ] **환불/해지 정책**: 국내 전자상거래법 기준 청약철회 규정을 반영한 환불 정책 문구를
      `/terms`에 추가할지 결정합니다 (법무 검토 필요).
- [ ] **Pro 기능 확정 범위**: 출시 시점에 `openai-enhancement`와 `cloud-sync`를 동시에
      켤지, 단계적으로(예: OpenAI 먼저) 출시할지 결정합니다. `ProFeature` 유니온이 이미
      개별 on/off를 지원하므로 코드 변경 없이 순차 출시가 가능합니다.

## 참고: 이 스캐폴딩이 보장하는 것

- 이 문서와 `src/lib/entitlements/`의 어떤 코드도 결제 로직이나 실제 과금을 포함하지
  않습니다.
- Free 사용자에게는 지금도, 이 문서의 단계를 하나도 실행하지 않아도 아무 변화가 없습니다.
- Pro 관련 UI(Studio 칩, `/pricing`)는 항상 "준비 중"만 표시하며 구매 가능한 것처럼
  보이지 않습니다.
