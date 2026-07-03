import { describe, expect, it } from "vitest";

import {
  buildEnvironmentReleaseGate,
  buildEnvironmentRuntimeStatusFromEnv,
  compareEnvironmentRuntimeSnapshot,
  createEnvironmentRuntimeSnapshot,
  type EnvironmentRuntimeSnapshot,
  type EnvironmentVariableSource,
} from "@/lib/data/environment-readiness";

const noEnv: EnvironmentVariableSource = {};

const openAiOnlyEnv: EnvironmentVariableSource = {
  OPENAI_API_KEY: "openai-key",
  OPENAI_MODEL: "gpt-5",
};

const supabaseConfiguredEnv: EnvironmentVariableSource = {
  OPENAI_API_KEY: "openai-key",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SUPABASE_PROJECT_REF: "project-ref",
};

describe("buildEnvironmentRuntimeStatusFromEnv", () => {
  it("falls back to local generation and flags warnings when no keys are configured", () => {
    const status = buildEnvironmentRuntimeStatusFromEnv(noEnv, "2026-01-01T00:00:00.000Z");

    expect(status.generation.configured).toBe(false);
    expect(status.generation.mode).toBe("local");
    expect(status.generation.model).toBeNull();
    expect(status.supabase.publicClientConfigured).toBe(false);
    expect(status.supabase.readyForMigration).toBe(false);
    expect(status.warnings).toContain(
      "OPENAI_API_KEY is missing; generation uses local fallback.",
    );
  });

  it("marks generation as openai-configured when only OPENAI_API_KEY is set", () => {
    const status = buildEnvironmentRuntimeStatusFromEnv(openAiOnlyEnv, "2026-01-01T00:00:00.000Z");

    expect(status.generation.configured).toBe(true);
    expect(status.generation.mode).toBe("openai");
    expect(status.generation.model).toBe("gpt-5");
    expect(status.supabase.publicClientConfigured).toBe(false);
    expect(status.supabase.readyForMigration).toBe(false);
  });

  it("marks supabase as ready for migration only when all required keys are present", () => {
    const status = buildEnvironmentRuntimeStatusFromEnv(
      supabaseConfiguredEnv,
      "2026-01-01T00:00:00.000Z",
    );

    expect(status.supabase.publicClientConfigured).toBe(true);
    expect(status.supabase.serverImporterConfigured).toBe(true);
    expect(status.supabase.projectRefConfigured).toBe(true);
    expect(status.supabase.readyForMigration).toBe(true);
  });

  it("defaults OPENAI_MODEL to gpt-5-mini when openai is configured but model is unset", () => {
    const status = buildEnvironmentRuntimeStatusFromEnv(
      { OPENAI_API_KEY: "openai-key" },
      "2026-01-01T00:00:00.000Z",
    );

    expect(status.generation.model).toBe("gpt-5-mini");
  });

  it("never leaks raw secret values into warnings or JSON-serializable status fields", () => {
    const status = buildEnvironmentRuntimeStatusFromEnv(
      supabaseConfiguredEnv,
      "2026-01-01T00:00:00.000Z",
    );
    const serialized = JSON.stringify(status);

    expect(serialized).not.toContain("openai-key");
    expect(serialized).not.toContain("anon-key");
    expect(serialized).not.toContain("service-role-key");
  });
});

describe("buildEnvironmentReleaseGate", () => {
  it("reaches local-ready stage when storage is local but Supabase is not configured", () => {
    const status = buildEnvironmentRuntimeStatusFromEnv(noEnv, "2026-01-01T00:00:00.000Z");

    expect(status.releaseGate.stage).toBe("local-ready");
    expect(status.releaseGate.checks.find((check) => check.label === "Local fallback")?.status).toBe(
      "pass",
    );
  });

  it("reaches migration-ready stage once Supabase migration variables are all configured", () => {
    const status = buildEnvironmentRuntimeStatusFromEnv(
      supabaseConfiguredEnv,
      "2026-01-01T00:00:00.000Z",
    );

    expect(status.releaseGate.stage).toBe("migration-ready");
    expect(
      status.releaseGate.checks.find((check) => check.label === "Supabase migration gate")
        ?.status,
    ).toBe("pass");
  });

  it("blocks the release gate when storage mode is not local", () => {
    const gate = buildEnvironmentReleaseGate({
      checkedAt: "2026-01-01T00:00:00.000Z",
      generation: { configured: false, mode: "local", model: null },
      storage: { configured: true, mode: "supabase" },
      supabase: {
        importExecutionEnabled: false,
        projectRefConfigured: false,
        publicClientConfigured: false,
        readyForMigration: false,
        serverImporterConfigured: false,
      },
      variables: [],
      warnings: [],
    });

    expect(gate.stage).toBe("blocked");
    expect(gate.checks.find((check) => check.label === "Local fallback")?.status).toBe("block");
  });

  it("computes score as the rounded percentage of passing checks", () => {
    const status = buildEnvironmentRuntimeStatusFromEnv(
      supabaseConfiguredEnv,
      "2026-01-01T00:00:00.000Z",
    );
    const passCount = status.releaseGate.checks.filter((check) => check.status === "pass").length;
    const expectedScore = Math.round((passCount / status.releaseGate.checks.length) * 100);

    expect(status.releaseGate.score).toBe(expectedScore);
  });
});

describe("compareEnvironmentRuntimeSnapshot", () => {
  function makeSnapshot(env: EnvironmentVariableSource): EnvironmentRuntimeSnapshot {
    return createEnvironmentRuntimeSnapshot(
      buildEnvironmentRuntimeStatusFromEnv(env, "2026-01-01T00:00:00.000Z"),
    );
  }

  it("reports no changes when comparing identical status snapshots", () => {
    const snapshot = makeSnapshot(noEnv);
    const currentStatus = buildEnvironmentRuntimeStatusFromEnv(noEnv, "2026-01-02T00:00:00.000Z");

    const comparison = compareEnvironmentRuntimeSnapshot(currentStatus, snapshot);

    expect(comparison.stageChanged).toBe(false);
    expect(comparison.scoreDelta).toBe(0);
    expect(comparison.changedVariables).toHaveLength(0);
    expect(comparison.changedChecks).toHaveLength(0);
  });

  it("detects stage movement and a positive score delta when Supabase becomes configured", () => {
    const snapshot = makeSnapshot(noEnv);
    const currentStatus = buildEnvironmentRuntimeStatusFromEnv(
      supabaseConfiguredEnv,
      "2026-01-02T00:00:00.000Z",
    );

    const comparison = compareEnvironmentRuntimeSnapshot(currentStatus, snapshot);

    expect(comparison.stageChanged).toBe(true);
    expect(comparison.snapshotStage).toBe("local-ready");
    expect(comparison.currentStage).toBe("migration-ready");
    expect(comparison.scoreDelta).toBeGreaterThan(0);
  });

  it("lists only the variables whose configured status actually changed", () => {
    const snapshot = makeSnapshot(noEnv);
    const currentStatus = buildEnvironmentRuntimeStatusFromEnv(
      openAiOnlyEnv,
      "2026-01-02T00:00:00.000Z",
    );

    const comparison = compareEnvironmentRuntimeSnapshot(currentStatus, snapshot);
    const changedKeys = comparison.changedVariables.map((item) => item.key);

    expect(changedKeys).toContain("OPENAI_API_KEY");
    expect(changedKeys).toContain("OPENAI_MODEL");
    expect(changedKeys).not.toContain("SUPABASE_PROJECT_REF");
  });
});
