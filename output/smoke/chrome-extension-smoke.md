# Chrome Extension Smoke Evidence

- manifestVersion: 3
- popup: popup.html
- background: background.js
- hostPermissions: http://127.0.0.1/*, http://localhost/*, https://*/*
- permissions: activeTab, contextMenus, scripting, storage
- contentScriptMatches: https://chat.openai.com/*, https://chatgpt.com/*, https://claude.ai/*, https://gemini.google.com/*
- command: npm run smoke:chrome-extension -- --out output/smoke/chrome-extension-smoke.md
- status: pass
- external services: not contacted
- operator gate: local packet only; load unpacked Chrome review is still a separate manual check.
- branch: main
- commit: b774201
- workingTree: dirty
- changedFiles: 9

## Verified contract
- MV3 popup and service worker are present.
- Host permissions cover local dev origins plus any https production origin.
- Selection capture, session restore, reviewRequired handoff, and evidence fallback strings are present.
- In-page improve content scripts mount a 개선 button on ChatGPT, Claude, and Gemini with adapter fallback chains and a background refine proxy.
- This smoke does not load Chrome or contact external AI services.
