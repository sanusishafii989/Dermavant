import { doctorNavLinks } from "@/lib/portal-nav";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { DoctorProfileForm } from "@/components/doctor/DoctorProfileForm";

export const dynamic = "force-dynamic";

export default function DoctorProfilePage() {
  return (
    <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-cyan/30 bg-cyan/5 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan">Doctor profile</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Manage your professional profile</h1>
        </div>
        <DoctorProfileForm />
      </div>
    </PortalDashboardShell>
  );
}
