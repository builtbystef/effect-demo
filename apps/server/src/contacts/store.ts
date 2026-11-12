import {
  Contact,
  type ContactId,
  type ContactInput,
  type ContactPatch,
  EmailTaken,
  NotFound,
} from "@app/domain";
import { eq, sql } from "drizzle-orm";
import { Effect, Schema } from "effect";
import type { Database } from "../db/Database.ts";
import { contacts } from "../db/schema.ts";
import {
  deletedOrNotFound,
  firstRow,
  onUniqueViolation,
  orNotFound,
  rows,
  singleRow,
  timestampColumns,
  touched,
} from "../db/util.ts";

const ContactRow = Schema.Struct({ ...Contact.fields, ...timestampColumns });

const toContact = (row: typeof ContactRow.Type) => new Contact(row);
const notFound = (id: ContactId) => () => new NotFound({ resource: "contact", id });
// The only unique index on contacts is the email one.
const emailTaken = (email: string | null | undefined) => () =>
  new EmailTaken({ email: email ?? "" });

/** Every contact, by last then first name. */
export const list = Effect.fn("Contacts.list")((db: Database) =>
  db
    .select()
    .from(contacts)
    .orderBy(sql`lower(${contacts.lastName})`, sql`lower(${contacts.firstName})`)
    .pipe(
      rows(ContactRow),
      Effect.map((all) => all.map(toContact)),
    ),
);

export const get = Effect.fn("Contacts.get")((db: Database, id: ContactId) =>
  db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .pipe(firstRow(ContactRow), orNotFound(notFound(id)), Effect.map(toContact)),
);

export const create = Effect.fn("Contacts.create")((db: Database, input: ContactInput) =>
  db
    .insert(contacts)
    .values(input)
    .returning()
    .pipe(onUniqueViolation(emailTaken(input.email)), singleRow(ContactRow), Effect.map(toContact)),
);

export const update = Effect.fn("Contacts.update")(
  (db: Database, id: ContactId, patch: ContactPatch) =>
    db
      .update(contacts)
      .set(touched(patch))
      .where(eq(contacts.id, id))
      .returning()
      .pipe(
        onUniqueViolation(emailTaken(patch.email)),
        firstRow(ContactRow),
        orNotFound(notFound(id)),
        Effect.map(toContact),
      ),
);

export const remove = Effect.fn("Contacts.remove")((db: Database, id: ContactId) =>
  db
    .delete(contacts)
    .where(eq(contacts.id, id))
    .returning({ id: contacts.id })
    .pipe(deletedOrNotFound(notFound(id))),
);
