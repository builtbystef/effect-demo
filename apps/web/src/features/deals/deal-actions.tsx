import { type Deal, type DealStage, dealStages } from "@app/domain";
import { useAtomSet } from "@effect/atom-react";
import { ArrowRight, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { ConfirmDialog } from "#/components/ui/confirm-dialog.tsx";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "#/components/ui/menu.tsx";
import { deleteDealAtom, updateDealAtom } from "./api.ts";
import { DealFormDialog } from "./deal-form.tsx";
import { dealStageMeta } from "./deal-stage.tsx";

/**
 * Edit, move and delete for one deal. Moving is also possible by dragging on
 * the board; the menu is the keyboard- and touch-friendly path.
 */
export function DealActions({ deal }: { readonly deal: Deal }) {
  const update = useAtomSet(updateDealAtom);
  const remove = useAtomSet(deleteDealAtom);
  const move = (stage: DealStage) => update({ id: deal.id, patch: { stage } });

  return (
    <div className="flex items-center" onClick={(event) => event.stopPropagation()}>
      <Menu
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${deal.title}`}>
            <Ellipsis />
          </Button>
        }
      >
        <MenuLabel>Move to</MenuLabel>
        {dealStages
          .filter((stage) => stage !== deal.stage)
          .map((stage) => (
            <MenuItem key={stage} onClick={() => move(stage)}>
              <ArrowRight />
              {dealStageMeta[stage].label}
            </MenuItem>
          ))}
        <MenuSeparator />
        <DealFormDialog
          deal={deal}
          trigger={
            <MenuItem closeOnClick={false}>
              <Pencil />
              Edit
            </MenuItem>
          }
        />
        <ConfirmDialog
          trigger={
            <MenuItem destructive closeOnClick={false}>
              <Trash2 />
              Delete
            </MenuItem>
          }
          title={`Delete “${deal.title}”?`}
          description="Its activity history will be deleted too. This can't be undone."
          confirmLabel="Delete deal"
          destructive
          onConfirm={() => remove(deal.id)}
        />
      </Menu>
    </div>
  );
}
