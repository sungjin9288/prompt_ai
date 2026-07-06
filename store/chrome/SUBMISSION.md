# Chrome Web Store 제출 런북

이 문서는 Prompt AI Studio Refine 확장을 Chrome Web Store에 실제로 제출하는
운영자용 단계별 가이드입니다. 이 저장소의 자동화(verify, lint, test, build,
smoke)는 제출 자체를 대신할 수 없습니다 — 개발자 계정 생성, 폼 입력, 파일
업로드는 Chrome Web Store 개발자 대시보드에서 사람이 직접 수행해야 하는
운영자 게이트입니다.

## 0. 사전 제출 체크리스트

제출을 시작하기 전에 아래를 모두 확인하세요. 프로덕션 URL은 이미
`https://prompt-ai-studio.netlify.app`으로 확정되어 있습니다 (개인정보처리방침
URL·웹사이트 URL 필드에 그대로 사용).

- [x] 프로덕션 배포 완료 — Netlify에 배포되어 `https://prompt-ai-studio.netlify.app`이
      확정되었다 (Vercel 팀은 fair-use 정책에 막혀 Netlify로 전환).
- [x] `src/lib/site/config.ts`의 `siteUrl`이 배포 환경에서 `NEXT_PUBLIC_APP_URL`
      환경 변수로 `https://prompt-ai-studio.netlify.app`을 가리키도록
      `netlify env:set`으로 설정되었다.
- [ ] 프로덕션 배포에서 `https://prompt-ai-studio.netlify.app/privacy`가
      정상적으로 열린다.
- [ ] 프로덕션 배포에서 `https://prompt-ai-studio.netlify.app/welcome`이
      정상적으로 열린다.
- [ ] `extensions/chrome/manifest.json`의 `version`이 이번에 제출할 최종
      버전이다 (이름을 바꾸지 않는 한 `0.5.0` 유지, 매니페스트를 다시 손대면
      버전을 올리고 `scripts/verify-chrome-extension-smoke.mjs`의 버전 pin도
      함께 갱신).
- [ ] `npm run smoke:chrome-extension`이 통과한다.
- [ ] `npm run verify`가 `All verification checks passed.`로 끝난다.
- [ ] `npm run package:extension`을 다시 실행해 최신 zip
      (`output/extension/prompt-ai-studio-refine-v<version>.zip`)을 만들었다.
- [ ] `npm run screenshots:store`로 `store/chrome/screenshots/screenshot-{1..4}.png`
      4장이 최신 UI를 반영해 재생성되었다 (UI가 바뀐 뒤 오래된 스크린샷을
      그대로 제출하지 않는다).
- [ ] `store/chrome/listing.ko.md`, `store/chrome/listing.en.md`의 문구가
      실제 확장 동작과 일치한다 (특히 Pro 등급을 언급하지 않는지 다시 확인).

## 1. Chrome Web Store 개발자 계정 생성 ($5, 일회성)

1. https://chrome.google.com/webstore/devconsole 접속 (Google 계정 로그인
   필요).
2. 개발자 등록을 진행하고 일회성 등록비 $5를 결제합니다. (이미 계정이 있다면
   이 단계는 건너뜁니다.)
3. 등록이 완료되면 "새 항목(New item)" 버튼으로 이동합니다.

## 2. zip 업로드

1. "새 항목(New item)"에서 `output/extension/prompt-ai-studio-refine-v0.5.0.zip`
   (버전 번호는 실제 매니페스트 버전에 맞춰 조정)을 업로드합니다.
2. 업로드 후 대시보드가 매니페스트를 파싱해 이름/버전/권한 요약을 보여줍니다 —
   `extensions/chrome/manifest.json`과 일치하는지 확인합니다.

## 3. 스토어 등록정보(Store listing) 탭 채우기

`store/chrome/listing.ko.md`를 기본 언어(한국어) 등록 화면에, 그리고 언어
추가 버튼으로 English 로캘을 만든 뒤 `store/chrome/listing.en.md`를 그대로
복사해 채웁니다. 필드 순서:

1. **이름** — `listing.ko.md`의 "이름" 섹션 (23자, 제한 45자 이내).
2. **짧은 설명** — 132자 제한 섹션 그대로.
3. **자세한 설명** — 16,000자 제한 섹션 그대로.
4. **아이콘** — `extensions/chrome/icons/icon-128.png`를 스토어 아이콘으로
   업로드 (zip에 이미 포함되어 있지만 스토어 등록정보 화면은 별도 업로드
   슬롯을 요구할 수 있습니다).
5. **스크린샷** — `store/chrome/screenshots/screenshot-1.png`부터
   `screenshot-4.png`까지 순서대로 업로드합니다. 각 스크린샷이 보여주는
   내용은 아래 "스크린샷 설명" 참고.
6. **카테고리** — `listing.ko.md`의 카테고리 섹션 (Productivity 우선).
7. **언어** — 한국어(기본) + English(추가).
8. **개인정보처리방침 URL** — `https://prompt-ai-studio.netlify.app/privacy`를
   입력.
9. **웹사이트** — `https://prompt-ai-studio.netlify.app/welcome`을 입력.

### 스크린샷 설명 (심사자·사용자에게 보여줄 캡션 — 등록정보 설명 필드에
자유롭게 인용 가능)

| 파일 | 보여주는 화면 |
|---|---|
| `screenshot-1.png` | ChatGPT 스타일 입력창에 실제 한글 초안을 입력한 뒤 in-page "개선" 버튼을 눌러 나온 결과: 개선된 프롬프트로 교체된 입력창과 "되돌리기 / 복사 / Studio에서 열기" 결과 바 |
| `screenshot-2.png` | `/improve` 페이지에서 초안을 개선한 뒤 품질 점수(예: 4.7)와 함께 표시되는 개선 결과 |
| `screenshot-3.png` | "샘플 데이터 불러오기"로 채운 `/library` 화면 — 저장된 프롬프트 목록과 상세 패널의 GPT 버전 본문 |
| `screenshot-4.png` | 샘플 데이터가 채워진 대시보드(`/`) — 오늘의 실행 요약, 저장 프롬프트 수, 평균 품질 점수 |

## 4. 개인정보처리 관행(Privacy practices) 탭

대시보드의 "Privacy" 탭에서 아래 질문에 사실 그대로 답합니다 (근거:
`https://prompt-ai-studio.netlify.app/privacy`와 `listing.ko.md`/`listing.en.md`의
데이터 사용 공개 매핑 표).

| 질문 | 답변 | 근거 |
|---|---|---|
| 개인 식별 정보(이름, 이메일, 주소 등) 수집 | 아니오 | 계정/로그인 기능 없음 |
| 건강 정보 수집 | 아니오 | 해당 없음 |
| 금융/결제 정보 수집 | 아니오 | 결제 기능 없음 |
| 인증 정보(비밀번호 등) 수집 | 아니오 | 해당 없음 |
| 개인 통신(이메일, 메시지 등) 수집 | 아니오 | 해당 없음 |
| 위치 정보 수집 | 아니오 | 해당 없음 |
| 웹 이력(방문 URL 등) 수집 | 아니오 | 페이지 방문 이력을 추적하지 않음 |
| 사용자 활동(클릭, 스크롤 등) 수집 | 아니오 | 분석/추적 스크립트 없음 |
| 웹사이트 콘텐츠(선택 텍스트 등) 수집 | 예 | 사용자가 "개선" 버튼을 누른 입력창 초안만, 사용자가 지정한 서버로 전송. 판매/광고 목적 아님. 처리 후 서버 보관 없음 |
| 수집한 데이터를 제3자에게 판매 | 아니오 | 판매하지 않음 |
| 수집 목적과 무관하게 데이터 사용 | 아니오 | 초안은 개선 결과 계산에만 사용 |
| 신용 평가·대출 등 목적 사용 | 아니오 | 해당 없음 |

체크박스 하단 "이 데이터를 어떻게 사용합니까"와 같은 자유 서술형 필드에는
`listing.ko.md`의 "자세한 설명" 중 "이 확장이 하지 않는 일" 문단을 그대로
붙여넣어도 됩니다.

## 5. 권한 정당화(Permissions justification) 입력

심사 폼이 `host_permissions`(https://*/*)를 포함해 민감 권한마다 정당화
텍스트를 요구합니다. `listing.ko.md`(또는 English 로캘 심사 시
`listing.en.md`)의 "권한 정당화" 섹션에서 권한별 문단을 그대로 복사해
붙여넣습니다:

- `activeTab`
- `storage`
- `contextMenus`
- `scripting`
- `host_permissions` (`https://*/*`)
- content script hosts (`chatgpt.com`, `chat.openai.com`, `claude.ai`,
  `gemini.google.com`)

## 6. Single purpose 필드 입력

`listing.ko.md`의 "Single purpose(단일 목적) 설명" 문단을 그대로 붙여넣습니다.

## 7. 심사 제출

1. 모든 필수 필드(빨간 표시)가 채워졌는지 대시보드 상단 체크리스트로
   확인합니다.
2. "게시 대상(Visibility)"을 공개(Public)로 설정합니다 (비공개 테스트가
   필요하면 우선 비공개/미등록으로 제출 후 검증 뒤 전환 가능).
3. "심사를 위해 제출(Submit for review)"을 클릭합니다.

## 8. 예상 심사 기간

- Google 공식 안내 기준 대부분의 확장은 영업일 기준 **수 시간~3일** 이내
  1차 심사가 완료됩니다.
- `host_permissions`에 `https://*/*`처럼 넓은 범위가 포함되어 있으므로,
  추가 서면 소명이나 재검토 요청으로 **최대 몇 주**까지 늘어날 수 있습니다.
  이 경우 심사팀 이메일에 `listing.ko.md`/`listing.en.md`의 권한 정당화
  문단을 그대로 회신하면 됩니다 — 이미 "사용자가 명시적으로 지정한 서버로만
  전송"이라는 핵심 논거가 포함되어 있습니다.
- 반려 시 반려 사유를 확인하고 필요한 필드만 수정해 재제출합니다. 매니페스트나
  권한을 변경했다면 0단계 체크리스트(smoke, verify, 재패키징, 재제출)를
  다시 거칩니다.

## 9. 승인 후 처리

1. 대시보드에서 게시된 스토어 URL(`https://chromewebstore.google.com/detail/...`)을
   확인합니다.
2. `src/lib/site/config.ts`의 `chromeStoreUrl`에 그 URL을 채워 넣습니다:

   ```ts
   export const chromeStoreUrl = "https://chromewebstore.google.com/detail/<extension-id>";
   ```

3. 변경을 커밋하고 프로덕션을 재배포합니다 (`npm run build` 확인 후
   `netlify deploy --build --prod`, 또는 프로젝트의 표준 배포 절차를 따릅니다).
4. `docs/launch-plan.md`의 P52 항목이 이미 "완료"로 표시되어 있는지 확인하고,
   실제 스토어 URL이 반영된 배포가 라이브인지
   `https://prompt-ai-studio.netlify.app`에서 `/welcome` 등 확장 링크가
   걸린 화면을 열어 최종 확인합니다.
5. 이후 매니페스트 버전을 올릴 때마다(기능 추가/버그 수정) 같은 zip
   업로드 절차를 반복합니다 — 스토어 등록정보 문안은 변경이 없다면 다시
   입력할 필요가 없습니다.

## 부록: 이 저장소가 자동으로 보장하는 것과 보장하지 않는 것

**자동으로 보장됨** (verify/smoke가 pin):
- 매니페스트 구조, 권한 목록, content script 매칭, 아이콘 크기.
- 팝업/백그라운드/in-page 스크립트의 핵심 문자열 계약.
- 로컬 전용 실행(스모크는 Chrome을 로드하거나 외부 서비스를 호출하지 않음).

**이 런북이 사람 손으로 대신 확인해야 함**:
- 개발자 계정 생성과 $5 결제.
- 스토어 등록정보 폼의 실제 입력과 업로드.
- Google 심사팀과의 소명/재검토 커뮤니케이션.
- 승인 후 `chromeStoreUrl` 반영과 재배포.
