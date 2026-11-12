import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useMemo } from "react";
import { contactsAtom } from "./api.ts";

/** Contacts as `<Select>` options, with a leading "No contact". */
export function useContactOptions() {
  const result = useAtomValue(contactsAtom);
  return useMemo(
    () => [
      { value: "", label: "No contact" },
      ...AsyncResult.getOrElse(result, () => []).map((contact) => ({
        value: contact.id as string,
        label: contact.fullName,
      })),
    ],
    [result],
  );
}

/** Look up contact names by id, for showing who a deal or activity is with. */
export function useContactNames(): ReadonlyMap<string, string> {
  const result = useAtomValue(contactsAtom);
  return useMemo(
    () => new Map(AsyncResult.getOrElse(result, () => []).map((c) => [c.id, c.fullName] as const)),
    [result],
  );
}
