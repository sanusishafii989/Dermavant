import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, SupportTicket } from "@/models";

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
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const query: any = {};
    if (status && status !== "all") query.status = status;
    if (category && category !== "all") query.category = category;

    const tickets = await SupportTicket.find(query)
      .populate({ path: "userId", select: "fullName email role phone" })
      .sort({ createdAt: -1 })
      .lean();

    const formattedTickets = tickets.map((t: any) => ({
      _id: t._id.toString(),
      subject: t.subject,
      category: t.category,
      message: t.message,
      priority: t.priority,
      status: t.status,
      adminResponse: t.adminResponse || null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      resolvedAt: t.resolvedAt || null,
      user: t.userId
        ? {
            _id: t.userId._id?.toString(),
            fullName: t.userId.fullName,
            email: t.userId.email,
            role: t.userId.role,
            phone: t.userId.phone,
          }
        : null,
    }));

    return NextResponse.json({ ok: true, tickets: formattedTickets });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to fetch support tickets", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
