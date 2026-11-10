import { Schema } from "effect";

export const TodoId = Schema.String.pipe(Schema.brand("TodoId"));
export type TodoId = typeof TodoId.Type;

export class Todo extends Schema.Class<Todo>("Todo")({
  id: TodoId,
  title: Schema.NonEmptyString,
  completed: Schema.Boolean,
}) {}

// `optionalKey` means "may be absent" but never `undefined`, so spreading a
// patch over an existing todo can't blank out a field.
export const TodoPatch = Schema.Struct({
  title: Schema.optionalKey(Schema.NonEmptyString),
  completed: Schema.optionalKey(Schema.Boolean),
});
export type TodoPatch = typeof TodoPatch.Type;

export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()(
  "TodoNotFound",
  { id: TodoId },
  { httpApiStatus: 404 },
) {}
