import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MobileList, MobileListItem } from "@/components/ui/MobileList";
import { StatusAlert } from "@/components/ui/StatusAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { patientNavLinks } from "@/lib/portal-nav";
import { connectDB } from "@/lib/db";
import { Appointment, Patient, PharmacyOrder, User, Wallet, AIReport } from "@/models";
import { Calendar, Wallet as WalletIcon, Package, Brain, Plus, Activity, Clock, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PatientDashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const fullName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Patient";

  let upcomingCount = 0;
  let walletBalance = 0;
  let activeOrders = 0;
  let aiReportsCount = 0;
  let recentAppointments: any[] = [];
  let dashboardDataUnavailable = false;

  try {
    await connectDB();
    const userDoc = await User.findOne({ clerkId: user.id }).lean();
    const patient = userDoc
      ? await Patient.findOne({ user_id: userDoc._id as any }).lean()
      : null;

    if (patient && userDoc) {
      upcomingCount = await Appointment.countDocuments({
        patient_id: patient._id as any,
        consultation_status: "scheduled",
      } as any);

      recentAppointments = await Appointment.find({
        patient_id: patient._id as any,
      })
        .sort({ consultation_date: -1 })
        .limit(3)
        .lean();

      const wallet = await Wallet.findOne({ ownerId: userDoc._id as any }).lean();
      if (wallet) walletBalance = wallet.balance ?? 0;

      activeOrders = await PharmacyOrder.countDocuments({
        patient_id: patient._id as any,
        delivery_status: { $in: ["pending", "processing", "shipped"] },
      } as any);

      aiReportsCount = await AIReport.countDocuments({
        patient_id: patient._id as any,
      } as any);
    }
  } catch (error) {
    dashboardDataUnavailable = true;
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : undefined;
    console.error("[patient-dashboard] data load failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      code,
    });
  }

  const primaryAction = (
    <Button variant="primary" size="lg" className="w-full md:w-auto" asChild>
      <Link href="/patient/dashboard/start-ai-consultation">
        <Brain className="mr-2 h-5 w-5" />
        New AI Consultation
      </Link>
    </Button>
  );

  return (
    <PortalDashboardShell 
      title="Patient Portal" 
      links={patientNavLinks}
      primaryAction={primaryAction}
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        <PageHeader 
          title={`Welcome, ${fullName}`}
          description="Manage your health, appointments, and prescriptions from one secure location."
          actions={
            <div className="hidden md:block">
              {primaryAction}
            </div>
          }
        />

        {dashboardDataUnavailable && (
          <StatusAlert
            variant="warning"
            title="Dashboard data is temporarily unavailable"
            description="Your sign-in succeeded, but we couldn't load your dashboard information. Refresh the page in a moment."
          />
        )}

        {/* Highlighted Next Action Area */}
        {!dashboardDataUnavailable && upcomingCount === 0 && (
          <StatusAlert 
            variant="info" 
            title="You're up to date"
            description="You don't have any upcoming appointments. If you're feeling unwell, try our AI Consultation for instant triage."
            className="mb-8"
          />
        )}

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="col-span-1 md:col-span-3 bg-surface border-border flex flex-col justify-center items-start p-6 sm:p-8">
            <Badge variant="cyan" className="mb-4">Guided Triage</Badge>
            <h3 className="text-2xl font-semibold mb-2">Feeling Unwell?</h3>
            <p className="text-secondary mb-6 max-w-lg">
              Start an AI-guided consultation to assess your symptoms instantly. Our system will recommend the best next steps, whether it&apos;s resting at home or booking a specialist.
            </p>
            <Button variant="primary" asChild>
              <Link href="/patient/dashboard/start-ai-consultation">
                <Brain className="mr-2 h-4 w-4" />
                Start Triage Now
              </Link>
            </Button>
          </Card>

          <Card className="col-span-1 flex flex-col justify-center bg-surface-elevated">
            <SectionHeader title="Wallet Balance" className="mb-2" />
            <div className="text-3xl font-bold text-primary mb-1">
              ₦{walletBalance.toLocaleString()}
            </div>
            <Link href="/patient/dashboard/wallet" className="text-sm font-medium text-accent-cyan flex items-center hover:underline mt-4">
              <Plus className="h-4 w-4 mr-1" /> Add Funds
            </Link>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Quick Links Group */}
          <div className="space-y-4">
            <SectionHeader title="Quick Actions" />
            <div className="grid grid-cols-2 gap-4">
              <Link href="/patient/dashboard/book-specialist">
                <Card hover className="h-full flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div className="p-3 bg-accent-gold/10 text-accent-gold rounded-full">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="font-medium">Book Specialist</div>
                </Card>
              </Link>
              <Link href="/patient/pharmacy">
                <Card hover className="h-full flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div className="p-3 bg-accent-cyan/10 text-accent-cyan rounded-full">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="font-medium">Pharmacy</div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-4">
            <SectionHeader 
              title="Recent Activity" 
              actions={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/patient/dashboard/medical-history">View all</Link>
                </Button>
              }
            />
            {recentAppointments.length > 0 ? (
              <MobileList>
                {recentAppointments.map(apt => (
                  <MobileListItem 
                    key={apt._id.toString()}
                    icon={<Activity className="h-5 w-5" />}
                    title={apt.consultation_type || "Consultation"}
                    subtitle={new Date(apt.consultation_date).toLocaleDateString()}
                    status={<Badge variant="default">{apt.consultation_status}</Badge>}
                    actions={
                      <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
                        <Link href={`/patient/dashboard/appointments/${apt._id}`}>
                          View Details <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    }
                  />
                ))}
              </MobileList>
            ) : (
              <EmptyState 
                icon={<Clock className="h-6 w-6" />}
                title="No recent activity"
                description="Your recent appointments and reports will appear here."
                className="py-12"
              />
            )}
          </div>
        </div>
      </div>
    </PortalDashboardShell>
  );
}
