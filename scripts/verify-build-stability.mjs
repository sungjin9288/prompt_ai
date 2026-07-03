import assert from "node:assert/strict";
import { collectFiles, readSource } from "./lib/read-source.mjs";

const scanRoots = ["src", "next.config.ts"];
const scannedExtensions = [".css", ".ts", ".tsx"];
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

const files = collectFiles(scanRoots, { extensions: scannedExtensions });
const findings = [];

for (const filePath of files) {
  const source = readSource(filePath);

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

const globalsCss = readSource("src/app/globals.css");

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
