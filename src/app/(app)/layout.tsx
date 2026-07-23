import { Sidebar } from "@/components/nav/sidebar";

// Authenticated workspace shell. Server component by default. When Clerk is
// wired (Phase 1, step 2), this layout also enforces auth and passes the
// <OrganizationSwitcher /> and <UserButton /> into the sidebar slots.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
