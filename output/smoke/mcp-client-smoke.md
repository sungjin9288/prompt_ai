# MCP Client Smoke Evidence

- client: stdio JSON-RPC
- server: prompt-ai-studio
- targetAI: codex
- feedbackInbox: temporary local JSONL
- command: npm run smoke:mcp-client -- --out output/smoke/mcp-client-smoke.md
- status: pass
- external services: not contacted
- local API: deterministic fallback URL
- operator gate: local packet only; external AI handoff still requires review-required output and confirmSave review.
- branch: main
- commit: a949102
- workingTree: dirty
- changedFiles: 14

## Verified contract
- initialize returns protocol version and tool capability.
- tools/list exposes get_context_profile, refine_prompt, create_handoff_package, and save_execution_feedback.
- get_context_profile returns read-only, review-required context policy.
- refine_prompt returns a review-required handoff package through the MCP client call path.
- save_execution_feedback with confirmSave true writes a temporary feedback inbox record.
- Feedback record preserves targetAI codex, positive rating, and the smoke result summary.

## Local-only evidence
- Temp inbox: created during the smoke run.
- The temp inbox path is not committed.
