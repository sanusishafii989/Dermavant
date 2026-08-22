import { currentUser } from "@clerk/nextjs/server";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { doctorNavLinks } from "@/lib/portal-nav";
import { connectDB } from "@/lib/db";
import { COMMISSION } from "@/lib/commission";
import { Doctor, User, Wallet, WalletTransaction } from "@/models";
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
  let completedPaidCount = 0;
  let transactions: any[] = [];

  if (doctor && userDoc) {
    const wallet = await Wallet.findOne({ ownerId: userDoc._id as any }).lean();
    if (wallet) {
      walletBalance = wallet.balance ?? 0;
    }

    // Use WalletTransaction for accurate earnings (credits - debits)
    const allTransactions = await WalletTransaction.find({
      wallet_id: wallet?._id as any,
    } as any).sort({ created_at: -1 }).lean();

    const credits = allTransactions.filter((t) => t.direction === "credit" && t.status === "completed");
    totalEarnings = credits.reduce((sum, t) => sum + (t.amount || 0), 0);
    completedPaidCount = credits.length;

    transactions = credits.slice(0, 10).map((tx) => ({
      _id: tx._id.toString(),
      amount: tx.amount,
      reference: tx.reference,
      channel: (tx.metadata as any)?.payment_method || "wallet",
      status: tx.status,
      paid_at: tx.created_at,
      appointment_date: (tx.metadata as any)?.appointment_id,
    }));
  }

  return (
    <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <DoctorWalletClient
        initialBalance={walletBalance}
        initialEarnings={totalEarnings}
        initialPending={0}
        initialPaidCount={completedPaidCount}
        initialTransactions={transactions}
        commissionRate={COMMISSION.DOCTOR_RATE}
      />
    </PortalDashboardShell>
  );
}
