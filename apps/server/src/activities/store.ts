import {
  Activity,
  type ActivityFilter,
  type ActivityId,
  type ActivityInput,
  NotFound,
} from "@app/domain";
import { and, desc, eq } from "drizzle-orm";
import { Effect, Schema } from "effect";
import type { Database } from "../db/Database.ts";
import { activities } from "../db/schema.ts";
import { deletedOrNotFound, rows, singleRow } from "../db/util.ts";

const ActivityRow = Schema.Struct({
  ...Activity.fields,
  createdAt: Schema.DateTimeUtcFromDate,
});
const toActivity = (row: typeof ActivityRow.Type) => new Activity(row);

const notFound = (id: ActivityId) => () => new NotFound({ resource: "activity", id });

/** Newest first. `and` skips the filters that aren't set; with none, every row matches. */
export const list = Effect.fn("Activities.list")(
  (db: Database, filter: ActivityFilter, limit = 200) =>
    db
      .select()
      .from(activities)
      .where(
        and(
          filter.contactId === undefined ? undefined : eq(activities.contactId, filter.contactId),
          filter.companyId === undefined ? undefined : eq(activities.companyId, filter.companyId),
          filter.dealId === undefined ? undefined : eq(activities.dealId, filter.dealId),
        ),
      )
      .orderBy(desc(activities.createdAt))
      .limit(limit)
      .pipe(
        rows(ActivityRow),
        Effect.map((all) => all.map(toActivity)),
      ),
);

export const create = Effect.fn("Activities.create")((db: Database, input: ActivityInput) =>
  db
    .insert(activities)
    .values(input)
    .returning()
    .pipe(singleRow(ActivityRow), Effect.map(toActivity)),
);

export const remove = Effect.fn("Activities.remove")((db: Database, id: ActivityId) =>
  db
    .delete(activities)
    .where(eq(activities.id, id))
    .returning({ id: activities.id })
    .pipe(deletedOrNotFound(notFound(id))),
);
