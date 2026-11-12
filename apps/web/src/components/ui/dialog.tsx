import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "#/lib/cn.ts";
import { Button } from "./button.tsx";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export interface DialogContentProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

/** A centered modal with a title bar. Put a form and `DialogFooter` inside. */
export function DialogContent({ title, description, children, className }: DialogContentProps) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-overlay transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <BaseDialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
        <BaseDialog.Popup
          className={cn(
            "relative w-full max-w-lg rounded-xl border border-border bg-surface shadow-lg outline-none",
            "transition-[scale,opacity,translate] duration-200 ease-out-quint",
            "data-starting-style:translate-y-2 data-starting-style:scale-[0.98] data-starting-style:opacity-0",
            "data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-ending-style:duration-100",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-5">
            <div className="min-w-0">
              <BaseDialog.Title className="text-base font-semibold text-fg">
                {title}
              </BaseDialog.Title>
              {description !== undefined && (
                <BaseDialog.Description className="mt-1 text-sm text-fg-muted">
                  {description}
                </BaseDialog.Description>
              )}
            </div>
            <BaseDialog.Close render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}>
              <X />
            </BaseDialog.Close>
          </div>
          <div className="px-5 pt-4 pb-5">{children}</div>
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "-mx-5 mt-5 -mb-5 flex justify-end gap-2 border-t border-border bg-surface-muted/50 px-5 py-3 rounded-b-xl",
        className,
      )}
      {...props}
    />
  );
}
