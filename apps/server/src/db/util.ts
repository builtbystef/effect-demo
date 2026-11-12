import type { NotFound } from "@app/domain";
import { Array, Cause, Effect, Option, Schema } from "effect";
import { SqlError } from "effect/sql";
import { sql } from "drizzle-orm";
import { EffectDrizzleQueryError } from "drizzle-orm/effect-core";

// Query and decode failures become defects (HTTP 500): they are bugs or
// infrastructure problems, not outcomes the API contract describes. Errors a
// repo has already mapped to domain errors (see `onUniqueViolation`) pass
// through untouched.
//
// Drizzle types each row as the table stores it; the decoders below turn that
// into the domain's shape (branded ids, `DateTime.Utc`). A row schema whose
// encoded side doesn't match the query's row type is a compile error.

type Query<I, E, R> = Effect.Effect<ReadonlyArray<I>, E, R>;
type Decoded<A, E, R> = Effect.Effect<A, Exclude<E, EffectDrizzleQueryError>, R>;

const isQueryError = (e: unknown): e is EffectDrizzleQueryError =>
  e instanceof EffectDrizzleQueryError;

/** Decode every row of a query result. */
export const rows =
  <A, I>(schema: Schema.Codec<A, I>) =>
  <E, R>(self: Query<I, E, R>): Decoded<ReadonlyArray<A>, E, R> =>
    self.pipe(
      Effect.catchIf(isQueryError, Effect.die),
      Effect.flatMap((all) => Schema.decodeEffect(Schema.Array(schema))(all).pipe(Effect.orDie)),
    ) as Decoded<ReadonlyArray<A>, E, R>;

/** Decode the first row of a query result, if there is one. */
export const firstRow =
  <A, I>(schema: Schema.Codec<A, I>) =>
  <E, R>(self: Query<I, E, R>): Decoded<Option.Option<A>, E, R> =>
    self.pipe(rows(schema), Effect.map(Array.head));

/** Decode the one row a statement must return, such as `insert(…).returning()`. */
export const singleRow =
  <A, I>(schema: Schema.Codec<A, I>) =>
  <E, R>(self: Query<I, E, R>): Decoded<A, E, R> =>
    self.pipe(
      firstRow(schema),
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.die(new Error("Expected the statement to return a row")),
          onSome: Effect.succeed,
        }),
      ),
    );

/** Map a unique-constraint violation to a domain error. */
export const onUniqueViolation =
  <E2>(error: () => E2) =>
  <A, E, R>(self: Effect.Effect<A, E, R>): Effect.Effect<A, E | E2, R> =>
    Effect.catchIf(
      self,
      (e) => {
        if (!isQueryError(e)) return false;
        const cause = Cause.squash(e.cause as Cause.Cause<unknown>);
        return SqlError.isSqlError(cause) && cause.reason._tag === "UniqueViolation";
      },
      () => Effect.fail(error()),
    );

/** Fail with `NotFound` when a `delete(…).returning()` removed nothing. */
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
 * The values for a partial update. Always bumps `updatedAt`, which also keeps
 * an empty patch a valid `UPDATE`.
 */
export const touched = <P extends object>(patch: P) => ({ ...patch, updatedAt: sql`now()` });

/** Postgres timestamps arrive as `Date`; the domain uses `DateTime.Utc`. */
export const timestampColumns = {
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
};
