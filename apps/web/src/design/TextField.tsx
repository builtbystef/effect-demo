import { Input } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cx } from "./cx.ts";

export interface TextFieldProps extends Omit<ComponentProps<typeof Input>, "className"> {
  /**
   * `filled` sits on a material or the canvas. `bare` has no chrome of its own,
   * for embedding inside a glass container like the composer.
   */
  readonly appearance?: "filled" | "bare";
  readonly className?: string;
}

export function TextField({ appearance = "filled", className, ...props }: TextFieldProps) {
  return (
    <Input
      {...props}
      className={cx(
        "h-11 w-full min-w-0 bg-transparent text-body text-label caret-accent outline-none placeholder:text-label-3",
        appearance === "filled" &&
          "rounded-control bg-fill-2 px-3.5 transition-shadow focus:ring-2 focus:ring-[var(--focus-ring)]",
        appearance === "bare" && "px-1",
        className,
      )}
    />
  );
}
