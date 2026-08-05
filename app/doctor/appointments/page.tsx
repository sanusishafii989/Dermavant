import { doctorNavLinks } from "@/lib/portal-nav";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { DoctorAppointments } from "@/components/doctor/DoctorAppointments";

export const dynamic = "force-dynamic";

export default function DoctorAppointmentsPage() {
  return (
    <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <DoctorAppointments />
    </PortalDashboardShell>
  );
}
