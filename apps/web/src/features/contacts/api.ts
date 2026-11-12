import type { ContactId, ContactInput, ContactPatch } from "@app/domain";
import { Atom } from "effect/reactivity";
import { allKeys, CrmClient, keys, mutation } from "#/lib/api.ts";

export const contactsAtom = CrmClient.query("contacts", "list", {
  reactivityKeys: [keys.contacts],
});

export const contactAtom = Atom.family((id: ContactId) =>
  CrmClient.query("contacts", "get", { params: { id }, reactivityKeys: [keys.contacts] }),
);

// Company rows show a contact count, so contact writes refresh companies too.
export const createContactAtom = mutation(
  {
    invalidates: [keys.contacts, keys.companies, keys.dashboard],
    errorTitle: "Couldn't create contact",
  },
  (client, payload: ContactInput) => client.contacts.create({ payload }),
);

export const updateContactAtom = mutation(
  { invalidates: [keys.contacts, keys.companies], errorTitle: "Couldn't save contact" },
  (client, { id, patch }: { readonly id: ContactId; readonly patch: ContactPatch }) =>
    client.contacts.update({ params: { id }, payload: patch }),
);

export const deleteContactAtom = mutation(
  { invalidates: allKeys, errorTitle: "Couldn't delete contact" },
  (client, id: ContactId) => client.contacts.remove({ params: { id } }),
);
