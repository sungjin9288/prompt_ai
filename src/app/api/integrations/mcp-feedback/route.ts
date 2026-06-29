import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

import {
  normalizeMcpFeedbackInboxLimit,
  parseMcpFeedbackInboxText,
} from "@/lib/integrations/mcp-feedback-inbox";

export const dynamic = "force-dynamic";

function getMcpFeedbackInboxPath() {
  return join(process.cwd(), ".prompt-ai-studio", "mcp-feedback.jsonl");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const inboxPath = getMcpFeedbackInboxPath();
  const limit = normalizeMcpFeedbackInboxLimit(url.searchParams.get("limit"));
  const rating = url.searchParams.get("rating") ?? "all";
  const targetAI = url.searchParams.get("targetAI") ?? "all";

  try {
    const inboxText = await readFile(inboxPath, "utf8");
    const snapshot = parseMcpFeedbackInboxText(inboxText, {
      limit,
      rating,
      targetAI,
    });

    return NextResponse.json(
      {
        ...snapshot,
        exists: true,
        inboxPath,
        limit,
        rating,
        targetAI,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      const code = (error as { code?: string }).code;

      if (code === "ENOENT") {
        return NextResponse.json(
          {
            exists: false,
            filteredCount: 0,
            inboxPath,
            limit,
            parseErrors: [],
            rating,
            ratingCounts: {},
            records: [],
            targetAI,
            targetAICounts: {},
            totalCount: 0,
          },
          {
            headers: {
              "Cache-Control": "no-store",
            },
          },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Unable to read MCP feedback inbox",
        inboxPath,
      },
      { status: 500 },
    );
  }
}
