import { type Contact, ContactId } from "@app/domain";
import { useAtomValue } from "@effect/atom-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Option, Schema } from "effect";
import { AsyncResult } from "effect/reactivity";
import { Plus, UserX } from "lucide-react";
import { AsyncView } from "#/components/async-view.tsx";
import { DetailSkeleton } from "#/components/detail-skeleton.tsx";
import { Page, PageHeader } from "#/components/layout/page-header.tsx";
import { Avatar } from "#/components/ui/avatar.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card, CardHeader } from "#/components/ui/card.tsx";
import { DescriptionList } from "#/components/ui/description-list.tsx";
import { EmptyState, ErrorState } from "#/components/ui/feedback.tsx";
import { ActivityTimeline } from "#/features/activities/activity-timeline.tsx";
import { useCompanyNames } from "#/features/companies/use-company-options.ts";
import { contactAtom } from "#/features/contacts/api.ts";
import { ContactActions } from "#/features/contacts/contact-actions.tsx";
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
  const companyNames = useCompanyNames();
  const companyName = contact.companyId === null ? null : companyNames.get(contact.companyId);
  const deals = AsyncResult.getOrElse(useAtomValue(dealsAtom), () => []).filter(
    (deal) => deal.contactId === contact.id,
  );

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
        actions={<ContactActions contact={contact} />}
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
