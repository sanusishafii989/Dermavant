import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/models";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const contact = await ContactMessage.create({
      name,
      email,
      subject: subject || "",
      message,
    } as any);

    return NextResponse.json({
      ok: true,
      message: "Message received. We'll get back to you soon.",
      id: contact._id.toString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to send message", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}