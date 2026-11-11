import { Todo, TodoId, TodoNotFound, type TodoPatch } from "@app/domain";
import { Context, Effect, Layer, Option, Ref, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/sql";

// How a todo is stored. SQLite has no boolean type, so `completed` is a 0/1
// integer. Keeping this here keeps storage details out of `@app/domain`.
const TodoRow = Schema.Struct({
  id: TodoId,
  title: Schema.NonEmptyString,
  completed: Schema.BooleanFromBit,
});

const fromRow = (row: typeof TodoRow.Type) => new Todo(row);

export class TodoRepo extends Context.Service<
  TodoRepo,
  {
    readonly list: Effect.Effect<ReadonlyArray<Todo>>;
    create(title: string): Effect.Effect<Todo>;
    update(id: TodoId, patch: TodoPatch): Effect.Effect<Todo, TodoNotFound>;
    remove(id: TodoId): Effect.Effect<void, TodoNotFound>;
  }
>()("app/TodoRepo") {
  // In-memory implementation. Swap this layer for a SQL-backed one later
  // without touching the handlers.
  static readonly layerMemory = Layer.effect(
    TodoRepo,
    Effect.gen(function* () {
      const store = yield* Ref.make(new Map<TodoId, Todo>());

      const get = Effect.fn("TodoRepo.get")(function* (id: TodoId) {
        const todo = (yield* Ref.get(store)).get(id);
        if (todo === undefined) return yield* new TodoNotFound({ id });
        return todo;
      });

      const list = Ref.get(store).pipe(Effect.map((todos) => Array.from(todos.values())));

      const create = Effect.fn("TodoRepo.create")(function* (title: string) {
        const todo = new Todo({ id: TodoId.make(crypto.randomUUID()), title, completed: false });
        yield* Ref.update(store, (todos) => new Map(todos).set(todo.id, todo));
        return todo;
      });

      const update = Effect.fn("TodoRepo.update")(function* (id: TodoId, patch: TodoPatch) {
        const existing = yield* get(id);
        const todo = new Todo({
          id,
          title: patch.title ?? existing.title,
          completed: patch.completed ?? existing.completed,
        });
        yield* Ref.update(store, (todos) => new Map(todos).set(id, todo));
        return todo;
      });

      const remove = Effect.fn("TodoRepo.remove")(function* (id: TodoId) {
        yield* get(id);
        yield* Ref.update(store, (todos) => {
          const next = new Map(todos);
          next.delete(id);
          return next;
        });
      });

      yield* create("Learn Effect");
      yield* create("Build something with it");

      return TodoRepo.of({ list, create, update, remove });
    }),
  );

  // SQLite implementation. Requires a migrated `SqlClient` (see `Db.ts`).
  // SQL and decode failures become defects (HTTP 500): they are bugs or
  // infrastructure problems, not outcomes the API contract describes.
  static readonly layerSql = Layer.effect(
    TodoRepo,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const findAll = SqlSchema.findAll({
        Request: Schema.Void,
        Result: TodoRow,
        execute: () => sql`SELECT id, title, completed FROM todos ORDER BY rowid`,
      });

      const findById = SqlSchema.findOneOption({
        Request: TodoId,
        Result: TodoRow,
        execute: (id) => sql`SELECT id, title, completed FROM todos WHERE id = ${id}`,
      });

      const require = (id: TodoId) =>
        Effect.flatMap(
          Option.match({
            onNone: () => Effect.fail(new TodoNotFound({ id })),
            onSome: (row: typeof TodoRow.Type) => Effect.succeed(fromRow(row)),
          }),
        );

      const list = findAll().pipe(
        Effect.map((rows) => rows.map(fromRow)),
        Effect.orDie,
      );

      const create = Effect.fn("TodoRepo.create")(function* (title: string) {
        const todo = new Todo({ id: TodoId.make(crypto.randomUUID()), title, completed: false });
        yield* sql`INSERT INTO todos ${sql.insert({ id: todo.id, title, completed: 0 })}`.pipe(
          Effect.orDie,
        );
        return todo;
      });

      const update = Effect.fn("TodoRepo.update")(function* (id: TodoId, patch: TodoPatch) {
        const changes: Record<string, string | number> = {};
        if (patch.title !== undefined) changes.title = patch.title;
        if (patch.completed !== undefined) changes.completed = patch.completed ? 1 : 0;

        // An empty patch is valid; `SET` with no columns is not.
        if (Object.keys(changes).length > 0) {
          yield* sql`UPDATE todos SET ${sql.update(changes)} WHERE id = ${id}`.pipe(Effect.orDie);
        }
        return yield* findById(id).pipe(Effect.orDie, require(id));
      });

      const remove = Effect.fn("TodoRepo.remove")(function* (id: TodoId) {
        const deleted = yield* sql`DELETE FROM todos WHERE id = ${id} RETURNING id`.pipe(
          Effect.orDie,
        );
        if (deleted.length === 0) return yield* new TodoNotFound({ id });
      });

      return TodoRepo.of({ list, create, update, remove });
    }),
  );
}
