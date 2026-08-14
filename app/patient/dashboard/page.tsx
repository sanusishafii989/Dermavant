import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { patientNavLinks } from "@/lib/portal-nav";
import { ROLE_DASHBOARD } from "@/lib/roles";

export const dynamic = "force-dynamic";

const serviceCards = [
  {
    title: "Start AI Consultation",
    description: "Open your guided clinical assistant for symptom triage and next steps.",
    href: "/patient/dashboard/start-ai-consultation",
    accent: "border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10",
  },
  {
    title: "Book Specialist",
    description: "Choose a specialist and reserve your visit in a single flow.",
    href: "/patient/dashboard/book-specialist",
    accent: "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/10",
  },
  {
    title: "Nearby Doctors",
    description: "Find medical professionals close to your current location.",
    href: "/patient/dashboard/nearby-doctors",
    accent: "border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10",
  },
  {
    title: "Nearby Pharmacies",
    description: "Locate nearby licensed partners and quick-access prescriptions.",
    href: "/patient/dashboard/nearby-pharmacies",
    accent: "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/10",
  },
  {
    title: "Medical History",
    description: "Review care records, reports, and treatment milestones.",
    href: "/patient/dashboard/medical-history",
    accent: "border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10",
  },
  {
    title: "Clinical AI Suite",
    description: "Use advanced AI tools to summarize and guide ongoing care.",
    href: "/patient/dashboard/start-ai-consultation",
    accent: "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/10",
  },
  {
    title: "Global E-Pharmacy",
    description: "Browse essential medicines and trusted partner fulfillment.",
    href: "/patient/pharmacy",
    accent: "border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10",
  },
  {
    title: "Emergency Services",
    description: "Quick access to urgent response, emergency support, and escalation.",
    href: "/patient/dashboard/emergency-services",
    accent: "border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/10",
  },
];

export default async function PatientDashboardPage() {
  const user = await currentUser();

  // Enforce role — redirect if not a patient
  const userRole = (user as any)?.publicMetadata?.role;
  if (userRole && userRole !== "patient") {
    redirect(ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD] || "/");
  }

  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Patient";

  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <div className="space-y-6">
        <Card className="max-w-5xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar src={user?.imageUrl} name={fullName} size="lg" />
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-[var(--accent-cyan)]">Welcome back</p>
                <h1 className="mt-1 text-3xl font-bold text-[var(--text-primary)]">{fullName}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="cyan">patient</Badge>
                  <Badge variant="gold">AI care portal</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--text-primary)]">Today&apos;s care snapshot</p>
              <p className="mt-1">Your dashboard shell is active and ready for future care flows.</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {serviceCards.map((item) => (
            <Link key={item.title} href={item.href} className="group block h-full">
              <Card
                hover
                className={`h-full border ${item.accent} transition-transform duration-200 group-hover:-translate-y-1`}
              >
                <div className="flex h-full flex-col justify-between gap-5">
                  <div>
                    <div className="mb-3 inline-flex rounded-full bg-[var(--bg-card)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent-cyan)]">
                      Service
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">{item.title}</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-[var(--accent-cyan)]">
                    <span>Open</span>
                    <span aria-hidden="true">→</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PortalDashboardShell>
  );
}
