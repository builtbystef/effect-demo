import { CrmApi, DashboardSummary, StageSummary, dealStages } from "@app/domain";
import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { SqlClient } from "effect/sql";
import { rows } from "../db/util.ts";
import { ActivityRow, toActivity } from "../activities/ActivityRepo.ts";

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

    const totals = sql`
      SELECT
        (SELECT count(*)::int FROM contacts) AS contacts,
        (SELECT count(*)::int FROM companies) AS companies,
        (SELECT count(*)::int FROM deals WHERE stage NOT IN ('won', 'lost')) AS open_deals,
        (SELECT coalesce(sum(value), 0)::int FROM deals WHERE stage NOT IN ('won', 'lost')) AS pipeline_value,
        (SELECT coalesce(sum(value), 0)::int FROM deals WHERE stage = 'won') AS won_value
    `.pipe(rows(Totals));

    const stages = sql`
      SELECT stage, count(*)::int AS count, coalesce(sum(value), 0)::int AS value
      FROM deals GROUP BY stage
    `.pipe(rows(StageRow));

    const recent = sql`SELECT * FROM activities ORDER BY created_at DESC LIMIT 8`.pipe(
      rows(ActivityRow),
    );

    const summary = Effect.all([totals, stages, recent], { concurrency: "unbounded" }).pipe(
      Effect.map(([[t], byStage, activity]) => {
        // Every stage appears, in pipeline order, even with no deals in it.
        const stageSummaries = dealStages.map(
          (stage) =>
            new StageSummary(
              byStage.find((row) => row.stage === stage) ?? { stage, count: 0, value: 0 },
            ),
        );
        return new DashboardSummary({
          contacts: t?.contacts ?? 0,
          companies: t?.companies ?? 0,
          openDeals: t?.openDeals ?? 0,
          pipelineValue: t?.pipelineValue ?? 0,
          wonValue: t?.wonValue ?? 0,
          stages: stageSummaries,
          recentActivity: activity.map(toActivity),
        });
      }),
      Effect.withSpan("Dashboard.summary"),
    );

    return handlers.handle("summary", () => summary);
  }),
);
