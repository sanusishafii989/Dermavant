import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { AIConsultationTabs } from "@/components/patient/AIConsultationTabs";
import { patientNavLinks } from "@/lib/portal-nav";

export const dynamic = "force-dynamic";

export default async function StartAIConsultationPage() {
  const user = await currentUser();
  const fullName =
    user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Patient";

  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <div className="space-y-6">
        <Card className="max-w-5xl">
          <div className="flex items-center gap-4">
            <Avatar src={user?.imageUrl} name={fullName} size="lg" />
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--accent-cyan)]">Clinical AI Suite</p>
              <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">AI Dermatology Consultation</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Get instant AI-powered triage for skin, hair, and nail conditions.</p>
            </div>
          </div>
        </Card>

        <AIConsultationTabs />
      </div>
    </PortalDashboardShell>
  );
}
