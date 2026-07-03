import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "@/app/api/data/supabase-import/route";

const ENV_KEYS = [
  "SUPABASE_IMPORT_EXECUTION_ENABLED",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
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

function makeMinimalBackup() {
  return {
    app: "prompt-ai-studio",
    schemaVersion: 1,
    exportedAt: "2026-01-01T00:00:00.000Z",
    data: {
      userProfile: {
        id: "default-user",
        role: "role",
        industries: [],
        goals: [],
        preferredTone: "tone",
        preferredOutputs: [],
        avoidPhrases: [],
        repeatedTasks: [],
      },
      companyProfile: {
        id: "default-company",
        companyName: "",
        description: "",
        products: [],
        customers: [],
        brandTone: "",
        internalTerms: [],
        bannedPhrases: [],
        documentFormats: [],
      },
      prompts: [],
      memories: [],
      skills: [],
    },
  };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/data/supabase-import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/data/supabase-import", () => {
  beforeEach(() => {
    ENV_KEYS.forEach((key) => {
      originalEnv[key] = process.env[key];
      delete process.env[key];
    });
  });

  afterEach(() => {
    restoreEnv();
  });

  describe("preflight (execute=false / omitted)", () => {
    it("returns a preflight report with dry-run, plan, and insertOrder shape for a valid backup", async () => {
      const response = await POST(
        makeRequest({
          workspaceId: "00000000-0000-4000-8000-000000000001",
          ownerUserId: "00000000-0000-4000-8000-000000000002",
          backup: makeMinimalBackup(),
        }),
      );
      const json = (await response.json()) as {
        status: string;
        dryRun: { batches: number; totalRows: number; warnings: unknown[] };
        insertOrder: unknown[];
        validation: { ok: boolean };
        requiredConfirmation: string;
        plan: { workspaceId: string };
      };

      expect(response.status).toBe(200);
      expect(json.status).toBe("ready");
      expect(json.dryRun).toHaveProperty("batches");
      expect(json.dryRun).toHaveProperty("totalRows");
      expect(json.dryRun).toHaveProperty("warnings");
      expect(Array.isArray(json.insertOrder)).toBe(true);
      expect(json.validation.ok).toBe(true);
      expect(json.requiredConfirmation).toBe("RUN_SUPABASE_IMPORT");
      expect(json.plan.workspaceId).toBe("00000000-0000-4000-8000-000000000001");
    });

    it("returns 400 with a clear error when workspaceId/ownerUserId are not valid UUIDs", async () => {
      const response = await POST(
        makeRequest({
          workspaceId: "not-a-uuid",
          ownerUserId: "also-not-a-uuid",
          backup: makeMinimalBackup(),
        }),
      );
      const json = (await response.json()) as { error: string; status: string };

      expect(response.status).toBe(400);
      expect(json.status).toBe("invalid-request");
      expect(json.error).toContain("workspaceId must be a Supabase UUID");
    });

    it("returns 400 with an error message when workspaceId is missing", async () => {
      const response = await POST(
        makeRequest({
          ownerUserId: "00000000-0000-4000-8000-000000000002",
          backup: makeMinimalBackup(),
        }),
      );
      const json = (await response.json()) as { error: string; status: string };

      expect(response.status).toBe(400);
      expect(json.status).toBe("invalid-request");
      expect(json.error).toContain("workspaceId");
    });

    it("returns 400 with an error message when the backup app field is wrong", async () => {
      const backup = { ...makeMinimalBackup(), app: "some-other-app" };
      const response = await POST(
        makeRequest({
          workspaceId: "00000000-0000-4000-8000-000000000001",
          ownerUserId: "00000000-0000-4000-8000-000000000002",
          backup,
        }),
      );
      const json = (await response.json()) as { error: string };

      expect(response.status).toBe(400);
      expect(json.error).toContain("prompt-ai-studio");
    });
  });

  describe("execute=true without the execution gate enabled", () => {
    it("blocks execution with 403 when SUPABASE_IMPORT_EXECUTION_ENABLED is unset", async () => {
      const response = await POST(
        makeRequest({
          execute: true,
          workspaceId: "00000000-0000-4000-8000-000000000001",
          ownerUserId: "00000000-0000-4000-8000-000000000002",
          confirmation: "RUN_SUPABASE_IMPORT",
          backup: makeMinimalBackup(),
        }),
      );
      const json = (await response.json()) as {
        status: string;
        error: string;
        environment: { executionEnabled: boolean };
      };

      expect(response.status).toBe(403);
      expect(json.status).toBe("execution-disabled");
      expect(json.error).toContain("SUPABASE_IMPORT_EXECUTION_ENABLED");
      expect(json.environment.executionEnabled).toBe(false);
    });

    it("blocks execution with 403 when SUPABASE_IMPORT_EXECUTION_ENABLED is explicitly false", async () => {
      process.env.SUPABASE_IMPORT_EXECUTION_ENABLED = "false";

      const response = await POST(
        makeRequest({
          execute: true,
          workspaceId: "00000000-0000-4000-8000-000000000001",
          ownerUserId: "00000000-0000-4000-8000-000000000002",
          confirmation: "RUN_SUPABASE_IMPORT",
          backup: makeMinimalBackup(),
        }),
      );
      const json = (await response.json()) as { status: string };

      expect(response.status).toBe(403);
      expect(json.status).toBe("execution-disabled");
    });

    it("never leaks a fake service role key value into the blocked response", async () => {
      const fakeServiceRoleKey = "service-role-key";
      process.env[ENV_KEYS[1]] = fakeServiceRoleKey;

      const response = await POST(
        makeRequest({
          execute: true,
          workspaceId: "00000000-0000-4000-8000-000000000001",
          ownerUserId: "00000000-0000-4000-8000-000000000002",
          confirmation: "RUN_SUPABASE_IMPORT",
          backup: makeMinimalBackup(),
        }),
      );
      const rawText = await response.text();

      expect(response.status).toBe(403);
      expect(rawText).not.toContain(fakeServiceRoleKey);
    });
  });

  describe("execute=true with the gate enabled but other requirements missing", () => {
    beforeEach(() => {
      process.env.SUPABASE_IMPORT_EXECUTION_ENABLED = "true";
    });

    it("returns 400 when confirmation does not match the required phrase", async () => {
      const response = await POST(
        makeRequest({
          execute: true,
          workspaceId: "00000000-0000-4000-8000-000000000001",
          ownerUserId: "00000000-0000-4000-8000-000000000002",
          confirmation: "WRONG_PHRASE",
          backup: makeMinimalBackup(),
        }),
      );
      const json = (await response.json()) as { status: string; error: string };

      expect(response.status).toBe(400);
      expect(json.status).toBe("confirmation-required");
      expect(json.error).toContain("RUN_SUPABASE_IMPORT");
    });

    it("returns 503 when Supabase URL and service role key env vars are not configured", async () => {
      const response = await POST(
        makeRequest({
          execute: true,
          workspaceId: "00000000-0000-4000-8000-000000000001",
          ownerUserId: "00000000-0000-4000-8000-000000000002",
          confirmation: "RUN_SUPABASE_IMPORT",
          backup: makeMinimalBackup(),
        }),
      );
      const json = (await response.json()) as { status: string };

      expect(response.status).toBe(503);
      expect(json.status).toBe("environment-incomplete");
    });
  });
});
