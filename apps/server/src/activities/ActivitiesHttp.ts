import { CrmApi } from "@app/domain";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { Db } from "../db/Database.ts";
import * as Activities from "./store.ts";

export const ActivitiesHttp = HttpApiBuilder.group(
  CrmApi,
  "activities",
  Effect.fn(function* (handlers) {
    const db = yield* Db;
    return handlers.handleAll({
      list: ({ query }) => Activities.list(db, query),
      create: ({ payload }) => Activities.create(db, payload),
      remove: ({ params }) => Activities.remove(db, params.id),
    });
  }),
);
