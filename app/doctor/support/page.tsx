import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { doctorNavLinks } from "@/lib/portal-nav";
import { SupportPanel } from "@/components/shared/SupportPanel";

export const dynamic = "force-dynamic";

export default function DoctorSupportPage() {
  return (
    <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <SupportPanel />
    </PortalDashboardShell>
  );
}
