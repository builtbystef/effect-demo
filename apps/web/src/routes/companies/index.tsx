import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";
import { Building2, Plus } from "lucide-react";
import { AsyncView } from "#/components/async-view.tsx";
import { Page, PageHeader } from "#/components/layout/page-header.tsx";
import { TableSkeleton } from "#/components/table-skeleton.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Card } from "#/components/ui/card.tsx";
import { EmptyState } from "#/components/ui/feedback.tsx";
import { SearchInput } from "#/components/ui/search-input.tsx";
import { companiesAtom } from "#/features/companies/api.ts";
import { CompaniesTable } from "#/features/companies/companies-table.tsx";
import { CompanyFormDialog } from "#/features/companies/company-form.tsx";
import { compact } from "#/lib/search.ts";

const CompaniesSearch = Schema.Struct({ q: Schema.optionalKey(Schema.String) });

export const Route = createFileRoute("/companies/")({
  validateSearch: Schema.toStandardSchemaV1(CompaniesSearch),
  component: CompaniesPage,
});

function CompaniesPage() {
  const result = useAtomValue(companiesAtom);
  const refresh = useAtomRefresh(companiesAtom);
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const newCompany = (
    <CompanyFormDialog
      trigger={
        <Button variant="primary">
          <Plus />
          New company
        </Button>
      }
      onCreated={(company) =>
        void navigate({ to: "/companies/$companyId", params: { companyId: company.id } })
      }
    />
  );

  return (
    <Page>
      <PageHeader
        title="Companies"
        description="The organizations you do business with."
        actions={newCompany}
      />
      <Card>
        <div className="border-b border-border p-3">
          <SearchInput
            value={q}
            onValueChange={(value) =>
              void navigate({ search: compact({ q: value || undefined }), replace: true })
            }
            placeholder="Search companies"
            className="w-full sm:w-72"
          />
        </div>
        <AsyncView result={result} onRetry={refresh} loading={<TableSkeleton />}>
          {(companies) =>
            companies.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No companies yet"
                description="Add a company to group its contacts and deals."
                action={newCompany}
              />
            ) : (
              <CompaniesTable companies={companies} search={q} />
            )
          }
        </AsyncView>
      </Card>
    </Page>
  );
}
