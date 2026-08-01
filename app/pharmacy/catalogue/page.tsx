import { pharmacyNavLinks } from "@/lib/portal-nav";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PharmacyCatalogue } from "@/components/pharmacy/PharmacyCatalogue";

export const dynamic = "force-dynamic";

export default function PharmacyCataloguePage() {
  return (
    <PortalDashboardShell title="Medicine Catalogue" links={pharmacyNavLinks}>
      <PharmacyCatalogue />
    </PortalDashboardShell>
  );
}
