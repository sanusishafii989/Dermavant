import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { AIConsultationTabs } from "@/components/patient/AIConsultationTabs";
import { patientNavLinks } from "@/lib/portal-nav";

export const dynamic = "force-dynamic";

export default async function StartAIConsultationPage() {
  const user = await currentUser();

  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader 
          title="AI Dermatology Consultation"
          description="Get instant AI-powered triage for skin, hair, and nail conditions. Answer a few questions and upload an image to begin."
        />

        <AIConsultationTabs />
      </div>
    </PortalDashboardShell>
  );
}
