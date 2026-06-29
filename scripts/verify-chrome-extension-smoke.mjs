import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(
  readFileSync("extensions/chrome/manifest.json", "utf8"),
);
const background = readFileSync("extensions/chrome/background.js", "utf8");
const popupHtml = readFileSync("extensions/chrome/popup.html", "utf8");
const popupJs = readFileSync("extensions/chrome/popup.js", "utf8");
const popupCss = readFileSync("extensions/chrome/popup.css", "utf8");
const chromeReadme = readFileSync("extensions/chrome/README.md", "utf8");

function assertIncludes(source, text, message) {
  assert.ok(source.includes(text), message);
}

assert.equal(manifest.manifest_version, 3, "Chrome extension should use MV3.");
assert.equal(
  manifest.action?.default_popup,
  "popup.html",
  "Chrome action should open popup.html.",
);
assert.equal(
  manifest.background?.service_worker,
  "background.js",
  "Chrome extension should register background.js as the service worker.",
);
assert.deepEqual(
  [...manifest.host_permissions].sort(),
  ["http://127.0.0.1/*", "http://localhost/*"],
  "Chrome extension should only request local host permissions.",
);

for (const permission of ["activeTab", "contextMenus", "scripting", "storage"]) {
  assert.ok(
    manifest.permissions.includes(permission),
    `Chrome extension should request ${permission}.`,
  );
}

for (const requiredText of [
  "prompt-ai-studio-refine-selection",
  'contexts: ["selection"]',
  "Refine with Prompt AI Studio",
  "pendingSelection",
  "chrome.storage.session.set",
  "chrome.action.setBadgeText",
]) {
  assertIncludes(
    background,
    requiredText,
    `Chrome background should include ${requiredText}.`,
  );
}

for (const requiredText of [
  "Chrome refine workflow",
  "Smoke evidence",
  "review gate",
  "reviewRequired",
  "POST /api/integrations/refine",
  "copy-ready handoff after operator review",
  "handoff evidence packet + manual fallback",
  'id="studioUrl"',
  'id="rawInput"',
  'id="targetAI"',
  'id="refineButton"',
  'id="evidenceButton"',
  'id="evidenceFallback"',
]) {
  assertIncludes(
    popupHtml,
    requiredText,
    `Chrome popup HTML should include ${requiredText}.`,
  );
}

for (const requiredText of [
  "http://localhost:3000",
  "getChromeExtensionApi",
  "localHostnames",
  "normalizeStudioUrl",
  "api.storage.local",
  "api.storage.session",
  "pendingSelection",
  "lastHandoffStorageKey",
  "reviewRequired",
  "buildChromeHandoffEvidencePacket",
  "Copy only after review gate",
  "Save execution feedback only after the external AI result is reviewed",
  "navigator.clipboard.writeText",
  "evidenceFallback.hidden = false",
  "preview only · Chrome runtime unavailable",
]) {
  assertIncludes(
    popupJs,
    requiredText,
    `Chrome popup JS should include ${requiredText}.`,
  );
}

for (const requiredText of [
  ".workflow",
  ".evidencePanel",
  ".handoffReview",
  ".evidenceFallback",
]) {
  assertIncludes(
    popupCss,
    requiredText,
    `Chrome popup CSS should include ${requiredText}.`,
  );
}

for (const requiredText of [
  "npm run smoke:chrome-extension",
  "Load unpacked",
  "review-required handoff",
  "Smoke evidence",
  "local-only",
  "manual evidence textarea",
]) {
  assertIncludes(
    chromeReadme,
    requiredText,
    `Chrome extension README should include ${requiredText}.`,
  );
}

console.log("Chrome extension smoke verification passed.");
