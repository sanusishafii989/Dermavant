import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { pharmacyNavLinks } from "@/lib/portal-nav";
import { connectDB } from "@/lib/db";
import { Medicine, Partner, Patient, PharmacyOrder, User } from "@/models";
import { Package, ClipboardList, TrendingUp, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PharmacyDashboardPage() {
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

  let totalMedicines = 0;
  let totalInventory = 0;
  let pendingOrders = 0;
  let activeOrders = 0;
  let totalRevenue = 0;
  let recentOrders: any[] = [];

  if (partner) {
    totalMedicines = await Medicine.countDocuments({ partner_id: partner._id, status: "active" } as any);
    
    const meds = await Medicine.find({ partner_id: partner._id, status: "active" } as any).lean();
    totalInventory = meds.reduce((sum, m) => sum + (m.quantity || 0), 0);

    const orders = await PharmacyOrder.find({ partner_id: partner._id } as any)
      .sort({ created_at: -1 })
      .lean();

    pendingOrders = orders.filter((o) => o.delivery_status === "pending").length;
    activeOrders = orders.filter((o) => ["pending", "processing", "shipped"].includes(o.delivery_status)).length;
    totalRevenue = orders
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    recentOrders = orders.slice(0, 5);

    // Get patient names for recent orders
    const patientIds = [...new Set(recentOrders.map((o) => o.patient_id?.toString()))];
    const patients = await Promise.all(
      patientIds.map((id) => id ? Patient.findById(id).lean() : null)
    );
    const patientUserIds = [...new Set(patients.filter(Boolean).map((p: any) => p.user_id?.toString()))];
    const patientUsers = await User.find({ _id: { $in: patientUserIds } }).lean();
    const userMap = new Map(patientUsers.map((u) => [u._id.toString(), u]));
    const patientMap = new Map(patients.filter(Boolean).map((p: any) => [p._id.toString(), p]));

    recentOrders = recentOrders.map((o) => {
      const patient = patientMap.get(o.patient_id?.toString());
      const patientUser = patient ? userMap.get(patient.user_id?.toString()) : null;
      return {
        ...o,
        _id: o._id.toString(),
        patient_name: patientUser?.fullName || "Unknown patient",
      };
    });
  }

  return (
    <PortalDashboardShell title="E-Pharmacy Portal" links={pharmacyNavLinks}>
      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-4">
            <Avatar src={user?.imageUrl} name={fullName} size="lg" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Welcome back</p>
              <h1 className="mt-1 text-3xl font-bold text-[var(--text-primary)]">{fullName}</h1>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="cyan">partner</Badge>
                {partner?.status === "verified" ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="warning">Pending verification</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Medicines</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalMedicines}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Pending orders</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{pendingOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Active orders</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{activeOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Revenue</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">₦{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Recent orders</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Latest pharmacy orders</h2>
          </div>

          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-[var(--text-secondary)]">No orders yet. Orders will appear here when patients purchase medicines.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{order.patient_name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {new Date(order.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--text-primary)]">₦{order.total.toLocaleString()}</span>
                    <Badge variant={order.payment_status === "paid" ? "success" : "warning"}>
                      {order.payment_status}
                    </Badge>
                    <Badge variant={order.delivery_status === "delivered" ? "success" : "cyan"}>
                      {order.delivery_status}
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
