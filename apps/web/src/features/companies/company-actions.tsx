import type { Company } from "@app/domain";
import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { Exit } from "effect";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { ConfirmDialog } from "#/components/ui/confirm-dialog.tsx";
import { Menu, MenuItem } from "#/components/ui/menu.tsx";
import { notify } from "#/components/ui/toast.tsx";
import { deleteCompanyAtom } from "./api.ts";
import { CompanyFormDialog } from "./company-form.tsx";

/** Edit and delete for a company's page header. Deleting goes back to the list. */
export function CompanyActions({ company }: { readonly company: Company }) {
  const navigate = useNavigate();
  const remove = useAtomSet(deleteCompanyAtom, { mode: "promiseExit" });

  const onDelete = async () => {
    const exit = await remove(company.id);
    if (Exit.isSuccess(exit)) {
      notify({ title: "Company deleted", description: company.name });
      void navigate({ to: "/companies" });
    }
  };

  return (
    <>
      <CompanyFormDialog
        company={company}
        trigger={
          <Button>
            <Pencil />
            Edit
          </Button>
        }
      />
      <Menu
        trigger={
          <Button size="icon" aria-label="More actions">
            <Ellipsis />
          </Button>
        }
      >
        <ConfirmDialog
          trigger={
            <MenuItem destructive closeOnClick={false}>
              <Trash2 />
              Delete company
            </MenuItem>
          }
          title={`Delete ${company.name}?`}
          description="Its activity history will be deleted. Contacts and deals stay, without a company. This can't be undone."
          confirmLabel="Delete company"
          destructive
          onConfirm={() => void onDelete()}
        />
      </Menu>
    </>
  );
}
