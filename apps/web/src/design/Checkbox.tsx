import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import type { ComponentProps } from "react";
import { cx } from "./cx.ts";
import { CheckIcon } from "./icons.tsx";

export interface CheckboxProps extends Omit<
  ComponentProps<typeof BaseCheckbox.Root>,
  "className" | "children"
> {
  readonly className?: string;
}

/**
 * A round, Reminders-style checkbox. Unchecked it's a hairline ring; checked it
 * fills with the accent and the tick springs in.
 */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <BaseCheckbox.Root
      {...props}
      className={cx(
        "group/check relative grid size-[1.375rem] shrink-0 cursor-pointer place-items-center rounded-full outline-none",
        "ring-[1.5px] ring-label-3 ring-inset transition-[background-color,box-shadow,scale] duration-300 ease-spring",
        "hover:ring-label-2 active:scale-90",
        "data-checked:bg-accent data-checked:ring-accent data-checked:shadow-[0_2px_8px_-2px_var(--accent)]",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
    >
      <BaseCheckbox.Indicator
        keepMounted
        className={cx(
          "text-on-accent transition-[transform,scale,translate,opacity] duration-300 ease-spring",
          "data-unchecked:scale-50 data-unchecked:opacity-0",
        )}
      >
        <CheckIcon className="size-3.5" />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
