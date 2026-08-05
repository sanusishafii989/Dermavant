import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { doctorNavLinks } from "@/lib/portal-nav";
import { connectDB } from "@/lib/db";
import { Appointment, Doctor, Payment, Wallet, User } from "@/models";
import { DoctorWalletClient } from "@/components/doctor/DoctorWalletClient";

export const dynamic = "force-dynamic";

export default async function DoctorWalletPage() {
  const user = await currentUser();
  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Doctor";

  await connectDB();

  const userDoc = await User.findOne({ clerkId: user?.id }).lean();
  const doctor = userDoc
    ? await Doctor.findOne({ user_id: userDoc._id as any }).lean()
    : null;

  let walletBalance = 0;
  let totalEarnings = 0;
  let pendingEarnings = 0;
  let completedPaidCount = 0;
  let transactions: any[] = [];

  if (doctor) {
    const wallet = await Wallet.findOne({ ownerId: userDoc!._id as any }).lean();
    if (wallet) {
      walletBalance = wallet.balance ?? 0;
    }

    const allApts = await Appointment.find({ doctor_id: doctor._id as any } as any).lean();
    const aptIds = allApts.map((apt) => apt._id);

    const allPayments = await Payment.find({
      appointment_id: { $in: aptIds },
    } as any)
      .sort({ paid_at: -1 })
      .lean();

    const successfulPayments = allPayments.filter((p) => p.status === "success");
    const pendingPayments = allPayments.filter((p) => p.status === "pending");

    totalEarnings = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    pendingEarnings = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    completedPaidCount = successfulPayments.length;

    transactions = successfulPayments.slice(0, 10).map((payment) => {
      const apt = allApts.find((a) => a._id.toString() === payment.appointment_id?.toString());
      return {
        _id: payment._id.toString(),
        amount: payment.amount,
        reference: payment.reference,
        channel: payment.channel || "paystack",
        status: payment.status,
        paid_at: payment.paid_at,
        appointment_date: apt?.date,
      };
    });
  }

  return (
    <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <DoctorWalletClient
        initialBalance={walletBalance}
        initialEarnings={totalEarnings}
        initialPending={pendingEarnings}
        initialPaidCount={completedPaidCount}
        initialTransactions={transactions}
      />
    </PortalDashboardShell>
  );
}
