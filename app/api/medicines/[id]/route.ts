import mongoose from "mongoose";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Medicine, Partner, User } from "@/models";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id } = await params;
  const objectId = new mongoose.Types.ObjectId(id);
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, brand, category, price, quantity, expiry_date, description, image } = body;

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Only partners can edit medicines" }, { status: 403 });
    }

    const partnerDoc = await Partner.findOne({ email: userDoc.email }).lean();
    if (!partnerDoc) {
      return NextResponse.json({ ok: false, error: "Partner profile not found" }, { status: 404 });
    }

    const medicine = await Medicine.findOne({ _id: objectId } as any).lean();
    if (!medicine || medicine.partner_id?.toString() !== partnerDoc._id.toString()) {
      return NextResponse.json({ ok: false, error: "Medicine not found" }, { status: 404 });
    }

    const normalizedImage = image && image !== "/placeholder-pill.png" ? image : "/placeholder-pill.svg";

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
          image: normalizedImage,
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
  const objectId = new mongoose.Types.ObjectId(id);
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Only partners can remove medicines" }, { status: 403 });
    }

    const partnerDoc = await Partner.findOne({ email: userDoc.email }).lean();
    if (!partnerDoc) {
      return NextResponse.json({ ok: false, error: "Partner profile not found" }, { status: 404 });
    }

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
