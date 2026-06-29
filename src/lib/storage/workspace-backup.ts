"use client";

import {
  defaultCompanyProfile,
  defaultUserProfile,
  type CompanyProfile,
  type LearningMemory,
  type PromptAsset,
  type PromptDeletedAsset,
  type PromptSkill,
  type UserProfile,
} from "@/lib/prompt";
import {
  readStoredJson,
  storageKeys,
  writeStoredJson,
} from "@/lib/storage/local-store";
import { isSkillRunPrompt } from "@/lib/skills/skill-runner";

export const workspaceBackupSchemaVersion = 1;
export const workspaceBackupAppId = "prompt-ai-studio";

export interface WorkspaceBackupData {
  userProfile: UserProfile;
  companyProfile: CompanyProfile;
  prompts: PromptAsset[];
  memories: LearningMemory[];
  skills: PromptSkill[];
  deletedPrompts: PromptDeletedAsset[];
}

export interface WorkspaceBackupCounts {
  prompts: number;
  promptVersions: number;
  feedback: number;
  memories: number;
  skills: number;
  skillRuns: number;
  deletedPrompts: number;
}

export interface WorkspaceBackup {
  app: typeof workspaceBackupAppId;
  schemaVersion: typeof workspaceBackupSchemaVersion;
  exportedAt: string;
  counts: WorkspaceBackupCounts;
  data: WorkspaceBackupData;
}

export interface WorkspaceBackupMeta {
  exportedAt: string;
  counts: WorkspaceBackupCounts;
  fingerprint: string;
}

export interface WorkspaceBackupCountChange {
  label: string;
  current: number;
  backup: number;
}

export type WorkspaceBackupParseResult =
  | { ok: true; backup: WorkspaceBackup }
  | { ok: false; error: string };

export const emptyWorkspaceBackupCounts: WorkspaceBackupCounts = {
  prompts: 0,
  promptVersions: 0,
  feedback: 0,
  memories: 0,
  skills: 0,
  skillRuns: 0,
  deletedPrompts: 0,
};

export const emptyWorkspaceBackupMeta: WorkspaceBackupMeta = {
  exportedAt: "",
  counts: emptyWorkspaceBackupCounts,
  fingerprint: "",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseWorkspaceBackupData(value: unknown): WorkspaceBackupData | null {
  if (!isRecord(value)) {
    return null;
  }

  const hasRequiredData =
    isRecord(value.userProfile) &&
    isRecord(value.companyProfile) &&
    Array.isArray(value.prompts) &&
    Array.isArray(value.memories) &&
    Array.isArray(value.skills);

  if (!hasRequiredData) {
    return null;
  }

  return {
    userProfile: value.userProfile as UserProfile,
    companyProfile: value.companyProfile as CompanyProfile,
    prompts: value.prompts as PromptAsset[],
    memories: value.memories as LearningMemory[],
    skills: value.skills as PromptSkill[],
    deletedPrompts: Array.isArray(value.deletedPrompts)
      ? (value.deletedPrompts as PromptDeletedAsset[])
      : [],
  };
}

export function readWorkspaceBackupData(): WorkspaceBackupData {
  return {
    userProfile: readStoredJson<UserProfile>(
      storageKeys.userProfile,
      defaultUserProfile,
    ),
    companyProfile: readStoredJson<CompanyProfile>(
      storageKeys.companyProfile,
      defaultCompanyProfile,
    ),
    prompts: readStoredJson<PromptAsset[]>(storageKeys.prompts, []),
    memories: readStoredJson<LearningMemory[]>(storageKeys.memories, []),
    skills: readStoredJson<PromptSkill[]>(storageKeys.skills, []),
    deletedPrompts: readStoredJson<PromptDeletedAsset[]>(
      storageKeys.deletedPrompts,
      [],
    ),
  };
}

export function summarizeWorkspaceBackupData(
  data: WorkspaceBackupData,
): WorkspaceBackupCounts {
  return {
    prompts: data.prompts.length,
    promptVersions: data.prompts.reduce(
      (sum, prompt) => sum + prompt.versions.length,
      0,
    ),
    feedback: data.prompts.reduce(
      (sum, prompt) => sum + prompt.feedback.length,
      0,
    ),
    memories: data.memories.length,
    skills: data.skills.length,
    skillRuns: data.prompts.filter(isSkillRunPrompt).length,
    deletedPrompts: data.deletedPrompts.length,
  };
}

export function areWorkspaceBackupCountsEqual(
  current: WorkspaceBackupCounts,
  backup: WorkspaceBackupCounts,
) {
  return (
    current.prompts === backup.prompts &&
    current.promptVersions === backup.promptVersions &&
    current.feedback === backup.feedback &&
    current.memories === backup.memories &&
    current.skills === backup.skills &&
    current.skillRuns === backup.skillRuns &&
    current.deletedPrompts === (backup.deletedPrompts ?? 0)
  );
}

export function isWorkspaceBackupMetaCurrent(
  meta: WorkspaceBackupMeta,
  currentCounts: WorkspaceBackupCounts,
) {
  return (
    Boolean(meta.exportedAt) &&
    areWorkspaceBackupCountsEqual(currentCounts, meta.counts)
  );
}

export function getWorkspaceBackupCountChanges(
  currentCounts: WorkspaceBackupCounts,
  backupCounts: WorkspaceBackupCounts,
): WorkspaceBackupCountChange[] {
  const items: Array<[string, keyof WorkspaceBackupCounts]> = [
    ["프롬프트", "prompts"],
    ["버전", "promptVersions"],
    ["피드백", "feedback"],
    ["학습 메모리", "memories"],
    ["스킬", "skills"],
    ["스킬 실행", "skillRuns"],
    ["삭제 보관함", "deletedPrompts"],
  ];

  return items
    .filter(([, key]) => currentCounts[key] !== (backupCounts[key] ?? 0))
    .map(([label, key]) => ({
      label,
      current: currentCounts[key],
      backup: backupCounts[key] ?? 0,
    }));
}

export function createWorkspaceBackup(
  data: WorkspaceBackupData = readWorkspaceBackupData(),
): WorkspaceBackup {
  return {
    app: workspaceBackupAppId,
    schemaVersion: workspaceBackupSchemaVersion,
    exportedAt: new Date().toISOString(),
    counts: summarizeWorkspaceBackupData(data),
    data,
  };
}

export function serializeWorkspaceBackup(backup: WorkspaceBackup) {
  return JSON.stringify(backup, null, 2);
}

export function getWorkspaceBackupFingerprint(rawJson: string) {
  const normalized = rawJson.trim();
  let hash = 0x811c9dc5;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `bk-${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
}

export function createWorkspaceBackupMeta(
  backup: WorkspaceBackup,
): WorkspaceBackupMeta {
  return {
    exportedAt: backup.exportedAt,
    counts: backup.counts,
    fingerprint: getWorkspaceBackupFingerprint(serializeWorkspaceBackup(backup)),
  };
}

export function parseWorkspaceBackup(rawJson: string): WorkspaceBackupParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      ok: false,
      error: "JSON 형식이 올바르지 않습니다.",
    };
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      error: "백업 파일의 최상위 구조가 올바르지 않습니다.",
    };
  }

  if (parsed.app !== workspaceBackupAppId) {
    return {
      ok: false,
      error: "Prompt AI Studio 백업 파일이 아닙니다.",
    };
  }

  if (parsed.schemaVersion !== workspaceBackupSchemaVersion) {
    return {
      ok: false,
      error: `지원하지 않는 백업 버전입니다. 현재 지원 버전: ${workspaceBackupSchemaVersion}`,
    };
  }

  const data = parseWorkspaceBackupData(parsed.data);

  if (!data) {
    return {
      ok: false,
      error:
        "백업 데이터에 userProfile, companyProfile, prompts, memories, skills가 모두 필요합니다.",
    };
  }

  return {
    ok: true,
    backup: {
      app: workspaceBackupAppId,
      schemaVersion: workspaceBackupSchemaVersion,
      exportedAt:
        typeof parsed.exportedAt === "string"
          ? parsed.exportedAt
          : new Date().toISOString(),
      counts: summarizeWorkspaceBackupData(data),
      data,
    },
  };
}

export function restoreWorkspaceBackup(backup: WorkspaceBackup) {
  writeStoredJson(storageKeys.userProfile, backup.data.userProfile);
  writeStoredJson(storageKeys.companyProfile, backup.data.companyProfile);
  writeStoredJson(storageKeys.prompts, backup.data.prompts);
  writeStoredJson(storageKeys.memories, backup.data.memories);
  writeStoredJson(storageKeys.skills, backup.data.skills);
  writeStoredJson(storageKeys.deletedPrompts, backup.data.deletedPrompts);
}
