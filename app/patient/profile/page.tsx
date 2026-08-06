import { patientNavLinks } from "@/lib/portal-nav";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PatientProfileForm } from "@/components/patient/PatientProfileForm";

export const dynamic = "force-dynamic";

export default function PatientProfilePage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <div className="space-y-6">
        <div className="rounded-2xl border border-cyan/30 bg-cyan/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan">Medical Profile</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white">Manage Your Health Profile</h1>
          <p className="mt-1 text-sm text-white/70">
            Keep your vital statistics, allergies, medications, and emergency contact information up to date.
          </p>
        </div>
        <PatientProfileForm />
      </div>
    </PortalDashboardShell>
  );
}

