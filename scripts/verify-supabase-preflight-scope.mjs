import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadTypescriptModule } from "./lib/load-typescript-module.mjs";

const {
  formatSupabaseImportPreflightScopeChangeDetails,
  formatSupabaseImportPreflightScopeChanges,
  getSupabaseImportPreflightScopeChangeDetails,
  getSupabaseImportPreflightScopeChanges,
  getSupabaseImportPreflightScopeError,
  getSupabaseImportPreflightScopeStatus,
  normalizeSupabaseImportCurrentScope,
} = loadTypescriptModule("src/lib/data/supabase-import-preflight-scope.ts");

const current = {
  backupFingerprint: "backup:abc",
  ownerUserId: "00000000-0000-4000-8000-000000000001",
  workspaceId: "00000000-0000-4000-8000-000000000002",
};
const stalePreflight = {
  backupFingerprint: "backup:changed",
  ownerUserId: "00000000-0000-4000-8000-000000000099",
  workspaceId: "00000000-0000-4000-8000-000000000098",
};

function getOutputPath(args) {
  const outIndex = args.indexOf("--out");

  if (outIndex === -1) {
    return null;
  }

  const outputPath = args[outIndex + 1];

  assert.ok(outputPath, "--out requires a file path");
  assert.equal(
    args.length,
    outIndex + 2,
    "verify:scope only accepts --out <file>",
  );

  return outputPath;
}

const outputPath = getOutputPath(process.argv.slice(2));

function normalizeArray(items) {
  return Array.from(items);
}

function normalizePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildScopeGuardHandoffText() {
  const currentStatus = getSupabaseImportPreflightScopeStatus({
    current,
    preflight: current,
  });
  const missingStatus = getSupabaseImportPreflightScopeStatus({ current });
  const staleStatus = getSupabaseImportPreflightScopeStatus({
    current,
    preflight: stalePreflight,
  });
  const staleDetails = formatSupabaseImportPreflightScopeChangeDetails(
    getSupabaseImportPreflightScopeChangeDetails({
      current,
      preflight: stalePreflight,
    }),
  );

  return [
    "# Supabase Preflight Scope Guard",
    "",
    `- currentStatus: ${currentStatus}`,
    `- missingStatus: ${missingStatus}`,
    `- staleStatus: ${staleStatus}`,
    `- backupFingerprint: ${current.backupFingerprint}`,
    `- workspaceId: ${current.workspaceId}`,
    `- ownerUserId: ${current.ownerUserId}`,
    `- staleDetail: ${staleDetails}`,
    "",
    "## Operator next action",
    "- Run API preflight again when backup fingerprint, workspace_id, or owner_user_id changes.",
    "- Copy the controlled execution packet only after the preflight scope is current.",
    "- This artifact is a no-write scope guard and does not connect to Supabase.",
  ].join("\n");
}

function writeScopeGuardHandoff(outputPath, handoffText) {
  if (!outputPath) {
    return;
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${handoffText}\n`, "utf8");
}

const normalizedCurrent = normalizeSupabaseImportCurrentScope({
  ...current,
  ownerUserId: ` ${current.ownerUserId} `,
  workspaceId: ` ${current.workspaceId} `,
});

assert.equal(
  normalizedCurrent.backupFingerprint,
  current.backupFingerprint,
  "current scope should preserve backup fingerprint",
);
assert.equal(
  normalizedCurrent.ownerUserId,
  current.ownerUserId,
  "current scope should trim owner ID",
);
assert.equal(
  normalizedCurrent.workspaceId,
  current.workspaceId,
  "current scope should trim workspace ID",
);

assert.equal(
  getSupabaseImportPreflightScopeStatus({
    current,
    preflight: current,
  }),
  "current",
  "matching preflight scope should be current",
);

assert.equal(
  getSupabaseImportPreflightScopeStatus({
    current,
  }),
  "missing",
  "missing preflight scope should be missing",
);

assert.equal(
  getSupabaseImportPreflightScopeStatus({
    current,
    preflight: {
      ...current,
      workspaceId: "00000000-0000-4000-8000-000000000099",
    },
  }),
  "stale",
  "changed workspace ID should stale the preflight",
);

assert.equal(
  getSupabaseImportPreflightScopeStatus({
    current,
    preflight: {
      ...current,
      backupFingerprint: "backup:changed",
    },
  }),
  "stale",
  "changed backup fingerprint should stale the preflight",
);

assert.deepEqual(
  normalizeArray(
    getSupabaseImportPreflightScopeChanges({
      current,
      preflight: {
        ...current,
        workspaceId: "00000000-0000-4000-8000-000000000099",
      },
    }),
  ),
  ["workspace_id"],
  "scope changes should identify a changed workspace ID",
);

assert.deepEqual(
  normalizeArray(
    getSupabaseImportPreflightScopeChanges({
      current: {
        ...current,
        ownerUserId: ` ${current.ownerUserId} `,
        workspaceId: ` ${current.workspaceId} `,
      },
      preflight: current,
    }),
  ),
  [],
  "scope changes should compare against trimmed current UUIDs",
);

assert.deepEqual(
  normalizeArray(
    getSupabaseImportPreflightScopeChanges({
      current,
      preflight: stalePreflight,
    }),
  ),
  ["backupFingerprint", "workspace_id", "owner_user_id"],
  "scope changes should preserve deterministic changed input order",
);

assert.deepEqual(
  normalizeArray(
    getSupabaseImportPreflightScopeChanges({
      current,
    }),
  ),
  [],
  "missing preflight scope should have no comparable changed inputs",
);

assert.equal(
  formatSupabaseImportPreflightScopeChanges([
    "backupFingerprint",
    "workspace_id",
    "owner_user_id",
  ]),
  "Changed scope inputs: backup fingerprint, workspace_id, owner_user_id",
  "scope change formatter should produce a readable deterministic summary",
);

assert.equal(
  formatSupabaseImportPreflightScopeChanges([]),
  "",
  "scope change formatter should return an empty string when there are no changes",
);

assert.deepEqual(
  normalizePlain(
    getSupabaseImportPreflightScopeChangeDetails({
      current,
      preflight: {
        ...current,
        workspaceId: "00000000-0000-4000-8000-000000000099",
      },
    }),
  ),
  [
    {
      currentValue: current.workspaceId,
      field: "workspace_id",
      label: "workspace_id",
      preflightValue: "00000000-0000-4000-8000-000000000099",
    },
  ],
  "scope change details should include field labels and preflight/current values",
);

assert.equal(
  formatSupabaseImportPreflightScopeChangeDetails([
    {
      currentValue: current.workspaceId,
      field: "workspace_id",
      label: "workspace_id",
      preflightValue: "00000000-0000-4000-8000-000000000099",
    },
  ]),
  `Changed scope inputs: workspace_id (preflight: 00000000-0000-4000-8000-000000000099 -> current: ${current.workspaceId})`,
  "scope change detail formatter should include preflight and current values",
);

assert.equal(
  formatSupabaseImportPreflightScopeChangeDetails([]),
  "",
  "scope change detail formatter should return an empty string when there are no details",
);

assert.match(
  getSupabaseImportPreflightScopeError("missing"),
  /preflight/,
  "missing status should ask for API preflight",
);

assert.match(
  getSupabaseImportPreflightScopeError("stale"),
  /다시 실행/,
  "stale status should ask to rerun preflight",
);

assert.equal(
  getSupabaseImportPreflightScopeError("current"),
  "",
  "current status should not block copy actions",
);

const scopeGuardHandoffText = buildScopeGuardHandoffText();

assert.match(
  scopeGuardHandoffText,
  /staleStatus: stale/,
  "scope guard handoff should include stale status",
);
assert.match(
  scopeGuardHandoffText,
  /backup fingerprint.*workspace_id.*owner_user_id/,
  "scope guard handoff should include changed scope details",
);
assert.match(
  scopeGuardHandoffText,
  /does not connect to Supabase/,
  "scope guard handoff should state that it does not connect to Supabase",
);

writeScopeGuardHandoff(outputPath, scopeGuardHandoffText);

if (outputPath) {
  console.log(`Supabase preflight scope handoff written to ${outputPath}.`);
}

console.log("Supabase preflight scope verification passed.");
