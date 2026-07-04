import Link from "next/link";
import type { ReactNode } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/components/ui";

function InboxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden="true"
    >
      <path d="M3 13h4l1.6 3h6.8l1.6-3h4" />
      <path d="M5 13V6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v7" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = "",
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 px-6 py-12 text-center ${className}`}
    >
      <span className="flex size-12 items-center justify-center rounded-full border border-line bg-surface text-accent">
        {icon ?? <InboxIcon />}
      </span>
      <div className="max-w-md">
        <p className="text-sm font-semibold text-soft">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
      </div>
      {action ? (
        <Link href={action.href} className={primaryButtonClass}>
          {action.label}
        </Link>
      ) : null}
      {secondaryAction ? (
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={secondaryAction.onClick}
        >
          {secondaryAction.label}
        </button>
      ) : null}
    </div>
  );
}
