import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
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
    const { status, reason } = body;

    if (!["active", "suspended", "pending_verification"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status value" }, { status: 400 });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ ok: false, error: "Target user not found" }, { status: 404 });
    }

    const previousStatus = targetUser.status;
    targetUser.status = status;
    await targetUser.save();

    // Try updating Clerk metadata status
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(targetUser.clerkId, {
        publicMetadata: {
          role: targetUser.role,
          accountStatus: status,
        },
      });
    } catch (clerkErr) {
      console.warn("[CLERK METADATA SYNC WARNING]", clerkErr);
    }

    // Write Audit Log
    await logAuditAction({
      actorId: adminUser._id,
      actorRole: adminUser.role,
      action: status === "suspended" ? "user_suspended" : "user_reactivated",
      targetType: "User",
      targetId: targetUser._id,
      metadata: {
        previousStatus,
        newStatus: status,
        userEmail: targetUser.email,
        userName: targetUser.fullName,
        reason: reason || "Admin panel action",
      },
    });

    return NextResponse.json({
      ok: true,
      message: `User status updated to ${status}`,
      user: {
        _id: targetUser._id.toString(),
        status: targetUser.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to update user status", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
