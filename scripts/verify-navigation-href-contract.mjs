import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/lib/navigation/href.ts", "utf8");
const readme = readFileSync("README.md", "utf8");
const brief = readFileSync("docs/codex-development-brief.md", "utf8");

assert.match(
  source,
  /export function normalizeInternalHref\(value: unknown\)[\s\S]*?typeof value !== "string" \|\| !value\.trim\(\)/,
  "normalizeInternalHref should reject non-string and blank values",
);

assert.match(
  source,
  /const base = "http:\/\/prompt-ai-studio\.local"[\s\S]*?const url = new URL\(value, base\)/,
  "normalizeInternalHref should parse candidate values against a fixed local origin",
);

assert.match(
  source,
  /url\.origin !== base \|\| !url\.pathname\.startsWith\("\/"\)/,
  "normalizeInternalHref should reject external origins and non-internal paths",
);

assert.match(
  source,
  /const href = `\$\{url\.pathname\}\$\{url\.search\}\$\{url\.hash\}`/,
  "normalizeInternalHref should preserve path, query, and hash only",
);

assert.match(
  source,
  /return href\.startsWith\("\/\/"\) \? undefined : href/,
  "normalizeInternalHref should reject protocol-relative hrefs",
);

assert.match(
  source,
  /export function formatAbsoluteInternalHref\(value: unknown, origin\?: string\)[\s\S]*?const href = normalizeInternalHref\(value\)[\s\S]*?if \(!href\)[\s\S]*?return undefined/,
  "formatAbsoluteInternalHref should normalize before formatting absolute URLs",
);

assert.match(
  source,
  /if \(!origin\)[\s\S]*?return href[\s\S]*?return new URL\(href, origin\)\.toString\(\)[\s\S]*?catch[\s\S]*?return href/,
  "formatAbsoluteInternalHref should keep internal href fallback when origin formatting fails",
);

assert.match(
  readme,
  /sourceHref`는 .*`normalizeInternalHref`.*내부 경로만 저장/,
  "README should document sourceHref internal-route normalization",
);

assert.match(
  readme,
  /내부 링크를 복사용 절대 URL로 바꿀 때는 .*`formatAbsoluteInternalHref`/,
  "README should document absolute internal href formatting",
);

assert.match(
  brief,
  /sourceHref`는 `normalizeInternalHref` 규칙을 거쳐 내부 경로만 저장/,
  "Development brief should document sourceHref internal-route normalization",
);

assert.match(
  brief,
  /내부 링크를 복사용 절대 URL로 바꿀 때는 `formatAbsoluteInternalHref`를 사용/,
  "Development brief should document absolute internal href formatting",
);

console.log("Navigation href contract verification passed.");
