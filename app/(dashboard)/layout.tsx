import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SidebarShell from "@/components/SidebarShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const name  = session.user?.name ?? null;
  const email = session.user?.email ?? null;

  const displayName = name || email || "User";
  const initials    = name
    ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : (email?.[0] ?? "?").toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <SidebarShell displayName={displayName} initials={initials} />

      {/* Main content — spacer pushes content below fixed mobile top bar */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="h-14 lg:hidden shrink-0" />
        {children}
      </main>
    </div>
  );
}
