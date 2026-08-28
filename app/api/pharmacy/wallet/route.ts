import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ensurePartnerProfile } from "@/lib/ensure-partner";
import { User, Wallet, WalletTransaction } from "@/models";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const bankName = String(body.bankName || "").trim();
    const accountNumber = String(body.accountNumber || "").trim();
    const accountName = String(body.accountName || "").trim();

    if (!amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Amount must be a positive number" }, { status: 400 });
    }

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json({ ok: false, error: "Bank name, account number, and account name are required" }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Only partners can request withdrawals" }, { status: 403 });
    }

    const partner = await ensurePartnerProfile(userDoc as any);
    if (!partner) {
      return NextResponse.json({ ok: false, error: "Partner profile not found" }, { status: 404 });
    }

    // Look up wallet by Partner._id (consistent with lib/paystack.ts)
    let wallet = await Wallet.findOne({ ownerId: partner._id as any }).lean();
    if (!wallet) {
      wallet = await Wallet.create({
        ownerId: partner._id,
        ownerRole: "partner",
        balance: 0,
        currency: "NGN",
      } as any);
    }

    // Create the withdrawal transaction record FIRST (pending), then attempt atomic debit
    const reference = `PWDR-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const transaction = await WalletTransaction.create({
      wallet_id: wallet._id,
      type: "withdrawal",
      amount,
      direction: "debit",
      currency: "NGN",
      status: "pending",
      reference,
      description: `Withdrawal to ${bankName} (${accountName}, ${accountNumber})`,
      metadata: {
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        request_type: "partner_withdrawal",
      },
    } as any);

    // Atomic debit: only succeeds if balance >= amount (prevents overdrawing on concurrent requests)
    const updatedWallet = await Wallet.findOneAndUpdate(
      { _id: wallet._id as any, balance: { $gte: amount } } as any,
      { $inc: { balance: -amount } },
      { new: true }
    ).lean();

    if (!updatedWallet) {
      // Insufficient balance — mark transaction as failed
      await WalletTransaction.updateOne(
        { _id: transaction._id as any },
        { $set: { status: "failed" } }
      );
      return NextResponse.json({ ok: false, error: "Insufficient balance for this withdrawal" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      transaction: {
        id: transaction.transaction_id || transaction._id.toString(),
        reference,
        amount,
        status: "pending",
        description: transaction.description,
        createdAt: transaction.created_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to process withdrawal request", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Only partners can view withdrawals" }, { status: 403 });
    }

    const partner = await ensurePartnerProfile(userDoc as any);
    if (!partner) {
      return NextResponse.json({ ok: false, error: "Partner profile not found" }, { status: 404 });
    }

    // Look up wallet by Partner._id (consistent with lib/paystack.ts)
    const wallet = await Wallet.findOne({ ownerId: partner._id as any }).lean();
    if (!wallet) {
      return NextResponse.json({ ok: true, withdrawals: [] });
    }

    const withdrawals = await WalletTransaction.find({
      wallet_id: wallet._id,
      direction: "debit",
      "metadata.request_type": "partner_withdrawal",
    } as any)
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({
      ok: true,
      withdrawals: withdrawals.map((w) => ({
        id: w.transaction_id || w._id.toString(),
        reference: w.reference,
        amount: w.amount,
        status: w.status,
        description: w.description,
        createdAt: w.created_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to load withdrawals", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
