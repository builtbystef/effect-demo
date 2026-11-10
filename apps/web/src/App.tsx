import type { Todo } from "@app/domain";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState, type FormEvent } from "react";
import {
  createTodoAtom,
  removeTodoAtom,
  todosAtom,
  todosKey,
  updateTodoAtom,
} from "./lib/todos.ts";

export function App() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-16 text-slate-900">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">Todos</h1>
        <NewTodoForm />
        <TodoList />
      </div>
    </main>
  );
}

function NewTodoForm() {
  const [title, setTitle] = useState("");
  const createTodo = useAtomSet(createTodoAtom);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length === 0) return;
    createTodo({ payload: { title: trimmed }, reactivityKeys: todosKey });
    setTitle("");
  };

  return (
    <form onSubmit={onSubmit} className="mb-4 flex gap-2">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What needs doing?"
        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
      />
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
      >
        Add
      </button>
    </form>
  );
}

function TodoList() {
  const result = useAtomValue(todosAtom);

  return AsyncResult.match(result, {
    onInitial: () => <p className="text-slate-500">Loading…</p>,
    onFailure: () => <p className="text-red-600">Could not load todos. Is the server running?</p>,
    onSuccess: ({ value: todos }) =>
      todos.length === 0 ? (
        <p className="text-slate-500">Nothing to do.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg bg-white shadow-sm">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      ),
  });
}

function TodoItem({ todo }: { todo: Todo }) {
  const updateTodo = useAtomSet(updateTodoAtom);
  const removeTodo = useAtomSet(removeTodoAtom);

  return (
    <li className="group flex items-center gap-3 px-4 py-3">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() =>
          updateTodo({
            params: { id: todo.id },
            payload: { completed: !todo.completed },
            reactivityKeys: todosKey,
          })
        }
        className="size-4 accent-slate-900"
      />
      <span className={`flex-1 ${todo.completed ? "text-slate-400 line-through" : ""}`}>
        {todo.title}
      </span>
      <button
        type="button"
        onClick={() => removeTodo({ params: { id: todo.id }, reactivityKeys: todosKey })}
        className="text-sm text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
      >
        Delete
      </button>
    </li>
  );
}
