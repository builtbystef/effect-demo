import type { ActivityFilter, ActivityId, ActivityInput } from "@app/domain";
import { Atom } from "effect/reactivity";
import { CrmClient, keys, mutation } from "#/lib/api.ts";

/**
 * One timeline per record. Families cache by key, so the filter is encoded as
 * a string: a fresh object per render would mean a fresh atom per render.
 */
const timeline = Atom.family((key: string) =>
  CrmClient.query("activities", "list", {
    query: JSON.parse(key) as ActivityFilter,
    reactivityKeys: [keys.activities],
  }),
);

export const activitiesAtom = (filter: ActivityFilter) => timeline(JSON.stringify(filter));

export const createActivityAtom = mutation(
  { invalidates: [keys.activities, keys.dashboard], errorTitle: "Couldn't log activity" },
  (client, payload: ActivityInput) => client.activities.create({ payload }),
);

export const deleteActivityAtom = mutation(
  { invalidates: [keys.activities, keys.dashboard], errorTitle: "Couldn't delete activity" },
  (client, id: ActivityId) => client.activities.remove({ params: { id } }),
);
