import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PharmacyOrder, Partner, Patient, User } from "@/models";

const VALID_DELIVERY_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type DeliveryStatus = (typeof VALID_DELIVERY_STATUSES)[number];

function isDeliveryStatus(value: string): value is DeliveryStatus {
  return (VALID_DELIVERY_STATUSES as readonly string[]).includes(value);
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Only partners can view pharmacy orders" }, { status: 403 });
    }

    const partner = await Partner.findOne({ email: userDoc.email }).lean();
    if (!partner) {
      return NextResponse.json({ ok: false, error: "Partner profile not found" }, { status: 404 });
    }

    const orders = await PharmacyOrder.find({ partner_id: partner._id } as any)
      .sort({ created_at: -1 })
      .lean();

    const patientIds = [...new Set(orders.map((o) => o.patient_id?.toString()))];
    const patients = await Patient.find({ _id: { $in: patientIds } }).lean();
    const patientUserIds = [...new Set(patients.map((p) => p.user_id?.toString()))];
    const patientUsers = await User.find({ _id: { $in: patientUserIds } }).lean();

    const userMap = new Map(patientUsers.map((u) => [u._id.toString(), u]));
    const patientMap = new Map(patients.map((p) => [p._id.toString(), p]));

    const enrichedOrders = orders.map((order) => {
      const patient = patientMap.get(order.patient_id?.toString());
      const patientUser = patient ? userMap.get(patient.user_id?.toString()) : null;
      return {
        ...order,
        _id: order._id.toString(),
        patient_name: patientUser?.fullName || "Unknown patient",
        patient_email: patientUser?.email || "",
        fulfillment_type: (order as any).fulfillment_type || "delivery",
        patient_confirmed: (order as any).patient_confirmed || false,
      };
    });

    return NextResponse.json({ ok: true, orders: enrichedOrders });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to load pharmacy orders", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, delivery_status } = body;

    if (!orderId) {
      return NextResponse.json({ ok: false, error: "orderId is required" }, { status: 400 });
    }

    if (!delivery_status || !isDeliveryStatus(delivery_status)) {
      return NextResponse.json(
        { ok: false, error: `delivery_status must be one of: ${VALID_DELIVERY_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Only partners can update pharmacy orders" }, { status: 403 });
    }

    const partner = await Partner.findOne({ email: userDoc.email }).lean();
    if (!partner) {
      return NextResponse.json({ ok: false, error: "Partner profile not found" }, { status: 404 });
    }

    const order = await PharmacyOrder.findOneAndUpdate(
      { $or: [{ _id: orderId }, { order_id: orderId }], partner_id: partner._id } as any,
      { $set: { delivery_status } },
      { new: true }
    ).lean();

    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, order });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to update pharmacy order", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
