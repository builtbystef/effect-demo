import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node";
import { Config, Effect, Layer } from "effect";
import { Migrator, SqlClient } from "effect/sql";

// Backed by Node's built-in `node:sqlite`, so there is no native build step.
const ClientLive = SqliteClient.layerConfig({
  filename: Config.String("DB_FILE").pipe(Config.withDefault("todos.db")),
});

// Migrations run once each, in key order, while the layer is built. Applied
// ids are tracked in the `effect_sql_migrations` table, so never edit or
// reorder an existing entry: add a new one instead.
const MigrationsLive = SqliteMigrator.layer({
  loader: Migrator.fromRecord({
    "0001_create_todos": Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      yield* sql`
        CREATE TABLE todos (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1))
        )
      `;
    }),
    "0002_seed_todos": Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      yield* sql`INSERT INTO todos ${sql.insert([
        { id: crypto.randomUUID(), title: "Learn Effect", completed: 0 },
        { id: crypto.randomUUID(), title: "Build something with it", completed: 0 },
      ])}`;
    }),
  }),
});

// Provides `SqlClient`, with the schema migrated before anything can use it.
export const DbLive = MigrationsLive.pipe(Layer.provideMerge(ClientLive));
