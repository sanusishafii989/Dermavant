import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Partner, User, Wallet, WalletTransaction } from "@/models";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount = Number(body.amount) || 450000;
    const clerkId = body.clerkId;

    if (!clerkId) {
      return NextResponse.json({ ok: false, error: "clerkId is required" }, { status: 400 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Partner not found for this clerkId" }, { status: 404 });
    }

    let wallet = await Wallet.findOne({ ownerId: userDoc._id as any });
    if (!wallet) {
      wallet = await Wallet.create({
        ownerId: userDoc._id,
        ownerRole: "partner",
        balance: 0,
        currency: "NGN",
      } as any);
    }

    wallet.balance += amount;
    await wallet.save();

    const reference = `DEV-PARTNER-TOPUP-${Date.now()}`;
    const transaction = await WalletTransaction.create({
      wallet_id: wallet._id,
      patient_id: userDoc._id,
      type: "bonus",
      amount,
      direction: "credit",
      currency: "NGN",
      status: "completed",
      reference,
      description: "Development partner wallet top-up",
      metadata: { source: "dev_seed", role: "partner" },
    } as any);

    return NextResponse.json({
      ok: true,
      newBalance: wallet.balance,
      transaction: {
        id: transaction.transaction_id || transaction._id.toString(),
        reference,
        amount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to top up wallet", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
