# External AI Operator Guide

Prompt AI Studio를 Chrome, Codex, Claude, GPT-compatible MCP client와 연결해 쓰는 운영 가이드입니다. 목표는 자동 정제는 로컬 Studio가 담당하고, 외부 AI 전달은 사람이 검토한 handoff package만 복사해 실행하는 것입니다.

## 네가 먼저 할 일

1. 로컬 앱 실행

```bash
cd /Users/sungjin/dev/personal/prompt-ai-studio
npm run dev
```

2. 브라우저에서 확인

```text
http://localhost:3000/integrations
```

3. 변경 후 기본 검증

```bash
npm run verify:integrations
```

4. 로컬 smoke evidence 저장

```bash
npm run smoke:integrations
npm run smoke:chrome-extension -- --out output/smoke/chrome-extension-smoke.md
npm run smoke:mcp -- --out output/smoke/mcp-bridge-smoke.md
npm run smoke:learning-feedback -- --out output/smoke/learning-feedback-smoke.md
```

5. 실제 외부 AI에 붙이기 전 확인

- Chrome extension 또는 MCP client 중 하나만 먼저 연결합니다.
- 정제 결과에 `reviewRequired` 또는 review-required 문구가 있는지 확인합니다.
- GPT, Claude, Codex, Gemini에 자동 전송하지 않고 handoff package를 먼저 읽습니다.
- 실행 결과가 의미 있을 때만 `save_execution_feedback`에 `confirmSave: true`를 사용합니다.

## 실행 증거 체크

외부 AI로 넘기기 전후에는 아래 순서대로 증거를 남깁니다.

1. 로컬 연결: `localhost:3000`과 `POST /api/integrations/refine` 응답을 확인합니다.
2. 정제 결과: `reviewRequired true`와 target handoff package를 확인합니다.
3. 증거 저장: `npm run smoke:integrations`로 Chrome, MCP, Learning smoke evidence file을 먼저 남깁니다.
4. 전달 승인: copy-ready prompt와 missing context review를 확인한 뒤 붙여넣습니다.
5. 피드백 증거: rating, result summary, inbox record를 `confirmSave: true` 후 확인합니다.

자동화 기본 원칙은 `Refine automatically, save evidence, deliver with review.`입니다. 감사 출처는 `chrome-selection`, `mcp-refine`, `local-smoke-evidence`, `target-ai-handoff` 순서로 남기고, `local-smoke-evidence`가 `target-ai-handoff`보다 먼저 있어야 합니다.

## Chrome으로 테스트

1. 확장 파일 계약을 먼저 확인합니다.

```bash
npm run smoke:chrome-extension -- --out output/smoke/chrome-extension-smoke.md
```

2. 앱을 `http://localhost:3000`에서 실행합니다.
3. Chrome에서 `chrome://extensions`를 엽니다.
4. Developer mode를 켭니다.
5. `Load unpacked`를 누르고 아래 폴더를 선택합니다.

```text
/Users/sungjin/dev/personal/prompt-ai-studio/extensions/chrome
```

6. 아무 웹페이지에서 텍스트를 선택합니다.
7. 우클릭 후 `Refine with Prompt AI Studio`를 누르거나 popup을 엽니다.
8. popup에서 값을 확인합니다.

```text
Studio URL: http://localhost:3000
Target AI: codex, gpt, claude, gemini, 또는 auto
Domain: 개발
Goal: 전문 프롬프트로 변환
```

9. `Refine selected text`를 누릅니다.
10. 결과를 읽고 문제가 없으면 `Copy`를 누릅니다.
11. 이전 결과가 복원됐는데 더 이상 쓰지 않을 결과라면 `Clear`를 누릅니다.

## Codex MCP 설정

Codex와 GPT-compatible MCP client는 같은 server config를 씁니다. Codex는 repo-aware 구현 브리프를 많이 다루므로 `PROMPT_AI_STUDIO_TARGET_AI=codex`를 기본값으로 둡니다.

```json
{
  "mcpServers": {
    "prompt-ai-studio": {
      "command": "node",
      "args": [
        "/Users/sungjin/dev/personal/prompt-ai-studio/mcp/prompt-ai-studio.mjs"
      ],
      "env": {
        "PROMPT_AI_STUDIO_URL": "http://localhost:3000",
        "PROMPT_AI_STUDIO_TARGET_AI": "codex",
        "PROMPT_AI_STUDIO_DOMAIN": "개발",
        "PROMPT_AI_STUDIO_GOAL": "전문 프롬프트로 변환",
        "PROMPT_AI_STUDIO_SOURCE_URL": "mcp://codex"
      }
    }
  }
}
```

설정 후 self-test:

```bash
npm run smoke:mcp -- --out output/smoke/mcp-bridge-smoke.md
```

클라이언트 설정에서 절대 경로가 필요하면 같은 self-test를 직접 실행합니다.

```bash
node /Users/sungjin/dev/personal/prompt-ai-studio/mcp/prompt-ai-studio.mjs --self-test --out output/smoke/mcp-bridge-smoke.md
```

Codex에서 smoke prompt:

```text
Use prompt-ai-studio get_context_profile, then refine_prompt.
rawInput: "이 기능을 구현할 수 있게 명확한 Codex 작업 지시서로 바꿔줘."
```

Codex 작업 브리프 품질 gate:

- 시작 전에 성공 기준, 수정 범위, 금지 범위, 검증 명령이 handoff package에 들어 있는지 확인합니다.
- repo 작업은 `karpathy-guidelines -> repo-intake -> edit-discipline -> verify-gate` 순서로 진행합니다.
- LazyCodex식 운영 패턴은 `계획 -> 실행 -> 리뷰 -> 검증 -> 증적`으로만 반영하고, 외부 hook, telemetry, global Codex 설정은 이 프로젝트에 복사하지 않습니다.
- Hermes식 운영 패턴은 provider/profile/session/logs UI 참고로만 사용하고, Hermes Agent 런타임이나 Electron desktop shell은 붙이지 않습니다.
- raw OpenAI API keys, Supabase service-role keys, 개인 원문 전문은 Codex handoff package에 넣지 않습니다.

완료 기준:

- `get_context_profile` 결과에 `reviewRequired`와 operation defaults가 보입니다.
- `refine_prompt` 결과가 copy-ready handoff package입니다.
- Codex 실행 전 사람이 handoff package를 검토합니다.

## Claude 또는 GPT-compatible MCP 설정

Claude에 붙일 때는 target 기본값만 바꿉니다.

```json
{
  "mcpServers": {
    "prompt-ai-studio": {
      "command": "node",
      "args": [
        "/Users/sungjin/dev/personal/prompt-ai-studio/mcp/prompt-ai-studio.mjs"
      ],
      "env": {
        "PROMPT_AI_STUDIO_URL": "http://localhost:3000",
        "PROMPT_AI_STUDIO_TARGET_AI": "claude",
        "PROMPT_AI_STUDIO_DOMAIN": "전략/문서",
        "PROMPT_AI_STUDIO_GOAL": "전문 프롬프트로 변환",
        "PROMPT_AI_STUDIO_SOURCE_URL": "mcp://claude"
      }
    }
  }
}
```

GPT-compatible client는 `PROMPT_AI_STUDIO_TARGET_AI`를 `gpt`로 바꿉니다.

## MCP 도구 사용 순서

1. `get_context_profile`

목적: 현재 컨텍스트 정책, 사용 가능한 scope, operation defaults, review-required 원칙 확인.

2. `refine_prompt`

목적: 원문을 target AI용 전문 handoff package로 정제.

3. `create_handoff_package`

목적: 이미 만든 draft나 prompt text를 외부 AI에 전달 가능한 package로 포장.

4. `save_execution_feedback`

목적: 외부 AI 실행 결과를 학습 후보로 정리. 실제 저장은 `confirmSave: true`일 때만 수행.

## 피드백 저장 기준

저장해도 되는 경우:

- 외부 AI 실행 결과가 실제로 좋았거나 나빴고, 다음 정제에 반영할 가치가 있습니다.
- 어떤 target AI에서 실행했는지 알고 있습니다.
- 결과 요약과 개선 메모를 사람이 확인했습니다.

저장하지 말아야 하는 경우:

- 아직 결과를 검토하지 않았습니다.
- 민감한 정보나 외부에 남기면 안 되는 원문이 포함되어 있습니다.
- 단순 테스트라서 학습 신호로 가치가 없습니다.

저장 예시:

```json
{
  "resultSummary": "Codex가 구현은 완료했지만 테스트 누락을 지적해야 했다.",
  "rating": "neutral",
  "targetAI": "codex",
  "notes": "다음 handoff에는 검증 명령과 완료 기준을 더 강하게 넣는다.",
  "confirmSave": true
}
```

저장 흐름을 바꾼 뒤에는 Learning feedback 큐 smoke evidence를 남깁니다.

```bash
npm run smoke:learning-feedback -- --out output/smoke/learning-feedback-smoke.md
```

## 문제 대응

앱 연결 실패:

```bash
npm run dev
```

MCP self-test:

```bash
npm run smoke:mcp -- --out output/smoke/mcp-bridge-smoke.md
```

직접 실행:

```bash
node /Users/sungjin/dev/personal/prompt-ai-studio/mcp/prompt-ai-studio.mjs --self-test --out output/smoke/mcp-bridge-smoke.md
```

통합 검증:

```bash
npm run verify:integrations
```

Learning feedback 큐 확인:

```bash
npm run smoke:learning-feedback -- --out output/smoke/learning-feedback-smoke.md
```

Chrome popup 변경이 반영되지 않음:

- `chrome://extensions`에서 Prompt AI Studio extension을 Reload 합니다.
- popup의 `Studio URL`이 `http://localhost:3000`인지 확인합니다.

## 운영 원칙

- 자동화 범위는 로컬 정제까지입니다.
- 외부 AI 계정으로의 전달은 항상 사람이 검토한 뒤 복사합니다.
- Codex 작업은 구현 브리프와 검증 명령을 명확히 포함합니다.
- Claude/GPT/Gemini 작업은 출력 형식, 가정, 금지 조건을 handoff package에서 확인합니다.
- 좋은 결과와 실패 결과는 `save_execution_feedback`으로 학습 후보화합니다.
