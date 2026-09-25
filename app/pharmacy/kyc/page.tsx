import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { pharmacyNavLinks } from "@/lib/portal-nav";
import { ROLE_DASHBOARD } from "@/lib/roles";
import { KYCForm } from "@/components/shared/KYCForm";

export const dynamic = "force-dynamic";

export default async function PharmacyKYCPage() {
  const user = await currentUser();
  const userRole = (user as any)?.publicMetadata?.role;
  if (userRole && userRole !== "partner") {
    redirect(ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD] || "/");
  }

  return (
    <PortalDashboardShell title="E-Pharmacy Portal" links={pharmacyNavLinks}>
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader 
          title="KYC & License Verification"
          description="Submit your pharmacy credentials for admin verification. Required before listing medicines."
          badge={<Badge variant="cyan">Business Verification</Badge>}
        />
        <KYCForm role="partner" />
      </div>
    </PortalDashboardShell>
  );
}
