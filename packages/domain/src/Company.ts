import { Schema, Struct } from "effect";
import { Name, OptionalText, Timestamps, Uuid } from "./shared.ts";

export const CompanyId = Uuid.pipe(Schema.brand("CompanyId"));
export type CompanyId = typeof CompanyId.Type;

const editable = {
  name: Name,
  domain: OptionalText,
  industry: OptionalText,
};

export class Company extends Schema.Class<Company>("Company")({
  id: CompanyId,
  ...editable,
  ...Timestamps,
}) {}

/** A company as listed, with rollups computed by the database. */
export class CompanySummary extends Schema.Class<CompanySummary>("CompanySummary")({
  ...Company.fields,
  contactCount: Schema.Int,
  openDealValue: Schema.Int,
}) {}

export const CompanyInput = Schema.Struct(editable);
export type CompanyInput = typeof CompanyInput.Type;

export const CompanyPatch = CompanyInput.mapFields(Struct.map(Schema.optionalKey));
export type CompanyPatch = typeof CompanyPatch.Type;
