import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { doctorNavLinks } from "@/lib/portal-nav";
import { connectDB } from "@/lib/db";
import { Appointment, Doctor, Patient, User } from "@/models";
import { ConsultationRoom } from "@/components/doctor/ConsultationRoom";

export const dynamic = "force-dynamic";

export default async function DoctorConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  await connectDB();

  const userDoc = await User.findOne({ clerkId: user.id }).lean();
  if (!userDoc || userDoc.role !== "doctor") redirect("/doctor/dashboard");

  const doctor = await Doctor.findOne({ user_id: userDoc._id as any }).lean();
  if (!doctor) redirect("/doctor/dashboard");

  const appointment = await Appointment.findOne({
    $or: [{ _id: appointmentId }, { appointment_id: appointmentId }],
    doctor_id: doctor._id as any,
  } as any).lean();

  if (!appointment) redirect("/doctor/appointments");

  // Get patient name
  const patient = await Patient.findById(appointment.patient_id as any).lean();
  const patientUser = patient ? await User.findById(patient.user_id as any).lean() : null;

  return (
    <PortalDashboardShell title="Doctor Portal" links={doctorNavLinks}>
      <ConsultationRoom
        appointmentId={appointment._id.toString()}
        patientName={patientUser?.fullName || "Patient"}
        doctorName={userDoc.fullName}
        type={appointment.type as "video" | "voice" | "chat"}
        role="doctor"
      />
    </PortalDashboardShell>
  );
}
