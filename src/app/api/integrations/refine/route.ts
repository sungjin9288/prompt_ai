import { NextResponse } from "next/server";

import {
  createIntegrationRefineResponse,
  parseIntegrationRefineRequest,
} from "@/lib/integrations/refine";

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigin =
    origin.startsWith("chrome-extension://") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1");

  if (!allowedOrigin) {
    return {};
  }

  return {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
  };
}

export function OPTIONS(request: Request) {
  return new Response(null, {
    headers: getCorsHeaders(request),
    status: 204,
  });
}

export async function POST(request: Request) {
  const headers = getCorsHeaders(request);

  try {
    const parseResult = parseIntegrationRefineRequest(await request.json());

    if (!parseResult.value) {
      return NextResponse.json(
        { error: parseResult.error ?? "Invalid integrations refine request" },
        { headers, status: 400 },
      );
    }

    return NextResponse.json(createIntegrationRefineResponse(parseResult.value), {
      headers,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid integrations refine request" },
      { headers, status: 400 },
    );
  }
}
