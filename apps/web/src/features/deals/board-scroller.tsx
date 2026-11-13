import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "#/lib/cn.ts";

/**
 * A horizontal scroller for the pipeline board: the native scrollbar is
 * replaced by a slim custom one, edges fade where more columns are hidden, and
 * dragging a card near an edge scrolls the board that way.
 */
export function BoardScroller({ children }: { readonly children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useScrollMetrics(ref);
  useDragAutoScroll(ref);

  // On desktop the board fills the rest of the panel and scrolls both ways;
  // columns keep their natural height. The scrollbar lives inside the scroller
  // (pinned to its bottom-left with `sticky`), so wheel and Shift+wheel over it
  // scroll natively, exactly as over the cards.
  return (
    <div className="relative md:flex md:min-h-0 md:flex-1 md:flex-col">
      <div
        ref={ref}
        className="board-scroller snap-x overflow-x-auto data-dragging:snap-none md:min-h-0 md:flex-1"
      >
        <div className="flex w-max min-w-full flex-col md:min-h-full">
          <div className="flex gap-3 pb-1">{children}</div>
          {state.scrollable && <SlimScrollbar scrollerRef={ref} state={state} />}
        </div>
      </div>
      <EdgeFade side="left" visible={state.canLeft} />
      <EdgeFade side="right" visible={state.canRight} inset={state.gutter} />
    </div>
  );
}

function EdgeFade({
  side,
  visible,
  inset = 0,
}: {
  readonly side: "left" | "right";
  readonly visible: boolean;
  readonly inset?: number;
}) {
  return (
    <div
      aria-hidden
      style={{ [side]: inset }}
      className={cn(
        "pointer-events-none absolute top-0 bottom-6 w-14 from-background to-transparent transition-opacity duration-200",
        side === "left" ? "bg-linear-to-r" : "bg-linear-to-l",
        visible ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Scroll metrics
// ---------------------------------------------------------------------------

interface Metrics {
  readonly left: number;
  readonly width: number;
  readonly client: number;
  /** Width of the native vertical scrollbar, if one is showing. */
  readonly gutter: number;
}

function useScrollMetrics(ref: RefObject<HTMLElement | null>) {
  const [m, setM] = useState<Metrics>({ left: 0, width: 0, client: 0, gutter: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const update = () =>
      setM((prev) =>
        prev.left === el.scrollLeft &&
        prev.width === el.scrollWidth &&
        prev.client === el.clientWidth &&
        prev.gutter === el.offsetWidth - el.clientWidth
          ? prev
          : {
              left: el.scrollLeft,
              width: el.scrollWidth,
              client: el.clientWidth,
              gutter: el.offsetWidth - el.clientWidth,
            },
      );
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild !== null) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [ref]);
  const scrollable = m.width > m.client + 1;
  return {
    ...m,
    scrollable,
    canLeft: scrollable && m.left > 1,
    canRight: scrollable && m.left + m.client < m.width - 1,
  };
}

type ScrollState = ReturnType<typeof useScrollMetrics>;

// ---------------------------------------------------------------------------
// Drag auto-scroll
// ---------------------------------------------------------------------------

/** While a card is dragged near the left/right edge, scroll the board that way. */
function useDragAutoScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    let x: number | null = null;
    let raf = 0;
    const tick = () => {
      if (x === null) {
        raf = 0;
        return;
      }
      const r = el.getBoundingClientRect();
      const zone = Math.min(96, r.width / 4);
      let v = 0;
      if (x < r.left + zone) v = -(r.left + zone - x) / zone;
      else if (x > r.right - zone) v = (x - (r.right - zone)) / zone;
      v = Math.max(-1, Math.min(1, v));
      if (v !== 0) el.scrollLeft += v * Math.abs(v) * 22;
      raf = requestAnimationFrame(tick);
    };
    const onOver = (event: DragEvent) => {
      x = event.clientX;
      el.dataset.dragging = "";
      if (raf === 0) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      x = null;
      delete el.dataset.dragging;
    };
    const onLeave = (event: DragEvent) => {
      if (!el.contains(event.relatedTarget as Node | null)) stop();
    };
    el.addEventListener("dragover", onOver);
    el.addEventListener("dragleave", onLeave);
    window.addEventListener("dragend", stop);
    window.addEventListener("drop", stop);
    return () => {
      stop();
      cancelAnimationFrame(raf);
      el.removeEventListener("dragover", onOver);
      el.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragend", stop);
      window.removeEventListener("drop", stop);
    };
  }, [ref]);
}

// ---------------------------------------------------------------------------
// Slim scrollbar
// ---------------------------------------------------------------------------

function SlimScrollbar({
  scrollerRef,
  state,
}: {
  readonly scrollerRef: RefObject<HTMLElement | null>;
  readonly state: ScrollState;
}) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [active, setActive] = useState(false);
  const widthPct = (state.client / state.width) * 100;
  const leftPct = (state.left / state.width) * 100;

  // Horizontal and Shift+wheel input over the bar scroll the board natively.
  // A plain vertical wheel would scroll the page; over the bar, it scrolls
  // the board instead.
  useEffect(() => {
    const t = track.current;
    if (t === null) return;
    const onWheel = (event: WheelEvent) => {
      const el = scrollerRef.current;
      if (el === null || event.shiftKey || event.deltaX !== 0 || event.deltaY === 0) return;
      event.preventDefault();
      const lines = event.deltaMode === WheelEvent.DOM_DELTA_LINE;
      el.scrollBy({ left: lines ? event.deltaY * 40 : event.deltaY, behavior: "smooth" });
    };
    t.addEventListener("wheel", onWheel, { passive: false });
    return () => t.removeEventListener("wheel", onWheel);
  }, [scrollerRef]);

  const onTrackDown = (event: ReactPointerEvent) => {
    const el = scrollerRef.current;
    const t = track.current;
    if (el === null || t === null) return;
    const r = t.getBoundingClientRect();
    const frac = (event.clientX - r.left) / r.width;
    el.scrollTo({ left: frac * el.scrollWidth - el.clientWidth / 2, behavior: "smooth" });
  };
  const onThumbDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const el = scrollerRef.current;
    if (el === null) return;
    drag.current = { x: event.clientX, left: el.scrollLeft };
    event.currentTarget.setPointerCapture(event.pointerId);
    setActive(true);
  };
  const onThumbMove = (event: ReactPointerEvent) => {
    const el = scrollerRef.current;
    const t = track.current;
    if (el === null || t === null || drag.current === null) return;
    const ratio = el.scrollWidth / t.getBoundingClientRect().width;
    el.style.scrollSnapType = "none";
    el.scrollLeft = drag.current.left + (event.clientX - drag.current.x) * ratio;
  };
  const onThumbUp = () => {
    drag.current = null;
    setActive(false);
    const el = scrollerRef.current;
    if (el !== null) el.style.scrollSnapType = "";
  };

  return (
    <div
      style={{ width: state.client }}
      className="sticky bottom-0 left-0 mt-auto bg-background pt-2"
    >
      <div
        ref={track}
        onPointerDown={onTrackDown}
        data-active={active || undefined}
        className="group relative h-4 cursor-pointer"
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-muted transition-[height] duration-150 group-hover:h-2 group-data-active:h-2" />
        <div
          onPointerDown={onThumbDown}
          onPointerMove={onThumbMove}
          onPointerUp={onThumbUp}
          onPointerCancel={onThumbUp}
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          className="absolute top-1/2 h-1 -translate-y-1/2 cursor-grab rounded-full bg-border-strong transition-[height,background-color] duration-150 group-hover:h-2 group-hover:bg-fg-subtle group-data-active:h-2 group-data-active:cursor-grabbing group-data-active:bg-fg-muted"
        />
      </div>
    </div>
  );
}
