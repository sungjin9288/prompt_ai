import assert from "node:assert/strict";
import { readSource } from "./lib/read-source.mjs";

const source = readSource("src/components/studio/studio-workspace.tsx");

function assertIncludes(text, message) {
  assert.ok(source.includes(text), message);
}

function assertMatches(pattern, message) {
  assert.match(source, pattern, message);
}

assertIncludes(
  "const externalHandoffBlockedByPendingRegeneration = Boolean(",
  "Studio should derive an external handoff block from pending regeneration state",
);
assertIncludes(
  "const [pendingRegenerationRecovery, setPendingRegenerationRecovery] =",
  "Studio should keep a recovery snapshot for pending regeneration state",
);
assertMatches(
  /const saveBlockedByPendingRegeneration\s*=\s*externalHandoffBlockedByPendingRegeneration;/,
  "Save blocking should share the same stale handoff guard",
);
assertMatches(
  /function capturePendingRegenerationRecovery\(\)[\s\S]*?setPendingRegenerationRecovery\([\s\S]*?\(current\): PendingRegenerationRecovery =>[\s\S]*?current \?\? \{[\s\S]*?rawInput,[\s\S]*?savedCurrent,[\s\S]*?targetAiPackagePreviewKey,[\s\S]*?\},/,
  "Applying an improvement brief should capture the previous Studio input state without overwriting an existing recovery snapshot",
);
assertMatches(
  /function keepPreviousGeneratedResult\(\)[\s\S]*?setRawInput\(pendingRegenerationRecovery\.rawInput\)[\s\S]*?setPendingRegenerationNotice\(""\)[\s\S]*?setPendingRegenerationRecovery\(null\)/,
  "Studio should restore the previous input state when keeping the prior result",
);

assertMatches(
  /function savePrompt\(\)[\s\S]*?if \(saveBlockedByPendingRegeneration\)[\s\S]*?새 결과를 생성한 뒤 저장하세요[\s\S]*?setPrompts\(/,
  "savePrompt should reject stale generated results before saving",
);
assertMatches(
  /async function copyPrompt[\s\S]*?if \(externalHandoffBlockedByPendingRegeneration\)[\s\S]*?새 결과를 생성한 뒤 복사하세요[\s\S]*?copyTextToClipboard\(activeVersion\.content\)/,
  "copyPrompt should reject stale generated prompts before copying",
);
assertMatches(
  /async function copyTargetAiHandoffPackage[\s\S]*?if \(externalHandoffBlockedByPendingRegeneration\)[\s\S]*?새 결과를 생성한 뒤 AI 전달 패키지를 복사하세요[\s\S]*?copyTextToClipboard\(\s*activeTargetAiHandoffPackageText,/,
  "AI handoff package copying should reject stale generated packages",
);

assertMatches(
  /disabled=\{externalHandoffBlockedByPendingRegeneration\}[\s\S]*?재생성 후 복사/,
  "Current version copy button should be disabled while regeneration is pending",
);
assertMatches(
  /disabled=\{externalHandoffBlockedByPendingRegeneration\}[\s\S]*?재생성 후 패키지 복사/,
  "AI handoff package copy button should be disabled while regeneration is pending",
);
assertMatches(
  /disabled=\{externalHandoffBlockedByPendingRegeneration\}[\s\S]*?재생성 후 패키지 보기/,
  "AI handoff package preview button should be disabled while regeneration is pending",
);
assertMatches(
  /disabled=\{\s*savedCurrent \|\| saveBlockedByPendingRegeneration\s*\}[\s\S]*?재생성 후 저장/,
  "Library save button should be disabled while regeneration is pending",
);
assertMatches(
  /targetAiPackagePreviewOpen &&\s*!externalHandoffBlockedByPendingRegeneration/,
  "AI handoff package preview panel should be hidden while regeneration is pending",
);
assertMatches(
  /pendingRegenerationRecovery[\s\S]*?onClick=\{keepPreviousGeneratedResult\}[\s\S]*?이전 결과 유지/,
  "Pending regeneration banner should expose a keep previous result action",
);

console.log("Studio stale handoff guard verification passed.");
