import { ContactStatus } from "@app/domain";
import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";
import { Plus, Users } from "lucide-react";
import { AsyncView } from "#/components/async-view.tsx";
import { Page, PageHeader } from "#/components/layout/page-header.tsx";
import { TableSkeleton } from "#/components/table-skeleton.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card } from "#/components/ui/card.tsx";
import { EmptyState } from "#/components/ui/feedback.tsx";
import { SearchInput } from "#/components/ui/search-input.tsx";
import { Select } from "#/components/ui/select.tsx";
import { contactsAtom } from "#/features/contacts/api.ts";
import { ContactFormDialog } from "#/features/contacts/contact-form.tsx";
import { contactStatusOptions } from "#/features/contacts/contact-status.tsx";
import { ContactsTable } from "#/features/contacts/contacts-table.tsx";
import { compact } from "#/lib/search.ts";

// Search and filter live in the URL, so a filtered list can be shared or
// bookmarked, and survives a reload.
const ContactsSearch = Schema.Struct({
  q: Schema.optionalKey(Schema.String),
  status: Schema.optionalKey(ContactStatus),
});

export const Route = createFileRoute("/contacts/")({
  validateSearch: Schema.toStandardSchemaV1(ContactsSearch),
  component: ContactsPage,
});

const statusFilterOptions = [
  { value: "all" as const, label: "All statuses" },
  ...contactStatusOptions,
];

function ContactsPage() {
  const result = useAtomValue(contactsAtom);
  const refresh = useAtomRefresh(contactsAtom);
  const { q = "", status } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const newContact = (
    <ContactFormDialog
      trigger={
        <Button variant="primary">
          <Plus />
          New contact
        </Button>
      }
      onCreated={(contact) =>
        void navigate({ to: "/contacts/$contactId", params: { contactId: contact.id } })
      }
    />
  );

  return (
    <Page>
      <PageHeader title="Contacts" description="Everyone you're talking to." actions={newContact} />
      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <SearchInput
            value={q}
            onValueChange={(value) =>
              void navigate({
                search: (prev) => compact({ ...prev, q: value || undefined }),
                replace: true,
              })
            }
            placeholder="Search contacts"
            className="w-full sm:w-72"
          />
          <Select
            aria-label="Filter by status"
            options={statusFilterOptions}
            value={status ?? "all"}
            onValueChange={(value) =>
              void navigate({
                search: (prev) => compact({ ...prev, status: value === "all" ? undefined : value }),
                replace: true,
              })
            }
            className="w-40"
          />
        </div>
        <AsyncView result={result} onRetry={refresh} loading={<TableSkeleton />}>
          {(contacts) =>
            contacts.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No contacts yet"
                description="Add the people you sell to and keep track of every conversation."
                action={newContact}
              />
            ) : (
              <ContactsTable
                contacts={
                  status === undefined ? contacts : contacts.filter((c) => c.status === status)
                }
                search={q}
              />
            )
          }
        </AsyncView>
      </Card>
    </Page>
  );
}
