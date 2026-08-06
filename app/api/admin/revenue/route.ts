import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Wallet, WalletTransaction } from "@/models";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const adminUser = await User.findOne({ clerkId: userId }).lean();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const adminWallet = await Wallet.findOne({ ownerRole: "admin" }).lean();

    const [
      consultationVolume,
      pharmacyOrderVolume,
      aiSuiteVolume,
      topupVolume,
      withdrawalVolume,
      allTransactions,
    ] = await Promise.all([
      WalletTransaction.aggregate([
        { $match: { purpose: "consultation_payment", status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      WalletTransaction.aggregate([
        { $match: { purpose: "pharmacy_order", status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      WalletTransaction.aggregate([
        { $match: { purpose: "ai_suite_payment", status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      WalletTransaction.aggregate([
        { $match: { purpose: "topup", status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      WalletTransaction.aggregate([
        { $match: { purpose: "withdrawal", status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      WalletTransaction.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    const totalConsultation = consultationVolume[0]?.total || 0;
    const totalPharmacy = pharmacyOrderVolume[0]?.total || 0;
    const totalAISuite = aiSuiteVolume[0]?.total || 0;

    // Platform commissions calculation based on spec rates (30% consultation, ~25% pharmacy margin)
    const estimatedDoctorCommission = Math.round(totalConsultation * 0.30);
    const estimatedPharmacyMargin = Math.round(totalPharmacy * 0.25);
    const totalPlatformRevenue = estimatedDoctorCommission + estimatedPharmacyMargin + totalAISuite;

    return NextResponse.json({
      ok: true,
      revenue: {
        adminWalletBalance: adminWallet?.balance || 0,
        currency: adminWallet?.currency || "NGN",
        totals: {
          platformRevenue: totalPlatformRevenue,
          consultationVolume: totalConsultation,
          pharmacyOrderVolume: totalPharmacy,
          aiSuiteVolume: totalAISuite,
          topupVolume: topupVolume[0]?.total || 0,
          withdrawalVolume: withdrawalVolume[0]?.total || 0,
          doctorCommissionEarned: estimatedDoctorCommission,
          pharmacyMarginEarned: estimatedPharmacyMargin,
        },
        transactions: allTransactions.map((tx: any) => ({
          _id: tx._id.toString(),
          type: tx.type,
          purpose: tx.purpose,
          amount: tx.amount,
          reference: tx.reference,
          status: tx.status,
          gateway: tx.gateway,
          createdAt: tx.createdAt,
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch platform revenue stats", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
