import { NextResponse } from "next/server";
import { markAppointmentPaid, markPharmacyOrderPaid, validatePaystackEnvKeys, verifyPaystackSignature } from "@/lib/paystack";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const envValidation = validatePaystackEnvKeys();

    if (!envValidation.ok) {
      return NextResponse.json({ ok: false, error: envValidation.error }, { status: 500 });
    }

    if (!verifyPaystackSignature(rawBody, signature)) {
      return NextResponse.json({ ok: false, error: "Invalid Paystack signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const data = event?.data;

    if (!data) {
      return NextResponse.json({ ok: true, received: true });
    }

    const isSuccessfulCharge = event?.event === "charge.success" || event?.event === "transaction.success" || data?.status === "success";
    if (!isSuccessfulCharge) {
      return NextResponse.json({ ok: true, received: true, ignored: true });
    }

    let payment: any = null;
    const purpose = data.metadata?.purpose || "appointment_payment";
    if (purpose === "pharmacy_order") {
      payment = await markPharmacyOrderPaid({
        orderIdentifier: data.metadata?.order_id || data.metadata?.order_db_id,
        reference: data.reference,
        gatewayResponse: data,
        email: data.customer?.email,
        channel: data.channel,
        metadata: data.metadata,
      });
    } else {
      payment = await markAppointmentPaid({
        appointmentIdentifier: data.metadata?.appointment_id || data.metadata?.appointment_db_id,
        reference: data.reference,
        gatewayResponse: data,
        email: data.customer?.email,
        channel: data.channel,
        metadata: data.metadata,
      });
    }

    return NextResponse.json({ ok: true, received: true, paymentStatus: payment ? "success" : "ignored" });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Webhook processing failed",
        details: error?.message || String(error),
      },
      { status: 400 }
    );
  }
}
