import { Effect } from "effect";
import { SqlClient } from "effect/sql";

// Keys are `<id>_<name>`; the id decides the order.
export const migrations = {
  "0001_create_crm_schema": Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    yield* sql`
      CREATE TABLE companies (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
        domain      text,
        industry    text,
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now()
      )
    `;

    yield* sql`
      CREATE TABLE contacts (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name  text NOT NULL,
        last_name   text NOT NULL,
        email       text,
        phone       text,
        title       text,
        status      text NOT NULL DEFAULT 'lead'
                    CHECK (status IN ('lead', 'prospect', 'customer', 'churned')),
        company_id  uuid REFERENCES companies (id) ON DELETE SET NULL,
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now()
      )
    `;
    yield* sql`CREATE UNIQUE INDEX contacts_email_key ON contacts (lower(email)) WHERE email IS NOT NULL`;
    yield* sql`CREATE INDEX contacts_company_id_idx ON contacts (company_id)`;

    yield* sql`
      CREATE TABLE deals (
        id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title                text NOT NULL,
        value                integer NOT NULL DEFAULT 0 CHECK (value >= 0),
        stage                text NOT NULL DEFAULT 'lead'
                             CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
        company_id           uuid REFERENCES companies (id) ON DELETE SET NULL,
        contact_id           uuid REFERENCES contacts (id) ON DELETE SET NULL,
        expected_close_date  date,
        created_at           timestamptz NOT NULL DEFAULT now(),
        updated_at           timestamptz NOT NULL DEFAULT now()
      )
    `;
    yield* sql`CREATE INDEX deals_company_id_idx ON deals (company_id)`;
    yield* sql`CREATE INDEX deals_contact_id_idx ON deals (contact_id)`;
    yield* sql`CREATE INDEX deals_stage_idx ON deals (stage)`;

    // Activities belong to whatever they're about; deleting that record
    // deletes its timeline.
    yield* sql`
      CREATE TABLE activities (
        id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        kind        text NOT NULL CHECK (kind IN ('note', 'call', 'email', 'meeting')),
        body        text NOT NULL,
        contact_id  uuid REFERENCES contacts (id) ON DELETE CASCADE,
        company_id  uuid REFERENCES companies (id) ON DELETE CASCADE,
        deal_id     uuid REFERENCES deals (id) ON DELETE CASCADE,
        created_at  timestamptz NOT NULL DEFAULT now()
      )
    `;
    yield* sql`CREATE INDEX activities_contact_id_idx ON activities (contact_id, created_at DESC)`;
    yield* sql`CREATE INDEX activities_company_id_idx ON activities (company_id, created_at DESC)`;
    yield* sql`CREATE INDEX activities_deal_id_idx ON activities (deal_id, created_at DESC)`;
  }),
};
