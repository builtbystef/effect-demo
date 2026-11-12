import type { CompanySummary } from "@app/domain";
import { Link, useNavigate } from "@tanstack/react-router";
import { Avatar } from "#/components/ui/avatar.tsx";
import { columnHelper, DataTable } from "#/components/ui/data-table.tsx";
import { formatDomain, formatMoney } from "#/lib/format.ts";

const column = columnHelper<CompanySummary>();

const columns = [
  column.accessor("name", {
    header: "Name",
    sortFn: "text",
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={row.original.name} shape="square" />
        <div className="min-w-0">
          <Link
            to="/companies/$companyId"
            params={{ companyId: row.original.id }}
            onClick={(event) => event.stopPropagation()}
            className="block truncate font-medium text-fg hover:underline"
          >
            {row.original.name}
          </Link>
          {row.original.domain !== null && (
            <p className="truncate text-xs text-fg-muted">{formatDomain(row.original.domain)}</p>
          )}
        </div>
      </div>
    ),
  }),
  column.accessor((c) => c.industry ?? "", {
    id: "industry",
    header: "Industry",
    sortFn: "text",
    cell: ({ getValue }) => <span className="text-fg-muted">{getValue() || "—"}</span>,
  }),
  column.accessor("contactCount", {
    header: "Contacts",
    sortFn: "basic",
    enableGlobalFilter: false,
    cell: ({ getValue }) => <span className="text-fg-muted tabular-nums">{getValue()}</span>,
  }),
  column.accessor("openDealValue", {
    header: "Open pipeline",
    sortFn: "basic",
    enableGlobalFilter: false,
    cell: ({ getValue }) => (
      <span className="font-medium text-fg tabular-nums">{formatMoney(getValue())}</span>
    ),
  }),
];

export function CompaniesTable({
  companies,
  search,
}: {
  readonly companies: ReadonlyArray<CompanySummary>;
  readonly search: string;
}) {
  const navigate = useNavigate();
  return (
    <DataTable
      aria-label="Companies"
      data={companies}
      columns={columns}
      getRowId={(company) => company.id}
      search={search}
      initialSorting={[{ id: "name", desc: false }]}
      onRowClick={(company) =>
        void navigate({ to: "/companies/$companyId", params: { companyId: company.id } })
      }
      noResults="No companies match your search."
    />
  );
}
