# Chrome Extension Smoke Evidence

- manifestVersion: 3
- popup: popup.html
- background: background.js
- hostPermissions: http://127.0.0.1/*, http://localhost/*, https://*/*
- permissions: activeTab, contextMenus, scripting, storage
- command: npm run smoke:chrome-extension -- --out output/smoke/chrome-extension-smoke.md
- status: pass
- external services: not contacted
- operator gate: local packet only; load unpacked Chrome review is still a separate manual check.
- branch: main
- commit: afaea8b
- workingTree: dirty
- changedFiles: 14

## Verified contract
- MV3 popup and service worker are present.
- Host permissions cover local dev origins plus any https production origin.
- Selection capture, session restore, reviewRequired handoff, and evidence fallback strings are present.
- This smoke does not load Chrome or contact external AI services.
