import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "#/lib/cn.ts";

export interface FieldProps extends Omit<ComponentProps<typeof BaseField.Root>, "className"> {
  readonly label: ReactNode;
  readonly description?: ReactNode | undefined;
  /** Messages to show. A non-empty list also marks the field invalid. */
  readonly errors?: ReadonlyArray<string> | undefined;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}

/**
 * Label, control, help text and errors, wired together for accessibility by
 * Base UI. Validation lives in the form library, so `errors` are passed in and
 * shown unconditionally (`match`), rather than coming from native validity.
 */
export function Field({
  label,
  description,
  errors = [],
  className,
  children,
  ...props
}: FieldProps) {
  const invalid = errors.length > 0;
  return (
    <BaseField.Root invalid={invalid} className={cn("flex flex-col gap-1.5", className)} {...props}>
      <BaseField.Label className="text-[13px] font-medium text-fg">{label}</BaseField.Label>
      {children}
      {description !== undefined && !invalid && (
        <BaseField.Description className="text-xs text-fg-muted">
          {description}
        </BaseField.Description>
      )}
      <BaseField.Error match={invalid} className="text-xs font-medium text-danger">
        {errors[0]}
      </BaseField.Error>
    </BaseField.Root>
  );
}
