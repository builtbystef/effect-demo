import { CrmClient, keys } from "#/lib/api.ts";

export const dashboardAtom = CrmClient.query("dashboard", "summary", {
  reactivityKeys: [keys.dashboard],
});
