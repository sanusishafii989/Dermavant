import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { BookingWizard } from "@/components/patient/BookingWizard";
import { patientNavLinks } from "@/lib/portal-nav";

export const dynamic = "force-dynamic";

export default async function BookSpecialistPage() {
  const user = await currentUser();
  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Patient";

  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_64px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan">Book Specialist</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Care booking for {fullName}</h1>
          <p className="mt-3 max-w-3xl text-white/70">
            Choose the specialist you need, pick a date and time, and confirm your appointment.
          </p>
        </div>

        <BookingWizard patientName={fullName} />
      </div>
    </PortalDashboardShell>
  );
}
