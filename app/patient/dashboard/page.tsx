import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { patientNavLinks } from "@/lib/portal-nav";
import { connectDB } from "@/lib/db";
import { Appointment, Patient, PharmacyOrder, User, Wallet, AIReport } from "@/models";
import { Calendar, Wallet as WalletIcon, Package, Brain } from "lucide-react";

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

  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Patient";

  // Fetch live data
  await connectDB();
  const userDoc = await User.findOne({ clerkId: user?.id }).lean();
  const patient = userDoc ? await Patient.findOne({ user_id: userDoc._id as any }).lean() : null;

  let upcomingCount = 0;
  let walletBalance = 0;
  let activeOrders = 0;
  let aiReportsCount = 0;

  if (patient) {
    upcomingCount = await Appointment.countDocuments({
      patient_id: patient._id as any,
      consultation_status: "scheduled",
    } as any);

    const wallet = await Wallet.findOne({ ownerId: userDoc!._id as any }).lean();
    if (wallet) walletBalance = wallet.balance ?? 0;

    activeOrders = await PharmacyOrder.countDocuments({
      patient_id: patient._id as any,
      delivery_status: { $in: ["pending", "processing", "shipped"] },
    } as any);

    aiReportsCount = await AIReport.countDocuments({
      patient_id: patient._id as any,
    } as any);
  }

  const stats = [
    { label: "Upcoming", value: upcomingCount, icon: <Calendar className="h-5 w-5" />, color: "text-[var(--accent-cyan)]" },
    { label: "Wallet", value: `₦${walletBalance.toLocaleString()}`, icon: <WalletIcon className="h-5 w-5" />, color: "text-[var(--accent-gold)]" },
    { label: "Active orders", value: activeOrders, icon: <Package className="h-5 w-5" />, color: "text-emerald-500" },
    { label: "AI reports", value: aiReportsCount, icon: <Brain className="h-5 w-5" />, color: "text-[var(--accent-cyan)]" },
  ];

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

            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={stat.color}>{stat.icon}</span>
                    <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">{stat.label}</p>
                  </div>
                  <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                </div>
              ))}
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
