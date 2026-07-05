# MCP Bridge Smoke Evidence

- server: prompt-ai-studio
- version: 0.1.0
- protocolVersion: 2025-11-25
- tools: get_context_profile, refine_prompt, create_handoff_package, save_execution_feedback
- command: npm run smoke:mcp -- --out output/smoke/mcp-bridge-smoke.md
- status: pass
- external services: not contacted
- operator gate: local packet only; connect a real MCP client only after review.
- branch: main
- commit: afaea8b
- workingTree: dirty
- changedFiles: 14

## Verified contract
- initialize returns the expected MCP protocol version and tool capability.
- tools/list exposes context, refine, handoff, and feedback tools.
- get_context_profile stays read-only and review-required.
- refine_prompt and create_handoff_package return review-required handoff packages.
- MCP operation defaults are applied when tool arguments omit target, domain, goal, or source URL.
- Local API unavailability falls back to a review-required MCP package instead of an empty handoff.
- save_execution_feedback does not write unless confirmSave is true.
- This smoke does not contact GPT, Claude, Codex, Gemini, OpenAI, or Supabase.
