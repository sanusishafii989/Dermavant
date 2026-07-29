import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { Appointment, Payment } from "../models";
import { POST as verifyPaymentRoute } from "../app/api/payment/paystack/verify/route";
import { markAppointmentPaid } from "../lib/paystack";

const envPath = path.join(process.cwd(), ".env.local");
const env: Record<string, string> = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

process.env.MONGODB_URI = env.MONGODB_URI;
process.env.PAYSTACK_PUBLIC_KEY = env.PAYSTACK_PUBLIC_KEY || "pk_test_demo";
process.env.PAYSTACK_SECRET_KEY = env.PAYSTACK_SECRET_KEY || "sk_test_demo";

test.before(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
});

test.after(async () => {
  await mongoose.disconnect();
});

test("declined Paystack verification does not create a payment or flip the appointment to paid", async () => {
  const appointment = await Appointment.create({
    patient_id: new mongoose.Types.ObjectId(),
    doctor_id: new mongoose.Types.ObjectId(),
    date: new Date(),
    time: "09:00",
    type: "video",
    payment_status: "pending",
    consultation_status: "scheduled",
    meeting_link: "",
  } as any);

  const reference = `apt_${appointment.appointment_id}_decline_test`;

  const originalFetch = global.fetch;
  global.fetch = (async () =>
    new Response(JSON.stringify({ status: false, message: "The card was declined" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof fetch;

  try {
    const request = new Request("http://localhost/api/payment/paystack/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });

    const response = await verifyPaymentRoute(request);
    const payload = await response.json();

    assert.equal(response.status, 502);
    assert.equal(payload.ok, false);
    assert.equal(payload.error, "The card was declined");

    const refreshedAppointment = await Appointment.findById(appointment._id).lean();
    const payments = await Payment.find({ reference }).lean();

    assert.equal(refreshedAppointment?.payment_status, "pending");
    assert.equal(payments.length, 0);
  } finally {
    global.fetch = originalFetch;
    await Appointment.deleteOne({ _id: appointment._id } as any);
    await Payment.deleteMany({ reference });
  }
});

test("markAppointmentPaid is idempotent for the same reference", async () => {
  const appointment = await Appointment.create({
    patient_id: new mongoose.Types.ObjectId(),
    doctor_id: new mongoose.Types.ObjectId(),
    date: new Date(),
    time: "10:00",
    type: "video",
    payment_status: "pending",
    consultation_status: "scheduled",
    meeting_link: "",
  } as any);

  const reference = `apt_${appointment.appointment_id}_idempotency_test`;

  try {
    const firstPayment = await markAppointmentPaid({
      appointmentIdentifier: appointment.appointment_id,
      reference,
      gatewayResponse: { amount: 500000, currency: "NGN", customer: { email: "test@example.com" }, channel: "card" },
      email: "test@example.com",
      channel: "card",
      metadata: { appointment_id: appointment.appointment_id },
    });

    const secondPayment = await markAppointmentPaid({
      appointmentIdentifier: appointment.appointment_id,
      reference,
      gatewayResponse: { amount: 500000, currency: "NGN", customer: { email: "test@example.com" }, channel: "card" },
      email: "test@example.com",
      channel: "card",
      metadata: { appointment_id: appointment.appointment_id },
    });

    const refreshedAppointment = await Appointment.findById(appointment._id).lean();
    const payments = await Payment.find({ reference }).lean();

    assert.equal(firstPayment?.status, "success");
    assert.equal(secondPayment?.status, "success");
    assert.equal(payments.length, 1);
    assert.equal(refreshedAppointment?.payment_status, "paid");
  } finally {
    await Appointment.deleteOne({ _id: appointment._id } as any);
    await Payment.deleteMany({ reference });
  }
});
