import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { patientNavLinks } from "@/lib/portal-nav";
import { PatientOrders } from "@/components/patient/PatientOrders";

export const dynamic = "force-dynamic";

export default function PatientOrdersPage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <PatientOrders />
    </PortalDashboardShell>
  );
}
