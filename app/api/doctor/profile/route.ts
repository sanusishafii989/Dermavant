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
    const user = await User.findOne({ clerkId: userId }).lean();
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ ok: false, error: "Doctor profile not found" }, { status: 404 });
    }

    const doctor = await Doctor.findOne({ user_id: user._id as any }).lean();
    if (!doctor) {
      return NextResponse.json({ ok: false, error: "Doctor record not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      profile: {
        _id: doctor._id.toString(),
        doctor_id: doctor.doctor_id,
        address: doctor.address || "",
        location: doctor.location || null,
        latitude: doctor.latitude ?? 0,
        longitude: doctor.longitude ?? 0,
        hospital: doctor.hospital || "",
        specialization: doctor.specialization || "General Practice",
        consultation_fee: doctor.consultation_fee ?? 5000,
        bio: doctor.bio || "",
        experience: doctor.experience ?? 0,
        available_today: doctor.available_today ?? false,
        license_number: doctor.license_number || "PENDING",
        status: doctor.status || "pending",
        rating: doctor.rating ?? 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not load doctor profile", details: error?.message || String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    await connectDB();
    const user = await User.findOne({ clerkId: userId }).lean();
    if (!user || user.role !== "doctor") {
      return NextResponse.json({ ok: false, error: "Doctor profile not found" }, { status: 404 });
    }

    const doctor = await Doctor.findOne({ user_id: user._id as any });
    if (!doctor) {
      return NextResponse.json({ ok: false, error: "Doctor record not found" }, { status: 404 });
    }

    if (typeof body.specialization === "string") doctor.specialization = body.specialization;
    if (typeof body.hospital === "string") doctor.hospital = body.hospital;
    if (typeof body.address === "string") doctor.address = body.address;
    if (typeof body.bio === "string") doctor.bio = body.bio;
    if (typeof body.consultation_fee === "number") doctor.consultation_fee = body.consultation_fee;
    if (typeof body.experience === "number") doctor.experience = body.experience;
    if (typeof body.available_today === "boolean") doctor.available_today = body.available_today;

    const latitude = Number(body.latitude ?? 0);
    const longitude = Number(body.longitude ?? 0);
    if (latitude !== 0 || longitude !== 0) {
      doctor.latitude = latitude;
      doctor.longitude = longitude;
      doctor.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    await doctor.save();

    return NextResponse.json({
      ok: true,
      profile: {
        specialization: doctor.specialization,
        hospital: doctor.hospital,
        address: doctor.address,
        bio: doctor.bio,
        consultation_fee: doctor.consultation_fee,
        experience: doctor.experience,
        available_today: doctor.available_today,
        latitude: doctor.latitude,
        longitude: doctor.longitude,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not update doctor profile", details: error?.message || String(error) }, { status: 500 });
  }
}
