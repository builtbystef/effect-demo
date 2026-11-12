import { CrmApi, DashboardSummary, StageSummary, dealStages } from "@app/domain";
import { Effect, Layer, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { SqlClient } from "effect/sql";
import { ActivityRepo } from "../activities/ActivityRepo.ts";
import { rows, singleRow } from "../db/util.ts";
import { isOpenDeal } from "../deals/DealRepo.ts";

// The dashboard is a read model: it owns no table, only rollups across the
// others, so its queries live next to its one handler instead of in a repo.

const Totals = Schema.Struct({
  contacts: Schema.Int,
  companies: Schema.Int,
  openDeals: Schema.Int,
  pipelineValue: Schema.Int,
  wonValue: Schema.Int,
});

const StageRow = Schema.Struct(StageSummary.fields);

export const DashboardHttp = HttpApiBuilder.group(
  CrmApi,
  "dashboard",
  Effect.fn(function* (handlers) {
    const sql = yield* SqlClient.SqlClient;
    const activities = yield* ActivityRepo;
    const open = isOpenDeal(sql);

    const totals = sql`
      SELECT
        (SELECT count(*)::int FROM contacts) AS contacts,
        (SELECT count(*)::int FROM companies) AS companies,
        (SELECT count(*)::int FROM deals WHERE ${open}) AS open_deals,
        (SELECT coalesce(sum(value), 0)::int FROM deals WHERE ${open}) AS pipeline_value,
        (SELECT coalesce(sum(value), 0)::int FROM deals WHERE stage = 'won') AS won_value
    `.pipe(singleRow(Totals));

    const stages = sql`
      SELECT stage, count(*)::int AS count, coalesce(sum(value), 0)::int AS value
      FROM deals GROUP BY stage
    `.pipe(rows(StageRow));

    const summary = Effect.all([totals, stages, activities.list({}, 8)], {
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
).pipe(Layer.provide(ActivityRepo.layer));
