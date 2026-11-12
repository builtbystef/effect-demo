import type { DashboardSummary } from "@app/domain";
import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CircleDollarSign, Trophy, Users } from "lucide-react";
import { AsyncView } from "#/components/async-view.tsx";
import { Page, PageHeader } from "#/components/layout/page-header.tsx";
import { Card, CardHeader } from "#/components/ui/card.tsx";
import { Skeleton } from "#/components/ui/feedback.tsx";
import { RecentActivity } from "#/features/activities/recent-activity.tsx";
import { dashboardAtom } from "#/features/dashboard/api.ts";
import { PipelineChart } from "#/features/dashboard/pipeline-chart.tsx";
import { StatCard } from "#/features/dashboard/stat-card.tsx";
import { formatMoney } from "#/lib/format.ts";

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
