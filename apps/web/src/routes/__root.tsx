import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { AppShell } from "#/components/layout/app-shell.tsx";
import { Page } from "#/components/layout/page-header.tsx";
import { buttonVariants } from "#/components/ui/button.tsx";
import { EmptyState } from "#/components/ui/feedback.tsx";

export const Route = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
  notFoundComponent: () => (
    <Page>
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or was moved."
        action={
          <Link to="/" className={buttonVariants()}>
            Go to dashboard
          </Link>
        }
      />
    </Page>
  ),
});
