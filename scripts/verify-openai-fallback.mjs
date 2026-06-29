import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadTypescriptModule } from "./lib/load-typescript-module.mjs";

const savedApiKey = process.env["OPENAI_API_KEY"];
const savedModel = process.env["OPENAI_MODEL"];

delete process.env["OPENAI_API_KEY"];
delete process.env["OPENAI_MODEL"];

try {
  const { enhancePromptWithOpenAI } = loadTypescriptModule(
    "src/lib/openai/prompt-optimizer.ts",
  );
  const statusRoute = readFileSync(
    "src/app/api/generate-prompt/status/route.ts",
    "utf8",
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

  console.log("OpenAI fallback verification passed.");
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
