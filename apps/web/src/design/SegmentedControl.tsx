import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import type { CSSProperties, ReactNode } from "react";
import { cx } from "./cx.ts";

export interface Segment<T extends string> {
  readonly value: T;
  readonly label: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  readonly segments: ReadonlyArray<Segment<T>>;
  readonly value: T;
  readonly onValueChange: (value: T) => void;
  readonly "aria-label": string;
  readonly className?: string;
}

/**
 * iOS-style segmented control built on Base UI's ToggleGroup. A single thumb
 * slides between segments instead of each segment painting its own state.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onValueChange,
  className,
  ...props
}: SegmentedControlProps<T>) {
  const index = Math.max(
    0,
    segments.findIndex((s) => s.value === value),
  );

  return (
    <ToggleGroup
      aria-label={props["aria-label"]}
      value={[value]}
      onValueChange={(next) => {
        // A toggle group lets you un-press the active item; a segmented control
        // always keeps one selected, so ignore empty selections.
        const picked = next[0] as T | undefined;
        if (picked !== undefined) onValueChange(picked);
      }}
      className={cx(
        "relative grid h-9 auto-cols-fr grid-flow-col rounded-full bg-fill-2 p-0.5",
        className,
      )}
      style={{ "--segments": segments.length, "--index": index } as CSSProperties}
    >
      <span
        aria-hidden
        className={cx(
          "pointer-events-none absolute inset-y-0.5 left-0.5 rounded-full bg-thumb shadow-thumb",
          "w-[calc((100%-4px)/var(--segments))] translate-x-[calc(var(--index)*100%)]",
          "transition-transform duration-500 ease-spring",
        )}
      />
      {segments.map((segment) => (
        <Toggle
          key={segment.value}
          value={segment.value}
          className={cx(
            "relative z-10 rounded-full px-3 text-footnote font-medium text-label-2 outline-none select-none",
            "transition-[color,scale] duration-200 hover:text-label active:scale-95",
            "data-pressed:font-semibold data-pressed:text-label",
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
          )}
        >
          {segment.label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
