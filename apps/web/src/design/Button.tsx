import { Button as BaseButton } from "@base-ui/react/button";
import { mergeProps } from "@base-ui/react/merge-props";
import type { ComponentProps, CSSProperties } from "react";
import { cx, useMergedRefs } from "./cx.ts";
import { useLiquidGlass } from "./refraction.tsx";

export type ButtonVariant = "filled" | "tinted" | "glass" | "plain" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";
type Shape = "pill" | "circle";

const base =
  "relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 rounded-full font-medium outline-none " +
  "transition-[transform,scale,translate,background-color,color,opacity,filter] duration-200 ease-glass " +
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] " +
  "data-disabled:cursor-not-allowed data-disabled:opacity-40";

const press = "active:not-data-disabled:scale-[0.96] active:not-data-disabled:duration-100";

const variants: Record<ButtonVariant, string> = {
  filled: `${press} bg-accent text-on-accent shadow-[0_6px_16px_-6px_var(--accent)] hover:not-data-disabled:bg-accent-hover active:not-data-disabled:bg-accent-pressed`,
  tinted: `${press} bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent hover:not-data-disabled:bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]`,
  // Glass buttons grow on press instead of shrinking, like iOS 26 controls.
  glass: "glass glass-interactive text-label",
  plain: `${press} text-accent hover:not-data-disabled:bg-fill-2`,
  destructive: `${press} bg-destructive text-on-destructive shadow-[0_6px_16px_-8px_var(--destructive)] hover:not-data-disabled:bg-destructive-hover`,
};

const sizes: Record<Shape, Record<ButtonSize, string>> = {
  pill: {
    sm: "h-8 px-3.5 text-subhead",
    md: "h-10 px-5 text-callout",
    lg: "h-12 px-6 text-body",
  },
  circle: {
    sm: "size-8 [&_svg]:size-4",
    md: "size-10 [&_svg]:size-[18px]",
    lg: "size-12 [&_svg]:size-5",
  },
};

export interface ButtonProps extends Omit<
  ComponentProps<typeof BaseButton>,
  "className" | "style"
> {
  readonly style?: CSSProperties;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly className?: string;
}

function ButtonImpl({
  variant = "filled",
  size = "md",
  shape,
  className,
  children,
  ref,
  ...props
}: ButtonProps & { readonly shape: Shape }) {
  const isGlass = variant === "glass";
  const glass = useLiquidGlass<HTMLButtonElement>({
    refract: isGlass,
    sheen: isGlass,
    strength: 0.8,
  });

  const own = {
    style: glass.style,
    onPointerMove: glass.onPointerMove,
    onPointerLeave: glass.onPointerLeave,
    className: cx(base, variants[variant], sizes[shape][size], className),
  };

  return (
    <BaseButton {...mergeProps<"button">(props, own)} ref={useMergedRefs(ref, glass.ref)}>
      {glass.filter}
      {children}
    </BaseButton>
  );
}

export function Button(props: ButtonProps) {
  return <ButtonImpl {...props} shape="pill" />;
}

export interface IconButtonProps extends ButtonProps {
  /** Icon-only buttons need an accessible name. */
  readonly "aria-label": string;
}

export function IconButton(props: IconButtonProps) {
  return <ButtonImpl {...props} shape="circle" />;
}
