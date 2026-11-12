import { CircleAlert, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "#/lib/cn.ts";
import { Button } from "./button.tsx";

export function Skeleton({
  className,
  style,
}: {
  readonly className?: string;
  readonly style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn(
        "h-4 rounded-md bg-[linear-gradient(90deg,var(--surface-muted)_0%,var(--surface-hover)_50%,var(--surface-muted)_100%)] bg-[length:200%_100%] animate-[shimmer_1.6s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

export function Spinner({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-4 animate-spin", className)}>
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <span className="mb-3 grid size-10 place-items-center rounded-lg border border-border bg-surface text-fg-muted shadow-xs">
        <Icon className="size-5" />
      </span>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {description !== undefined && (
        <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>
      )}
      {action !== undefined && <div className="mt-4">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "Make sure the server is running, then try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 grid size-10 place-items-center rounded-full bg-tone/12 text-tone-fg tone-red">
        <CircleAlert className="size-5" />
      </span>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>
      {onRetry !== undefined && (
        <Button className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
