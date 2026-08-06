import { doctorNavLinks } from "@/lib/portal-nav";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { DoctorProfileForm } from "@/components/doctor/DoctorProfileForm";

export const dynamic = "force-dynamic";

export default function DoctorProfilePage() {
  return (
    <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Doctor profile</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">Manage your professional profile</h1>
        </div>
        <DoctorProfileForm />
      </div>
    </PortalDashboardShell>
  );
}
