import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { logAuditAction } from "@/lib/audit-logger";
import { User, Wallet, WalletTransaction } from "@/models";

const REQUIRED_APPROVALS = 2; // 2 other admins (not counting requester)

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const adminUser = await User.findOne({ clerkId: userId }).lean();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    let wallet = await Wallet.findOne({ ownerRole: "admin" }).lean();
    if (!wallet) {
      const created = await Wallet.create({ ownerId: adminUser._id, ownerRole: "admin", balance: 0, currency: "NGN" } as any);
      wallet = created.toObject();
    }

    const pendingWithdrawals = await WalletTransaction.find({
      type: "refund",
      direction: "debit",
      status: "pending",
    } as any).sort({ created_at: -1 }).lean();

    const completedWithdrawals = await WalletTransaction.find({
      type: "refund",
      direction: "debit",
      status: { $in: ["completed", "failed"] },
    } as any).sort({ created_at: -1 }).limit(20).lean();

    const totalAdmins = await User.countDocuments({ role: "admin" });

    return NextResponse.json({
      ok: true,
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
      },
      pendingWithdrawals: pendingWithdrawals.map((w) => ({
        id: w.transaction_id || w._id.toString(),
        reference: w.reference,
        amount: w.amount,
        description: w.description,
        createdAt: w.created_at,
        approvals: (w.metadata as any)?.approvals || [],
        approvalCount: ((w.metadata as any)?.approvals || []).length,
        requiredApprovals: REQUIRED_APPROVALS,
      })),
      completedWithdrawals: completedWithdrawals.map((w) => ({
        id: w.transaction_id || w._id.toString(),
        reference: w.reference,
        amount: w.amount,
        description: w.description,
        status: w.status,
        createdAt: w.created_at,
      })),
      totalAdmins,
      requiredApprovals: REQUIRED_APPROVALS,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Failed to load admin wallet", details: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { amount, bankName, accountNumber, accountName } = body;

    if (!amount || amount <= 0) return NextResponse.json({ ok: false, error: "Invalid amount" }, { status: 400 });
    if (!bankName || !accountNumber || !accountName) return NextResponse.json({ ok: false, error: "Bank details required" }, { status: 400 });

    await connectDB();
    const adminUser = await User.findOne({ clerkId: userId }).lean();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    let wallet = await Wallet.findOne({ ownerRole: "admin" });
    if (!wallet) {
      wallet = await Wallet.create({ ownerId: adminUser._id, ownerRole: "admin", balance: 0, currency: "NGN" } as any);
    }

    if (wallet.balance < amount) return NextResponse.json({ ok: false, error: "Insufficient balance" }, { status: 400 });

    const reference = `ADM-WDR-${Date.now()}`;
    const transaction = await WalletTransaction.create({
      wallet_id: wallet._id,
      patient_id: adminUser._id,
      type: "refund",
      amount,
      direction: "debit",
      currency: "NGN",
      status: "pending",
      reference,
      description: `Admin withdrawal to ${bankName} (${accountName}, ${accountNumber})`,
      metadata: {
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        request_type: "admin_withdrawal",
        requested_by: adminUser._id.toString(),
        requested_by_name: adminUser.fullName,
        approvals: [],
      },
    } as any);

    await logAuditAction({
      actorId: adminUser._id,
      actorRole: "admin",
      action: "withdrawal_requested",
      targetType: "WalletTransaction",
      targetId: transaction._id,
      metadata: { reference, amount, bankName, accountNumber },
    });

    return NextResponse.json({
      ok: true,
      message: `Withdrawal request created. Requires ${REQUIRED_APPROVALS} admin approvals.`,
      transaction: {
        id: transaction.transaction_id || transaction._id.toString(),
        reference,
        amount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Failed to create withdrawal", details: error?.message || String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { transactionId, action } = body;

    await connectDB();
    const adminUser = await User.findOne({ clerkId: userId }).lean();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const tx = await WalletTransaction.findOne({
      $or: [{ _id: transactionId }, { transaction_id: transactionId }],
      type: "refund",
      direction: "debit",
      status: "pending",
    } as any);

    if (!tx) return NextResponse.json({ ok: false, error: "Withdrawal request not found" }, { status: 404 });

    const metadata = tx.metadata as any;
    const approvals = metadata?.approvals || [];

    // Block self-approval
    if (approvals.some((a: any) => a.admin_id === adminUser._id.toString())) {
      return NextResponse.json({ ok: false, error: "You have already approved this withdrawal" }, { status: 400 });
    }

    // Block requester from approving their own withdrawal
    if (metadata?.requested_by === adminUser._id.toString()) {
      return NextResponse.json({ ok: false, error: "You cannot approve your own withdrawal request" }, { status: 403 });
    }

    if (action === "reject") {
      tx.status = "failed";
      metadata.rejectedBy = { admin_id: adminUser._id.toString(), admin_name: adminUser.fullName, rejected_at: new Date() };
      tx.metadata = metadata;
      await tx.save();

      await logAuditAction({
        actorId: adminUser._id,
        actorRole: "admin",
        action: "withdrawal_rejected",
        targetType: "WalletTransaction",
        targetId: tx._id,
        metadata: { reference: tx.reference, amount: tx.amount },
      });

      return NextResponse.json({ ok: true, message: "Withdrawal rejected" });
    }

    // Approve
    approvals.push({ admin_id: adminUser._id.toString(), admin_name: adminUser.fullName, approved_at: new Date() });
    metadata.approvals = approvals;
    tx.metadata = metadata;

    if (approvals.length >= REQUIRED_APPROVALS) {
      // Enough approvals — process withdrawal atomically
      tx.status = "completed";

      const wallet = await Wallet.findOne({ ownerRole: "admin" });
      if (!wallet) {
        return NextResponse.json({ ok: false, error: "Admin wallet not found. Cannot process withdrawal." }, { status: 500 });
      }

      // Atomic deduction — prevents double-spend
      const updatedWallet = await Wallet.findOneAndUpdate(
        { _id: wallet._id as any, balance: { $gte: tx.amount } } as any,
        { $inc: { balance: -tx.amount } },
        { new: true }
      );

      if (!updatedWallet) {
        return NextResponse.json({ ok: false, error: "Insufficient balance to complete withdrawal" }, { status: 400 });
      }

      await logAuditAction({
        actorId: adminUser._id,
        actorRole: "admin",
        action: "withdrawal_completed",
        targetType: "WalletTransaction",
        targetId: tx._id,
        metadata: { reference: tx.reference, amount: tx.amount, finalApprover: adminUser.fullName },
      });
    } else {
      await logAuditAction({
        actorId: adminUser._id,
        actorRole: "admin",
        action: "withdrawal_approved",
        targetType: "WalletTransaction",
        targetId: tx._id,
        metadata: { reference: tx.reference, amount: tx.amount, approvalCount: approvals.length, required: REQUIRED_APPROVALS },
      });
    }

    await tx.save();

    return NextResponse.json({
      ok: true,
      message: approvals.length >= REQUIRED_APPROVALS ? "Withdrawal approved and processed!" : `Approved (${approvals.length}/${REQUIRED_APPROVALS}). Waiting for more approvals.`,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Failed to process approval", details: error?.message || String(error) }, { status: 500 });
  }
}
