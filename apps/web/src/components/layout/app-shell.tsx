import { useAtom } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  Check,
  Handshake,
  LayoutDashboard,
  type LucideIcon,
  Monitor,
  Moon,
  Sun,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button.tsx";
import { Menu, MenuItem, MenuLabel } from "#/components/ui/menu.tsx";
import { type Theme, themeAtom } from "#/lib/theme.ts";

const nav: ReadonlyArray<{
  readonly to: "/" | "/contacts" | "/companies" | "/deals";
  readonly label: string;
  readonly icon: LucideIcon;
}> = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/deals", label: "Deals", icon: Handshake },
];

/**
 * Sidebar navigation on desktop, a top bar on small screens. On desktop the
 * content sits in an inset, rounded panel that scrolls on its own.
 */
export function AppShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:flex-row md:bg-sidebar">
      <aside className="sticky top-0 z-30 flex shrink-0 flex-col border-b border-border bg-sidebar md:h-dvh md:w-60 md:border-b-0">
        <div className="flex h-14 items-center justify-between gap-2 px-4 md:px-5">
          <Brand />
          <div className="md:hidden">
            <ThemeMenu />
          </div>
        </div>
        <nav
          aria-label="Main"
          className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:px-3 md:pt-2"
        >
          {nav.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="hidden items-center justify-between gap-2 px-3 py-3 md:flex">
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-fg-muted hover:bg-surface-hover hover:text-fg"
          >
            <BookOpen className="size-4" />
            API docs
          </a>
          <ThemeMenu />
        </div>
      </aside>
      <main
        id="main"
        data-scroll-restoration-id="main"
        className="min-w-0 flex-1 md:m-2 md:ml-0 md:overflow-y-auto md:rounded-xl md:border md:border-border md:bg-background md:shadow-sm"
      >
        {children}
      </main>
    </div>
  );
}

function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img src="/favicon.svg" alt="" className="size-7" />
      <span className="text-[15px] font-semibold tracking-tight text-fg">Relay</span>
    </Link>
  );
}

function NavLink({ to, label, icon: Icon }: (typeof nav)[number]) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="flex shrink-0 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg data-[status=active]:bg-surface data-[status=active]:text-fg data-[status=active]:shadow-xs"
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

const themes: ReadonlyArray<{
  readonly value: Theme;
  readonly label: string;
  readonly icon: LucideIcon;
}> = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function ThemeMenu() {
  const [theme, setTheme] = useAtom(themeAtom);
  const current = themes.find((t) => t.value === theme) ?? themes[0]!;
  const Icon = current.icon;
  return (
    <Menu
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={`Theme: ${current.label}`}>
          <Icon />
        </Button>
      }
    >
      <MenuLabel>Theme</MenuLabel>
      {themes.map(({ value, label, icon: ItemIcon }) => (
        <MenuItem key={value} onClick={() => setTheme(value)}>
          <ItemIcon />
          <span className="flex-1">{label}</span>
          {value === theme && <Check className="text-primary!" />}
        </MenuItem>
      ))}
    </Menu>
  );
}
