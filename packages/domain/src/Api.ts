import { Schema } from "effect";
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/http-api";
import { Todo, TodoId, TodoNotFound, TodoPatch } from "./Todo.ts";

// The API contract lives in its own package so the server implements it and
// the web app derives a typed client from it, without either leaking into the
// other.
export class TodosApiGroup extends HttpApiGroup.make("todos")
  .add(
    HttpApiEndpoint.get("list", "/", {
      success: Schema.Array(Todo),
    }),
    HttpApiEndpoint.post("create", "/", {
      payload: Schema.Struct({ title: Schema.NonEmptyString }),
      success: Todo,
    }),
    HttpApiEndpoint.patch("update", "/:id", {
      params: { id: TodoId },
      payload: TodoPatch,
      success: Todo,
      error: TodoNotFound,
    }),
    HttpApiEndpoint.delete("remove", "/:id", {
      params: { id: TodoId },
      success: HttpApiSchema.NoContent,
      error: TodoNotFound,
    }),
  )
  .prefix("/api/todos") {}

export class TodosApi extends HttpApi.make("todos-api").add(TodosApiGroup) {}
