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
    const user = await User.findOne({ clerkId: userId }).lean();
    if (!user || user.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Partner profile not found" }, { status: 404 });
    }

    const partner = await Partner.findOne({ email: user.email }).lean();
    if (!partner) {
      return NextResponse.json({ ok: false, error: "Partner record not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      profile: {
        address: partner.address || "",
        location: partner.location || null,
        latitude: partner.latitude ?? 0,
        longitude: partner.longitude ?? 0,
        business_name: partner.business_name || "",
        owner_name: partner.owner_name || "",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not load partner profile", details: error?.message || String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const address = typeof body.address === "string" ? body.address : "";
    const latitude = Number(body.latitude ?? 0);
    const longitude = Number(body.longitude ?? 0);

    await connectDB();
    const user = await User.findOne({ clerkId: userId }).lean();
    if (!user || user.role !== "partner") {
      return NextResponse.json({ ok: false, error: "Partner profile not found" }, { status: 404 });
    }

    const partner = await Partner.findOne({ email: user.email });
    if (!partner) {
      return NextResponse.json({ ok: false, error: "Partner record not found" }, { status: 404 });
    }

    partner.address = address;
    partner.latitude = latitude;
    partner.longitude = longitude;
    partner.location = {
      type: "Point",
      coordinates: [longitude, latitude],
    };

    await partner.save();

    return NextResponse.json({ ok: true, profile: { address, latitude, longitude } });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not update partner profile", details: error?.message || String(error) }, { status: 500 });
  }
}
