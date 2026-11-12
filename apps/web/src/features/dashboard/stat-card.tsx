import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "#/components/ui/card.tsx";

export interface StatCardProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly hint?: ReactNode;
  readonly icon: LucideIcon;
}

export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-fg-muted">{label}</p>
        <Icon className="size-4 text-fg-subtle" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</p>
      {hint !== undefined && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
    </Card>
  );
}
