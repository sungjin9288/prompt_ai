# Integrations Smoke Summary

- command: npm run smoke:integrations
- gate: local packets pass before external AI delivery
- external services: not contacted
- branch: main
- commit: a949102
- workingTree: dirty
- changedFiles: 14

## Packets
- Chrome extension: output/smoke/chrome-extension-smoke.md
- MCP bridge: output/smoke/mcp-bridge-smoke.md
- MCP client: output/smoke/mcp-client-smoke.md
- Learning feedback: output/smoke/learning-feedback-smoke.md

## Pass condition
- Chrome extension file contract passed.
- MCP bridge self-test contract passed.
- MCP client stdio JSON-RPC smoke passed.
- Learning feedback queue contract passed.
- Review-required delivery still happens after local packet review.
- confirmSave stays false until the external AI result is reviewed.
