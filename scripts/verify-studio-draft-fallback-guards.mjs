import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const sourceRoots = ["src/app", "src/components"];

function listSourceFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return listSourceFiles(fullPath);
    }

    return /\.(tsx?|jsx?)$/.test(entry) ? [fullPath] : [];
  });
}

const sourceFiles = sourceRoots.flatMap(listSourceFiles);
const draftCalls = [];
const unguardedCalls = [];
let failureGuardCount = 0;

for (const filePath of sourceFiles) {
  const lines = readFileSync(filePath, "utf8").split("\n");

  lines.forEach((line, index) => {
    if (line.includes("writeStudioDraft(")) {
      const call = `${filePath}:${index + 1}`;

      draftCalls.push(call);

      if (!line.includes("const wroteDraft = writeStudioDraft(")) {
        unguardedCalls.push(call);
      }
    }

    if (line.includes("if (!wroteDraft)")) {
      failureGuardCount += 1;
    }
  });
}

assert.ok(draftCalls.length > 0, "Expected at least one Studio draft write call");
assert.deepEqual(
  unguardedCalls,
  [],
  `Every writeStudioDraft call should assign const wroteDraft first:\n${unguardedCalls.join(
    "\n",
  )}`,
);
assert.equal(
  failureGuardCount,
  draftCalls.length,
  "Every writeStudioDraft call should have a matching if (!wroteDraft) fallback guard",
);

console.log(
  `Studio draft fallback guard verification passed for ${draftCalls.length} draft writes.`,
);
