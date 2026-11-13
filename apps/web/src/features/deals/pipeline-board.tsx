import { type Deal, type DealId, type DealStage, dealStages } from "@app/domain";
import { useAtomSet } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Plus } from "lucide-react";
import { type DragEvent, useState } from "react";
import { Button } from "#/components/ui/button.tsx";
import { cn } from "#/lib/cn.ts";
import { formatCalendarDate, formatMoney, formatMoneyCompact } from "#/lib/format.ts";
import { useCompanyNames } from "../companies/use-company-options.ts";
import { updateDealAtom } from "./api.ts";
import { BoardScroller } from "./board-scroller.tsx";
import { DealActions } from "./deal-actions.tsx";
import { DealFormDialog } from "./deal-form.tsx";
import { dealStageMeta } from "./deal-stage.tsx";

const DRAG_TYPE = "application/x-crm-deal";

/** Deals in columns by stage. Drag a card to another column to move it. */
export function PipelineBoard({ deals }: { readonly deals: ReadonlyArray<Deal> }) {
  const update = useAtomSet(updateDealAtom);
  const companyNames = useCompanyNames();
  const [over, setOver] = useState<DealStage | null>(null);

  const drop = (stage: DealStage) => (event: DragEvent) => {
    event.preventDefault();
    setOver(null);
    const id = event.dataTransfer.getData(DRAG_TYPE) as DealId;
    const deal = deals.find((d) => d.id === id);
    if (deal !== undefined && deal.stage !== stage) update({ id, patch: { stage } });
  };

  return (
    <BoardScroller>
      {dealStages.map((stage) => {
        const column = deals.filter((deal) => deal.stage === stage);
        const total = column.reduce((sum, deal) => sum + deal.value, 0);
        const { label, tone } = dealStageMeta[stage];
        return (
          <section
            key={stage}
            aria-label={`${label} deals`}
            onDragOver={(event) => {
              if (!event.dataTransfer.types.includes(DRAG_TYPE)) return;
              event.preventDefault();
              setOver(stage);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(null);
            }}
            onDrop={drop(stage)}
            className={cn(
              "flex w-72 shrink-0 snap-start flex-col rounded-xl border-2 border-tone/50 bg-surface-muted/60 p-2 transition-colors",
              `tone-${tone}`,

              over === stage && "border-tone bg-tone/10",
            )}
          >
            <header className="flex items-center justify-between gap-2 px-1.5 pt-1 pb-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-[13px] font-semibold text-fg">{label}</h2>
                <span className="text-xs text-fg-subtle tabular-nums">{column.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-fg-muted tabular-nums">
                  {formatMoneyCompact(total)}
                </span>
                <DealFormDialog
                  defaults={{ stage }}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`New ${label.toLowerCase()} deal`}
                    >
                      <Plus />
                    </Button>
                  }
                />
              </div>
            </header>
            <ul className="flex min-h-24 flex-1 flex-col gap-2">
              {column.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  companyName={
                    deal.companyId === null ? null : (companyNames.get(deal.companyId) ?? null)
                  }
                />
              ))}
            </ul>
          </section>
        );
      })}
    </BoardScroller>
  );
}

function DealCard({
  deal,
  companyName,
}: {
  readonly deal: Deal;
  readonly companyName: string | null;
}) {
  return (
    <li
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, deal.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="group cursor-grab rounded-lg border border-border bg-surface p-3 shadow-xs transition-shadow hover:shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium text-fg">{deal.title}</p>
        <div className="-mt-1 -mr-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
          <DealActions deal={deal} />
        </div>
      </div>
      {companyName !== null && deal.companyId !== null && (
        <Link
          to="/companies/$companyId"
          params={{ companyId: deal.companyId }}
          className="mt-0.5 block truncate text-xs text-fg-muted hover:text-fg hover:underline"
        >
          {companyName}
        </Link>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-fg tabular-nums">{formatMoney(deal.value)}</span>
        {deal.expectedCloseDate !== null && (
          <span className="inline-flex items-center gap-1 text-fg-subtle">
            <CalendarDays className="size-3" />
            {formatCalendarDate(deal.expectedCloseDate)}
          </span>
        )}
      </div>
    </li>
  );
}
