import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getPaystackSecret, toKobo, validatePaystackEnvKeys } from "@/lib/paystack";
import { Appointment, Doctor, Patient, User } from "@/models";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const appointmentIdentifier = body.appointmentId || body.appointment_id;
    const amount = body.amount;
    const callbackUrl = body.callbackUrl || "";

    if (!appointmentIdentifier) {
      return NextResponse.json({ ok: false, error: "appointmentId is required" }, { status: 400 });
    }

    await connectDB();

    const clerkUser = await currentUser();
    const email = body.email || clerkUser?.emailAddresses?.[0]?.emailAddress || "";

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "Patient account not found" }, { status: 404 });
    }

    const patientDoc = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patientDoc) {
      return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
    }

    const appointment = await Appointment.findOne({
      $or: [{ _id: appointmentIdentifier }, { appointment_id: appointmentIdentifier }],
    }).lean();

    if (!appointment) {
      return NextResponse.json({ ok: false, error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.patient_id?.toString() !== patientDoc._id.toString()) {
      return NextResponse.json({ ok: false, error: "Appointment does not belong to current user" }, { status: 403 });
    }

    if (appointment.payment_status === "paid") {
      return NextResponse.json({ ok: false, error: "Appointment is already paid" }, { status: 400 });
    }

    const doctorDoc = await Doctor.findById(appointment.doctor_id as any).lean();
    const consultationFee = amount ?? doctorDoc?.consultation_fee ?? 5000;
    const amountInKobo = toKobo(consultationFee);
    const reference = `apt_${appointment.appointment_id}_${Date.now()}`;
    const secret = getPaystackSecret();
    const envValidation = validatePaystackEnvKeys();

    if (!secret) {
      return NextResponse.json({ ok: false, error: "PAYSTACK_SECRET_KEY is not configured" }, { status: 500 });
    }

    if (!envValidation.ok) {
      return NextResponse.json({ ok: false, error: envValidation.error }, { status: 500 });
    }

    const callbackBase = callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/patient/dashboard/payment/success`;
    const callbackUrlWithReference = new URL(callbackBase, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    callbackUrlWithReference.searchParams.set("reference", reference);
    callbackUrlWithReference.searchParams.set("status", "success");

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
        callback_url: callbackUrlWithReference.toString(),
        metadata: {
          appointment_id: appointment.appointment_id,
          appointment_db_id: appointment._id?.toString?.() || appointment._id,
          doctor_id: appointment.doctor_id?.toString?.() || appointment.doctor_id,
          patient_id: appointment.patient_id?.toString?.() || appointment.patient_id,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          ok: false,
          error: data.message || "Unable to initialize Paystack payment",
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
      amount: amountInKobo,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to initialize payment",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
