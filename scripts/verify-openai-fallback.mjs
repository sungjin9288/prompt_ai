import assert from "node:assert/strict";
import { loadTypescriptModule } from "./lib/load-typescript-module.mjs";
import { readSource } from "./lib/read-source.mjs";

const savedApiKey = process.env["OPENAI_API_KEY"];
const savedModel = process.env["OPENAI_MODEL"];

delete process.env["OPENAI_API_KEY"];
delete process.env["OPENAI_MODEL"];

function getEnvExampleValue(content, key) {
  const prefix = `${key}=`;
  const line = content
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith(prefix));

  assert.ok(line, `.env.example should include ${key}`);

  return line.slice(prefix.length);
}

try {
  const { enhancePromptWithOpenAI } = loadTypescriptModule(
    "src/lib/openai/prompt-optimizer.ts",
  );
  const statusRoute = readSource(
    "src/app/api/generate-prompt/status/route.ts",
  );
  const envExample = readSource(".env.example");
  const readme = readSource("README.md");
  const environmentReadiness = readSource(
    "src/lib/data/environment-readiness.ts",
  );
  const localPrompt = {
    createdAt: "2026-06-29T00:00:00.000Z",
    domain: "개발",
    goal: "전문 프롬프트로 변환",
    id: "verify-openai-fallback",
    languageStrategy: "hybrid",
    outputLanguage: "korean",
    rawInput: "Codex가 작은 기능을 구현하고 검증까지 하게 만들어줘.",
    source: "local",
    targetModels: ["gpt", "codex"],
    title: "OpenAI fallback verification",
    updatedAt: "2026-06-29T00:00:00.000Z",
    versions: [
      {
        assumptions: [],
        content:
          "Role: Senior engineer\nTask: Implement the smallest useful change and verify it.",
        createdAt: "2026-06-29T00:00:00.000Z",
        id: "verify-openai-fallback-gpt",
        missingContext: [],
        modelLabel: "GPT",
        qualityScore: 80,
        scoreBreakdown: {
          clarity: 80,
          constraints: 80,
          context: 80,
          expertise: 80,
          modelFit: 80,
          outputFormat: 80,
          reusability: 80,
        },
        targetModel: "gpt",
      },
    ],
  };

  const result = await enhancePromptWithOpenAI(localPrompt);

  assert.equal(result.mode, "local");
  assert.equal(result.prompt, localPrompt);
  assert.match(result.notice, /OPENAI_API_KEY is not configured/);
  assert.match(statusRoute, /OPENAI_API_KEY\?\.trim\(\)/);
  assert.match(statusRoute, /mode: configured \? "openai" : "local"/);
  assert.match(statusRoute, /model: configured \? model : null/);
  assert.equal(getEnvExampleValue(envExample, "OPENAI_API_KEY"), "");
  assert.equal(getEnvExampleValue(envExample, "OPENAI_MODEL"), "gpt-5-mini");
  assert.match(
    environmentReadiness,
    /OPENAI_API_KEY is missing; generation uses local fallback\./,
  );
  assert.match(
    environmentReadiness,
    /OpenAI 테스트 시점에 OPENAI_API_KEY를 \.env\.local 또는 배포 환경 변수에 설정하세요\./,
  );
  assert.match(
    readme,
    /OPENAI_API_KEY`가 비어 있으면 앱은 외부 API 없이 로컬 규칙 기반 생성으로 동작합니다\./,
  );
  assert.match(
    readme,
    /OpenAI API 기반 프롬프트 분석 고도화:[\s\S]*?npm run verify:openai-fallback[\s\S]*?OPENAI_COMPARISON_LIVE=1 npm run verify:openai-comparison[\s\S]*?로컬 fallback과 OpenAI 보강 결과를 비교합니다\./,
  );

  console.log("OpenAI fallback and operator readiness verification passed.");
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
