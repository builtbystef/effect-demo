import { Schema, Struct } from "effect";
import { CompanyId } from "./Company.ts";
import { Email, Name, OptionalText, Timestamps, Uuid } from "./shared.ts";

export const ContactId = Uuid.pipe(Schema.brand("ContactId"));
export type ContactId = typeof ContactId.Type;

export const ContactStatus = Schema.Literals(["lead", "prospect", "customer", "churned"]);
export type ContactStatus = typeof ContactStatus.Type;

const editable = {
  firstName: Name,
  lastName: Name,
  email: Schema.NullOr(Email),
  phone: OptionalText,
  title: OptionalText,
  status: ContactStatus,
  companyId: Schema.NullOr(CompanyId),
};

export class Contact extends Schema.Class<Contact>("Contact")({
  id: ContactId,
  ...editable,
  ...Timestamps,
}) {
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export const ContactInput = Schema.Struct(editable);
export type ContactInput = typeof ContactInput.Type;

export const ContactPatch = ContactInput.mapFields(Struct.map(Schema.optionalKey));
export type ContactPatch = typeof ContactPatch.Type;

/** Emails are unique (case-insensitively) across contacts. */
export class EmailTaken extends Schema.TaggedError<EmailTaken>()(
  "EmailTaken",
  { email: Schema.String },
  { httpApiStatus: 409 },
) {}
