import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { doctorNavLinks } from "@/lib/portal-nav";
import { ROLE_DASHBOARD } from "@/lib/roles";
import { connectDB } from "@/lib/db";
import { Appointment, Doctor, Patient, Payment, User } from "@/models";
import Link from "next/link";
import { Calendar, CheckCircle, Clock, Star, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

function StatCard({
  icon,
  label,
  value,
  variant = "cyan",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  variant?: "cyan" | "gold" | "success";
}) {
  const colorMap = {
    cyan: "text-[var(--accent-cyan)]",
    gold: "text-[var(--accent-gold)]",
    success: "text-emerald-400",
  };
  return (
    <Card className="space-y-2">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-card)] ${colorMap[variant]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });
}

export default async function DoctorDashboardPage() {
  const debugError: string | null = null;

  try {
    const user = await currentUser();

    // Enforce role — redirect if not a doctor
    const userRole = (user as any)?.publicMetadata?.role;
    if (userRole && userRole !== "doctor") {
      redirect(ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD] || "/");
    }

    if (!user) {
      redirect("/sign-in");
    }

    const fullName =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      "Doctor";

    await connectDB();

    const userDoc = await User.findOne({ clerkId: user.id }).lean();
    const doctor = userDoc
      ? await Doctor.findOne({ user_id: userDoc._id as any }).lean()
      : null;

    let upcomingAppointments: any[] = [];
    let completedCount = 0;
    let scheduledCount = 0;
    let totalEarnings = 0;
    let recentPayments: any[] = [];

    if (doctor) {
      const now = new Date();

      upcomingAppointments = await Appointment.find({
        doctor_id: doctor._id as any,
        consultation_status: "scheduled",
        date: { $gte: now },
      } as any)
        .sort({ date: 1 })
        .limit(5)
        .lean();

      const patientIds = [...new Set(upcomingAppointments.map((apt) => apt.patient_id?.toString()))];
      const patients = await Promise.all(
        patientIds.map((id) =>
          id ? Patient.findById(id).lean() : null
        )
      );
      const patientUserIds = [...new Set(patients.filter(Boolean).map((p: any) => p.user_id?.toString()))];
      const patientUsers = await User.find({ _id: { $in: patientUserIds } }).lean();
      const userMap = new Map(patientUsers.map((u) => [u._id.toString(), u]));
      const patientMap = new Map(patients.filter(Boolean).map((p: any) => [p._id.toString(), p]));

      upcomingAppointments = upcomingAppointments.map((apt) => {
        const patient = patientMap.get(apt.patient_id?.toString());
        const patientUser = patient ? userMap.get(patient.user_id?.toString()) : null;
        return {
          ...apt,
          _id: apt._id.toString(),
          patient_name: patientUser?.fullName || "Unknown patient",
        };
      });

      completedCount = await Appointment.countDocuments({
        doctor_id: doctor._id as any,
        consultation_status: "completed",
      } as any);

      scheduledCount = await Appointment.countDocuments({
        doctor_id: doctor._id as any,
        consultation_status: "scheduled",
      } as any);

      const allAptIds = (await Appointment.find({ doctor_id: doctor._id as any } as any)
        .select("_id")
        .lean()).map((apt) => apt._id);

      const payments = await Payment.find({
        appointment_id: { $in: allAptIds },
        status: "success",
      } as any)
        .sort({ paid_at: -1 })
        .lean();

      totalEarnings = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      recentPayments = payments.slice(0, 5);
    }

    return (
      <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <div className="space-y-6">
        {/* Welcome */}
        <Card className="max-w-3xl">
          <div className="flex items-center gap-4">
            <Avatar src={user?.imageUrl} name={fullName} size="lg" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Welcome back</p>
              <h1 className="mt-1 text-3xl font-bold text-[var(--text-primary)]">{fullName}</h1>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="gold">doctor</Badge>
                {doctor?.status === "verified" ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="warning">Pending verification</Badge>
                )}
                {doctor?.available_today ? (
                  <Badge variant="cyan">Available today</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Calendar className="h-5 w-5" />}
            label="Upcoming"
            value={scheduledCount}
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Completed"
            value={completedCount}
            variant="success"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5" />}
            label="Total earnings"
            value={`₦${totalEarnings.toLocaleString()}`}
            variant="gold"
          />
          <StatCard
            icon={<Star className="h-5 w-5" />}
            label="Rating"
            value={doctor?.rating ? doctor.rating.toFixed(1) : "—"}
            variant="gold"
          />
        </div>

        {/* Upcoming appointments preview */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Upcoming appointments</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Next consultations</h2>
            </div>
            <Link href="/doctor/appointments" className="text-sm text-[var(--accent-cyan)] hover:underline">
              View all
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <p className="py-6 text-center text-[var(--text-secondary)]">No upcoming appointments scheduled.</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{apt.patient_name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{formatDate(apt.date)} at {apt.time}</p>
                    </div>
                  </div>
                  <Badge variant="cyan" className="capitalize">{apt.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent earnings */}
        <Card>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Recent earnings</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Latest payments</h2>
          </div>

          {recentPayments.length === 0 ? (
            <p className="py-6 text-center text-[var(--text-secondary)]">No payments received yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div
                  key={payment._id.toString()}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">₦{payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">{payment.channel || "paystack"}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PortalDashboardShell>
    );
  } catch (err) {
    const error = err as Error;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="max-w-lg rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h1 className="text-xl font-bold text-red-400">Dashboard Error (debug)</h1>
          <pre className="mt-4 overflow-auto text-sm text-red-300">
            {error.message}
            {error.stack}
          </pre>
        </div>
      </div>
    );
  }
}
