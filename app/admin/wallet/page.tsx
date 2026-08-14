import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { adminNavLinks } from "@/lib/portal-nav";
import { ROLE_DASHBOARD } from "@/lib/roles";
import { AdminWallet } from "@/components/admin/AdminWallet";

export const dynamic = "force-dynamic";

export default async function AdminWalletPage() {
  const user = await currentUser();
  const userRole = (user as any)?.publicMetadata?.role;
  if (userRole && userRole !== "admin") {
    redirect(ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD] || "/");
  }

  return (
    <PortalDashboardShell title="Admin Portal" links={adminNavLinks}>
      <AdminWallet />
    </PortalDashboardShell>
  );
}
