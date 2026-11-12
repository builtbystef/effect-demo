import { CrmApi } from "@app/domain";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { Db } from "../db/Database.ts";
import * as Companies from "./store.ts";

export const CompaniesHttp = HttpApiBuilder.group(
  CrmApi,
  "companies",
  Effect.fn(function* (handlers) {
    const db = yield* Db;
    return handlers.handleAll({
      list: () => Companies.list(db),
      get: ({ params }) => Companies.get(db, params.id),
      create: ({ payload }) => Companies.create(db, payload),
      update: ({ params, payload }) => Companies.update(db, params.id, payload),
      remove: ({ params }) => Companies.remove(db, params.id),
    });
  }),
);
