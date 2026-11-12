import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "#/lib/cn.ts";

export const badgeVariants = cva(
  "inline-flex h-5.5 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs font-medium whitespace-nowrap bg-tone/12 text-tone-fg",
  {
    variants: {
      tone: {
        gray: "tone-gray",
        blue: "tone-blue",
        violet: "tone-violet",
        amber: "tone-amber",
        teal: "tone-teal",
        green: "tone-green",
        red: "tone-red",
      },
      dot: { true: "before:size-1.5 before:rounded-full before:bg-tone before:content-['']" },
    },
    defaultVariants: { tone: "gray" },
  },
);

export type Tone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, dot, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, dot }), className)} {...props} />;
}
