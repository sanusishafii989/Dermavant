import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
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

    const [
      totalPatients,
      totalDoctors,
      totalPartners,
      totalAdmins,
      pendingDoctors,
      pendingPartners,
      suspendedUsers,
      totalAppointments,
      totalPharmacyOrders,
      totalAIReports,
      openSupportTickets,
      recentTransactions,
    ] = await Promise.all([
      User.countDocuments({ role: "patient" }),
      User.countDocuments({ role: "doctor" }),
      User.countDocuments({ role: "partner" }),
      User.countDocuments({ role: "admin" }),
      Doctor.countDocuments({ status: "pending" }),
      Partner.countDocuments({ status: "pending" }),
      User.countDocuments({ status: "suspended" }),
      Appointment.countDocuments(),
      PharmacyOrder.countDocuments(),
      AIReport.countDocuments(),
      SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
      WalletTransaction.find({ status: "success" })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Calculate total platform transaction volume (in kobo/naira depending on schema)
    const transactionStats = await WalletTransaction.aggregate([
      { $match: { status: "success" } },
      { $group: { _id: null, totalVolume: { $sum: "$amount" } } },
    ]);

    const totalVolume = transactionStats[0]?.totalVolume || 0;

    return NextResponse.json({
      ok: true,
      stats: {
        users: {
          patients: totalPatients,
          doctors: totalDoctors,
          partners: totalPartners,
          admins: totalAdmins,
          total: totalPatients + totalDoctors + totalPartners + totalAdmins,
          suspended: suspendedUsers,
        },
        verifications: {
          pendingDoctors,
          pendingPartners,
          totalPending: pendingDoctors + pendingPartners,
        },
        operations: {
          appointments: totalAppointments,
          pharmacyOrders: totalPharmacyOrders,
          aiReports: totalAIReports,
          openTickets: openSupportTickets,
        },
        financials: {
          totalVolume,
          recentTransactions: recentTransactions.map((tx: any) => ({
            id: tx._id.toString(),
            type: tx.type,
            purpose: tx.purpose,
            amount: tx.amount,
            reference: tx.reference,
            createdAt: tx.createdAt,
          })),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch admin stats", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
