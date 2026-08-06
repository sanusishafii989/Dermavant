import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Doctor, Partner } from "@/models";
import { logAuditAction } from "@/lib/audit-logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const adminUser = await User.findOne({ clerkId: userId });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const body = await request.json();
    const { verificationStatus, notes } = body;

    if (!["verified", "rejected", "pending"].includes(verificationStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid verification status" }, { status: 400 });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ ok: false, error: "Target user not found" }, { status: 404 });
    }

    let roleRecord: any = null;

    if (targetUser.role === "doctor") {
      roleRecord = await Doctor.findOne({ user_id: targetUser._id as any });
      if (roleRecord) {
        roleRecord.status = verificationStatus;
        await roleRecord.save();
      }
    } else if (targetUser.role === "partner") {
      roleRecord = await Partner.findOne({ email: targetUser.email.toLowerCase() });
      if (roleRecord) {
        roleRecord.status = verificationStatus;
        await roleRecord.save();
      }
    }

    // Update main User status accordingly
    if (verificationStatus === "verified") {
      targetUser.status = "active";
    } else if (verificationStatus === "rejected") {
      targetUser.status = "suspended";
    }
    await targetUser.save();

    // Log Audit Event
    await logAuditAction({
      actorId: adminUser._id,
      actorRole: adminUser.role,
      action: verificationStatus === "verified" ? "user_verified" : "user_verification_rejected",
      targetType: targetUser.role === "doctor" ? "Doctor" : targetUser.role === "partner" ? "Partner" : "User",
      targetId: targetUser._id,
      metadata: {
        userName: targetUser.fullName,
        userEmail: targetUser.email,
        role: targetUser.role,
        verificationStatus,
        notes: notes || "",
      },
    });

    return NextResponse.json({
      ok: true,
      message: `Verification status set to ${verificationStatus}`,
      user: {
        _id: targetUser._id.toString(),
        status: targetUser.status,
        verificationStatus,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to update verification status", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
