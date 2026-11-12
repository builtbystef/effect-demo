import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cn } from "#/lib/cn.ts";

export interface MenuProps {
  readonly trigger: ReactElement;
  readonly children: ReactNode;
  readonly align?: "start" | "center" | "end";
}

/** A dropdown of actions anchored to its trigger. */
export function Menu({ trigger, children, align = "end" }: MenuProps) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={4} align={align} className="z-50 outline-none">
          <BaseMenu.Popup
            className={cn(
              "min-w-44 rounded-lg border border-border bg-surface p-1 shadow-lg outline-none",
              "origin-[var(--transform-origin)] transition-[scale,opacity] duration-100",
              "data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:opacity-0",
            )}
          >
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

export interface MenuItemProps extends Omit<ComponentProps<typeof BaseMenu.Item>, "className"> {
  readonly destructive?: boolean;
  readonly className?: string;
}

export function MenuItem({ destructive = false, className, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item
      className={cn(
        "flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none select-none",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-subtle",
        destructive
          ? "text-danger data-highlighted:bg-[color-mix(in_oklch,var(--danger)_10%,transparent)] [&_svg]:text-danger"
          : "text-fg data-highlighted:bg-surface-hover",
        className,
      )}
      {...props}
    />
  );
}

export function MenuSeparator() {
  return <BaseMenu.Separator className="mx-1 my-1 h-px bg-border" />;
}

export function MenuLabel({ children }: { readonly children: ReactNode }) {
  return (
    <BaseMenu.Group>
      <BaseMenu.GroupLabel className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-fg-subtle">
        {children}
      </BaseMenu.GroupLabel>
    </BaseMenu.Group>
  );
}
