import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/integrations/mcp-feedback/route";

function makeRequest(searchParams: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/integrations/mcp-feedback");

  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Request(url);
}

describe("GET /api/integrations/mcp-feedback (empty inbox)", () => {
  it("returns exists=false with empty counts when the inbox file does not exist", async () => {
    const response = await GET(makeRequest());
    const json = (await response.json()) as {
      exists: boolean;
      totalCount: number;
      filteredCount: number;
      records: unknown[];
      ratingCounts: Record<string, number>;
      targetAICounts: Record<string, number>;
      parseErrors: unknown[];
      inboxPath: string;
    };

    expect(response.status).toBe(200);
    expect(json.exists).toBe(false);
    expect(json.totalCount).toBe(0);
    expect(json.filteredCount).toBe(0);
    expect(json.records).toEqual([]);
    expect(json.ratingCounts).toEqual({});
    expect(json.targetAICounts).toEqual({});
    expect(json.parseErrors).toEqual([]);
    expect(json.inboxPath).toContain(
      join(".prompt-ai-studio", "mcp-feedback.jsonl"),
    );
  });

  it("sets Cache-Control: no-store on the empty-inbox response", async () => {
    const response = await GET(makeRequest());

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("GET /api/integrations/mcp-feedback (seeded inbox, cwd override)", () => {
  let tempDir: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "mcp-feedback-inbox-"));
    mkdirSync(join(tempDir, ".prompt-ai-studio"), { recursive: true });

    const records = [
      { rating: "positive", targetAI: "claude", promptId: "p1" },
      { rating: "negative", targetAI: "gpt", promptId: "p2" },
      { rating: "positive", targetAI: "gpt", promptId: "p3" },
      { rating: "neutral", targetAI: "claude", promptId: "p4" },
    ];
    const jsonlContent = records.map((record) => JSON.stringify(record)).join("\n");

    writeFileSync(
      join(tempDir, ".prompt-ai-studio", "mcp-feedback.jsonl"),
      jsonlContent,
      "utf8",
    );

    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tempDir);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns all seeded records with exists=true and correct totals when unfiltered", async () => {
    const response = await GET(makeRequest());
    const json = (await response.json()) as {
      exists: boolean;
      totalCount: number;
      filteredCount: number;
      records: Array<{ promptId?: string }>;
    };

    expect(response.status).toBe(200);
    expect(json.exists).toBe(true);
    expect(json.totalCount).toBe(4);
    expect(json.filteredCount).toBe(4);
    expect(json.records).toHaveLength(4);
  });

  it("filters records by rating=positive", async () => {
    const response = await GET(makeRequest({ rating: "positive" }));
    const json = (await response.json()) as {
      filteredCount: number;
      records: Array<{ rating?: string }>;
    };

    expect(json.filteredCount).toBe(2);
    expect(json.records.every((record) => record.rating === "positive")).toBe(
      true,
    );
  });

  it("filters records by targetAI=claude", async () => {
    const response = await GET(makeRequest({ targetAI: "claude" }));
    const json = (await response.json()) as {
      filteredCount: number;
      records: Array<{ targetAI?: string }>;
    };

    expect(json.filteredCount).toBe(2);
    expect(json.records.every((record) => record.targetAI === "claude")).toBe(
      true,
    );
  });

  it("combines rating and targetAI filters", async () => {
    const response = await GET(
      makeRequest({ rating: "positive", targetAI: "gpt" }),
    );
    const json = (await response.json()) as {
      filteredCount: number;
      records: Array<{ promptId?: string }>;
    };

    expect(json.filteredCount).toBe(1);
    expect(json.records[0].promptId).toBe("p3");
  });

  it("reports rating and targetAI counts across the full unfiltered set", async () => {
    const response = await GET(makeRequest());
    const json = (await response.json()) as {
      ratingCounts: Record<string, number>;
      targetAICounts: Record<string, number>;
    };

    expect(json.ratingCounts).toEqual({ positive: 2, negative: 1, neutral: 1 });
    expect(json.targetAICounts).toEqual({ claude: 2, gpt: 2 });
  });
});
