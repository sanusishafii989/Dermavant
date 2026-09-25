import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { doctorNavLinks } from "@/lib/portal-nav";
import { ROLE_DASHBOARD } from "@/lib/roles";
import { KYCForm } from "@/components/shared/KYCForm";

export const dynamic = "force-dynamic";

export default async function DoctorKYCPage() {
  const user = await currentUser();
  const userRole = (user as any)?.publicMetadata?.role;
  if (userRole && userRole !== "doctor") {
    redirect(ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD] || "/");
  }

  return (
    <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader 
          title="KYC & Credential Verification"
          description="Submit your medical credentials for admin verification. Required before accepting consultations."
          badge={<Badge variant="cyan">Professional Verification</Badge>}
        />
        <KYCForm role="doctor" />
      </div>
    </PortalDashboardShell>
  );
}
