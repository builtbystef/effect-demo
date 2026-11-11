import { Toast } from "@base-ui/react/toast";
import type { ReactNode } from "react";
import { cx } from "./cx.ts";
import { CheckIcon, ExclamationIcon } from "./icons.tsx";

/**
 * One app-wide toast manager. Because it's a plain object you can raise toasts
 * from anywhere, including Effect code running inside atoms, not just from
 * components.
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
        <Toast.Viewport className="toast-viewport">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

const icons: Record<Tone, ReactNode> = {
  neutral: null,
  success: <CheckIcon className="size-3.5" />,
  error: <ExclamationIcon className="size-4" />,
};

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => {
    const tone = (toast.type ?? "neutral") as Tone;
    return (
      <Toast.Root key={toast.id} toast={toast} swipeDirection="up" className="toast glass">
        <Toast.Content className="toast-content flex items-center gap-3 py-2.5 pr-2.5 pl-4">
          {icons[tone] !== null && (
            <span
              className={cx(
                "grid size-6 shrink-0 place-items-center rounded-full",
                tone === "error"
                  ? "bg-destructive text-on-destructive"
                  : "bg-success text-on-accent",
              )}
            >
              {icons[tone]}
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <Toast.Title className="truncate text-subhead font-semibold text-label" />
            <Toast.Description className="text-footnote text-label-2" />
          </div>
          <Toast.Action className="h-8 shrink-0 rounded-full px-3.5 text-subhead font-semibold text-accent transition-colors hover:bg-fill-2 active:bg-fill" />
        </Toast.Content>
      </Toast.Root>
    );
  });
}
