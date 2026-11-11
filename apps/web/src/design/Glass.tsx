import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { ComponentProps } from "react";
import { cx } from "./cx.ts";
import { useLiquidGlass, type LiquidGlassOptions } from "./refraction.tsx";

export interface GlassProps extends useRender.ComponentProps<"div">, LiquidGlassOptions {}

/**
 * A liquid glass surface. Use it for the functional layer (bars, floating
 * controls, popovers). Supports Base UI's `render` prop, so it can become any
 * element or wrap another Base UI part:
 *
 *   <Glass render={<nav />} />
 */
export function Glass({
  render,
  ref,
  refract,
  strength,
  sheen,
  className,
  children,
  ...props
}: GlassProps) {
  const glass = useLiquidGlass<HTMLDivElement>({
    ...(refract !== undefined && { refract }),
    ...(strength !== undefined && { strength }),
    ...(sheen !== undefined && { sheen }),
  });

  const ownProps: ComponentProps<"div"> = {
    className: cx("glass", className),
    style: glass.style,
    onPointerMove: glass.onPointerMove,
    onPointerLeave: glass.onPointerLeave,
    children: (
      <>
        {glass.filter}
        {children}
      </>
    ),
  };

  return useRender({
    defaultTagName: "div",
    render,
    ref: ref === undefined ? glass.ref : [glass.ref, ref],
    props: mergeProps<"div">(ownProps, props),
  });
}
