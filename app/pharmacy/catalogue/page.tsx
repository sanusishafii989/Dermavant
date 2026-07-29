import { pharmacyNavLinks } from "@/lib/portal-nav";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function PharmacyCataloguePage() {
  return (
    <PlaceholderPage
      title="Medicine Catalogue"
      description="Manage your pharmacy catalogue, add new listings, and edit inventory."
      links={pharmacyNavLinks}
    />
  );
}
