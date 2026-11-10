import { Todo, TodoId, TodoNotFound, type TodoPatch } from "@app/domain";
import { Context, Effect, Layer, Ref } from "effect";

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
}
