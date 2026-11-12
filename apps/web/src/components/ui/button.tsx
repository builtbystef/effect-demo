import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "#/lib/cn.ts";

export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium select-none",
    "transition-[background-color,border-color,color,box-shadow,scale] duration-150 outline-none",
    "focus-visible:ring-3 focus-visible:ring-ring",
    "active:not-data-disabled:scale-[0.98]",
    "data-disabled:cursor-not-allowed data-disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg shadow-xs hover:not-data-disabled:bg-primary-hover",
        secondary:
          "border border-border bg-surface text-fg shadow-xs hover:not-data-disabled:bg-surface-hover",
        ghost: "text-fg-muted hover:not-data-disabled:bg-surface-hover hover:text-fg",
        danger: "bg-danger text-danger-fg shadow-xs hover:not-data-disabled:bg-danger-hover",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-[13px] [&_svg]:size-3.5",
        md: "h-9 px-3.5 text-sm [&_svg]:size-4",
        lg: "h-10 px-4 text-sm [&_svg]:size-4",
        icon: "size-9 [&_svg]:size-4",
        "icon-sm": "size-7 rounded-md [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends
    Omit<ComponentProps<typeof BaseButton>, "className">,
    VariantProps<typeof buttonVariants> {
  readonly className?: string;
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <BaseButton className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
