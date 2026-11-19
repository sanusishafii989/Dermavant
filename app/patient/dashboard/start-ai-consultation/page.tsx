import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { AIConsultationTabs } from "@/components/patient/AIConsultationTabs";
import { DevFestToolsCard } from "@/components/patient/DevFestToolsCard";
import { patientNavLinks } from "@/lib/portal-nav";

export const dynamic = "force-dynamic";

export default async function StartAIConsultationPage() {
  const aiProvider = process.env.AI_PROVIDER?.trim().toLowerCase() === "groq" ? "groq" : "gemini";

  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <PageHeader 
          title="AI Dermatology Consultation"
          description={aiProvider === "gemini"
            ? "Explore Gemini-powered skin image and symptom triage. This DevFest demonstration offers preliminary information, not a medical diagnosis."
            : "Explore text-only AI symptom triage. This DevFest fallback offers preliminary information, not a medical diagnosis."}
        />

        <DevFestToolsCard aiProvider={aiProvider} />
        <AIConsultationTabs aiProvider={aiProvider} />
      </div>
    </PortalDashboardShell>
  );
}
