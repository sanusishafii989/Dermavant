import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AIReport, Appointment, MedicalRecord, Patient, User } from "@/models";
import type { MedicalHistoryItem, PatientVitalsSummary } from "@/types/history";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let userDoc: any = await User.findOne({ clerkId: userId }).lean();
    if (!userDoc) {
      const createdUser = await User.create({
        clerkId: userId,
        fullName: "Aetheris Patient",
        email: `${userId}@example.com`,
        role: "patient",
        status: "pending_verification",
      } as any);
      userDoc = createdUser.toObject();
    }

    let patientDoc: any = await Patient.findOne({ user_id: userDoc._id } as any).lean();
    if (!patientDoc) {
      const createdPatient = await Patient.create({ user_id: userDoc._id } as any);
      patientDoc = createdPatient.toObject();
    }

    const patientObjectId = patientDoc._id;

    const [aiReports, appointments, medicalRecords] = await Promise.all([
      AIReport.find({ patient_id: patientObjectId, deleted_at: null } as any)
        .sort({ generated_at: -1 })
        .lean(),
      Appointment.find({ patient_id: patientObjectId, deleted_at: null } as any)
        .populate("doctor_id")
        .sort({ date: -1 })
        .lean(),
      MedicalRecord.find({ patient_id: patientObjectId, deleted_at: null } as any)
        .sort({ recorded_at: -1 })
        .lean(),
    ]);

    const historyItems: MedicalHistoryItem[] = [];

    // 1. Map AI Reports
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

    // 2. Map Doctor Appointments
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

    // 3. Map Medical Records / Prescriptions
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

    // Sort all history items descending by date
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
    console.error("[MEDICAL HISTORY API] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to retrieve medical history", details: error?.message },
      { status: 500 }
    );
  }
}
