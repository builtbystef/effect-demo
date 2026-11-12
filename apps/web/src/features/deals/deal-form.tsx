import {
  CompanyId,
  type CompanyId as CompanyIdType,
  ContactId,
  type ContactId as ContactIdType,
  type Deal,
  DealStage,
} from "@app/domain";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Exit, Schema } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type ReactElement, useMemo, useState } from "react";
import { useAppForm } from "#/components/form/form.tsx";
import { Button } from "#/components/ui/button.tsx";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "#/components/ui/dialog.tsx";
import { notify } from "#/components/ui/toast.tsx";
import { amount, formSchema, optionalDate, optionalRef, requiredText } from "#/lib/form-schema.ts";
import { useCompanyOptions } from "../companies/use-company-options.ts";
import { contactsAtom } from "../contacts/api.ts";
import { createDealAtom, updateDealAtom } from "./api.ts";
import { dealStageOptions } from "./deal-stage.tsx";

const DealForm = formSchema(
  Schema.Struct({
    title: requiredText(),
    value: amount,
    stage: DealStage,
    companyId: optionalRef(CompanyId),
    contactId: optionalRef(ContactId),
    expectedCloseDate: optionalDate,
  }),
);

export interface DealFormDialogProps {
  readonly trigger: ReactElement;
  /** Edit this deal; omit to create a new one. */
  readonly deal?: Deal;
  readonly defaults?: {
    readonly stage?: DealStage;
    readonly companyId?: CompanyIdType;
    readonly contactId?: ContactIdType;
  };
}

export function DealFormDialog({ trigger, deal, defaults }: DealFormDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent
        title={deal === undefined ? "New deal" : "Edit deal"}
        description="An opportunity in your pipeline."
      >
        <DealFormBody
          {...(deal !== undefined && { deal })}
          {...(defaults !== undefined && { defaults })}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function DealFormBody({
  deal,
  defaults,
  onDone,
}: {
  readonly deal?: Deal;
  readonly defaults?: DealFormDialogProps["defaults"];
  readonly onDone: () => void;
}) {
  const create = useAtomSet(createDealAtom, { mode: "promiseExit" });
  const update = useAtomSet(updateDealAtom, { mode: "promiseExit" });
  const companyOptions = useCompanyOptions();
  const contacts = useAtomValue(contactsAtom);
  const contactOptions = useMemo(
    () => [
      { value: "", label: "No contact" },
      ...AsyncResult.getOrElse(contacts, () => []).map((c) => ({
        value: c.id as string,
        label: c.fullName,
      })),
    ],
    [contacts],
  );

  const form = useAppForm({
    defaultValues: {
      title: deal?.title ?? "",
      value: deal === undefined ? "" : String(deal.value),
      stage: deal?.stage ?? defaults?.stage ?? ("lead" as DealStage),
      companyId: (deal?.companyId ?? defaults?.companyId ?? "") as string,
      contactId: (deal?.contactId ?? defaults?.contactId ?? "") as string,
      expectedCloseDate: deal?.expectedCloseDate ?? "",
    },
    validators: { onChange: DealForm.validator },
    onSubmit: async ({ value }) => {
      const input = DealForm.decode(value);
      const exit =
        deal === undefined ? await create(input) : await update({ id: deal.id, patch: input });
      if (Exit.isSuccess(exit)) {
        notify({ title: deal === undefined ? "Deal created" : "Changes saved", tone: "success" });
        onDone();
      }
    },
  });

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <form.AppField name="title">
        {(field) => <field.TextField label="Title" placeholder="Annual contract" autoFocus />}
      </form.AppField>
      <div className="grid gap-4 sm:grid-cols-2">
        <form.AppField name="value">
          {(field) => (
            <field.TextField label="Value (USD)" inputMode="numeric" placeholder="25000" />
          )}
        </form.AppField>
        <form.AppField name="stage">
          {(field) => <field.SelectField label="Stage" options={dealStageOptions} />}
        </form.AppField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <form.AppField name="companyId">
          {(field) => <field.SelectField label="Company" options={companyOptions} />}
        </form.AppField>
        <form.AppField name="contactId">
          {(field) => <field.SelectField label="Contact" options={contactOptions} />}
        </form.AppField>
      </div>
      <form.AppField name="expectedCloseDate">
        {(field) => <field.TextField label="Expected close" type="date" className="sm:w-1/2" />}
      </form.AppField>
      <DialogFooter>
        <DialogClose render={<Button />}>Cancel</DialogClose>
        <form.AppForm>
          <form.SubmitButton>
            {deal === undefined ? "Create deal" : "Save changes"}
          </form.SubmitButton>
        </form.AppForm>
      </DialogFooter>
    </form>
  );
}
