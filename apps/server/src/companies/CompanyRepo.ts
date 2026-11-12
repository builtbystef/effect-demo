import {
  Company,
  type CompanyId,
  type CompanyInput,
  type CompanyPatch,
  CompanySummary,
  NotFound,
} from "@app/domain";
import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/sql";
import {
  deletedOrNotFound,
  firstRow,
  orNotFound,
  rows,
  setClause,
  singleRow,
  timestampColumns,
} from "../db/util.ts";
import { isOpenDeal } from "../deals/DealRepo.ts";

const CompanyRow = Schema.Struct({ ...Company.fields, ...timestampColumns });
const SummaryRow = Schema.Struct({ ...CompanySummary.fields, ...timestampColumns });

const toCompany = (row: typeof CompanyRow.Type) => new Company(row);
const notFound = (id: CompanyId) => () => new NotFound({ resource: "company", id });

export class CompanyRepo extends Context.Service<
  CompanyRepo,
  {
    readonly list: Effect.Effect<ReadonlyArray<CompanySummary>>;
    get(id: CompanyId): Effect.Effect<Company, NotFound>;
    create(input: CompanyInput): Effect.Effect<Company>;
    update(id: CompanyId, patch: CompanyPatch): Effect.Effect<Company, NotFound>;
    remove(id: CompanyId): Effect.Effect<void, NotFound>;
  }
>()("app/CompanyRepo") {
  static readonly layer = Layer.effect(
    CompanyRepo,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const list = sql`
        SELECT
          c.*,
          (SELECT count(*)::int FROM contacts WHERE company_id = c.id) AS contact_count,
          (SELECT coalesce(sum(value), 0)::int FROM deals
            WHERE company_id = c.id AND ${isOpenDeal(sql)}) AS open_deal_value
        FROM companies c
        ORDER BY lower(c.name)
      `.pipe(
        rows(SummaryRow),
        Effect.map((all) => all.map((row) => new CompanySummary(row))),
        Effect.withSpan("CompanyRepo.list"),
      );

      const get = Effect.fn("CompanyRepo.get")((id: CompanyId) =>
        sql`SELECT * FROM companies WHERE id = ${id}`.pipe(
          firstRow(CompanyRow),
          orNotFound(notFound(id)),
          Effect.map(toCompany),
        ),
      );

      const create = Effect.fn("CompanyRepo.create")((input: CompanyInput) =>
        sql`INSERT INTO companies ${sql.insert(input)} RETURNING *`.pipe(
          singleRow(CompanyRow),
          Effect.map(toCompany),
        ),
      );

      const update = Effect.fn("CompanyRepo.update")((id: CompanyId, patch: CompanyPatch) =>
        sql`UPDATE companies SET ${setClause(sql, patch)} WHERE id = ${id} RETURNING *`.pipe(
          firstRow(CompanyRow),
          orNotFound(notFound(id)),
          Effect.map(toCompany),
        ),
      );

      const remove = Effect.fn("CompanyRepo.remove")((id: CompanyId) =>
        sql`DELETE FROM companies WHERE id = ${id} RETURNING id`.pipe(
          deletedOrNotFound(notFound(id)),
        ),
      );

      return CompanyRepo.of({ list, get, create, update, remove });
    }),
  );
}
