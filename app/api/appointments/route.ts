import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Appointment, Doctor, Patient, User } from "@/models";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const doctorId = body.doctorId || body.doctor_id;
    const date = body.date;
    const time = body.time;
    const type = body.type || "video";

    if (!doctorId || !date || !time) {
      return NextResponse.json(
        { ok: false, error: "doctorId, date, and time are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ ok: false, error: "Could not resolve current user" }, { status: 401 });
    }

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "Patient account not found" }, { status: 404 });
    }

    const patientDoc = await Patient.findOne({ user_id: userDoc._id as any }).lean();
    if (!patientDoc) {
      return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
    }

    const doctorDoc = await Doctor.findById(doctorId as any).lean();
    if (!doctorDoc) {
      return NextResponse.json({ ok: false, error: "Doctor not found" }, { status: 404 });
    }

    const appointment = await Appointment.create({
      patient_id: patientDoc._id,
      doctor_id: doctorDoc._id,
      date: new Date(date),
      time,
      type,
      payment_status: "pending",
      consultation_status: "scheduled",
      meeting_link: "",
    } as any);

    return NextResponse.json(
      {
        ok: true,
        appointmentId: appointment.appointment_id,
        appointment: {
          id: appointment._id.toString(),
          date: appointment.date,
          time: appointment.time,
          payment_status: appointment.payment_status,
          consultation_status: appointment.consultation_status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to create appointment",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
