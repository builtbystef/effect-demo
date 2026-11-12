import type { Deal } from "@app/domain";
import { Handshake } from "lucide-react";
import { EmptyState } from "#/components/ui/feedback.tsx";
import { formatMoney } from "#/lib/format.ts";
import { DealActions } from "./deal-actions.tsx";
import { DealStageBadge } from "./deal-stage.tsx";

/** A compact list of deals for a contact or company page. */
export function DealList({ deals }: { readonly deals: ReadonlyArray<Deal> }) {
  if (deals.length === 0) {
    return <EmptyState icon={Handshake} title="No deals yet" className="py-8" />;
  }
  return (
    <ul className="divide-y divide-border">
      {deals.map((deal) => (
        <li key={deal.id} className="flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{deal.title}</p>
            <p className="text-xs text-fg-muted tabular-nums">{formatMoney(deal.value)}</p>
          </div>
          <DealStageBadge stage={deal.stage} />
          <DealActions deal={deal} />
        </li>
      ))}
    </ul>
  );
}
