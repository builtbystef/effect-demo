import type { Activity, DashboardSummary } from "@app/domain";
import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AsyncResult } from "effect/reactivity";
import { Building2, CircleDollarSign, History, Trophy, Users } from "lucide-react";
import { useMemo } from "react";
import { AsyncView } from "#/components/async-view.tsx";
import { Page, PageHeader } from "#/components/layout/page-header.tsx";
import { Card, CardHeader } from "#/components/ui/card.tsx";
import { EmptyState, Skeleton } from "#/components/ui/feedback.tsx";
import { activityKinds } from "#/features/activities/activity-kind.tsx";
import { useCompanyNames } from "#/features/companies/use-company-options.ts";
import { contactsAtom } from "#/features/contacts/api.ts";
import { dashboardAtom } from "#/features/dashboard/api.ts";
import { PipelineChart } from "#/features/dashboard/pipeline-chart.tsx";
import { StatCard } from "#/features/dashboard/stat-card.tsx";
import { cn } from "#/lib/cn.ts";
import { formatMoney, formatRelative } from "#/lib/format.ts";

export const Route = createFileRoute("/")({ component: DashboardPage });

const today = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
}).format(new Date());

function DashboardPage() {
  const result = useAtomValue(dashboardAtom);
  const refresh = useAtomRefresh(dashboardAtom);
  return (
    <Page>
      <PageHeader title="Dashboard" description={today} />
      <AsyncView result={result} onRetry={refresh} loading={<DashboardSkeleton />}>
        {(summary) => <Dashboard summary={summary} />}
      </AsyncView>
    </Page>
  );
}

function Dashboard({ summary }: { readonly summary: DashboardSummary }) {
  const won = summary.stages.find((s) => s.stage === "won");
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open pipeline"
          icon={CircleDollarSign}
          value={formatMoney(summary.pipelineValue)}
          hint={`${summary.openDeals} open ${summary.openDeals === 1 ? "deal" : "deals"}`}
        />
        <StatCard
          label="Won"
          icon={Trophy}
          value={formatMoney(summary.wonValue)}
          hint={`${won?.count ?? 0} closed ${won?.count === 1 ? "deal" : "deals"}`}
        />
        <StatCard label="Contacts" icon={Users} value={summary.contacts} />
        <StatCard label="Companies" icon={Building2} value={summary.companies} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pipeline by stage"
            description="Total deal value in each stage"
            actions={
              <Link to="/deals" className="text-[13px] font-medium text-primary hover:underline">
                Open board
              </Link>
            }
          />
          <PipelineChart stages={summary.stages} />
        </Card>
        <Card>
          <CardHeader
            title="Recent activity"
            description="The latest calls, emails, meetings and notes"
          />
          <RecentActivity activities={summary.recentActivity} />
        </Card>
      </div>
    </div>
  );
}

function RecentActivity({ activities }: { readonly activities: ReadonlyArray<Activity> }) {
  const contacts = useAtomValue(contactsAtom);
  const companyNames = useCompanyNames();
  const contactNames = useMemo(
    () =>
      new Map(AsyncResult.getOrElse(contacts, () => []).map((c) => [c.id, c.fullName] as const)),
    [contacts],
  );

  if (activities.length === 0) {
    return <EmptyState icon={History} title="Nothing logged yet" className="py-8" />;
  }

  return (
    <ul className="flex flex-col px-2 pb-2">
      {activities.map((activity) => {
        const { label, icon: Icon, tone } = activityKinds[activity.kind];
        return (
          <li key={activity.id} className="flex gap-3 rounded-lg px-2 py-2.5">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full bg-tone/12 text-tone-fg",
                `tone-${tone}`,
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-fg">{activity.body}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-fg-subtle">
                <span>{label}</span>
                {activity.contactId !== null && contactNames.has(activity.contactId) ? (
                  <>
                    <span aria-hidden>·</span>
                    <Link
                      to="/contacts/$contactId"
                      params={{ contactId: activity.contactId }}
                      className="font-medium text-fg-muted hover:text-fg hover:underline"
                    >
                      {contactNames.get(activity.contactId)}
                    </Link>
                  </>
                ) : activity.companyId !== null && companyNames.has(activity.companyId) ? (
                  <>
                    <span aria-hidden>·</span>
                    <Link
                      to="/companies/$companyId"
                      params={{ companyId: activity.companyId }}
                      className="font-medium text-fg-muted hover:text-fg hover:underline"
                    >
                      {companyNames.get(activity.companyId)}
                    </Link>
                  </>
                ) : null}
                <span aria-hidden>·</span>
                <span>{formatRelative(activity.createdAt)}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex flex-col gap-3 p-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-72" />
        <Card className="h-72" />
      </div>
    </div>
  );
}
