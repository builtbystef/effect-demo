import type { Company } from "@app/domain";
import { useAtomSet } from "@effect/atom-react";
import { Exit, Schema } from "effect";
import { type ReactElement, useState } from "react";
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
import { formSchema, optionalText, requiredText } from "#/lib/form-schema.ts";
import { createCompanyAtom, updateCompanyAtom } from "./api.ts";

const CompanyForm = formSchema(
  Schema.Struct({
    name: requiredText(),
    domain: optionalText(253),
    industry: optionalText(100),
  }),
);

export interface CompanyFormDialogProps {
  readonly trigger: ReactElement;
  /** Edit this company; omit to create a new one. */
  readonly company?: Company;
  readonly onCreated?: (company: Company) => void;
}

export function CompanyFormDialog({ trigger, company, onCreated }: CompanyFormDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent
        title={company === undefined ? "New company" : "Edit company"}
        description="Organizations you sell to."
      >
        <CompanyFormBody
          {...(company !== undefined && { company })}
          onDone={(saved) => {
            setOpen(false);
            if (company === undefined) onCreated?.(saved);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function CompanyFormBody({
  company,
  onDone,
}: {
  readonly company?: Company;
  readonly onDone: (company: Company) => void;
}) {
  const create = useAtomSet(createCompanyAtom, { mode: "promiseExit" });
  const update = useAtomSet(updateCompanyAtom, { mode: "promiseExit" });

  const form = useAppForm({
    defaultValues: {
      name: company?.name ?? "",
      domain: company?.domain ?? "",
      industry: company?.industry ?? "",
    },
    validators: { onChange: CompanyForm.validator },
    onSubmit: async ({ value }) => {
      const input = CompanyForm.decode(value);
      const exit =
        company === undefined
          ? await create(input)
          : await update({ id: company.id, patch: input });
      if (Exit.isSuccess(exit)) {
        notify({
          title: company === undefined ? "Company created" : "Changes saved",
          tone: "success",
        });
        onDone(exit.value);
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
      <form.AppField name="name">
        {(field) => <field.TextField label="Name" placeholder="Acme Inc." autoFocus />}
      </form.AppField>
      <div className="grid gap-4 sm:grid-cols-2">
        <form.AppField name="domain">
          {(field) => <field.TextField label="Website" placeholder="acme.com" type="text" />}
        </form.AppField>
        <form.AppField name="industry">
          {(field) => <field.TextField label="Industry" placeholder="Software" />}
        </form.AppField>
      </div>
      <DialogFooter>
        <DialogClose render={<Button />}>Cancel</DialogClose>
        <form.AppForm>
          <form.SubmitButton>
            {company === undefined ? "Create company" : "Save changes"}
          </form.SubmitButton>
        </form.AppForm>
      </DialogFooter>
    </form>
  );
}
