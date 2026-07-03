"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  findGoToShortcut,
  formatGoToDescription,
  goToShortcuts,
} from "@/lib/keyboard-shortcuts/go-to-registry";
import {
  hasBlockingModifier,
  isEditableTarget,
} from "@/lib/keyboard-shortcuts/input-guard";
import { setKeyboardHelpOpenListener } from "@/lib/browser/keyboard-help-bus";

const GO_TO_SEQUENCE_TIMEOUT_MS = 1200;

interface GeneralShortcut {
  keys: string;
  description: string;
}

const generalShortcuts: GeneralShortcut[] = [
  { keys: "⌘K / Ctrl K", description: "검색 팔레트 열기" },
  { keys: "?", description: "이 도움말" },
  { keys: "Esc", description: "닫기" },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const pendingGoToRef = useRef(false);
  const goToTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const clearPendingGoTo = useCallback(() => {
    pendingGoToRef.current = false;

    if (goToTimeoutRef.current !== null) {
      clearTimeout(goToTimeoutRef.current);
      goToTimeoutRef.current = null;
    }
  }, []);

  const closeHelp = useCallback(() => {
    setIsOpen(false);
    previouslyFocusedRef.current?.focus();
  }, []);

  const openHelp = useCallback(() => {
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    clearPendingGoTo();
    setIsOpen(true);
  }, [clearPendingGoTo]);

  useEffect(() => {
    setKeyboardHelpOpenListener(openHelp);

    return () => setKeyboardHelpOpenListener(null);
  }, [openHelp]);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => clearPendingGoTo();
  }, [clearPendingGoTo]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (isOpen) {
        if (event.key === "Escape") {
          closeHelp();
        }

        return;
      }

      if (isEditableTarget(event.target) || hasBlockingModifier(event)) {
        return;
      }

      if (pendingGoToRef.current) {
        const shortcut = findGoToShortcut(event.key);
        clearPendingGoTo();

        if (shortcut) {
          event.preventDefault();
          router.push(shortcut.href);
        }

        return;
      }

      if (event.key === "?") {
        event.preventDefault();
        openHelp();

        return;
      }

      if (event.key.toLowerCase() === "g") {
        pendingGoToRef.current = true;
        goToTimeoutRef.current = setTimeout(() => {
          clearPendingGoTo();
        }, GO_TO_SEQUENCE_TIMEOUT_MS);
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown);

    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, router, closeHelp, openHelp, clearPendingGoTo]);

  const handleDialogKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;

      if (!dialog) {
        return;
      }

      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();

        return;
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={closeHelp}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="키보드 단축키"
        className="relative z-10 w-full max-w-md rounded-lg border border-line bg-panel shadow-2xl"
        onKeyDown={handleDialogKeyDown}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-foreground">키보드 단축키</p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeHelp}
            className="rounded px-2 py-1 text-xs text-muted transition hover:bg-surface hover:text-foreground"
          >
            닫기
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-4 py-3">
          <section>
            <p className="px-1 py-1 text-[11px] font-semibold text-muted">
              일반
            </p>
            <ul className="space-y-1">
              {generalShortcuts.map((shortcut) => (
                <li
                  key={shortcut.keys}
                  className="flex items-center justify-between gap-3 rounded px-1 py-1.5 text-sm text-soft"
                >
                  <span>{shortcut.description}</span>
                  <kbd className="shrink-0 rounded border border-control-border bg-panel-strong px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                    {shortcut.keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-3">
            <p className="px-1 py-1 text-[11px] font-semibold text-muted">
              이동
            </p>
            <ul className="space-y-1">
              {goToShortcuts.map((shortcut) => (
                <li
                  key={shortcut.key}
                  className="flex items-center justify-between gap-3 rounded px-1 py-1.5 text-sm text-soft"
                >
                  <span>{formatGoToDescription(shortcut.label)}</span>
                  <kbd className="shrink-0 rounded border border-control-border bg-panel-strong px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                    g {shortcut.key}
                  </kbd>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
