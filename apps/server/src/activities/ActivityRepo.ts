import {
  Activity,
  type ActivityFilter,
  type ActivityId,
  type ActivityInput,
  NotFound,
} from "@app/domain";
import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/sql";
import { deletedOrNotFound, rows, singleRow } from "../db/util.ts";

export const ActivityRow = Schema.Struct({
  ...Activity.fields,
  createdAt: Schema.DateTimeUtcFromDate,
});
export const toActivity = (row: typeof ActivityRow.Type) => new Activity(row);

const notFound = (id: ActivityId) => () => new NotFound({ resource: "activity", id });

export class ActivityRepo extends Context.Service<
  ActivityRepo,
  {
    list(filter: ActivityFilter): Effect.Effect<ReadonlyArray<Activity>>;
    create(input: ActivityInput): Effect.Effect<Activity>;
    remove(id: ActivityId): Effect.Effect<void, NotFound>;
  }
>()("app/ActivityRepo") {
  static readonly layer = Layer.effect(
    ActivityRepo,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const list = Effect.fn("ActivityRepo.list")((filter: ActivityFilter) => {
        const clauses = [
          filter.contactId === undefined ? null : sql`contact_id = ${filter.contactId}`,
          filter.companyId === undefined ? null : sql`company_id = ${filter.companyId}`,
          filter.dealId === undefined ? null : sql`deal_id = ${filter.dealId}`,
        ].filter((clause) => clause !== null);
        return sql`
          SELECT * FROM activities
          WHERE ${clauses.length === 0 ? sql`true` : sql.and(clauses)}
          ORDER BY created_at DESC
          LIMIT 200
        `.pipe(
          rows(ActivityRow),
          Effect.map((all) => all.map(toActivity)),
        );
      });

      const create = Effect.fn("ActivityRepo.create")((input: ActivityInput) =>
        sql`INSERT INTO activities ${sql.insert(input)} RETURNING *`.pipe(
          singleRow(ActivityRow),
          Effect.map(toActivity),
        ),
      );

      const remove = Effect.fn("ActivityRepo.remove")((id: ActivityId) =>
        sql`DELETE FROM activities WHERE id = ${id} RETURNING id`.pipe(
          deletedOrNotFound(notFound(id)),
        ),
      );

      return ActivityRepo.of({ list, create, remove });
    }),
  );
}
