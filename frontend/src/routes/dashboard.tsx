import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CreditCard,
  FileCheck2,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { clearSession, getSession } from "@/lib/api/auth";
import { Logo } from "@/components/site/Logo";

export const Route = createFileRoute("/dashboard")({ component: DashboardLayout });
const links = [
  ["/dashboard", "Overview", LayoutDashboard],
  ["/dashboard/profile", "Profile", UserRound],
  ["/dashboard/organizations", "Organizations", Building2],
  ["/dashboard/documents", "Documents", FileText],
  ["/dashboard/credentials", "Credentials", FileCheck2],
  ["/dashboard/verifications", "Verifications", ShieldCheck],
  ["/dashboard/billing", "Billing & M-Pesa", CreditCard],
  ["/dashboard/notifications", "Notifications", Bell],
  ["/dashboard/admin", "Administration", Users],
] as const;
function DashboardLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!getSession()) void navigate({ to: "/login" });
    else setReady(true);
  }, [navigate]);
  if (!ready)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Checking your session…
      </div>
    );
  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5">
          <Logo />
          <button
            className="text-sm font-semibold text-navy"
            onClick={() => {
              clearSession();
              void navigate({ to: "/login" });
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[240px_1fr]">
        <aside className="border-r bg-background p-4 lg:min-h-[calc(100vh-5rem)]">
          <nav className="grid gap-1">
            {links.map(([to, label, Icon]) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/dashboard" }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary data-[status=active]:bg-navy data-[status=active]:text-white"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
