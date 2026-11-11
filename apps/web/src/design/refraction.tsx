import {
  useCallback,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";

/*
 * Lens refraction for liquid glass.
 *
 * CSS can't bend light by itself. Chromium, however, accepts an SVG filter
 * reference in `backdrop-filter`, so we render a per-element filter that runs
 * the backdrop through `feDisplacementMap`. The displacement map is generated
 * for the element's exact size and corner radius: neutral in the middle, then
 * pushing pixels inward along the edge normal across a thin bezel. That's what
 * gives the "thick glass edge" look where content bends as it passes under the
 * rim.
 *
 * Safari and Firefox don't render url() backdrop filters, so they keep the
 * plain blur from the `glass` utility. Refraction also turns off when the user
 * asks for reduced transparency or reduced motion.
 */

const isChromium = (): boolean => {
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } })
    .userAgentData?.brands;
  return brands?.some((b) => b.brand === "Chromium") ?? false;
};

const prefersReduced = window.matchMedia(
  "(prefers-reduced-transparency: reduce), (prefers-reduced-motion: reduce)",
);

const subscribeReduced = (onChange: () => void) => {
  prefersReduced.addEventListener("change", onChange);
  return () => prefersReduced.removeEventListener("change", onChange);
};

const CHROMIUM = isChromium();

const useRefractionSupported = () =>
  useSyncExternalStore(subscribeReduced, () => CHROMIUM && !prefersReduced.matches);

interface Shape {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
}

const mapCache = new Map<string, string>();

/**
 * Builds a displacement map for a rounded rectangle. Red encodes the X shift
 * and green the Y shift, with 128 meaning "no movement".
 */
const displacementMap = ({ width, height, radius }: Shape, bezel: number): string => {
  const key = `${width}x${height}r${radius}b${bezel}`;
  const cached = mapCache.get(key);
  if (cached !== undefined) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return "";

  const image = ctx.createImageData(width, height);
  const data = image.data;
  const hw = width / 2;
  const hh = height / 2;
  const r = Math.min(radius, hw, hh);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = x + 0.5 - hw;
      const py = y + 0.5 - hh;
      // Signed distance to the rounded rect (negative inside).
      const qx = Math.abs(px) - (hw - r);
      const qy = Math.abs(py) - (hh - r);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const outside = Math.hypot(ox, oy);
      const sdf = outside + Math.min(Math.max(qx, qy), 0) - r;
      const depth = -sdf;

      // Outward normal of the nearest edge.
      let nx: number;
      let ny: number;
      if (qx > 0 && qy > 0) {
        nx = (ox / outside) * Math.sign(px);
        ny = (oy / outside) * Math.sign(py);
      } else if (qx > qy) {
        nx = Math.sign(px);
        ny = 0;
      } else {
        nx = 0;
        ny = Math.sign(py);
      }

      // Convex bezel profile: strongest at the rim, easing to zero inside.
      const t = Math.min(Math.max(1 - depth / bezel, 0), 1);
      const magnitude = t * t * (3 - 2 * t);

      const i = (y * width + x) * 4;
      data[i] = 128 - nx * magnitude * 127;
      data[i + 1] = 128 - ny * magnitude * 127;
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  const url = canvas.toDataURL();
  mapCache.set(key, url);
  return url;
};

const readShape = (el: HTMLElement): Shape => {
  const width = Math.round(el.offsetWidth);
  const height = Math.round(el.offsetHeight);
  const radius = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
  return { width, height, radius: Math.min(radius, width / 2, height / 2) };
};

export interface LiquidGlassOptions {
  /** Bend the backdrop at the edges (Chromium only). */
  readonly refract?: boolean;
  /** 0–2. How far content is pulled at the rim. */
  readonly strength?: number;
  /** Track the pointer so the sheen follows it. */
  readonly sheen?: boolean;
}

export interface LiquidGlass<T extends HTMLElement> {
  readonly ref: (el: T | null) => (() => void) | undefined;
  readonly style: CSSProperties | undefined;
  readonly filter: ReactNode;
  readonly onPointerMove: ((event: PointerEvent<T>) => void) | undefined;
  readonly onPointerLeave: ((event: PointerEvent<T>) => void) | undefined;
}

/**
 * Wires an element up as liquid glass: refraction filter + pointer sheen.
 * Spread `style`, `ref` and the pointer handlers onto the element, and render
 * `filter` as one of its children.
 */
export function useLiquidGlass<T extends HTMLElement>({
  refract = true,
  strength = 1,
  sheen = false,
}: LiquidGlassOptions = {}): LiquidGlass<T> {
  const supported = useRefractionSupported();
  const active = refract && supported;
  const id = `lg-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const [shape, setShape] = useState<Shape | null>(null);

  const ref = useCallback(
    (el: T | null) => {
      if (el === null || !active) return undefined;
      const measure = () => {
        const next = readShape(el);
        setShape((prev) =>
          prev !== null &&
          prev.width === next.width &&
          prev.height === next.height &&
          prev.radius === next.radius
            ? prev
            : next,
        );
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(el);
      return () => observer.disconnect();
    },
    [active],
  );

  const bezel = shape === null ? 0 : Math.min(18, shape.height / 2.5, shape.width / 2.5);
  const map = useMemo(
    () => (active && shape !== null && shape.width > 0 ? displacementMap(shape, bezel) : null),
    [active, shape, bezel],
  );

  const filter =
    map === null || shape === null ? null : (
      <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
        <filter
          id={id}
          x="0"
          y="0"
          width={shape.width}
          height={shape.height}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={map}
            x="0"
            y="0"
            width={shape.width}
            height={shape.height}
            preserveAspectRatio="none"
            result="map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale={bezel * 1.6 * strength}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    );

  const style: CSSProperties | undefined =
    filter === null
      ? undefined
      : {
          backdropFilter: `url(#${id}) blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(var(--glass-brightness))`,
        };

  const onPointerMove = sheen
    ? (event: PointerEvent<T>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--glass-x",
          `${((event.clientX - rect.left) / rect.width) * 100}%`,
        );
        event.currentTarget.style.setProperty(
          "--glass-y",
          `${((event.clientY - rect.top) / rect.height) * 100}%`,
        );
      }
    : undefined;

  const onPointerLeave = sheen
    ? (event: PointerEvent<T>) => {
        event.currentTarget.style.removeProperty("--glass-x");
        event.currentTarget.style.removeProperty("--glass-y");
      }
    : undefined;

  return { ref, style, filter, onPointerMove, onPointerLeave };
}
