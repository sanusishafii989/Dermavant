import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { patientNavLinks } from "@/lib/portal-nav";
import { connectDB } from "@/lib/db";
import { Appointment, Doctor, Patient, User } from "@/models";
import { ConsultationRoom } from "@/components/doctor/ConsultationRoom";

export const dynamic = "force-dynamic";

export default async function PatientConsultationRoomPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  await connectDB();

  const userDoc = await User.findOne({ clerkId: user.id }).lean();
  if (!userDoc || userDoc.role !== "patient") redirect("/patient/dashboard");

  const patient = await Patient.findOne({ user_id: userDoc._id as any }).lean();
  if (!patient) redirect("/patient/dashboard");

  const appointment = await Appointment.findOne({
    $or: [{ _id: appointmentId }, { appointment_id: appointmentId }],
    patient_id: patient._id as any,
  } as any).lean();

  if (!appointment) redirect("/patient/consultation");

  const doctor = await Doctor.findById(appointment.doctor_id as any).lean();
  const doctorUser = doctor ? await User.findById(doctor.user_id as any).lean() : null;

  return (
    <PortalDashboardShell title="Patient Portal" links={patientNavLinks}>
      <ConsultationRoom
        appointmentId={appointment._id.toString()}
        patientName={userDoc.fullName}
        doctorName={doctorUser?.fullName || "Doctor"}
        type={appointment.type as "video" | "voice" | "chat"}
        role="patient"
      />
    </PortalDashboardShell>
  );
}