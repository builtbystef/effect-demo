import { type ReactElement, type ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "#/components/ui/dialog.tsx";

export interface FormDialogProps {
  /** The element that opens the dialog. */
  readonly trigger: ReactElement;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** The form. Call `close` once it has saved. */
  readonly children: (close: () => void) => ReactNode;
}

/**
 * A modal that hosts a create/edit form. The form mounts fresh each time the
 * dialog opens, so it always starts from its default values.
 */
export function FormDialog({ trigger, title, description, children }: FormDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent title={title} {...(description !== undefined && { description })}>
        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
