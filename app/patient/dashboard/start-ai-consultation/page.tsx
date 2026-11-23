import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { AIConsultationTabs } from "@/components/patient/AIConsultationTabs";
import { DevFestToolsCard } from "@/components/patient/DevFestToolsCard";
import { patientNavLinks } from "@/lib/portal-nav";

export const dynamic = "force-dynamic";

export default async function StartAIConsultationPage() {
  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="AI Dermatology Consultation"
          description="Explore free Google Gemini-powered skin image and symptom triage. This GDG Yola DevFest demonstration offers preliminary information, not a medical diagnosis."
        />
        <DevFestToolsCard />
        <AIConsultationTabs />
      </div>
    </PortalDashboardShell>
  );
}
