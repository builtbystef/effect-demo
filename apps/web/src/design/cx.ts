import { useMemo, type Ref } from "react";

/** Joins class names, skipping falsy values. */
export const cx = (...classes: ReadonlyArray<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(" ");

/** Combines several refs into one stable callback ref. */
export function useMergedRefs<T>(
  ...refs: ReadonlyArray<Ref<T> | undefined>
): (value: T | null) => () => void {
  // oxlint-disable-next-line react-hooks/exhaustive-deps -- the refs themselves are the deps
  return useMemo(() => mergeRefs(refs), refs);
}

const mergeRefs =
  <T>(refs: ReadonlyArray<Ref<T> | undefined>) =>
  (value: T | null) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === "function") {
        const cleanup = ref(value);
        return typeof cleanup === "function" ? cleanup : () => ref(null);
      }
      if (ref != null) {
        ref.current = value;
        return () => {
          ref.current = null;
        };
      }
      return () => {};
    });
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  };
