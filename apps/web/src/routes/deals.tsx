import { isOpenStage } from "@app/domain";
import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AsyncView } from "#/components/async-view.tsx";
import { Page, PageHeader } from "#/components/layout/page-header.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Skeleton } from "#/components/ui/feedback.tsx";
import { dealsAtom } from "#/features/deals/api.ts";
import { DealFormDialog } from "#/features/deals/deal-form.tsx";
import { PipelineBoard } from "#/features/deals/pipeline-board.tsx";
import { formatMoney } from "#/lib/format.ts";

export const Route = createFileRoute("/deals")({ component: DealsPage });

function DealsPage() {
  const result = useAtomValue(dealsAtom);
  const refresh = useAtomRefresh(dealsAtom);
  return (
    <Page wide fill>
      <AsyncView result={result} onRetry={refresh} loading={<BoardSkeleton />}>
        {(deals) => {
          const open = deals.filter((deal) => isOpenStage(deal.stage));
          const value = open.reduce((sum, deal) => sum + deal.value, 0);
          return (
            <>
              <PageHeader
                title="Deals"
                description={`${open.length} open · ${formatMoney(value)} in pipeline. Drag cards between stages.`}
                actions={
                  <DealFormDialog
                    trigger={
                      <Button variant="primary">
                        <Plus />
                        New deal
                      </Button>
                    }
                  />
                }
              />
              <PipelineBoard deals={deals} />
            </>
          );
        }}
      </AsyncView>
    </Page>
  );
}

function BoardSkeleton() {
  return (
    <div aria-busy aria-label="Loading deals">
      <Skeleton className="mb-8 h-6 w-40" />
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-surface-muted/60 p-2"
          >
            <Skeleton className="m-1.5 h-4 w-24" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
