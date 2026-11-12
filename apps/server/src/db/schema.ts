import {
  type ActivityId,
  ActivityKind,
  type CompanyId,
  type ContactId,
  ContactStatus,
  type DealId,
  DealStage,
} from "@app/domain";
import { inArray, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  snakeCase,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// The database schema, and the source drizzle-kit generates migrations from
// (`pnpm db:generate`). Columns are camelCase here and snake_case in Postgres.
// Literal columns take their values from the domain, so a new deal stage or
// contact status reaches the type, the CHECK constraint and the next migration
// from one place.

const createdAt = timestamp({ withTimezone: true }).notNull().defaultNow();
const timestamps = {
  createdAt,
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
};

export const companies = snakeCase.table(
  "companies",
  {
    id: uuid().primaryKey().defaultRandom().$type<CompanyId>(),
    name: text().notNull(),
    domain: text(),
    industry: text(),
    ...timestamps,
  },
  (t) => [check("companies_name_check", sql`length(${t.name}) BETWEEN 1 AND 200`)],
);

export const contacts = snakeCase.table(
  "contacts",
  {
    id: uuid().primaryKey().defaultRandom().$type<ContactId>(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    email: text(),
    phone: text(),
    title: text(),
    status: text({ enum: ContactStatus.literals }).notNull().default("lead"),
    companyId: uuid()
      .$type<CompanyId>()
      .references(() => companies.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [
    check("contacts_status_check", inArray(t.status, ContactStatus.literals)),
    // Emails are unique case-insensitively; contacts without one don't clash.
    uniqueIndex("contacts_email_key")
      .on(sql`lower(${t.email})`)
      .where(sql`${t.email} IS NOT NULL`),
    index("contacts_company_id_idx").on(t.companyId),
  ],
);

export const deals = snakeCase.table(
  "deals",
  {
    id: uuid().primaryKey().defaultRandom().$type<DealId>(),
    title: text().notNull(),
    value: integer().notNull().default(0),
    stage: text({ enum: DealStage.literals }).notNull().default("lead"),
    companyId: uuid()
      .$type<CompanyId>()
      .references(() => companies.id, { onDelete: "set null" }),
    contactId: uuid()
      .$type<ContactId>()
      .references(() => contacts.id, { onDelete: "set null" }),
    expectedCloseDate: date({ mode: "string" }),
    ...timestamps,
  },
  (t) => [
    check("deals_value_check", sql`${t.value} >= 0`),
    check("deals_stage_check", inArray(t.stage, DealStage.literals)),
    index("deals_company_id_idx").on(t.companyId),
    index("deals_contact_id_idx").on(t.contactId),
    index("deals_stage_idx").on(t.stage),
  ],
);

// Activities belong to whatever they're about; deleting that record deletes
// its timeline.
export const activities = snakeCase.table(
  "activities",
  {
    id: uuid().primaryKey().defaultRandom().$type<ActivityId>(),
    kind: text({ enum: ActivityKind.literals }).notNull(),
    body: text().notNull(),
    contactId: uuid()
      .$type<ContactId>()
      .references(() => contacts.id, { onDelete: "cascade" }),
    companyId: uuid()
      .$type<CompanyId>()
      .references(() => companies.id, { onDelete: "cascade" }),
    dealId: uuid()
      .$type<DealId>()
      .references(() => deals.id, { onDelete: "cascade" }),
    createdAt,
  },
  (t) => [
    check("activities_kind_check", inArray(t.kind, ActivityKind.literals)),
    index("activities_contact_id_idx").on(t.contactId, t.createdAt.desc()),
    index("activities_company_id_idx").on(t.companyId, t.createdAt.desc()),
    index("activities_deal_id_idx").on(t.dealId, t.createdAt.desc()),
  ],
);
