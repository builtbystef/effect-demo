import { Deal, type DealId, type DealInput, type DealPatch, NotFound } from "@app/domain";
import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/sql";
import {
  deletedOrNotFound,
  firstRow,
  orNotFound,
  rows,
  setClause,
  singleRow,
  timestampColumns,
} from "../db/util.ts";

const DealRow = Schema.Struct({ ...Deal.fields, ...timestampColumns });

const toDeal = (row: typeof DealRow.Type) => new Deal(row);
const notFound = (id: DealId) => () => new NotFound({ resource: "deal", id });

export class DealRepo extends Context.Service<
  DealRepo,
  {
    readonly list: Effect.Effect<ReadonlyArray<Deal>>;
    get(id: DealId): Effect.Effect<Deal, NotFound>;
    create(input: DealInput): Effect.Effect<Deal>;
    update(id: DealId, patch: DealPatch): Effect.Effect<Deal, NotFound>;
    remove(id: DealId): Effect.Effect<void, NotFound>;
  }
>()("app/DealRepo") {
  static readonly layer = Layer.effect(
    DealRepo,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const list = sql`SELECT * FROM deals ORDER BY updated_at DESC`.pipe(
        rows(DealRow),
        Effect.map((all) => all.map(toDeal)),
        Effect.withSpan("DealRepo.list"),
      );

      const get = Effect.fn("DealRepo.get")((id: DealId) =>
        sql`SELECT * FROM deals WHERE id = ${id}`.pipe(
          firstRow(DealRow),
          orNotFound(notFound(id)),
          Effect.map(toDeal),
        ),
      );

      const create = Effect.fn("DealRepo.create")((input: DealInput) =>
        sql`INSERT INTO deals ${sql.insert(input)} RETURNING *`.pipe(
          singleRow(DealRow),
          Effect.map(toDeal),
        ),
      );

      const update = Effect.fn("DealRepo.update")((id: DealId, patch: DealPatch) =>
        sql`UPDATE deals SET ${setClause(sql, patch)} WHERE id = ${id} RETURNING *`.pipe(
          firstRow(DealRow),
          orNotFound(notFound(id)),
          Effect.map(toDeal),
        ),
      );

      const remove = Effect.fn("DealRepo.remove")((id: DealId) =>
        sql`DELETE FROM deals WHERE id = ${id} RETURNING id`.pipe(deletedOrNotFound(notFound(id))),
      );

      return DealRepo.of({ list, get, create, update, remove });
    }),
  );
}
