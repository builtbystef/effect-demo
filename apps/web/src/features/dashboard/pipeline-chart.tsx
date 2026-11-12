import type { StageSummary } from "@app/domain";
import { cn } from "#/lib/cn.ts";
import { formatMoney, formatMoneyCompact } from "#/lib/format.ts";
import { dealStageMeta } from "../deals/deal-stage.tsx";

/**
 * Pipeline value by stage as horizontal bars, scaled to the largest stage.
 * Each row also states its numbers, so the chart is readable without colour.
 */
export function PipelineChart({ stages }: { readonly stages: ReadonlyArray<StageSummary> }) {
  const max = Math.max(1, ...stages.map((stage) => stage.value));
  return (
    <ul className="flex flex-col gap-3.5 px-4 pb-4">
      {stages.map((stage) => {
        const { label, tone } = dealStageMeta[stage.stage];
        return (
          <li key={stage.stage}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px]">
              <span className="font-medium text-fg">{label}</span>
              <span className="text-fg-muted tabular-nums">
                <span className="sr-only">{formatMoney(stage.value)} across </span>
                <span aria-hidden>{formatMoneyCompact(stage.value)} · </span>
                {stage.count} {stage.count === 1 ? "deal" : "deals"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
              <div
                className={cn(
                  "h-full rounded-full bg-tone transition-[width] duration-700 ease-out-quint",
                  `tone-${tone}`,
                )}
                style={{ width: `${(stage.value / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
