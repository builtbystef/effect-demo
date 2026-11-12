import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { useMemo } from "react";
import { companiesAtom } from "./api.ts";

/** Companies as `<Select>` options, with a leading "No company". */
export function useCompanyOptions() {
  const result = useAtomValue(companiesAtom);
  return useMemo(
    () => [
      { value: "", label: "No company" },
      ...AsyncResult.getOrElse(result, () => []).map((company) => ({
        value: company.id as string,
        label: company.name,
      })),
    ],
    [result],
  );
}

/** Look up company names by id, for showing a contact's or deal's company. */
export function useCompanyNames(): ReadonlyMap<string, string> {
  const result = useAtomValue(companiesAtom);
  return useMemo(
    () => new Map(AsyncResult.getOrElse(result, () => []).map((c) => [c.id, c.name] as const)),
    [result],
  );
}
