import { CrmApi } from "@app/domain";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { Db } from "../db/Database.ts";
import * as Deals from "./store.ts";

export const DealsHttp = HttpApiBuilder.group(
  CrmApi,
  "deals",
  Effect.fn(function* (handlers) {
    const db = yield* Db;
    return handlers.handleAll({
      list: () => Deals.list(db),
      get: ({ params }) => Deals.get(db, params.id),
      create: ({ payload }) => Deals.create(db, payload),
      update: ({ params, payload }) => Deals.update(db, params.id, payload),
      remove: ({ params }) => Deals.remove(db, params.id),
    });
  }),
);
