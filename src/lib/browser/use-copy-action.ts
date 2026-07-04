"use client";

import { useCallback, useState } from "react";

import { copyTextToClipboard } from "@/lib/browser/clipboard";

export type CopyActionStatus = "copied" | "failed";

export type CopyActionState = Readonly<Record<string, CopyActionStatus>>;

export const initialCopyActionState: CopyActionState = {};

export function applyCopyActionResult(
  state: CopyActionState,
  key: string,
  copied: boolean,
): CopyActionState {
  return {
    ...state,
    [key]: copied ? "copied" : "failed",
  };
}

export function clearCopyActionKey(
  state: CopyActionState,
  key: string,
): CopyActionState {
  if (!(key in state)) {
    return state;
  }

  const nextState = { ...state };

  delete nextState[key];

  return nextState;
}

export interface UseCopyActionResult {
  copy: (key: string, text: string) => Promise<boolean>;
  isCopied: (key: string) => boolean;
  isFailed: (key: string) => boolean;
  clear: (key: string) => void;
  reset: () => void;
}

export function useCopyAction(): UseCopyActionResult {
  const [state, setState] = useState<CopyActionState>(initialCopyActionState);

  const copy = useCallback(async (key: string, text: string) => {
    const copied = await copyTextToClipboard(text);

    setState((current) => applyCopyActionResult(current, key, copied));

    return copied;
  }, []);

  const isCopied = useCallback(
    (key: string) => state[key] === "copied",
    [state],
  );

  const isFailed = useCallback(
    (key: string) => state[key] === "failed",
    [state],
  );

  const clear = useCallback((key: string) => {
    setState((current) => clearCopyActionKey(current, key));
  }, []);

  const reset = useCallback(() => {
    setState(initialCopyActionState);
  }, []);

  return { copy, isCopied, isFailed, clear, reset };
}
