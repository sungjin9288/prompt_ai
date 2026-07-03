import { describe, expect, it } from "vitest";

import {
  getSupabaseImportInsertRequests,
  validateSupabaseImportExecutionPlan,
} from "@/lib/data/supabase-importer";
import { createSupabaseImportDryRun } from "@/lib/data/supabase-import-dry-run";
import { createSupabaseImportExecutionPlan } from "@/lib/data/supabase-import-execution-plan";
import { createWorkspaceBackup, type WorkspaceBackupData } from "@/lib/storage/workspace-backup";
import { defaultCompanyProfile, defaultUserProfile } from "@/lib/prompt/defaults";
import type { PromptAsset, PromptScoreBreakdown, PromptVersion } from "@/lib/prompt/types";

const VALID_WORKSPACE_ID = "11111111-1111-4111-8111-111111111111";
const VALID_OWNER_ID = "22222222-2222-4222-8222-222222222222";

function makeScoreBreakdown(): PromptScoreBreakdown {
  return {
    clarity: 4,
    context: 4,
    outputFormat: 4,
    constraints: 4,
    expertise: 4,
    modelFit: 4,
    reusability: 4,
  };
}

function makeVersion(overrides: Partial<PromptVersion> = {}): PromptVersion {
  return {
    id: "version-1",
    targetModel: "claude",
    modelLabel: "Claude",
    content: "본문",
    qualityScore: 4.0,
    scoreBreakdown: makeScoreBreakdown(),
    assumptions: [],
    missingContext: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makePrompt(overrides: Partial<PromptAsset> = {}): PromptAsset {
  return {
    id: "prompt-1",
    title: "제목",
    source: "local",
    rawInput: "원문",
    goal: "목표",
    domain: "리서치",
    targetModels: ["claude"],
    versions: [makeVersion()],
    feedback: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeWorkspaceData(overrides: Partial<WorkspaceBackupData> = {}): WorkspaceBackupData {
  return {
    userProfile: defaultUserProfile,
    companyProfile: defaultCompanyProfile,
    prompts: [],
    memories: [],
    skills: [],
    deletedPrompts: [],
    ...overrides,
  };
}

function makeExecutionPlan(promptCount: number) {
  const prompts = Array.from({ length: promptCount }, (_, index) =>
    makePrompt({ id: `prompt-${index + 1}`, versions: [makeVersion({ id: `version-${index + 1}` })] }),
  );
  const backup = createWorkspaceBackup(makeWorkspaceData({ prompts }));
  const dryRun = createSupabaseImportDryRun(backup);

  return createSupabaseImportExecutionPlan(dryRun, {
    workspaceId: VALID_WORKSPACE_ID,
    ownerUserId: VALID_OWNER_ID,
  });
}

describe("validateSupabaseImportExecutionPlan", () => {
  it("passes with no blockers for a plan built from valid UUIDs and no prompts", () => {
    const plan = makeExecutionPlan(0);

    const result = validateSupabaseImportExecutionPlan(plan);

    expect(result.ok).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("passes with no blockers for a plan containing resolved prompt rows", () => {
    const plan = makeExecutionPlan(2);

    const result = validateSupabaseImportExecutionPlan(plan);

    expect(result.ok).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("flags a non-UUID workspaceId as a blocker", () => {
    const plan = makeExecutionPlan(0);
    const invalidPlan = { ...plan, workspaceId: "not-a-uuid" };

    const result = validateSupabaseImportExecutionPlan(invalidPlan);

    expect(result.ok).toBe(false);
    expect(result.blockers).toContain("workspaceId must be a Supabase UUID.");
  });

  it("flags a non-UUID ownerUserId as a blocker", () => {
    const plan = makeExecutionPlan(0);
    const invalidPlan = { ...plan, ownerUserId: "not-a-uuid" };

    const result = validateSupabaseImportExecutionPlan(invalidPlan);

    expect(result.ok).toBe(false);
    expect(result.blockers).toContain("ownerUserId must be a Supabase UUID.");
  });

  it("flags unresolved pending-* references remaining in the plan", () => {
    const plan = makeExecutionPlan(0);
    const invalidPlan = {
      ...plan,
      unresolvedPendingReferences: [
        { table: "prompt_assets", row: 1, field: "source_skill_id", value: "pending-skill-1" },
      ],
    };

    const result = validateSupabaseImportExecutionPlan(invalidPlan);

    expect(result.ok).toBe(false);
    expect(result.blockers.some((blocker) => blocker.includes("unresolved pending-*"))).toBe(true);
  });

  it("flags a row whose resolvedId is not a UUID", () => {
    const plan = makeExecutionPlan(1);
    const invalidPlan = {
      ...plan,
      batches: plan.batches.map((batch) =>
        batch.table === "prompt_assets"
          ? { ...batch, rows: batch.rows.map((row) => ({ ...row, resolvedId: "not-a-uuid" })) }
          : batch,
      ),
    };

    const result = validateSupabaseImportExecutionPlan(invalidPlan);

    expect(result.ok).toBe(false);
    expect(result.blockers.some((blocker) => blocker.includes("resolvedId is not a UUID"))).toBe(
      true,
    );
  });

  it("flags a row payload that still contains pending- text anywhere in its values", () => {
    const plan = makeExecutionPlan(1);
    const invalidPlan = {
      ...plan,
      batches: plan.batches.map((batch) =>
        batch.table === "prompt_assets"
          ? {
              ...batch,
              rows: batch.rows.map((row) => ({
                ...row,
                payload: { ...row.payload, source_skill_name: "pending-skill-name" },
              })),
            }
          : batch,
      ),
    };

    const result = validateSupabaseImportExecutionPlan(invalidPlan);

    expect(result.ok).toBe(false);
    expect(
      result.blockers.some((blocker) => blocker.includes("still contains pending-* text")),
    ).toBe(true);
  });
});

describe("getSupabaseImportInsertRequests", () => {
  it("excludes empty batches from the insert request list", () => {
    const plan = makeExecutionPlan(0);

    const requests = getSupabaseImportInsertRequests(plan);
    const tables = requests.map((request) => request.table);

    expect(tables).not.toContain("prompt_assets");
    expect(tables).not.toContain("prompt_versions");
  });

  it("includes non-empty batches with their rows mapped to plain payloads", () => {
    const plan = makeExecutionPlan(1);

    const requests = getSupabaseImportInsertRequests(plan);
    const promptRequest = requests.find((request) => request.table === "prompt_assets");

    expect(promptRequest).toBeDefined();
    expect(promptRequest?.rows).toHaveLength(1);
    expect(promptRequest?.rows[0]).not.toHaveProperty("resolvedId");
    expect(promptRequest?.rows[0]).not.toHaveProperty("pendingId");
  });

  it("preserves batch order and dependency metadata on each request", () => {
    const plan = makeExecutionPlan(1);

    const requests = getSupabaseImportInsertRequests(plan);
    const workspaceRequest = requests.find((request) => request.table === "workspaces");

    expect(workspaceRequest?.order).toBe(1);
    expect(workspaceRequest?.dependency).toBe("없음");
  });
});
