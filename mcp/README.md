# Prompt AI Studio MCP Bridge

Local stdio MCP bridge for Prompt AI Studio. It exposes read-only context lookup, prompt refinement, handoff package, and feedback capture tools. `refine_prompt` and `create_handoff_package` call the local app API:

```text
POST /api/integrations/refine
```

The bridge returns a review-required target AI handoff package. If the local app API is unavailable because the dev server is not running, `refine_prompt` and `create_handoff_package` return a local MCP fallback package instead of sending an empty or failed handoff. HTTP errors from a running API are still surfaced as errors.

It does not send prompts directly to GPT, Claude, Codex, Gemini, or any other external AI.

## Prerequisites

Run Prompt AI Studio locally:

```bash
npm run dev
```

Default app URL:

```text
http://localhost:3000
```

Override with:

```bash
PROMPT_AI_STUDIO_URL=http://localhost:3000
```

Optional local context override:

```bash
PROMPT_AI_STUDIO_CONTEXT_PROFILE='{"workspaceId":"local","languageStrategy":"AI decides English or Korean-English hybrid prompt output."}'
```

Optional operation defaults for MCP clients:

```bash
PROMPT_AI_STUDIO_TARGET_AI=codex
PROMPT_AI_STUDIO_DOMAIN=개발
PROMPT_AI_STUDIO_GOAL=전문 프롬프트로 변환
PROMPT_AI_STUDIO_SOURCE_URL=mcp://codex
```

When a client omits `targetAI`, `domain`, `goal`, or `sourceUrl`,
`refine_prompt` and `create_handoff_package` use these defaults. Explicit tool
arguments still take priority.

Optional feedback inbox override:

```bash
PROMPT_AI_STUDIO_FEEDBACK_INBOX=/Users/sungjin/dev/personal/prompt-ai-studio/.prompt-ai-studio/mcp-feedback.jsonl
```

## MCP Client Config

Use this command from the project root:

```bash
node /Users/sungjin/dev/personal/prompt-ai-studio/mcp/prompt-ai-studio.mjs
```

Example client entry:

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

## Tools

### `get_context_profile`

Read-only context policy lookup. Use this before `refine_prompt` when the MCP client needs workspace scope, personalization policy, or delivery guardrails.

Optional input:

- `workspaceId`
- `allowedScopes`: `company`, `user`, `learning`, `skill`
- `purpose`

Response:

- `content[0].text`: context profile summary.
- `structuredContent.readOnly`: `true`.
- `structuredContent.reviewRequired`: `true`.
- `structuredContent.availableScopes`: allowed context scopes for the request.

### `refine_prompt`

Required input:

- `rawInput`: rough instruction, selected text, or task brief.

Optional input:

- `targetAI`: `auto`, `gpt`, `claude`, `codex`, or `gemini`.
- `sourceApp`: defaults to `mcp`.
- `domain`
- `goal`
- `sourceUrl`
- `outputLanguage`

Response:

- `content[0].text`: copy-ready target AI handoff package.
- `structuredContent.reviewRequired`: always expected to be `true`.
- `structuredContent.targetModel`: selected target model.
- `structuredContent.qualityScore`: package quality score.

### `create_handoff_package`

Create a copy-ready handoff package when the MCP client already has a draft or prompt text and needs a target AI delivery artifact.

Required input:

- `draft`: draft, prompt text, or rough instruction to package.

Optional input:

- `targetAI`: `auto`, `gpt`, `claude`, `codex`, or `gemini`.
- `deliveryMode`: only `review_required` is supported.
- `domain`
- `goal`
- `sourceUrl`
- `promptId`

Response:

- `content[0].text`: copy-ready target AI handoff package.
- `structuredContent.tool`: `create_handoff_package`.
- `structuredContent.deliveryMode`: `review_required`.
- `structuredContent.reviewRequired`: `true`.

### `save_execution_feedback`

Create a learning memory candidate from an external AI execution result. The tool only writes to the local JSONL inbox when `confirmSave` is `true`.

Required input:

- `resultSummary`: short summary of the external AI result or execution outcome.

Optional input:

- `rating`: `positive`, `neutral`, or `negative`.
- `notes`
- `promptId`
- `targetAI`: `gpt`, `claude`, `codex`, `gemini`, or `general`.
- `confirmSave`: append to the local feedback inbox when `true`.

Response:

- `content[0].text`: feedback summary, learning memory candidate, and improvement queue item.
- `structuredContent.saved`: whether the JSONL inbox was written.
- `structuredContent.record`: feedback record payload.

## Local Verification

```bash
npm run smoke:mcp
npm run smoke:mcp-client
npm run verify:integrations
```

`npm run smoke:mcp` runs the local bridge self-test without contacting GPT,
Claude, Codex, Gemini, OpenAI, or Supabase. Direct node execution is still
equivalent when a client setup needs the absolute path:

```bash
node /Users/sungjin/dev/personal/prompt-ai-studio/mcp/prompt-ai-studio.mjs --self-test
```

Add `-- --out path/to/mcp-smoke.md` when the smoke evidence packet should be
saved as a local operator artifact:

```bash
npm run smoke:mcp -- --out docs/evidence/mcp-bridge-smoke.md
```

`npm run smoke:mcp-client` runs the stdio bridge through a local JSON-RPC client
sequence. It checks initialize, tools/list, get_context_profile, refine_prompt,
and save_execution_feedback with `confirmSave: true`, writing only to a
temporary JSONL inbox.

```bash
npm run smoke:mcp-client -- --out docs/evidence/mcp-client-smoke.md
```

`npm run verify:integrations` also runs a temp feedback inbox check: it calls
`save_execution_feedback` with `confirmSave: true`, reads the JSONL record back,
and verifies the same parser used by the Integrations feedback inbox can find
the saved target AI, rating, and result summary.
