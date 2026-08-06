import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, SupportTicket } from "@/models";
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

    const { id: ticketId } = await params;
    const body = await request.json();
    const { status, adminResponse } = body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ ok: false, error: "Support ticket not found" }, { status: 404 });
    }

    if (status && ["open", "in_progress", "resolved", "closed"].includes(status)) {
      ticket.status = status;
      if (status === "resolved" || status === "closed") {
        ticket.resolvedAt = new Date();
      }
    }

    if (adminResponse && typeof adminResponse === "string") {
      ticket.adminResponse = adminResponse.trim();
      ticket.respondedBy = adminUser._id;
    }

    await ticket.save();

    // Audit log action
    await logAuditAction({
      actorId: adminUser._id,
      actorRole: adminUser.role,
      action: status === "resolved" ? "support_ticket_resolved" : "support_ticket_updated",
      targetType: "SupportTicket",
      targetId: ticket._id,
      metadata: {
        ticketId: ticket._id.toString(),
        subject: ticket.subject,
        status: ticket.status,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Ticket updated successfully",
      ticket: {
        _id: ticket._id.toString(),
        status: ticket.status,
        adminResponse: ticket.adminResponse,
        resolvedAt: ticket.resolvedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to update support ticket", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
