import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, AuditLog } from "@/models";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const adminUser = await User.findOne({ clerkId: userId }).lean();
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

    const query: any = {};
    if (action && action !== "all") {
      query.action = action;
    }

    const logs = await AuditLog.find(query)
      .populate({ path: "actorId", select: "fullName email role" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const formattedLogs = logs.map((log: any) => ({
      _id: log._id.toString(),
      actorRole: log.actorRole,
      action: log.action,
      targetType: log.targetType || null,
      targetId: log.targetId ? log.targetId.toString() : null,
      metadata: log.metadata || {},
      createdAt: log.createdAt,
      actor: log.actorId
        ? {
            _id: log.actorId._id?.toString(),
            fullName: log.actorId.fullName,
            email: log.actorId.email,
            role: log.actorId.role,
          }
        : null,
    }));

    return NextResponse.json({ ok: true, logs: formattedLogs });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch audit logs", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
