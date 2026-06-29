import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const scanRoots = ["src", "next.config.ts"];
const scannedExtensions = new Set([".css", ".ts", ".tsx"]);
const blockedPatterns = [
  {
    label: "network Google font dependency",
    pattern: /next\/font\/google/,
  },
  {
    label: "Geist runtime font import or class",
    pattern: /\bGeist(?:_Mono)?\b|font-geist/,
  },
];

function getExtension(filePath) {
  const lastDot = filePath.lastIndexOf(".");

  return lastDot === -1 ? "" : filePath.slice(lastDot);
}

function collectFiles(entryPath) {
  const stats = statSync(entryPath);

  if (stats.isFile()) {
    return scannedExtensions.has(getExtension(entryPath)) ? [entryPath] : [];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  return readdirSync(entryPath).flatMap((name) => collectFiles(join(entryPath, name)));
}

const files = scanRoots.flatMap(collectFiles);
const findings = [];

for (const filePath of files) {
  const source = readFileSync(filePath, "utf8");

  for (const blockedPattern of blockedPatterns) {
    const match = source.match(blockedPattern.pattern);

    if (match?.index === undefined) {
      continue;
    }

    const line = source.slice(0, match.index).split("\n").length;
    findings.push(`${filePath}:${line} ${blockedPattern.label}: ${match[0]}`);
  }
}

assert.deepEqual(
  findings,
  [],
  `Build stability violations found:\n${findings.join("\n")}`,
);

const globalsCss = readFileSync("src/app/globals.css", "utf8");

assert.match(
  globalsCss,
  /--font-app-sans:/,
  "globals.css should define a local app sans font stack",
);
assert.match(
  globalsCss,
  /--font-app-mono:/,
  "globals.css should define a local app mono font stack",
);

console.log(`Build stability verification passed for ${files.length} files.`);
