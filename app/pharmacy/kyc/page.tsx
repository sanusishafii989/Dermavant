import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { pharmacyNavLinks } from "@/lib/portal-nav";
import { ROLE_DASHBOARD } from "@/lib/roles";
import { KYCForm } from "@/components/shared/KYCForm";

export const dynamic = "force-dynamic";

export default async function PharmacyKYCPage() {
  const user = await currentUser();
  const userRole = (user as any)?.publicMetadata?.role;
  if (userRole && userRole !== "partner") {
    redirect(ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD] || "/");
  }

  return (
    <PortalDashboardShell title="E-Pharmacy Portal" links={pharmacyNavLinks}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Business Verification</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">KYC &amp; License Verification</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Submit your pharmacy credentials for admin verification. Required before listing medicines.
          </p>
        </div>
        <KYCForm role="partner" />
      </div>
    </PortalDashboardShell>
  );
}
