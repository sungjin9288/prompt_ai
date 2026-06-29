"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Dispatch, SetStateAction } from "react";

export const storageKeys = {
  userProfile: "prompt-ai-studio:user-profile",
  companyProfile: "prompt-ai-studio:company-profile",
  prompts: "prompt-ai-studio:prompts",
  deletedPrompts: "prompt-ai-studio:deleted-prompts",
  memories: "prompt-ai-studio:memories",
  skills: "prompt-ai-studio:skills",
  studioMemoryScopes: "prompt-ai-studio:studio-memory-scopes",
  backupMeta: "prompt-ai-studio:backup-meta",
  runtimeReadinessSnapshots: "prompt-ai-studio:runtime-readiness-snapshots",
};

export function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStoredJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("prompt-ai-studio-storage"));
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", callback);
  window.addEventListener("prompt-ai-studio-storage", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("prompt-ai-studio-storage", callback);
  };
}

function getRawSnapshot(key: string) {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(key) ?? "";
}

export function useStoredState<T>(key: string, fallback: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => getRawSnapshot(key),
    () => "",
  );

  const state = useMemo(() => {
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [fallback, raw]);

  const setState: Dispatch<SetStateAction<T>> = useCallback(
    (nextState) => {
      const current = readStoredJson(key, fallback);
      const resolved =
        typeof nextState === "function"
          ? (nextState as (currentState: T) => T)(current)
          : nextState;

      writeStoredJson(key, resolved);
    },
    [fallback, key],
  );

  return [state, setState, true] as const;
}

export function textToList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function listToText(value: string[]) {
  return value.join("\n");
}
