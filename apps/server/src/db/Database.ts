import { NodeServices } from "@effect/platform-node";
import { PgClient, PgMigrator } from "@effect/sql-pg";
import { Config, Duration, Effect, Layer, Schedule, String } from "effect";
import { Migrator } from "effect/sql";
import { migrations } from "./migrations.ts";

// Columns are snake_case in Postgres and camelCase everywhere else. The client
// translates both ways, so `sql.insert({ firstName })` writes `first_name` and
// rows come back with `firstName`.
//
// Postgres may still be starting when the server boots (a fresh container, a
// restart in an orchestrator), so the first round trip is retried for about
// half a minute before giving up.
const ClientLive = PgClient.layerFrom(
  Effect.gen(function* () {
    const url = yield* Config.Redacted("DATABASE_URL");
    const maxConnections = yield* Config.Int("DATABASE_POOL_MAX").pipe(Config.withDefault(10));
    const client = yield* PgClient.make({
      url,
      maxConnections,
      connectTimeout: Duration.seconds(5),
      applicationName: "crm-server",
      transformQueryNames: String.camelToSnake,
      transformResultNames: String.snakeToCamel,
    });
    yield* client`SELECT 1`.pipe(
      Effect.tapError((error) => Effect.logWarning("Waiting for Postgres", error.message)),
      Effect.retry({ schedule: Schedule.spaced("1 second"), times: 30 }),
    );
    return client;
  }),
);

// Applied migration ids are tracked in `effect_sql_migrations`. Never edit or
// reorder an entry that has shipped: add a new one instead.
const MigrationsLive = PgMigrator.layer({
  loader: Migrator.fromRecord(migrations),
}).pipe(Layer.provide(NodeServices.layer));

/** Provides `SqlClient` (and `PgClient`), with the schema migrated first. */
export const DatabaseLive = MigrationsLive.pipe(Layer.provideMerge(ClientLive));
