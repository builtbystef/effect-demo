import type { Todo } from "@app/domain";
import { useAtom, useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useState, type FormEvent } from "react";
import {
  Button,
  Checkbox,
  ConfirmDialog,
  cx,
  ExclamationIcon,
  Glass,
  IconButton,
  notify,
  PlusIcon,
  ProgressRing,
  SegmentedControl,
  Skeleton,
  SparklesIcon,
  Spinner,
  TextField,
  Tooltip,
  TrashIcon,
} from "./design/index.ts";
import {
  clearCompletedAtom,
  createTodoAtom,
  filterAtom,
  removeTodoAtom,
  restoreTodoAtom,
  todosAtom,
  toggleTodoAtom,
  type Filter,
} from "./lib/todos.ts";

export function App() {
  return (
    <>
      <main className="mx-auto w-full max-w-xl px-4 pt-[max(3.5rem,env(safe-area-inset-top))] pb-40">
        <Header />
        <Toolbar />
        <TodoList />
      </main>
      <Composer />
    </>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

const today = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

function Header() {
  const todos = useTodos();
  const done = todos.filter((t) => t.completed).length;
  const remaining = todos.length - done;

  return (
    <header className="mb-5 flex items-end justify-between gap-4 px-1">
      <div className="min-w-0">
        <p className="text-subhead font-medium text-label-2">{today}</p>
        <h1 className="text-large-title font-bold text-label">Todos</h1>
        <p className="mt-0.5 text-subhead text-label-2">
          {todos.length === 0
            ? "A clean slate."
            : remaining === 0
              ? "Everything's done."
              : `${remaining} remaining`}
        </p>
      </div>
      <ProgressRing value={done} max={todos.length} label="Completed reminders" size={52} />
    </header>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

const filters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Done" },
] as const;

function Toolbar() {
  const [filter, setFilter] = useAtom(filterAtom);
  const completed = useTodos().filter((t) => t.completed);
  const clearCompleted = useAtomSet(clearCompletedAtom);

  return (
    <Glass sheen className="sticky top-3 z-20 mb-4 flex items-center gap-1.5 rounded-full p-1.5">
      <SegmentedControl
        aria-label="Filter reminders"
        segments={filters}
        value={filter}
        onValueChange={setFilter}
        className="flex-1"
      />
      <ConfirmDialog
        trigger={
          <Button variant="plain" size="sm" disabled={completed.length === 0}>
            Clear
          </Button>
        }
        title={`Clear ${completed.length} completed ${completed.length === 1 ? "reminder" : "reminders"}?`}
        description="This can't be undone."
        confirmLabel="Clear"
        destructive
        onConfirm={() => clearCompleted(completed)}
      />
    </Glass>
  );
}

// ─── List ────────────────────────────────────────────────────────────────────

const matches: Record<Filter, (todo: Todo) => boolean> = {
  all: () => true,
  active: (t) => !t.completed,
  completed: (t) => t.completed,
};

function TodoList() {
  const result = useAtomValue(todosAtom);
  const filter = useAtomValue(filterAtom);

  return AsyncResult.match(result, {
    onInitial: () => <ListSkeleton />,
    onFailure: () => <LoadError />,
    onSuccess: ({ value }) => {
      const todos = value.filter(matches[filter]);
      if (todos.length === 0) return <EmptyState filter={filter} />;
      return (
        <ul className="material flex flex-col rounded-card p-1.5" aria-label="Reminders">
          {todos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} />
          ))}
        </ul>
      );
    },
  });
}

function TodoRow({ todo }: { readonly todo: Todo }) {
  const toggle = useAtomSet(toggleTodoAtom);
  const remove = useAtomSet(removeTodoAtom);
  const restore = useAtomSet(restoreTodoAtom);

  const onDelete = () => {
    remove(todo);
    notify({
      title: "Reminder deleted",
      description: todo.title,
      action: { label: "Undo", onClick: () => restore(todo) },
    });
  };

  return (
    <li
      className={cx(
        "group relative flex items-center gap-3 rounded-row py-2.5 pr-2 pl-3",
        "transition-[background-color,opacity,translate] duration-500 ease-out-expo hover:bg-fill-2",
        "starting:translate-y-2 starting:opacity-0",
        // Inset hairline between rows, hidden next to a hovered row.
        "not-last:after:absolute not-last:after:right-3 not-last:after:bottom-0 not-last:after:left-12",
        "not-last:after:h-px not-last:after:scale-y-50 not-last:after:bg-separator not-last:after:content-['']",
        "hover:after:opacity-0",
      )}
    >
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => toggle(todo)}
        aria-label={
          todo.completed ? `Mark "${todo.title}" as not done` : `Mark "${todo.title}" as done`
        }
      />
      <span
        className={cx(
          "min-w-0 flex-1 text-body break-words transition-colors duration-300",
          todo.completed ? "text-label-3 line-through decoration-label-3" : "text-label",
        )}
      >
        {todo.title}
      </span>
      <Tooltip content="Delete">
        <IconButton
          variant="plain"
          size="sm"
          aria-label={`Delete "${todo.title}"`}
          onClick={onDelete}
          className={cx(
            "text-label-3 hover:not-data-disabled:bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] hover:text-destructive",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
          )}
        >
          <TrashIcon />
        </IconButton>
      </Tooltip>
    </li>
  );
}

function ListSkeleton() {
  return (
    <div
      className="material flex flex-col gap-1 rounded-card p-1.5"
      aria-busy
      aria-label="Loading reminders"
    >
      {[72, 54, 64, 40].map((width) => (
        <div key={width} className="flex items-center gap-3 py-3 pr-2 pl-3">
          <Skeleton className="size-[1.375rem]" />
          <Skeleton className="h-3.5" style={{ width: `${width}%` }} />
        </div>
      ))}
    </div>
  );
}

function LoadError() {
  const refresh = useAtomRefresh(todosAtom);
  return (
    <div
      className="material flex flex-col items-center rounded-card px-6 py-10 text-center"
      role="alert"
    >
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-[color-mix(in_srgb,var(--destructive)_14%,transparent)] text-destructive">
        <ExclamationIcon className="size-6" />
      </span>
      <h2 className="text-headline font-semibold text-label">Couldn't load reminders</h2>
      <p className="mt-1 mb-5 text-subhead text-label-2">
        Make sure the server is running, then try again.
      </p>
      <Button variant="tinted" onClick={refresh}>
        Try again
      </Button>
    </div>
  );
}

const empty: Record<Filter, { title: string; body: string }> = {
  all: { title: "No reminders", body: "Add your first one below." },
  active: { title: "All done", body: "Nothing left on your list." },
  completed: { title: "Nothing completed yet", body: "Tick something off and it'll show up here." },
};

function EmptyState({ filter }: { readonly filter: Filter }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="glass mb-4 grid size-16 place-items-center rounded-full text-accent">
        <SparklesIcon className="size-7" />
      </span>
      <h2 className="text-title font-semibold text-label">{empty[filter].title}</h2>
      <p className="mt-1 text-subhead text-label-2">{empty[filter].body}</p>
    </div>
  );
}

// ─── Composer ────────────────────────────────────────────────────────────────

function Composer() {
  const [title, setTitle] = useState("");
  const [result, createTodo] = useAtom(createTodoAtom);
  const trimmed = title.trim();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trimmed.length === 0) return;
    createTodo(trimmed);
    setTitle("");
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <Glass
        sheen
        render={<form onSubmit={onSubmit} />}
        className="pointer-events-auto mx-auto flex max-w-xl items-center gap-2 rounded-full py-1.5 pr-1.5 pl-5"
      >
        <TextField
          appearance="bare"
          value={title}
          onValueChange={setTitle}
          placeholder="New reminder"
          aria-label="New reminder"
          autoFocus
          enterKeyHint="done"
        />
        <IconButton
          type="submit"
          variant="filled"
          size="lg"
          aria-label="Add reminder"
          disabled={trimmed.length === 0}
        >
          {AsyncResult.isWaiting(result) ? <Spinner /> : <PlusIcon />}
        </IconButton>
      </Glass>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const noTodos: ReadonlyArray<Todo> = [];

/** The loaded todos, or an empty list while loading or on error. */
function useTodos(): ReadonlyArray<Todo> {
  return AsyncResult.getOrElse(useAtomValue(todosAtom), () => noTodos);
}
