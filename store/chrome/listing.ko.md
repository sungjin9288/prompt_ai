# Chrome Web Store 등록 문안 (한국어)

이 문서는 Chrome Web Store 개발자 대시보드의 "스토어 등록정보(Store listing)" 탭에
그대로 붙여넣기 위한 필드별 문안입니다. 각 필드는 실제 폼의 글자 수 제한과 함께
표시했습니다. 프로덕션 URL은 `https://prompt-ai-studio.netlify.app`으로
확정되어 있습니다.

## 이름 (제한: 45자)

```
Prompt AI Studio Refine
```

- 글자 수: 23자 (제한 이내)
- `extensions/chrome/manifest.json`의 `"name"` 필드와 반드시 동일해야 합니다.
  이미 동일합니다 — 별도 변경이 필요 없습니다.

## 짧은 설명 (제한: 132자)

```
ChatGPT·Claude·Gemini 입력창에서 바로 프롬프트를 개선하는 무료 로컬 우선 확장. 계정 없이 즉시 사용하세요.
```

- 글자 수: 62자 (제한 이내)

## 자세한 설명 (제한: 16,000자)

```
Prompt AI Studio Refine은 ChatGPT, Claude, Gemini의 입력창 옆에 "개선" 버튼을
띄워, 지금 작성 중인 초안을 그 자리에서 더 명확하고 전문적인 프롬프트로 바꿔주는
확장 프로그램입니다.

■ 이 확장이 하는 일
- ChatGPT(chatgpt.com, chat.openai.com), Claude(claude.ai), Gemini
  (gemini.google.com)의 입력창 옆에 "개선" 버튼을 표시합니다.
- 버튼을 누르면 현재 입력창의 초안을 읽어 사용자가 설정한 Studio 서버로 보내
  개선된 프롬프트를 돌려받고, 입력창 내용을 즉시 교체합니다.
- 결과가 마음에 들지 않으면 "되돌리기"로 원래 초안을 복원할 수 있습니다.
- "복사"로 개선된 프롬프트를 클립보드에 복사하거나, "Studio에서 열기"로
  개선된 프롬프트가 이미 채워진 Prompt AI Studio의 /improve 페이지를 새 탭에서
  열어 이어서 다듬을 수 있습니다.
- 확장 팝업에서 선택한 텍스트를 우클릭 메뉴(Refine with Prompt AI Studio)로
  바로 정제하는 별도 흐름도 제공합니다.

■ 이 확장이 하지 않는 일
- 회원가입이나 로그인 계정을 요구하지 않습니다.
- 방문자 추적, 광고 목적 쿠키, 사용자 행동 분석 스크립트를 포함하지 않습니다.
- 사용자가 명시적으로 개선 버튼을 누른 초안 외에는 어떤 페이지 콘텐츠도
  읽거나 전송하지 않습니다.
- 전송된 초안을 서버에 저장하지 않습니다 — 개선 결과를 계산하는 즉시 처리가
  끝나며, 별도 데이터베이스에 보관되지 않습니다.
- 유료 기능을 강제하지 않습니다. 이 확장은 전체 기능이 무료입니다. (Pro 등급은
  현재 준비 중이며 이 확장의 어떤 기능에도 아직 적용되지 않습니다.)

■ 설치 및 설정 방법
1. Chrome Web Store에서 확장을 설치합니다.
2. 확장 아이콘을 클릭해 팝업을 엽니다.
3. "Studio URL" 입력란에 사용할 Prompt AI Studio 서버 주소를 입력합니다
   (예: 운영자가 배포한 프로덕션 주소, 또는 로컬 개발 서버
   `http://localhost:3000`).
4. ChatGPT, Claude, Gemini 중 하나를 방문해 입력창 옆에 나타나는 "개선"
   버튼을 확인합니다.
5. 초안을 입력하고 "개선"을 눌러 결과를 확인합니다.

■ 지원 사이트
- ChatGPT: chatgpt.com, chat.openai.com
- Claude: claude.ai
- Gemini: gemini.google.com

■ 권한 사용 요약
이 확장이 요청하는 각 권한과 정확한 사용 목적은 아래 "권한 정당화" 섹션과
`https://prompt-ai-studio.netlify.app/privacy`에 항상 최신 상태로 게시되어
있습니다. 확장은 명시된 목적 외에는 어떤 권한도 사용하지 않습니다.

■ 문의
설치, 설정, 버그 신고는 앱 내 `/welcome` 페이지 또는 개인정보 처리방침에
안내된 지원 이메일로 연락해 주세요.
```

## 카테고리

- 추천: **Productivity**(생산성) 또는 **Tools**(도구) 중 Chrome Web Store가
  제공하는 명칭으로 선택합니다. 등록 시점 대시보드 옵션에 따라 "Productivity"를
  1순위로 선택하세요.

## 언어

- 기본 언어: **한국어**
- 추가 언어: **English** (아래 `listing.en.md` 문안을 별도 로캘로 등록)

## 개인정보처리방침 URL

```
https://prompt-ai-studio.netlify.app/privacy
```

## 웹사이트

```
https://prompt-ai-studio.netlify.app/welcome
```

## Single purpose(단일 목적) 설명

Chrome Web Store 정책은 확장마다 하나의 명확한 목적을 요구합니다. 심사
폼의 "Single purpose" 필드에 아래 문단을 그대로 사용하세요.

```
이 확장의 유일한 목적은 사용자가 ChatGPT, Claude, Gemini의 입력창에 작성 중인
프롬프트 초안을, 사용자가 지정한 Prompt AI Studio 서버를 통해 더 명확하고
전문적인 프롬프트로 개선해 같은 입력창에 반영하는 것입니다. 그 외의 브라우징
데이터 수집, 광고, 분석, 무관한 자동화 기능은 포함하지 않습니다.
```

## 권한 정당화 (Permissions justification)

Chrome Web Store 심사 폼은 `host_permissions`를 포함한 민감 권한마다 별도
정당화 텍스트를 요구합니다. `extensions/chrome/manifest.json`에 선언된
권한 전체를 기준으로 작성했습니다.

### activeTab

```
사용자가 확장 팝업을 열거나 우클릭 메뉴 "Refine with Prompt AI Studio"를
실행한 바로 그 순간의 활성 탭에서만, 사용자가 선택한 텍스트를 읽기 위해
필요합니다. 사용자의 명시적 조작 없이는 어떤 탭의 콘텐츠도 읽지 않습니다.
```

### storage

```
사용자가 설정한 Studio 서버 주소, 마지막 handoff 결과, 세션 상태 등 확장
자체의 설정 값을 브라우저 로컬에 저장하기 위해 필요합니다. 이 데이터는
사용자의 브라우저를 벗어나지 않으며 원격 서버에 동기화되지 않습니다.
```

### contextMenus

```
선택한 텍스트를 곧바로 개선할 수 있도록 우클릭 메뉴에 "Refine with Prompt AI
Studio" 항목 하나를 추가하기 위해 필요합니다. 다른 우클릭 메뉴 동작을
변경하거나 확장하지 않습니다.
```

### scripting

```
ChatGPT, Claude, Gemini 페이지의 입력창을 감지해 그 옆에 "개선" 버튼과 결과
UI를 삽입하기 위해 필요합니다. content_scripts로 선언된 세 사이트 외에는
스크립트를 주입하지 않습니다.
```

### host_permissions — https://*/*

```
Prompt AI Studio는 사용자가 자신의 서버(자체 호스팅 배포 또는 이 프로젝트의
프로덕션 배포)를 직접 지정해 사용하는 로컬 우선 도구이므로, 어떤 https 출처를
Studio 서버로 설정할지 사전에 알 수 없습니다. 이 권한은 오직 사용자가 확장
팝업에서 명시적으로 입력한 Studio URL로 개선 요청(POST /api/integrations/refine)을
보내는 데만 사용되며, 사용자가 지정하지 않은 다른 출처로는 어떤 요청도
보내지 않습니다. http://localhost/*와 http://127.0.0.1/*은 로컬 개발 서버
연결을 위해 별도로 선언되어 있습니다.
```

### content script hosts — chatgpt.com, chat.openai.com, claude.ai, gemini.google.com

```
in-page "개선" 버튼을 표시할 세 AI 채팅 서비스의 입력창 DOM을 감지하고 UI를
삽입하기 위해 필요합니다. 이 네 개 호스트 외 다른 사이트에는 콘텐츠 스크립트를
전혀 주입하지 않습니다.
```

## 데이터 사용 공개 매핑 (참고)

`SUBMISSION.md`의 "개인정보 처리 관행(Privacy practices)" 탭 체크리스트에서
사용할 사실 기반 매핑입니다. 자세한 내용은
`https://prompt-ai-studio.netlify.app/privacy` 참고.

| 항목 | 답변 근거 |
|---|---|
| 개인 식별 정보 수집 여부 | 수집하지 않음 — 계정/로그인 없음 |
| 사용자 활동(브라우징 이력 등) 수집 여부 | 수집하지 않음 |
| 위치 정보 수집 여부 | 수집하지 않음 |
| 웹사이트 콘텐츠 수집 여부 | 사용자가 "개선" 버튼을 누른 입력창 초안만 사용자 지정 서버로 전송 — 판매/광고/무관한 목적 사용 없음 |
| 데이터 판매 여부 | 판매하지 않음 |
| 사용자 동의 없는 목적 외 사용 여부 | 없음 — 초안은 개선 결과 계산에만 사용, 처리 후 서버에 저장하지 않음 |
