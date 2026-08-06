import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { patientNavLinks } from "@/lib/portal-nav";
import { PatientProfileForm } from "@/components/patient/PatientProfileForm";

export const dynamic = "force-dynamic";

export default function PatientProfilePage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Patient profile</p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">Manage your health profile</h1>
        </div>
        <PatientProfileForm />
      </div>
    </PortalDashboardShell>
  );
}