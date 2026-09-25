import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { adminNavLinks } from "@/lib/portal-nav";
import { ROLE_DASHBOARD } from "@/lib/roles";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await currentUser();

  // Enforce role — admin only
  const userRole = (user as any)?.publicMetadata?.role;
  if (userRole !== "admin") {
    if (userRole && ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD]) {
      redirect(ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD]);
    }
    // No role or not admin — send to sign-in
    redirect("/sign-in");
  }

  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Admin";

    return (
      <PortalDashboardShell title="Admin Portal" links={adminNavLinks}>
        <div className="space-y-6 max-w-7xl mx-auto">
          <PageHeader 
            title={`Welcome back, ${fullName}`}
            description="System overview, user management, and support desk operations."
            actions={<Badge variant="gold">Admin</Badge>}
          />

        <AdminDashboard />
      </div>
    </PortalDashboardShell>
  );
}
