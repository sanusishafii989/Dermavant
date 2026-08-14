import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { adminNavLinks } from "@/lib/portal-nav";
import { ROLE_DASHBOARD } from "@/lib/roles";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await currentUser();

  const userRole = (user as any)?.publicMetadata?.role;
  if (userRole && userRole !== "admin") {
    redirect(ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD] || "/");
  }

  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Admin";

  return (
    <PortalDashboardShell title="Admin Portal" links={adminNavLinks}>
      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-4">
            <Avatar src={user?.imageUrl} name={fullName} size="lg" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Welcome back</p>
              <h1 className="mt-1 text-3xl font-bold text-[var(--text-primary)]">{fullName}</h1>
              <Badge variant="gold" className="mt-2">admin</Badge>
            </div>
          </div>
        </Card>

        <AdminDashboard />
      </div>
    </PortalDashboardShell>
  );
}
