import { Config, Effect } from "effect";
import { SqlClient } from "effect/sql";

/**
 * Fills an empty database with a small, believable data set so a fresh dev
 * environment has something to look at. Runs only when `SEED_DEMO_DATA=true`
 * and only if there are no companies yet, so it never touches real data.
 */
export const seedDemoData = Effect.gen(function* () {
  const enabled = yield* Config.Boolean("SEED_DEMO_DATA").pipe(Config.withDefault(false));
  if (!enabled) return;

  const sql = yield* SqlClient.SqlClient;
  const existing = yield* sql`SELECT 1 FROM companies LIMIT 1`;
  if (existing.length > 0) return;

  yield* sql.withTransaction(
    Effect.gen(function* () {
      const companies = yield* sql<{ id: string; name: string }>`
        INSERT INTO companies ${sql.insert([
          { name: "Northwind Traders", domain: "northwind.example", industry: "Wholesale" },
          { name: "Globex", domain: "globex.example", industry: "Manufacturing" },
          { name: "Initech", domain: "initech.example", industry: "Software" },
          { name: "Umbrella Health", domain: "umbrella.example", industry: "Healthcare" },
        ])}
        RETURNING id, name
      `;
      const company = (name: string) => companies.find((c) => c.name === name)?.id ?? null;

      const contacts = yield* sql<{ id: string; email: string }>`
        INSERT INTO contacts ${sql.insert([
          {
            firstName: "Ada",
            lastName: "Fischer",
            email: "ada@northwind.example",
            phone: "+1 555 0101",
            title: "Head of Procurement",
            status: "customer",
            companyId: company("Northwind Traders"),
          },
          {
            firstName: "Tomás",
            lastName: "Reyes",
            email: "tomas@globex.example",
            phone: "+1 555 0102",
            title: "COO",
            status: "prospect",
            companyId: company("Globex"),
          },
          {
            firstName: "Mei",
            lastName: "Lin",
            email: "mei@initech.example",
            phone: null,
            title: "VP Engineering",
            status: "lead",
            companyId: company("Initech"),
          },
          {
            firstName: "Samir",
            lastName: "Haddad",
            email: "samir@umbrella.example",
            phone: "+1 555 0104",
            title: "IT Director",
            status: "prospect",
            companyId: company("Umbrella Health"),
          },
          {
            firstName: "Jo",
            lastName: "Okafor",
            email: "jo@initech.example",
            phone: null,
            title: "Office Manager",
            status: "churned",
            companyId: company("Initech"),
          },
        ])}
        RETURNING id, email
      `;
      const contact = (email: string) => contacts.find((c) => c.email === email)?.id ?? null;

      const deals = yield* sql<{ id: string; title: string }>`
        INSERT INTO deals ${sql.insert([
          {
            title: "Annual supply contract",
            value: 48000,
            stage: "won",
            companyId: company("Northwind Traders"),
            contactId: contact("ada@northwind.example"),
            expectedCloseDate: null,
          },
          {
            title: "Warehouse expansion",
            value: 125000,
            stage: "negotiation",
            companyId: company("Northwind Traders"),
            contactId: contact("ada@northwind.example"),
            expectedCloseDate: "2026-12-15",
          },
          {
            title: "Factory automation pilot",
            value: 60000,
            stage: "proposal",
            companyId: company("Globex"),
            contactId: contact("tomas@globex.example"),
            expectedCloseDate: "2027-01-31",
          },
          {
            title: "Developer tooling seats",
            value: 18000,
            stage: "qualified",
            companyId: company("Initech"),
            contactId: contact("mei@initech.example"),
            expectedCloseDate: "2027-02-28",
          },
          {
            title: "Clinic network rollout",
            value: 210000,
            stage: "lead",
            companyId: company("Umbrella Health"),
            contactId: contact("samir@umbrella.example"),
            expectedCloseDate: null,
          },
          {
            title: "Printer lease renewal",
            value: 4000,
            stage: "lost",
            companyId: company("Initech"),
            contactId: contact("jo@initech.example"),
            expectedCloseDate: null,
          },
        ])}
        RETURNING id, title
      `;
      const deal = (title: string) => deals.find((d) => d.title === title)?.id ?? null;

      yield* sql`
        INSERT INTO activities ${sql.insert([
          {
            kind: "meeting",
            body: "Kickoff for the warehouse expansion. They want a phased rollout starting in Q1.",
            contactId: contact("ada@northwind.example"),
            companyId: company("Northwind Traders"),
            dealId: deal("Warehouse expansion"),
          },
          {
            kind: "call",
            body: "Walked Tomás through the pilot scope. Sending a proposal by Friday.",
            contactId: contact("tomas@globex.example"),
            companyId: company("Globex"),
            dealId: deal("Factory automation pilot"),
          },
          {
            kind: "email",
            body: "Shared pricing tiers for 50 and 120 seats.",
            contactId: contact("mei@initech.example"),
            companyId: company("Initech"),
            dealId: deal("Developer tooling seats"),
          },
          {
            kind: "note",
            body: "Samir is evaluating three vendors. Budget approval expected in January.",
            contactId: contact("samir@umbrella.example"),
            companyId: company("Umbrella Health"),
            dealId: deal("Clinic network rollout"),
          },
        ])}
      `;
    }),
  );

  yield* Effect.logInfo("Seeded demo data");
}).pipe(Effect.orDie, Effect.withSpan("seedDemoData"));
