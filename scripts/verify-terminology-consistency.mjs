import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const scanRoots = ["README.md", "docs", "src", "scripts"];
const scannedExtensions = new Set([
  ".js",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
]);
const skippedDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
]);

function phrase(parts) {
  return parts.join(" ");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectFiles(path) {
  const stats = statSync(path);

  if (stats.isFile()) {
    return scannedExtensions.has(path.slice(path.lastIndexOf("."))) ? [path] : [];
  }

  return readdirSync(path).flatMap((entry) => {
    if (skippedDirectories.has(entry)) {
      return [];
    }

    return collectFiles(join(path, entry));
  });
}

const files = scanRoots.flatMap(collectFiles);
const legacyPatterns = [
  {
    label: "old Studio source-kind wording",
    pattern: new RegExp(escapeRegExp(phrase(["Studio", "출처", "종류"]))),
  },
  {
    label: "old source-kind report wording",
    pattern: new RegExp(escapeRegExp(phrase(["출처", "종류", "운영", "리포트"]))),
  },
  {
    label: "old Studio source metadata wording",
    pattern: new RegExp(
      `(?<!저장 )${escapeRegExp(phrase(["출처", "메타"]))}(?:를|가| 없음|로| 상태)?`,
    ),
  },
  {
    label: "old missing source note wording",
    pattern: new RegExp(
      `(?<!저장 )${escapeRegExp(phrase(["출처", "없음", "메모"]))}`,
    ),
  },
  {
    label: "old Studio source draft wording",
    pattern: new RegExp(
      escapeRegExp(phrase(["Studio", "출처가", "있는", "초안"])),
    ),
  },
];

const violations = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");

  for (const { label, pattern } of legacyPatterns) {
    const match = source.match(pattern);

    if (match?.index === undefined) {
      continue;
    }

    const line = source.slice(0, match.index).split("\n").length;
    violations.push(`${file}:${line} ${label}: ${match[0]}`);
  }
}

assert.deepEqual(
  violations,
  [],
  `Legacy terminology found:\n${violations.join("\n")}`,
);

const readme = readFileSync("README.md", "utf8");
const prd = readFileSync("docs/personalized-prompt-ai-prd.md", "utf8");

assert.match(
  readme,
  /Studio 저장 출처/,
  "README should use current Studio saved-source wording",
);
assert.match(
  readme,
  /저장 출처 메타 없음/,
  "README should use current missing saved-source metadata wording",
);
assert.match(
  prd,
  /Studio 저장 출처/,
  "PRD should use current Studio saved-source wording",
);
assert.match(
  prd,
  /저장 출처 메타 없음/,
  "PRD should use current missing saved-source metadata wording",
);

console.log(
  `Terminology consistency verification passed for ${files.length} files.`,
);
