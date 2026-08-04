import { doctorNavLinks } from "@/lib/portal-nav";
import { PlaceholderPage } from "@/components/PlaceholderPage";

export const dynamic = "force-dynamic";

export default function DoctorAppointmentsPage() {
  return (
    <PlaceholderPage
      title="Appointments"
      description="Doctor appointment management will be built here next."
      links={doctorNavLinks}
    />
  );
}
