import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getPaystackSecret, markAppointmentPaid, markPharmacyOrderPaid, markWalletTopUpPaid, validatePaystackEnvKeys } from "@/lib/paystack";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
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
      // Paystack returns 404 or a message like "Transaction not found" / "transaction_not_found"
      const msg = (data.message || "").toLowerCase();
      const isNotFound =
        response.status === 404 ||
        msg.includes("not found") ||
        msg.includes("not_found") ||
        msg.includes("doesn't exist");
      return NextResponse.json(
        {
          ok: false,
          error: isNotFound ? "Transaction not found on Paystack. If you completed payment, your wallet will be credited shortly." : (data.message || "Unable to verify payment"),
        },
        { status: isNotFound ? 404 : 502 }
      );
    }

    if (data.data?.status === "success") {
      const purpose = data.data.metadata?.purpose || data.data.metadata?.type || "appointment_payment";
      let payment: any = null;
      if (purpose === "pharmacy_order") {
        payment = await markPharmacyOrderPaid({
          orderIdentifier: data.data.metadata?.order_id || data.data.metadata?.order_db_id,
          reference,
          gatewayResponse: data.data,
          email: data.data.customer?.email,
          channel: data.data.channel,
          metadata: data.data.metadata,
        });
      } else if (purpose === "wallet_topup") {
        payment = await markWalletTopUpPaid({
          reference,
          gatewayResponse: data.data,
          email: data.data.customer?.email,
          channel: data.data.channel,
          metadata: data.data.metadata,
        });
      } else {
        payment = await markAppointmentPaid({
          appointmentIdentifier: data.data.metadata?.appointment_id || data.data.metadata?.appointment_db_id,
          reference,
          gatewayResponse: data.data,
          email: data.data.customer?.email,
          channel: data.data.channel,
          metadata: data.data.metadata,
        });
      }

      return NextResponse.json({
        ok: true,
        paymentStatus: payment ? "success" : "ignored",
        payment,
        purpose,
        reference,
        orderId: payment?.order_id || data.data.metadata?.order_id || data.data.metadata?.order_db_id,
        orderDbId: payment?._id || data.data.metadata?.order_db_id,
        metadata: data.data.metadata,
      });
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
