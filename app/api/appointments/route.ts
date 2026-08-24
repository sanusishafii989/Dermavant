import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Appointment, Doctor, Patient, User } from "@/models";

const VALID_CONSULTATION_STATUSES = ["scheduled", "completed", "cancelled", "no_show"] as const;
type ConsultationStatus = (typeof VALID_CONSULTATION_STATUSES)[number];

function isConsultationStatus(value: string): value is ConsultationStatus {
  return (VALID_CONSULTATION_STATUSES as readonly string[]).includes(value);
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    let appointments: any[] = [];

    if (userDoc.role === "doctor") {
      const doctor = await Doctor.findOne({ user_id: userDoc._id as any }).lean();
      if (!doctor) {
        return NextResponse.json({ ok: false, error: "Doctor profile not found" }, { status: 404 });
      }

      appointments = await Appointment.find({ doctor_id: doctor._id } as any)
        .sort({ date: 1 })
        .lean();

      const patientIds = [...new Set(appointments.map((apt) => apt.patient_id?.toString()))];
      const patients = await Patient.find({ _id: { $in: patientIds } }).lean();
      const patientUserIds = [...new Set(patients.map((p) => p.user_id?.toString()))];
      const patientUsers = await User.find({ _id: { $in: patientUserIds } }).lean();
      const userMap = new Map(patientUsers.map((u) => [u._id.toString(), u]));
      const patientMap = new Map(patients.map((p) => [p._id.toString(), p]));

      appointments = appointments.map((apt) => {
        const patient = patientMap.get(apt.patient_id?.toString());
        const patientUser = patient ? userMap.get(patient.user_id?.toString()) : null;
        return {
          ...apt,
          _id: apt._id.toString(),
          patient_name: patientUser?.fullName || "Unknown patient",
          patient_email: patientUser?.email || "",
          doctor_name: userDoc.fullName,
          doctor_specialization: doctor.specialization,
        };
      });
    } else if (userDoc.role === "patient") {
      const patient = await Patient.findOne({ user_id: userDoc._id as any }).lean();
      if (!patient) {
        return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
      }

      appointments = await Appointment.find({ patient_id: patient._id } as any)
        .sort({ date: 1 })
        .lean();

      const doctorIds = [...new Set(appointments.map((apt) => apt.doctor_id?.toString()))];
      const doctors = await Doctor.find({ _id: { $in: doctorIds } }).lean();
      const doctorUserIds = [...new Set(doctors.map((d) => d.user_id?.toString()))];
      const doctorUsers = await User.find({ _id: { $in: doctorUserIds } }).lean();
      const userMap = new Map(doctorUsers.map((u) => [u._id.toString(), u]));
      const doctorMap = new Map(doctors.map((d) => [d._id.toString(), d]));

      appointments = appointments.map((apt) => {
        const doctor = doctorMap.get(apt.doctor_id?.toString());
        const doctorUser = doctor ? userMap.get(doctor.user_id?.toString()) : null;
        return {
          ...apt,
          _id: apt._id.toString(),
          doctor_name: doctorUser?.fullName || "Unknown doctor",
          doctor_specialization: doctor?.specialization || "General Practice",
          doctor_hospital: doctor?.hospital || "",
          patient_name: userDoc.fullName,
        };
      });
    } else {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, appointments });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to load appointments", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { appointmentId, consultation_status } = body;

    if (!appointmentId) {
      return NextResponse.json({ ok: false, error: "appointmentId is required" }, { status: 400 });
    }

    if (!consultation_status || !isConsultationStatus(consultation_status)) {
      return NextResponse.json(
        { ok: false, error: `consultation_status must be one of: ${VALID_CONSULTATION_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    if (userDoc.role !== "doctor" && userDoc.role !== "patient") {
      return NextResponse.json({ ok: false, error: "Only doctors or patients can update appointments" }, { status: 403 });
    }

    const query: any = { $or: [{ _id: appointmentId }, { appointment_id: appointmentId }] };

    if (userDoc.role === "doctor") {
      const doctor = await Doctor.findOne({ user_id: userDoc._id as any }).lean();
      if (!doctor) {
        return NextResponse.json({ ok: false, error: "Doctor profile not found" }, { status: 404 });
      }
      query.doctor_id = doctor._id as any;
    } else {
      const patient = await Patient.findOne({ user_id: userDoc._id as any }).lean();
      if (!patient) {
        return NextResponse.json({ ok: false, error: "Patient profile not found" }, { status: 404 });
      }
      query.patient_id = patient._id as any;
    }

    const appointment = await Appointment.findOneAndUpdate(
      query,
      { $set: { consultation_status } },
      { new: true }
    ).lean();

    if (!appointment) {
      return NextResponse.json({ ok: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, appointment });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to update appointment", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

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

    // Validate date is in the future
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return NextResponse.json({ ok: false, error: "Invalid date format" }, { status: 400 });
    }
    if (appointmentDate <= new Date()) {
      return NextResponse.json({ ok: false, error: "Appointment date must be in the future" }, { status: 400 });
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

    // Prevent double-booking: check if doctor already has a non-cancelled appointment at this slot
    const existingAppointment = await Appointment.findOne({
      doctor_id: doctorDoc._id,
      date: appointmentDate,
      time,
      consultation_status: { $ne: "cancelled" },
    } as any).lean();

    if (existingAppointment) {
      return NextResponse.json(
        { ok: false, error: "This time slot is already booked. Please choose another time." },
        { status: 409 }
      );
    }

    const appointment = await Appointment.create({
      patient_id: patientDoc._id,
      doctor_id: doctorDoc._id,
      date: appointmentDate,
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
