import type { DealId, DealInput, DealPatch } from "@app/domain";
import { allKeys, CrmClient, keys, mutation } from "#/lib/api.ts";

export const dealsAtom = CrmClient.query("deals", "list", { reactivityKeys: [keys.deals] });

// Company rows show open pipeline value, so deal writes refresh companies too.
const touches = [keys.deals, keys.companies, keys.dashboard];

export const createDealAtom = mutation(
  { invalidates: touches, errorTitle: "Couldn't create deal" },
  (client, payload: DealInput) => client.deals.create({ payload }),
);

export const updateDealAtom = mutation(
  { invalidates: touches, errorTitle: "Couldn't save deal" },
  (client, { id, patch }: { readonly id: DealId; readonly patch: DealPatch }) =>
    client.deals.update({ params: { id }, payload: patch }),
);

export const deleteDealAtom = mutation(
  { invalidates: allKeys, errorTitle: "Couldn't delete deal" },
  (client, id: DealId) => client.deals.remove({ params: { id } }),
);
