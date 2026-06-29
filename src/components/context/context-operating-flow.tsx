"use client";

import { secondaryButtonClass } from "@/components/ui";

export interface ContextOperatingFlowItem {
  actionLabel: string;
  detail: string;
  disabled?: boolean;
  href?: string;
  label: string;
  onAction?: () => void;
  step: string;
  title: string;
}

interface ContextOperatingFlowProps {
  badge: string;
  badgeHref?: string;
  description: string;
  items: ContextOperatingFlowItem[];
  testId: string;
  title: string;
}

export function ContextOperatingFlow({
  badge,
  badgeHref,
  description,
  items,
  testId,
  title,
}: ContextOperatingFlowProps) {
  return (
    <section
      className="rounded-lg border border-line bg-panel px-5 py-4"
      data-testid={testId}
    >
      <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-soft">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
        {badgeHref ? (
          <a
            href={badgeHref}
            className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted transition hover:border-accent hover:text-soft"
          >
            {badge}
          </a>
        ) : (
          <span className="w-fit rounded-md border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-4 lg:gap-3">
        {items.map((item) => (
          <div
            key={item.step}
            className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5 lg:block lg:px-3 lg:py-3"
          >
            <div className="flex min-w-0 flex-col items-center gap-1 lg:flex-row lg:justify-between lg:gap-3">
              <span className="font-mono text-xs font-semibold text-accent">
                {item.step}
              </span>
              <span className="rounded-md border border-line bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-muted lg:px-2 lg:py-1">
                {item.label}
              </span>
            </div>
            <div className="min-w-0 lg:mt-3">
              <p className="break-words text-sm font-semibold text-soft">
                {item.title}
              </p>
              <p className="mt-1 break-words text-xs leading-5 text-muted lg:mt-2">
                {item.detail}
              </p>
            </div>
            {item.onAction ? (
              <button
                type="button"
                className={`${secondaryButtonClass} min-h-8 shrink-0 px-3 py-1.5 text-xs lg:mt-3 lg:w-full`}
                disabled={item.disabled}
                onClick={item.onAction}
              >
                {item.actionLabel}
              </button>
            ) : item.href ? (
              <a
                href={item.href}
                className={`${secondaryButtonClass} min-h-8 shrink-0 px-3 py-1.5 text-xs lg:mt-3 lg:w-full`}
              >
                {item.actionLabel}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
