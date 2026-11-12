import {
  CompanyId,
  type Contact,
  type CompanyId as CompanyIdType,
  ContactStatus,
} from "@app/domain";
import { useAtomSet } from "@effect/atom-react";
import { Cause, Exit, Option, Schema } from "effect";
import type { ReactElement } from "react";
import { useAppForm } from "#/components/form/form.tsx";
import { FormDialog } from "#/components/form/form-dialog.tsx";
import { Button } from "#/components/ui/button.tsx";
import { DialogClose, DialogFooter } from "#/components/ui/dialog.tsx";
import { notify } from "#/components/ui/toast.tsx";
import {
  formSchema,
  optionalEmail,
  optionalRef,
  optionalText,
  requiredText,
} from "#/lib/form-schema.ts";
import { useCompanyOptions } from "../companies/use-company-options.ts";
import { createContactAtom, updateContactAtom } from "./api.ts";
import { contactStatusOptions } from "./contact-status.tsx";

const ContactForm = formSchema(
  Schema.Struct({
    firstName: requiredText(),
    lastName: requiredText(),
    email: optionalEmail,
    phone: optionalText(50),
    title: optionalText(120),
    status: ContactStatus,
    companyId: optionalRef(CompanyId),
  }),
);

export interface ContactFormDialogProps {
  readonly trigger: ReactElement;
  /** Edit this contact; omit to create a new one. */
  readonly contact?: Contact;
  /** Pre-select a company when creating from a company page. */
  readonly defaultCompanyId?: CompanyIdType;
  readonly onCreated?: (contact: Contact) => void;
}

export function ContactFormDialog({
  trigger,
  contact,
  defaultCompanyId,
  onCreated,
}: ContactFormDialogProps) {
  return (
    <FormDialog
      trigger={trigger}
      title={contact === undefined ? "New contact" : "Edit contact"}
      description="People you work with."
    >
      {(close) => (
        <ContactFormBody
          {...(contact !== undefined && { contact })}
          {...(defaultCompanyId !== undefined && { defaultCompanyId })}
          onDone={(saved) => {
            close();
            if (contact === undefined) onCreated?.(saved);
          }}
        />
      )}
    </FormDialog>
  );
}

function ContactFormBody({
  contact,
  defaultCompanyId,
  onDone,
}: {
  readonly contact?: Contact;
  readonly defaultCompanyId?: CompanyIdType;
  readonly onDone: (contact: Contact) => void;
}) {
  const create = useAtomSet(createContactAtom, { mode: "promiseExit" });
  const update = useAtomSet(updateContactAtom, { mode: "promiseExit" });
  const companyOptions = useCompanyOptions();

  const form = useAppForm({
    defaultValues: {
      firstName: contact?.firstName ?? "",
      lastName: contact?.lastName ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      title: contact?.title ?? "",
      status: contact?.status ?? ("lead" as ContactStatus),
      companyId: (contact?.companyId ?? defaultCompanyId ?? "") as string,
    },
    validators: { onChange: ContactForm.validator },
    onSubmit: async ({ value, formApi }) => {
      const input = ContactForm.decode(value);
      const exit =
        contact === undefined
          ? await create(input)
          : await update({ id: contact.id, patch: input });
      if (Exit.isSuccess(exit)) {
        notify({
          title: contact === undefined ? "Contact created" : "Changes saved",
          tone: "success",
        });
        onDone(exit.value);
        return;
      }
      // The API's typed errors map straight onto the field they're about.
      const error = Cause.findErrorOption(exit.cause);
      if (Option.isSome(error) && error.value._tag === "EmailTaken") {
        formApi.setFieldMeta("email", (meta) => ({
          ...meta,
          isTouched: true,
          errorMap: { ...meta.errorMap, onSubmit: "Another contact already uses this email" },
        }));
      }
    },
  });

  return (
    <form.AppForm>
      <form.Form className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="firstName">
            {(field) => <field.TextField label="First name" autoComplete="off" autoFocus />}
          </form.AppField>
          <form.AppField name="lastName">
            {(field) => <field.TextField label="Last name" autoComplete="off" />}
          </form.AppField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                label="Email"
                type="email"
                placeholder="name@company.com"
                autoComplete="off"
              />
            )}
          </form.AppField>
          <form.AppField name="phone">
            {(field) => <field.TextField label="Phone" type="tel" autoComplete="off" />}
          </form.AppField>
        </div>
        <form.AppField name="title">
          {(field) => <field.TextField label="Job title" placeholder="Head of Operations" />}
        </form.AppField>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="companyId">
            {(field) => <field.SelectField label="Company" options={companyOptions} />}
          </form.AppField>
          <form.AppField name="status">
            {(field) => <field.SelectField label="Status" options={contactStatusOptions} />}
          </form.AppField>
        </div>
        <DialogFooter>
          <DialogClose render={<Button />}>Cancel</DialogClose>
          <form.SubmitButton>
            {contact === undefined ? "Create contact" : "Save changes"}
          </form.SubmitButton>
        </DialogFooter>
      </form.Form>
    </form.AppForm>
  );
}
