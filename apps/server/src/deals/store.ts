import {
  closedStages,
  Deal,
  type DealId,
  type DealInput,
  type DealPatch,
  NotFound,
} from "@app/domain";
import { desc, eq, notInArray } from "drizzle-orm";
import { Effect, Schema } from "effect";
import type { Database } from "../db/Database.ts";
import { deals } from "../db/schema.ts";
import {
  deletedOrNotFound,
  firstRow,
  orNotFound,
  rows,
  singleRow,
  timestampColumns,
  touched,
} from "../db/util.ts";

const DealRow = Schema.Struct({ ...Deal.fields, ...timestampColumns });

const toDeal = (row: typeof DealRow.Type) => new Deal(row);
const notFound = (id: DealId) => () => new NotFound({ resource: "deal", id });

/** `isOpenStage` as a SQL condition, for queries that roll up the open pipeline. */
export const isOpenDeal = notInArray(deals.stage, [...closedStages]);

/** Every deal, most recently changed first. */
export const list = Effect.fn("Deals.list")((db: Database) =>
  db
    .select()
    .from(deals)
    .orderBy(desc(deals.updatedAt))
    .pipe(
      rows(DealRow),
      Effect.map((all) => all.map(toDeal)),
    ),
);

export const get = Effect.fn("Deals.get")((db: Database, id: DealId) =>
  db
    .select()
    .from(deals)
    .where(eq(deals.id, id))
    .pipe(firstRow(DealRow), orNotFound(notFound(id)), Effect.map(toDeal)),
);

export const create = Effect.fn("Deals.create")((db: Database, input: DealInput) =>
  db.insert(deals).values(input).returning().pipe(singleRow(DealRow), Effect.map(toDeal)),
);

export const update = Effect.fn("Deals.update")((db: Database, id: DealId, patch: DealPatch) =>
  db
    .update(deals)
    .set(touched(patch))
    .where(eq(deals.id, id))
    .returning()
    .pipe(firstRow(DealRow), orNotFound(notFound(id)), Effect.map(toDeal)),
);

export const remove = Effect.fn("Deals.remove")((db: Database, id: DealId) =>
  db
    .delete(deals)
    .where(eq(deals.id, id))
    .returning({ id: deals.id })
    .pipe(deletedOrNotFound(notFound(id))),
);
