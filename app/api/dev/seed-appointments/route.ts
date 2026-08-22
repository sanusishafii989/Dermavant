import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Appointment, Doctor, Patient, User } from "@/models";

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "Dev endpoints are disabled in production" }, { status: 403 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const adminDoc = await User.findOne({ clerkId: userId }).lean();
    if (!adminDoc || adminDoc.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const clerkId = body.clerkId;

    if (!clerkId) {
      return NextResponse.json({ ok: false, error: "clerkId is required" }, { status: 400 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId }).lean();
    if (!userDoc || userDoc.role !== "doctor") {
      return NextResponse.json({ ok: false, error: "Doctor not found" }, { status: 404 });
    }

    const doctor = await Doctor.findOne({ user_id: userDoc._id as any }).lean();
    if (!doctor) {
      return NextResponse.json({ ok: false, error: "Doctor profile not found" }, { status: 404 });
    }

    // Find or create a test patient
    let patientUser = await User.findOne({ role: "patient" }).lean();
    let patient: any = null;

    if (patientUser) {
      patient = await Patient.findOne({ user_id: patientUser._id as any }).lean();
    }

    if (!patient) {
      // Create a test patient user
      patientUser = await User.create({
        clerkId: `dev_patient_${Date.now()}`,
        fullName: "Test Patient",
        email: `testpatient_${Date.now()}@aetheris.health`,
        role: "patient",
        status: "active",
      } as any);
      patient = await Patient.create({ user_id: patientUser._id } as any);
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const types = ["video", "voice", "chat"] as const;

    const appointments = await Appointment.insertMany([
      {
        patient_id: patient._id,
        doctor_id: doctor._id,
        date: tomorrow,
        time: "10:00",
        type: "video",
        payment_status: "paid",
        consultation_status: "scheduled",
      },
      {
        patient_id: patient._id,
        doctor_id: doctor._id,
        date: tomorrow,
        time: "14:00",
        type: "voice",
        payment_status: "paid",
        consultation_status: "scheduled",
      },
      {
        patient_id: patient._id,
        doctor_id: doctor._id,
        date: nextWeek,
        time: "09:00",
        type: "chat",
        payment_status: "pending",
        consultation_status: "scheduled",
      },
      {
        patient_id: patient._id,
        doctor_id: doctor._id,
        date: yesterday,
        time: "11:00",
        type: "video",
        payment_status: "paid",
        consultation_status: "completed",
      },
    ] as any);

    return NextResponse.json({
      ok: true,
      message: "Seeded 4 appointments (video, voice, chat, and a completed one)",
      appointments: appointments.map((a: any) => ({
        id: a._id.toString(),
        type: a.type,
        date: a.date,
        time: a.time,
        status: a.consultation_status,
        payment: a.payment_status,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to seed appointments", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
