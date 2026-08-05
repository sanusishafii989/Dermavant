import { pharmacyNavLinks } from "@/lib/portal-nav";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PharmacyOrders } from "@/components/pharmacy/PharmacyOrders";

export const dynamic = "force-dynamic";

export default function PharmacyOrdersPage() {
  return (
    <PortalDashboardShell title="E-Pharmacy Portal" links={pharmacyNavLinks}>
      <PharmacyOrders />
    </PortalDashboardShell>
  );
}
