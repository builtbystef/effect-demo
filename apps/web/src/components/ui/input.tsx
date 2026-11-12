import { Input as BaseInput } from "@base-ui/react/input";
import type { ComponentProps } from "react";
import { cn } from "#/lib/cn.ts";

export const controlStyles = cn(
  "w-full min-w-0 rounded-md border border-border-strong bg-surface text-sm text-fg shadow-xs",
  "transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-fg-subtle",
  "hover:border-[color-mix(in_oklch,var(--fg)_30%,transparent)]",
  "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring",
  "data-invalid:border-danger data-invalid:focus-visible:ring-[color-mix(in_oklch,var(--danger)_35%,transparent)]",
  "data-disabled:cursor-not-allowed data-disabled:opacity-50",
);

export interface InputProps extends Omit<ComponentProps<typeof BaseInput>, "className"> {
  readonly className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return <BaseInput className={cn(controlStyles, "h-9 px-3", className)} {...props} />;
}

export interface TextareaProps extends ComponentProps<"textarea"> {
  readonly className?: string;
}

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(controlStyles, "min-h-20 resize-y px-3 py-2 leading-relaxed", className)}
      {...props}
    />
  );
}
