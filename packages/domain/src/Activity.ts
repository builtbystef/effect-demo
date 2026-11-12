import { Schema } from "effect";
import { CompanyId } from "./Company.ts";
import { ContactId } from "./Contact.ts";
import { DealId } from "./Deal.ts";
import { Uuid } from "./shared.ts";

export const ActivityId = Uuid.pipe(Schema.brand("ActivityId"));
export type ActivityId = typeof ActivityId.Type;

export const ActivityKind = Schema.Literals(["note", "call", "email", "meeting"]);
export type ActivityKind = typeof ActivityKind.Type;

const links = {
  contactId: Schema.NullOr(ContactId),
  companyId: Schema.NullOr(CompanyId),
  dealId: Schema.NullOr(DealId),
};

/** Something that happened with a contact, company or deal: the timeline. */
export class Activity extends Schema.Class<Activity>("Activity")({
  id: ActivityId,
  kind: ActivityKind,
  body: Schema.Trimmed.check(Schema.isNonEmpty(), Schema.isMaxLength(5000)),
  ...links,
  createdAt: Schema.DateTimeUtc,
}) {}

export const ActivityInput = Schema.Struct({
  kind: ActivityKind,
  body: Activity.fields.body,
  ...links,
});
export type ActivityInput = typeof ActivityInput.Type;

/** Narrow a timeline to one record. All filters are optional and combine. */
export const ActivityFilter = Schema.Struct({
  contactId: Schema.optionalKey(ContactId),
  companyId: Schema.optionalKey(CompanyId),
  dealId: Schema.optionalKey(DealId),
});
export type ActivityFilter = typeof ActivityFilter.Type;
