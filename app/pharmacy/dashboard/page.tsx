import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MobileList, MobileListItem } from "@/components/ui/MobileList";
import { pharmacyNavLinks } from "@/lib/portal-nav";
import { ROLE_DASHBOARD } from "@/lib/roles";
import { ensurePartnerProfile } from "@/lib/ensure-partner";
import { connectDB } from "@/lib/db";
import { Medicine, Partner, Patient, PharmacyOrder, User } from "@/models";
import { Package, ClipboardList, TrendingUp, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PharmacyDashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Enforce role — redirect if not a partner
  const userRole = (user as any)?.publicMetadata?.role;
  if (userRole && userRole !== "partner") {
    redirect(ROLE_DASHBOARD[userRole as keyof typeof ROLE_DASHBOARD] || "/");
  }

  const fullName =
    user.fullName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Partner";

  await connectDB();

  const userDoc = await User.findOne({ clerkId: user.id }).lean();
  const partner = userDoc ? await ensurePartnerProfile(userDoc as any) : null;

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
      <div className="space-y-6 max-w-5xl mx-auto">
        <PageHeader 
          title={`Welcome back, ${fullName}`}
          description="Manage inventory, process orders, and view your revenue stream."
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="cyan">Partner</Badge>
              {partner?.status === "verified" ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Pending verification</Badge>
              )}
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-accent-cyan">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Medicines</p>
                <p className="text-2xl font-bold text-primary">{totalMedicines}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-warning">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Pending orders</p>
                <p className="text-2xl font-bold text-primary">{pendingOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-success">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Active orders</p>
                <p className="text-2xl font-bold text-primary">{activeOrders}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-accent-gold">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Revenue</p>
                <p className="text-2xl font-bold text-primary">₦{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <SectionHeader 
            title="Recent orders"
            description="Latest pharmacy orders"
          />

          {recentOrders.length === 0 ? (
            <EmptyState 
              title="No orders yet"
              description="Orders will appear here when patients purchase medicines."
              className="py-12"
            />
          ) : (
            <MobileList>
              {recentOrders.map((order) => (
                <MobileListItem
                  key={order._id}
                  icon={<ClipboardList className="h-5 w-5" />}
                  title={order.patient_name}
                  subtitle={new Date(order.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                  status={
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-medium text-primary">₦{order.total.toLocaleString()}</span>
                      <div className="flex gap-1">
                        <Badge variant={order.payment_status === "paid" ? "success" : "warning"}>
                          {order.payment_status}
                        </Badge>
                        <Badge variant={order.delivery_status === "delivered" ? "success" : "cyan"}>
                          {order.delivery_status}
                        </Badge>
                      </div>
                    </div>
                  }
                />
              ))}
            </MobileList>
          )}
        </div>
      </div>
    </PortalDashboardShell>
  );
}
