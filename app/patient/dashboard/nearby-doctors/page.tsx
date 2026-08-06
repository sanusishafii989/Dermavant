import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { patientNavLinks } from "@/lib/portal-nav";
import { NearbyDoctors } from "@/components/patient/NearbyDoctors";

export const dynamic = "force-dynamic";

export default function NearbyDoctorsPage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <NearbyDoctors />
    </PortalDashboardShell>
  );
}