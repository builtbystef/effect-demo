import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#/lib/cn.ts";
import { initials } from "#/lib/format.ts";

const avatarVariants = cva(
  "inline-grid shrink-0 place-items-center overflow-hidden font-semibold select-none bg-tone/15 text-tone-fg",
  {
    variants: {
      size: {
        sm: "size-6 text-[10px]",
        md: "size-8 text-xs",
        lg: "size-12 text-base",
      },
      shape: { circle: "rounded-full", square: "rounded-lg" },
    },
    defaultVariants: { size: "md", shape: "circle" },
  },
);

const tones = ["tone-blue", "tone-violet", "tone-amber", "tone-teal", "tone-green", "tone-red"];

/** The same name always gets the same colour. */
const toneFor = (name: string): string => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return tones[Math.abs(hash) % tones.length] ?? "tone-gray";
};

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  readonly name: string;
  readonly className?: string;
}

/** Initials on a tinted background. Companies use the square shape. */
export function Avatar({ name, size, shape, className }: AvatarProps) {
  return (
    <BaseAvatar.Root
      className={cn(avatarVariants({ size, shape }), toneFor(name), className)}
      aria-hidden
    >
      <BaseAvatar.Fallback>{initials(name)}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
