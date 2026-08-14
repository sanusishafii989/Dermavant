import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Wallet, WalletTransaction } from "@/models";

const REQUIRED_APPROVALS = 2; // 2 of 3 admins

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const adminUser = await User.findOne({ clerkId: userId }).lean();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Get admin wallet (shared company wallet)
    let wallet = await Wallet.findOne({ ownerRole: "admin" }).lean();
    if (!wallet) {
      const created = await Wallet.create({ ownerId: adminUser._id, ownerRole: "admin", balance: 0, currency: "NGN" } as any);
      wallet = created.toObject();
    }

    // Get pending withdrawal requests
    const pendingWithdrawals = await WalletTransaction.find({
      type: "refund",
      direction: "debit",
      status: "pending",
    } as any).sort({ created_at: -1 }).lean();

    // Get completed withdrawals
    const completedWithdrawals = await WalletTransaction.find({
      type: "refund",
      direction: "debit",
      status: { $in: ["completed", "failed"] },
    } as any).sort({ created_at: -1 }).limit(20).lean();

    // Count total admins
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
        approvals: [{ admin_id: adminUser._id.toString(), admin_name: adminUser.fullName, approved_at: new Date() }],
      },
    } as any);

    return NextResponse.json({
      ok: true,
      message: "Withdrawal request created. Requires 1 more admin approval.",
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
    const { transactionId, action } = body; // action: "approve" or "reject"

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

    // Check if already approved by this admin
    if (approvals.some((a: any) => a.admin_id === adminUser._id.toString())) {
      return NextResponse.json({ ok: false, error: "You have already approved this withdrawal" }, { status: 400 });
    }

    if (action === "reject") {
      tx.status = "failed";
      metadata.rejectedBy = { admin_id: adminUser._id.toString(), admin_name: adminUser.fullName, rejected_at: new Date() };
      tx.metadata = metadata;
      await tx.save();
      return NextResponse.json({ ok: true, message: "Withdrawal rejected" });
    }

    // Approve
    approvals.push({ admin_id: adminUser._id.toString(), admin_name: adminUser.fullName, approved_at: new Date() });
    metadata.approvals = approvals;
    tx.metadata = metadata;

    if (approvals.length >= REQUIRED_APPROVALS) {
      // Enough approvals — process withdrawal
      tx.status = "completed";

      // Deduct from wallet
      const wallet = await Wallet.findOne({ ownerRole: "admin" });
      if (wallet) {
        if (wallet.balance < tx.amount) {
          return NextResponse.json({ ok: false, error: "Insufficient balance" }, { status: 400 });
        }
        wallet.balance -= tx.amount;
        await wallet.save();
      }
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
