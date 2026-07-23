"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/nav/nav-config";

// Client component: highlights the active route. The org switcher and user
// button (Clerk) are injected by the (app) layout via the `orgSwitcher` and
// `userButton` slots so this stays a pure presentational shell.
export function Sidebar({
  orgSwitcher,
  userButton,
}: {
  orgSwitcher?: React.ReactNode;
  userButton?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="text-base font-semibold tracking-tight">Vedette</span>
      </div>

      <div className="border-b px-3 py-3">
        {orgSwitcher ?? (
          <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            Organization switcher (Clerk)
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.comingInPhase !== null && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                  P{item.comingInPhase}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        {userButton ?? (
          <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
            Signed-in user (Clerk)
          </div>
        )}
      </div>
    </aside>
  );
}
