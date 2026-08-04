import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { Appointment, Patient, Payment, User, Wallet, WalletTransaction } from "@/models";

export function getPaystackSecret(): string {
  return process.env.PAYSTACK_SECRET_KEY || "";
}

export function validatePaystackEnvKeys(): { ok: boolean; error?: string } {
  const secret = process.env.PAYSTACK_SECRET_KEY || "";
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY || "";

  if (!secret.startsWith("sk_test_")) {
    return { ok: false, error: "PAYSTACK_SECRET_KEY must start with sk_test_ for test mode" };
  }

  if (!publicKey.startsWith("pk_test_")) {
    return { ok: false, error: "PAYSTACK_PUBLIC_KEY must start with pk_test_ for test mode" };
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
  const appointment = await Appointment.findOne({
    $or: [
      { _id: params.appointmentIdentifier },
      { appointment_id: params.appointmentIdentifier },
      { _id: referenceAppointmentId },
      { appointment_id: referenceAppointmentId },
    ],
  });

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

export async function processWalletTopUp(params: {
  reference: string;
  gatewayResponse?: any;
  email?: string | null;
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

  wallet.balance += amountInNaira;
  await wallet.save();

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
