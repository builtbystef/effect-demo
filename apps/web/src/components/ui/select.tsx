import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "#/lib/cn.ts";
import { controlStyles } from "./input.tsx";

export interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: ReactNode;
}

export interface SelectProps<T extends string> {
  readonly options: ReadonlyArray<SelectOption<T>>;
  readonly value: T;
  readonly onValueChange: (value: T) => void;
  readonly onBlur?: () => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly id?: string;
  readonly disabled?: boolean;
  readonly "aria-label"?: string;
}

/** A single-value select over a fixed list of string options. */
export function Select<T extends string>({
  options,
  value,
  onValueChange,
  onBlur,
  placeholder = "Select…",
  className,
  ...props
}: SelectProps<T>) {
  return (
    <BaseSelect.Root
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next);
      }}
      onOpenChange={(open) => {
        if (!open) onBlur?.();
      }}
      {...(props.disabled !== undefined && { disabled: props.disabled })}
    >
      <BaseSelect.Trigger
        {...(props.id !== undefined && { id: props.id })}
        {...(props["aria-label"] !== undefined && { "aria-label": props["aria-label"] })}
        className={cn(
          controlStyles,
          "flex h-9 cursor-pointer items-center justify-between gap-2 px-3 text-left",
          "data-popup-open:border-primary",
          className,
        )}
      >
        <BaseSelect.Value
          className="truncate data-placeholder:text-fg-subtle"
          placeholder={placeholder}
        />
        <BaseSelect.Icon className="text-fg-subtle">
          <ChevronsUpDown className="size-3.5" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          sideOffset={4}
          alignItemWithTrigger={false}
          className="z-50 outline-none"
        >
          <BaseSelect.Popup
            className={cn(
              "max-h-[min(20rem,var(--available-height))] min-w-[var(--anchor-width)] overflow-y-auto",
              "rounded-lg border border-border bg-surface p-1 shadow-lg outline-none",
              "origin-[var(--transform-origin)] transition-[scale,opacity] duration-100",
              "data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:opacity-0",
            )}
          >
            <BaseSelect.List>
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "grid cursor-default grid-cols-[1fr_1rem] items-center gap-2 rounded-md py-1.5 pr-2 pl-2.5 text-sm text-fg outline-none select-none",
                    "data-highlighted:bg-surface-hover",
                  )}
                >
                  <BaseSelect.ItemText className="truncate">{option.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator className="text-primary">
                    <Check className="size-3.5" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
