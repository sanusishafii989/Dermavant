import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PharmacyOrder, Patient, User } from "@/models";

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, confirmed } = body;

    if (!orderId) {
      return NextResponse.json({ ok: false, error: "orderId is required" }, { status: 400 });
    }

    if (!confirmed) {
      return NextResponse.json({ ok: false, error: "confirmed must be true" }, { status: 400 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const patient = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patient) {
      return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
    }

    const order = await PharmacyOrder.findOne({
      $or: [{ _id: orderId }, { order_id: orderId }],
      patient_id: patient._id as any,
    } as any);

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    if (order.delivery_status !== "delivered") {
      return NextResponse.json({ ok: false, error: "Order must be marked as delivered by pharmacy first" }, { status: 400 });
    }

    // Check if already confirmed
    if ((order as any).patient_confirmed) {
      return NextResponse.json({ ok: false, error: "Order already confirmed" }, { status: 400 });
    }

    await PharmacyOrder.updateOne(
      { _id: order._id as any },
      { $set: { patient_confirmed: true, patient_confirmed_at: new Date() } }
    );

    return NextResponse.json({ ok: true, message: "Delivery confirmed successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to confirm delivery", details: error?.message || String(error) },
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
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const patient = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patient) {
      return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
    }

    // Find orders that are delivered but not yet confirmed by patient
    const pendingConfirmation = await PharmacyOrder.find({
      patient_id: patient._id as any,
      delivery_status: "delivered",
      patient_confirmed: { $ne: true },
    } as any).lean();

    return NextResponse.json({
      ok: true,
      orders: pendingConfirmation.map((o) => ({
        _id: o._id.toString(),
        order_id: o.order_id,
        total: o.total,
        items: o.items,
        delivery_status: o.delivery_status,
        payment_status: o.payment_status,
        created_at: o.created_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to load pending confirmations" },
      { status: 500 }
    );
  }
}
