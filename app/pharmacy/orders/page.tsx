import { pharmacyNavLinks } from "@/lib/portal-nav";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function PharmacyOrdersPage() {
  return (
    <PlaceholderPage
      title="Pharmacy Orders"
      description="Review and manage pharmacy orders once this flow is implemented."
      links={pharmacyNavLinks}
    />
  );
}
