import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, KYCApplication, Doctor, Partner } from "@/models";
import { logAuditAction } from "@/lib/audit-logger";

export const dynamic = "force-dynamic";

// GET — list all KYC applications (optionally filtered by status)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const adminUser = await User.findOne({ clerkId: userId }).lean();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");

    const query: any = {};
    if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
      query.status = statusFilter;
    }

    const applications = await KYCApplication.find(query)
      .sort({ submitted_at: -1 })
      .lean();

    // Enrich with user info
    const userIds = applications.map((app) => app.user_id);
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const enriched = applications.map((app) => {
      const u = userMap.get(app.user_id?.toString());
      return {
        _id: app._id.toString(),
        status: app.status,
        role: app.role,
        submitted_at: app.submitted_at,
        reviewed_at: app.reviewed_at,
        review_notes: app.review_notes,
        // Doctor fields
        license_number: app.license_number,
        specialization: app.specialization,
        hospital: app.hospital,
        years_of_experience: app.years_of_experience,
        medical_school: app.medical_school,
        // Pharmacy fields
        business_name: app.business_name,
        business_registration_number: app.business_registration_number,
        pharmacist_license: app.pharmacist_license,
        // Shared
        phone_number: app.phone_number,
        address: app.address,
        id_document_url: app.id_document_url,
        license_document_url: app.license_document_url,
        // User info
        user: u ? {
          _id: u._id.toString(),
          fullName: u.fullName,
          email: u.email,
          clerkId: u.clerkId,
          profilePhoto: u.profilePhoto,
          userStatus: u.status,
        } : null,
      };
    });

    return NextResponse.json({ ok: true, applications: enriched });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to load KYC applications", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

// PATCH — approve or reject a KYC application
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const adminUser = await User.findOne({ clerkId: userId });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId: targetUserId, status, notes } = body;

    if (!targetUserId || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ ok: false, error: "userId and status (approved/rejected) are required" }, { status: 400 });
    }

    const application = await KYCApplication.findOne({ user_id: targetUserId as any });
    if (!application) {
      return NextResponse.json({ ok: false, error: "KYC application not found" }, { status: 404 });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Update KYC application
    application.status = status;
    application.reviewed_by = adminUser._id;
    application.reviewed_at = new Date();
    application.review_notes = notes || "";
    await application.save();

    // Update role-specific profile
    if (status === "approved") {
      targetUser.status = "active";
      await targetUser.save();

      if (targetUser.role === "doctor") {
        await Doctor.updateOne(
          { user_id: targetUser._id as any },
          { $set: { status: "verified" } }
        ).exec();
      } else if (targetUser.role === "partner") {
        await Partner.updateOne(
          { email: targetUser.email.toLowerCase() },
          { $set: { status: "verified" } }
        ).exec();
      }
    } else if (status === "rejected") {
      targetUser.status = "suspended";
      await targetUser.save();

      if (targetUser.role === "doctor") {
        await Doctor.updateOne(
          { user_id: targetUser._id as any },
          { $set: { status: "rejected" } }
        ).exec();
      } else if (targetUser.role === "partner") {
        await Partner.updateOne(
          { email: targetUser.email.toLowerCase() },
          { $set: { status: "rejected" } }
        ).exec();
      }
    }

    await logAuditAction({
      actorId: adminUser._id,
      actorRole: adminUser.role,
      action: status === "approved" ? "kyc_approved" : "kyc_rejected",
      targetType: "KYCApplication",
      targetId: targetUser._id,
      metadata: {
        userName: targetUser.fullName,
        userEmail: targetUser.email,
        role: targetUser.role,
        reviewNotes: notes || "",
      },
    });

    return NextResponse.json({
      ok: true,
      message: `KYC ${status}`,
      application: {
        status: application.status,
        reviewed_at: application.reviewed_at,
        review_notes: application.review_notes,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to update KYC status", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
