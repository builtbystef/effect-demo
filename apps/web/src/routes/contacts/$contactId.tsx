import { type Contact, ContactId } from "@app/domain";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Option, Schema } from "effect";
import { AsyncResult } from "effect/reactivity";
import { Ellipsis, Pencil, Plus, Trash2, UserX } from "lucide-react";
import { AsyncView } from "#/components/async-view.tsx";
import { DetailSkeleton } from "#/components/detail-skeleton.tsx";
import { Page, PageHeader } from "#/components/layout/page-header.tsx";
import { Avatar } from "#/components/ui/avatar.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardHeader } from "#/components/ui/card.tsx";
import { ConfirmDialog } from "#/components/ui/confirm-dialog.tsx";
import { DescriptionList } from "#/components/ui/description-list.tsx";
import { EmptyState, ErrorState } from "#/components/ui/feedback.tsx";
import { Menu, MenuItem } from "#/components/ui/menu.tsx";
import { notify } from "#/components/ui/toast.tsx";
import { ActivityTimeline } from "#/features/activities/activity-timeline.tsx";
import { useCompanyNames } from "#/features/companies/use-company-options.ts";
import { contactAtom, deleteContactAtom } from "#/features/contacts/api.ts";
import { ContactFormDialog } from "#/features/contacts/contact-form.tsx";
import { ContactStatusBadge } from "#/features/contacts/contact-status.tsx";
import { dealsAtom } from "#/features/deals/api.ts";
import { DealFormDialog } from "#/features/deals/deal-form.tsx";
import { DealList } from "#/features/deals/deal-list.tsx";
import { formatDate } from "#/lib/format.ts";

export const Route = createFileRoute("/contacts/$contactId")({ component: ContactPage });

function ContactPage() {
  const { contactId } = Route.useParams();
  const id = Schema.decodeUnknownOption(ContactId)(contactId);
  return <Page>{Option.isNone(id) ? <ContactNotFound /> : <ContactLoader id={id.value} />}</Page>;
}

function ContactLoader({ id }: { readonly id: ContactId }) {
  const result = useAtomValue(contactAtom(id));
  return (
    <AsyncView
      result={result}
      loading={<DetailSkeleton />}
      failure={(error) => (error._tag === "NotFound" ? <ContactNotFound /> : <ErrorState />)}
    >
      {(contact) => <ContactDetail contact={contact} />}
    </AsyncView>
  );
}

function ContactDetail({ contact }: { readonly contact: Contact }) {
  const navigate = useNavigate();
  const remove = useAtomSet(deleteContactAtom, { mode: "promiseExit" });
  const companyNames = useCompanyNames();
  const companyName = contact.companyId === null ? null : companyNames.get(contact.companyId);
  const deals = AsyncResult.getOrElse(useAtomValue(dealsAtom), () => []).filter(
    (deal) => deal.contactId === contact.id,
  );

  const onDelete = async () => {
    const exit = await remove(contact.id);
    if (exit._tag === "Success") {
      notify({ title: "Contact deleted", description: contact.fullName });
      void navigate({ to: "/contacts" });
    }
  };

  const company =
    contact.companyId !== null && companyName !== undefined ? (
      <Link
        to="/companies/$companyId"
        params={{ companyId: contact.companyId }}
        className="font-medium text-fg hover:underline"
      >
        {companyName}
      </Link>
    ) : null;

  return (
    <>
      <PageHeader
        back={{ label: "Contacts", to: "/contacts" }}
        leading={<Avatar name={contact.fullName} size="lg" />}
        title={contact.fullName}
        description={
          <span className="flex flex-wrap items-center gap-x-1.5">
            {contact.title}
            {contact.title !== null && company !== null && <span>at</span>}
            {company}
          </span>
        }
        actions={
          <>
            <ContactFormDialog
              contact={contact}
              trigger={
                <Button>
                  <Pencil />
                  Edit
                </Button>
              }
            />
            <Menu
              trigger={
                <Button size="icon" aria-label="More actions">
                  <Ellipsis />
                </Button>
              }
            >
              <ConfirmDialog
                trigger={
                  <MenuItem destructive closeOnClick={false}>
                    <Trash2 />
                    Delete contact
                  </MenuItem>
                }
                title={`Delete ${contact.fullName}?`}
                description="Their activity history will be deleted too. Deals stay, without a contact. This can't be undone."
                confirmLabel="Delete contact"
                destructive
                onConfirm={() => void onDelete()}
              />
            </Menu>
          </>
        }
      />
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Details" />
            <div className="px-4 pb-4">
              <DescriptionList
                items={[
                  { label: "Status", value: <ContactStatusBadge status={contact.status} /> },
                  {
                    label: "Email",
                    value: contact.email && (
                      <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                        {contact.email}
                      </a>
                    ),
                  },
                  {
                    label: "Phone",
                    value: contact.phone && (
                      <a href={`tel:${contact.phone}`} className="hover:underline">
                        {contact.phone}
                      </a>
                    ),
                  },
                  { label: "Company", value: company },
                  { label: "Added", value: formatDate(contact.createdAt) },
                ]}
              />
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Deals"
              actions={
                <DealFormDialog
                  defaults={{
                    contactId: contact.id,
                    ...(contact.companyId !== null && { companyId: contact.companyId }),
                  }}
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Plus />
                      Add
                    </Button>
                  }
                />
              }
            />
            <DealList deals={deals} />
          </Card>
        </div>
        <Card>
          <CardHeader title="Activity" />
          <ActivityTimeline
            filter={{ contactId: contact.id }}
            links={{ contactId: contact.id, companyId: contact.companyId, dealId: null }}
          />
        </Card>
      </div>
    </>
  );
}

function ContactNotFound() {
  return (
    <EmptyState
      icon={UserX}
      title="Contact not found"
      description="It may have been deleted."
      action={
        <Link to="/contacts" className="text-sm font-medium text-primary hover:underline">
          Back to contacts
        </Link>
      }
    />
  );
}
