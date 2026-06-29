import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  return NextResponse.json({
    configured,
    model: configured ? model : null,
    mode: configured ? "openai" : "local",
  });
}
