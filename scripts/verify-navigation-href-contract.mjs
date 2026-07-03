import assert from "node:assert/strict";
import { readSource } from "./lib/read-source.mjs";

const source = readSource("src/lib/navigation/href.ts");
const readme = readSource("README.md");
const brief = readSource("docs/codex-development-brief.md");

function assertContract(text, pattern, message) {
  assert.match(text, pattern, message);
}

assertContract(
  source,
  /const internalHrefOrigin = "http:\/\/prompt-ai-studio\.local"/,
  "normalizeInternalHref should keep the local origin contract named at module scope",
);

assertContract(
  source,
  /export function normalizeInternalHref\(value: unknown\)[\s\S]*?const rawHref = typeof value === "string" \? value\.trim\(\) : ""[\s\S]*?if \(!rawHref\)/,
  "normalizeInternalHref should reject non-string and blank values",
);

assertContract(
  source,
  /const url = new URL\(rawHref, internalHrefOrigin\)/,
  "normalizeInternalHref should parse candidate values against a fixed local origin",
);

assertContract(
  source,
  /url\.origin !== internalHrefOrigin \|\| !url\.pathname\.startsWith\("\/"\)/,
  "normalizeInternalHref should reject external origins and non-internal paths",
);

assertContract(
  source,
  /const href = `\$\{url\.pathname\}\$\{url\.search\}\$\{url\.hash\}`/,
  "normalizeInternalHref should preserve path, query, and hash only",
);

assertContract(
  source,
  /return href\.startsWith\("\/\/"\) \? undefined : href/,
  "normalizeInternalHref should reject protocol-relative hrefs",
);

assertContract(
  source,
  /export function formatAbsoluteInternalHref\(value: unknown, origin\?: string\)[\s\S]*?const href = normalizeInternalHref\(value\)[\s\S]*?if \(!href\)[\s\S]*?return undefined/,
  "formatAbsoluteInternalHref should normalize before formatting absolute URLs",
);

assertContract(
  source,
  /if \(!origin\)[\s\S]*?return href[\s\S]*?return new URL\(href, origin\)\.toString\(\)[\s\S]*?catch[\s\S]*?return href/,
  "formatAbsoluteInternalHref should keep internal href fallback when origin formatting fails",
);

assertContract(
  readme,
  /sourceHref`는 .*`normalizeInternalHref`.*내부 경로만 저장/,
  "README should document sourceHref internal-route normalization",
);

assertContract(
  readme,
  /내부 링크를 복사용 절대 URL로 바꿀 때는 .*`formatAbsoluteInternalHref`/,
  "README should document absolute internal href formatting",
);

assertContract(
  brief,
  /sourceHref`는 `normalizeInternalHref` 규칙을 거쳐 내부 경로만 저장/,
  "Development brief should document sourceHref internal-route normalization",
);

assertContract(
  brief,
  /내부 링크를 복사용 절대 URL로 바꿀 때는 `formatAbsoluteInternalHref`를 사용/,
  "Development brief should document absolute internal href formatting",
);

console.log("Navigation href contract verification passed.");
