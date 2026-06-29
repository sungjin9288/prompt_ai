# Chrome Extension Smoke Evidence

- manifestVersion: 3
- popup: popup.html
- background: background.js
- hostPermissions: http://127.0.0.1/*, http://localhost/*
- permissions: activeTab, contextMenus, scripting, storage

## Verified contract
- MV3 popup and service worker are present.
- Host permissions stay local-only.
- Selection capture, session restore, reviewRequired handoff, and evidence fallback strings are present.
- This smoke does not load Chrome or contact external AI services.
