import { Schema } from "effect";
import { Activity } from "./Activity.ts";
import { DealStage } from "./Deal.ts";

export class StageSummary extends Schema.Class<StageSummary>("StageSummary")({
  stage: DealStage,
  count: Schema.Int,
  value: Schema.Int,
}) {}

export class DashboardSummary extends Schema.Class<DashboardSummary>("DashboardSummary")({
  contacts: Schema.Int,
  companies: Schema.Int,
  openDeals: Schema.Int,
  pipelineValue: Schema.Int,
  wonValue: Schema.Int,
  stages: Schema.Array(StageSummary),
  recentActivity: Schema.Array(Activity),
}) {}
