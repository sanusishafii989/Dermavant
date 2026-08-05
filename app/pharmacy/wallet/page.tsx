import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { pharmacyNavLinks } from "@/lib/portal-nav";
import { connectDB } from "@/lib/db";
import { Medicine, Partner, Patient, PharmacyOrder, User, Wallet } from "@/models";
import { TrendingUp, Wallet as WalletIcon, Clock, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PharmacyWalletPage() {
  const user = await currentUser();
  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Partner";

  await connectDB();

  const userDoc = await User.findOne({ clerkId: user?.id }).lean();
  const partner = userDoc
    ? await Partner.findOne({ email: userDoc.email }).lean()
    : null;

  let walletBalance = 0;
  let totalRevenue = 0;
  let pendingRevenue = 0;
  let paidOrdersCount = 0;
  let totalMedicines = 0;
  let transactions: any[] = [];

  if (partner) {
    const wallet = await Wallet.findOne({ ownerId: userDoc!._id as any }).lean();
    if (wallet) {
      walletBalance = wallet.balance ?? 0;
    }

    const orders = await PharmacyOrder.find({ partner_id: partner._id } as any)
      .sort({ created_at: -1 })
      .lean();

    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const pendingOrders = orders.filter((o) => o.payment_status === "pending");

    totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    paidOrdersCount = paidOrders.length;
    totalMedicines = await Medicine.countDocuments({ partner_id: partner._id, status: "active" } as any);

    // Get patient names for transactions
    const patientIds = [...new Set(paidOrders.map((o) => o.patient_id?.toString()))];
    const patients = await Promise.all(
      patientIds.map((id) => id ? Patient.findById(id).lean() : null)
    );
    const patientUserIds = [...new Set(patients.filter(Boolean).map((p: any) => p.user_id?.toString()))];
    const patientUsers = await User.find({ _id: { $in: patientUserIds } }).lean();
    const userMap = new Map(patientUsers.map((u) => [u._id.toString(), u]));
    const patientMap = new Map(patients.filter(Boolean).map((p: any) => [p._id.toString(), p]));

    transactions = paidOrders.slice(0, 10).map((order) => {
      const patient = patientMap.get(order.patient_id?.toString());
      const patientUser = patient ? userMap.get(patient.user_id?.toString()) : null;
      return {
        _id: order._id.toString(),
        order_id: order.order_id,
        amount: order.total,
        patient_name: patientUser?.fullName || "Unknown patient",
        delivery_status: order.delivery_status,
        created_at: order.created_at,
      };
    });
  }

  return (
    <PortalDashboardShell title="E-Pharmacy Portal" links={pharmacyNavLinks}>
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-navy/60 to-cyan/10">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan/15 text-cyan">
              <WalletIcon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan">Wallet balance</p>
              <p className="mt-1 text-4xl font-bold text-white">₦{walletBalance.toLocaleString()}</p>
              <p className="mt-1 text-sm text-white/60">Available balance</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Total revenue</p>
                <p className="text-xl font-bold text-white">₦{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Pending</p>
                <p className="text-xl font-bold text-white">₦{pendingRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Paid orders</p>
                <p className="text-xl font-bold text-white">{paidOrdersCount}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Active medicines</p>
                <p className="text-xl font-bold text-white">{totalMedicines}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan">Transaction history</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Paid pharmacy orders</h2>
          </div>

          {transactions.length === 0 ? (
            <p className="py-8 text-center text-white/60">No transactions yet. Revenue from medicine orders will appear here.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
                      <WalletIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white">₦{tx.amount.toLocaleString()}</p>
                      <p className="text-sm text-white/60">{tx.patient_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/50">
                      {new Date(tx.created_at).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <Badge variant={tx.delivery_status === "delivered" ? "success" : "cyan"}>
                      {tx.delivery_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PortalDashboardShell>
  );
}
