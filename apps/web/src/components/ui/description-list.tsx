import type { ReactNode } from "react";

export interface DescriptionItem {
  readonly label: string;
  readonly value: ReactNode;
}

/** Label/value pairs for a record's details. Empty values show a dash. */
export function DescriptionList({ items }: { readonly items: ReadonlyArray<DescriptionItem> }) {
  return (
    <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-3 text-sm">
      {items.map(({ label, value }) => (
        <div key={label} className="contents">
          <dt className="text-fg-muted">{label}</dt>
          <dd className="min-w-0 truncate text-fg">
            {value === null || value === undefined || value === "" ? (
              <span className="text-fg-subtle">—</span>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
