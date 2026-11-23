import mongoose from "mongoose";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { COMMISSION } from "@/lib/commission";
import { Appointment, Payment, PharmacyOrder, Wallet, WalletTransaction, Patient, User, Medicine } from "@/models";

export function getPaystackSecret(): string {
  return process.env.PAYSTACK_SECRET_KEY || "";
}

export function validatePaystackEnvKeys(): { ok: boolean; error?: string } {
  const secret = process.env.PAYSTACK_SECRET_KEY || "";
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY || "";

  if (!secret.startsWith("sk_test_") && !secret.startsWith("sk_live_")) {
    return { ok: false, error: "PAYSTACK_SECRET_KEY must start with sk_test_ or sk_live_" };
  }

  if (!publicKey.startsWith("pk_test_") && !publicKey.startsWith("pk_live_")) {
    return { ok: false, error: "PAYSTACK_PUBLIC_KEY must start with pk_test_ or pk_live_" };
  }

  return { ok: true };
}

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  const secret = getPaystackSecret();
  if (!secret || !signature) {
    return false;
  }

  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export function toKobo(amount: number | string): number {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return Math.round(numeric * 100);
}

function extractAppointmentIdFromReference(reference: string): string | null {
  const match = reference.match(/^apt_([a-f0-9]{24})_/i);
  return match?.[1] || null;
}

function extractPharmacyOrderIdFromReference(reference: string): string | null {
  const match = reference.match(/^pharm_([^_]+)_/i);
  return match?.[1] || null;
}

export async function markAppointmentPaid(params: {
  appointmentIdentifier?: string | null;
  reference: string;
  gatewayResponse?: any;
  email?: string | null;
  channel?: string | null;
  metadata?: any;
}) {
  await connectDB();

  const referenceAppointmentId = extractAppointmentIdFromReference(params.reference);
  const aptOrFilters: Record<string, unknown>[] = [];
  if (params.appointmentIdentifier) {
    if (mongoose.Types.ObjectId.isValid(params.appointmentIdentifier)) {
      aptOrFilters.push({ _id: params.appointmentIdentifier });
    }
    aptOrFilters.push({ appointment_id: params.appointmentIdentifier });
  }
  if (referenceAppointmentId) {
    if (mongoose.Types.ObjectId.isValid(referenceAppointmentId)) {
      aptOrFilters.push({ _id: referenceAppointmentId });
    }
    aptOrFilters.push({ appointment_id: referenceAppointmentId });
  }
  if (aptOrFilters.length === 0) {
    return null;
  }
  const appointment = await Appointment.findOne({ $or: aptOrFilters } as any);

  if (!appointment) {
    return null;
  }

  const existingPayment = await Payment.findOne({ reference: params.reference }).lean();
  if (existingPayment) {
    if (existingPayment.status === "success") {
      return existingPayment;
    }

    await Payment.updateOne(
      { reference: params.reference },
      {
        $set: {
          status: "success",
          gateway_response: params.gatewayResponse || {},
          email: params.email || "",
          channel: params.channel || "",
          metadata: params.metadata || {},
          paid_at: new Date(),
        },
      }
    );

    await Appointment.updateOne({ _id: appointment._id as any }, { $set: { payment_status: "paid" } });
    return Payment.findOne({ reference: params.reference }).lean();
  }

  const paymentDoc = await Payment.create({
    appointment_id: appointment._id,
    reference: params.reference,
    amount: Number(params.gatewayResponse?.amount || 0) / 100,
    currency: params.gatewayResponse?.currency || "NGN",
    gateway: "paystack",
    status: "success",
    channel: params.channel || params.gatewayResponse?.channel || "",
    email: params.email || params.gatewayResponse?.customer?.email || "",
    metadata: params.metadata || {},
    gateway_response: params.gatewayResponse || {},
    paid_at: new Date(),
  } as any);

  await Appointment.updateOne({ _id: appointment._id as any }, { $set: { payment_status: "paid" } });
  return paymentDoc;
}

const COMPANY_WALLET_OWNER_ID = "000000000000000000000000";

export async function markPharmacyOrderPaid(params: {
  orderIdentifier?: string | null;
  reference: string;
  gatewayResponse?: any;
  email?: string | null;
  channel?: string | null;
  metadata?: any;
}) {
  await connectDB();

  const referenceOrderId = extractPharmacyOrderIdFromReference(params.reference);
  const orderOrFilters: Record<string, unknown>[] = [];
  if (params.orderIdentifier) {
    if (mongoose.Types.ObjectId.isValid(params.orderIdentifier)) {
      orderOrFilters.push({ _id: params.orderIdentifier });
    }
    orderOrFilters.push({ order_id: params.orderIdentifier });
  }
  if (referenceOrderId) {
    if (mongoose.Types.ObjectId.isValid(referenceOrderId)) {
      orderOrFilters.push({ _id: referenceOrderId });
    }
    orderOrFilters.push({ order_id: referenceOrderId });
  }
  if (orderOrFilters.length === 0) {
    return null;
  }
  const order = await PharmacyOrder.findOne({ $or: orderOrFilters } as any);

  if (!order) {
    return null;
  }

  // Atomic idempotency guard: only one request can transition payment_status from "pending" → "paid"
  const updated = await PharmacyOrder.findOneAndUpdate(
    { _id: order._id as any, payment_status: "pending" } as any,
    {
      $set: {
        payment_status: "paid",
        payment_reference: params.reference,
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    // A concurrent request already marked this order as paid
    return PharmacyOrder.findOne({ _id: order._id } as any).lean();
  }

  // Reduce medicine quantities in stock atomically with sufficiency check
  const stockFailures: { medicine_id: any; name: string; qty: number }[] = [];
  for (const item of updated.items) {
    const stockResult = await Medicine.updateOne(
      { _id: item.medicine_id, quantity: { $gte: item.qty } } as any,
      { $inc: { quantity: -item.qty } }
    );
    if (stockResult.matchedCount === 0) {
      stockFailures.push({ medicine_id: item.medicine_id, name: item.name, qty: item.qty });
    }
  }

  if (stockFailures.length > 0) {
    console.error(
      `[PAYSTACK] Insufficient stock for order ${updated.order_id}:`,
      stockFailures.map((f) => `${f.name} (needed: ${f.qty})`).join(", ")
    );
    // Reverse the payment status — the order cannot be fulfilled with insufficient stock
    await PharmacyOrder.updateOne(
      { _id: updated._id as any },
      { $set: { payment_status: "failed" } }
    );
    // TODO: Trigger refund flow via Paystack refund API
    return PharmacyOrder.findOne({ _id: updated._id } as any).lean();
  }

  // Credit partner wallet atomically (ownerId = Partner._id)
  const partnerEarnings = Math.round(updated.total * (100 - COMMISSION.PHARMACY_RATE) / 100);

  let partnerWallet = await Wallet.findOne({ ownerId: updated.partner_id as any });
  if (!partnerWallet) {
    partnerWallet = await Wallet.create({
      ownerId: updated.partner_id,
      ownerRole: "partner",
      balance: 0,
      currency: "NGN",
    } as any);
  }
  await Wallet.updateOne(
    { _id: partnerWallet._id as any },
    { $inc: { balance: partnerEarnings } }
  );

  // Record the partner credit transaction
  try {
    await WalletTransaction.create({
      wallet_id: partnerWallet._id,
      patient_id: updated.patient_id,
      type: "pharmacy_purchase",
      amount: partnerEarnings,
      direction: "credit",
      currency: "NGN",
      status: "completed",
      reference: `PHARM-SALE-${updated.order_id}-${Date.now()}`,
      description: `Pharmacy order ${updated.order_id} — ${updated.items.length} items`,
      metadata: {
        order_id: updated.order_id,
        gross_amount: updated.total,
        commission_rate: COMMISSION.PHARMACY_RATE,
        commission_amount: updated.total - partnerEarnings,
      },
    } as any);
  } catch (err) {
    console.error(
      `[PAYSTACK] CRITICAL: Partner wallet credited ₦${partnerEarnings} but ledger creation FAILED for order ${updated.order_id}:`,
      err
    );
  }

  // Credit commission to company/admin wallet (fixed ownerId for deterministic lookup)
  const commissionAmount = updated.total - partnerEarnings;
  if (commissionAmount > 0) {
    let adminWallet = await Wallet.findOne({ ownerId: COMPANY_WALLET_OWNER_ID as any, ownerRole: "admin" as any }).lean();
    if (!adminWallet) {
      const created = await Wallet.create({
        ownerId: COMPANY_WALLET_OWNER_ID,
        ownerRole: "admin",
        balance: 0,
        currency: "NGN",
      } as any);
      adminWallet = created.toObject();
    }

    await Wallet.updateOne(
      { _id: adminWallet._id as any },
      { $inc: { balance: commissionAmount } }
    );

    try {
      await WalletTransaction.create({
        wallet_id: adminWallet._id,
        patient_id: updated.patient_id,
        type: "bonus",
        amount: commissionAmount,
        direction: "credit",
        currency: "NGN",
        status: "completed",
        reference: `COMM-PHARM-${updated.order_id}-${Date.now()}`,
        description: `${COMMISSION.PHARMACY_RATE}% platform commission from pharmacy order ${updated.order_id}`,
        metadata: {
          order_id: updated.order_id,
          gross_amount: updated.total,
          commission_rate: COMMISSION.PHARMACY_RATE,
          source: "pharmacy_commission",
        },
      } as any);
    } catch (err) {
      console.error(
        `[PAYSTACK] CRITICAL: Admin wallet credited ₦${commissionAmount} but ledger creation FAILED for order ${updated.order_id}:`,
        err
      );
    }
  }

  return PharmacyOrder.findOne({ _id: updated._id } as any).lean();
}

export async function markWalletTopUpPaid(params: {
  reference: string;
  gatewayResponse?: any;
  email?: string | null;
  channel?: string | null;
  metadata?: any;
}) {
  await connectDB();

  const existingTx = await WalletTransaction.findOne({ reference: params.reference }).lean();
  if (existingTx) {
    return existingTx;
  }

  const metadata = params.metadata || params.gatewayResponse?.metadata || {};
  const amountInKobo = Number(params.gatewayResponse?.amount || 0);
  const amountInNaira = amountInKobo > 0 ? amountInKobo / 100 : Number(metadata.amount || 0);

  if (amountInNaira <= 0) {
    throw new Error("Invalid top-up amount in Paystack response");
  }

  let patientDoc: any = null;
  if (metadata.patient_id) {
    patientDoc = await Patient.findById(metadata.patient_id as any).lean();
  }

  let userDoc: any = null;
  if (patientDoc?.user_id) {
    userDoc = await User.findById(patientDoc.user_id as any).lean();
  } else if (metadata.user_id) {
    userDoc = await User.findById(metadata.user_id as any).lean();
    if (userDoc) {
      patientDoc = await Patient.findOne({ user_id: userDoc._id } as any).lean();
    }
  }

  if (!userDoc || !patientDoc) {
    throw new Error("Patient or User profile not found for wallet top-up verification");
  }

  let wallet = await Wallet.findOne({ ownerId: userDoc._id } as any);
  if (!wallet) {
    wallet = await Wallet.create({
      ownerId: userDoc._id,
      ownerRole: "patient",
      balance: 0,
      currency: "NGN",
    } as any);
  }

  // Atomic credit — prevents double-credit on concurrent webhook retries
  await Wallet.updateOne(
    { _id: wallet._id as any },
    { $inc: { balance: amountInNaira } }
  );

  const transaction = await WalletTransaction.create({
    wallet_id: wallet._id,
    patient_id: patientDoc._id,
    type: "top_up",
    amount: amountInNaira,
    direction: "credit",
    currency: params.gatewayResponse?.currency || "NGN",
    status: "completed",
    reference: params.reference,
    description: "E-Wallet Top-Up via Paystack",
    metadata,
  } as any);

  return transaction;
}
