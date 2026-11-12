import { CrmApi } from "@app/domain";
import { Cause, Effect, Predicate, Result } from "effect";
import { FetchHttpClient } from "effect/http";
import { Atom, AtomHttpApi, Reactivity } from "effect/reactivity";
import { notify } from "#/components/ui/toast.tsx";

/**
 * A typed client for the whole CRM API, wired into the atom runtime. `query`
 * builds atoms that fetch and cache an endpoint; `runtime.fn` builds atoms you
 * call to write.
 */
export class CrmClient extends AtomHttpApi.Service<CrmClient>()("app/CrmClient", {
  api: CrmApi,
  httpClient: FetchHttpClient.layer,
  baseUrl: window.location.origin,
}) {}

/**
 * Reactivity keys. A query tagged with a key re-fetches whenever a mutation
 * invalidates that key. Rollups cross entities (a company row shows its open
 * pipeline), so mutations list every key whose data they change.
 */
export const keys = {
  companies: "companies",
  contacts: "contacts",
  deals: "deals",
  activities: "activities",
  dashboard: "dashboard",
} as const;
export type Key = (typeof keys)[keyof typeof keys];

export const allKeys: ReadonlyArray<Key> = Object.values(keys);

/**
 * Build a write atom.
 *
 * - `concurrent`: every call runs to completion. The default for function atoms
 *   interrupts the previous call, which is wrong when you can, say, move two
 *   deals in quick succession.
 * - `keepAlive`: an atom with no subscribers is disposed, interrupting what it
 *   runs. Writes often fire from components that are about to unmount (a
 *   dialog closing, an Undo button in a toast), so they mustn't depend on it.
 * - Unexpected failures raise an error toast. Domain errors from the API
 *   contract (`NotFound`, `EmailTaken`) are left for the caller to show inline.
 */
export const mutation = <Arg, A, E>(
  options: {
    readonly invalidates: ReadonlyArray<Key>;
    readonly errorTitle: string;
  },
  run: (client: CrmClient["Service"], arg: Arg) => Effect.Effect<A, E>,
) =>
  CrmClient.runtime
    .fn(
      Effect.fnUntraced(function* (arg: Arg) {
        const client = yield* CrmClient;
        return yield* Reactivity.mutation(run(client, arg), options.invalidates).pipe(
          Effect.tapCause((cause) =>
            isQuiet(cause)
              ? Effect.void
              : Effect.sync(() =>
                  notify({
                    title: options.errorTitle,
                    description: "Check your connection and try again.",
                    tone: "error",
                  }),
                ),
          ),
        );
      }),
      { concurrent: true },
    )
    .pipe(Atom.keepAlive);

const domainErrors: ReadonlyArray<string> = ["NotFound", "EmailTaken"];

const isQuiet = <E>(cause: Cause.Cause<E>): boolean => {
  if (Cause.hasInterruptsOnly(cause)) return true;
  if (Cause.hasDies(cause)) return false;
  const error = Cause.findError(cause);
  return (
    Result.isSuccess(error) && domainErrors.some((tag) => Predicate.isTagged(error.success, tag))
  );
};
