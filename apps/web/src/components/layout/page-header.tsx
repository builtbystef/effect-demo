import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "#/lib/cn.ts";

export interface PageHeaderProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** Buttons on the right. */
  readonly actions?: ReactNode;
  /** Shown before the title, such as an avatar. */
  readonly leading?: ReactNode;
  /** A link back to the parent page. */
  readonly back?: { readonly label: string; readonly to: "/contacts" | "/companies" | "/deals" };
}

export function PageHeader({ title, description, actions, leading, back }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {back !== undefined && (
        <Link
          to={back.to}
          className="mb-3 -ml-1 inline-flex items-center gap-0.5 rounded px-1 text-[13px] font-medium text-fg-muted hover:text-fg"
        >
          <ChevronLeft className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          {leading}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-fg">{title}</h1>
            {description !== undefined && (
              <div className="mt-0.5 text-sm text-fg-muted">{description}</div>
            )}
          </div>
        </div>
        {actions !== undefined && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** The scrollable content column every page renders into. */
export function Page({
  children,
  wide = false,
  fill = false,
}: {
  readonly children: ReactNode;
  readonly wide?: boolean;
  /** On desktop, stretch to the panel's height so content can fill it. */
  readonly fill?: boolean;
}) {
  return (
    <div
      className={cn(
        wide ? "px-4 py-6 sm:px-8" : "mx-auto w-full max-w-6xl px-4 py-6 sm:px-8",
        fill && "md:flex md:h-full md:flex-col",
      )}
    >
      {children}
    </div>
  );
}
