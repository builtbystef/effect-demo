import { Schema } from "effect";

/** Required free text: trimmed, non-empty, bounded. */
export const Name = Schema.Trimmed.check(Schema.isNonEmpty(), Schema.isMaxLength(200));

/** Optional free text. `null` means "not set"; blank strings are rejected. */
export const OptionalText = Schema.NullOr(
  Schema.Trimmed.check(Schema.isNonEmpty(), Schema.isMaxLength(500)),
);

export const Email = Schema.Trimmed.check(
  Schema.isMaxLength(254),
  Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Enter a valid email address" }),
);

/** A calendar date with no time or zone, as `YYYY-MM-DD`. */
export const CalendarDate = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/, { message: "Expected a YYYY-MM-DD date" }),
);

/** Whole currency units (USD). Deals in a simple CRM don't need cents. */
export const Money = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 1_000_000_000 }));

export const Timestamps = {
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
};

/**
 * One 404 for every resource. The `resource` field tells the client which
 * lookup failed, so the UI can say "Contact not found" without each entity
 * needing its own error class.
 */
export class NotFound extends Schema.TaggedError<NotFound>()(
  "NotFound",
  {
    resource: Schema.Literals(["company", "contact", "deal", "activity"]),
    id: Schema.String,
  },
  { httpApiStatus: 404 },
) {}

/** Primary keys are Postgres-generated UUIDs. */
export const Uuid = Schema.String.check(Schema.isUUID());
