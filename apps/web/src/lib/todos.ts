import { TodosApi } from "@app/domain";
import { FetchHttpClient } from "effect/http";
import { AtomHttpApi } from "effect/reactivity";

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

export const createTodoAtom = TodosClient.mutation("todos", "create");
export const updateTodoAtom = TodosClient.mutation("todos", "update");
export const removeTodoAtom = TodosClient.mutation("todos", "remove");
