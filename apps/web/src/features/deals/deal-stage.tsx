import { type DealStage, dealStages } from "@app/domain";
import { Badge, type Tone } from "#/components/ui/badge.tsx";

export const dealStageMeta: Record<DealStage, { readonly label: string; readonly tone: Tone }> = {
  lead: { label: "Lead", tone: "gray" },
  qualified: { label: "Qualified", tone: "blue" },
  proposal: { label: "Proposal", tone: "violet" },
  negotiation: { label: "Negotiation", tone: "amber" },
  won: { label: "Won", tone: "green" },
  lost: { label: "Lost", tone: "red" },
};

export const dealStageOptions = dealStages.map((value) => ({
  value,
  label: dealStageMeta[value].label,
}));

export function DealStageBadge({ stage }: { readonly stage: DealStage }) {
  const { label, tone } = dealStageMeta[stage];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
