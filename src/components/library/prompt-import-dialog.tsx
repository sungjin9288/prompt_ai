"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Field,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import {
  parsePromptImport,
  type ParsedPromptImport,
} from "@/lib/library/import";

export function PromptImportDialog({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (prompt: ParsedPromptImport) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const closeDialog = useCallback(() => {
    setText("");
    setError("");
    onClose();
    previouslyFocusedRef.current?.focus();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      textareaRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDialog();

        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeDialog]);

  const runImport = useCallback(
    (rawText: string) => {
      const result = parsePromptImport(rawText);

      if (!result.ok) {
        setError(result.error);

        return;
      }

      setError("");
      onImport(result.prompt);
    },
    [onImport],
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        const fileText = await file.text();
        setText(fileText);
        runImport(fileText);
      } catch {
        setError("파일을 읽지 못했습니다.");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [runImport],
  );

  const handleImportClick = useCallback(() => {
    runImport(text);
  }, [runImport, text]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={closeDialog}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-import-dialog-title"
        className="relative z-10 w-full max-w-lg rounded-lg border border-line bg-panel p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="prompt-import-dialog-title"
            className="text-base font-semibold text-foreground"
          >
            프롬프트 가져오기
          </h2>
          <button
            type="button"
            aria-label="닫기"
            className={secondaryButtonClass}
            onClick={closeDialog}
          >
            닫기
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field
            label="JSON 붙여넣기 또는 파일 선택"
            hint="내보내기(JSON)로 저장한 프롬프트 파일을 붙여넣거나 선택하세요."
          >
            <textarea
              ref={textareaRef}
              className={`${textareaClass} h-40 font-mono text-xs`}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder='{"title": "...", "rawInput": "...", "versions": [...]}'
            />
          </Field>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="text-sm text-soft"
          />

          {error ? (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={closeDialog}
            >
              취소
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={handleImportClick}
              disabled={text.trim().length === 0}
            >
              가져오기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
