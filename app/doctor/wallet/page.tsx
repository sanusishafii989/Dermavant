import { doctorNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function DoctorWalletPage() {
  return (
    <PlaceholderPage
      title="Wallet"
      description="Doctor wallet and earnings information will be available here soon."
      links={doctorNavLinks}
    />
  );
}
