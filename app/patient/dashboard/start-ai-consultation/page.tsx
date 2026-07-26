import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AIConsultationWizard } from "@/components/patient/AIConsultationWizard";
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
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar src={user?.imageUrl} name={fullName} size="lg" />
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-cyan">Dermatology AI Consultation</p>
                <h1 className="mt-1 text-3xl font-bold text-white">Describe your skin symptoms</h1>
                <p className="mt-2 text-sm text-white/70">Enter the visible rash, lesion, or skin change details below.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <p className="font-medium text-white">Your consultation assistant is dermatology-focused.</p>
              <p className="mt-1">It supports text-first triage for skin, hair, and nail concerns.</p>
            </div>
          </div>
        </Card>

        <AIConsultationWizard />
      </div>
    </PortalDashboardShell>
  );
}
