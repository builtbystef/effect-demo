import type { ActivityKind } from "@app/domain";
import { CalendarDays, type LucideIcon, Mail, Phone, StickyNote } from "lucide-react";
import type { Tone } from "#/components/ui/badge.tsx";
import { cn } from "#/lib/cn.ts";

export const activityKinds: Record<
  ActivityKind,
  { readonly label: string; readonly icon: LucideIcon; readonly tone: Tone }
> = {
  note: { label: "Note", icon: StickyNote, tone: "amber" },
  call: { label: "Call", icon: Phone, tone: "green" },
  email: { label: "Email", icon: Mail, tone: "blue" },
  meeting: { label: "Meeting", icon: CalendarDays, tone: "violet" },
};

export const activityKindOptions = (Object.keys(activityKinds) as ActivityKind[]).map((value) => ({
  value,
  label: activityKinds[value].label,
}));

/** The kind's icon in a tinted circle: the marker on a timeline entry. */
export function ActivityIcon({ kind }: { readonly kind: ActivityKind }) {
  const { icon: Icon, tone } = activityKinds[kind];
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full bg-tone/12 text-tone-fg",
        `tone-${tone}`,
      )}
    >
      <Icon className="size-3.5" />
    </span>
  );
}
