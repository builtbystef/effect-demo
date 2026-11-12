import type { Contact } from "@app/domain";
import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Avatar } from "#/components/ui/avatar.tsx";
import { EmptyState } from "#/components/ui/feedback.tsx";
import { ContactStatusBadge } from "./contact-status.tsx";

/** A compact list of people for a company page. */
export function ContactList({ contacts }: { readonly contacts: ReadonlyArray<Contact> }) {
  if (contacts.length === 0) {
    return <EmptyState icon={Users} title="No contacts yet" className="py-8" />;
  }
  return (
    <ul className="divide-y divide-border">
      {contacts.map((contact) => (
        <li key={contact.id}>
          <Link
            to="/contacts/$contactId"
            params={{ contactId: contact.id }}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover"
          >
            <Avatar name={contact.fullName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{contact.fullName}</p>
              {contact.title !== null && (
                <p className="truncate text-xs text-fg-muted">{contact.title}</p>
              )}
            </div>
            <ContactStatusBadge status={contact.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
