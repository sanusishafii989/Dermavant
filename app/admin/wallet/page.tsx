import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { adminNavLinks } from "@/lib/portal-nav";
import { AdminWallet } from "@/components/admin/AdminWallet";

export const dynamic = "force-dynamic";

export default async function AdminWalletPage() {
  return (
    <PortalDashboardShell title="Admin Portal" links={adminNavLinks}>
      <AdminWallet />
    </PortalDashboardShell>
  );
}
