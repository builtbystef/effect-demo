import {
  type ColumnDef,
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  type RowData,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  type SortingState,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "#/lib/cn.ts";

/**
 * The table features every list in the app shares: click-to-sort headers and
 * a global text search. Registering them once keeps column definitions typed
 * against exactly these features.
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, text: sortFn_text },
  filterFns: { includesString: filterFn_includesString },
});

export type DataTableFeatures = typeof dataTableFeatures;
export type DataTableColumn<T extends RowData> = ColumnDef<DataTableFeatures, T, any>;

export const columnHelper = <T extends RowData>() => createColumnHelper<DataTableFeatures, T>();

export interface DataTableProps<T extends RowData> {
  readonly data: ReadonlyArray<T>;
  readonly columns: ReadonlyArray<DataTableColumn<T>>;
  readonly getRowId: (row: T) => string;
  /** Free-text filter across every searchable column. */
  readonly search?: string;
  readonly initialSorting?: SortingState;
  readonly onRowClick?: (row: T) => void;
  /** Shown when nothing matches the search. */
  readonly noResults?: ReactNode;
  readonly "aria-label": string;
}

export function DataTable<T extends RowData>({
  data,
  columns,
  getRowId,
  search = "",
  initialSorting = [],
  onRowClick,
  noResults = "No results.",
  ...props
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const table = useTable({
    features: dataTableFeatures,
    columns: columns as Array<DataTableColumn<T>>,
    data: data as Array<T>,
    getRowId,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    globalFilterFn: "includesString",
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-separate border-spacing-0 text-sm"
        aria-label={props["aria-label"]}
      >
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const canSort = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                    }
                    className="sticky top-0 z-10 h-9 border-b border-border bg-surface px-3 text-left text-xs font-medium whitespace-nowrap text-fg-muted first:pl-4 last:pr-4"
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="-mx-1.5 inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 outline-none hover:bg-surface-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <table.FlexRender header={header} />
                        {sorted === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-fg-muted">
                {noResults}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick === undefined ? undefined : () => onRowClick(row.original)}
                className={cn(
                  "group transition-colors hover:bg-surface-hover",
                  onRowClick !== undefined && "cursor-pointer",
                )}
              >
                {row.getAllCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="h-12 border-b border-border px-3 whitespace-nowrap text-fg first:pl-4 last:pr-4 group-last:border-b-0"
                  >
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
