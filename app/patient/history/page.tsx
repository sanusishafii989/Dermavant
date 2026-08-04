import { redirect } from "next/navigation";

export default function PatientHistoryRedirect() {
  redirect("/patient/dashboard/medical-history");
}
