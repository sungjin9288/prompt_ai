# Prompt AI Studio Chrome Extension

Minimal unpacked Chrome extension for testing the external refine flow.

## Load locally

1. Run the local extension smoke check.

```bash
npm run smoke:chrome-extension
```

2. Run the app at `http://localhost:3000`.
3. Open `chrome://extensions`.
4. Enable Developer mode.
5. Choose `Load unpacked`.
6. Select `extensions/chrome`.

`npm run smoke:chrome-extension` checks the manifest, background selection
capture, popup review-required workflow, local-only Studio URL guard, session
restore, and manual evidence fallback. It does not load Chrome for you.
Add `-- --out path/to/chrome-smoke.md` when the smoke evidence packet should be
saved as a local operator artifact.

## Flow

The popup shows the operating order as `01 선택 수집`, `02 Studio 정제`,
and `03 검토 전달` before the refine form, so the operator can confirm capture,
local refine, and review-required handoff delivery in one glance.
The popup also shows a `Smoke evidence` panel for runtime, capture, refine,
deliver, and evidence packet checks, so a static preview or loaded extension
can be checked against the same evidence contract used in Integrations.
The handoff result area summarizes review gate, target AI, source, and session
save state before the handoff text, so the operator can decide whether copying
is allowed.
Use `Evidence` after a handoff is generated or restored to copy the same
review gate, target AI, source, session, model, quality, domain, and goal as a
Chrome handoff evidence packet.
If clipboard access is blocked, the popup opens a manual evidence textarea so
the same packet can still be selected and copied.

1. Select text on any page.
2. Right-click and choose `Refine with Prompt AI Studio`, or open the popup directly while the text is still selected.
3. Open the Prompt AI Studio extension popup.
4. Confirm `Studio URL`, `Target AI`, `Domain`, and `Goal`.
5. Click `Refine selected text`.
6. Review the returned target AI handoff package.
7. Copy the handoff package into ChatGPT, Claude, Codex, Gemini, or another MCP-capable client.

The extension calls `POST /api/integrations/refine` and keeps delivery review-required.
The popup also keeps the last generated handoff package in
`chrome.storage.session` for the active browser session, so reopening the popup
can restore the last review-required result with target, source page, and saved
time context. Use `Clear` when the restored package should no longer be copied
or reused.

## Local settings

The popup stores `Studio URL`, `Target AI`, `Domain`, and `Goal` in
`chrome.storage.local` so repeated refine tests keep the same operating context.
Keep `Studio URL` local-only:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

Invalid or non-local URLs fall back to `http://localhost:3000`.

## Static preview

Opening `popup.html` outside the loaded extension is only a layout preview. In
that mode the popup shows `Chrome extension runtime is unavailable`, skips page
selection and session restore, and keeps the form visible for static smoke
checks.
