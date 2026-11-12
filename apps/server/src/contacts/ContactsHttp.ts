import { CrmApi } from "@app/domain";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { ContactRepo } from "./ContactRepo.ts";

export const ContactsHttp = HttpApiBuilder.group(
  CrmApi,
  "contacts",
  Effect.fn(function* (handlers) {
    const repo = yield* ContactRepo;
    return handlers.handleAll({
      list: () => repo.list,
      get: ({ params }) => repo.get(params.id),
      create: ({ payload }) => repo.create(payload),
      update: ({ params, payload }) => repo.update(params.id, payload),
      remove: ({ params }) => repo.remove(params.id),
    });
  }),
).pipe(Layer.provide(ContactRepo.layer));
