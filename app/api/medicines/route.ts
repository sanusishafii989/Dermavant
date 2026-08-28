import mongoose from "mongoose";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ensurePartnerProfile } from "@/lib/ensure-partner";
import { Medicine, User, Partner } from "@/models";

const MAX_IMAGE_SIZE = 3_000_000; // ~2.2MB base64

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

    // Look up Partner by email (no auto-create on read)
    const partnerDoc = await Partner.findOne({ email: userDoc.email }).lean();

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

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }
    if (typeof price !== "number" || typeof quantity !== "number" || !expiry_date) {
      return NextResponse.json({ ok: false, error: "name, price, quantity, and expiry_date are required" }, { status: 400 });
    }

    if (price < 0 || quantity < 0) {
      return NextResponse.json({ ok: false, error: "Price and quantity must not be negative" }, { status: 400 });
    }

    // Validate expiry date
    const parsedExpiry = new Date(expiry_date);
    if (isNaN(parsedExpiry.getTime())) {
      return NextResponse.json({ ok: false, error: "Invalid expiry date" }, { status: 400 });
    }
    if (parsedExpiry < new Date()) {
      return NextResponse.json({ ok: false, error: "Expiry date cannot be in the past" }, { status: 400 });
    }

    // Validate image size
    if (image && typeof image === "string" && image.length > MAX_IMAGE_SIZE) {
      return NextResponse.json({ ok: false, error: "Image is too large. Maximum size is ~2MB." }, { status: 400 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Only partners can create medicines" }, { status: 403 });
    }

    const partnerDoc = await ensurePartnerProfile(userDoc as any);

    const medicine = await Medicine.create({
      partner_id: partnerDoc._id,
      name: name.trim(),
      brand: brand || "",
      category: category || "General",
      price,
      quantity,
      expiry_date: parsedExpiry,
      description: description || "",
      image: image || "",
    } as any);

    return NextResponse.json({ ok: true, medicine }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Unable to create medicine", details: error?.message || String(error) }, { status: 500 });
  }
}
