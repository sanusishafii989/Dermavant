import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { pharmacyNavLinks } from "@/lib/portal-nav";
import { connectDB } from "@/lib/db";
import { Medicine, Partner, Patient, PharmacyOrder, User, Wallet } from "@/models";
import { PharmacyWalletClient } from "@/components/pharmacy/PharmacyWalletClient";

export const dynamic = "force-dynamic";

const PHARMACY_COMMISSION_RATE = 5;

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
    if (wallet) walletBalance = wallet.balance ?? 0;

    const orders = await PharmacyOrder.find({ partner_id: partner._id } as any)
      .sort({ created_at: -1 })
      .lean();

    const paidOrders = orders.filter((o) => o.payment_status === "paid");
    const pendingOrders = orders.filter((o) => o.payment_status === "pending");

    totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    paidOrdersCount = paidOrders.length;
    totalMedicines = await Medicine.countDocuments({ partner_id: partner._id, status: "active" } as any);

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
        amount: order.total,
        patient_name: patientUser?.fullName || "Unknown patient",
        delivery_status: order.delivery_status,
        created_at: order.created_at,
      };
    });
  }

  return (
    <PortalDashboardShell title="E-Pharmacy Portal" links={pharmacyNavLinks}>
      <PharmacyWalletClient
        initialBalance={walletBalance}
        initialRevenue={totalRevenue}
        initialPending={pendingRevenue}
        initialPaidCount={paidOrdersCount}
        initialMedicines={totalMedicines}
        initialTransactions={transactions}
        commissionRate={PHARMACY_COMMISSION_RATE}
      />
    </PortalDashboardShell>
  );
}
