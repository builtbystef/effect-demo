import type { ActivityKind } from "@app/domain";
import { CalendarDays, type LucideIcon, Mail, Phone, StickyNote } from "lucide-react";
import type { Tone } from "#/components/ui/badge.tsx";

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
