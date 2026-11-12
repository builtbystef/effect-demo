import type { Contact } from "@app/domain";
import { useAtomSet } from "@effect/atom-react";
import { useNavigate } from "@tanstack/react-router";
import { Exit } from "effect";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { ConfirmDialog } from "#/components/ui/confirm-dialog.tsx";
import { Menu, MenuItem } from "#/components/ui/menu.tsx";
import { notify } from "#/components/ui/toast.tsx";
import { deleteContactAtom } from "./api.ts";
import { ContactFormDialog } from "./contact-form.tsx";

/** Edit and delete for a contact's page header. Deleting goes back to the list. */
export function ContactActions({ contact }: { readonly contact: Contact }) {
  const navigate = useNavigate();
  const remove = useAtomSet(deleteContactAtom, { mode: "promiseExit" });

  const onDelete = async () => {
    const exit = await remove(contact.id);
    if (Exit.isSuccess(exit)) {
      notify({ title: "Contact deleted", description: contact.fullName });
      void navigate({ to: "/contacts" });
    }
  };

  return (
    <>
      <ContactFormDialog
        contact={contact}
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
              Delete contact
            </MenuItem>
          }
          title={`Delete ${contact.fullName}?`}
          description="Their activity history will be deleted too. Deals stay, without a contact. This can't be undone."
          confirmLabel="Delete contact"
          destructive
          onConfirm={() => void onDelete()}
        />
      </Menu>
    </>
  );
}
