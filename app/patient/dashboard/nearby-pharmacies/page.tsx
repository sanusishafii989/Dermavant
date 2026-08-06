import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { patientNavLinks } from "@/lib/portal-nav";
import { NearbyPharmacies } from "@/components/patient/NearbyPharmacies";

export const dynamic = "force-dynamic";

export default function NearbyPharmaciesPage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <NearbyPharmacies />
    </PortalDashboardShell>
  );
}