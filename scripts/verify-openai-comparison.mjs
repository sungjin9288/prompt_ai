import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadTypescriptModule } from "./lib/load-typescript-module.mjs";

const liveComparisonEnabled = process.env.OPENAI_COMPARISON_LIVE === "1";
const savedApiKey = process.env["OPENAI_API_KEY"];
const savedModel = process.env["OPENAI_MODEL"];

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
    "verify:openai-comparison only accepts --out <file>",
  );

  return outputPath;
}

const outputPath = getOutputPath(process.argv.slice(2));

if (!liveComparisonEnabled) {
  delete process.env["OPENAI_API_KEY"];
}

const comparisonRequest = {
  domain: "개발",
  goal: "Codex와 GPT에 전달할 구현 프롬프트 정제",
  languageStrategy: "hybrid",
  outputLanguage: "korean",
  rawInput:
    "새 기능을 작게 구현하고, 관련 문서와 검증 evidence까지 한 번에 갱신하게 해줘.",
  targetModels: ["gpt", "codex"],
};

function summarizePrompt(prompt) {
  const scores = prompt.versions.map((version) => version.qualityScore);
  const averageScore =
    scores.reduce((total, score) => total + score, 0) / scores.length;

  return {
    averageScore: Math.round(averageScore),
    source: prompt.source,
    title: prompt.title,
    versionCount: prompt.versions.length,
    versionModels: prompt.versions.map((version) => version.targetModel),
  };
}

function buildComparisonPacket({ localPrompt, result }) {
  const localSummary = summarizePrompt(localPrompt);
  const resultSummary = summarizePrompt(result.prompt);

  return [
    "# OpenAI Comparison Smoke",
    "",
    `mode: ${result.mode}`,
    `liveComparison: ${liveComparisonEnabled ? "yes" : "no"}`,
    `localSource: ${localSummary.source}`,
    `resultSource: ${resultSummary.source}`,
    `targetModels: ${resultSummary.versionModels.join(", ")}`,
    `localAverageScore: ${localSummary.averageScore}`,
    `resultAverageScore: ${resultSummary.averageScore}`,
    `notice: ${result.notice}`,
    "",
    "Operator gate:",
    "- Default run must not call OpenAI.",
    "- Set OPENAI_API_KEY and OPENAI_COMPARISON_LIVE=1 for a live comparison.",
    "- Compare localSource, resultSource, targetModels, score movement, and prompt content before enabling production usage.",
  ].join("\n");
}

function writeComparisonPacket(outputPath, comparisonPacket) {
  if (!outputPath) {
    return;
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${comparisonPacket}\n`, "utf8");
}

try {
  const {
    createPromptPackage,
    defaultCompanyProfile,
    defaultUserProfile,
  } = loadTypescriptModule("src/lib/prompt/index.ts");
  const { enhancePromptWithOpenAI } = loadTypescriptModule(
    "src/lib/openai/prompt-optimizer.ts",
  );

  const localPrompt = createPromptPackage(
    comparisonRequest,
    defaultUserProfile,
    defaultCompanyProfile,
    [
      "Keep code and instructions direct, readable, and easy to verify.",
      "Do not reduce evidence, permission, or history tracking.",
    ],
  );
  const result = await enhancePromptWithOpenAI(localPrompt);
  const comparisonPacket = buildComparisonPacket({ localPrompt, result });

  assert.equal(localPrompt.source, "local");
  assert.deepEqual(
    result.prompt.versions.map((version) => version.targetModel),
    comparisonRequest.targetModels,
  );
  assert.match(comparisonPacket, /Default run must not call OpenAI/);
  assert.match(comparisonPacket, /OPENAI_COMPARISON_LIVE=1/);

  if (liveComparisonEnabled) {
    assert.ok(savedApiKey?.trim(), "OPENAI_API_KEY is required for live comparison");
    assert.equal(result.mode, "openai");
    assert.equal(result.prompt.source, "openai");
    assert.ok(result.prompt.modelUsed, "Live comparison should record modelUsed");
  } else {
    assert.equal(result.mode, "local");
    assert.equal(result.prompt, localPrompt);
    assert.equal(savedApiKey ? process.env["OPENAI_API_KEY"] : undefined, undefined);
  }

  writeComparisonPacket(outputPath, comparisonPacket);

  console.log(comparisonPacket);
  if (outputPath) {
    console.log(`OpenAI comparison smoke evidence written to ${outputPath}.`);
  }
  console.log("OpenAI comparison smoke verification passed.");
} finally {
  if (savedApiKey === undefined) {
    delete process.env["OPENAI_API_KEY"];
  } else {
    process.env["OPENAI_API_KEY"] = savedApiKey;
  }

  if (savedModel === undefined) {
    delete process.env["OPENAI_MODEL"];
  } else {
    process.env["OPENAI_MODEL"] = savedModel;
  }
}
