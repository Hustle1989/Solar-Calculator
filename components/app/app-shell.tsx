"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BellIcon,
  CalendarDaysIcon,
  HeadsetIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  MessageSquareIcon,
  PhoneIncomingIcon,
  ReceiptIcon,
  TagIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { Notification, Role } from "@/lib/mock-data";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/ui-bits";
import { CallProvider, useCall } from "@/components/call/call-provider";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: number };

const NAV: Record<Role, NavItem[]> = {
  customer: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboardIcon },
    { href: "/dashboard/chat", label: "Messages", icon: MessageSquareIcon, badge: 1 },
    { href: "/dashboard/quotes/q-1042", label: "My quote", icon: ReceiptIcon },
    { href: "/dashboard/book", label: "Book a call", icon: CalendarDaysIcon },
    { href: "/dashboard/media", label: "Site media", icon: ImageIcon },
  ],
  rep: [
    { href: "/rep", label: "My customers", icon: UsersIcon },
    { href: "/rep/chat", label: "Messages", icon: MessageSquareIcon, badge: 2 },
    { href: "/rep/availability", label: "Availability", icon: CalendarDaysIcon },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboardIcon },
    { href: "/admin/customers", label: "Customers", icon: UsersIcon },
    { href: "/admin/reps", label: "Advisors", icon: HeadsetIcon },
    { href: "/admin/pricing", label: "Pricing", icon: TagIcon },
  ],
};

const ROLE_LABEL: Record<Role, string> = { customer: "Customer", rep: "Solar advisor", admin: "Admin" };
const ROOT: Record<Role, string> = { customer: "/dashboard", rep: "/rep", admin: "/admin" };

export type ShellUser = { name: string; email: string; subtitle: string };

export function AppShell({
  role,
  user,
  notifications,
  callPeer,
  children,
}: {
  role: Role;
  user: ShellUser;
  notifications: Notification[];
  /** Who "Simulate incoming call" rings as. */
  callPeer: string;
  children: React.ReactNode;
}) {
  return (
    <CallProvider selfName={user.name}>
      <div className="min-h-dvh lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="dark sticky top-0 hidden h-dvh border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
          <SidebarContents role={role} user={user} />
        </aside>
        <div className="flex min-w-0 flex-col">
          <TopBar role={role} user={user} notifications={notifications} callPeer={callPeer} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </CallProvider>
  );
}

function SidebarContents({ role, user, onNavigate }: { role: Role; user: ShellUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  // The deepest matching section wins; anything else under the role root highlights the root item.
  const base = (href: string) => href.split("/").slice(0, 3).join("/");
  const activeHref = NAV[role].find((i) => i.href !== ROOT[role] && pathname.startsWith(base(i.href)))?.href ?? ROOT[role];
  const isActive = (href: string) => href === activeHref;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo href={ROOT[role]} />
      </div>
      <div className="gold-rule mx-5 opacity-40" />
      <p className="px-5 pt-6 pb-2 font-display text-[0.65rem] font-bold tracking-[0.25em] text-sidebar-foreground/50 uppercase">
        {ROLE_LABEL[role]}
      </p>
      <nav className="flex flex-col gap-1 px-3" aria-label="App">
        {NAV[role].map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold-gradient" />}
              <item.icon className={cn("size-4.5", active ? "text-gold" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold-gradient px-1.5 text-[0.65rem] font-bold text-black">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-3">
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
          <UserAvatar name={user.name} gold />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar({ role, user, notifications, callPeer }: { role: Role; user: ShellUser; notifications: Notification[]; callPeer: string }) {
  const router = useRouter();
  const { simulateIncoming } = useCall();
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="dark w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContents role={role} user={user} />
        </SheetContent>
      </Sheet>
      <div className="lg:hidden">
        <Logo href={ROOT[role]} compact />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} unread`}>
              <BellIcon />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-gold ring-2 ring-background" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications {unread > 0 && <Badge className="bg-gold-soft text-gold-text">{unread} new</Badge>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} onSelect={() => router.push(n.href)} className="items-start gap-3 py-2.5">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.unread ? "bg-gold" : "bg-transparent")} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{n.title}</span>
                  <span className="block text-xs text-muted-foreground">{n.body}</span>
                  <span className="mt-1 block text-[0.7rem] text-muted-foreground">{timeAgo(n.at)}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Account menu">
              <UserAvatar name={user.name} gold />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <p className="font-medium">{user.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>View as (demo)</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => router.push("/dashboard")}>Customer</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/dashboard?welcome=1")}>Customer: just signed up</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/rep")}>Solar advisor</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push("/admin")}>Admin</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onSelect={() => simulateIncoming(callPeer)}>
                <PhoneIncomingIcon /> Simulate incoming call
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/")}>
              <LogOutIcon /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
