import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { adminNavLinks } from "@/lib/portal-nav";
import { connectDB } from "@/lib/db";
import {
  User,
  Doctor,
  Partner,
  Appointment,
  PharmacyOrder,
  AIReport,
  WalletTransaction,
  SupportTicket,
} from "@/models";
import {
  Users,
  ShieldCheck,
  Headphones,
  DollarSign,
  Calendar,
  Package,
  Activity,
  ArrowUpRight,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await currentUser();
  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Admin";

  await connectDB();

  // Aggregate Metrics from Database
  const [
    totalPatients,
    totalDoctors,
    totalPartners,
    pendingDoctorsCount,
    pendingPartnersCount,
    totalAppointments,
    totalPharmacyOrders,
    totalAIReports,
    openTicketsCount,
    pendingVerifications,
    recentTransactions,
  ] = await Promise.all([
    User.countDocuments({ role: "patient" }),
    User.countDocuments({ role: "doctor" }),
    User.countDocuments({ role: "partner" }),
    Doctor.countDocuments({ status: "pending" }),
    Partner.countDocuments({ status: "pending" }),
    Appointment.countDocuments(),
    PharmacyOrder.countDocuments(),
    AIReport.countDocuments(),
    SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    // Fetch pending doctors/partners for quick review
    Doctor.find({ status: "pending" })
      .populate({ path: "user_id", select: "fullName email phone profilePhoto createdAt" })
      .limit(4)
      .lean(),
    WalletTransaction.find({ status: "success" })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
  ]);

  // Aggregate Revenue Volume
  const revenueStats = await WalletTransaction.aggregate([
    { $match: { status: "success" } },
    { $group: { _id: "$purpose", total: { $sum: "$amount" } } },
  ]);

  const revMap = new Map(revenueStats.map((r: any) => [r._id, r.total]));
  const consultationVol = revMap.get("consultation_payment") || 0;
  const pharmacyVol = revMap.get("pharmacy_order") || 0;
  const aiSuiteVol = revMap.get("ai_suite_payment") || 0;

  // Platform commissions (30% consultation, ~25% pharmacy margin)
  const estDoctorComm = Math.round(consultationVol * 0.3);
  const estPharmMargin = Math.round(pharmacyVol * 0.25);
  const totalPlatformEarned = estDoctorComm + estPharmMargin + aiSuiteVol;

  const totalUsersCount = totalPatients + totalDoctors + totalPartners;
  const totalPendingCount = pendingDoctorsCount + pendingPartnersCount;

  return (
    <PortalDashboardShell title="Admin Portal" links={adminNavLinks}>
      <div className="space-y-8">
        {/* Welcome Header */}
        <Card className="relative overflow-hidden bg-gradient-to-r from-navy/90 via-dark/95 to-navy/80 border-cyan/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar src={user?.imageUrl} name={fullName} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan font-semibold">
                    System Control Center
                  </p>
                  <Badge variant="gold">super admin</Badge>
                </div>
                <h1 className="mt-1 text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Welcome, {fullName}
                </h1>
                <p className="mt-1 text-sm text-white/70">
                  Platform Status: <span className="text-emerald-400 font-medium">Fully Operational</span> (99.9% Uptime)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan/20 px-4 py-2.5 text-xs font-semibold text-cyan border border-cyan/30 hover:bg-cyan/30 transition-all"
              >
                <UserCheck className="h-4 w-4" /> Manage Accounts
              </Link>
              <Link
                href="/admin/support"
                className="inline-flex items-center gap-2 rounded-xl bg-gold/20 px-4 py-2.5 text-xs font-semibold text-gold border border-gold/30 hover:bg-gold/30 transition-all"
              >
                <Headphones className="h-4 w-4" /> Support Queue ({openTicketsCount})
              </Link>
            </div>
          </div>
        </Card>

        {/* Core KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hover className="space-y-3 border-cyan/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Total Ecosystem Users</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/10 text-cyan border border-cyan/20">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{totalUsersCount}</p>
              <p className="mt-1 text-xs text-white/50">
                {totalPatients} Patients • {totalDoctors} Doctors • {totalPartners} Pharmacists
              </p>
            </div>
          </Card>

          <Card hover className="space-y-3 border-amber-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Pending Verifications</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{totalPendingCount}</p>
              <p className="mt-1 text-xs text-white/50">
                {pendingDoctorsCount} Doctors • {pendingPartnersCount} Pharmacists awaiting review
              </p>
            </div>
          </Card>

          <Card hover className="space-y-3 border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Est. Platform Revenue</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">
                ₦{(totalPlatformEarned / 100).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-white/50">Commissions & AI Suite revenue</p>
            </div>
          </Card>

          <Card hover className="space-y-3 border-purple-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Open Support Tickets</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Headphones className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{openTicketsCount}</p>
              <p className="mt-1 text-xs text-white/50">User queries needing admin reply</p>
            </div>
          </Card>
        </div>

        {/* Operational Performance & Pending Actions Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Operations Summary */}
          <Card className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Ecosystem Activity & Operations</h3>
                <p className="text-xs text-white/60">Live metrics across all 4 portal instances</p>
              </div>
              <Badge variant="cyan">Real-time sync</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/5 p-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-cyan">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase">Consultations</span>
                </div>
                <p className="text-2xl font-bold text-white">{totalAppointments}</p>
                <p className="text-xs text-white/50">Booked consultations</p>
              </div>

              <div className="rounded-xl bg-white/5 p-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-gold">
                  <Package className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase">Pharmacy Orders</span>
                </div>
                <p className="text-2xl font-bold text-white">{totalPharmacyOrders}</p>
                <p className="text-xs text-white/50">Prescriptions & deliveries</p>
              </div>

              <div className="rounded-xl bg-white/5 p-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Activity className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase">AI Suite Runs</span>
                </div>
                <p className="text-2xl font-bold text-white">{totalAIReports}</p>
                <p className="text-xs text-white/50">Diagnostic triage reports</p>
              </div>
            </div>

            {/* Platform Revenue Breakdown */}
            <div className="rounded-xl bg-dark/60 p-4 border border-white/10 space-y-3">
              <h4 className="text-xs uppercase font-semibold text-white/70 tracking-wider">
                Financial Revenue Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-white/80">
                  <span>Doctor Consultations (30% Platform Comm)</span>
                  <span className="font-semibold text-white">₦{((consultationVol * 0.3) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-white/80">
                  <span>Pharmacy Sales (~25% Platform Margin)</span>
                  <span className="font-semibold text-white">₦{((pharmacyVol * 0.25) / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-white/80">
                  <span>Clinical AI Suite Direct Subscriptions</span>
                  <span className="font-semibold text-white">₦{(aiSuiteVol / 100).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Pending Verifications Widget */}
          <Card className="space-y-4 border-amber-500/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="text-base font-bold text-white">Pending Verification</h3>
              </div>
              <Link href="/admin/users?status=pending_verification" className="text-xs text-cyan hover:underline flex items-center">
                View All <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </div>

            {pendingVerifications.length === 0 ? (
              <div className="py-8 text-center text-white/50 text-xs">
                <UserCheck className="mx-auto h-8 w-8 text-emerald-400/60 mb-2" />
                No pending credential verifications. All providers verified!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingVerifications.map((doc: any) => (
                  <div
                    key={doc._id.toString()}
                    className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-white/5 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-white">{doc.user_id?.fullName || "Doctor Application"}</p>
                      <p className="text-xs text-white/50">{doc.specialization} • Lic: {doc.license_number}</p>
                    </div>
                    <Link
                      href="/admin/users"
                      className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Ledger Activity */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold text-white">Recent System Transactions</h3>
            <span className="text-xs text-white/50">Audit reference logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/80">
              <thead className="border-b border-white/10 bg-white/5 text-xs text-white/60 uppercase">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-white/40">
                      No recent financial transactions logged.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx: any) => (
                    <tr key={tx._id.toString()} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-cyan">{tx.reference}</td>
                      <td className="px-4 py-3 capitalize">{tx.purpose.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3 font-semibold text-white">₦{(tx.amount / 100).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge variant={tx.status === "success" ? "success" : "warning"}>{tx.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-white/50">
                        {new Date(tx.createdAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PortalDashboardShell>
  );
}
