import { patientNavLinks } from "@/lib/portal-nav";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PatientConsultationClient } from "@/components/patient/PatientConsultationClient";

export const dynamic = "force-dynamic";

export default function PatientConsultationPage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <PatientConsultationClient />
    </PortalDashboardShell>
  );
}

