import { CalendarDate, Email, Money } from "@app/domain";
import { Schema, SchemaTransformation } from "effect";

/*
 * Form fields hold strings; the API wants trimmed text, `null` for blanks,
 * numbers and branded ids. These schemas decode one into the other, so a form
 * is validated (through Standard Schema) and converted by the same definition.
 * Messages are written for people, not developers.
 */

const trim = SchemaTransformation.transform<string, string>({
  decode: (s) => s.trim(),
  encode: (s) => s,
});

const blankToNull = SchemaTransformation.transform<string | null, string>({
  decode: (s) => (s.trim() === "" ? null : s.trim()),
  encode: (v) => v ?? "",
});

export const requiredText = (max = 200) =>
  Schema.String.pipe(
    Schema.decodeTo(
      Schema.String.check(
        Schema.isNonEmpty({ message: "Required" }),
        Schema.isMaxLength(max, { message: `Keep it under ${max} characters` }),
      ),
      trim,
    ),
  );

export const optionalText = (max = 500) =>
  Schema.String.pipe(
    Schema.decodeTo(
      Schema.NullOr(
        Schema.String.check(
          Schema.isMaxLength(max, { message: `Keep it under ${max} characters` }),
        ),
      ),
      blankToNull,
    ),
  );

export const optionalEmail = Schema.String.pipe(
  Schema.decodeTo(
    Schema.NullOr(Email.annotate({ message: "Enter a valid email address" })),
    blankToNull,
  ),
);

export const optionalDate = Schema.String.pipe(
  Schema.decodeTo(Schema.NullOr(CalendarDate), blankToNull),
);

/** A `<Select>` of records where "" means "none". */
export const optionalRef = <Id extends Schema.Codec<string, string>>(id: Id) =>
  Schema.String.pipe(Schema.decodeTo(Schema.NullOr(id), blankToNull));

export const amount = Schema.String.pipe(
  Schema.decodeTo(
    Money.annotate({ message: "Enter a whole amount, 0 or more" }),
    SchemaTransformation.transform<number, string>({
      decode: (s) => (s.trim() === "" ? 0 : Number(s.replace(/[,\s$]/g, ""))),
      encode: (n) => String(n),
    }),
  ),
);

/**
 * Pair a form schema's Standard Schema view (for TanStack Form validation)
 * with its decoder (to turn submitted strings into the API payload).
 */
export const formSchema = <S extends Schema.Codec<any, any>>(schema: S) => ({
  validator: Schema.toStandardSchemaV1(schema),
  decode: Schema.decodeUnknownSync(schema) as (input: unknown) => S["Type"],
});
