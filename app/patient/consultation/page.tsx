import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { patientNavLinks } from "@/lib/portal-nav";
import { PatientConsultations } from "@/components/patient/PatientConsultations";

export const dynamic = "force-dynamic";

export default function PatientConsultationPage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <PatientConsultations />
    </PortalDashboardShell>
  );
}