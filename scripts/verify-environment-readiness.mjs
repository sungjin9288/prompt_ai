import assert from "node:assert/strict";
import { loadTypescriptModule } from "./lib/load-typescript-module.mjs";

const { buildEnvironmentRuntimeStatusFromEnv } = loadTypescriptModule(
  "src/lib/data/environment-readiness.ts",
);

function getVariable(status, key) {
  return status.variables.find((item) => item.key === key);
}

function normalizeArray(items) {
  return Array.from(items);
}

const localStatus = buildEnvironmentRuntimeStatusFromEnv(
  {},
  "2026-06-16T00:00:00.000Z",
);

assert.equal(localStatus.checkedAt, "2026-06-16T00:00:00.000Z");
assert.equal(localStatus.releaseGate.stage, "local-ready");
assert.equal(localStatus.releaseGate.score, 17);
assert.equal(localStatus.generation.mode, "local");
assert.equal(localStatus.generation.model, null);
assert.equal(localStatus.storage.mode, "local");
assert.equal(localStatus.supabase.readyForMigration, false);
assert.equal(localStatus.supabase.importExecutionEnabled, false);
assert.equal(getVariable(localStatus, "OPENAI_API_KEY")?.configured, false);
assert.equal(
  getVariable(localStatus, "SUPABASE_IMPORT_EXECUTION_ENABLED")?.configured,
  false,
);
assert.deepEqual(
  normalizeArray(localStatus.warnings),
  [
    "OPENAI_API_KEY is missing; generation uses local fallback.",
    "Supabase public client env is incomplete.",
    "SUPABASE_SERVICE_ROLE_KEY is missing; server importer cannot run.",
  ],
);

const migrationStatus = buildEnvironmentRuntimeStatusFromEnv(
  {
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    OPENAI_API_KEY: "openai-key",
    SUPABASE_PROJECT_REF: "project-ref",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  },
  "2026-06-16T00:01:00.000Z",
);

assert.equal(migrationStatus.releaseGate.stage, "migration-ready");
assert.equal(migrationStatus.releaseGate.score, 100);
assert.equal(migrationStatus.generation.mode, "openai");
assert.equal(migrationStatus.generation.model, "gpt-5-mini");
assert.equal(migrationStatus.supabase.publicClientConfigured, true);
assert.equal(migrationStatus.supabase.serverImporterConfigured, true);
assert.equal(migrationStatus.supabase.projectRefConfigured, true);
assert.equal(migrationStatus.supabase.readyForMigration, true);
assert.deepEqual(normalizeArray(migrationStatus.warnings), []);

const customModelStatus = buildEnvironmentRuntimeStatusFromEnv({
  OPENAI_API_KEY: "openai-key",
  OPENAI_MODEL: "gpt-5",
});

assert.equal(customModelStatus.generation.mode, "openai");
assert.equal(customModelStatus.generation.model, "gpt-5");
assert.equal(getVariable(customModelStatus, "OPENAI_MODEL")?.configured, true);

const blockedStatus = buildEnvironmentRuntimeStatusFromEnv({
  APP_STORAGE_MODE: "supabase",
});

assert.equal(blockedStatus.releaseGate.stage, "blocked");
assert.equal(blockedStatus.storage.mode, "supabase");
assert.equal(getVariable(blockedStatus, "APP_STORAGE_MODE")?.configured, true);
assert.ok(
  normalizeArray(blockedStatus.warnings).includes(
    "APP_STORAGE_MODE is not local, but Supabase repository is not implemented yet.",
  ),
);

const importGateStatus = buildEnvironmentRuntimeStatusFromEnv({
  SUPABASE_IMPORT_EXECUTION_ENABLED: "true",
});

assert.equal(importGateStatus.supabase.importExecutionEnabled, true);
assert.equal(
  getVariable(importGateStatus, "SUPABASE_IMPORT_EXECUTION_ENABLED")
    ?.configured,
  true,
);
assert.ok(
  normalizeArray(importGateStatus.warnings).includes(
    "SUPABASE_IMPORT_EXECUTION_ENABLED is true; disable it after the import run.",
  ),
);

console.log("Environment readiness verification passed.");
