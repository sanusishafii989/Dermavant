import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Partner } from "@/models";

export async function GET() {
  try {
    await connectDB();
    const partners = await Partner.find({ status: { $ne: "rejected" } }).lean();
    return NextResponse.json({
      ok: true,
      partners: partners.map((p) => ({
        _id: p._id.toString(),
        business_name: p.business_name,
        owner_name: p.owner_name,
        email: p.email,
        phone: p.phone,
        address: p.address || "",
        rating: p.rating ?? 0,
        status: p.status,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to load partners", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}