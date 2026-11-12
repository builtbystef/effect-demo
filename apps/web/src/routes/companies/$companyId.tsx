import { type Company, CompanyId } from "@app/domain";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Option, Schema } from "effect";
import { AsyncResult } from "effect/reactivity";
import { Building2, Ellipsis, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { companyAtom, deleteCompanyAtom } from "#/features/companies/api.ts";
import { CompanyFormDialog } from "#/features/companies/company-form.tsx";
import { contactsAtom } from "#/features/contacts/api.ts";
import { ContactFormDialog } from "#/features/contacts/contact-form.tsx";
import { ContactStatusBadge } from "#/features/contacts/contact-status.tsx";
import { dealsAtom } from "#/features/deals/api.ts";
import { DealFormDialog } from "#/features/deals/deal-form.tsx";
import { DealList } from "#/features/deals/deal-list.tsx";
import { formatDate, formatDomain } from "#/lib/format.ts";

export const Route = createFileRoute("/companies/$companyId")({ component: CompanyPage });

function CompanyPage() {
  const { companyId } = Route.useParams();
  const id = Schema.decodeUnknownOption(CompanyId)(companyId);
  return <Page>{Option.isNone(id) ? <CompanyNotFound /> : <CompanyLoader id={id.value} />}</Page>;
}

function CompanyLoader({ id }: { readonly id: CompanyId }) {
  const result = useAtomValue(companyAtom(id));
  return (
    <AsyncView
      result={result}
      loading={<DetailSkeleton />}
      failure={(error) => (error._tag === "NotFound" ? <CompanyNotFound /> : <ErrorState />)}
    >
      {(company) => <CompanyDetail company={company} />}
    </AsyncView>
  );
}

function CompanyDetail({ company }: { readonly company: Company }) {
  const navigate = useNavigate();
  const remove = useAtomSet(deleteCompanyAtom, { mode: "promiseExit" });
  const contacts = AsyncResult.getOrElse(useAtomValue(contactsAtom), () => []).filter(
    (contact) => contact.companyId === company.id,
  );
  const deals = AsyncResult.getOrElse(useAtomValue(dealsAtom), () => []).filter(
    (deal) => deal.companyId === company.id,
  );

  const onDelete = async () => {
    const exit = await remove(company.id);
    if (exit._tag === "Success") {
      notify({ title: "Company deleted", description: company.name });
      void navigate({ to: "/companies" });
    }
  };

  const website =
    company.domain === null ? null : (
      <a
        href={/^https?:\/\//.test(company.domain) ? company.domain : `https://${company.domain}`}
        target="_blank"
        rel="noreferrer"
        className="text-primary hover:underline"
      >
        {formatDomain(company.domain)}
      </a>
    );

  return (
    <>
      <PageHeader
        back={{ label: "Companies", to: "/companies" }}
        leading={<Avatar name={company.name} size="lg" shape="square" />}
        title={company.name}
        description={company.industry ?? undefined}
        actions={
          <>
            <CompanyFormDialog
              company={company}
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
                    Delete company
                  </MenuItem>
                }
                title={`Delete ${company.name}?`}
                description="Its activity history will be deleted. Contacts and deals stay, without a company. This can't be undone."
                confirmLabel="Delete company"
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
                  { label: "Website", value: website },
                  { label: "Industry", value: company.industry },
                  { label: "Added", value: formatDate(company.createdAt) },
                ]}
              />
            </div>
          </Card>
          <Card>
            <CardHeader
              title="People"
              description={`${contacts.length} ${contacts.length === 1 ? "contact" : "contacts"}`}
              actions={
                <ContactFormDialog
                  defaultCompanyId={company.id}
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Plus />
                      Add
                    </Button>
                  }
                />
              }
            />
            {contacts.length === 0 ? (
              <EmptyState icon={Users} title="No contacts yet" className="py-8" />
            ) : (
              <ul className="divide-y divide-border">
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <Link
                      to="/contacts/$contactId"
                      params={{ contactId: contact.id }}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover"
                    >
                      <Avatar name={contact.fullName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{contact.fullName}</p>
                        {contact.title !== null && (
                          <p className="truncate text-xs text-fg-muted">{contact.title}</p>
                        )}
                      </div>
                      <ContactStatusBadge status={contact.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader
              title="Deals"
              actions={
                <DealFormDialog
                  defaults={{ companyId: company.id }}
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
            filter={{ companyId: company.id }}
            links={{ contactId: null, companyId: company.id, dealId: null }}
          />
        </Card>
      </div>
    </>
  );
}

function CompanyNotFound() {
  return (
    <EmptyState
      icon={Building2}
      title="Company not found"
      description="It may have been deleted."
      action={
        <Link to="/companies" className="text-sm font-medium text-primary hover:underline">
          Back to companies
        </Link>
      }
    />
  );
}
