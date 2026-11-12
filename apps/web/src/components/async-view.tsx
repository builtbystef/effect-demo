import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import type { ReactNode } from "react";
import { ErrorState } from "#/components/ui/feedback.tsx";

export interface AsyncViewProps<A, E> {
  readonly result: AsyncResult.AsyncResult<A, E>;
  /** Rendered until the first value arrives. */
  readonly loading: ReactNode;
  /** Rendered on failure. Defaults to a generic error with a retry button. */
  readonly failure?: (error: E) => ReactNode;
  readonly onRetry?: () => void;
  readonly children: (value: A) => ReactNode;
}

/**
 * Render a query atom's result. While a query refreshes in the background it
 * keeps showing the previous value instead of flashing back to `loading`.
 */
export function AsyncView<A, E>({
  result,
  loading,
  failure,
  onRetry,
  children,
}: AsyncViewProps<A, E>) {
  return AsyncResult.match(result, {
    onInitial: () => loading,
    onFailure: (failed) => {
      const error = AsyncResult.error(failed);
      return failure !== undefined && Option.isSome(error) ? (
        failure(error.value)
      ) : (
        <ErrorState {...(onRetry !== undefined && { onRetry })} />
      );
    },
    onSuccess: (success) => children(success.value),
  });
}
