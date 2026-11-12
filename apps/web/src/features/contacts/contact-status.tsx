import type { ContactStatus } from "@app/domain";
import { Badge, type Tone } from "#/components/ui/badge.tsx";

export const contactStatuses: Record<
  ContactStatus,
  { readonly label: string; readonly tone: Tone }
> = {
  lead: { label: "Lead", tone: "blue" },
  prospect: { label: "Prospect", tone: "violet" },
  customer: { label: "Customer", tone: "green" },
  churned: { label: "Churned", tone: "gray" },
};

export const contactStatusOptions = (Object.keys(contactStatuses) as ContactStatus[]).map(
  (value) => ({ value, label: contactStatuses[value].label }),
);

export function ContactStatusBadge({ status }: { readonly status: ContactStatus }) {
  const { label, tone } = contactStatuses[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
