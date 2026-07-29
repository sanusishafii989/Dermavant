import { patientNavLinks } from "@/lib/portal-nav";
import PatientPharmacyShop from "@/components/patient/PatientPharmacyShop";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";

export const dynamic = "force-dynamic";

export default function PatientPharmacyPage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <PatientPharmacyShop />
    </PortalDashboardShell>
  );
}
