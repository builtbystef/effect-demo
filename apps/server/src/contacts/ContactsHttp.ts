import { CrmApi } from "@app/domain";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { Db } from "../db/Database.ts";
import * as Contacts from "./store.ts";

export const ContactsHttp = HttpApiBuilder.group(
  CrmApi,
  "contacts",
  Effect.fn(function* (handlers) {
    const db = yield* Db;
    return handlers.handleAll({
      list: () => Contacts.list(db),
      get: ({ params }) => Contacts.get(db, params.id),
      create: ({ payload }) => Contacts.create(db, payload),
      update: ({ params, payload }) => Contacts.update(db, params.id, payload),
      remove: ({ params }) => Contacts.remove(db, params.id),
    });
  }),
);
