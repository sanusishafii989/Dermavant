import mongoose from "mongoose";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ensurePartnerProfile } from "@/lib/ensure-partner";
import { Medicine, User } from "@/models";

const MAX_IMAGE_SIZE = 3_000_000; // ~2.2MB base64

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, error: "Invalid medicine ID" }, { status: 400 });
    }
    const objectId = new mongoose.Types.ObjectId(id);

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, brand, category, price, quantity, expiry_date, description, image } = body;

    if (typeof price === "number" && price < 0) {
      return NextResponse.json({ ok: false, error: "Price must not be negative" }, { status: 400 });
    }
    if (typeof quantity === "number" && quantity < 0) {
      return NextResponse.json({ ok: false, error: "Quantity must not be negative" }, { status: 400 });
    }

    // Validate expiry_date if provided
    if (expiry_date !== undefined) {
      const parsed = new Date(expiry_date);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ ok: false, error: "Invalid expiry date" }, { status: 400 });
      }
      if (parsed < new Date()) {
        return NextResponse.json({ ok: false, error: "Expiry date cannot be in the past" }, { status: 400 });
      }
    }

    // Validate image size if provided
    if (image !== undefined && image && image.length > MAX_IMAGE_SIZE) {
      return NextResponse.json({ ok: false, error: "Image is too large. Maximum size is ~2MB." }, { status: 400 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Only partners can edit medicines" }, { status: 403 });
    }

    const partnerDoc = await ensurePartnerProfile(userDoc as any);

    const medicine = await Medicine.findOne({ _id: objectId } as any).lean();
    if (!medicine || medicine.partner_id?.toString() !== partnerDoc._id.toString()) {
      return NextResponse.json({ ok: false, error: "Medicine not found" }, { status: 404 });
    }

    // Only normalize image when it's explicitly provided
    const imageValue = image !== undefined
      ? (image && image !== "/placeholder-pill.png" ? image : "/placeholder-pill.svg")
      : medicine.image;

    const updated = await Medicine.updateOne(
      { _id: objectId } as any,
      {
        $set: {
          name: name ?? medicine.name,
          brand: brand ?? medicine.brand,
          category: category ?? medicine.category,
          price: typeof price === "number" ? price : medicine.price,
          quantity: typeof quantity === "number" ? quantity : medicine.quantity,
          expiry_date: expiry_date ? new Date(expiry_date) : medicine.expiry_date,
          description: description ?? medicine.description,
          image: imageValue,
        },
      }
    );

    return NextResponse.json({ ok: true, updated });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Unable to update medicine", details: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ ok: false, error: "Invalid medicine ID" }, { status: 400 });
    }
    const objectId = new mongoose.Types.ObjectId(id);

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Only partners can remove medicines" }, { status: 403 });
    }

    const partnerDoc = await ensurePartnerProfile(userDoc as any);

    const medicine = await Medicine.findOne({ _id: objectId } as any).lean();
    if (!medicine || medicine.partner_id?.toString() !== partnerDoc._id.toString()) {
      return NextResponse.json({ ok: false, error: "Medicine not found" }, { status: 404 });
    }

    await Medicine.updateOne({ _id: objectId } as any, { $set: { status: "delisted", deleted_at: new Date() } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Unable to remove medicine", details: error?.message || String(error) }, { status: 500 });
  }
}
