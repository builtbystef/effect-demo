import { AlertDialog } from "@base-ui/react/alert-dialog";
import type { ReactElement, ReactNode } from "react";
import { Button } from "./button.tsx";

export interface ConfirmDialogProps {
  /** The element that opens the dialog. */
  readonly trigger: ReactElement;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly confirmLabel: string;
  readonly destructive?: boolean;
  readonly onConfirm: () => void;
}

/** Ask before doing something that can't be undone. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger render={trigger} />
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-40 bg-overlay transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-lg transition-[scale,opacity] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
          <AlertDialog.Title className="text-base font-semibold text-fg">{title}</AlertDialog.Title>
          {description !== undefined && (
            <AlertDialog.Description className="mt-1.5 text-sm text-fg-muted">
              {description}
            </AlertDialog.Description>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Close render={<Button variant="secondary" />}>Cancel</AlertDialog.Close>
            <AlertDialog.Close
              render={<Button variant={destructive ? "danger" : "primary"} />}
              onClick={onConfirm}
            >
              {confirmLabel}
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
