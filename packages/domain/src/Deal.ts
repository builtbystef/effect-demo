import { Schema, Struct } from "effect";
import { CompanyId } from "./Company.ts";
import { ContactId } from "./Contact.ts";
import { CalendarDate, Money, Name, Timestamps, Uuid } from "./shared.ts";

export const DealId = Uuid.pipe(Schema.brand("DealId"));
export type DealId = typeof DealId.Type;

/** Pipeline stages, in board order. `won` and `lost` are terminal. */
export const DealStage = Schema.Literals([
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
]);
export type DealStage = typeof DealStage.Type;

export const dealStages = DealStage.literals;
export const isOpenStage = (stage: DealStage): boolean => stage !== "won" && stage !== "lost";

const editable = {
  title: Name,
  value: Money,
  stage: DealStage,
  companyId: Schema.NullOr(CompanyId),
  contactId: Schema.NullOr(ContactId),
  expectedCloseDate: Schema.NullOr(CalendarDate),
};

export class Deal extends Schema.Class<Deal>("Deal")({
  id: DealId,
  ...editable,
  ...Timestamps,
}) {}

export const DealInput = Schema.Struct(editable);
export type DealInput = typeof DealInput.Type;

export const DealPatch = DealInput.mapFields(Struct.map(Schema.optionalKey));
export type DealPatch = typeof DealPatch.Type;
