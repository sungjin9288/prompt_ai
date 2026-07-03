import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/system/readiness/route";

const ENV_KEYS = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PROJECT_REF",
  "SUPABASE_IMPORT_EXECUTION_ENABLED",
  "APP_STORAGE_MODE",
] as const;

const originalEnv: Record<string, string | undefined> = {};

function restoreEnv() {
  ENV_KEYS.forEach((key) => {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  });
}

describe("GET /api/system/readiness", () => {
  beforeEach(() => {
    ENV_KEYS.forEach((key) => {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    });
  });

  afterEach(() => {
    restoreEnv();
  });

  it("never includes a raw fake secret value anywhere in the serialized response", async () => {
    const fakeOpenAiKey = "openai-key";
    const fakeServiceRoleKey = "service-role-key";
    process.env[ENV_KEYS[0]] = fakeOpenAiKey;
    process.env[ENV_KEYS[4]] = fakeServiceRoleKey;

    const response = await GET();
    const rawText = await response.text();

    expect(rawText).not.toContain(fakeOpenAiKey);
    expect(rawText).not.toContain(fakeServiceRoleKey);
  });

  it("reports configured-boolean fields instead of raw values", async () => {
    process.env[ENV_KEYS[0]] = "openai-key";
    process.env[ENV_KEYS[4]] = "service-role-key";
    process.env[ENV_KEYS[2]] = "https://example.supabase.co";
    process.env[ENV_KEYS[3]] = "anon-key";

    const response = await GET();
    const json = (await response.json()) as {
      generation: { configured: boolean };
      supabase: {
        serverImporterConfigured: boolean;
        publicClientConfigured: boolean;
      };
    };

    expect(response.status).toBe(200);
    expect(json.generation.configured).toBe(true);
    expect(json.supabase.serverImporterConfigured).toBe(true);
    expect(json.supabase.publicClientConfigured).toBe(true);
  });

  it("reports all fields as unconfigured when no env vars are set", async () => {
    const response = await GET();
    const json = (await response.json()) as {
      generation: { configured: boolean; mode: string; model: string | null };
      supabase: { publicClientConfigured: boolean; readyForMigration: boolean };
    };

    expect(json.generation.configured).toBe(false);
    expect(json.generation.mode).toBe("local");
    expect(json.generation.model).toBeNull();
    expect(json.supabase.publicClientConfigured).toBe(false);
    expect(json.supabase.readyForMigration).toBe(false);
  });

  it("includes release gate stages with a stage and numeric score", async () => {
    const response = await GET();
    const json = (await response.json()) as {
      releaseGate: { stage: string; score: number; checks: unknown[] };
    };

    expect(["blocked", "local-ready", "migration-ready"]).toContain(
      json.releaseGate.stage,
    );
    expect(typeof json.releaseGate.score).toBe("number");
    expect(json.releaseGate.checks.length).toBeGreaterThan(0);
  });

  it("includes a checkedAt timestamp and variable status list", async () => {
    const response = await GET();
    const json = (await response.json()) as {
      checkedAt: string;
      variables: Array<{ key: string; configured: boolean }>;
    };

    expect(typeof json.checkedAt).toBe("string");
    expect(json.variables.length).toBeGreaterThan(0);
    expect(json.variables.every((item) => "configured" in item)).toBe(true);
  });

  it("reports local-ready release gate stage when storage mode is local and nothing else is configured", async () => {
    const response = await GET();
    const json = (await response.json()) as {
      releaseGate: { stage: string };
    };

    expect(json.releaseGate.stage).toBe("local-ready");
  });
});
