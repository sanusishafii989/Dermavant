import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ensureAdminUser } from "@/lib/ensure-admin-user";
import { User, Doctor, Partner, Patient } from "@/models";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await ensureAdminUser();
    if (!admin.ok) return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
    if (admin.user.clerkId !== userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: any = {};
    if (role && role !== "all") {
      query.role = role;
    }
    if (status && status !== "all") {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    // Map role-specific metadata
    const userIds = users.map((u) => u._id);
    const userEmails = users.map((u) => u.email);

    const [doctors, partners, patients] = await Promise.all([
      Doctor.find({ user_id: { $in: userIds } as any }).lean(),
      Partner.find({ email: { $in: userEmails } }).lean(),
      Patient.find({ user_id: { $in: userIds } as any }).lean(),
    ]);

    const doctorMap = new Map(doctors.map((d) => [d.user_id.toString(), d]));
    const partnerMap = new Map(partners.map((p) => [p.email.toLowerCase(), p]));
    const patientMap = new Map(patients.map((pt) => [pt.user_id.toString(), pt]));

    const enrichedUsers = users.map((u) => {
      const uIdStr = u._id.toString();
      let roleDetails: any = null;

      if (u.role === "doctor") {
        const doc = doctorMap.get(uIdStr);
        if (doc) {
          roleDetails = {
            id: doc._id.toString(),
            specialization: doc.specialization,
            hospital: doc.hospital,
            license_number: doc.license_number,
            verificationStatus: doc.status,
            experience: doc.experience,
            rating: doc.rating,
          };
        }
      } else if (u.role === "partner") {
        const ptn = partnerMap.get(u.email.toLowerCase());
        if (ptn) {
          roleDetails = {
            id: ptn._id.toString(),
            business_name: ptn.business_name,
            owner_name: ptn.owner_name,
            license: ptn.license,
            verificationStatus: ptn.status,
            address: ptn.address,
            rating: ptn.rating,
          };
        }
      } else if (u.role === "patient") {
        const pt = patientMap.get(uIdStr);
        if (pt) {
          roleDetails = {
            id: pt._id.toString(),
            bloodGroup: (pt as any).bloodGroup,
            allergies: (pt as any).allergies,
          };
        }
      }

      return {
        _id: uIdStr,
        clerkId: u.clerkId,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        profilePhoto: u.profilePhoto,
        createdAt: u.createdAt,
        roleDetails,
      };
    });

    return NextResponse.json({ ok: true, users: enrichedUsers });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch users", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
