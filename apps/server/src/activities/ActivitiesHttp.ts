import { CrmApi } from "@app/domain";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { ActivityRepo } from "./ActivityRepo.ts";

export const ActivitiesHttp = HttpApiBuilder.group(
  CrmApi,
  "activities",
  Effect.fn(function* (handlers) {
    const repo = yield* ActivityRepo;
    return handlers.handleAll({
      list: ({ query }) => repo.list(query),
      create: ({ payload }) => repo.create(payload),
      remove: ({ params }) => repo.remove(params.id),
    });
  }),
).pipe(Layer.provide(ActivityRepo.layer));
