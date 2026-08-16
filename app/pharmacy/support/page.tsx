import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { pharmacyNavLinks } from "@/lib/portal-nav";
import { SupportPanel } from "@/components/shared/SupportPanel";

export const dynamic = "force-dynamic";

export default function PharmacySupportPage() {
  return (
    <PortalDashboardShell title="E-Pharmacy Portal" links={pharmacyNavLinks}>
      <SupportPanel />
    </PortalDashboardShell>
  );
}
