import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { patientNavLinks } from "@/lib/portal-nav";
import { SupportPanel } from "@/components/shared/SupportPanel";

export const dynamic = "force-dynamic";

export default function PatientSupportPage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <SupportPanel />
    </PortalDashboardShell>
  );
}
