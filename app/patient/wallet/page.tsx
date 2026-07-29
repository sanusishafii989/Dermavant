import { patientNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function PatientWalletPage() {
  return (
    <PlaceholderPage
      title="Wallet"
      description="Your wallet details and balances will be available here soon."
      links={patientNavLinks}
    />
  );
}
