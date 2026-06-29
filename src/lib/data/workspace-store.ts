"use client";

import type { Dispatch, SetStateAction } from "react";
import type { EnvironmentRuntimeSnapshot } from "@/lib/data/environment-readiness";
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
  emptyWorkspaceBackupMeta,
  type WorkspaceBackupMeta,
} from "@/lib/storage/workspace-backup";
import { storageKeys, useStoredState } from "@/lib/storage/local-store";

export type StoreState<T> = readonly [T, Dispatch<SetStateAction<T>>, boolean];
export type StudioMemoryScopeSelection = Record<LearningMemory["scope"], boolean>;

export const defaultStudioMemoryScopeSelection: StudioMemoryScopeSelection = {
  user: true,
  company: true,
  domain: true,
  skill: true,
};

export function useUserProfileStore(): StoreState<UserProfile> {
  return useStoredState<UserProfile>(storageKeys.userProfile, defaultUserProfile);
}

export function useCompanyProfileStore(): StoreState<CompanyProfile> {
  return useStoredState<CompanyProfile>(
    storageKeys.companyProfile,
    defaultCompanyProfile,
  );
}

export function usePromptAssetsStore(): StoreState<PromptAsset[]> {
  return useStoredState<PromptAsset[]>(storageKeys.prompts, []);
}

export function useDeletedPromptAssetsStore(): StoreState<PromptDeletedAsset[]> {
  return useStoredState<PromptDeletedAsset[]>(storageKeys.deletedPrompts, []);
}

export function useLearningMemoriesStore(): StoreState<LearningMemory[]> {
  return useStoredState<LearningMemory[]>(storageKeys.memories, []);
}

export function usePromptSkillsStore(): StoreState<PromptSkill[]> {
  return useStoredState<PromptSkill[]>(storageKeys.skills, []);
}

export function useStudioMemoryScopeStore(): StoreState<StudioMemoryScopeSelection> {
  return useStoredState<StudioMemoryScopeSelection>(
    storageKeys.studioMemoryScopes,
    defaultStudioMemoryScopeSelection,
  );
}

export function useWorkspaceBackupMetaStore(): StoreState<WorkspaceBackupMeta> {
  return useStoredState<WorkspaceBackupMeta>(
    storageKeys.backupMeta,
    emptyWorkspaceBackupMeta,
  );
}

export function useRuntimeReadinessSnapshotsStore(): StoreState<
  EnvironmentRuntimeSnapshot[]
> {
  return useStoredState<EnvironmentRuntimeSnapshot[]>(
    storageKeys.runtimeReadinessSnapshots,
    [],
  );
}
