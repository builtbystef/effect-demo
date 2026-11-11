import { AlertDialog } from "@base-ui/react/alert-dialog";
import type { ReactElement, ReactNode } from "react";
import { Button } from "./Button.tsx";

export interface ConfirmDialogProps {
  /** The element that opens the dialog. */
  readonly trigger: ReactElement;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly confirmLabel: string;
  readonly destructive?: boolean;
  readonly onConfirm: () => void;
}

/** A glass alert, iOS 26 style: centered card, stacked title, pill actions. */
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
        <AlertDialog.Backdrop className="fixed inset-0 z-40 bg-scrim transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <AlertDialog.Popup
          className={
            "glass fixed top-1/2 left-1/2 z-50 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] p-5 text-center " +
            "[--glass-tint:color-mix(in_srgb,var(--glass-solid)_70%,transparent)] [--glass-blur:24px] " +
            "transition-[transform,scale,translate,opacity] duration-400 ease-spring " +
            "data-starting-style:scale-90 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-150"
          }
        >
          <AlertDialog.Title className="text-headline font-semibold text-label">
            {title}
          </AlertDialog.Title>
          {description !== undefined && (
            <AlertDialog.Description className="mt-1.5 text-subhead text-label-2">
              {description}
            </AlertDialog.Description>
          )}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <AlertDialog.Close render={<Button variant="glass" size="lg" className="w-full" />}>
              Cancel
            </AlertDialog.Close>
            <AlertDialog.Close
              render={
                <Button
                  variant={destructive ? "destructive" : "filled"}
                  size="lg"
                  className="w-full"
                />
              }
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
