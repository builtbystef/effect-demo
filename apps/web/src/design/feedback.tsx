import type { CSSProperties } from "react";
import { cx } from "./cx.ts";

export function Skeleton({
  className,
  style,
}: {
  readonly className?: string;
  readonly style?: CSSProperties;
}) {
  return <div aria-hidden className={cx("skeleton", className)} style={style} />;
}

export function Spinner({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cx("size-[18px] animate-[spin_0.8s_linear_infinite]", className)}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
