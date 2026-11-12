import { Toast } from "@base-ui/react/toast";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * One app-wide toast manager. It's a plain object, so toasts can be raised
 * from anywhere, including Effect code running inside atoms.
 */
export const toastManager = Toast.createToastManager();

type Tone = "neutral" | "success" | "error";

export interface NotifyOptions {
  readonly title: string;
  readonly description?: string;
  readonly tone?: Tone;
  readonly action?: { readonly label: string; readonly onClick: () => void };
}

export const notify = ({ title, description, tone = "neutral", action }: NotifyOptions): string => {
  const id: string = toastManager.add({
    title,
    type: tone,
    timeout: tone === "error" ? 6000 : 4000,
    ...(description !== undefined && { description }),
    ...(action !== undefined && {
      actionProps: {
        children: action.label,
        onClick: () => {
          action.onClick();
          toastManager.close(id);
        },
      },
    }),
  });
  return id;
};

export function ToastProvider({ children }: { readonly children: ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager} limit={3}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

const icons: Record<Tone, ReactNode> = {
  neutral: null,
  success: <CircleCheck className="size-4 text-tone-fg tone-green" />,
  error: <CircleAlert className="size-4 text-tone-fg tone-red" />,
};

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => {
    const tone = (toast.type ?? "neutral") as Tone;
    return (
      <Toast.Root
        key={toast.id}
        toast={toast}
        swipeDirection={["right", "down"]}
        className="toast rounded-lg border border-border bg-surface shadow-lg"
      >
        <Toast.Content className="toast-content flex items-start gap-3 p-3">
          {icons[tone] !== null && <span className="mt-0.5">{icons[tone]}</span>}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Toast.Title className="text-sm font-medium text-fg" />
            <Toast.Description className="text-[13px] text-fg-muted" />
          </div>
          <Toast.Action className="h-7 shrink-0 cursor-pointer rounded-md px-2.5 text-[13px] font-medium text-primary hover:bg-surface-hover" />
          <Toast.Close
            aria-label="Dismiss"
            className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-md text-fg-subtle hover:bg-surface-hover hover:text-fg"
          >
            <X className="size-3.5" />
          </Toast.Close>
        </Toast.Content>
      </Toast.Root>
    );
  });
}
