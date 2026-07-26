import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PaymentResultCard } from "@/components/patient/PaymentResultCard";
import { patientNavLinks } from "@/lib/portal-nav";

export const dynamic = "force-dynamic";

export default function PaymentFailedPage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <PaymentResultCard mode="failed" />
    </PortalDashboardShell>
  );
}
