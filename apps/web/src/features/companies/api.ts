import type { CompanyId, CompanyInput, CompanyPatch } from "@app/domain";
import { Atom } from "effect/reactivity";
import { allKeys, CrmClient, keys, mutation } from "#/lib/api.ts";

export const companiesAtom = CrmClient.query("companies", "list", {
  reactivityKeys: [keys.companies],
});

export const companyAtom = Atom.family((id: CompanyId) =>
  CrmClient.query("companies", "get", { params: { id }, reactivityKeys: [keys.companies] }),
);

export const createCompanyAtom = mutation(
  { invalidates: [keys.companies, keys.dashboard], errorTitle: "Couldn't create company" },
  (client, payload: CompanyInput) => client.companies.create({ payload }),
);

export const updateCompanyAtom = mutation(
  { invalidates: [keys.companies], errorTitle: "Couldn't save company" },
  (client, { id, patch }: { readonly id: CompanyId; readonly patch: CompanyPatch }) =>
    client.companies.update({ params: { id }, payload: patch }),
);

/** Contacts and deals keep existing but lose their company, so refresh everything. */
export const deleteCompanyAtom = mutation(
  { invalidates: allKeys, errorTitle: "Couldn't delete company" },
  (client, id: CompanyId) => client.companies.remove({ params: { id } }),
);
