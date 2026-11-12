import {
  Company,
  type CompanyId,
  type CompanyInput,
  type CompanyPatch,
  CompanySummary,
  NotFound,
} from "@app/domain";
import { and, eq, getColumns, sql } from "drizzle-orm";
import { Effect, Schema } from "effect";
import type { Database } from "../db/Database.ts";
import { companies, contacts, deals } from "../db/schema.ts";
import {
  deletedOrNotFound,
  firstRow,
  orNotFound,
  rows,
  singleRow,
  timestampColumns,
  touched,
} from "../db/util.ts";
import { isOpenDeal } from "../deals/store.ts";

const CompanyRow = Schema.Struct({ ...Company.fields, ...timestampColumns });
const SummaryRow = Schema.Struct({ ...CompanySummary.fields, ...timestampColumns });

const toCompany = (row: typeof CompanyRow.Type) => new Company(row);
const notFound = (id: CompanyId) => () => new NotFound({ resource: "company", id });

/** Every company, by name, with its contact count and open pipeline value. */
export const list = Effect.fn("Companies.list")((db: Database) =>
  db
    .select({
      ...getColumns(companies),
      contactCount: db.$count(contacts, eq(contacts.companyId, companies.id)),
      openDealValue: sql<number>`(
        SELECT coalesce(sum(${deals.value}), 0)::int FROM ${deals}
        WHERE ${and(eq(deals.companyId, companies.id), isOpenDeal)}
      )`,
    })
    .from(companies)
    .orderBy(sql`lower(${companies.name})`)
    .pipe(
      rows(SummaryRow),
      Effect.map((all) => all.map((row) => new CompanySummary(row))),
    ),
);

export const get = Effect.fn("Companies.get")((db: Database, id: CompanyId) =>
  db
    .select()
    .from(companies)
    .where(eq(companies.id, id))
    .pipe(firstRow(CompanyRow), orNotFound(notFound(id)), Effect.map(toCompany)),
);

export const create = Effect.fn("Companies.create")((db: Database, input: CompanyInput) =>
  db.insert(companies).values(input).returning().pipe(singleRow(CompanyRow), Effect.map(toCompany)),
);

export const update = Effect.fn("Companies.update")(
  (db: Database, id: CompanyId, patch: CompanyPatch) =>
    db
      .update(companies)
      .set(touched(patch))
      .where(eq(companies.id, id))
      .returning()
      .pipe(firstRow(CompanyRow), orNotFound(notFound(id)), Effect.map(toCompany)),
);

export const remove = Effect.fn("Companies.remove")((db: Database, id: CompanyId) =>
  db
    .delete(companies)
    .where(eq(companies.id, id))
    .returning({ id: companies.id })
    .pipe(deletedOrNotFound(notFound(id))),
);
