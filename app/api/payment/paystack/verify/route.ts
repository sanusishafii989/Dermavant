import { NextResponse } from "next/server";
import { getPaystackSecret, markAppointmentPaid, processWalletTopUp, validatePaystackEnvKeys } from "@/lib/paystack";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reference = body.reference;

    if (!reference) {
      return NextResponse.json({ ok: false, error: "reference is required" }, { status: 400 });
    }

    const secret = getPaystackSecret();
    const envValidation = validatePaystackEnvKeys();
    if (!secret) {
      return NextResponse.json({ ok: false, error: "PAYSTACK_SECRET_KEY is not configured" }, { status: 500 });
    }

    if (!envValidation.ok) {
      return NextResponse.json({ ok: false, error: envValidation.error }, { status: 500 });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      return NextResponse.json(
        {
          ok: false,
          error: data.message || "Unable to verify payment",
          details: data,
        },
        { status: 502 }
      );
    }

    if (data.data?.status === "success") {
      const isWalletTopUp =
        data.data.metadata?.type === "wallet_topup" ||
        reference.startsWith("WLT-");

      if (isWalletTopUp) {
        const transaction = await processWalletTopUp({
          reference,
          gatewayResponse: data.data,
          email: data.data.customer?.email,
          metadata: data.data.metadata,
        });

        return NextResponse.json({
          ok: true,
          type: "wallet_topup",
          paymentStatus: "success",
          transaction,
        });
      }

      const payment = await markAppointmentPaid({
        appointmentIdentifier: data.data.metadata?.appointment_id || data.data.metadata?.appointment_db_id,
        reference,
        gatewayResponse: data.data,
        email: data.data.customer?.email,
        channel: data.data.channel,
        metadata: data.data.metadata,
      });

      return NextResponse.json({ ok: true, type: "appointment", paymentStatus: payment ? "success" : "ignored", payment });
    }

    return NextResponse.json({ ok: true, paymentStatus: data.data?.status || "pending", data: data.data });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to verify payment",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
