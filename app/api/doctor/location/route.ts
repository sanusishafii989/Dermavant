import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Doctor, User } from "@/models";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || userDoc.role !== "doctor") {
      return NextResponse.json({ ok: false, error: "Doctor account required" }, { status: 403 });
    }

    const doctor = await Doctor.findOne({ user_id: userDoc._id as any }).lean();

    return NextResponse.json({
      ok: true,
      address: doctor?.address || "",
      latitude: doctor?.location?.coordinates?.[1] ?? doctor?.latitude ?? 6.5244,
      longitude: doctor?.location?.coordinates?.[0] ?? doctor?.longitude ?? 3.3792,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not load doctor location", details: error?.message || String(error) }, { status: 500 });
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
    if (!userDoc || userDoc.role !== "doctor") {
      return NextResponse.json({ ok: false, error: "Doctor account required" }, { status: 403 });
    }

    const doctor = await Doctor.findOne({ user_id: userDoc._id as any });
    if (!doctor) {
      return NextResponse.json({ ok: false, error: "Doctor profile not found" }, { status: 404 });
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

    await Doctor.updateOne({ _id: doctor._id as any }, { $set: payload });

    return NextResponse.json({ ok: true, message: "Doctor location saved", location: payload });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not save doctor location", details: error?.message || String(error) }, { status: 500 });
  }
}
