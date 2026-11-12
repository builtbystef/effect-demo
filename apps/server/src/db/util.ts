import type { NotFound } from "@app/domain";
import { Array, Effect, Option, Schema } from "effect";
import { type SqlClient, SqlError } from "effect/sql";

// SQL and decode failures become defects (HTTP 500): they are bugs or
// infrastructure problems, not outcomes the API contract describes. Errors a
// repo has already mapped to domain errors (see `onUniqueViolation`) pass
// through untouched.

type Query<E, R> = Effect.Effect<ReadonlyArray<unknown>, E, R>;

/** Decode every row of a query result. */
export const rows =
  <A, I>(schema: Schema.Codec<A, I>) =>
  <E, R>(self: Query<E, R>): Effect.Effect<ReadonlyArray<A>, Exclude<E, SqlError.SqlError>, R> =>
    self.pipe(
      Effect.catchIf(SqlError.isSqlError, Effect.die),
      Effect.flatMap((all) =>
        Schema.decodeUnknownEffect(Schema.Array(schema))(all).pipe(Effect.orDie),
      ),
    ) as Effect.Effect<ReadonlyArray<A>, Exclude<E, SqlError.SqlError>, R>;

/** Decode the first row of a query result, if there is one. */
export const firstRow =
  <A, I>(schema: Schema.Codec<A, I>) =>
  <E, R>(self: Query<E, R>): Effect.Effect<Option.Option<A>, Exclude<E, SqlError.SqlError>, R> =>
    self.pipe(rows(schema), Effect.map(Array.head));

/** Map a unique-constraint violation to a domain error. */
export const onUniqueViolation =
  <E2>(error: () => E2) =>
  <A, E, R>(self: Effect.Effect<A, E, R>): Effect.Effect<A, E | E2, R> =>
    Effect.catchIf(
      self,
      (e) => SqlError.isSqlError(e) && e.reason._tag === "UniqueViolation",
      () => Effect.fail(error()),
    );

/** Decode the one row a statement must return, such as `INSERT … RETURNING`. */
export const singleRow =
  <A, I>(schema: Schema.Codec<A, I>) =>
  <E, R>(self: Query<E, R>): Effect.Effect<A, Exclude<E, SqlError.SqlError>, R> =>
    self.pipe(
      firstRow(schema),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.die(new Error("Expected the statement to return a row")),
          onSome: Effect.succeed,
        }),
      ),
    );

/** Fail with `NotFound` when a `DELETE … RETURNING` removed nothing. */
export const deletedOrNotFound =
  (error: () => NotFound) =>
  <E, R>(self: Effect.Effect<ReadonlyArray<unknown>, E, R>): Effect.Effect<void, NotFound, R> =>
    self.pipe(
      Effect.orDie,
      Effect.flatMap((deleted) => (deleted.length === 0 ? Effect.fail(error()) : Effect.void)),
    );

/** Turn an empty lookup into a typed `NotFound`. */
export const orNotFound =
  (error: () => NotFound) =>
  <A, E, R>(self: Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<A, E | NotFound, R> =>
    Effect.flatMap(
      self,
      Option.match({ onNone: () => Effect.fail(error()), onSome: Effect.succeed }),
    );

/**
 * The `SET` clause for a partial update. Always bumps `updated_at`, which also
 * keeps an empty patch valid SQL.
 */
export const setClause = (sql: SqlClient.SqlClient, patch: Record<string, unknown>) =>
  Object.keys(patch).length === 0
    ? sql`updated_at = now()`
    : sql`${sql.update(patch)}, updated_at = now()`;

/** Postgres hands timestamps back as `Date`; the domain uses `DateTime.Utc`. */
export const timestampColumns = {
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
};
