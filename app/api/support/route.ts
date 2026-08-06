import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, SupportTicket } from "@/models";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User record not found" }, { status: 404 });
    }

    const body = await request.json();
    const { subject, category, message, priority } = body;

    if (!subject || !message) {
      return NextResponse.json({ ok: false, error: "Subject and message are required" }, { status: 400 });
    }

    const ticket = await SupportTicket.create({
      userId: user._id,
      subject: subject.trim(),
      category: category || "general",
      message: message.trim(),
      priority: priority || "medium",
      status: "open",
    });

    return NextResponse.json({
      ok: true,
      message: "Support ticket created successfully",
      ticket: {
        id: ticket._id.toString(),
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to submit support ticket", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
