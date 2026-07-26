import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Doctor, User } from "@/models";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const specialization = searchParams.get("specialization")?.trim();

    const query: any = {
      status: { $ne: "rejected" },
    };

    if (specialization) {
      query.specialization = new RegExp(`^${escapeRegExp(specialization)}$`, "i");
    }

    const doctors = await Doctor.find(query)
      .sort({ specialization: 1, rating: -1, consultation_fee: 1 })
      .lean();

    const userIds = [...new Set(doctors.map((doctor) => doctor.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    const payload = doctors.map((doctor) => {
      const user = userMap.get(doctor.user_id.toString());

      return {
        id: doctor._id.toString(),
        doctorId: doctor.doctor_id,
        specialization: doctor.specialization,
        consultation_fee: doctor.consultation_fee,
        rating: doctor.rating,
        hospital: doctor.hospital || "Assigned hospital pending",
        experience: doctor.experience || 0,
        bio: doctor.bio || "Experienced specialist.",
        status: doctor.status,
        available_today: doctor.available_today,
        user: user
          ? {
              id: user._id.toString(),
              fullName: user.fullName,
              email: user.email,
              imageUrl: user.profilePhoto,
            }
          : null,
      };
    });

    const specializations = [...new Set(payload.map((doctor) => doctor.specialization))].sort();

    return NextResponse.json({
      ok: true,
      doctors: payload,
      specializations,
      count: payload.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load doctors",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
