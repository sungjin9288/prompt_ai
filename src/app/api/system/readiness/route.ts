import { NextResponse } from "next/server";
import { buildEnvironmentRuntimeStatusFromEnv } from "@/lib/data/environment-readiness";

export async function GET() {
  const runtimeStatus = buildEnvironmentRuntimeStatusFromEnv(process.env);

  return NextResponse.json(runtimeStatus);
}
