import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PharmacyOrder, Patient, Partner, User } from "@/models";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const patient = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patient) return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });

    const orders = await PharmacyOrder.find({ patient_id: patient._id } as any)
      .sort({ created_at: -1 })
      .lean();

    // Get partner (pharmacy) names
    const partnerIds = [...new Set(orders.map((o) => o.partner_id?.toString()))];
    const partners = await Partner.find({ _id: { $in: partnerIds } } as any).lean();
    const partnerMap = new Map(partners.map((p) => [p._id.toString(), p]));

    return NextResponse.json({
      ok: true,
      orders: orders.map((order) => {
        const partner = partnerMap.get(order.partner_id?.toString());
        return {
          _id: order._id.toString(),
          order_id: order.order_id,
          pharmacy_name: partner?.business_name || "Unknown Pharmacy",
          items: order.items || [],
          total: order.total,
          delivery_status: order.delivery_status,
          payment_status: order.payment_status,
          delivery_address: order.delivery_address || "",
          created_at: order.created_at,
        };
      }),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Failed to load orders", details: error?.message || String(error) }, { status: 500 });
  }
}
