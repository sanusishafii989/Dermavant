import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { ResearchChat } from "@/components/doctor/ResearchChat";
import { doctorNavLinks } from "@/lib/portal-nav";

export const dynamic = "force-dynamic";

export default async function DoctorResearchChatPage() {
  return (
    <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <ResearchChat />
    </PortalDashboardShell>
  );
}
