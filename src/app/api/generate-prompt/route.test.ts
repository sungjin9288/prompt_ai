import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/generate-prompt/route";

const openaiApiKeyEnvName = "OPENAI_API_KEY";
const savedEnv: Record<string, string | undefined> = {};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/generate-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate-prompt", () => {
  beforeEach(() => {
    savedEnv[openaiApiKeyEnvName] = process.env[openaiApiKeyEnvName];
    delete process.env[openaiApiKeyEnvName];
  });

  afterEach(() => {
    if (savedEnv[openaiApiKeyEnvName] === undefined) {
      delete process.env[openaiApiKeyEnvName];
    } else {
      process.env[openaiApiKeyEnvName] = savedEnv[openaiApiKeyEnvName];
    }
  });

  it("returns a local-mode prompt package when OPENAI_API_KEY is not set", async () => {
    const response = await POST(
      makeRequest({
        request: {
          rawInput: "분기 보고서를 요약해줘",
          goal: "보고서 요약",
          domain: "리서치",
          targetModels: ["claude"],
        },
      }),
    );
    const json = (await response.json()) as {
      mode: string;
      notice: string;
      prompt: { versions: Array<{ targetModel: string; content: string }> };
    };

    expect(response.status).toBe(200);
    expect(json.mode).toBe("local");
    expect(json.notice).toContain("OPENAI_API_KEY is not configured");
    expect(json.prompt.versions.length).toBeGreaterThan(0);
    expect(json.prompt.versions[0]).toHaveProperty("content");
  });

  it("applies default user and company profiles when none are provided", async () => {
    const response = await POST(
      makeRequest({
        request: {
          rawInput: "새로운 기능을 기획해줘",
          goal: "기능 기획",
          domain: "기획",
          targetModels: ["gpt"],
        },
      }),
    );
    const json = (await response.json()) as {
      prompt: { targetModels: string[]; rawInput: string };
    };

    expect(response.status).toBe(200);
    expect(json.prompt.rawInput).toBe("새로운 기능을 기획해줘");
    expect(json.prompt.targetModels).toContain("gpt");
  });

  it("returns 400 with an error envelope when rawInput is missing", async () => {
    const response = await POST(
      makeRequest({
        request: {
          goal: "목표",
          domain: "리서치",
          targetModels: ["claude"],
        },
      }),
    );
    const json = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(json.error).toBe("rawInput is required");
  });

  it("returns 400 with an error envelope when rawInput is blank", async () => {
    const response = await POST(
      makeRequest({
        request: {
          rawInput: "   ",
          goal: "목표",
          domain: "리서치",
          targetModels: ["claude"],
        },
      }),
    );
    const json = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(json.error).toBe("rawInput is required");
  });

  it("returns 400 with an error envelope when the request body is not valid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );
    const json = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid prompt generation request");
  });

  it("returns 400 with an error envelope when the request field itself is missing", async () => {
    const response = await POST(makeRequest({}));
    const json = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(json.error).toBe("rawInput is required");
  });
});
