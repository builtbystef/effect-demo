import { CrmApi, DashboardSummary, StageSummary, dealStages } from "@app/domain";
import { count, eq, type SQL, sql } from "drizzle-orm";
import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import * as Activities from "../activities/store.ts";
import { Db } from "../db/Database.ts";
import { companies, contacts, deals } from "../db/schema.ts";
import { singleRow } from "../db/util.ts";
import { isOpenDeal } from "../deals/store.ts";

// The dashboard is a read model: it owns no table, only rollups across the
// others, so its queries live next to its one handler.

const Totals = Schema.Struct({
  contacts: Schema.Int,
  companies: Schema.Int,
  openDeals: Schema.Int,
  pipelineValue: Schema.Int,
  wonValue: Schema.Int,
});

/** Total deal value, optionally only of the deals matching `filter`; never `NULL`. */
const valueOf = (filter?: SQL) =>
  filter === undefined
    ? sql<number>`coalesce(sum(${deals.value}), 0)::int`
    : sql<number>`coalesce(sum(${deals.value}) FILTER (WHERE ${filter}), 0)::int`;

export const DashboardHttp = HttpApiBuilder.group(
  CrmApi,
  "dashboard",
  Effect.fn(function* (handlers) {
    const db = yield* Db;

    // An aggregate without GROUP BY always returns exactly one row.
    const totals = db
      .select({
        contacts: db.$count(contacts),
        companies: db.$count(companies),
        openDeals: sql<number>`count(*) FILTER (WHERE ${isOpenDeal})::int`,
        pipelineValue: valueOf(isOpenDeal),
        wonValue: valueOf(eq(deals.stage, "won")),
      })
      .from(deals)
      .pipe(singleRow(Totals));

    const stages = db
      .select({ stage: deals.stage, count: count(), value: valueOf() })
      .from(deals)
      .groupBy(deals.stage)
      .pipe(Effect.orDie);

    const summary = Effect.all([totals, stages, Activities.list(db, {}, 8)], {
      concurrency: "unbounded",
    }).pipe(
      Effect.map(
        ([totals, byStage, recentActivity]) =>
          new DashboardSummary({
            ...totals,
            // Every stage appears, in pipeline order, even with no deals in it.
            stages: dealStages.map(
              (stage) =>
                new StageSummary(
                  byStage.find((row) => row.stage === stage) ?? { stage, count: 0, value: 0 },
                ),
            ),
            recentActivity,
          }),
      ),
      Effect.withSpan("Dashboard.summary"),
    );

    return handlers.handle("summary", () => summary);
  }),
);
