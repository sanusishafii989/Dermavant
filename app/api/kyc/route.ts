import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, KYCApplication, Doctor, Partner } from "@/models";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const application = await KYCApplication.findOne({ user_id: userDoc._id as any }).lean();

    return NextResponse.json({
      ok: true,
      application: application ? {
        ...application,
        _id: application._id.toString(),
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Failed to load KYC" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { role, ...fields } = body;

    if (role !== "doctor" && role !== "partner") {
      return NextResponse.json({ ok: false, error: "Invalid role for KYC" }, { status: 400 });
    }

    await connectDB();
    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    if (userDoc.role !== role) {
      return NextResponse.json({ ok: false, error: "Role mismatch" }, { status: 403 });
    }

    // Upsert KYC application
    const existing = await KYCApplication.findOne({ user_id: userDoc._id as any });

    if (existing && existing.status === "approved") {
      return NextResponse.json({ ok: false, error: "Already verified" }, { status: 400 });
    }

    const kycData = {
      user_id: userDoc._id,
      role,
      ...fields,
      status: "pending",
      submitted_at: new Date(),
      reviewed_by: null,
      reviewed_at: null,
      review_notes: "",
    };

    if (existing) {
      await KYCApplication.updateOne({ _id: existing._id as any }, { $set: kycData });
    } else {
      await KYCApplication.create(kycData as any);
    }

    // Update Doctor/Partner record with license info
    if (role === "doctor") {
      await Doctor.updateOne(
        { user_id: userDoc._id as any },
        { $set: {
          license_number: fields.license_number || "PENDING",
          specialization: fields.specialization || "General Practice",
          hospital: fields.hospital || "",
          experience: Number(fields.years_of_experience) || 0,
          status: "pending",
        } }
      ).catch(() => {});
    } else {
      await Partner.updateOne(
        { email: userDoc.email },
        { $set: {
          business_name: fields.business_name || "",
          license: fields.pharmacist_license || "PENDING",
          phone: fields.phone_number || "",
          address: fields.address || "",
          status: "pending",
        } }
      ).catch(() => {});
    }

    return NextResponse.json({ ok: true, message: "KYC application submitted for review" });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to submit KYC", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
