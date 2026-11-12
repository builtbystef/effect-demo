import type { Activity } from "@app/domain";
import { Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import { EmptyState } from "#/components/ui/feedback.tsx";
import { formatRelative } from "#/lib/format.ts";
import { useCompanyNames } from "../companies/use-company-options.ts";
import { useContactNames } from "../contacts/use-contact-options.ts";
import { ActivityIcon, activityKinds } from "./activity-kind.tsx";

const subjectLink = "font-medium text-fg-muted hover:text-fg hover:underline";

/** A read-only feed of the latest activity, each linked to who it was with. */
export function RecentActivity({ activities }: { readonly activities: ReadonlyArray<Activity> }) {
  const contactNames = useContactNames();
  const companyNames = useCompanyNames();

  if (activities.length === 0) {
    return <EmptyState icon={History} title="Nothing logged yet" className="py-8" />;
  }

  /** The contact an activity was with, or else its company. */
  const subject = ({ contactId, companyId }: Activity) =>
    contactId !== null && contactNames.has(contactId) ? (
      <Link to="/contacts/$contactId" params={{ contactId }} className={subjectLink}>
        {contactNames.get(contactId)}
      </Link>
    ) : companyId !== null && companyNames.has(companyId) ? (
      <Link to="/companies/$companyId" params={{ companyId }} className={subjectLink}>
        {companyNames.get(companyId)}
      </Link>
    ) : null;

  return (
    <ul className="flex flex-col px-2 pb-2">
      {activities.map((activity) => {
        const link = subject(activity);
        return (
          <li key={activity.id} className="flex gap-3 rounded-lg px-2 py-2.5">
            <ActivityIcon kind={activity.kind} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-fg">{activity.body}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-fg-subtle">
                <span>{activityKinds[activity.kind].label}</span>
                {link !== null && (
                  <>
                    <span aria-hidden>·</span>
                    {link}
                  </>
                )}
                <span aria-hidden>·</span>
                <span>{formatRelative(activity.createdAt)}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
