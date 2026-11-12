import {
  Contact,
  type ContactId,
  type ContactInput,
  type ContactPatch,
  EmailTaken,
  NotFound,
} from "@app/domain";
import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/sql";
import {
  deletedOrNotFound,
  firstRow,
  onUniqueViolation,
  orNotFound,
  rows,
  setClause,
  singleRow,
  timestampColumns,
} from "../db/util.ts";

const ContactRow = Schema.Struct({ ...Contact.fields, ...timestampColumns });

const toContact = (row: typeof ContactRow.Type) => new Contact(row);
const notFound = (id: ContactId) => () => new NotFound({ resource: "contact", id });
// The only unique index on contacts is the email one.
const emailTaken = (email: string | null | undefined) => () =>
  new EmailTaken({ email: email ?? "" });

export class ContactRepo extends Context.Service<
  ContactRepo,
  {
    readonly list: Effect.Effect<ReadonlyArray<Contact>>;
    get(id: ContactId): Effect.Effect<Contact, NotFound>;
    create(input: ContactInput): Effect.Effect<Contact, EmailTaken>;
    update(id: ContactId, patch: ContactPatch): Effect.Effect<Contact, NotFound | EmailTaken>;
    remove(id: ContactId): Effect.Effect<void, NotFound>;
  }
>()("app/ContactRepo") {
  static readonly layer = Layer.effect(
    ContactRepo,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const list = sql`SELECT * FROM contacts ORDER BY lower(last_name), lower(first_name)`.pipe(
        rows(ContactRow),
        Effect.map((all) => all.map(toContact)),
        Effect.withSpan("ContactRepo.list"),
      );

      const get = Effect.fn("ContactRepo.get")((id: ContactId) =>
        sql`SELECT * FROM contacts WHERE id = ${id}`.pipe(
          firstRow(ContactRow),
          orNotFound(notFound(id)),
          Effect.map(toContact),
        ),
      );

      const create = Effect.fn("ContactRepo.create")((input: ContactInput) =>
        sql`INSERT INTO contacts ${sql.insert(input)} RETURNING *`.pipe(
          onUniqueViolation(emailTaken(input.email)),
          singleRow(ContactRow),
          Effect.map(toContact),
        ),
      );

      const update = Effect.fn("ContactRepo.update")((id: ContactId, patch: ContactPatch) =>
        sql`UPDATE contacts SET ${setClause(sql, patch)} WHERE id = ${id} RETURNING *`.pipe(
          onUniqueViolation(emailTaken(patch.email)),
          firstRow(ContactRow),
          orNotFound(notFound(id)),
          Effect.map(toContact),
        ),
      );

      const remove = Effect.fn("ContactRepo.remove")((id: ContactId) =>
        sql`DELETE FROM contacts WHERE id = ${id} RETURNING id`.pipe(
          deletedOrNotFound(notFound(id)),
        ),
      );

      return ContactRepo.of({ list, get, create, update, remove });
    }),
  );
}
