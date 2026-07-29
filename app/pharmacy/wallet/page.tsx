import { pharmacyNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function PharmacyWalletPage() {
  return (
    <PlaceholderPage
      title="Pharmacy Wallet"
      description="View commission and wallet balances here once the wallet integration is complete."
      links={pharmacyNavLinks}
    />
  );
}
