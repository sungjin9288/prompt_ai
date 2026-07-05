import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  buildGitProvenance,
  buildGitProvenanceLines,
} from "./lib/git-provenance.mjs";
import { readSource } from "./lib/read-source.mjs";

function getOutputPath(args) {
  const outIndex = args.indexOf("--out");

  if (outIndex === -1) {
    return null;
  }

  const outputPath = args[outIndex + 1];

  assert.ok(outputPath, "--out requires a file path");
  assert.equal(
    args.length,
    outIndex + 2,
    "smoke:chrome-extension only accepts --out <file>",
  );

  return outputPath;
}

const outputPath = getOutputPath(process.argv.slice(2));

const manifest = JSON.parse(readSource("extensions/chrome/manifest.json"));
const background = readSource("extensions/chrome/background.js");
const popupHtml = readSource("extensions/chrome/popup.html");
const popupJs = readSource("extensions/chrome/popup.js");
const popupCss = readSource("extensions/chrome/popup.css");
const chromeReadme = readSource("extensions/chrome/README.md");
const adaptersJs = readSource("extensions/chrome/content/adapters.js");
const inpageJs = readSource("extensions/chrome/content/inpage.js");
const inpageCss = readSource("extensions/chrome/content/inpage.css");

function assertIncludes(source, text, message) {
  assert.ok(source.includes(text), message);
}

function buildChromeSmokeEvidenceText() {
  const gitProvenance = buildGitProvenance();

  return [
    "# Chrome Extension Smoke Evidence",
    "",
    `- manifestVersion: ${manifest.manifest_version}`,
    `- popup: ${manifest.action?.default_popup}`,
    `- background: ${manifest.background?.service_worker}`,
    `- hostPermissions: ${[...manifest.host_permissions].sort().join(", ")}`,
    `- permissions: ${[...manifest.permissions].sort().join(", ")}`,
    `- contentScriptMatches: ${[...contentScript.matches].sort().join(", ")}`,
    "- command: npm run smoke:chrome-extension -- --out output/smoke/chrome-extension-smoke.md",
    "- status: pass",
    "- external services: not contacted",
    "- operator gate: local packet only; load unpacked Chrome review is still a separate manual check.",
    ...buildGitProvenanceLines(gitProvenance),
    "",
    "## Verified contract",
    "- MV3 popup and service worker are present.",
    "- Host permissions cover local dev origins plus any https production origin.",
    "- Selection capture, session restore, reviewRequired handoff, and evidence fallback strings are present.",
    "- In-page improve content scripts mount a 개선 button on ChatGPT, Claude, and Gemini with adapter fallback chains and a background refine proxy.",
    "- This smoke does not load Chrome or contact external AI services.",
  ].join("\n");
}

function writeChromeSmokeEvidence(outputPath, evidenceText) {
  if (!outputPath) {
    return;
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${evidenceText}\n`, "utf8");
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
  ["http://127.0.0.1/*", "http://localhost/*", "https://*/*"],
  "Chrome extension should request local host permissions plus any https origin.",
);

assert.equal(
  manifest.version,
  "0.3.0",
  "Chrome extension version should be 0.3.0 for the in-page improve phase.",
);

const contentScript = manifest.content_scripts?.[0];

assert.ok(
  contentScript,
  "Chrome extension manifest should register a content_scripts entry.",
);
assert.deepEqual(
  [...contentScript.matches].sort(),
  [
    "https://chat.openai.com/*",
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
  ],
  "In-page content script should match chatgpt.com, chat.openai.com, claude.ai, and gemini.google.com.",
);
assert.deepEqual(
  contentScript.js,
  ["content/adapters.js", "content/inpage.js"],
  "In-page content script should inject adapters.js then inpage.js.",
);
assert.deepEqual(
  contentScript.css,
  ["content/inpage.css"],
  "In-page content script should inject inpage.css.",
);
assert.equal(
  contentScript.run_at,
  "document_idle",
  "In-page content script should run at document_idle.",
);

for (const permission of ["activeTab", "contextMenus", "scripting", "storage"]) {
  assert.ok(
    manifest.permissions.includes(permission),
    `Chrome extension should request ${permission}.`,
  );
}

for (const size of [16, 32, 48, 128]) {
  const iconPath = `icons/icon-${size}.png`;

  assert.equal(
    manifest.icons?.[String(size)],
    iconPath,
    `Chrome extension manifest icons should map ${size} to ${iconPath}.`,
  );
  assert.equal(
    manifest.action?.default_icon?.[String(size)],
    iconPath,
    `Chrome extension manifest action.default_icon should map ${size} to ${iconPath}.`,
  );
}

for (const requiredText of [
  "prompt-ai-studio-refine-selection",
  'contexts: ["selection"]',
  "Refine with Prompt AI Studio",
  "pendingSelection",
  "chrome.storage.session.set",
  "chrome.action.setBadgeText",
  // In-page refine proxy: storage-key reuse, URL guard, message type,
  // timeout, and improved-prompt extraction.
  'const studioUrlStorageKey = "prompt-ai-studio:url"',
  "function isAllowedStudioUrl(url)",
  'const localHostnames = new Set(["localhost", "127.0.0.1"])',
  "function extractImprovedPrompt(data)",
  "data?.promptPackage?.versions?.[0]",
  "data?.handoffPackages?.[0]?.handoffText",
  "new AbortController()",
  "const refineTimeoutMs = 15000",
  "/api/integrations/refine",
  'message?.type === "pas-refine"',
  'message?.type === "pas-studio-url"',
  "chrome.runtime.onMessage.addListener",
  "return true;",
]) {
  assertIncludes(
    background,
    requiredText,
    `Chrome background should include ${requiredText}.`,
  );
}

// The URL guard is duplicated from popup.js (MV3 plain scripts can't import).
// Pin the identical body in BOTH files so they can never drift silently.
for (const requiredText of [
  "function isAllowedStudioUrl(url)",
  'const localHostnames = new Set(["localhost", "127.0.0.1"])',
  'if (url.protocol === "https:")',
]) {
  assertIncludes(
    background,
    requiredText,
    `Chrome background URL guard should match popup.js: ${requiredText}.`,
  );
  assertIncludes(
    popupJs,
    requiredText,
    `Chrome popup URL guard should match background.js: ${requiredText}.`,
  );
}

for (const requiredText of [
  "window.pasInpageAdapters",
  "selectAdapter",
  'id: "chatgpt"',
  'id: "claude"',
  'id: "gemini"',
  'hostname === "chatgpt.com"',
  'hostname === "chat.openai.com"',
  'hostname === "claude.ai"',
  'hostname === "gemini.google.com"',
  // ChatGPT fallback chain.
  '"#prompt-textarea"',
  'form div[contenteditable="true"]',
  '"form textarea"',
  // Claude fallback chain.
  'div[contenteditable="true"].ProseMirror',
  // Gemini fallback chain.
  '"rich-textarea .ql-editor"',
  // setText strategy that preserves framework state.
  'document.execCommand("selectAll"',
  'document.execCommand("insertText", false, text)',
  'new InputEvent("input"',
  "HTMLTextAreaElement.prototype",
  '"value"',
  "descriptor.set.call(element, text)",
]) {
  assertIncludes(
    adaptersJs,
    requiredText,
    `Chrome in-page adapters should include ${requiredText}.`,
  );
}

for (const requiredText of [
  'setAttribute("data-testid", "pas-inpage-improve")',
  "Prompt AI Studio로 개선",
  "개선",
  "개선 중…",
  "입력한 초안이 없습니다",
  "개선됨",
  "되돌리기",
  "복사",
  "Studio에서 열기",
  "buildStudioOpenUrl",
  '"/studio"',
  'type: "pas-refine"',
  'type: "pas-studio-url"',
  "window.pasInpageAdapters",
  "MutationObserver",
  "__pasTestSendMessage",
  "chrome.runtime.sendMessage",
  "navigator.clipboard.writeText",
  "Studio에 연결할 수 없습니다. 확장 팝업에서 Studio URL을 확인하세요.",
  "pas-inpage-root",
]) {
  assertIncludes(
    inpageJs,
    requiredText,
    `Chrome in-page content script should include ${requiredText}.`,
  );
}

for (const requiredText of [
  ".pas-inpage-root",
  "all: initial",
  ".pas-inpage-improve",
  ".pas-inpage-bar",
  "#67d4c3",
  "#13171d",
  "z-index: 2147483000",
]) {
  assertIncludes(
    inpageCss,
    requiredText,
    `Chrome in-page CSS should include ${requiredText}.`,
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
  "isAllowedStudioUrl",
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
  "extension runtime connected · local http or any https Studio URL",
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
  "--out",
  "Load unpacked",
  "review-required handoff",
  "Smoke evidence",
  "local-only",
  "manual evidence textarea",
  // In-page improve flow.
  "In-page 개선 (ChatGPT / Claude / Gemini)",
  "content/adapters.js",
  "buildStudioOpenUrl",
  "되돌리기",
  "복사",
  "Studio에서 열기",
  "fails **silently**",
  "prompt-ai-studio:url",
]) {
  assertIncludes(
    chromeReadme,
    requiredText,
    `Chrome extension README should include ${requiredText}.`,
  );
}

const chromeSmokeEvidenceText = buildChromeSmokeEvidenceText();

assert.match(
  chromeSmokeEvidenceText,
  /Host permissions cover local dev origins plus any https production origin/,
  "Chrome smoke evidence should record the local + https host permission contract",
);
assert.match(
  chromeSmokeEvidenceText,
  /does not load Chrome or contact external AI services/,
  "Chrome smoke evidence should state the local-only execution boundary",
);

writeChromeSmokeEvidence(outputPath, chromeSmokeEvidenceText);

if (outputPath) {
  console.log(`Chrome extension smoke evidence written to ${outputPath}.`);
}

console.log("Chrome extension smoke verification passed.");
