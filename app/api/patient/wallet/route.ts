import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getPaystackSecret, toKobo, validatePaystackEnvKeys } from "@/lib/paystack";
import { Patient, User, Wallet, WalletTransaction } from "@/models";
import type { WalletTransactionItem } from "@/types/history";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      const createdUser = await User.create({
        clerkId: userId,
        fullName: "Aetheris Patient",
        email: `${userId}@example.com`,
        role: "patient",
        status: "pending_verification",
      } as any);
      userDoc = createdUser.toObject();
    }

    let patientDoc: any = await Patient.findOne({ user_id: userDoc._id } as any).lean();
    if (!patientDoc) {
      const createdPatient = await Patient.create({ user_id: userDoc._id } as any);
      patientDoc = createdPatient.toObject();
    }

    let walletDoc: any = await Wallet.findOne({ ownerId: userDoc._id } as any).lean();
    if (!walletDoc) {
      const createdWallet = await Wallet.create({
        ownerId: userDoc._id,
        ownerRole: "patient",
        balance: 0,
        currency: "NGN",
      } as any);
      walletDoc = createdWallet.toObject();
    }

    const transactions = await WalletTransaction.find({
      patient_id: patientDoc._id,
      deleted_at: null,
    } as any)
      .sort({ created_at: -1 })
      .lean();

    const formattedTransactions: WalletTransactionItem[] = transactions.map((t: any) => ({
      id: t.transaction_id || t._id.toString(),
      type: t.type,
      amount: t.amount,
      direction: t.direction,
      currency: t.currency || "NGN",
      status: t.status || "completed",
      reference: t.reference,
      description: t.description || "",
      createdAt: t.created_at ? new Date(t.created_at).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      balance: walletDoc.balance || 0,
      currency: walletDoc.currency || "NGN",
      transactions: formattedTransactions,
    });
  } catch (error: any) {
    console.error("[WALLET API GET] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to retrieve wallet information", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body.amount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Amount must be a positive number" }, { status: 400 });
    }

    await connectDB();

    const clerkUser = await currentUser();
    const email = body.email || clerkUser?.emailAddresses?.[0]?.emailAddress || `${userId}@example.com`;

    let userDoc: any = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "User account not found" }, { status: 404 });
    }

    let patientDoc: any = await Patient.findOne({ user_id: userDoc._id } as any).lean();
    if (!patientDoc) {
      const createdPatient = await Patient.create({ user_id: userDoc._id } as any);
      patientDoc = createdPatient.toObject();
    }

    const secret = getPaystackSecret();
    const envValidation = validatePaystackEnvKeys();

    if (!secret) {
      return NextResponse.json({ ok: false, error: "PAYSTACK_SECRET_KEY is not configured" }, { status: 500 });
    }

    if (!envValidation.ok) {
      return NextResponse.json({ ok: false, error: envValidation.error }, { status: 500 });
    }

    const amountInKobo = toKobo(amount);
    const reference = `WLT-TOPUP-${patientDoc._id}-${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;
    const callbackBase = body.callbackUrl || `${appUrl}/patient/dashboard/wallet`;
    const callbackUrl = new URL(callbackBase, appUrl);
    callbackUrl.searchParams.set("reference", reference);
    callbackUrl.searchParams.set("status", "success");

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        currency: "NGN",
        reference,
        callback_url: callbackUrl.toString(),
        metadata: {
          type: "wallet_topup",
          user_id: userDoc._id.toString(),
          patient_id: patientDoc._id.toString(),
          amount,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          ok: false,
          error: data.message || "Unable to initialize Paystack top-up transaction",
          details: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      authorization_url: data.data.authorization_url,
      reference,
      access_code: data.data.access_code,
      amount,
    });
  } catch (error: any) {
    console.error("[WALLET API POST] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to initialize top-up payment", details: error?.message },
      { status: 500 }
    );
  }
}
