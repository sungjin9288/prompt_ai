import { describe, expect, it } from "vitest";

import { OPTIONS, POST } from "@/app/api/integrations/refine/route";

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/integrations/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/integrations/refine", () => {
  it("returns a reviewRequired handoff package for a valid Chrome-style payload", async () => {
    const response = await POST(
      makeRequest(
        {
          sourceApp: "chrome",
          sourceUrl: "https://chat.openai.com/",
          request: {
            rawInput: "이 페이지 내용을 요약해줘",
            goal: "요약",
            domain: "리서치",
            targetModels: ["gpt"],
          },
        },
        { origin: "chrome-extension://abcdefg" },
      ),
    );
    const json = (await response.json()) as {
      audit: { reviewRequired: boolean; sourceApp: string; tool: string };
      handoffPackages: Array<{
        handoffText: string;
        modelLabel: string;
        qualityScore: number;
        targetModel: string;
      }>;
      promptPackage: { rawInput: string };
    };

    expect(response.status).toBe(200);
    expect(json.audit.reviewRequired).toBe(true);
    expect(json.audit.sourceApp).toBe("chrome");
    expect(json.audit.tool).toBe("refine_prompt");
    expect(json.handoffPackages.length).toBeGreaterThan(0);
    expect(json.handoffPackages[0]).toHaveProperty("handoffText");
    expect(json.handoffPackages[0]).toHaveProperty("qualityScore");
    expect(json.promptPackage.rawInput).toBe("이 페이지 내용을 요약해줘");
  });

  it("returns a reviewRequired handoff package for an MCP-style payload with flat fields", async () => {
    const response = await POST(
      makeRequest({
        sourceApp: "mcp",
        rawInput: "코드 리뷰 프롬프트를 만들어줘",
        goal: "코드 리뷰",
        domain: "개발",
        targetModels: ["claude"],
      }),
    );
    const json = (await response.json()) as {
      audit: { sourceApp: string };
      promptPackage: { rawInput: string; domain: string };
    };

    expect(response.status).toBe(200);
    expect(json.audit.sourceApp).toBe("mcp");
    expect(json.promptPackage.rawInput).toBe("코드 리뷰 프롬프트를 만들어줘");
    expect(json.promptPackage.domain).toBe("개발");
  });

  it("normalizes target AI aliases like chatgpt and openai to gpt", async () => {
    const response = await POST(
      makeRequest({
        sourceApp: "web",
        rawInput: "테스트 입력",
        targetModels: ["chatgpt", "openai"],
      }),
    );
    const json = (await response.json()) as {
      promptPackage: { targetModels: string[] };
    };

    expect(json.promptPackage.targetModels).toContain("gpt");
  });

  it("returns 400 with a clear error when rawInput is missing", async () => {
    const response = await POST(
      makeRequest({
        sourceApp: "chrome",
        request: { goal: "요약", domain: "리서치", targetModels: ["gpt"] },
      }),
    );
    const json = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(json.error).toBe("rawInput is required");
  });

  it("returns 400 with a clear error when the request body is not valid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/integrations/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );
    const json = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid integrations refine request");
  });

  it("does not set CORS headers for a disallowed origin", async () => {
    const response = await POST(
      makeRequest(
        { sourceApp: "web", rawInput: "테스트" },
        { origin: "https://malicious.example.com" },
      ),
    );

    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("sets CORS headers for an allowed chrome-extension origin", async () => {
    const response = await POST(
      makeRequest(
        { sourceApp: "chrome", rawInput: "테스트" },
        { origin: "chrome-extension://abcdefg" },
      ),
    );

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "chrome-extension://abcdefg",
    );
  });
});

describe("OPTIONS /api/integrations/refine", () => {
  it("returns 204 with CORS headers for an allowed localhost origin", () => {
    const response = OPTIONS(
      new Request("http://localhost/api/integrations/refine", {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "POST, OPTIONS",
    );
  });
});
