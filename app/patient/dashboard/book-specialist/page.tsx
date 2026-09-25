import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
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
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader 
          title="Book a Specialist"
          description="Choose the specialist you need, pick a date and time, and confirm your appointment in a single flow."
        />

        <BookingWizard patientName={fullName} />
      </div>
    </PortalDashboardShell>
  );
}
