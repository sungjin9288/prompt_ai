export interface ManualCopyContent {
  id?: string;
  targetId?: string;
  title: string;
  body: string;
  reason?: string;
}

export function ManualCopyPanel({
  copy,
  onClose,
  className = "bg-surface",
  showHeading = true,
  height = "h-40",
  textareaBackground = "bg-panel",
  textareaClassName,
  ariaLabel,
  testId,
}: {
  copy: ManualCopyContent;
  onClose: () => void;
  className?: string;
  showHeading?: boolean;
  height?: "h-24" | "h-32" | "h-36" | "h-40";
  textareaBackground?: "bg-panel" | "bg-surface";
  textareaClassName?: string;
  ariaLabel?: string;
  testId?: string;
}) {
  const reason = copy.reason ?? `${copy.title} 복사가 차단됐습니다.`;
  const resolvedTextareaClassName =
    textareaClassName ??
    `mt-3 ${height} w-full resize-y rounded-md border border-line ${textareaBackground} px-3 py-2 font-mono text-xs leading-5 text-soft outline-none`;

  return (
    <div
      className={`rounded-md border border-line ${className} px-3 py-3`}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-3">
        {showHeading ? (
          <div>
            <p className="text-xs font-semibold text-soft">수동 복사 필요</p>
            <p className="mt-1 text-xs leading-5 text-muted">{reason}</p>
          </div>
        ) : (
          <p className="text-xs leading-5 text-muted">{reason}</p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-accent transition hover:text-soft"
        >
          닫기
        </button>
      </div>
      <textarea
        readOnly
        value={copy.body}
        className={resolvedTextareaClassName}
        aria-label={ariaLabel ?? `수동 복사용 ${copy.title}`}
      />
    </div>
  );
}
