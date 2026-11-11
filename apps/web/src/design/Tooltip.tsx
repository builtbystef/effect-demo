import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import type { ReactElement, ReactNode } from "react";

export const TooltipProvider = BaseTooltip.Provider;

export interface TooltipProps {
  /** The trigger. Must accept a ref and spread its props (all design system controls do). */
  readonly children: ReactElement;
  readonly content: ReactNode;
  readonly side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ children, content, side = "top" }: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={8}>
          <BaseTooltip.Popup
            className={
              "glass rounded-full px-3 py-1.5 text-footnote font-medium text-label " +
              "origin-[var(--transform-origin)] transition-[transform,scale,translate,opacity] duration-200 ease-spring " +
              "data-starting-style:scale-75 data-starting-style:opacity-0 " +
              "data-ending-style:scale-90 data-ending-style:opacity-0 data-instant:transition-none"
            }
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
