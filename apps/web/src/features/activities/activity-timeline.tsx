import { type Activity, type ActivityFilter, ActivityKind } from "@app/domain";
import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Exit, Schema } from "effect";
import { History, Trash2 } from "lucide-react";
import { AsyncView } from "#/components/async-view.tsx";
import { useAppForm } from "#/components/form/form.tsx";
import { Button } from "#/components/ui/button.tsx";
import { EmptyState, Skeleton } from "#/components/ui/feedback.tsx";
import { Select } from "#/components/ui/select.tsx";
import { Tooltip } from "#/components/ui/tooltip.tsx";
import { formatDateTime, formatRelative } from "#/lib/format.ts";
import { formSchema, requiredText } from "#/lib/form-schema.ts";
import { activitiesAtom, createActivityAtom, deleteActivityAtom } from "./api.ts";
import { ActivityIcon, activityKindOptions, activityKinds } from "./activity-kind.tsx";

/**
 * The history of a contact, company or deal, newest first, with a composer
 * for logging a note, call, email or meeting. New entries are linked to every
 * record in `links`, so a call logged on a contact also shows on its company.
 */
export function ActivityTimeline({
  filter,
  links,
}: {
  readonly filter: ActivityFilter;
  readonly links: Pick<Activity, "contactId" | "companyId" | "dealId">;
}) {
  const atom = activitiesAtom(filter);
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);

  return (
    <div className="flex flex-col">
      <Composer links={links} />
      <AsyncView result={result} onRetry={refresh} loading={<TimelineSkeleton />}>
        {(activities) =>
          activities.length === 0 ? (
            <EmptyState
              icon={History}
              title="No activity yet"
              description="Log a call, email, meeting or note above."
            />
          ) : (
            <ol className="relative px-4 pt-4 pb-2">
              {activities.map((activity) => (
                <TimelineItem key={activity.id} activity={activity} />
              ))}
            </ol>
          )
        }
      </AsyncView>
    </div>
  );
}

const ComposerForm = formSchema(Schema.Struct({ kind: ActivityKind, body: requiredText(5000) }));

function Composer({
  links,
}: {
  readonly links: Pick<Activity, "contactId" | "companyId" | "dealId">;
}) {
  const create = useAtomSet(createActivityAtom, { mode: "promiseExit" });
  const form = useAppForm({
    defaultValues: { kind: "note" as ActivityKind, body: "" },
    validators: { onSubmit: ComposerForm.validator },
    onSubmit: async ({ value, formApi }) => {
      const exit = await create({ ...ComposerForm.decode(value), ...links });
      if (Exit.isSuccess(exit)) formApi.reset({ kind: value.kind, body: "" });
    },
  });

  return (
    <form.AppForm>
      <form.Form className="border-b border-border px-4 pb-4">
        <form.AppField name="body">
          {(field) => (
            <textarea
              aria-label="Activity details"
              rows={3}
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey))
                  void form.handleSubmit();
              }}
              placeholder="What happened? ⌘↵ to save"
              className="w-full resize-none rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-fg shadow-xs outline-none placeholder:text-fg-subtle focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring"
            />
          )}
        </form.AppField>
        <div className="mt-2 flex items-center justify-between gap-2">
          <form.Field name="kind">
            {(field) => (
              <Select
                aria-label="Activity type"
                options={activityKindOptions}
                value={field.state.value}
                onValueChange={(kind) => field.handleChange(kind)}
                className="h-8 w-32"
              />
            )}
          </form.Field>
          <form.Subscribe selector={(state) => state.values.body.trim().length > 0}>
            {(hasBody) => <form.SubmitButton disabled={!hasBody}>Log activity</form.SubmitButton>}
          </form.Subscribe>
        </div>
      </form.Form>
    </form.AppForm>
  );
}

function TimelineItem({ activity }: { readonly activity: Activity }) {
  const remove = useAtomSet(deleteActivityAtom);
  return (
    <li className="group relative flex gap-3 pb-5 last:pb-2 before:absolute before:top-8 before:bottom-0 before:left-[13px] before:w-px before:bg-border last:before:hidden">
      <ActivityIcon kind={activity.kind} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-fg">{activityKinds[activity.kind].label}</span>
          <Tooltip content={formatDateTime(activity.createdAt)}>
            <time className="text-fg-subtle">{formatRelative(activity.createdAt)}</time>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Delete activity"
            onClick={() => remove(activity.id)}
            className="ml-auto -my-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
          >
            <Trash2 />
          </Button>
        </div>
        <p className="mt-1 text-sm whitespace-pre-wrap text-fg">{activity.body}</p>
      </div>
    </li>
  );
}

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-4 py-4" aria-busy aria-label="Loading activity">
      {[80, 60, 70].map((width) => (
        <div key={width} className="flex gap-3">
          <Skeleton className="size-7 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3.5" style={{ width: `${width}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
