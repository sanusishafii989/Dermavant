import { doctorNavLinks } from "@/lib/portal-nav";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { ResearchChat } from "@/components/doctor/ResearchChat";

export const dynamic = "force-dynamic";

export default function DoctorResearchChatPage() {
  return (
    <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <ResearchChat />
    </PortalDashboardShell>
  );
}
