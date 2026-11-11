import { TodosApi, type Todo } from "@app/domain";
import { Cause, Effect } from "effect";
import { FetchHttpClient } from "effect/http";
import { Atom, AtomHttpApi, Reactivity } from "effect/reactivity";
import { notify } from "../design/index.ts";

// A typed HttpApi client wired into the atom runtime. `query` builds atoms that
// fetch and cache endpoint results; `mutation` builds atoms you call to write.
export class TodosClient extends AtomHttpApi.Service<TodosClient>()("app/TodosClient", {
  api: TodosApi,
  httpClient: FetchHttpClient.layer,
  baseUrl: window.location.origin,
}) {}

// Queries tagged with a reactivity key are re-fetched whenever a mutation
// invalidates that same key.
export const todosKey = ["todos"] as const;

export const todosAtom = TodosClient.query("todos", "list", {
  reactivityKeys: todosKey,
});

// ─── Mutations ───────────────────────────────────────────────────────────────
//
// `TodosClient.mutation(...)` returns one shared atom per endpoint, and a new
// write to it interrupts the run in flight. That's wrong for a list, where you
// can tick two rows in quick succession. These are built with
// `runtime.fn(..., { concurrent: true })` instead, so every call runs to
// completion, and each one reports its own failure as a toast.
//
// They're also `keepAlive`. An atom with no subscribers gets disposed, which
// interrupts whatever it's running. Mutations are often fired from components
// that are about to unmount (a deleted row, an Undo button in a toast), so they
// must not depend on their caller staying mounted.

/** Invalidate the list on success; toast on failure (but not on interruption). */
const write =
  (failureTitle: string) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Reactivity.mutation(effect, todosKey).pipe(
      Effect.tapCause((cause) =>
        Cause.hasInterruptsOnly(cause)
          ? Effect.void
          : Effect.sync(() =>
              notify({
                title: failureTitle,
                description: "Check your connection and try again.",
                tone: "error",
              }),
            ),
      ),
    );

export const createTodoAtom = TodosClient.runtime
  .fn(
    Effect.fnUntraced(function* (title: string) {
      const client = yield* TodosClient;
      return yield* client.todos
        .create({ payload: { title } })
        .pipe(write("Couldn't add reminder"));
    }),
    { concurrent: true },
  )
  .pipe(Atom.keepAlive);

export const toggleTodoAtom = TodosClient.runtime
  .fn(
    Effect.fnUntraced(function* (todo: Todo) {
      const client = yield* TodosClient;
      yield* client.todos
        .update({ params: { id: todo.id }, payload: { completed: !todo.completed } })
        .pipe(write("Couldn't update reminder"));
    }),
    { concurrent: true },
  )
  .pipe(Atom.keepAlive);

export const removeTodoAtom = TodosClient.runtime
  .fn(
    Effect.fnUntraced(function* (todo: Todo) {
      const client = yield* TodosClient;
      yield* client.todos
        .remove({ params: { id: todo.id } })
        .pipe(write("Couldn't delete reminder"));
    }),
    { concurrent: true },
  )
  .pipe(Atom.keepAlive);

/** Undo for delete: recreate the reminder, then restore its completed state. */
export const restoreTodoAtom = TodosClient.runtime
  .fn(
    Effect.fnUntraced(function* (todo: Todo) {
      const client = yield* TodosClient;
      yield* Effect.gen(function* () {
        const created = yield* client.todos.create({ payload: { title: todo.title } });
        if (todo.completed) {
          yield* client.todos.update({ params: { id: created.id }, payload: { completed: true } });
        }
      }).pipe(write("Couldn't restore reminder"));
    }),
    { concurrent: true },
  )
  .pipe(Atom.keepAlive);

export const clearCompletedAtom = TodosClient.runtime
  .fn(
    Effect.fnUntraced(function* (todos: ReadonlyArray<Todo>) {
      const client = yield* TodosClient;
      yield* Effect.forEach(todos, (todo) => client.todos.remove({ params: { id: todo.id } }), {
        concurrency: 4,
        discard: true,
      }).pipe(write("Couldn't clear completed reminders"));
      return todos.length;
    }),
  )
  .pipe(Atom.keepAlive);

// ─── View state ──────────────────────────────────────────────────────────────

export type Filter = "all" | "active" | "completed";

/** Which reminders the list shows. Local UI state, but shared via an atom so
 * the toolbar and the list don't need to be threaded together by props. */
export const filterAtom = Atom.make<Filter>("all");
