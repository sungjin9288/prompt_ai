import { describe, expect, it } from "vitest";

import {
  mergeSampleWorkspace,
  sampleWorkspace,
  SAMPLE_ID_PREFIX,
} from "@/lib/samples/sample-workspace";
import { targetModels } from "@/lib/prompt/defaults";
import type { MemoryScope, PromptScoreBreakdown } from "@/lib/prompt/types";

const scoreBreakdownKeys: Array<keyof PromptScoreBreakdown> = [
  "clarity",
  "context",
  "outputFormat",
  "constraints",
  "expertise",
  "modelFit",
  "reusability",
];

const validMemoryScopes: MemoryScope[] = ["user", "company", "domain", "skill"];

describe("sampleWorkspace prompts", () => {
  it("includes at least six sample prompts", () => {
    expect(sampleWorkspace.prompts.length).toBeGreaterThanOrEqual(6);
  });

  it("gives every sample prompt at least one version", () => {
    for (const prompt of sampleWorkspace.prompts) {
      expect(prompt.versions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("gives every version a complete, finite 7-key scoreBreakdown", () => {
    for (const prompt of sampleWorkspace.prompts) {
      for (const version of prompt.versions) {
        expect(Object.keys(version.scoreBreakdown).sort()).toEqual(
          [...scoreBreakdownKeys].sort(),
        );

        for (const key of scoreBreakdownKeys) {
          const value = version.scoreBreakdown[key];
          expect(Number.isFinite(value)).toBe(true);
        }

        expect(Number.isFinite(version.qualityScore)).toBe(true);
      }
    }
  });

  it("gives every version a valid targetModel and non-empty content", () => {
    for (const prompt of sampleWorkspace.prompts) {
      for (const version of prompt.versions) {
        expect(targetModels).toContain(version.targetModel);
        expect(version.content.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("prefixes every sample prompt id with sample-", () => {
    for (const prompt of sampleWorkspace.prompts) {
      expect(prompt.id.startsWith(SAMPLE_ID_PREFIX)).toBe(true);
    }
  });
});

describe("sampleWorkspace skills", () => {
  it("includes at least two sample skills", () => {
    expect(sampleWorkspace.skills.length).toBeGreaterThanOrEqual(2);
  });

  it("gives every skill its required fields", () => {
    for (const skill of sampleWorkspace.skills) {
      expect(skill.id.startsWith(SAMPLE_ID_PREFIX)).toBe(true);
      expect(skill.name.trim().length).toBeGreaterThan(0);
      expect(skill.description.trim().length).toBeGreaterThan(0);
      expect(skill.domain.trim().length).toBeGreaterThan(0);
      expect(targetModels).toContain(skill.targetModel);
      expect(skill.inputGuide.trim().length).toBeGreaterThan(0);
      expect(skill.promptTemplate.trim().length).toBeGreaterThan(0);
      expect(skill.outputFormat.trim().length).toBeGreaterThan(0);
      expect(Array.isArray(skill.qualityChecklist)).toBe(true);
      expect(skill.qualityChecklist.length).toBeGreaterThan(0);
      expect(Array.isArray(skill.tags)).toBe(true);
      expect(typeof skill.usageCount).toBe("number");
      expect(skill.createdAt.trim().length).toBeGreaterThan(0);
      expect(skill.updatedAt.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("sampleWorkspace memories", () => {
  it("includes at least three sample memories", () => {
    expect(sampleWorkspace.memories.length).toBeGreaterThanOrEqual(3);
  });

  it("gives every memory a valid scope", () => {
    for (const memory of sampleWorkspace.memories) {
      expect(validMemoryScopes).toContain(memory.scope);
    }
  });

  it("uses varied scopes across the sample memories", () => {
    const scopes = new Set(sampleWorkspace.memories.map((memory) => memory.scope));
    expect(scopes.size).toBeGreaterThanOrEqual(2);
  });

  it("prefixes every sample memory id with sample-", () => {
    for (const memory of sampleWorkspace.memories) {
      expect(memory.id.startsWith(SAMPLE_ID_PREFIX)).toBe(true);
    }
  });
});

describe("sample id uniqueness", () => {
  it("carries unique ids across prompts, skills, and memories combined", () => {
    const allIds = [
      ...sampleWorkspace.prompts.map((prompt) => prompt.id),
      ...sampleWorkspace.skills.map((skill) => skill.id),
      ...sampleWorkspace.memories.map((memory) => memory.id),
    ];

    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

describe("mergeSampleWorkspace", () => {
  it("appends samples when the existing list is empty", () => {
    const result = mergeSampleWorkspace([], sampleWorkspace.memories);

    expect(result).toEqual(sampleWorkspace.memories);
  });

  it("dedupes and no-ops when all sample ids already exist", () => {
    const existing = [...sampleWorkspace.memories];
    const result = mergeSampleWorkspace(existing, sampleWorkspace.memories);

    expect(result).toBe(existing);
    expect(result.length).toBe(sampleWorkspace.memories.length);
  });

  it("appends only the missing samples when some ids already exist", () => {
    const [first, ...rest] = sampleWorkspace.memories;
    const existing = [first];

    const result = mergeSampleWorkspace(existing, sampleWorkspace.memories);

    expect(result.length).toBe(sampleWorkspace.memories.length);
    expect(result).toEqual(expect.arrayContaining(rest));
  });

  it("does not mutate the existing or sample input arrays", () => {
    const existing = [sampleWorkspace.memories[0]];
    const existingCopy = [...existing];
    const samplesCopy = [...sampleWorkspace.memories];

    mergeSampleWorkspace(existing, sampleWorkspace.memories);

    expect(existing).toEqual(existingCopy);
    expect(sampleWorkspace.memories).toEqual(samplesCopy);
  });

  it("preserves unrelated existing items when appending samples", () => {
    const customMemory = {
      ...sampleWorkspace.memories[0],
      id: "user-custom-memory",
    };

    const result = mergeSampleWorkspace([customMemory], sampleWorkspace.memories);

    expect(result).toContainEqual(customMemory);
    expect(result.length).toBe(sampleWorkspace.memories.length + 1);
  });
});
