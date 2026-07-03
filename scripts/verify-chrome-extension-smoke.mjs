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
    "- command: npm run smoke:chrome-extension -- --out output/smoke/chrome-extension-smoke.md",
    "- status: pass",
    "- external services: not contacted",
    "- operator gate: local packet only; load unpacked Chrome review is still a separate manual check.",
    ...buildGitProvenanceLines(gitProvenance),
    "",
    "## Verified contract",
    "- MV3 popup and service worker are present.",
    "- Host permissions stay local-only.",
    "- Selection capture, session restore, reviewRequired handoff, and evidence fallback strings are present.",
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
  "--out",
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

const chromeSmokeEvidenceText = buildChromeSmokeEvidenceText();

assert.match(
  chromeSmokeEvidenceText,
  /Host permissions stay local-only/,
  "Chrome smoke evidence should record local-only host permissions",
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
