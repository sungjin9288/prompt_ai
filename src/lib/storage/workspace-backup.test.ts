import { describe, expect, it } from "vitest";

import {
  areWorkspaceBackupCountsEqual,
  createWorkspaceBackup,
  createWorkspaceBackupMeta,
  emptyWorkspaceBackupCounts,
  getWorkspaceBackupCountChanges,
  getWorkspaceBackupFingerprint,
  isWorkspaceBackupMetaCurrent,
  parseWorkspaceBackup,
  serializeWorkspaceBackup,
  summarizeWorkspaceBackupData,
  workspaceBackupAppId,
  workspaceBackupSchemaVersion,
  type WorkspaceBackupData,
} from "@/lib/storage/workspace-backup";
import { defaultCompanyProfile, defaultUserProfile } from "@/lib/prompt/defaults";
import type { PromptAsset, PromptScoreBreakdown, PromptVersion } from "@/lib/prompt/types";

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

function makeWorkspaceData(
  overrides: Partial<WorkspaceBackupData> = {},
): WorkspaceBackupData {
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

describe("summarizeWorkspaceBackupData", () => {
  it("counts prompts, versions, and feedback across all prompts", () => {
    const promptA = makePrompt({
      id: "a",
      versions: [makeVersion({ id: "a-v1" }), makeVersion({ id: "a-v2" })],
      feedback: [
        {
          id: "f1",
          promptVersionId: "a-v1",
          rating: 5,
          comment: "좋음",
          feedbackType: "tone",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
    const promptB = makePrompt({ id: "b" });
    const counts = summarizeWorkspaceBackupData(
      makeWorkspaceData({ prompts: [promptA, promptB] }),
    );

    expect(counts.prompts).toBe(2);
    expect(counts.promptVersions).toBe(3);
    expect(counts.feedback).toBe(1);
  });

  it("counts skill-run prompts separately via skillRuns", () => {
    const skillRunPrompt = makePrompt({ id: "run-1", goal: "스킬 실행" });
    const regularPrompt = makePrompt({ id: "regular-1" });
    const counts = summarizeWorkspaceBackupData(
      makeWorkspaceData({ prompts: [skillRunPrompt, regularPrompt] }),
    );

    expect(counts.skillRuns).toBe(1);
    expect(counts.prompts).toBe(2);
  });

  it("returns all-zero counts for empty workspace data", () => {
    const counts = summarizeWorkspaceBackupData(makeWorkspaceData());

    expect(counts).toEqual(emptyWorkspaceBackupCounts);
  });
});

describe("areWorkspaceBackupCountsEqual / isWorkspaceBackupMetaCurrent", () => {
  it("treats identical counts as equal", () => {
    const counts = summarizeWorkspaceBackupData(
      makeWorkspaceData({ prompts: [makePrompt()] }),
    );

    expect(areWorkspaceBackupCountsEqual(counts, counts)).toBe(true);
  });

  it("treats different prompt counts as unequal", () => {
    const current = summarizeWorkspaceBackupData(
      makeWorkspaceData({ prompts: [makePrompt()] }),
    );
    const backup = emptyWorkspaceBackupCounts;

    expect(areWorkspaceBackupCountsEqual(current, backup)).toBe(false);
  });

  it("treats a meta with no exportedAt as not current", () => {
    const counts = summarizeWorkspaceBackupData(makeWorkspaceData());

    expect(
      isWorkspaceBackupMetaCurrent(
        { exportedAt: "", counts, fingerprint: "" },
        counts,
      ),
    ).toBe(false);
  });

  it("treats a meta with matching exportedAt and counts as current", () => {
    const counts = summarizeWorkspaceBackupData(makeWorkspaceData());

    expect(
      isWorkspaceBackupMetaCurrent(
        { exportedAt: "2026-01-01T00:00:00.000Z", counts, fingerprint: "bk-1" },
        counts,
      ),
    ).toBe(true);
  });
});

describe("getWorkspaceBackupCountChanges", () => {
  it("returns only the fields that differ between current and backup counts", () => {
    const current = { ...emptyWorkspaceBackupCounts, prompts: 3, skills: 1 };
    const backup = { ...emptyWorkspaceBackupCounts, prompts: 5, skills: 1 };

    const changes = getWorkspaceBackupCountChanges(current, backup);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ label: "프롬프트", current: 3, backup: 5 });
  });

  it("returns an empty list when counts are identical", () => {
    const counts = { ...emptyWorkspaceBackupCounts, prompts: 2 };

    expect(getWorkspaceBackupCountChanges(counts, counts)).toHaveLength(0);
  });
});

describe("createWorkspaceBackup / fingerprint stability", () => {
  it("sets the fixed app identifier and schema version", () => {
    const backup = createWorkspaceBackup(makeWorkspaceData());

    expect(backup.app).toBe(workspaceBackupAppId);
    expect(backup.schemaVersion).toBe(workspaceBackupSchemaVersion);
  });

  it("produces the same fingerprint for identical serialized backup content", () => {
    const rawJson = serializeWorkspaceBackup(
      createWorkspaceBackup(makeWorkspaceData({ prompts: [makePrompt()] })),
    );

    const fingerprintOne = getWorkspaceBackupFingerprint(rawJson);
    const fingerprintTwo = getWorkspaceBackupFingerprint(rawJson);

    expect(fingerprintOne).toBe(fingerprintTwo);
  });

  it("produces a different fingerprint when the underlying data changes", () => {
    const rawJsonA = serializeWorkspaceBackup(
      createWorkspaceBackup(makeWorkspaceData({ prompts: [makePrompt({ id: "a" })] })),
    );
    const rawJsonB = serializeWorkspaceBackup(
      createWorkspaceBackup(makeWorkspaceData({ prompts: [makePrompt({ id: "b" })] })),
    );

    expect(getWorkspaceBackupFingerprint(rawJsonA)).not.toBe(
      getWorkspaceBackupFingerprint(rawJsonB),
    );
  });

  it("ignores leading/trailing whitespace differences when fingerprinting", () => {
    const rawJson = serializeWorkspaceBackup(createWorkspaceBackup(makeWorkspaceData()));

    expect(getWorkspaceBackupFingerprint(rawJson)).toBe(
      getWorkspaceBackupFingerprint(`  ${rawJson}\n\n`),
    );
  });

  it("derives a matching fingerprint in createWorkspaceBackupMeta for the same backup", () => {
    const backup = createWorkspaceBackup(makeWorkspaceData({ prompts: [makePrompt()] }));
    const meta = createWorkspaceBackupMeta(backup);

    expect(meta.fingerprint).toBe(
      getWorkspaceBackupFingerprint(serializeWorkspaceBackup(backup)),
    );
    expect(meta.exportedAt).toBe(backup.exportedAt);
    expect(meta.counts).toEqual(backup.counts);
  });
});

describe("parseWorkspaceBackup", () => {
  it("rejects malformed JSON", () => {
    const result = parseWorkspaceBackup("{not valid json");

    expect(result.ok).toBe(false);
  });

  it("rejects a JSON payload whose top level is not an object", () => {
    const result = parseWorkspaceBackup("[1, 2, 3]");

    expect(result.ok).toBe(false);
  });

  it("rejects a payload with the wrong app identifier", () => {
    const result = parseWorkspaceBackup(
      JSON.stringify({
        app: "some-other-app",
        schemaVersion: workspaceBackupSchemaVersion,
        data: makeWorkspaceData(),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Prompt AI Studio");
    }
  });

  it("rejects a payload with an unsupported schema version", () => {
    const result = parseWorkspaceBackup(
      JSON.stringify({
        app: workspaceBackupAppId,
        schemaVersion: 999,
        data: makeWorkspaceData(),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("지원하지 않는 백업 버전");
    }
  });

  it("rejects a payload missing required data fields", () => {
    const result = parseWorkspaceBackup(
      JSON.stringify({
        app: workspaceBackupAppId,
        schemaVersion: workspaceBackupSchemaVersion,
        data: { userProfile: {} },
      }),
    );

    expect(result.ok).toBe(false);
  });

  it("accepts a well-formed backup and recomputes counts from its data", () => {
    const backup = createWorkspaceBackup(makeWorkspaceData({ prompts: [makePrompt()] }));
    const result = parseWorkspaceBackup(serializeWorkspaceBackup(backup));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.counts.prompts).toBe(1);
      expect(result.backup.data.prompts[0].id).toBe("prompt-1");
    }
  });

  it("defaults deletedPrompts to an empty array when absent from the payload", () => {
    const backup = createWorkspaceBackup(makeWorkspaceData());
    const dataWithoutDeleted = {
      userProfile: backup.data.userProfile,
      companyProfile: backup.data.companyProfile,
      prompts: backup.data.prompts,
      memories: backup.data.memories,
      skills: backup.data.skills,
    };
    const result = parseWorkspaceBackup(
      JSON.stringify({ ...backup, data: dataWithoutDeleted }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.data.deletedPrompts).toEqual([]);
    }
  });
});
