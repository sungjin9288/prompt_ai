import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const scanRoots = [
  "README.md",
  "docs",
  "eslint.config.mjs",
  "next.config.ts",
  "package.json",
  "scripts",
  "src",
  "tsconfig.json",
];
const textFileExtensions = new Set([
  ".css",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
]);
const allowedEnvValues = new Set([
  "",
  "[redacted]",
  "\\[redacted\\]",
  "anon-key",
  "false",
  "gpt-5",
  "gpt-5-mini",
  "local",
  "openai-key",
  "project-ref",
  "service-role-key",
  "secret-value",
  "true",
  "your_api_key",
]);
const secretPatterns = [
  {
    message: "OpenAI API key-like value",
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    message: "JWT-like token",
    pattern:
      /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g,
  },
];
const sensitiveEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "OPENAI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function getFileExtension(filePath) {
  const lastDot = filePath.lastIndexOf(".");

  return lastDot === -1 ? "" : filePath.slice(lastDot);
}

function collectFiles(entryPath) {
  const stats = statSync(entryPath);

  if (stats.isFile()) {
    return textFileExtensions.has(getFileExtension(entryPath)) ? [entryPath] : [];
  }

  if (!stats.isDirectory()) {
    return [];
  }

  return readdirSync(entryPath)
    .filter((name) => !name.startsWith("."))
    .flatMap((name) => collectFiles(join(entryPath, name)));
}

function normalizeEnvValue(value) {
  return value.trim().replace(/^["'`/]/, "").replace(/["'`/,;}]+$/, "");
}

function getEnvAssignmentFindings(filePath, content) {
  const findings = [];

  for (const key of sensitiveEnvKeys) {
    const assignmentPattern = new RegExp(
      `${key}[\\t ]*[:=][\\t ]*["'\`]?([^\\r\\n\\t "',;}]*)`,
      "g",
    );
    let match;

    while ((match = assignmentPattern.exec(content))) {
      const value = normalizeEnvValue(match[1] || "");

      if (allowedEnvValues.has(value) || value.startsWith("process.env.")) {
        continue;
      }

      findings.push({
        filePath,
        message: `${key} has a non-placeholder value`,
        value,
      });
    }
  }

  return findings;
}

function getPatternFindings(filePath, content) {
  return secretPatterns.flatMap((secretPattern) => {
    const matches = [...content.matchAll(secretPattern.pattern)];

    return matches.map((match) => ({
      filePath,
      message: secretPattern.message,
      value: match[0],
    }));
  });
}

const files = scanRoots.flatMap(collectFiles);
const findings = files.flatMap((filePath) => {
  const content = readFileSync(filePath, "utf8");

  return [
    ...getPatternFindings(filePath, content),
    ...getEnvAssignmentFindings(filePath, content),
  ];
});

assert.equal(
  findings.length,
  0,
  findings
    .map(
      (finding) =>
        `${finding.filePath}: ${finding.message} (${finding.value.slice(
          0,
          12,
        )}...)`,
    )
    .join("\n"),
);

console.log(`Secret safety verification passed for ${files.length} files.`);
