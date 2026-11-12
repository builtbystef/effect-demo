import { CrmApi } from "@app/domain";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { CompanyRepo } from "./CompanyRepo.ts";

export const CompaniesHttp = HttpApiBuilder.group(
  CrmApi,
  "companies",
  Effect.fn(function* (handlers) {
    const repo = yield* CompanyRepo;
    return handlers.handleAll({
      list: () => repo.list,
      get: ({ params }) => repo.get(params.id),
      create: ({ payload }) => repo.create(payload),
      update: ({ params, payload }) => repo.update(params.id, payload),
      remove: ({ params }) => repo.remove(params.id),
    });
  }),
).pipe(Layer.provide(CompanyRepo.layer));
