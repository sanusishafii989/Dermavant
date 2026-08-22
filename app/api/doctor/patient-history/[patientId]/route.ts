import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AIReport, Appointment, Doctor, MedicalRecord, Patient, User } from "@/models";
import type { MedicalHistoryItem, PatientVitalsSummary } from "@/types/history";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { userId } = await auth();
    const { patientId } = await params;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userDoc = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc || (userDoc.role !== "doctor" && userDoc.role !== "admin")) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: Doctor or Admin role required" },
        { status: 403 }
      );
    }

    const patientDoc: any = await Patient.findById(patientId).lean();
    if (!patientDoc) {
      return NextResponse.json({ ok: false, error: "Patient record not found" }, { status: 404 });
    }

    // For doctors: verify they have (or had) an appointment with this patient
    if (userDoc.role === "doctor") {
      const doctorDoc = await Doctor.findOne({ user_id: userDoc._id as any }).lean();
      if (!doctorDoc) {
        return NextResponse.json({ ok: false, error: "Doctor profile not found" }, { status: 404 });
      }

      const hasAppointment = await Appointment.findOne({
        doctor_id: doctorDoc._id,
        patient_id: patientDoc._id,
      } as any).lean();

      if (!hasAppointment) {
        return NextResponse.json(
          { ok: false, error: "You can only view history for patients you have appointments with" },
          { status: 403 }
        );
      }
    }

    const [aiReports, appointments, medicalRecords] = await Promise.all([
      AIReport.find({ patient_id: patientDoc._id, deleted_at: null } as any)
        .sort({ generated_at: -1 })
        .lean(),
      Appointment.find({ patient_id: patientDoc._id, deleted_at: null } as any)
        .populate("doctor_id")
        .sort({ date: -1 })
        .lean(),
      MedicalRecord.find({ patient_id: patientDoc._id, deleted_at: null } as any)
        .sort({ recorded_at: -1 })
        .lean(),
    ]);

    const historyItems: MedicalHistoryItem[] = [];

    for (const r of aiReports) {
      historyItems.push({
        id: `ai_${r._id}`,
        category: "ai_triage",
        title: "AI Dermatological Triage",
        date: r.generated_at ? new Date(r.generated_at).toISOString() : new Date(r.created_at).toISOString(),
        symptoms: r.symptoms_text,
        diagnosis: (r.diagnosis || []).map((d: any) => ({
          condition: d.condition,
          confidence: d.confidence,
          reasoning: d.reasoning,
        })),
        recommendation: r.recommendation,
        confidenceScore: r.confidence_score,
        status: r.needs_immediate_professional_care ? "Needs Urgent Care" : "Normal Triage",
      });
    }

    for (const appt of appointments) {
      const doctor = appt.doctor_id as any;
      historyItems.push({
        id: `appt_${appt._id}`,
        category: "consultation",
        title: `Specialist Consultation (${appt.type})`,
        date: appt.date ? new Date(appt.date).toISOString() : new Date(appt.created_at).toISOString(),
        doctorName: doctor ? `Dr. ${doctor.license_number || "Specialist"}` : "Licensed Specialist",
        doctorSpecialization: doctor?.specialization || "General Practice",
        consultationType: appt.type as any,
        status: appt.consultation_status || "scheduled",
      });
    }

    for (const rec of medicalRecords) {
      historyItems.push({
        id: `rec_${rec._id}`,
        category: rec.record_type === "prescription" ? "prescription" : "consultation",
        title: rec.title || "Clinical Record",
        date: rec.recorded_at ? new Date(rec.recorded_at).toISOString() : new Date(rec.created_at).toISOString(),
        clinicalNotes: rec.clinical_notes,
        diagnosis: rec.diagnosis || [],
        prescriptions: (rec.prescriptions || []).map((p: any) => ({
          medication_name: p.medication_name,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
          instructions: p.instructions,
        })),
        attachments: rec.attachments || [],
      });
    }

    historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const vitals: PatientVitalsSummary = {
      bloodGroup: patientDoc.blood_group || "O+",
      allergies: patientDoc.allergies || [],
      height: patientDoc.height,
      weight: patientDoc.weight,
      bloodPressure: patientDoc.blood_pressure || "120/80 mmHg",
      chronicConditions: patientDoc.chronic_conditions || [],
      currentMedications: patientDoc.current_medications || [],
      pastSurgeries: patientDoc.past_surgeries || [],
      emergencyContact: patientDoc.emergency_contact,
    };

    return NextResponse.json({
      ok: true,
      items: historyItems,
      vitals,
    });
  } catch (error: any) {
    console.error("[DOCTOR PATIENT HISTORY API] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch patient history", details: error?.message },
      { status: 500 }
    );
  }
}
