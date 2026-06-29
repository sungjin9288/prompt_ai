import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-4 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Prompt AI Studio
        </p>
        <h1 className="break-words text-xl font-semibold tracking-normal text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 break-words text-sm leading-6 text-muted">
          {description}
        </p>
      </div>
      {action ? (
        <div className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function Panel({
  children,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"section"> & {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      {...props}
      className={`min-w-0 rounded-lg border border-line bg-panel ${className}`}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="min-w-0 border-b border-line px-5 py-4">
      <h2 className="break-words text-base font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 break-words text-sm leading-5 text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-medium text-soft">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-foreground transition placeholder:text-muted focus:border-accent";

export const textareaClass =
  "w-full resize-y rounded-md border border-line bg-surface px-3 py-2.5 text-sm leading-6 text-foreground transition placeholder:text-muted focus:border-accent";

export const selectClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-foreground transition focus:border-accent";

export const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-panel-strong px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-50";

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-mono text-soft">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.min(100, Math.max(0, value * 20))}%` }}
        />
      </div>
    </div>
  );
}
