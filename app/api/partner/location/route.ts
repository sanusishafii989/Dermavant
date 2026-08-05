import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Partner, User } from "@/models";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Partner account required" }, { status: 403 });
    }

    const partner = await Partner.findOne({ email: userDoc.email as string }).lean();

    return NextResponse.json({
      ok: true,
      address: partner?.address || "",
      latitude: partner?.location?.coordinates?.[1] ?? partner?.latitude ?? 6.5244,
      longitude: partner?.location?.coordinates?.[0] ?? partner?.longitude ?? 3.3792,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not load partner location", details: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const address = String(body?.address ?? "").trim();
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ ok: false, error: "Valid latitude and longitude are required" }, { status: 400 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Partner account required" }, { status: 403 });
    }

    const partner = await Partner.findOne({ email: userDoc.email as string });
    if (!partner) {
      return NextResponse.json({ ok: false, error: "Partner profile not found" }, { status: 404 });
    }

    const payload = {
      address,
      latitude,
      longitude,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    };

    await Partner.updateOne({ _id: partner._id as any }, { $set: payload });

    return NextResponse.json({ ok: true, message: "Partner location saved", location: payload });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not save partner location", details: error?.message || String(error) }, { status: 500 });
  }
}
