import mongoose from "mongoose";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { resolvePartnerForUser } from "@/lib/partner-resolution";
import { Medicine, Partner, User } from "@/models";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const partnerId = url.searchParams.get("partnerId");

  try {
    await connectDB();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Only partners can view this catalogue" }, { status: 403 });
    }

    const partnerDoc = await resolvePartnerForUser(
      {
        email: userDoc.email,
        fullName: userDoc.fullName,
      },
      {
        findOne: (query: any) => Partner.findOne(query).lean(),
      },
      partnerId
    );

    if (!partnerDoc) {
      return NextResponse.json({ ok: false, error: "Partner profile not found" }, { status: 404 });
    }

    if (partnerId && partnerDoc._id.toString() !== partnerId) {
      return NextResponse.json({ ok: false, error: "Invalid partner access" }, { status: 403 });
    }

    const medicines = await Medicine.find({ partner_id: partnerDoc._id as mongoose.Types.ObjectId, status: "active" } as any).lean();
    return NextResponse.json({ ok: true, medicines, partner: { id: partnerDoc._id.toString(), name: partnerDoc.owner_name || partnerDoc.business_name } });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not load medicines", details: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, brand, category, price, quantity, expiry_date, description, image } = body;

    if (!name || typeof price !== "number" || typeof quantity !== "number" || !expiry_date) {
      return NextResponse.json({ ok: false, error: "name, price, quantity, and expiry_date are required" }, { status: 400 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Only partners can create medicines" }, { status: 403 });
    }

    const partnerDoc = await Partner.findOne({ email: userDoc.email }).lean();
    if (!partnerDoc) {
      return NextResponse.json({ ok: false, error: "Partner profile not found" }, { status: 404 });
    }

    const medicine = await Medicine.create({
      partner_id: partnerDoc._id,
      name,
      brand: brand || "",
      category: category || "General",
      price,
      quantity,
      expiry_date: new Date(expiry_date),
      description: description || "",
      image: image || "",
    } as any);

    return NextResponse.json({ ok: true, medicine }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Unable to create medicine", details: error?.message || String(error) }, { status: 500 });
  }
}
