import type { Contact } from "@app/domain";
import { Link, useNavigate } from "@tanstack/react-router";
import { DateTime } from "effect";
import { useMemo } from "react";
import { Avatar } from "#/components/ui/avatar.tsx";
import { columnHelper, DataTable } from "#/components/ui/data-table.tsx";
import { formatDate } from "#/lib/format.ts";
import { useCompanyNames } from "../companies/use-company-options.ts";
import { ContactStatusBadge } from "./contact-status.tsx";

/** A contact joined with its company's name, so that column can sort and search by name. */
interface ContactRow {
  readonly contact: Contact;
  readonly companyName: string;
}

const column = columnHelper<ContactRow>();

// Module-level so the table sees stable column definitions.
const columns = [
  column.accessor((r) => r.contact.fullName, {
    id: "name",
    header: "Name",
    sortFn: "text",
    cell: ({ row: { original } }) => (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={original.contact.fullName} />
        <div className="min-w-0">
          <Link
            to="/contacts/$contactId"
            params={{ contactId: original.contact.id }}
            onClick={(event) => event.stopPropagation()}
            className="block truncate font-medium text-fg hover:underline"
          >
            {original.contact.fullName}
          </Link>
          {original.contact.title !== null && (
            <p className="truncate text-xs text-fg-muted">{original.contact.title}</p>
          )}
        </div>
      </div>
    ),
  }),
  column.accessor("companyName", {
    header: "Company",
    sortFn: "text",
    cell: ({ row: { original } }) =>
      original.contact.companyId === null || original.companyName === "" ? (
        <span className="text-fg-subtle">—</span>
      ) : (
        <Link
          to="/companies/$companyId"
          params={{ companyId: original.contact.companyId }}
          onClick={(event) => event.stopPropagation()}
          className="text-fg-muted hover:text-fg hover:underline"
        >
          {original.companyName}
        </Link>
      ),
  }),
  column.accessor((r) => r.contact.email ?? "", {
    id: "email",
    header: "Email",
    sortFn: "text",
    cell: ({ getValue }) => <span className="text-fg-muted">{getValue() || "—"}</span>,
  }),
  column.accessor((r) => r.contact.status, {
    id: "status",
    header: "Status",
    cell: ({ row: { original } }) => <ContactStatusBadge status={original.contact.status} />,
  }),
  column.accessor((r) => DateTime.toEpochMillis(r.contact.createdAt), {
    id: "createdAt",
    header: "Added",
    sortFn: "basic",
    enableGlobalFilter: false,
    cell: ({ row: { original } }) => (
      <span className="text-fg-muted">{formatDate(original.contact.createdAt)}</span>
    ),
  }),
];

export function ContactsTable({
  contacts,
  search,
}: {
  readonly contacts: ReadonlyArray<Contact>;
  readonly search: string;
}) {
  const navigate = useNavigate();
  const companyNames = useCompanyNames();
  const rows = useMemo(
    () =>
      contacts.map((contact) => ({
        contact,
        companyName: contact.companyId === null ? "" : (companyNames.get(contact.companyId) ?? ""),
      })),
    [contacts, companyNames],
  );

  return (
    <DataTable
      aria-label="Contacts"
      data={rows}
      columns={columns}
      getRowId={(row) => row.contact.id}
      search={search}
      initialSorting={[{ id: "name", desc: false }]}
      onRowClick={(row) =>
        void navigate({ to: "/contacts/$contactId", params: { contactId: row.contact.id } })
      }
      noResults="No contacts match your search."
    />
  );
}
