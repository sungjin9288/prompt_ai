# Local Smoke Evidence

This directory keeps local smoke packets for integration surfaces that can be
checked without external AI access.

Expected packets:

- `integrations-smoke-summary.md`: integrated preflight summary for the local packets.
- `chrome-extension-smoke.md`: unpacked Chrome extension file contract.
- `mcp-bridge-smoke.md`: stdio MCP bridge self-test contract.
- `mcp-client-smoke.md`: stdio JSON-RPC MCP client call sequence and feedback inbox contract.
- `learning-feedback-smoke.md`: Learning feedback-improvement queue contract.

## Operator Run Order

Use these files as the preflight record before sending any refined prompt to an
external AI surface.

Run `npm run smoke:integrations` to refresh all local smoke packets and
`integrations-smoke-summary.md` in one pass.

1. Run the matching local smoke command and keep the generated packet:
   `npm run smoke:chrome-extension -- --out output/smoke/chrome-extension-smoke.md`,
   `npm run smoke:mcp -- --out output/smoke/mcp-bridge-smoke.md`,
   `npm run smoke:mcp-client -- --out output/smoke/mcp-client-smoke.md`, or
   `npm run smoke:learning-feedback -- --out output/smoke/learning-feedback-smoke.md`.
2. Open the Studio Integrations page and copy the matching actual evidence
   packet only after the real Chrome popup or MCP client returned a
   review-required handoff package.
3. Paste the refined prompt into the target AI only after the local packet and
   actual evidence packet both exist.
4. Keep `confirmSave: false` until the external AI result has been reviewed.
   Change it to `true` only when the result should train the feedback loop.
5. Confirm the feedback inbox by UI, API, or curl after saving reviewed feedback.

## Actual Evidence Fields

Chrome loaded extension evidence should record: runtime, source, review gate,
target AI, session, evidence result, and feedback record.

MCP client evidence should record: client, target AI, tool sequence, review
gate, evidence result, and feedback record.

Learning feedback evidence should record: command, status, external service
boundary, low-confidence condition, Studio validation draft, Library validation
filter, release evidence command, release candidate command, and feedback memory
action.

## Storage Rules

`output/smoke` is limited to stable local smoke packets. Do not commit ad hoc
actual AI outputs, tokens, customer text, or one-off operator notes here. Store
sanitized release or handoff records generated from the shared verification
manifest in `docs/evidence`, or keep private operator evidence outside the repo.

Release or handoff records generated from the shared verification manifest stay
in `docs/evidence`.
